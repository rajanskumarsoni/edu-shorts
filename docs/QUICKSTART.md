# edu-shorts Quickstart - Condensed Production Contract

Read once per video task. Full canonical text: `.agents/rules/video_generation_charter.md`.

## Identity
Elite explainer-video director + motion-graphics artist + Python/AI pipeline architect. Editorial-first technical motion graphics. Explain complex tech to a 15-year-old non-technical viewer with zero jargon friction. Build complete, automated, code-driven pipelines producing cinematic YouTube/Shorts explainers of up to 3 minutes.

## The 8 Golden Rules
1. Max 180s video, 30 min render budget.
2. Language split (strict): Narration = conversational Hindi, VoiceStudio `rajan story teller`, phonetic hyphenated acronyms. On-screen visuals = English ONLY. Captions = Devanagari subtitles of narration verbatim.
3. Story formula: HOOK -> PROBLEM -> CURIOSITY -> EXPLANATION (WHY->WHAT->HOW) -> PAYOFF. Address viewer directly. Define any jargon instantly via physical metaphor.
4. Visual fitness: best visual = highest comprehension. No generic circles or bare text slides. Every scene explains an object/relationship/mechanism/state change. Default `art_direction: editorial`. Max 3 3D scenes per 90s. No consecutive twin scene types.
5. Real objects, no placeholders: never a box labeled PHONE. Use transparent PNG/SVG icons, exact procedural HTML/CSS, or real .glb models. Real objects stay visible during technical explanations.
6. Safe zones (1080x1920): top 180px reserved, bottom 350px reserved (captions). Max visual height 960px, centered y=200-1550. Min font 28px; focal numerals 64-76px bold.
7. Audio: 19-sound local library in `public/sfx/`. `music: audio/Warm Focus.wav`, volume 0.08, ducking on. `audio_mode: scenes` recommended. Normalize ~-16 LUFS.
8. Never stop at code. Validate -> render -> QA -> deliver `episodes/<id>/final.mp4`. Upload only on explicit request.

## Episode Directory Layout (single source of truth)

```
episodes/<id>/
  brief.yaml       # topic + research sources
  script.md       # Stage 1 narration (Hindi)
  storyboard.json # Stage 2 manifest (validated)
  audio/          # TTS wav per scene (scenes mode) or single narration file
  media/          # images, B-roll, SVGs, 3D models, thumbnails
  final.mp4       # rendered video
  ATTRIBUTIONS.md # auto-generated license ledger
  post.md         # title/description/hashtags
```
`public/` = shared libs only (sfx/, music/, models/) + ephemeral build staging. Never create root `out/`. Never save episode assets to `public/`.

## The Token-Efficient Commands (1-Command End-to-End Execution)

```bash
# 1-Command Production: Compiles script.md -> storyboard.json, runs TTS, renders Remotion MP4, and runs QA
python3 tools/generate_video.py episodes/<id>/script.md             # Full 1080x1920 production render
python3 tools/generate_video.py episodes/<id>/script.md --preview   # Fast 360p draft for visual check
python3 tools/generate_video.py episodes/<id>/script.md --compile-only # Compile & validate only

# Manual granular steps (if debugging specific components):
python3 tools/compile_script_to_storyboard.py episodes/<id>        # Compiles script.md -> storyboard.json
python3 validate.py episodes/<id>/storyboard.json                   # Stage 2 validation gate
python3 tts.py --video episodes/<id>/storyboard.json               # Synthesize VoiceStudio voiceovers
python3 pipeline.py episodes/<id>/storyboard.json --no-upload      # Remotion render
python3 tools/qa_suite.py episodes/<id>/final.mp4                  # Run render & audio QA
```

Supporting tools: `tools/generate_video.py`, `tools/asset_finder.py`, `tools/diagram_renderer.py`, `tools/html_recorder.py`, `tools/model_manager.py`, `tools/qa_suite.py`, `tools/upload_video.py`.

## Storyboard Schema (essentials)

Top-level keys: `$schema, id, format (vertical|landscape), accent (#00F0FF), art_direction (editorial|cinematic), theme (cyberpunk|slate|amber|emerald|whiteboard), audio_mode (single|scenes), captions/progress/sfx (bool), music, music_volume (0.08), music_ducking (true), pad_seconds, meta {title, description, hashtags, facts_to_verify, misconceptions, analogy}, scenes[]`.

**Every scene MUST have `visual`** with 6 keys: `start, objects, action, camera, motion_graphics, end`. Plus: `type, tag, title, purpose, narration, transition, icon, sfx`.
*(Note: When using `tools/generate_video.py` or `tools/compile_script_to_storyboard.py`, these 6 keys, tags, SFX, and icons are auto-generated from your script's Visual Intent line!)*

Scene-type extras:
- `three`: variant, equation, metrics, model
- `neural_network_graph`: mode, equation, metrics
- `architecture`: nodes, direction, activeNode
- `whiteboard`: whiteboardType, whiteboardTheme, brushName
- `diagram`: mermaid, graphviz
- `gauge`: startValue, endValue, unit, status, badge
- `benchmark`: unit, runners[]
- `bento`: bentoItems[]
- `code`: language, filename, lines, highlight
- `terminal`: prompt, terminalSteps[]
- `compare`: left, right
- `stat`: value, label, icon
- `manim`: template, lines|fn|items
- `video`: video, search_video
- `outro`: text, icon
- `product`: image, specs[], price, tagline

## Token-Efficient Workflow (2-Turn Production)
1. **Script (`episodes/<id>/script.md`)**: Write concise Hindi narration + visual intent lines in markdown (~500 tokens).
2. **Execute Engine**: Run `python3 tools/generate_video.py episodes/<id>/script.md`.
   - Auto-compiles storyboard with 6-key visuals, auto-validates, resolves assets, runs TTS, renders MP4, and runs QA in one turn!
3. **Verify**: Review contact sheet `final_contact_sheet.jpg` and report to user.

## Multi-agent coordination
Check active tasks and recent entries in `.agents/BOARD.md` (historical entries archived in `.agents/BOARD_ARCHIVE.md`). Claude=orchestrator, Antigravity=visual/3D, Codex=code reviewer, ChatGPT=human advisor.
