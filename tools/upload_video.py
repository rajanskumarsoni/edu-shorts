#!/usr/bin/env python3
"""Upload a rendered video to YouTube and/or Instagram using their official APIs."""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
YOUTUBE_UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos"
DEFAULT_GRAPH_BASE = "https://graph.facebook.com"


class UploadError(RuntimeError):
    pass


def request(url, data=None, headers=None, method=None, timeout=120):
    req = Request(url, data=data, headers=headers or {}, method=method)
    try:
        with urlopen(req, timeout=timeout) as response:
            return response.status, response.headers, response.read()
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise UploadError(f"API returned HTTP {exc.code}: {detail}") from exc
    except URLError as exc:
        raise UploadError(f"Could not reach upload API: {exc.reason}") from exc


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


def require_env(*names):
    load_env_file()
    missing = [name for name in names if not os.environ.get(name)]
    if missing:
        raise UploadError("Missing required environment variable(s): " + ", ".join(missing))
    return [os.environ[name] for name in names]


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
    _, _, response_body = request(
        GOOGLE_TOKEN_URL,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    token_data = json.loads(response_body)
    access_token = token_data.get("access_token")
    if not access_token:
        raise UploadError("Google OAuth response did not include an access token.")
    return access_token


def upload_youtube(video, title, description, privacy):
    access_token = youtube_access_token()
    metadata = {
        "snippet": {
            "title": title[:100],
            "description": description,
            "categoryId": "27",
        },
        "status": {
            "privacyStatus": privacy,
            "selfDeclaredMadeForKids": False,
        },
    }
    start_url = YOUTUBE_UPLOAD_URL + "?" + urlencode({"uploadType": "resumable", "part": "snippet,status"})
    _, headers, _ = request(
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
    upload_url = headers.get("Location")
    if not upload_url:
        raise UploadError("YouTube did not return a resumable upload URL.")

    video_bytes = video.read_bytes()
    _, _, response_body = request(
        upload_url,
        data=video_bytes,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "video/mp4",
            "Content-Length": str(len(video_bytes)),
            "Content-Range": f"bytes 0-{len(video_bytes) - 1}/{len(video_bytes)}",
        },
        method="PUT",
        timeout=600,
    )
    result = json.loads(response_body)
    video_id = result.get("id")
    if not video_id:
        raise UploadError("YouTube upload completed without returning a video ID.")
    print(f"YouTube upload complete: https://youtu.be/{video_id} (visibility: {privacy})")

    thumb_candidates = [
        video.parent / "media" / f"{video.parent.name}-thumbnail.jpg",
        video.parent / "media" / f"{video.stem}-thumbnail.jpg",
        video.parent / "media" / "final-thumbnail.jpg",
        video.parent / "media" / "thumbnail.jpg",
        video.parent / f"{video.stem}-thumbnail.jpg",
    ]
    thumb_path = next((p for p in thumb_candidates if p.is_file()), None)
    if thumb_path:
        try:
            thumb_url = f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={video_id}"
            thumb_bytes = thumb_path.read_bytes()
            request(
                thumb_url,
                data=thumb_bytes,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "image/jpeg",
                },
                method="POST",
            )
            print(f"Custom thumbnail uploaded successfully: {thumb_path.name}")
        except Exception as exc:
            print(f"Note: Could not set custom thumbnail (channel phone-verification or scope needed): {exc}")


def instagram_graph_url(version, path):
    return f"{DEFAULT_GRAPH_BASE}/{version}/{path.lstrip('/')}"


