import React, { useEffect, useRef } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { FONT } from "../theme";
import * as brush from "p5.brush/standalone";

export const WhiteboardScene: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const L = useLayout();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isLandscape = L.landscape;
  const whiteboardType = scene.whiteboardType || "algorithm";
  const themeType = scene.whiteboardTheme || scene.paper || "chalkboard";

  const isChalk = themeType === "chalkboard";
  const isGrid = themeType === "grid";

  const imageSource = scene.image || scene.diagram;
  const imageUrl = imageSource ? staticFile(imageSource) : null;
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const imgScale = interpolate(frame, [0, durationInFrames], [0.98, 1.02]);

  // Palette colors based on chalkboard vs whiteboard paper
  const bgColor = isChalk ? "#0B1020" : isGrid ? "#0D1527" : "#F7F5EE";
  const primaryStroke = isChalk ? "#FFFFFF" : "#1A202C";
  const accentStroke = isChalk ? (accent || "#00F0FF") : "#0284C7";
  const secondaryStroke = isChalk ? "#F59E0B" : "#D97706";
  const tertiaryStroke = isChalk ? "#EC4899" : "#BE185D";

  const activeBrush = scene.brushName || (isChalk ? "2B" : "rotring");

  // Normalized animation progress (first 45 frames for primary drawing)
  const drawProgress = interpolate(frame, [0, Math.min(45, durationInFrames - 10)], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const secondaryProgress = interpolate(frame, [15, Math.min(60, durationInFrames - 5)], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  // Run p5.brush standalone WebGL drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      brush.load(canvas);
      brush.scaleBrushes(isLandscape ? 2.5 : 3.2);
      brush.clear(bgColor);

      if (imageUrl) {
        // If image is present, draw a tactile chalk underline for the title
        if (drawProgress > 0.05) {
          brush.set("2B", accentStroke, 1.8);
          const lineY = isLandscape ? -height / 2 + 150 : -height / 2 + 230;
          const lineW = Math.min(width * 0.7, 720) * drawProgress;
          brush.line(-lineW / 2, lineY, lineW / 2, lineY);
        }
        brush.render();
        return;
      }

      const cx = 0; // In standalone WEBGL canvas, origin (0, 0) is canvas center
      const cy = isLandscape ? -20 : -50;

      if (whiteboardType === "algorithm" || whiteboardType === "sorting") {
        // Hand-drawn sorting/array visualization
        const defaultData = [
          { val: 64, label: "64", highlight: false },
          { val: 34, label: "34", highlight: true },
          { val: 25, label: "25", highlight: true },
          { val: 12, label: "12", highlight: false },
          { val: 22, label: "22", highlight: false },
        ];
        const data = scene.whiteboardData && scene.whiteboardData.length > 0
          ? scene.whiteboardData.map((d, i) => ({
              val: typeof d.value === "number" ? d.value : (i + 1) * 20,
              label: String(d.value ?? d.label ?? ""),
              highlight: Boolean(d.highlight),
            }))
          : defaultData;

        const count = data.length;
        const barWidth = isLandscape ? 110 : 130;
        const barGap = isLandscape ? 30 : 35;
        const totalW = count * barWidth + (count - 1) * barGap;
        const startX = -totalW / 2 + barWidth / 2;

        // Base ground line
        brush.set(activeBrush, primaryStroke, 1.2);
        brush.line(-totalW / 2 - 40, cy + 220, totalW / 2 + 40, cy + 220);

        data.forEach((item, idx) => {
          const x = startX + idx * (barWidth + barGap);
          const maxH = 260;
          const barH = (item.val / 80) * maxH * drawProgress;
          const y = cy + 220 - barH / 2;

          if (item.highlight) {
            // Watercolor wash & hatching for active elements
            brush.fill(accentStroke, 40);
            brush.fillBleed(0.15);
            brush.set("rotring", accentStroke, 1.4);
            brush.hatch(12, 45);
            brush.rect(x - barWidth / 2, cy + 220 - barH, barWidth, barH);
            brush.noHatch();
            brush.noFill();
          } else {
            brush.set(activeBrush, primaryStroke, 1.0);
            brush.noFill();
            brush.rect(x - barWidth / 2, cy + 220 - barH, barWidth, barH);
          }
        });

        // Swap / comparison arc
        if (secondaryProgress > 0.1) {
          const idxA = 1;
          const idxB = 2;
          const xA = startX + idxA * (barWidth + barGap);
          const xB = startX + idxB * (barWidth + barGap);
          const midX = (xA + xB) / 2;
          const arcY = cy + 220 - 240;

          brush.set("2B", secondaryStroke, 2.0);
          brush.spline([
            [xA, cy + 20],
            [xA + 15, arcY],
            [midX, arcY - 30],
            [xB - 15, arcY],
            [xB, cy + 20],
          ]);
        }
      } else if (whiteboardType === "architecture" || whiteboardType === "flow") {
        // Hand-drawn architecture boxes connected with organic lines
        // Fully responsive: horizontal in landscape, vertical stacked in 9:16 portrait
        const nodes = isLandscape
          ? [
              { name: "CLIENT APP", x: -280, y: cy - 140, color: primaryStroke },
              { name: "API GATEWAY", x: 0, y: cy - 140, color: accentStroke },
              { name: "MICROSERVICE", x: 0, y: cy + 120, color: secondaryStroke },
              { name: "DATABASE", x: 280, y: cy + 120, color: tertiaryStroke },
            ]
          : [
              { name: "CLIENT APP", x: 0, y: cy - 280, color: primaryStroke },
              { name: "API GATEWAY", x: 0, y: cy - 90, color: accentStroke },
              { name: "MICROSERVICE", x: 0, y: cy + 100, color: secondaryStroke },
              { name: "DATABASE", x: 0, y: cy + 290, color: tertiaryStroke },
            ];

        // Box width and height
        const bw = isLandscape ? 200 : 340;
        const bh = isLandscape ? 110 : 110;

        nodes.forEach((n) => {
          brush.fill(n.color, 25);
          brush.fillBleed(0.2);
          brush.set(activeBrush, n.color, 1.4);
          brush.rect(n.x - bw / 2, n.y - bh / 2, bw, bh);
          brush.noFill();
        });

        // Connecting lines with arrows
        brush.set("HB", primaryStroke, 1.6);
        if (isLandscape) {
          brush.line(-280 + bw / 2, cy - 140, 0 - bw / 2, cy - 140);
          brush.line(0, cy - 140 + bh / 2, 0, cy + 120 - bh / 2);
          brush.line(0 + bw / 2, cy + 120, 280 - bw / 2, cy + 120);

          if (secondaryProgress > 0.2) {
            brush.set("2B", accentStroke, 2.2);
            brush.spline([
              [-280, cy - 60],
              [-140, cy],
              [0, cy - 10],
              [140, cy + 50],
              [280, cy + 40],
            ]);
          }
        } else {
          // Vertical downward connections for 9:16 portrait
          brush.line(0, cy - 280 + bh / 2, 0, cy - 90 - bh / 2);
          brush.line(0, cy - 90 + bh / 2, 0, cy + 100 - bh / 2);
          brush.line(0, cy + 100 + bh / 2, 0, cy + 290 - bh / 2);

          if (secondaryProgress > 0.2) {
            brush.set("2B", accentStroke, 2.2);
            brush.spline([
              [-20, cy - 180],
              [20, cy],
              [-20, cy + 190],
            ]);
          }
        }
      } else if (whiteboardType === "infographic") {
        // Multi-stage chalkboard infographic pipeline
        if (!isLandscape) {
          // 9:16 Vertical: 3 stacked cards with downward chalk flow
          const cardW = 380;
          const cardH = 140;
          const steps = [
            { y: cy - 250, label: "01", color: accentStroke },
            { y: cy, label: "02", color: secondaryStroke },
            { y: cy + 250, label: "03", color: tertiaryStroke },
          ];

          steps.forEach((s) => {
            brush.fill(s.color, 20);
            brush.fillBleed(0.15);
            brush.set(activeBrush, s.color, 1.4);
            brush.rect(-cardW / 2, s.y - cardH / 2, cardW, cardH);
            brush.noFill();

            // Step badge ring
            brush.set("rotring", primaryStroke, 1.6);
            brush.circle(-cardW / 2 + 40, s.y, 22);
          });

          // Downward connecting arrows
          if (secondaryProgress > 0.15) {
            brush.set("2B", primaryStroke, 2.0);
            brush.line(0, cy - 250 + cardH / 2 + 10, 0, cy - cardH / 2 - 10);
            brush.line(0, cy + cardH / 2 + 10, 0, cy + 250 - cardH / 2 - 10);
          }
        } else {
          // 16:9 Landscape: 3 horizontal cards
          const cardW = 320;
          const cardH = 190;
          const steps = [
            { x: -360, label: "01", color: accentStroke },
            { x: 0, label: "02", color: secondaryStroke },
            { x: 360, label: "03", color: tertiaryStroke },
          ];

          steps.forEach((s) => {
            brush.fill(s.color, 20);
            brush.fillBleed(0.15);
            brush.set(activeBrush, s.color, 1.4);
            brush.rect(s.x - cardW / 2, cy - cardH / 2, cardW, cardH);
            brush.noFill();

            // Step badge ring
            brush.set("rotring", primaryStroke, 1.6);
            brush.circle(s.x - cardW / 2 + 40, cy - cardH / 2 + 40, 22);
          });

          // Rightward connecting arrows
          if (secondaryProgress > 0.15) {
            brush.set("2B", primaryStroke, 2.0);
            brush.line(-360 + cardW / 2 + 15, cy, -cardW / 2 - 15, cy);
            brush.line(cardW / 2 + 15, cy, 360 - cardW / 2 - 15, cy);
          }
        }
      } else if (whiteboardType === "radial" || whiteboardType === "loop") {
        // Radial chalk loop with central hub and stations
        const hubRadius = isLandscape ? 80 : 100;
        brush.fill(accentStroke, 30);
        brush.fillBleed(0.2);
        brush.set(activeBrush, accentStroke, 1.8);
        brush.circle(0, cy, hubRadius);
        brush.noFill();

        const orbitR = isLandscape ? 260 : 340;
        const stationAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
        const stationColors = [primaryStroke, secondaryStroke, tertiaryStroke, primaryStroke];

        stationAngles.forEach((ang, i) => {
          const sx = Math.cos(ang) * orbitR;
          const sy = cy + Math.sin(ang) * (isLandscape ? orbitR * 0.75 : orbitR);
          brush.fill(stationColors[i], 20);
          brush.set("rotring", stationColors[i], 1.4);
          brush.rect(sx - 65, sy - 45, 130, 90);
          brush.noFill();
        });

        // Curved orbital loop arrows
        if (secondaryProgress > 0.2) {
          brush.set("2B", primaryStroke, 1.6);
          brush.spline([
            [orbitR * 0.7, cy - (isLandscape ? orbitR * 0.5 : orbitR * 0.7)],
            [0, cy - (isLandscape ? orbitR * 0.8 : orbitR * 1.05)],
            [-orbitR * 0.7, cy - (isLandscape ? orbitR * 0.5 : orbitR * 0.7)],
          ]);
          brush.spline([
            [-orbitR * 0.7, cy + (isLandscape ? orbitR * 0.5 : orbitR * 0.7)],
            [0, cy + (isLandscape ? orbitR * 0.8 : orbitR * 1.05)],
            [orbitR * 0.7, cy + (isLandscape ? orbitR * 0.5 : orbitR * 0.7)],
          ]);
        }
      } else if (whiteboardType === "comparison") {
        // Chalk comparison (side-by-side in landscape, stacked in vertical)
        if (!isLandscape) {
          // 9:16 Vertical: Top vs Bottom
          const cardW = 380;
          const cardH = 210;
          // Top Card
          brush.fill(accentStroke, 20);
          brush.set(activeBrush, accentStroke, 1.4);
          brush.rect(-cardW / 2, cy - 150 - cardH / 2, cardW, cardH);
          brush.noFill();

          // Bottom Card
          brush.fill(secondaryStroke, 20);
          brush.set(activeBrush, secondaryStroke, 1.4);
          brush.rect(-cardW / 2, cy + 150 - cardH / 2, cardW, cardH);
          brush.noFill();

          // Horizontal dashed divider line
          brush.set("HB", primaryStroke, 1.6);
          brush.line(-cardW / 2 - 20, cy, cardW / 2 + 20, cy);
        } else {
          // 16:9 Landscape: Left vs Right
          const cardW = 380;
          const cardH = 260;
          // Left Card
          brush.fill(accentStroke, 20);
          brush.set(activeBrush, accentStroke, 1.4);
          brush.rect(-cardW - 40, cy - cardH / 2, cardW, cardH);
          brush.noFill();

          // Right Card
          brush.fill(secondaryStroke, 20);
          brush.set(activeBrush, secondaryStroke, 1.4);
          brush.rect(40, cy - cardH / 2, cardW, cardH);
          brush.noFill();

          // Vertical dashed divider line
          brush.set("HB", primaryStroke, 1.6);
          brush.line(0, cy - cardH / 2 - 20, 0, cy + cardH / 2 + 20);
        }
      } else if (whiteboardType === "math") {
        // Hand-drawn coordinate plane and curve
        brush.set(activeBrush, primaryStroke, 1.2);
        // X and Y axes
        brush.line(-360, cy + 100, 360, cy + 100);
        brush.line(-300, cy - 220, -300, cy + 220);

        // Function curve
        brush.set("2B", accentStroke, 2.4);
        const pts: [number, number][] = [];
        for (let x = -280; x <= 320; x += 40) {
          const normX = (x + 280) / 600;
          if (normX <= drawProgress) {
            const y = cy + 100 - Math.sin(normX * Math.PI) * 260;
            pts.push([x, y]);
          }
        }
        if (pts.length >= 2) {
          brush.spline(pts);
        }

        // Tangent slope indicator
        if (secondaryProgress > 0.3) {
          brush.set("rotring", secondaryStroke, 1.6);
          brush.line(-20, cy - 80, 160, cy - 220);
        }
      } else {
        // Freehand / generic custom strokes
        if (scene.strokes && scene.strokes.length > 0) {
          scene.strokes.forEach((s) => {
            brush.set(s.brush || activeBrush, s.color || primaryStroke, s.weight || 1.4);
            if (s.fill) {
              brush.fill(s.fill, 30);
            }
            if (s.hatchAngle) {
              brush.hatch(s.hatchDist || 14, s.hatchAngle);
            }

            if (s.type === "line" && s.from && s.to) {
              brush.line(s.from[0], s.from[1], s.to[0], s.to[1]);
            } else if (s.type === "rect" && s.from && s.width && s.height) {
              brush.rect(s.from[0], s.from[1], s.width, s.height);
            } else if (s.type === "circle" && s.center && s.radius) {
              brush.circle(s.center[0], s.center[1], s.radius);
            } else if (s.type === "spline" && s.points) {
              brush.spline(s.points);
            }

            brush.noFill();
            brush.noHatch();
          });
        }
      }

      brush.render();
    } catch (err) {
      console.warn("p5.brush canvas render warning:", err);
    }
  }, [frame, drawProgress, secondaryProgress, whiteboardType, themeType, activeBrush, bgColor, primaryStroke, accentStroke, secondaryStroke, tertiaryStroke, isLandscape, scene]);

  // Subtle paper texture & grid styling
  const gridBackground = isGrid
    ? "radial-gradient(circle, rgba(0,240,255,0.12) 1.5px, transparent 1.5px)"
    : isChalk
    ? "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)"
    : "radial-gradient(circle, rgba(0,0,0,0.06) 1.5px, transparent 1.5px)";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        backgroundImage: gridBackground,
        backgroundSize: "36px 36px",
        overflow: "hidden",
        fontFamily: FONT,
      }}
    >
      {/* Top Header Tag Zone (y < 180px safe zone) */}
      <div
        style={{
          position: "absolute",
          top: isLandscape ? 40 : 80,
          left: isLandscape ? 80 : 60,
          right: isLandscape ? 80 : 60,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 10,
        }}
      >
        {scene.tag && (
          <div
            style={{
              fontSize: isLandscape ? 18 : 24,
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: isChalk ? (accent || "#00F0FF") : "#0284C7",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: isChalk ? (accent || "#00F0FF") : "#0284C7",
                display: "inline-block",
                boxShadow: isChalk ? `0 0 10px ${accent || "#00F0FF"}` : "none",
              }}
            />
            {scene.tag}
          </div>
        )}

        {scene.title && (
          <h1
            style={{
              margin: 0,
              fontSize: isLandscape ? 38 : 50,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: isChalk ? "#FFFFFF" : "#0F172A",
              maxWidth: isLandscape ? "80%" : "95%",
            }}
          >
            <RevealText text={scene.title} delay={2} />
          </h1>
        )}
      </div>

      {/* Main p5.brush WebGL Canvas */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: width,
          height: height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      </div>

      {/* If scene.image or scene.diagram is provided (chalkboard infographic asset), render with frame inside safe zone */}
      {imageUrl && (
        <div
          style={{
            position: "absolute",
            top: isLandscape ? 130 : 200,
            bottom: isLandscape ? (scene.equation ? 140 : 60) : (scene.equation ? 470 : 380),
            left: isLandscape ? 80 : 48,
            right: isLandscape ? 80 : 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5,
            opacity: enter,
            transform: `scale(${imgScale})`,
          }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "100%",
              maxHeight: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 24,
              overflow: "hidden",
              border: isChalk ? "2px solid rgba(255, 255, 255, 0.15)" : "2px solid rgba(0, 0, 0, 0.12)",
              boxShadow: isChalk
                ? "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 240, 255, 0.08)"
                : "0 20px 50px rgba(0, 0, 0, 0.1)",
              backgroundColor: isChalk ? "#0B1020" : "#F7F5EE",
            }}
          >
            <Img
              src={imageUrl}
              style={{
                maxWidth: "100%",
                maxHeight: isLandscape ? 760 : 1240,
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
        </div>
      )}

      {/* Equation / Callout HUD Badge */}
      {scene.equation && (
        <div
          style={{
            position: "absolute",
            bottom: isLandscape ? 80 : 420, // Above bottom 350px caption safe zone
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: isChalk ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.92)",
            border: `2px solid ${isChalk ? "rgba(0, 240, 255, 0.4)" : "rgba(2, 132, 199, 0.4)"}`,
            boxShadow: isChalk ? "0 0 30px rgba(0, 240, 255, 0.2)" : "0 8px 30px rgba(0, 0, 0, 0.08)",
            borderRadius: 20,
            padding: "16px 36px",
            fontSize: isLandscape ? 28 : 36,
            fontWeight: 800,
            fontFamily: "monospace",
            color: isChalk ? "#FFFFFF" : "#0F172A",
            zIndex: 15,
            whiteSpace: "nowrap",
          }}
        >
          {scene.equation}
        </div>
      )}
    </AbsoluteFill>
  );
};
