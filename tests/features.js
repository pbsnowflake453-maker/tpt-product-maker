// Offline functional coverage. See offline.js for dependencies and its browser-layout limitation.
const {load}=require('./offline');const fs=require('fs'),assert=require('assert');
const OUT=process.env.OUT||'/tmp/tpt-feature-tests/';fs.mkdirSync(OUT,{recursive:true});let checks=0;
const ok=(v,m)=>{assert(v,m);checks++;};
(async()=>{
 const {w}=await load(),T=w.TPT;
 ok(w.APP&&w.document.querySelector('a[href="checker.html"]'),'app loads and links to checker');
 w.APP.product('rollread','reading');w.APP.select('UFLI Lesson 56');
 ok(w.APP.cur.pages.length===7,'UFLI 56 Roll and Read generates full document');
 const sk=w.SKILLS.find(s=>s.name==='UFLI Lesson 56'),pool=new Set(sk.decodable.map(x=>x[0]));
 ok(pool.size===83,'83 words tagged lesson 56');
 const boardWords=w.APP.cur.pages.slice(2,5).flatMap(p=>p.items.filter(i=>i.t==='text'&&pool.has(i.text)).map(i=>i.text));
 ok(boardWords.length===108&&boardWords.every(x=>pool.has(x)),'all 108 board cells use lesson 56');
 w.document.querySelector('.pk-btn').click();w.document.querySelector('.pk-q').value='ufli lesson 56';w.document.querySelector('.pk-q').dispatchEvent(new w.Event('input'));ok([...w.document.querySelectorAll('.sk')].some(e=>e.textContent.startsWith('UFLI Lesson 56')),'picker search finds UFLI 56');
 // Every offered reading skill goes through the actual product section builder.
 for(const id of ['rollread','bingo','wordsort','wordmaze','picturewrite','readdraw','wwdraw','wwsounds','wwphonics']){
  const p=T.products.find(p=>p.id===id);let n=0;
  for(const s of w.SKILLS){if(id==='readdraw'&&T._rdAvail(s)<6)continue;if(id==='wwdraw'&&T._wwAvail(s,'draw')<9)continue;if(id==='wwsounds'&&T._wwAvail(s,'count')<10)continue;if(id==='wwphonics'&&T._wwAvail(s,'pair')<6)continue;if(id==='picturewrite'&&T._pwAvail([s]).length<9)continue;
   const sec=p.section({kind:'reading',skills:[s],label:T.readLabel(s),opts:{boards:2,size:3,same:true,rdPages:2,wwPages:2,wwBoxes:12,wwLines:12,mazeSize:'5x5',wordBank:true}},321);
   ok(sec.pages.length>0,`${id}/${s.name} has student pages`);
   ok(!sec.pages.flatMap(p=>p.items).some(i=>i.t==='text'&&/undefined|NaN|\[object/.test(i.text)),`${id}/${s.name} no invalid text`);n++;
  }console.log(id,n,'selections passed');
 }
 // Download rendering for every product type, plus mixed-orientation bundle.
 for(const p of T.products){
  w.APP.product(p.id,p.kinds[0]);if(p.kinds[0]==='reading'&&!['coldread','mystery','wwshapes','wwmissing','wwtricky'].includes(p.id))w.APP.select(p.id==='readdraw'?'Unit 3':p.id==='picturewrite'||/^ww/.test(p.id)?'Unit 4':'UFLI Lesson 56');
  if(w.APP.loading){for(let i=0;i<200&&w.APP.loading;i++)await new Promise(r=>setTimeout(r,10));}
  const doc=w.APP.cur;
  fs.writeFileSync(OUT+p.id+'.pdf',Buffer.from(T.pdfDoc(doc.pages).output('arraybuffer')));
  const px=await T.pptxDoc(doc.pages,p.id).write({outputType:'base64'});fs.writeFileSync(OUT+p.id+'.pptx',px,'base64');
  const canvas=w.document.createElement('canvas');T.drawCanvas(doc.pages[2],canvas,100);fs.writeFileSync(OUT+p.id+'.png',canvas.toDataURL().split(',')[1],'base64');
  ok(fs.statSync(OUT+p.id+'.pdf').size>10000,p.id+' PDF export');ok(fs.statSync(OUT+p.id+'.pptx').size>10000,p.id+' PPTX export');
 }
 w.document.getElementById('clearBundle').click();w.APP.product('rollread','reading');w.APP.select('UFLI Lesson 56');w.APP.addSet();w.APP.product('readdraw','reading');w.APP.select('Unit 3');w.APP.addSet();const bd=w.APP.bundleDoc();ok(bd.mixed&&bd.files.length===3,'mixed bundle');
 w.APP.product('rollread','reading');w.APP.select('UFLI Lesson 56');const spec={prod:T.products.find(p=>p.id==='rollread'),doc:w.APP.cur,skills:['UFLI Lesson 56'],opts:{style:'spotlight',theme:'lime',grade:'1st Grade'},picks:[]};
 for(const style of ['classic','spotlight'])for(const theme of Object.keys(w.LISTING.THEMES)){
  const result=await w.LISTING.build({...spec,opts:{...spec.opts,style,theme}});ok(result.images.length>=3,'listing image set '+style+'/'+theme);for(const [name,cv]of result.images)ok(cv.width===2000&&cv.height===2000,'2000x2000 '+name);
  if(style==='spotlight'&&['lime','teal','rose'].includes(theme))for(const [name,cv]of result.images)fs.writeFileSync(OUT+theme+'-'+name,cv.toDataURL().split(',')[1],'base64');
 }
 console.log('all palettes and both listing styles passed');
 // Listing tool controls route into the same renderer.
 const drop=await load('listing.html');drop.w.document.getElementById('fStyle').value='spotlight';drop.w.document.getElementById('fTheme').value='teal';ok(drop.w.DROPIN.specNow().opts.style==='spotlight'&&drop.w.DROPIN.specNow().opts.theme==='teal','drop-in style + theme');drop.w.close();
 // Text checker actual form, all words, add missing word, and persistence across Product Maker load.
 const {w:c}=await load('checker.html');c.document.getElementById('story').value='Cat cat. no so he zzyxword.';c.CHECKER.check();
 ok(c.CHECKER.report.words.find(x=>x.word==='cat').count===2,'checker word deduplication');ok(c.document.querySelectorAll('#marked span').length===6,'word-by-word marks');ok(c.document.querySelector('#unknown button'),'unknown-word add action');
 c.document.querySelector('#unknown button').click();for(const [key,value]of Object.entries({phonics_skill:'custom skill; sh',syllables:'1',unit:'2',lesson:'8',ufli_lesson:'56'}))c.document.getElementById('tag-'+key).value=value;
 c.document.getElementById('addForm').dispatchEvent(new c.Event('submit',{bubbles:true,cancelable:true}));
 ok(c.BANK.lookup('zzyxword').length===1,'tagged word saved');ok(!c.CHECKER.report.unknown.some(x=>x.word==='zzyxword'),'recheck removes added word from unknown');ok(c.CHECKER.report.flagged.some(x=>x.word==='zzyxword'),'before-lesson cutoff remains applied');
 c.document.getElementById('timing').value='after';c.CHECKER.check();ok(c.CHECKER.report.words.find(x=>x.word==='zzyxword').status==='decodable','after-lesson boundary releases word');
 const saved={'tpt-wordbank-additions-v1':c.localStorage.getItem('tpt-wordbank-additions-v1')},restored=await load('index.html',saved);restored.w.APP.select('UFLI Lesson 56');ok(restored.w.SKILLS.find(s=>s.name==='UFLI Lesson 56').decodable.some(x=>x[0]==='zzyxword'),'saved words available on Product Maker');restored.w.close();
 c.document.getElementById('curriculum').value='ufli';c.document.getElementById('curriculum').dispatchEvent(new c.Event('change'));ok(c.document.getElementById('unitWrap').hidden&&!c.document.getElementById('heartsWrap').hidden,'curriculum controls switch');
 // DOCX and PPTX actual zipped document text, including paragraph and slide order.
 for(const [ext,files,expected]of [['docx',{'word/document.xml':'<w:document xmlns:w="w"><w:p><w:r><w:t>Cat </w:t></w:r><w:r><w:t>sat.</w:t></w:r></w:p><w:p><w:r><w:t>The cat.</w:t></w:r></w:p></w:document>'},'Cat sat.\nThe cat.'],['pptx',{'ppt/slides/slide2.xml':'<a:p xmlns:a="a"><a:r><a:t>Second</a:t></a:r></a:p>','ppt/slides/slide1.xml':'<a:p xmlns:a="a"><a:r><a:t>First</a:t></a:r></a:p>'},'First\nSecond']]){
  const z=new c.JSZip();for(const [name,text]of Object.entries(files))z.file(name,text);const bytes=await z.generateAsync({type:'uint8array'});const text=await c.TEXTFILES.read({name:'story.'+ext,size:bytes.length,arrayBuffer:async()=>bytes.buffer});ok(text===expected,ext+' text extraction and order');
 }
 ok(await c.TEXTFILES.read({name:'story.txt',size:20,text:async()=>'Cat sat.'})==='Cat sat.','TXT import');
 c.document.getElementById('story').value='<script>alert(1)</script> cat';c.CHECKER.check();ok(!c.document.querySelector('#marked script'),'story treated as text, never HTML');
 c.close();w.close();console.log(checks+' offline feature checks passed; exports in '+OUT);
})().catch(e=>{console.error(e);process.exit(1);});
