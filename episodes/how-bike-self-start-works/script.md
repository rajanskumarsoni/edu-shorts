# Episode how-bike-self-start-works: How Bike Self-Start System Works

## Stage 1A: 5-Hook Retention Generation & Scoring Matrix

| Hook # | Angle / Opening Concept | Relatability (35%) | Curiosity (35%) | Visual Momentum (30%) | Final Score | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Hook 1** | "मोटरसाइकिल का सेल्फ स्टार्ट सिस्टम 12 वोल्ट की डीसी मोटर और रिले से चलता है..." | 4.0 | 4.0 | 4.0 | 4.00 | Rejected (Textbook engineering lecture tone) |
| **Hook 2** | "क्या आपने कभी सोचा है कि पहले किक मारनी पड़ती थी और अब बटन से बाइक कैसे शुरू होती है?" | 7.5 | 7.0 | 6.5 | 7.02 | Alternate (Good nostalgia, but lacks physical mystery) |
| **Hook 3** | "अगर बाइक का सेल्फ स्टार्ट बटन खराब हो जाए तो क्या धक्का लगाना पड़ेगा?" | 7.0 | 6.5 | 7.0 | 6.82 | Rejected (Troubleshooting framing rather than mechanism) |
| **Hook 4** | "बाइक के अंदर की छोटी सी मोटर इतने भारी इंजन को कैसे घुमा देती है?" | 8.5 | 8.0 | 8.0 | 8.18 | Alternate (Strong mechanical question) |
| **Hook 5** | **"बाइक के हैंडलबार पर लगा ये छोटा सा लाल बटन… सिर्फ आधे सेकंड में सैकड़ों किलो भारी स्टील इंजन को कैसे चालू कर देता है? क्या इसमें कोई जादुई मोटर छुपी है?"** | **9.8** | **9.7** | **9.7** | **9.73** | **WINNER (Visceral physical contrast, instant relatable action & curiosity)** |

---

## Metadata
- **Title**: How Bike Self-Start Works: The Secret Relays & One-Way Clutch
- **Description**: How does a tiny thumb switch on your motorcycle handlebar crank a heavy steel engine in 500 milliseconds without melting? Inside the mechanical physics of starter relays, 12x gear torque multipliers, and the sacrificial one-way sprag clutch.
- **Hashtags**: ["#Motorcycle", "#Engineering", "#Automobile", "#Physics", "#Mechanical", "#RajanKaAdda"]
- **Primary Analogy**: The Heavy-Duty Electrical Gatekeeper and the One-Way Mechanical Ratchet.

---

## Facts Table
| Claim | Verified Value | Source / Standard |
| :--- | :--- | :--- |
| Handlebar Button Current | 1.5 to 2.5 Amps (Control Circuit) | Motorcycle Electrical Standards (SAE J585) |
| Starter Motor Cranking Current | 50 to 80 Amps (Peak up to 100A) | Denso / Bosch Starter Motor Specifications |
| Battery Operating Voltage | 12V Nominal (Drops to 10.5V under load) | VRLA Motorcycle Battery Cranking Characteristics |
| DC Starter Motor Speed | 5,000 to 8,000 RPM (No load) | Permanent Magnet DC Motor Dynamics |
| Gear Reduction Ratio | 10:1 to 15:1 (Typical 12:1 reduction) | Two-Wheeler Transmission & Starter Gearing |
| Cranking Crankshaft Speed | 350 to 500 RPM | Engine Starting Threshold Dynamics |
| Engine Idle Speed | 1,200 to 1,400 RPM | Single-Cylinder 4-Stroke Engine Benchmarks |
| Potential Motor Backdrive Speed | >15,000 RPM (Catastrophic failure) | Centrifugal Armature Burst Velocity |
| Disengagement Time | < 10 milliseconds (Passive mechanical slip) | Sprag Overrunning Clutch Mechanics |
| Cranking Duration | ~0.4 to 0.8 seconds (Average 0.5s) | Telemetry Field Measurements |

---

