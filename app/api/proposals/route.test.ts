import { beforeEach, describe, expect, it, vi } from "vitest";
import { idOf, testCatalog } from "@/lib/package/test-catalog";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/catalog/get-catalog", () => ({ getCatalog: vi.fn(async () => testCatalog) }));
vi.mock("@/lib/proposales", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/proposales")>()),
  resolveCompanyId: vi.fn(async () => 7),
  createProposal: vi.fn(async () => ({ uuid: "abc", url: "https://app.proposales.com/abc" })),
  searchProposals: vi.fn(async () => []),
}));

const { POST } = await import("./route");
const { createProposal, ProposalesError } = await import("@/lib/proposales");
const createProposalMock = vi.mocked(createProposal);

const request = {
  templateId: "conference",
  basics: { guests: 45, startDate: "2026-10-14", endDate: "2026-10-15" },
  currency: "SEK",
  addedContentIds: [],
  removedContentIds: [],
  overrides: {},
  customer: {
    company: "Acme AB",
    contactName: "Anna Berg",
    contactEmail: "anna@acme.example",
    notes: "",
  },
};

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/proposals", { method: "POST", body: JSON.stringify(body) }),
  );
}

beforeEach(() => {
  createProposalMock.mockClear();
});

describe("POST /api/proposals", () => {
  it("creates the draft from the package rebuilt on the server", async () => {
    const response = await post(request);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      uuid: "abc",
      url: "https://app.proposales.com/abc",
      title: "Full-day conference for Acme AB, 14–15 Oct 2026",
      subtotal: 6_900_000,
      currency: "SEK",
    });
    expect(createProposalMock.mock.calls[0][0].data?.subtotal).toBe(6_900_000);
  });

  it("sends block prices after discount, so Proposales can total the draft", async () => {
    await post(request);

    const blocks = createProposalMock.mock.calls[0][0].blocks ?? [];
    const total = blocks.reduce(
      (sum, block) => sum + block.quantity * (block.unit_value_with_discount_without_tax ?? 0),
      0,
    );
    expect(total).toBe(6_900_000);
  });

  it("prices the draft from the price list of the chosen currency", async () => {
    const response = await post({ ...request, currency: "EUR" });

    // Harbour Room 2 × 1,560, coffee 90 × 8.50, lunch 90 × 21, projector 2 × 105 euros.
    expect(await response.json()).toMatchObject({ subtotal: 598_500, currency: "EUR" });
    const input = createProposalMock.mock.calls[0][0];
    expect(input.data).toMatchObject({ currency: "EUR", subtotal: 598_500 });
    expect(input.blocks?.every((block) => block.currency === "EUR")).toBe(true);
  });

  it("refuses a currency without a price list", async () => {
    const response = await post({ ...request, currency: "JPY" });

    expect(response.status).toBe(400);
    expect(createProposalMock).not.toHaveBeenCalled();
  });

  it("applies overrides to the recalculated total", async () => {
    const response = await post({ ...request, overrides: { [idOf("Coffee break")]: 45 } });

    expect((await response.json()).subtotal).toBe(6_900_000 - 45 * 9_500);
  });

  it("refuses totals or prices sent from the browser, without calling Proposales", async () => {
    const response = await post({ ...request, subtotal: 100 });

    expect(response.status).toBe(400);
    expect(createProposalMock).not.toHaveBeenCalled();
  });

  it("refuses invalid customer details with the field's message", async () => {
    const response = await post({ ...request, customer: { ...request.customer, contactEmail: "x" } });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Enter a valid email address." });
  });

  it("refuses an empty package", async () => {
    const allIds = testCatalog.map((item) => item.contentId);
    const response = await post({ ...request, removedContentIds: allIds });

    expect(response.status).toBe(400);
    expect(createProposalMock).not.toHaveBeenCalled();
  });

  it("refuses more than the hotel has, without calling Proposales", async () => {
    const response = await post({ ...request, overrides: { [idOf("Harbour Room")]: 3 } });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Harbour Room: At most 2 for these dates, you have 3.",
    });
    expect(createProposalMock).not.toHaveBeenCalled();
  });

  it("refuses a meeting space too small for the guests", async () => {
    const response = await post({ ...request, basics: { ...request.basics, guests: 200 } });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Grand Hall: Seats 150, you need 200." });
    expect(createProposalMock).not.toHaveBeenCalled();
  });

  it("shows a fixed message instead of the Proposales text when creating fails", async () => {
    createProposalMock.mockRejectedValueOnce(
      new ProposalesError("http", "Invalid request for company 7", { status: 400 }),
    );

    const response = await post(request);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Proposales refused the request." });
  });
});
