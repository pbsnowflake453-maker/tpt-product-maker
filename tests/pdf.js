// Real vendored pdf.js extraction, using Node's fake worker and the offline DOM host.
const {load,root}=require('./offline');const fs=require('fs'),assert=require('assert');
(async()=>{
 const C=require(process.env.CANVAS||(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas'));
 Object.assign(globalThis,{DOMMatrix:C.DOMMatrix,Path2D:C.Path2D,ImageData:C.ImageData});
 // Node 24 lacks these newer standard APIs used by the vendored browser pdf.js.
 Uint8Array.prototype.toHex||=function(){return Buffer.from(this).toString('hex');};Math.sumPrecise||=items=>[...items].reduce((a,b)=>a+b,0);
 const {w:maker}=await load();maker.APP.select('UFLI Lesson 56');const bytes=new Uint8Array(maker.TPT.pdfDoc(maker.APP.cur.pages).output('arraybuffer'));maker.close();
 const {w}=await load('checker.html');w.Uint8Array.prototype.toHex=function(){return Buffer.from(this).toString('hex');};
 const pdf=await import('file://'+root+'vendor/pdf.min.mjs');
 w.importPdf=async()=>({...pdf,GlobalWorkerOptions:{set workerSrc(v){pdf.GlobalWorkerOptions.workerSrc='file://'+root+'vendor/pdf.worker.min.mjs';}}});
 // Substitute module resolution only; extraction and cleanup run unchanged.
 w.eval(fs.readFileSync(root+'js/text-files.js','utf8').replace("await import(new URL('vendor/pdf.min.mjs',document.baseURI).href)","await window.importPdf()"));
 const text=await w.TEXTFILES.read({name:'story.pdf',size:bytes.length,arrayBuffer:async()=>new w.Uint8Array(bytes).buffer});
 assert(text.includes('UFLI Lesson 56'));assert(text.includes('Roll and Read'));assert(text.includes('Terms of Use'));
 await assert.rejects(w.TEXTFILES.read({name:'large.pdf',size:31*1024*1024}),/smaller/);
 await assert.rejects(w.TEXTFILES.read({name:'image.jpg',size:1}),/Use TXT/);
 console.log('PDF text extraction, worker cleanup, large-file rejection and unsupported-file checks passed');w.close();
})().catch(e=>{console.error(e);process.exit(1);});
