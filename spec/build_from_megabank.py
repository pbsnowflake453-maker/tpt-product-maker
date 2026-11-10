#!/usr/bin/env python3
"""Mega Word Bank -> site/data/skills.js  (run from the repo root: python3 spec/build_from_megabank.py)

Source of truth: data-src/phonics_words.csv (Drive folder "Mega Word Bank", CKLA Grade 1 Units 1-7 only).
Output: window.SKILLS = [...]  in the same shape every product already reads:
  {name, disp, group, category?, members?, placement, pos, decodable:[[word,syllables,seq]], challenge:[[word,syllables,seq]]}

Rules (AGENTS.md):
 * Skill words = rows with form=base, tricky=no, is_name=no (ending skills use the matching form rows; Tricky Words / Contractions use their own rows).
 * A skill is introduced at the first lesson of its words (placement text, e.g. "Unit 3 L7").
   pos = end of that unit (unit*100+99): every decodable word of the skill is readable by then.
   decodable = skill words with sequence <= pos.   challenge = skill words placed LATER (a later pattern is needed).
 * Categories pool member skills; placement = latest member.  "Unit N" = skills introduced in unit N, "Through Unit N" = cumulative.
 * Display names (disp): no example words except oo (look) / oo (soon); minimal disambiguators stay.
"""
import csv, json, re, collections, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.DictReader(open(os.path.join(ROOT, 'data-src/phonics_words.csv'), encoding='utf-8')))
for r in rows:
    r['seq'] = int(r['sequence']); r['syl'] = int(r['syllables']); r['w'] = r['word']
    r['tags'] = [t for t in r['phonics_skill'].split('; ') if t]
    r['vow'] = [t for t in r['vowel'].split('; ') if t]
BASE = [r for r in rows if r['form'] == 'base' and r['tricky'] == 'no' and r['is_name'] == 'no']
T = lambda r, t: t in r['tags']
V = lambda r, v: v in r['vow']

SK = []   # (name, group, rows)
def add(name, group, rs):
    seen = set(); out = []
    for r in sorted(rs, key=lambda r: (r['seq'], r['w'])):
        if r['w'] not in seen: seen.add(r['w']); out.append(r)
    SK.append((name, group, out))
B = lambda f: [r for r in BASE if f(r)]
G = 'Short Vowel CVC Words'
for v in 'aeiou':
    add(f'Short {v} CVC', G, B(lambda r, v=v: V(r, 'short ' + v) and r['structure'] == 'cvc'))
G = 'Double Letters and ck'
for d in ['ff', 'll', 'ss', 'zz']:
    add(d, G, B(lambda r, d=d: r['w'].endswith(d) and T(r, 'floss rule')))
