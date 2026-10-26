#!/usr/bin/env python3
"""
Multi-Platform Automated Direct Video Uploader for edu-shorts.
Uploads rendered MP4 videos directly through official APIs without third-party aggregator subscriptions:
  1. YouTube Shorts (YouTube Data API v3 - Resumable Direct Upload)
  2. Telegram Channels & Groups (Telegram Bot API - Direct Multipart Upload)
  3. Instagram Reels (Meta Graph API - Resumable Binary Direct Upload)
  4. Facebook Reels & Pages (Meta Graph API - Resumable Video Reels)
  5. 𝕏 / Twitter (Twitter API v1.1 Chunked Upload + v2 Tweets)
  6. LinkedIn (LinkedIn REST API - Direct Video Chunking & Post Creation)
  7. Threads (Meta Threads API - Video Container Publishing)

Usage:
  python3 tools/upload_video.py --check                                  # Check credentials status for all platforms
  python3 tools/upload_video.py episodes/<id>/final.mp4 --platform youtube --publish
  python3 tools/upload_video.py episodes/<id>/final.mp4 --platform telegram --publish
  python3 tools/upload_video.py episodes/<id>/final.mp4 --platform all --publish
"""

import argparse
import base64
import concurrent.futures
import hashlib
import hmac
import json
import os
import socket
import sys
import threading
import time
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

import requests

# Force IPv4 preference for urllib to avoid hanging on dual-stack IPv6 routes
_orig_getaddrinfo = socket.getaddrinfo
def _ipv4_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return _orig_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)
socket.getaddrinfo = _ipv4_getaddrinfo

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _ensure_project_venv():
    venv_py = ROOT / ".venv" / "bin" / "python3"
    if not venv_py.is_file():
        return
    try:
        import playwright
        import requests
    except ImportError:
        if Path(sys.executable).resolve() != venv_py.resolve():
            import subprocess
            res = subprocess.run([str(venv_py)] + sys.argv, cwd=str(ROOT))
            sys.exit(res.returncode)


_ensure_project_venv()

DEFAULT_GRAPH_BASE = "https://graph.facebook.com"
DEFAULT_GRAPH_VERSION = "v19.0"
DEFAULT_THREADS_BASE = "https://graph.threads.net"


class UploadError(RuntimeError):
    pass


# -----------------------------------------------------------------------------
# Environment & Configuration Helper
# -----------------------------------------------------------------------------

def load_env_file():
    env_file = ROOT / ".env"
    if not env_file.is_file():
        return
    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        name = name.strip()
        value = value.strip()
        if value[:1] == value[-1:] and value.startswith(("'", '"')):
            value = value[1:-1]
        if name and value and not os.environ.get(name):
            os.environ[name] = value


load_env_file()


def get_env(*names):
    load_env_file()
    for name in names:
        val = os.environ.get(name)
        if val:
            return val.strip()
    return None


def require_env(*names):
    load_env_file()
    missing = [name for name in names if not os.environ.get(name)]
    if missing:
        raise UploadError("Missing required environment variable(s): " + ", ".join(missing))
    return [os.environ[name].strip() for name in names]


# -----------------------------------------------------------------------------
# 1. YouTube Data API v3 (Shorts & Videos)
# -----------------------------------------------------------------------------

