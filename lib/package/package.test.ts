import { describe, expect, it } from "vitest";
import { eventBasicsSchema } from "@/lib/schemas/event-basics";
import { getTemplate, type Template } from "@/lib/templates";
import { buildPackage, type LineItem } from "./build";
import { capacityIssues } from "./capacity";
import { eventLength } from "./event-length";
import { applyOverride, reapplyOverrides, resetOverride } from "./overrides";
import { pickMeetingSpace, quantityFor, roomsFor } from "./quantity";
import { budgetStatus, summarize } from "./summary";
import { idOf, testCatalog } from "./test-catalog";

function template(id: string): Template {
  const found = getTemplate(id);
  if (!found) throw new Error(`No template "${id}".`);
  return found;
}

const oneDay = { startDate: "2026-10-14", endDate: "2026-10-14" };
const twoDays = { startDate: "2026-10-14", endDate: "2026-10-15" };

function line(lines: LineItem[], title: string) {
  const found = lines.find((entry) => entry.title === title);
  if (!found) throw new Error(`No line "${title}".`);
  return found;
}

describe("eventLength", () => {
  it("counts both the start and end date", () => {
    expect(eventLength("2026-10-14", "2026-10-14")).toEqual({ days: 1, nights: 0 });
    expect(eventLength("2026-10-14", "2026-10-16")).toEqual({ days: 3, nights: 2 });
  });

  it("is not thrown off by a daylight saving change", () => {
    expect(eventLength("2026-10-24", "2026-10-26")).toEqual({ days: 3, nights: 2 });
    expect(eventLength("2026-03-28", "2026-03-30")).toEqual({ days: 3, nights: 2 });
  });

  it("rejects an end date before the start date", () => {
    expect(() => eventLength("2026-10-15", "2026-10-14")).toThrow(RangeError);
  });

  it("rejects dates it cannot read", () => {
    expect(() => eventLength("soon", "2026-10-14")).toThrow(RangeError);
  });
});

