// Searchable, grouped, collapsible skill picker (combobox). SkillPicker({list, selected:()=>[skills], onPick(skill), multi:()=>bool, compact})
(function(){
const READ_SECTIONS=[['CKLA Units',s=>s.group==='CKLA Units'],['Through Unit',s=>s.group==='Through Unit'],['Categories',s=>s.group==='Categories'],['Single Skills',s=>!s.category]];
let open=null; document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){open.classList.remove('open');open=null;}}); document.addEventListener('pointerdown',e=>{if(open&&!open.contains(e.target)){open.classList.remove('open');open=null;}});
window.SkillPicker=function(o){
  const root=document.createElement('div'); root.className='picker'+(o.compact?' compact':'');
  const btn=document.createElement('button'); btn.type='button'; btn.className='pk-btn';
  const panel=document.createElement('div'); panel.className='pk-panel';
  const q=document.createElement('input'); q.placeholder='Search (e.g. unit 4, short a, sh, add within 10)'; q.className='pk-q';
  const body=document.createElement('div'); body.className='pk-body'; panel.append(q,body); root.append(btn,panel);
  const collapsed={};
  function sections(){const L=o.list(); if(L[0]&&L[0].decodable) return READ_SECTIONS.map(([n,f])=>[n,L.filter(f)]);
    const g=[];L.forEach(s=>{let x=g.find(y=>y[0]===s.group);if(!x)g.push(x=[s.group,[]]);x[1].push(s);});return g;}
  const count=s=>s.decodable?s.decodable.length:MATH.bank(s).length;
  function label(){const sel=o.selected().filter(Boolean); btn.textContent=(sel.length?sel.map(s=>s.disp||s.name).join(' + '):'Choose a skill')+' ▾'; btn.title=btn.textContent;}
  function render(){const t=q.value.trim().toLowerCase(), sel=o.selected(); body.innerHTML='';
    for(const [name,items] of sections()){
      const m=items.filter(s=>!t||(s.disp||s.name).toLowerCase().includes(t)||s.name.toLowerCase().includes(t)||(s.group||'').toLowerCase().includes(t)||(s.members||[]).some(x=>x.toLowerCase()===t)); if(!m.length) continue;
      const has=m.some(s=>sel.includes(s)); if(collapsed[name]===undefined) collapsed[name]=!has;
      const h=document.createElement('div'); h.className='pk-sec'; const shut=collapsed[name]&&!t; h.textContent=(shut?'▸ ':'▾ ')+name+` (${m.length})`;
      h.onclick=()=>{collapsed[name]=!collapsed[name];render();}; body.appendChild(h); if(shut) continue;
      let sub=null; for(const s of m){ if(name==='Single Skills'&&s.group!==sub){sub=s.group;const g=document.createElement('div');g.className='grp';g.textContent=sub;body.appendChild(g);}
        const d=document.createElement('div'); d.className='sk'+(sel.includes(s)?' on':''); d.innerHTML=`${s.disp||s.name}<span>${count(s)}</span>`;
        if(s.members) d.title=s.members.map(m=>{const k=(window.SKILLS||[]).find(x=>x.name===m);return k?(k.disp||k.name):m;}).join(', ');
        d.onclick=()=>{o.onPick(s); label(); if(o.multi&&o.multi()) render(); else {root.classList.remove('open');open=null;}}; body.appendChild(d);}
    }
    if(!body.children.length) body.innerHTML='<div class="sk">No matches</div>';}
  btn.onclick=()=>{if(root.classList.toggle('open')){if(open&&open!==root)open.classList.remove('open');open=root;q.value='';render();q.focus();}else open=null;};
  q.oninput=render; root.refresh=()=>{label();if(root.classList.contains('open'))render();}; label(); return root;};
})();
