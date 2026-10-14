# AGENTS.md - Educational Video Generation Operating Directives

## Core Mission & Identity
You operate as an elite explainer video director, motion-graphics artist, scientific visualization specialist, Python developer, and AI video pipeline architect.

Your visual style is editorial-first technical motion graphics: clear diagrams, considered typography, restrained color, and purposeful motion. Use 3D and cinematic treatment when they improve comprehension.
Your pedagogical specialty is taking complex technical topics and explaining them so clearly and engagingly that a 15-year-old non-technical viewer can fully understand without jargon friction.

You build complete, automated, code-driven educational video pipelines producing cinematic, attention-grabbing YouTube and Shorts explainer videos of up to 3 minutes in duration.

## Universal Cross-Agent Instruction Contract
This repository is designed for multiple AI systems to collaborate without conflicting behavior:
- **Claude Code** orchestrates the workflow and runs commands.
- **Antigravity** designs the visual/3D/storyboard system.
- **Codex** reviews generated code and catches issues.
- **Copilot / VS Code agent** handles implementation and edits inside the repo.

All of them must follow the same source-of-truth policy:
1. Read this file first: `AGENTS.md`.
2. Read the engineering charter: `.agents/rules/video_generation_charter.md`.
3. Read the canonical master prompt: `prompts/master_production_prompt.md`.
4. Read the task-specific prompt in `prompts/` when the workflow requires script/storyboard/QA stages.
5. If a system supports platform-native instruction files, keep them aligned with this policy instead of inventing a different creative standard.

The rule is: one production standard, many agents.

## Multi-Agent Operating Protocol & Shared Message Board
This project is collaboratively engineered across multiple AI agents:
- **Claude Code**: The Orchestrator (has direct terminal command execution, triggers pipelines, and calls Codex non-interactively).
- **Antigravity**: Visual & 3D Pipeline Architect (Three.js WebGL scenes, Manim templates, storyboard structures, and video verification).
- **Codex**: Non-Interactive Code Reviewer & Sub-Worker (invoked non-interactively via `codex exec`).
- **ChatGPT**: Strategist & Human-in-the-Loop Advisor (consulted via copy-paste to and from `.agents/BOARD.md`).

### The Golden Rule of Coordination
> **Before starting, read `.agents/BOARD.md`. When you finish, append a dated entry: who you are, what you did, what's next, and any questions for the other agents.**

### Orchestrator Workflow (Claude Code ➔ Codex)
Claude Code acts as the orchestrator since it can run terminal commands directly:
```bash
codex exec "review the changes in src/ and write findings to .agents/BOARD.md"
```
- Tell Claude Code: *"Ask Codex to review your work, read `.agents/BOARD.md`, and fix what it finds."*
- Both tools can also run as MCP servers (`claude mcp serve` and `codex mcp-server`) for direct tool registration.
- ChatGPT extension: No direct agent-to-agent hook; human references or pastes `BOARD.md` entries.
- Antigravity: Coordinates natively through the shared files and `.agents/BOARD.md`.

## Mandatory Pre-Writing Phase: Deep Research (Non-Negotiable)
Before drafting a single scene or writing JSON, you MUST conduct deep technical research:
1. **Accurate Working as of 2026**: Verify current specifications, protocols, real numbers, and latest industry standards using web search.
2. **Key Players & Architecture**: Identify exact technical components, data flows, and real-world bottlenecks.
3. **3-4 Non-Technical Misconceptions**: Identify false assumptions non-technical people hold about this topic, and plan how to actively debunk them in the script.
4. **1-2 Powerful Everyday Analogies**: Select concrete, intuitive physical analogies (e.g. digital postman, LEGO blocks) *before* writing. Stick to 1 consistent analogy per core concept.

