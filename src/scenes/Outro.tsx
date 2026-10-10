import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneSpec } from "../types";
import { MUTED } from "../theme";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";

export const Outro: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const s = spring({ frame: frame - 22, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
      }}
    >
      <RevealText
        text={scene.text ?? "Follow for more"}
        stagger={5}
        style={{
          fontSize: 112,
          fontWeight: 900,
          color: accent,
          lineHeight: 1.05,
          textShadow: `0 0 60px ${accent}66`,
        }}
      />
      <div style={{ fontSize: 52, color: MUTED, marginTop: 36, opacity: s }}>
        New lesson every day
      </div>
    </AbsoluteFill>
  );
};
