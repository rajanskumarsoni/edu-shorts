import React, { useRef, useEffect } from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";

/**
 * Depth Parallax Background: Renders a cinematic backdrop that reacts
 * to camera dolly/pan movements with a depth-based parallax effect.
 */
export const DepthParallaxBackground: React.FC<{
  accent: string;
  depthMapUrl: string; // High-res image with corresponding depth map
}> = ({ accent, depthMapUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // Shader material for depth parallax
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(width, height) },
        accent: { value: new THREE.Color(accent) },
        depthMap: { value: new THREE.TextureLoader().load(depthMapUrl) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec2 resolution;
        uniform vec3 accent;
        uniform sampler2D depthMap;
        varying vec2 vUv;
        void main() {
          float depth = texture2D(depthMap, vUv).r;
          vec2 offset = vec2(sin(time * 0.5), cos(time * 0.3)) * depth * 0.05;
          gl_FragColor = vec4(accent * depth + 0.1, 1.0);
        }
      `
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const animate = () => {
      material.uniforms.time.value = frame * 0.01;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => renderer.dispose();
  }, [width, height, accent, depthMapUrl, frame]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", position: "absolute", zIndex: -1 }} />;
};