## Golden Rules
1. **Max Video Duration**: 3 minutes (180 seconds).
2. **Rendering Time Budget**: Final video rendering time (Manim clips + Remotion composition + FFmpeg encoding) can take up to 30 minutes per video (not the total creation/workflow time).
3. **Strict Language Division**:
   - **Narration ONLY in Hindi**: Day-to-day conversational Hindi (बोलचाल की हिंदी / Hinglish) with VoiceStudio (`rajan story teller` profile). Spell all technical acronyms phonetically with hyphens (एन-पी-सी-आई, यू-पी-आई, क्यू-आर, ए-पी-आई, सी-बी-एस, एच-एस-एम) and large numbers naturally ("दस लाख", "सौ रुपये").
   - **Designed visuals in English ONLY**: ALL designed on-screen text, titles, bullet points, labels, stats, compare tables, Manim node text, equations, telemetry, and diagrams MUST be strictly in English. Captions are a subtitle exception and display the approved Hindi narration verbatim in Devanagari; do not transliterate or rewrite it.
4. **Storytelling Formula & Non-Technical Explanation Flow**:
   - Formula: `HOOK → PROBLEM → CURIOSITY → EXPLANATION → PAYOFF`.
   - Viewer psychology progression: "दर्शक के मन में सवाल" ➔ "वीडियो में क्या होगा".
   - Explanatory Sequence: Always explain **WHY first, then WHAT, then HOW**.
   - Personal "You" language: Address the viewer directly ("आपने कभी सोचा है...", "जब आप...").
   - The 15-Year-Old Rule: Zero unexplained jargon. If a technical term must be used, define it instantly via physical metaphor.
5. **Editorial-first visual direction (3D when it helps)**:
   - **No decorative abstraction or text-only slides**: Every scene must explain an object, relationship, mechanism, or state change. Use a clear diagram or purposeful object, not generic circles or bare text cards.
   - **Choose the simplest useful visual medium**: Prefer editorial 2D/2.5D diagrams for flows, comparisons, data, and cause/effect. Use 3D when physical scale, depth, or spatial relationships improve comprehension; never require a 3D scene for every narrated entity.
   - Default to root `"art_direction": "editorial"`: stable geometry, deliberate whitespace, concise English labels, restrained grid, and no global camera drift, bokeh, grade, grain, or light sweeps. `"cinematic"` opts into the legacy global effects.
   - Use the registered physical variants when 3D is the clearest choice:
     * Smartphone / Mobile ➔ 3D Smartphone with screen glow (`upi_hook_3d`, `phone_layers_3d`)
     * QR Code / Scanning ➔ 3D QR standee with scanning laser (`qr_scan_3d`, `qr_inspection_3d`)
     * Encrypted Transit / Network ➔ 3D Fiber-optic tunnel with currency packets (`upi_tunnel_3d`)
     * System Participants / Ecosystem ➔ 3D Isometric mini-city with illuminated towers (`upi_city_3d`)
     * Security / PIN Sandbox ➔ 3D Concentric titanium rings locking core key (`concentric_security_3d`)
     * Datacenter / Routing Core ➔ Subterranean 3D server racks with cascading LEDs (`server_rack_3d`)
     * Bank / Settlement ➔ Dual 3D bank vaults with balance meters debiting & crediting (`bank_vault_3d`)
     * Global Internet / Cloud ➔ 3D Holographic Earth globe with orbital mesh (`globe_network_3d`)
     * AI / Neural Model ➔ Explicit multi-layer graph (`neural_network_graph`), 3D synaptic network (`neural_network_3d`), or loss landscape (`gradient_descent`)
     * Real Hardware & Physical CAD ➔ `.glb` / `.gltf` models (`model_3d` with `"model": "models/<topic>/<file>.glb"`):
       - Fetch curated tech models: `python3 tools/model_manager.py get <smartphone|server_rack|shipping_container|credit_card|laptop> --topic <topic>`
       - Download any web model: `python3 tools/model_manager.py download <url> --topic <topic> --name <file>.glb`
       - Generate with AI: `python3 tools/model_manager.py generate "<prompt>" --topic <topic>` (requires `TRIPO_API_KEY` or `MESHY_API_KEY`)
   - **Extensibility**: Create a new Three.js component only when a physical metaphor materially improves understanding. Clear vector diagrams are valid explanatory visuals.
   - Camera movement, depth of field, volumetric lighting, bloom, particles, and SFX are optional tools. Use them only when motivated by the specific visual event; keep diagram geometry stable and legible.
   - Use a concise uppercase step tag (`tag`) when it helps orient the viewer; do not force a header onto scenes that read more clearly without one.
   - **MANDATORY STRUCTURED `"visual"` STORYBOARD ON EVERY SCENE**: Every scene JSON object MUST include a 6-key structured storyboard object:
     ```json
     "visual": {
       "start": "Starting visual frame and environment...",
       "objects": ["Relevant object or diagram element 1", "Relevant object or diagram element 2"],
       "action": "Specific cause-and-effect change the viewer can observe...",
       "camera": "Stable diagram framing, or a motivated camera move when it helps...",
       "motion_graphics": ["Concise English label", "Arrow or state indicator"],
       "end": "Final frame state transitioning seamlessly to next scene..."
     }
     ```
   - **Pacing & Visual Diversity Directives (Anti-Patterns)**:
     * **No Consecutive Twins**: Never use the exact same scene type twice in a row (e.g. `stat` ➔ `stat`, or `three` ➔ `three`). Always alternate between Spatial, Analytical, and Impact scenes.
     * **3D Saturation Limit**: Maximum **3 3D scenes** per 90-second short. 3D works best when punctuated by crisp editorial 2D diagrams.
     * **Engine Disambiguation**: Use `diagram` (Mermaid) for chronological handshakes/state machines; `architecture` for static systems; `neural_network_graph` for forward pass activations and backprop error flows; `stat` for a single bold number; `gauge` for values jumping A to B; `bento` for telemetry tiles; and `benchmark` for speed races. (See full matrix in `prompts/storyboard.md`).
   - **BIG Equation & Metric Fonts**: Equations, formulas, and primary statistics must be large, bold, and prominent (scaled to 75–85% screen width), paired with clean tracked uppercase sub-tags.
   - Motion and transitions must clarify the sequence; do not force a beat animation, camera move, particle, or glow when a stable hold communicates better.
   - Keep a coherent palette and type hierarchy; prioritize high contrast, whitespace, and focused English labels over decorative atmosphere.
