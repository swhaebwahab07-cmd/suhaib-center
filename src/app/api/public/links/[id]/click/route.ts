import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { extractAnalyticsData } from "@/lib/utils/analytics";

// POST /api/public/links/[id]/click - Track link click with full analytics
// This endpoint tracks ALL link clicks from ALL users, ensuring complete analytics coverage
// Supports: multiple users, multiple clicks, rapid clicking, navigation away
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get link to get linktree_id (cache this if possible for faster response)
    const supabase = createServiceRoleClient();
    
    // Start both operations in parallel for faster response
    const linkPromise = supabase
      .from("links")
      .select("id, linktree_id")
      .eq("id", id)
      .single();
    
    // Simplified analytics - only extract IP and session_id for unique tracking
    const analyticsPromise = extractAnalyticsData(request);

    // Return success immediately - process in background
    // This ensures the user doesn't wait for analytics processing
    Promise.all([linkPromise, analyticsPromise])
      .then(async ([linkResult, analyticsData]) => {
        if (linkResult.error || !linkResult.data) {
          return; // Silently fail
        }

        const link = linkResult.data;

        // Optimized: Single query with limit 1 for deduplication check
        // Uses composite index for fast lookup
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: existingClick } = await supabase
          .from("link_clicks")
          .select("id")
          .eq("link_id", id)
          .eq("ip_address", analyticsData.ip_address)
          .gte("clicked_at", oneHourAgo)
          .limit(1)
          .maybeSingle(); // Use maybeSingle to avoid error if no rows
        
        // Skip if already clicked in last hour (deduplication)
        if (existingClick) {
          return; // Already tracked, skip
        }

        // Record link click (only if not duplicate) - optimized with single query
        const { error: insertError } = await supabase
          .from("link_clicks")
          .insert({
            link_id: id,
            linktree_id: link.linktree_id,
            ip_address: analyticsData.ip_address,
            session_id: analyticsData.session_id || null,
            clicked_at: new Date().toISOString(),
          });

        if (!insertError) {
          // Increment click count on the link (non-blocking, fire and forget)
          (async () => {
            try {
              await supabase.rpc("increment_link_click", { link_id: id });
            } catch (err) {
              console.error("Error incrementing link click count:", err);
            }
          })();
        } else {
          console.error("Error recording link click:", {
            error: insertError,
            link_id: id,
            linktree_id: link.linktree_id,
            ip_address: analyticsData.ip_address,
            timestamp: new Date().toISOString(),
          });
        }
      })
      .catch((err) => {
        // Log error but don't break the user experience
        console.error("Error in link click tracking promise chain:", err);
      });

    return NextResponse.json({ message: "Click tracked successfully" }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Error tracking click:", error);
    // Don't return error - analytics failures shouldn't break the page
    return NextResponse.json({ message: "Click tracked successfully" }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

