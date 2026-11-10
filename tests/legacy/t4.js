const {chromium,opts}=require('../lib');
(async()=>{const b=await chromium.launch(opts);const pg=await b.newPage({viewport:{width:1500,height:1300},acceptDownloads:true});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://127.0.0.1:8812/index.html?'+Date.now());await pg.waitForSelector('#preview canvas');
await pg.evaluate(()=>APP.product('mystery','reading'));
const T=[['early','Animals','ladybug',{R:'Short a CVC',K:'Short i CVC'}],['mid','Animals','bear',{N:'sh',T:'ch',K:'th (unvoiced, as in thin)'}],['late','Animals','ladybug',{R:'er, ir, ur',K:'ar'}]];
for(const [tag,th,im,as] of T){const r=await pg.evaluate(([th,im,as])=>{APP.pickImage(th,im);for(const [c,v] of Object.entries(as))APP.assign(c,v);
  const s=APP.cur.secs[0];const used=[...new Set(s.pages[0].items.filter(i=>i.t==='text').map(i=>i.text))];return {info:s.info,pool:s.bgPool.length,sample:s.bgPool.slice(0,15)};},[th,im,as]);
  console.log(tag,JSON.stringify(r));
  const [d]=await Promise.all([pg.waitForEvent('download'),pg.click('#dlpdf')]);await d.saveAs(`bg_${tag}.pdf`);}
await pg.evaluate(()=>scrollTo(0,0));await pg.screenshot({path:'bg_ui.png'});
console.log('errors',errs);await b.close();})();
