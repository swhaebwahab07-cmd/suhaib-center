export interface TemplateOption {
  id: string;
  name: string;
  description: string;
  /** Tailwind classes for preview gradient backgrounds. */
  previewGradient: string;
  /** Soft accent color for outlines or glows. */
  accentHex: string;
}

export const TEMPLATE_DEFAULT_ID = "smartbio";

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: "colorful-pills",
    name: "Colorful Pills",
    description: "Vibrant pill-shaped buttons with colorful gradients and smooth animations.",
    previewGradient: "from-blue-400 via-purple-500 to-pink-500",
    accentHex: "#8b5cf6",
  },
  {
    id: "mobile-spotlight",
    name: "Mobile Spotlight",
    description: "Classic stacked layout with direct buttons and no extra chrome.",
    previewGradient: "from-slate-950 via-slate-900 to-indigo-800",
    accentHex: "#818cf8",
  },
  {
    id: "minimal-stripes",
    name: "Minimal Stripes",
    description: "Ultra-clean frosted stripes with elevated cards and crisp typography.",
    previewGradient: "from-slate-800 via-slate-700 to-slate-900",
    accentHex: "#e5e7eb",
  },
  {
    id: "paper-cut",
    name: "Paper Cut",
    description: "Handcrafted paper art style with playful rotations and decorative elements.",
    previewGradient: "from-amber-50 via-orange-50 to-rose-50",
    accentHex: "#f59e0b",
  },
  {
    id: "soft-neumorphic",
    name: "Soft Neumorphic",
    description: "Soft shadows and subtle depth with elegant neumorphic design elements.",
    previewGradient: "from-gray-100 via-gray-150 to-gray-200",
    accentHex: "#9ca3af",
  },
  {
    id: "neon-cyberpunk",
    name: "Neon Cyberpunk",
    description: "Dark cyberpunk aesthetic with neon glows, grid patterns, and futuristic vibes.",
    previewGradient: "from-black via-cyan-900 to-purple-900",
    accentHex: "#06b6d4",
  },
  {
    id: "organic-nature",
    name: "Organic Nature",
    description: "Natural wellness aesthetic with organic shapes and earthy green tones.",
    previewGradient: "from-green-50 via-emerald-50 to-teal-50",
    accentHex: "#10b981",
  },
  {
    id: "pixel",
    name: "Pixel Art",
    description: "Retro 8-bit pixel art style with pixelated borders and classic game aesthetics.",
    previewGradient: "from-purple-900 via-pink-800 to-orange-600",
    accentHex: "#f97316",
  },
  {
    id: "terminal",
    name: "Terminal",
    description: "Developer-focused terminal/command-line aesthetic with green-on-black and monospace fonts.",
    previewGradient: "from-black via-gray-900 to-green-900",
    accentHex: "#00ff00",
  },
  {
    id: "smartbio",
    name: "Smartbio",
    description: "Modern mobile design with gradient header, overlapping profile, and clean black buttons.",
    previewGradient: "from-indigo-900 via-purple-600 to-pink-500",
    accentHex: "#7c3aed",
  },
];

type TemplateOptionsTuple = typeof TEMPLATE_OPTIONS;
export type TemplateKey = TemplateOptionsTuple[number]["id"];

export function isTemplateKey(value: string): value is TemplateKey {
  return TEMPLATE_OPTIONS.some((option) => option.id === value);
}

export function normalizeTemplateConfig(
  templateKey?: string | null,
  templateConfig?: Record<string, unknown> | null
): Record<string, unknown> {
  const config = {
    ...(templateConfig ?? {}),
  } as Record<string, unknown>;

  const existingKey = typeof config.templateKey === "string" ? config.templateKey : undefined;

  const resolvedKey = (() => {
    if (templateKey && isTemplateKey(templateKey)) {
      return templateKey;
    }
    if (existingKey && isTemplateKey(existingKey)) {
      return existingKey;
    }
    return TEMPLATE_DEFAULT_ID;
  })();

  config.templateKey = resolvedKey;

  if (typeof config.type !== "string") {
    config.type = "simple";
  }

  if (typeof config.buttonStyle !== "string") {
    config.buttonStyle = "pill";
  }

  if (typeof config.buttonGradient !== "boolean") {
    config.buttonGradient = true;
  }

  return config;
}
