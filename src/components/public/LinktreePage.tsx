"use client";

import { memo, useCallback, useMemo, useEffect } from "react";
import { Link } from "@/lib/supabase/queries";
import { Linktree } from "@/lib/supabase/queries";
import { appendMessageToUrl } from "@/lib/utils/message-url";
import { DynamicTemplate } from "@/components/templates/DynamicTemplate";
import type { TemplateTheme } from "@/components/templates";
import {
  deriveAccentColor,
  deriveBorderColor,
  deriveTextColor,
  deriveTextSecondaryColor,
  deriveHighlightColor,
} from "@/lib/utils/theme-colors";

interface LinktreePageProps {
  linktree: Linktree;
  links: Link[];
}

// Background color gradients mapping (matches CreateLinktreeModal BACKGROUND_COLORS)
// Maps hex color values to gradient colors (from, via, to) or solid color
const BACKGROUND_GRADIENTS: Record<string, { from: string; via: string; to: string; isSolid?: boolean }> = {
  "#6366f1": { from: "#0b1224", via: "#1c2d52", to: "#b7791f" }, // old default (brand-aligned navy to warm amber)
  "#dc2626": { from: "#B0E0E6", via: "#87CEEB", to: "#6BB6D6" }, // default (soft sky blue gradient)
  "#1e40af": { from: "#1e3a8a", via: "#1e40af", to: "#1e3a8a" }, // blue (blue-900, blue-800, blue-900)
  "#7c3aed": { from: "#581c87", via: "#6b21a8", to: "#581c87" }, // purple (purple-900, purple-800, purple-900)
  "#166534": { from: "#14532d", via: "#166534", to: "#14532d" }, // green (green-900, green-800, green-900)
  "#991b1b": { from: "#0c4a6e", via: "#0284c7", to: "#0c4a6e" }, // red option changed to sky blue (sky-800, sky-600, sky-800)
  "#c2410c": { from: "#9a3412", via: "#c2410c", to: "#9a3412" }, // orange (orange-900, orange-800, orange-900)
  "#9f1239": { from: "#831843", via: "#9f1239", to: "#831843" }, // pink/rose (pink-900, pink-800, pink-900)
  "#164e63": { from: "#0e7490", via: "#155e75", to: "#0e7490" }, // cyan (cyan-900, cyan-800, cyan-900)
  "#312e81": { from: "#1e1b4b", via: "#312e81", to: "#1e1b4b" }, // indigo (indigo-900, indigo-800, indigo-900)
  "#134e4a": { from: "#0f766e", via: "#134e4a", to: "#0f766e" }, // teal (teal-900, teal-800, teal-900)
  "#854d0e": { from: "#713f12", via: "#854d0e", to: "#713f12" }, // yellow (yellow-900, yellow-800, yellow-900)
  "#064e3b": { from: "#022c22", via: "#064e3b", to: "#022c22" }, // emerald (emerald-900, emerald-800, emerald-900)
  "#4c1d95": { from: "#3b0764", via: "#4c1d95", to: "#3b0764" }, // violet (violet-900, violet-800, violet-900)
  "#701a75": { from: "#581c87", via: "#701a75", to: "#581c87" }, // fuchsia (fuchsia-900, fuchsia-800, fuchsia-900)
  // Solid colors
  "#ffffff": { from: "#ffffff", via: "#ffffff", to: "#ffffff", isSolid: true }, // pure-white
  "#000000": { from: "#000000", via: "#000000", to: "#000000", isSolid: true }, // pure-black
  // White and light gradients
  "#f3f4f6": { from: "#f3f4f6", via: "#ffffff", to: "#f3f4f6" }, // white (gray-100, white, gray-100)
  "#e5e7eb": { from: "#e5e7eb", via: "#f3f4f6", to: "#e5e7eb" }, // light-gray (gray-200, gray-100, gray-200)
  "#d1d5db": { from: "#d1d5db", via: "#e5e7eb", to: "#d1d5db" }, // silver (gray-300, gray-200, gray-300)
  // Grey gradients
  "#4b5563": { from: "#4b5563", via: "#6b7280", to: "#4b5563" }, // gray (gray-600, gray-500, gray-600)
  "#1f2937": { from: "#1f2937", via: "#374151", to: "#1f2937" }, // dark-gray (gray-800, gray-700, gray-800)
  "#111827": { from: "#111827", via: "#1f2937", to: "#111827" }, // charcoal (gray-900, gray-800, gray-900)
  // Additional color variations
  "#0284c7": { from: "#0284c7", via: "#0ea5e9", to: "#0284c7" }, // sky-blue (sky-600, sky-500, sky-600)
  "#65a30d": { from: "#65a30d", via: "#84cc16", to: "#65a30d" }, // lime (lime-600, lime-500, lime-600)
  "#d97706": { from: "#d97706", via: "#f59e0b", to: "#d97706" }, // amber (amber-600, amber-500, amber-600)
  "#475569": { from: "#475569", via: "#64748b", to: "#475569" }, // slate (slate-700, slate-600, slate-700)
  "#52525b": { from: "#52525b", via: "#71717a", to: "#52525b" }, // zinc (zinc-700, zinc-600, zinc-700)
  "#57534e": { from: "#57534e", via: "#78716c", to: "#57534e" }, // stone (stone-700, stone-600, stone-700)
  "#525252": { from: "#525252", via: "#737373", to: "#525252" }, // neutral (neutral-700, neutral-600, neutral-700)
  // More gradient variations
  "#0891b2": { from: "#0284c7", via: "#06b6d4", to: "#14b8a6" }, // ocean (blue-600, cyan-500, teal-600)
  "#f97316": { from: "#f97316", via: "#ec4899", to: "#f43f5e" }, // sunset (orange-500, pink-500, rose-500)
  "#15803d": { from: "#15803d", via: "#10b981", to: "#0d9488" }, // forest (green-700, emerald-600, teal-700)
  "#a855f7": { from: "#a78bfa", via: "#8b5cf6", to: "#d946ef" }, // lavender (purple-400, violet-400, fuchsia-400)
  "#1e293b": { from: "#0f172a", via: "#312e81", to: "#581c87" }, // midnight (slate-900, indigo-900, purple-900)
  "#ff6f61": { from: "#2b1055", via: "#ff6f61", to: "#ffd166" }, // coral sunset
  "#0ea5e9": { from: "#0b1224", via: "#0ea5e9", to: "#9333ea" }, // aurora
  "#14b8a6": { from: "#0f172a", via: "#14b8a6", to: "#a3e635" }, // mint glow
  "#9333ea": { from: "#1e1b4b", via: "#9333ea", to: "#f472b6" }, // royal bloom
  "#f472b6": { from: "#2f1553", via: "#f472b6", to: "#facc15" }, // blush gold
  "#38bdf8": { from: "#0f172a", via: "#38bdf8", to: "#7c3aed" }, // ice drift
  // Black gradients
  "#0a0a0a": { from: "#000000", via: "#111827", to: "#000000" }, // black-gray
  "#0d0d0d": { from: "#000000", via: "#1f2937", to: "#111827" }, // black-charcoal
  "#0f0f0f": { from: "#000000", via: "#0f172a", to: "#1e1b4b" }, // black-midnight
  "#0c0c0c": { from: "#000000", via: "#3b0764", to: "#000000" }, // black-purple
  "#0b0b0b": { from: "#000000", via: "#7f1d1d", to: "#000000" }, // black-red
  "#0e0e0e": { from: "#000000", via: "#022c22", to: "#000000" }, // black-green
  "#0a0a0f": { from: "#000000", via: "#1e1b4b", to: "#000000" }, // black-indigo
  "#0a0f0f": { from: "#000000", via: "#042f2e", to: "#000000" }, // black-teal
  "#0f0a0f": { from: "#000000", via: "#3b0764", to: "#000000" }, // black-violet
  "#0f0a1f": { from: "#000000", via: "#86198f", to: "#000000" }, // black-fuchsia
  "#0a1f1f": { from: "#000000", via: "#083344", to: "#000000" }, // black-cyan
  "#0a0a1a": { from: "#000000", via: "#020617", to: "#000000" }, // black-slate
  "#0a0a2a": { from: "#000000", via: "#18181b", to: "#000000" }, // black-zinc
  "#0a0a3a": { from: "#000000", via: "#0c0a09", to: "#000000" }, // black-stone
  "#0a0a4a": { from: "#000000", via: "#0a0a0a", to: "#000000" }, // black-neutral
  "#0a0a5f": { from: "#000000", via: "#172554", to: "#000000" }, // black-blue
  "#0f0a0a": { from: "#000000", via: "#7c2d12", to: "#000000" }, // black-amber
  "#0f0a1a": { from: "#000000", via: "#881337", to: "#000000" }, // black-rose
  "#0a0f0a": { from: "#000000", via: "#022c22", to: "#000000" }, // black-emerald
};

