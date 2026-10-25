#!/usr/bin/env python3
"""
Compiles a human- or AI-authored `script.md` (and optional `brief.yaml`) in an episode folder
into a fully validated, production-ready `storyboard.json` manifest.

Supports all 30+ Remotion visual scene engines, auto-enriches the mandatory 6-key structured
visual storyboards, tags, transitions, semantic icons, and sound effects.

Usage:
  python3 tools/compile_script_to_storyboard.py episodes/<id> [--force]
  python3 tools/compile_script_to_storyboard.py episodes/<id>/script.md [--force]
"""

import argparse
import ast
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Supported scene types in the Remotion engine
VALID_SCENE_TYPES = {
    "hook", "bullets", "stat", "manim", "video", "diagram", "outro",
    "image", "quote", "compare", "three", "code", "architecture",
    "gauge", "timeline", "callout", "bento", "benchmark", "hierarchy",
    "data_structure", "inspector", "quadrant", "concentric", "seat_booking",
    "neural_network_graph", "interview", "terminal", "screenshot", "chart",
    "product", "sorting_visualizer", "amazon_shopping", "whiteboard",
    "refrigerator", "air_conditioner", "linear_search_visualizer", "binary_search_visualizer",
    "tesla_roadster_visualizer", "pacman_enzyme_visualizer", "quick_commerce", "depth_parallax",
    "google_maps_visualizer", "google_maps", "aadhaar_visualizer", "aadhaar",
    "tower_of_hanoi", "tower_of_hanoi_visualizer",
    "emudhra", "emudhra_visualizer"
}

SCENE_DEFAULT_SFX = {
    "hook": "whoosh",
    "quick_commerce": "radar_beep",
    "stat": "impact",
    "gauge": "bass_drop",
    "benchmark": "radar_beep",
    "compare": "click",
    "bullets": "pop",
    "code": "typing",
    "terminal": "typing",
    "architecture": "fast_whoosh",
    "diagram": "fast_whoosh",
    "neural_network_graph": "radar_beep",
    "three": "fast_whoosh",
    "depth_parallax": "whoosh",
    "whiteboard": "pop",
    "callout": "glitch",
    "video": "whoosh",
    "linear_search_visualizer": "fast_whoosh",
    "binary_search_visualizer": "fast_whoosh",
    "tower_of_hanoi": "fast_whoosh",
    "tower_of_hanoi_visualizer": "fast_whoosh",
    "outro": "ding",
    "default": "whoosh"
}

SCENE_DEFAULT_ICONS = {
    "hook": "smartphone",
    "quick_commerce": "truck",
    "stat": "activity",
    "gauge": "gauge",
    "depth_parallax": "layers",
    "benchmark": "zap",
    "compare": "git-compare",
    "bullets": "list",
    "code": "code",
    "terminal": "terminal",
    "architecture": "network",
    "diagram": "workflow",
    "neural_network_graph": "brain",
    "three": "cube",
    "whiteboard": "edit-3",
    "timeline": "clock",
    "data_structure": "layers",
    "callout": "alert-circle",
    "video": "film",
    "linear_search_visualizer": "search",
    "binary_search_visualizer": "split",
    "tower_of_hanoi": "layers",
    "tower_of_hanoi_visualizer": "layers",
    "outro": "sparkles",
    "default": "zap"
}


def parse_loose_data(text: str):
    """Safely parse JSON or python literal data."""
    text = text.strip()
    if not text:
        return None
    # Try strict JSON first
    try:
        return json.loads(text)
    except Exception:
        pass
    # Try Python literal_eval
    try:
        return ast.literal_eval(text)
    except Exception:
        pass
    return text


def clean_equation_str(text: str) -> str:
    text = text.strip()
    if (text.startswith('"') and text.endswith('"')) or (text.startswith("'") and text.endswith("'")):
        text = text[1:-1].strip()
    # Unescape double backslashes before commands
    text = re.sub(r'\\\\([a-zA-Z])', r'\\\1', text)
    return text


def parse_brief(brief_path: Path) -> dict:
    if not brief_path.is_file():
        return {}
    content = brief_path.read_text(encoding="utf-8")
    data = {}
    current_key = None
    list_items = []

    for line in content.splitlines():
        line_s = line.strip()
        if not line_s or line_s.startswith("#"):
            continue
        if line.startswith("  - ") or line.startswith("    - "):
            item = line_s.lstrip("- ").strip().strip('"').strip("'")
            list_items.append(item)
            continue
        elif current_key and list_items:
            data[current_key] = list_items
            list_items = []
            current_key = None

        if ":" in line_s:
            parts = line_s.split(":", 1)
            key = parts[0].strip()
            val = parts[1].strip().strip('"').strip("'")
            if not val:
                current_key = key
                list_items = []
            else:
                data[key] = val

    if current_key and list_items:
        data[current_key] = list_items
    return data


def extract_objects_from_text(text: str, fallback_type: str) -> list[str]:
    """Extract 2-4 clean noun phrases to serve as visual objects."""
    if not text:
        return [f"{fallback_type.replace('_', ' ').title()} Visual Anchor"]
    # Split on commas, semicolons, dashes, 'with', 'showing'
    tokens = re.split(r"[,;—\n]|\bwith\b|\bshowing\b|\band\b", text, flags=re.I)
    cleaned = []
    for t in tokens:
        clean = re.sub(r"[^\w\s\(\)\-\.]", "", t).strip()
        if len(clean) > 3 and clean.lower() not in {"a", "an", "the", "this", "that", "these", "those"}:
            if len(clean.split()) <= 5:
                cleaned.append(clean.title())
    if cleaned:
        return cleaned[:4]
    return [text.strip()[:40].title()]


