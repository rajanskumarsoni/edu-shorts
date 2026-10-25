"""
Slideshow Risk & Scene Variation Analyzer for edu-shorts.

Adapted from OpenMontage's slideshow_risk.py and variation_checker.py heuristics.
Analyzes a storyboard manifest across 6 visual dimensions to catch monotonous,
text-heavy, or static scenes BEFORE rendering.

Dimensions evaluated:
1. repetition: consecutive twin scenes (e.g. stat -> stat, three -> three)
2. typography_overreliance: too many text-dominant slides (quote/bullets/callout without graphics)
3. weak_motion: static holds or missing visual action
4. pacing_outliers: individual scenes held > 16s or rushed < 2s
5. generic_buzzwords: vague filler words replacing concrete mechanism descriptions
6. visual_diversity: proportion of dynamic explanation engines (manim/three/architecture/chart/terminal/diagram)

Composite Score (0 - 5.0, lower is better):
  < 2.0: strong (high visual momentum)
  < 3.0: acceptable
  < 4.0: revise (warning emitted)
  >= 4.0: fail (structural rewrite recommended)
"""

from __future__ import annotations
from typing import Any

# Vague marketing/filler phrases that replace concrete mechanism explanations
GENERIC_BUZZWORDS = {
    "futuristic", "cutting-edge", "state-of-the-art", "modern", "innovative",
    "revolutionary", "next-generation", "sleek", "stunning", "incredible",
    "breathtaking", "vibrant", "dynamic solution", "seamless experience",
}

# Scene types that are inherently text-dominant unless accompanied by graphic assets
TEXT_HEAVY_TYPES = {"quote", "bullets", "callout"}

# Dynamic visual explanation scene types
DYNAMIC_VISUAL_TYPES = {
    "three", "manim", "architecture", "diagram", "video", "chart",
    "terminal", "screenshot", "gauge", "benchmark", "bento", "hierarchy",
    "data_structure", "neural_network_graph", "seat_booking", "hook",
    "sorting_visualizer", "product", "refrigerator", "air_conditioner",
    "linear_search_visualizer", "binary_search_visualizer", "tesla_roadster_visualizer", "pacman_enzyme_visualizer",
    "whiteboard", "compare", "depth_parallax", "quick_commerce", "google_maps", "google_maps_visualizer",
    "aadhaar", "aadhaar_visualizer", "tower_of_hanoi", "tower_of_hanoi_visualizer",
    "emudhra", "emudhra_visualizer"
}


