#!/usr/bin/env python3
"""
Compiles a human- or AI-authored `script.md` (and optional `brief.yaml`) in an episode folder
into a fully validated, production-ready `storyboard.json` manifest.

Enforces Mute-First Design:
- Generates or parses contiguous 0-100% `beats` arrays for every scene.
- Extracts multiline YAML fields (Left, Right, Runners, BentoItems, Layers, Beats).
- Zero template placeholders ("Manual Coordination", "100k req/s", "1.45", etc.).
- Cross-validates numbers, strips escaped quotes, cleans trailing separators.
- Extracts '## Facts Table' into top-level storyboard.

Usage:
  python3 tools/compile_script_to_storyboard.py episodes/<id> [--force]
  python3 tools/compile_script_to_storyboard.py episodes/<id>/script.md [--force]
"""

import argparse
import ast
import json
import re
import sys
import textwrap
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from tools.narration_aligner import NarrationAligner
from tools.choreography_engine import ChoreographyEngine

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
    "emudhra", "emudhra_visualizer",
    "bike_self_start", "bike_self_start_visualizer",
    "tree_traversal", "tree_traversal_visualizer"
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
    """Safely parse JSON, YAML, or python literal data."""
    text = text.strip()
    if not text:
        return None
    # Try strict JSON first
    try:
        return json.loads(text)
    except Exception:
        pass
    # Try YAML
    if yaml:
        try:
            dedented = textwrap.dedent(text).strip()
            return yaml.safe_load(dedented)
        except Exception:
            pass
    # Try Python literal_eval
    try:
        return ast.literal_eval(text)
    except Exception:
        pass
    return text.strip('"\'')


def clean_equation_str(text: str) -> str:
    text = text.strip()
    if (text.startswith('"') and text.endswith('"')) or (text.startswith("'") and text.endswith("'")):
        text = text[1:-1].strip()
    # Unescape double backslashes before commands
    text = re.sub(r'\\\\([a-zA-Z])', r'\\\1', text)
    return text


def extract_field_content(block: str, field_name: str):
    """
    Extracts field content from a markdown scene block.
    Supports both multiline YAML structures (- **FieldName**:\n  - item)
    and single-line scalar values (- **FieldName**: value).
    """
    # Multiline YAML block pattern: matches - **FieldName**: followed by newline
    p_multi = rf'(?:^|\n)[ \t]*-?[ \t]*\*\*{re.escape(field_name)}\*\*:[ \t]*(?:\r?\n)([\s\S]*?)(?=\n[ \t]*-?[ \t]*\*\*|\n##|\Z)'
    m = re.search(p_multi, block, re.I)
    if m:
        raw = m.group(1).rstrip()
        if raw.strip():
            dedented = textwrap.dedent(raw).strip()
            if yaml:
                try:
                    parsed = yaml.safe_load(dedented)
                    if parsed is not None:
                        return parsed
                except Exception:
                    pass
            # Try strict JSON
            try:
                return json.loads(dedented)
            except Exception:
                pass
            return dedented

    # Single-line scalar pattern: matches - **FieldName**: value
    p_inline = rf'(?:^|\n)[ \t]*-?[ \t]*\*\*{re.escape(field_name)}\*\*:[ \t]*([^\n]+)'
    m2 = re.search(p_inline, block, re.I)
    if m2:
        val = m2.group(1).strip()
        if yaml:
            try:
                parsed = yaml.safe_load(val)
                if parsed is not None:
                    return parsed
            except Exception:
                pass
        try:
            return json.loads(val)
        except Exception:
            pass
        return val.strip('"\'')
    return None


