# Copilot Instructions for edu-shorts

This repo is a collaborative multi-agent educational video production pipeline. All AI agents must follow the same production rules and share the same quality bar.

## Canonical instructions
- Read `AGENTS.md` first.
- Read `.agents/rules/video_generation_charter.md` before writing script, storyboard, or animation code.
- Read `prompts/master_production_prompt.md` as the master production instruction for this repo.
- Use the task prompt in `prompts/` for the current stage (`script`, `storyboard`, `qa`, etc.) when the workflow calls for it.
- Do not invent a different visual or storytelling standard from one agent to another.

## Shared production standard
- Goal: explain technical topics with editorial-first visual storytelling that still works when muted.
- Audience: non-technical viewers, including a bright 15-year-old.
- Narration: spoken Hindi / Hinglish only.
- Designed on-screen text: English only. Captions preserve the approved Hindi/Hinglish narration verbatim in Devanagari.
- Story structure: `HOOK → PROBLEM → CURIOSITY → EXPLANATION → PAYOFF`.
- Explanation order: `WHY → WHAT → HOW`.
- Never rely on decorative animation alone; every motion must clarify a mechanism.
- Every scene must have a clear visual equivalent for the spoken idea.
- Use the mute test: a viewer should understand the mechanism without sound.
- Prefer clear editorial diagrams for flows, data, and cause/effect; use 3D when depth or physical scale improves understanding.
- Keep the total runtime within 3 minutes unless the task explicitly says otherwise.
- The engine hard limit is 180 seconds; do not suggest longer outputs as supported.
- Render commands must pass `--no-upload`. Upload only when explicitly requested by the user.

## Visual quality baseline
- Default to `"art_direction": "editorial"` for stable geometry, restrained styling, and concise labels. `"cinematic"` opts into legacy global glow, bokeh, camera drift, grade, and light sweeps.
- Every scene must explain an object, relationship, mechanism, or state change; a stable diagram is valid when clearest.
- Motion, camera movement, tracked uppercase tags, sound effects, and 3D are optional tools. Use them only when they help explain the scene.
- Include the complete six-key structured visual object on every scene.
- Do not show bare text-only slides or generic abstract circles in place of explanation.
- Prefer real technical objects, flows, states, and comparisons over decorative shapes.

## Evidence and validation
- Research before writing scenes or code.
- Do not invent technical details that are not backed by the actual system or topic.
- Validate results with the project pipeline and fix issues before finalizing the output.
- Preserve the existing tooling and repo conventions rather than introducing unrelated frameworks.

## Agent roles in this repo
- Claude Code: coordinator and command runner.
- Antigravity: visual/design/storyboard specialist.
- Codex: review and catch issues.
- Copilot: implementation, refactors, and code execution inside the workspace.

All agents must converge on the same result: a clear, visually grounded, technically accurate educational video that works with and without narration.
