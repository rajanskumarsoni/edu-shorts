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
import { FONT, MONO, resolveSceneTag } from "../theme";

type QuickCommerceVariant =
  | "customer_order"
  | "picker_scanner"
  | "scooter_transit"
  | "countdown_blueprint";

export const QuickCommerceVisualizer: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const L = useLayout();
  const isLandscape = L.landscape;

  const variant = (scene.variant as QuickCommerceVariant) || "customer_order";
  const tag = resolveSceneTag(scene, "01 / QUICK COMMERCE LOGISTICS");
  const title = scene.title || "HOW 10-MINUTE DELIVERY WORKS";

  // Shared entrance spring
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 90 } });

  // -------------------------------------------------------------
  // VARIANT 1: CUSTOMER ORDER & 10-MINUTE COUNTDOWN TIMER
  // -------------------------------------------------------------
  const renderCustomerOrder = () => {
    // Tap event happens around frame 30
    const tapFrame = 28;
    const isOrdered = frame >= tapFrame;
    const tapScale = interpolate(
      frame,
      [tapFrame - 5, tapFrame, tapFrame + 8],
      [1, 0.92, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    // Countdown seconds from 10:00 down to 09:48
    const elapsedSecs = Math.floor(frame / fps);
    const remainingTotalSecs = Math.max(0, 600 - (isOrdered ? elapsedSecs * 2 : 0));
    const mins = Math.floor(remainingTotalSecs / 60);
    const secs = remainingTotalSecs % 60;
    const timeString = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

    // GPS radar pulse
    const radarScale = (frame % 45) / 45;
    const radarOpacity = 1 - radarScale;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          position: "relative",
        }}
      >
        {/* Smartphone Chassis */}
        <div
          style={{
            width: isLandscape ? 380 : 540,
            height: isLandscape ? 720 : 920,
            borderRadius: 52,
            background: "linear-gradient(145deg, #182236 0%, #0d1424 100%)",
            border: "4px solid rgba(255, 255, 255, 0.18)",
            boxShadow: `0 24px 80px rgba(0, 0, 0, 0.9), 0 0 40px ${accent}22`,
            padding: 16,
            position: "relative",
            overflow: "hidden",
            transform: `scale(${enter})`,
          }}
        >
          {/* Top Notch / Speaker */}
          <div
            style={{
              position: "absolute",
              top: 18,
              left: "50%",
              transform: "translateX(-50%)",
              width: 130,
              height: 24,
              background: "#080c16",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              zIndex: 20,
            }}
          >
            <div style={{ width: 44, height: 4, background: "#1f2a40", borderRadius: 4 }} />
            <div style={{ width: 8, height: 8, background: "#101828", borderRadius: "50%" }} />
          </div>

          {/* Smartphone Screen Inner */}
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 40,
              background: "linear-gradient(180deg, #090e1c 0%, #050811 100%)",
              padding: "54px 20px 24px",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* App Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 16,
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>⚡</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>QUICK COMMERCE</div>
                  <div style={{ fontSize: 12, color: accent, fontFamily: MONO }}>
                    DARK STORE #14 · 1.4 KM
                  </div>
                </div>
              </div>
              <div
                style={{
                  padding: "4px 10px",
                  borderRadius: 12,
                  background: isOrdered ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                  color: isOrdered ? "#10B981" : "#F59E0B",
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: MONO,
                }}
              >
                {isOrdered ? "LIVE DISPATCH" : "CHECKOUT"}
              </div>
            </div>

            {/* If NOT ordered yet: Cart view */}
            {!isOrdered ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, paddingTop: 18 }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: MONO }}>
                  BASKET ITEMS (4)
                </div>

                {[
                  { icon: "🥛", name: "Farm Fresh Milk 1L", qty: "1x", price: "₹66" },
                  { icon: "🍞", name: "Artisanal Sourdough Bread", qty: "1x", price: "₹55" },
                  { icon: "🥚", name: "Organic Eggs 6-Pack", qty: "1x", price: "₹78" },
                  { icon: "🥤", name: "Sparkling Lemon Soda", qty: "1x", price: "₹50" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "rgba(255, 255, 255, 0.04)",
                      borderRadius: 16,
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 22 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{item.qty}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: accent, fontFamily: MONO }}>
                      {item.price}
                    </div>
                  </div>
                ))}

                {/* Simulated Order Button with Tapping Cursor */}
                <div style={{ marginTop: "auto", position: "relative" }}>
                  <div
                    style={{
                      background: `linear-gradient(90deg, ${accent} 0%, #10b981 100%)`,
                      color: "#050811",
                      borderRadius: 20,
                      padding: "18px 24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontWeight: 900,
                      fontSize: 18,
                      transform: `scale(${tapScale})`,
                      boxShadow: `0 8px 30px ${accent}66`,
                    }}
                  >
                    <span>PLACE 10-MIN ORDER</span>
                    <span>₹249 →</span>
                  </div>

                  {/* Finger Tap Indicator */}
                  <div
                    style={{
                      position: "absolute",
                      right: 40,
                      top: 10,
                      fontSize: 32,
                      transform: `scale(${frame < tapFrame ? 1.2 : 0.9})`,
                      transition: "transform 0.1s",
                      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.8))",
                    }}
                  >
                    👆
                  </div>
                </div>
              </div>
            ) : (
              /* ORDERED STATE: 10-Minute Countdown Clock & Live Tracking */
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-around",
                  paddingTop: 12,
                }}
              >
                {/* Glowing 10:00 Countdown Timer Dial */}
                <div
                  style={{
                    width: 220,
                    height: 220,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #0e172a 0%, #060913 100%)",
                    border: `3px solid ${accent}`,
                    boxShadow: `0 0 50px ${accent}55, inset 0 0 30px ${accent}33`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: 2,
                      color: accent,
                      fontFamily: MONO,
                      marginBottom: 4,
                    }}
                  >
                    DELIVERY IN
                  </div>
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: 900,
                      fontFamily: MONO,
                      color: "#ffffff",
                      textShadow: `0 0 20px ${accent}`,
                    }}
                  >
                    {timeString}
                  </div>
                  <div style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>
                    ON-TIME GUARANTEED
                  </div>

                  {/* Radar Wave Effect */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      border: `2px solid ${accent}`,
                      transform: `scale(${1 + radarScale * 0.4})`,
                      opacity: radarOpacity,
                      pointerEvents: "none",
                    }}
                  />
                </div>

                {/* Real-Time Live Status Pill */}
                <div
                  style={{
                    width: "100%",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: 20,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "rgba(0, 240, 255, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      border: `1px solid ${accent}`,
                    }}
                  >
                    📦
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
                      Dark Store #14 Allocated
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: MONO }}>
                      Picker is gathering 4 items (90s SLA)
                    </div>
                  </div>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#10B981",
                      boxShadow: "0 0 10px #10B981",
                    }}
                  />
                </div>

                {/* Hyperlocal Proximity Stat */}
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: 16,
                    fontSize: 13,
                    fontFamily: MONO,
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>RADIUS TO DOORSTEP:</span>
                  <span style={{ color: "#10B981", fontWeight: 800 }}>1.4 KM (5 MINS)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // VARIANT 2: PICKER TERMINAL & 90-SECOND PICK SLA
  // -------------------------------------------------------------
  const renderPickerScanner = () => {
    // 4 items scanned sequentially
    const items = [
      { name: "Whole Milk 1L", loc: "Bay A · Shelf 02", time: 12, code: "89010309", icon: "🥛" },
      { name: "Sourdough Bread", loc: "Bay A · Shelf 04", time: 28, code: "89010412", icon: "🍞" },
      { name: "Farm Eggs 6-Pk", loc: "Bay B · Shelf 01", time: 45, code: "89010533", icon: "🥚" },
      { name: "Sparkling Soda", loc: "Bay C · Shelf 08", time: 64, code: "89010699", icon: "🥤" },
    ];

    const currentScanIdx = Math.min(items.length, Math.floor(frame / 25));
    const pickTime = Math.min(64, Math.floor((frame / durationInFrames) * 64));

    // Laser bar sweep
    const laserY = (frame * 6) % 180;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: isLandscape ? "row" : "column",
          gap: 28,
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "40px 20px",
        }}
      >
        {/* Left / Top: Handheld Barcode Scanner Terminal */}
        <div
          style={{
            width: isLandscape ? 480 : 540,
            background: "linear-gradient(145deg, #121a2c 0%, #0a0f1d 100%)",
            border: "2px solid rgba(0, 240, 255, 0.3)",
            borderRadius: 36,
            padding: 24,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 240, 255, 0.15)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Scanner Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 16,
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: accent, fontFamily: MONO, fontWeight: 800 }}>
                WAREHOUSE PICKER PDA · ORDER #9402
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>
                OPTIMAL PICK PATH (TSP)
              </div>
            </div>
            <div
              style={{
                background: "rgba(16, 185, 129, 0.2)",
                color: "#10B981",
                fontFamily: MONO,
                padding: "6px 14px",
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              {currentScanIdx} / 4 PICKED
            </div>
          </div>

          {/* Barcode Laser Simulation Box */}
          <div
            style={{
              marginTop: 16,
              height: 120,
              background: "#050811",
              borderRadius: 20,
              border: "1px solid rgba(255, 255, 255, 0.1)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Visual Barcode bars */}
            <div style={{ display: "flex", gap: 4, height: 60, opacity: 0.85 }}>
              {[3, 1, 4, 2, 5, 2, 4, 1, 3, 2, 5, 1, 4, 2, 3, 1, 5].map((w, i) => (
                <div key={i} style={{ width: w * 3, height: "100%", background: "#ffffff" }} />
              ))}
            </div>

            {/* Glowing Red Laser Line */}
            <div
              style={{
                position: "absolute",
                top: laserY,
                left: 0,
                right: 0,
                height: 3,
                background: "#ff0055",
                boxShadow: "0 0 12px #ff0055, 0 0 24px #ff0055",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 8,
                right: 16,
                fontSize: 11,
                color: "#ff0055",
                fontFamily: MONO,
                fontWeight: 800,
              }}
            >
              LASER SCAN ACTIVE
            </div>
          </div>

          {/* Scanned Items Checklist */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
            {items.map((item, idx) => {
              const isDone = idx < currentScanIdx;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: 16,
                    background: isDone ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${isDone ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.08)"}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: MONO }}>
                        {item.loc}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, color: isDone ? "#10B981" : "rgba(255,255,255,0.4)", fontFamily: MONO }}>
                      {isDone ? `✓ ${item.time}s` : "WAITING"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right / Bottom: SLA Stopwatch & Bagging Counter */}
        <div
          style={{
            width: isLandscape ? 380 : 540,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* 90s SLA Card */}
          <div
            style={{
              background: "rgba(10, 15, 29, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 28,
              padding: 24,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            {/* Circular Progress Gauge */}
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: "conic-gradient(#10B981 0% 71%, rgba(255,255,255,0.1) 71% 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 24px rgba(16, 185, 129, 0.3)",
              }}
            >
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  background: "#0a0f1d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: 22,
                  fontFamily: MONO,
                  color: "#10B981",
                }}
              >
                {pickTime}s
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: MONO }}>
                STORE PICKING SLA
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#ffffff" }}>
                64s / 90s MAX
              </div>
              <div style={{ fontSize: 13, color: "#10B981", fontWeight: 700 }}>
                ✓ 26 SECONDS SURPLUS
              </div>
            </div>
          </div>

          {/* Tamper Proof Sealing Callout */}
          <div
            style={{
              background: "rgba(255, 170, 0, 0.08)",
              border: "1px solid rgba(255, 170, 0, 0.3)",
              borderRadius: 24,
              padding: "18px 22px",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span style={{ fontSize: 32 }}>🛍️</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#FFAA00" }}>
                TAMPER-PROOF QR SEAL
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                Handoff directly to waiting delivery partner at dispatch bay
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // VARIANT 3: SCOOTER TRANSIT & 1.8 KM HYPERLOCAL MAP
  // -------------------------------------------------------------
  const renderScooterTransit = () => {
    // Rider progress along road route (0% to 85%)
    const routeProgress = interpolate(frame, [0, durationInFrames], [0.1, 0.9], {
      extrapolateRight: "clamp",
    });

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "20px 24px",
          position: "relative",
        }}
      >
        {/* Nighttime City Map Container */}
        <div
          style={{
            width: isLandscape ? 820 : 560,
            height: isLandscape ? 560 : 780,
            background: "radial-gradient(circle at 50% 50%, #0d1628 0%, #070b14 100%)",
            border: "2px solid rgba(0, 240, 255, 0.3)",
            borderRadius: 44,
            boxShadow: "0 24px 80px rgba(0,0,0,0.9), 0 0 50px rgba(0, 240, 255, 0.15)",
            position: "relative",
            overflow: "hidden",
            padding: 30,
          }}
        >
          {/* Isometric Street Grid Lines */}
          <svg
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.25 }}
          >
            {/* Horizontal streets */}
            {[100, 220, 340, 460, 580, 700].map((y, i) => (
              <line key={i} x1="0" y1={y} x2="100%" y2={y} stroke="#00f0ff" strokeWidth="2" />
            ))}
            {/* Vertical avenues */}
            {[80, 180, 280, 380, 480].map((x, i) => (
              <line key={i} x1={x} y1="0" x2={x} y2="100%" stroke="#00f0ff" strokeWidth="2" />
            ))}
          </svg>

          {/* 1.8 KM Geofence Perimeter Ring */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: isLandscape ? 480 : 420,
              height: isLandscape ? 480 : 420,
              borderRadius: "50%",
              border: `2px dashed ${accent}`,
              background: "rgba(0, 240, 255, 0.03)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
              paddingTop: 12,
              boxShadow: `0 0 40px ${accent}22`,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 12,
                fontWeight: 800,
                color: accent,
                background: "#070b14",
                padding: "4px 12px",
                borderRadius: 999,
                border: `1px solid ${accent}66`,
              }}
            >
              1.8 KM HYPERLOCAL GEO-FENCE
            </span>
          </div>

          {/* Dark Store Node (Origin) */}
          <div
            style={{
              position: "absolute",
              top: "65%",
              left: "22%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                background: "#FFAA00",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                boxShadow: "0 0 30px #FFAA0088",
              }}
            >
              🏪
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#FFAA00", fontFamily: MONO }}>
              DARK STORE #14
            </span>
          </div>

          {/* Customer Apartment Node (Destination) */}
          <div
            style={{
              position: "absolute",
              top: "28%",
              right: "18%",
              transform: "translate(50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                background: "#10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                boxShadow: "0 0 30px #10B98188",
              }}
            >
              🏢
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#10B981", fontFamily: MONO }}>
              CUSTOMER APARTMENT
            </span>
          </div>

          {/* Animated Turn-by-Turn Scooter Motion */}
          <div
            style={{
              position: "absolute",
              top: `${interpolate(routeProgress, [0, 0.5, 1], [65, 45, 28])}%`,
              left: `${interpolate(routeProgress, [0, 0.5, 1], [22, 50, 78])}%`,
              transform: "translate(-50%, -50%)",
              zIndex: 15,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 38,
                filter: `drop-shadow(0 0 16px ${accent})`,
                transform: "scaleX(-1)", // Facing right
              }}
            >
              🛵
            </div>
            <div
              style={{
                background: "rgba(10, 15, 29, 0.95)",
                border: `1px solid ${accent}`,
                borderRadius: 8,
                padding: "2px 8px",
                fontSize: 11,
                fontFamily: MONO,
                color: "#fff",
                fontWeight: 800,
                marginTop: -4,
              }}
            >
              21 KM/H
            </div>
          </div>

          {/* Bottom Telemetry HUD */}
          <div
            style={{
              position: "absolute",
              bottom: 24,
              left: 24,
              right: 24,
              background: "rgba(8, 12, 22, 0.92)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 24,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backdropFilter: "blur(12px)",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: MONO }}>
                REALITY: SAFE SPEED
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#00F0FF", fontFamily: MONO }}>
                21 KM/H (CALM)
              </div>
            </div>

            <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.15)" }} />

            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: MONO }}>
                DISTANCE TO DEST
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#10B981", fontFamily: MONO }}>
                1.4 KM TOTAL
              </div>
            </div>

            <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.15)" }} />

            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: MONO }}>
                TRANSIT TIME
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#FFAA00", fontFamily: MONO }}>
                4.8 MINUTES
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // VARIANT 4: THE 600-SECOND BLUEPRINT TIMELINE
  // -------------------------------------------------------------
  const renderCountdownBlueprint = () => {
    const stages = [
      { step: "01", name: "Cloud AI Dispatch", time: "15s", pct: 5, icon: "⚡", color: "#00F0FF" },
      { step: "02", name: "Dark Store Picking", time: "90s", pct: 15, icon: "📦", color: "#FFAA00" },
      { step: "03", name: "Bagging & Seal", time: "30s", pct: 5, icon: "🛍️", color: "#EC4899" },
      { step: "04", name: "Safe 1.8km Transit", time: "375s", pct: 60, icon: "🛵", color: "#10B981" },
      { step: "05", name: "Doorstep & OTP", time: "90s", pct: 15, icon: "🚪", color: "#8B5CF6" },
    ];

    const activeStageIdx = Math.min(stages.length - 1, Math.floor(frame / 22));

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          padding: "40px 30px",
          gap: 20,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 14, color: accent, fontFamily: MONO, fontWeight: 800 }}>
            THE 600-SECOND TOTAL BUDGET
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: "#fff", margin: "6px 0 0" }}>
            WHERE DOES EVERY SECOND GO?
          </h2>
        </div>

        {/* Master Segmented Progress Bar */}
        <div
          style={{
            height: 18,
            width: "100%",
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.08)",
            display: "flex",
            overflow: "hidden",
            padding: 3,
            gap: 4,
          }}
        >
          {stages.map((st, i) => (
            <div
              key={i}
              style={{
                width: `${st.pct}%`,
                height: "100%",
                borderRadius: 999,
                background: i <= activeStageIdx ? st.color : "rgba(255,255,255,0.1)",
                boxShadow: i <= activeStageIdx ? `0 0 12px ${st.color}` : "none",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>

        {/* Breakdown Stage Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
          {stages.map((stage, idx) => {
            const isActive = idx === activeStageIdx;
            const isDone = idx < activeStageIdx;

            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderRadius: 20,
                  background: isActive
                    ? "rgba(255, 255, 255, 0.08)"
                    : isDone
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(0, 0, 0, 0.2)",
                  border: `1px solid ${isActive ? stage.color : "rgba(255, 255, 255, 0.08)"}`,
                  boxShadow: isActive ? `0 0 30px ${stage.color}33` : "none",
                  transform: isActive ? "scale(1.02)" : "scale(1)",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      background: stage.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      color: "#050811",
                      fontWeight: 900,
                    }}
                  >
                    {stage.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
                      {stage.name}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: MONO }}>
                      STAGE {stage.step}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    fontFamily: MONO,
                    color: stage.color,
                  }}
                >
                  {stage.time}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 30%, #0d1527 0%, #060912 100%)",
        color: "#ffffff",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 48,
          right: 48,
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 18px",
            borderRadius: 999,
            background: "rgba(10, 15, 29, 0.85)",
            border: `1px solid ${accent}88`,
            backdropFilter: "blur(12px)",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: accent,
              boxShadow: `0 0 10px ${accent}`,
            }}
          />
          <span
            style={{
              fontFamily: MONO,
              fontSize: 16,
              fontWeight: 800,
              color: accent,
              letterSpacing: 2,
            }}
          >
            {tag}
          </span>
        </div>

        <h1
          style={{
            fontSize: 40,
            fontWeight: 900,
            color: "#ffffff",
            textTransform: "uppercase",
            lineHeight: 1.15,
            letterSpacing: -0.5,
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
            margin: 0,
          }}
        >
          {title}
        </h1>
      </div>

      {/* Render selected variant */}
      <div style={{ flex: 1, width: "100%", height: "100%", paddingTop: 90 }}>
        {variant === "customer_order" && renderCustomerOrder()}
        {variant === "picker_scanner" && renderPickerScanner()}
        {variant === "scooter_transit" && renderScooterTransit()}
        {variant === "countdown_blueprint" && renderCountdownBlueprint()}
      </div>
    </AbsoluteFill>
  );
};
