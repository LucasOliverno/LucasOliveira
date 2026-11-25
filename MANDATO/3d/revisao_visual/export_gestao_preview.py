import os, importlib.util
HERE=os.path.dirname(os.path.abspath(__file__))
s=importlib.util.spec_from_file_location('art',os.path.join(HERE,'build_revision.py'))
a=importlib.util.module_from_spec(s);s.loader.exec_module(a)
a.OUT=os.path.join(HERE,'gestao_preview');a.HERE=a.OUT;a.export()
