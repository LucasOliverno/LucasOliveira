# MANDATO — protótipo 3D (Blender 5.x), gerado por script.
# Uso (sem abrir a interface):
#   blender.exe --background --factory-startup --python MANDATO/3d/build_prototype.py
# Saída: MANDATO/3d/mandato_prototipo.blend, MANDATO/3d/mandato_prototipo.glb e MANDATO/3d/renders/*.png
#
# Padrão do kit (vale para todos os modelos futuros):
#   - 1 casa do tabuleiro = 2 m × 2 m; tabuleiro 4×4 = 8 m; a cidade fica centrada na origem.
#   - prédios cabem em 1,7 m × 1,7 m, altura livre (prédio baixo ~1–1,5 m; torre até ~4 m).
#   - paleta do guia visual: navy #1B2A41, creme #F3EBDD, teal #1F6F78, mostarda #E0A526, tijolo #C4533A,
#     sálvia #8DAA7E, ameixa #6B3F69. Cores chapadas, sombreamento suave, chanfro leve nas arestas.
#   - câmera ortográfica isométrica (60° / 45°), sol do alto-esquerda, fundo transparente.
import math
import os
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "renders")
os.makedirs(OUT, exist_ok=True)

TILE = 2.0
PAL = {
    "navy": "#1B2A41", "cream": "#F3EBDD", "teal": "#1F6F78", "mustard": "#E0A526", "brick": "#C4533A",
    "sage": "#8DAA7E", "plum": "#6B3F69", "white": "#FBF7EE", "sand": "#E9D4A3", "grass": "#9FBF7A",
    "grass2": "#8FB46E", "earth": "#8A5A3C", "earth2": "#6E4630", "sea": "#3E8FB0", "sea2": "#5FB3C9",
    "glass": "#2E4A63", "smoke": "#D9D4CB", "tree": "#4F8A4E", "tree2": "#3E7448", "trunk": "#7A5236",
    "roof": "#B8483A", "sky": "#F3EBDD", "stone": "#CFC6B6", "sun": "#F6C453",
}


def hex_rgba(h):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, 1.0)


_mats = {}


def mat(key, rough=0.65, emit=0.0):
    name = f"M_{key}"
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = hex_rgba(PAL[key])
    bsdf.inputs["Roughness"].default_value = rough
    if emit:
        bsdf.inputs["Emission Color"].default_value = hex_rgba(PAL[key])
        bsdf.inputs["Emission Strength"].default_value = emit
    _mats[name] = m
    return m


def finish(obj, m, bevel=0.035, parent=None, smooth=False):
    obj.data.materials.clear()
    obj.data.materials.append(m)
    if bevel:
        b = obj.modifiers.new("Bevel", "BEVEL")
        b.width = bevel
        b.segments = 2
        b.limit_method = "ANGLE"
    if smooth:
        bpy.ops.object.shade_smooth()
    if parent:
        obj.parent = parent
    return obj


def box(sx, sy, sz, x, y, z, key, parent=None, bevel=0.035, rough=0.65):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z + sz / 2))
    o = bpy.context.active_object
    o.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True)
    return finish(o, mat(key, rough), bevel, parent)


def cyl(r, h, x, y, z, key, parent=None, verts=12, bevel=0.02):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=(x, y, z + h / 2))
    return finish(bpy.context.active_object, mat(key), bevel, parent)


def cone(r1, r2, h, x, y, z, key, parent=None, verts=4, rot=math.pi / 4, bevel=0.02):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=h, location=(x, y, z + h / 2), rotation=(0, 0, rot))
    return finish(bpy.context.active_object, mat(key), bevel, parent)


def ico(r, x, y, z, key, parent=None, sub=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=(x, y, z))
    return finish(bpy.context.active_object, mat(key, 0.9), 0, parent)


def gable(sx, sy, h, x, y, z, key, parent=None, axis="x"):
    """Telhado de duas águas (prisma); a cumeeira corre no eixo dado."""
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
    return finish(o, mat(key), 0.02, parent)


