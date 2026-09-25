import { describe, expect, it, vi } from "vitest";
import { assemblePackage, summarize } from "@/lib/package";
import { idOf, testCatalog } from "@/lib/package/test-catalog";
import type { Currency } from "@/lib/money";
import type { CustomerDetails } from "@/lib/schemas/customer";
import { getTemplate, type Template } from "@/lib/templates";

vi.mock("server-only", () => ({}));

const { buildCreateProposalInput, splitName } = await import("./mapping");
const { createProposalInputSchema } = await import("./schemas");

const conference = getTemplate("conference") as Template;
const basics = { guests: 45, startDate: "2026-10-14", endDate: "2026-10-15" };
const customer: CustomerDetails = {
  company: "Acme AB",
  contactName: "Anna Berg",
  contactEmail: "anna@acme.example",
};
const noChanges = { addedContentIds: [], removedContentIds: [], overrides: {} };

function build(overrides: Partial<typeof noChanges> = {}, details = customer, currency: Currency = "SEK") {
  const choices = { ...noChanges, ...overrides };
  const lines = assemblePackage(conference, basics, testCatalog, choices, currency);
  return buildCreateProposalInput({
    companyId: 7,
    template: conference,
    basics,
    currency,
    lines,
    summary: summarize(lines, basics),
    customer: details,
  });
}

describe("buildCreateProposalInput", () => {
  it("maps the conference for 45 guests over 2 days to one product block per line", () => {
    const input = build();

    expect(input.blocks).toEqual([
      block("Harbour Room", 2, 1_800_000),
      block("Coffee break", 90, 9_500),
      block("Conference lunch", 90, 24_500),
      block("Projector and screen", 2, 120_000),
    ]);
  });

  it("sends every block and the stored subtotal in the chosen currency", () => {
    const input = build({}, customer, "GBP");

    expect(input.blocks).toEqual([
      block("Harbour Room", 2, 135_000, "GBP"),
      block("Coffee break", 90, 700, "GBP"),
      block("Conference lunch", 90, 1_800, "GBP"),
      block("Projector and screen", 2, 8_900, "GBP"),
    ]);
    expect(input.data).toMatchObject({ currency: "GBP", subtotal: 2 * 135_000 + 90 * 700 + 90 * 1_800 + 2 * 8_900 });
  });

  it("titles the proposal and addresses the customer", () => {
    const input = build();

    expect(input).toMatchObject({
      company_id: 7,
      language: "en",
      title_md: "Full-day conference for Acme AB, 14–15 Oct 2026",
      recipient: {
        first_name: "Anna",
        last_name: "Berg",
        email: "anna@acme.example",
        company_name: "Acme AB",
      },
    });
    expect(input.description_md).toContain("- **Guests:** 45");
    expect(input.description_md).toContain("14–15 Oct 2026 (2 days)");
    expect(input.description_md).toContain("All prices exclude tax.");
  });

  it("stores the event and the recalculated subtotal as metadata, without notes when empty", () => {
    expect(build().data).toEqual({
      source: "event-package-builder",
      template_id: "conference",
      event_type: "conference",
      guests: 45,
      start_date: "2026-10-14",
      end_date: "2026-10-15",
      currency: "SEK",
      subtotal: 6_900_000,
    });
  });

  it("keeps notes internal, in the metadata and not the description", () => {
    const input = build({}, { ...customer, notes: "Vegetarian lunch for 5" });
    expect(input.data?.notes).toBe("Vegetarian lunch for 5");
    expect(input.description_md).not.toContain("Vegetarian");
  });

  it("uses overridden quantities and leaves out lines set to zero", () => {
    const input = build({
      overrides: { [idOf("Coffee break")]: 0, [idOf("Conference lunch")]: 50 },
    });

    expect(input.blocks?.map((entry) => [entry.title, entry.quantity])).toEqual([
      ["Harbour Room", 2],
      ["Conference lunch", 50],
      ["Projector and screen", 2],
    ]);
    expect(input.data?.subtotal).toBe(3_600_000 + 50 * 24_500 + 240_000);
  });

  it("produces a request that passes the Create Proposal schema", () => {
    expect(createProposalInputSchema.safeParse(build()).success).toBe(true);
  });
});

describe("splitName", () => {
  it("uses a single word as the first name", () => {
    expect(splitName(" Anna ")).toEqual({ first_name: "Anna" });
  });

  it("puts everything after the first word in the last name", () => {
    expect(splitName("Anna  Maria Berg")).toEqual({ first_name: "Anna", last_name: "Maria Berg" });
  });
});

function block(title: string, quantity: number, unitPrice: number, currency: Currency = "SEK") {
  return {
    type: "product-block",
    content_id: idOf(title),
    title,
    currency,
    quantity,
    unit_value_without_discount_without_tax: unitPrice,
  };
}
