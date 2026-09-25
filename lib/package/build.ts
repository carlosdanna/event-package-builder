// Builds the suggested package for a template from the catalog.
import type { CatalogItem } from "@/lib/catalog/schema";
import type { EventBasics } from "@/lib/schemas/event-basics";
import type { Template, TemplateItem } from "@/lib/templates/schema";
import { largestMeetingSpace, pickMeetingSpace, quantityFor, roomsFor } from "./quantity";

export type LineItem = CatalogItem & {
  unitPriceOre: number;
  derivedQuantity: number; // what the rules suggest
  quantity: number; // what is billed, the derived quantity unless overridden
  lineTotalOre: number;
  source: "derived" | "overridden";
};

// Lines follow the template order, with rooms last. Items that are missing
// from the catalog are left out; mergeCatalog already warns about them.
export function buildPackage(
  template: Template,
  basics: EventBasics,
  catalog: CatalogItem[],
): LineItem[] {
  const lines: LineItem[] = [];

  for (const templateItem of template.items) {
    const catalogItem = resolveItem(templateItem, catalog, basics.guests);
    if (catalogItem) lines.push(toLine(catalogItem, quantityFor(catalogItem, basics, 0)));
  }

  if (template.rooms.kind === "per_guests") {
    const room = findByTitle(catalog, template.rooms.title);
    const roomsCount = roomsFor(template.rooms, basics.guests);
    if (room) lines.push(toLine(room, quantityFor(room, basics, roomsCount)));
  }

  return lines;
}

// When no space seats every guest, the largest one is used, so the line
// still shows up and capacityIssues can flag it.
function resolveItem(templateItem: TemplateItem, catalog: CatalogItem[], guests: number) {
  if (templateItem.kind === "meeting_space_by_size") {
    return pickMeetingSpace(catalog, guests) ?? largestMeetingSpace(catalog);
  }
  return findByTitle(catalog, templateItem.title);
}

function findByTitle(catalog: CatalogItem[], title: string) {
  return catalog.find((item) => item.title === title) ?? null;
}

function toLine(item: CatalogItem, quantity: number): LineItem {
  return {
    ...item,
    unitPriceOre: item.priceOre,
    derivedQuantity: quantity,
    quantity,
    lineTotalOre: item.priceOre * quantity,
    source: "derived",
  };
}
