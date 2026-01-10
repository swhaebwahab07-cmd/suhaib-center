import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/get-session";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateUsernameSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username must be at most 50 characters"),
  currentPassword: z.string().min(1, "Current password is required"),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// PATCH /api/auth/profile - Update username or password (admin only)
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const supabase = createServiceRoleClient();

    // Verify current password first
    const { data: passwordValid, error: passwordError } = await supabase.rpc("verify_admin_password", {
      p_username: session.user.username,
      p_password: body.currentPassword,
    });

    if (passwordError || !passwordValid) {
      // Rate limiting removed - no failed attempt recording
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Update username
    if (body.username) {
      const validationResult = updateUsernameSchema.safeParse({
        username: body.username,
        currentPassword: body.currentPassword,
      });

      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: "Validation failed",
            details: validationResult.error.issues.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
          { status: 400 }
        );
      }

      // Check if username already exists
      const { data: existingAdmin } = await supabase
        .from("admins")
        .select("id")
        .eq("username", body.username)
        .neq("id", session.user.id)
        .single();

      if (existingAdmin) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 400 }
        );
      }

      // Update username
      const { error: updateError } = await supabase
        .from("admins")
        .update({ username: body.username })
        .eq("id", session.user.id);

      if (updateError) {
        console.error("Error updating username:", updateError);
        return NextResponse.json(
          { error: "Failed to update username" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Username updated successfully",
        user: {
          id: session.user.id,
          username: body.username,
          name: session.user.name,
        },
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // Update password
    if (body.newPassword) {
      const validationResult = updatePasswordSchema.safeParse({
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
        confirmPassword: body.confirmPassword,
      });

      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: "Validation failed",
            details: validationResult.error.issues.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
          { status: 400 }
        );
      }

      // Update password using database function
      const { error: updateError } = await supabase.rpc("update_admin_password", {
        p_admin_id: session.user.id,
        p_new_password: body.newPassword,
      });

      if (updateError) {
        console.error("Error updating password:", updateError);
        return NextResponse.json(
          { error: "Failed to update password" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Password updated successfully",
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    return NextResponse.json(
      { error: "No update specified" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

