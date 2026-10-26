import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { VisualBeat, VisualEvent } from "./types";
import { FONT } from "./theme";

export function getActiveVisualBeat(
  beats: (VisualBeat | VisualEvent)[] | undefined,
  progress: number
): (VisualBeat | VisualEvent) | undefined {
  if (!beats?.length) return undefined;

  const pct = progress * 100;
  for (const beat of beats) {
    if (beat.start_pct !== undefined && beat.end_pct !== undefined) {
      if (pct >= beat.start_pct && pct <= beat.end_pct) {
        return beat;
      }
    }
  }

  // Fallback to legacy `at` or closest beat
  let active = beats[0];
  for (const beat of beats) {
    const beatAt = beat.at !== undefined ? beat.at : (beat.start_pct !== undefined ? beat.start_pct / 100 : 0);
    if (beatAt > progress) break;
    active = beat;
  }
  return active;
}

export const VisualBeatOverlay: React.FC<{
  beats?: VisualBeat[];
  events?: VisualEvent[];
  accent: string;
  artDirection?: "editorial" | "cinematic";
  localFrame?: number;
  sceneDuration?: number;
}> = () => {
  // Permanently disabled: Static whole-text caption boxes are forbidden to prevent duplicate captions.
  // Only dynamic active word-by-word captions (Captions.tsx) are rendered.
  return null;
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
