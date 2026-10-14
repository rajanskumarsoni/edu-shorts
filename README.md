# edu-shorts: make educational videos from a JSON script

You write (or have an AI write) a small JSON file. You turn the narration into audio with
your own text-to-speech (TTS) model. One command then builds a finished MP4 with animated
scenes, Manim math/diagram animations, background effects and your voice.

- **Default size: vertical 1080x1920 (Reels / Shorts / TikTok), full HD.**
- Optional: landscape 1920x1080 (normal YouTube video). Optional double resolution with `--scale 2`.
- Maximum length: **3 minutes / 180 seconds** (enforced).
- Optional word-highlighted captions can be enabled per script; they preserve the approved Hindi narration verbatim.
- Scene types include hook, bullets, stat, manim, image, quote, compare, outro, native 3D, architecture,
  code, timelines, data visualizations, and topic-specific scenes.
- Scripts may define timed visual beats and a persistent chapter rail to make important state changes
  trackable through a scene and across the video.
- **Editorial motion-graphics look by default:** stable diagrams, a subtle blueprint grid, and restrained composition.
  Set `"art_direction": "cinematic"` to opt into legacy camera drift, bokeh, light sweeps, color grade, vignette, and grain.

Honest scope: this gives a polished, modern motion-graphics look. It is not a film-style 3D render
(realistic lighting, cameras, characters). For that you would use a 3D tool such as Blender.

---

