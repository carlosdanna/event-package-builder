import { describe, expect, it } from "vitest";
import { catalogMetadata } from "./metadata";

describe("catalogMetadata", () => {
  it("holds the thirteen catalog items with their prices in öre", () => {
    const prices = Object.fromEntries(
      Object.entries(catalogMetadata).map(([title, entry]) => [title, entry.priceOre]),
    );

    expect(prices).toEqual({
      Boardroom: 600_000,
      "Harbour Room": 1_800_000,
      "Grand Hall": 4_500_000,
      "Coffee break": 9_500,
      "Conference lunch": 24_500,
      "Three-course dinner": 69_500,
      "Wedding dinner package": 145_000,
      "Vegetarian menu": 0,
      "Standard double": 189_000,
      "Superior double": 249_000,
      Suite: 490_000,
      "Projector and screen": 120_000,
      "Microphone set": 150_000,
    });
  });

  it("gives a capacity to every meeting space and to nothing else", () => {
    for (const entry of Object.values(catalogMetadata)) {
      expect(entry.capacity !== undefined).toBe(entry.category === "meeting_space");
    }
  });

  it("limits spaces, rooms and equipment, and never catering", () => {
    const limits = Object.fromEntries(
      Object.entries(catalogMetadata).map(([title, entry]) => [title, entry.available ?? null]),
    );

    expect(limits).toEqual({
      Boardroom: 1,
      "Harbour Room": 1,
      "Grand Hall": 1,
      "Coffee break": null,
      "Conference lunch": null,
      "Three-course dinner": null,
      "Wedding dinner package": null,
      "Vegetarian menu": null,
      "Standard double": 40,
      "Superior double": 20,
      Suite: 4,
      "Projector and screen": 3,
      "Microphone set": 2,
    });
  });
});
