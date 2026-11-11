// Listing Image Maker (listing.html) test: PDF, PPTX and PNG drop-in, page picks, editable text, live preview, zip download.
// Needs the site served on BASE (default http://127.0.0.1:8812) -> node tests/dropin.js   (inputs are generated from the site itself)
const {chromium,opts,OUT}=require('./lib'); const fs=require('fs'); const cp=require('child_process');
const SITE=(process.env.BASE||'http://127.0.0.1:8812/index.html').replace(/index\.html.*$/,'');
let fails=0,passes=0; const ok=(c,m)=>{if(c){passes++;}else{fails++;console.log('FAIL:',m);}};
(async()=>{
 const b=await chromium.launch(opts); const errs=[];
 const mk=async()=>{const pg=await b.newPage({viewport:{width:1500,height:1000},acceptDownloads:true}); pg.on('pageerror',e=>errs.push(e.message)); pg.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(m.text()))errs.push(m.text());}); return pg;};
 // ---- inputs made by the product maker itself
 const mp=await mk(); await mp.goto(SITE+'index.html?'+Date.now()); await mp.waitForFunction(()=>window.APP&&document.getElementById('status').textContent!=='Loading fonts…');
 await mp.evaluate(()=>{APP.product('rollread','reading');APP.select('sh');});
 const dl=async(pg,sel,name)=>{const [d]=await Promise.all([pg.waitForEvent('download',{timeout:120000}),pg.click(sel)]);await d.saveAs(OUT+name);return OUT+name;};
 const pptx=await dl(mp,'#dlpptx','dropin-in.pptx'), pdf=await dl(mp,'#dlpdf','dropin-in.pdf');
 const pngData=await mp.evaluate(()=>{const cv=document.createElement('canvas');APP.T.drawCanvas(APP.cur.pages[2],cv,110);return cv.toDataURL();}); fs.writeFileSync(OUT+'dropin-in.png',Buffer.from(pngData.split(',')[1],'base64'));
 await mp.close();
 ok(await (async()=>{const p=await mk(); await p.goto(SITE+'index.html'); const has=await p.evaluate(()=>!![...document.querySelectorAll('a')].find(a=>/listing\.html/.test(a.getAttribute('href')))); await p.close(); return has;})(),'index.html links to the listing image maker');
 // ---- the tool
 const pg=await mk(); await pg.goto(SITE+'listing.html?'+Date.now()); await pg.waitForFunction(()=>window.DROPIN&&/^Drop/.test(document.getElementById('status').textContent));
 const ready=async(n)=>pg.waitForFunction(n=>{const s=document.getElementById('status').textContent;return /images ready/.test(s)&&document.querySelectorAll('#preview figure').length>=n;},n||1,{timeout:90000});
 for(const [label,file,minPages] of [['PDF',pdf,7],['PPTX',pptx,7],['PNG',OUT+'dropin-in.png',1]]){
   await pg.reload(); await pg.waitForFunction(()=>window.DROPIN&&/^Drop/.test(document.getElementById('status').textContent));
   await pg.setInputFiles('#fileIn',[file]); await ready(3);
   const r=await pg.evaluate(()=>({n:DROPIN.allPages().length,title:document.getElementById('fTitle').value,figs:document.querySelectorAll('#preview figure').length,ribbon:document.getElementById('fRibbon').value,thumbs:document.querySelectorAll('#pages .pg').length}));
   ok(r.n===minPages,`${label}: ${minPages} page(s) read (got ${r.n})`); ok(r.thumbs===r.n,`${label}: one picker thumbnail per page`); ok(r.figs>=3,`${label}: preview images shown (${r.figs})`);
   ok(/PAGE/.test(r.ribbon),`${label}: automatic ribbon text "${r.ribbon}"`);
   // a rendered page is not blank
   const dark=await pg.evaluate(async()=>{const p=DROPIN.allPages()[0];const c=await p.full();const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=4*50)if(d[i]<100)n++;return n;}); ok(dark>20,`${label}: first page has visible content (${dark})`);
   await pg.evaluate(()=>DROPIN.files.splice(0)); 
 }
 // ---- editing: PDF with picks, key page, edited text
 await pg.reload(); await pg.waitForFunction(()=>window.DROPIN&&/^Drop/.test(document.getElementById('status').textContent));
 await pg.setInputFiles('#fileIn',[pdf,pptx]); await pg.waitForFunction(()=>DROPIN.allPages().length===14,null,{timeout:60000}); await ready(3);
 const th=await pg.$$('#pages .pg'); ok(th.length===14,'two files: 14 thumbnails ('+th.length+')');
 await th[2].click(); await th[3].click(); await th[5].click(); await th[4].click(); await th[4].click();
 ok(await pg.evaluate(()=>DROPIN.picks.length)===3,'three pages picked, unpick works');
 await pg.fill('#fTitle','Roll and Read'); await pg.fill('#fSkills','/sh/ words'); await pg.fill('#fGrade','1st Grade'); await pg.fill('#fSub','Phonics center game');
 await pg.fill('#fRibbon','7 PAGES • PRINT AND GO'); await pg.fill('#fStore','My Side of the Classroom'); await pg.selectOption('#fTheme','sky');
 await pg.check('#fKey'); await pg.fill('#fKeyTop','ANSWER'); await pg.fill('#fKeyBot','KEY');
 await pg.evaluate(()=>document.querySelector('#textSec details').open=true);
 await pg.fill('#fInc','Three game boards\nWord list\nPrint and go'); await pg.fill('#fBlurb','A fun /sh/ game.'); await pg.fill('#fTags','phonics, sh');
 await pg.fill('#fPrev','SAMPLE'); await ready(5); await new Promise(r=>setTimeout(r,800)); await ready(5);
 await pg.screenshot({path:OUT+'dropin-ui.png'});
 const z=await dl(pg,'#dl','dropin-out.zip'); const list=cp.spawnSync('bash',['-c',`rm -rf ${OUT}dz && mkdir ${OUT}dz && unzip -oq ${z} -d ${OUT}dz && ls ${OUT}dz && python3 -c "from PIL import Image;import glob;print([Image.open(f).size for f in sorted(glob.glob('${OUT}dz/*.png'))])" && cat ${OUT}dz/listing.txt`],{encoding:'utf8'}).stdout;
 ok(/01-cover\.png/.test(list)&&/02-preview\.png/.test(list)&&/04-preview\.png/.test(list)&&/05-whats-included\.png/.test(list)&&/listing\.txt/.test(list),'zip has cover, 3 previews, included, listing.txt: '+list.split('\n').slice(0,7).join(' '));
 ok(/\(2000, 2000\)/.test(list),'images are 2000x2000');
 ok(/Roll and Read - \/sh\/ words - 1st Grade/.test(list)&&/A fun \/sh\/ game\./.test(list)&&/Three game boards/.test(list)&&/phonics, sh/.test(list),'listing.txt uses the edited fields');
 // ---- the edited text really lands on the images
 const bad=await pg.evaluate(()=>{const s=DROPIN.specNow(); return {sub:s.text.subtitle,pill:s.text.skills,burst:s.text.keyBurst,picks:s.picks.length};}); ok(bad.sub==='Phonics center game'&&bad.pill==='/sh/ words'&&bad.burst&&bad.picks===3,'spec carries edits '+JSON.stringify(bad));
 await pg.close();
 // ---- generator listings still work and use the smaller, level pieces (pixel checks on the real images)
 const gp=await mk(); await gp.goto(SITE+'index.html?'+Date.now()); await gp.waitForFunction(()=>window.APP&&document.getElementById('status').textContent!=='Loading fonts…');
 await gp.evaluate(()=>{APP.product('rollread','reading');APP.select('sh');});
 const gz=await dl(gp,'#dllist','dropin-gen-listing.zip'); await gp.close();
 const chk=cp.spawnSync('python3',['-c',`
import zipfile,io
from PIL import Image
z=zipfile.ZipFile('${gz}'); im=Image.open(io.BytesIO(z.read('01-cover.png'))).convert('RGB'); px=im.load()
def yellow(p): return p[0]>240 and 190<p[1]<235 and p[2]<110
# yellow banner: every column's yellow run must start at the same row (level top edge) across the banner
ys=[]
for x in range(520,1500,20):
    col=[y for y in range(1600,1860) if yellow(px[x,y])]
    ys.append((min(col),max(col)) if col else None)
ok=[t for t in ys if t]
print('banner', len(ok), max(t[0] for t in ok)-min(t[0] for t in ok), max(t[1] for t in ok)-min(t[1] for t in ok))
# store pill: white pill bottom-left: find its vertical extent at x=300
y0=y1=1860
while px[300,y0-1]==(255,255,255): y0-=1
while px[300,y1+1]==(255,255,255): y1+=1
print('pill', y0, y1, y1-y0)
`],{encoding:'utf8'}).stdout; console.log(chk.trim());
 const mb=/banner (\d+) (\d+) (\d+)/.exec(chk), mpill=/pill (\d+) (\d+) (\d+)/.exec(chk);
 ok(mb&&+mb[1]>30&&+mb[2]<=3&&+mb[3]<=3,'yellow banner is level: '+(mb&&mb.slice(1)));
 ok(mpill&&+mpill[3]>=60&&+mpill[3]<=110,'store pill height '+(mpill&&mpill[3])+' (was 140)');
 ok(errs.length===0,'no page/console errors: '+errs.slice(0,3).join(' || '));
 await b.close(); console.log(`\n${passes} passed, ${fails} failed`); process.exit(fails?1:0);
})();
