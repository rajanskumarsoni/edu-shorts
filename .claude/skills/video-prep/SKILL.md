---
name: video-prep
description: >-
  Prepares a video topic for production: research, script outline, asset checklist, and pipeline setup.
  Use when the user says "prep a video about [topic]", "plan a video", "outline this topic for video", or asks
  to get ready to produce content on a new subject.
---

# video-prep Skill

Prepares a topic for full video production by researching, outlining script structure,
identifying assets needed, and configuring the pipeline.

## When to trigger
- User asks to plan or outline a new video
- "Let's prep a video about X"
- "Research this topic for a video"
- "What would I need to make a video about X?"

## Prerequisites check
Before starting, verify the toolchain is installed:
```bash
# Check core tools
which ffmpeg node npm python3
ls .venv/bin/python
ls node_modules/remotion/package.json
```

If missing, install missing components before proceeding.

## Step 1: Topic research
1. Identify the core concept to explain
2. Research current facts, specs, and real-world data
3. Find 3-4 common misconceptions about this topic
4. Identify 1-2 powerful analogies to ground explanations

## Step 2: Script structure
Outline the video using the required formula:
```
HOOK → PROBLEM → CURIOSITY → EXPLANATION → PAYOFF
```

For each section, note:
- Visual intent (what the viewer sees)
- Narration beats (Hindi script segments)
- Duration estimate (total max 180 seconds)
- Key visual elements needed

## Step 3: Asset checklist
Identify what's needed:
- [ ] 3D models/scenes (check existing components in src/scenes/)
- [ ] Sound effects (check public/sfx/)
- [ ] Music track (check public/music/)
- [ ] Stock footage/images (Pexels if configured)
- [ ] Voiceover audio (TTS or recorded)
- [ ] Lower thirds/lower screen text

## Step 4: Pipeline configuration
1. Create video JSON structure in `videos/<topic>.json`
2. Set up audio directory: `audio/<topic>/`
3. Set up media directory: `media/<topic>/`
4. Configure format (vertical/horizontal)
5. Set duration targets and scene breakdown

## Step 5: Preview script
Generate a minimal render to test the pipeline works:
- Use placeholder visuals
- Test audio sync
- Verify resolution and format
- Run through QA tools

## Output expectations
After completing this skill, the user should have:
1. A research brief with key facts and misconceptions
2. A script outline with scene-by-scene breakdown
3. An asset checklist to gather/create
4. A preliminary video JSON ready for production
5. Verification that the pipeline can render at all

## Quality gates
Before moving to full production:
- All facts verified against current (2026) sources
- Narration flows naturally in Hindi with phonetic acronyms
- Visual metaphors are concrete and physical
- Assets are sourced or created
- Pipeline tested end-to-end
