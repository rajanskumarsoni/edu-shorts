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
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


def _ensure_project_venv():
    venv_py = ROOT / ".venv" / "bin" / "python3"
    if not venv_py.is_file():
        return
    try:
        import playwright
    except ImportError:
        if Path(sys.executable).resolve() != venv_py.resolve():
            import subprocess
            res = subprocess.run([str(venv_py)] + sys.argv, cwd=str(ROOT))
            sys.exit(res.returncode)


_ensure_project_venv()

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
            channel="msedge",
            headless=headless,
            viewport={"width": 1280, "height": 850},
            args=["--disable-blink-features=AutomationControlled"],
        )

        page = context.pages[0] if context.pages else context.new_page()

        print("\n🌐 Navigating to https://www.threads.net/ with Microsoft Edge...")
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

        # Step 1b: STRICT Brand Verification - Rajan का ADDA Only
        profile_links = [a.get_attribute("href") or "" for a in page.locator('a[href*="/@"]').all()]
        is_rajan = any("rajan.ka.adda" in h.lower() or "rajan_ka_adda" in h.lower() for h in profile_links)
        if not is_rajan:
            context.close()
            raise RuntimeError(f"STRICT POLICY VIOLATION: Current Threads account ({profile_links[:2]}) is NOT 'rajan.ka.adda'. Upload aborted.")
        print("✅ Verified official brand account: @rajan.ka.adda")

        # Step 2: Open Composer
        print("✍️  Opening Threads post composer...")
        create_btn = page.locator('div:has-text("What\'s new?")').last
        if not create_btn.is_visible():
            create_btn = page.locator('svg[aria-label="Create"]').first
        if not create_btn.is_visible():
            create_btn = page.locator('button:has-text("New thread"), div:has-text("New thread")').first
        create_btn.click()
        page.wait_for_timeout(2000)

        dialog = page.locator('div[role="dialog"]').last
        dialog.wait_for(state="visible", timeout=10000)

        # Step 3: Insert Text
        print("📝 Inserting post caption...")
        textbox = dialog.locator('div[contenteditable="true"][role="textbox"]').first
        textbox.wait_for(state="visible", timeout=15000)
        textbox.click()
        page.wait_for_timeout(500)
        page.keyboard.insert_text(post_text)
        page.wait_for_timeout(1000)

        # Step 4: Attach Video File
        print(f"📤 Attaching video file: {video.name}...")
        file_input = dialog.locator('input[type="file"]').last
        file_input.set_input_files(str(video))

        # Step 5: Wait for Upload & Video Preview
        print("⏳ Uploading video to Threads (waiting for video preview)...")
        dialog.locator("video").first.wait_for(state="visible", timeout=60000)
        print("✅ Video preview rendered in Threads composer!")
        page.wait_for_timeout(3000)

        # Locate exact Post button inside the composer dialog
        post_btn = dialog.locator('div[role="button"], button').filter(has_text=re.compile(r"^Post$")).first
        post_btn.wait_for(state="visible", timeout=10000)

        # Step 6: Click Post Button
        print("🚀 Publishing Thread...")
        try:
            post_btn.evaluate("el => el.click()")
        except Exception:
            post_btn.click(force=True)

        # Step 7: Wait for Compose modal to close
        print("⏳ Waiting for composer modal to close...")
        dialog.wait_for(state="hidden", timeout=60000)
        print("✅ Composer modal closed! Video is being published by Threads...")

        # Step 8: Wait for the background "Posting..." toast to finish
        print("⏳ Waiting for Threads background transcoding and posting toast to complete...")
        try:
            posting_toast = page.locator('text="Posting..."').first
            if posting_toast.is_visible(timeout=10000):
                print("   Detected active \x27Posting...\x27 banner on Threads...")
                posting_toast.wait_for(state="hidden", timeout=180000)
                print("   \x27Posting...\x27 banner finished!")
        except Exception as e:
            print(f"   Notice while monitoring posting banner: {e}")

        # Buffer to let Threads feed index the new post
        page.wait_for_timeout(10000)

        # Step 9: Verify and Capture NEW Thread URL
        print("🔍 Verifying newly published thread on @rajan.ka.adda...")
        post_url = None
        
        # Check if a "View" link appeared in the toast
        try:
            view_toast = page.locator('a:has-text("View"), a[href*="/post/"]').first
            if view_toast.is_visible(timeout=5000):
                href = view_toast.get_attribute("href")
                if href and href.startswith("/"):
                    post_url = f"https://www.threads.net{href}"
                elif href and href.startswith("http"):
                    post_url = href
        except Exception:
            pass

        # Read manifest to know previously recorded URL so we never return a duplicate/old post!
        prev_threads_url = None
        try:
            if MANIFEST_FILE.is_file():
                mf = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
                for ep_key, ep_data in mf.items():
                    if isinstance(ep_data, dict) and "threads" in ep_data and ep_data["threads"]:
                        prev_threads_url = ep_data["threads"]
        except Exception:
            pass

        if not post_url or post_url == prev_threads_url:
            for attempt in range(1, 4):
                try:
                    page.goto("https://www.threads.net/@rajan.ka.adda", timeout=45000, wait_until="domcontentloaded")
                    page.wait_for_timeout(5000)
                    post_links = [a.get_attribute("href") for a in page.locator('a[href*="/post/"]').all() if a.get_attribute("href")]
                    for pl in post_links:
                        full_pl = f"https://www.threads.net{pl}" if pl.startswith("/") else pl
                        if full_pl != prev_threads_url:
                            post_url = full_pl
                            break
                    if post_url:
                        break
                except Exception as e:
                    print(f"   Retry {attempt} navigating to profile: {e}")
                page.wait_for_timeout(5000)

        if not post_url:
            post_url = "https://www.threads.net/@rajan.ka.adda"

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
                channel="msedge",
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
