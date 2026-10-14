#!/usr/bin/env python3
"""
Checks a video script JSON against the pipeline's rules.

  python validate.py videos/topic.json
  python validate.py videos/*.json

Errors   -> the pipeline would fail or render wrong. Exit code 1.
Warnings -> style problems (too long, too many items...). Exit code 0.
"""
import glob
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent

MAX_SECONDS = 300          # hard limit: 5 minutes
SHORTS_SECONDS = 180       # above this it is no longer a Short/Reel
WORDS_PER_SECOND = 2.5     # rough speaking speed used for the estimate

TOP_ALLOWED = {"id", "format", "audio_mode", "accent", "music", "music_volume", "captions", "progress", "sfx", "loop", "meta", "scenes"}
COMMON_SCENE_FIELDS = {
    "sfx", "sfxVolume", "icon", "graphic", "visual", "motion",
    "purpose", "transition", "camera", "action", "objects", "tag", "tone"
}
ALLOWED = {
    "hook": {"type", "text", "title", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "bullets": {"type", "title", "items", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "stat": {"type", "value", "label", "title", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "manim": {"type", "title", "manim", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "outro": {"type", "text", "title", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "image": {"type", "image", "title", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "quote": {"type", "text", "author", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "compare": {"type", "title", "left", "right", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "three": {"type", "title", "variant", "component", "equation", "metrics", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "code": {"type", "title", "code", "lines", "language", "filename", "highlight", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "architecture": {"type", "title", "nodes", "steps", "subtext", "tag", "direction", "activeNode", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "gauge": {"type", "title", "value", "startValue", "endValue", "unit", "min", "max", "status", "label", "badge", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "timeline": {"type", "title", "steps", "items", "activeStep", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "callout": {"type", "title", "text", "subtext", "category", "badge", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "bento": {"type", "title", "bentoItems", "items", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "benchmark": {"type", "title", "runners", "unit", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "hierarchy": {"type", "title", "layers", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "data_structure": {"type", "title", "structure", "operations", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "inspector": {"type", "title", "sections", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "quadrant": {"type", "title", "xAxis", "yAxis", "points", "narration", "seconds"} | COMMON_SCENE_FIELDS,
    "concentric": {"type", "title", "rings", "narration", "seconds"} | COMMON_SCENE_FIELDS,
}
IMAGE_EXTS = (".jpg", ".jpeg", ".png", ".webp")
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

    extra = set(data) - TOP_ALLOWED
    if extra:
        rep.warn("top level", f"unknown fields ignored: {sorted(extra)}")

    vid = data.get("id")
    if not isinstance(vid, str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]*", vid):
        rep.err("id", 'required: lowercase letters, digits and dashes only, e.g. "how-vaccines-work"')

    fmt = data.get("format", "vertical")
    if fmt not in ("vertical", "landscape"):
        rep.err("format", f'must be "vertical" (reel size, default) or "landscape" (16:9), got {fmt!r}')

    mode = data.get("audio_mode", "single")
    if mode not in ("single", "scenes"):
        rep.err("audio_mode", f'must be "single" (one narration file, default) or "scenes" (one file per scene), got {mode!r}')

    acc = data.get("accent", "#FFC857")
    if not isinstance(acc, str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", acc):
        rep.err("accent", f'must be a hex color like "#FFC857", got {acc!r}')

    music = data.get("music")
    if music is not None:
        if music != "none" and (not isinstance(music, str) or not (root / music).exists()):
            rep.err("music", f'file not found: {music!r} (use null for default Warm Focus, or "none" to disable)')

    meta = data.get("meta")
    if meta is not None:
        if not isinstance(meta, dict):
            rep.err("meta", 'must be an object like {"title": "...", "description": "...", "hashtags": [...]}')
        else:
            extra = set(meta) - {"title", "description", "hashtags", "facts_to_verify"}
            if extra:
                rep.warn("meta", f"unknown fields ignored: {sorted(extra)}")
            for k in ("title", "description"):
                if k in meta and not isinstance(meta[k], str):
                    rep.err("meta", f'"{k}" must be text')
            for k in ("hashtags", "facts_to_verify"):
                if k in meta and not (isinstance(meta[k], list) and all(isinstance(x, str) for x in meta[k])):
                    rep.err("meta", f'"{k}" must be a list of text items')
            if isinstance(meta.get("title"), str) and len(meta["title"]) > 100:
                rep.warn("meta", "title is over 100 characters (YouTube's limit)")

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

        # visual storyboard check (supports rich string or detailed storyboard dict)
        vis = s.get("visual")
        if vis is None or (isinstance(vis, str) and not vis.strip()):
            rep.warn(where, 'missing "visual" description: describe the intended 3D environment, camera motion, or animation')
        elif isinstance(vis, dict):
            recognized_storyboard = {
                "camera", "objects", "action", "motion_graphics",
                "start", "end", "environment", "purpose", "transition",
                "lighting", "mood", "lens", "style"
            }
            for k in vis.keys():
                if k not in recognized_storyboard:
                    rep.warn(where, f'unrecognized storyboard property in "visual": "{k}"')
        elif not isinstance(vis, str):
            rep.err(where, '"visual" must be a descriptive text string or structured storyboard dictionary')

        # optional high-fidelity storyboard properties
        if "purpose" in s and not isinstance(s["purpose"], str):
            rep.err(where, '"purpose" must be a descriptive text string')
        if "transition" in s and not isinstance(s["transition"], str):
            rep.err(where, '"transition" must be a text string (e.g. "zoom_through", "match_cut", "whip_pan")')

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
            if not isinstance(img, str) or not img.strip():
                rep.err(where, 'image needs "image": a picture path inside the project, e.g. "images/pyramid.jpg"')
            elif not (root / img).exists():
                rep.err(where, f"image file not found: {img}")
            elif Path(img).suffix.lower() not in IMAGE_EXTS:
                rep.err(where, f"image must be one of {', '.join(IMAGE_EXTS)}")
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

    types = [s.get("type") for s in scenes if isinstance(s, dict)]
    if types and types[0] != "hook":
        rep.warn("scenes", "first scene should be a hook")
    if types and types[-1] != "outro":
        rep.warn("scenes", "last scene should be an outro")
    if not any(t in types for t in ("manim", "three", "architecture", "code", "gauge", "bento", "benchmark", "hierarchy", "data_structure", "inspector", "quadrant", "concentric")):
        rep.warn("scenes", "no animated visual explanation (manim, three, architecture, code, gauge, bento, benchmark...); at least one is recommended")

    # same visual type 3+ times in a row gets monotonous in long videos
    run = 1
    for i in range(1, len(types)):
        run = run + 1 if types[i] == types[i - 1] else 1
        if run == 3:
            rep.warn(f"scene {i + 1}", f'3 "{types[i]}" scenes in a row; mix scene types for variety')

    total_words = sum(words(x.get("narration", "")) for x in scenes if isinstance(x, dict))
    if est > MAX_SECONDS:
        over = int((est - MAX_SECONDS) * WORDS_PER_SECOND) + 1
        rep.err("length", f"estimated ~{est:.0f}s exceeds the {MAX_SECONDS // 60}-minute limit "
                          f"(cut about {over} words of narration)")
    elif est > SHORTS_SECONDS:
        rep.warn("length", f"estimated ~{est:.0f}s: over 3 minutes, so it cannot be a YouTube Short/Reel "
                           f"(fine as a normal upload)")
    rep.estimate = est
    rep.total_words = total_words
    return rep


def validate_file(path):
    rep = Report()
    try:
        text = Path(path).read_text(encoding="utf-8")
    except OSError as e:
        rep.err("file", f"cannot read {path}: {e}")
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
    rep = validate_data(data)
    return rep


def print_report(path, rep):
    print(f"\n{path}")
    for w, m in rep.errors:
        print(f"  ERROR   {w}: {m}")
    for w, m in rep.warnings:
        print(f"  warning {w}: {m}")
    if not rep.errors:
        est = getattr(rep, "estimate", None)
        extra = f" (est. length ~{int(est // 60)}m{int(est % 60):02d}s, {rep.total_words} narration words)" if est else ""
        print(f"  OK{extra}" + ("" if not rep.warnings else f", {len(rep.warnings)} warning(s)"))


def main(argv):
    if not argv:
        print(__doc__)
        return 1
    files = []
    for pat in argv:
        files += sorted(glob.glob(pat)) or [pat]
    bad = False
    for f in files:
        rep = validate_file(f)
        print_report(f, rep)
        bad |= bool(rep.errors)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
