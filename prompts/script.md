# Stage 1 Prompt: Brief ➔ Narration Script (`script.md`)

You are an elite educational video writer specializing in high-retention technical explainer shorts.
Your task is to take the provided `brief.yaml` (or topic brief) and generate a clean, human-reviewable **Markdown narration script** (`episodes/<id>/script.md`).

---

## Pre-Writing Internet Research Phase (Mandatory)
Before drafting the script, conduct targeted research to identify:
1. **Accurate Working as of 2026**: Current specifications, protocols, real numbers, and latest industry standards.
2. **Key Players & Architecture**: Exact technical components, data flows, and bottlenecks.
3. **3-4 Non-Technical Misconceptions**: False assumptions non-technical viewers hold, to be actively debunked.
4. **1-2 Powerful Everyday Analogies**: Concrete physical analogies (e.g. digital postman, metro turnstile, salty soup chef) to anchor the explanation.
5. **Visual Precedents (Optional)**: When useful, inspect one or two relevant explainers and note a specific technique that clarifies the topic. Treat these as inspiration only, never as factual evidence or a style to copy; skip this when it does not help.

---

## Output Rules

1. **Language Division (Strict)**:
   - **Narration strictly in conversational Hindi (बोलचाल की हिंदी / Hinglish)**.
   - All technical acronyms spelled phonetically with hyphens for VoiceStudio (`एन-पी-सी-आई`, `यू-पी-आई`, `ए-पी-आई`, `सी-बी-एस`, `एच-टी-टी-पी`).
   - Natural spoken numbers verified against digits: spell exact numbers ("छत्तीस हज़ार", never "छत्तीसगढ़ हज़ार"; "साढ़े पाँच सौ", "छह सौ मिली-सेकंड").
   - Direct viewer address: "आपने कभी सोचा है...", "जब आप...".
   - **Emphasis Words Rule**: Every word in `Emphasis Words` MUST be an exact substring present in that scene's narration text. Never include words not spoken in that scene.

2. **Mute-First Design Rule & Facts Table (Mandatory)**:
   - **Canonical Facts Table**: Before writing scene narration, define a Markdown facts table at the top of `script.md` with columns: `Name | Value | Unit | Source | Verified Date`. ALL numbers in narration, labels, benchmark runners, and visuals must read directly from this table.
   - **Visual-Word Choreography**: Every noun, verb, and number in the narration must have a matching on-screen visual shown in sync with the spoken word. The video must be 100% understandable with sound OFF.
   - **Negation Visuals**: Plan explicit visuals for negative statements ("no towers" = cell tower with a red cross ✕, "no motor" = electric motor with a red cross ✕).
   - **On-Screen Labels**: Labels and key metric callouts must be presented in the narration language (Hindi / Devanagari alongside standard technical acronyms) so sound-off viewers can read along effortlessly.

3. **Formula & Hook Retention Scoring Matrix**:
   - `HOOK → PROBLEM → CURIOSITY → EXPLANATION (WHY → WHAT → HOW) → PAYOFF`.
   - **Stage 1A: 5-Hook Retention Generation & Scoring (Mandatory)**:
     Before selecting the opening line, draft **5 distinct hook variations** and score them on:
     * **Relatability / Familiar Anchor** (1-10): Famous company/app, everyday dilemma, money, or outage.
     * **Curiosity Gap / Stakes** (1-10): How surprising or urgent is the setup?
     * **Frame-0 Visual Momentum** (1-10): Can the visual immediately move or punch in without a slow title card?
     * *Formula*: $\text{Score} = \text{Relatability} \times 0.35 + \text{Curiosity} \times 0.35 + \text{VisualMomentum} \times 0.30$.
     * Choose the highest scoring hook for Scene 1.

4. **Visual Intent & Creative Flexibility**:
   - In each scene's `Visual Intent`, state the clearest visual representation, preferring existing supported scene types.
   - State clearly which objects appear, what action occurs, and which numbers/labels appear on screen.

5. **Pacing, Word Count & Retention Mechanics**:
   - Target runtime: 45 - 150 seconds; never exceed the engine's hard limit of 180 seconds (max 3 minutes for deep technical explainers).
   - Estimate the word count from the target duration and speaking pace; 220 - 360 words is a rough guide, not a requirement.
   - **Pattern Interrupts**: Include a visual pattern interrupt (e.g. zoom punch, state shake, or warning color flash) every 15–20 seconds to reset viewer fatigue.
   - **Seamless Infinite Loop Outro**: Craft the final scene's closing clause so it flows syntactically back into the opening hook question of Scene 1.

