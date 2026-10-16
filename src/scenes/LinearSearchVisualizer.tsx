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

interface RegisterEntry {
  roll: string;
  index: number;
  name: string;
  avatar: string;
}

export const LinearSearchVisualizer: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const L = useLayout();
  const isLandscape = L.landscape;

  const variant = scene.variant || "intro"; // "intro" | "found" | "not_found"
  const tag = scene.tag || "01 / LINEAR SEARCH";
  const title = scene.title || "FIND IN THE REGISTER";

  const entries: RegisterEntry[] = [
    { roll: "01", index: 0, name: "KABIR", avatar: "👦" },
    { roll: "02", index: 1, name: "ZOYA", avatar: "👧" },
    { roll: "03", index: 2, name: "AMAN", avatar: "🧑" },
    { roll: "04", index: 3, name: "MIRA", avatar: "👩" },
    { roll: "05", index: 4, name: "DEV", avatar: "👦" },
  ];

  let targetName = "MIRA";
  let activeIndex = 0;
  let statusText = "INITIALIZING LINEAR SEARCH";
  let comparisonText = "READY TO START";
  let statusColor = accent;
  let completedIndices: number[] = [];
  let matchedIndex: number | null = null;
  let skippedIndices: number[] = [];
  let isEndOfList = false;
  let checksCount = 0;
  let showActionArrow = true;

  // Scene-specific timeline logic matching the narration word timestamps
  if (variant === "intro") {
    // Scene 0: Introduction to the register and search target (8.04s, 241 frames)
    // f: 0-74: "शिक्षक के पास कक्षा का एक रजिस्टर है।"
    // f: 74-148: "नाम किसी खास क्रम में नहीं हैं। उन्हें मीरा का नाम ढूँढना है।"
    // f: 148-241: "कंप्यूटर कहाँ से शुरू करेगा?"
    targetName = "MIRA";
    if (frame < 75) {
      activeIndex = -1;
      statusText = "CLASSROOM ATTENDANCE REGISTER";
      comparisonText = "UNSORTED STUDENT LIST";
      statusColor = accent;
      checksCount = 0;
      showActionArrow = false;
    } else if (frame < 148) {
      activeIndex = -1;
      statusText = "SEARCH TARGET IDENTIFIED";
      comparisonText = "LOOKING FOR: MIRA";
      statusColor = "#FFC857";
      checksCount = 0;
      showActionArrow = false;
    } else {
      activeIndex = 0;
      statusText = "START AT FIRST ENTRY: INDEX 0";
      comparisonText = "LINEAR SEARCH ALWAYS STARTS AT i = 0";
      statusColor = accent;
      checksCount = 0;
      showActionArrow = true;
    }
  } else if (variant === "found") {
    // Scene 2: Finding Mira at index 3 with early exit before Dev (7.32s, 220 frames)
    // f: 0-32 (0.00-1.10s): "पहले कबीर—मीरा नहीं।" (Index 0: Kabir != Mira)
    // f: 32-65 (1.10-2.20s): "अगली लाइन, ज़ोया—नहीं।" (Index 1: Zoya != Mira)
    // f: 65-87 (2.20-2.93s): "फिर अमन—नहीं।" (Index 2: Aman != Mira)
    // f: 87-120 (2.93-4.03s): "अब मीरा—मिल गई!" (Index 3: Mira == Mira -> MATCH!)
    // f: 120-220 (4.03-7.32s): "यहीं रुकते हैं; देव को जाँचने की ज़रूरत नहीं।" (STOP! Early termination, Dev skipped)
    targetName = "MIRA";
    if (frame < 32) {
      activeIndex = 0;
      completedIndices = [];
      checksCount = 1;
      statusText = "CHECKING INDEX 0: KABIR";
      comparisonText = "KABIR == MIRA? ➔ NO MISMATCH ❌";
      statusColor = "#FF5555";
      showActionArrow = true;
    } else if (frame < 65) {
      activeIndex = 1;
      completedIndices = [0];
      checksCount = 2;
      statusText = "ADVANCING ⬇️ CHECKING INDEX 1: ZOYA";
      comparisonText = "ZOYA == MIRA? ➔ NO MISMATCH ❌";
      statusColor = "#FF5555";
      showActionArrow = true;
    } else if (frame < 87) {
      activeIndex = 2;
      completedIndices = [0, 1];
      checksCount = 3;
      statusText = "ADVANCING ⬇️ CHECKING INDEX 2: AMAN";
      comparisonText = "AMAN == MIRA? ➔ NO MISMATCH ❌";
      statusColor = "#FF5555";
      showActionArrow = true;
    } else if (frame < 120) {
      activeIndex = 3;
      completedIndices = [0, 1, 2];
      matchedIndex = 3;
      checksCount = 4;
      statusText = "CHECKING INDEX 3: MIRA ➔ MATCH FOUND! ✅";
      comparisonText = "MIRA == MIRA? ➔ YES! TARGET FOUND!";
      statusColor = "#10B981";
      showActionArrow = false;
    } else {
      activeIndex = 3;
      completedIndices = [0, 1, 2];
      matchedIndex = 3;
      skippedIndices = [4];
      checksCount = 4;
      statusText = "🛑 STOP: SEARCH COMPLETE (EARLY EXIT)";
      comparisonText = "INDEX 4 (DEV) SKIPPED ➔ SAVED 1 COMPARISON";
      statusColor = "#10B981";
      showActionArrow = false;
    }
  } else if (variant === "not_found") {
    // Scene 4: Searching for Nisha (absent) -> checks all 5 and hits end of list (6.29s, 189 frames)
    // f: 0-35 (0.00-1.20s): "अब निशा को खोजो।"
    // f: 35-53 (1.20-1.80s): "कबीर? नहीं।" (Index 0)
    // f: 53-71 (1.80-2.40s): "ज़ोया? नहीं।" (Index 1)
    // f: 71-89 (2.40-2.99s): "अमन? नहीं।" (Index 2)
    // f: 89-107 (2.99-3.59s): "मीरा? नहीं।" (Index 3)
    // f: 107-125 (3.59-4.19s): "देव? नहीं।" (Index 4)
    // f: 125-189 (4.19-6.29s): "पूरी list जाँच ली—निशा यहाँ नहीं है।" (End of list -> Return -1)
    targetName = "NISHA";
    if (frame < 35) {
      activeIndex = 0;
      completedIndices = [];
      checksCount = 0;
      statusText = "NEW TARGET: NISHA";
      comparisonText = "SCANNING ENTIRE LIST FROM START";
      statusColor = "#FFC857";
      showActionArrow = true;
    } else if (frame < 53) {
      activeIndex = 0;
      completedIndices = [];
      checksCount = 1;
      statusText = "CHECKING INDEX 0: KABIR";
      comparisonText = "KABIR == NISHA? ➔ NO ❌";
      statusColor = "#FF5555";
      showActionArrow = true;
    } else if (frame < 71) {
      activeIndex = 1;
      completedIndices = [0];
      checksCount = 2;
      statusText = "ADVANCE ⬇️ INDEX 1: ZOYA";
      comparisonText = "ZOYA == NISHA? ➔ NO ❌";
      statusColor = "#FF5555";
      showActionArrow = true;
    } else if (frame < 89) {
      activeIndex = 2;
      completedIndices = [0, 1];
      checksCount = 3;
      statusText = "ADVANCE ⬇️ INDEX 2: AMAN";
      comparisonText = "AMAN == NISHA? ➔ NO ❌";
      statusColor = "#FF5555";
      showActionArrow = true;
    } else if (frame < 107) {
      activeIndex = 3;
      completedIndices = [0, 1, 2];
      checksCount = 4;
      statusText = "ADVANCE ⬇️ INDEX 3: MIRA";
      comparisonText = "MIRA == NISHA? ➔ NO ❌";
      statusColor = "#FF5555";
      showActionArrow = true;
    } else if (frame < 125) {
      activeIndex = 4;
      completedIndices = [0, 1, 2, 3];
      checksCount = 5;
      statusText = "ADVANCE ⬇️ INDEX 4: DEV";
      comparisonText = "DEV == NISHA? ➔ NO ❌";
      statusColor = "#FF5555";
      showActionArrow = true;
    } else {
      activeIndex = 5; // Beyond list boundary
      completedIndices = [0, 1, 2, 3, 4];
      checksCount = 5;
      isEndOfList = true;
      statusText = "⚠️ END OF LIST REACHED (i == N)";
      comparisonText = "RESULT: NOT FOUND (RETURN -1) · 5/5 CHECKED";
      statusColor = "#EF4444";
      showActionArrow = false;
    }
  }

  // Smooth spring entry for register clipboard
  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  // Calculate pointer vertical target position
  const rowHeight = isLandscape ? 68 : 82;
  const pointerY = activeIndex >= 0 && activeIndex < 5
    ? activeIndex * rowHeight
    : activeIndex === 5
    ? 5 * rowHeight + 10
    : 0;

  // Pulse animation for action direction
  const pulse = Math.sin(frame * 0.2) * 0.5 + 0.5;

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
        paddingTop: isLandscape ? 40 : 130,
        paddingBottom: isLandscape ? 40 : 160,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Background Subtle Tech Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 50% 20%, rgba(0, 240, 255, 0.08) 0%, transparent 60%), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 40px 40px, 40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Header Tag & Title */}
      <div
        style={{
          zIndex: 10,
          textAlign: "center",
          marginBottom: isLandscape ? 12 : 24,
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

      {/* Action Direction Visual Indicator Banner */}
      <div
        style={{
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          backgroundColor: "rgba(0, 240, 255, 0.08)",
          border: `1px solid rgba(0, 240, 255, 0.25)`,
          borderRadius: 24,
          padding: isLandscape ? "6px 18px" : "10px 24px",
          marginBottom: isLandscape ? 14 : 26,
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: accent,
            fontFamily: MONO,
            fontSize: isLandscape ? 13 : 17,
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          <span>ACTION DIRECTION:</span>
          <span style={{ color: "#FFFFFF" }}>SEQUENTIAL FORWARD SCAN (i++)</span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              transform: `translateY(${Math.sin(frame * 0.25) * 3}px)`,
              color: accent,
              fontSize: isLandscape ? 16 : 22,
            }}
          >
            ⬇️
          </div>
        </div>
      </div>

      {/* The Central Physical Classroom Register Sheet */}
      <div
        style={{
          zIndex: 10,
          width: isLandscape ? 680 : 880,
          backgroundColor: "#FAF7EE", // Authentic vintage register paper color
          borderRadius: 16,
          boxShadow:
            "0 25px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(0,0,0,0.1), inset 0 0 40px rgba(180, 160, 120, 0.15)",
          color: "#1E2028",
          position: "relative",
          overflow: "hidden",
          transform: `scale(${enterSpring})`,
          transition: "transform 0.2s ease-out",
        }}
      >
        {/* Binder Ring Punch Holes along the Left Margin */}
        <div
          style={{
            position: "absolute",
            left: isLandscape ? 18 : 24,
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={`hole-${idx}`}
              style={{
                width: isLandscape ? 12 : 16,
                height: isLandscape ? 12 : 16,
                borderRadius: "50%",
                backgroundColor: "#0B1020",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 1px rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </div>

        {/* Red Vertical Ruled Line (Authentic Ledger Paper Margin) */}
        <div
          style={{
            position: "absolute",
            left: isLandscape ? 44 : 58,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: "#E87C7C",
            opacity: 0.65,
            zIndex: 4,
          }}
        />

        {/* Register Top Header Bar */}
        <div
          style={{
            padding: isLandscape ? "14px 20px 10px 58px" : "18px 28px 14px 76px",
            borderBottom: "2px solid #334155",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#F1ECE0",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: isLandscape ? 14 : 19,
                fontWeight: 800,
                letterSpacing: "0.04em",
                color: "#1E293B",
                textTransform: "uppercase",
              }}
            >
              CLASS ATTENDANCE REGISTER · CS101
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: isLandscape ? 11 : 14,
                color: "#64748B",
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              UNSORTED DATA SHEET · 5 ENTRIES
            </div>
          </div>

          {/* Search Target Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#1E293B",
              color: "#FFFFFF",
              padding: isLandscape ? "6px 14px" : "8px 18px",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              border: `1px solid ${variant === "not_found" ? "#FF5555" : accent}`,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: isLandscape ? 11 : 14,
                color: "#94A3B8",
                fontWeight: 600,
              }}
            >
              TARGET:
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: isLandscape ? 15 : 20,
                fontWeight: 800,
                color: variant === "not_found" ? "#FF6B6B" : accent,
                letterSpacing: "0.08em",
              }}
            >
              {targetName}
            </span>
          </div>
        </div>

        {/* Table Column Headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isLandscape
              ? "50px 85px 1fr 180px"
              : "65px 110px 1fr 220px",
            padding: isLandscape ? "8px 16px 8px 58px" : "10px 24px 10px 76px",
            fontFamily: MONO,
            fontSize: isLandscape ? 11 : 14,
            fontWeight: 700,
            color: "#64748B",
            borderBottom: "1px solid #CBD5E1",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          <div>ROLL</div>
          <div>ARRAY IDX</div>
          <div>STUDENT NAME</div>
          <div style={{ textAlign: "right" }}>SEARCH STATUS</div>
        </div>

        {/* The 5 Rows of the Register */}
        <div
          style={{
            position: "relative",
            padding: isLandscape ? "0 16px 0 58px" : "0 24px 0 76px",
          }}
        >
          {entries.map((entry, idx) => {
            const isCurrent = activeIndex === idx;
            const isCompleted = completedIndices.includes(idx);
            const isMatched = matchedIndex === idx;
            const isSkipped = skippedIndices.includes(idx);

            // Row background state
            let rowBg = "transparent";
            let textColor = "#1E293B";
            let statusBadge = "PENDING";
            let badgeBg = "rgba(100, 116, 139, 0.12)";
            let badgeColor = "#64748B";

            if (isMatched) {
              rowBg = "rgba(16, 185, 129, 0.18)";
              textColor = "#065F46";
              statusBadge = "MATCH FOUND! ✅";
              badgeBg = "#10B981";
              badgeColor = "#FFFFFF";
            } else if (isCurrent) {
              rowBg = variant === "found" && idx === 3
                ? "rgba(16, 185, 129, 0.18)"
                : "rgba(0, 240, 255, 0.15)";
              textColor = "#0F172A";
              statusBadge = "INSPECTING...";
              badgeBg = "#0284C7";
              badgeColor = "#FFFFFF";
            } else if (isCompleted) {
              rowBg = "rgba(239, 68, 68, 0.08)";
              textColor = "#64748B";
              statusBadge = "MISMATCH ❌";
              badgeBg = "rgba(239, 68, 68, 0.18)";
              badgeColor = "#DC2626";
            } else if (isSkipped) {
              rowBg = "rgba(0, 0, 0, 0.04)";
              textColor = "#94A3B8";
              statusBadge = "SKIPPED 🔒";
              badgeBg = "rgba(148, 163, 184, 0.2)";
              badgeColor = "#64748B";
            }

            return (
              <div
                key={entry.roll}
                style={{
                  display: "grid",
                  gridTemplateColumns: isLandscape
                    ? "50px 85px 1fr 180px"
                    : "65px 110px 1fr 220px",
                  alignItems: "center",
                  height: rowHeight,
                  borderBottom: "1px solid #E2E8F0",
                  backgroundColor: rowBg,
                  position: "relative",
                  transition: "background-color 0.2s ease",
                }}
              >
                {/* Active Row Highlight Outline & Direction Arrow */}
                {isCurrent && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      border: `2px solid ${isMatched ? "#10B981" : "#0284C7"}`,
                      borderRadius: 6,
                      pointerEvents: "none",
                      boxShadow: isMatched
                        ? "0 0 25px rgba(16, 185, 129, 0.4)"
                        : "0 0 15px rgba(2, 132, 199, 0.25)",
                    }}
                  />
                )}

                {/* Roll Number */}
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: isLandscape ? 14 : 18,
                    fontWeight: 700,
                    color: "#64748B",
                  }}
                >
                  #{entry.roll}
                </div>

                {/* CS Array Index Badge */}
                <div>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: isLandscape ? 12 : 15,
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: 4,
                      backgroundColor: isCurrent ? "#0F172A" : "rgba(15, 23, 42, 0.08)",
                      color: isCurrent ? accent : "#475569",
                    }}
                  >
                    [{entry.index}]
                  </span>
                </div>

                {/* Student Name */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: isLandscape ? 20 : 26 }}>
                    {entry.avatar}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT,
                      fontSize: isLandscape ? 18 : 25,
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      color: textColor,
                      textDecoration: isCompleted ? "line-through" : "none",
                    }}
                  >
                    {entry.name}
                  </span>
                </div>

                {/* Search Status Badge */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: isLandscape ? 11 : 14,
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      padding: isLandscape ? "4px 10px" : "6px 14px",
                      borderRadius: 6,
                      backgroundColor: badgeBg,
                      color: badgeColor,
                      boxShadow: isMatched ? "0 0 15px rgba(16, 185, 129, 0.4)" : "none",
                    }}
                  >
                    {statusBadge}
                  </span>
                </div>

                {/* Mismatch Directional Action Arrow to Next Row */}
                {isCompleted && idx < 4 && activeIndex === idx + 1 && showActionArrow && (
                  <div
                    style={{
                      position: "absolute",
                      right: isLandscape ? -30 : -42,
                      bottom: -15,
                      zIndex: 20,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#0284C7",
                      fontFamily: MONO,
                      fontSize: isLandscape ? 12 : 15,
                      fontWeight: 800,
                      animation: "pulse 1s infinite",
                    }}
                  >
                    <span>⬇️</span>
                    <span style={{ fontSize: isLandscape ? 10 : 12 }}>i++</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Red Stop Barrier Line when match is found (Scene 2 early exit) */}
          {matchedIndex !== null && skippedIndices.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 4 * rowHeight,
                left: isLandscape ? 40 : 54,
                right: 0,
                height: 4,
                backgroundColor: "#EF4444",
                boxShadow: "0 0 16px #EF4444",
                zIndex: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  backgroundColor: "#EF4444",
                  color: "#FFFFFF",
                  fontFamily: MONO,
                  fontSize: isLandscape ? 10 : 13,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  padding: "2px 14px",
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                🛑 STOP: TARGET FOUND · SEARCH TERMINATED
              </div>
            </div>
          )}

          {/* End of List Boundary Indicator (Scene 4 not found) */}
          {isEndOfList && (
            <div
              style={{
                marginTop: 8,
                padding: isLandscape ? "8px 12px" : "12px 16px",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "2px dashed #EF4444",
                borderRadius: 8,
                textAlign: "center",
                fontFamily: MONO,
                fontSize: isLandscape ? 12 : 16,
                fontWeight: 800,
                color: "#DC2626",
              }}
            >
              ⚠️ BOUNDARY REACHED: ALL 5 ITEMS CHECKED · RETURN -1
            </div>
          )}
        </div>

        {/* Register Bottom Telemetry Bar */}
        <div
          style={{
            padding: isLandscape ? "12px 20px 14px 58px" : "16px 28px 18px 76px",
            backgroundColor: "#F1ECE0",
            borderTop: "2px solid #CBD5E1",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: isLandscape ? 12 : 16,
              fontWeight: 700,
              color: "#334155",
            }}
          >
            {comparisonText}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontFamily: MONO,
              fontSize: isLandscape ? 12 : 16,
              fontWeight: 800,
            }}
          >
            <span style={{ color: "#64748B" }}>CHECKS PERFORMED:</span>
            <span
              style={{
                backgroundColor: "#0F172A",
                color: "#38BDF8",
                padding: "3px 10px",
                borderRadius: 6,
              }}
            >
              {checksCount} / 5
            </span>
          </div>
        </div>
      </div>

      {/* Floating Status & Instruction Banner Below */}
      <div
        style={{
          zIndex: 10,
          marginTop: isLandscape ? 14 : 26,
          textAlign: "center",
          maxWidth: isLandscape ? 680 : 880,
          width: "90%",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(11, 16, 32, 0.85)",
            border: `1px solid ${statusColor}`,
            borderRadius: 12,
            padding: isLandscape ? "8px 16px" : "12px 22px",
            boxShadow: `0 8px 30px rgba(0,0,0,0.6), 0 0 15px ${statusColor}44`,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: isLandscape ? 14 : 18,
              fontWeight: 800,
              color: statusColor,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {statusText}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