def generate_visual_storyboard(scene_type: str, action_desc: str, title: str) -> dict:
    """Generate a 100% compliant 6-key structured visual storyboard."""
    action = action_desc.strip() if action_desc else f"Visual dynamic presentation of {title}."
    objects = extract_objects_from_text(action, scene_type)

    if scene_type == "hook":
        return {
            "start": "High-impact visual anchor settles into the frame with glowing neon accents.",
            "objects": objects or ["3D Smartphone Standee", "Active Scanner Beam", "Pulsing Reticle"],
            "action": action,
            "camera": "Stable front-facing mobile framing with subtle focus push-in.",
            "motion_graphics": [f"01 / {title.upper()}", "High-CTR Visual Reticle"],
            "end": "Anchor locks in, holding frame before transitioning to the problem breakdown."
        }
    elif scene_type == "outro":
        return {
            "start": "Structured takeaway card framed in dark navy with cyan accent borders.",
            "objects": objects or ["Key Takeaway Summary Card", "Metric Badges", "Channel Subscribe CTA Button"],
            "action": action or "Core takeaways lock in with glowing badges; channel follow CTA activates.",
            "camera": "Stable cinematic hero outro presentation.",
            "motion_graphics": ["CHECK · ADVANCE · PAYOFF", "FOLLOW FOR TECH EXPLAINERS"],
            "end": "Holds on clean branded frame with zero audio clipping."
        }
    elif scene_type == "compare":
        return {
            "start": "Split comparison stage materializing with contrasting left and right panels.",
            "objects": objects or ["Legacy Protocol Panel", "Optimized Protocol Panel", "Differential Connector Beam"],
            "action": action or "Items highlight side-by-side with synchronized differential telemetry.",
            "camera": "Stable centered split-screen framing with generous subtitle margins.",
            "motion_graphics": ["SIDE-BY-SIDE ARCHITECTURAL COMPARISON", "STATUS INDICATORS"],
            "end": "Comparison holds with clear visual superiority established."
        }
    elif scene_type == "stat":
        return {
            "start": "Bold editorial stat display centered on the frame with glowing cyan typography.",
            "objects": objects or ["Primary Complexity Numeral", "Benchmark Telemetry Meter", "Unit Badge"],
            "action": action or "Prominent metric slams into frame with count-up impact and telemetry confirmation.",
            "camera": "Stable macro typography presentation.",
            "motion_graphics": [f"{title.upper()}", "BIG-O METRIC TELEMETRY"],
            "end": "Metric settles at peak value, locking into state."
        }
    elif scene_type == "gauge":
        return {
            "start": "Circular or linear precision gauge calibrated at baseline zero.",
            "objects": objects or ["Precision Telemetry Gauge", "Needle Reticle", "Status Pill"],
            "action": action or "Needle sweeps dynamically from start to target value with radial glow pulse.",
            "camera": "Stable centered technical HUD framing.",
            "motion_graphics": ["TELEMETRY SWEEP", "REAL-TIME STATUS BADGE"],
            "end": "Gauge locks at final threshold with verified status confirmation."
        }
    elif scene_type == "architecture":
        return {
            "start": "Multi-tier system architecture nodes positioned in clean grid orientation.",
            "objects": objects or ["Client Node", "Switching Core", "Database Cluster", "Transit Bus"],
            "action": action or "Glowing request packet travels sequentially across active system nodes.",
            "camera": "Stable isometric or planar architecture diagram view.",
            "motion_graphics": ["TRANSACTION PIPELINE", "STATE: IN-FLIGHT"],
            "end": "Packet reaches terminal node, completing the execution cycle."
        }
    elif scene_type == "diagram":
        return {
            "start": "Structured flowchart with high-contrast glowing nodes and directional lasers.",
            "objects": objects or ["Decision Diamond", "Execution Path", "Terminal State Node"],
            "action": action or "Animated scanline illuminates the decision loop and early exit branches.",
            "camera": "Stable flowchart framing with clean top and bottom clearance.",
            "motion_graphics": ["DECISION TREE", "TERMINATION CONDITIONS"],
            "end": "Execution path resolves cleanly into final state."
        }
    elif scene_type == "neural_network_graph":
        return {
            "start": "Multi-layer neural network graph with input, hidden, and output neuron columns.",
            "objects": objects or ["Input Layer Neurons", "Hidden Layer Synapses", "Output Activation Node"],
            "action": action or "Luminous activation pulses stream through weighted synapses with live formula HUD.",
            "camera": "Stable front-facing network topology view.",
            "motion_graphics": ["NEURAL ACTIVATION FLOW", "WEIGHT UPDATE TELEMETRY"],
            "end": "Activations resolve at output layer, confirming forward pass."
        }
    elif scene_type == "whiteboard":
        return {
            "start": "Clean textured drafting surface with subtle architectural grid lines.",
            "objects": objects or ["Hand-Drawn Vector Sketch", "Formula Banner", "Callout Arrows"],
            "action": action or "Procedural brush strokes dynamically draw the mechanism in organic cadence.",
            "camera": "Stable overhead drafting perspective.",
            "motion_graphics": ["CHALKBOARD INFOGRAPHIC", "KEY TAKEAWAY ANNOTATION"],
            "end": "Drawing completes with tactile chalk texture and clear visual contrast."
        }
    elif scene_type == "terminal":
        return {
            "start": "macOS terminal window with dark blurred backdrop and blinking cursor.",
            "objects": objects or ["Terminal Window Frame", "Command Prompt", "Output Console Stream"],
            "action": action or "Command types out char-by-char, executing with instant color-coded output.",
            "camera": "Stable desktop window framing with generous mobile margins.",
            "motion_graphics": ["CLI COMMAND EXECUTION", "STATUS: SUCCESS (200 OK)"],
            "end": "Cursor returns to prompt line, indicating execution completion."
        }
    elif scene_type == "three":
        return {
            "start": "Dark 3D spatial coordinate grid with directional volumetric lighting.",
            "objects": objects or ["3D Physical Object Model", "Surrounding Coordinate Grid", "HUD Telemetry Plane"],
            "action": action or "3D model rotates into hero perspective while animating internal state changes.",
            "camera": "Motivated tracking camera orbiting the focal 3D model.",
            "motion_graphics": [f"3D SPATIAL TELEMETRY", f"{title.upper()}"],
            "end": "Model locks into informative angle for seamless scene cut."
        }
    elif scene_type == "depth_parallax":
        return {
            "start": "Layered 2.5D visual environment establishes with depth plane separation.",
            "objects": objects or ["Foreground Subject Mesh", "Depth Map Layer", "Volumetric Parallax Plane"],
            "action": action or "Camera performs dynamic optical dolly/pan, displacing foreground against background.",
            "camera": "Dynamic depth-map parallax move with optical perspective shift.",
            "motion_graphics": [f"01 / {title.upper()}", "DEPTH TELEMETRY"],
            "end": "Parallax movement completes smoothly, establishing focal depth."
        }
    elif scene_type == "quick_commerce":
        return {
            "start": "High-tech quick commerce logistics stage materializing with telemetry HUD.",
            "objects": objects or ["3D Smartphone Terminal", "Dark Store Floor Grid", "Electric Delivery Scooter"],
            "action": action or "Dynamic logistics mechanism animates with real-time countdown telemetry.",
            "camera": "Stable technical isometric or UI framing with high visual contrast.",
            "motion_graphics": [f"{title.upper()}", "HYPERLOCAL LOGISTICS ENGINE"],
            "end": "Action locks into place with verified delivery SLA confirmation."
        }
    else:
        return {
            "start": f"High-contrast editorial layout establishing {title}.",
            "objects": objects,
            "action": action,
            "camera": "Stable front-facing vertical framing with safety margins.",
            "motion_graphics": [f"{title.upper()}", "TECHNICAL MOTION GRAPHIC"],
            "end": "Visual transformation completes, seamlessly resolving into next scene."
        }