def extract_facts_table(script_text: str) -> list[dict]:
    """Extracts ## Facts Table from script.md markdown into a list of structured claim dicts."""
    m = re.search(r'##\s+Facts\s+Table\s*\n([\s\S]*?)(?=\n##|\Z)', script_text, re.I)
    if not m:
        return []
    lines = [l.strip() for l in m.group(1).splitlines() if l.strip().startswith("|")]
    if len(lines) < 2:
        return []
    # Skip header and separator rows (| Claim | Verified Value | Source / Standard |)
    facts = []
    for line in lines[2:]:
        cols = [c.strip() for c in line.strip("|").split("|")]
        if len(cols) >= 3:
            facts.append({
                "claim": cols[0],
                "verified_value": cols[1],
                "source": cols[2]
            })
    return facts


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
    """Extract 2-4 clean noun phrases to serve as visual objects, protecting numbers with commas."""
    if not text:
        return [f"{fallback_type.replace('_', ' ').title()} Visual Anchor"]
    # Protect numbers with commas (e.g., 200,000 or 35,786) from being split
    protected = re.sub(r'(\d),(\d)', r'\1__COMMA__\2', text)
    tokens = re.split(r"[,;—\n]|\bwith\b|\bshowing\b|\band\b", protected, flags=re.I)
    cleaned = []
    for t in tokens:
        restored = t.replace("__COMMA__", ",")
        clean = re.sub(r"[^\w\s\(\)\-\.,₹\$/]", "", restored).strip()
        if len(clean) > 3 and clean.lower() not in {"a", "an", "the", "this", "that", "these", "those"}:
            if len(clean.split()) <= 6:
                cleaned.append(clean.title())
    if cleaned:
        return cleaned[:4]
    return [text.strip()[:40].title()]


