// The hotel's catalog: every item the templates can suggest, with its price.
// Proposales content has no price field, so prices live here and are sent
// with each proposal line. Items are matched to Proposales content by title.
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
  "room",
  "equipment",
  "package",
]);
export type CatalogCategory = z.infer<typeof catalogCategorySchema>;

export const catalogItemSchema = z.object({
  title: z.string().min(1),
  category: catalogCategorySchema,
  description: z.string().min(1),
  unitPriceOre: z.number().int().nonnegative(), // excluding tax
  pricingUnit: pricingUnitSchema,
  capacity: z.number().int().positive().optional(), // meeting spaces only
});
export type CatalogItem = z.infer<typeof catalogItemSchema>;

export const CATALOG_LANGUAGE = "en";

const kronor = (amount: number) => amount * 100;

export const catalog: CatalogItem[] = z.array(catalogItemSchema).parse([
  // Meeting spaces
  {
    title: "Boardroom",
    category: "meeting_space",
    capacity: 12,
    description:
      "Private boardroom for up to 12 people around one oak table, with daylight over the water, a wall-mounted screen and a whiteboard.",
    unitPriceOre: kronor(6_500),
    pricingUnit: "per_day",
  },
  {
    title: "Harbour Room",
    category: "meeting_space",
    capacity: 50,
    description:
      "Bright meeting room for up to 50 people with harbour views, flexible seating in classroom, theatre or group tables, and a built-in sound system.",
    unitPriceOre: kronor(18_000),
    pricingUnit: "per_day",
  },
  {
    title: "Grand Hall",
    category: "meeting_space",
    capacity: 150,
    description:
      "The hotel's largest room, for up to 150 people seated or 250 standing. Stage, dance floor and dimmable lighting for conferences, launches and weddings.",
    unitPriceOre: kronor(45_000),
    pricingUnit: "per_day",
  },

  // Catering
  {
    title: "Coffee break",
    category: "catering",
    description:
      "Morning or afternoon break with freshly brewed coffee, tea, a cinnamon bun or seasonal pastry, and fruit.",
    unitPriceOre: kronor(95),
    pricingUnit: "per_person_per_day",
  },
  {
    title: "Conference lunch",
    category: "catering",
    description:
      "Two-course seasonal lunch served in the restaurant, with salad buffet, bread, table water and coffee.",
    unitPriceOre: kronor(245),
    pricingUnit: "per_person_per_day",
  },
  {
    title: "Three-course dinner",
    category: "catering",
    description:
      "Chef's three-course dinner built on Swedish seasonal produce, served at the table. Drinks are ordered separately.",
    unitPriceOre: kronor(695),
    pricingUnit: "per_person",
  },
  {
    title: "Wedding dinner package",
    category: "catering",
    description:
      "Welcome drink and canapés, a three-course wedding dinner, wine pairing, wedding cake and coffee.",
    unitPriceOre: kronor(1_495),
    pricingUnit: "per_person",
  },
  {
    title: "Vegetarian menu",
    category: "catering",
    description:
      "Plant-forward three-course menu for guests who prefer vegetarian food, served alongside the main menu.",
    unitPriceOre: kronor(645),
    pricingUnit: "per_person",
  },

  // Rooms
  {
    title: "Standard double",
    category: "room",
    description:
      "Comfortable double room of about 20 square metres with a courtyard view and breakfast buffet included.",
    unitPriceOre: kronor(1_890),
    pricingUnit: "per_room_per_night",
  },
  {
    title: "Superior double",
    category: "room",
    description:
      "Spacious double room of about 28 square metres with a view over the water, a seating area and breakfast included.",
    unitPriceOre: kronor(2_490),
    pricingUnit: "per_room_per_night",
  },
  {
    title: "Suite",
    category: "room",
    description:
      "Corner suite with separate living room, bathtub and views over Stockholm's inner harbour. Breakfast included.",
    unitPriceOre: kronor(5_900),
    pricingUnit: "per_room_per_night",
  },

  // Equipment
  {
    title: "Projector and screen",
    category: "equipment",
    description:
      "High-brightness projector with a large screen, cables for common laptop connections, and a wireless presenter.",
    unitPriceOre: kronor(1_200),
    pricingUnit: "per_day",
  },
  {
    title: "Microphone set",
    category: "equipment",
    description:
      "Two wireless handheld microphones and one clip-on microphone, connected to the room's speakers.",
    unitPriceOre: kronor(950),
    pricingUnit: "per_day",
  },

  // Packages
  {
    title: "Full-day conference package",
    category: "package",
    description:
      "Everything for a full meeting day: meeting room, morning and afternoon coffee, conference lunch, projector, and water and fruit in the room.",
    unitPriceOre: kronor(1_150),
    pricingUnit: "per_person_per_day",
  },
  {
    title: "Wedding package",
    category: "package",
    description:
      "Coordination with our wedding host, ceremony setting on the terrace, flowers and table decoration, and a late-night snack.",
    unitPriceOre: kronor(39_500),
    pricingUnit: "flat",
  },
  {
    title: "Offsite day package",
    category: "package",
    description:
      "A day away from the office: meeting room, coffee breaks, lunch, and a guided walk around Skeppsholmen in the afternoon.",
    unitPriceOre: kronor(895),
    pricingUnit: "per_person_per_day",
  },
]);

// Proposales stores titles per language; the catalog is written in English.
export function contentTitle(content: { title: Record<string, string> }) {
  return content.title[CATALOG_LANGUAGE] ?? Object.values(content.title)[0] ?? "";
}

export function findCatalogItem(title: string) {
  return catalog.find((item) => item.title === title);
}
