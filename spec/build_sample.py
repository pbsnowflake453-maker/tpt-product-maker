import random
from reportlab.lib.pagesizes import letter, landscape
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
F='fonts/'
for n,f in [('Pacifico','Pacifico-Regular'),('Andika','Andika-Regular'),('AndikaB','Andika-Bold')]:
    pdfmetrics.registerFont(TTFont(n,F+f+'.ttf'))
SKILL='/ou/'; STORE='My Side of the Classroom'
LOGO='/workspace/directed-drawing/tpt/brand/logo-v2.png'
WORDS="out, about, shout, scout, trout, spout, sprout, snout, pout, stout, loud, cloud, proud, ouch, couch, pouch, crouch, grouch, slouch, count, mount, amount, bounce, pounce, ounce, found, round, sound, pound, ground, bound, hound, mound, around, mouse, house, blouse, mouth, south, noun, our, flour, sour, hour, cloudy, outside, without, thousand, mountain, fountain, lighthouse, doghouse, playground, trousers".split(', ')
W,H=landscape(letter)
W1="out shout scout trout spout sprout snout pout stout loud cloud proud ouch couch pouch crouch grouch slouch count mount bounce pounce ounce found round sound pound ground bound hound mound mouse house blouse mouth south noun our flour sour hour".split()
W2="about amount around cloudy outside without thousand mountain fountain lighthouse doghouse playground trousers".split()
assert sorted(W1+W2)==sorted(WORDS)
# CKLA audit (G1 Skills 3E: /ou/>'ou' = Unit 3 Lesson 9)
LATE={'bounce':"/s/>'ce' (Unit 5)",'pounce':"/s/>'ce' (Unit 5)",'ounce':"/s/>'ce' (Unit 5)",
 'mouse':"/s/>'se' (Unit 5)",'house':"/s/>'se' (Unit 5)",'blouse':"/s/>'se' (Unit 5)",'hour':"silent 'h' (not in basic code)"}