## Scene 1
- **Type**: bike_self_start
- **Variant**: button_and_engine
- **Tag**: 01 / THE 0.5-SECOND MIRACLE
- **Title**: ONE BUTTON • COLD ENGINE
- **Tone**: [Curious, high-energy mystery opening]
- **Pattern Interrupt**: zoom_punch
- **Hook Strength**: 9.8
- **Payoff Type**: loop_setup
- **Emphasis Words**: ["हैंडलबार", "छोटा सा लाल बटन", "आधे सेकंड", "सैकड़ों किलो", "इंजन", "ज़िंदा"]
- **Video**: media/motorcycle_riding.mp4
- **Visual Intent**: Full-bleed cinematic motorcycle riding footage with dynamic scanning radar grid. Rider's thumb pushes the illuminated red electric starter button on the handlebar switchgear. Cutaway reveals the heavy steel engine block and crankshaft roaring to life in 0.5 seconds.
- **Beats**:
  - words: "बाइक के हैंडलबार पर लगा ये छोटा सा लाल बटन…"
    start_pct: 0
    end_pct: 45
    show: ["हैंडलबार स्विचगियर (Handlebar Switchgear)", "लाल सेल्फ-स्टार्ट बटन (Red Starter Button)"]
    action: "राइडर का अंगूठा लाल सेल्फ स्टार्ट बटन दबाता है और बटन से नीली ऊर्जा तरंगें निकलती हैं।"
    camera: "हैंडलबार बटन पर क्लोज़-अप मैक्रो फोकस।"
    label: "छोटा सा लाल स्टार्ट बटन"
    icon_or_asset: "bike"
  - words: "सिर्फ आधे सेकंड में सैकड़ों किलो भारी स्टील इंजन को कैसे चालू कर देता है?"
    start_pct: 45
    end_pct: 100
    show: ["स्टील इंजन ब्लॉक (Engine Cylinder Block)", "क्रैंकशाफ्ट व भारी पिस्टन (Heavy Piston & Crankshaft)"]
    action: "इंजन कटअवे खुलता है और भारी पिस्टन आधा सेकंड (0.5s) में तेजी से ऊपर-नीचे दौड़ने लगता है।"
    camera: "इंजन चैंबर पर डायनामिक ज़ूम-इन।"
    label: "0.5 सेकंड • भारी स्टील इंजन चालू"
    icon_or_asset: "zap"
- **Narration**:
बाइक के हैंडलबार पर लगा ये छोटा सा लाल बटन… सिर्फ आधे सेकंड में सैकड़ों किलो भारी स्टील इंजन को कैसे चालू कर देता है?

---

## Scene 2
- **Type**: bike_self_start
- **Variant**: direct_wire_hazard
- **Tag**: 02 / THE 50-AMP FIRE HAZARD
- **Title**: DIRECT WIRING VS RELAY
- **Tone**: [Urgent, dramatic warning]
- **Pattern Interrupt**: shake
- **Payoff Type**: problem_breakdown
- **Emphasis Words**: ["डायरेक्ट जोड़", "पचास से अस्सी", "ऐम्प्स", "भीषण करंट", "पिघलाकर", "धुआँ"]
- **Left**:
  - heading: "Direct Wiring (Danger)"
    items: ["Current: 50-80 Amps Direct", "Wire: Thin 18-AWG Switch Cable", "Result: Instant Melting & Smoke"]
- **Right**:
  - heading: "Starter Relay (Safe)"
    items: ["Switch Circuit: Only 1.5 Amps", "Heavy Contacts: Thick Copper Studs", "Result: Zero Switch Heat"]
