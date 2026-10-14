#!/usr/bin/env python3
"""
Headless Blender 3D Automation Engine for edu-shorts video production.
Allows AI agents to:
- Render .blend scenes headlessly to image frames or MP4 clips
- Convert CAD / 3D models (.obj, .fbx, .stl) to optimized .glb for Three.js
- Run headless Python scripts via Blender's `bpy` environment
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Typical Blender executable locations on macOS / Linux / Windows
BLENDER_CANDIDATES = [
    shutil.which("blender"),
    "/Applications/Blender.app/Contents/MacOS/Blender",
    "/usr/bin/blender",
    "/usr/local/bin/blender",
    os.path.expanduser("~/Applications/Blender.app/Contents/MacOS/Blender"),
]


def find_blender() -> Path:
    """Finds Blender executable or returns None."""
    for cand in BLENDER_CANDIDATES:
        if cand and Path(cand).exists() and os.access(cand, os.X_OK):
            return Path(cand)
    return None


def get_blender_version(blender_bin: Path) -> str:
    """Returns blender version string."""
    try:
        out = subprocess.check_output([str(blender_bin), "--version"], text=True)
        return out.splitlines()[0]
    except Exception:
        return "Unknown Version"


def convert_model_to_glb(input_file: Path, output_file: Path, blender_bin: Path = None) -> Path:
    """
    Uses headless Blender Python script to convert OBJ/FBX/STL to binary glTF (.glb).
    """
    blender_bin = blender_bin or find_blender()
    if not blender_bin:
        raise SystemExit(
            "Blender is not installed or not in PATH.\n"
            "To install on macOS: brew install --cask blender (or download from blender.org)"
        )

    input_file = Path(input_file).resolve()
    output_file = Path(output_file).resolve()
    output_file.parent.mkdir(parents=True, exist_ok=True)

    py_script = f"""
import bpy
import sys

# Clear existing objects
bpy.ops.wm.read_factory_settings(use_empty=True)

input_ext = '{input_file.suffix.lower()}'
if input_ext == '.obj':
    bpy.ops.wm.obj_import(filepath='{input_file}')
elif input_ext == '.fbx':
    bpy.ops.import_scene.fbx(filepath='{input_file}')
elif input_ext == '.stl':
    bpy.ops.wm.stl_import(filepath='{input_file}')

# Export as binary glTF (.glb)
bpy.ops.export_scene.gltf(
    filepath='{output_file}',
    export_format='GLB',
    use_selection=False,
    export_apply=True
)
print('SUCCESS_GLB_EXPORT')
"""

    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as f:
        f.write(py_script)
        script_path = Path(f.name)

    cmd = [str(blender_bin), "-b", "--python", str(script_path)]
    print(f"📦 Converting {input_file.name} to glTF binary via Blender -> {output_file.name}...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if script_path.exists():
        script_path.unlink()

    if output_file.exists():
        print(f"SUCCESS: Converted 3D model to {output_file}")
        return output_file
    else:
        raise RuntimeError(f"Blender conversion failed:\n{res.stderr or res.stdout}")


def render_blend_file(
    blend_file: Path,
    output_path: Path,
    frame_start: int = 1,
    frame_end: int = 1,
    blender_bin: Path = None
) -> Path:
    """
    Renders frames or animation from a .blend file.
    """
    blender_bin = blender_bin or find_blender()
    if not blender_bin:
        raise SystemExit("Blender is not installed. Install via brew install --cask blender.")

    blend_file = Path(blend_file).resolve()
    output_path = Path(output_path).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if frame_start == frame_end:
        # Single frame render
        cmd = [
            str(blender_bin), "-b", str(blend_file),
            "-o", str(output_path),
            "-f", str(frame_start)
        ]
    else:
        # Animation sequence
        cmd = [
            str(blender_bin), "-b", str(blend_file),
            "-s", str(frame_start),
            "-e", str(frame_end),
            "-o", str(output_path),
            "-a"
        ]

    print(f"🎨 Rendering {blend_file.name} frames {frame_start}-{frame_end} via Blender...")
    subprocess.run(cmd, check=True)
    return output_path


def main():
    parser = argparse.ArgumentParser(description="Headless Blender 3D Automation Engine.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # status
    subparsers.add_parser("status", help="Check Blender installation")

    # convert
    p_conv = subparsers.add_parser("convert", help="Convert 3D model (OBJ/FBX/STL) to GLB")
    p_conv.add_argument("input", help="Source 3D file path")
    p_conv.add_argument("--out", required=True, help="Destination .glb path")

    # render
    p_rnd = subparsers.add_parser("render", help="Render .blend file")
    p_rnd.add_argument("blend", help="Source .blend file path")
    p_rnd.add_argument("--out", required=True, help="Destination render output path")
    p_rnd.add_argument("--start", type=int, default=1, help="Start frame")
    p_rnd.add_argument("--end", type=int, default=1, help="End frame")

    args = parser.parse_args()
    blender = find_blender()

    if args.command == "status":
        if blender:
            print(f"Blender Found: {blender} ({get_blender_version(blender)})")
        else:
            print("Blender is NOT installed or not found in standard paths.")
            print("Install on macOS via: brew install --cask blender")
    elif args.command == "convert":
        convert_model_to_glb(Path(args.input), Path(args.out), blender_bin=blender)
    elif args.command == "render":
        render_blend_file(Path(args.blend), Path(args.out), frame_start=args.start, frame_end=args.end, blender_bin=blender)


if __name__ == "__main__":
    main()
