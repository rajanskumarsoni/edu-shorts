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
import { FONT, MONO, resolveSceneTag } from "../theme";
import { MathFormula } from "../MathFormula";

type EMudhraVariant =
  | "campus_headquarters"
  | "certificate_lifecycle"
  | "d4_catastrophe"
  | "domestic_moat";

export const EMudhraVisualizer: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const L = useLayout();
  const isLandscape = L.landscape;

  const variant = (scene.variant as EMudhraVariant) || "certificate_lifecycle";
  const tag = resolveSceneTag(scene, "01 / EMUDHRA SECURITY ANALYSIS");
  const title = scene.title || "eMudhra Security Explainer";

  // Shared entrance spring
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 90 } });

  // -------------------------------------------------------------------------
  // VARIANT 1: 3D CORPORATE HEADQUARTERS & STOCK CRASH SHOCKWAVE
  // -------------------------------------------------------------------------
  if (variant === "campus_headquarters") {
    const imgScale = interpolate(frame, [0, durationInFrames], [1.0, 1.08], {
      easing: Easing.out(Easing.quad),
    });
    const imgY = interpolate(frame, [0, durationInFrames], [0, -30]);

    // Flashing emergency banner
    const alertPulse = Math.sin((frame / fps) * Math.PI * 4) > 0 ? 1 : 0.4;
    const tickerProgress = (frame * 2.5) % 800;

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070B14",
          overflow: "hidden",
          fontFamily: FONT,
        }}
      >
        {/* Background 3D Headquarters Image with cinematic slow zoom */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${imgScale}) translateY(${imgY}px)`,
            transformOrigin: "center center",
            zIndex: 1,
          }}
        >
          <Img
            src={
              scene.image
                ? staticFile(scene.image)
                : staticFile("emudhra-security-leak/media/emudhra_3d_headquarters.jpg")
            }
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Cinematic Vignette & Bottom Scrim */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(7, 11, 20, 0.85) 0%, rgba(7, 11, 20, 0.2) 30%, rgba(7, 11, 20, 0.4) 60%, rgba(7, 11, 20, 0.95) 100%)",
            zIndex: 2,
          }}
        />

        {/* Top Header Tag Zone */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? 40 : 80,
            left: isLandscape ? 80 : 60,
            right: isLandscape ? 80 : 60,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            zIndex: 10,
            opacity: enter,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: isLandscape ? 22 : 28,
              fontWeight: 800,
              color: "#FF4444",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#FF4444",
                boxShadow: "0 0 14px #FF4444",
                opacity: alertPulse,
              }}
            />
            {tag}
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: isLandscape ? 44 : 56,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: "#FFFFFF",
              textShadow: "0 4px 20px rgba(0,0,0,0.8)",
            }}
          >
            {title}
          </h1>
        </div>

        {/* Floating Stock Crash HUD Telemetry Card */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? 240 : 380,
            left: 60,
            right: 60,
            zIndex: 10,
            opacity: enter,
          }}
        >
          <div
            style={{
              background: "rgba(11, 16, 32, 0.88)",
              backdropFilter: "blur(20px)",
              border: "2px solid rgba(255, 68, 68, 0.6)",
              borderRadius: 24,
              padding: "20px 24px",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255, 68, 68, 0.25)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 22,
                  color: "#94A3B8",
                  letterSpacing: "0.1em",
                }}
              >
                NSE: EMUDHRA · DALAL STREET
              </div>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  fontFamily: MONO,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                }}
              >
                ₹340.00
                <span
                  style={{
                    fontSize: 26,
                    color: "#FF4444",
                    fontWeight: 800,
                  }}
                >
                  ▼ -40.2%
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "rgba(255, 68, 68, 0.18)",
                border: "1.5px solid #FF4444",
                borderRadius: 12,
                padding: "10px 18px",
                fontFamily: MONO,
                fontSize: 22,
                fontWeight: 900,
                color: "#FF4444",
                letterSpacing: "0.08em",
                textAlign: "center",
              }}
            >
              LOWER CIRCUIT HIT
            </div>
          </div>
        </div>

        {/* Bottom News Flash Ticker Bar (above 350px caption safe zone) */}
        <div
          style={{
            position: "absolute",
            bottom: isLandscape ? 80 : 420,
            left: 0,
            right: 0,
            backgroundColor: "rgba(255, 68, 68, 0.95)",
            padding: "12px 0",
            zIndex: 10,
            overflow: "hidden",
            boxShadow: "0 0 25px rgba(255, 68, 68, 0.6)",
          }}
        >
          <div
            style={{
              whiteSpace: "nowrap",
              fontFamily: MONO,
              fontSize: 24,
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "0.15em",
              transform: `translateX(-${tickerProgress}px)`,
            }}
          >
            🚨 FLASH: WEAK INTERMEDIATE CA KEYS EXPOSED · MOZILLA ONECRL DISTRUST DEPLOYED · GOOGLE CHROME BLOCKS CERTS · MEITY & CERT-IN LAUNCH SPECIAL INVESTIGATION TEAM (SIT) PROBE ·
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------------------
  // VARIANT 2: STEP-BY-STEP MOTION GRAPHICS — HOW DIGITAL CERTIFICATES WORK
  // -------------------------------------------------------------------------
  if (variant === "certificate_lifecycle") {
    // 4 Sequential steps timed across the scene duration
    const totalDuration = durationInFrames;
    const stepDuration = totalDuration / 4;

    const currentStep = Math.min(
      3,
      Math.floor(frame / stepDuration)
    );

    const steps = [
      {
        num: "01",
        title: "DOMAIN KEYPAIR",
        desc: "Website generates Private Key (Secret) & Public Key",
        icon: "🔑",
        detail: "https://bank.com creates CSR request",
        color: "#00F0FF",
      },
      {
        num: "02",
        title: "CA VERIFICATION",
        desc: "eMudhra verifies domain control & organization identity",
        icon: "🏛️",
        detail: "Validation against global DNS & legal records",
        color: "#38BDF8",
      },
      {
        num: "03",
        title: "CRYPTOGRAPHIC SIGN",
        desc: "eMudhra's Intermediate CA stamps with its Master Private Key",
        icon: "✍️",
        detail: "Creates digital signature binding domain to public key",
        color: "#F59E0B",
      },
      {
        num: "04",
        title: "BROWSER VERIFIES",
        desc: "Chrome / Firefox checks Root Trust Store → Green Padlock!",
        icon: "🔒",
        detail: "Encrypted HTTPS tunnel established for user",
        color: "#10B981",
      },
    ];

    // Traveling packet position
    const packetProgress = interpolate(
      frame % stepDuration,
      [0, stepDuration - 5],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#080D1A",
          backgroundImage:
            "radial-gradient(circle at 50% 20%, rgba(0, 240, 255, 0.08) 0%, transparent 60%)",
          overflow: "hidden",
          fontFamily: FONT,
        }}
      >
        {/* Top Header Tag Zone */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? 40 : 80,
            left: isLandscape ? 80 : 60,
            right: isLandscape ? 80 : 60,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 10,
            opacity: enter,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: isLandscape ? 22 : 26,
              fontWeight: 800,
              color: accent,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            {tag}
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: isLandscape ? 42 : 52,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: "#FFFFFF",
            }}
          >
            {title}
          </h1>
        </div>

        {/* 4 Interactive Step Cards Stacked in Portrait */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? 170 : 250,
            left: isLandscape ? 80 : 48,
            right: isLandscape ? 80 : 48,
            bottom: isLandscape ? 80 : 410, // Generous 410px safe margin above Devanagari captions
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 14,
            zIndex: 5,
          }}
        >
          {steps.map((st, i) => {
            const isActive = i <= currentStep;
            const isCurrent = i === currentStep;

            const cardSpring = spring({
              frame: frame - i * 10,
              fps,
              config: { damping: 15, stiffness: 100 },
            });

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  background: isCurrent
                    ? "linear-gradient(135deg, rgba(16, 28, 54, 0.95) 0%, rgba(10, 18, 36, 0.95) 100%)"
                    : isActive
                    ? "rgba(15, 23, 42, 0.8)"
                    : "rgba(15, 23, 42, 0.4)",
                  border: isCurrent
                    ? `2px solid ${st.color}`
                    : isActive
                    ? "1px solid rgba(255, 255, 255, 0.2)"
                    : "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: 20,
                  padding: "12px 18px",
                  boxShadow: isCurrent
                    ? `0 10px 30px rgba(0,0,0,0.7), 0 0 20px ${st.color}33`
                    : "0 6px 20px rgba(0,0,0,0.4)",
                  transform: `scale(${cardSpring})`,
                  opacity: cardSpring,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Active Scanning Bar */}
                {isCurrent && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 6,
                      backgroundColor: st.color,
                      boxShadow: `0 0 12px ${st.color}`,
                    }}
                  />
                )}

                {/* Left Number & Icon Pill */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    backgroundColor: isCurrent ? `${st.color}25` : "rgba(255,255,255,0.06)",
                    border: `1.5px solid ${isCurrent ? st.color : "rgba(255,255,255,0.15)"}`,
                    marginRight: 20,
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 32 }}>{st.icon}</span>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 20,
                      fontWeight: 900,
                      color: isCurrent ? st.color : "#94A3B8",
                    }}
                  >
                    {st.num}
                  </span>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 24,
                        fontWeight: 900,
                        color: isCurrent ? "#FFFFFF" : isActive ? "#E2E8F0" : "#64748B",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {st.title}
                    </span>

                    {isCurrent && (
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: 20,
                          fontWeight: 800,
                          color: st.color,
                          backgroundColor: `${st.color}22`,
                          padding: "4px 12px",
                          borderRadius: 8,
                          border: `1.5px solid ${st.color}66`,
                        }}
                      >
                        IN EXECUTION
                      </span>
                    )}
                    {isActive && !isCurrent && (
                      <span
                        style={{
                          fontFamily: MONO,
                          fontSize: 20,
                          fontWeight: 800,
                          color: "#10B981",
                        }}
                      >
                        ✓ VERIFIED
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: isCurrent ? "#FFFFFF" : "#CBD5E1",
                      lineHeight: 1.35,
                      marginBottom: 6,
                    }}
                  >
                    {st.desc}
                  </div>

                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 20,
                      color: isCurrent ? st.color : "#94A3B8",
                      fontWeight: 700,
                    }}
                  >
                    {st.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Exploit Danger Alert Pill (Appears at Step 4) */}
        {currentStep >= 2 && (
          <div
            style={{
              position: "absolute",
              bottom: isLandscape ? 60 : 380,
              left: 48,
              right: 48,
              background: "rgba(239, 68, 68, 0.15)",
              border: "1.5px solid #EF4444",
              borderRadius: 14,
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: 24 }}>⚠️</span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 22,
                fontWeight: 900,
                color: "#FCA5A5",
                letterSpacing: "0.05em",
                textAlign: "center",
              }}
            >
              IF INTERMEDIATE CA KEY IS WEAK: ATTACKER CAN SIGN ANY FAKE SITE!
            </span>
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------------------
  // VARIANT 3: THE "d = 4" CRYPTOGRAPHIC CATASTROPHE
  // -------------------------------------------------------------------------
  if (variant === "d4_catastrophe") {
    // Pulse animation for the red digit "4"
    const pulseScale = 1 + 0.08 * Math.sin((frame / fps) * Math.PI * 3);

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070B14",
          backgroundImage:
            "radial-gradient(circle at 50% 30%, rgba(255, 68, 68, 0.12) 0%, transparent 70%)",
          overflow: "hidden",
          fontFamily: FONT,
        }}
      >
        {/* Top Header Tag Zone */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? 40 : 80,
            left: isLandscape ? 80 : 60,
            right: isLandscape ? 80 : 60,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            zIndex: 10,
            opacity: enter,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: isLandscape ? 22 : 26,
              fontWeight: 800,
              color: "#FF4444",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            {tag}
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: isLandscape ? 40 : 52,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: "#FFFFFF",
            }}
          >
            {title}
          </h1>
        </div>

        {/* Central ECC Math Formula Badge with KaTeX */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? 170 : 250,
            left: 48,
            right: 48,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            zIndex: 10,
            opacity: enter,
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "2px solid rgba(0, 240, 255, 0.5)",
              borderRadius: 22,
              padding: "18px 28px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.8), 0 0 30px rgba(0, 240, 255, 0.2)",
              width: "100%",
              maxWidth: 960,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: MONO,
                fontSize: 22,
                fontWeight: 900,
                color: "#00F0FF",
                letterSpacing: "0.15em",
                marginBottom: 8,
              }}
            >
              ELLIPTIC CURVE CRYPTOGRAPHY (ECC) KEY GENERATION
            </div>
            <MathFormula
              equation="Q = d \times G"
              accent="#00F0FF"
              fontSize={isLandscape ? 34 : 44}
              color="#FFFFFF"
            />
            <div
              style={{
                fontFamily: MONO,
                fontSize: 22,
                fontWeight: 700,
                color: "#94A3B8",
                marginTop: 8,
                letterSpacing: "0.08em",
              }}
            >
              PUBLIC KEY (Q) = SECRET SCALAR (d) × CURVE BASE POINT (G)
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison: EXPECTED vs eMUDHRA ACTUAL */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? 340 : 490,
            left: 48,
            right: 48,
            bottom: isLandscape ? 80 : 410, // Above 380px caption zone
            display: "flex",
            flexDirection: isLandscape ? "row" : "column",
            gap: 20,
            zIndex: 10,
          }}
        >
          {/* Card 1: Expected Standard Cryptography */}
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(16, 24, 40, 0.95)",
              border: "1.5px solid rgba(16, 185, 129, 0.6)",
              borderRadius: 22,
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 12px 35px rgba(0,0,0,0.7)",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#10B981",
                    letterSpacing: "0.12em",
                  }}
                >
                  WHAT WAS EXPECTED (NIST P-384)
                </span>
                <span
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.18)",
                    color: "#10B981",
                    fontSize: 20,
                    fontFamily: MONO,
                    fontWeight: 900,
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: "1px solid rgba(16, 185, 129, 0.4)",
                  }}
                >
                  SECURE · 100% ENTROPY
                </span>
              </div>

              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  marginBottom: 10,
                }}
              >
                384-Bit Random Prime Scalar
              </div>

              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 22,
                  color: "#A7F3D0",
                  lineHeight: 1.45,
                  wordBreak: "break-all",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  marginBottom: 12,
                }}
              >
                d ≈ 71928471920485719385... (115 Digits)
              </div>

              {/* Entropy Bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 20, color: "#10B981", fontWeight: 800, marginBottom: 4 }}>
                  <span>CRYPTOGRAPHIC ENTROPY</span>
                  <span>384 / 384 BITS</span>
                </div>
                <div style={{ height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: "100%", height: "100%", backgroundColor: "#10B981", boxShadow: "0 0 10px #10B981" }} />
                </div>
              </div>
            </div>

            <div
              style={{
                fontFamily: MONO,
                fontSize: 22,
                color: "#10B981",
                fontWeight: 800,
                letterSpacing: "0.04em",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                padding: "8px 14px",
                borderRadius: 8,
              }}
            >
              🛡️ Brute-Force Complexity: 2¹⁹² Ops (&gt; 1 Trillion Years)
            </div>
          </div>

          {/* Card 2: eMudhra Catastrophic Flaw */}
          <div
            style={{
              flex: 1.25,
              backgroundColor: "rgba(35, 14, 20, 0.95)",
              border: "2px solid #FF4444",
              borderRadius: 22,
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 14px 45px rgba(255, 68, 68, 0.35)",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#FF4444",
                    letterSpacing: "0.12em",
                  }}
                >
                  WHAT eMUDHRA ACTUALLY GENERATED
                </span>
                <span
                  style={{
                    backgroundColor: "#FF4444",
                    color: "#FFFFFF",
                    fontSize: 20,
                    fontFamily: MONO,
                    fontWeight: 900,
                    padding: "4px 12px",
                    borderRadius: 6,
                    boxShadow: "0 0 10px rgba(255, 68, 68, 0.5)",
                  }}
                >
                  CATASTROPHIC LEAK · ZERO ENTROPY
                </span>
              </div>

              {/* Massive Number 4 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 20,
                  margin: "8px 0",
                }}
              >
                <div
                  style={{
                    fontSize: 92,
                    fontWeight: 900,
                    color: "#FF4444",
                    fontFamily: MONO,
                    lineHeight: 1,
                    transform: `scale(${pulseScale})`,
                    textShadow: "0 0 35px rgba(255, 68, 68, 0.9)",
                  }}
                >
                  d = 4
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 24,
                    color: "#FCA5A5",
                    fontWeight: 800,
                  }}
                >
                  (Single-Digit Integer!)
                </div>
              </div>

              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 22,
                  color: "#E2E8F0",
                  backgroundColor: "rgba(0,0,0,0.6)",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255, 68, 68, 0.4)",
                  lineHeight: 1.4,
                  marginBottom: 12,
                }}
              >
                Q = 4G = G + G + G + G (Only 4 Additions!)
              </div>

              {/* Entropy Bar Collapsed */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 20, color: "#FF4444", fontWeight: 800, marginBottom: 4 }}>
                  <span>COLLAPSED ENTROPY</span>
                  <span>~2.3 / 384 BITS</span>
                </div>
                <div style={{ height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: "3%", height: "100%", backgroundColor: "#FF4444", boxShadow: "0 0 10px #FF4444" }} />
                </div>
              </div>
            </div>

            <div
              style={{
                fontFamily: MONO,
                fontSize: 22,
                color: "#FF4444",
                fontWeight: 900,
                letterSpacing: "0.04em",
                backgroundColor: "rgba(255, 68, 68, 0.15)",
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid rgba(255, 68, 68, 0.4)",
              }}
            >
              ⚠️ Cracked in: &lt; 0.001 Seconds · Mozilla OneCRL Distrust Triggered!
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------------------
  // VARIANT 4: WILL THEY RECOVER? THE UNBREACHABLE DOMESTIC MOAT
  // -------------------------------------------------------------------------
  if (variant === "domestic_moat") {
    const pillars = [
      {
        num: "01",
        title: "MCA-21 CORPORATE",
        desc: "All Company Directors, DINs & Annual ROC Filings",
        icon: "🏢",
        status: "MONOPOLY",
        color: "#00F0FF",
      },
      {
        num: "02",
        title: "INCOME TAX & GST",
        desc: "Mandatory Corporate Tax Audits, e-Returns & Invoicing",
        icon: "📊",
        status: "IRREPLACEABLE",
        color: "#10B981",
      },
      {
        num: "03",
        title: "BANKING & eSIGN",
        desc: "Aadhaar eSign & Paperless Instant Loan Contracts",
        icon: "📱",
        status: "DEEP MOAT",
        color: "#38BDF8",
      },
      {
        num: "04",
        title: "JUDICIARY & GeM",
        desc: "High Court e-Filings & Govt e-Marketplace Tenders",
        icon: "⚖️",
        status: "MANDATED",
        color: "#F59E0B",
      },
    ];

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070B14",
          backgroundImage:
            "radial-gradient(circle at 50% 25%, rgba(0, 240, 255, 0.1) 0%, transparent 70%)",
          overflow: "hidden",
          fontFamily: FONT,
        }}
      >
        {/* Top Header Tag Zone */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? 40 : 80,
            left: isLandscape ? 80 : 60,
            right: isLandscape ? 80 : 60,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            zIndex: 10,
            opacity: enter,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: isLandscape ? 22 : 26,
              fontWeight: 800,
              color: "#10B981",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            {tag}
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: isLandscape ? 40 : 54,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: "#FFFFFF",
            }}
          >
            {title}
          </h1>
        </div>

        {/* 4 Domestic Moat Quadrants / Cards */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? 170 : 250,
            left: 48,
            right: 48,
            display: "grid",
            gridTemplateColumns: isLandscape ? "1fr 1fr 1fr 1fr" : "1fr 1fr",
            gap: 16,
            zIndex: 10,
          }}
        >
          {pillars.map((pil, idx) => {
            const pSpring = spring({
              frame: frame - idx * 6,
              fps,
              config: { damping: 15, stiffness: 100 },
            });

            return (
              <div
                key={idx}
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.92)",
                  border: `1.5px solid ${pil.color}55`,
                  borderRadius: 20,
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: `0 10px 30px rgba(0,0,0,0.6), 0 0 15px ${pil.color}15`,
                  transform: `scale(${pSpring})`,
                  opacity: pSpring,
                  minHeight: isLandscape ? 200 : 220,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontSize: 32 }}>{pil.icon}</span>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 20,
                        fontWeight: 900,
                        color: pil.color,
                        backgroundColor: `${pil.color}22`,
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: `1px solid ${pil.color}44`,
                      }}
                    >
                      {pil.status}
                    </span>
                  </div>

                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 24,
                      fontWeight: 900,
                      color: "#FFFFFF",
                      letterSpacing: "0.04em",
                      marginBottom: 6,
                    }}
                  >
                    {pil.title}
                  </div>

                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#CBD5E1",
                      lineHeight: 1.35,
                    }}
                  >
                    {pil.desc}
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 20,
                    fontWeight: 800,
                    color: pil.color,
                    marginTop: 8,
                  }}
                >
                  ✓ VERIFIED GOVT PIPELINE
                </div>
              </div>
            );
          })}
        </div>

        {/* Central Core Revenue Insulation Shield */}
        <div
          style={{
            position: "absolute",
            top: isLandscape ? 400 : 760,
            left: 48,
            right: 48,
            zIndex: 10,
            opacity: enter,
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(15, 23, 42, 0.95) 100%)",
              border: "2px solid #10B981",
              borderRadius: 22,
              padding: "24px 28px",
              boxShadow: "0 15px 40px rgba(0,0,0,0.8), 0 0 30px rgba(16, 185, 129, 0.25)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#10B981",
                  letterSpacing: "0.15em",
                  marginBottom: 4,
                }}
              >
                🇮🇳 REGULATORY ARCHITECTURE INSULATION
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  letterSpacing: "-0.01em",
                }}
              >
                CCA-Licensed Indian Vaults Are Completely Isolated
              </div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 22,
                  color: "#94A3B8",
                  marginTop: 4,
                }}
              >
                Zero shared cryptographic keys with revoked global SSL intermediates.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  color: "#10B981",
                  fontFamily: MONO,
                  lineHeight: 1,
                }}
              >
                99%
              </div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 20,
                  fontWeight: 800,
                  color: "#A7F3D0",
                  letterSpacing: "0.08em",
                }}
              >
                CORE REVENUE INTACT
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Payoff Conclusion Card (above 400px caption safe area) */}
        <div
          style={{
            position: "absolute",
            bottom: isLandscape ? 60 : 420,
            left: 48,
            right: 48,
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: 16,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: 24 }}>🔒</span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 22,
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "0.06em",
              textAlign: "center",
            }}
          >
            DOMESTIC DIGITAL SIGNATURE MONOPOLY REMAINS 100% UNTOUCHED
          </span>
        </div>
      </AbsoluteFill>
    );
  }

  return null;
};
