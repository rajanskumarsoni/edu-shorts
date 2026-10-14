#!/usr/bin/env python3
"""
Headless Web Animation Recorder for edu-shorts video production.
Records standalone HTML/CSS/JS, p5.js, D3.js, GSAP, or Canvas animations
into broadcast-ready 1080x1920 (vertical) or 1920x1080 (landscape) MP4 clips
using Playwright and FFmpeg.

Usage:
  # Record an existing HTML animation:
  python3 tools/html_recorder.py record path/to/anim.html --duration 6.0 --out out.mp4

  # Scaffold a p5.js or D3 animation template:
  python3 tools/html_recorder.py template p5 --out anim_p5.html
  python3 tools/html_recorder.py template d3 --out anim_d3.html
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

TEMPLATES = {
    "p5": """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
  <style>
    body { margin: 0; padding: 0; background: #0B1020; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; }
    canvas { border: 2px solid rgba(0, 240, 255, 0.4); border-radius: 20px; box-shadow: 0 0 50px rgba(0, 240, 255, 0.2); }
  </style>
</head>
<body>
<script>
let t = 0;
function setup() {
  createCanvas(900, 1500);
}
function draw() {
  background(11, 16, 32, 25);
  translate(width/2, height/2);
  stroke(0, 240, 255);
  strokeWeight(2);
  noFill();
  beginShape();
  for (let a = 0; a < TWO_PI; a += 0.05) {
    let r = 250 + sin(a * 6 + t) * 60 + cos(t * 2) * 30;
    let x = r * cos(a);
    let y = r * sin(a);
    vertex(x, y);
  }
  endShape(CLOSE);
  t += 0.04;
}
</script>
</body>
</html>""",

    "d3": """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body { margin: 0; padding: 0; background: #0B1020; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
    .node { fill: #00F0FF; filter: drop-shadow(0 0 10px #00F0FF); }
    .link { stroke: rgba(0, 240, 255, 0.3); stroke-width: 2px; }
  </style>
</head>
<body>
<svg width="1000" height="1600"></svg>
<script>
const svg = d3.select("svg");
const nodes = d3.range(30).map(i => ({ id: i, r: Math.random() * 12 + 8 }));
const links = d3.range(40).map(() => ({
  source: Math.floor(Math.random() * 30),
  target: Math.floor(Math.random() * 30)
}));
const sim = d3.forceSimulation(nodes)
  .force("charge", d3.forceManyBody().strength(-200))
  .force("center", d3.forceCenter(500, 800))
  .force("link", d3.forceLink(links).distance(120));

const link = svg.append("g").selectAll("line")
  .data(links).enter().append("line").attr("class", "link");
const node = svg.append("g").selectAll("circle")
  .data(nodes).enter().append("circle").attr("class", "node")
  .attr("r", d => d.r);

sim.on("tick", () => {
  link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
  node.attr("cx", d => d.x).attr("cy", d => d.y);
});
</script>
</body>
</html>"""
}


def record_html_animation(
    html_input: str,
    out_path: Path,
    duration: float = 5.0,
    fps: int = 30,
    width: int = 1080,
    height: int = 1920,
) -> Path:
    """
    Records an HTML file or URL using Playwright Chromium and normalizes to MP4.
    """
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    input_path = Path(html_input)
    if input_path.exists():
        target_url = f"file://{input_path.resolve()}"
    else:
        target_url = html_input

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        raise SystemExit("Error: Playwright is not installed. Install via pip install playwright.")

    ffmpeg = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"

    with tempfile.TemporaryDirectory() as tmp_dir:
        raw_rec_dir = Path(tmp_dir) / "recordings"
        raw_rec_dir.mkdir(parents=True, exist_ok=True)

        print(f"🎬 Launching Chromium to record: {target_url} ({width}x{height} @ {fps}fps, {duration}s)...")
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                record_video_dir=str(raw_rec_dir),
                record_video_size={"width": width, "height": height},
                viewport={"width": width, "height": height},
            )
            page = context.new_page()
            page.goto(target_url, wait_until="networkidle")

            # Allow animation to play for requested duration
            time.sleep(duration)

            context.close()
            browser.close()

        raw_videos = list(raw_rec_dir.glob("*.webm"))
        if not raw_videos:
            raise RuntimeError("Playwright recording failed: No output video produced.")

        raw_video = raw_videos[0]
        print(f"⚙️ Normalizing video with FFmpeg -> {out_path}...")

        # FFmpeg normalize to broadcast-compatible H.264, yuv420p, strict duration
        cmd = [
            ffmpeg, "-y",
            "-i", str(raw_video),
            "-t", str(duration),
            "-c:v", "libx264",
            "-r", str(fps),
            "-preset", "fast",
            "-crf", "19",
            "-pix_fmt", "yuv420p",
            "-an",
            str(out_path)
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    print(f"SUCCESS: Recorded HTML animation to {out_path}")
    return out_path


def main():
    parser = argparse.ArgumentParser(description="Headless Web Animation Recorder for edu-shorts.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # record
    p_rec = subparsers.add_parser("record", help="Record HTML animation to MP4")
    p_rec.add_argument("input", help="Path to HTML file or URL")
    p_rec.add_argument("--out", required=True, help="Destination MP4 video path")
    p_rec.add_argument("--duration", type=float, default=5.0, help="Recording duration in seconds")
    p_rec.add_argument("--fps", type=int, default=30, help="Frames per second")
    p_rec.add_argument("--width", type=int, default=1080)
    p_rec.add_argument("--height", type=int, default=1920)

    # template
    p_tpl = subparsers.add_parser("template", help="Scaffold animation template")
    p_tpl.add_argument("type", choices=["p5", "d3"], help="Template type")
    p_tpl.add_argument("--out", required=True, help="Destination HTML file path")

    args = parser.parse_args()

    if args.command == "record":
        record_html_animation(
            html_input=args.input,
            out_path=Path(args.out),
            duration=args.duration,
            fps=args.fps,
            width=args.width,
            height=args.height,
        )
    elif args.command == "template":
        out_file = Path(args.out)
        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_text(TEMPLATES[args.type], encoding="utf-8")
        print(f"Created {args.type} animation template at {out_file}")


if __name__ == "__main__":
    main()
