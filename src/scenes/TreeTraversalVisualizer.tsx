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

// Exact coordinates matching the 960x720 SVG canvas
interface NodeCoord {
  id: string;
  val: string;
  cx: number;
  cy: number;
  level: number;
  leftId?: string;
  rightId?: string;
}

const TREE_NODES: NodeCoord[] = [
  { id: "1", val: "1", cx: 480, cy: 120, level: 0, leftId: "2", rightId: "3" },
  { id: "2", val: "2", cx: 250, cy: 310, level: 1, leftId: "4", rightId: "5" },
  { id: "3", val: "3", cx: 710, cy: 310, level: 1, leftId: "6", rightId: "7" },
  { id: "4", val: "4", cx: 140, cy: 520, level: 2 },
  { id: "5", val: "5", cx: 360, cy: 520, level: 2 },
  { id: "6", val: "6", cx: 600, cy: 520, level: 2 },
  { id: "7", val: "7", cx: 820, cy: 520, level: 2 },
];

// BST arrangement (where in-order prints 1, 2, 3, 4, 5, 6, 7)
const BST_NODES: NodeCoord[] = [
  { id: "4", val: "4", cx: 480, cy: 120, level: 0, leftId: "2", rightId: "6" },
  { id: "2", val: "2", cx: 250, cy: 310, level: 1, leftId: "1", rightId: "3" },
  { id: "6", val: "6", cx: 710, cy: 310, level: 1, leftId: "5", rightId: "7" },
  { id: "1", val: "1", cx: 140, cy: 520, level: 2 },
  { id: "3", val: "3", cx: 360, cy: 520, level: 2 },
  { id: "5", val: "5", cx: 600, cy: 520, level: 2 },
  { id: "7", val: "7", cx: 820, cy: 520, level: 2 },
];

