import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sessionToken } from "@/lib/auth/session";
import { DELETE, POST } from "./route";

beforeEach(() => {
  vi.stubEnv("APP_PASSWORD", "right password");
  // The cookie holds its expiry time, so the clock is fixed to compare it.
  vi.useFakeTimers({ now: Date.UTC(2026, 8, 25, 9, 0) });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/session", { method: "POST", body: JSON.stringify(body) }),
  );
}

describe("POST /api/session", () => {
  it("sets an http-only session cookie for the right password", async () => {
    const response = await post({ password: "right password" });
    const cookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ signedIn: true });
    expect(cookie).toContain(`session=${sessionToken()}`);
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
  });

  it("refuses a wrong password without a cookie", async () => {
    const response = await post({ password: "guess" });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Wrong password." });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("asks for the password when it is empty", async () => {
    const response = await post({ password: "" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Enter the password." });
  });
});

describe("DELETE /api/session", () => {
  it("clears the session cookie", async () => {
    const response = await DELETE();

    expect(await response.json()).toEqual({ signedIn: false });
    expect(response.headers.get("set-cookie")).toMatch(/session=;.*(Max-Age=0|Expires=Thu, 01 Jan 1970)/i);
  });
});
