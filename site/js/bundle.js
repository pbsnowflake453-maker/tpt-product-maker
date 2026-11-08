// Bundle: a cover + contents file, plus one separate file per set, downloaded together as a zip (PowerPoints or PDFs).
// Any mix of product types can be bundled because every set is its own file. Black and white, same fonts as the products.
window.BUNDLE=(function(){
const T=TPT;
const pad=n=>String(n).padStart(2,'0');
const clean=s=>String(s==null?'':s).replace(/[\/\\:*?"<>|]/g,'').replace(/\s+/g,' ').trim();
// each skill once, even when several sets share skills inside longer labels ("short a • short e")
function skillsOf(labels){return [...new Set(labels.flatMap(l=>String(l||'').split(' • ').map(x=>x.trim()).filter(Boolean)))];}
function suggestTitle(prods){const names=[...new Set(prods.map(p=>p.title))];return names.length?names.join(', ')+' Bundle':'';}
function fitLines(text,font,bold,maxSize,minSize,w,maxLines){let size=maxSize,L;for(;;){L=T.wrapRuns([{t:text,b:bold}],font,size,w);if(L.length<=maxLines||size<=minSize)break;size-=2;}return {L,size};}
// wrap a skill list so a line only breaks between skills, never inside one ("/th/ (thin)" stays together); bullets stay at the end of the line
function wrapSkills(prefix,skills,size,maxW){const lines=[]; let cur='';
  skills.map((s,i)=>(i?'':prefix)+s+(i<skills.length-1?' •':'')).forEach(part=>{const t=cur?cur+' '+part:part; if(cur&&T.textW(t,'Andika',size,true)>maxW){lines.push(cur);cur=part;} else cur=t;});
  if(cur) lines.push(cur); return lines.map(l=>[{t:l,b:true}]);}
function lineW(l,font,size){return l.reduce((s,r)=>s+T.textW(r.t,font,size,r.b),0);}
function frame(p){p.rect(0.25,0.25,p.w-0.5,p.h-0.5,{r:0.28,lw:4,fill:'FFFFFF'});}
function coverPage(orient,title,skills,n){
  const p=new T.Page(orient), W=p.w, H=p.h; frame(p);
  const tw=W-1.6, t=fitLines(title,'Pacifico',false,p.portrait?54:58,30,tw,3), th=t.L.length*t.size*1.25/72;
  let y=p.portrait?1.1:0.7;
  p.text(0.5,y,W-1.0,th,'',{runs:t.L,font:'Pacifico',size:t.size,align:'center'}); y+=th+0.35;
  if(skills.length){
    const size=p.portrait?24:22, bwMax=W-2.2;
    const L=wrapSkills(skills.length>1?'Skills: ':'Skill: ',skills,size,bwMax-0.8), bw=Math.min(bwMax,Math.max(3.2,Math.max(...L.map(l=>lineW(l,'Andika',size)))+0.8)), bh=L.length*size*1.25/72+0.45;
    p.rect(W/2-bw/2,y,bw,bh,{r:Math.min(bh/2,0.45),lw:3,fill:'FFFFFF'});
    p.text(W/2-bw/2+0.1,y,bw-0.2,bh,'',{runs:L,font:'Andika',size,bold:true,align:'center'}); y+=bh+0.3;}
  p.text(0,y,W,0.4,`${n} resource${n===1?'':'s'} in this bundle`,{size:17});
  const lg=p.portrait?2.4:1.7; p.image(W/2-lg/2,H-0.85-lg,lg,lg); T.footer(p); return p;}
function contentsPages(orient,sets){
  const pages=[]; let p,y;
  const add=()=>{p=new T.Page(orient); frame(p); p.text(0,0.55,p.w,0.9,pages.length?"What's Included (continued)":"What's Included",{font:'Pacifico',size:38}); T.footer(p); y=1.75;
    if(!pages.length){p.text(0.95,1.45,p.w-1.9,0.3,'Each resource is a separate file in this download.',{size:14,align:'left'}); y=2.1;} pages.push(p);};
  add(); const W=p.w-1.9;
  sets.forEach((s,i)=>{
    const runs=[{t:pad(i+1)+'  ',b:true},{t:s.prod.title,b:true}].concat(s.label?[{t:' — '+s.label,b:false}]:[]);
    const L=T.wrapRuns(runs,'Andika',15,W), h=L.length*0.27+0.22;
    if(y+h>p.h-1.0) add();
    p.text(0.95,y,W,L.length*0.27,'',{runs:L,size:15,align:'left'}); y+=h;});
  return pages;}
// sets: [{prod, doc, label}] (doc = that set's own assembled product file). Returns the file list in download order.
function make(title,sets){
  title=String(title||'').trim()||suggestTitle(sets.map(s=>s.prod))||'Bundle';
  const orients=[...new Set(sets.map(s=>s.prod.orient))], orient=orients.length===1?orients[0]:'P';
  const skills=skillsOf(sets.map(s=>s.label));
  const cover={name:`00 - ${clean(title)} - Cover and Contents`,doc:{pages:[coverPage(orient,title,skills,sets.length),...contentsPages(orient,sets),T.termsPage(orient)],secs:[]},cover:true};
  const nm=(i,s)=>{const x=`${pad(i+1)} - ${T.fileName(s.prod,s.doc.secs)}`.replace(/ • /g,', '); return x.length>120?x.slice(0,117).trim()+'...':x;}; // plain characters and a sane length so the zip opens anywhere
  const files=[cover,...sets.map((s,i)=>({name:nm(i,s),doc:s.doc,prod:s.prod,label:s.label}))];
  return {title,skills,files,base:`${clean(title)} - ${T.STORE}`};}
async function buildZip(files,kind){
  const z=new JSZip();
  for(const f of files){
    let bytes;
    if(kind==='pptx') bytes=await T.pptxDoc(f.doc.pages,f.name).write({outputType:'arraybuffer'});
    else {const d=T.pdfDoc(f.doc.pages); d.setProperties({title:f.name}); bytes=d.output('arraybuffer');}
    z.file(f.name+'.'+kind,bytes);}
  return z.generateAsync({type:'blob'});}
function saveBlob(blob,name){const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),15000);}
return {make,buildZip,saveBlob,skillsOf,suggestTitle,clean,pad};
})();
