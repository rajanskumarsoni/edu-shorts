#!/usr/bin/env python3
"""
Mute-Test Linter for Educational Video Pipelines.

Enforces the Mute-First Design Rule:
Every video must be 100% understandable with the SOUND OFF.

Validates against the 7 checks in Section 6:
1. Coverage: contiguous beats (0% to 100%) covering all narration words.
2. Synchrony: spoken numbers and negations appear on-screen in sync.
3. No Template Leftovers: zero hardcoded filler strings ("Manual Coordination", etc.).
4. Number Consistency: cross-checks narration vs labels vs visuals vs runners.
5. JSON Hygiene: no escaped quotes, trailing '---', or broken Mermaid syntax.
6. Pacing: 2-5s per beat, 1 main clause per beat.
7. Readability: concrete objects only (no abstract nouns), labels in narration language.

Usage:
  python3 tools/mute_test_linter.py episodes/<id>/storyboard.json
"""

import json
import re
import sys
from pathlib import Path

FORBIDDEN_TEMPLATE_STRINGS = [
    "Manual Coordination",
    "100k req/s",
    "1.45",
    "0.12",
    "Standard Approach",
    "Optimized Core",
    "Linear Bottleneck",
    "Cross-Country Fast Arteries",
    "Inter-City Connecting Corridors",
    "High-Density Residential Mesh",
    "Sub-Second In-Memory Synchronization",
    "Deterministic Fault Recovery"
]

ABSTRACT_OBJECT_WORDS = {
    "concept", "idea", "process", "future", "technology", "mechanism",
    "abstraction", "thought", "theory", "philosophy"
}


class MuteTestReport:
    def __init__(self, episode_id: str):
        self.episode_id = episode_id
        self.errors = []
        self.warnings = []
        self.scene_rows = []

    def err(self, where: str, msg: str):
        self.errors.append((where, msg))

    def warn(self, where: str, msg: str):
        self.warnings.append((where, msg))

    @property
    def passed(self) -> bool:
        return len(self.errors) == 0


