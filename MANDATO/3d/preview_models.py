"""Render a representative model lineup with the actual game geometry."""
import os, sys, importlib.util, math
import bpy
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('kit', os.path.join(HERE, 'build_sprites.py'))
kit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(kit)
sc, camera = kit.setup()
sc.render.resolution_x = 1500
sc.render.resolution_y = 1000
sc.render.image_settings.file_format = 'PNG'
sc.render.film_transparent = False
sc.view_settings.view_transform = 'AgX'
sc.view_settings.exposure = 0.5
camera.data.shift_y = 0
camera.data.ortho_scale = 10.8
camera.location = (10, -15, 13)
target = Vector((0, 0, 0.6))
camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
kit.box(200, 200, 0.1, 0, 0, -0.5, 'cream', 0)
for name, x, y in [('PREF',-2.6,1.6),('E2-01',0,1.6),('E1-03',2.6,1.6),('HOME',-2.6,-1.5),('E1-02',0,-1.5),('E1-01',2.6,-1.5)]:
    before = set(sc.objects)
    kit.GROUNDS['g-plain-grass']()
    kit.BUILDINGS[name]()
    for o in set(sc.objects)-before:
        o.location.x += x
        o.location.y += y
sc.render.filepath = os.path.join(HERE, 'renders', 'modelos_melhorados.png')
bpy.ops.render.render(write_still=True)
print('PREVIEW_OK')
