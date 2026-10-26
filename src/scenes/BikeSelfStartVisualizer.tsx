import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { FONT, MONO, resolveSceneTag } from "../theme";
import { RevealText } from "../Reveal";
import { getActiveVisualBeat } from "../VisualStory";

export type BikeVariant =
  | "button_and_engine"
  | "direct_wire_hazard"
  | "solenoid_relay"
  | "gear_reduction"
  | "sprag_clutch"
  | "system_telemetry"
  | "hero_outro";

export const BikeSelfStartVisualizer: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const layout = useLayout();
  const isVertical = !layout.landscape;

  const progress = frame / Math.max(durationInFrames - 1, 1);
  const activeBeat = getActiveVisualBeat(scene.beats, progress);
  const beats = scene.beats || [];
  const beatIndex = beats.findIndex((b) => b === activeBeat);
  const activeIndex = beatIndex >= 0 ? beatIndex : 0;

  // Determine variant from scene
  const rawVariant = (scene.variant || "") as BikeVariant;
  let variant: BikeVariant = "button_and_engine";
  if (
    rawVariant === "button_and_engine" ||
    rawVariant === "direct_wire_hazard" ||
    rawVariant === "solenoid_relay" ||
    rawVariant === "gear_reduction" ||
    rawVariant === "sprag_clutch" ||
    rawVariant === "system_telemetry" ||
    rawVariant === "hero_outro"
  ) {
    variant = rawVariant;
  } else {
    // Map from scene index or tag if variant is not explicitly set
    const title = (scene.title || "").toLowerCase();
    const tag = (scene.tag || "").toLowerCase();
    if (tag.includes("01") || title.includes("button") || title.includes("cold engine")) {
      variant = "button_and_engine";
    } else if (tag.includes("02") || title.includes("direct") || title.includes("hazard")) {
      variant = "direct_wire_hazard";
    } else if (tag.includes("03") || title.includes("relay") || title.includes("solenoid")) {
      variant = "solenoid_relay";
    } else if (tag.includes("04") || title.includes("gear") || title.includes("reduction") || title.includes("12x")) {
      variant = "gear_reduction";
    } else if (tag.includes("05") || title.includes("clutch") || title.includes("sprag")) {
      variant = "sprag_clutch";
    } else if (tag.includes("06") || title.includes("telemetry") || title.includes("specs")) {
      variant = "system_telemetry";
    } else {
      variant = "hero_outro";
    }
  }

  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const pulse = interpolate(frame % 30, [0, 15, 30], [0.85, 1.15, 0.85]);

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 25%, #0B1528 0%, #060B14 65%, #030509 100%)",
        padding: `${layout.padTop}px ${layout.padX}px ${layout.padBottom}px`,
        color: "#F8FAFC",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {/* Background Engineering Blueprint Grid */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.14,
          pointerEvents: "none",
        }}
      >
        <defs>
          <pattern id="bikeGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00F0FF" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="1.5" fill="#00F0FF" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bikeGrid)" />
      </svg>

      {/* Top Header */}
      <div style={{ zIndex: 20, marginBottom: isVertical ? 16 : 10, opacity: enter, flexShrink: 0 }}>
        {scene.tag && (
          <div
            style={{
              fontSize: isVertical ? 22 : 18,
              fontWeight: 800,
              letterSpacing: "0.22em",
              color: accent || "#00F0FF",
              textTransform: "uppercase",
              fontFamily: MONO,
              marginBottom: 6,
            }}
          >
            {resolveSceneTag(scene, scene.tag)}
          </div>
        )}
        <RevealText
          text={scene.title || "HOW BIKE SELF-START WORKS"}
          align="left"
          delay={3}
          style={{
            fontSize: isVertical ? 46 : 38,
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            textShadow: "0 4px 24px rgba(0,240,255,0.25)",
          }}
        />
      </div>

      {/* Word-Synchronized Visual Event Header Pill (shows active mechanical event in English) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "6px 16px",
          borderRadius: 999,
          background: "rgba(15, 23, 42, 0.85)",
          border: `1px solid ${accent}55`,
          backdropFilter: "blur(10px)",
          marginBottom: isVertical ? 16 : 10,
          alignSelf: "flex-start",
          zIndex: 20,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 10px ${accent}`,
          }}
        />
        <div
          style={{
            fontFamily: MONO,
            fontSize: isVertical ? 20 : 16,
            fontWeight: 800,
            color: "#E2E8F0",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {activeBeat?.label ||
            (variant === "button_and_engine"
              ? "0.5s FAST CRANKING"
              : variant === "direct_wire_hazard"
              ? "CURRENT OVERLOAD HAZARD"
              : variant === "solenoid_relay"
              ? "MAGNETIC RELAY BRIDGE"
              : variant === "gear_reduction"
              ? "12X TORQUE REDUCTION"
              : variant === "sprag_clutch"
              ? "ONE-WAY FREEWHEEL SLIP"
              : variant === "system_telemetry"
              ? "SYSTEM SYNCHRONIZATION"
              : "MECHANICAL MASTERCLASS")}
        </div>
      </div>

      {/* Main Dynamic Interactive Visual Container */}
      <div
        style={{
          flex: 1,
          width: "100%",
          maxHeight: isVertical ? 960 : 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        {variant === "button_and_engine" && (
          <ButtonAndEngineView
            frame={frame}
            fps={fps}
            progress={progress}
            activeIndex={activeIndex}
            accent={accent}
            isVertical={isVertical}
          />
        )}
        {variant === "direct_wire_hazard" && (
          <DirectWireHazardView
            frame={frame}
            fps={fps}
            progress={progress}
            activeIndex={activeIndex}
            accent={accent}
            isVertical={isVertical}
          />
        )}
        {variant === "solenoid_relay" && (
          <SolenoidRelayView
            frame={frame}
            fps={fps}
            progress={progress}
            activeIndex={activeIndex}
            accent={accent}
            isVertical={isVertical}
          />
        )}
        {variant === "gear_reduction" && (
          <GearReductionView
            frame={frame}
            fps={fps}
            progress={progress}
            activeIndex={activeIndex}
            accent={accent}
            isVertical={isVertical}
          />
        )}
        {variant === "sprag_clutch" && (
          <SpragClutchView
            frame={frame}
            fps={fps}
            progress={progress}
            activeIndex={activeIndex}
            accent={accent}
            isVertical={isVertical}
          />
        )}
        {variant === "system_telemetry" && (
          <SystemTelemetryView
            frame={frame}
            fps={fps}
            progress={progress}
            activeIndex={activeIndex}
            accent={accent}
            isVertical={isVertical}
          />
        )}
        {variant === "hero_outro" && (
          <HeroOutroView
            frame={frame}
            fps={fps}
            progress={progress}
            activeIndex={activeIndex}
            accent={accent}
            isVertical={isVertical}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};

/* =========================================================================
   SCENE 1: BUTTON AND ENGINE VIEW
   Shows: Red handlebar starter button pressed by thumb -> 1.5A pulse -> Piston and engine block cranking at 450 RPM in 0.5s
   ========================================================================= */
const ButtonAndEngineView: React.FC<{
  frame: number;
  fps: number;
  progress: number;
  activeIndex: number;
  accent: string;
  isVertical: boolean;
}> = ({ frame, fps, progress, activeIndex, accent, isVertical }) => {
  // Beat 0: Button pressed, wire pulses
  // Beat 1: Engine piston cranks and fires up in 0.5s
  const isButtonPressed = progress > 0.08;
  const buttonY = isButtonPressed ? 16 : 0;
  const signalOffset = (frame * 12) % 40;

  // Crankshaft and piston movement
  const isEngineCranking = progress >= 0.42;
  const crankAngle = isEngineCranking ? frame * 18 : 0;
  const pistonY = isEngineCranking ? Math.sin((crankAngle * Math.PI) / 180) * 45 : 0;
  const rpmValue = isEngineCranking
    ? Math.round(interpolate(progress, [0.42, 0.75, 1.0], [0, 420, 500], { extrapolateRight: "clamp" }))
    : 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
      }}
    >
      {/* LEFT / TOP PANEL: HANDLEBAR SWITCHGEAR & RED BUTTON */}
      <div
        style={{
          flex: 1,
          width: "100%",
          height: isVertical ? "48%" : "100%",
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(14px)",
          borderRadius: 24,
          border: `1px solid ${isButtonPressed ? accent : "rgba(255, 255, 255, 0.15)"}`,
          boxShadow: isButtonPressed ? `0 0 30px ${accent}33` : "none",
          padding: 24,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 20,
            fontFamily: MONO,
            fontSize: 20,
            fontWeight: 800,
            color: accent,
            letterSpacing: "0.1em",
          }}
        >
          HANDLEBAR SWITCHGEAR (1.5A CONTROL)
        </div>

        <svg viewBox="0 0 400 300" style={{ width: "85%", height: "85%" }}>
          <defs>
            <linearGradient id="btnGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="70%" stopColor="#B91C1C" />
              <stop offset="100%" stopColor="#7F1D1D" />
            </linearGradient>
            <filter id="btnGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Motorcycle Handlebar Tube */}
          <rect x="20" y="125" width="360" height="50" rx="10" fill="#1E293B" stroke="#475569" strokeWidth="4" />
          {/* Switchgear Housing Box */}
          <rect x="130" y="70" width="140" height="160" rx="16" fill="#0F172A" stroke="#334155" strokeWidth="4" />

          {/* Red Starter Button Bezel */}
          <rect x="155" y="100" width="90" height="90" rx="45" fill="#1E293B" stroke="#475569" strokeWidth="3" />

          {/* RED BUTTON (Animates down when pressed) */}
          <g transform={`translate(0, ${buttonY})`}>
            <circle
              cx="200"
              cy="145"
              r="36"
              fill="url(#btnGrad)"
              stroke="#FCA5A5"
              strokeWidth={isButtonPressed ? "4" : "2"}
              filter={isButtonPressed ? "url(#btnGlow)" : undefined}
            />
            {/* Electrical lightning icon inside button */}
            <path
              d="M198 127 L190 145 L202 145 L196 163 L212 141 L200 141 Z"
              fill="#FFFFFF"
              opacity={isButtonPressed ? 1 : 0.7}
            />
          </g>

          {/* Signal Wire coming out to relay */}
          <path
            d="M 270 170 L 370 170"
            fill="none"
            stroke={isButtonPressed ? accent : "#475569"}
            strokeWidth="6"
            strokeDasharray={isButtonPressed ? "10 8" : undefined}
            strokeDashoffset={isButtonPressed ? -signalOffset : 0}
          />

          {isButtonPressed && (
            <text x="320" y="155" fill={accent} fontSize="14" fontWeight="800" fontFamily={MONO} textAnchor="middle">
              1.5A SIGNAL →
            </text>
          )}

          {/* Thumb Indicator Badge */}
          {isButtonPressed && (
            <g transform="translate(140, 225)">
              <rect x="0" y="0" width="120" height="28" rx="8" fill="rgba(0, 240, 255, 0.2)" stroke={accent} strokeWidth="1.5" />
              <text x="60" y="19" fill="#00F0FF" fontSize="12" fontWeight="800" fontFamily={MONO} textAnchor="middle">
                THUMB PRESSED
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* RIGHT / BOTTOM PANEL: HEAVY ENGINE BLOCK CRANKING */}
      <div
        style={{
          flex: 1,
          width: "100%",
          height: isVertical ? "48%" : "100%",
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(14px)",
          borderRadius: 24,
          border: `1px solid ${isEngineCranking ? "#10B981" : "rgba(255, 255, 255, 0.15)"}`,
          boxShadow: isEngineCranking ? "0 0 30px rgba(16, 185, 129, 0.25)" : "none",
          padding: 24,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 20,
            fontFamily: MONO,
            fontSize: 20,
            fontWeight: 800,
            color: isEngineCranking ? "#10B981" : "#94A3B8",
            letterSpacing: "0.1em",
          }}
        >
          ENGINE CYLINDER CRANKING (0.5s TARGET)
        </div>

        {/* Tachometer Overlay */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 32, fontWeight: 900, color: isEngineCranking ? "#10B981" : "#64748B" }}>
            {rpmValue} RPM
          </div>
          <div style={{ fontFamily: MONO, fontSize: 13, color: "#94A3B8", fontWeight: 700 }}>
            CRANK SPEED
          </div>
        </div>

        <svg viewBox="0 0 400 300" style={{ width: "85%", height: "85%" }}>
          {/* Cylinder Bore Wall */}
          <rect x="130" y="40" width="140" height="150" fill="#0A0F1D" stroke="#334155" strokeWidth="6" />
          {/* Spark plug at top */}
          <rect x="185" y="20" width="30" height="25" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />

          {/* PISTON (Moving up and down) */}
          <g transform={`translate(0, ${pistonY + 40})`}>
            {/* Piston Crown */}
            <rect x="136" y="45" width="128" height="60" rx="8" fill="#475569" stroke="#94A3B8" strokeWidth="3" />
            {/* Compression Ring slots */}
            <line x1="136" y1="58" x2="264" y2="58" stroke="#0F172A" strokeWidth="3" />
            <line x1="136" y1="68" x2="264" y2="68" stroke="#0F172A" strokeWidth="3" />
            {/* Wrist Pin */}
            <circle cx="200" cy="80" r="10" fill="#94A3B8" />

            {/* Connecting Rod */}
            <line
              x1="200"
              y1="80"
              x2={200 + Math.sin((crankAngle * Math.PI) / 180) * 35}
              y2={190 + Math.cos((crankAngle * Math.PI) / 180) * 35}
              stroke="#64748B"
              strokeWidth="10"
              strokeLinecap="round"
            />
          </g>

          {/* Crankshaft Center */}
          <circle cx="200" cy="230" r="30" fill="#1E293B" stroke="#475569" strokeWidth="6" />
          {/* Rotating Crank Pin */}
          <circle
            cx={200 + Math.sin((crankAngle * Math.PI) / 180) * 35}
            cy={230 + Math.cos((crankAngle * Math.PI) / 180) * 35}
            r="12"
            fill="#10B981"
          />

          {isEngineCranking && (
            <text x="200" y="290" fill="#10B981" fontSize="14" fontWeight="800" fontFamily={MONO} textAnchor="middle">
              ✓ 500 RPM CRANKING ACTIVE (0.5 SEC)
            </text>
          )}
        </svg>
      </div>
    </div>
  );
};

