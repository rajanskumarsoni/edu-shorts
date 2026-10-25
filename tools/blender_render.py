#!/usr/bin/env python3
"""
Master Blender 3D Automation & MCP Pipeline Bridge (edu-shorts)

Connects Blender 5.x directly into the video generation pipeline:
1. Dual Execution: Live interactive socket (port 9876 via Blender MCP Runner / Addon)
   with automatic headless CLI fallback (blender -b).
2. Stage 1 & 4 Asset Pipeline: Convert any 3D format (OBJ, FBX, STL, DAE, BLEND)
   into optimized, centered, PBR-textured binary .glb models for Three.js in Remotion.
3. Stage 4 & 6 Video Assembly: Render photorealistic Cycles/EEVEE animations and
   high-res B-roll directly into episode media directories (1080x1920 vertical or 1920x1080 landscape).
4. Live Viewport Control: Screenshot capturing, scene inspection, and active scene GLB export.
5. Standard stdio MCP Server: Exposes rich tool calling for AI agents in .agents/mcp_servers.json.

Usage:
  python3 tools/blender_render.py status
  python3 tools/blender_render.py exec "import bpy; bpy.ops.mesh.primitive_monkey_add()"
  python3 tools/blender_render.py convert input.obj --out episodes/<id>/media/model.glb
  python3 tools/blender_render.py render scene.blend --out episodes/<id>/media/clip.mp4 --start 1 --end 90
  python3 tools/blender_render.py screenshot --out episodes/<id>/media/viewport.png
  python3 tools/blender_render.py --mcp
"""

import argparse
import base64
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Typical Blender executable locations on macOS / Linux / Windows
BLENDER_CANDIDATES = [
    shutil.which("blender"),
    "/opt/homebrew/bin/blender",
    "/Applications/Blender.app/Contents/MacOS/Blender",
    os.path.expanduser("~/Applications/Blender.app/Contents/MacOS/Blender"),
    "/usr/local/bin/blender",
    "/usr/bin/blender",
]

DEFAULT_HOST = os.environ.get("BLENDER_HOST", "localhost")
DEFAULT_PORT = int(os.environ.get("BLENDER_PORT", "9876"))


def find_blender() -> Path | None:
    """Finds installed Blender executable or returns None."""
    for cand in BLENDER_CANDIDATES:
        if cand and Path(cand).exists() and os.access(cand, os.X_OK):
            return Path(cand)
    return None


def get_blender_version(blender_bin: Path | None = None) -> str:
    """Returns blender version string."""
    blender_bin = blender_bin or find_blender()
    if not blender_bin:
        return "Not Installed"
    try:
        out = subprocess.check_output([str(blender_bin), "--version"], text=True)
        return out.splitlines()[0]
    except Exception as e:
        return f"Unknown Version ({e})"


def is_live_socket_alive(host: str = DEFAULT_HOST, port: int = DEFAULT_PORT, timeout: float = 0.5) -> bool:
    """Returns True if Blender MCP socket listener is active."""
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        return s.connect_ex((host, port)) == 0
    except Exception:
        return False
    finally:
        s.close()


