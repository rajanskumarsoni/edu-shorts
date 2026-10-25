import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { FONT, MONO } from "../theme";

// Safe asset helper that resolves from public directory
const getAsset = (filename: string) => staticFile(`how-aadhaar-works/media/${filename}`);

// -----------------------------------------------------------------------------
// RECURRING CHARACTER: RAVI (Flat Vector Tech Explainer Avatar)
// -----------------------------------------------------------------------------
export const RaviAvatar: React.FC<{
  size?: number;
  mood?: "curious" | "smiling" | "alarmed" | "confident" | "scanning";
  expression?: string;
  style?: React.CSSProperties;
}> = ({ size = 220, mood = "curious", style }) => {
  const frame = useCurrentFrame();
  const breathe = Math.sin(frame * 0.08) * 3;
  const blink = frame % 90 > 85 ? 0.1 : 1;

  return (
    <div
      style={{
        width: size,
        height: size * 1.25,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...style,
      }}
    >
      <svg
        viewBox="0 0 200 250"
        width={size}
        height={size * 1.25}
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="raviSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D0A9" />
            <stop offset="100%" stopColor="#E0B084" />
          </linearGradient>
          <linearGradient id="raviHair" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="raviJacket" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
          <linearGradient id="raviTshirt" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <filter id="raviGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.4)" />
          </filter>
        </defs>

        <g transform={`translate(0, ${breathe})`} filter="url(#raviGlow)">
          {/* Shoulders & Jacket */}
          <path
            d="M 30 250 C 30 190, 60 170, 100 170 C 140 170, 170 190, 170 250 Z"
            fill="url(#raviJacket)"
          />
          {/* T-Shirt V-Neck */}
          <path d="M 80 170 L 100 205 L 120 170 Z" fill="url(#raviTshirt)" />
          {/* Neck */}
          <rect x="88" y="140" width="24" height="35" rx="6" fill="url(#raviSkin)" />

          {/* Ears */}
          <circle cx="58" cy="115" r="11" fill="url(#raviSkin)" />
          <circle cx="142" cy="115" r="11" fill="url(#raviSkin)" />

          {/* Head & Face */}
          <rect x="65" y="70" width="70" height="85" rx="35" fill="url(#raviSkin)" />

          {/* Hair (Modern Pompadour / Quiff) */}
          <path
            d="M 60 85 C 55 45, 100 30, 140 45 C 150 70, 145 85, 140 90 C 130 65, 75 60, 60 85 Z"
            fill="url(#raviHair)"
          />

          {/* Eyebrows */}
          {mood === "alarmed" ? (
            <>
              <line x1="74" y1="92" x2="90" y2="98" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
              <line x1="110" y1="98" x2="126" y2="92" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <line x1="74" y1="96" x2="90" y2="95" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
              <line x1="110" y1="95" x2="126" y2="96" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            </>
          )}

          {/* Eyes with Blinking */}
          <g transform={`scale(1, ${blink})`} transform-origin="100 108">
            <ellipse cx="82" cy="108" rx="6" ry="6" fill="#0F172A" />
            <circle cx="84" cy="106" r="2" fill="#FFFFFF" />
            <ellipse cx="118" cy="108" rx="6" ry="6" fill="#0F172A" />
            <circle cx="120" cy="106" r="2" fill="#FFFFFF" />
          </g>

          {/* Nose */}
          <path d="M 100 110 L 98 122 L 104 122" stroke="#C99462" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Mouth Expressions */}
          {mood === "smiling" || mood === "confident" ? (
            <path
              d="M 88 132 Q 100 144 112 132"
              stroke="#832A00"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
          ) : mood === "alarmed" ? (
            <ellipse cx="100" cy="135" rx="7" ry="6" fill="#832A00" />
          ) : (
            <path
              d="M 90 133 Q 100 136 110 133"
              stroke="#832A00"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          )}
        </g>
      </svg>
    </div>
  );
};

