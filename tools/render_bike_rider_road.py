#!/usr/bin/env python3
"""
render_bike_rider_road.py
--------------------------
Blender headless pipeline: man on motorcycle riding on American road.
Uses 'motorcycle_with_rider.glb' (man + bike combined) + 'american_road.glb'.
Output: episodes/how-bike-self-start-works/media/bike_with_rider_road.mp4
"""

import bpy
import math
import os
import subprocess
import mathutils
from mathutils import Vector, Euler

ROOT       = "/Users/rajankumarsoni/Desktop/projects/edu-shorts"
RIDER_GLB  = f"{ROOT}/episodes/how-bike-self-start-works/media/motorcycle_with_rider.glb"
ROAD_GLB   = f"{ROOT}/episodes/how-bike-self-start-works/media/american_road.glb"
AUDIO_WAV  = f"{ROOT}/episodes/how-bike-self-start-works/media/bike_engine_sound.wav"
FRAMES_DIR = f"{ROOT}/scratch/rider_frames"
FINAL_MP4  = f"{ROOT}/episodes/how-bike-self-start-works/media/bike_with_rider_road.mp4"

os.makedirs(FRAMES_DIR, exist_ok=True)

FPS          = 30
DURATION_S   = 10
TOTAL_FRAMES = FPS * DURATION_S
ROAD_LENGTH  = 80.0
START_Z      = 0.55


def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()


def set_render_settings():
    scene = bpy.context.scene
    scene.render.engine                     = 'CYCLES'
    scene.cycles.device                     = 'CPU'
    scene.cycles.samples                    = 32
    scene.cycles.use_denoising              = True
    scene.render.resolution_x               = 1080
    scene.render.resolution_y               = 1920
    scene.render.resolution_percentage      = 100
    scene.render.fps                        = FPS
    scene.frame_start                       = 1
    scene.frame_end                         = TOTAL_FRAMES
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath                   = f"{FRAMES_DIR}/frame_"


def import_glb(filepath, name):
    before   = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=filepath)
    new_objs = [o for o in bpy.data.objects if o not in before]
    roots    = [o for o in new_objs if o.parent is None or o.parent not in new_objs]
    root     = (roots or new_objs)[0]
    root.name = name
    return root, new_objs


def get_bbox(obj_list):
    pts = []
    for obj in obj_list:
        if obj.type == 'MESH':
            for v in obj.data.vertices:
                pts.append(obj.matrix_world @ v.co)
    if not pts:
        return Vector((0,0,0)), Vector((0,0,0))
    xs,ys,zs = [p.x for p in pts],[p.y for p in pts],[p.z for p in pts]
    return Vector((min(xs),min(ys),min(zs))), Vector((max(xs),max(ys),max(zs)))


def setup_lighting():
    sun = bpy.data.lights.new("Sun", 'SUN')
    sun.energy = 4.0
    sun.color  = (1.0, 0.85, 0.6)
    so = bpy.data.objects.new("Sun", sun)
    bpy.context.scene.collection.objects.link(so)
    so.rotation_euler = Euler((math.radians(35), 0, math.radians(-45)))

    fill = bpy.data.lights.new("Fill", 'SUN')
    fill.energy = 1.2
    fill.color  = (0.5, 0.7, 1.0)
    fo = bpy.data.objects.new("Fill", fill)
    bpy.context.scene.collection.objects.link(fo)
    fo.rotation_euler = Euler((math.radians(80), 0, math.radians(135)))

    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    if bg:
        bg.inputs['Color'].default_value   = (0.53, 0.71, 0.88, 1.0)
        bg.inputs['Strength'].default_value = 0.8


