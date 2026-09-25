// Every page and route handler needs the session cookie, except the sign-in
// route itself. Pages send the browser to /login; route handlers answer 401.
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth/session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = isValidSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    return signedIn ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (signedIn) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Static files and the sign-in route are open to everyone.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/session).*)"],
};
