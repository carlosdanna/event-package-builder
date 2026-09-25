// Totals and budget status for the live summary and the server check.
import type { EventBasics } from "@/lib/schemas/event-basics";
import type { LineItem } from "./build";

export type BudgetStatus = "none" | "ok" | "near" | "over";

export type PackageSummary = {
  subtotal: number;
  perPerson: number | null;
  budgetStatus: BudgetStatus;
};

export function summarize(
  lines: LineItem[],
  basics: Pick<EventBasics, "guests">,
  budget?: number | null,
): PackageSummary {
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const perPerson = basics.guests > 0 ? Math.round(subtotal / basics.guests) : null;
  return { subtotal, perPerson, budgetStatus: budgetStatus(subtotal, budget) };
}

// Near means 90% of the budget or more; over means above the budget.
export function budgetStatus(subtotal: number, budget?: number | null): BudgetStatus {
  if (budget === undefined || budget === null) return "none";
  if (subtotal > budget) return "over";
  // Compared as whole numbers to avoid rounding errors.
  if (subtotal * 10 >= budget * 9) return "near";
  return "ok";
}

export type BudgetUsage = { percent: number; over: number };

// How much of the budget the package uses, for the budget bar and its text.
export function budgetUsage(subtotal: number, budget?: number | null): BudgetUsage | null {
  if (budget === undefined || budget === null || budget <= 0) return null;
  return {
    percent: Math.round((subtotal * 100) / budget),
    over: Math.max(subtotal - budget, 0),
  };
}
