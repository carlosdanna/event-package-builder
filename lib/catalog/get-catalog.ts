// Loads the catalog: active Proposales content merged with the local metadata.
import "server-only";
import { listContent } from "@/lib/proposales";
import { mergeCatalog } from "./merge";
import { catalogMetadata } from "./metadata";

export async function getCatalog(companyId: number) {
  const contents = await listContent({ companyId });
  const { items, warnings } = mergeCatalog(contents, catalogMetadata);

  for (const warning of warnings) console.warn(`Catalog: ${warning}`);
  return items;
}
