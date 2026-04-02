import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "clockflow-dev-secret-change-in-production"
);

const protectedPatterns = [
  "/dashboard",
  "/employees",
  "/departments",
  "/shifts",
  "/clockings",
  "/timesheets",
  "/leave",
  "/overtime",
  "/reports",
  "/billing",
  "/settings",
];

const authPages = ["/sign-in", "/sign-up"];

const publicPatterns = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/health",
  "/api/stripe/webhook",
  "/api/portal",
];

function matchesPattern(pathname: string, patterns: string[]): boolean {
  return patterns.some(
    (pattern) => pathname === pattern || pathname.startsWith(pattern + "/")
  );
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public API routes
  if (matchesPattern(pathname, publicPatterns)) {
    return NextResponse.next();
  }

  // Landing page is public
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Portal routes (employee self-service) — separate auth
  if (pathname.startsWith("/portal")) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("cf_access_token")?.value;
  const payload = accessToken ? await verifyToken(accessToken) : null;

  // Auth pages — redirect to dashboard if already logged in
  if (matchesPattern(pathname, authPages)) {
    if (payload) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes — require valid token
  if (matchesPattern(pathname, protectedPatterns)) {
    if (!payload) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  // Protected API routes
  if (pathname.startsWith("/api/")) {
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
