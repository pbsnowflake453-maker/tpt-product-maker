import random,json,os
from pptx import Presentation
from pptx.util import Pt, Emu
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.dml import MSO_LINE
from pptx.dml.color import RGBColor
from pptx.oxml.ns import qn
OUT='sample-taskcards/'; NAME='Task-Cards-Making-10-SAMPLE'
SKILL='Making 10'; STORE='My Side of the Classroom'
LOGO='/workspace/directed-drawing/tpt/brand/logo-v2.png'
W,H=792,612; BL=RGBColor(0,0,0); WH=RGBColor(255,255,255); B='___'
L=[chr(65+i) for i in range(24)]
probs=[(f'{a} + {B} = 10',10-a) for a in range(1,10)]+[(f'{B} + {b} = 10',10-b) for b in range(1,10)]+[(f'10 = {a} + {B}',10-a) for a in (2,3,4,6,7,8)]
r=random.Random(24); r.shuffle(probs)
assert len(set(p for p,_ in probs))==24
E=lambda v:Emu(int(v*12700))
P=Presentation(); P.slide_width=E(W); P.slide_height=E(H); blank=P.slide_layouts[6]
def tb(s,x,y,w,h,t,font,size,align=PP_ALIGN.CENTER,bold=False,top=False):
    b=s.shapes.add_textbox(E(x),E(y),E(w),E(h)); tf=b.text_frame; tf.word_wrap=True
    tf.vertical_anchor=MSO_ANCHOR.TOP if top else MSO_ANCHOR.MIDDLE
    for i,l in enumerate(t.split('\n')):
        p=tf.paragraphs[0] if i==0 else tf.add_paragraph(); p.alignment=align
        rr=p.add_run(); rr.text=l; rr.font.name=font; rr.font.size=Pt(size); rr.font.color.rgb=BL; rr.font.bold=bold
    return b
def shape(s,kind,x,y,w,h,lw=2,fill=WH,dash=None):
    sh=s.shapes.add_shape(kind,E(x),E(y),E(w),E(h)); sh.fill.solid(); sh.fill.fore_color.rgb=fill
    sh.line.color.rgb=BL; sh.line.width=Pt(lw)
    if dash: sh.line.dash_style=dash
    return sh
def rr(s,x,y,w,h,lw=2,adj=.08,dash=None):
    a=shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,x,y,w,h,lw,dash=dash); a.adjustments[0]=adj; return a
def frame(s): rr(s,18,18,W-36,H-36,3,.04)
def footer(s): tb(s,0,H-34,W,14,f'© {STORE}','Andika',9)
def name(s): tb(s,50,30,500,24,'Name: ______________________________','Andika',15,PP_ALIGN.LEFT)
def bubble(s,x,y,w,h,size):
    b=rr(s,x,y,w,h,1.5,.5); tb(s,x,y,w,h,'Skill: '+SKILL,'Andika',size,bold=True)
def line(s,x1,y1,x2,y2):
    c=s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT,E(x1),E(y1),E(x2),E(y2)); c.line.color.rgb=BL; c.line.width=Pt(3.5); c.line.dash_style=MSO_LINE.ROUND_DOT
def card(s,x,y,w,h,letter,prob):
    rr(s,x,y,w,h,3,.1)                       # outer border
    rr(s,x+8,y+8,w-16,h-16,1.25,.08,MSO_LINE.DASH)  # stitched inner border
    for cx,cy in ((x+8,y+8),(x+w-8,y+8),(x+8,y+h-8),(x+w-8,y+h-8)):  # corner hearts
        shape(s,MSO_SHAPE.HEART,cx-8,cy-8,16,16,1.25,fill=BL)
    c=shape(s,MSO_SHAPE.OVAL,x+20,y+20,46,46,2.5); tb(s,x+20,y+20,46,46,letter,'Andika',22,bold=True)
    bubble(s,x+w-20-100,y+30,100,22,9)
    tb(s,x+20,y+70,w-40,h-110,prob,'Andika',40,bold=True)
