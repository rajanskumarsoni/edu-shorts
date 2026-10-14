import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneSpec } from "../types";
import { MUTED, resolveSceneTag } from "../theme";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { MotionGraphic } from "../MotionGraphic";
import { ThreeDOutroPayoff } from "./ThreeDOutroPayoff";

export const Outro: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  // Delegate to 3D WebGL Digital India Outro
  const is3DOutro =
    scene.variant === "upi_outro_3d" ||
    scene.variant === "outro_3d" ||
    scene.variant === "digital_india_3d" ||
    /digital india|seconds on screen|systems behind/i.test(scene.text || "") ||
    /mission accomplished|digital india/i.test(scene.tag || "") ||
    (scene.type === "outro" && (scene.icon === "sparkles" || scene.icon === "smartphone"));

  if (is3DOutro) {
    return <ThreeDOutroPayoff scene={scene} accent={accent} />;
  }

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const s = spring({ frame: frame - 12, fps, config: { damping: 16, stiffness: 120 } });
  const pulse = (Math.sin(frame / 7) + 1) / 2;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
      }}
    >
      {/* Background Animated Energy Shockwaves */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          pointerEvents: "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity: 0.4 * s,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 380 + pulse * 70,
            height: 380 + pulse * 70,
            borderRadius: "50%",
            border: `2px solid ${accent}`,
            opacity: 0.6 * (1 - pulse),
            boxShadow: `0 0 40px ${accent}66`,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 260 + pulse * 50,
            height: 260 + pulse * 50,
            borderRadius: "50%",
            border: `1.5px dashed ${accent}`,
            opacity: 0.4,
            transform: `rotate(${frame * 2}deg)`,
          }}
        />
      </div>

      {/* Top Channel Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 26px",
          borderRadius: 999,
          background: "rgba(255, 255, 255, 0.05)",
          border: `1px solid ${accent}55`,
          marginBottom: 36,
          opacity: s,
          transform: `translateY(${(1 - s) * 20}px)`,
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "0.22em",
            color: accent,
            textTransform: "uppercase",
          }}
        >
          {resolveSceneTag(scene, "05 // MISSION COMPLETE")}
        </span>
      </div>

      {/* Dynamic Animated Outro/Payoff Motion Graphic */}
      <MotionGraphic
        icon={scene.icon || "sparkles"}
        text={scene.text}
        narration={scene.narration}
        accent={accent}
        size="lg"
        style={{ marginBottom: 40 }}
      />

      {/* Main Headline Call to Action */}
      <RevealText
        text={scene.text ?? "Follow for more"}
        stagger={4}
        style={{
          fontSize: 108,
          fontWeight: 900,
          color: "#FFFFFF",
          lineHeight: 1.05,
          textAlign: "center",
          textShadow: `0 0 50px ${accent}66, 0 10px 40px rgba(0,0,0,0.7)`,
        }}
      />

      {/* Animated Action Pill / Subscription Beacon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 44,
          padding: "16px 36px",
          borderRadius: 999,
          background: `linear-gradient(135deg, ${accent}33, ${accent}11)`,
          border: `2px solid ${accent}`,
          boxShadow: `0 0 30px ${accent}44`,
          opacity: s,
          transform: `scale(${0.92 + 0.08 * s})`,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 16px ${accent}`,
            transform: `scale(${0.8 + 0.4 * pulse})`,
          }}
        />
        <span
          style={{
            fontSize: 38,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: "0.02em",
          }}
        >
          {"Stay Curious · Follow For Daily Tech"}
        </span>
      </div>
    </AbsoluteFill>
  );
};
