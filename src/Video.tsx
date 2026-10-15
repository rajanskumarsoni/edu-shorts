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
import { ArtDirectionContext, getTheme, ThemeContext } from "./theme";
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
import { useBeatPulse } from "./layout";
import { getActiveVisualBeat, JourneyRail, VisualBeatOverlay } from "./VisualStory";
import { SeatBookingScene } from "./scenes/SeatBooking";
import { InterviewCard } from "./scenes/InterviewCard";
import { VideoScene } from "./scenes/VideoScene";
import { DiagramScene } from "./scenes/DiagramScene";
import { NeuralNetworkGraph } from "./scenes/NeuralNetworkGraph";
import { TerminalScene } from "./scenes/TerminalScene";
import { ScreenshotScene } from "./scenes/ScreenshotScene";
import { ChartScene } from "./scenes/ChartScene";
import { ProductScene } from "./scenes/ProductScene";
import { SortingVisualizer } from "./scenes/SortingVisualizer";
import { AmazonShoppingHook } from "./scenes/AmazonShoppingHook";
import { WhiteboardScene } from "./scenes/WhiteboardScene";
import { RefrigeratorVisualizer } from "./scenes/RefrigeratorVisualizer";
import { AirConditionerVisualizer } from "./scenes/AirConditionerVisualizer";

const SCENES = {
  hook: Hook,
  bullets: Bullets,
  stat: Stat,
  manim: ManimClip,
  video: VideoScene,
  diagram: DiagramScene,
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
  seat_booking: SeatBookingScene,
  neural_network_graph: NeuralNetworkGraph,
  interview: InterviewCard,
  terminal: TerminalScene,
  screenshot: ScreenshotScene,
  chart: ChartScene,
  product: ProductScene,
  sorting_visualizer: SortingVisualizer,
  amazon_shopping: AmazonShoppingHook,
  whiteboard: WhiteboardScene,
  refrigerator: RefrigeratorVisualizer,
  air_conditioner: AirConditionerVisualizer,
};

const DEFAULT_SFX_VOLUMES: Record<string, number> = {
  whoosh: 0.10,
  fast_whoosh: 0.12,
  riser: 0.14,
  downlifter: 0.12,
  pop: 0.15,
  tick: 0.12,
  click: 0.14,
  ting: 0.14,
  ding: 0.16,
  ka_ching: 0.15,
  impact: 0.18,
  bass_drop: 0.18,
  thud: 0.16,
  heartbeat: 0.18,
  typing: 0.12,
  camera_shutter: 0.14,
  glitch: 0.14,
  sparkle: 0.15,
  radar_beep: 0.12,
};

