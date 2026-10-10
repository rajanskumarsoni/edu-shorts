import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";

export const Hook: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();

  // Entrance spring
  const intro = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });
  const pulse = (Math.sin(frame / 6) + 1) / 2;
  const rot = frame * 1.5;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
      }}
    >
      {/* Background Animated Concentric Radar Rings & Crosshairs */}
      <div
        style={{
          position: "absolute",
          width: 720,
          height: 720,
          borderRadius: "50%",
          pointerEvents: "none",
          opacity: 0.35 * intro,
          transform: `scale(${0.9 + 0.1 * intro})`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <svg width="720" height="720" viewBox="0 0 720 720" style={{ position: "absolute" }}>
          {/* Outer dashed radar ring */}
          <circle
            cx="360"
            cy="360"
            r="320"
            fill="none"
            stroke={accent}
            strokeWidth="2"
            strokeDasharray="8 12"
            transform={`rotate(${rot} 360 360)`}
            opacity="0.6"
          />
          {/* Middle pulse ring */}
          <circle
            cx="360"
            cy="360"
            r={240 + pulse * 25}
            fill="none"
            stroke={accent}
            strokeWidth="3"
            opacity={0.4 + 0.3 * (1 - pulse)}
          />
          {/* Inner target circle */}
          <circle
            cx="360"
            cy="360"
            r="160"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="2"
          />
          {/* Technical target crosshairs */}
          <line x1="360" y1="20" x2="360" y2="120" stroke={accent} strokeWidth="2.5" />
          <line x1="360" y1="600" x2="360" y2="700" stroke={accent} strokeWidth="2.5" />
          <line x1="20" y1="360" x2="120" y2="360" stroke={accent} strokeWidth="2.5" />
          <line x1="600" y1="360" x2="700" y2="360" stroke={accent} strokeWidth="2.5" />
        </svg>
      </div>

      {/* Top Tracked Sub-Tag with Pulsing Radar Beacon */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 24px",
          borderRadius: 999,
          background: "rgba(255, 255, 255, 0.06)",
          border: `1px solid ${accent}66`,
          boxShadow: `0 0 30px ${accent}22`,
          marginBottom: 36,
          opacity: intro,
          transform: `translateY(${(1 - intro) * 20}px)`,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 16px ${accent}`,
            transform: `scale(${0.8 + 0.4 * pulse})`,
          }}
        />
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "0.22em",
            color: accent,
            textTransform: "uppercase",
          }}
        >
          {"01 // SYSTEM SIGNAL"}
        </span>
      </div>

      {/* Main Hook Headline */}
      <RevealText
        text={scene.text ?? ""}
        stagger={4}
        style={{
          fontSize: 120,
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          textAlign: "center",
          textShadow: "0 10px 50px rgba(0,0,0,0.7)",
        }}
      />

      {/* Dynamic Animated Frequency / Waveform Visualizer on the Beat */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 48,
          opacity: intro,
        }}
      >
        {Array.from({ length: 19 }).map((_, i) => {
          const h = interpolate(
            Math.sin(frame * 0.25 + i * 0.45),
            [-1, 1],
            [12, 54]
          );
          const isCenter = Math.abs(i - 9) <= 2;
          return (
            <div
              key={i}
              style={{
                width: 6,
                height: h,
                borderRadius: 4,
                background: isCenter ? "#FFFFFF" : accent,
                boxShadow: isCenter ? `0 0 18px #FFFFFF` : `0 0 14px ${accent}aa`,
                transition: "height 0.05s ease",
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
