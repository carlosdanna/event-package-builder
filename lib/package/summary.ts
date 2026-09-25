// Totals and budget status for the live summary and the server check.
import type { EventBasics } from "@/lib/schemas/event-basics";
import type { LineItem } from "./build";

export type BudgetStatus = "none" | "ok" | "near" | "over";

export type PackageSummary = {
  subtotalOre: number;
  perPersonOre: number | null;
  budget: BudgetStatus;
};

export function summarize(
  lines: LineItem[],
  basics: Pick<EventBasics, "guests">,
  budgetOre?: number | null,
): PackageSummary {
  const subtotalOre = lines.reduce((sum, line) => sum + line.lineTotalOre, 0);
  const perPersonOre = basics.guests > 0 ? Math.round(subtotalOre / basics.guests) : null;
  return { subtotalOre, perPersonOre, budget: budgetStatus(subtotalOre, budgetOre) };
}

// Near means 90% of the budget or more; over means above the budget.
export function budgetStatus(subtotalOre: number, budgetOre?: number | null): BudgetStatus {
  if (budgetOre === undefined || budgetOre === null) return "none";
  if (subtotalOre > budgetOre) return "over";
  // Compared as whole numbers to avoid rounding errors.
  if (subtotalOre * 10 >= budgetOre * 9) return "near";
  return "ok";
}
