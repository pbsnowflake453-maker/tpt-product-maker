const {chromium,opts}=require('../lib');
(async()=>{const b=await chromium.launch(opts);const pg=await b.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://127.0.0.1:8812/index.html');await pg.waitForSelector('#preview canvas');
const out=await pg.evaluate(()=>{const r={};for(const p of APP.T.products){APP.product(p.id);r[p.id]=APP.cur?APP.cur.pages.length:0;}
  APP.product('wordsort');document.getElementById('mix').checked=true;r.wsInfo=APP.select(['sh','ch','th (unvoiced, as in thin)']);r.wsPages=APP.cur.pages.length;
  document.getElementById('wsWrite').checked=true;document.getElementById('wsWrite').onchange();r.wsWrite=APP.cur.secs[0].info;return r;});
console.log(JSON.stringify(out));console.log('errors',errs);await b.close();if(errs.length)process.exit(1);})();
