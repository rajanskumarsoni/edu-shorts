# Episode: How GPS Works (जी-पी-एस कैसे काम करता है)
- Format: vertical
- Theme: cyberpunk
- Accent: #00F0FF
- Art Direction: editorial
- Pad Seconds: 0.28

## Scene 1
- **Type**: three
- **Variant**: google_maps_3d
- **Tag**: 01 / THE POCKET RADAR
- **Title**: HOW GPS TRACKS YOU
- **Tone**: [Curious, high-energy]
- **Metrics**: {"Accuracy": "± 3 Meters", "Refresh": "1000ms", "Signal": "L1 1575.42 MHz"}
- **Visual Intent**: Metallic 3D smartphone tilted in dark cyber space displaying live dark-mode Google Maps with vector streets and turn navigation. Active glowing blue GPS puck pulses with radar waves, moving forward along the glowing route as live routing HUD floats in 3D.
- **Narration**:
जब आप सड़क पर चलते हुए गू-गल मैप्स ऑन करते हैं, तो आपकी हथेली में रखा यह फोन कैसे जानता है कि आप सड़क के किस मोड़ पर खड़े हैं?

## Scene 2
- **Type**: three
- **Variant**: globe_network_3d
- **Tag**: 02 / 20,200 KM IN SPACE
- **Title**: THE MEO CONSTELLATION
- **Tone**: [Awe-inspiring, scientific]
- **Metrics**: {"Orbit Altitude": "20,200 km", "Constellation": "31 Satellites", "Speed": "14,000 km/h"}
- **Visual Intent**: Camera pulls back smoothly from the street level into deep space, revealing a photorealistic 3D Earth globe rotating with deep ocean blue, glowing night cities, atmospheric halo, and an orbital network of 31 GPS satellites in Medium Earth Orbit.
- **Narration**:
आपके फोन में कोई जादुई रडार नहीं है! इसका पूरा सिस्टम ज़मीन से बीस हज़ार किलोमीटर ऊपर अंतरिक्ष में चक्कर काट रही इकतीस सै-टे-लाइट्स से चलता है!

## Scene 3
- **Type**: compare
- **Tag**: 03 / THE BIG MISCONCEPTION
- **Title**: YOUR PHONE NEVER TRANSMITS
- **Tone**: [Dramatic, eye-opening]
- **Visual Intent**: High-contrast split comparison card: Left side shows common myth with red warning badge (phone transmitting signal to space), right side shows scientific reality with cyan checkmark (phone is 100% passive receiver listening to radio waves).
- **Left**: {"heading": "COMMON MYTH", "items": ["Phone sends space signals", "Satellite tracks your phone", "Huge transmitter battery needed"]}
- **Right**: {"heading": "SCIENTIFIC REALITY", "items": ["Satellites broadcast time codes", "Phone is passive receiver", "Zero signal sent upward"]}
- **Narration**:
सबसे बड़ा भ्रम: लोग सोचते हैं कि फोन सै-टे-लाइट को सिग्नल भेजता है! सच यह है कि फोन अंतरिक्ष में कुछ नहीं भेजता—यह सिर्फ सै-टे-लाइट्स के टाइम सिग्नल्स को चुपचाप सुनता है!

## Scene 4
- **Type**: gauge
- **Tag**: 04 / SPEED OF LIGHT BROADCAST
- **Title**: TIME-OF-FLIGHT DELAY
- **Tone**: [Analytical, clear]
- **StartValue**: 20200
- **EndValue**: 0
- **Unit**: km
- **Status**: Radio Wave In Transit
- **Badge**: SPEED OF LIGHT (67.3ms LATENCY)
- **Visual Intent**: Dynamic sweeping arc gauge transitioning from 20,200 km down to 0 km in real time, measuring the electromagnetic radio transit time at the speed of light (300,000 km/s) with nanosecond atomic timestamp telemetry.
- **Narration**:
हर सै-टे-लाइट में लगी होती है सुपर-एक्यूरेट एटॉमिक क्लॉक. सै-टे-लाइट रेडियो वेव भेजती है—'मैं सै-टे-लाइट चार हूँ, और यह सिग्नल ठीक इस नैनो-से-कंड पर चला था!'