def windows(face_y, x0, x1, z0, rows, cols, parent, depth_dir=-1, key="glass", w=0.16, h=0.2, gap_z=0.38):
    """Janelas como pequenas caixas escuras numa fachada voltada para -Y (frente da câmera)."""
    for r in range(rows):
        for c in range(cols):
            x = x0 + (x1 - x0) * (c + 0.5) / cols
            box(w, 0.04, h, x, face_y + 0.01 * depth_dir, z0 + r * gap_z, key, parent, bevel=0, rough=0.3)


def windows_side(face_x, y0, y1, z0, rows, cols, parent, key="glass", w=0.16, h=0.2, gap_z=0.38):
    for r in range(rows):
        for c in range(cols):
            y = y0 + (y1 - y0) * (c + 0.5) / cols
            box(0.04, w, h, face_x + 0.01, y, z0 + r * gap_z, key, parent, bevel=0, rough=0.3)


def empty(name, loc=(0, 0, 0)):
    e = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(e)
    e.location = loc
    return e


def tree(x, y, z, p, s=1.0):
    cyl(0.06 * s, 0.25 * s, x, y, z, "trunk", p, verts=6, bevel=0)
    ico(0.26 * s, x, y, z + 0.38 * s, "tree", p)
    ico(0.18 * s, x + 0.12 * s, y - 0.06 * s, z + 0.55 * s, "tree2", p)


# ---------------------------------------------------------------- prédios (origem = centro da casa, chão z=0)
def b_prefeitura(p):
    box(1.5, 1.1, 0.12, 0, 0.1, 0, "stone", p)                      # base
    box(1.3, 0.9, 0.75, 0, 0.12, 0.12, "cream", p)                   # corpo
    cone(1.02, 0.15, 0.42, 0, 0.12, 0.87, "roof", p)                 # telhado de 4 águas
    for i in range(4):                                               # colunata
        cyl(0.05, 0.6, -0.36 + i * 0.24, -0.42, 0.12, "white", p, verts=8)
    box(0.95, 0.22, 0.08, 0, -0.42, 0.72, "white", p)                # frontão
    gable(0.95, 0.22, 0.18, 0, -0.42, 0.8, "cream", p, axis="x")
    box(1.0, 0.25, 0.06, 0, -0.62, 0, "stone", p)                    # escadaria
    box(0.8, 0.18, 0.06, 0, -0.56, 0.06, "stone", p)
    box(0.34, 0.34, 0.5, 0, 0.12, 1.12, "cream", p)                  # torre do relógio
    cyl(0.11, 0.03, 0, -0.06, 1.44, "white", p, verts=16)             # relógio (sem números)
    bpy.context.active_object.rotation_euler = (math.pi / 2, 0, 0)
    cone(0.27, 0.0, 0.28, 0, 0.12, 1.62, "roof", p)
    cyl(0.015, 0.4, 0, 0.12, 1.86, "navy", p, verts=6, bevel=0)       # mastro
    box(0.22, 0.02, 0.13, 0.12, 0.12, 2.1, "mustard", p, bevel=0)     # bandeira lisa
    windows(-0.33, -0.6, 0.6, 0.35, 1, 6, p)
    tree(-0.72, -0.55, 0, p, 0.8)
    tree(0.72, -0.55, 0, p, 0.8)


def b_moradia(p):
    for i, (dx, col) in enumerate(((-0.38, "sage"), (0.38, "cream"))):
        box(0.72, 0.9, 0.95, dx, 0.05, 0, col, p)
        gable(0.8, 1.0, 0.38, dx, 0.05, 0.95, "roof", p, axis="y")
        windows(-0.41, dx - 0.3, dx + 0.3, 0.25, 2, 2, p)
        box(0.2, 0.05, 0.32, dx + 0.18, -0.42, 0, "trunk", p, bevel=0)   # porta
        box(0.34, 0.2, 0.04, dx + 0.18, -0.48, 0.38, "roof", p, bevel=0)  # toldinho
    box(1.6, 0.35, 0.04, 0, -0.66, 0, "grass2", p, bevel=0)          # jardinzinho
    cyl(0.015, 0.45, -0.75, -0.62, 0, "trunk", p, verts=6, bevel=0)  # varal
    cyl(0.015, 0.45, -0.25, -0.62, 0, "trunk", p, verts=6, bevel=0)
    for k, c in enumerate(("white", "sea2", "white")):
        box(0.1, 0.01, 0.14, -0.62 + k * 0.13, -0.62, 0.28, c, p, bevel=0)


