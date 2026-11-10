#!/usr/bin/env python3
"""Print the words available for sentence writing, by CKLA unit: python3 spec/bank_vocab.py 3  (new words in unit 3, grouped by part of speech)."""
import csv, sys, os, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.DictReader(open(os.path.join(ROOT, 'data-src/phonics_words.csv'), encoding='utf-8')))
u = int(sys.argv[1]); only = sys.argv[2:] 
g = collections.defaultdict(list)
for r in rows:
    if int(r['unit']) != u or r['is_name'] == 'yes': continue
    pos = r['part_of_speech'].split('; ')[0]
    kind = ('T:' if r['tricky'] == 'yes' else '') + ('' if r['form'] == 'base' else r['form'] + ':')
    key = pos + (' drawable' if r['drawable'] == 'yes' and pos == 'noun' else '')
    g[key].append((r['sequence'], kind + r['word']))
for k in sorted(g):
    if only and k.split()[0] not in only: continue
    print('##', k, len(g[k])); print(' '.join(w for _, w in sorted(g[k])))
