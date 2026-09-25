import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const fetchMock = vi.fn<typeof fetch>();

function companies(...ids: number[]) {
  const data = ids.map((id) => ({ id, name: `Hotel ${id}`, currency: "SEK", timezone: "Europe/Stockholm" }));
  return new Response(JSON.stringify({ data }), { status: 200 });
}

// A fresh module for each test, so the cached company does not leak between tests.
async function loadResolveCompanyId() {
  vi.resetModules();
  return (await import("./index")).resolveCompanyId;
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("PROPOSALES_API_KEY", "test-key");
  vi.stubEnv("PROPOSALES_COMPANY_ID", "");
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("resolveCompanyId", () => {
  it("uses PROPOSALES_COMPANY_ID without asking Proposales", async () => {
    vi.stubEnv("PROPOSALES_COMPANY_ID", "42");
    const resolveCompanyId = await loadResolveCompanyId();

    expect(await resolveCompanyId()).toBe(42);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("looks up the only company once and remembers it", async () => {
    fetchMock.mockResolvedValue(companies(7));
    const resolveCompanyId = await loadResolveCompanyId();

    expect(await resolveCompanyId()).toBe(7);
    expect(await resolveCompanyId()).toBe(7);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tries again after a failed lookup", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValue(companies(7));
    const resolveCompanyId = await loadResolveCompanyId();

    await expect(resolveCompanyId()).rejects.toThrow("Could not reach Proposales.");
    expect(await resolveCompanyId()).toBe(7);
  });

  it("asks for PROPOSALES_COMPANY_ID when the token sees several companies", async () => {
    fetchMock.mockResolvedValue(companies(7, 8));
    const resolveCompanyId = await loadResolveCompanyId();

    await expect(resolveCompanyId()).rejects.toThrow("Set PROPOSALES_COMPANY_ID.");
  });
});
