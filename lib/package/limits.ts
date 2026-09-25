// Physical limits: the hotel has only so many rooms, halls and projectors.
// Catering has no such limit, so its items have no maximum.
import type { CatalogItem } from "@/lib/catalog/schema";
import type { EventBasics } from "@/lib/schemas/event-basics";
import type { LineItem } from "./build";
import { capacityIssues, type CapacityIssue } from "./capacity";
import { eventLength } from "./event-length";

type Limited = Pick<CatalogItem, "unit" | "available">;

// The most that can be booked for the event, or null when there is no limit.
// Each room or space can be booked once per night or day of the event.
export function maxQuantityFor(item: Limited, basics: EventBasics) {
  if (item.available === undefined) return null;
  const { days, nights } = eventLength(basics.startDate, basics.endDate);

  switch (item.unit) {
    case "per_day":
      return item.available * days;
    case "per_room_per_night":
      // Guests stay the night after a one-day event, as in quantityFor.
      return item.available * Math.max(nights, 1);
    case "flat":
      return item.available;
    case "per_person":
    case "per_person_per_day":
      return null;
  }
}

type Checked = Pick<LineItem, "contentId" | "title" | "quantity" | "maxQuantity">;

// Lines that ask for more than the hotel has, such as a hall booked for more
// days than the event lasts.
export function limitIssues(lines: Checked[]): CapacityIssue[] {
  const issues: CapacityIssue[] = [];
  for (const line of lines) {
    if (line.maxQuantity === null || line.quantity <= line.maxQuantity) continue;
    issues.push({
      contentId: line.contentId,
      title: line.title,
      reason: `At most ${line.maxQuantity} for these dates, you have ${line.quantity}`,
    });
  }
  return issues;
}

// How many the rules suggested beyond what the hotel has, such as 60 guests
// needing 60 rooms when there are 40. Zero when the suggestion fits. This is
// a notice, not an error: the package books what exists.
export function shortfall(line: Pick<LineItem, "neededQuantity" | "maxQuantity">) {
  if (line.maxQuantity === null) return 0;
  return Math.max(line.neededQuantity - line.maxQuantity, 0);
}

// Everything that stops the package from being booked: spaces too small for
// the guests and items beyond what the hotel has. Checked in the browser
// and again on the server before a draft is created.
export function packageIssues(lines: LineItem[], guests: number): CapacityIssue[] {
  return [...capacityIssues(lines, guests), ...limitIssues(lines)];
}
