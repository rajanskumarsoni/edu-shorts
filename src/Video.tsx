import React from "react";
import {
  AbsoluteFill,
  Audio,
  Loop,
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
import { CodeScene } from "./scenes/CodeScene";
import { Architecture } from "./scenes/Architecture";
import { Gauge } from "./scenes/Gauge";
import { Timeline } from "./scenes/Timeline";
import { Callout } from "./scenes/Callout";
import { Bento } from "./scenes/Bento";
import { Benchmark } from "./scenes/Benchmark";
import { Hierarchy } from "./scenes/Hierarchy";
import { DataStructure } from "./scenes/DataStructure";
import { Inspector } from "./scenes/Inspector";
import { Quadrant } from "./scenes/Quadrant";
import { Concentric } from "./scenes/Concentric";
import { Captions } from "./Captions";

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
  code: CodeScene,
  architecture: Architecture,
  gauge: Gauge,
  timeline: Timeline,
  callout: Callout,
  bento: Bento,
  benchmark: Benchmark,
  hierarchy: Hierarchy,
  data_structure: DataStructure,
  inspector: Inspector,
  quadrant: Quadrant,
  concentric: Concentric,
};

const DEFAULT_SFX_VOLUMES: Record<string, number> = {
  whoosh: 0.22,
  fast_whoosh: 0.24,
  riser: 0.28,
  downlifter: 0.25,
  pop: 0.35,
  tick: 0.25,
  click: 0.30,
  ting: 0.28,
  ding: 0.32,
  ka_ching: 0.32,
  impact: 0.38,
  bass_drop: 0.40,
  thud: 0.35,
  heartbeat: 0.40,
  typing: 0.25,
  camera_shutter: 0.30,
  glitch: 0.28,
  sparkle: 0.30,
  radar_beep: 0.30,
};

function resolveSfxPath(name: string): string {
  if (name.startsWith("sfx/")) return name;
  if (name.includes("/")) return name;
  const base = name.endsWith(".wav") || name.endsWith(".mp3") ? name : `${name}.wav`;
  return `sfx/${base}`;
}

