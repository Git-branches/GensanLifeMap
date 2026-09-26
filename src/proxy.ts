import { NextResponse, type NextRequest } from "next/server";

/**
 * UX-level route guard for account pages. Redirects visitors without a
 * session cookie to /login (preserving the destination). This is NOT
 * the security boundary — Laravel rejects unauthenticated API calls
 * with 401 regardless, so a forged cookie grants nothing.
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get("glm_token")?.value;
  if (token) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/profile/:path*"],
};
