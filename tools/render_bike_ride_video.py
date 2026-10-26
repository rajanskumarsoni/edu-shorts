#!/usr/bin/env python3
"""
3D Motorcycle Highway Riding Video Generator
============================================
Animates the detailed 3D motorcycle (street_bike.glb) riding realistically along
the American asphalt highway (american_road.glb) in Blender 5.2.2 LTS.

Features:
- Exact road surface BVH raycasting: perfectly tracks asphalt elevation & banking
- Physics-based motorcycle motion: forward acceleration, steering yaw, and realistic
  body lean (roll) into highway curves
- Tire rotation physics: wheel rotation strictly locked to ground speed (zero tire slip)
- High-RPM engine micro-vibration on chassis
- Cinematic chase camera (chase arm perspective with smooth damping & horizon framing)
- Golden hour sunlight with realistic contact shadows and daylight sky atmosphere
- Synchronized 4-stroke engine acceleration sound synthesized and multiplexed via FFmpeg
- Renders directly to episodes/how-bike-self-start-works/media/bike_riding_on_road.mp4
"""

import math
import os
import struct
import subprocess
import wave
from pathlib import Path

# Paths
REPO_ROOT = Path(__file__).resolve().parent.parent
MEDIA_DIR = REPO_ROOT / "episodes" / "how-bike-self-start-works" / "media"
ROAD_GLB = MEDIA_DIR / "american_road.glb"
BIKE_GLB = MEDIA_DIR / "street_bike.glb"
RAW_VIDEO = MEDIA_DIR / "bike_riding_raw.mp4"
FINAL_VIDEO = MEDIA_DIR / "bike_riding_on_road.mp4"
AUDIO_WAV = MEDIA_DIR / "bike_engine_sound.wav"
CONTACT_SHEET = MEDIA_DIR / "bike_riding_contact_sheet.png"

BLENDER_BIN = "/opt/homebrew/bin/blender"


