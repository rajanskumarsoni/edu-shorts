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

export const RefrigeratorVisualizer: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const L = useLayout();
  const isVertical = !L.landscape;

  const variant = scene.variant || "system_flow_diagram";
  const title = scene.title || "VAPOR COMPRESSION CYCLE";
  const tag = resolveSceneTag(scene, "01 / REFRIGERATION MECHANICS");

  // Entrance spring
  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 100 },
  });

  // Top header container (respects vertical top safe zone 180px)
  const renderHeader = (customTitle?: string, customTag?: string) => (
    <div style={{ position: "relative", zIndex: 30, paddingBottom: 16 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 18px",
          borderRadius: 999,
          background: "rgba(15,23,42,0.85)",
          border: `1.5px solid ${accent}${hexAlpha(0.4)}`,
          backdropFilter: "blur(12px)",
          marginBottom: 10,
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
        <span
          style={{
            fontSize: safeFontSize(isVertical ? 26 : 20, L.landscape),
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
          fontSize: safeFontSize(isVertical ? 52 : 42, L.landscape),
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          textTransform: "uppercase",
          textShadow: "0 6px 30px rgba(0,0,0,0.9)",
        }}
      />
    </div>
  );

  // ---------------------------------------------------------------------------
  // VARIANT 1: Hook - Refrigerator Door Opening & Role of Electricity
  // ---------------------------------------------------------------------------
  if (variant === "hook_fridge") {
    // 3D Door swing progress
    const doorOpen = interpolate(frame, [15, 60], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

    // Electricity spark pulse travelling along bottom power cord
    const sparkX = (frame * 12) % 400;

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070B14",
          padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
          fontFamily: FONT,
          color: "#F8FAFC",
          overflow: "hidden",
        }}
      >
        {renderHeader("WHY IS A FRIDGE COLD?", "01 / THE COLD PUZZLE")}

        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            perspective: 1200,
            gap: 16,
          }}
        >
          {/* Main Refrigerator Body */}
          <div
            style={{
              position: "relative",
              width: isVertical ? 500 : 420,
              height: isVertical ? 720 : 580,
              borderRadius: 32,
              background: "#0F172A",
              border: "3px solid #334155",
              boxShadow: "0 30px 80px rgba(0,0,0,0.9)",
              overflow: "hidden",
              transform: `scale(${enterSpring})`,
            }}
          >
            {/* Interior Chilled Cavity */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, #0B2545 0%, #134074 50%, #0B2545 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-around",
                padding: 30,
              }}
            >
              {scene.image && (
                <Img
                  src={staticFile(scene.image)}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.8,
                  }}
                />
              )}

              {/* Frost Mist Overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(0,240,255,0.25) 0%, transparent 80%)",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* 3D Swinging Door */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, #1E293B 0%, #0F172A 50%, #020617 100%)",
                transformOrigin: "left center",
                transform: `rotateY(${-doorOpen * 82}deg)`,
                boxShadow: "10px 0 35px rgba(0,0,0,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: 24,
                opacity: 1 - doorOpen * 0.15,
              }}
            >
              {/* Chrome Door Handle */}
              <div
                style={{
                  width: 14,
                  height: 180,
                  borderRadius: 7,
                  background:
                    "linear-gradient(180deg, #94A3B8 0%, #F8FAFC 50%, #475569 100%)",
                  boxShadow: "0 6px 16px rgba(0,0,0,0.6)",
                }}
              />
            </div>
          </div>

          {/* Electric Power Cord & Compressor Motor at Bottom */}
          <div
            style={{
              position: "relative",
              width: isVertical ? "90%" : "70%",
              maxWidth: 720,
              padding: "14px 20px",
              borderRadius: 20,
              background: "rgba(15,23,42,0.92)",
              border: "2px solid #FFC857",
              boxShadow: "0 10px 30px rgba(255,200,87,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 36 }}>⚡</span>
              <div>
                <div style={{ fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
                  ROLE OF ELECTRICITY:
                </div>
                <div
                  style={{
                    fontSize: safeFontSize(isVertical ? 26 : 20, L.landscape),
                    fontWeight: 900,
                    color: "#FFC857",
                    fontFamily: MONO,
                  }}
                >
                  POWERS MOTOR PUMP (NOT COLD AIR!)
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                background: "#00F0FF",
                color: "#0B1020",
                fontSize: 22,
                fontWeight: 900,
                fontFamily: MONO,
              }}
            >
              INSIDE: 4°C
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 2: Misconception - Evaporation Steals Heat (Kid-Friendly Analogy)
  // ---------------------------------------------------------------------------
  if (variant === "misconception_cold") {
    // Droplet evaporation progress
    const evapProgress = interpolate(frame, [20, 80], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    const dropSize = (1 - evapProgress) * 70;
    const skinTemp = interpolate(frame, [25, 85], [37, 18], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#060913",
          padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
          fontFamily: FONT,
          color: "#F8FAFC",
          overflow: "hidden",
        }}
      >
        {renderHeader("COLD DOES NOT EXIST", "02 / CORE PRINCIPLE")}

        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {/* Myth Busted Alert Banner */}
          <div
            style={{
              padding: "10px 24px",
              borderRadius: 999,
              background: "rgba(255,50,50,0.18)",
              border: "2px solid #FF3333",
              color: "#FF5555",
              fontSize: safeFontSize(isVertical ? 28 : 22, L.landscape),
              fontWeight: 900,
              fontFamily: MONO,
              letterSpacing: "0.1em",
            }}
          >
            ❌ MYTH: "FRIDGE MAKES COLD" ➔ FALSE!
          </div>

          {/* Everyday Analogy: Hand with Sanitizer / Water Droplet Evaporating */}
          <div
            style={{
              position: "relative",
              width: isVertical ? 640 : 500,
              height: isVertical ? 500 : 380,
              borderRadius: 32,
              background: "rgba(15,23,42,0.92)",
              border: "2px solid #00F0FF",
              boxShadow: "0 25px 70px rgba(0,0,0,0.85), 0 0 40px rgba(0,240,255,0.25)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* Hand Surface Simulation */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                width: "100%",
                height: 140,
                background:
                  "linear-gradient(to top, rgba(0,240,255,0.3) 0%, rgba(15,23,42,0.8) 100%)",
                borderTop: "3px solid #00F0FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#00F0FF",
                  fontFamily: MONO,
                }}
              >
                ✋ YOUR SKIN / INSIDE FRIDGE
              </span>
            </div>

            {/* Evaporating Droplet */}
            <div
              style={{
                position: "relative",
                width: dropSize,
                height: dropSize,
                borderRadius: "50% 50% 50% 0",
                transform: "rotate(-45deg)",
                background:
                  "radial-gradient(circle at 35% 35%, #FFFFFF 0%, #00F0FF 50%, #0066AA 100%)",
                boxShadow: "0 0 30px #00F0FF",
                marginBottom: 60,
              }}
            />

            {/* Flying Away Heat Particles */}
            {Array.from({ length: 6 }).map((_, i) => {
              const flyY = ((frame * 4 + i * 25) % 160) * evapProgress;
              const flyX = Math.sin(frame * 0.1 + i) * 80;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    bottom: 150 + flyY,
                    left: `calc(50% + ${flyX}px)`,
                    color: "#FF5522",
                    fontSize: 24,
                    fontWeight: 900,
                    textShadow: "0 0 15px #FF5522",
                    opacity: 1 - flyY / 160,
                    pointerEvents: "none",
                  }}
                >
                  ♨️ HEAT
                </div>
              );
            })}
          </div>

          {/* Child-Friendly Conclusion Card */}
          <div
            style={{
              padding: "16px 32px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.06)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              textAlign: "center",
              maxWidth: 720,
            }}
          >
            <div
              style={{
                fontSize: safeFontSize(isVertical ? 34 : 26, L.landscape),
                fontWeight: 900,
                color: "#FFFFFF",
              }}
            >
              WHEN LIQUID TURNS TO GAS, IT STEALS HEAT!
            </div>
            <div
              style={{
                fontSize: safeFontSize(isVertical ? 26 : 20, L.landscape),
                color: accent,
                marginTop: 6,
                fontFamily: MONO,
              }}
            >
              COLD = REMOVING HEAT FROM FOOD ➔ DUMPING OUTSIDE
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 3: The Complete Flow Diagram of the Whole System (10-Year-Old Friendly)
  // ---------------------------------------------------------------------------
  if (variant === "system_flow_diagram" || variant === "cycle_overview") {
    // Flowing particle stream timing: continuous loop around 4 stations
    const particleCount = 28;

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070B14",
          padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
          fontFamily: FONT,
          color: "#F8FAFC",
          overflow: "hidden",
        }}
      >
        {renderHeader("THE COMPLETE SYSTEM FLOW", "03 / MASTER DIAGRAM")}

        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Main Diagram Canvas (1080x1920 responsive) */}
          <div
            style={{
              position: "relative",
              width: isVertical ? 680 : 540,
              height: isVertical ? 860 : 640,
              borderRadius: 32,
              background: "rgba(11,16,32,0.95)",
              border: `2px solid ${accent}${hexAlpha(0.4)}`,
              boxShadow: "0 30px 90px rgba(0,0,0,0.9)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: 24,
            }}
          >
            {/* Top Half / Bottom Half Divider Line representing Refrigerator Wall */}
            <div
              style={{
                position: "absolute",
                left: "48%",
                top: 0,
                bottom: 0,
                width: 4,
                borderLeft: "2px dashed rgba(255,255,255,0.25)",
                pointerEvents: "none",
              }}
            />

            {/* Labels for Outside Kitchen vs Inside Fridge */}
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 20,
                fontSize: 18,
                fontWeight: 900,
                color: "#FF8C00",
                letterSpacing: "0.1em",
                fontFamily: MONO,
              }}
            >
              OUTSIDE (KITCHEN ROOM)
            </div>
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 20,
                fontSize: 18,
                fontWeight: 900,
                color: "#00F0FF",
                letterSpacing: "0.1em",
                fontFamily: MONO,
              }}
            >
              INSIDE (CHILLED FRIDGE)
            </div>

            {/* Top Row: Station 3 (Expansion Valve) <---> Station 4 (Evaporator) */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 24,
              }}
            >
              {/* Station 3: Expansion Valve (Top Left) */}
              <div
                style={{
                  width: 250,
                  padding: "16px 14px",
                  borderRadius: 20,
                  background: "rgba(0,240,255,0.15)",
                  border: "2px solid #00F0FF",
                  boxShadow: "0 0 25px rgba(0,240,255,0.3)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 32 }}>🔍 ❄️</div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: "#FFFFFF",
                    margin: "4px 0",
                  }}
                >
                  3. EXPANSION VALVE
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: "#00F0FF",
                    fontFamily: MONO,
                  }}
                >
                  -25°C FLASH
                </div>
                <div style={{ fontSize: 14, color: "#94A3B8" }}>
                  Tiny Pinhole Spray
                </div>
              </div>

              {/* Top Connecting Pipe with Moving Icy Cyan Particles */}
              <div
                style={{
                  flex: 1,
                  height: 12,
                  background:
                    "linear-gradient(90deg, #00F0FF 0%, #00B4FF 100%)",
                  boxShadow: "0 0 15px #00F0FF",
                  position: "relative",
                  margin: "0 8px",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: -24,
                    left: "35%",
                    fontSize: 16,
                    color: "#00F0FF",
                    fontWeight: 900,
                  }}
                >
                  ICY MIST ➔
                </span>
              </div>

              {/* Station 4: Evaporator Coils (Top Right) */}
              <div
                style={{
                  width: 250,
                  padding: "16px 14px",
                  borderRadius: 20,
                  background: "rgba(0,180,255,0.18)",
                  border: "2px solid #00B4FF",
                  boxShadow: "0 0 25px rgba(0,180,255,0.3)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 32 }}>🥛 🍎 ❄️</div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: "#FFFFFF",
                    margin: "4px 0",
                  }}
                >
                  4. EVAPORATOR
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: "#00B4FF",
                    fontFamily: MONO,
                  }}
                >
                  STEALS FOOD HEAT
                </div>
                <div style={{ fontSize: 14, color: "#94A3B8" }}>
                  Inside Food Chilled to 4°C
                </div>
              </div>
            </div>

            {/* Vertical Connecting Pipes */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0 115px",
                height: 180,
              }}
            >
              {/* Left Pipe: Condenser liquid rising to Expansion Valve */}
              <div
                style={{
                  width: 12,
                  height: "100%",
                  background:
                    "linear-gradient(180deg, #00F0FF 0%, #FF8C00 100%)",
                  boxShadow: "0 0 15px #FF8C00",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    transform: "rotate(-90deg)",
                    fontSize: 16,
                    color: "#FF8C00",
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  ▲ LIQUID FLOWS UP
                </span>
              </div>

              {/* Right Pipe: Vapor returning down to Compressor */}
              <div
                style={{
                  width: 12,
                  height: "100%",
                  background:
                    "linear-gradient(180deg, #00B4FF 0%, #0055AA 100%)",
                  boxShadow: "0 0 15px #00B4FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    transform: "rotate(90deg)",
                    fontSize: 16,
                    color: "#00B4FF",
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  ▼ VAPOR RETURNS
                </span>
              </div>
            </div>

            {/* Bottom Row: Station 2 (Condenser) <---> Station 1 (Compressor) */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              {/* Station 2: Condenser Coils (Bottom Left) */}
              <div
                style={{
                  width: 250,
                  padding: "16px 14px",
                  borderRadius: 20,
                  background: "rgba(255,140,0,0.18)",
                  border: "2px solid #FF8C00",
                  boxShadow: "0 0 25px rgba(255,140,0,0.3)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 32 }}>♨️ 💨</div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: "#FFFFFF",
                    margin: "4px 0",
                  }}
                >
                  2. CONDENSER
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: "#FF8C00",
                    fontFamily: MONO,
                  }}
                >
                  DUMPS HEAT: 450W
                </div>
                <div style={{ fontSize: 14, color: "#94A3B8" }}>
                  Gas Cools into Liquid
                </div>
              </div>

              {/* Bottom Connecting Pipe with Hot Compressed Gas */}
              <div
                style={{
                  flex: 1,
                  height: 12,
                  background:
                    "linear-gradient(90deg, #FF8C00 0%, #FF3300 100%)",
                  boxShadow: "0 0 15px #FF3300",
                  position: "relative",
                  margin: "0 8px",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    bottom: -24,
                    left: "25%",
                    fontSize: 16,
                    color: "#FF5522",
                    fontWeight: 900,
                  }}
                >
                  ◀ HOT GAS FLOWS
                </span>
              </div>

              {/* Station 1: Compressor Pump (Bottom Right) */}
              <div
                style={{
                  width: 250,
                  padding: "16px 14px",
                  borderRadius: 20,
                  background: "rgba(255,50,0,0.2)",
                  border: "2px solid #FF3300",
                  boxShadow: "0 0 25px rgba(255,50,0,0.35)",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 32 }}>⚡ ⚙️ 💨</div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: "#FFFFFF",
                    margin: "4px 0",
                  }}
                >
                  1. COMPRESSOR
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    color: "#FF5522",
                    fontFamily: MONO,
                  }}
                >
                  6.2 BAR | +65°C
                </div>
                <div style={{ fontSize: 14, color: "#FFC857", fontWeight: 700 }}>
                  ⚡ Electricity Powers Motor!
                </div>
              </div>
            </div>

            {/* Bottom System Banner */}
            <div
              style={{
                padding: "10px 20px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.06)",
                textAlign: "center",
                color: accent,
                fontSize: 20,
                fontWeight: 900,
                fontFamily: MONO,
                letterSpacing: "0.1em",
              }}
            >
              🔄 CONTINUOUS CLOSED LOOP: PUMP ➔ DUMP ➔ FREEZE ➔ ABSORB
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 4: Step 1 - The Compressor: Role of Electricity & Squeezing Gas
  // ---------------------------------------------------------------------------
  if (variant === "compressor_piston") {
    // Reciprocating piston stroke (continuous mechanical pump)
    const pistonCycle = (frame * 0.22) % (Math.PI * 2);
    const pistonY = Math.sin(pistonCycle) * 45; // moves up and down 45px

    // Pressure jumps from 1.0 to 6.2 BAR
    const pressureVal = interpolate(frame, [15, 60], [1.0, 6.2], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.ease),
    });

    // Temperature climbs from 20°C to 65°C
    const tempVal = interpolate(frame, [15, 60], [20, 65], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.ease),
    });

    // Electric sparks flickering
    const sparkFlicker = (Math.sin(frame * 0.8) + 1) / 2;

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070B14",
          padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
          fontFamily: FONT,
          color: "#F8FAFC",
          overflow: "hidden",
        }}
      >
        {renderHeader("STEP 1: THE ELECTRIC PUMP", "04 / COMPRESSOR MOTOR")}

        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
          }}
        >
          {/* Mechanical Cutaway Arena */}
          <div
            style={{
              position: "relative",
              width: isVertical ? 640 : 500,
              height: isVertical ? 640 : 480,
              borderRadius: 32,
              border: "3px solid #FF5522",
              boxShadow: "0 25px 70px rgba(0,0,0,0.85), 0 0 50px rgba(255,85,34,0.35)",
              overflow: "hidden",
              background: "#0F172A",
            }}
          >
            {scene.image && (
              <Img
                src={staticFile(scene.image)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}

            {/* Electric Spark / Power Input Overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 30,
                right: 30,
                padding: "8px 18px",
                borderRadius: 999,
                background: "rgba(255,200,87,0.9)",
                color: "#0B1020",
                fontSize: 20,
                fontWeight: 900,
                fontFamily: MONO,
                boxShadow: `0 0 ${20 + sparkFlicker * 15}px #FFC857`,
              }}
            >
              ⚡ 230V ELECTRICITY POWERS MOTOR!
            </div>

            {/* Glowing Orange Compressed Gas Chamber in Cylinder */}
            <div
              style={{
                position: "absolute",
                top: "22%",
                left: "32%",
                width: 220,
                height: 180,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(255,85,34,0.7) 0%, transparent 75%)",
                filter: "blur(25px)",
                transform: `translateY(${pistonY * 0.4}px)`,
                pointerEvents: "none",
              }}
            />

            {/* Animated Piston Motion Marker */}
            <div
              style={{
                position: "absolute",
                top: "42%",
                left: "40%",
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.8)",
                border: "1.5px solid #FFFFFF",
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: 800,
                transform: `translateY(${pistonY}px)`,
              }}
            >
              ▲ PISTON SQUEEZING GAS
            </div>
          </div>

          {/* Dual Live Gauges: Pressure & Temperature */}
          <div
            style={{
              display: "flex",
              gap: 20,
              width: isVertical ? "92%" : "70%",
              maxWidth: 720,
            }}
          >
            <div
              style={{
                flex: 1,
                padding: "14px 20px",
                borderRadius: 20,
                background: "rgba(15,23,42,0.92)",
                border: "2px solid #FF5522",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
                GAS PRESSURE:
              </div>
              <div
                style={{
                  fontSize: safeFontSize(isVertical ? 48 : 36, L.landscape),
                  fontWeight: 900,
                  color: "#FF5522",
                  fontFamily: MONO,
                }}
              >
                {pressureVal.toFixed(1)} BAR
              </div>
              <div style={{ fontSize: 16, color: "#FF9966", fontWeight: 700 }}>
                ▲ 6X COMPRESSION SPIKE
              </div>
            </div>

            <div
              style={{
                flex: 1,
                padding: "14px 20px",
                borderRadius: 20,
                background: "rgba(15,23,42,0.92)",
                border: "2px solid #FF8C00",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
                GAS TEMPERATURE:
              </div>
              <div
                style={{
                  fontSize: safeFontSize(isVertical ? 48 : 36, L.landscape),
                  fontWeight: 900,
                  color: "#FF8C00",
                  fontFamily: MONO,
                }}
              >
                +{Math.round(tempVal)}°C
              </div>
              <div style={{ fontSize: 16, color: "#FFBB77", fontWeight: 700 }}>
                ▲ RED-HOT SQUEEZED GAS
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 5: Step 2 - Condenser Coils: Heat Released to the Kitchen Room
  // ---------------------------------------------------------------------------
  if (variant === "condenser_heat") {
    // Heat wave animation rising into kitchen air
    const waveY = ((frame * 4) % 180) - 90;

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070B14",
          padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
          fontFamily: FONT,
          color: "#F8FAFC",
          overflow: "hidden",
        }}
      >
        {renderHeader("STEP 2: RELEASING HEAT", "05 / REAR CONDENSER COILS")}

        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          {/* Condenser Serpentine Coils Visual */}
          <div
            style={{
              position: "relative",
              width: isVertical ? 640 : 500,
              height: isVertical ? 640 : 480,
              borderRadius: 32,
              border: "3px solid #FF8C00",
              boxShadow: "0 25px 70px rgba(0,0,0,0.85), 0 0 50px rgba(255,140,0,0.3)",
              overflow: "hidden",
              background: "#0F172A",
            }}
          >
            {scene.image && (
              <Img
                src={staticFile(scene.image)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}

            {/* Glowing Convection Heat Ripples rising into the kitchen room */}
            <div
              style={{
                position: "absolute",
                top: 30,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "space-around",
                pointerEvents: "none",
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 34,
                    color: "#FF8C00",
                    fontWeight: 900,
                    textShadow: "0 0 20px #FF8C00",
                    transform: `translateY(${waveY}px)`,
                  }}
                >
                  ♨️ HEAT WAFTING OUT
                </div>
              ))}
            </div>

            {/* Gas turning into liquid droplets tag */}
            <div
              style={{
                position: "absolute",
                bottom: 24,
                left: 24,
                padding: "8px 18px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.85)",
                border: "2px solid #00F0FF",
                color: "#00F0FF",
                fontSize: 20,
                fontWeight: 900,
                fontFamily: MONO,
              }}
            >
              💧 CONDENSES INTO LIQUID!
            </div>
          </div>

          {/* Heat Release Telemetry */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 28px",
              borderRadius: 20,
              background: "rgba(15,23,42,0.92)",
              border: "2px solid #FF8C00",
              width: isVertical ? "92%" : "70%",
              maxWidth: 720,
            }}
          >
            <div>
              <div style={{ fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
                HEAT DUMPED TO ROOM:
              </div>
              <div
                style={{
                  fontSize: safeFontSize(isVertical ? 42 : 32, L.landscape),
                  fontWeight: 900,
                  color: "#FF8C00",
                  fontFamily: MONO,
                }}
              >
                ~450 WATTS
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
                PHASE CHANGE:
              </div>
              <div
                style={{
                  fontSize: safeFontSize(isVertical ? 32 : 24, L.landscape),
                  fontWeight: 900,
                  color: "#00F0FF",
                  fontFamily: MONO,
                }}
              >
                HOT GAS ➔ LIQUID
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 6: Step 3 - Expansion Valve: Pressure Drop & Flash Freezing to -25°C
  // ---------------------------------------------------------------------------
  if (variant === "expansion_valve") {
    // Temperature plummets from +40°C down to -25°C
    const dropTemp = interpolate(frame, [15, 65], [40, -25], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.1, 0.8, 0.2, 1),
    });

    const frostBloom = interpolate(frame, [25, 75], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070B14",
          padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
          fontFamily: FONT,
          color: "#F8FAFC",
          overflow: "hidden",
        }}
      >
        {renderHeader("STEP 3: FLASH FREEZING", "06 / EXPANSION VALVE")}

        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          {/* Aerosol Spray & Capillary Constriction Visual */}
          <div
            style={{
              position: "relative",
              width: isVertical ? 640 : 500,
              height: isVertical ? 640 : 480,
              borderRadius: 32,
              border: "3px solid #00F0FF",
              boxShadow: "0 25px 70px rgba(0,0,0,0.85), 0 0 60px rgba(0,240,255,0.45)",
              overflow: "hidden",
              background: "#0F172A",
            }}
          >
            {scene.image && (
              <Img
                src={staticFile(scene.image)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}

            {/* Glowing Frost Bloom Corona */}
            <div
              style={{
                position: "absolute",
                top: "15%",
                right: "15%",
                width: 320,
                height: 320,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(0,240,255,0.6) 0%, transparent 75%)",
                filter: "blur(40px)",
                transform: `scale(${frostBloom * 1.3})`,
                pointerEvents: "none",
              }}
            />

            {/* Analogy Pill: Like a Deodorant Spray */}
            <div
              style={{
                position: "absolute",
                bottom: 24,
                left: 24,
                padding: "8px 18px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.85)",
                border: "2px solid #00F0FF",
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              💨 LIKE SPRAYING A DEODORANT CAN!
            </div>
          </div>

          {/* Big Live Temperature Free-Fall Readout */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 28px",
              borderRadius: 20,
              background: "rgba(11,37,69,0.92)",
              border: "2px solid #00F0FF",
              boxShadow: "0 10px 40px rgba(0,240,255,0.3)",
              width: isVertical ? "92%" : "70%",
              maxWidth: 720,
            }}
          >
            <div>
              <div style={{ fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
                PRESSURE DROPS:
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  fontFamily: MONO,
                }}
              >
                6.0 BAR ➔ 1.0 BAR
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
                TEMPERATURE PLUMMETS:
              </div>
              <div
                style={{
                  fontSize: safeFontSize(isVertical ? 56 : 42, L.landscape),
                  fontWeight: 900,
                  color: "#00F0FF",
                  fontFamily: MONO,
                }}
              >
                {Math.round(dropTemp)}°C ❄️
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 7: Step 4 - Evaporator Coils: Stealing Heat from Food
  // ---------------------------------------------------------------------------
  if (variant === "evaporator_theft") {
    // Food cooling down from 24°C to 3.8°C
    const foodTemp = interpolate(frame, [15, 70], [24, 3.8], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.ease),
    });

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070B14",
          padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
          fontFamily: FONT,
          color: "#F8FAFC",
          overflow: "hidden",
        }}
      >
        {renderHeader("STEP 4: STEALING FOOD HEAT", "07 / EVAPORATOR COILS")}

        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          {/* Fridge Interior Food Shelves with Frosted Coils */}
          <div
            style={{
              position: "relative",
              width: isVertical ? 640 : 500,
              height: isVertical ? 640 : 480,
              borderRadius: 32,
              border: "3px solid #00F0FF",
              boxShadow: "0 25px 70px rgba(0,0,0,0.85), 0 0 50px rgba(0,240,255,0.35)",
              overflow: "hidden",
              background: "#0F172A",
            }}
          >
            {scene.image && (
              <Img
                src={staticFile(scene.image)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}

            {/* Glowing Heat Ribbons Traveling FROM Food INTO Cold Coils */}
            <div
              style={{
                position: "absolute",
                top: "40%",
                left: "15%",
                right: "15%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    color: "#FF8C00",
                    fontSize: 28,
                    fontWeight: 900,
                    fontFamily: MONO,
                    textShadow: "0 0 20px #FF8C00",
                    transform: `translateY(${Math.sin(frame * 0.15 + i) * 12}px)`,
                  }}
                >
                  ⚡ HEAT IN ➔ ❄️
                </div>
              ))}
            </div>

            {/* Coil Boiling into Vapor Tag */}
            <div
              style={{
                position: "absolute",
                bottom: 24,
                right: 24,
                padding: "8px 18px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.85)",
                border: "2px solid #00F0FF",
                color: "#00F0FF",
                fontSize: 20,
                fontWeight: 900,
                fontFamily: MONO,
              }}
            >
              🫧 LIQUID BOILS INTO VAPOR!
            </div>
          </div>

          {/* Food Cooled Down Metric Card */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 28px",
              borderRadius: 20,
              background: "rgba(11,37,69,0.92)",
              border: "2px solid #00F0FF",
              boxShadow: "0 10px 40px rgba(0,240,255,0.3)",
              width: isVertical ? "92%" : "70%",
              maxWidth: 720,
            }}
          >
            <div>
              <div style={{ fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
                FOOD CHILLED TO:
              </div>
              <div
                style={{
                  fontSize: safeFontSize(isVertical ? 48 : 36, L.landscape),
                  fontWeight: 900,
                  color: "#FFFFFF",
                  fontFamily: MONO,
                }}
              >
                +{foodTemp.toFixed(1)}°C 🥛 🍎
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
                REFRIGERANT:
              </div>
              <div
                style={{
                  fontSize: safeFontSize(isVertical ? 32 : 24, L.landscape),
                  fontWeight: 900,
                  color: "#00F0FF",
                  fontFamily: MONO,
                }}
              >
                BOILS BACK TO GAS
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 8: Myth Debunk - Leaving Door Open Heats Room
  // ---------------------------------------------------------------------------
  if (variant === "room_myth_balance") {
    const roomTemp = interpolate(frame, [15, 75], [24, 28.5], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    const balanceTilt = interpolate(frame, [20, 65], [0, 18], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.ease),
    });

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070B14",
          padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
          fontFamily: FONT,
          color: "#F8FAFC",
          overflow: "hidden",
        }}
      >
        {renderHeader("THE OPEN DOOR PARADOX", "08 / ROOM ENERGY BALANCE")}

        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {/* Energy Seesaw Balance Scale */}
          <div
            style={{
              position: "relative",
              width: isVertical ? 680 : 540,
              padding: "24px 28px",
              borderRadius: 24,
              background: "rgba(15,23,42,0.92)",
              border: "2px solid #FF5522",
              boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(255,85,34,0.3)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            {/* Tilting Balance Bar */}
            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                transform: `rotate(${balanceTilt}deg)`,
                transition: "transform 0.4s ease",
              }}
            >
              {/* Left: Front Cold */}
              <div
                style={{
                  padding: "14px 20px",
                  borderRadius: 18,
                  background: "rgba(0,240,255,0.15)",
                  border: "2px solid #00F0FF",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
                  FRONT COOLING
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: "#00F0FF",
                    fontFamily: MONO,
                  }}
                >
                  -300W
                </div>
              </div>

              <div style={{ fontSize: 36, fontWeight: 900, color: "#FF5522" }}>
                VS
              </div>

              {/* Right: Back Heat */}
              <div
                style={{
                  padding: "14px 20px",
                  borderRadius: 18,
                  background: "rgba(255,85,34,0.2)",
                  border: "2px solid #FF5522",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
                  BACK HEAT OUT
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: "#FF5522",
                    fontFamily: MONO,
                  }}
                >
                  +450W
                </div>
              </div>
            </div>

            {/* Verdict Alert */}
            <div
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: 16,
                background: "rgba(255,50,50,0.2)",
                border: "1.5px solid #FF3333",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: safeFontSize(isVertical ? 30 : 22, L.landscape),
                  fontWeight: 900,
                  color: "#FF3333",
                  letterSpacing: "0.08em",
                  fontFamily: MONO,
                }}
              >
                NET ENERGY: +150W ADDED ➔ ROOM HEATS UP!
              </span>
            </div>
          </div>

          {/* Room Thermometer Rising */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "16px 32px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span style={{ fontSize: 44 }}>🌡️</span>
            <div>
              <div style={{ fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
                ROOM TEMPERATURE RISING:
              </div>
              <div
                style={{
                  fontSize: safeFontSize(isVertical ? 48 : 36, L.landscape),
                  fontWeight: 900,
                  color: "#FF8C00",
                  fontFamily: MONO,
                }}
              >
                +{roomTemp.toFixed(1)}°C
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ---------------------------------------------------------------------------
  // VARIANT 9: Perpetual Loop Payoff Recap
  // ---------------------------------------------------------------------------
  if (variant === "loop_payoff") {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070B14",
          padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
          fontFamily: FONT,
          color: "#F8FAFC",
          overflow: "hidden",
        }}
      >
        {renderHeader("THE 4-STEP CYCLE", "09 / THE TAKEAWAY")}

        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
          }}
        >
          {/* 4 Big Icons Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
              width: isVertical ? "90%" : "70%",
              maxWidth: 720,
            }}
          >
            <div
              style={{
                padding: "20px 16px",
                borderRadius: 24,
                background: "rgba(255,50,0,0.15)",
                border: "2px solid #FF3300",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 44 }}>⚡ ⚙️</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#FF5522" }}>
                1. COMPRESS
              </div>
              <div style={{ fontSize: 16, color: "#94A3B8" }}>Electric Pump</div>
            </div>

            <div
              style={{
                padding: "20px 16px",
                borderRadius: 24,
                background: "rgba(255,140,0,0.15)",
                border: "2px solid #FF8C00",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 44 }}>♨️ 💨</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#FF8C00" }}>
                2. CONDENSE
              </div>
              <div style={{ fontSize: 16, color: "#94A3B8" }}>Dumps Heat Out</div>
            </div>

            <div
              style={{
                padding: "20px 16px",
                borderRadius: 24,
                background: "rgba(0,240,255,0.15)",
                border: "2px solid #00F0FF",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 44 }}>🔍 ❄️</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#00F0FF" }}>
                3. EXPAND
              </div>
              <div style={{ fontSize: 16, color: "#94A3B8" }}>-25°C Freeze</div>
            </div>

            <div
              style={{
                padding: "20px 16px",
                borderRadius: 24,
                background: "rgba(0,180,255,0.15)",
                border: "2px solid #00B4FF",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 44 }}>🥛 🍎</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#00B4FF" }}>
                4. EVAPORATE
              </div>
              <div style={{ fontSize: 16, color: "#94A3B8" }}>Steals Food Heat</div>
            </div>
          </div>

          {/* Follow CTA Pulse */}
          <div
            style={{
              padding: "16px 36px",
              borderRadius: 999,
              background: `linear-gradient(135deg, ${accent} 0%, #0088FF 100%)`,
              color: "#0B1020",
              fontSize: safeFontSize(isVertical ? 30 : 22, L.landscape),
              fontWeight: 900,
              letterSpacing: "0.1em",
              fontFamily: MONO,
              boxShadow: `0 0 35px ${accent}`,
            }}
          >
            SCIENCE MADE SIMPLE • FOLLOW FOR MORE!
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  return null;
};
