import { NextRequest, NextResponse } from "next/server";

// Routes that require a valid token in localStorage.
// Proxy runs on the server and cannot read localStorage directly,
// so we check for the token in a cookie named "token" instead.
// The auth pages set document.cookie in addition to localStorage for this purpose.
const PROTECTED_PATHS = ["/history"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("token")?.value;
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/history/:path*"],
};
