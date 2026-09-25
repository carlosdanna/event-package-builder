// Signs in with the shared password, and signs out. The session cookie is
// http-only, so scripts in the page cannot read it.
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  isCorrectPassword,
  sessionToken,
} from "@/lib/auth/session";
import { signInRequestSchema } from "@/lib/schemas/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = signInRequestSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "The request is not valid.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const token = sessionToken();
  if (!token || !isCorrectPassword(parsed.data.password)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const response = NextResponse.json({ signedIn: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ signedIn: false });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
