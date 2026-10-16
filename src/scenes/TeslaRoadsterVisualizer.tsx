import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { FONT, MONO, resolveSceneTag } from "../theme";
import { RevealText } from "../Reveal";

type Variant = "cutaway" | "physics";

export const TeslaRoadsterVisualizer: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const layout = useLayout();
  const isVertical = !layout.landscape;

  const variant = (scene.variant as Variant) || "cutaway";
  const title = scene.title || (variant === "cutaway" ? "INSIDE THE ROCKET CAR" : "HOW COLD GAS THRUSTERS WORK");
  const tag = resolveSceneTag(scene, variant === "cutaway" ? "04 / ROCKET PACKAGING" : "05 / SUPERSONIC THRUST");

  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const pulse = interpolate(frame % 30, [0, 15, 30], [0.85, 1.15, 0.85]);
  const gasFlow = (frame * 6) % 36;
  const thrusterBlast = interpolate(frame % 20, [0, 5, 20], [0.6, 1.2, 0.7]);

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 30%, #111C33 0%, #070B14 70%, #04060A 100%)",
        padding: `${layout.padTop}px ${layout.padX}px ${layout.padBottom}px`,
        color: "#F8FAFC",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {/* Background Aerospace Grid Lines */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.12,
          pointerEvents: "none",
        }}
      >
        <defs>
          <pattern id="aerospaceGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00F0FF" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="1.5" fill="#00F0FF" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#aerospaceGrid)" />
      </svg>

      {/* Top Header */}
      <div style={{ zIndex: 10, marginBottom: isVertical ? 20 : 12, opacity: enter }}>
        {tag && (
          <div
            style={{
              fontSize: isVertical ? 20 : 16,
              fontWeight: 800,
              letterSpacing: "0.22em",
              color: accent || "#00F0FF",
              textTransform: "uppercase",
              fontFamily: MONO,
              marginBottom: 8,
            }}
          >
            {tag}
          </div>
        )}
        <RevealText
          text={title}
          align="left"
          delay={4}
          style={{
            fontSize: isVertical ? 46 : 38,
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            textShadow: "0 4px 24px rgba(0,240,255,0.25)",
          }}
        />
      </div>

      {/* Main Interactive Diagram View */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 5,
        }}
      >
        {variant === "cutaway" ? (
          /* =========================================================================
             VARIANT 1: TESLA ROADSTER CUTAWAY PACKAGING
             Shows: Battery Skateboard, Removed Rear Seats, Glowing 10,000 PSI COPV Tank,
             and 10 Cold Gas Thruster Nozzles with firing vectors!
             ========================================================================= */
          <div
            style={{
              width: "100%",
              maxWidth: isVertical ? 980 : 880,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* SVG Car Cutaway Schematic */}
            <div
              style={{
                width: "100%",
                height: isVertical ? 580 : 420,
                position: "relative",
                background: "rgba(15, 23, 42, 0.65)",
                backdropFilter: "blur(12px)",
                borderRadius: 24,
                border: "1px solid rgba(0, 240, 255, 0.25)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.6), inset 0 0 30px rgba(0,240,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <svg viewBox="0 0 900 500" style={{ width: "95%", height: "95%" }}>
                <defs>
                  {/* Glowing gradients */}
                  <linearGradient id="copvGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#0072FF" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0A192F" stopOpacity="0.95" />
                  </linearGradient>

                  <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#E82127" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#B31419" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#800D11" stopOpacity="0.95" />
                  </linearGradient>

                  <linearGradient id="jetPlume" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                    <stop offset="25%" stopColor="#00F0FF" stopOpacity="0.85" />
                    <stop offset="70%" stopColor="#0072FF" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
                  </linearGradient>

                  <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Ground Line */}
                <line x1="40" y1="410" x2="860" y2="410" stroke="#334155" strokeWidth="2" strokeDasharray="8 6" />

                {/* CAR CHASSIS & AERODYNAMIC BODY CUTAWAY */}
                {/* Wheels */}
                {/* Front Wheel */}
                <g transform="translate(230, 370)">
                  <circle cx="0" cy="0" r="48" fill="#0F172A" stroke="#475569" strokeWidth="6" />
                  <circle cx="0" cy="0" r="32" fill="#1E293B" stroke="#64748B" strokeWidth="3" />
                  <circle cx="0" cy="0" r="14" fill="#E82127" />
                  <line x1="-28" y1="0" x2="28" y2="0" stroke="#94A3B8" strokeWidth="3" />
                  <line x1="0" y1="-28" x2="0" y2="28" stroke="#94A3B8" strokeWidth="3" />
                </g>

                {/* Rear Wheel */}
                <g transform="translate(670, 370)">
                  <circle cx="0" cy="0" r="50" fill="#0F172A" stroke="#475569" strokeWidth="6" />
                  <circle cx="0" cy="0" r="34" fill="#1E293B" stroke="#64748B" strokeWidth="3" />
                  <circle cx="0" cy="0" r="14" fill="#E82127" />
                  <line x1="-30" y1="0" x2="30" y2="0" stroke="#94A3B8" strokeWidth="3" />
                  <line x1="0" y1="-30" x2="0" y2="30" stroke="#94A3B8" strokeWidth="3" />
                </g>

                {/* Underbody Battery Pack (Skateboard) */}
                <rect x="290" y="365" width="320" height="26" rx="6" fill="#1E293B" stroke="#00F0FF" strokeWidth="2" />
                <text x="450" y="382" fill="#00F0FF" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily={MONO}>
                  200 kWh STRUCTURAL BATTERY PACK
                </text>

                {/* Translucent Aerodynamic Outer Body Silhouette */}
                <path
                  d="M 120 370 Q 140 330 200 325 Q 260 320 340 280 Q 420 220 520 220 Q 640 220 730 280 Q 770 300 810 330 Q 830 350 830 375 L 750 375 Q 730 320 670 320 Q 610 320 590 375 L 310 375 Q 290 320 230 320 Q 170 320 150 375 Z"
                  fill="url(#carBodyGrad)"
                  fillOpacity="0.28"
                  stroke="#E82127"
                  strokeWidth="3.5"
                />

                {/* Cockpit Canopy glass */}
                <path
                  d="M 350 280 Q 430 228 520 228 Q 620 228 700 280 Z"
                  fill="rgba(0, 240, 255, 0.08)"
                  stroke="rgba(0, 240, 255, 0.6)"
                  strokeWidth="2"
                />

                {/* Front Seats (Driver Cabin) */}
                <g transform="translate(420, 270)">
                  <path d="M 0 50 L 20 10 L 40 10 L 35 50 Z" fill="#334155" stroke="#64748B" strokeWidth="2" />
                  <circle cx="30" cy="-5" r="8" fill="#475569" />
                  <text x="25" y="75" fill="#94A3B8" fontSize="10" fontWeight="700" textAnchor="middle" fontFamily={MONO}>
                    FRONT SEAT
                  </text>
                </g>

                {/* REMOVED REAR SEATS ALERT BOX */}
                <rect x="520" y="255" width="165" height="105" rx="10" fill="rgba(239, 68, 68, 0.12)" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 4" />
                <text x="602" y="272" fill="#EF4444" fontSize="10" fontWeight="800" textAnchor="middle" fontFamily={MONO}>
                  ⚠ REAR SEATS REMOVED
                </text>

                {/* 10,000 PSI COPV TANK (Composite Overwrapped Pressure Vessel) */}
                <g transform="translate(530, 280)">
                  {/* Tank Body Cylinder */}
                  <rect
                    x="0"
                    y="0"
                    width="145"
                    height="72"
                    rx="24"
                    fill="url(#copvGrad)"
                    stroke="#00F0FF"
                    strokeWidth="3"
                    filter="url(#neonGlow)"
                  />
                  {/* Carbon Fiber Wrap Banding Rings */}
                  <line x1="36" y1="0" x2="36" y2="72" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.5" />
                  <line x1="72" y1="0" x2="72" y2="72" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.5" />
                  <line x1="108" y1="0" x2="108" y2="72" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.5" />

                  {/* Pulsing Core Pressure Gauge Text */}
                  <text x="72" y="34" fill="#FFFFFF" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily={MONO}>
                    COPV TANK
                  </text>
                  <text x="72" y="52" fill="#00F0FF" fontSize="12" fontWeight="800" textAnchor="middle" fontFamily={MONO}>
                    10,000 PSI (700 BAR)
                  </text>
                </g>

                {/* HIGH PRESSURE MANIFOLD CONDUITS */}
                {/* Main line to rear thruster */}
                <path
                  d="M 675 316 L 790 316 L 825 325"
                  fill="none"
                  stroke="#00F0FF"
                  strokeWidth="5"
                  strokeDasharray="8 4"
                  strokeDashoffset={-gasFlow}
                />

                {/* Downward lift lines */}
                <path
                  d="M 602 352 L 602 385"
                  fill="none"
                  stroke="#00F0FF"
                  strokeWidth="4"
                  strokeDasharray="6 3"
                  strokeDashoffset={-gasFlow}
                />
                <path
                  d="M 380 365 L 380 385"
                  fill="none"
                  stroke="#00F0FF"
                  strokeWidth="4"
                  strokeDasharray="6 3"
                  strokeDashoffset={-gasFlow}
                />

                {/* COLD GAS THRUSTERS & SUPERSONIC PLUMES */}
                {/* 1. Main Rear Thruster (Behind License Plate) */}
                <g transform="translate(825, 325)">
                  {/* Retracting plate housing */}
                  <rect x="-8" y="-12" width="14" height="24" rx="3" fill="#0F172A" stroke="#00F0FF" strokeWidth="2" />
                  {/* de Laval Nozzle Cone */}
                  <polygon points="6,-8 18,-15 18,15 6,8" fill="#E2E8F0" stroke="#00F0FF" strokeWidth="1.5" />

                  {/* Supersonic Jet Plume Blasting Backwards */}
                  <polygon
                    points={`18,-14 ${80 * thrusterBlast},-28 ${120 * thrusterBlast},0 ${80 * thrusterBlast},28 18,14`}
                    fill="url(#jetPlume)"
                    filter="url(#neonGlow)"
                  />
                  {/* Shock Diamonds in Jet Core */}
                  <polygon points="26,0 34,-6 42,0 34,6" fill="#FFFFFF" opacity="0.9" />
                  <polygon points="46,0 54,-5 62,0 54,5" fill="#FFFFFF" opacity="0.8" />
                  <polygon points="66,0 73,-4 80,0 73,4" fill="#FFFFFF" opacity="0.6" />

                  <text x="50" y="-36" fill="#00F0FF" fontSize="12" fontWeight="800" textAnchor="middle" fontFamily={MONO}>
                    REAR THRUSTER (0-60 BOOST)
                  </text>
                </g>

                {/* 2. Downward Hover / Lift Thrusters */}
                <g transform="translate(602, 385)">
                  <polygon points="-8,0 -14,10 14,10 8,0" fill="#E2E8F0" stroke="#00F0FF" strokeWidth="1.5" />
                  {/* Downward Plume */}
                  <polygon
                    points={`-12,10 0,${38 * thrusterBlast} 12,10`}
                    fill="url(#jetPlume)"
                    transform="rotate(90 0 10)"
                  />
                  <text x="0" y="38" fill="#00F0FF" fontSize="10" fontWeight="800" textAnchor="middle" fontFamily={MONO}>
                    LIFT THRUSTER ⬇
                  </text>
                </g>

                <g transform="translate(380, 385)">
                  <polygon points="-8,0 -14,10 14,10 8,0" fill="#E2E8F0" stroke="#00F0FF" strokeWidth="1.5" />
                  {/* Downward Plume */}
                  <polygon
                    points={`-12,10 0,${38 * thrusterBlast} 12,10`}
                    fill="url(#jetPlume)"
                    transform="rotate(90 0 10)"
                  />
                  <text x="0" y="38" fill="#00F0FF" fontSize="10" fontWeight="800" textAnchor="middle" fontFamily={MONO}>
                    LIFT THRUSTER ⬇
                  </text>
                </g>

                {/* System Title Badge */}
                <rect x="50" y="40" width="280" height="42" rx="8" fill="#0F172A" stroke="#00F0FF" strokeWidth="1.5" />
                <circle cx="72" cy="61" r="6" fill="#00F0FF" />
                <text x="90" y="66" fill="#F8FAFC" fontSize="13" fontWeight="900" fontFamily={MONO}>
                  10x COLD GAS THRUSTER ARRAY
                </text>
              </svg>
            </div>

            {/* Bottom Telemetry Spec Cards */}
            <div
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: isVertical ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
                gap: 12,
                marginTop: 18,
              }}
            >
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.75)",
                  border: "1px solid rgba(0, 240, 255, 0.3)",
                  borderRadius: 14,
                  padding: "14px 18px",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", fontFamily: MONO }}>
                  PRESSURE VESSEL
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#00F0FF", marginTop: 4 }}>
                  10,000 PSI
                </div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Ultra-light Carbon COPV</div>
              </div>

              <div
                style={{
                  background: "rgba(15, 23, 42, 0.75)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  borderRadius: 14,
                  padding: "14px 18px",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", fontFamily: MONO }}>
                  ACCELERATION
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#FF3B30", marginTop: 4 }}>
                  0-60 in 0.81s
                </div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Breaks Tire Traction Limit</div>
              </div>

              <div
                style={{
                  background: "rgba(15, 23, 42, 0.75)",
                  border: "1px solid rgba(0, 240, 255, 0.3)",
                  borderRadius: 14,
                  padding: "14px 18px",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", fontFamily: MONO }}>
                  PROPULSION
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#00F0FF", marginTop: 4 }}>
                  10 Nozzles
                </div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Supersonic de Laval Cones</div>
              </div>

              <div
                style={{
                  background: "rgba(15, 23, 42, 0.75)",
                  border: "1px solid rgba(245, 158, 11, 0.4)",
                  borderRadius: 14,
                  padding: "14px 18px",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", fontFamily: MONO }}>
                  AERODYNAMIC DOWNFORCE
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#F59E0B", marginTop: 4 }}>
                  2.0G+ Suction
                </div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Inverted Track Driving</div>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             VARIANT 2: SUPERSONIC NOZZLE PHYSICS & TIRE FRICTION BREAKTHROUGH
             ========================================================================= */
          <div
            style={{
              width: "100%",
              maxWidth: isVertical ? 980 : 880,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            {/* Physics Equation Card */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.85)",
                borderRadius: 20,
                border: "1px solid rgba(0, 240, 255, 0.3)",
                padding: "24px 28px",
                boxShadow: "0 14px 35px rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: isVertical ? "column" : "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#00F0FF", letterSpacing: "0.15em", fontFamily: MONO }}>
                  NEWTON'S THIRD LAW OF MOTION
                </div>
                <div style={{ fontSize: isVertical ? 42 : 36, fontWeight: 900, fontFamily: MONO, color: "#FFFFFF", marginTop: 6 }}>
                  F = ṁ · vₑ
                </div>
                <div style={{ fontSize: 14, color: "#94A3B8", marginTop: 6 }}>
                  Thrust = (Mass Flow Rate of Air) × (Supersonic Exit Velocity)
                </div>
              </div>

              <div
                style={{
                  background: "rgba(0, 240, 255, 0.1)",
                  border: "1px solid #00F0FF",
                  borderRadius: 14,
                  padding: "16px 20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: MONO }}>EXIT VELOCITY</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#00F0FF", marginTop: 4 }}>
                  &gt; 1,000 m/s
                </div>
                <div style={{ fontSize: 11, color: "#38BDF8", marginTop: 2 }}>Mach 3 Supersonic Jet</div>
              </div>
            </div>

            {/* Friction Limit vs Rocket Thrust Comparison */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isVertical ? "1fr" : "1fr 1fr",
                gap: 16,
              }}
            >
              {/* Normal Supercar */}
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.7)",
                  borderRadius: 18,
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  padding: "20px 24px",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", fontFamily: MONO }}>
                  STANDARD CARS (TIRE LIMITED)
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#CBD5E1", marginTop: 8 }}>
                  F_max = μ · N
                </div>
                <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 8, lineHeight: 1.4 }}>
                  Tires slip when torque exceeds rubber friction grip on asphalt. 0-60 is physics-capped at ~1.7s.
                </div>
              </div>

              {/* Tesla Roadster + SpaceX */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 58, 138, 0.3) 100%)",
                  borderRadius: 18,
                  border: "1px solid #00F0FF",
                  padding: "20px 24px",
                  boxShadow: "0 10px 30px rgba(0, 240, 255, 0.15)",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: "#00F0FF", fontFamily: MONO }}>
                  ROADSTER + SPACEX PACKAGE
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#00F0FF", marginTop: 8 }}>
                  F_total = F_tire + F_thrust
                </div>
                <div style={{ fontSize: 13, color: "#E2E8F0", marginTop: 8, lineHeight: 1.4 }}>
                  Cold gas rocket pushes the car forward and down simultaneously, breaking tire limits: 0-60 in 0.81s!
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
