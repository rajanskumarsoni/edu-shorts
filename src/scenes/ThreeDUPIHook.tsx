import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDUPIHook: React.FC<{
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
    phoneGroup: THREE.Group;
    standeeGroup: THREE.Group;
    coffeeCupGroup: THREE.Group;
    shoppingBagGroup: THREE.Group;
    groceryBox: THREE.Mesh;
    packedBadge: THREE.Mesh;
    laserPlane: THREE.Mesh;
    screenTexture: THREE.CanvasTexture;
    screenCanvas: HTMLCanvasElement;
    screenCtx: CanvasRenderingContext2D;
    shockwave: THREE.Mesh;
    steamRings: THREE.Mesh[];
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
    camera.position.set(-0.8, 3.8, 12.0);
    camera.lookAt(0.3, 0.1, 0);

    // 1. Cyber Coffee Countertop (Warm dark wood with neon trim)
    const tableGeo = new THREE.BoxGeometry(16, 0.6, 12);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x151b2b,
      metalness: 0.7,
      roughness: 0.35,
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, -1.8, 0);
    threeScene.add(table);

    // Counter neon edge line
    const grid = new THREE.GridHelper(14, 20, new THREE.Color(accent), 0x1b2842);
    grid.position.set(0, -1.48, 0);
    threeScene.add(grid);

    // 2. Realistic 3D Porcelain Coffee Cup with rising steam (Right side)
    const coffeeCupGroup = new THREE.Group();
    coffeeCupGroup.position.set(1.9, -1.0, 0.5);
    threeScene.add(coffeeCupGroup);

    // Porcelain cup body
    const cupMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.2,
      roughness: 0.15,
    });
    const cupBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.35, 0.85, 24),
      cupMat
    );
    cupBody.position.y = 0.42;
    coffeeCupGroup.add(cupBody);

    // Dark espresso surface inside cup
    const coffeeMat = new THREE.MeshStandardMaterial({
      color: 0x3b1d0c,
      roughness: 0.3,
    });
    const coffeeSurface = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.05, 24),
      coffeeMat
    );
    coffeeSurface.position.y = 0.78;
    coffeeCupGroup.add(coffeeSurface);

    // Cup handle
    const handleGeo = new THREE.TorusGeometry(0.2, 0.06, 12, 24, Math.PI);
    const cupHandle = new THREE.Mesh(handleGeo, cupMat);
    cupHandle.position.set(0.52, 0.42, 0);
    cupHandle.rotation.z = -Math.PI / 2;
    coffeeCupGroup.add(cupHandle);

    // Steam rings
    const steamMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.45,
    });
    const steamRings: THREE.Mesh[] = [];
    for (let s = 0; s < 3; s++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16 + s * 0.05, 0.02, 8, 20), steamMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 1.0 + s * 0.32;
      coffeeCupGroup.add(ring);
      steamRings.push(ring);
    }

    // 2b. Realistic 3D Artisan Shopping Bag with Shopkeeper Packing Motion (Left counter)
    const shoppingBagGroup = new THREE.Group();
    shoppingBagGroup.position.set(-2.4, -0.9, -0.4);
    threeScene.add(shoppingBagGroup);

    const bagGeo = new THREE.BoxGeometry(1.3, 1.6, 0.85);
    const bagMat = new THREE.MeshStandardMaterial({
      color: 0xb48a60,
      roughness: 0.85,
      metalness: 0.05,
    });
    const bagBody = new THREE.Mesh(bagGeo, bagMat);
    bagBody.position.y = 0.8;
    shoppingBagGroup.add(bagBody);

    const handleMat = new THREE.MeshStandardMaterial({ color: 0x8c6239, roughness: 0.9 });
    const handleL = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 8, 16, Math.PI), handleMat);
    handleL.position.set(0, 1.6, 0.18);
    shoppingBagGroup.add(handleL);

    const handleR = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 8, 16, Math.PI), handleMat);
    handleR.position.set(0, 1.6, -0.18);
    shoppingBagGroup.add(handleR);

    // Product item being packed (artisan coffee box)
    const itemGeo = new THREE.BoxGeometry(0.75, 1.0, 0.45);
    const itemMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.35,
      metalness: 0.3,
    });
    const groceryBox = new THREE.Mesh(itemGeo, itemMat);
    groceryBox.position.set(0, 2.2, 0);
    shoppingBagGroup.add(groceryBox);

    // Packed checkmark badge on bag
    const badgeGeo = new THREE.PlaneGeometry(0.65, 0.32);
    const badgeMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      transparent: true,
      opacity: 0,
    });
    const packedBadge = new THREE.Mesh(badgeGeo, badgeMat);
    packedBadge.position.set(0, 0.8, 0.44);
    shoppingBagGroup.add(packedBadge);

    // 3. Realistic 3D QR Standee on Counter (Center)
    const standeeGroup = new THREE.Group();
    standeeGroup.position.set(0.4, -0.6, -0.4);
    standeeGroup.rotation.y = -0.28;
    threeScene.add(standeeGroup);

    // Standee acrylic base
    const baseGeo = new THREE.BoxGeometry(2.4, 0.22, 1.4);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
    });
    const standeeBase = new THREE.Mesh(baseGeo, baseMat);
    standeeBase.position.y = -0.8;
    standeeGroup.add(standeeBase);

    // Standee upright backplate
    const plateGeo = new THREE.BoxGeometry(2.2, 2.7, 0.1);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.6,
      roughness: 0.25,
    });
    const standeePlate = new THREE.Mesh(plateGeo, plateMat);
    standeePlate.position.set(0, 0.5, -0.15);
    standeePlate.rotation.x = -0.16;
    standeeGroup.add(standeePlate);

    // Standee glowing frame border
    const plateEdgeGeo = new THREE.EdgesGeometry(plateGeo);
    const plateEdgeMat = new THREE.LineBasicMaterial({ color: 0x00f0ff });
    standeePlate.add(new THREE.LineSegments(plateEdgeGeo, plateEdgeMat));

    // Standee QR Code matrix modules
    const qrMatrixGroup = new THREE.Group();
    qrMatrixGroup.position.set(0, 0.45, -0.09);
    qrMatrixGroup.rotation.x = -0.16;
    standeeGroup.add(qrMatrixGroup);

    const qrSize = 9;
    const moduleGeo = new THREE.BoxGeometry(0.19, 0.19, 0.05);
    const darkModMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const brightModMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x006688,
      emissiveIntensity: 0.9,
    });

    for (let r = 0; r < qrSize; r++) {
      for (let c = 0; c < qrSize; c++) {
        const isCorner =
          (r < 3 && c < 3) ||
          (r < 3 && c >= qrSize - 3) ||
          (r >= qrSize - 3 && c < 3);
        const isCenter = r >= 4 && r <= 5 && c >= 4 && c <= 5;
        const isMod = isCorner || isCenter || ((r * 5 + c * 7) % 3 === 0);

        const modMesh = new THREE.Mesh(moduleGeo, isMod ? brightModMat : darkModMat);
        modMesh.position.set(
          (c - qrSize / 2 + 0.5) * 0.21,
          (qrSize / 2 - r - 0.5) * 0.21,
          0
        );
        qrMatrixGroup.add(modMesh);
      }
    }

    // "BHIM UPI" standee header badge
    const headerGeo = new THREE.BoxGeometry(1.8, 0.38, 0.06);
    const headerMat = new THREE.MeshBasicMaterial({ color: 0x58d6c2 });
    const headerMesh = new THREE.Mesh(headerGeo, headerMat);
    headerMesh.position.set(0, 1.5, 0.01);
    headerMesh.rotation.x = -0.16;
    standeeGroup.add(headerMesh);

    // 4. Realistic 3D Customer Smartphone (Left side aiming at standee)
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(-1.4, 0.5, 1.8);
    phoneGroup.rotation.set(0.3, 0.48, -0.1);
    threeScene.add(phoneGroup);

    // Phone body chassis
    const phoneBodyGeo = new THREE.BoxGeometry(2.0, 3.8, 0.16);
    const phoneBodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.15,
    });
    const phoneBody = new THREE.Mesh(phoneBodyGeo, phoneBodyMat);
    phoneGroup.add(phoneBody);

    const bodyEdges = new THREE.EdgesGeometry(phoneBodyGeo);
    const bodyEdgesMat = new THREE.LineBasicMaterial({ color: 0x58d6c2 });
    phoneBody.add(new THREE.LineSegments(bodyEdges, bodyEdgesMat));

    // Dynamic Canvas Screen Texture
    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = 512;
    screenCanvas.height = 1024;
    const screenCtx = screenCanvas.getContext("2d")!;
    const screenTexture = new THREE.CanvasTexture(screenCanvas);

    const screenGeo = new THREE.PlaneGeometry(1.85, 3.55);
    const screenMat = new THREE.MeshBasicMaterial({
      map: screenTexture,
      transparent: false,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = 0.09;
    phoneGroup.add(screenMesh);

    // 5. Laser Scanning Beam from Phone Camera to Standee QR Code
    const laserGeo = new THREE.PlaneGeometry(2.6, 0.06);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const laserPlane = new THREE.Mesh(laserGeo, laserMat);
    laserPlane.rotation.x = -Math.PI / 2 + 0.18;
    laserPlane.position.set(-0.2, 0.3, 1.0);
    threeScene.add(laserPlane);

    // 6. Expanding Green Payment Success Shockwave on Counter
    const shockwaveGeo = new THREE.RingGeometry(0.2, 0.35, 48);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x27c93f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const shockwave = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwave.rotation.x = -Math.PI / 2;
    shockwave.position.set(-1.4, -1.45, 1.8);
    threeScene.add(shockwave);

    // 7. Cinematic Lighting
    threeScene.add(new THREE.AmbientLight(0xffffff, 0.85));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(5, 8, 7);
    threeScene.add(keyLight);

    const rimLight = new THREE.PointLight(new THREE.Color(accent), 3.0, 25);
    rimLight.position.set(-5, 4, 4);
    threeScene.add(rimLight);

    const greenBloom = new THREE.PointLight(0x27c93f, 1.2, 12);
    greenBloom.position.set(-1.4, 1.5, 2.5);
    threeScene.add(greenBloom);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      phoneGroup,
      standeeGroup,
      coffeeCupGroup,
      shoppingBagGroup,
      groceryBox,
      packedBadge,
      laserPlane,
      screenTexture,
      screenCanvas,
      screenCtx,
      shockwave,
      steamRings,
    };

    return () => {
      renderer.dispose();
      tableGeo.dispose();
      baseGeo.dispose();
      plateGeo.dispose();
      phoneBodyGeo.dispose();
      screenGeo.dispose();
      laserGeo.dispose();
      shockwaveGeo.dispose();
    };
  }, [width, height, accent]);

  // Frame Render: Balanced Isometric Arc Camera
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Dynamic Choreographic Phase Detection from scene.events
    const totalFrames = scene.durationInFrames || 90;
    let raiseEndPct = 26;
    let scanEndPct = 65;
    let paymentSuccessPct = 68;
    let packingStartPct = 18;
    let packingEndPct = 58;

    if (scene.events && scene.events.length > 0) {
      for (const ev of scene.events) {
        if (ev.semantic_action === "raise_phone" || ev.semantic_action === "raise_or_hold") {
          raiseEndPct = ev.end_pct ?? 26;
        }
        if (ev.semantic_action === "scan_qr" || ev.semantic_action === "scan") {
          scanEndPct = ev.end_pct ?? 65;
        }
        if (ev.semantic_action === "pack_goods") {
          packingStartPct = ev.start_pct ?? 18;
          packingEndPct = ev.end_pct ?? 58;
        }
        if (
          ev.semantic_action === "auth" ||
          ev.semantic_action === "authorize_or_pay" ||
          ev.semantic_action === "success"
        ) {
          paymentSuccessPct = ev.start_pct ?? 68;
        }
      }
    }

    const raiseEndFrame = Math.max(1, Math.round(totalFrames * (raiseEndPct / 100)));
    const paymentSuccessFrame = Math.max(raiseEndFrame + 1, Math.round(totalFrames * (paymentSuccessPct / 100)));
    const packingStartFrame = Math.round(totalFrames * (packingStartPct / 100));
    const packingEndFrame = Math.max(packingStartFrame + 1, Math.round(totalFrames * (packingEndPct / 100)));

    // Motivated Camera Direction: Establishing Shot ➔ Medium Focus ➔ Device Close-Up
    const camT = interpolate(frame, [0, raiseEndFrame, paymentSuccessFrame], [0, 0.5, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    s.camera.position.x = interpolate(camT, [0, 0.5, 1], [-1.0, -0.6, -0.2]);
    s.camera.position.y = interpolate(camT, [0, 0.5, 1], [3.8, 3.2, 2.6]);
    s.camera.position.z = interpolate(camT, [0, 0.5, 1], [12.0, 10.8, 9.4]);
    s.camera.lookAt(
      interpolate(camT, [0, 0.5, 1], [0.3, 0.1, -0.1]),
      interpolate(camT, [0, 0.5, 1], [0.1, 0.25, 0.4]),
      interpolate(camT, [0, 0.5, 1], [0.0, 0.1, 0.2])
    );

    // 1. Phone Raising Action: Customer raises phone from waist level to aim at QR code
    const raiseT = interpolate(frame, [0, raiseEndFrame], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    s.phoneGroup.position.x = interpolate(raiseT, [0, 1], [-1.8, -1.4]);
    s.phoneGroup.position.y =
      interpolate(raiseT, [0, 1], [-0.7, 0.5]) + Math.sin(frame * 0.04) * 0.02;
    s.phoneGroup.position.z = interpolate(raiseT, [0, 1], [2.8, 1.8]);
    s.phoneGroup.rotation.x = interpolate(raiseT, [0, 1], [0.65, 0.3]);
    s.phoneGroup.rotation.y = interpolate(raiseT, [0, 1], [0.35, 0.48]);
    s.phoneGroup.rotation.z = interpolate(raiseT, [0, 1], [-0.15, -0.1]);

    // 2. Concurrent Shopkeeper Packing: Goods slide into bag and seal closes
    const packT = interpolate(frame, [packingStartFrame, packingEndFrame], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    s.groceryBox.position.y = interpolate(packT, [0, 1], [2.2, 0.75]);
    (s.packedBadge.material as THREE.MeshBasicMaterial).opacity = interpolate(
      frame,
      [packingEndFrame, packingEndFrame + 10],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    // Coffee steam animation
    s.steamRings.forEach((ring, idx) => {
      const ph = (frame * 0.03 + idx * 0.33) % 1.0;
      ring.position.y = 0.9 + ph * 0.7;
      ring.scale.setScalar(0.7 + ph * 0.8);
      (ring.material as THREE.MeshBasicMaterial).opacity = (1 - ph) * 0.45;
    });

    // 3. Laser scan animation during active scanning window
    const isScanning = frame >= Math.round(raiseEndFrame * 0.7) && frame < paymentSuccessFrame;
    s.laserPlane.visible = isScanning;
    if (isScanning) {
      const scanPhase = ((frame - raiseEndFrame) % 32) / 32;
      s.laserPlane.position.y = -0.1 + Math.sin(scanPhase * Math.PI) * 1.1;
      s.laserPlane.position.z = 0.6 + Math.cos(scanPhase * Math.PI) * 0.35;
      s.laserPlane.scale.x = 0.95 + Math.sin(frame * 0.25) * 0.12;
    }

    // 4. Payment Shockwave expansion on success
    if (frame >= paymentSuccessFrame) {
      const swT = interpolate(frame, [paymentSuccessFrame, paymentSuccessFrame + 35], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      s.shockwave.scale.setScalar(1.0 + swT * 8.0);
      (s.shockwave.material as THREE.MeshBasicMaterial).opacity = (1 - swT) * 0.7;
    }

    // Draw dynamic high-res phone screen canvas
    const ctx = s.screenCtx;
    const w = s.screenCanvas.width;
    const h = s.screenCanvas.height;

    const isPaid = frame >= paymentSuccessFrame;

    ctx.fillStyle = isPaid ? "#064e3b" : "#0B1020";
    ctx.fillRect(0, 0, w, h);

    // Phone status bar
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("9:41", 40, 50);
    ctx.fillText("5G  100%", w - 140, 50);

    // App Header
    ctx.fillStyle = accent;
    ctx.font = "bold 34px monospace";
    ctx.textAlign = "center";
    ctx.fillText("BHIM UPI 2.0", w / 2, 110);

    if (!isPaid) {
      // Reticle viewfinder for scanning QR
      ctx.strokeStyle = accent;
      ctx.lineWidth = 6;
      ctx.strokeRect(80, 200, 352, 352);

      const laserY = 200 + ((frame * 6) % 352);
      ctx.strokeStyle = "#58D6C2";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(85, laserY);
      ctx.lineTo(427, laserY);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText("ALIGN QR CODE IN FRAME", w / 2, 600);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "24px sans-serif";
      ctx.fillText("Coffee House  •  ₹100.00", w / 2, 650);
    } else {
      // Payment Successful Checkmark screen
      const checkPop = spring({
        frame: Math.max(0, frame - 65),
        fps,
        config: { damping: 10, stiffness: 180 },
      });

      // Glowing green circle
      ctx.fillStyle = "#27C93F";
      ctx.beginPath();
      ctx.arc(w / 2, 320, 90 * checkPop, 0, Math.PI * 2);
      ctx.fill();

      // White checkmark
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 14;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(w / 2 - 40, 320);
      ctx.lineTo(w / 2 - 10, 350);
      ctx.lineTo(w / 2 + 45, 290);
      ctx.stroke();

      ctx.fillStyle = "#27C93F";
      ctx.font = "900 40px sans-serif";
      ctx.fillText("PAID SUCCESSFULLY", w / 2, 480);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 68px sans-serif";
      ctx.fillText("₹100.00", w / 2, 570);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "30px sans-serif";
      ctx.fillText("TO: Blue Bean Coffee Ltd.", w / 2, 630);

      // Settlement badge
      ctx.fillStyle = "rgba(88, 214, 194, 0.15)";
      ctx.strokeStyle = "#58D6C2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(80, 680, 352, 60, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#58D6C2";
      ctx.font = "bold 24px monospace";
      ctx.fillText("SETTLEMENT: 1.8 SECONDS", w / 2, 718);
    }

    s.screenTexture.needsUpdate = true;
    s.renderer.render(s.scene, s.camera);
  }, [frame, fps, accent]);

  const hudOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1020" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />

      {/* Cinematic HUD: Strictly Top and Bottom - Center is 100% Unobstructed! */}
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
                background: "rgba(0, 240, 255, 0.14)",
                padding: "8px 22px",
                borderRadius: 8,
                border: `1.5px solid ${accent}60`,
                boxShadow: `0 0 20px ${accent}30`,
              }}
            >
              {resolveSceneTag(scene, "01 / THE 2-SECOND MIRACLE")}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "#27C93F",
                letterSpacing: 2,
                background: "rgba(39, 201, 63, 0.12)",
                padding: "8px 20px",
                borderRadius: 8,
                border: "1.5px solid rgba(39, 201, 63, 0.4)",
              }}
            >
              REALTIME CLEARING
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
              {scene.text || "How UPI Works in 2 Seconds"}
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
              SCAN ➔ VALIDATE ➔ SETTLE IN 1.8s
            </div>
          </div>
        </div>

        {/* Lower Telemetry Pill - Anchored above captions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            background: "rgba(15, 23, 42, 0.9)",
            backdropFilter: "blur(20px)",
            padding: "18px 28px",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.12)",
            marginBottom: 90,
          }}
        >
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 28, color: "#94a3b8" }}>SCENARIO</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#FFFFFF" }}>Merchant QR Scan</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "monospace", fontSize: 28, color: "#94a3b8" }}>TRANSACTION</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: accent }}>₹100.00 Dispatched</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
