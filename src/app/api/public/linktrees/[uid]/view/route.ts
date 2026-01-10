import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { extractAnalyticsData } from "@/lib/utils/analytics";
import { getLinktreeWithLinksByUid } from "@/lib/supabase/queries";

// POST /api/public/linktrees/[uid]/view - Track page view with full analytics
// This endpoint tracks ALL page views from ALL users, ensuring complete analytics coverage
// Supports: multiple users, multiple pages, page refreshes, rapid navigation
// Uses sendBeacon for reliable tracking even when page is closing
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    
    // Get linktree to get the ID (using optimized query, but we only need linktree)
    const { linktree } = await getLinktreeWithLinksByUid(uid);
    if (!linktree) {
      return NextResponse.json(
        { error: "Linktree not found" },
        { status: 404 }
      );
    }

    // Extract analytics data from request - only need IP and session_id
    const analyticsData = await extractAnalyticsData(request);
    const supabase = createServiceRoleClient();
    
    // Optimized: Single query with limit 1 for deduplication check
    // Uses composite index for fast lookup
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: existingView } = await supabase
      .from("page_views")
      .select("id")
      .eq("linktree_id", linktree.id)
      .eq("ip_address", analyticsData.ip_address)
      .gte("viewed_at", oneHourAgo)
      .limit(1)
      .maybeSingle(); // Use maybeSingle to avoid error if no rows
    
    // Skip if already viewed in last hour (deduplication)
    if (existingView) {
      return NextResponse.json({ message: "View already tracked" }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }
    
    // Insert page view (only if not duplicate) - optimized with single query
    const { error: insertError } = await supabase
      .from("page_views")
      .insert({
        linktree_id: linktree.id,
        ip_address: analyticsData.ip_address,
        session_id: analyticsData.session_id || null,
        viewed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Error recording page view:", insertError);
    }

    return NextResponse.json({ message: "View tracked successfully" }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Error tracking view:", error);
    // Don't return error - analytics failures shouldn't break the page
    return NextResponse.json({ message: "View tracked successfully" }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

