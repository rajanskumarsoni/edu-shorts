export type SceneType =
  | "hook"
  | "bullets"
  | "stat"
  | "manim"
  | "outro"
  | "image"
  | "quote"
  | "compare"
  | "three";

export type Side = { heading: string; items: string[] };

export type SceneSpec = {
  type: SceneType;
  durationInFrames: number;
  audio?: string; // per-scene audio (audio_mode "scenes"), path inside /public
  video?: string; // rendered Manim clip, path inside /public
  image?: string; // image scene, path inside /public
  text?: string; // hook / outro / quote
  author?: string; // quote
  title?: string; // bullets / manim / image / compare / three
  items?: string[]; // bullets
  value?: string; // stat
  label?: string; // stat
  left?: Side; // compare
  right?: Side; // compare
  variant?: string; // three: "gradient_descent", "neural_surface", etc.
  component?: string; // three custom component name
  equation?: string; // three: bold on-screen formula
  metrics?: Record<string, string | number>; // three: HUD metrics
};

export type VideoProps = {
  fps: number;
  width: number;
  height: number;
  music?: string;
  narration?: string; // single narration track covering the whole video
  accent?: string;
  scenes: SceneSpec[];
};
