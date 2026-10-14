#!/usr/bin/env python3
"""
JSON script + narration audio  ->  Manim clips  ->  Remotion render

  python pipeline.py videos/topic.json --export-text   # step 1: narration text for your TTS
  python pipeline.py videos/topic.json                 # step 2: build + render mp4 + auto-upload to YouTube (public by default)
  python pipeline.py videos/topic.json --upload private # auto-upload with private visibility
  python pipeline.py videos/topic.json --no-upload     # render only (skip YouTube auto-upload)
  python pipeline.py videos/*.json                     # batch many videos
  python pipeline.py videos/topic.json --no-render     # prep only (for studio preview)

Audio modes (set "audio_mode" in the script JSON):
  "single" (default)  ONE file: audio/<id>/narration.wav|mp3|m4a|ogg|flac
                      scene start times are found automatically (see --align)
  "scenes"            one file per scene: audio/<id>/s1.wav, s2.wav ...

Scenes are validated first (see validate.py); --skip-validate to bypass.
"""
import argparse
import difflib
import glob
import importlib.util
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).parent

# Auto-prepend virtual environment, Homebrew, and bundled tools to PATH if available
for _t_dir in [
    ROOT / ".venv/bin",
    Path("/opt/homebrew/bin"),
    ROOT / ".tools/texlive/bin/universal-darwin",
]:
    if _t_dir.is_dir() and str(_t_dir) not in os.environ.get("PATH", ""):
        os.environ["PATH"] = f"{_t_dir}:{os.environ.get('PATH', '')}"

FPS = 30
FORMATS = {"vertical": (1080, 1920), "landscape": (1920, 1080)}  # vertical = Reels/Shorts size
PAD_SECONDS = 0.45   # scenes mode: pause added after each scene's audio
TAIL_SECONDS = 0.6   # single mode: video continues this long after the last word
AUDIO_EXTS = (".wav", ".mp3", ".m4a", ".ogg", ".flac", ".aac")
SILENCE_CONFIDENCE = 1.4  # chosen boundary pauses must be this much longer than the next-longest pause


# ----------------------------------------------------------------- audio helpers
def audio_duration(path: Path) -> float:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)], text=True)
    return float(out.strip())


def find_audio(folder: Path, stem: str):
    for ext in AUDIO_EXTS:
        p = folder / f"{stem}{ext}"
        if p.exists():
            return p
    return None


def join_narration(texts, sep=""):
    joiner = f"\n\n{sep}\n\n" if sep else "\n\n"
    return joiner.join(texts)


def export_text(spec: dict, folder: Path, mode: str, sep: str):
    folder.mkdir(parents=True, exist_ok=True)
    items = [(n, s.get("narration", "").strip()) for n, s in enumerate(spec["scenes"], 1)]
    items = [(n, t) for n, t in items if t]
    (folder / "narration_labeled.txt").write_text(
        "\n\n".join(f"[scene {n}] {t}" for n, t in items), encoding="utf-8")
    if mode == "scenes":
        for n, t in items:
            (folder / f"s{n}.txt").write_text(t, encoding="utf-8")
        print(f"Per-scene text written to {folder}")
        print("Generate audio for each and save as s1.wav, s2.wav, ... in that folder.")
    else:
        (folder / "narration_text.txt").write_text(
            join_narration([t for _, t in items], sep) + "\n", encoding="utf-8")
        print(f"Narration text written: {folder / 'narration_text.txt'}")
        print(f"Run it through your TTS in ONE go and save the result as {folder / 'narration.wav'}")
        print("Make sure the voice leaves a clear pause at each blank line (between scenes).")


# ----------------------------------------------------------------- scenes mode audio
def get_scene_audio(narration: str, folder: Path, n: int) -> Path:
    p = find_audio(folder, f"s{n}")
    if p:
        return p
    try:
        import tts
    except ImportError:
        tts = None
    if tts is not None:
        out = folder / f"s{n}{tts.TTS_EXT}"
        try:
            tts.synthesize(narration, str(out))
            if out.exists():
                return out
            raise SystemExit(f"tts.synthesize() did not create {out}")
        except NotImplementedError:
            pass
    raise SystemExit(
        f"Missing audio for scene {n}. Put it at {folder / f's{n}.wav'} "
        f"(or implement tts.synthesize in tts.py).")


