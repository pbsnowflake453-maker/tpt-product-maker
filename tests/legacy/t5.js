const {chromium,opts}=require('../lib');
(async()=>{const b=await chromium.launch(opts);const pg=await b.newPage({viewport:{width:1500,height:1100},acceptDownloads:true});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await pg.goto('http://127.0.0.1:8812/index.html?'+Date.now());await pg.waitForSelector('#preview canvas');
const dl=async(id,tag)=>{const [d]=await Promise.all([pg.waitForEvent('download'),pg.click('#'+id)]);await d.saveAs(`u_${tag}.${d.suggestedFilename().split('.').pop()}`);};
// UI: open picker, search
await pg.click('#skillPick .pk-btn');await pg.screenshot({path:'u_picker.png'});
await pg.fill('#skillPick .pk-q','unit 4');await pg.screenshot({path:'u_picker_search.png'});
await pg.click('#skillPick .sk:has-text("Through G1 Unit 4")');
console.log(await pg.evaluate(()=>APP.cur.secs[0].info));await dl('dlpdf','rr');await dl('dlpptx','rr');
console.log(await pg.evaluate(()=>{APP.select('ar, or, er');return APP.addSet();}));await dl('bpdf','bun');
await pg.evaluate(()=>APP.product('bingo','reading'));await pg.check('#mix');
await pg.click('#skillPick .pk-btn');await pg.fill('#skillPick .pk-q','K Unit');await pg.click('#skillPick .sk:has-text("K Unit 7")');await pg.click('#skillPick .sk:has-text("K Unit 8")');
await pg.keyboard.press('Escape');console.log(await pg.evaluate(()=>APP.cur.secs[0].label+' | '+APP.cur.secs[0].info));await dl('dlpdf','bingo');
await pg.mouse.click(1200,50);
await pg.evaluate(()=>APP.product('mystery','reading'));
await pg.locator('#colors .pk-btn').first().click();await pg.fill('#colors .picker.open .pk-q','G1 Unit 3');await pg.click('#colors .picker.open .sk:has-text("G1 Unit 3")');
console.log(await pg.evaluate(()=>APP.cur.secs[0].label+' | '+APP.cur.secs[0].info));await pg.evaluate(()=>scrollTo(0,0));await pg.screenshot({path:'u_mystery.png'});
console.log('errors',errs);await b.close();})();
