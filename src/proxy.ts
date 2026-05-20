import { NextResponse, type NextRequest } from "next/server";

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"),
    );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!hasSupabaseSessionCookie(request)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
