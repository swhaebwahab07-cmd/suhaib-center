import { NextRequest, NextResponse } from "next/server";
import { getLinktreeWithLinksByUid } from "@/lib/supabase/queries";

// GET /api/public/linktrees/[uid] - Get linktree by UID (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    
    // Optimized: Fetch linktree and links in a single database query
    const { linktree, links } = await getLinktreeWithLinksByUid(uid);

    if (!linktree) {
      return NextResponse.json(
        { error: "Linktree not found" },
        { status: 404 }
      );
    }

    // Views are tracked in page_views table via /view endpoint, no separate increment needed

    return NextResponse.json(
      {
        data: {
          ...linktree,
          links,
        },
      },
      {
        headers: {
          // Cache for 30 days (2592000 seconds) - reduces function invocations
          'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=5184000',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching linktree:", error);
    return NextResponse.json(
      { error: "Failed to fetch linktree" },
      { status: 500 }
    );
  }
}

