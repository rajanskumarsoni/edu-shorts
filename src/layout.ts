import { useVideoConfig, interpolate, spring, useCurrentFrame } from "remotion";

// Adapts padding to vertical (reel) or landscape (16:9) videos.
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const landscape = width > height;
  return {
    width,
    height,
    landscape,
    padX: landscape ? 160 : 80,
    padTop: landscape ? 60 : 120,
    // vertical: keep content above the Shorts/Reels buttons and title area
    padBottom: landscape ? 80 : 320,
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
