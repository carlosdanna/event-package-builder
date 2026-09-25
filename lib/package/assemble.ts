// The full package: the template's suggestion plus the salesperson's changes.
// Used by the live summary in the browser and to recalculate totals on the server.
import type { CatalogItem } from "@/lib/catalog/schema";
import type { EventBasics } from "@/lib/schemas/event-basics";
import type { Template } from "@/lib/templates/schema";
import { buildPackage, type LineItem } from "./build";
import { applyOverride } from "./overrides";
import { quantityFor, roomsFor } from "./quantity";

// Double rooms, when the template does not say how many guests share a room.
const DEFAULT_GUESTS_PER_ROOM = 2;

export type PackageChoices = {
  addedContentIds: number[];
  removedContentIds: number[];
  overrides: Record<number, number>; // content id to quantity
};

export function assemblePackage(
  template: Template,
  basics: EventBasics,
  catalog: CatalogItem[],
  choices: PackageChoices,
): LineItem[] {
  const suggested = buildPackage(template, basics, catalog);
  const added = addedLines(template, basics, catalog, choices.addedContentIds, suggested);
  const kept = [...suggested, ...added].filter(
    (line) => !choices.removedContentIds.includes(line.contentId),
  );
  return applyOverrides(kept, choices.overrides);
}

// Catalog items the salesperson can still add, in catalog order.
export function addableItems(lines: LineItem[], catalog: CatalogItem[]) {
  const inPackage = new Set(lines.map((line) => line.contentId));
  return catalog.filter((item) => !inPackage.has(item.contentId));
}

function addedLines(
  template: Template,
  basics: EventBasics,
  catalog: CatalogItem[],
  addedContentIds: number[],
  suggested: LineItem[],
): LineItem[] {
  const present = new Set(suggested.map((line) => line.contentId));
  const lines: LineItem[] = [];

  for (const contentId of addedContentIds) {
    const item = catalog.find((entry) => entry.contentId === contentId);
    if (!item || present.has(contentId)) continue;
    present.add(contentId);
    const quantity = quantityFor(item, basics, roomsCountFor(template, basics.guests));
    lines.push({
      ...item,
      unitPriceOre: item.priceOre,
      derivedQuantity: quantity,
      quantity,
      lineTotalOre: item.priceOre * quantity,
      source: "derived",
    });
  }
  return lines;
}

function roomsCountFor(template: Template, guests: number) {
  if (template.rooms.kind === "per_guests") return roomsFor(template.rooms, guests);
  return Math.ceil(guests / DEFAULT_GUESTS_PER_ROOM);
}

// Overrides for items that are no longer in the package are ignored.
function applyOverrides(lines: LineItem[], overrides: Record<number, number>) {
  return Object.entries(overrides).reduce(
    (current, [contentId, quantity]) => applyOverride(current, Number(contentId), quantity),
    lines,
  );
}
