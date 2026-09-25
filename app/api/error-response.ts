// Turns an error in a route handler into a JSON response with a message safe to show.
import { ProposalesError } from "@/lib/proposales";

export function errorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ProposalesError) {
    console.error("Proposales request failed", error.kind, error.status, error.message, error.issues);
    const status = error.kind === "timeout" ? 504 : error.kind === "configuration" ? 500 : 502;
    return Response.json({ error: error.message }, { status });
  }
  console.error(fallbackMessage, error);
  return Response.json({ error: fallbackMessage }, { status: 500 });
}
