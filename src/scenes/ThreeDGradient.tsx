import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";

// -----------------------------------------------------------------------------
// Mathematical Elevation & Analytic Gradients
// -----------------------------------------------------------------------------
function evaluateElevation(x: number, y: number): number {
  const dCenterSq = x * x + y * y;
  const dCrestSq = (x - 2.2) * (x - 2.2) + (y - 2.2) * (y - 2.2);
  const crest = 2.4 * Math.exp(-dCrestSq / 2.2);
  const trough = -2.2 * Math.exp(-dCenterSq / 3.0);
  const ripples = 0.25 * Math.sin(1.8 * x) * Math.cos(1.8 * y);
  const quadraticBowl = 0.12 * (x * x + y * y);
  return crest + trough + ripples + quadraticBowl;
}

function computeGradient(x: number, y: number) {
  const h = 0.001;
  const dz_dx = (evaluateElevation(x + h, y) - evaluateElevation(x - h, y)) / (2 * h);
  const dz_dy = (evaluateElevation(x, y + h) - evaluateElevation(x, y - h)) / (2 * h);
  return { dx: dz_dx, dy: dz_dy };
}

// -----------------------------------------------------------------------------
// Pre-computed Trajectories: Batch, Stochastic (SGD), and Mini-Batch
// -----------------------------------------------------------------------------
type Step = { x: number; y: number; z: number };

// 1. Full Batch GD (Smooth, direct, deterministic)
const BATCH_STEPS: Step[] = [];
(function generateBatchTrajectory() {
  let cx = 2.2, cy = 2.2;
  let vx = 0, vy = 0;
  for (let s = 0; s < 45; s++) {
    BATCH_STEPS.push({ x: cx, y: cy, z: evaluateElevation(cx, cy) });
    const g = computeGradient(cx, cy);
    vx = 0.30 * vx + 0.080 * g.dx;
    vy = 0.30 * vy + 0.080 * g.dy;
    cx -= vx;
    cy -= vy;
  }
})();

// 2. Stochastic GD (SGD - 1 sample, high variance zig-zag)
const SGD_STEPS: Step[] = [];
(function generateSGDTrajectory() {
  let cx = 2.2, cy = 2.2;
  let vx = 0, vy = 0;
  for (let s = 0; s < 45; s++) {
    SGD_STEPS.push({ x: cx, y: cy, z: evaluateElevation(cx, cy) });
    const g = computeGradient(cx, cy);
    const angle = (s * 2.399) % (2 * Math.PI);
    const noiseMag = 1.4 * Math.sin(s * 3.1) + 1.1;
    const noiseX = Math.cos(angle) * noiseMag;
    const noiseY = Math.sin(angle) * noiseMag;
    vx = 0.20 * vx + 0.055 * (g.dx + noiseX);
    vy = 0.20 * vy + 0.055 * (g.dy + noiseY);
    cx = Math.max(-3.5, Math.min(3.5, cx - vx));
    cy = Math.max(-3.5, Math.min(3.5, cy - vy));
  }
})();

// 3. Mini-Batch GD (Small batch B=32, balanced speed & stability)
const MINIBATCH_STEPS: Step[] = [];
(function generateMiniBatchTrajectory() {
  let cx = 2.2, cy = 2.2;
  let vx = 0, vy = 0;
  for (let s = 0; s < 45; s++) {
    MINIBATCH_STEPS.push({ x: cx, y: cy, z: evaluateElevation(cx, cy) });
    const g = computeGradient(cx, cy);
    const mbAngle = (s * 1.618) % (2 * Math.PI);
    const mbNoiseX = Math.cos(mbAngle) * 0.32;
    const mbNoiseY = Math.sin(mbAngle) * 0.32;
    vx = 0.32 * vx + 0.085 * (g.dx + mbNoiseX);
    vy = 0.32 * vy + 0.085 * (g.dy + mbNoiseY);
    cx = Math.max(-3.5, Math.min(3.5, cx - vx));
    cy = Math.max(-3.5, Math.min(3.5, cy - vy));
  }
})();