def youtube_access_token():
    client_id, client_secret, refresh_token = require_env(
        "YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"
    )
    body = urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }).encode()
    req = Request(
        "https://oauth2.googleapis.com/token",
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    try:
        with urlopen(req, timeout=30) as resp:
            token_data = json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(err_body)
            err_desc = err_json.get("error_description") or err_json.get("error") or err_body
        except Exception:
            err_desc = err_body
        if "invalid_grant" in err_desc or "expired or revoked" in err_desc:
            raise UploadError(
                "YouTube OAuth token expired or revoked. Please run '.venv/bin/python tools/get_youtube_token.py' to generate a fresh token."
            )
        raise UploadError(f"Google OAuth token request failed (HTTP {e.code}): {err_desc}")

    token = token_data.get("access_token")
    if not token:
        raise UploadError("Google OAuth response did not include an access token.")
    return token


def upload_youtube(video: Path, title: str, description: str, privacy: str = "public") -> str:
    print(f"\n[YOUTUBE] Starting upload for {video.name}...")
    access_token = youtube_access_token()
    clean_title = title[:100]
    if "#Shorts" not in clean_title and "#shorts" not in clean_title:
        clean_title = f"{clean_title[:90]} #Shorts"

    metadata = {
        "snippet": {
            "title": clean_title,
            "description": description,
            "categoryId": "27",  # Education
        },
        "status": {
            "privacyStatus": privacy,
            "selfDeclaredMadeForKids": False,
        },
    }

    start_url = "https://www.googleapis.com/upload/youtube/v3/videos?" + urlencode({
        "uploadType": "resumable",
        "part": "snippet,status"
    })
    req = Request(
        start_url,
        data=json.dumps(metadata).encode(),
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json; charset=UTF-8",
            "X-Upload-Content-Length": str(video.stat().st_size),
            "X-Upload-Content-Type": "video/mp4",
        },
        method="POST",
    )
    try:
        with urlopen(req, timeout=30) as resp:
            upload_url = resp.headers.get("Location")
    except HTTPError as e:
        err_msg = e.read().decode("utf-8")
        raise UploadError(f"YouTube initialization failed (HTTP {e.code}): {err_msg}")

    if not upload_url:
        raise UploadError("YouTube did not return a resumable upload URL.")

    video_bytes = video.read_bytes()
    total_size = len(video_bytes)
    print(f"  [YOUTUBE] Sending video binary ({total_size / (1024*1024):.1f} MB) in chunks to Google servers...")
    
    chunk_size = 8 * 1024 * 1024  # 8 MB per chunk (multiple of 256 KB)
    start_byte = 0
    result = None

    while start_byte < total_size:
        end_byte = min(start_byte + chunk_size, total_size) - 1
        chunk = video_bytes[start_byte:end_byte + 1]
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "video/mp4",
            "Content-Length": str(len(chunk)),
            "Content-Range": f"bytes {start_byte}-{end_byte}/{total_size}",
        }
        print(f"  [YOUTUBE] Uploading chunk: {start_byte / (1024*1024):.1f}MB - {(end_byte + 1) / (1024*1024):.1f}MB / {total_size / (1024*1024):.1f}MB...")
        
        chunk_uploaded = False
        for attempt in range(5):
            try:
                resp = requests.put(upload_url, data=chunk, headers=headers, timeout=120)
                if resp.status_code in (200, 201):
                    result = resp.json()
                    start_byte = total_size
                    chunk_uploaded = True
                    break
                elif resp.status_code == 308:
                    range_hdr = resp.headers.get("Range")
                    if range_hdr:
                        start_byte = int(range_hdr.split("-")[1]) + 1
                    else:
                        start_byte = end_byte + 1
                    chunk_uploaded = True
                    break
                else:
                    raise UploadError(f"YouTube chunk upload returned HTTP {resp.status_code}: {resp.text}")
            except (requests.RequestException, ConnectionError, OSError) as e:
                print(f"  [YOUTUBE] ⚠️ Network glitch ({e}), retrying chunk query (attempt {attempt + 1}/5)...")
                time.sleep(2 ** attempt)
                try:
                    q_resp = requests.put(
                        upload_url,
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "Content-Range": f"bytes */{total_size}"
                        },
                        timeout=30
                    )
                    if q_resp.status_code == 308:
                        r_hdr = q_resp.headers.get("Range")
                        if r_hdr:
                            start_byte = int(r_hdr.split("-")[1]) + 1
                            chunk_uploaded = True
                            break
                    elif q_resp.status_code in (200, 201):
                        result = q_resp.json()
                        start_byte = total_size
                        chunk_uploaded = True
                        break
                except Exception:
                    pass
        if not chunk_uploaded:
            raise UploadError("YouTube chunk upload failed after 5 retries.")

    print("  [YOUTUBE] Video payload accepted by YouTube servers!")

    video_id = result.get("id")
    if not video_id:
        raise UploadError("YouTube upload completed without returning a video ID.")
    yt_url = f"https://youtu.be/{video_id}"
    print(f"✅ [YOUTUBE] Published: {yt_url} (visibility: {privacy})")

    # Custom Thumbnail Upload
    thumb_candidates = [
        video.parent / "media" / f"{video.parent.name}-thumbnail.jpg",
        video.parent / "media" / f"{video.stem}-thumbnail.jpg",
        video.parent / "media" / "final-thumbnail.jpg",
        video.parent / "media" / "thumbnail.jpg",
    ]
    thumb_path = next((p for p in thumb_candidates if p.is_file()), None)
    if thumb_path:
        try:
            thumb_url = f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={video_id}"
            thumb_bytes = thumb_path.read_bytes()
            req_thumb = Request(
                thumb_url,
                data=thumb_bytes,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "image/jpeg",
                },
                method="POST",
            )
            with urlopen(req_thumb, timeout=30):
                print(f"✅ [YOUTUBE] Custom thumbnail uploaded: {thumb_path.name}")
        except Exception as exc:
            print(f"  Note: Custom thumbnail upload skipped ({exc})")

    return yt_url


# -----------------------------------------------------------------------------
# 2. Telegram Bot API (Direct Multipart Upload)
# -----------------------------------------------------------------------------

def upload_telegram(video: Path, caption: str) -> str:
    print(f"\n[TELEGRAM] Starting direct upload to channel for {video.name}...")
    token, chat_id = require_env("TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID")
    url = f"https://api.telegram.org/bot{token}/sendVideo"

    # Truncate caption to Telegram limit (1024 chars for media captions)
    tg_caption = caption[:1020] if caption else ""

    thumb_candidates = [
        video.parent / "media" / f"{video.parent.name}-thumbnail.jpg",
        video.parent / "media" / f"{video.stem}-thumbnail.jpg",
        video.parent / "final-thumbnail.jpg",
        video.parent / "thumbnail.jpg",
        video.parent / "media" / "thumbnail.jpg",
    ]
    thumb_path = next((p for p in thumb_candidates if p.is_file()), None)

    # Telegram Bot API sendVideo has a hard 50 MB limit
    upload_file = video
    temp_transcoded = None
    if video.stat().st_size > 48 * 1024 * 1024:
        print(f"  [TELEGRAM] Video is {video.stat().st_size / (1024*1024):.1f} MB (exceeds 50 MB limit). Compressing for Telegram...")
        import shutil
        import subprocess
        ffmpeg_bin = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
        temp_transcoded = Path(f"/tmp/tg_{uuid.uuid4().hex[:8]}.mp4")
        cmd = [
            ffmpeg_bin, "-y", "-i", str(video),
            "-c:v", "libx264", "-crf", "23", "-preset", "veryfast",
            "-c:a", "copy", str(temp_transcoded)
        ]
        res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if res.returncode == 0 and temp_transcoded.is_file() and temp_transcoded.stat().st_size <= 49 * 1024 * 1024:
            upload_file = temp_transcoded
            print(f"  [TELEGRAM] Transcoded payload ready: {upload_file.stat().st_size / (1024*1024):.1f} MB")
        else:
            print("  [TELEGRAM] Transcoding failed or did not reduce size sufficiently, attempting original...")

    try:
        with open(upload_file, "rb") as vf:
            files = {"video": (video.name, vf, "video/mp4")}
            data = {
                "chat_id": chat_id,
                "caption": tg_caption,
                "parse_mode": "Markdown",
                "supports_streaming": "true",
            }
            tf = None
            if thumb_path:
                tf = open(thumb_path, "rb")
                files["thumbnail"] = (thumb_path.name, tf, "image/jpeg")

            try:
                resp = requests.post(url, data=data, files=files, timeout=300)
                if not resp.ok and ("entity" in resp.text.lower() or "parse" in resp.text.lower()):
                    # Fallback to plain text caption if markdown syntax is invalid
                    print("  [TELEGRAM] Retrying caption with plain-text encoding...")
                    data.pop("parse_mode", None)
                    vf.seek(0)
                    if tf:
                        tf.seek(0)
                    resp = requests.post(url, data=data, files=files, timeout=300)
            finally:
                if tf:
                    tf.close()
    finally:
        if temp_transcoded and temp_transcoded.is_file():
            try:
                temp_transcoded.unlink(missing_ok=True)
            except Exception:
                pass

    if not resp.ok:
        raise UploadError(f"Telegram API error {resp.status_code}: {resp.text}")

    res_data = resp.json()
    msg_id = res_data.get("result", {}).get("message_id")
    chat_username = res_data.get("result", {}).get("chat", {}).get("username")
    print(f"✅ [TELEGRAM] Video published successfully (Message ID: {msg_id})")
    if chat_username:
        return f"https://t.me/{chat_username}/{msg_id}"
    clean_chat = str(chat_id).lstrip("@")
    return f"https://t.me/{clean_chat}/{msg_id}" if str(chat_id).startswith("@") else f"Telegram Msg #{msg_id}"


