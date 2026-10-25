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
3. Read the stage prompts: `prompts/script.md` (Stage 1 Narration) and `prompts/storyboard.md` (Stage 2 Storyboard Manifest).
4. Read the task-specific guidelines in `prompts/` when the workflow requires QA or component creation.
5. If a system supports platform-native instruction files, keep them aligned with this policy instead of inventing a different creative standard.

The rule is: one production standard, many agents.

## Multi-Agent Operating Protocol & Shared Message Board
This project is collaboratively engineered across multiple AI agents:
- **Claude Code**: The Orchestrator (has direct terminal command execution, triggers pipelines, and calls Codex non-interactively).
- **Antigravity**: Visual & 3D Pipeline Architect (Three.js WebGL scenes, Manim templates, storyboard structures, and video verification).
- **Codex**: Non-Interactive Code Reviewer & Sub-Worker (invoked non-interactively via `codex exec`).
- **ChatGPT**: Strategist & Human-in-the-Loop Advisor (consulted via copy-paste to and from `.agents/BOARD.md`).

### The Golden Rule of Coordination
> **Before starting, read the active focus and recent entries in `.agents/BOARD.md` (historical logs older than 48h are archived in `.agents/BOARD_ARCHIVE.md` to conserve context tokens). When you finish, append a dated entry: who you are, what you did, what's next, and any questions for the other agents.**

### Orchestrator Workflow (Claude Code ➔ Codex)
Claude Code acts as the orchestrator since it can run terminal commands directly:
```bash
codex exec "review the changes in src/ and write findings to .agents/BOARD.md"
```
- Tell Claude Code: *"Ask Codex to review your work, read `.agents/BOARD.md`, and fix what it finds."*
- Both tools can also run as MCP servers (`claude mcp serve` and `codex mcp-server`) for direct tool registration.
- ChatGPT extension: No direct agent-to-agent hook; human references or pastes `BOARD.md` entries.
- Antigravity: Coordinates natively through the shared files and `.agents/BOARD.md`.

## Research & Evidence Before Production
Before writing factual narration or storyboard claims:
1. Check current primary sources (standards, official technical documentation, original research) for claims that can change; use secondary sources to explain or cross-check them.
2. Verify only the architecture, numbers, equations, and limitations that the proposed story actually uses. Do not add metrics or technical detail just to fill storyboard fields.
3. Choose a familiar example or analogy only when it clarifies the mechanism without distorting it. A recognizable app UI is appropriate when the topic is about that kind of interaction; otherwise use a truthful everyday, physical, or system-level situation.
4. Visual references from educators or software products are optional inspiration, not evidence of technical claims or a style mandate. Adapt a useful visual idea; do not imitate a creator or force a current design trend.
5. Record source URLs and the specific claims they support in the episode brief or `meta.research_sources`. Mark assumptions and uncertain details instead of presenting them as facts.
6. Select only tools and libraries that are present and supported in this repository or explicitly available in the current environment. Check the implementation, package manifests, CLI help, credentials, and the relevant skill instructions before relying on them. Prefer the simplest existing renderer that explains the scene; do not install or invoke tools merely for variety.

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
5. **Visual Fitness & Editorial-First Direction (Creative Flexibility)**:
   - **The Visual Fitness Principle**: The best visual is the one that produces the highest comprehension and retention for the specific concept. You have complete flexibility to select, combine, and innovate across visual media (2D vector, 2.5D isometric, 3D WebGL, mathematical animation, interactive UI, data charts, terminal consoles, product showcases, or B-roll video footage).
   - **No decorative abstraction or text-only slides**: Every scene must explain an object, relationship, mechanism, or state change. Use a clear diagram, purposeful object, or grounded visual model—never generic circles or bare text cards.
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
   - **Optional Visual Skills**: The workspace exposes specialized skills for different tasks, but many are for websites, decks, illustrations, or other deliverables—not video scenes. Use a skill only when its stated purpose fits the episode and its instructions are available; read its `SKILL.md` and verify its output format, dependencies, and aspect-ratio support. A skill is an asset-authoring workflow, not automatically a storyboard scene type. Inspect its output and import/normalize rendered clips into the episode before use. Never assume every skill supports 9:16 or is needed.
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
     * `music_ducking`: `true` (enables speech-aware sidechain audio ducking to 35% during narration)
     * `art_direction`: `"editorial"` (default restrained treatment) or `"cinematic"` (legacy global glow, bokeh, camera drift, grade, and light sweeps).
     * `theme`: `"cyberpunk"` (default neon cyan/purple dark), `"slate"` (tech blue-gray), `"amber"` (editorial warm bronze), `"emerald"` (scientific mint), or `"whiteboard"` (clean high-contrast light mode).
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
     * `terminal`: `title`, `tag`, `prompt`, `terminalSteps: [{"kind": "cmd" | "out" | "pause" | "pill", "text": "...", "typeSpeed": 0.035}]`.
     * `screenshot`: `title`, `tag`, `image`, `screenshotSteps: [{"kind": "cursor_move" | "click_pulse" | "type_into" | "bubble_append" | "highlight_box", "to": [0.5, 0.4]}]`.
     * `product`: `title`, `tag`, `image` (transparent cutout), `specs: [{"label": "...", "value": "..."}]`, `highlight`, `price`, `tagline`. Real-object showcase with floating motion and radial spotlight.
     * `whiteboard`: `title`, `tag`, `image` (optional path to a high-res chalkboard infographic asset, e.g. from `bs-chalkboard-infographic`), `whiteboardType: "algorithm" | "sorting" | "architecture" | "tree" | "math" | "flow" | "infographic" | "radial" | "comparison" | "loop"`, `whiteboardTheme: "chalkboard" | "whiteboard" | "grid"`, `brushName: "rotring" | "HB" | "2B" | "marker"`, `equation`, `whiteboardData: [{"value": 64, "highlight": false}]`. Tactile organic hand-drawn sketching and chalkboard infographics with full 9:16 vertical shorts and 16:9 landscape video responsiveness.
