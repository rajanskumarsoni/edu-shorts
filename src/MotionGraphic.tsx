import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import * as LucideIcons from "lucide-react";
import { Lottie, type LottieAnimationData } from "@remotion/lottie";

// ============================================================================
// 1. COMPREHENSIVE SEMANTIC ALIAS MAP
// ============================================================================
export const ICON_ALIASES: Record<string, string> = {
  // Mobile, Hardware & Devices
  phone: "Smartphone",
  smartphone: "Smartphone",
  mobile: "Smartphone",
  cellphone: "Smartphone",
  tablet: "Tablet",
  laptop: "Laptop",
  macbook: "Laptop",
  pc: "Monitor",
  monitor: "Monitor",
  display: "Monitor",
  screen: "Monitor",
  tv: "Tv",
  television: "Tv",
  camera: "Camera",
  webcam: "Camera",
  watch: "Watch",
  smartwatch: "Watch",
  cpu: "Cpu",
  chip: "Cpu",
  gpu: "Cpu",
  tpu: "Cpu",
  processor: "Cpu",
  hardware: "Cpu",
  harddrive: "HardDrive",
  "hard-drive": "HardDrive",
  hdd: "HardDrive",
  ssd: "HardDrive",
  usb: "Usb",

  // Infrastructure, Cloud, Web & Code
  server: "Server",
  servers: "Server",
  datacenter: "Server",
  cluster: "Server",
  node: "Server",
  database: "Database",
  db: "Database",
  sql: "Database",
  nosql: "Database",
  postgres: "Database",
  redis: "Database",
  storage: "Database",
  cloud: "Cloud",
  aws: "Cloud",
  gcp: "Cloud",
  azure: "Cloud",
  globe: "Globe",
  world: "Globe",
  earth: "Globe",
  international: "Globe",
  web: "Globe",
  network: "Network",
  topology: "Network",
  internet: "Network",
  mesh: "Network",
  wifi: "Wifi",
  wireless: "Wifi",
  broadband: "Wifi",
  router: "Router",
  switch: "Router",
  layers: "Layers",
  stack: "Layers",
  hierarchy: "Layers",
  cache: "Layers",
  terminal: "Terminal",
  console: "Terminal",
  cli: "Terminal",
  code: "Code2",
  coding: "Code2",
  script: "Code2",
  python: "Terminal",
  binary: "Binary",
  workflow: "Workflow",
  pipeline: "Workflow",
  git: "GitBranch",
  "git-branch": "GitBranch",
  branch: "GitBranch",
  api: "Boxes",
  microservices: "Boxes",

  // Transport, Highway, Traffic & Flow
  route: "Route",
  highway: "Route",
  road: "Route",
  traffic: "Route",
  tunnel: "Route",
  path: "Route",
  car: "Car",
  vehicle: "Car",
  auto: "Car",
  truck: "Truck",
  plane: "Plane",
  flight: "Plane",
  airplane: "Plane",
  rocket: "Rocket",
  launch: "Rocket",
  satellite: "Satellite",
  navigation: "Navigation",
  gps: "Navigation",
  waypoints: "Waypoints",
  "map-pin": "MapPin",
  compass: "Compass",
  split: "Split",
  fork: "Split",

  // Finance, Payments, Money & Retail
  creditcard: "CreditCard",
  "credit-card": "CreditCard",
  card: "CreditCard",
  payment: "CreditCard",
  checkout: "CreditCard",
  wallet: "Wallet",
  banknote: "Banknote",
  money: "Banknote",
  cash: "Banknote",
  currency: "Banknote",
  "indian-rupee": "IndianRupee",
  rupee: "IndianRupee",
  inr: "IndianRupee",
  "dollar-sign": "DollarSign",
  dollar: "DollarSign",
  coins: "Coins",
  receipt: "Receipt",
  invoice: "Receipt",
  bill: "Receipt",
  landmark: "Landmark",
  bank: "Landmark",
  cbs: "Landmark",
  building: "Building2",
  "building-2": "Building2",
  city: "Building2",
  office: "Building2",
  store: "Store",
  shop: "Store",
  cart: "ShoppingCart",
  "shopping-cart": "ShoppingCart",

  // AI, Math, Science & Algorithms
  brain: "Brain",
  ai: "Brain",
  ml: "Brain",
  neural: "Brain",
  deeplearning: "Brain",
  "deep-learning": "Brain",
  intelligence: "Brain",
  bot: "Bot",
  robot: "Bot",
  agent: "Bot",
  chatgpt: "Bot",
  assistant: "Bot",
  sparkles: "Sparkles",
  magic: "Sparkles",
  sparkle: "Sparkles",
  atom: "Atom",
  quantum: "Atom",
  physics: "Atom",
  dna: "Dna",
  genetics: "Dna",
  biology: "Dna",
  calculator: "Calculator",
  math: "Calculator",
  mathematics: "Calculator",
  formula: "Calculator",
  equation: "Calculator",
  sigma: "Sigma",
  sum: "Sigma",
  microscope: "Microscope",
  science: "Microscope",
  orbit: "Orbit",

  // Security, Identity, Scanning & Auth
  qrcode: "QrCode",
  "qr-code": "QrCode",
  qr: "QrCode",
  scan: "Scan",
  scanner: "Scan",
  shield: "ShieldCheck",
  "shield-check": "ShieldCheck",
  "shield-alert": "ShieldAlert",
  security: "ShieldCheck",
  protection: "ShieldCheck",
  firewall: "ShieldCheck",
  lock: "Lock",
  locked: "Lock",
  encryption: "Lock",
  crypto: "Lock",
  key: "KeyRound",
  "key-round": "KeyRound",
  keys: "KeyRound",
  fingerprint: "Fingerprint",
  biometric: "Fingerprint",
  "scan-face": "ScanFace",
  faceid: "ScanFace",

  // Performance, Latency & Metrics
  activity: "Activity",
  heartbeat: "Activity",
  pulse: "Activity",
  vital: "Activity",
  gauge: "Gauge",
  speedometer: "Gauge",
  speed: "Gauge",
  benchmark: "Gauge",
  zap: "Zap",
  lightning: "Zap",
  fast: "Zap",
  instant: "Zap",
  flame: "Flame",
  fire: "Flame",
  hot: "Flame",
  timer: "Timer",
  clock: "Clock",
  time: "Clock",
  seconds: "Clock",
  "trending-up": "TrendingUp",
  growth: "TrendingUp",
  "bar-chart": "BarChart3",
  analytics: "BarChart3",

  // Math & Geometry
  triangle: "Triangle",
  triangles: "Triangle",
  square: "Square",
  circle: "Circle",
  percent: "Percent",
  percentage: "Percent",
  infinity: "Infinity",
  angle: "Maximize2",

  // Files, Documents & Storage
  file: "FileText",
  "file-text": "FileText",
  document: "FileText",
  docs: "FileText",
  folder: "Folder",
  download: "Download",
  upload: "Upload",
  archive: "Archive",

  // Audio, Media & Video
  speaker: "Volume2",
  sound: "Volume2",
  music: "Music",
  video: "Video",
  film: "Film",

  // Communication & Transfer
  mail: "Mail",
  email: "Mail",
  send: "Send",
  sync: "RefreshCw",
  refresh: "RefreshCw",

  // General & Social
  users: "Users",
  community: "Users",
  user: "User",
  person: "User",
  client: "User",
  "message-square": "MessageSquare",
  chat: "MessageSquare",
  comment: "MessageSquare",
  share: "Share2",
  bell: "Bell",
  notification: "Bell",
  star: "Star",
  favorite: "Star",
  "check-circle": "CheckCircle2",
  check: "CheckCircle2",
  done: "CheckCircle2",
  success: "CheckCircle2",
  "alert-triangle": "AlertTriangle",
  alert: "AlertTriangle",
  warning: "AlertTriangle",
  error: "AlertTriangle",
  bug: "Bug",
  help: "HelpCircle",
  headphones: "Headphones",
  mic: "Mic",
  microphone: "Mic",
  package: "Package",
  box: "Package",
  container: "Package",
  docker: "Package",
};