/* =========================================================================
   SCENE 2: DIRECT WIRE HAZARD VIEW
   Shows: Split screen - Left: Thin wire burning at 80A -> Right: Heavy Relay safely isolating
   ========================================================================= */
const DirectWireHazardView: React.FC<{
  frame: number;
  fps: number;
  progress: number;
  activeIndex: number;
  accent: string;
  isVertical: boolean;
}> = ({ frame, fps, progress, activeIndex, accent, isVertical }) => {
  const isMelting = progress > 0.45;
  const heatFlicker = (frame % 8) * 12;
  const currentAmp = Math.round(interpolate(progress, [0.1, 0.5, 1.0], [1.5, 65, 80], { extrapolateRight: "clamp" }));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
      }}
    >
      {/* LEFT: FATAL HAZARD (DIRECT WIRING) */}
      <div
        style={{
          flex: 1,
          width: "100%",
          height: isVertical ? "48%" : "100%",
          background: "rgba(30, 10, 15, 0.78)",
          backdropFilter: "blur(14px)",
          borderRadius: 24,
          border: `2px solid ${isMelting ? "#EF4444" : "rgba(239, 68, 68, 0.3)"}`,
          boxShadow: isMelting ? "0 0 35px rgba(239, 68, 68, 0.4)" : "none",
          padding: 24,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 20,
            fontFamily: MONO,
            fontSize: 20,
            fontWeight: 900,
            color: "#EF4444",
            letterSpacing: "0.1em",
          }}
        >
          ✕ DIRECT WIRING (FATAL HAZARD)
        </div>

        <div
          style={{
            position: "absolute",
            top: 16,
            right: 20,
            fontFamily: MONO,
            fontSize: 32,
            fontWeight: 900,
            color: "#EF4444",
          }}
        >
          {currentAmp} AMPS
        </div>

        <svg viewBox="0 0 400 280" style={{ width: "85%", height: "85%" }}>
          {/* Button switch */}
          <rect x="40" y="100" width="70" height="70" rx="14" fill="#0F172A" stroke="#EF4444" strokeWidth="3" />
          <circle cx="75" cy="135" r="20" fill="#EF4444" />
          <text x="75" y="195" fill="#EF4444" fontSize="13" fontWeight="800" fontFamily={MONO} textAnchor="middle">
            SWITCH
          </text>

          {/* Thin 18-AWG Wire */}
          <path
            d="M 110 135 C 170 135, 230 135, 290 135"
            fill="none"
            stroke={isMelting ? "#FF7700" : "#94A3B8"}
            strokeWidth={isMelting ? "8" : "3"}
            strokeLinecap="round"
          />

          {/* Spark and Melting Burst */}
          {isMelting && (
            <g transform="translate(200, 135)">
              <circle cx="0" cy="0" r="24" fill="#EF4444" opacity="0.35" />
              <circle cx="0" cy="0" r="14" fill="#FFAA00" opacity="0.8" />
              <line x1="-20" y1="-20" x2="20" y2="20" stroke="#FFFFFF" strokeWidth="3" />
              <line x1="-20" y1="20" x2="20" y2="-20" stroke="#FFFFFF" strokeWidth="3" />
              <text x="0" y="-30" fill="#EF4444" fontSize="16" fontWeight="900" fontFamily={MONO} textAnchor="middle">
                🔥 CRITICAL BURNOUT!
              </text>
            </g>
          )}

          {/* Starter Motor Block */}
          <rect x="290" y="85" width="80" height="100" rx="16" fill="#1E293B" stroke="#475569" strokeWidth="4" />
          <text x="330" y="142" fill="#E2E8F0" fontSize="14" fontWeight="800" fontFamily={MONO} textAnchor="middle">
            MOTOR
          </text>
        </svg>
      </div>

      {/* RIGHT: SAFE RELAY ISOLATION */}
      <div
        style={{
          flex: 1,
          width: "100%",
          height: isVertical ? "48%" : "100%",
          background: "rgba(10, 25, 20, 0.78)",
          backdropFilter: "blur(14px)",
          borderRadius: 24,
          border: "2px solid #10B981",
          boxShadow: "0 0 35px rgba(16, 185, 129, 0.25)",
          padding: 24,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 20,
            fontFamily: MONO,
            fontSize: 20,
            fontWeight: 900,
            color: "#10B981",
            letterSpacing: "0.1em",
          }}
        >
          ✓ RELAY ISOLATION (SAFE DESIGN)
        </div>

        <div
          style={{
            position: "absolute",
            top: 16,
            right: 20,
            fontFamily: MONO,
            fontSize: 32,
            fontWeight: 900,
            color: "#10B981",
          }}
        >
          1.5A SWITCH
        </div>

        <svg viewBox="0 0 400 280" style={{ width: "85%", height: "85%" }}>
          {/* Button */}
          <rect x="30" y="70" width="60" height="60" rx="12" fill="#0F172A" stroke="#10B981" strokeWidth="3" />
          <circle cx="60" cy="100" r="16" fill="#10B981" />
          <text x="60" y="150" fill="#10B981" fontSize="12" fontWeight="800" fontFamily={MONO} textAnchor="middle">
            1.5A SWITCH
          </text>

          {/* Thin Safe Wire */}
          <line x1="90" y1="100" x2="160" y2="100" stroke="#10B981" strokeWidth="4" />

          {/* Starter Solenoid Relay Box */}
          <rect x="160" y="55" width="100" height="150" rx="16" fill="#1E293B" stroke="#10B981" strokeWidth="3" />
          <text x="210" y="90" fill="#10B981" fontSize="13" fontWeight="900" fontFamily={MONO} textAnchor="middle">
            RELAY COIL
          </text>
          <text x="210" y="150" fill="#FFFFFF" fontSize="11" fontWeight="700" fontFamily={MONO} textAnchor="middle">
            HEAVY COPPER
          </text>

          {/* Thick 80A Battery Cable into Relay */}
          <path d="M 210 240 L 210 180" stroke="#F59E0B" strokeWidth="12" strokeLinecap="round" />
          <text x="210" y="260" fill="#F59E0B" fontSize="13" fontWeight="800" fontFamily={MONO} textAnchor="middle">
            12V BATTERY (80A)
          </text>

          {/* Thick 80A Cable to Motor */}
          <path d="M 260 140 L 310 140" stroke="#F59E0B" strokeWidth="12" strokeLinecap="round" />

          {/* Motor */}
          <rect x="310" y="95" width="70" height="90" rx="14" fill="#0F172A" stroke="#F59E0B" strokeWidth="3" />
          <text x="345" y="150" fill="#FFFFFF" fontSize="13" fontWeight="800" fontFamily={MONO} textAnchor="middle">
            MOTOR
          </text>
        </svg>
      </div>
    </div>
  );
};

