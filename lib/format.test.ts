import { describe, expect, it } from "vitest";
import { formatDateRange, formatDateTime, formatMoney, plural } from "./format";

// Intl separates the code and the amount with a non-breaking space.
const space = "\u00a0";

describe("formatMoney", () => {
  it("formats the smallest unit with the currency code and grouping", () => {
    expect(formatMoney(1_240_000, "SEK")).toBe(`SEK${space}12,400`);
    expect(formatMoney(1_240_000, "EUR")).toBe(`EUR${space}12,400`);
    expect(formatMoney(1_240_000, "USD")).toBe(`USD${space}12,400`);
    expect(formatMoney(1_240_000, "GBP")).toBe(`GBP${space}12,400`);
  });

  it("shows two decimals only when there are any", () => {
    expect(formatMoney(104_050, "EUR")).toBe(`EUR${space}1,040.50`);
    expect(formatMoney(12_345, "SEK")).toBe(`SEK${space}123.45`);
    expect(formatMoney(0, "GBP")).toBe(`GBP${space}0`);
  });
});

describe("formatDateRange", () => {
  it("shows one date for a single-day event", () => {
    expect(formatDateRange("2026-10-14", "2026-10-14")).toBe("14 Oct 2026");
  });

  it("shares the month and year when they are the same", () => {
    expect(formatDateRange("2026-10-14", "2026-10-15")).toBe("14–15 Oct 2026");
    expect(formatDateRange("2026-10-30", "2026-11-02")).toBe("30 Oct – 2 Nov 2026");
  });

  it("shows both years across new year", () => {
    expect(formatDateRange("2026-12-31", "2027-01-01")).toBe("31 Dec 2026 – 1 Jan 2027");
  });
});

describe("formatDateTime", () => {
  it("shows the local date and a 24-hour time", () => {
    expect(formatDateTime(new Date(2026, 9, 14, 9, 5).getTime())).toBe("14 Oct 2026, 09:05");
  });
});

describe("plural", () => {
  it("adds an s for any count but one", () => {
    expect(plural(1, "day")).toBe("1 day");
    expect(plural(0, "night")).toBe("0 nights");
    expect(plural(2, "day")).toBe("2 days");
  });
});
