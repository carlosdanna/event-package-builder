// Plain words for pricing units and categories, for the interface.
import type { CatalogCategory, CatalogItem, PricingUnit } from "./schema";

const unitLabels: Record<PricingUnit, string> = {
  per_person: "per person",
  per_person_per_day: "per person per day",
  per_room_per_night: "per room per night",
  per_day: "per day",
  flat: "flat fee",
};

const categoryLabels: Record<CatalogCategory, string> = {
  meeting_space: "Meeting space",
  catering: "Catering",
  rooms: "Rooms",
  equipment: "Equipment",
  extras: "Extras",
};

export function unitLabel(unit: PricingUnit) {
  return unitLabels[unit];
}

export function categoryLabel(category: CatalogCategory) {
  return categoryLabels[category];
}

// How many the hotel has, such as "40 a night", or null when there is no limit.
export function availableLabel(item: Pick<CatalogItem, "unit" | "available">) {
  if (item.available === undefined) return null;
  if (item.unit === "per_room_per_night") return `${item.available} available a night`;
  if (item.unit === "per_day") return `${item.available} available a day`;
  return `${item.available} available`;
}
