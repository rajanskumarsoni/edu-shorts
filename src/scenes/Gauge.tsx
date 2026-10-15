import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { FONT, resolveSceneTag } from "../theme";
import { MotionGraphic } from "../MotionGraphic";
import { ThreeDTelemetryGauge } from "./ThreeDTelemetryGauge";

export const Gauge: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  // Delegate to 3D WebGL Speedometer Gauge scene
  const is3DGauge =
    scene.variant === "upi_gauge_3d" ||
    scene.variant === "telemetry_gauge_3d" ||
    scene.variant === "gauge_3d" ||
    /latency|clearing speed|speedometer/i.test(scene.title || "") ||
    /clearing speed|sub-2s/i.test(scene.tag || "") ||
    typeof scene.value === "number";

  if (is3DGauge) {
    return <ThreeDTelemetryGauge scene={scene} accent={accent} />;
  }

  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();

  // Numerical parameters for gauge animation
  const startNum =
    typeof scene.startValue === "number"
      ? scene.startValue
      : typeof scene.value === "number"
      ? 0
      : 0;

  const endNum =
    typeof scene.endValue === "number"
      ? scene.endValue
      : typeof scene.value === "number"
      ? scene.value
      : parseFloat(String(scene.value ?? "100").replace(/[^0-9.]/g, "")) || 100;

  const unit = scene.unit ?? (typeof scene.value === "string" ? scene.value.replace(/[0-9.]/g, "") : "ms");
  const min = scene.min ?? Math.min(startNum, endNum);
  const max = scene.max ?? Math.max(startNum, endNum, 1);
  const status = scene.status ?? scene.label ?? "SYSTEM METRIC";

  // Roll-up or roll-down interpolation
  const animProgress = interpolate(frame, [10, durationInFrames * 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const currentVal = startNum + (endNum - startNum) * animProgress;
  const normalizedFrac = Math.min(
    1,
    Math.max(0, (currentVal - min) / Math.max(1, max - min))
  );

  // SVG Gauge calculations (240 degree arc)
  const size = L.landscape ? 340 : 420;
  const strokeWidth = 26;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcFrac = 0.75; // 270 degree arc
  const totalLength = circumference * arcFrac;
  const dashOffset = totalLength * (1 - normalizedFrac);

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
        <div style={{ marginBottom: 32, textAlign: "center", width: "100%" }}>
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
            {resolveSceneTag(scene, "// TELEMETRY MONITOR")}
          </div>
          <RevealText
            text={scene.title}
            align="center"
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

      {/* Circular Gauge Centerpiece */}
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <svg
          width={size}
          height={size}
          style={{ transform: "rotate(135deg)", overflow: "visible" }}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.10)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${totalLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Animated Active Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={accent}
            strokeWidth={strokeWidth}
            strokeDasharray={`${totalLength} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 16px ${accent})`,
              transition: "stroke-dashoffset 0.1s linear",
            }}
          />
        </svg>

        {/* Center Digital Telemetry Readout */}
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <MotionGraphic
            icon={scene.icon}
            text={status}
            accent={accent}
            size="sm"
            showPedestal={false}
            showRadar={false}
          />

          {/* Numeric Value */}
          <div
            style={{
              fontSize: L.landscape ? 80 : 96,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1,
              letterSpacing: -2,
              fontVariantNumeric: "tabular-nums",
              textShadow: `0 0 40px ${accent}66`,
            }}
          >
            {endNum % 1 === 0 ? Math.round(currentVal) : currentVal.toFixed(1)}
          </div>

          {/* Unit Indicator */}
          {unit && (
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 32,
                fontWeight: 800,
                color: accent,
                letterSpacing: 2,
                marginTop: 8,
                textTransform: "uppercase",
              }}
            >
              {unit}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Pill Badge */}
      <div
        style={{
          marginTop: 28,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 28px",
          borderRadius: 40,
          background: "rgba(14, 20, 36, 0.90)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${accent}55`,
          boxShadow: `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px ${accent}22`,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 10px ${accent}`,
          }}
        />
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 28,
            fontWeight: 800,
            color: "#FFFFFF",
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          {status}
        </div>
      </div>
    </AbsoluteFill>
  );
};
