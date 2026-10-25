# Educational Video Production Pipeline: Stage-by-Stage Integration Architecture

This document maps possible capabilities to production stages; it does not guarantee that every provider, package, credential, or CLI is installed or available in a given checkout. Before using an option, verify its implementation, dependencies, credentials, and command help. Select only resources that improve the current video; do not force every tool or skill into every episode. Remotion's registered scene types and the episode pipeline remain the supported final assembly path.

"Agent-accessible" means every tool has a CLI, Python/JS library, REST API, or MCP server, enabling an AI agent to execute it without UI clicks.

---

## 🗺️ Pipeline Stage Mapping Overview

| Stage | Name | Role & Responsibility | Integrated Tools & Providers |
| :--- | :--- | :--- | :--- |
| **Stage 0** | **Research & Orchestration** | Deep technical research, multi-agent coordination, topic briefing, script compilation | Claude Code, Codex, Antigravity, LangChain / LangGraph concepts, MoneyPrinter patterns, MCP Servers |
| **Stage 1** | **Asset Acquisition & Licensing** | Stock footage, public domain archives, photography, vector icons, AI image generation, automated license ledger | NASA Media API, Openverse API, Art Institute of Chicago, Wikimedia Commons, Pexels, Pixabay, Internet Archive, Pollinations.ai, Iconify, Lucide, Freesound |
| **Stage 2** | **Diagrams & Motion Graphics** | Technical flowcharts, sequence diagrams, state machines, math formulas | Mermaid (mermaid.ink / mmdc), Graphviz (`dot`), Excalidraw, ManimCE (Python math), Remotion Lottie (`@remotion/lottie`) |
| **Stage 3** | **Headless Web Animation** | Procedural Canvas, generative visuals, force graphs, physics simulations | Playwright + Chromium, FFmpeg, p5.js, D3.js, Three.js, GSAP, anime.js |
| **Stage 4** | **3D & CAD Modeling** | Headless 3D rendering, mesh optimization, model format conversion | Three.js WebGL shaders, Blender + `bpy` headless, Poly Haven, ambientCG, Kenney 3D, Khronos glTF |
| **Stage 5** | **Audio Cadence & Speech** | Voiceover synthesis, non-destructive silence detection, subtitle alignment | VoiceStudio (`rajan story teller`), faster-whisper forced alignment, FFmpeg `silencedetect` |
| **Stage 6** | **Assembly & Compositing** | Code-driven video timeline composition, animations, effects, layout | Remotion (React), MoviePy, FFmpeg, Editly patterns |
| **Stage 7** | **QA & Multi-Platform Delivery** | Automated render verification, black frame detection, LUFS loudness, attribution generation | `tools/qa_suite.py`, `tools/verify_render.py`, `tools/contact_sheet.py`, YouTube API |

---

## 🛠️ Stage-by-Stage Implementation & Tool Directives

### Stage 0: Research, Orchestration & Multi-Agent Coordination
- **Role**: Discovers topics, gathers 2026 ground-truth technical specifications, verifies architecture flows, and coordinates agents.
- **Tools**:
  - **Claude Code**: Terminal CLI orchestrator executing tests and compiling storyboards.
  - **Antigravity**: Visual lead designing Three.js scenes, Remotion components, and Manim templates.
  - **Codex**: Non-interactive code reviewer running via `codex exec`.
  - **MCP Servers** (`.agents/mcp_servers.json`): Direct tool execution for FFmpeg, Blender, Pexels, and Excalidraw.
  - **Orchestration Patterns (MoneyPrinterTurbo / ShortGPT)**: Structured linear handoffs (`brief.yaml` ➔ `script.md` ➔ `storyboard.json` ➔ `final.mp4`).

---

### Stage 1: Asset Acquisition, Stock Media & GenAI Ingestion
- **Role**: Automatically fetches photos, footage, vector art, and 3D models per scene, enforcing licensing compliance.
- **CLI Entrypoint**: `python3 tools/asset_finder.py` (or `npm run asset`)
- **Supported Providers**:
  1. **Stock Footage & Video B-Roll**:
     - **NASA Image and Video Library** (`search_nasa_videos`): 100% free, NASA Public Domain. Space, physics, satellites, telemetry.
     - **Internet Archive** (`search_archive_videos`): Public domain films (Prelinger Archives), retro computing, historic tech.
     - **Pexels Video API** (`search_pexels_videos`): HD stock clips (`PEXELS_API_KEY`).
     - **Pixabay Video API** (`search_pixabay_videos`): HD clips (`PIXABAY_API_KEY`).
     - **Wikimedia Commons Video** (`search_wikimedia_videos`): Open educational videos, CC-BY / Public Domain.
  2. **Images & Public Domain Art**:
     - **Openverse API** (`search_openverse_images`): 600M+ Creative Commons indexed images with exact CC license tags and creator attribution.
     - **NASA Image Library** (`search_nasa_images`): Public domain space and aeronautics.
     - **Art Institute of Chicago Museum API** (`search_museum_images`): High-res IIIF public-domain CC0 historical artifacts.
     - **Wikimedia Commons** (`search_wikimedia_images`): CC/Public domain encyclopedic imagery.
     - **Pexels & Pixabay & Unsplash**: Commercial-free photography.
  3. **Zero-Config Generative AI Imagery**:
     - **Pollinations.ai** (`generate_pollinations_image`): Instant generative AI fallback via REST URL (`https://image.pollinations.ai/prompt/...`), zero API key, free for commercial use. Ideal when no stock photo exists for a specific technical concept.
     - Command: `python3 tools/asset_finder.py generate "cross section of jet turbine engine" --topic jet-engines`
  4. **Vector Icons & Graphics**:
     - **Iconify API** (`search_icon`): Fetches clean SVGs across Lucide, Material Design, Simple Icons, and Tabler.
     - Command: `python3 tools/asset_finder.py icon cpu --color "#00F0FF"`
  5. **Automated License Ledger**:
     - Every downloaded asset is cataloged in `episodes/<id>/attributions.json`.
     - Automatically generates `episodes/<id>/ATTRIBUTIONS.md` formatted with a ready-to-paste YouTube Description attribution block!

