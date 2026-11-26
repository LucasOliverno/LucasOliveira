import bpy, math, os, json, random
from mathutils import Vector
from math import sin,cos,pi
random.seed(8)
ROOT=os.path.dirname(os.path.abspath(__file__)); ASSETS=os.path.join(ROOT,'assets_v3'); RENDERS=os.path.join(ROOT,'renders_v3'); os.makedirs(ASSETS,exist_ok=True); os.makedirs(RENDERS,exist_ok=True)
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
 for a in [0,pi/2,pi,3*pi/2]:
  x=.38*cos(a);y=.38*sin(a);beam((x,y,.3),(x*.85,y*.85,1.28),.05,m)
 torus((0,0,.29),.42,.045,m);torus((0,0,1.27),.39,.045,m)
def miner(color=white):
 # Readable painted miniature: body, facial features, equipment and layered base.
 cyl((0,0,.14),1,.28,dark,16);cyl((0,0,.29),.92,.12,color,16)
 for x in [-.36,.36]:
  cube((x,0,.67),(.42,.5,.65),brown);ico((x,-.14,.42),.29,dark,(1,1,.55))
 cone((0,0,1.53),.69,.53,1.17,white,8)
 cube((0,.07,1.15),(1.25,.74,.17),brown);cube((0,-.38,1.15),(.26,.06,.22),gold)
 ico((0,-.05,2.43),.55,skin,(.9,.92,1.04),2)
 # face looks toward negative Y
 for x in [-.19,.19]:ico((x,-.533,2.51),.048,dark,sub=2)
 ico((0,-.57,2.36),.09,skin,(1,.6,.8));beam((-.12,-.55,2.22),(.12,-.55,2.22),.035,brown)
 # helmet, brim, rivets and lamp
 cyl((0,0,2.91),.67,.12,color,16);cone((0,0,3.12),.58,.35,.34,color,12)
 cyl((0,-.59,3),.19,.14,iron,12,(pi/2,0,0));cyl((0,-.68,3),.13,.04,yellow,12,(pi/2,0,0))
 cube((0,.54,1.55),(.86,.42,1.07),brown);cube((0,.79,1.53),(.65,.08,.62),cream)
 for x in [-.3,.3]:beam((x,.32,2.03),(x,-.37,1.27),.07,brown)
 cube((0,-.42,1.99),(1.04,.1,.17),color);cone((.25,-.48,1.83),.16,0,.25,color,5)
 for x in [-1,1]:
  beam((x*.53,0,1.82),(x*.8,-.07,1.26),.25,white);ico((x*.8,-.07,1.24),.16,skin)
 beam((.64,.08,1.18),(1.2,.08,2.95),.105,wood)
 # slightly curved pickaxe head, across handle
 beam((.84,.08,2.88),(1.14,.08,3.12),.13,iron);beam((1.14,.08,3.12),(1.54,.08,2.96),.13,iron)

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
def tube(points,radii,m,sides=10):
 verts=[];faces=[]
 for i,p in enumerate(points):
  p=Vector(p);t=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)]);t.normalize();u=t.cross(Vector((0,0,1)))
  if u.length<.001:u=t.cross(Vector((0,1,0)))
  u.normalize();v=t.cross(u).normalized()
  for j in range(sides):
   a=2*pi*j/sides;verts.append(p+radii[i]*(u*cos(a)+v*sin(a)))
 for i in range(len(points)-1):
  for j in range(sides):a=i*sides+j;b=i*sides+(j+1)%sides;faces.append((a,b,b+sides,a+sides))
 faces.extend([tuple(reversed(tuple(range(sides)))),tuple((len(points)-1)*sides+j for j in range(sides))])
 mesh=bpy.data.meshes.new('Escultura');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('corpo',mesh);bpy.context.collection.objects.link(o);add(o,m)
