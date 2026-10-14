import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { InspectorSection, SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { FONT, resolveSceneTag } from "../theme";
import { MotionGraphic } from "../MotionGraphic";
import { ThreeDQRCodeInspection } from "./ThreeDQRCodeInspection";

export const Inspector: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();

  // If QR code inspection scene, delegate to 3D WebGL scene
  const is3DQR =
    scene.variant === "upi_qr_3d" ||
    scene.variant === "qr_inspection_3d" ||
    /qr code|qr matrix|vpa/i.test(scene.title || "") ||
    /qr|address resolution/i.test(scene.tag || "");

  if (is3DQR) {
    return <ThreeDQRCodeInspection scene={scene} accent={accent} />;
  }

  const sections: InspectorSection[] = scene.sections ?? [
    {
      name: "HEADER",
      desc: "Algorithm (HS256) & Token Type (JWT)",
      color: "#FF5F56",
      code: '{\n  "alg": "HS256",\n  "typ": "JWT"\n}',
    },
    {
      name: "PAYLOAD",
      desc: "Claims, User Identity & Scope",
      color: "#C678DD",
      code: '{\n  "sub": "user_42",\n  "role": "admin",\n  "exp": 1728000\n}',
    },
    {
      name: "SIGNATURE",
      desc: "HMACSHA256 Cryptographic Hash Verification",
      color: accent,
      code: "HMACSHA256(base64Url(header) + '.' + base64Url(payload), secret)",
    },
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
        <div style={{ marginBottom: 32 }}>
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
            {resolveSceneTag(scene, "// PAYLOAD INSPECTOR")}
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

      {/* Unfolded Token Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%" }}>
        {sections.map((sec, idx) => {
          const secSpring = spring({
            frame: frame - 10 - idx * 10,
            fps,
            config: { damping: 14, stiffness: 120 },
          });

          const color = sec.color ?? accent;

          return (
            <div
              key={idx}
              style={{
                padding: "20px 24px",
                borderRadius: 20,
                background: "rgba(14, 20, 36, 0.94)",
                backdropFilter: "blur(20px)",
                border: `1.5px solid ${color}66`,
                boxShadow: `0 12px 30px rgba(0,0,0,0.6), 0 0 25px ${color}22`,
                transform: `translateX(${(1 - secSpring) * 30}px)`,
                opacity: secSpring,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <MotionGraphic
                    icon={sec.icon}
                    text={sec.name}
                    accent={color}
                    size="xs"
                    showPedestal={true}
                    showRadar={false}
                  />
                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 32,
                      fontWeight: 900,
                      color: color,
                      letterSpacing: 2,
                    }}
                  >
                    {sec.name}
                  </div>
                </div>
                {sec.desc && (
                  <div
                    style={{
                      fontSize: 28,
                      color: "#CBD5E1",
                      fontWeight: 600,
                    }}
                  >
                    {sec.desc}
                  </div>
                )}
              </div>

              {sec.code && (
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#E2E8F0",
                    background: "rgba(0, 0, 0, 0.5)",
                    padding: "12px 18px",
                    borderRadius: 12,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.4,
                  }}
                >
                  {sec.code}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
