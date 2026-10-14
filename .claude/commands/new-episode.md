# `/new-episode` Command

Scaffolds a new educational video episode in `episodes/<id>/`.

## Workflow
1. Ask the user for:
   - **Episode ID** (e.g. `008-rate-limiter`)
   - **Technical Topic** (e.g. `Rate Limiter in System Design`)
   - **Target Audience & Format** (vertical 1080x1920 or landscape 1920x1080)
2. Create directory: `episodes/<id>/`
3. Generate `episodes/<id>/brief.yaml` using the template from `prompts/brief_template.yaml`.
4. Prompt the user to review `brief.yaml` and run `/script <id>` when ready.