---

### Stage 2: Diagramming, Vector Motion & Mathematical Graphics
- **Role**: Explains software architecture, protocols, data flows, and math equations without static text cards.
- **CLI Entrypoint**: `python3 tools/diagram_renderer.py` (or `npm run diagram`)
- **Integrated Engines**:
  1. **Mermaid Engine**:
     - Renders flowcharts, sequence diagrams, git graphs, and state machines to crisp SVGs.
     - Uses local `mmdc` if installed; falls back to `mermaid.ink` REST API with zero system dependencies.
     - Formats SVGs automatically with the dark cyberpunk edu-shorts palette (`#0B1020` background, `#00F0FF` connectors).
  2. **Graphviz (DOT) Engine**:
     - Renders directed graphs and finite automata via `dot` or Kroki API.
  3. **Manim / ManimCE**:
     - Programmatic mathematical animation engine in Python.
     - Rendered via `pipeline.py` into native MP4 clips embedded in Remotion `<ManimClip />`.
  4. **Remotion Diagram Component (`src/scenes/DiagramScene.tsx`)**:
     - Native scene type `"diagram"` in `storyboard.json`:
       ```json
       {
         "type": "diagram",
         "tag": "03 / SYSTEM TOPOLOGY",
         "title": "DISTRIBUTED CONSENSUS FLOW",
         "mermaid": "graph LR; Client-->Gateway; Gateway-->Node1; Gateway-->Node2;",
         "narration": "..."
       }
       ```
     - Features kinetic camera zoom and a glowing laser scanline that sweeps across the diagram.

---

### Stage 3: Headless Web Animation (Playwright + FFmpeg)
- **Role**: Records standalone HTML5, Canvas, p5.js, D3.js, GSAP, and anime.js visualizations into broadcast MP4 video clips. HyperFrames may be used by an agent as an optional HTML-first authoring/rendering workflow; it is an asset producer, not a replacement for the edu-shorts compositor.
- **CLI Entrypoint**: `python3 tools/html_recorder.py` (or `npm run record-html`)
- **How it works**:
  - Playwright Chromium runs headless at 1080x1920 or 1920x1080.
  - Video stream is captured directly using Playwright's recording context.
  - FFmpeg normalizes the stream to H.264, yuv420p, 30/60 FPS, with zero audio desync.
  - Scaffold pre-built templates:
    `python3 tools/html_recorder.py template p5 --out anim.html`
    `python3 tools/html_recorder.py template d3 --out force.html`
  - Record to clip:
    `python3 tools/html_recorder.py record anim.html --duration 6.0 --out clip.mp4`
  - Import a HyperFrames export as a silent, episode-local scene asset:
    `python3 tools/html_recorder.py import-video /path/to/export.mp4 --episode <id> --name scene-03`
    The command reads the episode format, normalizes to H.264/yuv420p at 30 FPS, strips audio, and
    writes to `episodes/<id>/media/`. Reference that file from a storyboard `"type": "video"` scene.

---

