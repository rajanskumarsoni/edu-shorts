import { useVideoConfig, interpolate, spring, useCurrentFrame } from "remotion";

// Adapts padding to vertical (reel) or landscape (16:9) videos.
// Calibrated for Instagram Reels & YouTube Shorts UI safe zones:
// - Top: clears camera/search/tabs (160px)
// - Bottom: clears username, caption snippet, audio marquee (380px)
// - Right: clears like/comment/share action rail (120px)
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const landscape = width > height;
  return {
    width,
    height,
    landscape,
    padX: landscape ? 160 : 80,
    padTop: landscape ? 60 : 160,
    padBottom: landscape ? 80 : 380,
    padRight: landscape ? 160 : 120,
    safeTop: landscape ? 60 : 160,
    safeBottom: landscape ? 80 : 380,
    safeRight: landscape ? 160 : 120,
    safeLeft: landscape ? 160 : 80,
  };
};

// Beat-driven spring micro-animations for 120 BPM visual momentum.
// Fires a subtle scale pulse on every beat to keep visual energy high during voice pauses.
export const useBeatPulse = (options: {
  beatFrame?: number;
  bpm?: number;
  strength?: number;
  damping?: number;
} = {}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const {
    beatFrame = 0,
    bpm = 120,
    strength = 0.04,
    damping = 10,
  } = options;

  const beatDuration = (60 / bpm) * fps;
  const phase = (frame - beatFrame) % beatDuration;
  const progress = phase / beatDuration;

  return interpolate(
    spring({
      frame: phase,
      fps,
      config: { damping, stiffness: 200 },
    }),
    [0, 1],
    [1, 1 + strength]
  );
};

// SFX-triggered pulse: fires a stronger spring bounce on impact/pop/ding frames.
export const useSfxPulse = (sfxFrame: number, options: {
  bpm?: number;
  strength?: number;
  damping?: number;
} = {}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { bpm = 120, strength = 0.06, damping = 8 } = options;

  if (frame < sfxFrame) return 1;
  const phase = frame - sfxFrame;
  const beatDuration = (60 / bpm) * fps;

  return interpolate(
    spring({
      frame: phase,
      fps,
      config: { damping, stiffness: 180 },
    }),
    [0, 1],
    [1, 1 + strength]
  );
};

// Word-emphasis pulse: scales up slightly when a caption word becomes active.
export const useWordPulse = (isActive: boolean, options: {
  strength?: number;
  damping?: number;
} = {}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { strength = 0.08, damping = 12 } = options;

  if (!isActive) return 1;

  return interpolate(
    spring({
      frame,
      fps,
      config: { damping, stiffness: 300 },
    }),
    [0, 1],
    [1, 1 + strength]
  );
};

/**
 * Universal Mobile Font Size Clamping Formula.
 * Ensures typography on vertical 1080x1920 Shorts/Reels screens NEVER drops below
 * ergonomic human visual angle readability thresholds.
 *
 * Formula: fontSize = Math.max(minFloor, Math.round(requestedSize * scaleFactor))
 */
export const safeFont = (requestedSize: number, minFloor: number = 24): number => {
  return Math.max(minFloor, Math.round(requestedSize));
};

export const TYPOGRAPHY_FLOOR = {
  badge: 24,       // Absolute minimum floor for any badge, tag, or indicator
  caption: 26,     // Secondary sub-captions, formulas, coordinates
  body: 30,        // Explanations, cards, lists, descriptions
  subheading: 38,  // Card titles, feature headers, split names
  heading: 52,     // Scene titles, large warning alerts
  hero: 76,        // Massive stats, latencies, 0.2s, 30,000, O(1)
} as const;

