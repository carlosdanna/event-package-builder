// Returns the hotel's catalog: Proposales content merged with local prices and units.
import { getCatalog } from "@/lib/catalog/get-catalog";
import { resolveCompanyId } from "@/lib/proposales";
import { catalogResponseSchema } from "@/lib/schemas";
import { errorResponse } from "../error-response";

// Always ask Proposales; never serve a copy from build time.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const companyId = await resolveCompanyId();
    const body = catalogResponseSchema.parse({ items: await getCatalog(companyId) });
    return Response.json(body);
  } catch (error) {
    return errorResponse(error, "Could not load the catalog.");
  }
}
