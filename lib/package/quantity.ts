// Quantities from pricing units, and choosing a meeting space.
import type { CatalogItem, PricingUnit } from "@/lib/catalog/schema";
import type { EventBasics } from "@/lib/schemas/event-basics";
import type { RoomsRule } from "@/lib/templates/schema";
import { eventLength } from "./event-length";

// The smallest meeting space that seats every guest, or null when none is big enough.
export function pickMeetingSpace(catalog: CatalogItem[], guests: number) {
  const fitting = meetingSpaces(catalog).filter((space) => (space.capacity ?? 0) >= guests);
  return fitting[0] ?? null;
}

// The largest meeting space, used when no space is big enough.
export function largestMeetingSpace(catalog: CatalogItem[]) {
  return meetingSpaces(catalog).at(-1) ?? null;
}

function meetingSpaces(catalog: CatalogItem[]) {
  return catalog
    .filter((item) => item.category === "meeting_space")
    .sort((a, b) => (a.capacity ?? 0) - (b.capacity ?? 0));
}

// One room per so many guests, rounded up.
export function roomsFor(rule: RoomsRule, guests: number) {
  return rule.kind === "per_guests" ? Math.ceil(guests / rule.guestsPerRoom) : 0;
}

export function quantityFor(
  item: { unit: PricingUnit },
  basics: EventBasics,
  roomsCount: number,
) {
  const { days, nights } = eventLength(basics.startDate, basics.endDate);

  switch (item.unit) {
    case "per_person":
      return basics.guests;
    case "per_person_per_day":
      return basics.guests * days;
    case "per_room_per_night":
      // Guests stay the night after a one-day event, so rooms are always at least one night.
      return roomsCount * Math.max(nights, 1);
    case "per_day":
      return days;
    case "flat":
      return 1;
  }
}