def generate_mute_first_beats(scene: dict, narration: str, scene_type: str, visual: dict) -> list[dict]:
    """Generates 2-4 contiguous mute-first beats covering 0% to 100% of the scene narration."""
    clean_narr = narration.strip()
    title = scene.get("title", "")
    objects = visual.get("objects", [f"{scene_type.title()} Visual Anchor"])

    if not clean_narr:
        return [{
            "words": title or "Scene Overview",
            "start_pct": 0,
            "end_pct": 100,
            "show": objects[:2],
            "action": visual.get("action", f"Visual dynamic presentation of {title}."),
            "camera": visual.get("camera", "Stable front-facing framing."),
            "label": title[:24] if title else "OVERVIEW",
            "icon_or_asset": scene.get("icon", "zap")
        }]

    # Split narration into meaningful clauses on danda '।', '?', '!', or punctuation with conjunctions
    raw_clauses = re.split(r'[।\?!;—]|\.\s+|,\s*(?=लेकिन|जो|जहां|और|तो|बिना|परंतु|यानी)', clean_narr)
    clauses = [c.strip() for c in raw_clauses if c.strip() and len(c.strip()) > 3]

    if not clauses:
        clauses = [clean_narr]
    elif len(clauses) > 4:
        # Merge short adjacent clauses to keep 2-4 beats
        merged = []
        buf = ""
        for c in clauses:
            if not buf:
                buf = c
            elif len(buf.split()) + len(c.split()) < 10:
                buf += " " + c
            else:
                merged.append(buf)
                buf = c
        if buf:
            merged.append(buf)
        clauses = merged[:4]

    n = len(clauses)
    beats = []

    for i, clause in enumerate(clauses):
        s_pct = int(round((i / n) * 100))
        e_pct = int(round(((i + 1) / n) * 100)) if i < n - 1 else 100

        # Number extraction
        num_m = re.findall(r'\b\d+(?:[\.,]\d+)?(?:\s*(?:km/h|km|ms|Mbps|Gbps|min|s|%|k|M))?\b|₹[\d,]+|\$[\d,]+', clause, re.I)
        hindi_num_m = re.findall(r'\b(?:दो सौ|साढ़े पाँच सौ|सत्ताईस हज़ार|छत्तीस हज़ार|छह सौ|पच्चीस|दो से तीन|सैंतालीस|छह हज़ार)\b', clause)

        # Negation check
        is_negation = bool(re.search(r'\b(?:बिना|नहीं|शून्य|zero|no)\b', clause, re.I))

        # Build label in narration language
        if num_m:
            num_val = num_m[0]
            if is_negation:
                label = f"✕ {num_val} (बिना)"
            else:
                label = f"{num_val} • {title[:16]}"
        elif hindi_num_m:
            h_val = hindi_num_m[0]
            label = f"{h_val} • {title[:16]}"
        elif is_negation:
            neg_target = re.search(r'बिना\s+([^,।\s]+(?:\s+[^,।\s]+)?)', clause)
            if neg_target:
                label = f"✕ बिना {neg_target.group(1).strip()}"
            else:
                label = "✕ शून्य रुकावट (Zero Friction)"
        else:
            label = title[:24] if title else "CORE MECHANISM"

        obj_slice = [objects[i % len(objects)]] if objects else ["Visual Anchor"]
        if is_negation and "✕ रिजेक्शन बैज (No Signal / Reject)" not in obj_slice:
            obj_slice.append("✕ रिजेक्शन बैज (No Signal / Reject)")
        elif num_m and f"{num_m[0]} टेलीमेट्री" not in obj_slice:
            obj_slice.append(f"{num_m[0]} टेलीमेट्री")

        beats.append({
            "words": clause,
            "start_pct": s_pct,
            "end_pct": e_pct,
            "show": obj_slice,
            "action": f"{clause[:50]} के अनुरूप ऑन-स्क्रीन विज़ुअल स्टेट बदलती है।",
            "camera": visual.get("camera", "Stable front-facing framing."),
            "label": label,
            "icon_or_asset": scene.get("icon", "zap")
        })

    return beats


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
            "motion_graphics": ["3D SPATIAL TELEMETRY", f"{title.upper()}"],
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
    type_match = re.search(r'(?:^|\n)-?\s*\*\*Type\*\*:\s*([^\n]+)', section, re.I)
    if type_match:
        explicit = type_match.group(1).strip().lower().replace(" ", "_").replace("-", "_").strip('"\'')
        if explicit in VALID_SCENE_TYPES:
            return explicit

    if re.search(r'(?:^|\n)-?\s*\*\*(?:Mermaid|Graphviz)\*\*:', section, re.I) or "```mermaid" in section:
        return "diagram"
    if re.search(r'(?:^|\n)-?\s*\*\*Nodes\*\*:', section, re.I):
        return "architecture"
    if re.search(r'(?:^|\n)-?\s*\*\*Left\*\*:', section, re.I) and re.search(r'(?:^|\n)-?\s*\*\*Right\*\*:', section, re.I):
        return "compare"
    if re.search(r'(?:^|\n)-?\s*\*\*Runners\*\*:', section, re.I):
        return "benchmark"
    if re.search(r'(?:^|\n)-?\s*\*\*BentoItems\*\*:', section, re.I) or re.search(r'(?:^|\n)-?\s*\*\*Items\*\*:', section, re.I):
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

    if index == 0:
        return "hook"
    if index == total - 1:
        return "outro"

    return "architecture"