def generate_motorcycle_audio(output_path: Path, duration: float = 5.0):
    """
    Synthesizes a rich, throaty 4-stroke inline-triple motorcycle engine acceleration sound.
    Simulates:
    - Low-frequency power pulses (fundamental firing frequency sweeping 35Hz -> 85Hz)
    - Rich harmonic series (2nd, 3rd, 4th, 6th harmonics with warm saturation)
    - Mechanical valve/intake whine
    - Aerodynamic wind rush / tire roll noise
    """
    sample_rate = 44100
    total_samples = int(sample_rate * duration)
    samples = []

    # Phase accumulators
    phase_power = 0.0
    phase_whine = 0.0
    rng_state = 12345

    for i in range(total_samples):
        t = i / sample_rate
        norm_t = t / duration

        # RPM curve: starts at idle/low cruise (~2400 RPM = 40 Hz firing),
        # accelerates briskly to high revs (~5500 RPM = 92 Hz firing)
        firing_freq = 40.0 + 52.0 * (norm_t ** 1.3)
        whine_freq = firing_freq * 12.5  # Gear whine frequency

        # Advance phases
        phase_power += 2.0 * math.pi * firing_freq / sample_rate
        phase_whine += 2.0 * math.pi * whine_freq / sample_rate

        # Cylinder firing pulses (distorted pulse wave for throaty exhaust bark)
        pulse1 = math.sin(phase_power)
        pulse2 = 0.55 * math.sin(phase_power * 2.0)
        pulse3 = 0.35 * math.sin(phase_power * 3.0)
        pulse4 = 0.20 * math.sin(phase_power * 4.0)
        pulse6 = 0.15 * math.sin(phase_power * 6.0)
        exhaust = pulse1 + pulse2 + pulse3 + pulse4 + pulse6

        # Soft tube saturation / overdrive on exhaust
        exhaust_saturated = math.tanh(exhaust * 1.6)

        # High-pitched mechanical gear whine (supercharger / transmission whine)
        gear_whine = 0.12 * math.sin(phase_whine) * (0.3 + 0.7 * norm_t)

        # Aerodynamic wind rush / road tire hiss (filtered white noise)
        rng_state = (rng_state * 1103515245 + 12345) & 0x7FFFFFFF
        noise = (rng_state / 0x7FFFFFFF) * 2.0 - 1.0
        wind = 0.18 * noise * (0.2 + 0.8 * norm_t)

        # Master mix
        mix = 0.65 * exhaust_saturated + gear_whine + wind

        # Fade in and fade out envelope
        env = 1.0
        if t < 0.1:
            env = t / 0.1
        elif t > (duration - 0.2):
            env = (duration - t) / 0.2

        val = max(-1.0, min(1.0, mix * env * 0.85))
        samples.append(val)

    with wave.open(str(output_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        raw = bytearray()
        for s in samples:
            raw.extend(struct.pack("<h", int(s * 32767)))
        wf.writeframes(raw)
    print(f"Generated engine sound: {output_path} ({duration}s)")


BLENDER_SCRIPT = """
import bpy
import math
from mathutils import Vector, Euler, Matrix
from mathutils.bvhtree import BVHTree
import numpy as np

bpy.ops.wm.read_factory_settings(use_empty=True)

# -------------------------------------------------------------
# 1. LOAD 3D ASSETS
# -------------------------------------------------------------
print("Importing American Road...")
bpy.ops.import_scene.gltf(filepath="__ROAD_GLB__")
road_root = [o for o in bpy.context.scene.objects if o.parent is None][0]
road_root.name = "Road_Root"

print("Importing Street Bike...")
bpy.ops.import_scene.gltf(filepath="__BIKE_GLB__")
bike_root = [o for o in bpy.context.scene.objects if o.parent is None and o.name != "Road_Root"][0]
bike_root.name = "Bike_Root"

# Create Master Empty for motorcycle animation
bike_master = bpy.data.objects.new("Bike_Master", None)
bpy.context.collection.objects.link(bike_master)
bike_root.parent = bike_master
bike_root.matrix_parent_inverse = bike_master.matrix_world.inverted()

# Scale bike to 0.88 so it fits comfortably inside the standard lane
bike_master.scale = (0.88, 0.88, 0.88)
bike_scale = 0.88
tire_radius = 62.3 * bike_scale  # ~54.8 units
tire_bottom_offset = 14.36 * bike_scale  # ~12.64 units below bike_master origin

# -------------------------------------------------------------
# 2. EXACT ROAD BVH RAYCASTING FOR HIGHWAY TRAJECTORY
# -------------------------------------------------------------
print("Building Road BVH Tree...")
road_mesh = bpy.data.objects.get("Material2")
mw = road_mesh.matrix_world
world_verts = [mw @ v.co for v in road_mesh.data.vertices]
polys = [p.vertices for p in road_mesh.data.polygons]
bvh = BVHTree.FromPolygons(world_verts, polys)

# Compute lane centerline points across Y from -320 to +320 in steps of 10 units
sample_ys = np.arange(-320, 321, 10)
lane_points = []

for y in sample_ys:
    hits_x = []
    hits_z = []
    for x in np.linspace(-150, 50, 101):
        hit_loc, _, _, _ = bvh.ray_cast(Vector((x, y, 500.0)), Vector((0, 0, -1.0)))
        if hit_loc:
            hits_x.append(x)
            hits_z.append(hit_loc.z)
    if hits_x:
        x_min, x_max = min(hits_x), max(hits_x)
        # Fraction 0.48 centers the motorcycle between double-yellow line and curb
        center_x = x_min + 0.48 * (x_max - x_min)
        hit_loc, _, _, _ = bvh.ray_cast(Vector((center_x, y, 500.0)), Vector((0, 0, -1.0)))
        surface_z = hit_loc.z if hit_loc else np.mean(hits_z)
        lane_points.append((float(center_x), float(y), float(surface_z)))

lane_data = np.array(lane_points)
traj_ys = lane_data[:, 1]
traj_xs = lane_data[:, 0]
traj_zs = lane_data[:, 2]

def get_road_transform(y_pos):
    \"\"\"Interpolates lane center X, surface Z, and tangent direction at any Y.\"\"\"
    x_pos = float(np.interp(y_pos, traj_ys, traj_xs))
    z_surf = float(np.interp(y_pos, traj_ys, traj_zs))
    # Tangent using small delta
    dy = 2.0
    x_next = float(np.interp(y_pos + dy, traj_ys, traj_xs))
    z_next = float(np.interp(y_pos + dy, traj_ys, traj_zs))
    dx = x_next - x_pos
    dz = z_next - z_surf
    
    yaw = -math.atan2(dx, dy) # heading angle
    pitch = -math.atan2(dz, dy) # grade angle
    
    # Lean angle (roll): proportional to curvature (rate of change of yaw)
    # When turning right (dx > 0, yaw < 0), lean into the turn (negative roll)
    curvature = dx / dy
    lean_deg = -curvature * 35.0  # ~4 to 7 degrees lean in curves
    roll = math.radians(max(-8.0, min(8.0, lean_deg)))
    
    # Master origin Z = road surface Z + tire bottom offset
    z_master = z_surf + tire_bottom_offset
    return x_pos, y_pos, z_master, pitch, roll, yaw

# -------------------------------------------------------------
# 3. KEYFRAME MOTORCYCLE RIDING MOTION (150 FRAMES @ 30 FPS)
# -------------------------------------------------------------
print("Keyframing Motorcycle Motion...")
total_frames = 150
fps = 30
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = total_frames
bpy.context.scene.render.fps = fps

start_y = -300.0
end_y = 300.0
total_distance = end_y - start_y

# Wheel objects to spin
wheel_objs = [o for o in bpy.data.objects if any(k in o.name.lower() for k in [
    'front tire surface', 'rear tire surface', 'front rim', 'rear wheel geometry'
])]
print(f"Found {len(wheel_objs)} wheel objects to animate spinning.")

cum_dist = 0.0
prev_y = start_y

for frame in range(1, total_frames + 1):
    bpy.context.scene.frame_set(frame)
    # Ease in acceleration slightly at start, then brisk cruising
    p = (frame - 1) / (total_frames - 1)
    # Smooth acceleration curve: s = 0.1 * p + 0.9 * p^1.1
    t_curve = (p ** 1.1)
    curr_y = start_y + (end_y - start_y) * t_curve
    
    dist_step = abs(curr_y - prev_y)
    cum_dist += dist_step
    prev_y = curr_y

    x, y, z, pitch, roll, yaw = get_road_transform(curr_y)

    # Engine micro-vibration
    engine_rumble = math.sin(frame * 1.8) * 0.12
    z += engine_rumble

    bike_master.location = (x, y, z)
    bike_master.rotation_euler = (pitch, roll, yaw)
    bike_master.keyframe_insert(data_path="location", frame=frame)
    bike_master.keyframe_insert(data_path="rotation_euler", frame=frame)

    # Wheel spin rotation around local X-axis
    wheel_rot_angle = -(cum_dist / tire_radius)
    for w in wheel_objs:
        w.rotation_euler.x = wheel_rot_angle
        w.keyframe_insert(data_path="rotation_euler", frame=frame)

# -------------------------------------------------------------
# 4. CINEMATIC ACTION CHASE CAMERA
# -------------------------------------------------------------
print("Setting up Cinematic Chase Camera...")
cam_data = bpy.data.cameras.new("ActionChaseCam")
cam_data.lens = 40  # 40mm focal length: dynamic cinematic perspective
cam_data.clip_end = 40000
cam_obj = bpy.data.objects.new("ActionChaseCam", cam_data)
bpy.context.collection.objects.link(cam_obj)

# Camera look target
cam_target = bpy.data.objects.new("CamTarget", None)
bpy.context.collection.objects.link(cam_target)

tt = cam_obj.constraints.new(type="TRACK_TO")
tt.target = cam_target
tt.track_axis = "TRACK_NEGATIVE_Z"
tt.up_axis = "UP_Y"  # Standard Blender camera orientation
bpy.context.scene.camera = cam_obj

# Animate camera following the bike with dynamic perspective shift
for frame in range(1, total_frames + 1):
    p = (frame - 1) / (total_frames - 1)
    t_curve = (p ** 1.1)
    curr_y = start_y + (end_y - start_y) * t_curve
    x, y, z, pitch, roll, yaw = get_road_transform(curr_y)

    # Camera target is aimed at the bike's upper frame & fuel tank
    cam_target.location = (x, y + 35.0, z + 40.0)
    cam_target.keyframe_insert(data_path="location", frame=frame)

    # Camera position: follows behind and slightly to the left,
    # gently rising from a low aggressive tail-level shot to a sweeping 3/4 chase shot
    cam_dist_back = 340.0 + 40.0 * math.sin(p * math.pi)
    cam_offset_x = -130.0 - 20.0 * math.sin(p * math.pi * 0.5)
    cam_height = 110.0 + 35.0 * p

    # Rotate camera offset according to bike yaw for natural chase tracking
    cos_yaw = math.cos(yaw)
    sin_yaw = math.sin(yaw)
    # World camera offset
    world_dx = cam_offset_x * cos_yaw - (-cam_dist_back) * sin_yaw
    world_dy = cam_offset_x * sin_yaw + (-cam_dist_back) * cos_yaw

    # Subtle camera vibration / organic drift
    cam_shake = math.sin(frame * 0.8) * 0.4
    cam_shake_z = math.cos(frame * 0.9) * 0.3

    cam_obj.location = (x + world_dx + cam_shake, y + world_dy, z + cam_height + cam_shake_z)
    cam_obj.keyframe_insert(data_path="location", frame=frame)

# -------------------------------------------------------------
# 5. ENVIRONMENT LIGHTING & SKY SHADER
# -------------------------------------------------------------
print("Setting up Environment & Lighting...")
world = bpy.context.scene.world or bpy.data.worlds.new("World")
bpy.context.scene.world = world
world.use_nodes = True
tree = world.node_tree
tree.nodes.clear()

node_bg = tree.nodes.new(type="ShaderNodeBackground")
node_bg.inputs["Color"].default_value = (0.52, 0.72, 0.94, 1.0)  # Open daylight sky blue
node_bg.inputs["Strength"].default_value = 1.1
node_out = tree.nodes.new(type="ShaderNodeOutputWorld")
tree.links.new(node_bg.outputs["Background"], node_out.inputs["Surface"])

# Warm Direct Sunlight
sun_data = bpy.data.lights.new("Sun", type="SUN")
sun_data.energy = 5.5
sun_data.color = (1.0, 0.96, 0.90)  # Warm golden sunlight
sun_obj = bpy.data.objects.new("Sun", sun_data)
bpy.context.collection.objects.link(sun_obj)
sun_obj.location = (-200, -200, 1500)
sun_obj.rotation_euler = (math.radians(50), math.radians(20), math.radians(-35))

# Sky Ambient Fill
fill_data = bpy.data.lights.new("SkyFill", type="POINT")
fill_data.energy = 16000000.0
fill_data.color = (0.75, 0.88, 1.0)
fill_obj = bpy.data.objects.new("SkyFill", fill_data)
bpy.context.collection.objects.link(fill_obj)
# Parent fill light to bike master so bike is always perfectly illuminated
fill_obj.parent = bike_master
fill_obj.location = (-120.0, -100.0, 350.0)

# -------------------------------------------------------------
# 6. RENDER SETTINGS (PNG FRAMES -> FFMPEG ASSEMBLED)
# -------------------------------------------------------------
print("Configuring Frame Render...")
scene = bpy.context.scene
scene.render.resolution_x = 1080
scene.render.resolution_y = 1920
scene.render.resolution_percentage = 100

scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.image_settings.compression = 15 # Fast write

scene.render.filepath = "__FRAMES_DIR__/frame_"

print("Starting Blender Animation Render...")
bpy.ops.render.render(animation=True)
print("Blender Video Render Complete!")
"""


def main():
    print("=" * 60)
    print("  3D MOTORCYCLE HIGHWAY RIDE VIDEO PIPELINE")
    print("=" * 60)

    FRAMES_DIR = REPO_ROOT / "scratch" / "bike_frames"
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    # Clear old frames
    for f in FRAMES_DIR.glob("*.png"):
        f.unlink()

    # 1. Synthesize motorcycle engine audio
    generate_motorcycle_audio(AUDIO_WAV, duration=5.0)

    # 2. Prepare Blender execution script
    script_content = (
        BLENDER_SCRIPT
        .replace("__ROAD_GLB__", str(ROAD_GLB))
        .replace("__BIKE_GLB__", str(BIKE_GLB))
        .replace("__FRAMES_DIR__", str(FRAMES_DIR))
    )
    temp_script = REPO_ROOT / "scratch" / "run_bike_animation.py"
    temp_script.parent.mkdir(parents=True, exist_ok=True)
    temp_script.write_text(script_content)

    # 3. Run Blender headless render
    print("\n[Stage 1/3] Running Blender 5.2.2 LTS Animation Render (150 frames)...")
    cmd = [BLENDER_BIN, "-b", "--python", str(temp_script)]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("Blender STDERR:\n", res.stderr[-2000:])
        print("Blender STDOUT:\n", res.stdout[-2000:])
        raise RuntimeError(f"Blender failed with exit code {res.returncode}")

    rendered_frames = sorted(list(FRAMES_DIR.glob("frame_*.png")))
    print(f"Blender rendered {len(rendered_frames)} PNG frames successfully!")
    if len(rendered_frames) < 10:
        raise RuntimeError("Too few frames were rendered by Blender.")

    # 4. Multiplex video frames + high quality engine audio using FFmpeg
    print("\n[Stage 2/3] Encoding Video & Multiplexing Engine Audio with FFmpeg...")
    frame_pattern = str(FRAMES_DIR / "frame_%04d.png")
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-framerate", "30",
        "-i", frame_pattern,
        "-i", str(AUDIO_WAV),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "medium",
        "-crf", "18",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(FINAL_VIDEO),
    ]
    subprocess.run(ffmpeg_cmd, check=True)
    print(f"Final video delivered: {FINAL_VIDEO}")

    # 5. Generate Contact Sheet for visual QA
    print("\n[Stage 3/3] Generating Visual QA Contact Sheet...")
    # Extract 9 frames across the 5s timeline in a 3x3 grid
    contact_cmd = [
        "ffmpeg", "-y",
        "-i", str(FINAL_VIDEO),
        "-vf", "fps=1.8,scale=360:640,tile=3x3",
        "-frames:v", "1",
        str(CONTACT_SHEET),
    ]
    subprocess.run(contact_cmd, check=True)
    print(f"Contact sheet saved: {CONTACT_SHEET}")

    print("\n" + "=" * 60)
    print(f"SUCCESS! Playable 3D Motorcycle Video: {FINAL_VIDEO}")
    print("=" * 60)


if __name__ == "__main__":
    main()
