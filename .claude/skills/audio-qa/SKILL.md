---
name: audio-qa
description: >-
  Analyzes audio files for quality issues: loudness, silence detection, transcription accuracy.
  Use when the user wants to check audio quality, analyze narration, detect silence regions, or verify audio sync.
---

# audio-qa Skill

Analyzes audio files for production quality issues in educational video content.

## When to trigger
- "Check audio quality for X"
- "Analyze this narration file"
- "Is the audio loud enough?"
- "Find silence regions in this file"
- "Transcribe this audio"

## Tools available
- `tools/audio_report.py` - Main audio analysis tool
- `faster-whisper` - Transcription engine (installed in .venv)
- FFmpeg - Audio processing

## Quick usage
```bash
# Basic analysis
python3 tools/audio_report.py audio/topic/file.mp3

# With transcription
python3 tools/audio_report.py audio/topic/file.mp3 --transcribe

# Save results to JSON
python3 tools/audio_report.py audio/topic/file.mp3 --transcribe --output analysis/results.json
```

## What gets analyzed
1. **Duration and metadata**
   - Length in seconds
   - Sample rate, channels, codec
   - File size

2. **Loudness measurement**
   - EBU R128 loudness (LUFS)
   - Target: -16 LUFS for YouTube
   - True peak levels

3. **Silence detection**
   - Identifies regions below -50dB for 0.5s+
   - Reports start/end times and duration
   - Flags excessive dead air

4. **Waveform overview**
   - RMS values over time
   - Peaks and valleys

5. **Transcription (optional)**
   - Uses faster-whisper with "tiny" model
   - Returns text and timing
   - Good for verifying narration clarity

## Quality standards
- **Loudness**: -16 to -14 LUFS target
- **True peak**: Below -1.0 dBTP
- **Silence**: No regions > 2 seconds (except intentional pauses)
- **Transparency**: Transcription should match narration 90%+

## Common issues to flag
- Audio too quiet (below -20 LUFS)
- Audio too loud (above -10 LUFS)
- Plosives (popping sounds on P/B sounds)
- Background noise/hiss
- Uneven volume across segments
- Sync drift with video
