#!/usr/bin/env python3
"""
Text-to-speech integration with local VoiceStudio.

Configured to use the 'rajan story teller' voice clone (ID: e42e619e) by default,
with fallback and custom override options via .env.

Usage as module in pipeline.py:
    synthesize(text, out_path)       # for scenes mode: scene narration -> out_path (.mp3)
    synthesize_all(text, out_path)   # for single mode: full narration -> out_path (.mp3)

Usage as CLI:
    python tts.py --check
    python tts.py "Narration text here" out.mp3
    python tts.py --video episodes/<id>/storyboard.json [--force]
"""

import argparse
import json
import os
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TTS_EXT = ".mp3"

DEFAULT_VOICE_ID = "e42e619e"
DEFAULT_VOICE_NAME = "rajan story teller"
DEFAULT_URL = "http://127.0.0.1:3900"

TONE_PRESETS = {
    'shock': {'speed': 1.05, 'pitch': 1.04, 'energy': 1.1},
    'curious': {'speed': 0.98, 'pitch': 1.02, 'energy': 1.0},
    'urgent': {'speed': 1.10, 'pitch': 1.03, 'energy': 1.15},
    'alert': {'speed': 1.08, 'pitch': 1.02, 'energy': 1.12},
    'warning': {'speed': 1.04, 'pitch': 0.98, 'energy': 1.08},
    'authoritative': {'speed': 0.96, 'pitch': 0.96, 'energy': 1.05},
    'calm': {'speed': 0.94, 'pitch': 0.98, 'energy': 0.95},
    'warm': {'speed': 0.96, 'pitch': 1.0, 'energy': 0.98},
    'energetic': {'speed': 1.08, 'pitch': 1.03, 'energy': 1.12},
}

def parse_tone_parameters(tone_str: str) -> dict:
    if not tone_str:
        return {}
    tone_str = tone_str.lower().strip('[] ')
    for key, preset in TONE_PRESETS.items():
        if key in tone_str:
            return preset
    return {}



def load_env_file():
    env_file = ROOT / ".env"
    if not env_file.is_file():
        return
    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        name = name.strip()
        value = value.strip()
        if value[:1] == value[-1:] and value.startswith(("'", '"')):
            value = value[1:-1]
        if name and value and not os.environ.get(name):
            os.environ[name] = value


def get_base_url() -> str:
    load_env_file()
    return os.environ.get("VOICESTUDIO_URL", DEFAULT_URL).rstrip("/")


def get_voice_id() -> str:
    load_env_file()
    configured_id = os.environ.get("VOICESTUDIO_VOICE_ID", "").strip()
    if configured_id:
        return configured_id

    # If ID is not set, try resolving from voice name via /profiles
    target_name = os.environ.get("VOICESTUDIO_VOICE_NAME", DEFAULT_VOICE_NAME).strip().lower()
    base_url = get_base_url()
    try:
        req = urllib.request.Request(f"{base_url}/profiles")
        with urllib.request.urlopen(req, timeout=5) as resp:
            profiles = json.loads(resp.read().decode("utf-8"))
            for p in profiles:
                if p.get("name", "").strip().lower() == target_name:
                    return p["id"]
    except Exception:
        pass

    return DEFAULT_VOICE_ID


