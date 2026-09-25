// Request and response bodies of this app's /api/proposals, shared by the route
// and the browser. The request carries choices only: never prices or totals.
import { z } from "zod";
import { currencySchema } from "@/lib/money";
import { customerDetailsDraftSchema } from "./customer";
import { packageSelectionSchema } from "./package-selection";

// Strict, so a request that sends prices or totals is refused instead of ignored.
export const createProposalRequestSchema = z.strictObject({
  ...packageSelectionSchema.omit({ budget: true }).shape,
  customer: customerDetailsDraftSchema,
});
export type CreateProposalRequest = z.input<typeof createProposalRequestSchema>;

export const createProposalResponseSchema = z.object({
  uuid: z.string(),
  url: z.string(),
  title: z.string(),
  subtotal: z.number().int().nonnegative(), // recalculated on the server
  currency: currencySchema,
});
export type CreateProposalResponse = z.infer<typeof createProposalResponseSchema>;

export const recentProposalSchema = z.object({
  uuid: z.string(),
  title: z.string(),
  status: z.string().nullable(),
  url: z.string(),
  updatedAt: z.number().int(), // milliseconds since 1970, as Proposales sends it
});
export type RecentProposal = z.infer<typeof recentProposalSchema>;

export const recentProposalsResponseSchema = z.object({
  items: z.array(recentProposalSchema),
});
