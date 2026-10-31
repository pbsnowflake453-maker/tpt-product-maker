// Task Cards (math). Port of build_taskcards_sample.py: landscape, 24 cards A–X, 4 per page, 3 recording sheets, answer key.
(function(){
const T=TPT, W=792, H=612, q=v=>v/72, tb=T.tb, L=[...'ABCDEFGHIJKLMNOPQRSTUVWX'];
function rr(p,x,y,w,h,lw,adj,o={}){p.rect(q(x),q(y),q(w),q(h),Object.assign({r:q(Math.min(w,h))*adj,lw,fill:'FFFFFF'},o));}
function frame(p){rr(p,18,18,W-36,H-36,3,.04);}
function footer(p){tb(p,0,H-34,W,14,'© '+T.STORE,{size:9});}
function bubble(p,x,y,w,h,size,text){rr(p,x,y,w,h,1.5,.5);tb(p,x,y,w,h,text,{size:T.fit(text,'Andika',size,true,q(w)-0.15),bold:true,nowrap:true,m:2});}
function card(p,x,y,w,h,letter,prob,label){
  rr(p,x,y,w,h,3,.1); rr(p,x+8,y+8,w-16,h-16,1.25,.08,{dash:'dash'});
  for(const [cx,cy] of [[x+8,y+8],[x+w-8,y+8],[x+8,y+h-8],[x+w-8,y+h-8]]) p.shape('heart',q(cx-8),q(cy-8),q(16),q(16),{fill:'000000',lw:1.25});
  p.rect(q(x+20),q(y+20),q(46),q(46),{r:q(23),lw:2.5,fill:'FFFFFF'}); tb(p,x+20,y+20,46,46,letter,{size:22,bold:true,m:0});
  const bw=Math.max(100,Math.min(170,T.textW('Skill: '+label,'Andika',9,true)*72+16)); bubble(p,x+w-20-bw,y+30,bw,22,9,'Skill: '+label);
  tb(p,x+20,y+70,w-40,h-110,prob,{size:T.fit(prob,'Andika',40,true,q(w-40-16)),bold:true,nowrap:true});}
const LEFT="Print the cards and cut on the dotted lines. Each card has a letter, so students write their answer in the matching box on a recording sheet.\n\nScoot: Place one card on each desk. Students solve, record, then \"scoot\" to the next desk when you say so.\n\nMath center: Put the cards and recording sheets in a center for independent practice.\n\nPass it on: Students sit in a circle or rows and pass cards desk to desk on your signal.\n\nWrite the Room: Tape cards around the room. Students walk with a clipboard, find each card, and record the answer.";
const RIGHT="Quiz-Quiz-Trade: Each student gets a card. Partners quiz each other, check, trade cards, and find a new partner.\n\nSmall group: Use a few cards for quick warm-ups, reteaching, or checking understanding.\n\nEarly finishers: Keep a set in a bin for students who finish early.\n\nGrab and go: Draw a card for a quick whole-class warm-up or exit ticket.\n\nSelf-check: Students check their work with the answer key.\n\nTip: Laminate the cards or slip them into sleeves to use again and again.";
function howTo(){const p=new T.Page(); frame(p); tb(p,0,32,W,64,'How to Use',{font:'Pacifico',size:40});
  tb(p,50,100,(W-120)/2,470,LEFT,{size:13,align:'left',top:true,richColon:true}); tb(p,W/2+10,100,(W-120)/2,470,RIGHT,{size:13,align:'left',top:true,richColon:true}); return p;}
function head(p,title,label){frame(p); tb(p,50,30,500,24,'Name: ______________________________',{size:15,align:'left'}); tb(p,150,54,W-300,56,title,{font:'Pacifico',size:32});
  const bw=Math.max(170,Math.min(240,T.textW('Skill: '+label,'Andika',15,true)*72+24)); bubble(p,W-50-bw,64,bw,36,15,'Skill: '+label);}
function boxes(p,items,cols,rows,y0,y1){const bw=(W-60)/cols,bh=(y1-y0)/rows;
  items.forEach((i,n)=>{const x=30+(n%cols)*bw,y=y0+Math.floor(n/cols)*bh; p.rect(q(x),q(y),q(bw),q(bh),{lw:2,fill:'FFFFFF'}); tb(p,x+6,y+4,30,24,L[i],{size:15,bold:true,align:'left'});});}
function cover(label,prob,sub){const p=new T.Page(); frame(p);
  tb(p,0,36,W,90,'Task Cards',{font:'Pacifico',size:56});
  const bw=Math.min(W-100,Math.max(300,T.textW(label,'Andika',30,true)*72+50)); rr(p,W/2-bw/2,130,bw,60,3,.5); tb(p,W/2-bw/2,130,bw,60,label,{size:T.fit(label,'Andika',30,true,q(bw)-0.3),bold:true,nowrap:true});
  tb(p,0,200,W,26,sub,{size:17}); card(p,80,255,330,245,'A',prob,label.replace(/^Skills?: /,''));
  p.image(q(W-80-250),q(250),q(250),q(250)); tb(p,W-80-290,H-70,290,20,T.STORE,{size:12}); return p;}
T.products.push({id:'taskcards',name:'Task Cards',title:'Task Cards',orient:'L',kinds:['math'],
  section(cfg,seed){const sk=cfg.skills[0], label=cfg.label||sk.label, r=T.rng(seed), bank=MATH.bank(sk);
    const probs=MATH.pick(sk,24,r), txt=probs.map(x=>MATH.txt(x)); const pages=[];
    const m=24,cw=(W-3*m)/2,ch=(H-3*m)/2;
    for(let pg=0;pg<6;pg++){const p=new T.Page();
      for(let k=0;k<4;k++){const i=pg*4+k; card(p,m+(k%2)*(cw+m),m+Math.floor(k/2)*(ch+m),cw,ch,L[i],txt[i],label);}
      p.line(q(W/2),q(6),q(W/2),q(H-6),{lw:3.5,dash:'dot'}); p.line(q(6),q(H/2),q(W-6),q(H/2),{lw:3.5,dash:'dot'}); pages.push(p);}
    let p=new T.Page(); head(p,'Recording Sheet',label);
    for(let i=0;i<24;i++){const col=Math.floor(i/12),row=i%12,x=90+col*330,y=122+row*37; tb(p,x,y,40,30,L[i]+'.',{size:17,bold:true,align:'left'}); tb(p,x+34,y,240,30,'__________________',{size:17,align:'left'});}
    footer(p); pages.push(p);
    p=new T.Page(); head(p,'Recording Sheet',label); boxes(p,[...Array(24).keys()],6,4,108,H-38); footer(p); pages.push(p);
    for(const half of [0,1]){p=new T.Page(); head(p,'Recording Sheet',label); tb(p,W-250,30,200,24,`Page ${half+1} of 2`,{size:11,align:'right'});
      boxes(p,[...Array(12).keys()].map(k=>k+half*12),4,3,108,H-38); footer(p); pages.push(p);}
    p=new T.Page(); frame(p); tb(p,150,30,W-300,60,'Answer Key',{font:'Pacifico',size:34});
    {const bw=Math.max(170,Math.min(240,T.textW('Skill: '+label,'Andika',15,true)*72+24)); bubble(p,W-50-bw,44,bw,36,15,'Skill: '+label);}
    probs.forEach((pr,i)=>{const col=Math.floor(i/12),row=i%12,x=80+col*340,y=110+row*37; const s=`${L[i]}.   ${MATH.txt(pr,true)}      (${pr.ans})`; tb(p,x,y,320,30,s,{size:T.fit(s,'Andika',16,false,q(320-16)),align:'left',nowrap:true});});
    footer(p); pages.push(p);
    return {label,pages,firstProb:txt[0],info:`<b>${sk.name}</b> · ${bank.length} different problems`+(bank.length<24?` (fewer than 24, so ${24-bank.length} repeat)`:'')};},
  directions(){return [howTo()];},
  cover(secs){const n=secs.length;return cover(T.skillsText(secs),secs[0].firstProb,n===1?'24 task cards  •  3 recording sheets  •  Answer key':`${n} skills  •  ${n*24} task cards  •  Recording sheets  •  Answer keys`);}
});
})();
