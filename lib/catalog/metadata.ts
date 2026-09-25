// What Proposales content cannot store: category, pricing unit, prices, capacity
// and how many the hotel has.
// Keyed by the English content title in Proposales. Prices exclude tax.
import { z } from "zod";
import { toMinorUnits, type Currency } from "@/lib/money";
import { catalogMetadataSchema, type CatalogMetadata } from "./schema";

// List prices in whole units of each currency, stored in the smallest unit.
// Each currency has its own price list; none is converted from another.
function listPrices(prices: Record<Currency, number>) {
  return Object.fromEntries(
    Object.entries(prices).map(([currency, amount]) => [currency, toMinorUnits(amount)]),
  );
}

export const catalogMetadata: Record<string, CatalogMetadata> = z
  .record(z.string().min(1), catalogMetadataSchema)
  .parse({
    // Meeting spaces
    Boardroom: {
      category: "meeting_space",
      unit: "per_day",
      prices: listPrices({ SEK: 6_000, EUR: 520, USD: 570, GBP: 450 }),
      capacity: 12,
      available: 1,
      description:
        "Private boardroom for up to 12 people around one oak table, with daylight over the water, a wall-mounted screen and a whiteboard.",
    },
    "Harbour Room": {
      category: "meeting_space",
      unit: "per_day",
      prices: listPrices({ SEK: 18_000, EUR: 1_560, USD: 1_700, GBP: 1_350 }),
      capacity: 50,
      available: 1,
      description:
        "Bright meeting room for up to 50 people with harbour views, flexible seating in classroom, theatre or group tables, and a built-in sound system.",
    },
    "Grand Hall": {
      category: "meeting_space",
      unit: "per_day",
      prices: listPrices({ SEK: 45_000, EUR: 3_900, USD: 4_250, GBP: 3_350 }),
      capacity: 150,
      available: 1,
      description:
        "The hotel's largest room, for up to 150 people seated or 250 standing. Stage, dance floor and dimmable lighting for conferences, launches and weddings.",
    },

    // Catering
    "Coffee break": {
      category: "catering",
      unit: "per_person_per_day",
      prices: listPrices({ SEK: 95, EUR: 8.5, USD: 9, GBP: 7 }),
      description:
        "Morning or afternoon break with freshly brewed coffee, tea, a cinnamon bun or seasonal pastry, and fruit.",
    },
    "Conference lunch": {
      category: "catering",
      unit: "per_person_per_day",
      prices: listPrices({ SEK: 245, EUR: 21, USD: 23, GBP: 18 }),
      description:
        "Two-course seasonal lunch served in the restaurant, with salad buffet, bread, table water and coffee.",
    },
    "Three-course dinner": {
      category: "catering",
      unit: "per_person",
      prices: listPrices({ SEK: 695, EUR: 60, USD: 65, GBP: 52 }),
      description:
        "Chef's three-course dinner built on Swedish seasonal produce, served at the table. Drinks are ordered separately.",
    },
    "Wedding dinner package": {
      category: "catering",
      unit: "per_person",
      prices: listPrices({ SEK: 1_450, EUR: 125, USD: 138, GBP: 108 }),
      description:
        "Welcome drink and canapés, a three-course wedding dinner, wine pairing, wedding cake and coffee.",
    },
    "Vegetarian menu": {
      category: "catering",
      unit: "per_person",
      prices: listPrices({ SEK: 0, EUR: 0, USD: 0, GBP: 0 }),
      description:
        "Plant-forward three-course menu for guests who prefer vegetarian food, served instead of the main menu at no extra cost.",
    },

    // Rooms
    "Standard double": {
      category: "rooms",
      unit: "per_room_per_night",
      prices: listPrices({ SEK: 1_890, EUR: 165, USD: 179, GBP: 140 }),
      available: 40,
      description:
        "Comfortable double room of about 20 square metres with a courtyard view and breakfast buffet included.",
    },
    "Superior double": {
      category: "rooms",
      unit: "per_room_per_night",
      prices: listPrices({ SEK: 2_490, EUR: 215, USD: 235, GBP: 185 }),
      available: 20,
      description:
        "Spacious double room of about 28 square metres with a view over the water, a seating area and breakfast included.",
    },
    Suite: {
      category: "rooms",
      unit: "per_room_per_night",
      prices: listPrices({ SEK: 4_900, EUR: 425, USD: 465, GBP: 365 }),
      available: 4,
      description:
        "Corner suite with separate living room, bathtub and views over Stockholm's inner harbour. Breakfast included.",
    },

    // Equipment
    "Projector and screen": {
      category: "equipment",
      unit: "per_day",
      prices: listPrices({ SEK: 1_200, EUR: 105, USD: 115, GBP: 89 }),
      available: 3,
      description:
        "High-brightness projector with a large screen, cables for common laptop connections, and a wireless presenter.",
    },
    "Microphone set": {
      category: "equipment",
      unit: "flat",
      prices: listPrices({ SEK: 1_500, EUR: 130, USD: 142, GBP: 112 }),
      available: 2,
      description:
        "Two wireless handheld microphones and one clip-on microphone, connected to the room's speakers, for the whole event.",
    },
  });
