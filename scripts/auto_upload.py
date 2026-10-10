#!/usr/bin/env python3
"""Automated Uploader: Publishes rendered videos to YouTube Shorts
with automatic #Shorts tagging, tracker logging, and error handling.

Standard Usage (Method 1 - Direct Pipeline Flag):
  python3 pipeline.py videos/<topic>.json --upload            # Render & auto-upload (public)
  python3 pipeline.py videos/<topic>.json --upload private    # Render & auto-upload (private)

Standalone Usage:
  python3 scripts/auto_upload.py out/<video>.mp4 --privacy public
"""

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "out"
UPLOAD_SCRIPT = ROOT / "scripts" / "upload_video.py"
TRACKER_FILE = OUT_DIR / ".uploaded_manifest.json"


def load_tracker():
    if TRACKER_FILE.is_file():
        try:
            return set(json.loads(TRACKER_FILE.read_text(encoding="utf-8")))
        except Exception:
            return set()
    return set()


def save_tracker(tracker):
    OUT_DIR.mkdir(exist_ok=True)
    TRACKER_FILE.write_text(json.dumps(sorted(list(tracker)), indent=2), encoding="utf-8")


def is_file_ready(path: Path, wait_seconds: float = 3.0) -> bool:
    """Verifies that the file exists and is not currently being written to."""
    if not path.is_file():
        return False
    try:
        size1 = path.stat().st_size
        if size1 < 1024:  # Less than 1 KB is not a valid rendered video
            return False
        time.sleep(wait_seconds)
        size2 = path.stat().st_size
        return size1 == size2
    except OSError:
        return False


def upload_video(video_path: Path, privacy: str = "public") -> bool:
    print(f"\n[AUTO-UPLOAD] Initiating YouTube upload for: {video_path.name}")
    stem = video_path.stem
    spec_path = ROOT / "videos" / f"{stem}.json"
    
    title = None
    if spec_path.is_file():
        try:
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            meta = spec.get("meta", {})
            raw_title = meta.get("title")
            if raw_title:
                if "#Shorts" not in raw_title and "#shorts" not in raw_title:
                    title = f"{raw_title[:90]} #Shorts"
                else:
                    title = raw_title[:100]
        except Exception:
            pass

    cmd = [
        sys.executable,
        str(UPLOAD_SCRIPT),
        str(video_path),
        "--platform", "youtube",
        "--privacy", privacy,
        "--publish"
    ]
    if title:
        cmd.extend(["--title", title])

    try:
        subprocess.run(cmd, check=True, cwd=ROOT)
        print(f"[AUTO-UPLOAD] Successfully published {video_path.name} to YouTube!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[AUTO-UPLOAD] Upload failed for {video_path.name}: {e}", file=sys.stderr)
        return False


def watch_directory(privacy: str, interval: float = 4.0):
    print("=" * 60)
    print(f"  Watching {OUT_DIR} for newly rendered MP4 videos...")
    print(f"  Target: YouTube Shorts | Visibility: {privacy}")
    print(f"  Check interval: {interval}s (Press Ctrl+C to stop)")
    print("=" * 60)

    uploaded = load_tracker()

    while True:
        try:
            mp4_files = sorted(OUT_DIR.glob("*.mp4"))
            for mp4 in mp4_files:
                rel_name = mp4.name
                if rel_name in uploaded:
                    continue
                print(f"[AUTO-UPLOAD] New video detected: {rel_name}. Checking render completion...")
                if is_file_ready(mp4):
                    success = upload_video(mp4, privacy)
                    if success:
                        uploaded.add(rel_name)
                        save_tracker(uploaded)
                else:
                    print(f"[AUTO-UPLOAD] {rel_name} is still rendering/writing. Waiting...")
            time.sleep(interval)
        except KeyboardInterrupt:
            print("\nAuto-uploader stopped.")
            break


def wait_and_upload(video_path: Path, privacy: str, timeout: float = 1800):
    print(f"[AUTO-UPLOAD] Waiting for {video_path.name} to become available (timeout: {timeout/60:.0f}m)...")
    start = time.time()
    while time.time() - start < timeout:
        if video_path.is_file() and is_file_ready(video_path):
            success = upload_video(video_path, privacy)
            if success:
                tracker = load_tracker()
                tracker.add(video_path.name)
                save_tracker(tracker)
            return success
        time.sleep(4)
    print(f"[AUTO-UPLOAD] Timed out waiting for {video_path.name} to be rendered.", file=sys.stderr)
    return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", nargs="?", type=Path, help="Specific video to upload (optional)")
    parser.add_argument("--watch", action="store_true", help="Continuously watch out/ folder for new videos")
    parser.add_argument("--wait", action="store_true", help="Wait if video file does not exist yet")
    parser.add_argument("--privacy", choices=("public", "private", "unlisted"), default="public",
                        help="YouTube upload privacy (default: public)")
    parser.add_argument("--timeout", type=float, default=1800, help="Max wait time in seconds (default: 30m)")
    args = parser.parse_args()

    if args.watch:
        watch_directory(args.privacy)
        return 0

    if not args.video:
        parser.error("Specify a video file to upload, or use --watch to monitor out/")

    target_video = (ROOT / args.video).resolve() if not args.video.is_absolute() else args.video.resolve()

    if args.wait or not target_video.exists():
        success = wait_and_upload(target_video, args.privacy, args.timeout)
        return 0 if success else 1

    if not is_file_ready(target_video, wait_seconds=1.0):
        print(f"File {target_video} is incomplete or currently being written.", file=sys.stderr)
        return 1

    success = upload_video(target_video, args.privacy)
    if success:
        tracker = load_tracker()
        tracker.add(target_video.name)
        save_tracker(tracker)
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
