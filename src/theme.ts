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

export const hexAlpha = (a: number): string =>
  Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0");

// -----------------------------------------------------------------------------
// Mobile Shorts & Reels Typography Standards (1080x1920)
// Hard rule: No text on screen should drop below MIN_FONT_SIZE (28px).
// Human eyes viewing a 6-inch phone screen require bold, legible typography.
// -----------------------------------------------------------------------------
export const TYPOGRAPHY = {
  vertical: {
    min: 28,          // Absolute hard floor: no text anywhere on screen below 28px
    tag: 28,          // Badges, category pills, uppercase tracking tags
    label: 32,        // Field labels, metric keys, helper text
    body: 36,         // Standard descriptions, bullet points
    caption: 48,      // Kinetic subtitles for high mobile legibility
    subheader: 44,    // Card headers, secondary titles, formula variables
    equation: 48,     // Mathematical formulas & equations
    title: 60,        // Primary scene headers
    hero: 90,         // Prominent callouts and numbers
    stat: 180,        // Hero benchmark / big statistics
  },
  landscape: {
    min: 20,
    tag: 22,
    label: 24,
    body: 28,
    caption: 36,
    subheader: 36,
    equation: 40,
    title: 54,
    hero: 76,
    stat: 130,
  },
};

/**
 * Returns typography tokens for the active orientation.
 */
export const getTypography = (landscape: boolean = false) =>
  landscape ? TYPOGRAPHY.landscape : TYPOGRAPHY.vertical;

/**
 * Hard safety enforcement: ensures no font size drops below the mobile legibility floor.
 */
export const safeFontSize = (size: number, landscape: boolean = false): number => {
  const floor = landscape ? TYPOGRAPHY.landscape.min : TYPOGRAPHY.vertical.min;
  return Math.max(floor, size);
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

