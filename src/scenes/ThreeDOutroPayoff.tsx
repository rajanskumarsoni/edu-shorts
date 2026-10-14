import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDOutroPayoff: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    phoneGroup: THREE.Group;
    cityGroup: THREE.Group;
    subscribeGroup: THREE.Group;
    bellMesh: THREE.Group;
    particles: THREE.Points;
  } | null>(null);

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

    const threeScene = new THREE.Scene();
    threeScene.fog = new THREE.FogExp2(0x0b1020, 0.035);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 2.0, 6.0);
    camera.lookAt(0, 0, 0);

    // Floor Coordinate Grid
    const grid = new THREE.GridHelper(24, 30, new THREE.Color(accent), 0x16233b);
    grid.position.y = -2.8;
    threeScene.add(grid);

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.85);
    threeScene.add(amb);

    const sun = new THREE.DirectionalLight(0xffffff, 2.8);
    sun.position.set(6, 12, 8);
    threeScene.add(sun);

    const glowLight = new THREE.PointLight(new THREE.Color(accent), 4.5, 18);
    glowLight.position.set(0, 2, 4);
    threeScene.add(glowLight);

    // --- 1. 3D Smartphone on Counter ---
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(0, -0.6, 0.8);

    // Chassis
    const phoneBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 2.2, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.15 })
    );
    phoneGroup.add(phoneBody);

    // Screen
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.18, 2.05),
      new THREE.MeshBasicMaterial({ color: 0x052e16 })
    );
    screen.position.z = 0.065;
    phoneGroup.add(screen);

    // 3D Checkmark on Screen
    const checkGroup = new THREE.Group();
    checkGroup.position.set(0, 0.15, 0.08);

    const checkCrest = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.42, 32),
      new THREE.MeshBasicMaterial({ color: 0x27c93f, side: THREE.DoubleSide })
    );
    checkGroup.add(checkCrest);

    const stem1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.28, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    stem1.rotation.z = -Math.PI / 4;
    stem1.position.set(-0.1, -0.06, 0.01);
    checkGroup.add(stem1);

    const stem2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.48, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    stem2.rotation.z = Math.PI / 4;
    stem2.position.set(0.12, 0.04, 0.01);
    checkGroup.add(stem2);

    phoneGroup.add(checkGroup);
    threeScene.add(phoneGroup);

    // --- 2. Underground Digital India Infrastructure City Grid ---
    const cityGroup = new THREE.Group();
    cityGroup.position.y = -2.8;

    const bldgMat = new THREE.MeshStandardMaterial({
      color: 0x111c33,
      metalness: 0.85,
      roughness: 0.3,
      wireframe: false,
    });
    const neonEdgeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Grid of mini towers across landscape
    const towerCoords = [
      [-3.5, -2], [-2, -3.5], [2, -3], [3.5, -2],
      [-4, 2], [-2.5, 3], [2.5, 3.5], [4, 1.5],
      [-1.8, 1.2], [1.8, 1.0], [0, -4], [0, 4]
    ];

    towerCoords.forEach(([bx, bz], idx) => {
      const bh = 1.0 + (idx % 4) * 0.7;
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, bh, 0.65), bldgMat);
      bMesh.position.set(bx, bh / 2, bz);
      cityGroup.add(bMesh);

      // Neon roof beacon
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 12, 12),
        idx % 2 === 0 ? neonEdgeMat : new THREE.MeshBasicMaterial({ color: 0xffc857 })
      );
      beacon.position.set(bx, bh + 0.1, bz);
      cityGroup.add(beacon);
    });

    threeScene.add(cityGroup);

    // --- 3. Sculpted 3D Subscribe CTA Plaque ---
    const subscribeGroup = new THREE.Group();
    subscribeGroup.position.set(0, 0.75, 0.2);

    // High-res Canvas Texture for 3D YouTube Subscribe Pill Badge
    const subCanvas = document.createElement("canvas");
    subCanvas.width = 512;
    subCanvas.height = 160;
    const sCtx = subCanvas.getContext("2d")!;

    // Rounded Red Pill Background
    sCtx.fillStyle = "#FF0033";
    sCtx.roundRect(10, 10, 492, 140, 70);
    sCtx.fill();

    // White Play Triangle
    sCtx.fillStyle = "#FFFFFF";
    sCtx.beginPath();
    sCtx.moveTo(80, 50);
    sCtx.lineTo(130, 80);
    sCtx.lineTo(80, 110);
    sCtx.closePath();
    sCtx.fill();

    // Bold SUBSCRIBE text
    sCtx.font = "900 48px sans-serif";
    sCtx.textAlign = "left";
    sCtx.fillText("SUBSCRIBE", 155, 96);

    // Golden Bell icon
    sCtx.font = "44px sans-serif";
    sCtx.fillText("🔔", 420, 96);

    const subTex = new THREE.CanvasTexture(subCanvas);
    const subPlaqueMat = new THREE.MeshBasicMaterial({
      map: subTex,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const subPlaque = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.82), subPlaqueMat);
    subscribeGroup.add(subPlaque);

    // Glowing Red Backing Slab
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xcc0022,
      emissiveIntensity: 0.4,
    });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.86, 0.1), slabMat);
    slab.position.z = -0.06;
    subscribeGroup.add(slab);

    threeScene.add(subscribeGroup);

    // --- 4. Sparkling Particle Field ---
    const partCount = 120;
    const partGeo = new THREE.BufferGeometry();
    const posArr = new Float32Array(partCount * 3);
    for (let p = 0; p < partCount * 3; p += 3) {
      posArr[p] = (Math.random() - 0.5) * 8;
      posArr[p + 1] = (Math.random() - 0.5) * 8;
      posArr[p + 2] = (Math.random() - 0.5) * 6;
    }
    partGeo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0x58d6c2,
      size: 0.09,
      transparent: true,
      opacity: 0.85,
    });
    const particles = new THREE.Points(partGeo, partMat);
    threeScene.add(particles);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      phoneGroup,
      cityGroup,
      subscribeGroup,
      bellMesh: null as any,
      particles,
    };

    return () => {
      renderer.dispose();
    };
  }, [width, height, accent]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    const progress = Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames)));

    // Dramatic Upward Crane Shot:
    // Starts tight and low on the phone screen, ascends upward, tilting down to reveal wide cyber grid and subscribe plaque
    const camY = interpolate(progress, [0, 1], [0.2, 2.6]);
    const camZ = interpolate(progress, [0, 1], [4.5, 7.8]);
    const camX = Math.sin(frame * 0.02) * 0.3;
    s.camera.position.set(camX, camY, camZ);
    s.camera.lookAt(0, 0.4, 0);

    // Gentle floating tilt of phone
    s.phoneGroup.rotation.y = Math.sin(frame * 0.03) * 0.2;
    s.phoneGroup.rotation.x = -0.15 + Math.cos(frame * 0.02) * 0.08;

    // Bell chime ring animation on the beat
    if (s.bellMesh) {
      s.bellMesh.rotation.z = Math.sin(frame * 0.35) * 0.3;
    }

    // Subscribe badge breathing
    const pulse = (Math.sin(frame * 0.08) + 1) / 2;
    const sScale = 1.0 + pulse * 0.06;
    s.subscribeGroup.scale.set(sScale, sScale, sScale);

    // Swirling sparkling particles
    s.particles.rotation.y = frame * 0.008;
    s.particles.rotation.x = frame * 0.004;

    s.renderer.render(s.scene, s.camera);
  }, [frame, durationInFrames]);

  const tagText = resolveSceneTag(scene, "13 / MISSION ACCOMPLISHED");

  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />

      {/* Top Tracked Uppercase Header & Title */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "50px 48px 0 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 20px",
            borderRadius: 999,
            background: "rgba(11, 16, 32, 0.88)",
            border: `1.5px solid ${accent}88`,
            backdropFilter: "blur(12px)",
            boxShadow: `0 0 25px ${accent}33`,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: accent,
              boxShadow: `0 0 14px ${accent}`,
            }}
          />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "0.22em",
              color: accent,
              textTransform: "uppercase",
            }}
          >
            {tagText}
          </span>
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.05,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
            textShadow: "0 8px 32px rgba(0,0,0,0.85)",
          }}
        >
          {scene.text ?? "Seconds On Screen, Systems Behind"}
        </h1>
      </div>

      {/* Bottom Subscribe CTA Card */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 48,
          right: 48,
          background: "rgba(11, 16, 32, 0.92)",
          backdropFilter: "blur(20px)",
          border: `1.5px solid rgba(255, 0, 51, 0.5)`,
          borderLeft: `6px solid #FF0033`,
          borderRadius: 24,
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 25px 70px rgba(0,0,0,0.8), 0 0 40px rgba(255,0,51,0.2)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 22,
              fontWeight: 800,
              color: "#58D6C2",
              letterSpacing: "0.15em",
            }}
          >
            DIGITAL INDIA ARCHITECTURE
          </span>
          <span style={{ fontSize: 34, fontWeight: 900, color: "#FFFFFF" }}>
            Subscribe for Deep Tech Explainers
          </span>
        </div>

        <div
          style={{
            background: "#FF0033",
            color: "#FFFFFF",
            fontFamily: "sans-serif",
            fontSize: 26,
            fontWeight: 900,
            padding: "14px 28px",
            borderRadius: 999,
            boxShadow: "0 0 25px rgba(255,0,51,0.6)",
            letterSpacing: "0.05em",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>SUBSCRIBE</span>
          <span style={{ fontSize: 24 }}>🔔</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
