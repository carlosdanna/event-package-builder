// What the salesperson chose in the wizard. The server rebuilds the package
// from this, so totals never come from the browser.
import { z } from "zod";
import { templateIdSchema } from "@/lib/templates/schema";
import { budgetOreSchema, eventBasicsSchema } from "./event-basics";

const contentIdSchema = z.number().int().positive();

export const packageSelectionSchema = z.object({
  templateId: templateIdSchema,
  basics: eventBasicsSchema,
  budgetOre: budgetOreSchema,
  addedContentIds: z.array(contentIdSchema),
  removedContentIds: z.array(contentIdSchema),
  overrides: z.record(
    z.coerce.number().int().positive(),
    z.number().int().nonnegative(),
  ),
});
export type PackageSelection = z.infer<typeof packageSelectionSchema>;
