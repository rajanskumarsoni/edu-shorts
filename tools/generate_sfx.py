#!/usr/bin/env python3
"""
Comprehensive Studio Sound FX Library Generator.
Generates 19 studio-quality, mathematically synthesized sound effects in public/sfx/
for automated educational video rendering in edu-shorts.

Categories:
- Motion & Transitions: whoosh, fast_whoosh, riser, downlifter
- UI & Micro-interactions: pop, tick, click, ting, ding, ka_ching
- Dramatic & Impacts: impact, bass_drop, thud, heartbeat
- Text & Foley: typing, camera_shutter
- Magic & Tech: glitch, sparkle, radar_beep
"""
import math
import random
import struct
import wave
from pathlib import Path

SFX_DIR = Path(__file__).resolve().parent.parent / "public" / "sfx"
SFX_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_RATE = 44100


def write_wav(filename: Path, samples: list[float]):
    """Writes a 16-bit mono PCM WAV file with soft limiting to prevent clipping."""
    with wave.open(str(filename), "wb") as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(SAMPLE_RATE)
        raw = bytearray()
        for s in samples:
            # Soft-clip tanh curve for warm limiting without harsh digital clipping
            s_clipped = math.tanh(s)
            val = max(-1.0, min(1.0, s_clipped))
            raw.extend(struct.pack("<h", int(val * 32767)))
        wav_file.writeframes(raw)


# -------------------------------------------------------------
# 1. MOTION & TRANSITIONS
# -------------------------------------------------------------

def generate_whoosh():
    """0.40s smooth, aerodynamic air sweep for scene transitions."""
    duration = 0.40
    total_samples = int(SAMPLE_RATE * duration)
    rng = random.Random(42)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        p = i / total_samples
        # Smooth bell envelope
        env = (math.sin(p * math.pi)) ** 2
        freq = 240 + 720 * math.sin(p * math.pi)
        sine = math.sin(2 * math.pi * freq * t)
        noise = rng.uniform(-0.5, 0.5)
        samples.append(0.55 * env * (0.65 * sine + 0.35 * noise))

    write_wav(SFX_DIR / "whoosh.wav", samples)


def generate_fast_whoosh():
    """0.20s snappy whip-pan whoosh for rapid cuts."""
    duration = 0.20
    total_samples = int(SAMPLE_RATE * duration)
    rng = random.Random(101)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        p = i / total_samples
        # Fast asymmetric attack and decay
        if p < 0.3:
            env = (p / 0.3) ** 2
        else:
            env = ((1.0 - p) / 0.7) ** 1.8
        freq = 350 + 1200 * math.sin(p * math.pi)
        sine = math.sin(2 * math.pi * freq * t)
        noise = rng.uniform(-0.6, 0.6)
        samples.append(0.6 * env * (0.5 * sine + 0.5 * noise))

    write_wav(SFX_DIR / "fast_whoosh.wav", samples)


def generate_riser():
    """1.20s ascending tension-building synth riser."""
    duration = 1.20
    total_samples = int(SAMPLE_RATE * duration)
    rng = random.Random(77)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        p = i / total_samples
        # Exponential swell envelope
        env = (math.exp(p * 2.5) - 1.0) / (math.exp(2.5) - 1.0)
        # Pitch rises from 160Hz to 1350Hz
        freq = 160 * (8.4 ** p)
        phase = 2 * math.pi * freq * t
        sine = math.sin(phase) + 0.3 * math.sin(phase * 2)
        # Rising tremolo speed
        tremolo = 0.75 + 0.25 * math.sin(2 * math.pi * (4 + 18 * p) * t)
        noise = rng.uniform(-0.3, 0.3) * p
        samples.append(0.5 * env * tremolo * (0.8 * sine + 0.2 * noise))

    write_wav(SFX_DIR / "riser.wav", samples)


def generate_downlifter():
    """0.80s smooth descending release sweep."""
    duration = 0.80
    total_samples = int(SAMPLE_RATE * duration)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        p = i / total_samples
        env = (1.0 - p) ** 1.5
        # Pitch descends from 950Hz to 110Hz
        freq = 110 + 840 * math.exp(-p * 3.5)
        sine = math.sin(2 * math.pi * freq * t)
        samples.append(0.45 * env * sine)

    write_wav(SFX_DIR / "downlifter.wav", samples)