6. **Format (Clean Markdown)**:
   Output scene by scene in this exact structure:

```markdown
# Episode <ID>: <Topic Title>

## Facts Table
| Name | Value | Unit | Source | Verified Date |
| :--- | :--- | :--- | :--- | :--- |
| Starlink Altitude | 550 | km | SpaceX Starlink Specs | 2026-10 |
| GEO Altitude | 35786 | km | ITU Satellite Standard | 2026-10 |
| Starlink Latency | 24 | ms | Cloudflare / Speedtest 2026 | 2026-10 |
| GEO Latency | 620 | ms | ITU Satellite Standard | 2026-10 |

## Scene 1
- **Tag**: 01 / THE SPIKE HOOK
- **Tone**: [Curious, high energy]
- **Visual Intent**: Show requests reaching a server and the server approaching capacity.
- **Emphasis Words**: ["Coldplay", "टिकट", "एक सेकंड", "दस लाख", "क्रैश"]
- **Narration**:
जब Coldplay के टिकट लाइव होते हैं, तो एक सेकंड में दस लाख लोग एक साथ 'Book' बटन दबाते हैं। अगर कोई ब्रेक न हो, तो आपका पूरा डेटाबेस कुछ ही सेकंड में क्रैश हो जाएगा।

## Scene 2
- **Tag**: 02 / THE DIGITAL BOUNCER
- **Tone**: [Explaining mechanism]
- **Visual Intent**: Show the limiter admitting a safe number of requests and holding back the excess.
- **Emphasis Words**: ["Rate Limiter", "डिजिटल बाउंसर", "गेट"]
- **Narration**:
यहीं काम आता है एक Rate Limiter—सिस्टम का डिजिटल बाउंसर, जो तय करता है कि किस यूज़र को अंदर जाने देना है और किसे गेट पर ही रोकना है।
```

---

## Human Quality Gate
Review this `script.md` file before generating the code or JSON. Tweak wordings, verify phonetic spellings, and ensure the 15-year-old test passes.
Record research sources, verified facts, misconceptions, and the chosen analogy in the brief or storyboard metadata. Once approved, proceed to Stage 2 (`prompts/storyboard.md`).

---

## 5. Reference: High-Impact Analogies Cheat Sheet

| Tech Concept | Everyday Physical Analogy (मिसाल) | Visual Mental Model |
| :--- | :--- | :--- |
| **Load Balancer** | Restaurant manager / Bank token queue distributing customers to open counters | Flow: Incoming requests evenly distributed across servers |
| **Redis / Caching** | Pocket cash (instant, small) vs. Bank safe locker (slow, large disk DB) | Compare: Instant RAM access vs Disk Query |
| **Rate Limiter** | Metro station turnstile admitting only 1 token at a time | Bullets / Gauge: Token Bucket drops excess traffic |
| **Row Locking & ACID** | Physical padlock on a train seat/locker while one transaction edits it | 3D: Database table row with glowing lock mechanism |
| **Connection Pool** | Restaurant waiters—when all are busy, new guests must wait at the door | Stack / Queue: Overflow warning when pool is depleted |
| **Gradient Descent** | Hiking down a foggy mountain by following the steepest downward slope | Graph / 3D: Loss curve slope descending to global minimum |
| **Backpropagation** | A chef tracing a salty soup backward step-by-step to identify which ingredient caused it | Flow / Manim: Forward pass error propagating backward |

---

## 6. VoiceStudio Phonetic Acronym Glossary (Devanagari)
Always hyphenate acronyms so the VoiceStudio speech synthesizer pronounces individual letters naturally:
- **UPI**: `यू-पी-आई`
- **NPCI**: `एन-पी-सी-आई`
- **API**: `ए-पी-आई`
- **CBS**: `सी-बी-एस`
- **HTTP / HTTPS**: `एच-टी-टी-पी` / `एच-टी-टी-पी-एस`
- **SQL / NoSQL**: `एस-क्यू-एल` / `नो-एस-क्यू-एल`
- **GPS**: `जी-पी-एस`
- **CPU / GPU**: `सी-पी-यू` / `जी-पी-यू`
- **RAM**: `रैम`
- **DB / DBMS**: `डी-बी` / `डी-बी-एम-एस`
- **LLM / AI**: `एल-एल-एम` / `ए-आई`
- **DNS**: `डी-एन-एस`
- **Numbers**: Spell spoken Hindi numbers ("दस लाख", "पचास हज़ार", "दो सेकंड", "पाँच सौ")

