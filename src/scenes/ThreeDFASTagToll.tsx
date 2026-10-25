import React, { useRef, useEffect, useState } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  staticFile,
  delayRender,
  continueRender,
} from "remotion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { SceneSpec } from "../types";
import { resolveSceneTag, FONT, MONO } from "../theme";
import { useLayout } from "../layout";

/**
 * Procedural Canvas Texture Generator: Authentic Indian Highway FASTag Sticker
 * Synchronous, ultra-crisp (1024x512), with NHAI branding, NETC logo, VC4 badge,
 * Code 128 barcode, EPC serial number, hologram foil, and RFID wave symbols.
 */
function createFASTagStickerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // White base card with rounded corners
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(12, 12, 1000, 488, 28);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#CBD5E1";
  ctx.stroke();

  // Top Indian Highway Orange Header Bar
  ctx.fillStyle = "#F97316";
  ctx.beginPath();
  ctx.roundRect(16, 16, 992, 165, [24, 24, 0, 0]);
  ctx.fill();

  // Cyan Accent Strip Under Header
  ctx.fillStyle = "#06B6D4";
  ctx.fillRect(16, 181, 992, 18);

  // NHAI Blue Emblem Circle (Left)
  ctx.fillStyle = "#1E3A8A";
  ctx.beginPath();
  ctx.arc(105, 98, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#FFFFFF";
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("NHAI", 105, 98);

  // Stylized FASTag Typography
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "italic 900 84px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("FASTag", 195, 108);

  // NETC Logo Circle (Right)
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(920, 98, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#0F172A";
  ctx.stroke();

  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("NETC", 920, 98);

  // Middle Left: Vehicle Class Badge (VC 4 - Light Motor Vehicle)
  ctx.fillStyle = "#7C3AED";
  ctx.beginPath();
  ctx.arc(125, 295, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#A78BFA";
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 38px monospace";
  ctx.fillText("VC 4", 125, 282);
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("CAR", 125, 320);

  // Middle Center: Code 128 Barcode
  const barX = 230;
  const barY = 230;
  const barW = 500;
  const barH = 120;
  ctx.fillStyle = "#0F172A";

  const barPattern = [
    3, 2, 5, 2, 2, 4, 6, 2, 3, 5, 2, 2, 4, 3, 2, 6, 2, 3, 4, 2, 5, 3, 2, 4, 6, 2,
    3, 2, 4, 5, 2, 3, 6, 2, 2, 4, 5, 3, 2, 6, 2, 4, 3, 2, 5, 2, 2, 6, 4, 2, 3, 5,
  ];
  let curX = barX;
  for (let i = 0; i < barPattern.length && curX < barX + barW; i += 2) {
    const wBar = barPattern[i];
    const wGap = barPattern[i + 1] || 3;
    ctx.fillRect(curX, barY, wBar, barH);
    curX += wBar + wGap;
  }

  // Barcode Serial Text
  ctx.fillStyle = "#1E293B";
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "center";
  ctx.fillText("EPC: 3416 1FA8 2032 8900 0109 4821", barX + barW / 2, barY + barH + 26);

  // Right Side: Hologram Security Foil Seal
  ctx.fillStyle = "#E2E8F0";
  ctx.beginPath();
  ctx.roundRect(790, 230, 190, 150, 14);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#94A3B8";
  ctx.stroke();

  // Rainbow Hologram Sheen Lines
  ctx.lineWidth = 3;
  for (let o = -50; o < 180; o += 18) {
    ctx.strokeStyle = "rgba(192, 132, 252, 0.65)";
    ctx.beginPath();
    ctx.moveTo(800 + o, 235);
    ctx.lineTo(850 + o, 375);
    ctx.stroke();

    ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
    ctx.beginPath();
    ctx.moveTo(810 + o, 235);
    ctx.lineTo(860 + o, 375);
    ctx.stroke();
  }

  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("SECURE", 885, 290);
  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = "#475569";
  ctx.fillText("GEN2 RFID", 885, 325);

  // Bottom Footer: RFID Wave Symbol
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#0F172A";
  ctx.beginPath();
  ctx.arc(80, 440, 24, -0.6, 0.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(80, 440, 36, -0.6, 0.6);
  ctx.stroke();

  ctx.fillStyle = "#64748B";
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "left";
  ctx.fillText("ISO/IEC 18000-6C  •  865-867 MHz UHF PASSIVE", 140, 448);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Canvas Texture Generator: Etched Copper RFID Antenna Inlay & IC Die
 */
function createFASTagInlayTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 1024, 512);

  ctx.strokeStyle = "#F59E0B";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";

  const cx = 512;
  const cy = 256;
  const chipSize = 42;

  // Concentric Fractal Coil Paths
  for (let i = 0; i < 5; i++) {
    const ix = 45 + i * 32;
    const iy = 35 + i * 24;
    ctx.strokeRect(ix, iy, 1024 - ix * 2, 512 - iy * 2);
  }

  // Antenna Feed Lines to Center Chip
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#FBBF24";
  ctx.beginPath();
  ctx.moveTo(220, cy - 20);
  ctx.lineTo(cx - chipSize, cy - 20);
  ctx.moveTo(804, cy + 20);
  ctx.lineTo(cx + chipSize, cy + 20);
  ctx.stroke();

  // Central Silicon IC Die Body
  ctx.fillStyle = "#020617";
  ctx.fillRect(cx - chipSize, cy - chipSize, chipSize * 2, chipSize * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#00F0FF";
  ctx.strokeRect(cx - chipSize, cy - chipSize, chipSize * 2, chipSize * 2);

  // Microcircuit Grid Lines
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(6, 182, 212, 0.8)";
  for (let step = -chipSize + 8; step < chipSize - 8; step += 8) {
    ctx.beginPath();
    ctx.moveTo(cx + step, cy - chipSize + 8);
    ctx.lineTo(cx + step, cy + chipSize - 8);
    ctx.stroke();
  }

  // Gold Wire Bonds
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#FCD34D";
  ctx.beginPath();
  ctx.moveTo(cx - chipSize, cy - 15);
  ctx.lineTo(cx - chipSize - 35, cy - 15);
  ctx.moveTo(cx + chipSize, cy + 15);
  ctx.lineTo(cx + chipSize + 35, cy + 15);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Procedural Canvas Texture Generator: Overhead Toll Lane LED Matrix Sign
 */
function createFASTagLaneSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background Dark Matrix Panel
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, 1024, 256);

  // Outer Glowing Border
  ctx.strokeStyle = "#38BDF8";
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 1008, 240);

  // Inner Panel
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(16, 16, 992, 224);

  // Amber Header: NHAI / IHMCL
  ctx.font = "bold 28px monospace";
  ctx.fillStyle = "#F59E0B";
  ctx.textAlign = "center";
  ctx.fillText("NHAI  •  ELECTRONIC TOLL COLLECTION", 512, 58);

  // Big Glowing Cyan Text: LANE 04 • FASTag ONLY
  ctx.font = "900 62px sans-serif";
  ctx.fillStyle = "#00F0FF";
  ctx.fillText("LANE 04  •  FASTag ONLY", 512, 142);

  // Green Clearance Subtext / Downward Arrows
  ctx.font = "bold 28px monospace";
  ctx.fillStyle = "#10B981";
  ctx.fillText("▼  865 MHz UHF RFID ACTIVE  ▼", 512, 206);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const ThreeDFASTagToll: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();
  const L = useLayout();
  const tag = resolveSceneTag(scene, "FASTAG RFID 3D");

  const [handle] = useState(() => delayRender("Loading realistic 3D assets for FASTag scene"));

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    carGroup?: THREE.Group;
    humanMixer?: THREE.AnimationMixer;
    humanMesh?: THREE.Group;
    rfWaves?: THREE.Mesh[];
    barrierArm?: THREE.Group;
    signalLight?: THREE.PointLight;
    chipMesh?: THREE.Mesh;
    antennaMesh?: THREE.Mesh;
    tagGroup?: THREE.Group;
  } | null>(null);

  const subVariant = scene.variant || "fastag_toll_3d";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      continueRender(handle);
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    const threeScene = new THREE.Scene();
    threeScene.fog = new THREE.FogExp2(0x070c1a, 0.026);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 120);

    // Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    threeScene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
    sunLight.position.set(5, 14, 8);
    threeScene.add(sunLight);

    const blueFill = new THREE.DirectionalLight(0x38bdf8, 1.5);
    blueFill.position.set(-6, 4, -4);
    threeScene.add(blueFill);

    const neonRim = new THREE.PointLight(new THREE.Color(accent).getHex(), 4.5, 30);
    neonRim.position.set(0, 5, 2);
    threeScene.add(neonRim);

    const gltfLoader = new GLTFLoader();
    let isDisposed = false;
    let pendingLoads = 0;

    const checkAllLoaded = () => {
      pendingLoads--;
      if (pendingLoads <= 0 && !isDisposed) {
        renderer.render(threeScene, camera);
        continueRender(handle);
      }
    };

    const safeLoadGLTF = (path: string, cb: (gltf: any) => void) => {
      pendingLoads++;
      gltfLoader.load(
        path,
        (gltf) => {
          if (!isDisposed) {
            cb(gltf);
          }
          checkAllLoaded();
        },
        undefined,
        (err) => {
          console.warn("[ThreeDFASTagToll] GLTF load error:", path, err);
          checkAllLoaded();
        }
      );
    };

    // =========================================================================
    // 1. VARIANT: "fastag_sticker_3d" (STEP 02 & 03: Macro Induction & Backscatter)
    // =========================================================================
    if (subVariant === "fastag_sticker_3d") {
      camera.position.set(0, 0, 6.2);
      camera.lookAt(0, 0, 0);

      // Curved Automotive Tempered Windshield Glass
      const glassGeo = new THREE.PlaneGeometry(8.5, 5.2, 32, 32);
      const pos = glassGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        pos.setZ(i, -(x * x + y * y) * 0.022);
      }
      glassGeo.computeVertexNormals();

      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.85,
        transparent: true,
        opacity: 0.65,
        ior: 1.52,
      });
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.z = -0.4;
      threeScene.add(glass);

      // Root FASTag Sticker Object
      const tagGroup = new THREE.Group();
      threeScene.add(tagGroup);

      // Front Authentic FASTag Sticker Substrate
      const stickerTexture = createFASTagStickerTexture();
      const stickerGeo = new THREE.PlaneGeometry(5.0, 2.5);
      const stickerMat = new THREE.MeshStandardMaterial({
        map: stickerTexture,
        roughness: 0.25,
        metalness: 0.15,
        transparent: true,
        opacity: 0.95,
      });
      const stickerMesh = new THREE.Mesh(stickerGeo, stickerMat);
      tagGroup.add(stickerMesh);

      // Internal Layer: Etched Copper RFID Antenna Inlay
      const inlayTexture = createFASTagInlayTexture();
      const inlayGeo = new THREE.PlaneGeometry(4.8, 2.4);
      const inlayMat = new THREE.MeshStandardMaterial({
        map: inlayTexture,
        transparent: true,
        roughness: 0.3,
        metalness: 0.85,
        emissive: new THREE.Color(accent),
        emissiveIntensity: 0.5,
        opacity: 0.9,
      });
      const inlayMesh = new THREE.Mesh(inlayGeo, inlayMat);
      inlayMesh.position.z = 0.03;
      tagGroup.add(inlayMesh);

      // Central 3D Silicon IC Microchip (0.3mm Die with Gold Bond Wires)
      const chipGeo = new THREE.BoxGeometry(0.5, 0.5, 0.12);
      const chipMat = new THREE.MeshStandardMaterial({
        color: 0x020617,
        emissive: new THREE.Color(accent),
        emissiveIntensity: 1.4,
        metalness: 0.95,
        roughness: 0.15,
      });
      const chipMesh = new THREE.Mesh(chipGeo, chipMat);
      chipMesh.position.set(0, 0, 0.09);
      tagGroup.add(chipMesh);

      // Gold Bond Wires
      const wireMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.9,
        roughness: 0.2,
      });
      const wireLeftGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8);
      const wireLeft = new THREE.Mesh(wireLeftGeo, wireMat);
      wireLeft.rotation.z = Math.PI / 2;
      wireLeft.position.set(-0.4, 0, 0.08);
      tagGroup.add(wireLeft);

      const wireRight = wireLeft.clone();
      wireRight.position.set(0.4, 0, 0.08);
      tagGroup.add(wireRight);

      // Backscatter RF Radiation Wave Rings
      const rfWaves: THREE.Mesh[] = [];
      for (let i = 0; i < 4; i++) {
        const ringGeo = new THREE.RingGeometry(0.6 + i * 0.7, 0.68 + i * 0.7, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(accent),
          transparent: true,
          opacity: 0.75 - i * 0.15,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.z = 0.15 + i * 0.4;
        threeScene.add(ring);
        rfWaves.push(ring);
      }

      stateRef.current = {
        renderer,
        scene: threeScene,
        camera,
        tagGroup,
        chipMesh,
        antennaMesh: inlayMesh,
        rfWaves,
      };
    }

    // =========================================================================
    // 2. VARIANT: "fastag_server_3d" (STEP 04: Real 3D Server Rack & NPCI 200ms Core)
    // =========================================================================
    else if (subVariant === "fastag_server_3d") {
      camera.position.set(0, 1.4, 6.2);
      camera.lookAt(0, 0.5, 0);

      // Datacenter Floor Grid
      const grid = new THREE.GridHelper(16, 24, new THREE.Color(accent).getHex(), 0x1e293b);
      grid.position.y = -1.2;
      threeScene.add(grid);

      // Datacenter Atmospheric Lighting
      const glowLight = new THREE.PointLight(new THREE.Color(accent).getHex(), 4.0, 22);
      glowLight.position.set(0, 1.5, 2.0);
      threeScene.add(glowLight);

      const serverGroup = new THREE.Group();
      threeScene.add(serverGroup);

      // Load Real 3D 42U Server Rack (server_rack.glb)
      safeLoadGLTF(
        staticFile("how-fastag-works/media/server_rack.glb"),
        (gltf) => {
          const rack = gltf.scene;
          rack.scale.set(2.4, 2.4, 2.4);
          rack.position.set(0, -1.2, 0);
          rack.rotation.y = -0.38; // 22° isometric angle revealing front blades, LEDs, and metallic depth
          serverGroup.add(rack);
          if (stateRef.current) {
            stateRef.current.renderer.render(threeScene, camera);
          }
        }
      );

      // Concentric Fiber-Optic Cyber Packet Orbit Rings
      const cyberRings: THREE.Mesh[] = [];
      for (let i = 0; i < 5; i++) {
        const ringGeo = new THREE.TorusGeometry(1.6 + i * 0.5, 0.02, 16, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(accent),
          transparent: true,
          opacity: 0.65 - i * 0.1,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -0.8 + i * 0.4;
        threeScene.add(ring);
        cyberRings.push(ring);
      }

      stateRef.current = {
        renderer,
        scene: threeScene,
        camera,
        carGroup: serverGroup,
        rfWaves: cyberRings,
      };
    }

    // =========================================================================
    // 3. VARIANT: "fastag_barrier_3d" (STEP 05: Real 3D Barrier Gate, Car & Operator)
    // =========================================================================
    else if (subVariant === "fastag_barrier_3d") {
      camera.position.set(3.2, 2.4, 8.2);
      camera.lookAt(-0.4, 0.8, 0);

      // Asphalt Highway Ground
      const roadGeo = new THREE.PlaneGeometry(16, 36);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.85,
        metalness: 0.1,
      });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.y = -1.0;
      threeScene.add(road);

      // White Dashed Lane Dividers
      const dashGeo = new THREE.PlaneGeometry(0.25, 3.5);
      const dashMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      for (let z = -12; z <= 12; z += 6) {
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(-2.4, -0.98, z);
        threeScene.add(dash);
      }

      // Concrete Toll Plaza Island with Safety Striping
      const islandGeo = new THREE.BoxGeometry(1.6, 0.5, 12);
      const islandMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.2,
        roughness: 0.7,
      });
      const island = new THREE.Mesh(islandGeo, islandMat);
      island.position.set(2.2, -0.75, 0);
      threeScene.add(island);

      // Toll Booth Cabin (Steel & Glass)
      const boothGroup = new THREE.Group();
      boothGroup.position.set(2.2, 0.8, -1.2);
      threeScene.add(boothGroup);

      const boothBodyGeo = new THREE.BoxGeometry(1.3, 2.6, 2.6);
      const boothBodyMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.75,
        roughness: 0.25,
      });
      const boothBody = new THREE.Mesh(boothBodyGeo, boothBodyMat);
      boothGroup.add(boothBody);

      // Booth Glass Window
      const windowGeo = new THREE.PlaneGeometry(0.9, 1.2);
      const windowMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transmission: 0.85,
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
      });
      const boothWindow = new THREE.Mesh(windowGeo, windowMat);
      boothWindow.rotation.y = -Math.PI / 2;
      boothWindow.position.set(-0.66, 0.3, 0);
      boothGroup.add(boothWindow);

      // Computer Monitor inside booth
      const monitorGeo = new THREE.BoxGeometry(0.1, 0.4, 0.55);
      const monitorMat = new THREE.MeshStandardMaterial({
        color: 0x020617,
        emissive: 0x10b981,
        emissiveIntensity: 0.8,
      });
      const monitor = new THREE.Mesh(monitorGeo, monitorMat);
      monitor.position.set(-0.35, 0.2, 0);
      boothGroup.add(monitor);

      // Load Real 3D Pneumatic Boom Barrier Pedestal (barrier_gate.glb)
      safeLoadGLTF(
        staticFile("how-fastag-works/media/barrier_gate.glb"),
        (gltf) => {
          const gate = gltf.scene;
          gate.scale.set(1.2, 1.2, 1.2);
          gate.position.set(1.2, -0.75, 1.8);
          threeScene.add(gate);
          if (stateRef.current) {
            stateRef.current.renderer.render(threeScene, camera);
          }
        }
      );

      // Traffic Signal Light Box (Red / Green)
      const signalBoxGeo = new THREE.BoxGeometry(0.3, 0.8, 0.3);
      const signalBoxMat = new THREE.MeshStandardMaterial({ color: 0x090d16 });
      const signalBox = new THREE.Mesh(signalBoxGeo, signalBoxMat);
      signalBox.position.set(1.3, 1.2, 1.8);
      threeScene.add(signalBox);

      const signalLight = new THREE.PointLight(0xef4444, 4.0, 10);
      signalLight.position.set(1.0, 1.2, 2.0);
      threeScene.add(signalLight);

      // Boom Barrier Arm (Red & White Striped)
      const barrierGroup = new THREE.Group();
      barrierGroup.position.set(1.15, 0.25, 1.8);
      threeScene.add(barrierGroup);

      const armGeo = new THREE.BoxGeometry(4.2, 0.14, 0.14);
      const armMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.35,
      });
      const barrierArm = new THREE.Mesh(armGeo, armMat);
      barrierArm.geometry.translate(-2.1, 0, 0);
      barrierGroup.add(barrierArm);

      // Car Group
      const carGroup = new THREE.Group();
      carGroup.position.set(-0.5, -0.4, -6);
      threeScene.add(carGroup);

      // Load Real 3D Car Model (car.glb)
      safeLoadGLTF(
        staticFile("how-fastag-works/media/car.glb"),
        (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z, 0.001);
          const scale = 4.8 / maxDim;

          model.scale.set(scale, scale, scale);
          model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
          model.rotation.y = Math.PI;
          carGroup.add(model);

          if (stateRef.current) {
            stateRef.current.renderer.render(threeScene, camera);
          }
        }
      );

      // Load Real 3D Human Operator on Toll Island beside barrier (human.glb)
      safeLoadGLTF(
        staticFile("how-fastag-works/media/human.glb"),
        (gltf) => {
          const mesh = gltf.scene;
          if (mesh) {
            mesh.scale.set(0.72, 0.72, 0.72);
            mesh.position.set(0.65, -0.5, 2.2);
            mesh.rotation.y = -Math.PI / 1.4;
            threeScene.add(mesh);

            let mixer: THREE.AnimationMixer | undefined;
            if (gltf.animations && gltf.animations.length > 0) {
              mixer = new THREE.AnimationMixer(mesh);
              const action = mixer.clipAction(gltf.animations[0]);
              action.play();
            }

            if (stateRef.current) {
              stateRef.current.humanMesh = mesh;
              stateRef.current.humanMixer = mixer;
              stateRef.current.renderer.render(threeScene, camera);
            }
          }
        }
      );

      stateRef.current = {
        renderer,
        scene: threeScene,
        camera,
        barrierArm: barrierGroup,
        signalLight,
        carGroup,
      };
    }

    // =========================================================================
    // 4. VARIANT: "fastag_toll_3d" (STEP 01: Real 3D RFID Reader, Car & Attendant)
    // =========================================================================
    else {
      camera.position.set(0, 2.4, 11.0);
      camera.lookAt(0, 0.6, 0);

      // Highway Road Surface with Asphalt Texture
      const roadGeo = new THREE.PlaneGeometry(14, 40);
      const roadMat = new THREE.MeshStandardMaterial({
        color: 0x0b1329,
        roughness: 0.85,
        metalness: 0.1,
      });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.y = -1.0;
      threeScene.add(road);

      // White Lane Divider Lines
      const lineGeo = new THREE.PlaneGeometry(0.22, 3.8);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
      for (let z = -15; z <= 15; z += 6) {
        const leftLine = new THREE.Mesh(lineGeo, lineMat);
        leftLine.rotation.x = -Math.PI / 2;
        leftLine.position.set(-2.2, -0.98, z);
        threeScene.add(leftLine);

        const rightLine = new THREE.Mesh(lineGeo, lineMat);
        rightLine.rotation.x = -Math.PI / 2;
        rightLine.position.set(2.2, -0.98, z);
        threeScene.add(rightLine);
      }

      // Overhead Heavy Steel Truss Gantry Frame
      const gantryGroup = new THREE.Group();
      threeScene.add(gantryGroup);

      const pillarGeo = new THREE.BoxGeometry(0.35, 5.2, 0.35);
      const gantryMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.85,
        roughness: 0.25,
      });

      const pillarLeft = new THREE.Mesh(pillarGeo, gantryMat);
      pillarLeft.position.set(-2.6, 1.6, 0);
      gantryGroup.add(pillarLeft);

      const pillarRight = new THREE.Mesh(pillarGeo, gantryMat);
      pillarRight.position.set(2.6, 1.6, 0);
      gantryGroup.add(pillarRight);

      // Top Gantry Cross Truss
      const trussGeo = new THREE.BoxGeometry(5.8, 0.5, 0.5);
      const truss = new THREE.Mesh(trussGeo, gantryMat);
      truss.position.set(0, 4.1, 0);
      gantryGroup.add(truss);

      // Real 3D Overhead RFID Transceiver Antenna (rfid_reader.glb)
      safeLoadGLTF(
        staticFile("how-fastag-works/media/rfid_reader.glb"),
        (gltf) => {
          const reader = gltf.scene;
          reader.scale.set(1.6, 1.6, 1.6);
          reader.position.set(0, 3.6, 0);
          reader.rotation.x = 0.35;
          gantryGroup.add(reader);
          if (stateRef.current) {
            stateRef.current.renderer.render(threeScene, camera);
          }
        }
      );

      // Volumetric 865 MHz Conical Scanning Laser Beam
      const coneGeo = new THREE.ConeGeometry(2.4, 4.8, 36, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(accent),
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const beamCone = new THREE.Mesh(coneGeo, coneMat);
      beamCone.position.set(0, 1.5, 0.5);
      beamCone.rotation.x = Math.PI - 0.32;
      threeScene.add(beamCone);

      // Car Group
      const carGroup = new THREE.Group();
      carGroup.position.set(0, -0.4, 6.5);
      threeScene.add(carGroup);

      // Load Real 3D Car Model (car.glb)
      safeLoadGLTF(
        staticFile("how-fastag-works/media/car.glb"),
        (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z, 0.001);
          const scale = 4.8 / maxDim;

          model.scale.set(scale, scale, scale);
          model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
          model.rotation.y = 0;
          carGroup.add(model);

          if (stateRef.current) {
            stateRef.current.renderer.render(threeScene, camera);
          }
        }
      );

      // Affix High-Res Authentic FASTag Sticker to Windshield
      const stickerTexture = createFASTagStickerTexture();
      const tagPlateGeo = new THREE.PlaneGeometry(0.38, 0.19);
      const tagPlateMat = new THREE.MeshStandardMaterial({
        map: stickerTexture,
        roughness: 0.2,
        metalness: 0.1,
      });
      const tagPlate = new THREE.Mesh(tagPlateGeo, tagPlateMat);
      tagPlate.position.set(0, 0.95, -0.85);
      tagPlate.rotation.x = -0.45;
      carGroup.add(tagPlate);

      // Headlights
      const headLightLeft = new THREE.SpotLight(0xfffbeb, 4.0, 16, Math.PI / 6, 0.3);
      headLightLeft.position.set(-0.75, 0.2, -2.0);
      headLightLeft.target.position.set(-0.75, -1.0, -8);
      carGroup.add(headLightLeft);
      carGroup.add(headLightLeft.target);

      const headLightRight = new THREE.SpotLight(0xfffbeb, 4.0, 16, Math.PI / 6, 0.3);
      headLightRight.position.set(0.75, 0.2, -2.0);
      headLightRight.target.position.set(0.75, -1.0, -8);
      carGroup.add(headLightRight);
      carGroup.add(headLightRight.target);

      // Load Real 3D Human Highway Officer / Toll Attendant (human.glb)
      safeLoadGLTF(
        staticFile("how-fastag-works/media/human.glb"),
        (gltf) => {
          const mesh = gltf.scene;
          if (mesh) {
            mesh.scale.set(0.68, 0.68, 0.68);
            mesh.position.set(-1.8, -1.0, 3.5);
            mesh.rotation.y = Math.PI / 3;
            threeScene.add(mesh);

            let mixer: THREE.AnimationMixer | undefined;
            if (gltf.animations && gltf.animations.length > 0) {
              mixer = new THREE.AnimationMixer(mesh);
              const action = mixer.clipAction(gltf.animations[0]);
              action.play();
            }

            if (stateRef.current) {
              stateRef.current.humanMesh = mesh;
              stateRef.current.humanMixer = mixer;
              stateRef.current.renderer.render(threeScene, camera);
            }
          }
        }
      );

      stateRef.current = {
        renderer,
        scene: threeScene,
        camera,
        carGroup,
        rfWaves: [beamCone],
      };
    }

    if (pendingLoads === 0) {
      renderer.render(threeScene, camera);
      continueRender(handle);
    }

    return () => {
      isDisposed = true;
      renderer.dispose();
    };
  }, [width, height, accent, subVariant, handle]);

  // Frame Animation Loop (Deterministic Remotion Time)
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    if (s.humanMixer) {
      s.humanMixer.update(1 / fps);
    }

    if (subVariant === "fastag_sticker_3d") {
      if (s.tagGroup) {
        s.tagGroup.rotation.y = Math.sin(frame * 0.035) * 0.14;
        s.tagGroup.rotation.x = Math.cos(frame * 0.025) * 0.08;
      }
      if (s.rfWaves) {
        s.rfWaves.forEach((ring, idx) => {
          const wavePhase = (frame * 0.08 + idx * 0.5) % 2.0;
          ring.scale.setScalar(1 + wavePhase * 0.45);
          (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - wavePhase * 0.32);
        });
      }
      if (s.chipMesh) {
        (s.chipMesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
          1.2 + Math.sin(frame * 0.18) * 0.8;
      }
      if (s.antennaMesh) {
        (s.antennaMesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.4 + Math.sin(frame * 0.12) * 0.3;
      }
    } else if (subVariant === "fastag_server_3d") {
      // Subtle cinematic orbit around server rack
      if (s.carGroup) {
        s.carGroup.rotation.y = -0.38 + Math.sin(frame * 0.02) * 0.12;
      }
      // Pulsing fiber data rings
      if (s.rfWaves) {
        s.rfWaves.forEach((ring, idx) => {
          ring.rotation.z = frame * (0.015 + idx * 0.005);
          ring.scale.setScalar(1 + Math.sin(frame * 0.12 + idx) * 0.06);
        });
      }
    } else if (subVariant === "fastag_barrier_3d") {
      if (s.barrierArm) {
        const liftAngle = interpolate(frame, [15, 45], [0, -Math.PI / 2.05], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        s.barrierArm.rotation.z = liftAngle;
      }
      if (s.signalLight) {
        if (frame > 22) {
          s.signalLight.color.setHex(0x10b981);
        } else {
          s.signalLight.color.setHex(0xef4444);
        }
      }
      if (s.carGroup) {
        const carZ = interpolate(frame, [0, durationInFrames], [-6, 7], {
          extrapolateRight: "clamp",
        });
        s.carGroup.position.z = carZ;
      }
    } else {
      if (s.carGroup) {
        const carZ = interpolate(frame, [0, durationInFrames], [6.5, -4.5]);
        s.carGroup.position.z = carZ;
      }
      if (s.rfWaves && s.rfWaves[0]) {
        const cone = s.rfWaves[0];
        (cone.material as THREE.MeshBasicMaterial).opacity =
          0.25 + Math.sin(frame * 0.22) * 0.15;
      }
    }

    s.renderer.render(s.scene, s.camera);
  }, [frame, durationInFrames, fps, subVariant]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />

      {/* Floating Step & Telemetry HUD Overlay (Instagram Safe Zone) */}
      <div
        style={{
          position: "absolute",
          top: L.padTop,
          left: L.padX,
          right: L.padRight,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            alignSelf: "flex-start",
            background: "rgba(15, 23, 42, 0.88)",
            border: `1.5px solid ${accent}66`,
            padding: "8px 18px",
            borderRadius: 9999,
            color: accent,
            fontFamily: MONO,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "0.08em",
            boxShadow: `0 0 16px ${accent}33`,
          }}
        >
          {tag}
        </div>

        {scene.title && (
          <div
            style={{
              fontSize: 44,
              fontWeight: 900,
              fontFamily: FONT,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              textShadow: "0 4px 18px rgba(0,0,0,0.9)",
              lineHeight: 1.15,
              maxWidth: 720,
              background: "rgba(10, 15, 30, 0.72)",
              padding: "10px 18px",
              borderRadius: 14,
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {scene.title}
          </div>
        )}

        {scene.metrics && (
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            {Object.entries(scene.metrics).map(([key, val], idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(6, 11, 24, 0.92)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  padding: "10px 18px",
                  borderRadius: 12,
                  backdropFilter: "blur(12px)",
                }}
              >
                <div style={{ color: "#94A3B8", fontSize: 22, fontFamily: MONO, textTransform: "uppercase" }}>
                  {key}
                </div>
                <div style={{ color: accent, fontSize: 32, fontWeight: 900, fontFamily: FONT, marginTop: 2 }}>
                  {val}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
