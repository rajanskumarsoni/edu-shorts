import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec, ScreenshotStep, ScreenshotPoint } from "../types";
import { useLayout } from "../layout";
import { FONT } from "../theme";

function containRect(
  imgW: number,
  imgH: number,
  cvW: number,
  cvH: number
): { x: number; y: number; w: number; h: number } {
  const imgAspect = imgW / imgH;
  const cvAspect = cvW / cvH;
  if (imgAspect > cvAspect) {
    const w = cvW;
    const h = cvW / imgAspect;
    return { x: 0, y: (cvH - h) / 2, w, h };
  } else {
    const h = cvH;
    const w = cvH * imgAspect;
    return { x: (cvW - w) / 2, y: 0, w, h };
  }
}

interface TimedStep {
  step: ScreenshotStep;
  startFrame: number;
  endFrame: number;
  cursorBefore: ScreenshotPoint;
  cursorAfter: ScreenshotPoint;
}

export const ScreenshotScene: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, width: canvasW, height: canvasH } = useVideoConfig();
  const L = useLayout();
  const isVertical = !L.landscape;

  const imgPath = scene.image ? staticFile(scene.image) : "";
  const bgSize = scene.backgroundSize ?? (isVertical ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 });
  const rect = containRect(bgSize.width, bgSize.height, canvasW * 0.9, canvasH * (isVertical ? 0.72 : 0.78));

  const steps: ScreenshotStep[] = scene.screenshotSteps ?? [
    { kind: "cursor_move", to: [0.5, 0.45], durationSeconds: 0.8 },
    { kind: "click_pulse", at: [0.5, 0.45], durationSeconds: 0.4, color: accent },
    { kind: "type_into", region: { x: 0.25, y: 0.42, w: 0.5, h: 0.08 }, text: "Explain Neural Networks in 60s", typeSpeed: 0.04 },
    { kind: "cursor_move", to: [0.72, 0.45], durationSeconds: 0.6 },
    { kind: "click_pulse", at: [0.72, 0.45], durationSeconds: 0.4, color: "#00F5A0" },
    { kind: "bubble_append", region: { x: 0.2, y: 0.56, w: 0.6, h: 0.16 }, text: "Neural networks adjust weights using gradient descent.", role: "assistant", durationSeconds: 1.2 },
    { kind: "highlight_box", region: { x: 0.18, y: 0.54, w: 0.64, h: 0.2 }, durationSeconds: 2.0, color: accent },
  ];

  // Walk timeline
  const timed: TimedStep[] = [];
  let currentPos: ScreenshotPoint = [0.8, 0.2];
  let cursorF = 15;

  for (const step of steps) {
    let dur = 0;
    const before = currentPos;
    let after = currentPos;

    switch (step.kind) {
      case "cursor_move":
        dur = Math.ceil((step.durationSeconds ?? 0.8) * fps);
        after = step.to;
        currentPos = after;
        break;
      case "click_pulse":
        dur = Math.ceil((step.durationSeconds ?? 0.4) * fps);
        if (step.at) {
          after = step.at;
          currentPos = after;
        }
        break;
      case "type_into": {
        const speed = step.typeSpeed ?? 0.04;
        dur = Math.ceil((step.text.length * speed + 0.3) * fps);
        break;
      }
      case "bubble_append":
        dur = Math.ceil((step.durationSeconds ?? 1.0) * fps);
        break;
      case "typing_dots":
        dur = Math.ceil((step.durationSeconds ?? 1.2) * fps);
        break;
      case "highlight_box":
        dur = Math.ceil((step.durationSeconds ?? 1.5) * fps);
        break;
      case "callout_balloon":
        dur = Math.ceil((step.durationSeconds ?? 1.8) * fps);
        break;
      case "pause":
        dur = Math.ceil(step.seconds * fps);
        break;
    }

    timed.push({
      step,
      startFrame: cursorF,
      endFrame: cursorF + dur,
      cursorBefore: before,
      cursorAfter: after,
    });

    cursorF += dur;
  }

  // Calculate current cursor position
  let cursorX = 0.8;
  let cursorY = 0.2;
  for (const item of timed) {
    if (frame >= item.startFrame && frame <= item.endFrame) {
      if (item.step.kind === "cursor_move") {
        const t = (frame - item.startFrame) / Math.max(1, item.endFrame - item.startFrame);
        const smoothT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        cursorX = item.cursorBefore[0] + (item.cursorAfter[0] - item.cursorBefore[0]) * smoothT;
        cursorY = item.cursorBefore[1] + (item.cursorAfter[1] - item.cursorBefore[1]) * smoothT;
      } else {
        cursorX = item.cursorAfter[0];
        cursorY = item.cursorAfter[1];
      }
      break;
    } else if (frame > item.endFrame) {
      cursorX = item.cursorAfter[0];
      cursorY = item.cursorAfter[1];
    }
  }

  const cursorScreenX = rect.x + cursorX * rect.w;
  const cursorScreenY = rect.y + cursorY * rect.h;

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

      {/* Main Container */}
      <div
        style={{
          width: rect.w,
          height: rect.h,
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: `0 30px 90px rgba(0,0,0,0.7), 0 0 40px ${accent}25`,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "#10141E",
        }}
      >
        {/* Backdrop screenshot image */}
        {imgPath ? (
          <Img
            src={imgPath}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #0B0F1A 0%, #161F30 100%)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#64748B",
              fontSize: 24,
            }}
          >
            {scene.title || "Interactive UI Interface"}
          </div>
        )}

        {/* Step Overlays */}
        {timed.map((item, idx) => {
          if (frame < item.startFrame) return null;
          const { step } = item;

          if (step.kind === "click_pulse" && frame <= item.endFrame) {
            const p = (frame - item.startFrame) / Math.max(1, item.endFrame - item.startFrame);
            const rSize = interpolate(p, [0, 1], [0, 90]);
            const rAlpha = interpolate(p, [0, 1], [0.8, 0]);
            const pt = step.at ?? item.cursorBefore;
            return (
              <div
                key={`click-${idx}`}
                style={{
                  position: "absolute",
                  left: pt[0] * rect.w - rSize / 2,
                  top: pt[1] * rect.h - rSize / 2,
                  width: rSize,
                  height: rSize,
                  borderRadius: "50%",
                  border: `3px solid ${step.color ?? accent}`,
                  opacity: rAlpha,
                  pointerEvents: "none",
                }}
              />
            );
          }

          if (step.kind === "type_into") {
            const p = interpolate(frame, [item.startFrame, item.endFrame], [0, step.text.length], {
              extrapolateRight: "clamp",
            });
            const typed = step.text.slice(0, Math.floor(p));
            return (
              <div
                key={`type-${idx}`}
                style={{
                  position: "absolute",
                  left: step.region.x * rect.w,
                  top: step.region.y * rect.h,
                  width: step.region.w * rect.w,
                  height: step.region.h * rect.h,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 12px",
                  color: step.color ?? "#FFFFFF",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: isVertical ? 18 : 22,
                  background: "rgba(15, 23, 42, 0.75)",
                  borderRadius: 8,
                  border: `1px solid ${accent}50`,
                }}
              >
                {typed}
              </div>
            );
          }

          if (step.kind === "bubble_append") {
            const inSpring = spring({
              frame: frame - item.startFrame,
              fps,
              config: { damping: 14, stiffness: 120 },
            });
            return (
              <div
                key={`bubble-${idx}`}
                style={{
                  position: "absolute",
                  left: step.region.x * rect.w,
                  top: step.region.y * rect.h,
                  width: step.region.w * rect.w,
                  minHeight: step.region.h * rect.h,
                  padding: "16px 20px",
                  background: step.role === "assistant" ? "#1E293B" : `${accent}25`,
                  border: `1px solid ${accent}80`,
                  borderRadius: 14,
                  color: "#F8FAFC",
                  fontSize: isVertical ? 17 : 20,
                  lineHeight: 1.5,
                  transform: `scale(${inSpring})`,
                  opacity: inSpring,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                }}
              >
                {step.text}
              </div>
            );
          }

          if (step.kind === "highlight_box" && frame <= item.endFrame) {
            const pulse = 0.5 + 0.5 * Math.sin((frame - item.startFrame) * 0.2);
            return (
              <div
                key={`highlight-${idx}`}
                style={{
                  position: "absolute",
                  left: step.region.x * rect.w,
                  top: step.region.y * rect.h,
                  width: step.region.w * rect.w,
                  height: step.region.h * rect.h,
                  borderRadius: 10,
                  border: `2px solid ${step.color ?? accent}`,
                  boxShadow: `0 0 ${15 * pulse}px ${step.color ?? accent}`,
                  pointerEvents: "none",
                }}
              />
            );
          }

          return null;
        })}

        {/* Animated Mouse Cursor Pointer */}
        <div
          style={{
            position: "absolute",
            left: cursorX * rect.w,
            top: cursorY * rect.h,
            width: 28,
            height: 28,
            transform: "translate(-2px, -2px)",
            pointerEvents: "none",
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.8))",
            zIndex: 100,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
              fill="#FFFFFF"
              stroke="#08090D"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};
