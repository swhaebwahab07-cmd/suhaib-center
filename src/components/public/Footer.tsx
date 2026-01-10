"use client";

import { memo, useCallback } from "react";
import type { MouseEvent } from "react";
import { SPONSOR_TEXT, DEFAULT_FOOTER_NAME, DEFAULT_FOOTER_PHONE } from "@/lib/constants/footer";

interface FooterProps {
  footerText?: string | null;
  footerPhone?: string | null;
  footerHidden?: boolean;
  transparent?: boolean;
  textColor?: string;
  textSecondaryColor?: string;
}

export const Footer = memo(function Footer({
  footerText,
  footerPhone,
  footerHidden = false,
  transparent = false,
  textColor = "#ffffff",
  textSecondaryColor = "rgba(255, 255, 255, 0.7)",
}: FooterProps) {
  const sponsorText = SPONSOR_TEXT; // Always fixed sponsor text
  const nameText = footerText?.trim() || DEFAULT_FOOTER_NAME; // Clickable admin-configured name
  
  // Use footerPhone from database if present, otherwise default to configured number
  const phoneNumber = footerPhone?.trim() || DEFAULT_FOOTER_PHONE;
  // Ensure phone number has country code format (add + if missing, but wa.me doesn't need +)
  const cleanPhone = phoneNumber.startsWith("+") ? phoneNumber.slice(1) : phoneNumber;
  
  const handleSarfrazWhatsApp = useCallback((e: MouseEvent<HTMLButtonElement | HTMLParagraphElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const whatsappUrl = `https://wa.me/${cleanPhone}`;

    // Always open WhatsApp chat in a new tab to avoid duplicate targets
    try {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch {
      // Ignore popup blockers; user can tap again
    }
  }, [cleanPhone]);

  // Don't render footer if hidden
  if (footerHidden) {
    return null;
  }

  if (transparent) {
    return (
      <footer 
        className="w-full flex justify-center px-3 sm:px-4 py-4 sm:py-5 md:py-6"
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
        }}
      >
        <div className="w-full text-center max-w-md mx-auto">
          <p 
            className="text-[11px] sm:text-xs md:text-sm font-medium tracking-wide leading-tight"
            style={{ color: textSecondaryColor }}
          >
            {sponsorText}
          </p>
          <p 
            onClick={handleSarfrazWhatsApp}
            className="inline-block mt-1.5 sm:mt-1 rounded-full border-2 border-sky-400/70 bg-sky-400/10 px-6 py-1.5 text-sm font-bold font-kurdish tracking-[0.3em] text-sky-300 backdrop-blur-sm transition-all duration-300 hover:border-sky-300/90 hover:bg-sky-400/20 hover:scale-105 cursor-pointer"
          >
            {nameText}
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer 
      className="w-full flex justify-center px-3 sm:px-4 py-4 sm:py-5 md:py-6"
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
      }}
    >
      <div className="w-full max-w-md mx-auto rounded-2xl sm:rounded-3xl border px-4 py-3.5 sm:px-5 sm:py-3.5 md:px-6 md:py-4 text-center backdrop-blur-sm sm:backdrop-blur-md md:backdrop-blur-2xl shadow-[0_12px_32px_rgba(0,0,0,0.2)] sm:shadow-[0_15px_40px_rgba(0,0,0,0.25)] md:shadow-[0_18px_44px_rgba(0,0,0,0.3)]"
        style={{ 
          borderColor: textColor === "#ffffff" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
          backgroundColor: textColor === "#ffffff" ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.9)"
        }}
      >
        <p 
          className="text-[11px] sm:text-xs md:text-sm font-semibold tracking-wide leading-tight"
          style={{ color: textSecondaryColor }}
        >
          {sponsorText}
        </p>
        <div className="mt-2 sm:mt-2.5 md:mt-3 flex justify-center">
          <button
            type="button"
            className="group btn-spotlight relative overflow-hidden rounded-full border border-yellow-400/30 backdrop-blur-sm sm:backdrop-blur-md md:backdrop-blur-2xl px-5 py-2 sm:px-6 sm:py-2.5 md:px-7 md:py-2.5 text-xs sm:text-sm font-medium text-sky-600 shadow-md sm:shadow-lg transition-all duration-200 sm:duration-300 active:scale-[0.97] sm:hover:shadow-xl"
            onClick={handleSarfrazWhatsApp}
            aria-label="Message Suhaib on WhatsApp"
            style={{
              background: `linear-gradient(to bottom right, var(--theme-button-from), var(--theme-button-via), var(--theme-button-to))`,
              transform: "translateZ(0)",
              backfaceVisibility: "hidden"
            }}
            onMouseEnter={(e) => {
              if (typeof window !== 'undefined' && window.innerWidth >= 640) {
                e.currentTarget.style.background = `linear-gradient(to bottom right, var(--theme-button-hover-from), var(--theme-button-hover-via), var(--theme-button-hover-to))`;
              }
            }}
            onMouseLeave={(e) => {
              if (typeof window !== 'undefined' && window.innerWidth >= 640) {
                e.currentTarget.style.background = `linear-gradient(to bottom right, var(--theme-button-from), var(--theme-button-via), var(--theme-button-to))`;
              }
            }}
          >
            <div className="absolute inset-0 overflow-hidden hidden sm:block">
              <div
                className="absolute inset-0 w-1/3 animate-spotlight"
                style={{
                  background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                  filter: "blur(6px)",
                  transform: "translateZ(0)",
                  backfaceVisibility: "hidden"
                }}
              />
            </div>
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 sm:duration-700 ease-in-out sm:group-hover:translate-x-full hidden sm:block" />
            <span className="relative z-10 font-semibold tracking-wide">{footerText?.trim() || DEFAULT_FOOTER_NAME}</span>
          </button>
        </div>
      </div>
    </footer>
  );
});
