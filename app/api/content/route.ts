// Returns the hotel's catalog: Proposales content merged with local prices and units.
import { getCatalog } from "@/lib/catalog/get-catalog";
import { ProposalesError } from "@/lib/proposales";
import { catalogResponseSchema } from "@/lib/schemas";

// Always ask Proposales; never serve a copy from build time.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const body = catalogResponseSchema.parse({ items: await getCatalog() });
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
  console.error("Unexpected error while loading the catalog", error);
  return Response.json({ error: "Could not load the catalog." }, { status: 500 });
}
