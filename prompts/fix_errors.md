The JSON script you gave me was checked by my video software and has problems.
Fix every ERROR below. Also fix the warnings where reasonable.
Keep the content and meaning the same unless a fix requires changing it.
Follow the same output rules as before: output ONLY the complete corrected JSON object,
no explanation, no markdown fences.

CRITICAL RULES & FORMAT CHECKS:
1. Every scene MUST include a 6-key structured "visual" object ("camera", "objects", "action", "motion_graphics", "start", "end") describing relevant visual content and state changes. A stable 2D/2.5D diagram is valid; use 3D only when it improves understanding.
2. Use a concise "tag" when it helps orient the viewer; do not force a header onto scenes that read more clearly without one.
3. Language division: "narration" strictly in conversational Hindi with technical acronyms spelled phonetically (एन-पी-सी-आई, यू-पी-आई, क्यू-आर, ए-पी-आई, सी-बी-एस, एच-एस-एम) and numbers spelled out. Designed on-screen text, labels, metrics, and diagrams are in English. Captions preserve the approved narration verbatim in Devanagari.
4. Default to "art_direction": "editorial". Use "cinematic" only when its global camera drift, bokeh, color grade, and light sweeps help the video.
5. LaTeX: write every backslash twice in JSON ("\\frac", "\\theta").
6. No trailing commas or invalid JSON syntax.

VALIDATOR OUTPUT:
<paste the output of: python3 validate.py episodes/<id>/storyboard.json>
