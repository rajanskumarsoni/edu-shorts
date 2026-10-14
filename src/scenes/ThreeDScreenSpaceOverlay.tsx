import React, { useRef, useEffect, useState } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";

interface OverlayPoint {
  id: string;
  label: string;
  color?: string;
  worldPosition: [number, number, number];
}

interface ThreeDScreenSpaceOverlayProps {
  scene: SceneSpec;
  accent: string;
  points: OverlayPoint[];
  children?: React.ReactNode;
}

/**
 * Screen-Space 3D Overlay: projects 3D world points to 2D screen coordinates
 * in real time, allowing React/SVG callouts, labels, and arrows to anchor
 * directly to moving 3D objects (e.g., bank towers, vault doors, QR codes).
 */
export const ThreeDScreenSpaceOverlay: React.FC<ThreeDScreenSpaceOverlayProps> = ({
  scene,
  accent,
  points,
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const [screenPoints, setScreenPoints] = useState<Array<{ x: number; y: number; id: string }>>([]);

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    objects: Map<string, THREE.Object3D>;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

    const threeScene = new THREE.Scene();
    threeScene.fog = new THREE.FogExp2(0x0b1020, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 0, 0);

    const grid = new THREE.GridHelper(20, 30, new THREE.Color(accent), 0x16233b);
    grid.position.y = -2;
    threeScene.add(grid);

    const objects = new Map<string, THREE.Object3D>();
    points.forEach((pt) => {
      const anchor = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(pt.color || accent) })
      );
      anchor.position.set(...pt.worldPosition);
      threeScene.add(anchor);
      objects.set(pt.id, anchor);
    });

    threeScene.add(new THREE.AmbientLight(0xffffff, 0.8));

    stateRef.current = { renderer, scene: threeScene, camera, objects };

    return () => {
      renderer.dispose();
    };
  }, [width, height, accent]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    const projected = points.map((pt) => {
      const obj = s.objects.get(pt.id);
      if (!obj) return { x: 0, y: 0, id: pt.id };
      const vec = new THREE.Vector3();
      obj.getWorldPosition(vec);
      vec.project(s.camera);
      return {
        x: (vec.x * 0.5 + 0.5) * width,
        y: (-vec.y * 0.5 + 0.5) * height,
        id: pt.id,
      };
    });
    setScreenPoints(projected);

    s.renderer.render(s.scene, s.camera);
  }, [frame, width, height, points]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1020" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {screenPoints.map((sp, i) => {
          const pt = points[i];
          const color = pt.color || accent;
          return (
            <g key={sp.id}>
              <circle cx={sp.x} cy={sp.y} r={8} fill={color} opacity={0.9}>
                <animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <text
                x={sp.x + 16}
                y={sp.y - 12}
                fill="#FFFFFF"
                fontSize={28}
                fontWeight={900}
                fontFamily="Inter, sans-serif"
                style={{ textShadow: `0 0 12px ${color}` }}
              >
                {pt.label}
              </text>
            </g>
          );
        })}
      </svg>
      {children}
    </AbsoluteFill>
  );
};
