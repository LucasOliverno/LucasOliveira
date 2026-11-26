import bpy, math, os, json, random
from mathutils import Vector
from math import sin,cos,pi
random.seed(8)
ROOT=os.path.dirname(os.path.abspath(__file__)); ASSETS=os.path.join(ROOT,'assets'); RENDERS=os.path.join(ROOT,'renders'); os.makedirs(ASSETS,exist_ok=True); os.makedirs(RENDERS,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name,color,metal=0,alpha=1):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,alpha); m.use_nodes=True; p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,alpha); p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=.72; p.inputs['Alpha'].default_value=alpha
 if alpha<1: m.surface_render_method='DITHERED'
 return m
wood=mat('Madeira',(.30,.13,.055)); iron=mat('Ferro',(.16,.18,.18),.6); gold=mat('Ouro',(.82,.48,.045),.72); rock=mat('Pedra',(.34,.33,.29)); teal=mat('Quartzo',(.15,.62,.55)); dark=mat('Breu',(.035,.03,.025)); red=mat('Brasa',(.78,.12,.035)); water=mat('Água',(.04,.23,.4),0,.53); cream=mat('Lona',(.77,.69,.5)); silver=mat('Prata',(.65,.70,.69),.75); pink=mat('Quartzo rosa',(.9,.44,.49)); skin=mat('Pele',(.59,.32,.16)); gas=mat('Grisu',(.6,.68,.15),0,.55); white=mat('Neutro',(.77,.77,.72)); brown=mat('Couro',(.31,.16,.07)); blue=mat('Azul',(.08,.27,.54)); green=mat('Verde',(.1,.36,.12)); yellow=mat('Amarelo',(.9,.60,.04)); urucum=mat('Urucum',(.72,.17,.10));
parts=[]
def add(o,m): o.data.materials.append(m); parts.append(o); return o
def cube(loc,dim,m,rot=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.dimensions=dim; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if rot:o.rotation_euler=rot
 return add(o,m)
def cyl(loc,r,depth,m,verts=12,rot=None):
 bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=r,depth=depth,location=loc); o=bpy.context.object
 if rot:o.rotation_euler=rot
 return add(o,m)
def cone(loc,r1,r2,depth,m,verts=10):
 bpy.ops.mesh.primitive_cone_add(vertices=verts,radius1=r1,radius2=r2,depth=depth,location=loc); return add(bpy.context.object,m)
def ico(loc,r,m,scale=(1,1,1),sub=1):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=r,location=loc); o=bpy.context.object; o.scale=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); return add(o,m)
def torus(loc,major,minor,m,rot=None):
 bpy.ops.mesh.primitive_torus_add(major_segments=12,minor_segments=4,location=loc,major_radius=major,minor_radius=minor); o=bpy.context.object
 if rot:o.rotation_euler=rot
 return add(o,m)
def beam(a,b,width,m):
 mid=(Vector(a)+Vector(b))/2; v=Vector(b)-Vector(a); o=cube(mid,(width,width,v.length),m); o.rotation_euler=v.to_track_quat('Z','Y').to_euler(); return o
def ringpath(radius,z,minor,m,start=0,end=2*pi,steps=18,center=(0,0)):
 for i in range(steps):
  a=start+(end-start)*i/steps;b=start+(end-start)*(i+1)/steps
  beam((center[0]+radius*cos(a),center[1]+radius*sin(a),z),(center[0]+radius*cos(b),center[1]+radius*sin(b),z),minor,m)
def done(name,dim=None):
 global parts
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0]
 if len(parts)>1:bpy.ops.object.join()
 o=bpy.context.object;o.name=name
 # Fix dimension and pivot to centered bottom; each asset's bounding box spans requested dimensions.
 bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
 if dim:
  o.dimensions=dim; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 corners=[o.matrix_world @ Vector(c) for c in o.bound_box]; cx=(min(v.x for v in corners)+max(v.x for v in corners))/2;cy=(min(v.y for v in corners)+max(v.y for v in corners))/2;z=min(v.z for v in corners)
 bpy.context.scene.cursor.location=(cx,cy,z);bpy.ops.object.origin_set(type='ORIGIN_CURSOR');o.location=(0,0,0)
 models.append(o);parts=[]; return o
