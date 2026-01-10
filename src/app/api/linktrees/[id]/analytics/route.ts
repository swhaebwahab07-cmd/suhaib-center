import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/get-session";
import { getLinktreeAnalytics } from "@/lib/supabase/queries";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCache, setCache, getAnalyticsCacheKey } from "@/lib/utils/cache";
import { checkRateLimit, getRateLimitKey } from "@/lib/utils/rate-limit";

// GET /api/linktrees/[id]/analytics - Get analytics data for a linktree (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Rate limiting: 30 requests per minute per IP
    const rateLimitKey = getRateLimitKey(request);
    const rateLimit = checkRateLimit(rateLimitKey, 30, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.resetAt),
          },
        }
      );
    }

    // Check cache first (24 hour cache for analytics to reduce database load)
    const cacheKey = getAnalyticsCacheKey(id);
    const cached = getCache(cacheKey);
    if (cached) {
      return NextResponse.json({ data: cached }, {
        headers: {
          'Cache-Control': 'private, s-maxage=86400, stale-while-revalidate=172800',
          'X-Cache': 'HIT',
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetAt),
        },
      });
    }

    // Verify linktree exists and get it
    const supabase = createServiceRoleClient();
    const { data: linktree, error: linktreeError } = await supabase
      .from("linktrees")
      .select("id")
      .eq("id", id)
      .single();

    if (linktreeError || !linktree) {
      return NextResponse.json(
        { error: "Linktree not found" },
        { status: 404 }
      );
    }

    // Get analytics data with timeout (8 seconds max to avoid Vercel timeout)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 8000);
    });

    const analyticsPromise = getLinktreeAnalytics(id);
    
    const analytics = await Promise.race([analyticsPromise, timeoutPromise]) as Awaited<ReturnType<typeof getLinktreeAnalytics>>;

    // Cache the result for 24 hours (86400000 ms)
    setCache(cacheKey, analytics, 86400000);

    return NextResponse.json({ data: analytics }, {
      headers: {
        'Cache-Control': 'private, s-maxage=86400, stale-while-revalidate=172800',
        'X-Cache': 'MISS',
        'X-RateLimit-Limit': '30',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(rateLimit.resetAt),
      },
    });
  } catch (error) {
    // Handle timeout specifically
    if (error instanceof Error && error.message === "Request timeout") {
      console.error("Analytics query timeout:", error);
      return NextResponse.json(
        { error: "Request timeout. Please try again." },
        { status: 504 }
      );
    }

    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

