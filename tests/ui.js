const {chromium}=require('/tmp/pw/node_modules/playwright');
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1500,height:1300}});
await pg.goto('http://127.0.0.1:8812/index.html?'+Date.now());await pg.waitForSelector('#preview canvas');
await pg.evaluate(()=>APP.product('mystery','reading'));await pg.waitForTimeout(300);await pg.evaluate(()=>scrollTo(0,0));await pg.screenshot({path:'ui_mystery.png'});
await pg.evaluate(()=>APP.product('bingo','reading'));await pg.screenshot({path:'ui_bingo.png'});
await b.close();})();
