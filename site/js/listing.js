// TpT listing pack: square 2000x2000 PNGs (cover + previews) built from the product pages with the brand logo, plus listing.txt. Downloads as one zip.
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
  picturewrite:'Students look at each picture and write the word on the line. Includes a word bank and an answer key.'};
const TAGS={rollread:['roll and read','phonics games','reading centers','decodable words','fluency'],rollsolve:['math games','math centers','fact fluency','roll and solve'],
  taskcards:['task cards','scoot','math centers','write the room'],bingo:['bingo','whole group games','phonics games','math games'],
  mystery:['color by code','mystery picture','early finishers','phonics practice'],wordsort:['word sort','phonics','cut and paste','word work'],
  wordmaze:['word maze','phonics','word work','early finishers'],coldread:['cold reads','reading fluency','reading comprehension','decodable passages','fluency assessment'],
  picturewrite:['picture write','phonics','encoding','spelling','word work']};
function pageImg(page,maxW,maxH){const c=document.createElement('canvas'); const sc=Math.min(maxW/page.w,maxH/page.h); T.drawCanvas(page,c,sc); return c;}
let logo=null; async function getLogo(){ if(logo) return logo; logo=new Image(); logo.src='assets/logo-v2.png'; await logo.decode(); return logo; }
function base(){const c=document.createElement('canvas'); c.width=c.height=S; const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,S,S); return [c,g];}
function shadowPage(g,img,x,y,rot){g.save(); g.translate(x+img.width/2,y+img.height/2); g.rotate(rot||0); g.shadowColor='rgba(0,0,0,.25)'; g.shadowBlur=30; g.shadowOffsetY=12;
  g.drawImage(img,-img.width/2,-img.height/2); g.shadowColor='transparent'; g.strokeStyle='#000'; g.lineWidth=3; g.strokeRect(-img.width/2,-img.height/2,img.width,img.height); g.restore();}
