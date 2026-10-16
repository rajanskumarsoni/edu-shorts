#!/bin/bash
# preview.sh - Fast 360p render for iteration; full quality only for final export

set -euo pipefail

# Configuration
QUALITY_MODE="${1:-fast}"  # fast or full
VIDEO_INPUT="${2:-}"       # Input video file or scene JSON
OUTPUT_DIR="${3:-scratch/preview}"

# Default settings
FAST_SETTINGS="--width 360 --height 640 --fps 24 --image-format png --codec libx264 --preset ultrafast --crf 28"
FULL_SETTINGS="--width 1080 --height 1920 --fps 30 --image-format png --codec libx264 --preset medium --crf 18"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Determine what we're rendering
if [[ -z "$VIDEO_INPUT" ]]; then
    echo "Usage: $0 [fast|full] <input_video_or_json> [output_dir]"
    echo "  fast:  Low-res 360p640 for quick iteration (default)"
    echo "  full:  Full quality 1080x1920 for final export"
    echo "  Examples:"
    echo "    $0 fast episodes/linear-search/storyboard.json"
    echo "    $0 full episodes/<id>/final.mp4 scratch/preview"
    exit 1
fi

# Select quality settings
if [[ "$QUALITY_MODE" == "fast" ]]; then
    SETTINGS="$FAST_SETTINGS"
    SUFFIX="preview"
    echo "🚀 Fast preview mode: 360x640 @ 24fps"
elif [[ "$QUALITY_MODE" == "full" ]]; then
    SETTINGS="$FULL_SETTINGS"
    SUFFIX="final"
    echo "🎬 Full quality mode: 1080x1920 @ 30fps"
else
    echo "Error: Quality mode must be 'fast' or 'full'"
    exit 1
fi

# Determine input type and render accordingly
if [[ "$VIDEO_INPUT" == *.json ]]; then
    # Render from Remotion scene JSON
    echo "📝 Rendering from scene composition: $VIDEO_INPUT"
    OUTPUT_FILE="$OUTPUT_DIR/$(basename "${VIDEO_INPUT%.json}")_${SUFFIX}.mp4"
    
    # Use remotion to render
    npx remotion render src/index.ts Video "$OUTPUT_FILE" $SETTINGS --input-props "$(cat "$VIDEO_INPUT")"
    
elif [[ "$VIDEO_INPUT" == *.mp4 ]] || [[ "$VIDEO_INPUT" == *.mov ]] || [[ "$VIDEO_INPUT" == *.avi ]]; then
    # Process existing video file
    echo "🎞️  Processing existing video: $VIDEO_INPUT"
    OUTPUT_FILE="$OUTPUT_DIR/$(basename "${VIDEO_INPUT%.*}")_${SUFFIX}.mp4"
    
    ffmpeg -i "$VIDEO_INPUT" $SETTINGS -y "$OUTPUT_FILE"
    
else
    echo "Error: Input must be a .json (Remotion composition) or video file"
    exit 1
fi

echo "✅ Render complete: $OUTPUT_FILE"

# Show file info
if command -v mediainfo >/dev/null 2>&1; then
    mediainfo "$OUTPUT_FILE"
else
    ffprobe -v error -show_entries format=duration,size,bit_rate -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_FILE"
fi

# For fast mode, also suggest opening for quick review
if [[ "$QUALITY_MODE" == "fast" ]]; then
    echo ""
    echo "💡 Tip: Open with quicklook or VLC for fast review:"
    echo "    open '$OUTPUT_FILE'  # macOS"
    echo "    vlc '$OUTPUT_FILE'   # cross-platform"
fi

exit 0
