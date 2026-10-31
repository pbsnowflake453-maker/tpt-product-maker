import random,sys,os
sys.path.insert(0,'/workspace/tpt-generator'); import u3_config as C, build_bingo as B
OUT='/workspace/tpt-generator/out/G1-U3/parts/bingo'
HOW_DIFF=B.HOW_R.replace("Every board has the same words in a different order, so every word you call is on every board.","Each board has a different mix of words, so call words until someone gets Bingo. Keep calling for second and third place!")
for key,label,les,target,review in C.SKILLS:
    r=random.Random(11)
    if key=='oo-look':  # 'oo' can say either sound: mix both
        pool=target+[w for w in review if w not in target][:24-len(target)]
        words=pool; size=5; boards=B.make_boards(words,5,8,seed=5); calls=sorted(words); how=B.HOW_R; note='Same words on every board'
    elif len(target)>=24:
        words=r.sample(target,24); size=5; boards=B.make_boards(words,5,8,seed=5); calls=sorted(words); how=B.HOW_R; note='Same words on every board'
    else:
        size=4 if len(target)>=18 else 3; need=size*size-(size%2)
        boards=B.make_boards(None,size,8,same=False,pool=target,seed=5); calls=sorted(target); how=HOW_DIFF; note='A different mix on every board'
    B.build(label,size,boards,calls,how,OUT,'Bingo-'+key,note,calling_cards=True)
    print(key,size,len(calls))
