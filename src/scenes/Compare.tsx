import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneSpec, Side } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";

const Card: React.FC<{
  side: Side;
  color: string;
  delay: number;
  landscape: boolean;
}> = ({ side, color, delay, landscape }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 120, mass: 0.9 },
  });

  return (
    <div
      style={{
        flex: 1,
        background: "rgba(18, 22, 34, 0.78)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderTop: `6px solid ${color}`,
        borderRadius: 28,
        padding: landscape ? "38px 44px" : "36px 44px",
        opacity: s,
        transform: `translateY(${(1 - s) * 50}px) scale(${0.96 + 0.04 * s})`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${color}1a`,
      }}
    >
      <div
        style={{
          fontSize: landscape ? 56 : 64,
          fontWeight: 900,
          color,
          marginBottom: 20,
          lineHeight: 1.05,
          textShadow: `0 0 24px ${color}44`,
        }}
      >
        {side.heading}
      </div>
      {side.items.map((it, i) => {
        const p = spring({
          frame: frame - delay - 10 - i * 8,
          fps,
          config: { damping: 16, stiffness: 140 },
        });
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: landscape ? 42 : 50,
              fontWeight: 600,
              lineHeight: 1.25,
              marginTop: 16,
              color: "#E2E8F0",
              opacity: p,
              transform: `translateX(${(1 - p) * -30}px)`,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 10px ${color}`,
                flexShrink: 0,
              }}
            />
            <div>{it}</div>
          </div>
        );
      })}
    </div>
  );
};

export const Compare: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const L = useLayout();
  const cyan = "#00F0FF";
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
      }}
    >
      {scene.title && (
        <RevealText
          text={scene.title}
          style={{
            fontSize: L.landscape ? 70 : 80,
            fontWeight: 900,
            marginBottom: L.landscape ? 36 : 48,
            lineHeight: 1.05,
            color: "#FFFFFF",
            textShadow: "0 8px 30px rgba(0,0,0,0.6)",
          }}
        />
      )}
      <div
        style={{
          display: "flex",
          flexDirection: L.landscape ? "row" : "column",
          gap: L.landscape ? 40 : 32,
        }}
      >
        {scene.left && (
          <Card side={scene.left} color={accent} delay={8} landscape={L.landscape} />
        )}
        {scene.right && (
          <Card side={scene.right} color={cyan} delay={22} landscape={L.landscape} />
        )}
      </div>
    </AbsoluteFill>
  );
};