## Scene 5
- **Type**: three
- **Variant**: gps_trilateration_3d
- **Tag**: 05 / 3D TRILATERATION
- **Title**: THE 4-SPHERE LOCK
- **Tone**: [Authoritative, revelatory]
- **Equation**: (x - x_i)^2 + (y - y_i)^2 + (z - z_i)^2 = [c \cdot (t_i - \Delta t)]^2
- **Metrics**: {"Sat 1-3": "Position (X, Y, Z)", "Sat 4": "Clock Drift Correction", "Fix": "3D Lock"}
- **Visual Intent**: 4 GPS satellites in 3D orbit simultaneously fire glowing laser telemetry rays and expanding spherical shells toward Earth. The spheres intersect at the user's golden beacon pin, and the 4th satellite instantly cancels receiver clock error, locking exact latitude, longitude, and elevation.
- **Narration**:
एक सै-टे-लाइट से सिर्फ दूरी पता चलती है, दो से एक घेरा, तीन से दो बिंदु. और चौथी सै-टे-लाइट फोन की सस्ती घड़ी का टाइम एरर मिटाकर आपकी थ्री-डी लोकेशन लॉक कर देती है!

## Scene 6
- **Type**: bento
- **Tag**: 06 / EINSTEIN'S SECRET
- **Title**: RELATIVITY CORRECTION
- **Tone**: [Mind-blowing, intriguing]
- **Visual Intent**: Modular glassmorphic telemetry bento grid detailing Einstein's General and Special Relativity corrections: Speed dilation vs Gravity acceleration yielding +38 microseconds/day net drift, with warning badge showing 11 km daily drift without fix.
- **BentoItems**: [
    {"title": "Special Relativity", "value": "-7 μs / day", "span": 1, "badge": "High Speed Dilation"},
    {"title": "General Relativity", "value": "+45 μs / day", "span": 1, "badge": "Weaker Gravity Orbit"},
    {"title": "Net Daily Time Drift", "value": "+38 μs / day", "span": 2, "badge": "Relativistic Shift"},
    {"title": "Error Without Fix", "value": "11.4 km / Day", "span": 2, "badge": "Critical Correction"}
  ]
- **Narration**:
अगर अल्बर्ट आइंस्टीन की थ्योरी ऑफ रिलेटिविटी का फॉर्मूला न लगाएं, तो समय के फर्क की वजह से हर दिन आपका जी-पी-एस ग्यारह किलोमीटर भटक जाएगा!

## Scene 7
- **Type**: three
- **Variant**: google_maps_3d
- **Tag**: 07 / POSITION LOCKED
- **Title**: REAL-TIME NAVIGATION
- **Tone**: [Triumphant, energetic]
- **Metrics**: {"Lock Status": "3D FIX", "Satellites Tracked": "12 in View", "Drift": "< 1.2m"}
- **Visual Intent**: Flash of golden telemetry locks the coordinates, seamlessly cutting back into the 3D smartphone screen. The blue GPS dot locks precisely onto the center road lane and glides forward with turn instructions updating live.
- **Narration**:
चारों सिग्नल्स मिलते ही गू-गल मैप्स का ब्लू डॉट आपकी सही सड़क पर लॉक हो जाता है, और नेविगेशन शुरू हो जाता है!

## Scene 8
- **Type**: outro
- **Tag**: 08 / THE HIDDEN SCIENCE
- **Title**: HOW GPS WORKS
- **Text**: SHARE WITH CURIOUS MINDS
- **Tone**: [Warm, engaging]
- **Icon**: sparkles
- **Visual Intent**: Glowing cyberpunk outro card with glowing neon accents, animated particle bursts, and high-CTR call-to-action cards inviting viewers to subscribe for deep-tech explainers.
- **Narration**:
अगली बार जब आप गू-गल मैप्स खोलें, तो याद रखिएगा—अंतरिक्ष की इकतीस घड़ियां आपकी राह आसान बना रही हैं. लाइक और सब्सक्राइब ज़रूर करें!
