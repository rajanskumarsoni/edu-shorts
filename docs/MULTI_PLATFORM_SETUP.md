# EduShorts Multi-Platform Direct API Upload Guide

EduShorts includes a built-in multi-platform publishing engine in [`tools/upload_video.py`](file:///Users/rajankumarsoni/Desktop/projects/edu-shorts/tools/upload_video.py) that uploads rendered MP4 videos directly through official developer APIs.

- **100% Free Forever**: No third-party aggregator subscriptions (e.g. Ayrshare $149/mo, Buffer $60/mo).
- **Direct Binary Uploads**: Directly uploads local `.mp4` video files from your machine (does not require external cloud hosting for YouTube, Telegram, Instagram, Facebook, Twitter, or LinkedIn).
- **Metadata Synchronization**: Automatically extracts title, tags, description, hashtags, and custom thumbnails from `storyboard.json` and `post.md`.

---

## 📊 Quick Status Check

Run the credential auditor at any time to see which platforms are ready:

```bash
python3 tools/upload_video.py --check
```

Example Output:
```text
=================================================================
 📡 EduShorts Multi-Platform API Status & Readiness Dashboard
=================================================================
  YouTube Shorts       : 🟢 READY
  Telegram Channel     : ⚪ NOT CONFIGURED
  Instagram Reels      : ⚪ NOT CONFIGURED
  Facebook Reels       : ⚪ NOT CONFIGURED
  𝕏 / Twitter          : ⚪ NOT CONFIGURED
  LinkedIn             : ⚪ NOT CONFIGURED
  Threads              : ⚪ NOT CONFIGURED
=================================================================
```

---

## 🚀 Supported Platforms & Setup Instructions

### 1. YouTube Shorts (Status: 🟢 Active & Working)
- **API**: YouTube Data API v3 (Resumable Upload Session).
- **Video Specs**: 1080×1920 (9:16), ≤ 60 seconds, auto-tagged `#Shorts`.
- **Thumbnail**: Automatically sets high-CTR custom thumbnail.
- **Keys in `.env`**:
  ```env
  YOUTUBE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
  YOUTUBE_CLIENT_SECRET=your_google_client_secret
  YOUTUBE_REFRESH_TOKEN=your_google_refresh_token
  ```

---

### 2. Telegram Channels & Groups (Setup Time: 60 Seconds)
- **API**: Telegram Bot API (`sendVideo` multipart).
- **Cost**: 100% Free forever (up to 50MB per video).
- **Features**: Direct video upload, streaming support, Markdown caption, custom thumbnail.
- **How to Get Keys**:
  1. Open Telegram and search for `@BotFather`.
  2. Send `/newbot`, choose a name and username (e.g. `EduShortsUploaderBot`).
  3. Copy the **HTTP API Token** provided by BotFather.
  4. Create your Telegram Channel (or open an existing one).
  5. Add your new Bot as an **Administrator** with permission to "Post Messages".
  6. Get your Channel ID (e.g. `@your_channel_name` or `-100xxxxxxxxxx`).
- **Keys in `.env`**:
  ```env
  TELEGRAM_BOT_TOKEN=1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ
  TELEGRAM_CHAT_ID=@your_channel_username
  ```

---

### 3. Instagram Reels (Direct Resumable Upload)
- **API**: Meta Graph API (`/{ig-user-id}/media` with `upload_type=resumable` and `media_type=REELS`).
- **Cost**: 100% Free.
- **Features**: Direct binary file streaming to Meta's `rupload.facebook.com` servers — no external web hosting required.
- **How to Get Keys**:
  1. Go to [developers.facebook.com](https://developers.facebook.com) and create an app (type: **Business**).
  2. Connect your Instagram Professional (Creator or Business) account to a Facebook Page.
  3. Under App Products, add **Instagram Graph API**.
  4. Generate a User Access Token with permissions:
     - `instagram_basic`
     - `instagram_content_publish`
     - `pages_show_list`
     - `pages_read_engagement`
  5. Exchange for a long-lived access token (valid 60 days, auto-refreshable).
  6. Find your Instagram User ID via Graph API Explorer (`GET /me/accounts` ➔ `instagram_business_account.id`).
- **Keys in `.env`**:
  ```env
  INSTAGRAM_ACCESS_TOKEN=EAAG...
  INSTAGRAM_USER_ID=17841400000000000
  ```

---

### 4. Facebook Reels & Pages
- **API**: Meta Graph API (`/{page-id}/video_reels` start / binary upload / finish).
- **Cost**: 100% Free.
- **Features**: Direct chunked binary upload to `rupload.facebook.com`, automatic reel publishing to Page feed.
- **How to Get Keys**:
  1. In your Meta Developer App, generate a **Page Access Token** for your Facebook Page.
  2. Ensure permissions: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`.
  3. Copy your numeric Facebook Page ID.
- **Keys in `.env`**:
  ```env
  FB_PAGE_ACCESS_TOKEN=EAAG...
  FB_PAGE_ID=100092384758392
  ```

---

### 5. 𝕏 / Twitter (Direct Chunked Media Upload)
- **API**: Twitter API v1.1 Chunked Upload (`INIT`, `APPEND`, `FINALIZE`, `STATUS`) + Twitter API v2 (`POST /2/tweets`).
- **Cost**: 100% Free (Free Tier supports 1,500 tweets/month).
- **Features**: RFC 5849 compliant OAuth 1.0a signer with zero external dependencies. Uploads large MP4s in 4MB segments.
- **How to Get Keys**:
  1. Go to [developer.x.com](https://developer.x.com) and sign in.
  2. Create a Project and App in the Developer Portal.
  3. Under **User authentication settings**, set App permissions to **Read and write**.
  4. Generate:
     - **API Key** (`Consumer Key`)
     - **API Key Secret** (`Consumer Secret`)
     - **Access Token** (User context with Write permissions)
     - **Access Token Secret**
- **Keys in `.env`**:
  ```env
  TWITTER_API_KEY=your_consumer_key
  TWITTER_API_SECRET=your_consumer_secret
  TWITTER_ACCESS_TOKEN=your_access_token
  TWITTER_ACCESS_SECRET=your_access_token_secret
  ```

---

### 6. LinkedIn (Direct REST Video & Post API)
- **API**: LinkedIn REST API (`/rest/videos?action=initializeUpload`, binary PUT chunking with ETags, `/rest/videos?action=finalizeUpload`, `/rest/posts`).
- **Cost**: 100% Free.
- **Features**: Native 2024 REST version with chunked binary uploads to LinkedIn DMS.
- **How to Get Keys**:
  1. Go to [developer.linkedin.com](https://developer.linkedin.com) and create an App.
  2. Under Products, request access to **Share on LinkedIn** and **Sign In with LinkedIn using OpenID Connect**.
  3. Generate an Access Token with scopes:
     - `w_member_social` (for personal profiles)
     - `w_organization_social` (if posting to a Company Page)
  4. If `LINKEDIN_PERSON_URN` is omitted, the uploader auto-resolves your Person URN via `/v2/userinfo`.
- **Keys in `.env`**:
  ```env
  LINKEDIN_ACCESS_TOKEN=AQV...
  LINKEDIN_PERSON_URN=urn:li:person:abcdef1234  # optional: auto-resolved if omitted
  ```

---

### 7. Meta Threads (Optional)
- **API**: Meta Threads API (`graph.threads.net`, `media_type=VIDEO`, `threads_publish`).
- **Cost**: 100% Free.
- **Note**: The Threads API requires a publicly accessible `video_url` (e.g. from your CDN, S3, or public bucket).
- **Keys in `.env`**:
  ```env
  THREADS_ACCESS_TOKEN=THQ...
  THREADS_USER_ID=123456789
  ```

---

## 🛠️ Complete CLI Usage Guide

### 1. Test in Dry-Run Mode (Safe Preview)
Runs metadata extraction and payload verification without executing real network uploads:
```bash
python3 tools/upload_video.py episodes/tesla-flying-roadster/final.mp4 --platform all
```

### 2. Publish to a Single Platform
```bash
# Upload to Telegram only:
python3 tools/upload_video.py episodes/tesla-flying-roadster/final.mp4 --platform telegram --publish

# Upload to Twitter / 𝕏 only:
python3 tools/upload_video.py episodes/tesla-flying-roadster/final.mp4 --platform twitter --publish

# Upload to Instagram Reels only:
python3 tools/upload_video.py episodes/tesla-flying-roadster/final.mp4 --platform instagram --publish
```

### 3. Publish to All Configured Platforms Simultaneously
```bash
python3 tools/upload_video.py episodes/tesla-flying-roadster/final.mp4 --platform all --publish
```

### 4. End-to-End Pipeline Auto-Publishing
Render a new video from scratch and automatically upload to all platforms upon completion:
```bash
python3 pipeline.py episodes/tesla-flying-roadster/storyboard.json --upload public --upload-platform all
```

### 5. Automated Background Folder Watcher
Monitors `episodes/*/final.mp4` and automatically uploads newly rendered videos as soon as rendering completes:
```bash
# Watch and upload to YouTube:
python3 tools/auto_upload.py --watch --platform youtube

# Watch and broadcast to all platforms:
python3 tools/auto_upload.py --watch --platform all
```

---

## 📋 `.env` Master Template

Add the following keys to your project root [`.env`](file:///Users/rajankumarsoni/Desktop/projects/edu-shorts/.env):

```env
# =============================================================================
# YouTube Data API v3 (Active)
# =============================================================================
YOUTUBE_CLIENT_ID=your_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your_secret
YOUTUBE_REFRESH_TOKEN=your_refresh_token

# =============================================================================
# Telegram Bot API (Direct Multipart)
# =============================================================================
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# =============================================================================
# Meta Graph API (Instagram & Facebook Reels)
# =============================================================================
META_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
FB_PAGE_ID=
FB_PAGE_ACCESS_TOKEN=

# =============================================================================
# 𝕏 / Twitter API v1.1 + v2
# =============================================================================
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_SECRET=

# =============================================================================
# LinkedIn REST API
# =============================================================================
LINKEDIN_ACCESS_TOKEN=
LINKEDIN_PERSON_URN=

# =============================================================================
# Meta Threads API
# =============================================================================
THREADS_ACCESS_TOKEN=
THREADS_USER_ID=
```
