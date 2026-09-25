import { afterEach, describe, expect, it, vi } from "vitest";
import { ProposalesError } from "@/lib/proposales/errors";

vi.mock("server-only", () => ({}));
const { errorResponse } = await import("./error-response");

const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
afterEach(() => consoleError.mockClear());

async function respond(error: unknown) {
  const response = errorResponse(error, "Could not do it.");
  return { status: response.status, body: await response.json() };
}

describe("errorResponse", () => {
  it("never shows the text Proposales sent", async () => {
    const error = new ProposalesError("http", "Token abc123 has no access to company 7", {
      status: 403,
    });
    expect(await respond(error)).toEqual({
      status: 502,
      body: { error: "Proposales did not accept this app's credentials." },
    });
    expect(consoleError).toHaveBeenCalledWith(
      "Proposales request failed",
      "http",
      403,
      "Token abc123 has no access to company 7",
      undefined,
    );
  });

  it("tells refused requests apart from Proposales being down", async () => {
    const refused = new ProposalesError("http", "Bad", { status: 422 });
    const down = new ProposalesError("http", "Oops", { status: 503 });
    expect((await respond(refused)).body.error).toBe("Proposales refused the request.");
    expect((await respond(down)).body.error).toBe("Proposales is not reachable right now.");
  });

  it("answers a timeout with status 504 and a configuration problem with 500", async () => {
    expect((await respond(new ProposalesError("timeout", "Slow"))).status).toBe(504);
    expect(await respond(new ProposalesError("configuration", "PROPOSALES_API_KEY missing"))).toEqual({
      status: 500,
      body: { error: "The server is not set up correctly. Check the Proposales settings." },
    });
  });

  it("uses the fallback message for other errors", async () => {
    expect(await respond(new Error("boom"))).toEqual({
      status: 500,
      body: { error: "Could not do it." },
    });
  });
});
