export type SceneType =
  | "hook"
  | "bullets"
  | "stat"
  | "manim"
  | "video"
  | "diagram"
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
  | "concentric"
  | "seat_booking"
  | "neural_network_graph"
  | "interview"
  | "terminal"
  | "screenshot"
  | "chart"
  | "product"
  | "sorting_visualizer"
  | "amazon_shopping"
  | "whiteboard"
  | "refrigerator"
  | "air_conditioner";

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

export type TerminalStep =
  | { kind: "cmd"; text: string; typeSpeed?: number; holdSeconds?: number }
  | { kind: "out"; text: string; holdSeconds?: number }
  | { kind: "pause"; seconds: number }
  | { kind: "pill"; text: string; color?: string; durationSeconds?: number };

export type ScreenshotRegion = { x: number; y: number; w: number; h: number };
export type ScreenshotPoint = [number, number];

export type ScreenshotStep =
  | { kind: "cursor_move"; to: ScreenshotPoint; durationSeconds?: number }
  | { kind: "click_pulse"; at?: ScreenshotPoint; durationSeconds?: number; color?: string }
  | { kind: "type_into"; region: ScreenshotRegion; text: string; typeSpeed?: number; color?: string }
  | { kind: "bubble_append"; region: ScreenshotRegion; text: string; role?: "user" | "assistant"; durationSeconds?: number; stream?: boolean }
  | { kind: "typing_dots"; at: ScreenshotPoint; durationSeconds?: number; color?: string }
  | { kind: "highlight_box"; region: ScreenshotRegion; durationSeconds?: number; color?: string }
  | { kind: "callout_balloon"; anchor: ScreenshotPoint; text: string; position?: "top" | "bottom" | "left" | "right"; durationSeconds?: number; color?: string }
  | { kind: "pause"; seconds: number };

export type ChartDatum = {
  label: string;
  value: number;
  color?: string;
};

export type ChartType = "bar" | "line" | "kpi";

export type VisualStoryboard = {
  camera: string;
  objects: string[];
  action: string;
  motion_graphics: string[];
  start: string;
  end: string;
  environment?: string;
  purpose?: string; // pedagogical goal
  transition?: string; // how the scene connects to the next
};

export type ArtDirection = "editorial" | "cinematic";

export type VisualBeat = {
  at: number; // normalized scene progress, from 0 to 1
  label: string;
  action: string;
  state?: string;
  visualState?: string; // optional machine-readable state for purpose-built scene renderers
  focus?: string;
  journeyStep?: number; // zero-based stage override for this beat
};

