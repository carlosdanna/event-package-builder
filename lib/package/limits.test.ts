import { describe, expect, it } from "vitest";
import { getTemplate, type Template } from "@/lib/templates";
import { assemblePackage } from "./assemble";
import { buildPackage, type LineItem } from "./build";
import { limitIssues, maxQuantityFor, packageIssues, shortfall } from "./limits";
import { idOf, testCatalog } from "./test-catalog";

const oneDay = { guests: 10, startDate: "2026-10-14", endDate: "2026-10-14" };
const threeDays = { guests: 10, startDate: "2026-10-14", endDate: "2026-10-16" };
const noChoices = { addedContentIds: [], removedContentIds: [], overrides: {} };

function template(id: string): Template {
  const found = getTemplate(id);
  if (!found) throw new Error(`No template "${id}".`);
  return found;
}

function line(lines: LineItem[], title: string) {
  const found = lines.find((entry) => entry.title === title);
  if (!found) throw new Error(`No line "${title}".`);
  return found;
}

describe("maxQuantityFor", () => {
  it("allows each space once per day of the event", () => {
    expect(maxQuantityFor({ unit: "per_day", available: 1 }, oneDay)).toBe(1);
    expect(maxQuantityFor({ unit: "per_day", available: 3 }, threeDays)).toBe(9);
  });

  it("allows each room once per night, and one night after a one-day event", () => {
    expect(maxQuantityFor({ unit: "per_room_per_night", available: 40 }, oneDay)).toBe(40);
    expect(maxQuantityFor({ unit: "per_room_per_night", available: 40 }, threeDays)).toBe(80);
  });

  it("allows a flat item as many times as the hotel has it", () => {
    expect(maxQuantityFor({ unit: "flat", available: 2 }, threeDays)).toBe(2);
  });

  it("has no maximum for items without a limit", () => {
    expect(maxQuantityFor({ unit: "per_person_per_day", available: undefined }, oneDay)).toBeNull();
    expect(maxQuantityFor({ unit: "per_day", available: undefined }, oneDay)).toBeNull();
  });
});

describe("suggested quantities", () => {
  it("books every room the hotel has when the guests need more, and reports the rest", () => {
    const basics = { guests: 60, startDate: "2026-11-02", endDate: "2026-11-03" };
    const rooms = line(buildPackage(template("offsite"), basics, testCatalog, "SEK"), "Standard double");

    expect(rooms).toMatchObject({ neededQuantity: 60, maxQuantity: 40, quantity: 40 });
    expect(shortfall(rooms)).toBe(20);
  });

  it("never limits catering", () => {
    const basics = { guests: 500, startDate: "2026-10-14", endDate: "2026-10-16" };
    const coffee = line(buildPackage(template("conference"), basics, testCatalog, "SEK"), "Coffee break");

    expect(coffee).toMatchObject({ quantity: 1_500, maxQuantity: null });
    expect(shortfall(coffee)).toBe(0);
  });

  it("caps added items too", () => {
    const basics = { ...oneDay, guests: 100 };
    const lines = assemblePackage(template("conference"), basics, testCatalog, {
      ...noChoices,
      addedContentIds: [idOf("Suite")],
    }, "SEK");

    expect(line(lines, "Suite")).toMatchObject({ neededQuantity: 50, quantity: 4 });
  });
});

describe("limitIssues", () => {
  it("flags a quantity above what the hotel has for these dates", () => {
    const lines = assemblePackage(template("wedding"), { ...oneDay, guests: 90 }, testCatalog, {
      ...noChoices,
      overrides: { [idOf("Grand Hall")]: 2 },
    }, "SEK");

    expect(limitIssues(lines)).toEqual([
      {
        contentId: idOf("Grand Hall"),
        title: "Grand Hall",
        reason: "At most 1 for these dates, you have 2",
      },
    ]);
  });

  it("does not flag a capped suggestion, since it books only what exists", () => {
    const basics = { guests: 60, startDate: "2026-11-02", endDate: "2026-11-03" };
    const lines = buildPackage(template("offsite"), basics, testCatalog, "SEK");

    expect(limitIssues(lines)).toEqual([]);
  });
});

describe("packageIssues", () => {
  it("lists spaces that are too small and quantities beyond the limit", () => {
    const lines = assemblePackage(template("private-dinner"), { ...oneDay, guests: 12 }, testCatalog, {
      ...noChoices,
      addedContentIds: [idOf("Microphone set")],
      overrides: { [idOf("Microphone set")]: 3 },
    }, "SEK");

    expect(packageIssues(lines, 80).map((issue) => issue.title)).toEqual([
      "Boardroom",
      "Microphone set",
    ]);
  });
});
