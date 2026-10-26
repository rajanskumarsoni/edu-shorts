#!/usr/bin/env python3
"""
Narration Alignment Layer (Stage B) for Educational Video Generation.

Transforms narration text (Hindi, English, or mixed Hinglish) into a structured
alignment manifest containing:
- Exact source-text spans and phrase boundaries
- Physical actors, targets, and environmental context
- Physical actions, state transitions, and cause-and-effect links
- Concurrent/parallel actions
- Explanatory visual evidence requirements
- Sound-off comprehension criteria and on-screen labels
- Actual or estimated audio timestamps
"""

import re
import json
from pathlib import Path
from typing import List, Dict, Any, Optional

try:
    import subprocess
except ImportError:
    pass


ENTITY_PATTERNS = {
    # Retail / Payments / Devices
    "customer": r"\b(?:ग्राहक|यूजर|आप|कस्टमर|customer|user|buyer)\b",
    "shopkeeper": r"\b(?:दुकानदार|मर्चेंट|व्यापारी|shopkeeper|merchant|seller)\b",
    "smartphone": r"\b(?:फोन|स्मार्टफोन|मोबाइल|phone|smartphone|mobile|device)\b",
    "qr_code": r"\b(?:क्यू-आर|क्यूआर|qr|qr[\s-]?code|कोड)\b",
    "earbuds": r"\b(?:इयर-बड्स|ईयरबड|हेडफोन|earbuds|headphones|airpods)\b",
    "counter": r"\b(?:काउंटर|दुकान|स्टोर|shop|store|counter|table)\b",
    "payment_screen": r"\b(?:स्क्रीन|पेमेंट|यू-पी-आई|upi|pin|इंटरफ़ेस|screen)\b",
    # Aerospace / Satellite / Physics
    "satellite": r"\b(?:सैटेलाइट|उपग्रह|satellite|orbiter|craft)\b",
    "dish": r"\b(?:डिश|छतरी|टर्मिनल|dish|terminal|antenna)\b",
    "laser": r"\b(?:लेज़र|बीम|laser|beam|light|किरण)\b",
    "earth": r"\b(?:पृथ्वी|धरती|ग्लोब|earth|globe|planet)\b",
    "mountain_peak": r"\b(?:पहाड़|माउंट एवरेस्ट|चोटी|peak|mountain)\b",
    "ocean": r"\b(?:समंदर|समुद्र|महासागर|ocean|sea)\b",
    "server": r"\b(?:सर्वर|डेटासेंटर|बैंक|server|datacenter|bank|ledger)\b",
    "radio_wave": r"\b(?:रेडियो|वेव्ज़|तरंग|frequency|radio)\b"
}

ACTION_PATTERNS = {
    "scan": r"\b(?:स्कैन|देखते|framing|aim|scan|points)\b",
    "raise_or_hold": r"\b(?:उठा|पकड़|हाथ में|hold|raise|lift)\b",
    "connect": r"\b(?:जुड़|कनेक्ट|लिंक|पेयर|connect|pair|handshake)\b",
    "transmit": r"\b(?:भेज|ट्रांसफर|सेंड|ब्रॉडकास्ट|transmit|beam|send)\b",
    "receive_or_decode": r"\b(?:पहुँच|रिसीव|डिकोड|receive|decode|unpack)\b",
    "vibrate_or_sound": r"\b(?:वाइब्रेट|आवाज़|म्यूज़िक|sound|vibrate|play)\b",
    "orbit_or_travel": r"\b(?:उड़|दौड़|घूम|चक्कर|orbit|speed|fly|travel)\b",
    "handoff_or_shift": r"\b(?:शिफ्ट|छलांग|हैंडऑफ|shift|hop|switch)\b",
    "pack_goods": r"\b(?:पैक|सामान|थैला|pack|bag|goods)\b",
    "authorize_or_pay": r"\b(?:पेमेंट|पैसे|सफल|सक्सेस|pay|success|auth)\b"
}

CONCURRENT_MARKERS = [
    r"साथ ही",
    r"उसी समय",
    r"एक तरफ.*दूसरी तरफ",
    r"while\b",
    r"meanwhile\b",
    r"at the same time\b"
]

CAUSAL_MARKERS = [
    r"की वजह से",
    r"इसलिए",
    r"जिससे",
    r"तो",
    r"ताकि",
    r"परिणामस्वरूप",
    r"because\b",
    r"so that\b",
    r"results in\b"
]


