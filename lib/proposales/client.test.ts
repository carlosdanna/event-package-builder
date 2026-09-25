import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("server-only", () => ({}));

const { proposalesFetch, TIMEOUT_MS } = await import("./client");
const { ProposalesError } = await import("./errors");

const fetchMock = vi.fn<typeof fetch>();
const itemSchema = z.object({ data: z.array(z.object({ id: z.number() })) });

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function catchError(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected the call to fail");
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("PROPOSALES_API_KEY", "test-key");
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("proposalesFetch", () => {
  it("sends the bearer token to the full address with query values", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }));

    await proposalesFetch("/v3/content", {
      query: { company_id: 42, include_archived: undefined },
      schema: itemSchema,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.proposales.com/v3/content?company_id=42");
    expect(init?.method).toBe("GET");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer test-key" });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("sends a body as JSON", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }, 201));

    await proposalesFetch("/v3/content", {
      method: "POST",
      body: { title: "Boardroom" },
      schema: itemSchema,
    });

    const init = fetchMock.mock.calls[0][1];
    expect(init?.body).toBe('{"title":"Boardroom"}');
    expect(init?.headers).toMatchObject({ "Content-Type": "application/json" });
  });

  it("returns the parsed response", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ id: 1 }] }));

    const result = await proposalesFetch("/v3/content", { schema: itemSchema });

    expect(result).toEqual({ data: [{ id: 1 }] });
  });

  it("turns an error body into a ProposalesError with message and issues", async () => {
    const issues = [{ code: "invalid_type", path: ["title"], message: "Required" }];
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { message: "Invalid request", issues } }, 400),
    );

    const error = await catchError(
      proposalesFetch("/v3/content", { method: "POST", body: {}, schema: itemSchema }),
    );

    expect(error).toBeInstanceOf(ProposalesError);
    expect(error).toMatchObject({
      kind: "http",
      status: 400,
      message: "Invalid request",
      issues,
    });
  });

  it("falls back to the status when the error body is not the documented shape", async () => {
    fetchMock.mockResolvedValue(new Response("Bad gateway", { status: 502 }));

    const error = await catchError(proposalesFetch("/v3/content", { schema: itemSchema }));

    expect(error).toMatchObject({
      kind: "http",
      status: 502,
      message: "Proposales answered with status 502.",
    });
  });

  it("reports a timeout when the request is aborted by the time limit", async () => {
    fetchMock.mockRejectedValue(new DOMException("timed out", "TimeoutError"));

    const error = await catchError(proposalesFetch("/v3/content", { schema: itemSchema }));

    expect(error).toMatchObject({
      kind: "timeout",
      message: "Proposales did not answer within 10 seconds.",
    });
  });

  it("aborts a request when the 10 second signal fires", async () => {
    // AbortSignal.timeout uses a native timer that fake timers cannot advance,
    // so hand out a signal the test controls instead.
    const controller = new AbortController();
    const timeoutSpy = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(controller.signal);
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        }),
    );

    const pending = catchError(proposalesFetch("/v3/content", { schema: itemSchema }));
    controller.abort(new DOMException("timed out", "TimeoutError"));

    expect(await pending).toMatchObject({ kind: "timeout" });
    expect(timeoutSpy).toHaveBeenCalledWith(TIMEOUT_MS);
    timeoutSpy.mockRestore();
  });

  it("reports a network failure when fetch rejects", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    const error = await catchError(proposalesFetch("/v3/content", { schema: itemSchema }));

    expect(error).toMatchObject({ kind: "network", message: "Could not reach Proposales." });
  });

  it("reports an unexpected response shape", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ id: "not a number" }] }));

    const error = await catchError(proposalesFetch("/v3/content", { schema: itemSchema }));

    expect(error).toMatchObject({ kind: "invalid_response", status: 200 });
  });

  it("refuses to call Proposales without an API key", async () => {
    vi.stubEnv("PROPOSALES_API_KEY", "");

    const error = await catchError(proposalesFetch("/v3/content", { schema: itemSchema }));

    expect(error).toMatchObject({ kind: "configuration" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
