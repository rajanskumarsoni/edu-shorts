# `/storyboard` Command

Executes Stage 2 storyboard compilation: Translates approved `episodes/<id>/script.md` into `episodes/<id>/storyboard.json`.

## Workflow
1. Follow `prompts/master_production_prompt.md` and compile manually or with the helper, adhering to `schema/storyboard.schema.json`:
   ```bash
   python3 scripts/compile_script_to_storyboard.py episodes/<id>
   ```
2. Refine 3D WebGL scene variants (`variant: "upi_hook_3d"`, `"atm_machine_3d"`, `"server_rack_3d"`, etc.) and metrics.
3. Validate the storyboard:
   ```bash
   python3 validate.py episodes/<id>/storyboard.json
   ```
4. If errors exist, fix them until validation passes with 0 errors.
5. Prompt the user: *"Storyboard compiled and validated! Run `/voice <id>` to synthesize narration."*
