#!/usr/bin/env python3
"""Automated Uploader: Publishes rendered videos across platforms
with automatic deduplication, tracker logging, and error handling.
Only newly rendered videos from this point onwards are uploaded.

Standard Usage (Direct Pipeline Flag):
  python3 pipeline.py episodes/<id>/storyboard.json --upload public --upload-platform telegram

Standalone Usage:
  python3 tools/auto_upload.py episodes/<id>/final.mp4 --platform telegram
  python3 tools/auto_upload.py --watch --platform telegram     # Watch for newly rendered videos onwards
"""

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from tools.upload_video import is_already_uploaded, load_manifest, record_upload

EPISODES_DIR = ROOT / "episodes"
UPLOAD_SCRIPT = ROOT / "tools" / "upload_video.py"


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


def upload_video(video_path: Path, privacy: str = "public", platform: str = "youtube", force: bool = False) -> bool:
    print(f"\n[AUTO-UPLOAD] Initiating upload for: {video_path.name} (target: {platform.upper()})")
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
        "--platform", platform,
        "--privacy", privacy,
        "--publish"
    ]
    if force:
        cmd.append("--force")
    if title:
        cmd.extend(["--title", title])

    try:
        subprocess.run(cmd, check=True, cwd=ROOT)
        print(f"[AUTO-UPLOAD] Successfully published {video_path.name} to {platform.upper()}!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[AUTO-UPLOAD] Upload failed for {video_path.name}: {e}", file=sys.stderr)
        return False


def watch_directory(privacy: str, platform: str = "youtube", interval: float = 4.0, force: bool = False, all_pending: bool = False):
    print("=" * 60)
    print(f"  Watching {EPISODES_DIR} for newly rendered final.mp4 videos...")
    print(f"  Target Platform: {platform.upper()} | Visibility: {privacy}")
    print(f"  Mode: {'ALL PENDING VIDEOS' if all_pending else 'ONLY NEW VIDEOS ONWARDS'}")
    print(f"  Check interval: {interval}s (Press Ctrl+C to stop)")
    print("=" * 60)

    start_time = 0.0 if all_pending else time.time()

    while True:
        try:
            mp4_files = sorted(EPISODES_DIR.glob("*/final.mp4"))
            for mp4 in mp4_files:
                # 1. Skip if already uploaded to target platform in manifest
                if not force and is_already_uploaded(mp4, platform):
                    continue

                # 2. Only consider videos modified/rendered on or after startup time
                try:
                    mtime = mp4.stat().st_mtime
                    if not force and mtime < start_time:
                        continue
                except OSError:
                    continue

                rel_name = f"{mp4.parent.name}/{mp4.name}"
                print(f"[AUTO-UPLOAD] Newly rendered video detected: {rel_name}. Checking completion...")
                if is_file_ready(mp4):
                    success = upload_video(mp4, privacy, platform=platform, force=force)
                    if success:
                        print(f"✅ [AUTO-UPLOAD] {rel_name} published successfully!")
                else:
                    print(f"[AUTO-UPLOAD] {rel_name} is still rendering/writing. Waiting...")
            time.sleep(interval)
        except KeyboardInterrupt:
            print("\nAuto-uploader stopped.")
            break


def wait_and_upload(video_path: Path, privacy: str, platform: str = "youtube", timeout: float = 1800, force: bool = False):
    print(f"[AUTO-UPLOAD] Waiting for {video_path.name} to become available (timeout: {timeout/60:.0f}m)...")
    start = time.time()
    while time.time() - start < timeout:
        if video_path.is_file() and is_file_ready(video_path):
            if not force and is_already_uploaded(video_path, platform):
                print(f"[AUTO-UPLOAD] {video_path.name} was already published to {platform.upper()}. Skipping.")
                return True
            return upload_video(video_path, privacy, platform=platform, force=force)
        time.sleep(4)
    print(f"[AUTO-UPLOAD] Timed out waiting for {video_path.name} to be rendered.", file=sys.stderr)
    return False


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("video", nargs="?", type=Path, help="Specific video to upload (optional)")
    parser.add_argument("--watch", action="store_true", help="Continuously watch episodes/ for new videos rendered onwards")
    parser.add_argument("--all-pending", action="store_true", help="When watching, also process any older unuploaded videos")
    parser.add_argument("--wait", action="store_true", help="Wait if video file does not exist yet")
    parser.add_argument("--platform", choices=("youtube", "telegram", "instagram", "facebook", "twitter", "linkedin", "threads", "both", "all"),
                        default="youtube", help="Target platform(s) to publish video (default: youtube)")
    parser.add_argument("--privacy", choices=("public", "private", "unlisted"), default="public",
                        help="YouTube upload privacy (default: public)")
    parser.add_argument("--force", action="store_true", help="Force upload even if already marked as uploaded in manifest")
    parser.add_argument("--timeout", type=float, default=1800, help="Max wait time in seconds (default: 30m)")
    args = parser.parse_args()

    if args.watch:
        watch_directory(args.privacy, platform=args.platform, force=args.force, all_pending=args.all_pending)
        return 0

    if not args.video:
        parser.error("Specify a video file to upload, or use --watch to monitor episodes/")

    target_video = (ROOT / args.video).resolve() if not args.video.is_absolute() else args.video.resolve()

    if args.wait or not target_video.exists():
        success = wait_and_upload(target_video, args.privacy, platform=args.platform, timeout=args.timeout, force=args.force)
        return 0 if success else 1

    if not is_file_ready(target_video, wait_seconds=1.0):
        print(f"File {target_video} is incomplete or currently being written.", file=sys.stderr)
        return 1

    if not args.force and is_already_uploaded(target_video, args.platform):
        print(f"⏭️  [AUTO-UPLOAD] {target_video.parent.name} is already uploaded to {args.platform.upper()}. Skipping.")
        return 0

    success = upload_video(target_video, args.privacy, platform=args.platform, force=args.force)
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
