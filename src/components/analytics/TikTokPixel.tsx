/**
 * TikTok Pixel Component (Client Component)
 * 
 * Securely loads TikTok Pixel tracking code using Next.js Script component.
 * Only loads in production or when TIKTOK_PIXEL_ID is explicitly set.
 * 
 * Environment Variable Required:
 * - NEXT_PUBLIC_TIKTOK_PIXEL_ID: Your TikTok Pixel ID
 */
"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export function TikTokPixel(): React.ReactElement | null {
  const [isMounted, setIsMounted] = useState(false);
  const pixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

  // Only mount on client to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only load if pixel ID is configured and component is mounted
  if (!pixelId) {
    return null;
  }

  // Return null during SSR to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  // Use Next.js Script component to avoid hydration mismatches
  // strategy="afterInteractive" loads after the page becomes interactive
  // isMounted check ensures no SSR rendering to prevent hydration mismatch
  return (
    <Script
      id="tiktok-pixel"
      strategy="afterInteractive"
      onLoad={() => {
        // Script loaded successfully
      }}
      onError={(e) => {
        console.error('TikTok Pixel failed to load:', e);
      }}
      dangerouslySetInnerHTML={{
        __html: `
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
            ttq.load('${pixelId}');
            ttq.page();
          }(window, document, 'ttq');
        `,
      }}
    />
  );
}