// ============================================================================
// 2. DYNAMIC ICON RESOLVER (SUPPORTS ALL 1,500+ LUCIDE ICONS)
// ============================================================================
export function resolveLucideIcon(key: string): LucideIcons.LucideIcon | null {
  if (!key) return null;
  const raw = key.trim();

  // 1. Direct check in aliases
  const aliasTarget = ICON_ALIASES[raw.toLowerCase()];
  const lookupName = aliasTarget || raw;

  // 2. Convert to PascalCase for dynamic 1,500+ icon access
  const pascal = lookupName
    .replace(/(^\w|[-_]\w)/g, (m) => m.replace(/[-_]/, "").toUpperCase())
    .trim();

  const candidate = (LucideIcons as Record<string, any>)[pascal];
  if (typeof candidate === "function" || (candidate && candidate.$$typeof)) {
    return candidate as LucideIcons.LucideIcon;
  }

  // 3. Fallback check with "Icon" suffix
  const withIcon = (LucideIcons as Record<string, any>)[`${pascal}Icon`];
  if (typeof withIcon === "function" || (withIcon && withIcon.$$typeof)) {
    return withIcon as LucideIcons.LucideIcon;
  }

  return null;
}

// ============================================================================
// 3. SMART KEYWORD AUTO-DETECTION ENGINE (HINDI & ENGLISH)
// ============================================================================
export function detectIconFromText(text?: string, narration?: string): string | null {
  const corpus = `${text || ""} ${narration || ""}`.toLowerCase();
  if (!corpus.trim()) return null;

  // Ordered semantic priority rules
  if (corpus.match(/क्यू-आर|क्यूआर|qr\s*code|qrcode|\bqr\b|स्कैन|scan/)) return "qrcode";
  if (corpus.match(/त्रिभुज|triangle|त्रिकोण|कर्ण|hypotenuse|भुजा/)) return "triangle";
  if (corpus.match(/प्रतिशत|प्रतिशतता|percent|percentage|अनुपात|ratio/)) return "percent";
  if (corpus.match(/फोन|फ़ोन|phone|स्मार्टफोन|smartphone|मोबाइल|mobile/)) return "smartphone";
  if (corpus.match(/सर्वर|server|डेटासेंटर|datacenter|क्लस्टर|cluster|होस्ट/)) return "server";
  if (corpus.match(/हाईवे|highway|सड़क|सडक|ट्रैफिक|traffic|रोड|route|रास्ता/)) return "route";
  if (corpus.match(/बैंक|bank|खाता|तिजोरी|vault|cbs/)) return "landmark";
  if (corpus.match(/क्रेडिट|कार्ड|card|पेमेंट|payment|checkout/)) return "creditcard";
  if (corpus.match(/रुपये|पैसे|कैश|नकद|ट्रांजेक्शन|transaction|rupee|money/)) return "indian-rupee";
  if (corpus.match(/पिन|pin|सुरक्षा|सिक्योर|secure|keystore|aes|incript|पासवर्ड|auth/)) return "shield-check";
  if (corpus.match(/ताला|लॉक|lock|encryption|एन्क्रिप्शन/)) return "lock";
  if (corpus.match(/चाबी|की|key|token|टोकन/)) return "key";
  if (corpus.match(/डेटाबेस|डाटाबेस|database|\bdb\b|स्टोरेज|storage|लेज़र|ledger/)) return "database";
  if (corpus.match(/चैट-जीपीटी|chatgpt|ai|एआई|न्यूरल|neural|दिमाग|brain|मॉडल|model/)) return "brain";
  if (corpus.match(/रोबोट|bot|बॉट|ऑटोमेशन|agent|एजेंट/)) return "bot";
  if (corpus.match(/चिप|chip|जीपीयू|gpu|hardware|cpu|हार्डवेयर|प्रोसेसर|मेमोरी|memory|ram/)) return "cpu";
  if (corpus.match(/स्पीड|रफ्तार|तेज़|फास्ट|latency|लेटेंसी|सेकंड|instant|speed/)) return "zap";
  if (corpus.match(/समीकरण|फॉर्मूला|formula|equation|गणित|math|पायथागोरस/)) return "calculator";
  if (corpus.match(/पुल|इमारत|building|bridge|टावर|ऑफिस/)) return "building-2";
  if (corpus.match(/रॉकेट|rocket|सैटेलाइट|satellite|अंतरिक्ष|space/)) return "rocket";
  if (corpus.match(/नेटवर्क|network|इंटरनेट|internet|कनेक्शन|connection/)) return "network";
  if (corpus.match(/ग्लोब|globe|दुनिया|world|earth|देश/)) return "globe";
  if (corpus.match(/क्लाउड|cloud/)) return "cloud";
  if (corpus.match(/फ़ाइल|फाइल|file|दस्तावेज|document|docs/)) return "file-text";
  if (corpus.match(/यूज़र|यूजर|ग्राहक|उपभोक्ता|user|client|customer/)) return "user";
  if (corpus.match(/कोड|code|पायथन|python|टर्मिनल|terminal|फंक्शन/)) return "terminal";
  if (corpus.match(/घड़ी|समय|टाइम|timer|clock/)) return "timer";
  if (corpus.match(/कैमरा|camera|फोटो|photo/)) return "camera";
  if (corpus.match(/गाड़ी|कार|car|vehicle/)) return "car";
  if (corpus.match(/आग|flame|fire/)) return "flame";
  if (corpus.match(/मैजिक|जादू|sparkle|sparkles/)) return "sparkles";

  return null;
}

