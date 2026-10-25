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


def sync_cookies_from_threads(context):
    threads_dir = ROOT / ".browser_profiles" / "threads"
    if not threads_dir.is_dir():
        return
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            ctx_threads = p.chromium.launch_persistent_context(
                user_data_dir=str(threads_dir),
                headless=True,
            )
            ig_cookies = [c for c in ctx_threads.cookies() if "instagram.com" in c.get("domain", "")]
            ctx_threads.close()
            if ig_cookies:
                context.add_cookies(ig_cookies)
                print(f"🔄 Synced {len(ig_cookies)} Instagram authentication cookies from Threads session.")
    except Exception as e:
        pass


def is_logged_in(page) -> bool:
    try:
        if "/accounts/login" in page.url or "/accounts/emailsignup" in page.url:
            return False
        # Check explicit logged-out indicators
        if page.locator('input[name="username"]').first.is_visible(timeout=1000):
            return False
        if page.locator('a:has-text("Create new account")').first.is_visible(timeout=1000):
            return False
            
        selectors = [
            'svg[aria-label="New post"]',
            'svg[aria-label="Create"]',
            'svg[aria-label="Home"]',
            'a[href*="/direct/inbox/"]',
            'svg[aria-label="Search"]',
            'svg[aria-label="Explore"]',
            'svg[aria-label="Reels"]',
        ]
        for sel in selectors:
            if page.locator(sel).first.is_visible(timeout=1500):
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
            channel="msedge",
            headless=headless,
            viewport={"width": 1280, "height": 850},
            args=["--disable-blink-features=AutomationControlled"],
        )

        # Check existing cookies or sync from threads if needed
        existing_ig_cookies = [c for c in context.cookies() if "instagram.com" in c.get("domain", "") and c.get("name") == "sessionid"]
        if not existing_ig_cookies:
            sync_cookies_from_threads(context)

        page = context.pages[0] if context.pages else context.new_page()

        print("\n🌐 Navigating to https://www.instagram.com/ with Microsoft Edge...")
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
            # Try syncing cookies one more time
            sync_cookies_from_threads(context)
            page.reload(wait_until="domcontentloaded")
            page.wait_for_timeout(3000)

        if not is_logged_in(page):
            if headless:
                context.close()
                raise RuntimeError("Not logged into Instagram. Please run with visible browser once: .venv/bin/python tools/instagram_free_upload.py --login-only")

            page.goto("https://www.instagram.com/accounts/login/", timeout=60000)
            logged_in = wait_for_user_login(page, timeout_sec=180)
            if not logged_in:
                context.close()
                raise TimeoutError("Login timed out. Please run again and complete login.")

        # Step 1b: STRICT Brand Verification - Rajan का ADDA Only
        profile_links = [a.get_attribute("href") or "" for a in page.locator('a[href*="/"]').all() if a.get_attribute("href")]
        is_rajan = any("rajan.ka.adda" in h.lower() or "rajan_ka_adda" in h.lower() for h in profile_links)
        if not is_rajan:
            body_text = page.locator("nav, header, aside").all_inner_texts()
            is_rajan = any("rajan" in t.lower() and "adda" in t.lower() for t in body_text)

        # If not initially on rajan.ka.adda, automatically switch
        if not is_rajan:
            try:
                print("   Switching active Instagram account to @rajan.ka.adda...")
                more = page.locator('svg[aria-label="Settings"], svg[aria-label="More"], a:has(span:has-text("More"))').first
                if more.is_visible(timeout=3000):
                    more.click()
                    page.wait_for_timeout(1500)
                    switch = page.locator('span:has-text("Switch accounts")').first
                    if switch.is_visible(timeout=3000):
                        switch.click()
                        page.wait_for_timeout(2000)
                        rajan_elem = page.locator('span:has-text("rajan.ka.adda"), div:has-text("rajan.ka.adda")').last
                        if rajan_elem.is_visible(timeout=3000):
                            rajan_elem.click()
                            page.wait_for_timeout(5000)
                            profile_links = [a.get_attribute("href") or "" for a in page.locator('a[href*="/"]').all() if a.get_attribute("href")]
                            is_rajan = any("rajan.ka.adda" in h.lower() or "rajan_ka_adda" in h.lower() for h in profile_links)
            except Exception:
                pass

        if not is_rajan:
            context.close()
            raise RuntimeError("STRICT POLICY VIOLATION: Current Instagram account is NOT 'rajan.ka.adda' / 'rajan_ka_adda'. Upload aborted.")
        print("✅ Verified official brand account: Rajan का ADDA (@rajan.ka.adda)")

        # Step 2: Click "Create" Button
        print("🎬 Opening Instagram Create modal...")
        create_btn = page.locator('a:has(span:has-text("Create")), svg[aria-label="New post"], svg[aria-label="Create"], a[aria-label="New post"]').first
        create_btn.wait_for(state="visible", timeout=15000)
        create_btn.click()
        page.wait_for_timeout(2000)

        # In modern Instagram, clicking Create reveals a "Post" option in a popover
        try:
            post_sub_link = page.get_by_role("link", name="Post Post")
            if post_sub_link.is_visible(timeout=2000):
                post_sub_link.click()
                page.wait_for_timeout(2500)
            else:
                post_sub_btn = page.locator('div[role="menu"] a, span:has-text("Post")').first
                if post_sub_btn.is_visible(timeout=2000):
                    post_sub_btn.click()
                    page.wait_for_timeout(2500)
        except Exception:
            pass

        # Step 3: Attach Video File
        print(f"📤 Attaching video file: {video.name}...")
        file_input = page.locator('input[type="file"]').first
        file_input.wait_for(state="attached", timeout=15000)
        file_input.set_input_files(str(video))
        page.wait_for_timeout(5000)

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

        # Handle any "Video posts are now shared as reels" or "OK" modals
        try:
            ok_btn = page.locator('button:has-text("OK"), div[role="button"]:has-text("OK")').first
            if ok_btn.is_visible(timeout=3000):
                ok_btn.click()
                page.wait_for_timeout(1000)
        except Exception:
            pass

        # Step 4: Click Next (Crop screen -> Cover/Trim screen)
        print("➡️  Advancing to edit/cover screen...")
        next_btn = page.locator('div[role="button"]:has-text("Next"), button:has-text("Next")').first
        next_btn.wait_for(state="visible", timeout=20000)
        try:
            next_btn.evaluate("el => el.click()")
        except Exception:
            next_btn.click(force=True)
        page.wait_for_timeout(3000)

        # Step 5: Click Next (Cover screen -> Caption screen)
        print("➡️  Advancing to caption screen...")
        next_btn2 = page.locator('div[role="button"]:has-text("Next"), button:has-text("Next")').first
        next_btn2.wait_for(state="visible", timeout=20000)
        try:
            next_btn2.evaluate("el => el.click()")
        except Exception:
            next_btn2.click(force=True)
        page.wait_for_timeout(3000)

        # Step 6: Enter Caption
        print("📝 Entering Reel caption & hashtags...")
        caption_area = page.locator('div[aria-label="Write a caption..."], div[contenteditable="true"][role="textbox"]').first
        caption_area.wait_for(state="visible", timeout=20000)
        try:
            caption_area.click(force=True)
        except Exception:
            caption_area.focus()
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
            # Take screenshot of whatever modal/error is visible
            Path("scratch").mkdir(exist_ok=True)
            page.screenshot(path="scratch/instagram_share_timeout.png")
            raise RuntimeError("Instagram upload confirmation banner not detected within 5 minutes. Check scratch/instagram_share_timeout.png")

        print("✅ Reel upload confirmed by Instagram!")
        page.wait_for_timeout(5000)

        # Step 9: Capture Latest Reel URL
        # Read manifest to avoid grabbing previous episode URL
        prev_ig_url = None
        try:
            if MANIFEST_FILE.is_file():
                mf = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
                for ep_key, ep_data in mf.items():
                    if isinstance(ep_data, dict) and "instagram" in ep_data and ep_data["instagram"]:
                        prev_ig_url = ep_data["instagram"]
        except Exception:
            pass

        post_url = None
        for attempt in range(1, 5):
            try:
                page.goto("https://www.instagram.com/rajan.ka.adda/reels/", timeout=30000, wait_until="domcontentloaded")
                page.wait_for_timeout(4000)
                reel_links = [a.get_attribute("href") for a in page.locator('a[href*="/reel/"]').all() if a.get_attribute("href")]
                for rlink in reel_links:
                    full_link = f"https://www.instagram.com{rlink}" if rlink.startswith("/") else rlink
                    if full_link != prev_ig_url and "reels" not in full_link.split("/reel/")[0]:
                        post_url = full_link
                        break
                if post_url:
                    break
            except Exception as e:
                print(f"   Retry {attempt} locating new reel on profile: {e}")
            page.wait_for_timeout(5000)

        if not post_url:
            post_url = "https://www.instagram.com/rajan.ka.adda/reels/"

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
                channel="msedge",
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