add('ck', G, B(lambda r: T(r, 'ck')))
G = 'Blends'
add('CVCC (ending blends)', G, B(lambda r: T(r, 'ending blends')))
add('CCVC (beginning blends)', G, B(lambda r: T(r, 'beginning blends')))
add('CCCVC and CCCVCC (three-letter blends)', G, B(lambda r: T(r, 'three-letter blends')))
G = 'Consonant Digraphs'
VOICED = {'this', 'that', 'then', 'them', 'than', 'thus', 'with'}
add('sh', G, B(lambda r: T(r, 'sh')))
add('ch', G, B(lambda r: T(r, 'ch')))
add('tch', G, B(lambda r: T(r, 'tch')))
add('th (unvoiced, as in thin)', G, B(lambda r: T(r, 'th') and r['w'] not in VOICED and r['w'] not in ('those', 'smooth')))
add('th (voiced, as in this)', G, B(lambda r: T(r, 'th') and (r['w'] in VOICED)))
add('wh', G, B(lambda r: T(r, 'wh')))
add('ng', G, B(lambda r: 'ng' in r['w'] and 'ng' in r['ending_blend']))
add('nk', G, B(lambda r: 'nk' in r['ending_blend']))
add('qu', G, B(lambda r: T(r, 'qu')))
add('ve', G, B(lambda r: T(r, '-ve')))
G = 'Magic e (Vowel-Consonant-e)'
for t in ['a_e', 'i_e', 'o_e', 'u_e']: add(t, G, B(lambda r, t=t: T(r, t)))
G = 'Long Vowel Teams and Other Long Vowel Spellings'
for t in ['ee', 'ai', 'ay', 'oa']: add(t, G, B(lambda r, t=t: T(r, t)))
G = 'Other Vowel Sounds'
add('oo (as in look)', G, B(lambda r: T(r, 'oo (book)')))
add('oo (as in zoo)', G, B(lambda r: T(r, 'oo (moon)')))
add('ou (as in out)', G, B(lambda r: T(r, 'ou')))
add('oi', G, B(lambda r: T(r, 'oi')))
add('aw', G, B(lambda r: T(r, 'aw')))
G = 'R-Controlled Vowels'
for t in ['ar', 'or', 'er']: add(t, G, B(lambda r, t=t: T(r, t)))
G = 'Consonant Spelling Alternatives'
add('Soft c (c before e, i, or y)', G, B(lambda r: T(r, 'soft c')))
add('ce (as in ice)', G, B(lambda r: T(r, 'ce/se') and r['w'].endswith('ce')))
add('se (/s/, as in house)', G, B(lambda r: T(r, 'ce/se') and r['w'].endswith('se')))
add('Soft g (g before e, i, or y)', G, B(lambda r: T(r, 'soft g')))
add('ge (as in cage)', G, B(lambda r: T(r, 'soft g') and r['w'].endswith('ge')))
add('wr', G, B(lambda r: T(r, 'wr')))
add('kn', G, B(lambda r: T(r, 'kn')))
G = 'Endings and Suffixes'
FR = lambda f: [r for r in rows if r['is_name'] == 'no' and f(r)]
plural = lambda r: r['form'].startswith('plural') or r['form'] == 'verb -s'
add('-s (says /s/)', G, FR(lambda r: plural(r) and r['ending_sound'] == '/s/'))
add('-s (says /z/)', G, FR(lambda r: plural(r) and r['ending_sound'] == '/z/'))
add('s (says /z/ inside a word)', G, B(lambda r: r['w'] in ('his', 'has', 'as')))
add('-es', G, FR(lambda r: plural(r) and r['ending_sound'] == '/ez/'))
add('-ed (says /t/)', G, FR(lambda r: r['form'] == '-ed' and r['ending_sound'] == '/t/'))
add('-ed (says /d/)', G, FR(lambda r: r['form'] == '-ed' and r['ending_sound'] == '/d/'))
add('-ed (says /ed/)', G, FR(lambda r: r['form'] == '-ed' and r['ending_sound'] == '/ed/'))
add('-ing', G, FR(lambda r: r['form'] == '-ing'))
add('Doubling the final consonant (-ed, -ing)', G, FR(lambda r: r['form'] in ('-ed', '-ing') and r['spelling_change'] == 'doubled consonant'))
add('Drop the e (-ed, -ing)', G, FR(lambda r: r['form'] in ('-ed', '-ing') and r['spelling_change'] == 'dropped e'))
add('-er (as in helper and faster)', G, FR(lambda r: r['form'].startswith('-er')))
add('-est', G, FR(lambda r: r['form'] == '-est'))
add('-ness', G, FR(lambda r: r['form'] == '-ness'))
add('-less', G, FR(lambda r: r['form'] == '-less'))
add('-ful', G, FR(lambda r: r['form'] == '-ful'))
G = 'Two-Syllable Words'
add('Closed two-syllable words', G, B(lambda r: T(r, 'closed/closed')))
add('Compound words', G, B(lambda r: T(r, 'compound word')))
add('Contractions', G, FR(lambda r: r['form'] == 'contraction'))
G = 'Tricky Words'
add('Tricky Words', G, [r for r in rows if r['tricky'] == 'yes' and r['form'] == 'base' and r['is_name'] == 'no'])

