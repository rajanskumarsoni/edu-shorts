#!/usr/bin/env python3
"""
Regenerates all video script JSONs in videos/ with the complete 10-point storyboard standard:
- purpose
- transition
- visual (structured dictionary: start, objects, action, camera, motion_graphics, end)
- narration (conversational Hindi)
- sfx
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
VIDEOS_DIR = ROOT / "videos"
VIDEOS_DIR.mkdir(exist_ok=True)

# -------------------------------------------------------------
# 1. HOW UPI WORKS (13 scenes)
# -------------------------------------------------------------
HOW_UPI_WORKS = {
  "id": "how-upi-works",
  "format": "vertical",
  "accent": "#00F0FF",
  "audio_mode": "scenes",
  "captions": True,
  "progress": True,
  "sfx": True,
  "loop": False,
  "music": None,
  "music_volume": 0.08,
  "meta": {
    "title": "How UPI Works Behind the Scenes in 3D Explained",
    "description": "Ever wondered how UPI transfers money to a shopkeeper in under 2 seconds? Discover the complete 3D digital infrastructure of NPCI, Core Banking Systems, and cryptographic PIN authorization.",
    "hashtags": [
      "UPI",
      "NPCI",
      "FinTech",
      "TechnologyExplained",
      "DigitalIndia",
      "ComputerScience"
    ],
    "facts_to_verify": [
      "UPI payments are routed via NPCI switch and settled directly between participating Core Banking Systems (CBS) without third-party wallet intermediaries."
    ]
  },
  "scenes": [
    {
      "type": "hook",
      "text": "How UPI Works in 2 Seconds",
      "icon": "smartphone",
      "purpose": "Hook curiosity by contrasting everyday 2-second payment with hidden complex background systems",
      "transition": "zoom_through",
      "visual": {
        "start": "Indian coffee shop counter, customer holds smartphone over physical QR code standee",
        "objects": ["3D Coffee Shop Environment", "Customer Smartphone", "QR Code Standee"],
        "action": "Customer scans QR and pays ₹100; screen flashes 'Payment Successful'",
        "camera": "Freeze-frame and rapid push-in to smartphone screen",
        "motion_graphics": ["Green pulse wave", "Payment Successful dialog card"],
        "end": "QR code expands and transforms into entrance of glowing digital tunnel"
      },
      "narration": "भाई, कॉफी शॉप पर आपने सिर्फ क्यू-आर कोड स्कैन किया, सौ रुपये पे किए और दो सेकंड में स्क्रीन पर आ गया: पेमेंट सक्सेसफुल! लेकिन कभी सोचा है कि यह पैसा पलक झपकते दुकानदार के बैंक खाते में पहुँचा कैसे?",
      "sfx": "fast_whoosh"
    },
    {
      "type": "three",
      "variant": "upi_tunnel_3d",
      "title": "The Digital Payment Tunnel",
      "purpose": "Demonstrate that payment travels via high-speed encrypted network rather than direct phone-to-phone transfer",
      "transition": "match_cut",
      "visual": {
        "start": "Camera plunges through vortex entrance of fiber-optic tunnel",
        "objects": ["3D Fiber Tunnel", "Neon Speed Rings", "Glow Energy Packets"],
        "action": "Camera travels at hyper-speed as glowing cyan currency packets zoom along parallel paths",
        "camera": "Forward high-speed dolly down the center axis with subtle clockwise roll",
        "motion_graphics": ["Speedometer HUD", "Data transit particle trails"],
        "end": "Tunnel flares with white light, dissolving into the 5-participant miniature city"
      },
      "narration": "जैसे ही आप पे दबाते हैं, आपका पैसा किसी जादू से नहीं बल्कि एक हाई-स्पीड डिजिटल हाईवे में दाखिल होता है।",
      "sfx": "riser"
    },
    {
      "type": "three",
      "variant": "upi_city_3d",
      "title": "The 5 Key Participants",
      "purpose": "Map out the complete 5-entity ecosystem so the viewer realizes payment is multi-institutional",
      "transition": "match_cut",
      "visual": {
        "start": "Isometric aerial perspective over futuristic dark miniature city grid",
        "objects": ["3D Miniature City", "5 Floating Holographic Towers (Phone, App, NPCI, Bank A, Bank B)", "Connecting Neon Pathways"],
        "action": "Five structures ascend and illuminate in sequence as glowing energy beams connect them",
        "camera": "Slow orbiting tilt-down around the central NPCI hub structure",
        "motion_graphics": ["Entity label badges", "Animated data packet streams"],
        "end": "Camera settles in 45-degree isometric framing with all 5 nodes connected"
      },
      "narration": "अक्सर हमें लगता है कि पैसा सीधे एक फोन से दूसरे फोन में जा रहा है, लेकिन पर्दे के पीछे पाँच बड़े सिस्टम्स काम करते हैं: आपका फोन, पेमेंट ऐप, एन-पी-सी-आई नेटवर्क, आपका बैंक, और दुकानदार का बैंक।",
      "sfx": "whoosh"
    },
    {
      "type": "inspector",
      "title": "QR Code Payload Decoded",
      "purpose": "Demystify the QR code as an encrypted routing address rather than money storage",
      "transition": "zoom_in",
      "visual": {
        "start": "Close-up on black-and-white QR code matrix standee",
        "objects": ["3D QR Matrix Slab", "Holographic Inspector Glass", "Encrypted Payload Cards"],
        "action": "QR matrix modules elevate into 3D blocks; inspector laser decodes VPA, merchant name, and txn ref",
        "camera": "Pan across three decoded telemetry panels with subtle depth-of-field blur",
        "motion_graphics": ["VPA Address badge", "Merchant verified stamp", "Txn reference tracker"],
        "end": "Three data cards lock into vertical stack ready for packing"
      },
      "sfx": "camera_shutter",
      "sections": [
        {
          "name": "VPA ADDRESS",
          "desc": "coffeehouse@okhdfcbank",
          "color": "#00F0FF"
        },
        {
          "name": "MERCHANT NAME",
          "desc": "Blue Bean Coffee Ltd.",
          "color": "#58D6C2"
        },
        {
          "name": "TRANSACTION REF",
          "desc": "UPI-TXN-98231-LIVE",
          "color": "#FFC857"
        }
      ],
      "narration": "सबसे पहले समझिए क्यू-आर कोड को। इसमें पैसा नहीं होता! यह सिर्फ दुकानदार का डिजिटल एड्रेस यानी यू-पी-आई आईडी बताने वाला एक एड्रेस बोर्ड है।"
    },
    {
      "type": "three",
      "variant": "upi_phone_layers_3d",
      "title": "Preparing Payment Intent",
      "purpose": "Explain client-side payment intent assembly before network transmission",
      "transition": "morph",
      "visual": {
        "start": "Single glassmorphic smartphone held in center frame",
        "objects": ["Exploded 3D Phone Layers", "Glass UI Panels", "Tamper-Evident Intent Enclosure"],
        "action": "Phone expands into 4 floating glass slabs showing intent details, then snaps back together with a lock icon",
        "camera": "Slight Dutch-angle orbit showing dimensional depth between UI layers",
        "motion_graphics": ["AES-256 seal", "Cryptographic signature ripple", "Lock badge"],
        "end": "Phone screen displays glowing encrypted transit capsule ready for dispatch"
      },
      "narration": "स्कैन करते ही पेमेंट ऐप एक सिक्योर रिक्वेस्ट बनाता है, जिसमें दुकानदार का नाम, बैंक कोड और आपके सौ रुपये की रकम एक डिजिटल पैकेट में पैक हो जाती है।",
      "sfx": "pop"
    },
    {
      "type": "concentric",
      "title": "UPI PIN & Secure Sandbox",
      "purpose": "Explain why UPI PIN is never intercepted by payment apps due to hardware-isolated sandbox",
      "transition": "whip_pan",
      "visual": {
        "start": "Glowing golden vault key floating in dark void",
        "objects": ["4 Concentric Titanium Security Rings", "Encrypted Key Core", "Hardware Shielding Mesh"],
        "action": "Four rings counter-rotate around the key, locking outward into an impenetrable boundary",
        "camera": "Direct front-on dolly-in tracking the outer ring alignment",
        "motion_graphics": ["Hardware Keystore tag", "Common Library tag", "AES-256 Transport tag", "Bank HSM tag"],
        "end": "All 4 rings illuminate in synchronous neon cyan and emit protective aura"
      },
      "rings": [
        "Hardware Keystore",
        "NPCI Common Library",
        "AES-256 Transport",
        "Bank HSM Validation"
      ],
      "narration": "अब आता है आपका यू-पी-आई पिन। जब आप पिन डालते हैं, तो यह ऐप के पास कभी नहीं जाता, बल्कि एन-पी-सी-आई की लाइब्रेरी से इनक्रिप्ट होकर सीधे बैंक के पास जाता है।",
      "sfx": "ting"
    },
    {
      "type": "three",
      "variant": "server_rack_3d",
      "title": "NPCI Switching Core",
      "purpose": "Position NPCI as the national high-throughput digital traffic controller",
      "transition": "zoom_through",
      "visual": {
        "start": "Immense subterranean datacenter corridor with towering server racks",
        "objects": ["Towering 3D Server Racks", "Overhead Fiber Trays", "Central NPCI Routing Core"],
        "action": "Millions of blinking LEDs cascade as packet streams enter the top rack and route to Bank A",
        "camera": "Low-angle dolly tracking forward along the server aisle",
        "motion_graphics": ["100,000 TPS counter", "Sub-10ms Routing tag", "Switch status: OPTIMAL"],
        "end": "Camera centers on specific illuminated fiber trunk heading toward Bank A"
      },
      "sfx": "radar_beep",
      "narration": "यहाँ एंट्री होती है एन-पी-सी-आई की। यह पूरे देश का डिजिटल ट्रैफिक कंट्रोलर है, जो सेकंड के सौवें हिस्से में आपकी रिक्वेस्ट को आपके बैंक तक पहुँचाता है।"
    },
    {
      "type": "three",
      "variant": "upi_bank_vault_3d",
      "title": "Inside Customer Bank (Bank A)",
      "purpose": "Explain Core Banking System PIN validation and atomic account debiting",
      "transition": "match_cut",
      "visual": {
        "start": "Massive circular cyber bank vault door with heavy steel bolts",
        "objects": ["3D Cyber Bank Vault Door", "Hydraulic Pistons", "Holographic Account Ledger"],
        "action": "PIN authentication light turns green; pistons pull back and vault door swings open to show ledger entry",
        "camera": "Heavy push-in as vault unlocks, settling on floating debit record",
        "motion_graphics": ["Balance: Checked", "Debit: -₹100", "Digital Auth Seal: APPROVED"],
        "end": "Debit confirmation beam shoots out toward NPCI relay"
      },
      "sfx": "impact",
      "narration": "अब रिक्वेस्ट पहुँचती है आपके बैंक के कोर बैंकिंग सर्वर पर। बैंक तुरंत पिन और बैलेंस चेक करता है, और आपके खाते से सौ रुपये डेबिट कर लेता है।"
    },
    {
      "type": "compare",
      "title": "Dual Ledger Settlement",
      "purpose": "Demonstrate synchronous dual-ledger settlement between payer bank and payee bank",
      "transition": "dissolve",
      "visual": {
        "start": "Split-screen dark interface with Bank A on left and Bank B on right",
        "objects": ["Dual Glass Ledger Cards", "Central NPCI Switch Beam", "Synchronized Checkmark Holograms"],
        "action": "Debit clears on left card, instantaneous laser beam shoots to right card, and credit stamp confirms on Bank B",
        "camera": "Subtle push-in centered between the two balancing ledger columns",
        "motion_graphics": ["Dual checkmarks", "Debit/Credit balance sync lines", "Instantaneous Clearing badge"],
        "end": "Both sides flash synchronous green with bilateral confirmation tag"
      },
      "left": {
        "heading": "Bank A (Debit)",
        "items": [
          "Validate PIN",
          "Deduct ₹100",
          "Dispatch Proof"
        ]
      },
      "right": {
        "heading": "Bank B (Credit)",
        "items": [
          "Verify Route",
          "Credit ₹100",
          "Notify Merchant"
        ]
      },
      "narration": "पैसे कटते ही एन-पी-सी-आई दुकानदार के बैंक को सिग्नल भेजता है, और बैंक तुरंत दुकानदार के खाते में सौ रुपये क्रेडिट कर देता है।",
      "sfx": "whoosh"
    },
    {
      "type": "gauge",
      "title": "End-to-End Latency",
      "purpose": "Prove the lightning settlement speed with concrete sub-2-second telemetry",
      "transition": "pop",
      "value": 1.8,
      "unit": "s",
      "label": "Settlement Speed",
      "status": "INSTANT CLEARING",
      "badge": "100% SUCCESS",
      "min": 0,
      "max": 5,
      "visual": {
        "start": "Circular speedometer HUD at 0.0s with dormant dial needle",
        "objects": ["3D Telemetry Gauge Dial", "Radial Neon Arc", "Central Metric Counter"],
        "action": "Dial needle swings smoothly with energetic easing, pinning at 1.8 seconds accompanied by neon bloom",
        "camera": "Direct head-on view with gentle micro-shake on needle touchdown",
        "motion_graphics": ["1.8s Settlement Speed counter", "INSTANT CLEARING tag", "100% SUCCESS badge"],
        "end": "Dial emits outer pulse ring signifying transaction completion"
      },
      "sfx": "ka_ching",
      "narration": "सिर्फ एक दशमलव आठ सेकंड के अंदर कंफर्मेशन सिग्नल दोनों फोन्स पर पहुँच जाता है, और बजता है पेमेंट सक्सेसफुल!"
    },
    {
      "type": "architecture",
      "title": "The Complete UPI Architecture",
      "purpose": "Review the entire end-to-end loop so the viewer retains the holistic architecture",
      "transition": "match_cut",
      "visual": {
        "start": "Complete 5-node horizontal architecture pipeline floating in space",
        "objects": ["5 Architecture Service Nodes", "Kinetic Pulse Connectors", "Atomic Settlement Ribbon"],
        "action": "Glowing energy pulse travels sequentially across all 5 nodes, leaving permanent illuminated connection trail",
        "camera": "Slow cinematic pan tracking the pulse from Node 1 to Node 5",
        "motion_graphics": ["Synchronous Atomic Settlement header", "Step numbering 01 through 05", "Status Broadcast beacon"],
        "end": "Full architectural diagram pulses as a united living network"
      },
      "nodes": [
        "Payer App",
        "NPCI Switch",
        "Bank A (Debit)",
        "Bank B (Credit)",
        "Payment Status"
      ],
      "steps": [
        "01 / Intent Signed",
        "02 / Route & Auth",
        "03 / Account Debited",
        "04 / Account Credited",
        "05 / Status Broadcast"
      ],
      "activeNode": 2,
      "tag": "SYNCHRONOUS ATOMIC SETTLEMENT",
      "narration": "तो यह है पूरा चक्र: फोन से एन-पी-सी-आई, आपका बैंक, दुकानदार का बैंक, और वापस फोन पर कंफर्मेशन! यह हाईवे चौबीसों घंटे बिना रुके दौड़ता है।",
      "sfx": "radar_beep"
    },
    {
      "type": "callout",
      "title": "What If Payment Fails?",
      "category": "CRITICAL ADVICE",
      "icon": "shield-alert",
      "purpose": "Provide critical user guidance on handling pending payment failures without double-spending",
      "transition": "whip_pan",
      "visual": {
        "start": "Calm dark background with sudden amber warning strobe",
        "objects": ["Floating 3D Alert Card", "Rotating Shield Glyph", "Auto-Reconciliation Clock"],
        "action": "Warning card manifests with frosted glass blur; clock ticks showing auto-refund loop",
        "camera": "Slight Dutch-tilt pull-back emphasizing caution",
        "motion_graphics": ["STATUS: TRANSACTION PENDING tag", "T+1 Reconciliation banner", "No Double-Pay warning icon"],
        "end": "Shield glow shifts from amber to green, confirming money safety"
      },
      "text": "STATUS: TRANSACTION PENDING",
      "subtext": "Do not pay twice immediately. The banking switch will reconcile within T+1 days automatically.",
      "sfx": "glitch",
      "narration": "और अगर कभी पेमेंट पेंडिंग दिखे, तो तुरंत दोबारा पे मत कीजिए! सिस्टम अपने आप इसे सेटल या आपके खाते में रिफंड कर देता है।"
    },
    {
      "type": "outro",
      "title": "Subscribe for More Tech Deep Dives",
      "text": "Seconds On Screen, Systems Behind",
      "icon": "sparkles",
      "purpose": "Deliver strong payoff by contrasting simple screen experience with vast technological marvel, driving subscribe CTA",
      "transition": "dissolve",
      "visual": {
        "start": "Tight shot on smartphone showing final green checkmark",
        "objects": ["3D Smartphone", "Underground Digital Infrastructure City", "Cinematic Subscribe Badge"],
        "action": "Camera ascends rapidly through cafe floor, revealing the interconnected national digital matrix humming underneath",
        "camera": "Dramatic upward crane shot pulling back into epic wide view, converging on YouTube subscribe payoff",
        "motion_graphics": ["Digital India telemetry grid", "Pulsing notification bell icon", "Tech Insights payoff tag"],
        "end": "Sleek fade into glowing brand emblem with sparkling particle field"
      },
      "sfx": "sparkle",
      "narration": "स्क्रीन पर सिर्फ दो सेकंड, और पीछे अरबों का सुरक्षित डिजिटल इंफ्रास्ट्रक्चर! यही है भारत की डिजिटल ताकत। ऐसे ही टेक कॉन्सेप्ट्स के लिए सब्सक्राइब जरूर कर लेना!"
    }
  ]
}

# -------------------------------------------------------------
# 2. GRADIENT DESCENT (9 scenes)
# -------------------------------------------------------------
GRADIENT_DESCENT = {
  "id": "gradient-descent",
  "format": "vertical",
  "accent": "#00F0FF",
  "audio_mode": "scenes",
  "captions": True,
  "progress": True,
  "sfx": True,
  "loop": False,
  "music": None,
  "music_volume": 0.08,
  "meta": {
    "title": "Gradient Descent: Batch vs Stochastic vs Mini-Batch 3D Explained",
    "description": "Learn how modern machine learning models optimize weights in 3D. Compare Full Batch, Stochastic Gradient Descent, and Mini-Batch with procedural loss landscapes.",
    "hashtags": [
      "MachineLearning",
      "DeepLearning",
      "DataScience",
      "AI",
      "CodingInHindi",
      "NeuralNetworks"
    ],
    "facts_to_verify": [
      "Mini-batch gradient descent is the industry standard optimization method for modern deep learning models like transformers and CNNs."
    ]
  },
  "scenes": [
    {
      "type": "hook",
      "text": "Stochastic vs Batch Gradient",
      "icon": "brain",
      "purpose": "Hook viewer interest by posing the central machine learning optimization puzzle",
      "transition": "zoom_through",
      "visual": {
        "start": "Pitch dark void with neon coordinate grid spanning the ground",
        "objects": ["3D Neural Brain Hologram", "Rotating Synaptic Nodes", "Energy Pulses"],
        "action": "Holographic neural brain pulses rapidly; synaptic connections ripple as a glowing question mark illuminates overhead",
        "camera": "Forward dolly-in through the frontal lobes into the mathematical core",
        "motion_graphics": ["Tracked uppercase header 01 / THE CONUNDRUM", "Glowing cyan node rings"],
        "end": "Camera plunges through neural center into a vast topographical loss landscape"
      },
      "narration": "मशीन लर्निंग में मॉडल को ट्रेन करते वक्त सबसे बड़ा सवाल यह होता है कि वेट्स को कैसे अपडेट करें: पूरे डेटा को एक साथ लेकर, या एक-एक करके? चलिए इसे थ्री-डी में देखते हैं।",
      "sfx": "fast_whoosh"
    },
    {
      "type": "three",
      "variant": "batch_gd",
      "title": "Full Batch Gradient Descent",
      "equation": "\\theta_{t+1} = \\theta_t - \\alpha \\nabla L(\\theta)",
      "metrics": {
        "Batch Size": "All (N)",
        "Path": "Smooth",
        "Memory": "Heavy"
      },
      "purpose": "Visualize deterministic, ultra-smooth trajectory of Full Batch optimization",
      "transition": "match_cut",
      "visual": {
        "start": "Wide angle overlooking smooth mountainous 3D loss surface terrain",
        "objects": ["3D Loss Surface Wireframe", "Glowing Cyan Ball", "Trajectory Path Ribbon"],
        "action": "Cyan ball calculates gradient from entire dataset and glides smoothly straight toward global minimum",
        "camera": "Slow cinematic orbit 45 degrees around the descent path tracking the descending ball",
        "motion_graphics": ["Bold LaTeX formula overlay", "Telemetry HUD metrics card", "Vector gradient arrow"],
        "end": "Cyan ball rests securely in the valley trough"
      },
      "narration": "बैच ग्रेडिएंट डिसेंट में मॉडल हर स्टेप पर पूरे डेटासेट का लॉस कैलकुलेट करता है। इसका पाथ एकदम स्मूद और सीधा होता है, लेकिन बड़े डेटा पर यह बहुत धीमा और भारी साबित होता है।",
      "sfx": "riser"
    },
    {
      "type": "three",
      "variant": "stochastic_gd",
      "title": "Stochastic Gradient Descent (SGD)",
      "equation": "\\theta_{t+1} = \\theta_t - \\alpha \\nabla L_i(\\theta)",
      "metrics": {
        "Batch Size": "1 Sample",
        "Path": "Noisy",
        "Memory": "Sub-1MB"
      },
      "purpose": "Illustrate extreme noise and rapid erratic jumps of single-sample SGD",
      "transition": "match_cut",
      "visual": {
        "start": "High-angle view centered on rocky high-loss plateau",
        "objects": ["3D Loss Surface", "Neon Amber Particle Ball", "Zig-zag Erratic Trail"],
        "action": "Amber ball bounces violently left and right across ripples, jumping out of local minima with rapid frantic steps",
        "camera": "Dynamic crane pan tracking the erratic leaps of the amber particle",
        "motion_graphics": ["Formula tag for single sample", "HUD noisy trajectory badge", "Noise oscillation meter"],
        "end": "Particle oscillates rapidly around the base of the basin"
      },
      "narration": "एस-जी-डी यानी स्टोकेस्टिक ग्रेडिएंट डिसेंट हर बार सिर्फ एक सैंपल देखकर कदम बढ़ाता है। यह सुपर फास्ट है, लेकिन इसका रास्ता इतना जिग-जैग और शोर भरा होता है कि सही जगह पहुँचना मुश्किल हो जाता है।",
      "sfx": "impact"
    },
    {
      "type": "manim",
      "title": "Mathematical Update Rules",
      "purpose": "Provide exact mathematical grounding comparing single sample vs full batch summations",
      "transition": "morph",
      "visual": {
        "start": "Clean dark mathematical workspace with glowing blueprint grid lines",
        "objects": ["Neon LaTeX Equation Vectors", "Mathematical Sigma Summation Glyphs", "Gradient Vector Arrows"],
        "action": "Equations write themselves onto screen character by character with glowing particle dust",
        "camera": "Orthographic slow zoom focusing on the summation operator differences",
        "motion_graphics": ["Glowing formula brackets", "Underline emphasis waves on alpha learning rate"],
        "end": "Formulas align horizontally before folding into the next 3D demonstration"
      },
      "narration": "गणित में अंतर बहुत साफ है: बैच पूरे एन सैंपल्स का औसत लेता है, जबकि स्टोकेस्टिक सिर्फ एक रैंडम पॉइंट के ग्रेडिएंट पर काम करता है।",
      "sfx": "click",
      "manim": {
        "template": "Equations",
        "lines": [
          "\\theta_{t+1} = \\theta_t - \\alpha \\nabla L_B(\\theta)",
          "\\theta_{t+1} = \\theta_t - \\alpha \\nabla L_i(\\theta)"
        ]
      }
    },
    {
      "type": "three",
      "variant": "mini_batch",
      "title": "Mini-Batch Gradient Descent",
      "equation": "\\theta_{t+1} = \\theta_t - \\frac{\\alpha}{B} \\sum_{i \\in B} \\nabla L_i(\\theta)",
      "metrics": {
        "Batch Size": "32-512",
        "Hardware": "GPU SIMD",
        "Status": "Gold Standard"
      },
      "purpose": "Present Mini-Batch as the optimal synthesis of speed and stability",
      "transition": "match_cut",
      "visual": {
        "start": "Overhead view of glowing green cluster of particles converging on the hillside",
        "objects": ["3D Loss Surface", "Cluster of 64 Neon Green Particles", "Balanced Trajectory Ribbon"],
        "action": "Particles march forward together in harmonious bursts, gliding down the slope with gentle controlled momentum",
        "camera": "Smooth 60 FPS sweeping dolly following the cluster down the valley ridge",
        "motion_graphics": ["Mini-batch equation card", "GPU SIMD vectorization tag", "Optimal balance indicator"],
        "end": "Cluster gathers tightly at the optimal loss minimum"
      },
      "narration": "और यहीं आता है मिनी-बैच ग्रेडिएंट डिसेंट! यह बत्तीस से पाँच सौ बारह सैंपल्स का छोटा बैच लेता है। यह दोनों का बेस्ट कॉम्बिनेशन है: स्मूद पाथ और सुपर फास्ट स्पीड!",
      "sfx": "pop"
    },
    {
      "type": "three",
      "variant": "comparison_3d",
      "title": "3D Optimization Showdown",
      "metrics": {
        "Cyan": "Batch (Slow)",
        "Amber": "SGD (Noisy)",
        "Green": "Mini-Batch (Winner)"
      },
      "purpose": "Race all three optimization algorithms simultaneously to prove Mini-Batch superiority",
      "transition": "dissolve",
      "visual": {
        "start": "Wide multi-track vista over 3D loss valley with 3 starting gates",
        "objects": ["3D Terrain", "Cyan Ball (Batch)", "Amber Ball (SGD)", "Green Ball (Mini-Batch)"],
        "action": "All three balls release at once: Cyan creeps slowly; Amber zig-zags frantically; Green sprints smoothly and wins",
        "camera": "Wide helicopter orbit tracking the comparative distance between all three runners",
        "motion_graphics": ["3-way race HUD overlay", "Convergence time stopwatches", "Winner crown beacon"],
        "end": "Green ball captures the flag in the center with golden particle flash"
      },
      "narration": "तीनों को एक साथ दौड़ते हुए देखिए: बैच बहुत धीरे चल रहा है, एस-जी-डी भटक रहा है, और मिनी-बैच सबसे तेजी से सीधे लक्ष्य तक पहुँच जाता है।",
      "sfx": "ka_ching"
    },
    {
      "type": "compare",
      "title": "Comparison Matrix",
      "purpose": "Provide a clean structured summary of tradeoffs between Full Batch and Mini-Batch",
      "transition": "dissolve",
      "visual": {
        "start": "Split-screen comparison matrix with glowing neon vertical dividing line",
        "objects": ["Dual Frosted Glass Bento Cards", "Animated Row Bullets", "Interactive Checkmarks"],
        "action": "Rows slide in rhythmically from opposite sides on the beat, highlighting stability vs GPU parallelism",
        "camera": "Frontal orthographic push with soft spotlighting alternating left and right",
        "motion_graphics": ["Left red caution indicators", "Right neon cyan efficiency badges"],
        "end": "Both cards lock in balanced symmetry"
      },
      "left": {
        "heading": "Full Batch",
        "items": [
          "High Memory Usage",
          "Slow Per Iteration",
          "Gets Stuck Easily"
        ]
      },
      "right": {
        "heading": "Mini-Batch",
        "items": [
          "GPU Vectorized",
          "Fast Convergence",
          "Industry Standard"
        ]
      },
      "narration": "यही वजह है कि जी-पी-यू पर पैरेलल प्रोसेसिंग का पूरा फायदा उठाने के लिए मॉडर्न डीप लर्निंग में हमेशा मिनी-बैच का ही इस्तेमाल किया जाता है।",
      "sfx": "whoosh"
    },
    {
      "type": "stat",
      "value": "64",
      "label": "Standard Batch Size in Practice",
      "icon": "cpu",
      "purpose": "Deliver memorable practical metric for real-world machine learning engineers",
      "transition": "pop",
      "visual": {
        "start": "Dark screen with faint microchip motherboard tracks in background",
        "objects": ["Giant 3D Holographic '64' Numerals", "GPU Memory Bus Model", "Glow Neon Ring"],
        "action": "Number 64 slams into the frame with impact shockwave, vibrating with electric blue bloom",
        "camera": "Rapid zoom-in with kinetic camera recoil on impact beat",
        "motion_graphics": ["GPU SIMD alignment tag", "Batch size recommendation badge"],
        "end": "Numerals settle with soft ambient hovering pulse"
      },
      "narration": "प्रैक्टिस में बत्तीस या चौंसठ का बैच साइज सबसे कॉमन माना जाता है क्योंकि यह मेमोरी और स्पीड का एकदम परफेक्ट संतुलन देता है।",
      "sfx": "impact"
    },
    {
      "type": "outro",
      "text": "Master Modern Machine Learning",
      "icon": "sparkles",
      "purpose": "Inspire viewer to explore deep learning concepts and subscribe for future videos",
      "transition": "dissolve",
      "visual": {
        "start": "Loss surface shrinks down into an elegant 3D crystal trophy",
        "objects": ["Golden ML Optimization Trophy", "Floating Follow Badge", "Sparkling Light Particles"],
        "action": "Trophy rotates smoothly as neon subscribe button materializes with rhythmic pulse",
        "camera": "Slow cinematic pull-back into atmospheric dark-mode vignette",
        "motion_graphics": ["Subscribe CTA notification bell", "Deep learning roadmap badge"],
        "end": "Final glowing signature fade to black"
      },
      "narration": "अगली बार जब आप कोई न्यूरल नेटवर्क ट्रेन करें, तो सही ऑप्टिमाइज़र चुनना मत भूलना। ऐसे ही ए-आई कॉन्सेप्ट्स को थ्री-डी में समझने के लिए सब्सक्राइब जरूर करें!",
      "sfx": "sparkle"
    }
  ]
}

# -------------------------------------------------------------
# 3. DEMO NEW SCENES (10 scenes)
# -------------------------------------------------------------
DEMO_NEW_SCENES = {
  "id": "demo-new-scenes",
  "format": "vertical",
  "accent": "#00F0FF",
  "audio_mode": "scenes",
  "captions": True,
  "progress": True,
  "sfx": True,
  "loop": False,
  "music": None,
  "music_volume": 0.08,
  "meta": {
    "title": "Advanced Motion Graphics Engine Showcase",
    "description": "Showcasing next-generation procedural video scenes: code editors, system architecture, circular gauges, dynamic timelines, callout badges, and 3D WebGL neural networks.",
    "hashtags": [
      "MotionDesign",
      "SystemDesign",
      "SoftwareEngineering",
      "ThreeJS",
      "CodingInHindi"
    ],
    "facts_to_verify": []
  },
  "scenes": [
    {
      "type": "hook",
      "text": "New Scene Types Unlocked",
      "icon": "zap",
      "purpose": "Introduce the expansive array of newly unlocked high-fidelity motion graphics scenes",
      "transition": "zoom_through",
      "visual": {
        "start": "Dark high-tech laboratory with holographic interface consoles floating in mid-air",
        "objects": ["Glowing Core Console", "Floating Holographic Badges", "Neon Light Rings"],
        "action": "Power switch triggers; glowing circuit patterns spread across the floor toward the camera",
        "camera": "Rapid forward push-in passing through neon energy gateway",
        "motion_graphics": ["ENGINE VERSION 2.0 telemetry badge", "Active rendering status: READY"],
        "end": "Screen transitions through flash into the code editor IDE"
      },
      "narration": "दोस्तों, हमारे वीडियो इंजन में अब शामिल हो चुके हैं दस नए पावरफुल सीन्स! चलिए देखते हैं कि अब हमारे वीडियो कितने नेक्स्ट लेवल बन सकते हैं।",
      "sfx": "fast_whoosh"
    },
    {
      "type": "code",
      "title": "Async Worker Loop",
      "language": "python",
      "filename": "worker.py",
      "lines": [
        "async def process_task(task_id: str):",
        "    data = await fetch_payload(task_id)",
        "    result = await engine.compute(data)",
        "    await queue.acknowledge(task_id)"
      ],
      "highlight": 2,
      "purpose": "Demonstrate native dark-mode macOS terminal code scene with live syntax highlighting",
      "transition": "match_cut",
      "visual": {
        "start": "macOS window frame with red, yellow, and green window control dots",
        "objects": ["Dark Terminal Window", "Monaco Font Syntax Highlighting", "Glowing Cursor Bar"],
        "action": "Code types in rhythmically; line 3 lights up with bright cyan background highlighting",
        "camera": "Subtle 3D Dutch tilt emphasizing the terminal depth and glass reflection",
        "motion_graphics": ["Line number counter", "Python async execution pulse indicator"],
        "end": "Terminal minimizes into a floating micro-node"
      },
      "narration": "पहला है कोड सीन, जहाँ सिंटेक्स हाइलाइटिंग और कर्सर टाइपिंग के साथ आप किसी भी जटिल एल्गोरिदम को आसानी से समझा सकते हैं।",
      "sfx": "typing"
    },
    {
      "type": "architecture",
      "title": "Distributed Topology",
      "nodes": [
        "API Gateway",
        "Auth Service",
        "Worker Pool",
        "Redis Cache"
      ],
      "steps": [
        "01 / Validate Token",
        "02 / Route Request",
        "03 / Execute Task",
        "04 / Write State"
      ],
      "activeNode": 2,
      "tag": "ASYNC DISPATCH",
      "purpose": "Illustrate complex distributed backend services with synchronized pulsing nodes",
      "transition": "morph",
      "visual": {
        "start": "Four server node blocks arranged in clean vertical hierarchy",
        "objects": ["4 Service Nodes", "Interconnecting Neon Fiber Lines", "Data Packet Beams"],
        "action": "Active node pulses brightly as data packet travels from API Gateway down to Redis Cache",
        "camera": "Vertical tracking pan following packet trajectory down the service chain",
        "motion_graphics": ["ASYNC DISPATCH tag", "Step progress badges 01 to 04"],
        "end": "All 4 nodes illuminate simultaneously in healthy green state"
      },
      "narration": "दूसरा है आर्किटेक्चर सीन! माइक्रोसर्विसेज और सिस्टम डिजाइन के फ्लो को अब आप डायनेमिक नोड्स के साथ दिखा सकते हैं।",
      "sfx": "radar_beep"
    },
    {
      "type": "gauge",
      "title": "Sub-10ms Response Time",
      "startValue": 120,
      "endValue": 8,
      "unit": "ms",
      "status": "Ultra Fast",
      "badge": "Top 1%",
      "min": 0,
      "max": 150,
      "purpose": "Showcase high-performance metrics with kinetic circular speedometer dial",
      "transition": "pop",
      "visual": {
        "start": "Circular speedometer gauge resting at 120ms amber alert zone",
        "objects": ["3D Speedometer Dial", "Radial HUD Arc", "High-Precision Metric Counter"],
        "action": "Gauge needle swings back rapidly from 120ms down to 8ms with neon green bloom",
        "camera": "Direct front-on zoom with gentle micro-shake when needle locks into place",
        "motion_graphics": ["Ultra Fast status badge", "Top 1% achievement tag", "Glowing radial tick marks"],
        "end": "Gauge emits expanding pulse ring celebrating sub-10ms latency"
      },
      "narration": "तीसरा है गेज सीन, जो लेटेंसी और परफॉरमेंस मैट्रिक्स को एक लाइव स्पीडोमीटर की तरह रोल-अप करके दिखाता है।",
      "sfx": "ka_ching"
    },
    {
      "type": "timeline",
      "title": "4-Phase Execution Pipeline",
      "steps": [
        "Ingest Raw Stream",
        "Tokenize & Embed",
        "Vector Search (HNSW)",
        "LLM Inference"
      ],
      "activeStep": 2,
      "purpose": "Walk through ordered multi-stage engineering pipelines with sequential timeline radar beats",
      "transition": "match_cut",
      "visual": {
        "start": "Horizontal timeline track with 4 sequential milestone circles",
        "objects": ["Timeline Track Ribbon", "4 Phase Markers", "Active Step Radar Ring"],
        "action": "Steps 1 and 2 check off; Step 3 pulses with radar wave showing active vector search in progress",
        "camera": "Smooth horizontal dolly sliding across the execution track",
        "motion_graphics": ["Step index tags 01 through 04", "Active radar ripple effect"],
        "end": "Camera anchors on Step 3 before transitioning to callout"
      },
      "narration": "चौथा है टाइमलाइन सीन! डेटा पाइपलाइन और लाइफसाइकिल स्टेप्स को दिखाने का यह सबसे साफ और सुंदर तरीका है।",
      "sfx": "tick"
    },
    {
      "type": "callout",
      "title": "Cache Invalidation Is Hard",
      "category": "Golden Rule",
      "text": "There are only two hard things in Computer Science: cache invalidation and naming things.",
      "subtext": "Always set sensible TTL and leverage write-through invalidation buffers.",
      "purpose": "Highlight foundational software engineering principles with high-visibility frosted card",
      "transition": "whip_pan",
      "visual": {
        "start": "Clean dark background with subtle gold ambient spotlight",
        "objects": ["Floating Glassmorphic Card", "Glowing Golden Shield Icon", "Headline Text Ribbon"],
        "action": "Golden Rule card slides into frame from the bottom with spring physics and glowing border",
        "camera": "Slight tilt-up as card docks securely in screen center",
        "motion_graphics": ["Golden Rule ribbon badge", "Subtext advice container", "Gold light sweep across surface"],
        "end": "Card dissolves gracefully into the 3D neural network"
      },
      "narration": "पाँचवाँ है कॉलआउट सीन, जो किसी भी गोल्डन रूल या अहम वॉर्निंग को स्क्रीन पर सबसे अलग और चमकदार तरीके से उभारता है।",
      "sfx": "impact"
    },
    {
      "type": "three",
      "variant": "neural_network_3d",
      "title": "Deep Neural Activation",
      "equation": "a^{(l)} = \\sigma(W^{(l)} a^{(l-1)} + b^{(l)})",
      "metrics": {
        "Layers": "12",
        "Parameters": "175B",
        "Activation": "GELU"
      },
      "purpose": "Demonstrate deep neural network feedforward signals in native 3D WebGL",
      "transition": "zoom_through",
      "visual": {
        "start": "Camera inside the input layer of a multi-layer 3D neural network",
        "objects": ["12 Floating Neural Layers", "Synaptic Connection Filaments", "Signal Charge Orbs"],
        "action": "Bright energy pulses fire from input layer through hidden layers to output nodes in wave motion",
        "camera": "Flying dolly through the interior synaptic forest between layer columns",
        "motion_graphics": ["Layer activation formula", "175B Parameters telemetry HUD", "Synaptic weight density map"],
        "end": "Output layer sparks bright white, transferring into benchmark comparison"
      },
      "narration": "छठा है थ्री-डी न्यूरल नेटवर्क सीन, जहाँ थ्री डॉट जे-एस की मदद से आप डीप लर्निंग लेयर्स को असली थ्री-डी में घूमकर दिखा सकते हैं।",
      "sfx": "radar_beep"
    },
    {
      "type": "benchmark",
      "title": "Speed Optimization Showdown",
      "unit": "ms",
      "runners": [
        { "name": "Python Loops", "value": 450, "status": "Slow", "color": "#FF5500" },
        { "name": "NumPy SIMD", "value": 42, "status": "Fast", "color": "#FFC857" },
        { "name": "Rust SIMD", "value": 4, "status": "Winner", "color": "#00F0FF" }
      ],
      "purpose": "Pit technologies head-to-head with animated racing progress bars",
      "transition": "pop",
      "visual": {
        "start": "Three horizontal race tracks at starting line with zero progress",
        "objects": ["3 Racing Bar Tracks", "Neon Fill Bars", "Performance Badges"],
        "action": "All three bars launch forward: Python crawls, NumPy dashes, and Rust sprints across finish line in 4ms",
        "camera": "Direct frontal view with dynamic tracking zoom on the winning Rust bar",
        "motion_graphics": ["Winner trophy beacon", "Time delta counter", "Execution unit indicator (ms)"],
        "end": "Winning bar flashes in brilliant cyan with victory sparkles"
      },
      "narration": "सातवाँ है बेंचमार्क सीन! अलग-अलग टूल्स और लैंग्वेजेस की स्पीड को लाइव रेसिंग बार्स के साथ कंपेयर कीजिए।",
      "sfx": "ka_ching"
    },
    {
      "type": "three",
      "variant": "server_rack_3d",
      "title": "Datacenter Rack Mesh",
      "purpose": "Showcase industrial cloud infrastructure with photorealistic server rack modules",
      "transition": "match_cut",
      "visual": {
        "start": "High angle overlooking glowing aisle of 3D server racks in datacenter",
        "objects": ["High-Density 3D Server Racks", "Pulsating Activity LEDs", "Cooling Exhaust Grid"],
        "action": "LED status indicators flicker rapidly; overhead fiber trays illuminate with pulsating data transit",
        "camera": "Cinematic low-angle tracking dolly alongside the server cabinet faces",
        "motion_graphics": ["99.999% Uptime SLA tag", "Active server cluster monitor HUD", "Rack thermal telemetry"],
        "end": "Camera pans up toward overhead ceiling lights"
      },
      "narration": "आठवाँ है सर्वर रैक सीन, जो क्लाउड इंफ्रास्ट्रक्चर और डेटाबेस क्लस्टर्स को एक हाई-टेक डेटा सेंटर जैसा रियलिस्टिक लुक देता है।",
      "sfx": "whoosh"
    },
    {
      "type": "outro",
      "title": "Ready To Produce Videos",
      "text": "Code-Driven Video Pipeline",
      "icon": "sparkles",
      "purpose": "Conclude showcase with call-to-action to build engaging educational content",
      "transition": "dissolve",
      "visual": {
        "start": "All 10 scene icons converge into a central rotating holographic cube",
        "objects": ["Central Holographic Prism", "Particle Stream Orbit", "Glowing Subscribe Plate"],
        "action": "Prism bursts into radiant neon light rays; follow button slides into view with crisp spring motion",
        "camera": "Smooth pull-back into deep atmospheric dark-mode finish",
        "motion_graphics": ["Follow for Tech Insights CTA", "Opus 5.5 Production Quality seal", "Notification bell ring animation"],
        "end": "Final brand logo shines in centered serenity"
      },
      "narration": "ये सभी सीन्स पूरी तरह से ऑटोमेटेड और कोड-ड्रिवन हैं। तो देर किस बात की? चलिए मिलकर बनाते हैं दुनिया के सबसे शानदार एजुकेशनल वीडियोज!",
      "sfx": "sparkle"
    }
  ]
}

# -------------------------------------------------------------
# 4. DEMO ALL SCENES (9 scenes)
# -------------------------------------------------------------
DEMO_ALL_SCENES = {
  "id": "demo-all-scenes",
  "format": "vertical",
  "accent": "#58D6C2",
  "audio_mode": "scenes",
  "captions": True,
  "progress": True,
  "sfx": True,
  "loop": False,
  "music": None,
  "music_volume": 0.08,
  "meta": {
    "title": "Full Code-Driven Video Pipeline Demo",
    "description": "Comprehensive tour of procedural video primitives: hooks, mathematical Manim equations, WebGL 3D shaders, structured compare tables, stats, quotes, and outro calls-to-action.",
    "hashtags": [
      "EdTech",
      "Remotion",
      "Manim",
      "WebDev",
      "CreativeCoding"
    ],
    "facts_to_verify": []
  },
  "scenes": [
    {
      "type": "hook",
      "text": "Every Scene Type In Motion",
      "icon": "play",
      "purpose": "Captivate the viewer with the full diversity of code-driven animation primitives",
      "transition": "zoom_through",
      "visual": {
        "start": "Deep dark void with glowing teal coordinate axes expanding in all directions",
        "objects": ["Giant Play Icon Prism", "Neon Grid Floor", "Kinetic Particle Cloud"],
        "action": "Prism spins on its axis as neon light ribbons whip around the camera",
        "camera": "Forward high-speed dolly plunging through the center of the play prism",
        "motion_graphics": ["OPUS 5.5 CINEMATIC ENGINE header", "FPS telemetry lock: 30 FPS"],
        "end": "Camera breaks through light wall into the mathematical Manim grid"
      },
      "narration": "यह वीडियो हमारे कोड-ड्रिवन इंजन के हर एक सीन टाइप का लाइव डेमो है। हुक्स से लेकर थ्री-डी विज़ुअल्स तक, सब कुछ कोड से रेंडर होता है।",
      "sfx": "fast_whoosh"
    },
    {
      "type": "manim",
      "title": "Procedural Math Engine",
      "purpose": "Showcase pixel-perfect procedural mathematics powered by Manim vector rendering",
      "transition": "morph",
      "visual": {
        "start": "Clean Cartesian coordinate system with illuminated cyan axes",
        "objects": ["Cartesian Coordinate System", "Sine Curve Vector Line", "Tangent Slope Indicator"],
        "action": "Sine wave plots itself smoothly from left to right with glowing neon trailing line",
        "camera": "Slow cinematic camera pan tracking the apex peak of the curve",
        "motion_graphics": ["Function tag: f(x) = sin(x)", "Extrema point beacon", "Grid coordinate labels"],
        "end": "Graph rotates 90 degrees into 3D topographical terrain"
      },
      "narration": "दूसरा है मैनम इंटीग्रेशन, जहाँ जटिल गणितीय इक्वेशन्स और स्मूद कर्व्स पिक्सल-परफेक्ट वेक्टर क्वालिटी में एनिमेट होते हैं।",
      "sfx": "click",
      "manim": {
        "template": "Graph",
        "fn": "np.sin(x)",
        "x_range": [-4, 4, 1],
        "y_range": [-2, 2, 1]
      }
    },
    {
      "type": "three",
      "variant": "gradient_descent",
      "title": "3D WebGL Shader Surface",
      "purpose": "Demonstrate native Three.js 3D WebGL terrain with real-time dynamic lighting",
      "transition": "match_cut",
      "visual": {
        "start": "High-altitude overview of undulating neon 3D mathematical landscape",
        "objects": ["3D Wireframe Surface", "Dual Colored Particle Probes", "Depth Fog Vignette"],
        "action": "Surface ripples dynamically as particle probes travel down contour gradients",
        "camera": "Continuous 360-degree slow orbit around the central loss crater",
        "motion_graphics": ["Realtime WebGL shader tag", "Altitude elevation meter", "Surface normal vectors"],
        "end": "Camera swoops low across the surface valley into the feature bullet cards"
      },
      "narration": "तीसरा है थ्री डॉट जे-एस का थ्री-डी वेब-जी-एल सीन। शेडर्स, पार्टिकल्स और थ्री-डी मॉडल्स सीधे वीडियो के अंदर स्मूदली चलते हैं।",
      "sfx": "riser"
    },
    {
      "type": "bullets",
      "title": "Core Engine Features",
      "items": [
        { "text": "Zero Static Slides", "icon": "zap" },
        { "text": "Procedural Audio SFX", "icon": "volume-2" },
        { "text": "Continuous Camera Flow", "icon": "video" }
      ],
      "purpose": "Reinforce the core architectural principles that guarantee high viewer retention",
      "transition": "whip_pan",
      "visual": {
        "start": "Three dark frosted glass cards stacked neatly in perspective",
        "objects": ["3 Glass Bento Cards", "Glowing Semantic Lucide Icons", "Neon Edge Tracers"],
        "action": "Cards deploy horizontally in staggered 120 BPM rhythm with pop micro-animations",
        "camera": "Subtle push-in with gentle rotational tilt matching bullet pop timing",
        "motion_graphics": ["Bullet index indicators", "Feature checkmark badges", "Edge illumination glow"],
        "end": "Cards lock into unified layout before splitting into compare matrix"
      },
      "narration": "चौथा है बुलेट्स सीन, जो बोरिंग लिस्ट्स को हाई-इम्पैक्ट विज़ुअल कार्ड्स में बदल देता है, ताकि दर्शक का ध्यान कभी न भटके।",
      "sfx": "pop"
    },
    {
      "type": "compare",
      "title": "Old Slides vs Code Motion",
      "purpose": "Directly compare traditional static presentation slides with dynamic code-driven motion",
      "transition": "dissolve",
      "visual": {
        "start": "Split-screen layout comparing dull monochromatic left card against vibrant glowing right card",
        "objects": ["Left Monochromatic Card", "Right Neon Glowing Card", "Vertical Laser Divider"],
        "action": "Divider sweeps across screen, demonstrating dramatic visual upgrade of code-driven animation",
        "camera": "Orthographic slow zoom focusing on the contrast between dull text and dynamic motion",
        "motion_graphics": ["Left status: OBSOLETE", "Right status: MODERN OPUS STANDARD", "Checkmark highlights"],
        "end": "Right card expands to dominate frame"
      },
      "left": {
        "heading": "Old Slides",
        "items": [
          "Boring PowerPoint",
          "Static Text Only",
          "High Drop-off"
        ]
      },
      "right": {
        "heading": "Code Motion",
        "items": [
          "Dynamic Three.js",
          "Pixel-Perfect Manim",
          "Max Engagement"
        ]
      },
      "narration": "पाँचवाँ है कम्पेयर सीन। पुराने थके हुए स्लाइड्स और मॉडर्न कोड मोशन के बीच का फर्क साफ शब्दों और विज़ुअल्स में समझाइए।",
      "sfx": "whoosh"
    },
    {
      "type": "stat",
      "value": "30 FPS",
      "label": "Realtime Pipeline Rendering",
      "icon": "zap",
      "purpose": "Highlight rendering performance with bold full-screen metric typography",
      "transition": "pop",
      "visual": {
        "start": "Black background with faint neon telemetry grid lines",
        "objects": ["Bold 3D '30 FPS' Metric Glyph", "Glowing Framing Ring", "Speed Particle Trails"],
        "action": "Metric rolls up rapidly from 0 to 30 FPS and slams forward with electric green shockwave",
        "camera": "Rapid punch-in with subtle lens vibration on impact",
        "motion_graphics": ["Ultra-Smooth Framerate badge", "Realtime Synthesis tag", "Bloom lighting pulse"],
        "end": "Numerals lock in center screen with gentle breathing glow"
      },
      "narration": "तीस फ्रेम्स पर सेकंड की रफ्तार से यह पूरा सिस्टम बिना किसी रुकावट के आपके वीडियो को तेजी से रेंडर कर देता है।",
      "sfx": "impact"
    },
    {
      "type": "image",
      "image": "images/sample.jpg",
      "title": "Cinematic Camera Push",
      "purpose": "Demonstrate cinematic Ken Burns camera push and lens vignette over image assets",
      "transition": "dissolve",
      "visual": {
        "start": "High-resolution architectural visual asset framed in dark border",
        "objects": ["High-Res Graphic Asset", "Cinematic Dark Vignette", "Subtle Lens Flare"],
        "action": "Smooth Ken Burns camera push-in smoothly gliding toward the focal center",
        "camera": "Continuous 2.5D dolly-in with atmospheric depth-of-field blur on perimeter",
        "motion_graphics": ["Cinematic Asset Framing border", "Aspect Ratio 9:16 Crop Guides"],
        "end": "Image fades softly into quote pedestal"
      },
      "narration": "इमेज सीन में आप किसी भी डायग्राम या स्क्रीनशॉट को सिनेमैटिक कैमरा मोशन के साथ पेश कर सकते हैं।",
      "sfx": "whoosh"
    },
    {
      "type": "quote",
      "text": "Code is the most expressive creative medium in history.",
      "author": "Antigravity Video Engine",
      "purpose": "Inspire the audience with memorable philosophy on code-driven creative expression",
      "transition": "morph",
      "visual": {
        "start": "Atmospheric deep navy void with floating serif quotation glyphs",
        "objects": ["Large 3D Quotation Marks", "Elegantly Formatted Typography Slab", "Gold Accent Line"],
        "action": "Quote text reveals smoothly word by word with glowing light sweep across the typography",
        "camera": "Slow contemplative tilt-up highlighting the author citation",
        "motion_graphics": ["Golden Author Rule Line", "Typography Glow Mask"],
        "end": "Quote letters soften into background stars as outro manifests"
      },
      "narration": "और जब बात गहरी बात कहने की हो, तो कोट सीन स्क्रीन पर एक ठहराव और वजन पैदा करता है।",
      "sfx": "downlifter"
    },
    {
      "type": "outro",
      "text": "Follow For Code Driven AI",
      "icon": "sparkles",
      "purpose": "Encourage audience to follow the channel for more automated video technology deep dives",
      "transition": "dissolve",
      "visual": {
        "start": "All components synthesize into a single radiant diamond emblem",
        "objects": ["Diamond Engine Emblem", "Follow CTA Card", "Cascading Light Particles"],
        "action": "Emblem pulses with brilliant cyan energy; follow button springs into view with cheerful sparkle",
        "camera": "Gentle crane pull-back into dark vignette finish",
        "motion_graphics": ["Follow for Code-Driven AI badge", "Subscribe Bell Notification Glow", "Channel payoff tag"],
        "end": "Final elegant fade to dark-mode black"
      },
      "narration": "यह है मॉडर्न वीडियो क्रिएशन का भविष्य। ऐसी ही पावरफुल कोड-ड्रिवन टेक्नोलॉजी के लिए चैनल को अभी फॉलो करें!",
      "sfx": "sparkle"
    }
  ]
}

# -------------------------------------------------------------
# 5. PYTHAGORAS (6 scenes)
# -------------------------------------------------------------
PYTHAGORAS = {
  "id": "pythagoras",
  "format": "vertical",
  "accent": "#00F0FF",
  "audio_mode": "scenes",
  "captions": True,
  "progress": True,
  "sfx": True,
  "loop": False,
  "music": None,
  "music_volume": 0.08,
  "meta": {
    "title": "Why Pythagoras Still Runs the Modern World",
    "description": "Discover why a 2,500-year-old geometric formula: a squared plus b squared equals c squared: remains the secret engine behind GPS satellites, 3D video game engines, and skyscraper engineering.",
    "hashtags": [
      "Mathematics",
      "Geometry",
      "ScienceExplained",
      "STEM",
      "CodingInHindi"
    ],
    "facts_to_verify": [
      "The Pythagorean Theorem is the foundational distance metric for Euclidean space, used directly in GPS triangulation and 3D graphics dot-product calculations."
    ]
  },
  "scenes": [
    {
      "type": "hook",
      "text": "The Formula Behind Every Bridge",
      "icon": "triangle",
      "purpose": "Hook curiosity by showing how an ancient math formula secretly powers modern skyscrapers and GPS",
      "transition": "zoom_through",
      "visual": {
        "start": "High-altitude view over an illuminated modern suspension bridge at night",
        "objects": ["3D Suspension Bridge Model", "Neon Geometric Wireframe Cables", "Glowing Roadway"],
        "action": "Bridge cables dissolve into glowing right-angle triangles as structural stress lines illuminate",
        "camera": "Rapid fly-through along the bridge suspension cables into the central steel pylon",
        "motion_graphics": ["01 / THE FOUNDATION tag", "Glowing right-angle square symbol (90°)"],
        "end": "Camera plunges through steel joint into pure geometric coordinate plane"
      },
      "narration": "ढाई हजार साल पुराना एक साधारण फॉर्मूला आज भी दुनिया के हर पुल, गगनचुंबी इमारत और यहाँ तक कि आपके फोन के जी-पी-एस को चला रहा है।",
      "sfx": "fast_whoosh"
    },
    {
      "type": "manim",
      "title": "Pythagorean Theorem",
      "purpose": "Demonstrate the mathematical formula and square geometric proof with procedural Manim equations",
      "transition": "morph",
      "visual": {
        "start": "Crisp dark blueprint grid with a floating glowing right-angle triangle",
        "objects": ["Neon Right Triangle", "Adjacent Square a²", "Opposite Square b²", "Hypotenuse Square c²"],
        "action": "Squares emerge from all three sides; water-like neon particles from a² and b² pour seamlessly into c²",
        "camera": "Direct orthographic zoom centered on the hypotenuse equation",
        "motion_graphics": ["Bold LaTeX formula overlay: a² + b² = c²", "Side length indicator tags: a, b, c"],
        "end": "Formula locks in brilliant cyan before transitioning to architectural applications"
      },
      "narration": "पाइथागोरस प्रमेय कहता है कि किसी भी समकोण त्रिभुज में आधार और लंब के वर्गों का योग हमेशा कर्ण के वर्ग के बराबर होता है।",
      "sfx": "click",
      "manim": {
        "template": "Equations",
        "lines": [
          "a^2 + b^2 = c^2",
          "c = \\sqrt{a^2 + b^2}"
        ]
      }
    },
    {
      "type": "bullets",
      "title": "Real-World Architecture",
      "items": [
        { "text": "GPS Satellite Trilateration", "icon": "satellite" },
        { "text": "3D Game Engine Distances", "icon": "gamepad-2" },
        { "text": "Skyscraper Structural Truss", "icon": "building-2" }
      ],
      "purpose": "Provide concrete real-world engineering domains that rely directly on the theorem",
      "transition": "whip_pan",
      "visual": {
        "start": "Three dark glass panels floating in orbital space",
        "objects": ["3 Glass Bento Cards", "GPS Satellite Hologram", "3D Game Controller Mesh", "Skyscraper Truss"],
        "action": "Cards deploy with snappy staggered entrance on the beat; 3D icons rotate smoothly",
        "camera": "Dynamic horizontal panning dolly with depth-of-field shifting across cards",
        "motion_graphics": ["Industry domain tags", "Distance vector computation lines"],
        "end": "Cards slide together into a comparison matrix"
      },
      "narration": "चाहे वीडियो गेम में दो किरदारों के बीच की दूरी नापनी हो, या अंतरिक्ष से जी-पी-एस सैटेलाइट से आपकी लोकेशन पता करनी हो, हर जगह यही सूत्र काम करता है।",
      "sfx": "pop"
    },
    {
      "type": "compare",
      "title": "2D Plane vs 3D Reality",
      "purpose": "Explain how the 2D formula extends seamlessly into 3D Euclidean space (x² + y² + z² = d²)",
      "transition": "dissolve",
      "visual": {
        "start": "Split-screen interface: left shows flat 2D blueprint; right shows volumetric 3D coordinate cube",
        "objects": ["2D Flat Triangle", "3D Volumetric Coordinate Cube", "Diagonal Distance Vector"],
        "action": "Formula expands from 2 terms on the left to 3 terms on the right as diagonal vector stretches in 3D",
        "camera": "Slow orbit around the 3D cube illustrating depth coordinate Z",
        "motion_graphics": ["Left: 2D Euclidean tag", "Right: 3D Spatial Vector tag", "Norm formula indicator"],
        "end": "Right side 3D cube sparkles with verification checkmark"
      },
      "left": {
        "heading": "2D Flat Geometry",
        "items": [
          "Sheet Paper Proof",
          "Distance = √(x² + y²)",
          "Simple Surveying"
        ]
      },
      "right": {
        "heading": "3D Spatial Computing",
        "items": [
          "VR Headset Tracking",
          "Spatial Distance",
          "Game Physics Engines"
        ]
      },
      "narration": "थ्री-डी स्पेस में इसी फॉर्मूले में बस एक तीसरा कोऑर्डिनेट जुड़ जाता है, जिससे पूरी कंप्यूटर ग्राफिक्स की दुनिया खड़ी होती है।",
      "sfx": "whoosh"
    },
    {
      "type": "stat",
      "value": "100%",
      "label": "Foundation of Euclidean Distance",
      "icon": "compass",
      "purpose": "Deliver impactful takeaway on the universal ubiquity of the formula across physics and computer science",
      "transition": "pop",
      "visual": {
        "start": "Clean dark void with glowing golden compass divider in center",
        "objects": ["Giant 3D '100%' Glyph", "Golden Architectural Compass", "Glowing Measurement Ring"],
        "action": "Compass rotates 360 degrees drawing a perfect cyan measurement circle; 100% punches forward on the beat",
        "camera": "Kinetic punch-in on number 100% with bloom illumination",
        "motion_graphics": ["Euclidean Metric seal", "Universal Constant tag"],
        "end": "Glyph hovers serenely with soft radial pulse"
      },
      "narration": "सौ प्रतिशत सटीकता के साथ यह फॉर्मूला साबित करता है कि गणित सिर्फ किताबों के लिए नहीं, बल्कि पूरी दुनिया को रचने का कोड है।",
      "sfx": "impact"
    },
    {
      "type": "outro",
      "text": "Math Powers The Real World",
      "icon": "sparkles",
      "purpose": "Inspire the viewer to appreciate math and subscribe for more STEM explanations",
      "transition": "dissolve",
      "visual": {
        "start": "Golden right triangle transforms into a radiant star beacon",
        "objects": ["Golden Star Beacon", "Floating YouTube Subscribe Badge", "Expanding Energy Waves"],
        "action": "Star beacon emits warm golden particle shower; subscribe button slides in with playful spring bounce",
        "camera": "Smooth pull-back into atmospheric dark vignette finish",
        "motion_graphics": ["Math in Motion badge", "STEM Deep Dives payoff tag", "Subscribe notification bell"],
        "end": "Final dark-mode fade to black"
      },
      "narration": "गणित के ऐसे ही जादुई सिद्धांतों को विज़ुअली समझने के लिए हमें अभी फॉलो करें। मिलते हैं अगले वीडियो में!",
      "sfx": "sparkle"
    }
  ]
}

# -------------------------------------------------------------
# Write all files cleanly
# -------------------------------------------------------------
files_to_write = [
  (VIDEOS_DIR / "how-upi-works.json", HOW_UPI_WORKS),
  (VIDEOS_DIR / "gradient-descent.json", GRADIENT_DESCENT),
  (VIDEOS_DIR / "demo-new-scenes.json", DEMO_NEW_SCENES),
  (VIDEOS_DIR / "demo-all-scenes.json", DEMO_ALL_SCENES),
  (VIDEOS_DIR / "pythagoras.json", PYTHAGORAS),
]

for path, data in files_to_write:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Wrote {path.name} ({len(data['scenes'])} scenes)")

print("\nAll 5 video scripts regenerated with full 10-point storyboard standard!")