function resolveSfxName(name: string): string {
  const clean = name.replace(/^sfx\//, "");
  return clean.replace(/\.(wav|mp3)$/, "");
}

const SceneSFX: React.FC<{
  scene: SceneSpec;
  index: number;
  globalSfx?: boolean;
}> = ({ scene, index, globalSfx = true }) => {
  if (!globalSfx) return null;
  if (scene.sfx === false || scene.sfx === "none") return null;

  const cues: Array<{ sound: string; frame: number; volume: number }> = [];

  // 1. Transition sound when switching scenes (if index > 0)
  if (index > 0) {
    cues.push({
      sound: "whoosh",
      frame: 0,
      volume: DEFAULT_SFX_VOLUMES["whoosh"],
    });
  }

  // 2. Scene-specific sound cues
  if (typeof scene.sfx === "string" && scene.sfx !== "whoosh") {
    const sName = resolveSfxName(scene.sfx);
    const vol = scene.sfxVolume ?? DEFAULT_SFX_VOLUMES[sName] ?? 0.3;
    const offset = sName === "impact" || sName === "thud" || sName === "bass_drop" ? 4 : 0;
    cues.push({ sound: scene.sfx, frame: offset, volume: vol });
  } else if (Array.isArray(scene.sfx)) {
    for (const item of scene.sfx) {
      if (typeof item === "string") {
        const sName = resolveSfxName(item);
        const vol = scene.sfxVolume ?? DEFAULT_SFX_VOLUMES[sName] ?? 0.3;
        cues.push({ sound: item, frame: 0, volume: vol });
      } else if (item && typeof item === "object") {
        const sName = resolveSfxName(item.sound);
        const vol = item.volume ?? scene.sfxVolume ?? DEFAULT_SFX_VOLUMES[sName] ?? 0.3;
        cues.push({ sound: item.sound, frame: item.frame ?? 0, volume: vol });
      }
    }
  } else if (scene.sfx && typeof scene.sfx === "object") {
    const cueObj = scene.sfx as { sound: string; frame?: number; volume?: number };
    const sName = resolveSfxName(cueObj.sound);
    const vol = cueObj.volume ?? scene.sfxVolume ?? DEFAULT_SFX_VOLUMES[sName] ?? 0.3;
    cues.push({ sound: cueObj.sound, frame: cueObj.frame ?? 0, volume: vol });
  } else if (scene.sfx === undefined) {
    // Intelligent accent defaults based on scene type
    if (scene.type === "stat") {
      cues.push({ sound: "impact", frame: 4, volume: 0.35 });
    } else if (scene.type === "code") {
      cues.push({ sound: "typing", frame: 0, volume: 0.22 });
    } else if (scene.type === "callout") {
      cues.push({ sound: "pop", frame: 2, volume: 0.30 });
    } else if (scene.type === "outro") {
      cues.push({ sound: "ding", frame: 0, volume: 0.32 });
    }
  }

  return (
    <>
      {cues.map((cue, idx) => {
        const path = resolveSfxPath(cue.sound);
        if (cue.frame > 0) {
          return (
            <Sequence key={`${cue.sound}-${idx}`} from={cue.frame}>
              <Audio src={staticFile(path)} volume={cue.volume} />
            </Sequence>
          );
        }
        return <Audio key={`${cue.sound}-${idx}`} src={staticFile(path)} volume={cue.volume} />;
      })}
    </>
  );
};

const SceneView: React.FC<{
  scene: SceneSpec;
  accent: string;
  index: number;
  captions?: boolean;
  sfx?: boolean;
}> = ({ scene, accent, index, captions = true, sfx = true }) => {
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
  const isNative3D =
    scene.type === "image" ||
    scene.type === "three" ||
    Boolean(scene.variant && scene.variant.includes("3d")) ||
    Boolean(scene.graphic && scene.graphic.includes("3d")) ||
    (scene.type === "hook" && (scene.icon === "smartphone" || scene.icon === "brain" || Boolean(scene.text && /upi|qr|payment/i.test(scene.text)))) ||
    (scene.type === "concentric" && /pin|keystore|zero-knowledge/i.test(scene.tag || scene.title || "")) ||
    (scene.type === "inspector" && /qr|address/i.test(scene.tag || scene.title || "")) ||
    (scene.type === "compare" && /settlement|bilateral|dual ledger/i.test(scene.tag || scene.title || "")) ||
    (scene.type === "gauge" && (/latency|clearing speed|speedometer/i.test(scene.tag || scene.title || "") || typeof scene.value === "number")) ||
    (scene.type === "architecture" && /pipeline|architecture|end-to-end/i.test(scene.tag || scene.title || "")) ||
    (scene.type === "callout" && /fail|reconciliation|pending|golden rule|alert/i.test(scene.tag || scene.title || "")) ||
    (scene.type === "outro" && (/digital india|seconds on screen|systems behind|mission accomplished/i.test(scene.tag || scene.text || "") || scene.icon === "sparkles"));
  const camera = isNative3D
    ? "none"
    : `translate(${panX}px, ${panY}px) scale(${zoom}) rotate(${tilt}deg)`;

  return (
    <AbsoluteFill style={{ opacity }}>
      {scene.audio && <Audio src={staticFile(scene.audio)} />}
      <SceneSFX scene={scene} index={index} globalSfx={sfx} />
      <AbsoluteFill style={{ transform: camera }}>
        <Content scene={scene} accent={accent} />
      </AbsoluteFill>
      <LightSweep />
      {captions && scene.narration && (
        <Captions
          narration={scene.narration}
          durationInFrames={durationInFrames}
          accent={accent}
        />
      )}
    </AbsoluteFill>
  );
};

export const Video: React.FC<VideoProps> = ({
  scenes,
  music,
  music_volume,
  narration,
  accent = "#FFC857",
  captions = true,
  progress = true,
  sfx = true,
  loop = false,
}) => {
  const globalFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = scenes.reduce((acc, s) => acc + s.durationInFrames, 0);
  const progressPercent = Math.min(
    100,
    Math.max(0, (globalFrame / Math.max(1, totalFrames)) * 100)
  );

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

      {/* Global Glowing Top Progress Scrub Bar */}
      {progress && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: 5,
            width: `${progressPercent}%`,
            background: `linear-gradient(90deg, ${accent}, #FFFFFF)`,
            boxShadow: `0 0 16px ${accent}, 0 0 4px #FFFFFF`,
            zIndex: 100,
            pointerEvents: "none",
          }}
        />
      )}

      {scenes.map((s, i) => {
        const start = from;
        from += s.durationInFrames;
        return (
          <Sequence key={i} from={start} durationInFrames={s.durationInFrames}>
            <SceneView
              scene={s}
              accent={accent}
              index={i}
              captions={captions}
              sfx={sfx}
            />
          </Sequence>
        );
      })}
      {narration && <Audio src={staticFile(narration)} />}
      {/* Background Music: Warm Focus default looped with Loop component and audible volume */}
      {(() => {
        const bgMusic = music === "none" ? null : (music || "music/warm_focus.mp3");
        if (!bgMusic) return null;
        const vol = typeof music_volume === "number" ? music_volume : 0.32;
        // Warm Focus duration is 171.3s (~5140 frames at 30 fps)
        const musicFrames = Math.max(1, Math.floor(171.3 * fps));
        return (
          <Loop durationInFrames={musicFrames}>
            <Audio
              src={staticFile(bgMusic)}
              volume={vol}
            />
          </Loop>
        );
      })()}
      <Finish />
    </AbsoluteFill>
  );
};
