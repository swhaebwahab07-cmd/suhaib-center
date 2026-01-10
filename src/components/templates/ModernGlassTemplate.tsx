"use client";

import { memo, useMemo } from "react";
import { LinktreeHeader } from "@/components/public/LinktreeHeader";
import { LinktreeButtons } from "@/components/public/LinktreeButtons";
import { Footer } from "@/components/public/Footer";
import type { TemplateComponentProps } from "./types";
import { deriveTextColor, deriveTextSecondaryColor } from "@/lib/utils/theme-colors";

export const ModernGlassTemplate = memo(function ModernGlassTemplate({
  linktree,
  links,
  theme,
  onLinkClick,
}: TemplateComponentProps) {
  const backgroundStyle = useMemo(
    () => ({
      background: theme.isSolid 
        ? theme.from 
        : `linear-gradient(to bottom right, ${theme.from}, ${theme.via}, ${theme.to})`,
    }),
    [theme.from, theme.via, theme.to, theme.isSolid],
  );

  const textColor = useMemo(() => deriveTextColor(theme.from, theme.via, theme.to), [theme.from, theme.via, theme.to]);
  const textSecondaryColor = useMemo(() => deriveTextSecondaryColor(theme.from, theme.via, theme.to), [theme.from, theme.via, theme.to]);

  return (
    <div 
      className="relative flex min-h-screen w-full flex-col items-center overflow-y-auto px-4 pt-10 pb-4"
      style={backgroundStyle}
    >
      <div className="w-full max-w-md mx-auto scale-[0.95] sm:scale-100">
        <LinktreeHeader linktree={linktree} textColor={textColor} textSecondaryColor={textSecondaryColor} />
      </div>

      <div className="mt-7 w-full max-w-md mx-auto">
        <LinktreeButtons links={links} onLinkClick={onLinkClick} />
      </div>

      <Footer 
        footerText={linktree.footer_text}
        footerPhone={linktree.footer_phone}
        footerHidden={linktree.footer_hidden ?? false}
        transparent={true}
        textColor={textColor}
        textSecondaryColor={textSecondaryColor}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.linktree.id === nextProps.linktree.id &&
    prevProps.linktree.name === nextProps.linktree.name &&
    prevProps.linktree.subtitle === nextProps.linktree.subtitle &&
    prevProps.linktree.image === nextProps.linktree.image &&
    prevProps.linktree.footer_text === nextProps.linktree.footer_text &&
    prevProps.linktree.footer_phone === nextProps.linktree.footer_phone &&
    prevProps.theme.from === nextProps.theme.from &&
    prevProps.theme.via === nextProps.theme.via &&
    prevProps.theme.to === nextProps.theme.to &&
    prevProps.links.length === nextProps.links.length &&
    prevProps.links.every((link, idx) => 
      link.id === nextProps.links[idx]?.id &&
      link.url === nextProps.links[idx]?.url &&
      link.display_name === nextProps.links[idx]?.display_name
    )
  );
});
