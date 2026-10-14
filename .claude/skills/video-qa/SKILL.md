---
name: video-qa
description: >-
  Reviews rendered videos for quality: visual artifacts, sync issues, timing problems, text overflow.
  Use when the user wants to QA a rendered video, check for bugs, or verify production quality.
---

# video-qa Skill

Comprehensive quality assurance for rendered educational videos.

## When to trigger
- "QA this video"
- "Review the render for X"
- "Check if this video is ready"
- "Find issues in this render"
- "Run verification on output"

## Tools available
- `tools/verify_render.py` - Automated verification
- `tools/contact_sheet.py` - Frame sampling
- FFmpeg - Manual inspection

## Quick usage
```bash
# Run full verification
python3 tools/verify_render.py out/video.mp4

# With expected duration
python3 tools/verify_render.py out/video.mp4 --expected-duration 120

# Generate contact sheet for visual review
python3 tools/contact_sheet.py out/video.mp4 --interval 6
```

## Verification checks
1. **File integrity**
   - File exists and readable
   - Minimum file size (not corrupted)

2. **Video properties**
   - Resolution meets minimum (1080x1920 vertical, 1920x1080 horizontal)
   - Frame rate consistent
   - Codec compliant

3. **Black frame detection**
   - Identifies frames that are >95% black
   - Should be <2% of total frames
   - Flags potential rendering errors

4. **Audio presence**
   - Audio stream exists
   - Duration matches video within 0.5s
   - No severe sync issues

5. **Duration verification**
   - Matches expected length (if provided)
   - No unexpected truncation

## Contact sheet analysis
Use `tools/contact_sheet.py` to:
- Extract frames at 6-second intervals
- Tile them into a single image
- Review for visual consistency
- Check text placement and overflow

## Visual quality checklist
Review the contact sheet for:
- [ ] Consistent aspect ratio across scenes
- [ ] Text readable and within safe zones
- [ ] No black frames (unless intentional)
- [ ] Smooth transitions between scenes
- [ ] Proper color grading
- [ ] 3D objects well-lit and visible
- [ ] No visual artifacts or glitches

## Common issues to flag
- Resolution mismatches
- Audio-video sync drift
- Excessive black frames
- Text overflow or cutoff
- Color banding or compression artifacts
- Glitchy transitions
- Missing sound effects

## Output format
QA report includes:
- Pass/fail status for each check
- Detailed metrics (duration, resolution, etc.)
- Recommendations for fixes
- Links to specific timecodes if issues found