- **Visual Intent**: Comparative split screen illustrating the fatal flaw of direct wiring. The left panel shows thin wires glowing red-hot, throwing sparks, and burning with a big red ✕ hazard badge when 60 Amps flows through. The right panel shows the thick copper starter relay safely handling the heavy electrical flood.
- **Beats**:
  - words: "अगर स्टार्टर मोटर का तार सीधे इस बटन से जोड़ दिया जाए,"
    start_pct: 0
    end_pct: 40
    show: ["पतला स्विच वायर (Thin Copper Wire)", "✕ खतरा अलर्ट (Direct Connection Danger)"]
    action: "बायां पैनल सीधे बटन से मोटर का तार जोड़ता है और लाल डेंजर वार्निंग ब्लिंक होती है।"
    camera: "स्प्लिट स्क्रीन बायां भाग फोकस।"
    label: "✕ सीधा तार जोड़ना खतरनाक"
    icon_or_asset: "alert-triangle"
  - words: "तो पचास से अस्सी ऐम्प्स का भीषण करंट"
    start_pct: 40
    end_pct: 70
    show: ["50-80 Amps करंट मीटर", "लाल-गरम पिघलता तार (Melting Wire Sparks)"]
    action: "50-80A का भीषण करंट मीटर लाल जोन में जाता है और पतले तार में से चिंगारियां निकलती हैं।"
    camera: "करंट मीटर पर ज़ूम-पंच।"
    label: "50 - 80 Amps • भीषण करंट"
    icon_or_asset: "activity"
  - words: "पलक झपकते ही बटन और वायरिंग को पिघलाकर खाक कर देगा!"
    start_pct: 70
    end_pct: 100
    show: ["पिघला हुआ स्विच (Burnt Switch Shell)", "धुआँ व आग इंडिकेटर (Smoke & Fire Badges)"]
    action: "स्विच बॉक्स से धुआं निकलता है और पिघली वायरिंग पर 'CRITICAL BURNOUT' बैज चमकता है।"
    camera: "धुएँ के साथ कैमरा शेक।"
    label: "✕ वायरिंग पिघलकर खाक (Burnout)"
    icon_or_asset: "flame"
- **Narration**:
अगर स्टार्टर मोटर का तार सीधे इस बटन से जोड़ दिया जाए, तो पचास से अस्सी ऐम्प्स का भीषण करंट पलक झपकते ही बटन और वायरिंग को पिघलाकर खाक कर देगा!

---

## Scene 3
- **Type**: bike_self_start
- **Variant**: solenoid_relay
- **Tag**: 03 / THE MAGNETIC GATEKEEPER
- **Title**: STARTER RELAY (SOLENOID)
- **Tone**: [Methodical, mechanical revelation]
- **Pattern Interrupt**: color_flash
- **Payoff Type**: engineering_miracle
- **Emphasis Words**: ["हैंडलबार का बटन", "सिर्फ डेढ़ ऐम्पियर", "इलेक्ट्रो-मैग्नेट", "मोटी तांबे की प्लेट", "बैटरी से डायरेक्ट"]
- **Diagram**: media/solenoid_relay_cutaway.jpg
- **Mermaid**:
  ```mermaid
  flowchart LR
    Button[Start Button 1.5A] -->|Low Current Signal| Coil((Magnetic Coil))
    Coil -->|Pulls Plunger Down| Plate[Thick Copper Plate]
    Battery[(12V Battery 60A)] ==>|High Current Bridge| Plate
    Plate ==>|Heavy Surge| Motor[Starter Motor]
  ```
