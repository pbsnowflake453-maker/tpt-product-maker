// Shared test setup. Env: PW (playwright module dir, default /tmp/pw/node_modules/playwright), CHROME (browser path), BASE (site url), OUT (output dir).
// Start the site first:  (cd site && python3 -m http.server 8812) &
const fs=require('fs');
const pw=require(process.env.PW||'/tmp/pw/node_modules/playwright');
const chrome=process.env.CHROME||(fs.existsSync('/usr/bin/google-chrome')?'/usr/bin/google-chrome':undefined);
const OUT=process.env.OUT||'/tmp/tpt-test-out/'; fs.mkdirSync(OUT,{recursive:true});
module.exports={chromium:pw.chromium,opts:{executablePath:chrome,args:['--no-sandbox']},BASE:process.env.BASE||'http://127.0.0.1:8812/index.html',OUT,
  async open(){const b=await pw.chromium.launch({executablePath:chrome,args:['--no-sandbox']});const pg=await b.newPage({acceptDownloads:true});const errs=[];
    pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
    await pg.goto(module.exports.BASE+'?'+Date.now());await pg.waitForFunction(()=>window.APP&&document.getElementById('status').textContent!=='Loading fonts…');return {b,pg,errs};}};
