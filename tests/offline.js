// Offline DOM/canvas integration harness. Does not replace real-browser layout checks.
// Dependencies: jsdom (JSDOM module path), @napi-rs/canvas (CANVAS module path).
const {JSDOM}=require(process.env.JSDOM||'/tmp/tpt-test-runtime/node_modules/jsdom');
const fs=require('fs'), path=require('path');
const C=require(process.env.CANVAS||(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas'));
const root=process.cwd()+'/site/';
for(const [f,fam] of [['Andika-Regular.ttf','Andika'],['Andika-Bold.ttf','Andika'],['Pacifico-Regular.ttf','Pacifico'],['Fredoka-Bold.ttf','Fredoka'],['GelPenSerif.ttf','GelPenSerif']])C.GlobalFonts.registerFromPath(root+'fonts/'+f,fam);
async function load(page='index.html',saved={}){
 const dom=new JSDOM(fs.readFileSync(root+page,'utf8'),{runScripts:'outside-only',url:'http://localhost/'+page,pretendToBeVisual:true});const w=dom.window;
 for(const [k,v]of Object.entries(saved))w.localStorage.setItem(k,v);
 w.setImmediate=setImmediate;w.clearImmediate=clearImmediate;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;
 const canvases=new WeakMap();
 const native=e=>{if(e instanceof w.HTMLCanvasElement){let c=canvases.get(e);if(!c){c=C.createCanvas(e.width,e.height);canvases.set(e,c);}if(c.width!==e.width)c.width=e.width;if(c.height!==e.height)c.height=e.height;return c;}return e;};
 w.HTMLCanvasElement.prototype.getContext=function(type){const thisCanvas=this;const ctx=native(this).getContext(type);return new Proxy(ctx,{get(o,k){native(thisCanvas);if(k==='drawImage')return (im,...args)=>o.drawImage(native(im),...args);return typeof o[k]==='function'?o[k].bind(o):o[k];},set(o,k,v){native(thisCanvas);o[k]=v;return true;}});};
 w.HTMLCanvasElement.prototype.toDataURL=function(){return native(this).toDataURL();};
 w.HTMLCanvasElement.prototype.toBlob=function(fn){fn(new w.Blob([native(this).toBuffer('image/png')],{type:'image/png'}));};
 w.Image=class extends C.Image {set src(v){const loaded=this.onload,failed=this.onerror;this.ready=new Promise((res,rej)=>{this.onload=(...a)=>{if(loaded)loaded(...a);res();};this.onerror=(...a)=>{if(failed)failed(...a);rej(...a);};});super.src=/^(data:|\/)/.test(v)?v:root+v;} get src(){return super.src;}async decode(){await this.ready;}};
 w.FontFace=class{async load(){return this;}};w.document.fonts={add(){}};
 w.fetch=async url=>{const f=fs.readFileSync(root+url);return {arrayBuffer:async()=>f.buffer.slice(f.byteOffset,f.byteOffset+f.byteLength)};};
 w.HTMLElement.prototype.scrollIntoView=function(){};w.URL.createObjectURL=()=>'';w.URL.revokeObjectURL=()=>{};
 for(const script of w.document.querySelectorAll('script[src]')){const file=script.getAttribute('src');w.eval(fs.readFileSync(root+file,'utf8')+'\n//# sourceURL='+file);}
 for(let i=0;i<100&&!w.APP&&page==='index.html';i++)await new Promise(r=>setTimeout(r,10));
 if(page==='listing.html')for(let i=0;i<100&&!/^Drop/.test(w.document.getElementById('status').textContent);i++)await new Promise(r=>setTimeout(r,10));
 return {w,dom,native};
}
module.exports={load,root};
