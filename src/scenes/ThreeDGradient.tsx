import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";

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

// Pre-computed Gradient Descent Trajectory Path Points (Crest to Trough)
const PATH_STEPS: Array<{ x: number; y: number; z: number }> = [];
(function generateTrajectory() {
  let cx = 2.2, cy = 2.2;
  let vx = 0, vy = 0;
  const lr = 0.080, momentum = 0.30;
  for (let s = 0; s < 45; s++) {
    const cz = evaluateElevation(cx, cy);
    PATH_STEPS.push({ x: cx, y: cy, z: cz });
    const g = computeGradient(cx, cy);
    vx = momentum * vx + lr * g.dx;
    vy = momentum * vy + lr * g.dy;
    cx -= vx;
    cy -= vy;
  }
})();

// -----------------------------------------------------------------------------
// GLSL Shaders (Volcanic Orange, Slate Grey, Electric Cyan)
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

    // Simple Directional Lighting
    vec3 lightDir = normalize(vec3(0.5, 0.9, 0.6));
    vec3 norm = normalize(vNormal);
    float diff = max(dot(norm, lightDir), 0.18);
    color *= (0.7 + 0.35 * diff);

    gl_FragColor = vec4(color, 1.0);
  }
`;

interface ThreeDGradientProps {
  scene?: import("../types").SceneSpec;
  accent?: string;
}

export const ThreeDGradient: React.FC<ThreeDGradientProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Progress along the path points (0.0 at Crest to 1.0 at Trough)
  const normTime = Math.min(Math.max((frame - 15) / (durationInFrames - 45), 0), 1);
  const pathIndexFloat = normTime * (PATH_STEPS.length - 1);
  const idxLow = Math.floor(pathIndexFloat);
  const idxHigh = Math.min(idxLow + 1, PATH_STEPS.length - 1);
  const frac = pathIndexFloat - idxLow;

  const currentX = PATH_STEPS[idxLow].x + frac * (PATH_STEPS[idxHigh].x - PATH_STEPS[idxLow].x);
  const currentY = PATH_STEPS[idxLow].y + frac * (PATH_STEPS[idxHigh].y - PATH_STEPS[idxLow].y);
  const currentZ = evaluateElevation(currentX, currentY);

  const grad = computeGradient(currentX, currentY);
  const gradNorm = Math.hypot(grad.dx, grad.dy);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08090c);
    scene.fog = new THREE.FogExp2(0x08090c, 0.035);

    // Camera setup with subtle drift
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    const camAngle = 0.85 + (frame / durationInFrames) * 0.45;
    const camRadius = 11.2;
    camera.position.set(
      Math.sin(camAngle) * camRadius,
      7.8 - (frame / durationInFrames) * 1.2,
      Math.cos(camAngle) * camRadius
    );
    camera.lookAt(0, -0.6, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x2a3042, 1.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(6, 12, 8);
    scene.add(directionalLight);

    // 3D Terrain Geometry & GLSL Shader
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
        uBallCoords: { value: new THREE.Vector2(currentX, currentY) },
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
    scene.add(terrainMesh);

    // Trough target ring
    const ringGeo = new THREE.RingGeometry(0.22, 0.42, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(0, evaluateElevation(0, 0) + 0.03, 0);
    scene.add(ringMesh);

    // Path points up to current progress
    const activePointCount = Math.min(idxHigh + 1, PATH_STEPS.length);
    const lineGeo = new THREE.BufferGeometry();
    const linePositions: number[] = [];
    const lineColors: number[] = [];

    for (let i = 0; i < activePointCount; i++) {
      const pt = PATH_STEPS[i];
      linePositions.push(pt.x, pt.z + 0.04, pt.y);
      const t = i / (PATH_STEPS.length - 1);
      const c = new THREE.Color().lerpColors(new THREE.Color(0xff5500), new THREE.Color(0x00f0ff), t);
      lineColors.push(c.r, c.g, c.b);

      // Sphere marker
      const dotGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: c });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.set(pt.x, pt.z + 0.05, pt.y);
      scene.add(dotMesh);
    }

    if (linePositions.length >= 6) {
      lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
      lineGeo.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));
      const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 4 });
      const pathLine = new THREE.Line(lineGeo, lineMat);
      scene.add(pathLine);
    }

    // Glowing Descent Ball
    const ballGeo = new THREE.SphereGeometry(0.24, 32, 32);
    const ballCol = new THREE.Color().lerpColors(new THREE.Color(0xff4400), new THREE.Color(0x00f0ff), normTime);
    const ballMat = new THREE.MeshStandardMaterial({
      color: ballCol,
      emissive: ballCol,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.set(currentX, currentZ + 0.24, currentY);
    scene.add(ballMesh);

    // Ball Wireframe Aura
    const auraGeo = new THREE.SphereGeometry(0.34, 20, 20);
    const auraMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.4, wireframe: true });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.rotation.y = (frame / 30) * 2.0;
    ballMesh.add(auraMesh);

    // Negative Gradient Arrow Vector
    if (gradNorm > 0.01) {
      const downhill = new THREE.Vector3(-grad.dx, -gradNorm * 0.5, -grad.dy).normalize();
      const arrow = new THREE.ArrowHelper(downhill, new THREE.Vector3(currentX, currentZ + 0.26, currentY), Math.min(0.4 + gradNorm * 0.4, 1.4), 0x00f0ff, 0.3, 0.16);
      scene.add(arrow);
    }

    renderer.render(scene, camera);

    return () => {
      renderer.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      ballGeo.dispose();
      ballMat.dispose();
    };
  }, [frame, width, height, currentX, currentY, currentZ, normTime, durationInFrames, idxHigh, gradNorm, grad.dx, grad.dy]);

  // SVG HUD mapping for mini contour
  const toSvg = (v: number) => 55 + (v / 4.5) * 48;

  return (
    <AbsoluteFill style={{ background: "#08090c" }}>
      {/* Real 3D WebGL Canvas */}
      <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%", height: "100%" }} />

      {/* Cinematic HUD Overlay */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 50,
          right: 50,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          pointerEvents: "none"
        }}
      >
        {/* Mathematical Formula Card */}
        <div
          style={{
            background: "rgba(20, 23, 32, 0.88)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 16,
            padding: "16px 22px",
            boxShadow: "0 16px 36px rgba(0,0,0,0.5)",
            maxWidth: 520
          }}
        >
          <div style={{ fontFamily: "monospace", fontSize: 18, color: "#FFAA33", marginBottom: 6, fontWeight: 700 }}>
            FIRST-ORDER UPDATE RULE
          </div>
          <svg width="420" height="42" viewBox="0 0 280 40">
            <defs>
              <filter id="glow-cyan-hud">
                <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#00f0ff" floodOpacity="0.9" />
              </filter>
            </defs>
            <text x="5" y="26" fontFamily="monospace" fontSize="18" fontWeight="700" fill="#00f0ff" filter="url(#glow-cyan-hud)">θ</text>
            <text x="18" y="31" fontFamily="monospace" fontSize="11" fill="#a9b4cb">t+1</text>
            <text x="48" y="25" fontFamily="monospace" fontSize="17" fill="#7c88a3">=</text>
            <text x="70" y="26" fontFamily="monospace" fontSize="18" fontWeight="700" fill="#ffaa33">θ</text>
            <text x="83" y="31" fontFamily="monospace" fontSize="11" fill="#a9b4cb">t</text>
            <text x="108" y="25" fontFamily="monospace" fontSize="19" fontWeight="700" fill="#ff5500">−</text>
            <text x="130" y="26" fontFamily="monospace" fontSize="18" fontWeight="700" fill="#ff8800">α</text>
            <text x="152" y="26" fontFamily="monospace" fontSize="19" fontWeight="700" fill="#ff5500">∇</text>
            <text x="172" y="26" fontFamily="monospace" fontSize="17" fontWeight="600" fill="#edf1f8">L(θ)</text>
          </svg>
        </div>

        {/* Live Synchronized SVG Contour Mini-Radar */}
        <div
          style={{
            background: "rgba(20, 23, 32, 0.88)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 16,
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 16px 36px rgba(0,0,0,0.5)"
          }}
        >
          <svg width="110" height="110" viewBox="0 0 110 110">
            <rect width="110" height="110" rx="12" fill="#0d0f14" />
            <ellipse cx="55" cy="55" rx="46" ry="46" fill="none" stroke="#ff5500" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
            <ellipse cx="55" cy="55" rx="32" ry="32" fill="none" stroke="#ff8800" strokeWidth="1" opacity="0.5" />
            <ellipse cx="55" cy="55" rx="18" ry="18" fill="none" stroke="#00f0ff" strokeWidth="1.2" opacity="0.7" />
            <circle cx="55" cy="55" r="4" fill="#00f0ff" />
            <circle cx={toSvg(currentX)} cy={toSvg(currentY)} r="5" fill="#ff5500" stroke="#fff" strokeWidth="1.5" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 120 }}>
            <div style={{ fontFamily: "monospace", fontSize: 13, color: "#7c88a3" }}>LOSS L(θ)</div>
            <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "#ffaa33" }}>{currentZ.toFixed(3)}</div>
            <div style={{ fontFamily: "monospace", fontSize: 13, color: "#7c88a3" }}>||∇L||</div>
            <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#00f0ff" }}>{gradNorm.toFixed(3)}</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
