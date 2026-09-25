// Turns an error in a route handler into a JSON response. The details go to
// the server log; the browser gets a fixed message, because text from
// Proposales is not ours to show.
import { ProposalesError } from "@/lib/proposales";

export function errorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ProposalesError) {
    console.error("Proposales request failed", error.kind, error.status, error.message, error.issues);
    return Response.json({ error: messageFor(error) }, { status: statusFor(error) });
  }
  console.error(fallbackMessage, error);
  return Response.json({ error: fallbackMessage }, { status: 500 });
}

function statusFor(error: ProposalesError) {
  if (error.kind === "timeout") return 504;
  if (error.kind === "configuration") return 500;
  return 502;
}

export function messageFor(error: ProposalesError) {
  switch (error.kind) {
    case "configuration":
      return "The server is not set up correctly. Check the Proposales settings.";
    case "timeout":
      return "Proposales did not answer in time.";
    case "network":
      return "Proposales is not reachable right now.";
    case "invalid_response":
      return "Proposales sent an answer this app does not understand.";
    case "http":
      return httpMessage(error.status);
  }
}

function httpMessage(status: number | undefined) {
  if (status === 401 || status === 403) return "Proposales did not accept this app's credentials.";
  if (status !== undefined && status < 500) return "Proposales refused the request.";
  return "Proposales is not reachable right now.";
}
