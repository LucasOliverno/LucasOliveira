import bpy, os, math
from mathutils import Vector
root=os.path.dirname(os.path.abspath(__file__)); bpy.ops.wm.open_mainfile(filepath=os.path.join(root,'garimpo_modelos_v3.blend'))
scene=bpy.context.scene; scene.render.engine='BLENDER_WORKBENCH'; scene.display.shading.light='STUDIO'; scene.display.shading.color_type='MATERIAL'; scene.display.shading.show_shadows=True; scene.display.shading.show_cavity=True; scene.display.shading.background_type='WORLD';scene.world.color=(.24,.24,.24)
scene.render.resolution_x=256;scene.render.resolution_y=256;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO'
models=[o for o in scene.objects if o.type=='MESH'];
for o in models:o.hide_render=True
for o in models:
 o.hide_render=False; center=o.location+Vector((0,0,o.dimensions.z*.5)); size=max(o.dimensions); cam.location=center+Vector((1,-1,1.1)).normalized()*size*3;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=size*1.9
 scene.render.filepath=os.path.join(root,'renders_v3',o.name+'.png');bpy.ops.render.render(write_still=True);o.hide_render=True
print('RENDERS',len(models))

