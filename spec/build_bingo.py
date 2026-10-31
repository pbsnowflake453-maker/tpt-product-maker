"""Reusable Bingo builder. python3 build_bingo.py reading|math  (or import build())"""
import random,json,os,subprocess,sys
from pptx import Presentation
from pptx.util import Pt, Emu
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.dml import MSO_LINE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.oxml.ns import qn
from lxml import etree
STORE='My Side of the Classroom'; LOGO='/workspace/directed-drawing/tpt/brand/logo-v2.png'
W,H=612,792; BL=RGBColor(0,0,0); WH=RGBColor(255,255,255)
E=lambda v:Emu(int(v*12700))

def make_boards(squares,size,n,same=True,pool=None,seed=1):
    """squares: list of square labels for same-mode (len = cells - free). Returns list of boards (lists with 'FREE')."""
    r=random.Random(seed); cells=size*size; free=size==5; need=cells-(1 if free else 0)
    out=[]
    for _ in range(n):
        s=list(squares) if same else r.sample(pool,need)
        r.shuffle(s)
        if free: s.insert(cells//2,'FREE')
        out.append(s)
    return out

def build(title_skill,size,boards,calls,howto,outdir,name,square_note,calling_cards=False):
    P=Presentation(); P.slide_width=E(W); P.slide_height=E(H); blank=P.slide_layouts[6]
    def tb(s,x,y,w,h,t,font='Andika',size_=14,align=PP_ALIGN.CENTER,bold=False,top=False):
        b=s.shapes.add_textbox(E(x),E(y),E(w),E(h)); tf=b.text_frame; tf.word_wrap=True
        tf.vertical_anchor=MSO_ANCHOR.TOP if top else MSO_ANCHOR.MIDDLE
        for i,l in enumerate(t.split('\n')):
            p=tf.paragraphs[0] if i==0 else tf.add_paragraph(); p.alignment=align
            bb=bold or l.endswith(':') 
            rr=p.add_run(); rr.text=l; rr.font.name=font; rr.font.size=Pt(size_); rr.font.color.rgb=BL; rr.font.bold=bb
        return b
    def shape(s,kind,x,y,w,h,lw=2):
        sh=s.shapes.add_shape(kind,E(x),E(y),E(w),E(h)); sh.fill.solid(); sh.fill.fore_color.rgb=WH; sh.line.color.rgb=BL; sh.line.width=Pt(lw); return sh
    def frame(s): shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,18,18,W-36,H-36,3).adjustments[0]=.04
    def bubble(s,x,y,w,h,size_):
        b=shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,x,y,w,h,2.5); b.adjustments[0]=.5
        tb(s,x,y,w,h,'Skill: '+title_skill,'Andika',size_,bold=True)
    def footer(s): tb(s,0,H-36,W,14,f'© {STORE}','Andika',9)
    def border(cell):
        tcPr=cell._tc.get_or_add_tcPr()
        for tag in ('a:lnB','a:lnT','a:lnR','a:lnL'):
            ln=etree.Element(qn(tag),w='28575'); sf=etree.SubElement(ln,qn('a:solidFill')); etree.SubElement(sf,qn('a:srgbClr'),val='000000'); tcPr.insert(0,ln)
    # cover
    s=P.slides.add_slide(blank); frame(s)
    tb(s,0,40,W,140,'Bingo','Fredoka',110,bold=True)
    bw=min(W-120,40+len(title_skill)*16+90); bubble(s,W/2-bw/2,180,bw,60,28)
    tb(s,40,255,W-80,50,f'{len(boards)} game boards ({size} x {size})  •  How to Play\nCalling sheet  •  {square_note}','Andika',15)
    s.shapes.add_picture(LOGO,E(W/2-140),E(340),E(280))
    tb(s,0,H-80,W,20,STORE,'Andika',13)
    # how to play
    s=P.slides.add_slide(blank); frame(s); tb(s,0,45,W,70,'How to Play','Pacifico',40)
    tb(s,60,125,W-120,600,howto,'Andika',17,PP_ALIGN.LEFT,top=True)
    footer(s)
    # boards
    gx=48; gw=W-96; gy=200; cw=gw/size
    fs={3:40,4:30,5:24}[size]
    for bi,bd in enumerate(boards):
        s=P.slides.add_slide(blank); frame(s)
        tb(s,46,36,380,26,'Name: ______________________________','Andika',15,PP_ALIGN.LEFT)
        tb(s,46,62,120,20,f'Board {bi+1}','Andika',11,PP_ALIGN.LEFT)
        tb(s,0,70,W,125,'Bingo','Fredoka',84,bold=True)
        bw=min(220,40+len(title_skill)*10+60); bubble(s,W-48-bw,76,bw,38,17)
        t=s.shapes.add_table(size,size,E(gx),E(gy),E(gw),E(gw)).table
        for j in range(size): t.rows[j].height=E(cw)
        for i in range(size): t.columns[i].width=E(cw)
        for j in range(size):
            for i in range(size):
                c=t.cell(j,i); border(c); c.vertical_anchor=MSO_ANCHOR.MIDDLE; c.margin_left=c.margin_right=E(3)
                v=str(bd[j*size+i]); p=c.text_frame.paragraphs[0]; p.alignment=PP_ALIGN.CENTER
                rr=p.add_run(); rr.text=v.upper() if v=='FREE' else v; rr.font.name='Andika'
                rr.font.size=Pt(fs*(0.8 if v=='FREE' else 1)); rr.font.bold=v!='FREE'; rr.font.color.rgb=BL
        if size==5:
            k=size//2; sx=gx+k*cw; sy=gy+k*cw; ss=cw*.5
            st=shape(s,MSO_SHAPE.STAR_5_POINT,sx+(cw-ss)/2,sy+cw*.1,ss,ss,2)
            c=t.cell(k,k); c.vertical_anchor=MSO_ANCHOR.BOTTOM; c.margin_bottom=E(cw*.08)
        footer(s)
    # calling sheet (single page, 2 columns)
    s=P.slides.add_slide(blank); frame(s)
    tb(s,0,40,W,70,'Calling Sheet','Pacifico',40)
    bw=min(W-120,40+len(title_skill)*11+60); bubble(s,W/2-bw/2,112,bw,36,16)
    tb(s,40,152,W-80,22,'Mark each one with a dry erase marker as you call it.','Andika',12)
    rows=(len(calls)+1)//2; top=190; rh=min(40,(H-60-top)/rows); csz=min(22,rh*.6)
    for k,c in enumerate(calls):
        col,row=divmod(k,rows); x=60+col*(W-120)/2; y=top+row*rh
        shape(s,MSO_SHAPE.RECTANGLE,x,y+(rh-csz)/2,csz,csz,1.8)
        tb(s,x+csz+12,y,(W-120)/2-csz-20,rh,c,'Andika',min(20,rh*.5),PP_ALIGN.LEFT,bold=True)
    footer(s)
    if calling_cards:
        cols,rws=3,4; mx,my=36,60; cwd=(W-2*mx)/cols; chh=(H-my-50)/rws
        def cut(s,x1,y1,x2,y2):
            c=s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT,E(x1),E(y1),E(x2),E(y2)); c.line.color.rgb=BL; c.line.width=Pt(3.5); c.line.dash_style=MSO_LINE.ROUND_DOT
        cfs=max(16,min(40,int(cwd*1.5/max(len(c) for c in calls))))
        for p0 in range(0,len(calls),12):
            s=P.slides.add_slide(blank)
            tb(s,0,18,W,36,'Calling Cards','Pacifico',24)
            for i in range(cols+1): cut(s,mx+i*cwd,my,mx+i*cwd,my+-(-len(calls[p0:p0+12])//cols)*chh)
            nr=-(-len(calls[p0:p0+12])//cols)
            for j in range(nr+1): cut(s,mx,my+j*chh,mx+cols*cwd,my+j*chh)
            for k,c in enumerate(calls[p0:p0+12]):
                x=mx+(k%cols)*cwd; y=my+(k//cols)*chh
                tb(s,x+6,y+6,cwd-12,chh-12,c.replace(' ','\u00a0'),'Andika',cfs,bold=True).text_frame.word_wrap=False
            footer(s)
    # terms
    s=P.slides.add_slide(blank); frame(s); tb(s,0,45,W,70,'Terms of Use','Pacifico',38)
    tb(s,60,125,W-120,480,"Thank you for your purchase!\n\nYou may:\n• Use this resource in your own classroom with your own students.\n• Print copies for your students and their families.\n• Use it for in-person or distance learning with your own class (in a password-protected platform).\n\nYou may not:\n• Share, resell, or give this resource to other teachers. Please send them to my store!\n• Post it on a public website, shared drive, or file-sharing site.\n• Claim it as your own or use any part of it in products for sale.\n\nLicenses: This purchase is for one teacher. Additional licenses are available at a discount on TpT.\n\n© "+STORE+". All rights reserved.",'Andika',14,PP_ALIGN.LEFT,top=True)
    s.shapes.add_picture(LOGO,E(W/2-90),E(H-60-170),E(180))
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
    os.makedirs(outdir,exist_ok=True); pp=os.path.join(outdir,name+'.pptx'); P.save(pp)
    subprocess.run(['soffice','--headless','--convert-to','pdf','--outdir',outdir,pp],capture_output=True)
    json.dump({'boards':boards,'calls':calls},open(os.path.join(outdir,name+'.json'),'w'),indent=1)

HOW_R="You need: one board per student and something to mark squares (counters, crayons, or a dry erase marker in a sheet protector).\n\nHow to play:\n1. The teacher calls a word from the calling sheet and checks it off.\n2. Students find the word on their board, read it aloud or whisper-read it, and mark it.\n3. The FREE square in the middle is already marked.\n4. The first student to mark a full row (across, down, or diagonal) calls \"Bingo!\"\n5. Check the win by having the student read back each word in the row.\n\nEvery board has the same words in a different order, so every word you call is on every board.\n\nMore ways to play: Four corners  •  Blackout (cover the whole board)  •  Small group: let a student be the caller."
HOW_M="You need: one board per student and something to mark squares (counters, crayons, or a dry erase marker in a sheet protector).\n\nHow to play:\n1. The teacher calls a problem from the calling sheet and checks it off.\n2. Students solve the problem and find the answer on their board.\n3. They mark ONE square with that answer. (Some answers are on the board more than once, and some problems have the same answer, so there is always a square to mark.)\n4. The first student to mark a full row (across, down, or diagonal) calls \"Bingo!\"\n5. Check the win by having the student tell a problem that matches each marked answer.\n\nEvery board has the same answers in a different order.\n\nMore ways to play: Four corners  •  Blackout (cover the whole board)  •  Small group: let a student be the caller."

if __name__=='__main__':
    CC='--no-calling-cards' not in sys.argv
    mode=sys.argv[1] if len(sys.argv)>1 else 'reading'
    if mode=='reading':
        d=json.load(open('/workspace/tpt-generator/wordlists_audited.json'))['ou (as in out)']
        words=random.Random(7).sample(d['decodable'],24)
        boards=make_boards(words,5,6,seed=3)
        build('/ou/',5,boards,sorted(words),HOW_R,'sample-bingo','Bingo-ou-SAMPLE','Same words on every board',calling_cards=CC)
    else:
        # 16 calls, each answer value 0-10 used; 5 values appear twice via the other blank position.
        r=random.Random(10)
        calls=[];sq=[]
        for a in range(11): calls.append(f'{10-a} + __ = 10'); sq.append(a)       # answer a
        for a in [2,3,5,7,8]: calls.append(f'__ + {10-a} = 10'); sq.append(a)     # repeats
        boards=make_boards(sq,4,6,seed=5)
        order=list(zip(calls,sq)); r.shuffle(order)
        build('Making 10',4,boards,[c for c,_ in order],HOW_M,'sample-bingo','Bingo-Making-10-SAMPLE','Same answers on every board',calling_cards=CC)