function fitText(g,t,font,max,w){let s=max; do{g.font=font.replace('%',s);s-=4;}while(g.measureText(t).width>w&&s>20);}
async function build(prod,doc,label,isBundle){
  const L=await getLogo(), out=[], nSets=(doc.secs||[]).length;
  const isDiv=p=>p.items.some(i=>i.t==='text'&&/^Set \d+ of \d+$/.test(i.text)); const student=doc.pages.filter((p,i)=>i>0&&i<doc.pages.length-1&&!isDiv(p)); // skip cover, terms, bundle dividers
  const showcase=student.slice(1); // skip directions
  // 1. cover
  {const [c,g]=base(); g.lineWidth=14; if(isBundle){g.save();g.fillStyle='#000';g.beginPath();g.roundRect(S/2-260,S-330,520,110,55);g.fill();g.fillStyle='#fff';g.font='700 64px Andika';g.textAlign='center';g.textBaseline='middle';g.fillText('Bundle of '+nSets,S/2,S-275);g.restore();} g.strokeStyle='#000'; g.beginPath(); g.roundRect(40,40,S-80,S-80,60); g.stroke();
    g.fillStyle='#000'; g.textAlign='center'; g.textBaseline='middle';
    fitText(g,prod.title,'400 %px Pacifico',190,S-300); g.fillText(prod.title,S/2,230);
    if(label){fitText(g,label,'700 %px Andika',110,S-500); const tw=g.measureText(label).width+120; g.lineWidth=8; g.beginPath(); g.roundRect(S/2-tw/2,360,tw,150,75); g.stroke(); g.fillText(label,S/2,437);}
    const isKey=p=>p.items.some(i=>i.t==='text'&&/Answer Key/.test(i.text)); let pics=(showcase.filter(p=>!isKey(p)).length?showcase.filter(p=>!isKey(p)):showcase).slice(0,2); if(isBundle){const firsts=doc.pages.map((p,i)=>isDiv(p)?doc.pages[i+1]:null).filter(Boolean); if(firsts.length>1) pics=firsts.slice(0,2);} pics.forEach((pg,i)=>{const im=pageImg(pg,pics.length>1?700:900,pics.length>1?900:950); const x=pics.length>1?(i?S/2+40:S/2-40-im.width):S/2-im.width/2; shadowPage(g,im,x,600+(i?40:0),pics.length>1?(i?0.04:-0.04):0);});
    g.drawImage(L,S-420,S-420,330,330); g.font='400 48px Andika'; g.fillText(T.STORE,S/2,S-110);
    out.push(['01-cover.png',c]);}
  // 2-4. previews
  showcase.slice(0,3).forEach((pg,i)=>{const [c,g]=base(); const im=pageImg(pg,S-360,S-420); shadowPage(g,im,S/2-im.width/2,120+(S-420-im.height)/2);
    g.fillStyle='#000'; g.textAlign='center'; g.font='700 64px Andika'; g.fillText('PREVIEW',S/2,S-150); g.drawImage(L,S-260,S-260,200,200); out.push([`0${i+2}-preview.png`,c]);});
  const title=`${prod.title}${isBundle?' Bundle':''}${label?' - '+label:''}`.replace(/\u2014/g,'-');
  const pages=doc.pages.length;
  const txt=`TITLE\n${title}\n\nDESCRIPTION\n${isBundle?`Bundle of ${nSets} sets in one file. `:''}${BLURB[prod.id]||''}\n\nWhat's included:\n- ${pages} pages: cover, directions,${isBundle?' a divider before each set,':''} ${prod.id==='coldread'?'passages and questions':'student pages'}, ${/key/i.test(JSON.stringify(doc.pages.map(p=>p.items.filter(i=>i.t==='text').map(i=>i.text))))?'answer key, ':''}Terms of Use\n- Black and white, easy to print\n- Editable PowerPoint (opens in Google Slides) and PDF\n${label?'\nSkill: '+label+'\n':''}\nTAGS\n${(TAGS[prod.id]||[]).concat(label?[label]:[]).join(', ')}\n`;
  return {images:out,txt,title};
}
async function zip(prod,doc,label,fname,isBundle){
  const r=await build(prod,doc,label,isBundle); const z=new JSZip();
  for(const [n,c] of r.images){ const b=await new Promise(res=>c.toBlob(res,'image/png')); z.file(n,b); }
  z.file('listing.txt',r.txt); const blob=await z.generateAsync({type:'blob'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=fname+' - TpT listing pack.zip'; document.body.appendChild(a); a.click(); a.remove(); return r;
}
// ---- Bundle listing kit: the cover shows the title you typed and the pages you picked; each picked page also gets its own preview image.
// splits on plain spaces only, so a non-breaking space keeps words together
function wrapCanvas(g,text,font,size,w){const lines=[]; let cur=''; g.font=font.replace('%',size);
  for(const wd of String(text).split(/ +/).filter(Boolean)){const t=cur?cur+' '+wd:wd; if(g.measureText(t).width>w&&cur){lines.push(cur);cur=wd;} else cur=t;}
  if(cur) lines.push(cur); return lines;}
function textFit(g,text,font,max,min,w,maxLines){let s=max,L; for(;;){L=wrapCanvas(g,text,font,s,w); if((L.length<=maxLines&&L.every(l=>g.measureText(l).width<=w))||s<=min) break; s-=6;} return {L,s};}
const pad2=n=>String(n).padStart(2,'0');
// b: {title, skills:[...], sets:[{prod,doc,label}], picks:[page,...]}  (picks are page objects; first two go on the cover image)
async function buildBundle(b){
  const L=await getLogo(), out=[], n=b.sets.length, picks=b.picks.slice(0,9);
  {const [c,g]=base(); g.lineWidth=14; g.textAlign='center'; g.textBaseline='middle';
    g.save();g.fillStyle='#000';g.beginPath();g.roundRect(S/2-260,S-330,520,110,55);g.fill();g.fillStyle='#fff';g.font='700 64px Andika';g.fillText('Bundle of '+n,S/2,S-275);g.restore();
    g.strokeStyle='#000'; g.beginPath(); g.roundRect(40,40,S-80,S-80,60); g.stroke();
    g.fillStyle='#000'; g.textAlign='center'; g.textBaseline='middle';
    const tf=textFit(g,b.title,'400 %px Pacifico',190,70,S-300,2), tlh=tf.s*1.15; g.font=`400 ${tf.s}px Pacifico`;
    tf.L.forEach((l,i)=>g.fillText(l,S/2,110+tlh*(i+.5)));
    const titleBottom=110+tlh*tf.L.length; let bottom=titleBottom;
    if(b.skills.length){const sf=textFit(g,b.skills.map(s=>s.replace(/ /g,'\u00a0')).join('\u00a0\u2022 '),'700 %px Andika',110,56,S-560,3), slh=sf.s*1.2, ph=slh*sf.L.length+70, py=Math.max(360,titleBottom+20);
      g.font=`700 ${sf.s}px Andika`; const tw=Math.max(...sf.L.map(l=>g.measureText(l).width))+120; g.lineWidth=8; g.beginPath(); g.roundRect(S/2-tw/2,py,tw,ph,Math.min(75,ph/2)); g.stroke();
      sf.L.forEach((l,i)=>g.fillText(l,S/2,py+35+slh*(i+.5))); bottom=py+ph;}
    const top=bottom+90, avail=1580-top, pics=picks.slice(0,2), two=pics.length>1, maxH=Math.min(two?900:950,avail);
    pics.forEach((pg,i)=>{const im=pageImg(pg,two?700:900,maxH); const x=two?(i?S/2+40:S/2-40-im.width):S/2-im.width/2; shadowPage(g,im,x,top+(i?40:0),two?(i?0.04:-0.04):0);});
    g.drawImage(L,S-420,S-420,330,330); g.fillStyle='#000'; g.textAlign='center'; g.font='400 48px Andika'; g.fillText(T.STORE,S/2,S-110);
    out.push(['01-cover.png',c]);}
  picks.forEach((pg,i)=>{const [c,g]=base(); const im=pageImg(pg,S-360,S-420); shadowPage(g,im,S/2-im.width/2,120+(S-420-im.height)/2);
    g.fillStyle='#000'; g.textAlign='center'; g.font='700 64px Andika'; g.fillText('PREVIEW',S/2,S-150); g.drawImage(L,S-260,S-260,200,200); out.push([`${pad2(i+2)}-preview.png`,c]);});
  const title=b.title.replace(/\u2014/g,'-'), types=[...new Map(b.sets.map(s=>[s.prod.id,s.prod])).values()];
  const tags=[...new Set(types.flatMap(p=>(TAGS[p.id]||[]).slice(0,3)).concat(['bundle'],b.skills))].slice(0,20); // a few tags per product type so the skills still fit under 20
  const inc=b.sets.map(s=>`- ${s.prod.title}${s.label?' - '+s.label:''} (${s.doc.pages.length} pages)`).join('\n');
  const txt=`TITLE\n${title}\n\nDESCRIPTION\nBundle of ${n} resources. Each resource is its own file, plus a cover and contents file.\n\n${types.map(p=>`${p.title}: ${BLURB[p.id]||''}`).join('\n')}\n\nWhat's included:\n- Cover and contents file\n${inc}\n- Every file has its own directions and Terms of Use\n- Black and white, easy to print\n- Editable PowerPoint files (open in Google Slides) and PDF files\n${b.skills.length?'\nSkills: '+b.skills.join(' • ')+'\n':''}\nTAGS\n${tags.join(', ')}\n`;
  return {images:out,txt,title};
}
// One zip: the bundle kit, plus (optional) a kit for each set in its own folder.
async function zipBundle(b,eachKits,fname){
  const z=new JSZip(), add=async(f,r)=>{for(const [nm,c] of r.images){const bl=await new Promise(res=>c.toBlob(res,'image/png')); f.file(nm,bl);} f.file('listing.txt',r.txt);};
  const main=await buildBundle(b);
  if(!eachKits) await add(z,main);
  else{await add(z.folder('Bundle'),main); const sf=z.folder('Individual sets');
    for(let i=0;i<b.sets.length;i++){const s=b.sets[i]; await add(sf.folder(s.name||(pad2(i+1)+' - '+s.prod.title)),await build(s.prod,s.doc,s.label,false));}}
  const blob=await z.generateAsync({type:'blob'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=fname+' - TpT listing pack.zip'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),15000); return main;
}
return {build,zip,buildBundle,zipBundle};
})();
