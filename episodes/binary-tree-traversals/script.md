# Episode: Binary Tree Traversals: 4 Ways to Visit Every Node (ट्री ट्रावर्सल)
- Format: vertical
- Theme: cyberpunk
- Accent: #00F0FF
- Art Direction: editorial
- Pad Seconds: 0.28

## Scene 1
- **Type**: tree_traversal_visualizer
- **Variant**: linear_vs_tree
- **Tag**: 01 / THE BRANCHING PUZZLE
- **Title**: WHY NOT JUST READ IN A LINE?
- **Tone**: [Curious, high-energy]
- **Visual Intent**: Interactive 3-phase visualizer: Phase 1 shows a 1D linear array [10, 25, 42, 68, 99] scanned in sequence. Phase 2 shows data branching like tree branches with left and right paths. Phase 3 shows a real computer folder directory tree (/root/documents/projects) demonstrating why straight-line reading fails.
- **Narration**:
एक सीधी लिस्ट में डेटा पढ़ना आसान है—पहले से आखिरी तक! लेकिन जब डेटा पेड़ की शाखाओं की तरह फैल जाए—जैसे फ़ाइल फ़ोल्डर्स या ऑर्गनाइज़ेशन चार्ट—तो कंप्यूटर हर नोड तक कैसे पहुँचे बिना भटके?

## Scene 2
- **Type**: tree_traversal_visualizer
- **Variant**: tree_anatomy
- **Tag**: 02 / THE 3-PIECE ANATOMY
- **Title**: ROOT • LEFT • RIGHT
- **Tone**: [Clear, foundational]
- **Visual Intent**: Complete graphical Binary Tree with glowing connected nodes. Synchronized animated pointer arrows call out: 1. Root Node (top center), 2. Left Child (बायाँ बच्चा with cyan pointer), and 3. Right Child (दायाँ बच्चा with magenta pointer).
- **Narration**:
हर बाइनरी ट्री में सिर्फ तीन हिस्से होते हैं: खुद वह नोड यानी रूट, उसका बायाँ बच्चा यानी लेफ्ट, और दायाँ बच्चा यानी राइट। आप इन्हें किस क्रम में विज़िट करते हैं, वही तय करता है चार जादुई रास्ते!

## Scene 3
- **Type**: tree_traversal_visualizer
- **Variant**: preorder
- **Tag**: 03 / PATH 1: PREORDER
- **Title**: ROOT ➔ LEFT ➔ RIGHT
- **Tone**: [Energetic, analytical]
- **Visual Intent**: Binary Tree with Room & Door metaphor. Moving laser pointer visits Root (1) first and notes it down [1], takes the Left Door to Node (2) and notes it down [1, 2], takes Left Leaf (4) [1, 2, 4], then Right Door (5) [1, 2, 4, 5], outputting the complete cloned sequence.
- **Narration**:
पहला है प्री-ऑर्डर: रूट पहले, फिर लेफ्ट, फिर राइट! यानी जिस कमरे में पहुँचे, पहले उसे नोट करो, फिर उसके दोनों दरवाज़ों में जाओ। इसका इस्तेमाल होता है पूरे ट्री की हूबहू कॉपी या डायरेक्टरी स्ट्रक्चर बनाने में!

## Scene 4
- **Type**: tree_traversal_visualizer
- **Variant**: inorder
- **Tag**: 04 / PATH 2: INORDER
- **Title**: LEFT ➔ ROOT ➔ RIGHT
- **Tone**: [Revelatory, fascinated]
- **Visual Intent**: Binary Search Tree (BST) with nodes 4 (root), 2, 6, 1, 3, 5, 7. Laser pointer dives to Leftmost Leaf (1) first, moves up to Parent (2), visits Right (3), Main Root (4), then Right subtree, producing an illuminated sorted array [1, 2, 3, 4, 5, 6, 7] in perfect ascending order.
- **Narration**:
दूसरा है इन-ऑर्डर: पहले लेफ्ट, फिर रूट, फिर राइट! और यहाँ होता है कंप्यूटर साइंस का सबसे खूबसूरत जादू—अगर आपका ट्री बाइनरी सर्च ट्री है, तो इन-ऑर्डर ट्रावर्सल सारे नंबर्स को एकदम सॉर्टेड क्रम में बाहर निकालता है!

## Scene 5
- **Type**: tree_traversal_visualizer
- **Variant**: postorder
- **Tag**: 05 / PATH 3: POSTORDER
- **Title**: CHILDREN FIRST, ROOT LAST
- **Tone**: [Instructive, logical]
- **Visual Intent**: Bottom-up deletion and expression evaluation visualizer. Children nodes are visited, processed, and dissolved safely first, before the parent node deletes, ending with the root node deleted last (no orphan memory leaks).
- **Narration**:
तीसरा है पोस्ट-ऑर्डर: पहले लेफ्ट और राइट बच्चे, और रूट सबसे आखिर में! सोचिए, किसी फ़ोल्डर को डिलीट करना हो, तो पहले अंदर की फ़ाइल्स हटानी होंगी ना? बॉटम-अप क्लीनअप और मैथ एक्सप्रेशन्स के लिए यही इकलौता रास्ता है!

## Scene 6
- **Type**: tree_traversal_visualizer
- **Variant**: level_order
- **Tag**: 06 / PATH 4: LEVEL-ORDER
- **Title**: BREADTH-FIRST QUEUE SCAN
- **Tone**: [Dynamic, structured]
- **Visual Intent**: Binary Tree divided into horizontal floors (Level 0, Level 1, Level 2). A glowing horizontal radar scanner sweeps floor-by-floor from top to bottom, synchronized with an active animated FIFO Queue enqueuing and dequeuing elements in BFS order.
- **Narration**:
और चौथा है लेवल-ऑर्डर यानी बी-एफ-एस! गहराई में जाने के बजाय, एक क्यू डेटा स्ट्रक्चर की मदद से हर मंज़िल को एक-एक करके स्कैन करो—लेवल ज़ीरो, फिर लेवल वन, फिर लेवल टू! जैसे रडार हर लेयर को स्कैन करता है!

## Scene 7
- **Type**: tree_traversal_visualizer
- **Variant**: cheat_sheet
- **Tag**: 07 / THE ULTIMATE CHEAT SHEET
- **Title**: WHICH TRAVERSAL TO CHOOSE?
- **Tone**: [Crisp, practical]
- **Visual Intent**: 4 interactive comparison cards showing Preorder, Inorder, Postorder, and Level-Order with formula rules, color coding, and real-world DSA application badges.
- **Narration**:
याद रखने का आसान नियम: ट्री कॉपी करना हो तो प्री-ऑर्डर, सॉर्टेड लिस्ट चाहिए तो इन-ऑर्डर, डिलीट या हिसाब लगाना हो तो पोस्ट-ऑर्डर, और नज़दीकी नोड ढूँढना हो तो लेवल-ऑर्डर!

## Scene 8
- **Type**: outro
- **Tag**: 08 / MASTER THE FUNDAMENTALS
- **Title**: THE HEART OF COMPILERS & INDEXES
- **Tone**: [Inspiring, call-to-action]
- **Visual Intent**: Outro payoff card with floating algorithmic icons, neon glowing subscribe badges, and next topic recommendations.
- **Narration**:
डेटाबेस इंडेक्सिंग से लेकर सर्च इंजनों तक—ट्री ट्रावर्सल हर जगह है! अगर कोडिंग का यह कॉन्सेप्ट आज साफ़ हुआ, तो लाइक करें और अगले डी-एस-ए टॉपिक के लिए सब्सक्राइब ज़रूर करें!
