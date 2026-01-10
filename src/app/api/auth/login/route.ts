import { createServiceRoleClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "ناوی بەکارهێنەر یان تێپەڕەوشە هەڵەیە" },
        { status: 400 }
      );
    }

    const { username, password, rememberMe } = validationResult.data;
    const supabase = createServiceRoleClient();
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                     request.headers.get("x-real-ip") || 
                     "unknown";

    // Generate session token and expiration before database calls
    const sessionToken = crypto.randomUUID();
    const sessionDuration = rememberMe 
      ? 365 * 24 * 60 * 60 * 1000  // 1 year
      : 30 * 60 * 1000;             // 30 minutes
    const sessionExpiresAt = new Date(Date.now() + sessionDuration);
    const userAgent = request.headers.get("user-agent") || null;

    // Use optimized function for single database call (faster)
    const { data: loginResult, error: loginError } = await supabase.rpc(
      "authenticate_and_create_session",
      {
        p_username: username,
        p_password: password,
        p_session_token: sessionToken,
        p_session_expires_at: sessionExpiresAt.toISOString(),
        p_ip_address: clientIp,
        p_user_agent: userAgent,
      }
    );

    if (loginError || !loginResult || loginResult.length === 0 || !loginResult[0]?.success) {
      return NextResponse.json(
        { error: "ناوی بەکارهێنەر یان تێپەڕەوشە هەڵەیە" },
        { status: 401 }
      );
    }

    const admin = {
      id: loginResult[0].admin_id,
      username: loginResult[0].username,
      name: loginResult[0].name,
    };

    const cookieStore = await cookies();
    cookieStore.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: rememberMe ? 365 * 24 * 60 * 60 : 30 * 60, // 1 year if rememberMe, 30 minutes otherwise
      path: "/",
    });

    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
        },
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "هەڵەیەکی نادیار ڕوویدا" },
      { status: 500 }
    );
  }
}

