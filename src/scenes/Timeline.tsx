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

export const Timeline: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();

  const steps = scene.steps ?? scene.items ?? [
    "1. Initialization",
    "2. Processing",
    "3. Verification",
    "4. Final Handshake",
  ];

  const activeIndex =
    typeof scene.activeStep === "number"
      ? scene.activeStep
      : Math.min(
          steps.length - 1,
          Math.floor((frame / (durationInFrames * 0.85)) * steps.length)
        );

  const stepInterval = (durationInFrames * 0.65) / Math.max(steps.length, 1);

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
            {"// EXECUTION LIFECYCLE"}
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

      {/* Vertical Pipeline Track */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Continuous Background Bus Spine Line */}
        <div
          style={{
            position: "absolute",
            left: 27,
            top: 24,
            bottom: 24,
            width: 4,
            background: "rgba(255, 255, 255, 0.12)",
            borderRadius: 2,
          }}
        />

        {/* Animated Progress Spine Line */}
        <div
          style={{
            position: "absolute",
            left: 27,
            top: 24,
            height: `${Math.min(100, ((activeIndex + 0.5) / steps.length) * 100)}%`,
            width: 4,
            background: accent,
            boxShadow: `0 0 12px ${accent}`,
            borderRadius: 2,
            transition: "height 0.3s ease-out",
          }}
        />

        {steps.map((rawStep, idx) => {
          const stepText = typeof rawStep === "string" ? rawStep : rawStep.text;
          const stepIcon = typeof rawStep === "object" ? rawStep.icon : undefined;
          const stepStart = 10 + idx * stepInterval;
          const stepSpring = spring({
            frame: frame - stepStart,
            fps,
            config: { damping: 14, stiffness: 130 },
          });

          const isActive = idx === activeIndex;
          const isPassed = idx < activeIndex;

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                position: "relative",
                zIndex: 2,
                opacity: stepSpring,
                transform: `translateX(${(1 - stepSpring) * 20}px)`,
              }}
            >
              {/* Step Circle Badge */}
              <div
                style={{
                  position: "relative",
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  background: isActive
                    ? accent
                    : isPassed
                    ? "rgba(14, 20, 36, 0.95)"
                    : "rgba(14, 20, 36, 0.8)",
                  border: isActive
                    ? `2px solid #FFFFFF`
                    : isPassed
                    ? `2px solid ${accent}`
                    : "2px solid rgba(255, 255, 255, 0.2)",
                  color: isActive ? "#0B1020" : isPassed ? accent : "#A0AEC0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "monospace",
                  fontSize: 28,
                  fontWeight: 900,
                  boxShadow: isActive ? `0 0 25px ${accent}` : "none",
                }}
              >
                {/* Radar pulse on active step */}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      border: `2px solid ${accent}`,
                      animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                      transform: `scale(${1 + 0.3 * Math.sin(frame / 5)})`,
                      opacity: 0.6,
                    }}
                  />
                )}
                {isPassed ? "✓" : (idx + 1).toString().padStart(2, "0")}
              </div>

              {/* Step Card */}
              <div
                style={{
                  flex: 1,
                  padding: "18px 24px",
                  borderRadius: 18,
                  background: isActive
                    ? "rgba(18, 25, 45, 0.95)"
                    : "rgba(14, 18, 30, 0.80)",
                  backdropFilter: "blur(20px)",
                  border: isActive
                    ? `1.5px solid ${accent}`
                    : "1px solid rgba(255, 255, 255, 0.10)",
                  boxShadow: isActive
                    ? `0 15px 35px rgba(0,0,0,0.6), 0 0 25px ${accent}33`
                    : "0 8px 20px rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <MotionGraphic
                    icon={stepIcon}
                    text={stepText}
                    accent={isActive ? accent : "#A0AEC0"}
                    size="xs"
                    showPedestal={true}
                    showRadar={false}
                  />
                  <div
                    style={{
                      fontSize: L.landscape ? 28 : 34,
                      fontWeight: 800,
                      color: isActive ? "#FFFFFF" : isPassed ? "#E2E8F0" : "#8A99AD",
                      letterSpacing: -0.3,
                    }}
                  >
                    {stepText}
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 28,
                    fontWeight: 800,
                    color: isActive ? accent : isPassed ? "#27C93F" : "#4A5568",
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: isActive
                      ? `${accent}22`
                      : isPassed
                      ? "#27C93F22"
                      : "rgba(255,255,255,0.05)",
                  }}
                >
                  {isActive ? "IN PROGRESS" : isPassed ? "COMPLETE" : "WAITING"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