DEC=[w for w in W1 if w not in LATE]
CH1=[w for w in W1 if w in LATE]; CH2=W2[:]
def fill(pool,r):
    out=[]
    while len(out)<36:
        p=pool[:]; r.shuffle(p)
        out+=p
    out=out[:36]
    # avoid same word twice in a column
    for _ in range(5000):
        bad=[k for k in range(36) if out.count(out[k])>1 and any(out[j]==out[k] and j!=k and (j%6==k%6 or j//6==k//6) for j in range(36))]
        if not bad: break
        k=bad[0]; j=r.randrange(36); out[k],out[j]=out[j],out[k]
    return out
def boards(seed=7):
    r=random.Random(seed)
    return [fill(DEC,r),fill(DEC,r),fill(CH2+CH1,r)]
def _old(seed=7):
    r=random.Random(seed); out=[]
    for i in range(3):
        w=WORDS[:]; r.shuffle(w)
        while len(w)<36: w+=r.sample(WORDS,min(36-len(w),len(WORDS)))
        out.append(w[:36])
    return out
BOARDS=boards()
def die(c,x,y,s,n):
    c.setLineWidth(1.6); c.roundRect(x,y,s,s,s*.18,stroke=1,fill=0)
    p={1:[(1,1)],2:[(0,2),(2,0)],3:[(0,2),(1,1),(2,0)],4:[(0,0),(0,2),(2,0),(2,2)],5:[(0,0),(0,2),(1,1),(2,0),(2,2)],6:[(0,0),(0,1),(0,2),(2,0),(2,1),(2,2)]}[n]
    for a,b in p:
        c.circle(x+s*(.25+.25*a),y+s*(.25+.25*b),s*.08,stroke=0,fill=1)
def fit(c,t,font,size,maxw):
    while c.stringWidth(t,font,size)>maxw and size>6: size-=.5
    return size
def board(c,words,ox=0,oy=0,sc=1.0,num=None,chal=False):
    c.saveState(); c.translate(ox,oy); c.scale(sc,sc)
    c.setLineWidth(3); c.roundRect(18,18,W-36,H-36,18)
    c.setFont('Andika',15); c.drawString(50,H-56,'Name:'); c.setLineWidth(1); c.line(100,H-58,330,H-58)
    if num: c.setFont('Andika',11); c.drawRightString(W-50,H-56,f'Board {num}')
    c.setFont('Pacifico',40); c.drawCentredString(W/2,H-112,'Roll and Read')
    bw,bh=150,44; bx,by=W-50-bw,H-130
    c.setLineWidth(2.5); c.roundRect(bx,by,bw,bh,22); c.setFont('AndikaB',22); c.drawCentredString(bx+bw/2,by+14,'Skill: '+SKILL)
    if chal:
        cx,cy=50,H-130; c.setFillGray(0); c.roundRect(cx,cy,150,bh,22,stroke=0,fill=1); c.setFillGray(1)
        c.setFont('AndikaB',22); c.drawCentredString(cx+75,cy+14,'Challenge!'); c.setFillGray(0)
    gx,gy,gw=60,44,W-120; cw=gw/6; hh=56; rh=(H-142-gy-hh)/6
    top=gy+6*rh+hh
    c.setLineWidth(2); c.rect(gx,gy,gw,6*rh+hh)
    for i in range(1,6): c.line(gx+i*cw,gy,gx+i*cw,top)
    for j in range(7): c.setLineWidth(2 if j==6 else 1); c.line(gx,gy+j*rh,gx+gw,gy+j*rh)
    for i in range(6): die(c,gx+i*cw+cw/2-22,gy+6*rh+9,44,i+1)
    for k,wd in enumerate(words):
        col,row=k%6,k//6
        s=fit(c,wd,'Andika',26,cw-14); c.setFont('Andika',s)
        c.drawCentredString(gx+col*cw+cw/2,gy+(5-row)*rh+rh/2-s*.33,wd)
    c.restoreState()
def footer(c):
    c.setFont('Andika',9); c.drawCentredString(W/2,26,f'© {STORE}')
c=canvas.Canvas('sample/Roll-and-Read-ou-SAMPLE.pdf',pagesize=(W,H)); c.setTitle('Roll and Read: ou')
# cover
c.setLineWidth(4); c.roundRect(18,18,W-36,H-36,20)
c.setFont('Pacifico',58); c.drawCentredString(W/2,H-110,'Roll and Read')
c.setLineWidth(3); c.roundRect(W/2-110,H-190,220,64,32); c.setFont('AndikaB',36); c.drawCentredString(W/2,H-170,'Skill: '+SKILL)
c.setFont('Andika',17); c.drawCentredString(W/2,H-222,'2 game boards + 1 Challenge board  •  How to Play  •  Word list')
sc=.42; pw,ph=W*sc,H*sc; px=70; py=60
c.setLineWidth(1); c.rect(px,py,pw,ph); board(c,BOARDS[0],px,py,sc)
img=ImageReader(LOGO); iw,ih=img.getSize(); lw=230; lh=lw*ih/iw
if lh>ph: lh=ph; lw=lh*iw/ih
c.drawImage(img,W-70-lw-40,py+(ph-lh)/2,lw,lh,mask='auto')
c.setFont('Andika',12); c.drawCentredString(W-70-lw/2-40,py-4+0,STORE)
c.showPage()
# how to play
c.setLineWidth(3); c.roundRect(18,18,W-36,H-36,18)
c.setFont('Pacifico',42); c.drawCentredString(W/2,H-92,'How to Play')
y=H-150
def para(title,lines):
    global y
    c.setFont('AndikaB',20); c.drawString(70,y,title); y-=26
    c.setFont('Andika',15)
    for l in lines: c.drawString(90,y,l); y-=22
    y-=10
para('You need:',['• one game board  • one die  • a pencil or crayon (optional)'])
para('Play alone:',['1. Roll the die.','2. Find the column with the same number of dots at the top.','3. Read the next word down in that column. Color it in or mark it if you like.','4. Keep rolling until you have read every word on the board.'])
para('Partner game:',['Take turns rolling and reading. If your partner agrees you read the word correctly, mark it.','The player who reads the most words wins.'])
para('Race to the bottom:',['Each player picks a column. Roll and read. The first to read every word in a column wins!'])
footer(c); c.showPage()
for i,b in enumerate(BOARDS): board(c,b,num=i+1,chal=i==2); footer(c); c.showPage()
# word list
c.setLineWidth(3); c.roundRect(18,18,W-36,H-36,18)
c.setFont('Pacifico',40); c.drawString(60,H-92,'Word List')
bx,by=W-36-124,H-36-72; c.setLineWidth(2.5); c.roundRect(W-50-150,H-100,150,44,22); c.setFont('AndikaB',22); c.drawCentredString(W-125,H-86,'Skill: '+SKILL)
bx,by=W-36-124,H-36-72
USED=set(w for b in BOARDS for w in b)  # word list shows only words used on the boards
ws=sorted(w for w in DEC if w in USED); _c1=sorted(w for w in CH1 if w in USED); _c2=sorted(w for w in CH2 if w in USED); ws2=_c1+(['']+_c2 if _c2 else []); per=12; cols=3
c.setFont('AndikaB',18); c.drawString(70,H-135,f'Decodable Words ({len(ws)})'); c.drawString(470,H-135,f'Challenge Words ({len(_c1)+len(_c2)})')
c.setFont('Andika',10); c.drawString(470,H-150,'Use spellings taught after /ou/ or two syllables')
c.setLineWidth(1); c.line(450,60,450,H-120)
for k,wd in enumerate(ws):
    c.setFont('Andika',16); c.drawString(75+(k//per)*120,H-168-(k%per)*30,wd)
for k,wd in enumerate(ws2):
    c.setFont('Andika',16); c.drawString(475+(k//11)*140,H-182-(k%11)*28,wd)
footer(c); c.showPage()
# terms
c.setLineWidth(3); c.roundRect(18,18,W-36,H-36,18)
c.setFont('Pacifico',40); c.drawCentredString(W/2,H-92,'Terms of Use')
t=[('Thank you for your purchase!',None),
('You may:',['• Use this resource in your own classroom with your own students.','• Print copies for your students and their families.','• Use it for in-person or distance learning with your own class (in a password-protected platform).']),
('You may not:',['• Share, resell, or give this resource to other teachers. Please send them to my store!','• Post it on a public website, shared drive, or file-sharing site.','• Claim it as your own or use any part of it in products for sale.']),
('Licenses:',['This purchase is for one teacher. Additional licenses are available at a discount on TpT.'])]
y=H-140
for h,ls in t:
    c.setFont('AndikaB',18); c.drawString(70,y,h); y-=24; c.setFont('Andika',14)
    for l in ls or []: c.drawString(90,y,l); y-=20
    y-=8
c.drawImage(img,W-70-150,40,150,150*ih/iw,mask='auto')
c.setFont('Andika',13); c.drawString(70,60,f'© {STORE}. All rights reserved.')
c.showPage(); c.save()
import json; json.dump({'decodable':DEC,'challenge_one_syl':CH1,'challenge_two_syl':CH2,'late':LATE,'boards':BOARDS},open('sample/content.json','w'),indent=1)
# ---- PPTX ----
from pptx import Presentation
from pptx.util import Pt, Emu
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
P=Presentation(); P.slide_width=Emu(int(W*12700)); P.slide_height=Emu(int(H*12700))
E=lambda v:Emu(int(v*12700)); BL=RGBColor(0,0,0)
def tb(s,x,y,w,h,t,font,size,align=PP_ALIGN.CENTER):
    b=s.shapes.add_textbox(E(x),E(y),E(w),E(h)); tf=b.text_frame; tf.word_wrap=True; tf.vertical_anchor=MSO_ANCHOR.MIDDLE
    for i,l in enumerate(t.split('\n')):
        p=tf.paragraphs[0] if i==0 else tf.add_paragraph(); p.alignment=align
        r=p.add_run(); r.text=l; r.font.name=font; r.font.size=Pt(size); r.font.color.rgb=BL
    return b
def shape(s,kind,x,y,w,h,lw=2):
    sh=s.shapes.add_shape(kind,E(x),E(y),E(w),E(h)); sh.fill.background(); sh.line.color.rgb=BL; sh.line.width=Pt(lw); return sh
def frame(s): shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,18,18,W-36,H-36,3).adjustments[0]=.04
def bubble(s,x,y):
    b=shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,x,y,150,44,2.5); b.adjustments[0]=.5
    tb(s,x,y,150,44,'Skill: '+SKILL,'Andika',20).text_frame.paragraphs[0].runs[0].font.bold=True
def dieshape(s,x,y,sz,n):
    shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,x,y,sz,sz,1.6)
    p={1:[(1,1)],2:[(0,0),(2,2)],3:[(0,0),(1,1),(2,2)],4:[(0,0),(0,2),(2,0),(2,2)],5:[(0,0),(0,2),(1,1),(2,0),(2,2)],6:[(0,0),(0,1),(0,2),(2,0),(2,1),(2,2)]}[n]
    for a,b in p:
        d=s.shapes.add_shape(MSO_SHAPE.OVAL,E(x+sz*(.25+.25*a)-sz*.08),E(y+sz*(.25+.25*b)-sz*.08),E(sz*.16),E(sz*.16))
        d.fill.solid(); d.fill.fore_color.rgb=BL; d.line.fill.background()
blank=P.slide_layouts[6]
from pptx.oxml.ns import qn
from lxml import etree
def border(cell):
    tcPr=cell._tc.get_or_add_tcPr()
    for tag in ('a:lnL','a:lnR','a:lnT','a:lnB'):
        ln=etree.SubElement(tcPr,qn(tag),w='19050'); sf=etree.SubElement(ln,qn('a:solidFill')); etree.SubElement(sf,qn('a:srgbClr'),val='000000')
        tcPr.insert(0,ln)
def pboard(words,num,chal=False):
    s=P.slides.add_slide(blank); frame(s)
    tb(s,50,38,400,24,'Name: ______________________________','Andika',15,PP_ALIGN.LEFT); tb(s,W-250,38,200,24,f'Board {num}','Andika',11,PP_ALIGN.RIGHT)
    tb(s,150,62,W-300,60,'Roll and Read','Pacifico',36); bubble(s,W-50-150,86)
    if chal:
        cb=s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,E(50),E(86),E(150),E(44)); cb.adjustments[0]=.5; cb.fill.solid(); cb.fill.fore_color.rgb=BL; cb.line.fill.background()
        t2=tb(s,50,86,150,44,'Challenge!','Andika',20); t2.text_frame.paragraphs[0].runs[0].font.bold=True; t2.text_frame.paragraphs[0].runs[0].font.color.rgb=RGBColor(255,255,255)
    gx,gy,gw=60,142,W-120; cw=gw/6; hh=56; rh=(H-142-44-hh)/6
    t=s.shapes.add_table(7,6,E(gx),E(gy),E(gw),E(hh+6*rh)).table
    for j in range(7): t.rows[j].height=E(hh if j==0 else rh)
    for i in range(6): t.columns[i].width=E(cw)
    for j in range(7):
        for i in range(6):
            cell=t.cell(j,i); cell.fill.background(); border(cell); cell.vertical_anchor=MSO_ANCHOR.MIDDLE
            tf=cell.text_frame; p=tf.paragraphs[0]; p.alignment=PP_ALIGN.CENTER
            if j:
                r=p.add_run(); wd=words[(j-1)*6+i]; r.text=wd; r.font.name='Andika'; r.font.size=Pt(22 if len(wd)<9 else 17); r.font.color.rgb=BL
    for i in range(6): dieshape(s,gx+i*cw+cw/2-22,gy+9,44,i+1)
    tb(s,0,H-34,W,14,f'© {STORE}','Andika',9)
s=P.slides.add_slide(blank); frame(s)
tb(s,0,40,W,90,'Roll and Read','Pacifico',54); s.shapes[-0] if 0 else None; b0=shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,W/2-110,130,220,64,3); b0.adjustments[0]=.5; tb(s,W/2-110,130,220,64,'Skill: '+SKILL,'Andika',32).text_frame.paragraphs[0].runs[0].font.bold=True
tb(s,0,205,W,26,'2 game boards + 1 Challenge board  •  How to Play  •  Word list','Andika',17)
s.shapes.add_picture('sample/page-3.png',E(70),E(H-60-H*.42),E(W*.42),E(H*.42))
s.shapes.add_picture(LOGO,E(W-70-230-40),E(H-60-H*.42),E(230))
tb(s,W-70-270,H-60,230,20,STORE,'Andika',12)
s=P.slides.add_slide(blank); frame(s); tb(s,0,40,W,70,'How to Play','Pacifico',40)
tb(s,70,130,W-140,380,"You need: one game board, one die, and a pencil or crayon (optional).\n\nPlay alone:\n1. Roll the die.\n2. Find the column with the same number of dots at the top.\n3. Read the next word down in that column. Color it in or mark it if you like.\n4. Keep rolling until you have read every word on the board.\n\nPartner game: Take turns rolling and reading. If your partner agrees you read the word correctly, mark it. The player who reads the most words wins.\n\nRace to the bottom: Each player picks a column. Roll and read. The first to read every word in a column wins!",'Andika',15,PP_ALIGN.LEFT)
for i,b in enumerate(BOARDS): pboard(b,i+1,i==2)
s=P.slides.add_slide(blank); frame(s); tb(s,60,40,300,70,'Word List','Pacifico',38,PP_ALIGN.LEFT); bubble(s,W-50-150,56)
tb(s,70,118,380,26,f'Decodable Words ({len(ws)})','Andika',18,PP_ALIGN.LEFT).text_frame.paragraphs[0].runs[0].font.bold=True
tb(s,470,118,300,26,f'Challenge Words ({len(_c1)+len(_c2)})','Andika',18,PP_ALIGN.LEFT).text_frame.paragraphs[0].runs[0].font.bold=True
for k in range(cols): tb(s,75+k*120,150,120,420,'\n'.join(ws[k*per:(k+1)*per]),'Andika',15,PP_ALIGN.LEFT).text_frame.vertical_anchor=MSO_ANCHOR.TOP
for k in range(2): tb(s,475+k*140,150,140,400,'\n'.join(ws2[k*11:(k+1)*11]),'Andika',15,PP_ALIGN.LEFT).text_frame.vertical_anchor=MSO_ANCHOR.TOP
s=P.slides.add_slide(blank); frame(s); tb(s,0,40,W,70,'Terms of Use','Pacifico',38)
tb(s,70,120,W-280,380,"Thank you for your purchase!\n\nYou may:\n• Use this resource in your own classroom with your own students.\n• Print copies for your students and their families.\n• Use it for in-person or distance learning with your own class (in a password-protected platform).\n\nYou may not:\n• Share, resell, or give this resource to other teachers. Please send them to my store!\n• Post it on a public website, shared drive, or file-sharing site.\n• Claim it as your own or use any part of it in products for sale.\n\nLicenses: This purchase is for one teacher. Additional licenses are available at a discount on TpT.\n\n© "+STORE+". All rights reserved.",'Andika',14,PP_ALIGN.LEFT).text_frame.vertical_anchor=MSO_ANCHOR.TOP
s.shapes.add_picture(LOGO,E(W-70-150),E(H-60-150),E(150))
def clean(P):
    for sl in P.slides:
        for sh in sl.shapes:
            st=sh._element.find(qn('p:style'))
            if st is not None: sh._element.remove(st)
            if sh.has_text_frame:
                for p in sh.text_frame.paragraphs:
                    for r in p.runs: r.font.color.rgb=r.font.color.rgb if r.font.color and r.font.color.type else BL
            if sh.has_table:
                tbl=sh._element.find('.//'+qn('a:tbl')); pr=tbl.find(qn('a:tblPr'))
                for a in list(pr.attrib): del pr.attrib[a]
                for x in pr.findall(qn('a:tableStyleId')): pr.remove(x)
                for c in sh.table.iter_cells():
                    c.fill.solid(); c.fill.fore_color.rgb=RGBColor(255,255,255)
clean(P)
P.save('sample/Roll-and-Read-ou-SAMPLE.pptx')
