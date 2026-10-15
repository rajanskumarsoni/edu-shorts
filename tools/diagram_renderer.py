#!/usr/bin/env python3
"""
Diagram & Architecture Renderer for edu-shorts video production.
Converts Mermaid diagrams, Graphviz (DOT) architectures, and vector workflows
into crisp SVGs and high-resolution PNGs for video composition.

Supports:
- Mermaid: Flowcharts, sequence diagrams, git graphs, architecture topologies
- Graphviz: DOT syntax directed graphs, network topologies, finite state machines
- Automatic dark-mode / neon theme styling matching edu-shorts palette
- Headless execution with zero external CLI dependencies (uses REST fallback if mmdc/dot missing)
"""

import argparse
import base64
import json
import shutil
import subprocess
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
USER_AGENT = "EduShortsDiagramBot/1.0 (+https://github.com/edushorts/pipeline)"

# Dark cyberpunk / technical theme defaults matching edu-shorts
MERMAID_THEME_VARIABLES = {
    "darkMode": True,
    "background": "#0B1020",
    "primaryColor": "#1A233D",
    "primaryTextColor": "#FFFFFF",
    "primaryBorderColor": "#00F0FF",
    "lineColor": "#00F0FF",
    "secondaryColor": "#24194A",
    "tertiaryColor": "#10162B",
    "fontSize": "18px",
    "fontFamily": "Inter, system-ui, sans-serif",
}


def render_mermaid_svg(code: str, theme: dict = None) -> str:
    """Renders Mermaid diagram to SVG string using local mmdc or REST fallback."""
    code = code.strip().replace("\\n", "\n")

    # 1. Try local mmdc (Mermaid CLI) if installed
    mmdc_bin = shutil.which("mmdc")
    if mmdc_bin:
        with tempfile.TemporaryDirectory() as tmp_dir:
            in_file = Path(tmp_dir) / "diag.mmd"
            out_file = Path(tmp_dir) / "diag.svg"
            in_file.write_text(code, encoding="utf-8")
            cmd = [mmdc_bin, "-i", str(in_file), "-o", str(out_file), "-b", "transparent", "-t", "dark"]
            try:
                subprocess.run(cmd, check=True, capture_output=True, timeout=15)
                if out_file.exists():
                    return out_file.read_text(encoding="utf-8")
            except Exception as e:
                print(f"  [mmdc warning] {e}; falling back to cloud renderer")

    # 2. REST Render: mermaid.ink
    try:
        # Prepend mermaid theme configuration if not already configured
        theme_cfg = {
            "theme": "dark",
            "themeVariables": theme or MERMAID_THEME_VARIABLES,
        }
        mermaid_spec = {
            "code": code,
            "mermaid": theme_cfg,
        }
        encoded = base64.b64encode(json.dumps(mermaid_spec).encode("utf-8")).decode("ascii")
        url = f"https://mermaid.ink/svg/{encoded}"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=12) as resp:
            return resp.read().decode("utf-8")
    except Exception as e:
        # 3. Fallback to raw code on mermaid.ink
        try:
            raw_encoded = base64.b64encode(code.encode("utf-8")).decode("ascii")
            url = f"https://mermaid.ink/svg/{raw_encoded}"
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=12) as resp:
                return resp.read().decode("utf-8")
        except Exception as e2:
            raise RuntimeError(f"Failed to render Mermaid diagram: {e2}")


