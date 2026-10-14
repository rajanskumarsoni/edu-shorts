import React, { useRef, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import * as THREE from "three";
import type { SceneSpec } from "../types";
import { resolveSceneTag } from "../theme";

export const ThreeDQRCodeInspection: React.FC<{
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
    qrGroup: THREE.Group;
    laserPlane: THREE.Mesh;
    blocks: THREE.Mesh[];
    cardsGroup: THREE.Group;
    cardTextures: THREE.CanvasTexture[];
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

    // 3D Isometric 3/4 perspective camera
    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
    camera.position.set(2.8, 4.2, 8.5);
    camera.lookAt(-0.2, 0.3, 0);

    const qrGroup = new THREE.Group();
    threeScene.add(qrGroup);

    // Standee Pedestal Slab
    const slabGeo = new THREE.BoxGeometry(4.8, 0.35, 4.8);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.9,
      roughness: 0.2,
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = -0.2;
    qrGroup.add(slab);

    const slabEdgeGeo = new THREE.EdgesGeometry(slabGeo);
    const slabEdgeMat = new THREE.LineBasicMaterial({ color: 0x00f0ff });
    slab.add(new THREE.LineSegments(slabEdgeGeo, slabEdgeMat));

    // Create Extruded 3D QR Matrix Modules
    const blocks: THREE.Mesh[] = [];
    const gridSize = 9;
    const boxGeo = new THREE.BoxGeometry(0.38, 0.6, 0.38);

    const brightModMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x005577,
      emissiveIntensity: 0.9,
    });
    const emeraldModMat = new THREE.MeshStandardMaterial({
      color: 0x58d6c2,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x116655,
      emissiveIntensity: 0.8,
    });
    const darkBoxMat = new THREE.MeshStandardMaterial({
      color: 0x0b1222,
      metalness: 0.9,
      roughness: 0.3,
    });

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const isCorner =
          (r < 3 && c < 3) ||
          (r < 3 && c >= gridSize - 3) ||
          (r >= gridSize - 3 && c < 3);
        const isCenter = r >= 3 && r <= 5 && c >= 3 && c <= 5;
        const isMod = isCorner || isCenter || ((r * 7 + c * 11) % 3 === 0);

        const meshMat = isCorner ? emeraldModMat : isMod ? brightModMat : darkBoxMat;
        const mesh = new THREE.Mesh(boxGeo, meshMat);

        const elev = isCorner ? 0.45 : isMod ? 0.3 : 0.05;
        mesh.scale.y = elev * 2.0;
        mesh.position.set(
          (c - gridSize / 2 + 0.5) * 0.46,
          elev * 0.6,
          (r - gridSize / 2 + 0.5) * 0.46
        );
        qrGroup.add(mesh);
        blocks.push(mesh);
      }
    }

    // Laser Scanning Plane
    const laserGeo = new THREE.PlaneGeometry(4.6, 0.12);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0xff3366,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const laserPlane = new THREE.Mesh(laserGeo, laserMat);
    laserPlane.rotation.x = Math.PI / 2;
    laserPlane.position.y = 0.55;
    qrGroup.add(laserPlane);

    // 3 Floating 3D Holographic Decoded Cards
    const cardsGroup = new THREE.Group();
    threeScene.add(cardsGroup);

    const cardTextures: THREE.CanvasTexture[] = [];
    const cardData = [
      { tag: "VPA ADDRESS", val: "coffeehouse@okhdfcbank", color: "#00F0FF" },
      { tag: "MERCHANT NAME", val: "Blue Bean Coffee Ltd.", color: "#58D6C2" },
      { tag: "TRANSACTION REF", val: "UPI-TXN-98231-LIVE", color: "#FFC857" },
    ];

    cardData.forEach((cd, idx) => {
      const cCanvas = document.createElement("canvas");
      cCanvas.width = 440;
      cCanvas.height = 130;
      const cCtx = cCanvas.getContext("2d")!;

      cCtx.fillStyle = "rgba(14, 20, 36, 0.92)";
      cCtx.strokeStyle = cd.color;
      cCtx.lineWidth = 4;
      cCtx.beginPath();
      cCtx.roundRect(8, 8, 424, 114, 18);
      cCtx.fill();
      cCtx.stroke();

      cCtx.fillStyle = cd.color;
      cCtx.font = "bold 26px monospace";
      cCtx.fillText(cd.tag, 24, 46);

      cCtx.fillStyle = "#ffffff";
      cCtx.font = "bold 30px sans-serif";
      cCtx.fillText(cd.val, 24, 94);

      const cTex = new THREE.CanvasTexture(cCanvas);
      cardTextures.push(cTex);

      const cMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.1, 0.65),
        new THREE.MeshBasicMaterial({ map: cTex, transparent: true, side: THREE.DoubleSide })
      );
      cMesh.position.set(0.4, 2.1 - idx * 0.8, 1.8);
      cardsGroup.add(cMesh);
    });

    // Lights
    threeScene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(6, 10, 8);
    threeScene.add(dirLight);

    const pointCyan = new THREE.PointLight(0x00f0ff, 3.0, 15);
    pointCyan.position.set(0, 3, 0);
    threeScene.add(pointCyan);

    stateRef.current = {
      renderer,
      scene: threeScene,
      camera,
      qrGroup,
      laserPlane,
      blocks,
      cardsGroup,
      cardTextures,
    };

    return () => {
      renderer.dispose();
      slabGeo.dispose();
      slabMat.dispose();
      boxGeo.dispose();
      brightModMat.dispose();
      emeraldModMat.dispose();
      darkBoxMat.dispose();
      laserGeo.dispose();
      laserMat.dispose();
    };
  }, [width, height, accent]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;

    // Orbiting 3D camera showcasing relief of QR blocks
    const orbit = Math.sin(frame * 0.02) * 0.4;
    s.camera.position.x = 2.8 + orbit;
    s.camera.position.y = 4.2 + Math.cos(frame * 0.02) * 0.3;
    s.camera.lookAt(-0.1, 0.4, 0);

    // QR slab gentle rotation
    s.qrGroup.rotation.y = frame * 0.008;

    // Scanning laser sweeps back and forth across Z axis
    s.laserPlane.position.z = Math.sin(frame * 0.06) * 1.8;

    // Hover cards face camera with subtle float
    s.cardsGroup.children.forEach((card, idx) => {
      card.position.y = 1.6 - idx * 0.8 + Math.sin(frame * 0.04 + idx) * 0.05;
      card.lookAt(s.camera.position);
    });

    s.renderer.render(s.scene, s.camera);
  }, [frame]);

  const hudOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0B1020" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />

      {/* Cinematic HUD: Stacked at top and bottom - Center is 100% open! */}
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
              {resolveSceneTag(scene, "04 / ADDRESS RESOLUTION")}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "#FF3366",
                letterSpacing: 2,
              }}
            >
              OPTICAL POINTER • NO CASH INSIDE
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
              {scene.title || "QR Code Payload Decoded"}
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
              SMART DIGITAL ROUTING ADDRESS
            </div>
          </div>
        </div>

        {/* Lower Telemetry Pill */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            background: "rgba(14, 20, 36, 0.88)",
            backdropFilter: "blur(20px)",
            padding: "18px 28px",
            borderRadius: 18,
            border: "1px solid rgba(0, 240, 255, 0.25)",
            marginBottom: 90,
          }}
        >
          <div>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: "#94a3b8" }}>STANDARD</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FFFFFF" }}>NPCI / BHIM Spec 2.0</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "monospace", fontSize: 26, color: "#58D6C2" }}>FUNCTION</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: accent }}>VPA Pointer Only</div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