# -------------------------------------------------------------
# 2. UI & MICRO-INTERACTIONS
# -------------------------------------------------------------

def generate_pop():
    """0.08s bubbly cheerful element pop blip."""
    duration = 0.08
    total_samples = int(SAMPLE_RATE * duration)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        p = i / total_samples
        env = (1.0 - p) ** 1.6
        freq = 900 * (1.0 - 0.65 * p)
        sine = math.sin(2 * math.pi * freq * t)
        samples.append(0.45 * env * sine)

    write_wav(SFX_DIR / "pop.wav", samples)


def generate_tick():
    """0.03s subtle odometer / counter mechanical click."""
    duration = 0.03
    total_samples = int(SAMPLE_RATE * duration)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        p = i / total_samples
        env = (1.0 - p) ** 3.2
        freq = 1900 - 800 * p
        sine = math.sin(2 * math.pi * freq * t)
        samples.append(0.35 * env * sine)

    write_wav(SFX_DIR / "tick.wav", samples)


def generate_click():
    """0.04s crisp UI mouse / toggle button click."""
    duration = 0.04
    total_samples = int(SAMPLE_RATE * duration)
    rng = random.Random(202)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        p = i / total_samples
        # Fast click transient + resonance
        env = math.exp(-t * 120)
        transient = rng.uniform(-0.5, 0.5) if t < 0.005 else 0.0
        body = math.sin(2 * math.pi * 1200 * t) + 0.5 * math.sin(2 * math.pi * 420 * t)
        samples.append(0.45 * env * (body + transient * 2.0))

    write_wav(SFX_DIR / "click.wav", samples)


def generate_ting():
    """0.35s crystal high-frequency notification chime."""
    duration = 0.35
    total_samples = int(SAMPLE_RATE * duration)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 9.5)
        # Harmonious bell frequencies: 2489Hz (D#7) + 4978Hz + 7467Hz
        harmonics = (
            0.65 * math.sin(2 * math.pi * 2489 * t)
            + 0.25 * math.sin(2 * math.pi * 4978 * t)
            + 0.10 * math.sin(2 * math.pi * 7467 * t)
        )
        samples.append(0.4 * env * harmonics)

    write_wav(SFX_DIR / "ting.wav", samples)


def generate_ding():
    """0.65s two-tone success confirmation bell (A5 -> E6)."""
    duration = 0.65
    total_samples = int(SAMPLE_RATE * duration)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        # First chime at t=0 (880Hz), second chime at t=0.12 (1318Hz)
        tone1_env = math.exp(-t * 8.0)
        tone1 = math.sin(2 * math.pi * 880 * t) * tone1_env

        tone2 = 0.0
        if t >= 0.12:
            t2 = t - 0.12
            tone2_env = math.exp(-t2 * 6.5)
            tone2 = (
                math.sin(2 * math.pi * 1318.5 * t2)
                + 0.3 * math.sin(2 * math.pi * 2637 * t2)
            ) * tone2_env

        samples.append(0.4 * (0.6 * tone1 + 0.8 * tone2))

    write_wav(SFX_DIR / "ding.wav", samples)


def generate_ka_ching():
    """0.55s metallic cash register / milestone chime."""
    duration = 0.55
    total_samples = int(SAMPLE_RATE * duration)
    rng = random.Random(333)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        # Lever mechanical snap (t < 0.08)
        lever = 0.0
        if t < 0.08:
            lever = rng.uniform(-0.3, 0.3) * math.exp(-t * 40)

        # Dual coin ring tones (1760Hz and 2640Hz) starting at t=0.06
        bell = 0.0
        if t >= 0.06:
            tb = t - 0.06
            env = math.exp(-tb * 7.0)
            tremolo = 1.0 + 0.15 * math.sin(2 * math.pi * 22 * tb)
            b1 = math.sin(2 * math.pi * 1760 * tb)
            b2 = math.sin(2 * math.pi * 2640 * tb)
            b3 = 0.4 * math.sin(2 * math.pi * 3520 * tb)
            bell = env * tremolo * (b1 + b2 + b3) * 0.35

        samples.append(0.5 * (lever + bell))

    write_wav(SFX_DIR / "ka_ching.wav", samples)


