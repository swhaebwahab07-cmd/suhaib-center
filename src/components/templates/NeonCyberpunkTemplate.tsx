"use client";

import Image from "next/image";
import { memo, useMemo, useCallback } from "react";
import {
  getPlatformColors,
  getPlatformIcon,
  getPlatformName,
} from "@/components/public/LinktreeButtons";
import type { TemplateComponentProps } from "./types";
import { SPONSOR_TEXT, DEFAULT_FOOTER_NAME, DEFAULT_FOOTER_PHONE } from "@/lib/constants/footer";

const FALLBACK_SUBTITLE = "بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە";

export const NeonCyberpunkTemplate = memo(function NeonCyberpunkTemplate({
  linktree,
  links,
  theme: _theme, // Not used - template has fixed colors
  onLinkClick,
}: TemplateComponentProps) {
  const profileImage = useMemo(() => linktree.image || "/images/DefaultAvatar.png", [linktree.image]);
  const subtitle = useMemo(() => linktree.subtitle?.trim() || FALLBACK_SUBTITLE, [linktree.subtitle]);

  // NeonCyberpunk template uses fixed neon colors - doesn't use theme colors
  const backgroundGradient = useMemo(
    () => ({
      background: `linear-gradient(to bottom right, #000000, #0a0a0a, #000000)`,
    }),
    [],
  );

  const handleLinkClick = useCallback(
    (linkId: string, url: string, platform: string, defaultMessage?: string | null) => {
      onLinkClick(linkId, url, platform, defaultMessage);
    },
    [onLinkClick]
  );

  // Fixed neon colors for cyberpunk aesthetic
  const neonGlowColor = useMemo(() => "#06b6d4", []); // Cyan
  const neonSecondaryColor = useMemo(() => "#87CEEB", []); // Sky blue

  return (
    <div className="relative flex min-h-screen w-full justify-center overflow-y-auto px-6 py-12 pb-4">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-black" aria-hidden />
      <div className="absolute inset-0" style={backgroundGradient} aria-hidden />
      
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black, transparent)',
        }}
        aria-hidden
      />
      
      {/* Static Glow Effects - No Animation */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full blur-[60px] sm:blur-[80px] md:blur-[100px] opacity-15 sm:opacity-20 md:opacity-25"
        style={{ 
          background: `${neonGlowColor}40`,
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))",
          }}
        aria-hidden
      />
      <div 
        className="absolute bottom-0 left-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full blur-[60px] sm:blur-[80px] md:blur-[100px] opacity-15 sm:opacity-20 md:opacity-25"
        style={{ 
          background: `${neonSecondaryColor}40`,
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))",
          }}
        aria-hidden
      />

      <div 
        className="relative z-10 flex w-full max-w-md flex-col items-center gap-5 sm:gap-6 md:gap-8"
        style={{ contain: "layout style" }}
      >
        {/* Profile Section */}
        <div className="text-center w-full">
          <div className="relative inline-block mb-4 sm:mb-5 md:mb-6">
            <div 
              className="absolute inset-0 rounded-full blur-md"
              style={{ 
                background: `linear-gradient(to right, ${neonGlowColor}, ${neonSecondaryColor})`,
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))",
          }}
              aria-hidden
            />
            <div 
              className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-2 sm:border-3 md:border-4 overflow-hidden"
              style={{ 
                borderColor: neonGlowColor,
                boxShadow: `0 0 30px ${neonGlowColor}60`,
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
                willChange: "auto"
              }}
            >
              <Image
                src={profileImage}
                alt={linktree.name}
                fill
                sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
                className="object-cover"
                priority
                quality={75}
              />
            </div>
          </div>
          
          <div className="mb-2">
            <h1 
              className="text-2xl sm:text-3xl md:text-4xl font-black mb-1.5 sm:mb-2 tracking-tight"
              style={{
                background: `linear-gradient(to right, ${neonGlowColor}, ${neonSecondaryColor}, ${neonGlowColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: `0 0 20px ${neonGlowColor}50`
              }}
            >
              {linktree.name}
            </h1>
            <div 
              className="inline-block px-3 py-0.5 sm:px-4 sm:py-1 rounded-full mb-1.5 sm:mb-2"
              style={{ background: `linear-gradient(to right, ${neonGlowColor}, ${neonSecondaryColor})` }}
            >
              <p className="text-white text-xs sm:text-sm font-bold">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-3 sm:space-y-3.5 md:space-y-4 w-full">
          {links.length === 0 ? (
            <div 
              className="relative bg-gray-900/80 backdrop-blur-sm border-2 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 text-center"
              style={{
                borderColor: neonGlowColor,
                boxShadow: `0 0 10px ${neonGlowColor}40`
              }}
            >
              <p className="text-gray-400 text-xs sm:text-sm">هێشتا هیچ لینکێک نییە</p>
            </div>
          ) : (
            links.map((link) => {
              const colors = getPlatformColors(link.platform);
              const icon = getPlatformIcon(link.platform, "w-5 h-5 sm:w-6 sm:h-6 text-white");
              const label = link.display_name || getPlatformName(link.platform);
              const linkColor = colors.via || neonGlowColor;

              return (
                <button
                  key={link.id}
                  type="button"
                  dir="ltr"
                  onClick={() => handleLinkClick(link.id, link.url, link.platform, link.default_message)}
                  className="group block relative w-full"
                  style={{
                    contain: "layout style paint",
                    transform: "translateZ(0)"
                  }}
                >
                  <div 
                    className="absolute inset-0 rounded-lg sm:rounded-xl blur-sm opacity-40 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity duration-200 sm:duration-300"
                    style={{
                      background: `linear-gradient(90deg, ${linkColor}40, ${linkColor}20)`,
                      boxShadow: `0 0 12px ${linkColor}30 sm:0 0 16px ${linkColor}35 md:0 0 20px ${linkColor}40`,
                      transform: "translateZ(0)",
                      backfaceVisibility: "hidden",
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))",
          }}
                    aria-hidden
                  />
                  
                  <div 
                    className="relative bg-gray-900/80 backdrop-blur-sm border-2 rounded-lg sm:rounded-xl p-3.5 sm:p-4 sm:group-hover:bg-gray-800/80 transition-all duration-200 sm:duration-300 active:scale-[0.98]"
                    style={{
                      borderColor: linkColor,
                      boxShadow: `0 0 8px ${linkColor}30 sm:0 0 10px ${linkColor}35 md:0 0 12px ${linkColor}40`,
                      transform: "translateZ(0)",
                      backfaceVisibility: "hidden",
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))",
          }}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div 
                        className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${colors.from}60, ${colors.via}40)`,
                          boxShadow: `0 4px 15px ${linkColor}40`
                        }}
                      >
                        {icon}
                      </div>
                      <span className="text-white font-bold text-sm sm:text-base md:text-lg flex-1 text-left min-w-0 truncate">
                        {label}
                      </span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-white/10 flex-shrink-0">
                        <svg 
                          className="w-4 h-4 sm:w-5 sm:h-5 text-white" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
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
              <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wider sm:tracking-widest" style={{ color: neonGlowColor }}>
                {SPONSOR_TEXT}
              </p>
              <p 
                onClick={() => {
                  const phone = linktree.footer_phone?.trim() || DEFAULT_FOOTER_PHONE;
                  const cleanPhone = phone.startsWith("+") ? phone.slice(1) : phone;
                  window.open(`https://wa.me/${cleanPhone}`, "_blank", "noopener,noreferrer");
                }}
                className="mt-1.5 sm:mt-1 text-sm sm:text-base font-black cursor-pointer hover:opacity-80 transition-opacity" 
                style={{ color: neonSecondaryColor }}
              >
                {linktree.footer_text?.trim() || DEFAULT_FOOTER_NAME}
              </p>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
      `}</style>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.linktree.id === nextProps.linktree.id &&
    prevProps.linktree.name === nextProps.linktree.name &&
    prevProps.linktree.subtitle === nextProps.linktree.subtitle &&
    prevProps.linktree.image === nextProps.linktree.image &&
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
