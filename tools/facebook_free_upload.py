#!/usr/bin/env python3
"""
100% Free Facebook Reels Uploader via Browser Automation (Playwright)
====================================================================
Publishes vertical reels directly to Facebook without Meta Developer apps or Graph API keys ($0.00).
Maintains a persistent session in `.browser_profiles/facebook` so you only have to log in once.

Usage:
    .venv/bin/python tools/facebook_free_upload.py episodes/tesla-flying-roadster/final.mp4
    .venv/bin/python tools/facebook_free_upload.py --login-only
"""

import argparse
import json
import os
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

PROFILE_DIR = ROOT / ".browser_profiles" / "facebook"
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


def format_facebook_caption(video: Path, custom_text: str = None) -> str:
    if custom_text:
        return custom_text.strip()

    meta = get_episode_metadata(video)
    title = meta.get("title") or video.parent.name.replace("-", " ").title()
    desc = meta.get("description", "")
    hashtags = meta.get("hashtags", [])
    
    default_tags = ["#reels", "#fbpage", "#viral", "#edushorts"]
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
            'div[aria-label="Your profile"]',
            'div[aria-label="Account"]',
            'svg[aria-label="Your profile"]',
            'div[role="feed"]',
            'a[href*="/me/"]',
        ]
        for sel in selectors:
            if page.locator(sel).first.is_visible(timeout=1500):
                return True
        if "/login" not in page.url and "facebook.com" in page.url and len(page.url.rstrip("/").split("facebook.com")[-1]) <= 1:
            return True
    except Exception:
        pass
    return False


def wait_for_user_login(page, timeout_sec: int = 180) -> bool:
    print("\n" + "=" * 65)
    print("🔑 Facebook One-Time Login Required")
    print("=" * 65)
    print("👉 A browser window has opened to https://www.facebook.com/login.")
    print("👉 Please log into your Facebook account in the opened window.")
    print("👉 Once logged in, your session is saved permanently in .browser_profiles/facebook.")
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


def get_env(*keys: str) -> str:
    env_file = ROOT / ".env"
    if env_file.is_file():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            k = k.strip()
            v = v.strip().strip('"').strip("'")
            if k in keys and v:
                return v
    for k in keys:
        v = os.getenv(k)
        if v:
            return v
    return ""