# cover
s=P.slides.add_slide(blank); frame(s)
tb(s,0,36,W,90,'Task Cards','Pacifico',56)
b0=rr(s,W/2-150,130,300,60,3,.5); tb(s,W/2-150,130,300,60,'Skill: '+SKILL,'Andika',30,bold=True)
tb(s,0,200,W,26,'24 task cards  •  3 recording sheets  •  Answer key','Andika',17)
card(s,80,255,330,245,'A',probs[0][0])
s.shapes.add_picture(LOGO,E(W-80-250),E(250),E(250))
tb(s,W-80-290,H-70,290,20,STORE,'Andika',12)
# how to use
s=P.slides.add_slide(blank); frame(s); tb(s,0,32,W,64,'How to Use','Pacifico',40)
left="Print the cards and cut on the dotted lines. Each card has a letter, so students write their answer in the matching box on a recording sheet.\n\nScoot: Place one card on each desk. Students solve, record, then \"scoot\" to the next desk when you say so.\n\nMath center: Put the cards and recording sheets in a center for independent practice.\n\nPass it on: Students sit in a circle or rows and pass cards desk to desk on your signal.\n\nWrite the Room: Tape cards around the room. Students walk with a clipboard, find each card, and record the answer."
right="Quiz-Quiz-Trade: Each student gets a card. Partners quiz each other, check, trade cards, and find a new partner.\n\nSmall group: Use a few cards for quick warm-ups, reteaching, or checking understanding.\n\nEarly finishers: Keep a set in a bin for students who finish early.\n\nGrab and go: Draw a card for a quick whole-class warm-up or exit ticket.\n\nSelf-check: Students check their work with the answer key.\n\nTip: Laminate the cards or slip them into sleeves to use again and again."
def rich(x,t):
    b=s.shapes.add_textbox(E(x),E(100),E((W-120)/2),E(470)); tf=b.text_frame; tf.word_wrap=True; tf.vertical_anchor=MSO_ANCHOR.TOP
    for i,l in enumerate(t.split('\n')):
        p=tf.paragraphs[0] if i==0 else tf.add_paragraph()
        k=l.find(':'); segs=[(l[:k+1],True),(l[k+1:],False)] if 0<k<20 else [(l,False)]
        for txt,bd in segs:
            r_=p.add_run(); r_.text=txt; r_.font.name='Andika'; r_.font.size=Pt(13); r_.font.color.rgb=BL; r_.font.bold=bd
rich(50,left); rich(W/2+10,right)
# card pages
m=24; cw=(W-3*m)/2; ch=(H-3*m)/2
for pg in range(6):
    s=P.slides.add_slide(blank)
    for k in range(4):
        i=pg*4+k; card(s,m+(k%2)*(cw+m),m+(k//2)*(ch+m),cw,ch,L[i],probs[i][0])
    line(s,W/2,6,W/2,H-6); line(s,6,H/2,W-6,H/2)
def head(s,title):
    frame(s); name(s); tb(s,150,54,W-300,56,title,'Pacifico',32); bubble(s,W-50-170,64,170,36,15)
# sheet 1
s=P.slides.add_slide(blank); head(s,'Recording Sheet')
for i in range(24):
    col,row=i//12,i%12; x=90+col*330; y=122+row*37
    tb(s,x,y,40,30,L[i]+'.','Andika',17,PP_ALIGN.LEFT,bold=True); tb(s,x+34,y,240,30,'__________________','Andika',17,PP_ALIGN.LEFT)
footer(s)
# sheet 2
def boxes(s,items,cols,rows,y0,y1):
    bw=(W-60)/cols; bh=(y1-y0)/rows
    for n,i in enumerate(items):
        x=30+(n%cols)*bw; y=y0+(n//cols)*bh; shape(s,MSO_SHAPE.RECTANGLE,x,y,bw,bh,2)
        tb(s,x+6,y+4,30,24,L[i],'Andika',15,PP_ALIGN.LEFT,bold=True)
s=P.slides.add_slide(blank); head(s,'Recording Sheet'); boxes(s,range(24),6,4,108,H-38); footer(s)
# sheet 3
for half in (0,1):
    s=P.slides.add_slide(blank); head(s,'Recording Sheet'); tb(s,W-250,30,200,24,f'Page {half+1} of 2','Andika',11,PP_ALIGN.RIGHT)
    boxes(s,range(half*12,half*12+12),4,3,108,H-38); footer(s)
# answer key
s=P.slides.add_slide(blank); frame(s); tb(s,150,30,W-300,60,'Answer Key','Pacifico',34); bubble(s,W-50-170,44,170,36,15)
for i,(p,a) in enumerate(probs):
    col,row=i//12,i%12; x=80+col*340; y=110+row*37
    tb(s,x,y,320,30,f'{L[i]}.   {p.replace(B,str(a))}      ({a})','Andika',16,PP_ALIGN.LEFT)
footer(s)
# terms
s=P.slides.add_slide(blank); frame(s); tb(s,0,40,W,70,'Terms of Use','Pacifico',38)
tb(s,70,120,W-280,380,"Thank you for your purchase!\n\nYou may:\n• Use this resource in your own classroom with your own students.\n• Print copies for your students and their families.\n• Use it for in-person or distance learning with your own class (in a password-protected platform).\n\nYou may not:\n• Share, resell, or give this resource to other teachers. Please send them to my store!\n• Post it on a public website, shared drive, or file-sharing site.\n• Claim it as your own or use any part of it in products for sale.\n\nLicenses: This purchase is for one teacher. Additional licenses are available at a discount on TpT.\n\n© "+STORE+". All rights reserved.",'Andika',14,PP_ALIGN.LEFT,top=True)
s.shapes.add_picture(LOGO,E(W-70-150),E(H-60-150),E(150))
for sl in P.slides:
    sl.background.fill.solid(); sl.background.fill.fore_color.rgb=WH
    for sh in sl.shapes:
        st=sh._element.find(qn('p:style'))
        if st is not None: sh._element.remove(st)
P.save(OUT+NAME+'.pptx')
json.dump({'cards':[{'letter':L[i],'problem':p,'answer':a} for i,(p,a) in enumerate(probs)]},open(OUT+'content.json','w'),indent=1)