# ----------------------------------------------------------------- single mode: finding scene starts
def get_single_audio(texts, folder: Path, sep: str) -> Path:
    p = find_audio(folder, "narration")
    if p:
        return p
    try:
        import tts
    except ImportError:
        tts = None
    if tts is not None and hasattr(tts, "synthesize_all"):
        out = folder / f"narration{tts.TTS_EXT}"
        try:
            tts.synthesize_all(join_narration(texts, sep), str(out))
            if out.exists():
                return out
            raise SystemExit(f"tts.synthesize_all() did not create {out}")
        except NotImplementedError:
            pass
    raise SystemExit(
        f"Missing narration audio. Put ONE file at {folder / 'narration.wav'} "
        f"(run with --export-text first to get the text), or implement synthesize_all in tts.py.")


def parse_time(tok: str) -> float:
    sec = 0.0
    for part in tok.strip().split(":"):
        sec = sec * 60 + float(part)
    return sec


def read_timings(path: Path, n: int, total: float):
    lines = [l.split("#")[0] for l in path.read_text(encoding="utf-8").splitlines()]
    toks = [t for t in re.split(r"[\s,;]+", " ".join(lines)) if t]
    try:
        times = [parse_time(t) for t in toks]
    except ValueError:
        raise SystemExit(f"{path}: could not read times (use seconds like 12.5 or m:ss like 1:05.5)")
    if len(times) == n:
        times = times[1:]          # first value is the start of scene 1
    elif len(times) != n - 1:
        raise SystemExit(f"{path}: found {len(times)} times, need {n - 1} (start of scenes 2..{n}) "
                         f"or {n} (start of every scene)")
    check_boundaries(times, total, str(path))
    return times


def check_boundaries(b, total, where):
    prev = 0.0
    for i, t in enumerate(b, 2):
        if not (prev < t < total):
            raise SystemExit(f"{where}: scene {i} start {t:.2f}s must be increasing and inside "
                             f"the audio (0 to {total:.2f}s)")
        prev = t


def detect_silences(path: Path, db: float, min_d: float, total: float):
    cmd = ["ffmpeg", "-hide_banner", "-nostats", "-i", str(path),
           "-af", f"silencedetect=noise={db}dB:d={min_d}", "-f", "null", "-"]
    err = subprocess.run(cmd, capture_output=True, text=True).stderr
    sil, cur = [], None
    for line in err.splitlines():
        m = re.search(r"silence_start: (-?[\d.]+)", line)
        if m:
            cur = max(0.0, float(m.group(1)))
            continue
        m = re.search(r"silence_end: (-?[\d.]+) \| silence_duration: ([\d.]+)", line)
        if m and cur is not None:
            sil.append((cur, float(m.group(1)), float(m.group(2))))
            cur = None
    # ignore leading and trailing silence
    return [x for x in sil if x[0] > 0.1 and x[1] < total - 0.1]


def boundaries_from_silence(sil, k):
    """Pick the k longest pauses as scene boundaries. Returns (boundaries, confidence)."""
    if k == 0:
        return [], 99.0
    if len(sil) < k:
        return None, 0.0
    ranked = sorted(sil, key=lambda x: -x[2])
    chosen, rest = ranked[:k], ranked[k:]
    conf = chosen[-1][2] / rest[0][2] if rest else 99.0
    return sorted((s + e) / 2 for s, e, _ in chosen), conf


def norm_word(w: str) -> str:
    return re.sub(r"[^a-z0-9']", "", w.lower())


