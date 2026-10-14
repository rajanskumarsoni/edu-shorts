import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDBankVault: React.FC<{
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
    doorHinge: THREE.Group;
    bolts: THREE.Mesh[];
    lockWheel: THREE.Mesh;
    vaultLight: THREE.PointLight;
    tokenGroup: THREE.Group;
    ledgerMesh: THREE.Mesh;
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

    // 3/4 Isometric Perspective Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(2.8, 1.8, 8.8);
    camera.lookAt(-0.2, 0.1, 0);

    // 1. Vault Outer Steel Frame & Casing
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x0f172a,
      emissiveIntensity: 0.4,
    });

    const frameOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(2.7, 2.7, 0.6, 48, 1, true),
      frameMat
    );
    frameOuter.rotation.x = Math.PI / 2;
    threeScene.add(frameOuter);

    const frameRim = new THREE.Mesh(
      new THREE.TorusGeometry(2.6, 0.18, 16, 48),
      frameMat
    );
    threeScene.add(frameRim);

    // 2. Vault Interior Chamber Wall
    const chamberMat = new THREE.MeshStandardMaterial({
      color: 0x0b1329,
      metalness: 0.7,
      roughness: 0.3,
    });
    const chamberBack = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), chamberMat);
    chamberBack.position.z = -3.2;
    threeScene.add(chamberBack);

    // Floor grid inside vault
    const grid = new THREE.GridHelper(10, 16, new THREE.Color(accent), 0x152238);
    grid.position.set(0, -1.8, -1.2);
    threeScene.add(grid);

    // 3. Floating Golden Currency Tokens inside Chamber
    const tokenGroup = new THREE.Group();
    tokenGroup.position.set(0.8, -0.6, -1.6);
    threeScene.add(tokenGroup);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffc857,
      metalness: 0.95,
      roughness: 0.12,
      emissive: 0x664400,
      emissiveIntensity: 0.7,
    });

    for (let i = 0; i < 6; i++) {
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 24), goldMat);
      coin.rotation.x = Math.PI / 2;
      coin.position.set((i % 3) * 0.7 - 0.7, Math.floor(i / 3) * 0.45, (i % 2) * 0.3);
      tokenGroup.add(coin);
    }

    // 4. 3D Floating Holographic Digital Ledger Inside Chamber
    const lCanvas = document.createElement("canvas");
    lCanvas.width = 440;
    lCanvas.height = 280;
    const lCtx = lCanvas.getContext("2d")!;

    lCtx.fillStyle = "rgba(11, 18, 34, 0.92)";
    lCtx.strokeStyle = "#58D6C2";
    lCtx.lineWidth = 4;
    lCtx.beginPath();
    lCtx.roundRect(8, 8, 424, 264, 20);
    lCtx.fill();
    lCtx.stroke();

    lCtx.fillStyle = "#58D6C2";
    lCtx.font = "bold 26px monospace";
    lCtx.fillText("CORE BANKING LEDGER", 28, 52);

    lCtx.fillStyle = "#94a3b8";
    lCtx.font = "24px sans-serif";
    lCtx.fillText("A/C: XXXX-9821  •  STATE: ACTIVE", 28, 95);

    lCtx.fillStyle = "#cbd5e1";
    lCtx.font = "bold 28px monospace";
    lCtx.fillText("BEFORE: ₹5,000.00", 28, 145);

    lCtx.fillStyle = "#FF5555";
    lCtx.font = "bold 32px monospace";
    lCtx.fillText("DEBIT:  -₹100.00", 28, 190);

    lCtx.fillStyle = "#27C93F";
    lCtx.font = "bold 34px monospace";
    lCtx.fillText("AFTER:  ₹4,900.00", 28, 240);

    const lTex = new THREE.CanvasTexture(lCanvas);
    const ledgerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.5),
      new THREE.MeshBasicMaterial({ map: lTex, transparent: true, side: THREE.DoubleSide })
    );
    ledgerMesh.position.set(0.6, 0.4, -1.6);
    threeScene.add(ledgerMesh);

    // 5. Heavy Steel Vault Door with Radial Bolts and Steering Wheel
    const doorHinge = new THREE.Group();
    doorHinge.position.set(-1.8, 0, 0); // pivot point on left
    threeScene.add(doorHinge);

    const doorGroup = new THREE.Group();
    doorGroup.position.set(1.8, 0, 0); // offset center from hinge
    doorHinge.add(doorGroup);

    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.92,
      roughness: 0.18,
      emissive: 0x1e293b,
      emissiveIntensity: 0.45,
    });

    // Circular door slab
    const doorSlab = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 0.36, 48), doorMat);
    doorSlab.rotation.x = Math.PI / 2;
    doorGroup.add(doorSlab);

    // Glowing edge around door
    const doorEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.CylinderGeometry(2.35, 2.35, 0.36, 48)),
      new THREE.LineBasicMaterial({ color: 0x00f0ff })
    );
    doorEdge.rotation.x = Math.PI / 2;
    doorGroup.add(doorEdge);

    // Concentric ribs on door
    const rib1 = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.08, 16, 48), frameMat);
    rib1.position.z = 0.2;
    doorGroup.add(rib1);

    const rib2 = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.08, 16, 48), frameMat);
    rib2.position.z = 0.2;
    doorGroup.add(rib2);

    // Central Turning Steering Wheel
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.85,
      roughness: 0.15,
      emissive: 0x004466,
      emissiveIntensity: 0.8,
    });
    const lockWheel = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.08, 16, 32), wheelMat);
    lockWheel.position.z = 0.25;
    doorGroup.add(lockWheel);

    // Wheel spokes
    [-Math.PI / 4, 0, Math.PI / 4, Math.PI / 2].forEach((ang) => {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 12), wheelMat);
      spoke.rotation.z = ang;
      spoke.position.z = 0.25;
      doorGroup.add(spoke);
    });

    // 8 Radial Heavy Steel Locking Bolts
    const bolts: THREE.Mesh[] = [];
    const boltMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1,
    });
    const boltGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.55, 16);

    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      const bolt = new THREE.Mesh(boltGeo, boltMat);
      bolt.rotation.z = ang + Math.PI / 2;
      bolt.position.set(Math.cos(ang) * 2.3, Math.sin(ang) * 2.3, 0);
      doorGroup.add(bolt);
      bolts.push(bolt);
    }

    // Lights
    threeScene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const mainDir = new THREE.DirectionalLight(0xffffff, 2.0);
    mainDir.position.set(4, 8, 8);
    threeScene.add(mainDir);

    const doorLight = new THREE.PointLight(0x00f0ff, 3.0, 15);
    doorLight.position.set(-2.5, 1, 3);
    threeScene.add(doorLight);

    const vaultLight = new THREE.PointLight(0x27c93f, 3.0, 15);
    vaultLight.position.set(0.6, 0.5, 0.5);
    threeScene.add(vaultLight);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      doorHinge,
      bolts,
      lockWheel,
      vaultLight,
      tokenGroup,
      ledgerMesh,
    };

    return () => {
      renderer.dispose();
      frameMat.dispose();
      doorMat.dispose();
      goldMat.dispose();
      chamberMat.dispose();
      boltGeo.dispose();
      boltMat.dispose();
    };
  }, [width, height, accent]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Timeline phases:
    // Frame 0–25: Locked. Wheel spins, 8 bolts retract.
    // Frame 25–60: Door swings open to left by ~65°.
    // Frame 60+: Door stays gracefully open, camera maintains 3/4 perspective showing BOTH door and ledger!

    const wheelSpin = interpolate(frame, [0, 25], [0, Math.PI], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    s.lockWheel.rotation.z = wheelSpin;

    const boltRetract = interpolate(frame, [0, 25], [0, 0.3], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    s.bolts.forEach((bolt, idx) => {
      const ang = (idx * Math.PI) / 4;
      const dist = 2.3 - boltRetract;
      bolt.position.set(Math.cos(ang) * dist, Math.sin(ang) * dist, 0);
    });

    const doorOpenAngle = interpolate(frame, [25, 60], [0, -Math.PI * 0.35], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    s.doorHinge.rotation.y = doorOpenAngle;

    // Balanced 3/4 camera drift: preserves both the swung-open door and chamber!
    const camX = interpolate(frame, [0, 80], [2.8, 1.8], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    s.camera.position.x = camX;
    s.camera.position.y = 1.8 + Math.sin(frame * 0.02) * 0.1;
    s.camera.position.z = 8.5;
    s.camera.lookAt(-0.1, 0.1, 0);

    // Beat-driven spring micro-animations for 120 BPM visual momentum
    const beatPhase = (frame % 25) / 25;
    const beatPulse = 1 + Math.sin(beatPhase * Math.PI * 2) * 0.006;

    // Subtle coin hovering with beat-driven pulse
    s.tokenGroup.children.forEach((coin, idx) => {
      coin.rotation.z = frame * 0.02 + idx * 0.4;
      coin.position.y = Math.sin(frame * 0.04 + idx) * 0.05;
      coin.scale.setScalar(beatPulse);
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

      {/* Cinematic HUD: Stacked at top and bottom - Center is 100% open for vault & ledger! */}
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
              {resolveSceneTag(scene, "08 / CBS DEBIT CLEARING")}
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
              CBS ENGINE: ACID DEBIT
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
              {scene.title || "Inside Customer Bank (Bank A)"}
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
              REALTIME LEDGER DECREMENT
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
            border: "1px solid rgba(0, 240, 255, 0.25)",
            marginBottom: 90,
          }}
        >
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: "#94a3b8" }}>ACCOUNT BALANCE</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: "#FFFFFF" }}>₹5,000.00 ➔ <span style={{ color: "#27C93F" }}>₹4,900.00</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: "#FF5555" }}>DEBIT STATUS</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#FF5555" }}>-₹100.00 SETTLED</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
