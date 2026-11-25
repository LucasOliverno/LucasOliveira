# MANDATO — sprites 2.5D (isométricos) para o jogo, gerados no Blender por script.
#   blender.exe --background --factory-startup --python MANDATO/3d/build_sprites.py [-- ID1 ID2 ...]
# Saída: frontend/public/mandato/iso/<ID>.webp (edifícios) e g-<tipo>.webp (chão de cada casa).
#
# Todos os sprites usam o MESMO enquadramento: imagem 320×480, câmera ortográfica (60°/45°) mirando a origem.
#   - 1 casa = 2 m; o losango da casa ocupa 70,71% da largura do sprite (ISO_DIAMOND).
#   - o centro da casa fica em x = 50% e y = ANCHOR_Y da altura (impresso no fim; usado no CSS do jogo).
# Eixos: +X do mundo = descer para a direita na tela; −Y = descer para a esquerda. Fachadas visíveis: −Y e +X.
import math
import os
import sys

import bpy
import mathutils
from bpy_extras.object_utils import world_to_camera_view

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "sprites_baseline")
os.makedirs(OUT, exist_ok=True)
ONLY = [a for a in (sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []) if not a.startswith("--")]
SEG = 2  # segmentos do chanfro (1 no GLB, para ficar leve)

RES_X, RES_Y, ORTHO, SHIFT_Y = 320, 480, 6.0, 0.3
PAL = {
    "navy": "#1B2A41", "cream": "#F3EBDD", "teal": "#1F6F78", "mustard": "#E0A526", "brick": "#C4533A",
    "sage": "#8DAA7E", "plum": "#6B3F69", "white": "#FBF7EE", "sand": "#E9D4A3", "grass": "#A7C47F",
    "grass2": "#97B970", "earth": "#8A5A3C", "earth2": "#6E4630", "sea": "#3E8FB0", "sea2": "#7CC3D6",
    "glass": "#2E4A63", "glassl": "#6FA7C4", "smoke": "#E3DED6", "tree": "#4F8A4E", "tree2": "#3E7448",
    "trunk": "#7A5236", "roof": "#B8483A", "stone": "#CFC6B6", "rock": "#9A8F80", "gold": "#E6B422",
    "steel": "#8E9AA6", "dark": "#3A4250", "blue": "#5E9CC4", "dune": "#E2B877", "desert": "#EBCB92",
    "copper": "#C07A45", "road": "#5B6270", "red": "#D9483B", "pink": "#E07A6B", "lime": "#B9D46A",
    "wood": "#A9784F", "glow": "#9FE3E0", "panel": "#27415E", "forest": "#5C8F55", "palm": "#5FA052",
}


def hex_rgba(h):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb], 1.0)


_mats = {}


def mat(key, rough=0.65, emit=0.0):
    name = f"M_{key}_{rough}_{emit}"
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = hex_rgba(PAL[key])
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = hex_rgba(PAL[key])
        b.inputs["Emission Strength"].default_value = emit
    _mats[name] = m
    return m


def _fin(o, key, bevel=0.03, rough=0.65, emit=0.0, rot=None):
    o.data.materials.clear()
    o.data.materials.append(mat(key, rough, emit))
    if rot:
        o.rotation_euler = rot
    if bevel:
        b = o.modifiers.new("Bevel", "BEVEL")
        b.width, b.segments, b.limit_method = bevel, SEG, "ANGLE"
    return o


def box(sx, sy, sz, x, y, z, key, bevel=0.03, rough=0.65, emit=0.0, rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z + sz / 2))
    o = bpy.context.active_object
    o.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True)
    return _fin(o, key, bevel, rough, emit, rot)


def cyl(r, h, x, y, z, key, verts=14, bevel=0.015, r2=None, emit=0.0, rough=0.65):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=(x, y, z + h / 2))
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=(x, y, z + h / 2))
    return _fin(bpy.context.active_object, key, bevel, rough, emit)


