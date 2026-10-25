import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

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
    earthMesh: THREE.Mesh;
    atmoMesh: THREE.Mesh;
    wireSphere: THREE.Mesh;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);

    const threeScene = new THREE.Scene();
    threeScene.fog = new THREE.FogExp2(0x070b14, 0.035);

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    camera.position.set(0, 0, 10.2);

    const globeGroup = new THREE.Group();
    threeScene.add(globeGroup);

    // Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    threeScene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(6, 4, 8);
    threeScene.add(sunLight);
    const rimLight = new THREE.DirectionalLight(new THREE.Color(accent), 2.5);
    rimLight.position.set(-8, -2, -6);
    threeScene.add(rimLight);

    // 1. Procedural High-Res Earth Texture on Canvas
    const texW = 2048;
    const texH = 1024;
    const texCanvas = document.createElement("canvas");
    texCanvas.width = texW;
    texCanvas.height = texH;
    const tCtx = texCanvas.getContext("2d")!;

    // Deep Navy Ocean base
    const oceanGrad = tCtx.createLinearGradient(0, 0, 0, texH);
    oceanGrad.addColorStop(0, "#081B38");
    oceanGrad.addColorStop(0.5, "#0F2854");
    oceanGrad.addColorStop(1, "#081B38");
    tCtx.fillStyle = oceanGrad;
    tCtx.fillRect(0, 0, texW, texH);

    // Detailed Continents (Emerald green + topographic gold landmasses)
    tCtx.fillStyle = "#15803D"; // Vibrant continent green
    tCtx.strokeStyle = "#22C55E";
    tCtx.lineWidth = 4;

    // Helper: Draw continent blob
    const drawLand = (x: number, y: number, w: number, h: number, r: number) => {
      tCtx.beginPath();
      tCtx.roundRect(x, y, w, h, r);
      tCtx.fill();
      tCtx.stroke();
    };

    // North America
    drawLand(280, 220, 360, 260, 60);
    drawLand(360, 380, 180, 160, 40);
    // South America
    drawLand(460, 560, 220, 340, 50);
    // Europe
    drawLand(920, 200, 260, 200, 40);
    // Africa
    drawLand(940, 420, 300, 380, 70);
    // Asia
    drawLand(1200, 180, 520, 360, 80);
    drawLand(1320, 420, 280, 240, 50); // India / SE Asia
    // Australia
    drawLand(1560, 660, 260, 200, 50);

    // Latitude & Longitude Coordinate Lines (Mercator Grid)
    tCtx.strokeStyle = "rgba(0, 240, 255, 0.4)";
    tCtx.lineWidth = 3;
    for (let lat = 100; lat < texH; lat += 120) {
      tCtx.beginPath();
      tCtx.moveTo(0, lat);
      tCtx.lineTo(texW, lat);
      tCtx.stroke();
    }
    for (let lng = 100; lng < texW; lng += 160) {
      tCtx.beginPath();
      tCtx.moveTo(lng, 0);
      tCtx.lineTo(lng, texH);
      tCtx.stroke();
    }

    // Glowing Golden Night Lights across continents
    tCtx.fillStyle = "#FDE047";
    for (let i = 0; i < 280; i++) {
      const lx = (i * 73) % texW;
      const ly = (i * 97) % texH;
      tCtx.beginPath();
      tCtx.arc(lx, ly, 2.5, 0, Math.PI * 2);
      tCtx.fill();
    }

    const earthTex = new THREE.CanvasTexture(texCanvas);
    earthTex.wrapS = THREE.RepeatWrapping;
    earthTex.wrapT = THREE.ClampToEdgeWrapping;

    // Solid Earth Sphere with Realistic Lighting
    const sphereRadius = 3.4;
    const earthGeo = new THREE.SphereGeometry(sphereRadius, 48, 48);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.6,
      metalness: 0.2,
      emissive: new THREE.Color(0x021124),
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // Glowing Atmospheric Halo Shell
    const atmoGeo = new THREE.SphereGeometry(sphereRadius + 0.18, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accent),
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    globeGroup.add(atmoMesh);

    // Wireframe Coordinate Shell (Web Mercator Projection Grid)
    const wireGeo = new THREE.SphereGeometry(sphereRadius + 0.04, 32, 32);
    const wireMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accent),
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const wireSphere = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireSphere);

    // Equator Ring
    const eqGeo = new THREE.RingGeometry(sphereRadius + 0.08, sphereRadius + 0.14, 64);
    const eqMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accent),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const eqRing = new THREE.Mesh(eqGeo, eqMat);
    eqRing.rotation.x = Math.PI / 2;
    globeGroup.add(eqRing);

    // Mercator Projection Cylinder wrapping Earth (Visualizes: 3D Sphere -> Cylinder -> 2D Flat Phone)
    const cylGeo = new THREE.CylinderGeometry(sphereRadius + 0.35, sphereRadius + 0.35, sphereRadius * 2.1, 32, 1, true);
    const cylMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      wireframe: true,
      transparent: true,
      opacity: 0.32,
    });
    const cylMesh = new THREE.Mesh(cylGeo, cylMat);
    globeGroup.add(cylMesh);

    // Orbiting Satellites with Light Arcs
    const hubCount = 14;
    const hubGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const hubMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const hubs: THREE.Vector3[] = [];
    for (let i = 0; i < hubCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / hubCount);
      const theta = Math.sqrt(hubCount * Math.PI) * phi;
      const x = (sphereRadius + 0.6) * Math.cos(theta) * Math.sin(phi);
      const y = (sphereRadius + 0.6) * Math.sin(theta) * Math.sin(phi);
      const z = (sphereRadius + 0.6) * Math.cos(phi);
      const pos = new THREE.Vector3(x, y, z);
      hubs.push(pos);

      const hubMesh = new THREE.Mesh(hubGeo, hubMat);
      hubMesh.position.copy(pos);
      globeGroup.add(hubMesh);
    }

    // Glowing Laser Arcs between satellites
    const arcMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(accent),
      transparent: true,
      opacity: 0.6,
      linewidth: 3,
    });
    for (let i = 0; i < hubs.length; i += 2) {
      const p1 = hubs[i];
      const p2 = hubs[(i + 3) % hubs.length];
      const mid = p1.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(sphereRadius + 1.2);
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
      earthMesh,
      atmoMesh,
      wireSphere,
    };

    return () => {
      renderer.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      earthTex.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      eqGeo.dispose();
      eqMat.dispose();
      hubGeo.dispose();
      hubMat.dispose();
      arcMat.dispose();
    };
  }, [width, height, accent]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Smooth rotation of globe
    s.globeGroup.rotation.y = frame * 0.016;
    s.globeGroup.rotation.x = 0.22 + Math.sin(frame * 0.01) * 0.05;

    s.renderer.render(s.scene, s.camera);
  }, [frame]);

  const tag = resolveSceneTag(scene, "03 / EARTH TO 2D PLANE");

  return (
    <AbsoluteFill style={{ backgroundColor: "#070B14", overflow: "hidden" }}>
      {/* 3D WebGL Canvas */}
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

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 28,
            fontWeight: 800,
            color: accent,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {tag}
        </span>
        {scene.title && (
          <h2
            style={{
              fontFamily: "sans-serif",
              fontSize: 54,
              fontWeight: 900,
              color: "#FFFFFF",
              margin: 0,
              lineHeight: 1.15,
              textShadow: "0 4px 24px rgba(0,0,0,0.8)",
            }}
          >
            {scene.title}
          </h2>
        )}

        {/* Physical Comparison Card: 3D Sphere vs 2D Flat Glass */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 10,
          }}
        >
          <div
            style={{
              background: "rgba(15, 23, 42, 0.9)",
              border: `1.5px solid ${accent}`,
              borderRadius: 14,
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>🌐</span>
            <span style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 800, color: accent }}>
              3D SPHERE (EARTH)
            </span>
          </div>

          <span style={{ fontSize: 20, color: "#FBBF24", fontWeight: 900 }}>➔</span>

          <div
            style={{
              background: "rgba(15, 23, 42, 0.9)",
              border: "1.5px solid #F59E0B",
              borderRadius: 14,
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>📱</span>
            <span style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 800, color: "#FBBF24" }}>
              2D FLAT GLASS (PHONE)
            </span>
          </div>
        </div>
      </div>

      {/* Telemetry Badge at Bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 380,
          left: 60,
          right: 60,
          background: "rgba(15, 23, 42, 0.88)",
          backdropFilter: "blur(16px)",
          border: `2px solid ${accent}66`,
          borderRadius: 22,
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: "monospace", fontSize: 18, color: "#94A3B8", fontWeight: 700 }}>
            3D SPHERE ➔ 2D PLANE PROJECTION
          </span>
          <span style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF" }}>
            Web Mercator (EPSG:3857)
          </span>
        </div>
        <div
          style={{
            background: "rgba(0, 240, 255, 0.15)",
            border: `1.5px solid ${accent}`,
            borderRadius: 14,
            padding: "10px 18px",
            fontFamily: "monospace",
            fontSize: 20,
            fontWeight: 900,
            color: accent,
          }}
        >
          CONFORMAL
        </div>
      </div>
    </AbsoluteFill>
  );
};
