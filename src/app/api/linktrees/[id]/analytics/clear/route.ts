import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/get-session";

// DELETE /api/linktrees/[id]/analytics/clear - Clear all analytics data for a linktree
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = createServiceRoleClient();

    // Verify linktree exists
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

    // Start transaction-like operations
    // 1. Delete all page views
    const { error: pageViewsError } = await supabase
      .from("page_views")
      .delete()
      .eq("linktree_id", id);

    if (pageViewsError) {
      console.error("Error deleting page views:", pageViewsError);
      return NextResponse.json(
        { error: "Failed to clear page views" },
        { status: 500 }
      );
    }

    // 2. Delete all link clicks
    const { error: linkClicksError } = await supabase
      .from("link_clicks")
      .delete()
      .eq("linktree_id", id);

    if (linkClicksError) {
      console.error("Error deleting link clicks:", linkClicksError);
      return NextResponse.json(
        { error: "Failed to clear link clicks" },
        { status: 500 }
      );
    }

    // 3. Recalculate all counts (should be 0 after deletion, but ensures consistency)
    // This uses the database function to recalculate from actual data
    const { error: recalculateError } = await supabase.rpc("recalculate_all_linktree_counts", {
      p_linktree_id: id,
    });

    if (recalculateError) {
      console.error("Error recalculating counts:", recalculateError);
      // Fallback to manual reset if recalculate fails (no-op since we don't track total counts)
      // Just update the timestamp
      const { error: linktreeUpdateError } = await supabase
        .from("linktrees")
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (linktreeUpdateError) {
        console.error("Error resetting linktree counters:", linktreeUpdateError);
        return NextResponse.json(
          { error: "Failed to reset linktree counters" },
          { status: 500 }
        );
      }

      const { error: linksUpdateError } = await supabase
        .from("links")
        .update({
          click_count: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("linktree_id", id);

      if (linksUpdateError) {
        console.error("Error resetting link click counts:", linksUpdateError);
        return NextResponse.json(
          { error: "Failed to reset link click counts" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: "Analytics data cleared successfully",
      success: true,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error("Error clearing analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

