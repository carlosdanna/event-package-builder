// Manual quantity changes on line items.
import type { LineItem } from "./build";

export function applyOverride(lines: LineItem[], contentId: number, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new RangeError(`Quantity must be a whole number of zero or more, got ${quantity}.`);
  }
  return lines.map((line) =>
    line.contentId === contentId ? withQuantity(line, quantity, "overridden") : line,
  );
}

export function resetOverride(lines: LineItem[], contentId: number) {
  return lines.map((line) =>
    line.contentId === contentId ? withQuantity(line, line.derivedQuantity, "derived") : line,
  );
}

// Carries overrides from the previous package onto a freshly built one, for
// example after the guest count or dates change. An override is the
// salesperson's explicit choice, so it is kept as long as the same content
// item is still in the package; its derived quantity still updates, so a
// reset goes to the new suggestion. An override for an item that is no
// longer in the package, such as a meeting space swapped for a bigger one,
// is dropped.
export function reapplyOverrides(freshLines: LineItem[], previousLines: LineItem[]) {
  return previousLines
    .filter((line) => line.source === "overridden")
    .reduce(
      (lines, override) => applyOverride(lines, override.contentId, override.quantity),
      freshLines,
    );
}

function withQuantity(line: LineItem, quantity: number, source: LineItem["source"]): LineItem {
  return { ...line, quantity, lineTotal: line.unitPrice * quantity, source };
}
