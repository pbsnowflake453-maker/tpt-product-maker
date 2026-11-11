// Picture Write (portrait): 3x3 grid of pictures with a writing line under each, optional word bank, answer key.
// Pictures come from window.IMAGE_MAP (data/images.js). Words mapped to null get a plain placeholder box until real icons are added.
(function(){
const T=TPT, PW=T.PH, PH=T.PW;
// Picture words come only from the Mega Word Bank skill lists (no hand-added extras): every word on a page is decodable for the skill.
const EXTRA={};
function availableWords(skills){
  const M=window.IMAGE_MAP||{}, set=new Set();
  skills.forEach(sk=>{(sk.decodable||[]).forEach(x=>set.add(x[0])); [sk.name].concat(sk.members||[]).forEach(n=>(EXTRA[n]||[]).forEach(w=>set.add(w)));});
  return [...set].filter(w=>w in M);
}
function pic(p,x,y,w,h,word,num){
  p.rect(x,y,w,h,{r:0.08,lw:1.5,fill:'FFFFFF'});
  const ic=T.icons[word];
  if(ic) p.image(x+0.12,y+0.08,w-0.24,h-0.16,ic);
  else { p.rect(x+0.35,y+0.2,w-0.7,h-0.4,{r:0.06,lw:1,dash:'dash',fill:'FFFFFF'}); p.text(x,y,w,h,'picture '+num,{size:11,color:'777777'}); }
}
function header(p,label,title){
  p.text(0.5,0.49,2.0,0.26,'Name:',{size:13,align:'left'}); p.line(1.15,0.71,3.6,0.71,{lw:1});
  const bw=Math.min(4.2,Math.max(2.0,T.textW('Skill: '+label,'Andika',15,true)+0.45));
  T.bubble(p,PW-0.45-bw,0.42,bw,0.44,'Skill: '+label,{size:15});
  p.text(0,0.89,PW,0.5,title,{font:'Pacifico',size:26});
}

function grid(p,top,words,bottom,cb){
  const gap=0.15, cellW=(PW-1.2-2*gap)/3, cellH=(bottom-top-2*gap)/3, picH=cellH-0.65;
  words.forEach((w,i)=>{const c=i%3,r=Math.floor(i/3),x=0.6+c*(cellW+gap),y=top+r*(cellH+gap); pic(p,x,y,cellW,picH,w,i+1); cb(x,y+picH,cellW,w);});
}
function studentPage(words,label,withBank,r){
  const p=new T.Page('P'); T.frame(p); header(p,label,'Write the Word');
  let top=1.52;
  if(withBank){ const bankH=0.85; p.rect(0.6,top,PW-1.2,bankH,{r:0.08,lw:1.6,fill:'FFFFFF'});
    p.text(0.72,top+0.03,1.8,0.26,'Word Bank',{size:11,bold:true,align:'left'});
    const bank=T.shuffle(words,r), cols=5, cw=(PW-1.4)/cols, ch=(bankH-0.3)/Math.ceil(bank.length/cols);
    bank.forEach((w,i)=>p.text(0.7+(i%cols)*cw,top+0.28+Math.floor(i/cols)*ch,cw,ch,w,{size:15}));
    top+=bankH+0.2; }
  grid(p,top,words,PH-0.7,(x,y,w)=>p.line(x+0.1,y+0.5,x+w-0.1,y+0.5,{lw:1.2}));
  T.footer(p); return p;
}
function answerKey(words,label){
  const p=new T.Page('P'); T.frame(p); p.text(0,0.4,PW,0.6,'Answer Key',{font:'Pacifico',size:28});
  const bw=Math.min(6,Math.max(2.5,T.textW(label,'Andika',16,true)+0.5)); T.bubble(p,PW/2-bw/2,1.05,bw,0.44,label,{size:15});
  grid(p,1.75,words,PH-0.7,(x,y,w,word)=>p.text(x,y+0.1,w,0.4,word,{size:18,bold:true}));
  T.footer(p); return p;
}
function howTo(bank){
  const p=new T.Page('P'); T.frame(p); p.text(0,0.55,PW,0.85,'How to Use',{font:'Pacifico',size:36});
  const L=['1. Look at each picture and say the word.','2. Tap or stretch out the sounds.',bank?'3. Find the word in the word bank, then write it on the line.':'3. Write the word on the line under the picture.','4. Check your work with the answer key.'];
  L.forEach((l,i)=>p.text(0.8,1.7+i*0.5,PW-1.6,0.4,l,{size:16,align:'left'})); T.footer(p); return p;
}
function cover(label,n){
  const p=new T.Page('P'); p.rect(0.25,0.25,PW-0.5,PH-0.5,{r:0.28,lw:4,fill:'FFFFFF'});
  p.text(0,1.0,PW,1.1,'Picture Write',{font:'Pacifico',size:52});
  const bw=Math.min(7.2,Math.max(3,T.textW(label,'Andika',26,true)+0.7)); T.bubble(p,PW/2-bw/2,2.5,bw,0.75,label,{size:26});
  p.text(0.6,3.6,PW-1.2,0.5,n+' page'+(n===1?'':'s')+' with answer keys',{size:16});
  p.image(PW/2-1.25,PH-3.6,2.5,2.5); p.text(0,PH-0.85,PW,0.3,T.STORE,{size:13}); return p;
}
T._pwAvail=availableWords;
function pick(cfg,seed){const pool=availableWords(cfg.skills||[]); return {pool,words:T.shuffle(pool,T.rng(seed)).slice(0,9)};}
T.products.push({id:'picturewrite',needs(cfg,seed){return pick(cfg,seed).words;},name:'Picture Write',title:'Picture Write',orient:'P',kinds:['reading'],multiSkill:true,
  section(cfg,seed){
    const r=T.rng(seed), skills=cfg.skills||[], label=cfg.label||skills.map(T.readLabel).join(' • ');
    const {pool,words}=pick(cfg,seed), withBank=!(cfg.opts&&cfg.opts.wordBank===false);
    if(!pool.length) return {label,pages:[],n:0,info:'<span class="warn">No pictures match this skill yet. Pick a skill with picture words (for example short vowels or digraphs), or add icons in data/images.js.</span>'};
    T.shuffle(pool,r); // keep the rng sequence the same as before for the word bank
    const ph=words.filter(w=>!T.icons[w]).length;
    return {label,n:1,pages:[studentPage(words,label,withBank,r),answerKey(words,label)],
      info:`${words.length} pictures${withBank?' · word bank':''} · answer key`+(words.length<9?`<br>Only ${pool.length} picture words for this skill.`:'')+(ph?`<br>${ph} placeholder pictures (real icons not added yet).`:'')};
  },
  directions(cfgs){const o=(cfgs[0]&&cfgs[0].opts)||{}; return [howTo(o.wordBank!==false)];},
  cover(secs){return cover(T.skillsText(secs),secs.reduce((a,s)=>a+s.n,0));}
});
})();
