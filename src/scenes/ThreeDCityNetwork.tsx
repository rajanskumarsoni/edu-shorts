import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDCityNetwork: React.FC<{
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
    nodes: THREE.Group[];
    pulses: THREE.Mesh[];
    curves: THREE.CatmullRomCurve3[];
    badgeTextures: THREE.CanvasTexture[];
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
    camera.position.set(0, 9.5, 12.0);
    camera.lookAt(0, 0.4, -0.2);

    const group = new THREE.Group();
    threeScene.add(group);

    // Floor Neon Coordinate Grid
    const grid = new THREE.GridHelper(16, 28, new THREE.Color(accent), 0x16233b);
    grid.position.y = -0.4;
    group.add(grid);

    // Coordinate positions for the 5 entities (Optimized for 9:16 vertical view)
    const nodeCoords = [
      new THREE.Vector3(-1.9, 0, 1.8),   // 0: Customer Phone
      new THREE.Vector3(-1.1, 0, -0.1),  // 1: Payment App Gateway
      new THREE.Vector3(0.0, 0, -2.4),   // 2: NPCI Central Switch Spire
      new THREE.Vector3(1.1, 0, -0.1),   // 3: Bank A (Debit / CBS)
      new THREE.Vector3(1.9, 0, 1.8),    // 4: Bank B (Credit / Merchant)
    ];

    const nodes: THREE.Group[] = [];
    const badgeTextures: THREE.CanvasTexture[] = [];

    // Helper: Create 3D Floating Holographic Label Badge
    const createFloatingBadge = (title: string, sub: string, color: string) => {
      const bCanvas = document.createElement("canvas");
      bCanvas.width = 384;
      bCanvas.height = 140;
      const bCtx = bCanvas.getContext("2d")!;

      bCtx.fillStyle = "rgba(11, 16, 32, 0.9)";
      bCtx.strokeStyle = color;
      bCtx.lineWidth = 4;
      bCtx.beginPath();
      bCtx.roundRect(8, 8, 368, 124, 18);
      bCtx.fill();
      bCtx.stroke();

      bCtx.fillStyle = color;
      bCtx.font = "bold 32px monospace";
      bCtx.textAlign = "center";
      bCtx.fillText(title, 192, 54);

      bCtx.fillStyle = "#ffffff";
      bCtx.font = "bold 28px sans-serif";
      bCtx.fillText(sub, 192, 102);

      const bTex = new THREE.CanvasTexture(bCanvas);
      badgeTextures.push(bTex);

      const bMat = new THREE.MeshBasicMaterial({
        map: bTex,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const bMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.6), bMat);
      return bMesh;
    };

    // 1. Node 0: Realistic 3D Customer Smartphone
    const phoneGroup = new THREE.Group();
    phoneGroup.position.copy(nodeCoords[0]);

    // Pedestal
    const pedGeo = new THREE.CylinderGeometry(0.8, 0.9, 0.3, 24);
    const pedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    phoneGroup.add(new THREE.Mesh(pedGeo, pedMat));

    // Phone body
    const pBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.95, roughness: 0.15 });
    const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.1), pBodyMat);
    pBody.position.y = 0.95;
    pBody.rotation.y = 0.35;
    phoneGroup.add(pBody);

    const pScreenMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8,
    });
    const pScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.35), pScreenMat);
    pScreen.position.set(0, 0.95, 0.06);
    pScreen.rotation.y = 0.35;
    phoneGroup.add(pScreen);

    // Badge
    const badge0 = createFloatingBadge("01 / PAYER", "User Smartphone", "#00F0FF");
    badge0.position.set(0, 2.2, 0);
    phoneGroup.add(badge0);

    group.add(phoneGroup);
    nodes.push(phoneGroup);

    // 2. Node 1: 3D Payment App Gateway Kiosk
    const appGroup = new THREE.Group();
    appGroup.position.copy(nodeCoords[1]);

    const appBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.4, 6), pedMat);
    appGroup.add(appBase);

    // Hexagonal kiosk tower
    const kioskMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x003344,
      emissiveIntensity: 0.4,
    });
    const kiosk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.4, 6), kioskMat);
    kiosk.position.y = 0.85;
    appGroup.add(kiosk);

    // Floating app logo diamond
    const appLogoMat = new THREE.MeshStandardMaterial({
      color: 0x58d6c2,
      emissive: 0x58d6c2,
      emissiveIntensity: 0.8,
    });
    const appLogo = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), appLogoMat);
    appLogo.position.y = 1.85;
    appGroup.add(appLogo);

    const badge1 = createFloatingBadge("02 / APP", "Payment Gateway", "#58D6C2");
    badge1.position.set(0, 2.6, 0);
    appGroup.add(badge1);

    group.add(appGroup);
    nodes.push(appGroup);

    // 3. Node 2: NPCI Central Telecommunications Spire
    const npciGroup = new THREE.Group();
    npciGroup.position.set(0.0, 0, -2.4);

    // Heavy tiered plinth
    const spireBase = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 0.5, 32), pedMat);
    npciGroup.add(spireBase);

    // Tower lower body
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x002233,
      emissiveIntensity: 0.5,
    });
    const towerBody = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.85, 2.2, 8), towerMat);
    towerBody.position.y = 1.2;
    npciGroup.add(towerBody);

    // Mid antenna deck with glowing rings
    const deckRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.75, 0.08, 16, 32),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    deckRing.rotation.x = Math.PI / 2;
    deckRing.position.y = 2.0;
    npciGroup.add(deckRing);

    // Needle spire
    const needle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.22, 2.0, 16),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95 })
    );
    needle.position.y = 3.0;
    npciGroup.add(needle);

    // Top pulsing switch beacon
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.2,
    });
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), beaconMat);
    beacon.position.y = 4.0;
    npciGroup.add(beacon);

    const badge2 = createFloatingBadge("03 / NPCI SWITCH", "National Core Router", "#00F0FF");
    badge2.position.set(0, 4.3, 0);
    npciGroup.add(badge2);

    group.add(npciGroup);
    nodes.push(npciGroup);

    // Helper: Build Neoclassical Bank Building
    const createBankBuilding = (name: string, sub: string, colorHex: number, colorStr: string) => {
      const bank = new THREE.Group();
      const colMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        metalness: 0.75,
        roughness: 0.25,
        emissive: colorHex,
        emissiveIntensity: 0.35,
      });

      // Bank Plinth
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.28, 1.3), pedMat);
      plinth.position.y = 0.14;
      bank.add(plinth);

      // 4 Pillars
      [-0.55, -0.18, 0.18, 0.55].forEach((px) => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.2, 16), colMat);
        pillar.position.set(px, 0.85, 0.42);
        bank.add(pillar);
      });

      // Vault Core Body
      const core = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.2, 0.85), pedMat);
      core.position.set(0, 0.85, -0.12);
      bank.add(core);

      // Pediment Roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.65, 4), colMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.set(0, 1.75, 0);
      bank.add(roof);

      const badge = createFloatingBadge(name, sub, colorStr);
      badge.position.set(0, 2.6, 0);
      bank.add(badge);

      return bank;
    };

    // 4. Node 3: Bank A (Customer Remitter Bank / Debit CBS)
    const bankA = createBankBuilding("04 / BANK A", "Remitter CBS Vault", 0x58D6C2, "#58D6C2");
    bankA.position.copy(nodeCoords[3]);
    group.add(bankA);
    nodes.push(bankA);

    // 5. Node 4: Bank B (Merchant Beneficiary Bank / Credit CBS)
    const bankB = createBankBuilding("05 / BANK B", "Merchant CBS Vault", 0xFFC857, "#FFC857");
    bankB.position.copy(nodeCoords[4]);
    group.add(bankB);
    nodes.push(bankB);

    // 6. Glowing Energy Spline Pathways connecting 0 ➔ 1 ➔ 2 ➔ 3 ➔ 4
    const pathPairs = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ];

    const curves: THREE.CatmullRomCurve3[] = [];
    const pulses: THREE.Mesh[] = [];

    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.55,
    });
    const pulseMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.5,
    });

    pathPairs.forEach(([fromIdx, toIdx]) => {
      const p1 = nodeCoords[fromIdx].clone().add(new THREE.Vector3(0, 0.6, 0));
      const p2 = nodeCoords[toIdx].clone().add(new THREE.Vector3(0, 0.6, 0));
      const mid = p1.clone().lerp(p2, 0.5).add(new THREE.Vector3(0, 0.7, 0));

      const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
      curves.push(curve);

      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.04, 8, false);
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      group.add(tube);

      const pulseMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), pulseMat);
      group.add(pulseMesh);
      pulses.push(pulseMesh);
    });

    // Lights
    threeScene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const mainDir = new THREE.DirectionalLight(0xffffff, 1.8);
    mainDir.position.set(6, 12, 10);
    threeScene.add(mainDir);

    const npciPoint = new THREE.PointLight(0x00f0ff, 3.5, 20);
    npciPoint.position.set(0, 5, -1.8);
    threeScene.add(npciPoint);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      group,
      nodes,
      pulses,
      curves,
      badgeTextures,
    };

    return () => {
      renderer.dispose();
      pedGeo.dispose();
      pedMat.dispose();
      tubeMat.dispose();
      pulseMat.dispose();
    };
  }, [width, height, accent]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Orbiting 3D camera pan around the 5 participants
    const camAngle = 0.2 + (frame / 240) * 0.4;
    const camRadius = 12.5;
    s.camera.position.x = Math.sin(camAngle) * camRadius * 0.4;
    s.camera.position.z = Math.cos(camAngle) * camRadius;
    s.camera.position.y = 9.2 + Math.sin(frame * 0.03) * 0.3;
    s.camera.lookAt(0, 0.5, 0);

    // Make all floating badges face camera
    s.nodes.forEach((node) => {
      node.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.PlaneGeometry) {
          child.lookAt(s.camera.position);
        }
      });
    });

    // Animate traveling pulse packets along energy conduits
    const speed = 0.015;
    s.pulses.forEach((pulse, idx) => {
      const curve = s.curves[idx];
      const t = (frame * speed + idx * 0.25) % 1.0;
      const pt = curve.getPointAt(t);
      pulse.position.copy(pt);
      pulse.scale.setScalar(0.9 + Math.sin(frame * 0.2) * 0.2);
    });

    // Central NPCI Spire beacon rotation
    if (s.nodes[2]) {
      s.nodes[2].rotation.y = frame * 0.01;
    }

    s.renderer.render(s.scene, s.camera);
  }, [frame]);

  const hudOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1020" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />

      {/* Cinematic HUD: Stacked at top and bottom - Center is 100% open for the 5 buildings! */}
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
              {resolveSceneTag(scene, "03 / THE 5 PARTICIPANTS")}
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
              NETWORK TOPOLOGY
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
              {scene.title || "The 5 Key Participants"}
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
              1. USER ➔ 2. APP ➔ 3. NPCI ➔ 4. BANK A ➔ 5. BANK B
            </div>
          </div>
        </div>

        {/* Lower 3 Telemetry Highlights */}
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
            <div style={{ fontFamily: "monospace", fontSize: 26, color: "#94a3b8" }}>Payer Device</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>Initiates Intent</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: accent }}>NPCI Switch</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>Realtime Router</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: "#58D6C2" }}>Core Banking</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>Atomic Ledgers</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
