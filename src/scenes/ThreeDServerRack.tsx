import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDServerRack: React.FC<{
  scene: SceneSpec;
  accent: string;
}> = ({ scene, accent }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    leds: THREE.Mesh[];
    switchRing: THREE.Mesh;
    racksGroup: THREE.Group;
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
    threeScene.fog = new THREE.FogExp2(0x0b1020, 0.04);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 7.8);
    camera.lookAt(0, 1.6, -1.0);

    const racksGroup = new THREE.Group();
    threeScene.add(racksGroup);

    // 1. Datacenter Floor with Reflective Neon Grid
    const floorGeo = new THREE.BoxGeometry(16, 0.4, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f1526,
      metalness: 0.9,
      roughness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.2, 0);
    threeScene.add(floor);

    const grid = new THREE.GridHelper(20, 24, new THREE.Color(accent), 0x1b2842);
    grid.position.set(0, 0.01, 0);
    threeScene.add(grid);

    // 2. Server Racks Flanking Left and Right (Aisle in Center)
    const leds: THREE.Mesh[] = [];
    const ledGeo = new THREE.SphereGeometry(0.035, 8, 8);
    const rackCabinetMat = new THREE.MeshStandardMaterial({
      color: 0x1a233a,
      metalness: 0.85,
      roughness: 0.25,
    });
    const bladeFaceMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2,
    });

    const rackOffsets = [
      { x: -2.2, z: 2.0 },
      { x: -2.2, z: -1.8 },
      { x: -2.2, z: -5.6 },
      { x: 2.2, z: 2.0 },
      { x: 2.2, z: -1.8 },
      { x: 2.2, z: -5.6 },
    ];

    rackOffsets.forEach((pos, rIdx) => {
      const rack = new THREE.Group();
      rack.position.set(pos.x, 2.0, pos.z);

      // Outer steel frame
      const frameBox = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.8, 1.6), rackCabinetMat);
      rack.add(frameBox);

      const frameEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(1.4, 3.8, 1.6)),
        new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 })
      );
      rack.add(frameEdges);

      // 7 Server Blade Units inside
      for (let b = -1.5; b <= 1.5; b += 0.5) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.42, 1.5), bladeFaceMat);
        blade.position.set(0, b, 0);
        rack.add(blade);

        // Blade front LED cluster facing the aisle
        const aisleSide = pos.x < 0 ? 0.68 : -0.68;
        for (let lz = -0.5; lz <= 0.5; lz += 0.25) {
          const ledMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
          const led = new THREE.Mesh(ledGeo, ledMat);
          led.position.set(aisleSide, b, lz);
          rack.add(led);
          leds.push(led);
        }
      }

      racksGroup.add(rack);
    });

    // 3. Overhead Fiber-Optic Cable Ladder Trays
    const cableTrayMat = new THREE.LineBasicMaterial({ color: 0x58d6c2, transparent: true, opacity: 0.6 });
    for (let tz = -8; tz <= 6; tz += 2.5) {
      const crossBeam = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-2.2, 4.0, tz),
          new THREE.Vector3(2.2, 4.0, tz),
        ]),
        cableTrayMat
      );
      threeScene.add(crossBeam);
    }

    // Glowing Fiber Cables overhead
    [-0.8, 0, 0.8].forEach((cx, idx) => {
      const cable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 24, 8),
        new THREE.MeshBasicMaterial({
          color: idx === 1 ? 0x00f0ff : 0xffc857,
        })
      );
      cable.rotation.x = Math.PI / 2;
      cable.position.set(cx, 4.05, 0);
      threeScene.add(cable);
    });

    // 4. Central NPCI Core Switch Mainframe at the End of Aisle
    const switchCoreGroup = new THREE.Group();
    switchCoreGroup.position.set(0, 1.8, -7.5);
    threeScene.add(switchCoreGroup);

    // Cylindrical Core Reactor Mainframe
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0x003344,
      emissiveIntensity: 0.6,
    });
    const coreCylinder = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3.2, 32), coreMat);
    switchCoreGroup.add(coreCylinder);

    // Glowing Holographic Telemetry Rings
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const switchRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.05, 16, 48), ringMat);
    switchRing.rotation.x = Math.PI / 2;
    switchCoreGroup.add(switchRing);

    // Top Pulsing Core Node
    const coreLight = new THREE.PointLight(0x00f0ff, 4.0, 20);
    coreLight.position.set(0, 1.8, -7.0);
    threeScene.add(coreLight);

    // Ambient and Directional Lights
    threeScene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(0, 8, 4);
    threeScene.add(dirLight);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      leds,
      switchRing,
      racksGroup,
    };

    return () => {
      renderer.dispose();
      floorGeo.dispose();
      floorMat.dispose();
      rackCabinetMat.dispose();
      bladeFaceMat.dispose();
      ledGeo.dispose();
      coreMat.dispose();
      ringMat.dispose();
    };
  }, [width, height, accent]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Cinematic low-angle tracking dolly moving forward down the aisle
    const dollyZ = interpolate(frame, [0, 150], [7.8, 4.5], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    s.camera.position.z = dollyZ;
    s.camera.position.x = Math.sin(frame * 0.02) * 0.15;
    s.camera.position.y = 1.3 + Math.sin(frame * 0.03) * 0.05;
    s.camera.lookAt(0, 1.8, -7.5);

    // Central switch ring rotating
    s.switchRing.rotation.z = frame * 0.025;
    s.switchRing.rotation.y = Math.sin(frame * 0.03) * 0.2;

    // High density cascading LEDs blink in clusters
    s.leds.forEach((led, idx) => {
      const blink = (idx * 13 + frame) % 18 < 9;
      const isOk = idx % 4 !== 0;
      const col = blink
        ? (isOk ? new THREE.Color(accent) : new THREE.Color(0x27C93F))
        : new THREE.Color(0x0a101d);
      (led.material as THREE.MeshBasicMaterial).color = col;
    });

    s.renderer.render(s.scene, s.camera);
  }, [frame, accent]);

  const hudOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1020" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />

      {/* Cinematic HUD: Stacked at top and bottom - Center is 100% open for datacenter aisle! */}
      <AbsoluteFill
        style={{
          opacity: hudOpacity,
          padding: "50px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          pointerEvents: "none",
        }}
      >
        {/* Top Header & Scene Tag */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 28,
                letterSpacing: 2,
                fontWeight: 800,
                color: accent,
                background: "rgba(0, 240, 255, 0.12)",
                padding: "8px 22px",
                borderRadius: 8,
                border: `1.5px solid ${accent}50`,
              }}
            >
              {resolveSceneTag(scene, "07 / CENTRAL ROUTING CORE")}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "#27C93F",
                letterSpacing: 2,
              }}
            >
              SWITCH STATUS: OPTIMAL
            </div>
          </div>

          <div>
            <h1
              style={{
                fontSize: 52,
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: -1,
                margin: 0,
                textShadow: `0 0 30px ${accent}60`,
                lineHeight: 1.15,
              }}
            >
              {scene.title || "NPCI Switching Core"}
            </h1>
            <div
              style={{
                display: "inline-block",
                fontFamily: "monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "#58D6C2",
                background: "rgba(11, 16, 32, 0.8)",
                padding: "6px 20px",
                borderRadius: 999,
                border: "1px solid rgba(88, 214, 194, 0.4)",
                marginTop: 8,
              }}
            >
              SUB-10MS TRAFFIC CONTROLLER
            </div>
          </div>
        </div>

        {/* Lower Telemetry Pill */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
            background: "rgba(14, 20, 36, 0.88)",
            backdropFilter: "blur(20px)",
            padding: "18px 22px",
            borderRadius: 18,
            border: "1px solid rgba(0, 240, 255, 0.25)",
            marginBottom: 90,
          }}
        >
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: "#94a3b8" }}>Throughput</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>100K TPS</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: accent }}>Latency</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>Sub-10ms</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: "#58D6C2" }}>Availability</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>99.999%</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
