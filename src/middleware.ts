import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";

/**
 * Gate every app route behind a valid session, and keep authenticated users out
 * of the login screen.
 *
 * Next 16 renames this convention to `proxy.ts`; pinned to 15 for AWS Amplify,
 * which supports Next.js 12–15.
 *
 * This is a redirect convenience, not the security boundary — each route
 * handler independently calls `requireSession()` before touching clinic data.
 */

const PUBLIC_PATHS = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!session && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    const response = NextResponse.redirect(url);
    // Clear a stale or tampered cookie so the browser stops resending it.
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (session && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Page routes only.
     *
     * `/api/*` is deliberately excluded: redirecting an API call to an HTML
     * login page gives clients a 307 and a page of markup where they expect
     * JSON. Route handlers guard themselves with `requireSession()` and answer
     * an unauthenticated caller with a 401 JSON body instead.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
