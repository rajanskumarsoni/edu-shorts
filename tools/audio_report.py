#!/usr/bin/env python3
"""Analyze audio: loudness, silence detection, waveform, and transcript."""
import argparse
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def run_cmd(cmd, capture_output=True):
    """Run a command and return result."""
    try:
        result = subprocess.run(
            cmd, 
            capture_output=capture_output, 
            text=True, 
            check=True
        )
        return result
    except subprocess.CalledProcessError as e:
        print(f"Command failed: {' '.join(cmd)}")
        print(f"Error: {e.stderr}")
        return None
    except FileNotFoundError:
        print(f"Command not found: {cmd[0]}")
        return None

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("audio", type=Path, help="Audio file to analyze (WAV, MP3, etc.)")
    parser.add_argument("--transcribe", action="store_true", help="Generate transcript using faster-whisper")
    parser.add_argument("--output", type=Path, help="Output JSON file for results")
    args = parser.parse_args()

    audio_path = args.audio.expanduser().resolve()
    if not audio_path.is_file():
        parser.error(f"Audio file not found: {audio_path}")

    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        parser.error("ffmpeg and ffprobe must be installed and available on PATH")

    results = {
        "file": str(audio_path),
        "duration_seconds": 0,
        "loudness_lufs": None,
        "peak_level_db": None,
        "silence_regions": [],
        "waveform_data": None,
        "transcript": None
    }

    # Get duration and basic info
    print("Analyzing audio file...")
    info_result = run_cmd([
        ffprobe, "-v", "error", 
        "-show_entries", "format=duration:stream=codec_name,sample_rate,channels,bits_per_raw_sample", 
        "-of", "json", 
        str(audio_path)
    ])
    
    if info_result:
        info = json.loads(info_result.stdout)
        results["duration_seconds"] = float(info["format"]["duration"])
        if info["streams"]:
            stream = info["streams"][0]
            results["codec"] = stream.get("codec_name")
            results["sample_rate"] = int(stream.get("sample_rate", 0))
            results["channels"] = int(stream.get("channels", 0))
            results["bits_per_sample"] = stream.get("bits_per_raw_sample")

    # Measure loudness (EBU R128) using ffmpeg loudnorm
    print("Measuring loudness...")
    loudness_result = run_cmd([
        ffmpeg, "-i", str(audio_path),
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=summary",
        "-f", "null", "-"
    ], capture_output=False)  # loudnorm prints to stderr
    
    # Since loudnorm outputs to stderr, we need to capture it differently
    loudness_result = run_cmd([
        ffmpeg, "-i", str(audio_path),
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json",
        "-f", "null", "-"
    ])
    
    if loudness_result:
        try:
            # Parse the JSON output from loudnorm (it's in stderr)
            loudness_data = json.loads(loudness_result.stderr)
            results["loudness_lufs"] = loudness_data.get("input_i")
            results["loudness_range"] = loudness_data.get("input_lra")
            results["true_peak"] = loudness_data.get("input_tp")
        except (json.JSONDecodeError, AttributeError):
            pass

    # Detect silence regions
    print("Detecting silence...")
    silence_result = run_cmd([
        ffmpeg, "-i", str(audio_path),
        "-af", "silencedetect=n=-50dB:d=0.5",
        "-f", "null", "-"
    ])
    
    if silence_result:
        # Parse silence detection output from stderr
        silence_lines = silence_result.stderr.split('\n')
        silence_starts = []
        silence_ends = []
        for line in silence_lines:
            if "silence_start:" in line:
                time = float(line.split("silence_start:")[1].split()[0])
                silence_starts.append(time)
            elif "silence_end:" in line and "|" in line:
                parts = line.split("|")
                if len(parts) >= 2:
                    time_part = parts[0].split("silence_end:")[1].split()[0]
                    silence_ends.append(float(time_part))
        
        # Pair up silence regions
        for i in range(min(len(silence_starts), len(silence_ends))):
            results["silence_regions"].append({
                "start": silence_starts[i],
                "end": silence_ends[i],
                "duration": silence_ends[i] - silence_starts[i]
            })

    # Generate waveform data (simplified - just RMS values over time)
    print("Generating waveform overview...")
    # We'll create a simplified waveform by sampling RMS over intervals
    waveform_result = run_cmd([
        ffmpeg, "-i", str(audio_path),
        "-af", "astats=metadata=1:reset=1",
        "-f", "null", "-"
    ])
    
    # For now, we'll note that waveform analysis would require more complex processing
    results["waveform_note"] = "Full waveform analysis requires audio processing libraries"

    # Transcription using faster-whisper if requested
    if args.transcribe:
        print("Generating transcript with faster-whisper...")
        try:
            # Import faster-whisper from the venv
            import sys
            sys.path.insert(0, str(ROOT / ".venv" / "lib" / "python3.11" / "site-packages"))
            from faster_whisper import WhisperModel
            
            # Load model (use tiny for speed, can be configured)
            model = WhisperModel("tiny", device="cpu", compute_type="int8")
            
            # Transcribe
            segments, info = model.transcribe(str(audio_path), beam_size=5)
            
            transcript_text = " ".join([segment.text for segment in segments])
            results["transcript"] = transcript_text.strip()
            results["language"] = info.language
            results["language_probability"] = info.language_probability
            
        except ImportError:
            results["transcript_error"] = "faster-whisper not available in current environment"
        except Exception as e:
            results["transcript_error"] = f"Transcription failed: {str(e)}"

    # Output results
    if args.output:
        output_path = args.output.expanduser().resolve()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"Results saved to: {output_path}")
    else:
        print(json.dumps(results, indent=2))
    
    return 0

if __name__ == "__main__":
    exit(main())
