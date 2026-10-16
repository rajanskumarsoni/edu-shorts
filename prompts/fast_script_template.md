# Fast Script Template (`episodes/<id>/script.md`)

Use this concise template when authoring a new video episode. Keep it lean (~50-80 lines) to minimize LLM token consumption. The master engine (`python3 tools/generate_video.py`) will automatically compile this script into a 100% schema-compliant `storyboard.json` with 6-key structured visuals, sound effects, tags, and icons.

```markdown
# Episode: <Title Here>
- Format: vertical
- Theme: cyberpunk
- Accent: #00F0FF
- Art Direction: editorial
- Pad Seconds: 0.28

## Scene 1: The Hook
- **Type**: hook
- **Tag**: 01 / THE HOOK
- **Tone**: [Curious, high-energy]
- **Visual**: <Everyday situation or physical problem: e.g. Customer scans a physical QR standee at a tea stall with smartphone screen glowing>
- **Narration**:
<Spoken conversational Hindi (बोलचाल की हिंदी / Hinglish) addressing the viewer directly with phonetic acronyms: e.g. आपने कभी सोचा है कि जब आप सिर्फ दो सेकंड में क्यू-आर कोड स्कैन करके पेमेंट करते हैं, तो पीछे क्या होता है?>

## Scene 2: The Core Problem or Comparison
- **Type**: compare
- **Tag**: 02 / THE BOTTLENECK
- **Left**: {"heading": "Old Approach", "items": ["Slow Batching", "High Latency", "Single Point Failure"]}
- **Right**: {"heading": "Modern Engine", "items": ["Sub-Second Sync", "Distributed Queue", "Instant Failover"]}
- **Tone**: [Clear, direct]
- **Narration**:
<Conversational Hindi explaining why traditional systems fail and why this technology exists.>

## Scene 3: The Architecture Pipeline
- **Type**: architecture
- **Tag**: 03 / THE PIPELINE
- **Nodes**: ["Client App", "API Gateway", "Processing Core", "Distributed DB"]
- **Direction**: horizontal
- **Visual**: <Glowing transaction token travels from Client through Gateway and Processing Core to DB with real-time status pulses>
- **Tone**: [Explaining mechanism]
- **Narration**:
<Conversational Hindi walking through the chronological flow of data.>

## Scene 4: Key Metric or Time Complexity
- **Type**: stat
- **Tag**: 04 / BY THE NUMBERS
- **Value**: "O(1)"
- **Label**: "SUB-SECOND LOOKUP"
- **Visual**: <Huge glowing metric numeral punches into frame with live telemetry confirm>
- **Tone**: [Analytical, impactful]
- **Narration**:
<Conversational Hindi delivering the bold metric or efficiency payoff.>

## Scene 5: Decision Logic or Flowchart
- **Type**: diagram
- **Tag**: 05 / HOW IT DECIDES
- **Mermaid**: graph TD; A[Receive Request] --> B{Cache Hit?}; B -- YES --> C[Return in 1ms]; B -- NO --> D[Query Database & Cache];
- **Visual**: <Cyan laser scanline traces the decision diamond and early termination branch>
- **Tone**: [Structured, takeaway]
- **Narration**:
<Conversational Hindi explaining the decision tree or state machine.>

## Scene 6: Speed Race or Telemetry
- **Type**: benchmark
- **Tag**: 06 / SPEED SHOWDOWN
- **Runners**: [{"name": "Standard DB", "value": 120, "status": "Bottleneck", "color": "#FF4444"}, {"name": "In-Memory Cache", "value": 1.2, "status": "Winner", "color": "#00F0FF"}]
- **Unit**: "ms"
- **Visual**: <Dynamic speed race bars animating from left to right with winner pulse>
- **Tone**: [Energetic]
- **Narration**:
<Conversational Hindi comparing performance or real-world difference.>

## Scene 7: Memorability & Channel Payoff
- **Type**: outro
- **Tag**: 07 / THE TAKEAWAY
- **Visual**: <Structured summary card with 3 key pillars locking in with gold checkmarks and channel follow CTA>
- **Tone**: [Inspiring, upbeat]
- **Narration**:
<Conversational Hindi summarizing the core intuition and inviting viewers to explore more tech breakdowns.>
```

---

## 1-Command Production
Once `episodes/<id>/script.md` is saved:
```bash
python3 tools/generate_video.py episodes/<id>/script.md
```
*(Options: `--preview` for 360p draft, `--compile-only` to test schema without rendering).*
