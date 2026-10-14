import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDConcentricSecurity: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    ringGroups: THREE.Group[];
    keyGroup: THREE.Group;
    particles: THREE.Points;
    badges: THREE.Mesh[];
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
    threeScene.fog = new THREE.FogExp2(0x0b1020, 0.04);

    // Dynamic 3/4 Isometric Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(3.4, 2.8, 8.2);
    camera.lookAt(0, 0, 0);

    // 1. Central 3D Golden Cryptographic Key
    const keyGroup = new THREE.Group();
    threeScene.add(keyGroup);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffc857,
      metalness: 0.95,
      roughness: 0.12,
      emissive: 0x664400,
      emissiveIntensity: 0.7,
    });

    // Key ring head (Beveled Bow)
    const keyHead = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.14, 16, 36), goldMat);
    keyHead.position.y = 0.7;
    keyGroup.add(keyHead);

    // Key shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.6, 20), goldMat);
    shaft.position.y = -0.3;
    keyGroup.add(shaft);

    // Key collars
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 20), goldMat);
    collar.position.y = 0.25;
    keyGroup.add(collar);

    // Key teeth / wards
    const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.12), goldMat);
    tooth1.position.set(0.2, -0.65, 0);
    keyGroup.add(tooth1);

    const tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.12), goldMat);
    tooth2.position.set(0.16, -0.92, 0);
    keyGroup.add(tooth2);

    // 2. 4 Multi-Axis Concentric Gyroscopic Titanium Rings
    const ringRadii = [1.4, 2.1, 2.8, 3.5];
    const ringColors = [0x00F0FF, 0x58D6C2, 0x00F0FF, 0xFFC857];
    const ringLabels = [
      "01 / HARDWARE KEYSTORE",
      "02 / COMMON LIBRARY",
      "03 / AES-256 TRANSPORT",
      "04 / BANK HSM VALIDATION",
    ];

    const ringGroups: THREE.Group[] = [];
    const badges: THREE.Mesh[] = [];

    // Helper: Create 3D Floating Holographic Ring Badge
    const createBadge = (text: string, color: string) => {
      const bCanvas = document.createElement("canvas");
      bCanvas.width = 340;
      bCanvas.height = 90;
      const bCtx = bCanvas.getContext("2d")!;

      bCtx.fillStyle = "rgba(11, 16, 32, 0.92)";
      bCtx.strokeStyle = color;
      bCtx.lineWidth = 3;
      bCtx.beginPath();
      bCtx.roundRect(6, 6, 328, 78, 14);
      bCtx.fill();
      bCtx.stroke();

      bCtx.fillStyle = color;
      bCtx.font = "bold 24px monospace";
      bCtx.textAlign = "center";
      bCtx.fillText(text, 170, 52);

      const bTex = new THREE.CanvasTexture(bCanvas);
      const bMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 0.42),
        new THREE.MeshBasicMaterial({ map: bTex, transparent: true, side: THREE.DoubleSide })
      );
      return bMesh;
    };

    ringRadii.forEach((radius, idx) => {
      const rGroup = new THREE.Group();
      threeScene.add(rGroup);
      ringGroups.push(rGroup);

      // Ring Torus
      const ringGeo = new THREE.TorusGeometry(radius, 0.06, 16, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: ringColors[idx],
        metalness: 0.9,
        roughness: 0.15,
        emissive: ringColors[idx],
        emissiveIntensity: 0.45,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      rGroup.add(ringMesh);

      // Mechanical Gimbal Brackets & Nodes
      const notchGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
      const notchMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.95,
        roughness: 0.1,
      });
      for (let a = 0; a < 4; a++) {
        const ang = (a * Math.PI) / 2;
        const notch = new THREE.Mesh(notchGeo, notchMat);
        notch.position.set(Math.cos(ang) * radius, Math.sin(ang) * radius, 0);
        rGroup.add(notch);
      }

      // Anchor Floating Label Badge to Ring outer rim
      const badge = createBadge(ringLabels[idx], `#${ringColors[idx].toString(16).padStart(6, "0")}`);
      badge.position.set(0, radius + 0.35, 0);
      rGroup.add(badge);
      badges.push(badge);
    });

    // 3. Surrounding Holographic Shielding Particle Sphere
    const pCount = 300;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 3.9;
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.07,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(pGeo, pMat);
    threeScene.add(particles);

    // Lights
    threeScene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 1.8);
    dir.position.set(6, 8, 10);
    threeScene.add(dir);

    const goldPoint = new THREE.PointLight(0xffc857, 3.0, 12);
    goldPoint.position.set(0, 0, 2);
    threeScene.add(goldPoint);

    const cyanPoint = new THREE.PointLight(0x00f0ff, 2.5, 15);
    cyanPoint.position.set(-3, 3, 3);
    threeScene.add(cyanPoint);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      ringGroups,
      keyGroup,
      particles,
      badges,
    };

    return () => {
      renderer.dispose();
      goldMat.dispose();
      pGeo.dispose();
      pMat.dispose();
    };
  }, [width, height, accent]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Dynamic 3/4 Orbiting Camera
    const orbit = Math.sin(frame * 0.02) * 0.4;
    s.camera.position.x = 3.4 + orbit;
    s.camera.position.y = 2.8 + Math.cos(frame * 0.025) * 0.3;
    s.camera.lookAt(0, 0, 0);

    // Multi-Axis 3D Gyroscopic Rotation on Different Axes (Genuine 3D Gimbal!)
    // Ring 0: Tilted on X and spins on Y
    s.ringGroups[0].rotation.x = Math.PI / 6 + frame * 0.02;
    s.ringGroups[0].rotation.y = frame * 0.025;

    // Ring 1: Spins on Y and Z
    s.ringGroups[1].rotation.y = -frame * 0.018;
    s.ringGroups[1].rotation.z = Math.PI / 4 + frame * 0.015;

    // Ring 2: Tilted on Z and spins on X
    s.ringGroups[2].rotation.z = -Math.PI / 5 + frame * 0.012;
    s.ringGroups[2].rotation.x = -frame * 0.02;

    // Ring 3: Counter-rotation on Z
    s.ringGroups[3].rotation.z = frame * 0.014;
    s.ringGroups[3].rotation.y = Math.sin(frame * 0.02) * 0.3;

    // Central Key majestic tumble & specular glint
    s.keyGroup.rotation.y = frame * 0.025;
    s.keyGroup.rotation.x = 0.2 + Math.sin(frame * 0.03) * 0.15;
    s.keyGroup.position.y = Math.sin(frame * 0.04) * 0.08;

    // Make floating badges face camera
    s.badges.forEach((b) => {
      b.lookAt(s.camera.position);
    });

    s.renderer.render(s.scene, s.camera);
  }, [frame]);

  const hudOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1020" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />

      {/* Cinematic HUD: Stacked at top and bottom - Center is 100% open for gyroscopic key! */}
      <AbsoluteFill
        style={{
          opacity: hudOpacity,
          padding: "50px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          pointerEvents: "none",
        }}
      >
        {/* Top Header & Scene Tag */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 28,
                letterSpacing: 2,
                fontWeight: 800,
                color: accent,
                background: "rgba(0, 240, 255, 0.12)",
                padding: "8px 22px",
                borderRadius: 8,
                border: `1.5px solid ${accent}50`,
              }}
            >
              {resolveSceneTag(scene, "06 / ZERO-KNOWLEDGE PIN")}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "#FFC857",
                letterSpacing: 2,
              }}
            >
              HARDWARE-ISOLATED MPIN
            </div>
          </div>

          <div>
            <h1
              style={{
                fontSize: 52,
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: -1,
                margin: 0,
                textShadow: `0 0 30px ${accent}60`,
                lineHeight: 1.15,
              }}
            >
              {scene.title || "UPI PIN & Secure Sandbox"}
            </h1>
            <div
              style={{
                display: "inline-block",
                fontFamily: "monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "#58D6C2",
                background: "rgba(11, 16, 32, 0.8)",
                padding: "6px 20px",
                borderRadius: 999,
                border: "1px solid rgba(88, 214, 194, 0.4)",
                marginTop: 8,
              }}
            >
              NO APP CAN READ YOUR 6-DIGIT PIN
            </div>
          </div>
        </div>

        {/* Lower Telemetry Pill */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            background: "rgba(14, 20, 36, 0.88)",
            backdropFilter: "blur(20px)",
            padding: "18px 28px",
            borderRadius: 18,
            border: "1px solid rgba(0, 240, 255, 0.25)",
            marginBottom: 90,
          }}
        >
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: "#FFC857" }}>Device Keystore</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>Hardware Encrypted</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: "#58D6C2" }}>Bank HSM</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>FIPS 140-2 Level 3</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
