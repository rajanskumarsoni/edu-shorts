import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec } from "../types";
import { MUTED, resolveSceneTag } from "../theme";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { MotionGraphic } from "../MotionGraphic";

// "2,500+" -> counts up from 0 to 2,500 and keeps the "+"; text without numbers is shown as is
const countUp = (value: string, p: number): string => {
  const m = value.match(/\d[\d,]*\.?\d*/);
  if (!m) return value;
  const raw = m[0];
  const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
  const target = parseFloat(raw.replace(/,/g, ""));
  let txt = (target * p).toFixed(decimals);
  if (raw.includes(",")) {
    const [i, d] = txt.split(".");
    txt = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (d ? "." + d : "");
  }
  return value.replace(raw, txt);
};

export const Stat: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const p = interpolate(frame, [4, 44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Circular gauge calculations
  const radius = 290;
  const circ = 2 * Math.PI * radius;
  const strokeOffset = circ * (1 - p);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
      }}
    >
      {/* Top Telemetry Header Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 22px",
          borderRadius: 999,
          background: "rgba(255, 255, 255, 0.05)",
          border: `1px solid ${accent}55`,
          marginBottom: 32,
          opacity: s,
          transform: `translateY(${(1 - s) * 20}px)`,
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "0.22em",
            color: accent,
            textTransform: "uppercase",
          }}
        >
          {resolveSceneTag(scene, "02 // PEAK METRIC MONITOR")}
        </span>
      </div>

      {/* Floating Semantic Metric Motion Graphic */}
      <MotionGraphic
        icon={scene.icon}
        text={scene.label}
        narration={scene.narration}
        accent={accent}
        size="md"
        showRadar={false}
        style={{ marginBottom: 20 }}
      />

      {/* Center Animated Metric Graphic with Circular HUD Gauge */}
      <div
        style={{
          position: "relative",
          width: 640,
          height: 640,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* SVG Circular Dial & Progress Ring */}
        <svg
          width="640"
          height="640"
          viewBox="0 0 640 640"
          style={{ position: "absolute", transform: "rotate(-90deg)" }}
        >
          {/* Background track circle */}
          <circle
            cx="320"
            cy="320"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="8"
          />
          {/* Outer tick ring */}
          <circle
            cx="320"
            cy="320"
            r={radius + 18}
            fill="none"
            stroke={accent}
            strokeWidth="2"
            strokeDasharray="4 16"
            opacity="0.4"
          />
          {/* Active Glowing Progress Arc */}
          <circle
            cx="320"
            cy="320"
            r={radius}
            fill="none"
            stroke={accent}
            strokeWidth="12"
            strokeDasharray={circ}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 16px ${accent})`,
              transition: "stroke-dashoffset 0.05s linear",
            }}
          />
        </svg>

        {/* Center Giant Metric Text */}
        <div
          style={{
            fontSize: 210,
            fontWeight: 900,
            color: accent,
            transform: `scale(${0.85 + 0.15 * s})`,
            opacity: Math.min(1, s * 1.4),
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.04em",
            textShadow: `0 0 70px ${accent}88, 0 8px 40px rgba(0,0,0,0.7)`,
            zIndex: 2,
            textAlign: "center",
            lineHeight: 1,
          }}
        >
          {countUp(String(scene.value ?? ""), p)}
        </div>
      </div>

      {/* Bottom Subtitle / Label */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <RevealText
          text={scene.label ?? ""}
          delay={14}
          style={{ fontSize: 68, fontWeight: 800, color: MUTED, letterSpacing: "-0.01em" }}
        />
      </div>
    </AbsoluteFill>
  );
};