def lantern(m=gold):
 cyl((0,0,.15),.5,.3,m); cyl((0,0,1.35),.48,.2,m); cone((0,0,1.53),.45,.22,.2,m); ico((0,0,.8),.38,water,(1,1,1.35),2); cone((0,0,.75),.2,0,.55,yellow)
 for x in [-.4,.4]:beam((x,0,.2),(x*.85,0,1.35),.07,m)
 torus((0,0,1.65),.28,.04,m,(pi/2,0,0))
def miner(color=white):
 cyl((0,0,.15),1,.3,color); cube((0,0,1.5),(1.1,.65,1.3),white); ico((0,0,2.6),.52,skin,sub=2); cone((0,0,3.05),.72,.48,.42,color); cyl((0,-.48,3.06),.18,.12,yellow,12,(pi/2,0,0)); cube((0,.52,1.6),(.85,.4,1),brown); cube((0,-.37,2.02),(1.15,.18,.17),color)
 for x in [-.34,.34]:cube((x,0,.63),(.35,.46,.65),brown)
 beam((.55,-.05,1.2),(.9,-.05,2.15),.22,white);beam((-.55,0,1.2),(-.8,0,2),.22,white);beam((.6,.15,1.4),(1.35,.15,3),.12,wood);beam((.95,.15,2.9),(1.65,.15,3.15),.13,iron)
def cage():
 cube((0,0,.15),(2.8,2.8,.3),wood);cube((0,0,3.8),(2.8,2.8,.2),iron)
 for x in [-1.2,1.2]:
  for y in [-1.2,1.2]:cube((x,y,2),(.12,.12,3.7),iron)
 for x in [-.6,0,.6]: cube((x,-1.2,2),(.08,.08,3.4),iron)
def bowl():
 # open bowl built as sloping ring segments with floor
 cyl((0,0,.16),3,.32,wood,24)
 for i in range(24):
  a=2*pi*i/24; b=2*pi*(i+1)/24
  beam((3.65*cos(a),3.65*sin(a),1.2),(3.65*cos(b),3.65*sin(b),1.2),.75,wood)
 torus((0,0,1.5),4,.12,iron)
def serpent():
 cyl((0,0,.25),5,.5,rock,20)
 for i in range(44):
  a=i*.38; radius=4.05-i*.055; z=.9+i*.045; ico((radius*cos(a),radius*sin(a),z),.72,gold,(1,1,.8))
 for i in range(7):ico((1.25,0,2+i*.6),.7,gold,(1,1,1))
 ico((1.3,-.2,6),.85,gold,(1.2,1,.7));ico((1.1,-.85,6.05),.14,red);ico((1.6,-.85,6.05),.14,red)
 for i in range(7):cone((2.2+i*.35,.35,1.8),.25,0,.9,red,5)
def cart():
 cube((0,0,.9),(2.6,1.7,1.1),wood);cube((0,-.88,.9),(2.6,.1,.12),iron);cube((0,.88,.9),(2.6,.1,.12),iron)
 for x in [-.8,.8]:
  for y in [-.95,.95]:cyl((x,y,.35),.35,.18,iron,12,(pi/2,0,0))
 for x,y,z in [(-.6,0,1.6),(.3,.1,1.6),(.8,-.2,1.6)]:ico((x,y,z),.45,rock)
 ico((0,0,1.8),.22,gold)
def house():
 cube((0,0,.25),(7,5,.5),rock);cube((0,0,2.3),(6,4,4),wood);cube((0,-2.05,1.7),(2.2,.12,3),dark)
 for x in [-1.2,1.2]:cube((x,-2.2,1.8),(.3,.3,3.3),wood)
 beam((-3.5,-2.6,4.1),(0,-2.6,5.8),.35,wood);beam((0,-2.6,5.8),(3.5,-2.6,4.1),.35,wood)
 for x in [-2.8,-1.9,-1,0,1,1.9,2.8]:cube((x,0,4.35),(.65,5,.22),brown, (0,0,0))