// -----------------------------------------------------------------------------
// FULL-BODY ANIMATED WALKING CHARACTER: RAVI WALKING INTO ENROLMENT CENTER
// -----------------------------------------------------------------------------
export const RaviWalking: React.FC<{
  size?: number;
  walkProgress: number; // 0 to 1 across screen
  style?: React.CSSProperties;
}> = ({ size = 380, walkProgress, style }) => {
  const frame = useCurrentFrame();
  const walkCycle = (frame * 0.28) % (Math.PI * 2);
  const leftLegAngle = Math.sin(walkCycle) * 32;
  const rightLegAngle = -Math.sin(walkCycle) * 32;
  const leftArmAngle = -Math.sin(walkCycle) * 35;
  const rightArmAngle = Math.sin(walkCycle) * 35;
  const bob = Math.abs(Math.sin(walkCycle * 2)) * 10;
  const blink = frame % 90 > 85 ? 0.1 : 1;

  // Move horizontally across the screen
  const posX = interpolate(walkProgress, [0, 1], [-200, 700]);

  return (
    <div
      style={{
        position: "absolute",
        left: posX,
        bottom: 220,
        width: size,
        height: size * 1.8,
        zIndex: 25,
        ...style,
      }}
    >
      <svg viewBox="0 0 200 360" width={size} height={size * 1.8} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="rwSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D0A9" />
            <stop offset="100%" stopColor="#E0B084" />
          </linearGradient>
          <linearGradient id="rwJacket" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
          <linearGradient id="rwPants" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>

        <g transform={`translate(0, ${-bob})`}>
          {/* Back Arm (Right) */}
          <g transform={`rotate(${rightArmAngle}, 115, 120)`}>
            <rect x="110" y="120" width="18" height="65" rx="9" fill="#0284C7" />
            <circle cx="119" cy="190" r="10" fill="url(#rwSkin)" />
          </g>

          {/* Back Leg (Right) */}
          <g transform={`rotate(${rightLegAngle}, 110, 210)`}>
            <rect x="100" y="210" width="22" height="75" rx="8" fill="url(#rwPants)" />
            <rect x="102" y="275" width="18" height="40" rx="6" fill="#0F172A" />
            <path d="M 98 310 L 132 310 Q 132 322 122 322 L 98 322 Z" fill="#E2E8F0" />
          </g>

          {/* Torso & Blue Shirt */}
          <rect x="75" y="115" width="50" height="95" rx="14" fill="url(#rwJacket)" />
          <path d="M 90 115 L 100 135 L 110 115 Z" fill="#F8FAFC" />

          {/* Front Leg (Left) */}
          <g transform={`rotate(${leftLegAngle}, 90, 210)`}>
            <rect x="80" y="210" width="22" height="75" rx="8" fill="url(#rwPants)" />
            <rect x="82" y="275" width="18" height="40" rx="6" fill="#0F172A" />
            <path d="M 78 310 L 112 310 Q 112 322 102 322 L 78 322 Z" fill="#E2E8F0" />
          </g>

          {/* Front Arm (Left) */}
          <g transform={`rotate(${leftArmAngle}, 85, 120)`}>
            <rect x="75" y="120" width="18" height="65" rx="9" fill="#0369A1" />
            <circle cx="84" cy="190" r="10" fill="url(#rwSkin)" />
          </g>

          {/* Neck */}
          <rect x="90" y="90" width="20" height="30" rx="5" fill="url(#rwSkin)" />

          {/* Head */}
          <rect x="70" y="30" width="60" height="70" rx="28" fill="url(#rwSkin)" />

          {/* Hair */}
          <path d="M 68 45 C 65 15, 95 5, 130 18 C 135 38, 132 50, 128 55 C 120 35, 80 30, 68 45 Z" fill="#1E293B" />

          {/* Eyes & Brow */}
          <line x1="88" y1="52" x2="100" y2="52" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="110" y1="52" x2="122" y2="52" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
          <g transform={`scale(1, ${blink})`} transform-origin="100 62">
            <ellipse cx="94" cy="62" rx="4.5" ry="4.5" fill="#0F172A" />
            <circle cx="95.5" cy="60.5" r="1.5" fill="#FFF" />
            <ellipse cx="116" cy="62" rx="4.5" ry="4.5" fill="#0F172A" />
            <circle cx="117.5" cy="60.5" r="1.5" fill="#FFF" />
          </g>
          {/* Nose & Smile */}
          <path d="M 105 64 L 103 72 L 108 72" stroke="#C99462" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 98 80 Q 106 88 114 80" stroke="#832A00" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
};

// -----------------------------------------------------------------------------
// REALISTIC BIOMETRIC SLAP SCANNER DEVICE WITH MINUTIAE MAPPING
// -----------------------------------------------------------------------------
export const SlapScannerDevice: React.FC<{
  progress: number;
  isBlurry?: boolean;
  qualityScore?: number;
}> = ({ progress, isBlurry = false, qualityScore = 98 }) => {
  const scanY = (progress * 100) % 100;

  return (
    <div
      style={{
        width: 460,
        height: 520,
        backgroundColor: "#0F172A",
        border: "6px solid #334155",
        borderRadius: 36,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 25px 60px rgba(0,0,0,0.85), 0 0 50px rgba(0,240,255,0.3)",
        position: "relative",
      }}
    >
      {/* Top Device Header */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: 12 }}>
        <span style={{ fontFamily: MONO, fontSize: 13, color: "#64748B", fontWeight: 800 }}>
          MANTRA / MORPHO 4-4-2 SLAP SCANNER
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: isBlurry ? "#EF4444" : "#10B981",
              boxShadow: `0 0 12px ${isBlurry ? "#EF4444" : "#10B981"}`,
            }}
          />
          <span
            style={{
              fontFamily: MONO,
              fontSize: 12,
              color: isBlurry ? "#EF4444" : "#10B981",
              fontWeight: 900,
            }}
          >
            {isBlurry ? "RETAKE SMUDGE" : "SCAN ACTIVE"}
          </span>
        </div>
      </div>

      {/* Optical scanning glass with high-intensity backlight */}
      <div
        style={{
          width: 410,
          height: 360,
          borderRadius: 20,
          backgroundColor: "rgba(2, 132, 199, 0.16)",
          border: `3px solid ${isBlurry ? "#EF4444" : "#0284C7"}`,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isBlurry
            ? "inset 0 0 40px rgba(239, 68, 68, 0.3)"
            : "inset 0 0 40px rgba(0, 240, 255, 0.3)",
        }}
      >
        {/* 4 Fingers Placed Down Graphic with Ridge Patterns */}
        <svg viewBox="0 0 300 240" width="360" height="260" style={{ opacity: isBlurry ? 0.35 : 0.9 }}>
          <g fill="none" stroke={isBlurry ? "#EF4444" : "#00F0FF"} strokeWidth="2.5">
            {/* Index Finger */}
            <path d="M 70 210 C 65 140, 68 80, 85 80 C 102 80, 105 140, 100 210" />
            <path d="M 74 110 Q 85 95 96 110" />
            <path d="M 72 135 Q 85 120 98 135" />
            <path d="M 71 160 Q 85 145 99 160" />
            {/* Middle Finger */}
            <path d="M 115 210 C 110 120, 114 50, 135 50 C 156 50, 160 120, 155 210" />
            <path d="M 120 85 Q 135 70 150 85" />
            <path d="M 118 115 Q 135 100 152 115" />
            <path d="M 116 145 Q 135 130 154 145" />
            {/* Ring Finger */}
            <path d="M 170 210 C 166 130, 170 70, 190 70 C 210 70, 214 130, 210 210" />
            <path d="M 175 105 Q 190 90 205 105" />
            <path d="M 173 135 Q 190 120 207 135" />
            {/* Little Finger */}
            <path d="M 225 210 C 222 155, 226 110, 242 110 C 258 110, 262 155, 258 210" />
            <path d="M 230 140 Q 242 125 254 140" />
          </g>

          {/* Minutiae Points (Bifurcations & Endings) */}
          {!isBlurry && (
            <g>
              <circle cx="85" cy="110" r="4.5" fill="#10B981" />
              <circle cx="92" cy="140" r="4.5" fill="#38BDF8" />
              <circle cx="135" cy="85" r="4.5" fill="#10B981" />
              <circle cx="140" cy="120" r="4.5" fill="#10B981" />
              <circle cx="125" cy="155" r="4.5" fill="#F59E0B" />
              <circle cx="190" cy="105" r="4.5" fill="#10B981" />
              <circle cx="198" cy="140" r="4.5" fill="#38BDF8" />
              <circle cx="242" cy="140" r="4.5" fill="#10B981" />
            </g>
          )}
        </svg>

        {/* Laser Scanning Line */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${scanY}%`,
            height: 4,
            backgroundColor: isBlurry ? "#EF4444" : "#00F0FF",
            boxShadow: `0 0 20px ${isBlurry ? "#EF4444" : "#00F0FF"}, 0 0 40px ${isBlurry ? "#EF4444" : "#00F0FF"}`,
          }}
        />
      </div>

      {/* Quality Score Bar */}
      <div style={{ width: "100%", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: MONO, fontSize: 13, color: "#94A3B8", fontWeight: 700 }}>
          NFIQ-2 QUALITY SCORE:
        </span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 16,
            fontWeight: 900,
            color: isBlurry ? "#EF4444" : "#10B981",
            backgroundColor: isBlurry ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)",
            padding: "4px 14px",
            borderRadius: 8,
          }}
        >
          {isBlurry ? "42% (FAIL — SMUDGE RETAKE)" : `${qualityScore}% (PASSED ✓)`}
        </span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// PROGRESS BAR & CHAPTER CARDS
// -----------------------------------------------------------------------------
export const ChapterProgressBar: React.FC<{
  currentPart: number;
  totalParts?: number;
  accent: string;
}> = ({ currentPart, totalParts = 5, accent }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 245,
        left: 60,
        right: 60,
        display: "flex",
        gap: 8,
        zIndex: 50,
      }}
    >
      {Array.from({ length: totalParts }).map((_, i) => {
        const isDone = i + 1 < currentPart;
        const isCurrent = i + 1 === currentPart;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              backgroundColor: isDone
                ? accent
                : isCurrent
                ? accent
                : "rgba(255, 255, 255, 0.15)",
              boxShadow: isCurrent ? `0 0 12px ${accent}` : "none",
              transition: "all 0.3s ease",
            }}
          />
        );
      })}
    </div>
  );
};

export const ChapterFlashCard: React.FC<{
  partNum: number;
  partTitle: string;
  accent: string;
}> = ({ partNum, partTitle, accent }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 4, 16, 20], [0, 1, 1, 0]);
  const scale = interpolate(frame, [0, 6, 20], [0.92, 1.0, 1.05]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        backgroundColor: "rgba(6, 10, 20, 0.94)",
        backdropFilter: "blur(20px)",
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          border: `2px solid ${accent}`,
          padding: "36px 54px",
          borderRadius: 24,
          backgroundColor: "#0F172A",
          boxShadow: `0 0 60px ${accent}44`,
          textAlign: "center",
          maxWidth: "80%",
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 22,
            fontWeight: 800,
            color: accent,
            letterSpacing: "0.25em",
            display: "block",
            marginBottom: 12,
          }}
        >
          PART {partNum} / 5
        </span>
        <h1
          style={{
            fontFamily: FONT,
            fontSize: 48,
            fontWeight: 900,
            color: "#FFFFFF",
            margin: 0,
            lineHeight: 1.15,
            textTransform: "uppercase",
          }}
        >
          {partTitle}
        </h1>
      </div>
    </div>
  );
};

export const GlitchReHook: React.FC<{
  question: string;
  accent: string;
}> = ({ question, accent }) => {
  const frame = useCurrentFrame();
  const shiftX = (frame % 3) * 6 - 3;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 90,
        backgroundColor: "#050811",
        transform: `translate(${shiftX}px, 0)`,
      }}
    >
      <div
        style={{
          border: `3px solid ${accent}`,
          padding: "32px 48px",
          borderRadius: 20,
          backgroundColor: "#0F172A",
          boxShadow: `0 0 50px ${accent}`,
          textAlign: "center",
          maxWidth: "85%",
        }}
      >
        <span
          style={{
            fontFamily: MONO,
            fontSize: 20,
            fontWeight: 900,
            color: accent,
            display: "block",
            marginBottom: 8,
          }}
        >
          ⚠️ CRITICAL QUESTION
        </span>
        <h2
          style={{
            fontFamily: FONT,
            fontSize: 44,
            fontWeight: 900,
            color: "#FFFFFF",
            margin: 0,
            lineHeight: 1.25,
            textTransform: "uppercase",
          }}
        >
          {question}
        </h2>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// MAIN AADHAAR VISUALIZER DISPATCHER
// -----------------------------------------------------------------------------
export const AadhaarVisualizer: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const variant = scene.variant || "aadhaar_hook";

  // Progress within the scene (0 to 1)
  const progress = Math.min(Math.max(frame / Math.max(durationInFrames, 1), 0), 1);

  // Common Header helper positioned strictly below top safe zone (y = 265)
  const renderHeader = (headerTag: string, headerTitle: string) => (
    <div style={{ position: "absolute", top: 265, left: 60, right: 120, zIndex: 40 }}>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 22,
          fontWeight: 800,
          color: accent,
          letterSpacing: "0.2em",
          display: "block",
        }}
      >
        {headerTag}
      </span>
      <h1
        style={{
          fontFamily: FONT,
          fontSize: 46,
          fontWeight: 900,
          margin: "6px 0 0 0",
          color: "#FFFFFF",
          lineHeight: 1.15,
        }}
      >
        {headerTitle}
      </h1>
    </div>
  );

  // ===========================================================================
  // S0: AADHAAR HOOK (Cold Open, Optical Scanner Video, Real Aadhaar Card, Open Loop)
  // ===========================================================================
  if (variant === "aadhaar_hook") {
    const showCard = frame >= 65;
    const showBankPadlock = frame >= 135;
    const showQuestion = frame >= 185;

    return (
      <AbsoluteFill style={{ backgroundColor: "#060913", overflow: "hidden", color: "#FFF" }}>
        <ChapterProgressBar currentPart={1} accent={accent} />

        {/* 1. Real Optical Fingerprint Scanner Video Footage (Frames 0 - 65) */}
        {!showCard && (
          <AbsoluteFill>
            <OffthreadVideo
              src={getAsset("fingerprint_scanner.mp4")}
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.65,
              }}
            />
            {/* Green Laser Scan Sweep & YES Stamp */}
            <div
              style={{
                position: "absolute",
                top: "42%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                padding: "24px 48px",
                borderRadius: 24,
                backgroundColor: "rgba(16, 185, 129, 0.25)",
                border: "4px solid #10B981",
                boxShadow: "0 0 60px #10B981",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 8 }}>👆 ✓</div>
              <div style={{ fontFamily: MONO, fontSize: 32, fontWeight: 900, color: "#10B981" }}>
                AUTHENTICATION: SUCCESS
              </div>
            </div>
          </AbsoluteFill>
        )}

        {/* 2. Real Photorealistic Aadhaar Card Reveal (Frames 65+) */}
        {showCard && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 80,
            }}
          >
            {/* Real Official Aadhaar Card Image */}
            <div
              style={{
                position: "relative",
                width: 620,
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: "0 25px 70px rgba(0,0,0,0.9), 0 0 45px rgba(0,240,255,0.35)",
                transform: `rotate(${interpolate(frame, [65, 120], [-4, 0], { extrapolateRight: "clamp" })}deg)`,
              }}
            >
              <Img
                src={getAsset("real_aadhaar_card.jpg")}
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />

              {/* Red Crossed Out Demographic Tags Overlay */}
              <div
                style={{
                  position: "absolute",
                  top: "48%",
                  left: "55%",
                  backgroundColor: "rgba(239, 68, 68, 0.95)",
                  color: "#FFF",
                  fontFamily: MONO,
                  fontSize: 16,
                  fontWeight: 900,
                  padding: "6px 14px",
                  borderRadius: 8,
                  boxShadow: "0 0 20px #EF4444",
                  transform: "rotate(-6deg)",
                }}
              >
                NO NAME IN NUMBER ⊘
              </div>
            </div>

            <h2
              style={{
                fontFamily: FONT,
                fontSize: 38,
                fontWeight: 900,
                color: "#FFFFFF",
                marginTop: 30,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              YOUR AADHAAR NUMBER HAS <br />
              <span style={{ color: "#EF4444" }}>ZERO PERSONAL DATA</span> INSIDE
            </h2>
          </div>
        )}

        {/* 3. Bank Locked Out Over Fingerprint (Frames 135+) */}
        {showBankPadlock && !showQuestion && (
          <div
            style={{
              position: "absolute",
              bottom: 420,
              left: 60,
              right: 60,
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "3px solid #EF4444",
              borderRadius: 20,
              padding: "20px 24px",
              textAlign: "center",
              boxShadow: "0 0 40px rgba(239, 68, 68, 0.5)",
              zIndex: 35,
            }}
          >
            <div style={{ fontSize: 44 }}>🔒</div>
            <h3 style={{ fontFamily: FONT, fontSize: 28, fontWeight: 900, color: "#FFFFFF", margin: "6px 0" }}>
              BANK CAN NEVER READ YOUR BIOMETRICS
            </h3>
            <span style={{ fontFamily: MONO, fontSize: 16, color: "#FCA5A5" }}>
              Raw fingerprint stays sealed in central vault
            </span>
          </div>
        )}

        {/* 4. Giant Pulsing "?" & Open Loop Question (Frames 185-270) */}
        {showQuestion && (
          <div
            style={{
              position: "absolute",
              bottom: 400,
              left: 60,
              right: 60,
              backgroundColor: "rgba(15, 23, 42, 0.96)",
              border: `3px solid ${accent}`,
              borderRadius: 24,
              padding: "24px 30px",
              textAlign: "center",
              boxShadow: `0 0 50px ${accent}44`,
              zIndex: 40,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: `3px solid ${accent}`,
                margin: "0 auto 12px auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                color: accent,
                fontWeight: 900,
                boxShadow: `0 0 25px ${accent}`,
              }}
            >
              ?
            </div>
            <h2
              style={{
                fontFamily: FONT,
                fontSize: 34,
                fontWeight: 900,
                color: "#FFFFFF",
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              THEN HOW DOES THE BANK <br />
              <span style={{ color: "#F59E0B" }}>PROVE WHO YOU ARE?</span>
            </h2>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 15,
                color: "#94A3B8",
                display: "block",
                marginTop: 10,
                letterSpacing: "0.15em",
              }}
            >
              WATCH TILL THE END FOR THE ANSWER
            </span>
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // ===========================================================================
  // S1: THE NUMBER (Real Card, Ravi Character, 12 Digits, Verhoeff D5 Engine)
  // ===========================================================================
  if (variant === "aadhaar_number") {
    const showChapterCard = frame < 20;
    const showVerhoeff = frame >= 240;

    return (
      <AbsoluteFill style={{ backgroundColor: "#060913", overflow: "hidden", color: "#FFF" }}>
        <ChapterProgressBar currentPart={1} accent={accent} />

        {showChapterCard ? (
          <ChapterFlashCard partNum={1} partTitle="THE 12-DIGIT RANDOM KEY" accent={accent} />
        ) : (
          <>
            {renderHeader("PART 1/5: THE NUMBER", "12-DIGIT CHECKSUM")}

            {/* Real Aadhaar Card on Display Stand + Ravi Character */}
            <div
              style={{
                position: "absolute",
                top: 410,
                left: 60,
                right: 60,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* Official Card Cutout */}
              <div
                style={{
                  width: 520,
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 35px rgba(0,240,255,0.3)",
                  border: "2px solid #334155",
                }}
              >
                <Img src={getAsset("real_aadhaar_card.jpg")} style={{ width: "100%", display: "block" }} />
              </div>

              {/* Animated Ravi Character standing proud */}
              <RaviAvatar size={240} mood="smiling" />
            </div>

            {/* 3 Embossed Blocks of 4 Digits Lifting Off the Card */}
            <div
              style={{
                position: "absolute",
                top: 760,
                left: 60,
                right: 60,
                display: "flex",
                justifyContent: "center",
                gap: 18,
              }}
            >
              {[
                { digits: "5879", tag: "FIRST DIGIT: NEVER 0 OR 1 🚫", highlight: true },
                { digits: "4103", tag: "PURE RANDOM ENVELOPE", highlight: false },
                { digits: "7654", tag: "12TH DIGIT: VERHOEFF CHECKSUM", highlight: true },
              ].map((blk, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    backgroundColor: "#0F172A",
                    border: `3px solid ${blk.highlight ? accent : "#334155"}`,
                    borderRadius: 18,
                    padding: "16px 12px",
                    textAlign: "center",
                    boxShadow: blk.highlight ? `0 0 30px ${accent}44` : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 36,
                      fontWeight: 900,
                      color: blk.highlight ? accent : "#FFFFFF",
                      letterSpacing: "0.15em",
                    }}
                  >
                    {blk.digits}
                  </span>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      color: "#94A3B8",
                      display: "block",
                      marginTop: 6,
                      fontWeight: 700,
                    }}
                  >
                    {blk.tag}
                  </span>
                </div>
              ))}
            </div>

            {/* Verhoeff Checksum Machine with Dihedral Gears (Frames 240+) */}
            {showVerhoeff && (
              <div
                style={{
                  position: "absolute",
                  bottom: 400,
                  left: 60,
                  right: 60,
                  backgroundColor: "#0F172A",
                  border: "3px solid #10B981",
                  borderRadius: 22,
                  padding: "20px 24px",
                  boxShadow: "0 0 40px rgba(16,185,129,0.35)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div
                      style={{
                        fontSize: 38,
                        transform: `rotate(${(frame * 4) % 360}deg)`,
                        display: "inline-block",
                      }}
                    >
                      ⚙️
                    </div>
                    <div>
                      <span style={{ fontFamily: MONO, fontSize: 14, color: "#10B981", fontWeight: 800 }}>
                        VERHOEFF ALGORITHM (DIHEDRAL D5 GROUP)
                      </span>
                      <h3 style={{ fontFamily: FONT, fontSize: 24, fontWeight: 900, color: "#FFFFFF", margin: "4px 0" }}>
                        CATCHES 100% OF SINGLE-DIGIT TYPOS
                      </h3>
                    </div>
                  </div>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 18,
                      fontWeight: 900,
                      color: "#10B981",
                      backgroundColor: "rgba(16,185,129,0.2)",
                      padding: "6px 14px",
                      borderRadius: 10,
                    }}
                  >
                    PARITY ✓
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </AbsoluteFill>
    );
  }

  // ===========================================================================
  // S2: ENROLMENT (Real Entrance, Ravi Walking In, Desk Photo, Slap Scanner, Iris)
  // ===========================================================================
  if (variant === "aadhaar_enrolment") {
    const showChapterCard = frame < 20;
    const showReHook = frame >= durationInFrames - 12;

    // Stage 1: Ravi walking into real Aadhaar Center (Frames 0 - 180)
    // Stage 2: Real Aadhaar Desk Photo with operator & typing (Frames 180 - 360)
    // Stage 3: Full-screen Biometric Slap Scanner + Quality gauge (Frames 360 - 520)
    // Stage 4: Dual Iris Reticle & Flash (Frames 520 - 600)
    const isEntrance = frame < 180;
    const isDesk = frame >= 180 && frame < 360;
    const isSlap = frame >= 360 && frame < 520;
    const isIris = frame >= 520;

    return (
      <AbsoluteFill style={{ backgroundColor: "#060913", overflow: "hidden", color: "#FFF" }}>
        <ChapterProgressBar currentPart={2} accent={accent} />

        {showChapterCard ? (
          <ChapterFlashCard partNum={2} partTitle="ENROLMENT & CAPTURE" accent={accent} />
        ) : showReHook ? (
          <GlitchReHook question="CAN THIS ENROLMENT DATA BE HACKED IN TRANSIT?" accent="#FF0055" />
        ) : (
          <>
            {renderHeader("PART 2/5: ENROLMENT", "MULTI-MODAL CAPTURE")}

            {/* Stage 1: Real Aadhaar Center Entrance + Ravi Animated Walk Cycle */}
            {isEntrance && (
              <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                {/* Real Entrance Photo Covering Full Screen */}
                <Img
                  src={getAsset("aadhaar_center_entrance.jpg")}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "brightness(0.85)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to bottom, #060913 0%, rgba(6,9,19,0.3) 25%, rgba(6,9,19,0.3) 75%, #060913 100%)",
                  }}
                />

                {/* Animated Ravi Walking Cycle across screen */}
                <RaviWalking walkProgress={interpolate(frame, [0, 180], [0, 1])} />

                {/* Status Pill */}
                <div
                  style={{
                    position: "absolute",
                    top: 380,
                    left: 60,
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: `2px solid ${accent}`,
                    borderRadius: 12,
                    padding: "8px 16px",
                    fontFamily: MONO,
                    fontSize: 14,
                    color: "#FFF",
                    fontWeight: 800,
                  }}
                >
                  📍 ARRIVING AT AADHAAR SEVA KENDRA
                </div>
              </div>
            )}

            {/* Stage 2: Real Enrolment Desk Photo with Operator & Resident Details */}
            {isDesk && (
              <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                <Img
                  src={getAsset("aadhaar_enrolment_desk.jpg")}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "brightness(0.9)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to bottom, #060913 0%, rgba(6,9,19,0.2) 25%, rgba(6,9,19,0.4) 75%, #060913 100%)",
                  }}
                />

                {/* Operator Authenticated Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: 380,
                    left: 60,
                    backgroundColor: "rgba(16, 185, 129, 0.95)",
                    color: "#000",
                    fontFamily: MONO,
                    fontSize: 15,
                    fontWeight: 900,
                    padding: "8px 18px",
                    borderRadius: 12,
                    boxShadow: "0 0 25px #10B981",
                  }}
                >
                  ✓ OPERATOR AUTHENTICATED
                </div>

                {/* Live Form Intake Overlay */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 390,
                    left: 60,
                    right: 60,
                    backgroundColor: "rgba(15, 23, 42, 0.94)",
                    border: "2px solid #38BDF8",
                    borderRadius: 16,
                    padding: "16px 20px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                  }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 13, color: "#38BDF8", fontWeight: 800 }}>
                    DEMOGRAPHIC DATA INTAKE:
                  </span>
                  <div style={{ fontFamily: MONO, fontSize: 18, color: "#FFF", marginTop: 6, fontWeight: 700 }}>
                    NAME: RAVI SHARMA | DOB: 14-08-1996 | ADDR: DELHI
                  </div>
                </div>
              </div>
            )}

            {/* Stage 3: Full-Screen Optical Slap Scanner (Frames 360 - 520) */}
            {isSlap && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: 80,
                  transform: "scale(1.2)",
                }}
              >
                <SlapScannerDevice
                  progress={(frame - 360) / 160}
                  isBlurry={frame < 430}
                  qualityScore={frame < 430 ? 42 : 98}
                />
              </div>
            )}

            {/* Stage 4: Dual Iris Reticle & Camera Flash (Frames 520 - 600) */}
            {isIris && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: 80,
                }}
              >
                <div style={{ display: "flex", gap: 36, marginBottom: 24 }}>
                  {[1, 2].map((eye) => (
                    <div
                      key={eye}
                      style={{
                        width: 200,
                        height: 200,
                        borderRadius: "50%",
                        border: `4px solid ${accent}`,
                        boxShadow: `0 0 40px ${accent}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: 90,
                          height: 90,
                          borderRadius: "50%",
                          border: "2px dashed #FFF",
                          transform: `rotate(${(frame * 3) % 360}deg)`,
                        }}
                      />
                      <span style={{ fontFamily: MONO, fontSize: 14, color: accent, position: "absolute", bottom: -30 }}>
                        {eye === 1 ? "LEFT IRIS: OK" : "RIGHT IRIS: OK"}
                      </span>
                    </div>
                  ))}
                </div>
                <h3 style={{ fontFamily: FONT, fontSize: 32, fontWeight: 900, color: "#FFFFFF", marginTop: 40 }}>
                  DUAL IRIS & VOLUMETRIC FACE CAPTURED
                </h3>
              </div>
            )}
          </>
        )}
      </AbsoluteFill>
    );
  }

  // ===========================================================================
  // S3: ENCRYPT & UPLOAD (Real Fiber Optic Video B-Roll, AES Lock, Wax Seal)
  // ===========================================================================
  if (variant === "aadhaar_packet_encrypt") {
    const isAesSnapped = frame >= 50;
    const isWaxSealed = frame >= 180;
    const isFiberStream = frame >= 260;

    return (
      <AbsoluteFill style={{ backgroundColor: "#060913", overflow: "hidden", color: "#FFF" }}>
        <ChapterProgressBar currentPart={2} accent={accent} />
        {renderHeader("PART 2/5: CYBERSECURITY", "ENVELOPE ENCRYPTION")}

        {/* Real Fiber Optic Video Stream in Background */}
        {isFiberStream && (
          <AbsoluteFill style={{ opacity: 0.55 }}>
            <OffthreadVideo
              src={getAsset("fiber_optic_cable.mp4")}
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        )}

        {/* Encrypted Data Cube / Packet */}
        <div
          style={{
            position: "absolute",
            top: isFiberStream ? "42%" : "48%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${isFiberStream ? 0.85 : 1.0})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 30,
          }}
        >
          <div
            style={{
              width: 260,
              height: 260,
              backgroundColor: "#0F172A",
              border: "4px solid #00F0FF",
              borderRadius: 32,
              boxShadow: "0 0 60px rgba(0, 240, 255, 0.4)",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 13, color: "rgba(0,240,255,0.75)", textAlign: "center" }}>
              DEMOGRAPHICS <br />
              10-FINGERPRINTS <br />
              DUAL-IRISES <br />
              PHOTO DIGEST
            </div>

            {/* AES-256 Padlock */}
            {isAesSnapped && (
              <div
                style={{
                  position: "absolute",
                  backgroundColor: "#1E293B",
                  border: "3px solid #38BDF8",
                  borderRadius: 18,
                  padding: "12px 20px",
                  boxShadow: "0 0 35px #38BDF8",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 36 }}>🔒</div>
                <span style={{ fontFamily: MONO, fontSize: 14, color: "#FFF", fontWeight: 900 }}>
                  AES-256 ENCRYPTED
                </span>
              </div>
            )}

            {/* Red Wax Seal */}
            {isWaxSealed && (
              <div
                style={{
                  position: "absolute",
                  bottom: -24,
                  right: -24,
                  width: 85,
                  height: 85,
                  borderRadius: "50%",
                  backgroundColor: "#B91C1C",
                  border: "3px solid #FCA5A5",
                  boxShadow: "0 0 30px rgba(239, 68, 68, 0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFF",
                  fontFamily: MONO,
                  fontSize: 13,
                  fontWeight: 900,
                  textAlign: "center",
                  transform: "rotate(15deg)",
                }}
              >
                DIGITAL <br /> SIGN
              </div>
            )}
          </div>

          <span style={{ fontFamily: MONO, fontSize: 24, color: "#00F0FF", fontWeight: 800, marginTop: 28 }}>
            ENROLMENT PACKET
          </span>
        </div>

        {/* Status Bottom Banner */}
        <div
          style={{
            position: "absolute",
            bottom: 400,
            left: 60,
            right: 60,
            backgroundColor: "rgba(15, 23, 42, 0.92)",
            border: "2px solid #334155",
            borderRadius: 16,
            padding: "16px 20px",
            textAlign: "center",
            zIndex: 35,
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 16, color: "#38BDF8", fontWeight: 800 }}>
            {isFiberStream
              ? "⚡ STREAMING VIA LEASED FIBER TO CENTRAL REPOSITORY"
              : "SESSION KEY LOCKED WITH UIDAI PUBLIC KEY"}
          </span>
        </div>
      </AbsoluteFill>
    );
  }

  // ===========================================================================
  // S4: DE-DUPLICATION (National ABIS Sweep, Real Aadhaar Card Issued)
  // ===========================================================================
  if (variant === "aadhaar_deduplication") {
    const showChapterCard = frame < 20;
    const isMatchSweep = frame >= 60 && frame < 320;
    const isIssued = frame >= 320;

    return (
      <AbsoluteFill style={{ backgroundColor: "#060913", overflow: "hidden", color: "#FFF" }}>
        <ChapterProgressBar currentPart={3} accent={accent} />

        {showChapterCard ? (
          <ChapterFlashCard partNum={3} partTitle="THE ABIS DE-DUPE SWEEP" accent={accent} />
        ) : (
          <>
            {renderHeader("PART 3/5: DE-DUPLICATION", "1:N NATIONAL SWEEP")}

            {/* Split Screen: Template vs 1.4B National Records + Central ABIS Engine Matrix */}
            {isMatchSweep && (
              <div
                style={{
                  position: "absolute",
                  top: 410,
                  left: 60,
                  right: 60,
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                {/* Top Split Header */}
                <div style={{ display: "flex", gap: 24 }}>
                  {/* Ravi's Templates */}
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: "#0F172A",
                      border: "3px solid #38BDF8",
                      borderRadius: 20,
                      padding: "16px 20px",
                      textAlign: "center",
                      boxShadow: "0 0 35px rgba(56,189,248,0.25)",
                    }}
                  >
                    <span style={{ fontFamily: MONO, fontSize: 13, color: "#38BDF8", fontWeight: 800 }}>
                      RAVI'S BIOMETRICS
                    </span>
                    <div style={{ fontSize: 44, margin: "10px 0" }}>👆 👁️</div>
                    <span style={{ fontFamily: MONO, fontSize: 15, color: "#FFF", fontWeight: 900 }}>
                      10-FINGERPRINTS + DUAL IRIS
                    </span>
                  </div>

                  {/* 1.4B Records Scanning Matrix */}
                  <div
                    style={{
                      flex: 1.2,
                      backgroundColor: "#0F172A",
                      border: "3px solid #10B981",
                      borderRadius: 20,
                      padding: "16px 20px",
                      textAlign: "center",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: "0 0 35px rgba(16,185,129,0.25)",
                    }}
                  >
                    <span style={{ fontFamily: MONO, fontSize: 13, color: "#10B981", fontWeight: 800 }}>
                      1.4 BILLION RESIDENTS DATABASE
                    </span>
                    <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 900, color: "#FFF", margin: "10px 0" }}>
                      {(1400000000 - ((frame * 187654) % 10000000)).toLocaleString()}
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: "#10B981", fontWeight: 900 }}>
                      0 DUPLICATES FOUND ✓
                    </span>
                  </div>
                </div>

                {/* Central 3-Engine ABIS Radar Matrix */}
                <div
                  style={{
                    backgroundColor: "#0B1120",
                    border: "2px solid #334155",
                    borderRadius: 22,
                    padding: "20px 24px",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 15px 40px rgba(0,0,0,0.8)",
                  }}
                >
                  {/* Glowing Laser Scan Sweep */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: `${(frame * 4) % 100}%`,
                      height: 3,
                      background: "linear-gradient(90deg, transparent, #00F0FF, transparent)",
                      boxShadow: "0 0 15px #00F0FF",
                    }}
                  />

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: "#00F0FF", fontWeight: 900 }}>
                      ⚡ 3 INDEPENDENT ABIS ENGINES (1:N DE-DUPLICATION)
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: "#94A3B8" }}>
                      PARALLEL SWEEP
                    </span>
                  </div>

                  {/* 3 Engine Rows */}
                  {[
                    { name: "IDEMIA / MORPHO ABIS", type: "Fingerprint Minutiae Matcher", score: "99.98% UNIQUE", color: "#10B981" },
                    { name: "L-1 IDENTITY / SAFRAN", type: "Dual Iris Gabor Wavelet Sweep", score: "100.0% UNIQUE", color: "#38BDF8" },
                    { name: "NEC BIOMETRICS ENGINE", type: "Multi-Modal Fusion Verification", score: "NO FRAUD MATCH", color: "#A855F7" },
                  ].map((engine, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        backgroundColor: "#1E293B",
                        borderRadius: 12,
                        marginBottom: idx < 2 ? 10 : 0,
                        borderLeft: `4px solid ${engine.color}`,
                      }}
                    >
                      <div>
                        <div style={{ fontFamily: MONO, fontSize: 14, color: "#FFF", fontWeight: 800 }}>
                          {engine.name}
                        </div>
                        <div style={{ fontFamily: FONT, fontSize: 12, color: "#94A3B8" }}>
                          {engine.type}
                        </div>
                      </div>
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: 13,
                          fontWeight: 900,
                          color: engine.color,
                          backgroundColor: "rgba(0,0,0,0.4)",
                          padding: "4px 10px",
                          borderRadius: 8,
                        }}
                      >
                        {engine.score}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom Principle Banner */}
                <div
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    border: "2px solid #10B981",
                    borderRadius: 14,
                    padding: "12px 18px",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontFamily: FONT, fontSize: 16, color: "#D1FAE5", fontWeight: 700 }}>
                    1 PERSON CAN NEVER GET 2 AADHAAR NUMBERS
                  </span>
                </div>
              </div>
            )}

            {/* Unique Resident Confirmed & Real Aadhaar Card Materializes */}
            {isIssued && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: 80,
                }}
              >
                <div
                  style={{
                    width: 580,
                    borderRadius: 22,
                    overflow: "hidden",
                    boxShadow: "0 25px 70px rgba(0,0,0,0.9), 0 0 50px rgba(16,185,129,0.4)",
                    border: "3px solid #10B981",
                  }}
                >
                  <Img src={getAsset("real_aadhaar_card.jpg")} style={{ width: "100%", display: "block" }} />
                </div>

                <div
                  style={{
                    marginTop: 24,
                    padding: "10px 24px",
                    borderRadius: 12,
                    backgroundColor: "#10B981",
                    color: "#000",
                    fontFamily: MONO,
                    fontSize: 18,
                    fontWeight: 900,
                  }}
                >
                  ✓ UNIQUE RESIDENT CONFIRMED: AADHAAR ISSUED
                </div>
              </div>
            )}
          </>
        )}
      </AbsoluteFill>
    );
  }

  // ===========================================================================
  // S5: THE VAULT / CIDR (Real Datacenter Video B-Roll, Concentric Rings)
  // ===========================================================================
  if (variant === "aadhaar_vault") {
    const showReHook = frame >= durationInFrames - 12;

    return (
      <AbsoluteFill style={{ backgroundColor: "#060913", overflow: "hidden", color: "#FFF" }}>
        <ChapterProgressBar currentPart={3} accent={accent} />

        {showReHook ? (
          <GlitchReHook question="NOW WHAT HAPPENS WHEN RAVI WALKS INTO A BANK?" accent="#00F0FF" />
        ) : (
          <>
            {renderHeader("PART 3/5: THE REPOSITORY", "CENTRAL IDENTITIES DATA REPOSITORY")}

            {/* Real Datacenter Server Racks Video B-Roll */}
            <AbsoluteFill style={{ top: 380, bottom: 400, opacity: 0.6 }}>
              <OffthreadVideo
                src={getAsset("datacenter_servers.mp4")}
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </AbsoluteFill>

            {/* Central CIDR Vault Symbolism */}
            <div
              style={{
                position: "absolute",
                top: "52%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 35,
              }}
            >
              <div
                style={{
                  width: 280,
                  height: 280,
                  borderRadius: "50%",
                  border: "5px solid #00F0FF",
                  boxShadow: "0 0 60px rgba(0,240,255,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div style={{ fontSize: 64 }}>🛡️ 🔒</div>
              </div>

              <div
                style={{
                  marginTop: 24,
                  backgroundColor: "rgba(15, 23, 42, 0.94)",
                  border: "2px solid #F59E0B",
                  borderRadius: 16,
                  padding: "16px 28px",
                  textAlign: "center",
                }}
              >
                <h2 style={{ fontFamily: FONT, fontSize: 30, fontWeight: 900, color: "#FFFFFF", margin: 0 }}>
                  NUMBER = KEY <br />
                  <span style={{ color: "#F59E0B" }}>BIOMETRIC = LIVING PROOF</span>
                </h2>
              </div>
            </div>
          </>
        )}
      </AbsoluteFill>
    );
  }

  // ===========================================================================
  // S6: BANK AUTHENTICATION (Real Scanner, Pipeline Hops, Bank CAN'T OPEN, Payoff)
  // ===========================================================================
  if (variant === "aadhaar_authentication") {
    const showChapterCard = frame < 20;
    const showReHook = frame >= durationInFrames - 12;

    // Phase 1: Resident at Bank Desk placing finger on physical scanner (frames 20 - 150)
    const showBankCapture = frame >= 20 && frame < 150;

    // Phase 2: Live Network Highway (frames 150 - end)
    const isAtBank = frame >= 240 && frame < 400;
    const isAtAsa = frame >= 400 && frame < 560;
    const isAtUidai = frame >= 560;
    const isYesPayoff = frame >= 680;

    return (
      <AbsoluteFill style={{ backgroundColor: "#060913", overflow: "hidden", color: "#FFF" }}>
        <ChapterProgressBar currentPart={4} accent={accent} />

        {showChapterCard ? (
          <ChapterFlashCard partNum={4} partTitle="ZERO-KNOWLEDGE AUTH" accent={accent} />
        ) : showReHook ? (
          <GlitchReHook question="BUT WHAT IF SOMEONE CHEATS THE SYSTEM?" accent="#FF0055" />
        ) : showBankCapture ? (
          /* ===================================================================
             PHASE 1: RAVI AT BANK COUNTER WITH REAL REGISTERED SCANNER DEVICE
             =================================================================== */
          <>
            {renderHeader("PART 4/5: AUTHENTICATION", "RESIDENT AT BANK DESK")}

            <div
              style={{
                position: "absolute",
                top: 360,
                left: 60,
                right: 60,
                display: "flex",
                alignItems: "center",
                gap: 12,
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                border: "1.5px solid rgba(0, 240, 255, 0.4)",
                borderRadius: 14,
                padding: "8px 16px",
                backdropFilter: "blur(8px)",
                zIndex: 35,
              }}
            >
              <span style={{ fontSize: 20 }}>🏦</span>
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: "#00F0FF", letterSpacing: "0.1em" }}>
                BANK BRANCH COUNTER · eKYC AUTHENTICATION
              </span>
            </div>

            {/* Split Layout: Ravi standing on left, Real Biometric Scanner Device on right */}
            <div
              style={{
                position: "absolute",
                top: 440,
                left: 60,
                right: 60,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                zIndex: 35,
              }}
            >
              {/* Ravi Avatar */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <RaviAvatar size={250} mood="scanning" />
                <div
                  style={{
                    marginTop: 12,
                    backgroundColor: "#1E293B",
                    padding: "6px 16px",
                    borderRadius: 12,
                    border: "1.5px solid #00F0FF",
                  }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color: "#FFF" }}>
                    RAVI (RESIDENT)
                  </span>
                </div>
              </div>

              {/* Physical Biometric Scanner Device */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: 260,
                    height: 340,
                    backgroundColor: "#0B1120",
                    border: "3px solid #10B981",
                    borderRadius: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 0 40px rgba(16, 185, 129, 0.4)",
                  }}
                >
                  <Img
                    src={getAsset("biometric_scanner_nobg.png")}
                    style={{
                      width: "88%",
                      height: "88%",
                      objectFit: "contain",
                    }}
                  />

                  {/* Scanning Laser Line Sweep across sensor glass */}
                  <div
                    style={{
                      position: "absolute",
                      top: `${((frame * 4) % 240) + 50}px`,
                      left: 20,
                      right: 20,
                      height: 4,
                      backgroundColor: "#10B981",
                      boxShadow: "0 0 16px #10B981, 0 0 30px #10B981",
                    }}
                  />
                </div>

                <div
                  style={{
                    marginTop: 12,
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    padding: "6px 14px",
                    borderRadius: 12,
                    border: "1.5px solid #10B981",
                  }}
                >
                  <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 900, color: "#10B981" }}>
                    REGISTERED DEVICE (L1)
                  </span>
                </div>
              </div>
            </div>

            {/* Chip-Level Encryption Callout Card */}
            <div
              style={{
                position: "absolute",
                bottom: 390,
                left: 60,
                right: 60,
                backgroundColor: "rgba(15, 23, 42, 0.95)",
                border: "2px solid #00F0FF",
                borderRadius: 20,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                boxShadow: "0 10px 40px rgba(0, 240, 255, 0.25)",
                zIndex: 35,
              }}
            >
              <div style={{ fontSize: 32 }}>🔐</div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 900, color: "#00F0FF" }}>
                  ON-CHIP HARDWARE ENCRYPTION
                </div>
                <div style={{ fontFamily: FONT, fontSize: 14, color: "#E2E8F0", marginTop: 2, fontWeight: 600 }}>
                  Encrypted inside sensor silicon before reaching USB cable. Bank cannot read raw fingerprint!
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ===================================================================
             PHASE 2: 4-NODE LIVE NETWORK HIGHWAY & DATA TRANSIT
             =================================================================== */
          <>
            {renderHeader("PART 4/5: AUTHENTICATION", "ZERO-KNOWLEDGE PIPELINE")}

            {/* Real Fiber Optic Cable Video Background */}
            <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 0.28, pointerEvents: "none" }}>
              <OffthreadVideo
                src={getAsset("fiber_optic_cable.mp4")}
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, #060913 0%, rgba(6,9,19,0.5) 30%, rgba(6,9,19,0.7) 70%, #060913 100%)",
                }}
              />
            </div>

            {/* Visual 4-Node Network Circuit Flow */}
            <div
              style={{
                position: "absolute",
                top: 400,
                left: 60,
                right: 60,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                zIndex: 35,
              }}
            >
              {[
                {
                  id: "device",
                  icon: "👆",
                  title: "1. RESIDENT & POS SCANNER",
                  sub: "Biometric captured & encrypted on-chip with UIDAI Public Key",
                  badge: "PID ENCRYPTED ✓",
                  color: "#00F0FF",
                  isPassed: true,
                  isActive: !isAtBank && !isAtAsa && !isAtUidai,
                },
                {
                  id: "bank",
                  icon: "🏦",
                  title: "2. BANK SERVER (AUA GATEWAY)",
                  sub: "No private key — forwards blind ciphertext to network switch",
                  badge: isAtBank ? "BLIND FORWARD" : isAtAsa || isAtUidai ? "FORWARDED BLIND ✓" : "WAITING",
                  color: isAtBank ? "#EF4444" : "#94A3B8",
                  isPassed: isAtAsa || isAtUidai,
                  isActive: isAtBank,
                },
                {
                  id: "asa",
                  icon: "⚡",
                  title: "3. TELECOM / ASA SWITCH",
                  sub: "Dedicated leased pipe — zero decryption or payload inspection",
                  badge: isAtAsa ? "ENCRYPTED PIPE" : isAtUidai ? "ROUTED ✓" : "STANDBY",
                  color: isAtAsa ? "#F59E0B" : "#94A3B8",
                  isPassed: isAtUidai,
                  isActive: isAtAsa,
                },
                {
                  id: "uidai",
                  icon: "🏛️",
                  title: "4. UIDAI CENTRAL VAULT (HSM)",
                  sub: "Only place with private key. Matches 1:1 against stored minutiae",
                  badge: isAtUidai ? (isYesPayoff ? "MATCH: 'YES' ✓" : "DECRYPTING HSM...") : "LOCKED VAULT",
                  color: isAtUidai ? "#10B981" : "#94A3B8",
                  isPassed: isYesPayoff,
                  isActive: isAtUidai,
                },
              ].map((node, idx) => (
                <div
                  key={node.id}
                  style={{
                    backgroundColor: node.isActive ? "rgba(30, 41, 59, 0.95)" : "rgba(15, 23, 42, 0.85)",
                    border: `2px solid ${node.isActive ? node.color : node.isPassed ? "#10B981" : "#334155"}`,
                    borderRadius: 18,
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: node.isActive ? `0 0 30px ${node.color}55` : "none",
                    backdropFilter: "blur(10px)",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 14,
                        backgroundColor: node.isActive ? `${node.color}22` : "rgba(255,255,255,0.05)",
                        border: `1.5px solid ${node.isActive ? node.color : "#475569"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 26,
                      }}
                    >
                      {node.icon}
                    </div>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 16, color: "#FFF", fontWeight: 800 }}>
                        {node.title}
                      </div>
                      <div style={{ fontFamily: FONT, fontSize: 13, color: "#94A3B8", marginTop: 2, maxWidth: 440 }}>
                        {node.sub}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 12,
                      fontWeight: 900,
                      color: node.isActive ? node.color : node.isPassed ? "#10B981" : "#64748B",
                      backgroundColor: node.isActive ? `${node.color}22` : "rgba(0,0,0,0.3)",
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: `1px solid ${node.isActive ? node.color : "#334155"}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {node.badge}
                  </span>
                </div>
              ))}
            </div>

            {/* Traveling Data Packet Animation (Progress indicator) */}
            <div
              style={{
                position: "absolute",
                top: 880,
                left: 60,
                right: 60,
                backgroundColor: "rgba(11, 17, 32, 0.95)",
                border: "2px solid #00F0FF",
                borderRadius: 20,
                padding: "18px 24px",
                display: "flex",
                alignItems: "center",
                gap: 20,
                boxShadow: "0 10px 40px rgba(0,240,255,0.25)",
                zIndex: 35,
              }}
            >
              <div
                style={{
                  fontSize: 34,
                  filter: "drop-shadow(0 0 10px #00F0FF)",
                }}
              >
                🔐
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: "#00F0FF", fontWeight: 900 }}>
                    ENCRYPTED PID TRANSIT PACKET
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: "#10B981", fontWeight: 800 }}>
                    AES-256 + 2048-BIT RSA
                  </span>
                </div>
                {/* Progress bar line */}
                <div style={{ width: "100%", height: 8, backgroundColor: "#1E293B", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(10, ((frame - 150) / (durationInFrames - 150)) * 100))}%`,
                      height: "100%",
                      backgroundColor: "#00F0FF",
                      boxShadow: "0 0 12px #00F0FF",
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Giant Payoff Banner: Open Loop Solved */}
            {isYesPayoff && (
              <div
                style={{
                  position: "absolute",
                  bottom: 390,
                  left: 60,
                  right: 60,
                  backgroundColor: "rgba(6, 78, 59, 0.95)",
                  border: "3px solid #10B981",
                  borderRadius: 22,
                  padding: "20px 24px",
                  textAlign: "center",
                  boxShadow: "0 0 50px rgba(16, 185, 129, 0.6)",
                  zIndex: 45,
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 14, color: "#A7F3D0", fontWeight: 900, letterSpacing: "0.15em" }}>
                  THE OPEN-LOOP ANSWER:
                </div>
                <h2 style={{ fontFamily: FONT, fontSize: 32, fontWeight: 900, color: "#FFFFFF", margin: "6px 0" }}>
                  BANK GETS ONLY: <span style={{ color: "#10B981", backgroundColor: "rgba(0,0,0,0.4)", padding: "2px 14px", borderRadius: 8 }}>"YES" ✓</span>
                </h2>
                <p style={{ fontFamily: FONT, fontSize: 17, color: "#D1FAE5", margin: 0, fontWeight: 600 }}>
                  Raw fingerprint never entered the bank's database!
                </p>
              </div>
            )}
          </>
        )}
      </AbsoluteFill>
    );
  }

  // ===========================================================================
  // S7: THREATS (Real Cyber Security Video B-Roll, Intercept, Replay, Fake Finger)
  // ===========================================================================
  if (variant === "aadhaar_threats") {
    const isIntercept = frame < 180;
    const isReplay = frame >= 180 && frame < 360;
    const isFake = frame >= 360;

    return (
      <AbsoluteFill style={{ backgroundColor: "#060913", overflow: "hidden", color: "#FFF" }}>
        <ChapterProgressBar currentPart={4} accent={accent} />
        {renderHeader("PART 4/5: THREAT DEFENSE", "3 HACK ATTEMPTS DEFLECTED")}

        {/* Real Cyber Security Code Video B-Roll Covering Full Canvas */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 0.5 }}>
          <OffthreadVideo
            src={getAsset("cyber_security_code.mp4")}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, #060913 0%, rgba(6,9,19,0.3) 25%, rgba(6,9,19,0.3) 75%, #060913 100%)",
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 80,
            zIndex: 35,
          }}
        >
          {isIntercept && (
            <div
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.94)",
                border: "3px solid #EF4444",
                borderRadius: 24,
                padding: "32px 40px",
                textAlign: "center",
                maxWidth: "85%",
                boxShadow: "0 0 50px rgba(239, 68, 68, 0.5)",
              }}
            >
              <div style={{ fontSize: 60, marginBottom: 12 }}>🕵️‍♂️ ⚡</div>
              <h3 style={{ fontFamily: FONT, fontSize: 32, fontWeight: 900, color: "#FFFFFF", margin: 0 }}>
                ATTACK 1: PACKET INTERCEPTED
              </h3>
              <p style={{ fontFamily: MONO, fontSize: 18, color: "#FCA5A5", marginTop: 10 }}>
                Hacker opens packet ➔ Sees only indecipherable noise!
              </p>
            </div>
          )}

          {isReplay && (
            <div
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.94)",
                border: "3px solid #EF4444",
                borderRadius: 24,
                padding: "32px 40px",
                textAlign: "center",
                maxWidth: "85%",
                boxShadow: "0 0 50px rgba(239, 68, 68, 0.5)",
              }}
            >
              <div style={{ fontSize: 60, marginBottom: 12 }}>🔄 🚫</div>
              <h3 style={{ fontFamily: FONT, fontSize: 32, fontWeight: 900, color: "#FFFFFF", margin: 0 }}>
                ATTACK 2: REPLAY OLD PACKET
              </h3>
              <div
                style={{
                  backgroundColor: "#EF4444",
                  color: "#FFF",
                  fontFamily: MONO,
                  fontSize: 20,
                  fontWeight: 900,
                  padding: "8px 20px",
                  borderRadius: 10,
                  display: "inline-block",
                  marginTop: 12,
                }}
              >
                ALREADY USED ✗
              </div>
            </div>
          )}

          {isFake && (
            <div
              style={{
                backgroundColor: "rgba(15, 23, 42, 0.94)",
                border: "3px solid #EF4444",
                borderRadius: 24,
                padding: "32px 40px",
                textAlign: "center",
                maxWidth: "85%",
                boxShadow: "0 0 50px rgba(239, 68, 68, 0.5)",
              }}
            >
              <div style={{ fontSize: 60, marginBottom: 12 }}>🧤 ❌</div>
              <h3 style={{ fontFamily: FONT, fontSize: 32, fontWeight: 900, color: "#FFFFFF", margin: 0 }}>
                ATTACK 3: FAKE RUBBER FINGER
              </h3>
              <div
                style={{
                  backgroundColor: "#EF4444",
                  color: "#FFF",
                  fontFamily: MONO,
                  fontSize: 20,
                  fontWeight: 900,
                  padding: "8px 20px",
                  borderRadius: 10,
                  display: "inline-block",
                  marginTop: 12,
                }}
              >
                LIVENESS CHECK FAILED ✗
              </div>
              <p style={{ fontFamily: MONO, fontSize: 16, color: "#CBD5E1", marginTop: 12 }}>
                Optical sensor detects zero blood pulse flow
              </p>
            </div>
          )}
        </div>
      </AbsoluteFill>
    );
  }

  // ===========================================================================
  // S8: eKYC (Resident Explicit Consent Toggle, Signed Data)
  // ===========================================================================
  // ===========================================================================
  // S8: eKYC (Resident Explicit Consent Toggle, Signed Data)
  // ===========================================================================
  if (variant === "aadhaar_ekyc") {
    const isConsentOn = frame < 200;

    return (
      <AbsoluteFill style={{ backgroundColor: "#060913", overflow: "hidden", color: "#FFF" }}>
        <ChapterProgressBar currentPart={5} accent={accent} />
        {renderHeader("PART 5/5: eKYC & CONSENT", "RESIDENT-DRIVEN DATA")}

        {/* Two-column layout: Ravi on left, Smartphone toggle on right */}
        <div
          style={{
            position: "absolute",
            top: 410,
            left: 60,
            right: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            zIndex: 35,
          }}
        >
          {/* Ravi Avatar */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <RaviAvatar size={230} mood={isConsentOn ? "smiling" : "alarmed"} />
            <div
              style={{
                marginTop: 10,
                backgroundColor: "#1E293B",
                padding: "6px 14px",
                borderRadius: 10,
                border: "1.5px solid #00F0FF",
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: "#FFF" }}>
                RAVI (DATA OWNER)
              </span>
            </div>
          </div>

          {/* Smartphone Mockup */}
          <div
            style={{
              width: 380,
              backgroundColor: "#0F172A",
              border: `3px solid ${isConsentOn ? "#10B981" : "#EF4444"}`,
              borderRadius: 32,
              padding: 22,
              boxShadow: `0 0 45px ${isConsentOn ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)"}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: MONO, fontSize: 15, color: "#FFF", fontWeight: 800 }}>
                RESIDENT CONSENT
              </span>
              <div
                style={{
                  width: 58,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: isConsentOn ? "#10B981" : "#EF4444",
                  position: "relative",
                  transition: "all 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: "#FFF",
                    position: "absolute",
                    top: 3,
                    left: isConsentOn ? 31 : 3,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                backgroundColor: "#1E293B",
                borderRadius: 14,
                padding: 14,
                border: "1px solid #334155",
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 13, color: "#CBD5E1", lineHeight: 1.5 }}>
                Name: <span style={{ color: "#FFF", fontWeight: 800 }}>Ravi Sharma</span> <br />
                DOB: 14-08-1996 <br />
                Address: New Delhi <br />
                Photo: [VERIFIED ENROLMENT]
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: 14 }}>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 14,
                  fontWeight: 900,
                  color: isConsentOn ? "#10B981" : "#EF4444",
                }}
              >
                {isConsentOn ? "✓ CONSENT: ACTIVE (SHARING)" : "🚫 CONSENT: REVOKED (BLOCKED)"}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Transmission Outcome Banner */}
        <div
          style={{
            position: "absolute",
            bottom: 390,
            left: 60,
            right: 60,
            backgroundColor: isConsentOn ? "rgba(6, 78, 59, 0.95)" : "rgba(127, 29, 29, 0.95)",
            border: `2px solid ${isConsentOn ? "#10B981" : "#EF4444"}`,
            borderRadius: 20,
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: `0 10px 40px ${isConsentOn ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            zIndex: 35,
          }}
        >
          <span style={{ fontSize: 36 }}>{isConsentOn ? "📜 ✍️" : "🛑 🔒"}</span>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 900, color: isConsentOn ? "#A7F3D0" : "#FCA5A5" }}>
              {isConsentOn ? "DIGITALLY SIGNED eKYC SENT TO BANK" : "ZERO DATA TRANSMITTED WITHOUT CONSENT"}
            </div>
            <div style={{ fontFamily: FONT, fontSize: 14, color: "#E2E8F0", marginTop: 2 }}>
              {isConsentOn
                ? "UIDAI signs payload with official cryptographic certificate"
                : "Aadhaar Act prevents any agency from accessing data without resident consent"}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // ===========================================================================
  // S9: PRIVACY SUPERPOWERS (16-Digit VID, Masked Card, Offline QR, Bio Lock)
  // ===========================================================================
  if (variant === "aadhaar_privacy") {
    const showChapterCard = frame < 20;

    return (
      <AbsoluteFill style={{ backgroundColor: "#060913", overflow: "hidden", color: "#FFF" }}>
        <ChapterProgressBar currentPart={5} accent={accent} />

        {showChapterCard ? (
          <ChapterFlashCard partNum={5} partTitle="RESIDENT SUPERPOWERS" accent={accent} />
        ) : (
          <>
            {renderHeader("PART 5/5: PRIVACY CONTROLS", "4 RESIDENT SUPERPOWERS")}

            {/* 4 Privacy Shield Cards Grid */}
            <div
              style={{
                position: "absolute",
                top: 400,
                left: 60,
                right: 60,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                zIndex: 35,
              }}
            >
              {[
                { title: "16-DIGIT VID", icon: "🔢", desc: "Revocable Virtual ID replaced anytime", badge: "9812 4432 0918 5541", color: "#00F0FF" },
                { title: "MASKED AADHAAR", icon: "🕶️", desc: "Shows only last 4 digits", badge: "•••• •••• 7654", color: "#10B981" },
                { title: "OFFLINE QR CODE", icon: "📱", desc: "Verifies in Airplane Mode", badge: "AIRPLANE MODE ✓", color: "#F59E0B" },
                { title: "BIOMETRIC LOCK", icon: "🔒", desc: "Disable fingerprint & iris in mAadhaar", badge: "LOCKED 🔒", color: "#EF4444" },
              ].map((tool, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    border: `2px solid ${tool.color}`,
                    borderRadius: 18,
                    padding: "16px 18px",
                    boxShadow: `0 0 25px ${tool.color}33`,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 30 }}>{tool.icon}</span>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 11,
                        fontWeight: 900,
                        color: tool.color,
                        backgroundColor: `${tool.color}22`,
                        padding: "3px 8px",
                        borderRadius: 6,
                        border: `1px solid ${tool.color}44`,
                      }}
                    >
                      {tool.badge}
                    </span>
                  </div>
                  <h4 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 900, color: "#FFFFFF", margin: "10px 0 0 0" }}>
                    {tool.title}
                  </h4>
                  <p style={{ fontFamily: FONT, fontSize: 13, color: "#94A3B8", marginTop: 4, lineHeight: 1.3, marginBottom: 0 }}>
                    {tool.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Empowered Ravi with Defensive Perimeter in Center Bottom */}
            <div
              style={{
                position: "absolute",
                bottom: 380,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 35,
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Glowing Shield Ring */}
                <div
                  style={{
                    position: "absolute",
                    width: 250,
                    height: 250,
                    borderRadius: "50%",
                    border: "2px dashed #00F0FF",
                    boxShadow: "0 0 40px rgba(0, 240, 255, 0.3)",
                    animation: "spin 20s linear infinite",
                  }}
                />
                <RaviAvatar size={210} mood="smiling" />
              </div>

              <div
                style={{
                  marginTop: 8,
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: "1.5px solid #00F0FF",
                  borderRadius: 12,
                  padding: "6px 18px",
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 900, color: "#00F0FF" }}>
                  🛡️ 4 RESIDENT PRIVACY SHIELDS
                </span>
              </div>
            </div>
          </>
        )}
      </AbsoluteFill>
    );
  }

  // ===========================================================================
  // S10: RECAP & SEAMLESS LOOP (Key, Fingerprint, YES -> Frame 0 Scanner Prism)
  // ===========================================================================
  if (variant === "aadhaar_outro_loop") {
    // Last 20 frames snap back into Frame 0 thumb on scanner
    const isLoopSnap = frame >= durationInFrames - 20;

    return (
      <AbsoluteFill style={{ backgroundColor: "#060913", overflow: "hidden", color: "#FFF" }}>
        <ChapterProgressBar currentPart={5} accent={accent} />

        {!isLoopSnap ? (
          <>
            {renderHeader("RECAP & PAYOFF", "ZERO-KNOWLEDGE ARCHITECTURE")}

            <div
              style={{
                position: "absolute",
                top: 410,
                left: 60,
                right: 60,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {[
                { label: "1. NUMBER = KEY", desc: "Contains zero demographic data", icon: "🔑" },
                { label: "2. BIOMETRIC = PROOF", desc: "Never leaves UIDAI's central vault", icon: "👆" },
                { label: "3. BANK GETS ONLY 'YES'", desc: "Raw biometrics never shared", icon: "✓" },
              ].map((pillar, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#0F172A",
                    border: "2px solid #00F0FF",
                    borderRadius: 18,
                    padding: "18px 24px",
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    boxShadow: "0 0 25px rgba(0, 240, 255, 0.25)",
                  }}
                >
                  <span style={{ fontSize: 36 }}>{pillar.icon}</span>
                  <div>
                    <h3 style={{ fontFamily: FONT, fontSize: 24, fontWeight: 900, color: "#FFFFFF", margin: 0 }}>
                      {pillar.label}
                    </h3>
                    <span style={{ fontFamily: MONO, fontSize: 14, color: "#94A3B8" }}>
                      {pillar.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ position: "absolute", bottom: 420, left: "50%", transform: "translateX(-50%)" }}>
              <RaviAvatar size={240} mood="smiling" />
            </div>
          </>
        ) : (
          /* Seamless Loop Snap: Matches Frame 0 Exactly */
          <AbsoluteFill>
            <OffthreadVideo
              src={getAsset("fingerprint_scanner.mp4")}
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.65,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "42%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                padding: "24px 48px",
                borderRadius: 24,
                backgroundColor: "rgba(16, 185, 129, 0.25)",
                border: "4px solid #10B981",
                boxShadow: "0 0 60px #10B981",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 8 }}>👆 ✓</div>
              <div style={{ fontFamily: MONO, fontSize: 32, fontWeight: 900, color: "#10B981" }}>
                AUTHENTICATION: SUCCESS
              </div>
            </div>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    );
  }

  return null;
};