# -----------------------------------------------------------------------------
# 3. Instagram Reels (Meta Graph API Direct Resumable Upload)
# -----------------------------------------------------------------------------

def upload_instagram(video: Path, caption: str, video_url: str = None) -> str:
    profile_dir = ROOT / ".browser_profiles" / "instagram"
    token = get_env("INSTAGRAM_ACCESS_TOKEN", "META_ACCESS_TOKEN")
    user_id = get_env("INSTAGRAM_USER_ID", "INSTAGRAM_ACCOUNT_ID")
    if profile_dir.is_dir() or not (token and user_id):
        print(f"\n[INSTAGRAM] Using 100% Free Browser Uploader for {video.name}...")
        from tools.instagram_free_upload import upload_to_instagram_free
        return upload_to_instagram_free(video, caption)

    print(f"\n[INSTAGRAM] Starting Instagram Reels upload for {video.name}...")
    version = get_env("META_GRAPH_API_VERSION") or DEFAULT_GRAPH_VERSION

    # Method A: Direct binary file upload via resumable session (no hosting required)
    if not video_url:
        print("  [INSTAGRAM] Initializing direct binary upload session...")
        init_url = f"{DEFAULT_GRAPH_BASE}/{version}/{user_id}/media"
        params = {
            "media_type": "REELS",
            "upload_type": "resumable",
            "caption": caption[:2200],
            "share_to_feed": "true",
            "access_token": token,
        }
        res = requests.post(init_url, data=params, timeout=30)
        if not res.ok:
            raise UploadError(f"Instagram init upload session failed: {res.text}")

        session_data = res.json()
        creation_id = session_data.get("id")
        upload_uri = session_data.get("uri")

        if not upload_uri:
            raise UploadError(f"Instagram session did not return an upload URI: {session_data}")

        # Send binary bytes to rupload endpoint
        print("  [INSTAGRAM] Streaming video bytes to Meta rupload session...")
        v_bytes = video.read_bytes()
        headers = {
            "Authorization": f"OAuth {token}",
            "offset": "0",
            "file_offset": "0",
            "file_size": str(len(v_bytes)),
        }
        upload_resp = requests.post(upload_uri, data=v_bytes, headers=headers, timeout=600)
        if not upload_resp.ok:
            raise UploadError(f"Instagram binary upload failed: {upload_resp.text}")

    # Method B: Hosted public URL fallback
    else:
        print(f"  [INSTAGRAM] Initializing via remote URL: {video_url}...")
        init_url = f"{DEFAULT_GRAPH_BASE}/{version}/{user_id}/media"
        params = {
            "media_type": "REELS",
            "video_url": video_url,
            "caption": caption[:2200],
            "share_to_feed": "true",
            "access_token": token,
        }
        res = requests.post(init_url, data=params, timeout=30)
        if not res.ok:
            raise UploadError(f"Instagram URL upload init failed: {res.text}")
        creation_id = res.json().get("id")

    # Poll processing status until FINISHED
    print("  [INSTAGRAM] Waiting for video processing to finish on Meta...")
    deadline = time.monotonic() + 600
    while time.monotonic() < deadline:
        status_url = f"{DEFAULT_GRAPH_BASE}/{version}/{creation_id}?fields=status_code&access_token={token}"
        st_resp = requests.get(status_url, timeout=30).json()
        status = st_resp.get("status_code")
        if status == "FINISHED":
            break
        if status in ("ERROR", "EXPIRED"):
            raise UploadError(f"Instagram Reel processing ended with status {status}.")
        time.sleep(5)
    else:
        raise UploadError("Timed out waiting for Instagram Reel processing.")

    # Publish Container
    print("  [INSTAGRAM] Publishing container...")
    pub_url = f"{DEFAULT_GRAPH_BASE}/{version}/{user_id}/media_publish"
    pub_resp = requests.post(pub_url, data={"creation_id": creation_id, "access_token": token}, timeout=30)
    if not pub_resp.ok:
        raise UploadError(f"Instagram media_publish failed: {pub_resp.text}")

    media_id = pub_resp.json().get("id")
    print(f"✅ [INSTAGRAM] Reel published successfully (Media ID: {media_id})")
    return f"https://www.instagram.com/reel/{media_id}"


# -----------------------------------------------------------------------------
# 4. Facebook Reels & Pages (Meta Graph API)
# -----------------------------------------------------------------------------