/* =========================================================================
   SCENE 3: STARTER RELAY (SOLENOID) DETAILED CUTAWAY
   Shows: 1.5A Coil energizes -> Magnetic Plunger pulls down -> Bridges 60A Battery studs to Motor
   ========================================================================= */
const SolenoidRelayView: React.FC<{
  frame: number;
  fps: number;
  progress: number;
  activeIndex: number;
  accent: string;
  isVertical: boolean;
}> = ({ frame, fps, progress, activeIndex, accent, isVertical }) => {
  // Beat 0: 1.5A signal arrives
  // Beat 1: Plunger snaps down
  // Beat 2: 60A current surges
  const isCoilEnergized = progress >= 0.15;
  const isPlungerClosed = progress >= 0.45;
  const plungerY = isPlungerClosed ? 42 : 0;
  const flowOffset = (frame * 14) % 36;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: isVertical ? 960 : 880,
        height: "100%",
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(14px)",
        borderRadius: 24,
        border: "1px solid rgba(0, 240, 255, 0.3)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        padding: 24,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 20,
          fontFamily: MONO,
          fontSize: 22,
          fontWeight: 900,
          color: accent,
          letterSpacing: "0.1em",
        }}
      >
        SOLENOID RELAY INTERNAL CUTAWAY
      </div>

      <div
        style={{
          position: "absolute",
          top: 16,
          right: 20,
          fontFamily: MONO,
          fontSize: 26,
          fontWeight: 900,
          color: isPlungerClosed ? "#10B981" : "#F59E0B",
        }}
      >
        {isPlungerClosed ? "60A CONTACT CLOSED" : "1.5A COIL ENERGIZED"}
      </div>

      <svg viewBox="0 0 600 450" style={{ width: "95%", height: "90%" }}>
        <defs>
          <linearGradient id="copperGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>

        {/* Outer Solenoid Steel Casing */}
        <rect x="180" y="60" width="240" height="320" rx="28" fill="#0B132B" stroke="#475569" strokeWidth="6" />

        {/* Thin 1.5A Control Terminal at Top */}
        <line x1="300" y1="10" x2="300" y2="60" stroke={accent} strokeWidth="6" />
        <text x="300" y="35" fill={accent} fontSize="14" fontWeight="800" fontFamily={MONO} textAnchor="middle">
          1.5A FROM BUTTON
        </text>

        {/* Electromagnetic Copper Windings (Coil) */}
        <g opacity={isCoilEnergized ? 1 : 0.4}>
          <rect x="210" y="100" width="40" height="150" rx="8" fill="#B45309" stroke="#F59E0B" strokeWidth="2" />
          <rect x="350" y="100" width="40" height="150" rx="8" fill="#B45309" stroke="#F59E0B" strokeWidth="2" />
          {/* Coil winding lines */}
          {Array.from({ length: 12 }).map((_, i) => (
            <React.Fragment key={i}>
              <line x1="210" y1={110 + i * 11} x2="250" y2={110 + i * 11} stroke="#FDE68A" strokeWidth="2" />
              <line x1="350" y1={110 + i * 11} x2="390" y2={110 + i * 11} stroke="#FDE68A" strokeWidth="2" />
            </React.Fragment>
          ))}
          <text x="300" y="130" fill="#F59E0B" fontSize="13" fontWeight="800" fontFamily={MONO} textAnchor="middle">
            MAGNETIC COIL
          </text>
        </g>

        {/* MOVABLE IRON PLUNGER & COPPER CONTACT PLATE */}
        <g transform={`translate(0, ${plungerY})`}>
          {/* Iron Shaft */}
          <rect x="288" y="110" width="24" height="130" rx="6" fill="#94A3B8" stroke="#CBD5E1" strokeWidth="3" />
          {/* Heavy Copper Contact Disc */}
          <rect x="220" y="240" width="160" height="22" rx="6" fill="url(#copperGrad)" stroke="#F59E0B" strokeWidth="3" />
          <text x="300" y="256" fill="#000000" fontSize="12" fontWeight="900" fontFamily={MONO} textAnchor="middle">
            HEAVY COPPER PLATE
          </text>
        </g>

        {/* Two Fixed Massive Brass Terminals at Bottom */}
        {/* Terminal A: 12V Battery IN */}
        <rect x="200" y="280" width="55" height="35" rx="8" fill="#F59E0B" stroke="#D97706" strokeWidth="3" />
        <line x1="120" y1="298" x2="200" y2="298" stroke="#F59E0B" strokeWidth="14" strokeLinecap="round" />
        <text x="100" y="303" fill="#F59E0B" fontSize="14" fontWeight="800" fontFamily={MONO} textAnchor="end">
          BATTERY 12V (60A) →
        </text>

        {/* Terminal B: Motor OUT */}
        <rect x="345" y="280" width="55" height="35" rx="8" fill="#F59E0B" stroke="#D97706" strokeWidth="3" />
        <line x1="400" y1="298" x2="480" y2="298" stroke="#F59E0B" strokeWidth="14" strokeLinecap="round" />
        <text x="490" y="303" fill="#F59E0B" fontSize="14" fontWeight="800" fontFamily={MONO} textAnchor="start">
          → TO STARTER MOTOR
        </text>

        {/* High current flood path when contacts touch */}
        {isPlungerClosed && (
          <path
            d="M 120 298 L 480 298"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeDasharray="14 10"
            strokeDashoffset={-flowOffset}
          />
        )}
      </svg>
    </div>
  );
};