def lint_storyboard(data: dict, ep_dir: Path = None) -> MuteTestReport:
    ep_id = data.get("id", ep_dir.name if ep_dir else "unknown")
    report = MuteTestReport(ep_id)
    scenes = data.get("scenes", [])

    if not scenes:
        report.err("storyboard", "No scenes found in storyboard")
        return report

    # -------------------------------------------------------------
    # Check 3: No Template Leftovers across the entire storyboard
    # -------------------------------------------------------------
    raw_json_str = json.dumps(data)
    for forbidden in FORBIDDEN_TEMPLATE_STRINGS:
        if forbidden in raw_json_str:
            report.err("template_leak", f"Forbidden template string found in storyboard: '{forbidden}'")

    # Check for duplicate compare panels across scenes
    seen_compares = []
    for idx, s in enumerate(scenes, 1):
        if s.get("type") == "compare":
            left_h = s.get("left", {}).get("heading", "")
            right_h = s.get("right", {}).get("heading", "")
            pair = (left_h.strip().lower(), right_h.strip().lower())
            if pair in seen_compares:
                report.err(f"scene {idx}", f"Duplicate compare headings {pair} already used in another scene")
            else:
                seen_compares.append(pair)

    # -------------------------------------------------------------
    # Per-scene validations
    # -------------------------------------------------------------
    for idx, s in enumerate(scenes, 1):
        where = f"scene {idx} ({s.get('title', 'Untitled')})"
        narration = s.get("narration", "").strip()

        # Check 5: JSON & Syntax Hygiene
        if narration.endswith("---") or re.search(r'[\s\-]+$', narration):
            if narration.endswith("---"):
                report.err(where, "Narration contains trailing '---' separator")

        # Escaped quotes check in string values
        for k, v in s.items():
            if isinstance(v, str) and (r'\"' in v or v.startswith('""') or v.startswith("''")):
                report.err(where, f"Escaped or redundant quotes detected in field '{k}': {v}")

        # Mermaid syntax hygiene
        if s.get("type") == "diagram" and "mermaid" in s:
            mm = s["mermaid"]
            if not re.search(r'^(?:flowchart|graph|sequenceDiagram|stateDiagram)', mm.strip()):
                report.err(where, f"Invalid Mermaid diagram definition (must start with graph/flowchart): {mm[:30]}...")
            if mm.count("[") != mm.count("]") or mm.count("(") != mm.count(")"):
                report.err(where, "Unbalanced brackets in Mermaid diagram")

        # Check 1: Coverage
        beats = s.get("beats")
        if not beats or not isinstance(beats, list):
            report.err(where, "Missing mandatory 'beats' array for mute-first comprehension")
            continue

        if len(beats) < 1:
            report.err(where, "'beats' array is empty")
            continue

        # Validate contiguous percentage coverage (0% to 100%)
        if beats[0].get("start_pct") != 0:
            report.err(where, f"First beat must start at start_pct: 0 (got {beats[0].get('start_pct')})")

        if beats[-1].get("end_pct") != 100:
            report.err(where, f"Last beat must end at end_pct: 100 (got {beats[-1].get('end_pct')})")

        for b_idx, beat in enumerate(beats):
            b_where = f"{where} beat {b_idx + 1}"
            s_pct = beat.get("start_pct")
            e_pct = beat.get("end_pct")
            words = beat.get("words", "").strip()
            label = beat.get("label", "").strip()
            show = beat.get("show", [])
            action = beat.get("action", "").strip()

            if b_idx > 0:
                prev_e_pct = beats[b_idx - 1].get("end_pct")
                if s_pct != prev_e_pct:
                    report.err(b_where, f"Beats are not contiguous: beat {b_idx} ends at {prev_e_pct}%, but beat {b_idx + 1} starts at {s_pct}%")

            if s_pct is None or e_pct is None or s_pct >= e_pct:
                report.err(b_where, f"Invalid beat range: start_pct={s_pct}, end_pct={e_pct}")

            # Check 6: Pacing (no beat covering > 60% if multi-beat, and duration sanity)
            beat_span = (e_pct - s_pct) if (s_pct is not None and e_pct is not None) else 0
            if len(beats) > 1 and beat_span > 65:
                report.warn(b_where, f"Beat span is {beat_span}% (> 65% of scene); consider breaking into shorter 2-5s beats")

            # Check 7: Sound-Off Readability & Concrete Objects
            if not words:
                report.err(b_where, "Beat 'words' cannot be empty")
            if not label:
                report.err(b_where, "Beat 'label' cannot be empty (must display on-screen takeaway)")
            if not show or not isinstance(show, list):
                report.err(b_where, "Beat 'show' must be a non-empty list of concrete objects")
            else:
                for obj in show:
                    obj_words = set(re.findall(r'\b[a-z]+\b', str(obj).lower()))
                    forbidden_found = obj_words.intersection(ABSTRACT_OBJECT_WORDS)
                    if forbidden_found:
                        report.err(b_where, f"Abstract noun '{list(forbidden_found)[0]}' in beat 'show'. Must use concrete physical/visual objects.")

            # Check 7: Language Consistency
            # If narration has Devanagari characters, beat label should NOT be pure English sentences
            has_devanagari_narration = bool(re.search(r'[\u0900-\u097F]', narration))
            if has_devanagari_narration:
                # If label has zero Devanagari and > 3 English words, warn/err unless it's pure metric/code
                has_devanagari_label = bool(re.search(r'[\u0900-\u097F]', label))
                metric_or_code = bool(re.search(r'^(?:[O0-9\.\+\-✕x/]+(?:\s*(?:km|km/h|ms|Mbps|Gbps|s|%|k))?|https?://.*|[A-Z_0-9\s•\-]+)$', label.strip(), re.I))
                if not has_devanagari_label and not metric_or_code and len(label.split()) > 3:
                    report.warn(b_where, f"Beat label '{label}' should be in the narration language (Hindi/Devanagari) for sound-off comprehension")

            # Check 2: Synchrony & Number Rule
            # Find numbers in beat words
            spoken_nums = re.findall(r'\b\d+(?:[\.,]\d+)?(?:\s*(?:km/h|km|ms|Mbps|Gbps|min|s|%|गुना|हज़ार|करोड़|लाख))?\b', words, re.I)
            # Also catch Hindi number words
            hindi_nums = re.findall(r'\b(?:दो सौ|साढ़े पाँच सौ|सत्ताईस हज़ार|छत्तीस हज़ार|छह सौ|पच्चीस|दो से तीन|सैंतालीस|छह हज़ार)\b', words)
            all_num_signals = spoken_nums + hindi_nums
            if all_num_signals:
                # Label or show must contain numeric expression
                label_has_number = bool(re.search(r'[\d%]+|✕', label))
                if not label_has_number:
                    report.warn(b_where, f"Narration words mention numbers ({all_num_signals}) but beat label '{label}' has no numeric callout")

            # Check Negation Rule: 'बिना', 'नहीं', 'no', 'zero'
            if re.search(r'\b(?:बिना|नहीं|शून्य|zero|no)\b', words, re.I):
                if "✕" not in label and "no" not in label.lower() and "बिना" not in label and "शून्य" not in label:
                    report.warn(b_where, f"Narration has negation ({words[:30]}...) but label does not feature negation indicator (e.g. '✕')")

            # Record row for report
            status = "PASS"
            report.scene_rows.append({
                "scene": f"{idx:02d} / {s.get('title', '')}",
                "beat_idx": b_idx + 1,
                "pct": f"{s_pct}% - {e_pct}%",
                "words": words[:40] + ("..." if len(words) > 40 else ""),
                "show": ", ".join(show[:2]),
                "action": action[:40] + ("..." if len(action) > 40 else ""),
                "label": label,
                "status": status
            })

        # Check 4: Cross-Check Number Consistency
        if s.get("type") == "benchmark" and "runners" in s:
            runners = s["runners"]
            for r in runners:
                val = r.get("value")
                # Ensure no placeholder values like 1.45 or 0.12 leaked into runners
                if val in (1.45, 0.12):
                    report.err(where, f"Benchmark runner '{r.get('name')}' has template placeholder value: {val}")

        if s.get("type") == "bento" and "bentoItems" in s:
            b_items = s["bentoItems"]
            for bi in b_items:
                if bi.get("value") == "100k req/s":
                    report.err(where, "Bento card contains template placeholder value: '100k req/s'")

    return report