def reliq_bateia():bowl()
def shaft():
 for x in [-1,1]:
  for y in [-1,1]:beam((x,y,0),(x*.65,y*.65,5),.3,wood)
 for z in [1,3,5]:
  beam((-1,-1,z),(1,-1,z),.23,wood);beam((-1,1,z),(1,1,z),.23,wood)
 torus((0,0,5),.8,.12,iron,(pi/2,0,0));cage()
models=[]
# Board and scenery
def image_top(o,name,filename):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;p=n.get('Principled BSDF');t=n.new('ShaderNodeTexImage');t.image=bpy.data.images.load(os.path.join(ROOT,'..','imagens',filename),check_existing=True);t.image.pack();m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color']);p.inputs['Roughness'].default_value=.8
 o.data.materials.append(m)
 for face in o.data.polygons:
  if face.normal.z>.9:face.material_index=len(o.data.materials)-1
cube((0,0,.75),(80,50,1.5),wood);board=cube((0,0,1.6),(77,47,1.7),rock);image_top(board,'Arte do tabuleiro','tabuleiro_corte_conceito.png')
for y in [-17,-9,0,9,17]:
 cube((0,y,2.5),(75,1,.25),brown)
 for x in range(-32,33,8):cube((x,y,2.7),(.4,2,.35),wood)