def instagram_request(version, path, fields):
    _, _, body = request(
        instagram_graph_url(version, path),
        data=urlencode(fields).encode(),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    return json.loads(body)


def instagram_json_request(version, path, token):
    url = instagram_graph_url(version, path) + "?" + urlencode({"fields": "status_code", "access_token": token})
    _, _, body = request(url)
    return json.loads(body)


def upload_instagram(video_url, caption, version):
    token, account_id = require_env("INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_USER_ID")
    container = instagram_request(version, f"{account_id}/media", {
        "media_type": "REELS",
        "video_url": video_url,
        "caption": caption,
        "share_to_feed": "true",
        "access_token": token,
    })
    creation_id = container.get("id")
    if not creation_id:
        raise UploadError("Instagram did not return a Reel container ID.")

    deadline = time.monotonic() + 600
    while time.monotonic() < deadline:
        status = instagram_json_request(version, creation_id, token).get("status_code")
        if status == "FINISHED":
            break
        if status in ("ERROR", "EXPIRED"):
            raise UploadError(f"Instagram Reel processing ended with status {status}.")
        time.sleep(5)
    else:
        raise UploadError("Timed out waiting for Instagram to process the video.")

    result = instagram_request(version, f"{account_id}/media_publish", {
        "creation_id": creation_id,
        "access_token": token,
    })
    media_id = result.get("id")
    if not media_id:
        raise UploadError("Instagram publish completed without returning a media ID.")
    print(f"Instagram Reel published (media ID: {media_id})")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", type=Path, help="Rendered MP4 file")
    parser.add_argument("--platform", choices=("youtube", "instagram", "both"), required=True)
    parser.add_argument("--title", help="YouTube title; defaults to the video metadata")
    parser.add_argument("--description", help="YouTube description; defaults to metadata and hashtags")
    parser.add_argument("--caption", help="Instagram caption; defaults to metadata and hashtags")
    parser.add_argument("--instagram-video-url", help="Public HTTPS URL Instagram can fetch for the Reel")
    parser.add_argument("--graph-api-version", default=os.getenv("META_GRAPH_API_VERSION"),
                        help="Meta Graph API version, e.g. vXX.X (or META_GRAPH_API_VERSION)")
    parser.add_argument("--privacy", choices=("private", "unlisted", "public"), default="private",
                        help="YouTube visibility; defaults to private")
    parser.add_argument("--publish", action="store_true",
                        help="Actually upload/publish. Without this flag, only prints the plan.")
    args = parser.parse_args()

    video = (ROOT / args.video).resolve() if not args.video.is_absolute() else args.video.resolve()
    if not video.is_file() or video.suffix.lower() != ".mp4":
        parser.error(f"video must be an existing MP4 file: {video}")

    metadata = {}
    candidates = [
        video.parent / "storyboard.json",
        video.parent / f"{video.parent.name}.json",
        ROOT / "videos" / f"{video.stem}.json",
    ]
    for spec_path in candidates:
        if spec_path.is_file():
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            metadata = spec.get("meta", {})
            if metadata:
                break
    title = args.title or metadata.get("title") or video.stem.replace("-", " ").title()
    hashtags = metadata.get("hashtags", [])
    hashtag_text = " ".join("#" + tag.lstrip("#") for tag in hashtags)
    description = args.description or metadata.get("description", "")
    if hashtag_text:
        description = (description.rstrip() + "\n\n" + hashtag_text).strip()
    caption = args.caption or description

    if args.platform in ("instagram", "both"):
        if not args.instagram_video_url:
            parser.error("--instagram-video-url is required for Instagram; the URL must be publicly fetchable over HTTPS")
        if not args.graph_api_version:
            parser.error("Set --graph-api-version or META_GRAPH_API_VERSION for Instagram uploads")
        if not args.instagram_video_url.startswith("https://"):
            parser.error("--instagram-video-url must use HTTPS")

    print(f"Video: {video}")
    if args.platform in ("youtube", "both"):
        print(f"YouTube: {title[:100]} (visibility: {args.privacy})")
    if args.platform in ("instagram", "both"):
        print(f"Instagram Reel: {args.instagram_video_url}")
        print(f"Caption: {caption}")
    if not args.publish:
        print("Dry run only. Add --publish to upload.")
        return 0

    try:
        if args.platform in ("youtube", "both"):
            upload_youtube(video, title, description, args.privacy)
        if args.platform in ("instagram", "both"):
            upload_instagram(args.instagram_video_url, caption, args.graph_api_version)
    except (UploadError, ValueError, KeyError) as exc:
        print(f"Upload failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