def send_socket_command(cmd_dict: dict, host: str = DEFAULT_HOST, port: int = DEFAULT_PORT, timeout: float = 30.0) -> dict:
    """
    Sends a command dictionary to Blender MCP socket and returns parsed response.
    Supports both null-terminated JSON and newline/raw streaming JSON.
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        s.connect((host, port))
        payload = json.dumps(cmd_dict).encode("utf-8") + b"\0"
        s.sendall(payload)

        buffer = b""
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                chunk = s.recv(16384)
                if not chunk:
                    break
                buffer += chunk
                # Check for null-byte or valid JSON
                if b"\0" in buffer:
                    part = buffer.split(b"\0", 1)[0]
                    return json.loads(part.decode("utf-8"))
                try:
                    return json.loads(buffer.decode("utf-8"))
                except Exception:
                    continue
            except socket.timeout:
                break

        if buffer:
            clean = buffer.rstrip(b"\0").decode("utf-8", errors="replace")
            return json.loads(clean)
        return {"status": "error", "message": "No response received from Blender socket within timeout."}
    finally:
        s.close()


def execute_in_live_blender(code: str, host: str = DEFAULT_HOST, port: int = DEFAULT_PORT) -> dict:
    """Executes Python code directly in the active Blender GUI session via MCP socket."""
    # Send both 'execute' and 'execute_code' formats for cross-addon compatibility
    msg = {
        "type": "execute_code",
        "params": {"code": code},
        "code": code,
        "strict_json": False,
    }
    return send_socket_command(msg, host=host, port=port)


def execute_in_headless_blender(code: str, blender_bin: Path | None = None) -> tuple[int, str, str]:
    """Executes Python code in a headless Blender CLI instance."""
    blender_bin = blender_bin or find_blender()
    if not blender_bin:
        raise RuntimeError("Blender executable not found. Install via 'brew install --cask blender'.")

    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(code)
        script_path = Path(f.name)

    try:
        cmd = [str(blender_bin), "-b", "--python", str(script_path)]
        res = subprocess.run(cmd, capture_output=True, text=True)
        return res.returncode, res.stdout, res.stderr
    finally:
        if script_path.exists():
            script_path.unlink()


def execute_python(code: str, force_headless: bool = False, host: str = DEFAULT_HOST, port: int = DEFAULT_PORT) -> dict:
    """
    Hybrid Execution:
    1. Tries live Blender GUI if socket is alive (unless force_headless is True).
    2. Falls back seamlessly to headless Blender CLI.
    """
    if not force_headless and is_live_socket_alive(host=host, port=port):
        try:
            res = execute_in_live_blender(code, host=host, port=port)
            res["engine"] = "live_socket"
            return res
        except Exception as e:
            print(f"⚠️ Live socket execution failed ({e}), falling back to headless CLI...")

    # Headless execution fallback
    code_wrapped = f"""
import sys, io, traceback
import bpy

capture_buffer = io.StringIO()
sys_stdout = sys.stdout
sys.stdout = capture_buffer

try:
{chr(10).join('    ' + line for line in code.splitlines())}
    output = capture_buffer.getvalue()
    sys.stdout = sys_stdout
    print("===RESULT_START===")
    print(output)
    print("===RESULT_END===")
except Exception as e:
    sys.stdout = sys_stdout
    print("===ERROR_START===")
    print(traceback.format_exc())
    print("===ERROR_END===")
"""
    code_ret, stdout, stderr = execute_in_headless_blender(code_wrapped)
    output = ""
    error = ""
    if "===RESULT_START===" in stdout and "===RESULT_END===" in stdout:
        output = stdout.split("===RESULT_START===")[1].split("===RESULT_END===")[0].strip()
    if "===ERROR_START===" in stdout and "===ERROR_END===" in stdout:
        error = stdout.split("===ERROR_START===")[1].split("===ERROR_END===")[0].strip()

    if code_ret != 0 or error:
        return {
            "status": "error",
            "message": error or stderr or f"Process exited with code {code_ret}",
            "stdout": output,
            "engine": "headless_cli",
        }
    return {
        "status": "success",
        "result": output,
        "engine": "headless_cli",
    }


def is_valid_glb(file_path: Path) -> bool:
    """Checks if the file starts with the binary glTF magic header 'glTF'."""
    if not file_path.is_file() or file_path.stat().st_size < 12:
        return False
    with open(file_path, "rb") as f:
        return f.read(4) == b"glTF"


def convert_model_to_glb(
    input_file: Path,
    output_file: Path,
    normalize: bool = True,
    target_dim: float = 2.0,
    blender_bin: Path | None = None,
) -> Path:
    """
    Stage 1 & 4 Asset Converter:
    Converts CAD and 3D assets (OBJ, FBX, STL, DAE, BLEND, PLY) into clean,
    normalized, PBR-compatible binary .glb for Three.js WebGL scenes.
    """
    blender_bin = blender_bin or find_blender()
    if not blender_bin:
        raise RuntimeError("Blender is required for 3D model conversion. Install via 'brew install --cask blender'.")

    input_file = Path(input_file).resolve()
    output_file = Path(output_file).resolve()
    output_file.parent.mkdir(parents=True, exist_ok=True)

    if not input_file.exists():
        raise FileNotFoundError(f"Source 3D model not found: {input_file}")

    ext = input_file.suffix.lower()

    py_script = f"""