export const TreeTraversalVisualizer: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const L = useLayout();

  const variant = scene.variant || "linear_vs_tree";
  const tag = scene.tag || "01 / TREE TRAVERSAL";
  const title = scene.title || "BINARY TREE TRAVERSALS";

  // Normalized progress [0 to 1]
  const progress = Math.min(Math.max(frame / Math.max(durationInFrames, 1), 0), 1);

  // Modern font families
  const FONT = "'Space Grotesk', -apple-system, sans-serif";
  const MONO = "'JetBrains Mono', monospace";

  // Palette tokens from Masterclass Design
  const C = {
    bg: "#070B14",
    surface: "#0E1626",
    surfaceCard: "rgba(15, 23, 42, 0.9)",
    border: "#1E293B",
    borderBright: "#334155",
    cyan: "#06B6D4",
    purple: "#8B5CF6",
    rose: "#F43F5E",
    emerald: "#10B981",
    amber: "#F59E0B",
    text: "#F8FAFC",
    muted: "#94A3B8",
  };

  // Top Masterclass Header Bar
  const renderTopBar = (sceneNum: string) => (
    <div
      style={{
        width: 960,
        height: 64,
        borderRadius: 20,
        backgroundColor: "rgba(15, 23, 42, 0.85)",
        border: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        marginBottom: 20,
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: "rgba(6, 182, 212, 0.2)",
            border: `1px solid ${C.cyan}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.cyan,
            fontSize: 20,
          }}
        >
          🌲
        </div>
        <span style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: FONT }}>
          Tree Traversals Masterclass
        </span>
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 18,
          fontWeight: 800,
          color: C.amber,
          padding: "6px 14px",
          borderRadius: 999,
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          border: `1px solid rgba(245, 158, 11, 0.4)`,
        }}
      >
        {sceneNum}
      </div>
    </div>
  );

  // Reusable 7-Slot Output Array Row
  const renderOutputSlots = (visitedValues: string[], highlightColor: string) => {
    const slots = [0, 1, 2, 3, 4, 5, 6];
    return (
      <div
        style={{
          width: 960,
          backgroundColor: "rgba(14, 22, 38, 0.92)",
          border: `1px solid ${C.border}`,
          borderRadius: 22,
          padding: "16px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: FONT }}>
            VISITED OUTPUT SEQUENCE
          </span>
          <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.muted }}>
            {visitedValues.length} / 7 Nodes Visited
          </span>
        </div>
        <div style={{ display: "flex", gap: 14, justifyContent: "space-between" }}>
          {slots.map((idx) => {
            const val = visitedValues[idx];
            const isFilled = Boolean(val);
            const isLatest = idx === visitedValues.length - 1;
            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  height: 68,
                  borderRadius: 16,
                  backgroundColor: isFilled ? `${highlightColor}22` : "rgba(30, 41, 59, 0.5)",
                  border: isFilled
                    ? `2px solid ${highlightColor}`
                    : `2px dashed ${C.borderBright}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: MONO,
                  fontSize: 32,
                  fontWeight: 900,
                  color: isFilled ? (isLatest ? "#FFFFFF" : highlightColor) : "transparent",
                  boxShadow: isLatest ? `0 0 20px ${highlightColor}88` : "none",
                  transform: isLatest ? "scale(1.08)" : "scale(1)",
                  transition: "all 0.15s ease-out",
                }}
              >
                {val || ""}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Reusable Two-Column State & Tip Row
  const renderStateTipRow = (
    leftHeader: string,
    leftBody: string,
    leftBadge: string,
    tipIcon: string,
    tipTitle: string,
    tipDesc: string,
    badgeColor: string = C.cyan
  ) => (
    <div
      style={{
        width: 960,
        display: "grid",
        gridTemplateColumns: "380px 1fr",
        gap: 16,
        marginTop: 16,
      }}
    >
      {/* Call Stack / Queue Card */}
      <div
        style={{
          backgroundColor: C.surfaceCard,
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: FONT }}>
            {leftHeader}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color: badgeColor }}>
            {leftBadge}
          </span>
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 20,
            fontWeight: 700,
            color: C.text,
            padding: "8px 12px",
            borderRadius: 10,
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          {leftBody}
        </div>
      </div>

      {/* Tip / Explanation Card */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(17, 26, 44, 0.95) 0%, rgba(20, 32, 54, 0.95) 100%)",
          border: `1px solid ${C.border}`,
          borderRadius: 20,
          padding: "16px 22px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span style={{ fontSize: 36, flexShrink: 0 }}>{tipIcon}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontSize: 19, fontWeight: 800, color: C.text, fontFamily: FONT }}>
            {tipTitle}
          </span>
          <span style={{ fontSize: 16, color: C.muted, lineHeight: 1.35, fontFamily: FONT }}>
            {tipDesc}
          </span>
        </div>
      </div>
    </div>
  );

  // --------------------------------------------------------------------------
  // SCENE 1: HOOK — LINEAR LIST ➔ BRANCHING TREE ➔ DIRECTORY TREE
  // --------------------------------------------------------------------------
  if (variant === "linear_vs_tree") {
    let phase = 1;
    let activeIdx = Math.min(Math.floor((progress / 0.35) * 5), 4);
    let bannerTitle = "1. LINEAR MEMORY ARRAY";
    let bannerSub = "Reading a straight 1D list from index 0 to 4 is trivial.";

    if (progress >= 0.35 && progress < 0.68) {
      phase = 2;
      bannerTitle = "2. BRANCHING NATURE OF A TREE";
      bannerSub = "When paths fork, a computer cannot simply move straight forward!";
    } else if (progress >= 0.68) {
      phase = 3;
      bannerTitle = "3. COMPUTER FOLDER HIERARCHY";
      bannerSub = "Real folders & files branch out. How do you visit every node without loops?";
    }

    const linearItems = ["10", "25", "42", "68", "99"];

    return (
      <AbsoluteFill
        style={{
          backgroundColor: C.bg,
          padding: "50px 60px 360px",
          alignItems: "center",
          fontFamily: FONT,
          color: C.text,
        }}
      >
        {renderTopBar("01 / 08")}

        {/* Hero Title Section */}
        <div style={{ width: 960, marginBottom: 24, textAlign: "left" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 20px",
              borderRadius: 999,
              backgroundColor: "rgba(139, 92, 246, 0.15)",
              border: `1px solid rgba(139, 92, 246, 0.4)`,
              color: "#C084FC",
              fontFamily: MONO,
              fontSize: 18,
              fontWeight: 800,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#C084FC" }} />
            Core Data Structures
          </div>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-1.5px",
              background: "linear-gradient(135deg, #FFFFFF 20%, #E2E8F0 60%, #06B6D4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Why Not Just Read In A Line?
          </h1>
        </div>

        {/* Master Stage (960 x 760) */}
        <div
          style={{
            width: 960,
            height: 760,
            borderRadius: 32,
            backgroundColor: "rgba(14, 22, 38, 0.75)",
            border: `1px solid ${C.border}`,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {phase === 1 && (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontFamily: MONO, fontSize: 24, color: C.cyan, marginBottom: 44, fontWeight: 800 }}>
                // 1D LINEAR ARRAY: [10, 25, 42, 68, 99]
              </div>
              <div style={{ display: "flex", gap: 18 }}>
                {linearItems.map((val, idx) => {
                  const isActive = idx === activeIdx;
                  const isDone = idx < activeIdx;
                  return (
                    <div
                      key={idx}
                      style={{
                        width: 130,
                        height: 160,
                        borderRadius: 22,
                        backgroundColor: isActive
                          ? "rgba(6, 182, 212, 0.25)"
                          : isDone
                          ? "rgba(16, 185, 129, 0.18)"
                          : "rgba(30, 41, 59, 0.5)",
                        border: isActive
                          ? `3px solid ${C.cyan}`
                          : isDone
                          ? `2px solid ${C.emerald}`
                          : `2px dashed ${C.borderBright}`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        transform: isActive ? "scale(1.12)" : "scale(1)",
                        boxShadow: isActive ? "0 0 35px rgba(6, 182, 212, 0.6)" : "none",
                        transition: "all 0.15s ease-out",
                      }}
                    >
                      <span style={{ position: "absolute", top: 12, fontFamily: MONO, fontSize: 16, color: C.muted }}>
                        INDEX [{idx}]
                      </span>
                      <span
                        style={{
                          fontSize: 48,
                          fontWeight: 900,
                          fontFamily: MONO,
                          color: isActive ? C.cyan : isDone ? C.emerald : C.text,
                        }}
                      >
                        {val}
                      </span>
                      {isActive && (
                        <span
                          style={{
                            position: "absolute",
                            bottom: -36,
                            fontFamily: MONO,
                            fontSize: 18,
                            fontWeight: 800,
                            color: C.cyan,
                          }}
                        >
                          ▲ SCAN
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  marginTop: 70,
                  padding: "14px 28px",
                  borderRadius: 16,
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  border: `1px solid ${C.emerald}`,
                  color: C.emerald,
                  fontFamily: MONO,
                  fontSize: 22,
                  fontWeight: 800,
                }}
              >
                ✔ 1D LINEAR SCAN: SIMPLE AND PREDICTABLE
              </div>
            </div>
          )}

          {phase === 2 && (
            <div style={{ width: "100%", height: "100%", position: "relative" }}>
              <div style={{ fontFamily: MONO, fontSize: 24, color: C.amber, textAlign: "center", marginBottom: 20, fontWeight: 800 }}>
                // WHEN DATA SPLITS LIKE TREE BRANCHES:
              </div>
              <svg viewBox="0 0 960 560" style={{ width: "100%", height: "80%" }}>
                {/* Branches */}
                <line x1="480" y1="100" x2="260" y2="280" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                <line x1="480" y1="100" x2="700" y2="280" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                <line x1="260" y1="280" x2="160" y2="460" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                <line x1="260" y1="280" x2="360" y2="460" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                <line x1="700" y1="280" x2="600" y2="460" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
                <line x1="700" y1="280" x2="800" y2="460" stroke="#334155" strokeWidth="6" strokeLinecap="round" />

                {/* Nodes */}
                <g transform="translate(480, 100)">
                  <circle r="46" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="4" />
                  <text fontFamily={MONO} fontSize="32" fontWeight="900" fill="#080D1A" textAnchor="middle" dominantBaseline="central">
                    1
                  </text>
                </g>
                <g transform="translate(260, 280)">
                  <circle r="42" fill="#06B6D4" stroke="#FFFFFF" strokeWidth="3" />
                  <text fontFamily={MONO} fontSize="28" fontWeight="800" fill="#080D1A" textAnchor="middle" dominantBaseline="central">
                    2
                  </text>
                </g>
                <g transform="translate(700, 280)">
                  <circle r="42" fill="#F43F5E" stroke="#FFFFFF" strokeWidth="3" />
                  <text fontFamily={MONO} fontSize="28" fontWeight="800" fill="#080D1A" textAnchor="middle" dominantBaseline="central">
                    3
                  </text>
                </g>
              </svg>
              <div style={{ display: "flex", justifyContent: "space-around", marginTop: -20 }}>
                <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 800, color: C.cyan }}>
                  👈 LEFT FORK?
                </span>
                <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 800, color: C.rose }}>
                  👉 RIGHT FORK?
                </span>
              </div>
            </div>
          )}

          {phase === 3 && (
            <div style={{ width: "100%", maxWidth: 780 }}>
              <div style={{ fontFamily: MONO, fontSize: 24, color: C.cyan, marginBottom: 24, fontWeight: 800 }}>
                // REAL WORLD: COMPUTER FILE DIRECTORY
              </div>
              <div
                style={{
                  backgroundColor: "rgba(10, 16, 28, 0.95)",
                  borderRadius: 24,
                  border: `1px solid ${C.borderBright}`,
                  padding: "28px 36px",
                  fontFamily: MONO,
                  fontSize: 26,
                  lineHeight: 1.8,
                }}
              >
                <div style={{ color: C.amber, fontWeight: 800 }}>📁 /root (Anchor Directory)</div>
                <div style={{ paddingLeft: 36, color: C.cyan }}>
                  ├── 📁 documents/ (Left Child)
                </div>
                <div style={{ paddingLeft: 76, color: C.muted }}>├── 📄 resume.pdf</div>
                <div style={{ paddingLeft: 76, color: C.muted }}>└── 📄 notes.txt</div>
                <div style={{ paddingLeft: 36, color: C.rose }}>
                  └── 📁 projects/ (Right Child)
                </div>
                <div style={{ paddingLeft: 76, color: C.muted }}>├── 📁 app_code/</div>
                <div style={{ paddingLeft: 76, color: C.muted }}>└── 📄 readme.md</div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Banner */}
        <div
          style={{
            width: 960,
            marginTop: 20,
            padding: "16px 24px",
            borderRadius: 18,
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            border: `1px solid ${C.border}`,
            textAlign: "center",
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: C.text }}>
            {bannerSub}
          </span>
        </div>
      </AbsoluteFill>
    );
  }

  // --------------------------------------------------------------------------
  // SCENE 2: TREE ANATOMY (ROOT, BAAYAN BACHHA, DAAYAN BACHHA)
  // --------------------------------------------------------------------------
  if (variant === "tree_anatomy") {
    let activePart: "root" | "left" | "right" = "root";
    let pillText = "👑 ROOT NODE (THE ANCHOR)";
    let pillColor = C.amber;

    if (progress >= 0.35 && progress < 0.68) {
      activePart = "left";
      pillText = "👈 बायाँ बच्चा (LEFT CHILD SUBTREE)";
      pillColor = C.cyan;
    } else if (progress >= 0.68) {
      activePart = "right";
      pillText = "👉 दायाँ बच्चा (RIGHT CHILD SUBTREE)";
      pillColor = C.rose;
    }

    return (
      <AbsoluteFill
        style={{
          backgroundColor: C.bg,
          padding: "50px 60px 360px",
          alignItems: "center",
          fontFamily: FONT,
          color: C.text,
        }}
      >
        {renderTopBar("02 / 08")}

        {/* Traversal Banner */}
        <div style={{ width: 960, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 20px",
                borderRadius: 100,
                backgroundColor: `${pillColor}22`,
                border: `1px solid ${pillColor}`,
                color: pillColor,
                fontFamily: MONO,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              {pillText}
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                backgroundColor: "rgba(17, 26, 44, 0.95)",
                border: `1px solid ${C.borderBright}`,
                borderRadius: 16,
                padding: "6px 16px",
                fontFamily: MONO,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              <span style={{ color: activePart === "root" ? C.amber : C.muted }}>ROOT</span>
              <span style={{ color: C.muted }}>•</span>
              <span style={{ color: activePart === "left" ? C.cyan : C.muted }}>LEFT</span>
              <span style={{ color: C.muted }}>•</span>
              <span style={{ color: activePart === "right" ? C.rose : C.muted }}>RIGHT</span>
            </div>
          </div>
          <div style={{ fontSize: 50, fontWeight: 800, letterSpacing: "-1px" }}>
            The 3-Piece Anatomy
          </div>
        </div>

        {/* Master 960x720 Tree Canvas */}
        <div
          style={{
            width: 960,
            height: 720,
            borderRadius: 32,
            backgroundColor: "rgba(14, 22, 38, 0.75)",
            border: `1px solid ${C.border}`,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            position: "relative",
          }}
        >
          <svg viewBox="0 0 960 720" style={{ width: "100%", height: "100%" }}>
            <defs>
              <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="14" floodColor="#F59E0B" floodOpacity="0.9" />
              </filter>
              <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="14" floodColor="#06B6D4" floodOpacity="0.9" />
              </filter>
              <filter id="glow-rose" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="14" floodColor="#F43F5E" floodOpacity="0.9" />
              </filter>
            </defs>

            {/* Tree Edges */}
            <line x1="480" y1="120" x2="250" y2="310" stroke={activePart === "left" ? C.cyan : "#334155"} strokeWidth={activePart === "left" ? 8 : 5} strokeLinecap="round" />
            <line x1="480" y1="120" x2="710" y2="310" stroke={activePart === "right" ? C.rose : "#334155"} strokeWidth={activePart === "right" ? 8 : 5} strokeLinecap="round" />
            <line x1="250" y1="310" x2="140" y2="520" stroke={activePart === "left" ? C.cyan : "#334155"} strokeWidth={activePart === "left" ? 6 : 5} strokeLinecap="round" />
            <line x1="250" y1="310" x2="360" y2="520" stroke={activePart === "left" ? C.cyan : "#334155"} strokeWidth={activePart === "left" ? 6 : 5} strokeLinecap="round" />
            <line x1="710" y1="310" x2="600" y2="520" stroke={activePart === "right" ? C.rose : "#334155"} strokeWidth={activePart === "right" ? 6 : 5} strokeLinecap="round" />
            <line x1="710" y1="310" x2="820" y2="520" stroke={activePart === "right" ? C.rose : "#334155"} strokeWidth={activePart === "right" ? 6 : 5} strokeLinecap="round" />

            {/* Tree Nodes */}
            {TREE_NODES.map((node) => {
              const isRoot = node.id === "1";
              const isLeft = node.id === "2" || node.id === "4" || node.id === "5";
              const isRight = node.id === "3" || node.id === "6" || node.id === "7";

              let fill = "#111A2C";
              let stroke = "#334155";
              let textColor = C.text;
              let filter = "none";

              if (activePart === "root" && isRoot) {
                fill = C.amber;
                stroke = "#FFFFFF";
                textColor = "#080D1A";
                filter = "url(#glow-amber)";
              } else if (activePart === "left" && isLeft) {
                fill = C.cyan;
                stroke = "#FFFFFF";
                textColor = "#080D1A";
                filter = "url(#glow-cyan)";
              } else if (activePart === "right" && isRight) {
                fill = C.rose;
                stroke = "#FFFFFF";
                textColor = "#080D1A";
                filter = "url(#glow-rose)";
              }

              return (
                <g key={node.id} transform={`translate(${node.cx}, ${node.cy})`}>
                  <circle r="50" fill={fill} stroke={stroke} strokeWidth="4" filter={filter} />
                  <text fontFamily={MONO} fontSize="36" fontWeight="800" fill={textColor} textAnchor="middle" dominantBaseline="central">
                    {node.val}
                  </text>
                </g>
              );
            })}

            {/* Animated Directional Arrows */}
            {activePart === "left" && (
              <g transform="translate(140, 240)">
                <rect x="-10" y="-30" width="220" height="48" rx="12" fill="rgba(6, 182, 212, 0.25)" stroke={C.cyan} strokeWidth="2" />
                <text x="100" y="-6" fontFamily={MONO} fontSize="20" fontWeight="900" fill={C.cyan} textAnchor="middle">
                  👈 BAAYAN BACHHA
                </text>
              </g>
            )}

            {activePart === "right" && (
              <g transform="translate(630, 240)">
                <rect x="-10" y="-30" width="220" height="48" rx="12" fill="rgba(244, 63, 94, 0.25)" stroke={C.rose} strokeWidth="2" />
                <text x="100" y="-6" fontFamily={MONO} fontSize="20" fontWeight="900" fill={C.rose} textAnchor="middle">
                  👉 DAAYAN BACHHA
                </text>
              </g>
            )}
          </svg>
        </div>

        {renderStateTipRow(
          "ANATOMY BREAKDOWN",
          activePart === "root" ? "Anchor: Node [1]" : activePart === "left" ? "Left Subtree: [2, 4, 5]" : "Right Subtree: [3, 6, 7]",
          "TREE BASE",
          "🎯",
          "Every Traversal Uses This Formula",
          "The combination of visiting Root, Left, and Right creates all 4 fundamental traversals."
        )}
      </AbsoluteFill>
    );
  }

  // --------------------------------------------------------------------------
  // SCENE 3: PREORDER (ROOT ➔ LEFT ➔ RIGHT)
  // --------------------------------------------------------------------------
  if (variant === "preorder") {
    const preorderSteps = [
      { id: "1", action: "Visit Root: 1 [Note Down]", val: "1" },
      { id: "2", action: "Enter Left Door: Node 2", val: "2" },
      { id: "4", action: "Enter Left Door: Leaf 4", val: "4" },
      { id: "5", action: "Enter Right Door: Leaf 5", val: "5" },
      { id: "3", action: "Enter Right Subtree: Node 3", val: "3" },
      { id: "6", action: "Enter Left Door: Leaf 6", val: "6" },
      { id: "7", action: "Enter Right Door: Leaf 7", val: "7" },
    ];

    const stepIdx = Math.min(Math.floor(progress * preorderSteps.length), preorderSteps.length - 1);
    const activeStep = preorderSteps[stepIdx];
    const visitedVals = preorderSteps.slice(0, stepIdx + 1).map((s) => s.val);
    const activeCoord = TREE_NODES.find((n) => n.id === activeStep.id) || TREE_NODES[0];

    return (
      <AbsoluteFill
        style={{
          backgroundColor: C.bg,
          padding: "50px 60px 360px",
          alignItems: "center",
          fontFamily: FONT,
          color: C.text,
        }}
      >
        {renderTopBar("03 / 08")}

        {/* Traversal Banner */}
        <div style={{ width: 960, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 20px",
                borderRadius: 100,
                backgroundColor: "rgba(139, 92, 246, 0.15)",
                border: "1px solid rgba(139, 92, 246, 0.4)",
                color: "#C084FC",
                fontFamily: MONO,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              DEPTH-FIRST SEARCH (DFS)
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                backgroundColor: "rgba(17, 26, 44, 0.95)",
                border: `1px solid ${C.borderBright}`,
                borderRadius: 16,
                padding: "8px 18px",
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, padding: "4px 12px", borderRadius: 8, backgroundColor: "rgba(139, 92, 246, 0.3)", color: "#E9D5FF", border: `1px solid ${C.purple}` }}>
                ROOT
              </div>
              <span style={{ color: C.muted }}>➔</span>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, padding: "4px 12px", borderRadius: 8, backgroundColor: "rgba(255, 255, 255, 0.06)", color: C.muted }}>
                LEFT
              </div>
              <span style={{ color: C.muted }}>➔</span>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, padding: "4px 12px", borderRadius: 8, backgroundColor: "rgba(255, 255, 255, 0.06)", color: C.muted }}>
                RIGHT
              </div>
            </div>
          </div>
          <div style={{ fontSize: 50, fontWeight: 800, letterSpacing: "-1px", color: "#C084FC" }}>
            1. Preorder Traversal
          </div>
        </div>

        {/* Tree Canvas */}
        <div
          style={{
            width: 960,
            height: 720,
            borderRadius: 32,
            backgroundColor: "rgba(14, 22, 38, 0.75)",
            border: `1px solid ${C.border}`,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            position: "relative",
          }}
        >
          <svg viewBox="0 0 960 720" style={{ width: "100%", height: "100%" }}>
            <defs>
              <filter id="halo-amber" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="16" floodColor="#F59E0B" floodOpacity="1" />
              </filter>
            </defs>

            {/* Tree Edges */}
            <line x1="480" y1="120" x2="250" y2="310" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="480" y1="120" x2="710" y2="310" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="250" y1="310" x2="140" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="250" y1="310" x2="360" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="710" y1="310" x2="600" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="710" y1="310" x2="820" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />

            {/* Nodes */}
            {TREE_NODES.map((node) => {
              const isVisited = visitedVals.includes(node.val);
              const isCurrent = node.id === activeStep.id;

              return (
                <g key={node.id} transform={`translate(${node.cx}, ${node.cy})`}>
                  <circle
                    r="50"
                    fill={isVisited ? "rgba(139, 92, 246, 0.35)" : "#111A2C"}
                    stroke={isCurrent ? "#F59E0B" : isVisited ? C.purple : "#334155"}
                    strokeWidth={isCurrent ? 6 : 4}
                    filter={isCurrent ? "url(#halo-amber)" : "none"}
                  />
                  <text fontFamily={MONO} fontSize="36" fontWeight="800" fill={C.text} textAnchor="middle" dominantBaseline="central">
                    {node.val}
                  </text>
                  {isCurrent && (
                    <circle r="60" fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="6,6" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {renderStateTipRow(
          "CALL STACK (LIFO)",
          activeStep.action,
          "DFS PREORDER",
          "🚪",
          "Room & Doors Metaphor",
          "Note the room immediately upon entry, then explore its left and right doors."
        )}

        {renderOutputSlots(visitedVals, "#C084FC")}

        {/* Code Footer */}
        <div
          style={{
            width: 960,
            backgroundColor: "rgba(10, 16, 28, 0.95)",
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: MONO,
            fontSize: 18,
            fontWeight: 700,
            marginTop: 14,
          }}
        >
          <span style={{ color: C.muted, textTransform: "uppercase", fontSize: 15 }}>PATTERN</span>
          <span>
            <span style={{ color: "#C084FC" }}>visit(node);</span> ➔{" "}
            <span style={{ color: C.text }}>preorder(node.left);</span> ➔{" "}
            <span style={{ color: C.text }}>preorder(node.right);</span>
          </span>
        </div>
      </AbsoluteFill>
    );
  }

  // --------------------------------------------------------------------------
  // SCENE 4: INORDER (LEFT ➔ ROOT ➔ RIGHT)
  // --------------------------------------------------------------------------
  if (variant === "inorder") {
    // BST Nodes: 4 root, 2 left (1,3), 6 right (5,7)
    // Inorder visits: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 (Sorted!)
    const inorderSteps = [
      { id: "1", action: "Visit Leftmost Leaf: 1", val: "1" },
      { id: "2", action: "Climb to Parent: 2", val: "2" },
      { id: "3", action: "Visit Right Child: 3", val: "3" },
      { id: "4", action: "Climb to Root: 4", val: "4" },
      { id: "5", action: "Visit Right Left Leaf: 5", val: "5" },
      { id: "6", action: "Climb to Parent: 6", val: "6" },
      { id: "7", action: "Visit Right Leaf: 7", val: "7" },
    ];

    const stepIdx = Math.min(Math.floor(progress * inorderSteps.length), inorderSteps.length - 1);
    const activeStep = inorderSteps[stepIdx];
    const visitedVals = inorderSteps.slice(0, stepIdx + 1).map((s) => s.val);

    return (
      <AbsoluteFill
        style={{
          backgroundColor: C.bg,
          padding: "50px 60px 360px",
          alignItems: "center",
          fontFamily: FONT,
          color: C.text,
        }}
      >
        {renderTopBar("04 / 08")}

        {/* Traversal Banner */}
        <div style={{ width: 960, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 20px",
                borderRadius: 100,
                backgroundColor: "rgba(6, 182, 212, 0.15)",
                border: "1px solid rgba(6, 182, 212, 0.4)",
                color: C.cyan,
                fontFamily: MONO,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              DEPTH-FIRST SEARCH (DFS)
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                backgroundColor: "rgba(17, 26, 44, 0.95)",
                border: `1px solid ${C.borderBright}`,
                borderRadius: 16,
                padding: "8px 18px",
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, padding: "4px 12px", borderRadius: 8, backgroundColor: "rgba(255, 255, 255, 0.06)", color: C.muted }}>
                LEFT
              </div>
              <span style={{ color: C.muted }}>➔</span>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, padding: "4px 12px", borderRadius: 8, backgroundColor: "rgba(6, 182, 212, 0.3)", color: "#E0F2FE", border: `1px solid ${C.cyan}` }}>
                ROOT
              </div>
              <span style={{ color: C.muted }}>➔</span>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, padding: "4px 12px", borderRadius: 8, backgroundColor: "rgba(255, 255, 255, 0.06)", color: C.muted }}>
                RIGHT
              </div>
            </div>
          </div>
          <div style={{ fontSize: 50, fontWeight: 800, letterSpacing: "-1px", color: C.cyan }}>
            2. Inorder Traversal
          </div>
        </div>

        {/* Tree Canvas */}
        <div
          style={{
            width: 960,
            height: 720,
            borderRadius: 32,
            backgroundColor: "rgba(14, 22, 38, 0.75)",
            border: `1px solid ${C.border}`,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            position: "relative",
          }}
        >
          <svg viewBox="0 0 960 720" style={{ width: "100%", height: "100%" }}>
            <defs>
              <filter id="halo-amber-inorder" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="16" floodColor="#F59E0B" floodOpacity="1" />
              </filter>
            </defs>

            {/* Tree Edges */}
            <line x1="480" y1="120" x2="250" y2="310" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="480" y1="120" x2="710" y2="310" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="250" y1="310" x2="140" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="250" y1="310" x2="360" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="710" y1="310" x2="600" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="710" y1="310" x2="820" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />

            {/* Nodes */}
            {BST_NODES.map((node) => {
              const isVisited = visitedVals.includes(node.val);
              const isCurrent = node.id === activeStep.id;

              return (
                <g key={node.id} transform={`translate(${node.cx}, ${node.cy})`}>
                  <circle
                    r="50"
                    fill={isVisited ? "rgba(6, 182, 212, 0.35)" : "#111A2C"}
                    stroke={isCurrent ? "#F59E0B" : isVisited ? C.cyan : "#334155"}
                    strokeWidth={isCurrent ? 6 : 4}
                    filter={isCurrent ? "url(#halo-amber-inorder)" : "none"}
                  />
                  <text fontFamily={MONO} fontSize="36" fontWeight="800" fill={C.text} textAnchor="middle" dominantBaseline="central">
                    {node.val}
                  </text>
                  {isCurrent && (
                    <circle r="60" fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="6,6" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {renderStateTipRow(
          "CALL STACK (LIFO)",
          activeStep.action,
          "DFS INORDER",
          "🎯",
          "Root 'In-Between' Left & Right",
          "On a Binary Search Tree (BST), Inorder traversal outputs numbers in strictly sorted order!"
        )}

        {renderOutputSlots(visitedVals, C.cyan)}

        {/* Code Footer */}
        <div
          style={{
            width: 960,
            backgroundColor: "rgba(10, 16, 28, 0.95)",
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: MONO,
            fontSize: 18,
            fontWeight: 700,
            marginTop: 14,
          }}
        >
          <span style={{ color: C.muted, textTransform: "uppercase", fontSize: 15 }}>PATTERN</span>
          <span>
            <span style={{ color: C.text }}>inorder(node.left);</span> ➔{" "}
            <span style={{ color: C.cyan }}>visit(node);</span> ➔{" "}
            <span style={{ color: C.text }}>inorder(node.right);</span>
          </span>
        </div>
      </AbsoluteFill>
    );
  }

  // --------------------------------------------------------------------------
  // SCENE 5: POSTORDER (LEFT ➔ RIGHT ➔ ROOT)
  // --------------------------------------------------------------------------
  if (variant === "postorder") {
    // Postorder visits: 4 -> 5 -> 2 -> 6 -> 7 -> 3 -> 1
    const postorderSteps = [
      { id: "4", action: "Visit Left Leaf: 4", val: "4" },
      { id: "5", action: "Visit Right Leaf: 5", val: "5" },
      { id: "2", action: "Delete / Process Parent: 2", val: "2" },
      { id: "6", action: "Visit Left Leaf: 6", val: "6" },
      { id: "7", action: "Visit Right Leaf: 7", val: "7" },
      { id: "3", action: "Delete / Process Parent: 3", val: "3" },
      { id: "1", action: "Root Node [1] Processed LAST", val: "1" },
    ];

    const stepIdx = Math.min(Math.floor(progress * postorderSteps.length), postorderSteps.length - 1);
    const activeStep = postorderSteps[stepIdx];
    const visitedVals = postorderSteps.slice(0, stepIdx + 1).map((s) => s.val);

    return (
      <AbsoluteFill
        style={{
          backgroundColor: C.bg,
          padding: "50px 60px 360px",
          alignItems: "center",
          fontFamily: FONT,
          color: C.text,
        }}
      >
        {renderTopBar("05 / 08")}

        {/* Traversal Banner */}
        <div style={{ width: 960, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 20px",
                borderRadius: 100,
                backgroundColor: "rgba(244, 63, 94, 0.15)",
                border: "1px solid rgba(244, 63, 94, 0.4)",
                color: C.rose,
                fontFamily: MONO,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              DEPTH-FIRST SEARCH (DFS)
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                backgroundColor: "rgba(17, 26, 44, 0.95)",
                border: `1px solid ${C.borderBright}`,
                borderRadius: 16,
                padding: "8px 18px",
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, padding: "4px 12px", borderRadius: 8, backgroundColor: "rgba(255, 255, 255, 0.06)", color: C.muted }}>
                LEFT
              </div>
              <span style={{ color: C.muted }}>➔</span>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, padding: "4px 12px", borderRadius: 8, backgroundColor: "rgba(255, 255, 255, 0.06)", color: C.muted }}>
                RIGHT
              </div>
              <span style={{ color: C.muted }}>➔</span>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, padding: "4px 12px", borderRadius: 8, backgroundColor: "rgba(244, 63, 94, 0.3)", color: "#FFE4E6", border: `1px solid ${C.rose}` }}>
                ROOT
              </div>
            </div>
          </div>
          <div style={{ fontSize: 50, fontWeight: 800, letterSpacing: "-1px", color: C.rose }}>
            3. Postorder Traversal
          </div>
        </div>

        {/* Tree Canvas */}
        <div
          style={{
            width: 960,
            height: 720,
            borderRadius: 32,
            backgroundColor: "rgba(14, 22, 38, 0.75)",
            border: `1px solid ${C.border}`,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            position: "relative",
          }}
        >
          <svg viewBox="0 0 960 720" style={{ width: "100%", height: "100%" }}>
            <defs>
              <filter id="halo-amber-postorder" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="16" floodColor="#F59E0B" floodOpacity="1" />
              </filter>
            </defs>

            {/* Tree Edges */}
            <line x1="480" y1="120" x2="250" y2="310" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="480" y1="120" x2="710" y2="310" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="250" y1="310" x2="140" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="250" y1="310" x2="360" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="710" y1="310" x2="600" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="710" y1="310" x2="820" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />

            {/* Nodes */}
            {TREE_NODES.map((node) => {
              const isVisited = visitedVals.includes(node.val);
              const isCurrent = node.id === activeStep.id;

              return (
                <g key={node.id} transform={`translate(${node.cx}, ${node.cy})`}>
                  <circle
                    r="50"
                    fill={isVisited ? "rgba(244, 63, 94, 0.35)" : "#111A2C"}
                    stroke={isCurrent ? "#F59E0B" : isVisited ? C.rose : "#334155"}
                    strokeWidth={isCurrent ? 6 : 4}
                    filter={isCurrent ? "url(#halo-amber-postorder)" : "none"}
                  />
                  <text fontFamily={MONO} fontSize="36" fontWeight="800" fill={C.text} textAnchor="middle" dominantBaseline="central">
                    {node.val}
                  </text>
                  {isCurrent && (
                    <circle r="60" fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="6,6" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {renderStateTipRow(
          "CALL STACK (LIFO)",
          activeStep.action,
          "DFS POSTORDER",
          "🗑️",
          "Safely Delete Children Before Parent",
          "Crucial for bottom-up cleanup, syntax tree evaluation, and preventing memory leaks."
        )}

        {renderOutputSlots(visitedVals, C.rose)}

        {/* Code Footer */}
        <div
          style={{
            width: 960,
            backgroundColor: "rgba(10, 16, 28, 0.95)",
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: MONO,
            fontSize: 18,
            fontWeight: 700,
            marginTop: 14,
          }}
        >
          <span style={{ color: C.muted, textTransform: "uppercase", fontSize: 15 }}>PATTERN</span>
          <span>
            <span style={{ color: C.text }}>postorder(node.left);</span> ➔{" "}
            <span style={{ color: C.text }}>postorder(node.right);</span> ➔{" "}
            <span style={{ color: C.rose }}>visit(node);</span>
          </span>
        </div>
      </AbsoluteFill>
    );
  }

  // --------------------------------------------------------------------------
  // SCENE 6: LEVEL-ORDER (QUEUE BFS)
  // --------------------------------------------------------------------------
  if (variant === "level_order") {
    // Level 0: [1]
    // Level 1: [2, 3]
    // Level 2: [4, 5, 6, 7]
    const levelSteps = [
      { id: "1", action: "Dequeue(1) [Root Level 0]", val: "1", level: 0 },
      { id: "2", action: "Dequeue(2) [Level 1]", val: "2", level: 1 },
      { id: "3", action: "Dequeue(3) [Level 1]", val: "3", level: 1 },
      { id: "4", action: "Dequeue(4) [Level 2 Leaf]", val: "4", level: 2 },
      { id: "5", action: "Dequeue(5) [Level 2 Leaf]", val: "5", level: 2 },
      { id: "6", action: "Dequeue(6) [Level 2 Leaf]", val: "6", level: 2 },
      { id: "7", action: "Dequeue(7) [Level 2 Leaf]", val: "7", level: 2 },
    ];

    const stepIdx = Math.min(Math.floor(progress * levelSteps.length), levelSteps.length - 1);
    const activeStep = levelSteps[stepIdx];
    const visitedVals = levelSteps.slice(0, stepIdx + 1).map((s) => s.val);

    return (
      <AbsoluteFill
        style={{
          backgroundColor: C.bg,
          padding: "50px 60px 360px",
          alignItems: "center",
          fontFamily: FONT,
          color: C.text,
        }}
      >
        {renderTopBar("06 / 08")}

        {/* Traversal Banner */}
        <div style={{ width: 960, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 20px",
                borderRadius: 100,
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                color: C.emerald,
                fontFamily: MONO,
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              BREADTH-FIRST SEARCH (BFS)
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                backgroundColor: "rgba(17, 26, 44, 0.95)",
                border: `1px solid ${C.borderBright}`,
                borderRadius: 16,
                padding: "8px 18px",
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, padding: "4px 12px", borderRadius: 8, backgroundColor: "rgba(16, 185, 129, 0.3)", color: "#D1FAE5", border: `1px solid ${C.emerald}` }}>
                QUEUE (FIFO)
              </div>
              <span style={{ color: C.muted }}>➔</span>
              <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, padding: "4px 12px", borderRadius: 8, backgroundColor: "rgba(255, 255, 255, 0.06)", color: C.muted }}>
                LAYER BY LAYER
              </div>
            </div>
          </div>
          <div style={{ fontSize: 50, fontWeight: 800, letterSpacing: "-1px", color: C.emerald }}>
            4. Level-Order Traversal
          </div>
        </div>

        {/* Tree Canvas with Floor Scanners */}
        <div
          style={{
            width: 960,
            height: 720,
            borderRadius: 32,
            backgroundColor: "rgba(14, 22, 38, 0.75)",
            border: `1px solid ${C.border}`,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            position: "relative",
          }}
        >
          {/* Level Horizontal Bands */}
          <div style={{ position: "absolute", left: 24, right: 24, top: 40, height: 160, borderRadius: 20, border: activeStep.level === 0 ? "2px solid #10B981" : "1px dashed rgba(255,255,255,0.1)", backgroundColor: activeStep.level === 0 ? "rgba(16, 185, 129, 0.08)" : "transparent", display: "flex", alignItems: "flex-start", padding: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: activeStep.level === 0 ? C.emerald : C.muted }}>LEVEL 0</span>
          </div>
          <div style={{ position: "absolute", left: 24, right: 24, top: 230, height: 160, borderRadius: 20, border: activeStep.level === 1 ? "2px solid #10B981" : "1px dashed rgba(255,255,255,0.1)", backgroundColor: activeStep.level === 1 ? "rgba(16, 185, 129, 0.08)" : "transparent", display: "flex", alignItems: "flex-start", padding: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: activeStep.level === 1 ? C.emerald : C.muted }}>LEVEL 1</span>
          </div>
          <div style={{ position: "absolute", left: 24, right: 24, top: 440, height: 160, borderRadius: 20, border: activeStep.level === 2 ? "2px solid #10B981" : "1px dashed rgba(255,255,255,0.1)", backgroundColor: activeStep.level === 2 ? "rgba(16, 185, 129, 0.08)" : "transparent", display: "flex", alignItems: "flex-start", padding: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: activeStep.level === 2 ? C.emerald : C.muted }}>LEVEL 2</span>
          </div>

          <svg viewBox="0 0 960 720" style={{ width: "100%", height: "100%" }}>
            <defs>
              <filter id="halo-amber-level" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="16" floodColor="#F59E0B" floodOpacity="1" />
              </filter>
            </defs>

            {/* Tree Edges */}
            <line x1="480" y1="120" x2="250" y2="310" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="480" y1="120" x2="710" y2="310" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="250" y1="310" x2="140" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="250" y1="310" x2="360" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="710" y1="310" x2="600" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
            <line x1="710" y1="310" x2="820" y2="520" stroke="#334155" strokeWidth="5" strokeLinecap="round" />

            {/* Nodes */}
            {TREE_NODES.map((node) => {
              const isVisited = visitedVals.includes(node.val);
              const isCurrent = node.id === activeStep.id;

              return (
                <g key={node.id} transform={`translate(${node.cx}, ${node.cy})`}>
                  <circle
                    r="50"
                    fill={isVisited ? "rgba(16, 185, 129, 0.35)" : "#111A2C"}
                    stroke={isCurrent ? "#F59E0B" : isVisited ? C.emerald : "#334155"}
                    strokeWidth={isCurrent ? 6 : 4}
                    filter={isCurrent ? "url(#halo-amber-level)" : "none"}
                  />
                  <text fontFamily={MONO} fontSize="36" fontWeight="800" fill={C.text} textAnchor="middle" dominantBaseline="central">
                    {node.val}
                  </text>
                  {isCurrent && (
                    <circle r="60" fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="6,6" />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {renderStateTipRow(
          "FIFO QUEUE",
          activeStep.action,
          "BFS LEVEL-ORDER",
          "🌊",
          "Breadth-First Exploration",
          "Visits all nodes at depth d before depth d+1. Essential for shortest path and social graphs!"
        )}

        {renderOutputSlots(visitedVals, C.emerald)}

        {/* Code Footer */}
        <div
          style={{
            width: 960,
            backgroundColor: "rgba(10, 16, 28, 0.95)",
            border: `1px solid ${C.border}`,
            borderRadius: 18,
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: MONO,
            fontSize: 18,
            fontWeight: 700,
            marginTop: 14,
          }}
        >
          <span style={{ color: C.muted, textTransform: "uppercase", fontSize: 15 }}>PATTERN</span>
          <span>
            <span style={{ color: C.text }}>q.push(root);</span> ➔{" "}
            <span style={{ color: C.emerald }}>visit(curr);</span> ➔{" "}
            <span style={{ color: C.text }}>q.push(left, right);</span>
          </span>
        </div>
      </AbsoluteFill>
    );
  }

  // --------------------------------------------------------------------------
  // SCENE 7: CHEAT SHEET (4-WAY MASTER MATRIX)
  // --------------------------------------------------------------------------
  const cheatItems = [
    {
      num: "1",
      name: "Preorder",
      order: "Root ➔ Left ➔ Right",
      type: "DFS",
      color: "#C084FC",
      desc: "Tree cloning, folder copying, serialization.",
      icon: "💾",
    },
    {
      num: "2",
      name: "Inorder",
      order: "Left ➔ Root ➔ Right",
      type: "DFS",
      color: C.cyan,
      desc: "Outputs sorted keys from Binary Search Trees.",
      icon: "🎯",
    },
    {
      num: "3",
      name: "Postorder",
      order: "Left ➔ Right ➔ Root",
      type: "DFS",
      color: C.rose,
      desc: "Bottom-up tree deletion, math expression solver.",
      icon: "🗑️",
    },
    {
      num: "4",
      name: "Level-Order",
      order: "Queue (FIFO) Level-by-Level",
      type: "BFS",
      color: C.emerald,
      desc: "Shortest path discovery, web crawler indexing.",
      icon: "🌊",
    },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        padding: "50px 60px 360px",
        alignItems: "center",
        fontFamily: FONT,
        color: C.text,
      }}
    >
      {renderTopBar("07 / 08")}

      {/* Header */}
      <div style={{ width: 960, marginBottom: 24, textAlign: "left" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 20px",
            borderRadius: 100,
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            border: `1px solid rgba(245, 158, 11, 0.4)`,
            color: C.amber,
            fontFamily: MONO,
            fontSize: 18,
            fontWeight: 800,
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Quick Reference Guide
        </div>
        <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: "-1.5px" }}>
          Which Traversal To Choose?
        </div>
      </div>

      {/* 4 Cards Matrix */}
      <div style={{ width: 960, display: "flex", flexDirection: "column", gap: 18 }}>
        {cheatItems.map((item, idx) => (
          <div
            key={item.num}
            style={{
              backgroundColor: C.surfaceCard,
              border: `1px solid ${item.color}55`,
              borderRadius: 24,
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: `0 8px 30px ${item.color}18`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: `${item.color}22`,
                  border: `1px solid ${item.color}`,
                  color: item.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: MONO,
                  fontSize: 26,
                  fontWeight: 900,
                }}
              >
                {item.num}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: C.text, fontFamily: FONT }}>
                    {item.name}
                  </span>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 14,
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: 8,
                      backgroundColor: `${item.color}22`,
                      color: item.color,
                    }}
                  >
                    {item.type}
                  </span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 20, color: item.color, marginTop: 4, fontWeight: 700 }}>
                  {item.order}
                </div>
              </div>
            </div>

            <div
              style={{
                maxWidth: 320,
                fontSize: 17,
                color: C.muted,
                fontFamily: FONT,
                textAlign: "right",
                lineHeight: 1.35,
              }}
            >
              {item.desc}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
