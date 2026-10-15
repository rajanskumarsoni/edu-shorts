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

interface NodeDef {
  id: string;
  label: string;
  sub: string;
  layer: number;
  x: number;
  y: number;
}

interface SynapseDef {
  source: NodeDef;
  target: NodeDef;
  weight: number;
}

export const NeuralNetworkGraph: React.FC<{
  scene: SceneSpec;
  accent: string;
  mode?: "forward" | "backward" | "backprop";
}> = ({ scene, accent, mode: propMode }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const L = useLayout();

  // Determine mode from prop or scene attributes
  const isBackprop =
    propMode === "backward" ||
    propMode === "backprop" ||
    scene.variant === "backprop_3d" ||
    scene.variant === "backprop" ||
    /backprop|gradient|backward|chain rule/i.test(scene.tag || "") ||
    /backprop|gradient|backward|chain rule/i.test(scene.title || "");

  const mode = isBackprop ? "backward" : "forward";
  const primaryColor = isBackprop ? "#FF5555" : accent;
  const secondaryColor = isBackprop ? "#FFC857" : "#00F0FF";

  // Canvas layout dimensions
  const isLandscape = L.landscape;
  const canvasW = width;
  const canvasH = height;

  // Layer column definitions
  const layerCounts = [3, 4, 4, 2];
  const layerNames = isBackprop
    ? ["INPUT (X)", "HIDDEN 1 (W¹)", "HIDDEN 2 (W²)", "ERROR (∂L/∂ŷ)"]
    : ["INPUT LAYER", "HIDDEN LAYER 1", "HIDDEN LAYER 2", "OUTPUT (ŷ)"];

  // Calculate coordinates for nodes across layers
  const xOffset = isLandscape ? 320 : 130;
  const xSpacing = isLandscape ? 380 : 270;
  const centerY = isLandscape ? 580 : 980;

  const nodes: NodeDef[] = [];
  const layerNodes: NodeDef[][] = [];

  layerCounts.forEach((count, layerIdx) => {
    const x = xOffset + layerIdx * xSpacing;
    const ySpacing = isLandscape ? 140 : 180;
    const startY = centerY - ((count - 1) * ySpacing) / 2;

    const currentLayer: NodeDef[] = [];
    for (let nodeIdx = 0; nodeIdx < count; nodeIdx++) {
      const y = startY + nodeIdx * ySpacing;
      let label = "";
      let sub = "";

      if (layerIdx === 0) {
        label = `x${nodeIdx + 1}`;
        sub = "In";
      } else if (layerIdx === 1) {
        label = `h${nodeIdx + 1}`;
        sub = "W¹";
      } else if (layerIdx === 2) {
        label = `h${nodeIdx + 5}`;
        sub = "σ";
      } else {
        label = nodeIdx === 0 ? "ŷ₁" : "ŷ₂";
        sub = nodeIdx === 0 ? "0.94" : "0.06";
      }

      const node: NodeDef = {
        id: `L${layerIdx}_N${nodeIdx}`,
        label,
        sub,
        layer: layerIdx,
        x,
        y,
      };
      nodes.push(node);
      currentLayer.push(node);
    }
    layerNodes.push(currentLayer);
  });

  // Generate dense synapses between adjacent layers
  const synapses: SynapseDef[] = [];
  for (let l = 0; l < layerNodes.length - 1; l++) {
    const curr = layerNodes[l];
    const next = layerNodes[l + 1];
    curr.forEach((src, sIdx) => {
      next.forEach((tgt, tIdx) => {
        // Deterministic pseudo-weights for visualization
        const weight = ((sIdx * 7 + tIdx * 13) % 9) / 10 + 0.2;
        synapses.push({ source: src, target: tgt, weight });
      });
    });
  }

  // Entrance spring
  const intro = spring({ frame, fps, config: { damping: 18, stiffness: 100 } });

  // Progressive wave timing across 4 layers
  const cycleFrames = 75; // animation cycle duration in frames
  const loopProgress = (frame % cycleFrames) / cycleFrames;

  // Active layer wave
  const activeLayerIndex = isBackprop
    ? 3 - Math.floor(loopProgress * 4) // Right to Left
    : Math.floor(loopProgress * 4); // Left to Right

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0B1020",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {/* Background Cybernetic Grid */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.06) 0%, transparent 70%),
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 60px 60px, 60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* SVG Computational Synapse Mesh */}
      <svg
        width={canvasW}
        height={canvasH}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <defs>
          <filter id="glow-synapse" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Synaptic Connection Lines */}
        {synapses.map((syn, idx) => {
          const isLayerActive = isBackprop
            ? syn.target.layer === activeLayerIndex
            : syn.source.layer === activeLayerIndex;

          const baseOpacity = isLayerActive ? 0.85 : 0.22;
          const strokeColor = isBackprop
            ? isLayerActive
              ? "#FF5555"
              : "#642233"
            : isLayerActive
            ? accent
            : "#1B3B6F";

          const strokeWidth = isLayerActive ? 2.5 : 1.2;

          return (
            <line
              key={`syn-${idx}`}
              x1={syn.source.x}
              y1={syn.source.y}
              x2={syn.target.x}
              y2={syn.target.y}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              opacity={baseOpacity * intro}
              filter={isLayerActive ? "url(#glow-synapse)" : undefined}
            />
          );
        })}

        {/* Moving Signal / Error Pulses along connections */}
        {synapses.map((syn, idx) => {
          const layerIdx = isBackprop ? 3 - syn.target.layer : syn.source.layer;
          const layerPhase = (layerIdx / 3) * 0.7;
          const pulseT = ((loopProgress - layerPhase + 1) % 1);

          if (pulseT < 0 || pulseT > 0.45) return null;
          const normT = pulseT / 0.45;

          // In forward: src -> tgt. In backward: tgt -> src
          const startX = isBackprop ? syn.target.x : syn.source.x;
          const startY = isBackprop ? syn.target.y : syn.source.y;
          const endX = isBackprop ? syn.source.x : syn.target.x;
          const endY = isBackprop ? syn.source.y : syn.target.y;

          const px = startX + (endX - startX) * normT;
          const py = startY + (endY - startY) * normT;

          return (
            <circle
              key={`pulse-${idx}`}
              cx={px}
              cy={py}
              r={isBackprop ? 4.5 : 4}
              fill={isBackprop ? "#FFAA33" : "#FFFFFF"}
              filter="url(#glow-synapse)"
              opacity={Math.sin(normT * Math.PI) * 0.95}
            />
          );
        })}
      </svg>

      {/* Layer Column Headers Overhead */}
      {layerNames.map((name, lIdx) => {
        const x = xOffset + lIdx * xSpacing;
        const isCurrent = lIdx === activeLayerIndex;
        return (
          <div
            key={`layer-header-${lIdx}`}
            style={{
              position: "absolute",
              top: isLandscape ? 260 : 490,
              left: x,
              transform: "translateX(-50%)",
              textAlign: "center",
              pointerEvents: "none",
              zIndex: 10,
              opacity: intro,
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: isLandscape ? 18 : 22,
                fontWeight: 900,
                color: isCurrent ? primaryColor : "rgba(255, 255, 255, 0.45)",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                padding: "6px 14px",
                borderRadius: 12,
                background: isCurrent ? "rgba(14, 22, 42, 0.95)" : "transparent",
                border: isCurrent ? `1.5px solid ${primaryColor}88` : "none",
                boxShadow: isCurrent ? `0 0 20px ${primaryColor}44` : "none",
                transition: "all 0.2s ease-out",
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </div>
          </div>
        );
      })}

      {/* Interactive Neurons (Nodes) */}
      {nodes.map((node) => {
        const isCurrentLayer = node.layer === activeLayerIndex;
        const nodePulse = isCurrentLayer ? Math.sin((frame / 6) * Math.PI) * 0.15 + 1.1 : 1.0;
        const nodeColor = isBackprop
          ? isCurrentLayer
            ? "#FF5555"
            : "#A33"
          : isCurrentLayer
          ? accent
          : "#2A4B82";

        return (
          <div
            key={node.id}
            style={{
              position: "absolute",
              top: node.y,
              left: node.x,
              transform: `translate(-50%, -50%) scale(${nodePulse * intro})`,
              width: isLandscape ? 68 : 82,
              height: isLandscape ? 68 : 82,
              borderRadius: "50%",
              background: "rgba(11, 16, 32, 0.96)",
              border: `2.5px solid ${nodeColor}`,
              boxShadow: isCurrentLayer
                ? `0 0 30px ${nodeColor}, 0 0 50px ${nodeColor}66`
                : "0 10px 25px rgba(0,0,0,0.7)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 20,
              transition: "border 0.2s, box-shadow 0.2s",
            }}
          >
            {/* Inner Glowing Core */}
            <div
              style={{
                fontFamily: "monospace",
                fontSize: isLandscape ? 22 : 28,
                fontWeight: 900,
                color: "#FFFFFF",
                lineHeight: 1,
                textShadow: isCurrentLayer ? `0 0 10px ${nodeColor}` : "none",
              }}
            >
              {node.label}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: isLandscape ? 12 : 14,
                fontWeight: 700,
                color: isCurrentLayer ? primaryColor : "rgba(255,255,255,0.45)",
                marginTop: 2,
              }}
            >
              {node.sub}
            </div>
          </div>
        );
      })}

      {/* Cinematic HUD Header */}
      <div
        style={{
          position: "absolute",
          top: L.padTop - 20,
          left: L.padX,
          right: L.padX,
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {scene.tag && (
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 26,
              fontWeight: 800,
              color: primaryColor,
              letterSpacing: "0.20em",
              textTransform: "uppercase",
            }}
          >
            {scene.tag}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <RevealText
            text={scene.title ?? (isBackprop ? "Backpropagation Graph" : "Neural Network Architecture")}
            align="left"
            style={{
              fontSize: isLandscape ? 52 : 64,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
            }}
          />

          {/* Mode Pill Badge */}
          <div
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              background: isBackprop ? "rgba(255, 85, 85, 0.18)" : "rgba(0, 240, 255, 0.16)",
              border: `1.5px solid ${primaryColor}`,
              color: primaryColor,
              fontFamily: "monospace",
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              boxShadow: `0 0 25px ${primaryColor}44`,
            }}
          >
            {isBackprop ? "◀ BACKWARD PASS" : "▶ FORWARD PASS"}
          </div>
        </div>

        {/* Master Formula Card */}
        <div
          style={{
            alignSelf: "flex-start",
            padding: "14px 28px",
            borderRadius: 18,
            background: "rgba(14, 20, 36, 0.94)",
            border: `1.5px solid ${primaryColor}66`,
            backdropFilter: "blur(20px)",
            boxShadow: "0 15px 35px rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: isLandscape ? 24 : 32,
              fontWeight: 800,
              color: "#E2E8F0",
              letterSpacing: "0.04em",
            }}
          >
            {isBackprop
              ? "∂L/∂w = (∂L/∂a) · (∂a/∂z) · (∂z/∂w)  →  w ← w - α·∇L"
              : "z = W · x + b  →  a = σ(z)"}
          </span>
        </div>
      </div>

      {/* Bottom Live Calculation Telemetry Card */}
      <div
        style={{
          position: "absolute",
          bottom: 300, // Safe distance above 280px caption zone
          left: L.padX,
          right: L.padX,
          zIndex: 30,
          background: "rgba(12, 17, 30, 0.92)",
          backdropFilter: "blur(18px)",
          borderRadius: 20,
          padding: "18px 26px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 20px 45px rgba(0,0,0,0.7)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: primaryColor,
              boxShadow: `0 0 15px ${primaryColor}`,
            }}
          />
          <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 800, color: "#FFFFFF" }}>
            {isBackprop ? "CALCULUS CHAIN RULE" : "DOT PRODUCT & ACTIVATION"}
          </div>
        </div>

        <div
          style={{
            fontFamily: "monospace",
            fontSize: 24,
            fontWeight: 800,
            color: primaryColor,
            letterSpacing: "0.06em",
          }}
        >
          {isBackprop ? "Gradients Moving Backward" : "Signals Propagating Forward"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
