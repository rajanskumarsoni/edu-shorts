export const BG = "#0B1020";
export const FG = "#F5F7FF";
export const MUTED = "#9AA3C7";
// Install the free "Inter" font on your computer for the best look; others are fallbacks.
export const FONT =
  "Inter, 'SF Pro Display', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif";
export const CARD_BG = "rgba(255,255,255,0.06)";
export const CARD_BORDER = "rgba(255,255,255,0.14)";

export const hexAlpha = (a: number): string =>
  Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0");
