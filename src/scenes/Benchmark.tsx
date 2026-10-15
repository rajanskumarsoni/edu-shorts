import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { BenchmarkRunner, SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { FONT } from "../theme";
import { MotionGraphic } from "../MotionGraphic";

export const Benchmark: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();

  const runners: BenchmarkRunner[] = scene.runners ?? [
    { name: "Single-Thread Python", value: 4.82, status: "Baseline" },
    { name: "Multi-Core Go", value: 0.42, status: "11x Faster" },
    { name: "SIMD Vectorized Rust", value: 0.04, status: "Winner / 120x" },
  ];

  const unit = scene.unit ?? "s";
  const maxVal = Math.max(...runners.map((r) => r.value), 1);
  const minVal = Math.min(...runners.map((r) => r.value));

  const animProgress = interpolate(frame, [15, durationInFrames * 0.75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
        <div style={{ marginBottom: 36 }}>
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
            {"// SPEED SHOWDOWN"}
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

      {/* Benchmark Race Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
        {runners.map((runner, idx) => {
          const isWinner = runner.value === minVal;
          const barFrac = Math.max(0.12, runner.value / maxVal);
          const currentLength = barFrac * animProgress * 100;

          const currentElapsed = runner.value * animProgress;

          const barColor = isWinner
            ? accent
            : idx % 2 === 0
            ? "#FF5F56"
            : "#FFBD2E";

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: "18px 24px",
                borderRadius: 20,
                background: isWinner
                  ? "rgba(18, 25, 45, 0.96)"
                  : "rgba(14, 18, 30, 0.82)",
                backdropFilter: "blur(20px)",
                border: isWinner
                  ? `2px solid ${accent}`
                  : "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow: isWinner
                  ? `0 15px 35px rgba(0,0,0,0.6), 0 0 30px ${accent}33`
                  : "0 10px 25px rgba(0,0,0,0.4)",
              }}
            >
              {/* Runner Title & Metrics */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <MotionGraphic
                    text={runner.name}
                    accent={barColor}
                    size="xs"
                    showPedestal={true}
                    showRadar={false}
                  />
                  <div style={{ fontSize: 34, fontWeight: 800, color: "#FFFFFF" }}>
                    {runner.name}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 34,
                      fontWeight: 800,
                      color: isWinner ? accent : "#E2E8F0",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {currentElapsed.toFixed(2)} {unit}
                  </div>
                  {runner.status && (
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 28,
                        fontWeight: 800,
                        color: isWinner ? "#0B1020" : barColor,
                        background: isWinner ? accent : `${barColor}22`,
                        padding: "6px 14px",
                        borderRadius: 8,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      {runner.status}
                    </div>
                  )}
                </div>
              </div>

              {/* Racing Progress Bar Track */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 14,
                  borderRadius: 7,
                  background: "rgba(255, 255, 255, 0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${currentLength}%`,
                    background: barColor,
                    borderRadius: 7,
                    boxShadow: isWinner ? `0 0 16px ${barColor}` : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
