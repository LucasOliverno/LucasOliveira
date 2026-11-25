"""Art-directed revision. Outputs only to revisao_visual; never replaces live assets."""
import bpy, math, os, sys, importlib.util, json
from mathutils import Vector, Matrix
HERE=os.path.dirname(os.path.abspath(__file__))
spec=importlib.util.spec_from_file_location('kit', os.path.join(HERE,'baseline.py'))
k=importlib.util.module_from_spec(spec); spec.loader.exec_module(k)
OUT=os.path.join(HERE,'assets'); os.makedirs(OUT,exist_ok=True)
B=k.box; C=k.cyl; R=k.rod
originals={name:getattr(k,name) for name in ('tree','gable','block','slab','container','tank','car','bench')}

def mesh(name,vs,fs,key):
    me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.update()
    ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);k._fin(ob,key,0)
    return ob

def rail(x,y,z,w,key='steel'):
    B(w,.018,.022,x,y,z+.15,key,0)
    for i in range(5): B(.012,.018,.15,x-w/2+i*w/4,y,z,key,0)

def planter(x,y,z,w=.3):
    B(w,.13,.09,x,y,z,'brick',.012)
    for dx in (-.3,0,.3):k.ball(.065,x+w*dx,y,z+.13,'tree',1,sz=.7)

def balcony(x,y,z,w=.28):
    B(w,.19,.035,x,y,z,'stone',.005)
    rail(x,y-.09,z+.035,w,'teal')
    planter(x,y,z+.035,w*.5)

def hvac(x,y,z,s=.12):
    B(s,s*.8,s*.7,x,y,z,'stone',.008)
    for i in range(3):B(s*.7,.008,.008,x,y-s*.41,z+.02+i*s*.16,'steel',0)

def tree(x,y,s=1,z=0,key='tree'):
    C(.042*s,.42*s,x,y,z,'trunk',7,0)
    for dx,dy,dz,rr,col in [(-.14,0,.4,.18,key),(.12,.06,.43,.20,'forest'),(0,-.08,.59,.21,key),(.05,.1,.66,.15,'sage')]:
        R((x,y,z+.25*s),(x+dx*s,y+dy*s,z+dz*s),.025*s,'trunk',6)
        ob=k.ball(rr*s,x+dx*s,y+dy*s,z+dz*s,col,2,sz=.88)
        for p in ob.data.polygons:p.use_smooth=True

def bench(x,y):
    for dx in (-.09,.09):B(.018,.10,.1,x+dx,y,.025,'steel',0)
    for j in range(3):B(.27,.022,.02,x,y-.03+j*.03,.12,'wood',.003)
    for j in range(2):B(.27,.018,.028,x,y+.055,.17+j*.034,'wood',.003)

def gable(sx,sy,h,x,y,z,key,axis='x'):
    ob=originals['gable'](sx,sy,h,x,y,z,key,axis)
    # Tile courses, with stronger eaves; avoids the old bare triangular prism.
    for i in range(1,5):
        t=i/5
        for side in (-1,1):
            if axis=='x':R((x-sx/2,y+side*sy/2*(1-t),z+h*t+.012),(x+sx/2,y+side*sy/2*(1-t),z+h*t+.012),.008,key,5)
            else:R((x+side*sx/2*(1-t),y-sy/2,z+h*t+.012),(x+side*sx/2*(1-t),y+sy/2,z+h*t+.012),.008,key,5)
    return ob

def block(sx,sy,h,x,y,key,z=0,rows=None,cols=(3,3),roof='stone',wkey='glass',gap=.32,emit=0):
    originals['block'](sx,sy,h,x,y,key,z,rows,cols,roof,wkey,gap,emit)
    if h>.65:
        hvac(x+sx*.2,y+sy*.2,z+h+.06,min(sx,sy)*.22)
        B(.15,.035,.25,x,y-sy/2-.018,z+.02,'teal',.004)
        B(.23,.13,.03,x,y-sy/2-.05,z+.3,'stone',.005)
    if h>1 and key not in ('glass','navy','teal'):
        for zz in range(max(1,int((h-.35)/gap))):
            balcony(x+sx*.22,y-sy/2-.08,z+.15+zz*gap,min(.28,sx*.4))

def slab(top,side='earth'):
    B(1.96,1.96,.22,0,0,-.32,side,.025)
    B(1.96,1.96,.055,0,0,-.10,'sand' if side=='earth' else 'stone',.008)
    B(1.96,1.96,.045,0,0,-.045,top,.018)
    # Inlaid stones along exposed strata, not tall clutter in buildable lots.
    for i in range(4):
        B(.12,.014,.045,-.7+i*.43,-.982,-.23,'earth2' if side=='earth' else 'rock',.005)

