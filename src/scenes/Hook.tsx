import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
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
  const bar = spring({ frame: frame - 18, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
      }}
    >
      <RevealText
        text={scene.text ?? ""}
        stagger={4}
        style={{
          fontSize: 124,
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          textShadow: "0 10px 50px rgba(0,0,0,0.55)",
        }}
      />
      <div
        style={{
          marginTop: 56,
          width: 240 * bar,
          height: 10,
          borderRadius: 5,
          background: accent,
          boxShadow: `0 0 36px ${accent}`,
        }}
      />
    </AbsoluteFill>
  );
};
