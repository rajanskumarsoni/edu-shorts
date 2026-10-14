import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";

// High-fidelity 3D Bluetooth Visualization Component
// Supports all 12 dedicated physical engineering variants:
// 1. "bluetooth_link_3d": Smartphone, earbuds, 3D radio pulses, digital packets, grid floor
// 2. "bluetooth_radio_3d": Antenna cutaway, 2.4 GHz electromagnetic wave propagation, digital data vs sound
// 3. "bluetooth_discovery_3d": Multi-device field (phone, earbuds, laptop, watch, speaker), advertising vs scanning, lock
// 4. "bluetooth_pairing_3d": Phone Bluetooth settings UI, cryptographic key exchange, glowing 3D security lock, active link
// 5. "bluetooth_layers_3d": 4-layer smartphone cutaway (Music App -> Audio Codec -> BT Software Stack -> Radio + Antenna)
// 6. "bluetooth_spectrum_3d" / "frequency_hopping_3d": 2.4 GHz ISM band, 79 channels, 1600 hops/s AFH, Wi-Fi coexistence
// 7. "bluetooth_audio_path_3d": Complete chain: PCM waveform -> packets -> radio -> DAC -> vibrating speaker diaphragm -> sound waves
// 8. "bluetooth_interference_3d": Distance, concrete wall obstacle, RF noise interference, battery alert, recovery
// 9. "bluetooth_local_p2p_3d": Direct peer-to-peer radio link vs Internet cloud disconnect, proving 100% offline local link
// 10. "bluetooth_ecosystem_3d": Device ecosystem (keyboard, smartwatch, game controller, speaker, sensor, earbuds) around phone
// 11. "bluetooth_pipeline_3d": Vertical master flow diagram (Discover, Select, Pair, Connect, Transmit, Receive, Process, Play)
// 12. "bluetooth_reveal_3d": Final hero reveal with cutaway data pipeline, radio waves, vibrating speaker, and takeaway card

