import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDTelemetryGauge: React.FC<{
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
    needleGroup: THREE.Group;
    dialGroup: THREE.Group;
    shockwave: THREE.Mesh;
    readoutMesh: THREE.Mesh;
    readoutCanvas: HTMLCanvasElement;
    readoutCtx: CanvasRenderingContext2D;
    readoutTexture: THREE.CanvasTexture;
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

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 9.8);
    camera.lookAt(0, 0, 0);

    const dialGroup = new THREE.Group();
    dialGroup.scale.set(0.62, 0.62, 0.62);
    dialGroup.position.set(0, 0.15, 0);
    threeScene.add(dialGroup);

    // 1. Heavy 3D Metallic Bezel Housing
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x0f172a,
      emissiveIntensity: 0.4,
    });
    const bezelRim = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.22, 16, 64), bezelMat);
    dialGroup.add(bezelRim);

    // Dark dial faceplate
    const faceMat = new THREE.MeshStandardMaterial({
      color: 0x0b1020,
      metalness: 0.8,
      roughness: 0.25,
    });
    const faceplate = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.9, 0.1, 48), faceMat);
    faceplate.rotation.x = Math.PI / 2;
    faceplate.position.z = -0.08;
    dialGroup.add(faceplate);

    // 2. Radial Glowing Neon Ticks (Arc from -140 deg to +140 deg)
    const tickMat = new THREE.MeshBasicMaterial({ color: 0x58d6c2 });
    for (let i = 0; i <= 24; i++) {
      const ang = -Math.PI * 0.75 + (i / 24) * Math.PI * 1.5;
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.04), tickMat);
      tick.rotation.z = ang - Math.PI / 2;
      tick.position.set(Math.cos(ang) * 2.5, Math.sin(ang) * 2.5, 0.05);
      dialGroup.add(tick);
    }

    // 3. 3D Sweeping Needle
    const needleGroup = new THREE.Group();
    needleGroup.position.z = 0.12;
    dialGroup.add(needleGroup);

    // Needle blade
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.9,
      metalness: 0.9,
    });
    const needleBlade = new THREE.Mesh(new THREE.ConeGeometry(0.12, 2.2, 4), bladeMat);
    needleBlade.position.y = 1.1;
    needleGroup.add(needleBlade);

    // Needle pivot hub
    const hubMat = new THREE.MeshStandardMaterial({
      color: 0xffc857,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0x553300,
      emissiveIntensity: 0.6,
    });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.22, 24), hubMat);
    hub.rotation.x = Math.PI / 2;
    needleGroup.add(hub);

    // 4. Center 3D Digital Readout Canvas Texture
    const readoutCanvas = document.createElement("canvas");
    readoutCanvas.width = 400;
    readoutCanvas.height = 200;
    const readoutCtx = readoutCanvas.getContext("2d")!;
    const readoutTexture = new THREE.CanvasTexture(readoutCanvas);

    const readoutMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 1.2),
      new THREE.MeshBasicMaterial({ map: readoutTexture, transparent: true, side: THREE.DoubleSide })
    );
    readoutMesh.position.set(0, -1.2, 0.15);
    dialGroup.add(readoutMesh);

    // 5. Touchdown Shockwave Ring
    const shockwaveGeo = new THREE.RingGeometry(0.2, 0.35, 48);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const shockwave = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwave.position.z = 0.05;
    dialGroup.add(shockwave);

    // Lights
    threeScene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 1.8);
    dir.position.set(4, 6, 8);
    threeScene.add(dir);

    const cyanPoint = new THREE.PointLight(0x00f0ff, 3.5, 12);
    cyanPoint.position.set(0, 0, 2);
    threeScene.add(cyanPoint);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      needleGroup,
      dialGroup,
      shockwave,
      readoutMesh,
      readoutCanvas,
      readoutCtx,
      readoutTexture,
    };

    return () => {
      renderer.dispose();
      bezelRim.geometry.dispose();
      faceplate.geometry.dispose();
      needleBlade.geometry.dispose();
      hub.geometry.dispose();
      shockwaveGeo.dispose();
    };
  }, [width, height, accent]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Needle sweep spring animation: reaches 1.8s around frame 35 with energetic rebound!
    const needleSpring = spring({
      frame,
      fps,
      config: { damping: 9, stiffness: 120 },
    });

    // Angle: from start (-135 deg = 2.35 rad) to 1.8s mark (+15 deg = -0.26 rad)
    const startAng = Math.PI * 0.75;
    const targetAng = -Math.PI * 0.1;
    const currentAng = interpolate(needleSpring, [0, 1], [startAng, targetAng]);
    s.needleGroup.rotation.z = currentAng - Math.PI / 2;

    // Shockwave trigger on touchdown (frame >= 35)
    if (frame >= 35) {
      const swT = interpolate(frame, [35, 75], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      s.shockwave.scale.setScalar(1.0 + swT * 7.0);
      (s.shockwave.material as THREE.MeshBasicMaterial).opacity = (1 - swT) * 0.8;
    }

    // Dynamic 3D dial tilt
    s.dialGroup.rotation.x = 0.15 + Math.cos(frame * 0.02) * 0.05;
    s.dialGroup.rotation.y = Math.sin(frame * 0.015) * 0.15;

    // Draw dynamic digital readout text
    const ctx = s.readoutCtx;
    const w = s.readoutCanvas.width;
    const h = s.readoutCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const currentSec = (needleSpring * 1.8).toFixed(1);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 68px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${currentSec}s`, w / 2, 75);

    ctx.fillStyle = "#27C93F";
    ctx.font = "bold 24px monospace";
    ctx.fillText("SETTLEMENT CONFIRMED", w / 2, 125);

    s.readoutTexture.needsUpdate = true;
    s.renderer.render(s.scene, s.camera);
  }, [frame, fps]);

  const hudOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1020" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />

      {/* Cinematic HUD */}
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
              {resolveSceneTag(scene, "10 / SUB-2S CLEARING SPEED")}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "#27C93F",
                letterSpacing: 2,
              }}
            >
              100% ATOMIC SUCCESS
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
              {scene.title || "End-to-End Latency"}
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
              DISPATCH TO CONFIRMATION: 1.8 SECONDS
            </div>
          </div>
        </div>

        {/* Lower Telemetry Pill */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            background: "rgba(14, 20, 36, 0.88)",
            backdropFilter: "blur(20px)",
            padding: "18px 28px",
            borderRadius: 18,
            border: "1px solid rgba(0, 240, 255, 0.25)",
            marginBottom: 90,
          }}
        >
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: "#94a3b8" }}>ROUNDTRIP LATENCY</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: accent }}>1.80 Seconds</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: "#27C93F" }}>STATUS CODE</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#27C93F" }}>HTTP 200 OK</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