8. **Gold Standard Reference**:
   - `episodes/how-upi-works/storyboard.json` is a technical architecture reference, not a requirement to copy its 3D treatment. Future videos should match its causal detail while choosing the clearest medium and restraint for each topic.
9. **Token-Efficient Execution & Publishing**:
   - To achieve a **98%+ reduction in LLM tokens** while preserving maximum visual and audio quality:
     * **Write `script.md` ONLY**: Authors write concise Hindi narration + visual intent in `episodes/<id>/script.md` (~500 tokens). DO NOT manually write 400-line JSON storyboards in chat context.
     * **Run the 1-Command Engine**: Execute `python3 tools/generate_video.py episodes/<id>/script.md`. This automatically compiles the storyboard with rich 6-key visuals, validates schema, resolves assets, synthesizes VoiceStudio voiceovers, renders Remotion MP4, and runs QA verification in ONE turn.
     * For fast visual checks: use `python3 tools/generate_video.py episodes/<id>/script.md --preview`.
     * Never output to a root `out/` folder; deliver complete playable MP4 file at `episodes/<id>/final.mp4`. Upload only when the user explicitly requests it, using `--upload private|unlisted|public`. Always review `episodes/<id>/ATTRIBUTIONS.md` for copyright/CC-BY attribution compliance.
10. **Environment**: Utilize standard Python virtual environment in `.venv/bin` and system Homebrew tools (`/opt/homebrew/bin` for Node/npx, FFmpeg, Python 3.11).
11. **Strict Single Source of Truth (`episodes/<id>/` vs `public/`) & Strict Ban on Root `out/`**:
    - **Single Source of Truth**: `episodes/<id>/` is the **ONLY** canonical directory for episode content. All narration speech files must reside in `episodes/<id>/audio/`, all media (images, B-roll video clips, SVG diagrams, 3D models, thumbnails, contact sheets) in `episodes/<id>/media/`, and rendered video in `episodes/<id>/final.mp4`.
    - **`public/` is Strictly for Shared Assets and Ephemeral Build Staging**:
      * *Permanent shared libraries*: `public/sfx/` (sound library), `public/music/` (shared tracks), and `public/models/` (shared 3D primitives like `cube.glb`).
      * *Ephemeral build staging*: `public/<id>/` is temporary staging created dynamically by `pipeline.py` via zero-copy hardlinks where possible, with symlink/copy fallbacks, and automatically pruned upon completion.
      * **NO OVERLAPPING ASSETS**: Agents must NEVER manually save, download, author, or commit episode assets directly into `public/`. Tools (`tools/asset_finder.py`, `tools/model_manager.py`) must write exclusively to `episodes/<id>/media/`.
    - **NEVER create or use a root `out/` folder.** All final video renders belong in `episodes/<id>/final.mp4` and transient scratch tests belong in `scratch/`.
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
    - **Mandatory Object-Quality Gate**: A scene fails QA if a principal object is represented by a generic box/cube, unlabeled primitive, flat geometric placeholder, or bare text label attached to an unrelated shape. (See `prompts/storyboard.md` Section 5).
