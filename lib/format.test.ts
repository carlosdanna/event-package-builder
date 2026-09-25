import { describe, expect, it } from "vitest";
import { formatKronor } from "./format";

describe("formatKronor", () => {
  it("formats öre as whole kronor with grouping", () => {
    expect(formatKronor(1_240_000)).toBe("12,400 kronor");
    expect(formatKronor(0)).toBe("0 kronor");
  });

  it("rounds to the nearest krona", () => {
    expect(formatKronor(12_350)).toBe("124 kronor");
  });
});
