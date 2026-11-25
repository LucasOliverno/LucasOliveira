# MANDATO — mapa ilustrado da Ilha no formato exato do jogo (vista de cima).
# A arte gerada por IA (T-ilha) tem as ilhas em outra posição; este mapa segue a grade do jogo:
# Ilha Principal em L (3×3 sem o canto) à esquerda, Ilha Norte (2×2) em cima à direita, Ilha Leste (2×2) embaixo à direita.
#   blender --background --factory-startup --python MANDATO/3d/render_ilha_mapa.py
# Saída: frontend/public/mandato/art/T-ilha-grid.webp (6×5 casas, 1200×1000)
import math
import os
import random

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'frontend', 'public', 'mandato', 'art', 'T-ilha-grid.webp'))
CELL = 2.0
COLS, ROWS = 6, 5
# casas de cada ilha (x, y) na grade do jogo (y cresce para baixo)
ISLANDS = {
    'M': [(0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (2, 1), (0, 2), (1, 2)],
    'N': [(4, 0), (5, 0), (4, 1), (5, 1)],
    'L': [(4, 3), (5, 3), (4, 4), (5, 4)],
}
PAL = {
    'sea': '#2F8FA6', 'deep': '#23748C', 'shallow': '#7CCAD6', 'foam': '#E9F4F0', 'sand': '#EAD39C', 'sand2': '#DDBF80',
    'grass': '#93B56C', 'grass2': '#7FA45B', 'tree': '#4F8A4E', 'tree2': '#3E7448', 'trunk': '#7A5236', 'palm': '#5FA052',
    'rock': '#9A8F80', 'hill': '#88A863', 'boat': '#FBF7EE', 'sail': '#E0A526', 'roof': '#C4533A',
}


def col(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c], 1)


_m = {}


def mat(k, rough=0.8):
    if k in _m:
        return _m[k]
    m = bpy.data.materials.new(k)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = col(PAL[k])
    b.inputs['Roughness'].default_value = rough
    _m[k] = m
    return m


def put(o, k, rough=0.8, bevel=0.0, segs=4):
    o.data.materials.append(mat(k, rough))
    if bevel:
        b = o.modifiers.new('b', 'BEVEL')
        b.width, b.segments = bevel, segs
    return o


def box(sx, sy, sz, x, y, z, k, bevel=0.0, rough=0.8, segs=4):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    o = bpy.context.active_object
    o.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True)
    return put(o, k, rough, bevel, segs)


def cyl(r, h, x, y, z, k, v=16, r2=None):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h, location=(x, y, z + h / 2))
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=h, location=(x, y, z + h / 2))
    return put(bpy.context.active_object, k)


def ball(r, x, y, z, k, sz=1.0, sub=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r, location=(x, y, z))
    o = bpy.context.active_object
    o.scale = (1, 1, sz)
    return put(o, k, 0.9)


def wc(x, y):  # centro da casa (x, y) em coordenadas do mundo
    return x * CELL + CELL / 2, -(y * CELL + CELL / 2)


def runs(cells):
    rows = {}
    for x, y in cells:
        rows.setdefault(y, []).append(x)
    out = []
    for y, xs in rows.items():
        xs.sort()
        a = xs[0]
        for i in range(1, len(xs) + 1):
            if i == len(xs) or xs[i] != xs[i - 1] + 1:
                out.append((a, xs[i - 1], y))
                if i < len(xs):
                    a = xs[i]
    return out


def land(cells, m, h, z, k, bevel):
    for x0, x1, y in runs(cells):
        cx = (x0 + x1 + 1) * CELL / 2
        cy = -(y * CELL + CELL / 2)
        box((x1 - x0 + 1) * CELL + 2 * m, CELL + 2 * m, h, cx, cy, z, k, bevel, 0.9, 6)


def palm(x, y, s=1.0):
    t = cyl(0.05 * s, 0.7 * s, x, y, 0.1, 'trunk', 6, 0.035 * s)
    t.rotation_euler = (0.15, 0.1, 0)
    for i in range(6):
        a = i * math.pi / 3
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x + 0.22 * s * math.cos(a) + 0.08, y + 0.22 * s * math.sin(a) + 0.04, 0.78 * s))
        o = bpy.context.active_object
        o.scale = (0.45 * s, 0.1 * s, 0.02)
        o.rotation_euler = (0, -0.3, a)
        put(o, 'palm')


