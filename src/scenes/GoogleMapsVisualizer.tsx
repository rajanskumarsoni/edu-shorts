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
import { FONT, MONO } from "../theme";

export const GoogleMapsVisualizer: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const L = useLayout();
  const isLandscape = L.landscape;

  const variant = scene.variant || "quadtree_tiles";
  const tag = scene.tag || "GOOGLE MAPS UNDER THE HOOD";
  const title = scene.title || "VISUAL EXPLAINER";

  // Timeline progress 0 to 1
  const progress = Math.min(Math.max(frame / Math.max(durationInFrames, 1), 0), 1);
  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  // -------------------------------------------------------------------------
  // 1. VARIANT: SCALE VISUALIZER (Global Telemetry & 1M QPS Ingestion)
  // -------------------------------------------------------------------------
  if (variant === "scale_visualizer") {
    const qpsCount = Math.floor(interpolate(progress, [0.05, 0.75], [120000, 1000000], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }));
    const dauCount = interpolate(progress, [0.05, 0.75], [0.1, 1.0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }).toFixed(1);

    const pulseScale = 1.0 + Math.sin(frame * 0.15) * 0.05;

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070B14",
          fontFamily: FONT,
          color: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {/* Animated Radial Space Glow */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,240,255,0.18) 0%, rgba(16,185,129,0.08) 45%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Top Tag & Title */}
        <div style={{ position: "absolute", top: 70, left: 60, right: 60 }}>
          <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: accent, letterSpacing: "0.2em" }}>
            {tag}
          </span>
          <h2 style={{ fontSize: 52, fontWeight: 900, margin: "8px 0 0 0", color: "#FFFFFF" }}>
            {title}
          </h2>
        </div>

        {/* Central Visual: Planet Earth with Swarming Active Traffic Pings */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? "50%" : "44%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 440,
            height: 440,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Earth Outer Atmosphere Ring */}
          <div
            style={{
              position: "absolute",
              width: 380,
              height: 380,
              borderRadius: "50%",
              border: `2px dashed ${accent}66`,
              transform: `scale(${pulseScale}) rotate(${frame * 0.4}deg)`,
            }}
          />

          {/* Deep Blue Planet Sphere */}
          <div
            style={{
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #1E40AF 0%, #0F172A 70%, #020617 100%)",
              boxShadow: `0 0 60px ${accent}44, inset -20px -20px 50px rgba(0,0,0,0.8)`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Continental Shapes drifting */}
            <div
              style={{
                position: "absolute",
                top: 50,
                left: -100 + (frame % 300),
                width: 180,
                height: 120,
                borderRadius: "40% 60% 70% 30%",
                background: "rgba(16, 185, 129, 0.45)",
                filter: "blur(6px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 160,
                left: 60 + ((frame * 0.8) % 300),
                width: 140,
                height: 90,
                borderRadius: "60% 40% 30% 70%",
                background: "rgba(16, 185, 129, 0.35)",
                filter: "blur(6px)",
              }}
            />

            {/* Glowing Golden City / Vehicle Dots */}
            {[...Array(16)].map((_, i) => {
              const ang = (i / 16) * Math.PI * 2 + frame * 0.02;
              const r = 40 + ((i * 19) % 100);
              const cx = 160 + Math.cos(ang) * r;
              const cy = 160 + Math.sin(ang) * r;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: cy,
                    left: cx,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: i % 2 === 0 ? "#FACC15" : accent,
                    boxShadow: `0 0 8px ${i % 2 === 0 ? "#FACC15" : accent}`,
                    opacity: 0.5 + Math.sin(frame * 0.2 + i) * 0.5,
                  }}
                />
              );
            })}
          </div>

          {/* Orbiting Satellites Beaming Data */}
          {[0, 1, 2].map((sIdx) => {
            const orbitAng = (frame * 0.035) + (sIdx * Math.PI * 2) / 3;
            const sx = 220 + Math.cos(orbitAng) * 210;
            const sy = 220 + Math.sin(orbitAng) * 130;
            return (
              <div
                key={sIdx}
                style={{
                  position: "absolute",
                  left: sx - 16,
                  top: sy - 16,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: 2, background: "#FFFFFF", boxShadow: `0 0 12px ${accent}` }} />
                {/* Ping wave */}
                <div
                  style={{
                    position: "absolute",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: `1.5px solid ${accent}`,
                    opacity: 1 - ((frame + sIdx * 10) % 20) / 20,
                    transform: `scale(${1 + ((frame + sIdx * 10) % 20) / 10})`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Two Animated Giant Metric Cards */}
        <div
          style={{
            position: "absolute",
            bottom: isLandscape ? 40 : 220,
            left: 60,
            right: 60,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
        >
          {/* Card 1: 1 Billion DAU */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.9)",
              border: `2px solid ${accent}55`,
              borderRadius: 24,
              padding: "24px 28px",
              boxShadow: "0 12px 36px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 20, color: "#94A3B8", fontWeight: 700 }}>
              DAILY ACTIVE DRIVERS
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 56, fontWeight: 900, color: "#FFFFFF" }}>{dauCount}</span>
              <span style={{ fontSize: 32, fontWeight: 900, color: accent }}>BILLION</span>
            </div>
            <span style={{ fontSize: 18, color: "#10B981", fontWeight: 700 }}>● 99% Earth Coverage</span>
          </div>

          {/* Card 2: 1,000,000 QPS */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.9)",
              border: "2px solid rgba(250, 204, 21, 0.55)",
              borderRadius: 24,
              padding: "24px 28px",
              boxShadow: "0 12px 36px rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 20, color: "#94A3B8", fontWeight: 700 }}>
              PEAK WRITE THROUGHPUT
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: "#FACC15", fontFamily: MONO }}>
                {qpsCount.toLocaleString()}
              </span>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#94A3B8" }}>/sec</span>
            </div>
            <span style={{ fontSize: 18, color: "#FACC15", fontWeight: 700 }}>⚡ Kafka ➔ Cassandra Stream</span>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------------------
  // 2. VARIANT: QUADTREE TILING (Map Tile Fracturing Animation)
  // -------------------------------------------------------------------------
  if (variant === "quadtree_tiling") {
    // Stage 1 (0 to 0.3): Single 256x256 big tile
    // Stage 2 (0.3 to 0.65): Splits into 4 quadrants
    // Stage 3 (0.65 to 1.0): Top-right quadrant splits into 4 sub-quadrants with vector roads appearing!
    const split1 = spring({ frame: Math.max(0, frame - 18), fps, config: { damping: 12, stiffness: 90 } });
    const split2 = spring({ frame: Math.max(0, frame - 45), fps, config: { damping: 12, stiffness: 90 } });

    const offset1 = interpolate(split1, [0, 1], [0, 18]);
    const offset2 = interpolate(split2, [0, 1], [0, 12]);

    return (
      <AbsoluteFill style={{ backgroundColor: "#070B14", fontFamily: FONT, color: "#FFFFFF", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ position: "absolute", top: 70, left: 60, right: 60 }}>
          <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: accent, letterSpacing: "0.2em" }}>
            {tag}
          </span>
          <h2 style={{ fontSize: 52, fontWeight: 900, margin: "8px 0 0 0", color: "#FFFFFF" }}>
            {title}
          </h2>
        </div>

        {/* Phone Storage Overflow Alert (Matches narration: "70 Petabytes map cannot fit in phone!") */}
        {frame < 50 && (
          <div
            style={{
              position: "absolute",
              top: 175,
              left: 60,
              right: 60,
              background: "linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)",
              border: "2px solid #F87171",
              borderRadius: 20,
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              boxShadow: "0 0 35px rgba(239,68,68,0.7)",
              zIndex: 30,
              opacity: interpolate(frame, [40, 50], [1, 0], { extrapolateRight: "clamp" }),
            }}
          >
            <span style={{ fontSize: 36 }}>⚠️</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 900, color: "#FFFFFF" }}>
                PHONE STORAGE FULL (64 GB)
              </span>
              <span style={{ fontSize: 18, color: "#FEE2E2", fontWeight: 700 }}>
                Cannot download 70 Petabytes of raw map data!
              </span>
            </div>
          </div>
        )}

        {/* Central Stage: The 256x256 Tile Mosaic */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? "52%" : "44%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 480,
            height: 480,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: offset1,
          }}
        >
          {/* Tile 00: Top-Left (Continents) */}
          <div
            style={{
              background: "#0D172E",
              border: `2px solid ${accent}88`,
              borderRadius: 18,
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            }}
          >
            <span style={{ position: "absolute", top: 12, left: 16, fontFamily: MONO, fontSize: 18, color: accent, fontWeight: 800 }}>
              TILE (0,0)
            </span>
            <div style={{ position: "absolute", bottom: 20, right: 20, width: 80, height: 60, borderRadius: "50%", background: "rgba(16,185,129,0.3)" }} />
          </div>

          {/* Tile 01: Top-Right (Recursively Subdivided into 4 Sub-Tiles!) */}
          <div
            style={{
              background: "#0F1E3A",
              border: `2px solid ${split2 > 0.1 ? "#FACC15" : accent}`,
              borderRadius: 18,
              position: "relative",
              padding: 8,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
              gap: offset2,
              boxShadow: split2 > 0.5 ? "0 0 30px rgba(250,204,21,0.3)" : "none",
            }}
          >
            {[
              { id: "01-A", color: "#10B981" },
              { id: "01-B", color: "#00F0FF" },
              { id: "01-C", color: "#F59E0B" },
              { id: "01-D", color: "#EC4899" },
            ].map((sub) => (
              <div
                key={sub.id}
                style={{
                  background: "rgba(15, 23, 42, 0.95)",
                  border: `1.5px solid ${sub.color}aa`,
                  borderRadius: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Render miniature vector road lines */}
                {split2 > 0.6 && (
                  <>
                    <div style={{ position: "absolute", width: "100%", height: 4, background: sub.color, transform: "rotate(35deg)" }} />
                    <div style={{ position: "absolute", width: 4, height: "100%", background: "rgba(255,255,255,0.4)" }} />
                  </>
                )}
                <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 900, color: "#FFFFFF", zIndex: 2 }}>
                  {sub.id}
                </span>
              </div>
            ))}
          </div>

          {/* Tile 10: Bottom-Left */}
          <div
            style={{
              background: "#0D172E",
              border: `2px solid ${accent}88`,
              borderRadius: 18,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span style={{ position: "absolute", top: 12, left: 16, fontFamily: MONO, fontSize: 18, color: accent, fontWeight: 800 }}>
              TILE (1,0)
            </span>
            <div style={{ position: "absolute", top: 30, left: 40, width: 70, height: 70, borderRadius: "50%", background: "rgba(16,185,129,0.3)" }} />
          </div>

          {/* Tile 11: Bottom-Right */}
          <div
            style={{
              background: "#0D172E",
              border: `2px solid ${accent}88`,
              borderRadius: 18,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span style={{ position: "absolute", top: 12, left: 16, fontFamily: MONO, fontSize: 18, color: accent, fontWeight: 800 }}>
              TILE (1,1)
            </span>
            <div style={{ position: "absolute", top: 20, right: 30, width: 90, height: 50, borderRadius: "40%", background: "rgba(16,185,129,0.25)" }} />
          </div>
        </div>

        {/* Animated Banner at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: isLandscape ? 40 : 210,
            left: 60,
            right: 60,
            background: "rgba(15, 23, 42, 0.95)",
            border: `2px solid ${accent}`,
            borderRadius: 24,
            padding: "24px 32px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            boxShadow: "0 12px 32px rgba(0,0,0,0.7)",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              color: "#000",
              fontWeight: 900,
            }}
          >
            4ˣ
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF" }}>
              QUADTREE VECTOR MOSAIC · 21 ZOOM LEVELS
            </span>
            <span style={{ fontSize: 20, color: "#94A3B8", fontWeight: 700 }}>
              Phone GPU renders roads dynamically · Only downloads the visible 4 tiles!
            </span>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------------------
  // 3. VARIANT: GEOCODING DROP (Search Bar + Bouncing 3D Pin Drop on Roof)
  // -------------------------------------------------------------------------
  if (variant === "geocoding_drop") {
    // Pin drops from y = -300 to y = 0 with a bouncy spring
    const pinDrop = spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 9, stiffness: 120 } });
    const pinY = interpolate(pinDrop, [0, 1], [-450, 0]);

    // Expanding shockwave ripple
    const rippleProgress = Math.max(0, frame - 25);
    const rippleScale = 1.0 + (rippleProgress % 40) * 0.08;
    const rippleOpacity = Math.max(0, 1.0 - (rippleProgress % 40) * 0.025);

    return (
      <AbsoluteFill style={{ backgroundColor: "#070B14", fontFamily: FONT, color: "#FFFFFF", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ position: "absolute", top: 70, left: 60, right: 60 }}>
          <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: accent, letterSpacing: "0.2em" }}>
            {tag}
          </span>
          <h2 style={{ fontSize: 52, fontWeight: 900, margin: "8px 0 0 0", color: "#FFFFFF" }}>
            {title}
          </h2>
        </div>

        {/* Realistic Google Maps Search Bar */}
        <div
          style={{
            position: "absolute",
            top: 180,
            left: 60,
            right: 60,
            background: "rgba(15, 23, 42, 0.96)",
            border: `2px solid ${accent}`,
            borderRadius: 22,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
          }}
        >
          <span style={{ fontSize: 28, color: accent }}>🔍</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#F8FAFC", fontFamily: MONO }}>
            1600 Amphitheatre Pkwy, Mountain View
          </span>
          <span style={{ fontSize: 24, color: accent, animation: "blink 1s infinite" }}>|</span>
        </div>

        {/* 3D Isometric Building / Rooftop Stage */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? "54%" : "48%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 460,
            height: 380,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Target Building (Isometric 3D Box) */}
          <div
            style={{
              position: "absolute",
              bottom: 40,
              width: 320,
              height: 180,
              background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
              border: `2px solid ${accent}66`,
              borderRadius: 20,
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {/* Target Reticle on Roof */}
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                border: "2px dashed #EF4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#EF4444" }} />
            </div>
            <span style={{ fontFamily: MONO, fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
              GOOGLE BUILDING 43
            </span>
          </div>

          {/* Expanding Radar Ripple from Pin Tip */}
          {pinDrop > 0.8 && (
            <div
              style={{
                position: "absolute",
                bottom: 80,
                width: 120,
                height: 120,
                borderRadius: "50%",
                border: `3px solid ${accent}`,
                transform: `scale(${rippleScale})`,
                opacity: rippleOpacity,
              }}
            />
          )}

          {/* The Classic Bouncing Red 3D Google Maps Pin */}
          <div
            style={{
              position: "absolute",
              bottom: 110,
              transform: `translateY(${pinY}px)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            {/* Pin Head */}
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: "50% 50% 50% 0",
                background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)",
                transform: "rotate(-45deg)",
                boxShadow: "0 10px 30px rgba(239,68,68,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Inner White Dot */}
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FFFFFF" }} />
            </div>
          </div>
        </div>

        {/* Resolved Coordinates Badge */}
        <div
          style={{
            position: "absolute",
            bottom: isLandscape ? 40 : 210,
            left: 60,
            right: 60,
            background: "rgba(15, 23, 42, 0.95)",
            border: "2px solid #10B981",
            borderRadius: 24,
            padding: "24px 30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 12px 36px rgba(0,0,0,0.7)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: MONO, fontSize: 18, color: "#10B981", fontWeight: 800 }}>
              ROOFTOP GPS RESOLVED
            </span>
            <span style={{ fontSize: 32, fontWeight: 900, color: "#FFFFFF", fontFamily: MONO }}>
              37.4224° N, 122.0842° W
            </span>
          </div>
          <div
            style={{
              background: "rgba(16, 185, 129, 0.2)",
              border: "1.5px solid #10B981",
              borderRadius: 14,
              padding: "10px 18px",
              fontFamily: MONO,
              fontSize: 20,
              fontWeight: 900,
              color: "#10B981",
            }}
          >
            ⚡ REDIS 1.2ms
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------------------
  // 4. VARIANT: GRAPH RAM CRASH (Sparks, Shake & Memory Overflow Metaphor)
  // -------------------------------------------------------------------------
  if (variant === "graph_ram_crash") {
    const isCrashing = progress > 0.35;
    const shake = isCrashing ? (Math.random() - 0.5) * 12 : 0;

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070B14",
          fontFamily: FONT,
          color: "#FFFFFF",
          overflow: "hidden",
          transform: `translate(${shake}px, ${shake * 0.7}px)`,
        }}
      >
        {/* Flashing Danger Glow */}
        {isCrashing && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle, rgba(239,68,68,0.25) 0%, transparent 70%)",
              opacity: 0.7 + Math.sin(frame * 0.4) * 0.3,
            }}
          />
        )}

        {/* Header */}
        <div style={{ position: "absolute", top: 70, left: 60, right: 60 }}>
          <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: isCrashing ? "#EF4444" : accent, letterSpacing: "0.2em" }}>
            {tag}
          </span>
          <h2 style={{ fontSize: 52, fontWeight: 900, margin: "8px 0 0 0", color: "#FFFFFF" }}>
            {title}
          </h2>
        </div>

        {/* Global Road Web Overload Animation */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? "52%" : "44%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 480,
            height: 440,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Dense chaotic road nodes */}
          {[...Array(28)].map((_, i) => {
            const x = 40 + ((i * 67) % 400);
            const y = 30 + ((i * 89) % 380);
            const activeColor = isCrashing ? "#EF4444" : accent;
            return (
              <React.Fragment key={i}>
                <div
                  style={{
                    position: "absolute",
                    left: x,
                    top: y,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: activeColor,
                    boxShadow: `0 0 10px ${activeColor}`,
                  }}
                />
                {/* Connecting lines */}
                {i > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: Math.min(x, 40 + (((i - 1) * 67) % 400)),
                      top: Math.min(y, 30 + (((i - 1) * 89) % 380)),
                      width: Math.abs(x - (40 + (((i - 1) * 67) % 400))),
                      height: 3,
                      background: isCrashing ? "rgba(239, 68, 68, 0.7)" : "rgba(0, 240, 255, 0.4)",
                      transformOrigin: "0 0",
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Central Server Smoking / Exploding */}
          {isCrashing && (
            <div
              style={{
                position: "absolute",
                background: "rgba(15, 23, 42, 0.95)",
                border: "3px solid #EF4444",
                borderRadius: 24,
                padding: "24px 36px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 0 60px rgba(239,68,68,0.8)",
                zIndex: 20,
              }}
            >
              <span style={{ fontSize: 64 }}>💥</span>
              <span style={{ fontSize: 36, fontWeight: 900, color: "#EF4444", fontFamily: MONO, textAlign: "center" }}>
                100% RAM OVERFLOW!
              </span>
              <span style={{ fontSize: 20, color: "#CBD5E1", fontWeight: 700, textAlign: "center" }}>
                Global Dijkstra on 500M roads crashes the server
              </span>
            </div>
          )}
        </div>

        {/* Bottom Solution Strip */}
        <div
          style={{
            position: "absolute",
            bottom: isLandscape ? 40 : 210,
            left: 60,
            right: 60,
            background: isCrashing ? "rgba(239, 68, 68, 0.18)" : "rgba(15, 23, 42, 0.9)",
            border: `2px solid ${isCrashing ? "#EF4444" : accent}`,
            borderRadius: 24,
            padding: "22px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 900, color: "#FFFFFF" }}>
            {isCrashing ? "❌ CANNOT LOAD WHOLE WORLD GRAPH" : "SEARCHING BILLIONS OF ROADS..."}
          </span>
          <span style={{ fontSize: 22, fontWeight: 800, color: isCrashing ? "#EF4444" : accent, fontFamily: MONO }}>
            {isCrashing ? "O(V + E) FATAL" : "SEARCHING..."}
          </span>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------------------
  // 5. VARIANT: HIERARCHICAL HIGHWAY (3-Tier Elevated Fast-Track Metaphor)
  // -------------------------------------------------------------------------
  if (variant === "hierarchical_highway") {
    // Car moves from bottom street -> ramp -> elevated golden highway -> ramp down
    const carX = interpolate(progress, [0.05, 0.95], [-240, 240]);
    const carY = interpolate(progress, [0.05, 0.3, 0.7, 0.95], [140, -80, -80, 140]);

    return (
      <AbsoluteFill style={{ backgroundColor: "#070B14", fontFamily: FONT, color: "#FFFFFF", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ position: "absolute", top: 70, left: 60, right: 60 }}>
          <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: accent, letterSpacing: "0.2em" }}>
            {tag}
          </span>
          <h2 style={{ fontSize: 52, fontWeight: 900, margin: "8px 0 0 0", color: "#FFFFFF" }}>
            {title}
          </h2>
        </div>

        {/* 3-Tier Elevated Track Stage */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? "52%" : "44%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 480,
          }}
        >
          {/* Level 1: Elevated Golden Expressway (Top Fast Lane) */}
          <div
            style={{
              position: "absolute",
              top: 140,
              left: 0,
              right: 0,
              height: 56,
              background: "linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #F59E0B 100%)",
              borderRadius: 16,
              boxShadow: "0 0 40px rgba(245,158,11,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* White Dashed Center Line */}
            <div style={{ width: "95%", height: 4, borderTop: "3px dashed #FFFFFF" }} />
            <span
              style={{
                position: "absolute",
                top: -34,
                fontFamily: MONO,
                fontSize: 20,
                color: "#FBBF24",
                fontWeight: 900,
              }}
            >
              LEVEL 1: NATIONAL HIGHWAY (120 KM/H)
            </span>
          </div>

          {/* Ascending Light Ramp */}
          <div
            style={{
              position: "absolute",
              top: 230,
              left: 40,
              width: 140,
              height: 10,
              background: "rgba(0, 240, 255, 0.7)",
              transform: "rotate(-42deg)",
              transformOrigin: "0 0",
              boxShadow: `0 0 16px ${accent}`,
            }}
          />

          {/* Descending Light Ramp */}
          <div
            style={{
              position: "absolute",
              top: 168,
              right: 40,
              width: 140,
              height: 10,
              background: "rgba(0, 240, 255, 0.7)",
              transform: "rotate(42deg)",
              transformOrigin: "0 0",
              boxShadow: `0 0 16px ${accent}`,
            }}
          />

          {/* Level 3: Local Residential Streets (Bottom Slow Lane) */}
          <div
            style={{
              position: "absolute",
              bottom: 60,
              left: 0,
              right: 0,
              height: 48,
              background: "#1E293B",
              borderTop: "2px solid #475569",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 30px",
            }}
          >
            <span style={{ fontSize: 24 }}>🏠 Home</span>
            <span style={{ fontFamily: MONO, fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
              LEVEL 3: LOCAL STREETS (ONLY AT START & END)
            </span>
            <span style={{ fontSize: 24 }}>🏢 Office</span>
          </div>

          {/* The Cute Animated Yellow Car */}
          <div
            style={{
              position: "absolute",
              top: 240 + carY,
              left: 250 + carX - 30,
              width: 60,
              height: 34,
              borderRadius: 12,
              background: "#FACC15",
              boxShadow: "0 4px 20px rgba(250,204,21,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 30,
              transition: "transform 0.1s ease",
            }}
          >
            {/* Windshield */}
            <div style={{ width: 22, height: 18, borderRadius: 6, background: "#0F172A" }} />
            {/* Speed trails */}
            {progress > 0.3 && progress < 0.7 && (
              <div
                style={{
                  position: "absolute",
                  left: -35,
                  width: 30,
                  height: 4,
                  background: "rgba(255,255,255,0.8)",
                  boxShadow: "0 0 8px #FFF",
                }}
              />
            )}
          </div>
        </div>

        {/* Takeaway Card */}
        <div
          style={{
            position: "absolute",
            bottom: isLandscape ? 40 : 210,
            left: 60,
            right: 60,
            background: "rgba(15, 23, 42, 0.95)",
            border: "2px solid #F59E0B",
            borderRadius: 24,
            padding: "24px 32px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            boxShadow: "0 12px 36px rgba(0,0,0,0.7)",
          }}
        >
          <span style={{ fontSize: 44 }}>🚀</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF" }}>
              PRUNE 99% OF LOCAL STREETS
            </span>
            <span style={{ fontSize: 20, color: "#CBD5E1", fontWeight: 700 }}>
              Long-distance pathfinding only traverses the high-speed highway graph!
            </span>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------------------
  // 6. VARIANT: ASTAR MAZE RACE (Dijkstra Radial Flood vs A* Focused Laser)
  // -------------------------------------------------------------------------
  if (variant === "astar_maze_race") {
    const astarLaserWidth = interpolate(progress, [0.1, 0.85], [0, 360], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    const dijkstraRadius = interpolate(progress, [0.1, 0.85], [10, 160], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return (
      <AbsoluteFill style={{ backgroundColor: "#070B14", fontFamily: FONT, color: "#FFFFFF", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ position: "absolute", top: 70, left: 60, right: 60 }}>
          <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: accent, letterSpacing: "0.2em" }}>
            {tag}
          </span>
          <h2 style={{ fontSize: 52, fontWeight: 900, margin: "8px 0 0 0", color: "#FFFFFF" }}>
            {title}
          </h2>
        </div>

        {/* Split Maze Comparison Stage */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? "52%" : "44%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 480,
            height: 480,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Top Panel: Standard Dijkstra (Blind 360° Spill) */}
          <div
            style={{
              flex: 1,
              background: "rgba(15, 23, 42, 0.9)",
              border: "2px solid #EF4444",
              borderRadius: 22,
              padding: 20,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 900, color: "#EF4444" }}>
                DIJKSTRA (BLIND FLOOD)
              </span>
              <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 900, color: "#EF4444" }}>
                2,450 ms (SLOW)
              </span>
            </div>

            {/* Start & Goal */}
            <div style={{ position: "absolute", left: 60, top: 90, fontSize: 24 }}>🟢 Start</div>
            <div style={{ position: "absolute", right: 60, top: 90, fontSize: 24 }}>🏁 Goal</div>

            {/* Expanding blind orange circular puddle */}
            <div
              style={{
                position: "absolute",
                left: 75,
                top: 105,
                width: dijkstraRadius * 2,
                height: dijkstraRadius * 1.2,
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.25)",
                border: "2px dashed #EF4444",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>

          {/* Bottom Panel: Hierarchical A* (Focused Forward Laser Beam) */}
          <div
            style={{
              flex: 1,
              background: "rgba(15, 23, 42, 0.9)",
              border: `2px solid ${accent}`,
              borderRadius: 22,
              padding: 20,
              position: "relative",
              overflow: "hidden",
              boxShadow: `0 0 30px ${accent}44`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 900, color: accent }}>
                HIERARCHICAL A* (COMPASS BEAM)
              </span>
              <span style={{ fontFamily: MONO, fontSize: 22, fontWeight: 900, color: "#10B981" }}>
                38 ms (WINNER 🏆)
              </span>
            </div>

            {/* Start & Goal */}
            <div style={{ position: "absolute", left: 60, top: 90, fontSize: 24 }}>🟢 Start</div>
            <div style={{ position: "absolute", right: 60, top: 90, fontSize: 24 }}>🏁 Goal</div>

            {/* Laser Line directly shooting from Start to Goal */}
            <div
              style={{
                position: "absolute",
                left: 80,
                top: 105,
                width: astarLaserWidth,
                height: 8,
                borderRadius: 4,
                background: `linear-gradient(90deg, #10B981 0%, ${accent} 100%)`,
                boxShadow: `0 0 18px ${accent}`,
              }}
            />
          </div>
        </div>

        {/* Bottom Formula Banner */}
        <div
          style={{
            position: "absolute",
            bottom: isLandscape ? 40 : 210,
            left: 60,
            right: 60,
            background: "rgba(15, 23, 42, 0.95)",
            border: `2px solid ${accent}`,
            borderRadius: 24,
            padding: "22px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 900, color: accent }}>
            f(n) = g(n) + h(n)
          </span>
          <span style={{ fontSize: 20, color: "#FFFFFF", fontWeight: 700 }}>
            Uses Euclidean distance heuristic to search ONLY towards the goal!
          </span>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------------------
  // 7. VARIANT: TRAFFIC HEATMAP SHIFT (Road Changing Green -> Orange -> Red)
  // -------------------------------------------------------------------------
  if (variant === "traffic_heatmap_shift") {
    // 0.0 - 0.35: Green (60 km/h)
    // 0.35 - 0.70: Orange (30 km/h)
    // 0.70 - 1.00: Red (8 km/h)
    let roadColor = "#10B981";
    let speedLabel = "60 km/h (Normal Flow)";
    let etaLabel = "18 MIN";
    let statusText = "SMOOTH HIGHWAY TRAVEL";

    if (progress > 0.35 && progress <= 0.7) {
      roadColor = "#F59E0B";
      speedLabel = "30 km/h (Slowing Flow)";
      etaLabel = "26 MIN";
      statusText = "HEAVIER VEHICLE CONGESTION";
    } else if (progress > 0.7) {
      roadColor = "#EF4444";
      speedLabel = "8 km/h (Bumper to Bumper)";
      etaLabel = "34 MIN";
      statusText = "🚨 TRAFFIC JAM DETECTED";
    }

    return (
      <AbsoluteFill style={{ backgroundColor: "#070B14", fontFamily: FONT, color: "#FFFFFF", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ position: "absolute", top: 70, left: 60, right: 60 }}>
          <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: roadColor, letterSpacing: "0.2em" }}>
            {tag}
          </span>
          <h2 style={{ fontSize: 52, fontWeight: 900, margin: "8px 0 0 0", color: "#FFFFFF" }}>
            {title}
          </h2>
        </div>

        {/* Live Traffic Road Stage */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? "52%" : "44%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 480,
            height: 440,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          {/* Animated 3-Lane Road */}
          <div
            style={{
              width: "100%",
              height: 220,
              background: "#0F172A",
              border: `4px solid ${roadColor}`,
              borderRadius: 24,
              boxShadow: `0 0 40px ${roadColor}66`,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
              padding: "16px 0",
            }}
          >
            {/* Lane Dividers */}
            <div style={{ width: "100%", height: 3, borderTop: "3px dashed rgba(255,255,255,0.4)" }} />
            <div style={{ width: "100%", height: 3, borderTop: "3px dashed rgba(255,255,255,0.4)" }} />

            {/* Animated Cars */}
            {[
              { lane: 30, x: ((frame * 6) % 520) - 60, color: "#38BDF8" },
              { lane: 90, x: ((frame * 4.5 + 120) % 520) - 60, color: "#FACC15" },
              { lane: 150, x: ((frame * 3 + 240) % 520) - 60, color: "#FFFFFF" },
              { lane: 90, x: ((frame * 4.5 + 280) % 520) - 60, color: "#EC4899" },
            ].map((car, idx) => (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  top: car.lane,
                  left: progress > 0.7 ? Math.min(car.x, 260) : car.x,
                  width: 52,
                  height: 28,
                  borderRadius: 8,
                  background: car.color,
                  boxShadow: `0 2px 10px ${car.color}aa`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 4,
                }}
              >
                {/* Red Brake Light when Jammed */}
                {progress > 0.7 && (
                  <div style={{ width: 6, height: 16, borderRadius: 2, background: "#EF4444", boxShadow: "0 0 8px #EF4444" }} />
                )}
              </div>
            ))}
          </div>

          {/* Dynamic ETA Pill Gauge */}
          <div
            style={{
              width: "100%",
              background: "rgba(15, 23, 42, 0.95)",
              border: `2px solid ${roadColor}`,
              borderRadius: 22,
              padding: "20px 28px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: MONO, fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
                {statusText}
              </span>
              <span style={{ fontSize: 26, fontWeight: 900, color: "#FFFFFF" }}>
                {speedLabel}
              </span>
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 44,
                fontWeight: 900,
                color: roadColor,
                textShadow: `0 0 20px ${roadColor}`,
              }}
            >
              {etaLabel}
            </div>
          </div>
        </div>

        {/* Machine Learning Subtitle */}
        <div
          style={{
            position: "absolute",
            bottom: isLandscape ? 40 : 210,
            left: 60,
            right: 60,
            background: "rgba(15, 23, 42, 0.95)",
            border: `2px solid ${roadColor}`,
            borderRadius: 24,
            padding: "22px 30px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 36 }}>🧠</span>
          <span style={{ fontSize: 20, color: "#E2E8F0", fontWeight: 700 }}>
            Google AI neural net merges historical traffic with live car speeds to predict exact travel time!
          </span>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------------------
  // 8. VARIANT: DYNAMIC REROUTE DETOUR (Accident Blockage & Green Bridge Detour)
  // -------------------------------------------------------------------------
  if (variant === "dynamic_reroute_detour") {
    // Car moves down highway, steers right onto the green bypass bridge!
    const carX = interpolate(progress, [0.1, 0.45, 0.85], [-180, 20, 220]);
    const carY = interpolate(progress, [0.1, 0.45, 0.85], [0, 0, 110]);

    const bannerDrop = spring({ frame: Math.max(0, frame - 18), fps, config: { damping: 10, stiffness: 100 } });
    const bannerY = interpolate(bannerDrop, [0, 1], [-120, 0]);

    return (
      <AbsoluteFill style={{ backgroundColor: "#070B14", fontFamily: FONT, color: "#FFFFFF", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ position: "absolute", top: 70, left: 60, right: 60 }}>
          <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: "#10B981", letterSpacing: "0.2em" }}>
            {tag}
          </span>
          <h2 style={{ fontSize: 52, fontWeight: 900, margin: "8px 0 0 0", color: "#FFFFFF" }}>
            {title}
          </h2>
        </div>

        {/* Proactive Push Alert Banner (Simulating WebSocket notification on phone) */}
        <div
          style={{
            position: "absolute",
            top: 175,
            left: 60,
            right: 60,
            transform: `translateY(${bannerY}px)`,
            background: "linear-gradient(135deg, #065F46 0%, #047857 100%)",
            border: "2px solid #34D399",
            borderRadius: 22,
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 10px 30px rgba(16,185,129,0.5)",
            zIndex: 40,
          }}
        >
          <span style={{ fontSize: 36 }}>⚡</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#FFFFFF" }}>
              FASTER ROUTE FOUND · SAVE 8 MINUTES
            </span>
            <span style={{ fontSize: 18, color: "#A7F3D0", fontWeight: 700 }}>
              WebSocket push received · Avoiding accident on Highway 101
            </span>
          </div>
        </div>

        {/* Road Map with Blockage & Green Bridge Detour */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? "54%" : "48%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 400,
          }}
        >
          {/* Main Straight Highway (Blocked by Accident in red) */}
          <div
            style={{
              position: "absolute",
              top: 130,
              left: 0,
              width: 320,
              height: 48,
              background: "#1E293B",
              borderTop: "3px solid #64748B",
              borderBottom: "3px solid #64748B",
            }}
          />

          {/* Blocked Section (Crimson Red with Hazard Warning) */}
          <div
            style={{
              position: "absolute",
              top: 130,
              right: 0,
              width: 180,
              height: 48,
              background: "rgba(239, 68, 68, 0.4)",
              border: "2px solid #EF4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 0 20px rgba(239,68,68,0.6)",
            }}
          >
            <span style={{ fontSize: 24 }}>🚨</span>
            <span style={{ fontFamily: MONO, fontSize: 16, color: "#EF4444", fontWeight: 900 }}>
              ACCIDENT AHEAD
            </span>
          </div>

          {/* Alternate Emerald Green Bypass Detour Bridge */}
          <div
            style={{
              position: "absolute",
              top: 154,
              left: 200,
              width: 280,
              height: 120,
              borderRadius: "0 0 40px 0",
              borderRight: "8px solid #10B981",
              borderBottom: "8px solid #10B981",
              boxShadow: "0 0 30px rgba(16,185,129,0.7)",
            }}
          />

          {/* The Cute Blue Navigation Car steering into the detour */}
          <div
            style={{
              position: "absolute",
              top: 136 + carY,
              left: 250 + carX - 30,
              width: 56,
              height: 32,
              borderRadius: 10,
              background: "#38BDF8",
              boxShadow: "0 0 20px #38BDF8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 30,
            }}
          >
            <div style={{ width: 18, height: 16, borderRadius: 4, background: "#0F172A" }} />
          </div>
        </div>

        {/* Takeaway Strip */}
        <div
          style={{
            position: "absolute",
            bottom: isLandscape ? 40 : 210,
            left: 60,
            right: 60,
            background: "rgba(15, 23, 42, 0.95)",
            border: "2px solid #10B981",
            borderRadius: 24,
            padding: "24px 30px",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <span style={{ fontSize: 40 }}>💡</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#FFFFFF" }}>
              QUADTREE SUPER-TILES MATCHING
            </span>
            <span style={{ fontSize: 19, color: "#94A3B8", fontWeight: 700 }}>
              The server knows which drivers are headed toward the accident tile and pushes instant reroutes!
            </span>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------------------
  // 9. VARIANT: GPS KAFKA INGESTION (Phone Batching 15s -> Kafka -> Cassandra)
  // -------------------------------------------------------------------------
  if (variant === "gps_kafka_ingestion") {
    // 15-second batching cycle simulation
    const cycle = (frame % 45) / 45; // 1.5s per cycle in video
    const timerSeconds = Math.max(0, Math.floor(15 - cycle * 15));
    const packetY = interpolate(cycle, [0.4, 0.95], [160, -120], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const packetOpacity = interpolate(cycle, [0.35, 0.45, 0.85, 0.98], [0, 1, 1, 0]);

    return (
      <AbsoluteFill style={{ backgroundColor: "#070B14", fontFamily: FONT, color: "#FFFFFF", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ position: "absolute", top: 70, left: 60, right: 60 }}>
          <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: accent, letterSpacing: "0.2em" }}>
            {tag}
          </span>
          <h2 style={{ fontSize: 52, fontWeight: 900, margin: "8px 0 0 0", color: "#FFFFFF" }}>
            {title}
          </h2>
        </div>

        {/* Central Stage: Phone Batching + Kafka Queues + Cassandra Clusters */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? "52%" : "44%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 490,
            height: 480,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Top: Apache Kafka & Cassandra Cluster Nodes */}
          <div
            style={{
              width: "100%",
              background: "rgba(15, 23, 42, 0.95)",
              border: `2px solid ${accent}`,
              borderRadius: 20,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: `0 8px 32px ${accent}33`,
            }}
          >
            {/* Kafka Partition Pipes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 24 }}>⚡</span>
                <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 900, color: accent }}>
                  APACHE KAFKA QUEUE
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["P0", "P1", "P2", "P3"].map((p, i) => (
                  <div
                    key={p}
                    style={{
                      padding: "6px 12px",
                      background: "rgba(0, 240, 255, 0.15)",
                      border: `1.5px solid ${accent}88`,
                      borderRadius: 8,
                      fontFamily: MONO,
                      fontSize: 14,
                      fontWeight: 800,
                      color: accent,
                      boxShadow: cycle > 0.7 && i === 1 ? `0 0 12px ${accent}` : "none",
                    }}
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>

            {/* Cassandra Store */}
            <div
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                border: "1.5px solid #10B981",
                borderRadius: 14,
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 13, color: "#10B981", fontWeight: 800 }}>
                CASSANDRA NoSQL
              </span>
              <span style={{ fontFamily: MONO, fontSize: 18, color: "#FFFFFF", fontWeight: 900 }}>
                1,000,000 W/s
              </span>
            </div>
          </div>

          {/* Flying GPS Packet Data Capsule */}
          <div
            style={{
              position: "absolute",
              top: 220 + packetY,
              opacity: packetOpacity,
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              border: "2px solid #FCD34D",
              borderRadius: 14,
              padding: "8px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 0 24px rgba(245,158,11,0.8)",
              zIndex: 30,
            }}
          >
            <span style={{ fontSize: 18 }}>📍</span>
            <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 900, color: "#000000" }}>
              {"BATCH: [{lat: 28.61, lon: 77.20, speed: 45km/h}]"}
            </span>
          </div>

          {/* Bottom: Smartphone on Dashboard with 15s Battery-Saving Timer */}
          <div
            style={{
              width: "100%",
              background: "linear-gradient(180deg, #1E293B 0%, #0F172A 100%)",
              border: "2px solid #475569",
              borderRadius: 24,
              padding: "18px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 12px 36px rgba(0,0,0,0.8)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Animated Smartphone Icon */}
              <div
                style={{
                  width: 50,
                  height: 80,
                  borderRadius: 12,
                  border: `2px solid ${accent}`,
                  background: "#0A0F1D",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 4,
                  boxShadow: `0 0 16px ${accent}55`,
                }}
              >
                <div style={{ width: 14, height: 3, borderRadius: 2, background: accent }} />
                <div style={{ fontSize: 18 }}>🚗</div>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#475569" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF" }}>
                  SMARTPHONE GPS
                </span>
                <span style={{ fontSize: 16, color: "#94A3B8", fontWeight: 700 }}>
                  Batches location every 15s to save battery
                </span>
              </div>
            </div>

            {/* Circular Countdown Timer */}
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                background: "rgba(0, 240, 255, 0.15)",
                border: `3px solid ${timerSeconds < 5 ? "#EF4444" : accent}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 20px ${timerSeconds < 5 ? "rgba(239,68,68,0.5)" : "rgba(0,240,255,0.4)"}`,
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 900, color: "#FFFFFF" }}>
                {timerSeconds}s
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 800, color: accent }}>
                BATCH
              </span>
            </div>
          </div>
        </div>

        {/* Takeaway Strip */}
        <div
          style={{
            position: "absolute",
            bottom: isLandscape ? 40 : 210,
            left: 60,
            right: 60,
            background: "rgba(15, 23, 42, 0.95)",
            border: `2px solid ${accent}`,
            borderRadius: 24,
            padding: "22px 30px",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <span style={{ fontSize: 36 }}>🛰️</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#FFFFFF" }}>
              CROWDSOURCED SPEED SENSING
            </span>
            <span style={{ fontSize: 19, color: "#94A3B8", fontWeight: 700 }}>
              Phones send 15s GPS batches · Kafka queues distribute · Cassandra writes 1,000,000 QPS!
            </span>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------------------
  // 10. VARIANT: MASTER ECOSYSTEM LOOP (All 4 Core Pillars in Harmony)
  // -------------------------------------------------------------------------
  if (variant === "master_ecosystem_loop") {
    const carProgress = interpolate(progress, [0.1, 0.9], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const carX = interpolate(carProgress, [0, 1], [-180, 180]);

    return (
      <AbsoluteFill style={{ backgroundColor: "#070B14", fontFamily: FONT, color: "#FFFFFF", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ position: "absolute", top: 70, left: 60, right: 60 }}>
          <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: "#10B981", letterSpacing: "0.2em" }}>
            {tag}
          </span>
          <h2 style={{ fontSize: 52, fontWeight: 900, margin: "8px 0 0 0", color: "#FFFFFF" }}>
            {title}
          </h2>
        </div>

        {/* 4 Architectural Pillars Grid */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? "46%" : "38%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 490,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {[
            { id: "1", title: "VECTOR TILES", sub: "256x256 GPU · 60 FPS", color: "#00F0FF", icon: "🗺️" },
            { id: "2", title: "HIERARCHICAL A*", sub: "38ms Sub-Second", color: "#F59E0B", icon: "⚡" },
            { id: "3", title: "CASSANDRA STORE", sub: "1M Write QPS", color: "#10B981", icon: "💾" },
            { id: "4", title: "WEBSOCKETS PUSH", sub: "Live Reroute Push", color: "#EC4899", icon: "🔄" },
          ].map((item) => (
            <div
              key={item.id}
              style={{
                background: "rgba(15, 23, 42, 0.95)",
                border: `2px solid ${item.color}88`,
                borderRadius: 18,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                boxShadow: `0 8px 24px rgba(0,0,0,0.6)`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 900, color: item.color }}>
                  {item.title}
                </span>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 14, color: "#E2E8F0", fontWeight: 700 }}>
                {item.sub}
              </span>
            </div>
          ))}
        </div>

        {/* Golden Expressway with Car arriving at Destination On-Time */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? "72%" : "60%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 490,
            height: 100,
            background: "linear-gradient(90deg, #1E293B 0%, #0F172A 100%)",
            border: "2px solid #10B981",
            borderRadius: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            boxShadow: "0 0 40px rgba(16,185,129,0.4)",
          }}
        >
          {/* Start Icon */}
          <div style={{ fontSize: 28, zIndex: 5 }}>🟢</div>

          {/* Green Dashed Line */}
          <div
            style={{
              position: "absolute",
              left: 60,
              right: 60,
              height: 4,
              borderTop: "3px dashed #10B981",
              zIndex: 2,
            }}
          />

          {/* Navigating Yellow Car */}
          <div
            style={{
              position: "absolute",
              left: 245 + carX - 25,
              width: 50,
              height: 30,
              borderRadius: 8,
              background: "#FBBF24",
              boxShadow: "0 0 20px #FBBF24",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <div style={{ width: 14, height: 14, borderRadius: 3, background: "#0F172A" }} />
          </div>

          {/* Destination Checkered Flag */}
          <div style={{ fontSize: 32, zIndex: 5 }}>🏁</div>
        </div>

        {/* On-Time Arrival Banner */}
        <div
          style={{
            position: "absolute",
            bottom: isLandscape ? 40 : 210,
            left: 60,
            right: 60,
            background: "linear-gradient(135deg, #065F46 0%, #047857 100%)",
            border: "2px solid #34D399",
            borderRadius: 24,
            padding: "22px 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 12px 36px rgba(16,185,129,0.5)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: MONO, fontSize: 18, color: "#A7F3D0", fontWeight: 800 }}>
              MISSION ACCOMPLISHED
            </span>
            <span style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF" }}>
              Arrived On Time · Zero Traffic Delays
            </span>
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: 14,
              padding: "10px 18px",
              fontFamily: MONO,
              fontSize: 22,
              fontWeight: 900,
              color: "#FFFFFF",
            }}
          >
            ✓ ETA MET
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------------------
  // 11. VARIANT: MAPS SYSTEM OUTRO (Lesson Summary + Rajan का ADDA Subscription)
  // -------------------------------------------------------------------------
  if (variant === "maps_system_outro") {
    const bellRing = Math.sin(frame * 0.4) * 15;
    const pulseButton = 1.0 + Math.sin(frame * 0.15) * 0.04;

    return (
      <AbsoluteFill style={{ backgroundColor: "#070B14", fontFamily: FONT, color: "#FFFFFF", overflow: "hidden" }}>
        {/* Glowing Background Radial Ring */}
        <div
          style={{
            position: "absolute",
            top: "38%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 650,
            height: 650,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,240,255,0.2) 0%, rgba(245,158,11,0.08) 50%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        {/* Top Tag & Title */}
        <div style={{ position: "absolute", top: 70, left: 60, right: 60, textAlign: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800, color: accent, letterSpacing: "0.2em" }}>
            {tag}
          </span>
          <h2 style={{ fontSize: 48, fontWeight: 900, margin: "8px 0 0 0", color: "#FFFFFF" }}>
            {title}
          </h2>
        </div>

        {/* Central Core: Glowing 3D Google Maps Pin & 3 Engineering Pillars */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? "50%" : "42%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 480,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Big Glowing Red Pin */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50% 50% 50% 0",
              background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)",
              transform: "rotate(-45deg)",
              boxShadow: "0 0 40px rgba(239,68,68,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FFFFFF" }} />
          </div>

          {/* 3 Pillar Badges */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            {[
              "1. Quadtree Vector Tiles (256x256 GPU)",
              "2. Hierarchical A* Routing (<200ms)",
              "3. Kafka & Cassandra Telemetry (1M QPS)",
            ].map((text, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(15, 23, 42, 0.9)",
                  border: `1.5px solid ${accent}66`,
                  borderRadius: 14,
                  padding: "12px 20px",
                  fontFamily: MONO,
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#E2E8F0",
                  textAlign: "center",
                }}
              >
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Rajan का ADDA Subscription Beacon */}
        <div
          style={{
            position: "absolute",
            bottom: isLandscape ? 40 : 210,
            left: 60,
            right: 60,
            background: "linear-gradient(180deg, #1E293B 0%, #0F172A 100%)",
            border: `2px solid ${accent}`,
            borderRadius: 24,
            padding: "24px 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: `0 12px 40px rgba(0, 240, 255, 0.35)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span
              style={{
                fontSize: 44,
                display: "inline-block",
                transform: `rotate(${bellRing}deg)`,
                transformOrigin: "top center",
              }}
            >
              🔔
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF" }}>
                Rajan का ADDA
              </span>
              <span style={{ fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
                SUBSCRIBE FOR DEEP SYSTEM DESIGN
              </span>
            </div>
          </div>

          <div
            style={{
              background: "#EF4444",
              borderRadius: 14,
              padding: "14px 24px",
              fontFamily: FONT,
              fontSize: 22,
              fontWeight: 900,
              color: "#FFFFFF",
              transform: `scale(${pulseButton})`,
              boxShadow: "0 0 20px rgba(239,68,68,0.7)",
            }}
          >
            SUBSCRIBE
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // Fallback default
  return (
    <AbsoluteFill style={{ backgroundColor: "#070B14", color: "#FFFFFF" }}>
      <h2>{title}</h2>
    </AbsoluteFill>
  );
};
