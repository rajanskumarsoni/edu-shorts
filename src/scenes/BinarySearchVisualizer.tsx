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

interface ArrayItem {
  index: number;
  value: number;
  label?: string;
}

export const BinarySearchVisualizer: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();
  const isLandscape = L.landscape;

  const variant = scene.variant || "step_by_step"; // "book_analogy" | "step_by_step"
  const tag = scene.tag || "03 / HALVING THE UNIVERSE";
  const title = scene.title || "DIVIDE & CONQUER IN ACTION";

  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  // Calculate normalized timeline progress [0 to 1]
  const progress = Math.min(Math.max(frame / Math.max(durationInFrames, 1), 0), 1);

  if (variant === "book_analogy") {
    // -------------------------------------------------------------
    // VARIANT: 1,000-PAGE DICTIONARY / BOOK ANALOGY
    // -------------------------------------------------------------
    // Phase 1 (0.00 - 0.28): Closed book opens to Page 500 (Mid)
    // Phase 2 (0.28 - 0.55): Compare "Mango" < "Peach" -> Discard Right (501-1000)
    // Phase 3 (0.55 - 0.80): Jump to Page 250 -> "Mango" > "Grape" -> Discard Left (1-250)
    // Phase 4 (0.80 - 1.00): Target found at Page 340 in ~10 steps!

    let phase = 1;
    let statusBadge = "STEP 1: OPEN DIRECTLY IN THE MIDDLE";
    let statusDesc = "Page 500 (Letter 'P') · Target: 'Mango' (Letter 'M')";
    let discardedHalf: "none" | "right" | "both" = "none";
    let activeMidPage = 500;
    let statusColor = accent;

    if (progress < 0.28) {
      phase = 1;
      activeMidPage = 500;
      statusBadge = "STEP 1: OPEN DIRECTLY IN THE MIDDLE";
      statusDesc = "MID = (1 + 1000) / 2 = PAGE 500 (LETTER 'P')";
      discardedHalf = "none";
      statusColor = accent;
    } else if (progress < 0.58) {
      phase = 2;
      activeMidPage = 500;
      statusBadge = "STEP 2: COMPARE & DISCARD HALF";
      statusDesc = "'MANGO' COMES BEFORE 'P' ➔ DISCARD PAGES 501–1,000 (50% GONE!)";
      discardedHalf = "right";
      statusColor = "#FF5555";
    } else if (progress < 0.82) {
      phase = 3;
      activeMidPage = 250;
      statusBadge = "STEP 3: HALVE THE REMAINING HALF";
      statusDesc = "NEW MID = (1 + 500) / 2 = PAGE 250 ('G') ➔ 'MANGO' > 'G' ➔ DISCARD 1–250";
      discardedHalf = "both";
      statusColor = "#FFC857";
    } else {
      phase = 4;
      activeMidPage = 340;
      statusBadge = "🎯 TARGET LOCKED: 'MANGO' FOUND";
      statusDesc = "FOUND IN ~10 PAGE TURNS INSTEAD OF 1,000! (99% OPERATIONS SAVED)";
      discardedHalf = "both";
      statusColor = "#10B981";
    }

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#0B1020",
          fontFamily: FONT,
          color: "#F5F7FF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: isLandscape ? 36 : 110,
          paddingBottom: isLandscape ? 36 : 140,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Subtle Background Radial & Grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 50% 25%, rgba(0, 240, 255, 0.12) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "100% 100%, 48px 48px, 48px 48px",
            pointerEvents: "none",
          }}
        />

        {/* Header Tag & Title */}
        <div
          style={{
            zIndex: 10,
            textAlign: "center",
            marginBottom: isLandscape ? 12 : 20,
            opacity: enterSpring,
            transform: `translateY(${(1 - enterSpring) * -20}px)`,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: isLandscape ? 14 : 18,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: accent,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: accent,
                boxShadow: `0 0 10px ${accent}`,
              }}
            />
            {tag}
          </div>
          <h1
            style={{
              fontSize: isLandscape ? 28 : 42,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: 0,
              textTransform: "uppercase",
              color: "#FFFFFF",
              textShadow: "0 2px 20px rgba(0,0,0,0.8)",
            }}
          >
            {title}
          </h1>
        </div>

        {/* Action Status Pill */}
        <div
          style={{
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: "rgba(0, 240, 255, 0.08)",
            border: `1px solid ${statusColor}55`,
            borderRadius: 24,
            padding: isLandscape ? "6px 18px" : "10px 24px",
            marginBottom: isLandscape ? 16 : 24,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: isLandscape ? 13 : 16,
              fontWeight: 800,
              color: statusColor,
              letterSpacing: "0.08em",
            }}
          >
            {statusBadge}
          </span>
        </div>

        {/* The 1,000-Page Dictionary Physical Representation */}
        <div
          style={{
            zIndex: 10,
            width: isLandscape ? 780 : 920,
            height: isLandscape ? 340 : 460,
            perspective: 1200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            marginBottom: isLandscape ? 16 : 28,
            transform: `scale(${enterSpring})`,
          }}
        >
          {/* Dual Page Open Book Container */}
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              borderRadius: 20,
              boxShadow:
                "0 30px 80px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(255, 255, 255, 0.08)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Left Page (Pages 1 - 500) */}
            <div
              style={{
                flex: 1,
                backgroundColor: "#FDFBF7",
                color: "#181A20",
                padding: isLandscape ? "24px 28px" : "32px 36px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderRight: "3px solid #D6CEBE",
                position: "relative",
                boxShadow: "inset -25px 0 40px rgba(0,0,0,0.06)",
                transition: "opacity 0.3s ease",
                opacity: discardedHalf === "both" && phase >= 3 ? 0.35 : 1,
              }}
            >
              {/* Header on page */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "2px solid #E2D9C8",
                  paddingBottom: 8,
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#64748B" }}>
                  PAGE 001 · [A – M]
                </span>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
                  OXFORD DICTIONARY
                </span>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#64748B" }}>
                  PAGE 500
                </span>
              </div>

              {/* Sample dictionary entries snippet */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                <div style={{ opacity: 0.6, fontSize: 13, fontFamily: MONO }}>aardvark / noun ...</div>
                <div style={{ opacity: 0.6, fontSize: 13, fontFamily: MONO }}>binary / adj. composed of two ...</div>
                <div
                  style={{
                    backgroundColor: phase >= 3 ? "rgba(16, 185, 129, 0.2)" : "transparent",
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: phase >= 3 ? "1px solid #10B981" : "none",
                  }}
                >
                  <span style={{ fontWeight: 800, color: phase >= 3 ? "#065F46" : "#0F172A", fontSize: 15 }}>
                    mango / noun:
                  </span>{" "}
                  <span style={{ fontSize: 13, color: "#334155" }}>
                    a tropical stone fruit (Target Word at Page 340)
                  </span>
                </div>
                <div style={{ opacity: 0.6, fontSize: 13, fontFamily: MONO }}>peach / noun: round juicy fruit ...</div>
              </div>

              {/* Discard Overlay for Left Half (Phase 3) */}
              {discardedHalf === "both" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.85)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    zIndex: 20,
                    backdropFilter: "blur(2px)",
                  }}
                >
                  <div style={{ fontSize: 32 }}>✂️</div>
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#FFC857",
                      letterSpacing: "0.1em",
                      textAlign: "center",
                    }}
                  >
                    PAGES 001 – 250 DISCARDED
                  </div>
                  <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: MONO }}>
                    TARGET &gt; PAGE 250 (G)
                  </div>
                </div>
              )}

              {/* Page Number Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  fontFamily: MONO,
                  color: "#94A3B8",
                  borderTop: "1px solid #E2D9C8",
                  paddingTop: 8,
                }}
              >
                <span>SECTION: A – P</span>
                <span style={{ fontWeight: 800, color: "#0F172A" }}>P. 500</span>
              </div>
            </div>

            {/* Right Page (Pages 501 - 1000) */}
            <div
              style={{
                flex: 1,
                backgroundColor: "#FDFBF7",
                color: "#181A20",
                padding: isLandscape ? "24px 28px" : "32px 36px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                boxShadow: "inset 25px 0 40px rgba(0,0,0,0.06)",
                transition: "opacity 0.3s ease",
                opacity: discardedHalf === "right" || discardedHalf === "both" ? 0.35 : 1,
              }}
            >
              {/* Header on right page */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "2px solid #E2D9C8",
                  paddingBottom: 8,
                }}
              >
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#64748B" }}>
                  PAGE 501
                </span>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 800, color: "#0F172A" }}>
                  OXFORD DICTIONARY
                </span>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#64748B" }}>
                  PAGE 1000 · [P – Z]
                </span>
              </div>

              {/* Sample dictionary entries snippet */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                <div style={{ opacity: 0.6, fontSize: 13, fontFamily: MONO }}>peach / noun ...</div>
                <div style={{ opacity: 0.6, fontSize: 13, fontFamily: MONO }}>quantum / noun: discrete quantity ...</div>
                <div style={{ opacity: 0.6, fontSize: 13, fontFamily: MONO }}>search / verb: examine thoroughly ...</div>
                <div style={{ opacity: 0.6, fontSize: 13, fontFamily: MONO }}>zebra / noun: striped wild horse ...</div>
              </div>

              {/* Discard Overlay for Right Half (Phase 2 & 3) */}
              {(discardedHalf === "right" || discardedHalf === "both") && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.88)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    zIndex: 20,
                    backdropFilter: "blur(2px)",
                  }}
                >
                  <div style={{ fontSize: 32 }}>✂️</div>
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#FF5555",
                      letterSpacing: "0.1em",
                      textAlign: "center",
                    }}
                  >
                    PAGES 501 – 1,000 DISCARDED
                  </div>
                  <div style={{ fontSize: 12, color: "#94A3B8", fontFamily: MONO }}>
                    TARGET &lt; PAGE 500 (P) ➔ 500 PAGES ELIMINATED!
                  </div>
                </div>
              )}

              {/* Page Number Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  fontFamily: MONO,
                  color: "#94A3B8",
                  borderTop: "1px solid #E2D9C8",
                  paddingTop: 8,
                }}
              >
                <span style={{ fontWeight: 800, color: "#0F172A" }}>P. 501</span>
                <span>SECTION: P – Z</span>
              </div>
            </div>

            {/* Glowing Golden Bookmark Ribbon at Center Split (MID) */}
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "50%",
                width: 6,
                transform: "translateX(-50%)",
                backgroundColor: "#FFC857",
                boxShadow: "0 0 20px #FFC857, 0 0 40px rgba(255, 200, 87, 0.5)",
                zIndex: 30,
              }}
            >
              {/* Midpoint Marker Tag */}
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#1E293B",
                  color: "#FFC857",
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "4px 10px",
                  borderRadius: 12,
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
                  border: "1px solid #FFC857",
                }}
              >
                MID = P. 500
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry Detail Card */}
        <div
          style={{
            zIndex: 10,
            width: isLandscape ? 780 : 920,
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 16,
            padding: isLandscape ? "14px 24px" : "20px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: isLandscape ? 12 : 14,
                color: "#94A3B8",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              ALGORITHMIC TAKEAWAY
            </div>
            <div
              style={{
                fontSize: isLandscape ? 14 : 17,
                fontWeight: 700,
                color: "#FFFFFF",
              }}
            >
              {statusDesc}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(0, 240, 255, 0.1)",
              border: `1px solid ${accent}`,
              borderRadius: 10,
              padding: isLandscape ? "8px 16px" : "10px 20px",
            }}
          >
            <span style={{ fontSize: 20 }}>⚡</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: accent, fontWeight: 700 }}>
                EFFICIENCY
              </div>
              <div style={{ fontFamily: MONO, fontSize: 16, color: "#FFFFFF", fontWeight: 800 }}>
                O(log N)
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------
  // VARIANT: STEP-BY-STEP ARRAY VISUALIZER
  // -------------------------------------------------------------
  // Base 9-element sorted array: [12, 25, 34, 48, 56, 67, 79, 88, 95]
  // Target: 34 (Index 2)
  const items: ArrayItem[] = [
    { index: 0, value: 12 },
    { index: 1, value: 25 },
    { index: 2, value: 34, label: "TARGET" },
    { index: 3, value: 48 },
    { index: 4, value: 56 },
    { index: 5, value: 67 },
    { index: 6, value: 79 },
    { index: 7, value: 88 },
    { index: 8, value: 95 },
  ];

  const targetVal = 34;

  // Phase breakdown based on progress
  // Phase 1 (0.00 - 0.32): Initial array. Low=0, High=8, Mid=4 (Val 56). 34 < 56 -> Cut 4..8
  // Phase 2 (0.32 - 0.65): Low=0, High=3, Mid=1 (Val 25). 34 > 25 -> Cut 0..1
  // Phase 3 (0.65 - 1.00): Low=2, High=3, Mid=2 (Val 34). 34 == 34 -> MATCH FOUND!
  let low = 0;
  let high = 8;
  let mid = 4;
  let discardedIndices: number[] = [];
  let foundIndex: number | null = null;
  let stepTitle = "STEP 1: INSPECT MIDPOINT ELEMENT";
  let stepComparison = "MID (56) == 34? NO. 34 < 56 ➔ DISCARD RIGHT HALF [4..8]";
  let stepColor = accent;
  let comparisonsCount = 1;

  if (progress < 0.33) {
    low = 0;
    high = 8;
    mid = 4;
    discardedIndices = [];
    stepTitle = "STEP 1: INSPECT MIDPOINT ELEMENT";
    stepComparison = "MID = (0 + 8) / 2 = 4 (VAL: 56) · 34 < 56 ➔ CUT RIGHT HALF!";
    stepColor = accent;
    comparisonsCount = 1;
  } else if (progress < 0.66) {
    low = 0;
    high = 3;
    mid = 1;
    discardedIndices = [4, 5, 6, 7, 8];
    stepTitle = "STEP 2: HALVE THE REMAINING 4 ELEMENTS";
    stepComparison = "NEW MID = (0 + 3) / 2 = 1 (VAL: 25) · 34 > 25 ➔ CUT LEFT HALF!";
    stepColor = "#FFC857";
    comparisonsCount = 2;
  } else {
    low = 2;
    high = 3;
    mid = 2;
    discardedIndices = [0, 1, 4, 5, 6, 7, 8];
    foundIndex = 2;
    stepTitle = "STEP 3: MATCH FOUND! 🎯";
    stepComparison = "MID = (2 + 3) / 2 = 2 (VAL: 34) · 34 == 34 ➔ TARGET FOUND IN 3 CHECKS!";
    stepColor = "#10B981";
    comparisonsCount = 3;
  }

  // Width of each card in 9-element array
  const cardWidth = isLandscape ? 74 : 96;
  const cardHeight = isLandscape ? 105 : 138;
  const cardGap = isLandscape ? 8 : 12;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0B1020",
        fontFamily: FONT,
        color: "#F5F7FF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: isLandscape ? 36 : 110,
        paddingBottom: isLandscape ? 36 : 140,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Subtle Background Radial & Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 50% 25%, rgba(0, 240, 255, 0.12) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 48px 48px, 48px 48px",
          pointerEvents: "none",
        }}
      />

      {/* Header Tag & Title */}
      <div
        style={{
          zIndex: 10,
          textAlign: "center",
          marginBottom: isLandscape ? 12 : 20,
          opacity: enterSpring,
          transform: `translateY(${(1 - enterSpring) * -20}px)`,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: isLandscape ? 14 : 18,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: accent,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: accent,
              boxShadow: `0 0 10px ${accent}`,
            }}
          />
          {tag}
        </div>
        <h1
          style={{
            fontSize: isLandscape ? 28 : 42,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: 0,
            textTransform: "uppercase",
            color: "#FFFFFF",
            textShadow: "0 2px 20px rgba(0,0,0,0.8)",
          }}
        >
          {title}
        </h1>
      </div>

      {/* Target Badge & Formula Strip */}
      <div
        style={{
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: isLandscape ? 14 : 20,
          marginBottom: isLandscape ? 18 : 28,
        }}
      >
        {/* Target Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#1E293B",
            border: `1px solid ${accent}`,
            borderRadius: 12,
            padding: isLandscape ? "6px 14px" : "10px 18px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 13, color: "#94A3B8" }}>SEARCH TARGET:</span>
          <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 800, color: accent }}>
            {targetVal}
          </span>
        </div>

        {/* Pointer Equation Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: 12,
            padding: isLandscape ? "6px 14px" : "10px 18px",
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 13, color: "#94A3B8" }}>FORMULA:</span>
          <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>
            mid = ⌊(low + high) / 2⌋
          </span>
        </div>
      </div>

      {/* Pointer Indicators Row Above Array (LOW, MID, HIGH) */}
      <div
        style={{
          zIndex: 10,
          display: "flex",
          justifyContent: "center",
          gap: cardGap,
          marginBottom: 10,
        }}
      >
        {items.map((it) => {
          const isLow = it.index === low;
          const isHigh = it.index === high;
          const isMid = it.index === mid;

          let label = "";
          let col = "";

          if (isMid) {
            label = "MID 🎯";
            col = "#FFC857";
          } else if (isLow && isHigh) {
            label = "L = H";
            col = "#00F0FF";
          } else if (isLow) {
            label = "LOW ⬇️";
            col = "#00F0FF";
          } else if (isHigh) {
            label = "HIGH ⬇️";
            col = "#C084FC";
          }

          return (
            <div
              key={`ptr-${it.index}`}
              style={{
                width: cardWidth,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: MONO,
                fontSize: isLandscape ? 11 : 13,
                fontWeight: 800,
                color: col || "transparent",
                backgroundColor: label ? "rgba(15, 23, 42, 0.8)" : "transparent",
                borderRadius: 6,
                border: label ? `1px solid ${col}` : "none",
                boxShadow: label ? `0 0 10px ${col}44` : "none",
                transform: label ? `translateY(${Math.sin(frame * 0.2) * 3}px)` : "none",
                transition: "all 0.2s ease",
              }}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* The Central Sorted Array Strip */}
      <div
        style={{
          zIndex: 10,
          display: "flex",
          justifyContent: "center",
          gap: cardGap,
          marginBottom: isLandscape ? 20 : 32,
          transform: `scale(${enterSpring})`,
        }}
      >
        {items.map((it) => {
          const isDiscarded = discardedIndices.includes(it.index);
          const isFound = foundIndex === it.index;
          const isMid = it.index === mid;
          const inRange = it.index >= low && it.index <= high;

          let cardBg = "rgba(255, 255, 255, 0.05)";
          let cardBorder = "rgba(255, 255, 255, 0.12)";
          let valColor = "#FFFFFF";

          if (isFound) {
            cardBg = "rgba(16, 185, 129, 0.25)";
            cardBorder = "#10B981";
            valColor = "#10B981";
          } else if (isMid) {
            cardBg = "rgba(255, 200, 87, 0.18)";
            cardBorder = "#FFC857";
            valColor = "#FFC857";
          } else if (inRange) {
            cardBg = "rgba(0, 240, 255, 0.08)";
            cardBorder = "rgba(0, 240, 255, 0.35)";
          } else if (isDiscarded) {
            cardBg = "rgba(15, 23, 42, 0.5)";
            cardBorder = "rgba(255, 85, 85, 0.25)";
            valColor = "#64748B";
          }

          return (
            <div
              key={`card-${it.index}`}
              style={{
                width: cardWidth,
                height: cardHeight,
                backgroundColor: cardBg,
                border: `2px solid ${cardBorder}`,
                borderRadius: 14,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 6px",
                boxSizing: "border-box",
                position: "relative",
                overflow: "hidden",
                boxShadow: isFound
                  ? "0 0 30px rgba(16, 185, 129, 0.5), inset 0 0 15px rgba(16, 185, 129, 0.3)"
                  : isMid
                  ? "0 0 20px rgba(255, 200, 87, 0.4)"
                  : "0 6px 18px rgba(0,0,0,0.3)",
                transform: isFound
                  ? `scale(${1 + Math.sin(frame * 0.3) * 0.05})`
                  : isMid
                  ? "scale(1.04)"
                  : "scale(1)",
                transition: "all 0.25s ease-out",
                opacity: isDiscarded ? 0.35 : 1,
              }}
            >
              {/* Index Tag */}
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: isLandscape ? 11 : 13,
                  fontWeight: 700,
                  color: isDiscarded ? "#64748B" : "#94A3B8",
                  letterSpacing: "0.08em",
                }}
              >
                [{it.index}]
              </div>

              {/* Element Numerical Value */}
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: isLandscape ? 24 : 32,
                  fontWeight: 800,
                  color: valColor,
                  textDecoration: isDiscarded ? "line-through" : "none",
                }}
              >
                {it.value}
              </div>

              {/* Status pill at bottom of card */}
              <div
                style={{
                  fontSize: isLandscape ? 9 : 11,
                  fontFamily: MONO,
                  fontWeight: 800,
                  color: isFound ? "#10B981" : isMid ? "#FFC857" : isDiscarded ? "#EF4444" : "#64748B",
                  textTransform: "uppercase",
                }}
              >
                {isFound ? "FOUND" : isMid ? "CHECK" : isDiscarded ? "CUT" : "ACTIVE"}
              </div>

              {/* Discarded Strike Banner */}
              {isDiscarded && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Comparison Detail Banner */}
      <div
        style={{
          zIndex: 10,
          width: isLandscape ? 740 : 920,
          backgroundColor: "rgba(15, 23, 42, 0.85)",
          border: `1px solid ${stepColor}55`,
          borderRadius: 16,
          padding: isLandscape ? "14px 22px" : "18px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          marginBottom: isLandscape ? 16 : 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: isLandscape ? 13 : 16,
              fontWeight: 800,
              color: stepColor,
              letterSpacing: "0.1em",
            }}
          >
            {stepTitle}
          </span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 12,
              color: "#94A3B8",
              backgroundColor: "rgba(255,255,255,0.06)",
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            STEP {comparisonsCount} OF 3
          </span>
        </div>
        <div
          style={{
            fontSize: isLandscape ? 14 : 17,
            fontWeight: 600,
            color: "#FFFFFF",
          }}
        >
          {stepComparison}
        </div>
      </div>

      {/* Telemetry Stats Bar at Bottom */}
      <div
        style={{
          zIndex: 10,
          width: isLandscape ? 740 : 920,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
        }}
      >
        {/* Metric 1 */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 12,
            padding: isLandscape ? "10px 14px" : "14px 18px",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, color: "#94A3B8", letterSpacing: "0.1em" }}>
            CHECKS PERFORMED
          </div>
          <div style={{ fontFamily: MONO, fontSize: isLandscape ? 20 : 26, fontWeight: 800, color: stepColor }}>
            {comparisonsCount} / 9
          </div>
        </div>

        {/* Metric 2 */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 12,
            padding: isLandscape ? "10px 14px" : "14px 18px",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, color: "#94A3B8", letterSpacing: "0.1em" }}>
            SEARCH SPACE SAVED
          </div>
          <div style={{ fontFamily: MONO, fontSize: isLandscape ? 20 : 26, fontWeight: 800, color: "#10B981" }}>
            {progress < 0.33 ? "50%" : progress < 0.66 ? "75%" : "89%"}
          </div>
        </div>

        {/* Metric 3 */}
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 12,
            padding: isLandscape ? "10px 14px" : "14px 18px",
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 11, color: "#94A3B8", letterSpacing: "0.1em" }}>
            TIME COMPLEXITY
          </div>
          <div style={{ fontFamily: MONO, fontSize: isLandscape ? 20 : 26, fontWeight: 800, color: accent }}>
            O(log₂ N)
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