done('board_corte',(80,50,3))
house();done('board_boca_mina',(8,6,7))
shaft();done('board_elevador',(5,5,14))
cage();done('board_elevador_gaiola',(3,3,4))
cube((0,0,1),(5,2,2),wood);cube((0,0,3.6),(6,3,.2),cream)
for x in [-2.5,2.5]:beam((x,-1,0),(x,-1,3.6),.2,wood)
for x in [-1.3,0,1.3]:cyl((x,-1.1,2.8),.3,.4,gold)
done('board_mascate',(6,4,5))
house();cyl((3,-1,.9),.35,.7,iron);done('board_barracao',(7,5,5))
for x in [-.62,.62]:cube((x,0,3),(.18,.4,6),wood)
for z in [.5,1.4,2.3,3.2,4.1,5]:cube((0,0,z),(1.3,.24,.16),wood)
done('board_escada',(1.5,.5,6))
for x in [-4,-2,0,2,4]:cube((x,0,.12),(.4,2,.24),wood)
for y in [-.55,.55]:cube((0,y,.32),(10,.14,.15),iron)
done('board_trilho',(10,2,.5))
for radius in [2,3]:ringpath(radius,.3,.15,iron,0,pi/4,10)
for a in [0,.2,.4,.6,.785]:beam((1.5*cos(a),1.5*sin(a),.12),(3.5*cos(a),3.5*sin(a),.12),.22,wood)
done('board_trilho_curva',(6,6,.5))
cart();done('board_carrinho',(3,2,2))
cyl((0,0,.12),1.4,.24,dark);torus((0,0,.3),1.3,.22,wood);ringpath(1.0,.32,.13,cream,0,pi,8);done('board_poco',(3,3,1))
ico((0,0,.6),1.3,rock,(1,1,.5))
for x,y,z in [(-.6,0,1),(.4,0,1.15),(0,.5,1)]:cone((x,y,z+.5),.35,0,1.2,teal,6)
done('board_geodo',(3,3,2.5))
cyl((0,0,.3),1,.6,rock);torus((0,0,1),.8,.15,wood)
for x in [-.6,.6]:cube((x,0,2),(.18,.18,3),wood)
done('board_respiro',(2.5,2.5,4))
for d,z in [(2.5,.3),(1.8,.75),(2.1,1.05)]:cube((0,0,z),(d,d,.35),rock)
done('board_altar',(2.5,2.5,1.2))
cyl((0,0,.3),5,.6,rock,20)
for i in range(18):a=2*pi*i/18;ico((4*cos(a),4*sin(a),.8),.8,rock);ico((3.3*cos(a),3.3*sin(a),.8),.25,gold)
done('board_ninho',(14,10,4))
cube((0,0,.1),(80,50,.2),water);done('board_agua',(80,50,.2))
# Players
miner();done('peao_garimpeiro',(2,2,4))
for n,c in [('urucum',urucum),('anil',blue),('mata',green),('ipe',yellow)]:miner(c);done('peao_garimpeiro_'+n,(2,2,4))
cube((0,0,.4),(.8,.8,.8),wood);done('cubo_jogador',(.8,.8,.8))
ico((0,0,.4),.5,dark);done('cubo_pedra',(.8,.8,.8))
cube((0,0,.2),(24,8,.4),wood)
for x in range(-9,10,2):cyl((x,2.4,.42),.45,.08,dark,6)
done('tabuleiro_pessoal',(24,8,.4))
serpent();done('chefe_mae_do_ouro',(12,10,9))
bowl();done('bateia',(10,10,3))
cube((0,0,.25),(18,3,.5),rock)
for x in [-7.5,-4.5,-1.5,1.5,4.5,7.5]:cyl((x,0,.52),.6,.08,red)
done('furia_trilha',(18,3,.5))
cyl((0,0,.1),.6,.2,dark);cone((0,0,.8),.45,0,1.4,red,7);cone((.1,0,.6),.22,0,.8,yellow,6);done('furia_marcador',(1.2,1.2,1.5))
cyl((0,0,.1),.6,.2,rock);ico((0,0,.8),.6,blue,(1,1,1.1));cone((0,0,1.25),.4,0,.5,blue);done('agua_marcador',(1.5,1.5,1.5))
for x,y,z,r in [(-.8,0,.5,.8),(.6,0,.4,.7),(0,.1,.9,.65)]:ico((x,y,z),r,rock)
beam((-1.2,-.6,.5),(1.1,.6,1.1),.22,wood);done('desabamento',(3,2,2))
cyl((0,0,.1),1,.2,rock)
for x,y,z,r in [(0,0,.8,.8),(.6,0,1,.6),(-.6,.1,1,.6),(0,0,1.5,.55)]:ico((x,y,z),r,gas,sub=2)
done('grisu',(2.5,2.5,2.5))
ico((0,0,.3),.5,gold);done('pepita',(1,1,.6))
cone((0,0,.9),.5,0,1.8,teal,6);done('cristal',(1,1,1.8))
for x,z,r in [(-.3,.25,.25),(.3,.45,.3),(0,.8,.2)]:ico((x,0,z),r,water,sub=1)
done('folego',(1,1,1))
bowl();done('reliquia_bateia',(2,2,.8))
lantern(silver);done('reliquia_lampiao',(1.5,1.5,2.5))
cone((0,0,.9),.75,.4,1.2,gold,12);torus((0,0,.3),.7,.08,gold);ico((0,0,.15),.16,dark);torus((0,0,1.6),.18,.06,iron,(pi/2,0,0));done('reliquia_sino',(1.5,1.5,2))
torus((0,0,.3),.75,.12,gold)
for i in range(7):a=2*pi*i/7;cone((.7*cos(a),.7*sin(a),.8),.22,0,1.1,pink,5)
done('reliquia_coroa',(2,2,1.5))
ringpath(.75,0,.22,gold,pi*.15,pi*1.85,18)
from mathutils import Matrix
for ob in parts: ob.matrix_world=Matrix.Rotation(pi/2,4,'X') @ ob.matrix_world
done('reliquia_ferradura',(2,.5,2))
cone((0,0,.8),.8,.4,1.5,gold,6);cone((0,0,1.7),.4,0,.5,yellow,6);torus((0,0,.2),.7,.12,gold);done('reliquia_topazio',(1.8,1.8,2))
ico((0,0,1),1,gold,(.8,.2,1.3));cone((0,0,2),.5,0,1,red,6);done('reliquia_escama',(2.5,.6,2.5))
cone((0,0,.55),.9,.55,.9,iron);cyl((0,0,.1),1,.2,iron);cyl((0,-.75,.6),.25,.15,yellow,12,(pi/2,0,0));done('mascate_capacete',(2,2,1.5))
for r in [.55,.7,.85]:torus((0,0,.35),r,.1,cream)
torus((.8,0,.5),.25,.07,iron,(pi/2,0,0));done('mascate_corda',(2,2,1))
cube((0,0,1),(1.5,.8,1.8),cream);cube((0,-.46,.8),(1,.15,.65),brown);cube((0,-.4,1.5),(1.55,.15,.4),brown);done('mascate_mochila',(2,1.5,2))
cyl((0,0,.9),.55,1.5,iron);cyl((0,0,1.75),.2,.3,gold);torus((0,0,.9),.56,.08,brown);done('mascate_cantil',(1.2,1.2,2))
# DLC character miniatures
cyl((0,0,.25),4,.5,rock,16);ico((0,0,2.4),2,brown,(1.3,.75,.7),2)
for x in [-1.8,1.8]:
 for y in [-.8,.8]:beam((x,y,.4),(x,y,2),.65,brown)
