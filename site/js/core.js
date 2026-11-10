// Shared core: page model, fonts, skills, renderers. Units: inches. Pages are landscape (11x8.5) or portrait (8.5x11) letter.
window.TPT = (function(){
  const PW=11, PH=8.5, STORE='My Side of the Classroom';
  const FONTS={Pacifico:'fonts/Pacifico-Regular.ttf',Andika:'fonts/Andika-Regular.ttf','Andika-Bold':'fonts/Andika-Bold.ttf','Fredoka-Bold':'fonts/Fredoka-Bold.ttf'};
  const FAM={Pacifico:['Pacifico','400'],Andika:['Andika','400'],'Andika-Bold':['Andika','700'],'Fredoka-Bold':['Fredoka','700']};
  const fontData={}; let logoData=null, logoImg=null;
  async function b64(url){const r=await fetch(url);const buf=new Uint8Array(await r.arrayBuffer());let s='';for(let i=0;i<buf.length;i+=0x8000)s+=String.fromCharCode.apply(null,buf.subarray(i,i+0x8000));return btoa(s);}
  async function init(){
    for(const [n,u] of Object.entries(FONTS)){
      const [fam,wt]=FAM[n]; const ff=new FontFace(fam,`url(${u})`,{weight:wt}); await ff.load(); document.fonts.add(ff);
      fontData[n]=await b64(u);
    }
    logoData='data:image/png;base64,'+await b64('assets/logo.png');
    logoImg=new Image(); logoImg.src=logoData; await logoImg.decode();
  }
  const icons={};
  // Load only the icons a page needs (word list from window.IMAGE_MAP); cached after the first load.
  async function loadIcons(words){ const M=window.IMAGE_MAP||{};
    await Promise.all(words.filter(w=>M[w]&&!icons[w]).map(async w=>{ try{const d='data:image/png;base64,'+await b64(M[w]); const im=new Image(); im.src=d; await im.decode(); icons[w]={src:d,img:im,w:im.naturalWidth,h:im.naturalHeight};}catch(e){console.warn('icon missing',w,M[w]);} })); }
  // ---- measuring
  const mc=document.createElement('canvas').getContext('2d');
  function cssFont(f,sizePt,bold){return `${bold?'700':'400'} ${sizePt}px ${f}`;}
  function textW(t,f,size,bold){mc.font=cssFont(f,100,bold);return mc.measureText(t).width/100*size/72;} // inches
  function fit(t,f,size,bold,maxW){while(size>6&&textW(t,f,size,bold)>maxW)size-=0.5;return size;}
  // wrap runs ([{t,b,u}]) to width; returns array of lines (each an array of runs)
  function wrapRuns(runs,f,size,maxW){
    const words=[]; for(const r of runs){ r.t.split(/(\s+)/).forEach(w=>{if(w!=='')words.push({t:w,b:r.b,u:r.u});}); }
    const lines=[]; let cur=[],w=0;
    for(const wd of words){ const ww=textW(wd.t,f,size,wd.b); const sp=/^\s+$/.test(wd.t);
      if(!sp&&w+ww>maxW&&cur.length){ while(cur.length&&/^\s+$/.test(cur[cur.length-1].t)) cur.pop(); lines.push(cur); cur=[]; w=0; }
      if(sp&&!cur.length) continue; cur.push(wd); w+=ww; }
    if(cur.length) lines.push(cur); if(!lines.length) lines.push([{t:'',b:false}]);
    // merge adjacent runs with same style
    return lines.map(l=>l.reduce((a,r)=>{const z=a[a.length-1]; if(z&&z.b===r.b&&z.u===r.u) z.t+=r.t; else a.push(Object.assign({},r)); return a;},[]));
  }
  // ---- page builder helpers
  function Page(orient){this.items=[];this.portrait=orient==='P';this.w=this.portrait?PH:PW;this.h=this.portrait?PW:PH;}
  Page.prototype.text=function(x,y,w,h,text,o={}){this.items.push(Object.assign({t:'text',x,y,w,h,text,font:'Andika',size:14,bold:false,align:'center',valign:'middle',color:'000000'},o));return this;};
  Page.prototype.rect=function(x,y,w,h,o={}){this.items.push(Object.assign({t:'rect',x,y,w,h,r:0,fill:null,line:'000000',lw:1},o));return this;};
  Page.prototype.oval=function(x,y,w,h,o={}){this.items.push(Object.assign({t:'oval',x,y,w,h,fill:'000000',line:null,lw:0},o));return this;};
  Page.prototype.line=function(x1,y1,x2,y2,o={}){this.items.push(Object.assign({t:'line',x:x1,y:y1,x2,y2,line:'000000',lw:1},o));return this;};
  Page.prototype.image=function(x,y,w,h,icon){this.items.push({t:'image',x,y,w,h,icon:icon||null});return this;};
  // contain-fit box for an icon inside x,y,w,h
  function fitBox(it){const ic=it.icon; if(!ic) return [it.x,it.y,it.w,it.h]; const f=Math.min(it.w/ic.w,it.h/ic.h), dw=ic.w*f, dh=ic.h*f; return [it.x+(it.w-dw)/2,it.y+(it.h-dh)/2,dw,dh];}
  // shape: 'heart' | 'star5' | 'triR' (triangle pointing right) inside box
  Page.prototype.shape=function(kind,x,y,w,h,o={}){this.items.push(Object.assign({t:'poly',kind,x,y,w,h,fill:'FFFFFF',line:'000000',lw:1},o));return this;};
  function polyPts(it){const {x,y,w,h}=it,P=[];
    if(it.kind==='heart'){for(let k=0;k<48;k++){const t=k/48*2*Math.PI,X=16*Math.pow(Math.sin(t),3),Y=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);P.push([x+w/2+X/34*w,y+h*0.42-Y/30*h]);}}
    else if(it.kind==='star5'){for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,rr=k%2?0.382:1;P.push([x+w/2+Math.cos(a)*w/2*rr,y+h*0.53+Math.sin(a)*h/2*rr]);}}
    else if(it.kind==='triR'){P.push([x,y],[x+w,y+h/2],[x,y+h]);}
    return P;}
  // ---- shared pieces
  function frame(p){p.rect(0.25,0.25,p.w-0.5,p.h-0.5,{r:0.25,lw:3,fill:'FFFFFF'});}
  function footer(p){p.text(0,p.h-0.48,p.w,0.2,'© '+STORE,{size:9});}
  // Compact page skill tag: right-aligned to xr, centered on yc. Regular weight, thin border, small padding.
  function skillTag(p,xr,yc,text,size){size=size||11; let w=textW(text,'Andika',size,false)+size*1.6/72; const maxW=4.2; if(w>maxW){size=fit(text,'Andika',size,false,maxW-size*1.6/72); w=maxW;}
    const h=size*2.0/72; p.rect(xr-w,yc-h/2,w,h,{r:h/2,lw:1,fill:'FFFFFF'}); p.text(xr-w,yc-h/2,w,h,text,{font:'Andika',size}); }
  function bubble(p,x,y,w,h,text,o={}){ if(/^Skills?:/.test(text)&&(o.size||22)<=22&&!o.dark){ skillTag(p,x+w,y+h/2,text,Math.min(11,Math.round((o.size||22)*0.7))); return; }p.rect(x,y,w,h,{r:h/2,lw:o.lw||2.5,fill:o.dark?'000000':'FFFFFF'});p.text(x,y,w,h,text,{font:'Andika',bold:true,size:fit(text,'Andika',o.size||22,true,w-Math.min(0.3,h*0.6)),color:o.dark?'FFFFFF':'000000'});}
  function die(p,x,y,s,n){p.rect(x,y,s,s,{r:s*0.18,lw:1.6,fill:'FFFFFF'});
    const pos={1:[[1,1]],2:[[0,0],[2,2]],3:[[0,0],[1,1],[2,2]],4:[[0,0],[0,2],[2,0],[2,2]],5:[[0,0],[0,2],[1,1],[2,0],[2,2]],6:[[0,0],[0,1],[0,2],[2,0],[2,1],[2,2]]}[n];
    const d=s*0.16; for(const [a,b] of pos) p.oval(x+s*(0.25+0.25*a)-d/2,y+s*(0.25+0.25*b)-d/2,d,d);}
  const TERMS=[['Thank you for your purchase!',1],['You may:',1],['• Use this resource in your own classroom with your own students.',0],['• Print copies for your students and their families.',0],['• Use it for in-person or distance learning with your own class (in a password-protected platform).',0],
      ['You may not:',1],['• Share, resell, or give this resource to other teachers. Please send them to my store!',0],['• Post it on a public website, shared drive, or file-sharing site.',0],['• Claim it as your own or use any part of it in products for sale.',0],
      ['Licenses:',1],['This purchase is for one teacher. Additional licenses are available at a discount on TpT.',0]];
  function termsPage(orient){const p=new Page(orient);frame(p);
    if(!p.portrait){
      p.text(0,0.5,PW,0.9,'Terms of Use',{font:'Pacifico',size:40});
      let y=1.55; for(const [t,b] of TERMS){ if(b&&y>1.6) y+=0.1; p.text(0.95,y,8,0.32,t,{bold:!!b,size:b?17:14,align:'left'}); y+=b?0.36:0.3; }
      p.image(PW-2.95,PH-2.95,2.1,2.1); p.text(0.95,PH-0.95,6,0.3,`© ${STORE}. All rights reserved.`,{size:13,align:'left'});
    } else {
      p.text(0,0.62,p.w,0.97,'Terms of Use',{font:'Pacifico',size:38});
      let y=1.75; const W=p.w-1.9;
      for(const [t,b] of TERMS){ if(b&&y>1.8) y+=0.12; const L=wrapRuns([{t,b:!!b}],'Andika',14,W); p.text(0.95,y,W,L.length*0.245,'',{runs:L,size:14,align:'left'}); y+=L.length*0.245+0.03; }
      p.text(0.95,y+0.2,W,0.3,`© ${STORE}. All rights reserved.`,{size:14,align:'left'});
      p.image(p.w/2-1.25,p.h-0.83-2.36,2.5,2.5);
    }
    return p;}
  // generic divider page used in bundles
  function divider(orient,title,label,n,total){const p=new Page(orient);p.rect(0.25,0.25,p.w-0.5,p.h-0.5,{r:0.28,lw:4,fill:'FFFFFF'});
    p.text(0,p.h*0.22,p.w,1.2,title,title==='Bingo'?{font:'Fredoka',bold:true,size:90}:{font:'Pacifico',size:54});
    const bw=Math.min(p.w-1.5,Math.max(3.2,textW('Skill: '+label,'Andika',36,true)+0.7)); bubble(p,p.w/2-bw/2,p.h*0.22+1.5,bw,0.9,'Skill: '+label,{size:36,lw:3});
    p.text(0,p.h*0.22+2.65,p.w,0.4,`Set ${n} of ${total}`,{size:18});
    p.image(p.w/2-1,p.h-0.85-2.0,2.0,2.0); footer(p); return p;}
  // ---- shuffle helpers
  function rng(seed){let s=seed>>>0||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
  function shuffle(a,r){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function fillGrid(pool,r,n=36,cols=6){ // minimal repeats; no dup in a row/column
    let out=[]; while(out.length<n) out=out.concat(shuffle(pool,r)); out=out.slice(0,n);
    const bad=()=>{for(let k=0;k<n;k++)for(let j=0;j<n;j++) if(j!==k&&out[j]===out[k]&&(j%cols===k%cols||Math.floor(j/cols)===Math.floor(k/cols))) return k; return -1;};
    for(let it=0;it<20000;it++){const k=bad(); if(k<0) break; const j=Math.floor(r()*n); [out[k],out[j]]=[out[j],out[k]];}
    return out;}
  // ---- text lines
  function lines(it){ if(it.runs) return it.runs; return String(it.text).split('\n').map(l=>[{t:l,b:it.bold,u:false}]); }
  function lineW(l,it){return l.reduce((s,r)=>s+textW(r.t,it.font,it.size,r.b),0);}
  function layoutText(it,cb){const L=lines(it), lh=it.size*1.25/72; let y0=it.valign==='top'?it.y+lh/2:it.y+it.h/2-(L.length-1)*lh/2;
    L.forEach((l,i)=>{const w=lineW(l,it); let x=it.align==='left'?it.x:it.align==='right'?it.x+it.w-w:it.x+it.w/2-w/2;
      for(const r of l){const rw=textW(r.t,it.font,it.size,r.b); cb(r,x,y0+i*lh,rw); x+=rw;}});}
  // ---- renderers
  function drawCanvas(page,cv,scale){
    const c=cv.getContext('2d'); cv.width=page.w*scale; cv.height=page.h*scale; c.fillStyle='#fff'; c.fillRect(0,0,cv.width,cv.height);
    const dash=it=>{const u=it.lw*scale/72; c.setLineDash(it.dash==='dot'?[0.01,u*2]:it.dash==='dash'?[u*4,u*3]:[]); c.lineCap=it.dash==='dot'?'round':'butt';};
    for(const it of page.items){
      const X=it.x*scale,Y=it.y*scale,W=(it.w||0)*scale,H=(it.h||0)*scale;
      if(it.t==='rect'){c.beginPath(); c.roundRect? c.roundRect(X,Y,W,H,Math.min((it.r||0)*scale,W/2,H/2)):c.rect(X,Y,W,H); if(it.fill){c.fillStyle='#'+it.fill;c.fill();} if(it.line){c.lineWidth=it.lw*scale/72;c.strokeStyle='#'+it.line;dash(it);c.stroke();c.setLineDash([]);}}
      else if(it.t==='oval'){c.beginPath();c.ellipse(X+W/2,Y+H/2,W/2,H/2,0,0,7);c.fillStyle='#'+it.fill;c.fill();}
      else if(it.t==='poly'){c.beginPath();polyPts(it).forEach(([a,b],k)=>k?c.lineTo(a*scale,b*scale):c.moveTo(a*scale,b*scale));c.closePath();if(it.fill){c.fillStyle='#'+it.fill;c.fill();}if(it.line){c.lineWidth=it.lw*scale/72;c.strokeStyle='#'+it.line;c.lineJoin='round';c.stroke();}}
      else if(it.t==='line'){c.beginPath();c.moveTo(X,Y);c.lineTo(it.x2*scale,it.y2*scale);c.lineWidth=it.lw*scale/72;c.strokeStyle='#'+it.line;dash(it);c.stroke();c.setLineDash([]);c.lineCap='butt';}
      else if(it.t==='image'){const [a,b,w2,h2]=fitBox(it); c.drawImage(it.icon?it.icon.img:logoImg,a*scale,b*scale,w2*scale,h2*scale);}
      else if(it.t==='text'){c.fillStyle='#'+it.color;c.textBaseline='middle';c.textAlign='left';
        layoutText(it,(r,x,y,rw)=>{c.font=cssFont(it.font,it.size*scale/72,r.b);c.fillText(r.t,x*scale,y*scale);
          if(r.u){c.fillRect(x*scale,(y+it.size*0.42/72)*scale,rw*scale,Math.max(1,it.size/14/72*scale));}});}
    }}
  function pdfDoc(pages){
    const {jsPDF}=window.jspdf; const or=p=>p.portrait?'portrait':'landscape';
    const d=new jsPDF({orientation:or(pages[0]),unit:'in',format:'letter'});
    d.addFileToVFS('Pacifico.ttf',fontData.Pacifico); d.addFont('Pacifico.ttf','Pacifico','normal');
    d.addFileToVFS('Andika.ttf',fontData.Andika); d.addFont('Andika.ttf','Andika','normal');
    d.addFileToVFS('AndikaB.ttf',fontData['Andika-Bold']); d.addFont('AndikaB.ttf','Andika','bold');
    d.addFileToVFS('FredokaB.ttf',fontData['Fredoka-Bold']); d.addFont('FredokaB.ttf','Fredoka','bold'); d.addFont('FredokaB.ttf','Fredoka','normal');
    const dash=it=>{const u=it.lw/72; if(it.dash==='dot'){d.setLineDashPattern([0.0001,u*2],0);d.setLineCap('round');} else if(it.dash==='dash'){d.setLineDashPattern([u*4,u*3],0);d.setLineCap('butt');} else {d.setLineDashPattern([],0);d.setLineCap('butt');}};
    pages.forEach((page,pi)=>{ if(pi) d.addPage('letter',or(page));
      for(const it of page.items){
        if(it.t==='rect'){d.setLineWidth(it.lw/72); d.setDrawColor('#'+(it.line||'000000')); if(it.fill) d.setFillColor('#'+it.fill); dash(it);
          const st=it.fill&&it.line?'FD':it.fill?'F':'S'; const r=Math.min(it.r||0,it.w/2,it.h/2); r? d.roundedRect(it.x,it.y,it.w,it.h,r,r,st):d.rect(it.x,it.y,it.w,it.h,st); dash({});}
        else if(it.t==='oval'){d.setFillColor('#'+it.fill); d.ellipse(it.x+it.w/2,it.y+it.h/2,it.w/2,it.h/2,'F');}
        else if(it.t==='poly'){const P=polyPts(it); const dl=P.slice(1).map((q,k)=>[q[0]-P[k][0],q[1]-P[k][1]]);
          d.setLineWidth(it.lw/72); d.setDrawColor('#'+(it.line||'000000')); if(it.fill) d.setFillColor('#'+it.fill); d.setLineJoin('round');
          d.lines(dl,P[0][0],P[0][1],[1,1],it.fill&&it.line?'FD':it.fill?'F':'S',true);}
        else if(it.t==='line'){d.setLineWidth(it.lw/72);d.setDrawColor('#'+it.line);dash(it);d.line(it.x,it.y,it.x2,it.y2);dash({});}
        else if(it.t==='image'){const [a,b,w2,h2]=fitBox(it); d.addImage(it.icon?it.icon.src:logoData,'PNG',a,b,w2,h2,it.icon?'ic_'+it.icon.src.length+'_'+it.icon.src.slice(-24):'logo','FAST');}
        else if(it.t==='text'){d.setFontSize(it.size); d.setTextColor('#'+it.color);
          layoutText(it,(r,x,y,rw)=>{d.setFont(it.font,r.b?'bold':'normal'); d.text(r.t,x,y,{baseline:'middle'});
            if(r.u){d.setFillColor('#'+it.color); d.rect(x,y+it.size*0.42/72,rw,it.size/14/72,'F');}});}
      }});
    return d;}
  function pdf(pages,fname){const d=pdfDoc(pages); d.setProperties({title:fname}); d.save(fname+'.pdf');}
  function pptxDoc(pages,fname){
    const P=new PptxGenJS(); const portrait=pages[0].portrait;
    P.defineLayout({name:'LETTER',width:portrait?PH:PW,height:portrait?PW:PH}); P.layout='LETTER'; P.title=fname;
    P.theme={headFontFace:'Andika',bodyFontFace:'Andika'};
    const ln=it=>it.line?Object.assign({color:it.line,width:it.lw},it.dash==='dot'?{dashType:'sysDot'}:it.dash==='dash'?{dashType:'dash'}:{}):{type:'none'};
    for(const page of pages){ const s=P.addSlide(); s.background={color:'FFFFFF'};
      for(const it of page.items){
        if(it.t==='rect'){const o={x:it.x,y:it.y,w:it.w,h:it.h,fill:it.fill?{color:it.fill}:{type:'none'},line:ln(it)};
          if(it.r){o.rectRadius=Math.min(0.5,it.r/Math.min(it.w,it.h));} s.addShape(it.r?P.ShapeType.roundRect:P.ShapeType.rect,o);}
        else if(it.t==='oval'){s.addShape(P.ShapeType.ellipse,{x:it.x,y:it.y,w:it.w,h:it.h,fill:{color:it.fill},line:{type:'none'}});}
        else if(it.t==='poly'){const k={heart:P.ShapeType.heart,star5:P.ShapeType.star5,triR:P.ShapeType.triangle}[it.kind];
          s.addShape(k,{x:it.x,y:it.y,w:it.w,h:it.h,rotate:it.kind==='triR'?90:0,fill:it.fill?{color:it.fill}:{type:'none'},line:ln(it)});}
        else if(it.t==='line'){s.addShape(P.ShapeType.line,{x:it.x,y:it.y,w:Math.max(it.x2-it.x,0),h:Math.max(it.y2-it.y,0),line:ln(it)});}
        else if(it.t==='image'){const [a,b,w2,h2]=fitBox(it); s.addImage({data:it.icon?it.icon.src:logoData,x:a,y:b,w:w2,h:h2});}
        else if(it.t==='text'){const L=lines(it), arr=[];
          L.forEach((l,i)=>l.forEach((r,j)=>arr.push({text:r.t,options:{bold:!!r.b,underline:r.u?{style:'sng'}:undefined,breakLine:j===l.length-1&&i<L.length-1}})));
          s.addText(arr,{x:it.x,y:it.y,w:it.w,h:it.h,fontFace:it.font,fontSize:it.size,color:it.color,align:it.align,valign:it.valign,margin:0,fill:{type:'none'},line:{type:'none'},fit:'none',wrap:!it.nowrap,lineSpacingMultiple:1.0});}
      }}
    return P;}
  async function pptx(pages,fname){await pptxDoc(pages,fname).writeFile({fileName:fname+'.pptx'});}


  // python-pptx style textbox in POINTS (default insets 7.2pt L/R, 3.6pt T/B; o.m=0 removes them). Wraps to width.
  function tb(p,x,y,w,h,text,o={}){const m=o.m===undefined?7.2:o.m, mv=o.m===undefined?3.6:o.m, size=o.size||14, font=o.font||'Andika';
    const X=(x+m)/72,Y=(y+mv)/72,W=(w-2*m)/72,H=(h-2*mv)/72; const runs=[];
    String(text).split('\n').forEach(l=>{const k=l.indexOf(':'); let r;
      if(o.richColon&&k>0&&k<20) r=[{t:l.slice(0,k+1),b:true},{t:l.slice(k+1),b:!!o.bold}];
      else r=[{t:l,b:!!o.bold||(!!o.colonBold&&l.endsWith(':')),u:!!o.underline}];
      if(o.nowrap) runs.push(r); else runs.push(...wrapRuns(r,font,size,W));});
    p.text(X,Y,W,H,String(text),{runs,size,font,bold:!!o.bold,align:o.align||'center',valign:o.top?'top':'middle',color:o.color||'000000',nowrap:!!o.nowrap});return p;}
  // Several sets can share skills inside a longer label ("short a • short e"), so for more than one set split the labels and list each skill once.
  function skillList(secs){return secs.length>1?[...new Set(secs.flatMap(s=>String(s.label||'').split(' • ').map(x=>x.trim()).filter(Boolean)))]:[...new Set(secs.map(s=>s.label))];}
  function skillsText(secs){const u=skillList(secs);return (u.length>1?'Skills: ':'Skill: ')+u.join(' • ');}
  // sets: [{cfg,seed}] -> {pages,secs}. One set = cover, directions, pages, terms. Bundle adds a divider before each set.
  function assemble(prod,sets){
    const secs=sets.map(s=>prod.section(s.cfg,s.seed));
    const pages=[prod.cover(secs),...prod.directions(sets.map(s=>s.cfg))];
    secs.forEach((sec,i)=>{ if(secs.length>1) pages.push(divider(prod.orient,prod.title,sec.label,i+1,secs.length)); pages.push(...sec.pages); });
    pages.push(termsPage(prod.orient)); return {pages,secs};}
  function fileName(prod,secs){const u=[...new Set(secs.map(s=>s.label))];const lab=!u.filter(Boolean).length?'Pack':secs.length>1?(u.length>3?`Bundle of ${secs.length}`:'Bundle - '+u.join(', ')):u[0];
    return `${prod.title} - ${lab} - ${STORE}`.replace(/[\/\\:*?"<>|]/g,'');}
  return {skillTag,icons,loadIcons,tb,skillsText,skillList,assemble,fileName,PW,PH,STORE,init,Page,frame,footer,bubble,die,termsPage,divider,textW,fit,wrapRuns,rng,shuffle,fillGrid,drawCanvas,pdf,pdfDoc,pptx,pptxDoc,products:[]};
})();
