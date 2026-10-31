"""Rebuild site/data/pixels.js from data-src/pixel-library.json. Run from the repo root: python3 spec/build_pixels.py"""
import json
d=json.load(open('data-src/pixel-library.json'))
th={k:[{'name':i['name'],'rows':i['rows']} for i in v] for k,v in d['themes'].items()}
open('site/data/pixels.js','w').write('window.PIXELS='+json.dumps({'palette':d['palette'],'themes':th},separators=(',',':'))+';')
print(sum(len(v) for v in th.values()),'pictures')