## Table of contents
1. [How it works](#1-how-it-works)
2. [What is in the folder](#2-what-is-in-the-folder)
3. [Install everything (one time)](#3-install-everything-one-time)
4. [Set up the project (one time)](#4-set-up-the-project-one-time)
5. [First test run (no TTS needed)](#5-first-test-run-no-tts-needed)
6. [Connect your TTS model (one time)](#6-connect-your-tts-model-one-time)
7. [Make a real video: the full routine](#7-make-a-real-video-the-full-routine)
8. [Script (JSON) reference](#8-script-json-reference)
9. [Using another AI to write your scripts](#9-using-another-ai-to-write-your-scripts)
10. [Vertical vs landscape, and length rules](#10-vertical-vs-landscape-and-length-rules)
11. [Make many videos (batch)](#11-make-many-videos-batch)
12. [Change the look](#12-change-the-look)
13. [Write your own Manim animation](#13-write-your-own-manim-animation)
14. [Troubleshooting](#14-troubleshooting)
15. [Command cheat sheet](#15-command-cheat-sheet)
16. [Pre-upload checklist](#16-pre-upload-checklist)
17. [Ollama Cloud chat](#17-ollama-cloud-chat)

---

## 1. How it works

For new videos, keep each episode's source material and deliverables together:

```
episodes/<id>/
  brief.yaml, script.md, storyboard.json
  audio/                 narration audio
  media/                 thumbnails, scene stills, QA contact sheets
  post.md                publishing metadata
  final.mp4              rendered video
```

Validate and render an episode with:

```bash
python3 validate.py episodes/<id>/storyboard.json
python3 pipeline.py episodes/<id>/storyboard.json --preview --no-upload
python3 pipeline.py episodes/<id>/storyboard.json --no-upload
```

The pipeline generates Remotion's temporary/runtime assets in `public/<id>/`. That folder is
not a second source of truth: its copied audio and scene assets are staging inputs for rendering.
Legacy specs in `videos/<id>.json` are still supported and continue to use `audio/<id>/`,
`media/<id>/`, and `out/<id>.mp4`.

By default, the whole video uses **ONE narration audio file**; set `"audio_mode": "scenes"` to use
one narration file per scene. **Audio decides timing:** each scene lasts from its narration start
until the next scene's narration starts.

---

## 2. What is in the folder

```
edu-shorts/
  pipeline.py            main command: script + audio -> mp4
  validate.py            checks your script for mistakes (also runs automatically)
  make_test_audio.py     makes placeholder audio so you can try the pipeline
  tts.py                 optional: plug in your TTS model to automate the narration audio
  episodes/<id>/         canonical source, narration, media, metadata, and final render
  videos/                legacy standalone storyboard JSON files
  public/<id>/           generated Remotion staging assets; do not author source files here
  audio/<id>/            legacy narration input for specs in videos/
  media/<id>/            legacy images and QA stills for specs in videos/
  out/                   legacy renders and generated upload metadata
  manim_templates/       Manim animation templates (Equations, Graph, Flow) + your own
  src/                   Remotion (React) code: scenes, look, effects
  prompts/               shared production prompts and templates
  package.json, requirements.txt, tsconfig.json, remotion.config.ts   setup files
```

For new work, use `episodes/<id>/`. The detailed walkthrough and command examples below document
the still-supported legacy `videos/` workflow; existing files are not moved or rewritten.

---

## 3. Install everything (one time)

You need: **Node.js**, **Python**, **FFmpeg**, and optionally **LaTeX**.
Open a terminal (Windows: PowerShell; macOS: Terminal; Linux: any terminal).

### 3.1 Node.js (version 18 or newer)
- Download the LTS version from https://nodejs.org and install it.
- Check: `node --version` (should print v18 or higher) and `npm --version`.

### 3.2 Python (version 3.14, the latest stable release)
- Download from https://www.python.org/downloads/.
- **Windows: tick "Add Python to PATH" in the installer.**
- Check: `python --version` (should print Python 3.14.x; on macOS/Linux you may need `python3 --version`).
  If your system uses `python3`, type `python3` wherever this guide says `python`.

### 3.3 FFmpeg (includes ffprobe)
- Windows: `winget install ffmpeg` (or download from https://ffmpeg.org and add the
  `bin` folder to PATH).
- macOS: `brew install ffmpeg`
- Linux (Debian/Ubuntu): `sudo apt install ffmpeg`
- Check both: `ffmpeg -version` and `ffprobe -version` must print version info.

### 3.4 LaTeX (OPTIONAL: only for the Equations template)
Only needed if your scripts use `"template": "Equations"`. You can skip it and use
the `Graph` and `Flow` templates, which need no LaTeX.
- Windows: install MiKTeX from https://miktex.org
- macOS: install MacTeX (https://tug.org/mactex/) or `brew install --cask basictex`
- Linux: `sudo apt install texlive-latex-extra texlive-fonts-extra dvipng`
- Check: `latex --version`

### 3.5 Manim system libraries
Manim is installed in step 4 with pip. On some systems it needs extra libraries first:
- Linux: `sudo apt install libcairo2-dev libpango1.0-dev pkg-config python3-dev`
- macOS: `brew install cairo pango pkg-config`
- Windows: usually nothing extra.
If the pip install of Manim fails, follow https://docs.manim.community/en/stable/installation.html

---

## 4. Set up the project (one time)

1. Unzip `edu-shorts.zip` somewhere easy (for example `Documents/edu-shorts`).
2. Open a terminal **inside that folder**.
   (Windows: open the folder, click the address bar, type `powershell`, press Enter.)
3. Install the JavaScript packages (needs internet, takes a minute):
   ```
   npm install
   ```
4. (Recommended) create a Python virtual environment, then install Manim:
   - Windows: `py -3.14 -m venv venv`
   - macOS/Linux: `python3.14 -m venv venv`
   Activate it:
   - Windows PowerShell: `venv\Scripts\Activate.ps1`
     (if blocked: `Set-ExecutionPolicy -Scope Process Bypass` first)
   - macOS/Linux: `source venv/bin/activate`

   Then:
   ```
   pip install -r requirements.txt
   ```
   **Each time you open a new terminal for this project, activate the venv again.**
5. Check Manim works: `manim --version`

Note: the first time Remotion renders, it downloads a small headless Chrome.
This needs internet once, then it is cached.

---

## 5. First test run (no TTS needed)

Do this once to confirm everything is installed correctly. It uses the example script
`videos/pythagoras.json` and **placeholder audio** (a quiet test hum, no voice).

1. Validate the script:
   ```
   python validate.py videos/pythagoras.json
   ```
   Expected: a line starting with `OK`.
2. Make the placeholder narration:
   ```
   python make_test_audio.py videos/pythagoras.json
   ```
   This creates `audio/pythagoras/narration.wav`: a hum for each scene with a pause between scenes,
   like a real narration.
3. Build the video:
   ```
   python pipeline.py videos/pythagoras.json
   ```
   You will see: validation, a list of where each scene starts, `Total length: ...`,
   each scene, "rendering Manim", then Remotion's frame progress. The first run is slowest.
4. Open `out/pythagoras.mp4`. You should see animated scenes (with the test hum as sound).
5. **Delete the test audio** before making the real version: delete the folder `audio/pythagoras`.

Want to see every scene type? Repeat steps 1-5 with `videos/demo-all-scenes.json`
(it uses the placeholder picture `images/sample.jpg`, a quote, a comparison and a flow diagram; no LaTeX needed).

If any step fails, see [Troubleshooting](#14-troubleshooting).

---

## 6. Connect your TTS model (one time)

### 6.1 What your TTS must do
Your TTS reads the **whole narration in one run** and produces **one audio file**.
The pipeline then needs to know where each scene starts. The easiest way is for the voice to
leave a **clear pause (about 1 second or more) at every blank line** in the text, because
`narration_text.txt` has one paragraph per scene, separated by blank lines.

Check how your TTS handles a blank line: paste two paragraphs separated by an empty line and
listen. If the pause is too short or missing, use one of these fixes:
- **Pause marker:** use your TTS's own pause syntax between scenes, for example
  `python pipeline.py videos/<id>.json --export-text --separator "<break time='1.2s'/>"`
  puts that text on its own line between scenes in `narration_text.txt`.
- **Speech recognition (automatic):** `pip install faster-whisper` (section 6.4).
- **Manual times:** write each scene's start time in a file (section 6.3).

### 6.2 Option A (manual) or Option B (automatic)

**Option A, manual (works with any model, no coding):**
1. Run `python pipeline.py videos/<id>.json --export-text`.
2. Open `audio/<id>/narration_text.txt` and put the whole text through your TTS in one run.
3. Save the result as `audio/<id>/narration.wav` (`.mp3 .m4a .ogg .flac .aac` also work).

**Option B, automatic (a little coding, once):** open `tts.py` and fill in
`synthesize_all(text, out_path)` so it saves audio to `out_path`. Set `TTS_EXT` to your model's
file type. Examples:

```python
# Python library
from mymodel import TTS
model = TTS()
def synthesize_all(text, out_path):
    model.save(text, out_path)

# Command-line tool
import subprocess
def synthesize_all(text, out_path):
    subprocess.run(["mytts", "--text", text, "--out", out_path], check=True)

# Local web API
import requests
def synthesize_all(text, out_path):
    r = requests.post("http://localhost:5000/tts", json={"text": text})
    open(out_path, "wb").write(r.content)
```
After this, `python pipeline.py videos/<id>.json` creates the narration itself if the file is missing.

Audio tips: one voice for the whole video, steady volume, no long silence at the very start.
Half of each pause between scenes ends up at the end of one scene and half at the start of the next.

#### Using the local VoiceStudio API with the Rajan Story Teller clone

This project can send narration text to a local VoiceStudio server and save the returned audio.
The OpenAI-compatible endpoint is `POST http://127.0.0.1:3900/v1/audio/speech`; it accepts JSON
and returns audio bytes. First find the profile ID for your clone:

```sh
curl http://127.0.0.1:3900/profiles
```

In this project, the profile named `rajan story teller` has ID `e42e619e`. This is configured as default
in `.env` and `tts.py`:

```ini
VOICESTUDIO_URL=http://127.0.0.1:3900
VOICESTUDIO_VOICE_ID=e42e619e
VOICESTUDIO_VOICE_NAME=rajan story teller
```

You can test synthesis directly via curl:

```sh
curl -X POST http://127.0.0.1:3900/v1/audio/speech \
  -H 'Content-Type: application/json' \
  -d '{"input":"Hello, welcome to this lesson.","voice":"e42e619e","response_format":"mp3"}' \
  --output out/rajan-sample.mp3
```

Or check connectivity and synthesize using `tts.py`:

```sh
python tts.py --check
python tts.py "Hello, welcome to this lesson." out/rajan-sample.mp3
python tts.py --video videos/backpropagation.json
```

The endpoint accepts up to 4,096 characters per request. When running `pipeline.py`, any missing
scene audio (`s1.mp3`, `s2.mp3` ...) is synthesized automatically via `tts.py` using VoiceStudio
and the `rajan story teller` profile. VoiceStudio must be running locally with a speech model available.

### 6.3 How scene start times are found
By default (`--align auto`) the pipeline tries, in this order:

| Order | Method | When it is used |
|---|---|---|
| 1 | **timings.txt** | You created `audio/<id>/timings.txt` (always wins). |
| 2 | **Pauses** | The N-1 longest pauses in the audio are the scene boundaries. Used when they are clearly longer than the other pauses. |
| 3 | **Speech recognition** | If pauses are unclear and `faster-whisper` is installed: the audio is transcribed and matched to your narration text. |
| 4 | **Pauses, low confidence** | Last resort, with a WARNING. Check the printed times. |

The pipeline prints where it thinks each scene starts:
```
Narration: narration.wav (1:12.40); scene starts found by silence (confidence 2.4)
  scene 1 starts at 0:00.00
  scene 2 starts at 0:06.85
  ...
```
**Always sanity-check these times** (open the audio and look at a couple of them).
It also saves them to `audio/<id>/timings.auto.txt`.

**To fix or override times:** copy `timings.auto.txt` to `timings.txt`, edit the numbers, and re-run.
`timings.txt` is just times in seconds (or `m:ss.s`), one per line. You can list the N-1 starts of
scenes 2..N, or all N starts (the first is ignored). Lines can have `# comments`.
```
# start of scenes 2, 3, 4
6.85
21.30
33.00
```

Options (add to the pipeline command): `--align silence|whisper|manual`,
`--silence-db -35` (what counts as silent; use `-45` for noisy audio),
`--silence-min 0.4` (shortest pause considered, in seconds), `--whisper-model base`.

### 6.4 Optional: automatic alignment with Whisper
```
pip install faster-whisper
```
The first use downloads a speech model (needs internet once). Whisper listens to your audio, and the
pipeline matches the heard words to your narration text to locate each scene start, even when your TTS
adds no pauses. Works best for spelled-out text (which the AI prompt already requests).
Use `--whisper-model small` for better accuracy on difficult voices or languages.

### 6.5 Alternative: one audio file per scene
If you would rather generate each scene separately (exact timing, no alignment needed, and you can
redo a single scene), add `"audio_mode": "scenes"` to the script JSON, then:
1. `python pipeline.py videos/<id>.json --export-text` writes `audio/<id>/s1.txt, s2.txt, ...`
2. Convert each to audio and save as `s1.wav, s2.wav, ...` in the same folder (numbers start at 1).
3. (Automatic option: fill in `synthesize()` in `tts.py`.)
Scenes may then have no narration; give those `"seconds": 3`. Each scene lasts its audio plus 0.45 s.

---

## 7. Make a real video: the full routine

Repeat these steps for every new video.

### Step 1: Decide the video
Topic, audience, length (max 5 min), format (vertical by default).

### Step 2: Create the script file
Either:
- **Copy** `videos/pythagoras.json` to `videos/my-topic.json` and edit it, or
- **Ask an AI** to write it ([section 9](#9-using-another-ai-to-write-your-scripts)).

Rules: the file's `"id"` must be unique, lowercase, dashes only (for example `how-vaccines-work`).
Save as UTF-8. In the default single-audio mode every scene needs a `narration`.

### Step 3: Validate
```
python validate.py videos/my-topic.json
```
- `ERROR` lines must be fixed (the pipeline will refuse to run).
- `warning` lines are advice (too many words, too many bullets, ...). Read them.
- The last line shows the estimated length.

### Step 4: Export the narration text
```
python pipeline.py videos/my-topic.json --export-text
```
Creates `audio/my-topic/narration_text.txt` (paste this into your TTS) and
`narration_labeled.txt` (same text with scene numbers, for reading).

### Step 5: Create the audio
- Option A (manual): run your TTS on `narration_text.txt` in one go, save as `audio/my-topic/narration.wav`.
- Option B (automatic): skip this step; Step 7 creates it through `tts.py`.
Listen to the whole file once. Check that: the voice is clear, every blank line has a noticeable pause,
and no word is mispronounced. Fix pronunciation by rewording the narration in the JSON (respell hard
words, e.g. "see oh two"), then re-export and regenerate.

### Step 6: (Optional) Preview before the full render
```
python pipeline.py videos/my-topic.json --no-render
npx remotion studio src/index.ts --props=public/my-topic/manifest.json
```
This also prints where each scene starts. Your browser opens the Remotion Studio: scrub the
timeline and check layout and timing. Press Ctrl+C in the terminal to close it.

### Step 7: Render the final video
```
python pipeline.py videos/my-topic.json
```
It will: validate, find scene starts, stop if the video is over 3 minutes, render the Manim scenes,
and render the final MP4 to `out/my-topic.mp4`.
**Read the printed scene start times.** If any look wrong, see section 6.3.

### Step 8: Review
Watch the whole file once with sound. Check: hook is strong, nothing is cut off at the edges,
each animation appears while its narration is spoken, the key object/state is immediately legible
on a phone, and volume is fine. Create a sampled contact sheet for a fast visual pass:
`python scripts/make_qa_contact_sheet.py out/my-topic.mp4`.
It writes `media/my-topic/qa/contact-sheet.jpg`; review it at phone size for mismatched visuals,
clipped text, unclear state changes, and scenes whose focal object is too small.

### Step 9: Fix and re-run
- Changed on-screen text, equations, items? Just re-run Step 7.
- Changed narration text? Regenerate the narration audio (the whole file) and re-run Step 7.
  (With `"audio_mode": "scenes"` you only regenerate that scene's file.)
- Scene starts slightly off? Use `timings.txt` (section 6.3).
- Re-running always rebuilds everything from the current script and audio.

### Step 10: Upload
Upload `out/my-topic.mp4`. If the script has a `meta` block, copy the title, description and hashtags
from `out/my-topic-upload.txt`, and double-check the facts listed there. For Shorts/Reels, vertical
videos of 3 minutes or less qualify.

To upload using the official YouTube and Instagram APIs, use `scripts/upload_video.py`.
It defaults YouTube uploads to **private** and runs as a dry run unless `--publish` is provided.
Use `--platform youtube`, `--platform instagram`, or `--platform both`.

**YouTube setup:** create a Google Cloud OAuth client, enable YouTube Data API v3, authorize the
YouTube account with the `youtube.upload` scope, and obtain a refresh token. Set these environment
variables locally; never paste credentials into chat or commit them:

```sh
export YOUTUBE_CLIENT_ID='your-oauth-client-id'
export YOUTUBE_CLIENT_SECRET='your-oauth-client-secret'
export YOUTUBE_REFRESH_TOKEN='your-oauth-refresh-token'
```

**Instagram setup:** use an Instagram Business or Creator account and a Meta app with the Instagram
content-publishing permission. Set the account's Instagram user ID, a suitable access token, and the
Graph API version supported by your Meta app. Instagram's API must be able to fetch the video from a
public HTTPS URL; a local path or `127.0.0.1` URL will not work. Host the MP4 at an accessible URL
first, and set these locally:

```sh
export INSTAGRAM_USER_ID='your-instagram-professional-account-id'
export INSTAGRAM_ACCESS_TOKEN='your-meta-access-token'
export META_GRAPH_API_VERSION='vXX.X'
```

Preview the YouTube upload plan (no credentials needed):

```sh
python scripts/upload_video.py out/backpropagation.mp4 --platform youtube
```

Upload it privately to YouTube after setting credentials:

```sh
python scripts/upload_video.py out/backpropagation.mp4 --platform youtube --privacy private --publish
```

Publish an Instagram Reel after hosting the MP4 at a publicly fetchable HTTPS URL:

```sh
python scripts/upload_video.py out/backpropagation.mp4 \
  --platform instagram \
  --instagram-video-url 'https://your-host.example/backpropagation.mp4' \
  --publish
```

For both platforms, use `--platform both`; YouTube stays private by default while Instagram publishes
to the connected account. Review the generated title and caption before publishing. API eligibility,
permissions, and account settings are controlled by Google and Meta and may change.

---

## 8. Script (JSON) reference

### 8.1 Top level

```json
{
  "id": "how-vaccines-work",
  "format": "vertical",
  "art_direction": "editorial",
  "accent": "#FFC857",
  "music": null,
  "journey": ["SEARCH", "BOOK NOW", "PAYMENT"],
  "meta": {"title": "...", "description": "...", "hashtags": ["..."], "facts_to_verify": ["..."]},
  "scenes": [ ... ]
}
```

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Lowercase letters, digits, dashes. Names the audio folder and the output file. |
| `format` | no | `"vertical"` (default, 1080x1920) or `"landscape"` (1920x1080). |
| `art_direction` | no | `"editorial"` (default: stable diagrams and restrained styling) or `"cinematic"` (legacy glow, bokeh, drift, grade, and light sweeps). |
| `audio_mode` | no | `"single"` (default): ONE narration file for the whole video. `"scenes"`: one audio file per scene. |
| `accent` | no | Highlight color as hex, default `#FFC857`. |
| `music` | no | `null` for none, or a path like `"bg.mp3"` (file inside the project folder). Plays quietly (8%) under the voice. |
| `journey` | no | Optional 2–5 short stage labels kept on screen across scenes. Every scene needs a zero-based `journeyStep`; a visual beat can override it. |
| `meta` | no | `{title, description, hashtags, facts_to_verify}`. Not shown in the video; written to `out/<id>-upload.txt` for uploading. |
| `scenes` | yes | List of scenes, played in order. |

### 8.2 Scene types
Every scene can have `"narration"` (the spoken text, never shown on screen).
In the default single-audio mode EVERY scene needs narration. Only with `"audio_mode": "scenes"` can a scene
have no narration, and then it needs `"seconds": N` (otherwise 3 seconds of silence).

| Type | Fields | Limits (warnings) | Looks like |
|---|---|---|---|
| `hook` | `text` | 8 words max | Big title that pops in. Use as the FIRST scene. |
| `bullets` | `title`, `items` (list) | title 4 words, 4 items, 4 words each | Items slide in one by one. |
| `stat` | `value`, `label` | value 8 chars, label 4 words | One huge number or fact. |
| `manim` | `title`, `manim` {...} | title 5 words | An animated Manim clip. |
| `outro` | `text` | 8 words | Call to action. Use as the LAST scene. |
| `image` | `image`, `title` (caption, optional) | caption 8 words | Full-screen photo with a slow camera push and caption. |
| `quote` | `text`, `author` (optional) | 25 words | Large quote with an opening mark. |
| `compare` | `title` (optional), `left`, `right` | heading 3 words, 3 items per side, 5 words each | Two cards (stacked in vertical, side by side in landscape). |
| `three` | `title`, `variant` | Use a registered 3D variant | Native WebGL scene rendered by the variant router. |
| `code` | `title`, `language`, `lines` | Keep visible code short | Animated, syntax-colored code walkthrough. |
| `architecture` | `title`, `nodes`, optional `steps` | 3–5 nodes fit best | Animated system topology with a traveling signal. |
| `gauge` | `title`, `value` or `endValue` | Numeric values work best | Animated metric dial. |
| `timeline` | `title`, `steps` | 3–5 steps fit best | Sequential process with an active step. |
| `callout` | `title` or `text` | Keep the key takeaway short | Animated warning, tip, or rule. |
| `bento` | `title`, `bentoItems` | Use concise item labels | Modular feature and metric grid. |
| `benchmark` | `title`, `runners` | Numeric runner values | Animated comparison bars. |
| `hierarchy` | `title`, `layers` | Use concise layer labels | Layered stack visualization. |
| `data_structure` | `title`, `structure`, `operations` | Queue, stack, buffer, or hashmap | Animated data-structure operations. |
| `inspector` | `title`, `sections` | Short decoded field labels | Payload or packet inspection panels. |
| `quadrant` | `title`, `xAxis`, `yAxis`, `points` | Use a few labeled points | Animated 2D trade-off map. |
| `concentric` | `title`, `rings` | Keep ring labels concise | Layered security or system perimeter. |
| `seat_booking` | `title`, `beats` | Beat `visualState`: `search`, `collision`, `locked`, `payment`, `booked`, `segments` | Train seat and database row change together through a booking race and route-segment overlap. |

Details for the three newer types:

```json
{"type": "image", "image": "images/pyramid.jpg", "title": "The Great Pyramid", "narration": "..."}
{"type": "quote", "text": "If I have seen further, it is by standing on the shoulders of giants.",
 "author": "Isaac Newton", "narration": "..."}
{"type": "compare", "title": "Mitosis vs Meiosis",
 "left":  {"heading": "Mitosis",  "items": ["Two cells", "Identical copies"]},
 "right": {"heading": "Meiosis",  "items": ["Four cells", "Unique mix"]}, "narration": "..."}
```
- **image:** the file must be inside the project (put pictures in `images/`). Formats `.jpg .jpeg .png .webp`.
  Use pictures at least 1080 pixels on the short side. **Only use images you own or are allowed to use**
  (your own, public domain, or properly licensed). The validator checks that the file exists.
- **quote:** only use real, well-documented quotes with the correct author. Misattributed quotes are common;
  check them and list them in `meta.facts_to_verify`.
- **compare:** keep each side to 2-3 short items.

### Timed visual beats and journey rails

Use `beats` when a scene needs distinct visual actions or state changes. `at` is normalized scene
progress from `0` to `1` (not seconds or frames), so it stays aligned when audio timing changes.
The renderer advances the on-screen beat card from the current scene frame. `action` describes what
the viewer sees happen, `state` names the resulting visible state, and `focus` identifies what a
purpose-built scene should emphasize. `visualState` is an optional machine-readable state for
purpose-built renderers. Keep beats in strictly increasing order and begin at `0`.

```json
"journey": ["SEARCH", "BOOK NOW", "PAYMENT"],
"scenes": [
  {
    "type": "seat_booking",
    "journeyStep": 0,
    "beats": [
      {"at": 0, "label": "SEARCH", "action": "Read the seat list", "state": "Seat 23 · FREE", "visualState": "search", "focus": "seat-row", "journeyStep": 0},
      {"at": 0.35, "label": "CLAIM", "action": "Lock the seat row briefly", "state": "Seat 23 · LOCKED", "visualState": "locked", "focus": "row-lock", "journeyStep": 1},
      {"at": 0.7, "label": "PAYMENT", "action": "Release the row lock and start a timed hold", "state": "Seat 23 · HELD", "visualState": "payment", "focus": "payment-hold", "journeyStep": 2}
    ]
  }
]
```

The persistent journey rail advances with the active scene or beat. Beats are storyboard and renderer
cues, not a replacement for a dedicated scene component: topic-specific scenes should use their
`visualState`/`focus` values to animate the physical object and data display together. See
[the seat-booking demo](videos/seat-booking-demo.json) for a complete example.

### 8.4 Manim templates (inside a `manim` scene)

**Equations** (needs LaTeX). LaTeX lines that morph into each other. Max 3 lines.
```json
"manim": {"template": "Equations", "lines": ["a^2 + b^2 = c^2", "c = \\sqrt{a^2 + b^2}"]}
```
IMPORTANT: in JSON every LaTeX backslash must be written twice (`\\frac`, `\\sqrt`).
A single backslash silently corrupts some commands (`\frac`, `\times`, `\beta`, `\neq`);
the validator detects this.

**Graph** (no LaTeX). A function drawn on axes with a moving dot.
```json
"manim": {"template": "Graph", "fn": "np.sin(x)", "x_range": [-6, 6, 2], "y_range": [-2, 2, 1]}
```
`fn` is a Python expression in `x` (use `np.sin(x)`, `x**2`, `np.exp(x)`, `np.log(x)`).
Ranges are `[min, max, step]`.

**Flow** (no LaTeX). Boxes with arrows: processes, cycles, steps, timelines.
```json
"manim": {"template": "Flow", "items": ["Sunlight", "Leaf", "Sugar"]}
```
Max 5 items, max 3 words each. Vertical video stacks them top to bottom; landscape lays them left to right.

**Custom**: your own scene, see [section 13](#13-write-your-own-manim-animation).

### 8.5 Complete example

```json
{
  "id": "pythagoras",
  "format": "vertical",
  "accent": "#FFC857",
  "music": null,
  "scenes": [
    {"type": "hook", "text": "The equation behind every bridge",
     "narration": "This one equation built every bridge you have ever crossed."},
    {"type": "manim", "title": "Pythagorean theorem",
     "narration": "In a right triangle, the squares of the two short sides add up to the square of the longest side. Take the square root, and you can find any missing length.",
     "manim": {"template": "Equations", "lines": ["a^2 + b^2 = c^2", "c = \\sqrt{a^2 + b^2}"]}},
    {"type": "bullets", "title": "Used in", "items": ["Construction", "GPS and maps", "Video games"],
     "narration": "Builders use it to keep walls square. Your phone uses it to compute distance. Games use it to move characters."},
    {"type": "stat", "value": "2,500+", "label": "years old",
     "narration": "People have known this for over two and a half thousand years."},
    {"type": "outro", "text": "Follow for more",
     "narration": "Follow for one new idea every day."}
  ]
}
```

### 8.6 Writing good narration
- Write for the ear: short sentences, no symbols (`=`, `%`, `( )`), no abbreviations.
- Write numbers as spoken ("two and a half thousand").
- 15 to 45 words per scene, one idea per scene.
- First sentence of the video must hook (a surprising question or claim).
- Describe what is on screen at that moment.

---

## 9. Using another AI to write your scripts

You can have any chat AI (ChatGPT, Gemini, Claude, a local model...) write the script JSON.
Your pipeline only needs that JSON. This section explains what to tell the AI, what format
to demand, and how to fix mistakes. Everything is ready in the `prompts/` folder.

### 9.1 The 5-Step Storytelling Formula (Day-to-Day Hindi)

For high-impact AI, Machine Learning, and System Design shorts, use our conversational Hindi formula:

```
HOOK ──► PROBLEM ──► CURIOSITY ──► EXPLANATION (Daily Life Analogy) ──► PAYOFF
```

Before writing any script, answer these 5 questions:
1. **Hook**: ऐसा क्या बोलूँ कि दर्शक तुरंत रुक जाए? *(Scene 1: hook)*
2. **Problem**: दर्शक को किस समस्या की अहमियत समझनी चाहिए? *(Scene 2: stat / bullets)*
3. **Curiosity**: ऐसा कौन-सा सवाल है जिसका जवाब वह जानना चाहेगा? *(Scene 3: compare / bullets)*
4. **Explanation**: मैं इसे किसी रोज़मर्रा के उदाहरण से कैसे समझा सकता हूँ? *(Scene 4-5: manim / flow)*
5. **Payoff**: वीडियो खत्म होने तक दर्शक क्या नया समझ चुका होगा? *(Scene 6: outro)*

See [`prompts/hindi_script_framework.md`](prompts/hindi_script_framework.md) for full guidelines, analogy cheat sheets, viewer question-to-visual progression models, and examples.

> ⏱️ **Duration**: Videos can be up to **3 minutes (180 seconds)** (maximum standard for Shorts/Reels). Use 45–75 seconds for quick concepts, or up to 3 minutes for comprehensive multi-stage deep-dives.
>
> 🎬 **Cinematic Motion Standard**: Every video blends **3Blue1Brown-style mathematical storytelling**, high-end motion design, and modern tech-documentary visuals. Avoid static slides; maintain continuous visual progression with Manim code-driven animations, data-flow pipelines, kinetic typography, and dramatic visual reveals synchronized with voice narration.

### 9.2 What the AI needs to know

Give the AI **two things**: your **brief** (changes every video) and the **format rules**
(never changes). The file `prompts/script.md` contains the scriptwriting rules, phonetic glossary,
and analogy references.

| Brief field | What to write | Why the AI needs it |
|---|---|---|
| TOPIC | One sentence: what the viewer learns | Focus |
| KEY POINTS | 3-5 points, or "your choice" | Controls content |
| EVERYDAY ANALOGY | Daily life analogy (e.g. traffic police, bank token counter, kitchen) | Makes it relatable |
| AUDIENCE | Who watches, level, age | Vocabulary and depth |
| LENGTH | 45 seconds up to 3 minutes (180s) | Sets scene count and word budget |
| TONE | Day-to-day Hindi (Hinglish), conversational, friendly | Voice of narration |
| LANGUAGE | Day-to-day Hindi (tech terms in English) | Narration and text |
| FORMAT | `vertical` (default) or `landscape` | Sets the video size |
| **TTS NOTES** | Voice 'rajan story teller' on VoiceStudio | Audio that sounds right |
| LATEX AVAILABLE | yes or no | If no, avoids Equations template |
| CALL TO ACTION | e.g. "Follow for more system design tips" | Last scene |
| AVOID | Robotic Sanskritized Hindi, boring textbook definitions | Brand & retention |

### 9.3 Step by step

1. Review `prompts/script.md` for narration guidelines, phonetic spellings, and analogies.
2. Draft the narration script and save it as `episodes/<id>/script.md`.
3. Use `prompts/storyboard.md` to compile the approved script into `episodes/<id>/storyboard.json`.
4. Run `python validate.py episodes/<id>/storyboard.json` to verify the schema.
5. If there are errors, open `prompts/fix_errors.md` to triage and fix issues.
6. Verify narration facts, especially technical numbers and acronyms.
7. Continue with Step 4 of [section 7](#7-make-a-real-video-the-full-routine).

Example of a filled-in brief:
```
TOPIC: How a Load Balancer works in System Design
KEY POINTS: Single server crash risk, traffic distribution, zero downtime
EVERYDAY ANALOGY: Smart traffic police distributing vehicles to empty lanes
AUDIENCE: software engineers, CS students, tech enthusiasts
LENGTH: 60 seconds
TONE: Day-to-day conversational Hindi (बोलचाल की हिंदी / Hinglish)
LANGUAGE: Day-to-day Hindi (tech terms like Server, Traffic, Latency in English)
FORMAT: vertical
TTS NOTES: Voice 'rajan story teller' on VoiceStudio; short sentences under 18 words; commas for short pauses; numbers spelled naturally (दस लाख)
LATEX AVAILABLE: yes
CALL TO ACTION: Follow for more system design breakdowns
AVOID: Robotic definitions, formal textbook Hindi
```

### 9.3 Telling the AI about YOUR text-to-speech model (TTS NOTES)

Your pipeline joins the scenes' `narration` text into one script for your TTS model. The AI cannot hear your model, so describe its habits in one line. Check these once by
trying your model on a few test sentences, then reuse the same line for every video:

| Test your model on... | If it fails, add this to TTS NOTES |
|---|---|
| "In 1984, 25% of people" | "spell out numbers, years and percent" |
| "DNA, NASA, CPU" | "letter acronyms are spaced like D N A; NASA stays a word" |
| A comma, a full stop, a blank line | "commas give short pauses, full stops medium pauses, blank lines a long pause" |
| "[pause]" or SSML tags | "tags/SSML supported: <the syntax>" or "no tags, plain text only" |
| A very long sentence | "max 20 words per sentence" |
| Words in another language | "name the language of the voice; avoid foreign words" |
| Hard names (Euler, quinoa) | "respell hard words phonetically in the narration" |

How your pipeline treats narration (so you understand the AI rules):
- Narration is **never shown** on screen. It exists only to become audio.
- All narrations are joined into **one script** (a paragraph per scene, blank line between) that your
  TTS reads in one run, producing **one audio file**. So every scene must have narration, and each narration
  must be a complete passage that starts and ends on a sentence boundary, ending at a natural pause point.
- The pipeline finds each scene's start from the pauses between paragraphs, so tell the AI how your TTS
  pauses (for example "blank lines give a long pause").
- On-screen text (hook text, titles, bullets, stat labels) is separate from narration, so it can
  keep normal spelling and digits while the narration is spelled out for speech.

The validator also warns about narration that commonly breaks TTS: digits, ALL-CAPS abbreviations,
symbols such as `= + % ( )`, and markup or URLs.

### 9.4 The exact output format you must demand

The AI must return a single JSON object, nothing else. The prompt already demands this.
Structure:

```json
{
  "id": "how-vaccines-work",
  "format": "vertical",
  "accent": "#FFC857",
  "music": null,
  "meta": {
    "title": "upload title (max 100 characters)",
    "description": "2-3 sentences",
    "hashtags": ["science", "health"],
    "facts_to_verify": ["claims a human should double-check"]
  },
  "scenes": [
    {"type": "hook", "text": "...", "narration": "..."},
    {"type": "manim", "title": "...", "narration": "...", "manim": {"template": "Flow", "items": ["A", "B", "C"]}},
    {"type": "bullets", "title": "...", "items": ["...", "..."], "narration": "..."},
    {"type": "stat", "value": "...", "label": "...", "narration": "..."},
    {"type": "outro", "text": "...", "narration": "..."}
  ]
}
```

- `meta` is optional. When present, the pipeline writes `out/<id>-upload.txt` with your title,
  description, hashtags and the facts to verify, ready to copy when uploading. It is not shown in the video.
- Allowed scene types are listed in [section 8.2](#82-scene-types). Anything else is an error.
- Full field limits are in [section 8](#8-script-json-reference).

### 9.5 Common mistakes AIs make (and the fix)

| Mistake | What the validator says | What to tell the AI |
|---|---|---|
| Wrapped in ``` or added explanation text | `json: ... Extra data` or `Expecting value` | "Output only the JSON object." (or delete the extra text yourself) |
| Trailing comma | `Expecting property name` | Paste the error into `prompts/fix_errors.md` |
| LaTeX with single backslash | `contains \f / a tab ...` or `Invalid \escape` | "Write every LaTeX backslash twice" |
| Too long | `exceeds the 180-second limit (cut about N words)` | "Cut about N words" |
| Equation fails (no LaTeX installed) | (Manim error at render) | "Use Flow or Graph instead of Equations" |
| Numbers/abbreviations in narration | warnings about digits / ALL-CAPS | "Spell numbers out; space letter acronyms" |
| Same scene type repeated | warning | "Vary scene types" |
| A scene with no narration | `no narration. With one narration file ... every scene needs narration` | "Every scene must have narration" |
| Made-up statistic | (nothing: only you can check) | Verify every item in `facts_to_verify` |

### 9.6 Getting topic ideas first

Open `prompts/topic_ideas.md`, fill in the three lines, and send it. You get 10 ideas with hooks and
the best visual for each. Pick one and put it in the TOPIC field of `prompts/script.md`.
To make many videos: pick several ideas and run the script prompt once per idea (see
[section 11](#11-make-many-videos-batch)).

### 9.7 Tips for better scripts

- Paste real notes into FACTS / SOURCE MATERIAL for specialized topics: the AI then stays accurate.
- To copy a style, add at the end of your brief: `STYLE SAMPLE: <paste 3-4 sentences you like>`.
- For a series, keep the same TONE, TTS NOTES, CALL TO ACTION and accent color every time.
- If a video feels flat, ask: "Make the hook more surprising and add one more animated scene."
- Always listen to the generated audio once. Fix any mispronounced word by respelling it in the
  narration (not on-screen text), then regenerate only that scene's audio.

---

## 10. Vertical vs landscape, and length rules

| | vertical (default) | landscape |
|---|---|---|
| Size | 1080x1920 (9:16) | 1920x1080 (16:9) |
| Best for | Reels, Shorts, TikTok | normal YouTube videos |
| Set with | nothing, or `"format": "vertical"` | `"format": "landscape"` |

- **Shorts / Reels** must be vertical and **3 minutes or less**.
- Hard limit **3 minutes / 180 seconds** for all outputs. The validator estimates length from word count
  (about 2.5 words per second); the pipeline re-checks the final audio and scene padding before rendering.
- Guide: 1 min is roughly 140-150 spoken words; keep scripts shorter than the theoretical maximum to leave room for pauses and scene transitions.
- **Resolution:** 1080p (full HD) by default, encoded at high quality (CRF 18, 95% frame quality).
  For double resolution add `--scale 2` (vertical becomes 2160x3840, landscape 3840x2160):
  `python pipeline.py videos/<id>.json --scale 2`. This takes roughly 3-4 times longer to render, and the Manim
  scenes render at the higher size too. Social apps usually re-compress to 1080p, so use it mainly for archiving or
  large screens.
- Vertical videos keep important content out of the bottom area where the Shorts/Reels buttons and
  title appear.
- Long videos take a while to render: see [10.1 Rendering time](#101-rendering-time).

### 10.1 Rendering time

These are **estimates, not measurements**. The time depends mostly on how many CPU cores you have.
Measure your own computer with the test below before planning a batch.

Rough total time for a **3-minute vertical video at 1080p**:

| Your computer | Estimated total time |
|---|---|
| 2 to 4 cores (older laptop) | 45 to 90 minutes |
| 6 to 8 cores (typical laptop) | 15 to 30 minutes |
| 12+ cores (fast desktop) | 8 to 15 minutes |

A 3-minute video takes about 60% of these times, a 1-minute video about 20%.

Where the time goes:
1. **Remotion final render (the biggest part).** 3 minutes at 30 fps is 5,400 frames, and every frame has several
   costly effects (film grain, color grade, floating particles, blur-in text).
2. **Manim animations.** They render first, one clip per `manim` scene (roughly 1 to 2 minutes each).
   The first `Equations` scene is slower because LaTeX has to compile.
3. **Small steps** (measuring audio, encoding) take about a minute or less.

Things that make it slower:
- `--scale 2` (double resolution): roughly 3 to 4 times slower.
- **Every run re-renders everything**, including the Manim clips, so each fix costs about the same as the first run.
  Even `--no-render` still renders the Manim clips.
- Very long or very busy videos need more memory.

**Measure your computer (about 2 minutes):** after `python pipeline.py videos/<id>.json --no-render`, render only
the first 10 seconds:
```
npx remotion render src/index.ts Video out/test.mp4 --props=public/<id>/manifest.json --frames=0-299
```
Multiply the time it takes by 30 to estimate the full Remotion render. Remotion also prints its speed while rendering.

How to make it faster:
- **Use more CPU threads:** in `pipeline.py`, find the `cmd = [npx, "remotion", "render", ...]` list and add
  `"--concurrency=6"` to it (use your number of CPU cores minus 1 or 2). Close other programs while rendering.
- **Remove the film grain** (probably the most expensive effect): in `src/Cinematic.tsx`, delete the `<svg>...</svg>` block
  inside `Finish`.
- **Fewer particles:** in `src/Cinematic.tsx`, lower `const N = 12;` to `6` (or `0` for none).
- **Shorter videos:** under 3 minutes also qualify as Shorts/Reels.
- **Preview in Remotion Studio** (section 7, Step 6) to check layout and timing instead of doing full renders.

---

## 11. Make many videos (batch)

1. Create all your scripts: `videos/a.json`, `videos/b.json`, ...
2. Export text for all: `python pipeline.py videos/*.json --export-text`
3. Create audio for all of them (manual or via `tts.py`).
4. Render all: `python pipeline.py videos/*.json`

Each finished video appears in `out/`. If one script has errors, nothing renders until
you fix it (the validator checks all files first).

---

## 12. Change the look

The default editorial treatment uses stable framing and a subtle blueprint grid. Set top-level
`"art_direction": "cinematic"` to opt into global camera drift, floating particles, light sweeps,
teal/orange grade, vignette, and film grain.

- **Accent color** for one video: `"accent": "#4C6FFF"` in the JSON.
- **Font:** install the free **Inter** font on your computer (https://rsms.me/inter/) for the best result.
  Without it the video falls back to Segoe UI / Helvetica / Arial. To use another installed font, edit `FONT`
  in `src/theme.ts`. (Web fonts via `@remotion/google-fonts` also work but need internet at render time.)
- **Colors for all videos:** `src/theme.ts` (`BG`, `FG`, `MUTED`, card colors).
- **Strength of cinematic effects:** `src/Cinematic.tsx` (bokeh count `N`, light sweep, grade colors, vignette strength,
  grain `opacity`) and `src/Video.tsx` (camera drift amounts). Choose `"editorial"` instead of editing effects out.
- **Scene designs:** `src/scenes/` (Hook, Bullets, Stat, Outro, ManimClip, ImageScene, Quote, Compare).
- **Title animation:** `src/Reveal.tsx` (`stagger` = frames between words).
- **Layout margins** for vertical/landscape: `src/layout.ts`.
- **Background music:** put an mp3 in the project folder, set `"music": "bg.mp3"`. Plays at 8% volume.
  Use only music you have the rights to use.
After any change, preview with `npx remotion studio` (section 7, Step 6).

Note: Manim scenes have their own background treatment; the global cinematic effects may not show behind Manim.

---

## 13. Write your own Manim animation

1. Open `manim_templates/my_scenes.py` and add a class (copy `MyScene`).
2. Pace the animation with `DUR` (target seconds), so it fits the narration:
   `self.play(..., run_time=DUR * 0.4)`.
3. `LAND` is `True` for landscape videos. The frame is 4.5 units wide x 8 tall (vertical)
   or about 14.2 x 8 (landscape). Keep content inside those bounds, and leave
   room at the top for the scene title.
4. Use it in a script:
   ```json
   {"type": "manim", "title": "My animation", "narration": "...",
    "manim": {"file": "manim_templates/my_scenes.py", "template": "MyScene"}}
   ```
   Any extra keys in the `manim` object are available in your class as `P["key"]`.
5. Test a scene quickly by itself:
   `manim render -r 1080,1920 manim_templates/my_scenes.py MyScene`

---

## 14. Troubleshooting

| Problem | Cause and fix |
|---|---|
| `python` not found | Use `python3`, or reinstall Python and tick "Add to PATH". |
| `ffprobe` / `ffmpeg` not found | Install FFmpeg (3.3) and reopen the terminal. |
| `ERROR json: ... Expecting property name` | Trailing comma before `}` or `]` in your JSON. |
| `ERROR json: ... Invalid \escape` | Single backslash in LaTeX. Write `\\` (two). |
| `ERROR ... contains \f / a tab ...` | Same issue: LaTeX like `\frac` needs `\\frac`. |
| `Missing narration audio` | Save ONE file as `audio/<id>/narration.wav`, or implement `synthesize_all` in `tts.py`. |
| `Missing audio for scene N` | (`"audio_mode": "scenes"`) File not named `sN.wav` in `audio/<id>/` (N starts at 1). |
| `Could not find the N scene boundaries` | Pauses between scenes are too short. Add a longer pause at blank lines (`--separator`), install `faster-whisper`, or write `timings.txt` (6.3). |
| `Found only X pauses, need N` | Same as above; or lower `--silence-min` / raise `--silence-db` (for example `-40`). |
| WARNING: boundaries are uncertain / a scene is only 1.0 s | Pause detection guessed. Check the printed times; fix with `timings.txt`. |
| Scene changes slightly before/after the words | Edit `timings.txt` (move that start a few tenths of a second). |
| `image file not found` | The path in the script must exist inside the project, e.g. `images/photo.jpg`. |
| Image looks blurry | Use a larger picture (at least 1080 px on the short side). |
| Text looks different from the previews | Install the Inter font (section 12). |
| `no narration. With one narration file ...` | Every scene needs narration in single mode, or set `"audio_mode": "scenes"`. |
| `over the 180-second limit` | Cut narration (the message says about how many words), or speed up the audio. |
| Manim: `latex ... not found` | LaTeX is not installed (3.4). Install it, or use Graph/Flow. |
| Manim: Cairo/Pango errors | Install the system libraries (3.5). |
| `No module named manim` | The venv is not active. Activate it (section 4, step 4). |
| `npx` / `remotion` not found | Run `npm install` in the project folder. |
| Remotion cannot download Chrome | Needs internet on first render; check your connection or proxy. |
| Render is very slow / out of memory | See [10.1 Rendering time](#101-rendering-time): close other programs, set `--concurrency`, remove grain, fewer particles. |
| Text cut off at the edges | Shorten on-screen text; the validator warnings show which. |
| Voice and visuals out of sync | Make sure each `sN.wav` matches that scene's narration, then re-run. |
| Wrong voice for one scene | Replace that `sN.wav` and re-run. |
| Equation does not look right | Check LaTeX syntax; keep lines short; max 3 lines. |
| Nothing in `out/` | Read the last error in the terminal; run `python validate.py videos/<id>.json`. |

---

## 15. Legacy command cheat sheet (`videos/` workflow)

```
python validate.py videos/x.json                 check a script
python pipeline.py videos/x.json --export-text   write narration_text.txt for your TTS
python make_test_audio.py videos/x.json          placeholder audio (testing only)
python pipeline.py videos/x.json --align whisper use speech recognition to find scene starts
python pipeline.py videos/x.json --export-text --separator "<pause tag>"   pause marker between scenes
python pipeline.py videos/x.json                 build out/x.mp4
python pipeline.py videos/x.json --no-render     prepare only (for preview)
npx remotion studio src/index.ts --props=public/x/manifest.json   preview in browser
python pipeline.py videos/x.json --scale 2       double resolution (slower)
npx remotion render src/index.ts Video out/test.mp4 --props=public/x/manifest.json --frames=0-299   time a 10-second test render
python pipeline.py videos/*.json                 batch
python pipeline.py videos/x.json --skip-validate skip the checker (not recommended)
```

---

## 16. Pre-upload checklist

- [ ] Hook in the first 2 seconds is a surprising question or claim
- [ ] Length is correct for where you upload (3 min or less for Shorts/Reels)
- [ ] Voice is clear, same volume in every scene, no mispronounced words
- [ ] Every scene's visual matches what is being said
- [ ] No text is cut off at the screen edges
- [ ] Facts and numbers are correct; quotes and their authors are verified
- [ ] You have the rights to every image and music track used
- [ ] Music (if any) is something you have the right to use
- [ ] Title, description and hashtags prepared

---

## 17. Ollama Cloud chat

The optional `ollama_server.py` route adds Ollama Cloud chat without replacing any existing
video-generation features. It calls `gemma4:31b` from server-side Python and binds only to
`127.0.0.1`; the API key is never sent to browser code. The route is
`POST http://127.0.0.1:8765/api/ollama/chat`, accepting JSON such as:

```json
{"messages":[{"role":"user","content":"Explain backpropagation in one sentence."}]}
```

Create an API key at https://ollama.com/settings/keys and put it in the root `.env` file, after
`OLLAMA_API_KEY=`. The `.env` file is ignored by Git. Do not put the key in source files or share
it in chat.

Install the Python dependencies and start the local route:

```sh
python -m pip install -r requirements.txt
python ollama_server.py
```

In another terminal, make a test request through the app route:

```sh
python scripts/test_ollama.py
```

The test script prints Ollama's actual reply. Stop the server with Ctrl+C when finished. The route
validates message roles and text, disables streaming, and returns Ollama API errors with their
status codes.