for x in [-1.5,0,1.5]:
 ico((x,-1.25,3.35),.8,brown,(1,1,.85),2);ico((x,-1.95,3.1),.45,dark,(1,.8,.6));ico((x-.28,-1.92,3.6),.1,red);ico((x+.28,-1.92,3.6),.1,red)
beam((0,1,2.5),(0,2.7,3.5),.25,brown);done('chefe_cerbero',(10,8,8))
cyl((0,0,.3),.75,.6,gold);ico((0,0,.62),.45,brown,(1,1,.25));ico((0,0,-.05),.45,brown,(1,1,.25));done('cerbero_cabeca',(1.5,1.5,.6))
serpent();cube((0,0,6),(1.5,.8,2),cream);ico((0,0,7.5),.7,skin,sub=2)
for i in range(7):a=pi*i/6;beam((.5*cos(a),.3,7.6),(.9*cos(a),.4,8.5+.2*sin(a)),.16,teal)
done('chefe_medusa',(8,8,10))
torus((0,0,.3),.7,.17,gold)
for i in range(3):a=2*pi*i/3;torus((.8*cos(a),.8*sin(a),.35),.18,.05,iron,(pi/2,0,a))
done('reliquia_coleira',(2,2,1))
for i in range(6):cube(((i-2.5)*.3,0,1),(.31,.12,2),rock,(0,.1*sin(i),0))
done('reliquia_veu',(2,.6,2.5))
miner(rock)
for o in parts:o.data.materials.clear();o.data.materials.append(rock)
done('estatua_garimpeiro',(2,2,4))
cube((0,0,.015),(6.3,8.8,.03),cream);done('carta',(6.3,8.8,.03))
for i in range(5):cube((.04*(i%2),0,.2+i*.4),(6.3,8.8,.38),cream if i<4 else dark)
done('pilha_cartas',(6.3,8.8,2))
lantern();done('lampiao_mesa',(6,6,14))
cube((0,0,3.5),(30,30,7),wood);lid=cube((0,0,7),(29,29,.1),dark);image_top(lid,'Capa','capa.png');done('caixa_jogo',(30,30,7))
# Export each GLB at origin and preserve exact centimeter unit convention as numeric coordinates.
scene=bpy.context.scene;scene.unit_settings.system='NONE'
report=[]
for o in models:
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.export_scene.gltf(filepath=os.path.join(ASSETS,o.name+'.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True)
 tris=sum(len(p.vertices)-2 for p in o.data.polygons);report.append({'id':o.name,'dimensoes_cm':[round(v,3) for v in o.dimensions],'triangulos':tris})
# Put objects apart in editable project, with individual files at their natural origins.
for i,o in enumerate(models):o.location=((i%8)*18,(i//8)*18,0)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'garimpo_modelos_v2.blend'))
with open(os.path.join(ROOT,'relatorio_v2.json'),'w',encoding='utf8') as f:json.dump(report,f,indent=2,ensure_ascii=False)
print('EXPORTADOS',len(models))