import bpy
import mathutils

# Reset scene
bpy.ops.wm.read_factory_settings(use_empty=True)

input_path = r"{input_file}"
ext = "{ext}"

# Import based on file extension
if ext == '.obj':
    try:
        bpy.ops.wm.obj_import(filepath=input_path)
    except Exception:
        bpy.ops.import_scene.obj(filepath=input_path)
elif ext == '.fbx':
    bpy.ops.import_scene.fbx(filepath=input_path)
elif ext == '.stl':
    try:
        bpy.ops.wm.stl_import(filepath=input_path)
    except Exception:
        bpy.ops.import_mesh.stl(filepath=input_path)
elif ext == '.dae':
    bpy.ops.wm.collada_import(filepath=input_path)
elif ext == '.blend':
    with bpy.data.libraries.load(input_path) as (data_from, data_to):
        data_to.objects = data_from.objects
    for obj in data_to.objects:
        if obj is not None:
            bpy.context.scene.collection.objects.link(obj)
elif ext == '.ply':
    try:
        bpy.ops.wm.ply_import(filepath=input_path)
    except Exception:
        bpy.ops.import_mesh.ply(filepath=input_path)
elif ext in ('.gltf', '.glb'):
    bpy.ops.import_scene.gltf(filepath=input_path)
else:
    raise ValueError(f"Unsupported 3D format: {ext}")

# Select all imported mesh objects
mesh_objs = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
if not mesh_objs:
    raise RuntimeError("No mesh objects found after import.")

bpy.ops.object.select_all(action='DESELECT')
for obj in mesh_objs:
    obj.select_set(True)
bpy.context.view_layer.objects.active = mesh_objs[0]

# Normalize geometry, origin, and scale
if {normalize}:
    # Join meshes if multiple components
    if len(mesh_objs) > 1:
        bpy.ops.object.join()
    
    active = bpy.context.active_object
    # Center origin to bounding box
    bpy.ops.object.origin_set(type='ORIGIN_CENTER_OF_VOLUME', center='BOUNDS')
    active.location = (0, 0, 0)
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    
    # Scale bounds to target dimension
    dims = active.dimensions
    max_d = max(dims.x, dims.y, dims.z)
    if max_d > 0.0001:
        scale_fac = {target_dim} / max_d
        active.scale = (scale_fac, scale_fac, scale_fac)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

# Export as binary glTF (.glb) with embedded textures and applied modifiers
bpy.ops.export_scene.gltf(
    filepath=r"{output_file}",
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_image_format='AUTO',
    export_materials='EXPORT',
    export_yup=True
)
print("SUCCESS_GLB_EXPORT")
"""

    print(f"📦 Converting {input_file.name} -> {output_file.name} via Blender...")
    code_ret, stdout, stderr = execute_in_headless_blender(py_script, blender_bin=blender_bin)

    if not output_file.exists() or not is_valid_glb(output_file):
        raise RuntimeError(f"Blender GLB conversion failed for {input_file.name}:\n{stderr or stdout}")

    size_mb = output_file.stat().st_size / (1024 * 1024)
    print(f"✅ Successfully converted: {output_file.name} ({size_mb:.2f} MB)")
    return output_file


def render_blend_file(
    blend_file: Path,
    output_path: Path,
    frame_start: int = 1,
    frame_end: int = 1,
    width: int = 1080,
    height: int = 1920,
    fps: int = 30,
    engine: str = "BLENDER_EEVEE_NEXT",
    samples: int = 64,
    blender_bin: Path | None = None,
) -> Path:
    """
    Stage 4 & 6 Video Production Engine:
    Renders high-definition animations or stills from a .blend scene file.
    Supports 1080x1920 (9:16 Shorts) or 1920x1080 (16:9 Landscape).
    """
    blender_bin = blender_bin or find_blender()
    if not blender_bin:
        raise RuntimeError("Blender executable not found. Install via 'brew install --cask blender'.")

    blend_file = Path(blend_file).resolve()
    output_path = Path(output_path).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if not blend_file.exists():
        raise FileNotFoundError(f"Blend file not found: {blend_file}")

    is_animation = frame_start != frame_end
    is_video_out = output_path.suffix.lower() in [".mp4", ".mov", ".mkv"]

    # Pre-render script to enforce output formats, resolution, FPS, and rendering engine
    setup_script = f"""
