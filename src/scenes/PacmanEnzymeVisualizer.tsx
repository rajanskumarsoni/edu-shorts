import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { safeFontSize, resolveSceneTag, hexAlpha, FONT, MONO } from "../theme";
import { RevealText } from "../Reveal";

type Variant = "soil_discovery" | "microscope" | "pacman_mouth" | "antibiotic_twist" | "polymer_bonds";

export const PacmanEnzymeVisualizer: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const L = useLayout();
  const isVertical = !L.landscape;

  const variant = (scene.variant as Variant) || "pacman_mouth";
  const title = scene.title || "PAC-MAN ENZYME ACTION";
  const tag = resolveSceneTag(scene, "04 / MOLECULAR MECHANISM");

  // Primary entrance spring
  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 95 },
  });

  // Top header container (respects vertical top safe zone)
  const renderHeader = (customTitle?: string, customTag?: string) => (
    <div style={{ position: "relative", zIndex: 40, marginBottom: isVertical ? 20 : 14 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 18px",
          borderRadius: 999,
          background: "rgba(11,20,38,0.85)",
          border: `1.5px solid ${accent}${hexAlpha(0.4)}`,
          backdropFilter: "blur(14px)",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 14px ${accent}`,
          }}
        />
        <span
          style={{
            fontSize: safeFontSize(isVertical ? 24 : 18, L.landscape),
            fontWeight: 800,
            letterSpacing: "0.2em",
            color: accent,
            textTransform: "uppercase",
            fontFamily: MONO,
          }}
        >
          {customTag || tag}
        </span>
      </div>

      <RevealText
        text={customTitle || title}
        align="left"
        delay={4}
        style={{
          fontSize: safeFontSize(isVertical ? 48 : 38, L.landscape),
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
          textShadow: "0 6px 30px rgba(0,0,0,0.95)",
        }}
      />
    </div>
  );

  // ---------------------------------------------------------------------------
  // VARIANT 0: SOIL DISCOVERY - BOTANICAL GARDEN EXPERIMENT & HUMUS LAYER
  // ---------------------------------------------------------------------------
  if (variant === "soil_discovery") {
    const rootGrow = interpolate(frame, [0, 50], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
    const filmGlow = interpolate(frame % 30, [0, 15, 30], [0.85, 1.25, 0.85]);
    const swarmProg = interpolate(frame, [25, 75], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return (
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 30%, #150E07 0%, #0A0603 65%, #030201 100%)",
          padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
          color: "#FEF3C7",
          fontFamily: FONT,
          overflow: "hidden",
        }}
      >
        {renderHeader("FOREST SOIL HUMUS EXPERIMENT", "02 / BOTANICAL DISCOVERY")}

        {/* Stage Container with Paint Brush / Chalkboard Texture */}
        <div
          style={{
            position: "relative",
            flex: 1,
            borderRadius: 24,
            border: "2px solid rgba(245,158,11,0.35)",
            background: "linear-gradient(180deg, #1C130B 0%, #0D0804 50%, #050302 100%)",
            boxShadow: "inset 0 0 70px rgba(0,0,0,0.9), 0 16px 40px rgba(0,0,0,0.7)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* SVG Soil Cross-Section with Organic Brush Roots */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            <defs>
              <filter id="soilBrushFilter" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>

            {/* Surface Grass & Moss Foliage Layer */}
            <rect x="0" y="0" width="100%" height="70" fill="rgba(16,185,129,0.22)" />
            <path
              d="M 0 70 Q 120 62 240 70 T 480 66 T 720 72 T 960 68 T 1080 70 L 1080 0 L 0 0 Z"
              fill="rgba(16,185,129,0.35)"
              filter="url(#soilBrushFilter)"
            />

            {/* Upper Humus Soil Layer (-10cm band) */}
            <rect x="0" y="160" width="100%" height="190" fill="rgba(245,158,11,0.08)" />
            <line x1="0" y1="160" x2="1080" y2="160" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.4" />
            <line x1="0" y1="350" x2="1080" y2="350" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.4" />

            {/* Organic Branching Roots */}
            <g filter="url(#soilBrushFilter)" opacity={0.75}>
              <path
                d="M 120 70 C 130 140 100 220 110 320"
                stroke="#D97706"
                strokeWidth="4"
                fill="none"
                strokeDasharray="400"
                strokeDashoffset={400 * (1 - rootGrow)}
              />
              <path
                d="M 110 200 C 140 240 160 280 180 340"
                stroke="#B45309"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="250"
                strokeDashoffset={250 * (1 - rootGrow)}
              />
              <path
                d="M 380 70 C 370 150 410 230 400 350"
                stroke="#D97706"
                strokeWidth="4.5"
                fill="none"
                strokeDasharray="400"
                strokeDashoffset={400 * (1 - rootGrow)}
              />
              <path
                d="M 400 180 C 440 230 470 290 490 360"
                stroke="#B45309"
                strokeWidth="3"
                fill="none"
                strokeDasharray="250"
                strokeDashoffset={250 * (1 - rootGrow)}
              />
            </g>
          </svg>

          {/* Depth Ruler on Left Side */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 80,
              display: "flex",
              flexDirection: "column",
              gap: isVertical ? 65 : 45,
              fontFamily: MONO,
              fontSize: 12,
              color: "#FDE68A",
              opacity: 0.85,
              zIndex: 10,
            }}
          >
            <div>0 cm (SURFACE)</div>
            <div>-5 cm (ORGANIC TOPSOIL)</div>
            <div style={{ color: "#00FF9D", fontWeight: 900 }}>-10 cm (HUMUS LAYER)</div>
            <div>-20 cm (SUBSOIL)</div>
          </div>

          {/* Buried Bioplastic Film Sample at 10cm */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: isVertical ? "45%" : "48%",
              transform: `translate(-50%, -50%) scale(${enter})`,
              width: isVertical ? 340 : 480,
              height: isVertical ? 150 : 130,
              borderRadius: 18,
              background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 100%)",
              border: `2px solid #00FF9D`,
              boxShadow: `0 0 ${25 * filmGlow}px rgba(0,255,157,0.45)`,
              backdropFilter: "blur(10px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 20,
              padding: 16,
            }}
          >
            <div
              style={{
                fontFamily: MONO,
                fontSize: 13,
                fontWeight: 800,
                color: "#00FF9D",
                letterSpacing: "0.15em",
                marginBottom: 6,
              }}
            >
              LCAP BIOPLASTIC FILM SAMPLE
            </div>
            <div style={{ fontSize: isVertical ? 18 : 16, fontWeight: 900, color: "#FFFFFF", textAlign: "center" }}>
              BURIED 10 CM IN FOREST HUMUS
            </div>

            {/* Microbial Colonization Swarm Dots */}
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
              {Array.from({ length: 18 }).map((_, i) => {
                const rx = ((i * 37) % 85) + 5;
                const ry = ((i * 53) % 75) + 12;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: `${rx}%`,
                      top: `${ry}%`,
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: "#00FF9D",
                      boxShadow: "0 0 10px #00FF9D",
                      opacity: swarmProg > (i / 18) ? 0.9 : 0,
                      transform: `scale(${swarmProg})`,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Bottom Telemetry Card */}
          <div
            style={{
              position: "absolute",
              bottom: 18,
              left: 20,
              right: 20,
              padding: "12px 18px",
              borderRadius: 14,
              background: "rgba(10,6,3,0.9)",
              border: "1px solid rgba(245,158,11,0.3)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: MONO,
              fontSize: safeFontSize(isVertical ? 14 : 12, L.landscape),
              color: "#FDE68A",
              zIndex: 30,
            }}
          >
            <div>SOIL: BOTANIC GARDEN HUMUS</div>
            <div style={{ color: "#00FF9D", fontWeight: 700 }}>NATURAL DIGESTION ACTIVE</div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 1: ELECTRON MICROSCOPE - BACTERIAL PITS & CAVITIES
  // ---------------------------------------------------------------------------
  if (variant === "microscope") {
    const scanY = (frame * 8) % height;
    const focusPulse = interpolate(frame % 45, [0, 22, 45], [0.98, 1.02, 0.98]);
    const pitDepth = interpolate(frame, [15, 80], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

    return (
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 40%, #061814 0%, #030D0B 65%, #010504 100%)",
          padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
          color: "#E2FDF3",
          fontFamily: FONT,
          overflow: "hidden",
        }}
      >
        {renderHeader("MYSTERIOUS BACTERIAL BITES", "04 / ELECTRON MICROSCOPY")}

        {/* Electron Microscope HUD Frame */}
        <div
          style={{
            position: "relative",
            flex: 1,
            borderRadius: 24,
            border: "1.5px solid rgba(0,255,157,0.3)",
            background: "rgba(3,15,12,0.75)",
            boxShadow: "inset 0 0 80px rgba(0,0,0,0.9), 0 12px 40px rgba(0,0,0,0.6)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* SEM CRT Scan Lines & Grid */}
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: 0.18,
              pointerEvents: "none",
            }}
          >
            <defs>
              <pattern id="semGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00FF9D" strokeWidth="0.8" />
                <circle cx="0" cy="0" r="1.2" fill="#00FF9D" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#semGrid)" />
          </svg>

          {/* Sweeping Electron Beam Line */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: scanY,
              height: 3,
              background: "linear-gradient(90deg, transparent, #00FF9D, transparent)",
              boxShadow: "0 0 20px #00FF9D",
              opacity: 0.85,
            }}
          />

          {/* Main Visual: Plastic Polymer Surface with Bacterial Cavities */}
          <div
            style={{
              position: "relative",
              width: isVertical ? 380 : 640,
              height: isVertical ? 480 : 360,
              transform: `scale(${focusPulse * enter})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Plastic Surface Base Slab */}
            <div
              style={{
                position: "absolute",
                width: "92%",
                height: "82%",
                borderRadius: 28,
                background: "linear-gradient(145deg, #182E28 0%, #0B1714 100%)",
                border: "2px solid rgba(0,255,157,0.35)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
                overflow: "hidden",
              }}
            >
              {/* Texture Lines on Bioplastic Film */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0.25,
                  backgroundImage: "repeating-linear-gradient(45deg, #00FF9D 0px, #00FF9D 2px, transparent 2px, transparent 18px)",
                }}
              />

              {/* 3 Excavated Bacterial Pits / Holes */}
              {[
                { x: 30, y: 28, w: 90, h: 140, rot: -15, delay: 0 },
                { x: 62, y: 45, w: 85, h: 135, rot: 25, delay: 10 },
                { x: 38, y: 65, w: 80, h: 125, rot: 5, delay: 20 },
              ].map((pit, idx) => {
                const prog = interpolate(frame - pit.delay, [0, 45], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                return (
                  <div
                    key={idx}
                    style={{
                      position: "absolute",
                      left: `${pit.x}%`,
                      top: `${pit.y}%`,
                      transform: `translate(-50%, -50%) rotate(${pit.rot}deg)`,
                      width: pit.w,
                      height: pit.h,
                      borderRadius: "45%",
                      background: "radial-gradient(circle at 40% 40%, #020706 0%, #010403 70%, #091A15 100%)",
                      border: `2px dashed rgba(0,255,157,${0.3 + prog * 0.5})`,
                      boxShadow: `inset 0 0 ${25 * prog}px rgba(0,0,0,0.95)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {/* Embedded Bacterium Inside Pit */}
                    <div
                      style={{
                        width: pit.w * 0.72,
                        height: pit.h * 0.72,
                        borderRadius: "42%",
                        background: "linear-gradient(135deg, #00FF9D 0%, #059669 100%)",
                        boxShadow: `0 0 ${16 * prog}px #00FF9D`,
                        opacity: 0.85 + prog * 0.15,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1.5px solid #FFFFFF",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 900,
                          color: "#03150F",
                          fontFamily: MONO,
                          letterSpacing: "0.1em",
                        }}
                      >
                        BACTERIA
                      </span>
                    </div>

                    {/* Cavity Measurement Callout */}
                    {idx === 0 && (
                      <div
                        style={{
                          position: "absolute",
                          right: -130,
                          top: -20,
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: "rgba(6,24,20,0.92)",
                          border: "1px solid #00FF9D",
                          fontSize: 13,
                          fontFamily: MONO,
                          color: "#00FF9D",
                          whiteSpace: "nowrap",
                        }}
                      >
                        PIT: 1.2 μm DEEP
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Telemetry Bar */}
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: 20,
              right: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 18px",
              borderRadius: 14,
              background: "rgba(6,20,16,0.88)",
              border: "1px solid rgba(0,255,157,0.25)",
              fontFamily: MONO,
              fontSize: safeFontSize(isVertical ? 15 : 13, L.landscape),
              color: "#99F6E4",
            }}
          >
            <div>MAG: 25,000x | ACCEL: 15.0 kV</div>
            <div style={{ color: "#00FF9D", fontWeight: 700 }}>SURFACE DIGESTION DETECTED</div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 2: PAC-MAN ENZYME ACTION (CHOMPING POLYMER INTO MONOMERS)
  // ---------------------------------------------------------------------------
  if (variant === "pacman_mouth") {
    // Chomp cycle (every 24 frames mouth opens and bites down)
    const chompCycle = (frame % 24) / 24;
    const mouthAngle = interpolate(chompCycle, [0, 0.45, 0.55, 1], [38, 8, 4, 38]);
    const cutSpark = chompCycle > 0.48 && chompCycle < 0.65 ? 1 : 0;

    // Polymer flow movement
    const chainShift = (frame * 5) % 180;

    return (
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 35%, #051A22 0%, #030E14 65%, #010609 100%)",
          padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
          color: "#E0F2FE",
          fontFamily: FONT,
          overflow: "hidden",
        }}
      >
        {renderHeader("THE 'PAC-MAN' MOLECULAR MOUTH", "05 / ENZYME CATALYSIS")}

        {/* Central Stage */}
        <div
          style={{
            position: "relative",
            flex: 1,
            borderRadius: 24,
            border: "1.5px solid rgba(0,240,255,0.3)",
            background: "rgba(2,14,22,0.8)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 20,
          }}
        >
          {/* Reaction Formula Pill at Top */}
          <div
            style={{
              padding: "10px 22px",
              borderRadius: 999,
              background: "rgba(0,240,255,0.12)",
              border: "1.5px solid #00F0FF",
              fontFamily: MONO,
              fontSize: safeFontSize(isVertical ? 17 : 15, L.landscape),
              color: "#38BDF8",
              fontWeight: 700,
              boxShadow: "0 0 20px rgba(0,240,255,0.25)",
            }}
          >
            LCAP POLYESTER + H₂O ➔ MONOMER RECOVERY
          </div>

          {/* Molecular Chomping Theater */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: isVertical ? 420 : 320,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Incoming Polyester Polymer Chain */}
            <div
              style={{
                position: "absolute",
                top: isVertical ? 80 : 60,
                left: 0,
                right: 0,
                height: 50,
                display: "flex",
                alignItems: "center",
                gap: 12,
                transform: `translateX(-${chainShift}px)`,
                pointerEvents: "none",
              }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "radial-gradient(circle at 30% 30%, #38BDF8 0%, #0369A1 100%)",
                      border: "2px solid #BAE6FD",
                      boxShadow: "0 0 14px rgba(56,189,248,0.7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 900,
                      color: "#FFFFFF",
                      fontFamily: MONO,
                    }}
                  >
                    EST
                  </div>
                  <div
                    style={{
                      width: 22,
                      height: 4,
                      background: "#38BDF8",
                      boxShadow: "0 0 8px #38BDF8",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* The Pac-Man Enzyme Head & Open Cleft */}
            <div
              style={{
                position: "relative",
                width: isVertical ? 220 : 200,
                height: isVertical ? 220 : 200,
                transform: `scale(${enter})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Upper Jaw */}
              <div
                style={{
                  position: "absolute",
                  width: 190,
                  height: 95,
                  top: 0,
                  borderTopLeftRadius: 100,
                  borderTopRightRadius: 100,
                  background: "linear-gradient(180deg, #F59E0B 0%, #D97706 100%)",
                  boxShadow: "0 -8px 30px rgba(245,158,11,0.5)",
                  transformOrigin: "bottom center",
                  transform: `rotate(-${mouthAngle / 2}deg)`,
                  border: "2.5px solid #FDE68A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Active Site Catalytic Triad Residue Marker */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 8,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "#00F0FF",
                    boxShadow: "0 0 16px #00F0FF",
                  }}
                />
              </div>

              {/* Lower Jaw */}
              <div
                style={{
                  position: "absolute",
                  width: 190,
                  height: 95,
                  bottom: 0,
                  borderBottomLeftRadius: 100,
                  borderBottomRightRadius: 100,
                  background: "linear-gradient(0deg, #F59E0B 0%, #D97706 100%)",
                  boxShadow: "0 8px 30px rgba(245,158,11,0.5)",
                  transformOrigin: "top center",
                  transform: `rotate(${mouthAngle / 2}deg)`,
                  border: "2.5px solid #FDE68A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />

              {/* Eye on Pac-Man */}
              <div
                style={{
                  position: "absolute",
                  top: 45,
                  right: 65,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#0F172A",
                  border: "2px solid #FFFFFF",
                  zIndex: 20,
                }}
              />

              {/* Spark Flash during Bite */}
              {cutSpark > 0 && (
                <div
                  style={{
                    position: "absolute",
                    left: 20,
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #FFFFFF 0%, #00F0FF 50%, transparent 80%)",
                    boxShadow: "0 0 40px #00F0FF",
                    zIndex: 30,
                  }}
                />
              )}
            </div>

            {/* Lipid Anchor Tether holding enzyme to Bacterial Cell Membrane */}
            <div
              style={{
                position: "absolute",
                bottom: 10,
                width: 8,
                height: isVertical ? 90 : 60,
                background: "repeating-linear-gradient(to bottom, #00F0FF, #00F0FF 4px, transparent 4px, transparent 8px)",
                boxShadow: "0 0 12px #00F0FF",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: isVertical ? 45 : 30,
                left: "52%",
                fontFamily: MONO,
                fontSize: 12,
                color: "#00F0FF",
                fontWeight: 700,
              }}
            >
              LIPID ANCHOR
            </div>
          </div>

          {/* Bacterial Membrane Base Banner */}
          <div
            style={{
              width: "100%",
              padding: "14px 18px",
              borderRadius: 16,
              background: "linear-gradient(90deg, rgba(3,105,161,0.4) 0%, rgba(2,132,199,0.2) 100%)",
              border: "1.5px solid rgba(56,189,248,0.4)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: MONO,
              fontSize: safeFontSize(isVertical ? 15 : 13, L.landscape),
            }}
          >
            <div>ENZYME: FAMILY-VIII ESTERASE</div>
            <div style={{ color: "#38BDF8", fontWeight: 700 }}>SURFACE-ANCHORED DEPOLYMERASE</div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 3: ANTIBIOTIC TWIST (PENICILLIN CLEAVAGE & RESISTANCE LINK)
  // ---------------------------------------------------------------------------
  if (variant === "antibiotic_twist") {
    const pulseWarn = interpolate(frame % 25, [0, 12, 25], [1, 1.15, 1]);
    const ringBreak = interpolate(frame, [20, 65], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

    return (
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 50% 30%, #1A091E 0%, #100414 65%, #050106 100%)",
          padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
          color: "#FAE8FF",
          fontFamily: FONT,
          overflow: "hidden",
        }}
      >
        {renderHeader("THE SHOCKING PENICILLIN SECRET", "06 / SURPRISE DUAL FUNCTION")}

        {/* Warning Alert Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderRadius: 16,
            background: "rgba(236,72,153,0.15)",
            border: "1.5px solid #EC4899",
            marginBottom: isVertical ? 20 : 12,
            boxShadow: `0 0 ${16 * pulseWarn}px rgba(236,72,153,0.35)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <span style={{ fontFamily: MONO, fontWeight: 900, fontSize: isVertical ? 15 : 13, color: "#F472B6" }}>
              UNEXPECTED CROSSOVER: EATS PLASTIC & CLEAVES ANTIBIOTICS
            </span>
          </div>
        </div>

        {/* Side-by-Side Dual Activity Comparison */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: isVertical ? "1fr" : "1fr 1fr",
            gap: isVertical ? 16 : 20,
          }}
        >
          {/* Card 1: Esterase Activity (Plastic Breakdown) */}
          <div
            style={{
              borderRadius: 20,
              padding: 20,
              background: "rgba(15,23,42,0.85)",
              border: "1.5px solid rgba(0,240,255,0.4)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: "#38BDF8", fontWeight: 800, marginBottom: 6 }}>
                FUNCTION A: ESTERASE
              </div>
              <div style={{ fontSize: isVertical ? 22 : 18, fontWeight: 800, color: "#FFFFFF" }}>
                Cleaves Polyester Bonds
              </div>
            </div>

            {/* Formula Diagram */}
            <div
              style={{
                margin: "16px 0",
                padding: "14px",
                borderRadius: 14,
                background: "rgba(0,0,0,0.4)",
                border: "1px dashed #38BDF8",
                textAlign: "center",
                fontFamily: MONO,
                fontSize: isVertical ? 16 : 14,
                color: "#7DD3FC",
              }}
            >
              [POLYESTER] —C(=O)—O— [CHAIN]
              <div style={{ marginTop: 8, color: "#34D399", fontWeight: 800 }}>➔ 100% DEGRADATION</div>
            </div>

            <div style={{ fontSize: 13, color: "#94A3B8" }}>
              Ester bonds are naturally digested in soil humus, turning bioplastics into harmless CO2 and water.
            </div>
          </div>

          {/* Card 2: Beta-Lactamase Activity (Antibiotic Resistance) */}
          <div
            style={{
              borderRadius: 20,
              padding: 20,
              background: "rgba(15,23,42,0.85)",
              border: "1.5px solid rgba(236,72,153,0.5)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontFamily: MONO, fontSize: 13, color: "#F472B6", fontWeight: 800, marginBottom: 6 }}>
                FUNCTION B: β-LACTAMASE
              </div>
              <div style={{ fontSize: isVertical ? 22 : 18, fontWeight: 800, color: "#FFFFFF" }}>
                Cleaves Penicillin Ring!
              </div>
            </div>

            {/* Penicillin 4-membered square β-lactam ring */}
            <div
              style={{
                margin: "16px 0",
                padding: "14px",
                borderRadius: 14,
                background: "rgba(0,0,0,0.4)",
                border: "1px dashed #EC4899",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* 4-membered Square Ring with Cut Animation */}
              <div
                style={{
                  position: "relative",
                  width: 80,
                  height: 80,
                  border: "3px solid #EC4899",
                  borderRadius: 10,
                  boxShadow: "0 0 20px rgba(236,72,153,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${1 - ringBreak * 0.15})`,
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 900, color: "#FDF4FF" }}>
                  β-RING
                </span>
                {/* Laser Cut Slash across ring */}
                {ringBreak > 0.3 && (
                  <div
                    style={{
                      position: "absolute",
                      width: 110,
                      height: 4,
                      background: "#FFFFFF",
                      boxShadow: "0 0 16px #EC4899",
                      transform: "rotate(45deg)",
                    }}
                  />
                )}
              </div>
              <div style={{ marginTop: 10, fontFamily: MONO, color: "#F472B6", fontSize: 13, fontWeight: 800 }}>
                PENICILLIN DEACTIVATED
              </div>
            </div>

            <div style={{ fontSize: 13, color: "#94A3B8" }}>
              Shares molecular architecture with antibiotic-resistance enzymes, shedding light on bacterial evolution.
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 4: POLYMER BONDS & BREAK POINTS (WHY NORMAL PLASTIC FAILS)
  // ---------------------------------------------------------------------------
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 30%, #0B1626 0%, #070D18 65%, #03060B 100%)",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
        color: "#F1F5F9",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {renderHeader("THE BIOCHEMICAL BREAK POINT", "07 / THE REALITY CHECK")}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: isVertical ? 20 : 16,
          justifyContent: "center",
        }}
      >
        {/* Conventional Polyethylene (HDPE) - The Lock */}
        <div
          style={{
            padding: 22,
            borderRadius: 20,
            background: "rgba(239,68,68,0.1)",
            border: "2px solid #EF4444",
            boxShadow: "0 10px 30px rgba(239,68,68,0.2)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: isVertical ? 24 : 20, fontWeight: 900, color: "#EF4444" }}>
              CONVENTIONAL PLASTIC (HDPE)
            </span>
            <span style={{ fontSize: 24 }}>🔒 LOCKED</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 16, color: "#FECACA", marginBottom: 8 }}>
            —C—C—C—C—C—C— (CARBON-CARBON BACKBONE)
          </div>
          <div style={{ fontSize: 14, color: "#94A3B8" }}>
            Bacteria have NO enzymes to digest these bonds. Lasts 300+ years in nature.
          </div>
        </div>

        {/* Bioplastic (LCAP) - The Breaking Point */}
        <div
          style={{
            padding: 22,
            borderRadius: 20,
            background: "rgba(16,185,129,0.12)",
            border: "2px solid #10B981",
            boxShadow: "0 10px 30px rgba(16,185,129,0.2)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: isVertical ? 24 : 20, fontWeight: 900, color: "#10B981" }}>
              FUTURE BIOPLASTIC (LCAP)
            </span>
            <span style={{ fontSize: 24 }}>✂️ WEAK POINT</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 16, color: "#A7F3D0", marginBottom: 8 }}>
            —C—C—O—C(=O)—C—C— (HYDROLYSABLE ESTER BOND)
          </div>
          <div style={{ fontSize: 14, color: "#94A3B8" }}>
            Engineered weak points that Pac-Man enzymes can cleave. 100% digested in 1 year!
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
