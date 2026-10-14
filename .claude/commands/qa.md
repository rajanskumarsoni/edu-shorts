# `/qa` Command

Runs the full perception QA suite: render verification, contact sheet generation, and loudness checks.

## Workflow
1. Run automated perception checks:
   ```bash
   python3 tools/qa_suite.py episodes/<id>/final.mp4
   ```
2. Generate contact sheet:
   ```bash
   python3 tools/contact_sheet.py episodes/<id>/final.mp4 --interval 6
   ```
3. Check results against `prompts/qa.md`:
   - Duration <= 180s
   - Black frames < 2%
   - Audio sync drift < 0.5s
   - No sub-28px fonts or caption collisions
4. If passed, prompt user: *"QA Passed! Run `/post <id>` to generate YouTube publishing metadata."*