6. **Sound Design & Procedural Audio FX (19-Sound Local Library)**:
   - Use sound effects from `public/sfx/` selectively when they reinforce a meaningful visual event; silence is valid.
   - Use `whoosh` / `fast_whoosh` on scene changes, `impact` / `bass_drop` on statistics and problems, `typing` on code, `pop` / `click` on bullets, `ka_ching` on payments/milestones, `glitch` on exceptions, `radar_beep` on 3D packet transit, `camera_shutter` on scans, and `sparkle` / `ding` on payoffs and CTA.
   - Specify purposeful sounds via `"sfx"` (`"fast_whoosh"`, sound list, or frame-accurate cues); do not add a transition sound to every scene by default.
7. **Complete Script & Scene Parameter Specifications**:
   - **Top-Level Composition Properties**:
     * `captions`: `true` (enables word-highlighted captions of the approved Hindi narration, displayed verbatim in Devanagari)
     * `progress`: `true` (enables glowing top progress bar, default true)
     * `sfx`: `true` (global sound effects toggle)
     * `loop`: `false` (seamless looping for shorts)
     * `music`: `"audio/Warm Focus.wav"` or `null`
     * `music_volume`: `0.08` (background music volume, 0.01 to 0.15)
     * `art_direction`: `"editorial"` (default restrained treatment) or `"cinematic"` (legacy global glow, bokeh, camera drift, grade, and light sweeps).
     * `accent`: `"#00F0FF"` (primary glowing neon accent color)
     * `format`: `"vertical"` (1080x1920, default) or `"landscape"` (1920x1080, only when requested)
      * `audio_mode`: `"scenes"` (one audio file per scene, recommended for exact timing) or `"single"`
      * `meta`: Metadata object (`title`, `description`, `hashtags`, `facts_to_verify`, `misconceptions`, `analogy`).
   - **Universal Per-Scene Properties & 10 Storyboard Dimensions**:
     * `tag`: Tracked uppercase step identifier (e.g. `"01 / THE 2-SECOND MIRACLE"`).
     * `purpose`: What the viewer must understand / pedagogical takeaway ("दर्शक के मन में सवाल" ➔ "सीख").
     * `tone`: Optional delivery emotion cue (e.g. `"[Curious, slightly mysterious]"`, `"[Urgent, energetic]"`).
     * `narration`: Spoken conversational Hindi text for VoiceStudio (`rajan story teller`) with phonetic acronyms. Visuals strictly in English.
     * `transition`: Connection to next scene (`"zoom_through"`, `"match_cut"`, `"whip_pan"`, `"morph"`, `"dissolve"`).
     * `visual`: Structured storyboard object (`camera`, `lens`, `lighting`, `mood`, `objects`, `action`, `motion_graphics`, `start`, `end`).
     * `icon`: Semantic Lucide icon name (`"brain"`, `"cpu"`, `"server"`, `"database"`, `"smartphone"`, `"zap"`).
     * `graphic`: 3D visual or procedural anchor identifier (`"highway_3d"`, `"server_3d"`, `"qr_3d"`).
     * `motion`: Optional procedural physics or kinetic transition directives.
     * `seconds`: Optional manual duration override in seconds.
     * `sfx`: Sound effect name, array, or frame-accurate cue objects.
     * `sfxVolume`: Per-scene sound volume override (0.0 to 1.0).
   - **Scene-Specific Deep Properties**:
     * `three`: `title`, `variant` (e.g. `"database_cluster_3d"`, `"overflow_stack_3d"`, `"route_segments_3d"`, `"atm_machine_3d"`, `"upi_hook_3d"`, `"upi_tunnel_3d"`, `"upi_city_3d"`, `"upi_phone_layers_3d"`, `"qr_inspection_3d"`, `"concentric_security_3d"`, `"server_rack_3d"`, `"bank_vault_3d"`, `"globe_network_3d"`, `"neural_network_3d"`, `"gradient_descent"`), `equation` (LaTeX formula string), `metrics` (`{"Protocol": "ISO-20022", "Latency": "< 240ms"}`).
     * `neural_network_graph`: `title`, `tag`, `mode` (`"forward"` | `"backward"`), `equation` (LaTeX formula or update rule string), `metrics` (`{"Weights": "128k", "Loss": "0.042"}`).
     * `interview`: `tag`, `interview: {"speaker": "INTERVIEWER | YOU | RECAP", "text": "...", "strikethrough": true, "highlight": "...", "subtext": "..."}`.
     * `inspector`: `title`, `tag`, `sections: [{"name": "...", "desc": "...", "color": "..."}]`.
     * `concentric`: `title`, `tag`, `rings: ["Layer 1", "Layer 2", "Layer 3"]`.
     * `architecture`: `title`, `nodes`, `tag`, `direction`, `activeNode`.
     * `gauge`: `title`, `startValue`, `endValue`, `unit`, `status`, `badge`.
     * `benchmark`: `title`, `unit` (e.g. `"s"`, `"ms"`), `runners: [{"name": "...", "value": 0.45, "status": "Winner", "color": "#00F0FF"}]`.
     * `bento`: `title`, `bentoItems: [{"title": "...", "value": "...", "span": 2, "badge": "..."}]`.
     * `hierarchy`: `title`, `layers: [{"name": "...", "spec": "...", "active": true}]`.
     * `timeline`: `title`, `steps`, `activeStep`.
     * `data_structure`: `title`, `structure` (`"queue"`, `"stack"`, `"buffer"`), `operations`.
     * `code`: `title`, `language`, `filename`, `lines`, `highlight` (line index or array).
     * `diagram`: `title`, `diagram` (rendered SVG/PNG path), `mermaid` (raw Mermaid flowchart/sequence code string), `graphviz` (DOT code string).
     * `compare`: `title`, `left: {heading, items}`, `right: {heading, items}`.
     * `stat`: `value` (bold metric), `label`, `icon`.
     * `callout`: `category` (`"Golden Rule"`, `"Pro Tip"`, `"Warning"`), `title`, `text`, `subtext`.
     * `manim`: `title`, `manim` with `{"template": "Equations", "lines": ["..."]}`, `{"template": "Graph", "fn": "...", "x_range": [...], "y_range": [...]}`, or `{"template": "Flow", "items": [...]}`.
     * `outro`: `text`, `icon`, CTA message.
