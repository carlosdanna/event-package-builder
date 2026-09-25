import { describe, expect, it } from "vitest";
import { withTax } from "./tax";

describe("withTax", () => {
  it("adds the VAT to a price", () => {
    expect(withTax(1_800_000, 25)).toBe(2_250_000);
    expect(withTax(69_500, 12)).toBe(77_840);
  });

  it("keeps the price when there is no VAT", () => {
    expect(withTax(69_500, 0)).toBe(69_500);
  });

  it("rounds to a whole smallest unit", () => {
    expect(withTax(850, 12)).toBe(952);
    expect(withTax(95, 12)).toBe(106);
  });
});