/* =========================================================================
   SCENE 4: 12X GEAR REDUCTION VIEW
   Shows: 6,000 RPM Starter Motor -> 12:1 Reduction Gear -> 500 RPM Crankshaft (12X Torque Boost)
   ========================================================================= */
const GearReductionView: React.FC<{
  frame: number;
  fps: number;
  progress: number;
  activeIndex: number;
  accent: string;
  isVertical: boolean;
}> = ({ frame, fps, progress, activeIndex, accent, isVertical }) => {
  const motorRotation = frame * 24;
  const gearRotation = -frame * 2;
  const isTorqueBoosted = progress >= 0.55;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: isVertical ? 960 : 880,
        height: "100%",
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(14px)",
        borderRadius: 24,
        border: "1px solid rgba(0, 240, 255, 0.3)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        padding: 24,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 20,
          fontFamily: MONO,
          fontSize: 22,
          fontWeight: 900,
          color: accent,
          letterSpacing: "0.1em",
        }}
      >
        12:1 PLANETARY GEAR REDUCTION
      </div>

      <div
        style={{
          position: "absolute",
          top: 16,
          right: 20,
          fontFamily: MONO,
          fontSize: 32,
          fontWeight: 900,
          color: "#F59E0B",
        }}
      >
        12X TORQUE BOOST
      </div>

      <svg viewBox="0 0 600 400" style={{ width: "95%", height: "85%" }}>
        {/* Pinion Gear (Small 10-tooth, 6000 RPM) */}
        <g transform="translate(180, 200)">
          <g transform={`rotate(${motorRotation})`}>
            <circle cx="0" cy="0" r="45" fill="#1E293B" stroke="#00F0FF" strokeWidth="6" />
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={i} x1="-45" y1="0" x2="45" y2="0" stroke="#00F0FF" strokeWidth="4" transform={`rotate(${i * 45})`} />
            ))}
          </g>
          <text x="0" y="80" fill="#00F0FF" fontSize="16" fontWeight="900" fontFamily={MONO} textAnchor="middle">
            MOTOR PINION
          </text>
          <text x="0" y="102" fill="#94A3B8" fontSize="14" fontWeight="800" fontFamily={MONO} textAnchor="middle">
            6,000 RPM (LOW TORQUE)
          </text>
        </g>

        {/* Arrow showing mesh */}
        <path d="M 240 200 L 290 200" stroke="#F59E0B" strokeWidth="6" markerEnd="url(#arrow)" />

        {/* Large Engine Ring Gear (120-tooth, 500 RPM) */}
        <g transform="translate(420, 200)">
          <g transform={`rotate(${gearRotation})`}>
            <circle cx="0" cy="0" r="110" fill="#0F172A" stroke="#F59E0B" strokeWidth="8" />
            {Array.from({ length: 16 }).map((_, i) => (
              <line key={i} x1="-110" y1="0" x2="110" y2="0" stroke="#F59E0B" strokeWidth="3" transform={`rotate(${i * 22.5})`} />
            ))}
            <circle cx="0" cy="0" r="40" fill="#1E293B" stroke="#94A3B8" strokeWidth="4" />
          </g>
          <text x="0" y="145" fill="#F59E0B" fontSize="18" fontWeight="900" fontFamily={MONO} textAnchor="middle">
            ENGINE RING GEAR
          </text>
          <text x="0" y="170" fill="#10B981" fontSize="15" fontWeight="800" fontFamily={MONO} textAnchor="middle">
            500 RPM (12X HEAVY TORQUE)
          </text>
        </g>
      </svg>
    </div>
  );
};

