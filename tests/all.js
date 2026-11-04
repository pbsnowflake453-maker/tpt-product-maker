// Full test: every product -> PDF + PPTX + PNG of every page; listing pack sample.
const {chromium}=require('/tmp/pw/node_modules/playwright');const fs=require('fs');const OUT='/workspace/tpt-cold-read/previews/all/';
(async()=>{const b=await chromium.launch();const pg=await b.newPage({acceptDownloads:true});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await pg.goto('http://127.0.0.1:8812/index.html?'+Date.now());await pg.waitForSelector('#preview canvas');
const CASES=[['rollread','reading',['ou (as in out)']],['rollsolve','math',null],['taskcards','math',null],['bingo','reading',['sh']],['bingo','math',null],['mystery','reading',null],['mystery','math',null],
 ['wordsort','reading',['sh','ch','th (unvoiced, as in thin)']],['wordmaze','reading',['ou (as in out)']],['coldread','reading',null],['picturewrite','reading',['Short Vowel CVC']],['picturewrite','reading2',['a_e']],['picturewrite','reading3',['Closed two-syllable words']]];
const res=[];
for(let [id,k,sk] of CASES){ const tag=id+'-'+k; k=k.replace(/\d$/,'');
  await pg.evaluate(([id,k,sk])=>{APP.product(id,k); if(sk){if(sk.length>1){const m=document.getElementById('mix');if(m)m.checked=true;} APP.select(sk);}},[id,k,sk]);
  await pg.waitForFunction(()=>!APP.loading); await pg.waitForTimeout(100);
  const r=await pg.evaluate(([id,k,sk])=>{const c=APP.cur;
    const urls=c.pages.map(p=>{const cv=document.createElement('canvas');APP.T.drawCanvas(p,cv,100);return cv.toDataURL();});
    const pdf=APP.T.pdfDoc(c.pages).output('datauristring');
    return {n:c.pages.length,info:c.secs[0].info,label:c.secs[0].label,urls,pdf};},[id,k,sk]);
  r.urls.forEach((u,i)=>fs.writeFileSync(`${OUT}${tag}-p${String(i+1).padStart(2,'0')}.png`,Buffer.from(u.split(',')[1],'base64')));
  fs.writeFileSync(`${OUT}${tag}.pdf`,Buffer.from(r.pdf.split(',')[1],'base64'));
  const [d]=await Promise.all([pg.waitForEvent('download'),pg.click('#dlpptx')]);await d.saveAs(`${OUT}${tag}.pptx`);
  res.push([tag,r.n,r.label,String(r.info).replace(/<[^>]+>/g,' | ')]);
}
// listing pack samples
for(const id of ['coldread','picturewrite','rollread']){ await pg.evaluate(id=>{APP.product(id,'reading'); if(id==='picturewrite')APP.select(['Short Vowel CVC']);},id); await pg.waitForFunction(()=>!APP.loading);
  const [d]=await Promise.all([pg.waitForEvent('download'),pg.click('#dllist')]);await d.saveAs(`${OUT}listing-${id}.zip`); }
await pg.evaluate(()=>{APP.product('rollread','reading');APP.select('sh');APP.addSet();APP.select('ch');APP.addSet();APP.select('ou (as in out)');APP.addSet();});
const [bz]=await Promise.all([pg.waitForEvent('download'),pg.click('#blist')]);await bz.saveAs(`${OUT}listing-bundle-rollread.zip`);
res.forEach(r=>console.log(r.join('  ::  ')));console.log('ERRORS',errs);await b.close();})();
