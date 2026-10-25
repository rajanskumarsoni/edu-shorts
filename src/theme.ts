import { createContext } from "react";

export const ArtDirectionContext = createContext<"editorial" | "cinematic">("editorial");

export interface ThemePalette {
  name: string;
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  secondary: string;
  cardBg: string;
  cardBorder: string;
  gold: string;
  cyan: string;
  mint: string;
  red: string;
  font: string;
  mono: string;
}

export const BG = "#0B1020";
export const FG = "#F5F7FF";
export const MUTED = "#9AA3C7";
// Install the free "Inter" font on your computer for the best look; others are fallbacks.
export const FONT =
  "Inter, 'SF Pro Display', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif";
export const MONO =
  "'JetBrains Mono', 'SF Mono', Menlo, Monaco, Consolas, 'Courier New', monospace";
export const CARD_BG = "rgba(255,255,255,0.06)";
export const CARD_BORDER = "rgba(255,255,255,0.14)";

export const COLORS = {
  bg: "#0B1020",
  fg: "#F5F7FF",
  muted: "#9AA3C7",
  cardBg: "rgba(255,255,255,0.06)",
  cardBorder: "rgba(255,255,255,0.14)",
  gold: "#FFC857",
  cyan: "#00F0FF",
  mint: "#58D6C2",
  red: "#FF5555",
  danger: "#EF4444",
  warning: "#F59E0B",
  success: "#10B981",
  accent: "#00F0FF",
};

/** Curated Design Token Theme Palettes (adapted from OpenMontage playbooks) */
export const THEMES: Record<string, ThemePalette> = {
  cyberpunk: {
    name: "cyberpunk",
    bg: "#0B1020",
    fg: "#F5F7FF",
    muted: "#9AA3C7",
    accent: "#00F0FF",
    secondary: "#7928CA",
    cardBg: "rgba(255,255,255,0.06)",
    cardBorder: "rgba(255,255,255,0.14)",
    gold: "#FFC857",
    cyan: "#00F0FF",
    mint: "#58D6C2",
    red: "#FF5555",
    font: FONT,
    mono: MONO,
  },
  slate: {
    name: "slate",
    bg: "#0F172A",
    fg: "#F8FAFC",
    muted: "#94A3B8",
    accent: "#38BDF8",
    secondary: "#818CF8",
    cardBg: "rgba(30, 41, 59, 0.7)",
    cardBorder: "rgba(148, 163, 184, 0.2)",
    gold: "#FBBF24",
    cyan: "#38BDF8",
    mint: "#34D399",
    red: "#F87171",
    font: FONT,
    mono: MONO,
  },
  amber: {
    name: "amber",
    bg: "#181411",
    fg: "#FDF8F3",
    muted: "#A89F91",
    accent: "#F59E0B",
    secondary: "#D97706",
    cardBg: "rgba(255, 255, 255, 0.05)",
    cardBorder: "rgba(245, 158, 11, 0.2)",
    gold: "#F59E0B",
    cyan: "#06B6D4",
    mint: "#10B981",
    red: "#EF4444",
    font: FONT,
    mono: MONO,
  },
  emerald: {
    name: "emerald",
    bg: "#061A14",
    fg: "#ECFDF5",
    muted: "#6EE7B7",
    accent: "#10B981",
    secondary: "#059669",
    cardBg: "rgba(16, 185, 129, 0.08)",
    cardBorder: "rgba(52, 211, 153, 0.25)",
    gold: "#FBBF24",
    cyan: "#2DD4BF",
    mint: "#10B981",
    red: "#F87171",
    font: FONT,
    mono: MONO,
  },
  whiteboard: {
    name: "whiteboard",
    bg: "#F8FAFC",
    fg: "#0F172A",
    muted: "#64748B",
    accent: "#2563EB",
    secondary: "#4F46E5",
    cardBg: "rgba(255, 255, 255, 0.85)",
    cardBorder: "rgba(15, 23, 42, 0.12)",
    gold: "#D97706",
    cyan: "#0284C7",
    mint: "#059669",
    red: "#DC2626",
    font: FONT,
    mono: MONO,
  },
};

export const ThemeContext = createContext<ThemePalette>(THEMES.cyberpunk);

/**
 * Resolves active ThemePalette given an optional theme name and optional accent color override.
 */
