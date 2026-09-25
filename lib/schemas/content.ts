// Response of this app's GET /api/content, shared by the route and the browser.
import { z } from "zod";
import { catalogItemSchema } from "@/lib/catalog/schema";

export const catalogResponseSchema = z.object({
  items: z.array(catalogItemSchema),
});
export type CatalogResponse = z.infer<typeof catalogResponseSchema>;
