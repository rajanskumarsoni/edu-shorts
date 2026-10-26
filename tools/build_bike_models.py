#!/usr/bin/env python3
"""
Procedural 3D Mechanical Model Generator for Bike Self-Start System.
Generates 3 high-detail CAD models using Blender 5.x headless:
1. motorcycle_engine.glb - Single-cylinder motorcycle engine with piston, connecting rod, and crankshaft
2. starter_gears.glb - Starter motor pinion and planetary gear reduction train
3. sprag_clutch.glb - One-way sprag overrunning clutch with inner race, outer race, and rollers
"""

import sys
import math
from pathlib import Path

try:
    import bpy
    import bmesh
except ImportError:
    print("This script must be run inside Blender: blender -b --python tools/build_bike_models.py")
    sys.exit(1)

OUTPUT_DIR = Path("/Users/rajankumarsoni/Desktop/projects/edu-shorts/episodes/how-bike-self-start-works/media")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def clean_scene():
    """Removes all default objects from the scene."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for collection in bpy.data.collections:
        bpy.data.collections.remove(collection)


def create_pbr_material(name, color=(0.8, 0.8, 0.8, 1.0), metallic=0.9, roughness=0.25, emissive=(0, 0, 0, 1.0), emissive_strength=0.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        # Blender 4/5 Principled BSDF socket names
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = color
        if "Metallic" in bsdf.inputs:
            bsdf.inputs["Metallic"].default_value = metallic
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = roughness
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emissive
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emissive_strength
    return mat


# =============================================================================
# MODEL 1: MOTORCYCLE ENGINE CUTAWAY
# =============================================================================
def build_motorcycle_engine():
    clean_scene()
    print("🔨 Generating Motorcycle Engine Cutaway...")

    mat_aluminum = create_pbr_material("CastAluminum", color=(0.75, 0.77, 0.80, 1.0), metallic=0.85, roughness=0.35)
    mat_steel = create_pbr_material("MachinedSteel", color=(0.55, 0.58, 0.62, 1.0), metallic=0.95, roughness=0.18)
    mat_dark_iron = create_pbr_material("DarkIron", color=(0.18, 0.20, 0.24, 1.0), metallic=0.88, roughness=0.45)
    mat_copper = create_pbr_material("CopperAccent", color=(0.95, 0.45, 0.15, 1.0), metallic=0.9, roughness=0.2)
    mat_cyan_glow = create_pbr_material("CyanGlow", color=(0.0, 0.94, 1.0, 1.0), metallic=0.2, roughness=0.1, emissive=(0.0, 0.94, 1.0, 1.0), emissive_strength=4.0)

    # 1. Crankcase Base Block
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, -0.6))
    crankcase = bpy.context.active_object
    crankcase.name = "Crankcase"
    crankcase.scale = (1.8, 1.5, 1.2)
    crankcase.data.materials.append(mat_dark_iron)

    # 2. Crankshaft Flywheel Discs (inside crankcase)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=0.15, location=(-0.25, 0, -0.6), rotation=(math.radians(90), 0, 0))
    flywheel1 = bpy.context.active_object
    flywheel1.name = "Flywheel_L"
    flywheel1.data.materials.append(mat_steel)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=0.15, location=(0.25, 0, -0.6), rotation=(math.radians(90), 0, 0))
    flywheel2 = bpy.context.active_object
    flywheel2.name = "Flywheel_R"
    flywheel2.data.materials.append(mat_steel)

    # 3. Crank Pin connecting the two flywheels
    bpy.ops.mesh.primitive_cylinder_add(radius=0.10, depth=0.4, location=(0, 0.28, -0.45), rotation=(math.radians(90), 0, 0))
    crankpin = bpy.context.active_object
    crankpin.name = "CrankPin"
    crankpin.data.materials.append(mat_steel)

    # 4. Connecting Rod
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0.14, 0.2), rotation=(0, math.radians(-6), 0))
    conrod = bpy.context.active_object
    conrod.name = "ConnectingRod"
    conrod.scale = (0.16, 0.12, 1.1)
    conrod.data.materials.append(mat_steel)

    # 5. Piston Assembly
    bpy.ops.mesh.primitive_cylinder_add(radius=0.58, depth=0.7, location=(0, 0, 0.95))
    piston = bpy.context.active_object
    piston.name = "Piston"
    piston.data.materials.append(mat_aluminum)

    # Piston compression ring slots (rings)
    for i in range(3):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.585, minor_radius=0.015, location=(0, 0, 1.15 - i * 0.08))
        ring = bpy.context.active_object
        ring.name = f"PistonRing_{i}"
        ring.data.materials.append(mat_steel)

    # 6. Cylinder Barrel (with cooling fins)
    # Main cylinder sleeve
    bpy.ops.mesh.primitive_cylinder_add(radius=0.75, depth=1.6, location=(0, 0, 1.0))
    barrel = bpy.context.active_object
    barrel.name = "CylinderBarrel"
    barrel.data.materials.append(mat_dark_iron)

    # Cooling fins around cylinder
    for i in range(7):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.98 - i * 0.02, depth=0.04, location=(0, 0, 0.4 + i * 0.18))
        fin = bpy.context.active_object
        fin.name = f"CoolingFin_{i}"
        fin.data.materials.append(mat_aluminum)

    # 7. Cylinder Head & Spark Plug at top
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 1.95))
    head = bpy.context.active_object
    head.name = "CylinderHead"
    head.scale = (1.7, 1.6, 0.4)
    head.data.materials.append(mat_aluminum)

    # Spark Plug (threaded hex body + ceramic insulator + terminal tip)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.45, location=(0, 0, 2.3))
    sparkplug = bpy.context.active_object
    sparkplug.name = "SparkPlug"
    sparkplug.data.materials.append(mat_copper)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.25, location=(0, 0, 2.6))
    plugtip = bpy.context.active_object
    plugtip.name = "SparkTip"
    plugtip.data.materials.append(mat_cyan_glow)

    out_file = OUTPUT_DIR / "motorcycle_engine.glb"
    bpy.ops.export_scene.gltf(filepath=str(out_file), export_format='GLB')
    print(f"✅ Exported: {out_file} ({out_file.stat().st_size / 1024:.1f} KB)")


# =============================================================================
# MODEL 2: STARTER MOTOR & PLANETARY REDUCTION GEARS
# =============================================================================
def build_starter_gears():
    clean_scene()
    print("🔨 Generating Starter Motor & Reduction Gears...")

    mat_brass = create_pbr_material("BrassGear", color=(0.88, 0.72, 0.28, 1.0), metallic=0.92, roughness=0.22)
    mat_steel = create_pbr_material("ToughSteel", color=(0.48, 0.52, 0.58, 1.0), metallic=0.95, roughness=0.2)
    mat_motor_case = create_pbr_material("MotorCasing", color=(0.12, 0.16, 0.22, 1.0), metallic=0.85, roughness=0.35)
    mat_copper_coil = create_pbr_material("CopperWindings", color=(0.92, 0.42, 0.12, 1.0), metallic=0.88, roughness=0.25)
    mat_cyan_ring = create_pbr_material("CyanHighlight", color=(0.0, 0.94, 1.0, 1.0), metallic=0.5, roughness=0.1, emissive=(0.0, 0.94, 1.0, 1.0), emissive_strength=3.0)

    # 1. DC Starter Motor Cylindrical Body
    bpy.ops.mesh.primitive_cylinder_add(radius=0.65, depth=1.8, location=(-1.8, 0, 0), rotation=(0, math.radians(90), 0))
    motor = bpy.context.active_object
    motor.name = "StarterMotor"
    motor.data.materials.append(mat_motor_case)

    # Motor Mounting Flange
    bpy.ops.mesh.primitive_cylinder_add(radius=0.85, depth=0.12, location=(-0.85, 0, 0), rotation=(0, math.radians(90), 0))
    flange = bpy.context.active_object
    flange.name = "MotorFlange"
    flange.data.materials.append(mat_steel)

    # Motor Armature Drive Shaft
    bpy.ops.mesh.primitive_cylinder_add(radius=0.14, depth=0.8, location=(-0.45, 0, 0), rotation=(0, math.radians(90), 0))
    shaft = bpy.context.active_object
    shaft.name = "MotorShaft"
    shaft.data.materials.append(mat_steel)

    # 2. Central Sun Pinion Gear (Small 10-tooth gear, 6000 RPM)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.32, depth=0.28, location=(0, 0, 0), rotation=(0, math.radians(90), 0))
    sun_gear = bpy.context.active_object
    sun_gear.name = "SunPinionGear"
    sun_gear.data.materials.append(mat_brass)

    # Sun gear teeth
    for i in range(10):
        angle = (i * 36) * math.pi / 180
        y = math.sin(angle) * 0.32
        z = math.cos(angle) * 0.32
        bpy.ops.mesh.primitive_cube_add(size=0.1, location=(0, y, z), rotation=(angle, 0, 0))
        tooth = bpy.context.active_object
        tooth.scale = (2.8, 0.4, 0.6)
        tooth.data.materials.append(mat_brass)

    # 3. Three Planetary Gears surrounding the sun gear
    planet_radius = 0.42
    orbit_distance = 0.78
    for p_idx in range(3):
        p_angle = (p_idx * 120 + 30) * math.pi / 180
        py = math.sin(p_angle) * orbit_distance
        pz = math.cos(p_angle) * orbit_distance

        bpy.ops.mesh.primitive_cylinder_add(radius=planet_radius, depth=0.24, location=(0, py, pz), rotation=(0, math.radians(90), 0))
        planet = bpy.context.active_object
        planet.name = f"PlanetGear_{p_idx}"
        planet.data.materials.append(mat_steel)

        # Teeth on planet gear
        for t_idx in range(12):
            t_angle = (t_idx * 30) * math.pi / 180
            ty = py + math.sin(t_angle) * planet_radius
            tz = pz + math.cos(t_angle) * planet_radius
            bpy.ops.mesh.primitive_cube_add(size=0.08, location=(0, ty, tz), rotation=(t_angle, 0, 0))
            ptooth = bpy.context.active_object
            ptooth.scale = (2.4, 0.4, 0.5)
            ptooth.data.materials.append(mat_steel)

    # 4. Large Outer Ring Gear (Flywheel ring gear with 12:1 reduction)
    bpy.ops.mesh.primitive_cylinder_add(radius=1.45, depth=0.3, location=(0, 0, 0), rotation=(0, math.radians(90), 0))
    ring_outer = bpy.context.active_object
    ring_outer.name = "OuterRingGear"
    ring_outer.data.materials.append(mat_motor_case)

    # Inner cutout ring highlight
    bpy.ops.mesh.primitive_torus_add(major_radius=1.35, minor_radius=0.04, location=(0.16, 0, 0), rotation=(0, math.radians(90), 0))
    highlight = bpy.context.active_object
    highlight.name = "RingHighlight"
    highlight.data.materials.append(mat_cyan_ring)

    out_file = OUTPUT_DIR / "starter_gears.glb"
    bpy.ops.export_scene.gltf(filepath=str(out_file), export_format='GLB')
    print(f"✅ Exported: {out_file} ({out_file.stat().st_size / 1024:.1f} KB)")


# =============================================================================
# MODEL 3: ONE-WAY SPRAG OVERRUNNING CLUTCH
# =============================================================================
def build_sprag_clutch():
    clean_scene()
    print("🔨 Generating One-Way Sprag Clutch...")

    mat_chrome = create_pbr_material("PolishedChrome", color=(0.92, 0.94, 0.98, 1.0), metallic=0.98, roughness=0.1)
    mat_hardened = create_pbr_material("HardenedSteel", color=(0.42, 0.45, 0.50, 1.0), metallic=0.92, roughness=0.22)
    mat_bronze_cage = create_pbr_material("BronzeCage", color=(0.82, 0.58, 0.30, 1.0), metallic=0.85, roughness=0.32)
    mat_gold_roller = create_pbr_material("GoldSpragRoller", color=(1.0, 0.82, 0.25, 1.0), metallic=0.95, roughness=0.15)
    mat_green_accent = create_pbr_material("GreenFreewheel", color=(0.1, 0.9, 0.4, 1.0), metallic=0.3, roughness=0.1, emissive=(0.1, 0.9, 0.4, 1.0), emissive_strength=3.0)

    # 1. Inner Race (Fixed to Crankshaft)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=0.45, location=(0, 0, 0), rotation=(0, math.radians(90), 0))
    inner_race = bpy.context.active_object
    inner_race.name = "InnerRace_Crankshaft"
    inner_race.data.materials.append(mat_chrome)

    # Central crankshaft hole
    bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.55, location=(0, 0, 0), rotation=(0, math.radians(90), 0))
    center_hole = bpy.context.active_object
    center_hole.name = "CrankshaftHole"
    center_hole.data.materials.append(mat_hardened)

    # Keyway notch on inner race
    bpy.ops.mesh.primitive_cube_add(size=0.12, location=(0, 0, 0.32))
    keyway = bpy.context.active_object
    keyway.name = "DriveKeyway"
    keyway.scale = (3.5, 0.6, 0.8)
    keyway.data.materials.append(mat_hardened)

    # 2. Outer Race (Driven by Starter Idler Gear)
    bpy.ops.mesh.primitive_cylinder_add(radius=1.25, depth=0.4, location=(0, 0, 0), rotation=(0, math.radians(90), 0))
    outer_race = bpy.context.active_object
    outer_race.name = "OuterRace_DriveGear"
    outer_race.data.materials.append(mat_hardened)

    # Outer gear teeth around the perimeter
    for i in range(24):
        angle = (i * 15) * math.pi / 180
        y = math.sin(angle) * 1.25
        z = math.cos(angle) * 1.25
        bpy.ops.mesh.primitive_cube_add(size=0.08, location=(0, y, z), rotation=(angle, 0, 0))
        gtooth = bpy.context.active_object
        gtooth.scale = (4.0, 0.5, 0.6)
        gtooth.data.materials.append(mat_hardened)

    # 3. Sprag Retainer Cage (Bronze ring separating rollers)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.85, minor_radius=0.03, location=(0.18, 0, 0), rotation=(0, math.radians(90), 0))
    cage_f = bpy.context.active_object
    cage_f.name = "SpragCage_Front"
    cage_f.data.materials.append(mat_bronze_cage)

    bpy.ops.mesh.primitive_torus_add(major_radius=0.85, minor_radius=0.03, location=(-0.18, 0, 0), rotation=(0, math.radians(90), 0))
    cage_b = bpy.context.active_object
    cage_b.name = "SpragCage_Back"
    cage_b.data.materials.append(mat_bronze_cage)

    # 4. 12 Peanut/Cam-Shaped Sprag Rollers
    sprag_pitch_radius = 0.85
    for i in range(12):
        angle = (i * 30) * math.pi / 180
        sy = math.sin(angle) * sprag_pitch_radius
        sz = math.cos(angle) * sprag_pitch_radius

        # Peanut/ellipsoid shape: scaled sphere
        bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.34, location=(0, sy, sz), rotation=(math.radians(15) + angle, 0, math.radians(90)))
        roller = bpy.context.active_object
        roller.name = f"SpragRoller_{i}"
        roller.scale = (1.25, 0.85, 1.0)
        roller.data.materials.append(mat_gold_roller)

    # Glowing indicator ring (green freewheel confirmation)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.58, minor_radius=0.02, location=(0.21, 0, 0), rotation=(0, math.radians(90), 0))
    ring_glow = bpy.context.active_object
    ring_glow.name = "FreewheelGlow"
    ring_glow.data.materials.append(mat_green_accent)

    out_file = OUTPUT_DIR / "sprag_clutch.glb"
    bpy.ops.export_scene.gltf(filepath=str(out_file), export_format='GLB')
    print(f"✅ Exported: {out_file} ({out_file.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    build_motorcycle_engine()
    build_starter_gears()
    build_sprag_clutch()
    print("🎉 All 3D Mechanical Assets Successfully Generated!")
