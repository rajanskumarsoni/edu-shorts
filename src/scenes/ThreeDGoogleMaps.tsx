import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDGoogleMaps: React.FC<{
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
    phoneGroup: THREE.Group;
    gpsPuck: THREE.Group;
    routeLine: THREE.Line;
    routePoints: THREE.Vector3[];
    puckRing: THREE.Mesh;
    hudMesh: THREE.Mesh;
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
    threeScene.fog = new THREE.FogExp2(0x070b14, 0.04);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(2.6, 4.2, 7.8);
    camera.lookAt(0, 0.3, 0);

    const rootGroup = new THREE.Group();
    threeScene.add(rootGroup);

    // Studio lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    threeScene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.8);
    key.position.set(5, 8, 6);
    threeScene.add(key);
    const cyanLight = new THREE.DirectionalLight(new THREE.Color(accent), 2.5);
    cyanLight.position.set(-6, -2, -4);
    threeScene.add(cyanLight);

    // 1. Phone Body Group
    const phoneGroup = new THREE.Group();
    rootGroup.add(phoneGroup);
    phoneGroup.rotation.x = -0.38;
    phoneGroup.rotation.y = 0.28;
    phoneGroup.rotation.z = -0.08;

    // Metallic Titanium Frame (Realistic iPhone/Pixel styling)
    const phoneWidth = 3.2;
    const phoneHeight = 6.2;
    const phoneDepth = 0.22;
    const chassisGeo = new THREE.BoxGeometry(phoneWidth, phoneHeight, phoneDepth);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.95,
      roughness: 0.25,
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    phoneGroup.add(chassis);

    // Glossy Bezel border
    const bezelGeo = new THREE.BoxGeometry(phoneWidth - 0.12, phoneHeight - 0.12, phoneDepth + 0.01);
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      metalness: 0.8,
      roughness: 0.4,
    });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    phoneGroup.add(bezel);

    // Screen Canvas (Dynamic Map UI texture)
    const screenW = 1024;
    const screenH = 1920;
    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = screenW;
    screenCanvas.height = screenH;
    const sCtx = screenCanvas.getContext("2d")!;

    // Draw Dark Mode Vector Map on Canvas Texture
    sCtx.fillStyle = "#0D1322"; // Dark map water/land base
    sCtx.fillRect(0, 0, screenW, screenH);

    // Map Grid / Street Network
    sCtx.strokeStyle = "rgba(45, 60, 95, 0.6)";
    sCtx.lineWidth = 14;

    // Horizontal Avenues
    for (let y = 140; y < screenH; y += 180) {
      sCtx.beginPath();
      sCtx.moveTo(0, y);
      sCtx.lineTo(screenW, y);
      sCtx.stroke();
    }
    // Vertical Streets
    for (let x = 120; x < screenW; x += 190) {
      sCtx.beginPath();
      sCtx.moveTo(x, 0);
      sCtx.lineTo(x, screenH);
      sCtx.stroke();
    }

    // Main Arterial Highway (Glowing Dark Slate)
    sCtx.strokeStyle = "rgba(70, 90, 140, 0.8)";
    sCtx.lineWidth = 32;
    sCtx.beginPath();
    sCtx.moveTo(120, 200);
    sCtx.bezierCurveTo(450, 400, 200, 1200, 850, 1750);
    sCtx.stroke();

    // Secondary Roads
    sCtx.strokeStyle = "rgba(40, 55, 85, 0.7)";
    sCtx.lineWidth = 20;
    sCtx.beginPath();
    sCtx.moveTo(850, 100);
    sCtx.lineTo(250, 1850);
    sCtx.stroke();

    // Building Footprints (Blocks)
    sCtx.fillStyle = "rgba(22, 32, 54, 0.85)";
    sCtx.strokeStyle = "rgba(40, 60, 95, 0.4)";
    sCtx.lineWidth = 4;
    for (let x = 145; x < screenW - 145; x += 190) {
      for (let y = 165; y < screenH - 165; y += 180) {
        sCtx.fillRect(x, y, 140, 130);
        sCtx.strokeRect(x, y, 140, 130);
      }
    }

    // Street Names in crisp English
    sCtx.fillStyle = "#64748B";
    sCtx.font = "bold 20px sans-serif";
    sCtx.fillText("MISSION BLVD", 200, 310);
    sCtx.fillText("MARKET STREET", 480, 670);
    sCtx.fillText("PINE AVENUE", 250, 1030);
    sCtx.fillText("EXPRESSWAY 101", 620, 1390);

    // Top Navigation Header (Google Maps HUD)
    sCtx.fillStyle = "rgba(15, 23, 42, 0.94)";
    sCtx.beginPath();
    sCtx.roundRect(40, 60, screenW - 80, 140, 24);
    sCtx.fill();
    sCtx.strokeStyle = accent;
    sCtx.lineWidth = 3;
    sCtx.stroke();

    // Top Header: Turn Arrow & Direction
    sCtx.fillStyle = accent;
    sCtx.font = "bold 44px sans-serif";
    sCtx.fillText("↗ In 250m, Turn Right", 80, 125);
    sCtx.fillStyle = "#94A3B8";
    sCtx.font = "bold 28px sans-serif";
    sCtx.fillText("onto Market St · Toward Destination", 80, 170);

    // Bottom Navigation Bar
    sCtx.fillStyle = "rgba(15, 23, 42, 0.94)";
    sCtx.beginPath();
    sCtx.roundRect(40, screenH - 240, screenW - 80, 170, 28);
    sCtx.fill();
    sCtx.strokeStyle = "rgba(0, 240, 255, 0.4)";
    sCtx.lineWidth = 3;
    sCtx.stroke();

    // ETA Details
    sCtx.fillStyle = "#10B981"; // Emerald green ETA
    sCtx.font = "bold 56px sans-serif";
    sCtx.fillText("18 min", 80, screenH - 150);

    sCtx.fillStyle = "#F8FAFC";
    sCtx.font = "bold 34px sans-serif";
    sCtx.fillText("(12.4 km) · 10:45 AM", 290, screenH - 150);

    sCtx.fillStyle = "#94A3B8";
    sCtx.font = "bold 26px sans-serif";
    sCtx.fillText("Fastest Route · Normal Traffic Flow", 80, screenH - 95);

    // Red Close / Exit Button
    sCtx.fillStyle = "#EF4444";
    sCtx.beginPath();
    sCtx.arc(screenW - 110, screenH - 155, 38, 0, Math.PI * 2);
    sCtx.fill();
    sCtx.fillStyle = "#FFFFFF";
    sCtx.font = "bold 36px sans-serif";
    sCtx.textAlign = "center";
    sCtx.fillText("✕", screenW - 110, screenH - 142);
    sCtx.textAlign = "left";

    const screenTex = new THREE.CanvasTexture(screenCanvas);
    const screenGeo = new THREE.PlaneGeometry(phoneWidth - 0.22, phoneHeight - 0.22);
    const screenMat = new THREE.MeshBasicMaterial({
      map: screenTex,
      side: THREE.DoubleSide,
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = phoneDepth / 2 + 0.01;
    phoneGroup.add(screenMesh);

    // 2. Real 3D Neon Route Polyline (winding across 3D space above the screen)
    const routePoints = [
      new THREE.Vector3(-0.8, -2.1, phoneDepth / 2 + 0.04),
      new THREE.Vector3(-0.8, -1.2, phoneDepth / 2 + 0.04),
      new THREE.Vector3(-0.2, -1.2, phoneDepth / 2 + 0.04),
      new THREE.Vector3(-0.2, 0.4, phoneDepth / 2 + 0.04),
      new THREE.Vector3(0.7, 0.4, phoneDepth / 2 + 0.04),
      new THREE.Vector3(0.7, 1.8, phoneDepth / 2 + 0.04),
    ];
    const curve = new THREE.CatmullRomCurve3(routePoints, false, "catmullrom", 0.1);
    const sampledPoints = curve.getPoints(80);
    const routeGeo = new THREE.BufferGeometry().setFromPoints(sampledPoints);
    const routeMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(accent),
      linewidth: 6,
    });
    const routeLine = new THREE.Line(routeGeo, routeMat);
    phoneGroup.add(routeLine);

    // Glowing thick tube around the route
    const tubeGeo = new THREE.TubeGeometry(curve, 80, 0.045, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accent),
      emissive: new THREE.Color(accent),
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    phoneGroup.add(tubeMesh);

    // 3. Pulsing GPS Location Puck
    const gpsPuck = new THREE.Group();
    phoneGroup.add(gpsPuck);

    // Center Blue Puck Circle
    const puckCoreGeo = new THREE.CircleGeometry(0.12, 32);
    const puckCoreMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
    });
    const puckCore = new THREE.Mesh(puckCoreGeo, puckCoreMat);
    puckCore.position.z = phoneDepth / 2 + 0.07;
    gpsPuck.add(puckCore);

    // Puck Arrow Tip
    const arrowGeo = new THREE.ConeGeometry(0.09, 0.18, 16);
    arrowGeo.rotateZ(-Math.PI / 2);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    arrowMesh.position.set(0, 0.1, phoneDepth / 2 + 0.08);
    gpsPuck.add(arrowMesh);

    // Expanding Pulse Radar Wave
    const ringGeo = new THREE.RingGeometry(0.14, 0.26, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const puckRing = new THREE.Mesh(ringGeo, ringMat);
    puckRing.position.z = phoneDepth / 2 + 0.06;
    gpsPuck.add(puckRing);

    // Destination Pin (Red 3D Map Pin)
    const pinGroup = new THREE.Group();
    pinGroup.position.set(0.7, 1.8, phoneDepth / 2 + 0.08);
    phoneGroup.add(pinGroup);

    const pinHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.8 })
    );
    pinHead.position.y = 0.2;
    pinGroup.add(pinHead);

    const pinCone = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.24, 24),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.8 })
    );
    pinCone.rotation.x = Math.PI;
    pinCone.position.y = 0.08;
    pinGroup.add(pinCone);

    // 4. Floating Holographic HUD Telemetry Card (Outside phone, angled in 3D)
    const hudCanvas = document.createElement("canvas");
    hudCanvas.width = 480;
    hudCanvas.height = 180;
    const hCtx = hudCanvas.getContext("2d")!;

    hCtx.fillStyle = "rgba(11, 16, 32, 0.92)";
    hCtx.strokeStyle = accent;
    hCtx.lineWidth = 4;
    hCtx.beginPath();
    hCtx.roundRect(8, 8, 464, 164, 20);
    hCtx.fill();
    hCtx.stroke();

    hCtx.fillStyle = accent;
    hCtx.font = "bold 26px monospace";
    hCtx.fillText("NAVIGATION ENGINE", 24, 46);

    hCtx.fillStyle = "#F8FAFC";
    hCtx.font = "bold 32px sans-serif";
    hCtx.fillText("A* Graph Latency: 38ms", 24, 96);

    hCtx.fillStyle = "#10B981";
    hCtx.font = "bold 24px monospace";
    hCtx.fillText("● Live GPS Stream Active", 24, 142);

    const hudTex = new THREE.CanvasTexture(hudCanvas);
    const hudMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 0.82),
      new THREE.MeshBasicMaterial({ map: hudTex, transparent: true, side: THREE.DoubleSide })
    );
    hudMesh.position.set(-1.6, 0.4, 1.4);
    hudMesh.rotation.y = 0.35;
    rootGroup.add(hudMesh);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      phoneGroup,
      gpsPuck,
      routeLine,
      routePoints,
      puckRing,
      hudMesh,
    };

    return () => {
      renderer.dispose();
      stateRef.current = null;
    };
  }, [width, height, accent]);

  // Frame animation loop
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Smooth phone float & slight rotation
    const t = frame * 0.025;
    s.phoneGroup.position.y = Math.sin(t) * 0.12;
    s.phoneGroup.rotation.y = 0.28 + Math.cos(t * 0.8) * 0.06;

    // Animate GPS puck along the route
    const progress = (frame % 150) / 150;
    const p1 = s.routePoints[0];
    const p2 = s.routePoints[1];
    const p3 = s.routePoints[2];
    const p4 = s.routePoints[3];
    const p5 = s.routePoints[4];
    const p6 = s.routePoints[5];

    let currentPos = new THREE.Vector3();
    if (progress < 0.2) {
      currentPos.lerpVectors(p1, p2, progress / 0.2);
    } else if (progress < 0.4) {
      currentPos.lerpVectors(p2, p3, (progress - 0.2) / 0.2);
    } else if (progress < 0.6) {
      currentPos.lerpVectors(p3, p4, (progress - 0.4) / 0.2);
    } else if (progress < 0.8) {
      currentPos.lerpVectors(p4, p5, (progress - 0.6) / 0.2);
    } else {
      currentPos.lerpVectors(p5, p6, (progress - 0.8) / 0.2);
    }

    s.gpsPuck.position.set(currentPos.x, currentPos.y, 0);

    // Puck Radar wave expansion
    const waveScale = 1.0 + (frame % 30) * 0.08;
    s.puckRing.scale.set(waveScale, waveScale, 1);
    (s.puckRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.8 - (frame % 30) * 0.025);

    // Floating HUD slight bobbing
    s.hudMesh.position.y = 0.4 + Math.sin(t * 1.2) * 0.08;

    s.renderer.render(s.scene, s.camera);
  }, [frame]);

  const tag = resolveSceneTag(scene, "01 / NAVIGATION CORE");

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

      {/* Top Tag & Title Header */}
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
        {tag && (
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
        )}
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
      </div>

      {/* Bottom Telemetry Metrics Bar */}
      {scene.metrics && Object.keys(scene.metrics).length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 380, // Elevated well above Devanagari captions
            left: 60,
            right: 60,
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(Object.keys(scene.metrics).length, 3)}, 1fr)`,
            gap: 16,
            background: "rgba(11, 16, 32, 0.85)",
            backdropFilter: "blur(16px)",
            border: `1.5px solid ${accent}44`,
            borderRadius: 20,
            padding: "20px 24px",
            pointerEvents: "none",
          }}
        >
          {Object.entries(scene.metrics).map(([label, val]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "monospace", fontSize: 20, color: "#94A3B8", fontWeight: 700 }}>
                {label.toUpperCase()}
              </span>
              <span style={{ fontFamily: "sans-serif", fontSize: 32, color: accent, fontWeight: 900 }}>
                {val}
              </span>
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};
