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

interface StudentElement {
  id: string;
  value: number;
  label: string;
  avatar: string;
  color: string;
}

export const SortingVisualizer: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const L = useLayout();
  const isLandscape = L.landscape;

  const mode = scene.mode || "compare_pair"; // "compare_pair" | "pass_one" | "shrinking_arena"
  const title = scene.title || "ADJACENT PAIR COMPARISON";
  const tag = scene.tag || "02 / THE ASSEMBLY LINEUP";

  // Base dataset: 5 students in school morning assembly
  // Initial values: [5, 1, 4, 2, 8]
  const baseStudents: StudentElement[] = [
    { id: "s5", value: 5, label: "STUDENT 1", avatar: "👦", color: "#00F0FF" },
    { id: "s1", value: 1, label: "STUDENT 2", avatar: "🧒", color: "#FF9900" },
    { id: "s4", value: 4, label: "STUDENT 3", avatar: "👦", color: "#00F0FF" },
    { id: "s2", value: 2, label: "STUDENT 4", avatar: "🧒", color: "#00F0FF" },
    { id: "s8", value: 8, label: "STUDENT 5", avatar: "🧑", color: "#00FF88" },
  ];
  const maxVal = 8;

  // Scene 2: "compare_pair"
  // Narration Breakdown:
  // 0.00s - 5.34s (f: 0-160):   "स्कूल की मॉर्निंग असेंबली याद कीजिए। मान लीजिए पाँच स्टूडेंट्स बिना किसी क्रम के खड़े हैं।"
  // 5.34s - 9.67s (f: 160-280): "बबल सॉर्ट का सीधा नियम है—सिर्फ अपने पास वाले साथी की हाइट देखो।"
  // 9.67s - 11.0s (f: 280-330): "अगर बायाँ साथी लंबा है,"
  // 11.0s - 13.0s (f: 330+):    "तो दोनों जगह बदल लो!"
  let statusText = "SCHOOL MORNING ASSEMBLY LINEUP";
  let conditionText = "5 STUDENTS STANDING IN UNSORTED ORDER: [5, 1, 4, 2, 8]";
  let statusColor = accent;
  let activeSlots: [number, number] = [-1, -1];
  let isSwappingNow = false;
  let swapT = 0; // 0 to 1
  let lockedSlots: number[] = [];

  // Slot mapping for each student (slot 0 to 4 from left to right)
  const currentSlots: Record<string, number> = {
    s5: 0,
    s1: 1,
    s4: 2,
    s2: 3,
    s8: 4,
  };
  const liftYOffsets: Record<string, number> = {
    s5: 0,
    s1: 0,
    s4: 0,
    s2: 0,
    s8: 0,
  };

  if (mode === "compare_pair") {
    if (frame < 160) {
      // Phase 1: Assembly lineup introduced
      activeSlots = [-1, -1];
      statusText = "MORNING ASSEMBLY LINEUP";
      conditionText = "HEIGHTS: [5, 1, 4, 2, 8]  |  UNSORTED";
      statusColor = accent;
    } else if (frame < 280) {
      // Phase 2: "सिर्फ अपने पास वाले साथी की हाइट देखो" (Look at adjacent neighbor)
      activeSlots = [0, 1];
      statusText = "RULE: INSPECT IMMEDIATE NEIGHBOR";
      conditionText = "COMPARING ADJACENT PAIR: 5 vs 1";
      statusColor = "#FFC857";
    } else if (frame < 330) {
      // Phase 3: "अगर बायाँ साथी लंबा है" (If left partner is taller)
      activeSlots = [0, 1];
      statusText = "CONDITION MET: LEFT (5) > RIGHT (1) ➔ TRUE!";
      conditionText = "LEFT PARTNER IS TALLER (5 > 1) ➔ MUST SWAP!";
      statusColor = "#FF5555";
    } else {
      // Phase 4: "...तो दोनों जगह बदल लो!" (Then swap places!)
      activeSlots = [0, 1];
      isSwappingNow = true;
      const swapSpring = spring({
        frame: frame - 330,
        fps,
        config: { damping: 14, stiffness: 85 },
      });
      swapT = swapSpring;

      // Card s5 glides from slot 0 to 1, arcing upward
      currentSlots.s5 = interpolate(swapSpring, [0, 1], [0, 1]);
      liftYOffsets.s5 = Math.sin(Math.min(1, swapSpring) * Math.PI) * -55;

      // Card s1 glides from slot 1 to 0, arcing downward
      currentSlots.s1 = interpolate(swapSpring, [0, 1], [1, 0]);
      liftYOffsets.s1 = Math.sin(Math.min(1, swapSpring) * Math.PI) * 35;

      if (swapSpring >= 0.85) {
        statusText = "✅ SWAP COMPLETE: 1 COMES FIRST";
        conditionText = "NEW ORDER: [1, 5, 4, 2, 8]  (ASCENDING)";
        statusColor = "#00FF88";
      } else {
        statusText = "SWAPPING POSITIONS: 5 ⇄ 1";
        conditionText = "LATERAL CROSSOVER IN PROGRESS";
        statusColor = "#FF9900";
      }
    }
  } else if (mode === "pass_one") {
    // Scene 4: "जैसे पानी में हवा का बुलबुला ऊपर तैरता है..."
    // 5 bubbles across:
    // f: 0-70: 5 & 1 swap -> [1, 5, 4, 2, 8]
    // f: 70-140: 5 & 4 swap -> [1, 4, 5, 2, 8]
    // f: 140-210: 5 & 2 swap -> [1, 4, 2, 5, 8]
    // f: 210-280: 5 & 8 compare (no swap) -> [1, 4, 2, 5, 8]
    // f: 280+: 8 locks permanently at end (index 4)
    if (frame < 70) {
      activeSlots = [0, 1];
      const sp = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
      currentSlots.s5 = interpolate(sp, [0, 1], [0, 1]);
      currentSlots.s1 = interpolate(sp, [0, 1], [1, 0]);
      liftYOffsets.s5 = Math.sin(Math.min(1, sp) * Math.PI) * -45;
      liftYOffsets.s1 = Math.sin(Math.min(1, sp) * Math.PI) * 30;
      statusText = "STEP 1: SWAP 5 & 1  ➔  5 BUBBLES FORWARD";
      conditionText = "ARRAY: [1, 5, 4, 2, 8]";
      statusColor = accent;
    } else if (frame < 140) {
      activeSlots = [1, 2];
      currentSlots.s1 = 0;
      const sp = spring({ frame: frame - 70, fps, config: { damping: 14, stiffness: 90 } });
      currentSlots.s5 = interpolate(sp, [0, 1], [1, 2]);
      currentSlots.s4 = interpolate(sp, [0, 1], [2, 1]);
      liftYOffsets.s5 = Math.sin(Math.min(1, sp) * Math.PI) * -45;
      liftYOffsets.s4 = Math.sin(Math.min(1, sp) * Math.PI) * 30;
      statusText = "STEP 2: SWAP 5 & 4  ➔  5 BUBBLES FORWARD";
      conditionText = "ARRAY: [1, 4, 5, 2, 8]";
      statusColor = accent;
    } else if (frame < 210) {
      activeSlots = [2, 3];
      currentSlots.s1 = 0;
      currentSlots.s4 = 1;
      const sp = spring({ frame: frame - 140, fps, config: { damping: 14, stiffness: 90 } });
      currentSlots.s5 = interpolate(sp, [0, 1], [2, 3]);
      currentSlots.s2 = interpolate(sp, [0, 1], [3, 2]);
      liftYOffsets.s5 = Math.sin(Math.min(1, sp) * Math.PI) * -45;
      liftYOffsets.s2 = Math.sin(Math.min(1, sp) * Math.PI) * 30;
      statusText = "STEP 3: SWAP 5 & 2  ➔  5 REACHES FINAL TEST";
      conditionText = "ARRAY: [1, 4, 2, 5, 8]";
      statusColor = accent;
    } else if (frame < 280) {
      activeSlots = [3, 4];
      currentSlots.s1 = 0;
      currentSlots.s4 = 1;
      currentSlots.s2 = 2;
      currentSlots.s5 = 3;
      currentSlots.s8 = 4;
      statusText = "STEP 4: COMPARE 5 vs 8  ➔  NO SWAP (5 < 8)";
      conditionText = "8 REMAINS AT END (LARGEST ELEMENT)";
      statusColor = "#FFC857";
    } else {
      activeSlots = [-1, -1];
      lockedSlots = [4];
      currentSlots.s1 = 0;
      currentSlots.s4 = 1;
      currentSlots.s2 = 2;
      currentSlots.s5 = 3;
      currentSlots.s8 = 4;
      statusText = "🔒 PASS 1 COMPLETE: 8 PERMANENTLY LOCKED";
      conditionText = "LARGEST ELEMENT BUBBLED TO END IN O(n)";
      statusColor = "#00FF88";
    }
  }

  // Dimensions & Coordinates
  const cardW = isLandscape ? 144 : 162;
  const cardGap = isLandscape ? 22 : 18;
  const slotStep = cardW + cardGap;
  const totalW = 5 * cardW + 4 * cardGap;

  // Pulse animation for badges
  const pulse = Math.sin(frame * 0.18) * 0.08 + 1;

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

      {/* 2. Dynamic Condition & Algorithm Telemetry Banner */}
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          background: "rgba(11, 16, 32, 0.88)",
          backdropFilter: "blur(18px)",
          border: `1.5px solid ${statusColor}55`,
          borderRadius: 20,
          padding: isLandscape ? "12px 24px" : "16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "center",
          boxShadow: `0 12px 40px rgba(0, 0, 0, 0.6), 0 0 25px ${statusColor}22`,
          transition: "border 0.3s, box-shadow 0.3s",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: statusColor,
              boxShadow: `0 0 16px ${statusColor}`,
              transform: `scale(${pulse})`,
            }}
          />
          <div
            style={{
              fontFamily: MONO,
              fontSize: isLandscape ? 20 : 26,
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "0.06em",
              textAlign: "center",
            }}
          >
            {statusText}
          </div>
        </div>

        <div
          style={{
            fontFamily: MONO,
            fontSize: isLandscape ? 15 : 18,
            fontWeight: 700,
            color: statusColor,
            background: `${statusColor}15`,
            padding: "4px 18px",
            borderRadius: 10,
            border: `1px solid ${statusColor}40`,
            letterSpacing: "0.04em",
          }}
        >
          {conditionText}
        </div>
      </div>

      {/* 3. Main Array Visualization Arena */}
      <div
        style={{
          width: "100%",
          maxWidth: 1000,
          height: isLandscape ? 400 : 520,
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          paddingBottom: 20,
        }}
      >
        {/* Arena Base Line / Ground Plane */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            width: totalW + 40,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${accent}88, #FFFFFF, ${accent}88, transparent)`,
            boxShadow: `0 0 16px ${accent}`,
          }}
        />

        {/* Floating Adjacent Pair Scanner Bracket (when comparing slot 0 & 1) */}
        {activeSlots[0] >= 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: `translateX(${(activeSlots[0] - 2) * slotStep + slotStep / 2 - (cardW + cardGap + 24) / 2}px)`,
              width: cardW * 2 + cardGap + 24,
              height: isLandscape ? 340 : 440,
              border: `2px dashed ${frame >= 280 && frame < 330 ? "#FF5555" : frame >= 330 ? "#00FF88" : "#FFC857"}`,
              borderRadius: 24,
              backgroundColor: `${frame >= 280 && frame < 330 ? "rgba(255,85,85,0.08)" : frame >= 330 ? "rgba(0,255,136,0.06)" : "rgba(255,200,87,0.06)"}`,
              boxShadow: `0 0 30px ${frame >= 280 && frame < 330 ? "#FF555533" : frame >= 330 ? "#00FF8833" : "#FFC85733"}`,
              pointerEvents: "none",
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 0",
              transition: "all 0.3s",
            }}
          >
            {/* Top Scanner Indicator Pill */}
            <div
              style={{
                fontFamily: MONO,
                fontSize: 12,
                fontWeight: 900,
                color: frame >= 280 && frame < 330 ? "#FF5555" : frame >= 330 ? "#00FF88" : "#FFC857",
                background: "#0D1322",
                border: `1.5px solid ${frame >= 280 && frame < 330 ? "#FF5555" : frame >= 330 ? "#00FF88" : "#FFC857"}`,
                borderRadius: 20,
                padding: "3px 12px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {frame >= 280 && frame < 330
                ? "5 > 1 (SWAP REQUIRED)"
                : frame >= 330
                ? "1 < 5 (SWAPPED)"
                : "ADJACENT PAIR: A[0] vs A[1]"}
            </div>

            {/* Directional Swap Arrows indicator (appears right before and during swap) */}
            {frame >= 280 && (
              <div
                style={{
                  display: "flex",
                  gap: 36,
                  alignItems: "center",
                  fontSize: 28,
                  fontWeight: 900,
                  color: frame >= 330 ? "#00FF88" : "#FF5555",
                  textShadow: "0 0 16px rgba(0,0,0,0.8)",
                  animation: "pulse 1s infinite",
                }}
              >
                <span>⇄</span>
              </div>
            )}

            <div style={{ height: 10 }} />
          </div>
        )}

        {/* Render 5 Individual Student Cards with Persistent IDs */}
        {baseStudents.map((student, initialIdx) => {
          const currentSlot = currentSlots[student.id] ?? initialIdx;
          const liftY = liftYOffsets[student.id] ?? 0;
          const isComparing = activeSlots.includes(Math.round(currentSlot));
          const isLocked = lockedSlots.includes(Math.round(currentSlot));

          // Calculate horizontal offset from center slot 2
          const posX = (currentSlot - 2) * slotStep;

          // Card Height proportional to student value
          const baseHeight = isLandscape ? 160 : 200;
          const proportionalHeight = (student.value / maxVal) * (isLandscape ? 120 : 180);
          const barHeight = baseHeight + proportionalHeight;

          // Card Entrance spring
          const enterSpring = spring({
            frame: frame - initialIdx * 4,
            fps,
            config: { damping: 14, stiffness: 120 },
          });

          // Focus / Dimming effect
          const isDimmed = activeSlots[0] >= 0 && !isComparing;
          const cardOpacity = isDimmed ? 0.35 : enterSpring;

          // Z-index priority during swap
          let cardZ = 10;
          if (student.id === "s5" && isSwappingNow) cardZ = 50;
          if (student.id === "s1" && isSwappingNow) cardZ = 40;

          // Border & Glow styling
          let borderColor = "rgba(255, 255, 255, 0.22)";
          let bgGradient = "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(13, 19, 34, 0.85) 100%)";
          let glowShadow = "0 8px 24px rgba(0,0,0,0.5)";

          if (isLocked) {
            borderColor = "#00FF88";
            bgGradient = "linear-gradient(180deg, rgba(0, 255, 136, 0.35) 0%, rgba(13, 19, 34, 0.95) 100%)";
            glowShadow = "0 0 35px rgba(0, 255, 136, 0.5)";
          } else if (isComparing) {
            if (frame >= 280 && frame < 330) {
              borderColor = "#FF5555";
              bgGradient = "linear-gradient(180deg, rgba(255, 85, 85, 0.35) 0%, rgba(13, 19, 34, 0.95) 100%)";
              glowShadow = "0 0 40px rgba(255, 85, 85, 0.6)";
            } else if (frame >= 330) {
              borderColor = "#00FF88";
              bgGradient = "linear-gradient(180deg, rgba(0, 255, 136, 0.30) 0%, rgba(13, 19, 34, 0.95) 100%)";
              glowShadow = "0 0 35px rgba(0, 255, 136, 0.4)";
            } else {
              borderColor = "#FFC857";
              bgGradient = "linear-gradient(180deg, rgba(255, 200, 87, 0.30) 0%, rgba(13, 19, 34, 0.95) 100%)";
              glowShadow = "0 0 35px rgba(255, 200, 87, 0.5)";
            }
          }

          return (
            <div
              key={student.id}
              style={{
                position: "absolute",
                bottom: 30,
                left: "50%",
                width: cardW,
                transform: `translateX(${posX - cardW / 2}px) translateY(${liftY}px) scale(${enterSpring})`,
                opacity: cardOpacity,
                zIndex: cardZ,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transition: "opacity 0.25s",
              }}
            >
              {/* Dynamic Slot Index Badge */}
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: isLandscape ? 13 : 16,
                  fontWeight: 800,
                  color: isComparing ? borderColor : "#8F9BB3",
                  marginBottom: 8,
                  letterSpacing: "0.06em",
                }}
              >
                Index [{Math.round(currentSlot)}]
              </div>

              {/* Status Tag Pill above Card */}
              <div style={{ height: 28, display: "flex", alignItems: "center", marginBottom: 6 }}>
                {isLocked ? (
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#00FF88",
                      background: "rgba(0,255,136,0.18)",
                      border: "1px solid #00FF88",
                      borderRadius: 6,
                      padding: "2px 8px",
                    }}
                  >
                    LOCKED
                  </div>
                ) : isComparing ? (
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      fontWeight: 900,
                      color: borderColor,
                      background: `${borderColor}22`,
                      border: `1.5px solid ${borderColor}`,
                      borderRadius: 6,
                      padding: "2px 8px",
                      textTransform: "uppercase",
                      transform: `scale(${pulse})`,
                    }}
                  >
                    {frame >= 280 && frame < 330
                      ? student.value === 5
                        ? "TALLER"
                        : "SHORTER"
                      : frame >= 330
                      ? "SWAPPED"
                      : "ACTIVE"}
                  </div>
                ) : null}
              </div>

              {/* Physical Card / Height Column */}
              <div
                style={{
                  width: "100%",
                  height: barHeight,
                  background: bgGradient,
                  border: `2.5px solid ${borderColor}`,
                  borderRadius: 22,
                  boxShadow: glowShadow,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 10px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Top Glassmorphic Shine */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "35%",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
                    pointerEvents: "none",
                  }}
                />

                {/* Student Avatar & Label */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontSize: isLandscape ? 22 : 28 }}>{student.avatar}</span>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: isLandscape ? 10 : 12,
                      fontWeight: 800,
                      color: "#FFFFFF",
                      opacity: 0.85,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {student.label}
                  </span>
                </div>

                {/* PRIMARY GIANT NUMBER VALUE (UNMISTAKABLE VISIBILITY) */}
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: isLandscape ? 56 : 76,
                    fontWeight: 900,
                    color: "#FFFFFF",
                    lineHeight: 1,
                    textShadow: "0 6px 20px rgba(0,0,0,0.9), 0 0 16px rgba(255,255,255,0.3)",
                    letterSpacing: "-0.04em",
                  }}
                >
                  {student.value}
                </div>

                {/* Height Value Tag at Base */}
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: isLandscape ? 11 : 13,
                    fontWeight: 800,
                    color: isComparing ? borderColor : "rgba(255,255,255,0.7)",
                    backgroundColor: "rgba(0,0,0,0.45)",
                    border: `1px solid ${borderColor}55`,
                    borderRadius: 8,
                    padding: "3px 10px",
                    textTransform: "uppercase",
                  }}
                >
                  {`Ht: ${student.value}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Landscape Telemetry Dock (only in landscape mode to prevent caption collision) */}
      {isLandscape && (
        <div
          style={{
            width: "100%",
            maxWidth: 960,
            background: "rgba(11, 16, 32, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 20,
            padding: "16px 28px",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            backdropFilter: "blur(16px)",
            marginTop: 10,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: MONO, fontSize: 13, color: "#9AA3C7", textTransform: "uppercase" }}>
              Active Pass
            </div>
            <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 800, color: accent }}>
              Pass 1 / 4
            </div>
          </div>

          <div style={{ width: 1, height: 36, backgroundColor: "rgba(255, 255, 255, 0.12)" }} />

          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: MONO, fontSize: 13, color: "#9AA3C7", textTransform: "uppercase" }}>
              Comparison
            </div>
            <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 800, color: "#FFC857" }}>
              A[0] vs A[1]
            </div>
          </div>

          <div style={{ width: 1, height: 36, backgroundColor: "rgba(255, 255, 255, 0.12)" }} />

          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: MONO, fontSize: 13, color: "#9AA3C7", textTransform: "uppercase" }}>
              Action
            </div>
            <div style={{ fontFamily: FONT, fontSize: 20, fontWeight: 800, color: statusColor }}>
              {frame >= 330 ? "Swap Completed" : frame >= 280 ? "Swap Triggered" : "Comparing"}
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
