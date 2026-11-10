const {chromium,opts}=require('../lib');const fs=require('fs');const O='previews/crpics/';
(async()=>{const b=await chromium.launch(opts);const pg=await b.newPage({viewport:{width:1500,height:1100},acceptDownloads:true});const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://127.0.0.1:8812/index.html?'+Date.now());await pg.waitForSelector('#preview canvas');
await pg.evaluate(()=>APP.product('coldread'));await pg.waitForTimeout(400);
await pg.evaluate(()=>{const t=document.getElementById('crText');const s=TPT.products.find(p=>p.id==='coldread').sample;t.value=s+'\n---\n'+s.replace(/Title:.*/,'Title: The Red Barn');t.oninput();});await pg.waitForTimeout(900);
const slots=await pg.$$('#crPics .crPic');console.log('slots',slots.length,await pg.$$eval('#crPics .crPic>div:first-child',d=>d.map(x=>x.textContent)));
// upload into slot 1
await (await pg.$$('#crPics input[type=file]'))[0].setInputFiles('/workspace/sample-pic.png');await pg.waitForTimeout(800);
// paste into slot 2 (if present)
const b64=fs.readFileSync('/workspace/sample-pic2.jpg').toString('base64');
const pasted=await pg.evaluate(async b64=>{const z=document.querySelectorAll('#crPics [contenteditable]')[1];if(!z)return false;const bin=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));const f=new File([bin],'p.jpg',{type:'image/jpeg'});const dt=new DataTransfer();dt.items.add(f);z.dispatchEvent(new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}));return true;},b64);
await pg.waitForTimeout(1000);
const n=await pg.evaluate(()=>APP.cur.pages.filter(p=>p.items.some(i=>i.t==='image'&&i.icon&&i.icon.src&&i.icon.src.length>2000)).length);
console.log('pasted',pasted,'pages with picture',n,'stored',await pg.evaluate(()=>Object.keys(APP.crPics)));
const urls=await pg.evaluate(()=>APP.cur.pages.map(p=>{const c=document.createElement('canvas');APP.T.drawCanvas(p,c,150);return c.toDataURL();}));
urls.forEach((u,i)=>fs.writeFileSync(`${O}page-${String(i+1).padStart(2,'0')}.png`,Buffer.from(u.split(',')[1],'base64')));
for(const [id,f] of [['#dlpdf','cold-read-pics.pdf'],['#dlpptx','cold-read-pics.pptx'],['#dllist','cold-read-listing.zip']]){const [d]=await Promise.all([pg.waitForEvent('download'),pg.click(id)]);await d.saveAs(O+f);}
await pg.screenshot({path:O+'app-ui.png'});
await pg.setViewportSize({width:390,height:844});await pg.waitForTimeout(300);await (await pg.$('#crPics'))?.scrollIntoViewIfNeeded();await pg.screenshot({path:O+'app-ui-mobile.png'});
// remove
await pg.setViewportSize({width:1500,height:1100});await pg.click('#crPics button');await pg.waitForTimeout(600);
console.log('after remove stored',await pg.evaluate(()=>Object.keys(APP.crPics)));
console.log('errors',errs);await b.close();if(errs.length||n<1)process.exit(1);})();
