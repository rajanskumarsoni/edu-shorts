import React, { useRef, useEffect } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { useLayout } from "../layout";
import { RevealText } from "../Reveal";
import { MotionGraphic } from "../MotionGraphic";
import { resolveSceneTag } from "../theme";
import { ThreeDUPIHook } from "./ThreeDUPIHook";
import { AmazonShoppingHook } from "./AmazonShoppingHook";
import { RefrigeratorVisualizer } from "./RefrigeratorVisualizer";

const NeuralBrainHologram3D: React.FC<{ accent: string }> = ({ accent }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    nodes: THREE.Mesh[];
    rings: THREE.Mesh[];
    lineSegments: THREE.LineSegments;
    pulses: THREE.Mesh[];
    grid: THREE.GridHelper;
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 14);

    // Neon coordinate grid on ground: matches "Pitch dark void with neon coordinate grid spanning the ground"
    const grid = new THREE.GridHelper(30, 24, new THREE.Color(accent), 0x16233b);
    grid.position.y = -4.5;
    scene.add(grid);

    // Ambient and pulsing Point Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(new THREE.Color(accent), 3.0, 40);
    pointLight.position.set(0, 3, 10);
    scene.add(pointLight);

    // 3D Neural Network Graph: 4 Distinct Multi-Layer Columns
    const layerSizes = [3, 5, 5, 2];
    const layerXSpacing = 2.8;
    const nodeYSpacing = 1.5;
    const startX = -((layerSizes.length - 1) * layerXSpacing) / 2;

    const nodePositions: THREE.Vector3[][] = [];
    const allNodePositions: THREE.Vector3[] = [];
    const nodeMeshes: THREE.Mesh[] = [];
    const ringMeshes: THREE.Mesh[] = [];

    const sphereGeo = new THREE.SphereGeometry(0.28, 20, 20);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accent),
      emissive: new THREE.Color(accent),
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.85,
    });

    const ringGeo = new THREE.RingGeometry(0.40, 0.48, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(accent),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });

    layerSizes.forEach((count, lIdx) => {
      const layerNodes: THREE.Vector3[] = [];
      const x = startX + lIdx * layerXSpacing;
      const startY = -((count - 1) * nodeYSpacing) / 2;

      for (let nIdx = 0; nIdx < count; nIdx++) {
        const y = startY + nIdx * nodeYSpacing;
        const z = (Math.sin(lIdx * 1.6 + nIdx) * 0.3);
        const pos = new THREE.Vector3(x, y, z);
        layerNodes.push(pos);
        allNodePositions.push(pos);

        const mesh = new THREE.Mesh(sphereGeo, nodeMat.clone());
        mesh.position.copy(pos);
        scene.add(mesh);
        nodeMeshes.push(mesh);

        // Add glowing cyan halo ring to every node
        const ring = new THREE.Mesh(ringGeo, ringMat.clone());
        ring.position.copy(pos);
        scene.add(ring);
        ringMeshes.push(ring);
      }
      nodePositions.push(layerNodes);
    });

    // Synaptic Connection Lines: Connect adjacent layer columns
    const linePoints: THREE.Vector3[] = [];
    for (let l = 0; l < nodePositions.length - 1; l++) {
      const currentLayer = nodePositions[l];
      const nextLayer = nodePositions[l + 1];
      for (const p1 of currentLayer) {
        for (const p2 of nextLayer) {
          linePoints.push(p1);
          linePoints.push(p2);
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(accent),
      transparent: true,
      opacity: 0.45,
    });
    const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineSegments);

    // Forward Activation Energy Pulses
    const pulseCount = 18;
    const pulseGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pulseMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < pulseCount; i++) {
      const pMesh = new THREE.Mesh(pulseGeo, pulseMat);
      scene.add(pMesh);
      pulseMeshes.push(pMesh);
    }

    stateRef.current = {
      renderer,
      scene,
      camera,
      nodes: nodeMeshes,
      rings: ringMeshes,
      lineSegments,
      pulses: pulseMeshes,
      grid,
    };

    return () => {
      renderer.dispose();
      sphereGeo.dispose();
      nodeMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      pulseGeo.dispose();
      pulseMat.dispose();
    };
  }, [width, height, accent]);

  // Frame animation update loop
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Cinematic camera forward dolly-in through frontal lobes into core
    const p = frame / Math.max(1, durationInFrames);
    const camZ = interpolate(p, [0, 0.85, 1], [14, 5.0, 2.2], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    s.camera.position.z = camZ;
    s.camera.position.x = Math.sin(frame * 0.015) * 1.2;
    s.camera.position.y = Math.cos(frame * 0.015) * 0.6;
    s.camera.lookAt(0, 0, 0);

    // Rotate neural brain cluster
    s.nodes.forEach((node, i) => {
      const pulse = 1 + 0.18 * Math.sin(frame / 6 + i);
      node.scale.set(pulse, pulse, pulse);
    });

    s.rings.forEach((ring, i) => {
      ring.lookAt(s.camera.position);
      const ringScale = 1 + 0.25 * Math.sin(frame / 5 + i);
      ring.scale.set(ringScale, ringScale, ringScale);
    });

    // Move forward activation pulses along synapses
    const totalLines = s.lineSegments.geometry.attributes.position.count / 2;
    if (totalLines > 0) {
      s.pulses.forEach((pulse, i) => {
        const lineIdx = Math.floor(
          (i * (totalLines / s.pulses.length) + frame * 0.3) % totalLines
        );
        const posAttr = s.lineSegments.geometry.attributes.position;
        const x1 = posAttr.getX(lineIdx * 2);
        const y1 = posAttr.getY(lineIdx * 2);
        const z1 = posAttr.getZ(lineIdx * 2);
        const x2 = posAttr.getX(lineIdx * 2 + 1);
        const y2 = posAttr.getY(lineIdx * 2 + 1);
        const z2 = posAttr.getZ(lineIdx * 2 + 1);

        const frac = ((frame * 0.06 + i * 0.25) % 1);
        pulse.position.set(
          x1 + (x2 - x1) * frac,
          y1 + (y2 - y1) * frac,
          z1 + (z2 - z1) * frac
        );
      });
    }

    s.renderer.render(s.scene, s.camera);
  }, [frame, durationInFrames]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", zIndex: 0 }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </AbsoluteFill>
  );
};

