import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BG, hexAlpha } from "./theme";

// Slowly drifting colored glows + floating soft "bokeh" lights (parallax by size).
export const Background: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const unit = Math.min(width, height) / 1080;
  const x1 = 30 + Math.sin(frame / 90) * 15;
  const y1 = 25 + Math.cos(frame / 110) * 10;
  const x2 = 75 + Math.cos(frame / 120) * 12;
  const y2 = 75 + Math.sin(frame / 100) * 10;
  const N = 12;
  return (
    <>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${x1}% ${y1}%, ${accent}33, transparent 45%),
                       radial-gradient(circle at ${x2}% ${y2}%, #4C6FFF33, transparent 50%),
                       ${BG}`,
        }}
      />
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {Array.from({ length: N }).map((_, i) => {
          const r = (k: string) => random(`bokeh-${i}-${k}`);
          const size = (90 + r("s") * 260) * unit;
          const span = height + size;
          const speed = (0.12 + r("v") * 0.3) * (size / 160); // bigger = nearer = faster
          const yBase = r("y") * span;
          const y = ((((yBase - frame * speed) % span) + span) % span) - size;
          const x = r("x") * width + Math.sin(frame / 80 + i) * 30 * unit;
          const col = i % 3 === 0 ? accent : "#7FA4FF";
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x - size / 2,
                top: y,
                width: size,
                height: size,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${col}${hexAlpha(
                  0.07 + r("a") * 0.08
                )}, transparent 70%)`,
              }}
            />
          );
        })}
      </AbsoluteFill>
    </>
  );
};

// Soft light streak that crosses the frame when a scene starts (transition accent).
export const LightSweep: React.FC = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 40], [-0.3, 1.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const op = interpolate(frame, [0, 8, 30, 40], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        opacity: op * 0.55,
        pointerEvents: "none",
        background: `linear-gradient(115deg, transparent ${t * 100 - 20}%, rgba(255,255,255,0.10) ${
          t * 100
        }%, transparent ${t * 100 + 20}%)`,
      }}
    />
  );
};

// Final look: teal/orange color grade, vignette, film grain.
export const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "linear-gradient(160deg, rgba(0,170,180,0.10) 0%, transparent 45%, rgba(255,140,60,0.09) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, transparent 62%, rgba(0,0,0,0.42) 100%)",
        }}
      />
      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.07,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      >
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves={2}
            seed={frame % 8}
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </>
  );
};
