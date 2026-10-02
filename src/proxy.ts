import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const REFRESH_COOKIE_NAMES =
  process.env.NEXT_PUBLIC_APP_ENV === "staging" ||
  process.env.NEXT_PUBLIC_APP_ENV === "production"
    ? ["__Host-fspark-refresh"]
    : ["__Host-fspark-refresh", "fspark-refresh"];

export function proxy(request: NextRequest) {
  const hasRefreshCookie = REFRESH_COOKIE_NAMES.some((name) =>
    request.cookies.has(name),
  );

  if (hasRefreshCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/student/:path*",
    "/mentor/:path*",
    "/instructor/:path*",
    "/change-password",
  ],
};
