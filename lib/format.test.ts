import { describe, expect, it } from "vitest";
import { formatDateRange, formatDateTime, formatKronor, plural } from "./format";

describe("formatKronor", () => {
  it("formats öre as whole kronor with grouping", () => {
    expect(formatKronor(1_240_000)).toBe("12,400 kronor");
    expect(formatKronor(0)).toBe("0 kronor");
  });

  it("rounds to the nearest krona", () => {
    expect(formatKronor(12_350)).toBe("124 kronor");
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
