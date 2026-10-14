# 🔊 edu-shorts Local Sound FX Library

A studio-grade, procedurally synthesized sound effects library located in `public/sfx/`. All sounds are 100% royalty-free, copyright-safe, zero external dependencies, and optimized for high-retention YouTube Shorts and Reels.

---

## 🎧 Available Sound Library (`public/sfx/`)

### 1. Motion & Transitions
| Sound File | Name | Duration | Description & Ideal Use Case |
|---|---|---|---|
| `whoosh.wav` | `whoosh` | 0.40s | Aerodynamic air sweep. Default transition between scenes. |
| `fast_whoosh.wav` | `fast_whoosh` | 0.20s | Snappy whip-pan whoosh for rapid camera movements and fast cuts. |
| `riser.wav` | `riser` | 1.20s | Ascending synth tension builder. Ideal for problem scenes & countdowns. |
| `downlifter.wav` | `downlifter` | 0.80s | Descending sweep for energy resolution or calming transitions. |

### 2. UI & Micro-Interactions
| Sound File | Name | Duration | Description & Ideal Use Case |
|---|---|---|---|
| `pop.wav` | `pop` | 0.08s | Bubbly cheerful pop. Perfect for sticker, badge, or bullet reveals. |
| `tick.wav` | `tick` | 0.03s | Subtle odometer / counter click. Great for stats roll-up & timelines. |
| `click.wav` | `click` | 0.04s | Crisp mechanical button or mouse click. Ideal for UI toggles & taps. |
| `ting.wav` | `ting` | 0.35s | Crystal high-frequency chime. Perfect for notifications & subtle highlights. |
| `ding.wav` | `ding` | 0.65s | Harmonious two-tone success bell (A5 -> E6). Great for quiz answers & outro. |
| `ka_ching.wav` | `ka_ching` | 0.55s | Metallic cash register chime. Ideal for financial milestones, payments & rewards. |

### 3. Dramatic & Impacts
| Sound File | Name | Duration | Description & Ideal Use Case |
|---|---|---|---|
| `impact.wav` | `impact` | 0.60s | Cinematic sub-bass heavy punch. Great for big numbers & bold claims. |
| `bass_drop.wav` | `bass_drop` | 0.95s | Deep sweeping sub-rumble drop. Ideal for shocking reveals & major turning points. |
| `thud.wav` | `thud` | 0.25s | Solid tactile hit. Good for heavy card drops & physical simulations. |
| `heartbeat.wav` | `heartbeat` | 0.85s | Anatomical double-thump pulse (lub-dub) for tension and suspense. |

### 4. Text & Foley Mechanical
| Sound File | Name | Duration | Description & Ideal Use Case |
|---|---|---|---|
| `typing.wav` | `typing` | 0.60s | Rhythmic mechanical keystrokes. Ideal for `code` scenes & terminal output. |
| `camera_shutter.wav` | `camera_shutter` | 0.30s | Dual mechanical shutter snapshot. Perfect for QR code scanning & image freeze frames. |

### 5. Magic, Tech & Twists
| Sound File | Name | Duration | Description & Ideal Use Case |
|---|---|---|---|
| `glitch.wav` | `glitch` | 0.28s | Digital byte corruption & distortion buzz. Great for bugs, warnings & misconceptions. |
| `sparkle.wav` | `sparkle` | 0.55s | Ascending pentatonic fairy-dust sparkle. Ideal for "aha!" moments and subscribe outros. |
| `radar_beep.wav` | `radar_beep` | 0.40s | Futuristic sci-fi telemetry ping / sonar blip. Ideal for 3D networking and architecture. |

---

## 🎬 How to Pick Sounds in Your Video Script (`videos/<name>.json`)

### Option 1: Simple Sound Name
Just specify `"sfx": "<sound_name>"` in any scene:

```json
{
  "type": "inspector",
  "title": "QR Code Payload Decoded",
  "sfx": "camera_shutter",
  "sections": [...]
}
```

```json
{
  "type": "gauge",
  "title": "Payment Settlement",
  "sfx": "ka_ching",
  "value": 1.8
}
```

```json
{
  "type": "callout",
  "title": "Critical Error",
  "sfx": "glitch",
  "text": "TRANSACTION FAILED"
}
```

---

### Option 2: Multiple Sounds on One Scene
Pass an array of sound names:

```json
{
  "type": "three",
  "title": "Network Swarm",
  "sfx": ["whoosh", "radar_beep"]
}
```

---

### Option 3: Timed Cues with Precise Frame Delay & Volume
Trigger sounds at exact frames within the scene with customized volume:

```json
{
  "type": "stat",
  "value": "₹20+ Lakh Cr",
  "label": "Annual Volume",
  "sfx": [
    { "sound": "whoosh", "frame": 0, "volume": 0.2 },
    { "sound": "impact", "frame": 6, "volume": 0.45 },
    { "sound": "ka_ching", "frame": 18, "volume": 0.35 }
  ]
}
```

---

### Option 4: Disable SFX for a Scene
Set `"sfx": "none"` or `"sfx": false`:

```json
{
  "type": "hook",
  "sfx": "none",
  "text": "Quiet scene without sound fx"
}
```

---

## 🧠 Smart Default Audio Mapping

When `"sfx": true` (default) and a scene doesn't specify an explicit `sfx` cue:
- **Scene Switch (index > 0)**: Automatically plays `whoosh.wav` (vol 0.22).
- **`stat` scene**: Automatically punches in with `impact.wav` at frame 4.
- **`code` scene**: Automatically plays tactile `typing.wav` at frame 0.
- **`callout` scene**: Automatically accents with `pop.wav` at frame 2.
- **`outro` scene**: Automatically plays `ding.wav` at frame 0.

---

## 🛠 Re-generating or Customizing the Library

To regenerate all 19 sounds or tweak frequencies/timing:
```bash
python3 scripts/generate_sfx.py
```
All audio files are written directly into `public/sfx/`.