### Stage 4: 3D & CAD Modeling (Three.js & Headless Blender)
- **Role**: Renders physical objects, electronics, devices, and spatial mechanisms.
- **Engines**:
  1. **Three.js & WebGL**: Primary in-engine 3D renderer running in Remotion with 50+ procedural variants (`upi_hook_3d`, `server_rack_3d`, `bank_vault_3d`, `globe_network_3d`, `neural_network_3d`, `gps_trilateration_3d`, `bluetooth_spectrum_3d`).
  2. **3D Model Repositories**:
     - Poly Haven & ambientCG (CC0 textures, HDRIs, and models).
     - Kenney & OpenGameArt (CC0 tech assets).
     - Curated tech models via `python3 tools/model_manager.py get <smartphone|server_rack|shipping_container|credit_card|laptop> --topic <id>`.
  3. **Blender 5.x Engine & MCP Runner Bridge** (`tools/blender_render.py`):
     - **Dual Execution**: Live interactive socket (`localhost:9876` via Blender MCP Runner / Addon) for real-time viewport manipulation, plus automated headless CLI fallback (`blender -b`).
     - **CAD & Mesh Converter**: Auto-converts CAD formats (.obj, .fbx, .stl, .dae, .blend) to centered, normalized, binary `.glb` for Three.js:
       `python3 tools/blender_render.py convert model.obj --out episodes/<topic>/media/model.glb`
       `python3 tools/model_manager.py convert model.fbx --topic <id>`
     - **Photorealistic Video Rendering**: Headless/live rendering of `.blend` scene files to 1080x1920 MP4 video B-roll via Cycles / EEVEE Next:
       `python3 tools/blender_render.py render scene.blend --out episodes/<topic>/media/clip.mp4 --start 1 --end 90`
     - **Live Viewport Inspection & Screenshot**:
       `python3 tools/blender_render.py screenshot --out episodes/<topic>/media/viewport.png`
     - **Stdio MCP Server**: Registered in `.agents/mcp_servers.json` (`python3 tools/blender_render.py --mcp`) for direct AI agent tool calling (`blender_status`, `blender_execute_python`, `blender_convert_model`, `blender_render_animation`).

---

### Stage 5: Audio Cadence & Voice Processing
- **Role**: Generates day-to-day conversational Hindi narration with VoiceStudio (`rajan story teller` profile) and tight cadence.
- **Cadence Rules**:
  - Non-destructive speech end measurement via `ffmpeg silencedetect` (`measure_speech_end`).
  - Voice audio files are never lossy re-encoded or trimmed destructively.
  - Padding set to `0.05s–0.28s`, eliminating dead silence at the end of clips.
  - Word-level timestamps generated via `faster-whisper` forced alignment for kinetic karaoke captions.

---

### Stage 6: Code-Driven Assembly & Low-Level Video Editing
- **Primary Compositor**: **Remotion** (React / TypeScript).
  - Component-driven visual system with 24 scene types.
  - Renders to MP4 via Chromium WebGL hardware acceleration (`npx remotion render`).
  - Remotion remains the canonical episode compositor. HyperFrames-authored clips enter as
    episode-local video scene assets; edu-shorts owns narration timing, captions, final audio mix,
    and delivery QA.
- **Low-Level Editing Suite (`tools/video_editor.py`)**:
  - **16:9 to 9:16 Verticalize**: Takes any landscape video and creates an Instagram/Shorts 9:16 video with a blurred background fill and sharp centered foreground.
    `python3 tools/video_editor.py verticalize landscape.mp4 --out vertical.mp4`
  - **Speed Ramping**: `python3 tools/video_editor.py speed clip.mp4 --factor 1.5 --out fast.mp4`
  - **Cinematic Grade & Vignette**: `python3 tools/video_editor.py grade clip.mp4 --out graded.mp4`
  - **Silence Trimming**: `python3 tools/video_editor.py trim-silence audio.mp3 --out tight.mp3`

---

### Stage 7: QA Verification & Multi-Platform Publishing
- **Automated Verification Suite** (`tools/qa_suite.py`):
  1. Duration budget verification (<= 180s).
  2. Resolution verification (1080x1920 vertical or 1920x1080 landscape).
  3. Audio loudness verification via FFmpeg EBU R128 (target: -16.0 LUFS ± 1.0).
  4. Black frame percentage verification (< 2.0%).
  5. Audio-video duration sync tolerance (< 0.5s).
  6. Visual contact sheet generation at 6-second intervals (`tools/contact_sheet.py`).
- **Publishing Kit**:
  - `post.md`: Title variations, SEO descriptions, hashtags, timestamps.
  - `ATTRIBUTIONS.md`: Automated licensing attribution block generated by `tools/asset_finder.py`.
  - YouTube upload via `python3 pipeline.py <spec> --upload private|unlisted|public`.

---

## 📜 Asset Licensing Best Practices for Agents

| License Type | Attribution Required? | Commercial Use? | Source Examples |
| :--- | :--- | :--- | :--- |
| **CC0 / Public Domain** | No (Courteous) | Yes | NASA Media API, Art Institute of Chicago, Met Museum, Poly Haven, Kenney, Pollinations.ai |
| **CC-BY 4.0 / 2.0** | Yes (Title, Author, License, Link) | Yes | Openverse, Wikimedia Commons, Freesound |
| **CC-BY-SA** | Yes (Same license required) | Yes | Wikimedia Commons |
| **Pexels / Pixabay License** | No (Courteous) | Yes | Pexels API, Pixabay API |
| **Unsplash License** | No (Courteous) | Yes | Unsplash API |

> **Automated Rule**: Every asset downloaded by `tools/asset_finder.py` automatically writes its attribution entry into `epributions/<id>/attributions.json` and updates `ATTRIBUTIONS.md`. Agents should always review `ATTRIBUTIONS.md` before initiating final YouTube uploads.
