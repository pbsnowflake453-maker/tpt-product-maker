// Read and Draw (portrait): six decodable sentences per page (2 x 3), a drawing box under each sentence.
// Sentences come from data/sentences.js (window.SENTENCES, built by spec/build_sentences.py from the Mega Word Bank).
// Selection: "Unit N" = sentences written for unit N; "Through Unit N" = units 1..N; any other skill or category = sentences that
// contain a word from that skill and are decodable by the end of the skill's unit.
(function(){
const T=TPT, PW=T.PH, PH=T.PW, PER=6;
const S=()=>window.SENTENCES||[];
const unitOf=sk=>Math.floor((sk.pos||0)/100);
function matcher(sk){
  let m;
  if(sk.group==='CKLA Units'&&(m=sk.name.match(/^Unit (\d)$/))) return s=>s.u===+m[1];
  if(sk.group==='Through Unit'&&(m=sk.name.match(/^Through Unit (\d)$/))) return s=>s.u<=+m[1];
  const set=new Set((sk.decodable||[]).map(x=>x[0].toLowerCase())), u=unitOf(sk);
  return s=>s.u<=u&&s.w.some(w=>set.has(w));
}
function poolFor(skills){const ms=(skills||[]).map(matcher), seen=new Set(), out=[];
  for(const s of S()) if(ms.some(f=>f(s))&&!seen.has(s.t)){seen.add(s.t);out.push(s);} return out;}
T._rdAvail=sk=>poolFor([sk]).length;
function header(p,label){
  p.text(0.5,0.32,2.0,0.26,'Name:',{size:13,align:'left'}); p.line(1.15,0.54,3.6,0.54,{lw:1});
  const bw=Math.min(4.2,Math.max(2.0,T.textW('Skill: '+label,'Andika',15,true)+0.45));
  T.bubble(p,PW-0.45-bw,0.25,bw,0.44,'Skill: '+label,{size:15});
  p.text(0,0.72,PW,0.5,'Read and Draw',{font:'Pacifico',size:26});
}
function layout(text,w,maxH){ // biggest size (22..14pt) whose wrapped lines fit
  for(let size=22;size>=14;size-=1){const L=T.wrapRuns([{t:text,b:false}],'Andika',size,w), lh=size*1.3/72; if(L.length*lh<=maxH||size===14) return {L,size,lh};}
}
function cell(p,x,y,w,h,num,text){
  const tx=x+0.5, tw=w-0.62, th=1.05, bt=y+th+0.1;
  p.oval(x+0.02,y+0.06,0.36,0.36,{fill:'000000'}); p.text(x+0.02,y+0.06,0.36,0.36,String(num),{size:13,bold:true,color:'FFFFFF'});
  const f=layout(text,tw-0.1,th-0.05);
  p.text(tx,y+0.04,tw,th,'',{runs:f.L,size:f.size,align:'left',valign:'top',nowrap:true});
  p.rect(x,bt,w,y+h-bt,{r:0.12,lw:1.5,fill:'FFFFFF'});
}
function studentPage(items,label,startNum){
  const p=new T.Page('P'); T.frame(p); header(p,label);
  const top=1.35,bottom=PH-0.7,gap=0.15,cw=(PW-1.2-gap)/2,ch=(bottom-top-2*gap)/3;
  items.forEach((s,i)=>{const c=i%2,r=Math.floor(i/2); cell(p,0.6+c*(cw+gap),top+r*(ch+gap),cw,ch,startNum+i,s.t);});
  T.footer(p); return p;
}
function howTo(){
  const p=new T.Page('P'); T.frame(p); p.text(0,0.55,PW,0.85,'How to Use',{font:'Pacifico',size:36});
  ['1. Read the sentence.','2. Think about what the sentence says.','3. Draw a picture in the box that matches the sentence.','4. Read your sentence to a partner and show your picture.']
    .forEach((l,i)=>p.text(0.8,1.7+i*0.55,PW-1.6,0.45,l,{size:16,align:'left'})); T.footer(p); return p;
}
function cover(label,n,sents){
  const p=new T.Page('P'); p.rect(0.25,0.25,PW-0.5,PH-0.5,{r:0.28,lw:4,fill:'FFFFFF'});
  p.text(0,1.0,PW,1.1,'Read and Draw',{font:'Pacifico',size:52});
  const bw=Math.min(7.2,Math.max(3,T.textW(label,'Andika',26,true)+0.7)); T.bubble(p,PW/2-bw/2,2.5,bw,0.75,label,{size:26});
  p.text(0.6,3.6,PW-1.2,0.5,`${sents} sentences  •  ${n} page${n===1?'':'s'}`,{size:16});
  p.image(PW/2-1.25,PH-3.6,2.5,2.5); p.text(0,PH-0.85,PW,0.3,T.STORE,{size:13}); return p;
}
function pick(cfg,seed){
  const pool=poolFor(cfg.skills||[]), want=Math.max(1,Math.min(10,(cfg.opts&&+cfg.opts.rdPages)||2));
  const pages=Math.max(pool.length>=PER?1:0,Math.min(want,Math.floor(pool.length/PER)));
  return {pool,pages,items:T.shuffle(pool,T.rng(seed)).slice(0,pages*PER)};
}
T.products.push({id:'readdraw',name:'Read and Draw',title:'Read and Draw',orient:'P',kinds:['reading'],multiSkill:true,
  section(cfg,seed){
    const skills=cfg.skills||[], label=cfg.label||skills.map(T.readLabel).join(' • '), {pool,pages,items}=pick(cfg,seed);
    if(!pages) return {label,pages:[],n:0,sents:0,info:`<span class="warn">Only ${pool.length} sentences match this skill (a page needs ${PER}). Pick a unit, a through-unit, or a broader skill.</span>`};
    const pg=[]; for(let i=0;i<pages;i++) pg.push(studentPage(items.slice(i*PER,(i+1)*PER),label,i*PER+1));
    return {label,n:pages,sents:items.length,pages:pg,info:`${items.length} sentences on ${pages} page${pages>1?'s':''} (6 per page, a drawing box under each)<br>${pool.length} sentences available for this selection.`};
  },
  directions(){return [howTo()];},
  cover(secs){return cover(T.skillsText(secs),secs.reduce((a,s)=>a+s.n,0),secs.reduce((a,s)=>a+(s.sents||0),0));}
});
})();
