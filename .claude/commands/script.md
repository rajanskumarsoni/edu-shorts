# `/script` Command

Executes Stage 1 scriptwriting: Reads `episodes/<id>/brief.yaml` and drafts `episodes/<id>/script.md`.

## Workflow
1. Read `episodes/<id>/brief.yaml`.
2. Follow `prompts/master_production_prompt.md` and the stage-specific instructions in `prompts/script.md`:
   - Day-to-day conversational Hindi (Hinglish) with phonetic acronyms (`एन-पी-सी-आई`, `यू-पी-आई`, `ए-पी-आई`).
   - Formula: `HOOK → PROBLEM → CURIOSITY → EXPLANATION (WHY → WHAT → HOW) → PAYOFF`.
   - 90 - 150 seconds pacing (~220 - 360 spoken words).
3. Write `episodes/<id>/script.md`.
4. Inform the user: *"Please review `episodes/<id>/script.md`. Once approved, run `/storyboard <id>`."*
