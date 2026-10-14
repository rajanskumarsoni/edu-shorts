import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneSpec } from "../types";
import { MUTED } from "../theme";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { MotionGraphic } from "../MotionGraphic";

export const Quote: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();
  const mark = spring({ frame, fps, config: { damping: 20 } });
  const authorDelay = Math.min(durationInFrames * 0.45, 70);
  const a = spring({ frame: frame - authorDelay, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "flex-start",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
      }}
    >
      <div
        style={{
          fontSize: 340,
          lineHeight: 0.7,
          fontWeight: 900,
          color: accent,
          opacity: 0.9 * mark,
          transform: `scale(${0.7 + 0.3 * mark})`,
          textShadow: `0 0 60px ${accent}66`,
          marginBottom: 20,
        }}
      >
        {"\u201C"}
      </div>
      <RevealText
        text={scene.text ?? ""}
        align="left"
        stagger={3}
        delay={6}
        style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.18 }}
      />
      {scene.author && (
        <div
          style={{
            marginTop: 52,
            display: "flex",
            alignItems: "center",
            gap: 20,
            opacity: a,
            transform: `translateY(${(1 - a) * 24}px)`,
          }}
        >
          <MotionGraphic
            icon={scene.icon}
            text={scene.author}
            accent={accent}
            size="xs"
            showPedestal={true}
            showRadar={false}
          />
          <div style={{ width: 60, height: 4, borderRadius: 2, background: accent }} />
          <div style={{ fontSize: 52, fontWeight: 600, color: MUTED }}>
            {scene.author}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
