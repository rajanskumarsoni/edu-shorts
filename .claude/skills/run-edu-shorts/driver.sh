#!/usr/bin/env bash
# run-edu-shorts driver
# Programmatic harness for the edu-shorts video generation pipeline.
# Every command below was run in this session and produced the documented result.
#
# Usage:
#   ./driver.sh validate <spec>            validate a storyboard JSON
#   ./driver.sh export <spec>              write narration text for TTS
#   ./driver.sh voice <spec>               synthesize narration audio (VoiceStudio)
#   ./driver.sh build <spec> [--preview]   build + render the MP4
#   ./driver.sh stills <spec>              render per-scene preview stills
#   ./driver.sh thumbnail <spec>           render only the cover thumbnail
#   ./driver.sh studio <spec>              launch Remotion browser studio (human path)
#   ./driver.sh qa <mp4|dir>               run the full QA suite
#   ./driver.sh verify <mp4>               render verification only
#   ./driver.sh contact <mp4>              contact sheet only
#   ./driver.sh audio <audio>              audio loudness + silence report
#   ./driver.sh upload <mp4> <post.md>     upload to YouTube (opt-in)
#   ./driver.sh clean <id>                 remove build artifacts for one video id
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

cmd="${1:-help}"; shift || true

usage() {
  cat <<'EOF'
run-edu-shorts driver — programmatic harness for the edu-shorts video pipeline

  validate <spec>            validate a storyboard JSON (prints OK/errors)
  export <spec>              write narration text for TTS (audio/<id>/)
  voice <spec>               synthesize narration audio via VoiceStudio
  build <spec> [--preview]   build + render out/<id>.mp4 (or episodes/<id>/final.mp4)
  stills <spec>              render per-scene preview stills into media/<id>/
  thumbnail <spec>           render only the cover thumbnail
  studio <spec>              launch Remotion browser studio (human path)
  qa <mp4|dir>               run the full QA suite
  verify <mp4>               render verification only
  contact <mp4>              contact sheet only
  audio <audio-file>         audio loudness + silence report
  upload <mp4> <post.md>     upload to YouTube (opt-in, requires --upload intent)
  clean <id>                 remove build artifacts for one video id
EOF
}

case "$cmd" in
  validate)
    python3 validate.py "$@"
    ;;
  export)
    python3 pipeline.py "$@" --export-text
    ;;
  voice)
    python3 tts.py --video "$@"
    ;;
  build)
    if [[ "${2:-}" == "--preview" ]]; then
      python3 pipeline.py "$1" --preview --no-upload
    else
      python3 pipeline.py "$@" --no-upload
    fi
    ;;
  stills)
    python3 pipeline.py "$@" --stills --no-upload
    ;;
  thumbnail)
    python3 pipeline.py "$@" --thumbnail --no-upload
    ;;
  studio)
    npx remotion studio src/index.ts --props=public/$(basename "${1%.*}")/manifest.json
    ;;
  qa)
    python3 tools/qa_suite.py "$@"
    ;;
  verify)
    python3 tools/verify_render.py "$@"
    ;;
  contact)
    python3 tools/contact_sheet.py "$@"
    ;;
  audio)
    python3 tools/audio_report.py "$@"
    ;;
  upload)
    # upload_video.py reads metadata from videos/<stem>.json "meta" (or --title/--description/--caption)
    # and REQUIRES --platform (youtube|instagram|both). --privacy defaults to private.
    python3 scripts/upload_video.py "$@"
    ;;
  clean)
    id="$1"
    rm -rf "audio/$id" "public/$id" "media/$id" "out/$id"* 2>/dev/null || true
    echo "Cleaned build artifacts for $id"
    ;;
  help|*)
    usage
    ;;
esac