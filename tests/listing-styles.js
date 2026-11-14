// Listing layouts (A Classic, B Bold Graphic, C Center Band) + the grouped text controls, in the generator and the Listing Image Maker.
// Needs the site served on BASE (default http://127.0.0.1:8812) -> node tests/listing-styles.js
const {chromium,opts,OUT}=require('./lib'); const fs=require('fs'); const crypto=require('crypto');
const SITE=(process.env.BASE||'http://127.0.0.1:8812/index.html').replace(/index\.html.*$/,'');
let fails=0,passes=0; const ok=(c,m)=>{if(c){passes++;}else{fails++;console.log('FAIL:',m);}};
const hash=b=>crypto.createHash('md5').update(b).digest('hex');
(async()=>{
 const b=await chromium.launch(opts); const errs=[];
 const mk=async()=>{const pg=await b.newPage({viewport:{width:1500,height:1000},acceptDownloads:true}); pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(m.text()))errs.push(m.text());}); return pg;};
 // ---------- generator: layout picker + every layout x every theme
 const g=await mk(); await g.goto(SITE+'index.html?'+Date.now()); await g.waitForFunction(()=>window.APP&&document.getElementById('status').textContent!=='Loading fonts…');
 await g.evaluate(()=>{APP.product('rollread','reading');APP.select('sh');window.__cap=null;LISTING.zip=async(sp)=>{window.__cap=sp;};});
 const vis=async(sel)=>g.evaluate(s=>{const e=document.querySelector(s);return !!e&&!e.closest('[hidden]')&&e.offsetParent!==null;},sel);
 ok(await g.evaluate(()=>document.querySelectorAll('.stylepick button').length)===3,'generator: three layout buttons');
 for(const [st,gradeVis,burstVis] of [['classic',true,false],['bold',false,true],['band',true,false]]){
   await g.click(`.stylepick button[data-style=${st}]`);
   ok(await g.evaluate(()=>document.getElementById('lsStyle').value)===st,`generator: ${st} button sets the style`);
   ok(await g.evaluate(()=>APP.listingOpts().style)===st,`generator: listingOpts carries ${st}`);
   ok(await vis('#lsGrade')===gradeVis,`generator: grade box visibility for ${st}`); ok(await vis('#lsBurstTop')===burstVis,`generator: page-count burst box visibility for ${st}`);
   ok(await vis('.stylepick'),'generator: layout picker visible');
 }
 await g.click('#dllist'); await g.waitForFunction(()=>window.__cap);
 const hashes={};
 for(const st of ['classic','bold','band']) for(const th of ['apple','sky','sunny','grape','mint']){
   const r=await g.evaluate(async([st,th])=>{const sp=window.__cap; const spec=Object.assign({},sp,{picks:sp.doc.pages.slice(1,5),opts:{grade:'1st Grade',theme:th,style:st}}); const res=await LISTING.build(spec);
     const cv=res.images[0][1], x=cv.getContext('2d'); const row=(y)=>{const d=x.getImageData(0,y,2000,1).data; return d;}; 
     // level check: find the first fully black-ish row at the far left and far right edges inside the image (band edge / banner)
     const colFirstDark=(xx)=>{const d=x.getImageData(xx,0,1,2000).data; const out=[]; for(let y=0;y<2000;y++) if(d[y*4]<20&&d[y*4+1]<20&&d[y*4+2]<20){out.push(y);} return out;};
     return {n:res.images.length,w:cv.width,h:cv.height,png:cv.toDataURL('image/png').length,url:cv.toDataURL('image/png'),left:colFirstDark(60).slice(0,3),right:colFirstDark(1940).slice(0,3)};},[st,th]);
   ok(r.w===2000&&r.h===2000&&r.n>=6,`${st}/${th}: cover 2000x2000 and ${r.n} images`);
   const key=hash(r.url); hashes[st+th]=key; if(st==='band'&&['apple','sky','sunny'].includes(th)) fs.writeFileSync(OUT+`band-${th}.png`,Buffer.from(r.url.split(',')[1],'base64'));
   if(st==='band'){ ok(JSON.stringify(r.left)===JSON.stringify(r.right)&&r.left.length>0,`band/${th}: band top edge is level (left ${r.left} / right ${r.right})`); }
 }
 ok(new Set(Object.values(hashes)).size===11,'A and C draw a different cover per theme, B ignores theme: 11 distinct covers (got '+new Set(Object.values(hashes)).size+')');
 await g.close();
 // ---------- drop-in tool: grouped text, hidden-by-layout boxes, every field reaches the preview
 const mp=await mk(); await mp.goto(SITE+'index.html?'+Date.now()); await mp.waitForFunction(()=>window.APP&&document.getElementById('status').textContent!=='Loading fonts…');
 await mp.evaluate(()=>{APP.product('rollread','reading');APP.select('sh');});
 const [d]=await Promise.all([mp.waitForEvent('download',{timeout:120000}),mp.click('#dlpdf')]); await d.saveAs(OUT+'ls-in.pdf'); await mp.close();
 const pg=await mk(); await pg.goto(SITE+'listing.html?'+Date.now()); await pg.waitForFunction(()=>window.DROPIN&&/^Drop/.test(document.getElementById('status').textContent));
 await pg.setInputFiles('#fileIn',[OUT+'ls-in.pdf']); await pg.waitForFunction(()=>/images ready/.test(document.getElementById('status').textContent),null,{timeout:90000});
 const settled=async()=>{await pg.waitForTimeout(500); await pg.waitForFunction(()=>!document.getElementById('dl').disabled&&/images ready/.test(document.getElementById('status').textContent),null,{timeout:90000});};
 const coverHash=async()=>hash(await pg.evaluate(()=>{const c=DROPIN.last.images[0][1];return c.toDataURL('image/png');}));
 const sections=await pg.evaluate(()=>[...document.querySelectorAll('#textSec details>summary')].map(s=>s.textContent.trim()));
 ok(JSON.stringify(sections)===JSON.stringify(['Cover','Bottom of the images','Preview images',"What's Included image",'Listing text (listing.txt)']),'drop-in: five tidy text groups: '+sections.join(' | '));
 ok(await pg.evaluate(()=>{const ids=[...document.querySelectorAll('#textSec [id]')].map(e=>e.id);return ids.length===new Set(ids).size;}),'drop-in: no duplicate ids');
 ok(await pg.evaluate(()=>document.querySelectorAll('#textSec details[open]').length)===2,'drop-in: Cover and Bottom groups open, the rest collapsed');
 await pg.evaluate(()=>document.querySelectorAll('#textSec details').forEach(d=>d.open=true));
 // layout buttons
 await pg.click('.stylepick button[data-style=band]'); await settled();
 for(const id of ['fSub','fGrade','fKey','fKeyTop','fStore','fTheme']) ok(await pg.isVisible('#'+id),`band: #${id} visible`);
 ok(!await pg.isVisible('#lsBurstTop'),'band: page-count burst box hidden');
 const bandBase=await coverHash();
 // every cover field changes the band cover
 const edits=[['fTitle','A Brand New Title'],['fSub','Phonics center game'],['fSkills','/sh/ and /ch/'],['fGrade','2nd Grade'],['fRibbon','HUGE SAVINGS'],['fStore','Yarn Side']];
 for(const [id,v] of edits){ const before=await coverHash(); await pg.fill('#'+id,v); await settled(); ok(await coverHash()!==before,`band: editing #${id} changes the cover`); }
 await pg.check('#fKey'); await settled(); const k1=await coverHash(); await pg.fill('#fKeyTop','TEACHER'); await settled(); ok(await coverHash()!==k1,'band: answer key burst text changes the cover');
 await pg.selectOption('#fTheme','mint'); await settled(); ok(await coverHash()!==k1,'band: theme changes the cover');
 // preview + included + listing text fields
 const pv=async()=>hash(await pg.evaluate(()=>DROPIN.last.images.slice(1).map(([n,c])=>c.toDataURL('image/png').slice(-3000)).join('')));
 for(const [id,v] of [['fPTitle','Preview Header'],['fPPill','Pill text'],['fPrev','LOOK INSIDE'],['fInc','One\nTwo']]){ const before=await pv(); await pg.fill('#'+id,v); await settled(); ok(await pv()!==before,`preview images change with #${id}`); }
 await pg.fill('#fBlurb','My description'); await pg.fill('#fTags','a, b'); await settled();
 const txt=await pg.evaluate(()=>DROPIN.last.txt); ok(/My description/.test(txt)&&/a, b/.test(txt),'listing.txt takes description and tags');
 // style B shows its own box and hides the A/C-only ones
 await pg.click('.stylepick button[data-style=bold]'); await settled();
 ok(await pg.isVisible('#lsBurstTop'),'bold: page-count burst visible'); ok(!await pg.isVisible('#fStore')&&!await pg.isVisible('#fGrade')&&!await pg.isVisible('#fSub'),'bold: store/grade/subtitle boxes hidden');
 await pg.fill('#lsBurstTop','12'); await settled(); ok(true,'bold burst edit renders');
 // download works for band
 await pg.click('.stylepick button[data-style=band]'); await settled();
 const [dz]=await Promise.all([pg.waitForEvent('download',{timeout:120000}),pg.click('#dl')]); await dz.saveAs(OUT+'band-listing.zip');
 const lst=require('child_process').spawnSync('unzip',['-l',OUT+'band-listing.zip']).stdout.toString(); ok(/01-cover\.png/.test(lst)&&/listing\.txt/.test(lst),'band listing zip has cover and listing.txt');
 // one page and no page picks edge cases
 for(const n of [1,2,3,5]){ const r=await pg.evaluate(async n=>{const sp=DROPIN.specNow(); sp.picks=DROPIN.allPages().slice(0,n); for(const p of sp.picks) if(!p.canvas) p.canvas=await p.full(); const res=await LISTING.build(sp); return res.images[0][1].width;},n); ok(r===2000,`band cover with ${n} picked page(s) renders`); }
 ok(errs.length===0,'no page errors: '+errs.slice(0,3).join(' / '));
 await b.close(); console.log(`${passes} passed, ${fails} failed`); process.exit(fails?1:0);
})();
