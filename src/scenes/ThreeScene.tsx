import React from "react";
import type { SceneSpec } from "../types";
import { ThreeDGradient } from "./ThreeDGradient";

interface ThreeSceneProps {
  scene: SceneSpec;
  accent: string;
}

export const ThreeScene: React.FC<ThreeSceneProps> = ({ scene, accent }) => {
  // Variant router for 3D WebGL scenes
  const variant = scene.variant || "gradient_descent";

  switch (variant) {
    case "gradient_descent":
    case "crest_to_trough":
    default:
      return <ThreeDGradient scene={scene} accent={accent} />;
  }
};
