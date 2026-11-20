import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth-token";
import { roleHasPermission, PERMISSION_ACTIONS } from "@/lib/permissions";

/**
 * Routes that do NOT require authentication.
 * Everything else will redirect to /login if no valid session is found.
 */
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/invite",
  "/set-password",
  "/api/invite",
  "/forgot-password",
  "/reset-password",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths through without any checks
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/logos/") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|woff2?|json)$/)
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const token = req.cookies.get("wcf_session")?.value;

  if (!token) {
    return redirectToLogin(req);
  }

  const payload = await verifyToken(token);

  if (!payload) {
    // Token is expired or tampered — clear and redirect
    const response = redirectToLogin(req);
    response.cookies.delete("wcf_session");
    return response;
  }

  // Enforce server-side role permissions:
  // 1. Only roles with "dashboard:view" (unit_head, executive) can access the main metrics dashboard (/dashboard)
  if (pathname === "/dashboard") {
    const canViewDashboard = roleHasPermission(payload.role, PERMISSION_ACTIONS.DASHBOARD_VIEW);
    if (!canViewDashboard) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/dashboard/people";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. Only users with "users:manage" (unit_head, authorized executive) can access /dashboard/users
  if (pathname.startsWith("/dashboard/users")) {
    if (payload.role !== "unit_head" && payload.role !== "executive") {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/dashboard/people";
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Token is valid — pass the request through with user info in headers
  // (so server components can read it without another DB hit for simple checks)
  const response = NextResponse.next();
  response.headers.set("x-user-id", payload.sub);
  response.headers.set("x-user-role", payload.role);
  return response;
}

function redirectToLogin(req: NextRequest): NextResponse {
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  // Preserve the intended destination so we can redirect back after login
  loginUrl.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  /*
   * Match all paths except Next.js internals.
   * Public paths are still matched but exempted at runtime above.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
