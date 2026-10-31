// Bingo (reading or math). Port of build_bingo.py: portrait, one board per page, checklist calling sheet, optional calling cards (12/page).
(function(){
const T=TPT, W=612, H=792, q=v=>v/72, tb=T.tb;
function frame(p){p.rect(q(18),q(18),q(W-36),q(H-36),{r:q(W-36)*0.04,lw:3,fill:'FFFFFF'});}
function footer(p){tb(p,0,H-36,W,14,'© '+T.STORE,{size:9});}
function bubble(p,x,y,w,h,size,text){p.rect(q(x),q(y),q(w),q(h),{r:q(h)/2,lw:2.5,fill:'FFFFFF'});tb(p,x,y,w,h,text,{size:T.fit(text,'Andika',size,true,q(w)-0.25),bold:true,nowrap:true});}
const callTxt=pr=>MATH.txt(pr).replace(MATH.BLANK,'__');
function howTo(cfg){const math=cfg.kind==='math', same=cfg.opts.same, free=+cfg.opts.size===5, it=math?'answer':'word';
  const steps=math?['The teacher calls a problem from the calling sheet and checks it off.','Students solve the problem and find the answer on their board.',
      'They mark ONE square with that answer.'+(same?' (Some answers are on the board more than once, and some problems have the same answer, so there is always a square to mark.)':'')]
    :['The teacher calls a word from the calling sheet and checks it off.','Students find the word on their board, read it aloud or whisper-read it, and mark it.'];
  if(free) steps.push('The FREE square in the middle is already marked.');
  steps.push('The first student to mark a full row (across, down, or diagonal) calls "Bingo!"');
  steps.push(math?'Check the win by having the student tell a problem that matches each marked answer.':'Check the win by having the student read back each word in the row.');
  const note=same?(math?'Every board has the same answers in a different order.':'Every board has the same words in a different order, so every word you call is on every board.')
    :`Each board has a different mix of ${it}s from the calling sheet, so not every ${it} is on every board.`;
  const t="You need: one board per student and something to mark squares (counters, crayons, or a dry erase marker in a sheet protector).\n\nHow to play:\n"+steps.map((s,i)=>`${i+1}. ${s}`).join('\n')+`\n\n${note}\n\nMore ways to play: Four corners  •  Blackout (cover the whole board)  •  Small group: let a student be the caller.`;
  const p=new T.Page('P'); frame(p); tb(p,0,45,W,70,'How to Play',{font:'Pacifico',size:40}); tb(p,60,125,W-120,600,t,{size:17,align:'left',top:true,colonBold:true}); footer(p); return p;}
function board(bd,size,label,num){
  const p=new T.Page('P'); frame(p);
  tb(p,46,36,380,26,'Name: ______________________________',{size:15,align:'left'}); tb(p,46,62,120,20,'Board '+num,{size:11,align:'left'});
  const bw=Math.min(220,40+label.length*10+60); bubble(p,W-48-bw,76,bw,38,17,'Skill: '+label);
  {const tw=T.textW('Bingo','Fredoka',84,true)*72+20, cx=Math.min(W/2,W-48-bw-8-tw/2); tb(p,cx-tw/2,70,tw,125,'Bingo',{font:'Fredoka',size:84,bold:true,m:0,nowrap:true});}
  const gx=48,gw=W-96,gy=200,cw=gw/size,fs={3:40,4:30,5:24}[size];
  p.rect(q(gx),q(gy),q(gw),q(gw),{lw:2.25,fill:'FFFFFF'});
  for(let i=1;i<size;i++){p.line(q(gx+i*cw),q(gy),q(gx+i*cw),q(gy+gw),{lw:2.25});p.line(q(gx),q(gy+i*cw),q(gx+gw),q(gy+i*cw),{lw:2.25});}
  bd.forEach((v,k)=>{const x=gx+(k%size)*cw,y=gy+Math.floor(k/size)*cw;
    if(v==='FREE'){const ss=cw*.5; p.shape('star5',q(x+(cw-ss)/2),q(y+cw*.1),q(ss),q(ss),{lw:2}); tb(p,x,y+cw*.62,cw,cw*.3,'FREE',{size:fs*.8,m:0});}
    else {v=String(v); tb(p,x,y,cw,cw,v,{size:T.fit(v,'Andika',fs,true,q(cw-8)),bold:true,nowrap:true,m:3});}});
  footer(p); return p;}
function callingSheet(calls,label){const p=new T.Page('P'); frame(p); tb(p,0,40,W,70,'Calling Sheet',{font:'Pacifico',size:40});
  const bw=Math.min(W-120,40+label.length*11+60); bubble(p,W/2-bw/2,112,bw,36,16,'Skill: '+label);
  tb(p,40,152,W-80,22,'Mark each one with a dry erase marker as you call it.',{size:12});
  const rows=Math.ceil(calls.length/2),top=190,rh=Math.min(40,(H-60-top)/rows),csz=Math.min(22,rh*.6);
  calls.forEach((c,k)=>{const col=Math.floor(k/rows),row=k%rows,x=60+col*(W-120)/2,y=top+row*rh;
    p.rect(q(x),q(y+(rh-csz)/2),q(csz),q(csz),{lw:1.8,fill:'FFFFFF'}); const w=(W-120)/2-csz-20;
    tb(p,x+csz+12,y,w,rh,c,{size:T.fit(c,'Andika',Math.min(20,rh*.5),true,q(w-16)),align:'left',bold:true,nowrap:true});});
  footer(p); return p;}
function callingCards(calls){const pages=[],cols=3,rws=4,mx=36,my=60,cwd=(W-2*mx)/cols,chh=(H-my-50)/rws;
  let cfs=40; for(const c of calls) cfs=Math.min(cfs,T.fit(c,'Andika',40,true,q(cwd-28))); cfs=Math.max(12,cfs);
  for(let p0=0;p0<calls.length;p0+=12){const p=new T.Page('P'), part=calls.slice(p0,p0+12), nr=Math.ceil(part.length/cols);
    tb(p,0,18,W,36,'Calling Cards',{font:'Pacifico',size:24});
    for(let i=0;i<=cols;i++) p.line(q(mx+i*cwd),q(my),q(mx+i*cwd),q(my+nr*chh),{lw:3.5,dash:'dot'});
    for(let j=0;j<=nr;j++) p.line(q(mx),q(my+j*chh),q(mx+cols*cwd),q(my+j*chh),{lw:3.5,dash:'dot'});
    part.forEach((c,k)=>{const x=mx+(k%cols)*cwd,y=my+Math.floor(k/cols)*chh; tb(p,x+6,y+6,cwd-12,chh-12,c,{size:cfs,bold:true,nowrap:true});});
    footer(p); pages.push(p);}
  return pages;}
function cover(label,secs){const p=new T.Page('P'); frame(p); const s0=secs[0];
  tb(p,0,40,W,140,'Bingo',{font:'Fredoka',size:110,bold:true});
  const bw=Math.min(W-120,40+label.length*16+90); bubble(p,W/2-bw/2,180,bw,60,28,label);
  const nb=secs.reduce((a,s)=>a+s.nb,0), sizes=[...new Set(secs.map(s=>`${s.size} x ${s.size}`))].join(', ');
  const note=secs.every(s=>s.same)?(s0.math?'Same answers on every board':'Same words on every board'):'Different mix on each board';
  tb(p,40,255,W-80,50,`${nb} game boards (${sizes})  •  How to Play\nCalling sheet${secs.some(s=>s.cards)?'  •  Calling cards':''}  •  ${note}`,{size:15});
  p.image(q(W/2-140),q(340),q(280),q(280)); tb(p,0,H-80,W,20,T.STORE,{size:13}); return p;}
T.products.push({id:'bingo',name:'Bingo',title:'Bingo',orient:'P',kinds:['reading','math'],multiSkill:true,
  section(cfg,seed){const o=cfg.opts, size=+o.size, nb=+o.boards, r=T.rng(seed), cells=size*size, free=size===5, need=cells-(free?1:0), math=cfg.kind==='math';
    let boards=[],calls=[],warn='';
    const place=s=>{s=T.shuffle(s,r); if(free) s.splice(Math.floor(cells/2),0,'FREE'); return s;};
    let label;
    if(math){const sk=cfg.skills[0]; label=cfg.label||sk.label; const bank=MATH.bank(sk);
      if(o.same){const pr=MATH.pick(sk,need,r); calls=pr.map(callTxt); for(let b=0;b<nb;b++) boards.push(place(pr.map(x=>x.ans)));}
      else {const pr=MATH.pick(sk,Math.min(bank.length,need*2),r); calls=pr.map(callTxt); const ans=pr.map(x=>x.ans);
        for(let b=0;b<nb;b++){let s=T.shuffle(ans,r); while(s.length<need) s=s.concat(T.shuffle(ans,r)); boards.push(place(s.slice(0,need)));}}
      if(bank.length<need) warn=`Only ${bank.length} different problems, so some repeat.`;
    } else {label=cfg.label||cfg.skills.map(T.readLabel).join(' • ');
      let pool=[...new Set(cfg.skills.flatMap(sk=>T.readPools(sk).reg))];
      if(pool.length<need) warn=`Only ${pool.length} words for ${need} squares, so some words repeat on a board.`;
      const fill=(src,n)=>{let s=T.shuffle(src,r); while(s.length<n) s=s.concat(T.shuffle(src,r)); return s.slice(0,n);};
      if(o.same){const words=fill(pool,need); calls=[...new Set(words)].sort(); for(let b=0;b<nb;b++) boards.push(place(words));}
      else {const used=T.shuffle(pool,r).slice(0,Math.max(need,Math.min(pool.length,need*2))); calls=used.slice().sort(); for(let b=0;b<nb;b++) boards.push(place(fill(used,need)));}
    }
    const pages=boards.map((b,i)=>board(b,size,label,i+1)); pages.push(callingSheet(calls,label)); if(o.cards) pages.push(...callingCards(calls));
    return {label,pages,nb,size,same:!!o.same,cards:!!o.cards,math,info:`${nb} boards, ${size} x ${size}${free?' with FREE':''} · ${calls.length} calls`+(warn?'<br>'+warn:'')};},
  directions(cfgs){return [howTo(cfgs[0])];},
  cover(secs){return cover(T.skillsText(secs),secs);}
});
})();
