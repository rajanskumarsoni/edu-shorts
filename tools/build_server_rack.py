import bpy
import math
import os
from pathlib import Path

# Clear all existing scene objects
bpy.ops.wm.read_factory_settings(use_empty=True)

# Helper to create PBR material
def make_mat(name, base_color, metallic=0.8, roughness=0.3, emission_color=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = base_color
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if emission_color:
            bsdf.inputs["Emission Color"].default_value = emission_color
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat

# Materials
mat_frame = make_mat("Rack_Frame", (0.04, 0.05, 0.07, 1.0), metallic=0.9, roughness=0.25)
mat_blade = make_mat("Blade_Face", (0.08, 0.11, 0.16, 1.0), metallic=0.85, roughness=0.35)
mat_chrome = make_mat("Chrome_Handle", (0.9, 0.92, 0.95, 1.0), metallic=0.98, roughness=0.1)
mat_port = make_mat("RJ45_Port", (0.02, 0.02, 0.03, 1.0), metallic=0.5, roughness=0.5)

# LED Materials (Emissive)
mat_led_green = make_mat("LED_Green", (0.0, 1.0, 0.4, 1.0), metallic=0.0, roughness=0.1, emission_color=(0.0, 1.0, 0.4, 1.0), emission_strength=6.0)
mat_led_cyan = make_mat("LED_Cyan", (0.0, 0.9, 1.0, 1.0), metallic=0.0, roughness=0.1, emission_color=(0.0, 0.9, 1.0, 1.0), emission_strength=8.0)
mat_led_amber = make_mat("LED_Amber", (1.0, 0.65, 0.0, 1.0), metallic=0.0, roughness=0.1, emission_color=(1.0, 0.65, 0.0, 1.0), emission_strength=5.0)

rack_w = 0.70  # Width (X)
rack_d = 0.85  # Depth (Y in Blender)
rack_h = 2.00  # Height (Z in Blender)
post_size = 0.04

# 1. Four Steel Vertical Corner Posts
posts = [
    (-rack_w/2 + post_size/2, -rack_d/2 + post_size/2),
    ( rack_w/2 - post_size/2, -rack_d/2 + post_size/2),
    (-rack_w/2 + post_size/2,  rack_d/2 - post_size/2),
    ( rack_w/2 - post_size/2,  rack_d/2 - post_size/2),
]

for idx, (px, py) in enumerate(posts):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(px, py, rack_h / 2))
    post = bpy.context.active_object
    post.name = f"RackPost_{idx+1}"
    post.scale = (post_size, post_size, rack_h)
    post.data.materials.append(mat_frame)

# 2. Top and Bottom Frames
for z_pos, name in [(0.02, "Rack_Bottom_Cap"), (rack_h - 0.02, "Rack_Top_Cap")]:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, z_pos))
    cap = bpy.context.active_object
    cap.name = name
    cap.scale = (rack_w, rack_d, 0.04)
    cap.data.materials.append(mat_frame)

# 3. Side & Back Perforated Ventilation Panels (Open Front at -Y)
# Left Side Panel
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-rack_w/2 + 0.005, 0, rack_h/2))
side_l = bpy.context.active_object
side_l.name = "Rack_Side_L"
side_l.scale = (0.01, rack_d - 0.06, rack_h - 0.08)
side_l.data.materials.append(mat_frame)

# Right Side Panel
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(rack_w/2 - 0.005, 0, rack_h/2))
side_r = bpy.context.active_object
side_r.name = "Rack_Side_R"
side_r.scale = (0.01, rack_d - 0.06, rack_h - 0.08)
side_r.data.materials.append(mat_frame)

# Back Panel (at +Y)
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, rack_d/2 - 0.005, rack_h/2))
back = bpy.context.active_object
back.name = "Rack_Back"
back.scale = (rack_w - 0.06, 0.01, rack_h - 0.08)
back.data.materials.append(mat_frame)

# 4. Top-of-Rack Network Core Switch (1U Unit at top)
switch_z = rack_h - 0.12
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, switch_z))
sw = bpy.context.active_object
sw.name = "Switch_Core_1U"
sw.scale = (rack_w - 0.08, rack_d - 0.1, 0.06)
sw.data.materials.append(mat_blade)

# Switch Fiber Activity LEDs (facing -Y)
front_y = -rack_d/2 + 0.04
for li in range(12):
    lx = -0.22 + li * 0.04
    bpy.ops.mesh.primitive_cylinder_add(radius=0.006, depth=0.01, location=(lx, front_y - 0.002, switch_z))
    led = bpy.context.active_object
    led.rotation_euler = (math.pi / 2, 0, 0)
    led.data.materials.append(mat_led_cyan if li % 2 == 0 else mat_led_green)

# 5. Stacking 9 High-Performance Server Blades (2U Units)
blade_count = 9
blade_height = 0.14
blade_spacing = 0.18
start_z = 0.15

for b in range(blade_count):
    bz = start_z + b * blade_spacing
    
    # Blade Chassis Box
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.05, bz))
    blade = bpy.context.active_object
    blade.name = f"Blade_{b+1}"
    blade.scale = (rack_w - 0.09, rack_d - 0.14, blade_height)
    blade.data.materials.append(mat_blade)

    # Front Face Plate Details (facing -Y)
    # Chrome Ejector Handles (Left and Right)
    for hx in [-0.27, 0.27]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.006, depth=0.08, location=(hx, front_y, bz))
        handle = bpy.context.active_object
        handle.name = f"Handle_{b+1}_{'L' if hx < 0 else 'R'}"
        handle.rotation_euler = (0, 0, 0)
        handle.data.materials.append(mat_chrome)

    # Hard Drive Bays (4 bays in center)
    for bay in range(4):
        bay_x = -0.15 + bay * 0.075
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(bay_x, front_y + 0.002, bz))
        caddy = bpy.context.active_object
        caddy.scale = (0.065, 0.01, blade_height * 0.7)
        caddy.data.materials.append(mat_port)

        # Drive Activity LED above each bay
        bpy.ops.mesh.primitive_cylinder_add(radius=0.004, depth=0.008, location=(bay_x, front_y - 0.004, bz + 0.035))
        d_led = bpy.context.active_object
        d_led.rotation_euler = (math.pi / 2, 0, 0)
        d_led.data.materials.append(mat_led_cyan if (b + bay) % 3 != 0 else mat_led_amber)

    # Power & Network Status Indicator LEDs
    bpy.ops.mesh.primitive_cylinder_add(radius=0.005, depth=0.01, location=(-0.21, front_y - 0.004, bz + 0.03))
    p_led = bpy.context.active_object
    p_led.rotation_euler = (math.pi / 2, 0, 0)
    p_led.data.materials.append(mat_led_green)

# Join all into cohesive structure or export directly
output_path = Path("/Users/rajankumarsoni/Desktop/projects/edu-shorts/episodes/how-fastag-works/media/server_rack.glb")
bpy.ops.export_scene.gltf(
    filepath=str(output_path),
    export_format='GLB',
    use_selection=False,
    export_apply=True,
    export_yup=True
)

print(f"Exported detailed server rack to {output_path} ({os.path.getsize(output_path)} bytes)")
