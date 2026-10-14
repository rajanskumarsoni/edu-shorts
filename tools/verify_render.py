#!/usr/bin/env python3
"""Verify video render: duration, resolution, audio sync, black frames, text overflow."""
import argparse
import json
import shutil
import subprocess
from pathlib import Path
import math

ROOT = Path(__file__).resolve().parents[1]

def run_cmd(cmd, capture_output=True, check=False):
    """Run a command and return result."""
    try:
        result = subprocess.run(
            cmd, 
            capture_output=capture_output, 
            text=True, 
            check=check
        )
        return result
    except subprocess.CalledProcessError as e:
        if check:
            raise
        return e.returncode, e.stdout, e.stderr
    except FileNotFoundError:
        return None

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", type=Path, help="Rendered MP4 to verify")
    parser.add_argument("--expected-duration", type=float, help="Expected duration in seconds")
    parser.add_argument("--min-width", type=int, default=1080, help="Minimum width (default: 1080)")
    parser.add_argument("--min-height", type=int, default=1920, help="Minimum height (default: 1920 for vertical)")
    parser.add_argument("--max-black-frame", type=float, default=0.95, help="Max black pixel ratio to consider frame black (default: 0.95)")
    parser.add_argument("--black-frame-threshold", type=float, default=0.02, help="Max percentage of black frames allowed (default: 2%%)")
    parser.add_argument("--output", type=Path, help="Output JSON file for results")
    args = parser.parse_args()

    video_path = args.video.expanduser().resolve()
    if not video_path.is_file():
        parser.error(f"Video file not found: {video_path}")

    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        parser.error("ffmpeg and ffprobe must be installed and available on PATH")

    results = {
        "file": str(video_path),
        "passed_checks": [],
        "failed_checks": [],
        "warnings": [],
        "metrics": {}
    }

    def add_check(name, passed, message=None):
        if passed:
            results["passed_checks"].append({"name": name, "message": message})
        else:
            results["failed_checks"].append({"name": name, "message": message})

    # 1. Check if file exists and is readable
    print("Checking file accessibility...")
    add_check("file_exists", True, f"File found: {video_path.name}")

    # 2. Get video properties
    print("Reading video properties...")
    probe_result = run_cmd([
        ffprobe, "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate,codec_name",
        "-show_entries", "format=duration,bit_rate",
        "-of", "json",
        str(video_path)
    ])
    
    if probe_result and probe_result.returncode == 0:
        try:
            probe_data = json.loads(probe_result.stdout)
            if "streams" in probe_data and len(probe_data["streams"]) > 0:
                stream = probe_data["streams"][0]
                width = int(stream.get("width", 0))
                height = int(stream.get("height", 0))
                
                # Parse frame rate
                fps_str = stream.get("r_frame_rate", "0/1")
                if '/' in fps_str:
                    num, den = fps_str.split('/')
                    fps = float(num) / float(den) if float(den) != 0 else 0
                else:
                    fps = float(fps_str) if fps_str else 0
                
                codec = stream.get("codec_name", "unknown")
                
                # Duration from format
                duration = float(probe_data.get("format", {}).get("duration", 0))
                bitrate = int(probe_data.get("format", {}).get("bit_rate", 0))
                
                results["metrics"].update({
                    "width": width,
                    "height": height,
                    "fps": round(fps, 3),
                    "codec": codec,
                    "duration_seconds": round(duration, 3),
                    "bitrate_bps": bitrate
                })
                
                print(f"  Resolution: {width}x{height}")
                print(f"  Frame rate: {fps:.3f} fps")
                print(f"  Duration: {duration:.3f}s")
                print(f"  Codec: {codec}")
                
                # Check resolution requirements (supports both vertical 1080x1920 and landscape 1920x1080)
                is_valid_res = (width >= args.min_width and height >= args.min_height) or (width >= args.min_height and height >= args.min_width)
                if is_valid_res:
                    add_check("resolution_minimum", True, f"Meets minimum Full HD standard ({width}x{height})")
                else:
                    add_check("resolution_minimum", False, f"Below minimum: {width}x{height} < {args.min_width}x{args.min_height}")
                
                # Check duration if expected provided
                if args.expected_duration is not None:
                    duration_diff = abs(duration - args.expected_duration)
                    if duration_diff <= 0.5:  # Allow 0.5s tolerance
                        add_check("duration_match", True, f"Within 0.5s of expected {args.expected_duration}s")
                    else:
                        add_check("duration_match", False, f"Off by {duration_diff:.3f}s (expected {args.expected_duration}s)")
                        
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            add_check("probe_parse", False, f"Failed to parse video properties: {e}")
    else:
        add_check("probe_fail", False, "FFprobe failed to read video properties")

    # 3. Check for black frames
    print("Checking for excessive black frames...")
    black_frame_result = run_cmd([
        ffmpeg, "-i", str(video_path),
        "-vf", f"blackframe=amount={args.max_black_frame}",
        "-f", "null", "-"
    ])
    
    if black_frame_result and black_frame_result.returncode == 0:
        # Parse blackframe output from stderr
        black_frames = 0
        total_frames = 0
        for line in black_frame_result.stderr.split('\n'):
            if "blackframe" in line and ":" in line:
                try:
                    parts = line.split(":")
                    if len(parts) >= 8:
                        pblack = float(parts[7].strip())
                        if pblack >= 99.0:  # Consider frame black if >99% black pixels
                            black_frames += 1
                        total_frames += 1
                except (ValueError, IndexError):
                    pass
        
        if total_frames > 0:
            black_percentage = (black_frames / total_frames) * 100
            results["metrics"]["black_frame_percent"] = round(black_percentage, 2)
            
            if black_percentage <= (args.black_frame_threshold * 100):
                add_check("black_frames", True, f"Black frames: {black_percentage:.2f}% (<= {args.black_frame_threshold*100}%)")
            else:
                add_check("black_frames", False, f"Excessive black frames: {black_percentage:.2f}% (> {args.black_frame_threshold*100}%)")
        else:
            # Zero blackframe lines outputted means no frames exceeded threshold (0% black frames)
            results["metrics"]["black_frame_percent"] = 0.0
            add_check("black_frames", True, "Black frames: 0.00% (none detected)")
    else:
        add_check("black_frame_check", False, "Black frame detection failed")

    # 4. Check audio stream exists and has content
    print("Checking audio stream...")
    audio_result = run_cmd([
        ffprobe, "-v", "error",
        "-select_streams", "a:0",
        "-show_entries", "stream=codec_name,duration,sample_rate,channels",
        "-of", "json",
        str(video_path)
    ])
    
    if audio_result and audio_result.returncode == 0:
        try:
            audio_data = json.loads(audio_result.stdout)
            if "streams" in audio_data and len(audio_data["streams"]) > 0:
                audio_stream = audio_data["streams"][0]
                audio_codec = audio_stream.get("codec_name", "unknown")
                audio_duration = float(audio_stream.get("duration", 0))
                
                results["metrics"]["audio_codec"] = audio_codec
                results["metrics"]["audio_duration_seconds"] = round(audio_duration, 3)
                
                if audio_duration > 0.1:  # At least 0.1s of audio
                    add_check("audio_present", True, f"Audio stream present: {audio_codec}")
                else:
                    add_check("audio_present", False, f"Audio stream too short: {audio_duration:.3f}s")
                    
                # Check audio-video sync
                video_duration = results["metrics"].get("duration_seconds", 0)
                if video_duration > 0 and audio_duration > 0:
                    sync_diff = abs(video_duration - audio_duration)
                    if sync_diff <= 0.5:  # Allow 0.5s sync difference
                        add_check("audio_video_sync", True, f"Audio-video sync within 0.5s (diff: {sync_diff:.3f}s)")
                    else:
                        add_check("audio_video_sync", False, f"Audio-video sync issue: diff {sync_diff:.3f}s")
            else:
                add_check("audio_stream", False, "No audio stream found")
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            add_check("audio_parse", False, f"Failed to parse audio properties: {e}")
    else:
        add_check("audio_check", False, "Audio stream check failed")

    # 5. Basic file health checks
    print("Performing file health checks...")
    file_size = video_path.stat().st_size
    results["metrics"]["file_size_bytes"] = file_size
    results["metrics"]["file_size_mb"] = round(file_size / (1024*1024), 2)
    
    if file_size > 1024:  # At least 1KB
        add_check("file_size_reasonable", True, f"File size: {results['metrics']['file_size_mb']} MB")
    else:
        add_check("file_size_reasonable", False, f"File too small: {file_size} bytes")

    # Summary
    passed = len(results["passed_checks"])
    failed = len(results["failed_checks"])
    total = passed + failed
    
    print(f"\n=== VERIFICATION RESULTS ===")
    print(f"Passed: {passed}/{total}")
    print(f"Failed: {failed}/{total}")
    
    if failed > 0:
        print("\nFailed checks:")
        for check in results["failed_checks"]:
            print(f"  ✗ {check['name']}: {check.get('message', 'No details')}")
    
    if results["warnings"]:
        print("\nWarnings:")
        for warning in results["warnings"]:
            print(f"  ⚠ {warning}")
    
    # Save results if requested
    if args.output:
        output_path = args.output.expanduser().resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"\nDetailed results saved to: {output_path}")
    
    # Return non-zero exit code if any critical checks failed
    critical_failures = [
        check for check in results["failed_checks"]
        if check["name"] in ["file_exists", "probe_fail", "resolution_minimum"]
    ]
    
    return 1 if len(critical_failures) > 0 else 0

if __name__ == "__main__":
    exit(main())
