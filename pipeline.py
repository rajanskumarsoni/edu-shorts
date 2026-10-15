#!/usr/bin/env python3
"""
JSON script + narration audio  ->  Manim clips  ->  Remotion render

  python pipeline.py episodes/<id>/storyboard.json --export-text   # step 1: narration text for your TTS
  python pipeline.py episodes/<id>/storyboard.json                 # step 2: build + render mp4 (no upload)
  python pipeline.py episodes/<id>/storyboard.json --upload private # auto-upload with private visibility
  python pipeline.py episodes/<id>/storyboard.json --no-upload     # render only (explicit no-upload)
  python pipeline.py episodes/*/storyboard.json                    # batch many videos
  python pipeline.py episodes/<id>/storyboard.json --no-render     # prep only (for studio preview)

Audio modes (set "audio_mode" in the script JSON):
  "single" (default)  ONE file: audio/<id>/narration.wav|mp3|m4a|ogg|flac
                      scene start times are found automatically (see --align)
  "scenes"            one file per scene: audio/<id>/s1.wav, s2.wav ...

Scenes are validated first (see validate.py); --skip-validate to bypass.
YouTube upload only occurs when explicitly requested with --upload.
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
PAD_SECONDS = 0.05  # scenes mode: short padding; most TTS clips already include natural pause
TAIL_SECONDS = 0.6   # single mode: video continues this long after the last word
AUDIO_EXTS = (".wav", ".mp3", ".m4a", ".ogg", ".flac", ".aac")
SILENCE_CONFIDENCE = 1.4  # chosen boundary pauses must be this much longer than the next-longest pause


# ----------------------------------------------------------------- staging helpers
def stage_file(src: Path, dst: Path) -> None:
    """Stage a file to a destination using zero-copy symlinks when possible.
    Preserves disk space and cleanly reflects that public/ is ephemeral build staging.
    Falls back to hardlinks or copying if symlinking fails."""
    src = Path(src).resolve()
    dst = Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.is_symlink() or dst.exists():
        try:
            if dst.exists() and dst.samefile(src):
                return
        except OSError:
            pass
        try:
            if dst.is_dir() and not dst.is_symlink():
                shutil.rmtree(dst)
            else:
                dst.unlink()
        except OSError:
            pass

    try:
        os.symlink(src, dst)
        return
    except OSError:
        pass

    try:
        os.link(src, dst)
        return
    except OSError:
        pass

    shutil.copy2(src, dst)


def clean_cache(preserve: set[str] = None) -> list[str]:
    """Prune temporary episode staging directories and files in public/
    while preserving permanent shared directories (sfx, music, models) and .gitkeep."""
    if preserve is None:
        preserve = {"sfx", "music", "models", ".gitkeep"}
    pub_dir = ROOT / "public"
    if not pub_dir.exists():
        return []

    cleaned = []
    for item in sorted(pub_dir.iterdir()):
        if item.name.startswith(".") and item.name != ".DS_Store":
            continue
        if item.name in preserve:
            continue
        try:
            if item.is_dir() and not item.is_symlink():
                shutil.rmtree(item)
            else:
                item.unlink()
            cleaned.append(item.name)
        except Exception as e:
            print(f"  Warning: could not remove {item}: {e}")

    if cleaned:
        print(f"Cleaned staging cache in public/: {', '.join(cleaned)}")
    else:
        print("Staging cache in public/ is already clean.")
    return cleaned


# ----------------------------------------------------------------- audio helpers
def audio_duration(path: Path) -> float:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)], text=True)
    return float(out.strip())


def measure_speech_end(path: Path, threshold_db: float = -50.0, min_silence: float = 0.15) -> tuple[float, float]:
    """Non-destructively measure (total_duration, speech_end_seconds) of an audio file.
    Never re-encodes or modifies the source audio file, preserving 100% original clarity."""
    if not path or not path.exists():
        return 0.0, 0.0
    total = audio_duration(path)
    cmd = [
        "ffmpeg", "-hide_banner", "-nostats", "-i", str(path),
        "-af", f"silencedetect=noise={threshold_db}dB:d={min_silence}",
        "-f", "null", "-"
    ]
    try:
        err = subprocess.run(cmd, capture_output=True, text=True).stderr
        last_start = None
        last_end = None
        for line in err.splitlines():
            m_s = re.search(r"silence_start: (-?[\d.]+)", line)
            if m_s:
                last_start = max(0.0, float(m_s.group(1)))
                last_end = None
                continue
            m_e = re.search(r"silence_end: (-?[\d.]+)", line)
            if m_e and last_start is not None:
                last_end = float(m_e.group(1))
        if last_start is not None and last_start > 0.3:
            if last_end is None or last_end >= total - 0.08:
                return total, last_start
    except Exception:
        pass
    return total, total



def ensure_48k_stereo(path: Path) -> Path:
    """Ensure audio is 48kHz stereo to avoid playback speed artifacts, normalizing in-place."""
    if not path or not path.exists() or path.suffix.lower() not in ('.mp3', '.wav'):
        return path
    try:
        cmd = ["ffprobe", "-v", "error", "-select_streams", "a:0",
               "-show_entries", "stream=sample_rate,channels", "-of", "csv=p=0", str(path)]
        out = subprocess.check_output(cmd, text=True).strip().split(",")
        if len(out) == 2 and out[0] == "48000" and out[1] == "2":
            return path
    except Exception:
        pass
    tmp_path = path.with_name(f"_tmp_{path.name}")
    try:
        subprocess.run(["ffmpeg", "-y", "-i", str(path), "-ar", "48000", "-ac", "2", str(tmp_path)],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        tmp_path.replace(path)
    finally:
        if tmp_path.exists():
            tmp_path.unlink()
    return path


def find_audio(folder: Path, stem: str):
    for ext in AUDIO_EXTS:
        p = folder / f"{stem}{ext}"
        legacy_norm = folder / f"norm_{stem}{ext}"
        if legacy_norm.exists():
            legacy_norm.replace(p)
            return p
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
def get_scene_audio(narration: str, folder: Path, n: int, tone: str = None) -> Path:
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
            tts.synthesize(narration, str(out), tone=tone)
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
    template_path = str((ROOT / file).resolve())
    cls = spec.get("template", "Equations")
    py_bin = str(ROOT / ".venv/bin/python3") if (ROOT / ".venv/bin/python3").exists() else sys.executable
    with tempfile.TemporaryDirectory() as tmp:
        cmd = [py_bin, "-m", "manim", "render", "-r", f"{size[0]},{size[1]}",
               "--fps", str(FPS), "--format", "mp4", "--disable_caching",
               "--media_dir", tmp, "-o", "clip", template_path, cls]
        subprocess.run(cmd, check=True, env=env, cwd=tmp)
        found = list(Path(tmp).rglob("clip.mp4"))
        if not found:
            raise RuntimeError("Manim finished but no clip.mp4 was found")
        shutil.copy(found[0], out_mp4)


# ----------------------------------------------------------------- word timing
def generate_word_timings(audio_path: Path, narration: str):
    """Generate word-level start/end times for exact caption sync.
    Uses simple energy-based segmentation as a fast local fallback;
    returns None if no audio is available."""
    if not audio_path or not audio_path.exists():
        return None
    try:
        import tts
        # Use faster-whisper if available for precise alignment
        if importlib.util.find_spec("faster_whisper"):
            return _whisper_word_timings(audio_path, narration)
    except Exception:
        pass
    # Fallback: proportional timing based on word count
    try:
        dur = audio_duration(audio_path)
    except Exception:
        return None
    words = [w for w in narration.split() if w.strip()]
    if not words:
        return None
    per_word = dur / len(words)
    return [{"word": w, "start": i * per_word, "end": (i + 1) * per_word}
            for i, w in enumerate(words)]


def _whisper_word_timings(audio_path: Path, narration: str):
    """Use faster-whisper forced alignment for exact word timings."""
    from faster_whisper import WhisperModel
    model = WhisperModel("base", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(str(audio_path), word_timestamps=True)
    words = []
    for seg in segs:
        for w in seg.words:
            words.append({"word": w.word.strip(), "start": w.start, "end": w.end})
    return words if words else None


# ----------------------------------------------------------------- build
def fmt_time(t):
    return f"{int(t // 60)}:{t % 60:05.2f}"


def build(spec_path: str, args):
    import validate
    spec_p = Path(spec_path)
    if spec_p.is_dir():
        episode_dir = spec_p
        spec_file = episode_dir / "storyboard.json"
        if not spec_file.exists():
            jsons = list(episode_dir.glob("*.json"))
            if jsons:
                spec_file = jsons[0]
            else:
                raise SystemExit(f"No storyboard.json or *.json found in episode directory {episode_dir}")
    elif spec_p.name == "storyboard.json" or "episodes" in spec_p.parts:
        spec_file = spec_p
        try:
            episode_relative = spec_p.resolve().relative_to(ROOT.resolve() / "episodes")
        except ValueError:
            episode_relative = None
        episode_dir = spec_p.parent if episode_relative is not None and len(episode_relative.parts) == 2 else None
    else:
        spec_file = spec_p
        episode_dir = None

    if not getattr(args, "no_fetch_assets", False):
        try:
            from tools.asset_finder import resolve_spec_assets
            resolve_spec_assets(spec_file)
        except Exception as e:
            print(f"  [Asset Auto-Resolver Warning] {e}")

    spec = json.loads(spec_file.read_text(encoding="utf-8"))
    vid = spec["id"]
    accent = spec.get("accent", "#FFC857")
    fmt = spec.get("format", "vertical")
    if fmt not in FORMATS:
        raise SystemExit(f'format must be "vertical" or "landscape", got {fmt!r}')
    size = FORMATS[fmt]
    mode = spec.get("audio_mode", "single")
    if mode not in ("single", "scenes"):
        raise SystemExit(f'audio_mode must be "single" or "scenes", got {mode!r}')

    if not episode_dir:
        episode_dir = ROOT / "episodes" / vid
    audio_dir = episode_dir / "audio"
    media_dir = episode_dir / "media"
    pub = ROOT / "public" / vid

    if args.export_text:
        export_text(spec, audio_dir, mode, args.separator)
        return

    audio_dir.mkdir(parents=True, exist_ok=True)
    pub.mkdir(parents=True, exist_ok=True)
    media_dir.mkdir(parents=True, exist_ok=True)
    scale_label = 0.5 if getattr(args, "preview", False) else args.scale
    print(f"=== {vid} ({fmt} {int(size[0] * scale_label)}x{int(size[1] * scale_label)}, audio: {mode}) ===")

    scenes_spec = spec["scenes"]
    plan = []  # (n, scene_spec, per-scene audio or None, frames)
    narration_rel = None

    pad_sec = getattr(args, "pad_seconds", None)
    if pad_sec is None:
        pad_sec = float(spec.get("pad_seconds", PAD_SECONDS))

    if mode == "scenes":
        for n, s in enumerate(scenes_spec, 1):
            narration = s.get("narration", "").strip()
            if narration:
                src = get_scene_audio(narration, audio_dir, n, tone=s.get("tone"))
                # Ensure audio is 48kHz stereo to avoid playback speed artifacts
                src = ensure_48k_stereo(src)
                total_dur, speech_end = measure_speech_end(src)
                # Generate word-level timings for millisecond-precise caption sync
                s["wordTimings"] = generate_word_timings(src, narration)
                # If trailing silence is excessive (> 0.40s), trim the dead silence by ending at speech_end + max(0.25, pad_sec).
                # Otherwise, guarantee scene duration is at least total_dur + 0.08s so Remotion never cuts off <Audio> mid-playback.
                if getattr(args, "trim_silence", True) and (total_dur - speech_end) > 0.40:
                    audio_span = speech_end + max(0.25, pad_sec)
                else:
                    audio_span = max(total_dur + 0.08, speech_end + pad_sec)
                target_sec = float(s.get("seconds", 0))
                effective_sec = max(target_sec, audio_span) if target_sec > 0 else audio_span
                frames = math.ceil(effective_sec * FPS)
                print(f"  [scene {n} audio] speech={speech_end:.2f}s, file={total_dur:.2f}s -> scene={frames / FPS:.2f}s ({frames} frames)")
            else:
                src, dur = None, float(s.get("seconds", 3))
                effective_sec = dur
                frames = math.ceil(effective_sec * FPS)
            plan.append((n, s, src, frames))
    else:
        texts = []
        for n, s in enumerate(scenes_spec, 1):
            t = s.get("narration", "").strip()
            if not t:
                raise SystemExit(f'Scene {n} has no narration. In single-audio mode every scene needs '
                                 f'narration text (or set "audio_mode": "scenes").')
            texts.append(t)
        src = ensure_48k_stereo(get_single_audio(texts, audio_dir, args.separator))
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
        stage_file(src, pub / f"narration{ext}")
        narration_rel = f"{vid}/narration{ext}"

    total = sum(p[3] for p in plan) / FPS
    print(f"Total length: {int(total // 60)}m{int(total % 60):02d}s")
    if total > validate.MAX_SECONDS:
        raise SystemExit(f"Video is {total:.0f}s, over the {validate.MAX_SECONDS}-second limit. "
                         f"Shorten the narration or speed up the audio.")

    scenes_out = []
    for n, s, src_scene, frames in plan:
        print(f"[scene {n}] {s['type']}")
        scene = {k: v for k, v in s.items() if k not in ("manim", "seconds")}
        if src_scene:
            dst = pub / f"s{n}{src_scene.suffix}"
            stage_file(src_scene, dst)
            scene["audio"] = f"{vid}/{dst.name}"
        scene["durationInFrames"] = frames
        if s.get("image"):
            img = ROOT / s["image"]
            if not img.exists():
                img = media_dir / Path(s["image"]).name
            if not img.exists():
                img = ROOT / "images" / Path(s["image"]).name
            if not img.exists():
                img = pub / Path(s["image"]).name
            if not img.exists():
                raise SystemExit(f"Scene {n}: image not found: {s['image']}")
            # If source image is outside media_dir, persist it once into media_dir
            try:
                if not img.resolve().is_relative_to(media_dir.resolve()):
                    persisted = media_dir / img.name
                    if not persisted.exists():
                        shutil.copy2(img, persisted)
                    img = persisted
            except ValueError:
                pass
            dst = pub / f"img{n}{img.suffix.lower()}"
            stage_file(img, dst)
            scene["image"] = f"{vid}/{dst.name}"
        if s.get("video"):
            vpath = ROOT / s["video"]
            if not vpath.exists():
                vpath = media_dir / Path(s["video"]).name
            if not vpath.exists():
                vpath = pub / Path(s["video"]).name
            if not vpath.exists():
                raise SystemExit(f"Scene {n}: video not found: {s['video']}")
            try:
                if not vpath.resolve().is_relative_to(media_dir.resolve()):
                    persisted = media_dir / vpath.name
                    if not persisted.exists():
                        shutil.copy2(vpath, persisted)
                    vpath = persisted
            except ValueError:
                pass
            dst = pub / f"vid{n}{vpath.suffix.lower()}"
            stage_file(vpath, dst)
            scene["video"] = f"{vid}/{dst.name}"
        if s["type"] == "manim":
            clip = pub / f"s{n}.mp4"
            # In thumbnail mode, render all manim scenes (not just first)
            if not getattr(args, "thumbnail", False):
                print(f"  rendering Manim ({frames / FPS:.1f}s)...")
                msize = (size[0] * args.scale, size[1] * args.scale)
                render_manim(s.get("manim", {}), frames / FPS, accent, clip, msize, fmt)
                scene["video"] = f"{vid}/s{n}.mp4"
            else:
                # For thumbnail, we still need the clip to exist for the still render
                if clip.exists():
                    scene["video"] = f"{vid}/s{n}.mp4"
                else:
                    print(f"  rendering Manim for thumbnail ({frames / FPS:.1f}s)...")
                    msize = (size[0] * args.scale, size[1] * args.scale)
                    render_manim(s.get("manim", {}), frames / FPS, accent, clip, msize, fmt)
                    scene["video"] = f"{vid}/s{n}.mp4"
        if s["type"] == "diagram":
            diag_file = None
            if s.get("diagram"):
                cand = ROOT / s["diagram"]
                if not cand.exists():
                    cand = media_dir / Path(s["diagram"]).name
                if not cand.exists():
                    cand = pub / Path(s["diagram"]).name
                if cand.exists():
                    diag_file = cand
            elif s.get("mermaid") or s.get("graphviz"):
                try:
                    from tools.diagram_renderer import render_diagram
                    dtype = "graphviz" if s.get("graphviz") else "mermaid"
                    code = s.get("graphviz") or s.get("mermaid")
                    target_svg = media_dir / f"diag{n}.svg"
                    render_diagram(code, diagram_type=dtype, out_path=target_svg)
                    diag_file = target_svg
                except Exception as e:
                    print(f"  [Diagram Render Warning] {e}")

            if diag_file and diag_file.exists():
                dst = pub / f"diag{n}{diag_file.suffix.lower()}"
                stage_file(diag_file, dst)
                scene["diagram"] = f"{vid}/{dst.name}"
            elif not s.get("diagram") and not s.get("image"):
                print(f"  Warning: Scene {n} (diagram) has no rendered diagram file.")
        # Handle 3D model files for "three" type scenes with model_3d variant
        if s["type"] == "three" and s.get("model"):
            model_src = ROOT / s["model"]
            if not model_src.exists():
                model_src = media_dir / Path(s["model"]).name
            if not model_src.exists():
                model_src = ROOT / "public" / s["model"]
            if not model_src.exists():
                raise SystemExit(f"Scene {n}: 3D model not found: {s['model']}")
            try:
                if not model_src.resolve().is_relative_to(media_dir.resolve()) and not model_src.resolve().is_relative_to((ROOT / "public" / "models").resolve()):
                    persisted = media_dir / model_src.name
                    if not persisted.exists():
                        shutil.copy2(model_src, persisted)
                    model_src = persisted
            except ValueError:
                pass
            model_rel = Path(s["model"]).name
            dst = pub / "models" / model_rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            stage_file(model_src, dst)
            scene["model"] = f"{vid}/models/{model_rel}"
        scenes_out.append(scene)

    manifest = {
        "fps": FPS,
        "width": size[0],
        "height": size[1],
        "accent": accent,
        "art_direction": spec.get("art_direction", "editorial"),
        "captions": spec.get("captions", True),
        "progress": spec.get("progress", True),
        "sfx": spec.get("sfx", True),
        "loop": spec.get("loop", False),
        "beatPulse": spec.get("beatPulse", True),
        "scenes": scenes_out,
    }
    if isinstance(spec.get("journey"), list):
        manifest["journey"] = spec["journey"]
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
            stage_file(ROOT / music, pub / music_path.name)
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
            (episode_dir / "post.md").write_text("\n".join(parts), encoding="utf-8")
            print(f"Upload text written: {episode_dir / 'post.md'}")

    npx = shutil.which("npx") or "/opt/homebrew/bin/npx" or "npx"
    ffmpeg = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg" or "ffmpeg"

    # Automated high-CTR thumbnail render
    thumb_media = media_dir / f"{vid}-thumbnail.jpg"
    if getattr(args, "thumbnail", False):
        thumb_cmd = [npx, "remotion", "still", "src/index.ts", "Video", str(thumb_media),
                     f"--props=public/{vid}/manifest.json", "--frame=20"]
        print(f"Rendering high-CTR thumbnail still (1080x1920)...")
        subprocess.run(thumb_cmd, check=True, cwd=ROOT)
        print(f"Thumbnail ready -> {thumb_media}")
        return

    # Render scene preview stills if requested
    if getattr(args, "stills", False):
        print(f"Rendering preview stills for all scenes to {media_dir}...")
        cur_frame = 0
        for n, s, _, f_count in plan:
            frame_to_capture = cur_frame + min(15, f_count // 2)
            tag_name = re.sub(r'[^a-zA-Z0-9_-]', '_', s.get('tag', s.get('type', f'scene_{n}'))).strip('_').lower()
            still_path = media_dir / f"scene_{n:02d}_{tag_name}.jpg"
            still_cmd = [npx, "remotion", "still", "src/index.ts", "Video", str(still_path),
                         f"--props=public/{vid}/manifest.json", f"--frame={frame_to_capture}"]
            try:
                subprocess.run(still_cmd, check=True, cwd=ROOT)
                print(f"  [Scene {n}] still saved -> {still_path.relative_to(ROOT)}")
            except Exception as e:
                print(f"  [Scene {n}] still warning: {e}")
            cur_frame += f_count
        return

    if args.no_render:
        print(f"Preview: npx remotion studio src/index.ts --props=public/{vid}/manifest.json")
        return

    out = episode_dir / "final.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)

    # Auto-generate thumbnail alongside video in media/<vid>/
    thumb_cmd = [npx, "remotion", "still", "src/index.ts", "Video", str(thumb_media),
                 f"--props=public/{vid}/manifest.json", "--frame=20"]
    try:
        subprocess.run(thumb_cmd, check=True, cwd=ROOT)
        print(f"  Cover thumbnail generated -> {thumb_media}")
    except Exception:
        pass

    render_scale = 0.5 if getattr(args, "preview", False) else args.scale
    concurrency_val = str(getattr(args, "concurrency", 2))
    if args.motion_blur:
        raw_out = out.with_name(f"{out.stem}_raw{out.suffix}")
        cmd = [npx, "remotion", "render", "src/index.ts", "Video", str(raw_out),
               f"--props=public/{vid}/manifest.json", f"--concurrency={concurrency_val}"]
        if render_scale != 1:
            cmd.append(f"--scale={render_scale}")
        if getattr(args, "preview", False):
            cmd.extend(["--jpeg-quality=70"])
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
               f"--props=public/{vid}/manifest.json", f"--concurrency={concurrency_val}"]
        if render_scale != 1:
            cmd.append(f"--scale={render_scale}")
        if getattr(args, "preview", False):
            cmd.extend(["--jpeg-quality=70"])
        subprocess.run(cmd, check=True, cwd=ROOT)

    print(f"Done -> {out}")

    # Auto-prune temporary episode staging in public/ so no redundant duplicates remain
    if not getattr(args, "keep_staging", False) and not getattr(args, "preview", False) and not getattr(args, "no_render", False):
        if pub.exists():
            shutil.rmtree(pub, ignore_errors=True)
            print(f"Pruned temporary build staging in public/{vid}/ (canonical assets stay in episodes/{vid}/)")

    if not args.no_upload and args.upload:
        print(f"\n[AUTO-UPLOAD] Video is ready! Uploading to YouTube as {args.upload}...")
        auto_script = ROOT / "tools" / "auto_upload.py"
        if not auto_script.exists():
            auto_script = ROOT / "scripts" / "auto_upload.py"
        subprocess.run([sys.executable, str(auto_script), str(out), "--privacy", args.upload],
                       check=True, cwd=ROOT)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("specs", nargs="*", default=[], help="one or more JSON files (globs ok)")
    ap.add_argument("--clean-cache", action="store_true", help="Prune temporary episode staging directories in public/")
    ap.add_argument("--keep-staging", action="store_true", help="Keep temporary episode staging directory in public/ after rendering")
    ap.add_argument("--export-text", action="store_true")
    ap.add_argument("--no-render", action="store_true")
    ap.add_argument("--preview", action="store_true", help="Fast 360p draft render for rapid visual iteration")
    ap.add_argument("--thumbnail", action="store_true", help="Render only high-CTR 1080x1920 cover thumbnail still in media/<id>/<id>-thumbnail.jpg")
    ap.add_argument("--stills", action="store_true", help="Render preview still images for all scenes into media/<id>/")
    ap.add_argument("--skip-validate", action="store_true")
    ap.add_argument("--upload", nargs="?", const="public", default=None, choices=["public", "private", "unlisted"],
                    help="Upload after rendering; bare --upload means public (default: do not upload)")
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
    ap.add_argument("--no-fetch-assets", action="store_true",
                    help="Skip automated internet search & asset downloading")
    ap.add_argument("--separator", default="", help="text on its own line between scenes in narration_text.txt "
                                                      "(e.g. your TTS's pause tag)")
    ap.add_argument("--pad-seconds", type=float, default=None,
                    help="Pause added after each scene audio in scenes mode (default 0.0: scene length matches audio exactly)")
    ap.add_argument("--trim-silence", action=argparse.BooleanOptionalAction, default=True,
                    help="Automatically trim dead trailing silence from scene audio clips (default True)")
    ap.add_argument("--concurrency", type=int, default=2,
                    help="Remotion render concurrency (default 2 for stable WebGL context handling)")
    args = ap.parse_args()
    if args.clean_cache:
        clean_cache()
        if not args.specs:
            return

    if not args.specs:
        ap.print_help()
        return

    files = []
    for pat in args.specs:
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
            files += sorted(glob.glob(pat)) or [pat]
    if not args.no_fetch_assets:
        try:
            from tools.asset_finder import resolve_spec_assets
            for f in files:
                resolve_spec_assets(f)
        except Exception as e:
            print(f"Asset auto-resolution warning: {e}")
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