import bpy

scene = bpy.context.scene
scene.render.resolution_x = {width}
scene.render.resolution_y = {height}
scene.render.resolution_percentage = 100
scene.render.fps = {fps}

# Rendering engine selection
if "{engine}".upper() in ["CYCLES", "EEVEE", "BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"]:
    try:
        scene.render.engine = "{engine}"
    except Exception:
        scene.render.engine = "CYCLES"

if scene.render.engine == 'CYCLES':
    scene.cycles.samples = {samples}
    # Enable GPU compute if available
    try:
        cycles_prefs = bpy.context.preferences.addons['cycles'].preferences
        cycles_prefs.compute_device_type = 'METAL'
        scene.cycles.device = 'GPU'
    except Exception:
        pass

if {str(is_video_out).capitalize()}:
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'HIGH'
    scene.render.ffmpeg.ffmpeg_preset = 'GOOD'
else:
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

scene.render.filepath = r"{output_path}"
"""

    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(setup_script)
        script_path = Path(f.name)

    try:
        if is_animation:
            cmd = [
                str(blender_bin), "-b", str(blend_file),
                "--python", str(script_path),
                "-s", str(frame_start),
                "-e", str(frame_end),
                "-a"
            ]
            print(f"🎬 Rendering {blend_file.name} frames {frame_start}-{frame_end} ({width}x{height} @ {fps}fps)...")
        else:
            cmd = [
                str(blender_bin), "-b", str(blend_file),
                "--python", str(script_path),
                "-f", str(frame_start)
            ]
            print(f"🎨 Rendering {blend_file.name} frame {frame_start} ({width}x{height})...")

        subprocess.run(cmd, check=True)
        print(f"✅ Render complete: {output_path}")
        return output_path
    finally:
        if script_path.exists():
            script_path.unlink()


def capture_viewport_screenshot(output_path: Path, host: str = DEFAULT_HOST, port: int = DEFAULT_PORT) -> Path:
    """Captures a live screenshot of Blender's active 3D viewport."""
    output_path = Path(output_path).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if is_live_socket_alive(host=host, port=port):
        res = send_socket_command({"type": "get_viewport_screenshot", "params": {}}, host=host, port=port)
        if res.get("status") == "success" and "result" in res:
            img_b64 = res["result"].get("image") or res["result"].get("screenshot")
            if img_b64:
                output_path.write_bytes(base64.b64decode(img_b64))
                print(f"📸 Live viewport screenshot saved to {output_path}")
                return output_path

    # Fallback: render current active camera headlessly
    code = f"""
import bpy
bpy.context.scene.render.image_settings.file_format = 'PNG'
bpy.context.scene.render.filepath = r"{output_path}"
bpy.ops.render.render(write_still=True)
"""
    execute_python(code)
    print(f"📸 Viewport screenshot captured to {output_path}")
    return output_path


def export_active_scene_to_glb(output_path: Path, host: str = DEFAULT_HOST, port: int = DEFAULT_PORT) -> Path:
    """Exports the active Blender scene into an episode's media folder as .glb."""
    output_path = Path(output_path).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    code = f"""
import bpy
bpy.ops.export_scene.gltf(
    filepath=r"{output_path}",
    export_format='GLB',
    use_selection=False,
    export_apply=True
)
print("SUCCESS_EXPORT")
"""
    res = execute_python(code, host=host, port=port)
    if res.get("status") == "error":
        raise RuntimeError(f"Failed to export scene to GLB: {res.get('message')}")
    print(f"✨ Exported active Blender scene -> {output_path}")
    return output_path


