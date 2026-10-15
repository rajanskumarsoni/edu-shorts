import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * Deterministic pseudo-random based on seed index.
 * Produces the identical value every frame for the same seed — essential for Remotion frame reproducibility.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export type ParticleType = "sparkles" | "fireflies" | "mist" | "light-rays";

export interface ParticleOverlayProps {
  type?: ParticleType;
  count?: number;
  color?: string;
  intensity?: number;
}

export const ParticleOverlay: React.FC<ParticleOverlayProps> = ({
  type = "sparkles",
  count = 24,
  color = "#00F0FF",
  intensity = 0.6,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const globalFadeIn = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const globalFadeOut = interpolate(
    frame,
    [durationInFrames - fps * 0.4, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const masterAlpha = globalFadeIn * globalFadeOut * intensity;

  if (type === "fireflies") {
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {Array.from({ length: count }, (_, i) => {
          const baseX = seededRandom(i * 7 + 1) * 90 + 5;
          const baseY = seededRandom(i * 13 + 2) * 80 + 10;
          const speed = 0.4 + seededRandom(i * 3 + 5) * 1.0;
          const phase = seededRandom(i * 11 + 3) * Math.PI * 2;
          const size = 3 + seededRandom(i * 5 + 4) * 5;

          const timeSec = frame / fps;
          const curX = baseX + Math.sin(timeSec * speed + phase) * 4;
          const curY = baseY + Math.cos(timeSec * speed * 0.7 + phase) * 6;

          const pulse = 0.4 + 0.6 * Math.sin(timeSec * 3 + phase);
          const alpha = masterAlpha * pulse;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${curX}%`,
                top: `${curY}%`,
                width: size,
                height: size,
                borderRadius: "50%",
                background: color,
                opacity: alpha,
                boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color}80`,
              }}
            />
          );
        })}
      </AbsoluteFill>
    );
  }

  if (type === "sparkles") {
    return (
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {Array.from({ length: count }, (_, i) => {
          const x = seededRandom(i * 9 + 1) * 90 + 5;
          const y = seededRandom(i * 17 + 3) * 85 + 5;
          const scale = 0.5 + seededRandom(i * 4 + 7) * 0.9;
          const cycleSec = 1.2 + seededRandom(i * 2 + 1) * 1.5;
          const phase = seededRandom(i * 6 + 2) * cycleSec;
          const cycleProgress = ((frame / fps + phase) % cycleSec) / cycleSec;

          // Fade-in then fade-out pulse
          const pulse = Math.sin(cycleProgress * Math.PI);
          const rot = cycleProgress * 90;
          const alpha = masterAlpha * pulse;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: 14 * scale,
                height: 14 * scale,
                transform: `rotate(${rot}deg)`,
                opacity: alpha,
                filter: `drop-shadow(0 0 6px ${color})`,
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill={color}>
                <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
              </svg>
            </div>
          );
        })}
      </AbsoluteFill>
    );
  }

  // Fallback subtle mist
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: `radial-gradient(circle at 50% 50%, ${color}15 0%, transparent 70%)`,
        opacity: masterAlpha * 0.7,
      }}
    />
  );
};
