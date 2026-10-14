import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";

// 3D GPS Trilateration visualization:
// Central Earth Globe, 4 orbiting MEO satellites with visible solar panels & orbital paths,
// expanding spherical radio wavefronts, converging laser telemetry lines,
// and a glassmorphism telemetry HUD overlay.
export const ThreeDGPSTrilateration: React.FC<{
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
    rootGroup: THREE.Group;
    satellites: THREE.Group[];
    radioWaves: THREE.Mesh[];
    targetMarker: THREE.Group;
    beaconLine: THREE.Line;
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
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 9.8);

    const rootGroup = new THREE.Group();
    threeScene.add(rootGroup);

    // Dynamic Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    threeScene.add(ambientLight);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(6, 8, 8);
    threeScene.add(keyLight);
    const cyanRim = new THREE.DirectionalLight(new THREE.Color(accent), 2.2);
    cyanRim.position.set(-8, -4, -6);
    threeScene.add(cyanRim);
    const amberFill = new THREE.PointLight(0xffc857, 1.5, 20);
    amberFill.position.set(0, 4, 6);
    threeScene.add(amberFill);

    // 1. Central Earth Globe
    const earthRadius = 2.4;
    const earthGroup = new THREE.Group();
    rootGroup.add(earthGroup);

    // Deep oceanic blue Earth core
    const earthGeo = new THREE.SphereGeometry(earthRadius, 36, 36);
    const earthMat = new THREE.MeshStandardMaterial({
      color: 0x0c2744,
      roughness: 0.5,
      metalness: 0.3,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earth);

    // Atmospheric cyan halo shell
    const atmoGeo = new THREE.SphereGeometry(earthRadius + 0.12, 36, 36);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accent),
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    earthGroup.add(atmoMesh);

    // High-tech latitude & longitude grid lines
    const wireGeo = new THREE.SphereGeometry(earthRadius + 0.02, 28, 28);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireSphere = new THREE.Mesh(wireGeo, wireMat);
    earthGroup.add(wireSphere);

    // Equator neon ring
    const eqGeo = new THREE.RingGeometry(earthRadius + 0.04, earthRadius + 0.08, 64);
    const eqMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accent),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const eqRing = new THREE.Mesh(eqGeo, eqMat);
    eqRing.rotation.x = Math.PI / 2;
    earthGroup.add(eqRing);

    // Land/City glowing dots across the globe
    const cityCount = 24;
    const cityGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const cityMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    for (let i = 0; i < cityCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / cityCount);
      const theta = Math.sqrt(cityCount * Math.PI) * phi;
      const x = (earthRadius + 0.03) * Math.cos(theta) * Math.sin(phi);
      const y = (earthRadius + 0.03) * Math.sin(theta) * Math.sin(phi);
      const z = (earthRadius + 0.03) * Math.cos(phi);
      const dot = new THREE.Mesh(cityGeo, cityMat);
      dot.position.set(x, y, z);
      earthGroup.add(dot);
    }

    // Target ground pin on Earth (user's smartphone location)
    const targetPos = new THREE.Vector3(0.5, 0.9, 2.1).normalize().multiplyScalar(earthRadius);
    const targetMarker = new THREE.Group();
    targetMarker.position.copy(targetPos);

    // Glowing golden ground beacon
    const pinGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xffc857 });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    targetMarker.add(pinMesh);

    // Expanding concentric ripple rings
    const ringGeo = new THREE.RingGeometry(0.2, 0.28, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffc857,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.lookAt(targetPos);
    targetMarker.add(ringMesh);
    rootGroup.add(targetMarker);

    // Vertical locator beacon line pointing up into the sky
    const beaconGeo = new THREE.BufferGeometry().setFromPoints([
      targetPos,
      targetPos.clone().multiplyScalar(1.6),
    ]);
    const beaconMat = new THREE.LineBasicMaterial({
      color: 0xffc857,
      transparent: true,
      opacity: 0.85,
    });
    const beaconLine = new THREE.Line(beaconGeo, beaconMat);
    rootGroup.add(beaconLine);

    // 2. 4 Orbiting GPS Satellites (20,200 km MEO Constellation)
    const satDist = 4.8;
    const satConfigs = [
      { pos: new THREE.Vector3(-satDist * 0.72, satDist * 0.65, satDist * 0.25), name: "SAT 01", prn: "PRN 04", color: accent },
      { pos: new THREE.Vector3(satDist * 0.78, satDist * 0.52, satDist * 0.35), name: "SAT 02", prn: "PRN 12", color: accent },
      { pos: new THREE.Vector3(satDist * 0.15, satDist * 0.82, -satDist * 0.55), name: "SAT 03", prn: "PRN 19", color: accent },
      { pos: new THREE.Vector3(-satDist * 0.38, -satDist * 0.62, satDist * 0.68), name: "SAT 04", prn: "PRN 28", color: "#FFC857" },
    ];

    const satellites: THREE.Group[] = [];
    const radioWaves: THREE.Mesh[] = [];

    satConfigs.forEach((cfg) => {
      const satGroup = new THREE.Group();
      satGroup.position.copy(cfg.pos);

      // Satellite main chassis (metallic space gold / silver)
      const busGeo = new THREE.BoxGeometry(0.4, 0.4, 0.5);
      const busMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        metalness: 0.85,
        roughness: 0.15,
      });
      const busMesh = new THREE.Mesh(busGeo, busMat);
      satGroup.add(busMesh);

      // Dual Photovoltaic Solar Arrays
      const wingGeo = new THREE.BoxGeometry(0.85, 0.28, 0.04);
      const wingMat = new THREE.MeshStandardMaterial({
        color: 0x0369a1,
        metalness: 0.6,
        roughness: 0.3,
      });
      const leftWing = new THREE.Mesh(wingGeo, wingMat);
      leftWing.position.set(-0.68, 0, 0);
      satGroup.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, wingMat);
      rightWing.position.set(0.68, 0, 0);
      satGroup.add(rightWing);

      // Parabolic transmitter dish pointing toward Earth
      const dishGeo = new THREE.CylinderGeometry(0.2, 0.05, 0.12, 16);
      const dishMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        metalness: 0.8,
        roughness: 0.2,
      });
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.position.set(0, 0, 0.3);
      dish.rotation.x = Math.PI / 2;
      satGroup.add(dish);

      // Pulsing telemetry LED antenna beacon
      const ledGeo = new THREE.SphereGeometry(0.09, 12, 12);
      const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(cfg.color) });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0, 0, 0.42);
      satGroup.add(led);

      satGroup.lookAt(0, 0, 0);
      rootGroup.add(satGroup);
      satellites.push(satGroup);

      // Orbital ellipse track around Earth
      const orbitCurve = new THREE.EllipseCurve(
        0, 0,
        cfg.pos.length(), cfg.pos.length(),
        0, 2 * Math.PI,
        false, 0
      );
      const orbitPoints = orbitCurve.getPoints(64).map(p => new THREE.Vector3(p.x, 0, p.y));
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(cfg.color),
        transparent: true,
        opacity: 0.22,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitLine.rotation.x = Math.sin(cfg.pos.x) * 0.5;
      orbitLine.rotation.z = Math.cos(cfg.pos.y) * 0.5;
      rootGroup.add(orbitLine);

      // Expanding 3D Spherical Radio Wavefront (The Trilateration Spheres)
      const waveGeo = new THREE.SphereGeometry(1, 24, 24);
      const waveMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(cfg.color),
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const wave = new THREE.Mesh(waveGeo, waveMat);
      wave.position.copy(cfg.pos);
      rootGroup.add(wave);
      radioWaves.push(wave);

      // Converging laser telemetry beam connecting satellite to ground receiver
      const beamGeo = new THREE.BufferGeometry().setFromPoints([cfg.pos, targetPos]);
      const beamMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(cfg.color),
        transparent: true,
        opacity: 0.75,
      });
      const beam = new THREE.Line(beamGeo, beamMat);
      rootGroup.add(beam);
    });

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      rootGroup,
      satellites,
      radioWaves,
      targetMarker,
      beaconLine,
    };

    return () => {
      renderer.dispose();
      threeScene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      stateRef.current = null;
    };
  }, [width, height, accent]);

  // Frame animation loop
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    const t = frame * 0.018;

    // Cinematic slow planetary orbit camera movement
    s.rootGroup.rotation.y = t * 0.32;
    s.rootGroup.rotation.x = Math.sin(t * 0.18) * 0.1;

    // Pulse expanding spherical radio wavefronts from each satellite
    s.radioWaves.forEach((wave, idx) => {
      const cycle = ((frame + idx * 24) % 80) / 80;
      const waveScale = 0.4 + cycle * 4.6;
      wave.scale.set(waveScale, waveScale, waveScale);
      (wave.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - cycle) * 0.4);
    });

    // Pulse target receiver marker
    const pinPulse = 1 + 0.22 * Math.sin(frame * 0.25);
    s.targetMarker.scale.set(pinPulse, pinPulse, pinPulse);

    s.renderer.render(s.scene, s.camera);
  }, [frame]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#0B1020" }}>
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Cinematic HUD Header */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 45,
          right: 45,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            background: "rgba(11, 16, 32, 0.88)",
            backdropFilter: "blur(24px)",
            borderRadius: 24,
            padding: "20px 28px",
            border: "1px solid rgba(0, 240, 255, 0.25)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 26,
              fontWeight: 800,
              color: accent,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            {scene.tag ?? "04 / 3D TRILATERATION"}
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: "#FFFFFF",
              lineHeight: 1.15,
              letterSpacing: -0.5,
            }}
          >
            {"INTERSECTING 4 SPHERES"}
          </div>
          {/* Prominent mathematical equation badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              marginTop: 12,
              padding: "10px 18px",
              background: "rgba(0, 240, 255, 0.12)",
              borderRadius: 14,
              border: `1px solid ${accent}`,
              width: "fit-content",
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 32,
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: 1,
              }}
            >
              {"d = c · Δt"}
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: accent,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {"[DISTANCE = SPEED OF LIGHT × TIME]"}
            </span>
          </div>
        </div>
      </div>

      {/* Live Satellite Constellation Telemetry HUD Card (Middle) */}
      <div
        style={{
          position: "absolute",
          top: 360,
          left: 45,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {[
          { label: "SAT 01 [PRN 04]", dist: "20,240 km", delay: "Δt₁ = 67.5 ms", status: "LOCKED", color: accent },
          { label: "SAT 02 [PRN 12]", dist: "21,180 km", delay: "Δt₂ = 70.6 ms", status: "LOCKED", color: accent },
          { label: "SAT 03 [PRN 19]", dist: "19,820 km", delay: "Δt₃ = 66.1 ms", status: "LOCKED", color: accent },
          { label: "SAT 04 [PRN 28]", dist: "TIME SYNC", delay: "BIAS = 0.00 ns", status: "CORRECTED", color: "#FFC857" },
        ].map((sat, i) => (
          <div
            key={i}
            style={{
              background: "rgba(11, 16, 32, 0.85)",
              backdropFilter: "blur(16px)",
              borderRadius: 14,
              padding: "10px 16px",
              border: `1px solid ${sat.color}40`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              minWidth: 320,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: sat.color,
                boxShadow: `0 0 10px ${sat.color}`,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", fontFamily: "monospace" }}>
                {sat.label}
              </div>
              <div style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>
                {sat.dist} • {sat.delay}
              </div>
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 900,
                color: sat.color,
                padding: "3px 8px",
                borderRadius: 6,
                background: `${sat.color}20`,
                fontFamily: "monospace",
              }}
            >
              {sat.status}
            </div>
          </div>
        ))}
      </div>

      {/* Target Pin Telemetry Card (Bottom - below captions) */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 45,
          right: 45,
          pointerEvents: "none",
          background: "rgba(11, 16, 32, 0.9)",
          backdropFilter: "blur(20px)",
          borderRadius: 20,
          padding: "16px 24px",
          border: "1px solid rgba(255, 200, 87, 0.4)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              fontWeight: 800,
              color: "#FFC857",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {"RECEIVER FIX LOCKED"}
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#FFFFFF", fontFamily: "monospace" }}>
            {"LAT: 28.6139° N  •  LON: 77.2090° E"}
          </div>
        </div>
        <div
          style={{
            padding: "8px 16px",
            background: "rgba(255, 200, 87, 0.15)",
            border: "1px solid #FFC857",
            borderRadius: 12,
            fontFamily: "monospace",
            fontSize: 20,
            fontWeight: 800,
            color: "#FFC857",
          }}
        >
          {"±1.2m ACCURACY"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
