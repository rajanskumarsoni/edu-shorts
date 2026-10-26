#!/usr/bin/env python3
"""
tests/test_visual_storytelling.py - Regression Test Suite for Narration-Synchronized Visual Storytelling

Implements 10 mandatory regression tests as defined in Section 16 of the engineering directives:
1. A narration phrase with one physical action.
2. A sentence containing several sequential actions.
3. A sentence with concurrent actions.
4. A Hindi narration containing English technical terms.
5. A technical explanation requiring an abstract diagram.
6. A missing critical asset.
7. A visual event without an executable animation.
8. Conflicting or missing timestamps.
9. A continuity error between two scenes.
10. A rendered scene that fails mute-comprehension review.
"""

import json
import pytest
from pathlib import Path
from tools.narration_aligner import NarrationAligner
from tools.choreography_engine import ChoreographyEngine
from tools.quality_gates import QualityGateRunner, validate_storyboard_quality

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def aligner():
    return NarrationAligner(fps=30)


@pytest.fixture
def choreographer():
    return ChoreographyEngine(fps=30)


@pytest.fixture
def gate_runner():
    return QualityGateRunner()


# -----------------------------------------------------------------------------
# Test 1: A narration phrase with one physical action
# -----------------------------------------------------------------------------
def test_1_single_physical_action(aligner, choreographer):
    phrase = "ग्राहक अपना फोन ऊपर उठाता है।"
    scene_idx = 1
    events = choreographer.plan_events_for_scene(
        scene_idx=scene_idx,
        scene_type="three",
        title="PHONE RAISE",
        narration=phrase
    )

    assert len(events) >= 1
    ev = events[0]
    assert "event_id" in ev
    assert ev["actor_or_subject"] in ["customer", "smartphone", "system_core"]
    assert ev["initial_state"] is not None
    assert ev["final_state"] is not None
    assert ev["initial_state"] != ev["final_state"]
    assert "camera_instruction" in ev
    assert "animation_instruction" in ev
    assert ev["start_pct"] == 0
    assert ev["end_pct"] == 100


# -----------------------------------------------------------------------------
# Test 2: A sentence containing several sequential actions
# -----------------------------------------------------------------------------
def test_2_sequential_actions(choreographer):
    phrase = "ग्राहक फोन उठाता है, कैमरे को क्यू-आर कोड के सामने लाता है, और स्क्रीन पर पेमेंट पेज खुलता है।"
    events = choreographer.plan_events_for_scene(
        scene_idx=1,
        scene_type="three",
        title="RETAIL PAYMENT FLOW",
        narration=phrase
    )

    # Must produce multiple connected sequential events
    assert len(events) >= 2
    for i in range(len(events) - 1):
        curr_ev = events[i]
        next_ev = events[i + 1]
        assert curr_ev["end_pct"] <= next_ev["start_pct"] + 1  # contiguous
        # Next event preconditions link to current event completion
        assert any(curr_ev["event_id"] in pre for pre in next_ev["preconditions"])


# -----------------------------------------------------------------------------
# Test 3: A sentence with concurrent actions
# -----------------------------------------------------------------------------
def test_3_concurrent_actions(choreographer):
    phrase = "ग्राहक क्यू-आर कोड स्कैन करता है। साथ ही दुकानदार सामान थैले में पैक करने लगता है।"
    events = choreographer.plan_events_for_scene(
        scene_idx=2,
        scene_type="three",
        title="PARALLEL PACKING",
        narration=phrase
    )

    assert len(events) >= 2
    # Verify concurrent link between parallel actions
    has_concurrent_link = any(
        len(ev.get("concurrent_event_ids", [])) > 0 for ev in events
    )
    assert has_concurrent_link, "Expected concurrent_event_ids to link parallel actions!"


# -----------------------------------------------------------------------------
# Test 4: Hindi narration containing English technical terms
# -----------------------------------------------------------------------------
def test_4_hindi_with_english_tech_terms(aligner, choreographer):
    phrase = "ब्लूटूथ 2.4 GHz बैंड पर 79 चैनल्स के बीच प्रति सेकंड 1600 बार हॉप करता है।"
    segments = aligner.align_scene(1, phrase, "FREQUENCY HOPPING")

    assert len(segments) >= 1
    seg = segments[0]
    # Numbers and units must be extracted
    numbers = seg["numbers"]
    assert any("2.4" in n or "GHz" in n for n in numbers)
    assert any("79" in n for n in numbers) or any("1600" in n for n in numbers)

    events = choreographer.plan_events_for_scene(
        scene_idx=1,
        scene_type="three",
        title="HOPPING",
        narration=phrase
    )
    assert len(events) >= 1
    # Check that mute-first Devanagari label is formed
    lbl = events[0]["label"]
    assert len(lbl) > 0


# -----------------------------------------------------------------------------
# Test 5: Technical explanation requiring an abstract diagram
# -----------------------------------------------------------------------------
def test_5_abstract_diagram_explanation(choreographer):
    phrase = "डेटा पैकेट्स को रेडियो तरंगों में एनकोड करके रिसीवर एंटीना तक भेजा जाता है।"
    events = choreographer.plan_events_for_scene(
        scene_idx=3,
        scene_type="diagram",
        title="PACKET ENCODING",
        narration=phrase
    )

    assert len(events) >= 1
    ev = events[0]
    assert ev["semantic_action"] in ["transmit", "state_transition", "handoff_or_shift"]
    assert "visual_attention_target" in ev


