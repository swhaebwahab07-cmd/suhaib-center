import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "چوونەژوورەوە - Suhaib Center",
  description: "چوونەژوورەوە بۆ بەڕێوەبردنی Suhaib Center",
  robots: "noindex, nofollow", // Don't index login page
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      {children}
    </div>
  );
}
