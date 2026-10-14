import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDPhoneLayers: React.FC<{
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
    group: THREE.Group;
    layerMeshes: THREE.Group[];
    teeChip: THREE.Mesh;
    lockIcon: THREE.Mesh;
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

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(3.8, 3.4, 7.2);
    camera.lookAt(0, 0.2, 0);

    const group = new THREE.Group();
    threeScene.add(group);

    const layerMeshes: THREE.Group[] = [];
    const badges: THREE.Mesh[] = [];

    // Helper: Create 3D Floating Holographic Label Badge
    const createBadge = (text: string, color: string) => {
      const bCanvas = document.createElement("canvas");
      bCanvas.width = 320;
      bCanvas.height = 90;
      const bCtx = bCanvas.getContext("2d")!;

      bCtx.fillStyle = "rgba(11, 16, 32, 0.9)";
      bCtx.strokeStyle = color;
      bCtx.lineWidth = 3;
      bCtx.beginPath();
      bCtx.roundRect(6, 6, 308, 78, 14);
      bCtx.fill();
      bCtx.stroke();

      bCtx.fillStyle = color;
      bCtx.font = "bold 26px monospace";
      bCtx.textAlign = "center";
      bCtx.fillText(text, 160, 52);

      const bTex = new THREE.CanvasTexture(bCanvas);
      const bMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 0.45),
        new THREE.MeshBasicMaterial({ map: bTex, transparent: true, side: THREE.DoubleSide })
      );
      return bMesh;
    };

    // Layer 1: Titanium Phone Back Chassis (Bottom)
    const l1 = new THREE.Group();
    const chassisGeo = new THREE.BoxGeometry(2.6, 0.1, 4.6);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.95,
      roughness: 0.2,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    l1.add(chassis);

    // Rear camera bump
    const camBump = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.14, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
    );
    camBump.position.set(-0.7, 0.1, -1.6);
    l1.add(camBump);

    const badge1 = createBadge("TITANIUM CHASSIS", "#94A3B8");
    badge1.position.set(1.9, 0, 0);
    l1.add(badge1);
    badges.push(badge1);

    group.add(l1);
    layerMeshes.push(l1);

    // Layer 2: Motherboard PCB with Hardware TEE Chip
    const l2 = new THREE.Group();
    const pcbGeo = new THREE.BoxGeometry(2.4, 0.08, 4.2);
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b, // Emerald green motherboard
      metalness: 0.4,
      roughness: 0.5,
      emissive: 0x022c22,
      emissiveIntensity: 0.3,
    });
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    l2.add(pcb);

    // Hardware TEE Chip (Gold-pinned microchip)
    const chipGeo = new THREE.BoxGeometry(0.85, 0.16, 0.85);
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.6,
    });
    const teeChip = new THREE.Mesh(chipGeo, chipMat);
    teeChip.position.set(0, 0.12, 0);
    l2.add(teeChip);

    // Gold pins around TEE Chip
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xffc857 });
    [-0.48, 0.48].forEach((px) => {
      for (let pz = -0.35; pz <= 0.35; pz += 0.14) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.06), pinMat);
        pin.position.set(px, 0.08, pz);
        l2.add(pin);
      }
    });

    const badge2 = createBadge("HARDWARE TEE CHIP", "#FFC857");
    badge2.position.set(1.9, 0, 0);
    l2.add(badge2);
    badges.push(badge2);

    group.add(l2);
    layerMeshes.push(l2);

    // Layer 3: Encrypted App Intent Sandbox (Frosted Glass Panel)
    const l3 = new THREE.Group();
    const sandboxGeo = new THREE.BoxGeometry(2.4, 0.06, 4.2);
    const sandboxMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.2,
      roughness: 0.1,
      transparent: true,
      opacity: 0.55,
      emissive: 0x005577,
      emissiveIntensity: 0.4,
    });
    const sandbox = new THREE.Mesh(sandboxGeo, sandboxMat);
    l3.add(sandbox);

    // Wireframe intent capsule inside sandbox
    const capsuleGeo = new THREE.BoxGeometry(1.6, 0.1, 2.2);
    const capsule = new THREE.LineSegments(
      new THREE.EdgesGeometry(capsuleGeo),
      new THREE.LineBasicMaterial({ color: 0x58d6c2 })
    );
    capsule.position.y = 0.06;
    l3.add(capsule);

    const badge3 = createBadge("APP INTENT SANDBOX", "#00F0FF");
    badge3.position.set(1.9, 0, 0);
    l3.add(badge3);
    badges.push(badge3);

    group.add(l3);
    layerMeshes.push(l3);

    // Layer 4: Gorilla Glass Display Screen with PIN Dots (Top)
    const l4 = new THREE.Group();
    const screenGeo = new THREE.BoxGeometry(2.5, 0.06, 4.4);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.1,
      transparent: true,
      opacity: 0.75,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    l4.add(screen);

    // 4 Glowing PIN Dots
    const dotGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    [-0.45, -0.15, 0.15, 0.45].forEach((x) => {
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(x, 0.08, 0.4);
      l4.add(dot);
    });

    const badge4 = createBadge("SCREEN PIN DISPLAY", "#58D6C2");
    badge4.position.set(1.9, 0, 0);
    l4.add(badge4);
    badges.push(badge4);

    group.add(l4);
    layerMeshes.push(l4);

    // 5. Floating Green Padlock above the stack
    const lockMat = new THREE.MeshStandardMaterial({
      color: 0x27c93f,
      emissive: 0x27c93f,
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.2,
    });
    const lockBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.18), lockMat);
    const lockShackle = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 16, 24), lockMat);
    lockShackle.position.y = 0.28;
    const lockIcon = new THREE.Mesh();
    lockIcon.add(lockBody);
    lockIcon.add(lockShackle);
    lockIcon.position.set(0, 2.4, 0);
    group.add(lockIcon);

    // Lights
    threeScene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 1.8);
    dir.position.set(6, 10, 8);
    threeScene.add(dir);

    const cyanPoint = new THREE.PointLight(0x00f0ff, 3.0, 15);
    cyanPoint.position.set(0, 2, 2);
    threeScene.add(cyanPoint);

    const goldPoint = new THREE.PointLight(0xffc857, 2.0, 10);
    goldPoint.position.set(0, 0, 1);
    threeScene.add(goldPoint);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      group,
      layerMeshes,
      teeChip,
      lockIcon,
      badges,
    };

    return () => {
      renderer.dispose();
      chassisGeo.dispose();
      pcbGeo.dispose();
      chipGeo.dispose();
      sandboxGeo.dispose();
      screenGeo.dispose();
      dotGeo.dispose();
    };
  }, [width, height, accent]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Dutch-angle orbit camera
    const orbit = Math.sin(frame * 0.02) * 0.35;
    s.camera.position.x = 3.6 + orbit;
    s.camera.position.y = 3.2 + Math.cos(frame * 0.018) * 0.2;
    s.camera.lookAt(-0.2, 0.2, 0);

    // Keep layers exploded in continuous floating wave motion!
    // Spreads along Y axis so all 4 layers remain clearly separated and inspectable!
    const baseSpreads = [-1.3, -0.4, 0.5, 1.4];
    s.layerMeshes.forEach((layer, idx) => {
      const floatY = Math.sin(frame * 0.03 + idx * 0.8) * 0.08;
      layer.position.y = baseSpreads[idx] + floatY;
    });

    // Make floating badges face the camera
    s.badges.forEach((b) => {
      b.lookAt(s.camera.position);
    });

    // Floating Lock icon slow rotation & pulse
    s.lockIcon.rotation.y = frame * 0.03;
    s.lockIcon.position.y = 2.4 + Math.sin(frame * 0.05) * 0.08;

    // Gentle turntable tilt of the phone chassis group
    s.group.rotation.y = -0.3 + Math.sin(frame * 0.015) * 0.15;
    s.group.rotation.x = 0.25 + Math.cos(frame * 0.02) * 0.05;

    s.renderer.render(s.scene, s.camera);
  }, [frame]);

  const hudOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1020" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />

      {/* Cinematic HUD: Stacked at top and bottom - Center is 100% open for exploded layers! */}
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
              {resolveSceneTag(scene, "05 / INTENT ASSEMBLY")}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "#27C93F",
                letterSpacing: 2,
              }}
            >
              HARDWARE TEE SANDBOX
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
              {scene.title || "Preparing Payment Intent"}
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
              ISOLATED HARDWARE ENCLAVE
            </div>
          </div>
        </div>

        {/* Lower Telemetry Pill */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
            background: "rgba(14, 20, 36, 0.88)",
            backdropFilter: "blur(20px)",
            padding: "18px 22px",
            borderRadius: 18,
            border: "1px solid rgba(0, 240, 255, 0.25)",
            marginBottom: 90,
          }}
        >
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: "#94a3b8" }}>Security</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>Hardware TEE</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: accent }}>Signing</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>RSA-2048</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: "#58D6C2" }}>Payload</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>Tamper-Proof</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
