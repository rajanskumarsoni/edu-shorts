import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { FONT } from "../theme";

export const DiagramScene: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();

  // Smooth entrance spring
  const enter = spring({ frame, fps, config: { damping: 200 } });
  // Subtle continuous camera drift
  const scale = interpolate(frame, [0, durationInFrames], [0.97, 1.02]);
  // Glowing laser scan line traversing downwards
  const scanProgress = interpolate(frame, [0, durationInFrames], [0, 100]);

  // Diagram source: can be scene.diagram or scene.image
  const diagramSource = scene.diagram || scene.image;
  const diagramUrl = diagramSource ? staticFile(diagramSource) : null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0B1020",
        fontFamily: FONT,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
      }}
    >
      {/* Background subtle technical grid */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 240, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 240, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* Header section */}
      <div
        style={{
          width: "100%",
          maxWidth: L.landscape ? 1400 : 920,
          marginBottom: 32,
          zIndex: 10,
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
              marginBottom: 10,
              fontFamily: "monospace",
            }}
          >
            {scene.tag}
          </div>
        )}
        {scene.title && (
          <RevealText
            text={scene.title}
            align="left"
            style={{
              fontSize: L.landscape ? 56 : 72,
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          />
        )}
      </div>

      {/* Diagram Glassmorphism Card */}
      <div
        style={{
          width: "100%",
          maxWidth: L.landscape ? 1400 : 960,
          flex: 1,
          maxHeight: L.landscape ? 700 : 1080,
          background: "rgba(16, 24, 48, 0.72)",
          border: `2px solid ${accent}40`,
          borderRadius: 24,
          padding: 32,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          backdropFilter: "blur(16px)",
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.6), inset 0 0 40px ${accent}15`,
          opacity: enter,
          transform: `scale(${scale})`,
        }}
      >
        {/* Glowing laser scanline indicator */}
        <div
          style={{
            position: "absolute",
            top: `${scanProgress}%`,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            boxShadow: `0 0 16px ${accent}`,
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        {diagramUrl ? (
          <Img
            src={diagramUrl}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))",
            }}
          />
        ) : (
          <div
            style={{
              color: "#8892B0",
              fontSize: 28,
              fontFamily: "monospace",
              textAlign: "center",
            }}
          >
            [DIAGRAM PLACEHOLDER: Specifying Mermaid or Graphviz code]
          </div>
        )}
      </div>

      {/* Bottom telemetry or label tags (displayed in landscape mode where vertical space permits) */}
      {L.landscape && scene.visual && scene.visual.motion_graphics && (
        <div
          style={{
            width: "100%",
            maxWidth: L.landscape ? 1400 : 920,
            marginTop: 24,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            zIndex: 10,
          }}
        >
          {scene.visual.motion_graphics.map((label, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(0, 240, 255, 0.08)",
                border: `1px solid ${accent}40`,
                padding: "8px 20px",
                borderRadius: 999,
                fontSize: 20,
                color: "#E2E8F0",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};
