import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec, ChartDatum } from "../types";
import { useLayout } from "../layout";
import { FONT } from "../theme";

export const ChartScene: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const L = useLayout();
  const isVertical = !L.landscape;

  const title = scene.title ?? scene.chartTitle ?? "Analytical Metrics";
  const chartType = scene.chartType ?? "bar";
  const data: ChartDatum[] = scene.chartData ?? [
    { label: "Transformer Attention", value: 94.2, color: accent },
    { label: "Convolutional (CNN)", value: 78.5, color: "#B388FF" },
    { label: "Recurrent (LSTM)", value: 61.0, color: "#FF9F1C" },
    { label: "Dense MLP Baseline", value: 42.8, color: "#64748B" },
  ];

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const animProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 16, stiffness: 90 },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
        fontFamily: FONT,
      }}
    >
      {/* Upper Tag */}
      {scene.tag && (
        <div
          style={{
            fontFamily: "monospace",
            fontSize: isVertical ? 24 : 26,
            fontWeight: 800,
            color: accent,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          {scene.tag}
        </div>
      )}

      {/* Main Title */}
      <div
        style={{
          fontSize: isVertical ? 38 : 46,
          fontWeight: 900,
          color: "#FFFFFF",
          textAlign: "center",
          marginBottom: 36,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </div>

      {/* Chart Canvas Card */}
      <div
        style={{
          width: isVertical ? "94%" : "86%",
          maxWidth: 1400,
          background: "linear-gradient(180deg, rgba(16, 20, 30, 0.85) 0%, rgba(8, 10, 16, 0.95) 100%)",
          borderRadius: 24,
          padding: isVertical ? "32px 24px" : "40px 48px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: `0 30px 80px rgba(0,0,0,0.8), 0 0 40px ${accent}20`,
        }}
      >
        {chartType === "bar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: isVertical ? 20 : 26 }}>
            {data.map((item, idx) => {
              const itemProgress = spring({
                frame: frame - (10 + idx * 5),
                fps,
                config: { damping: 15, stiffness: 100 },
              });
              const pct = (item.value / maxVal) * 100;
              const barWidth = Math.max(0, Math.min(pct * itemProgress, 100));
              const itemColor = item.color || (idx === 0 ? accent : "#B388FF");

              return (
                <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: isVertical ? 22 : 24, fontWeight: 700, color: "#E2E8F0" }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: isVertical ? 24 : 28, fontWeight: 900, color: itemColor, fontFamily: "monospace" }}>
                      {item.value.toFixed(1)}{scene.unit ?? "%"}
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: isVertical ? 22 : 26,
                      background: "rgba(255, 255, 255, 0.05)",
                      borderRadius: 12,
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: "100%",
                        background: `linear-gradient(90deg, ${itemColor}80, ${itemColor})`,
                        borderRadius: 12,
                        boxShadow: `0 0 15px ${itemColor}60`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {chartType === "line" && (
          <div style={{ position: "relative", height: isVertical ? 380 : 440 }}>
            <svg width="100%" height="100%" viewBox="0 0 800 360" style={{ overflow: "visible" }}>
              {/* Grid Lines */}
              <line x1="40" y1="60" x2="760" y2="60" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
              <line x1="40" y1="160" x2="760" y2="160" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
              <line x1="40" y1="260" x2="760" y2="260" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />

              {/* Data Trend Line */}
              {(() => {
                const stepX = (760 - 40) / Math.max(1, data.length - 1);
                const pts = data.map((d, i) => {
                  const x = 40 + i * stepX;
                  const y = 300 - (d.value / maxVal) * 240 * animProgress;
                  return { x, y, ...d };
                });
                const pathD = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");

                return (
                  <>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={accent}
                      strokeWidth="5"
                      strokeLinecap="round"
                      style={{ filter: `drop-shadow(0 0 12px ${accent})` }}
                    />
                    {pts.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="8" fill="#08090D" stroke={accent} strokeWidth="4" />
                        <text
                          x={p.x}
                          y={p.y - 18}
                          fill="#FFFFFF"
                          fontSize="20"
                          fontWeight="800"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {p.value}{scene.unit ?? ""}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
        )}

        {chartType === "kpi" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isVertical ? "1fr" : `repeat(${Math.min(data.length, 3)}, 1fr)`,
              gap: 20,
            }}
          >
            {data.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: 18,
                  padding: "24px 28px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 18, color: "#94A3B8", fontWeight: 600 }}>{item.label}</span>
                <span
                  style={{
                    fontSize: isVertical ? 42 : 48,
                    fontWeight: 900,
                    color: item.color || accent,
                    fontFamily: "monospace",
                  }}
                >
                  {item.value.toLocaleString()}{scene.unit ?? ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
