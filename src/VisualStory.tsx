import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { VisualBeat } from "./types";
import { FONT } from "./theme";

export function getActiveVisualBeat(
  beats: VisualBeat[] | undefined,
  progress: number
): VisualBeat | undefined {
  if (!beats?.length) return undefined;

  let active = beats[0];
  for (const beat of beats) {
    if (beat.at > progress) break;
    active = beat;
  }
  return active;
}

export const VisualBeatOverlay: React.FC<{
  beats?: VisualBeat[];
  accent: string;
  artDirection?: "editorial" | "cinematic";
  localFrame?: number;
  sceneDuration?: number;
}> = ({ beats, accent, artDirection = "editorial", localFrame, sceneDuration }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const effectiveFrame = localFrame !== undefined ? localFrame : frame;
  const effectiveDuration = sceneDuration !== undefined ? sceneDuration : durationInFrames;
  const progress = effectiveFrame / Math.max(effectiveDuration - 1, 1);
  const beat = getActiveVisualBeat(beats, progress);

  if (!beat) return null;

  const beatProgress = progress - beat.at;
  const opacity = interpolate(beatProgress, [0, 0.025, 0.07], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: width * 0.06,
        right: width * 0.06,
        bottom: height > width ? 430 : 110,
        zIndex: 45,
        opacity,
        pointerEvents: "none",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          padding: artDirection === "editorial" ? "12px 18px" : "18px 24px",
          borderRadius: artDirection === "editorial" ? 4 : 16,
          border:
            artDirection === "editorial"
              ? `1px solid rgba(180, 195, 216, 0.24)`
              : `1px solid ${accent}99`,
          borderLeft: artDirection === "editorial" ? `3px solid ${accent}` : undefined,
          background: "rgba(8, 17, 34, 0.94)",
          boxShadow:
            artDirection === "editorial"
              ? "none"
              : `0 12px 32px rgba(0,0,0,0.35), 0 0 24px ${accent}22`,
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            color: accent,
            fontFamily: "monospace",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          {beat.label}
        </div>
        <div style={{ color: "#F5F7FF", fontSize: 30, fontWeight: 750, lineHeight: 1.2 }}>
          {beat.action}
        </div>
        {beat.state && (
          <div style={{ color: accent, fontSize: 28, fontWeight: 800, marginTop: 8 }}>
            {beat.state}
          </div>
        )}
      </div>
    </div>
  );
};

export const JourneyRail: React.FC<{
  steps?: string[];
  activeStep?: number;
  width: number;
  height: number;
  accent?: string;
  artDirection?: "editorial" | "cinematic";
}> = ({
  steps,
  activeStep = 0,
  width,
  height,
  accent = "#FFC857",
  artDirection = "editorial",
}) => {
  if (!steps?.length) return null;

  const landscape = width > height;
  const current = Math.min(steps.length - 1, Math.max(0, activeStep));
  const fontSize = landscape ? 20 : 28;
  const sidePadding = landscape ? 44 : 54;

  return (
    <div
      aria-label="Story progress"
      style={{
        position: "absolute",
        top: landscape ? 24 : 40,
        left: sidePadding,
        right: sidePadding,
        height: landscape ? 54 : 72,
        display: "flex",
        zIndex: 110,
        pointerEvents: "none",
        fontFamily: "monospace",
      }}
    >
      {steps.map((step, index) => {
        const completed = index <= current;
        return (
          <div
            key={`${step}-${index}`}
            style={{
              position: "relative",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              color: completed ? "#FFFFFF" : "#8C9BB4",
            }}
          >
            {index < steps.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  top: landscape ? 8 : 11,
                  left: "50%",
                  width: "100%",
                  height: 3,
                  background: index < current ? accent : "rgba(180,200,230,0.35)",
                }}
              />
            )}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                width: landscape ? 18 : 24,
                height: landscape ? 18 : 24,
                borderRadius: "50%",
                background: completed ? accent : "#0B1020",
                border: `2px solid ${completed ? accent : "#8090AA"}`,
                boxShadow:
                  artDirection === "cinematic" && index === current
                    ? `0 0 16px ${accent}A6`
                    : "none",
              }}
            />
            <div
              style={{
                marginTop: 6,
                fontSize,
                fontWeight: 800,
                letterSpacing: "0.12em",
                lineHeight: 1,
                whiteSpace: "nowrap",
                color: index === current ? accent : completed ? "#F5F7FF" : "#8C9BB4",
              }}
            >
              {step.toUpperCase()}
            </div>
          </div>
        );
      })}
    </div>
  );
};
