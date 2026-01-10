import { getLinktreeWithLinksByUid } from "@/lib/supabase/queries";
import { notFound } from "next/navigation";
import dynamicImport from "next/dynamic";

// Dynamically import LinktreePage to reduce initial bundle size
// Use ssr: true to enable server-side rendering for better SEO and initial load
const LinktreePage = dynamicImport(() => import("@/components/public/LinktreePage").then(mod => ({ default: mod.LinktreePage })), {
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  ),
  ssr: true,
});

// ISR: Revalidate every 24 hours (86400 seconds) - reduces function invocations
export const revalidate = 86400;
export const dynamic = 'force-static';

export default async function Home() {
  // Get default Suhaib Center linktree (matches admin username)
  const linktreeUid = "suhaibcenter";
  
  try {
  // Optimized: Fetch linktree and links in a single database query
  const { linktree, links } = await getLinktreeWithLinksByUid(linktreeUid);
  
  if (!linktree) {
    notFound();
  }

    return <LinktreePage linktree={linktree} links={links || []} />;
  } catch (error) {
    console.error("Error loading root page:", error);
    notFound();
  }
}

export async function generateMetadata() {
  const { linktree } = await getLinktreeWithLinksByUid("suhaibcenter");

  if (!linktree) {
    return {
      title: "Suhaib Center",
      description: "بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە",
    };
  }

  return {
    title: linktree.name,
    description: linktree.subtitle || "بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە",
    openGraph: {
      title: linktree.name,
      description: linktree.subtitle || "بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە",
      images: linktree.image ? [linktree.image] : [],
    },
  };
}
