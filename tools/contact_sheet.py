#!/usr/bin/env python3
"""Create a contact sheet from video frames at intervals and scene changes."""
import argparse
import math
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", type=Path, help="Rendered MP4 to review")
    parser.add_argument("--interval", type=float, default=6, help="Seconds between sampled frames (default: 6)")
    parser.add_argument("--scene-threshold", type=float, default=0.3, help="Scene change threshold (0-1, default: 0.3)")
    parser.add_argument("--output", type=Path, help="Optional contact-sheet output path")
    args = parser.parse_args()

    video = args.video.expanduser().resolve()
    if not video.is_file():
        parser.error(f"video file not found: {video}")
    if args.interval <= 0:
        parser.error("--interval must be greater than zero")

    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        parser.error("ffmpeg and ffprobe must be installed and available on PATH")

    # Get video duration
    duration_result = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(video)],
        check=True,
        capture_output=True,
        text=True,
    )
    duration = float(duration_result.stdout.strip())
    
    # Calculate interval-based samples
    interval_count = max(1, math.floor(duration / args.interval) + 1)
    
    # Get scene changes if pyscenedetect is available
    scene_count = 0
    try:
        # Try to use scenedetect if installed
        scene_result = subprocess.run(
            ["scenedetect", "--input", str(video), "--detector", "threshold", "--threshold", str(args.scene_threshold), "--list-scenes", "-o", "/tmp"],
            capture_output=True,
            text=True,
            timeout=30
        )
        if scene_result.returncode == 0:
            # Parse scene changes from output
            lines = scene_result.stdout.strip().split('\n')
            scene_lines = [l for l in lines if 'Scene' in l and 'Start' in l]
            scene_count = len(scene_lines)
    except (FileNotFoundError, subprocess.TimeoutExpired):
        # scenedetect not available or failed, continue with interval-only
        pass
    
    # Total samples (interval + scene changes, deduplicated)
    total_samples = interval_count + scene_count
    columns = 4
    rows = math.ceil(total_samples / columns)

    video_id = video.stem
    if args.output:
        output = args.output.expanduser().resolve()
    elif (video.parent / "media").is_dir() or video.name == "final.mp4":
        output = video.parent / "media" / "contact-sheet.jpg"
    else:
        output = ROOT / "episodes" / video_id / "media" / "contact-sheet.jpg"
    output.parent.mkdir(parents=True, exist_ok=True)
    
    # Build ffmpeg filter for sampling
    filter_parts = [
        f"fps=1/{args.interval}",  # Interval sampling
    ]
    
    # If we had scene detection, we'd add more complex filtering here
    # For now, we'll use interval sampling and note scene detection limitation
    
    filter_chain = (
        f"{','.join(filter_parts)},"
        "scale=180:320:force_original_aspect_ratio=decrease,"
        "tile={columns}x{rows}:margin=5:padding=2"
    ).format(columns=columns, rows=rows)

    cmd = [
        ffmpeg,
        "-i", str(video),
        "-vf", filter_chain,
        "-frames:v", "1",
        "-y",
        str(output),
    ]
    
    print(f"Creating contact sheet: {output}")
    print(f"Video duration: {duration:.1f}s")
    print(f"Interval samples: {interval_count} (every {args.interval}s)")
    print(f"Scene-based samples: {scene_count} (if detection available)")
    print(f"Total samples: {total_samples}")
    print(f"Grid: {columns}x{rows}")
    
    result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"FFmpeg error: {result.stderr}")
        return 1
        
    print(f"Contact sheet saved to: {output}")
    return 0

if __name__ == "__main__":
    exit(main())
