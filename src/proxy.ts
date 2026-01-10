import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCachedSessionValidation, setCachedSessionValidation } from "@/lib/utils/session-cache";

// Next.js 16+ proxy export (replaces middleware)
// Optimized to skip static routes and reduce edge requests
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and Next.js internals - no edge function needed
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Skip public pages (they're static with ISR) - no edge function needed
  // Only protect admin routes
  if (pathname.startsWith("/admin") && !pathname.startsWith("/api/")) {
    const sessionToken = request.cookies.get("admin_session")?.value;
    
    // No session token - immediately redirect to login
    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check cache first (reduces database calls by ~95%)
    const cachedValidation = getCachedSessionValidation(sessionToken);
    if (cachedValidation !== null) {
      if (!cachedValidation) {
        const loginUrl = new URL("/login", request.url);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.set("admin_session", "", {
          expires: new Date(0),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
        return response;
      }
      // Session is valid (cached), allow access
      return NextResponse.next();
    }
    
    // Cache miss - check database
    try {
      const { createServiceRoleClient } = await import("@/lib/supabase/server");
      const supabase = createServiceRoleClient();
      
      const { data: isValid, error: validationError } = await supabase.rpc("is_session_valid", {
        session_tok: sessionToken,
      });
      
      // Cache the result
      setCachedSessionValidation(sessionToken, !validationError && !!isValid);
      
      // Session invalid or error occurred - redirect to login
      if (validationError || !isValid) {
        const loginUrl = new URL("/login", request.url);
        const response = NextResponse.redirect(loginUrl);
        // Delete the invalid cookie
        response.cookies.set("admin_session", "", {
          expires: new Date(0),
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
        return response;
      }
    } catch {
      // On any error, redirect to login for security
      const loginUrl = new URL("/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      // Delete cookie on error
      response.cookies.set("admin_session", "", {
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
      return response;
    }
  }

  // Rate limiting removed as requested
  // Security headers are handled in next.config.ts
  // Return response without modifying headers here to avoid conflicts
  return NextResponse.next();
}

// Matcher configuration for Next.js 16+ proxy
// CRITICAL: Only match admin pages - API routes handle their own authentication
// This minimizes edge function invocations on Vercel free tier
// Public pages are static (ISR) and don't need edge functions
export const config = {
  matcher: [
    // Only admin pages need auth check via proxy
    // API routes handle their own auth internally, so no edge function needed
    "/admin/:path*",
  ],
};

