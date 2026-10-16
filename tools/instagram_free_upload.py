#!/usr/bin/env python3
"""
100% Free Instagram Reels Uploader via Browser Automation (Playwright)
======================================================================
Publishes vertical reels directly to Instagram without Meta Developer apps or API tokens ($0.00).
Maintains a persistent session in `.browser_profiles/instagram` so you only have to log in once.

Usage:
    .venv/bin/python tools/instagram_free_upload.py episodes/tesla-flying-roadster/final.mp4
    .venv/bin/python tools/instagram_free_upload.py --login-only
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

PROFILE_DIR = ROOT / ".browser_profiles" / "instagram"
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


def format_instagram_caption(video: Path, custom_text: str = None) -> str:
    if custom_text:
        return custom_text.strip()

    meta = get_episode_metadata(video)
    title = meta.get("title") or video.parent.name.replace("-", " ").title()
    desc = meta.get("description", "")
    hashtags = meta.get("hashtags", [])
    
    # Ensure #reels #explore is included
    default_tags = ["#reels", "#explore", "#viral", "#edushorts"]
    all_tags = []
    for h in hashtags + default_tags:
        clean = "#" + h.lstrip("#")
        if clean not in all_tags:
            all_tags.append(clean)
            
    hashtag_str = " ".join(all_tags[:15])
    
    body = desc if desc else title
    return f"{title}\n\n{body}\n\n{hashtag_str}".strip()


def is_logged_in(page) -> bool:
    try:
        selectors = [
            'svg[aria-label="New post"]',
            'svg[aria-label="Create"]',
            'svg[aria-label="Home"]',
            'a[href*="/direct/inbox/"]',
            'span:has-text("Create")',
            'a:has-text("Create")',
        ]
        for sel in selectors:
            if page.locator(sel).first.is_visible(timeout=1500):
                return True
        if "/accounts/login" not in page.url and "/" == page.url.rstrip("/").split("instagram.com")[-1]:
            # On home feed
            return True
    except Exception:
        pass
    return False


def wait_for_user_login(page, timeout_sec: int = 180) -> bool:
    print("\n" + "=" * 65)
    print("🔑 Instagram One-Time Login Required")
    print("=" * 65)
    print("👉 A browser window has opened to https://www.instagram.com/accounts/login/.")
    print("👉 Please log into your Instagram account in the opened window.")
    print("👉 Once logged in, your session is saved permanently in .browser_profiles/instagram.")
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


def upload_to_instagram_free(video: Path, caption: str = None, headless: bool = False) -> str:
    from playwright.sync_api import sync_playwright

    video = video.resolve()
    if not video.is_file():
        raise FileNotFoundError(f"Video file not found: {video}")

    caption_text = format_instagram_caption(video, caption)
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)

    print("\n" + "=" * 65)
    print("📸 100% Free Instagram Reels Publisher (Playwright)")
    print("=" * 65)
    print(f"📦 Video File : {video.name} ({video.stat().st_size / (1024*1024):.1f} MB)")
    print(f"📝 Caption Preview:\n   {caption_text[:120]}...")
    print("=" * 65)

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=headless,
            viewport={"width": 1280, "height": 850},
            args=["--disable-blink-features=AutomationControlled"],
        )

        page = context.pages[0] if context.pages else context.new_page()

        print("\n🌐 Navigating to https://www.instagram.com/...")
        page.goto("https://www.instagram.com/", timeout=60000, wait_until="domcontentloaded")
        page.wait_for_timeout(3500)

        # Handle 'Save your login info?' or cookie dialogs if present
        try:
            not_now_btns = page.locator('button:has-text("Not now"), button:has-text("Not Now"), div[role="button"]:has-text("Not now")')
            if not_now_btns.first.is_visible(timeout=3000):
                not_now_btns.first.click()
        except Exception:
            pass

        # Step 1: Ensure Logged In
        if not is_logged_in(page):
            if headless:
                context.close()
                raise RuntimeError("Not logged into Instagram. Please run with visible browser once: .venv/bin/python tools/instagram_free_upload.py --login-only")

            page.goto("https://www.instagram.com/accounts/login/", timeout=60000)
            logged_in = wait_for_user_login(page, timeout_sec=180)
            if not logged_in:
                context.close()
                raise TimeoutError("Login timed out. Please run again and complete login.")

        # Step 2: Click "Create" Button
        print("🎬 Opening Instagram Create modal...")
        create_btn = page.locator('svg[aria-label="New post"], svg[aria-label="Create"], span:has-text("Create"), a:has-text("Create")').first
        create_btn.wait_for(state="visible", timeout=15000)
        create_btn.click()
        page.wait_for_timeout(2000)

        # Step 3: Attach Video File
        print(f"📤 Attaching video file: {video.name}...")
        file_input = page.locator('input[type="file"]').first
        file_input.set_input_files(str(video))
        page.wait_for_timeout(4000)

        # Handle aspect ratio / crop step
        # By default, Instagram vertical videos (9:16) can trigger an aspect ratio prompt
        try:
            crop_btn = page.locator('button:has(svg[aria-label="Select crop"]), svg[aria-label="Select crop"]').first
            if crop_btn.is_visible(timeout=3000):
                crop_btn.click()
                page.wait_for_timeout(1000)
                # Select "Original" or "9:16"
                orig_btn = page.locator('button:has-text("Original"), span:has-text("Original"), div[role="button"]:has-text("Original"), button:has-text("9:16")').first
                if orig_btn.is_visible(timeout=2000):
                    orig_btn.click()
                    page.wait_for_timeout(1000)
        except Exception:
            pass

        # Step 4: Click Next (Crop screen -> Cover/Trim screen)
        print("➡️  Advancing to edit/cover screen...")
        next_btn = page.locator('div[role="button"]:has-text("Next"), button:has-text("Next")').first
        next_btn.wait_for(state="visible", timeout=20000)
        next_btn.click()
        page.wait_for_timeout(3000)

        # Step 5: Click Next (Cover screen -> Caption screen)
        print("➡️  Advancing to caption screen...")
        next_btn2 = page.locator('div[role="button"]:has-text("Next"), button:has-text("Next")').first
        next_btn2.wait_for(state="visible", timeout=20000)
        next_btn2.click()
        page.wait_for_timeout(3000)

        # Step 6: Enter Caption
        print("📝 Entering Reel caption & hashtags...")
        caption_area = page.locator('div[aria-label="Write a caption..."], div[contenteditable="true"][role="textbox"]').first
        caption_area.wait_for(state="visible", timeout=20000)
        caption_area.click()
        page.wait_for_timeout(500)
        page.keyboard.insert_text(caption_text)
        page.wait_for_timeout(2000)

        # Step 7: Click Share
        print("🚀 Clicking Share button to publish Reel...")
        share_btn = page.locator('div[role="button"]:has-text("Share"), button:has-text("Share")').first
        share_btn.wait_for(state="visible", timeout=20000)
        
        # Execute click via JS and force click
        try:
            share_btn.evaluate("el => el.click()")
        except Exception:
            share_btn.click(force=True)

        # Step 8: Wait for Upload to Complete
        print("⏳ Uploading Reel to Instagram (waiting for upload confirmation)...")
        upload_start = time.time()
        shared_confirmed = False
        while time.time() - upload_start < 300: # 5 min timeout
            try:
                # Check for "Your reel has been shared" or "Your post has been shared"
                confirm = page.locator('text="Your reel has been shared", text="Your post has been shared", text="Reel shared", text="Post shared"').first
                if confirm.is_visible(timeout=3000):
                    shared_confirmed = True
                    break
            except Exception:
                pass
            page.wait_for_timeout(4000)
            print("   ...still uploading/transcoding on Instagram...")

        if not shared_confirmed:
            print("⚠️ Upload confirmation banner not detected; waiting 10s buffer...")
            page.wait_for_timeout(10000)

        # Step 9: Capture Latest Reel URL
        post_url = "https://www.instagram.com/reels/"
        try:
            # Navigate to profile to locate newly published reel
            profile_btn = page.locator('a[href*="/reels/"], span:has-text("Profile"), a[href*="/profile/"]').first
            if profile_btn.is_visible(timeout=4000):
                profile_btn.click()
                page.wait_for_timeout(4000)
                reel_link = page.locator('a[href*="/reel/"]').first
                if reel_link.is_visible(timeout=5000):
                    href = reel_link.get_attribute("href")
                    if href:
                        post_url = f"https://www.instagram.com{href}" if href.startswith("/") else href
        except Exception:
            pass

        print("\n" + "=" * 65)
        print("🎉 SUCCESS! Reel published to Instagram ($0.00 Free):")
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
            manifest[key]["instagram"] = post_url
            manifest[key]["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%S%z")
            MANIFEST_FILE.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        except Exception as e:
            print(f"Note: Could not update manifest: {e}")

        context.close()
        return post_url


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", nargs="?", type=Path, help="Path to final.mp4 video file")
    parser.add_argument("--caption", help="Custom caption")
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
            page.goto("https://www.instagram.com/accounts/login/", timeout=60000)
            wait_for_user_login(page, timeout_sec=300)
            context.close()
        return 0

    if not args.video:
        parser.error("Specify a video file to upload, e.g. .venv/bin/python tools/instagram_free_upload.py episodes/tesla-flying-roadster/final.mp4")

    upload_to_instagram_free(args.video, args.caption, headless=args.headless)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
