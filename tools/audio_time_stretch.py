"""
Audio time-stretching engine for edu-shorts.

Adapted from OpenMontage's adjust_narration_speed.py.
Adjusts speech audio duration to match exact storyboard scene durations
using FFmpeg's atempo filter (pitch-neutral time-stretching).
"""

from __future__ import annotations
import argparse
import shutil
import subprocess
from pathlib import Path

FFMPEG = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
FFPROBE = shutil.which("ffprobe") or "/opt/homebrew/bin/ffprobe"


def get_audio_duration(path: Path) -> float:
    """Get precise duration of an audio file in seconds via ffprobe."""
    cmd = [
        FFPROBE, "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(path),
    ]
    out = subprocess.check_output(cmd, text=True).strip()
    return float(out)


def time_stretch_audio(
    input_path: str | Path,
    target_duration: float,
    output_path: str | Path | None = None,
    max_stretch_ratio: float = 0.35,  # Allows between 0.65x and 1.35x speed
) -> Path:
    """Time-stretch audio to match target_duration using pitch-neutral atempo.

    Args:
        input_path: Path to source audio.
        target_duration: Desired duration in seconds.
        output_path: Destination path. Defaults to overwriting or {stem}_stretched.{ext}.
        max_stretch_ratio: Maximum allowable stretch/compression before raising warning.

    Returns:
        Path to output stretched audio file.
    """
    in_p = Path(input_path).resolve()
    if not in_p.is_file():
        raise FileNotFoundError(f"Audio file not found: {in_p}")

    current_dur = get_audio_duration(in_p)
    if current_dur <= 0:
        raise ValueError(f"Invalid audio duration: {current_dur}")

    speed = current_dur / target_duration
    if abs(1.0 - speed) > max_stretch_ratio:
        print(f"⚠️ Warning: Speed ratio {speed:.2f} exceeds {max_stretch_ratio:.0%} variance. Audio quality may degrade slightly.")

    out_p = Path(output_path).resolve() if output_path else in_p.with_name(f"{in_p.stem}_fit{in_p.suffix}")
    out_p.parent.mkdir(parents=True, exist_ok=True)

    # atempo supports 0.5 to 2.0 per filter instance
    clamped_speed = max(0.5, min(2.0, speed))

    cmd = [
        FFMPEG, "-y",
        "-i", str(in_p),
        "-filter:a", f"atempo={clamped_speed:.4f}",
        "-ar", "48000",
        str(out_p),
    ]

    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"FFmpeg time-stretch failed: {res.stderr}")

    return out_p


def main():
    parser = argparse.ArgumentParser(description="Pitch-neutral audio time-stretch to fit target scene duration")
    parser.add_argument("input", help="Input audio file path")
    parser.add_argument("target_seconds", type=float, help="Target duration in seconds")
    parser.add_argument("--out", "-o", help="Output audio file path")
    args = parser.parse_args()

    out = time_stretch_audio(args.input, args.target_seconds, args.out)
    new_dur = get_audio_duration(out)
    print(f"✅ Stretched audio saved to {out} (New duration: {new_dur:.2f}s, Target: {args.target_seconds:.2f}s)")


if __name__ == "__main__":
    main()