export const Hook: React.FC<{ scene: SceneSpec; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = useLayout();

  // Detect whether to render 3D UPI QR Scanner Hook
  const isUPIHook =
    scene.variant === "upi_hook_3d" ||
    scene.graphic === "upi_hook_3d" ||
    (scene.icon === "smartphone" && /upi|qr|payment|scanner/i.test(scene.text || "")) ||
    /upi|qr code|coffee shop/i.test(scene.text || "");

  if (isUPIHook) {
    return <ThreeDUPIHook scene={scene} accent={accent} />;
  }

  // Detect whether to render Amazon Shopping App Hook
  const isAmazonHook =
    scene.variant === "amazon_shopping" ||
    scene.graphic === "amazon" ||
    scene.graphic === "amazon_shopping" ||
    /amazon|shopping/i.test(scene.variant || "") ||
    /amazon|shopping/i.test(scene.graphic || "");

  if (isAmazonHook) {
    return <AmazonShoppingHook scene={scene} accent={accent} />;
  }

  const isFridgeHook =
    scene.variant === "hook_fridge" ||
    scene.graphic === "refrigerator" ||
    /fridge|refrigerator/i.test(scene.variant || "") ||
    /fridge|refrigerator/i.test(scene.graphic || "");

  if (isFridgeHook) {
    return <RefrigeratorVisualizer scene={{ ...scene, variant: "hook_fridge" }} accent={accent} />;
  }

  // Entrance spring
  const intro = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });
  const pulse = (Math.sin(frame / 6) + 1) / 2;
  const rot = frame * 1.5;

  // Resolve dynamic high-contrast tracked header tag
  const tagText = resolveSceneTag(scene, "01 // SYSTEM SIGNAL");

  // Detect whether to render 3D Neural Brain Hologram
  const isNeuralBrain =
    scene.icon === "brain" ||
    scene.graphic === "neural_network_3d" ||
    scene.visual?.objects.some((o) => /brain|neural|synap/i.test(o));

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: `${L.padTop}px ${L.padX}px ${L.padBottom}px`,
      }}
    >
      {/* 3D Neural Brain Hologram WebGL Environment */}
      {isNeuralBrain ? (
        <NeuralBrainHologram3D accent={accent} />
      ) : (
        /* Fallback: Animated Concentric Radar Rings & Crosshairs */
        <div
          style={{
            position: "absolute",
            width: 720,
            height: 720,
            borderRadius: "50%",
            pointerEvents: "none",
            opacity: 0.35 * intro,
            transform: `scale(${0.9 + 0.1 * intro})`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <svg width="720" height="720" viewBox="0 0 720 720" style={{ position: "absolute" }}>
            <circle
              cx="360"
              cy="360"
              r="320"
              fill="none"
              stroke={accent}
              strokeWidth="2"
              strokeDasharray="8 12"
              transform={`rotate(${rot} 360 360)`}
              opacity="0.6"
            />
            <circle
              cx="360"
              cy="360"
              r={240 + pulse * 25}
              fill="none"
              stroke={accent}
              strokeWidth="3"
              opacity={0.4 + 0.3 * (1 - pulse)}
            />
            <circle
              cx="360"
              cy="360"
              r="160"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="2"
            />
            <line x1="360" y1="20" x2="360" y2="120" stroke={accent} strokeWidth="2.5" />
            <line x1="360" y1="600" x2="360" y2="700" stroke={accent} strokeWidth="2.5" />
            <line x1="20" y1="360" x2="120" y2="360" stroke={accent} strokeWidth="2.5" />
            <line x1="600" y1="360" x2="700" y2="360" stroke={accent} strokeWidth="2.5" />
          </svg>
        </div>
      )}

      {/* Top Tracked Sub-Tag with Pulsing Radar Beacon */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 24px",
          borderRadius: 999,
          background: "rgba(11, 16, 32, 0.85)",
          backdropFilter: "blur(12px)",
          border: `1.5px solid ${accent}88`,
          boxShadow: `0 0 30px ${accent}33`,
          marginBottom: 36,
          opacity: intro,
          transform: `translateY(${(1 - intro) * 20}px)`,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 16px ${accent}`,
            transform: `scale(${0.8 + 0.4 * pulse})`,
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

      {/* Dynamic Animated Topic Motion Graphic & Overhead Glowing Question Mark */}
      <div style={{ position: "relative", zIndex: 2, marginBottom: 44 }}>
        {isNeuralBrain && (
          <div
            style={{
              position: "absolute",
              top: -32,
              left: "50%",
              transform: `translateX(-50%) scale(${0.9 + 0.2 * pulse})`,
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(11, 16, 32, 0.95)",
              border: `2px solid ${accent}`,
              boxShadow: `0 0 25px ${accent}, 0 0 40px #FFFFFF88`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 30,
                fontWeight: 900,
                color: "#FFFFFF",
                textShadow: `0 0 12px ${accent}`,
                lineHeight: 1,
              }}
            >
              ?
            </span>
          </div>
        )}
        <MotionGraphic
          icon={scene.icon}
          text={scene.text}
          narration={scene.narration}
          accent={accent}
          size="lg"
        />
      </div>

      {/* Main Hook Headline */}
      <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 940 }}>
        <RevealText
          text={scene.text ?? ""}
          stagger={4}
          style={{
            fontSize: 110,
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            textAlign: "center",
            textShadow: "0 10px 50px rgba(0,0,0,0.85)",
          }}
        />
      </div>

      {/* Dynamic Animated Frequency / Waveform Visualizer on the Beat */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 48,
          opacity: intro,
        }}
      >
        {Array.from({ length: 19 }).map((_, i) => {
          const h = interpolate(
            Math.sin(frame * 0.25 + i * 0.45),
            [-1, 1],
            [12, 54]
          );
          const isCenter = Math.abs(i - 9) <= 2;
          return (
            <div
              key={i}
              style={{
                width: 6,
                height: h,
                borderRadius: 4,
                background: isCenter ? "#FFFFFF" : accent,
                boxShadow: isCenter ? `0 0 18px #FFFFFF` : `0 0 14px ${accent}aa`,
                transition: "height 0.05s ease",
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