def upload_to_facebook_free(video: Path, caption: str = None, headless: bool = False) -> str:
    from playwright.sync_api import sync_playwright

    video = video.resolve()
    if not video.is_file():
        raise FileNotFoundError(f"Video file not found: {video}")

    caption_text = format_facebook_caption(video, caption)
    page_id = get_env("FB_PAGE_ID", "FACEBOOK_PAGE_ID") or "101495382307544"
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)

    print("\n" + "=" * 65)
    print("📘 100% Free Facebook Reels Publisher (Playwright)")
    print("=" * 65)
    print(f"📦 Video File : {video.name} ({video.stat().st_size / (1024*1024):.1f} MB)")
    print(f"🏢 Destination: Facebook Page ID: {page_id} (Rajan का ADDA)")
    print(f"📝 Caption Preview:\n   {caption_text[:120]}...")
    # STRICT Brand Verification - Rajan का ADDA Only
    if str(page_id) != "101495382307544":
        raise RuntimeError(f"STRICT POLICY VIOLATION: Facebook Page ID {page_id} is not 'Rajan का ADDA' (101495382307544). Upload aborted.")

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            channel="msedge",
            headless=headless,
            viewport={"width": 1280, "height": 850},
            args=["--disable-blink-features=AutomationControlled"],
        )

        page = context.pages[0] if context.pages else context.new_page()

        # Step 1: Open Meta Business Suite Reels Composer for the Page
        composer_url = f"https://business.facebook.com/latest/reels_composer?asset_id={page_id}"
        print(f"\n🌐 Navigating to Meta Business Suite for Page (Rajan का ADDA) with Microsoft Edge...")
        page.goto(composer_url, timeout=60000, wait_until="domcontentloaded")
        page.wait_for_timeout(5000)

        # Handle cookie banners if present
        try:
            cookie_btn = page.locator('button:has-text("Allow essential and optional cookies"), button:has-text("Allow all cookies"), div[role="button"]:has-text("Decline optional cookies")').first
            if cookie_btn.is_visible(timeout=3000):
                cookie_btn.click()
        except Exception:
            pass

        # Step 2: Ensure Logged In
        if "login" in page.url or (not is_logged_in(page) and "business.facebook.com" not in page.url):
            if headless:
                context.close()
                raise RuntimeError("Not logged into Facebook. Please run with visible browser once: .venv/bin/python tools/facebook_free_upload.py --login-only")

            page.goto("https://www.facebook.com/login", timeout=60000)
            logged_in = wait_for_user_login(page, timeout_sec=180)
            if not logged_in:
                context.close()
                raise TimeoutError("Login timed out. Please run again and complete login.")

            page.goto(composer_url, timeout=60000)
            page.wait_for_timeout(5000)

        # Step 3: Attach Video File
        print(f"📤 Attaching video file to Page Reel: {video.name}...")
        attached = False
        # Try checking for active input[type="file"]
        for _ in range(5):
            file_input = page.locator('input[type="file"]')
            if file_input.count() > 0:
                file_input.first.set_input_files(str(video))
                attached = True
                break
            page.wait_for_timeout(1000)

        if not attached:
            add_video_btn = page.locator(
                'div[role="button"]:has-text("Add Video"), div[role="button"]:has-text("Add video"), '
                'button:has-text("Add Video"), button:has-text("Add video"), '
                'div[role="button"]:has-text("Upload"), button:has-text("Upload")'
            ).first
            if add_video_btn.is_visible(timeout=8000):
                try:
                    with page.expect_file_chooser(timeout=15000) as fc_info:
                        add_video_btn.click()
                    fc_info.value.set_files(str(video))
                    attached = True
                except Exception:
                    pass

        if not attached:
            try:
                page.locator('input[type="file"]').first.set_input_files(str(video), timeout=15000)
                attached = True
            except Exception as ex:
                Path("scratch").mkdir(exist_ok=True)
                page.screenshot(path="scratch/facebook_error.png")
                raise ex
        page.wait_for_timeout(6000)

        # Step 4: Enter Caption
        print("📝 Entering Reel caption & hashtags...")
        try:
            desc_box = page.locator('div[role="textbox"]').first
            if desc_box.is_visible(timeout=10000):
                desc_box.click()
                page.keyboard.insert_text(caption_text)
                page.wait_for_timeout(2000)
        except Exception as e:
            print(f"   Note: Caption box selector: {e}")

        # Step 5: Advance through wizard steps (Create -> Edit -> Share)
        print("➡️  Advancing through Reels creator wizard steps...")
        for step_idx in range(1, 3):
            next_btn = page.locator('div[role="button"]:has-text("Next"), button:has-text("Next")').last
            if next_btn.is_visible(timeout=5000):
                print(f"   Advancing step {step_idx} via Next...")
                # Wait if disabled during initial video load
                for _ in range(30):
                    if next_btn.get_attribute("aria-disabled") != "true" and not next_btn.is_disabled():
                        break
                    page.wait_for_timeout(1000)
                try:
                    next_btn.click()
                except Exception:
                    next_btn.evaluate("el => el.click()")
                page.wait_for_timeout(4000)

        # Step 6: Click Share button on final Share step
        print("🚀 Clicking Share Reel button on Page...")
        share_btn = page.locator('div[role="button"]:has-text("Share"), button:has-text("Share")').last
        share_btn.wait_for(state="visible", timeout=30000)

        # Poll if Share button is disabled while uploading
        upload_start = time.time()
        while time.time() - upload_start < 300:
            is_disabled = share_btn.get_attribute("aria-disabled") == "true" or share_btn.is_disabled()
            if not is_disabled:
                break
            page.wait_for_timeout(2000)
            print("   ...still uploading video on Facebook...")

        try:
            share_btn.click()
        except Exception:
            share_btn.evaluate("el => el.click()")

        print("⏳ Waiting for Reel upload finalization and distribution on Meta servers...")
        # Wait until 'Publishing your post' modal completes or page navigates away
        modal_deadline = time.time() + 180
        while time.time() < modal_deadline:
            publishing_modal = page.locator("text='Publishing your post'").first
            if not publishing_modal.is_visible(timeout=2000):
                break
            page.wait_for_timeout(3000)
            print("   ...transcoding & distributing Reel on Meta servers...")

        page.wait_for_timeout(5000)

        # Retrieve direct reel URL if visible in published posts / page reels
        post_url = f"https://www.facebook.com/reel/"
        try:
            page.goto(f"https://business.facebook.com/latest/posts/published_posts?asset_id={page_id}", timeout=45000, wait_until="commit")
            page.wait_for_timeout(6000)
            reel_link = page.locator('a[href*="/reel/"]').first
            if reel_link.is_visible(timeout=5000):
                href = reel_link.get_attribute("href")
                if href:
                    post_url = href if href.startswith("http") else f"https://www.facebook.com{href}"
        except Exception:
            pass

        if post_url == "https://www.facebook.com/reel/":
            post_url = f"https://www.facebook.com/{page_id}/reels"
        print("\n" + "=" * 65)
        print("🎉 SUCCESS! Reel published to Facebook Page ($0.00 Free):")
        print(f"🏢 Page: Rajan का ADDA (ID: {page_id})")
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
            manifest[key]["facebook"] = post_url
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
                channel="msedge",
                headless=False,
                viewport={"width": 1280, "height": 850},
            )
            page = context.pages[0] if context.pages else context.new_page()
            page.goto("https://www.facebook.com/login", timeout=60000)
            wait_for_user_login(page, timeout_sec=300)
            context.close()
        return 0

    if not args.video:
        parser.error("Specify a video file to upload, e.g. .venv/bin/python tools/facebook_free_upload.py episodes/tesla-flying-roadster/final.mp4")

    upload_to_facebook_free(args.video, args.caption, headless=args.headless)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
