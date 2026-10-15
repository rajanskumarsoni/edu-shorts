"""
Audio enhancement and speech mastering engine for edu-shorts.

Adapted from OpenMontage's audio_enhance.py.
Applies broadcast-grade audio filter chains (highpass, noise gating, compression,
and EBU R128 loudness normalization) via FFmpeg.

Presets:
- clean_speech: Highpass 80Hz + noise gate + gentle compressor + -16 LUFS loudness normalization
- podcast: Warm vocal compression with makeup gain and speech presence
- normalize_only: Fast EBU R128 normalization to -16 LUFS
"""

from __future__ import annotations
import argparse
import shutil
import subprocess
from pathlib import Path

FFMPEG = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"

PRESETS = {
    "clean_speech": {
        "description": "Highpass + gate + gentle compressor + -16 LUFS normalization",
        "filter": (
            "highpass=f=80,"
            "lowpass=f=14000,"
            "agate=threshold=0.015:ratio=2:attack=10:release=60,"
            "acompressor=threshold=-20dB:ratio=2.5:attack=10:release=120:makeup=1.5,"
            "loudnorm=I=-16:LRA=11:TP=-1.5"
        ),
    },
    "podcast": {
        "description": "Warm, punchy vocal treatment with compression and -16 LUFS loudness",
        "filter": (
            "highpass=f=80,"
            "acompressor=threshold=-18dB:ratio=3:attack=8:release=100:makeup=2.5,"
            "loudnorm=I=-16:LRA=8:TP=-1.5"
        ),
    },
    "normalize_only": {
        "description": "Standard EBU R128 loudness normalization to -16 LUFS",
        "filter": "loudnorm=I=-16:LRA=11:TP=-1.5",
    },
}


def enhance_audio(
    input_path: str | Path,
    output_path: str | Path | None = None,
    preset: str = "clean_speech",
) -> Path:
    """Enhance and master audio using an FFmpeg audio filter preset.

    Args:
        input_path: Path to input audio file.
        output_path: Path to output audio file. Defaults to {stem}_enhanced.{ext}.
        preset: One of 'clean_speech', 'podcast', 'normalize_only'.

    Returns:
        Path to output enhanced audio file.
    """
    in_p = Path(input_path).resolve()
    if not in_p.is_file():
        raise FileNotFoundError(f"Audio file not found: {in_p}")

    out_p = Path(output_path).resolve() if output_path else in_p.with_name(f"{in_p.stem}_enhanced{in_p.suffix}")
    out_p.parent.mkdir(parents=True, exist_ok=True)

    filter_chain = PRESETS.get(preset, PRESETS["clean_speech"])["filter"]

    cmd = [
        FFMPEG, "-y",
        "-i", str(in_p),
        "-af", filter_chain,
        "-ar", "48000",
        str(out_p),
    ]

    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg audio enhancement failed: {res.stderr}")

    return out_p


def main():
    parser = argparse.ArgumentParser(description="Enhance and normalize speech audio clips using broadcast filter presets")
    parser.add_argument("input", help="Input audio file path")
    parser.add_argument("--out", "-o", help="Output audio file path")
    parser.add_argument("--preset", "-p", choices=list(PRESETS.keys()), default="clean_speech", help="Audio enhancement preset")
    args = parser.parse_args()

    out = enhance_audio(args.input, args.out, preset=args.preset)
    print(f"✅ Enhanced audio saved to: {out}")


if __name__ == "__main__":
    main()
