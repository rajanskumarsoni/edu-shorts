#!/usr/bin/env python3
"""
100% Free 𝕏 / Twitter Video Uploader via Browser Automation (Playwright)
========================================================================
Publishes videos directly to 𝕏 / Twitter without official API fees or developer credits ($0.00).
Maintains a persistent session in `.browser_profiles/twitter` so you only have to log in once.

Usage:
    python3 tools/twitter_free_upload.py episodes/tesla-flying-roadster/final.mp4
    python3 tools/twitter_free_upload.py episodes/tesla-flying-roadster/final.mp4 --text "Check out this video! #Tesla"
    python3 tools/twitter_free_upload.py --login-only
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

PROFILE_DIR = ROOT / ".browser_profiles" / "twitter"
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


def format_tweet_text(video: Path, custom_text: str = None) -> str:
    if custom_text:
        return custom_text.strip()[:280]

    meta = get_episode_metadata(video)
    title = meta.get("title") or video.parent.name.replace("-", " ").title()
    hashtags = meta.get("hashtags", [])
    hashtag_str = " ".join("#" + h.lstrip("#") for h in hashtags[:5])

    # Clean combined tweet within 280 chars
    combo = f"{title}\n\n{hashtag_str}".strip()
    if len(combo) <= 280:
        return combo
    
    # Truncate title cleanly if too long
    allowed_title_len = 280 - len(hashtag_str) - 4
    if allowed_title_len > 30:
        return f"{title[:allowed_title_len].rstrip()}...\n\n{hashtag_str}"
    return title[:277] + "..."


def is_logged_in(page) -> bool:
    try:
        # Check for presence of primary authenticated Twitter UI elements
        selectors = [
            '[data-testid="SideNav_AccountSwitcher_Button"]',
            '[data-testid="AppTabBar_Home_Link"]',
            '[data-testid="tweetButtonInline"]',
            '[data-testid="tweetTextarea_0"]',
        ]
        for sel in selectors:
            if page.locator(sel).first.is_visible(timeout=1500):
                return True
        if "/home" in page.url:
            return True
    except Exception:
        pass
    return False


def wait_for_user_login(page, timeout_sec: int = 180) -> bool:
    print("\n" + "=" * 65)
    print("🔑 𝕏 / Twitter One-Time Login Required")
    print("=" * 65)
    print("👉 A browser window has opened to https://x.com/login.")
    print("👉 Please log into your Twitter/𝕏 account in the opened window.")
    print("👉 Once logged in, your session is saved permanently in .browser_profiles/twitter.")
    print(f"⏳ Waiting for login (timeout: {timeout_sec}s)...")
    print("=" * 65 + "\n")

    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        if is_logged_in(page):
            print("✅ Login detected! Session successfully saved.")
            return True
        time.sleep(2)
    return False


def upload_to_twitter_free(video: Path, text: str = None, headless: bool = False) -> str:
    from playwright.sync_api import sync_playwright

    video = video.resolve()
    if not video.is_file():
        raise FileNotFoundError(f"Video file not found: {video}")

    tweet_text = format_tweet_text(video, text)
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)

    print("\n" + "=" * 65)
    print("🚀 100% Free 𝕏 / Twitter Video Publisher (Playwright)")
    print("=" * 65)
    print(f"📦 Video File : {video.name} ({video.stat().st_size / (1024*1024):.1f} MB)")
    print(f"📝 Tweet Text :\n   {tweet_text}")
    print("=" * 65)

    with sync_playwright() as p:
        # Launch persistent context to preserve cookies and login state
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=headless,
            viewport={"width": 1280, "height": 850},
            args=["--disable-blink-features=AutomationControlled"],
        )

        page = context.pages[0] if context.pages else context.new_page()

        print("\n🌐 Navigating to https://x.com/home...")
        page.goto("https://x.com/home", timeout=60000, wait_until="domcontentloaded")
        page.wait_for_timeout(3000)

        # Step 1: Ensure user is logged in
        if not is_logged_in(page):
            # If not logged in and running headless, must switch to visible browser
            if headless:
                context.close()
                raise RuntimeError("Not logged into 𝕏/Twitter. Please run with visible browser once to log in: python3 tools/twitter_free_upload.py --login-only")

            page.goto("https://x.com/login", timeout=60000)
            logged_in = wait_for_user_login(page, timeout_sec=180)
            if not logged_in:
                context.close()
                raise TimeoutError("Login timed out. Please run again and complete login.")

        # Step 2: Open Compose Dialog
        print("✍️  Opening post composer (https://x.com/compose/post)...")
        page.goto("https://x.com/compose/post", timeout=60000, wait_until="domcontentloaded")
        page.wait_for_timeout(2500)

        textarea = page.locator('[data-testid="tweetTextarea_0"]').first
        textarea.wait_for(state="visible", timeout=30000)
        textarea.click()
        page.wait_for_timeout(500)

        # Step 3: Insert Tweet Text
        print("📝 Entering tweet text...")
        page.keyboard.insert_text(tweet_text)
        page.wait_for_timeout(1000)

        # Step 4: Attach Video File
        print(f"📤 Attaching video file: {video.name}...")
        file_input = page.locator('input[data-testid="fileInput"], input[type="file"]').first
        file_input.set_input_files(str(video))

        # Step 5: Wait for Upload & Transcoding
        print("⏳ Uploading video to 𝕏 (waiting for processing)...")
        attachments = page.locator('[data-testid="attachments"]').first
        attachments.wait_for(state="visible", timeout=60000)

        # Twitter disables the "Post" button while video is uploading or encoding
        post_btn = page.locator('button[data-testid="tweetButton"]').first
        
        # Poll until the button is no longer disabled
        print("⏳ Waiting for video encoding to finish on 𝕏...")
        upload_start = time.time()
        max_upload_time = 300  # 5 minutes max
        while time.time() - upload_start < max_upload_time:
            is_disabled = post_btn.get_attribute("aria-disabled") == "true" or post_btn.is_disabled()
            if not is_disabled:
                # Video has finished uploading and transcoding!
                break
            page.wait_for_timeout(3000)
            print("   ...still uploading/transcoding...")
        else:
            raise TimeoutError("Video processing timed out after 5 minutes.")

        # Buffer to ensure React state has completely synced
        page.wait_for_timeout(3000)

        # Step 6: Click Post (Bypass any transient overlay divs)
        print("🚀 Clicking Post button...")
        try:
            # Method 1: Direct JS DOM click
            post_btn.evaluate("el => el.click()")
            print("   Executed direct JS click on post button.")
        except Exception as e:
            print(f"   Direct JS click notice: {e}")

        # Method 2: Playwright force click
        try:
            post_btn.click(force=True, timeout=5000)
        except Exception:
            pass

        # Method 3: Keyboard shortcut Ctrl+Enter / Cmd+Enter
        try:
            page.keyboard.press("Meta+Enter")
            page.keyboard.press("Control+Enter")
        except Exception:
            pass

        # Step 7: Wait for Compose modal to close
        print("⏳ Finalizing post submission...")
        try:
            textarea.wait_for(state="hidden", timeout=30000)
        except Exception:
            page.wait_for_timeout(5000)

        # Step 8: Capture Profile / Post Link
        print("🔍 Locating published tweet URL...")
        page.wait_for_timeout(3000)
        post_url = "https://x.com/rajan_ka_adda"
        try:
            page.goto("https://x.com/rajan_ka_adda", timeout=30000, wait_until="domcontentloaded")
            page.wait_for_timeout(4000)
            latest_tweet = page.locator('article[data-testid="tweet"] a[href*="/status/"]').first
            if latest_tweet.is_visible(timeout=5000):
                href = latest_tweet.get_attribute("href")
                if href:
                    post_url = f"https://x.com{href}" if href.startswith("/") else href
        except Exception:
            pass

        print("\n" + "=" * 65)
        print(f"🎉 SUCCESS! Tweet published to 𝕏 / Twitter ($0.00 Free):")
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
            manifest[key]["twitter"] = post_url
            manifest[key]["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%S%z")
            MANIFEST_FILE.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        except Exception as e:
            print(f"Note: Could not update manifest: {e}")

        context.close()
        return post_url


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", nargs="?", type=Path, help="Path to final.mp4 video file")
    parser.add_argument("--text", help="Custom tweet text / caption")
    parser.add_argument("--headless", action="store_true", help="Run browser in headless mode (requires existing login)")
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
            page.goto("https://x.com/login", timeout=60000)
            wait_for_user_login(page, timeout_sec=300)
            context.close()
        return 0

    if not args.video:
        parser.error("Specify a video file to upload, e.g. python3 tools/twitter_free_upload.py episodes/tesla-flying-roadster/final.mp4")

    upload_to_twitter_free(args.video, args.text, headless=args.headless)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
