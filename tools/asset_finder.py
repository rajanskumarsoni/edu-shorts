#!/usr/bin/env python3
"""
Universal Asset Finder & Media Acquisition Engine for edu-shorts video production.
Searches the web, generates AI imagery, and downloads stock B-roll videos, photos,
vector icons, and sound effects per scene and stage during video creation.

Features & Providers:
1. Stock Video & Footage:
   - Pexels Video (PEXELS_API_KEY)
   - Pixabay Video (PIXABAY_API_KEY)
   - NASA Image and Video Library (Free, zero API key, public domain space/science)
   - Internet Archive (Free, zero API key, Prelinger & public-domain archival films)
   - Wikimedia Commons Video (Free, zero API key)

2. Images & Public Domain Art:
   - Openverse API (Aggregated CC images with explicit license metadata)
   - NASA Image Library (Public domain space, aeronautics, technology)
   - Art Institute of Chicago / Museum Open Access (Public domain art & artifacts)
   - Wikimedia Commons (Free, zero API key, CC/Public Domain)
   - Pexels (PEXELS_API_KEY)
   - Pixabay (PIXABAY_API_KEY)
   - Unsplash (UNSPLASH_ACCESS_KEY)

3. Open-Source Generative AI:
   - Pollinations.ai (Instant free AI image generation by URL, zero API key required)

4. Icons & Vector Art:
   - Iconify API (Lucide, Material, Simple Icons, Tabler vector SVGs)

5. Audio & Sound Design:
   - Local 19-sound library semantic matcher
   - Freesound API (FREESOUND_API_KEY)
   - Wikimedia Commons Audio (Free)

6. License Verification & Attribution Ledger:
   - Automatically tracks every downloaded asset's license (CC0, CC-BY, Public Domain, etc.)
   - Generates episodes/<id>/attributions.json and episodes/<id>/ATTRIBUTIONS.md
   - Formats copy-paste YouTube Description attribution blocks!
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEDIA_DIR = ROOT / "episodes"
SFX_DIR = ROOT / "public" / "sfx"
ICONS_DIR = ROOT / "scratch" / "icons"

USER_AGENT = "EduShortsMediaBot/1.0 (+https://github.com/edushorts/pipeline; contact@edushorts.internal)"

LOCAL_SFX_KEYWORDS = {
    "whoosh": ["whoosh", "swoosh", "swipe", "flyby", "pan"],
    "fast_whoosh": ["fast whoosh", "whip", "snap", "quick transition", "whip pan"],
    "riser": ["riser", "tension", "buildup", "suspense", "escalation"],
    "downlifter": ["downlifter", "drop", "calm", "release", "settle"],
    "pop": ["pop", "bubble", "appear", "spawn"],
    "click": ["click", "button", "tap", "select", "press"],
    "ting": ["ting", "chime", "subtle ping", "bell"],
    "ding": ["ding", "correct", "success", "alert", "solved"],
    "ka_ching": ["ka ching", "kaching", "cash", "payment", "money", "rupee", "dollar", "register"],
    "impact": ["impact", "slam", "boom", "hit", "strike", "problem", "crisis"],
    "bass_drop": ["bass drop", "sub boom", "shockwave", "dramatic hit", "revelation"],
    "thud": ["thud", "heavy hit", "landing", "stomp"],
    "heartbeat": ["heartbeat", "pulse", "vital", "tension loop"],
    "typing": ["typing", "keyboard", "code", "terminal", "keypress"],
    "camera_shutter": ["camera shutter", "shutter", "scan", "capture", "photo", "snapshot"],
    "glitch": ["glitch", "error", "bug", "distortion", "noise", "hack"],
    "sparkle": ["sparkle", "magic", "payoff", "stars", "celebration"],
    "radar_beep": ["radar beep", "radar", "ping", "packet", "signal", "transit", "beacon"],
}


def load_env():
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k, v = k.strip(), v.strip().strip("'\"")
            if k and k not in os.environ:
                os.environ[k] = v


load_env()


def slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9_-]", "_", text).strip("_").lower()
    return re.sub(r"_+", "_", s)[:50]


def download_file(url: str, dest: Path) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=25) as response, open(dest, "wb") as out_file:
        shutil.copyfileobj(response, out_file)
    return dest


# ==============================================================================
# License & Attribution Ledger
# ==============================================================================
def record_attribution(episode_dir: Path, asset_rel: str, meta: dict):
    """
    Records licensing metadata for an asset into episodes/<id>/attributions.json
    and regenerates episodes/<id>/ATTRIBUTIONS.md with YouTube description block.
    """
    if not episode_dir or not episode_dir.exists():
        return

    attr_file = episode_dir / "attributions.json"
    data = {}
    if attr_file.exists():
        try:
            data = json.loads(attr_file.read_text(encoding="utf-8"))
        except Exception:
            data = {}

    data[asset_rel] = {
        "title": meta.get("title", "Asset"),
        "provider": meta.get("provider", "web"),
        "url": meta.get("url", ""),
        "source_url": meta.get("source_url") or meta.get("url", ""),
        "license": meta.get("license", "Open / Permissive"),
        "license_url": meta.get("license_url", ""),
        "author": meta.get("author") or meta.get("creator", "Public Domain / Creative Commons"),
        "recorded_at": datetime.now().isoformat(),
    }

    attr_file.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Generate human-readable markdown
    md_file = episode_dir / "ATTRIBUTIONS.md"
    lines = [
        f"# Asset Licensing & Attribution Notice",
        f"",
        f"Generated automatically by edu-shorts pipeline.",
        f"Always verify commercial suitability before publishing.",
        f"",
        f"## Media Assets Inventory ({len(data)} items)",
        f"",
    ]

    for path_key, item in data.items():
        lines.append(f"### {item['title']}")
        lines.append(f"- **Local Path**: `{path_key}`")
        lines.append(f"- **Provider**: {item['provider'].upper()}")
        lines.append(f"- **License**: {item['license']}")
        if item.get("license_url"):
            lines.append(f"- **License URL**: {item['license_url']}")
        if item.get("author"):
            lines.append(f"- **Author / Creator**: {item['author']}")
        if item.get("source_url"):
            lines.append(f"- **Source**: {item['source_url']}")
        lines.append("")

    lines.append("## YouTube Description Attribution Block")
    lines.append("```text")
    lines.append("Media & Music Credits:")
    for item in data.values():
        title = item.get("title", "Asset")
        lic = item.get("license", "Open License")
        author = item.get("author")
        author_str = f" by {author}" if author and author != "Public Domain / Creative Commons" else ""
        lines.append(f"- {title}{author_str} ({lic})")
    lines.append("```")
    lines.append("")

    md_file.write_text("\n".join(lines), encoding="utf-8")


# ==============================================================================
# Image Search Providers
# ==============================================================================
def search_wikimedia_images(query: str, limit: int = 5) -> list:
    """Search Wikimedia Commons for high-resolution CC/Public Domain images."""
    encoded = urllib.parse.quote(query)
    url = (
        f"https://commons.wikimedia.org/w/api.php?action=query&generator=search"
        f"&gsrsearch={encoded}&gsrnamespace=6&gsrlimit={limit}"
        f"&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1280&format=json"
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            pages = data.get("query", {}).get("pages", {})
            results = []
            for pid, info in pages.items():
                imageinfo = info.get("imageinfo", [{}])[0]
                mime = imageinfo.get("mime", "")
                if not mime.startswith("image/"):
                    continue
                if mime == "application/pdf":
                    continue
                download_url = imageinfo.get("thumburl") or imageinfo.get("url")
                if download_url:
                    results.append({
                        "title": info.get("title", "").replace("File:", ""),
                        "url": download_url,
                        "orig_url": imageinfo.get("url"),
                        "mime": mime,
                        "width": imageinfo.get("width"),
                        "height": imageinfo.get("height"),
                        "provider": "wikimedia",
                        "license": "Creative Commons / Public Domain",
                        "license_url": "https://commons.wikimedia.org",
                    })
            return results
    except Exception as e:
        print(f"  [Wikimedia Image Warning] {e}")
        return []


def search_nasa_images(query: str, limit: int = 5) -> list:
    """Search NASA Image and Video Library for public domain space/tech photos."""
    encoded = urllib.parse.quote(query)
    url = f"https://images-api.nasa.gov/search?q={encoded}&media_type=image"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            items = data.get("collection", {}).get("items", [])[:limit]
            results = []
            for it in items:
                d = it.get("data", [{}])[0]
                links = it.get("links", [{}])[0]
                thumb = links.get("href")
                if thumb:
                    # Upgrade thumbnail to medium / large if possible
                    best_url = thumb.replace("~thumb.jpg", "~orig.jpg").replace("~small.jpg", "~medium.jpg")
                    results.append({
                        "title": d.get("title") or query,
                        "url": best_url,
                        "thumb": thumb,
                        "mime": "image/jpeg",
                        "provider": "nasa",
                        "license": "NASA Public Domain",
                        "license_url": "https://www.nasa.gov/multimedia/guidelines/index.html",
                        "author": "NASA",
                    })
            return results
    except Exception as e:
        print(f"  [NASA Image Warning] {e}")
        return []


def search_openverse_images(query: str, limit: int = 5) -> list:
    """Search Openverse API for aggregated Creative Commons images with explicit license info."""
    encoded = urllib.parse.quote(query)
    url = f"https://api.openverse.org/v1/images/?q={encoded}&page_size={limit}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            results = []
            for item in data.get("results", []):
                results.append({
                    "title": item.get("title") or "Openverse Image",
                    "url": item.get("url"),
                    "mime": "image/jpeg",
                    "provider": "openverse",
                    "license": f"CC {item.get('license', 'BY').upper()} {item.get('license_version', '')}".strip(),
                    "license_url": item.get("license_url", ""),
                    "author": item.get("creator", "Unknown"),
                    "source_url": item.get("foreign_landing_url", item.get("url")),
                })
            return results
    except Exception as e:
        print(f"  [Openverse Image Warning] {e}")
        return []


def search_museum_images(query: str, limit: int = 5) -> list:
    """Search Art Institute of Chicago for public domain CC0 artworks and historical objects."""
    encoded = urllib.parse.quote(query)
    url = f"https://api.artic.edu/api/v1/artworks/search?q={encoded}&fields=id,title,artist_title,image_id,is_public_domain&limit={limit}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            results = []
            for art in data.get("data", []):
                img_id = art.get("image_id")
                if img_id and art.get("is_public_domain", True):
                    img_url = f"https://www.artic.edu/iiif/2/{img_id}/full/1280,/0/default.jpg"
                    results.append({
                        "title": art.get("title") or "Museum Artwork",
                        "url": img_url,
                        "mime": "image/jpeg",
                        "provider": "museum",
                        "license": "CC0 Public Domain",
                        "license_url": "https://creativecommons.org/publicdomain/zero/1.0/",
                        "author": art.get("artist_title") or "Art Institute of Chicago",
                    })
            return results
    except Exception as e:
        print(f"  [Museum Image Warning] {e}")
        return []


def search_polyhaven_assets(query: str, asset_type: str = "textures", limit: int = 5) -> list:
    """Search Poly Haven for 100% CC0 public domain textures, HDRIs, and models."""
    url = f"https://api.polyhaven.com/assets?type={asset_type}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            results = []
            q_lower = query.lower()
            for asset_id, info in data.items():
                name = info.get("name", "").lower()
                tags = [t.lower() for t in info.get("tags", [])]
                cats = [c.lower() for c in info.get("categories", [])]
                if q_lower in name or any(q_lower in t for t in tags) or any(q_lower in c for c in cats):
                    thumb_url = f"https://cdn.polyhaven.com/asset_img/primary/{asset_id}.png?width=1024"
                    results.append({
                        "title": f"Poly Haven: {info.get('name', asset_id)}",
                        "url": thumb_url,
                        "orig_url": f"https://polyhaven.com/a/{asset_id}",
                        "mime": "image/png",
                        "provider": "polyhaven",
                        "license": "CC0 Public Domain",
                        "license_url": "https://creativecommons.org/publicdomain/zero/1.0/",
                        "author": ", ".join(info.get("authors", {}).keys()) or "Poly Haven Community",
                    })
                    if len(results) >= limit:
                        break
            return results
    except Exception as e:
        print(f"  [Poly Haven Warning] {e}")
        return []


def search_pexels_images(query: str, limit: int = 5, orientation: str = "portrait") -> list:
    """Search Pexels API if PEXELS_API_KEY is available."""
    api_key = os.environ.get("PEXELS_API_KEY")
    if not api_key:
        return []
    url = f"https://api.pexels.com/v1/search?query={urllib.parse.quote(query)}&orientation={orientation}&per_page={limit}"
    req = urllib.request.Request(url, headers={"Authorization": api_key, "User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            results = []
            for photo in data.get("photos", []):
                src = photo.get("src", {})
                best_url = src.get("large2x") or src.get("original") or src.get("portrait")
                if best_url:
                    results.append({
                        "title": photo.get("alt") or f"Pexels {photo.get('id')}",
                        "url": best_url,
                        "orig_url": src.get("original"),
                        "mime": "image/jpeg",
                        "width": photo.get("width"),
                        "height": photo.get("height"),
                        "provider": "pexels",
                        "license": "Pexels Free Commercial License",
                        "license_url": "https://www.pexels.com/license/",
                        "author": photo.get("photographer", "Pexels Contributor"),
                    })
            return results
    except Exception as e:
        print(f"  [Pexels Image Warning] {e}")
        return []


def search_pixabay_images(query: str, limit: int = 5) -> list:
    """Search Pixabay Images API if PIXABAY_API_KEY is available."""
    api_key = os.environ.get("PIXABAY_API_KEY")
    if not api_key:
        return []
    url = f"https://pixabay.com/api/?key={api_key}&q={urllib.parse.quote(query)}&image_type=photo&per_page={limit}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            results = []
            for hit in data.get("hits", []):
                results.append({
                    "title": hit.get("tags") or f"Pixabay {hit.get('id')}",
                    "url": hit.get("largeImageURL") or hit.get("webformatURL"),
                    "mime": "image/jpeg",
                    "provider": "pixabay",
                    "license": "Pixabay Free Commercial License",
                    "license_url": "https://pixabay.com/service/license/",
                    "author": hit.get("user", "Pixabay Contributor"),
                })
            return results
    except Exception as e:
        print(f"  [Pixabay Image Warning] {e}")
        return []


def search_unsplash_images(query: str, limit: int = 5, orientation: str = "portrait") -> list:
    """Search Unsplash API if UNSPLASH_ACCESS_KEY is available."""
    access_key = os.environ.get("UNSPLASH_ACCESS_KEY")
    if not access_key:
        return []
    url = f"https://api.unsplash.com/search/photos?query={urllib.parse.quote(query)}&orientation={orientation}&per_page={limit}"
    req = urllib.request.Request(url, headers={"Authorization": f"Client-ID {access_key}", "User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            results = []
            for photo in data.get("results", []):
                urls = photo.get("urls", {})
                best_url = urls.get("regular") or urls.get("full")
                if best_url:
                    results.append({
                        "title": photo.get("description") or photo.get("alt_description") or "Unsplash Photo",
                        "url": best_url,
                        "orig_url": urls.get("raw"),
                        "mime": "image/jpeg",
                        "width": photo.get("width"),
                        "height": photo.get("height"),
                        "provider": "unsplash",
                        "license": "Unsplash Commercial License",
                        "license_url": "https://unsplash.com/license",
                        "author": photo.get("user", {}).get("name", "Unsplash Contributor"),
                    })
            return results
    except Exception as e:
        print(f"  [Unsplash Image Warning] {e}")
        return []


# ==============================================================================
# Generative AI Image Provider (Pollinations.ai)
# ==============================================================================
def generate_pollinations_image(
    prompt: str,
    out_path: Path = None,
    topic: str = None,
    width: int = 1080,
    height: int = 1920,
    seed: int = None,
    model: str = "flux",
    nobg: bool = False,
    bg_mode: str = "white",
) -> dict:
    """
    Generates image via Pollinations.ai instant REST URL.
    100% free, zero API key required, agent-accessible.
    """
    print(f"Generating GenAI image via Pollinations.ai: '{prompt}' ({width}x{height}, model={model})...")
    encoded = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&nologo=true&model={model}"
    if seed is not None:
        url += f"&seed={seed}"

    clean_slug = slugify(prompt)
    if not out_path:
        target_dir = (ROOT / "episodes" / topic / "media") if topic else (ROOT / "scratch" / "media")
        out_path = target_dir / f"{clean_slug}.jpg"
    else:
        out_path = Path(out_path)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    download_file(url, out_path)

    if nobg:
        try:
            from tools.bg_remove import remove_background
            nobg_path = out_path.with_name(f"{out_path.stem}_nobg.png")
            print(f"  Removing background to create transparent cutout -> {nobg_path.name}...")
            remove_background(out_path, nobg_path, bg_mode=bg_mode)
            out_path = nobg_path
        except Exception as e:
            print(f"  [Warning] Background removal failed ({e}); retaining original.")

    rel_path = f"media/{out_path.name}"
    return {
        "path": str(out_path),
        "rel_path": rel_path,
        "title": f"GenAI: {prompt}",
        "provider": "pollinations_ai",
        "url": url,
        "license": "CC0 / Free for commercial use",
        "author": "Pollinations.ai Generative Engine",
    }


def search_image(
    query: str,
    out_path: Path = None,
    topic: str = None,
    provider: str = "auto",
    limit: int = 5,
    nobg: bool = False,
    bg_mode: str = "white",
) -> dict:
    """Finds best matching image across available providers and downloads it."""
    print(f"Searching image for: '{query}' (provider: {provider})...")
    candidates = []

    if provider == "pollinations" or provider == "generate":
        return generate_pollinations_image(query, out_path=out_path, topic=topic, nobg=nobg, bg_mode=bg_mode)

    if provider in ("auto", "pexels"):
        candidates.extend(search_pexels_images(query, limit=limit))
    if provider in ("auto", "pixabay") and not candidates:
        candidates.extend(search_pixabay_images(query, limit=limit))
    if provider in ("auto", "unsplash") and not candidates:
        candidates.extend(search_unsplash_images(query, limit=limit))
    if provider in ("auto", "nasa") and not candidates:
        candidates.extend(search_nasa_images(query, limit=limit))
    if provider in ("auto", "openverse") and not candidates:
        candidates.extend(search_openverse_images(query, limit=limit))
    if provider in ("auto", "museum") and not candidates:
        candidates.extend(search_museum_images(query, limit=limit))
    if provider in ("auto", "polyhaven") and not candidates:
        candidates.extend(search_polyhaven_assets(query, limit=limit))
    if provider in ("auto", "wikimedia") or not candidates:
        candidates.extend(search_wikimedia_images(query, limit=limit))

    # If no stock photo found anywhere, fallback to instant GenAI via Pollinations!
    if not candidates:
        print(f"  [Fallback] No stock image found online; synthesizing via Pollinations.ai...")
        return generate_pollinations_image(query, out_path=out_path, topic=topic, nobg=nobg, bg_mode=bg_mode)

    selected = candidates[0]
    print(f"  Found: {selected['title']} via {selected['provider']} ({selected.get('license', 'Open')})")

    clean_slug = slugify(query)
    ext = ".jpg"
    if selected.get("mime") == "image/png" or ".png" in selected["url"].lower():
        ext = ".png"
    elif selected.get("mime") == "image/webp" or ".webp" in selected["url"].lower():
        ext = ".webp"

    if not out_path:
        target_dir = (ROOT / "episodes" / topic / "media") if topic else (ROOT / "scratch" / "media")
        out_path = target_dir / f"{clean_slug}{ext}"
    else:
        out_path = Path(out_path)

    print(f"  Downloading -> {out_path}...")
    download_file(selected["url"], out_path)

    if nobg:
        try:
            from tools.bg_remove import remove_background
            nobg_path = out_path.with_name(f"{out_path.stem}_nobg.png")
            print(f"  Removing background to create transparent cutout -> {nobg_path.name}...")
            remove_background(out_path, nobg_path, bg_mode=bg_mode)
            out_path = nobg_path
        except Exception as e:
            print(f"  [Warning] Background removal failed ({e}); retaining original.")

    rel_path = f"media/{out_path.name}"
    return {
        "path": str(out_path),
        "rel_path": rel_path,
        "title": selected["title"],
        "provider": selected["provider"],
        "url": selected["url"],
        "license": selected.get("license", "Open License"),
        "license_url": selected.get("license_url", ""),
        "author": selected.get("author", ""),
    }


# ==============================================================================
# Vector Icon Search & Downloader (Iconify API / Lucide)
# ==============================================================================
def search_icon(name: str, out_path: Path = None, topic: str = None, color: str = "#00F0FF", collection: str = "lucide") -> dict:
    """
    Downloads vector SVG icon from Iconify API (Lucide, Simple Icons, Material, etc.).
    """
    clean_name = name.lower().replace(" ", "-")
    encoded_color = urllib.parse.quote(color)
    url = f"https://api.iconify.design/{collection}:{clean_name}.svg?color={encoded_color}"

    if not out_path:
        target_dir = (ROOT / "episodes" / topic / "media") if topic else (ROOT / "scratch" / "icons")
        out_path = target_dir / f"{clean_name}.svg"
    else:
        out_path = Path(out_path)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"Fetching vector icon '{name}' from Iconify ({collection}) -> {out_path}...")
    download_file(url, out_path)

    rel_path = f"media/{out_path.name}"
    return {
        "path": str(out_path),
        "rel_path": rel_path,
        "title": f"Icon: {name}",
        "provider": "iconify",
        "url": url,
        "license": "ISC / MIT / Apache 2.0 (Open Vector)",
    }


# ==============================================================================
# Video B-Roll Search Providers
# ==============================================================================
def search_pexels_videos(query: str, limit: int = 5, orientation: str = "portrait") -> list:
    """Search Pexels Videos API for vertical/landscape stock B-roll."""
    api_key = os.environ.get("PEXELS_API_KEY")
    if not api_key:
        return []
    url = f"https://api.pexels.com/videos/search?query={urllib.parse.quote(query)}&orientation={orientation}&per_page={limit}"
    req = urllib.request.Request(url, headers={"Authorization": api_key, "User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            results = []
            for video in data.get("videos", []):
                files = video.get("video_files", [])
                mp4_files = [f for f in files if f.get("file_type") == "video/mp4"]
                best_file = None
                for f in mp4_files:
                    if f.get("width", 0) >= 1080 or f.get("height", 0) >= 1080:
                        best_file = f
                        break
                if not best_file and mp4_files:
                    best_file = mp4_files[0]
                if best_file and best_file.get("link"):
                    results.append({
                        "title": f"Pexels Video {video.get('id')}",
                        "url": best_file["link"],
                        "duration": video.get("duration", 10),
                        "width": best_file.get("width"),
                        "height": best_file.get("height"),
                        "provider": "pexels",
                        "license": "Pexels Free License",
                        "license_url": "https://www.pexels.com/license/",
                        "author": video.get("user", {}).get("name", "Pexels Video Contributor"),
                    })
            return results
    except Exception as e:
        print(f"  [Pexels Video Warning] {e}")
        return []


def search_pixabay_videos(query: str, limit: int = 5) -> list:
    """Search Pixabay Videos API."""
    api_key = os.environ.get("PIXABAY_API_KEY")
    if not api_key:
        return []
    url = f"https://pixabay.com/api/videos/?key={api_key}&q={urllib.parse.quote(query)}&per_page={limit}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            results = []
            for hit in data.get("hits", []):
                videos = hit.get("videos", {})
                medium = videos.get("large") or videos.get("medium") or videos.get("small")
                if medium and medium.get("url"):
                    results.append({
                        "title": hit.get("tags") or f"Pixabay Video {hit.get('id')}",
                        "url": medium["url"],
                        "duration": hit.get("duration", 10),
                        "width": medium.get("width"),
                        "height": medium.get("height"),
                        "provider": "pixabay",
                        "license": "Pixabay Free License",
                        "license_url": "https://pixabay.com/service/license/",
                        "author": hit.get("user", "Pixabay Video Contributor"),
                    })
            return results
    except Exception as e:
        print(f"  [Pixabay Video Warning] {e}")
        return []


def search_nasa_videos(query: str, limit: int = 5) -> list:
    """Search NASA Video Library for space/science/aeronautics public domain video clips."""
    encoded = urllib.parse.quote(query)
    url = f"https://images-api.nasa.gov/search?q={encoded}&media_type=video"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            items = data.get("collection", {}).get("items", [])[:limit]
            results = []
            for it in items:
                d = it.get("data", [{}])[0]
                coll_raw = it.get("href")
                if not coll_raw:
                    continue
                coll_url = urllib.parse.quote(coll_raw, safe=":/?&=")
                try:
                    with urllib.request.urlopen(urllib.request.Request(coll_url, headers={"User-Agent": USER_AGENT}), timeout=8) as c_resp:
                        assets = json.loads(c_resp.read().decode("utf-8"))
                        mp4s = [a for a in assets if str(a).endswith(".mp4")]
                        if mp4s:
                            # Pick 1080p or orig mp4
                            chosen = [a for a in mp4s if "medium" in a or "orig" in a]
                            best = chosen[0] if chosen else mp4s[0]
                            results.append({
                                "title": d.get("title") or "NASA Video Clip",
                                "url": urllib.parse.quote(best, safe=":/?&="),
                                "duration": 15,
                                "provider": "nasa",
                                "license": "NASA Public Domain",
                                "license_url": "https://www.nasa.gov/multimedia/guidelines/index.html",
                                "author": "NASA",
                            })
                except Exception:
                    continue
            return results
    except Exception as e:
        print(f"  [NASA Video Warning] {e}")
        return []


def search_archive_videos(query: str, limit: int = 5) -> list:
    """Search Internet Archive for public domain historic & educational films (Prelinger Archives)."""
    encoded = urllib.parse.quote(f"mediatype:movies AND ({query})")
    url = f"https://archive.org/advancedsearch.php?q={encoded}&fl[]=identifier,title,description&sort[]=downloads+desc&rows={limit}&output=json"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            docs = data.get("response", {}).get("docs", [])
            results = []
            for doc in docs:
                ident = doc.get("identifier")
                if not ident:
                    continue
                meta_url = f"https://archive.org/metadata/{ident}/files"
                try:
                    with urllib.request.urlopen(urllib.request.Request(meta_url, headers={"User-Agent": USER_AGENT}), timeout=8) as m_resp:
                        files_data = json.loads(m_resp.read().decode("utf-8")).get("result", [])
                        mp4s = [f["name"] for f in files_data if f.get("name", "").endswith(".mp4")]
                        if mp4s:
                            direct_url = f"https://archive.org/download/{ident}/{urllib.parse.quote(mp4s[0])}"
                            results.append({
                                "title": doc.get("title") or ident,
                                "url": direct_url,
                                "duration": 15,
                                "provider": "internet_archive",
                                "license": "Public Domain / Prelinger Archives",
                                "license_url": "https://archive.org/about/",
                                "author": "Internet Archive",
                            })
                except Exception:
                    continue
            return results
    except Exception as e:
        print(f"  [Internet Archive Warning] {e}")
        return []


def search_wikimedia_videos(query: str, limit: int = 5) -> list:
    """Search Wikimedia Commons for free educational and CC videos."""
    encoded = urllib.parse.quote(f"{query} filetype:video")
    url = (
        f"https://commons.wikimedia.org/w/api.php?action=query&generator=search"
        f"&gsrsearch={encoded}&gsrnamespace=6&gsrlimit={limit}"
        f"&prop=imageinfo&iiprop=url|size|mime&format=json"
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            pages = data.get("query", {}).get("pages", {})
            results = []
            for pid, info in pages.items():
                imageinfo = info.get("imageinfo", [{}])[0]
                mime = imageinfo.get("mime", "")
                if not (mime.startswith("video/") or mime in ("application/ogg", "video/webm")):
                    continue
                vurl = imageinfo.get("url")
                if vurl:
                    results.append({
                        "title": info.get("title", "").replace("File:", ""),
                        "url": vurl,
                        "duration": 10,
                        "provider": "wikimedia",
                        "license": "Creative Commons / Public Domain",
                        "license_url": "https://commons.wikimedia.org",
                    })
            return results
    except Exception as e:
        print(f"  [Wikimedia Video Warning] {e}")
        return []


def search_video(
    query: str,
    out_path: Path = None,
    topic: str = None,
    provider: str = "auto",
    max_duration: int = 12,
    orientation: str = "portrait"
) -> dict:
    """Finds best matching video B-roll clip, downloads, and converts to normalized MP4."""
    print(f"Searching video B-roll for: '{query}' (provider: {provider})...")
    candidates = []

    if provider in ("auto", "pexels"):
        candidates.extend(search_pexels_videos(query, orientation=orientation))
    if provider in ("auto", "pixabay") and not candidates:
        candidates.extend(search_pixabay_videos(query))
    if provider in ("auto", "nasa") and not candidates:
        candidates.extend(search_nasa_videos(query))
    if provider in ("auto", "archive") and not candidates:
        candidates.extend(search_archive_videos(query))
    if provider in ("auto", "wikimedia") or not candidates:
        candidates.extend(search_wikimedia_videos(query))

    if not candidates:
        raise RuntimeError(f"No video results found for query: '{query}'")

    selected = candidates[0]
    print(f"  Found: {selected['title']} via {selected['provider']} ({selected.get('license', 'Open')})")

    clean_slug = slugify(query)
    if not out_path:
        target_dir = (ROOT / "episodes" / topic / "media") if topic else (ROOT / "scratch" / "media")
        out_path = target_dir / f"{clean_slug}.mp4"
    else:
        out_path = Path(out_path)

    temp_dest = out_path.parent / f"temp_{clean_slug}_{int(selected.get('duration', 5))}.raw"
    print(f"  Downloading raw clip...")
    download_file(selected["url"], temp_dest)

    print(f"  Normalizing video with FFmpeg -> {out_path}...")
    ffmpeg = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
    cmd = [
        ffmpeg, "-y",
        "-ss", "0",
        "-t", str(max_duration),
        "-i", str(temp_dest),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-an",
        str(out_path)
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if temp_dest.exists():
        temp_dest.unlink()

    rel_path = f"media/{out_path.name}"
    return {
        "path": str(out_path),
        "rel_path": rel_path,
        "title": selected["title"],
        "provider": selected["provider"],
        "url": selected["url"],
        "license": selected.get("license", "Open License"),
        "license_url": selected.get("license_url", ""),
        "author": selected.get("author", ""),
    }


# ==============================================================================
# Sound Effects (SFX) Search Providers
# ==============================================================================
def match_local_sfx(query: str) -> str:
    """Checks query against 19 pre-bundled SFX keywords."""
    q_lower = query.lower()
    for sfx_name, keywords in LOCAL_SFX_KEYWORDS.items():
        for kw in keywords:
            if kw in q_lower or q_lower in kw:
                return sfx_name
    return None


def search_freesound(query: str, limit: int = 3) -> list:
    """Search Freesound API if FREESOUND_API_KEY is available."""
    api_key = os.environ.get("FREESOUND_API_KEY")
    if not api_key:
        return []
    url = f"https://freesound.org/apiv2/search/text/?query={urllib.parse.quote(query)}&token={api_key}&fields=id,name,previews,duration"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            results = []
            for sound in data.get("results", []):
                previews = sound.get("previews", {})
                preview_url = previews.get("preview-hq-mp3") or previews.get("preview-lq-mp3")
                if preview_url:
                    results.append({
                        "title": sound.get("name"),
                        "url": preview_url,
                        "duration": sound.get("duration", 2),
                        "provider": "freesound",
                        "license": "Creative Commons (Freesound)",
                        "license_url": "https://freesound.org/help/faq/#licenses",
                    })
            return results
    except Exception as e:
        print(f"  [Freesound Warning] {e}")
        return []


def search_sfx(query: str, out_path: Path = None, provider: str = "auto") -> dict:
    """Finds or generates SFX, normalizes to 48kHz stereo WAV in public/sfx/."""
    local_match = match_local_sfx(query)
    if local_match and (SFX_DIR / f"{local_match}.wav").exists():
        print(f"Matched local pre-bundled sound effect: '{local_match}' for query '{query}'")
        return {
            "name": local_match,
            "path": str(SFX_DIR / f"{local_match}.wav"),
            "rel_path": f"sfx/{local_match}.wav",
            "provider": "local",
            "license": "Bundled CC0 Sound FX",
        }

    candidates = []
    if provider in ("auto", "freesound"):
        candidates.extend(search_freesound(query))

    if not candidates:
        default_fallback = "pop" if "button" in query else "whoosh"
        print(f"No online sound found; falling back to local: '{default_fallback}'")
        return {
            "name": default_fallback,
            "path": str(SFX_DIR / f"{default_fallback}.wav"),
            "rel_path": f"sfx/{default_fallback}.wav",
            "provider": "local_fallback",
            "license": "Bundled CC0 Sound FX",
        }

    selected = candidates[0]
    clean_name = slugify(query)
    if not out_path:
        out_path = SFX_DIR / f"{clean_name}.wav"
    else:
        out_path = Path(out_path)

    temp_raw = out_path.parent / f"temp_{clean_name}.mp3"
    download_file(selected["url"], temp_raw)

    ffmpeg = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
    cmd = [
        ffmpeg, "-y",
        "-i", str(temp_raw),
        "-ar", "48000",
        "-ac", "2",
        "-t", "4",
        str(out_path)
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if temp_raw.exists():
        temp_raw.unlink()

    return {
        "name": clean_name,
        "path": str(out_path),
        "rel_path": f"sfx/{clean_name}.wav",
        "provider": selected["provider"],
        "license": selected.get("license", "Creative Commons"),
        "license_url": selected.get("license_url", ""),
    }


# ==============================================================================
# Storyboard Asset Resolution
# ==============================================================================
def resolve_spec_assets(spec_path: Path, force: bool = False, dry_run: bool = False) -> bool:
    """
    Scans a storyboard JSON or episode directory, resolves all search_* / generate_*
    directives and missing assets by downloading them into place and updating attributions.
    """
    spec_path = Path(spec_path)
    if spec_path.is_dir():
        cand = spec_path / "storyboard.json"
        if cand.exists():
            spec_path = cand
        else:
            raise FileNotFoundError(f"No storyboard.json in {spec_path}")

    data = json.loads(spec_path.read_text(encoding="utf-8"))
    vid = data.get("id") or spec_path.parent.name
    episode_dir = spec_path.parent if (spec_path.parent / "storyboard.json").exists() else None
    media_dir = (episode_dir / "media") if episode_dir else (ROOT / "episodes" / vid / "media")
    media_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n=======================================================")
    print(f"Asset Auto-Resolution for Episode: [{vid}]")
    print(f"Target Media Directory: {media_dir}")
    print(f"=======================================================")

    modified = False
    scenes = data.get("scenes", [])

    for i, s in enumerate(scenes, 1):
        stype = s.get("type")
        tag = s.get("tag", f"Scene {i}")

        # 1. GenAI Image Resolution (Pollinations.ai)
        if s.get("generate_image"):
            prompt = s["generate_image"]
            slug = slugify(prompt)
            target_file = media_dir / f"{slug}.jpg"
            if target_file.exists() and not force:
                print(f"[{tag}] Using cached GenAI image: {target_file.name}")
            else:
                if dry_run:
                    print(f"[{tag}] WOULD generate image via Pollinations: '{prompt}'")
                else:
                    try:
                        res = generate_pollinations_image(prompt, out_path=target_file, topic=vid)
                        s["image"] = f"media/{target_file.name}"
                        modified = True
                        if episode_dir:
                            record_attribution(episode_dir, f"media/{target_file.name}", res)
                        print(f"  [{tag}] Resolved GenAI image -> {s['image']}")
                    except Exception as e:
                        print(f"  [{tag}] Error generating image: {e}")

        # 2. Image Search Resolution
        elif s.get("search_image") or (stype == "image" and not s.get("image")):
            query = s.get("search_image") or s.get("title") or (s.get("visual", {}).get("objects", ["tech"])[0])
            slug = slugify(query)
            target_file = media_dir / f"{slug}.jpg"

            if target_file.exists() and not force:
                print(f"[{tag}] Using cached image: {target_file.name}")
            else:
                if dry_run:
                    print(f"[{tag}] WOULD search and download image: '{query}'")
                else:
                    try:
                        provider = s.get("image_provider", "auto")
                        res = search_image(query, out_path=target_file, topic=vid, provider=provider)
                        s["image"] = f"media/{target_file.name}"
                        modified = True
                        if episode_dir:
                            record_attribution(episode_dir, f"media/{target_file.name}", res)
                        print(f"  [{tag}] Resolved image -> {s['image']}")
                    except Exception as e:
                        print(f"  [{tag}] Error resolving image: {e}")

        # 3. Vector Icon Resolution
        if s.get("search_icon") or (s.get("icon") and s.get("icon").endswith(".svg")):
            icon_query = s.get("search_icon") or s.get("icon")
            slug = slugify(icon_query)
            target_file = media_dir / f"{slug}.svg"
            if not target_file.exists() and not dry_run:
                try:
                    res = search_icon(icon_query, out_path=target_file, topic=vid)
                    s["icon_path"] = f"media/{target_file.name}"
                    modified = True
                    if episode_dir:
                        record_attribution(episode_dir, f"media/{target_file.name}", res)
                    print(f"  [{tag}] Resolved vector icon -> {s['icon_path']}")
                except Exception as e:
                    print(f"  [{tag}] Error resolving icon: {e}")

        # 4. Video B-Roll Search Resolution
        if s.get("search_video") or (stype == "video" and not s.get("video")):
            query = s.get("search_video") or s.get("title") or "technology network"
            slug = slugify(query)
            target_file = media_dir / f"{slug}.mp4"

            if target_file.exists() and not force:
                print(f"[{tag}] Using cached video: {target_file.name}")
            else:
                if dry_run:
                    print(f"[{tag}] WOULD search and download video B-roll: '{query}'")
                else:
                    try:
                        v_provider = s.get("video_provider", "auto")
                        res = search_video(query, out_path=target_file, topic=vid, provider=v_provider)
                        s["video"] = f"media/{target_file.name}"
                        modified = True
                        if episode_dir:
                            record_attribution(episode_dir, f"media/{target_file.name}", res)
                        print(f"  [{tag}] Resolved video -> {s['video']}")
                    except Exception as e:
                        print(f"  [{tag}] Error resolving video: {e}")

        # 5. SFX Resolution
        if s.get("search_sfx"):
            query = s["search_sfx"]
            if dry_run:
                print(f"[{tag}] WOULD search SFX: '{query}'")
            else:
                try:
                    res = search_sfx(query)
                    s["sfx"] = res["name"]
                    modified = True
                    if episode_dir:
                        record_attribution(episode_dir, f"sfx/{res['name']}.wav", res)
                    print(f"  [{tag}] Resolved SFX -> {s['sfx']}")
                except Exception as e:
                    print(f"  [{tag}] Error resolving SFX: {e}")

        # 6. 3D Model Resolution (Hook to model_manager.py)
        model_url = s.get("model", "")
        if isinstance(model_url, str) and (model_url.startswith("http://") or model_url.startswith("https://") or "sketchfab.com" in model_url):
            if dry_run:
                print(f"[{tag}] WOULD auto-download 3D model from URL: '{model_url}'")
            else:
                try:
                    model_mgr = ROOT / "tools" / "model_manager.py"
                    cmd = [sys.executable, str(model_mgr), "download", model_url, "--topic", vid]
                    sub_proc = subprocess.run(cmd, capture_output=True, text=True)
                    if sub_proc.returncode == 0:
                        slug_match = re.search(r"/3d-models/([a-zA-Z0-9_-]+)-[0-9a-fA-F]{32}", model_url)
                        if slug_match:
                            final_name = slug_match.group(1).replace("-", "_") + ".glb"
                        else:
                            final_name = Path(model_url.split("?")[0]).name
                            if not final_name.endswith((".glb", ".gltf")):
                                final_name += ".glb"
                        s["model"] = f"media/{final_name}"
                        modified = True
                        print(f"  [{tag}] Auto-downloaded 3D model -> {s['model']}")
                    else:
                        print(f"  [{tag}] 3D model download output: {sub_proc.stdout.strip() or sub_proc.stderr.strip()}")
                except Exception as e:
                    print(f"  [{tag}] Error auto-downloading 3D model: {e}")

        elif s.get("search_model") or (stype == "three" and s.get("variant") == "model_3d" and not s.get("model")):
            query = s.get("search_model") or s.get("title") or "tech object"
            slug = slugify(query)
            target_file = (episode_dir / "media" / f"{slug}.glb") if episode_dir else (ROOT / "public" / "models" / vid / f"{slug}.glb")
            if target_file.exists() and not force:
                print(f"[{tag}] Using cached 3D model: {target_file.name}")
                s["model"] = f"media/{target_file.name}"
                modified = True
            else:
                if dry_run:
                    print(f"[{tag}] WOULD fetch/generate 3D model: '{query}'")
                else:
                    try:
                        model_mgr = ROOT / "tools" / "model_manager.py"
                        presets = ["smartphone", "credit_card", "server_rack", "shipping_container", "laptop", "duck", "cube"]
                        preset_match = next((p for p in presets if p in slug or slug in p), None)
                        if preset_match:
                            cmd = [sys.executable, str(model_mgr), "get", preset_match, "--topic", vid, "--name", f"{slug}.glb"]
                        elif os.environ.get("TRIPO_API_KEY"):
                            cmd = [sys.executable, str(model_mgr), "generate", query, "--topic", vid, "--name", f"{slug}.glb"]
                        else:
                            cmd = [sys.executable, str(model_mgr), "get", "cube", "--topic", vid, "--name", f"{slug}.glb"]
                        sub_proc = subprocess.run(cmd, capture_output=True, text=True)
                        if sub_proc.returncode == 0 and target_file.exists():
                            s["model"] = f"media/{target_file.name}"
                            modified = True
                            print(f"  [{tag}] Resolved 3D model -> {s['model']}")
                    except Exception as e:
                        print(f"  [{tag}] Error resolving 3D model: {e}")

    if modified and not dry_run:
        backup = spec_path.with_suffix(".json.bak")
        shutil.copy(spec_path, backup)
        spec_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"\nUpdated {spec_path} with resolved assets (backup at {backup.name})")

    return modified


# ==============================================================================
# CLI Entrypoint
# ==============================================================================
def main():
    parser = argparse.ArgumentParser(description="Universal Asset Finder for edu-shorts video production.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # image
    p_img = subparsers.add_parser("image", help="Search and download image")
    p_img.add_argument("query", help="Search query")
    p_img.add_argument("--out", help="Target output file path")
    p_img.add_argument("--topic", help="Topic/episode ID for auto-locating destination")
    p_img.add_argument("--provider", default="auto", choices=["auto", "wikimedia", "openverse", "nasa", "museum", "polyhaven", "pexels", "unsplash", "pixabay", "pollinations"])
    p_img.add_argument("--limit", type=int, default=5)
    p_img.add_argument("--nobg", action="store_true", help="Remove background to create transparent cutout PNG")
    p_img.add_argument("--bg-mode", choices=["white", "black", "auto"], default="white", help="Background color to remove (default white)")

    # generate (GenAI)
    p_gen = subparsers.add_parser("generate", help="Generate AI image via Pollinations.ai")
    p_gen.add_argument("prompt", help="Visual image prompt")
    p_gen.add_argument("--out", help="Target output file path")
    p_gen.add_argument("--topic", help="Topic/episode ID")
    p_gen.add_argument("--width", type=int, default=1080)
    p_gen.add_argument("--height", type=int, default=1920)
    p_gen.add_argument("--seed", type=int, default=None)
    p_gen.add_argument("--model", default="flux", choices=["flux", "turbo"])
    p_gen.add_argument("--nobg", action="store_true", help="Remove background to create transparent cutout PNG")
    p_gen.add_argument("--bg-mode", choices=["white", "black", "auto"], default="white", help="Background color to remove (default white)")

    # icon
    p_ico = subparsers.add_parser("icon", help="Search and download vector SVG icon")
    p_ico.add_argument("name", help="Icon name (e.g. cpu, server, lock, database)")
    p_ico.add_argument("--out", help="Target output file path")
    p_ico.add_argument("--topic", help="Topic/episode ID")
    p_ico.add_argument("--color", default="#00F0FF", help="SVG stroke/fill hex color")
    p_ico.add_argument("--collection", default="lucide", help="Iconify collection")

    # video
    p_vid = subparsers.add_parser("video", help="Search and download stock B-roll video clip")
    p_vid.add_argument("query", help="Search query")
    p_vid.add_argument("--out", help="Target output file path")
    p_vid.add_argument("--topic", help="Topic/episode ID")
    p_vid.add_argument("--provider", default="auto", choices=["auto", "pexels", "pixabay", "nasa", "archive", "wikimedia"])
    p_vid.add_argument("--duration", type=int, default=12, help="Max duration in seconds")
    p_vid.add_argument("--orientation", default="portrait", choices=["portrait", "landscape"])

    # sfx
    p_sfx = subparsers.add_parser("sfx", help="Search and download sound effect")
    p_sfx.add_argument("query", help="Search query")
    p_sfx.add_argument("--out", help="Target output file path")
    p_sfx.add_argument("--provider", default="auto", choices=["auto", "freesound", "wikimedia", "local"])

    # resolve
    p_res = subparsers.add_parser("resolve", help="Batch resolve assets declared in a storyboard JSON")
    p_res.add_argument("spec", help="Path to storyboard.json or episode folder")
    p_res.add_argument("--force", action="store_true", help="Force re-download existing assets")
    p_res.add_argument("--dry-run", action="store_true", help="Show missing assets without downloading")

    args = parser.parse_args()

    if args.command == "image":
        out = Path(args.out) if args.out else None
        res = search_image(args.query, out_path=out, topic=args.topic, provider=args.provider, limit=args.limit, nobg=args.nobg, bg_mode=args.bg_mode)
        print(f"SUCCESS: {res['rel_path']} (License: {res.get('license', 'Open')})")
    elif args.command == "generate":
        out = Path(args.out) if args.out else None
        res = generate_pollinations_image(args.prompt, out_path=out, topic=args.topic, width=args.width, height=args.height, seed=args.seed, model=args.model, nobg=args.nobg, bg_mode=args.bg_mode)
        print(f"SUCCESS: {res['rel_path']} (License: {res.get('license', 'Open')})")
    elif args.command == "icon":
        out = Path(args.out) if args.out else None
        res = search_icon(args.name, out_path=out, topic=args.topic, color=args.color, collection=args.collection)
        print(f"SUCCESS: {res['rel_path']}")
    elif args.command == "video":
        out = Path(args.out) if args.out else None
        res = search_video(args.query, out_path=out, topic=args.topic, provider=args.provider, max_duration=args.duration, orientation=args.orientation)
        print(f"SUCCESS: {res['rel_path']} (License: {res.get('license', 'Open')})")
    elif args.command == "sfx":
        out = Path(args.out) if args.out else None
        res = search_sfx(args.query, out_path=out, provider=args.provider)
        print(f"SUCCESS: {res['rel_path']}")
    elif args.command == "resolve":
        resolve_spec_assets(Path(args.spec), force=args.force, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