const SFX_DURATIONS: Record<string, number> = {
  typing: 18,
  radar_beep: 12,
  whoosh: 12,
  fast_whoosh: 6,
  click: 2,
  tick: 2,
  ting: 10,
  pop: 3,
  glitch: 8,
  heartbeat: 26,
  impact: 18,
  bass_drop: 28,
  ka_ching: 16,
  ding: 20,
  sparkle: 16,
  downlifter: 24,
  riser: 36,
  thud: 8,
  camera_shutter: 9,
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

interface ActiveSfxCue {
  sound: string;
  frame: number;
  volume: number;
  loop?: boolean;
  duration?: number;
}

const SceneSFX: React.FC<{
  scene: SceneSpec;
  index: number;
  globalSfx?: boolean;
}> = ({ scene, index, globalSfx = true }) => {
  if (!globalSfx) return null;
  if (scene.sfx === false || scene.sfx === "none") return null;

  const cues: ActiveSfxCue[] = [];

  // 1. Scene transition whoosh
  if (index > 0) {
    cues.push({
      sound: "whoosh",
      frame: 0,
      volume: DEFAULT_SFX_VOLUMES["whoosh"],
    });
  }

  // 2. Explicit storyboard cues
  if (typeof scene.sfx === "string" && scene.sfx !== "whoosh") {
    const sName = resolveSfxName(scene.sfx);
    const vol = scene.sfxVolume ?? DEFAULT_SFX_VOLUMES[sName] ?? 0.14;
    const offset = index > 0 ? 12 : (sName === "impact" || sName === "thud" || sName === "bass_drop" ? 4 : 0);
    cues.push({ sound: scene.sfx, frame: offset, volume: vol });
  } else if (Array.isArray(scene.sfx)) {
    for (const item of scene.sfx) {
      if (typeof item === "string") {
        const sName = resolveSfxName(item);
        const vol = scene.sfxVolume ?? DEFAULT_SFX_VOLUMES[sName] ?? 0.16;
        cues.push({ sound: item, frame: 0, volume: vol });
      } else if (item && typeof item === "object") {
        const sName = resolveSfxName(item.sound);
        const vol = item.volume ?? scene.sfxVolume ?? DEFAULT_SFX_VOLUMES[sName] ?? 0.16;
        if (item.repeat && item.interval && item.interval > 0) {
          for (let r = 0; r < item.repeat; r++) {
            cues.push({
              sound: item.sound,
              frame: (item.frame ?? 0) + r * item.interval,
              volume: vol,
            });
          }
        } else if (item.loop && item.duration) {
          cues.push({
            sound: item.sound,
            frame: item.frame ?? 0,
            volume: vol,
            loop: true,
            duration: item.duration,
          });
        } else {
          cues.push({
            sound: item.sound,
            frame: item.frame ?? 0,
            volume: vol,
            duration: item.duration,
          });
        }
      }
    }
  } else if (scene.sfx && typeof scene.sfx === "object") {
    const cueObj = scene.sfx as any;
    const sName = resolveSfxName(cueObj.sound);
    const vol = cueObj.volume ?? scene.sfxVolume ?? DEFAULT_SFX_VOLUMES[sName] ?? 0.16;
    if (cueObj.repeat && cueObj.interval && cueObj.interval > 0) {
      for (let r = 0; r < cueObj.repeat; r++) {
        cues.push({
          sound: cueObj.sound,
          frame: (cueObj.frame ?? 0) + r * cueObj.interval,
          volume: vol,
        });
      }
    } else if (cueObj.loop && cueObj.duration) {
      cues.push({
        sound: cueObj.sound,
        frame: cueObj.frame ?? 0,
        volume: vol,
        loop: true,
        duration: cueObj.duration,
      });
    } else {
      cues.push({ sound: cueObj.sound, frame: cueObj.frame ?? 0, volume: vol });
    }
  } else if (scene.sfx === undefined) {
    if (scene.type === "stat") {
      cues.push({ sound: "impact", frame: 4, volume: 0.32 });
    } else if (scene.type === "callout") {
      cues.push({ sound: "pop", frame: 2, volume: 0.28 });
    } else if (scene.type === "outro") {
      cues.push({ sound: "ding", frame: 0, volume: 0.30 });
    }
  }

  // 3. Action-Aware Continuous SFX Synthesis (Synced to active visual animation)
  const durFrames = scene.durationInFrames ?? 90;

  // A. Continuous typing for Terminal scenes
  if (scene.type === "terminal" && Array.isArray((scene as any).terminalSteps)) {
    let curFrame = 10;
    for (const st of (scene as any).terminalSteps) {
      if (st.kind === "cmd") {
        const speed = st.typeSpeed ?? 0.035;
        const dur = Math.max(2, Math.ceil((st.text || "").length * speed * 30));
        cues.push({ sound: "typing", frame: curFrame, volume: 0.14, loop: true, duration: dur });
        curFrame += dur + Math.ceil((st.holdSeconds ?? 0.3) * 30);
      } else if (st.kind === "out") {
        cues.push({ sound: "tick", frame: curFrame, volume: 0.10 });
        curFrame += Math.max(2, Math.ceil(0.08 * 30)) + Math.ceil((st.holdSeconds ?? 0.2) * 30);
      } else if (st.kind === "pill") {
        cues.push({ sound: "ting", frame: curFrame, volume: 0.14 });
      } else if (st.kind === "pause") {
        curFrame += Math.ceil((st.seconds ?? 0.3) * 30);
      }
    }
  }

  // B. Continuous typing for Code scenes
  if (scene.type === "code") {
    const rawLines = scene.code ? scene.code.split("\n") : (scene.lines ?? []);
    const lineCount = Math.max(1, rawLines.length);
    const typingDur = Math.min(durFrames - 12, Math.max(18, lineCount * 8));
    cues.push({ sound: "typing", frame: 8, volume: 0.13, loop: true, duration: typingDur });
    cues.push({ sound: "ting", frame: 8 + typingDur, volume: 0.15 });
  }

  // C. Continuous typing and click pulses for Screenshot interactive demos
  if (scene.type === "screenshot" && Array.isArray((scene as any).screenshotSteps)) {
    let scrCursor = 15;
    for (const st of (scene as any).screenshotSteps) {
      if (st.kind === "type_into") {
        const speed = st.typeSpeed ?? 0.04;
        const dur = Math.max(2, Math.ceil((st.text || "").length * speed * 30));
        cues.push({ sound: "typing", frame: scrCursor, volume: 0.15, loop: true, duration: dur });
        scrCursor += dur;
      } else if (st.kind === "click_pulse") {
        cues.push({ sound: "click", frame: scrCursor, volume: 0.18 });
        scrCursor += Math.ceil((st.durationSeconds ?? 0.4) * 30);
      } else if (st.kind === "bubble_append") {
        cues.push({ sound: "pop", frame: scrCursor, volume: 0.16 });
        scrCursor += Math.ceil((st.durationSeconds ?? 1.2) * 30);
      } else if (st.kind === "cursor_move") {
        scrCursor += Math.ceil((st.durationSeconds ?? 0.8) * 30);
      } else if (st.kind === "highlight_box") {
        cues.push({ sound: "ting", frame: scrCursor, volume: 0.13 });
        scrCursor += Math.ceil((st.durationSeconds ?? 2.0) * 30);
      }
    }
  }

  // D. Continuous pulse wave for Neural Network scenes (2D editorial graph & 3D WebGL scenes)
  const isNeuralNetwork =
    scene.type === "neural_network_graph" ||
    scene.graphic === "neural_network_3d" ||
    scene.graphic === "neural_brain" ||
    (scene.type === "three" &&
      ((scene as any).variant === "neural_network_3d" ||
        (scene as any).variant === "backprop_3d"));

  if (isNeuralNetwork) {
    const isBackprop =
      scene.mode === "backward" ||
      (scene as any).variant === "backprop_3d" ||
      /backprop|gradient|backward|chain rule/i.test(scene.tag || "") ||
      /backprop|gradient|backward|chain rule/i.test(scene.title || "");

    // Pulse wave cycles stepping across layers (~18 frames each)
    for (let f = 12; f < durFrames - 15; f += 18) {
      if (isBackprop) {
        cues.push({
          sound: (f / 18) % 2 === 0 ? "ting" : "glitch",
          frame: f,
          volume: 0.10,
        });
      } else {
        cues.push({
          sound: (f / 18) % 2 === 0 ? "radar_beep" : "tick",
          frame: f,
          volume: 0.09,
        });
      }
    }
  }

  // E. Item entrance pops for Bullets scenes
  if (scene.type === "bullets" && Array.isArray(scene.items)) {
    const gap = (durFrames * 0.65) / Math.max(scene.items.length, 1);
    scene.items.forEach((_, idx) => {
      cues.push({
        sound: "pop",
        frame: Math.round(12 + idx * gap),
        volume: 0.12,
      });
    });
  }

  // F. Mechanical ratchet ticks while Gauge needle sweeps
  if (scene.type === "gauge") {
    for (let f = 10; f <= Math.min(durFrames - 10, 42); f += 4) {
      cues.push({ sound: "tick", frame: f, volume: 0.09 });
    }
    cues.push({ sound: "ting", frame: Math.min(durFrames - 5, 44), volume: 0.16 });
  }

  // G. Racing progress ticks while Benchmark bars sprint
  if (scene.type === "benchmark") {
    for (let f = 12; f <= Math.min(durFrames - 10, 42); f += 6) {
      cues.push({ sound: "tick", frame: f, volume: 0.09 });
    }
    cues.push({ sound: "ka_ching", frame: Math.min(durFrames - 5, 48), volume: 0.20 });
  }

  // H. 3D Gradient Descent ball descent telemetry
  if (scene.type === "three" && (scene as any).variant === "gradient_descent") {
    for (let f = 15; f < durFrames - 20; f += 24) {
      cues.push({ sound: "radar_beep", frame: f, volume: 0.10 });
    }
    cues.push({ sound: "ting", frame: Math.max(15, durFrames - 18), volume: 0.15 });
  }

  // I. Whiteboard tactile drawing strokes
  if (scene.type === "whiteboard") {
    for (let f = 8; f <= Math.min(durFrames - 10, 36); f += 6) {
      cues.push({ sound: "tick", frame: f, volume: 0.08 });
    }
    cues.push({ sound: "ding", frame: Math.min(durFrames - 6, 42), volume: 0.14 });
  }

  return (
    <>
      {cues.map((cue, idx) => {
        const sName = resolveSfxName(cue.sound);
        const path = resolveSfxPath(cue.sound);
        const wavFrames = SFX_DURATIONS[sName] || 18;

        if (cue.loop && cue.duration && cue.duration > 0) {
          return (
            <Sequence
              key={`loop-${cue.sound}-${idx}`}
              from={cue.frame}
              durationInFrames={cue.duration}
            >
              <Loop durationInFrames={wavFrames}>
                <Audio src={staticFile(path)} volume={cue.volume} />
              </Loop>
            </Sequence>
          );
        }

        if (cue.frame > 0) {
          return (
            <Sequence key={`seq-${cue.sound}-${idx}`} from={cue.frame}>
              <Audio src={staticFile(path)} volume={cue.volume} />
            </Sequence>
          );
        }

        return (
          <Audio
            key={`aud-${cue.sound}-${idx}`}
            src={staticFile(path)}
            volume={cue.volume}
          />
        );
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
  beatPulse?: boolean;
  artDirection: "editorial" | "cinematic";
  sceneStartFrame: number; // local frame offset for this scene
}> = ({
  scene,
  accent,
  index,
  captions = true,
  sfx = true,
  beatPulse = true,
  artDirection,
  sceneStartFrame,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sceneArtDirection = artDirection;
  // In Remotion, useCurrentFrame() inside a <Sequence> is already the local frame (0 to durationInFrames)
  const localFrame = frame;
  // Snappy cinematic cross-blend: enter in 6 frames, hold until handoff to avoid black dip
  const opacity = interpolate(
    localFrame,
    [0, 6, durationInFrames - 2, durationInFrames],
    sceneArtDirection === "cinematic" ? [0, 1, 1, 0.9] : [1, 1, 1, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Cinematic drift is opt-in; diagram scenes need stable geometry by default.
  const dir = index % 2 === 0 ? 1 : -1;
  const p = frame / Math.max(durationInFrames, 1);
  const zoom = 1 + 0.05 * p;
  const panX = dir * interpolate(p, [0, 1], [-10, 10]);
  const panY = interpolate(p, [0, 1], [6, -6]);
  const tilt = dir * interpolate(p, [0, 1], [-0.25, 0.25]);
  const beatPulseScale = useBeatPulse({});

  const Content = SCENES[scene.type] || Hook;
  // image, video and native 3D scenes manage their own 3D cameras
  const isNative3D =
    scene.type === "image" ||
    scene.type === "video" ||
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
    : sceneArtDirection === "cinematic"
      ? `translate(${panX}px, ${panY}px) scale(${zoom * (beatPulse ? beatPulseScale : 1)}) rotate(${tilt}deg)`
      : "none";

  return (
    <AbsoluteFill style={{ opacity }}>
      {scene.audio && <Audio src={staticFile(scene.audio)} />}
      <SceneSFX scene={scene} index={index} globalSfx={sfx} />
      <ArtDirectionContext.Provider value={sceneArtDirection}>
        <AbsoluteFill style={{ transform: camera }}>
          <Content scene={scene} accent={accent} />
        </AbsoluteFill>
      </ArtDirectionContext.Provider>
      <VisualBeatOverlay beats={scene.beats} accent={accent} artDirection={sceneArtDirection} localFrame={localFrame} sceneDuration={durationInFrames} />
      {sceneArtDirection === "cinematic" && <LightSweep />}
      {captions && scene.narration && (
        <Captions
          narration={scene.narration}
          durationInFrames={durationInFrames}
          accent={accent}
          wordTimings={scene.wordTimings}
          localFrame={localFrame}
        />
      )}
    </AbsoluteFill>
  );
};

export const Video: React.FC<VideoProps> = ({
  scenes,
  music,
  music_volume,
  music_ducking = true,
  narration,
  accent = "#FFC857",
  theme,
  captions = true,
  progress = true,
  sfx = true,
  loop = false,
  journey,
  beatPulse = true,
  art_direction = "editorial",
}) => {
  const activeTheme = getTheme(theme, accent);
  const globalFrame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const totalFrames = scenes.reduce((acc, s) => acc + s.durationInFrames, 0);
  const progressPercent = Math.min(
    100,
    Math.max(0, (globalFrame / Math.max(1, totalFrames)) * 100)
  );
  let frameCursor = 0;
  let activeSceneStart = 0;
  const activeScene = scenes.find((scene) => {
    const sceneStart = frameCursor;
    const isActive = globalFrame < sceneStart + scene.durationInFrames;
    if (isActive) activeSceneStart = sceneStart;
    frameCursor += scene.durationInFrames;
    return isActive;
  }) ?? scenes[scenes.length - 1];
  const activeBeat = getActiveVisualBeat(
    activeScene?.beats,
    (globalFrame - activeSceneStart) / Math.max(1, (activeScene?.durationInFrames ?? 1) - 1)
  );
  const inferredJourneyStep = Math.min(
    (journey?.length ?? 1) - 1,
    Math.floor((globalFrame / Math.max(1, totalFrames)) * (journey?.length ?? 1))
  );
  const activeJourneyStep = activeBeat?.journeyStep ?? activeScene?.journeyStep ?? inferredJourneyStep;

  let from = 0;
  return (
    <ThemeContext.Provider value={activeTheme}>
      <AbsoluteFill
        style={{
          background: activeTheme.bg,
          color: activeTheme.fg,
          fontFamily: activeTheme.font,
          filter: art_direction === "cinematic" ? "contrast(1.05) saturate(1.1)" : undefined,
        }}
      >
      <style>{"*, *::before, *::after { box-sizing: border-box; }"}</style>
      <Background accent={accent} artDirection={art_direction} />

      {/* Global Glowing Top Progress Scrub Bar */}
      {progress && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: 5,
            width: `${progressPercent}%`,
            background:
              art_direction === "cinematic"
                ? `linear-gradient(90deg, ${accent}, #FFFFFF)`
                : accent,
            boxShadow: art_direction === "cinematic" ? `0 0 16px ${accent}, 0 0 4px #FFFFFF` : "none",
            zIndex: 100,
            pointerEvents: "none",
          }}
        />
      )}
      <JourneyRail
        steps={journey}
        activeStep={activeJourneyStep}
        width={width}
        height={height}
        accent={accent}
        artDirection={art_direction}
      />

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
              beatPulse={beatPulse}
              artDirection={art_direction}
              sceneStartFrame={start}
            />
          </Sequence>
        );
      })}
      {narration && <Audio src={staticFile(narration)} />}
      {/* Background Music: Warm Focus default looped with dynamic sidechain ducking */}
      {(() => {
        const bgMusic = music === "none" ? null : (music || "music/warm_focus.mp3");
        if (!bgMusic) return null;
        const vol = typeof music_volume === "number" ? music_volume : 0.32;
        // Warm Focus duration is 171.3s (~5140 frames at 30 fps)
        const musicFrames = Math.max(1, Math.floor(171.3 * fps));

        let effectiveVol = vol;
        if (music_ducking) {
          let speechActive = Boolean(narration);
          if (!narration && activeScene) {
            const sceneFrame = globalFrame - activeSceneStart;
            const sceneDuration = activeScene.durationInFrames;
            // Active narration speech: ducks during speech, swells during natural pause/outro
            if (activeScene.audio && sceneFrame < sceneDuration - Math.floor(0.35 * fps)) {
              speechActive = true;
            }
          }
          // Duck to 35% of base volume while narration is speaking
          effectiveVol = speechActive ? vol * 0.35 : vol;
        }

        return (
          <Loop durationInFrames={musicFrames}>
            <Audio
              src={staticFile(bgMusic)}
              volume={effectiveVol}
            />
          </Loop>
        );
      })()}
      <Finish artDirection={art_direction} />
    </AbsoluteFill>
    </ThemeContext.Provider>
  );
};
