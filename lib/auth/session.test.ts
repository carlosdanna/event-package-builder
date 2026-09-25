import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isCorrectPassword, isValidSession, sessionToken } from "./session";

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