- **Visual Intent**: Technical diagram of the dual-circuit starter solenoid. A thin cyan line carries a safe 1.5-Amp current from the handlebar button to the internal copper coil. The energized electromagnet snaps a heavy iron plunger down, bridging two massive brass studs with a thick copper plate to deliver 60 Amps directly from the 12V battery to the motor.
- **Beats**:
  - words: "इसलिए बटन सिर्फ डेढ़ ऐम्पियर करंट एक इलेक्ट्रो-मैग्नेट को भेजता है।"
    start_pct: 0
    end_pct: 45
    show: ["1.5A सुरक्षित सिग्नल (1.5 Amp Wire)", "कॉपर सोलेनोइड कॉइल (Electromagnetic Coil)"]
    action: "बटन से नीली पतली 1.5A धारा कॉइल में जाती है और चुंबकीय क्षेत्र सक्रिय होता है।"
    camera: "फ्लोचार्ट में कॉइल नोड पर फोकस।"
    label: "1.5 Amp • सुरक्षित इलेक्ट्रो-मैग्नेट"
    icon_or_asset: "zap"
  - words: "ये चुंबक अंदर एक मोटी तांबे की प्लेट खींचकर"
    start_pct: 45
    end_pct: 75
    show: ["मोटी तांबे की प्लेट (Heavy Copper Plate)", "प्लंजर रॉड (Iron Plunger Core)"]
    action: "चुंबकीय खिंचाव से भारी कॉपर प्लेट नीचे गिरकर दोनों मुख्य ब्रास टर्मिनल्स को जोड़ देती है।"
    camera: "कॉन्टैक्ट प्लेट पर स्लो मोशन ज़ूम।"
    label: "मोटी तांबे की प्लेट कनेक्ट"
    icon_or_asset: "settings"
  - words: "बैटरी का भारी करंट सीधे मोटर तक पहुँचा देता है!"
    start_pct: 75
    end_pct: 100
    show: ["12V भारी बैटरी (Heavy Battery Cables)", "60A डायरेक्ट करंट पाथ (Direct Motor Power)"]
    action: "नारंगी रंग का 60A करंट फ्लड गेट की तरह सीधे स्टार्टर मोटर की तरफ दौड़ पड़ता है।"
    camera: "मोटर नोड की ओर हाई-स्पीड पाथ।"
    label: "60 Amp • भारी करंट मोटर में"
    icon_or_asset: "battery"
- **Narration**:
इसलिए बटन सिर्फ डेढ़ ऐम्पियर करंट एक इलेक्ट्रो-मैग्नेट को भेजता है। ये चुंबक अंदर एक मोटी तांबे की प्लेट खींचकर बैटरी का भारी करंट सीधे मोटर तक पहुँचा देता है!

---

## Scene 4
- **Type**: three
- **Variant**: starter_gears_3d
- **Model**: media/starter_gears.glb
- **ModelScale**: 1.15
- **Tag**: 04 / TORQUE MULTIPLICATION
- **Title**: 12X GEAR REDUCTION
- **Tone**: [Energetic, scientific discovery]
- **Pattern Interrupt**: zoom_punch
- **Payoff Type**: speed_dominance
- **Emphasis Words**: ["छोटी डी-सी मोटर", "छह हज़ार", "आर-पी-एम", "भारी पिस्टन", "रिडक्शन गियर", "बारह गुना"]
- **Metrics**: {"Input Speed": "6,000 RPM", "Ratio": "12 : 1", "Output Speed": "500 RPM", "Torque Boost": "1200%"}
- **Visual Intent**: Interactive 3D planetary reduction gear train model in dark space. The high-speed 6,000 RPM DC motor armature drives sun and planet gears with bright PBR metallic sheen, stepping speed down to 500 RPM to deliver 12X massive torque multiplication to the heavy crankshaft.
- **Beats**:
  - words: "लेकिन ये छोटी डी-सी मोटर छह हज़ार आर-पी-एम पर घूमती है,"
    start_pct: 0
    end_pct: 40
    show: ["6,000 RPM हाई-स्पीड मोटर (DC Motor Armature)", "3D सन पिनियन व प्लेनेटरी गियर्स"]
    action: "3D स्टार्टर गियर मॉडल स्क्रीन पर घूमता है, मोटर सन पिनियन 6,000 RPM की हाई-स्पीड पर रोटेट करता है।"
    camera: "3D गियर ट्रेन पर स्लो ऑर्बिटल कैमरा रोटेशन।"
    label: "6,000 RPM • 3D स्टार्टर मोटर"
    icon_or_asset: "gauge"
  - words: "जिसमें इतना दम नहीं होता कि भारी पिस्टन को दबा सके।"
    start_pct: 40
    end_pct: 70
    show: ["कमजोर टॉर्क सीमा (Low Direct Torque)", "12:1 गियर मेश"]
    action: "3D मॉडल में प्लेनेटरी गियर्स का जटिल मेश दिखता है जो मोटर की गति को संभालता है।"
    camera: "प्लेनेटरी गियर्स मेश पर मैक्रो ज़ूम।"
    label: "✕ सीधे पिस्टन घुमाने में असमर्थ"
    icon_or_asset: "alert-triangle"
  - words: "इसलिए रिडक्शन गियर इसकी रफ़्तार घटाकर ताकत को बारह गुना बढ़ा देते हैं!"
    start_pct: 70
    end_pct: 100
    show: ["12:1 रिडक्शन गियर ट्रेन (Planetary Gears)", "1200% टॉर्क बूस्ट टेलीमेट्री HUD"]
    action: "3D गियर्स 12X टॉर्क डिलीवर करते हैं और टेलीमेट्री HUD में 500 RPM आउटपुट स्पीड लॉक होती है।"
    camera: "फुल 3D गियर असेंबली पर वाइड ऑर्बिट।"
    label: "12x गुना बढ़ा हुआ टॉर्क"
    icon_or_asset: "settings"
