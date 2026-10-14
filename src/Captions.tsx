import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "./theme";

const CAPTION_FONT =
  "'Noto Sans Devanagari', 'Kohinoor Devanagari', 'Nirmala UI', " + FONT;

interface CaptionsProps {
  narration?: string;
  durationInFrames: number;
  accent: string;
  wordTimings?: Array<{ word: string; start: number; end: number }>;
  localFrame?: number;
}

export const Captions: React.FC<CaptionsProps> = ({
  narration,
  durationInFrames,
  accent,
  wordTimings,
  localFrame,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const landscape = width > height;

  // Use localFrame if provided (for per-scene captions), otherwise fall back to global frame
  const effectiveFrame = localFrame !== undefined ? localFrame : frame;

  if (!narration || !narration.trim()) return null;

  // Preserve the approved narration; mechanical transliteration changes pronunciation.
  const words = narration.trim().split(/\s+/);
  if (words.length === 0) return null;

  // If exact word timings are provided, use them for millisecond-precise highlighting
  if (wordTimings && wordTimings.length > 0) {
    const activeWordIdx = wordTimings.findIndex(
      (t) => effectiveFrame >= t.start * fps && effectiveFrame < t.end * fps
    );
    const activeCaptionWordIdx =
      activeWordIdx < 0
        ? -1
        : Math.min(
            words.length - 1,
            Math.floor((activeWordIdx / wordTimings.length) * words.length)
          );
    const currentChunkStart = Math.max(
      0,
      activeCaptionWordIdx >= 0 ? activeCaptionWordIdx - 2 : 0
    );
    const currentChunkEnd = Math.min(
      words.length,
      activeCaptionWordIdx >= 0 ? activeCaptionWordIdx + 3 : 5
    );
    const currentChunk = words.slice(currentChunkStart, currentChunkEnd);
    const activeWordInChunk =
      activeCaptionWordIdx >= 0 ? activeCaptionWordIdx - currentChunkStart : 0;

    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: landscape ? 48 : 280,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 50,
          padding: '0 40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 12,
            background: 'rgba(11, 16, 32, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            padding: '12px 24px',
            borderRadius: 8,
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.35)',
            fontFamily: CAPTION_FONT,
            fontSize: landscape ? 34 : 48,
            fontWeight: 900,
            lineHeight: 1.25,
            maxWidth: '92%',
          }}
        >
          {currentChunk.map((w, i) => {
            const isActive = i === activeWordInChunk;
            return (
              <span
                key={i}
                style={{
                  color: isActive ? accent : '#FFFFFF',
                  transform: isActive ? 'scale(1.12)' : 'scale(1.0)',
                  transition: 'transform 0.08s ease-out, color 0.08s ease-out',
                  textShadow: isActive
                    ? `0 0 24px ${accent}, 0 2px 10px rgba(0,0,0,0.8)`
                    : '0 2px 8px rgba(0,0,0,0.8)',
                  display: 'inline-block',
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  // Chunk words into phrases of 4 to 6 words
  const chunkSize = 5;
  const chunks: string[][] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize));
  }

  // Active phrase index based on scene frame progress
  const activeFraction = Math.min(1, Math.max(0, effectiveFrame / Math.max(1, durationInFrames)));
  const currentChunkIdx = Math.min(
    chunks.length - 1,
    Math.floor(activeFraction * chunks.length)
  );
  const currentChunk = chunks[currentChunkIdx];

  // Calculate active word index within current chunk
  const chunkStartFrac = currentChunkIdx / chunks.length;
  const chunkEndFrac = (currentChunkIdx + 1) / chunks.length;
  const withinChunkFrac = Math.min(
    1,
    Math.max(0, (activeFraction - chunkStartFrac) / Math.max(0.001, chunkEndFrac - chunkStartFrac))
  );
  const activeWordInChunk = Math.min(
    currentChunk.length - 1,
    Math.floor(withinChunkFrac * currentChunk.length)
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: landscape ? 48 : 280,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 50,
        padding: "0 40px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 12,
          background: "rgba(11, 16, 32, 0.92)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          padding: "12px 24px",
          borderRadius: 8,
          boxShadow: "0 4px 18px rgba(0, 0, 0, 0.35)",
          fontFamily: CAPTION_FONT,
          fontSize: landscape ? 34 : 48,
          fontWeight: 900,
          lineHeight: 1.25,
          maxWidth: "92%",
        }}
      >
        {currentChunk.map((w, i) => {
          const isActive = i === activeWordInChunk;
          return (
            <span
              key={i}
              style={{
                color: isActive ? accent : "#FFFFFF",
                transform: isActive ? "scale(1.12)" : "scale(1.0)",
                transition: "transform 0.08s ease-out, color 0.08s ease-out",
                textShadow: isActive
                  ? `0 0 24px ${accent}, 0 2px 10px rgba(0,0,0,0.8)`
                  : "0 2px 8px rgba(0,0,0,0.8)",
                display: "inline-block",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