def infer_scene_type(section: str, index: int, total: int) -> str:
    """Infer scene type strictly prioritizing explicit markers, then unambiguous content."""
    # 1. Explicit marker: - **Type**: <type>
    type_match = re.search(r'(?:^|\n)-?\s*\*\*Type\*\*:\s*([^\n]+)', section, re.I)
    if type_match:
        explicit = type_match.group(1).strip().lower().replace(" ", "_").replace("-", "_")
        if explicit in VALID_SCENE_TYPES:
            return explicit

    # 2. Strong structural cues
    if re.search(r'(?:^|\n)-?\s*\*\*(?:Mermaid|Graphviz)\*\*:', section, re.I) or "```mermaid" in section:
        return "diagram"
    if re.search(r'(?:^|\n)-?\s*\*\*Nodes\*\*:', section, re.I):
        return "architecture"
    if re.search(r'(?:^|\n)-?\s*\*\*Left\*\*:', section, re.I) and re.search(r'(?:^|\n)-?\s*\*\*Right\*\*:', section, re.I):
        return "compare"
    if re.search(r'(?:^|\n)-?\s*\*\*Runners\*\*:', section, re.I):
        return "benchmark"
    if re.search(r'(?:^|\n)-?\s*\*\*BentoItems\*\*:', section, re.I):
        return "bento"
    if re.search(r'(?:^|\n)-?\s*\*\*TerminalSteps\*\*:', section, re.I):
        return "terminal"
    if re.search(r'(?:^|\n)-?\s*\*\*WhiteboardType\*\*:', section, re.I):
        return "whiteboard"
    if re.search(r'(?:^|\n)-?\s*\*\*Variant\*\*:\s*(?:forward|backward)', section, re.I) or "neural_network" in section.lower():
        return "neural_network_graph"
    if re.search(r'(?:^|\n)-?\s*\*\*Value\*\*:\s*O\(', section, re.I) or re.search(r'(?:^|\n)-?\s*\*\*Value\*\*:\s*[\d\.]+%?', section, re.I):
        return "stat"
    if re.search(r'(?:^|\n)-?\s*\*\*Variant\*\*:', section, re.I):
        return "three"

    # 3. Position-based defaults
    if index == 0:
        return "hook"
    if index == total - 1:
        return "outro"

    # 4. Safe default
    return "architecture"