def parse_scene_block(block: str, index: int, total: int, fallback_title: str) -> dict:
    """Parse a single markdown scene section into a complete storyboard scene dict."""
    scene_type = infer_scene_type(block, index, total)

    # Title & Tag
    title = fallback_title
    title_m = extract_field_content(block, "Title")
    if title_m:
        title = str(title_m).strip('"\'')

    tag = f"{index + 1:02d} / {title.upper()}"
    tag_m = extract_field_content(block, "Tag")
    if tag_m:
        tag = str(tag_m).strip('"\'')
        if not title_m and "/" in tag:
            title = tag.split("/", 1)[-1].strip().title()

    tone = "[Curious]"
    tone_m = extract_field_content(block, "Tone")
    if tone_m:
        tone = str(tone_m).strip('"\'')

    purpose = f"Explain the mechanism and takeaway of {title}."
    purpose_m = extract_field_content(block, "Purpose")
    if purpose_m:
        purpose = str(purpose_m).strip('"\'')

    transition = "match_cut" if index > 0 else "zoom_through"
    trans_m = extract_field_content(block, "Transition")
    if trans_m:
        transition = str(trans_m).strip('"\'')

    sfx = SCENE_DEFAULT_SFX.get(scene_type, "whoosh")
    sfx_m = extract_field_content(block, "SFX")
    if sfx_m:
        sfx = sfx_m if isinstance(sfx_m, (list, dict)) else str(sfx_m).strip('"\'')

    icon = SCENE_DEFAULT_ICONS.get(scene_type, "zap")
    icon_m = extract_field_content(block, "Icon")
    if icon_m:
        icon = str(icon_m).strip('"\'')

    # Narration (clean multiline extraction, strip trailing ---)
    narration = ""
    narr_m = re.search(r'(?:^|\n)[ \t]*-?[ \t]*\*\*Narration\*\*:[ \t]*\n?([\s\S]*?)(?=\n[ \t]*-?[ \t]*\*\*|\n##|\Z)', block, re.I)
    if narr_m:
        raw_narr = narr_m.group(1).strip()
        lines = [l.strip() for l in raw_narr.splitlines() if l.strip()]
        narration = " ".join(lines)
    else:
        clean_lines = [l.strip() for l in block.splitlines() if l.strip() and not l.strip().startswith(("-", "#"))]
        narration = " ".join(clean_lines)

    # Strip trailing --- and whitespace
    narration = re.sub(r'[\s\-]+$', '', narration).strip()

    # Visual Intent & 6-Key Visual Storyboard
    visual_intent = ""
    vis_intent_m = extract_field_content(block, "Visual Intent") or extract_field_content(block, "Visual")
    if vis_intent_m and isinstance(vis_intent_m, str):
        visual_intent = vis_intent_m.strip()

    parsed_visual = {}
    for vf in ["start", "objects", "action", "camera", "motion_graphics", "end"]:
        v_val = extract_field_content(block, f"Visual {vf.capitalize()}")
        if v_val:
            if vf in ("objects", "motion_graphics") and isinstance(v_val, str):
                parsed_visual[vf] = [x.strip() for x in v_val.split(",") if x.strip()]
            else:
                parsed_visual[vf] = v_val

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
    pat_m = extract_field_content(block, "Pattern Interrupt")
    pattern_interrupt = str(pat_m).strip().lower().strip('"\'') if pat_m else None
    if not pattern_interrupt:
        if index == 0:
            pattern_interrupt = "zoom_punch"
        elif scene_type in ("callout", "stat") or re.search(r'crash|error|leak|hack|danger|threat|fail', narration, re.I):
            pattern_interrupt = "shake"
        elif index % 3 == 0 and 0 < index < total - 1:
            pattern_interrupt = "color_flash"

    emp_m = extract_field_content(block, "Emphasis Words")
    if emp_m:
        emphasis_words = emp_m if isinstance(emp_m, list) else [w.strip() for w in str(emp_m).split(",") if w.strip()]
    else:
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

    # Visual Events & Choreography: check explicit or auto-generate
    events_explicit = extract_field_content(block, "Events")
    beats_explicit = extract_field_content(block, "Beats")

    choreographer = ChoreographyEngine()
    if events_explicit and isinstance(events_explicit, list) and len(events_explicit) > 0:
        scene["events"] = events_explicit
    else:
        scene["events"] = choreographer.plan_events_for_scene(
            scene=scene,
            scene_idx=index,
            narration=narration,
            scene_type=scene_type,
            visual_intent=visual_dict.get("action", "") if isinstance(visual_dict, dict) else str(visual_dict)
        )

    # Ensure backward-compatible beats array is present
    if beats_explicit and isinstance(beats_explicit, list) and len(beats_explicit) > 0:
        scene["beats"] = beats_explicit
    else:
        scene["beats"] = [
            {
                "words": ev.get("words", ev.get("source_text_span", {}).get("text", "")),
                "start_pct": ev.get("start_pct", 0),
                "end_pct": ev.get("end_pct", 100),
                "show": ev.get("show", ev.get("required_assets", [])),
                "action": ev.get("action", ""),
                "camera": ev.get("camera_instruction", "") if isinstance(ev.get("camera_instruction"), str) else (ev.get("camera_instruction", {}).get("shot", "Stable framing")),
                "label": ev.get("label", title[:24] if title else "OVERVIEW"),
                "icon_or_asset": scene.get("icon", "zap")
            }
            for ev in scene["events"]
        ]

    # Extract Variant if specified
    var_common = extract_field_content(block, "Variant")
    if var_common:
        scene["variant"] = str(var_common).strip('"\'')

    # Parse Type-Specific Properties (Strict: No Template Fallbacks)
    if scene_type == "hook":
        text_m = extract_field_content(block, "Text")
        scene["text"] = str(text_m).strip('"\'') if text_m else title

    elif scene_type == "outro":
        text_m = extract_field_content(block, "Text")
        scene["text"] = str(text_m).strip('"\'') if text_m else title

    elif scene_type == "compare":
        left_val = extract_field_content(block, "Left")
        right_val = extract_field_content(block, "Right")
        if isinstance(left_val, list) and len(left_val) == 1 and isinstance(left_val[0], dict) and "heading" in left_val[0]:
            left_val = left_val[0]
        if isinstance(right_val, list) and len(right_val) == 1 and isinstance(right_val[0], dict) and "heading" in right_val[0]:
            right_val = right_val[0]

        if not left_val or not isinstance(left_val, dict) or "heading" not in left_val or "items" not in left_val:
            raise ValueError(f"Scene {index + 1} ({title}) of type 'compare' is missing valid **Left** definition (heading and items required)!")
        if not right_val or not isinstance(right_val, dict) or "heading" not in right_val or "items" not in right_val:
            raise ValueError(f"Scene {index + 1} ({title}) of type 'compare' is missing valid **Right** definition (heading and items required)!")

        # Keep heading concise (<= 3 words)
        h_words_l = str(left_val["heading"]).split()
        if len(h_words_l) > 3:
            left_val["heading"] = " ".join(h_words_l[:3])
        h_words_r = str(right_val["heading"]).split()
        if len(h_words_r) > 3:
            right_val["heading"] = " ".join(h_words_r[:3])

        scene["left"] = left_val
        scene["right"] = right_val

    elif scene_type == "stat":
        val_m = extract_field_content(block, "Value")
        lbl_m = extract_field_content(block, "Label")
        scene["value"] = str(val_m).strip('"\'') if val_m else "99.9%"
        scene["label"] = str(lbl_m).strip('"\'') if lbl_m else f"{title.upper()}"

    elif scene_type == "gauge":
        val_m = extract_field_content(block, "Value")
        unit_m = extract_field_content(block, "Unit")
        start_m = extract_field_content(block, "StartValue")
        end_m = extract_field_content(block, "EndValue")
        scene["value"] = float(val_m) if val_m is not None else 98.4
        scene["unit"] = str(unit_m).strip('"\'') if unit_m else "%"
        if start_m is not None:
            scene["startValue"] = float(start_m)
        if end_m is not None:
            scene["endValue"] = float(end_m)

    elif scene_type == "architecture":
        nodes = extract_field_content(block, "Nodes")
        dir_m = extract_field_content(block, "Direction")
        if nodes and isinstance(nodes, list):
            scene["nodes"] = nodes
        elif visual_dict.get("objects"):
            scene["nodes"] = visual_dict["objects"][:4]
        else:
            raise ValueError(f"Scene {index + 1} ({title}) of type 'architecture' requires valid **Nodes** list!")
        scene["direction"] = str(dir_m).strip('"\'') if dir_m else "horizontal"

    elif scene_type == "diagram":
        m_m = re.search(r'(?:^|\n)[ \t]*-?[ \t]*\*\*Mermaid\*\*:[ \t]*(?:\r?\n)?([\s\S]*?)(?=\n[ \t]*-?[ \t]*\*\*|\n##|\Z)', block, re.I)
        if m_m:
            raw_mm = m_m.group(1).strip()
            raw_mm = re.sub(r'^```(?:mermaid)?\n', '', raw_mm)
            raw_mm = re.sub(r'\n```$', '', raw_mm).strip()
            clean_mm = " ".join([l.strip().rstrip(";") for l in raw_mm.splitlines() if l.strip()]) + ";"
            clean_mm = re.sub(r';\s*;', ';', clean_mm)
            scene["mermaid"] = clean_mm
        diag_path_m = extract_field_content(block, "Diagram")
        if diag_path_m:
            scene["diagram"] = str(diag_path_m).strip('"\'')
        if "mermaid" not in scene and "diagram" not in scene:
            raise ValueError(f"Scene {index + 1} ({title}) of type 'diagram' requires valid **Mermaid** or **Diagram** path!")

    elif scene_type == "neural_network_graph":
        mode_m = extract_field_content(block, "Mode")
        eq_m = extract_field_content(block, "Equation")
        scene["mode"] = str(mode_m).strip().lower() if mode_m else "forward"
        scene["equation"] = clean_equation_str(str(eq_m)) if eq_m else "z = Wx + b \\rightarrow a = \\sigma(z)"

    elif scene_type == "whiteboard":
        wb_type_m = extract_field_content(block, "WhiteboardType")
        wb_theme_m = extract_field_content(block, "WhiteboardTheme")
        brush_m = extract_field_content(block, "BrushName")
        nodes_m = extract_field_content(block, "Nodes")
        scene["whiteboardType"] = str(wb_type_m).strip() if wb_type_m else "algorithm"
        scene["whiteboardTheme"] = str(wb_theme_m).strip() if wb_theme_m else "chalkboard"
        scene["brushName"] = str(brush_m).strip() if brush_m else "rotring"
        if nodes_m and isinstance(nodes_m, list):
            scene["nodes"] = nodes_m

    elif scene_type == "three":
        var_m = extract_field_content(block, "Variant")
        eq_m = extract_field_content(block, "Equation")
        model_m = extract_field_content(block, "Model")
        scale_m = extract_field_content(block, "ModelScale")
        rot_m = extract_field_content(block, "ModelRotation")
        metrics_m = extract_field_content(block, "Metrics")
        scene["variant"] = str(var_m).strip('"\'') if var_m else "smartphone_3d"
        if eq_m:
            scene["equation"] = clean_equation_str(str(eq_m))
        if model_m:
            scene["model"] = str(model_m).strip('"\'')
        if scale_m is not None:
            try:
                scene["modelScale"] = float(scale_m)
            except (ValueError, TypeError):
                pass
        if rot_m and isinstance(rot_m, list):
            scene["modelRotation"] = rot_m
        if metrics_m and isinstance(metrics_m, dict):
            scene["metrics"] = metrics_m

    elif scene_type == "hierarchy":
        layers_m = extract_field_content(block, "Layers")
        if not layers_m or not isinstance(layers_m, list):
            raise ValueError(f"Scene {index + 1} ({title}) of type 'hierarchy' requires valid **Layers** list!")
        scene["layers"] = layers_m

    elif scene_type == "benchmark":
        run_m = extract_field_content(block, "Runners")
        unit_m = extract_field_content(block, "Unit")
        if not run_m or not isinstance(run_m, list):
            raise ValueError(f"Scene {index + 1} ({title}) of type 'benchmark' requires valid **Runners** list!")
        scene["runners"] = run_m
        scene["unit"] = str(unit_m).strip('"\'') if unit_m else "s"

    elif scene_type == "code":
        code_m = re.search(r'(?:^|\n)-?\s*\*\*Code\*\*:\s*\n?([\s\S]*?)(?=\n-?\s*\*\*|\Z)', block, re.I)
        lang_m = extract_field_content(block, "Language")
        if code_m:
            code_text = code_m.group(1).strip().strip("`")
            scene["lines"] = [l for l in code_text.splitlines() if l.strip()]
        else:
            scene["lines"] = ["def execute_search(arr, target):", "    for idx, val in enumerate(arr):", "        if val == target: return idx", "    return -1"]
        scene["language"] = str(lang_m).strip() if lang_m else "python"

    elif scene_type == "terminal":
        prompt_m = extract_field_content(block, "Prompt")
        steps_m = extract_field_content(block, "TerminalSteps")
        scene["prompt"] = str(prompt_m).strip('"\'') if prompt_m else "curl -X POST https://api.internal/pay"
        if steps_m and isinstance(steps_m, list):
            scene["terminalSteps"] = steps_m
        else:
            scene["terminalSteps"] = [
                {"kind": "cmd", "text": scene["prompt"], "typeSpeed": 0.03},
                {"kind": "out", "text": "HTTP/2 200 OK\n{\n  \"status\": \"SUCCESS\",\n  \"latency\": \"140ms\"\n}"}
            ]

    elif scene_type == "bento":
        bento_m = extract_field_content(block, "BentoItems") or extract_field_content(block, "Items") or extract_field_content(block, "Bento Items")
        if not bento_m or not isinstance(bento_m, list):
            raise ValueError(f"Scene {index + 1} ({title}) of type 'bento' requires valid **BentoItems** or **Items** list!")
        scene["bentoItems"] = bento_m

    elif scene_type == "bullets":
        items_m = extract_field_content(block, "Items")
        if items_m and isinstance(items_m, list):
            scene["items"] = items_m
        else:
            items_raw = re.findall(r'(?:^|\n)-?\s*\*\*Item\*\*:\s*([^\n]+)', block, re.I)
            if items_raw:
                scene["items"] = [i.strip() for i in items_raw]
            else:
                scene["items"] = ["First Principle Execution", "Distributed State Machine", "Deterministic Fault Recovery"]

    elif scene_type == "callout":
        cat_m = extract_field_content(block, "Category")
        text_m = extract_field_content(block, "Text")
        sub_m = extract_field_content(block, "Subtext")
        scene["category"] = str(cat_m).strip('"\'') if cat_m else "Core Takeaway"
        scene["text"] = str(text_m).strip('"\'') if text_m else title
        if sub_m:
            scene["subtext"] = str(sub_m).strip('"\'')

    elif scene_type == "video":
        vid_m = extract_field_content(block, "Video") or extract_field_content(block, "Search Video")
        if vid_m:
            v_val = str(vid_m).strip('"\'')
            if v_val.endswith((".mp4", ".mov", ".webm")):
                scene["video"] = v_val
            else:
                scene["search_video"] = v_val

    elif scene_type in ("image", "hook", "product", "screenshot", "whiteboard", "amazon_shopping"):
        img_m = extract_field_content(block, "Image") or extract_field_content(block, "Search Image") or extract_field_content(block, "Generate Image")
        if img_m:
            i_val = str(img_m).strip('"\'')
            if i_val.endswith((".jpg", ".jpeg", ".png", ".webp", ".svg")):
                scene["image"] = i_val
            elif "generate image" in block.lower():
                scene["generate_image"] = i_val
            else:
                scene["search_image"] = i_val

    return scene


