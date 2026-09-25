// A single shared password for the whole app, from APP_PASSWORD, and the
// cookie that proves it was entered. Minimal protection, not user accounts.
// Only proxy.ts and route handlers import this; it never reaches the browser.
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

// The cookie value is derived from the password, so changing the password
// signs everyone out and no second secret is needed.
const SESSION_LABEL = "event-package-builder session";

function appPassword() {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    console.error("APP_PASSWORD is not set, so nobody can sign in.");
    return null;
  }
  return password;
}

function sign(password: string) {
  return createHmac("sha256", password).update(SESSION_LABEL).digest("hex");
}

function sameText(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// The cookie value for a signed-in browser, or null when no password is set.
export function sessionToken() {
  const password = appPassword();
  return password ? sign(password) : null;
}

// Both sides are signed first, so the comparison takes the same time
// whatever the length of what was typed.
export function isCorrectPassword(input: string) {
  const token = sessionToken();
  return token !== null && sameText(sign(input), token);
}

export function isValidSession(cookie: string | undefined) {
  const token = sessionToken();
  return token !== null && cookie !== undefined && sameText(cookie, token);
}
