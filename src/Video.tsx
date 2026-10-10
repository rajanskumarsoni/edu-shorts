import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { SceneSpec, VideoProps } from "./types";
import { BG, FG, FONT } from "./theme";
import { Background, Finish, LightSweep } from "./Cinematic";
import { Hook } from "./scenes/Hook";
import { Bullets } from "./scenes/Bullets";
import { Stat } from "./scenes/Stat";
import { ManimClip } from "./scenes/ManimClip";
import { Outro } from "./scenes/Outro";
import { ImageScene } from "./scenes/ImageScene";
import { Quote } from "./scenes/Quote";
import { Compare } from "./scenes/Compare";
import { ThreeScene } from "./scenes/ThreeScene";

const SCENES = {
  hook: Hook,
  bullets: Bullets,
  stat: Stat,
  manim: ManimClip,
  outro: Outro,
  image: ImageScene,
  quote: Quote,
  compare: Compare,
  three: ThreeScene,
};

const SceneView: React.FC<{ scene: SceneSpec; accent: string; index: number }> = ({
  scene,
  accent,
  index,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // Snappy cinematic cross-blend: enter in 6 frames, hold until handoff to avoid black dip
  const opacity = interpolate(
    frame,
    [0, 6, durationInFrames - 2, durationInFrames],
    [0, 1, 1, 0.9],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // slow "camera" drift: push-in with a small pan and tilt, alternating direction per scene
  const dir = index % 2 === 0 ? 1 : -1;
  const p = frame / Math.max(durationInFrames, 1);
  const zoom = 1 + 0.05 * p;
  const panX = dir * interpolate(p, [0, 1], [-10, 10]);
  const panY = interpolate(p, [0, 1], [6, -6]);
  const tilt = dir * interpolate(p, [0, 1], [-0.25, 0.25]);
  const Content = SCENES[scene.type] || Hook;
  // image and native 3D scenes manage their own 3D cameras
  const camera =
    scene.type === "image" || scene.type === "three"
      ? "none"
      : `translate(${panX}px, ${panY}px) scale(${zoom}) rotate(${tilt}deg)`;

  return (
    <AbsoluteFill style={{ opacity }}>
      {scene.audio && <Audio src={staticFile(scene.audio)} />}
      <AbsoluteFill style={{ transform: camera }}>
        <Content scene={scene} accent={accent} />
      </AbsoluteFill>
      <LightSweep />
    </AbsoluteFill>
  );
};

export const Video: React.FC<VideoProps> = ({
  scenes,
  music,
  narration,
  accent = "#FFC857",
}) => {
  let from = 0;
  return (
    <AbsoluteFill
      style={{
        background: BG,
        color: FG,
        fontFamily: FONT,
        filter: "contrast(1.05) saturate(1.1)",
      }}
    >
      <style>{"*, *::before, *::after { box-sizing: border-box; }"}</style>
      <Background accent={accent} />
      {scenes.map((s, i) => {
        const start = from;
        from += s.durationInFrames;
        return (
          <Sequence key={i} from={start} durationInFrames={s.durationInFrames}>
            <SceneView scene={s} accent={accent} index={i} />
          </Sequence>
        );
      })}
      {narration && <Audio src={staticFile(narration)} />}
      {music && <Audio src={staticFile(music)} volume={0.08} loop />}
      <Finish />
    </AbsoluteFill>
  );
};
