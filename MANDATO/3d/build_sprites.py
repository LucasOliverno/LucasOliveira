"""Production entrypoint for the approved art revision.
Blender --background --python build_sprites.py -- --glb exports models;
without --glb renders all 2.5D sprites (optional IDs after --).
"""
import importlib.util
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
spec = importlib.util.spec_from_file_location('mandato_art', os.path.join(HERE, 'revisao_visual', 'build_revision.py'))
art = importlib.util.module_from_spec(spec)
spec.loader.exec_module(art)
if __name__ == '__main__':
    if '--glb' in sys.argv:
        art.export()
        shutil.copy2(os.path.join(art.OUT, 'mandato.glb'), os.path.join(ROOT, 'frontend', 'public', 'mandato', 'models', 'mandato.glb'))
        shutil.copy2(os.path.join(art.HERE, 'mandato_revisao.blend'), os.path.join(HERE, 'mandato_modelos.blend'))
        shutil.copy2(os.path.join(art.HERE, 'report.json'), os.path.join(HERE, 'model_report.json'))
    else:
        art.apply()
        art.k.OUT = os.path.join(ROOT, 'frontend', 'public', 'mandato', 'iso')
        os.makedirs(art.k.OUT, exist_ok=True)
        art.k.main()
