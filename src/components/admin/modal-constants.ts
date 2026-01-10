// Platform icons
import {
  SiWhatsapp,
  SiTelegram,
  SiViber,
  SiDiscord,
  SiTiktok,
  SiInstagram,
  SiFacebook,
  SiX,
  SiYoutube,
  SiLinkedin,
  SiSnapchat,
} from "react-icons/si";
import { FaPhoneAlt, FaEnvelope, FaGlobe } from "react-icons/fa";
import { DEFAULT_FOOTER_NAME, DEFAULT_FOOTER_PHONE as GLOBAL_DEFAULT_FOOTER_PHONE } from "@/lib/constants/footer";

// Platform definitions with react-icons and brand colors
export const SOCIAL_PLATFORMS = [
  { id: "whatsapp", name: "WhatsApp", icon: SiWhatsapp, color: "from-green-500/80 via-emerald-500/70 to-teal-500/80", brandColor: "green" },
  { id: "viber", name: "Viber", icon: SiViber, color: "from-purple-500/80 via-violet-500/70 to-fuchsia-500/80", brandColor: "purple" },
  { id: "telegram", name: "Telegram", icon: SiTelegram, color: "from-blue-500/80 via-cyan-500/70 to-sky-500/80", brandColor: "blue" },
  { id: "phone", name: "Phone Number", icon: FaPhoneAlt, color: "from-blue-500/80 via-indigo-500/70 to-blue-600/80", brandColor: "blue" },
  { id: "instagram", name: "Instagram", icon: SiInstagram, color: "from-purple-600/80 via-pink-500/70 to-orange-400/80", brandColor: "pink" },
  { id: "facebook", name: "Facebook", icon: SiFacebook, color: "from-blue-600/80 via-blue-700/70 to-blue-800/80", brandColor: "blue" },
  { id: "twitter", name: "Twitter / X", icon: SiX, color: "from-black/80 via-gray-900/70 to-gray-800/80", brandColor: "black" },
  { id: "tiktok", name: "TikTok", icon: SiTiktok, color: "from-black/80 via-gray-900/70 to-pink-500/80", brandColor: "black" },
  { id: "youtube", name: "YouTube", icon: SiYoutube, color: "from-red-600/80 via-red-500/70 to-red-600/80", brandColor: "red" },
  { id: "linkedin", name: "LinkedIn", icon: SiLinkedin, color: "from-blue-700/80 via-blue-800/70 to-blue-900/80", brandColor: "blue" },
  { id: "snapchat", name: "Snapchat", icon: SiSnapchat, color: "from-yellow-400/80 via-yellow-500/70 to-yellow-600/80", brandColor: "yellow" },
  { id: "discord", name: "Discord", icon: SiDiscord, color: "from-indigo-500/80 via-indigo-600/70 to-indigo-700/80", brandColor: "indigo" },
  { id: "email", name: "Email", icon: FaEnvelope, color: "from-gray-400/60 via-gray-500/50 to-gray-600/40", brandColor: "gray" },
  { id: "website", name: "Website", icon: FaGlobe, color: "from-emerald-400/60 via-teal-400/50 to-cyan-400/40", brandColor: "emerald" },
];

// Countries list
export const COUNTRIES = [
  { code: "964", name: "Iraq" },
  { code: "98", name: "Iran" },
  { code: "90", name: "Turkey" },
  { code: "966", name: "Saudi Arabia" },
  { code: "971", name: "United Arab Emirates" },
  { code: "1", name: "United States / Canada" },
  { code: "44", name: "United Kingdom" },
];

// Sort countries by code length descending for proper prefix matching
export const COUNTRIES_SORTED = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);

