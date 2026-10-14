import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { QuadrantPoint, SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { FONT } from "../theme";

export const Quadrant: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();

  const xAxis = scene.xAxis ?? "Complexity";
  const yAxis = scene.yAxis ?? "Throughput";

  const points: QuadrantPoint[] = scene.points ?? [
    { name: "LSM-Tree (Cassandra)", x: 8.5, y: 4.5 },
    { name: "B+ Tree (Postgres)", x: 4.5, y: 8.5 },
    { name: "In-Memory (Redis)", x: 9.0, y: 9.2 },
    { name: "Flat Files (S3)", x: 2.0, y: 2.5 },
  ];

  const size = L.landscape ? 480 : 540;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
        fontFamily: FONT,
      }}
    >
      {/* Scene Header */}
      {scene.title && (
        <div style={{ marginBottom: 28, width: "100%", textAlign: "center" }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 28,
              fontWeight: 800,
              color: accent,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 8,
              opacity: 0.9,
            }}
          >
            {"// TRADE-OFF QUADRANT MATRIX"}
          </div>
          <RevealText
            text={scene.title}
            align="center"
            style={{
              fontSize: L.landscape ? 60 : 70,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1.1,
              textShadow: "0 8px 30px rgba(0,0,0,0.6)",
            }}
          />
        </div>
      )}

      {/* 2x2 Matrix Box */}
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: 24,
          background: "rgba(14, 20, 36, 0.90)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Horizontal Center Axis */}
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            height: 2,
            background: "rgba(255, 255, 255, 0.2)",
          }}
        />

        {/* Vertical Center Axis */}
        <div
          style={{
            position: "absolute",
            top: 20,
            bottom: 20,
            width: 2,
            background: "rgba(255, 255, 255, 0.2)",
          }}
        />

        {/* Axis Labels */}
        <div
          style={{
            position: "absolute",
            right: 20,
            bottom: 16,
            fontFamily: "monospace",
            fontSize: 28,
            fontWeight: 800,
            color: accent,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {`${xAxis} →`}
        </div>

        <div
          style={{
            position: "absolute",
            left: 20,
            top: 18,
            fontFamily: "monospace",
            fontSize: 28,
            fontWeight: 800,
            color: accent,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {`↑ ${yAxis}`}
        </div>

        {/* Plotted Data Points */}
        {points.map((pt, idx) => {
          const ptSpring = spring({
            frame: frame - 15 - idx * 8,
            fps,
            config: { damping: 12, stiffness: 120 },
          });

          // Coordinates scaled from 0-10 domain into percentage inside matrix
          const leftPct = 10 + (pt.x / 10) * 80;
          const bottomPct = 10 + (pt.y / 10) * 80;

          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: `${leftPct}%`,
                bottom: `${bottomPct}%`,
                transform: "translate(-50%, 50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                opacity: ptSpring,
              }}
            >
              {/* Neon Point Node */}
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: accent,
                  boxShadow: `0 0 18px ${accent}`,
                  border: "2px solid #FFFFFF",
                }}
              />

              {/* Point Name Tag */}
              <div
                style={{
                  padding: "6px 14px",
                  borderRadius: 10,
                  background: "rgba(10, 14, 24, 0.95)",
                  border: `1.5px solid ${accent}66`,
                  color: "#FFFFFF",
                  fontFamily: "monospace",
                  fontSize: 28,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
                }}
              >
                {pt.name}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