13. **Continuous Pipeline Self-Improvement Protocol (Mandatory)**:
    - **No Passive Notes**: Whenever a human review requests a revision or points out an aesthetic, timing, or layout defect in a video, agents MUST NOT only fix the isolated scene or leave a passive note in a log.
    - **Update the Pipeline Itself**: The agent who fixes the defect MUST trace its root cause and proactively update:
      1. **Prompts (`prompts/script.md` or `prompts/storyboard.md`)**: If the defect was a narrative, pacing, or storyboard specification gap.
      2. **Agent Directives (`AGENTS.md` & `.agents/rules/video_generation_charter.md`)**: If the defect was a visual hierarchy, safe zone, or styling rule.
      3. **Automated Validators (`validate.py` & `tools/qa_suite.py`)**: Add a physical assertion or lint rule so future videos are automatically blocked from repeating the error.
      4. **Component Core (`src/scenes/`)**: Generalize one-off fixes into reusable component templates.
14. **Vertical Safe Zones & 350px Caption Clearance (Zero Collision Rule)**:
    - On a 1080x1920 vertical canvas:
      * **Bottom Safe Zone**: The bottom **350px** (`y > 1570px`) is strictly reserved for Devanagari subtitles/captions. No diagram labels, cards, buttons, or interactive graphics may extend into this zone.
      * **Top Safe Zone**: The top **180px** (`y < 180px`) is reserved for header tags, status bar, and progress indicator.
      * **Maximum Visual Height**: Visual components and interactive diagrams must fit within a maximum height of **960px**, centered vertically between `y = 200px` and `y = 1550px`.