def upload_facebook(video: Path, caption: str, title: str = "") -> str:
    profile_dir = ROOT / ".browser_profiles" / "facebook"
    token = get_env("FB_PAGE_ACCESS_TOKEN", "FACEBOOK_ACCESS_TOKEN", "META_ACCESS_TOKEN")
    page_id = get_env("FB_PAGE_ID", "FACEBOOK_PAGE_ID")
    if profile_dir.is_dir() or not (token and page_id):
        print(f"\n[FACEBOOK] Using 100% Free Browser Uploader for {video.name}...")
        from tools.facebook_free_upload import upload_to_facebook_free
        return upload_to_facebook_free(video, caption)

    print(f"\n[FACEBOOK] Starting Facebook Reels upload for {video.name}...")
    version = get_env("META_GRAPH_API_VERSION") or DEFAULT_GRAPH_VERSION

    # Step 1: Initialize Reel Upload Session
    init_url = f"{DEFAULT_GRAPH_BASE}/{version}/{page_id}/video_reels"
    res = requests.post(init_url, data={"upload_phase": "start", "access_token": token}, timeout=30)
    if not res.ok:
        raise UploadError(f"Facebook Reels init failed: {res.text}")

    init_data = res.json()
    video_id = init_data.get("video_id")
    upload_url = init_data.get("upload_url")
    if not video_id or not upload_url:
        raise UploadError(f"Facebook Reels did not return upload session: {init_data}")

    # Step 2: Upload Video Bytes
    print("  [FACEBOOK] Uploading binary bytes to Meta rupload...")
    v_bytes = video.read_bytes()
    headers = {
        "Authorization": f"OAuth {token}",
        "offset": "0",
        "file_offset": "0",
        "file_size": str(len(v_bytes)),
    }
    up_resp = requests.post(upload_url, data=v_bytes, headers=headers, timeout=600)
    if not up_resp.ok:
        raise UploadError(f"Facebook upload failed: {up_resp.text}")

    # Step 3: Finish & Publish
    print("  [FACEBOOK] Finalizing and publishing Reel...")
    finish_url = f"{DEFAULT_GRAPH_BASE}/{version}/{page_id}/video_reels"
    finish_params = {
        "upload_phase": "finish",
        "access_token": token,
        "video_id": video_id,
        "video_state": "PUBLISHED",
        "description": caption[:5000],
    }
    if title:
        finish_params["title"] = title[:255]

    fin_resp = requests.post(finish_url, data=finish_params, timeout=30)
    if not fin_resp.ok:
        raise UploadError(f"Facebook publish failed: {fin_resp.text}")

    print(f"✅ [FACEBOOK] Reel published successfully (Video ID: {video_id})")
    return f"https://www.facebook.com/watch/?v={video_id}"


# -----------------------------------------------------------------------------
# 5. 𝕏 / Twitter API (Chunked Media Upload + v2 Tweet)
# -----------------------------------------------------------------------------

def _make_oauth1_header(method: str, url: str, params: dict, api_key: str, api_secret: str,
                        access_token: str, access_secret: str) -> str:
    """Builds RFC 5849 compliant OAuth 1.0a HMAC-SHA1 signature and Authorization header."""
    oauth_params = {
        "oauth_consumer_key": api_key,
        "oauth_nonce": uuid.uuid4().hex,
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": access_token,
        "oauth_version": "1.0",
    }
    # Per RFC 5849: Only include params if urlencoded or in query string (not multipart body or json)
    all_params = {**params, **oauth_params}
    sorted_params = sorted(all_params.items())
    param_str = "&".join(f"{quote(str(k), safe='')}={quote(str(v), safe='')}" for k, v in sorted_params)
    base_string = f"{method.upper()}&{quote(url, safe='')}&{quote(param_str, safe='')}"
    signing_key = f"{quote(api_secret, safe='')}&{quote(access_secret, safe='')}".encode()
    signature = base64.b64encode(hmac.new(signing_key, base_string.encode(), hashlib.sha1).digest()).decode()
    oauth_params["oauth_signature"] = signature
    header_parts = [f'{quote(str(k), safe="")}="{quote(str(v), safe="")}"' for k, v in sorted(oauth_params.items())]
    return "OAuth " + ", ".join(header_parts)


def upload_twitter(video: Path, tweet_text: str) -> str:
    profile_dir = ROOT / ".browser_profiles" / "twitter"
    api_key = get_env("TWITTER_API_KEY", "X_API_KEY")
    api_secret = get_env("TWITTER_API_SECRET", "X_API_SECRET")
    access_token = get_env("TWITTER_ACCESS_TOKEN", "X_ACCESS_TOKEN")
    access_secret = get_env("TWITTER_ACCESS_SECRET", "X_ACCESS_SECRET")
    bearer_token = get_env("TWITTER_BEARER_TOKEN", "X_BEARER_TOKEN")
    has_api_keys = ((api_key and api_secret and access_token and access_secret) or bearer_token)

    # Prioritize 100% Free Browser Uploader if session profile exists or API keys are absent
    if profile_dir.is_dir() or not has_api_keys:
        print(f"\n[TWITTER / 𝕏] Using 100% Free Browser Uploader for {video.name}...")
        from tools.twitter_free_upload import upload_to_twitter_free
        return upload_to_twitter_free(video, tweet_text)

    print(f"\n[TWITTER / 𝕏] Starting chunked upload for {video.name}...")

    upload_url = "https://upload.twitter.com/1.1/media/upload.json"
    file_size = video.stat().st_size

    # Phase 1: INIT
    print("  [TWITTER / 𝕏] Initializing upload session...")
    init_params = {
        "command": "INIT",
        "total_bytes": str(file_size),
        "media_type": "video/mp4",
        "media_category": "tweet_video",
    }
    headers = {}
    if api_key and api_secret and access_token and access_secret:
        headers["Authorization"] = _make_oauth1_header("POST", upload_url, init_params, api_key, api_secret, access_token, access_secret)
    elif bearer_token:
        headers["Authorization"] = f"Bearer {bearer_token}"

    init_res = requests.post(upload_url, data=init_params, headers=headers, timeout=30)
    if not init_res.ok:
        raise UploadError(f"Twitter INIT failed: {init_res.text}")

    media_id = init_res.json()["media_id_string"]

    # Phase 2: APPEND chunks (4MB each)
    chunk_size = 4 * 1024 * 1024
    print("  [TWITTER / 𝕏] Uploading binary chunks...")
    with open(video, "rb") as f:
        segment_id = 0
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            append_params = {
                "command": "APPEND",
                "media_id": media_id,
                "segment_index": str(segment_id),
            }
            # For multipart upload: body parameters are NOT part of OAuth base signature
            append_headers = {}
            if api_key and api_secret and access_token and access_secret:
                append_headers["Authorization"] = _make_oauth1_header("POST", upload_url, {}, api_key, api_secret, access_token, access_secret)
            elif bearer_token:
                append_headers["Authorization"] = f"Bearer {bearer_token}"

            files = {"media": chunk}
            app_res = requests.post(upload_url, data=append_params, files=files, headers=append_headers, timeout=120)
            if not app_res.ok:
                raise UploadError(f"Twitter APPEND chunk {segment_id} failed: {app_res.text}")
            segment_id += 1

    # Phase 3: FINALIZE
    print("  [TWITTER / 𝕏] Finalizing media upload...")
    fin_params = {"command": "FINALIZE", "media_id": media_id}
    fin_headers = {}
    if api_key and api_secret and access_token and access_secret:
        fin_headers["Authorization"] = _make_oauth1_header("POST", upload_url, fin_params, api_key, api_secret, access_token, access_secret)
    elif bearer_token:
        fin_headers["Authorization"] = f"Bearer {bearer_token}"

    fin_res = requests.post(upload_url, data=fin_params, headers=fin_headers, timeout=30)
    if not fin_res.ok:
        raise UploadError(f"Twitter FINALIZE failed: {fin_res.text}")

    # Check processing info if video needs asynchronous transcoding on Twitter
    processing_info = fin_res.json().get("processing_info")
    if processing_info:
        print("  [TWITTER / 𝕏] Waiting for video processing...")
        while processing_info.get("state") in ("pending", "in_progress"):
            wait_sec = processing_info.get("check_after_secs", 5)
            time.sleep(wait_sec)
            status_params = {"command": "STATUS", "media_id": media_id}
            stat_headers = {}
            if api_key and api_secret and access_token and access_secret:
                stat_headers["Authorization"] = _make_oauth1_header("GET", upload_url, status_params, api_key, api_secret, access_token, access_secret)
            elif bearer_token:
                stat_headers["Authorization"] = f"Bearer {bearer_token}"
            stat_res = requests.get(upload_url, params=status_params, headers=stat_headers, timeout=30)
            if stat_res.ok:
                processing_info = stat_res.json().get("processing_info", {})
                if processing_info.get("state") == "failed":
                    raise UploadError(f"Twitter video processing failed: {stat_res.text}")

    # Phase 4: Create Tweet via Twitter API v2
    print("  [TWITTER / 𝕏] Publishing Tweet with video attachment...")
    tweet_url = "https://api.twitter.com/2/tweets"
    tweet_payload = {
        "text": tweet_text[:280],
        "media": {"media_ids": [media_id]}
    }
    tweet_headers = {"Content-Type": "application/json"}
    if api_key and api_secret and access_token and access_secret:
        # For JSON body: params are not in the OAuth signature base string
        tweet_headers["Authorization"] = _make_oauth1_header("POST", tweet_url, {}, api_key, api_secret, access_token, access_secret)
    elif bearer_token:
        tweet_headers["Authorization"] = f"Bearer {bearer_token}"

    tw_resp = requests.post(tweet_url, json=tweet_payload, headers=tweet_headers, timeout=30)
    if not tw_resp.ok:
        if "credits depleted" in tw_resp.text or tw_resp.status_code == 402:
            print("  [TWITTER / 𝕏] ⚠️ Paid API credits depleted. Automatically launching 100% Free Browser Uploader...")
            try:
                from tools.twitter_free_upload import upload_to_twitter_free
                return upload_to_twitter_free(video, tweet_text)
            except Exception as fb_err:
                raise UploadError(f"Free browser uploader also failed: {fb_err}")
        raise UploadError(f"Creating Tweet failed: {tw_resp.text}")

    tweet_id = tw_resp.json().get("data", {}).get("id")
    post_url = f"https://x.com/i/status/{tweet_id}"
    print(f"✅ [TWITTER / 𝕏] Tweet published successfully: {post_url}")
    return post_url