// Helper to interpolate position along a step list
function getInterpolatedPoint(steps: Step[], normTime: number) {
  const pathIndexFloat = normTime * (steps.length - 1);
  const idxLow = Math.floor(pathIndexFloat);
  const idxHigh = Math.min(idxLow + 1, steps.length - 1);
  const frac = pathIndexFloat - idxLow;
  const x = steps[idxLow].x + frac * (steps[idxHigh].x - steps[idxLow].x);
  const y = steps[idxLow].y + frac * (steps[idxHigh].y - steps[idxLow].y);
  const z = evaluateElevation(x, y);
  return { x, y, z, idxHigh };
}

// -----------------------------------------------------------------------------
// GLSL Shaders
// -----------------------------------------------------------------------------
const terrainVertexShader = `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vElevation;

  void main() {
    vNormal = normalMatrix * normal;
    vPosition = position;
    vElevation = position.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const terrainFragmentShader = `
  uniform float uTime;
  uniform vec2 uBallCoords;
  uniform vec3 uVolcanicOrange;
  uniform vec3 uCyan;
  uniform vec3 uGreyDark;
  uniform vec3 uGreyMid;
  uniform vec3 uGreyLight;
  uniform float uMinElevation;
  uniform float uMaxElevation;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vElevation;

  void main() {
    float t = clamp((vElevation - uMinElevation) / (uMaxElevation - uMinElevation), 0.0, 1.0);

    vec3 color;
    if (t < 0.28) {
      float subT = t / 0.28;
      color = mix(uCyan, uGreyDark, smoothstep(0.0, 1.0, subT));
    } else if (t < 0.65) {
      float subT = (t - 0.28) / (0.65 - 0.28);
      color = mix(uGreyDark, uGreyMid, subT);
    } else {
      float subT = (t - 0.65) / (1.0 - 0.65);
      color = mix(uGreyMid, uVolcanicOrange, smoothstep(0.0, 1.0, subT));
    }

    // Procedural GLSL Iso-Elevation Contour Lines
    float contour = abs(fract(vElevation * 3.5 - 0.5) - 0.5) / fwidth(vElevation * 3.5);
    float contourLine = 1.0 - min(contour, 1.0);
    vec3 contourColor = mix(uCyan * 1.5, uVolcanicOrange * 1.6, t);
    color = mix(color, contourColor, contourLine * 0.45);

    // Topological Grid Wireframe
    vec2 grid = abs(fract(vPosition.xz * 1.2 - 0.5) - 0.5) / fwidth(vPosition.xz * 1.2);
    float gridLine = 1.0 - min(min(grid.x, grid.y), 1.0);
    color = mix(color, uGreyLight * 0.4, gridLine * 0.18);

    // Radar pulse wave under moving ball
    float distToBall = length(vPosition.xz - uBallCoords);
    float ripple = sin(distToBall * 8.0 - uTime * 4.0) * exp(-distToBall * 1.4);
    if (distToBall < 1.8) {
      color += mix(uCyan, uVolcanicOrange, t) * max(0.0, ripple) * 0.35;
    }

    // Directional Lighting
    vec3 lightDir = normalize(vec3(0.5, 0.9, 0.6));
    vec3 norm = normalize(vNormal);
    float diff = max(dot(norm, lightDir), 0.18);
    color *= (0.7 + 0.35 * diff);

    gl_FragColor = vec4(color, 1.0);
  }
