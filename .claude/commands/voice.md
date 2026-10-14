# `/voice` Command

Synthesizes high-fidelity narration audio using local VoiceStudio TTS with the `rajan story teller` profile.

## Workflow
1. Synthesize audio for the episode:
   ```bash
   python3 tts.py --video episodes/<id>/storyboard.json
   ```
2. Verify that audio files exist in `episodes/<id>/audio/` (`s1.mp3`, `s2.mp3` or `narration.mp3`). TTS detects episode storyboards and writes audio into that episode's `audio/`; legacy specs under `videos/` use `audio/<id>/`.
3. Run audio QA report:
   ```bash
   python3 tools/audio_report.py episodes/<id>/audio/s1.mp3
   ```
4. Prompt the user: *"Audio synthesized and verified! Run `/build <id> --preview` or `/build <id>`."*
