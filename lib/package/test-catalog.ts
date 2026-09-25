// The real catalog metadata with made-up content ids, for tests.
import { catalogMetadata, mergeCatalog } from "@/lib/catalog";

export const testCatalog = mergeCatalog(
  Object.keys(catalogMetadata).map((title, index) => ({
    variation_id: index + 1,
    title: { en: title },
  })),
  catalogMetadata,
).items;

export function idOf(title: string) {
  const item = testCatalog.find((entry) => entry.title === title);
  if (!item) throw new Error(`No test catalog item "${title}".`);
  return item.contentId;
}
