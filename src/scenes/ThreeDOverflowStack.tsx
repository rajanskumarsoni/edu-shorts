import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDOverflowStack: React.FC<{
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
    stackGroup: THREE.Group;
    serverBase: THREE.Mesh;
    plates: THREE.Mesh[];
  } | null>(null);

  const maxPlates = 14;

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
    threeScene.fog = new THREE.FogExp2(0x0a1424, 0.04);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 3.8, 8.2);
    camera.lookAt(0, 2.2, 0);

    // Coordinate Grid
    const grid = new THREE.GridHelper(24, 28, new THREE.Color(accent), 0x162644);
    grid.position.set(0, 0, 0);
    threeScene.add(grid);

    // Server Chassis / Platform Base
    const baseGeo = new THREE.BoxGeometry(3.2, 0.45, 2.2);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x111c30,
      metalness: 0.9,
      roughness: 0.2,
    });
    const serverBase = new THREE.Mesh(baseGeo, baseMat);
    serverBase.position.set(0, 0.225, 0);
    threeScene.add(serverBase);

    // Blue wireframe outline on server chassis
    const baseWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(baseGeo),
      new THREE.LineBasicMaterial({ color: 0x4cc9f0, opacity: 0.5, transparent: true })
    );
    serverBase.add(baseWire);

    // Vertical Stack Group
    const stackGroup = new THREE.Group();
    stackGroup.position.set(0, 0.45, 0);
    threeScene.add(stackGroup);

    // Plates representing active connection holds
    const plates: THREE.Mesh[] = [];
    const plateGeo = new THREE.BoxGeometry(2.2, 0.16, 1.4);

    for (let i = 0; i < maxPlates; i++) {
      const plateMat = new THREE.MeshStandardMaterial({
        color: 0x1d3557,
        metalness: 0.7,
        roughness: 0.25,
        emissive: 0x000000,
        emissiveIntensity: 0.0,
      });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.y = i * 0.22 + 0.1;

      // Blueprint edge lines
      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(plateGeo),
        new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6 })
      );
      plate.add(edge);

      plate.visible = false;
      stackGroup.add(plate);
      plates.push(plate);
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    threeScene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 6);
    threeScene.add(dirLight);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      stackGroup,
      serverBase,
      plates,
    };

    return () => {
      renderer.dispose();
    };
  }, [width, height, accent]);

  // Frame animation
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // How many plates are active
    const activeCount = Math.min(
      maxPlates,
      Math.floor(interpolate(frame, [5, 45], [1, maxPlates], { extrapolateRight: "clamp" }))
    );

    const isExhausted = activeCount >= maxPlates - 1;

    s.plates.forEach((plate, idx) => {
      if (idx < activeCount) {
        plate.visible = true;
        const mat = plate.material as THREE.MeshStandardMaterial;

        if (isExhausted) {
          // Warning crimson state
          mat.color.setHex(0xd90429);
          mat.emissive.setHex(0xff3344);
          mat.emissiveIntensity = 0.45;
          // Jenga wobble
          plate.rotation.y = Math.sin(frame * 0.4 + idx * 0.5) * 0.04;
          plate.rotation.z = Math.cos(frame * 0.35 + idx) * 0.025;
        } else {
          mat.color.setHex(0x1d3557);
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
          plate.rotation.set(0, 0, 0);
        }
      } else {
        plate.visible = false;
      }
    });

    // Camera elevates as stack grows
    s.camera.position.y = 3.6 + (activeCount / maxPlates) * 1.5;
    s.camera.lookAt(0, 1.5 + (activeCount / maxPlates) * 1.2, 0);

    s.renderer.render(s.scene, s.camera);
  }, [frame]);

  const activePlates = Math.min(
    maxPlates,
    Math.floor(interpolate(frame, [5, 45], [1, maxPlates], { extrapolateRight: "clamp" }))
  );
  const isOverflow = activePlates >= maxPlates - 2;

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

      {/* Top Header Tag */}
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
          color: isOverflow ? "#FF3B30" : accent,
          zIndex: 10,
        }}
      >
        <span>{resolveSceneTag(scene, "05 / CONNECTION POOL EXHAUSTION")}</span>
        <span style={{ color: isOverflow ? "#FF3B30" : "#8E9EB8" }}>
          {isOverflow ? "POOL SATURATED: 100%" : `CONNECTIONS: ${activePlates * 15}/200`}
        </span>
      </div>

      {/* Centered Alert Box on Overload */}
      {isOverflow && (
        <div
          style={{
            position: "absolute",
            bottom: "23%",
            left: "50%",
            transform: "translateX(-50%)",
            width: 720,
            padding: "20px 32px",
            borderRadius: 16,
            background: "rgba(180, 20, 30, 0.22)",
            border: "2px solid #FF3B30",
            backdropFilter: "blur(12px)",
            textAlign: "center",
            boxShadow: "0 0 32px rgba(255, 59, 48, 0.4)",
            zIndex: 25,
          }}
        >
          <div
            style={{
              color: "#FF3B30",
              fontFamily: "monospace",
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: "0.12em",
              marginBottom: 6,
            }}
          >
            CRITICAL FAILURE: THREAD STARVATION
          </div>
          <div style={{ color: "#FFFFFF", fontSize: 32, fontWeight: 800 }}>
            Every open lock holds a database connection until checkout completes.
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