// Gradient hex color mapping for preview buttons (matches LinktreePage BACKGROUND_GRADIENTS)
export const GRADIENT_HEX_MAP: Record<string, { from: string; via: string; to: string }> = {
  "#6366f1": { from: "#0b1224", via: "#1c2d52", to: "#b7791f" },
  "#dc2626": { from: "#B0E0E6", via: "#87CEEB", to: "#6BB6D6" }, // default soft sky blue gradient
  "#1e40af": { from: "#1e3a8a", via: "#1e40af", to: "#1e3a8a" },
  "#7c3aed": { from: "#581c87", via: "#6b21a8", to: "#581c87" },
  "#166534": { from: "#14532d", via: "#166534", to: "#14532d" },
  "#991b1b": { from: "#0c4a6e", via: "#0284c7", to: "#0c4a6e" },
  "#c2410c": { from: "#9a3412", via: "#c2410c", to: "#9a3412" },
  "#9f1239": { from: "#831843", via: "#9f1239", to: "#831843" },
  "#164e63": { from: "#0e7490", via: "#155e75", to: "#0e7490" },
  "#312e81": { from: "#1e1b4b", via: "#312e81", to: "#1e1b4b" },
  "#134e4a": { from: "#0f766e", via: "#134e4a", to: "#0f766e" },
  "#854d0e": { from: "#713f12", via: "#854d0e", to: "#713f12" },
  "#064e3b": { from: "#022c22", via: "#064e3b", to: "#022c22" },
  "#4c1d95": { from: "#3b0764", via: "#4c1d95", to: "#3b0764" },
  "#701a75": { from: "#581c87", via: "#701a75", to: "#581c87" },
  "#ffffff": { from: "#ffffff", via: "#ffffff", to: "#ffffff" },
  "#000000": { from: "#000000", via: "#000000", to: "#000000" },
  "#f3f4f6": { from: "#f3f4f6", via: "#ffffff", to: "#f3f4f6" },
  "#e5e7eb": { from: "#e5e7eb", via: "#f3f4f6", to: "#e5e7eb" },
  "#d1d5db": { from: "#d1d5db", via: "#e5e7eb", to: "#d1d5db" },
  "#4b5563": { from: "#4b5563", via: "#6b7280", to: "#4b5563" },
  "#1f2937": { from: "#1f2937", via: "#374151", to: "#1f2937" },
  "#111827": { from: "#111827", via: "#1f2937", to: "#111827" },
  "#0284c7": { from: "#0284c7", via: "#0ea5e9", to: "#0284c7" },
  "#65a30d": { from: "#65a30d", via: "#84cc16", to: "#65a30d" },
  "#d97706": { from: "#d97706", via: "#f59e0b", to: "#d97706" },
  "#475569": { from: "#475569", via: "#64748b", to: "#475569" },
  "#52525b": { from: "#52525b", via: "#71717a", to: "#52525b" },
  "#57534e": { from: "#57534e", via: "#78716c", to: "#57534e" },
  "#525252": { from: "#525252", via: "#737373", to: "#525252" },
  "#0891b2": { from: "#0284c7", via: "#06b6d4", to: "#14b8a6" },
  "#f97316": { from: "#f97316", via: "#ec4899", to: "#f43f5e" },
  "#15803d": { from: "#15803d", via: "#10b981", to: "#0d9488" },
  "#a855f7": { from: "#a78bfa", via: "#8b5cf6", to: "#d946ef" },
  "#1e293b": { from: "#0f172a", via: "#312e81", to: "#581c87" },
  "#ff6f61": { from: "#2b1055", via: "#ff6f61", to: "#ffd166" },
  "#0ea5e9": { from: "#0b1224", via: "#0ea5e9", to: "#9333ea" },
  "#14b8a6": { from: "#0f172a", via: "#14b8a6", to: "#a3e635" },
  "#9333ea": { from: "#1e1b4b", via: "#9333ea", to: "#f472b6" },
  "#f472b6": { from: "#2f1553", via: "#f472b6", to: "#facc15" },
  "#38bdf8": { from: "#0f172a", via: "#38bdf8", to: "#7c3aed" },
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

// Background colors - Simplified list (removed duplicates and unnecessary variants)
export const BACKGROUND_COLORS = [
  { id: "default", name: "Default", gradient: "from-[#B0E0E6] via-[#87CEEB] to-[#6BB6D6]", value: "#87CEEB", isSolid: false },
  { id: "blue", name: "Blue", gradient: "from-blue-900 via-blue-800 to-blue-900", value: "#1e40af", isSolid: false },
  { id: "purple", name: "Purple", gradient: "from-purple-900 via-purple-800 to-purple-900", value: "#7c3aed", isSolid: false },
  { id: "green", name: "Green", gradient: "from-green-900 via-green-800 to-green-900", value: "#166534", isSolid: false },
  { id: "sky-blue", name: "Sky Blue", gradient: "from-sky-600 via-sky-500 to-sky-600", value: "#0284c7", isSolid: false },
  { id: "orange", name: "Orange", gradient: "from-orange-900 via-orange-800 to-orange-900", value: "#c2410c", isSolid: false },
  { id: "pink", name: "Pink", gradient: "from-pink-900 via-pink-800 to-pink-900", value: "#9f1239", isSolid: false },
  { id: "cyan", name: "Cyan", gradient: "from-cyan-900 via-cyan-800 to-cyan-900", value: "#164e63", isSolid: false },
  { id: "indigo", name: "Indigo", gradient: "from-indigo-900 via-indigo-800 to-indigo-900", value: "#312e81", isSolid: false },
  { id: "teal", name: "Teal", gradient: "from-teal-900 via-teal-800 to-teal-900", value: "#134e4a", isSolid: false },
  { id: "yellow", name: "Yellow", gradient: "from-yellow-900 via-yellow-800 to-yellow-900", value: "#854d0e", isSolid: false },
  { id: "emerald", name: "Emerald", gradient: "from-emerald-900 via-emerald-800 to-emerald-900", value: "#064e3b", isSolid: false },
  { id: "violet", name: "Violet", gradient: "from-violet-900 via-violet-800 to-violet-900", value: "#4c1d95", isSolid: false },
  { id: "fuchsia", name: "Fuchsia", gradient: "from-fuchsia-900 via-fuchsia-800 to-fuchsia-900", value: "#701a75", isSolid: false },
  { id: "coral-sunset", name: "Coral Sunset", gradient: "from-[#2b1055] via-[#ff6f61] to-[#ffd166]", value: "#ff6f61", isSolid: false },
  { id: "aurora", name: "Aurora", gradient: "from-[#0b1224] via-[#0ea5e9] to-[#9333ea]", value: "#0ea5e9", isSolid: false },
  { id: "mint-glow", name: "Mint Glow", gradient: "from-[#0f172a] via-[#14b8a6] to-[#a3e635]", value: "#14b8a6", isSolid: false },
  { id: "royal-bloom", name: "Royal Bloom", gradient: "from-[#1e1b4b] via-[#9333ea] to-[#f472b6]", value: "#9333ea", isSolid: false },
  { id: "blush-gold", name: "Blush Gold", gradient: "from-[#2f1553] via-[#f472b6] to-[#facc15]", value: "#f472b6", isSolid: false },
  { id: "ice-drift", name: "Ice Drift", gradient: "from-[#0f172a] via-[#38bdf8] to-[#7c3aed]", value: "#38bdf8", isSolid: false },
  { id: "pure-white", name: "Pure White", gradient: "", value: "#ffffff", isSolid: true },
  { id: "pure-black", name: "Pure Black", gradient: "", value: "#000000", isSolid: true },
  { id: "black-midnight", name: "Black Midnight", gradient: "from-black via-slate-900 to-indigo-950", value: "#0f0f0f", isSolid: false },
  { id: "white", name: "White", gradient: "from-gray-100 via-white to-gray-100", value: "#f3f4f6", isSolid: false },
  { id: "light-gray", name: "Light Gray", gradient: "from-gray-200 via-gray-100 to-gray-200", value: "#e5e7eb", isSolid: false },
  { id: "gray", name: "Gray", gradient: "from-gray-600 via-gray-500 to-gray-600", value: "#4b5563", isSolid: false },
  { id: "dark-gray", name: "Dark Gray", gradient: "from-gray-800 via-gray-700 to-gray-800", value: "#1f2937", isSolid: false },
  { id: "charcoal", name: "Charcoal", gradient: "from-gray-900 via-gray-800 to-gray-900", value: "#111827", isSolid: false },
  { id: "lime", name: "Lime", gradient: "from-lime-600 via-lime-500 to-lime-600", value: "#65a30d", isSolid: false },
  { id: "amber", name: "Amber", gradient: "from-amber-600 via-amber-500 to-amber-600", value: "#d97706", isSolid: false },
  { id: "ocean", name: "Ocean", gradient: "from-blue-600 via-cyan-500 to-teal-600", value: "#0891b2", isSolid: false },
  { id: "sunset", name: "Sunset", gradient: "from-orange-500 via-pink-500 to-rose-500", value: "#f97316", isSolid: false },
  { id: "forest", name: "Forest", gradient: "from-green-700 via-emerald-600 to-teal-700", value: "#15803d", isSolid: false },
  { id: "lavender", name: "Lavender", gradient: "from-purple-400 via-violet-400 to-fuchsia-400", value: "#a855f7", isSolid: false },
  { id: "midnight", name: "Midnight", gradient: "from-slate-900 via-indigo-900 to-purple-900", value: "#1e293b", isSolid: false },
];

// Default values
export const DEFAULT_SUBTITLE = "بۆ پەیوەندی کردن, کلیک لەم لینکانەی خوارەوە بکە";
export const DEFAULT_FOOTER_TEXT = DEFAULT_FOOTER_NAME; // Default footer name (clickable, opens WhatsApp)
export const DEFAULT_FOOTER_PHONE = GLOBAL_DEFAULT_FOOTER_PHONE;

// Helper function to get default expire date (10 days from now) - returns date-only format
export const getDefaultExpireDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 10);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

// Kurdish platform names mapping
export function getPlatformNameKurdish(platform: string): string {
  const names: Record<string, string> = {
    whatsapp: "واتساپ",
    telegram: "تیلیگڕام",
    viber: "ڤایبەر",
    phone: "ژمارەی مۆبایل",
    instagram: "ئینستاگرام",
    facebook: "فەیسبووک",
    twitter: "تویتەر / ئێکس",
    linkedin: "لینکدئین",
    snapchat: "سناپچات",
    tiktok: "تیکتۆک",
    youtube: "یوتیوب",
    discord: "دیسکۆرد",
    email: "ئیمەیڵ",
    website: "وێبسایت",
    custom: "لینک",
  };

  return names[platform] || platform;
}
