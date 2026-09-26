import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_MAX_AGE_SECONDS,
  isCorrectPassword,
  isValidSession,
  sessionExpiresAt,
  sessionToken,
} from "./session";

const SIGNED_IN_AT = Date.UTC(2026, 8, 25, 9, 0);
const EXPIRES_AT = SIGNED_IN_AT + SESSION_MAX_AGE_SECONDS * 1000;

beforeEach(() => {
  vi.stubEnv("APP_PASSWORD", "right password");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isCorrectPassword", () => {
  it("accepts only the exact password", () => {
    expect(isCorrectPassword("right password")).toBe(true);
    expect(isCorrectPassword("Right password")).toBe(false);
    expect(isCorrectPassword("")).toBe(false);
  });
});

describe("isValidSession", () => {
  it("accepts the token for the current password", () => {
    expect(isValidSession(sessionToken()!)).toBe(true);
  });

  it("refuses a missing, changed or made-up cookie", () => {
    const token = sessionToken()!;
    expect(isValidSession(undefined)).toBe(false);
    const changed = token.slice(0, -1) + (token.endsWith("0") ? "1" : "0");
    expect(isValidSession(changed)).toBe(false);
    expect(isValidSession("right password")).toBe(false);
  });

  it("signs everyone out when the password changes", () => {
    const oldToken = sessionToken()!;
    vi.stubEnv("APP_PASSWORD", "new password");

    expect(isValidSession(oldToken)).toBe(false);
  });

  it("refuses a malformed cookie", () => {
    const signature = sessionToken()!.split(".")[1];
    expect(isValidSession(signature)).toBe(false);
    expect(isValidSession(`soon.${signature}`)).toBe(false);
    expect(isValidSession(`${sessionToken()}.extra`)).toBe(false);
  });
});

describe("sessionExpiresAt", () => {
  it("returns the signed expiry time", () => {
    expect(sessionExpiresAt(sessionToken(SIGNED_IN_AT)!, SIGNED_IN_AT)).toBe(EXPIRES_AT);
  });

  it("accepts the session until it expires, and refuses it from then on", () => {
    const token = sessionToken(SIGNED_IN_AT)!;

    expect(isValidSession(token, EXPIRES_AT - 1)).toBe(true);
    expect(isValidSession(token, EXPIRES_AT)).toBe(false);
    expect(isValidSession(token, EXPIRES_AT + 60_000)).toBe(false);
  });

  it("refuses a cookie whose expiry time was moved later", () => {
    const signature = sessionToken(SIGNED_IN_AT)!.split(".")[1];
    const moved = `${EXPIRES_AT + 60 * 60 * 1000}.${signature}`;

    expect(sessionExpiresAt(moved, EXPIRES_AT)).toBeNull();
  });
});

describe("without APP_PASSWORD", () => {
  it("lets nobody in", () => {
    vi.stubEnv("APP_PASSWORD", "");
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(sessionToken()).toBeNull();
    expect(isCorrectPassword("")).toBe(false);
    expect(isValidSession("")).toBe(false);
  });
});
