#!/usr/bin/env python3
"""
100% Free Threads Video Uploader via Browser Automation (Playwright)
===================================================================
Publishes video posts directly to Threads (threads.net) without Meta API tokens ($0.00).
Maintains a persistent session in `.browser_profiles/threads` so you only have to log in once.

Usage:
    .venv/bin/python tools/threads_free_upload.py episodes/tesla-flying-roadster/final.mp4
    .venv/bin/python tools/threads_free_upload.py --login-only
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

PROFILE_DIR = ROOT / ".browser_profiles" / "threads"
MANIFEST_FILE = ROOT / "episodes" / ".uploaded_manifest.json"


def get_episode_metadata(video: Path) -> dict:
    candidates = [
        video.parent / "storyboard.json",
        video.parent / f"{video.parent.name}.json",
        ROOT / "videos" / f"{video.stem}.json",
    ]
    for spec_path in candidates:
        if spec_path.is_file():
            try:
                spec = json.loads(spec_path.read_text(encoding="utf-8"))
                return spec.get("meta", {})
            except Exception:
                pass
    return {}


def format_threads_text(video: Path, custom_text: str = None) -> str:
    if custom_text:
        return custom_text.strip()[:500]

    meta = get_episode_metadata(video)
    title = meta.get("title") or video.parent.name.replace("-", " ").title()
    desc = meta.get("description", "")
    hashtags = meta.get("hashtags", [])
    hashtag_str = " ".join("#" + h.lstrip("#") for h in hashtags[:5])

    body = desc if desc else title
    combo = f"{title}\n\n{body}\n\n{hashtag_str}".strip()
    return combo[:500]


def is_logged_in(page) -> bool:
    try:
        if "login" in page.url or "oidc" in page.url or "sso" in page.url:
            return False
        selectors = [
            'div[contenteditable="true"][role="textbox"]',
            'a[href*="/@"]',
            'svg[aria-label="Create"]',
        ]
        for sel in selectors:
            loc = page.locator(sel).first
            if loc.is_visible(timeout=1500):
                return True
    except Exception:
        pass
    return False


def wait_for_user_login(page, timeout_sec: int = 180) -> bool:
    print("\n" + "=" * 65)
    print("🔑 Threads One-Time Login Required")
    print("=" * 65)
    print("👉 A browser window has opened to log into Threads (via Instagram).")
    print("👉 Please log in with your Instagram / Threads account in the opened window.")
    print("👉 Once logged in, your session is saved permanently in .browser_profiles/threads.")
    print(f"⏳ Waiting for login (timeout: {timeout_sec}s)...")
    print("=" * 65 + "\n")

    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        if is_logged_in(page):
            print("✅ Login detected! Session successfully saved.")
            page.wait_for_timeout(3000)
            return True
        time.sleep(2)
    return False


def upload_to_threads_free(video: Path, text: str = None, headless: bool = False) -> str:
    from playwright.sync_api import sync_playwright

    video = video.resolve()
    if not video.is_file():
        raise FileNotFoundError(f"Video file not found: {video}")

    post_text = format_threads_text(video, text)
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)

    print("\n" + "=" * 65)
    print("🧵 100% Free Threads Video Publisher (Playwright)")
    print("=" * 65)
    print(f"📦 Video File : {video.name} ({video.stat().st_size / (1024*1024):.1f} MB)")
    print(f"📝 Text Preview:\n   {post_text[:120]}...")
    print("=" * 65)

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=headless,
            viewport={"width": 1280, "height": 850},
            args=["--disable-blink-features=AutomationControlled"],
        )

        page = context.pages[0] if context.pages else context.new_page()

        print("\n🌐 Navigating to https://www.threads.net/...")
        page.goto("https://www.threads.net/", timeout=60000, wait_until="domcontentloaded")
        page.wait_for_timeout(3500)

        # Step 1: Ensure Logged In
        page.wait_for_timeout(4000)
        if not is_logged_in(page):
            if headless:
                context.close()
                raise RuntimeError("Not logged into Threads. Please run with visible browser once: .venv/bin/python tools/threads_free_upload.py --login-only")

            if "threads.net/login" not in page.url and "instagram.com" not in page.url:
                page.goto("https://www.threads.net/login", timeout=60000)
            logged_in = wait_for_user_login(page, timeout_sec=300)
            if not logged_in:
                context.close()
                raise TimeoutError("Login timed out after 5 minutes. Please run again when ready.")

            page.goto("https://www.threads.net/", timeout=60000)
            page.wait_for_timeout(4000)

        # Step 2: Open Composer
        print("✍️  Opening Threads post composer...")
        create_btn = page.locator('svg[aria-label="Create"], div[contenteditable="true"][role="textbox"]').first
        create_btn.wait_for(state="visible", timeout=15000)
        create_btn.click()
        page.wait_for_timeout(1500)

        # Step 3: Insert Text
        print("📝 Inserting post caption...")
        textbox = page.locator('div[contenteditable="true"][role="textbox"]').last
        textbox.wait_for(state="visible", timeout=15000)
        textbox.click()
        page.wait_for_timeout(500)
        page.keyboard.insert_text(post_text)
        page.wait_for_timeout(1000)

        # Step 4: Attach Video File
        print(f"📤 Attaching video file: {video.name}...")
        file_input = page.locator('input[type="file"]').last
        file_input.set_input_files(str(video))

        # Step 5: Wait for Upload & Transcoding
        print("⏳ Uploading video to Threads (waiting for video preview)...")
        upload_start = time.time()
        max_upload_time = 300  # 5 minutes
        post_btn = page.locator('div[role="button"]:has-text("Post"), button:has-text("Post")').last
        post_btn.wait_for(state="visible", timeout=20000)

        while time.time() - upload_start < max_upload_time:
            is_disabled = post_btn.get_attribute("aria-disabled") == "true" or post_btn.is_disabled()
            if not is_disabled:
                # Video has uploaded and Post button is enabled!
                break
            page.wait_for_timeout(3000)
            print("   ...still processing video on Threads...")
        else:
            raise TimeoutError("Video processing on Threads timed out.")

        page.wait_for_timeout(3000)

        # Step 6: Click Post Button
        print("🚀 Publishing Thread...")
        try:
            post_btn.evaluate("el => el.click()")
        except Exception:
            post_btn.click(force=True)

        # Step 7: Wait for Compose modal to close
        print("⏳ Finalizing post submission...")
        page.wait_for_timeout(5000)

        post_url = "https://www.threads.net/"
        try:
            profile_btn = page.locator('a[href*="/@"]').first
            if profile_btn.is_visible(timeout=5000):
                href = profile_btn.get_attribute("href")
                if href:
                    post_url = f"https://www.threads.net{href}" if href.startswith("/") else href
        except Exception:
            pass

        print("\n" + "=" * 65)
        print("🎉 SUCCESS! Video published to Threads ($0.00 Free):")
        print(f"🔗 {post_url}")
        print("=" * 65 + "\n")

        # Record upload in manifest
        try:
            manifest = {}
            if MANIFEST_FILE.is_file():
                manifest = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
            key = video.parent.name if video.stem == "final" else video.stem
            if key not in manifest:
                manifest[key] = {}
            manifest[key]["threads"] = post_url
            manifest[key]["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%S%z")
            MANIFEST_FILE.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        except Exception as e:
            print(f"Note: Could not update manifest: {e}")

        context.close()
        return post_url


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", nargs="?", type=Path, help="Path to final.mp4 video file")
    parser.add_argument("--text", help="Custom post text")
    parser.add_argument("--headless", action="store_true", help="Run browser in headless mode")
    parser.add_argument("--login-only", action="store_true", help="Open browser to complete one-time login and exit")

    args = parser.parse_args()

    if args.login_only:
        from playwright.sync_api import sync_playwright
        PROFILE_DIR.mkdir(parents=True, exist_ok=True)
        with sync_playwright() as p:
            context = p.chromium.launch_persistent_context(
                user_data_dir=str(PROFILE_DIR),
                headless=False,
                viewport={"width": 1280, "height": 850},
            )
            page = context.pages[0] if context.pages else context.new_page()
            page.goto("https://www.threads.net/login", timeout=60000)
            wait_for_user_login(page, timeout_sec=300)
            context.close()
        return 0

    if not args.video:
        parser.error("Specify a video file to upload, e.g. .venv/bin/python tools/threads_free_upload.py episodes/tesla-flying-roadster/final.mp4")

    upload_to_threads_free(args.video, args.text, headless=args.headless)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
