import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec, TerminalStep } from "../types";
import { useLayout } from "../layout";
import { FONT } from "../theme";

interface RenderedLine {
  text: string;
  isCmd: boolean;
  startFrame: number;
  endFrame: number;
}

interface RenderedPill {
  text: string;
  color: string;
  startFrame: number;
  endFrame: number;
}

export const TerminalScene: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();
  const isVertical = !L.landscape;

  const title = scene.title ?? "Terminal / Execution Pipeline";
  const prompt = scene.prompt ?? "$";
  const steps: TerminalStep[] = scene.terminalSteps ?? [
    { kind: "cmd", text: "git checkout -b feature/model-pipeline", typeSpeed: 0.035 },
    { kind: "out", text: "Switched to a new branch 'feature/model-pipeline'" },
    { kind: "pause", seconds: 0.4 },
    { kind: "cmd", text: "python train.py --epochs 100 --lr 0.001 --device cuda", typeSpeed: 0.03 },
    { kind: "out", text: "[INFO] Initializing PyTorch distributed backend..." },
    { kind: "pill", text: "GPU: NVIDIA A100 (80GB)", color: accent },
    { kind: "out", text: "[INFO] Epoch 100/100 | Loss: 0.0014 | Acc: 99.4%" },
    { kind: "pill", text: "Model Converged", color: "#00F5A0" },
  ];

  // Walk steps and lay out frame timestamps
  const lines: RenderedLine[] = [];
  const pills: RenderedPill[] = [];
  let cursorFrame = 10;

  for (const step of steps) {
    if (step.kind === "cmd") {
      const speed = step.typeSpeed ?? 0.035;
      const typeFrames = Math.max(1, Math.ceil(step.text.length * speed * fps));
      const hold = Math.ceil((step.holdSeconds ?? 0.3) * fps);
      lines.push({
        text: step.text,
        isCmd: true,
        startFrame: cursorFrame,
        endFrame: cursorFrame + typeFrames,
      });
      cursorFrame += typeFrames + hold;
    } else if (step.kind === "out") {
      const revealFrames = Math.max(2, Math.ceil(0.08 * fps));
      const hold = Math.ceil((step.holdSeconds ?? 0.2) * fps);
      lines.push({
        text: step.text,
        isCmd: false,
        startFrame: cursorFrame,
        endFrame: cursorFrame + revealFrames,
      });
      cursorFrame += revealFrames + hold;
    } else if (step.kind === "pause") {
      cursorFrame += Math.ceil(step.seconds * fps);
    } else if (step.kind === "pill") {
      const dur = Math.ceil((step.durationSeconds ?? 2.5) * fps);
      pills.push({
        text: step.text,
        color: step.color ?? accent,
        startFrame: cursorFrame,
        endFrame: cursorFrame + dur,
      });
    }
  }

  const visibleLines = lines.filter((l) => frame >= l.startFrame);
  const MAX_VISIBLE = isVertical ? 14 : 16;
  const scrollStart = Math.max(0, visibleLines.length - MAX_VISIBLE);
  const renderedLines = visibleLines.slice(scrollStart);

  const blinkPhase = Math.floor(frame / (fps * 0.5)) % 2 === 0;
  const windowSpring = spring({ frame, fps, config: { damping: 20, stiffness: 120 } });
  const windowOpacity = interpolate(windowSpring, [0, 1], [0, 1]);
  const windowScale = interpolate(windowSpring, [0, 1], [0.96, 1]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
        fontFamily: FONT,
      }}
    >
      {/* Upper Tag / Header */}
      {scene.tag && (
        <div
          style={{
            fontFamily: "monospace",
            fontSize: isVertical ? 24 : 26,
            fontWeight: 800,
            color: accent,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          {scene.tag}
        </div>
      )}

      {/* Terminal Window Frame */}
      <div
        style={{
          width: isVertical ? "96%" : "88%",
          maxWidth: 1600,
          height: isVertical ? "74%" : "78%",
          opacity: windowOpacity,
          transform: `scale(${windowScale})`,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 40px ${accent}20, 0 0 1px rgba(255,255,255,0.2) inset`,
          background: "#0D1117",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 20px",
            background: "#161B22",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            gap: 10,
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#FF5F56" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#27C93F" }} />
          <div
            style={{
              flex: 1,
              textAlign: "center",
              color: "#8B949E",
              fontSize: isVertical ? 18 : 20,
              fontFamily: "monospace",
              fontWeight: 600,
              letterSpacing: 0.5,
              paddingRight: 40,
            }}
          >
            {title}
          </div>
        </div>

        {/* Terminal Body */}
        <div
          style={{
            flex: 1,
            padding: isVertical ? "28px 24px" : "32px 40px",
            fontSize: isVertical ? 22 : 26,
            lineHeight: 1.6,
            color: "#C9D1D9",
            fontFamily: "'JetBrains Mono', 'Consolas', 'Courier New', monospace",
            overflow: "hidden",
          }}
        >
          {renderedLines.map((line, idx) => {
            if (line.isCmd) {
              const progress = interpolate(
                frame,
                [line.startFrame, line.endFrame],
                [0, line.text.length],
                { extrapolateRight: "clamp" }
              );
              const typed = line.text.slice(0, Math.floor(progress));
              const isLatest = idx === renderedLines.length - 1;
              const isActive = frame <= line.endFrame + fps * 0.3;

              return (
                <div key={`${line.startFrame}-${idx}`} style={{ display: "flex", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ color: accent, marginRight: 12, fontWeight: 700 }}>{prompt}</span>
                  <span style={{ color: "#F0F6FC", fontWeight: 500 }}>{typed}</span>
                  {isLatest && isActive && blinkPhase && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: isVertical ? 22 : 26,
                        background: accent,
                        marginLeft: 4,
                        transform: "translateY(3px)",
                        boxShadow: `0 0 10px ${accent}`,
                      }}
                    />
                  )}
                </div>
              );
            } else {
              const alpha = interpolate(frame, [line.startFrame, line.endFrame], [0, 1], {
                extrapolateRight: "clamp",
              });
              return (
                <div
                  key={`${line.startFrame}-${idx}`}
                  style={{ color: "#8B949E", opacity: alpha, paddingLeft: 6, marginBottom: 4 }}
                >
                  {line.text}
                </div>
              );
            }
          })}
        </div>

        {/* Floating Pills */}
        {pills
          .filter((p) => frame >= p.startFrame && frame <= p.endFrame)
          .map((pill, idx) => {
            const lifeProgress = (frame - pill.startFrame) / Math.max(1, pill.endFrame - pill.startFrame);
            const inSpring = spring({
              frame: frame - pill.startFrame,
              fps,
              config: { damping: 14, stiffness: 180 },
            });
            const outAlpha = lifeProgress > 0.85
              ? interpolate(lifeProgress, [0.85, 1], [1, 0], { extrapolateRight: "clamp" })
              : 1;
            const alpha = Math.min(inSpring, outAlpha);
            const translateY = interpolate(inSpring, [0, 1], [15, 0]);

            return (
              <div
                key={`${pill.startFrame}-${idx}`}
                style={{
                  position: "absolute",
                  top: 24 + idx * 56,
                  right: 24,
                  padding: "10px 18px",
                  background: pill.color,
                  color: "#08090D",
                  borderRadius: 999,
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: isVertical ? 16 : 18,
                  letterSpacing: 0.5,
                  opacity: alpha,
                  transform: `translateY(${translateY}px)`,
                  boxShadow: `0 10px 30px ${pill.color}50`,
                }}
              >
                {pill.text}
              </div>
            );
          })}
      </div>
    </AbsoluteFill>
  );
};
