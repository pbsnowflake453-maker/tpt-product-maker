// Word-work pages (portrait), built from the word bank (data/skills.js for the skill's words, data/wordinfo.js for drawable / 2-5 sound flags).
// Six products share this file:
//   wwdraw    Read and Draw (words): 9-12 boxes on a page, the word above each drawing box
//   wwsounds  Count the Sounds: 10-12 lines on a page, five joined sound boxes + a count square + writing lines
//   wwshapes  Letter Shapes: Samantha picks the words; a word bank and one row of letter-shape boxes per word
//   wwmissing Missing Letters: Samantha picks the words; two letters stay visible, the rest are blanks to fill in
//   wwphonics Read and Draw + Count the Sounds on one page (6 boxes + 6 lines)
//   wwtricky  Letter Shapes + Missing Letters on one page (4 words each)
// No answer keys. Count the Sounds shows five blank boxes, so the sound count only decides which words fit (2 to 5 sounds).
(function(){
const T=TPT, PW=T.PH, PH=T.PW;                       // portrait: 8.5 wide, 11 tall
const WI=window.WORDINFO||{};
const mk=s=>new Set((s||'').split(' ').filter(Boolean));
const DRAW=mk(WI.drawable), COUNT=mk(WI.countable), IRR=WI.irregular||{};
const X0=0.6, CW=PW-1.2, TOP=1.57, BOT=PH-0.7;
const PENCIL='A6A6A6', EDGE='777777', RULE='D0D0D0';   // writing lines, letter-shape boxes, row dividers (all one weight of gray)
const EM_BASE=0.415;                                 // Andika: baseline sits 0.415 em below the middle of its text box
const TALL=new Set('tdfhklb'), HANG=new Set('qypgj');

// ---------- word pools
function poolOf(skills,kind){const ok=kind==='count'?COUNT:DRAW, seen=new Set(), out=[];
  for(const sk of skills||[]){const L=(sk.decodable&&sk.decodable.length)?sk.decodable:(sk.challenge||[]);
    for(const x of L){const w=String(x[0]).toLowerCase(); if(ok.has(w)&&!seen.has(w)){seen.add(w);out.push(w);}}}
  return out;}
// pair page: 6 drawing words and 6 counting words; a word is not used twice. Words that cannot be counted go to the drawing side first, so counting words are not used up.
function pairAlloc(dpool,cpool,n,r){const C=new Set(cpool), A0=T.shuffle(dpool,r), A=A0.filter(w=>!C.has(w)).concat(A0.filter(w=>C.has(w))), B=T.shuffle(cpool,r), used=new Set(), rd=[], cs=[];
  for(const w of A) if(rd.length<6*n){rd.push(w);used.add(w);}
  for(const w of B) if(cs.length<6*n&&!used.has(w)){cs.push(w);used.add(w);}
  return rd.length===6*n&&cs.length===6*n?{n,rd,cs}:null;}
T._wwAvail=(sk,kind)=>kind==='pair'?(pairAlloc(poolOf([sk],'draw'),poolOf([sk],'count'),1,T.rng(1))?6:0):poolOf([sk],kind).length;
T._wwCfg=cfg=>{const o=cfg.opts||{}; return {pages:Math.max(1,Math.min(10,+o.wwPages||2)),boxes:[9,10,12].includes(+o.wwBoxes)?+o.wwBoxes:12,
  lines:[10,11,12].includes(+o.wwLines)?+o.wwLines:12,per:[4,6,8].includes(+o.wwPer)?+o.wwPer:6,text:o.twText||'',blanks:o.twBlanks||{},title:typeof o.twTitle==='string'?o.twTitle.trim():null};};

// ---------- tricky words: parse, shapes, missing-letter patterns
const norm=w=>{w=String(w).trim(); return (w==='I'||w==='i')?'I':w.toLowerCase();};
function parseWords(text){const seen=new Set(), words=[], skipped=[];
  for(const raw of String(text||'').split(/[\s,;]+/).filter(Boolean)){const w=norm(raw);
    if(!/^[a-z]+$/i.test(w)){skipped.push(raw);continue;} if(!seen.has(w)){seen.add(w);words.push(w);}}
  return {words,skipped};}
const shapeOf=w=>[...w].map(c=>(TALL.has(c)||c!==c.toLowerCase())?'T':HANG.has(c)?'H':'S').join('');
function irregularPos(w){const p=IRR[w.toLowerCase()]; const out=new Set(); if(!p) return out; let i=0,pos=0;
  while(i<p.length){if(p[i]==='['){out.add(pos);pos++;i+=3;}else{pos++;i++;}} return out;}
function combos(n,k){const out=[]; (function rec(s,cur){if(cur.length===k){out.push(cur.slice());return;} for(let i=s;i<n;i++){cur.push(i);rec(i+1,cur);cur.pop();}})(0,[]); return out;}
// blank patterns for a word, best first: only two letters stay visible (one in a two-letter word); prefer to keep the regular letters showing and blank the tricky ones
function candidates(w){const n=w.length; if(n<2) return []; const I=irregularPos(w), k=Math.min(2,n-1), out=[];
  for(const V of combos(n,k)){const S=[...Array(n).keys()].filter(i=>!V.includes(i));
    out.push({cost:3*V.filter(i=>I.has(i)).length+(V.includes(0)?0:1)+(V.includes(n-1)?0:0.5),S});}
  return out.sort((a,b)=>a.cost-b.cost||cmpArr(a.S,b.S));}
function cmpArr(a,b){for(let i=0;i<Math.min(a.length,b.length);i++) if(a[i]!==b[i]) return a[i]-b[i]; return a.length-b.length;}
const fits=(w,S,v)=>v.length===w.length&&v!==w&&[...w].every((c,i)=>S.includes(i)||v[i]===c);
// for each word on a Missing Letters page, the best pattern that fits only that word; null when some word has none
// custom: {word: [positions]} letters Samantha chose to blank; those are used as given. Returns null when a chosen pattern also fits another word on the page.
function mlPatterns(words,custom){custom=custom||{}; const res={};
  for(const w of words){const cu=custom[w];
    if(cu&&cu.length){if(words.some(v=>fits(w,cu,v))) return null; res[w]=cu; continue;}
    const c=candidates(w).find(x=>words.every(v=>!fits(w,x.S,v))); if(!c) return null; res[w]=c.S;}
  return res;}
// keep only usable choices: positions inside the word, no repeats, sorted
function cleanBlanks(raw,words){const out={}; for(const w of words){const a=raw&&raw[w]; if(!Array.isArray(a)) continue;
  const S=[...new Set(a.filter(i=>Number.isInteger(i)&&i>=0&&i<w.length))].sort((x,y)=>x-y); if(S.length&&w.length>=2) out[w]=S;} return out;}
// walk the words in the order given and put each one on the first page where it is allowed. cap = words per page slot.
// kindOf(i) says what slot i holds ('A' or 'B'); ok(kind,slotWords,w) says whether the word can go there.
function pack(words,cap,kindOf,ok){const slots=[], left=[];
  for(const w of words){let done=false;
    for(let i=0;i<slots.length&&!done;i++) if(slots[i].length<cap&&ok(kindOf(i),slots[i],w)){slots[i].push(w);done=true;}
    for(let t=0;t<2&&!done;t++){slots.push([]); const i=slots.length-1; if(ok(kindOf(i),slots[i],w)){slots[i].push(w);done=true;}}
    if(!done) left.push(w);}
  return {slots,left};}
const okShapes=(s,w)=>!s.some(x=>shapeOf(x)===shapeOf(w));
const okMissing=(s,w,custom)=>w.length>=2&&mlPatterns(s.concat([w]),custom)!==null;
const okFor=kind=>kind==='B'?okMissing:okShapes;

// ---------- drawing pieces
const TOP_NT=1.12;   // content starts here on a page whose title was left empty
function header(p,title,label){
  p.text(0.5,0.49,2.0,0.26,'Name:',{size:13,align:'left'}); p.line(1.15,0.71,3.6,0.71,{lw:1});
  const bw=Math.min(4.2,Math.max(2.0,T.textW('Skill: '+label,'Andika',15,true)+0.45));
  T.bubble(p,PW-0.45-bw,0.42,bw,0.44,'Skill: '+label,{size:15});
  if(title) p.text(0.6,0.89,PW-1.2,0.5,title,{font:'Pacifico',size:T.fit(title,'Pacifico',26,false,PW-1.2)});
  return title?TOP:TOP_NT;}
function sectionTitle(p,y,text){p.text(X0,y,CW,0.4,text,{font:'Pacifico',size:20,align:'left'});}
function hwLines(p,x,y,w,h){ // writing lines: top, dashed middle, bottom, all the same weight
  p.line(x,y,x+w,y,{lw:0.9,line:PENCIL}); p.line(x,y+h/2,x+w,y+h/2,{lw:0.9,line:PENCIL,dash:'dash'}); p.line(x,y+h,x+w,y+h,{lw:0.9,line:PENCIL});}
function rowRule(p,y){p.line(X0,y,X0+CW,y,{lw:0.75,line:RULE});}
function bankLayout(words,w,small){ // word bank sizes; the small one is used on the two-activity page
  const fs=small?16:18, rh=small?0.36:0.42, pad=small?0.16:0.2, widest=Math.max(...words.map(t=>T.textW(t,'Andika',fs,false)))+0.5;
  const maxCols=Math.max(1,Math.min(4,Math.floor((w-0.3)/widest))), rows=Math.ceil(words.length/maxCols), cols=Math.ceil(words.length/rows);
  return {fs,rh,pad,cols,h:rows*rh+pad,cw:(w-0.3)/cols};}
function bankBox(p,words,x,y,w,small){ // word bank in a rounded box; returns its height
  const L=bankLayout(words,w,small);
  p.rect(x,y,w,L.h,{r:0.12,lw:1.5,fill:'FFFFFF'});
  words.forEach((t,i)=>p.text(x+0.15+(i%L.cols)*L.cw,y+L.pad/2+Math.floor(i/L.cols)*L.rh,L.cw,L.rh,t,{size:L.fs}));
  return L.h;}
function deranged(words,r){ // shuffled copy where no word stays in its original position (when that is possible)
  let w=words.slice(); if(words.length<2) return w;
  for(let k=0;k<200;k++){w=T.shuffle(words,r); if(w.every((x,i)=>x!==words[i])) return w;} return w;}

// Read and Draw (words): the word above a rounded drawing box
const RD_GRID={9:[3,3],10:[2,5],12:[3,4]};
function rdGrid(p,words,x,y,w,h,cols,rows){
  const gx=0.2, gy=0.16, cw=(w-(cols-1)*gx)/cols, ch=(h-(rows-1)*gy)/rows, fs=cols>=3?20:24, lab=0.42;
  words.forEach((t,i)=>{const cx=x+(i%cols)*(cw+gx), cy=y+Math.floor(i/cols)*(ch+gy);
    p.text(cx,cy,cw,lab,t,{size:T.fit(t,'Andika',fs,false,cw-0.1)});
    p.rect(cx,cy+lab,cw,ch-lab,{r:0.12,lw:1.5,fill:'FFFFFF'});});}
// Count the Sounds: word, five joined boxes, a count square, writing lines
function csRows(p,words,x,y,w,h){
  const n=words.length, rh=h/n, fs=20, bw=Math.min(0.52,rh*0.72), ww=Math.max(1.5,Math.max(...words.map(t=>T.textW(t,'Andika',fs,false)))+0.25);
  words.forEach((t,i)=>{const ry=y+i*rh, by=ry+(rh-bw)/2;
    p.text(x,ry,ww,rh,t,{size:fs,align:'left'});
    const bx=x+ww; p.rect(bx,by,bw*5,bw,{r:0.05,lw:1.4,fill:'FFFFFF',line:'333333'});
    for(let k=1;k<5;k++) p.line(bx+k*bw,by,bx+k*bw,by+bw,{lw:1.4,line:'333333'});
    const cx=bx+bw*5+0.22; p.rect(cx,by,bw,bw,{r:0.08,lw:1.4,fill:'FFFFFF',line:'333333'});
    const lx=cx+bw+0.3, lw=x+w-lx, lh=Math.min(0.42,rh*0.55); hwLines(p,lx,ry+(rh-lh)/2,lw,lh);
    if(i<n-1) rowRule(p,ry+rh);});}
// Tricky words: one row per word. Left: letter-shape boxes or the word with blanks. Right: writing lines for the whole word.
const LEFT_W=3.7;
function shapeRow(p,word,x,y,h,gap,pad){
  const n=word.length, cw=Math.min(0.5,(LEFT_W-0.05)/n), rh=Math.min(0.32,(h-(pad||0.22))/3), top=y+(h-3*rh)/2;
  const x0=x+(LEFT_W-n*cw)/2;
  [...word].forEach((c,i)=>{const t=TALL.has(c)||c!==c.toLowerCase(), hg=HANG.has(c); const ry=t?0:1, rn=t||hg?2:1;
    p.rect(x0+i*cw,top+ry*rh,cw,rn*rh,{lw:1.25,line:EDGE,fill:'FFFFFF'});});
  const sh=Math.min(0.5,3*rh*0.8); hwLines(p,x+LEFT_W+gap,top+(3*rh-sh)/2,CW-LEFT_W-gap,sh);}
function missingRow(p,word,S,x,y,h,gap,maxFs){
  const segs=[]; let i=0; while(i<word.length){const blank=S.includes(i); let j=i; while(j<word.length&&S.includes(j)===blank) j++; segs.push({gap:blank,s:word.slice(i,j)}); i=j;}
  const widthAt=fs=>{const em=fs/72; return segs.reduce((a,g)=>a+(g.gap?g.s.length*0.62*em+0.12*em:T.textW(g.s,'Andika',fs,false)),0);};
  let fs=maxFs; const avail=LEFT_W-0.15; if(widthAt(fs)>avail) fs=Math.floor(fs*avail/widthAt(fs));
  const em=fs/72, sh=0.76*em*1.15, top=y+(h-sh)/2, yb=top+sh;
  hwLines(p,x,top,LEFT_W,sh);
  let cx=x+(LEFT_W-widthAt(fs))/2;
  for(const g of segs){
    if(g.gap){const gw=g.s.length*0.62*em; p.line(cx+0.06*em,yb,cx+0.06*em+gw,yb,{lw:2.6,line:'1A1A1A'}); cx+=gw+0.12*em;}
    else{const tw=T.textW(g.s,'Andika',fs,false), bh=em*1.5; p.text(cx,yb-EM_BASE*em-bh/2,tw+0.02,bh,g.s,{size:fs,align:'left',nowrap:true,color:'1A1A1A'}); cx+=tw;}}
  hwLines(p,x+LEFT_W+gap,top,CW-LEFT_W-gap,sh);}
function trickyRows(p,kind,words,x,y,h,fsMax,custom,fixed){ // kind 'A' shapes, 'B' missing letters; fixed = {pit,pad} fixes the row spacing (two-activity page)
  const pit=fixed?fixed.pit:Math.min(1.3,h/words.length), pats=kind==='B'?mlPatterns(words,custom):null;
  words.forEach((w,i)=>{const ry=y+i*pit; if(kind==='B') missingRow(p,w,pats[w],x,ry,pit,0.3,fsMax); else shapeRow(p,w,x,ry,pit,0.3,fixed&&fixed.pad);
    if(!fixed&&pit>=1.1&&i<words.length-1) rowRule(p,ry+pit);});}
function trickyBlock(p,kind,words,x,y,h,w,fsMax,r,custom,fixed){ // word bank, then the rows
  const bh=bankBox(p,deranged(words,r),x,y,w,!!fixed), gap=fixed?0.1:0.12; trickyRows(p,kind,words,x,y+bh+gap,h-bh-gap,fsMax,custom,fixed);}

// ---------- pages
const pageOf=(title,label,fn)=>{const p=new T.Page('P'); T.frame(p); const top=header(p,title,label); fn(p,top); T.footer(p); return p;};
const rdPage=(words,label,per)=>pageOf('Read and Draw',label,p=>rdGrid(p,words,X0,TOP,CW,BOT-TOP,...RD_GRID[per]));
const csPage=(words,label)=>pageOf('Count the Sounds',label,p=>csRows(p,words,X0,TOP,CW,BOT-TOP));
const phonicsPage=(rd,cs,label)=>pageOf('Phonics Practice',label,p=>{
  sectionTitle(p,TOP,'Read and Draw'); rdGrid(p,rd,X0,TOP+0.42,CW,3.15,3,2);
  const y2=TOP+0.42+3.15+0.2; sectionTitle(p,y2,'Count the Sounds'); csRows(p,cs,X0,y2+0.42,CW,BOT-(y2+0.42));});
const trickyPage=(kind,words,label,per,r,custom,title)=>pageOf(title,label,(p,top)=>trickyBlock(p,kind,words,X0,top,BOT-top,CW,40,r,custom));
// Two activities on one page, no section labels: letter shapes on top, missing letters below. The word banks are smaller; the shape rows get as much height
// as the page allows (full-size 0.32in boxes when there is room) and the missing-letter rows take what is left.
const trickyPairPage=(a,b,label,r,custom,title)=>pageOf(title,label,(p,top)=>{
  const GAP=0.3, AFTER=0.1, PAD_S=0.16, PIT_S=3*0.32+PAD_S;
  const bhA=a.length?bankLayout(a,CW,true).h+AFTER:0, bhB=b.length?bankLayout(b,CW,true).h+AFTER:0, gap=a.length&&b.length?GAP:0;
  const avail=BOT-top-gap-bhA-bhB, pitM=Math.min(1.0,Math.max(0.66,(avail-4*PIT_S)/4)), pitS=(avail-4*pitM)/4;
  let y=top;
  if(a.length){trickyBlock(p,'A',a,X0,y,0,CW,36,r,custom,{pit:pitS,pad:PAD_S}); y+=bhA+4*pitS+gap;}
  if(b.length){trickyBlock(p,'B',b,X0,y,0,CW,36,r,custom,{pit:pitM});}});

// ---------- how to / cover
function howTo(lines){const p=new T.Page('P'); T.frame(p); p.text(0,0.55,PW,0.85,'How to Use',{font:'Pacifico',size:36});
  let y=1.7; const W=PW-1.6; lines.forEach(l=>{const L=T.wrapRuns([{t:l,b:false}],'Andika',16,W), h=L.length*0.3; p.text(0.8,y,W,h,'',{runs:L,size:16,align:'left',valign:'top'}); y+=h+0.2;});
  T.footer(p); return p;}
function cover(title,label,line){const p=new T.Page('P'); p.rect(0.25,0.25,PW-0.5,PH-0.5,{r:0.28,lw:4,fill:'FFFFFF'});
  p.text(0,1.0,PW,1.1,title,{font:'Pacifico',size:T.fit(title,'Pacifico',52,false,PW-1.2)});
  const bw=Math.min(7.2,Math.max(3,T.textW(label,'Andika',26,true)+0.7)); T.bubble(p,PW/2-bw/2,2.5,bw,0.75,label,{size:26});
  p.text(0.6,3.6,PW-1.2,0.5,line,{size:16}); p.image(PW/2-1.25,PH-3.6,2.5,2.5); p.text(0,PH-0.85,PW,0.3,T.STORE,{size:13}); return p;}
const plural=(n,w)=>`${n} ${w}${n===1?'':'s'}`;
const warn=t=>`<span class="warn">${t}</span>`;
const skillLabel=(cfg)=>cfg.label||(cfg.skills||[]).map(T.readLabel).join(' • ');
const HOW={
  draw:['1. Read the word.','2. Think about what the word means.','3. Draw a picture of it in the box.','4. Show your picture to a partner and read the word together.'],
  sounds:['1. Read the word.','2. Tap one box for each sound as you say the word.','3. Write how many sounds you counted in the square.','4. Write the word on the lines.'],
  shapes:['1. Read the words in the word bank.','2. Look at the shape of each row of boxes. Tall letters go in tall boxes, and letters that hang down go in boxes that hang down.','3. Pick the word that fits the boxes and write one letter in each box.','4. Write the word again on the lines.'],
  missing:['1. Read the words in the word bank.','2. Look at the letters you can see in each word.','3. Pick the word that fits and write the missing letters on the blank spaces.','4. Write the whole word on the lines.']};

// ---------- products
function phonicsSection(cfg,seed,kinds){ // kinds: ['draw'] | ['count'] | ['draw','count']
  const o=T._wwCfg(cfg), label=skillLabel(cfg), r=T.rng(seed), skills=cfg.skills||[];
  const dpool=poolOf(skills,'draw'), cpool=poolOf(skills,'count');
  if(kinds.length===1){const draw=kinds[0]==='draw', pool=draw?dpool:cpool, want=draw?o.boxes:o.lines, sizes=draw?[9,10,12]:[10,11,12];
    const per=pool.length>=want?want:Math.max(0,...sizes.filter(x=>x<=pool.length)), pages=per?Math.min(o.pages,Math.floor(pool.length/per)):0;
    if(!pages) return {label,pages:[],n:0,info:warn(`Only ${pool.length} ${draw?'drawable':'countable'} words match this skill (a page needs at least ${sizes[0]}). Pick a unit, a through-unit, or a broader skill.`)};
    const items=T.shuffle(pool,r).slice(0,pages*per), pg=[]; for(let i=0;i<pages;i++){const w=items.slice(i*per,(i+1)*per); pg.push(draw?rdPage(w,label,per):csPage(w,label));}
    const small=per!==want?`<br>${warn(`This skill has ${pool.length} words, so each page has ${per} ${draw?'boxes':'lines'}.`)}`:'';
    return {label,n:pages,pages:pg,words:items.length,info:`${items.length} words on ${plural(pages,'page')} (${per} per page)<br>${pool.length} words available for this selection.${small}`};}
  // pair page: 6 drawing boxes on top, 6 counting lines below; a word is not used twice on the same page
  let pick=null; for(let n=o.pages;n>=1&&!pick;n--) pick=pairAlloc(dpool,cpool,n,T.rng(seed));
  if(!pick) return {label,pages:[],n:0,info:warn(`This skill has ${dpool.length} drawable and ${cpool.length} countable words. A page needs 6 of each. Pick a unit, a through-unit, or a broader skill.`)};
  const pg=[]; for(let i=0;i<pick.n;i++) pg.push(phonicsPage(pick.rd.slice(i*6,i*6+6),pick.cs.slice(i*6,i*6+6),label));
  return {label,n:pick.n,pages:pg,words:pick.n*12,info:`${plural(pick.n,'page')}, each with 6 words to draw and 6 words to count<br>${dpool.length} drawable and ${cpool.length} countable words available.`};}

function trickySection(cfg,seed,pair){
  const o=T._wwCfg(cfg), label=cfg.label||'Word Work', title=o.title===null?pair.title:o.title, r=T.rng(seed), {words,skipped}=parseWords(o.text), custom=cleanBlanks(o.blanks,words);
  const bad=skipped.length?`<br>${warn('Left out (letters only): '+skipped.join(', '))}`:'';
  if(!words.length) return {label,pages:[],n:0,info:warn('Pick or type at least one word.')};
  const patterns={};   // patterns: word -> positions blanked on its Missing Letters row
  const noteML=slots=>slots.forEach(s=>{const m=mlPatterns(s,custom); if(m) Object.assign(patterns,m);});
  const chosen=()=>{const n=Object.keys(patterns).filter(w=>custom[w]).length; return n?`<br>${plural(n,'word')} ${n===1?'uses':'use'} letters you chose.`:'';};
  const ok=(k,s,w)=>okFor(k)(s,w,custom);
  if(!pair.mode){ // one activity on every page
    const kind=pair.kind, res=pack(words,o.per,()=>kind,ok), slots=res.slots.filter(s=>s.length);
    const left=res.left.length?`<br>${warn('Left out (needs two or more letters): '+res.left.join(', '))}`:'';
    if(!slots.length) return {label,pages:[],n:0,info:warn('None of those words can go on this page.')+bad};
    if(kind==='B') noteML(slots);
    return {label,n:slots.length,pages:slots.map(s=>trickyPage(kind,s,label,o.per,r,custom,title)),title,words:slots.reduce((a,s)=>a+s.length,0),patterns,
      info:`${plural(words.length-res.left.length,'word')} on ${plural(slots.length,'page')} (up to ${o.per} per page). Words on a page never share a ${kind==='B'?'blank pattern':'shape'}.${chosen()}${left}${bad}`};}
  const res=pack(words,4,i=>i%2?'B':'A',ok), slots=res.slots;
  const n=Math.ceil(slots.length/2), pg=[]; noteML(slots.filter((_,i)=>i%2));
  for(let i=0;i<n;i++) pg.push(trickyPairPage(slots[2*i]||[],slots[2*i+1]||[],label,r,custom,title));
  const used=words.length-res.left.length, left=res.left.length?`<br>${warn('Left out (needs two or more letters): '+res.left.join(', '))}`:'';
  return {label,title,n:pg.length,pages:pg,words:used,patterns,info:`${plural(used,'word')} on ${plural(n,'page')}: 4 words with letter-shape boxes on top and 4 words with missing letters below.${chosen()}${left}${bad}`};}

const common={orient:'P',kinds:['reading'],multiSkill:true};
T.products.push(Object.assign({id:'wwdraw',name:'Read and Draw: Words',title:'Read and Draw Words'},common,{
  section:(cfg,seed)=>phonicsSection(cfg,seed,['draw']),
  directions:()=>[howTo(HOW.draw)],
  cover:secs=>cover('Read and Draw',T.skillsText(secs),`${plural(secs.reduce((a,s)=>a+(s.words||0),0),'word')}  •  ${plural(secs.reduce((a,s)=>a+s.n,0),'page')}`)}));
T.products.push(Object.assign({id:'wwsounds',name:'Count the Sounds',title:'Count the Sounds'},common,{
  section:(cfg,seed)=>phonicsSection(cfg,seed,['count']),
  directions:()=>[howTo(HOW.sounds)],
  cover:secs=>cover('Count the Sounds',T.skillsText(secs),`${plural(secs.reduce((a,s)=>a+(s.words||0),0),'word')}  •  ${plural(secs.reduce((a,s)=>a+s.n,0),'page')}`)}));
T.products.push(Object.assign({id:'wwphonics',name:'Read, Draw and Count',title:'Phonics Practice'},common,{
  section:(cfg,seed)=>phonicsSection(cfg,seed,['draw','count']),
  directions:()=>[howTo(['Read and Draw','1. Read the word.','2. Draw a picture of it in the box.','Count the Sounds','3. Read the word and tap one box for each sound.','4. Write how many sounds you counted in the square, then write the word on the lines.'])],
  cover:secs=>cover('Phonics Practice',T.skillsText(secs),`Read and Draw + Count the Sounds  •  ${plural(secs.reduce((a,s)=>a+s.n,0),'page')}`)}));
const tcommon={orient:'P',kinds:['reading'],multiSkill:false,noSkill:true};
T.products.push(Object.assign({id:'wwshapes',name:'Letter Shapes',title:'Letter Shapes',pageTitle:'Letter Shapes'},tcommon,{
  section:(cfg,seed)=>trickySection(cfg,seed,{kind:'A',title:'Letter Shapes'}),
  directions:()=>[howTo(HOW.shapes)],
  cover:secs=>cover(secs[0]&&secs[0].title||'Letter Shapes',T.skillsText(secs),`${plural(secs.reduce((a,s)=>a+(s.words||0),0),'word')}  •  ${plural(secs.reduce((a,s)=>a+s.n,0),'page')}`)}));
T.products.push(Object.assign({id:'wwmissing',name:'Missing Letters',title:'Missing Letters',pageTitle:'Missing Letters'},tcommon,{
  section:(cfg,seed)=>trickySection(cfg,seed,{kind:'B',title:'Missing Letters'}),
  directions:()=>[howTo(HOW.missing)],
  cover:secs=>cover(secs[0]&&secs[0].title||'Missing Letters',T.skillsText(secs),`${plural(secs.reduce((a,s)=>a+(s.words||0),0),'word')}  •  ${plural(secs.reduce((a,s)=>a+s.n,0),'page')}`)}));
T.products.push(Object.assign({id:'wwtricky',name:'Letter Shapes + Missing Letters',title:'Letter Shapes and Missing Letters',pageTitle:'Letter Shapes and Missing Letters'},tcommon,{
  section:(cfg,seed)=>trickySection(cfg,seed,{mode:'pair',title:'Letter Shapes and Missing Letters'}),
  directions:()=>[howTo(['Letter Shapes','1. Read the words in the word bank.','2. Pick the word that fits the boxes and write one letter in each box.','Missing Letters','3. Pick the word that fits and write the missing letters on the blank spaces.','4. Write the whole word on the lines.'])],
  cover:secs=>cover(secs[0]&&secs[0].title||'Letter Shapes and Missing Letters',T.skillsText(secs),`Letter Shapes + Missing Letters  •  ${plural(secs.reduce((a,s)=>a+(s.words||0),0),'word')}  •  ${plural(secs.reduce((a,s)=>a+s.n,0),'page')}`)}));
T.tricky={parseWords,shapeOf,mlPatterns,cleanBlanks,pack,okShapes,okMissing};
})();
