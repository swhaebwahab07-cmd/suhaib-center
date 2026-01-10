import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getSession } from "@/lib/auth/get-session";

// POST /api/revalidate - On-demand revalidation (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check admin session
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const tag = searchParams.get("tag");
    const type = searchParams.get("type") || "page"; // 'page' or 'tag'

    if (!path && !tag) {
      return NextResponse.json(
        { error: "Either 'path' or 'tag' parameter is required" },
        { status: 400 }
      );
    }

    if (type === "tag" && tag) {
      revalidateTag(tag, "page");
      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        tag,
      });
    }

    if (path) {
      revalidatePath(path, "page");
      return NextResponse.json({
        revalidated: true,
        now: Date.now(),
        path,
      });
    }

    return NextResponse.json(
      { error: "Invalid parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error revalidating:", error);
    return NextResponse.json(
      { error: "Failed to revalidate" },
      { status: 500 }
    );
  }
}