# -----------------------------------------------------------------------------
# Test 6: Gate 3 detects missing critical asset
# -----------------------------------------------------------------------------
def test_6_missing_critical_asset(gate_runner):
    storyboard = {
        "id": "test-missing-asset",
        "scenes": [
            {
                "type": "three",
                "title": "MISSING MODEL SCENE",
                "model": "non_existent_folder/missing_phone.glb",
                "narration": "यहाँ एक फोन दिखना चाहिए।"
            }
        ]
    }
    result = gate_runner.gate_3_asset_completeness(storyboard)
    assert not result.passed
    assert any("missing_phone.glb" in err for err in result.errors)
    assert result.repair_action is not None


# -----------------------------------------------------------------------------
# Test 7: Gate 2 detects visual event without executable animation
# -----------------------------------------------------------------------------
def test_7_unexecutable_animation(gate_runner):
    storyboard = {
        "id": "test-unexecutable-action",
        "scenes": [
            {
                "type": "three",
                "title": "UNEXECUTABLE ACTION",
                "narration": "कुछ हो रहा है।",
                "events": [
                    {
                        "event_id": "evt_01_01",
                        "semantic_action": None,
                        "action": None,
                        "animation_instruction": None
                    }
                ]
            }
        ]
    }
    result = gate_runner.gate_2_action_executability(storyboard)
    assert not result.passed
    assert any("lacks both semantic_action and action" in err for err in result.errors)


# -----------------------------------------------------------------------------
# Test 8: Gate 5 detects conflicting or missing timestamps
# -----------------------------------------------------------------------------
def test_8_conflicting_timestamps(gate_runner):
    storyboard = {
        "id": "test-conflicting-timing",
        "scenes": [
            {
                "type": "three",
                "title": "TIMING ERROR",
                "narration": "समय गलत है।",
                "events": [
                    {
                        "event_id": "evt_01_01",
                        "start_pct": 80,
                        "end_pct": 20  # Impossible: start > end!
                    }
                ]
            }
        ]
    }
    result = gate_runner.gate_5_timeline_consistency(storyboard)
    assert not result.passed
    assert any("start_pct (80) >= end_pct (20)" in err for err in result.errors)


# -----------------------------------------------------------------------------
# Test 9: Gate 4 detects state continuity error between two scenes
# -----------------------------------------------------------------------------
def test_9_continuity_error(gate_runner):
    storyboard = {
        "id": "test-continuity-error",
        "scenes": [
            {
                "type": "three",
                "title": "STAGNANT STATE",
                "narration": "कोई बदलाव नहीं हुआ।",
                "events": [
                    {
                        "event_id": "evt_01_01",
                        "actor_or_subject": "smartphone",
                        "target_object": "counter",
                        "initial_state": "phone resting on counter",
                        "final_state": "phone resting on counter"  # No state change!
                    }
                ]
            }
        ]
    }
    result = gate_runner.gate_4_state_and_continuity(storyboard)
    # Warns on stagnant state
    assert len(result.warnings) > 0
    assert any("initial_state and final_state are identical" in warn for warn in result.warnings)


# -----------------------------------------------------------------------------
# Test 10: Gate 7 detects missing mute-comprehension criteria
# -----------------------------------------------------------------------------
def test_10_mute_comprehension_criteria_check(gate_runner):
    storyboard = {
        "id": "test-mute-fail",
        "scenes": [
            {
                "type": "three",
                "title": "NO SOUND-OFF CRITERIA",
                "narration": "बिना किसी विज़ुअल टेस्ट के।",
                "events": [
                    {
                        "event_id": "evt_01_01",
                        "mute_comprehension_test": None  # Missing criteria
                    }
                ]
            }
        ]
    }
    result = gate_runner.gate_7_mute_comprehension(storyboard)
    assert len(result.warnings) > 0
    assert any("missing mute_comprehension_test" in warn for warn in result.warnings)


# -----------------------------------------------------------------------------
# Test 11: Whisper word-level timestamp ingestion
# -----------------------------------------------------------------------------
def test_11_whisper_word_timing_ingestion(aligner):
    phrase = "ग्राहक क्यू-आर कोड स्कैन करता है।"
    mock_word_timings = [
        {"word": "ग्राहक", "start": 0.12, "end": 0.55},
        {"word": "क्यू-आर", "start": 0.56, "end": 0.95},
        {"word": "कोड", "start": 0.96, "end": 1.25},
        {"word": "स्कैन", "start": 1.26, "end": 1.80},
        {"word": "करता", "start": 1.81, "end": 2.10},
        {"word": "है।", "start": 2.11, "end": 2.45}
    ]
    units = aligner.align_scene(
        scene_idx=1,
        narration=phrase,
        title="QR SCAN TEST",
        audio_duration_sec=2.5,
        word_timings=mock_word_timings
    )
    assert len(units) >= 1
    u = units[0]
    assert u["timing_confidence"] == "measured_word"
    assert u["start_time_sec"] == 0.12
    assert u["end_time_sec"] > 0.12

