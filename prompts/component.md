# Stage 2.5 Prompt: Creating New 3D WebGL / Remotion Visual Components

You are an expert Three.js and Remotion graphics engineer.
When a new video topic requires a physical visual metaphor not covered by existing variants in `src/scenes/ThreeScene.tsx`, use this guide to build and register a new high-fidelity component.

---

## Technical Standards for 3D Components

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

