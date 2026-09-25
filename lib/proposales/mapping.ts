// Turns a package the server rebuilt into a Create Proposal request.
// Pure apart from the server-only guard, so it is easy to test.
import "server-only";
import { CATALOG_LANGUAGE } from "@/lib/catalog/merge";
import { formatDateRange, plural } from "@/lib/format";
import type { Currency } from "@/lib/money";
import { eventLength, type LineItem, type PackageSummary } from "@/lib/package";
import type { CustomerDetails } from "@/lib/schemas/customer";
import type { EventBasics } from "@/lib/schemas/event-basics";
import type { Template } from "@/lib/templates/schema";
import type { CreateProposalInput } from "./schemas";

// Marks drafts made by this app, so recent drafts can be found again.
export const PROPOSAL_SOURCE = "event-package-builder";

export type ProposalPackage = {
  companyId: number;
  template: Template;
  basics: EventBasics;
  currency: Currency;
  lines: LineItem[];
  summary: PackageSummary;
  customer: CustomerDetails;
};

export function buildCreateProposalInput(proposal: ProposalPackage): CreateProposalInput {
  const { companyId, template, basics, currency, lines, summary, customer } = proposal;

  return {
    company_id: companyId,
    language: CATALOG_LANGUAGE,
    title_md: proposalTitle(template, basics, customer),
    description_md: proposalDescription(basics),
    recipient: {
      ...splitName(customer.contactName),
      email: customer.contactEmail,
      company_name: customer.company,
    },
    blocks: lines.filter((line) => line.quantity > 0).map((line) => productBlock(line, currency)),
    data: {
      source: PROPOSAL_SOURCE,
      template_id: template.id,
      event_type: template.eventType,
      guests: basics.guests,
      start_date: basics.startDate,
      end_date: basics.endDate,
      currency,
      subtotal: summary.subtotal,
      // Internal: data is not shown to the customer.
      ...(customer.notes ? { notes: customer.notes } : {}),
    },
  };
}

export function proposalTitle(template: Template, basics: EventBasics, customer: CustomerDetails) {
  return `${template.name} for ${customer.company}, ${formatDateRange(basics.startDate, basics.endDate)}`;
}

function proposalDescription(basics: EventBasics) {
  const { days } = eventLength(basics.startDate, basics.endDate);
  return [
    `- **Guests:** ${basics.guests}`,
    `- **Dates:** ${formatDateRange(basics.startDate, basics.endDate)} (${plural(days, "day")})`,
    "",
    "All prices exclude tax.",
  ].join("\n");
}

function productBlock(line: LineItem, currency: Currency) {
  return {
    type: "product-block" as const,
    content_id: line.contentId,
    title: line.title,
    currency,
    quantity: line.quantity,
    // Proposales takes amounts in the smallest currency unit, as they are stored here.
    unit_value_without_discount_without_tax: line.unitPrice,
  };
}

// "Anna Maria Berg" becomes first name "Anna" and last name "Maria Berg".
export function splitName(fullName: string) {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return rest.length > 0 ? { first_name: firstName, last_name: rest.join(" ") } : { first_name: firstName };
}