def solar(x,y,z=0,w=.42,d=.28,tilt=.5):
    C(.014,.19,x,y,z,'steel',6,0)
    origin=Vector((x,y,z+.22));rot=Matrix.Rotation(tilt,4,'X')
    before=set(bpy.context.scene.objects)
    B(w,d,.018,0,0,0,'steel',.003)
    for i in range(4):
        for j in range(3):B(w/4-.009,d/3-.009,.006,-w/2+(i+.5)*w/4,-d/2+(j+.5)*d/3,.019,'panel',0,.3)
    for ob in set(bpy.context.scene.objects)-before:
        ob.location=origin+rot.to_3x3()@ob.location;ob.rotation_euler=(tilt,0,0)

def container(x,y,z,key,rot=0):
    before=set(bpy.context.scene.objects)
    B(.34,.15,.15,0,0,0,key,.006)
    for i in range(7):
        for yy in (-.078,.078):B(.008,.012,.125,-.145+i*.048,yy,.012,key,0)
    for yy in (-.04,.04):B(.012,.01,.12,.174,yy,.015,'steel',0)
    for ob in set(bpy.context.scene.objects)-before:
        ob.location=Vector((x,y,z))+Matrix.Rotation(rot,3,'Z')@ob.location;ob.rotation_euler.z+=rot

def tank(x,y,r,h,key='white'):
    originals['tank'](x,y,r,h,key)
    for zz in (h*.15,h*.8):k.torus(r+.005,.012,x,y,zz,'steel')
    for i in range(5):R((x-.07,y-r-.025,h*i/5),(x+.07,y-r-.025,h*i/5),.008,'steel')
    for xx in (x-.07,x+.07):R((xx,y-r-.025,0),(xx,y-r-.025,h),.009,'steel')

def awning(x,y,z,w,d=.32,color='teal'):
    for i in range(8):
        col=color if i%2==0 else 'cream';cx=x-w/2+(i+.5)*w/8
        B(w/8-.003,d,.025,cx,y,z,col,.004,rot=(.25,0,0))
        B(w/8-.003,.025,.075,cx,y-d/2,z-.065,col,.012)

def path(x,y,w=.24,d=.35):
    for j in range(3):B(w,d/3-.018,.025,x,y-d/2+(j+.5)*d/3,.015,'stone',.008)

def home():
    for dx in (-.39,.39):
        B(.75,.87,.95,dx,.12,0,'cream');B(.76,.88,.39,dx,.12,0,'sage')
        gable(.83,.97,.28,dx,.12,.95,'roof','y')
        for zz in (.22,.64):
            k.win_front(-.32,dx-.34,dx+.1,zz,1,2,w=.13,h=.17)
        B(.16,.035,.3,dx+.2,-.335,0,'wood',.005)
        gable(.25,.24,.07,dx+.2,-.40,.34,'roof','y');path(dx+.2,-.62,.2,.35)
    k.win_side(.77,-.2,.4,.23,2,2,gap=.4)
    tree(-.76,.62,.65);planter(-.62,-.64,.01,.25)
    for xx in (-.76,-.08):C(.012,.6,xx,-.55,0,'steel',6,0)
    R((-.76,-.55,.58),(-.08,-.55,.58),.006,'steel',4)
    for i,col in enumerate(('cream','blue','brick')):B(.10,.009,.14,-.66+i*.17,-.55,.42,col,0)

def pref():
    B(1.5,1.15,.10,0,.1,0,'stone')
    B(1.28,.92,.78,0,.15,.1,'cream')
    k.win_side(.64,-.15,.52,.35,1,3,w=.15,h=.28)
    k.win_front(-.315,-.6,.6,.35,1,5,w=.12,h=.26)
    B(.23,.055,.4,0,-.345,.11,'wood',.008)
    # A clean hip roof, with terracotta courses and a front-facing pediment.
    vs=[(-.76,-.43,.9),(.76,-.43,.9),(.76,.73,.9),(-.76,.73,.9),(-.32,.15,1.22),(.32,.15,1.22)]
    mesh('Prefeitura_hip_roof',vs,[(0,1,5,4),(1,2,5),(2,3,4,5),(3,0,4)],'roof')
    for j in range(1,5):
        t=j/5;xx=.76-.44*t;yy=.58*(1-t);zz=.9+.32*t+.008
        for sign in (-1,1):
            R((-xx,.15+sign*yy,zz),(xx,.15+sign*yy,zz),.008,'roof',5)
            R((sign*xx,.15-yy,zz),(sign*xx,.15+yy,zz),.008,'roof',5)
    for x in (-.4,-.14,.14,.4):
        C(.036,.62,x,-.47,.13,'cream',12,.006)
        B(.10,.10,.045,x,-.47,.13,'stone',.006);B(.10,.10,.045,x,-.47,.72,'cream',.006)
    B(1.02,.24,.07,0,-.47,.76,'cream',.008)
    mesh('Pediment',[(-.51,-.61,.83),(.51,-.61,.83),(0,-.61,1.03),(-.51,-.32,.83),(.51,-.32,.83),(0,-.32,1.03)],[(0,1,2),(5,4,3),(0,3,4,1),(1,4,5,2),(2,5,3,0)],'cream')
    for i in range(4):B(.85+i*.08,.12,.035,0,-.49-i*.105,.105-i*.026,'stone',.004)
    B(.32,.32,.45,0,.15,1.12,'cream',.008)
    k.hcyl(.11,.03,0,-.025,1.38,'stone',axis='y',verts=24)
    k.hcyl(.091,.035,0,-.032,1.38,'white',axis='y',verts=24)
    R((0,-.055,1.38),(0,-.055,1.44),.007,'navy');R((0,-.055,1.38),(.045,-.055,1.35),.007,'navy')
    k.cone(.27,.23,0,.15,1.57,'roof');k.flag(0,.15,1.8,.32)
    for x in (-.74,.74):planter(x,-.65,.015,.25);tree(x,-.43,.67)


