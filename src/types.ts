export type SceneType =
  | "hook"
  | "bullets"
  | "stat"
  | "manim"
  | "outro"
  | "image"
  | "quote"
  | "compare"
  | "three"
  | "code"
  | "architecture"
  | "gauge"
  | "timeline"
  | "callout"
  | "bento"
  | "benchmark"
  | "hierarchy"
  | "data_structure"
  | "inspector"
  | "quadrant"
  | "concentric";

export type Side = { heading: string; items: string[] };

export type BentoItem = {
  title?: string;
  value?: string | number;
  badge?: string;
  type?: string;
  span?: number;
  icon?: string;
};

export type BenchmarkRunner = {
  name: string;
  value: number;
  status?: string;
  color?: string;
};

export type HierarchyLayer = {
  name: string;
  spec?: string;
  active?: boolean;
  icon?: string;
};

export type InspectorSection = {
  name: string;
  desc?: string;
  color?: string;
  code?: string;
  icon?: string;
};

export type QuadrantPoint = {
  name: string;
  x: number;
  y: number;
  icon?: string;
};

export type VisualStoryboard = {
  camera?: string; // camera movement, lens, and framing (e.g. "Dolly-in along Z-axis")
  objects?: string[] | string; // 3D models, assets, environments, characters
  action?: string; // what each object or actor does physically
  motion_graphics?: string[] | string; // HUD, telemetry, shaders, particles, diagrams
  start?: string; // exact visual state at the beginning
  end?: string; // exact visual state at the end (for match-cuts)
  environment?: string; // 3D environment or lighting setup
  purpose?: string; // pedagogical goal
  transition?: string; // how the scene connects to the next
};

export type SceneSpec = {
  type: SceneType;
  durationInFrames: number;
  purpose?: string; // pedagogical objective: what the viewer must understand
  transition?: string; // scene transition (e.g. "zoom_through", "match_cut", "whip_pan", "morph")
  audio?: string; // per-scene audio (audio_mode "scenes"), path inside /public
  video?: string; // rendered Manim clip, path inside /public
  image?: string; // image scene, path inside /public
  text?: string; // hook / outro / quote / callout
  author?: string; // quote
  title?: string; // bullets / manim / image / compare / three / code / architecture / gauge / timeline / callout
  items?: (string | { text: string; icon?: string })[]; // bullets / timeline
  icon?: string; // semantic icon name (e.g. "smartphone", "server", "route", "database", "brain", "creditcard")
  graphic?: string; // motion graphic or lottie/3d variant (e.g. "highway_3d", "lottie/scan.json")
  visual?: string | VisualStoryboard; // visual storyboard / animation description (string or structured object)
  motion?: string; // camera / physics motion directives
  camera?: string; // optional camera movement directive
  action?: string; // optional object action directive
  objects?: string[] | string; // optional 3D objects directive
  value?: string | number; // stat / gauge
  label?: string; // stat / gauge
  left?: Side; // compare
  right?: Side; // compare
  variant?: string; // three: "gradient_descent", "neural_network_3d", "globe_network_3d", "server_rack_3d"
  component?: string; // three custom component name
  equation?: string; // three: bold on-screen formula
  metrics?: Record<string, string | number>; // three: HUD metrics
  // code scene
  code?: string;
  lines?: string[];
  language?: string;
  filename?: string;
  highlight?: number | number[];
  // architecture scene
  nodes?: string[];
  steps?: string[];
  activeNode?: number;
  tag?: string;
  direction?: "vertical" | "horizontal";
  // gauge scene
  startValue?: number;
  endValue?: number;
  unit?: string;
  status?: string;
  min?: number;
  max?: number;
  badge?: string;
  // timeline scene
  activeStep?: number;
  // callout scene
  category?: string;
  subtext?: string;
  // bento scene
  bentoItems?: BentoItem[];
  // benchmark scene
  runners?: BenchmarkRunner[];
  // hierarchy scene
  layers?: HierarchyLayer[];
  // data_structure scene
  structure?: "queue" | "stack" | "buffer" | "hashmap" | string;
  operations?: string[];
  // inspector scene
  sections?: InspectorSection[];
  // quadrant scene
  xAxis?: string;
  yAxis?: string;
  points?: QuadrantPoint[];
  // concentric scene
  rings?: string[];
  narration?: string;
  // sound fx: pick any sound from the local library (e.g. "ka_ching", "impact", "glitch", "pop", "typing") or timed cues
  sfx?: SceneSfxSpec;
  sfxVolume?: number;
};

export type SoundFxName =
  | "whoosh"
  | "fast_whoosh"
  | "riser"
  | "downlifter"
  | "pop"
  | "tick"
  | "click"
  | "ting"
  | "ding"
  | "ka_ching"
  | "impact"
  | "bass_drop"
  | "thud"
  | "heartbeat"
  | "typing"
  | "camera_shutter"
  | "glitch"
  | "sparkle"
  | "radar_beep"
  | "none"
  | string;

export type SoundCue = {
  sound: SoundFxName;
  frame?: number; // frame offset within scene (default 0)
  volume?: number; // 0.0 to 1.0
};

export type SceneSfxSpec = SoundFxName | SoundFxName[] | SoundCue | SoundCue[] | boolean;

export type VideoProps = {
  fps: number;
  width: number;
  height: number;
  music?: string;
  music_volume?: number;
  narration?: string; // single narration track covering the whole video
  accent?: string;
  captions?: boolean; // toggle kinetic word captions (default: true)
  progress?: boolean; // toggle top glowing progress bar (default: true)
  sfx?: boolean; // toggle procedural audio SFX (default: true)
  loop?: boolean; // toggle seamless loop mode (default: false)
  scenes: SceneSpec[];
};
