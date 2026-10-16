# Episode: How Linear Search Algorithm Works (लीनियर सर्च एल्गोरिदम)

## Scene 1
- **Tag**: 01 / THE NAME ON THE REGISTER
- **Tone**: [Curious, conversational]
- **Visual Intent**: An authentic classroom attendance register opens with 5 unsorted names [KABIR, ZOYA, AMAN, MIRA, DEV]. A search target badge displays "TARGET: MIRA" and a robotic scanning pointer aligns at row 1 (index 0) with a downward action direction arrow.
- **Narration**:
शिक्षक के पास कक्षा का एक रजिस्टर है। नाम किसी खास क्रम में नहीं हैं। उन्हें मीरा का नाम ढूँढना है। कंप्यूटर कहाँ से शुरू करेगा?

## Scene 2
- **Tag**: 02 / ONE ENTRY AT A TIME
- **Tone**: [Clear, direct]
- **Visual Intent**: A clean 4-step vertical timeline showing the algorithmic control flow of Linear Search: Start at first entry -> Compare with target -> Mismatch: move one row -> Match or end: stop.
- **Narration**:
Linear Search का नियम सीधा है। पहली entry से शुरू करो। नाम को target से मिलाओ। Match नहीं? अगली entry पर जाओ। Match मिले या list खत्म हो—तभी रुक जाओ।

## Scene 3
- **Tag**: 03 / FOLLOW THE POINTER
- **Tone**: [Explaining mechanism, synchronized]
- **Visual Intent**: Interactive Linear Search visualizer with word-by-word synchronicity. Pointer inspects KABIR (Mismatch ❌), slides down along action vector to ZOYA (Mismatch ❌), slides down to AMAN (Mismatch ❌), then locks onto MIRA (MATCH! ✅). A bold red stop barrier appears; DEV is marked as skipped.
- **Narration**:
पहले कबीर—मीरा नहीं। अगली लाइन, ज़ोया—नहीं। फिर अमन—नहीं। अब मीरा—मिल गई! यहीं रुकते हैं; देव को जाँचने की ज़रूरत नहीं।

## Scene 4
- **Tag**: 04 / THE WORST CASE
- **Tone**: [Analytical, informative]
- **Visual Intent**: Bold stat card highlighting Big-O worst-case time complexity O(N). Visual breakdown shows Best Case O(1) (1 comparison at start) vs Worst Case O(N) (N comparisons when item is at end or absent).
- **Narration**:
अगर नाम आख़िरी पंक्ति पर हो, या मिले ही नहीं, तो हर entry देखनी पड़ सकती है। N entries वाली list में worst case N checks तक जा सकता है।

## Scene 5
- **Tag**: 05 / REACH THE END
- **Tone**: [Rapid, energetic demonstration]
- **Visual Intent**: Rapid sequential scan searching for NISHA (an absent target). Pointer steps down through all 5 rows (Kabir? ❌ Zoya? ❌ Aman? ❌ Mira? ❌ Dev? ❌) and hits the end-of-list boundary, confirming ELEMENT NOT FOUND (-1).
- **Narration**:
अब निशा को खोजो। कबीर? नहीं। ज़ोया? नहीं। अमन? नहीं। मीरा? नहीं। देव? नहीं। पूरी list जाँच ली—निशा यहाँ नहीं है।

## Scene 6
- **Tag**: 06 / FOUND OR NOT FOUND
- **Tone**: [Structured, takeaway]
- **Visual Intent**: Mermaid flowchart showing the complete decision tree: Compare target -> Match? Yes: Return Index / Stop; No: More entries? Yes: Advance row; No: Return -1 / Not Found.
- **Narration**:
मीरा चौथी entry पर मिल गई, इसलिए आख़िरी नाम देखना नहीं पड़ा। निशा नहीं मिली, इसलिए पूरी list जाँची। हर बार वही तरीका—एक-एक entry, उसी क्रम में।

## Scene 7
- **Tag**: 07 / THE SIMPLE RULE
- **Tone**: [Inspiring, upbeat]
- **Visual Intent**: Final payoff outro with glowing computer science summary: "CHECK · ADVANCE · STOP", Time Complexity O(1) / O(N), Space Complexity O(1), and channel follow CTA.
- **Narration**:
बस यही Linear Search है: एक entry देखो, target से मिलाओ, और फैसला करो—आगे बढ़ना है या रुकना। कंप्यूटर की search भी रोज़मर्रा के ऐसे ही सीधे कदमों से शुरू होती है।
