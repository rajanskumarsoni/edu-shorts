#!/usr/bin/env python3
"""
Headless Web Animation Recorder for edu-shorts video production.
Records standalone HTML/CSS/JS, p5.js, D3.js, GSAP, or Canvas animations
into broadcast-ready 1080x1920 (vertical) or 1920x1080 (landscape) MP4 clips
using Playwright and FFmpeg.

Usage:
  # Record an existing HTML animation:
  python3 tools/html_recorder.py record path/to/anim.html --duration 6.0 --out out.mp4

  # Import a HyperFrames-rendered scene into an episode:
  python3 tools/html_recorder.py import-video rendered.mp4 --episode my-episode --name scene-03

  # Scaffold a p5.js or D3 animation template:
  python3 tools/html_recorder.py template p5 --out anim_p5.html
  python3 tools/html_recorder.py template d3 --out anim_d3.html
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

TEMPLATES = {
    "p5_brush": """<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.jsdelivr.net/npm/p5@2.3.4/lib/p5.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/p5.brush@2.2.3/dist/p5.brush.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0B1020;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #canvas-container {
      width: 1080px;
      height: 1920px;
      position: relative;
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
      border-radius: 24px;
      box-shadow: 0 0 60px rgba(0, 240, 255, 0.2);
    }
  </style>
</head>
<body>
  <div id="canvas-container"></div>
  <script>
    let t = 0;
    function setup() {
      const cnv = createCanvas(1080, 1920, WEBGL);
      cnv.parent('canvas-container');
      brush.scaleBrushes(3.5);
    }

    function draw() {
      background('#0B1020');

      // Vector field waves
      brush.field("waves");

      // Watercolor background wash
      brush.fill("#00F0FF", 35);
      brush.fillBleed(0.25);
      brush.noStroke();
      brush.circle(0, -350 + Math.sin(t) * 20, 420);

      brush.fill("#A855F7", 30);
      brush.circle(0, 250 + Math.cos(t) * 20, 460);

      // Hand-drawn cross-hatching card
      brush.noField();
      brush.set("rotring", "#00F0FF", 1.2);
      brush.noFill();
      brush.hatch(14, 45 + Math.sin(t * 0.5) * 10);
      brush.rect(-380, -120, 760, 280);

      // Tactile graphite pencil curves
      brush.noHatch();
      brush.set("HB", "#FFFFFF", 2.0);
      brush.line(-420, 380, 420, 380);

      brush.set("2B", "#FFB800", 2.2);
      brush.spline([
        [-420, 620 + Math.sin(t) * 40],
        [-200, 520 + Math.cos(t) * 30],
        [0, 680 + Math.sin(t * 1.5) * 40],
        [200, 560 + Math.cos(t) * 30],
        [420, 720 + Math.sin(t) * 40]
      ]);

      t += 0.05;
    }
  </script>
