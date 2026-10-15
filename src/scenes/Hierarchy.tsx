import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { HierarchyLayer, SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { FONT } from "../theme";
import { MotionGraphic } from "../MotionGraphic";

export const Hierarchy: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();

  const layers: HierarchyLayer[] = scene.layers ?? [
    { name: "CPU Registers", spec: "0.5 ns (Sub-1KB)", active: true },
    { name: "L1 / L2 Cache", spec: "1 - 4 ns (64KB - 1MB)" },
    { name: "Main Memory (RAM)", spec: "100 ns (16GB - 64GB)" },
    { name: "NVMe Flash Storage", spec: "10 - 50 μs (1TB - 4TB)" },
  ];

  const activeIdx =
    layers.findIndex((l) => l.active) !== -1
      ? layers.findIndex((l) => l.active)
      : Math.min(
          layers.length - 1,
          Math.floor((frame / (durationInFrames * 0.85)) * layers.length)
        );

  const stepInterval = (durationInFrames * 0.6) / Math.max(layers.length, 1);

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
            {"// MEMORY & ABSTRACTION HIERARCHY"}
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

      {/* Layer Stack Pyramidal Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
        {layers.map((layer, idx) => {
          const layerStart = 10 + idx * stepInterval;
          const layerSpring = spring({
            frame: frame - layerStart,
            fps,
            config: { damping: 14, stiffness: 120 },
          });

          const isActive = idx === activeIdx;

          // Trapezoid pyramidal widths: top layer is narrower, bottom layer spans full width
          const widthPercent = 75 + (idx / Math.max(1, layers.length - 1)) * 25;

          return (
            <div
              key={idx}
              style={{
                alignSelf: "center",
                width: `${widthPercent}%`,
                padding: "20px 28px",
                borderRadius: 18,
                background: isActive
                  ? "rgba(18, 25, 45, 0.96)"
                  : "rgba(14, 18, 30, 0.82)",
                backdropFilter: "blur(20px)",
                border: isActive
                  ? `2px solid ${accent}`
                  : "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow: isActive
                  ? `0 15px 35px rgba(0,0,0,0.6), 0 0 30px ${accent}33`
                  : "0 8px 20px rgba(0,0,0,0.4)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transform: `scale(${0.9 + 0.1 * layerSpring})`,
                opacity: layerSpring,
                transition: "border 0.2s, box-shadow 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 28,
                    fontWeight: 800,
                    color: isActive ? accent : "#718096",
                  }}
                >
                  {`L${idx}`}
                </div>
                <MotionGraphic
                  icon={layer.icon}
                  text={layer.name}
                  accent={isActive ? accent : "#A0AEC0"}
                  size="xs"
                  showPedestal={true}
                  showRadar={false}
                />
                <div
                  style={{
                    fontSize: 34,
                    fontWeight: 800,
                    color: isActive ? "#FFFFFF" : "#E2E8F0",
                  }}
                >
                  {layer.name}
                </div>
              </div>

              {layer.spec && (
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 28,
                    fontWeight: 800,
                    color: isActive ? accent : "#A0AEC0",
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: isActive ? `${accent}22` : "rgba(255,255,255,0.05)",
                  }}
                >
                  {layer.spec}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
