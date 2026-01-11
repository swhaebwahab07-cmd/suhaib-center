import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { extractAnalyticsData } from "@/lib/utils/analytics";
import { getLinktreeWithLinksByUid } from "@/lib/supabase/queries";

// POST /api/public/analytics/batch - Batch track multiple views and clicks
// Reduces API calls by accepting multiple analytics events in a single request
// Sends batches every 3 hours to minimize edge requests and function invocations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { views, clicks } = body as {
      views?: Array<{ linktreeUid: string; count: number }>;
      clicks?: Array<{ linkId: string; count: number }>;
    };

    // Validate input
    if (
      (!views || views.length === 0) &&
      (!clicks || clicks.length === 0)
    ) {
      return NextResponse.json({ message: "No analytics to track" }, { status: 200 });
    }

    const supabase = createServiceRoleClient();
    const analyticsData = await extractAnalyticsData(request);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Process views and clicks in parallel (fire and forget)
    const promises: Promise<void>[] = [];

    // Process views
    if (views && views.length > 0) {
      promises.push(
        Promise.all(
          views.map(async ({ linktreeUid, count }) => {
            if (count <= 0) return;

            // Get linktree to get the ID
            const { linktree } = await getLinktreeWithLinksByUid(linktreeUid);
            if (!linktree) return;

            // Check if already viewed in last hour (deduplication)
            const { data: existingView } = await supabase
              .from("page_views")
              .select("id")
              .eq("linktree_id", linktree.id)
              .eq("ip_address", analyticsData.ip_address)
              .gte("viewed_at", oneHourAgo)
              .limit(1)
              .maybeSingle();

            if (existingView) return; // Already tracked, skip

            // Insert single view record (one record per unique view)
            const { error: insertError } = await supabase.from("page_views").insert({
              linktree_id: linktree.id,
              ip_address: analyticsData.ip_address,
              session_id: analyticsData.session_id || null,
              viewed_at: new Date().toISOString(),
            });

            if (insertError) {
              console.error("Error recording page view:", insertError);
            }
          })
        ).then(() => {})
      );
    }

    // Process clicks
    if (clicks && clicks.length > 0) {
      promises.push(
        Promise.all(
          clicks.map(async ({ linkId, count }) => {
            if (count <= 0) return;

            // Get link to get linktree_id
            const { data: link } = await supabase
              .from("links")
              .select("id, linktree_id")
              .eq("id", linkId)
              .single();

            if (!link) return;

            // Check if already clicked in last hour (deduplication)
            const { data: existingClick } = await supabase
              .from("link_clicks")
              .select("id")
              .eq("link_id", linkId)
              .eq("ip_address", analyticsData.ip_address)
              .gte("clicked_at", oneHourAgo)
              .limit(1)
              .maybeSingle();

            if (existingClick) return; // Already tracked, skip

            // Insert single click record (one record per unique click)
            const { error: insertError } = await supabase.from("link_clicks").insert({
              link_id: linkId,
              linktree_id: link.linktree_id,
              ip_address: analyticsData.ip_address,
              session_id: analyticsData.session_id || null,
              clicked_at: new Date().toISOString(),
            });

            if (!insertError) {
              // Increment click count by the batch count (non-blocking)
              (async () => {
                try {
                  // Increment count times
                  for (let i = 0; i < count; i++) {
                    await supabase.rpc("increment_link_click", { link_id: linkId });
                  }
                } catch {
                  // Ignore errors
                }
              })();
            }
          })
        ).then(() => {})
      );
    }

    // Process all analytics (fire and forget)
    Promise.all(promises).catch(() => {
      // Silently fail
    });

    return NextResponse.json({ message: "Analytics tracked successfully" }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    });
  } catch (error) {
    // Don't return error - analytics failures shouldn't break the page
    return NextResponse.json({ message: "Analytics tracked successfully" }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    });
  }
}
