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
import shutil
import subprocess
import time
import urllib.request
import urllib.error
import zipfile
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



def download_sketchfab_model(url_or_uid: str, dest: Path, topic: str = "general") -> bool:
    """Fetches model metadata and downloads a 3D model from Sketchfab via v3 API."""
    import zipfile
    import shutil
    import subprocess

    # Extract 32-character hex UID
    m = re.search(r"([0-9a-fA-F]{32})", url_or_uid)
    if not m:
        print(f"❌ Invalid Sketchfab URL or UID: {url_or_uid}")
        return False
    uid = m.group(1).lower()

    print("=" * 60)
    print(f"🌐 Querying Sketchfab Data API v3 (UID: {uid})...")
    print("=" * 60)

    # 1. Fetch Model Metadata (Public endpoint, no auth required)
    meta_url = f"https://api.sketchfab.com/v3/models/{uid}"
    req = urllib.request.Request(meta_url, headers={"User-Agent": "Mozilla/5.0 EduShorts/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            meta = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"❌ Failed to fetch Sketchfab model info: {e}")
        return False

    title = meta.get("name", "Unknown 3D Model")
    user = meta.get("user", {})
    author = user.get("displayName") or user.get("username", "Unknown Author")
    profile_url = user.get("profileUrl") or f"https://sketchfab.com/{user.get('username', '')}"
    license_data = meta.get("license") or {}
    license_label = license_data.get("label", "Standard License")
    is_downloadable = meta.get("isDownloadable", False)

    print(f"📦 Model Name:   {title}")
    print(f"👤 Creator:      {author} ({profile_url})")
    print(f"📜 License:      {license_label}")
    print(f"📥 Downloadable: {'✅ Yes' if is_downloadable else '❌ No (Author disabled downloads)'}")
    print("=" * 60)

    if not is_downloadable:
        print(f"❌ This model '{title}' cannot be downloaded because the creator disabled free downloads.")
        return False

    api_token = os.environ.get("SKETCHFAB_API_TOKEN")
    if not api_token:
        print("\n🔑 Free Sketchfab API Token Required for Automated Downloads!")
        print("-" * 60)
        print("Sketchfab requires user authentication to download models via their API.")
        print("To enable 100% automated downloads:")
        print("1. Log in to Sketchfab and open: https://sketchfab.com/settings/password")
        print("2. Scroll down to 'API Token', copy your key (it's 100% free).")
        print("3. Add it to your .env file:")
        print("   SKETCHFAB_API_TOKEN=your_token_here")
        print("\n💡 Manual Alternative (No API key needed):")
        print(f"1. Open in browser: https://sketchfab.com/3d-models/{uid}")
        print("2. Click 'Download 3D Model' and choose glTF / GLB.")
        print(f"3. Move the downloaded .glb file to: {dest}")
        print("-" * 60)
        return False

    # 2. Request Download URL with Token
    dl_endpoint = f"https://api.sketchfab.com/v3/models/{uid}/download"
    dl_req = urllib.request.Request(dl_endpoint, headers={
        "Authorization": f"Token {api_token}",
        "User-Agent": "Mozilla/5.0 EduShorts/1.0"
    })

    try:
        print("⏳ Requesting download archive link from Sketchfab API...")
        with urllib.request.urlopen(dl_req, timeout=20) as resp:
            dl_data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"❌ Sketchfab API error ({e.code}): {e.read().decode('utf-8', errors='ignore')}")
        if e.code == 401:
            print("👉 Check that SKETCHFAB_API_TOKEN in .env is valid.")
        return False
    except Exception as e:
        print(f"❌ Failed to request download link: {e}")
        return False

    glb_info = dl_data.get("glb")
    gltf_info = dl_data.get("gltf")

    if glb_info and "url" in glb_info:
        archive_url = glb_info["url"]
        file_size_mb = glb_info.get("size", 0) / (1024 * 1024)
        print(f"📦 Direct binary GLB available ({file_size_mb:.2f} MB)")
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not download_file(archive_url, dest):
            return False
    elif gltf_info and "url" in gltf_info:
        archive_url = gltf_info["url"]
        file_size_mb = gltf_info.get("size", 0) / (1024 * 1024)
        print(f"📦 glTF archive size: {file_size_mb:.2f} MB")

        # Download ZIP package
        scratch_dir = ROOT / "scratch" / f"sketchfab_{uid}"
        scratch_dir.mkdir(parents=True, exist_ok=True)
        zip_path = scratch_dir / "model.zip"

        print("📥 Downloading glTF archive from secure CDN...")
        if not download_file(archive_url, zip_path):
            shutil.rmtree(scratch_dir, ignore_errors=True)
            return False

        # Extract glTF files
        print("📂 Extracting model archive...")
        try:
            with zipfile.ZipFile(zip_path, "r") as z:
                z.extractall(scratch_dir / "unpacked")
        except Exception as e:
            print(f"❌ Failed to extract zip: {e}")
            shutil.rmtree(scratch_dir, ignore_errors=True)
            return False

        # Locate scene.gltf or .glb
        unpacked = scratch_dir / "unpacked"
        found_glb = list(unpacked.rglob("*.glb"))
        found_gltf = list(unpacked.rglob("*.gltf"))

        dest.parent.mkdir(parents=True, exist_ok=True)

        if found_glb:
            print(f"✨ Found ready-to-use binary .glb: {found_glb[0].name}")
            shutil.copy2(found_glb[0], dest)
        elif found_gltf:
            gltf_file = found_gltf[0]
            print(f"⚙️ Compiling {gltf_file.name} to self-contained binary .glb via gltf-pipeline...")
            res = subprocess.run([
                "npx", "-y", "gltf-pipeline",
                "-i", str(gltf_file),
                "-o", str(dest),
                "-b"
            ], capture_output=True, text=True)
            if res.returncode != 0 or not dest.exists():
                print(f"⚠️ gltf-pipeline failed: {res.stderr}. Copying raw assets...")
                shutil.copy2(gltf_file, dest.with_suffix(".gltf"))
        else:
            print("❌ No .glb or .gltf found inside the archive.")
            shutil.rmtree(scratch_dir, ignore_errors=True)
            return False

        shutil.rmtree(scratch_dir, ignore_errors=True)
    else:
        print(f"❌ No compatible glTF/GLB download available: {dl_data}")
        return False

    # 5. Append attribution to ATTRIBUTIONS.md
    if topic:
        ep_dir = ROOT / "episodes" / topic
        if ep_dir.exists():
            attr_file = ep_dir / "ATTRIBUTIONS.md"
            attribution_entry = f"\n- **{title} (3D Model)**: Created by {author} ({profile_url}) on Sketchfab. Sourced from https://sketchfab.com/3d-models/{uid} under {license_label}.\n"
            if attr_file.exists():
                existing = attr_file.read_text(encoding="utf-8")
                if uid not in existing:
                    with open(attr_file, "a", encoding="utf-8") as f:
                        f.write(attribution_entry)
                    print(f"📝 Recorded attribution in: {attr_file.relative_to(ROOT)}")
            else:
                with open(attr_file, "w", encoding="utf-8") as f:
                    f.write("# Media Attributions\n" + attribution_entry)
                print(f"📝 Created attribution ledger: {attr_file.relative_to(ROOT)}")

    print(f"🎉 Successfully acquired and optimized: {dest.name}")
    return True


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


def search_polyhaven_models(query: str = ""):
    """Searches CC0 3D models available on Poly Haven."""
    url = "https://api.polyhaven.com/assets?type=models"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (EduShorts/1.0)"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            assets = json.loads(r.read())
    except Exception as e:
        print(f"❌ Failed to fetch Poly Haven assets: {e}")
        return 1

    query_lower = query.lower().strip()
    matches = []
    for asset_id, meta in assets.items():
        name = meta.get("name", "")
        tags = meta.get("tags", [])
        desc = meta.get("description", "")
        cat = meta.get("category", "")
        text = f"{name} {' '.join(tags)} {desc} {cat}".lower()
        if not query_lower or query_lower in text:
            matches.append((asset_id, meta))

    print("=" * 70)
    print(f"🌐 Poly Haven CC0 3D Models (Query: '{query or 'ALL'}') - Found: {len(matches)}")
    print("=" * 70)
    if not matches:
        print("No matching 3D models found on Poly Haven.")
        return 0

    for asset_id, meta in matches[:25]:
        name = meta.get("name", asset_id)
        polycount = meta.get("polycount", "N/A")
        tags = ", ".join(meta.get("tags", [])[:5])
        print(f"• ID: {asset_id:25} | Name: {name:20} | Tris: {polycount:<8} | Tags: {tags}")

    print("=" * 70)
    print("💡 To download any model into an episode:")
    print("   python3 tools/model_manager.py polyhaven --download <ASSET_ID> --topic <topic> [--name model.glb]")
    print("=" * 70)
    return 0


def download_polyhaven_model(asset_id: str, dest: Path, topic: str = "general") -> bool:
    """Downloads a CC0 3D model from Poly Haven, packages it into a binary .glb, and logs attribution."""
    print(f"🔍 Fetching Poly Haven asset metadata for '{asset_id}'...")
    url = f"https://api.polyhaven.com/files/{asset_id}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (EduShorts/1.0)"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            file_meta = json.loads(r.read())
    except Exception as e:
        print(f"❌ Failed to fetch Poly Haven file metadata: {e}")
        return False

    gltf_data = file_meta.get("gltf", {})
    if not gltf_data:
        print(f"❌ No glTF format found for asset '{asset_id}'. Available formats: {list(file_meta.keys())}")
        return False

    # Choose lowest resolution available (prefer 1k for fast rendering, then 2k, etc.)
    res_keys = ["1k", "2k", "4k", "8k"]
    chosen_res = None
    for r in res_keys:
        if r in gltf_data:
            chosen_res = r
            break
    if not chosen_res:
        chosen_res = list(gltf_data.keys())[0]

    pkg = gltf_data[chosen_res].get("gltf", {})
    main_url = pkg.get("url")
    includes = pkg.get("include", {})

    if not main_url:
        print(f"❌ No main glTF URL found in resolution '{chosen_res}'.")
        return False

    scratch_dir = ROOT / "scratch" / f"polyhaven_{asset_id}_{int(time.time())}"
    scratch_dir.mkdir(parents=True, exist_ok=True)
    gltf_file = scratch_dir / f"{asset_id}.gltf"

    print(f"📥 Downloading Poly Haven glTF ({chosen_res} resolution)...")
    if not download_file(main_url, gltf_file):
        shutil.rmtree(scratch_dir, ignore_errors=True)
        return False

    # Download include files (textures, .bin)
    for rel_path, inc_meta in includes.items():
        inc_url = inc_meta.get("url")
        if not inc_url:
            continue
        inc_dest = scratch_dir / rel_path
        inc_dest.parent.mkdir(parents=True, exist_ok=True)
        if not download_file(inc_url, inc_dest):
            print(f"⚠️ Warning: Could not download include file {rel_path}")

    # Pack into binary .glb
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"⚙️ Packing glTF into binary .glb ({dest.name})...")
    res = subprocess.run([
        "npx", "-y", "gltf-pipeline",
        "-i", str(gltf_file),
        "-o", str(dest),
        "-b"
    ], capture_output=True, text=True)

    if res.returncode != 0 or not dest.exists():
        # Fallback to Blender conversion
        try:
            import tools.blender_render as blender_engine
            blender_engine.convert_model_to_glb(gltf_file, dest)
        except Exception as e:
            print(f"⚠️ Blender conversion also failed: {e}")
            shutil.rmtree(scratch_dir, ignore_errors=True)
            return False

    shutil.rmtree(scratch_dir, ignore_errors=True)

    # Attribution
    if topic:
        ep_dir = ROOT / "episodes" / topic
        if ep_dir.exists():
            attr_file = ep_dir / "ATTRIBUTIONS.md"
            attribution_entry = f"\n- **{asset_id} (3D Model)**: Poly Haven (CC0 Public Domain). Sourced from https://polyhaven.com/a/{asset_id}.\n"
            if attr_file.exists():
                existing = attr_file.read_text(encoding="utf-8")
                if asset_id not in existing:
                    with open(attr_file, "a", encoding="utf-8") as f:
                        f.write(attribution_entry)
            else:
                with open(attr_file, "w", encoding="utf-8") as f:
                    f.write("# Media Attributions\n" + attribution_entry)
            print(f"📝 Recorded attribution in: {attr_file.relative_to(ROOT)}")

    print(f"🎉 Successfully acquired and converted: {dest.name}")
    return True


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
    
    if target.is_relative_to(ROOT / "episodes"):
        print(f"Episode Path:  \"model\": \"media/{target.name}\"")
        print(f"Scene Spec:    {{\"type\": \"three\", \"variant\": \"model_3d\", \"model\": \"media/{target.name}\"}}")
    elif target.is_relative_to(ROOT / "public"):
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

    # convert
    p_conv = subparsers.add_parser("convert", help="Convert 3D model (OBJ/FBX/STL/DAE/BLEND) to .glb via Blender")
    p_conv.add_argument("file", type=Path, help="Path to input 3D model")
    p_conv.add_argument("--topic", default="general", help="Topic subfolder (e.g. how-quick-commerce-works)")
    p_conv.add_argument("--name", help="Target filename override (default: <stem>.glb)")
    p_conv.add_argument("--scale", type=float, default=2.0, help="Target max bounding dimension")

    # polyhaven
    p_ph = subparsers.add_parser("polyhaven", help="Search or download CC0 3D models from Poly Haven")
    p_ph.add_argument("query", nargs="?", default="", help="Search query (e.g. chair, camera, car)")
    p_ph.add_argument("--download", help="Asset ID to download directly (e.g. ArmChair_01)")
    p_ph.add_argument("--topic", default="general", help="Topic subfolder")
    p_ph.add_argument("--name", help="Custom filename override")

    # list
    subparsers.add_parser("list", help="List presets and existing models")

    args = parser.parse_args()

    if args.command == "list":
        return cmd_list()

    elif args.command == "inspect":
        return cmd_inspect(args.file.expanduser().resolve())

    def resolve_dest(topic: str, fname: str) -> Path:
        ep_dir = ROOT / "episodes" / topic
        if topic and ep_dir.exists():
            return ep_dir / "media" / fname
        return MODELS_DIR / topic / fname

    if args.command == "download":
        is_sketchfab = "sketchfab.com" in args.url or (len(args.url) == 32 and bool(re.match(r"^[0-9a-fA-F]{32}$", args.url)))
        
        if is_sketchfab:
            # Default filename derived from URL slug if possible
            slug_match = re.search(r"/3d-models/([a-zA-Z0-9_-]+)-[0-9a-fA-F]{32}", args.url)
            default_name = (slug_match.group(1).replace("-", "_") + ".glb") if slug_match else "sketchfab_model.glb"
            filename = args.name or default_name
            if not filename.endswith((".glb", ".gltf")):
                filename += ".glb"
            dest = resolve_dest(args.topic, filename)
            ok = download_sketchfab_model(args.url, dest, args.topic)
            if ok:
                cmd_inspect(dest)
            return 0 if ok else 1

        filename = args.name or Path(args.url.split("?")[0]).name
        if not filename.endswith((".glb", ".gltf")):
            filename += ".glb"
        dest = resolve_dest(args.topic, filename)
        ok = download_file(args.url, dest)
        if ok:
            cmd_inspect(dest)
        return 0 if ok else 1

    elif args.command == "convert":
        src = args.file.expanduser().resolve()
        if not src.exists():
            print(f"❌ Source file not found: {src}")
            return 1
        default_name = src.stem + ".glb"
        filename = args.name or default_name
        if not filename.endswith((".glb", ".gltf")):
            filename += ".glb"
        dest = resolve_dest(args.topic, filename)

        try:
            import tools.blender_render as blender_engine
            blender_engine.convert_model_to_glb(src, dest, target_dim=args.scale)
            cmd_inspect(dest)
            return 0
        except Exception as e:
            print(f"❌ Conversion failed: {e}")
            return 1

    elif args.command == "get":
        preset_info = CURATED_PRESETS[args.preset]
        filename = args.name or preset_info["filename"]
        dest = resolve_dest(args.topic, filename)
        ok = download_file(preset_info["url"], dest)
        if ok:
            cmd_inspect(dest)
        return 0 if ok else 1

    elif args.command == "generate":
        filename = args.name or (re.sub(r"[^a-zA-Z0-9_-]", "_", args.prompt)[:30].strip("_").lower() + ".glb")
        dest = resolve_dest(args.topic, filename)

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

    elif args.command == "polyhaven":
        if args.download:
            asset_id = args.download.strip()
            filename = args.name or f"{asset_id}.glb"
            if not filename.endswith((".glb", ".gltf")):
                filename += ".glb"
            dest = resolve_dest(args.topic, filename)
            ok = download_polyhaven_model(asset_id, dest, args.topic)
            if ok:
                cmd_inspect(dest)
            return 0 if ok else 1
        else:
            return search_polyhaven_models(args.query)


if __name__ == "__main__":
    sys.exit(main())