export const getTheme = (themeName?: string, accentOverride?: string): ThemePalette => {
  const base = (themeName && THEMES[themeName.toLowerCase()]) || THEMES.cyberpunk;
  if (accentOverride) {
    return { ...base, accent: accentOverride };
  }
  return base;
};

export const hexAlpha = (a: number): string =>
  Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0");


// -----------------------------------------------------------------------------
// Mobile Shorts & Reels Ergonomic Typography Standards (1080x1920 & 1920x1080)
// Scientifically calibrated via Human Visual Angle formula:
//   θ = 2 * arctan( S / (2 * D) )
// Hard rules:
//   1. NEVER drop below MIN (22px vertical / 16px landscape) - prevents squinting & ciliary eye strain.
//   2. NEVER exceed MAX (108px vertical / 84px landscape) - prevents retinal glare, visual pain & saccadic disruption.
// -----------------------------------------------------------------------------
export const TYPOGRAPHY = {
  vertical: {
    min: 22,          // Absolute hard floor: no text anywhere on screen below 22px
    max: 108,         // Absolute hard ceiling: prevents eye pain, retinal glare & layout blowouts
    tag: 24,          // Badges, category pills, uppercase tracking tags (22-26px)
    label: 26,        // Field labels, metric keys, helper text (24-28px)
    body: 28,         // Standard descriptions, bullet points, explanations (26-32px)
    cardTitle: 32,    // Card headers, container titles (30-36px)
    subheader: 38,    // Prominent section titles, callouts (36-42px)
    equation: 44,     // Mathematical formulas & equations (40-48px)
    caption: 50,      // Kinetic subtitles for high mobile legibility (48-54px)
    title: 54,        // Primary scene headers (max 60px to prevent safe-area collision)
    hero: 76,         // Prominent callouts and highlighted terms (70-80px)
    stat: 92,         // Hero single numbers (e.g. 40%, 99%). Hard ceiling 108px!
  },
  landscape: {
    min: 16,
    max: 84,
    tag: 18,
    label: 20,
    body: 22,
    cardTitle: 26,
    subheader: 30,
    equation: 36,
    caption: 40,
    title: 44,
    hero: 60,
    stat: 72,
  },
};

export {
  calculateErgonomicPixels,
  clampFontSize,
  getFontSize,
  getTypographyStyle,
  VERTICAL_TYPOGRAPHY,
  LANDSCAPE_TYPOGRAPHY,
} from "./typography";

/**
 * Returns typography tokens for the active orientation.
 */
export const getTypography = (landscape: boolean = false) =>
  landscape ? TYPOGRAPHY.landscape : TYPOGRAPHY.vertical;

/**
 * Hard safety enforcement: clamps font size within ergonomic bounds.
 * Prevents squinting (too small) and eye pain / retinal glare (too large).
 */
export const safeFontSize = (size: number, landscape: boolean = false): number => {
  const { min, max } = landscape ? TYPOGRAPHY.landscape : TYPOGRAPHY.vertical;
  return Math.max(min, Math.min(max, size));
};

/**
 * Resolves a high-contrast uppercase tracked header tag from scene specifications.
 * Prioritizes:
 * 1. Explicit scene.tag
 * 2. Storyboard visual.motion_graphics (e.g. "Tracked uppercase header 01 / THE CONUNDRUM")
 * 3. Fallback default
 */
export const resolveSceneTag = (scene: any, fallback: string): string => {
  if (scene?.tag && typeof scene.tag === "string" && scene.tag.trim()) {
    return scene.tag.trim().toUpperCase();
  }
  const mg = scene?.visual?.motion_graphics;
  if (Array.isArray(mg)) {
    for (const item of mg) {
      if (typeof item === "string" && /header|tag|[0-9]{2}\s*[\/\-:]/i.test(item)) {
        const cleaned = item
          .replace(/^Tracked\s+(?:uppercase\s+)?(?:header|tag)\s*[:/-]?\s*/i, "")
          .trim();
        if (cleaned.length >= 2 && cleaned.length <= 50) {
          return cleaned.toUpperCase();
        }
      }
    }
  } else if (typeof mg === "string" && /header|tag|[0-9]{2}\s*[\/\-:]/i.test(mg)) {
    const cleaned = mg
      .replace(/^Tracked\s+(?:uppercase\s+)?(?:header|tag)\s*[:/-]?\s*/i, "")
      .trim();
    if (cleaned.length >= 2 && cleaned.length <= 50) {
      return cleaned.toUpperCase();
    }
  }
  return fallback;
};
