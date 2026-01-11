import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/get-session";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

// Force dynamic rendering - always check authentication
// Note: This is necessary for auth check, but we minimize edge function calls
// by using client-side caching and only checking auth on server
export const dynamic = 'force-dynamic';

// Prevent caching of this page - always check authentication
// However, client-side caching handles data fetching to minimize API calls
export const revalidate = 0;

export default async function AdminPage() {
  // Check authentication FIRST - before any data fetching or rendering
  // This ensures no content is ever shown to unauthenticated users
  const session = await getSession();

  // Strict authentication check - redirect immediately if not logged in
  // This happens on the server before any HTML is sent to the client
  if (!session || !session.user || !session.user.id || !session.user.username) {
    redirect("/login");
  }

  // Don't fetch data on server - let client handle it with caching
  // This reduces server-side database queries and improves performance
  return <AdminDashboard initialLinktrees={[]} currentUsername={session.user.username} />;
}

