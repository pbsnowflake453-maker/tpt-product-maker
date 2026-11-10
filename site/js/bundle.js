// Bundles: ONE file (PowerPoint or PDF) = cover, What's Included (mixed bundles), directions for each product type used,
// a divider page before each set, the sets, then one Terms of Use. Any mix of product types that share a page orientation.
// (PowerPoint holds one slide size, so landscape products - Roll and Read, Roll and Solve, Task Cards - bundle with each other,
//  and portrait products - everything else - bundle with each other.)
window.BUNDLE=(function(){
const T=TPT;
const clean=s=>String(s==null?'':s).replace(/[\/\\:*?"<>|]/g,'').replace(/\s+/g,' ').trim();
// each skill once, even when several sets share skills inside longer labels ("short a • short e")
function skillsOf(labels){return [...new Set(labels.flatMap(l=>String(l||'').split(' • ').map(x=>x.trim()).filter(Boolean)))];}
function suggestTitle(prods){const names=[...new Set(prods.map(p=>p.title))];return names.length?names.join(', ')+' Bundle':'';}
function orientCheck(prods){const o=[...new Set(prods.map(p=>p.orient))];return o.length<=1?null:'One PowerPoint or PDF can only hold one page shape. '+prods.filter(p=>p.orient==='L').map(p=>p.title).filter((v,i,a)=>a.indexOf(v)===i).join(', ')+' (landscape) cannot share a file with '+prods.filter(p=>p.orient==='P').map(p=>p.title).filter((v,i,a)=>a.indexOf(v)===i).join(', ')+' (portrait). Make one bundle for each.';}
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
// rows: [{prod,label,pages:[from,to]}] ; returns how many contents pages (so page numbers can be computed first)
function contentsPages(orient,rows){
  const pages=[]; let p,y;
  const add=()=>{p=new T.Page(orient); frame(p); p.text(0,0.55,p.w,0.9,pages.length?"What's Included (continued)":"What's Included",{font:'Pacifico',size:38}); T.footer(p); y=1.75; pages.push(p);};
  add(); const W=p.w-1.9;
  rows.forEach((s,i)=>{
    const rn=s.pages[0]===s.pages[1]?`page ${s.pages[0]}`:`pages ${s.pages[0]}-${s.pages[1]}`;
    const runs=[{t:(i+1)+'.  ',b:true},{t:s.prod.title,b:true}].concat(s.label?[{t:' - '+s.label,b:false}]:[]).concat([{t:'   ('+rn+')',b:false}]);
    const L=T.wrapRuns(runs,'Andika',15,W), h=L.length*0.27+0.22;
    if(y+h>p.h-1.0) add();
    p.text(0.95,y,W,L.length*0.27,'',{runs:L,size:15,align:'left',nowrap:true}); y+=h;});
  return pages;}
// sets: [{prod,cfg,seed}]  ->  {pages,secs,sets:[{prod,sec,from,to}],title,skills}
function assemble(sets,title){
  const prods=sets.map(s=>s.prod), bad=orientCheck(prods); if(bad) throw new Error(bad);
  const secs=sets.map(s=>s.prod.section(s.cfg,s.seed)), distinct=[...new Set(prods)], orient=prods[0].orient;
  const typed=String(title||'').trim(), mixed=distinct.length>1;
  const skills=skillsOf(secs.map(s=>s.label));
  const pages=[]; const info=sets.map(()=>({}));
  if(!mixed&&!typed){ // one product type, no typed title: the product's own cover (as before)
    pages.push(distinct[0].cover(secs),...distinct[0].directions(sets.map(s=>s.cfg)));
  } else {
    const ttl=typed||suggestTitle(prods), dirs=distinct.flatMap(pr=>pr.directions(sets.filter(s=>s.prod===pr).map(s=>s.cfg)));
    const mk=off=>{let n=off; return secs.map((sec,i)=>{const len=(secs.length>1?1:0)+sec.pages.length; const r={prod:prods[i],label:sec.label,pages:[n+1,n+len]}; n+=len; return r;});};
    const cp=contentsPages(orient,mk(0)).length, cpages=contentsPages(orient,mk(1+cp+dirs.length));
    pages.push(coverPage(orient,ttl,skills,sets.length),...cpages,...dirs);
  }
  const startIdx=[];
  secs.forEach((sec,i)=>{ if(secs.length>1) pages.push(T.divider(prods[i].orient,prods[i].title,sec.label,i+1,secs.length)); startIdx.push(pages.length); pages.push(...sec.pages); });
  pages.push(T.termsPage(orient));
  return {pages,secs,sets:secs.map((sec,i)=>({prod:prods[i],sec,from:startIdx[i],to:startIdx[i]+sec.pages.length})),title:typed||(mixed?suggestTitle(prods):''),skills,mixed};}
function fileName(doc,sets){
  const prods=sets.map(s=>s.prod), t=doc.title;
  if(t) return `${clean(t)} - ${T.STORE}`;
  return T.fileName(prods[0],doc.secs);}
return {assemble,fileName,skillsOf,suggestTitle,orientCheck,clean};
})();
