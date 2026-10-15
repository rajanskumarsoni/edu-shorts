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
import { FONT } from "../theme";
import { MotionGraphic } from "../MotionGraphic";

export const DataStructure: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();

  const structureType = (scene.structure ?? "queue").toLowerCase();
  const rawOps = scene.operations ?? [
    "enqueue('Task 1')",
    "enqueue('Task 2')",
    "dequeue() -> Task 1",
  ];

  // Animated elements inside the data structure
  const cells = [
    { id: "01", val: "Task A", status: "Head" },
    { id: "02", val: "Task B", status: "Active" },
    { id: "03", val: "Task C", status: "Tail" },
    { id: "04", val: "Task D", status: "Queued" },
  ];

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
            {`// ${structureType.toUpperCase()} DATA STRUCTURE`}
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

      {/* Memory Cell Container */}
      <div
        style={{
          display: "flex",
          flexDirection: L.landscape ? "row" : "column",
          gap: 16,
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {cells.map((cell, idx) => {
          const cellSpring = spring({
            frame: frame - 10 - idx * 8,
            fps,
            config: { damping: 14, stiffness: 120 },
          });

          const isHead = idx === 0;
          const isTail = idx === cells.length - 1;

          return (
            <div
              key={idx}
              style={{
                width: L.landscape ? 180 : "100%",
                padding: "24px 28px",
                borderRadius: 20,
                background: isHead
                  ? "rgba(18, 25, 45, 0.96)"
                  : "rgba(14, 18, 30, 0.85)",
                backdropFilter: "blur(20px)",
                border: isHead
                  ? `2px solid ${accent}`
                  : "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow: isHead
                  ? `0 15px 35px rgba(0,0,0,0.6), 0 0 25px ${accent}44`
                  : "0 8px 20px rgba(0,0,0,0.4)",
                display: "flex",
                flexDirection: L.landscape ? "column" : "row",
                justifyContent: "space-between",
                alignItems: "center",
                transform: `scale(${0.9 + 0.1 * cellSpring})`,
                opacity: cellSpring,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 28,
                    color: isHead ? accent : "#718096",
                    fontWeight: 800,
                  }}
                >
                  {`[${idx}]`}
                </div>
                <MotionGraphic
                  text={cell.val}
                  accent={isHead ? accent : "#A0AEC0"}
                  size="xs"
                  showPedestal={true}
                  showRadar={false}
                />
                <div style={{ fontSize: 34, fontWeight: 800, color: "#FFFFFF" }}>
                  {cell.val}
                </div>
              </div>

              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 28,
                  fontWeight: 800,
                  color: isHead ? accent : isTail ? "#FFBD2E" : "#A0AEC0",
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: isHead
                    ? `${accent}22`
                    : isTail
                    ? "#FFBD2E22"
                    : "rgba(255,255,255,0.05)",
                  marginTop: L.landscape ? 12 : 0,
                  textTransform: "uppercase",
                }}
              >
                {cell.status}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal Operation Log */}
      {rawOps.length > 0 && (
        <div
          style={{
            marginTop: 28,
            padding: "16px 24px",
            borderRadius: 16,
            background: "rgba(10, 14, 24, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "monospace",
            fontSize: 28,
            color: accent,
          }}
        >
          <span>❯</span>
          <span style={{ color: "#E2E8F0" }}>
            {rawOps[Math.floor((frame / 35) % rawOps.length)]}
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};
