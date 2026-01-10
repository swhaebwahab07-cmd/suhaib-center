import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Simple cleanup endpoint - call this daily at 3am using any cron service
 * 
 * Usage:
 * - cron-job.org: https://cron-job.org (free)
 * - easycron.com: https://www.easycron.com (free tier)
 * - Or any other cron service
 * 
 * URL: https://your-domain.vercel.app/api/cron/cleanup-analytics?secret=YOUR_SECRET
 * Schedule: 0 3 * * * (3am daily)
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
    const { data, error } = await supabase.rpc("cleanup_analytics_data");

    if (error) {
      console.error("Error cleaning up analytics data:", error);
      return NextResponse.json(
        { 
          error: "Failed to cleanup analytics data",
          details: error.message 
        },
        { status: 500 }
      );
    }

    const result = data && data.length > 0 ? data[0] : null;

    return NextResponse.json({
      success: true,
      message: "Analytics data cleaned up successfully",
      timestamp: new Date().toISOString(),
      deleted_views: result?.deleted_views || 0,
      deleted_clicks: result?.deleted_clicks || 0,
      reset_links: result?.reset_links || 0,
    });
  } catch (error) {
    console.error("Error in cleanup:", error);
    return NextResponse.json(
      { 
        error: "Failed to cleanup analytics data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
