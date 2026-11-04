// Cold Read (portrait). She pastes passages in a plain-text format; the site lays each one out like her TpT cold reads:
// page 1 = title, Key Words (stars), passage with running word counts on the left and key words in bold, cold/hot score lines;
// page 2 = title, numbered bold questions with a/b/c options, open questions get 4 writing lines. Answer key at the end if answers are marked.
(function(){
const M=0.5, T=TPT, PW=T.PH, PH=T.PW, F='Andika', A='Andika';
const lex=p=>{p.items.forEach(it=>{if(it.t==='text'&&it.font==='Andika'&&!it.keep)it.font=F;});return p;};
const SAMPLE=`Title: Slime
Key Words: each, because, also
Passage:
Clare wants to make some slime. She checks online to see what she will need. She writes each thing on a sheet of paper.

At the shop, she has to pick which color to get. Clare picks lime green because it is like her backpack. She takes each thing off the shelf and fills her basket.

Clare makes the slime. She also makes a mess! She takes all of the mess and hides it in the trash. She likes her lime green slime, but it is missing something. She says, "It needs some shine!" She shakes some glitter on it. "This is the best slime!" she says with a smile.
Questions:
1. What is most of the story about?
a. How to make slime
b. A girl playing with slime
*c. A girl making slime
2. Why does Clare make her slime lime green?
a. Because it is her favorite color
*b. Because it is like her backpack
c. Because she wants it to look gross
3. How does Clare know what to buy at the shop?
Answer: She checks online and writes each thing on a sheet of paper.
---`;
// ---------- parsing
function parse(src){
  const blocks=String(src||'').replace(/\r/g,'').split(/^\s*-{3,}\s*$/m).map(b=>b.trim()).filter(Boolean);
  return blocks.map(b=>{
    const P={title:'',keys:[],paras:[],qs:[]}; let mode='passage', para=[];
    const flush=()=>{if(para.length){P.paras.push(para.join(' ').replace(/\s+/g,' ').trim());para=[];}};
    for(const raw of b.split('\n')){const l=raw.trim(); let m;
      if(m=l.match(/^title\s*:\s*(.*)$/i)){P.title=m[1].trim();continue;}
      if(m=l.match(/^key\s*words?\s*:\s*(.*)$/i)){mode='keys';P.keys.push(...m[1].split(/[,;•]/).map(s=>s.trim()).filter(Boolean));continue;}
      if(/^(passage|story|text)\s*:\s*$/i.test(l)){mode='passage';continue;}
      if(/^questions?\s*:\s*$/i.test(l)){flush();mode='qs';continue;}
      if(mode==='keys'){ if(!l){continue;} if(/^[*•\-★]\s*/.test(l)||P.keys.length<12&&!/[.!?]$/.test(l)&&l.split(' ').length<=3){P.keys.push(l.replace(/^[*•\-★]\s*/,''));continue;} mode='passage'; }
      if(mode==='passage'){ if(!l) flush(); else para.push(l); continue; }
      if(mode==='qs'){ if(!l) continue; const q=P.qs[P.qs.length-1];
        if(m=l.match(/^answer\s*:\s*(.*)$/i)){ if(q) q.answer=m[1].trim(); continue; }
        if(q&&(m=l.match(/^(\*?)\s*([a-eA-E])[.)]\s+(.*)$/))){ const star=!!m[1]||/\s\*$/.test(m[3]); q.opts.push(m[3].replace(/\s\*$/,'').trim()); if(star) q.correct=q.opts.length-1; continue; }
        if(m=l.match(/^\d+[.)]\s*(.*)$/)){ P.qs.push({q:m[1].trim(),opts:[],correct:-1,answer:''}); continue; }
        if(q){ if(q.opts.length) q.opts[q.opts.length-1]+=' '+l; else q.q+=' '+l; } }
    }
    flush(); return P;});
}
// ---------- passage layout
const norm=w=>w.toLowerCase().replace(/[^a-z0-9']/g,'').replace(/^'+|'+$/g,'');
const counts=w=>/[A-Za-z0-9]/.test(w);
function layoutPassage(P,size,maxW,indent){
  const keys=new Set(); P.keys.map(norm).forEach(k=>{if(!k)return; const st=k.replace(/e$/,''), last=k.slice(-1); [k,k+'s',k+'es',k+'ed',k+'d',k+'ing',st+'ing',st+'ed',k+last+'ed',k+last+'ing',k.replace(/y$/,'ies'),k.replace(/y$/,'ied'),k+"'s"].forEach(x=>keys.add(x));}); const lines=[]; let total=0;
  for(const para of P.paras){ const words=para.split(' ').filter(Boolean); let cur=[],w=indent,first=true;
    const push=()=>{lines.push({indent:first,runs:cur,start:total}); total+=cur.filter(x=>counts(x.t)).length; cur=[];w=0;first=false;};
    for(const wd of words){ const b=keys.has(norm(wd)); const ww=T.textW(wd,F,size,b), sp=T.textW(' ',F,size,false);
      if(cur.length&&w+sp+ww>maxW) push();
      cur.push({t:wd,b}); w+=(cur.length>1?sp:0)+ww; }
    if(cur.length) push(); }
  return {lines,total};
}
function runsOf(line){const out=[]; line.runs.forEach((r,i)=>{ if(i) out.push({t:' ',b:false}); out.push({t:r.t,b:r.b}); }); return [out];} // one run per word so measured and drawn widths never drift
function titleBar(p,title,y,o){ const size=T.fit(title,F,30,false,5.6);
  if(o&&o.name){p.text(M,0.3,6.8,0.3,'Name: ________________________________',{font:F,size:12,align:'left'}); y+=0.3;}
  p.text(M,y,PW-2*M,0.6,title,{font:F,size,align:'left'});
  p.line(M,y+0.56,PW-M,y+0.56,{lw:1.5}); }
function scoreBox(p,y){ const s=10, lw=0.8, y1=y+0.15, y2=y+0.47;
  const lab=(xr,yy,txt)=>p.text(xr-1.2,yy,1.2,0.22,txt,{size:s,align:'right'}), bl=(x1,x2,yy)=>p.line(x1,yy,x2,yy,{lw});
  // left (cold) and right (hot) groups: labels right-aligned to the same x so both blanks start and end at the same spots
  const groups=[[M+0.85,'cold score'],[PW-M-1.6,'hot score']];
  groups.forEach(([a,name])=>{ lab(a,y,'words read'); bl(a+0.08,a+0.8,y1); lab(a,y+0.32,'- errors'); bl(a+0.08,a+0.8,y2);
    p.text(a+0.83,y+0.32,0.15,0.22,'=',{size:s}); bl(a+1.0,a+1.6,y2); p.text(a+1.0,y+0.52,0.6,0.2,name,{size:s}); });
  const x0=groups[0][0]+1.75, x1=groups[1][0]-1.2, n=4, g=0.12, w=(x1-x0-(n-1)*g)/n;
  for(let i=0;i<n;i++) bl(x0+i*(w+g),x0+i*(w+g)+w,y2); }
function passagePage(P,o){
  const p=new T.Page('P'); titleBar(p,P.title||'Untitled',0.55,o);
  let y=o.name?1.75:1.45; const y0=y; p.text(M,y,3,0.3,'Key Words:',{size:14,bold:true,align:'left'}); y+=0.33;
  for(const k of P.keys){ p.shape('star5',M+0.3,y+0.06,0.17,0.17,{fill:'000000',line:null}); p.text(M+0.53,y,4,0.3,k,{size:13,align:'left'}); y+=0.3; }
  y=y+0.3;
  if(o.pic&&o.pic.src){ const bw=2.6,bh=1.5; p.image(PW-M-bw,y0,bw,bh,o.pic); y=Math.max(y,y0+bh+0.25); } // optional picture, right of Key Words, contain-fit
  const bottom=PH-1.75; const X=M+0.95, W=4.8, ind=0.3; // passage block narrower than the page so it fills more lines
  let size=13, L, pitch;
  for(;size>=9;size-=0.5){ L=layoutPassage(P,size,W,ind); pitch=Math.min(0.42,(bottom-y)/(L.lines.length+1)); if(pitch>=size*1.55/72) break; }
  L.lines.forEach((ln,i)=>{ const yy=y+i*pitch;
    if(i>0) p.text(M+0.1,yy,0.7,pitch,String(ln.start),{size:8,align:'right'});
    p.text(X+(ln.indent?ind:0),yy,W,pitch,'',{runs:runsOf(ln),size,align:'left'}); });
  const yy=y+L.lines.length*pitch; p.text(M+0.1,yy,0.7,pitch,String(L.total),{size:8,align:'right'});
  p.line(M+0.88,y,M+0.88,yy+pitch,{lw:1.2});
  scoreBox(p,yy+pitch+0.35); T.footer(p); p.items[p.items.length-1].keep=true; lex(p); return {p,total:L.total};
}
function questionPage(P,o){
  const p=new T.Page('P'); titleBar(p,P.title||'Untitled',0.55,o);
  const X=M+0.1, W=PW-X-M; let size=12.5, gap=0.28;
  const build=()=>{const items=[]; let y=o.name?1.75:1.45;
    P.qs.forEach((q,i)=>{ const L=T.wrapRuns([{t:q.q,b:true}],F,size,W-0.3);
      items.push(['t',X,y,0.3,(i+1)+'.',true]); items.push(['r',X+0.3,y,W-0.3,L]); y+=L.length*size*1.3/72;
      if(q.opts.length){ q.opts.forEach((op,j)=>{ const LL=T.wrapRuns([{t:op,b:false}],F,size,W-1.0);
          items.push(['t',X+0.5,y,0.3,'abcde'[j]+'.',false]); items.push(['r',X+0.8,y,W-0.8,LL]); y+=LL.length*size*1.25/72; }); }
      else { for(let k=0;k<(o.lines||4);k++){ y+=0.52; items.push(['l',X,y+0.05,PW-M]); } y+=0.1; }
      y+=gap; });
    return {items,y};};
  let B=build(); while(B.y>PH-0.8&&size>9){size-=0.5;gap=Math.max(0.12,gap-0.03);B=build();}
  for(const it of B.items){ if(it[0]==='t') p.text(it[1],it[2],it[3],size*1.3/72,it[4],{size,bold:it[5],align:'left'});
    else if(it[0]==='r') p.text(it[1],it[2],it[3],it[4].length*size*1.3/72,'',{runs:it[4],size,align:'left'});
    else p.line(it[1],it[2],it[3],it[2],{lw:0.8}); }
  T.footer(p); p.items[p.items.length-1].keep=true; lex(p); return p;
}
function answerKey(ps){
  const pages=[]; let p=null,y=0;
  const np=()=>{p=new T.Page('P'); T.frame(p); p.text(0,0.5,PW,0.8,'Answer Key',{font:'Pacifico',size:32}); T.footer(p); pages.push(p); y=1.45;};
  np();
  ps.forEach((P,pi)=>{ const rows=P.qs.map((q,i)=>{ let a=q.correct>=0?'abcde'[q.correct]+'. '+q.opts[q.correct]:(q.answer||''); return a?{i,a}:null;}).filter(Boolean);
    if(!rows.length) return; const need=0.35+rows.length*0.27+0.2; if(y+need>PH-0.8) np();
    p.text(0.75,y,PW-1.5,0.32,(pi+1)+'. '+(P.title||'Untitled'),{size:14,bold:true,align:'left'}); y+=0.36;
    rows.forEach(r=>{ const L=T.wrapRuns([{t:(r.i+1)+'.  '+r.a,b:false}],A,12,PW-2.0); p.text(1.05,y,PW-2.0,L.length*0.22,'',{runs:L,size:12,align:'left'}); y+=L.length*0.22+0.05; });
    y+=0.2; });
  return pages;
}
function howTo(){
  const p=new T.Page('P'); T.frame(p); p.text(0,0.55,PW,0.85,'How to Use',{font:'Pacifico',size:36});
  const steps=['1. Go over the key words at the top of the page with the student.',
    '2. Cold read: the student reads the passage aloud for 1 minute. Mark errors on your copy.',
    '3. The numbers on the left are the word count at the start of each line. Find the last word read, then write words read minus errors for the cold score.',
    '4. Practice: the student rereads the passage. Use the blanks between the scores to track each practice read.',
    '5. Hot read: time a final 1 minute read and write the hot score.',
    '6. The student answers the questions on the next page.'+' An answer key is at the end.'];
  let y=1.7; for(const s of steps){ const L=T.wrapRuns([{t:s,b:false}],A,15,PW-1.6); p.text(0.8,y,PW-1.6,L.length*0.28,'',{runs:L,size:15,align:'left'}); y+=L.length*0.28+0.22; }
  T.footer(p); return p;
}
function cover(label,n){
  const p=new T.Page('P'); p.rect(0.25,0.25,PW-0.5,PH-0.5,{r:0.28,lw:4,fill:'FFFFFF'});
  p.text(0,1.2,PW,1.2,'Cold Reads',{font:'Pacifico',size:56});
  if(label){const bw=Math.min(7.2,Math.max(3,T.textW(label,A,26,true)+0.7)); T.bubble(p,PW/2-bw/2,2.8,bw,0.75,label,{size:26});}
  p.text(0.6,3.9,PW-1.2,0.6,n+' passage'+(n===1?'':'s')+' with word counts, questions, and cold and hot scores',{size:16});
  p.image(PW/2-1.25,PH-3.6,2.5,2.5); p.text(0,PH-0.85,PW,0.3,T.STORE,{size:13}); return p;
}
T.products.push({id:'coldread',name:'Cold Read',title:'Cold Read',orient:'P',kinds:['reading'],sample:SAMPLE,parse,
  section(cfg){
    const ps=parse(cfg.text!=null?cfg.text:SAMPLE), o={name:!!(cfg.opts&&cfg.opts.nameLine),lines:4};
    const pages=[], info=[];
    ps.forEach((P,i)=>{ const pics=cfg.pics||{}; const r=passagePage(P,Object.assign({},o,{pic:pics[i]})); pages.push(r.p); if(P.qs.length) pages.push(questionPage(P,o));
      info.push(`${P.title||'Untitled'}: ${r.total} words, ${P.qs.length} questions`+(P.keys.length?'':' (no key words)')); });
    const hasKey=ps.some(P=>P.qs.some(q=>q.correct>=0||q.answer)); if(hasKey) pages.push(...answerKey(ps));
    return {label:cfg.label||'',pages,n:ps.length,info:info.join('<br>')||'Paste a passage to start.'};
  },
  directions(){return [howTo()];},
  cover(secs){const n=secs.reduce((a,s)=>a+s.n,0); return cover(secs.map(s=>s.label).filter(Boolean).join(' • '),n);}
});
})();
