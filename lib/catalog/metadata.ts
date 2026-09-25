// What Proposales content cannot store: category, pricing unit, price and capacity.
// Keyed by the English content title in Proposales. Prices exclude tax.
import { z } from "zod";
import { catalogMetadataSchema, type CatalogMetadata } from "./schema";

const kronor = (amount: number) => amount * 100;

export const catalogMetadata: Record<string, CatalogMetadata> = z
  .record(z.string().min(1), catalogMetadataSchema)
  .parse({
    // Meeting spaces
    Boardroom: {
      category: "meeting_space",
      unit: "per_day",
      priceOre: kronor(6_000),
      capacity: 12,
      description:
        "Private boardroom for up to 12 people around one oak table, with daylight over the water, a wall-mounted screen and a whiteboard.",
    },
    "Harbour Room": {
      category: "meeting_space",
      unit: "per_day",
      priceOre: kronor(18_000),
      capacity: 50,
      description:
        "Bright meeting room for up to 50 people with harbour views, flexible seating in classroom, theatre or group tables, and a built-in sound system.",
    },
    "Grand Hall": {
      category: "meeting_space",
      unit: "per_day",
      priceOre: kronor(45_000),
      capacity: 150,
      description:
        "The hotel's largest room, for up to 150 people seated or 250 standing. Stage, dance floor and dimmable lighting for conferences, launches and weddings.",
    },

    // Catering
    "Coffee break": {
      category: "catering",
      unit: "per_person_per_day",
      priceOre: kronor(95),
      description:
        "Morning or afternoon break with freshly brewed coffee, tea, a cinnamon bun or seasonal pastry, and fruit.",
    },
    "Conference lunch": {
      category: "catering",
      unit: "per_person_per_day",
      priceOre: kronor(245),
      description:
        "Two-course seasonal lunch served in the restaurant, with salad buffet, bread, table water and coffee.",
    },
    "Three-course dinner": {
      category: "catering",
      unit: "per_person",
      priceOre: kronor(695),
      description:
        "Chef's three-course dinner built on Swedish seasonal produce, served at the table. Drinks are ordered separately.",
    },
    "Wedding dinner package": {
      category: "catering",
      unit: "per_person",
      priceOre: kronor(1_450),
      description:
        "Welcome drink and canapés, a three-course wedding dinner, wine pairing, wedding cake and coffee.",
    },
    "Vegetarian menu": {
      category: "catering",
      unit: "per_person",
      priceOre: kronor(0),
      description:
        "Plant-forward three-course menu for guests who prefer vegetarian food, served instead of the main menu at no extra cost.",
    },

    // Rooms
    "Standard double": {
      category: "rooms",
      unit: "per_room_per_night",
      priceOre: kronor(1_890),
      description:
        "Comfortable double room of about 20 square metres with a courtyard view and breakfast buffet included.",
    },
    "Superior double": {
      category: "rooms",
      unit: "per_room_per_night",
      priceOre: kronor(2_490),
      description:
        "Spacious double room of about 28 square metres with a view over the water, a seating area and breakfast included.",
    },
    Suite: {
      category: "rooms",
      unit: "per_room_per_night",
      priceOre: kronor(4_900),
      description:
        "Corner suite with separate living room, bathtub and views over Stockholm's inner harbour. Breakfast included.",
    },

    // Equipment
    "Projector and screen": {
      category: "equipment",
      unit: "per_day",
      priceOre: kronor(1_200),
      description:
        "High-brightness projector with a large screen, cables for common laptop connections, and a wireless presenter.",
    },
    "Microphone set": {
      category: "equipment",
      unit: "flat",
      priceOre: kronor(1_500),
      description:
        "Two wireless handheld microphones and one clip-on microphone, connected to the room's speakers, for the whole event.",
    },
  });
