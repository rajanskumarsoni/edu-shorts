import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDRouteSegments: React.FC<{
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
    trackGroup: THREE.Group;
    segmentMeshes: THREE.Mesh[];
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

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 11, 4.5);
    camera.lookAt(0, 0, -2.5);

    const trackGroup = new THREE.Group();
    threeScene.add(trackGroup);

    // Parallel Rails
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x4a658a,
      metalness: 0.9,
      roughness: 0.2,
    });
    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 14), railMat);
    leftRail.position.set(-0.35, 0.04, -2.5);
    trackGroup.add(leftRail);

    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 14), railMat);
    rightRail.position.set(0.35, 0.04, -2.5);
    trackGroup.add(rightRail);

    // Sleepers / Ties along track
    const sleeperGeo = new THREE.BoxGeometry(1.1, 0.05, 0.12);
    const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x1f2e46 });
    for (let z = -9; z <= 4; z += 0.45) {
      const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
      sleeper.position.set(0, 0.025, z);
      trackGroup.add(sleeper);
    }

    // Segment Highlights (Two legs: Leg 1 = Delhi to Kanpur, Leg 2 = Kanpur to Patna)
    const segmentMeshes: THREE.Mesh[] = [];

    // Leg 1 block (Delhi -> Kanpur, z: 0 to -4)
    const seg1Geo = new THREE.BoxGeometry(0.8, 0.03, 4.2);
    const seg1Mat = new THREE.MeshStandardMaterial({
      color: 0x3d5a80,
      emissive: 0x1d3557,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.7,
    });
    const seg1 = new THREE.Mesh(seg1Geo, seg1Mat);
    seg1.position.set(0, 0.06, -0.2);
    trackGroup.add(seg1);
    segmentMeshes.push(seg1);

    // Leg 2 block (Kanpur -> Patna, z: -4.5 to -8.5)
    const seg2Geo = new THREE.BoxGeometry(0.8, 0.03, 4.2);
    const seg2Mat = new THREE.MeshStandardMaterial({
      color: 0xffc857,
      emissive: 0xffa000,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
    });
    const seg2 = new THREE.Mesh(seg2Geo, seg2Mat);
    seg2.position.set(0, 0.06, -4.6);
    trackGroup.add(seg2);
    segmentMeshes.push(seg2);

    // Platform Stations flanking track
    const stations = [
      { name: "NEW DELHI", z: 2.2, active: false },
      { name: "KANPUR", z: -2.4, active: true },
      { name: "PATNA", z: -6.8, active: true },
    ];

    stations.forEach((st) => {
      const platGeo = new THREE.BoxGeometry(0.7, 0.18, 2.2);
      const platMat = new THREE.MeshStandardMaterial({ color: 0x162644 });
      const plat = new THREE.Mesh(platGeo, platMat);
      plat.position.set(0.9, 0.09, st.z);
      trackGroup.add(plat);

      // Station Lamp Post with Pool of Light
      const lampGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8);
      const lampMat = new THREE.MeshStandardMaterial({ color: 0x8e9eb8 });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(1.1, 0.6, st.z);
      trackGroup.add(lamp);

      const lampLight = new THREE.PointLight(st.active ? 0xffc857 : 0x00f0ff, 1.2, 3);
      lampLight.position.set(1.1, 1.1, st.z);
      trackGroup.add(lampLight);
    });

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.8);
    threeScene.add(amb);

    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(4, 12, 6);
    threeScene.add(dir);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      trackGroup,
      segmentMeshes,
    };

    return () => {
      renderer.dispose();
    };
  }, [width, height, accent]);

  // Frame animation: Aerial tracking camera push
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    const t = frame * 0.015;
    s.camera.position.z = 4.5 - t * 0.4;
    s.camera.position.y = 10.5 + Math.sin(t) * 0.2;
    s.camera.lookAt(0, 0, -2.5 - t * 0.4);

    s.renderer.render(s.scene, s.camera);
  }, [frame]);

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

      {/* Top Header */}
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
        <span>{resolveSceneTag(scene, "06 / MULTI-LEG BITMASK ARCHITECTURE")}</span>
        <span style={{ color: "#FFC857" }}>SEAT 23 · KANPUR → PATNA</span>
      </div>

      {/* Editorial HUD Overlay for Stations and Legs */}
      <div
        style={{
          position: "absolute",
          bottom: "23%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 720,
          padding: "24px 32px",
          borderRadius: 16,
          background: "rgba(10, 24, 44, 0.9)",
          border: `1.5px solid ${accent}`,
          backdropFilter: "blur(10px)",
          zIndex: 20,
        }}
      >
        <div style={{ textAlign: "center", color: accent, fontFamily: "monospace", fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
          ONE PHYSICAL SEAT · MULTIPLE INDEPENDENT LEGS
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, padding: "12px", borderRadius: 8, background: "rgba(61,90,128,0.3)", border: "1px solid #3D5A80", textAlign: "center" }}>
            <div style={{ color: "#AFC4DF", fontSize: 18, fontFamily: "monospace" }}>LEG 1 [BIT 0]</div>
            <div style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 800 }}>DELHI → KANPUR</div>
            <div style={{ color: "#47D7A2", fontSize: 18, fontWeight: 700, marginTop: 4 }}>FREE / SOLD SEPARATELY</div>
          </div>
          <div style={{ flex: 1, padding: "12px", borderRadius: 8, background: "rgba(255,200,87,0.18)", border: "1.5px solid #FFC857", textAlign: "center" }}>
            <div style={{ color: "#FFC857", fontSize: 18, fontFamily: "monospace" }}>LEG 2 [BIT 1]</div>
            <div style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 800 }}>KANPUR → PATNA</div>
            <div style={{ color: "#FFC857", fontSize: 18, fontWeight: 800, marginTop: 4 }}>BOOKED BY YOU</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

