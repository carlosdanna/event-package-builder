// Seeds Proposales with the "Hotel Skeppsholmen Demo" content from lib/catalog/metadata.ts.
//
//   pnpm seed             creates missing items, restores archived ones, updates
//                         descriptions whose price text changed, and archives retired items
//   pnpm seed --cleanup   archives every catalog item (can be restored by seeding again)
//
// Items are matched by their English title.
import {
  archiveContent,
  createContent,
  listContent,
  ProposalesError,
  resolveCompanyId,
  restoreContent,
  updateContent,
  type ContentItem,
} from "@/lib/proposales";
import {
  catalogMetadata,
  CATALOG_LANGUAGE,
  contentTitle,
  type CatalogMetadata,
  type PricingUnit,
} from "@/lib/catalog";

type Outcome = "created" | "restored" | "updated" | "skipped" | "archived" | "failed";
type Row = { title: string; outcome: Outcome; note?: string };

// Content an earlier seed created that is no longer part of the catalog.
const retiredTitles = [
  "Full-day conference package",
  "Wedding package",
  "Offsite day package",
];

const unitLabels: Record<PricingUnit, string> = {
  per_person: "per person",
  per_person_per_day: "per person per day",
  per_room_per_night: "per room per night",
  per_day: "per day",
  flat: "fixed price",
};

function formatKronor(ore: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(ore / 100);
}

function describe(entry: CatalogMetadata) {
  const price = `${formatKronor(entry.priceOre)} ${unitLabels[entry.unit]}, excluding tax.`;
  return `${entry.description}\n\nPrice: ${price}`;
}

function isArchived(content: ContentItem) {
  return content.is_archived ?? content.deactivated_at != null;
}

// Index existing content by title. If a title appears twice, an active item wins.
function indexByTitle(contents: ContentItem[]) {
  const byTitle = new Map<string, ContentItem>();
  for (const content of contents) {
    const title = contentTitle(content);
    const current = byTitle.get(title);
    if (!current || (isArchived(current) && !isArchived(content))) {
      byTitle.set(title, content);
    }
  }
  return byTitle;
}

function errorNote(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function seed(companyId: number, existing: Map<string, ContentItem>) {
  const rows: Row[] = [];
  const toRestore: { title: string; productId: number }[] = [];

  for (const [title, entry] of Object.entries(catalogMetadata)) {
    const found = existing.get(title);
    if (!found) {
      rows.push(await create(companyId, title, entry));
      continue;
    }

    // Updating works on archived content too, so restored items get the new text.
    const updated = await updateDescription(found, title, entry);
    if (updated.outcome === "failed" || !isArchived(found)) {
      rows.push(updated);
    } else {
      toRestore.push({ title, productId: found.product_id });
    }
  }

  if (toRestore.length > 0) {
    rows.push(...(await runBulk(toRestore, "restored", restoreContent)));
  }

  const toRetire: { title: string; productId: number }[] = [];
  for (const title of retiredTitles) {
    const found = existing.get(title);
    if (found && !isArchived(found)) toRetire.push({ title, productId: found.product_id });
  }
  if (toRetire.length > 0) {
    rows.push(...(await runBulk(toRetire, "archived", archiveContent)));
  }
  return rows;
}

async function create(companyId: number, title: string, entry: CatalogMetadata): Promise<Row> {
  try {
    const created = await createContent({
      company_id: companyId,
      language: CATALOG_LANGUAGE,
      title,
      description: describe(entry),
    });
    return { title, outcome: "created", note: `product ${created.product_id}` };
  } catch (error) {
    return { title, outcome: "failed", note: errorNote(error) };
  }
}

async function updateDescription(
  found: ContentItem,
  title: string,
  entry: CatalogMetadata,
): Promise<Row> {
  const description = describe(entry);
  if (found.description[CATALOG_LANGUAGE] === description) {
    return { title, outcome: "skipped", note: "already up to date" };
  }
  try {
    await updateContent({
      variation_id: found.variation_id,
      language: CATALOG_LANGUAGE,
      description,
    });
    return { title, outcome: "updated", note: `product ${found.product_id}` };
  } catch (error) {
    return { title, outcome: "failed", note: errorNote(error) };
  }
}

// Archives or restores several products in one request.
async function runBulk(
  entries: { title: string; productId: number }[],
  outcome: "archived" | "restored",
  action: (productIds: number[]) => Promise<unknown>,
): Promise<Row[]> {
  try {
    await action(entries.map((entry) => entry.productId));
    return entries.map((entry) => ({ title: entry.title, outcome, note: `product ${entry.productId}` }));
  } catch (error) {
    return entries.map((entry) => ({ title: entry.title, outcome: "failed", note: errorNote(error) }));
  }
}

async function cleanup(existing: Map<string, ContentItem>) {
  const rows: Row[] = [];
  const toArchive: { title: string; productId: number }[] = [];

  for (const title of Object.keys(catalogMetadata)) {
    const found = existing.get(title);
    if (found && !isArchived(found)) {
      toArchive.push({ title, productId: found.product_id });
    } else {
      rows.push({ title, outcome: "skipped", note: "not active" });
    }
  }

  if (toArchive.length > 0) {
    rows.push(...(await runBulk(toArchive, "archived", archiveContent)));
  }
  return rows;
}

function printSummary(rows: Row[]) {
  console.table(rows.map((row) => ({ title: row.title, outcome: row.outcome, note: row.note ?? "" })));

  const counts = new Map<Outcome, number>();
  for (const row of rows) counts.set(row.outcome, (counts.get(row.outcome) ?? 0) + 1);
  const totals = [...counts].map(([outcome, count]) => `${count} ${outcome}`).join(", ");
  console.log(`Summary: ${totals}.`);
}

async function main() {
  const isCleanup = process.argv.includes("--cleanup");
  const companyId = await resolveCompanyId();
  const existing = indexByTitle(await listContent({ companyId, includeArchived: true }));

  console.log(
    `${isCleanup ? "Archiving" : "Seeding"} Hotel Skeppsholmen Demo content for company ${companyId}.`,
  );
  const rows = isCleanup ? await cleanup(existing) : await seed(companyId, existing);
  printSummary(rows);

  if (rows.some((row) => row.outcome === "failed")) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message =
    error instanceof ProposalesError ? `Proposales error (${error.kind}): ${error.message}` : error;
  console.error(message);
  process.exitCode = 1;
});
