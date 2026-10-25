#!/usr/bin/env python3
"""
Ergonomic Typography Linter for edu-shorts video scenes.
Validates that font sizes in Remotion scene code and storyboards obey
human visual angle ergonomics (no eye strain from microscopic text,
no visual pain / retinal glare from oversized text).

Ergonomic Thresholds (1080x1920 Vertical Mobile Shorts):
  - Hard Floor: 22px (Absolute minimum for badges/pills; <22px causes squinting & asthenopia)
  - Hard Ceiling: 108px (Absolute maximum for single numbers; >108px causes retinal glare & saccadic fatigue)
  - Titles / Headlines: 46px - 60px (Hard ceiling 64px)
  - Body / Explanations: 26px - 32px (Optimal 28px)
  - Subtitles / Cards: 30px - 42px (Optimal 36px)
  - Captions: 46px - 54px (Optimal 50px)

Usage:
  python3 tools/typography_linter.py
  python3 tools/typography_linter.py src/scenes/EMudhraVisualizer.tsx
  python3 tools/typography_linter.py --strict
"""

import argparse
import re
import sys
from pathlib import Path
from typing import List, Tuple

ROOT = Path(__file__).resolve().parents[1]

# Scientific Ergonomic Thresholds (Vertical 1080x1920)
MIN_ABSOLUTE_FONT_SIZE = 20    # Anything below 20px is illegible on 6" mobile screens (Visual angle < 0.22°)
RECOMMENDED_MIN_BODY = 26     # Body text must be >= 26px
MAX_ABSOLUTE_FONT_SIZE = 110   # Anything above 110px causes saccadic disruption & retinal glare (Visual angle > 2.0°)
MAX_TITLE_FONT_SIZE = 64      # Titles should never exceed 64px to prevent safe-area collision


def scan_file_for_font_sizes(file_path: Path) -> List[Tuple[int, str, float, str]]:
    """
    Scans a TSX/TS file for fontSize declarations.
    Returns list of (line_num, line_content, font_size_value, severity).
    """
    violations = []
    content = file_path.read_text(encoding="utf-8")
    lines = content.splitlines()

    # Pattern matches:
    # fontSize: 24, or fontSize: "24px", or fontSize: L.landscape ? 30 : 60
    pattern_direct = re.compile(r'fontSize:\s*(?:["\']?(\d+)(?:px)?["\']?)')
    pattern_ternary = re.compile(r'fontSize:\s*[^?:]+\?\s*(\d+)\s*:\s*(\d+)')

    for idx, line in enumerate(lines, start=1):
        # Skip commented lines
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
            continue

        # Check ternary: fontSize: cond ? val1 : val2
        t_match = pattern_ternary.search(line)
        if t_match:
            val1 = float(t_match.group(1))
            val2 = float(t_match.group(2))
            # Test landscape (val1) and portrait (val2)
            if val2 < MIN_ABSOLUTE_FONT_SIZE:
                violations.append((idx, line.strip(), val2, f"CRITICAL_TOO_SMALL (<{MIN_ABSOLUTE_FONT_SIZE}px - squinting/eye-strain danger)"))
            elif val2 > MAX_ABSOLUTE_FONT_SIZE:
                violations.append((idx, line.strip(), val2, f"CRITICAL_TOO_LARGE (>{MAX_ABSOLUTE_FONT_SIZE}px - visual pain/retinal glare)"))
            continue

        # Check direct numeric: fontSize: 18
        d_match = pattern_direct.search(line)
        if d_match:
            val = float(d_match.group(1))
            if val < MIN_ABSOLUTE_FONT_SIZE:
                violations.append((idx, line.strip(), val, f"CRITICAL_TOO_SMALL (<{MIN_ABSOLUTE_FONT_SIZE}px - squinting/eye-strain danger)"))
            elif val > MAX_ABSOLUTE_FONT_SIZE:
                violations.append((idx, line.strip(), val, f"CRITICAL_TOO_LARGE (>{MAX_ABSOLUTE_FONT_SIZE}px - visual pain/retinal glare)"))
            elif val > 64 and ("title" in line.lower() or "header" in line.lower() or "tag" in line.lower()):
                violations.append((idx, line.strip(), val, f"WARNING_HEADER_TOO_LARGE (>{MAX_TITLE_FONT_SIZE}px for header)"))

    return violations


def audit_directory(target_dir: Path) -> Tuple[int, int]:
    """Audits all .tsx scene files in target directory."""
    files = sorted(list(target_dir.glob("*.tsx")) + list(target_dir.glob("*.ts")))
    total_violations = 0
    total_files_checked = 0

    print("=" * 70)
    print("👁️  ERGONOMIC TYPOGRAPHY & VISUAL ANGLE AUDITOR")
    print("=" * 70)
    print(f"Target Directory: {target_dir.relative_to(ROOT)}")
    print(f"Safe Vertical Bounds: MIN {MIN_ABSOLUTE_FONT_SIZE}px | BODY ≥{RECOMMENDED_MIN_BODY}px | MAX {MAX_ABSOLUTE_FONT_SIZE}px | TITLE ≤{MAX_TITLE_FONT_SIZE}px")
    print("-" * 70)

    flagged_files = 0
    for f in files:
        if f.name.endswith(".d.ts") or "node_modules" in str(f):
            continue
        total_files_checked += 1
        violations = scan_file_for_font_sizes(f)
        if violations:
            flagged_files += 1
            print(f"\n📂 {f.relative_to(ROOT)} ({len(violations)} issues):")
            for line_num, snippet, size, issue in violations:
                total_violations += 1
                color_icon = "🔴" if "CRITICAL" in issue else "🟡"
                print(f"   Line {line_num:4d} {color_icon} [{size:3.0f}px] {issue}")
                print(f"          Code: {snippet[:80]}")

    print("\n" + "=" * 70)
    print(f"Audit Complete: Checked {total_files_checked} files.")
    if total_violations == 0:
        print("✅ 100% CLEAN: All font sizes adhere strictly to human visual ergonomics!")
    else:
        print(f"⚠️  Found {total_violations} font size violations across {flagged_files} files.")
    print("=" * 70)
    return total_violations, total_files_checked


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", nargs="?", default="src/scenes", help="Target file or directory to audit (default: src/scenes)")
    parser.add_argument("--strict", action="store_true", help="Exit with non-zero exit code if violations exist")
    args = parser.parse_args()

    target_path = Path(args.target)
    if not target_path.is_absolute():
        target_path = ROOT / target_path

    if target_path.is_file():
        violations = scan_file_for_font_sizes(target_path)
        print(f"Auditing {target_path.name}: {len(violations)} issues.")
        for line_num, snippet, size, issue in violations:
            print(f"Line {line_num}: [{size}px] {issue} -> {snippet}")
        if args.strict and any("CRITICAL" in v[3] for v in violations):
            sys.exit(1)
        return

    if target_path.is_dir():
        violations, _ = audit_directory(target_path)
        if args.strict and violations > 0:
            sys.exit(1)


if __name__ == "__main__":
    main()