export const LinktreePage = memo(function LinktreePage({ linktree, links }: LinktreePageProps) {
  // Fix viewport height on iOS - must be client-side
  // This ensures proper height calculation on iPhone Safari
  // Performance: Debounced resize handler
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    let timeoutId: NodeJS.Timeout;
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    
    // Set on load
    setVH();
    
    // Debounced resize handler for better performance
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(setVH, 150); // Debounce 150ms
    };
    
    // Update on resize and orientation change
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", setVH, { passive: true });
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", setVH);
    };
  }, []);

  // Track page view only once per session (batched every 3 hours)
  useEffect(() => {
    const { trackPageView } = require("@/lib/utils/tracking");
    const { queueView } = require("@/lib/utils/analytics-batch");
    
    // Only track if not already tracked in this session
    if (!trackPageView(linktree.uid)) {
      return; // Already tracked, skip
    }
    
    // Queue view for batched sending (reduces function invocations)
    queueView(linktree.uid);
  }, [linktree.uid]);
  // Simplified theme calculation
  const theme: TemplateTheme = useMemo(() => {
    const bgColor = linktree.background_color || "#6366f1";
    const baseTheme = BACKGROUND_GRADIENTS[bgColor] || BACKGROUND_GRADIENTS["#6366f1"];

    return {
      ...baseTheme,
      accent: deriveAccentColor(baseTheme.from, baseTheme.via, baseTheme.to),
      border: deriveBorderColor(baseTheme.from, baseTheme.via, baseTheme.to, 0.3),
      text: deriveTextColor(baseTheme.from, baseTheme.via, baseTheme.to),
      textSecondary: deriveTextSecondaryColor(baseTheme.from, baseTheme.via, baseTheme.to),
      highlight: deriveHighlightColor(baseTheme.from, baseTheme.via, baseTheme.to),
    };
  }, [linktree.background_color]);

  // Simple background application
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bgColor = linktree.background_color || "#6366f1";
    const baseTheme = BACKGROUND_GRADIENTS[bgColor] || BACKGROUND_GRADIENTS["#6366f1"];
    const bgStyle = baseTheme.isSolid 
      ? baseTheme.from 
      : `linear-gradient(to bottom right, ${baseTheme.from}, ${baseTheme.via}, ${baseTheme.to})`;
    
      const container = document.querySelector('body > div[data-theme-background]') as HTMLElement;
      if (container) {
      container.style.background = bgStyle;
      }
  }, [linktree.background_color]);

  const handleLinkClick = useCallback((linkId: string, url: string, platform: string, defaultMessage?: string | null) => {
    // Track click using unified batched system (reduces API calls)
    const { trackLinkClick } = require("@/lib/utils/tracking");
    const { queueClick } = require("@/lib/utils/analytics-batch");
    
    // Only track if not already tracked in this session
    if (trackLinkClick(linkId)) {
      // Queue click for batched sending (reduces function invocations)
      queueClick(linkId);
    }

    // Append default message to URL if platform supports it
    const finalUrl = appendMessageToUrl(url, platform, defaultMessage);

    // Open in new tab
    try {
      window.open(finalUrl, "_blank", "noopener,noreferrer");
    } catch {
      // Ignore popup blockers
    }
  }, []);

  return (
      <DynamicTemplate
        linktree={linktree}
        links={links}
        theme={theme}
        onLinkClick={handleLinkClick}
      />
  );
});