def boundaries_from_words(texts, heard):
    """texts: scene narrations. heard: [(word, start, end)] from speech recognition.
    Aligns expected words to heard words and puts each boundary in the gap
    between the last word of scene k-1 and the first word of scene k."""
    expected, first_idx = [], []
    for t in texts:
        first_idx.append(len(expected))
        expected += [norm_word(w) for w in t.split() if norm_word(w)]
    hw = [norm_word(w) for w, _, _ in heard]
    sm = difflib.SequenceMatcher(None, expected, hw, autojunk=False)
    mapping = {}
    for a, b, size in sm.get_matching_blocks():
        for i in range(size):
            mapping[a + i] = b + i
    total_end = heard[-1][2] if heard else 0.0
    out = []
    for k in range(1, len(texts)):
        idx = first_idx[k]
        after = next((j for j in range(idx, len(expected)) if j in mapping), None)
        before = next((j for j in range(idx - 1, -1, -1) if j in mapping), None)
        if after is not None and before is not None:
            end_prev = heard[mapping[before]][2]
            start_next = heard[mapping[after]][1]
            out.append((end_prev + start_next) / 2 if start_next > end_prev else start_next)
        else:  # fall back to proportional by word count
            out.append(total_end * idx / max(len(expected), 1))
    return out


def transcribe_words(path: Path, model_name: str):
    from faster_whisper import WhisperModel
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segs, _ = model.transcribe(str(path), word_timestamps=True)
    return [(w.word.strip(), w.start, w.end) for sg in segs for w in sg.words]


def find_boundaries(src: Path, texts, folder: Path, args, total: float):
    n, k = len(texts), len(texts) - 1
    if k == 0:
        return [], "one scene"
    timings = folder / "timings.txt"
    if args.align in ("auto", "manual") and timings.exists():
        return read_timings(timings, n, total), "timings.txt"
    if args.align == "manual":
        raise SystemExit(f"--align manual needs {timings} (one start time per scene, in seconds)")

    sil = None
    if args.align in ("auto", "silence"):
        sil = detect_silences(src, args.silence_db, args.silence_min, total)
        sb, conf = boundaries_from_silence(sil, k)
        if args.align == "silence":
            if sb is None:
                raise SystemExit(f"Found only {len(sil)} pauses, need {k}. Add longer pauses between scenes, "
                                 f"lower --silence-min, or use --align whisper / timings.txt")
            return sb, f"silence (confidence {conf:.1f})"
        if sb is not None and conf >= SILENCE_CONFIDENCE:
            return sb, f"silence (confidence {conf:.1f})"

    if args.align in ("auto", "whisper"):
        if importlib.util.find_spec("faster_whisper") is None:
            if args.align == "whisper":
                raise SystemExit("faster-whisper is not installed: pip install faster-whisper")
        else:
            print("  aligning with Whisper (first run downloads a model)...")
            heard = transcribe_words(src, args.whisper_model)
            if heard:
                return boundaries_from_words(texts, heard), "whisper"
            if args.align == "whisper":
                raise SystemExit("Whisper heard no speech in the narration file")

    if args.align == "auto" and sil is not None:
        sb, conf = boundaries_from_silence(sil, k)
        if sb is not None:
            print(f"  WARNING: scene boundaries are uncertain (pause confidence {conf:.1f}). "
                  f"Check the printed times, or create {timings}.")
            return sb, f"silence (LOW confidence {conf:.1f})"
    raise SystemExit(
        f"Could not find the {k} scene boundaries in the narration audio.\n"
        f"  Fix one of: (1) make your TTS pause clearly at every blank line, "
        f"(2) pip install faster-whisper (automatic alignment), "
        f"(3) write the start time of each scene in {timings}.")


# ----------------------------------------------------------------- manim
def render_manim(spec: dict, duration: float, accent: str, out_mp4: Path,
                 size=(1080, 1920), fmt="vertical"):
    params = {**spec, "duration": duration, "accent": accent, "format": fmt}
    env = {**os.environ, "SCENE_PARAMS": json.dumps(params)}
    file = spec.get("file", "manim_templates/templates.py")
    cls = spec.get("template", "Equations")
    py_bin = str(ROOT / ".venv/bin/python3") if (ROOT / ".venv/bin/python3").exists() else sys.executable
    with tempfile.TemporaryDirectory() as tmp:
        cmd = [py_bin, "-m", "manim", "render", "-r", f"{size[0]},{size[1]}",
               "--fps", str(FPS), "--format", "mp4", "--disable_caching",
               "--media_dir", tmp, "-o", "clip", file, cls]
        subprocess.run(cmd, check=True, env=env, cwd=ROOT)
        found = list(Path(tmp).rglob("clip.mp4"))
        if not found:
            raise RuntimeError("Manim finished but no clip.mp4 was found")
        shutil.copy(found[0], out_mp4)


