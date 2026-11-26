import bpy, os, math, json
from math import pi,sin,cos
from mathutils import Vector
root=os.path.dirname(os.path.abspath(__file__));out=os.path.join(root,'assets_complementares');os.makedirs(out,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def material(n,c,metal=0):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=.5;return m
gold=material('Ouro',(.82,.49,.06),.75);silver=material('Prata',(.67,.72,.71),.75);green=material('Esmeralda',(.04,.42,.22),.2);stone=material('Pedra',(.38,.35,.3));brown=material('Casco',(.28,.12,.045));cream=material('Cera',(.9,.81,.59));red=material('Brasa',(.9,.19,.03))
parts=[];models=[]
def add(o,m):o.data.materials.append(m);parts.append(o);return o
def cube(pos,size,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return add(o,m)
def cyl(pos,r,depth,m,rot=None,verts=16):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=pos);o=bpy.context.object
 if rot:o.rotation_euler=rot
 return add(o,m)
def cone(pos,r1,r2,depth,m):
 bpy.ops.mesh.primitive_cone_add(vertices=12,radius1=r1,radius2=r2,depth=depth,location=pos);return add(bpy.context.object,m)
def ball(pos,r,m,scale=(1,1,1)):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=r,location=pos);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return add(o,m)
def torus(pos,r,t,m,rot=None):
 bpy.ops.mesh.primitive_torus_add(major_segments=20,minor_segments=6,location=pos,major_radius=r,minor_radius=t);o=bpy.context.object
 if rot:o.rotation_euler=rot
 return add(o,m)
def beam(a,b,w,m):
 mid=(Vector(a)+Vector(b))/2;v=Vector(b)-Vector(a);o=cube(mid,(w,w,v.length),m);o.rotation_euler=v.to_track_quat('Z','Y').to_euler()
def finish(n,dims):
 global parts
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.object;o.name=n;bpy.ops.object.transform_apply(location=False,rotation=True,scale=True);o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 corners=[o.matrix_world@Vector(c) for c in o.bound_box];bpy.context.scene.cursor.location=((min(c.x for c in corners)+max(c.x for c in corners))/2,(min(c.y for c in corners)+max(c.y for c in corners))/2,min(c.z for c in corners));bpy.ops.object.origin_set(type='ORIGIN_CURSOR');o.location=(0,0,0);parts=[];models.append(o)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.export_scene.gltf(filepath=os.path.join(out,n+'.glb'),export_format='GLB',use_selection=True,export_yup=True)
# coin: embossed symbol on one side
cyl((0,0,.2),1,.4,gold,verts=24);torus((0,0,.42),.82,.05,gold);ball((0,0,.45),.32,gold,(1,1,.2));finish('reliquia_moeda',(2,2,.5))
# comb with individual teeth
cube((0,0,1.6),(2,.35,.55),brown)
for x in [-.8,-.6,-.4,-.2,0,.2,.4,.6,.8]:cube((x,0,.65),(.1,.22,1.6),brown)
beam((-.9,-.21,1.7),(.9,-.21,1.7),.08,gold);finish('reliquia_pente',(2,.5,2))
# compass
cyl((0,0,.2),1,.4,gold,verts=24);cyl((0,0,.43),.82,.08,cream,verts=24);torus((0,0,.49),.83,.07,gold);beam((-.4,-.4,.54),(.45,.45,.54),.1,red);finish('reliquia_bussola',(2,2,.65))
# stone idol
cube((0,0,.3),(1.7,1.3,.6),stone);cube((0,0,1.2),(1.4,1,1.5),stone);cone((0,0,2.1),1,.2,.5,stone)
for x in [-.35,.35]:ball((x,-.55,1.55),.15,gold,(1,.3,.6))
ball((0,-.56,1),.22,gold,(1,.4,1));finish('reliquia_idolo',(2,1.6,2.5))
# necklace
for i in range(20):a=2*pi*i/20;ball((.8*cos(a),.8*sin(a),.2),.13,gold)
ball((0,-.9,.18),.23,gold,(1,.7,.8));finish('reliquia_colar',(2,2,.5))
# candelabrum
cyl((0,0,.12),.55,.24,silver);cyl((0,0,.9),.12,1.5,silver)
for x in [-.7,0,.7]:
 if x:beam((0,0,.85),(x,0,1.3),.14,silver)
 cyl((x,0,1.42),.2,.15,silver);cyl((x,0,1.75),.1,.6,cream);cone((x,0,2.12),.1,0,.25,red)
finish('reliquia_candelabro',(2,1,2.5))
# chalice
cyl((0,0,.1),.6,.2,gold);cyl((0,0,.65),.13,1.1,gold);cone((0,0,1.35),.25,.62,.8,green);torus((0,0,1.75),.6,.07,gold);finish('reliquia_calice',(1.8,1.8,2.2))
# mask
ball((0,0,1),1,gold,(.85,.25,1.15));
for x in [-.32,.32]:ball((x,-.24,1.25),.17,stone,(1,.4,.6))
beam((-.25,-.25,.6),(.25,-.25,.6),.07,stone);finish('reliquia_mascara',(2,.6,2.4))
for i,o in enumerate(models):o.location=((i%4)*4,(i//4)*4,0)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(root,'modelos_complementares.blend'))
print('EXPORTADOS',len(models))