</body>
</html>""",

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
        venv_py = ROOT / ".venv" / "bin" / "python"
        if venv_py.exists() and sys.executable != str(venv_py):
            os.execv(str(venv_py), [str(venv_py)] + sys.argv)
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


def import_video_asset(
    source_path: Path,
    episode_id: str,
    name: str,
    force: bool = False,
) -> Path:
    """Normalize an externally rendered visual clip into an episode's media folder."""
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", episode_id):
        raise ValueError("Episode ID must be a lowercase kebab-case name.")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name):
        raise ValueError("Asset name must be a lowercase kebab-case name without an extension.")

    episodes_dir = (ROOT / "episodes").resolve()
    episode_dir = (episodes_dir / episode_id).resolve()
    if episode_dir.parent != episodes_dir:
        raise ValueError("Episode path must be a direct child of episodes/.")
    storyboard_path = episode_dir / "storyboard.json"
    if not storyboard_path.is_file():
        raise FileNotFoundError(f"Episode storyboard not found: {storyboard_path}")

    try:
        storyboard = json.loads(storyboard_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid episode storyboard JSON: {exc}") from exc
    if not isinstance(storyboard, dict):
        raise ValueError("Episode storyboard JSON must contain an object at the root.")
    if storyboard.get("id") != episode_id:
        raise ValueError(
            f"Storyboard ID {storyboard.get('id')!r} does not match episode {episode_id!r}."
        )

    output_size = {
        "vertical": (1080, 1920),
        "landscape": (1920, 1080),
    }.get(storyboard.get("format", "vertical"))
    if output_size is None:
        raise ValueError("Episode format must be 'vertical' or 'landscape'.")

    source_path = Path(source_path).expanduser().resolve()
    if not source_path.is_file():
        raise FileNotFoundError(f"Rendered video not found: {source_path}")

    ffmpeg = shutil.which("ffmpeg")
    ffprobe = shutil.which("ffprobe")
    if not ffmpeg or not ffprobe:
        raise RuntimeError("Importing video requires both ffmpeg and ffprobe on PATH.")

    probe = subprocess.run(
        [
            ffprobe, "-v", "error", "-show_entries",
            "format=duration:stream=codec_type,width,height",
            "-of", "json", str(source_path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    metadata = json.loads(probe.stdout)
    video_streams = [
        stream for stream in metadata.get("streams", [])
        if stream.get("codec_type") == "video"
    ]
    if not video_streams:
        raise ValueError("Rendered asset contains no video stream.")

    try:
        duration = float(metadata["format"]["duration"])
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError("Could not determine the rendered asset duration.") from exc
    if not 0 < duration <= 180:
        raise ValueError(f"Rendered asset duration must be between 0 and 180 seconds; got {duration:.2f}.")

    media_dir = episode_dir / "media"
    media_dir.mkdir(parents=True, exist_ok=True)
    if media_dir.resolve().parent != episode_dir:
        raise ValueError("Episode media/ must resolve to a direct child of its episode directory.")
    output_path = media_dir / f"{name}.mp4"
    if source_path == output_path.resolve():
        raise ValueError("Input and output paths are the same; import from a separate export file.")
    if output_path.exists() and not force:
        raise FileExistsError(f"Asset already exists: {output_path} (pass --force to replace it)")

    width, height = output_size
    fd, temp_name = tempfile.mkstemp(
        prefix=f".{name}.", suffix=".tmp.mp4", dir=media_dir
    )
    os.close(fd)
    temp_path = Path(temp_name)
    try:
        subprocess.run(
            [
                ffmpeg, "-hide_banner", "-loglevel", "error", "-y",
                "-i", str(source_path),
                "-map", "0:v:0", "-an",
                "-vf",
                f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
                f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:color=black,"
                "fps=30,setsar=1",
                "-c:v", "libx264", "-preset", "fast", "-crf", "19",
                "-pix_fmt", "yuv420p", "-movflags", "+faststart",
                str(temp_path),
            ],
            check=True,
        )

        if force:
            os.replace(temp_path, output_path)
        else:
            try:
                os.link(temp_path, output_path)
            except FileExistsError:
                raise FileExistsError(
                    f"Asset already exists: {output_path} (pass --force to replace it)"
                ) from None
    finally:
        temp_path.unlink(missing_ok=True)

    print(
        f"Imported silent visual clip: {output_path.relative_to(ROOT)} "
        f"({width}x{height}, 30 fps, {duration:.2f}s)"
    )
    print("Reference it in storyboard.json with a scene of type 'video'.")
    return output_path


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

    # Import an externally rendered scene (for example, a HyperFrames export)
    p_import = subparsers.add_parser(
        "import-video",
        help="Normalize a rendered visual clip into an episode's media folder",
    )
    p_import.add_argument("input", help="Rendered MP4/WebM scene file")
    p_import.add_argument("--episode", required=True, help="Episode ID under episodes/")
    p_import.add_argument("--name", required=True, help="Output asset name, without extension")
    p_import.add_argument("--force", action="store_true", help="Replace an existing imported asset")

    # template
    p_tpl = subparsers.add_parser("template", help="Scaffold animation template")
    p_tpl.add_argument("type", choices=["p5", "p5_brush", "d3"], help="Template type")
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
    elif args.command == "import-video":
        import_video_asset(
            source_path=Path(args.input),
            episode_id=args.episode,
            name=args.name,
            force=args.force,
        )
    elif args.command == "template":
        out_file = Path(args.out)
        out_file.parent.mkdir(parents=True, exist_ok=True)
        out_file.write_text(TEMPLATES[args.type], encoding="utf-8")
        print(f"Created {args.type} animation template at {out_file}")


if __name__ == "__main__":
    main()
