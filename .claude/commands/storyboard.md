# `/storyboard` Command

Executes Stage 2 storyboard compilation: Translates approved `episodes/<id>/script.md` into `episodes/<id>/storyboard.json`.

## Workflow
1. Compile script.md into a validated storyboard (auto-generating 6-key visuals, SFX, tags, and icons):
   ```bash
   python3 tools/compile_script_to_storyboard.py episodes/<id>
   ```
2. Refine any specific 3D WebGL scene variants, formulas, or metrics as needed.
3. Validate the storyboard:
   ```bash
   python3 validate.py episodes/<id>/storyboard.json
   ```
4. If errors exist, fix them until validation passes with 0 errors.
5. Prompt the user: *"Storyboard compiled and validated! Run `/voice <id>` to synthesize narration."*
