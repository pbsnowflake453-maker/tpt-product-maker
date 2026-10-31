import random,json,os,subprocess,sys
from pptx import Presentation
from pptx.util import Pt, Emu
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.oxml.ns import qn
from lxml import etree
OUT='sample-math/'; NAME='Roll-and-Solve-Making-10-SAMPLE'
SKILL='Making 10'; STORE='My Side of the Classroom'
LOGO='/workspace/directed-drawing/tpt/brand/logo-v2.png'
W,H=792,612; BL=RGBColor(0,0,0); WH=RGBColor(255,255,255)
B='___'
# problem = (parts list, answer); parts with None = blank
def p_a(a): return ([str(a),' + ',None,' = 10'],10-a)
def p_b(b): return ([None,' + ',str(b),' = 10'],10-b)
def p_c(a): return (['10 = ',str(a),' + ',None],10-a)
def fill(pool,r):
    out=[]
    while len(out)<36:
        p=pool[:]; r.shuffle(p); out+=p
    out=out[:36]
    key=lambda k:str(out[k])
    for _ in range(5000):
        bad=[k for k in range(36) if any(key(j)==key(k) and j!=k and (j%6==k%6 or j//6==k//6) for j in range(36))]
        if not bad: break
        k=bad[0]; j=r.randrange(36); out[k],out[j]=out[j],out[k]
    return out
r=random.Random(10)
N=range(11)
BOARDS=[fill([p_a(a) for a in N]+[p_b(b) for b in N],r),          # board 1: both forms
        fill([p_b(b) for b in N]+[p_a(a) for a in range(1,10)],r), # board 2: blank-first heavy
        fill([p_c(a) for a in N]+[p_a(a) for a in range(2,9)]+[p_b(b) for b in range(2,9)],r)] # board 3: adds 10 = a + __
def txt(parts,ans=None): return ''.join((B if ans is None else str(ans)) if x is None else x for x in parts)
E=lambda v:Emu(int(v*12700))
P=Presentation(); P.slide_width=E(W); P.slide_height=E(H); blank=P.slide_layouts[6]
def tb(s,x,y,w,h,t,font,size,align=PP_ALIGN.CENTER,bold=False):
    b=s.shapes.add_textbox(E(x),E(y),E(w),E(h)); tf=b.text_frame; tf.word_wrap=True; tf.vertical_anchor=MSO_ANCHOR.MIDDLE
    for i,l in enumerate(t.split('\n')):
        p=tf.paragraphs[0] if i==0 else tf.add_paragraph(); p.alignment=align
        rr=p.add_run(); rr.text=l; rr.font.name=font; rr.font.size=Pt(size); rr.font.color.rgb=BL; rr.font.bold=bold
    return b
def shape(s,kind,x,y,w,h,lw=2):
    sh=s.shapes.add_shape(kind,E(x),E(y),E(w),E(h)); sh.fill.solid(); sh.fill.fore_color.rgb=WH; sh.line.color.rgb=BL; sh.line.width=Pt(lw); return sh
def frame(s): shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,18,18,W-36,H-36,3).adjustments[0]=.04
def bubble(s,x,y,w=190,h=44,size=20):
    b=shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,x,y,w,h,2.5); b.adjustments[0]=.5
    tb(s,x,y,w,h,'Skill: '+SKILL,'Andika',size,bold=True)
def dieshape(s,x,y,sz,n):
    shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,x,y,sz,sz,1.6)
    pp={1:[(1,1)],2:[(0,0),(2,2)],3:[(0,0),(1,1),(2,2)],4:[(0,0),(0,2),(2,0),(2,2)],5:[(0,0),(0,2),(1,1),(2,0),(2,2)],6:[(0,0),(0,1),(0,2),(2,0),(2,1),(2,2)]}[n]
    for a,b in pp:
        d=s.shapes.add_shape(MSO_SHAPE.OVAL,E(x+sz*(.25+.25*a)-sz*.08),E(y+sz*(.25+.25*b)-sz*.08),E(sz*.16),E(sz*.16))
        d.fill.solid(); d.fill.fore_color.rgb=BL; d.line.fill.background()
def border(cell):
    tcPr=cell._tc.get_or_add_tcPr()
    for tag in ('a:lnB','a:lnT','a:lnR','a:lnL'):
        ln=etree.Element(qn(tag),w='19050'); sf=etree.SubElement(ln,qn('a:solidFill')); etree.SubElement(sf,qn('a:srgbClr'),val='000000'); tcPr.insert(0,ln)