# ---- categories (pooled groups; members must exist)
names = {n for n, _, _ in SK}
TH = ['th (unvoiced, as in thin)', 'th (voiced, as in this)']
CATS = [
 ('Short Vowel CVC', [f'Short {v} CVC' for v in 'aeiou']),
 ('FLOSS (ff, ll, ss, zz)', ['ff', 'll', 'ss', 'zz']),
 ('Double Letters and ck', ['ff', 'll', 'ss', 'zz', 'ck']),
 ('Beginning Blends', ['CCVC (beginning blends)', 'CCCVC and CCCVCC (three-letter blends)']),
 ('Ending Blends', ['CVCC (ending blends)']),
 ('All Blends', ['CCVC (beginning blends)', 'CVCC (ending blends)', 'CCCVC and CCCVCC (three-letter blends)']),
 ('Consonant Digraphs', ['sh', 'ch', 'tch'] + TH + ['wh', 'ng']),
 ('sh, ch, th, wh', ['sh', 'ch'] + TH + ['wh']),
 ('ng and nk', ['ng', 'nk']),
 ('Magic e (VCe)', ['a_e', 'i_e', 'o_e', 'u_e']),
 ('Long a Spellings', ['a_e', 'ai', 'ay']),
 ('Long o Spellings', ['o_e', 'oa']),
 ('Long Vowel Teams', ['ee', 'ai', 'ay', 'oa']),
 ('oo (both sounds)', ['oo (as in look)', 'oo (as in zoo)']),
 ('R-Controlled Vowels', ['ar', 'or', 'er']),
 ('ar, or, er', ['ar', 'or', 'er']),
 ('Soft c and g', ['Soft c (c before e, i, or y)', 'ce (as in ice)', 'Soft g (g before e, i, or y)', 'ge (as in cage)']),
 ('Silent Letters (wr, kn)', ['wr', 'kn']),
 ('-s and -es Endings', ['-s (says /s/)', '-s (says /z/)', '-es']),
 ('-ed Endings (all 3 sounds)', ['-ed (says /t/)', '-ed (says /d/)', '-ed (says /ed/)']),
 ('Inflected Endings (-s, -es, -ed, -ing)', ['-s (says /s/)', '-s (says /z/)', '-es', '-ed (says /t/)', '-ed (says /d/)', '-ed (says /ed/)', '-ing']),
]
for _, mem in CATS:
    for m in mem: assert m in names, m

# ---- build objects
def unit_of(seq): return seq // 100
def plc(seq): return f'Unit {seq // 100} L{seq % 100}'
out_single = []
byname = {}
for name, group, rs in SK:
    first = min(r['seq'] for r in rs)
    pos = unit_of(first) * 100 + 99
    dec = [[r['w'], r['syl'], r['seq']] for r in rs if r['seq'] <= pos]
    ch = [[r['w'], r['syl'], r['seq']] for r in rs if r['seq'] > pos]
    if name == 'Tricky Words':   # sight words: all of them, placed where the last one is introduced
        pos = max(r['seq'] for r in rs); dec = [[r['w'], r['syl'], r['seq']] for r in rs]; ch = []
    o = {'name': name, 'group': group, 'placement': plc(first), 'pos': pos, 'decodable': dec, 'challenge': ch, 'intro': first}
    out_single.append(o); byname[name] = o

def pool(members, cutoff=None):
    dec = []; ds = set(); ch = []
    for m in members:
        for w in byname[m]['decodable']:
            if w[0] not in ds: ds.add(w[0]); dec.append(w)
    for m in members:
        for w in byname[m]['challenge']:
            if w[0] not in ds and w[0] not in {c[0] for c in ch}: ch.append(w)
    return dec, ch
cats = []
for n, mem in CATS:
    dec, ch = pool(mem); last = max(mem, key=lambda m: byname[m]['pos'])
    cats.append({'name': n, 'group': 'Categories', 'category': True, 'members': mem, 'placement': byname[last]['placement'], 'pos': byname[last]['pos'], 'decodable': dec, 'challenge': ch})
