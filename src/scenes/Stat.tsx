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
import { MUTED } from "../theme";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";

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
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
      }}
    >
      <div
        style={{
          fontSize: 270,
          fontWeight: 900,
          color: accent,
          transform: `scale(${0.85 + 0.15 * s})`,
          opacity: Math.min(1, s * 1.4),
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.03em",
          textShadow: `0 0 70px ${accent}77, 0 8px 40px rgba(0,0,0,0.5)`,
        }}
      >
        {countUp(scene.value ?? "", p)}
      </div>
      <RevealText
        text={scene.label ?? ""}
        delay={14}
        style={{ fontSize: 72, fontWeight: 700, color: MUTED }}
      />
    </AbsoluteFill>
  );
};
