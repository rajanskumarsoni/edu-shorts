import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDStarlinkPhasedArray: React.FC<{
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
    dishGroup: THREE.Group;
    beamLine: THREE.Line;
    satelliteGroup: THREE.Group;
    emitterDisks: THREE.Mesh[];
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, Math.floor(height * 0.48));
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

    const threeScene = new THREE.Scene();
    threeScene.fog = new THREE.FogExp2(0x0a1128, 0.04);

    const camera = new THREE.PerspectiveCamera(42, width / (height * 0.48), 0.1, 100);
    camera.position.set(0, 1.2, 7.5);

    // Studio Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.8);
    threeScene.add(amb);
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(5, 6, 7);
    threeScene.add(key);
    const cyanRim = new THREE.DirectionalLight(new THREE.Color(accent), 2.5);
    cyanRim.position.set(-6, -2, -5);
    threeScene.add(cyanRim);

    // 1. Dishy Terminal Assembly
    const dishGroup = new THREE.Group();
    dishGroup.position.set(0, -1.2, 0);

    // Mast
    const mastGeo = new THREE.CylinderGeometry(0.12, 0.16, 1.8, 24);
    const mastMat = new THREE.MeshStandardMaterial({
      color: 0x2a324b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.y = 0.9;
    dishGroup.add(mast);

    // Base Flange
    const baseGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.15, 24);
    const base = new THREE.Mesh(baseGeo, mastMat);
    base.position.y = 0.08;
    dishGroup.add(base);

    // Dish Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.8, 0);
    headGroup.rotation.x = -0.55; // Tilted toward sky

    // Dish Plate (Hexagonal / Rounded Flat Panel)
    const plateGeo = new THREE.CylinderGeometry(1.4, 1.35, 0.15, 32);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xeef2f7,
      metalness: 0.2,
      roughness: 0.3,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.rotation.x = Math.PI / 2;
    headGroup.add(plate);

    // Glowing Rim Accent
    const rimGeo = new THREE.TorusGeometry(1.42, 0.04, 16, 48);
    const rimMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accent),
      transparent: true,
      opacity: 0.8,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.z = 0.08;
    headGroup.add(rim);

    // Emitter Patches Matrix (Grid of micro-antenna dots)
    const emitterDisks: THREE.Mesh[] = [];
    const patchGeo = new THREE.CircleGeometry(0.06, 16);
    const patchMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accent),
      transparent: true,
      opacity: 0.9,
    });

    for (let r = -4; r <= 4; r++) {
      for (let c = -4; c <= 4; c++) {
        if (r * r + c * c <= 16) {
          const p = new THREE.Mesh(patchGeo, patchMat.clone());
          p.position.set(c * 0.25, r * 0.25, 0.09);
          headGroup.add(p);
          emitterDisks.push(p);
        }
      }
    }

    dishGroup.add(headGroup);
    threeScene.add(dishGroup);

    // 2. Overhead Satellite Target
    const satelliteGroup = new THREE.Group();
    satelliteGroup.position.set(-2.8, 3.2, -2.0);

    const satBodyGeo = new THREE.BoxGeometry(0.6, 0.12, 0.35);
    const satBodyMat = new THREE.MeshStandardMaterial({ color: 0xdde4ee, metalness: 0.9 });
    const satBody = new THREE.Mesh(satBodyGeo, satBodyMat);
    satelliteGroup.add(satBody);

    // Solar Wings
    const wingGeo = new THREE.BoxGeometry(1.4, 0.02, 0.3);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.4 });
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.x = -1.0;
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.x = 1.0;
    satelliteGroup.add(leftWing, rightWing);

    threeScene.add(satelliteGroup);

    // 3. Dynamic Tracking Pencil Beam (Line between dish center and satellite)
    const beamGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.6, 0),
      new THREE.Vector3(-2.8, 3.2, -2.0),
    ]);
    const beamMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(accent),
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });
    const beamLine = new THREE.Line(beamGeo, beamMat);
    threeScene.add(beamLine);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      dishGroup,
      beamLine,
      satelliteGroup,
      emitterDisks,
    };

    return () => {
      renderer.dispose();
      stateRef.current = null;
    };
  }, [width, height, accent]);

  // Animation Update
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    const t = frame / 30;
    // Satellite travels horizontally across the sky from left to right
    const satX = -3.2 + ((frame % 180) / 180) * 6.4;
    const satY = 3.2 + Math.sin(t * 1.5) * 0.2;
    s.satelliteGroup.position.set(satX, satY, -2.0);

    // Update tracking beam endpoints
    const dishPos = new THREE.Vector3(0, 0.6, 0);
    const satPos = s.satelliteGroup.position.clone();
    s.beamLine.geometry.setFromPoints([dishPos, satPos]);

    // Animate phase wave pulse across emitter disks
    const beamAngle = Math.atan2(satPos.x, satPos.y - 0.6);
    s.emitterDisks.forEach((disk) => {
      const phaseOffset = disk.position.x * Math.sin(beamAngle) * 8.0;
      const wave = (Math.sin(t * 12.0 + phaseOffset) + 1) / 2;
      const mat = disk.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + wave * 0.7;
    });

    s.dishGroup.rotation.y = Math.sin(t * 0.5) * 0.1; // Gentle perspective sway
    s.renderer.render(s.scene, s.camera);
  }, [frame]);

  const tag = resolveSceneTag(scene, "05 / ZERO MOVING PARTS");
  const beamAngleDeg = Math.round(
    (Math.atan2(-3.2 + ((frame % 180) / 180) * 6.4, 3.2) * 180) / Math.PI
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#070c1e",
        fontFamily: "'Inter', sans-serif",
        color: "#ffffff",
      }}
    >
      {/* Top Header Tag */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 20,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: accent,
          }}
        >
          {tag}
        </div>
        <div
          style={{
            padding: "6px 16px",
            borderRadius: 20,
            background: "rgba(0, 240, 255, 0.15)",
            border: `1px solid ${accent}`,
            fontSize: 18,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "0.08em",
          }}
        >
          KU-BAND • 12 GHz
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 110,
          left: 60,
          right: 60,
          fontSize: 48,
          fontWeight: 900,
          letterSpacing: "-0.02em",
          color: "#ffffff",
          zIndex: 20,
        }}
      >
        {scene.title || "PHASED ARRAY BEAM STEERING"}
      </div>

      {/* Top Half: 3D Terminal & Moving Satellite Viewport */}
      <div
        style={{
          position: "absolute",
          top: 180,
          left: 0,
          width: "100%",
          height: "48%",
        }}
      >
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 60,
            background: "rgba(10, 17, 40, 0.8)",
            padding: "8px 18px",
            borderRadius: 8,
            border: "1px solid rgba(255, 255, 255, 0.12)",
            fontSize: 18,
            color: "#94a3b8",
            letterSpacing: "0.05em",
          }}
        >
          3D HARDWARE: DISHY FLAT PANEL • ELECTRONIC TILT
        </div>
      </div>

      {/* Bottom Half: Constructive Wavefront Physics Split Screen */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 60,
          right: 60,
          height: "40%",
          background: "rgba(13, 22, 53, 0.85)",
          borderRadius: 24,
          border: "1px solid rgba(0, 240, 255, 0.25)",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Diagram Title & Angle Readout */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em" }}>
              CONSTRUCTIVE INTERFERENCE RAY DIAGRAM
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#ffffff" }}>
              Phase Delay (Δϕ) Steers Wavefront
            </div>
          </div>
          <div
            style={{
              textAlign: "right",
              background: "rgba(0, 240, 255, 0.12)",
              padding: "10px 20px",
              borderRadius: 14,
              border: `1px solid ${accent}`,
            }}
          >
            <div style={{ fontSize: 14, color: "#94a3b8" }}>BEAM STEER ANGLE</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: accent }}>
              {beamAngleDeg > 0 ? `+${beamAngleDeg}°` : `${beamAngleDeg}°`}
            </div>
          </div>
        </div>

        {/* 2D SVG Wavefront Diagram */}
        <div style={{ flex: 1, position: "relative" }}>
          <svg
            viewBox="0 0 900 240"
            style={{ width: "100%", height: "100%", overflow: "visible" }}
          >
            {/* Emitter Antennas Row (8 Elements) */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
              const cx = 100 + idx * 100;
              const cy = 200;
              const phaseDelay = idx * (beamAngleDeg * 0.8);
              const waveRadius = ((frame * 4 + phaseDelay) % 120);

              return (
                <g key={idx}>
                  {/* Expanding wavefront circles */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={waveRadius}
                    fill="none"
                    stroke={accent}
                    strokeWidth={2}
                    opacity={Math.max(0, 1 - waveRadius / 120)}
                  />
                  {/* Antenna Patch Base */}
                  <rect
                    x={cx - 24}
                    y={cy - 12}
                    width={48}
                    height={24}
                    rx={4}
                    fill="#1e293b"
                    stroke={accent}
                    strokeWidth={1.5}
                  />
                  <text
                    x={cx}
                    y={cy + 5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={14}
                    fontWeight={700}
                  >
                    A{idx + 1}
                  </text>
                  {/* Phase delay label below */}
                  <text
                    x={cx}
                    y={cy + 30}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize={12}
                    fontWeight={600}
                  >
                    {Math.round(idx * Math.abs(beamAngleDeg) * 1.2)}°
                  </text>
                </g>
              );
            })}

            {/* Steered Combined Wavefront Line */}
            <line
              x1={100}
              y1={200 - 50 + beamAngleDeg * 1.5}
              x2={800}
              y2={200 - 50 - beamAngleDeg * 1.5}
              stroke="#38bdf8"
              strokeWidth={4}
              strokeDasharray="6,4"
            />

            {/* Resulting Main Pencil Beam Vector Arrow */}
            <line
              x1={450}
              y1={170}
              x2={450 + beamAngleDeg * 4.5}
              y2={30}
              stroke="#ffe600"
              strokeWidth={5}
              markerEnd="url(#arrow)"
            />

            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffe600" />
              </marker>
            </defs>
          </svg>
        </div>

        {/* Telemetry Stat Pills */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
            marginTop: 14,
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              borderRadius: 12,
              padding: "10px 16px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ fontSize: 13, color: "#94a3b8" }}>SWITCHING SPEED</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#38bdf8" }}>&lt; 10 μs</div>
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              borderRadius: 12,
              padding: "10px 16px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ fontSize: 13, color: "#94a3b8" }}>MOVING MOTORS</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#22c55e" }}>0 (SOLID-STATE)</div>
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              borderRadius: 12,
              padding: "10px 16px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div style={{ fontSize: 13, color: "#94a3b8" }}>EMITTER CELLS</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#ffe600" }}>1,280 CELLS</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
