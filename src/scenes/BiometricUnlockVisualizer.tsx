import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec } from "../types";
import { safeFont, TYPOGRAPHY_FLOOR } from "../layout";

export const BiometricUnlockVisualizer: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const variant = scene.variant || "hook";
  const tag = scene.tag || "01 / BIOMETRIC UNLOCK";
  const title = scene.title || "HOW BIOMETRIC UNLOCK WORKS";

  // Normalized progress [0 to 1] throughout the scene
  const progress = Math.min(Math.max(frame / Math.max(durationInFrames, 1), 0), 1);

  // Helper to load episode assets
  const getAsset = (file: string) => staticFile(`how-biometric-unlock-works/media/${file}`);

  // Modern vibrant palette (Dark futuristic with high-contrast neon accents)
  const FONT = "'Space Grotesk', -apple-system, sans-serif";
  const MONO = "'JetBrains Mono', monospace";

  const C = {
    bg: "#060A14",
    surface: "#0D1527",
    card: "rgba(13, 21, 39, 0.94)",
    border: "#1E2D4A",
    cyan: "#00F0FF",
    purple: "#A855F7",
    emerald: "#10B981",
    rose: "#F43F5E",
    amber: "#F59E0B",
    text: "#FFFFFF",
    muted: "#94A3B8",
  };

  // Top header bar (always large, crisp, and high-contrast)
  const renderTopBar = (stepTag: string, stepTitle: string, icon: string) => (
    <div
      style={{
        width: 960,
        minHeight: 90,
        borderRadius: 24,
        backgroundColor: "rgba(13, 21, 39, 0.94)",
        border: `3px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        marginBottom: 20,
        backdropFilter: "blur(16px)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: `linear-gradient(135deg, ${C.cyan}44, ${C.purple}55)`,
            border: `2px solid ${C.cyan}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
          }}
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontSize: safeFont(TYPOGRAPHY_FLOOR.badge, 24),
              fontFamily: MONO,
              color: C.cyan,
              letterSpacing: 2,
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            {stepTag}
          </div>
          <div
            style={{
              fontSize: safeFont(TYPOGRAPHY_FLOOR.subheading, 36),
              fontFamily: FONT,
              fontWeight: 900,
              color: C.text,
              letterSpacing: -0.5,
            }}
          >
            {stepTitle}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "rgba(0, 240, 255, 0.15)",
          padding: "10px 20px",
          borderRadius: 14,
          border: `2px solid ${C.cyan}66`,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: C.emerald,
            boxShadow: `0 0 14px ${C.emerald}`,
          }}
        />
        <span
          style={{
            fontFamily: MONO,
            fontSize: safeFont(24, 24),
            color: C.cyan,
            fontWeight: 800,
          }}
        >
          LIVE ACTION
        </span>
      </div>
    </div>
  );

  // =========================================================================
  // SCENE 1: THE HOOK (FINGER TAPS SCREEN -> GLANCE FACE -> 0.2s PADLOCK SNAPS)
  // Narration: "फ़ोन पर उँगली रखी या सिर्फ़ एक नज़र देखी—और सिर्फ़ आधे सेकंड से भी कम में लॉक खुल गया! लेकिन क्या आपका फ़ोन आपकी असली फ़ोटो संभाल कर रखता है?"
  // =========================================================================
  const renderHookScene = () => {
    // Stage 1: Finger presses phone (0% - 40%)
    const fingerY = interpolate(progress, [0, 0.25], [-120, 0], { extrapolateRight: "clamp" });
    const rippleRadius = interpolate(progress, [0.2, 0.55], [10, 160], { extrapolateRight: "clamp" });
    const rippleOpacity = interpolate(progress, [0.2, 0.55], [1, 0], { extrapolateRight: "clamp" });

    // Stage 2: Face Scan Laser Beam (40% - 65%)
    const laserActive = progress >= 0.35 && progress < 0.7;
    const laserGlow = Math.sin(frame * 0.4) * 8;

    // Stage 3: Instant Unlocked! (65% - 100%)
    const isUnlocked = progress >= 0.65;
    const padlockScale = spring({
      frame: Math.max(0, frame - durationInFrames * 0.65),
      fps,
      config: { damping: 8, stiffness: 220 },
    });
    const stopwatchSec = interpolate(progress, [0, 0.65], [0.00, 0.18], { extrapolateRight: "clamp" });

    return (
      <div style={{ width: 960, height: 1060, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {renderTopBar(tag, "FINGER TOUCH OR GLANCE • 0.2s", "📱")}

        {/* Live Word-Aligned Action Banner */}
        <div
          style={{
            width: 960,
            backgroundColor: isUnlocked ? `${C.emerald}25` : `${C.cyan}18`,
            border: `3px solid ${isUnlocked ? C.emerald : C.cyan}`,
            borderRadius: 22,
            padding: "20px 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
            boxShadow: `0 0 40px ${isUnlocked ? C.emerald : C.cyan}33`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ fontSize: 44 }}>{isUnlocked ? "🎉" : progress > 0.35 ? "👀" : "👆"}</div>
            <div>
              <div style={{ fontSize: safeFont(TYPOGRAPHY_FLOOR.subheading, 34), fontWeight: 900, color: isUnlocked ? C.emerald : C.text, fontFamily: FONT }}>
                {isUnlocked
                  ? "PADLOCK SNAPPED OPEN IN 0.18 SECONDS!"
                  : progress > 0.35
                  ? "STEP 2: GLANCING AT SCREEN (FACE ID)"
                  : "STEP 1: FINGER TOUCHES GLASS SENSOR"}
              </div>
              <div style={{ fontSize: safeFont(24, 24), color: C.muted, fontFamily: MONO, marginTop: 4 }}>
                {isUnlocked ? "Does the phone store your actual photo or fingerprint?" : "Watching recognition happen in real-time..."}
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: safeFont(44, 38),
              fontWeight: 900,
              fontFamily: MONO,
              color: isUnlocked ? C.emerald : C.cyan,
              backgroundColor: "#000",
              padding: "10px 22px",
              borderRadius: 14,
              border: `2px solid ${isUnlocked ? C.emerald : C.cyan}`,
            }}
          >
            {stopwatchSec.toFixed(2)}s
          </div>
        </div>

        {/* Visual Arena: Anime Character + Real Smartphone with Animated Finger & Padlock */}
        <div style={{ width: 960, height: 720, display: "flex", gap: 24 }}>
          {/* Left: Anime Character holding phone */}
          <div
            style={{
              flex: 1.1,
              backgroundColor: C.surface,
              borderRadius: 30,
              border: `3px solid ${laserActive ? C.purple : C.cyan}`,
              position: "relative",
              overflow: "hidden",
              boxShadow: `0 0 50px ${laserActive ? C.purple : C.cyan}33`,
            }}
          >
            <Img
              src={getAsset("anime_phone_unlock.jpg")}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* Animated Laser Scanning Overlay when Glancing */}
            {laserActive && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `radial-gradient(circle at 45% 30%, ${C.purple}55 0%, transparent 60%)`,
                  border: `4px solid ${C.purple}`,
                  boxShadow: `inset 0 0 40px ${C.purple}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(7, 11, 20, 0.9)",
                    border: `2px solid ${C.purple}`,
                    borderRadius: 16,
                    padding: "14px 24px",
                    color: "#FFF",
                    fontFamily: MONO,
                    fontSize: safeFont(26, 24),
                    fontWeight: 900,
                  }}
                >
                  ⚡ TRUE-DEPTH FACE SCAN ACTIVE!
                </div>
              </div>
            )}
          </div>

          {/* Right: Real Phone Sensor with Moving Finger and Padlock Pop */}
          <div
            style={{
              flex: 0.9,
              backgroundColor: C.surface,
              borderRadius: 30,
              border: `3px solid ${isUnlocked ? C.emerald : C.border}`,
              padding: "26px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Animated Golden Padlock in Center */}
            <div
              style={{
                transform: `scale(${isUnlocked ? padlockScale : 1})`,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: isUnlocked
                  ? `radial-gradient(circle, ${C.emerald}66 0%, transparent 75%)`
                  : `radial-gradient(circle, ${C.cyan}44 0%, transparent 75%)`,
                border: `5px solid ${isUnlocked ? C.emerald : C.cyan}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 84,
                boxShadow: `0 0 60px ${isUnlocked ? C.emerald : C.cyan}`,
                marginTop: 20,
              }}
            >
              {isUnlocked ? "🔓" : "🔒"}
            </div>

            {/* Moving Animated Finger hitting the Glass */}
            <div
              style={{
                width: "100%",
                height: 260,
                backgroundColor: "#050A14",
                borderRadius: 24,
                border: `3px solid ${C.cyan}`,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {/* Concentric Ultrasonic Ripple Waves Expanding on Touch */}
              {progress >= 0.2 && (
                <div
                  style={{
                    position: "absolute",
                    width: rippleRadius * 2,
                    height: rippleRadius * 2,
                    borderRadius: "50%",
                    border: `4px solid ${C.cyan}`,
                    opacity: rippleOpacity,
                  }}
                />
              )}

              {/* Finger emoji moving downwards to tap glass */}
              <div
                style={{
                  fontSize: 76,
                  transform: `translateY(${fingerY}px)`,
                  transition: "transform 0.05s linear",
                }}
              >
                👆
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 14,
                  fontSize: safeFont(24, 24),
                  fontFamily: MONO,
                  fontWeight: 900,
                  color: C.cyan,
                  backgroundColor: "rgba(0,0,0,0.8)",
                  padding: "6px 16px",
                  borderRadius: 10,
                }}
              >
                ULTRASONIC GLASS SENSOR
              </div>
            </div>

            {/* Bottom Question Callout */}
            <div
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: 16,
                backgroundColor: `${C.amber}25`,
                border: `2px solid ${C.amber}`,
                textAlign: "center",
                fontFamily: FONT,
                fontWeight: 900,
                fontSize: safeFont(26, 24),
                color: C.amber,
              }}
            >
              DOES PHONE STORE YOUR REAL PHOTO? 🤔
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCENE 2: HACKER THREAT (CARTOON HACKER BLOCKED -> ZERO PHOTOS EXIST)
  // Narration: "अगर कोई हैकर आपका फ़ोन हैक कर ले, तो क्या वो आपके फ़िंगरप्रिंट या चेहरे की फ़ोटो चुरा सकता है? जवाब है—बिल्कुल नहीं! क्योंकि आपका फ़ोन कभी भी आपकी असली फ़ोटो या फ़िंगरप्रिंट की तस्वीर सेव ही नहीं करता!"
  // =========================================================================
  const renderHackerMythScene = () => {
    // 0% - 45%: Hacker attacks with crowbar probe
    const hackerActive = progress < 0.45;
    // 45% - 100%: Superhero shield bursts in and blasts hacker away!
    const shieldActive = progress >= 0.45;
    const shieldPunch = spring({
      frame: Math.max(0, frame - durationInFrames * 0.45),
      fps,
      config: { damping: 9, stiffness: 240 },
    });

    return (
      <div style={{ width: 960, height: 1060, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {renderTopBar(tag, "THE BIGGEST MYTH BUSTED", "🛡️")}

        {/* Dynamic Action State Banner */}
        <div
          style={{
            width: 960,
            backgroundColor: shieldActive ? `${C.emerald}25` : `${C.rose}25`,
            border: `3px solid ${shieldActive ? C.emerald : C.rose}`,
            borderRadius: 24,
            padding: "22px 34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            boxShadow: `0 0 50px ${shieldActive ? C.emerald : C.rose}44`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 56 }}>{shieldActive ? "🛡️" : "🦹"}</div>
            <div>
              <div style={{ fontSize: safeFont(TYPOGRAPHY_FLOOR.subheading, 36), fontWeight: 900, fontFamily: FONT, color: shieldActive ? C.emerald : C.rose }}>
                {shieldActive ? "ANSWER: ABSOLUTELY NOT! (ज़रा भी नहीं!)" : "CAN A HACKER STEAL YOUR FINGERPRINT PHOTO?"}
              </div>
              <div style={{ fontSize: safeFont(26, 24), color: C.text, fontFamily: MONO, marginTop: 4 }}>
                {shieldActive ? "Your phone NEVER stores your real photo or fingerprint image!" : "Hacker searching phone storage for biometric photos..."}
              </div>
            </div>
          </div>
          <div
            style={{
              padding: "12px 24px",
              borderRadius: 14,
              backgroundColor: shieldActive ? C.emerald : C.rose,
              color: "#000",
              fontWeight: 900,
              fontSize: safeFont(26, 24),
              fontFamily: MONO,
            }}
          >
            {shieldActive ? "BLOCKED ✕" : "ATTACKING"}
          </div>
        </div>

        {/* Big Cartoon Action Arena */}
        <div style={{ width: 960, height: 720, display: "flex", gap: 24 }}>
          {/* Left: Hacker Looking for Photos (Empty broken album) */}
          <div
            style={{
              flex: 1,
              backgroundColor: C.surface,
              borderRadius: 30,
              border: `3px solid ${C.rose}`,
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: safeFont(26, 24), fontFamily: MONO, color: C.rose, fontWeight: 900 }}>
              HACKER SCANNING MEMORY
            </div>

            {/* Big Cartoon Visual: Empty Photo Album with 0 Files */}
            <div
              style={{
                width: 380,
                height: 420,
                backgroundColor: "#070D1B",
                borderRadius: 24,
                border: `3px dashed ${C.rose}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div style={{ fontSize: 90 }}>📁</div>
              <div style={{ fontSize: safeFont(32, 28), fontWeight: 900, color: C.text, fontFamily: FONT, marginTop: 10 }}>
                BIOMETRIC GALLERY
              </div>
              <div style={{ fontSize: safeFont(26, 24), color: C.muted, fontFamily: MONO, marginTop: 6 }}>
                0 PHOTOS FOUND
              </div>

              {/* Big Red Stamp when Shield Activates */}
              {shieldActive && (
                <div
                  style={{
                    position: "absolute",
                    backgroundColor: C.rose,
                    color: "#FFF",
                    fontFamily: MONO,
                    fontWeight: 900,
                    fontSize: safeFont(32, 28),
                    padding: "16px 32px",
                    borderRadius: 16,
                    transform: "rotate(-12deg)",
                    boxShadow: `0 0 40px ${C.rose}`,
                    textAlign: "center",
                  }}
                >
                  ✕ NO PHOTOS SAVED!
                </div>
              )}
            </div>

            <div
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: "rgba(244, 63, 94, 0.2)",
                borderRadius: 16,
                border: `2px solid ${C.rose}`,
                fontFamily: MONO,
                fontSize: safeFont(24, 24),
                color: C.rose,
                textAlign: "center",
                fontWeight: 900,
              }}
            >
              NO JPEG • NO PNG • ZERO RAW IMAGES!
            </div>
          </div>

          {/* Right: The Super-Shield (Only Scrambled Mathematical Vectors) */}
          <div
            style={{
              flex: 1,
              backgroundColor: C.surface,
              borderRadius: 30,
              border: `3px solid ${C.emerald}`,
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: `0 0 50px ${C.emerald}25`,
            }}
          >
            <div style={{ fontSize: safeFont(26, 24), fontFamily: MONO, color: C.emerald, fontWeight: 900 }}>
              WHAT ACTUALLY EXISTS
            </div>

            {/* Glowing Superhero Shield */}
            <div
              style={{
                width: 380,
                height: 420,
                backgroundColor: "#050B16",
                borderRadius: 24,
                border: `3px solid ${C.emerald}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                transform: `scale(${shieldActive ? shieldPunch : 1})`,
                boxShadow: `inset 0 0 40px rgba(16, 185, 129, 0.2)`,
              }}
            >
              <div style={{ fontSize: 90 }}>🛡️</div>
              <div style={{ fontSize: safeFont(34, 28), fontWeight: 900, color: C.emerald, fontFamily: FONT, marginTop: 12 }}>
                ONE-WAY MATH LOCK
              </div>
              <div style={{ fontSize: safeFont(24, 24), color: C.cyan, fontFamily: MONO, textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>
                256-BIT CRYPTO HASH<br />
                CANNOT BE CONVERTED BACK INTO A PICTURE!
              </div>
            </div>

            <div
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: "rgba(16, 185, 129, 0.2)",
                borderRadius: 16,
                border: `2px solid ${C.emerald}`,
                fontFamily: MONO,
                fontSize: safeFont(24, 24),
                color: C.emerald,
                textAlign: "center",
                fontWeight: 900,
              }}
            >
              ✓ 100% SECURE FROM THIEVES & MALWARE
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCENE 3: ULTRASONIC SOUND WAVES (SOUND RIPPLES BOUNCE OFF RIDGES & PORES)
  // Narration: "जब आप उँगली रखते हैं, तो स्क्रीन के नीचे छुपा अल्ट्रासोनिक सेंसर हज़ारों साउंड वेव्स छोड़ता है। ये ध्वनि तरंगें आपकी त्वचा की लकीरों और पसीने के नन्हें छेदों से टकराकर लौटती हैं, जिससे एक थ्री-डी नक़्शा बन जाता है।"
  // =========================================================================
  const renderUltrasonicScene = () => {
    // Sound waves travel up, hit skin, bounce back as glowing points
    const waveProgress = (frame * 5) % 100;
    const wavesHitSkin = progress >= 0.45;

    return (
      <div style={{ width: 960, height: 1060, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {renderTopBar(tag, "ULTRASONIC SOUND WAVES • 3D MAP", "🔊")}

        {/* Live Word Progress Banner */}
        <div
          style={{
            width: 960,
            backgroundColor: `${C.cyan}18`,
            border: `3px solid ${C.cyan}`,
            borderRadius: 22,
            padding: "20px 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 44 }}>{wavesHitSkin ? "🏔️" : "🌊"}</div>
            <div>
              <div style={{ fontSize: safeFont(TYPOGRAPHY_FLOOR.subheading, 34), fontWeight: 900, color: C.cyan, fontFamily: FONT }}>
                {wavesHitSkin ? "ECHOES BOUNCE BACK: 3D MOUNTAIN MAP!" : "SOUND WAVES TRAVELING THROUGH GLASS..."}
              </div>
              <div style={{ fontSize: safeFont(24, 24), color: C.text, fontFamily: MONO }}>
                {wavesHitSkin ? "Bouncing off bumps (ridges) & sweat pores like radar!" : "Qualcomm transducer emitting 15 MHz high-pitch sound waves"}
              </div>
            </div>
          </div>
          <div
            style={{
              padding: "10px 20px",
              backgroundColor: C.cyan,
              color: "#000",
              fontWeight: 900,
              fontFamily: MONO,
              fontSize: safeFont(24, 24),
              borderRadius: 12,
            }}
          >
            15 MHz SOUND
          </div>
        </div>

        {/* Giant Physical Cutaway Canvas */}
        <div
          style={{
            width: 960,
            height: 740,
            backgroundColor: C.surface,
            borderRadius: 30,
            border: `3px solid ${C.border}`,
            padding: "28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          <svg width="904" height="520" viewBox="0 0 904 520">
            <defs>
              <linearGradient id="skinGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FB7185" />
                <stop offset="100%" stopColor="#E11D48" />
              </linearGradient>
            </defs>

            {/* Dermal Skin: Big obvious bumps (hills) and valleys */}
            <path
              d="M 40,140 Q 95,50 150,140 Q 205,200 260,140 Q 315,50 370,140 Q 425,200 480,140 Q 535,50 590,140 Q 645,200 700,140 Q 755,50 810,140 Q 840,180 864,140 L 864,20 L 40,20 Z"
              fill="url(#skinGrad3)"
              stroke="#FDA4AF"
              strokeWidth="5"
            />
            <text x="60" y="65" fill="#FFE4E6" fontSize={safeFont(28, 24)} fontFamily={FONT} fontWeight="900">
              HUMAN FINGER SKIN (त्वचा की लकीरें)
            </text>

            {/* Glowing Sweat Pores */}
            {[150, 370, 590, 810].map((cx, i) => (
              <g key={i}>
                <circle cx={cx} cy="140" r="9" fill={C.cyan} />
                <text x={cx - 36} y="105" fill={C.cyan} fontSize={safeFont(24, 24)} fontFamily={MONO} fontWeight="900">
                  SWEAT PORE
                </text>
              </g>
            ))}

            {/* Phone Cover Glass Layer */}
            <rect x="40" y="160" width="824" height="60" rx="10" fill="rgba(56, 189, 248, 0.35)" stroke="#38BDF8" strokeWidth="4" />
            <text x="60" y="200" fill="#BAE6FD" fontSize={safeFont(28, 24)} fontFamily={MONO} fontWeight="900">
              SMARTPHONE GLASS SCREEN (ग्लास)
            </text>

            {/* OLED Layer */}
            <rect x="40" y="235" width="824" height="45" rx="8" fill="#0B132B" stroke="#475569" strokeWidth="3" />
            <text x="60" y="266" fill="#94A3B8" fontSize={safeFont(26, 24)} fontFamily={MONO} fontWeight="800">
              OLED DISPLAY MATRIX
            </text>

            {/* Sound Wave Emitter (Qualcomm Transducer) */}
            <rect x="180" y="330" width="544" height="70" rx="16" fill="linear-gradient(90deg, #00F0FF, #A855F7)" stroke="#FFF" strokeWidth="4" />
            <text x="210" y="374" fill="#000" fontSize={safeFont(28, 24)} fontFamily={MONO} fontWeight="900">
              ULTRASONIC SPEAKER (हज़ारों साउंड वेव्स)
            </text>

            {/* Animated Sound Ripples Shooting Up */}
            {Array.from({ length: 5 }).map((_, i) => {
              const y = 330 - ((waveProgress + i * 40) % 150);
              if (y < 160) return null;
              return (
                <path
                  key={i}
                  d={`M 200,${y} Q 450,${y - 25} 700,${y}`}
                  fill="none"
                  stroke={C.cyan}
                  strokeWidth="5"
                  strokeDasharray="8 6"
                />
              );
            })}

            {/* Reflected Echo Waves bouncing off skin bumps */}
            {wavesHitSkin && (
              <>
                <circle cx="260" cy="140" r="16" fill={C.amber} filter="drop-shadow(0 0 10px #F59E0B)" />
                <path d="M 260,140 L 260,330" stroke={C.amber} strokeWidth="4" strokeDasharray="6 4" />
                <text x="275" y="295" fill={C.amber} fontSize={safeFont(24, 24)} fontFamily={MONO} fontWeight="900">
                  ECHO PEAK (12ns)
                </text>
              </>
            )}
          </svg>

          {/* Bottom Clear Explanation Pills */}
          <div style={{ display: "flex", gap: 20 }}>
            <div
              style={{
                flex: 1,
                backgroundColor: "#050A14",
                padding: "16px 24px",
                borderRadius: 16,
                border: `3px solid ${C.cyan}`,
                fontFamily: FONT,
                fontSize: safeFont(26, 24),
                color: C.cyan,
                fontWeight: 900,
                textAlign: "center",
              }}
            >
              🌊 SOUND BOUNCES OFF PEAKS & VALLEYS
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: "#050A14",
                padding: "16px 24px",
                borderRadius: 16,
                border: `3px solid ${C.emerald}`,
                fontFamily: FONT,
                fontSize: safeFont(26, 24),
                color: C.emerald,
                fontWeight: 900,
                textAlign: "center",
              }}
            >
              🏔️ BUILDS 3D MOUNTAIN MAP OF SKIN!
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCENE 4: MINUTIAE DOTS (RED PINS ON ENDINGS, BLUE PINS ON SPLITS)
  // Narration: "सेंसर पूरी उँगली याद नहीं रखता, बल्कि सिर्फ़ तीस से चालीस 'माइन्यूशिया' पॉइंट्स पकड़ता है—जहाँ लकीरें ख़त्म होती हैं या दो हिस्सों में बँटती हैं। और इन्हें बदलकर एक दो सौ छप्पन-बिट की सुरक्षित गणितीय संख्या बना दी जाती है।"
  // =========================================================================
  const renderMinutiaeScene = () => {
    // Stage 1: Line endings & splits pop up like pins
    const pinsProgress = interpolate(progress, [0.35, 0.75], [0, 8], { extrapolateRight: "clamp" });
    // Stage 2: Transform into math box (75% - 100%)
    const mathBoxActive = progress >= 0.7;

    const points = [
      { x: 240, y: 150, type: "ending" },
      { x: 420, y: 140, type: "split" },
      { x: 620, y: 170, type: "ending" },
      { x: 260, y: 270, type: "split" },
      { x: 460, y: 260, type: "ending" },
      { x: 680, y: 280, type: "split" },
      { x: 340, y: 390, type: "ending" },
      { x: 550, y: 380, type: "split" },
    ];

    return (
      <div style={{ width: 960, height: 1060, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {renderTopBar(tag, "CONNECT THE DOTS • 30-40 PINS", "📍")}

        {/* Word Progress Banner */}
        <div
          style={{
            width: 960,
            backgroundColor: mathBoxActive ? `${C.amber}22` : `${C.purple}22`,
            border: `3px solid ${mathBoxActive ? C.amber : C.purple}`,
            borderRadius: 22,
            padding: "20px 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 44 }}>{mathBoxActive ? "🔢" : "🎯"}</div>
            <div>
              <div style={{ fontSize: safeFont(TYPOGRAPHY_FLOOR.subheading, 34), fontWeight: 900, color: mathBoxActive ? C.amber : C.purple, fontFamily: FONT }}>
                {mathBoxActive ? "TURNED INTO A 256-BIT SAFE NUMBER!" : "FINDS 30 TO 40 SPECIAL LANDMARKS"}
              </div>
              <div style={{ fontSize: safeFont(24, 24), color: C.text, fontFamily: MONO }}>
                {mathBoxActive ? "The entire finger image is deleted! Only the math stays." : "Red = Where line ends • Blue = Where line splits in two"}
              </div>
            </div>
          </div>
          <div
            style={{
              padding: "10px 22px",
              backgroundColor: mathBoxActive ? C.amber : C.purple,
              color: "#000",
              fontWeight: 900,
              fontFamily: MONO,
              fontSize: safeFont(24, 24),
              borderRadius: 12,
            }}
          >
            {mathBoxActive ? "256-BIT HASH" : "30-40 POINTS"}
          </div>
        </div>

        {/* Connect the Dots Canvas */}
        <div
          style={{
            width: 960,
            height: 740,
            backgroundColor: C.surface,
            borderRadius: 30,
            border: `3px solid ${C.border}`,
            padding: "28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <svg width="904" height="520" viewBox="0 0 904 520">
            {/* Background Fingerprint Lines */}
            {Array.from({ length: 14 }).map((_, i) => (
              <ellipse
                key={i}
                cx="452"
                cy="280"
                rx={100 + i * 24}
                ry={130 + i * 28}
                fill="none"
                stroke={C.border}
                strokeWidth="4"
                opacity={0.5}
              />
            ))}

            {/* Animated Pin Markers punching in */}
            {points.map((pt, i) => {
              if (i >= pinsProgress) return null;
              const isEnding = pt.type === "ending";
              const col = isEnding ? C.rose : C.cyan;

              return (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r="28" fill="none" stroke={col} strokeWidth="3" />
                  <circle cx={pt.x} cy={pt.y} r="10" fill={col} filter={`drop-shadow(0 0 10px ${col})`} />
                  <rect x={pt.x + 20} y={pt.y - 20} width="150" height="38" rx="10" fill="#000000EE" stroke={col} strokeWidth="2" />
                  <text x={pt.x + 30} y={pt.y + 7} fill="#FFF" fontSize={safeFont(24, 24)} fontFamily={MONO} fontWeight="900">
                    {isEnding ? "LINE END ✕" : "LINE SPLIT Y"}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Bottom Result Box */}
          <div
            style={{
              width: "100%",
              backgroundColor: "#050B16",
              borderRadius: 20,
              border: `3px solid ${mathBoxActive ? C.amber : C.cyan}`,
              padding: "20px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ fontSize: 36 }}>{mathBoxActive ? "🔐" : "🔎"}</span>
              <div style={{ fontSize: safeFont(26, 24), color: C.text, fontFamily: FONT, fontWeight: 900 }}>
                {mathBoxActive
                  ? "WHOLE FINGERPRINT DELETED ➔ SAVED AS: '9e107d9d...256b'"
                  : "LOOKING ONLY FOR LINE ENDINGS & SPLITS (NO FULL PHOTO)"}
              </div>
            </div>
            <div
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                backgroundColor: `${C.emerald}25`,
                color: C.emerald,
                fontFamily: MONO,
                fontWeight: 900,
                fontSize: safeFont(24, 24),
                border: `2px solid ${C.emerald}`,
              }}
            >
              AES-256
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCENE 5: 3D FACE UNLOCK (PHOTO SPOOF REJECTED -> 30,000 GLOWING DOTS)
  // Narration: "और फ़ेस अनलॉक? साधारण कैमरे वाले टू-डी फ़ेस अनलॉक को तो कोई भी आपकी फ़ोटो दिखाकर बेवकूफ़ बना सकता है! लेकिन थ्री-डी फ़ेस अनलॉक आपके चेहरे पर तीस हज़ार से ज़्यादा अदृश्य इन्फ्रारेड डॉट्स फेंकता है!"
  // =========================================================================
  const renderFaceDotScene = () => {
    // 0% - 45%: Paper photo held up, phone buzzer ✕
    const photoSpoofActive = progress < 0.45;
    // 45% - 100%: 30,000 dots spray onto 3D anime face
    const dotsSpraying = progress >= 0.45;

    return (
      <div style={{ width: 960, height: 1060, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {renderTopBar(tag, "2D PHOTO SPOOF VS 30,000 3D DOTS", "🎭")}

        {/* Word Progress Banner */}
        <div
          style={{
            width: 960,
            backgroundColor: dotsSpraying ? `${C.purple}25` : `${C.rose}25`,
            border: `3px solid ${dotsSpraying ? C.purple : C.rose}`,
            borderRadius: 22,
            padding: "20px 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 44 }}>{dotsSpraying ? "✨" : "📄"}</div>
            <div>
              <div style={{ fontSize: safeFont(TYPOGRAPHY_FLOOR.subheading, 34), fontWeight: 900, color: dotsSpraying ? C.purple : C.rose, fontFamily: FONT }}>
                {dotsSpraying ? "30,000 INVISIBLE DOTS SPRAY OVER 3D FACE!" : "CHEAP 2D CAMERA FOOLED BY PAPER PHOTO!"}
              </div>
              <div style={{ fontSize: safeFont(24, 24), color: C.text, fontFamily: MONO }}>
                {dotsSpraying ? "Measuring real 3D shape of nose, cheeks & chin" : "A flat 2D selfie camera has no depth vision!"}
              </div>
            </div>
          </div>
          <div
            style={{
              padding: "10px 20px",
              backgroundColor: dotsSpraying ? C.purple : C.rose,
              color: "#FFF",
              fontWeight: 900,
              fontFamily: MONO,
              fontSize: safeFont(24, 24),
              borderRadius: 12,
            }}
          >
            {dotsSpraying ? "30,000 IR DOTS" : "2D VULNERABLE"}
          </div>
        </div>

        {/* Split Screen Arena */}
        <div style={{ width: 960, height: 740, display: "flex", gap: 24 }}>
          {/* Left: Paper Photo Fooling Phone */}
          <div
            style={{
              flex: 0.95,
              backgroundColor: C.surface,
              borderRadius: 30,
              border: `3px solid ${C.rose}`,
              padding: "26px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: safeFont(26, 24), color: C.rose, fontFamily: MONO, fontWeight: 900 }}>
              CHEAP 2D CAMERA (FLAT PHOTO)
            </div>

            <div
              style={{
                width: 360,
                height: 440,
                backgroundColor: "#070C18",
                borderRadius: 24,
                border: `3px dashed ${C.rose}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <div style={{ fontSize: 100 }}>📄</div>
              <div style={{ fontSize: safeFont(32, 28), fontWeight: 900, color: C.text, fontFamily: FONT, marginTop: 10 }}>
                PRINTED PAPER PHOTO
              </div>
              <div
                style={{
                  position: "absolute",
                  backgroundColor: C.rose,
                  color: "#FFF",
                  fontFamily: MONO,
                  fontWeight: 900,
                  fontSize: safeFont(28, 24),
                  padding: "14px 28px",
                  borderRadius: 14,
                  transform: "rotate(10deg)",
                  boxShadow: `0 0 30px ${C.rose}`,
                }}
              >
                ✕ TRICKED BY PHOTO!
              </div>
            </div>

            <div
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: "rgba(244, 63, 94, 0.2)",
                borderRadius: 14,
                border: `2px solid ${C.rose}`,
                fontFamily: FONT,
                fontSize: safeFont(24, 24),
                color: C.rose,
                textAlign: "center",
                fontWeight: 900,
              }}
            >
              FLAT 2D: NO DEPTH SENSING
            </div>
          </div>

          {/* Right: Anime Character With 30,000 Infrared Dots */}
          <div
            style={{
              flex: 1.05,
              backgroundColor: C.surface,
              borderRadius: 30,
              border: `3px solid ${C.purple}`,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "26px",
              boxShadow: `0 0 50px ${C.purple}33`,
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
              <Img src={getAsset("anime_face_scan.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to top, rgba(6,10,20,0.95) 0%, rgba(6,10,20,0.2) 60%, rgba(6,10,20,0.95) 100%)" }} />
            </div>

            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ backgroundColor: "rgba(6,10,20,0.9)", border: `2px solid ${C.purple}`, padding: "12px 20px", borderRadius: 14, display: "inline-block" }}>
                <div style={{ fontSize: safeFont(24, 24), color: C.purple, fontFamily: MONO, fontWeight: 900 }}>
                  APPLE TRUEDEPTH VCSEL
                </div>
                <div style={{ fontSize: safeFont(32, 28), fontWeight: 900, color: C.text, fontFamily: FONT }}>
                  30,000 3D INFRARED DOTS
                </div>
              </div>
            </div>

            <div style={{ position: "relative", zIndex: 2, backgroundColor: "rgba(6,10,20,0.92)", borderRadius: 16, padding: "18px 24px", border: `2px solid ${C.purple}` }}>
              <div style={{ fontSize: safeFont(26, 24), color: C.cyan, fontFamily: FONT, fontWeight: 900 }}>
                ✨ 30,000 INVISIBLE DOTS BEND OVER NOSE & EYES
              </div>
              <div style={{ fontSize: safeFont(24, 24), color: C.text, fontFamily: MONO, marginTop: 4 }}>
                Paper photos are flat, so they fail instantly!
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCENE 6: LIVENESS & SLEEP GUARD (CUTE SLEEPING ANIME CHARACTER BLOCKS UNLOCK)
  // Narration: "इन्फ्रारेड कैमरा इन डॉट्स की गहराई नापकर आपके चेहरे का एक थ्री-डी मेश बनाता है। और अटेंशन डिटेक्शन यह पक्का करता है कि आपकी आँखें खुली हों—ताकि जब आप सो रहे हों, तो कोई आपका फ़ोन अनलॉक न कर सके!"
  // =========================================================================
  const renderLivenessScene = () => {
    // 0% - 45%: Measuring depth mesh
    // 45% - 100%: Sleeping anime character in bed -> Phone rejected!
    const sleepGuardActive = progress >= 0.45;

    return (
      <div style={{ width: 960, height: 1060, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {renderTopBar(tag, "ATTENTION DETECTION • SLEEP SHIELD", "😴")}

        {/* Word Progress Banner */}
        <div
          style={{
            width: 960,
            backgroundColor: sleepGuardActive ? `${C.rose}25` : `${C.emerald}25`,
            border: `3px solid ${sleepGuardActive ? C.rose : C.emerald}`,
            borderRadius: 22,
            padding: "20px 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 44 }}>{sleepGuardActive ? "🚫" : "👁️"}</div>
            <div>
              <div style={{ fontSize: safeFont(TYPOGRAPHY_FLOOR.subheading, 34), fontWeight: 900, color: sleepGuardActive ? C.rose : C.emerald, fontFamily: FONT }}>
                {sleepGuardActive ? "PROTECTION: CANNOT UNLOCK WHILE SLEEPING!" : "STEP 1: CONFIRMING EYES ARE OPEN"}
              </div>
              <div style={{ fontSize: safeFont(24, 24), color: C.text, fontFamily: MONO }}>
                {sleepGuardActive ? "Eyes closed = Attention detector locks phone completely!" : "Camera tracks pupils to ensure you are awake and looking"}
              </div>
            </div>
          </div>
          <div
            style={{
              padding: "10px 20px",
              backgroundColor: sleepGuardActive ? C.rose : C.emerald,
              color: "#FFF",
              fontWeight: 900,
              fontFamily: MONO,
              fontSize: safeFont(24, 24),
              borderRadius: 12,
            }}
          >
            {sleepGuardActive ? "SLEEP LOCKED" : "AWAKE CHECK"}
          </div>
        </div>

        {/* Visual Arena: Cute Sleeping Anime Character + Rejection Shield */}
        <div style={{ width: 960, height: 740, display: "flex", gap: 24 }}>
          {/* Left: Cute Sleeping Anime Character in Bed */}
          <div
            style={{
              flex: 1.1,
              backgroundColor: C.surface,
              borderRadius: 30,
              border: `3px solid ${C.purple}`,
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            }}
          >
            <Img src={getAsset("anime_sleeping.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

            {/* Floating Cartoon Zzz... */}
            <div
              style={{
                position: "absolute",
                top: 40,
                right: 40,
                fontSize: 60,
                fontWeight: 900,
                color: C.cyan,
                fontFamily: FONT,
                textShadow: `0 0 20px ${C.cyan}`,
              }}
            >
              Z z z . . .
            </div>

            {/* Bottom Status Badge */}
            <div
              style={{
                position: "absolute",
                bottom: 24,
                left: 20,
                right: 20,
                backgroundColor: "rgba(6,10,20,0.9)",
                borderRadius: 18,
                padding: "16px 24px",
                border: `2px solid ${C.rose}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: safeFont(24, 24), color: C.rose, fontFamily: MONO, fontWeight: 900 }}>
                  EYES CLOSED STATUS: ASLEEP
                </div>
                <div style={{ fontSize: safeFont(28, 26), color: C.text, fontFamily: FONT, fontWeight: 900 }}>
                  ATTENTION DETECTION: FAILED ✕
                </div>
              </div>
              <span style={{ fontSize: 36 }}>🔒</span>
            </div>
          </div>

          {/* Right: Security Rejection Telemetry */}
          <div
            style={{
              flex: 0.9,
              backgroundColor: C.surface,
              borderRadius: 30,
              border: `3px solid ${C.rose}`,
              padding: "26px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: safeFont(24, 24), color: C.muted, fontFamily: MONO }}>
                ANTI-SPOOF SAFETY
              </div>
              <div style={{ fontSize: safeFont(32, 28), fontWeight: 900, color: C.text, fontFamily: FONT }}>
                ZERO SLEEP UNLOCK
              </div>
            </div>

            {/* Big Cartoon Lock with Angry Rejection */}
            <div
              style={{
                width: 200,
                height: 200,
                borderRadius: "50%",
                backgroundColor: "rgba(244, 63, 94, 0.2)",
                border: `5px solid ${C.rose}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 90,
                boxShadow: `0 0 60px ${C.rose}`,
              }}
            >
              🛑
            </div>

            <div
              style={{
                width: "100%",
                backgroundColor: "#050A14",
                borderRadius: 18,
                border: `2px solid ${C.rose}`,
                padding: "20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: safeFont(28, 26), fontWeight: 900, color: C.rose, fontFamily: FONT }}>
                ✕ ACCESS DENIED!
              </div>
              <div style={{ fontSize: safeFont(24, 24), color: C.text, fontFamily: MONO, marginTop: 6 }}>
                Someone putting phone to your face while you sleep CANNOT unlock it!
              </div>
            </div>

            <div
              style={{
                width: "100%",
                padding: "16px",
                backgroundColor: "rgba(0, 240, 255, 0.15)",
                borderRadius: 14,
                border: `2px solid ${C.cyan}`,
                fontFamily: MONO,
                fontSize: safeFont(24, 24),
                color: C.cyan,
                textAlign: "center",
                fontWeight: 900,
              }}
            >
              1 IN 1,000,000 SAFETY LEVEL
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCENE 7: SECURE ENCLAVE (GIANT BANK VAULT INSIDE CHIP • OS HAS NO ENTRY)
  // Narration: "ये सारा डेटा फ़ोन की आम मेमोरी में नहीं, बल्कि प्रोसेसर के अंदर एक अलग हार्डवेयर लॉकर 'सिक्योर एन्क्लेव' में क़ैद रहता है। ऑपरेटिंग सिस्टम तक को अंदर झाँकने की इजाज़त नहीं होती!"
  // =========================================================================
  const renderSecureEnclaveScene = () => {
    // 0% - 50%: Vault door seals shut with massive gears
    // 50% - 100%: Android & Apple hit the door with NO ENTRY sign
    const noEntryActive = progress >= 0.5;

    return (
      <div style={{ width: 960, height: 1060, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {renderTopBar(tag, "THE HARDWARE VAULT (SECURE ENCLAVE)", "🏦")}

        {/* Word Progress Banner */}
        <div
          style={{
            width: 960,
            backgroundColor: `${C.amber}22`,
            border: `3px solid ${C.amber}`,
            borderRadius: 22,
            padding: "20px 30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 44 }}>{noEntryActive ? "🛑" : "🔐"}</div>
            <div>
              <div style={{ fontSize: safeFont(TYPOGRAPHY_FLOOR.subheading, 34), fontWeight: 900, color: C.amber, fontFamily: FONT }}>
                {noEntryActive ? "EVEN ANDROID & iOS CANNOT ENTER!" : "A HEAVY STEEL BANK VAULT INSIDE THE CHIP"}
              </div>
              <div style={{ fontSize: safeFont(24, 24), color: C.text, fontFamily: MONO }}>
                {noEntryActive ? "Zero OS access! The vault keeps the keys totally separated." : "Hardware processor with its own private computer & keys"}
              </div>
            </div>
          </div>
          <div
            style={{
              padding: "10px 20px",
              backgroundColor: C.amber,
              color: "#000",
              fontWeight: 900,
              fontFamily: MONO,
              fontSize: safeFont(24, 24),
              borderRadius: 12,
            }}
          >
            NO OS ENTRY
          </div>
        </div>

        {/* Cartoon Bank Vault Arena */}
        <div style={{ width: 960, height: 740, display: "flex", gap: 24 }}>
          {/* Left: Untrusted Android / iOS Outside the Door */}
          <div
            style={{
              flex: 0.9,
              backgroundColor: C.surface,
              borderRadius: 30,
              border: `3px dashed ${C.border}`,
              padding: "26px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: safeFont(26, 24), color: C.muted, fontFamily: MONO, fontWeight: 900 }}>
              OUTSIDE: PHONE OPERATING SYSTEM
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", alignItems: "center" }}>
              <div style={{ fontSize: 72 }}>🤖 🍎</div>
              <div style={{ fontSize: safeFont(32, 28), fontWeight: 900, color: C.text, fontFamily: FONT }}>
                ANDROID & iOS
              </div>
              <div style={{ fontSize: safeFont(24, 24), color: C.muted, fontFamily: MONO, textAlign: "center" }}>
                Runs apps, games, websites, messages
              </div>

              {/* Big Red No Entry Sign */}
              <div
                style={{
                  width: "100%",
                  padding: "18px",
                  backgroundColor: "rgba(244, 63, 94, 0.2)",
                  borderRadius: 16,
                  border: `3px solid ${C.rose}`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: safeFont(30, 26), fontWeight: 900, color: C.rose, fontFamily: FONT }}>
                  🚫 NO ENTRY!
                </div>
                <div style={{ fontSize: safeFont(24, 24), color: C.text, fontFamily: MONO, marginTop: 4 }}>
                  Operating system has NO KEY to open this vault!
                </div>
              </div>
            </div>

            <div style={{ fontSize: safeFont(24, 24), color: C.muted, fontFamily: MONO }}>
              Even hackers with root access are stopped cold!
            </div>
          </div>

          {/* Right: Giant Golden Bank Vault (Secure Enclave) */}
          <div
            style={{
              flex: 1.1,
              backgroundColor: "#050A16",
              borderRadius: 30,
              border: `4px solid ${C.cyan}`,
              padding: "26px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: `0 0 60px ${C.cyan}33`,
            }}
          >
            <div style={{ fontSize: safeFont(26, 24), color: C.cyan, fontFamily: MONO, fontWeight: 900 }}>
              INSIDE: THE SECURE ENCLAVE
            </div>

            {/* Massive Bank Vault Wheel */}
            <div
              style={{
                width: 280,
                height: 280,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${C.amber}44 0%, #0F172A 70%)`,
                border: `8px solid ${C.amber}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                boxShadow: `0 0 50px ${C.amber}`,
              }}
            >
              {/* Vault Wheel Spokes */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: 8,
                    height: "100%",
                    backgroundColor: C.amber,
                    transform: `rotate(${i * 30}deg)`,
                  }}
                />
              ))}
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  backgroundColor: "#000",
                  border: `4px solid ${C.amber}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 48,
                  zIndex: 2,
                }}
              >
                🔒
              </div>
            </div>

            <div
              style={{
                width: "100%",
                padding: "16px 20px",
                backgroundColor: "rgba(0, 240, 255, 0.15)",
                borderRadius: 16,
                border: `2px solid ${C.cyan}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: safeFont(28, 26), fontWeight: 900, color: C.cyan, fontFamily: FONT }}>
                SEPARATE SILICON HARDWARE
              </div>
              <div style={{ fontSize: safeFont(24, 24), color: C.text, fontFamily: MONO, marginTop: 4 }}>
                Factory-fused AES-256 keys physically trapped inside!
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCENE 8: BINARY ANSWER & PAYOFF (GIANT GREEN 'YES!' BUTTON PUNCHES DOWN)
  // Narration: "जब आप अनलॉक करते हैं, तो एन्क्लेव सिर्फ़ एक ही जवाब देता है: 'हाँ' या 'ना'। यानी कोई फ़ोटो नहीं, सिर्फ़ सुरक्षित गणित! अगली बार जब एक झटके में फ़ोन अनलॉक हो, तो इस सीक्रेट साइंस को याद रखना!"
  // =========================================================================
  const renderMatchPayoffScene = () => {
    // Stage 1: Big Green YES button slams down
    const buttonPunch = spring({
      frame: Math.max(0, frame - 5),
      fps,
      config: { damping: 9, stiffness: 220 },
    });

    return (
      <div style={{ width: 960, height: 1060, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {renderTopBar(tag, "THE FINAL CRYPTO HANDSHAKE", "✅")}

        {/* Giant Green YES Button Slam */}
        <div
          style={{
            transform: `scale(${buttonPunch})`,
            width: 960,
            backgroundColor: `${C.emerald}25`,
            border: `4px solid ${C.emerald}`,
            borderRadius: 24,
            padding: "24px 34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            boxShadow: `0 0 60px ${C.emerald}44`,
          }}
        >
          <div>
            <div style={{ fontSize: safeFont(24, 24), color: C.muted, fontFamily: MONO }}>
              VAULT COMPARISON COMPLETE: 99.8% MATCH
            </div>
            <div style={{ fontSize: safeFont(TYPOGRAPHY_FLOOR.heading, 46), fontWeight: 900, color: C.emerald, fontFamily: FONT }}>
              OUTPUT: JUST ONE WORD — 'YES!' (1)
            </div>
          </div>
          <div
            style={{
              padding: "16px 36px",
              borderRadius: 18,
              backgroundColor: C.emerald,
              color: "#000",
              fontWeight: 900,
              fontFamily: FONT,
              fontSize: safeFont(38, 32),
              boxShadow: `0 0 35px ${C.emerald}`,
            }}
          >
            YES! 🔓
          </div>
        </div>

        {/* 3 Kid-Friendly Golden Rules */}
        <div style={{ width: 960, display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
          {/* Rule 1 */}
          <div
            style={{
              backgroundColor: C.surface,
              borderRadius: 20,
              border: `3px solid ${C.cyan}`,
              padding: "20px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ fontSize: 44 }}>🖼️ ➔ 🔢</div>
              <div>
                <div style={{ fontSize: safeFont(30, 26), fontWeight: 900, color: C.text, fontFamily: FONT }}>
                  1. NO PHOTOS! ONLY CONNECT-THE-DOTS MATH
                </div>
                <div style={{ fontSize: safeFont(24, 24), color: C.muted, fontFamily: MONO }}>
                  No photos saved. Only line endings and 3D numbers.
                </div>
              </div>
            </div>
            <span style={{ fontSize: 36, color: C.emerald }}>✓</span>
          </div>

          {/* Rule 2 */}
          <div
            style={{
              backgroundColor: C.surface,
              borderRadius: 20,
              border: `3px solid ${C.purple}`,
              padding: "20px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ fontSize: 44 }}>✨ 😴</div>
              <div>
                <div style={{ fontSize: safeFont(30, 26), fontWeight: 900, color: C.text, fontFamily: FONT }}>
                  2. 30,000 DOTS & NEVER UNLOCKS WHILE YOU SLEEP
                </div>
                <div style={{ fontSize: safeFont(24, 24), color: C.muted, fontFamily: MONO }}>
                  Attention detection requires conscious open eyes!
                </div>
              </div>
            </div>
            <span style={{ fontSize: 36, color: C.emerald }}>✓</span>
          </div>

          {/* Rule 3 */}
          <div
            style={{
              backgroundColor: C.surface,
              borderRadius: 20,
              border: `3px solid ${C.amber}`,
              padding: "20px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ fontSize: 44 }}>🏦 🔑</div>
              <div>
                <div style={{ fontSize: safeFont(30, 26), fontWeight: 900, color: C.text, fontFamily: FONT }}>
                  3. SECURE ENCLAVE BANK VAULT GUARDS THE KEYS
                </div>
                <div style={{ fontSize: safeFont(24, 24), color: C.muted, fontFamily: MONO }}>
                  Operating system never touches your biometric secret!
                </div>
              </div>
            </div>
            <span style={{ fontSize: 36, color: C.emerald }}>✓</span>
          </div>
        </div>

        {/* Channel Branding & Bell Ring */}
        <div
          style={{
            width: 960,
            backgroundColor: "linear-gradient(135deg, #1E293B, #0F172A)",
            borderRadius: 24,
            border: `3px solid ${C.cyan}`,
            padding: "22px 34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: `0 0 50px ${C.cyan}33`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.cyan}, ${C.purple})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 38,
              }}
            >
              🔔
            </div>
            <div>
              <div style={{ fontSize: safeFont(32, 28), fontWeight: 900, color: C.text, fontFamily: FONT }}>
                RAJAN का ADDA • TECH MADE EASY!
              </div>
              <div style={{ fontSize: safeFont(24, 24), color: C.cyan, fontFamily: MONO, marginTop: 4 }}>
                Subscribe for more fun science & technology animations!
              </div>
            </div>
          </div>
          <div
            style={{
              backgroundColor: C.cyan,
              color: "#000",
              fontWeight: 900,
              fontSize: safeFont(28, 24),
              fontFamily: FONT,
              padding: "16px 32px",
              borderRadius: 14,
            }}
          >
            SUBSCRIBE 🔔
          </div>
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 140, // Top safe zone
        overflow: "hidden",
      }}
    >
      {/* Background Subtle Tech Grid */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `radial-gradient(circle at 50% 20%, rgba(0, 240, 255, 0.08) 0%, transparent 60%),
            linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: "100% 100%, 40px 40px, 40px 40px",
          pointerEvents: "none",
        }}
      />

      {variant === "hook" && renderHookScene()}
      {variant === "hacker_myth" && renderHackerMythScene()}
      {variant === "ultrasonic_fingerprint" && renderUltrasonicScene()}
      {variant === "minutiae_points" && renderMinutiaeScene()}
      {variant === "face_dot_projector" && renderFaceDotScene()}
      {variant === "liveness_attention" && renderLivenessScene()}
      {variant === "secure_enclave" && renderSecureEnclaveScene()}
      {variant === "match_and_payoff" && renderMatchPayoffScene()}
    </AbsoluteFill>
  );
};