# -----------------------------------------------------------------------------
# 6. LinkedIn API (Direct Video & Post Creation with Playwright Fallback)
# -----------------------------------------------------------------------------

def _upload_linkedin_api(video: Path, text: str, title: str = "") -> str:
    print(f"\n[LINKEDIN] Starting video upload for {video.name} via official REST API...")
    token = require_env("LINKEDIN_ACCESS_TOKEN")[0]
    author_urn = get_env("LINKEDIN_ORG_URN", "LINKEDIN_PERSON_URN", "LINKEDIN_URN")
    if not author_urn:
        # Auto-resolve person URN via /v2/userinfo
        u_resp = requests.get("https://api.linkedin.com/v2/userinfo", headers={"Authorization": f"Bearer {token}"}, timeout=15)
        if u_resp.ok:
            author_urn = f"urn:li:person:{u_resp.json().get('sub')}"
        else:
            raise UploadError("Missing LINKEDIN_ORG_URN or LINKEDIN_PERSON_URN in .env and could not auto-resolve from /userinfo")

    file_size = video.stat().st_size
    li_version = get_env("LINKEDIN_API_VERSION") or "202604"
    headers = {
        "Authorization": f"Bearer {token}",
        "LinkedIn-Version": li_version,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json"
    }

    # Step 1: Initialize Video Upload
    print(f"  [LINKEDIN] Initializing video upload intent for owner: {author_urn}...")
    init_url = "https://api.linkedin.com/rest/videos?action=initializeUpload"
    init_payload = {
        "initializeUploadRequest": {
            "owner": author_urn,
            "fileSizeBytes": file_size,
            "uploadCaptions": False,
            "uploadThumbnail": False
        }
    }
    init_resp = requests.post(init_url, json=init_payload, headers=headers, timeout=30)
    if not init_resp.ok:
        raise UploadError(f"LinkedIn init upload failed: {init_resp.text}")

    upload_data = init_resp.json().get("value", {})
    video_urn = upload_data.get("video")
    upload_token = upload_data.get("uploadToken")
    instructions = upload_data.get("uploadInstructions", [])

    if not video_urn:
        raise UploadError(f"LinkedIn did not return video URN: {upload_data}")

    # Fallback if single uploadUrl is provided directly
    if not instructions and "uploadUrl" in upload_data:
        instructions = [{"uploadUrl": upload_data["uploadUrl"], "firstByte": 0, "lastByte": file_size - 1}]

    # Step 2: Upload Binary Bytes to Part URLs & collect ETags
    print(f"  [LINKEDIN] Uploading binary bytes ({len(instructions)} part(s))...")
    uploaded_part_ids = []
    with open(video, "rb") as vf:
        for inst in instructions:
            part_url = inst.get("uploadUrl")
            first_byte = inst.get("firstByte", 0)
            last_byte = inst.get("lastByte", file_size - 1)
            chunk_length = (last_byte - first_byte) + 1
            
            vf.seek(first_byte)
            chunk = vf.read(chunk_length)
            part_resp = requests.put(part_url, data=chunk, headers={"Content-Type": "application/octet-stream"}, timeout=600)
            if not part_resp.ok:
                raise UploadError(f"LinkedIn chunk upload failed: {part_resp.text}")
            
            etag = part_resp.headers.get("ETag", "").strip('"')
            if etag:
                uploaded_part_ids.append(etag)

    # Step 3: Finalize Upload
    print("  [LINKEDIN] Finalizing video upload...")
    fin_url = "https://api.linkedin.com/rest/videos?action=finalizeUpload"
    fin_payload = {
        "finalizeUploadRequest": {
            "video": video_urn,
            "uploadToken": upload_token or "",
            "uploadedPartIds": uploaded_part_ids
        }
    }
    fin_resp = requests.post(fin_url, json=fin_payload, headers=headers, timeout=30)
    if not fin_resp.ok:
        raise UploadError(f"LinkedIn finalizeUpload failed: {fin_resp.text}")

    # Step 4: Poll Video Processing Status
    print("  [LINKEDIN] Polling video processing status...")
    deadline = time.monotonic() + 300
    while time.monotonic() < deadline:
        st_url = f"https://api.linkedin.com/rest/videos/{quote(video_urn, safe='')}"
        st_res = requests.get(st_url, headers=headers, timeout=15)
        if st_res.ok:
            st_data = st_res.json()
            status = st_data.get("status")
            if status == "AVAILABLE":
                break
            if status == "PROCESSING_FAILED":
                raise UploadError(f"LinkedIn video processing failed: {st_data}")
        time.sleep(5)

    # Step 5: Create Post referencing video
    print("  [LINKEDIN] Publishing Post with video...")
    post_url = "https://api.linkedin.com/rest/posts"
    post_payload = {
        "author": author_urn,
        "commentary": text[:3000],
        "visibility": "PUBLIC",
        "distribution": {
            "feedDistribution": "MAIN_FEED",
            "targetEntities": [],
            "thirdPartyDistributionChannels": []
        },
        "content": {
            "media": {
                "title": (title or video.stem)[:200],
                "id": video_urn
            }
        },
        "lifecycleState": "PUBLISHED",
        "isReshareDisabledByAuthor": False
    }
    create_resp = requests.post(post_url, json=post_payload, headers=headers, timeout=30)
    if not create_resp.ok:
        raise UploadError(f"LinkedIn post creation failed: {create_resp.text}")

    post_urn = create_resp.headers.get("x-restli-id") or create_resp.json().get("id")
    print(f"✅ [LINKEDIN] Post published successfully (ID: {post_urn})")
    return f"https://www.linkedin.com/feed/update/{post_urn}"