def footer(s): tb(s,0,H-34,W,14,f'© {STORE}','Andika',9)
def grid(s,probs,key=False):
    gx,gy,gw=60,142,W-120; cw=gw/6; hh=56; rh=(H-142-44-hh)/6
    t=s.shapes.add_table(7,6,E(gx),E(gy),E(gw),E(hh+6*rh)).table
    for j in range(7): t.rows[j].height=E(hh if j==0 else rh)
    for i in range(6): t.columns[i].width=E(cw)
    for j in range(7):
        for i in range(6):
            c=t.cell(j,i); border(c); c.vertical_anchor=MSO_ANCHOR.MIDDLE; c.margin_left=c.margin_right=E(2)
            c.text_frame.word_wrap=False; p=c.text_frame.paragraphs[0]; p.alignment=PP_ALIGN.CENTER
            if j:
                parts,ans=probs[(j-1)*6+i]
                for x in parts:
                    rr=p.add_run(); rr.font.name='Andika'; rr.font.size=Pt(15); rr.font.color.rgb=BL
                    if x is None:
                        if key: rr.text=str(ans); rr.font.bold=True; rr.font.underline=True
                        else: rr.text=B
                    else: rr.text=x.replace(' ','\u00a0')
    for i in range(6): dieshape(s,gx+i*cw+cw/2-22,gy+9,44,i+1)
def pboard(probs,num,key=False):
    s=P.slides.add_slide(blank); frame(s)
    if not key: tb(s,50,34,400,24,'Name: ______________________________','Andika',15,PP_ALIGN.LEFT)
    tb(s,W-250,34,200,24,f'Board {num}','Andika',11,PP_ALIGN.RIGHT)
    tb(s,150,62,W-300,60,'Answer Key' if key else 'Roll and Solve','Pacifico',36)
    bubble(s,W-50-190,86); grid(s,probs,key); footer(s)
cover_png=OUT+'page-3.png'
# cover
s=P.slides.add_slide(blank); frame(s)
tb(s,0,40,W,90,'Roll and Solve','Pacifico',54)
b0=shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,W/2-150,130,300,64,3); b0.adjustments[0]=.5; tb(s,W/2-150,130,300,64,'Skill: '+SKILL,'Andika',32,bold=True)
tb(s,0,205,W,26,'3 game boards  •  How to Play  •  Answer keys','Andika',17)
if os.path.exists(cover_png): s.shapes.add_picture(cover_png,E(70),E(H-60-H*.42),E(W*.42),E(H*.42))
s.shapes.add_picture(LOGO,E(W-70-230-40),E(H-60-H*.42),E(230))
tb(s,W-70-270,H-60,230,20,STORE,'Andika',12)
# how to play
s=P.slides.add_slide(blank); frame(s); tb(s,0,40,W,70,'How to Play','Pacifico',40)
tb(s,70,125,W-140,400,"You need: one game board, one die, and a pencil.\n\nPlay alone:\n1. Roll the die.\n2. Find the column with the same number of dots at the top.\n3. Solve the next problem down in that column. Write the missing number to make 10.\n4. Keep rolling until you have solved every problem on the board.\n\nPartner game: Take turns rolling and solving. If your partner agrees your answer is correct, keep it. The player who solves the most problems wins.\n\nRace to the bottom: Each player picks a column. Roll and solve. The first to solve every problem in a column wins!\n\nCheck your work with the answer keys at the back.",'Andika',15,PP_ALIGN.LEFT).text_frame.vertical_anchor=MSO_ANCHOR.TOP
for i,b in enumerate(BOARDS): pboard(b,i+1)
for i,b in enumerate(BOARDS): pboard(b,i+1,key=True)
s=P.slides.add_slide(blank); frame(s); tb(s,0,40,W,70,'Terms of Use','Pacifico',38)
tb(s,70,120,W-280,380,"Thank you for your purchase!\n\nYou may:\n• Use this resource in your own classroom with your own students.\n• Print copies for your students and their families.\n• Use it for in-person or distance learning with your own class (in a password-protected platform).\n\nYou may not:\n• Share, resell, or give this resource to other teachers. Please send them to my store!\n• Post it on a public website, shared drive, or file-sharing site.\n• Claim it as your own or use any part of it in products for sale.\n\nLicenses: This purchase is for one teacher. Additional licenses are available at a discount on TpT.\n\n© "+STORE+". All rights reserved.",'Andika',14,PP_ALIGN.LEFT).text_frame.vertical_anchor=MSO_ANCHOR.TOP
s.shapes.add_picture(LOGO,E(W-70-150),E(H-60-150),E(150))
# Google Slides safety
for sl in P.slides:
    sl.background.fill.solid(); sl.background.fill.fore_color.rgb=WH
    for sh in sl.shapes:
        st=sh._element.find(qn('p:style'))
        if st is not None: sh._element.remove(st)
        if sh.has_table:
            pr=sh._element.find('.//'+qn('a:tblPr'))
            for a in list(pr.attrib): del pr.attrib[a]
            for x in pr.findall(qn('a:tableStyleId')): pr.remove(x)
            for c in sh.table.iter_cells(): c.fill.solid(); c.fill.fore_color.rgb=WH
P.save(OUT+NAME+'.pptx')
json.dump({'boards':[[txt(*[q[0]]) for q in b] for b in BOARDS],'answers':[[q[1] for q in b] for b in BOARDS]},open(OUT+'content.json','w'),indent=1)
