#!/usr/bin/env python3
"""
Checks a video script JSON against the pipeline's rules.

  python validate.py episodes/<id>/storyboard.json
  python validate.py episodes/*/storyboard.json

Errors   -> the pipeline would fail or render wrong. Exit code 1.
Warnings -> style problems (too long, too many items...). Exit code 0.
"""
import glob
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent

MAX_SECONDS = 180          # hard production limit: 3 minutes
SHORTS_SECONDS = MAX_SECONDS
WORDS_PER_SECOND = 2.5     # rough speaking speed used for the estimate

TOP_ALLOWED = {"$schema", "id", "format", "audio_mode", "accent", "theme", "art_direction", "music", "music_volume", "music_ducking", "captions", "progress", "sfx", "loop", "meta", "journey", "pad_seconds", "scenes"}
COMMON_SCENE_FIELDS = {
    "sfx", "sfxVolume", "icon", "graphic", "visual", "motion",
    "purpose", "transition", "camera", "action", "objects", "tag", "tone",
    "beats", "journeyStep", "search_image", "generate_image", "search_video",
    "search_sfx", "search_model", "search_icon", "icon_path", "image_provider", "video_provider",
    "variant", "sortTriggerFrame", "particles", "particleCount", "particleColor", "audio",
    "emphasis_words", "pattern_interrupt", "hook_strength", "payoff_type"
}
ALLOWED = {
    "hook": {"type", "text", "title", "image", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "bullets": {"type", "title", "items", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "stat": {"type", "value", "label", "title", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "manim": {"type", "title", "manim", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "video": {"type", "video", "title", "overlay", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "diagram": {"type", "title", "diagram", "mermaid", "graphviz", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "outro": {"type", "text", "title", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "image": {"type", "image", "title", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "quote": {"type", "text", "author", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "compare": {"type", "title", "left", "right", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "three": {"type", "title", "variant", "component", "equation", "metrics", "model", "modelScale", "modelRotation", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "code": {"type", "title", "code", "lines", "language", "filename", "highlight", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "architecture": {"type", "title", "nodes", "steps", "subtext", "tag", "direction", "activeNode", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "gauge": {"type", "title", "value", "startValue", "endValue", "unit", "min", "max", "status", "label", "badge", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "timeline": {"type", "title", "steps", "items", "activeStep", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "callout": {"type", "title", "text", "subtext", "category", "badge", "variant", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "bento": {"type", "title", "bentoItems", "items", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "benchmark": {"type", "title", "runners", "unit", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "hierarchy": {"type", "title", "layers", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "data_structure": {"type", "title", "structure", "operations", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "inspector": {"type", "title", "sections", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "quadrant": {"type", "title", "xAxis", "yAxis", "points", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "concentric": {"type", "title", "rings", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "seat_booking": {"type", "title", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "neural_network_graph": {"type", "title", "equation", "mode", "variant", "metrics", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "interview": {"type", "title", "text", "interview", "author", "subtext", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "terminal": {"type", "title", "tag", "terminalSteps", "prompt", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "screenshot": {"type", "title", "tag", "image", "screenshotSteps", "backgroundSize", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "chart": {"type", "title", "tag", "chartType", "chartData", "chartTitle", "unit", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "product": {"type", "title", "image", "tag", "specs", "highlight", "price", "tagline", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "sorting_visualizer": {"type", "title", "tag", "mode", "array", "equation", "metrics", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "amazon_shopping": {"type", "title", "tag", "text", "image", "products", "sortTriggerFrame", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "whiteboard": {"type", "title", "tag", "whiteboardType", "whiteboardTheme", "brushName", "paper", "strokes", "whiteboardData", "equation", "nodes", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "refrigerator": {"type", "title", "tag", "variant", "image", "video", "metrics", "specs", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "air_conditioner": {"type", "title", "tag", "variant", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "linear_search_visualizer": {"type", "title", "tag", "variant", "searchItems", "searchTarget", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "binary_search_visualizer": {"type", "title", "tag", "variant", "searchItems", "searchTarget", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "tesla_roadster_visualizer": {"type", "title", "tag", "variant", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "pacman_enzyme_visualizer": {"type", "title", "tag", "variant", "metrics", "specs", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "quick_commerce": {"type", "title", "tag", "variant", "countdownSeconds", "metrics", "specs", "speedKmh", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "depth_parallax": {"type", "title", "tag", "image", "depthMap", "intensity", "movement", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "google_maps_visualizer": {"type", "title", "tag", "variant", "metrics", "specs", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "google_maps": {"type", "title", "tag", "variant", "metrics", "specs", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "aadhaar_visualizer": {"type", "title", "tag", "variant", "metrics", "specs", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "aadhaar": {"type", "title", "tag", "variant", "metrics", "specs", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "tower_of_hanoi": {"type", "title", "tag", "variant", "metrics", "specs", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "tower_of_hanoi_visualizer": {"type", "title", "tag", "variant", "metrics", "specs", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "emudhra": {"type", "title", "tag", "variant", "metrics", "specs", "narration", "seconds", "image"} | COMMON_SCENE_FIELDS,
    "emudhra_visualizer": {"type", "title", "tag", "variant", "metrics", "specs", "narration", "seconds", "image"} | COMMON_SCENE_FIELDS,
}
IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".svg")
VIDEO_EXTS = (".mp4", ".mov", ".webm")
BUILTIN = {
    "Equations": {"template", "lines", "file"},
    "Graph": {"template", "fn", "x_range", "y_range", "file"},
    "Flow": {"template", "items", "file"},
}
CONTROL_HINTS = {
    "\x0c": "\\f (from a single backslash in \\frac)",
    "\t": "a tab (from a single backslash in \\times, \\theta, \\to ...)",
    "\x08": "\\b (from a single backslash in \\beta, \\binom ...)",
    "\n": "a line break (from a single backslash in \\neq, \\nu ...)",
    "\r": "\\r (from a single backslash in \\rho, \\right ...)",
}

def hex_contrast_ratio(fg_hex: str, bg_hex: str) -> float:
    """Calculates WCAG 2.1 relative luminance contrast ratio between two hex colors."""
    def lin(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    try:
        fg = fg_hex.lstrip("#")
        bg = bg_hex.lstrip("#")
        r1, g1, b1 = int(fg[0:2], 16), int(fg[2:4], 16), int(fg[4:6], 16)
        r2, g2, b2 = int(bg[0:2], 16), int(bg[2:4], 16), int(bg[4:6], 16)
        l1 = 0.2126 * lin(r1) + 0.7152 * lin(g1) + 0.0722 * lin(b1)
        l2 = 0.2126 * lin(r2) + 0.7152 * lin(g2) + 0.0722 * lin(b2)
        lighter, darker = max(l1, l2), min(l1, l2)
        return (lighter + 0.05) / (darker + 0.05)
    except Exception:
        return 7.0

# ---------------------------------------------------------------------------
# Physical-Real Scenario Mandate: every "three" scene MUST map to a concrete
# 3D WebGL component. Unknown variants silently fall back to the abstract
# `gradient_descent` math grid, which is exactly the failure mode this
# validator exists to catch. See AGENTS.md "Physical-Real Scenario Mandate".
# ---------------------------------------------------------------------------
REGISTERED_3D_VARIANTS = {
    # ATM / Payments
    "atm_machine_3d", "atm_hook_3d", "atm_3d", "cash_dispenser_3d", "atm_kiosk_3d",
    "upi_hook_3d", "hook_3d", "qr_scan_3d", "smartphone_qr_3d",
    "concentric_security_3d", "zero_knowledge_pin_3d", "pin_security_3d",
    "concentric_3d", "security_rings_3d",
    "upi_tunnel_3d", "digital_tunnel_3d", "cyber_tunnel", "highway_3d",
    "highway", "traffic_3d", "tunnel_3d",
    "upi_city_3d", "city_network_3d", "participants_3d", "city_3d",
    "upi_qr_3d", "qr_inspection_3d", "qr_matrix_3d", "qr_3d", "qrcode_3d",
    "upi_phone_layers_3d", "phone_layers_3d", "sandbox_3d", "phone_3d",
    "smartphone_3d", "mobile_3d", "google_maps_3d", "google_maps", "maps_navigation_3d", "navigation_3d",
    "upi_bank_vault_3d", "bank_vault_3d", "upi_bank_vault_credit_3d",
    "cbs_ledger_3d", "bank_3d", "vault_3d",
    "neural_network_3d", "neural_network", "backprop_3d", "brain_3d", "ai_3d",
    "globe_network_3d", "globe_network", "distributed_mesh", "network_3d",
    "internet_3d", "cloud_3d",
    "gps_trilateration_3d", "trilateration_3d", "gps_constellation_3d", "satellite_orbit_3d",
    "bluetooth_link_3d", "bluetooth_radio_3d", "bluetooth_discovery_3d",
    "bluetooth_pairing_3d", "bluetooth_layers_3d", "bluetooth_digital_data_3d",
    "bluetooth_spectrum_3d", "frequency_hopping_3d", "bluetooth_audio_path_3d",
    "packet_to_sound_3d", "bluetooth_interference_3d", "bluetooth_local_p2p_3d",
    "bluetooth_ecosystem_3d", "bluetooth_pipeline_3d", "bluetooth_reveal_3d",
    "bluetooth_master_recap_3d", "bluetooth_3d",
    "server_rack_3d", "server_rack", "datacenter_3d", "npci_datacenter",
    "server_3d", "servers_3d", "fastag_server_3d",
    "upi_settlement_3d", "settlement_3d", "dual_ledger_3d",
    "bilateral_settlement_3d",
    "upi_gauge_3d", "telemetry_gauge_3d", "gauge_3d", "speedometer_3d",
    "upi_architecture_3d", "architecture_3d", "pipeline_3d",
    "upi_alert_3d", "alert_3d", "callout_3d", "reconciliation_3d", "payment_reconciliation_alert",
    "upi_outro_3d", "outro_3d", "digital_india_3d",
    "database_cluster_3d", "database_rows_3d", "datastore_3d",
    "database_3d", "db_cluster_3d",
    "overflow_stack_3d", "connection_pool_3d", "connection_stack_3d",
    "buffer_overflow_3d", "stack_overflow_3d",
    "route_segments_3d", "track_segments_3d", "bitmask_route_3d",
    "railway_route_3d",
    # Gradient descent sub-variants (math topics only)
    "batch_gd", "stochastic_gd", "mini_batch", "comparison_3d",
    # Generic physical primitives (see ThreeDGenericPhysical.tsx)
    "conveyor_3d", "factory_conveyor_3d", "pipeline_3d_physical",
    "container_dock_3d", "shipping_dock_3d", "docker_dock_3d",
    # Washing Machine / Centrifugal / Molecular physics
    "washing_machine_3d", "washer_3d", "washing_machine", "washer_drum_3d",
    "centrifugal_spin_3d", "drum_spin_3d", "surfactant_micelle_3d", "micelle_3d",
    # Quick Commerce / Dark Store micro-fulfillment
    "dark_store_3d", "dark_store_warehouse_3d", "quick_commerce_store_3d", "mfc_warehouse_3d",
    "gradient_descent", "crest_to_trough",
    # Binary Search 3D
    "binary_search_3d", "binary_search", "step_by_step_3d",
    # FASTag / RFID Toll Collection 3D
    "fastag_toll_3d", "fastag_toll", "fastag_3d", "rfid_toll_3d", "toll_gantry_3d",
    "fastag_sticker_3d", "fastag_chip_3d", "fastag_barrier_3d", "boom_barrier_3d",
    # Dedicated GLTF/GLB 3D model variants
    "model_3d", "gltf_model", "model_viewer_3d", "custom_model_3d",
}

# Topics where the default `gradient_descent` math grid IS the correct
# physical representation (math / optimization visuals only).
MATH_TOPIC_HINTS = ("gradient", "loss", "descent", "optimization", "math",
                    "equation", "calculus", "derivative", "function")


class Report:
    def __init__(self):
        self.errors, self.warnings = [], []

    def err(self, where, msg):
        self.errors.append((where, msg))

    def warn(self, where, msg):
        self.warnings.append((where, msg))


def words(s):
    return len(str(s).split())


def is_num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def walk(o, path=""):
    if isinstance(o, str):
        yield path, o
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from walk(v, f"{path}[{i}]")
    elif isinstance(o, dict):
        for k, v in o.items():
            yield from walk(v, f"{path}.{k}" if path else k)


def check_range(r, name, where, rep):
    if (not isinstance(r, list) or len(r) != 3
            or not all(is_num(v) for v in r)):
        rep.err(where, f'"{name}" must be 3 numbers like [-3, 3, 1] (min, max, step)')
    elif r[0] >= r[1] or r[2] <= 0:
        rep.err(where, f'"{name}" needs min < max and step > 0, got {r}')


def check_manim(m, where, rep):
    if not isinstance(m, dict):
        rep.err(where, '"manim" must be an object like {"template": "Flow", "items": [...]}')
        return
    tpl = m.get("template")
    if not isinstance(tpl, str):
        rep.err(where, 'manim needs a "template" name (Equations, Graph, Flow or your own class)')
        return

    if tpl in BUILTIN:
        extra = set(m) - BUILTIN[tpl]
        if extra:
            rep.warn(where, f"unknown {tpl} fields ignored: {sorted(extra)}")
        if tpl == "Equations":
            lines = m.get("lines")
            if not isinstance(lines, list) or not lines or not all(isinstance(x, str) and x.strip() for x in lines):
                rep.err(where, 'Equations needs "lines": a non-empty list of LaTeX strings')
            else:
                if len(lines) > 3:
                    rep.warn(where, f"{len(lines)} equation lines; 3 or fewer reads better")
                for i, ln in enumerate(lines, 1):
                    if ln.count("{") != ln.count("}"):
                        rep.err(where, f'equation line {i} has unbalanced braces: "{ln}"')
                    if len(ln) > 60:
                        rep.warn(where, f"equation line {i} is long and will be shrunk to fit")
        elif tpl == "Graph":
            fn = m.get("fn")
            if not isinstance(fn, str) or not fn.strip():
                rep.err(where, 'Graph needs "fn": an expression in x, e.g. "np.sin(x)"')
            else:
                try:
                    code = compile(fn, "<fn>", "eval")
                    try:
                        import math
                        import numpy as np
                        eval(code, {"__builtins__": {}}, {"np": np, "math": math, "x": 1.0})
                    except ImportError:
                        pass  # numpy not installed here; syntax check only
                except SyntaxError:
                    rep.err(where, f'Graph "fn" is not valid Python: {fn}')
                except Exception as e:
                    rep.err(where, f'Graph "fn" fails when x=1.0 ({type(e).__name__}: {e}). Use np.sin(x), x**2, np.exp(x) ...')
            if "x_range" in m:
                check_range(m["x_range"], "x_range", where, rep)
            if "y_range" in m:
                check_range(m["y_range"], "y_range", where, rep)
        elif tpl == "Flow":
            items = m.get("items")
            if not isinstance(items, list) or len(items) < 2 or not all(isinstance(x, str) and x.strip() for x in items):
                rep.err(where, 'Flow needs "items": a list of at least 2 short labels')
            else:
                if len(items) > 5:
                    rep.warn(where, f"{len(items)} flow items; 5 or fewer fits the screen")
                for it in items:
                    if words(it) > 3:
                        rep.warn(where, f'flow label "{it}" is over 3 words')
    else:
        f = m.get("file")
        if not f:
            rep.err(where, f'unknown template "{tpl}". Use Equations, Graph, Flow, '
                           f'or add "file" pointing to your own scene file')
        else:
            p = ROOT / f
            if not p.exists():
                rep.err(where, f'custom scene file not found: {f}')
            elif not re.search(rf"^class\s+{re.escape(tpl)}\b", p.read_text(encoding="utf-8"), re.M):
                rep.err(where, f'class "{tpl}" not found in {f}')
            else:
                try:
                    from tools.code_safety import scan_file_safety
                    is_safe, violations = scan_file_safety(p)
                    if not is_safe:
                        for viol in violations:
                            rep.err(where, f"custom scene code safety violation: {viol}")
                except Exception:
                    pass


def validate_data(data, root=ROOT):
    rep = Report()
    if not isinstance(data, dict):
        rep.err("file", "top level must be a JSON object { ... }")
        return rep

    # hidden control characters (almost always unescaped LaTeX backslashes)
    for path, s in walk(data):
        for ch, hint in CONTROL_HINTS.items():
            if ch in s:
                if path.endswith("narration"):
                    rep.warn(path, "narration contains a line break")
                else:
                    rep.err(path, f"contains {hint}. In JSON write every LaTeX backslash twice (\\\\frac).")
        if s.startswith("out/") or "/out/" in s:
            rep.err(path, f"Forbidden reference to root 'out/' directory: '{s}'. All episode assets and renders must be in 'episodes/<id>/'.")
        if (s.startswith("public/") or "/public/" in s) and not any(s.startswith(f"public/{p}") or f"/public/{p}" in s for p in ("sfx", "music", "models")):
            rep.warn(path, f"Direct reference to temporary 'public/' staging in '{s}'. Source assets must be stored in 'episodes/<id>/media/' (or 'audio/').")

    extra = set(data) - TOP_ALLOWED
    if extra:
        rep.warn("top level", f"unknown fields ignored: {sorted(extra)}")

    vid = data.get("id")
    if not isinstance(vid, str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]*", vid):
        rep.err("id", 'required: lowercase letters, digits and dashes only, e.g. "how-vaccines-work"')

    fmt = data.get("format", "vertical")
    if fmt not in ("vertical", "landscape"):
        rep.err("format", f'must be "vertical" (reel size, default) or "landscape" (16:9), got {fmt!r}')

    art_direction = data.get("art_direction", "editorial")
    if art_direction not in ("editorial", "cinematic"):
        rep.err("art_direction", f'must be "editorial" (default) or "cinematic", got {art_direction!r}')

    mode = data.get("audio_mode", "single")
    if mode not in ("single", "scenes"):
        rep.err("audio_mode", f'must be "single" (one narration file, default) or "scenes" (one file per scene), got {mode!r}')

    acc = data.get("accent", "#FFC857")
    if not isinstance(acc, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", acc):
        rep.err("accent", f'must be a hex color like "#FFC857", got {acc!r}')

    thm = data.get("theme")
    valid_themes = {"cyberpunk", "slate", "amber", "emerald", "whiteboard"}
    if thm is not None:
        if not isinstance(thm, str) or thm.lower() not in valid_themes:
            rep.warn("theme", f'unknown theme "{thm}". Curated themes are: {sorted(valid_themes)}')

    # WCAG 2.1 Contrast Ratio Check on accent color against background
    if isinstance(acc, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", acc):
        bg_hex = "#F8FAFC" if (thm and thm.lower() == "whiteboard") else "#0B1020"
        ratio = hex_contrast_ratio(acc, bg_hex)
        if ratio < 3.0:
            rep.warn("accent", f'accent color "{acc}" has low contrast ratio ({ratio:.1f}:1) against {bg_hex}; aim for >= 3.0:1 for mobile legibility')

    music = data.get("music")
    if music is not None:
        if music != "none" and (not isinstance(music, str) or not (root / music).exists()):
            rep.err("music", f'file not found: {music!r} (use null for default Warm Focus, or "none" to disable)')

    meta = data.get("meta")
    if meta is not None:
        if not isinstance(meta, dict):
            rep.err("meta", 'must be an object like {"title": "...", "description": "...", "hashtags": [...]}')
        else:
            allowed_meta = {
                "title", "description", "hashtags", "facts_to_verify", "misconceptions", "analogy",
                "trending_visual_style", "recommended_libraries", "empirical_benchmarks"
            }
            extra = set(meta) - allowed_meta
            if extra:
                rep.warn("meta", f"unknown fields ignored: {sorted(extra)}")
            for k in ("title", "description", "analogy"):
                if k in meta and not isinstance(meta[k], str):
                    rep.err("meta", f'"{k}" must be text')
            for k in ("hashtags", "facts_to_verify", "misconceptions"):
                if k in meta and not (isinstance(meta[k], list) and all(isinstance(x, str) for x in meta[k])):
                    rep.err("meta", f'"{k}" must be a list of text items')
            if isinstance(meta.get("title"), str) and len(meta["title"]) > 100:
                rep.warn("meta", "title is over 100 characters (YouTube's limit)")

    journey = data.get("journey")
    if journey is not None:
        if (not isinstance(journey, list) or not 2 <= len(journey) <= 5
                or not all(isinstance(x, str) and x.strip() for x in journey)):
            rep.err("journey", 'must be 2 to 5 non-empty stage labels, e.g. ["SEARCH", "BOOK NOW", "PAYMENT"]')
            journey = None
        else:
            for label in journey:
                if words(label) > 3:
                    rep.warn("journey", f'stage label "{label}" is over 3 words; shorten it for the persistent rail')

    scenes = data.get("scenes")
    if not isinstance(scenes, list) or not scenes:
        rep.err("scenes", 'required: a non-empty list of scenes')
        return rep

    if not 4 <= len(scenes) <= 24:
        rep.warn("scenes", f"{len(scenes)} scenes; 4 to 24 works best (about one scene per 15-20 seconds)")

    est = 0.0
    for n, s in enumerate(scenes, 1):
        where = f"scene {n}"
        if not isinstance(s, dict):
            rep.err(where, "must be an object")
            continue
        t = s.get("type")
        if t not in ALLOWED:
            rep.err(where, f'type must be one of {sorted(ALLOWED)}, got {t!r}')
            continue
        where = f"scene {n} ({t})"
        extra = set(s) - ALLOWED[t]
        if extra:
            rep.warn(where, f"unknown fields ignored: {sorted(extra)}")

        # narration / duration
        nar = s.get("narration")
        if (nar is None or (isinstance(nar, str) and not nar.strip())) and mode == "single":
            rep.err(where, 'no narration. With one narration file (audio_mode "single") every scene needs '
                           'narration text; use "audio_mode": "scenes" if you need silent scenes')
        elif nar is None or (isinstance(nar, str) and not nar.strip()):
            sec = s.get("seconds")
            if sec is None:
                rep.warn(where, 'no narration and no "seconds"; will be 3 seconds of silence')
                est += 3
            elif not is_num(sec) or sec <= 0:
                rep.err(where, '"seconds" must be a positive number')
            else:
                est += sec
        elif not isinstance(nar, str):
            rep.err(where, '"narration" must be text')
        else:
            wc = words(nar)
            if s.get("seconds") is not None and is_num(s["seconds"]) and s["seconds"] > 0:
                est += s["seconds"]
            else:
                est += wc / WORDS_PER_SECOND + 0.45
            if wc < 8 and t not in ("hook", "outro"):
                rep.warn(where, f"narration is only {wc} word(s) (aim for 15-40)")
            elif wc > 45:
                rep.warn(where, f"narration is {wc} words (aim for 15-45; long scenes drag, split it)")
            if re.search(r"\d", nar):
                rep.warn(where, "narration contains digits; write numbers as spoken "
                                '("nineteen eighty four", "ten percent") unless your TTS reads digits correctly')
            if re.search(r"\b[A-Z]{2,}\b", nar):
                rep.warn(where, "narration contains ALL-CAPS abbreviations; your TTS may mispronounce them "
                                '(write "D N A" for letters, or the spoken form)')
            if re.search(r"[*#`\[\]{}|~]|https?://", nar):
                rep.warn(where, "narration has markup/URL characters; use plain spoken text only")
            if re.search(r"[=+%<>()/*^_$\\#@]", nar):
                rep.warn(where, "narration has symbols; write it the way it is spoken "
                                '(e.g. "plus", "percent", "squared") so your TTS reads it right')

        # Visual storyboards are required for most scene types, but structure varies.
        # Scenes that are primarily text/UI (hook, outro, interview, quote, callout, stat, bullets)
        # can have minimal visual storyboards; diagram/3D scenes need full cinematic storyboards.
        vis = s.get("visual")
        if not isinstance(vis, dict):
            rep.err(where, '"visual" must be a structured storyboard object')
        else:
            # Core fields that all scenes should have at minimum
            core_fields = {
                "start": str,
                "action": str,
                "end": str,
            }
            # Extended fields for cinematic/diagram scenes (three, manim, architecture, code, etc.)
            cinematic_types = {"three", "manim", "architecture", "code", "image", "video",
                               "compare", "gauge", "timeline", "bento", "benchmark",
                               "hierarchy", "data_structure", "inspector", "quadrant",
                               "concentric", "seat_booking", "neural_network_graph", "sorting_visualizer", "refrigerator", "air_conditioner", "linear_search_visualizer", "tesla_roadster_visualizer", "depth_parallax", "aadhaar", "aadhaar_visualizer"}
            is_cinematic = t in cinematic_types
            if is_cinematic:
                required_visual_fields = {
                    **core_fields,
                    "objects": list,
                    "camera": str,
                    "motion_graphics": list,
                }
            else:
                required_visual_fields = core_fields
            for field, expected_type in required_visual_fields.items():
                value = vis.get(field)
                if not isinstance(value, expected_type) or (
                    isinstance(value, str) and not value.strip()
                ):
                    rep.err(where, f'"visual.{field}" must be a non-empty {expected_type.__name__}')
                elif expected_type is list and (
                    (field in ("objects", "motion_graphics") and not value)
                    or not all(isinstance(item, str) and item.strip() for item in value)
                ):
                    rep.err(where, f'"visual.{field}" must contain non-empty strings')
            recognized_storyboard = {
                "camera", "objects", "action", "motion_graphics",
                "start", "end", "environment", "purpose", "transition",
                "lighting", "mood", "lens", "style"
            }
            for k in vis.keys():
                if k not in recognized_storyboard:
                    rep.warn(where, f'unrecognized storyboard property in "visual": "{k}"')

        # optional high-fidelity storyboard properties
        if "purpose" in s and not isinstance(s["purpose"], str):
            rep.err(where, '"purpose" must be a descriptive text string')
        if "transition" in s and not isinstance(s["transition"], str):
            rep.err(where, '"transition" must be a text string (e.g. "zoom_through", "match_cut", "whip_pan")')
        if "journeyStep" in s:
            step = s["journeyStep"]
            if not isinstance(step, int) or isinstance(step, bool) or step < 0:
                rep.err(where, '"journeyStep" must be a zero-based non-negative integer')
            elif journey is not None and step >= len(journey):
                rep.err(where, f'"journeyStep" must be less than the {len(journey)} journey stages')
        elif journey is not None:
            rep.err(where, '"journeyStep" is required when a top-level "journey" is defined')

        beats = s.get("beats")
        if beats is not None:
            if not isinstance(beats, list) or not beats:
                rep.err(where, '"beats" must be a non-empty list of timed visual beat objects')
            else:
                previous_at = -1
                for beat_index, beat in enumerate(beats, 1):
                    beat_where = f"{where} beat {beat_index}"
                    if not isinstance(beat, dict):
                        rep.err(beat_where, 'must be an object with "at", "label", and "action"')
                        continue
                    extra_beat_fields = set(beat) - {"at", "label", "action", "state", "visualState", "focus", "journeyStep"}
                    if extra_beat_fields:
                        rep.warn(beat_where, f"unknown beat fields ignored: {sorted(extra_beat_fields)}")
                    at = beat.get("at")
                    if not is_num(at) or not 0 <= at <= 1:
                        rep.err(beat_where, '"at" must be normalized scene progress from 0 to 1')
                    elif at <= previous_at:
                        rep.err(beat_where, '"at" values must be strictly increasing')
                    else:
                        previous_at = at
                    for field in ("label", "action"):
                        if not isinstance(beat.get(field), str) or not beat[field].strip():
                            rep.err(beat_where, f'"{field}" must be non-empty text')
                    for field in ("state", "visualState", "focus"):
                        if field in beat and (not isinstance(beat[field], str) or not beat[field].strip()):
                            rep.err(beat_where, f'"{field}" must be non-empty text when provided')
                    if "journeyStep" in beat:
                        beat_step = beat["journeyStep"]
                        if not isinstance(beat_step, int) or isinstance(beat_step, bool) or beat_step < 0:
                            rep.err(beat_where, '"journeyStep" must be a zero-based non-negative integer')
                        elif journey is not None and beat_step >= len(journey):
                            rep.err(beat_where, f'"journeyStep" must be less than the {len(journey)} journey stages')
                if isinstance(beats, list) and beats and isinstance(beats[0], dict):
                    if is_num(beats[0].get("at")) and beats[0]["at"] != 0:
                        rep.warn(where, 'the first visual beat should start at "at": 0')

        # type-specific
        if t in ("hook", "outro"):
            txt = s.get("text")
            if t == "hook" and not (isinstance(txt, str) and txt.strip()):
                rep.err(where, 'hook needs "text" (the big line on screen)')
            elif isinstance(txt, str) and words(txt) > 8:
                rep.warn(where, f'"text" is {words(txt)} words; keep it to 8 or fewer')
        elif t == "bullets":
            items = s.get("items")
            def item_str(x):
                if isinstance(x, str): return x.strip()
                if isinstance(x, dict) and isinstance(x.get("text"), str): return x["text"].strip()
                return ""
            if not isinstance(items, list) or not items or not all(bool(item_str(x)) for x in items):
                rep.err(where, 'bullets needs "items": a non-empty list of short strings or {"text": "...", "icon": "..."} objects')
            else:
                if len(items) > 4:
                    rep.warn(where, f"{len(items)} items; 4 or fewer fits the screen")
                for it in items:
                    txt = it if isinstance(it, str) else it.get("text", "")
                    if words(txt) > 4:
                        rep.warn(where, f'item "{txt}" is over 4 words')
            if isinstance(s.get("title"), str) and words(s["title"]) > 4:
                rep.warn(where, "title is over 4 words")
        elif t == "stat":
            for k in ("value", "label"):
                if not isinstance(s.get(k), str) or not s[k].strip():
                    rep.err(where, f'stat needs "{k}" as text (e.g. "value": "2,500+")')
            if isinstance(s.get("value"), str) and len(s["value"]) > 8:
                rep.warn(where, "value is long; big stats work best at 8 characters or fewer")
        elif t == "image":
            img = s.get("image")
            s_img = s.get("search_image")
            g_img = s.get("generate_image")
            if not img and not s_img and not g_img:
                rep.err(where, 'image needs "image": a picture path, "search_image": query, or "generate_image": prompt')
            elif img:
                exists = (root / img).exists() or (ROOT / img).exists() or (ROOT / "public" / img).exists()
                if not exists:
                    if s_img or g_img:
                        rep.warn(where, f'image not found locally; will auto-fetch or generate via {s_img or g_img}')
                    else:
                        rep.err(where, f"image file not found: {img}")
                elif Path(img).suffix.lower() not in IMAGE_EXTS:
                    rep.err(where, f"image must be one of {', '.join(IMAGE_EXTS)}")
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "caption (title) is over 8 words")
        elif t == "diagram":
            diag = s.get("diagram")
            mmd = s.get("mermaid")
            dot = s.get("graphviz")
            if not diag and not mmd and not dot and not s.get("image"):
                rep.err(where, 'diagram needs "diagram": path, or "mermaid": string, or "graphviz": string')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "caption (title) is over 8 words")
        elif t == "video":
            clip = s.get("video")
            s_vid = s.get("search_video")
            if not clip and not s_vid:
                rep.err(where, 'video needs "video": a video path, or "search_video": an internet B-roll query')
            elif clip:
                exists = (root / clip).exists() or (ROOT / clip).exists() or (ROOT / "public" / clip).exists()
                if not exists:
                    if s_vid:
                        rep.warn(where, f'video clip not found locally; will auto-fetch via search_video "{s_vid}"')
                    else:
                        rep.err(where, f"video file not found: {clip}")
                elif Path(clip).suffix.lower() not in VIDEO_EXTS:
                    rep.err(where, f"video must be one of {', '.join(VIDEO_EXTS)}")
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "caption (title) is over 8 words")
        elif t == "quote":
            txt = s.get("text")
            if not isinstance(txt, str) or not txt.strip():
                rep.err(where, 'quote needs "text"')
            elif words(txt) > 25:
                rep.warn(where, f"quote is {words(txt)} words; 25 or fewer fits the screen")
            if "author" in s and not isinstance(s["author"], str):
                rep.err(where, '"author" must be text')
        elif t == "compare":
            for side in ("left", "right"):
                d = s.get(side)
                if not isinstance(d, dict) or not isinstance(d.get("heading"), str):
                    rep.err(where, f'compare needs "{side}": {{"heading": "...", "items": ["...", "..."]}}')
                    continue
                its = d.get("items")
                if not isinstance(its, list) or not its or not all(isinstance(x, str) and x.strip() for x in its):
                    rep.err(where, f'compare "{side}" needs "items": a non-empty list of short strings')
                else:
                    if len(its) > 3:
                        rep.warn(where, f'compare "{side}" has {len(its)} items; 3 or fewer fits the screen')
                    for it in its:
                        if words(it) > 5:
                            rep.warn(where, f'compare item "{it}" is over 5 words')
                if words(d["heading"]) > 3:
                    rep.warn(where, f'compare "{side}" heading is over 3 words')
            if isinstance(s.get("title"), str) and words(s["title"]) > 5:
                rep.warn(where, "title is over 5 words")
        elif t == "three":
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
            # ---- Physical-Real Scenario Mandate: reject unmapped / default variants
            variant = s.get("variant")
            if not isinstance(variant, str) or not variant.strip():
                rep.err(where, 'three scene needs a "variant" that maps to a real 3D '
                               'physical object (e.g. "server_rack_3d", "database_cluster_3d")')
            elif variant not in REGISTERED_3D_VARIANTS:
                rep.err(where, f'unregistered 3D variant "{variant}" — it would silently fall '
                               f'back to the abstract gradient_descent math grid. Either use an '
                               f'existing registered variant or add the alias + component to '
                               f'ThreeScene.tsx (see AGENTS.md Physical-Real Scenario Mandate)')
            elif variant in ("gradient_descent", "crest_to_trough"):
                topic = (data.get("id") or "").lower()
                if not any(h in topic for h in MATH_TOPIC_HINTS):
                    rep.err(where, f'variant "gradient_descent" is the abstract math default and is '
                                   f'only valid for math/optimization topics. For "{topic}" map to a '
                                   f'real physical 3D object variant instead')
        elif t == "manim":
            if "manim" not in s:
                rep.err(where, 'manim scene needs a "manim" object')
            else:
                check_manim(s["manim"], where, rep)
            if isinstance(s.get("title"), str) and words(s["title"]) > 5:
                rep.warn(where, "title is over 5 words")
        elif t == "code":
            if "lines" not in s and "code" not in s:
                rep.err(where, 'code scene needs "lines" (list of strings) or "code" (text string)')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
        elif t == "architecture":
            nodes = s.get("nodes") or s.get("steps")
            if not isinstance(nodes, list) or not nodes or not all(isinstance(x, str) and x.strip() for x in nodes):
                rep.err(where, 'architecture needs "nodes": a non-empty list of short strings')
            elif len(nodes) > 5:
                rep.warn(where, f'{len(nodes)} nodes; 3 to 5 fits the screen best')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
        elif t == "gauge":
            if "value" not in s and "endValue" not in s:
                rep.err(where, 'gauge needs "value" or "endValue" numeric/text metric')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
        elif t == "timeline":
            steps = s.get("steps") or s.get("items")
            if not isinstance(steps, list) or not steps or not all(isinstance(x, str) and x.strip() for x in steps):
                rep.err(where, 'timeline needs "steps": a non-empty list of short strings')
            elif len(steps) > 5:
                rep.warn(where, f'{len(steps)} steps; 3 to 5 fits the screen best')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
        elif t == "callout":
            if "text" not in s and "title" not in s:
                rep.err(where, 'callout needs "text" or "title"')
            if "variant" in s:
                allowed_callout_variants = {
                    "payment_reconciliation_alert", "upi_alert_3d", "alert_3d", "callout_3d",
                    "standard", "default"
                }
                if s["variant"] not in allowed_callout_variants:
                    rep.err(where, f'unknown callout variant: {s["variant"]!r} (expected one of {sorted(allowed_callout_variants)})')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
        elif t == "bento":
            if "bentoItems" not in s and "items" not in s:
                rep.err(where, 'bento needs "bentoItems" or "items"')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
        elif t == "benchmark":
            runners = s.get("runners")
            if not isinstance(runners, list) or not runners:
                rep.err(where, 'benchmark needs "runners": list of runner objects')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
        elif t == "hierarchy":
            layers = s.get("layers")
            if not isinstance(layers, list) or not layers:
                rep.err(where, 'hierarchy needs "layers": list of layer objects')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
        elif t == "data_structure":
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
        elif t == "inspector":
            sections = s.get("sections")
            if not isinstance(sections, list) or not sections:
                rep.err(where, 'inspector needs "sections": list of section cards')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
        elif t == "quadrant":
            points = s.get("points")
            if not isinstance(points, list) or not points:
                rep.err(where, 'quadrant needs "points": list of 2D coordinates')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
        elif t == "concentric":
            rings = s.get("rings")
            if not isinstance(rings, list) or not rings:
                rep.err(where, 'concentric needs "rings": list of ring layer strings')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
        elif t == "seat_booking":
            beats = s.get("beats")
            if not isinstance(beats, list) or not beats:
                rep.err(where, 'seat_booking needs "beats" to animate the booking state')
            else:
                allowed_states = {"search", "collision", "locked", "payment", "booked", "segments"}
                for beat_index, beat in enumerate(beats, 1):
                    if isinstance(beat, dict) and beat.get("visualState") not in allowed_states:
                        rep.err(where, f'beat {beat_index} needs a "visualState" from {sorted(allowed_states)}')
        elif t == "interview":
            iv = s.get("interview")
            if not iv and "text" not in s and "title" not in s:
                rep.err(where, 'interview needs "interview" object or "text"/"title"')
        elif t == "terminal":
            steps = s.get("terminalSteps")
            if not isinstance(steps, list) or not steps:
                rep.err(where, 'terminal needs "terminalSteps": list of terminal step objects')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
        elif t == "screenshot":
            if not s.get("image") and not s.get("search_image"):
                rep.err(where, 'screenshot needs "image": image path or "search_image": query')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
        elif t == "chart":
            data = s.get("chartData")
            if not isinstance(data, list) or not data:
                rep.err(where, 'chart needs "chartData": list of {label, value} objects')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")
        elif t == "product":
            if not s.get("image") and not s.get("title") and not s.get("search_image"):
                rep.err(where, 'product needs "image", "title", or "search_image"')
            if isinstance(s.get("title"), str) and words(s["title"]) > 8:
                rep.warn(where, "title is over 8 words")

    types = [s.get("type") for s in scenes if isinstance(s, dict)]
    if types and types[0] not in ("hook", "interview", "video") and not (
        types[0] == "air_conditioner" and scenes[0].get("variant") == "split_hook"
    ) and not (
        types[0] == "linear_search_visualizer" and scenes[0].get("variant") == "intro"
    ) and not (
        types[0] == "binary_search_visualizer" and scenes[0].get("variant") in ("intro", "book_analogy")
    ) and not (
        types[0] == "three" and scenes[0].get("variant") in ("phone_layers_3d", "upi_hook_3d", "hook_3d", "smartphone_3d", "mobile_3d", "google_maps_3d", "maps_navigation_3d", "bluetooth_link_3d", "fastag_toll_3d")
    ) and not (
        types[0] == "quick_commerce" and scenes[0].get("variant") == "customer_order"
    ) and not (
        types[0] in ("aadhaar", "aadhaar_visualizer") and scenes[0].get("variant") in ("aadhaar_hook", "hook")
    ) and not (
        types[0] in ("tower_of_hanoi", "tower_of_hanoi_visualizer") and scenes[0].get("variant") in ("legend_hook", "hook")
    ) and not (
        types[0] in ("emudhra", "emudhra_visualizer") and scenes[0].get("variant") in ("campus_headquarters", "headquarters", "hook")
    ):
        rep.warn("scenes", "first scene should be a hook, video, or an interview prompt")
    if types and types[-1] not in ("outro", "interview") and not (
        types[-1] == "three" and scenes[-1].get("variant") in ("upi_outro_3d", "outro_3d", "digital_india_3d", "bluetooth_reveal_3d", "bluetooth_master_recap_3d")
    ) and not (
        types[-1] in ("google_maps", "google_maps_visualizer") and scenes[-1].get("variant") in ("maps_system_outro", "outro")
    ) and not (
        types[-1] in ("aadhaar", "aadhaar_visualizer") and scenes[-1].get("variant") in ("aadhaar_recap_loop", "aadhaar_outro_loop", "recap", "loop", "outro")
    ) and not (
        types[-1] in ("tower_of_hanoi", "tower_of_hanoi_visualizer") and scenes[-1].get("variant") in ("outro_takeaway", "outro")
    ):
        rep.warn("scenes", "last scene should be an outro or recap")
    if not any(t in types for t in ("manim", "three", "architecture", "code", "gauge", "bento", "benchmark", "hierarchy", "data_structure", "inspector", "quadrant", "concentric", "seat_booking", "neural_network_graph", "interview", "terminal", "screenshot", "chart", "product", "sorting_visualizer", "refrigerator", "air_conditioner", "linear_search_visualizer", "binary_search_visualizer", "tesla_roadster_visualizer", "quick_commerce", "depth_parallax", "google_maps", "google_maps_visualizer", "aadhaar", "aadhaar_visualizer", "tower_of_hanoi", "tower_of_hanoi_visualizer")):
        rep.warn("scenes", "no animated visual explanation (manim, three, architecture, code, gauge, bento, benchmark...); at least one is recommended")

    # No Consecutive Twins rule: Never use the exact same scene type and variant twice in a row
    for i in range(1, len(types)):
        if types[i] == types[i - 1]:
            curr_var = scenes[i].get("variant") if isinstance(scenes[i], dict) else None
            prev_var = scenes[i-1].get("variant") if isinstance(scenes[i-1], dict) else None
            if not (curr_var and prev_var and curr_var != prev_var):
                rep.warn(f"scene {i + 1}", f'Consecutive twin scene types detected: scene {i} and scene {i + 1} are both "{types[i]}"; alternate scene types (Spatial ➔ Analytical ➔ Impact) for visual momentum')

    # Mobile Vertical Safe Zone checks (1080x1920)
    for idx, s in enumerate(scenes, 1):
        if not isinstance(s, dict):
            continue
        where = f"scene {idx}"
        # Warn if explicit component height exceeds vertical safe zone (960px)
        if s.get("height") and isinstance(s["height"], (int, float)) and s["height"] > 960:
            rep.warn(where, f'visual height {s["height"]}px exceeds vertical safe zone of 960px (may collide with 350px bottom subtitle clearance)')
        # Warn if scene 1 hook is purely abstract text without an image, variant, or real-world grounding
        if idx == 1 and s.get("type") == "hook" and not s.get("variant") and not s.get("image") and not s.get("search_image"):
            rep.warn(where, 'scene 1 hook should ideally ground the concept in an authentic app UI or real-world scenario (e.g. "variant": "amazon_shopping") rather than bare text')

    # Automated Slideshow Risk & Scene Variation Analysis (from OpenMontage heuristics)
    try:
        from tools.slideshow_risk import analyze_slideshow_risk
        risk = analyze_slideshow_risk(scenes)
        for w in risk.get("warnings", []):
            rep.warn("slideshow_risk", w)
        for v in risk.get("violations", []):
            rep.warn("slideshow_risk", f"[High Risk] {v}")
        rep.slideshow_score = risk.get("score")
        rep.slideshow_verdict = risk.get("verdict")
    except Exception:
        pass

    total_words = sum(words(x.get("narration", "")) for x in scenes if isinstance(x, dict))
    if est > MAX_SECONDS:
        over = int((est - MAX_SECONDS) * WORDS_PER_SECOND) + 1
        rep.err("length", f"estimated ~{est:.0f}s exceeds the {MAX_SECONDS // 60}-minute limit "
                          f"(cut about {over} words of narration)")
    rep.estimate = est
    rep.total_words = total_words
    return rep


def validate_file(path):
    rep = Report()
    p = Path(path)
    if p.is_dir():
        if (p / "storyboard.json").exists():
            p = p / "storyboard.json"
        else:
            jsons = list(p.glob("*.json"))
            if jsons:
                p = jsons[0]
            else:
                rep.err("file", f"directory {path} contains no storyboard.json or *.json file")
                return rep
    try:
        text = p.read_text(encoding="utf-8")
    except OSError as e:
        rep.err("file", f"cannot read {p}: {e}")
        return rep
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        hint = ""
        if "escape" in e.msg.lower():
            hint = " (a single backslash: write LaTeX backslashes twice, e.g. \\\\sqrt)"
        elif "Expecting property name" in e.msg or "Expecting value" in e.msg:
            hint = " (often a trailing comma before } or ])"
        elif "Extra data" in e.msg:
            hint = " (text after the JSON ends: remove any explanation or ``` fences)"
        rep.err("json", f"line {e.lineno}, column {e.colno}: {e.msg}{hint}")
        return rep
    rep = validate_data(data, root=p.parent)
    return rep


def print_report(path, rep):
    print(f"\n{path}")
    for w, m in rep.errors:
        print(f"  ERROR   {w}: {m}")
    for w, m in rep.warnings:
        print(f"  warning {w}: {m}")
    if not rep.errors:
        est = getattr(rep, "estimate", None)
        extra_parts = []
        if est:
            extra_parts.append(f"est. length ~{int(est // 60)}m{int(est % 60):02d}s")
            extra_parts.append(f"{rep.total_words} narration words")
        if getattr(rep, "slideshow_verdict", None):
            extra_parts.append(f"visual momentum: {rep.slideshow_verdict} [{rep.slideshow_score}/5.0]")
        extra = f" ({', '.join(extra_parts)})" if extra_parts else ""
        print(f"  OK{extra}" + ("" if not rep.warnings else f", {len(rep.warnings)} warning(s)"))


def main(argv):
    if not argv:
        print(__doc__)
        return 1
    files = []
    for pat in argv:
        p = Path(pat)
        if p.is_dir():
            if (p / "storyboard.json").exists():
                files.append(str(p / "storyboard.json"))
            else:
                found = sorted(str(f) for f in p.rglob("*.json"))
                if found:
                    files.extend(found)
                else:
                    files.append(str(p))
        else:
            matches = sorted(glob.glob(pat))
            if matches:
                files.extend(matches)
            else:
                files.append(pat)
    bad = False
    for f in files:
        rep = validate_file(f)
        print_report(f, rep)
        bad |= bool(rep.errors)
    if (ROOT / "out").is_dir():
        print("\n  [WORKSPACE WARNING] Deprecated root 'out/' directory detected! All episode outputs and renders must reside strictly under 'episodes/<id>/'.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