export const ThreeDBluetoothSpace: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const landscape = width > height;

  const variant = scene.variant || "bluetooth_link_3d";

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    rootGroup: THREE.Group;
    animatedObjects: { [key: string]: any };
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
    const camera = new THREE.PerspectiveCamera(
      landscape ? 40 : 48,
      width / height,
      0.1,
      100
    );
    // Adjusted camera distance for vertical framing so 3D objects fill 65-70% of mobile screen
    camera.position.set(0, landscape ? 1.5 : 0.2, landscape ? 9.5 : 8.8);

    const rootGroup = new THREE.Group();
    if (!landscape) {
      rootGroup.scale.set(1.16, 1.16, 1.16);
    }
    threeScene.add(rootGroup);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    threeScene.add(ambientLight);
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 8, 7);
    threeScene.add(keyLight);
    const cyanRim = new THREE.DirectionalLight(new THREE.Color(accent), 2.8);
    cyanRim.position.set(-8, -2, -5);
    threeScene.add(cyanRim);
    const yellowAccent = new THREE.PointLight(0xffc857, 1.8, 30);
    yellowAccent.position.set(2, 4, 6);
    threeScene.add(yellowAccent);

    // Tech Perspective Grid Floor
    const gridHelper = new THREE.GridHelper(26, 26, new THREE.Color(accent), 0x1e293b);
    gridHelper.position.y = landscape ? -2.2 : -4.2;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.35;
    rootGroup.add(gridHelper);

    const animatedObjects: { [key: string]: any } = {};

    // -------------------------------------------------------------
    // HELPER: CREATE 3D SMARTPHONE
    // -------------------------------------------------------------
    const createPhone = (pos: [number, number, number], rotY: number = 0, scale: number = 1.0) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(...pos);
      pGroup.scale.set(scale, scale, scale);
      pGroup.rotation.y = rotY;

      // Chassis
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 3.0, 0.16),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.25 })
      );
      pGroup.add(body);

      // Cyan Bezel Edge
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(1.54, 3.04, 0.14),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(accent), wireframe: true, transparent: true, opacity: 0.5 })
      );
      pGroup.add(edge);

      // Screen
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 2.8),
        new THREE.MeshBasicMaterial({ color: 0x0369a1 })
      );
      screen.position.z = 0.085;
      pGroup.add(screen);

      return { pGroup, body, screen };
    };

    // -------------------------------------------------------------
    // HELPER: CREATE 3D WIRELESS EARBUD
    // -------------------------------------------------------------
    const createEarbud = (pos: [number, number, number], rotY: number = 0, scale: number = 1.0) => {
      const eGroup = new THREE.Group();
      eGroup.position.set(...pos);
      eGroup.scale.set(scale, scale, scale);
      eGroup.rotation.y = rotY;

      // Head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.3 })
      );
      eGroup.add(head);

      // Nozzle
      const nozzle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.22, 0.3, 16),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
      );
      nozzle.rotation.z = Math.PI / 2;
      nozzle.position.set(-0.32, 0.1, 0);
      eGroup.add(nozzle);

      // Stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.13, 1.1, 16),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.3 })
      );
      stem.position.set(0.1, -0.6, 0);
      stem.rotation.z = 0.15;
      eGroup.add(stem);

      // Status LED
      const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      led.position.set(0.16, -0.35, 0.12);
      eGroup.add(led);

      return { eGroup, head, nozzle, stem, led };
    };

    // -------------------------------------------------------------
    // SCENE 1: BLUETOOTH LINK 3D
    // -------------------------------------------------------------
    if (variant === "bluetooth_link_3d" || variant === "bluetooth_3d") {
      const phonePos: [number, number, number] = landscape ? [-4.2, 0, 0] : [-0.85, -1.5, 0];
      const earbudPos: [number, number, number] = landscape ? [4.2, 0.2, 0] : [0.85, 1.4, 0.2];

      const { pGroup, screen } = createPhone(phonePos, landscape ? 0.35 : 0.25);

      // Equalizer bars on screen
      const bars: THREE.Mesh[] = [];
      for (let i = 0; i < 10; i++) {
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.8, 0.02),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        bar.position.set(-0.45 + i * 0.1, 0.2, 0.095);
        pGroup.add(bar);
        bars.push(bar);
      }
      animatedObjects.phoneBars = bars;

      // Play button
      const playBtn = new THREE.Mesh(
        new THREE.CircleGeometry(0.22, 24),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      playBtn.position.set(0, -0.65, 0.095);
      pGroup.add(playBtn);
      animatedObjects.playBtn = playBtn;

      rootGroup.add(pGroup);
      animatedObjects.phoneGroup = pGroup;

      const { eGroup, led } = createEarbud(earbudPos, landscape ? -0.4 : -0.3);
      rootGroup.add(eGroup);
      animatedObjects.earbudGroup = eGroup;
      animatedObjects.earbudLed = led;

      // Second earbud offset
      const earbud2Pos: [number, number, number] = landscape ? [3.4, -0.7, -0.8] : [1.4, 0.8, -0.6];
      const { eGroup: eGroup2 } = createEarbud(earbud2Pos, -0.5, 0.85);
      rootGroup.add(eGroup2);

      // Expanding cyan radio wave pulses
      const waves: THREE.Mesh[] = [];
      for (let i = 0; i < 6; i++) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.35, 0.45, 36),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(accent),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.75,
          })
        );
        rootGroup.add(ring);
        waves.push(ring);
      }
      animatedObjects.radioWaves = waves;

      // Dissolving glowing cable (dissolves away dramatically during first 1.5s)
      const cablePts: THREE.Vector3[] = [];
      const numPts = 30;
      for (let p = 0; p <= numPts; p++) {
        const alpha = p / numPts;
        const x = phonePos[0] + (earbudPos[0] - phonePos[0]) * alpha;
        const y = phonePos[1] + (earbudPos[1] - phonePos[1]) * alpha + Math.sin(alpha * Math.PI) * 0.45;
        const z = phonePos[2] + (earbudPos[2] - phonePos[2]) * alpha;
        cablePts.push(new THREE.Vector3(x, y, z));
      }
      const cableGeo = new THREE.BufferGeometry().setFromPoints(cablePts);
      const cableMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 1.0,
      });
      const cableLine = new THREE.Line(cableGeo, cableMat);
      rootGroup.add(cableLine);
      animatedObjects.dissolvingCable = cableLine;

      // 3D Question Mark floating in the gap
      const qGroup = new THREE.Group();
      qGroup.position.set(0, -0.05, 0.2);
      const qHook = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.08, 16, 24, Math.PI * 1.35),
        new THREE.MeshBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.0 })
      );
      qHook.rotation.z = -Math.PI / 4;
      qHook.position.set(0, 0.36, 0);
      qGroup.add(qHook);
      const qStem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.28, 12),
        new THREE.MeshBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.0 })
      );
      qStem.position.set(0, 0.06, 0);
      qGroup.add(qStem);
      const qDot = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.0 })
      );
      qDot.position.set(0, -0.28, 0);
      qGroup.add(qDot);
      rootGroup.add(qGroup);
      animatedObjects.questionMarkGroup = qGroup;
      animatedObjects.questionMeshes = [qHook, qStem, qDot];
    }

    // -------------------------------------------------------------
    // SCENE 2: RADIO WAVES, NOT SOUND WAVES
    // -------------------------------------------------------------
    else if (variant === "bluetooth_radio_3d") {
      const phonePos: [number, number, number] = landscape ? [-3.8, 0, 0] : [0, -1.6, 0];
      const earbudPos: [number, number, number] = landscape ? [3.8, 0.2, 0] : [0, 2.0, 0];

      // Transparent cutaway phone chassis
      const cutawayPhone = new THREE.Group();
      cutawayPhone.position.set(...phonePos);
      const glassBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 3.0, 0.2),
        new THREE.MeshStandardMaterial({
          color: 0x0369a1,
          transparent: true,
          opacity: 0.35,
          roughness: 0.1,
          metalness: 0.9,
        })
      );
      cutawayPhone.add(glassBody);

      // Internal Audio Processing Chip
      const audioChip = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.6, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 })
      );
      audioChip.position.set(0, -0.4, 0);
      cutawayPhone.add(audioChip);

      // Radio & Antenna Module
      const rfModule = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.5, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.9 })
      );
      rfModule.position.set(0, 0.6, 0);
      cutawayPhone.add(rfModule);

      rootGroup.add(cutawayPhone);

      const { eGroup, led } = createEarbud(earbudPos, 0, 0.95);
      rootGroup.add(eGroup);
      animatedObjects.earbudGroup = eGroup;
      animatedObjects.earbudLed = led;

      // 2.4 GHz Spherical Wavefronts propagating outwards
      const waveFronts: THREE.Mesh[] = [];
      for (let i = 0; i < 5; i++) {
        const wf = new THREE.Mesh(
          new THREE.RingGeometry(0.3, 0.4, 32),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(accent),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
          })
        );
        rootGroup.add(wf);
        waveFronts.push(wf);
      }
      animatedObjects.waveFronts = waveFronts;

      // Streaming Digital Packets (cubes)
      const packets: THREE.Mesh[] = [];
      for (let j = 0; j < 6; j++) {
        const p = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.18, 0.18),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        rootGroup.add(p);
        packets.push(p);
      }
      animatedObjects.radioPackets = packets;
    }

    // -------------------------------------------------------------
    // SCENE 3: HOW DEVICES FIND EACH OTHER (BLE DISCOVERY)
    // -------------------------------------------------------------
    else if (variant === "bluetooth_discovery_3d") {
      const phonePos: [number, number, number] = landscape ? [0, -0.2, 0] : [0, -0.6, 0];
      const { pGroup } = createPhone(phonePos, 0, 0.9);
      rootGroup.add(pGroup);

      // Radar scanning rings from phone
      const scanRings: THREE.Mesh[] = [];
      for (let i = 0; i < 4; i++) {
        const sRing = new THREE.Mesh(
          new THREE.RingGeometry(0.8, 0.88, 48),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(accent),
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.65,
          })
        );
        sRing.rotation.x = Math.PI / 2;
        rootGroup.add(sRing);
        scanRings.push(sRing);
      }
      animatedObjects.scanRings = scanRings;

      // Target Earbuds (Upper Right)
      const earbudPos: [number, number, number] = landscape ? [3.8, 0.8, 0] : [0.9, 1.8, 0.2];
      const { eGroup: targetBud } = createEarbud(earbudPos, -0.4, 0.85);
      // Yellow Advertising ring around earbuds
      const adRing = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.6, 32),
        new THREE.MeshBasicMaterial({
          color: 0xffc857,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        })
      );
      adRing.rotation.x = Math.PI / 2;
      targetBud.add(adRing);
      rootGroup.add(targetBud);
      animatedObjects.adRing = adRing;
      animatedObjects.targetBud = targetBud;

      // Smartwatch (Upper Left)
      const watchPos: [number, number, number] = landscape ? [-3.8, 1.2, -0.5] : [-1.1, 1.6, -0.4];
      const watch = new THREE.Group();
      watch.position.set(...watchPos);
      const wBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.15, 24),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      wBody.rotation.x = Math.PI / 2;
      watch.add(wBody);
      rootGroup.add(watch);

      // Laptop (Lower Left)
      const laptopPos: [number, number, number] = landscape ? [-3.6, -1.3, 0.5] : [-1.0, -2.4, 0.2];
      const laptop = new THREE.Group();
      laptop.position.set(...laptopPos);
      const lBase = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.08, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x475569 })
      );
      laptop.add(lBase);
      const lScreen = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.9, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x1e293b })
      );
      lScreen.position.set(0, 0.5, -0.4);
      laptop.add(lScreen);
      rootGroup.add(laptop);

      // Speaker (Lower Right)
      const speakerPos: [number, number, number] = landscape ? [3.6, -1.2, 0.5] : [1.0, -2.3, 0.1];
      const speaker = new THREE.Group();
      speaker.position.set(...speakerPos);
      const spkMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 0.85, 24),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      speaker.add(spkMesh);
      rootGroup.add(speaker);

      // Yellow Lock Line between Phone and Earbuds
      const lockLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...phonePos),
        new THREE.Vector3(...earbudPos),
      ]);
      const lockLine = new THREE.Line(
        lockLineGeo,
        new THREE.LineBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.9 })
      );
      rootGroup.add(lockLine);
      animatedObjects.lockLine = lockLine;
    }

    // -------------------------------------------------------------
    // SCENE 4: PAIRING AND CONNECTING
    // -------------------------------------------------------------
    else if (variant === "bluetooth_pairing_3d") {
      const phonePos: [number, number, number] = landscape ? [-3.2, 0, 0] : [0, -1.2, 0];
      const earbudPos: [number, number, number] = landscape ? [3.5, 0.5, 0] : [0, 2.2, 0];

      const { pGroup } = createPhone(phonePos, 0, 0.88);
      rootGroup.add(pGroup);

      const { eGroup } = createEarbud(earbudPos, 0, 0.85);
      rootGroup.add(eGroup);

      // Security Visualization Center
      const lockGroup = new THREE.Group();
      lockGroup.position.set(0, landscape ? 0.2 : 0.6, 0);

      // 3D Padlock Body
      const lockBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.7, 0.24),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 })
      );
      lockGroup.add(lockBody);

      // 3D Padlock Shackle
      const shackleGeo = new THREE.TorusGeometry(0.28, 0.08, 16, 32, Math.PI);
      const shackle = new THREE.Mesh(
        shackleGeo,
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9 })
      );
      shackle.position.set(0, 0.35, 0);
      lockGroup.add(shackle);

      // Green Check Ring
      const checkRing = new THREE.Mesh(
        new THREE.RingGeometry(0.7, 0.8, 36),
        new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide })
      );
      checkRing.position.z = 0.15;
      lockGroup.add(checkRing);

      rootGroup.add(lockGroup);
      animatedObjects.lockGroup = lockGroup;

      // Cyan Active Link Beam
      const linkPoints = [new THREE.Vector3(...phonePos), new THREE.Vector3(...earbudPos)];
      const linkGeo = new THREE.BufferGeometry().setFromPoints(linkPoints);
      const linkLine = new THREE.Line(
        linkGeo,
        new THREE.LineBasicMaterial({ color: new THREE.Color(accent), transparent: true, opacity: 0.85 })
      );
      rootGroup.add(linkLine);
      animatedObjects.activeLinkLine = linkLine;
    }

    // -------------------------------------------------------------
    // SCENE 4: MUSIC BECOMES DIGITAL DATA (WAVEFORM -> BITS -> PACKETS)
    // -------------------------------------------------------------
    else if (
      variant === "bluetooth_digital_data_3d" ||
      variant === "bluetooth_layers_3d" ||
      variant === "music_to_packets_3d"
    ) {
      const dataGroup = new THREE.Group();
      dataGroup.position.set(0, 0, 0);

      // 1. Top: Smartphone Audio Player
      const { pGroup } = createPhone([0, 2.2, 0], 0, 0.7);
      dataGroup.add(pGroup);

      // 2. Continuous Analog Music Waveform Ribbon
      const wavePts: THREE.Vector3[] = [];
      const waveCount = 50;
      for (let w = 0; w <= waveCount; w++) {
        const x = -1.6 + (w / waveCount) * 3.2;
        const y = 1.0 + Math.sin((w / waveCount) * Math.PI * 4) * 0.28;
        wavePts.push(new THREE.Vector3(x, y, 0.1));
      }
      const waveGeo = new THREE.BufferGeometry().setFromPoints(wavePts);
      const waveLine = new THREE.Line(
        waveGeo,
        new THREE.LineBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.9 })
      );
      dataGroup.add(waveLine);
      animatedObjects.musicWaveform = waveLine;

      // 3. Falling Digital Data Bit Cubes (0s & 1s)
      const bitCubes: THREE.Mesh[] = [];
      for (let b = 0; b < 10; b++) {
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.2, 0.2),
          new THREE.MeshStandardMaterial({
            color: b % 2 === 0 ? new THREE.Color(accent) : 0xffc857,
            metalness: 0.8,
            roughness: 0.2,
          })
        );
        cube.position.set((Math.random() - 0.5) * 1.8, 0.5 - (b / 10) * 1.4, 0.1);
        dataGroup.add(cube);
        bitCubes.push(cube);
      }
      animatedObjects.bitCubes = bitCubes;

      // 4. Assembled "PACKET" Containers (Headers + Payloads)
      const packetContainers: THREE.Group[] = [];
      const packetY = [-0.8, -1.6, -2.4];
      packetY.forEach((py, idx) => {
        const pkt = new THREE.Group();
        pkt.position.set(0, py, 0.1);

        // Packet outer bounding box
        const pBox = new THREE.Mesh(
          new THREE.BoxGeometry(1.9, 0.55, 0.22),
          new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            transparent: true,
            opacity: 0.75,
            metalness: 0.9,
          })
        );
        pkt.add(pBox);

        // Neon Border
        const pEdge = new THREE.Mesh(
          new THREE.BoxGeometry(1.92, 0.57, 0.24),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(accent), wireframe: true, transparent: true, opacity: 0.85 })
        );
        pkt.add(pEdge);

        // Header indicator tag (yellow)
        const pHead = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.45, 0.2),
          new THREE.MeshBasicMaterial({ color: 0xffc857 })
        );
        pHead.position.set(-0.68, 0, 0.05);
        pkt.add(pHead);

        dataGroup.add(pkt);
        packetContainers.push(pkt);
      });
      animatedObjects.packetContainers = packetContainers;

      rootGroup.add(dataGroup);
    }

    // -------------------------------------------------------------
    // SCENE 6: 2.4 GHz SPECTRUM & FREQUENCY HOPPING
    // -------------------------------------------------------------
    else if (variant === "bluetooth_spectrum_3d" || variant === "frequency_hopping_3d") {
      const channelCount = 79;
      const channelBars: THREE.Mesh[] = [];
      const spectrumGroup = new THREE.Group();
      spectrumGroup.position.set(0, landscape ? -0.8 : -0.5, 0);

      const spanWidth = landscape ? 12 : 6.8;
      const barWidth = (spanWidth / channelCount) * 0.75;

      for (let i = 0; i < channelCount; i++) {
        const x = -spanWidth / 2 + (i / channelCount) * spanWidth;
        const bGeo = new THREE.BoxGeometry(barWidth, 1.2, 0.12);
        const bMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.5,
          roughness: 0.4,
        });
        const bar = new THREE.Mesh(bGeo, bMat);
        bar.position.set(x, 0.6, 0);
        spectrumGroup.add(bar);
        channelBars.push(bar);
      }
      rootGroup.add(spectrumGroup);
      animatedObjects.channelBars = channelBars;

      // Active Hopping Beams
      const hopBeams: THREE.Mesh[] = [];
      for (let j = 0; j < 3; j++) {
        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 2.2, 16),
          new THREE.MeshBasicMaterial({
            color: j === 0 ? 0xffc857 : new THREE.Color(accent),
            transparent: true,
            opacity: 0.9,
          })
        );
        spectrumGroup.add(beam);
        hopBeams.push(beam);
      }
      animatedObjects.hopBeams = hopBeams;

      // Wi-Fi 20 MHz Interference Bell Curve
      const wifiPoints: THREE.Vector3[] = [];
      const wifiWidth = spanWidth * 0.3;
      for (let x = -wifiWidth / 2; x <= wifiWidth / 2; x += 0.15) {
        const y = Math.exp(-Math.pow(x / (wifiWidth * 0.35), 2)) * 2.2;
        wifiPoints.push(new THREE.Vector3(x - 1.2, y + 0.1, -0.2));
      }
      const wifiCurve = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(wifiPoints),
        new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.75 })
      );
      spectrumGroup.add(wifiCurve);
    }

    // -------------------------------------------------------------
    // SCENE 7: DIGITAL PACKETS TO ACOUSTIC SOUND
    // -------------------------------------------------------------
    else if (variant === "bluetooth_audio_path_3d" || variant === "packet_to_sound_3d") {
      const txPos: [number, number, number] = landscape ? [-4.5, 0, 0] : [0, 2.2, 0];
      const speakerPos: [number, number, number] = landscape ? [3.5, 0, 0] : [0, -1.8, 0];

      // Phone Transmitter Module
      const txBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 1.4, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85 })
      );
      txBox.position.set(...txPos);
      rootGroup.add(txBox);

      // Data Packets streaming down/across
      const packets: THREE.Mesh[] = [];
      for (let i = 0; i < 6; i++) {
        const p = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.2, 0.2),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        rootGroup.add(p);
        packets.push(p);
      }
      animatedObjects.pathPackets = packets;

      // Speaker Diaphragm Chamber
      const speakerGroup = new THREE.Group();
      speakerGroup.position.set(...speakerPos);

      const cone = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 0.4, 0.8, 32, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x334155, side: THREE.DoubleSide })
      );
      cone.rotation.x = landscape ? 0 : Math.PI / 2;
      cone.rotation.z = landscape ? Math.PI / 2 : 0;
      speakerGroup.add(cone);

      // Vibrating Diaphragm Dome
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 })
      );
      dome.rotation.x = landscape ? 0 : Math.PI / 2;
      dome.rotation.z = landscape ? -Math.PI / 2 : 0;
      speakerGroup.add(dome);
      animatedObjects.speakerDome = dome;

      // Acoustic Sound Wave Arcs
      const soundArcs: THREE.Mesh[] = [];
      for (let k = 0; k < 4; k++) {
        const arc = new THREE.Mesh(
          new THREE.RingGeometry(0.4, 0.5, 24, 1, 0, Math.PI),
          new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
        );
        if (!landscape) {
          arc.rotation.z = -Math.PI / 2;
        } else {
          arc.rotation.y = Math.PI / 2;
        }
        speakerGroup.add(arc);
        soundArcs.push(arc);
      }
      animatedObjects.soundArcs = soundArcs;
      rootGroup.add(speakerGroup);
    }

    // -------------------------------------------------------------
    // SCENE 8: WHY CONNECTIONS FAIL (4 LIMITATIONS)
    // -------------------------------------------------------------
    else if (variant === "bluetooth_interference_3d") {
      const phonePos: [number, number, number] = landscape ? [-3.8, 0, 0] : [0, -1.5, 0];
      const earbudPos: [number, number, number] = landscape ? [3.8, 0, 0] : [0, 1.6, 0];

      const { pGroup } = createPhone(phonePos, 0, 0.85);
      rootGroup.add(pGroup);

      const { eGroup } = createEarbud(earbudPos, 0, 0.85);
      rootGroup.add(eGroup);
      animatedObjects.failEarbud = eGroup;

      // 3D Concrete Obstacle Wall
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(landscape ? 0.35 : 2.4, landscape ? 3.0 : 0.35, 1.8),
        new THREE.MeshStandardMaterial({ color: 0x475569, transparent: true, opacity: 0.85 })
      );
      wall.position.set(0, landscape ? 0 : 0.1, 0);
      rootGroup.add(wall);
      animatedObjects.obstacleWall = wall;

      // Red RF Noise Points
      const noiseGeo = new THREE.BufferGeometry();
      const noiseCount = 36;
      const noisePos = new Float32Array(noiseCount * 3);
      for (let i = 0; i < noiseCount; i++) {
        noisePos[i * 3] = (Math.random() - 0.5) * 3;
        noisePos[i * 3 + 1] = (Math.random() - 0.5) * 3;
        noisePos[i * 3 + 2] = (Math.random() - 0.5) * 2;
      }
      noiseGeo.setAttribute("position", new THREE.BufferAttribute(noisePos, 3));
      const noisePoints = new THREE.Points(
        noiseGeo,
        new THREE.PointsMaterial({ color: 0xef4444, size: 0.14 })
      );
      rootGroup.add(noisePoints);
      animatedObjects.noisePoints = noisePoints;
    }

    // -------------------------------------------------------------
    // SCENE 9: BLUETOOTH DOES NOT REQUIRE INTERNET (LOCAL P2P)
    // -------------------------------------------------------------
    else if (variant === "bluetooth_local_p2p_3d") {
      const phonePos: [number, number, number] = landscape ? [-3.2, -0.4, 0] : [-0.7, -0.8, 0];
      const earbudPos: [number, number, number] = landscape ? [3.2, 0.4, 0] : [0.7, 1.0, 0];

      const { pGroup } = createPhone(phonePos, 0, 0.85);
      rootGroup.add(pGroup);

      const { eGroup } = createEarbud(earbudPos, 0, 0.85);
      rootGroup.add(eGroup);

      // Cyan Direct Bluetooth Link
      const btLink = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...phonePos), new THREE.Vector3(...earbudPos)]),
        new THREE.LineBasicMaterial({ color: new THREE.Color(accent), transparent: true, opacity: 0.9 })
      );
      rootGroup.add(btLink);

      // Floating Internet Cloud
      const cloudGroup = new THREE.Group();
      cloudGroup.position.set(landscape ? -3.2 : -0.7, landscape ? 2.2 : 2.0, 0);

      const cCenter = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.85 })
      );
      cloudGroup.add(cCenter);
      const cLeft = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.85 })
      );
      cLeft.position.set(-0.4, -0.1, 0);
      cloudGroup.add(cLeft);
      const cRight = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.85 })
      );
      cRight.position.set(0.4, -0.05, 0);
      cloudGroup.add(cRight);

      rootGroup.add(cloudGroup);
      animatedObjects.cloudGroup = cloudGroup;
    }

    // -------------------------------------------------------------
    // SCENE 10: BLUETOOTH ECOSYSTEM (6 DEVICES)
    // -------------------------------------------------------------
    else if (variant === "bluetooth_ecosystem_3d") {
      const { pGroup } = createPhone([0, 0, 0], 0, 0.85);
      rootGroup.add(pGroup);

      // 1. Keyboard (Bottom)
      const kb = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.12, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
      );
      kb.position.set(0, -2.4, 0.3);
      rootGroup.add(kb);

      // 2. Smartwatch (Top Left)
      const watch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.15, 20),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 })
      );
      watch.position.set(-1.2, 1.8, -0.3);
      watch.rotation.x = Math.PI / 2;
      rootGroup.add(watch);

      // 3. Controller (Bottom Left)
      const ctrl = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.45, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x10b981 })
      );
      ctrl.position.set(-1.2, -1.2, 0.2);
      rootGroup.add(ctrl);

      // 4. Speaker (Top Right)
      const spk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.8, 20),
        new THREE.MeshStandardMaterial({ color: 0x00f0ff })
      );
      spk.position.set(1.2, 1.8, 0.2);
      rootGroup.add(spk);

      // 5. Temp Sensor (Bottom Right)
      const sensor = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xef4444 })
      );
      sensor.position.set(1.2, -1.2, 0.1);
      rootGroup.add(sensor);

      // 6. Earbuds (Upper Mid)
      const { eGroup } = createEarbud([0.7, 0.7, 0.2], -0.3, 0.75);
      rootGroup.add(eGroup);
    }

    // -------------------------------------------------------------
    // SCENE 11: COMPLETE SYSTEM FLOW (8-STAGE 3D PIPELINE)
    // -------------------------------------------------------------
    else if (variant === "bluetooth_pipeline_3d") {
      const stagesGroup = new THREE.Group();
      stagesGroup.position.set(0, 0, 0);

      const stages = [
        "DISCOVER", "SELECT", "PAIR", "CONNECT",
        "TRANSMIT", "RECEIVE", "PROCESS", "PLAY"
      ];

      const stageBoxes: THREE.Mesh[] = [];
      stages.forEach((name, idx) => {
        const y = 2.4 - idx * 0.7;
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 0.42, 0.16),
          new THREE.MeshStandardMaterial({
            color: idx === 0 ? 0xffc857 : 0x1e293b,
            metalness: 0.8,
            roughness: 0.25,
          })
        );
        box.position.set(0, y, 0);
        stagesGroup.add(box);
        stageBoxes.push(box);
      });
      rootGroup.add(stagesGroup);
      animatedObjects.stageBoxes = stageBoxes;

      // Flow pulse line
      const flowLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 2.6, 0.1), new THREE.Vector3(0, -2.6, 0.1)]),
        new THREE.LineBasicMaterial({ color: new THREE.Color(accent), transparent: true, opacity: 0.8 })
      );
      rootGroup.add(flowLine);
    }

    // -------------------------------------------------------------
    // SCENE 12: FINAL REVEAL
    // -------------------------------------------------------------
    else if (variant === "bluetooth_reveal_3d" || variant === "bluetooth_master_recap_3d") {
      const phonePos: [number, number, number] = landscape ? [-3.8, 0, 0] : [0, 2.2, 0];
      const earbudPos: [number, number, number] = landscape ? [3.8, 0.2, 0] : [0, -2.1, 0];

      // Top: 3D Smartphone
      const { pGroup } = createPhone(phonePos, 0, landscape ? 0.85 : 0.75);
      rootGroup.add(pGroup);

      // Bottom: 3D Wireless Earbud with Speaker Driver
      const { eGroup, led } = createEarbud(earbudPos, 0, landscape ? 0.9 : 0.8);
      rootGroup.add(eGroup);
      animatedObjects.earbudLed = led;

      // Bottom Acoustic Sound Wave Arcs from Earbud
      const soundArcs: THREE.Mesh[] = [];
      for (let k = 0; k < 4; k++) {
        const arc = new THREE.Mesh(
          new THREE.RingGeometry(0.3, 0.38, 24, 1, 0, Math.PI),
          new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
        );
        arc.position.set(earbudPos[0], earbudPos[1] - 0.7, 0.1);
        arc.rotation.z = -Math.PI / 2;
        rootGroup.add(arc);
        soundArcs.push(arc);
      }
      animatedObjects.recapSoundArcs = soundArcs;

      // Middle: Cyan Radio Pulses Streaming from Phone to Earbud
      const pulses: THREE.Mesh[] = [];
      for (let i = 0; i < 5; i++) {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.35, 0.45, 24),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(accent), side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
        );
        rootGroup.add(ring);
        pulses.push(ring);
      }
      animatedObjects.pulses = pulses;

      // Middle: Data Packet Cubes flowing along radio path
      const recapPackets: THREE.Mesh[] = [];
      for (let j = 0; j < 5; j++) {
        const p = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, 0.18, 0.18),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        rootGroup.add(p);
        recapPackets.push(p);
      }
      animatedObjects.recapPackets = recapPackets;
    }

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      rootGroup,
      animatedObjects,
    };

    return () => {
      renderer.dispose();
      threeScene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      stateRef.current = null;
    };
  }, [width, height, accent, variant, landscape]);

  // Frame animation loop
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    const t = frame * 0.02;
    const anim = s.animatedObjects;

    // Gentle camera motion
    s.camera.position.x = Math.sin(t * 0.25) * 0.2;
    s.camera.position.y = (landscape ? 1.5 : 0.2) + Math.cos(t * 0.2) * 0.15;

    // Scene 1: Bars & Waves
    if (variant === "bluetooth_link_3d" || variant === "bluetooth_3d") {
      if (anim.phoneBars) {
        anim.phoneBars.forEach((bar: THREE.Mesh, i: number) => {
          const h = 0.2 + 0.6 * Math.abs(Math.sin(frame * 0.15 + i * 0.5));
          bar.scale.set(1, h, 1);
        });
      }
      if (anim.radioWaves) {
        const startX = landscape ? -3.4 : -0.7;
        const endX = landscape ? 3.4 : 0.7;
        const startY = landscape ? 0 : -1.2;
        const endY = landscape ? 0 : 1.3;
        anim.radioWaves.forEach((wave: THREE.Mesh, idx: number) => {
          const progress = ((frame + idx * 16) % 80) / 80;
          wave.position.x = startX + progress * (endX - startX);
          wave.position.y = startY + progress * (endY - startY);
          const sc = 0.5 + progress * 1.6;
          wave.scale.set(sc, sc, sc);
          (wave.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - progress) * 0.75);
        });
      }
      if (anim.dissolvingCable) {
        // Dramatic dissolve during frames 0 to 45 (first 1.5 seconds)
        const cableOpacity = Math.max(0, 1.0 - frame / 45);
        (anim.dissolvingCable.material as THREE.LineBasicMaterial).opacity = cableOpacity;
      }
      if (anim.questionMeshes) {
        // Question mark fades in after cable dissolves and bobs gently
        const qOpacity = Math.min(0.95, Math.max(0, (frame - 35) / 20));
        anim.questionMeshes.forEach((m: THREE.Mesh) => {
          (m.material as THREE.MeshBasicMaterial).opacity = qOpacity;
        });
        if (anim.questionMarkGroup) {
          anim.questionMarkGroup.position.y = -0.05 + Math.sin(frame * 0.1) * 0.08;
          anim.questionMarkGroup.rotation.y = Math.sin(frame * 0.05) * 0.3;
        }
      }
    }

    // Scene 2: 2.4 GHz RF Wavefronts
    else if (variant === "bluetooth_radio_3d") {
      if (anim.waveFronts) {
        anim.waveFronts.forEach((wf: THREE.Mesh, idx: number) => {
          const pr = ((frame + idx * 18) % 75) / 75;
          wf.position.y = (landscape ? 0 : -1.0) + pr * (landscape ? 3.5 : 2.8);
          wf.scale.set(1 + pr * 2, 1 + pr * 2, 1);
          (wf.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - pr) * 0.7);
        });
      }
      if (anim.radioPackets) {
        anim.radioPackets.forEach((p: THREE.Mesh, idx: number) => {
          const pr = ((frame + idx * 15) % 70) / 70;
          p.position.y = (landscape ? 0 : -1.2) + pr * (landscape ? 3.8 : 3.0);
          p.position.x = Math.sin(pr * Math.PI * 4) * 0.2;
          p.rotation.x = frame * 0.05;
        });
      }
    }

    // Scene 3: Radar scanning & Advertising
    else if (variant === "bluetooth_discovery_3d") {
      if (anim.scanRings) {
        anim.scanRings.forEach((ring: THREE.Mesh, idx: number) => {
          const progress = ((frame + idx * 25) % 100) / 100;
          const rScale = 0.5 + progress * 4.8;
          ring.scale.set(rScale, rScale, 1);
          (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - progress) * 0.65);
        });
      }
      if (anim.adRing) {
        const adProgress = ((frame * 1.5) % 40) / 40;
        anim.adRing.scale.set(1 + adProgress * 1.4, 1 + adProgress * 1.4, 1);
        (anim.adRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - adProgress) * 0.85);
      }
    }

    // Scene 4: Lock Pulse
    else if (variant === "bluetooth_pairing_3d") {
      if (anim.lockGroup) {
        const pulse = 1.0 + 0.06 * Math.sin(frame * 0.15);
        anim.lockGroup.scale.set(pulse, pulse, pulse);
      }
    }

    // Scene 4: Music Waveform to Bits & Packets
    else if (
      variant === "bluetooth_digital_data_3d" ||
      variant === "bluetooth_layers_3d" ||
      variant === "music_to_packets_3d"
    ) {
      if (anim.musicWaveform) {
        const pts = anim.musicWaveform.geometry.attributes.position.array;
        const waveCount = 50;
        for (let w = 0; w <= waveCount; w++) {
          pts[w * 3 + 1] = 1.0 + Math.sin((w / waveCount) * Math.PI * 4 + frame * 0.2) * 0.28;
        }
        anim.musicWaveform.geometry.attributes.position.needsUpdate = true;
      }
      if (anim.bitCubes) {
        anim.bitCubes.forEach((cube: THREE.Mesh, b: number) => {
          const pr = ((frame * 1.5 + b * 20) % 100) / 100;
          cube.position.y = 0.8 - pr * 2.8;
          cube.rotation.x = frame * 0.05 + b;
          cube.rotation.y = frame * 0.07 + b;
        });
      }
      if (anim.packetContainers) {
        anim.packetContainers.forEach((pkt: THREE.Group, idx: number) => {
          const pulse = 1.0 + 0.04 * Math.sin(frame * 0.1 + idx);
          pkt.scale.set(pulse, pulse, 1);
        });
      }
    }

    // Scene 6: Frequency Hopping
    else if (variant === "bluetooth_spectrum_3d" || variant === "frequency_hopping_3d") {
      if (anim.hopBeams && anim.channelBars) {
        const spanWidth = landscape ? 12 : 6.8;
        anim.hopBeams.forEach((beam: THREE.Mesh, j: number) => {
          const hopIndex = Math.floor(((frame * 2.5 + j * 27) % 79));
          const x = -spanWidth / 2 + (hopIndex / 79) * spanWidth;
          beam.position.x = x;
          beam.position.y = 1.1;

          anim.channelBars.forEach((bar: THREE.Mesh, i: number) => {
            if (i === hopIndex) {
              bar.scale.set(1.4, 1.7, 1.4);
              (bar.material as THREE.MeshStandardMaterial).color.setHex(0x00f0ff);
            } else {
              bar.scale.set(1, 1, 1);
              (bar.material as THREE.MeshStandardMaterial).color.setHex(0x1e293b);
            }
          });
        });
      }
    }

    // Scene 7: Packets & Diaphragm vibration
    else if (variant === "bluetooth_audio_path_3d" || variant === "packet_to_sound_3d") {
      if (anim.pathPackets) {
        anim.pathPackets.forEach((p: THREE.Mesh, idx: number) => {
          const pr = ((frame + idx * 16) % 75) / 75;
          p.position.y = 1.8 - pr * 3.4;
          p.position.x = Math.sin(pr * Math.PI * 3) * 0.15;
        });
      }
      if (anim.speakerDome) {
        const vib = 0.05 * Math.sin(frame * 0.8);
        anim.speakerDome.position.y = vib;
      }
      if (anim.soundArcs) {
        anim.soundArcs.forEach((arc: THREE.Mesh, idx: number) => {
          const pr = ((frame + idx * 15) % 60) / 60;
          arc.position.y = -0.5 - pr * 1.4;
          const sc = 0.5 + pr * 1.6;
          arc.scale.set(sc, sc, sc);
          (arc.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - pr) * 0.8);
        });
      }
    }

    // Scene 8: Failure & Obstacle
    else if (variant === "bluetooth_interference_3d") {
      if (anim.failEarbud) {
        const distOffset = Math.sin(frame * 0.05) * 0.6;
        anim.failEarbud.position.y = 1.6 + distOffset;
      }
      if (anim.noisePoints) {
        anim.noisePoints.rotation.y = frame * 0.04;
      }
    }

    // Scene 9: Cloud Disconnect
    else if (variant === "bluetooth_local_p2p_3d") {
      if (anim.cloudGroup) {
        const fade = Math.max(0.15, 1 - frame * 0.015);
        anim.cloudGroup.traverse((obj: any) => {
          if (obj.material) obj.material.opacity = fade;
        });
      }
    }

    // Scene 11: 8-Stage Cascade
    else if (variant === "bluetooth_pipeline_3d") {
      if (anim.stageBoxes) {
        const activeIdx = Math.floor((frame / 30) % 8);
        anim.stageBoxes.forEach((box: THREE.Mesh, idx: number) => {
          if (idx <= activeIdx) {
            (box.material as THREE.MeshStandardMaterial).color.setHex(idx === activeIdx ? 0xffc857 : 0x00f0ff);
          } else {
            (box.material as THREE.MeshStandardMaterial).color.setHex(0x1e293b);
          }
        });
      }
    }

    // Scene 7: Master Recap Chain Animation
    else if (variant === "bluetooth_reveal_3d" || variant === "bluetooth_master_recap_3d") {
      if (anim.pulses) {
        anim.pulses.forEach((pulse: THREE.Mesh, idx: number) => {
          const pr = ((frame + idx * 16) % 70) / 70;
          pulse.position.y = (landscape ? -1.2 : 1.5) - pr * (landscape ? -2.5 : 3.2);
          const sc = 0.6 + pr * 1.5;
          pulse.scale.set(sc, sc, sc);
          (pulse.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - pr) * 0.75);
        });
      }
      if (anim.recapPackets) {
        anim.recapPackets.forEach((p: THREE.Mesh, idx: number) => {
          const pr = ((frame + idx * 15) % 65) / 65;
          p.position.y = (landscape ? 0 : 1.6) - pr * (landscape ? 0 : 3.3);
          p.position.x = Math.sin(pr * Math.PI * 4) * 0.15;
          p.rotation.x = frame * 0.05;
        });
      }
      if (anim.recapSoundArcs) {
        anim.recapSoundArcs.forEach((arc: THREE.Mesh, idx: number) => {
          const pr = ((frame + idx * 15) % 55) / 55;
          arc.position.y = -2.7 - pr * 0.8;
          const sc = 0.5 + pr * 1.5;
          arc.scale.set(sc, sc, sc);
          (arc.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - pr) * 0.8);
        });
      }
    }

    s.renderer.render(s.scene, s.camera);
  }, [frame, variant, landscape]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#060A14" }}>
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Cinematic Technical HUD Header */}
      <div
        style={{
          position: "absolute",
          top: landscape ? 45 : 85,
          left: landscape ? 80 : 50,
          right: landscape ? 80 : 50,
          pointerEvents: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            background: "rgba(6, 10, 20, 0.88)",
            backdropFilter: "blur(20px)",
            borderRadius: 16,
            padding: landscape ? "16px 24px" : "14px 20px",
            border: `1px solid ${accent}45`,
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: landscape ? 18 : 20,
              fontWeight: 800,
              color: accent,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {scene.tag ?? "BLUETOOTH 2.4 GHz RADIO LINK"}
          </div>
          <div
            style={{
              fontSize: landscape ? 36 : 38,
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: -0.5,
            }}
          >
            {scene.title ?? "RADIO WAVES • NOT SOUND"}
          </div>
        </div>

        {/* Dynamic Telemetry Status Badge */}
        <div
          style={{
            background: "rgba(6, 10, 20, 0.88)",
            backdropFilter: "blur(16px)",
            borderRadius: 14,
            padding: landscape ? "12px 20px" : "10px 16px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 10px #10B981",
            }}
          />
          <div
            style={{
              fontFamily: "monospace",
              fontSize: landscape ? 16 : 16,
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            {variant === "bluetooth_spectrum_3d"
              ? "79 CHANNELS | 1,600 HOPS/S"
              : variant === "bluetooth_discovery_3d"
              ? "BLE ADVERTISING ACTIVE"
              : variant === "bluetooth_audio_path_3d"
              ? "DAC: 16-BIT 44.1 kHz PCM"
              : variant === "bluetooth_digital_data_3d" || variant === "bluetooth_layers_3d"
              ? "AUDIO SAMPLES → DATA PACKETS"
              : variant === "bluetooth_reveal_3d" || variant === "bluetooth_master_recap_3d"
              ? "END-TO-END WIRELESS CHAIN"
              : variant === "bluetooth_radio_3d"
              ? "2.4 GHz RF CARRIER"
              : variant === "bluetooth_interference_3d"
              ? "LINK QUALITY TEST"
              : variant === "bluetooth_pairing_3d"
              ? "PAIRED & CONNECTED"
              : variant === "bluetooth_local_p2p_3d"
              ? "100% OFFLINE RADIO"
              : "LINK: 2.4 GHz ACTIVE"}
          </div>
        </div>
      </div>

      {/* Floating Bottom Telemetry Cards */}
      <div
        style={{
          position: "absolute",
          bottom: landscape ? 80 : 120,
          left: landscape ? 80 : 50,
          right: landscape ? 80 : 50,
          pointerEvents: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            background: "rgba(6, 10, 20, 0.85)",
            backdropFilter: "blur(16px)",
            borderRadius: 12,
            padding: landscape ? "10px 18px" : "8px 14px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            display: "flex",
            gap: landscape ? 20 : 14,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
              SPECTRUM
            </div>
            <div style={{ fontSize: landscape ? 16 : 14, fontWeight: 800, color: accent, fontFamily: "monospace" }}>
              2400-2483.5 MHz
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
              BANDWIDTH
            </div>
            <div style={{ fontSize: landscape ? 16 : 14, fontWeight: 800, color: "#FFFFFF", fontFamily: "monospace" }}>
              79 x 1 MHz
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
              MODE
            </div>
            <div style={{ fontSize: landscape ? 16 : 14, fontWeight: 800, color: "#10B981", fontFamily: "monospace" }}>
              PEER-TO-PEER RF
            </div>
          </div>
        </div>

        <div
          style={{
            background: "rgba(6, 10, 20, 0.85)",
            backdropFilter: "blur(16px)",
            borderRadius: 12,
            padding: landscape ? "10px 18px" : "8px 14px",
            border: "1px solid rgba(255, 200, 87, 0.35)",
            fontFamily: "monospace",
            fontSize: landscape ? 15 : 14,
            fontWeight: 800,
            color: "#FFC857",
          }}
        >
          {(scene as any).badge ?? (
            variant === "bluetooth_link_3d"
              ? "NO WIRES • PURE AIR"
              : variant === "bluetooth_radio_3d"
              ? "2.4 GHz ELECTROMAGNETIC WAVES"
              : variant === "bluetooth_discovery_3d"
              ? "DISCOVER → PAIR → CONNECT"
              : variant === "bluetooth_digital_data_3d" || variant === "bluetooth_layers_3d"
              ? "MUSIC → DIGITAL BITS → PACKETS"
              : variant === "bluetooth_spectrum_3d" || variant === "frequency_hopping_3d"
              ? "ADAPTIVE FREQUENCY HOPPING"
              : variant === "bluetooth_audio_path_3d"
              ? "RECEIVE → DECODE → PHYSICAL SOUND"
              : variant === "bluetooth_reveal_3d" || variant === "bluetooth_master_recap_3d"
              ? "PHONE → RADIO → HEADPHONES → MUSIC"
              : "NO WI-FI • NO CELLULAR NEEDED"
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