def upload_linkedin(video: Path, text: str, title: str = "") -> str:
    profile_dir = ROOT / ".browser_profiles" / "linkedin"
    token = get_env("LINKEDIN_ACCESS_TOKEN")

    # If no token in .env, use free browser uploader directly
    if not token:
        print(f"\n[LINKEDIN] No LINKEDIN_ACCESS_TOKEN in .env. Using 100% Free Browser Uploader for {video.name}...")
        from tools.linkedin_free_upload import upload_to_linkedin_free
        return upload_to_linkedin_free(video, text, title)

    # First: Try official REST API
    try:
        return _upload_linkedin_api(video, text, title)
    except Exception as api_err:
        print(f"  [LINKEDIN] ⚠️ Official REST API failed ({api_err}). Falling back to Free Browser Uploader (Playwright)...")
        from tools.linkedin_free_upload import upload_to_linkedin_free
        return upload_to_linkedin_free(video, text, title)


# -----------------------------------------------------------------------------
# 7. Meta Threads API (Video Container & Publish)
# -----------------------------------------------------------------------------

def upload_threads(video: Path, text: str, video_url: str = None) -> str:
    profile_dir = ROOT / ".browser_profiles" / "threads"
    token = get_env("THREADS_ACCESS_TOKEN", "META_ACCESS_TOKEN")
    user_id = get_env("THREADS_USER_ID")
    if profile_dir.is_dir() or not (token and user_id):
        print(f"\n[THREADS] Using 100% Free Browser Uploader for {video.name}...")
        from tools.threads_free_upload import upload_to_threads_free
        return upload_to_threads_free(video, text)

    print(f"\n[THREADS] Starting Threads video publish for {video.name}...")

    # Step 1: Create Container
    print(f"  [THREADS] Creating media container from {video_url}...")
    container_url = f"{DEFAULT_THREADS_BASE}/v1.0/{user_id}/threads"
    params = {
        "media_type": "VIDEO",
        "video_url": video_url,
        "text": text[:500],
        "access_token": token,
    }
    c_resp = requests.post(container_url, data=params, timeout=30)
    if not c_resp.ok:
        raise UploadError(f"Threads container creation failed: {c_resp.text}")

    creation_id = c_resp.json().get("id")

    # Step 2: Poll Container Status
    print("  [THREADS] Waiting for video processing...")
    deadline = time.monotonic() + 300
    while time.monotonic() < deadline:
        st_url = f"{DEFAULT_THREADS_BASE}/v1.0/{creation_id}?fields=status,status_code&access_token={token}"
        st_res = requests.get(st_url, timeout=15)
        if st_res.ok:
            st = st_res.json().get("status") or st_res.json().get("status_code")
            if st == "FINISHED":
                break
            if st == "ERROR":
                raise UploadError(f"Threads video processing failed: {st_res.text}")
        time.sleep(5)
    else:
        raise UploadError("Timed out waiting for Threads video processing.")

    # Step 3: Publish
    print("  [THREADS] Publishing post...")
    pub_url = f"{DEFAULT_THREADS_BASE}/v1.0/{user_id}/threads_publish"
    pub_resp = requests.post(pub_url, data={"creation_id": creation_id, "access_token": token}, timeout=30)
    if not pub_resp.ok:
        raise UploadError(f"Threads publish failed: {pub_resp.text}")

    post_id = pub_resp.json().get("id")
    print(f"✅ [THREADS] Video published successfully (ID: {post_id})")
    return f"https://www.threads.net/t/{post_id}"


# -----------------------------------------------------------------------------
# Status Check & Dashboard
# -----------------------------------------------------------------------------

