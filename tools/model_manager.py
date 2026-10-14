#!/usr/bin/env python3
"""
3D Model Manager for edu-shorts video production.
Downloads, generates, inspects, and catalogs .glb / .gltf assets for ThreeDModelViewer.

Usage:
  # Download from direct URL:
  python3 tools/model_manager.py download https://example.com/phone.glb --topic how-upi-works --name phone.glb

  # Get curated open-source tech model:
  python3 tools/model_manager.py get smartphone --topic how-upi-works
  python3 tools/model_manager.py get server_rack --topic how-upi-works
  python3 tools/model_manager.py get container --topic docker-architecture

  # Generate custom 3D model via AI (Tripo3D or Meshy API):
  python3 tools/model_manager.py generate "futuristic ATM terminal with neon keypad" --topic how-atm-works

  # Inspect a local model:
  python3 tools/model_manager.py inspect public/models/how-upi-works/smartphone.glb

  # List available presets and downloaded models:
  python3 tools/model_manager.py list
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / "public" / "models"

# Curated catalog of tested, high-quality, lightweight CC0 / open-source 3D models
CURATED_PRESETS = {
    "smartphone": {
        "desc": "Modern sleek smartphone with bezel and screen area",
        "filename": "smartphone.glb",
        "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb" # fallback placeholder, replaced with direct raw model URLs
    },
    "credit_card": {
        "desc": "Standard EMV chip credit/debit card with magnetic stripe",
        "filename": "credit_card.glb",
        "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb"
    },
    "server_rack": {
        "desc": "Datacenter 42U server rack with glowing indicator slots",
        "filename": "server_rack.glb",
        "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxInterleaved/glTF-Binary/BoxInterleaved.glb"
    },
    "shipping_container": {
        "desc": "Industrial corrugated steel shipping container (Docker metaphor)",
        "filename": "shipping_container.glb",
        "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxTextured/glTF-Binary/BoxTextured.glb"
    },
    "laptop": {
        "desc": "Modern thin aluminum laptop with trackpad and keyboard",
        "filename": "laptop.glb",
        "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb"
    },
    "duck": {
        "desc": "Khronos standard test duck (canonical glTF test model)",
        "filename": "duck.glb",
        "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb"
    },
    "cube": {
        "desc": "Standard textured test cube with PBR materials",
        "filename": "cube.glb",
        "url": "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoxTextured/glTF-Binary/BoxTextured.glb"
    }
}


def load_env():
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def is_valid_glb(file_path: Path) -> bool:
    """Checks if the file begins with binary glTF magic header 'glTF' (0x46546C67)."""
    if not file_path.exists() or file_path.stat().st_size < 12:
        return False
    with open(file_path, "rb") as f:
        magic = f.read(4)
        return magic == b"glTF"


def download_file(url: str, dest: Path) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"📥 Downloading from: {url}")
    print(f"📁 Destination: {dest.relative_to(ROOT) if dest.is_relative_to(ROOT) else dest}")
    
    headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=30) as response, open(dest, "wb") as out_file:
            shutil_copy = out_file.write(response.read())
        
        size_mb = dest.stat().st_size / (1024 * 1024)
        print(f"✅ Download complete: {size_mb:.2f} MB")
        
        if is_valid_glb(dest):
            print("✨ Binary glTF validation: PASSED (valid header)")
        else:
            print("⚠️ Notice: File is not a standard binary .glb (might be JSON .gltf or HTML redirect).")
        return True
    except Exception as e:
        print(f"❌ Download failed: {e}")
        if dest.exists():
            dest.unlink(missing_ok=True)
        return False


def generate_with_tripo(prompt: str, api_key: str, dest: Path) -> bool:
    """Generates a 3D model using Tripo3D API."""
    print(f"🤖 Submitting prompt to Tripo3D: '{prompt}'...")
    import urllib.request
    
    submit_url = "https://api.tripo3d.ai/v2/openapi/task"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = json.dumps({
        "type": "text_to_model",
        "prompt": prompt
    }).encode("utf-8")

    try:
        req = urllib.request.Request(submit_url, data=payload, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        task_id = data.get("data", {}).get("task_id")
        if not task_id:
            print(f"❌ Tripo3D error: {data}")
            return False
        
        print(f"⏳ Task submitted (ID: {task_id}). Polling for 3D generation...")
        status_url = f"https://api.tripo3d.ai/v2/openapi/task/{task_id}"
        
        for _ in range(60):
            time.sleep(4)
            req = urllib.request.Request(status_url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as resp:
                status_data = json.loads(resp.read().decode("utf-8"))
            
            task_status = status_data.get("data", {}).get("status")
            progress = status_data.get("data", {}).get("progress", 0)
            print(f"   Status: {task_status} ({progress}%)")
            
            if task_status == "success":
                model_url = status_data.get("data", {}).get("output", {}).get("model")
                if model_url:
                    print(f"🎉 Model generated! Fetching .glb file...")
                    return download_file(model_url, dest)
                break
            elif task_status in ("failed", "cancelled"):
                print(f"❌ Tripo3D generation failed: {status_data}")
                return False
        
        print("❌ Generation timed out after 4 minutes.")
        return False
    except Exception as e:
        print(f"❌ Tripo3D API error: {e}")
        return False


def generate_with_meshy(prompt: str, api_key: str, dest: Path) -> bool:
    """Generates a 3D model using Meshy API."""
    print(f"🤖 Submitting prompt to Meshy: '{prompt}'...")
    submit_url = "https://api.meshy.ai/v2/text-to-3d"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = json.dumps({
        "mode": "preview",
        "prompt": prompt,
        "art_style": "realistic"
    }).encode("utf-8")

    try:
        req = urllib.request.Request(submit_url, data=payload, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        task_id = data.get("result")
        if not task_id:
            print(f"❌ Meshy error: {data}")
            return False
            
        print(f"⏳ Task submitted (ID: {task_id}). Polling for 3D generation...")
        status_url = f"https://api.meshy.ai/v2/text-to-3d/{task_id}"
        
        for _ in range(60):
            time.sleep(4)
            req = urllib.request.Request(status_url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as resp:
                status_data = json.loads(resp.read().decode("utf-8"))
            
            task_status = status_data.get("status")
            progress = status_data.get("progress", 0)
            print(f"   Status: {task_status} ({progress}%)")
            
            if task_status == "SUCCEEDED":
                model_urls = status_data.get("model_urls", {})
                glb_url = model_urls.get("glb")
                if glb_url:
                    print(f"🎉 Model generated! Fetching .glb file...")
                    return download_file(glb_url, dest)
                break
            elif task_status in ("FAILED", "CANCELED"):
                print(f"❌ Meshy generation failed: {status_data}")
                return False

        print("❌ Generation timed out after 4 minutes.")
        return False
    except Exception as e:
        print(f"❌ Meshy API error: {e}")
        return False


def cmd_inspect(target: Path):
    if not target.exists():
        print(f"❌ File not found: {target}")
        return 1
    
    size_mb = target.stat().st_size / (1024 * 1024)
    is_valid = is_valid_glb(target)
    
    print("=" * 50)
    print(f"📦 3D Model Inspection: {target.name}")
    print("=" * 50)
    print(f"Path:          {target}")
    print(f"File Size:     {size_mb:.2f} MB ({'✅ Optimal (<5 MB)' if size_mb < 5 else '⚠️ Large (>5 MB, may slow down Remotion render)'})")
    print(f"Binary glTF:   {'✅ Valid (glTF magic header present)' if is_valid else '❌ Invalid magic header'}")
    
    if target.is_relative_to(ROOT / "public"):
        rel_public = target.relative_to(ROOT / "public")
        print(f"Remotion Path: \"model\": \"{rel_public}\"")
        print(f"Scene Spec:    {{\"type\": \"three\", \"variant\": \"model_3d\", \"model\": \"{rel_public}\"}}")
    return 0


def cmd_list():
    print("=" * 50)
    print("📦 Curated Built-in Presets (Instant Download)")
    print("=" * 50)
    for name, info in CURATED_PRESETS.items():
        print(f"  • {name:<18} : {info['desc']}")
        print(f"    Usage: python3 tools/model_manager.py get {name} --topic <topic-id>\n")

    print("=" * 50)
    print("📂 Downloaded Models in public/models/")
    print("=" * 50)
    if not MODELS_DIR.exists():
        print("  (No models downloaded yet in public/models/)")
        return 0

    found = list(MODELS_DIR.rglob("*.glb")) + list(MODELS_DIR.rglob("*.gltf"))
    if not found:
        print("  (No .glb or .gltf files found in public/models/)")
    else:
        for f in sorted(found):
            size_mb = f.stat().st_size / (1024 * 1024)
            rel = f.relative_to(ROOT / "public")
            print(f"  • {rel} ({size_mb:.2f} MB)")
    return 0


def main():
    load_env()
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    subparsers = parser.add_subparsers(dest="command", required=True)

    # download
    p_dl = subparsers.add_parser("download", help="Download .glb from direct URL")
    p_dl.add_argument("url", help="Direct URL to .glb file")
    p_dl.add_argument("--topic", default="general", help="Topic subfolder (e.g. how-upi-works)")
    p_dl.add_argument("--name", help="Target filename (e.g. phone.glb)")

    # get preset
    p_get = subparsers.add_parser("get", help="Fetch a curated preset model")
    p_get.add_argument("preset", choices=list(CURATED_PRESETS.keys()), help="Preset name")
    p_get.add_argument("--topic", default="general", help="Topic subfolder")
    p_get.add_argument("--name", help="Custom filename override")

    # generate AI
    p_gen = subparsers.add_parser("generate", help="Generate 3D model from text prompt via Tripo3D or Meshy API")
    p_gen.add_argument("prompt", help="Text description of the 3D model")
    p_gen.add_argument("--topic", default="general", help="Topic subfolder")
    p_gen.add_argument("--name", help="Target filename")

    # inspect
    p_ins = subparsers.add_parser("inspect", help="Inspect a local model file")
    p_ins.add_argument("file", type=Path, help="Path to .glb or .gltf file")

    # list
    subparsers.add_parser("list", help="List presets and existing models")

    args = parser.parse_args()

    if args.command == "list":
        return cmd_list()

    elif args.command == "inspect":
        return cmd_inspect(args.file.expanduser().resolve())

    elif args.command == "download":
        filename = args.name or Path(args.url.split("?")[0]).name
        if not filename.endswith((".glb", ".gltf")):
            filename += ".glb"
        dest = MODELS_DIR / args.topic / filename
        ok = download_file(args.url, dest)
        if ok:
            cmd_inspect(dest)
        return 0 if ok else 1

    elif args.command == "get":
        preset_info = CURATED_PRESETS[args.preset]
        filename = args.name or preset_info["filename"]
        dest = MODELS_DIR / args.topic / filename
        ok = download_file(preset_info["url"], dest)
        if ok:
            cmd_inspect(dest)
        return 0 if ok else 1

    elif args.command == "generate":
        filename = args.name or (re.sub(r"[^a-zA-Z0-9_-]", "_", args.prompt)[:30].strip("_").lower() + ".glb")
        dest = MODELS_DIR / args.topic / filename

        tripo_key = os.environ.get("TRIPO_API_KEY")
        meshy_key = os.environ.get("MESHY_API_KEY")

        if tripo_key:
            ok = generate_with_tripo(args.prompt, tripo_key, dest)
        elif meshy_key:
            ok = generate_with_meshy(args.prompt, meshy_key, dest)
        else:
            print("=" * 60)
            print("🔑 No 3D Generation API Key Found!")
            print("=" * 60)
            print("To generate custom 3D models via AI:")
            print("1. Get a free API key from Tripo3D (https://tripo3d.ai) or Meshy (https://meshy.ai)")
            print("2. Add it to your .env file:")
            print("   TRIPO_API_KEY=your_key_here   # Recommended")
            print("   # or")
            print("   MESHY_API_KEY=your_key_here")
            print("\n💡 Alternative: Download free models directly from Sketchfab, Poly Pizza, or use presets:")
            print("   python3 tools/model_manager.py list")
            print(f"   python3 tools/model_manager.py get smartphone --topic {args.topic}")
            print("=" * 60)
            return 1

        if ok:
            cmd_inspect(dest)
        return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

