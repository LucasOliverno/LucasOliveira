import bpy, math, os
from mathutils import Vector
OUT=os.path.dirname(os.path.abspath(__file__))
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(n,c,metal=0):
 m=bpy.data.materials.new(n); m.diffuse_color=(*c,1); m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*c,1); p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=.75
 return m
wood=mat('Madeira',(.27,.11,.045)); iron=mat('Ferro',(.16,.17,.16),.6); gold=mat('Ouro',(.8,.47,.04),.7); rock=mat('Pedra',(.27,.27,.24)); teal=mat('Cristal',(.13,.55,.48)); dark=mat('Breu',(.035,.03,.025))
def cube(loc,scale,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.dimensions=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(m); return o
def cyl(loc,r,depth,m,verts=12):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=loc); o=bpy.context.object; o.data.materials.append(m); return o
def ico(loc,r,m,scale=(1,1,1)):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=r,location=loc); o=bpy.context.object; o.scale=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(m); return o
def finish(name,parts):
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts: o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0]; bpy.ops.object.join(); o=bpy.context.object; o.name=name
 bpy.context.scene.cursor.location=(0,0,0); bpy.ops.object.origin_set(type='ORIGIN_CURSOR'); return o
# Dimensions are centimetres in Blender, exported in metres by scale factor.
models=[]
models.append(finish('cubo_jogador',[cube((0,0,.4),(.8,.8,.8),wood)]))
models.append(finish('cubo_pedra',[ico((0,0,.4),.55,dark,(1,1,.8))]))
models.append(finish('pepita',[ico((0,0,.3),.6,gold,(1,.8,.55))]))
bpy.ops.mesh.primitive_cone_add(vertices=6,radius1=.48,radius2=0,depth=1.8,location=(0,0,.9)); o=bpy.context.object; o.data.materials.append(teal); models.append(finish('cristal',[o]))
p=[cube((-.62,0,3),(.18,.4,6),wood),cube((.62,0,3),(.18,.4,6),wood)]
for z in (.6,1.5,2.4,3.3,4.2,5.1): p.append(cube((0,0,z),(1.25,.25,.16),wood))
models.append(finish('board_escada',p))
p=[]
for x in [-4,-2,0,2,4]: p.append(cube((x,0,.12),(.45,2,.24),wood))
for y in [-.55,.55]: p.append(cube((0,y,.3),(10,.14,.15),iron))
models.append(finish('board_trilho',p))
p=[cube((0,0,.25),(2.5,2.5,.5),rock),cube((0,0,.65),(1.8,1.8,.3),rock),cube((0,0,.95),(2.1,2.1,.3),rock)]
models.append(finish('board_altar',p))
# Layout makes each object inspectable in the blend; engine can use named meshes.
for i,o in enumerate(models): o.location=((i%4)*14,(i//4)*12,0)
bpy.context.scene.unit_settings.system='METRIC'; bpy.context.scene.unit_settings.scale_length=.01
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'garimpo_modelos.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'garimpo.glb'),export_format='GLB',export_yup=True,export_apply=True)
print('MODELS',[(o.name,len(o.data.polygons)) for o in models])
