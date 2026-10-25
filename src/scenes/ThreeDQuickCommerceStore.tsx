import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDQuickCommerceStore: React.FC<{
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
    storeGroup: THREE.Group;
    laserBeam: THREE.Mesh;
    laserLight: THREE.PointLight;
    ledMeshes: THREE.Mesh[];
    badgeTextures: THREE.CanvasTexture[];
    scooterGroup: THREE.Group;
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
    threeScene.fog = new THREE.FogExp2(0x0a0f1d, 0.045);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 4.2, 9.8);
    camera.lookAt(0, 1.2, -0.5);

    const storeGroup = new THREE.Group();
    threeScene.add(storeGroup);

    // 1. Epoxy Floor with Neon Grid
    const floorGeo = new THREE.BoxGeometry(18, 0.3, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0d1322,
      metalness: 0.85,
      roughness: 0.25,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.15, 0);
    threeScene.add(floor);

    const grid = new THREE.GridHelper(20, 24, new THREE.Color(accent), 0x18243b);
    grid.position.set(0, 0.01, 0);
    threeScene.add(grid);

    // 2. Shelf Materials
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x223048,
      metalness: 0.9,
      roughness: 0.2,
    });
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.4,
      metalness: 0.5,
      roughness: 0.3,
    });
    const goldenMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.7,
      metalness: 0.6,
      roughness: 0.2,
    });

    const binColors = [0x00f0ff, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xef4444];
    const ledMeshes: THREE.Mesh[] = [];

    // Helper: Create a Multi-Tier Pallet Rack
    const createRack = (x: number, z: number, isGolden: boolean = false) => {
      const rack = new THREE.Group();
      rack.position.set(x, 0, z);

      // Upright vertical pillars (4 posts)
      const postGeo = new THREE.BoxGeometry(0.12, 4.6, 0.12);
      const postOffsets = [
        { px: -1.2, pz: -0.6 },
        { px: 1.2, pz: -0.6 },
        { px: -1.2, pz: 0.6 },
        { px: 1.2, pz: 0.6 },
      ];
      postOffsets.forEach(({ px, pz }) => {
        const p = new THREE.Mesh(postGeo, steelMat);
        p.position.set(px, 2.3, pz);
        rack.add(p);
      });

      // 4 Horizontal shelf levels
      const shelfLevels = [0.6, 1.8, 3.0, 4.2];
      shelfLevels.forEach((levelY, sIdx) => {
        const shelfBeam = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 0.08, 1.3),
          isGolden && sIdx <= 1 ? goldenMat : beamMat
        );
        shelfBeam.position.set(0, levelY, 0);
        rack.add(shelfBeam);

        // Place 3 bins per shelf level
        for (let b = -1; b <= 1; b++) {
          const bColor = isGolden ? 0xffaa00 : binColors[(Math.abs(b) + sIdx) % binColors.length];
          const binMat = new THREE.MeshStandardMaterial({
            color: bColor,
            metalness: 0.4,
            roughness: 0.5,
          });
          const bin = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.95), binMat);
          bin.position.set(b * 0.78, levelY + 0.26, 0);
          rack.add(bin);

          // LED indicator light on front of each bin
          const ledMat = new THREE.MeshBasicMaterial({ color: bColor });
          const led = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), ledMat);
          led.position.set(b * 0.78, levelY + 0.48, 0.5);
          rack.add(led);
          ledMeshes.push(led);
        }
      });

      return rack;
    };

    // Add Racks Flanking Left and Right (creating a central picking aisle)
    // Left Racks:
    storeGroup.add(createRack(-2.4, 1.2, true));   // Front Left: Golden Zone (High Velocity)
    storeGroup.add(createRack(-2.4, -2.4, false)); // Back Left: Medium Velocity

    // Right Racks:
    storeGroup.add(createRack(2.4, 1.2, false));   // Front Right
    storeGroup.add(createRack(2.4, -2.4, false));  // Back Right

    // 3. Front Packing & Dispatch Counter (Station 01)
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x162238,
      metalness: 0.8,
      roughness: 0.2,
    });
    const packingTable = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 1.2), tableMat);
    packingTable.position.set(0, 0.45, 3.4);
    storeGroup.add(packingTable);

    // Terminal Monitor on Table
    const monitorMat = new THREE.MeshStandardMaterial({ color: 0x050811, roughness: 0.1 });
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.06), monitorMat);
    monitor.position.set(-0.6, 1.2, 3.3);
    storeGroup.add(monitor);

    // Glowing screen face
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const screenFace = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.44), screenMat);
    screenFace.position.set(-0.6, 1.2, 3.34);
    storeGroup.add(screenFace);

    // Grocery Delivery Bags waiting on counter
    const bagMat = new THREE.MeshStandardMaterial({
      color: 0xb47942, // Kraft paper brown
      roughness: 0.8,
    });
    [-0.1, 0.4, 0.85].forEach((bx, idx) => {
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.28), bagMat);
      bag.position.set(bx, 0.9 + 0.27, 3.35);
      storeGroup.add(bag);

      // Green sealed sticker
      const sticker = new THREE.Mesh(
        new THREE.PlaneGeometry(0.16, 0.1),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      sticker.position.set(bx, 1.15, 3.5);
      storeGroup.add(sticker);
    });

    // 4. Electric Delivery Scooter at Dispatch Bay
    const scooterGroup = new THREE.Group();
    scooterGroup.position.set(1.8, 0, 4.8);
    scooterGroup.rotation.y = -Math.PI * 0.35;
    storeGroup.add(scooterGroup);

    // Scooter Wheels
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 16), tireMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.24, 0.65);
    scooterGroup.add(frontWheel);

    const backWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 16), tireMat);
    backWheel.rotation.z = Math.PI / 2;
    backWheel.position.set(0, 0.24, -0.65);
    scooterGroup.add(backWheel);

    // Scooter Body Deck
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.8,
      roughness: 0.2,
    });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 1.1), bodyMat);
    deck.position.set(0, 0.26, 0);
    scooterGroup.add(deck);

    // Steering Column & Handlebars
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 12), steelMat);
    column.position.set(0, 0.68, 0.55);
    column.rotation.x = -0.15;
    scooterGroup.add(column);

    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.05, 0.05), steelMat);
    bar.position.set(0, 1.05, 0.48);
    scooterGroup.add(bar);

    // Headlight (Glowing Cyan)
    const headlight = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    headlight.position.set(0, 0.92, 0.62);
    scooterGroup.add(headlight);

    // Thermal Delivery Box on rear rack
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Red / Dark Store thermal bag
      metalness: 0.2,
      roughness: 0.7,
    });
    const deliveryBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), boxMat);
    deliveryBox.position.set(0, 0.62, -0.5);
    scooterGroup.add(deliveryBox);

    // 5. Animated Laser Barcode Scanner Beam
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const laserGeo = new THREE.CylinderGeometry(0.015, 0.45, 4.2, 16, 1, true);
    const laserBeam = new THREE.Mesh(laserGeo, laserMat);
    laserBeam.position.set(-1.2, 2.0, 1.2);
    laserBeam.rotation.z = Math.PI * 0.4;
    storeGroup.add(laserBeam);

    const laserLight = new THREE.PointLight(0xff0055, 2.5, 4);
    laserLight.position.set(-1.8, 1.8, 1.2);
    storeGroup.add(laserLight);

    // 6. Floating 3D Holographic Badges
    const badgeTextures: THREE.CanvasTexture[] = [];
    const createFloatingBadge = (title: string, sub: string, color: string) => {
      const bCanvas = document.createElement("canvas");
      bCanvas.width = 420;
      bCanvas.height = 160;
      const bCtx = bCanvas.getContext("2d")!;

      bCtx.fillStyle = "rgba(10, 15, 29, 0.92)";
      bCtx.strokeStyle = color;
      bCtx.lineWidth = 5;
      bCtx.beginPath();
      bCtx.roundRect(8, 8, 404, 144, 20);
      bCtx.fill();
      bCtx.stroke();

      bCtx.fillStyle = color;
      bCtx.font = "bold 30px monospace";
      bCtx.textAlign = "center";
      bCtx.fillText(title, 210, 58);

      bCtx.fillStyle = "#ffffff";
      bCtx.font = "bold 26px sans-serif";
      bCtx.fillText(sub, 210, 114);

      const bTex = new THREE.CanvasTexture(bCanvas);
      badgeTextures.push(bTex);

      const bMat = new THREE.MeshBasicMaterial({
        map: bTex,
        transparent: true,
        side: THREE.DoubleSide,
      });
      return new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.7), bMat);
    };

    // Badge 1: Golden Zone (Left)
    const bGolden = createFloatingBadge("GOLDEN ZONE", "TOP 20% SKUs · 10s PICK", "#FFAA00");
    bGolden.position.set(-2.4, 4.2, 1.2);
    storeGroup.add(bGolden);

    // Badge 2: Dispatch Dock (Front)
    const bDispatch = createFloatingBadge("MICRO-WAREHOUSE", "3,500 SKUs · 1.8km RADIUS", "#00F0FF");
    bDispatch.position.set(0, 3.2, 3.4);
    storeGroup.add(bDispatch);

    // 7. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    threeScene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(4, 10, 6);
    threeScene.add(dirLight);

    const cyanSpot = new THREE.SpotLight(0x00f0ff, 3.0, 14, Math.PI * 0.35, 0.4);
    cyanSpot.position.set(-2.0, 6, 2);
    threeScene.add(cyanSpot);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      storeGroup,
      laserBeam,
      laserLight,
      ledMeshes,
      badgeTextures,
      scooterGroup,
    };

    return () => {
      renderer.dispose();
      badgeTextures.forEach((t) => t.dispose());
    };
  }, [width, height, accent]);

  // Per-Frame Animation Logic
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Smooth Orbit & Pan Camera Movement
    const camAngle = frame * 0.008;
    const camHeight = interpolate(frame, [0, 180], [4.6, 3.4]);
    s.camera.position.x = Math.sin(camAngle) * 4.2;
    s.camera.position.z = Math.cos(camAngle) * 8.6;
    s.camera.position.y = camHeight;
    s.camera.lookAt(0, 1.4, 0.8);

    // Laser Scanner sweep motion
    const laserPhase = (frame * 0.08) % (Math.PI * 2);
    s.laserBeam.position.y = 1.4 + Math.sin(laserPhase) * 1.0;
    s.laserBeam.rotation.x = Math.sin(laserPhase * 0.5) * 0.2;
    s.laserLight.position.y = s.laserBeam.position.y;
    s.laserLight.intensity = 2.0 + Math.sin(frame * 0.3) * 0.8;

    // LED blinking simulation (item status checks)
    s.ledMeshes.forEach((led, idx) => {
      const isBlink = ((frame + idx * 7) % 24) < 12;
      (led.material as THREE.MeshBasicMaterial).color.setHex(isBlink ? 0x00f0ff : 0x10b981);
    });

    s.renderer.render(s.scene, s.camera);
  }, [frame]);

  const tag = resolveSceneTag(scene, "03 / THE DARK STORE ENGINE");
  const title = scene.title || "INSIDE THE 10-MINUTE MICRO-WAREHOUSE";

  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 30%, #0e172e 0%, #080d1a 100%)",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />

      {/* Editorial Header Overlay */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 48,
          right: 48,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 18px",
            borderRadius: 999,
            background: "rgba(10, 15, 29, 0.85)",
            border: `1px solid ${accent}88`,
            backdropFilter: "blur(12px)",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: accent,
              boxShadow: `0 0 10px ${accent}`,
            }}
          />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 28,
              fontWeight: 800,
              color: accent,
              letterSpacing: 2,
            }}
          >
            {tag}
          </span>
        </div>

        <h1
          style={{
            fontFamily: "sans-serif",
            fontSize: 56,
            fontWeight: 900,
            color: "#ffffff",
            textTransform: "uppercase",
            lineHeight: 1.15,
            letterSpacing: -0.5,
            textShadow: "0 4px 20px rgba(0,0,0,0.8)",
            margin: 0,
          }}
        >
          {title}
        </h1>
      </div>

      {/* Telemetry Footer Pill (Positioned above bottom 350px caption safe zone) */}
      <div
        style={{
          position: "absolute",
          bottom: 380,
          left: 48,
          right: 48,
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(10, 15, 29, 0.92)",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          borderRadius: 24,
          padding: "20px 28px",
          backdropFilter: "blur(18px)",
          boxShadow: "0 20px 45px rgba(0,0,0,0.7)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", fontFamily: "monospace", fontWeight: 700 }}>
            {scene.metrics ? Object.keys(scene.metrics)[0]?.toUpperCase() : "STORAGE MODEL"}
          </span>
          <span style={{ fontSize: 26, fontWeight: 900, color: "#FFAA00", fontFamily: "sans-serif" }}>
            {scene.metrics ? Object.values(scene.metrics)[0] : "HIGH-DENSITY MFC"}
          </span>
        </div>

        <div style={{ width: 1, height: 42, background: "rgba(255,255,255,0.2)" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", fontFamily: "monospace", fontWeight: 700 }}>
            {scene.metrics && Object.keys(scene.metrics)[1] ? Object.keys(scene.metrics)[1]?.toUpperCase() : "FULFILLMENT"}
          </span>
          <span style={{ fontSize: 26, fontWeight: 900, color: "#00F0FF", fontFamily: "sans-serif" }}>
            {scene.metrics && Object.values(scene.metrics)[1] ? Object.values(scene.metrics)[1] : "AUTOMATED 3D"}
          </span>
        </div>

        <div style={{ width: 1, height: 42, background: "rgba(255,255,255,0.2)" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", fontFamily: "monospace", fontWeight: 700 }}>
            DISPATCH TARGET
          </span>
          <span style={{ fontSize: 26, fontWeight: 900, color: "#10B981", fontFamily: "sans-serif" }}>
            &lt; 24 HOURS
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
