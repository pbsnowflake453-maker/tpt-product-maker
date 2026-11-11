(async function(){
const T=TPT, $=id=>document.getElementById(id);
const READ=SKILLS, MATHS=MATH.skills;
let prod=T.products[0], kind='reading', sel=[], seed=Date.now()%100000, cur=null, showBundle=false;
const bundleSets=[]; // one list for every product type: [{id,pid,cfg,seed,desc}]
let setId=0, titleTouched=false, picks=[], bpicks=[]; // picks: page indexes chosen for the listing images (single product / bundle)
// ---------- mystery state
const MY={theme:null,name:null,rows:[],orig:[],colors:{},assign:{},undo:[],brush:null};
const PAL=PIXELS.palette, MP=()=>T.products.find(p=>p.id==='mystery');
const DEFAULT_READ=['sh','ch','th (unvoiced, as in thin)','wh','ck','ng','nk','qu','tch','ff','ll','ss'];
const WW_MIN={wwdraw:[['draw',9]],wwsounds:[['count',10]],wwphonics:[['pair',6]]}; // word-work products hide skills with too few usable words
function skillsFor(k){const L=k==='math'?MATHS:READ;if(typeof prod!=='undefined'&&prod){
  if(prod.id==='readdraw'&&T._rdAvail)return L.filter(s=>T._rdAvail(s)>=6); // Read and Draw hides skills with fewer than 6 sentences
  if(WW_MIN[prod.id]&&T._wwAvail)return L.filter(s=>WW_MIN[prod.id].every(([t,n])=>T._wwAvail(s,t)>=n));
  if(prod.id==='picturewrite'&&T._pwAvail)return L.filter(s=>T._pwAvail([s]).length>=9);} // Picture Write hides skills with fewer than 9 pictures
  return L;}
function bundle(){return bundleSets;}
function prodOf(x){return T.products.find(p=>p.id===x.pid);}
// ---------- product + kind
function renderProducts(){$('products').innerHTML='';for(const p of T.products){const b=document.createElement('button');b.textContent=p.name;b.className=p===prod?'on':'';
  b.onclick=()=>{if(p===prod)return;prod=p;if(!p.kinds.includes(kind))kind=p.kinds[0];sel=[];defaultSkill();renderAll();};$('products').appendChild(b);}
  $('kinds').innerHTML='';if(prod.kinds.length>1)for(const k of prod.kinds){const b=document.createElement('button');b.textContent=k==='math'?'Math':'Reading';b.className=k===kind?'on':'';
    b.onclick=()=>{if(k===kind)return;kind=k;sel=[];defaultSkill();if(prod.id==='mystery')defaultAssign();renderAll();};$('kinds').appendChild(b);}}
function defaultSkill(){const L=skillsFor(kind);if(prod.noSkill){sel=[L.find(s=>s.name==='Tricky Words')||L[0]];return;}if(prod.id==='readdraw'||WW_MIN[prod.id]){sel=[L.find(s=>s.name==='Unit 1')||L[0]];return;}sel=[(kind==='math'?(L.find(s=>s.name==='Making 10')):(L.find(s=>s.name.startsWith('ou ('))))||L[0]];}
function labelFor(){if(prod.id==='coldread')return '';if(prod.noSkill)return 'Tricky Words';if(prod.id==='mystery'&&kind==='reading')return MY.rows.length?[...new Set(MP().colorsByCount(MY.rows).filter(([c])=>!(MY.bgOff&&c==='.')).map(([c])=>T.readLabel(MY.assign[c])))].join(' • '):'';
  return sel.map(s=>kind==='math'?s.label:T.readLabel(s)).join(' • ');}
// ---------- skills list
let mainPick=null;
function renderSkills(){const myRead=prod.id==='mystery'&&kind==='reading';$('skillSec').hidden=myRead||!!prod.noSkill;
  $('mixWrap').hidden=!(prod.multiSkill&&kind==='reading');
  if(!mainPick){mainPick=SkillPicker({list:()=>skillsFor(kind),selected:()=>sel,multi:()=>prod.multiSkill&&kind==='reading'&&$('mix').checked,
    onPick(s){if(prod.multiSkill&&kind==='reading'&&$('mix').checked){sel=sel.includes(s)?sel.filter(x=>x!==s):sel.concat([s]);if(!sel.length)sel=[s];}else sel=[s];
      if(prod.id==='mystery')defaultAssign();$('label').value=labelFor();if(prod.id==='mystery')renderColors();build();}});$('skillPick').appendChild(mainPick);}
  mainPick.refresh();}
// ---------- mystery picture
function pickImage(theme,name){const im=PIXELS.themes[theme].find(i=>i.name===name);MY.theme=theme;MY.name=name;MY.rows=im.rows.slice();MY.orig=im.rows.slice();MY.undo=[];MY.colors={};
  for(const ch of new Set(im.rows.join('')))MY.colors[ch]={hex:ch==='.'?'#FFFFFF':PAL[ch],name:MP().NAMES[ch]||ch};
  MY.bgOff=true;$('bgOff').checked=true;MY.brush=MP().colorsByCount(MY.rows)[0][0];defaultAssign();}
function defaultAssign(){const order=MP().colorsByCount(MY.rows).map(x=>x[0]);
  if(kind==='math'){const ch=MP().answerChoices(sel[0]);let cand=ch.filter(x=>x[1]>=3).map(x=>x[0]).sort((a,b)=>a-b);if(cand.length<order.length)cand=ch.map(x=>x[0]).sort((a,b)=>a-b);
    const n=order.length;order.forEach((c,i)=>MY.assign[c]=cand[n>=cand.length?i%cand.length:Math.round(cand.length-1-i*(cand.length-1)/Math.max(1,n-1))]);}
  else order.forEach((c,i)=>{const cur=MY.assign[c];if(!cur||typeof cur!=='object')MY.assign[c]=READ.find(s=>s.name===DEFAULT_READ[i%DEFAULT_READ.length]);});}
function thumb(rows,px){const c=document.createElement('canvas');c.width=rows[0].length*px;c.height=rows.length*px;const g=c.getContext('2d');
  rows.forEach((r,i)=>[...r].forEach((ch,j)=>{g.fillStyle=ch==='.'?'#fff':PAL[ch];g.fillRect(j*px,i*px,px,px);}));return c;}
function renderThumbs(){const t=$('theme').value;$('thumbs').innerHTML='';for(const im of PIXELS.themes[t]){const c=thumb(im.rows,Math.max(2,Math.floor(48/im.rows[0].length)));c.title=im.name;
  if(t===MY.theme&&im.name===MY.name)c.className='on';c.onclick=()=>{pickImage(t,im.name);renderThumbs();renderMystery();};$('thumbs').appendChild(c);}}
function cellPx(){return Math.max(10,Math.floor(300/Math.max(MY.rows.length,MY.rows[0].length)));}
function drawEditor(){const px=cellPx(),c=$('editor'),R=MY.rows.length,C=MY.rows[0].length;c.width=C*px;c.height=R*px;const g=c.getContext('2d');
  MY.rows.forEach((r,i)=>[...r].forEach((ch,j)=>{g.fillStyle=MY.colors[ch].hex;g.fillRect(j*px,i*px,px,px);}));
  g.strokeStyle='#0003';g.lineWidth=1;for(let i=0;i<=C;i++){g.beginPath();g.moveTo(i*px+.5,0);g.lineTo(i*px+.5,R*px);g.stroke();}for(let i=0;i<=R;i++){g.beginPath();g.moveTo(0,i*px+.5);g.lineTo(C*px,i*px+.5);g.stroke();}}
function paint(i,j){if(i<0||j<0||i>=MY.rows.length||j>=MY.rows[0].length)return false;const r=MY.rows[i];if(r[j]===MY.brush)return false;MY.rows[i]=r.slice(0,j)+MY.brush+r.slice(j+1);return true;}
let painting=false,changed=false;
function evCell(e){const px=cellPx(),b=$('editor').getBoundingClientRect(),sx=$('editor').width/b.width;return [Math.floor((e.clientY-b.top)*sx/px),Math.floor((e.clientX-b.left)*sx/px)];}
$('editor').onpointerdown=e=>{painting=true;changed=false;MY.undo.push(MY.rows.slice());const [i,j]=evCell(e);if(paint(i,j)){changed=true;drawEditor();}};
$('editor').onpointermove=e=>{if(!painting)return;const [i,j]=evCell(e);if(paint(i,j)){changed=true;drawEditor();}};
window.addEventListener('pointerup',()=>{if(!painting)return;painting=false;if(!changed)MY.undo.pop();else{defaultAssignNew();renderColors();build();}});
function defaultAssignNew(){for(const [c] of MP().colorsByCount(MY.rows))if(MY.assign[c]===undefined||(kind==='reading'&&typeof MY.assign[c]!=='object')){if(kind==='math')MY.assign[c]=MP().answerChoices(sel[0])[0][0];else MY.assign[c]=READ.find(s=>s.name==='sh');}}
$('undo').onclick=()=>{if(!MY.undo.length)return;MY.rows=MY.undo.pop();renderColors();drawEditor();build();};
$('resetImg').onclick=()=>{MY.undo.push(MY.rows.slice());MY.rows=MY.orig.slice();renderColors();drawEditor();build();};
$('addColor').onclick=()=>{const used=new Set(Object.keys(MY.colors));const ch=[...'abcdefhijklmoqtuwxyzADEFHIJQUVXZ0123456789'].find(c=>!used.has(c));if(!ch)return;
  MY.colors[ch]={hex:$('newColor').value.toUpperCase(),name:'Color '+(Object.keys(MY.colors).length+1)};MY.brush=ch;renderColors();};
function renderColors(){const counts=Object.fromEntries(MP().colorsByCount(MY.rows));
  const order=MP().colorsByCount(MY.rows).map(x=>x[0]).concat(Object.keys(MY.colors).filter(c=>!counts[c]&&c===MY.brush));
  const box=$('colors');box.innerHTML='';const ansCh=kind==='math'?MP().answerChoices(sel[0]):null;
  const used={};for(const c of order){const a=MY.assign[c];const k=kind==='math'?a:(a&&a.name);used[k]=(used[k]||0)+1;}
  for(const c of order){const d=document.createElement('div');d.className='crow'+(MY.brush===c?' brush':'');
    const col=document.createElement('input');col.type='color';col.value=MY.colors[c].hex.toLowerCase();col.title='Change this color everywhere';
    col.oninput=()=>{MY.colors[c].hex=col.value.toUpperCase();drawEditor();};col.onchange=()=>{MY.colors[c].hex=col.value.toUpperCase();drawEditor();build();};
    const nm=document.createElement('input');nm.className='nm';nm.value=MY.colors[c].name;nm.title='Crayon name';nm.onchange=()=>{MY.colors[c].name=nm.value;build();};
    const ct=document.createElement('span');ct.className='ct';ct.textContent=counts[c]||0;
    const s=document.createElement('select');
    if(kind==='math'){ansCh.forEach(([a,n])=>{const o=document.createElement('option');o.value=a;o.textContent=`= ${a}  (${n} problems)`;s.appendChild(o);});s.value=MY.assign[c];s.onchange=()=>{MY.assign[c]=+s.value;renderColors();build();};}
    else{s.hidden=true;const pk=SkillPicker({list:()=>READ,selected:()=>[MY.assign[c]],compact:true,onPick(k){MY.assign[c]=k;setTimeout(()=>{$('label').value=labelFor();renderColors();build();});}});
      if(used[MY.assign[c]&&MY.assign[c].name]>1)pk.querySelector('.pk-btn').classList.add('warn');if(!(MY.bgOff&&c==='.'))d.append(pk);}
    const k=kind==='math'?MY.assign[c]:(MY.assign[c]&&MY.assign[c].name);if(used[k]>1)s.classList.add('warn'),s.title='Two colors share this — the puzzle would be ambiguous';
    if(MY.bgOff&&c==='.'){s.hidden=true;col.hidden=true;nm.hidden=true;const t=document.createElement('span');t.className='small';t.textContent='Background (not colored)';d.append(t);}
    const br=document.createElement('button');br.textContent='🖌';br.title='Paint with this color';br.onclick=()=>{MY.brush=c;renderColors();};
    d.prepend(br,col,nm,ct);d.append(s);box.appendChild(d);}
  $('label').value=labelFor();}
function renderMystery(){drawEditor();renderColors();build();}
// ---------- word-work pages: option rows and the tricky-word picker
const WW_ROWS={wwdraw:['Pages','Boxes'],wwsounds:['Pages','Lines'],wwphonics:['Pages'],wwshapes:['Per'],wwmissing:['Per'],wwtricky:[]};
const TRICKY=(window.WORDINFO&&WORDINFO.tricky||[]).map(x=>x[0]).filter(w=>w.length>1);
function wwShow(){const rows=WW_ROWS[prod.id]||[];$('wwOpt').hidden=!rows.length;['Pages','Boxes','Lines','Per'].forEach(k=>$('ww'+k+'Row').hidden=!rows.includes(k));
  $('twSec').hidden=!prod.noSkill;if(prod.noSkill){if(!$('twText').value.trim())$('twText').value=TRICKY.slice(0,16).join(' ');twChips();}}
function twChips(){const on=new Set(T.tricky.parseWords($('twText').value).words);$('twChips').innerHTML='';
  for(const w of (window.WORDINFO&&WORDINFO.tricky||[]).map(x=>x[0])){const b=document.createElement('button');b.type='button';b.textContent=w;b.className=on.has(T.tricky.parseWords(w).words[0])?'on':'';b.onclick=()=>twToggle(w);$('twChips').appendChild(b);}}
function twToggle(w){const cur=T.tricky.parseWords($('twText').value).words,k=T.tricky.parseWords(w).words[0],i=cur.indexOf(k);if(i>=0)cur.splice(i,1);else cur.push(k);$('twText').value=cur.join(' ');twChips();build();}
let twT;$('twText').oninput=()=>{clearTimeout(twT);twT=setTimeout(()=>{twChips();build();},300);};
$('twAll').onclick=()=>{$('twText').value=TRICKY.join(' ');twChips();build();};$('twNone').onclick=()=>{$('twText').value='';twChips();build();};
// ---------- config + build
function cfg(){const c={text:$('crText').value,kind,skills:sel.slice(),label:$('label').value.trim(),opts:{boards:Math.max(1,Math.min(40,+$('boards').value||1)),size:+$('size').value,same:$('same').checked,cards:$('cards').checked,cut:$('wsCut')&&$('wsCut').checked,write:$('wsWrite')&&$('wsWrite').checked,mazeSize:$('mazeSize')&&$('mazeSize').value,nameLine:$('crName').checked,wordBank:$('pwBank').checked,rdPages:+$('rdPages').value||2,wwPages:+$('wwPages').value||2,wwBoxes:+$('wwBoxes').value,wwLines:+$('wwLines').value,wwPer:+$('wwPer').value,twText:$('twText').value}};c.pics=crPicMap(c.text);
  if(prod.id==='mystery'){const order=MP().colorsByCount(MY.rows).map(x=>x[0]);c.image={name:MY.name,rows:MY.rows.slice()};c.colors=JSON.parse(JSON.stringify(MY.colors));c.assign=Object.fromEntries(order.map(k=>[k,MY.assign[k]]));c.bgOff=MY.bgOff;}
  return c;}
function desc(c){if(prod.id==='coldread')return (c.label||'Cold Reads')+` (${T.products.find(p=>p.id==='coldread').parse(c.text).length} passages)`;return prod.id==='mystery'?`${c.image.name} — ${c.label||labelFor()}`:(c.label||labelFor())+(prod.id==='bingo'?` (${c.opts.boards} boards, ${c.opts.size}x${c.opts.size})`:'');}
function preview(pages){const pv=$('preview');pv.innerHTML='';const N=Math.min(pages.length,24);for(let i=0;i<N;i++){const c=document.createElement('canvas');T.drawCanvas(pages[i],c,110);pv.appendChild(c);}
  $('status').textContent=`${pages.length} pages`+(pages.length>N?` (showing the first ${N})`:'')+(showBundle?' · bundle preview':'');}
function build(){if(!sel.length&&!(prod.id==='mystery'&&kind==='reading')&&prod.id!=='coldread')return;
  const c=cfg();if(prod.needs){const nd=prod.needs(c,seed).filter(w=>(window.IMAGE_MAP||{})[w]&&!T.icons[w]);if(nd.length){window.APP&&(APP.loading=true);T.loadIcons(nd).then(()=>{window.APP&&(APP.loading=false);build();});return;}}cur=T.assemble(prod,[{cfg:c,seed}]);cur.fileBase=T.fileName(prod,cur.secs);
  $('info').innerHTML=cur.secs[0].info||'';showBundle=false;picks=[];renderPicker('');preview(cur.pages);}
function renderBundle(){const b=bundle();$('bundle').innerHTML=b.map((x,i)=>`<li>${x.desc}<button data-i="${i}">✕</button></li>`).join('');
  $('bundle').querySelectorAll('button').forEach(e=>e.onclick=()=>{b.splice(+e.dataset.i,1);renderBundle();});
  ['bzip','blist','showBundle'].forEach(id=>$(id).disabled=b.length<1);
  $('bundleTitle').placeholder=BUNDLE.suggestTitle(b.map(prodOf))||'Type your bundle title';
  $('bundleWarn').textContent='';
  bpicks=[];renderPicker('b');}
function bundleDoc(){const b=bundle();if(!b.length)return null;const sets=b.map(x=>({prod:prodOf(x),cfg:x.cfg,seed:x.seed}));
  return BUNDLE.assemble(sets,$('bundleTitle').value);}
// ---------- listing images: choose the pages to screen-grab (single product: "" ; bundle: "b")
function pickState(w){return w==='b'?bpicks:picks;}
function pickDoc(w){return w==='b'?bundleDoc():cur;}
function pickedPages(w,doc){doc=doc||pickDoc(w);return doc?pickState(w).map(i=>doc.pages[i]).filter(Boolean):[];}
function pickBadges(w){const arr=pickState(w);document.querySelectorAll(`#${w}pickPages .pg`).forEach(d=>{const k=arr.indexOf(+d.dataset.page);d.classList.toggle('on',k>=0);let i=d.querySelector('i');
  if(k>=0){if(!i){i=document.createElement('i');d.appendChild(i);}i.textContent=k+1;}else if(i)i.remove();});
  $(w+'pickInfo').textContent=arr.length?`${arr.length} page${arr.length>1?'s':''} picked (up to 9). The first two go on the cover image.`:'None picked: I will choose good pages for you.';}
function renderPicker(w){const det=$(w+'pickDet'),box=$(w+'pickPages');if(!det||!det.open){pickBadges(w);return;}box.innerHTML='';const doc=pickDoc(w);if(!doc){pickBadges(w);return;}
  const arr=pickState(w),n=doc.pages.length-1; let g=null,gi=-1;
  const groups=doc.sets?doc.sets.map((s,i)=>({t:`${i+1}. ${s.prod.title}${s.sec.label?' - '+s.sec.label:''}`,from:s.from,to:s.to})):[{t:'Pages',from:0,to:n}];
  for(const grp of groups){const wrap=document.createElement('div');wrap.className='pset';const t=document.createElement('b');t.textContent=grp.t;const gr=document.createElement('div');gr.className='pgrid';wrap.append(t,gr);box.appendChild(wrap);
    for(let pi=grp.from;pi<Math.min(grp.to,n);pi++){const d=document.createElement('div');d.className='pg';d.dataset.page=pi;d.title='Page '+(pi+1);const cv=document.createElement('canvas');T.drawCanvas(doc.pages[pi],cv,30);d.appendChild(cv);
      d.onclick=()=>{const k=arr.indexOf(pi);if(k>=0)arr.splice(k,1);else if(arr.length<9)arr.push(pi);else{$(w+'pickInfo').textContent='That is the most you can pick (9). Click a picked page to remove it.';return;}pickBadges(w);};gr.appendChild(d);}}
  pickBadges(w);}
async function busy(btn,txt,fn){const o=btn.textContent;btn.disabled=true;btn.textContent=txt;try{await fn();}catch(e){console.error(e);$('status').textContent=e.message;}finally{btn.textContent=o;btn.disabled=false;if(btn.id!=='dllist'&&btn.id!=='dlpdf'&&btn.id!=='dlpptx')btn.disabled=bundle().length<1;}}
function listingOpts(){return {grade:$('lsGrade').value.trim(),theme:$('lsTheme').value};}
function renderAll(){renderProducts();const my=prod.id==='mystery';$('mysterySec').hidden=!my;$('optSec').hidden=prod.id!=='bingo';$('wsOpt').hidden=prod.id!=='wordsort';$('mazeOpt').hidden=prod.id!=='wordmaze';$('pwOpt').hidden=prod.id!=='picturewrite';$('rdOpt').hidden=prod.id!=='readdraw';wwShow();const cr=prod.id==='coldread';$('crSec').hidden=!cr;if(cr&&!$('crText').value.trim())$('crText').value=prod.sample;if(cr)crSlots();$('skillSec').hidden=cr||!!prod.noSkill;$('shuffle').hidden=cr;
  $('label').value=labelFor();if(!cr)renderSkills();renderBundle();if(my){if(!MY.name){$('theme').value='Animals';pickImage('Animals','bear');}else defaultAssignNew();renderThumbs();renderMystery();}else build();}
// ---------- events
$('label').onchange=build;['boards','size','same','cards','wsCut','wsWrite','mazeSize','rdPages','wwPages','wwBoxes','wwLines','wwPer'].forEach(id=>$(id).onchange=build);
let crT;$('crText').oninput=()=>{clearTimeout(crT);crT=setTimeout(()=>{crSlots();build();},400);};$('crName').onchange=build;$('pwBank').onchange=build;$('dllist').onclick=()=>cur&&busy($('dllist'),'Building…',async()=>{await LISTING.zip({prod,prods:[prod],doc:cur,skills:BUNDLE.skillsOf(cur.secs.map(s=>s.label)),picks:pickedPages('',cur),isBundle:false,nSets:cur.secs.length,opts:listingOpts()},cur.fileBase);});$('crSample').onclick=()=>{$('crText').value=T.products.find(p=>p.id==='coldread').sample;crSlots();build();};
$('shuffle').onclick=()=>{seed=(seed*7919+13)%1000003;build();};
$('dlpdf').onclick=()=>cur&&T.pdf(cur.pages,cur.fileBase);
$('dlpptx').onclick=()=>cur&&T.pptx(cur.pages,cur.fileBase);
$('addSet').onclick=()=>{const c=cfg();
  bundle().push({id:++setId,pid:prod.id,cfg:c,seed,desc:prod.name+' - '+desc(c)});seed=(seed*7919+13)%1000003;renderBundle();build();};
$('clearBundle').onclick=()=>{bundle().length=0;titleTouched=false;renderBundle();build();};
$('bundleTitle').oninput=()=>{titleTouched=$('bundleTitle').value.trim()!=='';bpicks=[];renderPicker('b');};
$('pickClear').onclick=()=>{picks=[];pickBadges('');};$('bpickClear').onclick=()=>{bpicks=[];pickBadges('b');};
$('pickDet').ontoggle=()=>renderPicker('');$('bpickDet').ontoggle=()=>renderPicker('b');
$('showBundle').onclick=()=>{const d=bundleDoc();if(!d)return;showBundle=true;preview(d.pages);};
$('bzip').onclick=()=>busy($('bzip'),'Building files…',async()=>{const d=bundleDoc();BUNDLE.saveBlob(await BUNDLE.buildZip(d),d.fileBase+'.zip');});
$('blist').onclick=()=>busy($('blist'),'Building…',async()=>{const d=bundleDoc();await LISTING.zip({prod:d.sets[0].prod,prods:d.sets.map(x=>x.prod),doc:d,skills:d.skills,title:d.title,picks:pickedPages('b',d),isBundle:true,nSets:d.sets.length,opts:listingOpts()},d.fileBase);});
$('bgOff').onchange=()=>{MY.bgOff=$('bgOff').checked;renderColors();build();};
$('theme').innerHTML=Object.keys(PIXELS.themes).map(t=>`<option>${t}</option>`).join('');$('theme').onchange=renderThumbs;
await T.init();defaultSkill();renderAll();
// ---------- test hooks
window.APP={loading:false,T,MY,setTricky(t){$('twText').value=t;twChips();build();return cur.secs[0].info;},skillNames(){return skillsFor(kind).map(s=>s.name);},get cur(){return cur;},
  product(id,k){$('products').querySelectorAll('button')[T.products.findIndex(p=>p.id===id)].click();if(k&&k!==kind){[...$('kinds').children].find(b=>b.textContent.toLowerCase()===k).click();}return prod.id+'/'+kind;},
  select(names){names=[].concat(names);sel=names.map(n=>skillsFor(kind).find(s=>s.name===n));if(prod.id==='mystery')defaultAssign();$('label').value=labelFor();renderSkills();if(prod.id==='mystery')renderColors();build();return cur.secs[0].info;},
  addSet(){$('addSet').click();return bundle().length;},bundleDoc,get picks(){return picks;},get bpicks(){return bpicks;},pickedPages,renderPicker,listingOpts,pickImage(t,n){pickImage(t,n);renderThumbs();renderMystery();},
  paintAt(i,j,ch){MY.brush=ch;MY.undo.push(MY.rows.slice());paint(i,j);defaultAssignNew();renderColors();drawEditor();build();},
  undo(){$('undo').click();},recolor(ch,hex,name){MY.colors[ch].hex=hex;if(name)MY.colors[ch].name=name;renderColors();drawEditor();build();},
  bgOff(v){$('bgOff').checked=v;$('bgOff').onchange();},
  assign(ch,v){MY.assign[ch]=kind==='math'?v:READ.find(s=>s.name===v);renderColors();build();}};
// Cold Read pictures: one optional picture per passage, keyed by passage title
var CR_PICS={};
function crTitles(t){const p=T.products.find(p=>p.id==='coldread');try{return p.parse(t||'').map((P,i)=>P.title||('Passage '+(i+1)));}catch(e){return[];}}
function crPicMap(t){const m={};crTitles(t).forEach((k,i)=>{if(CR_PICS[k])m[i]=CR_PICS[k];});return m;}
function crLoadImage(file,key){if(!file||!/^image\//.test(file.type))return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1200/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);const src=c.toDataURL('image/png');const o=new Image();o.onload=()=>{CR_PICS[key]={src,img:o,w:c.width,h:c.height};crSlots();build();};o.src=src;};im.src=r.result;};r.readAsDataURL(file);}
function crSlots(){const box=$('crPics');if(!box)return;box.innerHTML='';crTitles($('crText').value).forEach(key=>{const d=document.createElement('div');d.className='crPic';d.style.cssText='width:150px;border:1px solid #bbb;border-radius:8px;padding:6px;font-size:12px;background:#fff';
const t=document.createElement('div');t.textContent=key;t.style.cssText='font-weight:bold;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';d.appendChild(t);
const z=document.createElement('div');z.contentEditable='true';z.tabIndex=0;z.setAttribute('aria-label','Paste or drop a picture for '+key);z.style.cssText='height:80px;border:1px dashed #999;border-radius:6px;display:flex;align-items:center;justify-content:center;text-align:center;color:#777;overflow:hidden;caret-color:transparent';
const pic=CR_PICS[key];if(pic){const im=document.createElement('img');im.src=pic.src;im.style.cssText='max-width:100%;max-height:100%';z.appendChild(im);}else z.textContent='Paste or drop here';
z.addEventListener('beforeinput',e=>{if(e.inputType!=='insertFromPaste')e.preventDefault();});
z.addEventListener('paste',e=>{e.preventDefault();const it=[...(e.clipboardData||{}).items||[]].find(i=>i.type.startsWith('image/'));if(it)crLoadImage(it.getAsFile(),key);});
z.addEventListener('dragover',e=>{e.preventDefault();z.style.borderColor='#000';});z.addEventListener('dragleave',()=>z.style.borderColor='#999');
z.addEventListener('drop',e=>{e.preventDefault();const f=[...e.dataTransfer.files].find(f=>f.type.startsWith('image/'));if(f)crLoadImage(f,key);});d.appendChild(z);
const row=document.createElement('div');row.style.cssText='display:flex;gap:4px;margin-top:4px';
const up=document.createElement('label');up.textContent='Upload';up.style.cssText='flex:1;text-align:center;border:1px solid #888;border-radius:6px;padding:3px;cursor:pointer';const fi=document.createElement('input');fi.type='file';fi.accept='image/*';fi.hidden=true;fi.onchange=()=>crLoadImage(fi.files[0],key);up.appendChild(fi);row.appendChild(up);
if(pic){const rm=document.createElement('button');rm.textContent='Remove';rm.style.cssText='flex:1;font-size:12px';rm.onclick=()=>{delete CR_PICS[key];crSlots();build();};row.appendChild(rm);}
d.appendChild(row);box.appendChild(d);});}
APP.crPics=CR_PICS;APP.crSlots=crSlots;APP.crLoadImage=crLoadImage;
})();