def b_conjunto(p):
    for dx, dy, h, col in ((-0.42, 0.25, 1.35, "sand"), (0.42, 0.3, 1.1, "mustard"), (0.0, -0.38, 0.85, "brick")):
        box(0.7, 0.65, h, dx, dy, 0, col, p)
        box(0.74, 0.69, 0.06, dx, dy, h, "stone", p)
        box(0.18, 0.14, 0.12, dx + 0.15, dy + 0.1, h + 0.06, "white", p)    # caixa-d'água
        windows(dy - 0.33, dx - 0.28, dx + 0.28, 0.2, max(2, int(h / 0.38)), 3, p)
        windows_side(dx + 0.35, dy - 0.25, dy + 0.25, 0.2, max(2, int(h / 0.38)), 2, p)
    tree(0.75, -0.6, 0, p, 0.7)


def b_mercadinho(p):
    box(1.2, 1.0, 0.85, 0, 0.1, 0, "cream", p)
    box(1.26, 1.06, 0.08, 0, 0.1, 0.85, "stone", p)
    box(0.9, 0.04, 0.42, 0, -0.41, 0.12, "glass", p, bevel=0, rough=0.25)  # vitrine
    for i in range(6):                                                  # toldo listrado
        col = "sea2" if i % 2 == 0 else "white"
        o = box(0.2, 0.42, 0.04, -0.5 + i * 0.2, -0.56, 0.68, col, p, bevel=0)
        o.rotation_euler = (math.radians(-22), 0, 0)
    for i, c in enumerate(("brick", "mustard", "sage")):               # caixotes de frutas
        box(0.24, 0.18, 0.14, -0.45 + i * 0.3, -0.82, 0, "trunk", p, bevel=0.01)
        for k in range(3):
            ico(0.045, -0.53 + i * 0.3 + k * 0.08, -0.82, 0.18, c, p, sub=1)


def b_oficina(p):
    box(1.3, 1.1, 0.8, 0, 0.1, 0, "brick", p)
    gable(1.4, 1.2, 0.35, 0, 0.1, 0.8, "stone", p, axis="x")
    box(0.6, 0.04, 0.55, -0.15, -0.46, 0, "navy", p, bevel=0)             # portão
    cyl(0.12, 1.1, 0.42, 0.35, 0.8, "brick", p, verts=10)                  # chaminé
    cyl(0.14, 0.08, 0.42, 0.35, 1.9, "navy", p, verts=10)
    for k, (dx, dz, r) in enumerate(((0.0, 2.15, 0.16), (0.12, 2.38, 0.2), (0.3, 2.6, 0.24))):
        ico(r, 0.42 + dx, 0.35, dz, "smoke", p, sub=2)
    for k in range(3):                                                     # barras de aço
        cyl(0.04, 0.9, 0.55, -0.62 + k * 0.09, 0.05, "stone", p, verts=6)
        bpy.context.active_object.rotation_euler = (0, math.pi / 2, 0)
    windows_side(0.65, -0.3, 0.45, 0.35, 1, 3, p)


BUILDINGS = [
    ("PREF", "Prefeitura", b_prefeitura),
    ("HOME", "Moradia Popular", b_moradia),
    ("E1-01", "Conjunto Habitacional", b_conjunto),
    ("E1-02", "Mercadinho de Bairro", b_mercadinho),
    ("E1-03", "Oficina Metalúrgica", b_oficina),
]


# ---------------------------------------------------------------- terreno: Litoral (grade OOOO.PH.........)
LITORAL = "OOOO.PH........."


