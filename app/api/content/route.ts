// Lists the hotel's active content (products and services) from Proposales.
import { contentTitle, CATALOG_LANGUAGE } from "@/lib/catalog";
import { listContent, ProposalesError, resolveCompanyId } from "@/lib/proposales";
import type { ContentListResponse } from "@/lib/schemas";

// Always ask Proposales; never serve a copy from build time.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const companyId = await resolveCompanyId();
    const contents = await listContent({ companyId });

    const body: ContentListResponse = {
      items: contents.map((content) => ({
        productId: content.product_id,
        variationId: content.variation_id,
        title: contentTitle(content),
        description: content.description[CATALOG_LANGUAGE] ?? "",
      })),
    };
    return Response.json(body);
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown) {
  if (error instanceof ProposalesError) {
    console.error("Proposales request failed", error.kind, error.status, error.message);
    const status = error.kind === "timeout" ? 504 : error.kind === "configuration" ? 500 : 502;
    return Response.json({ error: error.message }, { status });
  }
  console.error("Unexpected error while listing content", error);
  return Response.json({ error: "Could not load content." }, { status: 500 });
}
