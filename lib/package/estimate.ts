// The "from X kronor per person" estimate shown on each template card.
import type { CatalogItem } from "@/lib/catalog/schema";
import type { Template } from "@/lib/templates/schema";
import { buildPackage } from "./build";
import { summarize } from "./summary";

export const ESTIMATE_GUESTS = 20;

// Any single date works: only the length of the event matters.
const ONE_DAY = { startDate: "2026-01-01", endDate: "2026-01-01" };

// Per-person cost of the template's suggested package for a one-day event.
export function estimatePerPersonOre(
  template: Template,
  catalog: CatalogItem[],
  guests: number = ESTIMATE_GUESTS,
) {
  const basics = { guests, ...ONE_DAY };
  return summarize(buildPackage(template, basics, catalog), basics).perPersonOre;
}
