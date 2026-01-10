"use client";

import Image from "next/image";
import { memo, useMemo, useCallback } from "react";
import {
  getPlatformColors,
  getPlatformIcon,
  getPlatformName,
} from "@/components/public/LinktreeButtons";
import { SPONSOR_TEXT, DEFAULT_FOOTER_NAME, DEFAULT_FOOTER_PHONE } from "@/lib/constants/footer";
import type { TemplateComponentProps } from "./types";

const FALLBACK_SUBTITLE = "بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە";

export const PixelTemplate = memo(function PixelTemplate({
  linktree,
  links,
  theme,
  onLinkClick,
}: TemplateComponentProps) {
  const profileImage = useMemo(() => linktree.image || "/images/DefaultAvatar.png", [linktree.image]);
  const subtitle = useMemo(() => linktree.subtitle?.trim() || FALLBACK_SUBTITLE, [linktree.subtitle]);

  const backgroundGradient = useMemo(
    () => ({
      background: `linear-gradient(135deg, ${theme.from}, ${theme.via}, ${theme.to})`,
    }),
    [theme.from, theme.via, theme.to],
  );

  const handleLinkClick = useCallback(
    (linkId: string, url: string, platform: string, defaultMessage?: string | null) => {
      onLinkClick(linkId, url, platform, defaultMessage);
    },
    [onLinkClick],
  );

  return (
    <div 
      className="relative flex min-h-screen w-full justify-center overflow-y-auto px-4 py-8 pb-4"
      style={{
        imageRendering: "pixelated",
      }}
    >
      {/* Background with gradient */}
      <div className="absolute inset-0" style={backgroundGradient} aria-hidden />
      
      {/* Pixel Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, transparent 1px, transparent 8px, rgba(255,255,255,0.1) 9px),
                           repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, transparent 1px, transparent 8px, rgba(255,255,255,0.1) 9px)`,
          backgroundSize: '8px 8px',
          imageRendering: "pixelated",
        }}
        aria-hidden
      />

      <div 
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-4 sm:gap-5 md:gap-6"
        style={{ contain: "layout style paint" }}
      >
        {/* Profile Section */}
        <div className="text-center w-full">
          <div className="relative inline-block mb-3 sm:mb-4 md:mb-5">
            {/* Pixelated Border */}
            <div 
              className="absolute -inset-2 sm:-inset-3 md:-inset-4"
              style={{
                background: "linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
                backgroundSize: "8px 8px",
                backgroundPosition: "0 0, 4px 4px",
                imageRendering: "pixelated",
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
                willChange: "auto",
              }}
              aria-hidden
            />
            <div 
              className="relative rounded-full overflow-hidden border-4 border-white shadow-[0_0_0_2px_#000,0_0_0_4px_#fff,0_0_0_6px_#000]"
              style={{
                imageRendering: "pixelated",
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
                willChange: "auto",
              }}
            >
              <Image
                src={profileImage}
                alt={linktree.name}
                width={120}
                height={120}
                quality={75}
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover"
                style={{
                  imageRendering: "pixelated",
                }}
              />
            </div>
          </div>

          {/* Name with Pixelated Style */}
          <h1 
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-white drop-shadow-[2px_2px_0_#000,4px_4px_0_#000]"
            style={{
              fontFamily: "monospace",
              textShadow: "2px 2px 0 #000, 4px 4px 0 #000",
              letterSpacing: "0.05em",
            }}
          >
            {linktree.name}
          </h1>

          {/* Subtitle with Pixelated Style */}
          <p 
            className="text-sm sm:text-base md:text-lg text-white/90 mb-4 sm:mb-5 md:mb-6 font-kurdish"
            style={{
              fontFamily: "monospace",
              textShadow: "1px 1px 0 #000",
              letterSpacing: "0.02em",
            }}
          >
            {subtitle}
          </p>
        </div>

        {/* Links Section */}
        <div className="w-full flex flex-col gap-2.5 sm:gap-3 md:gap-4">
          {links.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/60 font-kurdish text-sm sm:text-base">هیچ لینکێک نییە</p>
            </div>
          ) : (
            links.map((link) => {
              const colors = getPlatformColors(link.platform);
              const icon = getPlatformIcon(link.platform, "w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-black");
              const platformName = getPlatformName(link.platform);
              const label = link.display_name || platformName;

              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id, link.url, link.platform, link.default_message)}
                  className="group relative w-full text-left px-4 py-3.5 sm:px-5 sm:py-4 md:px-6 md:py-4.5 bg-white border-4 border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-75 active:shadow-[0_0_0_#000] active:translate-x-[4px] active:translate-y-[4px]"
                  style={{
                    background: `linear-gradient(135deg, ${colors.from}, ${colors.via}, ${colors.to})`,
                    imageRendering: "pixelated",
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden",
                    willChange: "transform",
                    contain: "layout style paint",
                  }}
                >
                  <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
                    {/* Icon with Pixelated Border */}
                    <div 
                      className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white border-2 border-black flex items-center justify-center"
                      style={{
                        imageRendering: "pixelated",
                      }}
                    >
                      {icon}
                    </div>
                    
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div 
                        className="text-base sm:text-lg md:text-xl font-bold text-white truncate"
                        style={{
                          fontFamily: "monospace",
                          textShadow: "1px 1px 0 #000",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {label}
                      </div>
                      {link.description && (
                        <div 
                          className="text-xs sm:text-sm text-white/80 truncate mt-1.5 sm:mt-1"
                          style={{
                            fontFamily: "monospace",
                            textShadow: "0.5px 0.5px 0 #000",
                          }}
                        >
                          {link.description}
                        </div>
                      )}
                    </div>

                    {/* Arrow Pixel */}
                    <div 
                      className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-black flex items-center justify-center"
                      style={{
                        imageRendering: "pixelated",
                      }}
                    >
                      <div className="w-0 h-0 border-l-[6px] sm:border-l-[7px] md:border-l-[8px] border-l-white border-t-[4px] sm:border-t-[5px] md:border-t-[6px] border-t-transparent border-b-[4px] sm:border-b-[5px] md:border-b-[6px] border-b-transparent" />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer - Responsive - Shows below buttons */}
        <footer 
          className="w-full flex justify-center px-3 sm:px-4 py-4 sm:py-5 md:py-6"
          style={{
            paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
          }}
        >
          <div className="w-full text-center">
            <div>
              <p 
                className="text-black text-[11px] sm:text-xs font-bold font-kurdish leading-tight"
                style={{
                  fontFamily: "monospace",
                  letterSpacing: "0.05em",
                  textShadow: "1px 1px 0 rgba(0,0,0,0.2)",
                }}
              >
                {SPONSOR_TEXT}
              </p>
              <p 
                onClick={() => {
                  const phone = linktree.footer_phone?.trim() || DEFAULT_FOOTER_PHONE;
                  const cleanPhone = phone.startsWith("+") ? phone.slice(1) : phone;
                  window.open(`https://wa.me/${cleanPhone}`, "_blank", "noopener,noreferrer");
                }}
                className="text-sky-600 text-xs sm:text-sm font-bold font-kurdish mt-1.5 sm:mt-1 leading-tight cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  fontFamily: "monospace",
                  letterSpacing: "0.05em",
                  textShadow: "1px 1px 0 rgba(0,0,0,0.2)",
                }}
              >
                {linktree.footer_text?.trim() || DEFAULT_FOOTER_NAME}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.linktree.id === nextProps.linktree.id &&
    prevProps.linktree.name === nextProps.linktree.name &&
    prevProps.linktree.image === nextProps.linktree.image &&
    prevProps.linktree.subtitle === nextProps.linktree.subtitle &&
    prevProps.links.length === nextProps.links.length &&
    prevProps.links.every((link, idx) => 
      link.id === nextProps.links[idx]?.id &&
      link.display_name === nextProps.links[idx]?.display_name &&
      link.url === nextProps.links[idx]?.url &&
      link.platform === nextProps.links[idx]?.platform
    ) &&
    prevProps.theme.from === nextProps.theme.from &&
    prevProps.theme.via === nextProps.theme.via &&
    prevProps.theme.to === nextProps.theme.to
  );
});