def serpent():
 cyl((0,0,.22),5,.44,rock,24)
 for i in range(14):
  a=2*pi*i/14;ico((4.3*cos(a),4.3*sin(a),.45),.45,rock,(1.4,1,.6))
 points=[];radii=[]
 for i in range(73):
  a=-.7+i*2*pi*2.05/72;r=3.65-i*.035;points.append((r*cos(a),r*sin(a),.95+i*.013));radii.append(.25+.52*i/72)
 end=Vector(points[-1]);
 for i in range(1,13):points.append((end.x+.10*i,end.y-.04*i,1.88+i*.35));radii.append(.75-.019*i)
 tube(points,radii,gold,10)
 head=Vector(points[-1]);ico(head,.76,gold,(1.18,.95,.68),2);ico((head.x,head.y-.55,head.z-.1),.45,gold,(1,.85,.55),2)
 for x in [-.34,.34]:
  ico((head.x+x,head.y-.53,head.z+.22),.13,red,sub=2);ico((head.x+x,head.y-.64,head.z+.22),.06,dark,sub=2)
 for i in range(7):
  a=.5+i*.8;r=3.35-i*.16;cone((r*cos(a),r*sin(a),1.9),.22,0,.7,red,5)
 for i in range(11):
  a=2*pi*i/11;ico((3.95*cos(a),3.95*sin(a),.48),.17,gold)

def cart():
 cube((0,0,.9),(2.6,1.7,1.1),wood);cube((0,-.88,.9),(2.6,.1,.12),iron);cube((0,.88,.9),(2.6,.1,.12),iron)
 for x in [-.8,.8]:
  for y in [-.95,.95]:cyl((x,y,.35),.35,.18,iron,12,(pi/2,0,0))
 for x in [-1.2,1.2]: cube((x,-.9,.9),(.16,.1,1.1),iron)
 for x,y,z in [(-.6,0,1.6),(.3,.1,1.6),(.8,-.2,1.6)]:ico((x,y,z),.45,rock)
 ico((0,0,1.8),.22,gold)
def house():
 cube((0,0,.22),(7.4,5.5,.44),rock)
 # individual timber planks and corner uprights
 cube((0,.25,2.2),(6.3,4,3.7),wood)
 for x in [-2.8,-2,-1.2,-.4,.4,1.2,2,2.8]:cube((x,-1.83,2.2),(.06,.08,3.5),brown)
 for x in [-3.05,3.05]:cube((x,-2,2.25),(.38,.38,4.05),brown)
 cube((0,-1.89,1.65),(2.2,.1,3.1),dark)
 for x in [-1.25,1.25]:cube((x,-2.05,1.75),(.28,.3,3.4),brown)
 cube((0,-2.03,3.42),(2.8,.3,.3),brown)
 # pitched roof: long planks on both sides, with ridge beam
 for side in [-1,1]:
  for y in [-2,-1.2,-.4,.4,1.2,2]:
   a=(0,y,5.25);b=(side*3.65,y,3.9);beam(a,b,.53,brown)
 beam((0,-2.7,5.32),(0,2.7,5.32),.3,wood)
 # entrance lamp and warm center
 cyl((2,-2.1,2.6),.16,.35,gold,10);ico((2,-2.3,2.65),.11,yellow,sub=2)

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
for x in [-1.8,-.9,0,.9,1.8]: cube((x,0,3.73),(.42,3,.07),brown)
for x in [-1.5,-.5,.5,1.5]:
 cyl((x,-1.1,1.4),.14,.3,gold,8);ico((x,-1.1,1.62),.12,yellow)
