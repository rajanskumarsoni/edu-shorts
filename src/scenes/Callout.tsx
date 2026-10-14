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
import { ThreeDCalloutAlert } from "./ThreeDCalloutAlert";

export const Callout: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  // Explicit variant selection has highest precedence, with legacy keyword fallback for backward compatibility
  const isExplicit3DAlert =
    scene.variant === "payment_reconciliation_alert" ||
    scene.variant === "upi_alert_3d" ||
    scene.variant === "alert_3d" ||
    scene.variant === "callout_3d";

  const isLegacyKeywordAlert =
    !scene.variant &&
    (/payment fail|reconciliation|pending|golden rule/i.test(scene.title || "") ||
     /golden rule|warning|alert/i.test(scene.tag || "") ||
     /pending|reconcil/i.test(scene.text || ""));

  if (isExplicit3DAlert || isLegacyKeywordAlert) {
    return <ThreeDCalloutAlert scene={scene} accent={accent} />;
  }

  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();

  const category = (scene.category ?? "KEY TAKEAWAY").toUpperCase();
  const mainText = scene.text ?? scene.title ?? "Fundamental Rule";
  const subtext = scene.subtext ?? "";

  const cardSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const floatY = Math.sin(frame / 20) * 8;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
        fontFamily: FONT,
      }}
    >
      {/* Floating Glassmorphic Callout Card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: L.landscape ? 980 : 900,
          padding: L.landscape ? "48px 56px" : "56px 48px",
          borderRadius: 28,
          background: "rgba(14, 20, 36, 0.94)",
          backdropFilter: "blur(28px)",
          border: `1.5px solid ${accent}55`,
          boxShadow: `0 35px 80px rgba(0,0,0,0.7), 0 0 50px ${accent}22`,
          transform: `translateY(${floatY}px) scale(${0.9 + 0.1 * cardSpring})`,
          opacity: cardSpring,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Category Header Badge & Semantic Motion Graphic */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              padding: "8px 20px",
              borderRadius: 30,
              background: `${accent}22`,
              border: `1.5px solid ${accent}`,
              color: accent,
              fontFamily: "monospace",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 2,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>★</span>
            <span>{category}</span>
          </div>

          <MotionGraphic
            icon={scene.icon}
            text={mainText}
            narration={scene.narration}
            accent={accent}
            size="sm"
            showRadar={false}
          />
        </div>

        {/* Big Bold Headline Rule */}
        <div
          style={{
            fontSize: L.landscape ? 58 : 68,
            fontWeight: 900,
            color: "#FFFFFF",
            lineHeight: 1.15,
            letterSpacing: -1,
            textShadow: "0 10px 40px rgba(0,0,0,0.8)",
          }}
        >
          {mainText}
        </div>

        {/* Divider Glow Line */}
        <div
          style={{
            height: 2,
            width: "100%",
            background: `linear-gradient(90deg, ${accent}, transparent)`,
            opacity: 0.6,
          }}
        />

        {/* Explanatory Subtext */}
        {subtext && (
          <div
            style={{
              fontSize: L.landscape ? 28 : 36,
              fontWeight: 500,
              color: "#CBD5E1",
              lineHeight: 1.45,
            }}
          >
            {subtext}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
