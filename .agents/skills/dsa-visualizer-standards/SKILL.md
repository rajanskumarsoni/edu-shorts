---
name: dsa-visualizer-standards
description: >
  Editorial design standards, 4-tier vertical information architecture, SVG filter glow recipes,
  and deterministic telemetry models for Computer Science and Data Structure/Algorithm explainer videos.
  Use when: building or updating algorithmic visualizers (Binary Trees, Graphs, Sorting, BFS/DFS, Linked Lists, Call Stacks, Dynamic Programming).
---

# DSA Visualizer Standards & High-Retention Explainer Architecture

Synthesized from top-tier motion graphics pipelines (including `video-production-master`) and production verification standards in `edu-shorts`.

---

## 1. The 4-Tier Vertical Information Architecture

Every algorithm visualizer in vertical format (1080x1920) MUST eliminate empty screen space and ambiguity by budgeting the canvas into four simultaneous, synchronized tiers:

```
┌────────────────────────────────────────────────────────┐
│ TIER 1: HEADER & ALGORITHM IDENTITY (Height ~180px)    │
│  - Step tag: "02 / 06" | Topic Pill: "DFS TRAVERSAL"   │
│  - Algorithmic Formula: "LEFT → ROOT → RIGHT"          │
├────────────────────────────────────────────────────────┤
│ TIER 2: HERO SVG CANVAS (Height ~720px - 850px)        │
│  - Fixed viewBox (e.g. 960x720) with exact coordinates │
│  - Substantial node geometry (radii: 45-50px)          │
│  - High-contrast edge paths (stroke-width: 5-6px)      │
│  - Animated glowing laser pointer on active traversal  │
│  - SVG <feDropShadow> filters for crisp neon bloom     │
├────────────────────────────────────────────────────────┤
│ TIER 3: DUAL TELEMETRY ROW (Side-by-Side Cards)        │
│  ┌─────────────────────────┐ ┌───────────────────────┐ │
│  │ DATA STATE (LIFO / FIFO)│ │ MENTAL MODEL / RULE   │ │
│  │ Call Stack / Queue / Heap│ │ 🎯 Key intuition or   │ │
│  │ Real-time push & pop    │ │ algorithmic invariant │ │
│  └─────────────────────────┘ └───────────────────────┘ │
├────────────────────────────────────────────────────────┤
│ TIER 4: OUTPUT SLOTS & EXECUTING CODE (Height ~250px)  │
│  - Pre-allocated dashed slot boxes [ 4 ] [ 2 ] [ ] [ ] │
│  - Progress telemetry: "3 / 7 Nodes Visited"           │
│  - Monospace code line currently executing             │
└────────────────────────────────────────────────────────┘
```

---

## 2. Strict Signature Color System

Never use generic, unbranded RGB values. Assign an uncompromising brand accent to each algorithmic paradigm:

| Algorithm / Paradigm | Primary Hex | Accent Glow | Role / Meaning |
| :--- | :--- | :--- | :--- |
| **Preorder Traversal** | `#8B5CF6` (Vivid Purple) | `#C4B5FD` | Root-first visitation |
| **Inorder Traversal** | `#06B6D4` (Electric Cyan) | `#67E8F9` | Sorted order exploration (BST) |
| **Postorder Traversal** | `#F43F5E` (Neon Rose) | `#FDA4AF` | Bottom-up deletion / aggregation |
| **Level-Order (BFS)** | `#10B981` (Emerald) | `#6EE7B7` | Breadth exploration via FIFO Queue |
| **Active Scan / Pointer** | `#F59E0B` (Intense Amber)| `#FDE68A` | Real-time focus, current line/node |
| **Canvas Background** | `#070B14` (Deep Space Navy)| — | Provides maximum contrast for neon glows |

---

## 3. SVG Filter Glows vs CSS Box-Shadow

### The Problem with CSS Box-Shadow
Remotion and Chromium can produce blurry, rasterized halos or clip bounding boxes when applying CSS `box-shadow` or `filter: drop-shadow()` to complex vector elements.

### The Standard: Native SVG `<filter>` with `<feDropShadow>`
Define reusable SVG filters inside the `<defs>` tag of the SVG canvas. They render sub-pixel crispness directly in FFmpeg video exports:

```xml
<defs>
  <!-- Active Node Amber Glow -->
  <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
    <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#F59E0B" flood-opacity="0.9" />
    <feDropShadow dx="0" dy="0" stdDeviation="22" flood-color="#F59E0B" flood-opacity="0.4" />
  </filter>

  <!-- Cyan Visited Node Glow -->
  <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
    <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#06B6D4" flood-opacity="0.8" />
  </filter>

  <!-- Rose Danger / Deletion Glow -->
  <filter id="glow-rose" x="-50%" y="-50%" width="200%" height="200%">
    <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#F43F5E" flood-opacity="0.9" />
  </filter>
</defs>
```

When a node or edge enters an active state, dynamically apply:
`filter={isActive ? "url(#glow-amber)" : isVisited ? "url(#glow-cyan)" : undefined}`.

---

## 4. Multi-Faceted Visual Synchronization

When an algorithm takes a step, **all 4 tiers must react simultaneously**:
1. **Tier 2 (Hero Canvas)**:
   - The laser pointer smoothly moves to the target node coordinate.
   - The node transitions to `glow-amber`, pulsing slightly (1.08x scale).
