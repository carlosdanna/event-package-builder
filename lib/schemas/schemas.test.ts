import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eventBasicsDraftSchema, eventBasicsSchema, todayIsoDate } from "./event-basics";
import { customerDetailsDraftSchema, emptyCustomerDetailsDraft } from "./customer";
import { MAX_QUANTITY, packageSelectionSchema } from "./package-selection";
import { createProposalRequestSchema } from "./proposal";

const draft = { guests: "40", startDate: "2026-10-14", endDate: "2026-10-15", budget: "" };

// The draft schema refuses past start dates, so the tests run on a fixed day.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 1, 12));
});
afterAll(() => {
  vi.useRealTimers();
});

function firstMessage(result: { error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message;
}

describe("eventBasicsSchema", () => {
  it("allows at most 500 guests", () => {
    const basics = { startDate: "2026-10-14", endDate: "2026-10-14" };
    expect(eventBasicsSchema.safeParse({ guests: 500, ...basics }).success).toBe(true);
    expect(eventBasicsSchema.safeParse({ guests: 501, ...basics }).success).toBe(false);
  });

  it("allows events of at most 30 days", () => {
    const thirtyDays = { guests: 10, startDate: "2026-10-01", endDate: "2026-10-30" };
    expect(eventBasicsSchema.safeParse(thirtyDays).success).toBe(true);
    const result = eventBasicsSchema.safeParse({ ...thirtyDays, endDate: "2026-10-31" });
    expect(result.error?.issues[0]).toMatchObject({
      path: ["endDate"],
      message: "An event can last at most 30 days.",
    });
  });

  it("accepts past dates, so a draft can be created for any date", () => {
    const past = { guests: 10, startDate: "2020-01-01", endDate: "2020-01-02" };
    expect(eventBasicsSchema.safeParse(past).success).toBe(true);
  });
});

describe("todayIsoDate", () => {
  it("formats the local calendar date", () => {
    expect(todayIsoDate(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});

describe("eventBasicsDraftSchema", () => {
  it("reads the typed fields into basics and no budget", () => {
    expect(eventBasicsDraftSchema.parse(draft)).toEqual({
      basics: { guests: 40, startDate: "2026-10-14", endDate: "2026-10-15" },
      budget: null,
    });
  });

  it("reads the budget in whole units as the smallest unit, allowing spaces and commas", () => {
    expect(eventBasicsDraftSchema.parse({ ...draft, budget: "120,000" }).budget).toBe(
      12_000_000,
    );
    expect(eventBasicsDraftSchema.parse({ ...draft, budget: " 50 000 " }).budget).toBe(
      5_000_000,
    );
  });

  it("asks for the guest count when it is empty", () => {
    const result = eventBasicsDraftSchema.safeParse({ ...draft, guests: "" });
    expect(firstMessage(result)).toBe("Enter the number of guests.");
  });

  it("rejects guest counts outside 1 to 500", () => {
    expect(eventBasicsDraftSchema.safeParse({ ...draft, guests: "0" }).success).toBe(false);
    expect(eventBasicsDraftSchema.safeParse({ ...draft, guests: "501" }).success).toBe(false);
    expect(eventBasicsDraftSchema.safeParse({ ...draft, guests: "2.5" }).success).toBe(false);
  });

  it("asks for missing dates", () => {
    const result = eventBasicsDraftSchema.safeParse({ ...draft, startDate: "" });
    expect(firstMessage(result)).toBe("Pick a start date.");
  });

  it("rejects an end date before the start date", () => {
    const result = eventBasicsDraftSchema.safeParse({ ...draft, endDate: "2026-10-13" });
    expect(result.error?.issues[0]).toMatchObject({
      path: ["endDate"],
      message: "The end date cannot be before the start date.",
    });
  });

  it("rejects a start date in the past but allows today", () => {
    const result = eventBasicsDraftSchema.safeParse({ ...draft, startDate: "2026-09-30" });
    expect(result.error?.issues[0]).toMatchObject({
      path: ["startDate"],
      message: "The start date cannot be in the past.",
    });
    const today = { ...draft, startDate: "2026-10-01", endDate: "2026-10-01" };
    expect(eventBasicsDraftSchema.safeParse(today).success).toBe(true);
  });

  it("rejects an event longer than 30 days", () => {
    const result = eventBasicsDraftSchema.safeParse({ ...draft, endDate: "2026-11-30" });
    expect(firstMessage(result)).toBe("An event can last at most 30 days.");
  });

  it("rejects a budget that is not a positive whole number", () => {
    expect(eventBasicsDraftSchema.safeParse({ ...draft, budget: "abc" }).success).toBe(
      false,
    );
    expect(eventBasicsDraftSchema.safeParse({ ...draft, budget: "0" }).success).toBe(false);
    expect(eventBasicsDraftSchema.safeParse({ ...draft, budget: "12.5" }).success).toBe(
      false,
    );
  });
});

describe("packageSelectionSchema", () => {
  const selection = {
    templateId: "conference",
    basics: { guests: 40, startDate: "2026-10-14", endDate: "2026-10-15" },
    currency: "EUR",
    budget: null,
    addedContentIds: [3],
    removedContentIds: [],
    overrides: { "4": 12 },
  };

  it("accepts a selection sent as JSON, with numeric keys for overrides", () => {
    const parsed = packageSelectionSchema.parse(JSON.parse(JSON.stringify(selection)));
    expect(parsed.overrides).toEqual({ 4: 12 });
  });

  it("rejects negative override quantities and unknown templates", () => {
    expect(
      packageSelectionSchema.safeParse({ ...selection, overrides: { "4": -1 } }).success,
    ).toBe(false);
    expect(packageSelectionSchema.safeParse({ ...selection, templateId: "gala" }).success).toBe(
      false,
    );
  });

  it("caps quantities and the number of changed items", () => {
    const at = (quantity: number) => ({ ...selection, overrides: { "4": quantity } });
    expect(packageSelectionSchema.safeParse(at(MAX_QUANTITY)).success).toBe(true);
    expect(packageSelectionSchema.safeParse(at(MAX_QUANTITY + 1)).success).toBe(false);

    const manyIds = Array.from({ length: 101 }, (_, index) => index + 1);
    expect(
      packageSelectionSchema.safeParse({ ...selection, addedContentIds: manyIds }).success,
    ).toBe(false);
    const manyOverrides = Object.fromEntries(manyIds.map((id) => [String(id), 1]));
    expect(
      packageSelectionSchema.safeParse({ ...selection, overrides: manyOverrides }).success,
    ).toBe(false);
  });
});

describe("customerDetailsDraftSchema", () => {
  const customer = {
    company: " Acme AB ",
    contactName: "Anna Berg",
    contactEmail: "anna@acme.example",
    notes: "",
  };

  it("trims the fields and leaves out empty notes", () => {
    expect(customerDetailsDraftSchema.parse(customer)).toEqual({
      company: "Acme AB",
      contactName: "Anna Berg",
      contactEmail: "anna@acme.example",
    });
  });

  it("keeps notes that have text", () => {
    expect(customerDetailsDraftSchema.parse({ ...customer, notes: " Late arrival " }).notes).toBe(
      "Late arrival",
    );
  });

  it("asks for each required field", () => {
    const result = customerDetailsDraftSchema.safeParse(emptyCustomerDetailsDraft);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "Enter the company name.",
      "Enter the contact's name.",
      "Enter the contact's email address.",
    ]);
  });

  it("rejects an invalid email address and very long notes", () => {
    expect(
      firstMessage(customerDetailsDraftSchema.safeParse({ ...customer, contactEmail: "anna@" })),
    ).toBe("Enter a valid email address.");
    expect(
      customerDetailsDraftSchema.safeParse({ ...customer, notes: "x".repeat(2001) }).success,
    ).toBe(false);
  });
});

describe("createProposalRequestSchema", () => {
  const request = {
    templateId: "conference",
    basics: { guests: 45, startDate: "2026-10-14", endDate: "2026-10-15" },
    currency: "SEK",
    addedContentIds: [],
    removedContentIds: [],
    overrides: {},
    customer: { company: "Acme AB", contactName: "Anna", contactEmail: "anna@acme.example" },
  };

  it("accepts choices and customer details", () => {
    expect(createProposalRequestSchema.safeParse(request).success).toBe(true);
  });

  it("refuses prices or totals sent from the browser", () => {
    expect(createProposalRequestSchema.safeParse({ ...request, subtotal: 1 }).success).toBe(
      false,
    );
    expect(createProposalRequestSchema.safeParse({ ...request, budget: 1 }).success).toBe(false);
  });

  it("requires a supported currency", () => {
    expect(createProposalRequestSchema.safeParse({ ...request, currency: undefined }).success).toBe(
      false,
    );
    expect(createProposalRequestSchema.safeParse({ ...request, currency: "JPY" }).success).toBe(
      false,
    );
    for (const currency of ["SEK", "EUR", "USD", "GBP"]) {
      expect(createProposalRequestSchema.safeParse({ ...request, currency }).success).toBe(true);
    }
  });
});