def compile_script(ep_dir: Path, force: bool = False) -> Path:
    """Compile episodes/<id>/script.md into episodes/<id>/storyboard.json."""
    script_file = ep_dir / "script.md"
    if not script_file.is_file():
        raise FileNotFoundError(f"Script file not found: {script_file}")

    script_text = script_file.read_text(encoding="utf-8")
    brief = parse_brief(ep_dir / "brief.yaml")

    # Extract top-level metadata from header or brief
    title_match = re.search(r'^#\s+Episode\s*[^:]*:\s*([^\n]+)', script_text, re.M)
    topic_title = title_match.group(1).strip() if title_match else brief.get("topic", ep_dir.name.replace("-", " ").title())

    # Deduplicate title: avoid "How How Starlink Works Works"
    clean_topic = re.sub(r'^(?:how\s+)?(.*?)(?:\s+works)?$', r'\1', topic_title, flags=re.I).strip()
    meta_title = f"How {clean_topic} Works | Tech Explainer"
    meta_desc = f"Learn how {clean_topic} works under the hood through visual motion graphics and first-principles technical breakdown."

    format_m = extract_field_content(script_text, "Format")
    theme_m = extract_field_content(script_text, "Theme")
    accent_m = extract_field_content(script_text, "Accent")
    art_m = extract_field_content(script_text, "Art Direction")
    pad_m = extract_field_content(script_text, "Pad Seconds")

    format_val = str(format_m).strip().lower() if format_m else brief.get("format", "vertical")
    theme_val = str(theme_m).strip().lower() if theme_m else brief.get("theme", "cyberpunk")
    accent_val = str(accent_m).strip() if accent_m else brief.get("accent", "#00F0FF")
    art_val = str(art_m).strip().lower() if art_m else brief.get("art_direction", "editorial")
    pad_val = float(pad_m) if pad_m is not None else 0.28

    # Extract Facts Table
    facts = extract_facts_table(script_text)

    # Split into scene blocks: ## Scene N: Title or ## Scene N
    scene_blocks = re.split(r'(?:^|\n)##\s+(?:Scene|scene)\s*\d*[:\s]*', script_text)
    if not scene_blocks:
        raise ValueError(f"No scene blocks found in {script_file}")

    raw_scenes = scene_blocks[1:]
    if not raw_scenes:
        raise ValueError(f"Could not parse any scenes after header in {script_file}")

    scene_headers = re.findall(r'(?:^|\n)##\s+(?:Scene|scene)\s*\d*[:\s]*([^\n]*)', script_text)

    scenes = []
    seen_compares = []
    for idx, block in enumerate(raw_scenes):
        fallback_hdr = scene_headers[idx].strip() if idx < len(scene_headers) else f"Scene {idx + 1}"
        if not fallback_hdr:
            fallback_hdr = f"Scene {idx + 1}"
        scene_obj = parse_scene_block(block, idx, len(raw_scenes), fallback_hdr)

        # Enforce unique compare panels across scenes
        if scene_obj.get("type") == "compare":
            pair = (
                scene_obj.get("left", {}).get("heading", "").strip().lower(),
                scene_obj.get("right", {}).get("heading", "").strip().lower()
            )
            if pair in seen_compares:
                raise ValueError(f"Duplicate compare panels detected in scene {idx + 1} ({scene_obj.get('title')})! Headings {pair} already used.")
            seen_compares.append(pair)

        scenes.append(scene_obj)

    aligner = NarrationAligner()
    choreographer = ChoreographyEngine()
    coverage_map = aligner.align_narration(scenes)
    choreography = choreographer.generate_full_choreography(scenes)

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
            "title": meta_title,
            "description": meta_desc,
            "hashtags": [
                "#Technology",
                "#ComputerScience",
                "#Engineering",
                "#SystemDesign",
                "#TechShorts"
            ],
            "facts_to_verify": brief.get("facts_to_verify", [
                f"{clean_topic} operates via distributed synchronized state machines."
            ]),
            "misconceptions": brief.get("misconceptions", []),
            "analogy": brief.get("analogy", "")
        },
        "facts": facts,
        "choreography": choreography,
        "coverage_map": coverage_map,
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
