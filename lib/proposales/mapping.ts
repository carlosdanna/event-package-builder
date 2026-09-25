// Turns a package the server rebuilt into a Create Proposal request.
// Pure apart from the server-only guard, so it is easy to test.
import "server-only";
import { CATALOG_LANGUAGE } from "@/lib/catalog/merge";
import { formatDateRange } from "@/lib/format";
import { eventLength, type LineItem, type PackageSummary } from "@/lib/package";
import type { CustomerDetails } from "@/lib/schemas/customer";
import type { EventBasics } from "@/lib/schemas/event-basics";
import type { Template } from "@/lib/templates/schema";
import type { CreateProposalInput } from "./schemas";

// Marks drafts made by this app, so recent drafts can be found again.
export const PROPOSAL_SOURCE = "event-package-builder";
export const PROPOSAL_CURRENCY = "SEK";

export type ProposalPackage = {
  companyId: number;
  template: Template;
  basics: EventBasics;
  lines: LineItem[];
  summary: PackageSummary;
  customer: CustomerDetails;
};

export function buildCreateProposalInput(proposal: ProposalPackage): CreateProposalInput {
  const { companyId, template, basics, lines, summary, customer } = proposal;

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
    blocks: lines.filter((line) => line.quantity > 0).map(productBlock),
    data: {
      source: PROPOSAL_SOURCE,
      template_id: template.id,
      event_type: template.eventType,
      guests: basics.guests,
      start_date: basics.startDate,
      end_date: basics.endDate,
      subtotal_ore: summary.subtotalOre,
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
    `**Guests:** ${basics.guests}`,
    `**Dates:** ${formatDateRange(basics.startDate, basics.endDate)} (${days} ${days === 1 ? "day" : "days"})`,
    "",
    "All prices exclude tax.",
  ].join("\n");
}

function productBlock(line: LineItem) {
  return {
    type: "product-block" as const,
    content_id: line.contentId,
    title: line.title,
    currency: PROPOSAL_CURRENCY,
    quantity: line.quantity,
    unit_value_without_discount_without_tax: toProposalesAmount(line.unitPriceOre),
  };
}

// Proposales takes amounts in the smallest currency unit, so öre are sent as they are.
export function toProposalesAmount(ore: number) {
  return ore;
}

// "Anna Maria Berg" becomes first name "Anna" and last name "Maria Berg".
export function splitName(fullName: string) {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return rest.length > 0 ? { first_name: firstName, last_name: rest.join(" ") } : { first_name: firstName };
}