def tree(x, y, s=1.0):
    cyl(0.05 * s, 0.25 * s, x, y, 0.1, 'trunk', 6)
    ball(0.3 * s, x, y, 0.5 * s, 'tree')
    ball(0.2 * s, x + 0.12 * s, y - 0.08 * s, 0.68 * s, 'tree2')


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x, sc.render.resolution_y = 1200, 1000
    sc.render.image_settings.file_format = 'WEBP'
    sc.render.image_settings.quality = 88
    sc.view_settings.view_transform = 'Standard'
    w = bpy.data.worlds.new('w')
    sc.world = w
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs['Color'].default_value = col('#F3EBDD')
    w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.9
    sun = bpy.data.lights.new('sun', 'SUN')
    sun.energy, sun.angle = 3.0, math.radians(14)
    so = bpy.data.objects.new('sun', sun)
    sc.collection.objects.link(so)
    so.rotation_euler = (math.radians(38), math.radians(-22), math.radians(-30))
    cam = bpy.data.cameras.new('cam')
    cam.type, cam.ortho_scale = 'ORTHO', COLS * CELL
    co = bpy.data.objects.new('cam', cam)
    sc.collection.objects.link(co)
    co.location = (COLS * CELL / 2, -ROWS * CELL / 2, 40)
    sc.camera = co
    rnd = random.Random(7)

    # mar: fundo mais escuro, manchas mais claras e espuma em volta das ilhas
    box(COLS * CELL + 6, ROWS * CELL + 6, 0.2, COLS * CELL / 2, -ROWS * CELL / 2, -0.4, 'deep', 0, 0.3)
    for _ in range(26):
        ball(rnd.uniform(0.6, 1.6), rnd.uniform(0, COLS * CELL), -rnd.uniform(0, ROWS * CELL), -0.32, 'sea', 0.05)
    for cells in ISLANDS.values():
        land(cells, 0.95, 0.06, -0.28, 'shallow', 0.6)
        land(cells, 0.62, 0.06, -0.22, 'foam', 0.5)
        land(cells, 0.55, 0.12, -0.12, 'sand', 0.45)
        land(cells, 0.12, 0.1, 0.0, 'grass', 0.3)

    # relevo e vegetação: colinas no meio das ilhas, árvores e palmeiras na costa, sem cobrir o centro das casas
    ball(1.2, *wc(1, 1), -0.25, 'hill', 0.35)
    ball(0.8, *wc(0.4, 0.3), -0.2, 'grass2', 0.3)
    ball(0.7, *wc(4.5, 0.5), -0.2, 'hill', 0.3)
    ball(0.7, *wc(4.6, 3.6), -0.2, 'grass2', 0.3)
    for cells in ISLANDS.values():
        xs = [c[0] for c in cells]
        ys = [c[1] for c in cells]
        x0, x1, y0, y1 = min(xs) * CELL, (max(xs) + 1) * CELL, -min(ys) * CELL, -(max(ys) + 1) * CELL
        for _ in range(9):
            side = rnd.choice('NSEW')
            if side in 'NS':
                x, y = rnd.uniform(x0 + 0.2, x1 - 0.2), (y0 + 0.25 if side == 'N' else y1 - 0.25)
            else:
                x, y = (x0 - 0.25 if side == 'W' else x1 + 0.25), rnd.uniform(y1 + 0.2, y0 - 0.2)
            if any(abs(x - wc(cx, cy)[0]) < 0.6 and abs(y - wc(cx, cy)[1]) < 0.6 for cx, cy in cells):
                continue
            tree(x, y, rnd.uniform(0.55, 0.85))
        for _ in range(4):
            ball(rnd.uniform(0.08, 0.16), rnd.uniform(x0, x1), rnd.uniform(y1, y0), 0.05, 'rock', 0.6, 1)
        for _ in range(14):  # manchas de grama mais escura (textura do chão)
            ball(rnd.uniform(0.25, 0.6), rnd.uniform(x0 + 0.3, x1 - 0.3), rnd.uniform(y1 + 0.3, y0 - 0.3), 0.04, 'grass2', 0.03, 2)
    # barquinhos no canal entre as ilhas
    for x, y, r in ((7.0, -5.0, 0.3), (6.6, -8.6, -0.6), (10.6, -5.2, 1.2)):
        b = box(0.7, 0.24, 0.12, x, y, -0.15, 'boat', 0.05)
        b.rotation_euler = (0, 0, r)
        s = box(0.04, 0.3, 0.35, x, y, 0.08, 'sail', 0)
        s.rotation_euler = (0, 0, r)
    bpy.ops.object.select_all(action='DESELECT')
    sc.render.filepath = OUT
    bpy.ops.render.render(write_still=True)
    print('ILHA_MAPA_OK', OUT)


main()
