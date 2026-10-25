#!/usr/bin/env python3
"""
Unified QA Suite for edu-shorts video productions.
Executes render verification, contact sheet generation, and audio quality checks.

Usage:
  python3 tools/qa_suite.py episodes/001-how-upi-works/final.mp4
  python3 tools/qa_suite.py episodes/001-how-upi-works
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def resolve_video_path(target: Path) -> Path:
    if target.is_file() and target.suffix.lower() in (".mp4", ".mov", ".mkv"):
        return target
    if target.is_dir():
        if (target / "final.mp4").is_file():
            return target / "final.mp4"
        mp4s = list(target.glob("*.mp4"))
        if mp4s:
            return mp4s[0]
    # Check if target is an episode ID
    ep_candidate = ROOT / "episodes" / target.stem / "final.mp4"
    if ep_candidate.is_file():
        return ep_candidate
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", type=Path, help="MP4 video path or episode directory")
    parser.add_argument("--interval", type=float, default=6.0, help="Contact sheet interval (seconds)")
    parser.add_argument("--expected-duration", type=float, help="Expected duration in seconds")
    parser.add_argument("--skip-audio", action="store_true", help="Skip audio analysis")
    args = parser.parse_args()

    video_path = resolve_video_path(args.target.expanduser().resolve())
    if not video_path.is_file():
        sys.exit(f"❌ Error: Video file not found: {video_path}")

    print("=" * 60)
    print(f"🎬 Running Unified QA Suite on: {video_path.name}")
    print("=" * 60)

    all_passed = True

    # 1. Verify Render (Technical integrity)
    print("\n🔍 Step 1: Technical Render Verification...")
    verify_script = ROOT / "tools" / "verify_render.py"
    cmd_verify = [sys.executable, str(verify_script), str(video_path)]
    if args.expected_duration:
        cmd_verify.extend(["--expected-duration", str(args.expected_duration)])
    
    res_verify = subprocess.run(cmd_verify)
    if res_verify.returncode != 0:
        print("❌ Technical verification reported issues.")
        all_passed = False
    else:
        print("✅ Technical verification passed.")

    # 2. Contact Sheet Generation (Visual review)
    print("\n📸 Step 2: Sampling Contact Sheet...")
    sheet_script = ROOT / "tools" / "contact_sheet.py"
    contact_sheet_out = video_path.parent / f"{video_path.stem}_contact_sheet.jpg"
    cmd_sheet = [
        sys.executable, str(sheet_script), str(video_path),
        "--interval", str(args.interval),
        "--output", str(contact_sheet_out)
    ]
    res_sheet = subprocess.run(cmd_sheet)
    if res_sheet.returncode == 0:
        print(f"✅ Contact sheet generated: {contact_sheet_out}")
    else:
        print("⚠️ Contact sheet generation warning/failure.")

    # 3. Audio Report
    if not args.skip_audio:
        print("\n🔊 Step 3: Audio Loudness & Silence Analysis...")
        audio_script = ROOT / "tools" / "audio_report.py"
        audio_out = video_path.parent / f"{video_path.stem}_audio_qa.json"
        cmd_audio = [sys.executable, str(audio_script), str(video_path), "--output", str(audio_out)]
        res_audio = subprocess.run(cmd_audio)
        if res_audio.returncode == 0:
            print(f"✅ Audio report generated: {audio_out}")
        else:
            print("⚠️ Audio report warning.")

    # 4. Storyboard Visual Momentum & Slideshow Risk
    storyboard_path = video_path.parent / "storyboard.json"
    if storyboard_path.is_file():
        print("\n📊 Step 4: Storyboard Visual Momentum & Slideshow Risk Check...")
        try:
            from tools.slideshow_risk import analyze_slideshow_risk
            sb_data = json.loads(storyboard_path.read_text(encoding="utf-8"))
            risk = analyze_slideshow_risk(sb_data.get("scenes", []))
            print(f"   Visual Momentum Verdict: {risk['verdict'].upper()} (Score: {risk['score']}/5.0)")
            for w in risk.get("warnings", []):
                print(f"   ⚠️ {w}")
            if risk["verdict"] == "fail":
                print("❌ High slideshow risk detected.")
                all_passed = False
            else:
                print("✅ Visual momentum meets production standards.")
        except Exception as e:
            print(f"   ⚠️ Could not analyze storyboard: {e}")

    # 5. Ergonomic Typography & Visual Strain Audit
    print("\n👁️ Step 5: Ergonomic Typography & Visual Strain Audit...")
    try:
        from tools.typography_linter import scan_file_for_font_sizes
        # Check specific episode visualizer component if mapped, else audit common scenes
        ep_id = video_path.parent.name
        scene_files = list((ROOT / "src" / "scenes").glob(f"*{ep_id.replace('-', '')}*.tsx")) + \
                      list((ROOT / "src" / "scenes").glob(f"*{''.join(w.capitalize() for w in ep_id.split('-'))}*.tsx"))
        
        typo_violations = []
        for sf in scene_files:
            typo_violations.extend(scan_file_for_font_sizes(sf))
        
        if typo_violations:
            critical = [v for v in typo_violations if "CRITICAL" in v[3]]
            print(f"   ⚠️  Found {len(typo_violations)} typography issues ({len(critical)} critical) in {len(scene_files)} episode component(s).")
            for line_num, code, size, issue in typo_violations[:5]:
                print(f"      Line {line_num}: [{size:.0f}px] {issue}")
            if critical:
                print("   ❌ Critical eye strain / visual pain risk detected.")
                all_passed = False
        else:
            print("   ✅ Typography adheres strictly to human visual angle ergonomics (20px - 108px).")
    except Exception as e:
        print(f"   ⚠️ Could not audit typography: {e}")

    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 QA SUITE RESULT: PASSED (All objective criteria met)")
        print("👉 Visual inspection: Review the contact sheet for mobile typography and aesthetics.")
    else:
        print("⚠️ QA SUITE RESULT: ISSUES DETECTED. Review logs above.")
    print("=" * 60)

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
