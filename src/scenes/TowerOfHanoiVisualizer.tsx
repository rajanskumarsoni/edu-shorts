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

interface DiskState {
  size: number;
  label: string;
  width: number;
  color: string;
  glow: string;
}

const DISKS_SPEC: Record<number, DiskState> = {
  1: { size: 1, label: "DISK 1", width: 150, color: "#00F0FF", glow: "rgba(0, 240, 255, 0.55)" },
  2: { size: 2, label: "DISK 2", width: 220, color: "#FFB800", glow: "rgba(255, 184, 0, 0.55)" },
  3: { size: 3, label: "DISK 3", width: 290, color: "#D946EF", glow: "rgba(217, 70, 239, 0.55)" },
  4: { size: 4, label: "DISK 4", width: 350, color: "#10B981", glow: "rgba(16, 185, 129, 0.55)" },
  5: { size: 5, label: "DISK 5", width: 410, color: "#3B82F6", glow: "rgba(59, 130, 246, 0.55)" },
};

export const TowerOfHanoiVisualizer: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();
  const isLandscape = L.landscape;

  const variant = scene.variant || "live_solve_3disk";
  const tag = scene.tag || "01 / TOWER OF HANOI";
  const title = scene.title || "THE RECURSIVE LEGEND";

  const progress = Math.min(Math.max(frame / Math.max(durationInFrames, 1), 0), 1);

  // Entrance spring
  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  // Base canvas layout measurements
  const pegXs = isLandscape ? [400, 960, 1520] : [220, 540, 860];
  const diskHeight = 38;

  // -------------------------------------------------------------
  // VARIANT 1: LEGEND HOOK (The 64 Disks & Cosmic Countdown)
  // -------------------------------------------------------------
  if (variant === "legend_hook") {
    const pulse = Math.sin(frame * 0.08) * 0.5 + 0.5;
    const goldGlow = `rgba(255, 196, 60, ${0.4 + pulse * 0.3})`;
    const numVisibleDisks = 14;

    const stageTop = isLandscape ? 180 : 440;
    const rodTop = stageTop + 90;
    const platformY = stageTop + 560;
    const rodHeight = platformY - rodTop;

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070A14",
          fontFamily: FONT,
          color: "#F5F7FF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: isLandscape ? 30 : 130,
          paddingBottom: isLandscape ? 30 : 360,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Subtle Cosmic Background Glow */}
        <div
          style={{
            position: "absolute",
            top: "28%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 900,
            height: 900,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255, 184, 0, 0.12) 0%, rgba(0, 240, 255, 0.05) 50%, transparent 70%)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        {/* Top Header */}
        <div style={{ textAlign: "center", zIndex: 10, maxWidth: 940, opacity: enterSpring }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(255, 184, 0, 0.14)",
              border: "1px solid rgba(255, 184, 0, 0.4)",
              color: "#FFB800",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "0.14em",
              padding: "8px 24px",
              borderRadius: 24,
              marginBottom: 14,
              textTransform: "uppercase",
            }}
          >
            {tag}
          </div>
          <h1
            style={{
              fontSize: isLandscape ? 44 : 58,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.12,
              margin: "0 0 10px 0",
              background: "linear-gradient(180deg, #FFFFFF 30%, #E2E8F0 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#94A3B8",
              margin: 0,
              letterSpacing: "0.04em",
            }}
          >
            ANCIENT TEMPLE LEGEND OF KASHI &amp; HANOI
          </p>
        </div>

        {/* Floating Needle Badges (Rendered ABOVE rods to prevent any disk overlap) */}
        <div
          style={{
            position: "absolute",
            top: stageTop + 20,
            left: 0,
            right: 0,
            zIndex: 15,
            pointerEvents: "none",
          }}
        >
          {[
            { label: "NEEDLE A", sub: "SOURCE TEMPLE", x: pegXs[0], color: "#FFB800" },
            { label: "NEEDLE B", sub: "TRANSIT PEG", x: pegXs[1], color: "#00F0FF" },
            { label: "NEEDLE C", sub: "PROPHECY TARGET", x: pegXs[2], color: "#FF5555" },
          ].map((rod, idx) => (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: rod.x,
                transform: "translateX(-50%)",
                background: "rgba(15, 23, 42, 0.88)",
                border: `1.5px solid ${rod.color}55`,
                borderRadius: 14,
                padding: "8px 16px",
                textAlign: "center",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                minWidth: 150,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 900, color: rod.color, letterSpacing: "0.06em" }}>
                {rod.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#94A3B8", marginTop: 2 }}>
                {rod.sub}
              </div>
            </div>
          ))}
        </div>

        {/* 3 Diamond Needles */}
        {pegXs.map((x, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: x,
              top: rodTop,
              transform: "translateX(-50%)",
              width: 14,
              height: rodHeight,
              background: idx === 0
                ? "linear-gradient(180deg, #FFE066 0%, #D97706 70%, #78350F 100%)"
                : "linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 40%, #475569 100%)",
              borderRadius: 7,
              boxShadow: idx === 0 ? "0 0 20px rgba(255, 184, 0, 0.5)" : "0 0 15px rgba(255, 255, 255, 0.3)",
              zIndex: 4,
            }}
          />
        ))}

        {/* Base Platform */}
        <div
          style={{
            position: "absolute",
            top: platformY,
            left: "50%",
            transform: "translateX(-50%)",
            width: isLandscape ? 880 : 920,
            height: 24,
            background: "linear-gradient(90deg, rgba(255, 184, 0, 0.3), rgba(255, 184, 0, 0.85), rgba(255, 184, 0, 0.3))",
            borderRadius: 12,
            boxShadow: "0 0 35px rgba(255, 184, 0, 0.45)",
            border: "1px solid rgba(255, 255, 255, 0.35)",
            zIndex: 6,
          }}
        />

        {/* The Stack of Golden Disks on Needle A */}
        <div
          style={{
            position: "absolute",
            left: pegXs[0],
            top: platformY,
            transform: "translate(-50%, -100%)",
            display: "flex",
            flexDirection: "column-reverse",
            alignItems: "center",
            zIndex: 8,
          }}
        >
          {Array.from({ length: numVisibleDisks }).map((_, i) => {
            const diskW = 320 - i * 15;
            const isTop = i === numVisibleDisks - 1;
            return (
              <div
                key={i}
                style={{
                  width: diskW,
                  height: 22,
                  marginBottom: 3,
                  borderRadius: 11,
                  background: isTop
                    ? "linear-gradient(90deg, #FFE066, #FFF3B0, #FFE066)"
                    : "linear-gradient(90deg, #B45309, #F59E0B, #D97706)",
                  boxShadow: isTop ? `0 0 20px ${goldGlow}` : "0 2px 8px rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255, 240, 180, 0.45)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#070A14",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Sacred Prophecy Card */}
        <div
          style={{
            position: "absolute",
            top: stageTop + 90,
            right: "6%",
            background: "rgba(15, 23, 42, 0.9)",
            border: "2px solid rgba(255, 85, 85, 0.5)",
            borderRadius: 18,
            padding: "18px 24px",
            boxShadow: "0 8px 32px rgba(255, 85, 85, 0.25)",
            maxWidth: 320,
            textAlign: "left",
            zIndex: 12,
          }}
        >
          <div style={{ color: "#FF5555", fontSize: 20, fontWeight: 900, letterSpacing: "0.1em", marginBottom: 6 }}>
            SACRED PROPHECY
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.2 }}>
            64 GOLDEN DISKS
          </div>
          <div style={{ fontSize: 20, color: "#CBD5E1", marginTop: 8, lineHeight: 1.35, fontWeight: 600 }}>
            When all 64 reach Needle C, the universe dissolves!
          </div>
        </div>

        {/* Bottom Callout Telemetry Banner */}
        <div
          style={{
            position: "absolute",
            top: platformY + 70,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255, 184, 0, 0.12)",
            border: "2px solid rgba(255, 184, 0, 0.4)",
            borderRadius: 20,
            padding: "16px 36px",
            display: "flex",
            alignItems: "center",
            gap: 20,
            zIndex: 10,
            boxShadow: "0 0 25px rgba(255, 184, 0, 0.2)",
            width: "88%",
            maxWidth: 900,
            boxSizing: "border-box",
          }}
        >
          <span style={{ fontSize: 40 }}>⏳</span>
          <div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#FFB800", letterSpacing: "0.04em" }}>
              RATE: 1 MOVE PER SECOND
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: "#E2E8F0", marginTop: 2 }}>
              How long will it actually take to solve?
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------
  // VARIANT 2: RULES DEMO (The 3 Sacred Constraints & Violation)
  // -------------------------------------------------------------
  if (variant === "rules_demo") {
    let activeRule = 1;
    let badgeText = "RULE 1: ONE DISK PER MOVE";
    let badgeDesc = "Move exactly ONE disk at a time. No bundle lifting!";
    let ruleColor = accent;
    let disk3Violating = false;
    let violationOffset = 0;

    if (progress < 0.36) {
      activeRule = 1;
      badgeText = "RULE 1: ONE DISK PER MOVE";
      badgeDesc = "Move exactly ONE disk at a time. No bundle lifting!";
      ruleColor = accent;
    } else if (progress < 0.68) {
      activeRule = 2;
      badgeText = "RULE 2: TOP DISK ONLY";
      badgeDesc = "Only the topmost disk on any peg can be lifted.";
      ruleColor = "#FFB800";
    } else {
      activeRule = 3;
      badgeText = "RULE 3: STRICT SIZE ORDER";
      badgeDesc = "Larger disk CANNOT be placed on top of a smaller disk!";
      ruleColor = "#FF5555";
      disk3Violating = true;
      violationOffset = Math.sin(frame * 0.4) * 8;
    }

    const stageTop = isLandscape ? 180 : 470;
    const rodTop = stageTop + 90;
    const platformY = stageTop + 540;
    const rodHeight = platformY - rodTop;

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070A14",
          fontFamily: FONT,
          color: "#F5F7FF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: isLandscape ? 30 : 130,
          paddingBottom: isLandscape ? 30 : 360,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <div style={{ textAlign: "center", zIndex: 10, maxWidth: 940, opacity: enterSpring }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(0, 240, 255, 0.14)",
              border: "1px solid rgba(0, 240, 255, 0.4)",
              color: accent,
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "0.14em",
              padding: "8px 24px",
              borderRadius: 24,
              marginBottom: 14,
              textTransform: "uppercase",
            }}
          >
            {tag}
          </div>
          <h1
            style={{
              fontSize: isLandscape ? 44 : 58,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.12,
              margin: "0 0 14px 0",
              color: "#FFFFFF",
            }}
          >
            {title}
          </h1>
        </div>

        {/* Active Rule Highlight Card */}
        <div
          style={{
            zIndex: 10,
            background: "rgba(15, 23, 42, 0.9)",
            border: `2px solid ${ruleColor}`,
            boxShadow: `0 0 30px ${ruleColor}44`,
            borderRadius: 20,
            padding: "16px 36px",
            textAlign: "center",
            maxWidth: 900,
            width: "88%",
            marginTop: 6,
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 900, color: ruleColor, letterSpacing: "0.06em" }}>
            {badgeText}
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: "#E2E8F0", marginTop: 6 }}>
            {badgeDesc}
          </div>
        </div>

        {/* Floating Peg Badges ABOVE Pegs */}
        <div
          style={{
            position: "absolute",
            top: stageTop + 20,
            left: 0,
            right: 0,
            zIndex: 15,
            pointerEvents: "none",
          }}
        >
          {[
            { label: "PEG A", role: "SOURCE", x: pegXs[0], color: "#00F0FF" },
            { label: "PEG B", role: "HELPER", x: pegXs[1], color: "#FFB800" },
            { label: "PEG C", role: "TARGET", x: pegXs[2], color: "#10B981" },
          ].map((peg, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: peg.x,
                transform: "translateX(-50%)",
                background: "rgba(15, 23, 42, 0.88)",
                border: `1.5px solid ${peg.color}55`,
                borderRadius: 14,
                padding: "8px 18px",
                textAlign: "center",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                minWidth: 140,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 900, color: peg.color, letterSpacing: "0.06em" }}>
                {peg.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#94A3B8", marginTop: 2 }}>
                {peg.role}
              </div>
            </div>
          ))}
        </div>

        {/* 3 Rods */}
        {pegXs.map((x, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: x,
              top: rodTop,
              transform: "translateX(-50%)",
              width: 14,
              height: rodHeight,
              background: "linear-gradient(180deg, #94A3B8, #475569)",
              borderRadius: 7,
              zIndex: 4,
            }}
          />
        ))}

        {/* Base Platform */}
        <div
          style={{
            position: "absolute",
            top: platformY,
            left: "50%",
            transform: "translateX(-50%)",
            width: isLandscape ? 880 : 920,
            height: 22,
            background: "linear-gradient(90deg, #1E293B, #334155, #1E293B)",
            borderRadius: 11,
            border: "1px solid rgba(255, 255, 255, 0.25)",
            boxShadow: "0 0 25px rgba(0, 240, 255, 0.15)",
            zIndex: 6,
          }}
        />

        {/* Disks Representation */}
        {!disk3Violating ? (
          <div
            style={{
              position: "absolute",
              left: pegXs[0],
              top: platformY,
              transform: "translate(-50%, -100%)",
              display: "flex",
              flexDirection: "column-reverse",
              alignItems: "center",
              zIndex: 8,
            }}
          >
            {[3, 2, 1].map((diskNum) => {
              const d = DISKS_SPEC[diskNum];
              const isLocked = activeRule === 2 && diskNum > 1;
              return (
                <div
                  key={diskNum}
                  style={{
                    width: d.width,
                    height: diskHeight,
                    marginBottom: 4,
                    borderRadius: 12,
                    background: isLocked
                      ? "linear-gradient(90deg, #475569, #334155)"
                      : d.color,
                    boxShadow: isLocked ? "none" : `0 0 15px ${d.glow}`,
                    border: isLocked ? "1px solid #64748B" : "2px solid #FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: isLocked ? "#94A3B8" : "#000000",
                    }}
                  >
                    {d.label}
                  </span>
                  {isLocked && <span style={{ fontSize: 16 }}>🔒</span>}
                  {activeRule === 2 && diskNum === 1 && <span style={{ fontSize: 16 }}>🔓 FREE</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {/* Disk 1 on Peg B */}
            <div
              style={{
                position: "absolute",
                left: pegXs[1],
                top: platformY,
                transform: "translate(-50%, -100%)",
                width: DISKS_SPEC[1].width,
                height: diskHeight,
                background: DISKS_SPEC[1].color,
                borderRadius: 12,
                border: "2px solid #FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 20px ${DISKS_SPEC[1].glow}`,
                zIndex: 8,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 900, color: "#000000" }}>DISK 1 (SMALL)</span>
            </div>

            {/* Disk 3 Violating Position */}
            <div
              style={{
                position: "absolute",
                left: pegXs[1] + violationOffset,
                top: platformY - diskHeight - 60,
                transform: "translate(-50%, -100%)",
                width: DISKS_SPEC[3].width,
                height: diskHeight,
                background: "linear-gradient(90deg, #EF4444, #DC2626)",
                borderRadius: 12,
                border: "3px solid #FCA5A5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 30px rgba(239, 68, 68, 0.8)",
                zIndex: 10,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 900, color: "#FFFFFF" }}>
                DISK 3 (LARGE) ⛔
              </span>
            </div>

            {/* Pulsing Red Laser Shield Barrier */}
            <div
              style={{
                position: "absolute",
                left: pegXs[1],
                top: platformY - diskHeight - 30,
                transform: "translate(-50%, -50%)",
                width: 320,
                height: 6,
                background: "#FF0033",
                boxShadow: "0 0 25px #FF0033, 0 0 50px #FF0033",
                borderRadius: 3,
                zIndex: 9,
              }}
            />

            {/* Red Error Callout Tag */}
            <div
              style={{
                position: "absolute",
                left: pegXs[1],
                top: platformY - diskHeight - 160,
                transform: "translateX(-50%)",
                background: "rgba(220, 38, 38, 0.95)",
                border: "2px solid #FEF2F2",
                borderRadius: 12,
                padding: "8px 20px",
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: "0.06em",
                boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
                whiteSpace: "nowrap",
                zIndex: 15,
              }}
            >
              ⚠️ ILLEGAL MOVE: LARGER DISK ON SMALLER!
            </div>
          </>
        )}

        {/* Bottom Tip Banner */}
        <div
          style={{
            position: "absolute",
            top: platformY + 70,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: 16,
            padding: "14px 28px",
            fontSize: 22,
            fontWeight: 700,
            color: "#CBD5E1",
            textAlign: "center",
            width: "88%",
            maxWidth: 900,
            boxSizing: "border-box",
            zIndex: 10,
          }}
        >
          {activeRule === 1 && "💡 Only the single top piece may ever leave a peg."}
          {activeRule === 2 && "💡 Lower disks are physically locked by disks resting above them."}
          {activeRule === 3 && "💡 Larger disk must ALWAYS stay below smaller disks at all times!"}
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------
  // VARIANT 3: LIVE 3-DISK SOLUTION (Complete 7-Step Trajectory)
  // -------------------------------------------------------------
  if (variant === "live_solve_3disk") {
    const MOVES = [
      { disk: 1, from: 0, to: 2, desc: "A ➔ C" },
      { disk: 2, from: 0, to: 1, desc: "A ➔ B" },
      { disk: 1, from: 2, to: 1, desc: "C ➔ B" },
      { disk: 3, from: 0, to: 2, desc: "A ➔ C (BASE DISK REACHES TARGET!)" },
      { disk: 1, from: 1, to: 0, desc: "B ➔ A" },
      { disk: 2, from: 1, to: 2, desc: "B ➔ C" },
      { disk: 1, from: 0, to: 2, desc: "A ➔ C (PUZZLE COMPLETE!)" },
    ];

    const moveIndex = Math.min(Math.floor(progress * 7), 6);
    const moveProgress = (progress * 7) - moveIndex;
    const currentMove = MOVES[moveIndex];

    const stacks: number[][] = [[3, 2, 1], [], []];
    for (let m = 0; m < moveIndex; m++) {
      const { disk, from, to } = MOVES[m];
      stacks[from] = stacks[from].filter((d) => d !== disk);
      stacks[to].push(disk);
    }

    const movingDisk = currentMove.disk;
    const fromPeg = currentMove.from;
    const toPeg = currentMove.to;

    const fromStack = stacks[fromPeg].filter((d) => d !== movingDisk);
    const toStack = [...stacks[toPeg]];

    const stageTop = isLandscape ? 180 : 490;
    const rodTop = stageTop + 90;
    const platformY = stageTop + 540;
    const rodHeight = platformY - rodTop;
    const clearY = rodTop - 50;

    const startX = pegXs[fromPeg];
    const targetX = pegXs[toPeg];
    const startY = platformY - (fromStack.length + 1) * (diskHeight + 4);
    const targetY = platformY - (toStack.length + 1) * (diskHeight + 4);

    let currentX = startX;
    let currentY = startY;

    if (moveProgress < 0.25) {
      const liftT = moveProgress / 0.25;
      currentX = startX;
      currentY = interpolate(liftT, [0, 1], [startY, clearY]);
    } else if (moveProgress < 0.75) {
      const glideT = (moveProgress - 0.25) / 0.5;
      currentX = interpolate(glideT, [0, 1], [startX, targetX]);
      currentY = clearY - Math.sin(glideT * Math.PI) * 24;
    } else {
      const dropT = (moveProgress - 0.75) / 0.25;
      currentX = targetX;
      currentY = interpolate(dropT, [0, 1], [clearY, targetY]);
    }

    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070A14",
          fontFamily: FONT,
          color: "#F5F7FF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: isLandscape ? 30 : 130,
          paddingBottom: isLandscape ? 30 : 360,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <div style={{ textAlign: "center", zIndex: 10, maxWidth: 940, opacity: enterSpring }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(16, 185, 129, 0.14)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              color: "#10B981",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "0.14em",
              padding: "8px 24px",
              borderRadius: 24,
              marginBottom: 14,
              textTransform: "uppercase",
            }}
          >
            {tag}
          </div>
          <h1
            style={{
              fontSize: isLandscape ? 44 : 58,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.12,
              margin: "0 0 14px 0",
              color: "#FFFFFF",
            }}
          >
            {title}
          </h1>
        </div>

        {/* Telemetry Move HUD */}
        <div
          style={{
            zIndex: 10,
            background: "rgba(15, 23, 42, 0.9)",
            border: "2px solid #00F0FF",
            boxShadow: "0 0 25px rgba(0, 240, 255, 0.25)",
            borderRadius: 20,
            padding: "16px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "88%",
            maxWidth: 900,
            boxSizing: "border-box",
            marginTop: 4,
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#00F0FF", letterSpacing: "0.1em" }}>
              STEP {moveIndex + 1} OF 7 (FORMULA: 2³ - 1 = 7)
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#FFFFFF", marginTop: 4 }}>
              ACTION: DISK {movingDisk} ➔ {currentMove.desc}
            </div>
          </div>
          <div
            style={{
              background: "rgba(0, 240, 255, 0.15)",
              border: "1px solid #00F0FF",
              borderRadius: 12,
              padding: "8px 18px",
              fontSize: 26,
              fontWeight: 900,
              color: "#00F0FF",
            }}
          >
            MOVE {moveIndex + 1}/7
          </div>
        </div>

        {/* Floating Peg Badges ABOVE Pegs */}
        <div
          style={{
            position: "absolute",
            top: stageTop + 20,
            left: 0,
            right: 0,
            zIndex: 15,
            pointerEvents: "none",
          }}
        >
          {[
            { label: "PEG A", role: "SOURCE", x: pegXs[0], color: "#00F0FF", count: fromPeg === 0 ? fromStack.length : toPeg === 0 ? toStack.length : stacks[0].length },
            { label: "PEG B", role: "HELPER", x: pegXs[1], color: "#FFB800", count: fromPeg === 1 ? fromStack.length : toPeg === 1 ? toStack.length : stacks[1].length },
            { label: "PEG C", role: "TARGET", x: pegXs[2], color: "#10B981", count: fromPeg === 2 ? fromStack.length : toPeg === 2 ? toStack.length : stacks[2].length },
          ].map((peg, pIdx) => (
            <div
              key={pIdx}
              style={{
                position: "absolute",
                left: peg.x,
                transform: "translateX(-50%)",
                background: "rgba(15, 23, 42, 0.9)",
                border: `1.5px solid ${peg.color}66`,
                borderRadius: 14,
                padding: "8px 18px",
                textAlign: "center",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                minWidth: 140,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 900, color: peg.color, letterSpacing: "0.06em" }}>
                {peg.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#94A3B8", marginTop: 2 }}>
                {peg.role} ({peg.count})
              </div>
            </div>
          ))}
        </div>

        {/* 3 Rods */}
        {pegXs.map((x, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: x,
              top: rodTop,
              transform: "translateX(-50%)",
              width: 14,
              height: rodHeight,
              background: idx === 2
                ? "linear-gradient(180deg, #10B981, #059669)"
                : "linear-gradient(180deg, #94A3B8, #475569)",
              borderRadius: 7,
              boxShadow: idx === 2 ? "0 0 18px rgba(16, 185, 129, 0.45)" : "none",
              zIndex: 4,
            }}
          />
        ))}

        {/* Base Platform */}
        <div
          style={{
            position: "absolute",
            top: platformY,
            left: "50%",
            transform: "translateX(-50%)",
            width: isLandscape ? 880 : 920,
            height: 22,
            background: "linear-gradient(90deg, #1E293B, #334155, #1E293B)",
            borderRadius: 11,
            border: "1px solid rgba(255, 255, 255, 0.25)",
            boxShadow: "0 0 25px rgba(0, 240, 255, 0.2)",
            zIndex: 6,
          }}
        />

        {/* Static Disks resting on pegs */}
        {[0, 1, 2].map((pIdx) => {
          const disksOnThisPeg = pIdx === fromPeg ? fromStack : pIdx === toPeg ? toStack : stacks[pIdx];
          return disksOnThisPeg.map((diskNum, level) => {
            const d = DISKS_SPEC[diskNum];
            const diskY = platformY - (level + 1) * (diskHeight + 4);
            return (
              <div
                key={`${pIdx}-${diskNum}`}
                style={{
                  position: "absolute",
                  left: pegXs[pIdx],
                  top: diskY,
                  transform: "translateX(-50%)",
                  width: d.width,
                  height: diskHeight,
                  background: d.color,
                  boxShadow: `0 0 14px ${d.glow}`,
                  borderRadius: 12,
                  border: "2px solid rgba(255, 255, 255, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 5,
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 900, color: "#000000" }}>{d.label}</span>
              </div>
            );
          });
        })}

        {/* Actively Moving Disk with Neon Flight Aura */}
        {(() => {
          const d = DISKS_SPEC[movingDisk];
          return (
            <div
              style={{
                position: "absolute",
                left: currentX,
                top: currentY,
                transform: "translateX(-50%)",
                width: d.width,
                height: diskHeight,
                background: d.color,
                boxShadow: `0 0 32px ${d.glow}, 0 0 12px #FFFFFF`,
                borderRadius: 12,
                border: "3px solid #FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 20,
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 900, color: "#000000" }}>{d.label}</span>
            </div>
          );
        })()}

        {/* Peg State Array Footer */}
        <div
          style={{
            position: "absolute",
            top: platformY + 60,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            display: "flex",
            gap: 18,
            width: "88%",
            maxWidth: 900,
            justifyContent: "center",
            boxSizing: "border-box",
          }}
        >
          {["PEG A: SOURCE", "PEG B: HELPER", "PEG C: TARGET"].map((titleText, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                background: "rgba(15, 23, 42, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: 14,
                padding: "10px 14px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 18, color: "#64748B", fontWeight: 700 }}>{titleText}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#F8FAFC", marginTop: 4, fontFamily: MONO }}>
                [{stacks[idx].length > 0 ? stacks[idx].join(", ") : "EMPTY"}]
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------
  // VARIANT 4: RECURSION FORMULA (The 3 Golden Rules & Tree)
  // -------------------------------------------------------------
  if (variant === "recursion_formula") {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070A14",
          fontFamily: FONT,
          color: "#F5F7FF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: isLandscape ? 30 : 130,
          paddingBottom: isLandscape ? 30 : 360,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <div style={{ textAlign: "center", zIndex: 10, maxWidth: 940, opacity: enterSpring }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(217, 70, 239, 0.14)",
              border: "1px solid rgba(217, 70, 239, 0.4)",
              color: "#D946EF",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "0.14em",
              padding: "8px 24px",
              borderRadius: 24,
              marginBottom: 14,
              textTransform: "uppercase",
            }}
          >
            {tag}
          </div>
          <h1
            style={{
              fontSize: isLandscape ? 44 : 58,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.12,
              margin: "0 0 14px 0",
              color: "#FFFFFF",
            }}
          >
            {title}
          </h1>
        </div>

        {/* The 3 Golden Steps of Recursion Cards */}
        <div
          style={{
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: "88%",
            maxWidth: 920,
            marginTop: 10,
          }}
        >
          {[
            {
              step: "STEP 1",
              color: "#00F0FF",
              title: "MOVE TOP (N - 1) DISKS ➔ HELPER (B)",
              desc: "Treat the upper bundle as a single sub-problem and park it on the auxiliary peg.",
              code: "hanoi(n - 1, source, helper, target)",
            },
            {
              step: "STEP 2",
              color: "#FFB800",
              title: "MOVE LARGEST N-TH DISK ➔ TARGET (C)",
              desc: "Now the largest base disk is free! Move it directly to its final destination in 1 move.",
              code: "move(disk_n, source, target)",
            },
            {
              step: "STEP 3",
              color: "#10B981",
              title: "MOVE THOSE (N - 1) DISKS ➔ TARGET (C)",
              desc: "Bring the parked sub-bundle from Helper (B) onto the base disk on Target (C)!",
              code: "hanoi(n - 1, helper, target, source)",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(15, 23, 42, 0.85)",
                border: `2px solid ${item.color}88`,
                boxShadow: `0 4px 20px ${item.color}22`,
                borderRadius: 18,
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div
                style={{
                  background: item.color,
                  color: "#000000",
                  fontSize: 22,
                  fontWeight: 900,
                  padding: "8px 16px",
                  borderRadius: 12,
                  letterSpacing: "0.06em",
                  flexShrink: 0,
                }}
              >
                {item.step}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#FFFFFF" }}>{item.title}</div>
                <div style={{ fontSize: 20, color: "#CBD5E1", marginTop: 4, fontWeight: 600 }}>
                  {item.desc}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    color: item.color,
                    fontFamily: MONO,
                    marginTop: 6,
                    fontWeight: 700,
                  }}
                >
                  &gt; {item.code}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Big Bold Mathematical Formula Box */}
        <div
          style={{
            zIndex: 10,
            background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))",
            border: "2px solid #D946EF",
            boxShadow: "0 0 35px rgba(217, 70, 239, 0.35)",
            borderRadius: 24,
            padding: "24px 36px",
            textAlign: "center",
            width: "88%",
            maxWidth: 920,
            marginTop: 20,
            boxSizing: "border-box",
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 800, color: "#D946EF", letterSpacing: "0.12em" }}>
            RECURRENCE RELATION &amp; TOTAL MOVES
          </div>
          <div
            style={{
              fontSize: isLandscape ? 52 : 72,
              fontWeight: 900,
              color: "#FFFFFF",
              margin: "12px 0 8px 0",
              fontFamily: MONO,
              letterSpacing: "0.04em",
              textShadow: "0 0 25px rgba(217, 70, 239, 0.6)",
            }}
          >
            T(n) = 2ⁿ - 1
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#E2E8F0" }}>
            T(n) = 2 · T(n - 1) + 1 &nbsp;➔&nbsp; TIME COMPLEXITY:{" "}
            <span style={{ color: "#FF5555", fontWeight: 900 }}>O(2ⁿ) (EXPONENTIAL)</span>
          </div>
        </div>

        {/* Visual Binary Call Tree Box (Eliminates the empty space and teaches recursion deeply) */}
        <div
          style={{
            zIndex: 10,
            marginTop: 18,
            background: "rgba(15, 23, 42, 0.8)",
            border: "1.5px solid rgba(0, 240, 255, 0.3)",
            borderRadius: 20,
            padding: "16px 28px",
            width: "88%",
            maxWidth: 920,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#00F0FF", letterSpacing: "0.08em" }}>
              🌲 RECURSION CALL TREE (N = 3)
            </span>
            <span style={{ fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
              DOUBLES AT EVERY DEPTH
            </span>
          </div>

          {/* Level 1: Root */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <div style={{ background: "rgba(217, 70, 239, 0.2)", border: "1px solid #D946EF", borderRadius: 10, padding: "6px 16px", fontSize: 20, fontWeight: 800, color: "#F5D0FE" }}>
              HANOI(3, A, C, B) ➔ 7 Moves
            </div>
          </div>

          {/* Level 2: Two Branches */}
          <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 10 }}>
            <div style={{ background: "rgba(0, 240, 255, 0.15)", border: "1px solid #00F0FF", borderRadius: 8, padding: "4px 14px", fontSize: 18, fontWeight: 700, color: "#67E8F9" }}>
              HANOI(2, A, B, C) [3 moves]
            </div>
            <div style={{ background: "rgba(255, 184, 0, 0.15)", border: "1px solid #FFB800", borderRadius: 8, padding: "4px 14px", fontSize: 18, fontWeight: 700, color: "#FDE68A" }}>
              HANOI(2, B, C, A) [3 moves]
            </div>
          </div>

          {/* Level 3: Base Leaves */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            {["H(1)", "H(1)", "H(1)", "H(1)"].map((leaf, lIdx) => (
              <div key={lIdx} style={{ flex: 1, textAlign: "center", background: "rgba(16, 185, 129, 0.12)", border: "1px solid #10B981", borderRadius: 6, padding: "4px 6px", fontSize: 16, fontWeight: 700, color: "#A7F3D0" }}>
                {leaf} [1 move]
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------
  // VARIANT 5: ASTRONOMICAL SCALE (The Exponential Explosion)
  // -------------------------------------------------------------
  if (variant === "astronomical_scale") {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#070A14",
          fontFamily: FONT,
          color: "#F5F7FF",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: isLandscape ? 30 : 130,
          paddingBottom: isLandscape ? 30 : 360,
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <div style={{ textAlign: "center", zIndex: 10, maxWidth: 940, opacity: enterSpring }}>
          <div
            style={{
              display: "inline-block",
              background: "rgba(255, 85, 85, 0.14)",
              border: "1px solid rgba(255, 85, 85, 0.4)",
              color: "#FF5555",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "0.14em",
              padding: "8px 24px",
              borderRadius: 24,
              marginBottom: 14,
              textTransform: "uppercase",
            }}
          >
            {tag}
          </div>
          <h1
            style={{
              fontSize: isLandscape ? 44 : 58,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.12,
              margin: "0 0 14px 0",
              color: "#FFFFFF",
            }}
          >
            {title}
          </h1>
        </div>

        {/* 3 Step Escalation Cards */}
        <div
          style={{
            zIndex: 10,
            display: "flex",
            gap: 16,
            width: "88%",
            maxWidth: 920,
            marginTop: 10,
          }}
        >
          {[
            { n: "N = 3 DISKS", moves: "7 MOVES", time: "7 SECONDS", color: "#00F0FF" },
            { n: "N = 10 DISKS", moves: "1,023 MOVES", time: "17 MINUTES", color: "#FFB800" },
            { n: "N = 30 DISKS", moves: "1 BILLION", time: "34 YEARS", color: "#F97316" },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                background: "rgba(15, 23, 42, 0.85)",
                border: `1.5px solid ${item.color}55`,
                borderRadius: 18,
                padding: "18px 14px",
                textAlign: "center",
                boxShadow: `0 4px 16px ${item.color}15`,
              }}
            >
              <div style={{ fontSize: 20, color: item.color, fontWeight: 800, letterSpacing: "0.06em" }}>
                {item.n}
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF", margin: "6px 0" }}>
                {item.moves}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#94A3B8" }}>{item.time}</div>
            </div>
          ))}
        </div>

        {/* The 64 Disks Astronomical Hero Block */}
        <div
          style={{
            zIndex: 10,
            background: "linear-gradient(135deg, rgba(30, 20, 60, 0.9), rgba(15, 23, 42, 0.98))",
            border: "2px solid #FF5555",
            boxShadow: "0 0 45px rgba(255, 85, 85, 0.4)",
            borderRadius: 24,
            padding: "24px 32px",
            textAlign: "center",
            width: "88%",
            maxWidth: 920,
            marginTop: 20,
            boxSizing: "border-box",
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 800, color: "#FF5555", letterSpacing: "0.1em" }}>
            THE 64 DISKS ASTRONOMICAL TRUTH (2⁶⁴ - 1)
          </div>
          <div
            style={{
              fontSize: isLandscape ? 38 : 46,
              fontWeight: 900,
              color: "#FFFFFF",
              margin: "12px 0 6px 0",
              fontFamily: MONO,
              letterSpacing: "-0.01em",
              textShadow: "0 0 20px rgba(255, 85, 85, 0.5)",
            }}
          >
            18,446,744,073,709,551,615
          </div>
          <div style={{ fontSize: 24, color: "#CBD5E1", fontWeight: 700 }}>
            = 18.4 QUINTILLION OPTIMAL MOVES
          </div>

          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 20, color: "#94A3B8", fontWeight: 700 }}>AT 1 MOVE/SEC:</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#FFB800" }}>585 BILLION YEARS</div>
            </div>
            <div style={{ fontSize: 32, color: "#64748B", fontWeight: 800 }}>vs</div>
            <div>
              <div style={{ fontSize: 20, color: "#94A3B8", fontWeight: 700 }}>AGE OF UNIVERSE:</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#00F0FF" }}>13.8 BILLION YEARS</div>
            </div>
          </div>
        </div>

        {/* Cosmic Timeline Comparison Meter Box */}
        <div
          style={{
            zIndex: 10,
            background: "rgba(15, 23, 42, 0.85)",
            border: "1.5px solid rgba(255, 184, 0, 0.35)",
            borderRadius: 20,
            padding: "18px 28px",
            width: "88%",
            maxWidth: 920,
            marginTop: 16,
            boxSizing: "border-box",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, color: "#FFB800", letterSpacing: "0.08em", marginBottom: 12 }}>
            ⏱️ COSMIC TIME RATIO VISUALIZER
          </div>

          {/* Bar 1: Age of Universe */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: "#CBD5E1", marginBottom: 4 }}>
              <span>Age of Universe: 13.8 Billion Yrs</span>
              <span style={{ color: "#00F0FF", fontWeight: 800 }}>2.3% of Hanoi Time</span>
            </div>
            <div style={{ width: "100%", height: 16, background: "rgba(255,255,255,0.1)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: "6%", height: "100%", background: "#00F0FF", borderRadius: 8, boxShadow: "0 0 12px #00F0FF" }} />
            </div>
          </div>

          {/* Bar 2: Hanoi Duration */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: "#CBD5E1", marginBottom: 4 }}>
              <span>Tower of Hanoi: 585 Billion Yrs</span>
              <span style={{ color: "#FFB800", fontWeight: 900 }}>42.4× LONGER!</span>
            </div>
            <div style={{ width: "100%", height: 16, background: "rgba(255,255,255,0.1)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, #FFB800, #FF5555)", borderRadius: 8, boxShadow: "0 0 16px rgba(255, 184, 0, 0.6)" }} />
            </div>
          </div>
        </div>

        {/* Green Safe Relief Banner */}
        <div
          style={{
            zIndex: 10,
            background: "rgba(16, 185, 129, 0.15)",
            border: "2px solid #10B981",
            boxShadow: "0 0 30px rgba(16, 185, 129, 0.3)",
            borderRadius: 20,
            padding: "16px 36px",
            display: "flex",
            alignItems: "center",
            gap: 18,
            width: "88%",
            maxWidth: 920,
            marginTop: 16,
            boxSizing: "border-box",
          }}
        >
          <span style={{ fontSize: 42 }}>🛡️</span>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#10B981", letterSpacing: "0.04em" }}>
              THE UNIVERSE IS 100% SAFE!
            </div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#E2E8F0", marginTop: 2 }}>
              The Sun will exhaust its nuclear fuel billions of years before monks finish!
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // -------------------------------------------------------------
  // VARIANT 6: OUTRO TAKEAWAY (The 3 Pillars of Recursion & CTA)
  // -------------------------------------------------------------
  const bellSwing = Math.sin(frame * 0.15) * 12;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#070A14",
        fontFamily: FONT,
        color: "#F5F7FF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: isLandscape ? 30 : 130,
        paddingBottom: isLandscape ? 30 : 360,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Top Header */}
      <div style={{ textAlign: "center", zIndex: 10, maxWidth: 940, opacity: enterSpring }}>
        <div
          style={{
            display: "inline-block",
            background: "rgba(0, 240, 255, 0.12)",
            border: "1px solid rgba(0, 240, 255, 0.3)",
            color: accent,
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "0.14em",
            padding: "8px 24px",
            borderRadius: 24,
            marginBottom: 14,
            textTransform: "uppercase",
          }}
        >
          {tag}
        </div>
        <h1
          style={{
            fontSize: isLandscape ? 44 : 58,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 1.12,
            margin: "0 0 14px 0",
            color: "#FFFFFF",
          }}
        >
          {title}
        </h1>
      </div>

      {/* 3 Core Lessons of Recursion */}
      <div
        style={{
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: "88%",
          maxWidth: 920,
          marginTop: 10,
        }}
      >
        {[
          {
            icon: "🎯",
            pillar: "1. BASE CASE FIRST",
            desc: "Always define the simplest atomic exit condition (N = 1) to prevent stack overflow.",
            color: "#00F0FF",
          },
          {
            icon: "⚡",
            pillar: "2. SELF-SIMILAR SUBPROBLEMS",
            desc: "Trust recursion to solve (N - 1) without tracking internal micro-steps manually.",
            color: "#FFB800",
          },
          {
            icon: "🚀",
            pillar: "3. EXPONENTIAL O(2ⁿ) POWER",
            desc: "Recursion turns impossible complexity into clean, elegant, readable code.",
            color: "#10B981",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              background: "rgba(15, 23, 42, 0.85)",
              border: `2px solid ${item.color}55`,
              borderRadius: 18,
              padding: "20px 26px",
              display: "flex",
              alignItems: "center",
              gap: 20,
              boxShadow: `0 4px 18px ${item.color}15`,
            }}
          >
            <span style={{ fontSize: 40 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: item.color }}>{item.pillar}</div>
              <div style={{ fontSize: 22, color: "#CBD5E1", marginTop: 4, fontWeight: 600 }}>
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Master Takeaway Pill */}
      <div
        style={{
          zIndex: 10,
          marginTop: 16,
          background: "rgba(0, 240, 255, 0.08)",
          border: "1px dashed rgba(0, 240, 255, 0.4)",
          borderRadius: 16,
          padding: "12px 28px",
          fontSize: 20,
          fontWeight: 800,
          color: "#A5F3FC",
          textAlign: "center",
          letterSpacing: "0.04em",
        }}
      >
        💡 THE RECURSIVE LAW: SOLVE ANY PROBLEM BY SOLVING A SMALLER COPY OF ITSELF!
      </div>

      {/* Channel CTA Card */}
      <div
        style={{
          zIndex: 10,
          marginTop: 20,
          background: "linear-gradient(90deg, rgba(0, 240, 255, 0.16), rgba(217, 70, 239, 0.16))",
          border: "2px solid #00F0FF",
          boxShadow: "0 0 35px rgba(0, 240, 255, 0.35)",
          borderRadius: 24,
          padding: "22px 40px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          width: "88%",
          maxWidth: 920,
          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            fontSize: 48,
            display: "inline-block",
            transform: `rotate(${bellSwing}deg)`,
            transformOrigin: "top center",
          }}
        >
          🔔
        </span>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.02em" }}>
            SUBSCRIBE TO RAJAN का ADDA
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#94A3B8", marginTop: 4 }}>
            Master Computer Science &amp; Tech Concepts in Plain Hindi
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
