import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

interface RowData {
  id: string | number;
  col1?: string;
  col2?: string;
  status: string;
  version?: string;
  locked?: boolean;
  highlight?: boolean;
}

export const ThreeDDataStore: React.FC<{
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
    mainDb: THREE.Group;
    replicas: THREE.Group[];
    rowGroup: THREE.Group;
    padlock: THREE.Group;
    particles: THREE.Points;
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
    threeScene.fog = new THREE.FogExp2(0x0a1424, 0.035);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 4.2, 8.8);
    camera.lookAt(0, 1.2, 0);

    // 1. Grid & Floor
    const grid = new THREE.GridHelper(24, 28, new THREE.Color(accent), 0x162644);
    grid.position.set(0, -0.01, 0);
    threeScene.add(grid);

    // Helper: create cylindrical database platter
    const createDbCylinder = (radius: number, heightCyl: number, isMain: boolean) => {
      const dbGroup = new THREE.Group();

      // Multi-layer platter stack
      const layers = 3;
      const layerH = heightCyl / layers;
      for (let i = 0; i < layers; i++) {
        const cylGeo = new THREE.CylinderGeometry(radius, radius, layerH * 0.85, 32);
        const cylMat = new THREE.MeshStandardMaterial({
          color: isMain ? 0x152848 : 0x0f1d35,
          metalness: 0.85,
          roughness: 0.25,
        });
        const mesh = new THREE.Mesh(cylGeo, cylMat);
        mesh.position.y = (i + 0.5) * layerH;
        dbGroup.add(mesh);

        // Edge wireframe for blueprint aesthetic
        const wireGeo = new THREE.EdgesGeometry(cylGeo);
        const wireMat = new THREE.LineBasicMaterial({
          color: isMain ? new THREE.Color(accent) : 0x4cc9f0,
          transparent: true,
          opacity: 0.45,
        });
        const wire = new THREE.LineSegments(wireGeo, wireMat);
        wire.position.copy(mesh.position);
        dbGroup.add(wire);

        // LED dot indicator
        const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const ledMat = new THREE.MeshBasicMaterial({
          color: isMain ? (i === 1 ? 0xffc857 : 0x00f0ff) : 0x00f0ff,
        });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set(0, (i + 0.5) * layerH, radius + 0.02);
        dbGroup.add(led);
      }

      // Top neon indicator ring
      const ringGeo = new THREE.RingGeometry(radius * 0.65, radius * 0.82, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isMain ? 0xffc857 : new THREE.Color(accent),
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = heightCyl + 0.01;
      dbGroup.add(ring);

      return dbGroup;
    };

    // 2. Main DB (front center)
    const mainDb = createDbCylinder(1.1, 1.8, true);
    mainDb.position.set(0, 0, 1.2);
    threeScene.add(mainDb);

    // 3. Read Replicas (rear cluster)
    const replicas: THREE.Group[] = [];
    const replicaOffsets = [
      { x: -2.3, z: -1.2 },
      { x: 0, z: -2.2 },
      { x: 2.3, z: -1.2 },
    ];
    replicaOffsets.forEach((pos) => {
      const rep = createDbCylinder(0.75, 1.3, false);
      rep.position.set(pos.x, 0, pos.z);
      threeScene.add(rep);
      replicas.push(rep);
    });

    // 4. Data Transfer Particle Stream
    const partCount = 45;
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount; i++) {
      partPos[i * 3] = (Math.random() - 0.5) * 4;
      partPos[i * 3 + 1] = 0.5 + Math.random() * 1.5;
      partPos[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    partGeo.setAttribute("position", new THREE.BufferAttribute(partPos, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0x4cc9f0,
      size: 0.08,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(partGeo, partMat);
    threeScene.add(particles);

    // 5. Floating Database Row Slabs (Glass Slabs above Main DB)
    const rowGroup = new THREE.Group();
    rowGroup.position.set(0, 2.3, 1.2);
    threeScene.add(rowGroup);

    const rowsCount = 5;
    const slabW = 2.4;
    const slabH = 0.28;
    const slabD = 0.06;

    for (let i = 0; i < rowsCount; i++) {
      const slabGeo = new THREE.BoxGeometry(slabW, slabH, slabD);
      const isTarget = i === 2; // Row 23 (target locked row)
      const slabMat = new THREE.MeshStandardMaterial({
        color: isTarget ? 0x1e3a5f : 0x0f213d,
        metalness: 0.7,
        roughness: 0.2,
        transparent: true,
        opacity: 0.9,
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.y = (rowsCount - 1 - i) * 0.38;

      const edgeGeo = new THREE.EdgesGeometry(slabGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: isTarget ? 0xffc857 : 0x3d70b2,
        linewidth: 2,
      });
      const edge = new THREE.LineSegments(edgeGeo, edgeMat);
      slab.add(edge);

      rowGroup.add(slab);
    }

    // 6. 3D Padlock (snapping onto target row)
    const padlock = new THREE.Group();
    // Body
    const lockBodyGeo = new THREE.BoxGeometry(0.3, 0.26, 0.12);
    const lockBodyMat = new THREE.MeshStandardMaterial({
      color: 0xffc857,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xffa000,
      emissiveIntensity: 0.25,
    });
    const lockBody = new THREE.Mesh(lockBodyGeo, lockBodyMat);
    padlock.add(lockBody);

    // Shackle (Torus half)
    const shackleGeo = new THREE.TorusGeometry(0.1, 0.03, 12, 24, Math.PI);
    const shackleMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1,
    });
    const shackle = new THREE.Mesh(shackleGeo, shackleMat);
    shackle.position.y = 0.13;
    padlock.add(shackle);

    padlock.position.set(-1.42, 0.76, 0.05); // Snapped right on row 23
    rowGroup.add(padlock);

    // 7. Cinematic Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    threeScene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(4, 8, 6);
    threeScene.add(dirLight);

    // Warm padlock spotlight
    const lockLight = new THREE.PointLight(0xffc857, 1.8, 4);
    lockLight.position.set(-1.2, 0.8, 0.6);
    rowGroup.add(lockLight);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      mainDb,
      replicas,
      rowGroup,
      padlock,
      particles,
    };

    return () => {
      renderer.dispose();
    };
  }, [width, height, accent]);

  // Frame animation loop
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Smooth camera orbit
    const camAngle = 0.003 * frame;
    s.camera.position.x = Math.sin(camAngle) * 1.2;
    s.camera.position.y = 3.8 + Math.cos(camAngle * 0.7) * 0.2;
    s.camera.lookAt(0, 1.4, 0.4);

    // Floating row slabs breathing motion
    s.rowGroup.position.y = 2.3 + Math.sin(frame * 0.04) * 0.06;

    // Padlock entrance snap
    const lockSnap = spring({
      frame,
      fps,
      config: { damping: 14, mass: 0.8, stiffness: 120 },
    });
    s.padlock.scale.setScalar(lockSnap);

    // Particle flow loop from Main to Replicas
    const pos = s.particles.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 2] -= 0.025; // Flow towards back
      if (pos[i + 2] < -2.5) {
        pos[i + 2] = 1.2;
        pos[i] = (Math.random() - 0.5) * 1.5;
      }
    }
    s.particles.geometry.attributes.position.needsUpdate = true;

    s.renderer.render(s.scene, s.camera);
  }, [frame, fps]);

  // Overlay HUD Rows for extreme editorial typography legibility
  const rows: RowData[] = [
    { id: 21, col1: "B4", status: "BOOKED" },
    { id: 22, col1: "B4", status: "FREE" },
    { id: 23, col1: "B4", status: frame > 45 ? "BOOKED · YOU v8" : "LOCKED · YOU", locked: true, highlight: true },
    { id: 24, col1: "B4", status: "BOOKED" },
    { id: 25, col1: "B4", status: "BOOKED" },
  ];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Top Track Tag */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 54,
          right: 54,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "monospace",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: "0.14em",
          color: accent,
          zIndex: 10,
        }}
      >
        <span>{resolveSceneTag(scene, "04 / DATABASE ISOLATION LAYER")}</span>
        <span style={{ color: "#8E9EB8" }}>READ-WRITE CLUSTER</span>
      </div>

      {/* Floating 2D HUD Labels anchored to 3D Space */}
      <div
        style={{
          position: "absolute",
          top: "22%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 580,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        {rows.map((row, idx) => {
          const isTarget = row.id === 23;
          const isCommit = isTarget && frame > 45;
          return (
            <div
              key={row.id}
              style={{
                display: "grid",
                gridTemplateColumns: "70px 70px 1fr",
                alignItems: "center",
                padding: "8px 18px",
                borderRadius: 10,
                background: isCommit
                  ? "rgba(52, 199, 89, 0.18)"
                  : isTarget
                  ? "rgba(255, 200, 87, 0.16)"
                  : "rgba(15, 33, 61, 0.65)",
                border: `1.5px solid ${
                  isCommit ? "#34C759" : isTarget ? "#FFC857" : "rgba(80, 125, 185, 0.4)"
                }`,
                color: "#FFFFFF",
                fontFamily: "monospace",
                fontSize: 24,
                fontWeight: 800,
                boxShadow: isTarget ? "0 0 24px rgba(255, 200, 87, 0.28)" : "none",
              }}
            >
              <span style={{ color: isTarget ? "#FFC857" : "#8E9EB8" }}>{row.id}</span>
              <span style={{ color: "#AFC4DF" }}>{row.col1}</span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    color: isCommit ? "#34C759" : isTarget ? "#FFC857" : "#FFFFFF",
                    fontWeight: 900,
                  }}
                >
                  {row.status}
                </span>
                {row.locked && !isCommit && (
                  <span style={{ fontSize: 18, color: "#FFC857", background: "rgba(255,200,87,0.2)", padding: "2px 8px", borderRadius: 4 }}>
                    WAITING QUEUE
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Database Node Identification Badges */}
      <div
        style={{
          position: "absolute",
          bottom: "23%",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 32,
          zIndex: 10,
          fontFamily: "monospace",
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        <div style={{ padding: "8px 18px", borderRadius: 8, background: "rgba(10,25,48,0.85)", border: `1.5px solid #FFC857`, color: "#FFC857" }}>
          MAIN DB · WRITES
        </div>
        <div style={{ padding: "8px 18px", borderRadius: 8, background: "rgba(10,25,48,0.85)", border: `1.5px solid #4CC9F0`, color: "#4CC9F0" }}>
          READ REPLICAS (3X)
        </div>
      </div>
    </AbsoluteFill>
  );
};

