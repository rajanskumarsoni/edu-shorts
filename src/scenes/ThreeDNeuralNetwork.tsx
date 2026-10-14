import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { RevealText } from "../Reveal";

export const ThreeDNeuralNetwork: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Scene state stored in ref for fast updates without recreating context
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    nodes: THREE.Mesh[];
    lineSegments: THREE.LineSegments;
    pulses: THREE.Mesh[];
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
    camera.position.set(0, 0, 14);

    // Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    threeScene.add(ambientLight);

    const pointLight = new THREE.PointLight(new THREE.Color(accent), 2.5, 30);
    pointLight.position.set(5, 5, 10);
    threeScene.add(pointLight);

    // Layer definitions: Layer index -> Array of 3D node positions
    const layerSizes = [3, 4, 4, 2];
    const layerXSpacing = 3.2;
    const nodeYSpacing = 1.6;
    const startX = -((layerSizes.length - 1) * layerXSpacing) / 2;

    const nodePositions: THREE.Vector3[][] = [];
    const allNodeMeshes: THREE.Mesh[] = [];

    const sphereGeo = new THREE.SphereGeometry(0.32, 24, 24);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accent),
      emissive: new THREE.Color(accent),
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });

    layerSizes.forEach((count, lIdx) => {
      const layerNodes: THREE.Vector3[] = [];
      const x = startX + lIdx * layerXSpacing;
      const startY = -((count - 1) * nodeYSpacing) / 2;

      for (let nIdx = 0; nIdx < count; nIdx++) {
        const y = startY + nIdx * nodeYSpacing;
        const z = (Math.sin(lIdx + nIdx) * 0.4);
        const pos = new THREE.Vector3(x, y, z);
        layerNodes.push(pos);

        const mesh = new THREE.Mesh(sphereGeo, nodeMat.clone());
        mesh.position.copy(pos);
        threeScene.add(mesh);
        allNodeMeshes.push(mesh);
      }
      nodePositions.push(layerNodes);
    });

    // Create Synaptic Connection Lines between adjacent layers
    const linePoints: THREE.Vector3[] = [];
    for (let l = 0; l < layerPositionsCount(nodePositions) - 1; l++) {
      const currentLayer = nodePositions[l];
      const nextLayer = nodePositions[l + 1];
      for (const p1 of currentLayer) {
        for (const p2 of nextLayer) {
          linePoints.push(p1);
          linePoints.push(p2);
        }
      }
    }

    function layerPositionsCount(layers: THREE.Vector3[][]) {
      return layers.length;
    }

    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x4a69bd,
      transparent: true,
      opacity: 0.35,
    });
    const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
    threeScene.add(lineSegments);

    // Forward Activation Pulse Particles
    const pulseCount = 12;
    const pulseGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const pulseMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < pulseCount; i++) {
      const pMesh = new THREE.Mesh(pulseGeo, pulseMat);
      threeScene.add(pMesh);
      pulseMeshes.push(pMesh);
    }

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      nodes: allNodeMeshes,
      lineSegments,
      pulses: pulseMeshes,
    };

    return () => {
      renderer.dispose();
      sphereGeo.dispose();
      nodeMat.dispose();
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

    // Smooth orbital camera movement
    const angle = (frame / 120) * Math.PI * 0.5;
    s.camera.position.x = Math.sin(angle) * 4;
    s.camera.position.y = Math.cos(angle * 0.7) * 1.5;
    s.camera.lookAt(0, 0, 0);

    // Pulse neuron glow
    s.nodes.forEach((node, i) => {
      const pulse = 1 + 0.15 * Math.sin(frame / 6 + i);
      node.scale.set(pulse, pulse, pulse);
    });

    // Move forward activation pulses
    const totalLines = s.lineSegments.geometry.attributes.position.count / 2;
    s.pulses.forEach((pulse, i) => {
      const lineIdx = Math.floor((i * (totalLines / s.pulses.length) + (frame / 20)) % totalLines);
      const posAttr = s.lineSegments.geometry.attributes.position;
      const x1 = posAttr.getX(lineIdx * 2);
      const y1 = posAttr.getY(lineIdx * 2);
      const z1 = posAttr.getZ(lineIdx * 2);
      const x2 = posAttr.getX(lineIdx * 2 + 1);
      const y2 = posAttr.getY(lineIdx * 2 + 1);
      const z2 = posAttr.getZ(lineIdx * 2 + 1);

      const progress = ((frame * 0.05 + i * 0.3) % 1);
      pulse.position.set(
        x1 + (x2 - x1) * progress,
        y1 + (y2 - y1) * progress,
        z1 + (z2 - z1) * progress
      );
    });

    s.renderer.render(s.scene, s.camera);
  }, [frame]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />

      {/* Cinematic HUD Header */}
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
            {"3D NEURAL ARCHITECTURE"}
          </div>
          <div style={{ fontSize: 54, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.15 }}>
            {scene.title ?? "Forward Synaptic Propagation"}
          </div>
        </div>

        {scene.equation && (
          <div
            style={{
              alignSelf: "flex-start",
              padding: "12px 24px",
              borderRadius: 16,
              background: "rgba(10, 15, 28, 0.92)",
              border: `1.5px solid ${accent}55`,
              color: "#E2E8F0",
              fontFamily: "monospace",
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            {scene.equation}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
