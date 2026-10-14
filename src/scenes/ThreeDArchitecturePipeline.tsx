import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDArchitecturePipeline: React.FC<{
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
    pedestals: THREE.Group[];
    packet: THREE.Mesh;
    pulseLight: THREE.PointLight;
    curvePoints: THREE.Vector3[];
    curve: THREE.CatmullRomCurve3;
    beaconRings: THREE.Mesh[];
    nodeCanvasTextures: THREE.CanvasTexture[];
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
    threeScene.fog = new THREE.FogExp2(0x0b1020, 0.045);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 9.5);
    camera.lookAt(0, 0, 0);

    // Coordinate floor grid
    const grid = new THREE.GridHelper(18, 24, new THREE.Color(accent), 0x1b2842);
    grid.position.y = -2.6;
    threeScene.add(grid);

    // Ambient and rim lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    threeScene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 10, 6);
    threeScene.add(keyLight);

    const cyanRim = new THREE.PointLight(0x00f0ff, 3.5, 20);
    cyanRim.position.set(-5, 4, 3);
    threeScene.add(cyanRim);

    // Define 5 Node Positions in 3D vertical composition space (cascading serpentine layout)
    const nodeCoords: [number, number, number][] = [
      [-1.25, 1.3, 0.8],   // 1: Payer App (mid-upper left)
      [1.25, 0.55, 0.2],    // 2: NPCI Switch (mid-upper right)
      [-1.25, -0.25, -0.4], // 3: Bank A Debit (mid-lower left)
      [1.25, -1.05, -0.8],  // 4: Bank B Credit (mid-lower right)
      [0.0, -1.85, -0.2],  // 5: Status Broadcast (center bottom)
    ];

    const nodesData = [
      { name: "Payer App", sub: "01 / INTENT SIGNED", color: "#00F0FF" },
      { name: "NPCI Switch", sub: "02 / ROUTE & AUTH", color: "#FFC857" },
      { name: "Bank A (Debit)", sub: "03 / ₹100 DEBITED", color: "#00F0FF" },
      { name: "Bank B (Credit)", sub: "04 / ₹100 CREDITED", color: "#27C93F" },
      { name: "Payment Status", sub: "05 / SUCCESS BROADCAST", color: "#27C93F" },
    ];

    const pedestals: THREE.Group[] = [];
    const nodeCanvasTextures: THREE.CanvasTexture[] = [];

    // Helper: Canvas texture generator for high-res crisp node titles
    const makeNodeBadge = (title: string, sub: string, color: string) => {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 160;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "rgba(11, 16, 32, 0.92)";
      ctx.roundRect(10, 10, 492, 140, 24);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.roundRect(10, 10, 492, 140, 24);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.fillText(sub, 256, 62);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "900 46px sans-serif";
      ctx.fillText(title, 256, 120);

      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    };

    nodeCoords.forEach((pos, idx) => {
      const grp = new THREE.Group();
      grp.position.set(pos[0], pos[1], pos[2]);

      const data = nodesData[idx];
      const col = new THREE.Color(data.color);

      // Base Pedestal Cylinder
      const pedMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.25,
      });
      const pedMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.25, 32), pedMat);
      grp.add(pedMesh);

      // Neon Trim Ring
      const ringMat = new THREE.MeshBasicMaterial({ color: col });
      const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.03, 12, 32), ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 0.12;
      grp.add(ringMesh);

      // Physical Object atop each pedestal:
      if (idx === 0) {
        // Node 1: Smartphone with screen
        const phone = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.95, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.15 })
        );
        phone.add(body);
        const scr = new THREE.Mesh(
          new THREE.PlaneGeometry(0.48, 0.82),
          new THREE.MeshBasicMaterial({ color: 0x00f0ff })
        );
        scr.position.z = 0.045;
        phone.add(scr);
        phone.position.y = 0.65;
        grp.add(phone);
      } else if (idx === 1) {
        // Node 2: Crystalline NPCI Octahedron Core
        const coreMat = new THREE.MeshStandardMaterial({
          color: 0xffc857,
          emissive: 0xffaa00,
          emissiveIntensity: 0.6,
          metalness: 0.9,
          roughness: 0.1,
        });
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), coreMat);
        core.position.y = 0.65;
        grp.add(core);

        const orbRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.6, 0.02, 8, 32),
          new THREE.MeshBasicMaterial({ color: 0xffc857 })
        );
        orbRing.position.y = 0.65;
        orbRing.rotation.x = Math.PI / 3;
        grp.add(orbRing);
      } else if (idx === 2) {
        // Node 3: Bank A Neoclassical Building (Debit)
        const bank = new THREE.Group();
        const bankMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
        const colMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const bankBody = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.5), bankMat);
        bank.add(bankBody);
        [-0.22, 0, 0.22].forEach((cx) => {
          const cPill = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 12), colMat);
          cPill.position.set(cx, 0, 0.26);
          bank.add(cPill);
        });
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.3, 4), colMat);
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 0.42;
        bank.add(roof);
        bank.position.y = 0.45;
        grp.add(bank);
      } else if (idx === 3) {
        // Node 4: Bank B Neoclassical Building (Credit)
        const bank = new THREE.Group();
        const bankMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
        const colMat = new THREE.MeshBasicMaterial({ color: 0x27c93f });
        const bankBody = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.55, 0.5), bankMat);
        bank.add(bankBody);
        [-0.22, 0, 0.22].forEach((cx) => {
          const cPill = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 12), colMat);
          cPill.position.set(cx, 0, 0.26);
          bank.add(cPill);
        });
        const roof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.3, 4), colMat);
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 0.42;
        bank.add(roof);
        bank.position.y = 0.45;
        grp.add(bank);
      } else {
        // Node 5: Broadcast Beacon Antenna with glowing checkmark
        const ant = new THREE.Group();
        const mast = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.08, 0.8, 16),
          new THREE.MeshStandardMaterial({ color: 0x27c93f, metalness: 0.9 })
        );
        mast.position.y = 0.4;
        ant.add(mast);
        const ball = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0x27c93f })
        );
        ball.position.y = 0.85;
        ant.add(ball);
        ant.position.y = 0.2;
        grp.add(ant);
      }

      // 3D Canvas Label Badge above node
      const tex = makeNodeBadge(data.name, data.sub, data.color);
      nodeCanvasTextures.push(tex);
      const badgeMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const badge = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.47), badgeMat);
      badge.position.set(0, 1.45, 0);
      grp.add(badge);

      threeScene.add(grp);
      pedestals.push(grp);
    });

    // Spline Connecting Conduit Tube across all 5 nodes
    const curvePoints = nodeCoords.map((c) => new THREE.Vector3(c[0], c[1] + 0.3, c[2]));
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.045, 12, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x005577,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    threeScene.add(tube);

    // Glowing Traveling Data Packet
    const packetGeo = new THREE.SphereGeometry(0.18, 20, 20);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const packet = new THREE.Mesh(packetGeo, packetMat);
    threeScene.add(packet);

    const pulseLight = new THREE.PointLight(0x00f0ff, 4.0, 6);
    threeScene.add(pulseLight);

    // Expanding beacon rings on Node 5
    const beaconRings: THREE.Mesh[] = [];
    for (let r = 0; r < 3; r++) {
      const bRing = new THREE.Mesh(
        new THREE.RingGeometry(0.2, 0.26, 32),
        new THREE.MeshBasicMaterial({ color: 0x27c93f, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
      );
      bRing.position.set(nodeCoords[4][0], nodeCoords[4][1] + 1.05, nodeCoords[4][2]);
      bRing.rotation.x = Math.PI / 2;
      threeScene.add(bRing);
      beaconRings.push(bRing);
    }

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      pedestals,
      packet,
      pulseLight,
      curvePoints,
      curve,
      beaconRings,
      nodeCanvasTextures,
    };

    return () => {
      renderer.dispose();
    };
  }, [width, height, accent]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    const progress = Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames)));

    // Active Node Step Calculation (0 to 4)
    const activeIdx = Math.min(4, Math.floor(progress * 5));

    // Dynamic Camera Pan & Orbit: Follow the traveling packet smoothly
    const camAngle = interpolate(progress, [0, 1], [-0.12, 0.12]);
    const camY = interpolate(progress, [0, 1], [1.2, -0.4]);
    const camZ = interpolate(progress, [0, 1], [9.4, 8.8]);
    s.camera.position.set(Math.sin(camAngle) * 8.5, camY, camZ);
    s.camera.lookAt(0, -0.2, 0);

    // Traveling packet along the curve
    const packetT = progress;
    const packetPos = s.curve.getPointAt(packetT);
    s.packet.position.copy(packetPos);
    s.pulseLight.position.copy(packetPos);

    // Animate NPCI Core rotation
    const npciCore = s.pedestals[1]?.children[2];
    if (npciCore) {
      npciCore.rotation.y = frame * 0.04;
      npciCore.rotation.x = frame * 0.02;
    }

    // Pedestals subtle breathing & active illumination
    s.pedestals.forEach((ped, idx) => {
      const isActive = idx <= activeIdx;
      const targetScale = isActive ? 1.06 : 0.96;
      ped.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

      // Make label badge always face camera
      const badge = ped.children[ped.children.length - 1];
      if (badge) {
        badge.quaternion.copy(s.camera.quaternion);
      }
    });

    // Expanding rings on Node 5
    s.beaconRings.forEach((bRing, rIdx) => {
      const phase = (frame * 0.04 + rIdx * 0.33) % 1;
      const scale = 0.5 + phase * 2.8;
      bRing.scale.set(scale, scale, 1);
      (bRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 * (1 - phase));
    });

    s.renderer.render(s.scene, s.camera);
  }, [frame, durationInFrames]);

  const tagText = resolveSceneTag(scene, "11 / END-TO-END PIPELINE");

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
          {scene.title ?? "The Complete UPI Architecture"}
        </h1>
      </div>

      {/* Bottom Live Pipeline Telemetry Status Card */}
      <div
        style={{
          position: "absolute",
          bottom: 110,
          left: 48,
          right: 48,
          background: "rgba(11, 16, 32, 0.88)",
          backdropFilter: "blur(16px)",
          border: `1.5px solid rgba(255, 255, 255, 0.12)`,
          borderLeft: `6px solid ${accent}`,
          borderRadius: 20,
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 22,
              fontWeight: 700,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "0.15em",
            }}
          >
            SYSTEM STATE
          </span>
          <span style={{ fontSize: 32, fontWeight: 900, color: "#FFFFFF" }}>
            Real-Time Atomic Relay
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(39, 201, 63, 0.15)",
            border: "1px solid #27C93F",
            padding: "8px 18px",
            borderRadius: 999,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#27C93F",
              boxShadow: "0 0 12px #27C93F",
            }}
          />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 22,
              fontWeight: 800,
              color: "#27C93F",
              letterSpacing: "0.1em",
            }}
          >
            24/7 ONLINE
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