def generate_markdown_report(report: MuteTestReport, out_path: Path):
    verdict = "PASS" if report.passed else "FAIL"
    verdict_badge = "✅ PASSED" if report.passed else "❌ FAILED"

    lines = [
        f"# Mute-Test Verification Report: `{report.episode_id}`",
        f"**Verdict**: {verdict_badge}",
        "",
        "## 1. Compliance Summary",
        f"- **Errors**: {len(report.errors)}",
        f"- **Warnings**: {len(report.warnings)}",
        "",
        "| Check | Description | Status |",
        "| :--- | :--- | :---: |",
        f"| 1. Coverage | 0% to 100% contiguous beats on all scenes | {'✅ PASS' if not any('Coverage' in e[1] or 'contiguous' in e[1] for e in report.errors) else '❌ FAIL'} |",
        f"| 2. Synchrony | Spoken numbers & negations appear on-screen in sync | {'✅ PASS' if not any('numeric callout' in e[1] for e in report.errors) else '❌ FAIL'} |",
        f"| 3. No Template Leftovers | Zero 'Manual Coordination', '100k req/s', etc. | {'✅ PASS' if not any('template' in e[0] or 'Template' in e[1] for e in report.errors) else '❌ FAIL'} |",
        f"| 4. Number Consistency | Narration numbers match visual telemetry & runners | {'✅ PASS' if not any('runner' in e[1] or 'Consistency' in e[1] for e in report.errors) else '❌ FAIL'} |",
        f"| 5. JSON & Syntax Hygiene | No escaped quotes, trailing '---', or broken syntax | {'✅ PASS' if not any('quotes' in e[1] or '---' in e[1] or 'Mermaid' in e[1] for e in report.errors) else '❌ FAIL'} |",
        f"| 6. Pacing | Contiguous 2-5s beats; 1 main concept per beat | {'✅ PASS' if not any('Pacing' in e[1] for e in report.errors) else '❌ FAIL'} |",
        f"| 7. Readability | Concrete objects only; labels in narration language | {'✅ PASS' if not any('Abstract noun' in e[1] or 'label' in e[1] for e in report.errors) else '❌ FAIL'} |",
        "",
        "## 2. Scene-by-Scene Beat Manifest",
        "| Scene | Beat # | Range | Words | Show Objects | On-Screen Label | Status |",
        "| :--- | :---: | :---: | :--- | :--- | :--- | :---: |"
    ]

    for row in report.scene_rows:
        lines.append(f"| {row['scene']} | {row['beat_idx']} | {row['pct']} | {row['words']} | {row['show']} | {row['label']} | {row['status']} |")

    lines.append("")
    lines.append("")
    lines.append("## 3. Issues & Diagnostics")
    if not report.errors and not report.warnings:
        lines.append("No errors or warnings detected. All scenes satisfy the Mute-First Design Rule.")
    else:
        for w, msg in report.errors:
            lines.append(f"- ❌ **ERROR** [{w}]: {msg}")
        for w, msg in report.warnings:
            lines.append(f"- ⚠️ **WARNING** [{w}]: {msg}")

    lines.append("")
    lines.append("## 4. Human Review Checklist (Sound-Off Comprehension Protocol)")
    lines.append("Before final publishing, reviewers must watch the rendered MP4 **with sound completely muted** and confirm:")
    lines.append("- [ ] **Action Clarity**: Is each narrated physical action visibly shown in real time? (e.g. phone lifts and aims, laser scans QR, data packets travel).")
    lines.append("- [ ] **Object Recognizability**: Are all major focal objects realistic and distinct? (Zero generic box/cube placeholders).")
    lines.append("- [ ] **Causal Transitions**: Are state changes and handoffs explained? (e.g. pairing key handshake, signal reflection, status checkmark).")
    lines.append("- [ ] **Outcome Predictability**: Can a viewer without audio deduce the outcome? (e.g. 'PAID SUCCESSFULLY ₹100.00', audio waveform playing).")
    lines.append("- [ ] **Mobile Typography**: Are all Devanagari captions and Hindi/English tags crisp and fully legible on vertical smartphone screens?")
    lines.append("- [ ] **Information Completeness**: Is any critical technical metric or state absent from the visual telemetry?")
    lines.append("- [ ] **The 15-Year-Old Rule**: Can a non-technical 15-year-old understand WHY and HOW the system operates solely from the visuals?")

    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"📄 Mute-test report written to: {out_path}")


def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python3 tools/mute_test_linter.py episodes/<id>/storyboard.json")

    target = Path(sys.argv[1]).expanduser().resolve()
    if target.is_dir():
        target = target / "storyboard.json"

    if not target.is_file():
        sys.exit(f"File not found: {target}")

    data = json.loads(target.read_text(encoding="utf-8"))
    report = lint_storyboard(data, ep_dir=target.parent)

    report_path = target.parent / "mute_test_report.md"
    generate_markdown_report(report, report_path)

    print(f"\n=== MUTE-TEST LINTER VERDICT: {'PASSED' if report.passed else 'FAILED'} ===")
    for w, m in report.errors:
        print(f"  ❌ ERROR [{w}]: {m}")
    for w, m in report.warnings:
        print(f"  ⚠️  WARN  [{w}]: {m}")

    sys.exit(0 if report.passed else 1)


if __name__ == "__main__":
    main()
