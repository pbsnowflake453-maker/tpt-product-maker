// Shared word-bank lookup. Browser additions are private to this browser; export CSV to keep a portable copy.
(function(){
const SOURCE=window.WORDBANK, KEY='tpt-wordbank-additions-v1';
const norm=w=>String(w).normalize('NFC').replace(/[’‘]/g,"'").toLowerCase();
const tags=r=>String(r.phonics_skill||'').split(';').map(s=>s.trim()).filter(Boolean);
const lesson=r=>Number(r.ufli_heart==='yes'?r.ufli_decodable_lesson:r.ufli_lesson)||null;
let additions=[], storageError='';
function validate(input){
  const r=Object.fromEntries(SOURCE.fields.map(k=>[k,String(input[k]??'').trim()]));
  r.word=norm(r.word);
  if(!/^[\p{L}]+(?:['-][\p{L}]+)*$/u.test(r.word))throw Error('Enter one word, with letters, apostrophes or hyphens only.');
  if(!tags(r).length)throw Error('Add at least one phonics skill tag.');
  if(/[<>\x00-\x1f]/.test(r.phonics_skill))throw Error('Use plain text for phonics skill tags.');
  if(!/^[1-9]\d?$/.test(r.syllables))throw Error('Enter the number of syllables (1–99).');
  for(const k of ['tricky','drawable','is_name','ufli_heart'])if(!['yes','no'].includes(r[k]))throw Error('Choose yes or no for '+k+'.');
  if(Boolean(r.unit)!==Boolean(r.lesson))throw Error('Give both a CKLA unit and lesson, or leave both blank.');
  if(r.unit&&(!/^[1-7]$/.test(r.unit)||!/^[1-9]\d?$/.test(r.lesson)))throw Error('CKLA needs unit 1–7 and lesson 1–99.');
  for(const k of ['ufli_lesson','ufli_decodable_lesson'])if(r[k]&&(!/^\d+$/.test(r[k])||Number(r[k])<1||Number(r[k])>128))throw Error('UFLI lessons must be 1–128.');
  if(r.ufli_decodable_lesson&&(!r.ufli_lesson||r.ufli_heart!=='yes'||Number(r.ufli_decodable_lesson)<Number(r.ufli_lesson)))throw Error('A later decodable lesson needs a heart-word introduction at or before that lesson.');
  r.sequence=r.unit?String(Number(r.unit)*100+Number(r.lesson)):'';
  r.form=r.form||'base';r.starts_with=r.word[0];r.phonics_skill=tags(r).join('; ');
  return r;
}
try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(saved))throw Error();additions=saved.map(validate);}catch(e){storageError='Saved additions could not be loaded. Export a backup before clearing browser storage.';}
const rows=()=>SOURCE.rows.concat(additions);
let index=new Map();
function rebuild(){index=new Map();for(const r of rows()){const k=norm(r.word);if(!index.has(k))index.set(k,[]);index.get(k).push(r);}}
function lookup(w){return index.get(norm(w))||[];}
function state(w,level){
  const rs=lookup(w);if(!rs.length)return {status:'unknown',reason:'Not in word bank'};
  const limit=Number(level.lesson)+(level.timing==='before'?-1:0), unit=Number(level.unit);
  const allowed=[],hearts=[],later=[];
  for(const r of rs){
    if(level.curriculum==='ufli'){
      const d=lesson(r),h=Number(r.ufli_lesson)||null;
      if(d&&d<=limit)allowed.push(r);
      else if(level.hearts&&r.ufli_heart==='yes'&&h&&h<=limit)hearts.push(r);
      if(d||h)later.push(`UFLI ${r.ufli_heart==='yes'?'heart word ':''}lesson ${h||d}${r.ufli_decodable_lesson?' · decodable lesson '+r.ufli_decodable_lesson:''}`);
    }else{
      const seq=Number(r.sequence);if(!seq)continue;
      const cutoff=unit*100+limit;
      if(seq<=cutoff||(level.unit1Review&&unit===1&&Number(r.unit)===1&&r.tricky==='no'))(r.tricky==='yes'?hearts:allowed).push(r);
      later.push(`CKLA Unit ${r.unit} Lesson ${r.lesson}${r.tricky==='yes'?' · tricky word':''}`);
    }
  }
  if(allowed.length)return {status:'decodable',reason:'Within selected level'};
  if(hearts.length)return {status:'heart',reason:level.curriculum==='ufli'?'Previously introduced heart word':'Previously introduced tricky word'};
  return {status:later.length?'later':'unmapped',reason:later.length?[...new Set(later)].join('; '):'In bank, but no '+level.curriculum.toUpperCase()+' lesson tag'};
}
function tokenize(text){return [...String(text).normalize('NFC').replace(/[’‘]/g,"'").matchAll(/[\p{L}\p{M}]+(?:['-][\p{L}\p{M}]+)*/gu)].map(m=>({word:m[0],key:norm(m[0]),start:m.index,end:m.index+m[0].length}));}
function analyze(text,level){
  const tokens=tokenize(text),map=new Map();
  for(const t of tokens){if(!map.has(t.key))map.set(t.key,{word:t.key,count:0,tags:[...new Set(lookup(t.key).flatMap(tags))].sort(),...state(t.key,level)});map.get(t.key).count++;}
  const words=[...map.values()].sort((a,b)=>a.word.localeCompare(b.word));
  // One row per word. All its tags are shown together, so multi-tag words never appear twice.
  const sorted=words.slice().sort((a,b)=>(a.tags.join('; ')||'~').localeCompare(b.tags.join('; ')||'~')||a.word.localeCompare(b.word));
  return {tokens,words,sorted,flagged:words.filter(w=>['later','unmapped'].includes(w.status)),unknown:words.filter(w=>w.status==='unknown')};
}
function add(input){const r=validate(input);if(lookup(r.word).length)throw Error('That word is already in the bank.');const next=additions.concat(r);localStorage.setItem(KEY,JSON.stringify(next));additions=next;rebuild();refreshSkills();window.dispatchEvent(new Event('wordbankchange'));return r;}
function importAdditions(data){if(!Array.isArray(data))throw Error('Expected an additions JSON array.');const next=additions.slice(),seen=new Set(rows().map(r=>norm(r.word)));for(const item of data){const r=validate(item);if(!seen.has(r.word)){next.push(r);seen.add(r.word);}}localStorage.setItem(KEY,JSON.stringify(next));additions=next;rebuild();refreshSkills();window.dispatchEvent(new Event('wordbankchange'));}
function csv(data=rows(),fields=SOURCE.fields){const cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';return [fields.map(cell).join(','),...data.map(r=>fields.map(k=>cell(r[k])).join(','))].join('\r\n');}
const originals=window.SKILLS?JSON.parse(JSON.stringify(SKILLS)):[];
function refreshSkills(){
  if(!window.SKILLS)return;
  SKILLS.splice(0,SKILLS.length,...JSON.parse(JSON.stringify(originals)));
  const regular=additions.filter(r=>r.tricky==='no'&&r.is_name==='no'&&r.form==='base');
  const tuple=r=>[r.word,Number(r.syllables),Number(r.sequence)||0];
  for(const s of SKILLS){
    if(s.curriculum==='ufli')continue;
    const u=s.name.match(/^(Through )?Unit (\d)$/);
    if(u)for(const r of regular)if(r.unit&&(u[1]?Number(r.unit)<=Number(u[2]):r.unit===u[2]))s.decodable.push(tuple(r));
  }
  for(const s of SKILLS.filter(s=>s.match)){
    const m=s.match;
    for(const r of additions){
      if(!r.sequence||r.is_name==='yes'||r.tricky!==m.tricky||!m.forms.includes(r.form))continue;
      if(m.tags&&!m.tags.every(t=>tags(r).includes(t)))continue;
      if(m.structure&&r.structure!==m.structure||m.suffix&&!r.word.endsWith(m.suffix))continue;
      if(['ending_sound','spelling_change'].some(k=>m[k]&&r[k]!==m[k]))continue;
      if(m.contains&&Object.entries(m.contains).some(([k,v])=>!r[k].includes(v)))continue;
      const target=Number(r.sequence)<=s.pos?s.decodable:s.challenge;
      if(!target.some(w=>w[0]===r.word))target.push(tuple(r));
    }
  }
  for(const s of SKILLS.filter(s=>s.group==='Categories'&&s.members)){
    for(const name of s.members){const member=SKILLS.find(x=>x.name===name);if(!member)continue;
      for(const type of ['decodable','challenge'])for(const entry of member[type])if(!s.decodable.some(w=>w[0]===entry[0])&&!s.challenge.some(w=>w[0]===entry[0]))s[type].push(entry);
    }
  }
  for(let n=1;n<=128;n++)for(const cumulative of [false,true]){
    const name=`UFLI ${cumulative?'Through ':''}Lesson ${n}`;
    const rs=rows().filter(r=>r.is_name==='no'&&lesson(r)&&(cumulative?lesson(r)<=n:lesson(r)===n));
    if(!rs.length)continue;
    let s=SKILLS.find(s=>s.name===name);if(!s){s={name,disp:name,group:cumulative?'UFLI Cumulative':'UFLI Lessons',category:true,curriculum:'ufli',lesson:n,cumulative,placement:`Lesson ${n}`,pos:0,challenge:[]};SKILLS.push(s);}
    s.decodable=[...new Map(rs.map(r=>[r.word,tuple(r)])).values()];s.pos=Math.max(...s.decodable.map(x=>x[2]));
  }
  for(const tag of [...new Set(regular.flatMap(tags))]){const rs=regular.filter(r=>tags(r).includes(tag));SKILLS.push({name:'My Words: '+tag,disp:'My Words: '+tag,group:'My Added Words',category:true,placement:'Custom tags',pos:Math.max(...rs.map(r=>Number(r.sequence)||0)),decodable:rs.map(tuple),challenge:[]});}
}
rebuild();refreshSkills();
if(window.WORDINFO){
  const drawable=additions.filter(r=>r.drawable==='yes'&&r.tricky==='no'&&r.is_name==='no').map(r=>r.word);
  WORDINFO.drawable=[...new Set(WORDINFO.drawable.split(' ').concat(drawable))].join(' ');
  for(const r of additions.filter(r=>r.tricky==='yes'&&r.form==='base'&&r.is_name==='no'&&r.sequence))WORDINFO.tricky.push([r.word,Number(r.sequence)]);
}
window.BANK={norm,tags,lesson,lookup,state,tokenize,analyze,add,importAdditions,csv,rows,fields:SOURCE.fields,get additions(){return additions.slice();},get storageError(){return storageError;}};
})();
