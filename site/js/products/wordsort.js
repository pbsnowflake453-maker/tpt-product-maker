(function(){
const T=TPT, PW=T.PH, PH=T.PW; // portrait
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
function howTo(cut){
  const p=new T.Page('P'); T.frame(p);
  p.text(0,0.55,PW,0.85,'How to Use',{font:'Pacifico',size:36});
  const lines=cut?[
    '1. Look at the chart at the top. The headers show the skills.',
    '2. Cut apart the word cards at the bottom.',
    '3. Glue each word card under the correct skill header.',
    '4. Check your work with the answer key if you have one.'
  ]:[
    '1. Read the word bank at the top.',
    '2. Decide which skill each word matches.',
    '3. Write the word in the correct box under that skill.',
    '4. Check your work with the answer key if you have one.'
  ];
  let y=1.7;
  lines.forEach(l=>{p.text(0.7,y,PW-1.4,0.4,l,{size:16,align:'left'}); y+=0.5;});
  T.footer(p); return p;
}
function cutPastePage(skills, words, label){
  const p=new T.Page('P'); T.frame(p);
  p.text(0.5,0.4,2.0,0.32,'Name:',{size:14,align:'left'}); p.line(1.4,0.68,3.8,0.68,{lw:1});
  const bw=Math.min(5.2,Math.max(2.2,T.textW('Skill: '+label,'Andika',16,true)+0.45));
  T.bubble(p,PW-0.5-bw,0.38,bw,0.5,'Skill: '+label,{size:16});
  p.text(0,0.95,PW,0.5,'Word Sort',{font:'Pacifico',size:30});

  const n=skills.length, top=1.5, headerH=0.5, glueH=5.4, left=0.45, totalW=PW-0.9, cW=totalW/n;
  skills.forEach((sk,i)=>{
    const x=left+i*cW;
    p.rect(x,top,cW,headerH,{r:0,lw:2,fill:'FFFFFF'});
    p.text(x,top,cW,headerH,display(sk),{bold:true,size:13});
  });
  p.rect(left,top+headerH,totalW,glueH,{lw:2,fill:'FFFFFF'});
  for(let i=1;i<n;i++) p.line(left+i*cW,top,left+i*cW,top+headerH+glueH,{lw:1.5});

  const cardTop=top+headerH+glueH+0.3;
  const rows=Math.ceil(words.length/4), cols=4;
  const tableW=totalW, tableH=Math.min(3.1, rows*0.85);
  const cellW=tableW/cols, cellH=tableH/rows;
  p.rect(left,cardTop,tableW,tableH,{lw:1.8,dash:'dash',fill:'FFFFFF'});
  for(let c=1;c<cols;c++) p.line(left+c*cellW,cardTop,left+c*cellW,cardTop+tableH,{lw:1.8,dash:'dash'});
  for(let r=1;r<rows;r++) p.line(left,cardTop+r*cellH,left+tableW,cardTop+r*cellH,{lw:1.8,dash:'dash'});
  words.forEach((w,i)=>{
    const c=i%cols, r=Math.floor(i/cols);
    const x=left+c*cellW, y=cardTop+r*cellH;
    p.text(x,y,cellW,cellH,w,{size:T.fit(w,'Andika',15,false,cellW-0.15)});
  });
  T.footer(p); return p;
}
function writeInPage(skills, words, label){
  const p=new T.Page('P'); T.frame(p);
  p.text(0.5,0.4,2.0,0.32,'Name:',{size:14,align:'left'}); p.line(1.4,0.68,3.8,0.68,{lw:1});
  const bw=Math.min(5.2,Math.max(2.2,T.textW('Skill: '+label,'Andika',16,true)+0.45));
  T.bubble(p,PW-0.5-bw,0.38,bw,0.5,'Skill: '+label,{size:16});
  p.text(0,0.95,PW,0.5,'Word Sort',{font:'Pacifico',size:30});

  const bankTop=1.55, bankH=1.7, left=0.5, totalW=PW-1.0;
  p.rect(left,bankTop,totalW,bankH,{r:0.08,lw:1.8,fill:'FFFFFF'});
  const cols=4, rows=Math.ceil(words.length/cols);
  const cellW=totalW/cols, cellH=(bankH-0.2)/Math.max(rows,1);
  words.forEach((w,i)=>{
    const c=i%cols, r=Math.floor(i/cols);
    p.text(left+c*cellW, bankTop+0.1+r*cellH, cellW, cellH, w, {size:15, align:'center'});
  });

  const n=skills.length, top=bankTop+bankH+0.2, headerH=0.5;
  const remaining=PH-top-0.6;
  const boxRows=7, boxH=Math.min(0.75, (remaining-headerH)/boxRows);
  const chartH=headerH+boxRows*boxH, cW=totalW/n;
  p.rect(left,top,totalW,chartH,{lw:1.8,fill:'FFFFFF'});
  for(let i=1;i<n;i++) p.line(left+i*cW,top,left+i*cW,top+chartH,{lw:1.2});
  for(let r=1;r<=boxRows;r++){
    const y=top+headerH+(r-1)*boxH;
    p.line(left,y,left+totalW,y,{lw:1});
  }
  skills.forEach((sk,i)=>{
    const x=left+i*cW;
    p.rect(x,top,cW,headerH,{lw:1.5,fill:'FFFFFF'});
    p.text(x,top,cW,headerH,display(sk),{bold:true,size:13});
  });
  T.footer(p); return p;
}
function answerKey(skills, wordLists, label){
  const p=new T.Page('P'); T.frame(p);
  p.text(0,0.5,PW,0.7,'Answer Key',{font:'Pacifico',size:32});
  const bw=Math.min(6,Math.max(2.5,T.textW(label,'Andika',18,true)+0.5));
  T.bubble(p,PW/2-bw/2,1.3,bw,0.5,label,{size:16});
  const n=skills.length, top=2.1, cW=(PW-1.2)/n;
  skills.forEach((sk,i)=>{
    const x=0.6+i*cW;
    p.rect(x,top,cW-0.1,0.45,{r:0.1,lw:1.5});
    p.text(x,top,cW-0.1,0.45,display(sk),{bold:true,size:13});
    const list=wordLists[i]||[];
    list.forEach((w,j)=>p.text(x+0.1,top+0.55+j*0.32,cW-0.2,0.3,w,{size:13,align:'left'}));
  });
  T.footer(p); return p;
}
function cover(label, sub){
  const p=new T.Page('P');
  p.rect(0.25,0.25,PW-0.5,PH-0.5,{r:0.28,lw:4,fill:'FFFFFF'});
  p.text(0,0.8,PW,1.0,'Word Sort',{font:'Pacifico',size:48});
  const bw=Math.min(7.5,Math.max(3,T.textW(label,'Andika',28
