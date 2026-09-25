// VAT on top of a price that excludes tax, in the smallest currency unit.
export function withTax(amount: number, vatPercent: number) {
  return Math.round((amount * (100 + vatPercent)) / 100);
}
