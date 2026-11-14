// Listing Image Maker (listing.html): drop in any PDF / PPTX / pictures, pick pages, edit the text, get the same colorful TpT listing images
// as the generator (rendering is LISTING.build in listing.js). Pages are {w,h,thumb,render()} objects; picked pages get a full-size canvas before building.
(function(){
const $=id=>document.getElementById(id), LS=window.LISTING;
const THUMB=300, FULL=1700, MAXPICK=9;
const files=[]; let picks=[], renderToken=0, last=null, pdfjs=null;
const touched={}; // which text fields Samantha typed in (the rest follow the automatic values)
function status(t){$('status').textContent=t;}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
const longSide=(w,h,L)=>{const s=L/Math.max(w,h);return [Math.max(1,Math.round(w*s)),Math.max(1,Math.round(h*s))];};
function nice(name){const small=/^(and|or|the|a|an|of|to|in|on|for|with)$/i; return name.replace(/\.[a-z0-9]+$/i,'').replace(/[_\-]+/g,' ').replace(/\s+/g,' ').trim().split(' ').map((w,i)=>(i&&small.test(w))?w.toLowerCase():w.charAt(0).toUpperCase()+w.slice(1)).join(' ');}
// ---------- loaders: each returns pages [{w,h,thumb(canvas),full(): Promise<canvas>}]
async function loadPdf(file){
  if(!pdfjs){ pdfjs=await import(new URL('vendor/pdf.min.mjs',document.baseURI).href); pdfjs.GlobalWorkerOptions.workerSrc=new URL('vendor/pdf.worker.min.mjs',document.baseURI).href; }
  const doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise, pages=[];
  const draw=async(pg,L)=>{const v0=pg.getViewport({scale:1}), s=L/Math.max(v0.width,v0.height), v=pg.getViewport({scale:s}); const c=document.createElement('canvas'); c.width=Math.ceil(v.width); c.height=Math.ceil(v.height); const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,c.width,c.height); await pg.render({canvasContext:g,viewport:v}).promise; return c;};
  for(let i=1;i<=doc.numPages;i++){ const pg=await doc.getPage(i), v0=pg.getViewport({scale:1}); const p={w:v0.width,h:v0.height,thumb:await draw(pg,THUMB),full:()=>draw(pg,FULL)}; pages.push(p); }
  return pages;
}
async function loadPptx(file){
  const deck=await PPTXR.load(await file.arrayBuffer()), pages=[], ar=deck.width/deck.height;
  const wFor=L=>ar>=1?L:L*ar; // PPTXR renders by width
  for(let i=0;i<deck.count;i++){ let th; try{ th=await deck.render(i,wFor(THUMB)); }catch(e){ console.warn('slide',i+1,e); th=document.createElement('canvas'); th.width=Math.round(wFor(THUMB)); th.height=Math.round(wFor(THUMB)/ar); const g=th.getContext('2d'); g.fillStyle='#eee'; g.fillRect(0,0,th.width,th.height); }
    const idx=i; pages.push({w:deck.width,h:deck.height,thumb:th,full:()=>deck.render(idx,wFor(FULL))}); }
  return pages;
}
async function loadImage(file){
  const bmp=await createImageBitmap(file); const mk=L=>{const [w,h]=longSide(bmp.width,bmp.height,Math.min(L,Math.max(bmp.width,bmp.height))); const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,w,h); g.imageSmoothingQuality='high'; g.drawImage(bmp,0,0,w,h); return c;};
  return [{w:bmp.width,h:bmp.height,thumb:mk(THUMB),full:async()=>mk(FULL)}];
}
const KIND=f=>/\.pdf$/i.test(f.name)||f.type==='application/pdf'?'pdf':/\.pptx$/i.test(f.name)?'pptx':/\.(png|jpe?g|webp|gif)$/i.test(f.name)||/^image\//.test(f.type)?'image':/\.(ppt|key|pages|docx?|odp)$/i.test(f.name)?'other':'unknown';
async function addFiles(list){
  for(const f of [...list]){
    const kind=KIND(f); const entry={name:f.name,kind,pages:[],status:'Reading…',err:null}; files.push(entry); files.cur=entry; renderFiles();
    try{
      if(kind==='pdf') entry.pages=await loadPdf(f); else if(kind==='pptx') entry.pages=await loadPptx(f); else if(kind==='image') entry.pages=await loadImage(f);
      else throw new Error(kind==='other'?'I can read PDF, .pptx and pictures. Please save this one as a PDF (or .pptx) and drop it in again.':'I do not know how to read this kind of file. Use PDF, .pptx, PNG or JPG.');
      entry.pages.forEach((p,i)=>{p.file=entry; p.i=i; p.role='student'; p.key=false;});
      entry.status=entry.pages.length+' page'+(entry.pages.length===1?'':'s');
    }catch(e){ console.error(e); entry.err=e.message||String(e); entry.status=''; }
    files.cur=null; renderFiles(); renderPages(); autoText(); schedule();
  }
}
function removeFile(e){ const i=files.indexOf(e); if(i<0) return; files.splice(i,1); picks=picks.filter(p=>p.file!==e); renderFiles(); renderPages(); autoText(); schedule(); }
function renderFiles(){
  const ul=$('fileList'); ul.innerHTML=''; files.forEach(e=>{ const li=document.createElement('li'); li.innerHTML=`<span class="nm" title="${esc(e.name)}">${esc(e.name)}</span><span class="small">${e.err?'':esc(e.status)}</span>`;
    if(e.err){const s=document.createElement('div'); s.className='err small'; s.textContent=e.err; li.append(s); li.style.flexWrap='wrap';} const b=document.createElement('button'); b.textContent='✕'; b.title='Remove this file'; b.onclick=()=>removeFile(e); li.append(b); ul.appendChild(li); });
  $('pptNote').hidden=!files.some(e=>e.kind==='pptx');
}
const allPages=()=>files.flatMap(e=>e.pages);
// ---------- page picker (same behavior as the generator's picker: click to pick/unpick, numbered badges, up to 9; none picked = automatic)
function copyThumb(src,w){const c=document.createElement('canvas'); c.width=src.width; c.height=src.height; c.getContext('2d').drawImage(src,0,0); return c;}
function renderPages(){
  const box=$('pages'); box.innerHTML=''; const n=allPages().length;
  $('pickInfo').textContent=n?'Click pages to pick them (up to 9). They go on the cover in order (the layout note in step 3 says how many fit) and each gets its own preview image. Pick none and I will use the first pages.':'Drop a file to see its pages.';
  for(const e of files){ if(!e.pages.length) continue; const wrap=document.createElement('div'); wrap.className='pset'; const t=document.createElement('b'); t.textContent=e.name; const gr=document.createElement('div'); gr.className='pgrid'; wrap.append(t,gr); box.appendChild(wrap);
    e.pages.forEach(p=>{ const d=document.createElement('div'); d.className='pg'; d.title='Page '+(p.i+1); d.appendChild(copyThumb(p.thumb)); p.el=d; d.onclick=()=>togglePick(p); gr.appendChild(d); }); }
  badges();
}
function togglePick(p){ const k=picks.indexOf(p); if(k>=0) picks.splice(k,1); else if(picks.length<MAXPICK) picks.push(p); else { $('pickInfo').textContent='That is the most you can pick (9). Click a picked page to remove it.'; return; } badges(); autoText(); schedule(); }
function badges(){
  allPages().forEach(p=>{ if(!p.el) return; const k=picks.indexOf(p); p.el.classList.toggle('on',k>=0); let i=p.el.querySelector('i'); if(k>=0){ if(!i){i=document.createElement('i'); p.el.appendChild(i);} i.textContent=k+1; } else if(i) i.remove(); });
  const ol=$('picked'); ol.innerHTML=''; $('pickedWrap').hidden=!picks.length;
  picks.forEach((p,k)=>{ const li=document.createElement('li'); const d=document.createElement('div'); d.append(copyThumb(p.thumb)); const lab=document.createElement('span'); lab.textContent=`${p.file.name.length>18?p.file.name.slice(0,16)+'…':p.file.name} p${p.i+1}`; d.append(lab);
    const kl=document.createElement('label'); kl.className='small'; const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=p.key; cb.onchange=()=>{p.key=cb.checked; p.role=p.key?'key':'student'; autoText(); schedule();}; kl.append(cb,' answer key'); d.append(kl);
    for(const [txt,dx] of [['↑',-1],['↓',1],['✕',0]]){ const b=document.createElement('button'); b.textContent=txt; b.title=dx?'Move':'Remove'; b.onclick=()=>{ if(!dx) picks.splice(k,1); else { const j=k+dx; if(j<0||j>=picks.length) return; [picks[k],picks[j]]=[picks[j],picks[k]]; } badges(); autoText(); schedule(); }; d.append(b); }
    li.append(d); ol.appendChild(li); });
}
// ---------- text fields: automatic values follow the pages until Samantha types in a box
const FIELD={title:'fTitle',skills:'fSkills',grade:'fGrade',subtitle:'fSub',ribbon:'fRibbon',store:'fStore',keyTop:'fKeyTop',keyBot:'fKeyBot',previewLabel:'fPrev',keyLabel:'fKeyLab',previewTitle:'fPTitle',previewPill:'fPPill',included:'fInc',blurb:'fBlurb',tags:'fTags'};
const val=k=>$(FIELD[k]).value;
function effectivePicks(){ if(picks.length) return picks; return allPages().filter(p=>p.role==='student').slice(0,6); }
function docFor(){ return {pages:allPages()}; }
function autoSpec(){ // spec without text overrides, to read the automatic defaults
  const pages=allPages(); return {prod:{id:'dropin',title:val('title')||'Title'},prods:[{id:'dropin',title:''}],title:val('title')||'Title',skills:[],opts:{grade:val('grade'),style:($('lsStyle')?$('lsStyle').value:'classic'),burstTop:$('lsBurstTop')?$('lsBurstTop').value.trim():'',burstBot:$('lsBurstBot')?$('lsBurstBot').value.trim():''},doc:{pages},picks:effectivePicks(),isBundle:false,nSets:1};
}
function autoText(){
  const pages=allPages(); const set=(k,v)=>{ if(!touched[k]) $(FIELD[k]).value=v; };
  if(files.length&&files[0].pages.length) set('title',nice(files[0].name));
  if(!pages.length){ set('ribbon',''); set('included',''); return; }
  const kinds=new Set(files.filter(f=>f.pages.length).map(f=>f.kind)), hasKey=picks.some(p=>p.key)||pages.some(p=>p.key), nKey=pages.filter(p=>p.key).length, nStu=pages.length-nKey;
  const spec=autoSpec(); const d=LS.defaults(spec,LS.stats(spec));
  set('ribbon',d.ribbonAuto.replace(/POWERPOINT \+ PDF$/,'POWERPOINT + PDF'));
  const inc=[`${nStu} student page${nStu===1?'':'s'}`]; if(hasKey) inc.push('Answer key'); if(!kinds.size||kinds.has('pptx')||true) inc.push('Editable PowerPoint file'); inc.push('PDF, ready to print','Print and go');
  set('included',inc.join('\n'));
  set('previewTitle',val('title')); set('previewPill',val('skills'));
  if(!touched.keyBurst) $('fKey').checked=hasKey;
}
function specNow(){
  const pages=allPages(), pk=effectivePicks();
  const text={}; for(const k of Object.keys(FIELD)){ if(['title','grade'].includes(k)) continue; let v=val(k); if(k==='included') v=v.split('\n').map(x=>x.trim()).filter(Boolean); text[k]=v; }
  text.keyBurst=$('fKey').checked; if(!text.previewTitle) delete text.previewTitle;
  return {prod:{id:'dropin',title:val('title')},prods:[{id:'dropin',title:val('title')}],title:val('title')||'Listing',skills:[],opts:{grade:val('grade').trim(),theme:$('fTheme').value,style:($('lsStyle')?$('lsStyle').value:'classic'),burstTop:$('lsBurstTop')?$('lsBurstTop').value.trim():'',burstBot:$('lsBurstBot')?$('lsBurstBot').value.trim():''},doc:{pages},picks:pk,isBundle:false,nSets:1,text};
}
// ---------- live preview
let timer=null; function schedule(){ clearTimeout(timer); timer=setTimeout(render,250); $('dl').disabled=true; }
async function render(){
  const my=++renderToken; const pages=allPages(); const box=$('preview');
  if(!pages.length){ box.innerHTML=''; last=null; status('Drop a file to get started.'); return; }
  status('Updating preview…');
  try{
    const spec=specNow(); for(const p of spec.picks){ if(!p.canvas) p.canvas=await p.full(); if(my!==renderToken) return; }
    const r=await LS.build(spec); if(my!==renderToken) return; last=r; box.innerHTML='';
    for(const [name,c] of r.images){ const fig=document.createElement('figure'); const v=document.createElement('canvas'); v.width=v.height=700; const g=v.getContext('2d'); g.imageSmoothingQuality='high'; g.drawImage(c,0,0,700,700); fig.append(v); const cap=document.createElement('figcaption'); cap.textContent=name; fig.append(cap); box.appendChild(fig); }
    status(`${r.images.length} images ready. Edit the text, pick other pages, then download.`); $('dl').disabled=false;
  }catch(e){ console.error(e); status('Something went wrong: '+e.message); }
}
async function download(){
  if(timer){clearTimeout(timer); timer=null; await render();} if(!last) return; $('dl').disabled=true; status('Zipping…');
  try{ await LS.zipResult(last,(val('title')||'Listing').replace(/[\/\\:*?"<>|]/g,'')); status('Downloaded.'); }finally{ $('dl').disabled=false; }
}
// ---------- wiring
const drop=$('drop'), inp=$('fileIn');
drop.onclick=()=>inp.click(); drop.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inp.click();}};
inp.onchange=()=>{ addFiles(inp.files); inp.value=''; };
for(const ev of ['dragenter','dragover']) document.addEventListener(ev,e=>{ if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){e.preventDefault(); drop.classList.add('over');} });
for(const ev of ['dragleave','drop']) document.addEventListener(ev,e=>{ if(ev==='drop'||e.target===document.documentElement||e.relatedTarget==null) drop.classList.remove('over'); });
document.addEventListener('drop',e=>{ if(e.dataTransfer&&e.dataTransfer.files.length){ e.preventDefault(); addFiles(e.dataTransfer.files); } });
document.addEventListener('paste',e=>{ const fs=[...(e.clipboardData?e.clipboardData.files:[])]; if(fs.length) addFiles(fs); });
for(const [k,id] of Object.entries(FIELD)) $(id).addEventListener('input',()=>{ touched[k]=true; if(k==='title'||k==='skills'||k==='grade') autoText(); schedule(); });
$('fKey').onchange=()=>{touched.keyBurst=true; schedule();}; $('fTheme').onchange=schedule; if($('lsStyle'))$('lsStyle').onchange=schedule; ['lsBurstTop','lsBurstBot'].forEach(id=>{if($(id))$(id).addEventListener('input',schedule);});
$('pickClear').onclick=()=>{picks=[]; badges(); autoText(); schedule();}; $('dl').onclick=download;
$(FIELD.store).value=TPT.STORE; $(FIELD.store).placeholder=TPT.STORE;
(async()=>{ await TPT.init(); status('Drop a file to get started.'); autoText(); })();
window.DROPIN={addFiles,render,get picks(){return picks;},get files(){return files;},get last(){return last;},togglePick,allPages,specNow,download};
})();