/* =========================================================================
   SCENE 5: ONE-WAY SPRAG CLUTCH VIEW
   Shows: Cranking wedge (motor drives engine) -> Engine fires at 1400 RPM -> Rollers slip freely (<5ms) to prevent 17,000 RPM burst
   ========================================================================= */
const SpragClutchView: React.FC<{
  frame: number;
  fps: number;
  progress: number;
  activeIndex: number;
  accent: string;
  isVertical: boolean;
}> = ({ frame, fps, progress, activeIndex, accent, isVertical }) => {
  const isEngineFiring = progress >= 0.45;
  const innerRpm = isEngineFiring ? 1400 : 450;
  const outerRpm = isEngineFiring ? 0 : 450;
  const innerAngle = frame * (isEngineFiring ? 16 : 4);
  const outerAngle = isEngineFiring ? 0 : frame * 4;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: isVertical ? 960 : 880,
        height: "100%",
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(14px)",
        borderRadius: 24,
        border: "1px solid rgba(0, 240, 255, 0.3)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        padding: 24,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 20,
          fontFamily: MONO,
          fontSize: 22,
          fontWeight: 900,
          color: accent,
          letterSpacing: "0.1em",
        }}
      >
        ONE-WAY SPRAG CLUTCH DISENGAGEMENT
      </div>

      <div
        style={{
          position: "absolute",
          top: 16,
          right: 20,
          fontFamily: MONO,
          fontSize: 24,
          fontWeight: 900,
          color: isEngineFiring ? "#10B981" : "#F59E0B",
        }}
      >
        {isEngineFiring ? "FREEWHEELING (0 RPM BACKDRIVE)" : "WEDGED (MOTOR CRANKS ENGINE)"}
      </div>

      <svg viewBox="0 0 600 400" style={{ width: "95%", height: "85%" }}>
        {/* Outer Race (Driven by starter) */}
        <g transform="translate(300, 200)">
          <g transform={`rotate(${outerAngle})`}>
            <circle cx="0" cy="0" r="140" fill="none" stroke="#475569" strokeWidth="16" />
          </g>

          {/* Inner Race (Engine Crankshaft) */}
          <g transform={`rotate(${innerAngle})`}>
            <circle cx="0" cy="0" r="75" fill="#1E293B" stroke="#00F0FF" strokeWidth="8" />
            <circle cx="0" cy="0" r="24" fill="#0F172A" stroke="#94A3B8" strokeWidth="4" />
          </g>

          {/* Sprag Rollers positioned in between races */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const rx = Math.cos(angle) * 108;
            const ry = Math.sin(angle) * 108;
            return (
              <g key={i} transform={`translate(${rx}, ${ry})`}>
                <ellipse
                  cx="0"
                  cy="0"
                  rx="14"
                  ry="9"
                  fill={isEngineFiring ? "#10B981" : "#EF4444"}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  transform={isEngineFiring ? "rotate(25)" : "rotate(-15)"}
                />
              </g>
            );
          })}

          <text x="0" y="175" fill="#E2E8F0" fontSize="16" fontWeight="900" fontFamily={MONO} textAnchor="middle">
            {isEngineFiring ? "ENGINE AT 1,400 RPM → ROLLERS SLIP IN < 5ms" : "CRANKING → ROLLERS WEDGED"}
          </text>
        </g>
      </svg>
    </div>
  );
};

