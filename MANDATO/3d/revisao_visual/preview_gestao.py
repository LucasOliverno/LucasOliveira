"""Preview and validate the expansion with the existing kit renderer."""
import os, importlib.util, json, bpy
from mathutils import Vector
HERE=os.path.dirname(os.path.abspath(__file__))
s=importlib.util.spec_from_file_location('art',os.path.join(HERE,'build_revision.py'))
a=importlib.util.module_from_spec(s);s.loader.exec_module(a);a.apply()
out=os.path.join(HERE,'gestao_preview');os.makedirs(out,exist_ok=True)
a.k.OUT=out
sc,cam=a.k.setup();keep={o.name for o in sc.objects};report={}
for name,fn in a.GESTAO_MODELS.items():
    a.k.clear(keep);fn();bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
    coords=[];tri=0
    for o in sc.objects:
        if o.type!='MESH':continue
        ev=o.evaluated_get(deps);me=ev.to_mesh()
        coords.extend(o.matrix_world@v.co for v in me.vertices)
        tri+=sum(len(p.vertices)-2 for p in me.polygons);ev.to_mesh_clear()
    lo=[min(v[i] for v in coords) for i in range(3)];hi=[max(v[i] for v in coords) for i in range(3)]
    limit=4000 if name.startswith('S1') else 6000 if name.startswith('S2') else 8000 if name.startswith('S3') else 9000
    height=1.4 if name.startswith('S1') else 2.2 if name.startswith('S2') else 3.2 if name.startswith('S3') else 4.2
    report[name]={'triangles':tri,'limit':limit,'min':lo,'max':hi,'ok':tri<=limit and max(abs(lo[0]),abs(lo[1]),hi[0],hi[1])<=.901 and hi[2]<=height and lo[2]>=-.001}
    sc.render.filepath=os.path.join(out,name+'.webp');bpy.ops.render.render(write_still=True)
    print('CHECK',name,report[name],flush=True)
with open(os.path.join(out,'model_report.json'),'w') as f:json.dump(report,f,indent=2)
assert all(r['ok'] for r in report.values()),'Geometry budget or bounds failed; inspect report'
# Review-only GLB using the existing exporter. The live GLB is untouched.
a.OUT=out;a.HERE=out;a.export()
print('GESTAO_PREVIEW_OK',flush=True)