def check_credentials():
    print("=" * 65)
    print(" 📡 EduShorts Multi-Platform API Status & Readiness Dashboard")
    print("=" * 65)

    checks = [
        ("YouTube Shorts", ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"]),
        ("Telegram Channel", ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]),
        ("Instagram Reels", [("INSTAGRAM_ACCESS_TOKEN", "META_ACCESS_TOKEN"), ("INSTAGRAM_USER_ID", "INSTAGRAM_ACCOUNT_ID")]),
        ("Facebook Reels", [("FB_PAGE_ACCESS_TOKEN", "META_ACCESS_TOKEN"), ("FB_PAGE_ID", "FACEBOOK_PAGE_ID")]),
        ("𝕏 / Twitter", [("TWITTER_API_KEY", "TWITTER_BEARER_TOKEN")]),
        ("LinkedIn", ["LINKEDIN_ACCESS_TOKEN"]),
        ("Threads", ["THREADS_ACCESS_TOKEN", "THREADS_USER_ID"]),
    ]

    for name, req_keys in checks:
        configured = True
        missing = []
        for key in req_keys:
            if isinstance(key, tuple):
                if not any(get_env(k) for k in key):
                    configured = False
                    missing.append("/".join(key))
            else:
                if not get_env(key):
                    configured = False
                    missing.append(key)

        plat_folder_map = {
            "𝕏 / Twitter": "twitter",
            "Instagram Reels": "instagram",
            "Facebook Reels": "facebook",
            "Threads": "threads",
            "LinkedIn": "linkedin",
        }
        if name in plat_folder_map:
            p_dir = ROOT / ".browser_profiles" / plat_folder_map[name]
            if p_dir.is_dir():
                status_icon = "🟢 READY (Free Web Session Saved)"
            elif name == "LinkedIn" and get_env("LINKEDIN_ACCESS_TOKEN"):
                status_icon = "🟢 READY (REST API + Playwright Fallback)"
            else:
                status_icon = "🟢 READY (Free Browser Automation Available)"
            configured = True
        else:
            status_icon = "🟢 READY" if configured else "⚪ NOT CONFIGURED"
        print(f"  {name:<20} : {status_icon}")
        if not configured:
            print(f"    Missing in .env: {', '.join(missing)}")

    print("=" * 65)
    print("  To configure missing platforms, see: docs/MULTI_PLATFORM_SETUP.md")
    print("=" * 65)


# -----------------------------------------------------------------------------
# Manifest & Deduplication Tracker
# -----------------------------------------------------------------------------

MANIFEST_FILE = ROOT / "episodes" / ".uploaded_manifest.json"
MANIFEST_LOCK = threading.Lock()


def load_manifest() -> dict:
    with MANIFEST_LOCK:
        if not MANIFEST_FILE.is_file():
            return {}
        try:
            raw = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
            if isinstance(raw, dict):
                return raw
            elif isinstance(raw, list):
                migrated = {}
                for item in raw:
                    key = item.split("/")[0] if "/" in item else item.replace(".mp4", "")
                    migrated[key] = {"uploaded": True}
                return migrated
        except Exception:
            return {}
        return {}


def save_manifest(manifest: dict):
    with MANIFEST_LOCK:
        MANIFEST_FILE.parent.mkdir(exist_ok=True)
        MANIFEST_FILE.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def get_episode_key(video: Path) -> str:
    if video.parent != ROOT and video.parent.parent.name == "episodes":
        return video.parent.name
    return video.parent.name if video.stem == "final" else video.stem


def is_already_uploaded(video: Path, platform: str) -> bool:
    manifest = load_manifest()
    key = get_episode_key(video)
    entry = manifest.get(key)
    if not entry:
        return False
    if entry.get(platform):
        return True
    if entry.get("uploaded") and platform == "youtube":
        return True
    return False


def record_upload(video: Path, platform: str, url_or_id: str):
    with MANIFEST_LOCK:
        manifest = {}
        if MANIFEST_FILE.is_file():
            try:
                manifest = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
            except Exception:
                pass
        key = get_episode_key(video)
        if key not in manifest:
            manifest[key] = {}
        manifest[key][platform] = url_or_id
        manifest[key]["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%S%z")
        MANIFEST_FILE.parent.mkdir(exist_ok=True)
        MANIFEST_FILE.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def execute_upload_for_platform(p: str, video: Path, title: str, description: str, caption: str,
                                hashtag_text: str, privacy: str, video_url: str, force: bool) -> tuple[str, str, str]:
    """Executes upload for a single platform, returning (platform_name, status_or_url, error_message)."""
    display_names = {
        "youtube": "YouTube Shorts",
        "telegram": "Telegram Channel",
        "instagram": "Instagram Reels",
        "facebook": "Facebook Reels",
        "twitter": "𝕏 (Twitter)",
        "linkedin": "LinkedIn",
        "threads": "Threads",
    }
    disp_name = display_names.get(p, p.capitalize())

    if not force and is_already_uploaded(video, p):
        print(f"⏭️  [{p.upper()}] Video already published to {p}. Skipping (pass --force to re-upload).")
        return (disp_name, "Skipped (already published)", None)

    try:
        if p == "youtube":
            res = upload_youtube(video, title, description, privacy)
        elif p == "telegram":
            res = upload_telegram(video, caption)
        elif p == "instagram":
            res = upload_instagram(video, caption, video_url)
        elif p == "facebook":
            res = upload_facebook(video, caption, title)
        elif p == "twitter":
            tw_text = caption
            if len(tw_text) > 280:
                short_combo = f"{title}\n\n{hashtag_text}".strip()
                tw_text = short_combo if len(short_combo) <= 280 else caption[:277] + "..."
            res = upload_twitter(video, tw_text)
        elif p == "linkedin":
            res = upload_linkedin(video, caption, title)
        elif p == "threads":
            res = upload_threads(video, caption, video_url)
        else:
            raise ValueError(f"Unknown platform: {p}")

        record_upload(video, p, res)
        return (disp_name, res, None)
    except Exception as exc:
        print(f"❌ [{p.upper()}] Failed: {exc}")
        return (disp_name, None, str(exc))


