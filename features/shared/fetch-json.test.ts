import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { fetchJson, RequestError } from "./fetch-json";

const fetchMock = vi.fn<typeof fetch>();
const schema = z.object({ items: z.array(z.number()) });
const options = { timeoutMs: 1_000, fallbackMessage: "Could not load it." };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

async function failure(promise: Promise<unknown>) {
  const error = await promise.catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(RequestError);
  return error as RequestError;
}

beforeEach(() => vi.stubGlobal("fetch", fetchMock));
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("fetchJson", () => {
  it("returns the parsed answer and sends a JSON body", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: [1, 2] }));

    const result = await fetchJson("/api/things", schema, { ...options, method: "POST", body: { a: 1 } });

    expect(result).toEqual({ items: [1, 2] });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/things");
    expect(init).toMatchObject({ method: "POST", body: '{"a":1}' });
  });

  it("uses the route's error message, or the fallback when there is none", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Unknown template." }, 400));
    expect(await failure(fetchJson("/api/things", schema, options))).toMatchObject({
      kind: "status",
      status: 400,
      message: "Unknown template.",
    });

    fetchMock.mockResolvedValueOnce(new Response("<html>Bad gateway</html>", { status: 502 }));
    expect((await failure(fetchJson("/api/things", schema, options))).message).toBe(
      "Could not load it.",
    );
  });

  it("does not show a schema error when the answer has the wrong shape", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ items: "none" }));
    expect(await failure(fetchJson("/api/things", schema, options))).toMatchObject({
      kind: "format",
      message: "Could not load it.",
    });
  });

  it("explains a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await failure(fetchJson("/api/things", schema, options))).toMatchObject({
      kind: "network",
      message: "Could not reach the server. Check the connection and try again.",
    });
  });

  it("gives up after the time limit", async () => {
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason)),
        ),
    );
    const error = await failure(fetchJson("/api/things", schema, { ...options, timeoutMs: 20 }));
    expect(error.kind).toBe("timeout");
  });

  it("passes a cancellation from TanStack Query on unchanged", async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason)),
        ),
    );
    const request = fetchJson("/api/things", schema, { ...options, signal: controller.signal });
    controller.abort();
    await expect(request).rejects.not.toBeInstanceOf(RequestError);
  });
});