describe("eventBasicsSchema", () => {
  it("accepts a valid event", () => {
    expect(eventBasicsSchema.safeParse({ guests: 1, ...oneDay }).success).toBe(true);
  });

  it("rejects an end date before the start date with a readable message", () => {
    const result = eventBasicsSchema.safeParse({
      guests: 10,
      startDate: "2026-10-15",
      endDate: "2026-10-14",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({
      path: ["endDate"],
      message: "The end date cannot be before the start date.",
    });
  });

  it.each([0, -5, 2.5])("rejects %s guests", (guests) => {
    expect(eventBasicsSchema.safeParse({ guests, ...oneDay }).success).toBe(false);
  });
});

describe("pickMeetingSpace", () => {
  it.each([
    [1, "Boardroom"],
    [12, "Boardroom"],
    [13, "Harbour Room"],
    [50, "Harbour Room"],
    [51, "Grand Hall"],
    [150, "Grand Hall"],
  ])("seats %s guests in the %s", (guests, title) => {
    expect(pickMeetingSpace(testCatalog, guests)?.title).toBe(title);
  });

  it("returns null when no space is big enough", () => {
    expect(pickMeetingSpace(testCatalog, 151)).toBeNull();
    expect(pickMeetingSpace([], 1)).toBeNull();
  });
});

describe("quantityFor", () => {
  const basics = { guests: 20, ...twoDays };

  it.each([
    ["per_person", 20],
    ["per_person_per_day", 40],
    ["per_room_per_night", 5],
    ["per_day", 2],
    ["flat", 1],
  ] as const)("applies %s", (unit, expected) => {
    expect(quantityFor({ unit }, basics, 5)).toBe(expected);
  });

  it("bills rooms for at least one night after a one-day event", () => {
    expect(quantityFor({ unit: "per_room_per_night" }, { guests: 20, ...oneDay }, 5)).toBe(5);
  });
});

describe("roomsFor", () => {
  it("rounds up to whole rooms", () => {
    const rule = { kind: "per_guests", title: "Standard double", guestsPerRoom: 8 } as const;
    expect(roomsFor(rule, 8)).toBe(1);
    expect(roomsFor(rule, 9)).toBe(2);
    expect(roomsFor({ kind: "none" }, 90)).toBe(0);
  });
});

describe("buildPackage", () => {
  it("marks every line as derived", () => {
    const lines = buildPackage(template("wedding"), { guests: 90, ...oneDay }, testCatalog, "SEK");
    expect(lines.every((entry) => entry.source === "derived")).toBe(true);
    expect(lines.every((entry) => entry.quantity === entry.derivedQuantity)).toBe(true);
  });

  it("uses the largest space when none fits, so the problem is flagged", () => {
    const lines = buildPackage(template("conference"), { guests: 200, ...oneDay }, testCatalog, "SEK");

    expect(lines[0].title).toBe("Grand Hall");
    expect(capacityIssues(lines, 200)).toEqual([
      { contentId: idOf("Grand Hall"), title: "Grand Hall", reason: "Seats 150, you need 200" },
    ]);
  });

  it("picks a bigger space as the group grows", () => {
    const lines = buildPackage(template("offsite"), { guests: 60, ...twoDays }, testCatalog, "SEK");
    expect(lines[0].title).toBe("Grand Hall");
  });

  it("leaves out items missing from the catalog", () => {
    const catalog = testCatalog.filter((item) => item.title !== "Microphone set");
    const lines = buildPackage(template("wedding"), { guests: 90, ...oneDay }, catalog, "SEK");

    expect(lines.map((entry) => entry.title)).toEqual([
      "Grand Hall",
      "Wedding dinner package",
      "Standard double",
    ]);
  });
});

describe("overrides", () => {
  const basics = { guests: 12, ...twoDays };
  const lines = buildPackage(template("offsite"), basics, testCatalog, "SEK");
  const dinner = idOf("Three-course dinner");

  it("applies an override and recalculates the line total", () => {
    const overridden = line(applyOverride(lines, dinner, 10), "Three-course dinner");

    expect(overridden).toMatchObject({
      quantity: 10,
      derivedQuantity: 12,
      lineTotal: 695_000,
      source: "overridden",
    });
  });

  it("leaves other lines untouched", () => {
    const result = applyOverride(lines, dinner, 10);
    expect(line(result, "Conference lunch")).toBe(line(lines, "Conference lunch"));
  });

  it("resets an override to the derived quantity", () => {
    const reset = line(resetOverride(applyOverride(lines, dinner, 10), dinner), "Three-course dinner");
    expect(reset).toEqual(line(lines, "Three-course dinner"));
  });

  it.each([-1, 1.5, Number.NaN])("rejects a quantity of %s", (quantity) => {
    expect(() => applyOverride(lines, dinner, quantity)).toThrow(RangeError);
  });

  it("allows zero, to leave an item out without removing it", () => {
    expect(line(applyOverride(lines, dinner, 0), "Three-course dinner").lineTotal).toBe(0);
  });

  it("keeps an override when the guest count changes, while the suggestion updates", () => {
    const previous = applyOverride(lines, dinner, 10);
    const fresh = buildPackage(template("offsite"), { guests: 20, ...twoDays }, testCatalog, "SEK");
    const result = reapplyOverrides(fresh, previous);

    expect(line(result, "Three-course dinner")).toMatchObject({
      quantity: 10,
      derivedQuantity: 20,
      source: "overridden",
    });
    expect(line(result, "Conference lunch")).toMatchObject({ quantity: 40, source: "derived" });
    expect(line(resetOverride(result, dinner), "Three-course dinner").quantity).toBe(20);
  });

  it("drops an override for a meeting space that is swapped for a bigger one", () => {
    const previous = applyOverride(lines, idOf("Boardroom"), 1);
    const fresh = buildPackage(template("offsite"), { guests: 30, ...twoDays }, testCatalog, "SEK");
    const result = reapplyOverrides(fresh, previous);

    expect(result[0]).toMatchObject({ title: "Harbour Room", quantity: 2, source: "derived" });
    expect(result.some((entry) => entry.title === "Boardroom")).toBe(false);
  });
});

describe("summarize", () => {
  it("returns no per-person cost without guests", () => {
    expect(summarize([], { guests: 0 })).toEqual({
      subtotal: 0,
      perPerson: null,
      budgetStatus: "none",
    });
  });
});

describe("budgetStatus", () => {
  it.each([
    [89_000, 100_000, "ok"],
    [90_000, 100_000, "near"],
    [100_000, 100_000, "near"],
    [100_001, 100_000, "over"],
    [100_000, null, "none"],
    [100_000, undefined, "none"],
  ] as const)("rates %s against a budget of %s as %s", (subtotal, budget, expected) => {
    expect(budgetStatus(subtotal, budget)).toBe(expected);
  });
});
