// Word-work pages (Read and Draw words, Count the Sounds, tricky-word pages, and the two pair pages). Needs the site served on BASE.
//   (cd site && python3 -m http.server 8812) &   node tests/wordwork.js
const {open,OUT}=require('./lib'); const cp=require('child_process');
let fails=0,passes=0; const ok=(c,m)=>{if(c){passes++;}else{fails++;console.log('FAIL:',m);}};
const sh=c=>cp.spawnSync('bash',['-c',c],{cwd:__dirname+'/..',encoding:'utf8'});
(async()=>{
 let r=sh('python3 spec/build_wordinfo.py'); ok(r.status===0,'build_wordinfo.py exit '+r.status+' '+r.stderr);
 const {b,pg,errs}=await open();
 const IDS=['wwdraw','wwsounds','wwphonics','wwshapes','wwmissing','wwtricky'];
 ok(await pg.evaluate(ids=>ids.every(id=>TPT.products.some(p=>p.id===id&&p.orient==='P')),IDS),'six word-work products registered, all portrait');
 // words on the student pages of the current document (Andika text that is a plain lowercase word)
 const words=()=>pg.evaluate(()=>APP.cur.pages.slice(2,-1).map(p=>p.items.filter(i=>i.t==='text'&&i.font==='Andika'&&/^[A-Za-z]+$/.test(i.text)).map(i=>i.text)));

 // ---- phonics products: every skill they offer builds; words come from the right lists
 for(const [id,minWords] of [['wwdraw',9],['wwsounds',10],['wwphonics',12]]){
   const names=await pg.evaluate(id=>{APP.product(id,'reading');return APP.skillNames();},id); ok(names.length>20,id+' offers skills ('+names.length+')');
   const bad=[];
   for(const n of names){const res=await pg.evaluate(([id,n])=>{try{APP.product(id,'reading');APP.select(n);const c=APP.cur,s=c.secs[0];
       const txt=c.pages.flatMap(p=>p.items.filter(i=>i.t==='text').map(i=>i.text)).join(' ');
       return {n:c.pages.length,words:s.words,badText:/undefined|NaN|\[object/.test(txt)};}catch(e){return {err:e.message};}},[id,n]);
     if(res.err||res.n<4||res.badText||res.words<minWords) bad.push(n+':'+(res.err||(res.badText?'badText':res.n+' pages/'+res.words+' words')));}
   ok(bad.length===0,`${id}: every skill it offers builds at least one page; problems: ${bad.slice(0,6).join(' | ')}`);}
 // drawable / countable / not blocked
 const lists=await pg.evaluate(()=>{const I=WORDINFO,D=new Set(I.drawable.split(' ')),C=new Set(I.countable.split(' '));return {d:[...D].length,c:[...C].length};});
 ok(lists.d>2000&&lists.c>2000,'word lists loaded '+JSON.stringify(lists));
 for(const [id,key] of [['wwdraw','drawable'],['wwsounds','countable']]){
   const res=await pg.evaluate(([id,key])=>{const S=new Set(WORDINFO[key].split(' ')),B=new Set('hell damn sex butt kill gun dick cock tit nude rape'.split(' '));const out={bad:[],dups:0,n:0};
     for(const u of ['Unit 1','Unit 4','Through Unit 7']){APP.product(id,'reading');APP.select(u);const w=APP.cur.pages.slice(2,-1).flatMap(p=>p.items.filter(i=>i.t==='text'&&i.font==='Andika'&&/^[a-z]+$/.test(i.text)).map(i=>i.text));
       out.n+=w.length;out.dups+=w.length-new Set(w).size;out.bad.push(...w.filter(x=>!S.has(x)||B.has(x)));}return out;},[id,key]);
   ok(res.n>=72&&res.bad.length===0&&res.dups===0,`${id}: ${res.n} words, all ${key}, no repeats, none blocked; bad ${res.bad.slice(0,5)} dups ${res.dups}`);}
 // boxes / lines per page
 for(const n of [9,10,12]){const w=await pg.evaluate(n=>{APP.product('wwdraw','reading');APP.select('Unit 4');const e=document.getElementById('wwBoxes');e.value=String(n);e.onchange();return APP.cur.pages.slice(2,-1).map(p=>p.items.filter(i=>i.t==='rect'&&i.r>0&&i.h>0.9&&i.h<5).length);},n); ok(w.length===2&&w.every(x=>x===n),`Read and Draw ${n} boxes per page: ${w}`);}
 for(const n of [10,11,12]){const w=await pg.evaluate(n=>{APP.product('wwsounds','reading');APP.select('Unit 4');const e=document.getElementById('wwLines');e.value=String(n);e.onchange();return APP.cur.pages.slice(2,-1).map(p=>p.items.filter(i=>i.t==='rect'&&i.w>2.4&&i.w<2.8).length);},n); ok(w.length===2&&w.every(x=>x===n),`Count the Sounds ${n} lines per page: ${w}`);}
 // pages option + pool too small
 const pn=await pg.evaluate(()=>{APP.product('wwdraw','reading');APP.select('Unit 4');const e=document.getElementById('wwPages');e.value='4';e.onchange();const a=APP.cur.pages.length;e.value='2';e.onchange();return a;}); ok(pn===7,'4 pages -> 7 total ('+pn+')');
 // pair page: 6 + 6 with no word twice on a page
 const pair=await pg.evaluate(()=>{APP.product('wwphonics','reading');APP.select('Unit 5');return APP.cur.pages.slice(2,-1).map(p=>{const w=p.items.filter(i=>i.t==='text'&&i.font==='Andika'&&/^[a-z]+$/.test(i.text)).map(i=>i.text);return {n:w.length,u:new Set(w).size};});});
 ok(pair.length===2&&pair.every(x=>x.n===12&&x.u===12),'Phonics pair page: 12 distinct words per page '+JSON.stringify(pair));

 // ---- tricky pages
 const ALL=await pg.evaluate(()=>WORDINFO.tricky.map(x=>x[0]).filter(w=>w.length>1).join(' '));
 for(const id of ['wwshapes','wwmissing','wwtricky']){
   const res=await pg.evaluate(([id,all])=>{APP.product(id,'reading');const info=APP.setTricky(all);const pages=APP.cur.pages.slice(2,-1);
     return {info,n:pages.length,hidden:document.getElementById('skillSec').hidden,label:document.getElementById('label').value,twShown:!document.getElementById('twSec').hidden};},[id,ALL]);
   ok(res.n>=3&&res.hidden&&res.label==='Tricky Words'&&res.twShown,`${id}: builds from the picked words, skill picker hidden, label "Tricky Words" (${res.n} pages)`);}
 // the rules the page builder must keep, on every page it makes from all 52 tricky words
 const rules=await pg.evaluate(all=>{const K=TPT.tricky, W=all.split(' '), out={shapes:true,ml:true,left:0,pages:0,pairA:true,pairB:true};
   for(const per of [4,6,8]){
     let r=K.pack(W,per,()=> 'A',(k,s,w)=>K.okShapes(s,w)); r.slots.filter(s=>s.length).forEach(s=>{out.pages++; if(new Set(s.map(K.shapeOf)).size!==s.length||s.length>per) out.shapes=false;});
     r=K.pack(W,per,()=>'B',(k,s,w)=>K.okMissing(s,w)); r.slots.filter(s=>s.length).forEach(s=>{out.pages++; if(!K.mlPatterns(s)||s.length>per) out.ml=false;}); out.left+=r.left.length;}
   const pr=K.pack(W.concat(['I','a']),4,i=>i%2?'B':'A',(k,s,w)=>k==='B'?K.okMissing(s,w):K.okShapes(s,w));
   pr.slots.forEach((s,i)=>{if(i%2){if(s.length&&(!K.mlPatterns(s)||s.some(w=>w.length<2))) out.pairB=false;} else if(new Set(s.map(K.shapeOf)).size!==s.length) out.pairA=false;});
   out.all=pr.slots.flat().length+pr.left.length; out.want=W.length+2; return out;},ALL);
 ok(rules.shapes,'words on one Letter Shapes page never share a shape (4, 6, 8 per page)');
 ok(rules.ml&&rules.left===0,'every Missing Letters page has a blank pattern that fits only one word ('+rules.left+' left out)');
 ok(rules.pairA&&rules.pairB&&rules.all===rules.want,'tricky pair page follows the same rules; one-letter words only go on shapes: '+JSON.stringify(rules));
 // letter shapes: tall / hanging / small boxes
 const sh1=await pg.evaluate(()=>{const K=TPT.tricky;return [K.shapeOf('the'),K.shapeOf('yes'),K.shapeOf('I'),K.shapeOf('a'),K.shapeOf('big')];}); ok(sh1.join()==='TTS,HSS,T,S,TSH','shape letters: '+sh1);
 // two letters stay visible; the irregular letters are the ones blanked
 const ml=await pg.evaluate(()=>{const K=TPT.tricky;return [K.mlPatterns(['some','from','said','they']),K.mlPatterns(['no','so'])];});
 ok(JSON.stringify(ml[0].some)==='[1,3]'&&ml[0].some.length===2,'"some" blanks the o and the e: '+JSON.stringify(ml[0].some));
 ok(Object.values(ml[0]).every(S=>S.length>=1)&&ml[1].no.length===1&&ml[1].so.length===1,'two-letter words keep one letter');
 ok(await pg.evaluate(()=>TPT.tricky.mlPatterns(['no','so','of'])!==null&&TPT.tricky.mlPatterns(['at','it','ad'])===null),'no pattern when two words are identical');
 // typed words: letters only, no repeats, one letter I
 const ty=await pg.evaluate(()=>{const p=TPT.tricky.parseWords("Said, said  don't i  THEY 123 a");return p;}); ok(ty.words.join()==='said,I,they,a'&&ty.skipped.join()==="don't,123",'typed words cleaned: '+JSON.stringify(ty));
 const info=await pg.evaluate(()=>{APP.product('wwmissing','reading');return APP.setTricky("said they don't I a");}); ok(/Left out/.test(info)&&/don't/.test(info),'typed words that cannot be used are listed: '+info);
 const emp=await pg.evaluate(()=>{APP.product('wwshapes','reading');return APP.setTricky('');}); ok(/at least one/.test(emp),'empty list shows a message');
 // picker buttons toggle words
 await pg.evaluate(()=>{APP.product('wwshapes','reading');APP.setTricky('said');});
 await pg.click('#twChips button:has-text("they")'); ok(await pg.inputValue('#twText')==='said they','clicking a word adds it');
 await pg.click('#twChips button:has-text("said")'); ok(await pg.inputValue('#twText')==='they','clicking again removes it');
 await pg.click('#twAll'); ok((await pg.inputValue('#twText')).split(' ').length>40,'Select all'); await pg.click('#twNone'); ok(await pg.inputValue('#twText')==='','Clear');

 // ---- cover, directions, terms on every product; no theme colors / table styles in the PPTX
 for(const id of IDS){
   const res=await pg.evaluate(id=>{APP.product(id,'reading');if(!document.getElementById('twSec').hidden)APP.setTricky('said they were some');else APP.select('Unit 4');const c=APP.cur,t=p=>p.items.filter(i=>i.t==='text').map(i=>i.text).join(' ');
     return {cover:t(c.pages[0]),how:t(c.pages[1]),terms:t(c.pages[c.pages.length-1]),key:c.pages.some(p=>/answer key/i.test(t(p)))};},id);
   ok(/Skill/.test(res.cover)&&/How to Use/.test(res.how)&&/Terms of Use/.test(res.terms)&&!res.key,`${id}: cover, how-to, Terms; no answer key`);
   const px=await pg.evaluate(async()=>await APP.T.pptxDoc(APP.cur.pages,'t').write({outputType:'base64'}));
   require('fs').writeFileSync(OUT+'ww-'+id+'.pptx',Buffer.from(px,'base64'));
   const x=sh(`rm -rf ${OUT}wwx && mkdir -p ${OUT}wwx && unzip -oq ${OUT}ww-${id}.pptx -d ${OUT}wwx && grep -rlE "schemeClr|tableStyleId" ${OUT}wwx/ppt/slides | wc -l`).stdout.trim();
   ok(x==='0',`${id}: no theme colors or table styles in the PPTX (${x})`);}
 // black, white and gray only on the pages
 const col=await pg.evaluate(ids=>{const bad=new Set();for(const id of ids){APP.product(id,'reading');if(!document.getElementById('twSec').hidden)APP.setTricky('said they were some');else APP.select('Unit 4');
   for(const p of APP.cur.pages.slice(2,-1)) for(const i of p.items) for(const k of ['line','fill','color']) if(i[k]&&!(/^[0-9A-F]{6}$/i.test(i[k])&&i[k].slice(0,2)===i[k].slice(2,4)&&i[k].slice(2,4)===i[k].slice(4,6))) bad.add(id+':'+k+':'+i[k]);}return [...bad];},IDS);
 ok(col.length===0,'student pages use only black, white and gray: '+col.slice(0,5));
 // bundle: a word-work set sits next to an older product
 const bd=await pg.evaluate(()=>{document.getElementById('clearBundle').click();APP.product('wwdraw','reading');APP.select('Unit 2');APP.addSet();APP.product('wwmissing','reading');APP.setTricky('said they were some');APP.addSet();APP.product('wwtricky','reading');APP.addSet();const d=APP.bundleDoc();return {names:d.files.map(f=>f.name),pages:d.pages.length};});
 ok(bd.names.length===4&&/^02 Read and Draw Words - Unit 2/.test(bd.names[1])&&/^03 Tricky Words Missing Letters - Tricky Words/.test(bd.names[2]),'bundle file names: '+bd.names.join(' | '));
 ok(errs.filter(e=>!/favicon/.test(e)).length===0,'no page/console errors: '+errs.slice(0,3).join(' || '));
 await b.close(); console.log(`\n${passes} passed, ${fails} failed`); process.exit(fails?1:0);
})();
