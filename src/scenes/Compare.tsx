import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SceneSpec, Side } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { MotionGraphic } from "../MotionGraphic";
import { resolveSceneTag } from "../theme";
import { ThreeDSettlement } from "./ThreeDSettlement";

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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: landscape ? 56 : 64,
            fontWeight: 900,
            color,
            lineHeight: 1.05,
            textShadow: `0 0 24px ${color}44`,
            flex: 1,
          }}
        >
          {side.heading}
        </div>
        <MotionGraphic text={side.heading} accent={color} size="sm" showRadar={false} />
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
  // Delegate to 3D Bilateral Settlement scene
  const is3DSettlement =
    scene.variant === "upi_settlement_3d" ||
    /settlement|bilateral|dual ledger/i.test(scene.title || "") ||
    /settlement|bilateral/i.test(scene.tag || "") ||
    Boolean(scene.left?.heading?.includes("Bank A") && scene.right?.heading?.includes("Bank B"));

  if (is3DSettlement) {
    return <ThreeDSettlement scene={scene} accent={accent} />;
  }

  const frame = useCurrentFrame();
  const L = useLayout();
  const cyan = "#00F0FF";
  const pulse = (Math.sin(frame / 6) + 1) / 2;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
      }}
    >
      {scene.title && (
        <div style={{ marginBottom: L.landscape ? 36 : 48 }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 28,
              fontWeight: 800,
              color: accent,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
              {resolveSceneTag(scene, "03 // ARCHITECTURAL COMPARISON")}
          </div>
          <RevealText
            text={scene.title}
            style={{
              fontSize: L.landscape ? 70 : 80,
              fontWeight: 900,
              lineHeight: 1.05,
              color: "#FFFFFF",
              textShadow: "0 8px 30px rgba(0,0,0,0.6)",
            }}
          />
        </div>
      )}

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: L.landscape ? "row" : "column",
          gap: L.landscape ? 40 : 36,
        }}
      >
        {scene.left && (
          <Card side={scene.left} color={accent} delay={8} landscape={L.landscape} />
        )}

        {/* Central Animated Neon VS Emblem */}
        <div
          style={{
            alignSelf: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: "rgba(10, 14, 26, 0.95)",
            border: `2px solid ${accent}`,
            boxShadow: `0 0 26px ${accent}66, 0 0 40px ${cyan}33`,
            zIndex: 10,
            transform: `scale(${0.9 + 0.15 * pulse})`,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 32,
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "0.05em",
              textShadow: `0 0 12px ${accent}`,
            }}
          >
            VS
          </span>
        </div>

        {scene.right && (
          <Card side={scene.right} color={cyan} delay={22} landscape={L.landscape} />
        )}
      </div>
    </AbsoluteFill>
  );
};