# -------------------------------------------------------------
# 3. DRAMATIC & IMPACTS
# -------------------------------------------------------------

def generate_impact():
    """0.60s low-frequency sub-bass cinematic punch."""
    duration = 0.60
    total_samples = int(SAMPLE_RATE * duration)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 6.5)
        # Rapid pitch drop from 140Hz to 45Hz
        freq = 45 + 95 * math.exp(-t * 14)
        sine = math.sin(2 * math.pi * freq * t)
        # Add subtle harmonic saturation
        body = sine + 0.25 * math.sin(4 * math.pi * freq * t)
        samples.append(0.65 * env * body)

    write_wav(SFX_DIR / "impact.wav", samples)


def generate_bass_drop():
    """0.95s deep sweeping sub-bass rumble."""
    duration = 0.95
    total_samples = int(SAMPLE_RATE * duration)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        p = i / total_samples
        env = math.exp(-t * 3.2)
        # Deep slide from 85Hz down to 28Hz
        freq = 28 + 57 * math.exp(-t * 4.0)
        sine = math.sin(2 * math.pi * freq * t)
        sub = 0.3 * math.sin(math.pi * freq * t)
        samples.append(0.7 * env * (sine + sub))

    write_wav(SFX_DIR / "bass_drop.wav", samples)


def generate_thud():
    """0.25s punchy tactile low-end hit."""
    duration = 0.25
    total_samples = int(SAMPLE_RATE * duration)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 16.0)
        freq = 60 + 120 * math.exp(-t * 22)
        sine = math.sin(2 * math.pi * freq * t)
        samples.append(0.6 * env * sine)

    write_wav(SFX_DIR / "thud.wav", samples)


def generate_heartbeat():
    """0.85s organic dual-beat pulse (lub-dub) for suspense."""
    duration = 0.85
    total_samples = int(SAMPLE_RATE * duration)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        # First beat 'lub' at t=0
        beat1 = 0.0
        if t < 0.22:
            e1 = math.exp(-t * 14.0)
            beat1 = 0.7 * e1 * math.sin(2 * math.pi * 58 * t)

        # Second beat 'dub' at t=0.24
        beat2 = 0.0
        if 0.24 <= t < 0.50:
            t2 = t - 0.24
            e2 = math.exp(-t2 * 15.0)
            beat2 = 0.55 * e2 * math.sin(2 * math.pi * 52 * t2)

        samples.append(beat1 + beat2)

    write_wav(SFX_DIR / "heartbeat.wav", samples)


# -------------------------------------------------------------
# 4. TEXT & FOLEY / MECHANICAL
# -------------------------------------------------------------

def generate_typing():
    """0.60s sequence of 5 rhythmic mechanical keyboard clicks."""
    duration = 0.60
    total_samples = int(SAMPLE_RATE * duration)
    rng = random.Random(888)
    samples = []

    click_times = [0.0, 0.11, 0.23, 0.34, 0.47]

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        val = 0.0
        for idx, ct in enumerate(click_times):
            if ct <= t < ct + 0.045:
                dt = t - ct
                env = math.exp(-dt * 130)
                freq = 1400 + (idx * 120) % 500
                click = math.sin(2 * math.pi * freq * dt)
                noise = rng.uniform(-0.4, 0.4) if dt < 0.006 else 0.0
                val += 0.35 * env * (click + noise)
        samples.append(val)

    write_wav(SFX_DIR / "typing.wav", samples)