`;

interface ThreeDGradientProps {
  scene?: SceneSpec;
  accent?: string;
}

export const ThreeDGradient: React.FC<ThreeDGradientProps> = ({ scene, accent: _accent }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const variant = scene?.variant || "gradient_descent";
  const isComparison = variant === "comparison_3d" || variant === "all_three" || variant === "race";
  const isStochastic = variant === "stochastic_gd" || variant === "sgd" || variant === "stochastic";
  const isMiniBatch = variant === "mini_batch" || variant === "minibatch";
  const isBatch = variant === "batch_gd" || variant === "full_batch" || variant === "batch" || (!isComparison && !isStochastic && !isMiniBatch);

  // Time progress along steps (0.0 at Crest to 1.0 at Trough)
  const normTime = Math.min(Math.max((frame - 12) / (durationInFrames - 36), 0), 1);

  // Interpolated points
  const batchPt = getInterpolatedPoint(BATCH_STEPS, normTime);
  const sgdPt = getInterpolatedPoint(SGD_STEPS, normTime);
  const mbPt = getInterpolatedPoint(MINIBATCH_STEPS, normTime);

  // Select primary focus point depending on variant
  const primaryPt = isStochastic ? sgdPt : isMiniBatch ? mbPt : isBatch ? batchPt : mbPt;
  const primaryGrad = computeGradient(primaryPt.x, primaryPt.y);
  const primaryGradNorm = Math.hypot(primaryGrad.dx, primaryGrad.dy);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0x08090c);
    threeScene.fog = new THREE.FogExp2(0x08090c, 0.035);

    // Camera setup with dynamic rotation
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    const camAngle = 0.85 + (frame / durationInFrames) * 0.50;
    const camRadius = 11.2;
    camera.position.set(
      Math.sin(camAngle) * camRadius,
      7.6 - (frame / durationInFrames) * 1.0,
      Math.cos(camAngle) * camRadius
    );
    camera.lookAt(0, -0.6, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x2a3042, 1.4);
    threeScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(6, 12, 8);
    threeScene.add(directionalLight);

    // 3D Terrain
    const planeSize = 9.0;
    const planeSegments = 140;
    const terrainGeo = new THREE.PlaneGeometry(planeSize, planeSize, planeSegments, planeSegments);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    let minZ = 999, maxZ = -999;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const pz = pos.getZ(i);
      const py = evaluateElevation(px, pz);
      pos.setY(i, py);
      if (py < minZ) minZ = py;
      if (py > maxZ) maxZ = py;
    }
    pos.needsUpdate = true;
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.ShaderMaterial({
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
      uniforms: {
        uTime: { value: frame / 30 },
        uBallCoords: { value: new THREE.Vector2(primaryPt.x, primaryPt.y) },
        uVolcanicOrange: { value: new THREE.Color(0xff4400) },
        uCyan: { value: new THREE.Color(0x00f0ff) },
        uGreyDark: { value: new THREE.Color(0x10131b) },
        uGreyMid: { value: new THREE.Color(0x2a3042) },
        uGreyLight: { value: new THREE.Color(0x6b7794) },
        uMinElevation: { value: minZ },
        uMaxElevation: { value: maxZ }
      },
      side: THREE.DoubleSide
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    threeScene.add(terrainMesh);

    // Target minimum ring at center
    const ringGeo = new THREE.RingGeometry(0.22, 0.44, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(0, evaluateElevation(0, 0) + 0.03, 0);
    threeScene.add(ringMesh);

    // Helper to render a trajectory curve + dots + ball
    const addTrajectory = (
      steps: Step[],
      curPt: Step,
      highIdx: number,
      baseColor: THREE.Color,
      ballRadius: number,
      showArrow: boolean,
      isErraticArrow: boolean
    ) => {
      const activeCount = Math.min(highIdx + 1, steps.length);
      const linePositions: number[] = [];
      const lineColors: number[] = [];

      for (let i = 0; i < activeCount; i++) {
        const pt = steps[i];
        linePositions.push(pt.x, pt.z + 0.04, pt.y);
        lineColors.push(baseColor.r, baseColor.g, baseColor.b);

        // Dot marker
        const dotGeo = new THREE.SphereGeometry(0.065, 12, 12);
        const dotMat = new THREE.MeshBasicMaterial({ color: baseColor });
        const dotMesh = new THREE.Mesh(dotGeo, dotMat);
        dotMesh.position.set(pt.x, pt.z + 0.045, pt.y);
        threeScene.add(dotMesh);
      }

      if (linePositions.length >= 6) {
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
        lineGeo.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));
        const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 4 });
        const pathLine = new THREE.Line(lineGeo, lineMat);
        threeScene.add(pathLine);
      }

      // Ball
      const ballGeo = new THREE.SphereGeometry(ballRadius, 32, 32);
      const ballMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 0.95,
        roughness: 0.15,
        metalness: 0.85
      });
      const ballMesh = new THREE.Mesh(ballGeo, ballMat);
      ballMesh.position.set(curPt.x, curPt.z + ballRadius, curPt.y);
      threeScene.add(ballMesh);

      // Aura
      const auraGeo = new THREE.SphereGeometry(ballRadius * 1.5, 16, 16);
      const auraMat = new THREE.MeshBasicMaterial({ color: baseColor, transparent: true, opacity: 0.35, wireframe: true });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.rotation.y = (frame / 30) * 2.0;
      ballMesh.add(auraMesh);

      // Downhill Vector Arrow
      if (showArrow) {
        const g = computeGradient(curPt.x, curPt.y);
        const gNorm = Math.hypot(g.dx, g.dy);
        if (gNorm > 0.01) {
          let arrowDir: THREE.Vector3;
          if (isErraticArrow) {
            // Noisy arrow representing 1 random sample
            const jitterX = Math.sin(frame * 0.4) * 0.6;
            const jitterY = Math.cos(frame * 0.4) * 0.6;
            arrowDir = new THREE.Vector3(-g.dx + jitterX, -gNorm * 0.5, -g.dy + jitterY).normalize();
          } else {
            arrowDir = new THREE.Vector3(-g.dx, -gNorm * 0.5, -g.dy).normalize();
          }
          const arrow = new THREE.ArrowHelper(
            arrowDir,
            new THREE.Vector3(curPt.x, curPt.z + ballRadius + 0.02, curPt.y),
            Math.min(0.4 + gNorm * 0.4, 1.4),
            baseColor.getHex(),
            0.28,
            0.15
          );
          threeScene.add(arrow);
        }
      }
    };

    if (isComparison) {
      // 3D Race: Render all 3 trajectories simultaneously
      addTrajectory(BATCH_STEPS, batchPt, batchPt.idxHigh, new THREE.Color(0x00f0ff), 0.22, false, false);
      addTrajectory(SGD_STEPS, sgdPt, sgdPt.idxHigh, new THREE.Color(0xff4400), 0.22, true, true);
      addTrajectory(MINIBATCH_STEPS, mbPt, mbPt.idxHigh, new THREE.Color(0xffc857), 0.24, true, false);
    } else if (isStochastic) {
      // Stochastic GD: Highly erratic orange trajectory
      addTrajectory(SGD_STEPS, sgdPt, sgdPt.idxHigh, new THREE.Color(0xff4400), 0.25, true, true);
    } else if (isMiniBatch) {
      // Mini-Batch GD: Balanced gold trajectory
      addTrajectory(MINIBATCH_STEPS, mbPt, mbPt.idxHigh, new THREE.Color(0xffc857), 0.25, true, false);
    } else {
      // Full Batch GD: Smooth cyan trajectory
      addTrajectory(BATCH_STEPS, batchPt, batchPt.idxHigh, new THREE.Color(0x00f0ff), 0.25, true, false);
    }

    renderer.render(threeScene, camera);

    return () => {
      renderer.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
    };
  }, [
    frame, width, height, durationInFrames, normTime,
    isComparison, isStochastic, isMiniBatch, isBatch,
    primaryPt.x, primaryPt.y, primaryPt.z,
    batchPt, sgdPt, mbPt
  ]);

  // SVG mini-contour coordinate mapping
  const toSvg = (v: number) => 55 + (v / 4.5) * 48;

  return (
    <AbsoluteFill style={{ background: "#08090c" }}>
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%", height: "100%" }} />

      {/* Cinematic HUD Overlay */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 45,
          right: 45,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          pointerEvents: "none",
        }}
      >
        {/* Top Header Card */}
        <div
          style={{
            background: "rgba(14, 17, 26, 0.94)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: 24,
            padding: "20px 28px",
            boxShadow: "0 20px 45px rgba(0,0,0,0.65)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 28,
                letterSpacing: 2,
                fontWeight: 800,
                color: isComparison ? "#FFC857" : isStochastic ? "#FF5500" : isMiniBatch ? "#58D6C2" : "#00F0FF",
                textTransform: "uppercase",
              }}
            >
              {isComparison
                ? "3D OPTIMIZATION SHOWDOWN"
                : isStochastic
                ? "02 / STOCHASTIC GRADIENT DESCENT"
                : isMiniBatch
                ? "03 / MINI-BATCH GRADIENT DESCENT"
                : "01 / FULL BATCH GRADIENT DESCENT"}
            </div>

            {/* Mode Pill Badge */}
            <div
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                background: isComparison
                  ? "rgba(255, 200, 87, 0.18)"
                  : isStochastic
                  ? "rgba(255, 68, 0, 0.22)"
                  : isMiniBatch
                  ? "rgba(88, 214, 194, 0.22)"
                  : "rgba(0, 240, 255, 0.22)",
                border: `1.5px solid ${
                  isComparison ? "#FFC857" : isStochastic ? "#FF5500" : isMiniBatch ? "#58D6C2" : "#00F0FF"
                }`,
                color: "#FFFFFF",
                fontFamily: "monospace",
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: 1,
              }}
            >
              {isComparison ? "3-WAY RACE" : isStochastic ? "SGD NOISY" : isMiniBatch ? "GPU PARALLEL" : "EXACT GRADIENT"}
            </div>
          </div>

          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: -1,
              lineHeight: 1.15,
            }}
          >
            {scene?.title
              ? scene.title
              : isComparison
              ? "All 3 Flavors On 3D Loss Surface"
              : isStochastic
              ? "N = 1 Sample (High Variance)"
              : isMiniBatch
              ? "B = 32–128 (Modern AI Standard)"
              : "N = 100% Dataset (Deterministic)"}
          </div>
        </div>

        {/* Telemetry HUD Metrics Card from Scene Specification */}
        {scene?.metrics && Object.keys(scene.metrics).length > 0 && (
          <div
            style={{
              background: "rgba(14, 17, 26, 0.92)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: 22,
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              boxShadow: "0 16px 36px rgba(0,0,0,0.55)",
            }}
          >
            {Object.entries(scene.metrics).map(([key, val], idx) => (
              <div key={idx} style={{ textAlign: "center", padding: "0 10px", flex: 1 }}>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 28,
                    fontWeight: 700,
                    color: "#9AA3C7",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {key}
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 46,
                    fontWeight: 900,
                    color:
                      idx === 0
                        ? isComparison ? "#00F0FF" : "#FFFFFF"
                        : idx === 1
                        ? isComparison ? "#FF4400" : (isStochastic ? "#FF5500" : isMiniBatch ? "#58D6C2" : "#00F0FF")
                        : isComparison ? "#FFC857" : "#FFFFFF",
                    textShadow: "0 0 20px rgba(0,240,255,0.4)",
                  }}
                >
                  {String(val)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mathematical Formula Card */}
        <div
          style={{
            background: "rgba(14, 17, 26, 0.92)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 22,
            padding: "18px 26px",
            boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 28,
              fontWeight: 800,
              color: "#9AA3C7",
              marginBottom: 10,
              letterSpacing: 1.8,
            }}
          >
            PARAMETER UPDATE RULE
          </div>
          {isStochastic ? (
            <svg width="100%" height="64" viewBox="0 0 920 64">
              <defs>
                <filter id="glow-orange">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ff4400" floodOpacity="0.9" />
                </filter>
              </defs>
              <text x="10" y="44" fontFamily="monospace" fontSize="46" fontWeight="800" fill="#ff4400" filter="url(#glow-orange)">θ</text>
              <text x="44" y="52" fontFamily="monospace" fontSize="28" fontWeight="700" fill="#a9b4cb">t+1</text>
              <text x="110" y="44" fontFamily="monospace" fontSize="42" fill="#7c88a3">=</text>
              <text x="155" y="44" fontFamily="monospace" fontSize="46" fontWeight="800" fill="#ffffff">θ</text>
              <text x="188" y="52" fontFamily="monospace" fontSize="28" fontWeight="700" fill="#a9b4cb">t</text>
              <text x="245" y="44" fontFamily="monospace" fontSize="46" fontWeight="800" fill="#ff4400">−</text>
              <text x="290" y="44" fontFamily="monospace" fontSize="46" fontWeight="800" fill="#ffaa33">α</text>
              <text x="335" y="44" fontFamily="monospace" fontSize="46" fontWeight="800" fill="#ff4400">∇</text>
              <text x="375" y="44" fontFamily="monospace" fontSize="44" fontWeight="700" fill="#edf1f8">L</text>
              <text x="405" y="52" fontFamily="monospace" fontSize="28" fontWeight="800" fill="#ff4400">i</text>
              <text x="430" y="44" fontFamily="monospace" fontSize="44" fontWeight="700" fill="#edf1f8">(θ)</text>
              <text x="680" y="44" fontFamily="monospace" fontSize="28" fontWeight="800" fill="#ff8800">[1 Sample Only]</text>
            </svg>
          ) : isMiniBatch ? (
            <svg width="100%" height="64" viewBox="0 0 920 64">
              <defs>
                <filter id="glow-gold">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#ffc857" floodOpacity="0.9" />
                </filter>
              </defs>
              <text x="10" y="44" fontFamily="monospace" fontSize="46" fontWeight="800" fill="#ffc857" filter="url(#glow-gold)">θ</text>
              <text x="44" y="52" fontFamily="monospace" fontSize="28" fontWeight="700" fill="#a9b4cb">t+1</text>
              <text x="110" y="44" fontFamily="monospace" fontSize="42" fill="#7c88a3">=</text>
              <text x="155" y="44" fontFamily="monospace" fontSize="46" fontWeight="800" fill="#ffffff">θ</text>
              <text x="188" y="52" fontFamily="monospace" fontSize="28" fontWeight="700" fill="#a9b4cb">t</text>
              <text x="245" y="44" fontFamily="monospace" fontSize="46" fontWeight="800" fill="#ffc857">−</text>
              <text x="285" y="44" fontFamily="monospace" fontSize="44" fontWeight="800" fill="#ffffff">α·¹/B</text>
              <text x="425" y="46" fontFamily="monospace" fontSize="48" fontWeight="800" fill="#ffc857">∑</text>
              <text x="475" y="44" fontFamily="monospace" fontSize="46" fontWeight="800" fill="#58d6c2">∇L</text>
              <text x="545" y="52" fontFamily="monospace" fontSize="28" fontWeight="800" fill="#58d6c2">i</text>
              <text x="570" y="44" fontFamily="monospace" fontSize="44" fontWeight="700" fill="#edf1f8">(θ)</text>
              <text x="670" y="44" fontFamily="monospace" fontSize="28" fontWeight="800" fill="#58d6c2">[Batch B=32..128]</text>
            </svg>
          ) : isComparison ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
              <div style={{ display: "flex", gap: 20 }}>
                <span style={{ fontFamily: "monospace", fontSize: 28, color: "#00F0FF", fontWeight: 800 }}>● BATCH (N=All)</span>
                <span style={{ fontFamily: "monospace", fontSize: 28, color: "#FF4400", fontWeight: 800 }}>● SGD (N=1)</span>
                <span style={{ fontFamily: "monospace", fontSize: 28, color: "#FFC857", fontWeight: 800 }}>● MINI-BATCH (B=64)</span>
              </div>
              <span style={{ fontFamily: "monospace", fontSize: 28, color: "#A9B4CB", fontWeight: 700 }}>min L(θ) Search</span>
            </div>
          ) : (
            <svg width="100%" height="64" viewBox="0 0 920 64">
              <defs>
                <filter id="glow-cyan">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00f0ff" floodOpacity="0.9" />
                </filter>
              </defs>
              <text x="10" y="44" fontFamily="monospace" fontSize="46" fontWeight="800" fill="#00f0ff" filter="url(#glow-cyan)">θ</text>
              <text x="44" y="52" fontFamily="monospace" fontSize="28" fontWeight="700" fill="#a9b4cb">t+1</text>
              <text x="110" y="44" fontFamily="monospace" fontSize="42" fill="#7c88a3">=</text>
              <text x="155" y="44" fontFamily="monospace" fontSize="46" fontWeight="800" fill="#ffffff">θ</text>
              <text x="188" y="52" fontFamily="monospace" fontSize="28" fontWeight="700" fill="#a9b4cb">t</text>
              <text x="245" y="44" fontFamily="monospace" fontSize="46" fontWeight="800" fill="#00f0ff">−</text>
              <text x="285" y="44" fontFamily="monospace" fontSize="44" fontWeight="800" fill="#ffffff">α·¹/N</text>
              <text x="425" y="46" fontFamily="monospace" fontSize="48" fontWeight="800" fill="#00f0ff">∑</text>
              <text x="475" y="44" fontFamily="monospace" fontSize="46" fontWeight="800" fill="#00f0ff">∇L</text>
              <text x="545" y="52" fontFamily="monospace" fontSize="28" fontWeight="800" fill="#00f0ff">i</text>
              <text x="570" y="44" fontFamily="monospace" fontSize="44" fontWeight="700" fill="#edf1f8">(θ)</text>
              <text x="680" y="44" fontFamily="monospace" fontSize="28" fontWeight="800" fill="#00f0ff">[All N Samples]</text>
            </svg>
          )}
        </div>

        {/* Live Synchronized Telemetry & Mini-Radar */}
        <div
          style={{
            background: "rgba(14, 17, 26, 0.92)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: 22,
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
          }}
        >
          {/* Live SVG Contour Mini-Radar */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <svg width="100" height="100" viewBox="0 0 110 110">
              <rect width="110" height="110" rx="16" fill="#090b10" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <ellipse cx="55" cy="55" rx="46" ry="46" fill="none" stroke="#ff5500" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.6" />
              <ellipse cx="55" cy="55" rx="32" ry="32" fill="none" stroke="#ff8800" strokeWidth="1.2" opacity="0.6" />
              <ellipse cx="55" cy="55" rx="18" ry="18" fill="none" stroke="#00f0ff" strokeWidth="1.5" opacity="0.8" />
              <circle cx="55" cy="55" r="4.5" fill="#00f0ff" />
              {isComparison ? (
                <>
                  <circle cx={toSvg(batchPt.x)} cy={toSvg(batchPt.y)} r="5" fill="#00f0ff" stroke="#fff" strokeWidth="1.5" />
                  <circle cx={toSvg(sgdPt.x)} cy={toSvg(sgdPt.y)} r="5" fill="#ff4400" stroke="#fff" strokeWidth="1.5" />
                  <circle cx={toSvg(mbPt.x)} cy={toSvg(mbPt.y)} r="5.5" fill="#ffc857" stroke="#fff" strokeWidth="1.5" />
                </>
              ) : (
                <circle
                  cx={toSvg(primaryPt.x)}
                  cy={toSvg(primaryPt.y)}
                  r="6"
                  fill={isStochastic ? "#ff4400" : isMiniBatch ? "#ffc857" : "#00f0ff"}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              )}
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: "#9AA3C7", letterSpacing: 1.5 }}>
                TOPOLOGY RADAR
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 34, fontWeight: 800, color: "#FFFFFF" }}>
                {isComparison ? "3 Active Paths" : `(${primaryPt.x.toFixed(2)}, ${primaryPt.y.toFixed(2)})`}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: "#58D6C2" }}>
                Target Min: (0.00, 0.00)
              </div>
            </div>
          </div>

          {/* Telemetry Metrics */}
          {isComparison ? (
            <div style={{ display: "flex", gap: 24 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: "#00F0FF" }}>BATCH L(θ)</div>
                <div style={{ fontFamily: "monospace", fontSize: 38, fontWeight: 900, color: "#FFFFFF" }}>
                  {batchPt.z.toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: "#FF5500" }}>SGD L(θ)</div>
                <div style={{ fontFamily: "monospace", fontSize: 38, fontWeight: 900, color: "#FFFFFF" }}>
                  {sgdPt.z.toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: "#FFC857" }}>MINI-BATCH</div>
                <div style={{ fontFamily: "monospace", fontSize: 38, fontWeight: 900, color: "#FFC857" }}>
                  {mbPt.z.toFixed(2)}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 32 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: "#9AA3C7" }}>CURRENT LOSS</div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 46,
                    fontWeight: 900,
                    color: isStochastic ? "#FF5500" : isMiniBatch ? "#FFC857" : "#00F0FF",
                    textShadow: "0 0 20px rgba(0,240,255,0.4)",
                  }}
                >
                  {primaryPt.z.toFixed(3)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: "#9AA3C7" }}>GRADIENT NORM</div>
                <div style={{ fontFamily: "monospace", fontSize: 44, fontWeight: 900, color: "#FFFFFF" }}>
                  {primaryGradNorm.toFixed(3)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
