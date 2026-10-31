const {chromium}=require('/tmp/pw/node_modules/playwright');
(async()=>{const b=await chromium.launch();const pg=await b.newPage({acceptDownloads:true});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://127.0.0.1:8812/index.html?'+Date.now());await pg.waitForSelector('#preview canvas');
console.log(await pg.evaluate(()=>APP.select('ff')));
const [d]=await Promise.all([pg.waitForEvent('download'),pg.click('#dlpdf')]);await d.saveAs('w_ff.pdf');console.log(errs);await b.close();})();
