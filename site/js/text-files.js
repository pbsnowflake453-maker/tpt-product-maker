// Extract text only; no document markup is inserted into the page.
window.TEXTFILES={async read(file){
  const ext=file.name.split('.').pop().toLowerCase();
  if(file.size>30*1024*1024)throw Error('Please use a file smaller than 30 MB.');
  if(['txt','md','csv'].includes(ext))return file.text();
  if(ext==='pdf'){
    const pdf=await import(new URL('vendor/pdf.min.mjs',document.baseURI).href);pdf.GlobalWorkerOptions.workerSrc=new URL('vendor/pdf.worker.min.mjs',document.baseURI).href;
    const task=pdf.getDocument({data:new Uint8Array(await file.arrayBuffer())});
    try{const doc=await task.promise;const lines=[];for(let n=1;n<=doc.numPages;n++){const page=await doc.getPage(n),content=await page.getTextContent();lines.push(content.items.map(x=>x.str+(x.hasEOL?'\n':' ')).join(''));}const text=lines.join('\n');if(!text.trim())throw Error('This PDF has no selectable text. Paste the story or upload a text-based PDF.');return text;}finally{await task.destroy();}
  }
  if(['docx','pptx'].includes(ext)){
    const zip=await JSZip.loadAsync(await file.arrayBuffer()), names=ext==='docx'?['word/document.xml']:Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>Number(a.match(/(\d+)\.xml/)[1])-Number(b.match(/(\d+)\.xml/)[1]));
    const parts=[];let size=0;
    for(const name of names){const f=zip.file(name);if(!f)throw Error('Could not find document text in this file.');const raw=await f.async('string');size+=raw.length;if(size>30*1024*1024)throw Error('Document text is too large.');const xml=new DOMParser().parseFromString(raw,'application/xml');if(xml.querySelector('parsererror'))throw Error('Could not read document XML.');const ps=[...xml.getElementsByTagNameNS('*','p')];parts.push(ps.map(p=>[...p.getElementsByTagNameNS('*','t')].map(t=>t.textContent).join('')).join('\n'));}
    const text=parts.join('\n');if(!text.trim())throw Error('No text found in the document.');return text;
  }
  throw Error('Use TXT, Markdown, CSV, PDF, DOCX or PPTX.');
}};
