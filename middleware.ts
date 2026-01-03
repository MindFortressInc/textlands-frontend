import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Only handle wiki subdomain
  if (!hostname.startsWith("wiki.")) {
    return NextResponse.next();
  }

  // Skip static files, API routes, and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Already on a /wiki path - don't rewrite
  if (pathname.startsWith("/wiki")) {
    return NextResponse.next();
  }

  // Rewrite to /wiki/* for wiki subdomain
  const url = request.nextUrl.clone();
  url.pathname = `/wiki${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
