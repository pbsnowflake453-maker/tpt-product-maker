"""Reusable Mystery Picture (color-by-skill) builder.
python3 build_mystery.py            -> builds the sample (bear + sh/ch/th/wh)
import: colors_by_count(img), build(img, assign, recolor, outdir, name)
  assign: {palette_letter_or_'.': (skill_label, [words])}  ('.' = background, key says leave white)
  recolor: {palette_letter: (hex, name)} to swap a color before building."""
import json,os,random,subprocess,sys
from collections import Counter
from pptx import Presentation
from pptx.util import Pt, Emu
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.oxml.ns import qn
STORE='My Side of the Classroom'; LOGO='/workspace/directed-drawing/tpt/brand/logo-v2.png'
LIB='/workspace/pixel-library/library.json'
W,H=612,792; BL=RGBColor(0,0,0); WH=RGBColor(255,255,255)
E=lambda v:Emu(int(v*12700))
NAMES={'K':'Black','W':'White','S':'Gray','s':'Dark Gray','R':'Red','r':'Dark Red','p':'Pink','M':'Magenta','O':'Orange','Y':'Yellow','T':'Tan','N':'Brown','n':'Dark Brown','L':'Light Green','G':'Green','g':'Dark Green','C':'Light Blue','B':'Blue','b':'Dark Blue','P':'Purple','v':'Lavender','.':'White'}
rgb=lambda h:RGBColor.from_string(h.lstrip('#').upper())

def load_image(theme,name):
    d=json.load(open(LIB)); return next(i for i in d['themes'][theme] if i['name']==name), d['palette']

def colors_by_count(img):
    """Colors (incl. '.' background) ordered most pixels -> fewest: [(letter,count)]"""
    return Counter(''.join(img['rows'])).most_common()

def fill_words(img,assign,seed=1):
    """One word per square; words cycle through a shuffled list so repeats are spread out."""
    r=random.Random(seed); pools={}; grid=[]
    for row in img['rows']:
        g=[]
        for ch in row:
            if not pools.get(ch):
                w=list(assign[ch][1]); r.shuffle(w); pools[ch]=w
            bad={g[-1] if g else None, grid[-1][len(g)] if grid else None}
            p=pools[ch]; k=next((k for k in range(len(p)-1,-1,-1) if p[k] not in bad),len(p)-1)
            g.append(p.pop(k))
        grid.append(g)
    return grid

