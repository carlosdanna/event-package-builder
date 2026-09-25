// Creates a draft proposal in Proposales after the user confirms, and lists recent drafts.
// The package is rebuilt here from the salesperson's choices: prices and totals
// never come from the browser.
import { getCatalog } from "@/lib/catalog/get-catalog";
import { assemblePackage, summarize } from "@/lib/package";
import { createProposal, resolveCompanyId, searchProposals } from "@/lib/proposales";
import { PROPOSAL_SOURCE, buildCreateProposalInput, proposalTitle } from "@/lib/proposales/mapping";
import {
  createProposalRequestSchema,
  createProposalResponseSchema,
  recentProposalsResponseSchema,
} from "@/lib/schemas";
import { getTemplate } from "@/lib/templates";
import { errorResponse } from "../error-response";

export const dynamic = "force-dynamic";

const RECENT_LIMIT = 5;

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = createProposalRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "The request is not valid.";
    return Response.json({ error: message }, { status: 400 });
  }

  const { templateId, basics, customer, ...choices } = parsed.data;
  const template = getTemplate(templateId);
  if (!template) {
    return Response.json({ error: "Unknown template." }, { status: 400 });
  }

  try {
    const companyId = await resolveCompanyId();
    const catalog = await getCatalog(companyId);
    const lines = assemblePackage(template, basics, catalog, choices);
    const summary = summarize(lines, basics);
    if (!lines.some((line) => line.quantity > 0)) {
      return Response.json({ error: "The package is empty." }, { status: 400 });
    }

    const input = buildCreateProposalInput({ companyId, template, basics, lines, summary, customer });
    const created = await createProposal(input);

    return Response.json(
      createProposalResponseSchema.parse({
        uuid: created.uuid,
        url: created.url,
        title: proposalTitle(template, basics, customer),
        subtotalOre: summary.subtotalOre,
      }),
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error, "Could not create the draft proposal.");
  }
}

export async function GET() {
  try {
    const companyId = await resolveCompanyId();
    const found = await searchProposals({
      companyId,
      limit: RECENT_LIMIT,
      dataFilter: { source: PROPOSAL_SOURCE },
    });
    const items = found.map((proposal) => ({
      uuid: proposal.uuid,
      title: proposal.title,
      status: proposal.status,
      url: proposal.url,
      updatedAt: proposal.updated_at,
    }));
    return Response.json(recentProposalsResponseSchema.parse({ items }));
  } catch (error) {
    return errorResponse(error, "Could not load recent drafts.");
  }
}
