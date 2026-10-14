import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDDigitalTunnel: React.FC<{
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
    rings: THREE.Mesh[];
    conduits: THREE.LineSegments[];
    particles: THREE.Points;
    dataCapsules: THREE.Group[];
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

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 100);
    camera.position.set(0, 0, 4);

    // 1. High-Density Glowing Tunnel Rings
    const ringGeo = new THREE.TorusGeometry(2.6, 0.06, 16, 48);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accent),
      emissive: new THREE.Color(accent),
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.2,
    });
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0x58D6C2,
      emissive: 0x58D6C2,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    });

    const rings: THREE.Mesh[] = [];
    const ringCount = 28;
    for (let i = 0; i < ringCount; i++) {
      const ring = new THREE.Mesh(ringGeo, i % 2 === 0 ? ringMat1 : ringMat2);
      ring.position.z = -i * 2.2;
      threeScene.add(ring);
      rings.push(ring);
    }

    // 2. Longitudinal Fiber-Optic Conduit Rails (6 rails running down the tunnel walls)
    const conduits: THREE.LineSegments[] = [];
    const conduitCount = 8;
    const railLength = 65;
    for (let c = 0; c < conduitCount; c++) {
      const ang = (c * Math.PI * 2) / conduitCount;
      const rx = Math.cos(ang) * 2.6;
      const ry = Math.sin(ang) * 2.6;

      const railPoints = [new THREE.Vector3(rx, ry, 5), new THREE.Vector3(rx, ry, -railLength)];
      const railGeo = new THREE.BufferGeometry().setFromPoints(railPoints);
      const railMat = new THREE.LineBasicMaterial({
        color: c % 2 === 0 ? 0x00f0ff : 0x58d6c2,
        transparent: true,
        opacity: 0.75,
      });
      const rail = new THREE.LineSegments(railGeo, railMat);
      threeScene.add(rail);
      conduits.push(rail);
    }

    // 3. Realistic 3D Payment Data Capsules (₹100 Currency Packets)
    const dataCapsules: THREE.Group[] = [];
    const tokenMat = new THREE.MeshStandardMaterial({
      color: 0xffc857,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0x885500,
      emissiveIntensity: 0.8,
    });
    const glowShellMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });

    for (let i = 0; i < 7; i++) {
      const packetGroup = new THREE.Group();

      // Gold Currency Token Core
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 20), tokenMat);
      coin.rotation.x = Math.PI / 2;
      packetGroup.add(coin);

      // Outer Holographic Shield Diamond
      const shell = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), glowShellMat);
      packetGroup.add(shell);

      // Trailing Neon Light Streak
      const tailGeo = new THREE.CylinderGeometry(0.04, 0.2, 1.8, 8);
      const tailMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.5,
      });
      const tail = new THREE.Mesh(tailGeo, tailMat);
      tail.position.z = 1.0;
      tail.rotation.x = Math.PI / 2;
      packetGroup.add(tail);

      const ang = (i * Math.PI * 2) / 7;
      const rad = 1.6;
      packetGroup.position.set(Math.cos(ang) * rad, Math.sin(ang) * rad, -i * 9);
      threeScene.add(packetGroup);
      dataCapsules.push(packetGroup);
    }

    // 4. Optical Fiber Particle Cloud
    const particleCount = 400;
    const partGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.8 + Math.random() * 1.8;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = -Math.random() * 60;
    }
    partGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const partMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
    });
    const particles = new THREE.Points(partGeo, partMat);
    threeScene.add(particles);

    // Lights
    threeScene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const pointLight = new THREE.PointLight(0x00f0ff, 3.5, 25);
    pointLight.position.set(0, 0, 3);
    threeScene.add(pointLight);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      rings,
      conduits,
      particles,
      dataCapsules,
    };

    return () => {
      renderer.dispose();
      ringGeo.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      partGeo.dispose();
      partMat.dispose();
      tokenMat.dispose();
      glowShellMat.dispose();
    };
  }, [width, height, accent]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // High speed forward fly-through with camera roll and weave
    const speed = 0.35;
    const zOffset = (frame * speed) % 2.2;

    // Camera banking roll & subtle sway
    const roll = Math.sin(frame * 0.04) * 0.15;
    s.camera.rotation.z = roll;
    s.camera.position.x = Math.sin(frame * 0.03) * 0.3;
    s.camera.position.y = Math.cos(frame * 0.025) * 0.2;

    // Recycle rings forward
    s.rings.forEach((ring, idx) => {
      let z = -idx * 2.2 + zOffset;
      if (z > 4) z -= 28 * 2.2;
      ring.position.z = z;
      ring.rotation.z = frame * 0.01 * (idx % 2 === 0 ? 1 : -1);
    });

    // Speeding payment capsules moving towards/past camera
    s.dataCapsules.forEach((cap, idx) => {
      let z = -idx * 9 + ((frame * 1.4) % 65);
      if (z > 4) z -= 65;
      cap.position.z = z;
      cap.rotation.z = frame * 0.05 + idx;
      cap.rotation.y = frame * 0.03;
    });

    // Particles stream backward
    const pos = s.particles.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length / 3; i++) {
      pos[i * 3 + 2] += 0.8;
      if (pos[i * 3 + 2] > 4) {
        pos[i * 3 + 2] = -60;
      }
    }
    s.particles.geometry.attributes.position.needsUpdate = true;

    s.renderer.render(s.scene, s.camera);
  }, [frame]);

  const hudOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1020" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />

      {/* Cinematic HUD: Stacked at top and bottom - Center is 100% open fly-through! */}
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
              {resolveSceneTag(scene, "02 / ENCRYPTED HIGHWAY")}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "#58D6C2",
                letterSpacing: 2,
              }}
            >
              TUNNEL://UPI.CORE.ROUTE
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
              {scene.title || "The Digital Payment Tunnel"}
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
              FAST-PATH PACKET ROUTING • 240ms DISPATCH
            </div>
          </div>
        </div>

        {/* Lower Telemetry Pill */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            background: "rgba(14, 20, 36, 0.88)",
            backdropFilter: "blur(20px)",
            padding: "18px 28px",
            borderRadius: 18,
            border: "1px solid rgba(0, 240, 255, 0.3)",
            marginBottom: 90,
          }}
        >
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 28, color: "#94a3b8" }}>ENCRYPTION: AES-256-GCM</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#FFFFFF" }}>PROTOCOL: ISO-20022 / IMPS</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "monospace", fontSize: 28, color: "#58D6C2" }}>SPEEDOMETER</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: accent }}>₹100.00 DISPATCHED</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
