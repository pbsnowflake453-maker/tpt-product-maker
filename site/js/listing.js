// TpT listing images: colorful 2000x2000 PNGs built from the product pages (cover with tilted page mockups, preview images, a "What's included" image) + listing.txt.
// Works for a single product, for bundles, and for the drop-in tool (listing.html: any PDF / PPTX / image pages). spec.text holds optional text overrides (title, skills pill, subtitle, ribbon, ...); see defaults().
// Works for a single product and for bundles. The pages that get screen-grabbed are the ones picked in the page picker (spec.picks = page objects).
window.LISTING=(function(){
const S=2000, T=window.TPT||{}, STORE=T.STORE||'My Side of the Classroom';
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
function pageImg(page,maxW,maxH){const c=document.createElement('canvas'); const sc=Math.min(maxW/page.w,maxH/page.h);
  if(page.canvas){ // drop-in pages: a pre-rendered source canvas (PDF page, slide, or picture) scaled to fit
    c.width=Math.max(1,Math.round(page.w*sc)); c.height=Math.max(1,Math.round(page.h*sc)); const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,c.width,c.height); g.imageSmoothingQuality='high';
    let src=page.canvas; while(src.width/2>c.width){const t=document.createElement('canvas'); t.width=Math.ceil(src.width/2); t.height=Math.ceil(src.height/2); const tg=t.getContext('2d'); tg.imageSmoothingQuality='high'; tg.drawImage(src,0,0,t.width,t.height); src=t;}
    g.drawImage(src,0,0,c.width,c.height); return c; }
  T.drawCanvas(page,c,sc); return c;}
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
// ---- optional text overrides (drop-in tool): spec.text = {skills, subtitle, ribbon, keyTop, keyBot, keyBurst, previewLabel, keyLabel, previewTitle, previewPill, store, included[], blurb, tags}
const TX=spec=>spec.text||{};
const has=(o,k)=>o[k]!==undefined&&o[k]!==null;
// ---- page roles
function roles(doc){
  if(doc.pages.length&&doc.pages.every(p=>p.role)) return doc.pages.map(p=>p.role); // drop-in pages carry their own role ('student' or 'key')
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
function titleBanner(g,th,title,skillsTxt,{big,sub}){
  const bx=90,by=80,bw=S-180, tw=bw-(big?380:200);
  g.textAlign='center'; g.textBaseline='middle';
  let L=[title], size=fitFont(g,title,'400','Pacifico',big?250:150,tw,60), two=false;
  if(big&&size<150&&title.includes(' ')){ // long titles: two balanced lines in a taller banner
    g.font=FONT(400,100,'Pacifico'); const w=title.split(' '); let best=null;
    for(let i=1;i<w.length;i++){const a=w.slice(0,i).join(' '),c=w.slice(i).join(' '),m=Math.max(g.measureText(a).width,g.measureText(c).width); if(!best||m<best.m)best={a,c,m};}
    if(best){L=[best.a,best.c]; size=Math.min(160,fitFont(g,best.a,'400','Pacifico',200,tw,60),fitFont(g,best.c,'400','Pacifico',200,tw,60)); two=true;}}
  const subH=sub?150:0; // optional subtitle line: the banner grows to hold it
  const bh=(big?(two?(skillsTxt?660:520):560):420)+subH;
  g.save(); g.shadowColor='rgba(0,0,0,.35)'; g.shadowBlur=30; g.shadowOffsetY=14; rr(g,bx,by,bw,bh,90); g.fillStyle='#fff'; g.fill(); g.restore();
  rr(g,bx,by,bw,bh,90); g.lineWidth=12; g.strokeStyle='#000'; g.stroke();
  g.fillStyle='#000'; g.font=FONT(400,size,'Pacifico');
  const lh=size*1.08, mid=two?(skillsTxt?by+235:by+(bh-subH)/2):(big?(skillsTxt?by+250:by+(bh-subH)/2):by+(bh-subH)/2), ty=mid-(sub?22:0)-((L.length-1)*lh)/2;
  L.forEach((l,i)=>g.fillText(l,S/2-(big?90:0),ty+i*lh));
  if(sub){ const cxs=S/2-(big?90:0), ss=fitFont(g,sub,'700','Andika',70,tw,34); g.font=FONT(700,ss,'Andika'); g.fillStyle='#333'; g.fillText(sub,cxs,ty+(L.length-1)*lh+size*0.42+68); }
  return {bx,by,bw,bh,two,subH};
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
function ribbon(g,th,txt,cx,cy,w){ /* level: no tilt */ g.save(); g.translate(cx,cy); const h=120; rr(g,-w/2,-h/2,w,h,30); g.fillStyle=th.a; g.fill(); g.lineWidth=8; g.strokeStyle='#000'; g.stroke(); g.fillStyle='#000'; g.textAlign='center'; g.textBaseline='middle'; const s=fitFont(g,txt,'700','Fredoka',78,w-60,30); g.font=FONT(700,s,'Fredoka'); g.fillText(txt,0,4); g.restore(); }
function footerBar(g,th,L,store,y){
  // store-name pill: small, level, and centered on the logo badge (which now sits fully inside the image)
  const name=store==null||store===''?STORE:store, r=128, cy=Math.min(y,S-r-26);
  g.textAlign='left'; g.textBaseline='middle'; g.font=FONT(700,38,'Andika'); const w=g.measureText(name).width+72, h=76; pill(g,70,cy-h/2,w,h,'#fff','#000',6); g.fillStyle='#000'; g.fillText(name,70+36,cy+2);
  logoBadge(g,L,S-70-r,cy,r);
}
// ---- images
// Style B: pastel frame, chunky multicolor title, black banners, collage cards, starburst badge
const BOLD={
  pastels:['#E098A0','#F0C088','#C5DC8E','#8ED4C4','#8FA6DC','#C56BB0'],
  bands:['#F6D4D8','#FDE8C4','#DCECB8','#C8EDE4','#D4DEF6','#EBD0E6'],
  frame:'#E89AA3',
  fw:52
};
function cleanTxt(t){return String(t||'').replace(/[\u2014\u2013]/g,' ').replace(/\bcharacters?\b/gi,' ').replace(/\s+/g,' ').trim();}
function up(t){return cleanTxt(t).toUpperCase();}
function boldRibbon(spec,st){
  const X=TX(spec);
  if(has(X,'ribbon')&&cleanTxt(X.ribbon)) return up(X.ribbon);
  return spec.isBundle?'HUGE BUNDLE':'POWERPOINT + PDF';
}
function boldDisplayTitle(spec){
  const t=cleanTxt(spec.title||'');
  if(spec.isBundle&&t.length>16) return 'BUNDLE';
  return t||'LISTING';
}
function bannerLine(spec,st){
  const X=TX(spec);
  const skills=cleanTxt(has(X,'skills')?X.skills:skillsOf(spec));
  if(skills) return skills;
  if(spec.opts&&spec.opts.grade) return spec.opts.grade;
  return spec.isBundle?'PRINT AND GO':'STUDENT PAGES';
}
function chunkyWidth(g,str,size){
  g.font=FONT(700,size,'Fredoka');
  let w=0; for(const ch of str) w+=ch===' '?size*0.35:g.measureText(ch).width*0.9;
  return w;
}
function fitChunky(g,text,maxW,maxSize,minSize){
  const words=up(text).split(' ').filter(Boolean);
  const one=words.join(' ')||'LISTING';
  const pad=s=>Math.round(s*0.23);
  let oneSize=maxSize;
  while(oneSize>minSize&&chunkyWidth(g,one,oneSize)+pad(oneSize)>maxW) oneSize-=4;
  if(oneSize>=Math.max(minSize+20,120)||words.length<=2||one.replace(/ /g,'').length<=12){
    if(chunkyWidth(g,one,oneSize)+pad(oneSize)<=maxW) return {lines:[one],size:oneSize};
  }
  if(words.length>=2){
    let best=null;
    for(let i=1;i<words.length;i++){
      const a=words.slice(0,i).join(' '), b=words.slice(i).join(' ');
      let s=maxSize;
      while(s>minSize&&(chunkyWidth(g,a,s)+pad(s)>maxW||chunkyWidth(g,b,s)+pad(s)>maxW)) s-=4;
      const score=s-Math.abs(a.length-b.length)*0.8;
      if(!best||score>best.score) best={lines:[a,b],size:s,score};
    }
    if(best) return {lines:best.lines,size:best.size};
  }
  return {lines:[one],size:oneSize};
}
function drawChunky(g,text,cx,cy,size){
  g.font=FONT(700,size,'Fredoka');
  g.textAlign='center'; g.textBaseline='middle';
  g.lineJoin='round'; g.lineCap='round';
  const chars=[...text];
  const widths=chars.map(ch=>ch===' '?size*0.35:g.measureText(ch).width*0.9);
  const total=widths.reduce((a,b)=>a+b,0);
  let x=cx-total/2, li=0;
  const sw=Math.max(16,size*0.145), ox=Math.round(size*0.08), oy=Math.round(size*0.1);
  chars.forEach((ch,i)=>{
    const w=widths[i];
    if(ch===' '){ x+=w; return; }
    const col=BOLD.pastels[li%BOLD.pastels.length];
    const jig=Math.sin(i*2.15)*size*0.045;
    const rot=(i%2?1:-1)*(0.028+((i*7)%5)*0.005);
    g.save(); g.translate(x+w/2,cy+jig); g.rotate(rot);
    g.strokeStyle='#000'; g.fillStyle='#000'; g.lineWidth=sw;
    g.strokeText(ch,ox,oy); g.fillText(ch,ox,oy);
    g.strokeStyle='#000'; g.fillStyle=col; g.lineWidth=sw;
    g.strokeText(ch,0,0); g.fillText(ch,0,0);
    g.restore();
    x+=w; li++;
  });
}
function drawTitleBlock(g,title,top,maxW,maxH){
  const fit=fitChunky(g,title,maxW,Math.min(430,Math.floor(maxH*0.98)),64);
  const lh=fit.size*1.18, blockH=fit.lines.length*lh;
  const used=Math.min(blockH,maxH);
  let y=top+fit.size*0.58+(maxH-used)*0.28;
  fit.lines.forEach(line=>{ drawChunky(g,line,S/2,y,fit.size); y+=lh; });
  return top+used+(maxH-used)*0.28+fit.size*0.12;
}
function drawBlackBanner(g,y,h,text,maxSize,rightInset){
  g.fillStyle='#000'; g.fillRect(0,y,S,h);
  const t=up(text); if(!t) return y+h;
  const inset=rightInset||0;
  g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle';
  const s=fitFont(g,t,'700','Fredoka',maxSize||Math.floor(h*0.86),S-160-inset,26);
  g.font=FONT(700,s,'Fredoka'); g.fillText(t,(S-inset)/2,y+h/2);
  return y+h;
}
function drawPinkFrame(g){
  const t=BOLD.fw; g.fillStyle=BOLD.frame;
  g.fillRect(0,0,S,t); g.fillRect(0,S-t,S,t); g.fillRect(0,0,t,S); g.fillRect(S-t,0,t,S);
}
// Bottom bar sits fully above the pink frame. Logo stays inside the banner.
function styleBFooter(botH,logoR){
  const fw=BOLD.fw, stroke=8, pad=18;
  const h=botH, y=S-fw-h;
  const r=Math.min(logoR, Math.floor((h-stroke-pad)/2));
  const cx=S-fw-pad-r, cy=y+h/2;
  return {y,h,logoX:cx,logoY:cy,logoR:r,inset:S-cx+r+28};
}
function scallopBadge(g,cx,cy,r,top,bot){
  const n=20, bump=r*0.17;
  g.save(); g.translate(cx,cy); g.rotate(-0.05);
  g.fillStyle='#000';
  g.beginPath(); g.arc(0,0,r*0.86,0,7); g.fill();
  for(let i=0;i<n;i++){ const a=i*Math.PI*2/n; g.beginPath(); g.arc(Math.cos(a)*r*0.86,Math.sin(a)*r*0.86,bump,0,7); g.fill(); }
  g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle';
  const hasBot=!!(bot&&String(bot).trim());
  const topS=fitFont(g,top||'','700','Fredoka',hasBot?r*0.7:r*0.78,r*1.3,16);
  g.font=FONT(700,topS,'Fredoka'); g.fillText(top||'',0,hasBot?-r*0.14:0);
  if(hasBot){ const botS=fitFont(g,bot,'700','Fredoka',r*0.28,r*1.25,12); g.font=FONT(700,botS,'Fredoka'); g.fillText(bot,0,r*0.34); }
  g.restore();
}
function badgeCopy(spec,st){
  let autoTop,autoBot;
  if(spec.isBundle){ const n=spec.nSets||1; autoTop=String(n); autoBot=n===1?'SET':'SETS'; }
  else { const n=(st&&st.R||[]).filter(r=>r==='student'||r==='key'||r==='info').length||(st&&st.nStudent)||1; autoTop=String(Math.max(n,1)); autoBot=n===1?'PAGE':'PAGES'; }
  const o=spec.opts||{}, top=cleanTxt(o.burstTop), bot=cleanTxt(o.burstBot);
  return {top:top?up(top):autoTop, bot:bot?up(bot):autoBot};
}
function scaleCard(card,maxW,maxH){
  const s=Math.min(maxW/card.width,maxH/card.height,2.2);
  if(Math.abs(s-1)<0.04) return card;
  const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(card.width*s)); c.height=Math.max(1,Math.round(card.height*s));
  const g=c.getContext('2d'); g.imageSmoothingQuality='high'; g.drawImage(card,0,0,c.width,c.height); return c;
}
function boldPicks(spec,st){
  const pages=spec.doc&&spec.doc.pages||[];
  const seen=new Set(), out=[];
  const add=p=>{ if(!p||seen.has(p)||out.length>=6) return; seen.add(p); out.push(p); };
  if(spec.picks&&spec.picks.length){ spec.picks.forEach(add); return out; }
  (st.defaultPicks||[]).forEach(add);
  pages.forEach((p,i)=>{ if(st.R&&st.R[i]==='student') add(p); });
  pages.forEach((p,i)=>{ if(st.R&&st.R[i]==='key') add(p); });
  pages.forEach((p,i)=>{ if(st.R&&st.R[i]==='info') add(p); });
  pages.forEach((p,i)=>{ if(st.R&&st.R[i]!=='terms'&&st.R[i]!=='cover') add(p); });
  return out;
}
function drawCollage(g,cards,top,bot){
  const n=cards.length, fw=BOLD.fw, gap=40;
  if(!n) return {cx:S/2,cy:(top+bot)/2,r:180};
  const areaL=fw+40, areaR=S-fw-40, areaW=areaR-areaL, areaH=Math.max(200,bot-top);
  const rowCounts=n<=1?[1]:n===2?[2]:n===3?[3]:n===4?[2,2]:n===5?[3,2]:[3,3];
  const maxCols=Math.max(...rowCounts);
  const cellW=(areaW-(maxCols-1)*gap)/maxCols;
  const cellH=(areaH-(rowCounts.length-1)*gap)/rowCounts.length;
  const totalH=rowCounts.length*cellH+(rowCounts.length-1)*gap;
  let y=top+(areaH-totalH)/2+cellH/2;
  const placed=[]; let idx=0;
  for(const count of rowCounts){
    const row=cards.slice(idx,idx+count).map(c=>scaleCard(c,cellW,cellH)); idx+=count;
    const rowW=row.reduce((s,c)=>s+c.width,0)+(row.length-1)*gap;
    let x=areaL+(areaW-rowW)/2;
    for(const sc of row){
      const cx=x+sc.width/2, cy=y;
      paper(g,sc,cx,cy,0,1);
      placed.push({cx,cy,w:sc.width,h:sc.height});
      x+=sc.width+gap;
    }
    y+=cellH+gap;
  }
  // starburst overlaps a lower-right corner, or fills the empty slot when there are 5 pages
  const last=placed[placed.length-1];
  let cx,cy,rad;
  if(n===5){
    cx=areaL+areaW-cellW*0.45; cy=y-cellH-gap; rad=Math.min(220,Math.round(Math.min(cellW,cellH)*0.48));
  } else {
    rad=Math.min(200,Math.round(Math.min(last.w,last.h)*0.4));
    cx=last.cx+last.w/2-rad*0.35;
    cy=last.cy+last.h/2-rad*0.45;
  }
  rad=Math.max(140,rad);
  cy=Math.min(cy,bot-rad-6);
  cx=Math.min(cx,areaR-rad*0.25);
  cx=Math.max(cx,areaL+rad*0.25);
  return {cx,cy,r:rad};
}
async function coverBold(spec,th,L,st){
  const [c,g]=newCanvas(); g.fillStyle='#fff'; g.fillRect(0,0,S,S);
  const title=boldDisplayTitle(spec);
  const top=BOLD.fw+8, titleMaxH=430, maxW=S-BOLD.fw*2-40;
  const titleBot=drawTitleBlock(g,title,top,maxW,titleMaxH);
  const banH=176, banY=Math.max(titleBot+4, 460);
  drawBlackBanner(g,banY,banH,bannerLine(spec,st));
  const foot=styleBFooter(210,88);
  const pics=boldPicks(spec,st);
  const cards=pics.map(p=>pageImg(p,1000,900));
  const slot=drawCollage(g,cards,banY+banH+6,foot.y-8);
  const badge=badgeCopy(spec,st);
  scallopBadge(g,slot.cx,slot.cy,slot.r,badge.top,badge.bot);
  drawBlackBanner(g,foot.y,foot.h,boldRibbon(spec,st),Math.floor(foot.h*0.72),foot.inset);
  logoBadge(g,L,foot.logoX,foot.logoY,foot.logoR);
  drawPinkFrame(g);
  return c;
}
async function previewBold(spec,th,L,page,role,k,total,prodTitle,skillsTxt){
  const [c,g]=newCanvas(); g.fillStyle='#fff'; g.fillRect(0,0,S,S);
  const title=cleanTxt(prodTitle)||boldDisplayTitle(spec);
  const titleBot=drawTitleBlock(g,title,BOLD.fw+8,S-BOLD.fw*2-40,340);
  const X=TX(spec), label=(role==='key'?(has(X,'keyLabel')?X.keyLabel:'ANSWER KEY'):(has(X,'previewLabel')?X.previewLabel:'PREVIEW'));
  const banY=Math.max(titleBot+4,390), banH=156;
  drawBlackBanner(g,banY,banH,skillsTxt||bannerLine(spec,null));
  const foot=styleBFooter(200,80);
  const midTop=banY+banH+20, midBot=foot.y-20, midH=midBot-midTop;
  const sc=scaleCard(pageImg(page,1500,1200),S-BOLD.fw*2-80,midH);
  paper(g,sc,S/2,(midTop+midBot)/2,0,1.1);
  if(label) drawBlackBanner(g,foot.y,foot.h,label,Math.floor(foot.h*0.72),foot.inset);
  else g.fillStyle='#000', g.fillRect(0,foot.y,S,foot.h);
  logoBadge(g,L,foot.logoX,foot.logoY,foot.logoR);
  drawPinkFrame(g);
  return c;
}
async function includedBold(spec,th,L,st){
  const [c,g]=newCanvas(); g.fillStyle='#fff'; g.fillRect(0,0,S,S);
  const titleBot=drawTitleBlock(g,"WHAT'S INCLUDED",BOLD.fw+8,S-BOLD.fw*2-40,360);
  const banY=Math.max(titleBot+6, 430), banH=140;
  drawBlackBanner(g,banY,banH,bannerLine(spec,st),90);
  const items=defaults(spec,st).included.map(cleanTxt).filter(Boolean);
  const foot=styleBFooter(200,80), top=banY+banH+50, bot=foot.y-40;
  const gap=Math.min(200,(bot-top)/Math.max(items.length,1));
  const x0=280;
  items.forEach((t,i)=>{
    const y=top+gap*i+gap*0.45;
    const band=BOLD.bands[i%BOLD.bands.length];
    const cardX=x0-120, cardW=S-cardX-140, cardH=Math.min(150,gap-16);
    rr(g,cardX,y-cardH/2,cardW,cardH,28); g.fillStyle='#fff'; g.fill(); g.lineWidth=8; g.strokeStyle='#000'; g.stroke();
    g.fillStyle=band; g.beginPath(); g.arc(x0,y,42,0,7); g.fill(); g.lineWidth=7; g.strokeStyle='#000'; g.stroke();
    g.strokeStyle='#000'; g.lineWidth=10; g.lineCap='round'; g.lineJoin='round';
    g.beginPath(); g.moveTo(x0-16,y+2); g.lineTo(x0-3,y+16); g.lineTo(x0+20,y-14); g.stroke();
    g.fillStyle='#000'; g.textAlign='left'; g.textBaseline='middle';
    const ts=fitFont(g,t,'700','Andika',52,cardW-220,26);
    g.font=FONT(700,ts,'Andika'); g.fillText(t,x0+80,y+3);
  });
  drawBlackBanner(g,foot.y,foot.h,boldRibbon(spec,st),Math.floor(foot.h*0.72),foot.inset);
  logoBadge(g,L,foot.logoX,foot.logoY,foot.logoR);
  drawPinkFrame(g);
  return c;
}
// ---- Style C: title in a bold band across the middle, page grabs tucked above and below, theme colors
function bandPicks(spec,st){ const all=boldPicks(spec,st); return (spec.picks&&spec.picks.length)?all.slice(0,6):all.slice(0,4); }
function bandRow(g,cards,cx,W,gap,y0,yMax,anchor,tiltBase){ // anchor 'bottom': cards sit on y0 (their bottom edge); 'top': cards hang from y0
  if(!cards.length) return;
  const w=cards.reduce((a,c)=>a+c.width,0)+(cards.length-1)*gap; let x=cx-w/2;
  cards.forEach((c,i)=>{ const tilt=(i%2?1:-1)*tiltBase*(cards.length===1?0.4:1); const cxx=x+c.width/2, cyy=anchor==='bottom'?y0-c.height/2:y0+c.height/2; paper(g,c,cxx,cyy,tilt,1.1); x+=c.width+gap; });
}
function drawBand(g,th,y,h){
  g.save(); g.shadowColor='rgba(0,0,0,.4)'; g.shadowBlur=36; g.shadowOffsetY=14; g.fillStyle='#fff'; g.fillRect(-20,y,S+40,h); g.restore();
  g.fillStyle='#fff'; g.fillRect(-20,y,S+40,h);
  // two level accent stripes (theme accent) just inside the black edges
  g.fillStyle=th.a; g.fillRect(-20,y+16,S+40,18); g.fillRect(-20,y+h-34,S+40,18);
  g.fillStyle='#000'; g.fillRect(-20,y,S+40,12); g.fillRect(-20,y+h-12,S+40,12);
  g.fillRect(-20,y+34,S+40,5); g.fillRect(-20,y+h-39,S+40,5);
}
async function coverBand(spec,th,L,st){
  const [c,g]=newCanvas(); dots(g,th.dot,th.p,150,26); const X=TX(spec);
  const title=cleanTxt(spec.title||'')||'Listing', skillsTxt=cleanTxt(skillsOf(spec)), sub=cleanTxt(X.subtitle), grade=(spec.opts&&spec.opts.grade)||'';
  const showKey=has(X,'keyBurst')?X.keyBurst:st.hasKey;
  const leftLim=showKey?420:90, rightLim=grade?S-420:S-90, W=rightLim-leftLim, cx=(leftLim+rightLim)/2;
  // title: one line if it fits at a good size, otherwise two balanced lines
  let L1=[title], size=fitFont(g,title,'400','Pacifico',240,W,60);
  if(size<170&&title.includes(' ')){ g.font=FONT(400,100,'Pacifico'); const w=title.split(' '); let best=null;
    for(let i=1;i<w.length;i++){const a=w.slice(0,i).join(' '),b=w.slice(i).join(' '),m=Math.max(g.measureText(a).width,g.measureText(b).width); if(!best||m<best.m)best={a,b,m};}
    if(best){ const s2=Math.min(200,fitFont(g,best.a,'400','Pacifico',200,W,60),fitFont(g,best.b,'400','Pacifico',200,W,60)); if(s2>size){L1=[best.a,best.b]; size=s2;} } }
  const lh=size*1.1, titleH=L1.length*lh, subH=sub?96:0, pillH=skillsTxt?150:0;
  const bandH=Math.round(Math.min(760,Math.max(400,titleH+subH+pillH+130)));
  const gap=1630-bandH, zh=gap/2, tuck=38, bandY=Math.round(40+zh), bandBot=bandY+bandH;
  // page grabs behind the band: top row hangs above it, bottom row below it
  const pics=bandPicks(spec,st), nTop=Math.ceil(pics.length/2), nBot=pics.length-nTop, cardH=Math.round(zh+tuck-14);
  const mk=(arr)=>{ const cols=Math.max(arr.length,1), cw=Math.min(720,(S-120-(cols-1)*50)/cols); return arr.map(p=>pageImg(p,cw,cardH)); };
  bandRow(g,mk(pics.slice(0,nTop)),S/2,S-120,50,bandY+tuck,0,'bottom',0.035);
  bandRow(g,mk(pics.slice(nTop)),S/2,S-120,50,bandBot-tuck,0,'top',0.035);
  drawBand(g,th,bandY,bandH);
  // title (theme color, heavy black outline, black drop shadow), subtitle, skill pill
  const stackH=titleH+subH+(skillsTxt?pillH:0), top0=bandY+(bandH-stackH)/2;
  g.textAlign='center'; g.textBaseline='middle'; g.font=FONT(400,size,'Pacifico'); g.lineJoin='round';
  L1.forEach((l,i)=>{ const y=top0+lh*i+lh/2; g.fillStyle='#000'; g.fillText(l,cx+8,y+10); textStroke(g,l,cx,y,th.p,'#000',Math.max(14,size*0.09)); g.fillStyle=th.p; g.fillText(l,cx,y); });
  let yy=top0+titleH;
  if(sub){ const ss=fitFont(g,sub,'700','Andika',64,W,30); g.font=FONT(700,ss,'Andika'); g.fillStyle='#222'; g.fillText(sub,cx,yy+subH/2); yy+=subH; }
  if(skillsTxt) skillPill(g,th,skillsTxt,cx,yy+pillH/2-8,Math.min(W,1300),88);
  // stickers on the band ends: answer-key burst left, grade burst right
  if(showKey){ const ky=bandY+bandH/2; burst(g,215,ky,165,13,th.a,'#000',0.2); g.save(); g.translate(215,ky); g.rotate(0.2); g.fillStyle='#000'; g.textAlign='center'; g.textBaseline='middle'; g.font=FONT(700,60,'Fredoka'); g.fillText(has(X,'keyTop')?X.keyTop:'ANSWER',0,-28); g.fillText(has(X,'keyBot')?X.keyBot:'KEY',0,36); g.restore(); }
  if(grade) gradeBadge(g,th,grade,S-215,bandY+bandH/2,175);
  // one page only: fill the empty lower row with the page-count burst
  if(!nBot){ const b=badgeCopy(spec,st); scallopBadge(g,S/2,(bandBot+1660)/2,Math.min(190,(1660-bandBot)/2-10),b.top,b.bot); }
  const rb=defaults(spec,st).ribbon; if(rb) ribbon(g,th,rb,S/2,1735,spec.isBundle&&!has(X,'ribbon')?760:1280);
  footerBar(g,th,L,X.store,1860);
  return c;
}
async function cover(spec,th,L,st){
  const [c,g]=newCanvas(); dots(g,th.dot,th.p,150,26); const X=TX(spec);
  const skillsTxt=skillsOf(spec);
  const bn=titleBanner(g,th,spec.title,skillsTxt,{big:true,sub:X.subtitle});
  if(skillsTxt) skillPill(g,th,skillsTxt,S/2-90,bn.by+bn.bh-(bn.two?105:135),bn.bw-380,bn.two?92:118);
  gradeBadge(g,th,spec.opts.grade,S-185,195,175);
  // tilted, stacked page mockups
  const pics=(spec.picks.length?spec.picks:st.defaultPicks).slice(0,3);
  const sd=bn.subH||0, box=bn.two?(pics.length===1?[1200,1000-sd]:[1060,960-sd]):(pics.length===1?[1300,1150-sd]:[1120,1030-sd]); const ims=pics.map(p=>pageImg(p,box[0],box[1]));
  const cy=(bn.two?1310:1250)+sd*0.62;
  if(ims.length===1) paper(g,ims[0],S/2,cy,0);
  else if(ims.length===2){paper(g,ims[0],S/2-300,cy+10,-0.1); paper(g,ims[1],S/2+300,cy-10,0.07);}
  else {paper(g,ims[2],S/2-360,cy+30,-0.13); paper(g,ims[1],S/2+360,cy+10,0.1); paper(g,ims[0],S/2,cy-20,-0.015);}
  const showKey=has(X,'keyBurst')?X.keyBurst:st.hasKey;
  if(showKey) burst(g,230,985+sd,150,13,th.a,'#000',0.2), (g.save(),g.translate(230,985+sd),g.rotate(0.2),g.fillStyle='#000',g.textAlign='center',g.textBaseline='middle',g.font=FONT(700,58,'Fredoka'),g.fillText(has(X,'keyTop')?X.keyTop:'ANSWER',0,-26),g.fillText(has(X,'keyBot')?X.keyBot:'KEY',0,34),g.restore());
  const rb=defaults(spec,st).ribbon; if(rb) ribbon(g,th,rb,S/2,1735,spec.isBundle&&!has(X,'ribbon')?760:1280);
  footerBar(g,th,L,X.store,1860);
  return c;
}
async function preview(spec,th,L,page,role,k,total,prodTitle,skillsTxt){
  const [c,g]=newCanvas(); dots(g,th.p+'22',th.l,150,22);
  // colored header band
  g.fillStyle=th.p; g.fillRect(0,0,S,340); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(0,340,S,12);
  g.fillStyle='#fff'; g.textAlign='center'; g.textBaseline='middle'; const s=fitFont(g,prodTitle,'400','Pacifico',170,S-300,60); g.font=FONT(400,s,'Pacifico'); g.fillText(prodTitle,S/2,skillsTxt?140:170);
  if(skillsTxt){g.font=FONT(700,70,'Andika'); const w=Math.min(S-300,fitW(g,skillsTxt,'700',70,'Andika')+110); pill(g,S/2-w/2,238,w,96,'#fff','#000',7); g.fillStyle='#000'; g.font=FONT(700,fitFont(g,skillsTxt,'700','Andika',64,w-100,30),'Andika'); g.fillText(skillsTxt,S/2,288);}
  const im=pageImg(page,1620,1300); paper(g,im,S/2,340+(S-340-250)/2+50,(k%2?0.012:-0.012));
  const X=TX(spec), label=(role==='key'?(has(X,'keyLabel')?X.keyLabel:'ANSWER KEY'):(has(X,'previewLabel')?X.previewLabel:'PREVIEW')); g.font=FONT(700,72,'Fredoka'); const w=g.measureText(label).width+150; if(label) pill(g,70,S-210,w,130,th.a,'#000',8); g.fillStyle='#000'; g.textAlign='left'; if(label) g.fillText(label,145,S-142);
  logoBadge(g,L,S-210,S-150,130);
  return c;
}
function fitW(g,t,wt,size,fam){g.font=FONT(wt,size,fam);return g.measureText(t).width;}
async function included(spec,th,L,st){
  const [c,g]=newCanvas(); dots(g,th.dot,th.p,150,26);
  g.save(); g.shadowColor='rgba(0,0,0,.35)'; g.shadowBlur=30; g.shadowOffsetY=14; rr(g,110,110,S-220,S-420,90); g.fillStyle='#fff'; g.fill(); g.restore(); rr(g,110,110,S-220,S-420,90); g.lineWidth=12; g.strokeStyle='#000'; g.stroke();
  g.fillStyle=th.d; g.textAlign='center'; g.textBaseline='middle'; g.font=FONT(400,190,'Pacifico'); g.fillText("What's Included",S/2,300);
  const items=defaults(spec,st).included, x0=300, cardTop=420, cardBot=S-310; const sz=Math.min(...items.map(t=>fitFont(g,t,'700','Andika',88,S-x0-260-110,40)));
  const gap=Math.min(210,(cardBot-cardTop-80)/items.length); let y=cardTop+(cardBot-cardTop-gap*(items.length-1))/2;
  items.forEach(t=>{ g.fillStyle=th.p; g.beginPath(); g.arc(x0,y,62,0,7); g.fill(); g.lineWidth=8; g.strokeStyle='#000'; g.stroke(); g.strokeStyle='#fff'; g.lineWidth=17; g.lineCap='round'; g.beginPath(); g.moveTo(x0-28,y+2); g.lineTo(x0-8,y+24); g.lineTo(x0+32,y-22); g.stroke();
    g.fillStyle='#000'; g.textAlign='left'; g.font=FONT(700,sz,'Andika'); g.fillText(t,x0+110,y+4); y+=gap; });
  footerBar(g,th,L,TX(spec).store,1860);
  return c;
}
const skillsOf=spec=>has(TX(spec),'skills')?TX(spec).skills:skillsLine(spec.skills);
// Default text for every editable field of a spec (the drop-in tool shows these; spec.text values override them).
function defaults(spec,st){
  st=st||stats(spec); const X=TX(spec);
  const ribbonAuto=spec.isBundle?`BUNDLE OF ${spec.nSets}`:st.nStudent+(st.nStudent===1?' PAGE':' PAGES')+' • POWERPOINT + PDF';
  return {title:spec.title,skills:skillsLine(spec.skills),grade:(spec.opts&&spec.opts.grade)||'',subtitle:'',ribbon:has(X,'ribbon')?X.ribbon:ribbonAuto,store:STORE,
    keyTop:'ANSWER',keyBot:'KEY',previewLabel:'PREVIEW',keyLabel:'ANSWER KEY',included:has(X,'included')?X.included:st.included,ribbonAuto};
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
  const style=(spec.opts&&spec.opts.style)||'classic';
  spec.title=spec.title||(spec.isBundle?(spec.prods.map(p=>p.title).filter((v,i,a)=>a.indexOf(v)===i).join(', ')+' Bundle'):spec.prod.title);
  const skillsTxt=skillsOf(spec), X=TX(spec);
  out.push(['01-cover.png',await (style==='bold'?coverBold:style==='band'?coverBand:cover)(spec,th,L,st)]);
  const picks=spec.picks.length?spec.picks:[...st.defaultPicks.slice(0,3)].concat(st.keys.length?[spec.doc.pages[st.keys[0]]]:[]);
  const prodFor=(pg)=>{ // bundles: name the product the page belongs to
    if(!spec.isBundle||!spec.doc.sets) return has(X,'previewTitle')&&X.previewTitle?X.previewTitle:spec.prod.title; const i=spec.doc.pages.indexOf(pg); const s=spec.doc.sets.find(s=>i>=s.from&&i<s.to); return s?s.prod.title:spec.prod.title;};
  const labFor=(pg)=>{ if(!spec.isBundle||!spec.doc.sets) return has(X,'previewPill')?X.previewPill:skillsTxt; const i=spec.doc.pages.indexOf(pg); const s=spec.doc.sets.find(s=>i>=s.from&&i<s.to); return s?skillsLine(BUNDLE.skillsOf([s.sec.label])):skillsTxt;};
  let k=0; for(const pg of picks.slice(0,9)){ const role=st.R[spec.doc.pages.indexOf(pg)]; k++; out.push([`${String(k+1).padStart(2,'0')}-preview.png`,await (style==='bold'?previewBold:preview)(spec,th,L,pg,role,k,picks.length,prodFor(pg),labFor(pg))]); }
  out.push([`${String(k+2).padStart(2,'0')}-whats-included.png`,await (style==='bold'?includedBold:included)(spec,th,L,st)]);
  const first=spec.prod, label=skillsTxt, grade=spec.opts.grade;
  const title=`${spec.title}${label?' - '+label:''}${grade?' - '+grade:''}`.replace(/\u2014/g,'-');
  const prods=[...new Set((spec.prods||[spec.prod]).map(p=>p.id))];
  const blurb=has(X,'blurb')?X.blurb:prods.map(id=>BLURB[id]).filter(Boolean).join(' ');
  const txt=`TITLE\n${title}\n\nDESCRIPTION\n${spec.isBundle?`Bundle of ${spec.nSets} sets in one file. `:''}${blurb}${grade?`\n\nMade for ${grade}.`:''}\n\nWhat's included:\n${defaults(spec,st).included.map(x=>'- '+x).join('\n')}\n${label?'\nSkill: '+label+'\n':''}\nTAGS\n${(has(X,'tags')?X.tags.split(/\s*,\s*/).filter(Boolean):prods.flatMap(id=>TAGS[id]||[]).filter((v,i,a)=>a.indexOf(v)===i).concat(spec.skills||[])).join(', ')}\n`;
  return {images:out,txt,title};
}
// ---- layout picker UI shared by the generator and the Listing Image Maker: buttons drive the hidden #lsStyle select and show only the text boxes the chosen layout uses
const STYLE_NOTE={classic:'Cover shows your first 3 picked pages, tilted, on a title banner.',bold:'Cover is a collage of up to 6 picked pages (pastel colors, so Colors does not apply).',band:'Cover puts up to 6 picked pages above and below the title band (none picked = 4).'};
function initStyleUI(){
  const sel=document.getElementById('lsStyle'); if(!sel) return;
  const apply=()=>{ const v=sel.value; document.querySelectorAll('.stylepick button').forEach(b=>{b.classList.toggle('on',b.dataset.style===v); b.setAttribute('aria-pressed',b.dataset.style===v);});
    document.querySelectorAll('[data-styles]').forEach(el=>{el.hidden=!el.dataset.styles.split(' ').includes(v);});
    const n=document.getElementById('styleNote'); if(n) n.textContent=STYLE_NOTE[v]||''; };
  document.querySelectorAll('.stylepick button').forEach(b=>b.addEventListener('click',()=>{ if(sel.value===b.dataset.style) return; sel.value=b.dataset.style; apply(); sel.dispatchEvent(new Event('change',{bubbles:true})); }));
  sel.addEventListener('change',apply); apply();
}
async function zip(spec,fname){ return zipResult(await build(spec),fname); }
async function zipResult(r,fname){
  const z=new JSZip();
  for(const [n,c] of r.images){ const b=await new Promise(res=>c.toBlob(res,'image/png')); z.file(n,b); }
  z.file('listing.txt',r.txt); const blob=await z.generateAsync({type:'blob'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=fname+' - TpT listing images.zip'; document.body.appendChild(a); a.click(); a.remove(); return r;
}
initStyleUI();
return {build,zip,zipResult,defaults,stats,THEMES,S,initStyleUI};
})();
