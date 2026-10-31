import sys,os; sys.path.insert(0,'/workspace/tpt-generator'); import u3_config as C, build_mystery as M
OUT='/workspace/tpt-generator/out/G1-U3/parts/mystery'
D=C.D; S={'oo (soon)':D('oo (as in zoo)'),'oo (look)':D('oo (as in look)'),'ou (out)':D('ou (as in out)'),'oi (oil)':D('oi'),'aw (saw)':D('aw'),'ee':D('ee'),'o_e':D('o_e'),'i_e':D('i_e'),'tricky':C.TRICKY}
ART={
'penguin':["CCCCCCCCCCCC","CCCCKKKKCCCC","CCCKKKKKKCCC","CCKKWKKWKKCC","CCKKKOOKKKCC","CCKKWWWWKKCC","CKKWWWWWWKKC","KKKWWWWWWKKK","KKKWWWWWWKKK","CCKWWWWWWKCC","CCKKWWWWKKCC","CCCKKKKKKCCC","CCOOOCCOOOCC"],
'giraffe':["CCCCCCCNCNCC","CCCCCCCYYYYC","CCCCCCYYYNYY","CCCCCCYYYYYY","CCCCCCYYNCCC","CCCCCCYNYCCC","CCCCCCYYNCCC","CCCCCCNYYCCC","CYYYYYYYYCCC","NYNYYNYYNCCC","CYYNYYYNYCCC","CYCYCCYCYCCC","CYCYCCYCYCCC","GNGNGGNGNGGG"],
'pizza':["NNNNNNNNNNNN","NNNNNNNNNNNN","YYYYYYYYYYYY",".YRRYYYYRRY.",".YRRYYYYRRY.","..YYYYRRYY..","..YYYYRRYY..","...YRYYYY...","...YYYYYY...","....YYRY....","....YYYY....",".....YY....."],
'cupcake':['.....RR.....', '.....RR.....', '...pppppp...', '..pppppppp..', '.pppppppppp.', 'pppppppppppp', 'pppppppppppp', 'NTNNTNNTNNTN', 'NTNNTNNTNNTN', '..NNTNNTNN..', '..NNTNNTNN..', '..NNTNNTNN..'],
}

# Custom 12-col art (Samantha replaced planet/book/ladybug/gift). Explicit color -> category maps; first entry = target skill.
CUSTOM={'oo-soon':('penguin',{'K':'oo (soon)','C':'ee','W':'o_e','O':'i_e'}),
 'oo-look':('giraffe',{'Y':'oo (look)','C':'oo (soon)','N':'ee','G':'o_e'}),
 'aw':('pizza',{'Y':'aw (saw)','.':'ou (out)','N':'oi (oil)','R':'oo (soon)'}),
 'tricky':('cupcake',{'p':'tricky','.':'oo (soon)','N':'ou (out)','R':'oo (look)','T':'oi (oil)'})}
PLAN={'ou':(('Holidays','candy'),['oo (soon)','ou (out)','oo (look)']),
 'oi':(('Holidays','pot of gold'),['ou (out)','oi (oil)','oo (soon)'])}
PIC={'oo-soon':'penguin','oo-look':'giraffe','ou':'candy','oi':'pot of gold','aw':'pizza','tricky':'cupcake'}
TITLE={'oo-soon':'oo (soon)','oo-look':'oo (look) & oo (soon)','ou':'ou (out)','oi':'oi (oil)','aw':'aw (saw)','tricky':'Tricky Words'}
if __name__=='__main__':
    for key,((th,nm),cats) in PLAN.items():  # unchanged logic for candy / pot of gold
        img,pal=M.load_image(th,nm); order=[c for c,_ in M.colors_by_count(img)]
        assert len(order)==len(cats),(key,order)
        tc=next(c for c in order if c not in '.W'); rest=[c for c in order if c!=tc]
        assign={tc:(cats[1],S[cats[1]]),rest[0]:(cats[0],S[cats[0]]),rest[1]:(cats[2],S[cats[2]])}
        M.build(img,pal,assign,OUT,'Mystery-Picture-'+key,skill_title=TITLE[key])
        print(key,nm,{c:a[0] for c,a in assign.items()})
    _,pal=M.load_image('Holidays','candy')
    for key,(nm,cmap) in CUSTOM.items():
        img={'name':nm,'rows':ART[nm]}; assert set(''.join(img['rows']))==set(cmap),key
        assign={c:(v,S[v]) for c,v in cmap.items()}
        M.build(img,pal,assign,OUT,'Mystery-Picture-'+key,skill_title=TITLE[key])
        print(key,nm,cmap)
