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
import { FONT, resolveSceneTag } from "../theme";
import { MotionGraphic } from "../MotionGraphic";
import { ThreeDConcentricSecurity } from "./ThreeDConcentricSecurity";

export const Concentric: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();

  // If PIN or security rings described, delegate to high-end 3D scene
  const is3DSecurity =
    scene.variant === "concentric_security_3d" ||
    scene.variant === "zero_knowledge_pin_3d" ||
    /pin|keystore|token|vault key/i.test(scene.title || "") ||
    /pin|keystore|zero-knowledge/i.test(scene.tag || "");

  if (is3DSecurity) {
    return <ThreeDConcentricSecurity scene={scene} accent={accent} />;
  }

  const rings: string[] = scene.rings ?? [
    "Core Data Vault",
    "Application Auth",
    "Container Sandbox",
    "Network Firewall",
  ];

  const maxRadius = L.landscape ? 260 : 310;
  const ringStep = maxRadius / rings.length;

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
            {resolveSceneTag(scene, "// DEFENSE-IN-DEPTH PERIMETER")}
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

      {/* Concentric Rings Visual Container */}
      <div
        style={{
          position: "relative",
          width: maxRadius * 2,
          height: maxRadius * 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Core Glowing Center Jewel / Anchor */}
        <div style={{ position: "absolute", zIndex: 10 }}>
          <MotionGraphic
            icon={scene.icon ?? "shield-check"}
            text={rings[0]}
            accent={accent}
            size="sm"
            showPedestal={true}
            showRadar={false}
          />
        </div>

        {rings.map((ringName, idx) => {
          const r = ringStep * (idx + 1);
          const diam = r * 2;
          const rotDir = idx % 2 === 0 ? 1 : -1;
          const rotation = rotDir * (frame / (40 + idx * 10)) * 360;

          const ringSpring = spring({
            frame: frame - 10 - idx * 8,
            fps,
            config: { damping: 14, stiffness: 120 },
          });

          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                width: diam,
                height: diam,
                borderRadius: "50%",
                border: `1.5px dashed ${idx === 0 ? accent : "rgba(255, 255, 255, 0.2)"}`,
                boxShadow: idx === 0 ? `0 0 25px ${accent}33` : "none",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                transform: `rotate(${rotation}deg) scale(${ringSpring})`,
                opacity: ringSpring,
              }}
            >
              {/* Ring Label pill counter-rotating so text stays upright */}
              <div
                style={{
                  transform: `rotate(${-rotation}deg) translateY(-50%)`,
                  padding: "6px 16px",
                  borderRadius: 14,
                  background: "rgba(10, 15, 28, 0.95)",
                  border: `1.5px solid ${idx === 0 ? accent : "rgba(255, 255, 255, 0.2)"}`,
                  color: idx === 0 ? accent : "#E2E8F0",
                  fontFamily: "monospace",
                  fontSize: 28,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                {ringName}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
