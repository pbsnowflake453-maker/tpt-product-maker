(async function(){
const T=TPT, $=id=>document.getElementById(id);
const READ=SKILLS, MATHS=MATH.skills;
let prod=T.products[0], kind='reading', sel=[], seed=Date.now()%100000, cur=null, showBundle=false;
const bundles={}; // per product id: [{cfg,seed,desc}]
// ---------- mystery state
const MY={theme:null,name:null,rows:[],orig:[],colors:{},assign:{},undo:[],brush:null};
const PAL=PIXELS.palette, MP=()=>T.products.find(p=>p.id==='mystery');
const DEFAULT_READ=['sh','ch','th (unvoiced, as in thin)','wh','ck','ng','nk','qu','tch','ff','ll','ss'];
function skillsFor(k){return k==='math'?MATHS:READ;}
function bundle(){return bundles[prod.id]||(bundles[prod.id]=[]);}
// ---------- product + kind
function renderProducts(){$('products').innerHTML='';for(const p of T.products){const b=document.createElement('button');b.textContent=p.name;b.className=p===prod?'on':'';
  b.onclick=()=>{if(p===prod)return;prod=p;if(!p.kinds.includes(kind))kind=p.kinds[0];sel=[];defaultSkill();renderAll();};$('products').appendChild(b);}
  $('kinds').innerHTML='';if(prod.kinds.length>1)for(const k of prod.kinds){const b=document.createElement('button');b.textContent=k==='math'?'Math':'Reading';b.className=k===kind?'on':'';
    b.onclick=()=>{if(k===kind)return;kind=k;sel=[];defaultSkill();if(prod.id==='mystery')defaultAssign();renderAll();};$('kinds').appendChild(b);}}
function defaultSkill(){const L=skillsFor(kind);sel=[kind==='math'?(L.find(s=>s.name==='Making 10')):(L.find(s=>s.name.startsWith('ou (')))];}
function labelFor(){if(prod.id==='mystery'&&kind==='reading')return MY.rows.length?[...new Set(MP().colorsByCount(MY.rows).filter(([c])=>!(MY.bgOff&&c==='.')).map(([c])=>T.readLabel(MY.assign[c])))].join(' • '):'';
  return sel.map(s=>kind==='math'?s.label:T.readLabel(s)).join(' • ');}
// ---------- skills list
let mainPick=null;
function renderSkills(){const myRead=prod.id==='mystery'&&kind==='reading';$('skillSec').hidden=myRead;
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
// ---------- config + build
function cfg(){const c={kind,skills:sel.slice(),label:\( ('label').value.trim(),opts:{boards:Math.max(1,Math.min(40,+ \)('boards').value||1)),size:+\( ('size').value,same: \)('same').checked,cards:\( ('cards').checked,cut: \)('wsCut')&&$('wsCut').checked}};
  if(prod.id==='mystery'){const order=MP().colorsByCount(MY.rows).map(x=>x[0]);c.image={name:MY.name,rows:MY.rows.slice()};c.colors=JSON.parse(JSON.stringify(MY.colors));c.assign=Object.fromEntries(order.map(k=>[k,MY.assign[k]]));c.bgOff=MY.bgOff;}
  return c;}
function desc(c){return prod.id==='mystery'?`${c.image.name} — \( {c.label||labelFor()}`:(c.label||labelFor())+(prod.id==='bingo'?` ( \){c.opts.boards} boards, \( {c.opts.size}x \){c.opts.size})`:'');}
function preview(pages){const pv=$('preview');pv.innerHTML='';const N=Math.min(pages.length,24);for(let i=0;i<N;i++){const c=document.createElement('canvas');T.drawCanvas(pages[i],c,110);pv.appendChild(c);}
  \( ('status').textContent=` \){pages.length} pages`+(pages.length>N?` (showing the first ${N})`:'')+(showBundle?' · bundle preview':'');}
function build(){if(!sel.length&&!(prod.id==='mystery'&&kind==='reading'))return;
  const c=cfg();cur=T.assemble(prod,[{cfg:c,seed}]);cur.fileBase=T.fileName(prod,cur.secs);
  $('info').innerHTML=cur.secs[0].info||'';showBundle=false;preview(cur.pages);}
function renderBundle(){const b=bundle();\( ('bundle').innerHTML=b.map((x,i)=>`<li> \){x.desc}<button data-i="${i}">✕</button></li>`).join('');
  $('bundle').querySelectorAll('button').forEach(e=>e.onclick=()=>{b.splice(+e.dataset.i,1);renderBundle();});
  ['bpptx','bpdf','showBundle'].forEach(id=>$(id).disabled=b.length<1);}
function bundleDoc(){const b=bundle();const d=T.assemble(prod,b);d.fileBase=T.fileName(prod,d.secs);return d;}
function renderAll(){renderProducts();const my=prod.id==='mystery';\( ('mysterySec').hidden=!my; \)('optSec').hidden=prod.id!=='bingo';$('wsOpt').hidden=prod.id!=='wordsort';
  \( ('label').value=labelFor();renderSkills();renderBundle();if(my){if(!MY.name){ \)('theme').value='Animals';pickImage('Animals','bear');}else defaultAssignNew();renderThumbs();renderMystery();}else build();}
// ---------- events
\( ('label').onchange=build;['boards','size','same','cards','wsCut','wsWrite'].forEach(id=> \)(id).onchange=build);
$('shuffle').onclick=()=>{seed=(seed*7919+13)%1000003;build();};
$('dlpdf').onclick=()=>cur&&T.pdf(cur.pages,cur.fileBase);
$('dlpptx').onclick=()=>cur&&T.pptx(cur.pages,cur.fileBase);
$('addSet').onclick=()=>{const c=cfg();bundle().push({cfg:c,seed,desc:desc(c)});seed=(seed*7919+13)%1000003;renderBundle();build();};
$('clearBundle').onclick=()=>{bundle().length=0;renderBundle();build();};
$('showBundle').onclick=()=>{const d=bundleDoc();showBundle=true;preview(d.pages);};
$('bpdf').onclick=()=>{const d=bundleDoc();T.pdf(d.pages,d.fileBase);};
$('bpptx').onclick=()=>{const d=bundleDoc();T.pptx(d.pages,d.fileBase);};
$('bgOff').onchange=()=>{MY.bgOff=$('bgOff').checked;renderColors();build();};
$('theme').innerHTML=Object.keys(PIXELS.themes).map(t=>`<option>${t}</option>`).join('');$('theme').onchange=renderThumbs;
await T.init();defaultSkill();renderAll();
// ---------- test hooks
window.APP={T,MY,get cur(){return cur;},
  product(id,k){$('products').querySelectorAll('button')[T.products.findIndex(p=>p.id===id)].click();if(k&&k!==kind){[...$('kinds').children].find(b=>b.textContent.toLowerCase()===k).click();}return prod.id+'/'+kind;},
  select(names){names=[].concat(names);sel=names.map(n=>skillsFor(kind).find(s=>s.name===n));if(prod.id==='mystery')defaultAssign();$('label').value=labelFor();renderSkills();if(prod.id==='mystery')renderColors();build();return cur.secs[0].info;},
  addSet(){$('addSet').click();return bundle().length;},bundleDoc,pickImage(t,n){pickImage(t,n);renderThumbs();renderMystery();},
  paintAt(i,j,ch){MY.brush=ch;MY.undo.push(MY.rows.slice());paint(i,j);defaultAssignNew();renderColors();drawEditor();build();},
  undo(){$('undo').click();},recolor(ch,hex,name){MY.colors[ch].hex=hex;if(name)MY.colors[ch].name=name;renderColors();drawEditor();build();},
  bgOff(v){$('bgOff').checked=v;$('bgOff').onchange();},
  assign(ch,v){MY.assign[ch]=kind==='math'?v:READ.find(s=>s.name===v);renderColors();build();}};
})();