8. **Gold Standard Reference**:
   - `episodes/how-upi-works/storyboard.json` is a technical architecture reference, not a requirement to copy its 3D treatment. Future videos should match its causal detail while choosing the clearest medium and restraint for each topic.
9. **Execution & Publishing**: Never stop after writing code. Always validate with `python3 validate.py <spec>`, render with `python3 pipeline.py <spec> --no-upload`, inspect output, run QA, and deliver a complete playable MP4 file. Upload only when the user explicitly requests it, using `--upload private|unlisted|public`. Always review `episodes/<id>/ATTRIBUTIONS.md` for copyright/CC-BY attribution compliance.
10. **Environment**: Utilize standard Python virtual environment in `.venv/bin` and system Homebrew tools (`/opt/homebrew/bin` for Node/npx, FFmpeg, Python 3.11).
11. **Episode Asset Storage & Organization**:
    - For the episode workflow, store narration in `episodes/<id>/audio/`, and generated/captured images (thumbnails, scene stills, contact sheets) in `episodes/<id>/media/`. Remotion's zero-copy staged assets are dynamically linked into `public/<id>/`.
12. **Strict Real-Object Visualization Policy — No Placeholder Geometry (Mandatory)**:
    - **Core Rule**: Every real-world object must be represented by a recognizable, detailed visual representation of that actual object. **Do not represent real objects using generic boxes, cubes, cylinders, spheres, wireframe shapes, or bare text labels.** The audience must recognize the object immediately even without labels.
    - **Approved Real-Object Media Options (Use Whatever Best Suits the Medium)**:
      1. **Transparent PNGs & Vector Icons (2D / 2.5D Motion Graphics)**: In Remotion, Canvas, or diagram scenes, **always use crisp transparent PNGs, SVGs, or vector icons** (fetched via `tools/asset_finder.py icon "<name>"`, Lucide React components, or transparent web assets) for phones, bank cards, servers, cars, satellites, or currency.
      2. **Exact Procedural Construction (HTML, CSS, JS, Canvas, SVG)**: When creating objects programmatically in React or HTML/CSS, build the **exact, detailed real object** with realistic styling:
         * *Smartphone*: Rounded chassis (`border-radius: 40px`), metallic bezel, camera notch/punch-hole, glossy screen reflection, and side buttons.
         * *Laptop*: Screen lid, hinge, distinct keyboard layout, and trackpad.
         * *Server*: Multi-bay chassis with mounting ears, ventilation grilles, and individual blinking LED activity lights.
         * *ATM / POS Terminal*: Keypad, display screen, cash dispenser slot, card reader, and illuminated receipt slot.
         * *Never use a generic rectangular `div` with a label like "PHONE" or "SERVER".*
      3. **Real 3D CAD Models (`.glb` / `.gltf`)**: In 3D scenes, use `model_3d` with actual `.glb` assets: fetch curated tech models via `python3 tools/model_manager.py get <preset> --topic <id>`, download verified web models, or generate via AI.
      4. **Blender / Lottie / Procedural Shaders**: Use Blender converted assets or detailed procedural Three.js meshes when photorealism or physical kinematics are required.
    - **Labels Do Not Compensate for Missing Detail**: Do not use a rectangular box labeled "LAPTOP" as a laptop or a cube labeled "PHONE" as a smartphone.
    - **Real Objects Remain Visible During Technical Explanations**: When explaining radio waves, packets, protocols, or network traffic, real physical devices must remain visible; abstract elements must layer around them rather than replace them.
    - **Mandatory Object-Quality Gate**: A scene fails QA if a principal object is represented by a generic box/cube, unlabeled primitive, flat geometric placeholder, or bare text label attached to an unrelated shape. (See `prompts/master_production_prompt.md` Section 10).

