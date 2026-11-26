import bpy,os,glob
from mathutils import Vector
root=os.path.dirname(os.path.abspath(__file__));errors=[];paths=glob.glob(os.path.join(root,'assets_complementares','*.glb'))
for f in paths:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);bpy.ops.import_scene.gltf(filepath=f)
 objs=[o for o in bpy.context.scene.objects if o.type=='MESH']
 if len(objs)!=1:errors.append((os.path.basename(f),'malhas',len(objs)));continue
 o=objs[0];cs=[o.matrix_world@Vector(c) for c in o.bound_box];z=min(c.z for c in cs);size=[max(c[i] for c in cs)-min(c[i] for c in cs) for i in range(3)]
 if abs(z)>.001 or min(size)<.01 or max(size)>5:errors.append((os.path.basename(f),'base ou dimensões',z,size))
print('VALIDADOS',len(paths),'ERROS',errors)
if errors or len(paths)!=8:raise Exception('Falha na validação dos modelos')
