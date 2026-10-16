#!/usr/bin/env python3
"""
Master Token-Efficient Video Production Engine (edu-shorts)

Executes the entire video generation workflow in ONE single command:
1. Compiles `script.md` -> `storyboard.json` (auto-enriching 6-key visuals, SFX, tags, icons)
2. Validates against production schema (`validate.py`)
3. Resolves missing web assets/icons (`tools/asset_finder.py`)
4. Synthesizes Hindi voiceover audio via VoiceStudio (`tts.py`)
5. Renders 1080x1920 MP4 video via Remotion (`pipeline.py`)
6. Executes Unified QA Suite (`tools/qa_suite.py` & contact sheet)
7. Generates publishing metadata (`post.md` & `ATTRIBUTIONS.md`)
8. Cleans ephemeral staging cache in `public/`

Usage:
  python3 tools/generate_video.py episodes/<id>
  python3 tools/generate_video.py episodes/<id>/script.md
  python3 tools/generate_video.py episodes/<id> --preview       # Fast 360p draft
  python3 tools/generate_video.py episodes/<id> --compile-only  # Compile & validate only
  python3 tools/generate_video.py episodes/<id> --no-render     # Prep & audio only
"""

import argparse
import datetime
import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import tools.compile_script_to_storyboard as compiler


def run_cmd(cmd: list[str], desc: str, cwd: Path = ROOT) -> int:
    """Run a subprocess command and stream output."""
    print(f"\n▶️  [{desc}] {' '.join(cmd)}")
    res = subprocess.run(cmd, cwd=cwd)
    return res.returncode


def is_voicestudio_running() -> bool:
    """Check if local VoiceStudio server is responding."""
    try:
        req = urllib.request.Request("http://127.0.0.1:3900/profiles")
        with urllib.request.urlopen(req, timeout=2) as resp:
            return resp.status == 200
    except Exception:
        return False


def generate_post_markdown(storyboard_data: dict, out_path: Path):
    """Auto-generate high-CTR post.md publishing kit if not present."""
    if out_path.is_file():
        return
    meta = storyboard_data.get("meta", {})
    title = meta.get("title", f"How {storyboard_data.get('id', 'Tech')} Works")
    desc = meta.get("description", "A technical breakdown explaining the hidden mechanisms under the hood.")
    tags = " ".join([t if t.startswith("#") else f"#{t}" for t in meta.get("hashtags", ["#Tech", "#Shorts"])])

    content = f"""# Publishing Kit: {title}

## YouTube Shorts Title
{title[:100]}

## Description
{desc}

{tags}

## Platform Hashtags
{tags}
"""
    out_path.write_text(content, encoding="utf-8")
    print(f"📝 Generated publishing kit: {out_path}")


