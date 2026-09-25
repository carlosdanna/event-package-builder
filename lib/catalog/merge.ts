// Merges Proposales content with the local catalog metadata. Pure, no outside calls.
import {
  catalogCategorySchema,
  catalogItemSchema,
  type CatalogItem,
  type CatalogMetadata,
} from "./schema";

export const CATALOG_LANGUAGE = "en";

// The fields of a Proposales content item this merge needs.
export type CatalogContent = {
  variation_id: number;
  title: Record<string, string>;
};

// Proposales stores titles per language; the metadata is keyed by the English title.
export function contentTitle(content: { title: Record<string, string> }) {
  return content.title[CATALOG_LANGUAGE] ?? Object.values(content.title)[0] ?? "";
}

export function mergeCatalog(
  contents: CatalogContent[],
  metadata: Record<string, CatalogMetadata>,
) {
  const items: CatalogItem[] = [];
  const warnings: string[] = [];
  const seenTitles = new Set<string>();

  for (const content of contents) {
    const title = contentTitle(content);
    const entry = metadata[title];

    if (!entry) {
      warnings.push(`Content "${title}" (variation ${content.variation_id}) has no catalog metadata and is left out.`);
      continue;
    }
    if (seenTitles.has(title)) {
      warnings.push(`Content "${title}" appears more than once; variation ${content.variation_id} is left out.`);
      continue;
    }
    seenTitles.add(title);
    items.push(toCatalogItem(content, title, entry));
  }

  for (const title of Object.keys(metadata)) {
    if (!seenTitles.has(title)) {
      warnings.push(`Catalog metadata "${title}" has no content in Proposales. Run pnpm seed.`);
    }
  }

  return { items: items.sort(byCategoryThenTitle), warnings };
}

function toCatalogItem(
  content: CatalogContent,
  title: string,
  entry: CatalogMetadata,
): CatalogItem {
  // The description is only for the seed script, so it stays out of the catalog item.
  const item = {
    contentId: content.variation_id,
    title,
    category: entry.category,
    unit: entry.unit,
    priceOre: entry.priceOre,
  };
  return catalogItemSchema.parse({
    ...item,
    ...(entry.capacity !== undefined && { capacity: entry.capacity }),
    ...(entry.available !== undefined && { available: entry.available }),
  });
}

const categoryOrder = catalogCategorySchema.options;

function byCategoryThenTitle(a: CatalogItem, b: CatalogItem) {
  const byCategory = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
  return byCategory !== 0 ? byCategory : a.title.localeCompare(b.title);
}
