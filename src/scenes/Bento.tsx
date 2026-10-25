import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { BentoItem, SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { FONT, resolveSceneTag } from "../theme";
import { MotionGraphic } from "../MotionGraphic";

export const Bento: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();

  const rawItems: BentoItem[] = scene.bentoItems ?? [
    { title: "Sub-Millisecond", value: "0.2ms", span: 2, badge: "Ultra Fast" },
    { title: "In-Memory RAM", badge: "Volatile", span: 1 },
    { title: "Pub/Sub Queues", badge: "Streaming", span: 1 },
    { title: "Auto TTL Expiry", value: "O(1)", span: 2, badge: "Zero Drift" },
  ];

  const items = rawItems.slice(0, 4);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
        fontFamily: FONT,
      }}
    >
      {/* Scene Header */}
      {scene.title && (
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 28,
              fontWeight: 800,
              color: accent,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 10,
              opacity: 0.9,
            }}
          >
            {resolveSceneTag(scene, "// FEATURE MATRIX")}
          </div>
          <RevealText
            text={scene.title}
            align="left"
            style={{
              fontSize: L.landscape ? 64 : 76,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1.1,
              textShadow: "0 8px 30px rgba(0,0,0,0.6)",
            }}
          />
        </div>
      )}

      {/* 2-Column Bento Grid Container */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: L.landscape ? "1fr 1fr" : "1fr 1fr",
          gap: 18,
          width: "100%",
        }}
      >
        {items.map((it, idx) => {
          const itemSpring = spring({
            frame: frame - 10 - idx * 6,
            fps,
            config: { damping: 14, stiffness: 120 },
          });

          const isDouble = it.span === 2;

          return (
            <div
              key={idx}
              style={{
                gridColumn: isDouble ? "span 2" : "span 1",
                padding: "24px 28px",
                borderRadius: 22,
                background: "rgba(14, 20, 36, 0.92)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: isDouble ? 140 : 160,
                transform: `scale(${0.9 + 0.1 * itemSpring})`,
                opacity: itemSpring,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <MotionGraphic
                    icon={it.icon}
                    text={it.title}
                    accent={accent}
                    size="xs"
                    showPedestal={true}
                    showRadar={false}
                  />
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: "#FFFFFF",
                      letterSpacing: -0.3,
                    }}
                  >
                    {it.title ?? "Feature"}
                  </div>
                </div>
                {it.badge && (
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 28,
                      fontWeight: 800,
                      color: accent,
                      padding: "6px 14px",
                      borderRadius: 8,
                      background: `${accent}22`,
                      border: `1px solid ${accent}44`,
                      textTransform: "uppercase",
                    }}
                  >
                    {it.badge}
                  </div>
                )}
              </div>

              {it.value !== undefined && (
                <div
                  style={{
                    fontSize: isDouble ? 64 : 52,
                    fontWeight: 900,
                    color: accent,
                    lineHeight: 1,
                    marginTop: 14,
                    textShadow: `0 0 25px ${accent}66`,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {it.value}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
