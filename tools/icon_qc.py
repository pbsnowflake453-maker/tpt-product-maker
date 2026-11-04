#!/usr/bin/env python3
"""Measure icon clarity. Usage: python3 tools/icon_qc.py [icons dir] [--json out.json]
Flags: faint (lines mostly gray, not dark), thin (strokes 1 to 2 px at 400px), tiny (drawing fills little of the square),
empty (almost no ink), busy (too much ink, likely a photo or filled shape), lowcontrast."""
import sys,os,json
from PIL import Image,ImageFilter
def measure(path):
    g=Image.open(path).convert('L'); W,H=g.size; px=list(g.getdata()); n=len(px)
    dark=sum(1 for v in px if v<110); mid=sum(1 for v in px if 110<=v<225); ink=dark+mid
    m={'ink':ink/n,'dark':dark/n,'mid':mid/n}
    m['darkshare']=dark/ink if ink else 0
    b=g.point(lambda v:0 if v<170 else 255); bb=Image.eval(b,lambda v:255-v).getbbox()
    m['fill']=((bb[2]-bb[0])*(bb[3]-bb[1]))/n if bb else 0
    inkb=sum(1 for v in b.getdata() if v==0)
    er=b.filter(ImageFilter.MaxFilter(5)); left=sum(1 for v in er.getdata() if v==0)  # erode dark by 2px
    m['thick']=left/inkb if inkb else 0
    mn=min(px); m['minv']=mn
    f=[]
    if m['ink']<0.004: f.append('empty')
    if m['ink']>=0.004 and m['darkshare']<0.35: f.append('faint')
    if mn>120: f.append('lowcontrast')
    if inkb and m['thick']<0.08: f.append('thin')
    if m['fill']<0.25 and m['ink']>=0.004: f.append('tiny')
    if m['ink']>0.55: f.append('busy')
    m['flags']=f; return m
if __name__=='__main__':
    d=sys.argv[1] if len(sys.argv)>1 and not sys.argv[1].startswith('--') else os.path.join(os.path.dirname(__file__),'..','site','images','icons')
    res={f[:-4]:measure(os.path.join(d,f)) for f in sorted(os.listdir(d)) if f.endswith('.png')}
    bad={k:v['flags'] for k,v in res.items() if v['flags']}
    from collections import Counter
    print(len(res),'icons;',len(bad),'flagged;',Counter(x for v in bad.values() for x in v))
    if '--json' in sys.argv: json.dump(res,open(sys.argv[sys.argv.index('--json')+1],'w'))