export type SceneSpec = {
  type: SceneType;
  durationInFrames: number;
  purpose?: string; // pedagogical objective: what the viewer must understand
  transition?: string; // scene transition (e.g. "zoom_through", "match_cut", "whip_pan", "morph")
  audio?: string; // per-scene audio (audio_mode "scenes"), path inside /public
  video?: string; // rendered Manim clip or stock B-roll video, path inside /public
  image?: string; // image scene, path inside /public
  diagram?: string; // diagram scene (SVG/PNG), path inside /public
  mermaid?: string; // Mermaid diagram code string
  graphviz?: string; // Graphviz DOT diagram code string
  search_image?: string; // internet image query for automated asset resolution
  generate_image?: string; // GenAI image generation prompt (Pollinations.ai)
  search_video?: string; // internet stock B-roll query for automated asset resolution
  search_icon?: string; // vector icon query for automated asset resolution
  icon_path?: string; // vector SVG icon path inside /public
  search_sfx?: string; // sound effect query for automated asset resolution
  search_model?: string; // 3D model query for automated asset resolution
  text?: string; // hook / outro / quote / callout
  author?: string; // quote
  title?: string; // bullets / manim / image / compare / three / code / architecture / gauge / timeline / callout
  items?: (string | { text: string; icon?: string })[]; // bullets / timeline
  icon?: string; // semantic icon name (e.g. "smartphone", "server", "route", "database", "brain", "creditcard")
  graphic?: string; // motion graphic or lottie/3d variant (e.g. "highway_3d", "lottie/scan.json")
  visual?: VisualStoryboard;
  beats?: VisualBeat[];
  journeyStep?: number; // zero-based active stage in VideoProps.journey (string or structured object)
  motion?: string; // camera / physics motion directives
  camera?: string; // optional camera movement directive
  action?: string; // optional object action directive
  objects?: string[] | string; // optional 3D objects directive
  value?: string | number; // stat / gauge
  label?: string; // stat / gauge
  left?: Side; // compare
  right?: Side; // compare
  variant?: string; // three: "gradient_descent", "neural_network_3d", "globe_network_3d", "server_rack_3d", "model_3d"
  model?: string; // three: path to .glb / .gltf model (e.g. "models/how-upi-works/smartphone.glb") or external URL
  modelScale?: number; // three: optional scale multiplier (default: 1.0)
  modelRotation?: [number, number, number]; // three: initial Euler rotation offset [x, y, z]
  component?: string; // three custom component name
  equation?: string; // three: bold on-screen formula
  metrics?: Record<string, string | number>; // three: HUD metrics
  // code scene
  code?: string;
  lines?: string[];
  language?: string;
  filename?: string;
  highlight?: number | number[] | string;
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
  // neural_network_graph / sorting_visualizer scene
  mode?: "forward" | "backward" | "compare_pair" | "pass_one" | "shrinking_arena" | "sorted" | string;
  sortTriggerFrame?: number;
  // interview scene
  interview?: {
    speaker?: string;
    text?: string;
    strikethrough?: boolean;
    highlight?: string | string[];
    subtext?: string;
  };
  // terminal scene
  terminalSteps?: TerminalStep[];
  prompt?: string;
  // screenshot scene
  screenshotSteps?: ScreenshotStep[];
  backgroundSize?: { width: number; height: number };
  // chart scene
  chartType?: ChartType;
  chartData?: ChartDatum[];
  chartTitle?: string;
  // product scene (real object / hardware showcase)
  specs?: Array<{ label: string; value: string }> | Record<string, string>;
  price?: string;
  tagline?: string;
  // whiteboard / hand-drawn scene (powered by p5.brush)
  whiteboardType?: "algorithm" | "sorting" | "architecture" | "tree" | "math" | "flow" | "napkin" | "freehand" | "infographic" | "radial" | "comparison" | "loop";
  whiteboardTheme?: "chalkboard" | "whiteboard" | "grid";
  brushName?: "rotring" | "HB" | "2B" | "pen" | "cpencil" | "marker" | "charcoal" | string;
  paper?: "chalkboard" | "whiteboard" | "grid";
  whiteboardData?: Array<{
    label?: string;
    value?: number | string;
    highlight?: boolean;
    color?: string;
    subtext?: string;
  }>;
  strokes?: Array<{
    type: "line" | "rect" | "circle" | "spline" | "arrow" | "text" | "hatch";
    from?: [number, number];
    to?: [number, number];
    points?: [number, number][];
    center?: [number, number];
    radius?: number;
    width?: number;
    height?: number;
    text?: string;
    color?: string;
    brush?: string;
    weight?: number;
    fill?: string;
    hatchAngle?: number;
    hatchDist?: number;
    startFrame?: number;
    duration?: number;
  }>;
  narration?: string;
  // sound fx: pick any sound from the local library (e.g. "ka_ching", "impact", "glitch", "pop", "typing") or timed cues
  sfx?: SceneSfxSpec;
  sfxVolume?: number;
  wordTimings?: Array<{ word: string; start: number; end: number }>;
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
  loop?: boolean; // if true, loops audio for duration frames
  duration?: number; // duration in frames to loop or sustain
  repeat?: number; // repeat count
  interval?: number; // frame interval between repeats
};

export type SceneSfxSpec = SoundFxName | SoundFxName[] | SoundCue | SoundCue[] | boolean;

export type VideoProps = {
  fps: number;
  width: number;
  height: number;
  music?: string;
  music_volume?: number;
  music_ducking?: boolean; // toggle dynamic sidechain ducking under narration (default: true)
  narration?: string; // single narration track covering the whole video
  accent?: string;
  theme?: string; // design token palette: "cyberpunk" | "slate" | "amber" | "emerald" | "whiteboard"
  art_direction?: ArtDirection; // restrained editorial motion graphics by default
  captions?: boolean; // toggle kinetic word captions (default: true)
  progress?: boolean; // toggle top glowing progress bar (default: true)
  sfx?: boolean; // toggle procedural audio SFX (default: true)
  loop?: boolean; // toggle seamless loop mode (default: false)
  beatPulse?: boolean; // toggle the background beat pulse
  journey?: string[]; // optional persistent chapter rail shared by scenes
  scenes: SceneSpec[];
};
