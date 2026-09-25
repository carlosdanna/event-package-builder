// Zod schemas for the parts of Proposales responses this app reads.
// Source: https://docs.proposales.com/openapi.json (version 2026.09.02).
// Objects are loose so new fields from Proposales do not break parsing.
import { z } from "zod";

// Text keyed by language code, for example { en: "Boardroom" }.
export const localizedTextSchema = z.record(z.string(), z.string());

export const errorBodySchema = z.object({
  error: z.object({
    message: z.string(),
    issues: z
      .array(
        z.looseObject({
          code: z.string(),
          path: z.array(z.union([z.string(), z.number()])),
          message: z.string(),
        }),
      )
      .optional(),
  }),
});

export const companySchema = z.looseObject({
  id: z.number().int(),
  name: z.string(),
  currency: z.string(),
  timezone: z.string(),
});
export type Company = z.infer<typeof companySchema>;

export const companyTemplateSchema = z.looseObject({
  uuid: z.string(),
  title: z.string().nullish(),
  language: z.string(),
});
export type CompanyTemplate = z.infer<typeof companyTemplateSchema>;

export const contentItemSchema = z.looseObject({
  product_id: z.number().int(),
  variation_id: z.number().int(),
  title: localizedTextSchema,
  description: localizedTextSchema,
  created_at: z.number().int(),
  deactivated_at: z.number().int().nullish(),
  is_archived: z.boolean().optional(),
});
export type ContentItem = z.infer<typeof contentItemSchema>;

export const createContentInputSchema = z.object({
  company_id: z.number().int().positive(),
  language: z.string().min(2),
  title: z.string().min(1),
  description: z.string().optional(),
});
export type CreateContentInput = z.infer<typeof createContentInputSchema>;

export const contentCreatedSchema = z.object({
  data: z.looseObject({
    product_id: z.number().int(),
    variation_id: z.number().int(),
  }),
});

export const contentArchivedSchema = z.object({
  data: z.looseObject({
    archived_count: z.number().int(),
    product_ids: z.array(z.number().int()),
  }),
});

export const contentRestoredSchema = z.object({
  data: z.looseObject({
    restored_count: z.number().int(),
    product_ids: z.array(z.number().int()),
  }),
});

const recipientSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
});

// Prices are in öre, the smallest unit of Swedish kronor.
const productBlockSchema = z.object({
  type: z.literal("product-block"),
  content_id: z.number().int().positive(), // the content variation identifier
  title: z.string().optional(),
  description: z.string().optional(),
  currency: z.string().optional(),
  quantity: z.number().nonnegative(),
  unit_value_without_discount_without_tax: z.number().int().nonnegative(),
});

export const createProposalInputSchema = z.object({
  company_id: z.number().int().positive(),
  language: z.string().min(2),
  title_md: z.string().optional(),
  description_md: z.string().optional(),
  contact_email: z.email().optional(),
  recipient: recipientSchema.optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  tracking: z.object({ created_from_template: z.string() }).optional(),
  blocks: z.array(productBlockSchema).optional(),
});
export type CreateProposalInput = z.infer<typeof createProposalInputSchema>;

export const proposalCreatedSchema = z.object({
  proposal: z.looseObject({
    uuid: z.string(),
    url: z.string(),
  }),
});
export type ProposalCreated = z.infer<typeof proposalCreatedSchema>["proposal"];

export const proposalSearchResultSchema = z.looseObject({
  uuid: z.string(),
  series_uuid: z.string(),
  title: z.string(),
  status: z.string().nullable(),
  company_id: z.number().int(),
  url: z.string(),
  created_at: z.number().int(),
  updated_at: z.number().int(),
  data: z.record(z.string(), z.unknown()),
});
export type ProposalSearchResult = z.infer<typeof proposalSearchResultSchema>;

// Most list endpoints wrap their items in { data: [...] }.
export function listOf<T extends z.ZodType>(item: T) {
  return z.object({ data: z.array(item) });
}
