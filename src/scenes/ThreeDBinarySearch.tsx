import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { FONT, MONO } from "../theme";

interface BlockData {
  index: number;
  value: number;
  isTarget?: boolean;
}

export const ThreeDBinarySearch: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  const isLandscape = width > height;
  const tag = scene.tag || "03 / HALVING THE UNIVERSE";
  const title = scene.title || "DIVIDE & CONQUER IN 3D SPACE";

  // Data blocks: [12, 25, 34, 48, 56, 67, 79, 88, 95]
  const blocksData: BlockData[] = [
    { index: 0, value: 12 },
    { index: 1, value: 25 },
    { index: 2, value: 34, isTarget: true },
    { index: 3, value: 48 },
    { index: 4, value: 56 },
    { index: 5, value: 67 },
    { index: 6, value: 79 },
    { index: 7, value: 88 },
    { index: 8, value: 95 },
  ];

  // Ref to hold WebGL objects
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    blockMeshes: THREE.Mesh[];
    wireMeshes: THREE.LineSegments[];
    lowPillar: THREE.Group;
    highPillar: THREE.Group;
    midPillar: THREE.Group;
    laserPlane: THREE.Mesh;
    particles: THREE.Points;
  } | null>(null);

  // Helper to create texture with index and number
  const createBlockTexture = (index: number, val: number, isTarget: boolean) => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Dark sleek gradient background
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, "#0F1A2E");
    grad.addColorStop(1, "#070D18");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Outer border
    ctx.strokeStyle = isTarget ? "#10B981" : "#00F0FF";
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 240, 240);

    // Index at top
    ctx.fillStyle = "#94A3B8";
    ctx.font = "bold 32px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`[${index}]`, 128, 56);

    // Value in center
    ctx.fillStyle = isTarget ? "#10B981" : "#FFFFFF";
    ctx.font = "bold 88px sans-serif";
    ctx.fillText(String(val), 128, 160);

    // Tag at bottom
    ctx.fillStyle = isTarget ? "#10B981" : "#00F0FF";
    ctx.font = "bold 24px monospace";
    ctx.fillText(isTarget ? "TARGET" : "SORTED", 128, 218);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const threeScene = new THREE.Scene();
    threeScene.fog = new THREE.FogExp2(0x0b1020, 0.04);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 3.8, 8.5);
    camera.lookAt(0, 0.4, 0);

    // 1. Grid & Floor
    const grid = new THREE.GridHelper(26, 32, new THREE.Color(accent), 0x132238);
    grid.position.set(0, -1.2, 0);
    threeScene.add(grid);

    // 2. Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.9);
    threeScene.add(amb);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 10, 7);
    threeScene.add(dirLight);

    const pointCyan = new THREE.PointLight(0x00f0ff, 4.0, 14);
    pointCyan.position.set(-4, 3, 2);
    threeScene.add(pointCyan);

    const pointGold = new THREE.PointLight(0xffc857, 4.5, 14);
    pointGold.position.set(0, 4, 3);
    threeScene.add(pointGold);

    // 3. 3D Blocks Array
    const blockMeshes: THREE.Mesh[] = [];
    const wireMeshes: THREE.LineSegments[] = [];
    const blockSpacing = 0.88;
    const totalWidth = (blocksData.length - 1) * blockSpacing;
    const startX = -totalWidth / 2;

    const boxGeo = new THREE.BoxGeometry(0.72, 0.95, 0.72);

    blocksData.forEach((b, idx) => {
      const tex = createBlockTexture(b.index, b.value, !!b.isTarget);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        color: 0xffffff,
        metalness: 0.65,
        roughness: 0.2,
      });

      const mesh = new THREE.Mesh(boxGeo, mat);
      mesh.position.set(startX + idx * blockSpacing, -0.6, 0);
      threeScene.add(mesh);
      blockMeshes.push(mesh);

      // Neon Wireframe edge
      const edgeGeo = new THREE.EdgesGeometry(boxGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: b.isTarget ? 0x10b981 : 0x00f0ff,
        transparent: true,
        opacity: 0.6,
      });
      const wire = new THREE.LineSegments(edgeGeo, edgeMat);
      wire.position.copy(mesh.position);
      threeScene.add(wire);
      wireMeshes.push(wire);
    });

    // 4. Scanning Laser Beam Helpers (Cylinders)
    const createLaserPillar = (colorHex: number) => {
      const group = new THREE.Group();
      // Core beam
      const beamGeo = new THREE.CylinderGeometry(0.04, 0.12, 3.5, 16);
      const beamMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.8,
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.y = 1.75;
      group.add(beamMesh);

      // Glow halo ring at base
      const ringGeo = new THREE.RingGeometry(0.15, 0.45, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.02;
      group.add(ringMesh);

      threeScene.add(group);
      return group;
    };

    const lowPillar = createLaserPillar(0x00f0ff);   // Cyan
    const highPillar = createLaserPillar(0xc084fc);  // Purple
    const midPillar = createLaserPillar(0xffc857);   // Gold

    // 5. 3D Laser Cutting Wall
    const planeGeo = new THREE.PlaneGeometry(0.05, 3.8);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0xff3355,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const laserPlane = new THREE.Mesh(planeGeo, planeMat);
    laserPlane.position.set(0, 0.7, 0);
    laserPlane.visible = false;
    threeScene.add(laserPlane);

    // 6. Ambient 3D Particle Cloud
    const partGeo = new THREE.BufferGeometry();
    const partCount = 450;
    const pos = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 16;
      pos[i + 1] = Math.random() * 8 - 1;
      pos[i + 2] = (Math.random() - 0.5) * 12;
    }
    partGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const partMat = new THREE.PointsMaterial({
      size: 0.05,
      color: new THREE.Color(accent),
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(partGeo, partMat);
    threeScene.add(particles);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      blockMeshes,
      wireMeshes,
      lowPillar,
      highPillar,
      midPillar,
      laserPlane,
      particles,
    };

    return () => {
      renderer.dispose();
    };
  }, [width, height, accent]);

  // Dynamic animation updates driven by frame / progress
  const progress = Math.min(Math.max(frame / Math.max(durationInFrames, 1), 0), 1);
  const blockSpacing = 0.88;
  const totalWidth = (blocksData.length - 1) * blockSpacing;
  const startX = -totalWidth / 2;

  let currentLow = 0;
  let currentHigh = 8;
  let currentMid = 4;
  let discardedIndices: number[] = [];
  let found = false;
  let hudStep = "STEP 1: INSPECT MIDPOINT";
  let hudDetail = "MID = 56 · TARGET: 34 · 34 < 56 ➔ 3D LASER CUTS RIGHT HALF";
  let hudColor = accent;

  if (progress < 0.33) {
    currentLow = 0;
    currentHigh = 8;
    currentMid = 4;
    discardedIndices = [];
    hudStep = "STEP 1: MIDPOINT LASER LOCK";
    hudDetail = "MID = [4] VAL: 56 · 34 < 56 ➔ 3D LASER CUTS RIGHT HALF (50% GONE!)";
    hudColor = accent;
  } else if (progress < 0.66) {
    currentLow = 0;
    currentHigh = 3;
    currentMid = 1;
    discardedIndices = [4, 5, 6, 7, 8];
    hudStep = "STEP 2: HALVE REMAINING 4 BLOCKS";
    hudDetail = "NEW MID = [1] VAL: 25 · 34 > 25 ➔ 3D LASER CUTS LEFT HALF";
    hudColor = "#FFC857";
  } else {
    currentLow = 2;
    currentHigh = 3;
    currentMid = 2;
    discardedIndices = [0, 1, 4, 5, 6, 7, 8];
    found = true;
    hudStep = "STEP 3: 3D TARGET ACQUIRED! 🎯";
    hudDetail = "MID = [2] VAL: 34 · MATCH FOUND IN ONLY 3 CHECKS! (O(log N))";
    hudColor = "#10B981";
  }

  // Update Three.js frame render
  if (stateRef.current) {
    const { camera, blockMeshes, wireMeshes, lowPillar, highPillar, midPillar, laserPlane, renderer, scene: threeScene, particles } = stateRef.current;

    // Laser Pillars positions
    lowPillar.position.x = startX + currentLow * blockSpacing;
    lowPillar.position.y = -0.1;

    highPillar.position.x = startX + currentHigh * blockSpacing;
    highPillar.position.y = -0.1;

    midPillar.position.x = startX + currentMid * blockSpacing;
    midPillar.position.y = -0.1 + Math.sin(frame * 0.2) * 0.05;

    // Laser Plane between split
    if (progress >= 0.15 && progress < 0.35) {
      laserPlane.visible = true;
      laserPlane.position.x = startX + 3.5 * blockSpacing;
      laserPlane.position.y = 0.5 + Math.sin(frame * 0.3) * 0.1;
      laserPlane.scale.x = 1.0 + Math.sin(frame * 0.4) * 0.3;
    } else if (progress >= 0.48 && progress < 0.68) {
      laserPlane.visible = true;
      laserPlane.position.x = startX + 1.5 * blockSpacing;
      laserPlane.position.y = 0.5 + Math.sin(frame * 0.3) * 0.1;
    } else {
      laserPlane.visible = false;
    }

    // Update individual block meshes
    blockMeshes.forEach((mesh, idx) => {
      const wire = wireMeshes[idx];
      const isDiscarded = discardedIndices.includes(idx);
      const isTargetFound = found && idx === 2;
      const isMid = idx === currentMid;

      if (isTargetFound) {
        // Floating celebration elevation
        mesh.position.y = -0.6 + 0.9 + Math.sin(frame * 0.18) * 0.15;
        mesh.rotation.y = frame * 0.05;
        mesh.scale.set(1.15, 1.15, 1.15);
      } else if (isDiscarded) {
        // Sunk and dimmed
        mesh.position.y = -1.1;
        mesh.rotation.y = 0;
        mesh.scale.set(0.85, 0.85, 0.85);
        (mesh.material as THREE.MeshStandardMaterial).opacity = 0.25;
        (mesh.material as THREE.MeshStandardMaterial).transparent = true;
      } else if (isMid) {
        mesh.position.y = -0.6 + 0.25;
        mesh.rotation.y = Math.sin(frame * 0.1) * 0.1;
        mesh.scale.set(1.05, 1.05, 1.05);
      } else {
        mesh.position.y = -0.6;
        mesh.rotation.y = 0;
        mesh.scale.set(1, 1, 1);
        (mesh.material as THREE.MeshStandardMaterial).opacity = 1.0;
        (mesh.material as THREE.MeshStandardMaterial).transparent = false;
      }
      wire.position.copy(mesh.position);
      wire.rotation.copy(mesh.rotation);
      wire.scale.copy(mesh.scale);
    });

    // Camera dynamic orbital glide
    if (found) {
      // Zoom into target block 2
      const targetX = startX + 2 * blockSpacing;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.06);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 2.2, 0.06);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 5.2, 0.06);
      camera.lookAt(targetX, 0.3, 0);
    } else if (progress > 0.33) {
      // Pan left to focus on remaining search space
      const focusX = startX + 1.5 * blockSpacing;
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, focusX, 0.04);
      camera.position.y = 3.6;
      camera.position.z = 7.6;
      camera.lookAt(focusX, 0.2, 0);
    } else {
      camera.position.x = Math.sin(frame * 0.015) * 0.6;
      camera.position.y = 3.8;
      camera.position.z = 8.5;
      camera.lookAt(0, 0.3, 0);
    }

    // Particle drift
    particles.rotation.y = frame * 0.001;

    renderer.render(threeScene, camera);
  }

  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0B1020",
        fontFamily: FONT,
        color: "#F5F7FF",
        overflow: "hidden",
      }}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      {/* Screen-Space Futuristic HUD Layout */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: isLandscape ? 36 : 110,
          paddingBottom: isLandscape ? 36 : 140,
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      >
        {/* Header Tag & Title */}
        <div
          style={{
            zIndex: 10,
            textAlign: "center",
            marginBottom: isLandscape ? 12 : 18,
            opacity: enterSpring,
            transform: `translateY(${(1 - enterSpring) * -20}px)`,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: isLandscape ? 14 : 18,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: accent,
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: accent,
                boxShadow: `0 0 10px ${accent}`,
              }}
            />
            {tag}
          </div>
          <h1
            style={{
              fontSize: isLandscape ? 28 : 42,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: 0,
              textTransform: "uppercase",
              color: "#FFFFFF",
              textShadow: "0 2px 20px rgba(0,0,0,0.8)",
            }}
          >
            {title}
          </h1>
        </div>

        {/* 3D Scanning Pointers Key */}
        <div
          style={{
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: isLandscape ? 12 : 16,
            marginBottom: isLandscape ? 14 : 20,
            backgroundColor: "rgba(11, 16, 32, 0.75)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 20,
            padding: isLandscape ? "6px 14px" : "8px 20px",
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#00F0FF", display: "inline-block" }} />
            <span style={{ fontFamily: MONO, fontSize: 12, color: "#00F0FF", fontWeight: 700 }}>LOW BEAM</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#FFC857", display: "inline-block" }} />
            <span style={{ fontFamily: MONO, fontSize: 12, color: "#FFC857", fontWeight: 800 }}>MID TARGET BEAM</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#C084FC", display: "inline-block" }} />
            <span style={{ fontFamily: MONO, fontSize: 12, color: "#C084FC", fontWeight: 700 }}>HIGH BEAM</span>
          </div>
        </div>

        {/* Dynamic Live Step Telemetry Card */}
        <div
          style={{
            marginTop: "auto",
            marginBottom: isLandscape ? 12 : 28,
            zIndex: 10,
            width: isLandscape ? 720 : 920,
            backgroundColor: "rgba(11, 16, 32, 0.85)",
            border: `1px solid ${hudColor}66`,
            borderRadius: 16,
            padding: isLandscape ? "14px 22px" : "18px 26px",
            boxShadow: "0 12px 35px rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontFamily: MONO, fontSize: isLandscape ? 13 : 15, fontWeight: 800, color: hudColor, letterSpacing: "0.08em" }}>
              {hudStep}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 12, color: "#94A3B8" }}>
              TARGET: 34
            </span>
          </div>
          <div style={{ fontSize: isLandscape ? 13 : 16, fontWeight: 600, color: "#FFFFFF" }}>
            {hudDetail}
          </div>
        </div>

        {/* Real-Time Metrics Strip */}
        <div
          style={{
            zIndex: 10,
            width: isLandscape ? 720 : 920,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 12,
              padding: isLandscape ? "8px 12px" : "12px 16px",
              textAlign: "center",
              backdropFilter: "blur(6px)",
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 10, color: "#94A3B8" }}>CHECKS</div>
            <div style={{ fontFamily: MONO, fontSize: isLandscape ? 18 : 24, fontWeight: 800, color: hudColor }}>
              {progress < 0.33 ? "1 / 9" : progress < 0.66 ? "2 / 9" : "3 / 9"}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 12,
              padding: isLandscape ? "8px 12px" : "12px 16px",
              textAlign: "center",
              backdropFilter: "blur(6px)",
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 10, color: "#94A3B8" }}>SPACE ELIMINATED</div>
            <div style={{ fontFamily: MONO, fontSize: isLandscape ? 18 : 24, fontWeight: 800, color: "#10B981" }}>
              {progress < 0.33 ? "50%" : progress < 0.66 ? "75%" : "89%"}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 12,
              padding: isLandscape ? "8px 12px" : "12px 16px",
              textAlign: "center",
              backdropFilter: "blur(6px)",
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 10, color: "#94A3B8" }}>COMPLEXITY</div>
            <div style={{ fontFamily: MONO, fontSize: isLandscape ? 18 : 24, fontWeight: 800, color: accent }}>
              O(log₂ N)
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