def hcyl(r, length, x, y, z, key, axis="x", verts=12):
    """Cilindro deitado, centrado em (x, y, z)."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=length, location=(x, y, z))
    o = bpy.context.active_object
    o.rotation_euler = (0, math.pi / 2, 0) if axis == "x" else (math.pi / 2, 0, 0)
    return _fin(o, key, 0.01)


def cone(r, h, x, y, z, key, verts=4, rot=math.pi / 4, r2=0.0):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=(x, y, z + h / 2), rotation=(0, 0, rot))
    return _fin(bpy.context.active_object, key, 0.015)


def ball(r, x, y, z, key, sub=1, sx=1, sy=1, sz=1, emit=0.0, rough=0.9):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=(x, y, z))
    o = bpy.context.active_object
    o.scale = (sx, sy, sz)
    return _fin(o, key, 0, rough, emit)


def dome(r, x, y, z, key, emit=0.0, rough=0.4):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=10, radius=r, location=(x, y, z))
    o = bpy.context.active_object
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for v in o.data.vertices:
        v.select = v.co.z < -1e-4
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    return _fin(o, key, 0, rough, emit)


def torus(R, r, x, y, z, key, sz=1.0):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=28, minor_segments=8, location=(x, y, z))
    o = bpy.context.active_object
    o.scale = (1, 1, sz)
    return _fin(o, key, 0)


def gable(sx, sy, h, x, y, z, key, axis="x"):
    hx, hy = sx / 2, sy / 2
    if axis == "x":
        v = [(-hx, -hy, 0), (hx, -hy, 0), (hx, hy, 0), (-hx, hy, 0), (-hx, 0, h), (hx, 0, h)]
        f = [(0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)]
    else:
        v = [(-hx, -hy, 0), (hx, -hy, 0), (hx, hy, 0), (-hx, hy, 0), (0, -hy, h), (0, hy, h)]
        f = [(1, 2, 5, 4), (3, 0, 4, 5), (0, 1, 4), (2, 3, 5), (0, 3, 2, 1)]
    me = bpy.data.meshes.new("gable")
    me.from_pydata(v, [], f)
    o = bpy.data.objects.new("roof", me)
    bpy.context.collection.objects.link(o)
    o.location = (x, y, z)
    _fin(o, key, 0.015)
    ridge_a = (x - hx, y, z + h) if axis == "x" else (x, y - hy, z + h)
    ridge_b = (x + hx, y, z + h) if axis == "x" else (x, y + hy, z + h)
    rod(ridge_a, ridge_b, 0.026, key, 8)
    length = sx if axis == "x" else sy
    for k in range(1, max(3, round(length / 0.14))):
        t = -length / 2 + length * k / max(3, round(length / 0.14))
        for side in (-1, 1):
            a = (x + t, y + side * hy, z + 0.012) if axis == "x" else (x + side * hx, y + t, z + 0.012)
            b = (x + t, y, z + h + 0.012) if axis == "x" else (x, y + t, z + h + 0.012)
            rod(a, b, 0.009, key, 5)
    return o


def window(x, y, z, w, h, key, side=False, emit=0.0):
    # Recessed glazing, cream surround and projecting sill read at tabletop scale.
    if side:
        box(0.032, w + 0.045, h + 0.045, x, y, z - 0.022, "cream", 0)
        box(0.018, w, h, x + 0.024, y, z, key, 0, 0.32, emit)
        box(0.075, w + 0.065, 0.025, x + 0.015, y, z - 0.025, "stone", 0)
        box(0.021, 0.014, h, x + 0.035, y, z, "cream", 0)
    else:
        box(w + 0.045, 0.032, h + 0.045, x, y, z - 0.022, "cream", 0)
        box(w, 0.018, h, x, y - 0.024, z, key, 0, 0.32, emit)
        box(w + 0.065, 0.075, 0.025, x, y - 0.015, z - 0.025, "stone", 0)
        box(0.014, 0.021, h, x, y - 0.035, z, "cream", 0)


def win_front(y, x0, x1, z0, rows, cols, key="glass", w=0.13, h=0.17, gap=0.32, emit=0.0):
    for r in range(rows):
        for c in range(cols):
            window(x0 + (x1 - x0) * (c + 0.5) / cols, y - 0.012, z0 + r * gap, w, h, key, emit=emit)


def win_side(x, y0, y1, z0, rows, cols, key="glass", w=0.13, h=0.17, gap=0.32, emit=0.0):
    for r in range(rows):
        for c in range(cols):
            window(x + 0.012, y0 + (y1 - y0) * (c + 0.5) / cols, z0 + r * gap, w, h, key, side=True, emit=emit)


def opposite_facades(before, x, y):
    # Rotate copied facade geometry around this building, never the entire tile.
    for o in list(set(bpy.context.scene.objects) - before):
        copy = o.copy()
        copy.data = o.data
        bpy.context.collection.objects.link(copy)
        copy.location.x = 2 * x - o.location.x
        copy.location.y = 2 * y - o.location.y
        copy.rotation_euler.z += math.pi


def block(sx, sy, h, x, y, key, z=0.0, rows=None, cols=(3, 3), roof="stone", wkey="glass", gap=0.32, emit=0.0):
    """Finished miniature with four facades for the orbiting 3D camera."""
    box(sx, sy, h, x, y, z, key)
    box(sx + 0.045, sy + 0.045, 0.075, x, y, z, "stone", 0.012)
    box(sx + 0.06, sy + 0.06, 0.055, x, y, z + h, roof, 0.012)
    for yy in (-1, 1):
        box(sx + 0.06, 0.045, 0.075, x, y + yy * sy / 2, z + h + 0.055, roof, 0.008)
    for xx in (-1, 1):
        box(0.045, sy, 0.075, x + xx * sx / 2, y, z + h + 0.055, roof, 0.008)
    n = rows if rows is not None else max(1, int((h - 0.2) / gap))
    before = set(bpy.context.scene.objects)
    win_front(y - sy / 2, x - sx / 2 + 0.08, x + sx / 2 - 0.08, z + 0.18, n, cols[0], wkey, gap=gap, emit=emit)
    win_side(x + sx / 2, y - sy / 2 + 0.08, y + sy / 2 - 0.08, z + 0.18, n, cols[1], wkey, gap=gap, emit=emit)
    opposite_facades(before, x, y)


def tree(x, y, s=1.0, z=0.0, key="tree"):
    cyl(0.05 * s, 0.24 * s, x, y, z, "trunk", 6, 0)
    ball(0.24 * s, x, y, z + 0.36 * s, key, 2)
    ball(0.17 * s, x - 0.12 * s, y + 0.06 * s, z + 0.46 * s, "forest", 2)
    ball(0.16 * s, x + 0.1 * s, y - 0.05 * s, z + 0.52 * s, "tree2")


def pine(x, y, s=1.0, z=0.0):
    cyl(0.045 * s, 0.18 * s, x, y, z, "trunk", 6, 0)
    cone(0.26 * s, 0.42 * s, x, y, z + 0.14 * s, "tree2", 7, 0)
    cone(0.19 * s, 0.34 * s, x, y, z + 0.38 * s, "forest", 7, 0)


def palm(x, y, s=1.0, z=0.0):
    t = cyl(0.04 * s, 0.6 * s, x, y, z, "trunk", 6, 0, r2=0.03 * s)
    t.rotation_euler = (0.12, 0.1, 0)
    top = (x + 0.07 * s, y - 0.06 * s, z + 0.6 * s)
    for k in range(6):
        a = k * 2 * math.pi / 6
        rod(top, (top[0] + 0.3 * s * math.cos(a), top[1] + 0.3 * s * math.sin(a), top[2] - 0.14 * s), 0.035 * s, "palm", 4)
    ball(0.05 * s, *top, "trunk")


def flag(x, y, z, h=0.45, key="mustard"):
    cyl(0.012, h, x, y, z, "navy", 6, 0)
    box(0.2, 0.015, 0.12, x + 0.1, y, z + h - 0.14, key, 0)


def bench(x, y):
    box(0.24, 0.07, 0.05, x, y, 0.07, "wood", 0)
    box(0.24, 0.02, 0.08, x, y + 0.04, 0.1, "wood", 0)


def car(x, y, key="blue", rot=0.0, z=0.0):
    box(0.26, 0.13, 0.08, x, y, z + 0.03, key, 0.02, rot=(0, 0, rot))
    box(0.14, 0.11, 0.06, x, y, z + 0.11, "glassl", 0.02, rot=(0, 0, rot))


def rod(a, b, r, key, verts=6):
    """Cilindro fino ligando dois pontos (cabos, braços)."""
    a, b = mathutils.Vector(a), mathutils.Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=d.length, location=(a + b) / 2)
    o = bpy.context.active_object
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = d.to_track_quat("Z", "Y")
    return _fin(o, key, 0)


def pad(sx, sy, key="stone", x=0.0, y=0.0, h=0.03):
    return box(sx, sy, h, x, y, 0, key, 0.01)


def water(sx, sy, x=0.0, y=0.0, z=0.0, h=0.03):
    return box(sx, sy, h, x, y, z, "sea", 0.01, rough=0.15)


def chimney(x, y, z, h, r=0.09, key="brick", smoke=True):
    cyl(r, h, x, y, z, key, 10)
    cyl(r + 0.02, 0.06, x, y, z + h - 0.06, "navy", 10)
    if smoke:
        for k, (dx, dz, rr) in enumerate(((0.0, 0.18, 0.12), (0.1, 0.38, 0.15), (0.24, 0.6, 0.18))):
            ball(rr, x + dx, y, z + h + dz, "smoke", 2)


def solar_panel(x, y, z=0.0, w=0.42, d=0.28, tilt=0.5):
    cyl(0.015, 0.14, x, y, z, "steel", 6, 0)
    box(w, d, 0.025, x, y, z + 0.15, "panel", 0.005, 0.25, rot=(tilt, 0, 0))
    box(w - 0.04, d - 0.04, 0.005, x, y - 0.002, z + 0.168, "glassl", 0, 0.2, rot=(tilt, 0, 0))


def tank(x, y, r, h, key="white"):
    cyl(r, h, x, y, 0, key, 18)
    cyl(r + 0.01, 0.03, x, y, h, "steel", 18)


def crane(x, y, h=1.6, key="mustard", rot=0.0):
    box(0.1, 0.1, h, x, y, 0, key, 0.005)
    arm = box(1.0, 0.07, 0.07, x + 0.3, y, h, key, 0.005)
    box(0.14, 0.14, 0.12, x - 0.12, y, h - 0.06, "navy", 0.01)
    box(0.01, 0.01, 0.5, x + 0.7, y, h - 0.5, "dark", 0)
    return arm


def container(x, y, z, key, rot=0.0):
    box(0.34, 0.15, 0.15, x, y, z, key, 0.01, rot=(0, 0, rot))


def boat(x, y, s=1.0, key="white", rot=0.0):
    hull = box(0.5 * s, 0.18 * s, 0.1 * s, x, y, 0.0, key, 0.04, rot=(0, 0, rot))
    box(0.18 * s, 0.12 * s, 0.1 * s, x - 0.06 * s, y, 0.1 * s, "cream", 0.02, rot=(0, 0, rot))
    return hull


def plane(x, y, z, s=1.0, rot=0.0):
    hcyl(0.06 * s, 0.8 * s, x, y, z, "white")
    bpy.context.active_object.rotation_euler = (0, math.pi / 2, rot)
    box(0.18 * s, 0.9 * s, 0.025, x, y, z, "white", 0.01, rot=(0, 0, rot))
    box(0.1 * s, 0.32 * s, 0.02, x - 0.34 * s * math.cos(rot), y - 0.34 * s * math.sin(rot), z + 0.04, "white", 0.005, rot=(0, 0, rot))
    box(0.12 * s, 0.02, 0.16 * s, x - 0.36 * s * math.cos(rot), y - 0.36 * s * math.sin(rot), z + 0.02, "teal", 0.005, rot=(0, 0, rot))


def cross(x, y, z, face="front", s=0.22, key="red"):
    if face == "front":
        box(s, 0.03, s * 0.34, x, y - 0.01, z + s * 0.33, key, 0)
        box(s * 0.34, 0.03, s, x, y - 0.01, z, key, 0)
    else:
        box(0.03, s, s * 0.34, x + 0.01, y, z + s * 0.33, key, 0)
        box(0.03, s * 0.34, s, x + 0.01, y, z, key, 0)


def house(x, y, w, d, h, wall, roof="roof", axis="y", door=True):
    box(w, d, h, x, y, 0, wall)
    gable(w + 0.1, d + 0.1, h * 0.45, x, y, h, roof, axis=axis)
    before = set(bpy.context.scene.objects)
    win_front(y - d / 2, x - w / 2 + 0.06, x + w / 2 - 0.06, 0.25, max(1, int(h / 0.4)), 2)
    win_side(x + w / 2, y - d / 2 + 0.08, y + d / 2 - 0.08, 0.25, max(1, int(h / 0.4)), 2)
    opposite_facades(before, x, y)
    box(w + 0.025, d + 0.025, 0.06, x, y, 0, "stone", 0.01)
    if door:
        box(0.14, 0.03, 0.22, x + w * 0.2, y - d / 2 - 0.005, 0, "trunk", 0)


# =============================================================== edifícios
def b_lot_res():
    house(-0.25, 0.1, 0.62, 0.62, 0.55, "sand")
    house(0.45, -0.25, 0.5, 0.5, 0.45, "sage", axis="x")
    for i in range(6):
        box(0.03, 0.03, 0.14, -0.75 + i * 0.12, -0.6, 0, "white", 0)
    box(0.72, 0.02, 0.02, -0.45, -0.6, 0.1, "white", 0)
    tree(0.55, 0.5, 0.7)


def b_lot_com():
    box(0.95, 0.75, 0.6, 0, 0.1, 0, "blue")
    box(1.0, 0.8, 0.05, 0, 0.1, 0.6, "stone", 0.01)
    box(0.6, 0.03, 0.28, -0.1, -0.27, 0.08, "glassl", 0, 0.2)
    for i in range(5):
        box(0.19, 0.3, 0.03, -0.38 + i * 0.19, -0.42, 0.42, "white" if i % 2 else "mustard", 0, rot=(math.radians(-20), 0, 0))
    box(0.5, 0.06, 0.14, 0, 0.1, 0.66, "mustard", 0.01)
    car(0.45, -0.7, "red", 0.2)


def b_lot_ind():
    box(1.1, 0.9, 0.6, 0, 0.15, 0, "steel")
    gable(1.16, 0.96, 0.25, 0, 0.15, 0.6, "dark", axis="x")
    box(0.4, 0.03, 0.4, -0.2, -0.31, 0, "mustard", 0)
    chimney(0.35, 0.3, 0.6, 0.55, 0.07, "brick")
    for i in range(3):
        box(0.22, 0.22, 0.18, -0.55 + i * 0.25, -0.62, 0, "wood", 0.01)


def b_lot_infe():
    pad(1.4, 1.2, "stone")
    for i in range(3):
        for j in range(2):
            solar_panel(-0.45 + i * 0.45, -0.25 + j * 0.45, 0.03)
    box(0.25, 0.2, 0.3, 0.55, 0.45, 0.03, "teal")


def b_lot_infw():
    for k in range(4):
        cyl(0.03, 0.9, -0.2 + (k % 2) * 0.4, -0.2 + (k // 2) * 0.4, 0, "steel", 6, 0)
    cyl(0.34, 0.5, 0, 0, 0.9, "teal", 18)
    cone(0.36, 0.18, 0, 0, 1.4, "navy", 18, 0)
    box(0.2, 0.2, 0.25, 0.5, -0.5, 0, "white")


def b_pref():
    box(1.5, 1.1, 0.12, 0, 0.1, 0, "stone")
    box(1.3, 0.9, 0.75, 0, 0.12, 0.12, "cream")
    cone(1.02, 0.42, 0, 0.12, 0.87, "roof", r2=0.15)
    for i in range(4):
        cyl(0.05, 0.6, -0.36 + i * 0.24, -0.42, 0.12, "white", 8)
    box(0.95, 0.22, 0.08, 0, -0.42, 0.72, "white")
    gable(0.95, 0.22, 0.18, 0, -0.42, 0.8, "cream", axis="x")
    box(1.0, 0.25, 0.06, 0, -0.62, 0, "stone")
    box(0.8, 0.18, 0.06, 0, -0.56, 0.06, "stone")
    box(0.34, 0.34, 0.5, 0, 0.12, 1.12, "cream")
    hcyl(0.11, 0.03, 0, -0.06, 1.44, "white", axis="y", verts=16)
    rod((0, -0.082, 1.44), (0, -0.082, 1.51), 0.009, "navy")
    rod((0, -0.083, 1.44), (0.055, -0.083, 1.41), 0.009, "navy")
    win_side(0.65, -0.2, 0.5, 0.36, 1, 3)
    cone(0.27, 0.28, 0, 0.12, 1.62, "roof")
    flag(0, 0.12, 1.86, 0.4)
    win_front(-0.33, -0.6, 0.6, 0.35, 1, 6)
    tree(-0.72, -0.55, 0.8)
    tree(0.72, -0.55, 0.8)


def b_home():
    for dx, col in ((-0.38, "sage"), (0.38, "cream")):
        box(0.72, 0.9, 0.95, dx, 0.05, 0, col)
        gable(0.8, 1.0, 0.38, dx, 0.05, 0.95, "roof", axis="y")
        win_front(-0.41, dx - 0.3, dx + 0.3, 0.25, 2, 2)
        box(0.2, 0.05, 0.32, dx + 0.18, -0.42, 0, "trunk", 0)
        box(0.34, 0.2, 0.04, dx + 0.18, -0.48, 0.38, "roof", 0)
    win_side(0.74, -0.3, 0.4, 0.25, 2, 2)
    box(1.6, 0.35, 0.04, 0, -0.66, 0, "grass2", 0)


def b_conjunto():
    for dx, dy, h, col in ((-0.42, 0.25, 1.35, "sand"), (0.42, 0.3, 1.1, "mustard"), (0.0, -0.38, 0.85, "brick")):
        block(0.7, 0.65, h, dx, dy, col)
        box(0.18, 0.14, 0.12, dx + 0.15, dy + 0.1, h + 0.05, "white")
    tree(0.75, -0.6, 0.7)


def b_mercadinho():
    box(1.2, 1.0, 0.85, 0, 0.1, 0, "cream")
    box(1.26, 1.06, 0.08, 0, 0.1, 0.85, "stone")
    box(0.9, 0.04, 0.42, 0, -0.41, 0.12, "glass", 0, 0.25)
    win_side(0.6, -0.3, 0.5, 0.35, 1, 2)
    for i in range(6):
        box(0.2, 0.42, 0.04, -0.5 + i * 0.2, -0.56, 0.68, "sea2" if i % 2 == 0 else "white", 0, rot=(math.radians(-22), 0, 0))
    for i, c in enumerate(("brick", "mustard", "sage")):
        box(0.24, 0.18, 0.14, -0.45 + i * 0.3, -0.82, 0, "trunk", 0.01)
        for k in range(3):
            ball(0.045, -0.53 + i * 0.3 + k * 0.08, -0.82, 0.18, c)


def b_oficina():
    box(1.3, 1.1, 0.8, 0, 0.1, 0, "brick")
    gable(1.4, 1.2, 0.35, 0, 0.1, 0.8, "stone", axis="x")
    box(0.6, 0.04, 0.55, -0.15, -0.46, 0, "navy", 0)
    chimney(0.42, 0.35, 0.8, 1.1, 0.12, "brick")
    for k in range(3):
        hcyl(0.04, 0.9, 0.0, -0.62 + k * 0.09, 0.05, "stone")
    win_side(0.65, -0.3, 0.45, 0.35, 1, 3)


def b_posto():
    box(1.4, 1.0, 0.7, 0, 0.15, 0, "white")
    box(1.46, 1.06, 0.06, 0, 0.15, 0.7, "teal", 0.01)
    box(0.5, 0.35, 0.05, -0.3, -0.5, 0.55, "teal", 0.01)
    for x in (-0.52, -0.08):
        cyl(0.025, 0.55, x, -0.62, 0, "white", 6)
    box(0.36, 0.03, 0.42, -0.3, -0.36, 0, "glassl", 0, 0.2)
    win_front(-0.35, 0.05, 0.65, 0.3, 1, 3)
    win_side(0.7, -0.25, 0.55, 0.3, 1, 3)
    box(0.36, 0.36, 0.04, 0.3, 0.15, 0.76, "white", 0.01)
    cross(0.3, -0.36, 0.45, s=0.2)
    car(0.55, -0.75, "white", 0)


def b_praca():
    pad(1.75, 1.75, "grass2")
    box(1.75, 0.24, 0.035, 0, 0, 0, "sand", 0)
    box(0.24, 1.75, 0.035, 0, 0, 0, "sand", 0)
    cyl(0.32, 0.12, 0, 0, 0, "stone", 20)
    cyl(0.26, 0.13, 0, 0, 0.005, "sea2", 20, 0, rough=0.1)
    cyl(0.05, 0.3, 0, 0, 0.1, "stone", 10)
    ball(0.08, 0, 0, 0.42, "sea2", 2)
    for x, y in ((-0.55, -0.55), (0.55, -0.55), (-0.55, 0.55), (0.55, 0.55)):
        tree(x, y, 1.0)
    bench(-0.35, -0.2)
    bench(0.35, 0.25)


def b_painel():
    pad(1.6, 1.5, "stone")
    for i in range(3):
        for j in range(3):
            solar_panel(-0.5 + i * 0.5, -0.45 + j * 0.42, 0.03, 0.44, 0.3)
    box(0.25, 0.18, 0.25, -0.62, 0.62, 0.03, "white")


def b_tratamento():
    pad(1.7, 1.7, "stone")
    for x, y, r in ((-0.4, 0.35, 0.36), (0.42, 0.35, 0.3), (-0.35, -0.4, 0.3)):
        cyl(r, 0.25, x, y, 0, "white", 22)
        cyl(r - 0.04, 0.255, x, y, 0.0, "sea2", 22, 0, rough=0.1)
        box(r * 2, 0.03, 0.03, x, y, 0.27, "steel", 0)
    box(0.55, 0.45, 0.5, 0.42, -0.42, 0, "teal")
    box(0.6, 0.5, 0.04, 0.42, -0.42, 0.5, "stone", 0.01)
    win_front(-0.65, 0.2, 0.65, 0.2, 1, 2)
    hcyl(0.04, 0.6, 0.0, 0.35, 0.18, "steel")


def b_feira():
    pad(1.7, 1.6, "stone")
    cols = ("red", "mustard", "blue", "sage", "pink", "teal")
    for k in range(6):
        x, y = -0.5 + (k % 3) * 0.5, -0.3 + (k // 3) * 0.6
        for dx in (-0.17, 0.17):
            for dy in (-0.14, 0.14):
                cyl(0.015, 0.4, x + dx, y + dy, 0, "wood", 5, 0)
        box(0.38, 0.32, 0.12, x, y, 0.0, "wood", 0.01)
        gable(0.44, 0.38, 0.14, x, y, 0.4, cols[k], axis="x")
        for q in range(3):
            ball(0.04, x - 0.1 + q * 0.1, y - 0.05, 0.15, cols[(k + q + 1) % 6])


def b_torre_res():
    box(1.3, 1.3, 0.25, 0, 0, 0, "stone")
    block(0.95, 0.85, 2.6, 0, 0.1, "cream", z=0.25, cols=(3, 3))
    for r in range(7):
        box(1.0, 0.12, 0.03, 0, -0.39, 0.4 + r * 0.32, "white", 0.005)
    box(0.25, 0.25, 0.25, 0.2, 0.25, 2.9, "stone")
    tree(-0.5, -0.5, 0.7)


def b_shopping():
    box(1.7, 1.4, 0.75, 0, 0.1, 0, "blue")
    box(1.74, 1.44, 0.06, 0, 0.1, 0.75, "stone", 0.01)
    box(0.7, 0.06, 0.6, 0, -0.6, 0.05, "glassl", 0, 0.2)
    dome(0.4, 0, 0.1, 0.8, "glassl", 0, 0.15)
    box(0.8, 0.08, 0.2, 0, -0.62, 0.65, "mustard", 0.01)
    win_side(0.85, -0.4, 0.6, 0.3, 1, 4)
    for i in range(3):
        car(-0.6 + i * 0.6, -0.82, ("red", "white", "mustard")[i], 0)


def b_siderurgica():
    box(1.1, 1.0, 1.0, -0.25, 0.2, 0, "steel")
    gable(1.15, 1.05, 0.35, -0.25, 0.2, 1.0, "dark", axis="x")
    chimney(0.5, 0.45, 0, 2.0, 0.12, "brick")
    chimney(0.5, -0.05, 0, 1.6, 0.1, "brick")
    cyl(0.26, 0.7, 0.35, -0.5, 0, "copper", 14, r2=0.18)
    ball(0.1, 0.35, -0.75, 0.15, "mustard", 2, emit=3)
    box(0.5, 0.03, 0.55, -0.35, -0.31, 0, "navy", 0)
    win_side(0.3, -0.2, 0.6, 0.55, 1, 3, emit=0)


def b_gas():
    for x, y in ((-0.45, 0.4), (0.25, 0.45)):
        for k in range(4):
            cyl(0.03, 0.3, x - 0.2 + (k % 2) * 0.4, y - 0.2 + (k // 2) * 0.4, 0, "steel", 6, 0)
        ball(0.36, x, y, 0.62, "white", 3, rough=0.4)
    box(0.8, 0.5, 0.55, 0.2, -0.45, 0, "teal")
    box(0.84, 0.54, 0.05, 0.2, -0.45, 0.55, "stone", 0.01)
    chimney(0.5, -0.35, 0.55, 0.9, 0.07, "steel")
    win_front(-0.7, -0.1, 0.5, 0.2, 1, 3)


def b_hospital():
    block(1.6, 0.6, 1.3, 0, 0.45, "white", cols=(5, 2))
    block(0.6, 0.9, 1.9, -0.5, -0.25, "white", cols=(2, 3))
    cross(-0.5, -0.7, 1.45, s=0.3)
    cyl(0.25, 0.03, -0.5, -0.25, 1.95, "dark", 20)
    box(0.25, 0.04, 0.005, -0.5, -0.25, 1.985, "white", 0)
    box(0.04, 0.25, 0.005, -0.5 - 0.105, -0.25, 1.985, "white", 0)
    box(0.04, 0.25, 0.005, -0.5 + 0.105, -0.25, 1.985, "white", 0)
    box(0.5, 0.3, 0.3, 0.45, -0.55, 0, "red")
    car(0.45, -0.85, "white", 0)


def b_universidade():
    box(1.7, 1.2, 0.1, 0, 0.1, 0, "stone")
    box(0.7, 0.9, 1.0, 0, 0.15, 0.1, "brick")
    for x in (-0.6, 0.6):
        box(0.5, 0.8, 0.75, x, 0.15, 0.1, "brick")
        win_front(-0.25, x - 0.2, x + 0.2, 0.3, 2, 2)
    win_side(0.85, -0.15, 0.45, 0.3, 2, 2)
    for i in range(4):
        cyl(0.04, 0.75, -0.25 + i * 0.167, -0.42, 0.1, "white", 8)
    gable(0.8, 0.3, 0.22, 0, -0.42, 0.85, "white", axis="x")
    dome(0.26, 0, 0.25, 1.1, "teal", 0, 0.4)
    cyl(0.03, 0.18, 0, 0.25, 1.33, "gold", 6, 0)
    box(0.9, 0.25, 0.05, 0, -0.68, 0, "stone")
    tree(-0.72, -0.62, 0.7)
    tree(0.75, -0.62, 0.7)


def b_parque_linear():
    pad(1.75, 1.75, "grass2")
    water(0.35, 1.75, 0.35, 0, 0.005, 0.04)
    box(1.75, 0.2, 0.04, 0, -0.3, 0, "sand", 0)
    box(0.45, 0.22, 0.06, 0.35, -0.3, 0.04, "wood", 0.01)
    for x, y, s in ((-0.55, 0.45, 1.0), (-0.2, 0.6, 0.8), (-0.6, -0.65, 0.9), (0.75, 0.55, 0.8), (0.75, -0.65, 0.8), (-0.15, -0.7, 0.7)):
        tree(x, y, s)
    bench(-0.4, 0.05)
    box(0.12, 0.3, 0.12, -0.75, 0.05, 0, "white", 0.02)


def b_metro():
    pad(1.6, 1.4, "stone")
    box(1.75, 0.5, 0.04, 0, 0.5, 0.03, "road", 0)
    for y in (0.4, 0.6):
        box(1.75, 0.03, 0.02, 0, y, 0.07, "steel", 0)
    box(0.7, 0.22, 0.2, -0.1, 0.5, 0.09, "blue", 0.04)
    box(0.6, 0.18, 0.08, -0.1, 0.5, 0.29, "white", 0.03)
    box(1.0, 0.6, 0.06, 0, -0.35, 0.65, "glassl", 0.01, 0.2)
    for x in (-0.45, 0.45):
        for y in (-0.6, -0.1):
            cyl(0.03, 0.65, x, y, 0, "steel", 6, 0)
    box(0.5, 0.3, 0.02, 0, -0.35, 0.01, "dark", 0)
    cyl(0.03, 0.8, 0.65, -0.65, 0, "navy", 6, 0)
    box(0.2, 0.04, 0.2, 0.65, -0.67, 0.75, "red", 0.02)


def b_porto():
    water(1.75, 0.8, 0, 0.45, -0.02)
    pad(1.75, 0.95, "stone", 0, -0.4, 0.06)
    crane(-0.45, -0.1, 1.5, "mustard")
    for i, c in enumerate(("red", "blue", "teal", "mustard", "brick", "sage")):
        container(0.25 + (i % 2) * 0.36, -0.7 + (i // 2) * 0.18, 0.06 + (i % 3 == 2) * 0.15, c)
    boat(0.1, 0.5, 2.0, "navy")
    for i in range(4):
        container(-0.2 + i * 0.2, 0.5, 0.2, ("red", "mustard", "blue", "teal")[i], math.pi / 2)


def b_arranha():
    box(1.5, 1.4, 0.5, 0, 0, 0, "blue")
    box(1.55, 1.45, 0.04, 0, 0, 0.5, "stone", 0.01)
    box(1.2, 0.03, 0.3, 0, -0.71, 0.08, "glassl", 0, 0.2)
    block(0.85, 0.85, 3.2, 0.05, 0.1, "glass", z=0.54, roof="steel", wkey="glassl", cols=(3, 3), gap=0.3)
    box(0.6, 0.6, 0.35, 0.05, 0.1, 3.75, "steel")
    cyl(0.02, 0.5, 0.05, 0.1, 4.1, "dark", 6, 0)
    ball(0.04, 0.05, 0.1, 4.62, "red", 1, emit=4)


def b_complexo():
    pad(1.75, 1.75, "stone")
    box(0.9, 0.8, 0.8, -0.35, 0.35, 0, "steel")
    gable(0.95, 0.85, 0.28, -0.35, 0.35, 0.8, "dark", axis="x")
    box(0.7, 0.6, 0.6, 0.45, -0.4, 0, "brick")
    for k in range(3):
        cyl(0.17, 1.0, 0.25 + k * 0.32, 0.5, 0, "white", 14)
        cone(0.18, 0.15, 0.25 + k * 0.32, 0.5, 1.0, "steel", 14, 0)
    chimney(-0.6, -0.4, 0, 2.0, 0.11, "brick")
    chimney(-0.25, -0.5, 0, 1.6, 0.09, "brick")
    hcyl(0.05, 1.0, 0.1, 0.0, 0.7, "copper")


def b_nuclear():
    pad(1.75, 1.75, "stone")
    for x, y in ((-0.35, 0.35),):
        cyl(0.62, 0.9, x, y, 0, "cream", 28, r2=0.42)
        cyl(0.42, 0.7, x, y, 0.9, "cream", 28, r2=0.5)
        cyl(0.44, 0.02, x, y, 1.6, "rock", 28)
        for k, (dx, dz, r) in enumerate(((0, 1.8, 0.35), (0.15, 2.15, 0.4), (0.35, 2.45, 0.42))):
            ball(r, x + dx, y, dz, "smoke", 2)
    cyl(0.38, 0.6, 0.45, -0.35, 0, "white", 24)
    dome(0.38, 0.45, -0.35, 0.6, "white", 0, 0.5)
    box(0.5, 0.35, 0.45, -0.35, -0.55, 0, "teal")
    ball(0.06, 0.45, -0.73, 0.4, "glow", 1, emit=4)


def b_convencoes():
    box(1.7, 1.3, 0.55, 0, 0.15, 0, "cream")
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.95, depth=1.4, location=(0, 0.15, 0.25))
    o = bpy.context.active_object
    o.rotation_euler = (math.pi / 2, 0, 0)
    o.scale = (1, 0.42, 1)
    _fin(o, "teal", 0)
    box(1.4, 0.05, 0.45, 0, -0.52, 0.05, "glassl", 0, 0.2)
    for x in (-0.7, -0.35, 0, 0.35, 0.7):
        flag(x, -0.78, 0, 0.5, ("red", "mustard", "blue", "sage", "plum")[int((x + 0.7) / 0.35)])


def b_aeroporto():
    pad(1.8, 1.8, "grass")
    box(1.8, 0.5, 0.02, 0, -0.55, 0.03, "road", 0)
    for i in range(6):
        box(0.15, 0.04, 0.005, -0.75 + i * 0.3, -0.55, 0.05, "white", 0)
    box(1.1, 0.5, 0.45, -0.25, 0.4, 0, "white")
    box(1.15, 0.55, 0.05, -0.25, 0.4, 0.45, "teal", 0.01)
    box(1.0, 0.03, 0.3, -0.25, 0.145, 0.08, "glassl", 0, 0.2)
    cyl(0.08, 1.1, 0.55, 0.45, 0, "white", 10)
    cyl(0.18, 0.2, 0.55, 0.45, 1.1, "glassl", 10, 0, r2=0.22)
    cyl(0.24, 0.04, 0.55, 0.45, 1.3, "teal", 10)
    plane(0.15, -0.5, 0.2, 1.4, 0)


def b_smart_hub():
    box(1.5, 1.5, 0.1, 0, 0, 0, "stone")
    box(1.0, 1.0, 1.5, 0, 0.1, 0.1, "glass", 0.04, 0.15)
    for r in range(5):
        box(1.02, 1.02, 0.03, 0, 0.1, 0.35 + r * 0.28, "glow", 0, 0.3, 2.5)
    box(0.7, 0.7, 0.4, 0, 0.1, 1.6, "glassl", 0.03, 0.15)
    cyl(0.02, 0.6, 0.15, 0.25, 2.0, "steel", 6, 0)
    ball(0.05, 0.15, 0.25, 2.62, "glow", 1, emit=5)
    dome(0.16, -0.18, -0.05, 2.0, "white", 0, 0.4)
    for x, y in ((-0.6, -0.6), (0.6, -0.6)):
        tree(x, y, 0.6)


def b_reciclagem():
    pad(1.75, 1.75, "stone")
    box(1.2, 0.9, 0.7, -0.2, 0.3, 0, "sage")
    box(1.25, 0.95, 0.12, -0.2, 0.3, 0.7, "grass2", 0.02)
    for x, y in ((-0.55, 0.15), (-0.1, 0.45), (0.2, 0.2)):
        ball(0.1, x, y, 0.88, "tree")
    chimney(0.55, 0.55, 0, 1.4, 0.09, "steel", smoke=False)
    ball(0.12, 0.55, 0.55, 1.6, "smoke", 2)
    for i, c in enumerate(("blue", "mustard", "red", "sage")):
        box(0.17, 0.17, 0.22, -0.45 + i * 0.22, -0.55, 0, c, 0.02)
    box(0.4, 0.03, 0.4, -0.3, -0.155, 0, "navy", 0)
    win_side(0.4, 0.0, 0.6, 0.35, 1, 2)


def b_estadio():
    pad(1.85, 1.85, "stone")
    torus(0.68, 0.22, 0, 0, 0.28, "white", 1.4)
    cyl(0.62, 0.05, 0, 0, 0.0, "grass", 32)
    box(0.7, 0.4, 0.005, 0, 0, 0.06, "grass2", 0)
    box(0.02, 0.4, 0.006, 0, 0, 0.065, "white", 0)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        cyl(0.025, 1.0, 0.85 * math.cos(a), 0.85 * math.sin(a), 0, "steel", 6, 0)
        box(0.18, 0.05, 0.1, 0.85 * math.cos(a), 0.85 * math.sin(a), 1.0, "white", 0, emit=2, rot=(0, 0, a))
    for k in range(12):
        a = k * math.pi / 6
        box(0.08, 0.02, 0.06, 0.9 * math.cos(a), 0.9 * math.sin(a), 0.55, ("red", "mustard", "blue")[k % 3], 0, rot=(0, 0, a))


def b_ponte():
    water(1.85, 1.0, 0, 0, -0.02)
    pad(1.85, 0.42, "stone", 0, -0.72, 0.1)
    pad(1.85, 0.42, "stone", 0, 0.72, 0.1)
    box(0.36, 1.9, 0.1, 0, 0, 0.35, "white", 0.01)
    box(0.3, 1.9, 0.01, 0, 0, 0.45, "road", 0)
    for x in (-0.2, 0.2):
        rod((x, 0, 0), (x * 0.3, 0, 2.2), 0.05, "white", 10)
    box(0.2, 0.1, 0.1, 0, 0, 1.6, "white", 0.01)
    for k in range(1, 5):
        for sgn in (-1, 1):
            for x in (-0.15, 0.15):
                rod((x * 0.3, 0, 2.1 - k * 0.12), (x, sgn * k * 0.22, 0.45), 0.008, "steel", 4)
    car(0.07, -0.45, "red", math.pi / 2, 0.45)
    car(-0.07, 0.35, "mustard", math.pi / 2, 0.45)


def b_jardim():
    pad(1.8, 1.8, "grass2")
    dome(0.6, 0, 0.15, 0.08, "glassl", 0, 0.1)
    cyl(0.62, 0.08, 0, 0.15, 0, "white", 28)
    for k in range(6):
        a = k * math.pi / 3
        box(0.02, 1.2, 0.02, 0, 0.15, 0.08, "white", 0, rot=(0, 0, a))
    ball(0.25, 0, 0.15, 0.35, "palm", 1)
    for x, y, c in ((-0.65, -0.65, "pink"), (0.65, -0.65, "mustard"), (0.65, 0.65, "red")):
        cyl(0.18, 0.08, x, y, 0, "earth", 12)
        for q in range(4):
            ball(0.05, x + 0.08 * math.cos(q * 1.6), y + 0.08 * math.sin(q * 1.6), 0.12, c)
    tree(-0.7, 0.6, 0.9)
    box(1.8, 0.16, 0.035, 0, -0.62, 0, "sand", 0)


def b_telecom():
    pad(1.2, 1.2, "stone")
    cyl(0.3, 0.3, 0, 0, 0, "white", 16)
    cyl(0.16, 3.2, 0, 0, 0.3, "white", 16, r2=0.09)
    cyl(0.36, 0.3, 0, 0, 2.6, "teal", 16, r2=0.3)
    cyl(0.3, 0.12, 0, 0, 2.9, "glassl", 16, 0, emit=1)
    cyl(0.03, 0.9, 0, 0, 3.5, "red", 6, 0)
    ball(0.05, 0, 0, 4.42, "red", 1, emit=4)
    dome(0.15, 0.3, -0.1, 2.55, "white")


def b_hidro_mon():
    water(1.85, 0.85, 0, 0.5, 0.0, 0.5)
    box(1.85, 0.3, 1.0, 0, 0.0, 0, "stone", 0.02)
    box(1.85, 0.32, 0.05, 0, 0.0, 1.0, "road", 0.01)
    for i in range(3):
        box(0.22, 0.04, 0.6, -0.5 + i * 0.5, -0.17, 0.05, "sea2", 0.01, 0.1)
    water(1.85, 0.6, 0, -0.62, 0.0, 0.04)
    box(0.6, 0.35, 0.4, 0.55, -0.55, 0, "teal")
    for i in range(3):
        cyl(0.02, 0.9, -0.7 + i * 0.6, -0.15, 1.0, "steel", 6, 0)
    for k in range(5):
        ball(0.08, -0.5 + (k % 3) * 0.5, -0.4, 0.06, "white", 1)


def b_biblioteca():
    box(1.7, 1.4, 0.15, 0, 0.1, 0, "stone")
    box(1.5, 1.1, 0.9, 0, 0.2, 0.15, "cream")
    for i in range(6):
        cyl(0.05, 0.8, -0.55 + i * 0.22, -0.5, 0.15, "white", 8)
    box(1.35, 0.25, 0.1, 0, -0.5, 0.95, "white")
    gable(1.35, 0.25, 0.2, 0, -0.5, 1.05, "cream", axis="x")
    cyl(0.4, 0.3, 0, 0.25, 1.05, "cream", 20)
    dome(0.42, 0, 0.25, 1.35, "teal", 0, 0.4)
    cyl(0.03, 0.2, 0, 0.25, 1.75, "gold", 6, 0)
    win_side(0.75, -0.25, 0.65, 0.35, 2, 3)
    box(1.2, 0.3, 0.07, 0, -0.75, 0, "stone")


def b_financeiro():
    pad(1.8, 1.8, "stone")
    block(0.6, 0.6, 3.6, -0.4, 0.4, "glass", roof="steel", wkey="glassl", cols=(2, 2), gap=0.3)
    block(0.55, 0.55, 2.6, 0.45, 0.35, "navy", roof="steel", wkey="glassl", cols=(2, 2), gap=0.3)
    block(0.6, 0.5, 2.0, -0.3, -0.45, "teal", roof="steel", wkey="glassl", cols=(2, 2), gap=0.3)
    cone(0.3, 0.5, -0.4, 0.4, 3.65, "gold")
    box(0.4, 0.4, 0.25, 0.45, -0.45, 0, "glassl", 0.02, 0.2)


def b_terminal():
    pad(1.85, 1.85, "road")
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.9, depth=1.4, location=(0, 0.3, 0.0))
    o = bpy.context.active_object
    o.rotation_euler = (0, math.pi / 2, 0)
    o.scale = (0.7, 0.5, 1)
    _fin(o, "white", 0)
    box(1.45, 0.05, 0.4, 0, -0.15, 0.03, "glassl", 0, 0.2)
    for i in range(5):
        box(0.04, 0.6, 0.04, -0.6 + i * 0.3, 0.3, 0.6, "teal", 0)
    plane(0.1, -0.55, 0.22, 1.7, 0.05)
    box(0.2, 0.4, 0.12, -0.6, -0.4, 0.2, "steel", 0.01)


def b_memorial():
    for k, s in enumerate((1.6, 1.3, 1.0)):
        box(s, s, 0.12, 0, 0, k * 0.12, "stone", 0.02)
    cyl(0.18, 2.6, 0, 0, 0.36, "cream", 4, r2=0.1).rotation_euler = (0, 0, math.pi / 4)
    cone(0.1, 0.3, 0, 0, 2.96, "gold")
    box(0.5, 0.04, 0.3, 0, -0.52, 0.36, "plum", 0.01)
    for x in (-0.65, 0.65):
        flag(x, -0.65, 0, 0.8, "plum")
    box(0.06, 0.06, 0.1, 0, -0.55, 0.66, "gold", 0, emit=1)


def b_eco():
    pad(1.8, 1.8, "grass2")
    for x, y, h, c in ((-0.45, 0.4, 1.3, "cream"), (0.45, 0.45, 1.0, "wood"), (-0.35, -0.4, 0.8, "sage")):
        block(0.6, 0.55, h, x, y, c, roof="grass2", cols=(2, 2))
        ball(0.12, x, y, h + 0.12, "tree")
    for x in (0.3, 0.55):
        solar_panel(x, -0.4, 0)
    pine(0.75, -0.75, 0.7)
    cyl(0.025, 1.4, 0.75, 0.0, 0, "white", 6, 0)
    for k in range(3):
        box(0.4, 0.04, 0.06, 0.75, 0.0, 1.4, "white", 0, rot=(0, k * 2.09, 0))


def b_smart_grid():
    pad(1.8, 1.8, "stone")
    box(0.7, 0.7, 0.6, -0.2, 0.2, 0, "navy")
    dome(0.3, -0.2, 0.2, 0.6, "glow", 3, 0.2)
    for x, y in ((0.6, 0.6), (0.6, -0.6), (-0.65, -0.6)):
        cyl(0.03, 1.4, x, y, 0, "steel", 4, 0, r2=0.015)
        box(0.5, 0.03, 0.03, x, y, 1.2, "steel", 0)
        for dx in (-0.2, 0.2):
            ball(0.03, x + dx, y, 1.18, "glow", 1, emit=3)
    for i in range(3):
        box(0.25, 0.25, 0.35, 0.35 + (i % 2) * 0.0, -0.1 + i * 0.0, 0, "teal")
    hcyl(0.03, 1.3, 0.0, -0.6, 1.18, "glow")


def b_parque_ind():
    pad(1.8, 1.8, "grass2")
    for x, y in ((-0.4, 0.4), (0.45, 0.3), (-0.3, -0.45)):
        box(0.75, 0.6, 0.55, x, y, 0, "white")
        for k in range(3):
            box(0.2, 0.55, 0.02, x - 0.25 + k * 0.25, y, 0.6, "panel", 0, 0.3, rot=(0, 0.35, 0))
        box(0.25, 0.03, 0.3, x, y - 0.31, 0, "teal", 0)
    tree(0.55, -0.55, 0.8)
    tree(0.75, -0.2, 0.6)
    cyl(0.07, 1.0, 0.0, 0.8, 0, "steel", 10)


def b_porto_pesqueiro():
    water(1.85, 1.0, 0, 0.4, -0.02)
    pad(1.85, 0.75, "sand", 0, -0.55, 0.05)
    box(0.25, 1.1, 0.06, -0.2, 0.35, 0.12, "wood", 0.01)
    for y in (0.0, 0.4, 0.8):
        cyl(0.03, 0.2, -0.33, y, -0.05, "trunk", 6, 0)
    for x, y, c in ((0.25, 0.25, "red"), (0.3, 0.7, "teal"), (-0.55, 0.6, "mustard")):
        boat(x, y, 1.0, c, 0.2)
        cyl(0.01, 0.35, x, y, 0.1, "wood", 4, 0)
    house(0.45, -0.6, 0.55, 0.4, 0.4, "blue", "white", axis="x")
    for k in range(3):
        box(0.12, 0.08, 0.08, -0.5 + k * 0.14, -0.6, 0.05, "wood", 0.01)


def b_farol():
    pad(1.4, 1.4, "rock")
    for k in range(5):
        cyl(0.32 - k * 0.025, 0.42, 0, 0, 0.03 + k * 0.42, "red" if k % 2 == 0 else "white", 18, r2=0.3 - k * 0.025)
    cyl(0.28, 0.05, 0, 0, 2.13, "navy", 18)
    cyl(0.18, 0.3, 0, 0, 2.18, "mustard", 12, 0, emit=3)
    cone(0.24, 0.25, 0, 0, 2.48, "red", 12, 0)
    house(0.45, -0.45, 0.45, 0.4, 0.35, "white", "red", axis="x")


def b_resort():
    pad(1.8, 1.8, "sand")
    block(1.4, 0.55, 1.4, 0, 0.5, "white", roof="teal", cols=(5, 2))
    for r in range(4):
        box(1.42, 0.08, 0.03, 0, 0.21, 0.35 + r * 0.32, "teal", 0.005)
    cyl(0.3, 0.06, -0.25, -0.35, 0, "white", 20)
    water(0.7, 0.4, -0.25, -0.35, 0.0, 0.065)
    for x, y, c in ((0.4, -0.3, "red"), (0.65, -0.6, "mustard"), (0.3, -0.7, "teal")):
        cyl(0.012, 0.35, x, y, 0, "white", 4, 0)
        cone(0.18, 0.08, x, y, 0.3, c, 8, 0)
    palm(-0.75, -0.7, 0.9)


def b_mina():
    pad(1.8, 1.8, "rock")
    box(1.0, 0.8, 0.7, -0.35, 0.45, 0, "rock", 0.15)
    box(0.35, 0.05, 0.4, -0.35, 0.04, 0, "dark", 0.02)
    box(0.45, 0.06, 0.06, -0.35, 0.04, 0.4, "wood", 0)
    for x in (-0.5, -0.2):
        box(0.06, 0.06, 0.42, x, 0.03, 0, "wood", 0)
    box(0.18, 1.0, 0.02, -0.35, -0.45, 0.03, "wood", 0)
    for y in (-0.35, -0.65):
        box(0.3, 0.04, 0.02, -0.35, y, 0.03, "steel", 0)
    box(0.25, 0.16, 0.14, -0.35, -0.55, 0.07, "copper", 0.02)
    for k in range(4):
        ball(0.04, -0.4 + (k % 2) * 0.08, -0.55, 0.22, "copper")
    for x, y in ((0.4, 0.2), (0.75, 0.2), (0.4, 0.55), (0.75, 0.55)):
        cyl(0.025, 1.3, x, y, 0, "steel", 4, 0)
    hcyl(0.2, 0.06, 0.58, 0.38, 1.3, "steel", axis="y", verts=14)
    box(0.5, 0.45, 0.4, 0.5, -0.45, 0, "brick")
    ball(0.25, 0.75, -0.75, 0.05, "copper", 1, sz=0.5)


def b_peq_hidro():
    water(1.85, 0.9, 0, 0.5, 0, 0.3)
    box(1.85, 0.25, 0.55, 0, 0.0, 0, "stone", 0.02)
    box(0.3, 0.04, 0.4, 0, -0.14, 0.05, "sea2", 0.01, 0.1)
    water(0.6, 0.8, 0, -0.5, 0, 0.04)
    house(0.6, -0.5, 0.5, 0.45, 0.4, "teal", "stone", axis="x")
    cyl(0.025, 0.9, -0.6, -0.5, 0, "steel", 4, 0)
    box(0.4, 0.03, 0.03, -0.6, -0.5, 0.85, "steel", 0)


def b_teleferico():
    pad(1.6, 1.6, "rock")
    house(-0.3, -0.25, 0.8, 0.6, 0.55, "wood", "red", axis="x")
    box(0.3, 0.3, 1.4, 0.45, 0.45, 0, "steel", 0.01)
    box(0.5, 0.2, 0.08, 0.45, 0.45, 1.4, "dark", 0.01)
    rod((0.45, 0.45, 1.45), (-0.6, -0.6, 0.6), 0.008, "dark", 4)
    box(0.2, 0.16, 0.18, 0.05, 0.05, 0.85, "red", 0.03)
    box(0.2, 0.17, 0.06, 0.05, 0.05, 0.93, "glassl", 0, 0.2)
    cyl(0.008, 0.12, 0.05, 0.05, 1.03, "dark", 4, 0)
    pine(0.7, -0.6, 0.8)


def b_silo():
    pad(1.6, 1.6, "sand")
    for x, y, r, h in ((-0.4, 0.35, 0.32, 1.5), (0.3, 0.45, 0.28, 1.3), (-0.4, -0.35, 0.26, 1.1)):
        cyl(r, h, x, y, 0, "steel", 18)
        for k in range(int(h / 0.25)):
            cyl(r + 0.008, 0.02, x, y, 0.2 + k * 0.25, "white", 18)
        cone(r + 0.03, 0.25, x, y, h, "white", 18, 0)
    box(0.45, 0.45, 0.4, 0.4, -0.4, 0, "brick")
    gable(0.5, 0.5, 0.2, 0.4, -0.4, 0.4, "white", axis="y")


def b_cooperativa():
    pad(1.7, 1.7, "grass2")
    box(1.0, 0.8, 0.65, -0.2, 0.25, 0, "red")
    gable(1.08, 0.88, 0.4, -0.2, 0.25, 0.65, "white", axis="x")
    box(0.4, 0.04, 0.45, -0.2, -0.17, 0, "white", 0)
    box(0.3, 0.02, 0.3, -0.2, -0.19, 0.06, "red", 0)
    for k in range(3):
        box(0.5, 0.12, 0.08, 0.6 - k * 0.0, -0.4 + k * 0.18, 0, "lime", 0.02)
    box(0.25, 0.18, 0.15, 0.4, -0.75, 0.06, "mustard", 0.02)
    for x in (0.32, 0.5):
        hcyl(0.07, 0.04, x, -0.75, 0.07, "dark", axis="y")
    box(0.1, 0.12, 0.15, 0.48, -0.75, 0.2, "glassl", 0.01)


def b_moinho():
    pad(1.4, 1.4, "grass")
    cyl(0.08, 2.4, 0, 0.1, 0, "white", 12, r2=0.045)
    box(0.12, 0.28, 0.12, 0, 0.05, 2.36, "white", 0.03)
    cyl(0.05, 0.05, 0, -0.1, 2.42, "white", 10)
    for k in range(3):
        a = k * 2 * math.pi / 3 + 0.3
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0.5 * math.sin(a), -0.12, 2.42 + 0.5 * math.cos(a)))
        o = bpy.context.active_object
        o.scale = (0.07, 0.02, 1.0)
        o.rotation_euler = (0, a, 0)
        _fin(o, "white", 0.01)
    box(0.35, 0.3, 0.3, 0.45, -0.45, 0, "teal")


def b_poco():
    pad(1.6, 1.6, "desert")
    cyl(0.32, 0.3, 0, 0, 0, "stone", 18)
    cyl(0.26, 0.31, 0, 0, 0.0, "sea", 18, 0, rough=0.1)
    for x in (-0.3, 0.3):
        cyl(0.03, 0.6, x, 0, 0.3, "wood", 6, 0)
    gable(0.8, 0.6, 0.28, 0, 0, 0.88, "brick", axis="x")
    hcyl(0.04, 0.6, 0, 0, 0.75, "wood")
    cyl(0.07, 0.12, 0.05, 0, 0.45, "wood", 10)
    for x, y in ((-0.6, 0.5), (0.6, 0.45), (0.55, -0.6)):
        palm(x, y, 1.0)
    for k in range(3):
        cyl(0.08, 0.12, -0.5 + k * 0.15, -0.6, 0, "copper", 10, r2=0.05)


def b_fazenda_solar():
    pad(1.85, 1.85, "desert")
    for i in range(4):
        for j in range(4):
            solar_panel(-0.66 + i * 0.44, -0.66 + j * 0.44, 0.03, 0.4, 0.28, 0.55)
    cyl(0.02, 1.1, 0.8, 0.8, 0, "steel", 4, 0)


def b_petroleo():
    pad(1.7, 1.7, "desert")
    box(0.5, 0.2, 0.1, -0.2, 0, 0, "dark", 0.01)
    for dx in (-0.08, 0.08):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.2, dx, 0.45))
        o = bpy.context.active_object
        o.scale = (0.05, 0.04, 0.8)
        o.rotation_euler = (0, 0.25 if dx < 0 else -0.25, 0)
        _fin(o, "dark", 0.005)
    box(1.1, 0.08, 0.1, -0.2, 0, 0.85, "mustard", 0.01, rot=(0, -0.2, 0))
    box(0.18, 0.14, 0.3, -0.8, 0, 0.75, "mustard", 0.03, rot=(0, -0.2, 0))
    cyl(0.01, 0.6, -0.78, 0, 0.1, "dark", 4, 0)
    tank(0.45, 0.45, 0.3, 0.6, "white")
    box(0.62, 0.04, 0.06, 0.45, 0.14, 0.4, "red", 0)
    tank(0.55, -0.4, 0.22, 0.45, "white")


def b_pousada():
    pad(1.7, 1.7, "grass2")
    for x, y, s in ((-0.4, 0.35, 1.0), (0.4, 0.4, 0.85), (-0.1, -0.4, 0.9)):
        box(0.5 * s, 0.45 * s, 0.1, x, y, 0, "stone", 0.01)
        box(0.45 * s, 0.4 * s, 0.4 * s, x, y, 0.1, "wood")
        gable(0.55 * s, 0.5 * s, 0.35 * s, x, y, 0.1 + 0.4 * s, "tree2", axis="x")
        box(0.12, 0.03, 0.2, x, y - 0.2 * s - 0.005, 0.1, "trunk", 0)
    for x, y in ((0.6, -0.5), (0.75, -0.1), (-0.75, -0.6)):
        pine(x, y, 0.85)


def b_pesquisa():
    pad(1.6, 1.6, "grass2")
    for k in range(3):
        box(0.5, 0.45, 0.35, -0.45 + k * 0.52, 0.3, 0.12, "white")
        box(0.52, 0.47, 0.04, -0.45 + k * 0.52, 0.3, 0.47, "teal", 0.01)
        for x in (-0.18, 0.18):
            cyl(0.02, 0.12, -0.45 + k * 0.52 + x, 0.3, 0, "steel", 4, 0)
        win_front(0.075, -0.45 + k * 0.52 - 0.15, -0.45 + k * 0.52 + 0.15, 0.25, 1, 2)
    cyl(0.03, 0.4, 0.45, -0.4, 0, "steel", 6, 0)
    d = dome(0.3, 0.45, -0.4, 0.45, "white", 0, 0.4)
    d.rotation_euler = (math.radians(130), 0, math.radians(-30))
    for k in range(4):
        cyl(0.012, 1.0, -0.6 + k * 0.0, -0.5, 0, "steel", 4, 0)
    box(0.2, 0.2, 0.02, -0.6, -0.5, 1.0, "teal", 0)
    pine(-0.15, -0.65, 0.7)


def b_santuario():
    pad(1.8, 1.8, "forest")
    for k in range(8):
        a = k * math.pi / 4
        box(0.1, 0.07, 0.25, 0.4 * math.cos(a), 0.4 * math.sin(a), 0, "stone", 0.02)
    tree(0, 0, 1.5)
    for x, y, s in ((-0.7, -0.7, 0.9), (0.7, -0.7, 0.9), (-0.7, 0.7, 1.0), (0.7, 0.5, 0.8)):
        pine(x, y, s)
    for x, y in ((0.65, 0.65), (0.85, 0.65), (0.65, 0.85), (0.85, 0.85)):
        cyl(0.025, 1.2, x - 0.1, y - 0.1, 0, "wood", 4, 0)
    box(0.34, 0.34, 0.25, 0.65, 0.65, 1.2, "wood", 0.01)
    gable(0.42, 0.42, 0.2, 0.65, 0.65, 1.45, "tree2", axis="x")
    box(0.06, 0.6, 0.04, 0.0, -0.75, 0, "sand", 0)


def b_resort_ilha():
    water(1.85, 1.85, 0, 0, -0.02)
    box(0.12, 1.4, 0.05, -0.1, -0.1, 0.12, "wood", 0)
    for x, y in ((0.35, 0.35), (-0.45, 0.45), (0.4, -0.4)):
        for dx in (-0.15, 0.15):
            for dy in (-0.15, 0.15):
                cyl(0.02, 0.15, x + dx, y + dy, -0.02, "trunk", 4, 0)
        box(0.45, 0.4, 0.06, x, y, 0.12, "wood", 0.01)
        box(0.35, 0.3, 0.25, x, y, 0.18, "cream")
        cone(0.32, 0.25, x, y, 0.43, "mustard", 4)
    box(0.35, 0.15, 0.06, 0.08, 0.35, 0.12, "wood", 0)
    palm(-0.6, -0.55, 0.9)
    pad(0.5, 0.5, "sand", -0.6, -0.55, 0.05)


def b_balsa():
    water(1.85, 1.85, 0, 0, -0.02)
    pad(1.85, 0.6, "stone", 0, -0.62, 0.08)
    box(0.5, 0.6, 0.06, -0.3, -0.1, 0.06, "steel", 0.01)
    boat(0.25, 0.4, 2.6, "white", 0.0)
    box(0.9, 0.36, 0.03, 0.25, 0.4, 0.26, "red", 0.01)
    car(0.05, 0.4, "blue", 0, 0.29)
    car(0.4, 0.4, "mustard", 0, 0.29)
    house(0.5, -0.62, 0.45, 0.35, 0.4, "teal", "white", axis="x")


def b_estaleiro():
    water(1.85, 1.85, 0, 0, -0.02)
    pad(1.85, 0.5, "stone", 0, -0.68, 0.08)
    box(1.3, 0.9, 0.1, -0.15, 0.2, 0.0, "stone", 0.01)
    box(1.1, 0.4, 0.3, -0.15, 0.2, 0.1, "brick", 0.08)
    box(0.9, 0.38, 0.05, -0.15, 0.2, 0.4, "white", 0.01)
    box(0.3, 0.25, 0.3, -0.45, 0.2, 0.45, "white", 0.02)
    crane(0.6, 0.65, 1.6, "mustard")
    crane(0.6, -0.3, 1.2, "red")
    box(0.6, 0.35, 0.4, -0.4, -0.68, 0.08, "steel")


BUILDINGS = {
    "P-01": b_lot_res, "P-01-RES": b_lot_res, "P-01-COM": b_lot_com, "P-01-IND": b_lot_ind, "P-01-INFe": b_lot_infe,
    "P-01-INFw": b_lot_infw,
    "PREF": b_pref, "HOME": b_home,
    "E1-01": b_conjunto, "E1-02": b_mercadinho, "E1-03": b_oficina, "E1-04": b_posto, "E1-05": b_praca,
    "E1-06": b_painel, "E1-07": b_tratamento, "E1-08": b_feira,
    "E2-01": b_torre_res, "E2-02": b_shopping, "E2-03": b_siderurgica, "E2-04": b_gas, "E2-05": b_hospital,
    "E2-06": b_universidade, "E2-07": b_parque_linear, "E2-08": b_metro, "E2-09": b_porto,
    "E3-01": b_arranha, "E3-02": b_complexo, "E3-03": b_nuclear, "E3-04": b_convencoes, "E3-05": b_aeroporto,
    "E3-06": b_smart_hub, "E3-07": b_reciclagem,
    "M-01": b_estadio, "M-02": b_ponte, "M-03": b_jardim, "M-04": b_telecom, "M-05": b_hidro_mon,
    "M-06": b_biblioteca, "M-07": b_financeiro, "M-08": b_terminal, "M-09": b_memorial, "M-10": b_eco,
    "M-11": b_smart_grid, "M-12": b_parque_ind,
    "R-LIT-1": b_porto_pesqueiro, "R-LIT-2": b_farol, "R-LIT-3": b_resort,
    "R-MON-1": b_mina, "R-MON-2": b_peq_hidro, "R-MON-3": b_teleferico,
    "R-PLA-1": b_silo, "R-PLA-2": b_cooperativa, "R-PLA-3": b_moinho,
    "R-DES-1": b_poco, "R-DES-2": b_fazenda_solar, "R-DES-3": b_petroleo,
    "R-FLO-1": b_pousada, "R-FLO-2": b_pesquisa, "R-FLO-3": b_santuario,
    "R-ILH-1": b_resort_ilha, "R-ILH-2": b_balsa, "R-ILH-3": b_estaleiro,
}


# =============================================================== chão das casas
SLAB = 1.96


def slab(top, side="earth"):
    box(SLAB, SLAB, 0.29, 0, 0, -0.32, side, 0.03)  # topo abaixo da tampa (evita z-fighting no 3D)
    box(SLAB, SLAB, 0.06, 0, 0, -0.06, top, 0.025)


def speckle(key, n, seed, r=0.05, z=0.0, margin=0.8):
    import random
    rnd = random.Random(seed)
    for _ in range(n):
        ball(r * rnd.uniform(0.6, 1.3), rnd.uniform(-margin, margin), rnd.uniform(-margin, margin), z, key, 1, sz=0.5)


def g_plain(top):
    def f():
        slab(top)
        speckle("grass2" if top.startswith("grass") else "dune", 6, 1, 0.06)
    return f


def g_orla():
    slab("sand")
    water(SLAB, 0.62, 0, 0.67, -0.04, 0.05)
    box(SLAB, 0.06, 0.02, 0, 0.36, 0.0, "white", 0)
    speckle("dune", 4, 2, 0.05, 0, 0.6)


def g_costa():
    slab("sand")
    speckle("dune", 5, 3, 0.05)
    ball(0.06, 0.7, -0.7, 0.0, "white", 1)


def g_encosta():
    slab("grass2", "rock")
    for x, y, s in ((-0.6, 0.55, 0.22), (0.55, 0.6, 0.18), (-0.65, -0.55, 0.14), (0.7, -0.3, 0.12)):
        ball(s, x, y, 0.02, "rock", 1, sz=0.7)
    box(SLAB, 0.25, 0.08, 0, 0.82, 0, "rock", 0.04)
    box(0.25, SLAB, 0.06, -0.82, 0, 0, "rock", 0.03)


def g_jazida():
    slab("sand", "rock")
    for x, y in ((-0.65, 0.6), (0.6, -0.65), (0.7, 0.6)):
        for k in range(3):
            cone(0.06, 0.2, x + 0.06 * k, y + 0.04 * (k % 2), 0.0, "gold", 5, k)
    speckle("rock", 6, 4, 0.06)


def g_rio():
    slab("grass")
    water(0.7, SLAB, 0, 0, -0.04, 0.05)
    box(0.04, SLAB, 0.01, -0.36, 0, 0.0, "sand", 0)
    box(0.04, SLAB, 0.01, 0.36, 0, 0.0, "sand", 0)


def g_duna():
    slab("desert", "dune")
    for x, y, s in ((-0.4, 0.4, 0.55), (0.5, -0.3, 0.45)):
        ball(s, x, y, -0.05, "dune", 2, sz=0.32)


def g_oasis():
    slab("desert", "dune")
    cyl(0.55, 0.02, 0, 0, -0.01, "grass", 24)
    cyl(0.42, 0.03, 0, 0, -0.01, "sea", 24, 0, rough=0.1)
    palm(-0.7, 0.6, 0.9)
    palm(0.65, -0.7, 0.8)


def g_floresta():
    slab("forest")
    for x, y, s in ((-0.5, 0.5, 1.0), (0.45, 0.55, 1.1), (-0.55, -0.45, 0.9), (0.5, -0.5, 1.0), (0.0, 0.05, 1.2), (0.0, 0.75, 0.8), (-0.75, 0.0, 0.8)):
        pine(x, y, s)


def g_desmatada():
    slab("grass2")
    for x, y in ((-0.5, 0.4), (0.4, 0.5), (-0.3, -0.5), (0.6, -0.4)):
        cyl(0.06, 0.07, x, y, 0, "trunk", 8, 0)
        cyl(0.045, 0.071, x, y, 0, "wood", 8, 0)


GROUNDS = {
    "g-plain-grass": g_plain("grass"), "g-plain-sand": g_plain("desert"), "g-O": g_orla, "g-C": g_costa,
    "g-E": g_encosta, "g-J": g_jazida, "g-R": g_rio, "g-D": g_duna, "g-A": g_oasis, "g-F": g_floresta,
    "g-Fx": g_desmatada,
}


# =============================================================== cena e render
def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.film_transparent = True
    sc.render.resolution_x, sc.render.resolution_y = RES_X, RES_Y
    sc.render.image_settings.file_format = "WEBP"
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.image_settings.quality = 88
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.exposure = 0.15
    w = bpy.data.worlds.new("World")
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = hex_rgba("#F3EBDD")
    bg.inputs["Strength"].default_value = 0.85
    sun = bpy.data.lights.new("Sol", "SUN")
    sun.energy, sun.angle, sun.color = 3.2, math.radians(12), (1.0, 0.96, 0.9)
    so = bpy.data.objects.new("Sol", sun)
    sc.collection.objects.link(so)
    so.rotation_euler = (math.radians(50), math.radians(-18), math.radians(-35))
    cam = bpy.data.cameras.new("Camera")
    cam.type, cam.ortho_scale, cam.shift_y = "ORTHO", ORTHO, SHIFT_Y
    co = bpy.data.objects.new("Camera", cam)
    sc.collection.objects.link(co)
    co.rotation_euler = (math.radians(60), 0, math.radians(45))
    d = mathutils.Vector((0, 0, 1))
    d.rotate(co.rotation_euler)
    co.location = d * 40
    sc.camera = co
    return sc, co


def clear(keep):
    for o in list(bpy.context.scene.objects):
        if o.name not in keep:
            bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes):
        if not m.users:
            bpy.data.meshes.remove(m)


def main_glb():
    """Export the runtime kit, then save an arranged, editable Blender library."""
    import json
    sc, co = setup()
    for o in list(sc.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    roots = []
    report = {}
    for name, fn in {**BUILDINGS, **GROUNDS}.items():
        before = set(sc.objects)
        fn()
        meshes = sorted(set(sc.objects) - before, key=lambda o: o.name)
        # Bake bevels and group by material: dozens of windows become one draw call.
        groups = {}
        for o in meshes:
            bpy.context.view_layer.objects.active = o
            for modifier in list(o.modifiers):
                bpy.ops.object.modifier_apply(modifier=modifier.name)
            groups.setdefault(o.data.materials[0].name, []).append(o)
        root = bpy.data.objects.new(name, None)
        sc.collection.objects.link(root)
        roots.append(root)
        for material, objects in groups.items():
            bpy.ops.object.select_all(action="DESELECT")
            for o in objects:
                o.select_set(True)
            bpy.context.view_layer.objects.active = objects[0]
            bpy.ops.object.join()
            o = bpy.context.object
            o.name = name + "__" + material
            # Correct face winding in older hand-built roof and dome meshes.
            bpy.ops.object.mode_set(mode="EDIT")
            bpy.ops.mesh.select_all(action="SELECT")
            bpy.ops.mesh.normals_make_consistent(inside=False)
            bpy.ops.object.mode_set(mode="OBJECT")
            o.parent = root
        report[name] = {"meshes": len(root.children), "triangles": sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in root.children)}
    path = os.path.normpath(os.path.join(HERE, "..", "..", "frontend", "public", "mandato", "models", "mandato.glb"))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_apply=True, export_cameras=False, export_lights=False)
    with open(os.path.join(HERE, "model_report.json"), "w") as f:
        json.dump(report, f, indent=2)
    # All GLB roots remain at the origin; only the editable library uses a grid.
    for i, root in enumerate(roots):
        root.location = ((i % 9) * 3.2, (i // 9) * 3.2, 0)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "mandato_modelos.blend"))
    print("GLB_OK", path, "MODELS", len(roots), "MESHES", sum(r["meshes"] for r in report.values()))


def main():
    sc, co = setup()
    keep = {o.name for o in sc.objects}
    bpy.context.view_layer.update()
    a = world_to_camera_view(sc, co, mathutils.Vector((0, 0, 0)))
    e = world_to_camera_view(sc, co, mathutils.Vector((1, 1, 0)))  # canto do losango (direita)
    print(f"ISO_ANCHOR_X={a.x:.4f} ISO_ANCHOR_Y={1 - a.y:.4f} ISO_DIAMOND={(e.x - a.x) * 2:.4f}")
    jobs = {**BUILDINGS, **GROUNDS}
    for name, fn in jobs.items():
        if ONLY and name not in ONLY:
            continue
        clear(keep)
        fn()
        sc.render.filepath = os.path.join(OUT, f"{name}.webp")
        bpy.ops.render.render(write_still=True)
        print("sprite:", name)
    print("SPRITES_OK", len(jobs))


if __name__ == "__main__":
    if "--glb" in sys.argv:
        main_glb()
    else:
        main()