def run_stdio_mcp_server():
    """
    Standard Model Context Protocol (MCP) Server for Blender 3D.
    Exposes high-level tools to AI coding agents via stdio JSON-RPC 2.0.
    """
    sys.stderr.write("🚀 Starting Blender MCP stdio server for edu-shorts...\n")
    sys.stderr.flush()

    tools = [
        {
            "name": "blender_status",
            "description": "Check Blender installation status, version, and live socket connection.",
            "inputSchema": {"type": "object", "properties": {}},
        },
        {
            "name": "blender_execute_python",
            "description": "Execute Python (bpy) code inside Blender (live GUI if open, or headless).",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "Python bpy code to execute."},
                    "force_headless": {"type": "boolean", "description": "Force headless CLI execution."},
                },
                "required": ["code"],
            },
        },
        {
            "name": "blender_convert_model",
            "description": "Convert 3D asset (OBJ, FBX, STL, DAE, BLEND) to optimized binary .glb for Three.js.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "input_file": {"type": "string", "description": "Path to input 3D model file."},
                    "output_file": {"type": "string", "description": "Target destination .glb path."},
                    "target_dim": {"type": "number", "description": "Target max bounding box scale (default 2.0)."},
                },
                "required": ["input_file", "output_file"],
            },
        },
        {
            "name": "blender_render_animation",
            "description": "Render animation or stills from a .blend file to MP4 or PNG.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "blend_file": {"type": "string", "description": "Path to .blend file."},
                    "output_path": {"type": "string", "description": "Output MP4 or PNG path."},
                    "frame_start": {"type": "integer", "default": 1},
                    "frame_end": {"type": "integer", "default": 1},
                    "width": {"type": "integer", "default": 1080},
                    "height": {"type": "integer", "default": 1920},
                },
                "required": ["blend_file", "output_path"],
            },
        },
        {
            "name": "blender_screenshot",
            "description": "Capture live viewport screenshot from Blender.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "output_path": {"type": "string", "description": "Target destination image path."},
                },
                "required": ["output_path"],
            },
        },
    ]

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except Exception:
            continue

        req_id = req.get("id")
        method = req.get("method")

        if method == "initialize":
            res = {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {"tools": {}},
                    "serverInfo": {"name": "edu-shorts-blender-mcp", "version": "1.0.0"},
                },
            }
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()
        elif method == "tools/list":
            res = {"jsonrpc": "2.0", "id": req_id, "result": {"tools": tools}}
            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()
        elif method == "tools/call":
            params = req.get("params", {})
            name = params.get("name")
            args = params.get("arguments", {})

            try:
                if name == "blender_status":
                    blender_bin = find_blender()
                    result_data = {
                        "blender_bin": str(blender_bin) if blender_bin else None,
                        "version": get_blender_version(blender_bin),
                        "live_socket_active": is_live_socket_alive(),
                        "socket_endpoint": f"{DEFAULT_HOST}:{DEFAULT_PORT}",
                    }
                elif name == "blender_execute_python":
                    result_data = execute_python(args.get("code", ""), force_headless=args.get("force_headless", False))
                elif name == "blender_convert_model":
                    out_path = convert_model_to_glb(
                        Path(args["input_file"]),
                        Path(args["output_file"]),
                        target_dim=args.get("target_dim", 2.0),
                    )
                    result_data = {"status": "success", "glb_path": str(out_path)}
                elif name == "blender_render_animation":
                    out_path = render_blend_file(
                        Path(args["blend_file"]),
                        Path(args["output_path"]),
                        frame_start=args.get("frame_start", 1),
                        frame_end=args.get("frame_end", 1),
                        width=args.get("width", 1080),
                        height=args.get("height", 1920),
                    )
                    result_data = {"status": "success", "video_path": str(out_path)}
                elif name == "blender_screenshot":
                    out_path = capture_viewport_screenshot(Path(args["output_path"]))
                    result_data = {"status": "success", "screenshot_path": str(out_path)}
                else:
                    raise ValueError(f"Unknown tool: {name}")

                res = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {"content": [{"type": "text", "text": json.dumps(result_data, indent=2)}]},
                }
            except Exception as e:
                res = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {"content": [{"type": "text", "text": f"Error: {e}"}], "isError": True},
                }

            sys.stdout.write(json.dumps(res) + "\n")
            sys.stdout.flush()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--mcp", action="store_true", help="Launch stdio MCP server for AI agent tool execution")

    subparsers = parser.add_subparsers(dest="command")

    # status
    subparsers.add_parser("status", help="Check Blender installation and live socket")

    # exec
    p_exec = subparsers.add_parser("exec", help="Execute Python code in Blender")
    p_exec.add_argument("code", help="Python code string or path to .py file")
    p_exec.add_argument("--headless", action="store_true", help="Force headless execution")

    # convert
    p_conv = subparsers.add_parser("convert", help="Convert 3D model (OBJ/FBX/STL/DAE/BLEND) to GLB")
    p_conv.add_argument("input", help="Source 3D file path")
    p_conv.add_argument("--out", required=True, help="Destination .glb path")
    p_conv.add_argument("--scale", type=float, default=2.0, help="Target max bounding dimension")

    # render
    p_rnd = subparsers.add_parser("render", help="Render .blend file to MP4 or PNG")
    p_rnd.add_argument("blend", help="Source .blend file path")
    p_rnd.add_argument("--out", required=True, help="Destination render output path (.mp4 or .png)")
    p_rnd.add_argument("--start", type=int, default=1, help="Start frame")
    p_rnd.add_argument("--end", type=int, default=1, help="End frame")
    p_rnd.add_argument("--width", type=int, default=1080, help="Output width (default 1080)")
    p_rnd.add_argument("--height", type=int, default=1920, help="Output height (default 1920)")
    p_rnd.add_argument("--engine", default="BLENDER_EEVEE_NEXT", help="CYCLES or BLENDER_EEVEE_NEXT")

    # screenshot
    p_shot = subparsers.add_parser("screenshot", help="Capture live viewport screenshot")
    p_shot.add_argument("--out", required=True, help="Output image path (.png)")

    # export
    p_exp = subparsers.add_parser("export", help="Export active Blender scene to GLB")
    p_exp.add_argument("--out", required=True, help="Output .glb path")

    args = parser.parse_args()

    if args.mcp:
        run_stdio_mcp_server()
        return

    blender_bin = find_blender()

    if args.command == "status" or not args.command:
        print("=" * 60)
        print("🧊 Blender 3D Pipeline Integration Status")
        print("=" * 60)
        if blender_bin:
            print(f"✅ Blender Executable : {blender_bin}")
            print(f"📦 Version            : {get_blender_version(blender_bin)}")
        else:
            print("❌ Blender Executable : NOT FOUND in standard paths.")
            print("   Install via: brew install --cask blender")

        socket_alive = is_live_socket_alive()
        print(f"🔌 MCP Live Socket    : {'🟢 CONNECTED (localhost:9876)' if socket_alive else '🟡 OFFLINE (Blender GUI closed or server not started)'}")
        if not socket_alive:
            print("   💡 Note: Pipeline automatically runs headless when GUI socket is offline.")
            print("   To start live socket: In Blender, press 'N' -> 'MCP for Blender' -> 'Start Server'.")
        print("=" * 60)

    elif args.command == "exec":
        code = args.code
        if Path(code).is_file():
            code = Path(code).read_text(encoding="utf-8")
        res = execute_python(code, force_headless=args.headless)
        print(json.dumps(res, indent=2))

    elif args.command == "convert":
        convert_model_to_glb(Path(args.input), Path(args.out), target_dim=args.scale, blender_bin=blender_bin)

    elif args.command == "render":
        render_blend_file(
            Path(args.blend),
            Path(args.out),
            frame_start=args.start,
            frame_end=args.end,
            width=args.width,
            height=args.height,
            engine=args.engine,
            blender_bin=blender_bin,
        )

    elif args.command == "screenshot":
        capture_viewport_screenshot(Path(args.out))

    elif args.command == "export":
        export_active_scene_to_glb(Path(args.out))


if __name__ == "__main__":
    main()
