import { describe, expect, it } from "vitest";
import { mergeCatalog, type CatalogContent } from "./merge";
import { catalogMetadataSchema, type CatalogMetadata } from "./schema";

const boardroom: CatalogMetadata = {
  category: "meeting_space",
  unit: "per_day",
  prices: { SEK: 600_000, EUR: 52_000, USD: 57_000, GBP: 45_000 },
  capacity: 12,
  description: "Private boardroom.",
};

const coffee: CatalogMetadata = {
  category: "catering",
  unit: "per_person_per_day",
  prices: { SEK: 9_500, EUR: 850, USD: 900, GBP: 700 },
  description: "Coffee and a bun.",
};

function content(variationId: number, title: Record<string, string>): CatalogContent {
  return { variation_id: variationId, title };
}

describe("mergeCatalog", () => {
  it("combines content with its metadata, using the variation as content id", () => {
    const result = mergeCatalog([content(101, { en: "Boardroom" })], { Boardroom: boardroom });

    expect(result.items).toEqual([
      {
        contentId: 101,
        title: "Boardroom",
        category: "meeting_space",
        unit: "per_day",
        prices: { SEK: 600_000, EUR: 52_000, USD: 57_000, GBP: 45_000 },
        capacity: 12,
      },
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("keeps how many the hotel has", () => {
    const [item] = mergeCatalog([content(1, { en: "Boardroom" })], {
      Boardroom: { ...boardroom, available: 1 },
    }).items;

    expect(item.available).toBe(1);
  });

  it("leaves out the description, which only the seed script uses", () => {
    const [item] = mergeCatalog([content(1, { en: "Coffee break" })], {
      "Coffee break": coffee,
    }).items;

    expect(item).not.toHaveProperty("description");
    expect(item).not.toHaveProperty("capacity");
    expect(item).not.toHaveProperty("available");
  });

  it("leaves out content without metadata and warns about it", () => {
    const result = mergeCatalog(
      [content(1, { en: "Boardroom" }), content(2, { en: "Spa access" })],
      { Boardroom: boardroom },
    );

    expect(result.items.map((item) => item.title)).toEqual(["Boardroom"]);
    expect(result.warnings).toEqual([
      'Content "Spa access" (variation 2) has no catalog metadata and is left out.',
    ]);
  });

  it("warns about metadata that has no content in Proposales", () => {
    const result = mergeCatalog([content(1, { en: "Boardroom" })], {
      Boardroom: boardroom,
      "Coffee break": coffee,
    });

    expect(result.items).toHaveLength(1);
    expect(result.warnings).toEqual([
      'Catalog metadata "Coffee break" has no content in Proposales. Run pnpm seed.',
    ]);
  });

  it("matches by the English title, falling back to the first language", () => {
    const result = mergeCatalog(
      [
        content(1, { sv: "Styrelserum", en: "Boardroom" }),
        content(2, { sv: "Coffee break" }),
      ],
      { Boardroom: boardroom, "Coffee break": coffee },
    );

    expect(result.items.map((item) => item.contentId)).toEqual([1, 2]);
    expect(result.warnings).toEqual([]);
  });

  it("keeps the first of two items with the same title and warns about the second", () => {
    const result = mergeCatalog(
      [content(1, { en: "Boardroom" }), content(2, { en: "Boardroom" })],
      { Boardroom: boardroom },
    );

    expect(result.items.map((item) => item.contentId)).toEqual([1]);
    expect(result.warnings).toEqual([
      'Content "Boardroom" appears more than once; variation 2 is left out.',
    ]);
  });

  it("sorts items by category, then by title", () => {
    const result = mergeCatalog(
      [
        content(1, { en: "Coffee break" }),
        content(2, { en: "Harbour Room" }),
        content(3, { en: "Boardroom" }),
      ],
      { "Coffee break": coffee, "Harbour Room": { ...boardroom, capacity: 50 }, Boardroom: boardroom },
    );

    expect(result.items.map((item) => item.title)).toEqual([
      "Boardroom",
      "Harbour Room",
      "Coffee break",
    ]);
  });

  it("rejects metadata that breaks the catalog rules", () => {
    const invalid = { ...coffee, capacity: 40 };

    expect(() =>
      mergeCatalog([content(1, { en: "Coffee break" })], { "Coffee break": invalid }),
    ).toThrow("Only meeting spaces can have a capacity.");
  });
});

describe("catalogMetadataSchema", () => {
  it("allows a limit on items priced per day, per room per night or as a flat fee", () => {
    expect(catalogMetadataSchema.safeParse({ ...boardroom, available: 1 }).success).toBe(true);
  });

  it("refuses a limit on items priced per person", () => {
    const result = catalogMetadataSchema.safeParse({ ...coffee, available: 100 });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["available"]);
  });
});
