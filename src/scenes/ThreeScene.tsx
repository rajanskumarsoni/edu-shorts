import React from "react";
import type { SceneSpec } from "../types";
import { ThreeDGradient } from "./ThreeDGradient";
import { ThreeDNeuralNetwork } from "./ThreeDNeuralNetwork";
import { ThreeDGlobeNetwork } from "./ThreeDGlobeNetwork";
import { ThreeDServerRack } from "./ThreeDServerRack";
import { ThreeDDigitalTunnel } from "./ThreeDDigitalTunnel";
import { ThreeDCityNetwork } from "./ThreeDCityNetwork";
import { ThreeDQRCodeInspection } from "./ThreeDQRCodeInspection";
import { ThreeDPhoneLayers } from "./ThreeDPhoneLayers";
import { ThreeDBankVault } from "./ThreeDBankVault";
import { ThreeDUPIHook } from "./ThreeDUPIHook";
import { ThreeDConcentricSecurity } from "./ThreeDConcentricSecurity";
import { ThreeDSettlement } from "./ThreeDSettlement";
import { ThreeDTelemetryGauge } from "./ThreeDTelemetryGauge";
import { ThreeDArchitecturePipeline } from "./ThreeDArchitecturePipeline";
import { ThreeDCalloutAlert } from "./ThreeDCalloutAlert";
import { ThreeDOutroPayoff } from "./ThreeDOutroPayoff";

interface ThreeSceneProps {
  scene: SceneSpec;
  accent: string;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({ scene, accent }) => {
  // Variant router for 3D WebGL scenes
  const variant = scene.variant || "gradient_descent";

  switch (variant) {
    case "upi_hook_3d":
    case "hook_3d":
    case "qr_scan_3d":
    case "smartphone_qr_3d":
      return <ThreeDUPIHook scene={scene} accent={accent} />;

    case "concentric_security_3d":
    case "zero_knowledge_pin_3d":
    case "pin_security_3d":
    case "concentric_3d":
    case "security_rings_3d":
      return <ThreeDConcentricSecurity scene={scene} accent={accent} />;
    case "upi_tunnel_3d":
    case "digital_tunnel_3d":
    case "cyber_tunnel":
    case "highway_3d":
    case "highway":
    case "traffic_3d":
    case "tunnel_3d":
      return <ThreeDDigitalTunnel scene={scene} accent={accent} />;

    case "upi_city_3d":
    case "city_network_3d":
    case "participants_3d":
    case "city_3d":
      return <ThreeDCityNetwork scene={scene} accent={accent} />;

    case "upi_qr_3d":
    case "qr_inspection_3d":
    case "qr_matrix_3d":
    case "qr_3d":
    case "qrcode_3d":
      return <ThreeDQRCodeInspection scene={scene} accent={accent} />;

    case "upi_phone_layers_3d":
    case "phone_layers_3d":
    case "sandbox_3d":
    case "phone_3d":
    case "smartphone_3d":
    case "mobile_3d":
      return <ThreeDPhoneLayers scene={scene} accent={accent} />;

    case "upi_bank_vault_3d":
    case "bank_vault_3d":
    case "upi_bank_vault_credit_3d":
    case "cbs_ledger_3d":
    case "bank_3d":
    case "vault_3d":
      return <ThreeDBankVault scene={scene} accent={accent} />;

    case "neural_network_3d":
    case "neural_network":
    case "backprop_3d":
    case "brain_3d":
    case "ai_3d":
      return <ThreeDNeuralNetwork scene={scene} accent={accent} />;

    case "globe_network_3d":
    case "globe_network":
    case "distributed_mesh":
    case "network_3d":
    case "internet_3d":
    case "cloud_3d":
      return <ThreeDGlobeNetwork scene={scene} accent={accent} />;

    case "server_rack_3d":
    case "server_rack":
    case "datacenter_3d":
    case "npci_datacenter":
    case "server_3d":
    case "servers_3d":
      return <ThreeDServerRack scene={scene} accent={accent} />;

    case "upi_settlement_3d":
    case "settlement_3d":
    case "dual_ledger_3d":
    case "bilateral_settlement_3d":
      return <ThreeDSettlement scene={scene} accent={accent} />;

    case "upi_gauge_3d":
    case "telemetry_gauge_3d":
    case "gauge_3d":
    case "speedometer_3d":
      return <ThreeDTelemetryGauge scene={scene} accent={accent} />;

    case "upi_architecture_3d":
    case "architecture_3d":
    case "pipeline_3d":
      return <ThreeDArchitecturePipeline scene={scene} accent={accent} />;

    case "upi_alert_3d":
    case "alert_3d":
    case "callout_3d":
    case "reconciliation_3d":
      return <ThreeDCalloutAlert scene={scene} accent={accent} />;

    case "upi_outro_3d":
    case "outro_3d":
    case "digital_india_3d":
      return <ThreeDOutroPayoff scene={scene} accent={accent} />;

    case "gradient_descent":
    case "crest_to_trough":
    default:
      return <ThreeDGradient scene={scene} accent={accent} />;
  }
};