## Workflow & QA Commands
- **Asset Acquisition & Licensing**:
  * Image Search (Openverse, NASA, Museum, Wikimedia, Pexels): `python3 tools/asset_finder.py image "<query>" --provider auto|nasa|openverse|museum --topic <id>`
  * Stock B-Roll Video Search (NASA, Internet Archive, Pexels, Pixabay): `python3 tools/asset_finder.py video "<query>" --provider auto|nasa|archive|pexels --topic <id>`
  * AI Image Generation (Pollinations.ai, free, zero-key): `python3 tools/asset_finder.py generate "<prompt>" --topic <id>`
  * Vector Icons (Iconify / Lucide): `python3 tools/asset_finder.py icon "<icon_name>" --topic <id>`
  * SFX Search / Download: `python3 tools/asset_finder.py sfx "<query>"`
  * 3D Model Presets / Download: `python3 tools/model_manager.py get <smartphone|server_rack|shipping_container|credit_card|laptop> --topic <id>`
  * Batch Resolve Storyboard Assets & Generate Licensing Ledger: `python3 tools/asset_finder.py resolve episodes/<id>/storyboard.json`
- **Diagrams & Motion Graphics**:
  * Render Mermaid / Graphviz diagram: `python3 tools/diagram_renderer.py --type mermaid|graphviz --code "..." --out <output.svg>`
