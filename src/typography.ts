/**
 * ERGONOMIC TYPOGRAPHY SYSTEM FOR VIDEO MOTION GRAPHICS
 * 
 * Based on Vision Science, Visual Angle (θ) Trigonometry, and Ocular Ergonomics:
 * 
 * 1. FORMULA:
 *    θ = 2 * arctan( S / (2 * D) )  <==>  S = 2 * D * tan( θ / 2 )
 *    Pixel Size P = S * ρ = 2 * D * tan( θ / 2 ) * ρ
 * 
 *    Where:
 *      D  = Average viewing distance in mm (Mobile Shorts: 350mm, Desktop: 600mm)
 *      ρ  = Screen pixel density factor (Mobile 1080x1920: ~13.5 px/mm; Landscape 1920x1080: ~6.2 px/mm)
 *      θ  = Human Visual Angle in degrees:
 *           - Acuity Limit (Snellen 20/20): ~0.0167° (1 arcmin)
 *           - Critical Print Size (CPS) Floor: ~0.25° (Below this causes squinting & eye fatigue)
 *           - Fluent Reading Zone: 0.35° - 0.9° (Effortless ocular tracking)
 *           - Saccadic Disruption Ceiling: > 1.8° - 2.0° (Causes eye jump strain, visual pain, disorientation)
 * 
 * 2. ERGONOMIC BOUNDS (1080x1920 Vertical Mobile Shorts):
 *    - HARD FLOOR: 22px (NEVER allow readable text below 22px; 20px strictly for minor badge borders)
 *    - BODY / EXPLAINER: 26px - 32px (Optimal: 28px)
 *    - CARD TITLES / SUBHEADS: 32px - 42px (Optimal: 36px)
 *    - SCENE MAIN TITLES: 48px - 60px (Hard Ceiling: 64px)
 *    - ACTIVE CAPTIONS: 48px - 54px (Optimal: 50px)
 *    - HERO METRICS (Single number e.g. "40%"): 72px - 104px (ABSOLUTE CEILING: 108px)
 */

export interface TypographyRoleSpec {
  min: number;
  max: number;
  optimal: number;
  lineHeight: number;
  tracking?: string;
  weight: number;
}

export type TypographyRole =
  | "heroMetric"
  | "title"
  | "subtitle"
  | "cardTitle"
  | "body"
  | "caption"
  | "tag"
  | "monoBadge";

export const VERTICAL_TYPOGRAPHY: Record<TypographyRole, TypographyRoleSpec> = {
  // Single massive numbers (e.g. 40%, 99%, ₹100). Hard limit 108px to prevent retinal glare
  heroMetric: { min: 72, max: 108, optimal: 92, lineHeight: 1.05, weight: 900 },
  // Scene main headlines (1-2 lines max). Hard limit 60px to prevent safe-area collisions
  title: { min: 46, max: 60, optimal: 54, lineHeight: 1.15, tracking: "-0.02em", weight: 900 },
  // Section headers or prominent subtitle callouts
  subtitle: { min: 32, max: 42, optimal: 38, lineHeight: 1.25, tracking: "-0.01em", weight: 800 },
  // Inside cards, containers, grid boxes
  cardTitle: { min: 26, max: 36, optimal: 30, lineHeight: 1.3, weight: 800 },
  // Paragraphs, explanation steps, bullet text (never below 24px)
  body: { min: 26, max: 32, optimal: 28, lineHeight: 1.4, weight: 500 },
  // Word-by-word active spoken Hindi captions
  caption: { min: 46, max: 54, optimal: 50, lineHeight: 1.2, weight: 900 },
  // Step identifiers (e.g. "01 / SYSTEM ARCHITECTURE")
  tag: { min: 22, max: 28, optimal: 24, lineHeight: 1.2, tracking: "0.12em", weight: 800 },
  // Monospace code, protocol chips, technical telemetry
  monoBadge: { min: 22, max: 26, optimal: 24, lineHeight: 1.2, tracking: "0.05em", weight: 700 },
};

export const LANDSCAPE_TYPOGRAPHY: Record<TypographyRole, TypographyRoleSpec> = {
  heroMetric: { min: 54, max: 84, optimal: 72, lineHeight: 1.05, weight: 900 },
  title: { min: 36, max: 48, optimal: 44, lineHeight: 1.2, tracking: "-0.02em", weight: 900 },
  subtitle: { min: 26, max: 34, optimal: 30, lineHeight: 1.25, tracking: "-0.01em", weight: 800 },
  cardTitle: { min: 22, max: 28, optimal: 24, lineHeight: 1.3, weight: 800 },
  body: { min: 20, max: 26, optimal: 22, lineHeight: 1.4, weight: 500 },
  caption: { min: 36, max: 44, optimal: 40, lineHeight: 1.2, weight: 900 },
  tag: { min: 18, max: 24, optimal: 20, lineHeight: 1.2, tracking: "0.12em", weight: 800 },
  monoBadge: { min: 16, max: 22, optimal: 18, lineHeight: 1.2, tracking: "0.05em", weight: 700 },
};

/**
 * Calculates theoretical pixel height for an intended visual angle.
 * @param visualAngleDeg Desired visual angle in degrees (e.g. 0.35° for body, 1.2° for hero)
 * @param landscape Boolean whether canvas is 16:9 landscape or 9:16 vertical
 * @param viewingDistanceMm Eye distance from display (default 350mm mobile, 600mm desktop)
 */
export function calculateErgonomicPixels(
  visualAngleDeg: number,
  landscape: boolean = false,
  viewingDistanceMm?: number
): number {
  const d = viewingDistanceMm ?? (landscape ? 600 : 350);
  const rho = landscape ? 6.2 : 13.5; // pixels per mm
  const halfAngleRad = (visualAngleDeg * Math.PI) / 360;
  const physicalHeightMm = 2 * d * Math.tan(halfAngleRad);
  return Math.round(physicalHeightMm * rho);
}

/**
 * Clamps any dynamic or calculated font size into the safe ergonomic bounds.
 * Guarantees text NEVER causes squinting (too small) or eye pain/saccadic strain (too large).
 */
export function clampFontSize(
  requestedSize: number,
  role: TypographyRole,
  landscape: boolean = false
): number {
  const spec = landscape ? LANDSCAPE_TYPOGRAPHY[role] : VERTICAL_TYPOGRAPHY[role];
  if (requestedSize < spec.min) return spec.min;
  if (requestedSize > spec.max) return spec.max;
  return requestedSize;
}

/**
 * Returns the recommended safe font size for a role and orientation.
 */
export function getFontSize(role: TypographyRole, landscape: boolean = false): number {
  const spec = landscape ? LANDSCAPE_TYPOGRAPHY[role] : VERTICAL_TYPOGRAPHY[role];
  return spec.optimal;
}

/**
 * Returns complete CSS style attributes for an ergonomically verified typography role.
 */
export function getTypographyStyle(
  role: TypographyRole,
  landscape: boolean = false,
  customOverrides?: { color?: string; weight?: number; align?: "left" | "center" | "right" }
) {
  const spec = landscape ? LANDSCAPE_TYPOGRAPHY[role] : VERTICAL_TYPOGRAPHY[role];
  return {
    fontSize: spec.optimal,
    lineHeight: spec.lineHeight,
    fontWeight: customOverrides?.weight ?? spec.weight,
    ...(spec.tracking ? { letterSpacing: spec.tracking } : {}),
    ...(customOverrides?.color ? { color: customOverrides.color } : {}),
    ...(customOverrides?.align ? { textAlign: customOverrides.align } : {}),
  };
}
