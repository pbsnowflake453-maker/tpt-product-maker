(function(){
const T=TPT, PW=T.PH, PH=T.PW;
function display(sk){
  const n=sk.name, d=sk.disp||n;
  if(sk.category) return d;
  let m;
  if(sk.pos<2000&&(m=d.match(/^(\S+) \((.+)\)$/))) return '/'+m[1]+'/ ('+m[2]+')';
  if(m=n.match(/^Short ([aeiou]) CVC/)) return 'short '+m[1];
  const tok=n.split(/ \(|,| and /)[0].trim();
  return '/'+tok+'/';
}
function pools(sk){
  const dec=sk.decodable.map(x=>x[0]);
  const ch=sk.challenge.map(x=>x[0]);
  return {reg:dec.length?dec:ch, ch};
}
function priorWords(skills, upToPos){
  const out=[];
  for(const s of skills){
    if(s.pos<upToPos && !s.category) out.push(...(s.decodable||[]).map(x=>x[0]));
  }
  return out;
}
function randomSimplePath(rows, cols, rng){
  const dirs=[[0,1],[1,0],[0,-1],[-1,0]];
  for(let attempt=0;attempt<200;attempt++){
    const path=[[0,0]];
    const visited=new Set(['0,0']);
    let r=0,c=0,ok=true;
    while(r!==rows-1||c!==cols-1){
      const opts=dirs.filter(([dr,dc])=>{
        const nr=r+dr,nc=c+dc;
        return nr>=0&&nr<rows&&nc>=0&&nc<cols&&!visited.has(nr+','+nc);
      });
      if(!opts.length){ok=false;break;}
      const [dr,dc]=opts[Math.floor(rng()*opts.length)];
      r+=dr;c+=dc;path.push([r,c]);visited.add(r+','+c);
    }
    if(!ok||path.length<Math.max(6,Math.floor(rows*cols*0.35))) continue;
    let valid=true;
    for(let i=0;i<path.length;i++){
      let n=0;
      for(let j=0;j<path.length;j++) if(i!==j&&Math.abs(path[i][0]-path[j][0])+Math.abs(path[i][1]-path[j][1])===1) n++;
      const exp=(i===0||i===path.length-1)?1:2;
      if(n!==exp){valid=false;break;}
    }
    if(valid) return path;
  }
  const p=[];
  for(let c=0;c<cols;c++) p.push([0,c]);
  for(let r=1;r<rows;r++) p.push([r,cols-1]);
  return p;
}
function fillWords(path, rows, cols, matchList, otherList, rng){
  const pathSet=new Set(path.map(([r,c])=>r+','+c));
  const grid=Array.from({length:rows},()=>Array(cols).fill(''));
  const usedMatch=new Set(), usedOther=new Set();
  function pick(list, used, avoidAdj){
    const avail=list.filter(w=>!used.has(w));
    const pool=avail.length?avail:list;
    for(let k=0;k<30;k++){
      const w=pool[Math.floor(rng()*pool.length)];
      if(!avoidAdj || !avoidAdj.has(w)) return w;
    }
    return pool[Math.floor(rng()*pool.length)];
  }
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const isP=pathSet.has(r+','+c);
    const adj=new Set();
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>{
      const nr=r+dr,nc=c+dc;
      if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&grid[nr][nc]) adj.add(grid[nr][nc]);
    });
    if(isP){
      const w=pick(matchList, usedMatch, adj);
      grid[r][c]=w; usedMatch.add(w);
    }else{
      const w=pick(otherList.length?otherList:['the','and','for','was'], usedOther, adj);
      grid[r][c]=w; usedOther.add(w);
    }
  }
  return grid;
}
function mazePage(grid, path, label, answer){
  const p=new T.Page('P'); T.frame(p);
  p.text(0.5,0.35,2.0,0.3,'Name:',{size:14,align:'left'}); p.line(1.35,0.6,3.6,0.6,{lw:1});
  const bw=Math.min(5.2,Math.max(2.2,T.textW('Skill: '+label,'Andika',15,true)+0.4));
  T.bubble(p,PW-0.45-bw,0.32,bw,0.45,'Skill: '+label,{size:15});
  p.text(0,0.85,PW,0.45,'Word Maze',{font:'Pacifico',size:28});
  p.text(0.45,1.35,PW-0.9,0.3,'Color the words with the target sound to make a path from the arrow to the star.',{size:12,align:'left'});
  const rows=grid.length, cols=grid[0].length;
  const pathSet=new Set(path.map(([r,c])=>r+','+c));
  const left=0.65, top=1.75;
  const maxW=PW-1.4, maxH=PH-top-0.7;
  const cell=Math.min(maxW/cols, maxH/rows);
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const x=left+c*cell, y=top+r*cell;
    const isP=answer && pathSet.has(r+','+c);
    p.rect(x,y,cell-0.05,cell-0.05,{lw:1.2,fill:isP?'EEEEEE':'FFFFFF'});
    p.text(x,y,cell-0.05,cell-0.05,grid[r][c],{size:T.fit(grid[r][c],'Andika',Math.max(11,Math.floor(cell*11)),false,cell-0.2)});
  }
  const arrowY=top+cell/2-0.03;
  p.line(0.2,arrowY,0.5,arrowY,{lw:2.5});
  p.shape('triR',0.4,arrowY-0.12,0.22,0.24,{fill:'000000',line:null});
  const starY=top+(rows-1)*cell+cell/2-0.14;
  p.shape('star5',left+cols*cell+0.02,starY,0.3,0.3,{fill:'000000',line:null});
  T.footer(p); return p;
}
function howTo(){
  const p=new T.Page('P'); T.frame(p);
  p.text(0,0.55,PW,0.85,'How to Use',{font:'Pacifico',size:36});
  const lines=[
    '1. Look at the skill at the top.',
    '2. Color the words that match the skill.',
    '3. The colored words should make a path from the arrow to the star.',
    '4. You can only move left, right, up, or down (not diagonally).',
    '5. Check your work with the answer key if you have one.'
  ];
  let y=1.7;
  lines.forEach(l=>{p.text(0.7,y,PW-1.4,0.4,l,{size:16,align:'left'}); y+=0.5;});
  T.footer(p); return p;
}
function cover(label, sub){
  const p=new T.Page('P');
  p.rect(0.25,0.25,PW-0.5,PH-0.5,{r:0.28,lw:4,fill:'FFFFFF'});
  p.text(0,0.8,PW,1.0,'Word Maze',{font:'Pacifico',size:48});
  const bw=Math.min(7.5,Math.max(3,T.textW(label,'Andika',28,true)+0.6));
  T.bubble(p,PW/2-bw/2,2.0,bw,0.75,label,{size:28});
  p.text(0,2.9,PW,0.4,sub,{size:15});
  p.image(PW/2-1.1,PH-3.2,2.2,2.2);
  p.text(0,PH-0.7,PW,0.3,T.STORE,{size:12});
  return p;
}
T.products.push({
  id:'wordmaze', name:'Word Maze', title:'Word Maze', orient:'P', kinds:['reading'], multiSkill:true,
  section(cfg, seed){
    const skills=cfg.skills.slice(0,1), r=T.rng(seed);
    const sk=skills[0];
    const size=cfg.opts&&cfg.opts.mazeSize||'5x5';
    const [rows,cols]=size.split('x').map(Number);
    const matchList=pools(sk).reg;
    let otherList=[];
    if(cfg.opts&&cfg.opts.otherSkill){
      const os=T.SKILLS.find(s=>s.name===cfg.opts.otherSkill);
      if(os) otherList=pools(os).reg;
    }
    if(!otherList.length) otherList=priorWords(T.SKILLS||[], sk.pos||9999);
    if(!otherList.length) otherList=['the','and','for','was','you','are'];
    const path=randomSimplePath(rows,cols,r);
    const grid=fillWords(path,rows,cols,matchList,otherList,r);
    const label=cfg.label||display(sk);
    const pages=[mazePage(grid,path,label,false), mazePage(grid,path,label,true)];
    const info=`<b>${label}</b><br>${rows}×${cols} · ${path.length} steps`;
    return {label,pages,preview:pages[0],info,chal:false};
  },
  directions(){ return [howTo()]; },
  cover(secs){
    const one=secs.length===1, s0=secs[0];
    const sub=one?'Color the path  •  Answer key':'Multiple mazes  •  How to Use  •  Answer keys';
    return cover(T.skillsText(secs),sub);
  }
});
})();
