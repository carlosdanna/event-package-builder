// Currencies a proposal can be priced in. Safe to import in the browser.
// Amounts are whole numbers in the smallest unit of their currency (öre, cents,
// pence). Every supported currency has 100 of those to one main unit.
// There are no exchange rates: each catalog item has its own price per currency.
import { z } from "zod";

export const currencySchema = z.enum(["SEK", "EUR", "USD", "GBP"]);
export type Currency = z.infer<typeof currencySchema>;

export const DEFAULT_CURRENCY: Currency = "SEK";

// Shown in the interface instead of the three-letter codes.
export const currencyNames: Record<Currency, string> = {
  SEK: "Swedish kronor",
  EUR: "Euros",
  USD: "US dollars",
  GBP: "British pounds",
};

// 12.5 euros becomes 1250 cents.
export function toMinorUnits(amount: number) {
  return Math.round(amount * 100);
}
