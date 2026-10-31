"""Roll and Read for G1 U3: runs build_sample.py with parameters swapped in (template reuse)."""
import random,sys,os,subprocess,math
sys.path.insert(0,'/workspace/tpt-generator'); import u3_config as C
src=open('/workspace/tpt-generator/build_sample.py').read()
def rep(a,b,n=None):
    global src
    k=src.count(a); assert k and (n is None or k==n),(a,k); src=src.replace(a,b)
rep("SKILL='/ou/'","SKILL=P_SKILL")
start=src.index('WORDS="'); end=src.index('def fill(')
src=src[:start]+"W,H=landscape(letter)\nDEC=P_DEC; CH1=[]; CH2=P_REV; LATE={}\n"+src[end:]
rep("BOARDS=boards()","BOARDS=P_BOARDS")
rep("bw,bh=150,44; bx,by=W-50-bw,H-130","bw,bh=210,44; bx,by=W-50-bw,H-130")
rep("c.setFont('AndikaB',22); c.drawCentredString(bx+bw/2,by+14,'Skill: '+SKILL)","_s=fit(c,'Skill: '+SKILL,'AndikaB',22,bw-20); c.setFont('AndikaB',_s); c.drawCentredString(bx+bw/2,by+15,'Skill: '+SKILL)")
rep("c.drawCentredString(cx+75,cy+14,'Challenge!')","c.drawCentredString(cx+75,cy+14,'Review Mix')")
rep("c.roundRect(W/2-110,H-190,220,64,32); c.setFont('AndikaB',36)","c.roundRect(W/2-170,H-190,340,64,32); c.setFont('AndikaB',fit(c,'Skill: '+SKILL,'AndikaB',36,310))")
rep("'2 game boards + 1 Challenge board  •  How to Play  •  Word list'","P_COVERLINE",2)
rep("c.roundRect(W-50-150,H-100,150,44,22); c.setFont('AndikaB',22); c.drawCentredString(W-125,H-86,'Skill: '+SKILL)","c.roundRect(W-50-210,H-100,210,44,22); c.setFont('AndikaB',fit(c,'Skill: '+SKILL,'AndikaB',22,190)); c.drawCentredString(W-155,H-85,'Skill: '+SKILL)")
rep("ws2=sorted(CH1)+['']+sorted(CH2); per=12; cols=3","ws2=sorted(CH2); cols=3; per=max(12,math.ceil(len(ws)/3)); step=min(30,360/per)")
rep("f'Challenge Words ({len(CH1)+len(CH2)})'","(f'Review Words ({len(CH2)})' if CH2 else '')",2)
rep("'Use spellings taught after /ou/ or two syllables'","P_NOTE")
rep("H-168-(k%per)*30","H-168-(k%per)*step")
rep("c.line(450,60,450,H-120)","(c.line(450,60,450,H-120) if CH2 else None)")
rep("    tb(s,x,y,150,44,'Skill: '+SKILL,'Andika',20)","    tb(s,x,y,210,44,'Skill: '+SKILL,'Andika',16)")
rep("b=shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,x,y,150,44,2.5)","b=shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,x,y,210,44,2.5)")
rep("bubble(s,W-50-150,","bubble(s,W-50-210,")
rep("'Challenge!','Andika',20","'Review Mix','Andika',18")
rep("b0=shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,W/2-110,130,220,64,3); b0.adjustments[0]=.5; tb(s,W/2-110,130,220,64,'Skill: '+SKILL,'Andika',32)","b0=shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,W/2-170,130,340,64,3); b0.adjustments[0]=.5; tb(s,W/2-170,130,340,64,'Skill: '+SKILL,'Andika',26)")
rep("'\\n'.join(ws[k*per:(k+1)*per]),'Andika',15","'\\n'.join(ws[k*per:(k+1)*per]),'Andika',15 if per<=13 else 11")
rep("sample/Roll-and-Read-ou-SAMPLE.pdf","'+P_OUT+'.pdf"); rep("sample/Roll-and-Read-ou-SAMPLE.pptx","'+P_OUT+'.pptx")
rep("'sample/content.json'","P_OUT+'.json'"); rep("'sample/page-3.png'","P_OUT+'-p3.png'")
rep("c.setTitle('Roll and Read: ou')","c.setTitle('Roll and Read: '+SKILL)")
rep("chal=i==2","chal=i==2 and P_MIX"); rep("pboard(b,i+1,i==2)","pboard(b,i+1,i==2 and P_MIX)")
rep("f'Decodable Words ({len(ws)})'","P_WLABEL+f' ({len(ws)})'",2)
rep("# ---- PPTX ----","import subprocess; subprocess.run(['pdftoppm','-png','-r','60','-f','3','-l','3','-singlefile',P_OUT+'.pdf',P_OUT+'-p3'])\n# ---- PPTX ----")
src=src.replace("'"+"'+P_OUT+'","P_OUT+'")  # clean leading ''+
src="import math\n"+src
def run(key,label,target,review,outdir):
    exec_ns={}
    # reuse fill() from template for column-safe shuffles
    ns={'__name__':'rr'}
    r=random.Random(hash(key)%1000)
    pre=src.split("DEC=P_DEC")[0]
    tricky=key=='tricky'
    exec(compile(src.split('def fill(')[0].split('DEC=P_DEC')[0],'x','exec'),ns) if 0 else None
    fsrc='def fill('+src.split('def fill(')[1].split('def boards(')[0]
    exec(fsrc,ns); fill=ns['fill']
    if tricky: boards=[fill(target,r),fill(target,r),fill(target,r)]; rev=[]
    else:
        mix=target[:] + random.Random(3).sample(review,min(len(review),12))
        boards=[fill(target,r),fill(target,r),fill(mix,r)]
        rev=sorted(set(mix)-set(target))
    os.makedirs(outdir,exist_ok=True); out=os.path.join(outdir,'Roll-and-Read-'+key)
    g=dict(P_SKILL=label,P_DEC=target,P_REV=rev,P_BOARDS=boards,P_OUT=out,
      P_COVERLINE=('3 game boards  •  How to Play  •  Word list' if tricky else '2 game boards + 1 Review Mix board  •  How to Play  •  Word list'),
      P_NOTE=('Words with earlier CKLA spellings on the Review Mix board' if rev else ''),P_MIX=not tricky,P_WLABEL='Tricky Words' if tricky else 'Decodable Words',__name__='rr')
    cwd=os.getcwd(); os.chdir('/workspace/tpt-generator'); exec(compile(src,'rr','exec'),g); os.chdir(cwd)
    if not tricky and boards[2]: pass
    return out
if __name__=='__main__':
    keys=sys.argv[1:] or [s[0] for s in C.SKILLS]
    for s in C.SKILLS:
        if s[0] in keys: print(run(s[0],s[1],s[3],s[4],'/workspace/tpt-generator/out/G1-U3/parts/rr'))