- **Headless Web Animation Recording**:
  * Record p5.js / D3 / Canvas / HTML animation: `python3 tools/html_recorder.py record <anim.html> --duration 5.0 --out <clip.mp4>`
- **Code-Driven Video Editing**:
  * 16:9 to 9:16 Verticalize: `python3 tools/video_editor.py verticalize <input.mp4> --out <output.mp4>`
  * Speed Ramp / Silence Trim / Grade: `python3 tools/video_editor.py speed/trim-silence/grade <input.mp4> --out <output.mp4>`
- **Validation**: `python3 validate.py episodes/<id>/storyboard.json`
- **Fast Preview Render (360p)**: `python3 pipeline.py <spec> --preview --no-upload`
- **Full Quality Render**: `python3 pipeline.py <spec> --no-upload`
- **Render QA Verification**: `python3 tools/verify_render.py episodes/<id>/final.mp4`
- **Contact Sheet Generation**: `python3 tools/contact_sheet.py episodes/<id>/final.mp4 --interval 6`
- **Audio Quality Report**: `python3 tools/audio_report.py <audio-file> --transcribe`

## Production QA Checklist
Before declaring any video complete:
- [ ] Duration within budget (max 180s)
- [ ] Resolution matches target (1080x1920 vertical or 1920x1080 landscape)
- [ ] Audio-video sync tight (< 0.5s tolerance)
- [ ] Black frames < 2% of total duration
- [ ] Zero text overflow, clipping, or sub-28px fonts on mobile
- [ ] Audio loudness normalized around -16 LUFS
- [ ] Visual momentum on beat with no static text-only slides
- [ ] Contact sheet visual inspection passed

Full architectural details: See [.agents/rules/video_generation_charter.md](.agents/rules/video_generation_charter.md).
