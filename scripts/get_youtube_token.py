#!/usr/bin/env python3
"""One-time helper to get YOUTUBE_REFRESH_TOKEN and save it to .env.

Reads YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET from .env,
starts a local listener on http://localhost:8080, opens your browser
for Google OAuth authorization, exchanges the code for a refresh_token,
and updates .env automatically.
"""

import http.server
import json
import os
import sys
import urllib.parse
import urllib.request
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"
REDIRECT_URI = "http://localhost:8080"
SCOPE = "https://www.googleapis.com/auth/youtube.upload"


def load_env():
    env = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    return env


def update_env(updates):
    existing = load_env()
    existing.update(updates)
    content = "\n".join(f"{k}={v}" for k, v in existing.items()) + "\n"
    ENV_PATH.write_text(content, encoding="utf-8")
    print(f"Updated {ENV_PATH}")


def main():
    print("=" * 60)
    print("  YouTube OAuth 2.0 Authorization")
    print("=" * 60)

    env = load_env()
    client_id = env.get("YOUTUBE_CLIENT_ID") or os.environ.get("YOUTUBE_CLIENT_ID")
    client_secret = env.get("YOUTUBE_CLIENT_SECRET") or os.environ.get("YOUTUBE_CLIENT_SECRET")

    if not client_id:
        client_id = input("Enter your YOUTUBE_CLIENT_ID: ").strip()
    else:
        print(f"Using Client ID from .env: {client_id[:25]}...")

    if not client_secret:
        client_secret = input("Enter your YOUTUBE_CLIENT_SECRET: ").strip()
    else:
        print(f"Using Client Secret from .env: {client_secret[:8]}...")

    if not client_id or not client_secret:
        print("Error: Client ID and Secret are required.")
        return 1

    auth_code = None

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            nonlocal auth_code
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)
            if "code" in params:
                auth_code = params["code"][0]
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(b"<h1>Authorization successful!</h1><p>You can close this tab and return to your terminal.</p>")
            else:
                self.send_response(400)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                self.wfile.write(b"<h1>Authorization error</h1><p>No code returned.</p>")

        def log_message(self, format, *args):
            pass

    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        + urllib.parse.urlencode({
            "client_id": client_id,
            "redirect_uri": REDIRECT_URI,
            "response_type": "code",
            "scope": SCOPE,
            "access_type": "offline",
            "prompt": "consent",
        })
    )

    server = http.server.HTTPServer(("localhost", 8080), Handler)
    print(f"\nOpening browser for Google authorization...")
    print(f"If your browser does not open automatically, visit this URL:\n\n{auth_url}\n")
    webbrowser.open(auth_url)

    print("Waiting for you to sign in and authorize in your browser (listening on http://localhost:8080)...")
    while not auth_code:
        server.handle_request()

    # Exchange authorization code for refresh_token
    token_url = "https://oauth2.googleapis.com/token"
    data = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "code": auth_code,
        "grant_type": "authorization_code",
        "redirect_uri": REDIRECT_URI,
    }).encode("utf-8")

    req = urllib.request.Request(
        token_url,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            tokens = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"Failed to exchange authorization code for tokens: {e}")
        return 1

    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        print("\nWarning: Google did not return a refresh_token.")
        print(f"Response: {tokens}")
        print("Note: If you already authorized this app previously, Google may only return an access_token.")
        print("To force a refresh token, revoke app access in your Google Account security settings and re-run.")
        return 1

    print("\nRefresh token successfully acquired!")
    update_env({
        "YOUTUBE_CLIENT_ID": client_id,
        "YOUTUBE_CLIENT_SECRET": client_secret,
        "YOUTUBE_REFRESH_TOKEN": refresh_token,
    })
    print("\nAll YouTube credentials are saved in .env!")
    print("You are ready to upload videos with:")
    print("  python3 scripts/upload_video.py out/whatsapp-bluetick.mp4 --platform youtube --privacy public --publish")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
