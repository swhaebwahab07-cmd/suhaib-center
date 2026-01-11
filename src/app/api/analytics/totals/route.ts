import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/get-session";
import { createServiceRoleClient } from "@/lib/supabase/server";

// GET /api/analytics/totals - Get total analytics across all linktrees (admin only)
export async function GET() {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Use optimized database function for aggregation (much faster, 100% accurate)
    // This uses COUNT and COUNT(DISTINCT) at database level instead of fetching all records
    const { data, error } = await supabase.rpc("get_total_analytics_optimized");

    if (error) {
      console.error("Error fetching total analytics using optimized function:", error);
      // Fallback to empty result
      return NextResponse.json({
        data: {
          unique_views: 0,
          unique_clicks: 0,
        },
      }, {
        headers: {
          'Cache-Control': 'private, s-maxage=2592000, stale-while-revalidate=5184000',
        },
      });
    }

    // Extract results from database function
    const result = data && data.length > 0 ? data[0] : null;
    const uniqueViews = result ? Number(result.unique_views) || 0 : 0;
    const uniqueClicks = result ? Number(result.unique_clicks) || 0 : 0;

    return NextResponse.json({
      data: {
        unique_views: uniqueViews,
        unique_clicks: uniqueClicks,
      },
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=2592000, stale-while-revalidate=5184000',
      },
    });
  } catch (error) {
    console.error("Error fetching total analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