2. **Tier 3 (Telemetry Row)**:
   - The Call Stack card visibly slides in a new frame (e.g. `inorder(4)`).
   - If popping, the top item dissolves/fades upward.
3. **Tier 4 (Output Slots)**:
   - The next pre-allocated dashed box `[   ]` fills with a bold number with an elastic pop scale.
   - The visited count increments monotonically (`3 / 7`).
   - The executing code highlight jumps to the matching recursive line.

---

## 5. Pre-Allocated Output Slots Pattern

Never append numbers to an unbounded scrolling list. Always render a fixed set of container boxes:
- **Total slots**: Equal to total elements/nodes (e.g., 7 for a 7-node tree).
- **Unvisited state**: Subtle dashed border (`border: 2px dashed rgba(255,255,255,0.15)`), dark background.
- **Visited state**: Solid neon border matching algorithm color, glowing text, solid dark backdrop (`background: rgba(6, 182, 212, 0.1)`).
- **Scale Entrance**: `spring()` or eased scale from 0.4 to 1.0 with a quick overshoot.

---

## 6. Real-Time Call Stack & Queue Implementation

### For DFS (Inorder, Preorder, Postorder):
Display a **Call Stack (LIFO)**:
- Bottom-aligned container.
- Items stacked vertically with a pill labeled `TOP / CURRENT`.
- When diving left: Push `node.left`.
- When processing root: Highlight stack top.
- When backtracking: Pop top element with upward fade.

### For BFS (Level-Order):
Display a **Queue (FIFO)**:
- Horizontal container with `IN ➔` on the right and `➔ OUT` on the left.
- Nodes enqueue at the right with a slide-in transition.
- Current node de-queues from the left into the output sequence.

---

## 7. Concept-to-Technique Matrix (Tailored by Domain)

Never force a tree layout onto unrelated algorithms. Select and combine specialized visual techniques and repo skills depending on the exact computational or physical mechanism:

| Domain / Concept | Recommended Visual Technique | Primary UI & Telemetry Elements | Supporting Repo Skills / Engines |
| :--- | :--- | :--- | :--- |
| **Trees & Hierarchies** (BST, AVL, Tries, Heaps) | 4-Tier Tree Visualizer | Big SVG Stage + LIFO Call Stack / FIFO Queue + 7-slot output containers | `dsa-visualizer-standards`, `remotion-markup` |
| **Graph Algorithms** (Dijkstra, A*, BFS, DFS, MST) | Weighted Network Canvas | Node adjacency relaxation + Min-Heap priority queue + Shortest-path distance table | `dsa-visualizer-standards`, `diagram` |
| **Sorting Algorithms** (QuickSort, MergeSort, HeapSort) | Partition Bar Canvas & Swap Arcs | Low/High/Pivot pointer brackets + recursion tree split/merge + comparison counter | `whiteboard`, `dsa-visualizer-standards` |
| **Dynamic Programming** (Knapsack, LCS, Edit Distance) | 2D Memoization Matrix | Cell recurrence calculation (`dp[i][j]`) + dependency arrows + optimal path backtracking | `bento`, `dsa-visualizer-standards` |
| **Pointers & Lists** (Fast/Slow Pointers, Linked Lists) | Linear Node-Chain with Link Rewiring | Memory address badges (`0x7F...`) + Tortoise & Hare pointers + cycle detection spotlight | `dsa-visualizer-standards`, `architecture` |
| **Deep Learning & Neural Networks** | Synaptic Multi-Layer Network | Glowing forward activations + backpropagation error gradients + loss curve gauge | `neural_network_graph`, `threejs-shaders`, `gradient_descent` |
| **Mathematical Derivations & Calculus** | Kinetic Formula Transformations | Symbol-by-symbol LaTeX transformations + vector fields + geometric tangents | `manimce-best-practices`, `manim-composer` |
| **Distributed Systems & Protocols** (Raft, Paxos, TCP) | Multi-Actor Sequence Timeline | Time-vertical message handshakes + consensus leader elections + network partition split | `diagram` (Mermaid), `architecture` |
| **Memory & Concurrency** (GC, Thread Pools, Mutexes) | Memory Heap Allocator / Lane Blocks | Marked vs Sweep memory chunks + lock ownership badge + thread worker queues | `architecture`, `bento` |
| **Hardware & Micro-Architecture** (CPU Pipelines, Caches) | Architectural Bus & Silicon Cutout | L1/L2/L3 cache hit/miss gauge + pipeline instruction stages (Fetch, Decode, Execute) | `product`, `model_3d` (Blender/CAD), `gauge` |
| **Tactile & Intuitive Analogies** | Chalkboard / Napkin Sketch | Organic rotring ink / chalk strokes + hatched fills + watercolor highlighting | `whiteboard`, `bs-chalkboard-infographic` |

---

## 8. Rule of Thumb for Future Video Generation

1. **Classify Concept**: Determine whether the topic is **Graph/Tree**, **Linear/Array**, **Matrix/Grid**, **Network/Protocol**, **Physical/Hardware**, or **Pure Math**.
2. **Match Engine & Layout**: Pick the matching engine from the matrix above; do not default to standard slides.
3. **Ground Every Spoken Variable**: Every noun and number spoken in the Hindi narration MUST have an on-screen visual anchor (pointer, token, metric card, or highlighted slot).

