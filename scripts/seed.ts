// Seeds Proposales with the "Hotel Skeppsholmen Demo" content from lib/catalog.
//
//   pnpm seed             creates missing items, restores archived ones, skips the rest
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
  type ContentItem,
} from "@/lib/proposales";
import {
  catalog,
  CATALOG_LANGUAGE,
  contentTitle,
  type CatalogItem,
  type PricingUnit,
} from "@/lib/catalog";

type Outcome = "created" | "restored" | "skipped" | "archived" | "failed";
type Row = { title: string; outcome: Outcome; note?: string };

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

function describe(item: CatalogItem) {
  const price = `${formatKronor(item.unitPriceOre)} ${unitLabels[item.pricingUnit]}, excluding tax.`;
  return `${item.description}\n\nPrice: ${price}`;
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

  for (const item of catalog) {
    const found = existing.get(item.title);
    if (found && !isArchived(found)) {
      rows.push({ title: item.title, outcome: "skipped", note: "already exists" });
      continue;
    }
    if (found) {
      toRestore.push({ title: item.title, productId: found.product_id });
      continue;
    }
    try {
      const created = await createContent({
        company_id: companyId,
        language: CATALOG_LANGUAGE,
        title: item.title,
        description: describe(item),
      });
      rows.push({ title: item.title, outcome: "created", note: `product ${created.product_id}` });
    } catch (error) {
      rows.push({ title: item.title, outcome: "failed", note: errorNote(error) });
    }
  }

  if (toRestore.length > 0) {
    try {
      await restoreContent(toRestore.map((entry) => entry.productId));
      for (const entry of toRestore) {
        rows.push({ title: entry.title, outcome: "restored", note: `product ${entry.productId}` });
      }
    } catch (error) {
      for (const entry of toRestore) {
        rows.push({ title: entry.title, outcome: "failed", note: errorNote(error) });
      }
    }
  }
  return rows;
}

async function cleanup(existing: Map<string, ContentItem>) {
  const rows: Row[] = [];
  const toArchive: { title: string; productId: number }[] = [];

  for (const item of catalog) {
    const found = existing.get(item.title);
    if (found && !isArchived(found)) {
      toArchive.push({ title: item.title, productId: found.product_id });
    } else {
      rows.push({ title: item.title, outcome: "skipped", note: "not active" });
    }
  }

  if (toArchive.length > 0) {
    try {
      await archiveContent(toArchive.map((entry) => entry.productId));
      for (const entry of toArchive) {
        rows.push({ title: entry.title, outcome: "archived", note: `product ${entry.productId}` });
      }
    } catch (error) {
      for (const entry of toArchive) {
        rows.push({ title: entry.title, outcome: "failed", note: errorNote(error) });
      }
    }
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
