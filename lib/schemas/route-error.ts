// Error body returned by every route handler in this app.
import { z } from "zod";

export const routeErrorSchema = z.object({ error: z.string() });
