import { describe, expect, it } from "vitest";
import { getTemplate, type Template } from "@/lib/templates";
import { addableItems, assemblePackage, type PackageChoices } from "./assemble";
import { meetingSpaceIssue } from "./capacity";
import { ESTIMATE_GUESTS, estimatePerPersonOre } from "./estimate";
import { budgetUsage } from "./summary";
import { idOf, testCatalog } from "./test-catalog";

function template(id: string): Template {
  const found = getTemplate(id);
  if (!found) throw new Error(`No template "${id}".`);
  return found;
}

const noChoices: PackageChoices = { addedContentIds: [], removedContentIds: [], overrides: {} };
const twoDays = { guests: 30, startDate: "2026-10-14", endDate: "2026-10-15" };

function titles(lines: { title: string }[]) {
  return lines.map((line) => line.title);
}

describe("assemblePackage", () => {
  it("is the suggested package when nothing is changed", () => {
    const lines = assemblePackage(template("conference"), twoDays, testCatalog, noChoices);
    expect(titles(lines)).toEqual([
      "Harbour Room",
      "Coffee break",
      "Conference lunch",
      "Projector and screen",
    ]);
  });

  it("appends added items with quantities from their unit", () => {
    const lines = assemblePackage(template("conference"), twoDays, testCatalog, {
      ...noChoices,
      addedContentIds: [idOf("Three-course dinner"), idOf("Microphone set")],
    });
    expect(lines.at(-2)).toMatchObject({ title: "Three-course dinner", quantity: 30 });
    expect(lines.at(-1)).toMatchObject({ title: "Microphone set", quantity: 1 });
  });

  it("uses the template's rooms rule for added rooms", () => {
    const lines = assemblePackage(template("wedding"), twoDays, testCatalog, {
      ...noChoices,
      addedContentIds: [idOf("Suite")],
    });
    // 30 guests, 8 per room: 4 rooms for 1 night.
    expect(lines.at(-1)).toMatchObject({ title: "Suite", quantity: 4 });
  });

  it("books double rooms when the template has no rooms", () => {
    const lines = assemblePackage(template("conference"), twoDays, testCatalog, {
      ...noChoices,
      addedContentIds: [idOf("Standard double")],
    });
    expect(lines.at(-1)).toMatchObject({ title: "Standard double", quantity: 15 });
  });

  it("does not add an item twice", () => {
    const lines = assemblePackage(template("conference"), twoDays, testCatalog, {
      ...noChoices,
      addedContentIds: [idOf("Coffee break"), idOf("Suite"), idOf("Suite")],
    });
    expect(titles(lines).filter((title) => title === "Coffee break")).toHaveLength(1);
    expect(titles(lines).filter((title) => title === "Suite")).toHaveLength(1);
  });

  it("leaves out removed items, suggested or added", () => {
    const lines = assemblePackage(template("conference"), twoDays, testCatalog, {
      ...noChoices,
      addedContentIds: [idOf("Suite")],
      removedContentIds: [idOf("Coffee break"), idOf("Suite")],
    });
    expect(titles(lines)).not.toContain("Coffee break");
    expect(titles(lines)).not.toContain("Suite");
  });

  it("applies overrides and ignores overrides for items not in the package", () => {
    const lines = assemblePackage(template("conference"), twoDays, testCatalog, {
      ...noChoices,
      overrides: { [idOf("Coffee break")]: 45, [idOf("Suite")]: 3 },
    });
    expect(lines.find((line) => line.title === "Coffee break")).toMatchObject({
      quantity: 45,
      derivedQuantity: 60,
      lineTotalOre: 45 * 9_500,
      source: "overridden",
    });
    expect(titles(lines)).not.toContain("Suite");
  });

  it("keeps an override when the guest count changes", () => {
    const choices = { ...noChoices, overrides: { [idOf("Coffee break")]: 45 } };
    const lines = assemblePackage(
      template("conference"),
      { ...twoDays, guests: 40 },
      testCatalog,
      choices,
    );
    expect(lines.find((line) => line.title === "Coffee break")).toMatchObject({
      quantity: 45,
      derivedQuantity: 80,
    });
  });
});

describe("addableItems", () => {
  it("lists catalog items that are not in the package", () => {
    const lines = assemblePackage(template("private-dinner"), twoDays, testCatalog, noChoices);
    const addable = titles(addableItems(lines, testCatalog));
    expect(addable).not.toContain("Three-course dinner");
    expect(addable).toContain("Suite");
    expect(addable).toHaveLength(testCatalog.length - lines.length);
  });
});

describe("estimatePerPersonOre", () => {
  it("prices a one-day event for 20 guests", () => {
    // Harbour Room 18,000 + coffee 95 × 20 + lunch 245 × 20 + projector 1,200, over 20 guests.
    const expected = Math.round((1_800_000 + 190_000 + 490_000 + 120_000) / ESTIMATE_GUESTS);
    expect(estimatePerPersonOre(template("conference"), testCatalog)).toBe(expected);
  });

  it("includes one night of rooms for templates with rooms", () => {
    // Offsite: Harbour Room 18,000, lunch 245 and dinner 695 per person, one room each for a night.
    const expected = Math.round((1_800_000 + 20 * (24_500 + 69_500 + 189_000)) / 20);
    expect(estimatePerPersonOre(template("offsite"), testCatalog)).toBe(expected);
  });
});

describe("budgetUsage", () => {
  it("is null without a budget", () => {
    expect(budgetUsage(1_000, null)).toBeNull();
    expect(budgetUsage(1_000, undefined)).toBeNull();
  });

  it("gives the rounded percentage and nothing over when within budget", () => {
    expect(budgetUsage(82_000, 100_000)).toEqual({ percent: 82, overOre: 0 });
  });

  it("gives the amount over budget", () => {
    expect(budgetUsage(1_240_000 + 5_000_000, 5_000_000)).toEqual({
      percent: 125,
      overOre: 1_240_000,
    });
  });
});

describe("meetingSpaceIssue", () => {
  it("explains why a space is too small", () => {
    const boardroom = testCatalog.find((item) => item.title === "Boardroom")!;
    expect(meetingSpaceIssue(boardroom, 60)).toBe("Seats 12, you need 60");
    expect(meetingSpaceIssue(boardroom, 12)).toBeNull();
  });

  it("is null for items without a capacity", () => {
    const coffee = testCatalog.find((item) => item.title === "Coffee break")!;
    expect(meetingSpaceIssue(coffee, 500)).toBeNull();
  });
});
