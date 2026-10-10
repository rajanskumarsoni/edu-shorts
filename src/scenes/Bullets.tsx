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

      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Animated Vertical Circuit Bus Line */}
        <div
          style={{
            position: "absolute",
            left: 54,
            top: 20,
            bottom: 20,
            width: 3,
            background: `linear-gradient(to bottom, ${accent}88, rgba(255,255,255,0.1))`,
            borderRadius: 2,
            zIndex: 0,
          }}
        />

        {items.map((it, i) => {
          const s = spring({
            frame: frame - (12 + i * gap),
            fps,
            config: { damping: 14, stiffness: 130, mass: 0.85 },
          });
          const pulse = (Math.sin(frame / 6 + i) + 1) / 2;

          return (
            <div
              key={i}
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                gap: 24,
                background: "rgba(18, 22, 34, 0.82)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderLeft: `6px solid ${accent}`,
                borderRadius: 20,
                padding: "26px 32px",
                boxShadow: `0 18px 45px rgba(0,0,0,0.5), 0 0 30px ${accent}1a`,
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
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: accent,
                    boxShadow: `0 0 10px ${accent}`,
                    transform: `scale(${0.7 + 0.3 * pulse})`,
                  }}
                />
                {`0${i + 1}`}
              </div>
              <div
                style={{
                  flex: 1,
                  fontSize: 56,
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