15. **Strict Ergonomic Typography & Human Visual Angle Thresholds (Eye-Strain & Visual-Pain Prevention)**:
    - **The Visual Angle Scientific Foundation**:
      Font size on video displays is strictly governed by the human visual angle formula:
      $$\theta = 2 \arctan\left(\frac{S}{2D}\right) \iff S = 2 \cdot D \cdot \tan\left(\frac{\theta}{2}\right) \implies P(\theta) = S \cdot \rho$$
      where $D$ is human viewing distance (mobile smartphone: $\approx 350\text{ mm} \approx 14"$; desktop: $\approx 600\text{ mm}$), $\rho$ is screen pixel density ($\approx 13.5\text{ px/mm}$ for 1080x1920 portrait; $\approx 6.2\text{ px/mm}$ for 1920x1080 landscape).
    - **The Two Physiological Pain Boundaries**:
      1. **Squinting / Eye-Strain Danger Zone ($< 0.22^\circ$, $< 20\text{px}$ in 1080x1920)**: Text smaller than 20px causes ciliary muscle spasm, asthenopia (ocular fatigue), and severe squinting on 6" mobile screens. NEVER render readable text below **22px** (absolute floor: **20px** for minor badge borders/mono axis only).
      2. **Retinal Glare / Saccadic Disruption Ceiling ($> 1.8^\circ - 2.0^\circ$, $> 108\text{px}$ in 1080x1920)**: Text exceeding $1.8^\circ$ visual angle bursts outside the foveal field of view, forcing unnatural eye jumps (saccades), causing disorientation, eye pain, and layout blowouts. NEVER exceed **108px** even for the largest hero number!
    - **Strict Canonical Typography Spectrum (1080x1920 Vertical Mobile Shorts)**:
      * **Hero Single Metric / Stat Number** (e.g. `40%`, `99%`): **72px – 104px** (Hard absolute ceiling: **108px**). Dynamically scale down for longer strings: $\le 3$ chars: 104px; 4–5 chars: 88px; 6–7 chars: 74px; $\ge 8$ chars: 62px.
      * **Scene Main Headline / Primary Title**: **48px – 58px** (Hard ceiling: **60px**). Max 2 lines, tight tracking `-0.02em`.
      * **Section Headers / Prominent Subtitles**: **32px – 40px** (Optimal: **36px**).
      * **Card Titles / Container Headers**: **26px – 32px** (Optimal: **28px**).
      * **Body Explanations / Bullet Descriptions**: **26px – 32px** (Optimal: **28px**, line-height 1.35–1.4). NEVER drop below 24px.
      * **Active Spoken Hindi Captions**: **48px – 52px** (Optimal: **50px**). Active word pulse max scale 1.12×.
      * **Category Tags / Step Headers** (e.g. `01 / ARCHITECTURE`): **22px – 26px** (Uppercase, tracking `+0.1em`).
      * **Monospace Chips / Code Telemetry / Pills**: **20px – 24px** (Optimal: **22px**).
      * **Mathematical Formulas (KaTeX)**: Primary formula: **40px – 48px** (e.g. $Q = d \times G$); Sub-labels: **22px – 24px**.
    - **Landscape 16:9 Adaptations (1920x1080)**:
      * Hero Metric: 54px–76px (Ceiling: 84px) | Title: 38px–48px | Subhead: 28px–34px | Body: 20px–26px | Tag: 18px–22px | Absolute Floor: 16px.
    - **Automated Verification & CI Guard**: Every video scene is automatically verified by `tools/typography_linter.py` and Step 5 of `tools/qa_suite.py`. Any font size $< 20\text{px}$ or $> 110\text{px}$ is treated as a critical production error and halts pipeline completion.
16. **Authentic Real-World Hook Grounding**:
    - Ground abstract topics in a concrete situation the audience can recognize. Use a real app/UI only when the topic genuinely concerns that interaction; otherwise choose a relevant physical-world or system-level example. Do not invent app behavior or brand details merely to satisfy a hook rule.
    - Real UI components must model realistic physical details (smartphone viewport, dynamic island, search bar, status bar, real branding, and animated touch cursor with tap ripple).
17. **Phrase-Synced Action Choreography & Remotion Sequence Rule**:
    - Scene animations must not be generic continuous linear drifts or unsynced loops. Actions must be broken into distinct phases synchronized with spoken audio clauses/cues (e.g. Phase 1 Enter -> Phase 2 Spotlight -> Phase 3 Condition/Alert -> Phase 4 Execution/Swap).
    - **Remotion Sequence Scope**: Inside a Remotion `<Sequence>`, `useCurrentFrame()` is ALREADY 0-indexed to the scene start (0 to scene duration). NEVER subtract `sceneStartFrame`, as doing so produces negative frame counts and freezes caption progression.
18. **Strict Brand Channel Policy ("Rajan का ADDA" Only) & Mandatory Microsoft Edge Browser**:
    - **Single Authorized Brand**: All videos across EVERY platform (YouTube, Telegram, Instagram, Facebook, Twitter/𝕏, LinkedIn, Threads) MUST ONLY be published to the official brand account: **"Rajan का ADDA"** (`rajan_ka_adda` / `rajan.ka.adda` / `Rajan का ADDA`). Never upload or publish to any personal account or secondary handle. Every tool must verify the destination account identity before uploading and abort immediately if the active session is not "Rajan का ADDA".
    - **Mandatory Microsoft Edge Browser**: ALL browser automation workflows, session persistence, and social media web interactions MUST strictly use **Microsoft Edge** (`channel="msedge"` in Playwright). Do NOT use generic Chromium or any other browser.
19. **Instagram Reels & Shorts Viral Optimization (While Preserving Up to 3-Minute Technical Depth)**:
    - **Retain 3-Minute (180s) Technical Depth**: Technical, educational explainers must never sacrifice factual rigor or causal explanation. Keep the hard ceiling at 180 seconds while applying viral short-form retention mechanics.
    - **Instagram UI Safe-Zone Clearance**: All interactive diagrams, gauges, 3D models, and telemetry must respect the Reels safe area:
      * **Top Clearance**: 160px (avoids Reels camera, tabs, search icons).
      * **Bottom Clearance**: 380px (keeps content safely above profile username, caption snippet, audio ticker, and bottom nav bar).
      * **Right Clearance**: 120px (avoids right-side like/comment/share/remix action column).
    - **Kinetic "Viral Pop" Captions**: Captions are rendered at `bottom: 380px` in a 2–3 word sliding window with a `1.22×` scale bounce, glowing neon shadows, and auto-detected emphasis colors (`#FFE600` for metrics, percentages, currency, and warning terms).
    - **Frame-0 Visual Momentum (Thumb-Stopper)**: Scene 0 MUST start with 100% opacity on frame 0 (zero initial fade-in from black) and immediate visual motion to prevent users from scrolling past.
    - **Seamless Infinite Loop Engine**: When authoring the outro in `script.md`, structure the closing clause to flow directly back into the opening hook question. This triggers automatic re-watches on Instagram without jarring cuts or blank frames.
20. **Universal Asset Placement & Sourcing Matrix (The Right Asset at the Right Place)**:
    - Agents must NEVER randomly select assets or use generic placeholders. Every asset chosen must directly serve the pedagogical objective:
      | Video Need / Pedagogical Scene | Asset Type | Primary Source / Engine | Secondary / Fallback Source | Automation Tool | Why This Asset Fits Here |
      | :--- | :--- | :--- | :--- | :--- | :--- |
      | **Real-world context / Problem hook** | Real 4K Video B-Roll | **Pexels / Pixabay Video** | Wikimedia / Coverr | `tools/asset_finder.py video` | Immediately grounds the viewer in a recognizable everyday reality. |
      | **Science / Space / Aerospace** | Archival / Research Video | **NASA Image & Video Library** | Internet Archive | `tools/asset_finder.py video --provider nasa` | 100% authentic public-domain physics and scientific footage. |
      | **Historical tech / Computing origins** | Archival Footage | **Internet Archive (Archive.org)** | Wikimedia Commons | `tools/asset_finder.py video --provider archive` | Historic footage (Prelinger, Bell Labs) creates documentary credibility. |
      | **Internal hardware / Spatial depth** | 3D CAD Mesh (`.glb`) | **Curated Presets** (`smartphone`, `server_rack`, `laptop`) | **Poly Haven CC0** / **Sketchfab** | `tools/model_manager.py get\|download` | Allows 360° camera fly-throughs inside chips, antennas, and server racks. |
      | **Custom mechanical / Physical conversions** | Blender 3D Model | **Blender 5.2.2 Engine** (`tools/blender_render.py`) | Procedural Three.js | `tools/model_manager.py convert` | Centered origin, PBR textures, and normalized dimensions for Three.js. |
      | **Network handshakes & State transitions** | Chronological 2D Diagram | **Mermaid / SVG** (`diagram` scene) | Architecture cards | `tools/diagram_renderer.py` | Clearly displays time progression and bidirectional message handshakes. |
      | **System architecture & Data flow** | 2.5D Isometric Graph | **Native Remotion Architecture** | Bento telemetry grid | Built-in React components | Shows multi-node infrastructure without visual clutter. |
      | **Mathematical proofs & Calculus** | Formula Animations | **Manim (CE)** / **KaTeX Math Engine** | Neural Network Graph | `manim` / `<MathFormula>` | Renders publication-grade vector formulas and gradient curves. |
      | **Developer tools & Commands** | CLI Terminal Simulation | **Native Remotion Terminal** | Code editor component | Built-in React components | Simulates character-by-character typing with real syntax highlighting. |
      | **Software UI / Web Platforms** | Interactive UI Simulation | **Screenshot / Mouse Cursor** | **OBS Studio** capture | `screenshot` / `tools/html_recorder.py` | Shows real user actions, click ripples, and prompt responses. |
      | **Physical Gadgets / Chips / Hardware** | Cutout Showcase | **Product Scene** (Transparent PNG) | 3D Model (`model_3d`) | `product` with `--nobg` | Radial spotlight and spec cards make consumer hardware pop. |
      | **Algorithm & Napkin Sketches** | Tactile Chalkboard | **Whiteboard Scene** (`p5.brush`) | Diagram renderer | Built-in canvas engine | Charcoal and rotring textures humanize complex sorting/trees. |
      | **Voiceover / Narration** | Spoken Audio | **VoiceStudio** (`rajan story teller`) | **Edge-TTS** (`hi-IN-MadhurNeural`) | `tts.py` | Natural conversational Hindi with phonetic acronyms. |
      | **Micro Sound Design** | Frame-Accurate SFX | **Local 19-Sound Library** (`public/sfx/`) | **Freesound API** | Built-in SFX engine | Accentuates transitions, alerts, scans, and metric drops without clutter. |
      | **Mobile Subtitles / Captions** | Word-Level Highlighting | **Whisper / Faster-Whisper** | Pre-timed timestamps | `Captions.tsx` | High-retention active word pop with safe-zone clearance. |

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
- [ ] Ergonomic Typography verified via tools/typography_linter.py (20px - 108px bounds, zero eye strain / retinal glare)
- [ ] Safe Zone clearance verified: 350px bottom clearance for subtitles with zero diagram/UI collisions
- [ ] Focal typography verified: primary numbers/metrics are 72px–104px bold (hard ceiling 108px)
- [ ] Phrase-synced choreography: scene action triggers on exact spoken narration cues
- [ ] Audio loudness normalized around -16 LUFS
- [ ] Visual momentum on beat with no static text-only slides or consecutive twin scene types
- [ ] Contact sheet visual inspection passed

Full architectural details: See [.agents/rules/video_generation_charter.md](.agents/rules/video_generation_charter.md).
