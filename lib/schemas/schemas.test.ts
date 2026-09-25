import { describe, expect, it } from "vitest";
import { eventBasicsDraftSchema, eventBasicsSchema } from "./event-basics";
import { packageSelectionSchema } from "./package-selection";

const draft = { guests: "40", startDate: "2026-10-14", endDate: "2026-10-15", budgetKronor: "" };

function firstMessage(result: { error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message;
}

describe("eventBasicsSchema", () => {
  it("allows at most 500 guests", () => {
    const basics = { startDate: "2026-10-14", endDate: "2026-10-14" };
    expect(eventBasicsSchema.safeParse({ guests: 500, ...basics }).success).toBe(true);
    expect(eventBasicsSchema.safeParse({ guests: 501, ...basics }).success).toBe(false);
  });
});

describe("eventBasicsDraftSchema", () => {
  it("reads the typed fields into basics and no budget", () => {
    expect(eventBasicsDraftSchema.parse(draft)).toEqual({
      basics: { guests: 40, startDate: "2026-10-14", endDate: "2026-10-15" },
      budgetOre: null,
    });
  });

  it("reads the budget in kronor as öre, allowing spaces and commas", () => {
    expect(eventBasicsDraftSchema.parse({ ...draft, budgetKronor: "120,000" }).budgetOre).toBe(
      12_000_000,
    );
    expect(eventBasicsDraftSchema.parse({ ...draft, budgetKronor: " 50 000 " }).budgetOre).toBe(
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

  it("rejects a budget that is not a positive whole number", () => {
    expect(eventBasicsDraftSchema.safeParse({ ...draft, budgetKronor: "abc" }).success).toBe(
      false,
    );
    expect(eventBasicsDraftSchema.safeParse({ ...draft, budgetKronor: "0" }).success).toBe(false);
    expect(eventBasicsDraftSchema.safeParse({ ...draft, budgetKronor: "12.5" }).success).toBe(
      false,
    );
  });
});

describe("packageSelectionSchema", () => {
  const selection = {
    templateId: "conference",
    basics: { guests: 40, startDate: "2026-10-14", endDate: "2026-10-15" },
    budgetOre: null,
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
});
