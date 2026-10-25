#!/usr/bin/env python3
"""
100% Free LinkedIn Video Uploader via Browser Automation (Playwright)
====================================================================
Publishes vertical videos directly to a LinkedIn Company Page or Personal Profile ($0.00).
Maintains a persistent session in `.browser_profiles/linkedin` so you only have to log in once.

Usage:
    .venv/bin/python tools/linkedin_free_upload.py episodes/tesla-flying-roadster/final.mp4
    .venv/bin/python tools/linkedin_free_upload.py --login-only
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

PROFILE_DIR = ROOT / ".browser_profiles" / "linkedin"
MANIFEST_FILE = ROOT / "episodes" / ".uploaded_manifest.json"


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


def format_linkedin_text(video: Path, custom_text: str = None) -> str:
    if custom_text:
        return custom_text.strip()

    meta = get_episode_metadata(video)
    title = meta.get("title") or video.parent.name.replace("-", " ").title()
    desc = meta.get("description", "")
    hashtags = meta.get("hashtags", [])
    
    default_tags = ["#education", "#technology", "#learning", "#shorts", "#viral"]
    all_tags = []
    for h in hashtags + default_tags:
        clean = "#" + h.lstrip("#")
        if clean not in all_tags:
            all_tags.append(clean)
            
    hashtag_str = " ".join(all_tags[:10])
    body = desc if desc else title
    return f"{title}\n\n{body}\n\n{hashtag_str}".strip()


def get_company_page_id() -> str:
    org_urn = get_env("LINKEDIN_ORG_URN", "LINKEDIN_COMPANY_ID")
    if org_urn:
        match = re.search(r"\d+", org_urn)
        if match:
            return match.group(0)
    return ""


def is_logged_in(page) -> bool:
    try:
        if "login" in page.url or "checkpoint" in page.url or "signup" in page.url:
            return False
        selectors = [
            'button:has-text("Start a post")',
            'button:has-text("Create a post")',
            'div.share-box-feed-entry__wrapper',
            'nav.global-nav',
            'div[data-control-name="nav.settings"]',
            'img[alt*="photo"]',
            'button[aria-label*="Me"]',
            'div.nav-item__profile-member-photo',
        ]
        for sel in selectors:
            if page.locator(sel).first.is_visible(timeout=1500):
                return True
        if "linkedin.com" in page.url and ("/feed" in page.url or "/company/" in page.url):
            return True
    except Exception:
        pass
    return False


def wait_for_user_login(page, timeout_sec: int = 180) -> bool:
    print("\n" + "=" * 65)
    print("🔑 LinkedIn One-Time Login Required")
    print("=" * 65)
    print("👉 A browser window has opened to https://www.linkedin.com/login.")
    print("👉 Please log into your LinkedIn account in the opened window.")
    print("👉 Once logged in, your session is saved permanently in .browser_profiles/linkedin.")
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


def upload_to_linkedin_free(video: Path, text: str = None, title: str = "", headless: bool = False) -> str:
    from playwright.sync_api import sync_playwright

    video = video.resolve()
    if not video.is_file():
        raise FileNotFoundError(f"Video file not found: {video}")

    post_text = format_linkedin_text(video, text)
    company_id = get_company_page_id()
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)

    print("\n" + "=" * 65)
    print("💼 100% Free LinkedIn Video Publisher (Playwright)")
    print("=" * 65)
    print(f"📦 Video File : {video.name} ({video.stat().st_size / (1024*1024):.1f} MB)")
    if company_id:
        print(f"🏢 Destination: LinkedIn Company Page ID: {company_id}")
    else:
        print(f"👤 Destination: LinkedIn Personal Profile Feed")
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

        # Step 1 & 2: Ensure Logged In with Admin Access to Company Page
        print("\n🌐 Navigating to LinkedIn Company Page admin...")
        target_nav_url = f"https://www.linkedin.com/company/{company_id}/admin/feed/posts/" if company_id else "https://www.linkedin.com/feed/"
        try:
            page.goto(target_nav_url, timeout=45000, wait_until="domcontentloaded")
        except Exception:
            print("   DOMContentLoaded wait timed out or slow; falling back to commit state...")
            try:
                page.goto(target_nav_url, timeout=30000, wait_until="commit")
            except Exception:
                pass
        page.wait_for_timeout(4000)

        deadline = time.time() + 600  # 10 minutes timeout
        start_post_btn = None
        while time.time() < deadline:
            # Check if logged in
            if not is_logged_in(page):
                if "login" not in page.url:
                    page.goto(f"https://www.linkedin.com/login/?session_redirect={target_nav_url}", timeout=60000)
                print("🔑 Waiting for login to the LinkedIn account that manages Rajan Ka Adda...")
                page.wait_for_timeout(3000)
                continue

            # Check if redirected to no-access (different account logged in)
            if "no-access" in page.url or "unavailable" in page.url or page.locator("text='You don’t have access'").first.is_visible(timeout=1000):
                print("\n" + "=" * 65)
                print("⚠️ Current account does not have Admin access to this Company Page.")
                print("👉 Navigating to LinkedIn logout so you can sign into the owner account...")
                print("=" * 65 + "\n")
                page.goto("https://www.linkedin.com/m/logout", timeout=60000)
                page.wait_for_timeout(3000)
                page.goto(f"https://www.linkedin.com/login/?session_redirect={target_nav_url}", timeout=60000)
                page.wait_for_timeout(3000)
                continue

            # Ensure we are at target admin page
            if company_id and f"/company/{company_id}/" not in page.url and "/admin/" not in page.url:
                print(f"🌐 Navigating to {target_nav_url}...")
                page.goto(target_nav_url, timeout=60000, wait_until="domcontentloaded")
                page.wait_for_timeout(4000)

            # Check for composer start button
            btn = page.locator(
                'button:has-text("Start a post"), button:has-text("Create a post"), div.share-box-feed-entry__wrapper button, button[aria-label*="Start a post"]'
            ).first
            if btn.is_visible(timeout=2000):
                print("✅ Admin access to Rajan Ka Adda Company Page confirmed!")
                start_post_btn = btn
                break
            page.wait_for_timeout(2000)

        if not start_post_btn:
            context.close()
            raise TimeoutError("Timed out waiting for LinkedIn Company Page admin access.")

        # Step 2: Attach Video via Direct Video Button or File Chooser
        print(f"📤 Attaching video file: {video.name}...")
        vid_btn = page.locator('button[aria-label="Add a video"], button:has-text("Video")').first
        if vid_btn.is_visible(timeout=3000):
            with page.expect_file_chooser(timeout=10000) as fc:
                vid_btn.click()
            fc.value.set_files(str(video))
        else:
            file_input = page.locator('input[type="file"]').first
            if file_input.is_visible(timeout=2000) or file_input.count() > 0:
                file_input.set_input_files(str(video))
            else:
                start_post_btn.click()
                page.wait_for_timeout(2000)
                media_btn = page.locator('button[aria-label="Add media"], button[aria-label="Add video"], button:has-text("Media")').first
                if media_btn.is_visible(timeout=3000):
                    media_btn.click()
                    page.wait_for_timeout(1000)
                page.locator('input[type="file"]').first.set_input_files(str(video))
        page.wait_for_timeout(5000)

        # Step 3: Handle Video Preview "Next" Screen in video editor modal
        try:
            video_modal = page.locator('div.share-box-v2__modal, div[role="dialog"]').first
            next_btn = video_modal.locator('button:has-text("Next")').first
            if next_btn.is_visible(timeout=8000):
                print("➡️  Advancing past video editor modal via Next...")
                next_btn.click()
                page.wait_for_timeout(3000)
        except Exception:
            pass

        # Step 4: Enter Caption Text
        print("📝 Inserting caption and hashtags...")
        composer_modal = page.locator('div.share-box-v2__modal, div[data-test-modal-id="sharebox"]').first
        editor = composer_modal.locator('div.ql-editor, div[contenteditable="true"][role="textbox"]').first
        editor.wait_for(state="visible", timeout=15000)
        editor.click()
        page.wait_for_timeout(500)
        page.keyboard.insert_text(post_text)
        page.wait_for_timeout(2000)

        # Step 5: Submit Post via Exact Submit Button inside modal
        print("🚀 Clicking Post button on Company Page...")
        submit_btn = page.locator('button.share-actions__primary-action').first
        submit_btn.wait_for(state="visible", timeout=20000)

        # Wait until video has finished ingestion and submit button is enabled
        upload_start = time.time()
        max_upload_time = 300  # 5 minutes
        while time.time() - upload_start < max_upload_time:
            is_disabled = submit_btn.is_disabled() or submit_btn.get_attribute("aria-disabled") == "true" or "disabled" in (submit_btn.get_attribute("class") or "")
            if not is_disabled:
                break
            page.wait_for_timeout(3000)
            print("   ...still uploading/processing video on LinkedIn...")
        else:
            raise TimeoutError("Video ingestion on LinkedIn timed out.")

        page.wait_for_timeout(2000)
        try:
            submit_btn.click()
        except Exception:
            submit_btn.evaluate("el => el.click()")

        # Step 6: Wait for post modal to close completely
        print("⏳ Finalizing post submission and waiting for modal to close...")
        try:
            composer_modal.wait_for(state="hidden", timeout=120000)
            print("✅ Post modal closed successfully!")
        except Exception:
            print("⚠️ Composer modal did not close within 120s; waiting 10s buffer...")
            page.wait_for_timeout(10000)

        # Step 7: Wait for in-page background video upload to finish!
        print("⏳ Waiting for video upload to finish ('Please remain on this page')...")
        upload_deadline = time.time() + 300  # 5 minutes max
        upload_banner = page.locator('div:has-text("Uploading video"), div:has-text("Processing video"), div:has-text("remain on this page")')
        
        page.wait_for_timeout(4000)
        
        while time.time() < upload_deadline:
            if upload_banner.count() > 0 and upload_banner.first.is_visible(timeout=1500):
                banner_text = ""
                try:
                    banner_text = upload_banner.first.inner_text().strip().split("\n")[0]
                except Exception:
                    pass
                print(f"   ...uploading to LinkedIn in background ({banner_text or 'in progress'})...")
                page.wait_for_timeout(5000)
            else:
                print("✅ Video upload completed! Ingestion finished.")
                break
        else:
            print("⚠️ Upload banner wait reached limit; proceeding to verify post...")

        # Check for success toast
        success_toast = page.locator('text="Post successful", a:has-text("View post")').first
        if success_toast.is_visible(timeout=5000):
            print("✅ LinkedIn confirmed post creation!")

        page.wait_for_timeout(5000)

        # Read manifest to avoid grabbing previous episode URL
        prev_li_url = None
        try:
            if MANIFEST_FILE.is_file():
                mf = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
                for ep_key, ep_data in mf.items():
                    if isinstance(ep_data, dict) and "linkedin" in ep_data and ep_data["linkedin"]:
                        prev_li_url = ep_data["linkedin"]
        except Exception:
            pass

        # Extract published post URN from published posts page
        admin_url = f"https://www.linkedin.com/company/{company_id}/admin/page-posts/published/"
        post_url = None
        for attempt in range(1, 5):
            try:
                page.goto(admin_url, timeout=45000, wait_until="domcontentloaded")
                page.wait_for_timeout(5000)
                # Find all links to published activities
                act_links = page.locator('a[href*="/feed/update/urn:li:activity:"]').all()
                for al in act_links:
                    href = al.get_attribute("href")
                    if href:
                        full_u = f"https://www.linkedin.com{href}" if href.startswith("/") else href
                        if full_u != prev_li_url:
                            post_url = full_u
                            break
                if post_url:
                    break
            except Exception as e:
                print(f"   Retry {attempt} fetching published post: {e}")
            page.wait_for_timeout(5000)

        if not post_url:
            post_url = admin_url

        print("\n" + "=" * 65)
        print("🎉 SUCCESS! Video published to LinkedIn Company Page ($0.00 Free):")
        print(f"🏢 Company Page: Rajan Ka Adda (ID: {company_id})")
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
            manifest[key]["linkedin"] = post_url
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
    parser.add_argument("--title", default="", help="Optional title")
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
            company_id = get_company_page_id()
            target_url = f"https://www.linkedin.com/company/{company_id}/admin/feed/posts/" if company_id else "https://www.linkedin.com/login"
            page.goto(target_url, timeout=60000)
            wait_for_user_login(page, timeout_sec=300)
            context.close()
        return 0

    if not args.video:
        parser.error("Specify a video file to upload, e.g. .venv/bin/python tools/linkedin_free_upload.py episodes/tesla-flying-roadster/final.mp4")

    upload_to_linkedin_free(args.video, args.caption, title=args.title, headless=args.headless)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
