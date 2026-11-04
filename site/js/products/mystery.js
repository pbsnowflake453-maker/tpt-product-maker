// Mystery Picture (color by skill / color by code). Port of build_mystery.py: portrait, crayon color key, student puzzle + colored answer key.
(function(){
const T=TPT, W=612, H=792, q=v=>v/72, tb=T.tb;
const NAMES={K:'Black',W:'White',S:'Gray',s:'Dark Gray',R:'Red',r:'Dark Red',p:'Pink',M:'Magenta',O:'Orange',Y:'Yellow',T:'Tan',N:'Brown',n:'Dark Brown',L:'Light Green',G:'Green',g:'Dark Green',C:'Light Blue',B:'Blue',b:'Dark Blue',P:'Purple',v:'Lavender','.':'White'};
const sum=h=>{h=h.replace('#','');return parseInt(h.slice(0,2),16)+parseInt(h.slice(2,4),16)+parseInt(h.slice(4,6),16);};
function frame(p){p.rect(q(18),q(18),q(W-36),q(H-36),{r:q(W-36)*0.04,lw:3,fill:'FFFFFF'});}
function footer(p){tb(p,0,H-34,W,14,'© '+T.STORE,{size:9});}
function colorsByCount(rows){const c={};rows.join('').split('').forEach(ch=>c[ch]=(c[ch]||0)+1);return Object.entries(c).sort((a,b)=>b[1]-a[1]);}
function cellTxt(pr){const pp=pr.parts; if(pp[pp.length-1]===null&&/ = $/.test(pp[pp.length-2]||'')) return pp.slice(0,-1).join('').replace(/ = $/,''); return MATH.txt(pr).replace(MATH.BLANK,'__');}
function fillWords(rows,lists,r){const pools={},grid=[];
  rows.forEach((row,i)=>{const g=[];[...row].forEach((ch,j)=>{ if(!pools[ch]||!pools[ch].length) pools[ch]=T.shuffle(lists[ch],r);
    const bad=new Set([g[g.length-1],i?grid[i-1][j]:undefined]); const p=pools[ch]; let k=p.length-1; while(k>=0&&bad.has(p[k])) k--; if(k<0) k=p.length-1;
    g.push(p.splice(k,1)[0]);}); grid.push(g);}); return grid;}
function crayon(p,x,y,w,h,fill,label){const tw=h*.6;
  p.shape('triR',q(x+w-tw-h*.15),q(y+h*.2),q(tw),q(h*.6),{fill:fill.replace('#',''),lw:1.5});
  p.rect(q(x),q(y),q(w-tw),q(h),{r:q(h)*.3,lw:1.5,fill:fill.replace('#','')});
  tb(p,x+2,y,w-tw-4,h,label,{size:T.fit(label,'Andika',11,true,q(w-tw-6)),bold:true,m:0,nowrap:true,color:sum(fill)<380?'FFFFFF':'000000'});}
function bubble(p,x,y,w,h,sz,text){if(/^Skills?:/.test(text)){T.skillTag(p,q(x+w),q(y+h/2),text,Math.min(11,sz));return;}p.rect(q(x),q(y),q(w),q(h),{r:q(h)/2,lw:2.5,fill:'FFFFFF'});tb(p,x+4,y,w-8,h,text,{size:T.fit(text,'Andika',sz,true,q(w-16)),bold:true,m:0,nowrap:true});}
function puzzle(s,key){const {rows,order,col,cname,klabel,grid,label}=s, R=rows.length, C=rows[0].length;
  const p=new T.Page('P');
  tb(p,40,26,W-80,22,'Name: ______________________________   Date: ____________',{size:13,align:'left',m:0});
  tb(p,36,52,300,56,key?'Answer Key':'Mystery Picture',{font:'Pacifico',size:34,align:'left',m:0});
  bubble(p,350,62,W-36-350,38,label.length<30?12:10,'Skill: '+label);
  const ky=112,n=order.length,kc=n<=4?2:3,kw=(W-72)/kc,kh=30;
  order.forEach((c,i)=>{const x=36+(i%kc)*kw,y=ky+Math.floor(i/kc)*kh, lab=klabel(c);
    tb(p,x+4,y,kw*.42,kh,lab,{size:T.fit(lab,'Andika',13,true,q(kw*.42)),align:'right',bold:true,m:0,nowrap:true}); tb(p,x+kw*.42+4,y,16,kh,'=',{size:13,bold:true,m:0});
    crayon(p,x+kw*.42+24,y+3,Math.min(110,kw*.55-28),kh-6,col(c),cname(c));});
  const gy=ky+Math.ceil(n/kc)*kh+10, avail=H-50-gy, cell=Math.min((W-72)/C,avail/R), gx=(W-cell*C)/2;
  let fs=14; for(const r of grid) for(const w of r) fs=Math.min(fs,T.fit(w,'Andika',Math.min(14,cell*.32),false,q(cell-4)));
  fs=Math.max(6,fs);
  for(let i=0;i<R;i++) for(let j=0;j<C;j++){const c=rows[i][j], f=key?col(c):'#FFFFFF';
    p.rect(q(gx+j*cell),q(gy+i*cell),q(cell),q(cell),{lw:1,fill:f.replace('#','')});
    tb(p,gx+j*cell+1,gy+i*cell,cell-2,cell,grid[i][j],{size:fs,m:0,nowrap:true,color:key&&sum(f)<330?'FFFFFF':'000000'});}
  footer(p); return p;}
function directions(math,bgOff){const p=new T.Page('P'); frame(p); tb(p,0,45,W,70,'Directions',{font:'Pacifico',size:40});
  tb(p,60,125,W-120,600,"You need: the puzzle page and crayons or colored pencils in the colors on the color key.\n\nStudents:"+(math?"\n1. Solve a problem in the grid.\n2. Find that answer on the color key.\n3. Color the square that color.":"\n1. Read a word in the grid.\n2. Decide which skill the word has.\n3. Find that skill on the color key and color the square that color.")+(bgOff?"\n4. If a square does not match anything on the color key, leave it uncolored.":"\n4. White squares can be colored with a white crayon or left uncolored.")+"\n5. Keep going until every "+(math?"problem is solved":"word is read")+". What is the mystery picture?\n\nTips:\n• "+(math?"Have students write the answer lightly in the corner before coloring.":"Have students read each word aloud or whisper-read before coloring.")+"\n• Work one color at a time: find every "+(math?"problem":"word")+" for the first color, then the next.\n• Check with the answer key, or let students check with a partner.\n\nGreat for centers, morning work, early finishers, sub plans, and homework.",{size:16,align:'left',top:true,colonBold:true});
  footer(p); return p;}
function cover(label,math,n){const p=new T.Page('P'); frame(p);
  tb(p,0,50,W,110,'Mystery Picture',{font:'Pacifico',size:60}); tb(p,0,160,W,40,math?'Color by Code':'Color by Skill',{size:26,bold:true});
  const bw=Math.min(W-120,120+label.length*11); p.rect(q(W/2-bw/2),q(215),q(bw),q(54),{r:q(27),lw:2.5,fill:'FFFFFF'}); tb(p,W/2-bw/2+6,215,bw-12,54,label,{size:T.fit(label,'Andika',22,true,q(bw-30)),bold:true,nowrap:true});
  tb(p,40,285,W-80,40,n>1?`${n} mystery pictures  •  Directions  •  Student puzzles  •  Answer keys`:'Directions  •  Student puzzle  •  Answer key',{size:15});
  p.image(q(W/2-140),q(350),q(280),q(280)); tb(p,0,H-80,W,20,T.STORE,{size:13}); return p;}
// cfg: {kind, image:{name,rows}, colors:{ch:{hex,name}}, assign:{ch:readingSkill | answerNumber}, skills:[mathSkill] (math)}
T.products.push({id:'mystery',name:'Mystery Picture',title:'Mystery Picture',orient:'P',kinds:['reading','math'],NAMES,colorsByCount,
  answerChoices(sk){const c={};MATH.bank(sk).forEach(p=>c[p.ans]=(c[p.ans]||0)+1);return Object.entries(c).map(([a,n])=>[+a,n]).sort((a,b)=>b[1]-a[1]||a[0]-b[0]);},
  section(cfg,seed){const r=T.rng(seed), rows=cfg.image.rows, math=cfg.kind==='math', bgOff=!!cfg.bgOff&&rows.join('').includes('.'), order=colorsByCount(rows).map(x=>x[0]).filter(c=>!(bgOff&&c==='.'));
    const col=c=>cfg.colors[c].hex, cname=c=>cfg.colors[c].name, lists={}; let label, klabel;
    if(math){const sk=cfg.skills[0], bank=MATH.bank(sk); label=cfg.label||sk.label; klabel=c=>String(cfg.assign[c]);
      for(const c of order){const v=+cfg.assign[c]; lists[c]=bank.filter(p=>p.ans===v).map(cellTxt); if(!lists[c].length) lists[c]=['?'];}}
    else {label=cfg.label||order.map(c=>T.readLabel(cfg.assign[c])).join(' • '); klabel=c=>T.readLabel(cfg.assign[c]);
      for(const c of order){const sk=cfg.assign[c]; lists[c]=T.readPools(sk).reg.slice(); if(!lists[c].length) lists[c]=['?'];}}
    let bgInfo=''; if(bgOff){ // background: words/problems that match NONE of the colors, left uncolored
      if(math){const used=new Set(order.map(c=>+cfg.assign[c])); lists['.']=MATH.bank(cfg.skills[0]).filter(p=>!used.has(p.ans)).map(cellTxt);}
      else {const sks=order.map(c=>cfg.assign[c]), bad=new Set(); sks.forEach(sk=>{sk.decodable.forEach(x=>bad.add(x[0]));sk.challenge.forEach(x=>bad.add(x[0]));});
        const toks=sks.flatMap(sk=>(sk.members?SKILLS.filter(s=>sk.members.includes(s.name)):[sk]).map(s=>T.readLabel(s))).map(l=>l.replace(/\//g,'')).filter(t=>/^[a-z_]+$/.test(t)&&!t.includes('_'));
        const vow=sks.flatMap(sk=>(sk.members||[sk.name]).map(n=>(n.match(/^Short ([aeiou]) CVC/)||[])[1]).filter(Boolean));
        const maxPos=Math.max(...sks.map(sk=>sk.pos||0)); const src=SKILLS.filter(s=>!s.category&&!['Tricky Words','Dolch Sight Words','Fry Sight Words'].includes(s.group)&&s.pos<=maxPos&&!sks.includes(s));
        let pool=[...new Set(src.flatMap(s=>T.readPools(s).reg))].filter(w=>!bad.has(w)&&!toks.some(t=>w.includes(t))&&!vow.some(v=>w.includes(v)));
        lists['.']=pool; bgInfo=pool.length?`Background: ${pool.length} earlier-taught words not on the key (e.g. ${pool.slice(0,6).join(', ')})`:'';}
      if(!lists['.'].length){lists['.']=['?']; bgInfo='<span class="warn">⚠ No earlier-taught words are left for the background with these skills, so background squares show "?". Pick later skills or turn off "Don\'t color the background".</span>';}
      else if(lists['.'].length<10&&!bgInfo.includes('warn')) bgInfo+=` <span class="warn">(only ${lists['.'].length} background words, so they repeat)</span>`;}
    // words that fit two different colors would make the puzzle ambiguous: drop them from every color that has other choices
    const owner={}; for(const c of Object.keys(lists)) for(const w of lists[c]) (owner[w]=owner[w]||new Set()).add(c);
    for(const c of Object.keys(lists)){const u=lists[c].filter(w=>owner[w].size===1); if(u.length) lists[c]=u;}
    const grid=fillWords(rows,lists,r), s={rows,order,col:c=>c==='.'&&bgOff?'#FFFFFF':col(c),cname,klabel,grid,label};
    return {label,math,bgOff,pages:[puzzle(s,false),puzzle(s,true)],bgPool:lists['.'],info:`${rows[0].length} x ${rows.length} grid · ${order.length} colors`+(bgInfo?'<br>'+bgInfo:'')};},
  directions(cfgs){return [directions(cfgs[0].kind==='math',cfgs.some(c=>c.bgOff))];},
  cover(secs){return cover(T.skillsText(secs),secs[0].math,secs.length);}
});
})();