def parse_scene_block(block: str, index: int, total: int, fallback_title: str) -> dict:
    """Parse a single markdown scene section into a complete storyboard scene dict."""
    scene_type = infer_scene_type(block, index, total)

    # Title & Tag
    title = fallback_title
    title_m = re.search(r'(?:^|\n)-?\s*\*\*Title\*\*:\s*([^\n]+)', block, re.I)
    if title_m:
        title = title_m.group(1).strip()

    tag = f"{index + 1:02d} / {title.upper()}"
    tag_m = re.search(r'(?:^|\n)-?\s*\*\*Tag\*\*:\s*([^\n]+)', block, re.I)
    if tag_m:
        tag = tag_m.group(1).strip()
        if not title_m and "/" in tag:
            title = tag.split("/", 1)[-1].strip().title()

    # Tone
    tone = "[Curious]"
    tone_m = re.search(r'(?:^|\n)-?\s*\*\*Tone\*\*:\s*([^\n]+)', block, re.I)
    if tone_m:
        tone = tone_m.group(1).strip()

    # Purpose
    purpose = f"Explain the mechanism and takeaway of {title}."
    purpose_m = re.search(r'(?:^|\n)-?\s*\*\*Purpose\*\*:\s*([^\n]+)', block, re.I)
    if purpose_m:
        purpose = purpose_m.group(1).strip()

    # Transition
    transition = "match_cut" if index > 0 else "zoom_through"
    trans_m = re.search(r'(?:^|\n)-?\s*\*\*Transition\*\*:\s*([^\n]+)', block, re.I)
    if trans_m:
        transition = trans_m.group(1).strip()

    # SFX
    sfx = SCENE_DEFAULT_SFX.get(scene_type, "whoosh")
    sfx_m = re.search(r'(?:^|\n)-?\s*\*\*SFX\*\*:\s*([^\n]+)', block, re.I)
    if sfx_m:
        parsed_sfx = parse_loose_data(sfx_m.group(1).strip())
        if parsed_sfx:
            sfx = parsed_sfx

    # Icon
    icon = SCENE_DEFAULT_ICONS.get(scene_type, "zap")
    icon_m = re.search(r'(?:^|\n)-?\s*\*\*Icon\*\*:\s*([^\n]+)', block, re.I)
    if icon_m:
        icon = icon_m.group(1).strip()

    # Narration (clean multiline extraction)
    narration = ""
    narr_m = re.search(r'(?:^|\n)-?\s*\*\*Narration\*\*:\s*\n?([\s\S]*?)(?=\n-?\s*\*\*|\Z)', block, re.I)
    if narr_m:
        narration = " ".join([l.strip() for l in narr_m.group(1).strip().splitlines() if l.strip()])
    else:
        # Fallback: find lines not starting with - or #
        clean_lines = [l.strip() for l in block.splitlines() if l.strip() and not l.strip().startswith(("-", "#"))]
        narration = " ".join(clean_lines)

    # Visual Intent & 6-Key Visual Storyboard
    visual_intent = ""
    vis_intent_m = re.search(r'(?:^|\n)-?\s*\*\*Visual(?:\s+Intent)?\*\*:\s*([^\n]+(?:\n[^\n\-#]+)*)', block, re.I)
    if vis_intent_m:
        visual_intent = " ".join([l.strip() for l in vis_intent_m.group(1).strip().splitlines() if l.strip()])

    # Check for individual visual fields (start, objects, action, camera, motion_graphics, end)
    parsed_visual = {}
    for vf in ["start", "objects", "action", "camera", "motion_graphics", "end"]:
        v_field_m = re.search(rf'(?:^|\n)-?\s*\*\*Visual\s+{vf.capitalize()}\*\*:\s*([^\n]+)', block, re.I)
        if v_field_m:
            val = v_field_m.group(1).strip()
            if vf in ("objects", "motion_graphics"):
                parsed_visual[vf] = [x.strip() for x in val.split(",") if x.strip()]
            else:
                parsed_visual[vf] = val

    if "action" in parsed_visual and len(parsed_visual) >= 4:
        defaults = generate_visual_storyboard(scene_type, visual_intent, title)
        for k, v in defaults.items():
            if k not in parsed_visual:
                parsed_visual[k] = v
        visual_dict = parsed_visual
    else:
        visual_dict = generate_visual_storyboard(scene_type, visual_intent, title)

    scene = {
        "type": scene_type,
        "tag": tag,
        "title": title,
        "purpose": purpose,
        "tone": tone,
        "narration": narration,
        "transition": transition,
        "sfx": sfx,
        "icon": icon,
        "visual": visual_dict
    }

    # Viral retention directives: pattern_interrupt, emphasis_words, hook_strength, payoff_type
    pat_m = re.search(r'(?:^|\n)-?\s*\*\*Pattern\s*Interrupt\*\*:\s*([^\n]+)', block, re.I)
    pattern_interrupt = pat_m.group(1).strip().lower() if pat_m else None
    if not pattern_interrupt:
        if index == 0:
            pattern_interrupt = "zoom_punch"
        elif scene_type in ("callout", "stat") or re.search(r'crash|error|leak|hack|danger|threat|fail', narration, re.I):
            pattern_interrupt = "shake"
        elif index % 3 == 0 and index > 0 and index < total - 1:
            pattern_interrupt = "color_flash"

    emp_m = re.search(r'(?:^|\n)-?\s*\*\*Emphasis\s*Words\*\*:\s*([^\n]+)', block, re.I)
    if emp_m:
        parsed_emp = parse_loose_data(emp_m.group(1).strip())
        emphasis_words = parsed_emp if isinstance(parsed_emp, list) else [w.strip() for w in emp_m.group(1).split(",") if w.strip()]
    else:
        # Auto-extract numbers, percentages, metrics, and currency from narration for kinetic caption pop
        emp_matches = re.findall(r'\b\d+(?:\.\d+)?(?:%|ms|km/h|s|x|GB|TB|MB|M|K)?\b|₹[\d,]+|\$[\d,]+|लाख|करोड़', narration)
        emphasis_words = list(dict.fromkeys(emp_matches))[:6]

    if pattern_interrupt:
        scene["pattern_interrupt"] = pattern_interrupt
    if emphasis_words:
        scene["emphasis_words"] = emphasis_words
    if index == 0:
        scene["hook_strength"] = 9.5
    if index == total - 1:
        scene["payoff_type"] = "loop_setup"

    # Parse Type-Specific Properties
    if scene_type == "hook":
        text_m = re.search(r'(?:^|\n)-?\s*\*\*Text\*\*:\s*([^\n]+)', block, re.I)
        scene["text"] = text_m.group(1).strip() if text_m else title

    elif scene_type == "outro":
        text_m = re.search(r'(?:^|\n)-?\s*\*\*Text\*\*:\s*([^\n]+)', block, re.I)
        scene["text"] = text_m.group(1).strip() if text_m else title

    elif scene_type == "compare":
        left_m = re.search(r'(?:^|\n)-?\s*\*\*Left\*\*:\s*([^\n]+(?:\n[^\n\-#]+)*)', block, re.I)
        right_m = re.search(r'(?:^|\n)-?\s*\*\*Right\*\*:\s*([^\n]+(?:\n[^\n\-#]+)*)', block, re.I)
        if left_m:
            parsed_left = parse_loose_data(left_m.group(1).strip())
            if isinstance(parsed_left, dict) and "heading" in parsed_left and "items" in parsed_left:
                # Keep heading concise (<= 3 words) to satisfy validator
                h_words = str(parsed_left["heading"]).split()
                if len(h_words) > 3:
                    parsed_left["heading"] = " ".join(h_words[:3])
                scene["left"] = parsed_left
        if right_m:
            parsed_right = parse_loose_data(right_m.group(1).strip())
            if isinstance(parsed_right, dict) and "heading" in parsed_right and "items" in parsed_right:
                h_words = str(parsed_right["heading"]).split()
                if len(h_words) > 3:
                    parsed_right["heading"] = " ".join(h_words[:3])
                scene["right"] = parsed_right
        # Fallback if left/right missing
        if "left" not in scene:
            scene["left"] = {"heading": "Standard Approach", "items": ["High Latency", "Manual Coordination", "Linear Bottleneck"]}
        if "right" not in scene:
            scene["right"] = {"heading": "Optimized Core", "items": ["Sub-Second Latency", "Direct Synchronization", "O(1) Efficiency"]}

    elif scene_type == "stat":
        val_m = re.search(r'(?:^|\n)-?\s*\*\*Value\*\*:\s*([^\n]+)', block, re.I)
        lbl_m = re.search(r'(?:^|\n)-?\s*\*\*Label\*\*:\s*([^\n]+)', block, re.I)
        scene["value"] = val_m.group(1).strip().strip('"').strip("'") if val_m else "99.9%"
        scene["label"] = lbl_m.group(1).strip().strip('"').strip("'") if lbl_m else f"{title.upper()}"

    elif scene_type == "gauge":
        val_m = re.search(r'(?:^|\n)-?\s*\*\*Value\*\*:\s*([^\n]+)', block, re.I)
        unit_m = re.search(r'(?:^|\n)-?\s*\*\*Unit\*\*:\s*([^\n]+)', block, re.I)
        start_m = re.search(r'(?:^|\n)-?\s*\*\*StartValue\*\*:\s*([^\n]+)', block, re.I)
        end_m = re.search(r'(?:^|\n)-?\s*\*\*EndValue\*\*:\s*([^\n]+)', block, re.I)
        scene["value"] = float(val_m.group(1).strip().strip('"').strip("'")) if val_m else 98.4
        scene["unit"] = unit_m.group(1).strip().strip('"').strip("'") if unit_m else "%"
        if start_m:
            scene["startValue"] = float(start_m.group(1).strip().strip('"').strip("'"))
        if end_m:
            scene["endValue"] = float(end_m.group(1).strip().strip('"').strip("'"))

    elif scene_type == "architecture":
        nodes_m = re.search(r'(?:^|\n)-?\s*\*\*Nodes\*\*:\s*([^\n]+(?:\n[^\n\-#]+)*)', block, re.I)
        dir_m = re.search(r'(?:^|\n)-?\s*\*\*Direction\*\*:\s*([^\n]+)', block, re.I)
        if nodes_m:
            parsed_nodes = parse_loose_data(nodes_m.group(1).strip())
            if isinstance(parsed_nodes, list):
                scene["nodes"] = parsed_nodes
        if "nodes" not in scene:
            scene["nodes"] = ["Client Device", "API Gateway", "Service Core", "Storage Cluster"]
        scene["direction"] = dir_m.group(1).strip() if dir_m else "horizontal"

    elif scene_type == "diagram":
        m_m = re.search(r'(?:^|\n)-?\s*\*\*Mermaid\*\*:\s*\n?([\s\S]*?)(?=\n-?\s*\*\*|\Z)', block, re.I)
        if m_m:
            raw_mm = m_m.group(1).strip().strip("`").replace("mermaid\n", "")
            # Convert raw newlines into semicolons for validator compliance
            clean_mm = " ".join([l.strip().rstrip(";") for l in raw_mm.splitlines() if l.strip()]) + ";"
            clean_mm = re.sub(r";\s*;", ";", clean_mm)
            scene["mermaid"] = clean_mm
        diag_path_m = re.search(r'(?:^|\n)-?\s*\*\*Diagram\*\*:\s*([^\n]+)', block, re.I)
        if diag_path_m:
            scene["diagram"] = diag_path_m.group(1).strip().strip('"').strip("'")
        if "mermaid" not in scene and "diagram" not in scene:
            scene["mermaid"] = "graph TD; A[Initiate Request] --> B{Valid?}; B -- YES --> C[Process Execution]; B -- NO --> D[Return Error];"

    elif scene_type == "neural_network_graph":
        mode_m = re.search(r'(?:^|\n)-?\s*\*\*Mode\*\*:\s*([^\n]+)', block, re.I)
        eq_m = re.search(r'(?:^|\n)-?\s*\*\*Equation\*\*:\s*([^\n]+)', block, re.I)
        scene["mode"] = mode_m.group(1).strip().lower() if mode_m else "forward"
        scene["equation"] = clean_equation_str(eq_m.group(1)) if eq_m else "z = Wx + b \\rightarrow a = \\sigma(z)"

    elif scene_type == "whiteboard":
        wb_type_m = re.search(r'(?:^|\n)-?\s*\*\*WhiteboardType\*\*:\s*([^\n]+)', block, re.I)
        wb_theme_m = re.search(r'(?:^|\n)-?\s*\*\*WhiteboardTheme\*\*:\s*([^\n]+)', block, re.I)
        brush_m = re.search(r'(?:^|\n)-?\s*\*\*BrushName\*\*:\s*([^\n]+)', block, re.I)
        nodes_m = re.search(r'(?:^|\n)-?\s*\*\*Nodes\*\*:\s*([^\n]+(?:\n[^\n\-#]+)*)', block, re.I)
        scene["whiteboardType"] = wb_type_m.group(1).strip() if wb_type_m else "algorithm"
        scene["whiteboardTheme"] = wb_theme_m.group(1).strip() if wb_theme_m else "chalkboard"
        scene["brushName"] = brush_m.group(1).strip() if brush_m else "rotring"
        if nodes_m:
            parsed_nodes = parse_loose_data(nodes_m.group(1).strip())
            if isinstance(parsed_nodes, list):
                scene["nodes"] = parsed_nodes

    elif scene_type == "three":
        var_m = re.search(r'(?:^|\n)-?\s*\*\*Variant\*\*:\s*([^\n]+)', block, re.I)
        eq_m = re.search(r'(?:^|\n)-?\s*\*\*Equation\*\*:\s*([^\n]+)', block, re.I)
        model_m = re.search(r'(?:^|\n)-?\s*\*\*Model\*\*:\s*([^\n]+)', block, re.I)
        metrics_m = re.search(r'(?:^|\n)-?\s*\*\*Metrics\*\*:\s*([^\n]+(?:\n[^\n\-#]+)*)', block, re.I)
        scene["variant"] = var_m.group(1).strip() if var_m else "smartphone_3d"
        if eq_m:
            scene["equation"] = clean_equation_str(eq_m.group(1))
        if model_m:
            scene["model"] = model_m.group(1).strip()
        if metrics_m:
            parsed_metrics = parse_loose_data(metrics_m.group(1).strip())
            if isinstance(parsed_metrics, dict):
                scene["metrics"] = parsed_metrics

    elif scene_type == "hierarchy":
        layers_m = re.search(r'(?:^|\n)-?\s*\*\*Layers\*\*:\s*([^\n]+(?:\n[^\n\-#]+)*)', block, re.I)
        if layers_m:
            parsed_layers = parse_loose_data(layers_m.group(1).strip())
            if isinstance(parsed_layers, list):
                scene["layers"] = parsed_layers
        if "layers" not in scene:
            scene["layers"] = [
                {"name": "Level 1: Expressways & Highways", "spec": "Cross-Country Fast Arteries", "active": True},
                {"name": "Level 2: Arterials & State Routes", "spec": "Inter-City Connecting Corridors", "active": True},
                {"name": "Level 3: Local Streets & Alleys", "spec": "High-Density Residential Mesh", "active": True}
            ]

    elif scene_type == "benchmark":
        run_m = re.search(r'(?:^|\n)-?\s*\*\*Runners\*\*:\s*([^\n]+(?:\n[^\n\-#]+)*)', block, re.I)
        unit_m = re.search(r'(?:^|\n)-?\s*\*\*Unit\*\*:\s*([^\n]+)', block, re.I)
        if run_m:
            parsed_run = parse_loose_data(run_m.group(1).strip())
            if isinstance(parsed_run, list):
                scene["runners"] = parsed_run
        if "runners" not in scene:
            scene["runners"] = [
                {"name": "Traditional", "value": 1.45, "status": "Bottleneck", "color": "#FF4444"},
                {"name": "Optimized Core", "value": 0.12, "status": "Winner", "color": "#00F0FF"}
            ]
        scene["unit"] = unit_m.group(1).strip() if unit_m else "s"

    elif scene_type == "code":
        code_m = re.search(r'(?:^|\n)-?\s*\*\*Code\*\*:\s*\n?([\s\S]*?)(?=\n-?\s*\*\*|\Z)', block, re.I)
        lang_m = re.search(r'(?:^|\n)-?\s*\*\*Language\*\*:\s*([^\n]+)', block, re.I)
        if code_m:
            code_text = code_m.group(1).strip().strip("`")
            scene["lines"] = [l for l in code_text.splitlines() if l.strip()]
        else:
            scene["lines"] = ["def execute_search(arr, target):", "    for idx, val in enumerate(arr):", "        if val == target: return idx", "    return -1"]
        scene["language"] = lang_m.group(1).strip() if lang_m else "python"

    elif scene_type == "terminal":
        prompt_m = re.search(r'(?:^|\n)-?\s*\*\*Prompt\*\*:\s*([^\n]+)', block, re.I)
        steps_m = re.search(r'(?:^|\n)-?\s*\*\*TerminalSteps\*\*:\s*([^\n]+(?:\n[^\n\-#]+)*)', block, re.I)
        scene["prompt"] = prompt_m.group(1).strip() if prompt_m else "curl -X POST https://api.internal/pay"
        if steps_m:
            parsed_steps = parse_loose_data(steps_m.group(1).strip())
            if isinstance(parsed_steps, list):
                scene["terminalSteps"] = parsed_steps
        if "terminalSteps" not in scene:
            scene["terminalSteps"] = [
                {"kind": "cmd", "text": scene["prompt"], "typeSpeed": 0.03},
                {"kind": "out", "text": "HTTP/2 200 OK\n{\n  \"status\": \"SUCCESS\",\n  \"latency\": \"140ms\"\n}"}
            ]

    elif scene_type == "bento":
        bento_m = re.search(r'(?:^|\n)-?\s*\*\*Bento\s*Items?\*\*:\s*([^\n]+(?:\n[^\n\-#]+)*)', block, re.I)
        if bento_m:
            parsed_bento = parse_loose_data(bento_m.group(1).strip())
            if isinstance(parsed_bento, list):
                scene["bentoItems"] = parsed_bento
        if "bentoItems" not in scene:
            scene["bentoItems"] = [
                {"title": "Throughput", "value": "100k req/s", "span": 2, "badge": "PEAK"},
                {"title": "P99 Latency", "value": "< 12ms", "span": 1, "badge": "OPTIMAL"}
            ]

    elif scene_type == "bullets":
        items_m = re.findall(r'(?:^|\n)-?\s*\*\*Item\*\*:\s*([^\n]+)', block, re.I)
        if items_m:
            scene["items"] = [i.strip() for i in items_m]
        else:
            scene["items"] = ["First Principle Execution", "Sub-Second In-Memory Synchronization", "Deterministic Fault Recovery"]

    elif scene_type == "callout":
        cat_m = re.search(r'(?:^|\n)-?\s*\*\*Category\*\*:\s*([^\n]+)', block, re.I)
        text_m = re.search(r'(?:^|\n)-?\s*\*\*Text\*\*:\s*([^\n]+)', block, re.I)
        sub_m = re.search(r'(?:^|\n)-?\s*\*\*Subtext\*\*:\s*([^\n]+)', block, re.I)
        scene["category"] = cat_m.group(1).strip() if cat_m else "Core Takeaway"
        scene["text"] = text_m.group(1).strip() if text_m else title
        if sub_m:
            scene["subtext"] = sub_m.group(1).strip()

    elif scene_type == "video":
        vid_m = re.search(r'(?:^|\n)-?\s*\*\*(?:Video|Search Video)\*\*:\s*([^\n]+)', block, re.I)
        if vid_m:
            v_val = vid_m.group(1).strip()
            if v_val.endswith((".mp4", ".mov", ".webm")):
                scene["video"] = v_val
            else:
                scene["search_video"] = v_val

    elif scene_type in ("image", "hook", "product", "screenshot", "whiteboard", "amazon_shopping"):
        img_m = re.search(r'(?:^|\n)-?\s*\*\*(?:Image|Search Image|Generate Image)\*\*:\s*([^\n]+)', block, re.I)
        if img_m:
            i_val = img_m.group(1).strip().strip('"').strip("'")
            if i_val.endswith((".jpg", ".jpeg", ".png", ".webp", ".svg")):
                scene["image"] = i_val
            elif "generate image" in block.lower():
                scene["generate_image"] = i_val
            else:
                scene["search_image"] = i_val
        if scene_type == "product":
            price_m = re.search(r'(?:^|\n)-?\s*\*\*Price\*\*:\s*([^\n]+)', block, re.I)
            if price_m:
                scene["price"] = price_m.group(1).strip().strip('"').strip("'")
            hl_m = re.search(r'(?:^|\n)-?\s*\*\*Highlight\*\*:\s*([^\n]+)', block, re.I)
            if hl_m:
                scene["highlight"] = hl_m.group(1).strip().strip('"').strip("'")
            tagl_m = re.search(r'(?:^|\n)-?\s*\*\*Tagline\*\*:\s*([^\n]+)', block, re.I)
            if tagl_m:
                scene["tagline"] = tagl_m.group(1).strip().strip('"').strip("'")
            specs_m = re.search(r'(?:^|\n)-?\s*\*\*Specs\*\*:\s*([^\n]+(?:\n[^\n\-#]+)*)', block, re.I)
            if specs_m:
                parsed_specs = parse_loose_data(specs_m.group(1).strip())
                if isinstance(parsed_specs, (list, dict)):
                    scene["specs"] = parsed_specs


    elif scene_type == "timeline":
        steps_m = re.search(r'(?:^|\n)-?\s*\*\*Steps\*\*:\s*([^\n]+(?:\n[^\n\-#]+)*)', block, re.I)
        if steps_m:
            parsed_steps = parse_loose_data(steps_m.group(1).strip())
            if isinstance(parsed_steps, list):
                scene["steps"] = parsed_steps
        if "steps" not in scene:
            scene["steps"] = ["Initialize", "Validate", "Process", "Complete"]
    elif scene_type == "depth_parallax":
        img_m = re.search(r'(?:^|\n)-?\s*\*\*Image\*\*:\s*([^\n]+)', block, re.I)
        depth_m = re.search(r'(?:^|\n)-?\s*\*\*DepthMap\*\*:\s*([^\n]+)', block, re.I)
        int_m = re.search(r'(?:^|\n)-?\s*\*\*Intensity\*\*:\s*([^\n]+)', block, re.I)
        mov_m = re.search(r'(?:^|\n)-?\s*\*\*Movement\*\*:\s*([^\n]+)', block, re.I)
        if img_m:
            scene["image"] = img_m.group(1).strip().strip('"').strip("'")
        if depth_m:
            scene["depthMap"] = depth_m.group(1).strip().strip('"').strip("'")
        if int_m:
            try:
                scene["intensity"] = float(int_m.group(1).strip().strip('"').strip("'"))
            except ValueError:
                scene["intensity"] = 0.05
        if mov_m:
            scene["movement"] = mov_m.group(1).strip().strip('"').strip("'")

    # Custom domain visualizers (linear search, air conditioner, etc.)
    for custom_key in ["searchItems", "searchTarget", "variant", "array", "specs", "overlay"]:
        ck_m = re.search(rf'(?:^|\n)-?\s*\*\*{custom_key.replace("_", " ").title()}\*\*:\s*([^\n]+(?:\n[^\n\-#]+)*)', block, re.I)
        if ck_m:
            scene[custom_key] = parse_loose_data(ck_m.group(1).strip())

    # Common scene overlay directives
    part_m = re.search(r'(?:^|\n)-?\s*\*\*Particles\*\*:\s*([^\n]+)', block, re.I)
    if part_m:
        p_val = part_m.group(1).strip().lower()
        if p_val in {"sparkles", "fireflies", "mist", "light-rays", "true"}:
            scene["particles"] = True if p_val == "true" else p_val

    return scene