/* =========================================================================
   SCENE 6: SYSTEM TELEMETRY BENTO VIEW
   Shows: 4 active telemetry cards updating in live sync
   ========================================================================= */
const SystemTelemetryView: React.FC<{
  frame: number;
  fps: number;
  progress: number;
  activeIndex: number;
  accent: string;
  isVertical: boolean;
}> = ({ frame, fps, progress, activeIndex, accent, isVertical }) => {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: isVertical ? 960 : 880,
        height: "100%",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}
    >
      {/* Card 1: Cranking Current */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(14px)",
          borderRadius: 20,
          border: `1px solid ${accent}`,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 18, color: accent, fontWeight: 800 }}>CRANKING CURRENT</div>
        <div style={{ fontFamily: MONO, fontSize: 48, fontWeight: 900, color: "#FFFFFF" }}>50 - 80A</div>
        <div style={{ fontFamily: MONO, fontSize: 14, color: "#10B981", fontWeight: 700 }}>✓ HEAVY COPPER RELAY</div>
      </div>

      {/* Card 2: Gear Reduction */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(14px)",
          borderRadius: 20,
          border: "1px solid #F59E0B",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 18, color: "#F59E0B", fontWeight: 800 }}>GEAR REDUCTION</div>
        <div style={{ fontFamily: MONO, fontSize: 48, fontWeight: 900, color: "#FFFFFF" }}>12 : 1</div>
        <div style={{ fontFamily: MONO, fontSize: 14, color: "#F59E0B", fontWeight: 700 }}>✓ 6000 TO 500 RPM</div>
      </div>

      {/* Card 3: Cranking Duration */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(14px)",
          borderRadius: 20,
          border: "1px solid #10B981",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 18, color: "#10B981", fontWeight: 800 }}>CRANKING TIME</div>
        <div style={{ fontFamily: MONO, fontSize: 48, fontWeight: 900, color: "#10B981" }}>0.5 SEC</div>
        <div style={{ fontFamily: MONO, fontSize: 14, color: "#10B981", fontWeight: 700 }}>✓ RAPID START</div>
      </div>

      {/* Card 4: Safety Interlocks */}
      <div
        style={{
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(14px)",
          borderRadius: 20,
          border: "1px solid #38BDF8",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: 18, color: "#38BDF8", fontWeight: 800 }}>SAFETY INTERLOCKS</div>
        <div style={{ fontFamily: MONO, fontSize: 32, fontWeight: 900, color: "#FFFFFF" }}>STAND & NEUTRAL</div>
        <div style={{ fontFamily: MONO, fontSize: 14, color: "#38BDF8", fontWeight: 700 }}>✓ PREVENT GEAR ACCIDENT</div>
      </div>
    </div>
  );
};

