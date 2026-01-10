import { createServiceRoleClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function getSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  if (!sessionToken) {
    return null;
  }

  const supabase = createServiceRoleClient();
  
  // Try optimized function first, fallback to simple approach if it doesn't exist
  let admin: { admin_id: string; username: string; name: string } | null = null;
  
  try {
    const newExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    const { data: adminData, error: adminError } = await supabase.rpc(
      "validate_and_refresh_session",
      {
        p_session_token: sessionToken,
        p_new_expires_at: newExpiresAt.toISOString(),
      }
    );

    if (!adminError && adminData && adminData.length > 0) {
      admin = adminData[0];
    }
  } catch {
    // Function might not exist, fallback to simple approach
  }

  // Fallback to simple approach if optimized function failed or doesn't exist
  if (!admin) {
    // Validate session
    const { data: isValid, error: validationError } = await supabase.rpc("is_session_valid", {
      session_tok: sessionToken,
    });

    if (validationError || !isValid) {
      return null;
    }

    // Refresh session expiration
    const newExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    await supabase.rpc("refresh_session_expiration", {
      session_tok: sessionToken,
      new_expires_at: newExpiresAt.toISOString(),
    });

    // Get admin info
    const { data: adminData, error: adminError } = await supabase.rpc("get_admin_by_session", {
      session_tok: sessionToken,
    });

    if (adminError || !adminData || adminData.length === 0) {
      return null;
    }

    admin = adminData[0];
  }

  // Type guard: ensure admin is not null before accessing properties
  if (!admin) {
    return null;
  }

  return {
    user: {
      id: admin.admin_id,
      username: admin.username,
      name: admin.name,
    },
  };
}

