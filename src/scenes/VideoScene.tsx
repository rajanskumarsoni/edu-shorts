import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { FONT, MONO } from "../theme";

// Full-bleed stock B-roll video clip with subtle dark-mode vignette, camera push, and large tracked typography
export const VideoScene: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();
  const isLandscape = L.landscape;

  const bar = spring({ frame: frame - 12, fps, config: { damping: 180, stiffness: 120 } });
  
  // Cinematic slow camera push to keep the frame breathing
  const scale = interpolate(frame, [0, Math.max(1, durationInFrames)], [1.0, 1.07], {
    extrapolateRight: "clamp",
  });

  // Scanning laser beam
  const scanY = interpolate(frame, [0, durationInFrames], [15, 85], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#060A14", overflow: "hidden" }}>
      {scene.video && (
        <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
          <OffthreadVideo
            src={staticFile(scene.video)}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </AbsoluteFill>
      )}

      {/* Futuristic scanning beam line */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `${scanY}%`,
          height: "2px",
          background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`,
          boxShadow: `0 0 16px ${accent}`,
          opacity: 0.6,
          pointerEvents: "none",
          zIndex: 15,
        }}
      />

      {/* Top right live capture telemetry pill */}
      <div
        style={{
          position: "absolute",
          top: L.padTop + 10,
          right: L.padX,
          zIndex: 25,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(8, 12, 24, 0.85)",
          border: `1.5px solid ${accent}55`,
          padding: "8px 16px",
          borderRadius: 999,
          fontFamily: MONO,
          fontSize: isLandscape ? 16 : 22,
          fontWeight: 800,
          color: "#E2E8F0",
          letterSpacing: "0.14em",
          backdropFilter: "blur(10px)",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#EF4444",
            boxShadow: "0 0 10px #EF4444",
          }}
        />
        <span>REAL HARDWARE · 4K</span>
      </div>

      {/* Dark gradient overlay so captions at bottom and titles at top remain crystal clear */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(5,8,20,0.92) 0%, rgba(5,8,20,0.2) 32%, rgba(5,8,20,0.25) 65%, rgba(5,8,20,0.95) 100%)",
          zIndex: 10,
        }}
      />

      {/* Dynamic Overlay for traffic jam detection */}
      {scene.overlay === "traffic_jam_detection" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 18,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {/* Pulsing Emergency Hazard Beacon */}
          <div
            style={{
              position: "absolute",
              top: isLandscape ? "45%" : "42%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            {/* Pulsing Red Radar Rings */}
            <div
              style={{
                position: "absolute",
                width: 260,
                height: 260,
                borderRadius: "50%",
                border: "3px dashed #EF4444",
                boxShadow: "0 0 50px rgba(239, 68, 68, 0.6)",
                transform: `scale(${1.0 + Math.sin(frame * 0.2) * 0.15})`,
                opacity: 0.8,
              }}
            />
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: "radial-gradient(circle, #EF4444 0%, #B91C1C 100%)",
                boxShadow: "0 0 35px #EF4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
              }}
            >
              ⚠️
            </div>
            <div
              style={{
                background: "rgba(15, 23, 42, 0.95)",
                border: "2px solid #EF4444",
                borderRadius: 18,
                padding: "12px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                boxShadow: "0 8px 30px rgba(0,0,0,0.8)",
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 900, color: "#EF4444" }}>
                TRAFFIC BOTTLENECK DETECTED
              </span>
              <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: "#FCA5A5" }}>
                SPEED: 4 KM/H · DELAY: +18 MINS
              </span>
            </div>
          </div>

          {/* Bottom Telemetry Bar */}
          <div
            style={{
              position: "absolute",
              bottom: isLandscape ? 40 : 210,
              left: 60,
              right: 60,
              background: "rgba(15, 23, 42, 0.95)",
              border: "2px solid #EF4444",
              borderRadius: 24,
              padding: "20px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 12px 40px rgba(239,68,68,0.4)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: MONO, fontSize: 18, color: "#EF4444", fontWeight: 800 }}>
                SUPER-TILE #402 ANOMALY DETECTED
              </span>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF" }}>
                Speed collapse across 1,840 phones ➔ Triggering Reroute
              </span>
            </div>
            <div
              style={{
                background: "rgba(239, 68, 68, 0.2)",
                border: "1.5px solid #EF4444",
                borderRadius: 14,
                padding: "10px 18px",
                fontFamily: MONO,
                fontSize: 18,
                fontWeight: 900,
                color: "#EF4444",
              }}
            >
              REROUTE ➔
            </div>
          </div>
        </div>
      )}

      {/* Cinematic inset vignette */}
      <AbsoluteFill
        style={{
          boxShadow: "inset 0 0 140px rgba(0,0,0,0.9)",
          pointerEvents: "none",
          zIndex: 11,
        }}
      />

      {scene.title && (
        <AbsoluteFill
          style={{
            justifyContent: "flex-start",
            alignItems: "flex-start",
            padding: `${L.padTop}px ${L.padX}px 0`,
            zIndex: 20,
          }}
        >
          {scene.tag && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontSize: isLandscape ? 24 : 32,
                fontWeight: 900,
                letterSpacing: "0.22em",
                color: accent,
                textTransform: "uppercase",
                marginBottom: 14,
                fontFamily: FONT,
                textShadow: `0 0 20px ${accent}88`,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: accent,
                  boxShadow: `0 0 12px ${accent}`,
                }}
              />
              {scene.tag}
            </div>
          )}
          <div
            style={{
              width: 180 * bar,
              height: 8,
              borderRadius: 4,
              background: accent,
              boxShadow: `0 0 32px ${accent}`,
              marginBottom: 20,
            }}
          />
          <RevealText
            text={scene.title}
            align="left"
            delay={6}
            style={{
              fontSize: isLandscape ? 52 : 64,
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              textShadow: "0 8px 36px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.8)",
              maxWidth: isLandscape ? "80%" : "95%",
              fontFamily: FONT,
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

