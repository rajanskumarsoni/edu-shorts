# Stage 2.5 Prompt: Creating New Visual & 3D Components

You are an expert in the visual tools already supported by this repository. Before adding a component or library, inspect the current scene registry, types, schema, dependencies, and nearby implementations. Prefer native Remotion, SVG, or Canvas when they explain the concept; use Three.js or another library only when it is available and materially improves comprehension.
When a new video topic requires a visual presentation not covered by existing primitives (whether a 3D WebGL scene in `src/scenes/ThreeScene.tsx`, a bespoke Remotion React component, an interactive Canvas shader, or an SVG motion graph), use this guide to build and register high-fidelity components under the Visual Fitness Principle.

---

## 1. Visual Fitness: Choosing the Right Medium for Custom Components
- **Use the existing Three.js integration** when spatial depth, physical scale, or a 3D model materially improves comprehension. Do not assume React Three Fiber, Drei, or another package is installed; verify the manifest and existing components before using it.
- **Use Native Remotion / React (HTML5 + SVG)** when crisp typography, animated vector curves, responsive dark glassmorphism, or data layouts are required (e.g. neural network graphs, bento telemetry, racing benchmarks, terminal consoles).
- **Use HTML5 Canvas 2D / Custom GLSL Shaders** when thousands of particles, dynamic wavefields, or complex pixel shaders are needed.

---

## 2. Technical Standards for 3D Components

1. **Rendering & Canvas**:
   - Render in a dedicated Three.js canvas wrapped in Remotion `useCurrentFrame()` and `useVideoConfig()`.
   - Antialias: true, alpha: true, pixelRatio: `Math.min(2, window.devicePixelRatio || 1)`.
   - Background canvas: `#0B1020` with exponential fog (`THREE.FogExp2(0x0b1020, 0.04)`).
2. **Resource Lifecycle & Memory Safety (Critical)**:
   - Always store Three.js objects with explicit types (avoid `as any`).
   - In the `useEffect` cleanup return function, traverse all groups/meshes and explicitly dispose:
     ```typescript
     return () => {
       threeScene.traverse((obj) => {
         if (obj instanceof THREE.Mesh) {
           obj.geometry?.dispose();
           if (Array.isArray(obj.material)) {
             obj.material.forEach(m => m.dispose());
           } else if (obj.material) {
             obj.material.dispose();
           }
         }
       });
       renderer.dispose();
     };
     ```
3. **Design Tokens & Themes**:
   - Import color tokens from `src/theme.ts` (`theme.colors.bg`, `theme.colors.accent`, `theme.colors.gold`).
   - Do not scatter arbitrary hardcoded magic hex values across geometry shaders.
4. **Cinematic Camera Choreography**:
   - Smooth interpolation driven by `frame` and `durationInFrames`:
     - Slow dolly-in or isometric orbit.
     - Subtle Dutch tilt or dramatic pitch angle.
5. **Registration**:
   - Register the new component in `src/scenes/ThreeScene.tsx`.
   - Add the variant name to `REGISTERED_3D_VARIANTS` in `validate.py` and `schema/storyboard.schema.json`.
6. **Strict Real-Object Visualization Policy — No Placeholder Geometry (Section 10)**:
   - **Core Rule**: Every real-world object must be represented by a recognizable, detailed representation of that actual object. **Do not represent real objects using generic boxes, cubes, cylinders, spheres, wireframe shapes, or bare text labels.**
   - **Real-Object Implementation Choices (Use Whatever Best Suits the Medium)**:
     1. **Transparent PNGs & Vector Icons**: In 2D/2.5D Remotion or Canvas scenes, always use high-res transparent PNGs, SVGs, or vector icons (via `tools/asset_finder.py icon "<query>"`, Lucide, or transparent media assets).
     2. **Exact Procedural Construction (HTML/CSS/JS/Canvas)**: If creating objects programmatically in React or HTML/CSS, build the **exact, detailed real object** with authentic structural parts:
        * *Smartphone*: Rounded chassis (`border-radius: 40px`), metallic bezel, camera notch/punch-hole, glossy glass reflection, screen content, and power buttons.
        * *Laptop*: Display lid, screen bezel, keyboard layout, and trackpad.
        * *Server / Datacenter*: Multi-slot chassis, drive bays, ventilation grilles, and blinking LED status indicators.
        * *ATM / POS Terminal*: Keypad, display screen, cash dispenser slot, card reader, and illuminated receipt slot.
        * *Never use a generic rectangular `div` with a label like "LAPTOP" or "PHONE".*
     3. **Real 3D CAD Models (`.glb` / `.gltf`)**: Use `model_3d` with realistic `.glb` models (fetch via `tools/model_manager.py`).
     4. **Blender & Three.js Kinematics**: Use Blender converted assets or detailed procedural meshes when photorealism or physics are required.
   - **Labels Do Not Compensate for Missing Detail**: Never use a box labeled "LAPTOP" as a laptop or a cube labeled "PHONE" as a smartphone.
   - **Real Objects Remain Visible**: Abstract elements (data packets, radio waves, signal strength, protocol flows) must visually layer around real objects rather than substituting for them.
   - **Mandatory Quality Gate**: Prioritize recognizable real-world objects first, technical animation second, and decorative effects third. Never sacrifice object realism to make the scene easier to code.
7. **Testing & Workspace Cleanliness (Zero Overlapping Assets)**:
   - When validating, inspecting, or capturing preview frames of new components, always write scratch renders or test stills strictly to `scratch/` or use `bash tools/preview.sh`.
   - **NEVER create or output to a root `out/` folder.** Episode renders go to `episodes/<id>/final.mp4`.
   - **Asset Placement**: Store all episode models and media in `episodes/<id>/media/`. Keep `public/` strictly for global shared assets (`public/sfx/`, `public/music/`, `public/models/`) and ephemeral build staging.

