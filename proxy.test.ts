import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sessionToken } from "@/lib/auth/session";
import { proxy } from "./proxy";

beforeEach(() => {
  vi.stubEnv("APP_PASSWORD", "right password");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

function visit(path: string, cookie?: string) {
  const headers = cookie ? { cookie: `session=${cookie}` } : undefined;
  return proxy(new NextRequest(`http://localhost${path}`, { headers }));
}

describe("proxy", () => {
  it("sends a visitor without a session to the sign-in page", () => {
    const response = visit("/");

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("answers 401 to route handlers without a session", async () => {
    const response = visit("/api/proposals", "made-up");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Sign in to continue." });
  });

  it("lets a signed-in visitor through, and away from the sign-in page", () => {
    expect(visit("/", sessionToken()!).headers.get("x-middleware-next")).toBe("1");
    expect(visit("/login", sessionToken()!).headers.get("location")).toBe("http://localhost/");
  });

  it("shows the sign-in page to everyone else", () => {
    expect(visit("/login").headers.get("x-middleware-next")).toBe("1");
  });
});
