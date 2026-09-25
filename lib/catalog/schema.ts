// Zod schemas for the catalog. Safe to import in the browser.
import { z } from "zod";

export const pricingUnitSchema = z.enum([
  "per_person",
  "per_person_per_day",
  "per_room_per_night",
  "per_day",
  "flat",
]);
export type PricingUnit = z.infer<typeof pricingUnitSchema>;

export const catalogCategorySchema = z.enum([
  "meeting_space",
  "catering",
  "rooms",
  "equipment",
  "extras",
]);
export type CatalogCategory = z.infer<typeof catalogCategorySchema>;

// What Proposales cannot store for a content item.
const pricingFields = {
  category: catalogCategorySchema,
  unit: pricingUnitSchema,
  priceOre: z.number().int().nonnegative(), // excluding tax
  capacity: z.number().int().positive().optional(), // meeting spaces only
};

function capacityOnlyForMeetingSpaces(item: {
  category: CatalogCategory;
  capacity?: number;
}) {
  return item.capacity === undefined || item.category === "meeting_space";
}

const capacityRule = {
  message: "Only meeting spaces can have a capacity.",
  path: ["capacity"],
};

export const catalogItemSchema = z
  .object({
    contentId: z.number().int().positive(), // the Proposales variation_id
    title: z.string().min(1),
    ...pricingFields,
  })
  .refine(capacityOnlyForMeetingSpaces, capacityRule);
export type CatalogItem = z.infer<typeof catalogItemSchema>;

// One entry in lib/catalog/metadata.ts. The description is only used by the seed script.
export const catalogMetadataSchema = z
  .object({
    ...pricingFields,
    description: z.string().min(1),
  })
  .refine(capacityOnlyForMeetingSpaces, capacityRule);
export type CatalogMetadata = z.infer<typeof catalogMetadataSchema>;
