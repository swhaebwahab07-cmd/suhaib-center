import { NextRequest, NextResponse } from "next/server";
import { getAllLinktrees, createLinktree } from "@/lib/supabase/queries";
import { getSession } from "@/lib/auth/get-session";
import { normalizeTemplateConfig } from "@/lib/templates/config";
// Template system is now fully dynamic using template_config

// GET /api/linktrees - Get all linktrees (admin only)
export async function GET() {
  try {
    // Check admin session
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const linktrees = await getAllLinktrees(true); // Include analytics
    return NextResponse.json(
      { data: linktrees },
      {
        headers: {
          // Cache for 24 hours (86400 seconds) - reduces function invocations
          'Cache-Control': 'private, s-maxage=86400, stale-while-revalidate=172800',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching linktrees:", error);
    return NextResponse.json(
      { error: "Failed to fetch linktrees" },
      { status: 500 }
    );
  }
}

// POST /api/linktrees - Create a new linktree (admin only)
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

    const body = await request.json();
    const {
      name,
      subtitle,
      slug,
      image,
      background_color,
      expire_date,
      footer_text,
      footer_phone,
      footer_hidden,
      platforms,
      links,
      linkMetadata,
      template_key,
      templateKey,
      template_config,
    } = body;

    // Validate required fields
    if (!name || !slug || !background_color) {
      const missingFields = [];
      if (!name) missingFields.push("name");
      if (!slug) missingFields.push("slug");
      if (!background_color) missingFields.push("background_color");
      console.error("Missing required fields:", missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate links
    if (!links || Object.keys(links).length === 0) {
      console.error("No links provided");
      return NextResponse.json(
        { error: "At least one link is required" },
        { status: 400 }
      );
    }

    try {
      const baseTemplateConfig =
        template_config && typeof template_config === "object" && !Array.isArray(template_config)
          ? (template_config as Record<string, unknown>)
          : null;
      const normalizedTemplateConfig = normalizeTemplateConfig(
        typeof templateKey === "string"
          ? templateKey
          : typeof template_key === "string"
            ? template_key
            : undefined,
        baseTemplateConfig
      );

      const linktree = await createLinktree({
        name,
        subtitle,
        slug,
        image,
        background_color,
        template_config: normalizedTemplateConfig,
        expire_date,
        footer_text,
        footer_phone,
        footer_hidden: footer_hidden ?? false,
        platforms: platforms || [],
        links: links || {},
        linkMetadata: linkMetadata || undefined,
      });

      // Revalidate pages after creation
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/revalidate?path=/&type=page`, {
          method: 'POST',
        });
        if (linktree.uid) {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/revalidate?path=/${linktree.uid}&type=page`, {
            method: 'POST',
          });
        }
      } catch (revalidateError) {
        console.error("Revalidation error (non-critical):", revalidateError);
      }

      return NextResponse.json({ data: linktree }, { 
        status: 201,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      });
    } catch (dbError) {
      console.error("Database error creating linktree:", dbError);
      return NextResponse.json(
        { error: dbError instanceof Error ? dbError.message : "Database error occurred" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating linktree:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create linktree" },
      { status: 500 }
    );
  }
}