def render_graphviz_svg(dot_code: str) -> str:
    """Renders Graphviz DOT code to SVG string using local dot CLI or Kroki fallback."""
    dot_code = dot_code.strip().replace("\\n", "\n")

    # 1. Try local dot CLI
    dot_bin = shutil.which("dot") or "/opt/homebrew/bin/dot"
    if Path(dot_bin).exists():
        try:
            res = subprocess.run([dot_bin, "-Tsvg"], input=dot_code.encode("utf-8"), capture_output=True, timeout=10)
            if res.returncode == 0:
                return res.stdout.decode("utf-8")
        except Exception:
            pass

    # 2. REST Render: kroki.io
    try:
        req = urllib.request.Request(
            "https://kroki.io/graphviz/svg",
            data=dot_code.encode("utf-8"),
            headers={"Content-Type": "text/plain; charset=utf-8", "User-Agent": USER_AGENT},
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            return resp.read().decode("utf-8")
    except Exception as e:
        raise RuntimeError(f"Failed to render Graphviz diagram: {e}")


def convert_svg_to_png(svg_path: Path, png_path: Path, width: int = 1080, height: int = 1920) -> Path:
    """Converts SVG to PNG using Playwright or FFmpeg."""
    png_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": width, "height": height})
            page.set_content(
                f"""<!DOCTYPE html>
                <html>
                <body style="margin:0; background:#0B1020; display:flex; align-items:center; justify-content:center; height:100vh; overflow:hidden;">
                  <img src="file://{svg_path.resolve()}" style="max-width:90%; max-height:85%; object-fit:contain;" />
                </body>
                </html>"""
            )
            page.screenshot(path=str(png_path), full_page=False)
            browser.close()
            return png_path
    except Exception as e:
        # Fallback to FFmpeg if Playwright fails
        ffmpeg = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
        cmd = [ffmpeg, "-y", "-i", str(svg_path), "-vf", f"scale={width}:{height}:force_original_aspect_ratio=decrease", str(png_path)]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return png_path


def render_diagram(
    code: str,
    diagram_type: str = "mermaid",
    out_path: Path = None,
    format: str = "svg",
    width: int = 1080,
    height: int = 1920
) -> Path:
    """
    Renders diagram code (Mermaid or Graphviz) to SVG or PNG at out_path.
    """
    if diagram_type.lower() in ("mermaid", "mmd"):
        svg_content = render_mermaid_svg(code)
    elif diagram_type.lower() in ("graphviz", "dot"):
        svg_content = render_graphviz_svg(code)
    else:
        raise ValueError(f"Unsupported diagram type: {diagram_type}. Use 'mermaid' or 'graphviz'.")

    if not out_path:
        out_path = ROOT / "public" / "media" / f"diagram_{abs(hash(code)) % 100000}.{format}"
    else:
        out_path = Path(out_path)

    out_path.parent.mkdir(parents=True, exist_ok=True)

    if format.lower() == "svg":
        out_path.write_text(svg_content, encoding="utf-8")
        return out_path
    elif format.lower() == "png":
        temp_svg = out_path.with_suffix(".temp.svg")
        temp_svg.write_text(svg_content, encoding="utf-8")
        convert_svg_to_png(temp_svg, out_path, width=width, height=height)
        if temp_svg.exists():
            temp_svg.unlink()
        return out_path
    else:
        raise ValueError(f"Unsupported format: {format}. Use 'svg' or 'png'.")


def main():
    parser = argparse.ArgumentParser(description="Diagram & Architecture Renderer for edu-shorts.")
    parser.add_argument("--type", default="mermaid", choices=["mermaid", "graphviz", "dot"], help="Diagram engine")
    parser.add_argument("--code", help="Raw diagram code string")
    parser.add_argument("--file", help="Path to diagram code file (.mmd, .dot)")
    parser.add_argument("--out", required=True, help="Destination output path (.svg or .png)")
    parser.add_argument("--format", default="svg", choices=["svg", "png"], help="Output format")
    parser.add_argument("--width", type=int, default=1080)
    parser.add_argument("--height", type=int, default=1920)

    args = parser.parse_args()

    code = args.code
    if not code and args.file:
        code = Path(args.file).read_text(encoding="utf-8")
    if not code:
        raise SystemExit("Error: Must provide either --code or --file.")

    dtype = "graphviz" if args.type == "dot" else args.type
    out_file = render_diagram(
        code=code,
        diagram_type=dtype,
        out_path=Path(args.out),
        format=args.format,
        width=args.width,
        height=args.height,
    )
    print(f"SUCCESS: Rendered diagram to {out_file}")


if __name__ == "__main__":
    main()
