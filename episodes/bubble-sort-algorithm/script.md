# Episode: How Bubble Sort Algorithm Works (बबल सॉर्ट एल्गोरिदम)

## Scene 1
- **Tag**: 01 / THE SORTING PUZZLE
- **Tone**: [Curious, high energy]
- **Visual Intent**: An unsorted, chaotic array of glowing digital number cards `[5, 1, 4, 2, 8]` on screen. The cards shuffle and an orderly ascending lineup is previewed with a glowing lock icon.
- **Narration**:
जब आप ऑनलाइन शॉपिंग करते हैं और 'Price Low to High' दबाते हैं, तो आपका फोन सेकंड के सौवें हिस्से में हजारों प्रोडक्ट्स को सही क्रम में कैसे सजा देता है? कंप्यूटर साइंस का सबसे पहला और जादुई तरीका है—बबल सॉर्ट!

## Scene 2
- **Tag**: 02 / THE ASSEMBLY LINEUP
- **Tone**: [Explaining mechanism, warm]
- **Visual Intent**: Interactive sorting visualizer demonstrating the school morning assembly analogy. Two adjacent students/number cards `[5, 1]` highlighted under a glowing comparison scanner beam with a swap preview.
- **Narration**:
स्कूल की मॉर्निंग असेंबली याद कीजिए। मान लीजिए पाँच स्टूडेंट्स बिना किसी क्रम के खड़े हैं। बबल सॉर्ट का सीधा नियम है—सिर्फ अपने पास वाले साथी की हाइट देखो। अगर बायाँ साथी लंबा है, तो दोनों जगह बदल लो!

## Scene 3
- **Tag**: 03 / THE STEP-BY-STEP SWAP
- **Tone**: [Analytical, structured]
- **Visual Intent**: A crisp Mermaid sequence flow showing the 3 core algorithmic steps: Compare `A[j] > A[j+1]`? -> Yes: Swap -> Increment Index -> Locked at End.
- **Narration**:
यह पूरा खेल तीन स्टेप्स पर चलता है। पहले पड़ोसियों की तुलना करो। अगर पहला नंबर बड़ा है, तो स्वैप करो। फिर एक कदम आगे बढ़ो। लाइन के अंत में पहुँचते ही सबसे बड़ा नंबर सही जगह पहुँच जाता है!

## Scene 4
- **Tag**: 04 / BUBBLING TO THE TOP
- **Tone**: [Excited, revealing]
- **Visual Intent**: Interactive sorting visualizer showing Pass 1 in action: 8 is captured by the sliding scanner window and bubbles all the way to index 4, locking in with an emerald green glow and lock badge `[1, 4, 2, 5, 8]`. The unsorted active arena shrinks.
- **Narration**:
जैसे पानी में हवा का बुलबुला ऊपर तैरता है, ठीक वैसे ही हर पास में सबसे बड़ा नंबर तैरते-तैरते ए-रे के आखिरी कोने में लॉक हो जाता है। और सबसे खूबसूरत बात? अगले राउंड में आपको उस आखिरी नंबर को दोबारा छूना भी नहीं पड़ता!

## Scene 5
- **Tag**: 05 / THE NESTED LOOP LOGIC
- **Tone**: [Clear, instructional]
- **Visual Intent**: Clean developer code editor displaying 6 lines of Python code with animated line highlighting: outer pass loop and inner comparison loop with swap condition.
- **Narration**:
कोड में यह सिर्फ दो नेस्टेड लूप्स का खेल है। बाहरी लूप तय करता है कि कितने पासेस होंगे, और अंदरूनी लूप हर बार एक छोटी होती रेंज में पड़ोसियों की तुलना करके स्वैप करता जाता है।

## Scene 6
- **Tag**: 06 / THE O(N) SMART TRICK
- **Tone**: [Intriguing, revealing]
- **Visual Intent**: Side-by-side comparison card showing Standard Bubble Sort vs Optimized Bubble Sort with the boolean `swapped = False` flag. Zero swaps in Pass 1 triggers an immediate early exit.
- **Narration**:
क्या बबल सॉर्ट हमेशा धीमा होता है? बिल्कुल नहीं! अगर हम सिर्फ एक बूलियन फ़्लैग जोड़ दें, और एक भी स्वैप न हो, तो सिस्टम समझ जाता है कि लिस्ट सॉर्टेड है—और काम तुरंत ओ-एन टाइम में खत्म हो जाता है!

## Scene 7
- **Tag**: 07 / REAL-WORLD BENCHMARK
- **Tone**: [Curious, high energy]
- **Visual Intent**: Performance benchmark race on 1,000 items: Bubble Sort ($O(n^2)$) taking ~500,000 operations vs QuickSort ($O(n \log n)$) taking just ~10,000 operations (Winner).
- **Narration**:
पर बड़े डेटा पर कहानी बदल जाती है। एक हज़ार नंबरों के लिए बबल सॉर्ट को पाँच लाख बार तुलना करनी पड़ती है, जबकि क्विक-सॉर्ट यही काम सिर्फ दस हज़ार स्टेप्स में पूरा कर देता है!

## Scene 8
- **Tag**: 08 / THE ALGORITHMIC FOUNDATION
- **Tone**: [Inspiring, upbeat]
- **Visual Intent**: Outro payoff screen with shining glowing badge, summary takeaway card `FOUNDATION OF COMPUTER SCIENCE`, and channel subscribe CTA.
- **Narration**:
बबल सॉर्ट भले ही सबसे तेज़ न हो, लेकिन कंप्यूटर को सोचना सिखाने की शुरुआत यहीं से होती है। ऐसे ही कंप्यूटर साइंस के गहरे कॉन्सेप्ट आसानी से समझने के लिए अभी फ़ॉलो कीजिए!
