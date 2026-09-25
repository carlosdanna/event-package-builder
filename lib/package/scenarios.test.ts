// End-to-end pricing for each template, with exact totals in öre.
import { describe, expect, it } from "vitest";
import { getTemplate, type Template } from "@/lib/templates";
import { buildPackage } from "./build";
import { capacityIssues } from "./capacity";
import { pickMeetingSpace } from "./quantity";
import { summarize } from "./summary";
import { testCatalog } from "./test-catalog";

const kronor = (amount: number) => amount * 100;

function template(id: string): Template {
  const found = getTemplate(id);
  if (!found) throw new Error(`No template "${id}".`);
  return found;
}

function lineSummary(lines: ReturnType<typeof buildPackage>) {
  return lines.map((line) => [line.title, line.quantity, line.unitPriceOre, line.lineTotalOre]);
}

describe("package scenarios", () => {
  it("prices a conference for 45 guests over 2 days, within budget", () => {
    const basics = { guests: 45, startDate: "2026-10-14", endDate: "2026-10-15" };
    const lines = buildPackage(template("conference"), basics, testCatalog);

    expect(lineSummary(lines)).toEqual([
      ["Harbour Room", 2, 1_800_000, 3_600_000],
      ["Coffee break", 90, 9_500, 855_000],
      ["Conference lunch", 90, 24_500, 2_205_000],
      ["Projector and screen", 2, 120_000, 240_000],
    ]);
    expect(summarize(lines, basics, kronor(150_000))).toEqual({
      subtotalOre: 6_900_000,
      perPersonOre: 153_333,
      budget: "ok",
    });
    expect(capacityIssues(lines, basics.guests)).toEqual([]);
  });

  it("prices a wedding for 90 guests on 1 day, with 12 rooms for 1 night", () => {
    const basics = { guests: 90, startDate: "2026-06-06", endDate: "2026-06-06" };
    const lines = buildPackage(template("wedding"), basics, testCatalog);

    expect(lineSummary(lines)).toEqual([
      ["Grand Hall", 1, 4_500_000, 4_500_000],
      ["Wedding dinner package", 90, 145_000, 13_050_000],
      ["Microphone set", 1, 150_000, 150_000],
      ["Standard double", 12, 189_000, 2_268_000],
    ]);
    expect(summarize(lines, basics)).toEqual({
      subtotalOre: 19_968_000,
      perPersonOre: 221_867,
      budget: "none",
    });
  });

  it("prices an offsite for 12 guests over 2 days, over budget", () => {
    const basics = { guests: 12, startDate: "2026-11-02", endDate: "2026-11-03" };
    const lines = buildPackage(template("offsite"), basics, testCatalog);

    expect(lineSummary(lines)).toEqual([
      ["Boardroom", 2, 600_000, 1_200_000],
      ["Conference lunch", 24, 24_500, 588_000],
      ["Three-course dinner", 12, 69_500, 834_000],
      ["Standard double", 12, 189_000, 2_268_000],
    ]);
    expect(summarize(lines, basics, kronor(40_000))).toEqual({
      subtotalOre: 4_890_000,
      perPersonOre: 407_500,
      budget: "over",
    });
  });

  it("prices a private dinner for 12 guests on 1 day", () => {
    const basics = { guests: 12, startDate: "2026-12-11", endDate: "2026-12-11" };
    const lines = buildPackage(template("private-dinner"), basics, testCatalog);

    expect(lineSummary(lines)).toEqual([
      ["Boardroom", 1, 600_000, 600_000],
      ["Three-course dinner", 12, 69_500, 834_000],
    ]);
    expect(summarize(lines, basics)).toEqual({
      subtotalOre: 1_434_000,
      perPersonOre: 119_500,
      budget: "none",
    });
  });

  it("flags a product launch for 180 guests, since no space fits", () => {
    const basics = { guests: 180, startDate: "2026-09-30", endDate: "2026-09-30" };
    const lines = buildPackage(template("product-launch"), basics, testCatalog);

    expect(pickMeetingSpace(testCatalog, 180)).toBeNull();
    expect(lineSummary(lines)).toEqual([
      ["Grand Hall", 1, 4_500_000, 4_500_000],
      ["Coffee break", 180, 9_500, 1_710_000],
      ["Projector and screen", 1, 120_000, 120_000],
      ["Microphone set", 1, 150_000, 150_000],
      ["Standard double", 18, 189_000, 3_402_000],
    ]);
    expect(summarize(lines, basics)).toEqual({
      subtotalOre: 9_882_000,
      perPersonOre: 54_900,
      budget: "none",
    });
    expect(capacityIssues(lines, basics.guests)).toEqual([
      { contentId: lines[0].contentId, title: "Grand Hall", reason: "Seats 150, you need 180" },
    ]);
  });
});
