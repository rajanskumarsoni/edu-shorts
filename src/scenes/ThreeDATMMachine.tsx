import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDATMMachine: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    atmGroup: THREE.Group;
    cardMesh: THREE.Mesh;
    shutterMesh: THREE.Mesh;
    notesGroup: THREE.Group;
    screenTexture: THREE.CanvasTexture;
    screenCanvas: HTMLCanvasElement;
    screenCtx: CanvasRenderingContext2D;
    keypadLeds: THREE.PointLight[];
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

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0.6, 1.8, 8.4);
    camera.lookAt(0, 0.2, 0);

    const atmGroup = new THREE.Group();
    threeScene.add(atmGroup);

    // Materials
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x111625,
      metalness: 0.85,
      roughness: 0.3,
    });
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x1a2238,
      metalness: 0.7,
      roughness: 0.25,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accent),
      emissive: new THREE.Color(accent),
      emissiveIntensity: 0.8,
      metalness: 0.5,
      roughness: 0.2,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x8899aa,
      metalness: 0.95,
      roughness: 0.15,
    });

    // 1. ATM Main Cabinet Body
    const bodyGeo = new THREE.BoxGeometry(3.2, 5.4, 2.2);
    const body = new THREE.Mesh(bodyGeo, chassisMat);
    body.position.set(0, 0, 0);
    atmGroup.add(body);

    // Beveled side accent strips
    const stripGeo = new THREE.BoxGeometry(0.08, 5.4, 0.08);
    const leftStrip = new THREE.Mesh(stripGeo, accentMat);
    leftStrip.position.set(-1.61, 0, 1.11);
    const rightStrip = new THREE.Mesh(stripGeo, accentMat);
    rightStrip.position.set(1.61, 0, 1.11);
    atmGroup.add(leftStrip, rightStrip);

    // Top illuminated Header / Canopy with sleek neon visor
    const canopyGeo = new THREE.BoxGeometry(3.2, 0.7, 2.4);
    const canopy = new THREE.Mesh(canopyGeo, panelMat);
    canopy.position.set(0, 2.7, 0.1);
    atmGroup.add(canopy);

    // Canopy glowing neon visor strip
    const visorGeo = new THREE.BoxGeometry(3.0, 0.08, 0.12);
    const visorMesh = new THREE.Mesh(visorGeo, accentMat);
    visorMesh.position.set(0, 2.7, 1.32);
    atmGroup.add(visorMesh);

    // 2. Interactive LCD Screen
    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = 640;
    screenCanvas.height = 440;
    const screenCtx = screenCanvas.getContext("2d")!;
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    const screenGeo = new THREE.PlaneGeometry(2.4, 1.6);
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 1.1, 1.12);
    atmGroup.add(screenMesh);

    // Bezel around screen
    const bezelGeo = new THREE.BoxGeometry(2.6, 1.8, 0.08);
    const bezel = new THREE.Mesh(bezelGeo, panelMat);
    bezel.position.set(0, 1.1, 1.08);
    atmGroup.add(bezel);

    // 3. Card Reader Slot
    const readerBezelGeo = new THREE.BoxGeometry(1.2, 0.35, 0.15);
    const readerBezel = new THREE.Mesh(readerBezelGeo, panelMat);
    readerBezel.position.set(0.7, -0.2, 1.15);
    const slotHoleGeo = new THREE.BoxGeometry(0.9, 0.06, 0.2);
    const slotHoleMat = new THREE.MeshBasicMaterial({ color: 0x020408 });
    const slotHole = new THREE.Mesh(slotHoleGeo, slotHoleMat);
    slotHole.position.set(0.7, -0.2, 1.2);
    atmGroup.add(readerBezel, slotHole);

    // Flashing Green Guide Bevel on card slot
    const slotGlowGeo = new THREE.BoxGeometry(0.96, 0.12, 0.04);
    const slotGlowMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const slotGlow = new THREE.Mesh(slotGlowGeo, slotGlowMat);
    slotGlow.position.set(0.7, -0.2, 1.23);
    atmGroup.add(slotGlow);

    // 3D EMV Smart Card
    const cardGeo = new THREE.BoxGeometry(0.85, 0.03, 1.35);
    const cardMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      metalness: 0.6,
      roughness: 0.3,
    });
    const cardMesh = new THREE.Mesh(cardGeo, cardMat);
    // Gold EMV Chip on card
    const chipGeo = new THREE.BoxGeometry(0.25, 0.035, 0.28);
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.95,
      roughness: 0.1,
    });
    const chipMesh = new THREE.Mesh(chipGeo, chipMat);
    chipMesh.position.set(-0.2, 0.005, -0.3);
    cardMesh.add(chipMesh);
    cardMesh.position.set(0.7, -0.2, 2.2);
    atmGroup.add(cardMesh);

    // 4. Encrypted PIN Pad (EPP) Console - Angled shelf
    const shelfGeo = new THREE.BoxGeometry(2.8, 0.8, 1.0);
    const shelf = new THREE.Mesh(shelfGeo, chassisMat);
    shelf.position.set(0, -0.85, 1.3);
    shelf.rotation.x = 0.28;
    atmGroup.add(shelf);

    // PIN Pad Metal Shield / Cover
    const eppBaseGeo = new THREE.BoxGeometry(1.2, 0.1, 0.85);
    const eppBase = new THREE.Mesh(eppBaseGeo, metalMat);
    eppBase.position.set(-0.5, -0.75, 1.55);
    eppBase.rotation.x = 0.28;
    atmGroup.add(eppBase);

    // Metallic Keycaps
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const keyGeo = new THREE.BoxGeometry(0.18, 0.08, 0.14);
        const key = new THREE.Mesh(keyGeo, metalMat);
        key.position.set(
          -0.5 + (c - 1) * 0.28,
          -0.7 + (1.5 - r) * 0.16,
          1.58 + (r - 1.5) * 0.04
        );
        key.rotation.x = 0.28;
        atmGroup.add(key);
      }
    }

    // EPP Privacy Shield wings (Left & Right Wings to block cameras)
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.2,
    });
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.9), wingMat);
    leftWing.position.set(-1.15, -0.65, 1.55);
    leftWing.rotation.x = 0.28;
    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.9), wingMat);
    rightWing.position.set(0.15, -0.65, 1.55);
    rightWing.rotation.x = 0.28;
    atmGroup.add(leftWing, rightWing);

    // 5. Lower Cash Dispenser Safe Shutter & Slot
    const safeDoorGeo = new THREE.BoxGeometry(2.4, 0.65, 0.15);
    const safeDoor = new THREE.Mesh(safeDoorGeo, panelMat);
    safeDoor.position.set(0, -1.85, 1.15);
    atmGroup.add(safeDoor);

    const shutterGeo = new THREE.BoxGeometry(1.4, 0.35, 0.08);
    const shutterMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.9,
      roughness: 0.2,
    });
    const shutterMesh = new THREE.Mesh(shutterGeo, shutterMat);
    shutterMesh.position.set(0, -1.85, 1.22);
    atmGroup.add(shutterMesh);

    // Cash Notes Group (₹500 / Currency bills)
    const notesGroup = new THREE.Group();
    notesGroup.position.set(0, -1.85, 1.1);
    atmGroup.add(notesGroup);

    const noteGeo = new THREE.BoxGeometry(1.15, 0.015, 0.65);
    const noteMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      metalness: 0.2,
      roughness: 0.5,
      emissive: 0x059669,
      emissiveIntensity: 0.3,
    });
    for (let i = 0; i < 5; i++) {
      const note = new THREE.Mesh(noteGeo, noteMat);
      note.position.set(0, (i - 2) * 0.02, 0);
      note.rotation.x = -0.15 + (i * 0.03);
      notesGroup.add(note);
    }

    // 6. Cyber Grid Floor
    const gridHelper = new THREE.GridHelper(24, 24, new THREE.Color(accent), 0x152033);
    gridHelper.position.y = -2.7;
    threeScene.add(gridHelper);

    // 7. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(4, 6, 8);
    const rimLight = new THREE.PointLight(new THREE.Color(accent), 3.0, 15);
    rimLight.position.set(-3, 2, 4);
    const safeLight = new THREE.PointLight(0x00ff88, 1.5, 6);
    safeLight.position.set(0, -1.8, 2.0);
    threeScene.add(ambientLight, dirLight, rimLight, safeLight);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      atmGroup,
      cardMesh,
      shutterMesh,
      notesGroup,
      screenTexture,
      screenCanvas,
      screenCtx,
      keypadLeds: [safeLight],
    };

    return () => {
      renderer.dispose();
    };
  }, [width, height, accent]);

  // Frame animation loop
  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;

    const {
      renderer,
      scene: threeScene,
      camera,
      atmGroup,
      cardMesh,
      shutterMesh,
      notesGroup,
      screenTexture,
      screenCanvas,
      screenCtx,
    } = state;

    // Camera choreography: wide 3/4 angle slowly tracking inward
    const camX = interpolate(frame, [0, 90, 180], [1.2, 0.4, 0.0], {
      extrapolateRight: "clamp",
    });
    const camY = interpolate(frame, [0, 90, 180], [-0.3, -0.5, -0.7], {
      extrapolateRight: "clamp",
    });
    const camZ = interpolate(frame, [0, 90, 180], [12.0, 10.8, 9.8], {
      extrapolateRight: "clamp",
    });
    camera.position.set(camX, camY, camZ);
    camera.lookAt(0, -0.8, 0);

    // Beat-driven spring micro-animations for 120 BPM visual momentum
    const beatPhase = (frame % 25) / 25; // 120 BPM = 25 frames per beat at 30fps
    const beatPulse = 1 + Math.sin(beatPhase * Math.PI * 2) * 0.008;

    // Subtle breathing rotation with beat-driven pulse
    atmGroup.rotation.y = Math.sin(frame * 0.02) * 0.05;
    atmGroup.position.set(0, -0.8, 0);
    atmGroup.scale.setScalar(0.96 + beatPulse * 0.04);

    // Card insertion animation (frames 10 to 60)
    const cardZ = interpolate(frame, [15, 60], [2.4, 1.05], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    cardMesh.position.z = cardZ;
    cardMesh.visible = frame > 5;

    // Cash shutter opening (frames 80 to 110)
    const shutterY = interpolate(frame, [80, 110], [-1.85, -1.55], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    shutterMesh.position.y = shutterY;

    // Cash dispensing push (frames 100 to 150)
    const cashZ = interpolate(frame, [100, 145], [1.0, 1.75], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    notesGroup.position.z = cashZ;

    // Dynamic LCD Screen updates
    screenCtx.fillStyle = "#09101d";
    screenCtx.fillRect(0, 0, 640, 440);

    // Screen Top Bar
    screenCtx.fillStyle = "#16233b";
    screenCtx.fillRect(0, 0, 640, 60);
    screenCtx.fillStyle = accent;
    screenCtx.font = "bold 24px monospace";
    screenCtx.fillText("ATM NETWORK CORE // ISO 8583", 30, 40);

    if (frame < 50) {
      // Step 1: Card Insert
      screenCtx.fillStyle = "#ffffff";
      screenCtx.font = "bold 36px sans-serif";
      screenCtx.fillText("PLEASE INSERT CARD", 40, 160);
      screenCtx.fillStyle = "#94a3b8";
      screenCtx.font = "24px sans-serif";
      screenCtx.fillText("EMV Chip Reader Active...", 40, 210);

      // Flashing card icon
      screenCtx.strokeStyle = "#38bdf8";
      screenCtx.lineWidth = 4;
      screenCtx.strokeRect(40, 260, 160, 100);
      screenCtx.fillStyle = "#38bdf8";
      screenCtx.fillRect(60, 290, 40, 40);
    } else if (frame < 100) {
      // Step 2: Encrypting PIN & Network Call
      screenCtx.fillStyle = "#00f0ff";
      screenCtx.font = "bold 34px sans-serif";
      screenCtx.fillText("PIN ENCRYPTED VIA EPP", 40, 150);
      screenCtx.fillStyle = "#ffffff";
      screenCtx.font = "24px monospace";
      screenCtx.fillText("DUKPT 3DES KEY DERIVATION", 40, 195);
      screenCtx.fillStyle = "#facc15";
      screenCtx.fillText("ROUTING TO NFS SWITCH...", 40, 240);

      // Processing pulse bar
      const barW = (frame - 50) * 8;
      screenCtx.fillStyle = "#00f0ff";
      screenCtx.fillRect(40, 280, Math.min(barW, 450), 18);
    } else {
      // Step 3: Cash Dispensed
      screenCtx.fillStyle = "#4ade80";
      screenCtx.font = "bold 38px sans-serif";
      screenCtx.fillText("TRANSACTION APPROVED", 40, 150);
      screenCtx.fillStyle = "#ffffff";
      screenCtx.font = "26px sans-serif";
      screenCtx.fillText("Please collect your cash", 40, 200);

      screenCtx.fillStyle = "#10b981";
      screenCtx.font = "bold 32px monospace";
      screenCtx.fillText("₹ 5,000 DISPENSED", 40, 270);
      screenCtx.fillStyle = "#94a3b8";
      screenCtx.font = "20px monospace";
      screenCtx.fillText("CBS AUTH CODE: #948210", 40, 320);
    }

    screenTexture.needsUpdate = true;
    renderer.render(threeScene, camera);
  }, [frame, accent]);

  const tagText = resolveSceneTag(scene, "01 / THE CASH MACHINE");

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1020" }}>
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
        }}
      />

      {/* Tracked Header Tag */}
      <div
        style={{
          position: "absolute",
          top: 90,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: accent,
            background: "rgba(11, 16, 32, 0.8)",
            padding: "10px 24px",
            borderRadius: 30,
            border: `1px solid ${accent}55`,
            backdropFilter: "blur(12px)",
          }}
        >
          {tagText}
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#ffffff",
            background: "rgba(15, 23, 42, 0.75)",
            padding: "8px 20px",
            borderRadius: 20,
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          ISO 8583 // NFS
        </div>
      </div>

      {/* Main Screen Title */}
      <div
        style={{
          position: "absolute",
          top: 190,
          left: 60,
          right: 60,
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: 68,
            fontWeight: 900,
            color: "#ffffff",
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            textShadow: "0 8px 30px rgba(0,0,0,0.8)",
          }}
        >
          {scene.title || "How ATM Machines Work"}
        </h1>
      </div>

      {/* Telemetry Bottom Card */}
      <div
        style={{
          position: "absolute",
          bottom: 340,
          left: 60,
          right: 60,
          zIndex: 10,
          display: "flex",
          gap: 16,
        }}
      >
        <div
          style={{
            flex: 1,
            background: "rgba(15, 23, 42, 0.85)",
            border: `1px solid ${accent}44`,
            borderRadius: 16,
            padding: "16px 22px",
            backdropFilter: "blur(16px)",
          }}
        >
          <div style={{ fontSize: 24, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Network Protocol
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#ffffff", marginTop: 4 }}>
            ISO 8583 Core
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(0, 255, 136, 0.35)",
            borderRadius: 16,
            padding: "16px 22px",
            backdropFilter: "blur(16px)",
          }}
        >
          <div style={{ fontSize: 24, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Dispense Speed
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#00ff88", marginTop: 4 }}>
            &lt; 2 Seconds
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