# ----------------------------------------------------------------- build
def fmt_time(t):
    return f"{int(t // 60)}:{t % 60:05.2f}"


def build(spec_path: str, args):
    import validate
    spec = json.loads(Path(spec_path).read_text(encoding="utf-8"))
    vid = spec["id"]
    accent = spec.get("accent", "#FFC857")
    fmt = spec.get("format", "vertical")
    if fmt not in FORMATS:
        raise SystemExit(f'format must be "vertical" or "landscape", got {fmt!r}')
    size = FORMATS[fmt]
    mode = spec.get("audio_mode", "single")
    if mode not in ("single", "scenes"):
        raise SystemExit(f'audio_mode must be "single" or "scenes", got {mode!r}')
    audio_dir = ROOT / "audio" / vid
    pub = ROOT / "public" / vid

    if args.export_text:
        export_text(spec, audio_dir, mode, args.separator)
        return

    audio_dir.mkdir(parents=True, exist_ok=True)
    pub.mkdir(parents=True, exist_ok=True)
    print(f"=== {vid} ({fmt} {size[0] * args.scale}x{size[1] * args.scale}, audio: {mode}) ===")

    scenes_spec = spec["scenes"]
    plan = []  # (n, scene_spec, per-scene audio or None, frames)
    narration_rel = None

    if mode == "scenes":
        for n, s in enumerate(scenes_spec, 1):
            narration = s.get("narration", "").strip()
            if narration:
                src = get_scene_audio(narration, audio_dir, n)
                dur = audio_duration(src)
            else:
                src, dur = None, float(s.get("seconds", 3))
            plan.append((n, s, src, math.ceil((dur + PAD_SECONDS) * FPS)))
    else:
        texts = []
        for n, s in enumerate(scenes_spec, 1):
            t = s.get("narration", "").strip()
            if not t:
                raise SystemExit(f'Scene {n} has no narration. In single-audio mode every scene needs '
                                 f'narration text (or set "audio_mode": "scenes").')
            texts.append(t)
        src = get_single_audio(texts, audio_dir, args.separator)
        total_audio = audio_duration(src)
        bounds, how = find_boundaries(src, texts, audio_dir, args, total_audio)
        print(f"Narration: {src.name} ({fmt_time(total_audio)}); scene starts found by {how}")
        starts = [0.0] + bounds
        for i, t in enumerate(starts, 1):
            print(f"  scene {i} starts at {fmt_time(t)}")
        if how != "timings.txt" and bounds:
            (audio_dir / "timings.auto.txt").write_text(
                f"# Auto-detected scene starts in seconds (method: {how}).\n"
                f"# Copy to timings.txt and edit to override.\n"
                + "\n".join(f"{t:.3f}" for t in bounds) + "\n", encoding="utf-8")
        fb = [round(t * FPS) for t in starts] + [math.ceil((total_audio + TAIL_SECONDS) * FPS)]
        for i in range(1, len(fb)):
            if fb[i] <= fb[i - 1]:
                raise SystemExit(f"Scene {i} would have zero length; boundaries are wrong. "
                                 f"Create {audio_dir / 'timings.txt'} manually.")
        for n, s in enumerate(scenes_spec, 1):
            plan.append((n, s, None, fb[n] - fb[n - 1]))
            if (fb[n] - fb[n - 1]) / FPS < 1.5:
                print(f"  WARNING: scene {n} is only {(fb[n] - fb[n - 1]) / FPS:.1f}s; boundaries may be wrong.")
        ext = src.suffix
        shutil.copy(src, pub / f"narration{ext}")
        narration_rel = f"{vid}/narration{ext}"

    total = sum(p[3] for p in plan) / FPS
    print(f"Total length: {int(total // 60)}m{int(total % 60):02d}s")
    if total > validate.MAX_SECONDS:
        raise SystemExit(f"Video is {total:.0f}s, over the {validate.MAX_SECONDS // 60}-minute limit. "
                         f"Shorten the narration or speed up the audio.")
    if total > validate.SHORTS_SECONDS:
        print("Note: over 3 minutes, so this is a regular upload, not a Short/Reel.")

    scenes_out = []
    for n, s, src_scene, frames in plan:
        print(f"[scene {n}] {s['type']}")
        scene = {k: v for k, v in s.items() if k not in ("manim", "seconds")}
        if src_scene:
            dst = pub / f"s{n}{src_scene.suffix}"
            shutil.copy(src_scene, dst)
            scene["audio"] = f"{vid}/{dst.name}"
        scene["durationInFrames"] = frames
        if s["type"] == "image":
            img = ROOT / s["image"]
            if not img.exists():
                raise SystemExit(f"Scene {n}: image not found: {s['image']}")
            dst = pub / f"img{n}{img.suffix.lower()}"
            shutil.copy(img, dst)
            scene["image"] = f"{vid}/{dst.name}"
        if s["type"] == "manim":
            clip = pub / f"s{n}.mp4"
            if not getattr(args, "thumbnail", False) or n == 1:
                print(f"  rendering Manim ({frames / FPS:.1f}s)...")
                msize = (size[0] * args.scale, size[1] * args.scale)
                render_manim(s.get("manim", {}), frames / FPS, accent, clip, msize, fmt)
                scene["video"] = f"{vid}/s{n}.mp4"
        scenes_out.append(scene)

    manifest = {
        "fps": FPS,
        "width": size[0],
        "height": size[1],
        "accent": accent,
        "captions": spec.get("captions", True),
        "progress": spec.get("progress", True),
        "sfx": spec.get("sfx", True),
        "loop": spec.get("loop", False),
        "scenes": scenes_out,
    }
    if narration_rel:
        manifest["narration"] = narration_rel
    music = spec.get("music")
    if music == "none":
        manifest["music"] = "none"
    elif music and (ROOT / music).exists():
        music_path = Path(music)
        if music_path.name in ("Warm Focus.wav", "warm_focus.wav", "warm_focus.mp3"):
            manifest["music"] = "music/warm_focus.mp3"
        else:
            shutil.copy(ROOT / music, pub / music_path.name)
            manifest["music"] = f"{vid}/{music_path.name}"
    else:
        # Default background music across every video: Warm Focus
        manifest["music"] = "music/warm_focus.mp3"
    manifest["music_volume"] = float(spec.get("music_volume", 0.32))
    (pub / "manifest.json").write_text(json.dumps(manifest, indent=2))

    meta = spec.get("meta")
    if isinstance(meta, dict):
        parts = []
        if meta.get("title"):
            parts.append(f"TITLE:\n{meta['title']}\n")
        if meta.get("description"):
            parts.append(f"DESCRIPTION:\n{meta['description']}\n")
        tags = meta.get("hashtags") or []
        if tags:
            parts.append("HASHTAGS:\n" + " ".join(t if t.startswith("#") else "#" + t for t in tags) + "\n")
        ver = meta.get("facts_to_verify") or []
        if ver:
            parts.append("FACTS TO VERIFY BEFORE PUBLISHING:\n" + "\n".join("- " + v for v in ver) + "\n")
        if parts:
            (ROOT / "out").mkdir(exist_ok=True)
            (ROOT / "out" / f"{vid}-upload.txt").write_text("\n".join(parts), encoding="utf-8")
            print(f"Upload text written: out/{vid}-upload.txt")

    npx = shutil.which("npx") or "/opt/homebrew/bin/npx" or "npx"
    ffmpeg = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg" or "ffmpeg"

    # Automated high-CTR thumbnail render
    if getattr(args, "thumbnail", False):
        thumb_out = ROOT / "out" / f"{vid}-thumbnail.jpg"
        thumb_cmd = [npx, "remotion", "still", "src/index.ts", "Video", str(thumb_out),
                     f"--props=public/{vid}/manifest.json", "--frame=20"]
        print(f"Rendering high-CTR thumbnail still (1080x1920)...")
        subprocess.run(thumb_cmd, check=True, cwd=ROOT)
        print(f"Thumbnail ready -> {thumb_out}")
        return

    if args.no_render:
        print(f"Preview: npx remotion studio src/index.ts --props=public/{vid}/manifest.json")
        return

    out = ROOT / "out" / f"{vid}.mp4"
    out.parent.mkdir(exist_ok=True)

    # Auto-generate thumbnail alongside video
    thumb_out = ROOT / "out" / f"{vid}-thumbnail.jpg"
    thumb_cmd = [npx, "remotion", "still", "src/index.ts", "Video", str(thumb_out),
                 f"--props=public/{vid}/manifest.json", "--frame=20"]
    try:
        subprocess.run(thumb_cmd, check=True, cwd=ROOT)
        print(f"Cover thumbnail generated -> {thumb_out}")
    except Exception:
        pass

    if args.motion_blur:
        raw_out = ROOT / "out" / f"{vid}_raw.mp4"
        cmd = [npx, "remotion", "render", "src/index.ts", "Video", str(raw_out),
               f"--props=public/{vid}/manifest.json"]
        if args.scale != 1:
            cmd.append(f"--scale={args.scale}")
        subprocess.run(cmd, check=True, cwd=ROOT)
        print(f"Applying cinematic motion blur (temporal subframe blending)...")
        blur_cmd = [
            ffmpeg, "-y", "-i", str(raw_out),
            "-vf", "tmix=frames=3:weights='1 2 1'",
            "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p",
            "-c:a", "copy", str(out)
        ]
        subprocess.run(blur_cmd, check=True, cwd=ROOT)
        raw_out.unlink(missing_ok=True)
    else:
        cmd = [npx, "remotion", "render", "src/index.ts", "Video", str(out),
               f"--props=public/{vid}/manifest.json"]
        if args.scale != 1:
            cmd.append(f"--scale={args.scale}")
        subprocess.run(cmd, check=True, cwd=ROOT)
    print(f"Done -> {out}")

    if not args.no_upload and args.upload:
        print(f"\n[AUTO-UPLOAD] Video is ready! Uploading to YouTube as {args.upload}...")
        auto_script = ROOT / "scripts" / "auto_upload.py"
        subprocess.run([sys.executable, str(auto_script), str(out), "--privacy", args.upload],
                       check=True, cwd=ROOT)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("specs", nargs="+", help="one or more JSON files (globs ok)")
    ap.add_argument("--export-text", action="store_true")
    ap.add_argument("--no-render", action="store_true")
    ap.add_argument("--thumbnail", action="store_true", help="Render only high-CTR 1080x1920 cover thumbnail still in out/<id>-thumbnail.jpg")
    ap.add_argument("--skip-validate", action="store_true")
    ap.add_argument("--upload", nargs="?", const="public", default="public", choices=["public", "private", "unlisted"],
                    help="Automatically upload video to YouTube once render finishes (default: public)")
    ap.add_argument("--no-upload", action="store_true", help="Skip uploading to YouTube")
    ap.add_argument("--align", choices=["auto", "silence", "whisper", "manual"], default="auto",
                    help="single-audio mode: how scene starts are found (default auto)")
    ap.add_argument("--silence-db", type=float, default=-35.0, help="loudness below this counts as silence")
    ap.add_argument("--silence-min", type=float, default=0.4, help="shortest pause (seconds) considered")
    ap.add_argument("--whisper-model", default="base")
    ap.add_argument("--scale", type=int, choices=[1, 2], default=1,
                    help="2 = double resolution (vertical 2160x3840 / landscape 4K); slower")
    ap.add_argument("--motion-blur", action="store_true",
                    help="Apply temporal subframe motion blur for authentic shutter angle effect")
    ap.add_argument("--separator", default="", help="text on its own line between scenes in narration_text.txt "
                                                      "(e.g. your TTS's pause tag)")
    args = ap.parse_args()
    files = []
    for pat in args.specs:
        files += sorted(glob.glob(pat)) or [pat]
    if not args.skip_validate:
        import validate
        bad = False
        for f in files:
            rep = validate.validate_file(f)
            validate.print_report(f, rep)
            bad |= bool(rep.errors)
        if bad:
            raise SystemExit("\nFix the errors above (or use --skip-validate).")
    for f in files:
        build(f, args)


if __name__ == "__main__":
    main()