def animate_bike(master):
    for frame in range(1, TOTAL_FRAMES + 1):
        t    = (frame - 1) / max(TOTAL_FRAMES - 1, 1)
        y    = -ROAD_LENGTH/2 + t * ROAD_LENGTH
        x    = 0.15 * math.sin(t * math.pi * 4)
        z    = START_Z + 0.008 * math.sin(frame * 1.8)
        dxdt = 0.15 * math.pi * 4 * math.cos(t * math.pi * 4) / max(TOTAL_FRAMES - 1, 1)
        bank = math.radians(-dxdt * 3.5)

        master.location       = (x, y, z)
        master.rotation_euler = Euler((0.0, bank, 0.0))
        master.keyframe_insert("location",       frame=frame)
        master.keyframe_insert("rotation_euler", frame=frame)

    try:
        action = master.animation_data.action if master.animation_data else None
        fc_list = list(action.fcurves) if action and hasattr(action, 'fcurves') else []
        for fc in fc_list:
            for kp in fc.keyframe_points:
                kp.interpolation     = 'BEZIER'
                kp.handle_left_type  = 'AUTO'
                kp.handle_right_type = 'AUTO'
    except Exception as e:
        print(f"  (fcurve smooth skipped: {e})")


def setup_camera(master):
    cd  = bpy.data.cameras.new("Chase")
    cd.lens = 40.0
    co  = bpy.data.objects.new("Chase", cd)
    bpy.context.scene.collection.objects.link(co)
    bpy.context.scene.camera = co

    for frame in range(1, TOTAL_FRAMES + 1):
        t   = (frame - 1) / max(TOTAL_FRAMES - 1, 1)
        by  = -ROAD_LENGTH/2 + t * ROAD_LENGTH
        sway = 0.15 * math.sin(t * math.pi * 6) * 0.5

        co.location = (sway + 0.3, by - 3.5, 2.0)
        tgt = Vector((sway * 0.2, by + 4.0, 1.0))
        d   = tgt - Vector(co.location)
        co.rotation_euler = d.to_track_quat('-Z','Y').to_euler()
        co.keyframe_insert("location",       frame=frame)
        co.keyframe_insert("rotation_euler", frame=frame)


def main():
    print("\n" + "="*55)
    print("BIKE RIDER ON ROAD — Blender Render")
    print("="*55)

    clear_scene()
    set_render_settings()

    # Road
    print("[1] Road...")
    road_root, road_objs = import_glb(ROAD_GLB, "Road")
    rmin, rmax = get_bbox(road_objs)
    rsize = rmax - rmin
    if rsize.y > 0:
        sc = ROAD_LENGTH / rsize.y
        road_root.scale = (sc, sc, sc)
    road_root.location = (0, 0, 0)

    # Rider + bike
    print("[2] Motorcycle with rider...")
    rider_root, rider_objs = import_glb(RIDER_GLB, "RiderCombo")
    rimin, rimax = get_bbox(rider_objs)
    risize = rimax - rimin
    target = 2.2
    dim = max(risize.x, risize.y, 0.01)
    sf  = target / dim
    rider_root.scale = (sf, sf, sf)

    # Master empty
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, -ROAD_LENGTH/2, START_Z))
    master = bpy.context.active_object
    master.name = "Bike_Master"

    rider_root.parent        = master
    rider_root.location      = (0, 0, 0)
    rider_root.rotation_euler = Euler((math.pi/2, 0, math.pi/2))

    # Lighting
    print("[3] Lighting...")
    setup_lighting()

    # Animate
    print("[4] Animating...")
    animate_bike(master)

    # Camera
    print("[5] Camera...")
    setup_camera(master)

    # Render
    print(f"[6] Rendering {TOTAL_FRAMES} frames → {FRAMES_DIR}/")
    bpy.ops.render.render(animation=True, write_still=True)

    # FFmpeg
    print(f"[7] Encoding → {FINAL_MP4}")
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", f"{FRAMES_DIR}/frame_%04d.png",
        "-i", AUDIO_WAV,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        FINAL_MP4
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode == 0:
        sz = os.path.getsize(FINAL_MP4)/1024/1024
        print(f"  Done: {FINAL_MP4} ({sz:.1f} MB)")
    else:
        print("  FFmpeg stderr:", r.stderr[-400:])

    print("\nRender pipeline complete!")


main()