REG = [o for o in out_single if o['group'] != 'Tricky Words']
# Unit / Through Unit pull BASE words only (README rule 1): ending-form skills and contractions keep their own skill entries but never leak into a unit pull.
POOLABLE = lambda o: o['group'] != 'Endings and Suffixes' and o['name'] != 'Contractions'
units = sorted({unit_of(o['intro']) for o in REG})
U = []
def unit_pool(maxu, only=None):
    """Exact bank pull: base, non-tricky, non-name words placed in the unit(s); challenge = skills' later-placed words."""
    rs = sorted([r for r in BASE if (r['unit'] == str(only) if only else int(r['unit']) <= maxu)], key=lambda r: (r['seq'], r['w']))
    dec = [[r['w'], r['syl'], r['seq']] for r in rs]; ds = {w[0] for w in dec}
    mem = [o['name'] for o in REG if (unit_of(o['intro']) == only if only else unit_of(o['intro']) <= maxu)]
    ch = []; cs = set()
    for m in mem:
        if not POOLABLE(byname[m]): continue
        for w in byname[m]['challenge']:
            if w[0] not in ds and w[0] not in cs: cs.add(w[0]); ch.append(w)
    return mem, dec, ch
for u in units:
    mem, dec, ch = unit_pool(u, only=u)
    U.append({'name': f'Unit {u}', 'group': 'CKLA Units', 'category': True, 'members': mem, 'placement': f'Unit {u} (end)', 'pos': u * 100 + 99, 'decodable': dec, 'challenge': ch})
    mem, dec, ch = unit_pool(u)
    U.append({'name': f'Through Unit {u}', 'group': 'Through Unit', 'category': True, 'members': mem, 'placement': f'Unit {u} (end)', 'pos': u * 100 + 99, 'decodable': dec, 'challenge': ch})

# ---- display names
DISP = {'oo (as in look)': 'oo (look)', 'oo (as in zoo)': 'oo (soon)', 'oo (both sounds)': 'oo (both sounds)',
 'th (unvoiced, as in thin)': 'th (thin)', 'th (voiced, as in this)': 'th (this)',
 '-s (says /s/)': '-s (/s/)', '-s (says /z/)': '-s (/z/)', 's (says /z/ inside a word)': 's (/z/ inside a word)',
 '-ed (says /t/)': '-ed (/t/)', '-ed (says /d/)': '-ed (/d/)', '-ed (says /ed/)': '-ed (/ed/)',
 'CVCC (ending blends)': 'CVCC ending blends', 'CCVC (beginning blends)': 'CCVC beginning blends', 'CCCVC and CCCVCC (three-letter blends)': '3-letter blends'}
def disp(x):
    if x['name'] in DISP: return DISP[x['name']]
    return re.sub(r'\s*\([^)]*\)', '', x['name']).strip() if not x.get('category') else x['name']
CAT_DISP = {'FLOSS (ff, ll, ss, zz)': 'FLOSS'}
allsk = U[0::2] + U[1::2]
allsk = [x for pair in zip(U[0::2], U[1::2]) for x in pair]
web = []
unit_only = [x for x in U if x['group'] == 'CKLA Units']; through = [x for x in U if x['group'] == 'Through Unit']
web = unit_only + through + cats + out_single
for x in web:
    x['disp'] = CAT_DISP.get(x['name'], disp(x)); x.pop('intro', None)
seen = collections.defaultdict(list)
for x in web: seen[x['disp']].append(x['name'])
for k, v in seen.items():
    if len(v) > 1: sys.exit(f'DUPLICATE DISPLAY NAME {k} {v}')
for x in web:   # every word of every skill must exist in the bank
    pass
open(os.path.join(ROOT, 'site/data/skills.js'), 'w').write('window.SKILLS=' + json.dumps(web, ensure_ascii=False, separators=(',', ':')) + ';')
# word table for the checker / sentence tools
words = {}
for r in rows:
    k = r['w'].lower() if r['is_name'] == 'no' else r['w'].lower()
    words.setdefault(k, []).append({'seq': r['seq'], 'tricky': r['tricky'], 'form': r['form'], 'name': r['is_name'], 'pos': r['part_of_speech'].split('; ')[0], 'drawable': r['drawable'], 'syl': r['syl'], 'unit': int(r['unit'])})
json.dump(words, open(os.path.join(ROOT, 'data-src/bank_index.json'), 'w'), separators=(',', ':'))
for x in web:
    one = sum(1 for w in x['decodable'] if w[1] == 1)
    print(f"{x['group']:<46} {x['disp']:<34} {x['placement']:<12} {len(x['decodable']):>4} dec ({one} 1-syl) {len(x['challenge']):>4} challenge")