done('board_mascate',(6,4,5))
house();cyl((3,-1,.9),.35,.7,iron);cyl((3,-1,1.32),.24,.15,iron)
beam((1.5,-2.6,.8),(3.2,-2.6,.8),.28,wood)
for x in [1.6,3.1]:beam((x,-2.6,.2),(x,-2.6,.78),.18,wood)
beam((2.2,1.2,4.1),(2.2,1.2,5.8),.35,iron)
done('board_barracao',(7,5,5))
for x in [-.62,.62]:cube((x,0,3),(.18,.4,6),wood)
for z in [.5,1.4,2.3,3.2,4.1,5]:
 cube((0,0,z),(1.3,.24,.16),wood)
 for x in [-.6,.6]:cube((x,-.205,z),(.23,.055,.12),cream)
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
cyl((0,0,.25),4,.5,rock,20)
for a in range(10):
 ang=2*pi*a/10;ico((3.4*cos(ang),3.4*sin(ang),.45),.4,rock,(1,1,.5))
ico((0,.15,2.15),1.85,brown,(1.25,.77,.74),2)
for x in [-1.45,1.45]:
 for y in [-.9,.9]:
  beam((x,y,.55),(x*.9,y,2),.48,brown);ico((x,y,.48),.37,dark,(1,1,.5))
# Three distinctly posed, detailed heads, ears, muzzles and glowing eyes.
for i,x in enumerate([-1.4,0,1.4]):
 z=3.1+[.1,.4,0][i];ico((x,-1.15,z),.77,brown,(1,.9,.9),2)
 ico((x,-1.82,z-.25),.43,brown,(.85,1,.65),2);ico((x,-2.17,z-.23),.17,dark,(1,.6,.6),2)
 for dx in [-.3,.3]:
  cone((x+dx,-1.05,z+.65),.24,0,.65,brown,6)
  if i!=0: ico((x+dx*.65,-1.78,z+.18),.085,red,sub=2)
  else: beam((x-.37,-1.8,z+.16),(x+.37,-1.8,z+.16),.045,dark)
 torus((x,-.72,z-.35),.48,.1,gold,(pi/2,0,0))
beam((0,1.45,2.4),(.25,2.7,3.35),.23,brown)
for x,y in [(-2.2,1.8),(2,2.1),(.5,2.6)]:ico((x,y,.6),.22,gold)
done('chefe_cerbero',(10,8,8))
cyl((0,0,.3),.75,.6,gold);ico((0,0,.62),.45,brown,(1,1,.25));ico((0,0,-.05),.45,brown,(1,1,.25));done('cerbero_cabeca',(1.5,1.5,.6))
# Gorgon: coiled body, a mine timber and a sculpted upper figure.
cyl((0,0,.22),4,.44,rock,20)
pts=[];rs=[]
for i in range(68):
 a=i*2*pi*1.65/67;r=3-i*.026;pts.append((r*cos(a),r*sin(a),.8+i*.014));rs.append(.24+.4*i/67)
tube(pts,rs,teal,10)
beam((1.7,1.3,.5),(1.7,1.3,7.8),.43,wood);beam((.7,1.3,6.9),(2.7,1.3,6.9),.25,wood)
cone((0,0,3.65),.95,.7,2,cream,8);ico((0,-.05,5.23),.68,skin,(.85,.8,1),2)
for x in [-.22,.22]:ico((x,-.59,5.3),.09,teal,sub=2)
for x in [-1,1]:beam((x*.65,0,4.15),(x*1.2,-.05,3.35),.24,skin)
for i in range(8):
 a=2*pi*i/8;x=.48*cos(a);y=.35*sin(a);pts=[(x,y,5.55),(x*1.3,y*1.4,6.05),(x*1.8,y*1.8,6.4),(x*2,y*2,6.1)];tube(pts,[.13,.12,.09,.05],teal,6)
 for offset in [-.035,.035]:ico((x*2+offset,y*2-.03,6.1),.025,yellow)
cone((2,-1,.65),.55,.3,.7,rock,10);cyl((2,-1,.3),.65,.12,rock)
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
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'garimpo_modelos_v3.blend'))
with open(os.path.join(ROOT,'relatorio_v3.json'),'w',encoding='utf8') as f:json.dump(report,f,indent=2,ensure_ascii=False)
print('EXPORTADOS',len(models))
