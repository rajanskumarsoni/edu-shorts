import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { FONT } from "../theme";
import { MotionGraphic } from "../MotionGraphic";
import { ThreeDArchitecturePipeline } from "./ThreeDArchitecturePipeline";

export const Architecture: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  // Delegate to 3D WebGL Architecture Pipeline
  const is3DArchitecture =
    scene.variant === "upi_architecture_3d" ||
    scene.variant === "architecture_3d" ||
    scene.variant === "pipeline_3d" ||
    /upi architecture|end-to-end pipeline|microservice/i.test(scene.title || "") ||
    /pipeline|architecture|end-to-end/i.test(scene.tag || "");

  if (is3DArchitecture) {
    return <ThreeDArchitecturePipeline scene={scene} accent={accent} />;
  }

  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();

  const rawNodes = scene.nodes ?? scene.steps ?? [
    "Client Request",
    "API Gateway",
    "Redis Cache",
    "Primary Database",
  ];
  const nodes = rawNodes.slice(0, 5); // Optimal 3-5 nodes

  const activeIndex =
    typeof scene.activeNode === "number"
      ? scene.activeNode
      : Math.min(
          nodes.length - 1,
          Math.floor((frame / (durationInFrames * 0.85)) * nodes.length)
        );

  const stepDuration = (durationInFrames * 0.6) / Math.max(nodes.length, 1);

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
            {scene.tag ? `// ${scene.tag.toUpperCase()}` : "// SYSTEM TOPOLOGY"}
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

      {/* Nodes Container */}
      <div
        style={{
          display: "flex",
          flexDirection: L.landscape ? "row" : "column",
          alignItems: "center",
          justifyContent: "center",
          gap: L.landscape ? 16 : 18,
          width: "100%",
        }}
      >
        {nodes.map((nodeName, idx) => {
          const nodeStart = 10 + idx * stepDuration;
          const nodeSpring = spring({
            frame: frame - nodeStart,
            fps,
            config: { damping: 14, stiffness: 120 },
          });

          const isActive = idx === activeIndex;
          const isPassed = idx < activeIndex;

          // Packet Animation along connection line
          const packetProgress = (frame * 2.5 + idx * 30) % 100;

          return (
            <React.Fragment key={idx}>
              {/* Node Card */}
              <div
                style={{
                  width: L.landscape ? "auto" : "100%",
                  minWidth: L.landscape ? 200 : "100%",
                  padding: L.landscape ? "20px 24px" : "22px 28px",
                  borderRadius: 20,
                  background: isActive
                    ? "rgba(18, 26, 46, 0.95)"
                    : "rgba(14, 18, 30, 0.85)",
                  backdropFilter: "blur(20px)",
                  border: isActive
                    ? `2px solid ${accent}`
                    : isPassed
                    ? `1px solid ${accent}66`
                    : "1px solid rgba(255, 255, 255, 0.12)",
                  boxShadow: isActive
                    ? `0 20px 45px rgba(0,0,0,0.7), 0 0 35px ${accent}44`
                    : "0 12px 28px rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transform: `scale(${0.9 + 0.1 * nodeSpring})`,
                  opacity: nodeSpring,
                  transition: "border 0.2s, box-shadow 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  {/* Semantic Node Motion Graphic Icon */}
                  <MotionGraphic
                    text={nodeName}
                    accent={isActive ? accent : "#A0AEC0"}
                    size="sm"
                    showPedestal={true}
                    showRadar={false}
                  />

                  {/* Node Name */}
                  <div>
                    <div
                      style={{
                        fontSize: L.landscape ? 26 : 34,
                        fontWeight: 800,
                        color: "#FFFFFF",
                        letterSpacing: -0.3,
                      }}
                    >
                      {nodeName}
                    </div>
                    <div
                      style={{
                        fontFamily: "monospace",
                        fontSize: 28,
                        color: isActive ? accent : "#718096",
                        fontWeight: 700,
                        marginTop: 4,
                      }}
                    >
                      {isActive
                        ? "ACTIVE / IN-FLIGHT"
                        : isPassed
                        ? "ACKNOWLEDGED"
                        : "QUEUED"}
                    </div>
                  </div>
                </div>

                {/* Status Indicator Dot */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: isActive
                        ? accent
                        : isPassed
                        ? "#27C93F"
                        : "#4A5568",
                      boxShadow: isActive
                        ? `0 0 12px ${accent}`
                        : isPassed
                        ? "0 0 8px #27C93F"
                        : "none",
                    }}
                  />
                </div>
              </div>

              {/* Connecting Bus / Energy Conduit Line */}
              {idx < nodes.length - 1 && (
                <div
                  style={{
                    position: "relative",
                    width: L.landscape ? 40 : 4,
                    height: L.landscape ? 4 : 32,
                    background: "rgba(255, 255, 255, 0.12)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  {/* Energy Data Packet Pulsing Across */}
                  <div
                    style={{
                      position: "absolute",
                      width: L.landscape ? 16 : 4,
                      height: L.landscape ? 4 : 16,
                      background: accent,
                      boxShadow: `0 0 10px ${accent}`,
                      top: L.landscape ? 0 : `${packetProgress}%`,
                      left: L.landscape ? `${packetProgress}%` : 0,
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
