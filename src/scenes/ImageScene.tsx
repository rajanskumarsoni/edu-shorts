import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";

// Full-bleed photo with a slow Ken Burns push-in and an optional caption.
export const ImageScene: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();
  const p = frame / Math.max(durationInFrames, 1);
  const zoom = 1.08 + 0.14 * p;
  const shift = interpolate(p, [0, 1], [-2.5, 2.5]);
  const bar = spring({ frame: frame - 16, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      {scene.image && (
        <Img
          src={staticFile(scene.image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${zoom}) translateX(${shift}%)`,
          }}
        />
      )}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(5,8,20,0.88) 0%, rgba(5,8,20,0.0) 50%, rgba(5,8,20,0.35) 100%)",
        }}
      />
      {scene.title && (
        <AbsoluteFill
          style={{
            justifyContent: "flex-end",
            alignItems: "flex-start",
            padding: `0 ${L.padX}px ${L.padBottom}px`,
          }}
        >
          {scene.tag && (
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "0.22em",
                color: accent,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              {scene.tag}
            </div>
          )}
          <div
            style={{
              width: 140 * bar,
              height: 8,
              borderRadius: 4,
              background: accent,
              boxShadow: `0 0 28px ${accent}`,
              marginBottom: 24,
            }}
          />
          <RevealText
            text={scene.title}
            align="left"
            delay={8}
            style={{
              fontSize: 92,
              fontWeight: 900,
              lineHeight: 1.05,
              textShadow: "0 8px 40px rgba(0,0,0,0.7)",
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