def conjunto():
    k.pad(1.8,1.8,'stone')
    for x,y,h,col in ((-.46,.4,1.5,'sand'),(.43,.4,1.3,'mustard'),(-.43,-.38,1.05,'brick'),(.43,-.38,.88,'sage')):
        block(.64,.63,h,x,y,col,cols=(2,2))
    tree(.79,-.73,.5)

def market():
    k.pad(1.8,1.75,'stone');B(1.1,.95,.83,-.08,.18,0,'cream')
    B(1.18,1.03,.055,-.08,.18,.83,'stone',.008)
    for yy in (-.32,.68):B(1.18,.045,.09,-.08,yy,.88,'sand',.005)
    for xx in (-.65,.49):B(.045,1.0,.09,xx,.18,.88,'sand',.005)
    B(.9,.035,.42,-.08,-.31,.12,'glass',0,.3)
    for x in (-.48,-.08,.32):B(.024,.045,.43,x,-.33,.12,'wood',0)
    awning(-.08,-.48,.67,1.18,.37,'blue')
    k.win_side(.48,-.15,.55,.23,1,3,w=.17,h=.27)
    hvac(.12,.35,.89,.19)
    for i,col in enumerate(('brick','mustard','sage')):
        x=-.48+i*.34;B(.29,.23,.13,x,-.77,.03,'wood',.006)
        for j in range(3):
            for q in range(2):k.ball(.037,x-.08+j*.08,-.82+q*.09,.19,col,1)
    B(.18,.035,.26,.7,-.59,.03,'wood',.008,rot=(.12,0,0));B(.14,.014,.19,.7,-.615,.07,'navy',0)