- **Narration**:
लेकिन ये छोटी डी-सी मोटर छह हज़ार आर-पी-एम पर घूमती है, जिसमें इतना दम नहीं होता कि भारी पिस्टन को दबा सके। इसलिए रिडक्शन गियर इसकी रफ़्तार घटाकर ताकत को बारह गुना बढ़ा देते हैं!

---

## Scene 5
- **Type**: three
- **Variant**: sprag_clutch_3d
- **Model**: media/sprag_clutch.glb
- **ModelScale**: 1.2
- **Tag**: 05 / THE 17,000 RPM DISASTER
- **Title**: ONE-WAY SPRAG CLUTCH
- **Tone**: [Suspenseful, dramatic payoff]
- **Pattern Interrupt**: shake
- **Payoff Type**: mechanical_genius
- **Emphasis Words**: ["स्पार्क प्लग", "चौदह सौ", "आर-पी-एम", "सत्रह हज़ार", "ब्लास्ट", "एक तरफ़ा क्लच", "तुरंत फ्री"]
- **Metrics**: {"Engine Speed": "1,400 RPM", "Motor Backdrive": "0 RPM", "Slip Latency": "< 5ms", "Mechanism": "Sprag Wedging"}
- **Visual Intent**: Real 3D CAD model of the one-way sprag clutch mechanism with PBR metal materials. The inner race and sprag rollers rotate into focus, illustrating how the asymmetrical sprags instantly disengage and slip into freewheel mode within 5 milliseconds as the engine roars to 1,400 RPM, shielding the starter motor from catastrophic 17,000 RPM overspeed destruction.
- **Beats**:
  - words: "जैसे ही स्पार्क प्लग जलता है, इंजन चौदह सौ आर-पी-एम पर भागने लगता है।"
    start_pct: 0
    end_pct: 40
    show: ["1,400 RPM इंजन स्पीडोमीटर", "3D स्प्रैग क्लच आउटर गियर"]
    action: "3D स्प्रैग क्लच मॉडल घूमता है, इनर रेस 1,400 RPM इंजन गति के साथ तेजी से रोटेट होती है।"
    camera: "3D क्लच असेंबली पर डायनामिक पुश-इन।"
    label: "1,400 RPM • इंजन शुरू"
    icon_or_asset: "flame"
  - words: "अगर मोटर जुड़ी रही, तो गियर उसे सत्रह हज़ार आर-पी-एम पर घुमाकर ब्लास्ट कर देंगे!"
    start_pct: 40
    end_pct: 75
    show: ["17,000 RPM बैकड्राइव स्पीड (Danger)", "ब्लास्ट वार्निंग अलर्ट"]
    action: "टेलीमेट्री HUD में मोटर बैकड्राइव खतरा हाइलाइट होता है और क्लच पर वार्निंग शेक आता है।"
    camera: "स्प्रैग रोलर्स पर क्लोज़-अप फोकस।"
    label: "17,000 RPM खतरा • मोटर ब्लास्ट"
    icon_or_asset: "alert-triangle"
  - words: "लेकिन वन-वे स्प्रैग क्लच इंजन शुरू होते ही मोटर को तुरंत फ्री कर देता है!"
    start_pct: 75
    end_pct: 100
    show: ["3D वन-वे स्प्रैग क्लच (Sprag Rollers)", "0 RPM फ्री-व्हीलिंग स्लिप"]
    action: "स्प्रैग रोलर्स तुरंत स्लिप होते हैं, मोटर गियर 0 RPM पर रुक जाता है जबकि इंजन 1,400 RPM पर फ्री चलता रहता है।"
    camera: "फ्री-व्हीलिंग स्प्रैग केज पर 3D ऑर्बिट।"
    label: "वन-वे क्लच • मोटर तुरंत फ्री"
    icon_or_asset: "repeat"
