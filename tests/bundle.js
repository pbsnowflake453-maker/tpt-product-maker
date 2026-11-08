// Bundle test: mixed product types, one file per set + cover/contents file (PPTX and PDF zips), de-duplicated skills, typed title, page picker, listing kits.
// Run with the site served on 127.0.0.1:8812.  OUT=folder for downloads/screenshots, CHROME=path to Chrome if Playwright has no browser of its own.
let pw; try{pw=require('playwright');}catch(e){pw=require('/tmp/pw/node_modules/playwright');}
const fs=require('fs'), OUT=(process.env.OUT||'previews/bundle')+'/'; fs.mkdirSync(OUT,{recursive:true});
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c)fails++;};
(async()=>{
  const b=await pw.chromium.launch(process.env.CHROME?{executablePath:process.env.CHROME,args:['--no-sandbox']}:{});
  const pg=await b.newPage({viewport:{width:1500,height:1400},acceptDownloads:true}); const errs=[];
  pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text());});
  pg.on('response',r=>{if(r.status()>=400&&!/favicon/.test(r.url()))errs.push(r.status()+' '+r.url());});
  await pg.goto('http://127.0.0.1:8812/'); await pg.waitForFunction(()=>window.APP&&document.getElementById('status').textContent!=='Loading fonts…');
  const ev=f=>pg.evaluate(f);
  // mixed types; the two Bingo sets share skills inside their labels (this used to repeat each skill on the cover)
  await ev(()=>{APP.product('rollread','reading');APP.select('sh');return APP.addSet();});
  await ev(()=>{APP.product('bingo','reading');APP.select(['sh','ch','wh']);return APP.addSet();});
  await ev(()=>{APP.product('bingo','reading');APP.select(['sh','ch','th (unvoiced, as in thin)']);return APP.addSet();});
  await ev(()=>{APP.product('rollsolve','math');APP.select('Doubles');return APP.addSet();});
  await ev(()=>{APP.product('mystery','reading');return APP.addSet();});
  ok(await pg.locator('#bundle li').count()===5,'5 sets from 4 different product types are in one bundle');
  ok((await pg.inputValue('#bundleTitle')).includes('Roll and Read')&&(await pg.inputValue('#bundleTitle')).endsWith('Bundle'),'bundle title is suggested: '+await pg.inputValue('#bundleTitle'));
  await pg.fill('#bundleTitle','CVC Phonics Games Bundle for Centers and Small Groups');
  ok((await pg.inputValue('#bundleTitle')).startsWith('CVC'),'typed title stays after the list changes');
  const info=await ev(async()=>{const {sets,made}=await APP.bundleMake();return {skills:made.skills,files:made.files.map(f=>f.name),orients:made.files.map(f=>f.doc.pages[0].portrait?'P':'L')};});
  console.log(JSON.stringify(info));
  ok(new Set(info.skills).size===info.skills.length,'each skill listed once on the cover: '+info.skills.join(' • '));
  ok(info.files.length===6&&info.files[0].startsWith('00 - '),'6 files: cover/contents + 5 sets');
  ok(info.orients.includes('L')&&info.orients.includes('P'),'landscape and portrait sets both present ('+info.orients.join('')+')');
  await pg.click('#showBundle'); await pg.waitForFunction(()=>/Bundle preview/.test(document.getElementById('status').textContent));
  await pg.locator('#preview').screenshot({path:OUT+'preview.png'});
  // picker: sets first, then pages
  ok(await pg.locator('#pickPages .pg').count()===0,'no page thumbnails until a set is ticked');
  await pg.locator('#pickSets input').nth(1).check(); await pg.waitForSelector('#pickPages .pg');
  const n1=await pg.locator('#pickPages .pg').count(); ok(n1>3,'ticking a set shows only that set\'s pages ('+n1+')');
  await pg.locator('#pickPages .pg').nth(2).click(); await pg.locator('#pickPages .pg').nth(3).click();
  await pg.locator('#pickSets input').nth(3).check(); await pg.waitForFunction(()=>document.querySelectorAll('#pickPages .pset').length===2&&!/Loading/.test(document.getElementById('pickPages').textContent));
  await pg.locator('#pickPages .pset').nth(1).locator('.pg').nth(2).click();
  ok((await ev(()=>APP.picks.length))===3,'3 pages picked, in order: '+await pg.locator('#pickInfo').textContent());
  await pg.locator('aside').screenshot({path:OUT+'sidebar.png'});
  const dl=async(sel,name)=>{const [d]=await Promise.all([pg.waitForEvent('download',{timeout:180000}),pg.click(sel)]); await d.saveAs(OUT+name); return d.suggestedFilename();};
  console.log(await dl('#bpptx','pptx.zip')); console.log(await dl('#bpdf','pdf.zip'));
  console.log(await dl('#blist','kit-bundle-only.zip'));
  await pg.check('#eachKits'); console.log(await dl('#blist','kit-with-sets.zip'));
  ok(errs.length===0,'no page errors'+(errs.length?': '+errs.join(' | '):''));
  await b.close(); console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