def terrain(name, grid, p):
    # placa com camadas de terra, mar ao fundo
    box(8.6, 8.6 + 2.2, 0.5, 0, 1.1, -0.62, "earth2", p, bevel=0.08)
    box(8.6, 8.6, 0.12, 0, 0, -0.12, "earth", p, bevel=0.04)
    box(8.5, 2.1, 0.07, 0, 5.4, -0.12, "sea", p, bevel=0.03, rough=0.15)      # faixa de mar (mais baixa que a terra)
    for i in range(5):                                                         # ondas
        box(0.9, 0.08, 0.02, -3.2 + i * 1.6, 5.0 + (i % 2) * 0.6, -0.05, "sea2", p, bevel=0)
    for i, k in enumerate(grid):
        cx = -3 + (i % 4) * TILE
        cy = 3 - (i // 4) * TILE                       # linha 0 = fundo (perto do mar)
        key = "sand" if k == "O" else ("grass" if (i + i // 4) % 2 == 0 else "grass2")
        box(TILE - 0.08, TILE - 0.08, 0.1, cx, cy, -0.04, key, p, bevel=0.03)
    # árvores e pedras decorativas nas bordas
    for (x, y, s) in ((-4.0, -3.9, 0.9), (3.9, -3.7, 0.8), (-3.9, 0.2, 0.7), (4.0, 1.6, 0.75)):
        tree(x, y, 0.06, p, s)


def tile_center(i):
    return (-3 + (i % 4) * TILE, 3 - (i // 4) * TILE)


# ---------------------------------------------------------------- cena, câmera, luz
def setup_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.view_settings.exposure = 0.15
    w = bpy.data.worlds.new("World")
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = hex_rgba("#F3EBDD")
    bg.inputs["Strength"].default_value = 0.85
    sun = bpy.data.lights.new("Sol", "SUN")
    sun.energy = 3.2
    sun.angle = math.radians(12)
    sun.color = (1.0, 0.96, 0.9)
    so = bpy.data.objects.new("Sol", sun)
    sc.collection.objects.link(so)
    so.rotation_euler = (math.radians(50), math.radians(-18), math.radians(-35))
    cam = bpy.data.cameras.new("Camera")
    cam.type = "ORTHO"
    co = bpy.data.objects.new("Camera", cam)
    sc.collection.objects.link(co)
    co.rotation_euler = (math.radians(60), 0, math.radians(45))
    sc.camera = co
    return sc, co


def frame(co, target, dist=30, ortho=3.2):
    """Câmera isométrica olhando para o ponto alvo."""
    import mathutils
    d = mathutils.Vector((0, 0, 1))
    d.rotate(co.rotation_euler)
    co.location = mathutils.Vector(target) + d * dist
    co.data.ortho_scale = ortho


def render(sc, path, res):
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("render:", path)


def main():
    sc, co = setup_scene()
    # 1) cada prédio sozinho (para virar arte de carta/casa)
    roots = {}
    for i, (bid, _name, fn) in enumerate(BUILDINGS):
        root = empty(f"B_{bid}", (i * 6.0 + 40, 0, 0))
        fn(root)
        roots[bid] = root
    for bid, root in roots.items():
        for other in roots.values():
            for o in [other, *other.children_recursive]:
                o.hide_render = other is not root
        frame(co, (root.location.x, root.location.y, 0.7), ortho=3.0)
        render(sc, os.path.join(OUT, f"{bid}.png"), (640, 640))
    for root in roots.values():
        for o in [root, *root.children_recursive]:
            o.hide_render = False

    # 2) o terreno do Litoral com prédios nas casas (prévia do tabuleiro 3D)
    city = empty("Cidade_Litoral")
    terrain("Litoral", LITORAL, city)
    placement = {"PREF": 5, "HOME": 6, "E1-01": 9, "E1-02": 1, "E1-03": 14}
    for bid, ti in placement.items():
        x, y = tile_center(ti)
        roots[bid].location = (x, y, 0.06)
    frame(co, (0, 0.6, 0), ortho=13.5)
    render(sc, os.path.join(OUT, "cidade_litoral.png"), (1600, 1200))

    # 3) só o terreno vazio
    for root in roots.values():
        for o in [root, *root.children_recursive]:
            o.hide_render = True
    render(sc, os.path.join(OUT, "terreno_litoral.png"), (1600, 1200))
    for root in roots.values():
        for o in [root, *root.children_recursive]:
            o.hide_render = False

    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "mandato_prototipo.blend"))
    try:
        bpy.ops.export_scene.gltf(filepath=os.path.join(HERE, "mandato_prototipo.glb"), export_format="GLB")
    except Exception as e:  # o exportador é opcional para o protótipo
        print("glb não exportado:", e)
    print("PROTOTIPO_OK")


main()
