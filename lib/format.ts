// Formatting for the interface.
import type { Currency } from "./money";

const moneyFormats = new Map<Currency, Intl.NumberFormat>();

// Amounts are in the smallest currency unit: 1240000 in "SEK" becomes
// "12,400 Swedish kronor" and 104050 in "EUR" becomes "1,040.50 euros".
export function formatMoney(amount: number, currency: Currency) {
  return moneyFormat(currency).format(amount / 100);
}

// The currency as it reads in a sentence: "Swedish kronor", "euros".
export function currencyInText(currency: Currency) {
  const parts = moneyFormat(currency).formatToParts(2);
  return parts.find((part) => part.type === "currency")?.value ?? currency;
}

function moneyFormat(currency: Currency) {
  let format = moneyFormats.get(currency);
  if (!format) {
    format = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "name",
      minimumFractionDigits: 2,
      trailingZeroDisplay: "stripIfInteger",
    });
    moneyFormats.set(currency, format);
  }
  return format;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ISO dates as a short range: "14 Oct 2026", "14–15 Oct 2026" or "30 Oct – 2 Nov 2026".
// Read as plain calendar dates, so the time zone never shifts the day.
export function formatDateRange(startDate: string, endDate: string) {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const end = `${endDay} ${MONTHS[endMonth - 1]} ${endYear}`;

  if (startDate === endDate) return end;
  if (startYear === endYear && startMonth === endMonth) return `${startDay}–${end}`;
  if (startYear === endYear) return `${startDay} ${MONTHS[startMonth - 1]} – ${end}`;
  return `${startDay} ${MONTHS[startMonth - 1]} ${startYear} – ${end}`;
}

// A moment as local date and time: "14 Oct 2026, 09:05".
export function formatDateTime(milliseconds: number) {
  const date = new Date(milliseconds);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes}`;
}

// "1 day", "2 days".
export function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}