/* =========================================================================
   SCENE 7: HERO OUTRO VIEW
   Shows: Roaring bike payoff & Subscribe channel CTA
   ========================================================================= */
const HeroOutroView: React.FC<{
  frame: number;
  fps: number;
  progress: number;
  activeIndex: number;
  accent: string;
  isVertical: boolean;
}> = ({ frame, fps, progress, activeIndex, accent, isVertical }) => {
  const bellShake = Math.sin(frame * 0.6) * 12;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: isVertical ? 960 : 880,
        height: "100%",
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(14px)",
        borderRadius: 24,
        border: "1px solid rgba(0, 240, 255, 0.3)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        padding: 32,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 24,
          color: accent,
          fontWeight: 800,
          letterSpacing: "0.2em",
          marginBottom: 16,
        }}
      >
        FROM THUMB TO ROAR IN 500 MILLISECONDS
      </div>

      <div
        style={{
          fontSize: isVertical ? 54 : 44,
          fontWeight: 900,
          color: "#FFFFFF",
          lineHeight: 1.1,
          marginBottom: 24,
        }}
      >
        MECHANICAL MASTERY
      </div>

      {/* Subscription CTA Badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 16,
          background: "linear-gradient(90deg, #EF4444 0%, #DC2626 100%)",
          padding: "16px 36px",
          borderRadius: 999,
          boxShadow: "0 10px 30px rgba(239, 68, 68, 0.5)",
          transform: `scale(${1 + Math.sin(frame * 0.1) * 0.04})`,
        }}
      >
        <span style={{ fontSize: 28, transform: `rotate(${bellShake}deg)` }}>🔔</span>
        <span style={{ fontSize: 26, fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.05em" }}>
          SUBSCRIBE TO RAJAN KA ADDA
        </span>
      </div>
    </div>
  );
};