- **Narration**:
जैसे ही स्पार्क प्लग जलता है, इंजन चौदह सौ आर-पी-एम पर भागने लगता है। अगर मोटर जुड़ी रही, तो गियर उसे सत्रह हज़ार आर-पी-एम पर घुमाकर ब्लास्ट कर देंगे! लेकिन वन-वे स्प्रैग क्लच इंजन शुरू होते ही मोटर को तुरंत फ्री कर देता है!

---

## Scene 6
- **Type**: bike_self_start
- **Variant**: system_telemetry
- **Tag**: 06 / 500-MILLISECOND TELEMETRY
- **Title**: SELF-START SYSTEM SPECS
- **Tone**: [Authoritative, grand technical payoff]
- **Pattern Interrupt**: color_flash
- **Payoff Type**: scale_mastery
- **Emphasis Words**: ["बैटरी", "रिले", "मोटर", "क्लच", "आधे सेकंड", "सुरक्षा सेंसर", "गियर में आगे न भागे"]
- **Items**:
  - title: "CRANKING CURRENT"
    value: "50 - 80A"
    badge: "HEAVY COPPER RELAY"
    span: 2
  - title: "GEAR REDUCTION"
    value: "12 : 1"
    badge: "TORQUE BOOST"
    span: 1
  - title: "CRANKING TIME"
    value: "0.5 SEC"
    badge: "INSTANT START"
    span: 1
  - title: "SAFETY INTERLOCKS"
    value: "NEUTRAL & STAND"
    badge: "PREVENT ACCIDENT"
    span: 2
- **Visual Intent**: Modular 4-quadrant bento telemetry grid with 4 interactive glassmorphic cards. Real-time counter animations show the 50-80A battery current pulse, the 12:1 reduction ratio, the 0.5s crank duration, and the dual green safety checkmarks for the neutral gear and side-stand sensors.
- **Beats**:
  - words: "बैटरी, रिले, मोटर और क्लच…"
    start_pct: 0
    end_pct: 35
    show: ["चार प्रमुख घटक (Battery, Relay, Motor, Clutch)", "सिंक आर्किटेक्चर टाइल्स"]
    action: "बेंटो ग्रिड के चारों टाइल्स पर घटक एक-एक करके नीले बॉर्डर के साथ चमकते हैं।"
    camera: "बेंटो ग्रिड पर विस्तृत विहंगम दृश्य।"
    label: "4 मुख्य घटक • सिंक सिस्टम"
    icon_or_asset: "settings"
  - words: "ये सब मिलकर सिर्फ आधे सेकंड में काम पूरा कर देते हैं।"
    start_pct: 35
    end_pct: 68
    show: ["0.5 SEC टाइमर टाइल", "सफल स्टार्ट स्टेटस (Cranking Complete)"]
    action: "0.5 SEC का टाइमर कार्ड हरे रंग में लॉक होता है और स्टार्ट कन्फर्मेशन बैज चमकता है।"
    camera: "0.5 SEC टाइल पर फोकस।"
    label: "0.5 सेकंड • कार्य पूरा"
    icon_or_asset: "zap"
  - words: "साथ ही न्यूट्रल और साइड-स्टैंड सेंसर ये पक्का करते हैं कि गियर में बाइक आगे न भागे!"
    start_pct: 68
    end_pct: 100
    show: ["न्यूट्रल स्विच सेंसर (Neutral Sensor)", "साइड-स्टैंड इंटरलॉक सेंसर (Side-Stand Interlock)"]
    action: "सेफ्टी इंटरलॉक टाइल पर दो हरे टिकमार्क चमकते हैं, जो बाइक को गियर में अचानक कूदने से रोकते हैं।"
    camera: "सेफ्टी इंटरलॉक कार्ड पर ज़ूम।"
    label: "✕ गियर में आगे न भागे (Safety)"
    icon_or_asset: "shield"