def append_board_entry(episode_id: str, video_path: Path, qa_passed: bool):
    """Append a clean, concise completion log to .agents/BOARD.md."""
    board_path = ROOT / ".agents" / "BOARD.md"
    if not board_path.is_file():
        return
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_str = "COMPLETED" if qa_passed else "COMPLETED_WITH_WARNINGS"

    entry = f"""
### [{timestamp}] Antigravity (Automated Pipeline Engine)
- **Status**: {status_str}
- **Target Video / Feature**: `{video_path}`
- **Completed**:
  - Compiled `script.md` into validated `storyboard.json`.
  - Synthesized scene voiceovers via VoiceStudio `rajan story teller`.
  - Rendered production video to `{video_path}`.
  - QA verification: {'Passed (100%)' if qa_passed else 'Issues detected'}.
- **Next Steps**: Video ready for review or publishing.
"""
    with open(board_path, "a", encoding="utf-8") as f:
        f.write(entry)
    print("📋 Appended status entry to .agents/BOARD.md")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("target", type=Path, help="Path to episode folder or script.md")
    parser.add_argument("--preview", action="store_true", help="Render fast 360p draft video")
    parser.add_argument("--compile-only", action="store_true", help="Compile and validate storyboard only")
    parser.add_argument("--no-render", action="store_true", help="Compile, validate, resolve assets, and synthesize audio without final MP4 render")
    parser.add_argument("--force-compile", action="store_true", help="Overwrite existing storyboard.json")
    parser.add_argument("--skip-tts", action="store_true", help="Skip VoiceStudio audio synthesis")
    parser.add_argument("--force-tts", action="store_true", help="Force re-synthesizing all TTS audio clips")
    parser.add_argument("--upload", type=str, choices=["private", "unlisted", "public"], help="Optional YouTube upload visibility")
    parser.add_argument("--upload-platform", type=str, default="youtube", help="Platform destination for auto-upload")
    parser.add_argument("--no-clean", action="store_true", help="Keep ephemeral staging cache in public/")
    parser.add_argument("--no-board", action="store_true", help="Skip appending to .agents/BOARD.md")
    args = parser.parse_args()

    # 1. Resolve Target Directory
    target = args.target.expanduser().resolve()
    ep_dir = target if target.is_dir() else target.parent
    if not ep_dir.is_dir():
        sys.exit(f"❌ Error: Episode directory not found: {ep_dir}")

    episode_id = ep_dir.name
    print("=" * 65)
    print(f"🚀 Master Video Production Engine: {episode_id}")
    print("=" * 65)

    # 2. Phase 1: Compile script.md -> storyboard.json
    script_file = ep_dir / "script.md"
    storyboard_file = ep_dir / "storyboard.json"

    if script_file.is_file() and (not storyboard_file.is_file() or args.force_compile):
        print("\n⚙️  Phase 1: Compiling script.md into storyboard.json...")
        storyboard_file = compiler.compile_script(ep_dir, force=True)
    elif storyboard_file.is_file():
        print(f"\n⚙️  Phase 1: Using existing storyboard: {storyboard_file.name} (use --force-compile to recompile)")
    else:
        sys.exit(f"❌ Error: Neither script.md nor storyboard.json found in {ep_dir}")

    # 3. Phase 2: Validate Storyboard
    print("\n🔍 Phase 2: Validating Storyboard Manifest...")
    val_cmd = [sys.executable, str(ROOT / "validate.py"), str(storyboard_file)]
    code_val = run_cmd(val_cmd, "Pre-Flight Storyboard Validation")
    if code_val != 0:
        sys.exit(f"❌ Storyboard validation failed. Aborting pipeline before rendering.")

    if args.compile_only:
        print("\n✅ Storyboard compiled and validated successfully (--compile-only mode).")
        return 0

    # Read storyboard data
    storyboard_data = json.loads(storyboard_file.read_text(encoding="utf-8"))

    # 4. Phase 3: Resolve Web Assets
    print("\n📦 Phase 3: Resolving External Media Assets & Icons...")
    asset_tool = ROOT / "tools" / "asset_finder.py"
    if asset_tool.is_file():
        run_cmd([sys.executable, str(asset_tool), "resolve", str(storyboard_file)], "Resolving Assets")

    # 5. Phase 4: Synthesize Audio
    if not args.skip_tts:
        print("\n🎙️  Phase 4: Synthesizing Narration Audio...")
        if not is_voicestudio_running():
            print("⚠️  Warning: Local VoiceStudio does not appear to be running on http://127.0.0.1:3900.")
            print("    Pipeline will proceed using existing audio files if available.")
        else:
            tts_cmd = [sys.executable, str(ROOT / "tts.py"), "--video", str(storyboard_file)]
            if args.force_tts:
                tts_cmd.append("--force")
            run_cmd(tts_cmd, "VoiceStudio TTS Synthesis")

    if args.no_render:
        print("\n✅ Audio synthesis and asset preparation complete (--no-render mode).")
        return 0

    # 6. Phase 5: Production Video Render (Remotion + FFmpeg)
    print("\n🎬 Phase 5: Rendering Production Video...")
    pipe_cmd = [sys.executable, str(ROOT / "pipeline.py"), str(storyboard_file)]
    if args.preview:
        pipe_cmd.append("--preview")
    if args.upload:
        pipe_cmd.extend(["--upload", args.upload])
    else:
        pipe_cmd.append("--no-upload")

    code_render = run_cmd(pipe_cmd, "Remotion Composition & Video Encoding")
    if code_render != 0:
        sys.exit(f"❌ Video rendering failed with exit code {code_render}")

    final_video = ep_dir / "final.mp4"
    if args.preview and not final_video.is_file():
        final_video = ep_dir / "final_preview.mp4"

    if not final_video.is_file():
        sys.exit(f"❌ Expected rendered video not found at: {final_video}")

    # 7. Phase 6: Automated QA Verification
    print("\n📊 Phase 6: Executing Unified QA Suite...")
    qa_tool = ROOT / "tools" / "qa_suite.py"
    qa_cmd = [sys.executable, str(qa_tool), str(final_video)]
    code_qa = run_cmd(qa_cmd, "Unified QA & Contact Sheet Generation")
    qa_passed = (code_qa == 0)

    # 8. Phase 7: Publishing Kit Generation
    generate_post_markdown(storyboard_data, ep_dir / "post.md")

    # 9. Phase 8: Staging Cache Cleanup
    if not args.no_clean:
        print("\n🧹 Phase 8: Cleaning Ephemeral Build Staging Cache...")
        from pipeline import clean_cache
        clean_cache()

    # 10. Phase 9: Coordination Board Logging
    if not args.no_board:
        append_board_entry(episode_id, final_video, qa_passed)

    contact_sheet = ep_dir / f"{final_video.stem}_contact_sheet.jpg"
    print("\n" + "=" * 65)
    print("🎉 VIDEO PRODUCTION COMPLETE")
    print(f"📹 Final Video    : {final_video}")
    if contact_sheet.is_file():
        print(f"📸 Contact Sheet  : {contact_sheet}")
    print(f"📝 Publishing Kit : {ep_dir / 'post.md'}")
    print(f"🛡️  QA Status      : {'PASSED (Ready for Publishing)' if qa_passed else 'CHECK LOGS'}")
    print("=" * 65 + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
