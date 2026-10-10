import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

// Word-by-word reveal: each word rises, un-blurs and fades in (cinematic title style).
export const RevealText: React.FC<{
  text: string;
  delay?: number; // frames before the first word
  stagger?: number; // frames between words
  align?: "center" | "left";
  style?: React.CSSProperties;
}> = ({ text, delay = 0, stagger = 3, align = "center", style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        columnGap: "0.28em",
        rowGap: "0.05em",
        textAlign: align,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = spring({
          frame: frame - delay - i * stagger,
          fps,
          config: { damping: 200 },
          durationInFrames: 24,
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${(1 - p) * 44}px)`,
              filter: p >= 0.999 ? "none" : `blur(${(1 - p) * 14}px)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};