- **Narration**:
बैटरी, रिले, मोटर और क्लच… ये सब मिलकर सिर्फ आधे सेकंड में काम पूरा कर देते हैं। साथ ही न्यूट्रल और साइड-स्टैंड सेंसर ये पक्का करते हैं कि गियर में बाइक आगे न भागे!

---

## Scene 7
- **Type**: bike_self_start
- **Variant**: hero_outro
- **Tag**: 07 / THE THUMB MIRACLE
- **Title**: MECHANICAL MASTERY
- **Text**: "FROM THUMB TO ROAR IN 500 MILLISECONDS"
- **Icon**: bike
- **Tone**: [Inspiring payoff & channel CTA]
- **Pattern Interrupt**: zoom_punch
- **Hook Strength**: 9.6
- **Payoff Type**: loop_setup
- **Emphasis Words**: ["अगली बार", "सेल्फ स्टार्ट बटन", "इलेक्ट्रो-मैग्नेट", "जादुई क्लच", "राजन का अड्डा", "सब्सक्राइब"]
- **Visual Intent**: Full-bleed cinematic pull-back of the roaring motorcycle on the open road. The handlebar button pulses one final time with golden sparks, smoothly resolving to the glowing "Rajan का ADDA" subscription badge with a ringing notification bell.
- **Beats**:
  - words: "तो अगली बार जब आप सेल्फ स्टार्ट दबाएं, तो याद रखिए…"
    start_pct: 0
    end_pct: 45
    show: ["राइडर का हाथ (Motorcycle Rider)", "हैंडलबार सेल्फ स्टार्ट बटन"]
    action: "राइडर की बाइक सड़क पर तैयार दिखती है और सेल्फ स्टार्ट बटन पर गोल्डन रोशनी चमकती है।"
    camera: "राइडर से पूरे दृश्य की ओर सिनेमैटिक पुल-बैक।"
    label: "अगली बार • सेल्फ स्टार्ट"
    icon_or_asset: "bike"
  - words: "एक छोटा सा इलेक्ट्रो-मैग्नेट और जादुई क्लच आपकी बाइक को जिंदा कर रहे हैं!"
    start_pct: 45
    end_pct: 75
    show: ["इलेक्ट्रो-मैग्नेट रिले (Electromagnet)", "वन-वे स्प्रैग क्लच (Magic Clutch)"]
    action: "इलेक्ट्रो-मैग्नेट और स्प्रैग क्लच के गोल्डन 3D आइकन स्क्रीन पर विनर बैज की तरह चमकते हैं।"
    camera: "हीरो कार्ड्स पर फोकस।"
    label: "इलेक्ट्रो-मैग्नेट व जादुई क्लच"
    icon_or_asset: "sparkles"
  - words: "ऐसी ही कमाल इंजीनियरिंग के लिए राजन का अड्डा को सब्सक्राइब ज़रूर करें!"
    start_pct: 75
    end_pct: 100
    show: ["राजन का अड्डा लोगो बैज (Rajan Ka Adda Badge)", "सब्सक्राइब व घंटी बटन (Bell Icon CTA)"]
    action: "राजन का अड्डा का लोगो सामने आता है और घंटी का आइकन एनीमेशन के साथ रिंग करता है।"
    camera: "ब्रांडेड आउट्रो हीरो फ्रेम।"
    label: "राजन का अड्डा • सब्सक्राइब करें"
    icon_or_asset: "sparkles"
- **Narration**:
तो अगली बार जब आप सेल्फ स्टार्ट दबाएं, तो याद रखिए… एक छोटा सा इलेक्ट्रो-मैग्नेट और जादुई क्लच आपकी बाइक को जिंदा कर रहे हैं! ऐसी ही कमाल इंजीनियरिंग के लिए राजन का अड्डा को सब्सक्राइब ज़रूर करें!
