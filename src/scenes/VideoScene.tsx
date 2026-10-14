import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";

// Full-bleed stock B-roll video clip with subtle dark-mode vignette and tracked typography
export const VideoScene: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const bar = spring({ frame: frame - 16, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1020", overflow: "hidden" }}>
      {scene.video && (
        <OffthreadVideo
          src={staticFile(scene.video)}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
      {/* Dark gradient overlay so captions and text remain readable */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(5,8,20,0.92) 0%, rgba(5,8,20,0.25) 50%, rgba(5,8,20,0.45) 100%)",
        }}
      />
      {/* Cinematic inset vignette */}
      <AbsoluteFill
        style={{
          boxShadow: "inset 0 0 120px rgba(0,0,0,0.85)",
          pointerEvents: "none",
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
              fontSize: L.landscape ? 64 : 84,
              fontWeight: 900,
              lineHeight: 1.08,
              textShadow: "0 8px 40px rgba(0,0,0,0.85)",
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

