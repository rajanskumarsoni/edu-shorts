import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDCalloutAlert: React.FC<{
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
    shieldGroup: THREE.Group;
    shieldMaterial: THREE.MeshStandardMaterial;
    rings: THREE.Mesh[];
    clockGroup: THREE.Group;
    clockHand: THREE.Group;
    strobeLight: THREE.PointLight;
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
    camera.position.set(0, 0.5, 8.5);
    camera.lookAt(0, 0, 0);

    // Dark grid
    const grid = new THREE.GridHelper(16, 20, 0xffc857, 0x1a233a);
    grid.position.y = -3.2;
    threeScene.add(grid);

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.8);
    threeScene.add(amb);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 8, 6);
    threeScene.add(dirLight);

    const strobeLight = new THREE.PointLight(0xffc857, 4.0, 15);
    strobeLight.position.set(0, 1.5, 4);
    threeScene.add(strobeLight);

    // --- 1. 3D Security Shield Object ---
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(0, 0.4, 0);

    // Shield Shape via ExtrudeGeometry
    const shape = new THREE.Shape();
    shape.moveTo(-1.2, 1.4);
    shape.lineTo(1.2, 1.4);
    shape.quadraticCurveTo(1.3, 0.0, 0.8, -0.9);
    shape.lineTo(0.0, -1.8);
    shape.lineTo(-0.8, -0.9);
    shape.quadraticCurveTo(-1.3, 0.0, -1.2, 1.4);

    const extrudeSettings = {
      depth: 0.28,
      bevelEnabled: true,
      bevelSegments: 6,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    };

    const shieldGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    shieldGeo.center();

    const shieldMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x553300,
      emissiveIntensity: 0.6,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMaterial);
    shieldGroup.add(shieldMesh);

    // Glowing Inner Crest Outline
    const innerShape = new THREE.Shape();
    innerShape.moveTo(-0.9, 1.1);
    innerShape.lineTo(0.9, 1.1);
    innerShape.quadraticCurveTo(1.0, 0.0, 0.6, -0.7);
    innerShape.lineTo(0.0, -1.4);
    innerShape.lineTo(-0.6, -0.7);
    innerShape.quadraticCurveTo(-1.0, 0.0, -0.9, 1.1);

    const innerGeo = new THREE.ExtrudeGeometry(innerShape, { depth: 0.1, bevelEnabled: false });
    innerGeo.center();
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xffc857 });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    innerMesh.position.z = 0.22;
    shieldGroup.add(innerMesh);

    // 3D Padlock Security Glyph on Shield Center
    const lockGroup = new THREE.Group();
    lockGroup.position.set(0, 0.05, 0.32);

    const lockBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.52, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
    );
    lockGroup.add(lockBody);

    const lockShackle = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.05, 12, 24, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xffc857, metalness: 0.95, roughness: 0.1 })
    );
    lockShackle.position.set(0, 0.26, 0);
    lockGroup.add(lockShackle);

    // Keyhole circle & slot
    const keyholeCircle = new THREE.Mesh(
      new THREE.CircleGeometry(0.06, 16),
      new THREE.MeshBasicMaterial({ color: 0xffc857 })
    );
    keyholeCircle.position.set(0, 0.04, 0.075);
    lockGroup.add(keyholeCircle);

    const keyholeSlot = new THREE.Mesh(
      new THREE.PlaneGeometry(0.04, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xffc857 })
    );
    keyholeSlot.position.set(0, -0.03, 0.075);
    lockGroup.add(keyholeSlot);

    shieldGroup.add(lockGroup);

    // Concentric Orbiting Warning Rings
    const rings: THREE.Mesh[] = [];
    [2.3, 2.7, 3.1].forEach((r, idx) => {
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 1 ? 0xff5555 : 0xffc857,
        transparent: true,
        opacity: 0.45,
        wireframe: true,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 8, 48), ringMat);
      ring.position.z = -0.2;
      shieldGroup.add(ring);
      rings.push(ring);
    });

    threeScene.add(shieldGroup);

    // --- 2. 3D Auto-Reconciliation T+1 Clock Mechanism ---
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0, -1.9, 0.6);

    // Clock Rim
    const clockRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.75, 0.06, 16, 48),
      new THREE.MeshStandardMaterial({ color: 0xffc857, metalness: 0.9, roughness: 0.2 })
    );
    clockGroup.add(clockRim);

    // Clock Dial Face
    const clockFace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.72, 0.04, 32),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
    );
    clockFace.rotation.x = Math.PI / 2;
    clockGroup.add(clockFace);

    // 12 Radial Ticks
    for (let h = 0; h < 12; h++) {
      const angle = (h / 12) * Math.PI * 2;
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.09, 0.02),
        new THREE.MeshBasicMaterial({ color: 0xffc857 })
      );
      tick.position.set(Math.sin(angle) * 0.58, Math.cos(angle) * 0.58, 0.03);
      clockGroup.add(tick);
    }

    // Sweeping Clock Hand
    const handGroup = new THREE.Group();
    handGroup.position.z = 0.04;
    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.45, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    hand.position.y = 0.22;
    handGroup.add(hand);
    clockGroup.add(handGroup);

    threeScene.add(clockGroup);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      shieldGroup,
      shieldMaterial,
      rings,
      clockGroup,
      clockHand: handGroup,
      strobeLight,
    };

    return () => {
      threeScene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [width, height, accent]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    const progress = Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames)));

    // Camera dynamic angle: Starts with Dutch tilt for alarm/caution, slowly stabilizes
    const dutch = interpolate(frame, [0, 45], [0.12, 0.0], { extrapolateRight: "clamp" });
    const camZ = interpolate(progress, [0, 1], [8.8, 7.8]);
    const camY = interpolate(progress, [0, 1], [0.8, 0.2]);
    s.camera.position.set(0, camY, camZ);
    s.camera.rotation.z = dutch;
    s.camera.lookAt(0, -0.1, 0);

    // Rotate Shield slightly in 3D
    s.shieldGroup.rotation.y = Math.sin(frame * 0.03) * 0.25;
    s.shieldGroup.rotation.x = Math.cos(frame * 0.025) * 0.12;

    // Counter-rotate warning rings
    s.rings.forEach((r, idx) => {
      r.rotation.z = (frame * 0.02 * (idx % 2 === 0 ? 1 : -1));
    });

    // Rapidly sweeping clock hand to demonstrate 24-hour T+1 cycle
    if (s.clockHand) {
      s.clockHand.rotation.z = -frame * 0.15;
    }

    // Color transition: In the second half of scene, amber transforms into reassuring green
    const colorTransition = interpolate(progress, [0.45, 0.75], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    const amberCol = new THREE.Color(0xffc857);
    const greenCol = new THREE.Color(0x27c93f);
    const activeColor = amberCol.clone().lerp(greenCol, colorTransition);

    s.shieldMaterial.emissive.copy(activeColor).multiplyScalar(0.4);
    s.strobeLight.color.copy(activeColor);

    // Strobe pulse on the beat
    const strobe = (Math.sin(frame * 0.2) + 1) / 2;
    s.strobeLight.intensity = 2.5 + strobe * 2.5;

    s.renderer.render(s.scene, s.camera);
  }, [frame, durationInFrames]);

  const tagText = resolveSceneTag(scene, "12 / GOLDEN RULE");

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
            border: `1.5px solid #FFC85788`,
            backdropFilter: "blur(12px)",
            boxShadow: `0 0 25px rgba(255, 200, 87, 0.3)`,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#FFC857",
              boxShadow: `0 0 14px #FFC857`,
            }}
          />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "0.22em",
              color: "#FFC857",
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
          {scene.title ?? "What If Payment Fails?"}
        </h1>
      </div>

      {/* Bottom Advice Glassmorphic Card */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 48,
          right: 48,
          background: "rgba(11, 16, 32, 0.92)",
          backdropFilter: "blur(18px)",
          border: `1.5px solid rgba(255, 200, 87, 0.4)`,
          borderLeft: `6px solid #FFC857`,
          borderRadius: 24,
          padding: "24px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(255,200,87,0.15)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 24,
              fontWeight: 900,
              color: "#FFC857",
              letterSpacing: "0.15em",
            }}
          >
            {scene.text || "STATUS: TRANSACTION PENDING"}
          </span>
          <span
            style={{
              background: "rgba(255, 200, 87, 0.2)",
              color: "#FFFFFF",
              fontFamily: "monospace",
              fontSize: 20,
              fontWeight: 800,
              padding: "4px 14px",
              borderRadius: 8,
              border: "1px solid #FFC857",
            }}
          >
            {scene.category || "RECOMMENDED"}
          </span>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1.3,
            color: "#FFFFFF",
          }}
        >
          {scene.subtext || "Do not pay twice immediately. The banking switch reconciles and auto-refunds safely."}
        </p>
      </div>
    </AbsoluteFill>
  );
};
