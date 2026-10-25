import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { MathFormula } from "../MathFormula";

export const ThreeDNeuralNetwork: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const isBackprop =
    scene.variant === "backprop_3d" ||
    scene.variant === "backprop" ||
    /backprop|gradient|backward|chain rule/i.test(scene.tag || "") ||
    /backprop|gradient|backward|chain rule/i.test(scene.title || "");

  const activeColor = isBackprop ? "#FF5555" : accent;

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
    camera.position.set(0, 0, 13.5);

    // Coordinate Grid on Floor for deep perspective
    const grid = new THREE.GridHelper(24, 20, new THREE.Color(activeColor), 0x16233b);
    grid.position.y = -4.5;
    threeScene.add(grid);

    // Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    threeScene.add(ambientLight);

    const pointLight = new THREE.PointLight(new THREE.Color(activeColor), 3.0, 35);
    pointLight.position.set(0, 2, 8);
    threeScene.add(pointLight);

    // Layer definitions: 4 distinct columns
    const layerSizes = [3, 4, 4, 2];
    const layerXSpacing = 2.8;
    const nodeYSpacing = 1.6;
    const startX = -((layerSizes.length - 1) * layerXSpacing) / 2;

    const nodePositions: THREE.Vector3[][] = [];
    const allNodeMeshes: THREE.Mesh[] = [];

    const sphereGeo = new THREE.SphereGeometry(0.34, 24, 24);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(activeColor),
      emissive: new THREE.Color(activeColor),
      emissiveIntensity: 0.75,
      roughness: 0.15,
      metalness: 0.85,
    });

    const haloRingGeo = new THREE.RingGeometry(0.44, 0.52, 24);
    const haloRingMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(activeColor),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });

    layerSizes.forEach((count, lIdx) => {
      const layerNodes: THREE.Vector3[] = [];
      const x = startX + lIdx * layerXSpacing;
      const startY = -((count - 1) * nodeYSpacing) / 2 - 0.2;

      for (let nIdx = 0; nIdx < count; nIdx++) {
        const y = startY + nIdx * nodeYSpacing;
        const z = (Math.sin(lIdx * 1.5 + nIdx) * 0.25);
        const pos = new THREE.Vector3(x, y, z);
        layerNodes.push(pos);

        const mesh = new THREE.Mesh(sphereGeo, nodeMat.clone());
        mesh.position.copy(pos);
        threeScene.add(mesh);
        allNodeMeshes.push(mesh);

        // Add glowing halo ring to every node
        const halo = new THREE.Mesh(haloRingGeo, haloRingMat.clone());
        halo.position.copy(pos);
        threeScene.add(halo);
      }
      nodePositions.push(layerNodes);
    });

    // Create Synaptic Connection Lines between adjacent layers
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
      color: new THREE.Color(isBackprop ? "#FF5555" : activeColor),
      transparent: true,
      opacity: 0.38,
    });
    const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
    threeScene.add(lineSegments);

    // Forward Activation or Backward Error Pulse Particles
    const pulseCount = 18;
    const pulseGeo = new THREE.SphereGeometry(0.14, 14, 14);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: isBackprop ? 0xffaa33 : 0xffffff,
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
      haloRingGeo.dispose();
      nodeMat.dispose();
      haloRingMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      pulseGeo.dispose();
      pulseMat.dispose();
      grid.dispose();
    };
  }, [width, height, activeColor, isBackprop]);

  // Frame animation update loop
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Stable front-facing camera with subtle cinematic drift (keeps 4 columns completely distinct)
    const driftAngle = (frame / 120) * Math.PI * 0.25;
    s.camera.position.x = Math.sin(driftAngle) * 0.6;
    s.camera.position.y = Math.cos(driftAngle * 0.7) * 0.3;
    s.camera.position.z = 13.2;
    s.camera.lookAt(0, -0.2, 0);

    // Pulse neuron glow
    s.nodes.forEach((node, i) => {
      const pulse = 1 + 0.12 * Math.sin(frame / 6 + i);
      node.scale.set(pulse, pulse, pulse);
    });

    // Move activation pulses (forward: left-to-right, backward: right-to-left)
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

      // In backprop: travel from x2 (right) back to x1 (left)
      const rawProg = ((frame * 0.05 + i * 0.3) % 1);
      const progress = isBackprop ? 1 - rawProg : rawProg;

      pulse.position.set(
        x1 + (x2 - x1) * progress,
        y1 + (y2 - y1) * progress,
        z1 + (z2 - z1) * progress
      );
    });

    s.renderer.render(s.scene, s.camera);
  }, [frame, isBackprop]);

  const layerHeaders = isBackprop
    ? ["INPUT (X)", "HIDDEN 1", "HIDDEN 2", "ERROR (∂L/∂ŷ)"]
    : ["INPUT LAYER", "HIDDEN 1", "HIDDEN 2", "OUTPUT (ŷ)"];

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#0B1020" }}>
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
          zIndex: 30,
        }}
      >
        <div
          style={{
            background: "rgba(14, 18, 30, 0.94)",
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
              fontSize: 26,
              fontWeight: 800,
              color: activeColor,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {scene.tag ?? (isBackprop ? "05 / STAGE 3: BACKPROPAGATION" : "01 / 3D NEURAL ARCHITECTURE")}
          </div>
          <div style={{ fontSize: 52, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.15 }}>
            {scene.title ?? (isBackprop ? "Backpropagation Graph" : "Neural Network Architecture")}
          </div>
        </div>

        {scene.equation && (
          <MathFormula
            equation={scene.equation}
            accent={activeColor}
            fontSize={30}
            style={{
              alignSelf: "flex-start",
              marginTop: 6,
            }}
          />
        )}
      </div>

      {/* Overhead Layer Column Headers */}
      <div
        style={{
          position: "absolute",
          top: 360,
          left: 45,
          right: 45,
          display: "flex",
          justifyContent: "space-between",
          pointerEvents: "none",
          zIndex: 25,
        }}
      >
        {layerHeaders.map((name, i) => (
          <div
            key={name}
            style={{
              fontFamily: "monospace",
              fontSize: 22,
              fontWeight: 900,
              color: activeColor,
              background: "rgba(10, 16, 32, 0.90)",
              border: `1.5px solid ${activeColor}77`,
              borderRadius: 12,
              padding: "6px 14px",
              letterSpacing: "0.10em",
              boxShadow: `0 0 15px ${activeColor}33`,
            }}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Bottom Telemetry Card */}
      <div
        style={{
          position: "absolute",
          bottom: 300,
          left: 45,
          right: 45,
          background: "rgba(12, 17, 30, 0.92)",
          backdropFilter: "blur(18px)",
          borderRadius: 20,
          padding: "18px 26px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 20px 45px rgba(0,0,0,0.7)",
          pointerEvents: "none",
          zIndex: 30,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: activeColor,
              boxShadow: `0 0 15px ${activeColor}`,
            }}
          />
          <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 800, color: "#FFFFFF" }}>
            {isBackprop ? "CALCULUS CHAIN RULE" : "SYNAPTIC WEIGHT PROPAGATION"}
          </div>
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 24,
            fontWeight: 800,
            color: activeColor,
          }}
        >
          {isBackprop ? "Gradients Moving Backward" : "Signals Propagating Forward"}
        </div>
      </div>
    </AbsoluteFill>
  );
};
