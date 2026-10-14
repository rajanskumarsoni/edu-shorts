import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import type { SceneSpec } from "../types";
import { FONT, resolveSceneTag } from "../theme";

export const InterviewCard: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const interviewData = scene.interview || {};
  const speaker = (interviewData.speaker || scene.author || "INTERVIEWER").toUpperCase();
  const text = interviewData.text || scene.text || scene.title || "";
  const strikethrough = interviewData.strikethrough ?? false;
  const highlightWords = Array.isArray(interviewData.highlight)
    ? interviewData.highlight
    : interviewData.highlight
    ? [interviewData.highlight]
    : [];
  const subtext = interviewData.subtext || scene.subtext || "";

  // Spring card entrance
  const cardScale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });
  const cardOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  // Strikethrough line animation (starts at frame 16)
  const strikeProgress = strikethrough
    ? interpolate(frame, [16, 32], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const isInterviewer = speaker.includes("INTERVIEWER");
  const isCandidate = speaker.includes("YOU") || speaker.includes("CANDIDATE");
  const isRecap = speaker.includes("RECAP") || speaker.includes("SUMMARY");

  const badgeColor = isInterviewer ? "#FFC857" : isRecap ? "#00F0FF" : isCandidate && strikethrough ? "#FF3B30" : accent;

  // Split text and render highlighted words
  const renderStyledText = () => {
    if (!highlightWords.length) {
      return text;
    }
    const pattern = new RegExp(`(${highlightWords.join("|")})`, "gi");
    const parts = text.split(pattern);
    return parts.map((part, i) => {
      const isHit = highlightWords.some((w) => w.toLowerCase() === part.toLowerCase());
      return isHit ? (
        <span key={i} style={{ color: "#FFC857", textShadow: "0 0 16px rgba(255, 200, 87, 0.4)" }}>
          {part}
        </span>
      ) : (
        part
      );
    });
  };

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 45%, #0e1e38 0%, #081120 100%)",
        color: "#FFFFFF",
        fontFamily: FONT,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 60px",
        overflow: "hidden",
      }}
    >
      {/* 3D Perspective Ground Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.18,
          backgroundImage:
            "linear-gradient(rgba(0, 240, 255, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.4) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          transform: "perspective(600px) rotateX(60deg) scale(1.6)",
          transformOrigin: "center 75%",
        }}
      />

      {/* Top Track Header */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 54,
          right: 54,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "monospace",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: "0.14em",
          color: accent,
          zIndex: 10,
        }}
      >
        <span>{resolveSceneTag(scene, "01 / ARCHITECTURE DIALOGUE")}</span>
        <span style={{ color: badgeColor }}>{speaker}</span>
      </div>

      {/* The Central Dialogue Card */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          width: "100%",
          maxWidth: 960,
          padding: "48px 54px",
          borderRadius: 24,
          background: "linear-gradient(145deg, rgba(16, 32, 58, 0.95), rgba(9, 18, 34, 0.95))",
          border: `1.5px solid ${strikethrough && frame > 20 ? "rgba(255, 59, 48, 0.6)" : "rgba(100, 150, 220, 0.35)"}`,
          boxShadow: `0 24px 64px rgba(0, 0, 0, 0.5), 0 0 32px ${strikethrough && frame > 20 ? "rgba(255, 59, 48, 0.2)" : "rgba(0, 240, 255, 0.1)"}`,
          transform: `scale(${cardScale})`,
          opacity: cardOpacity,
        }}
      >
        {/* Speaker Pill Badge */}
        <div
          style={{
            display: "inline-block",
            padding: "6px 18px",
            borderRadius: 8,
            background: `${badgeColor}22`,
            border: `1px solid ${badgeColor}`,
            color: badgeColor,
            fontFamily: "monospace",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "0.12em",
            marginBottom: 24,
          }}
        >
          {speaker}
        </div>

        {/* Question / Statement with Optional Strikethrough Line */}
        <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
          <div
            style={{
              fontSize: 54,
              fontWeight: 850,
              lineHeight: 1.22,
              color: strikethrough && frame > 25 ? "rgba(255, 255, 255, 0.6)" : "#FFFFFF",
              transition: "color 0.2s ease",
            }}
          >
            {renderStyledText()}
          </div>

          {/* Dynamic Red Marker Strikethrough Line */}
          {strikethrough && (
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                overflow: "visible",
              }}
            >
              <line
                x1="0"
                y1="50%"
                x2={`${strikeProgress * 100}%`}
                y2="50%"
                stroke="#FF3B30"
                strokeWidth="10"
                strokeLinecap="round"
                style={{
                  filter: "drop-shadow(0 0 10px rgba(255, 59, 48, 0.8))",
                }}
              />
            </svg>
          )}
        </div>

        {/* Subtext / Key Explanation Takeaway */}
        {subtext && (
          <div
            style={{
              marginTop: 28,
              paddingTop: 24,
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#AFC4DF",
              fontSize: 30,
              fontWeight: 650,
              lineHeight: 1.35,
            }}
          >
            {subtext}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

