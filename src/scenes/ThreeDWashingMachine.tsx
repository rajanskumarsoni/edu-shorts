import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

interface ThreeDWashingMachineProps {
  scene: SceneSpec;
  accent: string;
}

export const ThreeDWashingMachine: React.FC<ThreeDWashingMachineProps> = ({ scene, accent }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const variant = scene.variant || "washing_machine_3d";
  const isMicelleMode = variant === "surfactant_micelle_3d" || variant === "micelle_3d";
  const isSpinOnlyMode = variant === "centrifugal_spin_3d" || variant === "drum_spin_3d";

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    mainGroup: THREE.Group;
    drumMesh?: THREE.Mesh;
    drumGroup?: THREE.Group;
    clothesGroup?: THREE.Group;
    waterParticles?: THREE.Points;
    dropletVelocities?: Float32Array;
    dropletPositions?: Float32Array;
    micelleGroup?: THREE.Group;
    surfactants?: THREE.Group[];
    screenTexture?: THREE.CanvasTexture;
    screenCanvas?: HTMLCanvasElement;
    screenCtx?: CanvasRenderingContext2D;
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const threeScene = new THREE.Scene();
    threeScene.fog = new THREE.FogExp2(0x0b1020, 0.032);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);

    const mainGroup = new THREE.Group();
    threeScene.add(mainGroup);

    // Common Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    threeScene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.4);
    dirLight1.position.set(5, 8, 7);
    threeScene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffaa44, 1.2);
    dirLight2.position.set(-6, -4, 5);
    threeScene.add(dirLight2);

    const drumPointLight = new THREE.PointLight(new THREE.Color(accent), 3.0, 8);
    drumPointLight.position.set(0, 0, 1.2);
    threeScene.add(drumPointLight);

    // Common Materials
    const darkMetalMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.85,
      roughness: 0.28,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.12,
    });
    const stainlessDrumMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.92,
      roughness: 0.22,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(accent),
      emissive: new THREE.Color(accent),
      emissiveIntensity: 0.85,
      metalness: 0.6,
      roughness: 0.2,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      transmission: 0.75,
      opacity: 0.6,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
    });

    let drumMesh: THREE.Mesh | undefined;
    let drumGroup: THREE.Group | undefined;
    let clothesGroup: THREE.Group | undefined;
    let waterParticles: THREE.Points | undefined;
    let dropletVelocities: Float32Array | undefined;
    let dropletPositions: Float32Array | undefined;
    let micelleGroup: THREE.Group | undefined;
    let surfactants: THREE.Group[] | undefined;
    let screenTexture: THREE.CanvasTexture | undefined;
    let screenCanvas: HTMLCanvasElement | undefined;
    let screenCtx: CanvasRenderingContext2D | undefined;

    if (isMicelleMode) {
      // -------------------------------------------------------------
      // SCENE VARIANT: 3D MOLECULAR MICELLE EMULSIFICATION
      // -------------------------------------------------------------
      camera.position.set(0, 0, 7.5);
      camera.lookAt(0, 0, 0);

      micelleGroup = new THREE.Group();
      mainGroup.add(micelleGroup);

      // Central Dirt/Oil Grease Droplet
      const dirtGeo = new THREE.DodecahedronGeometry(1.2, 2);
      const dirtMat = new THREE.MeshStandardMaterial({
        color: 0x854d0e,
        roughness: 0.8,
        metalness: 0.1,
        emissive: 0x3f2203,
        emissiveIntensity: 0.4,
      });
      const dirtCore = new THREE.Mesh(dirtGeo, dirtMat);
      micelleGroup.add(dirtCore);

      // Surfactant Molecules (Hydrophobic Tails + Hydrophilic Heads)
      surfactants = [];
      const numSurfactants = 36;
      const headMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x0088cc,
        emissiveIntensity: 0.8,
        metalness: 0.5,
        roughness: 0.2,
      });
      const tailMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        roughness: 0.4,
        metalness: 0.3,
      });

      for (let i = 0; i < numSurfactants; i++) {
        const phi = Math.acos(-1 + (2 * i) / numSurfactants);
        const theta = Math.sqrt(numSurfactants * Math.PI) * phi;

        const dir = new THREE.Vector3(
          Math.cos(theta) * Math.sin(phi),
          Math.sin(theta) * Math.sin(phi),
          Math.cos(phi)
        ).normalize();

        const surGroup = new THREE.Group();

        // Hydrophobic tail (cylinder extending outwards from dirt core)
        const tailGeo = new THREE.CylinderGeometry(0.04, 0.05, 1.1, 8);
        const tailMesh = new THREE.Mesh(tailGeo, tailMat);
        tailMesh.position.set(0, 0.55, 0);
        surGroup.add(tailMesh);

        // Hydrophilic head (glowing spherical polar head group)
        const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.set(0, 1.25, 0);
        surGroup.add(headMesh);

        // Orient group to match radial direction
        const orientation = new THREE.Quaternion();
        orientation.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        surGroup.quaternion.copy(orientation);
        surGroup.position.copy(dir.clone().multiplyScalar(0.95));

        micelleGroup.add(surGroup);
        surfactants.push(surGroup);
      }

      // Surrounding ambient water dipole particles
      const waterCount = 350;
      const wPos = new Float32Array(waterCount * 3);
      for (let j = 0; j < waterCount; j++) {
        const radius = 2.4 + Math.random() * 3.5;
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const sinPhi = Math.sin(phi);
        wPos[j * 3] = radius * sinPhi * Math.cos(theta);
        wPos[j * 3 + 1] = radius * sinPhi * Math.sin(theta);
        wPos[j * 3 + 2] = radius * Math.cos(phi);
      }
      const waterGeo = new THREE.BufferGeometry();
      waterGeo.setAttribute("position", new THREE.BufferAttribute(wPos, 3));
      const waterMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.12,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });
      waterParticles = new THREE.Points(waterGeo, waterMat);
      threeScene.add(waterParticles);

    } else if (isSpinOnlyMode) {
      // -------------------------------------------------------------
      // SCENE VARIANT: HIGH-SPEED CENTRIFUGAL DRUM SPIN (1400 RPM)
      // -------------------------------------------------------------
      camera.position.set(0, 0, 5.6);
      camera.lookAt(0, 0, 0);

      drumGroup = new THREE.Group();
      mainGroup.add(drumGroup);

      // High-detail drum cylinder with circular perforations
      const drumGeo = new THREE.CylinderGeometry(2.3, 2.3, 2.4, 48, 1, true);
      drumMesh = new THREE.Mesh(drumGeo, stainlessDrumMat);
      drumMesh.rotation.x = Math.PI / 2;
      drumGroup.add(drumMesh);

      // Drum Back Wall with spoke embossing
      const backWallGeo = new THREE.CircleGeometry(2.3, 40);
      const backWall = new THREE.Mesh(backWallGeo, stainlessDrumMat);
      backWall.position.set(0, 0, -1.2);
      drumGroup.add(backWall);

      // 3 Internal curved Baffles / Lifters at 120-degree intervals
      for (let b = 0; b < 3; b++) {
        const angle = (b * Math.PI * 2) / 3;
        const baffleGeo = new THREE.BoxGeometry(0.35, 0.45, 2.2);
        const baffle = new THREE.Mesh(baffleGeo, darkMetalMat);
        baffle.position.set(Math.cos(angle) * 1.95, Math.sin(angle) * 1.95, 0);
        baffle.rotation.z = angle + Math.PI / 2;
        drumGroup.add(baffle);
      }

      // Clothes pinned flat against the drum perimeter by G-force
      clothesGroup = new THREE.Group();
      const clothColors = [0x0284c7, 0xf43f5e, 0x10b981, 0x8b5cf6, 0xf59e0b];
      for (let c = 0; c < 12; c++) {
        const cAngle = (c * Math.PI * 2) / 12 + Math.random() * 0.2;
        const clothGeo = new THREE.BoxGeometry(0.65, 0.18, 0.7);
        const clothMat = new THREE.MeshStandardMaterial({
          color: clothColors[c % clothColors.length],
          roughness: 0.9,
          metalness: 0.05,
        });
        const cloth = new THREE.Mesh(clothGeo, clothMat);
        cloth.position.set(Math.cos(cAngle) * 2.15, Math.sin(cAngle) * 2.15, (Math.random() - 0.5) * 1.4);
        cloth.rotation.z = cAngle + Math.PI / 2;
        clothesGroup.add(cloth);
      }
      drumGroup.add(clothesGroup);

      // Radially flying water droplet particles escaping drum perforations
      const dropCount = 450;
      dropletPositions = new Float32Array(dropCount * 3);
      dropletVelocities = new Float32Array(dropCount * 3);

      for (let d = 0; d < dropCount; d++) {
        const dAngle = Math.random() * Math.PI * 2;
        const dRad = 2.3 + Math.random() * 1.8;
        dropletPositions[d * 3] = Math.cos(dAngle) * dRad;
        dropletPositions[d * 3 + 1] = Math.sin(dAngle) * dRad;
        dropletPositions[d * 3 + 2] = (Math.random() - 0.5) * 2.2;

        dropletVelocities[d * 3] = Math.cos(dAngle) * (0.04 + Math.random() * 0.08);
        dropletVelocities[d * 3 + 1] = Math.sin(dAngle) * (0.04 + Math.random() * 0.08);
        dropletVelocities[d * 3 + 2] = (Math.random() - 0.5) * 0.02;
      }

      const dropGeo = new THREE.BufferGeometry();
      dropGeo.setAttribute("position", new THREE.BufferAttribute(dropletPositions, 3));
      const dropMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.09,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      waterParticles = new THREE.Points(dropGeo, dropMat);
      threeScene.add(waterParticles);

    } else {
      // -------------------------------------------------------------
      // SCENE VARIANT: HERO 3D WASHING MACHINE WITH LCD CONSOLE
      // -------------------------------------------------------------
      camera.position.set(0.6, 0.4, 7.8);
      camera.lookAt(0, -0.1, 0);

      // 1. Outer Cabinet Main Body
      const cabinetGeo = new THREE.BoxGeometry(3.6, 4.4, 3.2);
      const cabinet = new THREE.Mesh(cabinetGeo, darkMetalMat);
      cabinet.position.set(0, -0.3, 0);
      mainGroup.add(cabinet);

      // Sleek beveled neon accent trims along sides
      const trimGeo = new THREE.BoxGeometry(0.06, 4.4, 0.06);
      const leftTrim = new THREE.Mesh(trimGeo, accentMat);
      leftTrim.position.set(-1.81, -0.3, 1.61);
      const rightTrim = new THREE.Mesh(trimGeo, accentMat);
      rightTrim.position.set(1.81, -0.3, 1.61);
      mainGroup.add(leftTrim, rightTrim);

      // Top control fascia panel
      const fasciaGeo = new THREE.BoxGeometry(3.6, 0.9, 0.15);
      const fascia = new THREE.Mesh(fasciaGeo, chromeMat);
      fascia.position.set(0, 1.45, 1.6);
      mainGroup.add(fascia);

      // Detergent dispenser drawer handle on left
      const drawerGeo = new THREE.BoxGeometry(1.0, 0.55, 0.1);
      const drawer = new THREE.Mesh(drawerGeo, darkMetalMat);
      drawer.position.set(-1.15, 1.45, 1.7);
      mainGroup.add(drawer);

      // Rotary Program Knob in center
      const knobGeo = new THREE.CylinderGeometry(0.3, 0.32, 0.15, 32);
      const knob = new THREE.Mesh(knobGeo, chromeMat);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(0.1, 1.45, 1.7);
      mainGroup.add(knob);

      const knobRingGeo = new THREE.RingGeometry(0.33, 0.38, 32);
      const knobRing = new THREE.Mesh(knobRingGeo, accentMat);
      knobRing.position.set(0.1, 1.45, 1.72);
      mainGroup.add(knobRing);

      // Dynamic LCD Display Screen Canvas on Right
      screenCanvas = document.createElement("canvas");
      screenCanvas.width = 512;
      screenCanvas.height = 256;
      screenCtx = screenCanvas.getContext("2d")!;
      screenTexture = new THREE.CanvasTexture(screenCanvas);

      const screenGeo = new THREE.PlaneGeometry(1.2, 0.6);
      const screenMat = new THREE.MeshBasicMaterial({
        map: screenTexture,
        toneMapped: false,
      });
      const screenMesh = new THREE.Mesh(screenGeo, screenMat);
      screenMesh.position.set(1.1, 1.45, 1.69);
      mainGroup.add(screenMesh);

      // 2. Door Assembly & Glass Window
      const doorRimGeo = new THREE.TorusGeometry(1.25, 0.18, 24, 48);
      const doorRim = new THREE.Mesh(doorRimGeo, chromeMat);
      doorRim.position.set(0, -0.4, 1.62);
      mainGroup.add(doorRim);

      const doorGlowGeo = new THREE.TorusGeometry(1.36, 0.04, 16, 48);
      const doorGlow = new THREE.Mesh(doorGlowGeo, accentMat);
      doorGlow.position.set(0, -0.4, 1.63);
      mainGroup.add(doorGlow);

      const doorGlassGeo = new THREE.SphereGeometry(1.18, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.35);
      const doorGlass = new THREE.Mesh(doorGlassGeo, glassMat);
      doorGlass.rotation.x = Math.PI / 2;
      doorGlass.position.set(0, -0.4, 1.55);
      mainGroup.add(doorGlass);

      // 3. Stainless Steel Drum inside Tub
      drumGroup = new THREE.Group();
      drumGroup.position.set(0, -0.4, 0.5);
      mainGroup.add(drumGroup);

      const drumGeo = new THREE.CylinderGeometry(1.18, 1.18, 1.8, 36, 1, true);
      drumMesh = new THREE.Mesh(drumGeo, stainlessDrumMat);
      drumMesh.rotation.x = Math.PI / 2;
      drumGroup.add(drumMesh);

      // Internal Baffles / Lifters (3 ridges inside)
      for (let b = 0; b < 3; b++) {
        const bAngle = (b * Math.PI * 2) / 3;
        const bafGeo = new THREE.BoxGeometry(0.18, 0.22, 1.6);
        const baf = new THREE.Mesh(bafGeo, chromeMat);
        baf.position.set(Math.cos(bAngle) * 1.0, Math.sin(bAngle) * 1.0, 0);
        baf.rotation.z = bAngle + Math.PI / 2;
        drumGroup.add(baf);
      }

      // Tumbling Clothes inside drum
      clothesGroup = new THREE.Group();
      const clothPalette = [0x0284c7, 0xf43f5e, 0x10b981, 0x8b5cf6, 0xf59e0b];
      for (let c = 0; c < 8; c++) {
        const cGeo = new THREE.DodecahedronGeometry(0.24, 1);
        const cMat = new THREE.MeshStandardMaterial({
          color: clothPalette[c % clothPalette.length],
          roughness: 0.85,
        });
        const cMesh = new THREE.Mesh(cGeo, cMat);
        const cRad = 0.5 + Math.random() * 0.4;
        const cAng = Math.random() * Math.PI * 2;
        cMesh.position.set(Math.cos(cAng) * cRad, Math.sin(cAng) * cRad, (Math.random() - 0.5) * 0.8);
        clothesGroup.add(cMesh);
      }
      drumGroup.add(clothesGroup);

      // Foam bubbles and water drops inside the drum
      const bubbleCount = 180;
      const bPos = new Float32Array(bubbleCount * 3);
      for (let bp = 0; bp < bubbleCount; bp++) {
        const bAng = Math.random() * Math.PI * 2;
        const bRad = Math.random() * 0.95;
        bPos[bp * 3] = Math.cos(bAng) * bRad;
        bPos[bp * 3 + 1] = Math.sin(bAng) * bRad - 0.2; // pool near bottom
        bPos[bp * 3 + 2] = (Math.random() - 0.5) * 1.2;
      }
      const bubbleGeo = new THREE.BufferGeometry();
      bubbleGeo.setAttribute("position", new THREE.BufferAttribute(bPos, 3));
      const bubbleMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.08,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      waterParticles = new THREE.Points(bubbleGeo, bubbleMat);
      drumGroup.add(waterParticles);
    }

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      mainGroup,
      drumMesh,
      drumGroup,
      clothesGroup,
      waterParticles,
      dropletVelocities,
      dropletPositions,
      micelleGroup,
      surfactants,
      screenTexture,
      screenCanvas,
      screenCtx,
    };

    return () => {
      renderer.dispose();
      threeScene.clear();
    };
  }, [width, height, accent, isMicelleMode, isSpinOnlyMode]);

  // Frame-by-Frame Animation & Dynamic Telemetry
  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;

    const {
      renderer,
      scene: threeScene,
      camera,
      mainGroup,
      drumGroup,
      clothesGroup,
      waterParticles,
      dropletPositions,
      dropletVelocities,
      micelleGroup,
      surfactants,
      screenTexture,
      screenCanvas,
      screenCtx,
    } = state;

    if (isMicelleMode && micelleGroup && surfactants) {
      // -------------------------------------------------------------
      // MICELLE VARIANT ANIMATION
      // -------------------------------------------------------------
      const rotY = frame * 0.015;
      const rotX = Math.sin(frame * 0.02) * 0.25;
      micelleGroup.rotation.y = rotY;
      micelleGroup.rotation.x = rotX;

      // Pulsing surfactant heads capturing grease
      surfactants.forEach((sur, idx) => {
        const pulse = 1.0 + Math.sin(frame * 0.08 + idx * 0.3) * 0.06;
        sur.scale.set(pulse, pulse, pulse);
      });

      if (waterParticles) {
        waterParticles.rotation.y = -frame * 0.008;
      }

      // Camera slow cinematic dolly
      camera.position.z = 7.5 - Math.sin(frame * 0.015) * 0.4;

    } else if (isSpinOnlyMode && drumGroup) {
      // -------------------------------------------------------------
      // CENTRIFUGAL 1400 RPM SPIN ANIMATION
      // -------------------------------------------------------------
      // Extreme rotational speed around Z axis
      const spinSpeed = 0.45; // simulated 1400 RPM blur
      drumGroup.rotation.z += spinSpeed;

      // Clothes vibration under high G-force
      if (clothesGroup) {
        clothesGroup.position.x = (Math.random() - 0.5) * 0.02;
        clothesGroup.position.y = (Math.random() - 0.5) * 0.02;
      }

      // Radial droplet outward escape simulation
      if (waterParticles && dropletPositions && dropletVelocities) {
        const count = dropletPositions.length / 3;
        const posAttr = waterParticles.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < count; i++) {
          dropletPositions[i * 3] += dropletVelocities[i * 3];
          dropletPositions[i * 3 + 1] += dropletVelocities[i * 3 + 1];

          const dist = Math.hypot(dropletPositions[i * 3], dropletPositions[i * 3 + 1]);
          if (dist > 4.2) {
            // Reset droplet to drum perimeter
            const ang = Math.random() * Math.PI * 2;
            dropletPositions[i * 3] = Math.cos(ang) * 2.3;
            dropletPositions[i * 3 + 1] = Math.sin(ang) * 2.3;
          }
        }
        posAttr.needsUpdate = true;
      }

      // High-energy camera vibration and dolly
      const microVibe = (Math.sin(frame * 2.5) * 0.015);
      camera.position.x = microVibe;
      camera.position.y = microVibe * 0.5;
      camera.position.z = 5.6 - Math.min(frame * 0.008, 0.5);

    } else {
      // -------------------------------------------------------------
      // HERO WASHING MACHINE ANIMATION & DYNAMIC LCD
      // -------------------------------------------------------------
      // Wash tumble back-and-forth oscillation
      const tumbleAngle = Math.sin(frame * 0.07) * 2.2;
      if (drumGroup) {
        drumGroup.rotation.z = tumbleAngle;
      }

      // Sloshing foam / water bubbles
      if (waterParticles) {
        waterParticles.rotation.z = -tumbleAngle * 0.4;
      }

      // Smooth 3D machine chassis orbit / dolly
      const introSpring = spring({
        frame,
        fps,
        config: { damping: 14, stiffness: 80 },
      });
      mainGroup.rotation.y = interpolate(introSpring, [0, 1], [-0.35, 0.12]);
      mainGroup.position.y = interpolate(introSpring, [0, 1], [-0.5, 0]);

      // Camera dolly in
      camera.position.z = 7.8 - Math.min(frame * 0.012, 0.8);

      // Render Dynamic LCD Display on machine console
      if (screenCanvas && screenCtx && screenTexture) {
        screenCtx.fillStyle = "#020617";
        screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);

        // Grid lines background
        screenCtx.strokeStyle = "rgba(56, 189, 248, 0.12)";
        screenCtx.lineWidth = 1;
        for (let x = 0; x < 512; x += 32) {
          screenCtx.beginPath();
          screenCtx.moveTo(x, 0);
          screenCtx.lineTo(x, 256);
          screenCtx.stroke();
        }

        // Header status bar
        screenCtx.fillStyle = "#38bdf8";
        screenCtx.font = "bold 24px monospace";
        screenCtx.fillText("INVERTER DIRECT DRIVE", 24, 42);

        // Active Cycle Tag
        const isSpinPhase = frame > 80;
        screenCtx.fillStyle = isSpinPhase ? "#facc15" : "#00f0ff";
        screenCtx.font = "bold 34px sans-serif";
        screenCtx.fillText(isSpinPhase ? "SPIN CYCLE // ACTIVE" : "TUMBLE WASH // ACTIVE", 24, 94);

        // Real-time telemetry metrics
        screenCtx.fillStyle = "#ffffff";
        screenCtx.font = "26px monospace";
        screenCtx.fillText(isSpinPhase ? "RPM: 1,400 MAX" : "RPM: 48 (TUMBLE)", 24, 142);
        screenCtx.fillText("TEMP: 40°C OPTIMAL", 24, 180);

        // Progress bar
        const progress = Math.min(frame / 120, 1);
        screenCtx.fillStyle = "rgba(255, 255, 255, 0.15)";
        screenCtx.fillRect(24, 210, 464, 16);
        screenCtx.fillStyle = "#00f0ff";
        screenCtx.fillRect(24, 210, 464 * progress, 16);

        screenTexture.needsUpdate = true;
      }
    }

    renderer.render(threeScene, camera);
  }, [frame, fps, isMicelleMode, isSpinOnlyMode]);

  const tagText = resolveSceneTag(scene, "01 / THE MECHANICAL HERO");

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1020" }}>
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
        }}
      />

      {/* Tracked Header Tag */}
      <div
        style={{
          position: "absolute",
          top: 90,
          left: 60,
          right: 60,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: accent,
            background: "rgba(11, 16, 32, 0.82)",
            padding: "10px 24px",
            borderRadius: 30,
            border: `1px solid ${accent}55`,
            backdropFilter: "blur(12px)",
          }}
        >
          {tagText}
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#ffffff",
            background: "rgba(15, 23, 42, 0.75)",
            padding: "8px 20px",
            borderRadius: 20,
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          {isMicelleMode
            ? "SURFACTANT // MICELLE"
            : isSpinOnlyMode
            ? "1400 RPM // CENTRIFUGAL"
            : "BLDC MOTOR // DIRECT DRIVE"}
        </div>
      </div>
    </AbsoluteFill>
  );
};

