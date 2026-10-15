import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { FONT } from "../theme";
import { MotionGraphic } from "../MotionGraphic";

// Fast, lightweight token highlighter for tech explainer aesthetics
function highlightSyntax(line: string, accent: string): React.ReactNode[] {
  // Regex to split into tokens: strings, keywords, numbers, comments, symbols
  const tokenRegex =
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|#.*|\/\/.*|\b(?:def|class|return|import|from|async|await|const|let|var|function|if|else|for|while|try|catch|select|from|where|insert|update|delete|join|group\s+by|order\s+by)\b|\b\d+(?:\.\d+)?\b|[a-zA-Z_]\w*(?=\()|[a-zA-Z_]\w*|[^a-zA-Z0-9_\s])/gi;

  const parts = line.split(tokenRegex);
  return parts.filter(Boolean).map((part, i) => {
    // Comments
    if (part.startsWith("#") || part.startsWith("//")) {
      return (
        <span key={i} style={{ color: "#6A737D", fontStyle: "italic" }}>
          {part}
        </span>
      );
    }
    // Strings
    if (
      (part.startsWith('"') && part.endsWith('"')) ||
      (part.startsWith("'") && part.endsWith("'"))
    ) {
      return (
        <span key={i} style={{ color: "#98C379" }}>
          {part}
        </span>
      );
    }
    // Keywords
    if (
      /^(def|class|return|import|from|async|await|const|let|var|function|if|else|for|while|try|catch|select|where|join)$/i.test(
        part
      )
    ) {
      return (
        <span key={i} style={{ color: "#C678DD", fontWeight: 700 }}>
          {part}
        </span>
      );
    }
    // Numbers
    if (/^\d+(?:\.\d+)?$/.test(part)) {
      return (
        <span key={i} style={{ color: "#E5C07B" }}>
          {part}
        </span>
      );
    }
    // Highlighted function call
    if (/^[A-Za-z_]\w*$/.test(part) && line.includes(part + "(")) {
      return (
        <span key={i} style={{ color: accent, fontWeight: 600 }}>
          {part}
        </span>
      );
    }
    // Default symbol or identifier
    return (
      <span key={i} style={{ color: "#E0E6F0" }}>
        {part}
      </span>
    );
  });
}

export const CodeScene: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();

  // Extract lines from scene.lines or multiline scene.code
  const codeLines: string[] = scene.lines
    ? scene.lines
    : scene.code
    ? scene.code.split("\n")
    : ["# Code block", "def execute():", "    return True"];

  const filename = scene.filename ?? "solution.py";
  const language = (scene.language ?? "PYTHON").toUpperCase();

  const highlightLines = Array.isArray(scene.highlight)
    ? scene.highlight
    : typeof scene.highlight === "number"
    ? [scene.highlight]
    : [];

  const lineRevealStep = (durationInFrames * 0.5) / Math.max(codeLines.length, 1);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
        fontFamily: FONT,
      }}
    >
      {/* Scene Header */}
      {scene.title && (
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 28,
              fontWeight: 800,
              color: accent,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 10,
              opacity: 0.9,
            }}
          >
            {`// ${language} IMPLEMENTATION`}
          </div>
          <RevealText
            text={scene.title}
            align="left"
            style={{
              fontSize: L.landscape ? 64 : 76,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1.1,
              textShadow: "0 8px 30px rgba(0,0,0,0.6)",
            }}
          />
        </div>
      )}

      {/* macOS IDE Terminal Window */}
      <div
        style={{
          background: "rgba(13, 17, 28, 0.94)",
          backdropFilter: "blur(24px)",
          borderRadius: 24,
          border: "1px solid rgba(255, 255, 255, 0.14)",
          boxShadow: `0 30px 60px rgba(0, 0, 0, 0.7), 0 0 40px ${accent}22`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Window Chrome Titlebar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(255, 255, 255, 0.03)",
          }}
        >
          {/* Traffic Light Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#FF5F56",
                boxShadow: "0 0 8px #FF5F5688",
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#FFBD2E",
                boxShadow: "0 0 8px #FFBD2E88",
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#27C93F",
                boxShadow: "0 0 8px #27C93F88",
              }}
            />
          </div>

          {/* Active File Tab */}
          {/* Filename tab with Semantic Motion Graphic */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 20px",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.08)",
              fontFamily: "monospace",
              fontSize: 28,
              color: "#E2E8F0",
              fontWeight: 700,
            }}
          >
            <MotionGraphic
              icon={scene.icon ?? "terminal"}
              accent={accent}
              size="xs"
              showPedestal={false}
              showRadar={false}
            />
            {filename}
          </div>

          {/* Language Pill */}
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 28,
              fontWeight: 800,
              padding: "6px 16px",
              borderRadius: 8,
              background: `${accent}22`,
              border: `1.5px solid ${accent}55`,
              color: accent,
              letterSpacing: 1,
            }}
          >
            {language}
          </div>
        </div>

        {/* Code Content Body */}
        <div
          style={{
            padding: "28px 24px",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontSize: L.landscape ? 24 : 27,
            lineHeight: 1.6,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {codeLines.map((line, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = highlightLines.includes(lineNum);
            const lineStartFrame = 10 + idx * lineRevealStep;

            const revealSpring = spring({
              frame: frame - lineStartFrame,
              fps,
              config: { damping: 16, stiffness: 120 },
            });

            if (frame < lineStartFrame) {
              return null;
            }

            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: 8,
                  padding: "4px 12px",
                  background: isHighlighted
                    ? `${accent}18`
                    : "transparent",
                  borderLeft: isHighlighted
                    ? `4px solid ${accent}`
                    : "4px solid transparent",
                  boxShadow: isHighlighted ? `inset 0 0 20px ${accent}11` : "none",
                  opacity: revealSpring,
                  transform: `translateX(${(1 - revealSpring) * 16}px)`,
                }}
              >
                {/* Line Number */}
                <div
                  style={{
                    width: 54,
                    color: isHighlighted ? accent : "#4B5568",
                    fontSize: 28,
                    fontWeight: isHighlighted ? 800 : 600,
                    userSelect: "none",
                  }}
                >
                  {lineNum.toString().padStart(2, "0")}
                </div>

                {/* Line Text */}
                <div style={{ flex: 1, whiteSpace: "pre", overflow: "hidden" }}>
                  {highlightSyntax(line, accent)}
                </div>
              </div>
            );
          })}

          {/* Active Blinking Terminal Cursor */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              paddingLeft: 56,
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: 12,
                height: 24,
                background: accent,
                opacity: Math.sin(frame / 4) > 0 ? 1 : 0,
                boxShadow: `0 0 10px ${accent}`,
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
