#!/usr/bin/env python3
"""Check + build the decodable sentence bank.   python3 spec/build_sentences.py   (run from the repo root; run build_from_megabank.py first)

Input : data-src/sentences/u1.txt ... u7.txt  (one sentence per line, '#' lines are comments)
Output: site/data/sentences.js  -> window.SENTENCES=[{t:"Beth sat on a bed.", u:1, s:117, w:["beth"...]}]
HARD RULES (the build exits non-zero on any violation):
  * every word is a Mega Word Bank row (any form: base, plural, verb -s, -ed, -ing, contraction...) placed at or before the end of the
    sentence's unit, OR a tricky word the bank introduces by that unit, OR an approved character name for that unit (NAMES below);
  * the sentence has at least one word that is NEW in its unit (so 'Unit N' pulls feature that unit's patterns);
  * 3-10 words, starts with a capital, ends with . ? or !, no duplicates, no digits.
"""
import json, os, re, sys, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ix = json.load(open(os.path.join(ROOT, 'data-src/bank_index.json')))
# Approved character names (proper names only; never common words). Earlier-unit characters may appear in later units.
NAMES = {1: ['Beth', 'Nat'], 2: ['Gran', 'Josh', 'Jen'], 3: [], 4: ['Vern'], 5: ['Kate', 'Max'], 6: ['Grace', 'Jill', 'Pepper'], 7: ['Kay', 'Martez']}
def names_upto(u): return {n.lower() for k, v in NAMES.items() if k <= u for n in v}
TOK = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)?")
def word_unit(w, u):
    """Return (seq, kind) for the cheapest bank row of w usable at unit u, or None."""
    rows = [r for r in ix.get(w.lower(), []) if r['name'] == 'no']
    ok = [r for r in rows if r['seq'] <= u * 100 + 99]
    if not ok: return None
    return min(ok, key=lambda r: r['seq'])
def check(text, u):
    errs = []; words = [m.group(0) for m in TOK.finditer(text)]
    if not (3 <= len(words) <= 10): errs.append(f'{len(words)} words')
    if not text[0].isupper(): errs.append('no capital')
    if text[-1] not in '.?!': errs.append('no end punctuation')
    if re.search(r'\d', text): errs.append('digit')
    if re.sub(r"[A-Za-z' ]", '', text.rstrip('.?!')).replace(',', ''): errs.append('odd characters')
    nm = names_upto(u); seqs = []; newu = False; used = []
    for i, w in enumerate(words):
        lw = w.lower()
        if lw in nm and w[0].isupper(): used.append(lw); continue
        r = word_unit(lw, u)
        if not r: errs.append(f'"{w}" not allowed by unit {u}'); continue
        if i > 0 and w[0].isupper() and lw not in ('i',) and not lw.startswith("i'"): errs.append(f'"{w}" capitalised but not an approved name')
        seqs.append(r['seq'])
        if r['seq'] // 100 == u: newu = True
    if not newu and not errs: errs.append(f'no word new in unit {u}')
    return errs, (max(seqs) if seqs else 0), [m.lower() for m in words]
def main():
    out = []; bad = 0; seen = set(); per = collections.Counter()
    for u in range(1, 8):
        p = os.path.join(ROOT, f'data-src/sentences/u{u}.txt')
        if not os.path.exists(p): continue
        for n, line in enumerate(open(p, encoding='utf-8'), 1):
            t = line.strip()
            if not t or t.startswith('#'): continue
            errs, seq, w = check(t, u)
            k = t.lower()
            if k in seen: errs.append('duplicate')
            seen.add(k)
            if errs: bad += 1; print(f'u{u}.txt:{n}: {t}  -> {"; ".join(errs)}'); continue
            out.append({'t': t, 'u': u, 's': seq, 'w': sorted(set(w))}); per[u] += 1
    open(os.path.join(ROOT, 'site/data/sentences.js'), 'w').write('window.SENTENCES=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';')
    print('sentences per unit:', dict(per), 'total', sum(per.values()), 'violations', bad)
    return 1 if bad else 0
if __name__ == '__main__': sys.exit(main())
