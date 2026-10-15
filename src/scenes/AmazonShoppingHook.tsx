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
import { RevealText } from "../Reveal";
import { FONT, MONO } from "../theme";

interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviews: string;
  icon: string;
  badge?: string;
  initialIndex: number;
  sortedIndex: number;
}

export const AmazonShoppingHook: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const L = useLayout();
  const isLandscape = L.landscape;

  const tag = scene.tag || "01 / THE SORTING PUZZLE";
  const title = scene.title || scene.text || "HOW COMPUTERS SORT DATA";

  // 4 Curated Amazon Products
  const products: Product[] = [
    {
      id: "p1",
      name: "Fast USB-C Cable (6ft, Braided)",
      price: 12.99,
      rating: 4.8,
      reviews: "34k",
      icon: "🔌",
      badge: "Best Seller",
      initialIndex: 2,
      sortedIndex: 0,
    },
    {
      id: "p2",
      name: "Ergonomic Wireless Mouse",
      price: 39.50,
      rating: 4.6,
      reviews: "18k",
      icon: "🖱️",
      badge: "Amazon's Choice",
      initialIndex: 3,
      sortedIndex: 1,
    },
    {
      id: "p3",
      name: "ANC Wireless Headphones",
      price: 89.00,
      rating: 4.7,
      reviews: "52k",
      icon: "🎧",
      badge: "Top Rated",
      initialIndex: 0,
      sortedIndex: 2,
    },
    {
      id: "p4",
      name: "Smart Fitness Watch Ultra",
      price: 199.00,
      rating: 4.9,
      reviews: "12k",
      icon: "⌚",
      badge: "Premium",
      initialIndex: 1,
      sortedIndex: 3,
    },
  ];

  // Timing breakdown:
  // f: 0 - 95: Phone enters, displays unsorted items [$89, $199, $12.99, $39.50]
  // f: 95 - 125: Finger cursor taps "Price: Low to High" dropdown
  // f: 125 - 165: Cards smoothly swap into sorted order [$12.99, $39.50, $89, $199]
  // f: 165+: Final sorted state locks with green confirmation

  const sortTriggerFrame = typeof scene.sortTriggerFrame === "number" ? scene.sortTriggerFrame : 100;
  const isSorted = frame >= sortTriggerFrame + 18;

  // Spring animation for sorting swap
  const swapSpring = spring({
    frame: frame - sortTriggerFrame,
    fps,
    config: { damping: 16, stiffness: 90 },
  });

  // Tap ripple effect
  const tapSpring = spring({
    frame: frame - sortTriggerFrame,
    fps,
    config: { damping: 12, stiffness: 180 },
  });

  // Virtual Finger pointer animation
  const fingerProgress = interpolate(
    frame,
    [sortTriggerFrame - 22, sortTriggerFrame, sortTriggerFrame + 14, sortTriggerFrame + 28],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const fingerScale = frame >= sortTriggerFrame && frame <= sortTriggerFrame + 8 ? 0.82 : 1.0;

  // Phone scale entrance
  const phoneEntrance = spring({
    frame: frame - 4,
    fps,
    config: { damping: 18, stiffness: 110 },
  });

  // Responsive Phone Sizing (with ample clearance for bottom captions)
  const phoneW = isLandscape ? 440 : Math.min(width * 0.84, 760);
  const phoneH = isLandscape ? 720 : 960;
  const cardH = isLandscape ? 82 : 112;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        fontFamily: FONT,
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: isLandscape ? 12 : 24,
      }}
    >
      {/* 1. Header Section */}
      <div style={{ width: "100%", maxWidth: 1000, textAlign: "center", marginTop: 10 }}>
        {tag && (
          <div
            style={{
              fontFamily: MONO,
              fontSize: isLandscape ? 20 : 24,
              fontWeight: 800,
              color: accent,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: 8,
              opacity: 0.95,
            }}
          >
            {tag}
          </div>
        )}
        <RevealText
          text={title}
          align="center"
          style={{
            fontSize: isLandscape ? 48 : 54,
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            textShadow: "0 6px 24px rgba(0,0,0,0.7)",
          }}
        />
      </div>

      {/* 2. Realistic Smartphone Container */}
      <div
        style={{
          width: phoneW,
          height: phoneH,
          borderRadius: 44,
          border: "8px solid #2A3042",
          background: "#0D111D",
          boxShadow: `
            0 25px 80px rgba(0,0,0,0.85),
            0 0 40px ${accent}22,
            inset 0 0 2px rgba(255,255,255,0.2)
          `,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transform: `scale(${phoneEntrance})`,
          opacity: phoneEntrance,
        }}
      >
        {/* Dynamic Island / Punch Hole */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: isLandscape ? 110 : 140,
            height: isLandscape ? 22 : 28,
            backgroundColor: "#000000",
            borderRadius: 20,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 12,
          }}
        >
          {/* Camera lens reflection */}
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              backgroundColor: "#161D2E",
              border: "1.5px solid #2C3854",
            }}
          />
        </div>

        {/* Status Bar */}
        <div
          style={{
            height: isLandscape ? 36 : 46,
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: isLandscape ? 12 : 15,
            fontWeight: 700,
            color: "#FFFFFF",
            backgroundColor: "#131921",
            zIndex: 90,
          }}
        >
          <span>9:41</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span>5G</span>
            <div
              style={{
                width: 22,
                height: 11,
                border: "1.5px solid #FFFFFF",
                borderRadius: 3,
                padding: 1.5,
                display: "flex",
                alignItems: "center",
              }}
            >
              <div style={{ width: "100%", height: "100%", backgroundColor: "#00FF88", borderRadius: 1 }} />
            </div>
          </div>
        </div>

        {/* Amazon Brand Header */}
        <div
          style={{
            backgroundColor: "#131921",
            padding: isLandscape ? "8px 16px" : "10px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            borderBottom: "1px solid #232F3E",
          }}
        >
          {/* Logo & Search Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Amazon Logo with Smile curve */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: isLandscape ? 18 : 22,
                  color: "#FFFFFF",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                amazon
              </div>
              <div
                style={{
                  width: 32,
                  height: 4,
                  borderBottom: "2px solid #FF9900",
                  borderRadius: "50%",
                  marginTop: -1,
                }}
              />
            </div>

            {/* Search Input Box */}
            <div
              style={{
                flex: 1,
                height: isLandscape ? 34 : 42,
                backgroundColor: "#FFFFFF",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                gap: 8,
              }}
            >
              <span style={{ fontSize: isLandscape ? 14 : 16 }}>🔍</span>
              <span
                style={{
                  color: "#555555",
                  fontSize: isLandscape ? 12 : 15,
                  fontWeight: 500,
                }}
              >
                Search Amazon
              </span>
            </div>
          </div>

          {/* Delivery Location Sub-bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: isLandscape ? 11 : 13,
              color: "#CCCCCC",
            }}
          >
            <span>📍</span>
            <span>Deliver to Customer - New Delhi 110001</span>
          </div>
        </div>

        {/* Amazon Filter & Sort Controls */}
        <div
          style={{
            backgroundColor: "#232F3E",
            padding: isLandscape ? "8px 16px" : "12px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                backgroundColor: "#00A8E1",
                color: "#FFFFFF",
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: isLandscape ? 10 : 12,
                padding: "3px 8px",
                borderRadius: 4,
                fontStyle: "italic",
              }}
            >
              prime
            </div>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.12)",
                color: "#FFFFFF",
                fontSize: isLandscape ? 11 : 13,
                padding: "3px 10px",
                borderRadius: 14,
              }}
            >
              Electronics
            </div>
          </div>

          {/* Animated Sort Dropdown Button */}
          <div
            style={{
              background: frame >= sortTriggerFrame ? "linear-gradient(90deg, #FF9900, #FEBD69)" : "#37475A",
              color: frame >= sortTriggerFrame ? "#111111" : "#FFFFFF",
              fontWeight: 800,
              fontSize: isLandscape ? 11 : 13,
              padding: isLandscape ? "4px 10px" : "6px 14px",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: frame >= sortTriggerFrame ? "0 0 16px rgba(255,153,0,0.6)" : "none",
              transition: "all 0.2s",
              position: "relative",
            }}
          >
            <span>Sort:</span>
            <span>{frame >= sortTriggerFrame ? "Price: Low to High" : "Featured"}</span>
            <span>▼</span>

            {/* Click Pulse Ripple */}
            {frame >= sortTriggerFrame && frame < sortTriggerFrame + 20 && (
              <div
                style={{
                  position: "absolute",
                  inset: -6,
                  border: "2px solid #FF9900",
                  borderRadius: 12,
                  opacity: 1 - tapSpring,
                  transform: `scale(${1 + tapSpring * 0.4})`,
                  pointerEvents: "none",
                }}
              />
            )}

            {/* Animated Touch Cursor Pointer */}
            {fingerProgress > 0.05 && (
              <div
                style={{
                  position: "absolute",
                  bottom: -36,
                  right: 8,
                  fontSize: 32,
                  zIndex: 200,
                  opacity: fingerProgress,
                  transform: `scale(${fingerScale}) translateY(${(1 - fingerProgress) * 24}px)`,
                  pointerEvents: "none",
                  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.7))",
                }}
              >
                👆
              </div>
            )}
          </div>
        </div>

        {/* Live Algorithm Status Notification */}
        <div
          style={{
            backgroundColor: isSorted ? "rgba(0, 255, 136, 0.15)" : "rgba(255, 153, 0, 0.15)",
            borderBottom: `1px solid ${isSorted ? "#00FF88" : "#FF9900"}40`,
            padding: "8px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14 }}>{isSorted ? "✅" : "⚡"}</span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: isLandscape ? 11 : 13,
                fontWeight: 800,
                color: isSorted ? "#00FF88" : "#FFC857",
                letterSpacing: "0.06em",
              }}
            >
              {isSorted ? "ALGORITHM RESULT: SORTED (ASCENDING)" : "RAW ITEMS: UNSORTED PRICES"}
            </span>
          </div>

          <div
            style={{
              fontFamily: MONO,
              fontSize: isLandscape ? 10 : 12,
              color: "#9AA3C7",
            }}
          >
            {isSorted ? "O(n log n) / Bubble" : "Random Order"}
          </div>
        </div>

        {/* 3. Product Cards List Arena */}
        <div
          style={{
            flex: 1,
            padding: isLandscape ? "12px 14px" : "16px 20px",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {products.map((prod) => {
            // Compute Y position before and after sort
            const initialY = prod.initialIndex * (cardH + 12);
            const targetY = prod.sortedIndex * (cardH + 12);
            const currentY = interpolate(swapSpring, [0, 1], [initialY, targetY]);

            // Subtle lift and scale while moving
            const isMoving = frame >= sortTriggerFrame && frame <= sortTriggerFrame + 25;
            const liftScale = isMoving ? 1.02 : 1.0;
            const cardZ = isMoving ? 50 : 1;

            return (
              <div
                key={prod.id}
                style={{
                  position: "absolute",
                  left: isLandscape ? 14 : 20,
                  right: isLandscape ? 14 : 20,
                  top: currentY + (isLandscape ? 12 : 16),
                  height: cardH,
                  backgroundColor: "#161D2B",
                  border: isSorted
                    ? "1.5px solid rgba(0, 255, 136, 0.4)"
                    : "1px solid rgba(255, 255, 255, 0.10)",
                  borderRadius: 16,
                  padding: isLandscape ? "8px 12px" : "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: isLandscape ? 12 : 16,
                  boxShadow: isSorted
                    ? "0 4px 20px rgba(0, 255, 136, 0.15)"
                    : "0 4px 14px rgba(0, 0, 0, 0.4)",
                  transform: `scale(${liftScale})`,
                  zIndex: cardZ,
                  transition: "border 0.3s, box-shadow 0.3s",
                }}
              >
                {/* Product Thumbnail / Icon */}
                <div
                  style={{
                    width: isLandscape ? 56 : 74,
                    height: isLandscape ? 56 : 74,
                    backgroundColor: "#0F1420",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isLandscape ? 28 : 38,
                    border: "1px solid rgba(255,255,255,0.06)",
                    flexShrink: 0,
                  }}
                >
                  {prod.icon}
                </div>

                {/* Product Metadata Info */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  {prod.badge && (
                    <div
                      style={{
                        backgroundColor: "#E47911",
                        color: "#FFFFFF",
                        fontSize: isLandscape ? 9 : 11,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 3,
                        alignSelf: "flex-start",
                        textTransform: "uppercase",
                      }}
                    >
                      {prod.badge}
                    </div>
                  )}

                  {/* Title */}
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: isLandscape ? 13 : 16,
                      fontWeight: 700,
                      color: "#FFFFFF",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {prod.name}
                  </div>

                  {/* Ratings & Prime Delivery */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: isLandscape ? 10 : 12 }}>
                    <span style={{ color: "#FFA41C" }}>★★★★★</span>
                    <span style={{ color: "#9AA3C7" }}>({prod.reviews})</span>
                    <span
                      style={{
                        backgroundColor: "#00A8E1",
                        color: "#FFFFFF",
                        fontWeight: 900,
                        fontSize: 9,
                        padding: "1px 4px",
                        borderRadius: 2,
                        fontStyle: "italic",
                      }}
                    >
                      prime
                    </span>
                  </div>
                </div>

                {/* Bold Price Tag & Rank Badge */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT,
                      fontSize: isLandscape ? 22 : 28,
                      fontWeight: 900,
                      color: isSorted ? "#00FF88" : "#FFFFFF",
                      textShadow: isSorted ? "0 0 12px rgba(0, 255, 136, 0.4)" : "none",
                    }}
                  >
                    ${prod.price.toFixed(2)}
                  </div>

                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: isLandscape ? 9 : 11,
                      color: isSorted ? "#00FF88" : "#FFC857",
                      backgroundColor: isSorted ? "rgba(0, 255, 136, 0.12)" : "rgba(255, 200, 87, 0.12)",
                      border: `1px solid ${isSorted ? "#00FF88" : "#FFC857"}40`,
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontWeight: 800,
                    }}
                  >
                    {isSorted ? `Rank #${prod.sortedIndex + 1}` : `Pos #${prod.initialIndex + 1}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Explanatory Banner (only in landscape mode for caption clearance) */}
      {isLandscape && (
        <div
          style={{
            width: "100%",
            maxWidth: 960,
            background: "rgba(11, 16, 32, 0.75)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 20,
            padding: "14px 24px",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            marginTop: 10,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: MONO, fontSize: 12, color: "#9AA3C7", textTransform: "uppercase" }}>
              Query Filter
            </div>
            <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: "#FF9900" }}>
              Price: Low to High
            </div>
          </div>

          <div style={{ width: 1, height: 32, backgroundColor: "rgba(255, 255, 255, 0.12)" }} />

          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: MONO, fontSize: 12, color: "#9AA3C7", textTransform: "uppercase" }}>
              Input State
            </div>
            <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: "#FFC857" }}>
              Unsorted ($89, $199...)
            </div>
          </div>

          <div style={{ width: 1, height: 32, backgroundColor: "rgba(255, 255, 255, 0.12)" }} />

          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: MONO, fontSize: 12, color: "#9AA3C7", textTransform: "uppercase" }}>
              Output State
            </div>
            <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 800, color: "#00FF88" }}>
              Ascending ($12.99 ➔ $199)
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
