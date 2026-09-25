import { describe, expect, it } from "vitest";
import { currencyInText, formatDateRange, formatDateTime, formatMoney, plural } from "./format";

describe("formatMoney", () => {
  it("formats the smallest unit as the currency's name with grouping", () => {
    expect(formatMoney(1_240_000, "SEK")).toBe("12,400 Swedish kronor");
    expect(formatMoney(1_240_000, "EUR")).toBe("12,400 euros");
    expect(formatMoney(1_240_000, "USD")).toBe("12,400 US dollars");
    expect(formatMoney(1_240_000, "GBP")).toBe("12,400 British pounds");
  });

  it("shows two decimals only when there are any", () => {
    expect(formatMoney(104_050, "EUR")).toBe("1,040.50 euros");
    expect(formatMoney(12_345, "SEK")).toBe("123.45 Swedish kronor");
  });

  it("uses the singular for exactly one", () => {
    expect(formatMoney(100, "EUR")).toBe("1 euro");
    expect(formatMoney(0, "GBP")).toBe("0 British pounds");
  });
});

describe("currencyInText", () => {
  it("names the currency in plural, as in a sentence", () => {
    expect(currencyInText("SEK")).toBe("Swedish kronor");
    expect(currencyInText("EUR")).toBe("euros");
    expect(currencyInText("USD")).toBe("US dollars");
    expect(currencyInText("GBP")).toBe("British pounds");
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