def compile_script(ep_dir: Path, force: bool = False) -> Path:
    """Compile episodes/<id>/script.md into episodes/<id>/storyboard.json."""
    script_file = ep_dir / "script.md"
    if not script_file.is_file():
        raise FileNotFoundError(f"Script file not found: {script_file}")

    script_text = script_file.read_text(encoding="utf-8")
    brief = parse_brief(ep_dir / "brief.yaml")

    # Extract top-level metadata from header or brief
    title_match = re.search(r'^#\s+Episode:\s*([^\n]+)', script_text, re.M)
    topic_title = title_match.group(1).strip() if title_match else brief.get("topic", ep_dir.name.replace("-", " ").title())

    format_m = re.search(r'(?:^|\n)-?\s*Format:\s*([^\n]+)', script_text, re.I)
    theme_m = re.search(r'(?:^|\n)-?\s*Theme:\s*([^\n]+)', script_text, re.I)
    accent_m = re.search(r'(?:^|\n)-?\s*Accent:\s*([^\n]+)', script_text, re.I)
    art_m = re.search(r'(?:^|\n)-?\s*Art Direction:\s*([^\n]+)', script_text, re.I)
    pad_m = re.search(r'(?:^|\n)-?\s*Pad Seconds:\s*([^\n]+)', script_text, re.I)

    format_val = format_m.group(1).strip().lower() if format_m else brief.get("format", "vertical")
    theme_val = theme_m.group(1).strip().lower() if theme_m else brief.get("theme", "cyberpunk")
    accent_val = accent_m.group(1).strip() if accent_m else brief.get("accent", "#00F0FF")
    art_val = art_m.group(1).strip().lower() if art_m else brief.get("art_direction", "editorial")
    pad_val = float(pad_m.group(1).strip()) if pad_m else 0.28

    # Split into scene blocks: ## Scene N: Title or ## Scene N
    scene_blocks = re.split(r'(?:^|\n)##\s+(?:Scene|scene)\s*\d*[:\s]*', script_text)
    if not scene_blocks:
        raise ValueError(f"No scene blocks found in {script_file}")

    header_block = scene_blocks[0]
    raw_scenes = scene_blocks[1:]
    if not raw_scenes:
        raise ValueError(f"Could not parse any scenes after header in {script_file}")

    # Extract scene header titles
    scene_headers = re.findall(r'(?:^|\n)##\s+(?:Scene|scene)\s*\d*[:\s]*([^\n]*)', script_text)

    scenes = []
    for idx, block in enumerate(raw_scenes):
        fallback_hdr = scene_headers[idx].strip() if idx < len(scene_headers) else f"Scene {idx + 1}"
        if not fallback_hdr:
            fallback_hdr = f"Scene {idx + 1}"
        scene_obj = parse_scene_block(block, idx, len(raw_scenes), fallback_hdr)
        scenes.append(scene_obj)

    storyboard = {
        "$schema": "../../schema/storyboard.schema.json",
        "id": ep_dir.name,
        "format": format_val,
        "art_direction": art_val,
        "theme": theme_val,
        "accent": accent_val,
        "audio_mode": "scenes",
        "captions": True,
        "progress": True,
        "sfx": True,
        "pad_seconds": pad_val,
        "music": None,
        "meta": {
            "title": f"How {topic_title} Works | Tech Explainer",
            "description": f"Learn how {topic_title} works under the hood through visual motion graphics and first-principles technical breakdown.",
            "hashtags": [
                "#Technology",
                "#ComputerScience",
                "#Engineering",
                "#SystemDesign",
                "#TechShorts"
            ],
            "facts_to_verify": brief.get("facts_to_verify", [
                f"{topic_title} operates via distributed synchronized state machines."
            ]),
            "misconceptions": brief.get("misconceptions", []),
            "analogy": brief.get("analogy", "")
        },
        "scenes": scenes
    }

    out_file = ep_dir / "storyboard.json"
    if out_file.is_file() and not force:
        print(f"⚠️ {out_file} already exists. Use --force to overwrite.")
        return out_file

    out_file.write_text(json.dumps(storyboard, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"✅ Successfully compiled {len(scenes)} scenes into: {out_file}")
    return out_file


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", type=Path, help="Path to episode directory or script.md")
    parser.add_argument("--force", action="store_true", help="Overwrite existing storyboard.json")
    args = parser.parse_args()

    target = args.target.expanduser().resolve()
    ep_dir = target if target.is_dir() else target.parent
    if not ep_dir.is_dir():
        sys.exit(f"❌ Episode directory not found: {ep_dir}")

    compile_script(ep_dir, force=args.force)


if __name__ == "__main__":
    main()
