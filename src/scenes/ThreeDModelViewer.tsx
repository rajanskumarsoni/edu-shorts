import React, { useRef, useEffect, useState } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile } from "remotion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { SceneSpec } from "../types";
import { resolveSceneTag, FONT, MONO, CARD_BG, CARD_BORDER, getTypography } from "../theme";
import { useLayout } from "../layout";

export const ThreeDModelViewer: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const L = useLayout();
  const typo = getTypography(L.landscape);

  const [loadError, setLoadError] = useState<string | null>(null);

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    modelGroup: THREE.Group;
    rimLight: THREE.PointLight;
    loaded: boolean;
  } | null>(null);

  // Determine model path
  const epPrefix = scene.audio ? scene.audio.split("/")[0] : "";
  let rawModelPath = scene.model || (scene as any).modelUrl;
  if (!rawModelPath) {
    if (scene.variant === "starter_gears_3d") rawModelPath = "media/starter_gears.glb";
    else if (scene.variant === "sprag_clutch_3d") rawModelPath = "media/sprag_clutch.glb";
    else if (scene.variant === "motorcycle_engine_3d") rawModelPath = "media/motorcycle_engine.glb";
    else rawModelPath = "models/sample.glb";
  }
  if (epPrefix && rawModelPath.startsWith("media/") && !rawModelPath.startsWith(epPrefix)) {
    rawModelPath = `${epPrefix}/${rawModelPath}`;
  }
  const modelUrl = rawModelPath.startsWith("http://") || rawModelPath.startsWith("https://")
    ? rawModelPath
    : staticFile(rawModelPath.replace(/^\/+/, ""));

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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const threeScene = new THREE.Scene();
    threeScene.fog = new THREE.FogExp2(0x0b1020, 0.035);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 7.5);
    camera.lookAt(0, 0, 0);

    // Subtle dark spatial grid
    const grid = new THREE.GridHelper(16, 20, new THREE.Color(accent).getHex(), 0x1a233a);
    grid.position.y = -2.2;
    threeScene.add(grid);

    // Studio Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.9);
    threeScene.add(amb);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(5, 8, 6);
    threeScene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4466aa, 1.2);
    fillLight.position.set(-6, -2, -4);
    threeScene.add(fillLight);

    const rimLight = new THREE.PointLight(new THREE.Color(accent).getHex(), 4.5, 18);
    rimLight.position.set(0, 2.5, -3.5);
    threeScene.add(rimLight);

    // Root Group for the 3D model
    const modelGroup = new THREE.Group();
    threeScene.add(modelGroup);

    // Load .glb / .gltf
    const loader = new GLTFLoader();
    let isDisposed = false;

    loader.load(
      modelUrl,
      (gltf) => {
        if (isDisposed) return;
        const loadedScene = gltf.scene;

        // Compute Bounding Box & Normalize Scale
        const box = new THREE.Box3().setFromObject(loadedScene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z, 0.001);
        const targetDim = 3.8 * (scene.modelScale || 1.0);
        const scaleFactor = targetDim / maxDim;

        loadedScene.scale.set(scaleFactor, scaleFactor, scaleFactor);
        // Center geometric origin at (0, 0, 0)
        loadedScene.position.set(
          -center.x * scaleFactor,
          -center.y * scaleFactor,
          -center.z * scaleFactor
        );

        if (scene.modelRotation) {
          loadedScene.rotation.set(
            scene.modelRotation[0],
            scene.modelRotation[1],
            scene.modelRotation[2]
          );
        }

        // Enhance materials
        loadedScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => {
                  m.needsUpdate = true;
                });
              } else {
                child.material.needsUpdate = true;
              }
            }
          }
        });

        modelGroup.add(loadedScene);
        if (stateRef.current) {
          stateRef.current.loaded = true;
        }
      },
      undefined,
      (error) => {
        if (!isDisposed) {
          console.warn(`[ThreeDModelViewer] Could not load model from ${modelUrl}:`, error);
          setLoadError(error instanceof Error ? error.message : "Model load failed");
        }
      }
    );

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      modelGroup,
      rimLight,
      loaded: false,
    };

    return () => {
      isDisposed = true;
      threeScene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [width, height, accent, modelUrl, scene.modelScale, scene.modelRotation]);

  // Frame animation loop
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    const progress = Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames)));

    // Dynamic Camera Choreography:
    // Starts with a slight cinematic Dutch tilt and slow dolly-in
    const dutch = interpolate(frame, [0, 40], [0.08, 0.0], { extrapolateRight: "clamp" });
    const camZ = interpolate(progress, [0, 1], [8.2, 6.8]);
    const camY = interpolate(progress, [0, 1], [1.1, 0.4]);

    s.camera.position.set(0, camY, camZ);
    s.camera.rotation.z = dutch;
    s.camera.lookAt(0, 0, 0);

    // Smooth continuous axial orbit & gentle levitation
    const orbitSpeed = frame * 0.018;
    const floatY = Math.sin(frame * 0.04) * 0.12;

    s.modelGroup.rotation.y = orbitSpeed;
    s.modelGroup.rotation.x = Math.sin(frame * 0.02) * 0.06;
    s.modelGroup.position.y = floatY;

    // Render frame
    s.renderer.render(s.scene, s.camera);
  }, [frame, durationInFrames]);

  const tagText = resolveSceneTag(scene, "01 / PHYSICAL SPECIFICATION");
  const metrics = scene.metrics || {};

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />

      {/* Fallback Hologram indicator if model path is invalid */}
      {loadError && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              padding: "16px 24px",
              background: "rgba(239, 68, 68, 0.18)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "12px",
              color: "#FCA5A5",
              fontFamily: MONO,
              fontSize: 16,
              textAlign: "center",
              maxWidth: 420,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4 }}>3D Model Placeholder</div>
            <div style={{ opacity: 0.8, fontSize: 13 }}>
              Model: {scene.model || "Not Specified"}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Top Tracked Uppercase Header Tag */}
      <div
        style={{
          position: "absolute",
          top: L.padTop + 24,
          left: L.padX,
          right: L.padX,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: MONO,
          letterSpacing: "0.2em",
          color: accent,
          fontSize: typo.tag,
          fontWeight: 700,
          textTransform: "uppercase",
          textShadow: `0 0 16px ${accent}88`,
        }}
      >
        <span>{tagText}</span>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: Math.max(16, typo.tag - 8) }}>
          PBR 3D ASSET
        </span>
      </div>

      {/* Primary Scene Title */}
      {scene.title && (
        <div
          style={{
            position: "absolute",
            top: L.padTop + 68,
            left: L.padX,
            right: L.padX,
            fontFamily: FONT,
            fontSize: typo.title,
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            textShadow: "0 4px 24px rgba(0,0,0,0.8)",
          }}
        >
          {scene.title}
        </div>
      )}

      {/* Telemetry Metrics HUD Card (Lower Screen) */}
      {Object.keys(metrics).length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: L.padBottom + 80,
            left: L.padX,
            right: L.padX,
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(3, Object.keys(metrics).length)}, 1fr)`,
            gap: 12,
            background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`,
            borderRadius: 16,
            padding: "16px 20px",
            backdropFilter: "blur(16px)",
          }}
        >
          {Object.entries(metrics).map(([key, val]) => (
            <div key={key} style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: Math.max(14, typo.label - 14),
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {key}
              </span>
              <span
                style={{
                  fontFamily: FONT,
                  fontSize: Math.max(20, typo.subheader - 16),
                  fontWeight: 700,
                  color: accent,
                  marginTop: 2,
                }}
              >
                {String(val)}
              </span>
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};