def synthesize(text: str, out_path: str, voice: str = None, tone: str = None) -> None:
    """Synthesize text for a single scene and write audio to out_path."""
    text = (text or "").strip()
    if not text:
        raise ValueError("Cannot synthesize empty text.")

    base_url = get_base_url()
    voice_id = (voice or get_voice_id()).strip()
    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    tone_params = parse_tone_parameters(tone)
    body = {
        "input": text,
        "voice": voice_id,
        "response_format": "mp3",
    }
    if tone_params:
        if "speed" in tone_params:
            body["speed"] = tone_params["speed"]
        if "pitch" in tone_params:
            body["pitch"] = tone_params["pitch"]
    payload = json.dumps(body).encode("utf-8")

    req = urllib.request.Request(
        f"{base_url}/v1/audio/speech",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=360) as resp:
            audio_bytes = resp.read()
    except urllib.error.URLError as err:
        raise SystemExit(
            f"VoiceStudio connection failed ({err}). "
            f"Ensure VoiceStudio is running at {base_url}."
        ) from err
    except Exception as err:
        raise SystemExit(f"TTS synthesis failed: {err}") from err

    if not audio_bytes:
        raise SystemExit(f"VoiceStudio returned empty audio for text: {text[:40]}...")

    out.write_bytes(audio_bytes)

    # Normalize immediately to broadcast standard 48kHz stereo
    try:
        tmp_norm = out.with_name(f"_tmp_{out.name}")
        subprocess.run(["ffmpeg", "-y", "-i", str(out), "-ar", "48000", "-ac", "2", str(tmp_norm)],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        tmp_norm.replace(out)
    except Exception:
        pass


def synthesize_all(text: str, out_path: str, voice: str = None) -> None:
    """Synthesize full narration text for single-audio mode."""
    synthesize(text, out_path, voice=voice)


def check_status():
    load_env_file()
    base_url = get_base_url()
    active_voice_id = get_voice_id()
    print(f"VoiceStudio URL: {base_url}")
    print(f"Active Voice ID: {active_voice_id}")

    try:
        req = urllib.request.Request(f"{base_url}/profiles")
        with urllib.request.urlopen(req, timeout=5) as resp:
            profiles = json.loads(resp.read().decode("utf-8"))
        print("\nAvailable VoiceStudio Profiles:")
        active_found = False
        for p in profiles:
            is_active = (p.get("id") == active_voice_id)
            marker = " -> [ACTIVE]" if is_active else ""
            print(f" - {p.get('name', 'unnamed')} (ID: {p.get('id')}, lang: {p.get('language')}){marker}")
            if is_active:
                active_found = True
        if not active_found:
            print(f"\nWarning: Active voice ID {active_voice_id} was not found in profile list.")
        else:
            print(f"\nVoiceStudio is ready with active voice: {active_voice_id}")
    except Exception as exc:
        print(f"\nCould not connect to VoiceStudio at {base_url}: {exc}")


def synthesize_video(spec_path: str, force: bool = False):
    spec_file = Path(spec_path)
    if not spec_file.is_file():
        raise SystemExit(f"Spec file not found: {spec_path}")
    spec_file = spec_file.resolve()

    spec = json.loads(spec_file.read_text(encoding="utf-8"))
    vid = spec["id"]
    mode = spec.get("audio_mode", "single")
    episode_root = ROOT / "episodes"
    try:
        episode_relative = spec_file.relative_to(episode_root)
    except ValueError:
        episode_relative = None
    if episode_relative is not None and len(episode_relative.parts) == 2:
        audio_dir = spec_file.parent / "audio"
    else:
        audio_dir = ROOT / "audio" / vid
    audio_dir.mkdir(parents=True, exist_ok=True)
    voice_id = get_voice_id()

    print(f"Synthesizing audio for '{vid}' using VoiceStudio (Voice: {voice_id}, Mode: {mode})...")

    if mode == "scenes":
        for n, scene in enumerate(spec["scenes"], 1):
            narration = scene.get("narration", "").strip()
            if not narration:
                continue
            out_file = audio_dir / f"s{n}{TTS_EXT}"
            if out_file.exists() and not force:
                print(f"  [skip] Scene {n}: {out_file.name} exists (use --force to overwrite)")
                continue
            print(f"  [synthesizing] Scene {n}: {narration[:60]}...")
            tone_cue = scene.get("tone", "")
            synthesize(narration, str(out_file), voice=voice_id, tone=tone_cue)
            print(f"  [saved] {out_file}")
    else:
        out_file = audio_dir / f"narration{TTS_EXT}"
        if out_file.exists() and not force:
            print(f"  [skip] Narration: {out_file.name} exists (use --force to overwrite)")
            return
        texts = [s.get("narration", "").strip() for s in spec["scenes"] if s.get("narration", "").strip()]
        full_text = "\n\n".join(texts)
        print(f"  [synthesizing] Full narration ({len(texts)} scenes)...")
        synthesize_all(full_text, str(out_file), voice=voice_id)
        print(f"  [saved] {out_file}")

    print("Audio generation complete.")


def main():
    ap = argparse.ArgumentParser(description="VoiceStudio TTS synthesis helper")
    ap.add_argument("--check", action="store_true", help="Check VoiceStudio connection and active voice")
    ap.add_argument("--video", help="Path to video spec JSON to synthesize scenes/narration for")
    ap.add_argument("--force", action="store_true", help="Overwrite existing audio files when running --video")
    ap.add_argument("text", nargs="?", help="Text to synthesize")
    ap.add_argument("output", nargs="?", default="out.mp3", help="Output file path (default out.mp3)")
    args = ap.parse_args()

    if args.check:
        check_status()
        return

    if args.video:
        synthesize_video(args.video, force=args.force)
        return

    if args.text:
        voice = get_voice_id()
        print(f"Synthesizing using voice {voice} -> {args.output}")
        synthesize(args.text, args.output, voice=voice)
        print("Done.")
        return

    ap.print_help()


if __name__ == "__main__":
    main()
