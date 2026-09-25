// What the salesperson chose in the wizard. The server rebuilds the package
// from this, so totals never come from the browser.
import { z } from "zod";
import { currencySchema } from "@/lib/money";
import { templateIdSchema } from "@/lib/templates/schema";
import { budgetSchema, eventBasicsSchema } from "./event-basics";

// Well above any real event, and small enough that totals stay exact whole numbers.
export const MAX_QUANTITY = 10_000;
// More than the catalog holds, so a real package never reaches it.
const MAX_CHANGED_ITEMS = 100;

const contentIdSchema = z.number().int().positive();
const contentIdsSchema = z.array(contentIdSchema).max(MAX_CHANGED_ITEMS);

export const packageSelectionSchema = z.object({
  templateId: templateIdSchema,
  basics: eventBasicsSchema,
  currency: currencySchema,
  budget: budgetSchema,
  addedContentIds: contentIdsSchema,
  removedContentIds: contentIdsSchema,
  overrides: z
    .record(
      z.coerce.number().int().positive(),
      z.number().int().nonnegative().max(MAX_QUANTITY, `A quantity can be at most ${MAX_QUANTITY}.`),
    )
    .refine((overrides) => Object.keys(overrides).length <= MAX_CHANGED_ITEMS, {
      message: "Too many quantity changes.",
    }),
});
export type PackageSelection = z.infer<typeof packageSelectionSchema>;
