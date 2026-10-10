#!/usr/bin/env python3
"""
Creates PLACEHOLDER audio so you can test the whole pipeline before connecting your TTS model.

  python make_test_audio.py videos/pythagoras.json

audio_mode "single" (default): writes audio/<id>/narration.wav, a quiet hum for each scene
    (length from word count) with a 1.2 s pause between scenes, like a real narration would have.
audio_mode "scenes": writes silent audio/<id>/s1.wav, s2.wav ...

Existing files are never overwritten. Delete the test audio and add your real audio for the real video.
"""
import array
import json
import math
import subprocess
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).parent
SR = 24000


def scene_seconds(text):
    return max(2.0, len(text.split()) / 2.5)


def make_single(spec, out_dir):
    dst = out_dir / "narration.wav"
    if dst.exists():
        print(f"skip (exists): {dst}")
        return
    one_sec = array.array("h", (int(0.25 * 32767 * math.sin(2 * math.pi * 220 * i / SR)) for i in range(SR)))
    pause = array.array("h", [0]) * int(1.2 * SR)
    samples = array.array("h")
    scenes = [s.get("narration", "").strip() for s in spec["scenes"]]
    scenes = [t for t in scenes if t]
    for i, t in enumerate(scenes):
        d = scene_seconds(t)
        whole = int(d)
        samples.extend(one_sec * whole)
        samples.extend(one_sec[: int((d - whole) * SR)])
        if i < len(scenes) - 1:
            samples.extend(pause)
    if sys.byteorder == "big":
        samples.byteswap()
    with wave.open(str(dst), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(samples.tobytes())
    print(f"created {dst} ({len(samples) / SR:.1f}s, quiet test hum with pauses between scenes)")


def make_scenes(spec, out_dir):
    for n, s in enumerate(spec["scenes"], 1):
        text = s.get("narration", "").strip()
        if not text:
            continue
        dst = out_dir / f"s{n}.wav"
        if dst.exists():
            print(f"skip (exists): {dst}")
            continue
        d = scene_seconds(text)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi",
                        "-i", f"anullsrc=r={SR}:cl=mono", "-t", f"{d:.2f}", str(dst)], check=True)
        print(f"created {dst} ({d:.1f}s silence)")


def main(spec_path):
    spec = json.loads(Path(spec_path).read_text(encoding="utf-8"))
    out = ROOT / "audio" / spec["id"]
    out.mkdir(parents=True, exist_ok=True)
    if spec.get("audio_mode", "single") == "scenes":
        make_scenes(spec, out)
    else:
        make_single(spec, out)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