def generate_camera_shutter():
    """0.30s mechanical camera shutter click and snapshot."""
    duration = 0.30
    total_samples = int(SAMPLE_RATE * duration)
    rng = random.Random(999)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        val = 0.0
        # Click 1: shutter curtain opens (t=0)
        if t < 0.05:
            e1 = math.exp(-t * 110)
            noise1 = rng.uniform(-0.5, 0.5) if t < 0.008 else 0.0
            val += 0.45 * e1 * (math.sin(2 * math.pi * 1600 * t) + noise1)

        # Click 2: shutter curtain closes (t=0.09)
        if 0.09 <= t < 0.18:
            t2 = t - 0.09
            e2 = math.exp(-t2 * 90)
            noise2 = rng.uniform(-0.4, 0.4) if t2 < 0.008 else 0.0
            val += 0.5 * e2 * (math.sin(2 * math.pi * 1100 * t2) + noise2)

        samples.append(val)

    write_wav(SFX_DIR / "camera_shutter.wav", samples)


# -------------------------------------------------------------
# 5. MAGIC, TECH & TWISTS
# -------------------------------------------------------------

def generate_glitch():
    """0.28s digital glitch and distortion burst."""
    duration = 0.28
    total_samples = int(SAMPLE_RATE * duration)
    rng = random.Random(404)
    samples = []

    frequencies = [220, 880, 140, 660, 310, 1100, 180]

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        p = i / total_samples
        env = (1.0 - p) ** 0.8
        freq_idx = int(p * len(frequencies)) % len(frequencies)
        freq = frequencies[freq_idx]

        # Bit-crushed square/saw waveform
        phase = (t * freq) % 1.0
        wave_shape = 1.0 if phase > 0.5 else -1.0
        noise = rng.uniform(-0.7, 0.7) if (i % 3 == 0) else 0.0
        samples.append(0.35 * env * (0.6 * wave_shape + 0.4 * noise))

    write_wav(SFX_DIR / "glitch.wav", samples)


def generate_sparkle():
    """0.55s ascending cascade of 6 delicate crystal pings (fairy dust)."""
    duration = 0.55
    total_samples = int(SAMPLE_RATE * duration)
    samples = []

    # Ascending pentatonic notes
    pitches = [1200, 1440, 1680, 2016, 2419, 2880]
    note_gap = 0.06

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        val = 0.0
        for idx, freq in enumerate(pitches):
            nt = idx * note_gap
            if nt <= t < nt + 0.18:
                dt = t - nt
                env = math.exp(-dt * 20)
                val += 0.15 * env * math.sin(2 * math.pi * freq * dt)
        samples.append(val)

    write_wav(SFX_DIR / "sparkle.wav", samples)


def generate_radar_beep():
    """0.40s futuristic telemetry radar ping / sonar blip."""
    duration = 0.40
    total_samples = int(SAMPLE_RATE * duration)
    samples = []

    for i in range(total_samples):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 8.0)
        # Clean 1864Hz (Bb6) ping with delicate second harmonic
        sine = math.sin(2 * math.pi * 1864.66 * t) + 0.25 * math.sin(4 * math.pi * 1864.66 * t)
        samples.append(0.4 * env * sine)

    write_wav(SFX_DIR / "radar_beep.wav", samples)


def generate_all_sfx():
    print(f"Generating studio SFX library into {SFX_DIR}...")
    generators = [
        ("whoosh.wav", generate_whoosh),
        ("fast_whoosh.wav", generate_fast_whoosh),
        ("riser.wav", generate_riser),
        ("downlifter.wav", generate_downlifter),
        ("pop.wav", generate_pop),
        ("tick.wav", generate_tick),
        ("click.wav", generate_click),
        ("ting.wav", generate_ting),
        ("ding.wav", generate_ding),
        ("ka_ching.wav", generate_ka_ching),
        ("impact.wav", generate_impact),
        ("bass_drop.wav", generate_bass_drop),
        ("thud.wav", generate_thud),
        ("heartbeat.wav", generate_heartbeat),
        ("typing.wav", generate_typing),
        ("camera_shutter.wav", generate_camera_shutter),
        ("glitch.wav", generate_glitch),
        ("sparkle.wav", generate_sparkle),
        ("radar_beep.wav", generate_radar_beep),
    ]

    for name, gen_fn in generators:
        gen_fn()
        print(f"  ✓ {name}")

    print(f"Successfully generated all {len(generators)} sound effects in {SFX_DIR}")


if __name__ == "__main__":
    generate_all_sfx()
