// A single shared password for the whole app, from APP_PASSWORD, and the
// cookie that proves it was entered. Minimal protection, not user accounts.
// Only proxy.ts, route handlers and server components import this; it never
// reaches the browser.
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 10 * 60;

// The cookie value is signed with the password, so changing the password
// signs everyone out and no second secret is needed.
const PASSWORD_LABEL = "event-package-builder password";
const SESSION_LABEL = "event-package-builder session";

function appPassword() {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    console.error("APP_PASSWORD is not set, so nobody can sign in.");
    return null;
  }
  return password;
}

function hmac(key: string, text: string) {
  return createHmac("sha256", key).update(text).digest("hex");
}

// The expiry time is part of what is signed, so it cannot be moved later.
function signSession(password: string, expiresAt: number) {
  return hmac(password, `${SESSION_LABEL}:${expiresAt}`);
}

function sameText(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// The cookie value for a browser that signs in now: the expiry time in
// milliseconds, a dot, and its signature. Null when no password is set.
export function sessionToken(now = Date.now()) {
  const password = appPassword();
  if (!password) return null;
  const expiresAt = now + SESSION_MAX_AGE_SECONDS * 1000;
  return `${expiresAt}.${signSession(password, expiresAt)}`;
}

// Both sides are signed first, so the comparison takes the same time
// whatever the length of what was typed.
export function isCorrectPassword(input: string) {
  const password = appPassword();
  return password !== null && sameText(hmac(input, PASSWORD_LABEL), hmac(password, PASSWORD_LABEL));
}

// When the session in the cookie ends, or null when the cookie is missing,
// forged or already expired.
export function sessionExpiresAt(cookie: string | undefined, now = Date.now()) {
  const password = appPassword();
  if (!password || cookie === undefined) return null;

  const [expiry, signature, ...rest] = cookie.split(".");
  if (signature === undefined || rest.length > 0 || !/^\d+$/.test(expiry)) return null;
  const expiresAt = Number(expiry);
  if (!sameText(signature, signSession(password, expiresAt))) return null;
  return expiresAt > now ? expiresAt : null;
}

export function isValidSession(cookie: string | undefined, now = Date.now()) {
  return sessionExpiresAt(cookie, now) !== null;
}
