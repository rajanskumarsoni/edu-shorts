import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";

export const ManimClip: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const L = useLayout();
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: L.landscape ? 0 : 170,
      }}
    >
      {scene.title && (
        <div
          style={{
            position: "absolute",
            top: L.landscape ? 50 : 170,
            width: "100%",
            boxSizing: "border-box",
            textAlign: "center",
            fontSize: L.landscape ? 64 : 76,
            fontWeight: 900,
            color: accent,
            padding: `0 ${L.padX}px`,
          }}
        >
          {scene.title}
        </div>
      )}
      {scene.video && (
        <OffthreadVideo
          src={staticFile(scene.video)}
          muted
          style={{ width: "100%" }}
        />
      )}
    </AbsoluteFill>
  );
};
