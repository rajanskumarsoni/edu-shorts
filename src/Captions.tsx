import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "./theme";

const CAPTION_FONT =
  "'Noto Sans Devanagari', 'Kohinoor Devanagari', 'Nirmala UI', " + FONT;

// Vibrant pop color for numeric or shock keywords (percentage, currency, metrics)
const VIRAL_EMPHASIS_COLOR = "#FFE600";

function isHighEmphasisWord(word: string, customEmphasis?: string[]): boolean {
  if (customEmphasis && customEmphasis.length > 0) {
    const cleanW = word.toLowerCase().replace(/[^\w\u0900-\u097F]/g, "");
    if (customEmphasis.some((ce) => cleanW.includes(ce.toLowerCase().trim()))) {
      return true;
    }
  }
  return /[\d%₹\$]|हैक|क्रैश|लीक|सीक्रेट|सिक्योरिटी|खतरा|जीरो|लाख|करोड़|बटन|डाउन/i.test(
    word
  );
}

interface CaptionsProps {
  narration?: string;
  durationInFrames: number;
  accent: string;
  wordTimings?: Array<{ word: string; start: number; end: number }>;
  localFrame?: number;
  emphasisWords?: string[];
}

export const Captions: React.FC<CaptionsProps> = ({
  narration,
  durationInFrames,
  accent,
  wordTimings,
  localFrame,
  emphasisWords,
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

  // 1. Precise Word-Timing Mode (Synthesized from VoiceStudio)
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

    // Punchy 2-3 word window for rapid eye-tracking retention on mobile
    const currentChunkStart = Math.max(
      0,
      activeCaptionWordIdx >= 0 ? activeCaptionWordIdx - 1 : 0
    );
    const currentChunkEnd = Math.min(
      words.length,
      activeCaptionWordIdx >= 0 ? activeCaptionWordIdx + 2 : 3
    );
    const currentChunk = words.slice(currentChunkStart, currentChunkEnd);
    const activeWordInChunk =
      activeCaptionWordIdx >= 0 ? activeCaptionWordIdx - currentChunkStart : 0;

    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          // Safely above Instagram Reels username, audio ticker & description
          bottom: landscape ? 56 : 380,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
          zIndex: 60,
          // Right-side extra padding clears Reels like/comment/share action column
          padding: landscape ? "0 40px" : "0 100px 0 40px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: 14,
            background: "rgba(6, 10, 22, 0.94)",
            border: `1.5px solid ${accent}55`,
            padding: landscape ? "12px 24px" : "14px 28px",
            borderRadius: 18,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.70), 0 0 20px ${accent}25`,
            fontFamily: CAPTION_FONT,
            fontSize: landscape ? 34 : 48,
            fontWeight: 900,
            lineHeight: 1.25,
            maxWidth: "92%",
            backdropFilter: "blur(16px)",
          }}
        >
          {currentChunk.map((w, i) => {
            const isActive = i === activeWordInChunk;
            const popColor = isHighEmphasisWord(w, emphasisWords) ? VIRAL_EMPHASIS_COLOR : accent;
            return (
              <span
                key={i}
                style={{
                  color: isActive ? popColor : "#F1F5F9",
                  opacity: isActive ? 1.0 : 0.85,
                  transform: isActive ? "scale(1.22) translateY(-2px)" : "scale(1.0)",
                  transition: "transform 0.06s ease-out, color 0.06s ease-out",
                  textShadow: isActive
                    ? `0 0 28px ${popColor}, 0 0 10px ${popColor}, 0 3px 12px rgba(0,0,0,0.9)`
                    : "0 2px 8px rgba(0,0,0,0.85)",
                  display: "inline-block",
                  letterSpacing: "0.02em",
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

  // 2. Fallback Mode (Chunked for Rapid Kinetic Pacing)
  const chunkSize = words.length > 8 ? 3 : 4;
  const chunks: string[][] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize));
  }

  // Active speech timing: Voiceover concludes before scene pad; map progress to speech window
  const speechFrames = Math.max(15, durationInFrames - Math.round(fps * 0.32));
  const activeFraction = Math.min(1, Math.max(0, effectiveFrame / speechFrames));
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
        // Safely above Instagram Reels username, audio ticker & description
        bottom: landscape ? 56 : 380,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 60,
        // Right-side extra padding clears Reels like/comment/share action column
        padding: landscape ? "0 40px" : "0 100px 0 40px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 14,
          background: "rgba(6, 10, 22, 0.94)",
          border: `1.5px solid ${accent}55`,
          padding: landscape ? "12px 24px" : "14px 28px",
          borderRadius: 18,
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.70), 0 0 20px ${accent}25`,
          fontFamily: CAPTION_FONT,
          fontSize: landscape ? 34 : 48,
          fontWeight: 900,
          lineHeight: 1.25,
          maxWidth: "92%",
          backdropFilter: "blur(16px)",
        }}
      >
        {currentChunk.map((w, i) => {
          const isActive = i === activeWordInChunk;
          const popColor = isHighEmphasisWord(w, emphasisWords) ? VIRAL_EMPHASIS_COLOR : accent;
          return (
            <span
              key={i}
              style={{
                color: isActive ? popColor : "#F1F5F9",
                opacity: isActive ? 1.0 : 0.85,
                transform: isActive ? "scale(1.22) translateY(-2px)" : "scale(1.0)",
                transition: "transform 0.06s ease-out, color 0.06s ease-out",
                textShadow: isActive
                  ? `0 0 28px ${popColor}, 0 0 10px ${popColor}, 0 3px 12px rgba(0,0,0,0.9)`
                  : "0 2px 8px rgba(0,0,0,0.85)",
                display: "inline-block",
                letterSpacing: "0.02em",
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
