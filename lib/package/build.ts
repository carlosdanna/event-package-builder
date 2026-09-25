// Builds the suggested package for a template from the catalog.
import type { CatalogItem } from "@/lib/catalog/schema";
import type { Currency } from "@/lib/money";
import type { EventBasics } from "@/lib/schemas/event-basics";
import type { Template, TemplateItem } from "@/lib/templates/schema";
import { maxQuantityFor } from "./limits";
import { largestMeetingSpace, pickMeetingSpace, quantityFor, roomsFor } from "./quantity";

export type LineItem = CatalogItem & {
  unitPrice: number;
  neededQuantity: number; // what the rules call for, before any limit
  maxQuantity: number | null; // the most the hotel has for these dates, null when unlimited
  derivedQuantity: number; // what the rules suggest, never above the maximum
  quantity: number; // what is billed, the derived quantity unless overridden
  lineTotal: number;
  source: "derived" | "overridden";
};

// Lines follow the template order, with rooms last. Items that are missing
// from the catalog are left out; mergeCatalog already warns about them.
export function buildPackage(
  template: Template,
  basics: EventBasics,
  catalog: CatalogItem[],
  currency: Currency,
): LineItem[] {
  const lines: LineItem[] = [];

  for (const templateItem of template.items) {
    const catalogItem = resolveItem(templateItem, catalog, basics.guests);
    if (catalogItem) lines.push(toLine(catalogItem, basics, 0, currency));
  }

  if (template.rooms.kind === "per_guests") {
    const room = findByTitle(catalog, template.rooms.title);
    const roomsCount = roomsFor(template.rooms, basics.guests);
    if (room) lines.push(toLine(room, basics, roomsCount, currency));
  }

  return lines;
}

// When no space seats every guest, the largest one is used, so the line
// still shows up and packageIssues can flag it.
function resolveItem(templateItem: TemplateItem, catalog: CatalogItem[], guests: number) {
  if (templateItem.kind === "meeting_space_by_size") {
    return pickMeetingSpace(catalog, guests) ?? largestMeetingSpace(catalog);
  }
  return findByTitle(catalog, templateItem.title);
}

function findByTitle(catalog: CatalogItem[], title: string) {
  return catalog.find((item) => item.title === title) ?? null;
}

// The suggestion is cut down to what the hotel has; shortfall reports the rest.
// The unit price comes from the item's price list for the chosen currency.
export function toLine(
  item: CatalogItem,
  basics: EventBasics,
  roomsCount: number,
  currency: Currency,
): LineItem {
  const unitPrice = item.prices[currency];
  const neededQuantity = quantityFor(item, basics, roomsCount);
  const maxQuantity = maxQuantityFor(item, basics);
  const quantity = maxQuantity === null ? neededQuantity : Math.min(neededQuantity, maxQuantity);
  return {
    ...item,
    unitPrice,
    neededQuantity,
    maxQuantity,
    derivedQuantity: quantity,
    quantity,
    lineTotal: unitPrice * quantity,
    source: "derived",
  };
}
