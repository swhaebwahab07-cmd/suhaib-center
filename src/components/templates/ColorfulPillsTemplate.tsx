"use client";

import Image from "next/image";
import { memo, useMemo, useCallback } from "react";
import {
  getPlatformIcon,
  getPlatformName,
  getPlatformColors,
} from "@/components/public/LinktreeButtons";
import type { TemplateComponentProps } from "./types";
import { deriveTextColor, deriveTextSecondaryColor } from "@/lib/utils/theme-colors";
import { DEFAULT_FOOTER_NAME, DEFAULT_FOOTER_PHONE, SPONSOR_TEXT } from "@/lib/constants/footer";

const FALLBACK_SUBTITLE = "بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە";

export const ColorfulPillsTemplate = memo(function ColorfulPillsTemplate({
  linktree,
  links,
  theme,
  onLinkClick,
}: TemplateComponentProps) {
  const profileImage = useMemo(() => linktree.image || "/images/DefaultAvatar.png", [linktree.image]);
  const subtitle = useMemo(() => linktree.subtitle?.trim() || FALLBACK_SUBTITLE, [linktree.subtitle]);

  // Get background gradient from theme
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

  const handleLinkClick = useCallback(
    (linkId: string, url: string, platform: string, defaultMessage?: string | null) => {
      onLinkClick(linkId, url, platform, defaultMessage);
    },
    [onLinkClick]
  );

  // Get platform colors for each link
  const linksWithColors = useMemo(() => {
    return links.map((link) => {
      const colors = getPlatformColors(link.platform);
      return { link, colors };
    });
  }, [links]);

  const _renderColorfulName = useCallback((name: string) => {
    const palette = [
      "text-blue-600",
      "text-blue-500",
      "text-cyan-500",
      "text-blue-400",
      "text-blue-600",
      "text-cyan-400",
      "text-blue-500",
      "text-blue-600",
    ];

    return name.split("").map((char, index) => {
      if (char === " ") {
        return <span key={`${index}-space`} className="inline-block w-1" />;
      }

      return (
        <span
          key={`${index}-${char}`}
          className={`${palette[index % palette.length]} font-semibold text-base sm:text-lg`}
        >
          {char}
        </span>
      );
    });
  }, []);

  return (
    <div 
      className="relative w-full min-h-screen overflow-y-auto py-12 px-6"
      style={backgroundStyle}
    >
      <div className="w-full max-w-md mx-auto">
        {/* Profile Section */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden">
              <Image
                src={profileImage}
                alt={linktree.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>
          
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: textColor }}
          >
            {linktree.name}
          </h1>
          <p 
            className="text-sm"
            style={{ color: textSecondaryColor }}
          >
            {subtitle}
          </p>
        </div>

        {/* Colorful Pill Links */}
        <div className="space-y-4 mb-12" style={{ direction: "ltr" }}>
          {linksWithColors.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: textSecondaryColor }}>هێشتا هیچ لینکێک نییە</p>
            </div>
          ) : (
            linksWithColors.map(({ link, colors }, index) => {
              const displayName = link.display_name || getPlatformName(link.platform);
              
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleLinkClick(link.id, link.url, link.platform, link.default_message)}
                  className="group block w-full bg-gradient-to-r rounded-full px-6 py-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  style={{
                    background: `linear-gradient(to right, ${colors.from}, ${colors.via}, ${colors.to})`,
                    animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center">
                      {getPlatformIcon(link.platform, "w-6 h-6 text-white")}
                    </div>
                    <span className="text-white font-semibold text-lg">
                      {displayName}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <footer className="w-full flex justify-center px-3 sm:px-4 py-4 sm:py-5 md:py-6">
          <div className="flex flex-col items-center text-center gap-2">
            <p
              className="text-xs sm:text-sm font-medium"
              style={{ color: textSecondaryColor }}
            >
              {SPONSOR_TEXT}
            </p>
            <button
              type="button"
              className="rounded-full border-2 border-sky-400/70 bg-sky-400/10 px-6 py-1.5 text-sm font-bold tracking-[0.3em] text-sky-500 backdrop-blur-sm transition-all duration-300 hover:border-sky-300/90 hover:bg-sky-400/20 hover:scale-105 cursor-pointer font-kurdish"
              onClick={() => {
                const phone = linktree.footer_phone?.trim() || DEFAULT_FOOTER_PHONE;
                const cleanPhone = phone.startsWith("+") ? phone.slice(1) : phone;
                window.open(`https://wa.me/${cleanPhone}`, "_blank", "noopener,noreferrer");
              }}
            >
              {linktree.footer_text?.trim() || DEFAULT_FOOTER_NAME}
            </button>
          </div>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      ` }} />
    </div>
  );
}, (prevProps, nextProps) => {
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
