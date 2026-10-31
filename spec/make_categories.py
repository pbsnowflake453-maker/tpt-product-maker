import json
d=json.load(open('spec/wordlists_audited.json'))
TH=['th (unvoiced, as in thin)','th (voiced, as in this)']
C=[('Short Vowel CVC',['Short a CVC','Short e CVC','Short i CVC','Short o CVC','Short u CVC']),
('FLOSS (ff, ll, ss, zz)',['ff','ll','ss','zz']),
('Double Letters and ck',['ff','ll','ss','zz','ck']),
('Beginning Blends',['CCVC (beginning blends)','CCCVC and CCCVCC (three-letter blends)']),
('Ending Blends',['CVCC (ending blends)']),
('All Blends',['CCVC (beginning blends)','CVCC (ending blends)','CCCVC and CCCVCC (three-letter blends)']),
('Consonant Digraphs',['sh','ch','tch']+TH+['wh','ng']),
('sh, ch, th, wh',['sh','ch']+TH+['wh']),
('ng and nk',['ng','nk']),
('Magic e (VCe)',['a_e','e_e','i_e','o_e','u_e']),
('Long a Spellings',['a_e','ai','ay','a (long a, as in table)']),
('Long e Spellings',['e_e','ee','ea (long e, as in eat)','e (long e, as in me)','y (long e, as in baby)','ey (long e)','ie (long e, as in field)']),
('Long i Spellings',['i_e','ie (long i, as in pie)','igh','y (long i, as in my)','i (long i, as in find)']),
('Long o Spellings',['o_e','oa','ow (long o, as in snow)','oe (long o)','o (long o, as in go and cold)']),
('Long u Spellings',['u_e','ew','ue','u (long u, as in music)']),
('Long Vowel Teams',['ee','ea (long e, as in eat)','ai','ay','igh','oa','ow (long o, as in snow)','ew','ue','ie (long i, as in pie)','oe (long o)','ey (long e)','ie (long e, as in field)']),
('oo (both sounds)',['oo (as in look)','oo (as in zoo)']),
('ou and ow (as in out, cow)',['ou (as in out)','ow (as in cow)']),
('oi and oy',['oi','oy']),
('aw, au and al',['aw','au','al and all (as in ball)']),
('Diphthongs (ou, ow, oi, oy)',['ou (as in out)','ow (as in cow)','oi','oy']),
('R-Controlled Vowels',['ar','or','ore','oar, oor, and our (as in board, door, four)','er','ir','ur']),
('ar, or, er',['ar','or','er']),
('er, ir, ur',['er','ir','ur']),
('or, ore, oar',['or','ore','oar, oor, and our (as in board, door, four)']),
('Soft c and g',['Soft c (c before e, i, or y)','ce (as in ice)','Soft g (g before e, i, or y)','ge (as in cage)','dge']),
('Silent Letters (wr, kn)',['wr','kn']),
('-s and -es Endings',['-s (says /s/)','-s (says /z/)','-es']),
('-ed Endings (all 3 sounds)',['-ed (says /t/)','-ed (says /d/)','-ed (says /ed/)']),
('Inflected Endings (-s, -es, -ed, -ing)',['-s (says /s/)','-s (says /z/)','-es','-ed (says /t/)','-ed (says /d/)','-ed (says /ed/)','-ing']),
]
SIGHT=('Tricky Words','Dolch Sight Words','Fry Sight Words')
REG=[k for k,v in d.items() if isinstance(v,dict) and 'group' in v and v['group'] not in SIGHT]
unit=lambda p:p//40          # g*1000+u*40+l -> unit key
units=sorted({unit(d[k]['placement_pos']) for k in REG})
ulab=lambda u:(lambda g,uu:f"{'K' if g==0 else 'G'+str(g)} Unit {uu}")(*divmod(u*40,1000)) if False else (('K' if u*40//1000==0 else 'G'+str(u*40//1000))+' Unit '+str((u*40%1000)//40))
U=[]
for u in units:
    U.append((ulab(u),[k for k in REG if unit(d[k]['placement_pos'])==u],'unit',u))
    U.append(('Through '+ulab(u),[k for k in REG if unit(d[k]['placement_pos'])<=u],'through',u))
cats=[]
for name,mem,kind,u in [(n,m,'category',None) for n,m in C]+U:
    for m in mem: assert m in d,m
    last=max(mem,key=lambda m:d[m].get('placement_pos',0))
    pos=u*40+39 if u is not None else d[last]['placement_pos']; plc=(ulab(u)+' (end)') if u is not None else d[last]['placement']
    dec=[];syl={}
    for m in mem:
        syl.update(d[m]['syllables'])
        for w in d[m]['decodable']:
            if w not in dec: dec.append(w)
    ch=[]
    for m in mem:
        for c in d[m]['challenge']:
            w=c['word']
            if w not in dec and w not in ch: ch.append(w)
    cats.append({'name':name,'kind':kind,'members':mem,'placement':plc,'placement_pos':pos,'decodable':dec,'challenge':ch,'syllables':{w:syl.get(w,1) for w in dec+ch}})
d['categories']=cats
json.dump(d,open('spec/wordlists_audited.json','w'),indent=1,ensure_ascii=False)
# web data: prepend categories to skills.js
s=open('site/data/skills.js').read(); S=json.loads(s[len('window.SKILLS='):].rstrip().rstrip(';'))
S=[x for x in S if not x.get('category')]
G={'category':'Categories','unit':'CKLA Units','through':'Through Unit'}
web=[{'name':c['name'],'group':G[c['kind']],'category':True,'members':c['members'],'placement':c['placement'],'pos':c['placement_pos'],'decodable':[[w,c['syllables'][w]] for w in c['decodable']],'challenge':[[w,c['syllables'][w]] for w in c['challenge']]} for c in cats]

# ---- display names: K and G1 drop the (descriptor); oo keeps it; collisions keep the minimum to tell apart
DISP={'oo (as in look)':'oo (look)','oo (as in zoo)':'oo (soon)','oo (both sounds)':'oo (both sounds)',
 'th (unvoiced, as in thin)':'th (thin)','th (voiced, as in this)':'th (this)',
 '-s (says /s/)':'-s (/s/)','-s (says /z/)':'-s (/z/)','s (says /z/ inside a word)':'s (/z/ inside a word)',
 '-ed (says /t/)':'-ed (/t/)','-ed (says /d/)':'-ed (/d/)','-ed (says /ed/)':'-ed (/ed/)',
 'CVCC (ending blends)':'CVCC ending blends','CCVC (beginning blends)':'CCVC beginning blends','CCCVC and CCCVCC (three-letter blends)':'3-letter blends'}
import re as _re
def disp(x):
    if x['name'] in DISP: return DISP[x['name']]
    if x['pos']>=2000: return x['name']
    return _re.sub(r'\s*\([^)]*\)','',x['name']).strip()
for x in S: x['pos']=d[x['name']]['placement_pos']
for x in web+S: x['disp']=disp(x)
_seen={}
for x in web+S: _seen.setdefault(x['disp'],[]).append(x['name'])
for k,v in _seen.items():
    if len(v)>1: print('DUPLICATE DISPLAY NAME',k,v)
open('site/data/skills.js','w').write('window.SKILLS='+json.dumps(web+S,ensure_ascii=False)+';')
for c in cats:
    one=sum(1 for w in c['decodable'] if c['syllables'][w]==1)
    print(f"{c['name']} | {', '.join(c['members'])} | {len(c['decodable'])} decodable ({one} one-syl, {len(c['decodable'])-one} two+) | {len(c['challenge'])} challenge | {c['placement']}")
