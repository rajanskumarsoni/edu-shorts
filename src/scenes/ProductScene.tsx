import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { safeFontSize, resolveSceneTag, hexAlpha, FONT, MONO } from "../theme";
import { RevealText } from "../Reveal";

interface SpecItem {
  label: string;
  value: string;
}

/**
 * ProductScene — Real-Object & Hardware Showcase Engine.
 * Adapted from OpenMontage's ProductReveal for edu-shorts.
 *
 * Implements Golden Rule 12 (Strict Real-Object Visualization Policy):
 * Renders physical devices, hardware chips, cards, instruments, or gadgets
 * with a high-fidelity cutout, radial spotlight glow, 3D-like float,
 * animated spec badges, and clean editorial typography.
 */
export const ProductScene: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();
  const isVertical = !L.landscape;

  const title = scene.title || "HARDWARE SPECIFICATION";
  const tag = resolveSceneTag(scene, "01 / PHYSICAL ARCHITECTURE");
  const highlight = (scene as any).highlight || (scene as any).badge || "";
  const tagline = (scene as any).tagline || "";
  const price = (scene as any).price || "";

  // Normalize specs into [{label, value}]
  const rawSpecs = (scene as any).specs || (scene as any).metrics || [];
  const specs: SpecItem[] = Array.isArray(rawSpecs)
    ? rawSpecs.map((s: any) =>
        typeof s === "object" && s !== null
          ? { label: s.label || s.key || "Metric", value: String(s.value || "") }
          : { label: "Spec", value: String(s) }
      )
    : typeof rawSpecs === "object" && rawSpecs !== null
    ? Object.entries(rawSpecs).map(([label, value]) => ({
        label,
        value: String(value),
      }))
    : [];

  // Entrance spring for the hero product cutout
  const imgScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.8 },
  });

  const imgOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Slow 3D hover float
  const floatY = Math.sin(frame * 0.05) * 8;
  const floatRotate = Math.sin(frame * 0.03) * 1.2;

  // Breathing radial spotlight behind the object
  const glowPulse = interpolate(
    Math.sin(frame * 0.08),
    [-1, 1],
    [0.35, 0.75]
  );

  // Shimmer wipe across the card
  const shimmerProgress = interpolate(
    frame,
    [fps * 1.0, fps * 2.2],
    [-100, 300],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.ease),
    }
  );

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 40%, rgba(15,23,42,0.92) 0%, #060913 100%)`,
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: FONT,
        color: "#F8FAFC",
        overflow: "hidden",
      }}
    >
      {/* Dynamic Background Grid Pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* Header: Tracked Tag & Title */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${accent}${hexAlpha(0.35)}`,
            fontSize: safeFontSize(isVertical ? 28 : 22, L.landscape),
            fontWeight: 800,
            letterSpacing: "0.18em",
            color: accent,
            textTransform: "uppercase",
            marginBottom: isVertical ? 16 : 10,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: accent,
              boxShadow: `0 0 10px ${accent}`,
            }}
          />
          {tag}
        </div>

        <RevealText
          text={title}
          align="left"
          delay={4}
          style={{
            fontSize: safeFontSize(isVertical ? 56 : 46, L.landscape),
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        />

        {tagline && (
          <div
            style={{
              fontSize: safeFontSize(isVertical ? 32 : 24, L.landscape),
              color: "#94A3B8",
              marginTop: 8,
              maxWidth: isVertical ? "100%" : "70%",
            }}
          >
            {tagline}
          </div>
        )}
      </div>

      {/* Center Stage: Product Spotlight & Hero Cutout */}
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: isVertical ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: isVertical ? 24 : 60,
          margin: isVertical ? "16px 0" : "10px 0",
        }}
      >
        {/* Glowing Spotlight Behind Hero Object */}
        <div
          style={{
            position: "absolute",
            width: isVertical ? 420 : 540,
            height: isVertical ? 420 : 540,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accent}${hexAlpha(
              glowPulse * 0.45
            )} 0%, transparent 70%)`,
            filter: "blur(40px)",
            pointerEvents: "none",
            transform: `translateY(${floatY}px)`,
          }}
        />

        {/* Product Image / Real Object Cutout */}
        <div
          style={{
            position: "relative",
            zIndex: 5,
            transform: `scale(${imgScale}) translateY(${floatY}px) rotate(${floatRotate}deg)`,
            opacity: imgOpacity,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            maxWidth: isVertical ? "85%" : "45%",
            maxHeight: isVertical ? "45%" : "75%",
          }}
        >
          {scene.image ? (
            <Img
              src={staticFile(scene.image)}
              style={{
                maxWidth: "100%",
                maxHeight: isVertical ? 480 : 380,
                objectFit: "contain",
                filter: `drop-shadow(0 20px 40px rgba(0,0,0,0.85)) drop-shadow(0 0 30px ${accent}${hexAlpha(
                  0.3
                )})`,
              }}
            />
          ) : (
            // Elegant procedural hardware blueprint fallback if image is missing
            <div
              style={{
                width: isVertical ? 320 : 360,
                height: isVertical ? 320 : 260,
                borderRadius: 24,
                border: `2px solid ${accent}${hexAlpha(0.6)}`,
                background: "rgba(15,23,42,0.8)",
                boxShadow: `0 0 40px ${accent}${hexAlpha(0.25)}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: 24,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 54,
                  filter: `drop-shadow(0 0 16px ${accent})`,
                }}
              >
                ⚡
              </div>
              <div
                style={{
                  fontSize: safeFontSize(isVertical ? 32 : 26, L.landscape),
                  fontWeight: 800,
                  color: "#F8FAFC",
                }}
              >
                HARDWARE CORE
              </div>
              <div
                style={{
                  fontSize: safeFontSize(isVertical ? 28 : 20, L.landscape),
                  color: accent,
                  letterSpacing: "0.1em",
                }}
              >
                [REAL DEVICE SPEC]
              </div>
            </div>
          )}

          {highlight && (
            <div
              style={{
                position: "absolute",
                top: -12,
                right: -12,
                background: accent,
                color: "#0B1020",
                fontSize: safeFontSize(isVertical ? 26 : 20, L.landscape),
                fontWeight: 900,
                padding: "6px 14px",
                borderRadius: 999,
                letterSpacing: "0.08em",
                boxShadow: `0 0 20px ${accent}`,
                textTransform: "uppercase",
              }}
            >
              {highlight}
            </div>
          )}
        </div>

        {/* Specs & Metrics Cards Grid */}
        {specs.length > 0 && (
          <div
            style={{
              position: "relative",
              zIndex: 6,
              display: "flex",
              flexDirection: isVertical ? "column" : "column",
              gap: isVertical ? 12 : 14,
              width: isVertical ? "100%" : "48%",
              maxWidth: isVertical ? 720 : 540,
            }}
          >
            {specs.map((item, idx) => {
              const specSpring = spring({
                frame: frame - 12 - idx * 4,
                fps,
                config: { damping: 16, stiffness: 120 },
              });
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: isVertical ? "14px 22px" : "12px 18px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid rgba(255,255,255,0.12)`,
                    backdropFilter: "blur(12px)",
                    transform: `translateX(${interpolate(
                      specSpring,
                      [0, 1],
                      [40, 0]
                    )}px)`,
                    opacity: specSpring,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                  }}
                >
                  <span
                    style={{
                      fontSize: safeFontSize(isVertical ? 30 : 22, L.landscape),
                      color: "#94A3B8",
                      fontWeight: 600,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: safeFontSize(isVertical ? 34 : 26, L.landscape),
                      color: accent,
                      fontWeight: 800,
                      fontFamily: MONO,
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer / Metric Badge (Optional) */}
      {price && (
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 24px",
            borderRadius: 14,
            background: "rgba(255,255,255,0.06)",
            border: `1px solid ${accent}${hexAlpha(0.4)}`,
            fontSize: safeFontSize(isVertical ? 32 : 24, L.landscape),
            fontWeight: 800,
            alignSelf: "flex-start",
          }}
        >
          <span style={{ color: "#94A3B8" }}>VALUE / BENCHMARK:</span>
          <span style={{ color: accent, fontSize: "1.2em" }}>{price}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};
