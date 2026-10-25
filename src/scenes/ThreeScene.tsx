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
import { ThreeDATMMachine } from "./ThreeDATMMachine";
import { ThreeDDataStore } from "./ThreeDDataStore";
import { ThreeDOverflowStack } from "./ThreeDOverflowStack";
import { ThreeDRouteSegments } from "./ThreeDRouteSegments";
import { ThreeDWashingMachine } from "./ThreeDWashingMachine";
import { ThreeDModelViewer } from "./ThreeDModelViewer";
import { ThreeDGPSTrilateration } from "./ThreeDGPSTrilateration";
import { ThreeDBluetoothSpace } from "./ThreeDBluetoothSpace";
import { ThreeDQuickCommerceStore } from "./ThreeDQuickCommerceStore";
import { ThreeDBinarySearch } from "./ThreeDBinarySearch";
import { ThreeDGoogleMaps } from "./ThreeDGoogleMaps";
import { ThreeDFASTagToll } from "./ThreeDFASTagToll";

interface ThreeSceneProps {
  scene: SceneSpec;
  accent: string;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({ scene, accent }) => {
  // If an explicit GLB/GLTF model is provided, prioritize 3D model viewer
  if (scene.model || (scene as any).modelUrl) {
    return <ThreeDModelViewer scene={scene} accent={accent} />;
  }

  // Variant router for 3D WebGL scenes
  const variant = scene.variant || "gradient_descent";

  switch (variant) {
    case "fastag_toll_3d":
    case "fastag_toll":
    case "fastag_3d":
    case "rfid_toll_3d":
    case "toll_gantry_3d":
    case "fastag_sticker_3d":
    case "fastag_chip_3d":
    case "fastag_server_3d":
    case "fastag_barrier_3d":
    case "boom_barrier_3d":
      return <ThreeDFASTagToll scene={scene} accent={accent} />;

    case "google_maps_3d":
    case "google_maps":
    case "maps_navigation_3d":
    case "navigation_3d":
      return <ThreeDGoogleMaps scene={scene} accent={accent} />;

    case "binary_search_3d":
    case "binary_search":
    case "step_by_step_3d":
      return <ThreeDBinarySearch scene={scene} accent={accent} />;

    case "model_3d":
    case "gltf_model":
    case "model_viewer_3d":
    case "custom_model_3d":
      return <ThreeDModelViewer scene={scene} accent={accent} />;

    case "atm_machine_3d":
    case "atm_hook_3d":
    case "atm_3d":
    case "cash_dispenser_3d":
    case "atm_kiosk_3d":
      return <ThreeDATMMachine scene={scene} accent={accent} />;

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

    case "gps_trilateration_3d":
    case "trilateration_3d":
    case "gps_constellation_3d":
    case "satellite_orbit_3d":
      return <ThreeDGPSTrilateration scene={scene} accent={accent} />;

    case "bluetooth_link_3d":
    case "bluetooth_radio_3d":
    case "bluetooth_discovery_3d":
    case "bluetooth_pairing_3d":
    case "bluetooth_layers_3d":
    case "bluetooth_digital_data_3d":
    case "bluetooth_spectrum_3d":
    case "frequency_hopping_3d":
    case "bluetooth_audio_path_3d":
    case "packet_to_sound_3d":
    case "bluetooth_interference_3d":
    case "bluetooth_local_p2p_3d":
    case "bluetooth_ecosystem_3d":
    case "bluetooth_pipeline_3d":
    case "bluetooth_reveal_3d":
    case "bluetooth_master_recap_3d":
    case "bluetooth_3d":
      return <ThreeDBluetoothSpace scene={scene} accent={accent} />;

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

    case "database_cluster_3d":
    case "database_rows_3d":
    case "datastore_3d":
    case "database_3d":
    case "db_cluster_3d":
      return <ThreeDDataStore scene={scene} accent={accent} />;

    case "overflow_stack_3d":
    case "connection_pool_3d":
    case "connection_stack_3d":
    case "buffer_overflow_3d":
    case "stack_overflow_3d":
      return <ThreeDOverflowStack scene={scene} accent={accent} />;

    case "route_segments_3d":
    case "track_segments_3d":
    case "bitmask_route_3d":
    case "railway_route_3d":
      return <ThreeDRouteSegments scene={scene} accent={accent} />;

    case "washing_machine_3d":
    case "washer_3d":
    case "washing_machine":
    case "washer_drum_3d":
    case "centrifugal_spin_3d":
    case "drum_spin_3d":
    case "surfactant_micelle_3d":
    case "micelle_3d":
      return <ThreeDWashingMachine scene={scene} accent={accent} />;

    case "dark_store_3d":
    case "dark_store_warehouse_3d":
    case "quick_commerce_store_3d":
    case "mfc_warehouse_3d":
      return <ThreeDQuickCommerceStore scene={scene} accent={accent} />;

    case "gradient_descent":
    case "crest_to_trough":
    default:
      return <ThreeDGradient scene={scene} accent={accent} />;
  }
};
