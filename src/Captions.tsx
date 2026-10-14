import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT } from "./theme";

const DEVA_CONSONANTS: Record<string, string> = {
  "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
  "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
  "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
  "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
  "प": "p", "फ": "f", "ब": "b", "भ": "bh", "म": "m",
  "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh", "ष": "sh", "स": "s", "ह": "h",
  "ड़": "r", "ढ़": "rh", "फ़": "f", "ज़": "z", "ख़": "kh", "ग़": "gh", "क़": "q",
};

const DEVA_VOWELS: Record<string, string> = {
  "अ": "a", "आ": "aa", "इ": "i", "ई": "ee", "उ": "u", "ऊ": "oo", "ऋ": "ri",
  "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "ऑ": "o", "ॲ": "e",
  "ा": "a", "ि": "i", "ी": "ee", "ु": "u", "ू": "oo", "ृ": "ri",
  "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ॉ": "o", "ॅ": "e",
  "ं": "n", "ँ": "n", "ः": "h", "़": "",
};

export function devanagariToRoman(text: string): string {
  if (!/[\u0900-\u097F]/.test(text)) return text;

  let out = "";
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1] || "";

    if (DEVA_CONSONANTS[ch]) {
      const rom = DEVA_CONSONANTS[ch];
      if (next === "्") {
        out += rom;
        i++; // skip virama
      } else if (DEVA_VOWELS[next]) {
        out += rom;
      } else {
        out += rom + (next && !/[\s,.!?;:]/.test(next) ? "a" : "");
      }
    } else if (DEVA_VOWELS[ch]) {
      out += DEVA_VOWELS[ch];
    } else if (ch === "्") {
      // already handled
    } else if (ch === "।") {
      out += ".";
    } else {
      out += ch;
    }
  }
  return out;
}

interface CaptionsProps {
  narration?: string;
  durationInFrames: number;
  accent: string;
}

export const Captions: React.FC<CaptionsProps> = ({
  narration,
  durationInFrames,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const landscape = width > height;

  if (!narration || !narration.trim()) return null;

  // Convert Devanagari to clean Roman/Hinglish text so visuals are strictly in Latin characters
  const romanized = devanagariToRoman(narration.trim());
  const words = romanized.split(/\s+/);
  if (words.length === 0) return null;

  // Chunk words into phrases of 4 to 6 words
  const chunkSize = 5;
  const chunks: string[][] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize));
  }

  // Active phrase index based on scene frame progress
  const activeFraction = Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames)));
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
          background: "rgba(11, 16, 32, 0.88)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          padding: "16px 36px",
          borderRadius: 24,
          boxShadow: "0 14px 36px rgba(0, 0, 0, 0.75)",
          fontFamily: FONT,
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
