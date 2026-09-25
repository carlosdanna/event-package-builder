// Meeting spaces in the package that cannot seat every guest.
import type { CatalogItem } from "@/lib/catalog/schema";

export type CapacityIssue = { contentId: number; title: string; reason: string };

type Seated = Pick<CatalogItem, "contentId" | "title" | "capacity">;

export function capacityIssues(lines: Seated[], guests: number): CapacityIssue[] {
  const issues: CapacityIssue[] = [];
  for (const line of lines) {
    if (line.capacity === undefined || line.capacity >= guests) continue;
    issues.push({
      contentId: line.contentId,
      title: line.title,
      reason: `Seats ${line.capacity}, you need ${guests}`,
    });
  }
  return issues;
}

// Why a meeting space is too small, or null when it seats every guest.
export function meetingSpaceIssue(item: Seated, guests: number) {
  return capacityIssues([item], guests)[0]?.reason ?? null;
}
