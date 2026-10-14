import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";

export const ThreeDGlobeNetwork: React.FC<{
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
    globeGroup: THREE.Group;
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
    camera.position.set(0, 0, 10);

    const globeGroup = new THREE.Group();
    threeScene.add(globeGroup);

    // 1. Wireframe Sphere
    const sphereGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x2d3748,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const wireSphere = new THREE.Mesh(sphereGeo, wireMat);
    globeGroup.add(wireSphere);

    // 2. Distributed Hub Nodes on surface
    const hubCount = 18;
    const hubGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const hubMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(accent) });

    const hubs: THREE.Vector3[] = [];
    for (let i = 0; i < hubCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / hubCount);
      const theta = Math.sqrt(hubCount * Math.PI) * phi;
      const x = 3.5 * Math.cos(theta) * Math.sin(phi);
      const y = 3.5 * Math.sin(theta) * Math.sin(phi);
      const z = 3.5 * Math.cos(phi);
      const pos = new THREE.Vector3(x, y, z);
      hubs.push(pos);

      const hubMesh = new THREE.Mesh(hubGeo, hubMat);
      hubMesh.position.copy(pos);
      globeGroup.add(hubMesh);
    }

    // 3. Arcs connecting hubs
    const arcMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(accent),
      transparent: true,
      opacity: 0.6,
    });

    for (let i = 0; i < hubs.length; i += 2) {
      const p1 = hubs[i];
      const p2 = hubs[(i + 3) % hubs.length];
      const mid = p1.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(4.5);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
      const arcLine = new THREE.Line(arcGeo, arcMat);
      globeGroup.add(arcLine);
    }

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      globeGroup,
    };

    return () => {
      renderer.dispose();
      sphereGeo.dispose();
      wireMat.dispose();
      hubGeo.dispose();
      hubMat.dispose();
      arcMat.dispose();
    };
  }, [width, height, accent]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Smooth rotation of globe
    s.globeGroup.rotation.y = (frame / 90) * Math.PI * 0.5;
    s.globeGroup.rotation.x = 0.25 * Math.sin(frame / 60);

    s.renderer.render(s.scene, s.camera);
  }, [frame]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />

      {/* Cinematic HUD */}
      <div
        style={{
          position: "absolute",
          top: 130,
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
            background: "rgba(14, 18, 30, 0.92)",
            backdropFilter: "blur(20px)",
            borderRadius: 20,
            padding: "18px 24px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 28,
              fontWeight: 800,
              color: accent,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {"GLOBAL DISTRIBUTED MESH"}
          </div>
          <div style={{ fontSize: 54, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.15 }}>
            {scene.title ?? "Multi-Region Edge Topology"}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
