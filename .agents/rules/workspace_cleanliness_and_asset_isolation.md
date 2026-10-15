# Workspace Cleanliness & Asset Isolation Directives

## 1. Core Principles

This repository enforces strict physical directory boundaries across all AI agents (Antigravity, Claude Code, Codex, Copilot) and execution scripts.

---

## 2. Strict Prohibition on Root `out/` Folder

- **Rule**: Under NO circumstances should any script, pipeline, Remotion command, render tool, or sub-agent create or write to a root `out/` directory.
- **Enforcement**:
  - Final rendered videos MUST be saved to `episodes/<id>/final.mp4`.
  - Transient scratch renders, one-off video tests, and experimental stills MUST be saved to `scratch/`.
  - `validate.py` will actively flag an error if any storyboard references `out/`, and emits a workspace warning if an `out/` directory is present.

---

## 3. Strict Single Source of Truth: `episodes/<id>/` vs `public/`

### 3.1 The Canonical Home: `episodes/<id>/`
`episodes/<id>/` is the **ONLY** source of truth for all episode deliverables and assets:
- `brief.yaml`: Topic brief and research facts.
- `script.md`: Narrator script in conversational Hindi.
- `storyboard.json`: Manifest specification.
- `post.md`: YouTube title, tags, description, and timestamps.
- `final.mp4`: The final rendered playable video.
- `audio/`: All synthesized narration audio files (`s1.mp3`, `s2.mp3`, etc.).
- `media/`: All images, B-roll video clips, rendered SVG diagrams, 3D `.glb` CAD models, cover thumbnails, and contact sheets.
- `ATTRIBUTIONS.md`: Licensing and source attributions.

### 3.2 The Staging & Global Libraries: `public/`
`public/` is strictly reserved for:
1. **Permanent Shared Global Libraries**:
   - `public/sfx/`: Shared 19-sound local sound library.
   - `public/music/`: Shared ambient background music tracks.
   - `public/models/`: Shared universal 3D primitive models (e.g. `cube.glb`).
   - `public/.gitkeep`.
2. **Ephemeral Build Staging (`public/<id>/`)**:
   - `public/<id>/` is temporary runtime scaffolding created by `pipeline.py` using zero-copy hardlinks where possible (with symlink/copy fallbacks) so Remotion's bundle can access assets via `staticFile()`.
   - **NO OVERLAPPING ASSETS**: Agents must NEVER manually create, save, download, author, or commit episode assets in `public/<id>/`.
   - All tools (`tools/asset_finder.py`, `tools/model_manager.py`) MUST write exclusively to `episodes/<id>/media/`.
   - When rendering completes, `pipeline.py` automatically prunes `public/<id>/` to prevent redundant or duplicate content on disk.

---

## 4. Zero Duplicate Asset Aliases

- Pipeline and staging tools must never duplicate an asset under a numeric alias (e.g., `img1.jpg`, `vid2.mp4`) in `media/` if the original file is already in `media/`.
- Storyboards should refer to meaningful, descriptive filenames (e.g., `media/open_refrigerator_with_food.jpg`).
