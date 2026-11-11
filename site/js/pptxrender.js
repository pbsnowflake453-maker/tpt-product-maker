// Client-side PowerPoint (.pptx) slide renderer: draws slides onto a canvas so they can be used as page thumbnails / mockups.
// Covers what PowerPoint, Google Slides, Canva and this site's own exports use most: backgrounds, shapes (preset + custom geometry), pictures
// (with crop), groups, text (runs, wrap, alignment, bullets, autofit), simple tables, theme colors, layouts and masters.
// NOT covered (drawn as a plain gray box or skipped): charts, SmartArt, video, EMF/WMF pictures, text effects, 3D, most gradient/shadow effects.
window.PPTXR=(function(){
const parseXml=s=>new DOMParser().parseFromString(s,'application/xml');
const ch=(e,n)=>e?([...e.children].find(c=>!n||c.localName===n)||null):null;
const chs=(e,n)=>e?[...e.children].filter(c=>!n||c.localName===n):[];
const at=(e,n,d)=>(e&&e.getAttribute(n)!=null)?e.getAttribute(n):d;
const nu=(e,n,d)=>{const v=e&&e.getAttribute(n); return v==null||v===''?d:+v;};
const dirname=p=>p.replace(/[^/]*$/,'');
function resolve(base,target){ if(target.startsWith('/')) return target.slice(1); const parts=(dirname(base)+target).split('/'),o=[]; for(const s of parts){ if(s==='..') o.pop(); else if(s!=='.'&&s!=='') o.push(s);} return o.join('/'); }
const SCHEME={dk1:'dk1',lt1:'lt1',dk2:'dk2',lt2:'lt2',accent1:'accent1',accent2:'accent2',accent3:'accent3',accent4:'accent4',accent5:'accent5',accent6:'accent6',hlink:'hlink',folHlink:'folHlink'};
const PRESET={black:'000000',white:'ffffff',red:'ff0000',green:'008000',blue:'0000ff',yellow:'ffff00',gray:'808080',grey:'808080',orange:'ffa500',purple:'800080',pink:'ffc0cb',brown:'a52a2a',cyan:'00ffff',magenta:'ff00ff',ltGray:'d3d3d3',dkGray:'a9a9a9'};
function hex2rgb(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function rgb2hsl([r,g,b]){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0,l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6;}return [h,s,l];}
function hsl2rgb([h,s,l]){const f=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};if(!s){const v=Math.round(l*255);return [v,v,v];}const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return [f(p,q,h+1/3),f(p,q,h),f(p,q,h-1/3)].map(v=>Math.round(v*255));}

async function load(buf){
  const zip=await JSZip.loadAsync(buf), xmlCache={}, relCache={}, imgCache={};
  const has=p=>!!zip.file(p);
  const xml=async p=>{ if(xmlCache[p]!==undefined) return xmlCache[p]; const f=zip.file(p); return xmlCache[p]=f?parseXml(await f.async('string')):null; };
  const rels=async p=>{ if(relCache[p]) return relCache[p]; const rp=dirname(p)+'_rels/'+p.split('/').pop()+'.rels', d=await xml(rp), m={};
    if(d) for(const r of chs(d.documentElement,'Relationship')){ const mode=at(r,'TargetMode',''); m[at(r,'Id')]={type:at(r,'Type','').split('/').pop(),target:mode==='External'?null:resolve(p,at(r,'Target',''))}; } return relCache[p]=m; };
  const pres=await xml('ppt/presentation.xml'); if(!pres) throw new Error('This does not look like a PowerPoint file.');
  const prels=await rels('ppt/presentation.xml');
  const sz=ch(pres.documentElement,'sldSz'); const SW=nu(sz,'cx',9144000), SH=nu(sz,'cy',6858000);
  const slides=chs(ch(pres.documentElement,'sldIdLst'),'sldId').map(s=>{const id=s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||[...s.attributes].find(a=>a.localName==='id'&&a.prefix==='r')?.value; return prels[id]&&prels[id].target;}).filter(Boolean);
  const themePath=Object.values(prels).find(r=>r.type==='theme')?.target||'ppt/theme/theme1.xml';
  const theme=await xml(themePath); const TH={}, FONTS={mj:'Calibri',mn:'Calibri'};
  if(theme){ const cs=theme.getElementsByTagNameNS('*','clrScheme')[0]; if(cs) for(const c of chs(cs)){ const k=ch(c); if(!k) continue; TH[c.localName]=k.localName==='sysClr'?at(k,'lastClr','000000'):at(k,'val','000000'); }
    const fs=theme.getElementsByTagNameNS('*','fontScheme')[0]; if(fs){ FONTS.mj=at(ch(ch(fs,'majorFont'),'latin'),'typeface','Calibri'); FONTS.mn=at(ch(ch(fs,'minorFont'),'latin'),'typeface','Calibri'); } }
  async function image(p){ if(imgCache[p]!==undefined) return imgCache[p]; const f=zip.file(p); if(!f||/\.(emf|wmf|tiff?)$/i.test(p)) return imgCache[p]=null;
    try{ const ext=p.split('.').pop().toLowerCase(), mime={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',svg:'image/svg+xml',bmp:'image/bmp'}[ext]||'image/png';
      const blob=new Blob([await f.async('uint8array')],{type:mime}); return imgCache[p]=await createImageBitmap(blob); }catch(e){ return imgCache[p]=null; } }

  // ---- colors
  function colorOf(el,ctx){ // el = element whose child is a color element (solidFill, gsLst gs, etc.)
    const c=chs(el).find(x=>/^(srgbClr|schemeClr|sysClr|prstClr|hslClr|scrgbClr)$/.test(x.localName)); if(!c) return null;
    let hex, a=1;
    if(c.localName==='srgbClr') hex=at(c,'val','000000');
    else if(c.localName==='sysClr') hex=at(c,'lastClr','000000');
    else if(c.localName==='prstClr') hex=PRESET[at(c,'val')]||'000000';
    else if(c.localName==='schemeClr'){ let v=at(c,'val','tx1'); if(v==='phClr') hex=ctx.phClr||'000000'; else { const m=ctx.clrMap||{}; v=m[v]||v; hex=TH[SCHEME[v]||v]||({tx1:TH.dk1,bg1:TH.lt1,tx2:TH.dk2,bg2:TH.lt2})[v]||'000000'; } }
    else hex='000000';
    let rgb=hex2rgb(hex);
    for(const m of chs(c)){ const v=nu(m,'val',100000)/100000;
      if(m.localName==='alpha') a=v;
      else if(m.localName==='lumMod'||m.localName==='lumOff'){ const h=rgb2hsl(rgb); if(m.localName==='lumMod') h[2]=Math.min(1,h[2]*v); else h[2]=Math.min(1,h[2]+v); rgb=hsl2rgb(h); }
      else if(m.localName==='satMod'){ const h=rgb2hsl(rgb); h[1]=Math.min(1,h[1]*v); rgb=hsl2rgb(h); }
      else if(m.localName==='tint') rgb=rgb.map(x=>Math.round(x*v+255*(1-v)));
      else if(m.localName==='shade') rgb=rgb.map(x=>Math.round(x*v)); }
    return {css:a<1?`rgba(${rgb.join(',')},${a})`:`rgb(${rgb.join(',')})`,hex:rgb.map(x=>x.toString(16).padStart(2,'0')).join('')};
  }
  // fill -> canvas fillStyle (or null for none). spPr-like element, bounds [x,y,w,h] in px
  async function fillOf(g,spPr,ctx,b,rels0){
    if(!spPr) return undefined;
    for(const f of chs(spPr)){
      if(f.localName==='noFill') return null;
      if(f.localName==='solidFill'){ const c=colorOf(f,ctx); return c?c.css:undefined; }
      if(f.localName==='gradFill'){ const stops=chs(ch(f,'gsLst'),'gs').map(s=>[nu(s,'pos',0)/100000,colorOf(s,ctx)]).filter(s=>s[1]); if(!stops.length) return undefined;
        const lin=ch(f,'lin'), ang=((lin?nu(lin,'ang',0):0)/60000)*Math.PI/180, [x,y,w,h]=b, cx=x+w/2, cy=y+h/2, d=Math.abs(w*Math.cos(ang))/2+Math.abs(h*Math.sin(ang))/2;
        const gr=ch(f,'path')?g.createRadialGradient(cx,cy,0,cx,cy,Math.max(w,h)/2):g.createLinearGradient(cx-Math.cos(ang)*d,cy-Math.sin(ang)*d,cx+Math.cos(ang)*d,cy+Math.sin(ang)*d); stops.forEach(([p,c])=>gr.addColorStop(Math.min(1,Math.max(0,p)),c.css)); return gr; }
      if(f.localName==='blipFill'){ const id=ch(f,'blip')&&[...ch(f,'blip').attributes].find(a=>a.localName==='embed')?.value; const t=rels0&&rels0[id]&&rels0[id].target; const im=t&&await image(t); if(im){ const cv=document.createElement('canvas'); cv.width=Math.max(1,b[2]); cv.height=Math.max(1,b[3]); cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height); return g.createPattern(cv,'no-repeat'); } return undefined; }
    }
    return undefined;
  }
  // ---- geometry
  const gdVal=(av,name,d)=>{ if(!av) return d; for(const gd of chs(av,'gd')) if(at(gd,'name')===name){ const m=/val\s+(-?\d+)/.exec(at(gd,'fmla','')); if(m) return +m[1]; } return d; };
  function presetPath(g,prst,av,w,h){
    const P=()=>g.beginPath(), m=Math.min(w,h);
    switch(prst){
      case 'ellipse': P(); g.ellipse(w/2,h/2,w/2,h/2,0,0,7); return true;
      case 'roundRect': { const r=m*Math.min(50000,gdVal(av,'adj',16667))/100000; P(); g.roundRect(0,0,w,h,r); return true; }
      case 'round2SameRect': { const r=m*Math.min(50000,gdVal(av,'adj1',16667))/100000; P(); g.roundRect(0,0,w,h,[r,r,0,0]); return true; }
      case 'triangle': { const a=gdVal(av,'adj',50000)/100000; P(); g.moveTo(w*a,0); g.lineTo(w,h); g.lineTo(0,h); g.closePath(); return true; }
      case 'rtTriangle': P(); g.moveTo(0,0); g.lineTo(w,h); g.lineTo(0,h); g.closePath(); return true;
      case 'diamond': P(); g.moveTo(w/2,0); g.lineTo(w,h/2); g.lineTo(w/2,h); g.lineTo(0,h/2); g.closePath(); return true;
      case 'parallelogram': { const o=m*gdVal(av,'adj',25000)/100000; P(); g.moveTo(o,0); g.lineTo(w,0); g.lineTo(w-o,h); g.lineTo(0,h); g.closePath(); return true; }
      case 'trapezoid': { const o=m*gdVal(av,'adj',25000)/100000; P(); g.moveTo(o,0); g.lineTo(w-o,0); g.lineTo(w,h); g.lineTo(0,h); g.closePath(); return true; }
      case 'hexagon': { const o=m*gdVal(av,'adj',25000)/100000; P(); g.moveTo(o,0); g.lineTo(w-o,0); g.lineTo(w,h/2); g.lineTo(w-o,h); g.lineTo(o,h); g.lineTo(0,h/2); g.closePath(); return true; }
      case 'pentagon': case 'homePlate': { const o=Math.min(w,h)*gdVal(av,'adj',50000)/100000; P(); g.moveTo(0,0); g.lineTo(w-o,0); g.lineTo(w,h/2); g.lineTo(w-o,h); g.lineTo(0,h); g.closePath(); return true; }
      case 'rightArrow': { const hh=h*gdVal(av,'adj1',50000)/100000, hl=m*gdVal(av,'adj2',50000)/100000, t=(h-hh)/2; P(); g.moveTo(0,t); g.lineTo(w-hl,t); g.lineTo(w-hl,0); g.lineTo(w,h/2); g.lineTo(w-hl,h); g.lineTo(w-hl,h-t); g.lineTo(0,h-t); g.closePath(); return true; }
      case 'leftArrow': { const hh=h*gdVal(av,'adj1',50000)/100000, hl=m*gdVal(av,'adj2',50000)/100000, t=(h-hh)/2; P(); g.moveTo(w,t); g.lineTo(hl,t); g.lineTo(hl,0); g.lineTo(0,h/2); g.lineTo(hl,h); g.lineTo(hl,h-t); g.lineTo(w,h-t); g.closePath(); return true; }
      case 'plus': { const o=m*gdVal(av,'adj',25000)/100000; P(); g.moveTo(o,0); g.lineTo(w-o,0); g.lineTo(w-o,o); g.lineTo(w,o); g.lineTo(w,h-o); g.lineTo(w-o,h-o); g.lineTo(w-o,h); g.lineTo(o,h); g.lineTo(o,h-o); g.lineTo(0,h-o); g.lineTo(0,o); g.lineTo(o,o); g.closePath(); return true; }
      case 'star5': case 'star4': case 'star6': case 'star8': { const n=+prst.slice(4), P0=P(); const ri=prst==='star5'?0.382:0.5; for(let i=0;i<n*2;i++){const a=-Math.PI/2+i*Math.PI/n, r=i%2?ri:1; g.lineTo(w/2+Math.cos(a)*r*w/2,h/2+Math.sin(a)*r*h/2);} g.closePath(); return true; }
      case 'heart': P(); g.moveTo(w/2,h); g.bezierCurveTo(-w*.25,h*.45,w*.2,-h*.15,w/2,h*.28); g.bezierCurveTo(w*.8,-h*.15,w*1.25,h*.45,w/2,h); g.closePath(); return true;
      case 'line': case 'straightConnector1': case 'bentConnector2': case 'bentConnector3': P(); g.moveTo(0,0); g.lineTo(w,h); return 'line';
      case 'rect': case 'flowChartProcess': case 'snip1Rect': case 'frame': default: P(); g.rect(0,0,w,h); return true;
    }
  }
  function custPath(g,cg,w,h){
    g.beginPath(); let any=false;
    for(const p of chs(ch(cg,'pathLst'),'path')){ const pw=nu(p,'w',w)||w, ph=nu(p,'h',h)||h, sx=w/pw, sy=h/ph; const pt=e=>[nu(e,'x',0)*sx,nu(e,'y',0)*sy];
      for(const c of chs(p)){ const pts=chs(c,'pt').map(pt);
        if(c.localName==='moveTo'&&pts[0]) {g.moveTo(...pts[0]);any=true;} else if(c.localName==='lnTo'&&pts[0]) g.lineTo(...pts[0]);
        else if(c.localName==='cubicBezTo'&&pts.length>=3) g.bezierCurveTo(...pts[0],...pts[1],...pts[2]);
        else if(c.localName==='quadBezTo'&&pts.length>=2) g.quadraticCurveTo(...pts[0],...pts[1]);
        else if(c.localName==='arcTo'){ /* approximate arcs by ignoring */ }
        else if(c.localName==='close') g.closePath(); } }
    return any;
  }
  // ---- text
  // chain = list of <a:lstStyle>/<txStyles style> elements, highest priority first (shape, layout placeholder, master placeholder, master text style)
  const lvlEl=(chain,lvl)=>chain.map(l=>ch(l,'lvl'+(lvl+1)+'pPr')).filter(Boolean);
  function runStyle(rPr,base,ctx,k){
    const s=Object.assign({},base); if(!rPr) return s;
    if(rPr.getAttribute('sz')) s.sz=nu(rPr,'sz',s.sz); if(rPr.getAttribute('b')!=null) s.b=at(rPr,'b')==='1'||at(rPr,'b')==='true'; if(rPr.getAttribute('i')!=null) s.i=at(rPr,'i')==='1'||at(rPr,'i')==='true';
    if(rPr.getAttribute('u')&&at(rPr,'u')!=='none') s.u=true; if(at(rPr,'strike','noStrike')!=='noStrike') s.strike=true; if(rPr.getAttribute('baseline')) s.baseline=nu(rPr,'baseline',0);
    const sf=ch(rPr,'solidFill'); if(sf){ const c=colorOf(sf,ctx); if(c) s.color=c.css; }
    const lat=ch(rPr,'latin'); if(lat){ let t=at(lat,'typeface',''); if(t==='+mj-lt') t=FONTS.mj; else if(t==='+mn-lt') t=FONTS.mn; if(t) s.font=t; }
    return s; }
  function layoutParas(g,tx,ctx,k,chain,fontClr,isTitle){
    const body=ch(tx,'bodyPr'); const paras=[];
    const base0={sz:1800,b:false,i:false,color:fontClr||'rgb(0,0,0)',font:isTitle?FONTS.mj:FONTS.mn};
    for(const p of chs(tx,'p')){
      const pPr=ch(p,'pPr'), lvl=nu(pPr,'lvl',0), L=[pPr,...lvlEl(chain,lvl)].filter(Boolean);
      const first=(f)=>{for(const e of L){const v=f(e); if(v!=null) return v;} return null;};
      const attr=(n,d)=>{const v=first(e=>e.getAttribute(n)); return v==null?d:v;};
      const algn=attr('algn','l'), marL=+attr('marL',0), indent=+attr('indent',0);
      const lnSpc=first(e=>ch(ch(e,'lnSpc'),'spcPct')), spcB=first(e=>ch(e,'spcBef')), spcA=first(e=>ch(e,'spcAft'));
      const bu=first(e=>{const x=chs(e).find(c=>/^bu(None|Char|AutoNum)$/.test(c.localName)); return x||null;});
      let paraBase=base0; for(const e of [...L].reverse()){ paraBase=runStyle(ch(e,'defRPr'),paraBase,ctx,k); }
      const runs=[];
      for(const r of chs(p)){
        if(r.localName==='r'||r.localName==='fld'){ const st=runStyle(ch(r,'rPr'),paraBase,ctx,k); runs.push({t:(ch(r,'t')?.textContent)||'',st}); }
        else if(r.localName==='br') runs.push({br:true,st:runStyle(ch(r,'rPr'),paraBase,ctx,k)}); }
      const endSt=runStyle(ch(p,'endParaRPr'),paraBase,ctx,k);
      const pts=e=>e?(ch(e,'spcPts')?nu(ch(e,'spcPts'),'val',0)/100*12700:ch(e,'spcPct')?nu(ch(e,'spcPct'),'val',0)/100000*endSt.sz/100*12700*1.2:0):0;
      paras.push({algn,marL,indent,lnSpc:lnSpc?nu(lnSpc,'val',100000)/100000:1,spcB:pts(spcB),spcA:pts(spcA),bu:bu&&bu.localName!=='buNone'?bu:null,runs,endSt});
    }
    return {paras,body};
  }
  function fontCss(st,k,fs){ return `${st.i?'italic ':''}${st.b?'700':'400'} ${Math.max(1,(st.sz/100)*12700*k*fs*(st.baseline?0.65:1))}px "${st.font}", "${st.font.replace(/ (Bold|Regular|Light|Medium)$/,'')}", Arial, Helvetica, sans-serif`; }
  function drawText(g,tx,rect,ctx,k,chain,fontClr,isTitle){
    const [x,y,w,h]=rect; if(!tx) return; const {paras,body}=layoutParas(g,tx,ctx,k,chain,fontClr,isTitle);
    if(!paras.some(p=>p.runs.some(r=>r.t&&r.t.trim()))) return;
    const li=nu(body,'lIns',91440)*k, ti=nu(body,'tIns',45720)*k, ri=nu(body,'rIns',91440)*k, bi=nu(body,'bIns',45720)*k;
    const wrap=at(body,'wrap','square')!=='none', anchor=at(body,'anchor','t');
    const af=ch(body,'normAutofit'); let fs=af&&af.getAttribute('fontScale')?nu(af,'fontScale',100000)/100000:1;
    const avW=Math.max(1,w-li-ri), avH=h-ti-bi;
    function lay(fs){
      const lines=[]; let total=0;
      paras.forEach((p,pi)=>{
        const ind=p.marL*k, first=(p.bu?p.marL:p.marL+p.indent)*k; // with a bullet, text starts at marL and the bullet hangs at marL+indent
        const toks=[]; // {t,st,w,br}
        for(const r of p.runs){ if(r.br){toks.push({br:true,st:r.st});continue;} g.font=fontCss(r.st,k,fs); const parts=r.t.split(/(\s+)/).filter(s=>s!==''); for(const s of parts) toks.push({t:s,st:r.st,w:g.measureText(s).width,sp:/^\s+$/.test(s)}); }
        let cur={toks:[],w:0}, ls=[cur], avail=()=>avW-(ls.length===1?first:ind);
        for(const t of toks){ if(t.br){ cur={toks:[],w:0,hard:true}; ls.push(cur); continue; }
          if(wrap&&!t.sp&&cur.w+t.w>avail()&&cur.toks.some(x=>!x.sp)){ while(cur.toks.length&&cur.toks[cur.toks.length-1].sp){cur.w-=cur.toks.pop().w;} cur={toks:[],w:0}; ls.push(cur); }
          if(t.sp&&!cur.toks.length&&ls.length>1) continue; cur.toks.push(t); cur.w+=t.w; }
        const maxSz=Math.max(p.endSt.sz,...p.runs.map(r=>r.st.sz))/100*12700*k*fs;
        ls.forEach((l,li2)=>{ const lsz=l.toks.length?Math.max(...l.toks.map(t=>t.st.sz))/100*12700*k*fs:p.endSt.sz/100*12700*k*fs; const lh=lsz*1.2*p.lnSpc; l.lh=lh; l.lsz=lsz; l.p=p; l.first=li2===0; l.offset=li2===0?first:ind; l.gapBefore=li2===0&&pi>0?p.spcB*k:0; if(li2===0&&pi>0) total+=p.spcB*k; total+=lh; lines.push(l); });
        total+=p.spcA*k; });
      return {lines,total}; }
    let L=lay(fs); if(af&&!af.getAttribute('fontScale')){ while(L.total>avH&&fs>0.4){fs-=0.05; L=lay(fs);} }
    let cy= anchor==='ctr'?y+ti+(avH-L.total)/2:anchor==='b'?y+h-bi-L.total:y+ti;
    g.save(); g.textBaseline='alphabetic';
    for(const l of L.lines){ cy+=l.gapBefore||0;
      const p=l.p, lw=l.w, avl=avW-l.offset; let sx= l.p.algn==='ctr'?x+li+l.offset+(avl-lw)/2:l.p.algn==='r'?x+li+l.offset+(avl-lw):x+li+l.offset;
      if(l.first&&p.bu&&p.runs.length){ const bs=p.runs.find(r=>r.st)||{st:p.endSt}; g.font=fontCss(bs.st,k,fs); g.fillStyle=bs.st.color; const ch0=p.bu.localName==='buChar'?at(p.bu,'char','•'):'•'; g.textAlign='left'; g.fillText(ch0,x+li+(p.marL+p.indent)*k,cy+l.lsz*0.95); }
      for(const t of l.toks){ g.font=fontCss(t.st,k,fs); g.fillStyle=t.st.color; g.textAlign='left'; const by=cy+l.lsz*0.95-(t.st.baseline>0?l.lsz*0.35:t.st.baseline<0?-l.lsz*0.15:0);
        g.fillText(t.t,sx,by); if(t.st.u&&!t.sp){g.fillRect(sx,by+l.lsz*0.08,t.w,Math.max(1,l.lsz/16));} if(t.st.strike&&!t.sp){g.fillRect(sx,by-l.lsz*0.3,t.w,Math.max(1,l.lsz/16));} sx+=t.w; }
      cy+=l.lh; }
    g.restore();
  }
  // ---- slide rendering
  async function renderSlide(i,W){
    const sp=slides[i]; if(!sp) throw new Error('No such slide');
    const sd=await xml(sp), srels=await rels(sp);
    const layoutPath=Object.values(srels).find(r=>r.type==='slideLayout')?.target, layout=layoutPath&&await xml(layoutPath), lrels=layoutPath?await rels(layoutPath):{};
    const masterPath=Object.values(lrels).find(r=>r.type==='slideMaster')?.target, master=masterPath&&await xml(masterPath), mrels=masterPath?await rels(masterPath):{};
    const cm=master&&ch(master.documentElement,'clrMap'), clrMap={}; if(cm) for(const a of cm.attributes) clrMap[a.name]=a.value;
    const ctx0={clrMap};
    const k=W/SW, Hh=Math.round(SH*k); const cv=document.createElement('canvas'); cv.width=Math.round(W); cv.height=Hh; const g=cv.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,cv.width,Hh);
    g.imageSmoothingQuality='high';
    // background: slide > layout > master
    async function paintBg(doc,rl){ const bg=ch(ch(doc&&doc.documentElement,'cSld'),'bg'); if(!bg) return false; const bp=ch(bg,'bgPr'); if(bp){ const f=await fillOf(g,bp,ctx0,[0,0,cv.width,Hh],rl); if(f){g.fillStyle=f;g.fillRect(0,0,cv.width,Hh);return true;} }
      const br=ch(bg,'bgRef'); if(br){ const c=colorOf(br,ctx0); if(c){g.fillStyle=c.css;g.fillRect(0,0,cv.width,Hh);return true;} } return false; }
    (await paintBg(sd,srels))||(await paintBg(layout,lrels))||(await paintBg(master,mrels));
    // placeholder geometry lookup
    const phFind=(doc,ph)=>{ if(!doc||!ph) return null; const idx=at(ph,'idx'), type=at(ph,'type'); const tree=ch(ch(doc.documentElement,'cSld'),'spTree'); if(!tree) return null;
      const cand=chs(tree,'sp').filter(s=>{const p=ch(ch(ch(s,'nvSpPr'),'nvPr'),'ph'); return p;});
      let m=cand.find(s=>{const p=ch(ch(ch(s,'nvSpPr'),'nvPr'),'ph'); return idx&&at(p,'idx')===idx;})||cand.find(s=>{const p=ch(ch(ch(s,'nvSpPr'),'nvPr'),'ph'); return type&&at(p,'type')===type;}); return m; };
    const xfrmOf=(spPr)=>{ const x=ch(spPr,'xfrm'); if(!x) return null; const o=ch(x,'off'),e=ch(x,'ext'); if(!o||!e) return null; return {x:nu(o,'x',0),y:nu(o,'y',0),w:nu(e,'cx',0),h:nu(e,'cy',0),rot:nu(x,'rot',0)/60000,fh:at(x,'flipH')==='1'||at(x,'flipH')==='true',fv:at(x,'flipV')==='1'||at(x,'flipV')==='true'}; };
    async function drawTree(tree,T,rl,layer){
      for(const n of chs(tree)){
        const nm=n.localName;
        if(nm==='grpSp'){ const gp=ch(n,'grpSpPr'), x=ch(gp,'xfrm'); let T2=T; if(x){ const o=ch(x,'off'),e=ch(x,'ext'),co=ch(x,'chOff'),ce=ch(x,'chExt'); const cex=nu(ce,'cx',0)||nu(e,'cx',1), cey=nu(ce,'cy',0)||nu(e,'cy',1); const sx=T.sx*nu(e,'cx',1)/cex, sy=T.sy*nu(e,'cy',1)/cey; T2={sx,sy,tx:T.sx*nu(o,'x',0)+T.tx-nu(co,'x',0)*sx,ty:T.sy*nu(o,'y',0)+T.ty-nu(co,'y',0)*sy}; } await drawTree(n,T2,rl,layer); continue; }
        if(!/^(sp|pic|cxnSp|graphicFrame)$/.test(nm)) continue;
        const nv=ch(n,nm==='pic'?'nvPicPr':nm==='sp'?'nvSpPr':nm==='cxnSp'?'nvCxnSpPr':'nvGraphicFramePr'); const ph=ch(ch(nv,'nvPr'),'ph');
        if(layer!=='slide'&&ph) continue; // layout/master placeholders are templates, not drawn
        if(at(ch(nv,'cNvPr'),'hidden')==='1') continue;
        let spPr=ch(n,'spPr'), xf=nm==='graphicFrame'?(()=>{const x=ch(n,'xfrm'),o=ch(x,'off'),e=ch(x,'ext'); return o&&e?{x:nu(o,'x',0),y:nu(o,'y',0),w:nu(e,'cx',0),h:nu(e,'cy',0),rot:0}:null;})():xfrmOf(spPr);
        let phSp=null; if(!xf&&ph){ phSp=phFind(layout,ph)||phFind(master,ph); if(!phSp&&layout) phSp=phFind(master,ph); const ps=phSp&&ch(phSp,'spPr'); xf=ps&&xfrmOf(ps); if(!xf&&layout){ const ms=phFind(master,ph); xf=ms&&xfrmOf(ch(ms,'spPr')); } }
        if(!xf) continue;
        const X=xf.x*T.sx+T.tx, Y=xf.y*T.sy+T.ty, Wd=xf.w*T.sx, Ht=xf.h*T.sy; if(Wd<0||Ht<0) continue;
        const style=ch(n,'style'), ctx=Object.assign({},ctx0);
        g.save(); g.translate(X+Wd/2,Y+Ht/2); if(xf.rot) g.rotate(xf.rot*Math.PI/180); g.scale(xf.fh?-1:1,xf.fv?-1:1); g.translate(-Wd/2,-Ht/2);
        const b=[0,0,Wd,Ht];
        if(nm==='graphicFrame'){ const tbl=n.getElementsByTagNameNS('*','tbl')[0]; if(tbl) await drawTable(g,tbl,Wd,Ht,T,ctx,rl,master,k); else { g.fillStyle='rgba(200,200,200,.35)'; g.fillRect(0,0,Wd,Ht); g.strokeStyle='#999'; g.strokeRect(0,0,Wd,Ht); } g.restore(); continue; }
        if(nm==='pic'){
          const bf=ch(n,'blipFill'), bl=ch(bf,'blip'), id=bl&&[...bl.attributes].find(a=>a.localName==='embed')?.value, im=id&&rl[id]&&await image(rl[id].target);
          const geom=ch(spPr,'prstGeom'); if(geom&&at(geom,'prst')!=='rect'){ if(presetPath(g,at(geom,'prst'),ch(geom,'avLst'),Wd,Ht)===true) g.clip(); }
          if(im){ const sr=ch(bf,'srcRect'), l=nu(sr,'l',0)/100000, t=nu(sr,'t',0)/100000, r=nu(sr,'r',0)/100000, bt=nu(sr,'b',0)/100000; const sw=im.width*(1-l-r), sh=im.height*(1-t-bt); g.drawImage(im,im.width*l,im.height*t,sw,sh,0,0,Wd,Ht); }
          const ln=ch(spPr,'ln'); if(ln&&!ch(ln,'noFill')&&ch(ln,'solidFill')){ g.strokeStyle=colorOf(ch(ln,'solidFill'),ctx).css; g.lineWidth=Math.max(1,nu(ln,'w',12700)*k); g.strokeRect(0,0,Wd,Ht); }
          g.restore(); continue; }
        // shape / connector
        let fillRef=style&&ch(style,'fillRef'), lnRef=style&&ch(style,'lnRef');
        const geom=ch(spPr,'prstGeom'), cg=ch(spPr,'custGeom'); let kind=true;
        if(cg){ kind=custPath(g,cg,Wd,Ht); } else kind=presetPath(g,geom?at(geom,'prst','rect'):'rect',geom&&ch(geom,'avLst'),Wd,Ht);
        const noGeom=!geom&&!cg;
        let fill=await fillOf(g,spPr,ctx,b,rl);
        if(fill===undefined&&fillRef&&nu(fillRef,'idx',0)>0){ const c=colorOf(fillRef,ctx); fill=c?c.css:null; }
        if(fill&&kind!=='line'){ g.fillStyle=fill; g.fill(); }
        const ln=ch(spPr,'ln'); let stroke=null, lw=0;
        if(ln&&ch(ln,'noFill')) stroke=null; else if(ln&&ch(ln,'solidFill')){ stroke=colorOf(ch(ln,'solidFill'),ctx).css; lw=nu(ln,'w',12700); }
        else if(ln&&ch(ln,'gradFill')){ stroke=colorOf(ch(ch(ch(ln,'gradFill'),'gsLst'),'gs'),ctx)?.css||null; lw=nu(ln,'w',12700); }
        else if(lnRef&&nu(lnRef,'idx',0)>0){ const c=colorOf(lnRef,ctx); stroke=c?c.css:null; lw=nu(ln,'w',nu(lnRef,'idx',1)*9525); }
        if(stroke&&lw>=0){ g.lineWidth=Math.max(0.75,lw*k); g.strokeStyle=stroke; const d=at(ch(ln,'prstDash'),'val','solid'); const u=g.lineWidth; g.setLineDash(d==='dot'||d==='sysDot'?[0.01,u*2]:d==='dash'||d==='sysDash'?[u*4,u*3]:d==='lgDash'?[u*8,u*3]:d==='dashDot'?[u*4,u*3,u,u*3]:[]); g.lineCap=(d==='dot'||d==='sysDot')?'round':(at(ln,'cap','flat')==='rnd'?'round':'butt'); g.lineJoin='round'; g.stroke(); g.setLineDash([]); }
        // text
        const tx=ch(n,'txBody'); if(tx){ const isT=ph&&/title/i.test(at(ph,'type','')); const ms=ch(master&&master.documentElement,'txStyles'), tsty=ch(ms,isT?'titleStyle':ph?'bodyStyle':'otherStyle');
          const lp=ph&&phFind(layout,ph), mp=ph&&phFind(master,ph); const fr=style&&ch(style,'fontRef'), fc=fr?colorOf(fr,ctx):null;
          drawText(g,tx,b,ctx,k,[ch(tx,'lstStyle'),lp&&ch(ch(lp,'txBody'),'lstStyle'),mp&&ch(ch(mp,'txBody'),'lstStyle'),tsty].filter(Boolean),fc?fc.css:null,isT); }
        g.restore();
      }
    }
    const T0={sx:k,sy:k,tx:0,ty:0};
    const showM=at(layout&&layout.documentElement,'showMasterSp','1')!=='0'&&at(sd.documentElement,'showMasterSp','1')!=='0';
    if(showM&&master) await drawTree(ch(ch(master.documentElement,'cSld'),'spTree'),T0,mrels,'master');
    if(layout&&at(sd.documentElement,'showMasterSp','1')!=='0') await drawTree(ch(ch(layout.documentElement,'cSld'),'spTree'),T0,lrels,'layout');
    await drawTree(ch(ch(sd.documentElement,'cSld'),'spTree'),T0,srels,'slide');
    return cv;
  }
  async function drawTable(g,tbl,W,H,T,ctx,rl,master,k){
    const cols=chs(ch(tbl,'tblGrid'),'gridCol').map(c=>nu(c,'w',0)*T.sx), rows=chs(tbl,'tr'); let y=0;
    for(const tr of rows){ const rh=nu(tr,'h',0)*T.sy; let x=0, ci=0;
      for(const tc of chs(tr,'tc')){ const span=nu(tc,'gridSpan',1); let cw=0; for(let s=0;s<span;s++) cw+=cols[ci+s]||0; const pr=ch(tc,'tcPr');
        const f=await fillOf(g,pr,ctx,[x,y,cw,rh],rl); if(f){g.fillStyle=f;g.fillRect(x,y,cw,rh);}
        for(const [nm,x1,y1,x2,y2] of [['lnL',x,y,x,y+rh],['lnR',x+cw,y,x+cw,y+rh],['lnT',x,y,x+cw,y],['lnB',x,y+rh,x+cw,y+rh]]){ const l=ch(pr,nm); if(l&&ch(l,'solidFill')){ g.strokeStyle=colorOf(ch(l,'solidFill'),ctx).css; g.lineWidth=Math.max(1,nu(l,'w',12700)*k); g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); } }
        if(ch(tc,'txBody')) { const tb=ch(tc,'txBody'); drawText(g,tb,[x,y,cw,rh],ctx,k,[ch(tb,'lstStyle')].filter(Boolean),null,false); }
        x+=cw; ci+=span; }
      y+=rh; }
  }
  return {count:slides.length,width:SW,height:SH,render:renderSlide};
}
return {load};
})();
