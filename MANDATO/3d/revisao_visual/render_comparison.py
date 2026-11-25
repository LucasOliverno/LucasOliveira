import importlib.util,os,sys,math,bpy
from mathutils import Vector
HERE=os.path.dirname(os.path.abspath(__file__))
spec=importlib.util.spec_from_file_location('revision',os.path.join(HERE,'build_revision.py'));v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v)
k=v.k
mode=sys.argv[-1] if sys.argv[-1] in ('before','after') else 'after'
sc,cam=k.setup()
if mode=='after':v.apply()
sc.render.resolution_x=sc.render.resolution_y=640
sc.render.image_settings.file_format='PNG';sc.render.film_transparent=False
sc.view_settings.view_transform='AgX';sc.view_settings.exposure=.65
sc.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.8
cam.data.shift_y=0
keep=set(sc.objects)
ids=['PREF','HOME','E1-01','E1-02','E1-03','E1-06','E2-01','E3-01','E3-03','M-03','M-09','R-LIT-1']
if '--pref-only' in sys.argv: ids=['PREF']
for name in ids:
    for ob in list(sc.objects):
        if ob not in keep:bpy.data.objects.remove(ob,do_unlink=True)
    height={'E2-01':3.2,'E3-01':4.7,'M-09':3.3}.get(name,2.5)
    cam.data.ortho_scale=max(3.6,height*1.35)
    target=Vector((0,0,height*.42));cam.location=target+Vector((7,-10,8));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    k.box(200,200,.1,0,0,-.47,'cream',0)
    k.GROUNDS['g-plain-grass']();k.BUILDINGS[name]()
    sc.render.filepath=os.path.join(HERE,'assets',mode+'-'+name+'.png');bpy.ops.render.render(write_still=True)
    print('RENDER',mode,name,flush=True)
