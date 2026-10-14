# `/build` Command

Executes the video production pipeline: Manim math graphics rendering + Remotion multi-layer composition + FFmpeg mixing.

## Workflow
1. Fast iteration preview (360p draft):
   ```bash
   python3 pipeline.py episodes/<id>/storyboard.json --preview --no-upload
   ```
2. Full quality final render (1080x1920 @ 30fps):
   ```bash
   python3 pipeline.py episodes/<id>/storyboard.json --no-upload
   ```
3. Uploading is disabled by default. Only add `--upload private`, `--upload unlisted`, or `--upload public` when the user explicitly requests publishing.
4. Verify the final render exists at `episodes/<id>/final.mp4`.
5. Prompt the user: *"Render complete! Run `/qa <id>` to verify perception standards."*
