// Server-only client for the Proposales developer interface, version 3.
import "server-only";
import { z } from "zod";
import { proposalesFetch } from "./client";
import { ProposalesError } from "./errors";
import {
  companySchema,
  companyTemplateSchema,
  contentArchivedSchema,
  contentCreatedSchema,
  contentItemSchema,
  contentRestoredSchema,
  createContentInputSchema,
  createProposalInputSchema,
  listOf,
  proposalCreatedSchema,
  proposalSearchResultSchema,
  updateContentInputSchema,
  type CreateContentInput,
  type CreateProposalInput,
  type UpdateContentInput,
} from "./schemas";

export { ProposalesError } from "./errors";
export type * from "./schemas";

export async function listCompanies() {
  const response = await proposalesFetch("/v3/companies", {
    schema: listOf(companySchema),
  });
  return response.data;
}

export async function listCompanyTemplates(companyId: number) {
  const response = await proposalesFetch(
    `/v3/companies/${companyId}/templates`,
    { schema: listOf(companyTemplateSchema) },
  );
  return response.data;
}

export async function listContent(options: {
  companyId: number;
  includeArchived?: boolean;
}) {
  const response = await proposalesFetch("/v3/content", {
    query: {
      company_id: options.companyId,
      include_archived: options.includeArchived || undefined,
    },
    schema: listOf(contentItemSchema),
  });
  return response.data;
}

export async function createContent(input: CreateContentInput) {
  const response = await proposalesFetch("/v3/content", {
    method: "POST",
    body: createContentInputSchema.parse(input),
    schema: contentCreatedSchema,
  });
  return response.data;
}

export async function updateContent(input: UpdateContentInput) {
  const response = await proposalesFetch("/v3/content", {
    method: "PUT",
    body: updateContentInputSchema.parse(input),
    schema: contentCreatedSchema,
  });
  return response.data;
}

// Archiving is idempotent and can be undone in Proposales.
export async function archiveContent(productIds: number[]) {
  const response = await proposalesFetch("/v3/content", {
    method: "DELETE",
    query: { action: "bulk" },
    body: { product_ids: productIds },
    schema: contentArchivedSchema,
  });
  return response.data;
}

export async function restoreContent(productIds: number[]) {
  const response = await proposalesFetch("/v3/content", {
    method: "POST",
    query: { action: "restore" },
    body: { product_ids: productIds },
    schema: contentRestoredSchema,
  });
  return response.data;
}

export async function createProposal(input: CreateProposalInput) {
  const response = await proposalesFetch("/v3/proposals", {
    method: "POST",
    body: createProposalInputSchema.parse(input),
    schema: proposalCreatedSchema,
  });
  return response.proposal;
}

// dataFilter matches keys in the proposal data, for example { source: "event-package-builder" }.
export async function searchProposals(options: {
  companyId?: number;
  recipientEmail?: string;
  limit?: number;
  dataFilter?: Record<string, string>;
}) {
  const filters = Object.fromEntries(
    Object.entries(options.dataFilter ?? {}).map(([key, value]) => [`filter[${key}]`, value]),
  );
  const response = await proposalesFetch("/v3/proposal-search", {
    query: {
      company_id: options.companyId,
      recipient_email: options.recipientEmail,
      limit: options.limit,
      ...filters,
    },
    schema: listOf(proposalSearchResultSchema),
  });
  return response.data;
}

const companyIdSchema = z.coerce.number().int().positive();

// Uses PROPOSALES_COMPANY_ID when set, otherwise the only company the token can see.
export async function resolveCompanyId(): Promise<number> {
  const configured = process.env.PROPOSALES_COMPANY_ID;
  if (configured) {
    const parsed = companyIdSchema.safeParse(configured);
    if (!parsed.success) {
      throw new ProposalesError(
        "configuration",
        "PROPOSALES_COMPANY_ID must be a positive whole number.",
      );
    }
    return parsed.data;
  }

  const companies = await listCompanies();
  if (companies.length === 1) return companies[0].id;

  throw new ProposalesError(
    "configuration",
    companies.length === 0
      ? "The Proposales token has no companies."
      : "The Proposales token has several companies. Set PROPOSALES_COMPANY_ID.",
  );
}
