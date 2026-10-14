# `/post` Command

Generates post-production metadata packet (`post.md` / `upload.txt`) and prepares the episode for distribution.

## Workflow
1. Follow instructions in `prompts/post.md`.
2. Format high-CTR title, engaging description, timestamped chapter markers, hashtags, and pinned comment into `episodes/<id>/post.md`.
3. If ready to publish to YouTube, run:
   ```bash
   python3 scripts/upload_video.py episodes/<id>/final.mp4 --meta episodes/<id>/post.md
   ```