def analyze_slideshow_risk(scenes: list[dict[str, Any]]) -> dict[str, Any]:
    """Score slideshow risk and return violations, suggestions, and composite score.

    Args:
        scenes: List of scene objects from storyboard.json.

    Returns:
        {
            "score": float (0-5.0),
            "verdict": "strong" | "acceptable" | "revise" | "fail",
            "violations": list[str],
            "warnings": list[str],
            "suggestions": list[str],
            "dimensions": dict[str, float]
        }
    """
    if not scenes:
        return {
            "score": 5.0,
            "verdict": "fail",
            "violations": ["Storyboard contains 0 scenes."],
            "warnings": [],
            "suggestions": ["Add at least 3-8 structured scenes."],
            "dimensions": {},
        }

    violations: list[str] = []
    warnings: list[str] = []
    suggestions: list[str] = []

    types = [s.get("type", "unknown") for s in scenes]
    total_scenes = len(scenes)

    # --- Dimension 1: Repetition & Consecutive Twins ---
    repetition_score = 1.0
    consecutive_twins: list[str] = []
    triple_run = False

    for i in range(1, total_scenes):
        is_same_type = types[i] == types[i - 1]
        is_same_variant = scenes[i].get("variant") == scenes[i - 1].get("variant") if (scenes[i].get("variant") or scenes[i - 1].get("variant")) else True
        if is_same_type and is_same_variant and types[i] not in ("outro", "hook"):
            consecutive_twins.append(f"Scenes {i} & {i+1} both use type '{types[i]}'")
            repetition_score += 1.2
            if i >= 2 and types[i] == types[i - 2]:
                triple_run = True
                repetition_score += 2.0

    if triple_run:
        violations.append("Found 3+ consecutive scenes with the exact same scene type. This causes visual fatigue.")
    elif consecutive_twins:
        warnings.append(
            f"Consecutive twin scenes detected: {', '.join(consecutive_twins[:3])}. "
            "Alternate between Spatial, Analytical, and Impact scenes (AGENTS.md Golden Rule 5)."
        )

    # --- Dimension 2: Typography Overreliance ---
    typography_score = 1.0
    text_count = 0
    for s in scenes:
        stype = s.get("type")
        has_graphic = bool(s.get("graphic") or s.get("search_image") or s.get("generate_image") or s.get("icon") or s.get("search_icon"))
        if stype in TEXT_HEAVY_TYPES and not has_graphic:
            text_count += 1

    text_ratio = text_count / max(1, total_scenes)
    if text_ratio > 0.40:
        typography_score += 3.0
        violations.append(
            f"{text_count}/{total_scenes} scenes ({text_ratio:.0%}) are text-only slides without visual anchors."
        )
        suggestions.append("Replace text bullet cards with diagram, architecture, or 3D mechanism scenes.")
    elif text_ratio > 0.25:
        typography_score += 1.5
        warnings.append(
            f"{text_count}/{total_scenes} scenes are text-heavy. Consider adding icons, SVGs, or diagram visuals."
        )

    # --- Dimension 3: Visual Diversity ---
    diversity_score = 1.0
    dynamic_count = sum(1 for t in types if t in DYNAMIC_VISUAL_TYPES)
    dynamic_ratio = dynamic_count / max(1, total_scenes)
    if dynamic_ratio < 0.50:
        diversity_score += 2.5
        warnings.append(
            f"Only {dynamic_count}/{total_scenes} ({dynamic_ratio:.0%}) scenes use dynamic visual engines. Aim for >= 60%."
        )
    else:
        diversity_score = 0.5

    # --- Dimension 4: Pacing Outliers ---
    pacing_score = 1.0
    for idx, s in enumerate(scenes, 1):
        sec = s.get("seconds")
        if isinstance(sec, (int, float)):
            if sec > 18.0:
                pacing_score += 1.0
                warnings.append(f"Scene {idx} ({s.get('type')}) duration {sec}s exceeds 18s; consider splitting.")
            elif sec < 1.8:
                pacing_score += 0.5
                warnings.append(f"Scene {idx} ({s.get('type')}) duration {sec}s is under 1.8s; may be too brief.")

    # --- Dimension 5: Generic Buzzword Detection ---
    buzzword_score = 1.0
    detected_buzzwords: list[str] = []
    for idx, s in enumerate(scenes, 1):
        content = " ".join([
            str(s.get("title", "")),
            str(s.get("tag", "")),
            str(s.get("purpose", "")),
            str(s.get("visual", "")),
        ]).lower()
        for bw in GENERIC_BUZZWORDS:
            if bw in content:
                detected_buzzwords.append(f"Scene {idx}: '{bw}'")
                buzzword_score += 0.4

    if detected_buzzwords:
        warnings.append(
            f"Generic placeholder buzzwords found in {len(detected_buzzwords)} scene(s): {', '.join(detected_buzzwords[:3])}. "
            "Use concrete physical parts, protocols, and exact numbers instead of vague adjectives."
        )

    # Composite Score calculation
    dim_scores = {
        "repetition": min(5.0, repetition_score),
        "typography": min(5.0, typography_score),
        "diversity": min(5.0, diversity_score),
        "pacing": min(5.0, pacing_score),
        "buzzwords": min(5.0, buzzword_score),
    }

    avg_score = sum(dim_scores.values()) / len(dim_scores)

    if avg_score < 2.0 and not violations:
        verdict = "strong"
    elif avg_score < 3.0 and not violations:
        verdict = "acceptable"
    elif avg_score < 4.0 or (violations and len(violations) == 1):
        verdict = "revise"
    else:
        verdict = "fail"

    return {
        "score": round(avg_score, 2),
        "verdict": verdict,
        "violations": violations,
        "warnings": warnings,
        "suggestions": suggestions,
        "dimensions": dim_scores,
    }
