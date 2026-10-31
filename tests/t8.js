const {chromium}=require('/tmp/pw/node_modules/playwright');
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1500,height:1100}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://127.0.0.1:8812/index.html?'+Date.now());await pg.waitForSelector('#preview canvas');
await pg.evaluate(()=>APP.product('mystery','reading'));await pg.waitForTimeout(300);
console.log(await pg.evaluate(()=>[Object.values(PIXELS.themes).flat().length,APP.MY.name,APP.cur.secs[0].info]));
let n=0;for(const t of await pg.evaluate(()=>Object.keys(PIXELS.themes)))for(const im of await pg.evaluate(t=>PIXELS.themes[t].map(i=>i.name),t)){await pg.evaluate(([t,im])=>APP.pickImage(t,im),[t,im]);n++;}
console.log('built',n);await pg.evaluate(()=>scrollTo(0,0));await pg.screenshot({path:'px_ui.png'});console.log(errs);await b.close();})();
