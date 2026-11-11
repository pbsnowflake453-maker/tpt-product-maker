// TpT listing images: colorful 2000x2000 PNGs built from the product pages (cover with tilted page mockups, preview images, a "What's included" image) + listing.txt.
// Works for a single product and for bundles. The pages that get screen-grabbed are the ones picked in the page picker (spec.picks = page objects).
window.LISTING=(function(){
const S=2000, T=TPT;
const BLURB={
  rollread:'Students roll a die and read a word from that column. Three boards with a word list, ready to print for centers, small groups, or partners.',
  rollsolve:'Students roll a die and solve a problem from that column. Three boards, each with an answer key.',
  taskcards:'24 task cards (A to X, 4 per page) with a How to Use page, three recording sheet styles, and an answer key.',
  bingo:'Print and play bingo boards with a one page calling sheet and optional cut apart calling cards.',
  mystery:'Color by code mystery picture. Students read each square and color by the key to reveal the picture. Includes a colored answer key.',
  wordsort:'Word sort with headers by skill, cut and paste or write in, plus an answer key.',
  wordmaze:'Word maze: students follow the words that match the skill to find the path. Includes an answer key.',
  coldread:'Cold read passages with key words, running word counts, cold and hot score lines, comprehension questions, and an answer key.',
  picturewrite:'Students look at each picture and write the word on the line. Includes a word bank and an answer key.',
  readdraw:'Students read a decodable sentence and draw a picture to match. Six sentences per page, with a drawing box under each one.',
  wwdraw:'Students read each word and draw a picture to match. Up to 12 words on a page, with a drawing box under each one.',
  wwsounds:'Students read each word, tap a box for every sound, write how many sounds they counted, and write the word on the lines.',
  wwphonics:'Two phonics activities on every page: Read and Draw on top and Count the Sounds below.',
  wwshapes:'Students match each word from the word bank to a row of letter-shape boxes, then write the word on the lines.',
  wwmissing:'Students fill in the missing letters of each word from the word bank, then write the whole word on the lines.',
  wwtricky:'Two word activities on every page: letter-shape boxes on top and missing letters below.'};
const TAGS={rollread:['roll and read','phonics games','reading centers','decodable words','fluency'],rollsolve:['math games','math centers','fact fluency','roll and solve'],
  taskcards:['task cards','scoot','math centers','write the room'],bingo:['bingo','whole group games','phonics games','math games'],
  mystery:['color by code','mystery picture','early finishers','phonics practice'],wordsort:['word sort','phonics','cut and paste','word work'],
  wordmaze:['word maze','phonics','word work','early finishers'],coldread:['cold reads','reading fluency','reading comprehension','decodable passages','fluency assessment'],
  picturewrite:['picture write','phonics','encoding','spelling','word work'],readdraw:['read and draw','decodable sentences','sentence reading','phonics','literacy centers'],
  wwdraw:['read and draw','phonics','word work','literacy centers','decodable words'],wwsounds:['count the sounds','phoneme counting','phonics','word work','encoding'],
  wwphonics:['phonics','word work','read and draw','count the sounds','literacy centers'],wwshapes:['letter shapes','word shapes','spelling words','sight words','word work'],
  wwmissing:['missing letters','fill in the missing letters','spelling words','sight words','word work'],wwtricky:['letter shapes','word shapes','missing letters','sight words','word work']};
// brand: apple red + leaf green from the logo; the other themes keep the same black outlines and white cards
const THEMES={
  apple:{p:'#B71F2B',d:'#7C1019',l:'#FDE7E8',a:'#FFD23F',dot:'#CC3944'},
  sky:{p:'#1F7FD6',d:'#0F4C8A',l:'#E3F1FF',a:'#FFD23F',dot:'#3E96E8'},
  sunny:{p:'#F5A90F',d:'#A86B00',l:'#FFF4D6',a:'#C62833',dot:'#FFBC3A'},
  grape:{p:'#7A3FB0',d:'#4B2073',l:'#F1E6FB',a:'#FFD23F',dot:'#9157C6'},
  mint:{p:'#12A079',d:'#0B6B50',l:'#DDF7EE',a:'#FFD23F',dot:'#33B891'}};
let logo=null; async function getLogo(){ if(logo) return logo; logo=new Image(); logo.src='assets/logo-brand.png'; await logo.decode(); return logo; }
const FONT=(w,s,f)=>`${w} ${s}px ${f}`;
function pageImg(page,maxW,maxH){const c=document.createElement('canvas'); const sc=Math.min(maxW/page.w,maxH/page.h); T.drawCanvas(page,c,sc); return c;}
function newCanvas(){const c=document.createElement('canvas'); c.width=c.height=S; return [c,c.getContext('2d')];}
function rr(g,x,y,w,h,r){g.beginPath(); g.roundRect(x,y,w,h,r);}
function dots(g,col,bg,step,rad){g.fillStyle=bg; g.fillRect(0,0,S,S); g.fillStyle=col; for(let y=-step/2,r=0;y<S+step;y+=step/2,r++)for(let x=(r%2?step/2:0);x<S+step;x+=step){g.beginPath(); g.arc(x,y,rad,0,7); g.fill();}}
function fitFont(g,t,weight,family,max,w,min=24){let s=max; do{g.font=FONT(weight,s,family); s-=4;}while(g.measureText(t).width>w&&s>min); return s+4;}
function wrapText(g,t,weight,family,size,w){g.font=FONT(weight,size,family); const words=t.split(' '),L=[]; let cur=''; for(const x of words){const n=cur?cur+' '+x:x; if(cur&&g.measureText(n).width>w){L.push(cur);cur=x;}else cur=n;} if(cur)L.push(cur); return L;}
function paper(g,img,cx,cy,rot,sh=1){g.save(); g.translate(cx,cy); g.rotate(rot||0); g.shadowColor='rgba(0,0,0,.38)'; g.shadowBlur=44*sh; g.shadowOffsetY=18*sh; g.fillStyle='#fff'; g.fillRect(-img.width/2,-img.height/2,img.width,img.height);
  g.shadowColor='transparent'; g.drawImage(img,-img.width/2,-img.height/2); g.strokeStyle='#000'; g.lineWidth=5; g.strokeRect(-img.width/2,-img.height/2,img.width,img.height); g.restore();}
function pill(g,x,y,w,h,fill,stroke,lw){rr(g,x,y,w,h,h/2); g.fillStyle=fill; g.fill(); if(stroke){g.lineWidth=lw||8; g.strokeStyle=stroke; g.stroke();}}
function burst(g,cx,cy,r,n,fill,stroke,rot){g.save(); g.translate(cx,cy); g.rotate(rot||0); g.beginPath(); for(let i=0;i<n*2;i++){const a=i*Math.PI/n, rad=i%2?r*0.82:r; g.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);} g.closePath(); g.fillStyle=fill; g.fill(); g.lineWidth=8; g.strokeStyle=stroke; g.lineJoin='round'; g.stroke(); g.restore();}
function logoBadge(g,L,cx,cy,r){g.save(); g.beginPath(); g.arc(cx,cy,r,0,7); g.fillStyle='#fff'; g.fill(); g.lineWidth=8; g.strokeStyle='#000'; g.stroke(); g.restore(); g.drawImage(L,cx-r*0.95,cy-r*0.95,r*1.9,r*1.9);}
function textStroke(g,t,x,y,fill,stroke,lw){g.lineJoin='round'; g.lineWidth=lw; g.strokeStyle=stroke; g.strokeText(t,x,y); g.fillStyle=fill; g.fillText(t,x,y);}
// ---- page roles
function roles(doc){
  const n=doc.pages.length, T0=p=>p.items.some.bind(p.items);
  const has=(p,re)=>p.items.some(x=>x.t==='text'&&re.test(x.text));
  const files=doc.files||[{from:0,to:n,kind:'set'}];
  return doc.pages.map((p,i)=>{const f=files.find(f=>i>=f.from&&i<f.to)||files[0];
    if(f.kind==='cover') return i===f.from?'cover':'info';
    if(i===f.from) return 'cover'; if(i===f.to-1) return 'terms';
    if(has(p,/^(How to Play|How to Use|What's Included|What's Included \(continued\))$/)) return 'info';
    if(has(p,/^Answer Key/)) return 'key';
    return 'student';});
}
// ---- drawing pieces
function titleBanner(g,th,title,skillsTxt,{big}){
  const bx=90,by=80,bw=S-180, tw=bw-(big?380:200);
  g.textAlign='center'; g.textBaseline='middle';
  let L=[title], size=fitFont(g,title,'400','Pacifico',big?250:150,tw,60), two=false;
  if(big&&size<150&&title.includes(' ')){ // long titles: two balanced lines in a taller banner
    g.font=FONT(400,100,'Pacifico'); const w=title.split(' '); let best=null;
    for(let i=1;i<w.length;i++){const a=w.slice(0,i).join(' '),c=w.slice(i).join(' '),m=Math.max(g.measureText(a).width,g.measureText(c).width); if(!best||m<best.m)best={a,c,m};}
    if(best){L=[best.a,best.c]; size=Math.min(160,fitFont(g,best.a,'400','Pacifico',200,tw,60),fitFont(g,best.c,'400','Pacifico',200,tw,60)); two=true;}}
  const bh=big?(two?(skillsTxt?660:520):560):420;
  g.save(); g.shadowColor='rgba(0,0,0,.35)'; g.shadowBlur=30; g.shadowOffsetY=14; rr(g,bx,by,bw,bh,90); g.fillStyle='#fff'; g.fill(); g.restore();
  rr(g,bx,by,bw,bh,90); g.lineWidth=12; g.strokeStyle='#000'; g.stroke();
  g.fillStyle='#000'; g.font=FONT(400,size,'Pacifico');
  const lh=size*1.08, mid=two?(skillsTxt?by+235:by+bh/2):(big?(skillsTxt?by+250:by+bh/2):by+bh/2), ty=mid-((L.length-1)*lh)/2;
  L.forEach((l,i)=>g.fillText(l,S/2-(big?90:0),ty+i*lh));
  return {bx,by,bw,bh,two};
}
function skillPill(g,th,txt,cx,cy,maxW,size){
  g.textAlign='center'; g.textBaseline='middle'; const s=fitFont(g,txt,'700','Andika',size,maxW-120,40); g.font=FONT(700,s,'Andika'); const w=Math.min(maxW,g.measureText(txt).width+130), h=s*1.7;
  pill(g,cx-w/2,cy-h/2,w,h,th.p,'#000',10); g.fillStyle='#fff'; g.fillText(txt,cx,cy+s*0.04); return h;
}
function gradeBadge(g,th,grade,cx,cy,r){
  if(!grade) return; burst(g,cx,cy,r,14,th.a,'#000',-0.18); g.save(); g.translate(cx,cy); g.rotate(-0.18); g.fillStyle='#000'; g.textAlign='center'; g.textBaseline='middle';
  const m=grade.match(/^(\S+)\s+(.+)$/), top=m?m[1]:grade, bot=m?m[2]:''; const s1=fitFont(g,top,'700','Fredoka',150,r*1.25,50); g.font=FONT(700,s1,'Fredoka'); g.fillText(top,0,bot?-r*0.12:0);
  if(bot){const s2=fitFont(g,bot.toUpperCase(),'700','Andika',60,r*1.3,26); g.font=FONT(700,s2,'Andika'); g.fillText(bot.toUpperCase(),0,r*0.42);} g.restore();
}
function ribbon(g,th,txt,cx,cy,w){ g.save(); g.translate(cx,cy); g.rotate(-0.05); const h=120; rr(g,-w/2,-h/2,w,h,30); g.fillStyle=th.a; g.fill(); g.lineWidth=8; g.strokeStyle='#000'; g.stroke(); g.fillStyle='#000'; g.textAlign='center'; g.textBaseline='middle'; const s=fitFont(g,txt,'700','Fredoka',78,w-60,30); g.font=FONT(700,s,'Fredoka'); g.fillText(txt,0,4); g.restore(); }
function footerBar(g,th,L,txt,y){
  g.textAlign='left'; g.textBaseline='middle'; g.font=FONT(700,56,'Andika'); const w=g.measureText(T.STORE).width+110; pill(g,70,y-70,w,140,'#fff','#000',8); g.fillStyle='#000'; g.fillText(T.STORE,125,y+3);
  logoBadge(g,L,S-210,y-10,150);
}
// ---- images
async function cover(spec,th,L,st){
  const [c,g]=newCanvas(); dots(g,th.dot,th.p,150,26);
  const skillsTxt=skillsLine(spec.skills);
  const bn=titleBanner(g,th,spec.title,skillsTxt,{big:true});
  if(skillsTxt) skillPill(g,th,skillsTxt,S/2-90,bn.by+bn.bh-(bn.two?105:135),bn.bw-380,bn.two?92:118);
  gradeBadge(g,th,spec.opts.grade,S-185,195,175);
  // tilted, stacked page mockups
  const pics=(spec.picks.length?spec.picks:st.defaultPicks).slice(0,3);
  const box=bn.two?(pics.length===1?[1200,1000]:[1060,960]):(pics.length===1?[1300,1150]:[1120,1030]); const ims=pics.map(p=>pageImg(p,box[0],box[1]));
  const cy=bn.two?1310:1250;
  if(ims.length===1) paper(g,ims[0],S/2,cy,0);
  else if(ims.length===2){paper(g,ims[0],S/2-300,cy+10,-0.1); paper(g,ims[1],S/2+300,cy-10,0.07);}
  else {paper(g,ims[2],S/2-360,cy+30,-0.13); paper(g,ims[1],S/2+360,cy+10,0.1); paper(g,ims[0],S/2,cy-20,-0.015);}
  if(st.hasKey) burst(g,230,985,150,13,th.a,'#000',0.2), (g.save(),g.translate(230,985),g.rotate(0.2),g.fillStyle='#000',g.textAlign='center',g.textBaseline='middle',g.font=FONT(700,58,'Fredoka'),g.fillText('ANSWER',0,-26),g.fillText('KEY',0,34),g.restore());
  if(spec.isBundle) ribbon(g,th,`BUNDLE OF ${spec.nSets}`,S/2,1760,760);
  else ribbon(g,th,st.nStudent+(st.nStudent===1?' PAGE':' PAGES')+' • POWERPOINT + PDF',S/2,1760,1280);
  footerBar(g,th,L,'',1895);
  return c;
}
async function preview(spec,th,L,page,role,k,total,prodTitle,skillsTxt){
  const [c,g]=newCanvas(); dots(g,th.p+'22',th.l,150,22);
  // colored header band
  g.fillStyle=th.p; g.fillRect(0,0,S,340); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(0,340,S,12);
  g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; const s=fitFont(g,prodTitle,'400','Pacifico',170,S-300,60); g.font=FONT(400,s,'Pacifico'); g.fillText(prodTitle,S/2,skillsTxt?140:170);
  if(skillsTxt){g.font=FONT(700,70,'Andika'); const w=Math.min(S-300,fitW(g,skillsTxt,'700',70,'Andika')+110); pill(g,S/2-w/2,238,w,96,'#fff','#000',7); g.fillStyle='#000'; g.font=FONT(700,fitFont(g,skillsTxt,'700','Andika',64,w-100,30),'Andika'); g.fillText(skillsTxt,S/2,288);}
  const im=pageImg(page,1620,1300); paper(g,im,S/2,340+(S-340-250)/2+50,(k%2?0.012:-0.012));
  const label=role==='key'?'ANSWER KEY':'PREVIEW'; g.font=FONT(700,72,'Fredoka'); const w=g.measureText(label).width+150; pill(g,70,S-210,w,130,th.a,'#000',8); g.fillStyle='#000'; g.textAlign='left'; g.fillText(label,145,S-142);
  logoBadge(g,L,S-210,S-150,130);
  return c;
}
function fitW(g,t,wt,size,fam){g.font=FONT(wt,size,fam);return g.measureText(t).width;}
async function included(spec,th,L,st){
  const [c,g]=newCanvas(); dots(g,th.dot,th.p,150,26);
  g.save(); g.shadowColor='rgba(0,0,0,.35)'; g.shadowBlur=30; g.shadowOffsetY=14; rr(g,110,110,S-220,S-420,90); g.fillStyle='#fff'; g.fill(); g.restore(); rr(g,110,110,S-220,S-420,90); g.lineWidth=12; g.strokeStyle='#000'; g.stroke();
  g.fillStyle=th.d; g.textAlign='center'; g.textBaseline='middle'; g.font=FONT(400,190,'Pacifico'); g.fillText("What's Included",S/2,300);
  const items=st.included, x0=300, cardTop=420, cardBot=S-310; const sz=Math.min(...items.map(t=>fitFont(g,t,'700','Andika',88,S-x0-260-110,40)));
  const gap=Math.min(210,(cardBot-cardTop-80)/items.length); let y=cardTop+(cardBot-cardTop-gap*(items.length-1))/2;
  items.forEach(t=>{ g.fillStyle=th.p; g.beginPath(); g.arc(x0,y,62,0,7); g.fill(); g.lineWidth=8; g.strokeStyle='#000'; g.stroke(); g.strokeStyle='#fff'; g.lineWidth=17; g.lineCap='round'; g.beginPath(); g.moveTo(x0-28,y+2); g.lineTo(x0-8,y+24); g.lineTo(x0+32,y-22); g.stroke();
    g.fillStyle='#000'; g.textAlign='left'; g.font=FONT(700,sz,'Andika'); g.fillText(t,x0+110,y+4); y+=gap; });
  footerBar(g,th,L,'',1895);
  return c;
}
function skillsLine(skills){if(!skills||!skills.length) return ''; return skills.length<=3?skills.join(' • '):skills.slice(0,2).join(' • ')+` + ${skills.length-2} more`;}
function stats(spec){
  const doc=spec.doc, R=roles(doc), pages=doc.pages;
  const idx=(r)=>R.map((x,i)=>x===r?i:-1).filter(i=>i>=0);
  const student=idx('student'), keys=idx('key');
  const nStudent=student.length+keys.length;
  let defaultPicks;
  if(spec.isBundle&&doc.sets&&doc.sets.length>1){defaultPicks=doc.sets.map(se=>student.find(i=>i>=se.from&&i<se.to)).filter(i=>i!=null).map(i=>pages[i]);}
  if(!defaultPicks||!defaultPicks.length) defaultPicks=student.length?[pages[student[0]],pages[student[Math.min(1,student.length-1)]],pages[student[Math.min(2,student.length-1)]]].filter((p,i,a)=>a.indexOf(p)===i):pages.slice(1,3);
  const hasKey=keys.length>0, txt=[];
  const included=[];
  if(spec.isBundle) included.push(`${spec.nSets} sets in one file`);
  included.push(`${student.length} student page${student.length===1?'':'s'}`);
  if(hasKey) included.push(`Answer key${keys.length>1?'s':''}`);
  if(idx('info').length) included.push('Directions page');
  included.push('Editable PowerPoint file');
  included.push('PDF, ready to print');
  included.push('Print and go');
  return {R,student,keys,nStudent,defaultPicks,hasKey,included};
}
async function build(spec){
  spec.opts=spec.opts||{}; spec.picks=spec.picks||[];
  const th=THEMES[spec.opts.theme]||THEMES.apple, L=await getLogo(), st=stats(spec), out=[];
  spec.title=spec.title||(spec.isBundle?(spec.prods.map(p=>p.title).filter((v,i,a)=>a.indexOf(v)===i).join(', ')+' Bundle'):spec.prod.title);
  const skillsTxt=skillsLine(spec.skills);
  out.push(['01-cover.png',await cover(spec,th,L,st)]);
  const picks=spec.picks.length?spec.picks:[...st.defaultPicks.slice(0,3)].concat(st.keys.length?[spec.doc.pages[st.keys[0]]]:[]);
  const prodFor=(pg)=>{ // bundles: name the product the page belongs to
    if(!spec.isBundle||!spec.doc.sets) return spec.prod.title; const i=spec.doc.pages.indexOf(pg); const s=spec.doc.sets.find(s=>i>=s.from&&i<s.to); return s?s.prod.title:spec.prod.title;};
  const labFor=(pg)=>{ if(!spec.isBundle||!spec.doc.sets) return skillsTxt; const i=spec.doc.pages.indexOf(pg); const s=spec.doc.sets.find(s=>i>=s.from&&i<s.to); return s?skillsLine(BUNDLE.skillsOf([s.sec.label])):skillsTxt;};
  let k=0; for(const pg of picks.slice(0,9)){ const role=st.R[spec.doc.pages.indexOf(pg)]; k++; out.push([`${String(k+1).padStart(2,'0')}-preview.png`,await preview(spec,th,L,pg,role,k,picks.length,prodFor(pg),labFor(pg))]); }
  out.push([`${String(k+2).padStart(2,'0')}-whats-included.png`,await included(spec,th,L,st)]);
  const first=spec.prod, label=skillsTxt, grade=spec.opts.grade;
  const title=`${spec.title}${label?' - '+label:''}${grade?' - '+grade:''}`.replace(/\u2014/g,'-');
  const prods=[...new Set((spec.prods||[spec.prod]).map(p=>p.id))];
  const blurb=prods.map(id=>BLURB[id]).filter(Boolean).join(' ');
  const txt=`TITLE\n${title}\n\nDESCRIPTION\n${spec.isBundle?`Bundle of ${spec.nSets} sets in one file. `:''}${blurb}${grade?`\n\nMade for ${grade}.`:''}\n\nWhat's included:\n${st.included.map(x=>'- '+x).join('\n')}\n${label?'\nSkill: '+label+'\n':''}\nTAGS\n${prods.flatMap(id=>TAGS[id]||[]).filter((v,i,a)=>a.indexOf(v)===i).concat(spec.skills||[]).join(', ')}\n`;
  return {images:out,txt,title};
}
async function zip(spec,fname){
  const r=await build(spec); const z=new JSZip();
  for(const [n,c] of r.images){ const b=await new Promise(res=>c.toBlob(res,'image/png')); z.file(n,b); }
  z.file('listing.txt',r.txt); const blob=await z.generateAsync({type:'blob'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=fname+' - TpT listing images.zip'; document.body.appendChild(a); a.click(); a.remove(); return r;
}
return {build,zip,THEMES};
})();
