(function(){
const T=TPT, PW=T.PW, PH=T.PH;
function scaled(src,dst,ox,oy,s){for(const it of src.items){const c=Object.assign({},it);c.x=ox+it.x*s;c.y=oy+it.y*s;if(c.w!=null)c.w*=s;if(c.h!=null)c.h*=s;if(c.x2!=null){c.x2=ox+it.x2*s;c.y2=oy+it.y2*s;}if(c.size)c.size*=s;if(c.lw)c.lw*=s;if(c.r)c.r*=s;dst.items.push(c);}}
function board(words,label,num,chal){
  const p=new T.Page(); T.frame(p);
  p.text(0.7,0.45,0.7,0.35,'Name:',{size:15,align:'left'}); p.line(1.4,0.78,4.6,0.78,{lw:1});
  p.text(PW-2.7,0.45,2.0,0.35,'Board '+num,{size:11,align:'right'});
  {const bw=Math.min(3.0,Math.max(2.1,T.textW('Skill: '+label,'Andika',22,true)+0.5));T.bubble(p,PW-0.7-bw,1.0,bw,0.62,'Skill: '+label,{size:22});
   const tw=T.textW('Roll and Read','Pacifico',40,false)+0.3, cx=Math.min(PW/2,PW-0.7-bw-0.15-tw/2); p.text(cx-tw/2,0.85,tw,0.85,'Roll and Read',{font:'Pacifico',size:40});}
  if(chal) T.bubble(p,0.7,1.0,2.1,0.62,'Challenge!',{size:22,dark:true});
  const gx=0.83,gy=1.85,gw=PW-1.66,hh=0.78,rh=(7.85-gy-hh)/6,cw=gw/6;
  p.rect(gx,gy,gw,hh+6*rh,{lw:2,fill:'FFFFFF'});
  for(let i=1;i<6;i++) p.line(gx+i*cw,gy,gx+i*cw,gy+hh+6*rh,{lw:1});
  for(let j=0;j<6;j++) p.line(gx,gy+hh+j*rh,gx+gw,gy+hh+j*rh,{lw:j===0?2:1});
  for(let i=0;i<6;i++) T.die(p,gx+i*cw+cw/2-0.31,gy+0.08,0.62,i+1);
  words.forEach((w,k)=>{const c=k%6,r=Math.floor(k/6);p.text(gx+c*cw+0.05,gy+hh+r*rh,cw-0.1,rh,w,{size:T.fit(w,'Andika',26,false,cw-0.2)});});
  T.footer(p); return p;}
function display(sk){
  const n=sk.name, d=sk.disp||n; let m; if(sk.category) return d;
  if(sk.pos<2000&&sk.group==='Endings and Suffixes') return d;
  if(sk.pos<2000&&(m=d.match(/^(\S+) \((.+)\)$/))) return '/'+m[1]+'/ ('+m[2]+')';
  if(sk.pos<2000&&/^Fry /.test(n)) return d;
  if(m=n.match(/^Short ([aeiou]) CVC/)) return 'short '+m[1];
  if(['Tricky Words','Dolch Sight Words','Fry Sight Words'].includes(sk.group)) return n.replace(/ \(words.*\)/,'');
  if(sk.group==='Two-Syllable Words') return n.replace('Closed two-syllable words','closed syllables').toLowerCase();
  if(sk.group==='Blends') return {'CVCC (ending blends)':'ending blends','CCVC (beginning blends)':'beginning blends'}[n]||'3-letter blends';
  if(sk.group==='Endings and Suffixes') return n.replace(/ \(.*\)$/,'').replace(/^-/, '-');
  const tok=n.split(/ \(|,| and /)[0].trim();
  if(/^(Soft [cg])/.test(n)) return n.replace(/ \(.*\)/,'');
  return '/'+tok+'/';
}
function pools(sk){
  const dec=sk.decodable, cnt={}; dec.forEach(([w,s])=>cnt[s]=(cnt[s]||0)+1);
  let base=+Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]||a-b)[0]||1;
  let reg=dec.filter(([w,s])=>s===base).map(x=>x[0]); if(reg.length<12) reg=dec.map(x=>x[0]);
  const ch=[...new Set(sk.challenge.map(x=>x[0]).concat(dec.filter(([w,s])=>s>base).map(x=>x[0])))].filter(w=>!reg.includes(w));
  if(!reg.length) return {base,reg:ch,ch:[],note:'No decodable words: all boards use challenge words.'};
  return {base,reg,ch,note:''};
}
function wordList(sk,label,pl,used){
  const p=new T.Page(); T.frame(p);
  p.text(0.8,0.5,4,0.9,'Word List',{font:'Pacifico',size:38,align:'left'});
  {const bw=Math.min(4.5,Math.max(2.1,T.textW('Skill: '+label,'Andika',22,true)+0.5));T.bubble(p,PW-0.7-bw,0.7,bw,0.62,'Skill: '+label,{size:22});}
  let dec=sk.decodable.map(x=>x[0]).filter(w=>used.has(w)), ch=sk.challenge.map(x=>x[0]).filter(w=>used.has(w)&&!dec.includes(w));
  dec=[...new Set(dec)].sort((a,b)=>a.localeCompare(b)); ch=[...new Set(ch)].sort((a,b)=>a.localeCompare(b));
  const top=2.25,bot=7.75;
  function col(list,x,w,title){
    p.text(x,1.6,w,0.4,`${title} (${list.length})`,{bold:true,size:18,align:'left'});
    let size=16,cols,rows,cwid;
    for(;size>=7;size-=0.5){const lh=size*1.45/72; rows=Math.max(1,Math.floor((bot-top)/lh)); cols=Math.ceil(list.length/rows); const mw=Math.max(...list.map(t=>T.textW(t,'Andika',size,false)),0.3)+0.25; cwid=w/cols; if(cwid>=mw) break;}
    rows=Math.ceil(list.length/cols); const lh=size*1.45/72;
    for(let c=0;c<cols;c++) p.text(x+c*cwid,top,cwid,rows*lh,list.slice(c*rows,(c+1)*rows).join('\n'),{size,align:'left',valign:'top'});
  }
  if(ch.length){col(dec,0.85,5.2,'Decodable Words'); p.line(6.25,1.6,6.25,7.75,{lw:1}); col(ch,6.45,PW-6.45-0.8,'Challenge Words');}
  else col(dec,0.85,PW-1.7,'Decodable Words');
  T.footer(p); return p;}
function howTo(){
  const p=new T.Page(); T.frame(p); p.text(0,0.5,PW,0.9,'How to Play',{font:'Pacifico',size:42});
  const S=[['You need:',['• one game board  • one die  • a pencil or crayon (optional)']],
   ['Play alone:',['1. Roll the die.','2. Find the column with the same number of dots at the top.','3. Read the next word down in that column. Color it in or mark it if you like.','4. Keep rolling until you have read every word on the board.']],
   ['Partner game:',['Take turns rolling and reading. If your partner agrees you read the word correctly, mark it.','The player who reads the most words wins.']],
   ['Race to the bottom:',['Each player picks a column. Roll and read. The first to read every word in a column wins!']]];
  let y=1.75; for(const [h,ls] of S){p.text(0.95,y,9,0.4,h,{bold:true,size:20,align:'left'}); y+=0.42; for(const l of ls){p.text(1.2,y,9,0.32,l,{size:15,align:'left'}); y+=0.32;} y+=0.18;}
  T.footer(p); return p;}
function cover(label,b1,sub){
  const p=new T.Page(); p.rect(0.25,0.25,PW-0.5,PH-0.5,{r:0.28,lw:4,fill:'FFFFFF'});
  p.text(0,0.55,PW,1.2,'Roll and Read',{font:'Pacifico',size:58});
  {const bw=Math.min(9.4,Math.max(3.2,T.textW(label,'Andika',36,true)+0.7));T.bubble(p,PW/2-bw/2,1.85,bw,0.9,label,{size:36});}
  p.text(0,2.9,PW,0.4,sub,{size:17});
  const s=0.42,px=0.95,py=PH-0.85-PH*s; p.rect(px,py,PW*s,PH*s,{lw:1,fill:'FFFFFF'}); scaled(b1,p,px,py,s);
  const lw=3.2; p.image(PW-0.95-lw-0.4,py+(PH*s-lw)/2-0.1,lw,lw); p.text(PW-0.95-lw-0.4,py+(PH*s+lw)/2-0.05,lw,0.3,T.STORE,{size:12});
  return p;}
T.scaled=scaled; T.readLabel=display; T.readPools=pools;
T.products.push({id:'rollread',name:'Roll and Read',title:'Roll and Read',orient:'L',kinds:['reading'],
  section(cfg,seed){
    const sk=cfg.skills[0], label=cfg.label||display(sk), pl=pools(sk), r=T.rng(seed);
    const chal=pl.ch.length>=12;
    const bw=[T.fillGrid(pl.reg,r),T.fillGrid(pl.reg,r),chal?T.fillGrid(pl.ch,r):T.fillGrid(pl.reg,r)];
    const boards=bw.map((w,i)=>board(w,label,i+1,chal&&i===2));
    const info=`<b>${sk.disp||sk.name}</b> · CKLA ${sk.placement}<br>Boards 1–${chal?2:3}: ${pl.reg.length} decodable words (${pl.base}-syllable)<br>`+
      (chal?`Board 3 Challenge: ${pl.ch.length} words`:`No Challenge board (${pl.ch.length} challenge words, needs 12)`)+(pl.note?'<br>'+pl.note:'');
    return {label,pages:[...boards,wordList(sk,label,pl,new Set(bw.flat()))],preview:boards[0],chal,info,repeats:bw.map(b=>36-new Set(b).size)};
  },
  directions(){return [howTo()];},
  cover(secs){const one=secs.length===1, s0=secs[0];
    const sub=one?(s0.chal?'2 game boards + 1 Challenge board':'3 game boards')+'  •  How to Play  •  Word list'
      :`${secs.length} skills  •  ${secs.length*3} game boards  •  How to Play  •  Word lists`;
    return cover(T.skillsText(secs),s0.preview,sub);}
});
})();
