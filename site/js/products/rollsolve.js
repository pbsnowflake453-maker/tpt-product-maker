// Roll and Solve (math). Port of build_math_sample.py: 3 boards, no Challenge board, an answer key per board.
(function(){
const T=TPT, W=792, H=612, q=v=>v/72, tb=T.tb;
function frame(p){p.rect(q(18),q(18),q(W-36),q(H-36),{r:q(H-36)*0.04,lw:3,fill:'FFFFFF'});}
function footer(p){tb(p,0,H-34,W,14,'© '+T.STORE,{size:9});}
function bubble(p,x,y,w,h,text,size,lw=2.5){if(/^Skills?:/.test(text)&&size<=22){T.skillTag(p,q(x+w),q(y+h/2),text,Math.min(11,Math.round(size*0.7)));return;}p.rect(q(x),q(y),q(w),q(h),{r:q(h)/2,lw,fill:'FFFFFF'});tb(p,x,y,w,h,text,{size:T.fit(text,'Andika',size,true,q(w)-0.3),bold:true,nowrap:true});}
function cellRuns(pr,key){return [pr.parts.map(x=>x===null?(key?{t:String(pr.ans),b:true,u:true}:{t:MATH.BLANK,b:false}):{t:x,b:false})];}
function grid(p,probs,key){
  const gx=60,gy=142,gw=W-120,cw=gw/6,hh=56,rh=(H-142-44-hh)/6;
  p.rect(q(gx),q(gy),q(gw),q(hh+6*rh),{lw:1.5,fill:'FFFFFF'});
  for(let i=1;i<6;i++) p.line(q(gx+i*cw),q(gy),q(gx+i*cw),q(gy+hh+6*rh),{lw:1.5});
  for(let j=0;j<6;j++) p.line(q(gx),q(gy+hh+j*rh),q(gx+gw),q(gy+hh+j*rh),{lw:1.5});
  for(let i=0;i<6;i++) T.die(p,q(gx+i*cw+cw/2-22),q(gy+9),q(44),i+1);
  // one font size for the whole grid so it looks even
  let fs=15; for(const pr of probs){const s=MATH.txt(pr,key).replace(/\d/g,'0');fs=Math.min(fs,T.fit(s,'Andika',15,key,q(cw-6)));}
  probs.forEach((pr,k)=>{const c=k%6,r=Math.floor(k/6);p.text(q(gx+c*cw+2),q(gy+hh+r*rh),q(cw-4),q(rh),MATH.txt(pr,key),{size:fs,runs:cellRuns(pr,key),nowrap:true});});
}
function board(probs,label,num,key){
  const p=new T.Page(); frame(p);
  if(!key) tb(p,50,34,400,24,'Name: ______________________________',{size:15,align:'left'});
  tb(p,W-250,34,200,24,'Board '+num,{size:11,align:'right'});
  tb(p,150,62,W-300,60,key?'Answer Key':'Roll and Solve',{font:'Pacifico',size:36});
  const bw=Math.max(190,Math.min(260,T.textW('Skill: '+label,'Andika',20,true)*72+30));
  bubble(p,W-50-bw,86,bw,44,'Skill: '+label,20); grid(p,probs,key); footer(p); return p;}
function cover(label,b1,sub){
  const p=new T.Page(); frame(p);
  tb(p,0,40,W,90,'Roll and Solve',{font:'Pacifico',size:54});
  const bw=Math.min(W-100,Math.max(300,T.textW(label,'Andika',32,true)*72+50)); bubble(p,W/2-bw/2,130,bw,64,label,32,3);
  tb(p,0,205,W,26,sub,{size:17});
  const s=0.42,px=q(70),py=q(H-60)-T.PH*s; p.rect(px,py,T.PW*s,T.PH*s,{lw:1,fill:'FFFFFF'}); T.scaled(b1,p,px,py,s);
  p.image(q(W-70-230-40),py+(T.PH*s-q(230))/2,q(230),q(230)); tb(p,W-70-270,H-60,230,20,T.STORE,{size:12});
  return p;}
function howTo(){const p=new T.Page(); frame(p); tb(p,0,40,W,70,'How to Play',{font:'Pacifico',size:40});
  tb(p,70,125,W-140,400,"You need: one game board, one die, and a pencil.\n\nPlay alone:\n1. Roll the die.\n2. Find the column with the same number of dots at the top.\n3. Solve the next problem down in that column. Write the missing number on the line.\n4. Keep rolling until you have solved every problem on the board.\n\nPartner game: Take turns rolling and solving. If your partner agrees your answer is correct, keep it. The player who solves the most problems wins.\n\nRace to the bottom: Each player picks a column. Roll and solve. The first to solve every problem in a column wins!\n\nCheck your work with the answer keys at the back.",{size:15,align:'left',top:true});
  return p;}
T.products.push({id:'rollsolve',name:'Roll and Solve',title:'Roll and Solve',orient:'L',kinds:['math'],
  section(cfg,seed){const sk=cfg.skills[0], label=cfg.label||sk.label, r=T.rng(seed), bank=MATH.bank(sk);
    const B=[0,1,2].map(()=>T.fillGrid(T.shuffle(bank,r).slice(0,36),r));
    const boards=B.map((b,i)=>board(b,label,i+1,false)), keys=B.map((b,i)=>board(b,label,i+1,true));
    return {label,pages:[...boards,...keys],preview:boards[0],info:`<b>${sk.name}</b> · ${bank.length} different problems`+(bank.length<36?' (some repeat on each board, never in the same row or column)':''),repeats:B.map(b=>36-new Set(b).size)};},
  directions(){return [howTo()];},
  cover(secs){const n=secs.length;return cover(T.skillsText(secs),secs[0].preview,n===1?'3 game boards  •  How to Play  •  Answer keys':`${n} skills  •  ${n*3} game boards  •  How to Play  •  Answer keys`);}
});
})();
