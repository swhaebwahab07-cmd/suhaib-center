"use client";

import Image from "next/image";
import { memo, useMemo, useCallback } from "react";
import { SPONSOR_TEXT, DEFAULT_FOOTER_NAME, DEFAULT_FOOTER_PHONE } from "@/lib/constants/footer";
import {
  getPlatformColors,
  getPlatformIcon,
  getPlatformName,
} from "@/components/public/LinktreeButtons";
import type { TemplateComponentProps } from "./types";

const FALLBACK_SUBTITLE = "بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە";

export const SoftNeumorphicTemplate = memo(function SoftNeumorphicTemplate({
  linktree,
  links,
  theme: _theme, // Not used - template has fixed colors
  onLinkClick,
}: TemplateComponentProps) {
  const profileImage = useMemo(() => linktree.image || "/images/DefaultAvatar.png", [linktree.image]);
  const subtitle = useMemo(() => linktree.subtitle?.trim() || FALLBACK_SUBTITLE, [linktree.subtitle]);

  // SoftNeumorphic template uses fixed soft neumorphic colors - doesn't use theme colors
  const backgroundGradient = useMemo(
    () => ({
      background: `linear-gradient(to bottom right, #e5e7eb, #f3f4f6, #e5e7eb)`, // Soft gray neumorphic
    }),
    [],
  );

  const handleLinkClick = useCallback(
    (linkId: string, url: string, platform: string, defaultMessage?: string | null) => {
      onLinkClick(linkId, url, platform, defaultMessage);
    },
    [onLinkClick]
  );

  // Neumorphic shadow styles
  const neumorphicOutset = useMemo(
    () => ({
      boxShadow: '12px 12px 24px rgba(0,0,0,0.15), -12px -12px 24px rgba(255,255,255,0.7)',
    }),
    []
  );

  const neumorphicInset = useMemo(
    () => ({
      boxShadow: 'inset 8px 8px 16px rgba(0,0,0,0.1), inset -8px -8px 16px rgba(255,255,255,0.7)',
    }),
    []
  );

  const neumorphicCardOutset = useMemo(
    () => ({
      boxShadow: '20px 20px 60px rgba(0,0,0,0.15), -20px -20px 60px rgba(255,255,255,0.7)',
    }),
    []
  );

  const neumorphicIconOutset = useMemo(
    () => ({
      boxShadow: '6px 6px 12px rgba(0,0,0,0.15), -6px -6px 12px rgba(255,255,255,0.7)',
    }),
    []
  );

  const neumorphicButtonOutset = useMemo(
    () => ({
      boxShadow: '4px 4px 8px rgba(0,0,0,0.15), -4px -4px 8px rgba(255,255,255,0.7)',
    }),
    []
  );

  return (
    <div className="relative flex min-h-screen w-full justify-center overflow-y-auto px-4 py-12 pb-4">
      {/* Background with gradient */}
      <div className="absolute inset-0" style={backgroundGradient} aria-hidden />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-5 sm:gap-6 md:gap-8">
        {/* Profile Card with Neumorphic Effect */}
        <div 
          className="bg-white/80 rounded-2xl sm:rounded-[2.5rem] md:rounded-[3rem] p-5 sm:p-6 md:p-8 w-full relative backdrop-blur-sm"
          style={neumorphicCardOutset}
        >
          <div className="text-center">
            {/* Avatar with Neumorphic Effect */}
            <div 
              className="inline-block rounded-full p-1.5 sm:p-2 mb-4 sm:mb-5 md:mb-6"
              style={neumorphicInset}
            >
              <div 
                className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden"
                style={{
                  transform: "translateZ(0)",
                  backfaceVisibility: "hidden",
                  willChange: "auto"
                }}
              >
                <Image
                  src={profileImage}
                  alt={linktree.name}
                  fill
                  sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, 112px"
                  className="object-cover"
                  priority
                  quality={75}
                />
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1.5 sm:mb-2">
              {linktree.name}
            </h1>
            <div 
              className="inline-block bg-white/80 px-4 py-1.5 sm:px-5 sm:py-2 md:px-6 md:py-2 rounded-full mb-2 sm:mb-2.5 md:mb-3 backdrop-blur-sm"
              style={neumorphicInset}
            >
              <p className="text-xs sm:text-sm font-semibold text-gray-600">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Links with Neumorphic Effect */}
        <div className="space-y-3 sm:space-y-4 md:space-y-5 w-full">
          {links.length === 0 ? (
            <div 
              className="bg-white/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 text-center backdrop-blur-sm"
              style={neumorphicOutset}
            >
              <p className="text-gray-600 text-xs sm:text-sm">هێشتا هیچ لینکێک نییە</p>
            </div>
          ) : (
            links.map((link) => {
              const colors = getPlatformColors(link.platform);
              const icon = getPlatformIcon(link.platform, "w-5 h-5 sm:w-6 sm:h-6");
              const label = link.display_name || getPlatformName(link.platform);

              return (
                <button
                  key={link.id}
                  type="button"
                  dir="ltr"
                  onClick={() => handleLinkClick(link.id, link.url, link.platform, link.default_message)}
                  className="group block bg-white/80 rounded-2xl sm:rounded-3xl p-4 sm:p-4.5 md:p-5 w-full transition-all duration-300 backdrop-blur-sm"
                  style={{
                    ...neumorphicOutset,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'inset 8px 8px 16px rgba(0,0,0,0.1), inset -8px -8px 16px rgba(255,255,255,0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '12px 12px 24px rgba(0,0,0,0.15), -12px -12px 24px rgba(255,255,255,0.7)';
                  }}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div 
                      className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 bg-white/80 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0"
                      style={neumorphicIconOutset}
                    >
                      <div style={{ color: colors.from }}>
                        {icon}
                      </div>
                    </div>
                    <span className="text-gray-700 font-semibold text-sm sm:text-base md:text-lg flex-1 text-left min-w-0 truncate">
                      {label}
                    </span>
                    <div 
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-white/80 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0"
                      style={neumorphicButtonOutset}
                    >
                      <svg 
                        className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer with Neumorphic Effect - Responsive */}
        <footer 
          className="w-full flex justify-center px-3 sm:px-4 py-4 sm:py-5 md:py-6"
          style={{
            paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
          }}
        >
          <div 
            className="inline-block text-center"
            style={{
              transform: "translateZ(0)",
              backfaceVisibility: "hidden",
            }}
          >
            <p className="text-[11px] sm:text-xs font-medium tracking-wide text-gray-600">
              {SPONSOR_TEXT}
            </p>
            <p 
              onClick={() => {
                const phone = linktree.footer_phone?.trim() || DEFAULT_FOOTER_PHONE;
                const cleanPhone = phone.startsWith("+") ? phone.slice(1) : phone;
                window.open(`https://wa.me/${cleanPhone}`, "_blank", "noopener,noreferrer");
              }}
              className="mt-1.5 sm:mt-1 text-sm sm:text-base font-semibold text-sky-600 cursor-pointer hover:opacity-80 transition-opacity"
            >
              {linktree.footer_text?.trim() || DEFAULT_FOOTER_NAME}
            </p>
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
