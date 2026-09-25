// Meeting spaces in the package that cannot seat every guest.
import type { LineItem } from "./build";

export type CapacityIssue = { contentId: number; title: string; reason: string };

export function capacityIssues(lines: LineItem[], guests: number): CapacityIssue[] {
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