// ============================================================================
// 4. MOTION GRAPHIC COMPONENT
// ============================================================================
export interface MotionGraphicProps {
  icon?: string;
  name?: string;
  text?: string;
  narration?: string;
  lottieData?: LottieAnimationData | null;
  accent?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showPedestal?: boolean;
  showRadar?: boolean;
  style?: React.CSSProperties;
}

export const MotionGraphic: React.FC<MotionGraphicProps> = ({
  icon,
  name,
  text,
  narration,
  lottieData,
  accent = "#00F0FF",
  size = "md",
  showPedestal = true,
  showRadar = true,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Resolve icon identifier: explicit prop or smart auto-detection
  const rawKey = (icon || name || detectIconFromText(text, narration) || "").trim();
  const IconComponent = resolveLucideIcon(rawKey);

  // If neither Lottie data nor a valid icon was resolved, return null
  if (!lottieData && !IconComponent) {
    return null;
  }

  // Dimension scaling
  const sizeMap = {
    xs: { iconSize: 20, badgeSize: 38, stroke: 2.2 },
    sm: { iconSize: 34, badgeSize: 62, stroke: 2.2 },
    md: { iconSize: 68, badgeSize: 124, stroke: 2.0 },
    lg: { iconSize: 104, badgeSize: 184, stroke: 1.8 },
    xl: { iconSize: 136, badgeSize: 236, stroke: 1.6 },
  };
  const S = sizeMap[size];

  // Kinetic spring entrance
  const intro = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.8 },
  });

  // Micro-animations on the beat
  const floatY = Math.sin(frame * 0.08) * 8;
  const pulseScale = 1 + Math.sin(frame * 0.12) * 0.03;
  const radarRotation = frame * 1.2;
  const radarPulse = (Math.sin(frame * 0.08) + 1) / 2;

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        transform: `scale(${intro * pulseScale}) translateY(${floatY}px)`,
        transformOrigin: "center center",
        ...style,
      }}
    >
      {/* 1. Concentric Holographic Radar & Tech Target Rings */}
      {showRadar && size !== "sm" && (
        <svg
          width={S.badgeSize * 2.2}
          height={S.badgeSize * 2.2}
          viewBox={`0 0 ${S.badgeSize * 2.2} ${S.badgeSize * 2.2}`}
          style={{
            position: "absolute",
            pointerEvents: "none",
            zIndex: 0,
            opacity: 0.45 * intro,
          }}
        >
          {/* Rotating dashed ring */}
          <circle
            cx={S.badgeSize * 1.1}
            cy={S.badgeSize * 1.1}
            r={S.badgeSize * 0.85}
            fill="none"
            stroke={accent}
            strokeWidth="1.5"
            strokeDasharray="6 8"
            transform={`rotate(${radarRotation} ${S.badgeSize * 1.1} ${S.badgeSize * 1.1})`}
          />
          {/* Breathing pulse halo */}
          <circle
            cx={S.badgeSize * 1.1}
            cy={S.badgeSize * 1.1}
            r={S.badgeSize * (0.65 + 0.15 * radarPulse)}
            fill="none"
            stroke={accent}
            strokeWidth="2"
            opacity={0.3 + 0.3 * (1 - radarPulse)}
          />
        </svg>
      )}

      {/* 2. Glassmorphic Glowing Pedestal Badge */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: S.badgeSize,
          height: S.badgeSize,
          borderRadius: size === "sm" ? 16 : 28,
          background: showPedestal
            ? `radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.12), rgba(11, 16, 32, 0.85))`
            : "transparent",
          border: showPedestal ? `1.5px solid ${accent}77` : "none",
          boxShadow: showPedestal
            ? `0 0 40px ${accent}33, 0 20px 40px rgba(0,0,0,0.6), inset 0 0 25px ${accent}22`
            : "none",
          backdropFilter: showPedestal ? "blur(12px)" : "none",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Four Sci-Fi HUD Corner Brackets */}
        {showPedestal && size !== "sm" && (
          <>
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                width: 8,
                height: 8,
                borderTop: `2px solid ${accent}`,
                borderLeft: `2px solid ${accent}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderTop: `2px solid ${accent}`,
                borderRight: `2px solid ${accent}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 8,
                left: 8,
                width: 8,
                height: 8,
                borderBottom: `2px solid ${accent}`,
                borderLeft: `2px solid ${accent}`,
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                width: 8,
                height: 8,
                borderBottom: `2px solid ${accent}`,
                borderRight: `2px solid ${accent}`,
              }}
            />
          </>
        )}

        {/* 3. The Core Icon or Lottie Animation with Neon Drop Shadow */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            filter: `drop-shadow(0 0 16px ${accent}) drop-shadow(0 0 4px #FFFFFF)`,
          }}
        >
          {lottieData ? (
            <Lottie
              animationData={lottieData}
              style={{ width: S.iconSize, height: S.iconSize }}
            />
          ) : IconComponent ? (
            <IconComponent
              size={S.iconSize}
              color="#FFFFFF"
              strokeWidth={S.stroke}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