# -----------------------------------------------------------------------------
# Main CLI & Controller
# -----------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("video", nargs="?", type=Path, help="Rendered MP4 file to upload")
    parser.add_argument(
        "--platform",
        default="youtube",
        help="Target platform(s) to publish video (e.g. youtube, telegram, facebook,threads,linkedin, all)"
    )
    parser.add_argument("--title", help="Title for YouTube / Facebook / LinkedIn")
    parser.add_argument("--description", help="Description for YouTube / Telegram")
    parser.add_argument("--caption", help="Caption for Instagram / Facebook / Twitter / LinkedIn / Threads")
    parser.add_argument("--privacy", choices=("private", "unlisted", "public"), default="public",
                        help="Visibility status for platforms supporting privacy levels")
    parser.add_argument("--video-url", "--instagram-video-url", dest="video_url", help="Optional public HTTPS URL for Instagram / Threads")
    parser.add_argument("--force", action="store_true", help="Force upload even if video was already published previously")
    parser.add_argument("--check", action="store_true", help="Check status of all platform API keys in .env")
    parser.add_argument("--publish", action="store_true", help="Perform real live API upload (without flag, runs dry-run)")
    parser.add_argument("--parallel", action="store_true", help="Run uploads concurrently in parallel (default: sequential for browser automation safety)")
    parser.add_argument("--sequential", action="store_true", default=True, help="Run uploads sequentially (default: True)")
    parser.add_argument("--max-workers", type=int, default=7, help="Maximum concurrent upload workers if --parallel is enabled (default: 7)")

    args = parser.parse_args()

    if args.check:
        check_credentials()
        return 0

    if not args.video:
        parser.error("Specify an MP4 video file to upload, or run with --check to inspect configured APIs.")

    video = (ROOT / args.video).resolve() if not args.video.is_absolute() else args.video.resolve()
    if not video.is_file() or video.suffix.lower() != ".mp4":
        parser.error(f"video must be an existing MP4 file: {video}")

    # Auto-extract metadata from episode storyboard / post.md if available
    metadata = {}
    candidates = [
        video.parent / "storyboard.json",
        video.parent / f"{video.parent.name}.json",
        ROOT / "videos" / f"{video.stem}.json",
    ]
    for spec_path in candidates:
        if spec_path.is_file():
            try:
                spec = json.loads(spec_path.read_text(encoding="utf-8"))
                metadata = spec.get("meta", {})
                if metadata:
                    break
            except Exception:
                pass

    # Check post.md for custom editorial title/description/hashtags
    post_md = video.parent / "post.md"
    if post_md.is_file():
        try:
            content = post_md.read_text(encoding="utf-8")
            import re
            t_match = re.search(r"^TITLE:\s*\n([^\n]+)", content, re.MULTILINE)
            d_match = re.search(r"^DESCRIPTION:\s*\n(.*?)(?=\n[A-Z\s]+:|\Z)", content, re.DOTALL | re.MULTILINE)
            h_match = re.search(r"^HASHTAGS:\s*\n([^\n]+)", content, re.MULTILINE)
            if t_match and not metadata.get("title"):
                metadata["title"] = t_match.group(1).strip()
            elif t_match and "How What is" in metadata.get("title", ""):
                metadata["title"] = t_match.group(1).strip()
            if d_match and not metadata.get("description"):
                metadata["description"] = d_match.group(1).strip()
            if h_match and not metadata.get("hashtags"):
                metadata["hashtags"] = [tag.strip() for tag in h_match.group(1).split() if tag.strip()]
        except Exception:
            pass

    title = args.title or metadata.get("title") or video.parent.name.replace("-", " ").title()
    hashtags = metadata.get("hashtags", [])
    hashtag_text = " ".join("#" + tag.lstrip("#") for tag in hashtags)
    description = args.description or metadata.get("description", "")
    if hashtag_text and hashtag_text not in description:
        description = (description.rstrip() + "\n\n" + hashtag_text).strip()
    caption = args.caption or description

    print("=" * 65)
    print(f"📦 Video Payload: {video.name} ({video.stat().st_size / (1024*1024):.1f} MB)")
    print(f"🎯 Target Platform(s): {args.platform.upper()}")
    print(f"📝 Title: {title[:80]}...")
    print("=" * 65)

    if not args.publish:
        print("\n⚠️ [DRY RUN] No upload performed. Pass --publish to trigger real live API uploads.\n")
        return 0

    platforms_to_run = []
    if args.platform == "all":
        platforms_to_run = ["youtube", "telegram", "instagram", "facebook", "twitter", "linkedin", "threads"]
    elif args.platform == "both":
        platforms_to_run = ["youtube", "instagram"]
    elif "," in args.platform:
        platforms_to_run = [p.strip().lower() for p in args.platform.split(",") if p.strip()]
    else:
        platforms_to_run = [args.platform.strip().lower()]

    results = {}
    is_parallel = getattr(args, "parallel", False) and len(platforms_to_run) > 1

    if is_parallel:
        max_workers = min(len(platforms_to_run), args.max_workers)
        print(f"\n⚡ Launching parallel uploads across {len(platforms_to_run)} platforms simultaneously ({max_workers} threads)...\n")
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_plat = {
                executor.submit(
                    execute_upload_for_platform,
                    p, video, title, description, caption, hashtag_text, args.privacy, args.video_url, args.force
                ): p
                for p in platforms_to_run
            }
            for future in concurrent.futures.as_completed(future_to_plat):
                p = future_to_plat[future]
                try:
                    disp_name, res_url, err = future.result()
                    results[disp_name] = f"Failed: {err}" if err else res_url
                except Exception as exc:
                    results[p.capitalize()] = f"Failed: {exc}"
    else:
        for p in platforms_to_run:
            disp_name, res_url, err = execute_upload_for_platform(
                p, video, title, description, caption, hashtag_text, args.privacy, args.video_url, args.force
            )
            results[disp_name] = f"Failed: {err}" if err else res_url

    print("\n" + "=" * 65)
    print("🏁 Multi-Platform Publishing Summary:")
    for plat, outcome in results.items():
        print(f"  • {plat:<20}: {outcome}")
    print("=" * 65)

    # Automatic Post-Upload Learning Routine
    try:
        from tools.post_upload_learn import run_learn
        processed = run_learn()
        if processed:
            print(f"🎓 Post-Upload Learn executed for: {', '.join(processed)}")
    except Exception as e:
        print(f"⚠️ Post-Upload Learn notice: {e}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

