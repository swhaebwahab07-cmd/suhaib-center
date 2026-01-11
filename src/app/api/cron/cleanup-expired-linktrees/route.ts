import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Cleanup endpoint for expired linktrees - call this daily using cron service
 * 
 * Usage:
 * - cron-job.org: https://cron-job.org (free)
 * - easycron.com: https://www.easycron.com (free tier)
 * - Or any other cron service
 * 
 * URL: https://your-domain.vercel.app/api/cron/cleanup-expired-linktrees?secret=YOUR_SECRET
 * Schedule: 30 3 * * * (3:30am daily)
 * 
 * Note: This endpoint is optional if pg_cron is available. The database function
 * will run automatically via pg_cron. This endpoint is for external cron services.
 */
export async function GET(request: NextRequest) {
  try {
    // Simple secret check via query parameter
    const secret = request.nextUrl.searchParams.get("secret");
    const requiredSecret = process.env.CLEANUP_SECRET || "change-this-secret";
    
    if (secret !== requiredSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Use database function for efficient cleanup
    const { data, error } = await supabase.rpc("cleanup_expired_linktrees");

    if (error) {
      console.error("Error cleaning up expired linktrees:", error);
      return NextResponse.json(
        { 
          error: "Failed to cleanup expired linktrees",
          details: error.message 
        },
        { status: 500 }
      );
    }

    const result = data && data.length > 0 ? data[0] : null;

    return NextResponse.json({
      success: true,
      message: "Expired linktrees cleaned up successfully",
      timestamp: new Date().toISOString(),
      deleted_linktrees: result?.deleted_linktrees || 0,
      deleted_links: result?.deleted_links || 0,
      deleted_page_views: result?.deleted_page_views || 0,
      deleted_link_clicks: result?.deleted_link_clicks || 0,
    });
  } catch (error) {
    console.error("Error in cleanup:", error);
    return NextResponse.json(
      { 
        error: "Failed to cleanup expired linktrees",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
