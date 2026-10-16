import React, { useRef, useEffect, useState } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";

export type ParallaxMovement =
  | "dolly_in"
  | "dolly_out"
  | "pan_horizontal"
  | "orbit"
  | "breathe";

export interface DepthParallaxProps {
  accent?: string;
  image?: string;
  depthMap?: string;
  intensity?: number;
  movement?: ParallaxMovement;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Procedural Fallback Texture (Generates a clean dark tech gradient grid if no image is supplied)
 */
function createFallbackTexture(accentColor: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Deep dark radial backdrop
  const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 320);
  grad.addColorStop(0, "#161b26");
  grad.addColorStop(1, "#08090d");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle accent grid lines
  ctx.strokeStyle = accentColor;
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 1;
  const step = 48;
  for (let x = 0; x <= 512; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  for (let y = 0; y <= 512; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Glowing center crosshair
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(256, 256, 80, 0, Math.PI * 2);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

/**
 * Depth Parallax WebGL Core Component
 * Deterministic frame-by-frame rendering with no requestAnimationFrame
 */
export const DepthParallaxBackground: React.FC<DepthParallaxProps> = ({
  accent = "#00F0FF",
  image,
  depthMap,
  intensity = 0.05,
  movement = "dolly_in",
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Persistent Three.js engine refs across frame updates
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const texturesRef = useRef<{ colorTex: THREE.Texture; depthTex: THREE.Texture | null } | null>(null);

  const [ready, setReady] = useState(false);

  // Resolve static files or remote paths
  const resolvePath = (p?: string) => {
    if (!p) return undefined;
    if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("data:")) return p;
    return staticFile(p);
  };

  const resolvedImageUrl = resolvePath(image);
  const resolvedDepthUrl = resolvePath(depthMap);

  // 1. One-time Setup: Initialize WebGL context, textures, and geometry
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    const textureLoader = new THREE.TextureLoader();

    // Load main color texture
    let colorTex: THREE.Texture;
    if (resolvedImageUrl) {
      colorTex = textureLoader.load(resolvedImageUrl, () => {
        colorTex.minFilter = THREE.LinearFilter;
        colorTex.magFilter = THREE.LinearFilter;
        setReady(true);
      });
    } else {
      colorTex = createFallbackTexture(accent);
      setReady(true);
    }

    // Load depth map texture if provided
    let depthTex: THREE.Texture | null = null;
    let hasDepth = false;
    if (resolvedDepthUrl) {
      depthTex = textureLoader.load(resolvedDepthUrl, () => {
        depthTex!.minFilter = THREE.LinearFilter;
        depthTex!.magFilter = THREE.LinearFilter;
        if (materialRef.current) {
          materialRef.current.uniforms.uHasDepthMap.value = true;
          materialRef.current.uniforms.uDepthMap.value = depthTex;
        }
      });
      hasDepth = true;
    }

    texturesRef.current = { colorTex, depthTex };

    const geometry = new THREE.PlaneGeometry(2, 2);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: colorTex },
        uDepthMap: { value: depthTex || colorTex },
        uHasDepthMap: { value: hasDepth },
        uOffset: { value: new THREE.Vector2(0, 0) },
        uZoom: { value: 1.08 },
        uIntensity: { value: intensity },
        uAccent: { value: new THREE.Color(accent) },
        uResolution: { value: new THREE.Vector2(width, height) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform sampler2D uDepthMap;
        uniform bool uHasDepthMap;
        uniform vec2 uOffset;
        uniform float uZoom;
        uniform float uIntensity;
        uniform vec3 uAccent;
        uniform vec2 uResolution;
        varying vec2 vUv;

        void main() {
          // Normalize aspect ratio to center image without stretch
          vec2 uv = (vUv - 0.5) / uZoom + 0.5;

          // Depth sample (1.0 = close/foreground, 0.0 = deep background)
          float depth = 0.5;
          if (uHasDepthMap) {
            depth = texture2D(uDepthMap, uv).r;
          } else {
            // Procedural depth estimate: center foreground with radial/vertical falloff
            float centerDist = length((uv - vec2(0.5, 0.55)) * vec2(1.0, 1.2));
            depth = clamp(1.0 - centerDist * 1.3, 0.0, 1.0);
          }

          // Parallax displacement: foreground moves more than background
          vec2 displacedUv = uv + uOffset * (depth - 0.5) * (uIntensity * 2.0);

          // Safe clamping to avoid border artifacts
          displacedUv = clamp(displacedUv, vec2(0.002), vec2(0.998));

          vec4 color = texture2D(uTexture, displacedUv);

          // Subtle atmospheric depth tinting & vignette
          float vig = smoothstep(0.95, 0.35, length(vUv - 0.5));
          vec3 depthTint = mix(uAccent * 0.15, vec3(0.0), depth);

          gl_FragColor = vec4((color.rgb + depthTint) * vig, color.a);
        }
      `,
      depthTest: false,
      depthWrite: false,
    });

    materialRef.current = material;

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    return () => {
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      colorTex.dispose();
      depthTex?.dispose();
    };
  }, [width, height, resolvedImageUrl, resolvedDepthUrl, intensity, accent]);

  // 2. Deterministic Frame Update (Runs on every Remotion frame without re-instantiation)
  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const material = materialRef.current;

    if (!renderer || !scene || !camera || !material) return;

    const progress = Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames - 1)));

    // Calculate motion offsets based on selected movement type
    let offX = 0;
    let offY = 0;
    let zoomVal = 1.08;

    switch (movement) {
      case "dolly_in":
        zoomVal = interpolate(progress, [0, 1], [1.05, 1.14]);
        offY = Math.sin(progress * Math.PI) * 0.015;
        break;

      case "dolly_out":
        zoomVal = interpolate(progress, [0, 1], [1.14, 1.05]);
        offY = -Math.sin(progress * Math.PI) * 0.015;
        break;

      case "pan_horizontal":
        zoomVal = 1.10;
        offX = interpolate(progress, [0, 1], [-0.04, 0.04]);
        break;

      case "orbit":
        zoomVal = 1.10;
        offX = Math.cos(progress * Math.PI * 2) * 0.03;
        offY = Math.sin(progress * Math.PI * 2) * 0.02;
        break;

      case "breathe":
      default:
        zoomVal = 1.08 + Math.sin(progress * Math.PI * 2) * 0.02;
        offX = Math.sin(progress * Math.PI * 2) * 0.018;
        offY = Math.cos(progress * Math.PI * 2) * 0.012;
        break;
    }

    material.uniforms.uOffset.value.set(offX, offY);
    material.uniforms.uZoom.value = zoomVal;
    material.uniforms.uIntensity.value = intensity;

    // Render frame synchronously
    renderer.render(scene, camera);
  }, [frame, durationInFrames, movement, intensity, ready]);

  return (
    <AbsoluteFill style={{ ...style }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          display: "block",
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Depth Parallax Scene Component
 * Official storyboard scene type ("depth_parallax") with high-contrast HUD labels
 */
export const DepthParallaxScene: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const title = scene.title;
  const tag = scene.tag;
  const image = (scene as any).image;
  const depthMap = (scene as any).depthMap;
  const intensity = (scene as any).intensity ?? 0.05;
  const movement = (scene as any).movement ?? "dolly_in";

  // Card entrance animation
  const cardOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const cardY = interpolate(frame, [0, 14], [25, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#050608", overflow: "hidden" }}>
      {/* 2.5D Depth Parallax WebGL Ground */}
      <DepthParallaxBackground
        accent={accent}
        image={image}
        depthMap={depthMap}
        intensity={intensity}
        movement={movement}
      />

      {/* Radial vignette overlay */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at center, transparent 40%, rgba(5,6,8,0.75) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Editorial HUD Card */}
      {(title || tag) && (
        <div
          style={{
            position: "absolute",
            top: 90,
            left: 45,
            right: 45,
            opacity: cardOpacity,
            transform: `translateY(${cardY}px)`,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            zIndex: 10,
          }}
        >
          {tag && (
            <div
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                padding: "6px 16px",
                borderRadius: 999,
                background: "rgba(10, 14, 22, 0.85)",
                border: `1px solid ${accent}55`,
                color: accent,
                fontSize: 16,
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                backdropFilter: "blur(12px)",
              }}
            >
              {tag}
            </div>
          )}

          {title && (
            <div
              style={{
                fontSize: 40,
                fontWeight: 900,
                color: "#FFFFFF",
                lineHeight: 1.2,
                letterSpacing: -0.5,
                textShadow: "0 4px 20px rgba(0,0,0,0.8)",
                background: "rgba(10, 14, 22, 0.70)",
                backdropFilter: "blur(16px)",
                padding: "16px 24px",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              }}
            >
              {title}
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};
