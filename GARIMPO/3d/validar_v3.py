import bpy, os,json
from mathutils import Vector
root=os.path.dirname(os.path.abspath(__file__)); entries=json.load(open(os.path.join(root,'relatorio_v3.json'),encoding='utf8'));errors=[]
for a in entries:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.gltf(filepath=os.path.join(root,'assets_v3',a['id']+'.glb'))
 objs=[o for o in bpy.context.scene.objects if o.type=='MESH']
 if len(objs)!=1:errors.append((a['id'],'objetos',len(objs)));continue
 o=objs[0]; corners=[o.matrix_world @ Vector(v) for v in o.bound_box]; dims=[max(v[i] for v in corners)-min(v[i] for v in corners) for i in range(3)];bot=min(v.z for v in corners)
 if max(abs(dims[i]-a['dimensoes_cm'][i]) for i in range(3))>.002 or abs(bot)>.002:errors.append((a['id'],'dimensao ou base',dims,bot))
print('VALIDADOS',len(entries),'ERROS',errors)