class NarrationAligner:
    """Segments narration into causally linked, physical visual units."""

    def __init__(self, fps: int = 30):
        self.fps = fps

    def extract_source_spans(self, narration: str) -> List[Dict[str, Any]]:
        """Splits text on natural syntactic boundaries while tracking exact char indices."""
        clean = narration.strip()
        if not clean:
            return []

        # Boundaries: Devanagari danda, ?, !, semicolon, comma, or conjunction markers
        pattern = r'([।\?!;—]+|\.\s+|(?:,\s*|\s+(?=लेकिन|जो|जहां|और|तो|बिना|परंतु|यानी|साथ ही|फिर|तथा)))'
        tokens = re.split(pattern, clean)

        spans = []
        char_cursor = 0
        buf_text = ""
        start_idx = 0

        for part in tokens:
            if not part:
                continue
            if re.match(pattern, part):
                buf_text += part
                end_idx = start_idx + len(buf_text)
                txt = buf_text.strip()
                if txt and len(txt) > 3:
                    spans.append({
                        "text": txt,
                        "start_char": start_idx,
                        "end_char": end_idx
                    })
                start_idx = end_idx
                buf_text = ""
            else:
                if not buf_text:
                    start_idx = clean.find(part, char_cursor)
                buf_text += part
                char_cursor = start_idx + len(buf_text)

        if buf_text.strip():
            txt = buf_text.strip()
            spans.append({
                "text": txt,
                "start_char": start_idx,
                "end_char": start_idx + len(buf_text)
            })

        return spans

    def analyze_span_entities_and_actions(self, text: str) -> Dict[str, Any]:
        """Extracts actors, targets, actions, environments, and numbers from a text span."""
        found_entities = []
        for ent_name, pat in ENTITY_PATTERNS.items():
            if re.search(pat, text, re.I):
                found_entities.append(ent_name)

        found_actions = []
        for act_name, pat in ACTION_PATTERNS.items():
            if re.search(pat, text, re.I):
                found_actions.append(act_name)

        # Numbers and units
        numbers = re.findall(
            r'\b\d+(?:[\.,]\d+)?(?:\s*(?:km/h|km|ms|Mbps|Gbps|min|s|%|k|M|GHz|MHz|GB|TB))?\b|₹[\d,]+|\$[\d,]+',
            text, re.I
        )
        # Hindi numbers
        hindi_numbers = re.findall(
            r'\b(?:दो सौ|साढ़े पाँच सौ|सत्ताईस हज़ार|छत्तीस हज़ार|छह सौ|पच्चीस|दो से तीन|सैंतालीस|छह हज़ार|हज़ारों)\b',
            text
        )

        is_negation = bool(re.search(r'\b(?:बिना|नहीं|शून्य|zero|no|never)\b', text, re.I))
        is_concurrent = any(re.search(pat, text, re.I) for pat in CONCURRENT_MARKERS)
        is_causal = any(re.search(pat, text, re.I) for pat in CAUSAL_MARKERS)

        return {
            "entities": found_entities,
            "actions": found_actions,
            "numbers": numbers + hindi_numbers,
            "is_negation": is_negation,
            "is_concurrent": is_concurrent,
            "is_causal": is_causal
        }

    def align_scene(
        self,
        scene_idx: int,
        narration: str,
        title: str,
        audio_duration_sec: Optional[float] = None,
        word_timings: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """Produces a structured alignment manifest for one scene."""
        clean_narr = narration.strip()
        raw_spans = self.extract_source_spans(clean_narr)

        if not raw_spans:
            raw_spans = [{"text": clean_narr or title, "start_char": 0, "end_char": len(clean_narr or title)}]

        # Merge short adjacent fragments only if they do not contain distinct actions
        merged_spans = []
        acc = None
        for s in raw_spans:
            if acc is None:
                acc = dict(s)
            else:
                acc_analysis = self.analyze_span_entities_and_actions(acc["text"])
                s_analysis = self.analyze_span_entities_and_actions(s["text"])
                has_distinct_actions = bool(acc_analysis["actions"] and s_analysis["actions"])

                # If both fragments contain distinct actions or are substantial, preserve both
                if not has_distinct_actions and (len(acc["text"].split()) + len(s["text"].split()) < 6):
                    acc["text"] += " " + s["text"]
                    acc["end_char"] = s["end_char"]
                else:
                    merged_spans.append(acc)
                    acc = dict(s)
        if acc:
            merged_spans.append(acc)

        num_spans = len(merged_spans)
        total_words = sum(len(s["text"].split()) for s in merged_spans) or 1
        scene_duration = audio_duration_sec or max(3.0, total_words / 2.5)

        has_word_timings = bool(word_timings and isinstance(word_timings, list) and len(word_timings) > 0)
        word_cursor = 0
        elapsed_sec = 0.0
        aligned_units = []

        for i, span in enumerate(merged_spans):
            span_words = len(span["text"].split())
            frac = span_words / total_words
            est_span_duration = max(1.5, frac * scene_duration)

            if has_word_timings and word_cursor < len(word_timings):
                span_w_list = word_timings[word_cursor : word_cursor + span_words]
                word_cursor += span_words
                if span_w_list:
                    start_sec = float(span_w_list[0].get("start", span_w_list[0].get("start_time", elapsed_sec)))
                    end_sec = float(span_w_list[-1].get("end", span_w_list[-1].get("end_time", start_sec + est_span_duration)))
                    s_pct = int(round((start_sec / scene_duration) * 100))
                    e_pct = int(round((end_sec / scene_duration) * 100))
                    timing_confidence = "measured_word"
                else:
                    start_sec = elapsed_sec
                    end_sec = elapsed_sec + est_span_duration
                    s_pct = int(round((elapsed_sec / scene_duration) * 100))
                    e_pct = int(round(((elapsed_sec + est_span_duration) / scene_duration) * 100))
                    timing_confidence = "measured_segment" if audio_duration_sec else "estimated_phrase"
            else:
                start_sec = elapsed_sec
                end_sec = elapsed_sec + est_span_duration
                s_pct = int(round((elapsed_sec / scene_duration) * 100))
                e_pct = int(round(((elapsed_sec + est_span_duration) / scene_duration) * 100))
                timing_confidence = "measured_segment" if audio_duration_sec else "estimated_phrase"

            if i == num_spans - 1:
                e_pct = 100
            if s_pct >= e_pct:
                e_pct = min(100, s_pct + 10)

            analysis = self.analyze_span_entities_and_actions(span["text"])

            unit_id = f"seg_{scene_idx:02d}_{i + 1:02d}"

            # Formulate mute comprehension test question
            if analysis["is_negation"]:
                q = f"What is being explicitly eliminated or rejected in this step?"
                ans = f"Rejection/absence indicator for {span['text'][:35]}."
            elif analysis["numbers"]:
                q = f"What exact metric or threshold is established on-screen?"
                ans = f"Metric {analysis['numbers'][0]} displayed in active telemetry."
            elif analysis["actions"]:
                q = f"What physical action occurs?"
                ans = f"Action: {analysis['actions'][0]} performed on {analysis['entities'] or 'focal object'}."
            else:
                q = f"What key transition or relationship is illustrated?"
                ans = f"State transition explaining: {span['text'][:35]}."

            aligned_units.append({
                "segment_id": unit_id,
                "source_text_span": {
                    "start_char": span["start_char"],
                    "end_char": span["end_char"],
                    "text": span["text"]
                },
                "entities": analysis["entities"],
                "actions": analysis["actions"],
                "numbers": analysis["numbers"],
                "is_negation": analysis["is_negation"],
                "is_concurrent": analysis["is_concurrent"],
                "is_causal": analysis["is_causal"],
                "start_time_sec": round(start_sec, 2),
                "end_time_sec": round(end_sec, 2),
                "start_pct": s_pct,
                "end_pct": e_pct,
                "timing_confidence": timing_confidence,
                "mute_comprehension_criteria": {
                    "question": q,
                    "expected_evidence": ans
                }
            })

            elapsed_sec += est_span_duration

        return aligned_units

    def align_narration(self, scenes: List[Dict[str, Any]], ep_dir: Optional[Path] = None) -> List[Dict[str, Any]]:
        """Convenience method to align all scenes in an episode."""
        return align_storyboard_narration({"scenes": scenes}, ep_dir)


def align_storyboard_narration(storyboard: Dict[str, Any], ep_dir: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Generates a complete episode-level narration alignment manifest."""
    aligner = NarrationAligner()
    scenes = storyboard.get("scenes", [])
    coverage_map = []

    for idx, scene in enumerate(scenes, 1):
        narr = scene.get("narration", "")
        title = scene.get("title", f"Scene {idx}")

        # Check if actual audio file exists in ep_dir / audio /
        audio_dur = None
        word_timings = None
        if ep_dir:
            audio_candidate = ep_dir / "audio" / f"s{idx}.mp3"
            if not audio_candidate.exists():
                audio_candidate = ep_dir / "audio" / f"s{idx}.wav"
            if audio_candidate.exists():
                try:
                    from pipeline import audio_duration
                    audio_dur = audio_duration(audio_candidate)
                except Exception:
                    pass

            timing_candidates = [
                ep_dir / "audio" / f"s{idx}_words.json",
                ep_dir / "audio" / f"s{idx}.words.json",
                ep_dir / "audio" / f"s{idx}_align.json"
            ]
            for tc in timing_candidates:
                if tc.exists():
                    try:
                        with open(tc, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            word_timings = data if isinstance(data, list) else data.get("words", [])
                        break
                    except Exception:
                        pass

        units = aligner.align_scene(idx, narr, title, audio_dur, word_timings=word_timings)
        coverage_map.append({
            "scene_index": idx,
            "scene_title": title,
            "segments": units
        })

    return coverage_map


if __name__ == "__main__":
    import sys
    test_text = "जब हम दुकान में क्यू-आर कोड स्कैन करते हैं, तो फोन स्क्रीन पर पेमेंट पेज खुलता है। साथ ही दुकानदार सामान पैक करने लगता है।"
    aligner = NarrationAligner()
    res = aligner.align_scene(1, test_text, "QR PAYMENT DEMO")
    print(json.dumps(res, indent=2, ensure_ascii=False))
