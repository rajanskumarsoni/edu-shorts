#!/usr/bin/env python3
"""
Performance & Analytics Feedback Ledger for edu-shorts.
Logs and tracks short-form retention metrics across published episodes
(3-second hold %, Average Percentage Viewed (APV), saves, shares) to feed
winning hook formulas and pacing patterns back into script generation.

Usage:
  # Initialize or view analytics for an episode
  python3 tools/analytics_tracker.py log episodes/emudhra-security-leak --views 5400 --hold3s 68.5 --apv 82.4 --saves 320 --shares 185

  # Display the performance leaderboard & analytics insights
  python3 tools/analytics_tracker.py report

  # Export retention learnings for prompts/script.md
  python3 tools/analytics_tracker.py insights
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

ROOT = Path(__file__).resolve().parents[1]
EPISODES_DIR = ROOT / "episodes"
GLOBAL_LEDGER = EPISODES_DIR / ".analytics_ledger.json"


def load_global_ledger() -> List[Dict]:
    if GLOBAL_LEDGER.exists():
        try:
            return json.loads(GLOBAL_LEDGER.read_text(encoding="utf-8"))
        except Exception:
            return []
    return []


def save_global_ledger(data: List[Dict]):
    GLOBAL_LEDGER.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def get_episode_metadata(episode_dir: Path) -> Dict:
    meta = {
        "id": episode_dir.name,
        "title": episode_dir.name.replace("-", " ").title(),
        "hook": "",
        "duration_seconds": 0,
        "scenes_count": 0,
    }
    sb_file = episode_dir / "storyboard.json"
    if sb_file.exists():
        try:
            data = json.loads(sb_file.read_text(encoding="utf-8"))
            meta["title"] = data.get("meta", {}).get("title", meta["title"])
            scenes = data.get("scenes", [])
            meta["scenes_count"] = len(scenes)
            if scenes:
                meta["hook"] = scenes[0].get("narration", "")[:120]
                meta["duration_seconds"] = sum(s.get("seconds", 3) for s in scenes)
        except Exception:
            pass
    return meta


def log_episode_metrics(
    episode_path: Path,
    views: int,
    hold3s: float,
    apv: float,
    saves: int,
    shares: int,
    comments: int = 0,
    notes: str = "",
):
    if not episode_path.exists():
        print(f"❌ Error: Episode directory not found at {episode_path}")
        sys.exit(1)

    ep_meta = get_episode_metadata(episode_path)
    record = {
        "id": ep_meta["id"],
        "title": ep_meta["title"],
        "hook": ep_meta["hook"],
        "duration_seconds": ep_meta["duration_seconds"],
        "scenes_count": ep_meta["scenes_count"],
        "logged_at": datetime.now().isoformat(),
        "metrics": {
            "views": views,
            "hold_3s_percent": hold3s,
            "average_percentage_viewed": apv,
            "saves": saves,
            "shares": shares,
            "comments": comments,
            "share_to_save_ratio": round(shares / max(1, saves), 2),
            "engagement_rate": round(((saves + shares + comments) / max(1, views)) * 100, 2),
        },
        "notes": notes,
    }

    # Save to local episode folder: episodes/<id>/analytics.json
    ep_file = episode_path / "analytics.json"
    ep_file.write_text(json.dumps(record, indent=2, ensure_ascii=False), encoding="utf-8")

    # Update global ledger
    ledger = load_global_ledger()
    # Replace existing or append
    existing_idx = next((i for i, r in enumerate(ledger) if r["id"] == ep_meta["id"]), None)
    if existing_idx is not None:
        ledger[existing_idx] = record
    else:
        ledger.append(record)

    save_global_ledger(ledger)
    print(f"✅ Successfully logged analytics for '{ep_meta['id']}' to {ep_file.relative_to(ROOT)}")
    print(f"   Views: {views:,} | 3s Hold: {hold3s}% | APV: {apv}% | Saves: {saves} | Shares: {shares}")


def generate_report():
    ledger = load_global_ledger()
    if not ledger:
        print("ℹ️ No analytics records found in ledger. Use 'python3 tools/analytics_tracker.py log' to record data.")
        return

    print("=" * 80)
    print("📊 EDU-SHORTS PERFORMANCE & RETENTION LEADERBOARD")
    print("=" * 80)
    print(f"{'Episode ID':<30} | {'3s Hold':<8} | {'APV':<8} | {'Saves':<6} | {'Shares':<6} | {'Engage %':<8}")
    print("-" * 80)

    # Sort by APV (Average Percentage Viewed) descending
    sorted_ledger = sorted(ledger, key=lambda x: x["metrics"]["average_percentage_viewed"], reverse=True)
    for r in sorted_ledger:
        m = r["metrics"]
        print(
            f"{r['id']:<30} | {m['hold_3s_percent']:>6.1f}% | {m['average_percentage_viewed']:>6.1f}% | "
            f"{m['saves']:>6} | {m['shares']:>6} | {m['engagement_rate']:>7.2f}%"
        )
    print("=" * 80)


def generate_insights():
    ledger = load_global_ledger()
    if not ledger:
        print("ℹ️ Need at least 1 logged episode to generate actionable insights.")
        return

    high_performers = [r for r in ledger if r["metrics"]["average_percentage_viewed"] >= 75.0]
    print("💡 RETENTION INSIGHTS & SCRIPT RECOMMENDATIONS:")
    print("-" * 60)
    if high_performers:
        print(f"⭐ High-Retention Benchmark Episodes ({len(high_performers)}):")
        for hp in high_performers:
            print(f"   - {hp['id']} (APV: {hp['metrics']['average_percentage_viewed']}%, 3s Hold: {hp['metrics']['hold_3s_percent']}%)")
            print(f"     Winning Hook: \"{hp['hook'][:90]}...\"")
    else:
        print("📈 Target Benchmark: Aim for >70% 3s Hold and >80% APV on Instagram Reels.")
    print("-" * 60)


def main():
    parser = argparse.ArgumentParser(description="Performance & Retention Analytics Tracker")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Log command
    log_parser = subparsers.add_parser("log", help="Log episode metrics")
    log_parser.add_argument("episode", type=str, help="Path to episode directory (e.g. episodes/how-upi-works)")
    log_parser.add_argument("--views", type=int, default=0, help="Total view count")
    log_parser.add_argument("--hold3s", type=float, default=0.0, help="3-second hold rate percentage (0-100)")
    log_parser.add_argument("--apv", type=float, default=0.0, help="Average percentage viewed (0-100)")
    log_parser.add_argument("--saves", type=int, default=0, help="Total saves count")
    log_parser.add_argument("--shares", type=int, default=0, help="Total shares count")
    log_parser.add_argument("--comments", type=int, default=0, help="Total comments count")
    log_parser.add_argument("--notes", type=str, default="", help="Audience takeaways or A/B test notes")

    # Report command
    subparsers.add_parser("report", help="Display performance leaderboard")

    # Insights command
    subparsers.add_parser("insights", help="Display retention insights and prompt feedback")

    args = parser.parse_args()

    if args.command == "log":
        log_episode_metrics(
            Path(args.episode),
            views=args.views,
            hold3s=args.hold3s,
            apv=args.apv,
            saves=args.saves,
            shares=args.shares,
            comments=args.comments,
            notes=args.notes,
        )
    elif args.command == "report":
        generate_report()
    elif args.command == "insights":
        generate_insights()


if __name__ == "__main__":
    main()
