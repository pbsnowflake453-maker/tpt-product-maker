// Main regression suite (hermetic). Needs the site served on BASE (default http://127.0.0.1:8812) -> node tests/suite.js
const {open,OUT}=require('./lib'); const fs=require('fs'); const cp=require('child_process');
let fails=0,passes=0; const ok=(c,m)=>{if(c){passes++;}else{fails++;console.log('FAIL:',m);}};
(async()=>{
 // ---- data pipeline (python)
 const sh=(c)=>cp.spawnSync('bash',['-c',c],{cwd:__dirname+'/..',encoding:'utf8'});
 let r=sh('python3 spec/build_from_megabank.py'); ok(r.status===0,'build_from_megabank.py exit '+r.status+' '+r.stderr);
 r=sh('python3 spec/build_sentences.py'); ok(r.status===0&&/violations 0\b/i.test(r.stdout+r.stderr),'build_sentences.py: '+(r.stdout+r.stderr).slice(-300));
 r=sh('git diff --quiet -- site/data/skills.js site/data/sentences.js; echo $?'); // informational: regenerated files match the committed ones
 const {b,pg,errs}=await open();
 const R=await pg.evaluate(()=>({skills:SKILLS.map(s=>s.name),sent:window.SENTENCES.length,
   units:[1,2,3,4,5,6,7].map(u=>SENTENCES.filter(s=>s.u===u).length),prods:TPT.products.map(p=>p.id)}));
 // ---- data shape
 ok(R.skills.every(n=>!/^(K |G2|G1|Dolch|Fry)/.test(n)),'no K/G1/G2/Dolch/Fry skill names remain');
 ok(R.skills.includes('Unit 1')&&R.skills.includes('Through Unit 7')&&!R.skills.includes('Unit 8')&&!R.skills.includes('Through Unit 8'),'Unit 1-7 + Through Unit 1-7 only');
 ok(new Set(R.skills).size===R.skills.length,'unique skill names');
 ok(R.units.every(n=>n>=70),'>=70 sentences per unit: '+R.units);
 ok(R.prods.includes('readdraw'),'readdraw registered');
 // ---- every product x every skill builds
 const READING=['rollread','bingo','mystery','wordsort','wordmaze','picturewrite','readdraw'];
 for(const id of ['rollread','bingo','wordsort','wordmaze','picturewrite','readdraw']){
   const names=await pg.evaluate(id=>{APP.product(id,'reading');return APP.skillNames();},id); ok(names.length>0,id+' has skills');
   let bad=[];
   for(const n of names){ const res=await pg.evaluate(([id,n])=>{try{APP.product(id,'reading');APP.select(n);const c=APP.cur;
       const txt=c.pages.flatMap(p=>p.items.filter(i=>i.t==='text').map(i=>i.text)).join(' ');
       return {n:c.pages.length,badText:/undefined|NaN|\[object/.test(txt)};}catch(e){return {err:e.message};}},[id,n]);
     if(res.err||!res.n||res.badText) bad.push(n+':'+(res.err||(res.badText?'badText':'0 pages'))); }
   ok(bad.length===0,`${id}: ${names.length} skills build; problems: ${bad.slice(0,6).join(' | ')}`);
 }
 // mystery (reading default assign), coldread (sample text), math products untouched
 for(const [id,k] of [['mystery','reading'],['mystery','math'],['rollsolve','math'],['taskcards','math'],['bingo','math']]){
   const n=await pg.evaluate(([id,k])=>{APP.product(id,k);return APP.cur.pages.length;},[id,k]); ok(n>0,`${id}/${k} builds (${n} pages)`); }
 // ---- Read and Draw specifics
 const rd=await pg.evaluate(()=>{APP.product('readdraw','reading');APP.select('Unit 3');const c=APP.cur;
   const std=c.pages.filter(p=>p.items.filter(i=>i.t==='text'&&/^[1-9]\d?$/.test(i.text.trim())||0).length>=6||p.items.filter(i=>i.t==='oval').length>=6);
   const body=c.pages.map(p=>p.items.filter(i=>i.t==='text').map(i=>i.text));
   const sentences=body.flat().filter(t=>/[.?!]$/.test(t)&&t.split(' ').length>=3&&t.split(' ').length<=11&&/^[A-Z]/.test(t)&&!/Skill|Name/.test(t));
   return {pages:c.pages.length,orient:c.pages[0].w<c.pages[0].h?'P':'L',std:std.length,sentences:sentences.length,boxes:c.pages.map(p=>p.items.filter(i=>i.t==='rect'&&i.r>0).length)};});
 ok(rd.orient==='P','Read and Draw is portrait');
 ok(rd.pages>=4,'Read and Draw U3 has cover+directions+pages+terms ('+rd.pages+')');
 ok(rd.boxes.some(n=>n>=6),'a page has >=6 rounded drawing boxes '+rd.boxes);
 const rdU=await pg.evaluate(()=>{const out={};for(const u of [1,3,5,7]){APP.product('readdraw','reading');APP.select('Unit '+u);out[u]=APP.cur.pages.length;}
   APP.select('Through Unit 7');out.t7=APP.cur.pages.length;APP.select('sh');out.sh=APP.cur.pages.length;return out;}); ok(Object.values(rdU).every(n=>n>=4),'Read and Draw builds for Units, Through Unit 7, and a skill '+JSON.stringify(rdU));
 // pages option
 const pgs=await pg.evaluate(()=>{APP.product('readdraw','reading');APP.select('Unit 1');document.getElementById('rdPages').value=4;document.getElementById('rdPages').onchange&&document.getElementById('rdPages').onchange();document.getElementById('rdPages').dispatchEvent(new Event('input'));return new Promise(r=>setTimeout(()=>r(APP.cur.pages.length),400));});
 ok(pgs===7,'Read and Draw with 4 pages -> 7 total pages (got '+pgs+')');
 // ---- mixed bundle = ZIP of separate files; landscape (Roll and Read) + portrait (Read and Draw, Word Sort, Picture Write)
 const bd=await pg.evaluate(()=>{document.getElementById('clearBundle').click();
   APP.product('rollread','reading');APP.select('sh');APP.addSet();APP.product('readdraw','reading');APP.select('Unit 2');APP.addSet();APP.product('wordsort','reading');APP.select('ch');APP.addSet();APP.product('picturewrite','reading');APP.select('Short a CVC');const n=APP.addSet();
   document.getElementById('bundleTitle').value='Test Mix Bundle';document.getElementById('bundleTitle').dispatchEvent(new Event('input'));const d=APP.bundleDoc();
   return {n,title:d.title,mixed:d.mixed,names:d.files.map(f=>f.name),orients:d.files.map(f=>f.orient),sets:d.sets.map(s=>s.prod.id),warn:document.getElementById('bundleWarn').textContent,pages:d.pages.length};});
 ok(bd.n===4,'landscape + portrait sets can all be added ('+bd.n+')');
 ok(bd.title==='Test Mix Bundle','typed bundle title used');ok(bd.mixed&&bd.sets.join()==='rollread,readdraw,wordsort,picturewrite','mixed bundle sets '+bd.sets);
 ok(bd.warn==='','no orientation warning: '+bd.warn);
 ok(bd.names[0]==='01 Cover and Contents'&&/^02 Roll and Read - /.test(bd.names[1])&&/^03 Read and Draw - Unit 2/.test(bd.names[2]),'numbered file names: '+bd.names.join(' | '));
 ok(bd.orients.includes('L')&&bd.orients.includes('P'),'bundle holds landscape and portrait files: '+bd.orients);
 const dl=async(sel,name)=>{const [d]=await Promise.all([pg.waitForEvent('download',{timeout:180000}),pg.click(sel)]);await d.saveAs(OUT+name);return OUT+name;};
 const bz=await dl('#bzip','suite-bundle.zip');
 sh(`rm -rf ${OUT}bz && mkdir -p ${OUT}bz && unzip -oq "${bz}" -d ${OUT}bz`);
 const listing=fs.readdirSync(OUT+'bz').sort(); ok(listing.length===2*bd.names.length,'zip has PPTX + PDF for each of '+bd.names.length+' files: '+listing.join(' | '));
 ok(bd.names.every(n=>fs.existsSync(`${OUT}bz/${n}.pptx`)&&fs.existsSync(`${OUT}bz/${n}.pdf`)),'every file in both formats');
 // page shapes per file (PDF) + standalone structure (set files: cover, directions, pages, terms)
 const sizes=bd.names.map(n=>sh(`pdfinfo "${OUT}bz/${n}.pdf" | grep -E "Page size|Pages"`).stdout.replace(/\s+/g,' '));
 ok(/792 x 612/.test(sizes[1])&&/612 x 792/.test(sizes[2])&&/612 x 792/.test(sizes[0]),'Roll and Read file landscape, Read and Draw + cover portrait: '+sizes.join(' || '));
 const terms=bd.names.slice(1).map(n=>/Terms of Use/.test(sh(`pdftotext "${OUT}bz/${n}.pdf" - 2>/dev/null`).stdout)); ok(terms.every(Boolean),'each set file has its own Terms page');
 const dirs=bd.names.slice(1).map(n=>/How to (Play|Use)/.test(sh(`pdftotext "${OUT}bz/${n}.pdf" - 2>/dev/null`).stdout)); ok(dirs.every(Boolean),'each set file has its own directions page');
 const ct=sh(`pdftotext "${OUT}bz/01 Cover and Contents.pdf" - 2>/dev/null`).stdout; ok(/Test Mix Bundle/.test(ct)&&/What's Included/.test(ct)&&/02\s+Roll and Read/.test(ct)&&!/Set \d of/.test(ct),'cover/contents file lists the numbered files');
 const sl=bd.names.map(n=>sh(`pdftotext "${OUT}bz/${n}.pdf" - 2>/dev/null`).stdout).join(''); ok(!/Set \d of \d/.test(sl),'no divider pages');
 const ps=bd.names.map(n=>{const x=sh(`cd /tmp && rm -rf px1 && mkdir px1 && cd px1 && unzip -oq "${OUT}bz/${n}.pptx" && grep -o 'sldSz cx="[0-9]*" cy="[0-9]*"' ppt/presentation.xml`).stdout.trim();return x;}); ok(ps[1]!==ps[2]&&ps[2]===ps[0],'PPTX slide sizes differ per file: '+ps.join(' | '));
 // picker: pick pages -> picks recorded -> listing uses them
 await pg.evaluate(()=>{document.getElementById('bpickDet').open=true;});await pg.waitForTimeout(400);
 const th=await pg.$$('#bpickPages .pg'); ok(th.length>=4,'bundle picker shows student pages ('+th.length+')');
 await th[0].click();await th[2].click();
 const pk=await pg.evaluate(()=>APP.bpicks.length); ok(pk===2,'two bundle pages picked');
 await th[0].click(); ok(await pg.evaluate(()=>APP.bpicks.length)===1,'unpick works');
 await th[0].click();
 const lz=await dl('#blist','suite-bundle-listing.zip'); r=sh(`unzip -l "${lz}"`).stdout; ok(/01-cover\.png/.test(r)&&/whats-included/.test(r)&&/listing\.txt/.test(r)&&(r.match(/preview/g)||[]).length>=2,'bundle listing zip has cover, previews, included, listing.txt');
 // single-product picker + listing
 await pg.evaluate(()=>{APP.product('rollread','reading');APP.select('sh');});
 await pg.evaluate(()=>{document.getElementById('pickDet').open=true;});await pg.waitForTimeout(400);
 const t1=await pg.$$('#pickPages .pg'); ok(t1.length>=2,'single-product picker thumbs '+t1.length); await t1[1].click(); ok(await pg.evaluate(()=>APP.picks.length)===1,'single pick recorded');
 await pg.fill('#lsGrade','2nd Grade'); await pg.selectOption('#lsTheme','sky');
 const sz=await dl('#dllist','suite-single-listing.zip'); r=sh(`rm -rf ${OUT}sl && mkdir -p ${OUT}sl && unzip -oq "${sz}" -d ${OUT}sl ; python3 -c "from PIL import Image;print(Image.open('${OUT}sl/01-cover.png').size)"; cat ${OUT}sl/listing.txt`).stdout;
 ok(/\(2000, 2000\)/.test(r),'listing cover is 2000x2000'); ok(/2nd Grade/.test(r),'grade text in listing.txt');
 // ---- PPTX rules: no theme colors / table styles in any file of the bundle
 const x=sh(`cd /tmp && rm -rf px && mkdir px && cd px && for f in ${OUT}bz/*.pptx; do mkdir "d$(basename "$f" .pptx | tr -d ' ')" ; unzip -oq "$f" -d "d$(basename "$f" .pptx | tr -d ' ')"; done; grep -rl "schemeClr\\|tableStyleId" . | grep slides | wc -l`).stdout.trim(); ok(x==='0','no schemeClr/tableStyleId in any bundle PPTX ('+x+' slides)');
 ok(errs.filter(e=>!/favicon/.test(e)).length===0,'no page/console errors: '+errs.slice(0,3).join(' || '));
 await b.close(); console.log(`\n${passes} passed, ${fails} failed`); process.exit(fails?1:0);
})();
