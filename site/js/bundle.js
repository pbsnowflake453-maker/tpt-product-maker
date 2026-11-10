// Bundles: a ZIP of SEPARATE files. File 01 = cover + What's Included; then one file per set/product, each exactly like the
// standalone product (its own cover, directions page, pages and Terms of Use) and each keeping its own orientation.
// Every file is in the zip as PowerPoint and PDF, so landscape and portrait products can be mixed freely.
window.BUNDLE=(function(){
const T=TPT;
const pad=n=>String(n).padStart(2,'0');
const clean=s=>String(s==null?'':s).replace(/[\/\\:*?"<>|]/g,'').replace(/\s+/g,' ').trim();
// each skill once, even when several sets share skills inside longer labels ("short a • short e")
function skillsOf(labels){return [...new Set(labels.flatMap(l=>String(l||'').split(' • ').map(x=>x.trim()).filter(Boolean)))];}
function suggestTitle(prods){const names=[...new Set(prods.map(p=>p.title))];return names.length?names.join(', ')+' Bundle':'';}
function fitLines(text,font,bold,maxSize,minSize,w,maxLines){let size=maxSize,L;for(;;){L=T.wrapRuns([{t:text,b:bold}],font,size,w);if(L.length<=maxLines||size<=minSize)break;size-=2;}return {L,size};}
// wrap a skill list so a line only breaks between skills, never inside one ("/th/ (thin)" stays together)
function wrapSkills(prefix,skills,size,maxW){const lines=[]; let cur='';
  skills.map((s,i)=>(i?'':prefix)+s+(i<skills.length-1?' •':'')).forEach(part=>{const t=cur?cur+' '+part:part; if(cur&&T.textW(t,'Andika',size,true)>maxW){lines.push(cur);cur=part;} else cur=t;});
  if(cur) lines.push(cur); return lines.map(l=>[{t:l,b:true}]);}
function lineW(l,font,size){return l.reduce((s,r)=>s+T.textW(r.t,font,size,r.b),0);}
function frame(p){p.rect(0.25,0.25,p.w-0.5,p.h-0.5,{r:0.28,lw:4,fill:'FFFFFF'});}
function coverPage(orient,title,skills,n){
  const p=new T.Page(orient), W=p.w, H=p.h; frame(p);
  const tw=W-1.6, t=fitLines(title,'Pacifico',false,p.portrait?54:58,30,tw,3), th=t.L.length*t.size*1.25/72;
  let y=p.portrait?1.1:0.7;
  p.text(0.5,y,W-1.0,th,'',{runs:t.L,font:'Pacifico',size:t.size,align:'center',nowrap:true}); y+=th+0.35;
  if(skills.length){
    const size=p.portrait?24:22, bwMax=W-2.2;
    const L=wrapSkills(skills.length>1?'Skills: ':'Skill: ',skills,size,bwMax-0.8), bw=Math.min(bwMax,Math.max(3.2,Math.max(...L.map(l=>lineW(l,'Andika',size)))+0.8)), bh=L.length*size*1.25/72+0.45;
    p.rect(W/2-bw/2,y,bw,bh,{r:Math.min(bh/2,0.45),lw:3,fill:'FFFFFF'});
    p.text(W/2-bw/2+0.1,y,bw-0.2,bh,'',{runs:L,font:'Andika',size,bold:true,align:'center',nowrap:true}); y+=bh+0.3;}
  p.text(0,y,W,0.4,`${n} resource${n===1?'':'s'} in this bundle`,{size:17});
  const lg=p.portrait?2.4:1.7; p.image(W/2-lg/2,H-0.85-lg,lg,lg); T.footer(p); return p;}
// files: [{num,prod,label,name,orient}] -> contents page(s): the file number and name of each resource, with its page shape
function contentsPages(orient,files){
  const pages=[]; let p,y;
  const add=()=>{p=new T.Page(orient); frame(p); p.text(0,0.55,p.w,0.9,pages.length?"What's Included (continued)":"What's Included",{font:'Pacifico',size:38}); T.footer(p); y=1.75;
    if(!pages.length){p.text(0.95,1.45,p.w-1.9,0.3,'Each resource is its own file. Every file is included as PowerPoint and PDF.',{size:14,align:'left'}); y=2.1;} pages.push(p);};
  add(); const W=p.w-1.9;
  files.forEach(f=>{
    const runs=[{t:pad(f.num)+'  ',b:true},{t:f.prod.title,b:true}].concat(f.label?[{t:' - '+f.label.replace(/ • /g,', '),b:false}]:[]).concat([{t:'   ('+(f.orient==='L'?'landscape':'portrait')+')',b:false}]);
    const L=T.wrapRuns(runs,'Andika',15,W), h=L.length*0.27+0.22;
    if(y+h>p.h-1.0) add();
    p.text(0.95,y,W,L.length*0.27,'',{runs:L,size:15,align:'left',nowrap:true}); y+=h;});
  return pages;}
function setName(num,prod,label){const x=`${pad(num)} ${prod.title}${label?' - '+label:''}`.replace(/ • /g,', ').replace(/\s+/g,' ');return clean(x.length>90?x.slice(0,87).trim()+'...':x);}
// sets: [{prod,cfg,seed}] -> {files,pages,secs,sets,title,skills,mixed,fileBase}
//  files: [{name,pages,orient,kind:'cover'|'set',prod,sec,label,from,to}] (from/to index into the combined `pages` list used for preview and the page picker)
//  sets:  [{prod,sec,from,to}] the student pages only of each set (cover, directions and Terms excluded), for the page picker and listing images
function assemble(sets,title){
  const typed=String(title||'').trim(), prods=sets.map(s=>s.prod), mixed=new Set(prods.map(p=>p.id)).size>1;
  const ttl=typed||suggestTitle(prods)||'Bundle';
  const built=sets.map(s=>{const a=T.assemble(s.prod,[{cfg:s.cfg,seed:s.seed}]); return {prod:s.prod,sec:a.secs[0],pages:a.pages};});
  const skills=skillsOf(built.map(b=>b.sec.label));
  const orients=[...new Set(prods.map(p=>p.orient))], corient=orients.length===1?orients[0]:'P';
  const meta=built.map((b,i)=>({num:i+2,prod:b.prod,label:b.sec.label,orient:b.prod.orient,name:setName(i+2,b.prod,b.sec.label)}));
  const cpages=[coverPage(corient,ttl,skills,sets.length),...contentsPages(corient,meta)];
  const files=[{name:'01 Cover and Contents',pages:cpages,orient:corient,kind:'cover'}];
  built.forEach((b,i)=>files.push({name:meta[i].name,pages:b.pages,orient:b.prod.orient,kind:'set',prod:b.prod,sec:b.sec,label:b.sec.label}));
  const pages=[],setsOut=[]; let n=0;
  files.forEach((f,i)=>{f.from=pages.length; pages.push(...f.pages); f.to=pages.length;
    if(f.kind==='set'){const b=built[i-1], pre=f.pages.indexOf(b.sec.pages[0]); setsOut.push({prod:b.prod,sec:b.sec,from:f.from+pre,to:f.from+pre+b.sec.pages.length});}});
  return {files,pages,secs:built.map(b=>b.sec),sets:setsOut,title:typed||(mixed?suggestTitle(prods):ttl),skills,mixed,fileBase:`${clean(ttl)} - ${T.STORE}`};}
function fileName(doc){return doc.fileBase;}
// zip of every file as PowerPoint and PDF (flat: "01 Cover and Contents.pptx", "01 Cover and Contents.pdf", "02 Roll and Read - sh.pptx", ...)
async function buildZip(doc,formats){
  formats=formats||['pptx','pdf']; const z=new JSZip();
  for(const f of doc.files){
    if(formats.includes('pptx')) z.file(f.name+'.pptx',await T.pptxDoc(f.pages,f.name).write({outputType:'arraybuffer'}));
    if(formats.includes('pdf')){const d=T.pdfDoc(f.pages); d.setProperties({title:f.name}); z.file(f.name+'.pdf',d.output('arraybuffer'));}}
  return z.generateAsync({type:'blob'});}
function saveBlob(blob,name){const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),15000);}
return {assemble,fileName,buildZip,saveBlob,skillsOf,suggestTitle,clean,pad};
})();