def build(img,palette,assign,outdir,name,recolor=None,seed=1,math=False,skill_title=None):
    recolor=recolor or {}
    col=lambda c:(recolor[c][0] if c in recolor else ('#FFFFFF' if c=='.' else palette[c]))
    cname=lambda c:(recolor[c][1] if c in recolor else NAMES.get(c,c))
    order=[c for c,_ in colors_by_count(img)]
    grid=fill_words(img,assign,seed); rows,cols=len(grid),len(grid[0])
    P=Presentation(); P.slide_width=E(W); P.slide_height=E(H); blank=P.slide_layouts[6]
    def tb(s,x,y,w,h,t,font='Andika',sz=14,align=PP_ALIGN.CENTER,bold=False,top=False):
        b=s.shapes.add_textbox(E(x),E(y),E(w),E(h)); tf=b.text_frame; tf.word_wrap=True
        for a in ('margin_left','margin_right','margin_top','margin_bottom'): setattr(tf,a,0)
        tf.vertical_anchor=MSO_ANCHOR.TOP if top else MSO_ANCHOR.MIDDLE
        for i,l in enumerate(t.split('\n')):
            p=tf.paragraphs[0] if i==0 else tf.add_paragraph(); p.alignment=align
            rr=p.add_run(); rr.text=l; rr.font.name=font; rr.font.size=Pt(sz); rr.font.color.rgb=BL; rr.font.bold=bold or l.endswith(':')
        return b
    def shape(s,kind,x,y,w,h,lw=2,fill=WH):
        sh=s.shapes.add_shape(kind,E(x),E(y),E(w),E(h)); sh.fill.solid(); sh.fill.fore_color.rgb=fill; sh.line.color.rgb=BL; sh.line.width=Pt(lw); sh.text_frame.text=''; return sh
    def frame(s): shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,18,18,W-36,H-36,3).adjustments[0]=.04
    def footer(s): tb(s,0,H-34,W,14,f'© {STORE}','Andika',9)
    skills=skill_title or ' • '.join(assign[c][0] for c in order)
    def bubble(s,x,y,w,h,sz):
        b=shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,x,y,w,h,2.5); b.adjustments[0]=.5
        tb(s,x+4,y,w-8,h,'Skill: '+skills,'Andika',sz,bold=True)
    def crayon(s,x,y,w,h,fill,label):
        tw=h*.6
        shape(s,MSO_SHAPE.ISOSCELES_TRIANGLE,x+w-tw-h*.15,y+h*.2+ (h*.6-tw)/2,tw,h*.6,1.5,fill).rotation=90
        shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,x,y,w-tw,h,1.5,fill).adjustments[0]=.3
        t=tb(s,x+2,y,w-tw-4,h,label,'Andika',11,bold=True)
        if sum(fill)<380: t.text_frame.paragraphs[0].runs[0].font.color.rgb=WH
    def puzzle(s,key):
        tb(s,40,26,W-80,22,'Name: ______________________________   Date: ____________','Andika',13,PP_ALIGN.LEFT)
        tb(s,36,52,300,56,'Mystery Picture' if not key else 'Answer Key','Pacifico',34,PP_ALIGN.LEFT)
        bw=W-36-350; bubble(s,350,62,bw,38,12 if len(skills)<30 else 10)
        # color key: one box per color, 2 columns
        ky=112; n=len(order); kc=2 if n<=4 else 3; kw=(W-72)/kc; kh=30
        for i,c in enumerate(order):
            x=36+(i%kc)*kw; y=ky+(i//kc)*kh
            lab=f'{assign[c][0]}' if math else f'{assign[c][0]} words'
            tb(s,x+4,y,kw*.42,kh,lab,'Andika',13,PP_ALIGN.RIGHT,bold=True)
            tb(s,x+kw*.42+4,y,16,kh,'=','Andika',13,bold=True)
            crayon(s,x+kw*.42+24,y+3,min(110,kw*.55-28),kh-6,rgb(col(c)),cname(c))
        gy=ky+-(-n//kc)*kh+10; avail=H-50-gy; cell=min((W-72)/cols,avail/rows); gx=(W-cell*cols)/2
        longest=max(len(w) for r in grid for w in r); fs=max(8,min(14,cell*1.55/longest,cell*.32))
        for i in range(rows):
            for j in range(cols):
                c=img['rows'][i][j]; f=rgb(col(c)) if key else WH
                shape(s,MSO_SHAPE.RECTANGLE,gx+j*cell,gy+i*cell,cell,cell,1,f)
                dark=key and sum(rgb(col(c)))<330
                t=tb(s,gx+j*cell+1,gy+i*cell,cell-2,cell,grid[i][j],'Andika',fs)
                if dark: t.text_frame.paragraphs[0].runs[0].font.color.rgb=WH
        footer(s)
    # cover: student page preview colored as a teaser? keep secret: show logo + title
    s=P.slides.add_slide(blank); frame(s)
    tb(s,0,50,W,110,'Mystery Picture','Pacifico',60)
    tb(s,0,160,W,40,'Color by Code' if math else 'Color by Skill','Andika',26,bold=True)
    bw=min(W-120,120+len(skills)*11); b=shape(s,MSO_SHAPE.ROUNDED_RECTANGLE,W/2-bw/2,215,bw,54,2.5); b.adjustments[0]=.5
    tb(s,W/2-bw/2+6,215,bw-12,54,'Skill: '+skills,'Andika',22,bold=True)
    tb(s,40,285,W-80,40,'Directions  •  Student puzzle  •  Answer key','Andika',15)
    s.shapes.add_picture(LOGO,E(W/2-140),E(350),E(280)); tb(s,0,H-80,W,20,STORE,'Andika',13)
    # directions
    s=P.slides.add_slide(blank); frame(s); tb(s,0,45,W,70,'Directions','Pacifico',40)
    tb(s,60,125,W-120,600,("You need: the puzzle page and crayons or colored pencils in the colors on the color key.\n\nStudents:"+("\n1. Solve a problem in the grid.\n2. Find that answer on the color key.\n3. Color the square that color." if math else "\n1. Read a word in the grid.\n2. Decide which skill the word has.\n3. Find that skill on the color key and color the square that color.")+"\n4. White squares can be colored with a white crayon or left uncolored.\n5. Keep going until every word is read. What is the mystery picture?\n\nTips:\n• "+("Have students write the answer lightly in the corner before coloring." if math else "Have students read each word aloud or whisper-read before coloring.")+"\n• Work one color at a time: find every word for the first color, then the next.\n• Check with the answer key, or let students check with a partner.\n\nGreat for centers, morning work, early finishers, sub plans, and homework."),'Andika',16,PP_ALIGN.LEFT,top=True)
    footer(s)
    puzzle(P.slides.add_slide(blank),False)
    puzzle(P.slides.add_slide(blank),True)
    s=P.slides.add_slide(blank); frame(s); tb(s,0,45,W,70,'Terms of Use','Pacifico',38)
    tb(s,60,125,W-120,480,"Thank you for your purchase!\n\nYou may:\n• Use this resource in your own classroom with your own students.\n• Print copies for your students and their families.\n• Use it for in-person or distance learning with your own class (in a password-protected platform).\n\nYou may not:\n• Share, resell, or give this resource to other teachers. Please send them to my store!\n• Post it on a public website, shared drive, or file-sharing site.\n• Claim it as your own or use any part of it in products for sale.\n\nLicenses: This purchase is for one teacher. Additional licenses are available at a discount on TpT.\n\n© "+STORE+". All rights reserved.",'Andika',14,PP_ALIGN.LEFT,top=True)
    s.shapes.add_picture(LOGO,E(W/2-90),E(H-60-170),E(180))
    for sl in P.slides:
        sl.background.fill.solid(); sl.background.fill.fore_color.rgb=WH
        for sh in sl.shapes:
            st=sh._element.find(qn('p:style'))
            if st is not None: sh._element.remove(st)
    os.makedirs(outdir,exist_ok=True); pp=os.path.join(outdir,name+'.pptx'); P.save(pp)
    subprocess.run(['soffice','--headless','--convert-to','pdf','--outdir',outdir,pp],capture_output=True)
    json.dump({'image':img['name'],'colors':[[c,n,col(c),cname(c),assign[c][0]] for c,n in colors_by_count(img)],'grid':grid},open(os.path.join(outdir,name+'.json'),'w'),indent=1)

if __name__=='__main__':
    img,pal=load_image('Animals','bear')
    wl=json.load(open('/workspace/tpt-generator/wordlists_audited.json'))
    skills=[('sh','sh'),('ch','ch'),('th','th (unvoiced, as in thin)'),('wh','wh')]
    assign={c:(skills[i][0],wl[skills[i][1]]['decodable']) for i,(c,_) in enumerate(colors_by_count(img))}
    build(img,pal,assign,'/workspace/tpt-generator/sample-mystery','Mystery-Picture-Bear-SAMPLE')
    # math sample: butterfly, mixed add/subtract within 10, each color = an answer
    img,pal=load_image('Nature & Weather','butterfly')
    def probs(v): return [f'{a} + {v-a}' for a in range(v+1)]+[f'{m} - {m-v}' for m in range(v+1,11)]
    vals=[10,6,8,3]
    assign={c:(str(vals[i]),probs(vals[i])) for i,(c,_) in enumerate(colors_by_count(img))}
    build(img,pal,assign,'/workspace/tpt-generator/sample-mystery','Mystery-Picture-Math-Butterfly-SAMPLE',math=True,skill_title='Add & Subtract within 10',seed=2)
