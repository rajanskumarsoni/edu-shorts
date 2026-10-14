#!/usr/bin/env python3
"""
Compiles a human-approved `script.md` and `brief.yaml` in an episode folder
into a validated `storyboard.json` skeleton.

Usage:
  python3 scripts/compile_script_to_storyboard.py episodes/008-rate-limiter
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def parse_brief(brief_path: Path) -> dict:
    if not brief_path.exists():
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


def infer_scene_type(section: str, index: int, total: int) -> dict:
    """Infer scene type and properties from markdown content."""
    section_lower = section.lower()
    
    # Check for explicit type marker - match **Type**: at line start (with optional - prefix)
    type_match = re.search(r'(?:^|\n)-?\s*\*\*Type\*\*:\s*([^\n]+)', section, re.I)
    if type_match:
        explicit_type = type_match.group(1).strip().lower().replace(" ", "_")
        if explicit_type in {"hook", "bullets", "stat", "manim", "video", "outro", 
                              "image", "quote", "compare", "three", "code", "architecture",
                              "gauge", "timeline", "callout", "bento", "benchmark",
                              "hierarchy", "data_structure", "inspector", "quadrant",
                              "concentric", "seat_booking", "interview"}:
            return {"type": explicit_type}
    
    # Infer from content keywords
    if index == 0:
        return {"type": "hook"}
    elif index == total - 1:
        return {"type": "outro"}
    elif any(kw in section_lower for kw in ["manim", "equation", "formula", "latex", "math"]):
        return {"type": "manim"}
    elif any(kw in section_lower for kw in ["code", "```", "function", "class ", "import ", "def "]):
        return {"type": "code"}
    elif any(kw in section_lower for kw in ["compare", "vs ", "versus", "difference", "left", "right"]):
        return {"type": "compare"}
    elif any(kw in section_lower for kw in ["timeline", "step 1", "step 2", "phase", "stage", "sequence"]):
        return {"type": "timeline"}
    elif any(kw in section_lower for kw in ["stat", "metric", "number", "%", "percent", "million", "billion"]):
        return {"type": "stat"}
    elif any(kw in section_lower for kw in ["quote", "said", "\"", "“", "”"]):
        return {"type": "quote"}
    elif any(kw in section_lower for kw in ["bullet", "list", "item", "- ", "• "]):
        return {"type": "bullets"}
    elif any(kw in section_lower for kw in ["3d", "three", "model", "glb", "gltf", "webgl"]):
        return {"type": "three"}
    elif any(kw in section_lower for kw in ["architecture", "system", "node", "service", "pipeline", "flow"]):
        return {"type": "architecture"}
    elif any(kw in section_lower for kw in ["gauge", "meter", "speed", "latency", "throughput"]):
        return {"type": "gauge"}
    elif any(kw in section_lower for kw in ["callout", "warning", "tip", "note", "important", "caution"]):
        return {"type": "callout"}
    elif any(kw in section_lower for kw in ["benchmark", "comparison", "faster", "slower", "performance"]):
        return {"type": "benchmark"}
    elif any(kw in section_lower for kw in ["hierarchy", "layer", "stack", "level"]):
        return {"type": "hierarchy"}
    elif any(kw in section_lower for kw in ["queue", "stack", "buffer", "hashmap", "data structure"]):
        return {"type": "data_structure"}
    elif any(kw in section_lower for kw in ["inspect", "packet", "header", "payload", "field", "decode"]):
        return {"type": "inspector"}
    elif any(kw in section_lower for kw in ["quadrant", "tradeoff", "2d", "x axis", "y axis"]):
        return {"type": "quadrant"}
    elif any(kw in section_lower for kw in ["concentric", "ring", "security", "perimeter", "defense"]):
        return {"type": "concentric"}
    elif any(kw in section_lower for kw in ["seat", "booking", "reservation", "train", "concert"]):
        return {"type": "seat_booking"}
    elif any(kw in section_lower for kw in ["interview", "qa", "question", "answer", "dialogue"]):
        return {"type": "interview"}
    else:
        return {"type": "architecture"}  # default fallback


def parse_visual_storyboard(section: str, scene_type: str) -> dict:
    """Parse or generate a scene-appropriate visual storyboard."""
    # Try to parse structured visual fields
    visual = {}
    
    fields = ["start", "objects", "action", "camera", "motion_graphics", "end"]
    for field in fields:
        match = re.search(rf'-\s*\*\*Visual\s+{field.capitalize()}\*\*:\s*([^\n]+)', section, re.I)
        if match:
            val = match.group(1).strip()
            if field in ("objects", "motion_graphics"):
                # Parse as comma-separated list
                visual[field] = [x.strip() for x in val.split(",") if x.strip()]
            else:
                visual[field] = val
    
    # If we have at least action, use parsed values with defaults for missing
    if "action" in visual:
        defaults = get_default_visual_storyboard(scene_type)
        for k, v in defaults.items():
            if k not in visual:
                visual[k] = v
        return visual
    
    # Otherwise generate from Visual Intent or content
    visual_match = re.search(r'-\s*\*\*Visual(?:\s+Intent)?\*\*:\s*([^\n]+)', section, re.I)
    v_desc = visual_match.group(1).strip() if visual_match else ""
    
    return generate_visual_storyboard(scene_type, v_desc, section)


def get_default_visual_storyboard(scene_type: str) -> dict:
    """Get default visual storyboard for a scene type."""
    defaults = {
        "hook": {
            "start": "Black screen with pulsing radar rings",
            "objects": ["Radar rings", "Central question mark"],
            "action": "Hook text slams in word-by-word with glow pulse",
            "camera": "Static centered framing",
            "motion_graphics": ["Tracked uppercase header tag", "Frequency waveform bars"],
            "end": "Hold on hook text, fade to next scene"
        },
        "outro": {
            "start": "Tight on smartphone with final checkmark",
            "objects": ["3D Smartphone", "Underground infrastructure city", "Subscribe badge"],
            "action": "Camera pulls back dramatically revealing full system",
            "camera": "Upward crane shot pulling back to epic wide",
            "motion_graphics": ["Mission accomplished tag", "Pulsing notification bell", "Brand emblem"],
            "end": "Fade to glowing brand emblem with particles"
        },
        "quote": {
            "start": "Dark backdrop with subtle grid",
            "objects": ["Large opening quote mark", "Quote text"],
            "action": "Quote fades in line by line, author appears below",
            "camera": "Static centered",
            "motion_graphics": ["Tracked header tag", "Quote mark animation"],
            "end": "Hold quote, dissolve to next"
        },
        "stat": {
            "start": "Clean dark frame with grid lines",
            "objects": ["Huge metric number", "Label below"],
            "action": "Number counts up with impact flash, label slides in",
            "camera": "Static centered",
            "motion_graphics": ["Tracked header tag", "Count-up animation", "Unit badge"],
            "end": "Hold stat, transition out"
        },
        "bullets": {
            "start": "Empty frame with header",
            "objects": ["Bullet list container"],
            "action": "Items slide in sequentially with pop sounds",
            "camera": "Static",
            "motion_graphics": ["Tracked header tag", "Staggered item reveals"],
            "end": "All items visible, hold briefly"
        },
        "callout": {
            "start": "Alert card materializing with glow",
            "objects": ["Frosted glass callout card", "Icon badge"],
            "action": "Card scales in with border glow, text types out",
            "camera": "Static centered",
            "motion_graphics": ["Tracked header tag", "Pulsing border", "Icon bounce"],
            "end": "Card holds, fade out"
        },
        "compare": {
            "start": "Split frame with two panels",
            "objects": ["Left panel", "Right panel", "Connector beam"],
            "action": "Panels build side by side, items appear in sync",
            "camera": "Static centered between panels",
            "motion_graphics": ["Tracked header tag", "Dual checkmarks", "Sync lines"],
            "end": "Both panels complete with sync confirmation"
        },
    }
    # For cinematic types, return a more detailed default
    if scene_type in {"three", "manim", "architecture", "code", "image", "video",
                      "gauge", "timeline", "bento", "benchmark", "hierarchy",
                      "data_structure", "inspector", "quadrant", "concentric",
                      "seat_booking"}:
        return {
            "start": f"Establishing {scene_type} scene in dark spatial environment",
            "objects": [f"3D {scene_type.replace('_', ' ').title()} Model"],
            "action": "Technical animation plays in sync with narration",
            "camera": "Motivated dolly/orbit tracking key elements",
            "motion_graphics": ["Tracked uppercase header tag", "Telemetry HUD", "State labels"],
            "end": "Smooth transition to next scene"
        }
    return defaults.get(scene_type, {
        "start": "Establishing shot in dark spatial environment",
        "objects": ["3D Technical Model"],
        "action": "Visual transformation on the beat",
        "camera": "Forward dolly with neon accent lighting",
        "motion_graphics": ["Tracked uppercase header"],
        "end": "Smooth transition to next scene"
    })


def generate_visual_storyboard(scene_type: str, v_desc: str, section: str) -> dict:
    """Generate a visual storyboard from description and scene type."""
    defaults = get_default_visual_storyboard(scene_type)
    if v_desc:
        # Enhance defaults with the provided description
        defaults["action"] = v_desc
        defaults["start"] = f"Setting up: {v_desc}"
        defaults["end"] = f"Completing: {v_desc}"
    return defaults


def parse_scene_properties(section: str, scene_type: str) -> dict:
    """Parse additional scene properties based on type."""
    props = {}
    
    # Parse common fields - match **Field**: at line start (with optional - prefix)
    title_match = re.search(r'(?:^|\n)-?\s*\*\*Title\*\*:\s*([^\n]+)', section, re.I)
    if title_match:
        props["title"] = title_match.group(1).strip()
    
    text_match = re.search(r'(?:^|\n)-?\s*\*\*Text\*\*:\s*([^\n]+)', section, re.I)
    if text_match:
        props["text"] = text_match.group(1).strip()
    
    # Parse type-specific fields
    if scene_type == "bullets":
        items = re.findall(r'(?:^|\n)-?\s*\*\*Item\*\*:\s*([^\n]+)', section, re.I)
        if items:
            props["items"] = [i.strip() for i in items]
    elif scene_type == "stat":
        value_match = re.search(r'(?:^|\n)-?\s*\*\*Value\*\*:\s*([^\n]+)', section, re.I)
        label_match = re.search(r'(?:^|\n)-?\s*\*\*Label\*\*:\s*([^\n]+)', section, re.I)
        if value_match:
            props["value"] = value_match.group(1).strip()
        if label_match:
            props["label"] = label_match.group(1).strip()
    elif scene_type == "compare":
        left_items = re.findall(r'(?:^|\n)-?\s*\*\*Left\s+Item\*\*:\s*([^\n]+)', section, re.I)
        right_items = re.findall(r'(?:^|\n)-?\s*\*\*Right\s+Item\*\*:\s*([^\n]+)', section, re.I)
        left_heading = re.search(r'(?:^|\n)-?\s*\*\*Left\s+Heading\*\*:\s*([^\n]+)', section, re.I)
        right_heading = re.search(r'(?:^|\n)-?\s*\*\*Right\s+Heading\*\*:\s*([^\n]+)', section, re.I)
        if left_items or right_items:
            props["left"] = {"heading": left_heading.group(1).strip() if left_heading else "Left", "items": [i.strip() for i in left_items]}
            props["right"] = {"heading": right_heading.group(1).strip() if right_heading else "Right", "items": [i.strip() for i in right_items]}
    elif scene_type == "three":
        variant_match = re.search(r'(?:^|\n)-?\s*\*\*Variant\*\*:\s*([^\n]+)', section, re.I)
        if variant_match:
            props["variant"] = variant_match.group(1).strip()
        model_match = re.search(r'(?:^|\n)-?\s*\*\*Model\*\*:\s*([^\n]+)', section, re.I)
        if model_match:
            props["model"] = model_match.group(1).strip()
    elif scene_type == "manim":
        manim_match = re.search(r'(?:^|\n)-?\s*\*\*Manim\*\*:\s*([\s\S]*?)(?=\n\*\*|\Z)', section, re.I)
        if manim_match:
            # Try to parse as JSON
            try:
                props["manim"] = json.loads(manim_match.group(1).strip())
            except:
                pass
    elif scene_type == "code":
        code_match = re.search(r'(?:^|\n)-?\s*\*\*Code\*\*:\s*([\s\S]*?)(?=\n\*\*|\Z)', section, re.I)
        lang_match = re.search(r'(?:^|\n)-?\s*\*\*Language\*\*:\s*([^\n]+)', section, re.I)
        if code_match:
            props["code"] = code_match.group(1).strip()
            props["lines"] = [l for l in code_match.group(1).strip().split('\n') if l.strip()]
        if lang_match:
            props["language"] = lang_match.group(1).strip()
    elif scene_type == "gauge":
        value_match = re.search(r'(?:^|\n)-?\s*\*\*Value\*\*:\s*([^\n]+)', section, re.I)
        endvalue_match = re.search(r'(?:^|\n)-?\s*\*\*EndValue\*\*:\s*([^\n]+)', section, re.I)
        unit_match = re.search(r'(?:^|\n)-?\s*\*\*Unit\*\*:\s*([^\n]+)', section, re.I)
        if value_match:
            props["value"] = value_match.group(1).strip()
        elif endvalue_match:
            props["endValue"] = endvalue_match.group(1).strip()
        if unit_match:
            props["unit"] = unit_match.group(1).strip()
    elif scene_type == "callout":
        category_match = re.search(r'(?:^|\n)-?\s*\*\*Category\*\*:\s*([^\n]+)', section, re.I)
        subtext_match = re.search(r'(?:^|\n)-?\s*\*\*Subtext\*\*:\s*([^\n]+)', section, re.I)
        if category_match:
            props["category"] = category_match.group(1).strip()
        if subtext_match:
            props["subtext"] = subtext_match.group(1).strip()
    elif scene_type == "architecture":
        nodes_match = re.search(r'(?:^|\n)-?\s*\*\*Nodes\*\*:\s*([\s\S]*?)(?=\n\*\*|\Z)', section, re.I)
        if nodes_match:
            try:
                props["nodes"] = json.loads(nodes_match.group(1).strip())
            except:
                # Try to parse as comma-separated or line-separated
                nodes_text = nodes_match.group(1).strip()
                # Remove brackets and quotes
                nodes_text = nodes_text.strip('[]')
                nodes = [n.strip().strip('"\'') for n in nodes_text.replace('\n', ',').split(',') if n.strip()]
                if nodes:
                    props["nodes"] = nodes
    
    return props


def parse_script_markdown(script_path: Path) -> list:
    content = script_path.read_text(encoding="utf-8")
    scenes = []
    
    # Find all scene headers and their content
    # Pattern matches: ## Scene N: Title or ## scene N: Title (with or without leading newline)
    scene_pattern = re.compile(r'(?:^|\n)##\s+(?:Scene|scene)\s*\d*[:\s]*([^\n]*)')
    matches = list(scene_pattern.finditer(content))
    
    if not matches:
        return scenes
    
    for idx, match in enumerate(matches):
        header_title = match.group(1).strip()
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(content)
        section = content[start:end]
        
        # Infer scene type
        type_info = infer_scene_type(section, idx, len(matches))
        scene_type = type_info["type"]
        
        # Base scene
        scene = {
            "type": scene_type,
            "tag": "",
            "tone": "[Curious]",
            "visual": {},
            "narration": ""
        }
        
        # Use header title as fallback tag/title
        if header_title and "title" not in scene:
            scene["title"] = header_title
        
        # Parse tag
        tag_match = re.search(r'-\s*\*\*Tag\*\*:\s*([^\n]+)', section, re.I)
        if tag_match:
            scene["tag"] = tag_match.group(1).strip()
            if "title" not in scene:
                scene["title"] = scene["tag"].split("/", 1)[-1].strip().title()
        
        # Parse tone
        tone_match = re.search(r'-\s*\*\*Tone\*\*:\s*([^\n]+)', section, re.I)
        if tone_match:
            scene["tone"] = tone_match.group(1).strip()
        
        # Parse narration - stop at next ** field or end
        # Match **Narration**: at line start (with optional - prefix)
        narr_match = re.search(r'(?:^|\n)-?\s*\*\*Narration\*\*:\s*\n?([\s\S]*?)(?=\n\*\*|\Z)', section, re.I)
        if narr_match:
            scene["narration"] = narr_match.group(1).strip()
        else:
            # Fallback: lines that don't start with ** or #
            lines = [l for l in section.splitlines() if not l.strip().startswith("**") and not l.strip().startswith("#")]
            scene["narration"] = " ".join(lines).strip()
        
        # Parse visual storyboard
        scene["visual"] = parse_visual_storyboard(section, scene_type)
        
        # Parse type-specific properties
        scene_props = parse_scene_properties(section, scene_type)
        scene.update(scene_props)
        
        scenes.append(scene)
        
    return scenes


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("episode_dir", type=Path, help="Path to episode folder (e.g. episodes/008-rate-limiter)")
    parser.add_argument("--force", action="store_true", help="Overwrite existing storyboard.json")
    args = parser.parse_args()

    ep_dir = args.episode_dir.expanduser().resolve()
    if not ep_dir.is_dir():
        sys.exit(f"Episode directory not found: {ep_dir}")

    brief = parse_brief(ep_dir / "brief.yaml")
    script_file = ep_dir / "script.md"
    if not script_file.exists():
        sys.exit(f"script.md not found in {ep_dir}")

    scenes = parse_script_markdown(script_file)
    if not scenes:
        sys.exit(f"No scenes could be parsed from {script_file}")

    # Set appropriate scene types for start and end
    if scenes:
        scenes[0]["type"] = "hook"
        scenes[0]["text"] = scenes[0].get("title", "The Spike")
        if len(scenes) > 1:
            scenes[-1]["type"] = "outro"
            scenes[-1]["text"] = brief.get("cta", "Follow for more breakdowns")

    episode_id = brief.get("id", ep_dir.name)
    storyboard = {
        "$schema": "../../schema/storyboard.schema.json",
        "id": episode_id,
        "format": brief.get("format", "vertical"),
        "accent": brief.get("accent", "#00F0FF"),
        "audio_mode": "scenes",
        "captions": True,
        "progress": True,
        "sfx": True,
        "music": None,
        "music_volume": 0.08,
        "meta": {
            "title": brief.get("topic", episode_id),
            "description": f"How {brief.get('topic', episode_id)} works under the hood.",
            "hashtags": ["systemdesign", "techshorts", "coding", "architecture"],
            "analogy": brief.get("analogy", ""),
            "misconceptions": brief.get("misconceptions", [])
        },
        "scenes": scenes
    }

    out_file = ep_dir / "storyboard.json"
    if out_file.exists() and not args.force:
        print(f"⚠️ {out_file} already exists. Use --force to overwrite.")
        return 0

    out_file.write_text(json.dumps(storyboard, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"✅ Generated storyboard manifest: {out_file} ({len(scenes)} scenes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
