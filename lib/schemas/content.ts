// Response of this app's GET /api/content, shared by the route and the browser.
import { z } from "zod";

export const contentListItemSchema = z.object({
  productId: z.number().int(),
  variationId: z.number().int(),
  title: z.string(),
  description: z.string(),
});
export type ContentListItem = z.infer<typeof contentListItemSchema>;

export const contentListResponseSchema = z.object({
  items: z.array(contentListItemSchema),
});
export type ContentListResponse = z.infer<typeof contentListResponseSchema>;

// Error body returned by this app's route handlers.
export const routeErrorSchema = z.object({ error: z.string() });