def workshop():
    k.pad(1.8,1.8,'stone');B(1.24,1.08,.85,-.12,.15,0,'brick')
    B(1.34,1.18,.07,-.12,.15,.85,'rock',.008)
    for yy in (-.42,.72):B(1.34,.045,.12,-.12,yy,.92,'rock',.005)
    for xx in (-.77,.53):B(.045,1.18,.12,xx,.15,.92,'rock',.005)
    B(.55,.025,.55,-.22,-.397,.04,'navy',0);B(.63,.06,.075,-.22,-.43,.6,'steel',.005)
    k.win_side(.51,-.25,.6,.3,1,3,w=.14,h=.23)
    k.chimney(.23,.38,.92,.9,.1,'brick')
    for i in range(6):B(.16,.012,.018,-.62+(i%3)*.25,-.40,.66+(i//3)*.10,'copper',0)
    for j in range(3):k.hcyl(.028,1.0,.17,-.65+j*.08,.06,'steel')
    for xx in (-.7,-.48):C(.09,.25,xx,-.65,.01,'brick',12,.006)

def tower():
    k.pad(1.5,1.4,'stone');block(.88,.82,2.8,0,.1,'cream',z=.05,cols=(3,3),roof='teal')
    for j in range(7):
        z=.3+j*.34
        for x in (-.48,.48):
            B(.2,.35,.04,x,.16,z,'brick',.005);planter(x,.16,z+.04,.18)
    path(0,-.62,.35,.34);tree(-.64,-.61,.65)

def skyscraper():
    k.pad(1.75,1.65,'stone');B(1.5,1.3,.48,0,0,0,'cream')
    B(1.02,.96,3.1,-.1,.13,.48,'glassl',.012,.3)
    for j in range(11):
        zz=.5+j*.28
        B(1.05,.022,.023,-.1,-.36,zz,'teal',0);B(.022,.98,.023,.42,.13,zz,'teal',0)
    for xx in (-.6,-.35,-.1,.15,.4):B(.016,.022,3.1,xx,-.36,.5,'teal',0)
    for yy in (-.35,-.1,.15,.4,.6):B(.022,.016,3.1,.42,yy,.5,'teal',0)
    B(1.35,1.2,.075,-.1,.13,3.59,'cream',.012);B(1.2,1.05,.025,-.1,.13,3.665,'grass2',.005)
    for x in (-.52,.32):planter(x,-.3,3.7,.32);tree(x,.4,.42,z=3.7)
    B(.3,.28,.32,-.1,.3,3.7,'cream',.01)
    for x in (-.46,.13,.58):awning(x,-.72,.37,.38,.22,'brick');B(.3,.02,.25,x,-.66,.05,'glass',0)

def greenhouse():
    k.pad(1.8,1.8,'grass2')
    # Barrel-vaulted conservatory, matching the card silhouette.
    vs=[]; fs=[]; n=16
    for y in (-.45,.62):
        for i in range(n+1):
            a=math.pi*i/n;vs.append((.58*math.cos(a),y,.25+.72*math.sin(a)))
    for i in range(n):fs.append((i,i+1,n+2+i,n+1+i))
    mesh('Conservatory_glass',vs,fs,'glassl')
    for yy in (-.452,.622):
        end=[(-.58,yy,.25),(.58,yy,.25)]+[(.58*math.cos(math.pi*i/n),yy,.25+.72*math.sin(math.pi*i/n)) for i in range(1,n)]
        mesh('Conservatory_end',end,[tuple(range(len(end)))],'glassl')
        for xx in (-.36,-.18,0,.18,.36):
            zz=.25+.72*math.sqrt(1-(xx/.58)**2)
            R((xx,yy-.012,.25),(xx,yy-.012,zz),.012,'cream')
    for y in (-.45,-.18,.09,.36,.62):
        for i in range(n):
            a=math.pi*i/n;b=math.pi*(i+1)/n
            R((.59*math.cos(a),y,.25+.73*math.sin(a)),(.59*math.cos(b),y,.25+.73*math.sin(b)),.014,'cream')
    for i in range(1,8):
        a=math.pi*i/8;R((.59*math.cos(a),-.45,.25+.73*math.sin(a)),(.59*math.cos(a),.62,.25+.73*math.sin(a)),.012,'cream')
    B(1.18,.035,.25,0,-.46,0,'glassl',0);B(.25,.04,.42,0,-.485,0,'teal',.01)
    for x in (-.72,.72):tree(x,.55,.6);planter(x,-.52,0,.22)
    path(0,-.68,.3,.36)

def cooling(x,y,h,r):
    vs=[];fs=[];N=24;levels=12
    for j in range(levels+1):
        t=j/levels;rr=r*(.60+1.6*(t-.65)**2)
        for i in range(N):a=i*2*math.pi/N;vs.append((x+rr*math.cos(a),y+rr*math.sin(a),.08+t*h))
    for j in range(levels):
        for i in range(N):a=j*N+i;b=j*N+(i+1)%N;fs.append((a,b,b+N,a+N))
    ob=mesh('Cooling_tower',vs,fs,'cream')
    for p in ob.data.polygons:p.use_smooth=True
    k.torus(r*(.6+1.6*.35**2),.025,x,y,h+.08,'stone')
    C(r*.65,.02,x,y,h-.10,'rock',24,0)

def nuclear():
    k.pad(1.8,1.8,'stone');cooling(-.43,.36,1.5,.42);cooling(.44,.4,1.9,.4)
    C(.3,.3,0,-.35,.02,'cream',24,.01);k.dome(.3,0,-.35,.32,'cream')
    B(.48,.35,.35,-.56,-.55,.02,'white');k.win_front(-.73,-.76,-.36,.16,1,3,w=.07,h=.12)
    for x in (-.84,.84):
        for y in (-.82,-.4,0,.4,.82):C(.009,.18,x,y,.02,'steel',5,0)
        R((x,-.82,.2),(x,.82,.2),.008,'steel',5)

def memorial():
    for j in range(4):B(1.65-j*.18,1.65-j*.18,.08,0,0,j*.08,'stone',.008)
    # Five-point sculpted star, instead of an unrelated obelisk.
    vs=[(0,-.17,1.14),(0,.17,1.14)]
    for i in range(10):
        a=math.pi/2+i*math.pi/5;r=.78 if i%2==0 else .34
        vs.append((r*math.cos(a),0,1.14+r*math.sin(a)))
    fs=[]
    for i in range(10):fs.extend([(0,2+i,2+(i+1)%10),(1,2+(i+1)%10,2+i)])
    mesh('Memorial_star',vs,fs,'brick')
    for x in (-.66,.66):planter(x,-.68,.08,.22)

# Management and intelligence expansion; same primitives and palette as the approved kit.
def gi_base():
    B(1.76,1.76,.035,0,0,0,'stone',.008)

def gi_person(x,y,col='navy'):
    C(.035,.13,x,y,.035,col,8,0)
    k.ball(.038,x,y,.205,'sand',1)
    B(.045,.015,.06,x+.035,y-.025,.10,'cream',0)

def gi_steps(w,y,n=3):
    for j in range(n): B(w,.11,.025*(j+1),0,y+j*.10,.035,'cream',.003)

def gi_dish(x,y,z,r=.18):
    C(.025,.16,x,y,z,'steel',8,0)
    vs=[(x,y,z+.17)]; fs=[]
    for i in range(17):
        t=2*math.pi*i/16;vs.append((x+r*math.cos(t),y+r*math.sin(t),z+.17+.10))
    for i in range(16):fs.append((0,i+1,i+2))
    mesh('Satellite_bowl',vs,fs,'cream')
    R((x,y,z+.17),(x+.045,y-.045,z+.37),.012,'steel',6)
    k.ball(.025,x+.045,y-.045,z+.37,'gold',1)

def gi_arch(x,y,z,w=.24,h=.38):
    vs=[(x-w/2,y,z),(x+w/2,y,z)]
    vs += [(x+w/2*math.cos(t*math.pi/10),y,z+h-w/2+w/2*math.sin(t*math.pi/10)) for t in range(11)]
    mesh('Arched_reading_window',vs,[tuple(range(len(vs)))],'glow')
    for i in range(10):R(vs[i+2],vs[i+3],.019,'cream',6)
    for xx in (x-w/2,x+w/2):R((xx,y,z),(xx,y,z+h-w/2),.018,'cream',6)
    R((x,y-.008,z),(x,y-.008,z+h-.015),.009,'cream',5)

def biblioteca_bairro():
    gi_base();B(1.3,.93,.91,0,.19,.035,'teal',.012)
    B(1.34,.96,.045,0,.19,.45,'cream',.006)
    originals['gable'](1.43,1.06,.27,0,.19,.95,'brick')
    for xx in (-.43,0,.43):gi_arch(xx,-.284,.56,w=.22,h=.31)
    for xx in (-.43,.43):gi_arch(xx,-.284,.12,w=.21,h=.28)
    B(.20,.025,.31,0,-.29,.035,'wood',.006);gi_steps(.31,-.56,2)
    k.win_side(.65,-.15,.57,.2,2,2,gap=.39,w=.15,h=.23)
    for x in (-.54,-.30):B(.025,.18,.12,x,-.70,.035,'navy',0)
    for x,ang in ((-.51,-.16),(-.34,.16)):
        B(.18,.24,.025,x,-.70,.16,'cream',.003,rot=(0,ang,0))
    R((-.42,-.81,.15),(-.42,-.59,.15),.014,'brick')

def cartorio_digital():
    gi_base();B(1.35,.95,.80,0,.18,.035,'navy',.012)
    B(1.46,1.06,.09,0,.18,.84,'teal',.008)
    B(1.22,.02,.55,0,-.305,.18,'glassl',0)
    # Counters are staged in front of opaque stylized glazing for legibility.
    for x in (-.42,0,.42):
        B(.24,.17,.18,x,-.38,.14,'cream',.006);B(.25,.18,.025,x,-.39,.32,'teal',.003)
        B(.025,.04,.13,x,-.40,.35,'steel',0)
    for x in (-.64,-.21,.21,.64):B(.018,.04,.65,x,-.46,.13,'teal',0)
    B(.025,.62,.43,.69,.13,.24,'dark',.004)
    for i,col in enumerate(('teal','glow','mustard')):B(.012,.11,.18,.71,-.05+i*.18,.36,col,0)
    for j in range(3):B(.18,.18,.10,.57,-.68,.04+j*.1,'sand',.003)

def agencia_empregos():
    gi_base();B(1.3,.93,.73,0,.20,.035,'brick',.012)
    B(1.42,1.04,.07,0,.20,.77,'mustard',.008)
    B(.26,.03,.42,-.22,-.28,.04,'glass',0)
    awning(-.18,-.44,.63,.83,.29,'mustard')
    B(.36,.025,.30,.45,-.285,.28,'wood',.003)
    for i in range(4):B(.11,.012,.08,.36+(i%2)*.16,-.303,.32+(i//2)*.13,'cream',0)
    for i,col in enumerate(('navy','sage','teal','plum','mustard')):gi_person(-.60+i*.25,-.72,col)
    k.win_side(.65,-.1,.53,.23,1,2,w=.18,h=.25)

def agencia_inteligencia():
    gi_base();originals['block'](1.12,1.04,1.23,0,.18,'dark',z=.035,rows=3,cols=(3,2),wkey='glass',gap=.32)
    B(1.18,.06,.09,0,-.38,1.18,'plum',.004)
    gi_dish(-.28,.1,1.39,.20);gi_dish(.30,.4,1.39,.16)
    R((-.43,.55,1.35),(-.43,.55,1.92),.012,'steel')
    R((-.60,.55,1.74),(-.25,.55,1.74),.009,'steel')
    k.car(.10,-.69,'navy');gi_person(-.65,-.55,'dark')

def corregedoria_municipal():
    gi_base();B(1.24,.92,1.05,0,.28,.11,'sage',.012)
    B(1.40,1.08,.10,0,.22,1.17,'cream',.008)
    B(.22,.025,.55,0,-.20,.13,'wood',.005)
    for x in (-.51,-.18,.18,.51):
        C(.043,.86,x,-.36,.15,'cream',10,.004);B(.13,.14,.045,x,-.36,.15,'stone',.003)
    gi_steps(.90,-.70,4)
    k.win_side(.63,-.05,.60,.40,1,3,w=.15,h=.48)
    # Magnifier ring, facing the sprite camera.
    ring=k.torus(.19,.032,.62,-.67,.70,'gold');ring.rotation_euler.x=math.pi/2
    R((.50,-.67,.54),(.37,-.67,.30),.037,'navy',8)
    B(.32,.24,.04,.48,-.67,.035,'sage',.005)

def escola_gestao():
    gi_base();originals['block'](.64,1.25,1.16,-.42,.13,'teal',z=.035,rows=2,cols=(2,3),gap=.42)
    B(.72,.58,.83,.25,.46,.035,'sage',.01)
    # Barrel roof on the auditorium, with cream ribs.
    vs=[]
    for y in (.08,.78):
        for i in range(13):t=i*math.pi/12;vs.append((.30+.40*math.cos(t),y,.87+.35*math.sin(t)))
    mesh('Auditorium_vault',vs,[(i,i+1,i+14,i+13) for i in range(12)],'teal')
    for i in range(12):R(vs[i],vs[i+1],.012,'cream',5)
    B(.46,.025,.12,.30,.065,.64,'cream',.003)
    bench(.20,-.45);bench(.20,-.72)
    tree(.70,-.26,.43);tree(.70,-.68,.43)

def grafica_oficial():
    gi_base();B(1.35,.94,.72,-.05,.25,.035,'brick',.01)
    for i in range(3):
        x=-.72+i*.45
        mesh('Shed_roof',[(x,-.25,.76),(x+.45,-.25,.76),(x+.45,-.25,1.02),(x,.75,.76),(x+.45,.75,.76),(x+.45,.75,1.02)],[(0,1,2),(3,5,4),(0,2,5,3),(1,4,5,2)],'mustard')
        B(.018,.86,.18,x+.45,.25,.79,'glassl',0)
    C(.065,.56,-.53,.53,.86,'brick',10,.004)
    for i in range(3):k.ball(.055+i*.014,-.53+i*.035,.53,1.43+i*.065,'smoke',1)
    B(.40,.03,.42,.29,-.235,.15,'glass',0)
    k.car(-.12,-.66,'mustard');B(.42,.28,.07,.18,-.66,.18,'dark',.004)
    k.hcyl(.15,.24,.18,-.66,.36,'cream',axis='x',verts=16)
    k.hcyl(.045,.25,.18,-.66,.36,'wood',axis='x',verts=10)
    for i in range(3):B(.25,.24,.025,.64,-.55,.06+i*.035,'cream',.002)

def data_center():
    gi_base();B(1.24,1.25,1.62,-.08,.05,.035,'navy',.012)
    for x in (-.54,-.20,.14):B(.045,.025,1.27,x,-.59,.24,'teal',.003)
    B(.025,1.14,1.36,.55,.05,.19,'glassl',0)
    for y in (-.36,-.02,.32):
        B(.07,.27,1.18,.59,y,.27,'dark',.003)
        for j in range(7):
            B(.025,.21,.065,.63,y,.32+j*.15,'navy',0)
            B(.012,.035,.022,.65,y-.065,.34+j*.15,'glow',0,emit=.7)
    for x in (-.38,.18):
        for y in (-.25,.34):hvac(x,y,1.69,.30)
    for y in (-.40,.43):R((-.55,y,1.73),(.37,y,1.73),.045,'steel',8)
    for i in range(3):R((.15+i*.08,-.62,.12),(.15+i*.08,-.80,.12),.025,'dark',6)

def imprensa_investigativa():
    gi_base();originals['block'](1.22,1.02,1.46,0,.19,'plum',z=.035,rows=3,cols=(3,2),gap=.40)
    for x in (-.14,.14):R((x,.25,1.60),(0,.25,2.96),.014,'steel',6)
    for j in range(5):
        z=1.65+j*.23;w=.13*(1-(z-1.6)/1.4)
        R((-w,.25,z),(w*.8,.25,z+.20),.009,'steel',5)
        R((-.20,.25,z),(.20,.25,z),.008,'steel',5)
    k.ball(.035,0,.25,2.98,'glow',1,emit=.7)
    k.car(-.38,-.70,'cream');B(.30,.18,.16,-.38,-.70,.18,'cream',.008)
    for x in (.30,.65):
        gi_person(x,-.65,'navy');B(.06,.05,.04,x+.035,-.70,.18,'dark',.002)
    for j in range(4):B(.19,.15,.018,.02,-.69,.04+j*.023,'cream',0)

def bolsa_valores():
    gi_base();B(1.28,.97,1.50,0,.24,.16,'mustard',.012)
    for x in (-.56,-.34,-.11,.11,.34,.56):C(.038,1.22,x,-.36,.22,'cream',10,.004)
    B(1.47,.30,.10,0,-.31,1.46,'cream',.008)
    originals['gable'](1.48,1.12,.39,0,.20,1.67,'cream',axis='y')
    B(1.11,.035,.23,0,-.50,1.49,'navy',.002)
    for i in range(6):B(.11,.015,.025, -.44+i*.18,-.525,1.54+(i%3)*.045,'glow',0)
    gi_steps(.72,-.78,4)
    B(.29,.18,.17,.55,-.65,.20,'gold',.02)
    for xx in (.45,.65):
        for yy in (-.71,-.59):R((xx,yy,.08),(xx,yy,.24),.019,'gold',6)
    k.ball(.09,.72,-.65,.34,'gold',1)
    for yy in (-.72,-.58):R((.73,yy,.37),(.80,yy,.44),.015,'gold',5)

def inteligencia_nacional():
    gi_base();B(1.25,1.20,1.5,0,.12,.035,'dark',.012)
    B(1.62,1.06,.45,0,.17,1.52,'navy',.012)
    B(1.16,.94,.65,-.12,.17,1.97,'plum',.012)
    C(.49,.13,-.12,.17,2.62,'cream',20,.006)
    k.dome(.49,-.12,.17,2.75,'white')
    for x in (-.60,.59):
        R((x,.54,1.99),(x,.54,3.38),.014,'steel',6)
        R((x-.10,.54,3.10),(x+.10,.54,3.10),.01,'gold',5)
    for x in (-.63,.63):
        C(.02,.51,x,-.53,.035,'steel',6,0);k.hcyl(.07,.09,x,-.53,.58,'cream',axis='y')
    for x in (-.32,.32):k.car(x,-.72,'navy')
    C(.03,.32,-.72,-.80,.035,'gold',8,0);R((-.72,-.80,.34),(.70,-.80,.34),.018,'cream',6)
    B(.80,.025,.12,0,-.38,1.64,'gold',0)

def arquivo_nacional():
    gi_base();B(1.42,1.20,.19,0,.17,.035,'cream',.008)
    B(1.24,1.02,2.35,0,.19,.22,'teal',.008)
    # Shelving visible on the front and right display facades; no opaque glass hiding books.
    for x in (-.40,0,.40):
        B(.32,.03,2.08,x,-.34,.36,'glass',0)
        for j in range(7):
            z=.40+j*.27;B(.34,.09,.024,x,-.40,z,'gold',0)
            for q,col in enumerate(('cream','sand','sage')):B(.075,.05,.16,x-.10+q*.10,-.40,z+.026,col,0)
    for y in (-.12,.22,.56):
        B(.03,.26,2.08,.63,y,.36,'glass',0)
        for j in range(7):
            z=.40+j*.27;B(.08,.28,.024,.66,y,z,'gold',0)
            for q in range(2):B(.05,.09,.16,.66,y-.06+q*.12,z+.026,'cream',0)
    for x in (-.70,-.22,.22,.70):B(.065,.09,2.42,x,-.44,.22,'cream',.004)
    B(1.51,1.27,.15,0,.16,2.63,'cream',.008)
    B(1.32,1.1,.05,0,.16,2.78,'gold',.004);gi_steps(.90,-.82,4)
    for x in (-.65,.65):
        B(.19,.20,.025,x,-.70,.11,'steel',0)
        for z in (.14,.25):B(.16,.16,.09,x,-.70,z,'sand',.002)
        R((x-.1,-.60,.08),(x-.1,-.60,.38),.012,'steel',5)

def rede_nacional_tv():
    gi_base();B(1.45,.87,.76,0,.37,.035,'sage',.012)
    B(1.54,.98,.07,0,.37,.80,'mustard',.008)
    # Open lattice mast, tapering toward the beacon.
    for x,y in ((-.18,.22),(.18,.22),(0,.53)):R((x,y,.88),(0,.36,4.02),.026,'steel',6)
    for j in range(9):
        z=1.0+j*.30;w=.18*(1-(z-.88)/3.2)
        R((-w,.36,z),(w,.36,z+.26),.012,'steel',5)
        R((-w,.36,z),(w,.36,z),.015,'mustard',6)
    for z in (2.2,2.8,3.4):
        R((-.27,.36,z),(.27,.36,z),.015,'mustard',6)
        for x in (-.27,.27):R((x,.36,z-.10),(x,.36,z+.10),.012,'cream',6)
    k.ball(.055,0,.36,4.09,'glow',2,emit=1)
    gi_dish(-.52,.38,.88,.17);gi_dish(.52,.38,.88,.17)
    B(.95,.55,.08,0,-.50,.035,'navy',.008)
    B(.78,.045,.48,0,-.26,.28,'dark',.005);B(.70,.02,.39,0,-.29,.33,'cream',0)
    for x in (-.54,.54):
        R((x,-.62,.13),(x,-.62,.70),.017,'steel',6)
        k.hcyl(.05,.08,x,-.62,.69,'mustard',axis='y',verts=10)

GESTAO_MODELS={'S1-01':biblioteca_bairro,'S1-02':cartorio_digital,'S1-03':agencia_empregos,'S2-01':agencia_inteligencia,'S2-02':corregedoria_municipal,'S2-03':escola_gestao,'S2-04':grafica_oficial,'S3-01':data_center,'S3-02':imprensa_investigativa,'S3-03':bolsa_valores,'M-13':inteligencia_nacional,'M-14':arquivo_nacional,'M-15':rede_nacional_tv}


def apply():
    k.BUILDINGS.update(GESTAO_MODELS)
    k.PAL.update({'grass':'#96AA72','grass2':'#82965D','tree':'#536F42','forest':'#6D8951','sage':'#95A47C','glass':'#294B53','glassl':'#719A9B','roof':'#AF5336','stone':'#C7BDA7','sea':'#397F88','sea2':'#77AAA8','panel':'#34536D','brick':'#B55D44','smoke':'#C5C3B9'})
    for name,fn in [('tree',tree),('bench',bench),('gable',gable),('block',block),('slab',slab),('solar_panel',solar),('container',container),('tank',tank)]:setattr(k,name,fn)
    k.BUILDINGS.update({'PREF':pref,'HOME':home,'E1-01':conjunto,'E1-02':market,'E1-03':workshop,'E2-01':tower,'E3-01':skyscraper,'M-03':greenhouse,'E3-03':nuclear,'M-09':memorial})

def export():
    sc,_=k.setup();apply()
    for ob in list(sc.objects):bpy.data.objects.remove(ob,do_unlink=True)
    roots=[];report={}
    jobs={**k.BUILDINGS,**k.GROUNDS}
    if '--patch-pref' in sys.argv:
        bpy.ops.import_scene.gltf(filepath=os.path.join(OUT,'mandato.glb'))
        old=bpy.data.objects.get('PREF')
        for ob in list(old.children_recursive)+[old]:bpy.data.objects.remove(ob,do_unlink=True)
        roots=[o for o in sc.objects if o.type=='EMPTY' and o.parent is None]
        with open(os.path.join(HERE,'report.json')) as f:report=json.load(f)
        jobs={'PREF':pref}
    for name,fn in jobs.items():
        before=set(sc.objects);fn();bpy.context.view_layer.update()
        objects=set(sc.objects)-before; groups={};deps=bpy.context.evaluated_depsgraph_get()
        for ob in objects:
            ev=ob.evaluated_get(deps);me=ev.to_mesh();key=ob.data.materials[0].name
            vs,fs,mat=groups.setdefault(key,([],[],ob.data.materials[0]));off=len(vs)
            vs.extend(tuple(ob.matrix_world@v.co) for v in me.vertices)
            fs.extend(tuple(off+i for i in p.vertices) for p in me.polygons);ev.to_mesh_clear()
        for ob in objects:bpy.data.objects.remove(ob,do_unlink=True)
        root=bpy.data.objects.new(name,None);sc.collection.objects.link(root);roots.append(root)
        for key,(vs,fs,mat) in groups.items():
            me=bpy.data.meshes.new(name+'_'+key);me.from_pydata(vs,[],fs);me.materials.append(mat)
            import bmesh
            bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free()
            ob=bpy.data.objects.new(name+'_'+key,me);sc.collection.objects.link(ob);ob.parent=root
        report[name]={'meshes':len(groups),'triangles':sum(len(f)-2 for vs,fs,mat in groups.values() for f in fs)}
        print('MODEL',name,flush=True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'mandato.glb'),export_format='GLB',export_apply=True,export_cameras=False,export_lights=False)
    for i,root in enumerate(roots):root.location=((i%9)*3.2,(i//9)*3.2,0)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE,'mandato_revisao.blend'))
    with open(os.path.join(HERE,'report.json'),'w') as f:json.dump(report,f,indent=2)

if __name__=='__main__':export()
