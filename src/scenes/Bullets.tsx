import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";

export const Bullets: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();
  const items = scene.items ?? [];
  const gap = (durationInFrames * 0.65) / Math.max(items.length, 1);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
      }}
    >
      {scene.title && (
        <div style={{ marginBottom: 48 }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 22,
              fontWeight: 700,
              color: accent,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 12,
              opacity: 0.9,
            }}
          >
            {"// ARCHITECTURE & INSIGHT"}
          </div>
          <RevealText
            text={scene.title}
            align="left"
            style={{
              fontSize: 82,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1.08,
              textShadow: "0 8px 30px rgba(0,0,0,0.6)",
            }}
          />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {items.map((it, i) => {
          const s = spring({
            frame: frame - (12 + i * gap),
            fps,
            config: { damping: 14, stiffness: 130, mass: 0.85 },
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                background: "rgba(18, 22, 34, 0.76)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderLeft: `6px solid ${accent}`,
                borderRadius: 20,
                padding: "26px 32px",
                boxShadow: "0 18px 45px rgba(0,0,0,0.5)",
                opacity: s,
                transform: `translateX(${(1 - s) * -70}px) scale(${0.96 + 0.04 * s})`,
                filter: s >= 0.999 ? "none" : `blur(${(1 - s) * 8}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 24,
                  fontWeight: 800,
                  color: accent,
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${accent}44`,
                  borderRadius: 10,
                  padding: "6px 14px",
                  boxShadow: `0 0 16px ${accent}33`,
                }}
              >
                {`0${i + 1}`}
              </div>
              <div
                style={{
                  fontSize: 58,
                  fontWeight: 700,
                  color: "#EDF2F7",
                  lineHeight: 1.18,
                  letterSpacing: "-0.01em",
                }}
              >
                {it}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
