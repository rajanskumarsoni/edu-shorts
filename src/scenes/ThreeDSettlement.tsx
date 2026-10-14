import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDSettlement: React.FC<{
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
    bankA: THREE.Group;
    bankB: THREE.Group;
    npciCore: THREE.Mesh;
    laserBeam: THREE.Mesh;
    checkmarks: THREE.Group[];
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

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 7.2, 10.5);
    camera.lookAt(0, 0.3, 0);

    // Floor Neon Grid
    const grid = new THREE.GridHelper(16, 24, new THREE.Color(accent), 0x1b2842);
    grid.position.y = -0.4;
    threeScene.add(grid);

    // Helper: Build 3D Bank Building with Pediment Roof & Columns
    const createBank = (name: string, sub: string, tagColor: string, isDebit: boolean) => {
      const bank = new THREE.Group();
      const pedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
      const colMat = new THREE.MeshStandardMaterial({
        color: isDebit ? 0x00f0ff : 0x27c93f,
        metalness: 0.8,
        roughness: 0.2,
        emissive: isDebit ? 0x004455 : 0x115522,
        emissiveIntensity: 0.4,
      });

      // Plinth
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 1.4), pedMat);
      bank.add(plinth);

      // 4 Pillars
      [-0.6, -0.2, 0.2, 0.6].forEach((px) => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 1.3, 16), colMat);
        pillar.position.set(px, 0.8, 0.45);
        bank.add(pillar);
      });

      // Bank Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.3, 0.9), pedMat);
      body.position.set(0, 0.8, -0.15);
      bank.add(body);

      // Triangular Pediment
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.7, 4), colMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.set(0, 1.8, 0);
      bank.add(roof);

      // Floating Badge
      const bCanvas = document.createElement("canvas");
      bCanvas.width = 360;
      bCanvas.height = 130;
      const bCtx = bCanvas.getContext("2d")!;

      bCtx.fillStyle = "rgba(11, 16, 32, 0.92)";
      bCtx.strokeStyle = tagColor;
      bCtx.lineWidth = 4;
      bCtx.beginPath();
      bCtx.roundRect(8, 8, 344, 114, 16);
      bCtx.fill();
      bCtx.stroke();

      bCtx.fillStyle = tagColor;
      bCtx.font = "bold 28px monospace";
      bCtx.textAlign = "center";
      bCtx.fillText(name, 180, 50);

      bCtx.fillStyle = "#ffffff";
      bCtx.font = "bold 32px sans-serif";
      bCtx.fillText(sub, 180, 96);

      const bTex = new THREE.CanvasTexture(bCanvas);
      const bMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 0.65),
        new THREE.MeshBasicMaterial({ map: bTex, transparent: true, side: THREE.DoubleSide })
      );
      bMesh.position.set(0, 1.85, 0);
      bank.add(bMesh);

      return bank;
    };

    // Bank A (Left: Debit)
    const bankA = createBank("BANK A (PAYER)", "DEBIT: -₹100", "#00F0FF", true);
    bankA.position.set(-1.42, -0.6, 0);
    threeScene.add(bankA);

    // Bank B (Right: Credit)
    const bankB = createBank("BANK B (MERCHANT)", "CREDIT: +₹100", "#27C93F", false);
    bankB.position.set(1.42, -0.6, 0);
    threeScene.add(bankB);

    // Center NPCI Switch Relay
    const npciCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 1.5, 24),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.7,
      })
    );
    npciCore.position.set(0, 0.2, -0.6);
    threeScene.add(npciCore);

    // Laser Beam between Bank A and Bank B through NPCI
    const laserGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 12);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.9,
    });
    const laserBeam = new THREE.Mesh(laserGeo, laserMat);
    laserBeam.rotation.z = Math.PI / 2;
    laserBeam.position.set(0, 0.4, 0);
    threeScene.add(laserBeam);

    // Synchronized 3D Checkmark Medallions
    const checkmarks: THREE.Group[] = [];
    [-1.42, 1.42].forEach((bx) => {
      const cGroup = new THREE.Group();
      cGroup.position.set(bx, 2.3, 0);

      const circle = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.06, 16, 32),
        new THREE.MeshBasicMaterial({ color: 0x27c93f })
      );
      cGroup.add(circle);

      // Checkmark tick
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.08, 0.06),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      tick.rotation.z = Math.PI / 4;
      cGroup.add(tick);

      cGroup.scale.setScalar(0);
      threeScene.add(cGroup);
      checkmarks.push(cGroup);
    });

    // Lights
    threeScene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 1.8);
    dir.position.set(0, 8, 8);
    threeScene.add(dir);

    const greenPoint = new THREE.PointLight(0x27c93f, 3.0, 15);
    greenPoint.position.set(1.8, 2, 2);
    threeScene.add(greenPoint);

    const cyanPoint = new THREE.PointLight(0x00f0ff, 3.0, 15);
    cyanPoint.position.set(-1.8, 2, 2);
    threeScene.add(cyanPoint);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      bankA,
      bankB,
      npciCore,
      laserBeam,
      checkmarks,
    };

    return () => {
      renderer.dispose();
      grid.dispose();
      laserGeo.dispose();
      laserMat.dispose();
    };
  }, [width, height, accent]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Dynamic 3/4 perspective camera pan
    const camAngle = Math.sin(frame * 0.02) * 0.12;
    s.camera.position.x = Math.sin(camAngle) * 2.2;
    s.camera.position.y = 2.8 + Math.cos(frame * 0.02) * 0.15;
    s.camera.position.z = 7.8;
    s.camera.lookAt(0, 1.2, 0);

    // Laser beam pulses
    s.laserBeam.scale.x = 0.9 + Math.sin(frame * 0.3) * 0.2;

    // Pop in synchronized 3D checkmarks after frame 35
    const isSettled = frame >= 35;
    const popScale = isSettled ? Math.min(1.0, (frame - 35) / 15) : 0;
    s.checkmarks.forEach((cm) => {
      cm.scale.setScalar(popScale);
      cm.rotation.y = frame * 0.03;
      cm.lookAt(s.camera.position);
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

      {/* Cinematic HUD */}
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
        {/* Top Header & Tag */}
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
              {resolveSceneTag(scene, "09 / BILATERAL SETTLEMENT")}
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
              SYNCHRONOUS ATOMIC CLEARING
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
              {scene.title || "Dual Ledger Settlement"}
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
              BANK A DEBITS • BANK B CREDITS ATOMICALLY
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
            <div style={{ fontFamily: "monospace", fontSize: 26, color: accent }}>BANK A (PAYER CBS)</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>Validate PIN ➔ Deduct ₹100</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: "#27C93F" }}>BANK B (MERCHANT CBS)</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>Verify Route ➔ Credit ₹100</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
