// Math skill menu: each skill builds its full problem bank. A problem = {parts:[string|null], ans:number}; null = the blank.
(function(){
const M='−', X='×', D='÷', B='___';
const eq=(a,op,b,ans)=>({parts:[`${a} ${op} ${b} = `,null],ans});
const range=(a,b)=>{const o=[];for(let i=a;i<=b;i++)o.push(i);return o;};
function add(n){const o=[];for(const a of range(0,n))for(const b of range(0,n-a))o.push(eq(a,'+',b,a+b));return o;}
function sub(n){const o=[];for(const a of range(0,n))for(const b of range(0,a))o.push(eq(a,M,b,a-b));return o;}
const S=[];
const sk=(group,name,label,gen)=>S.push({group,name,label:label||name,gen});
for(const n of [5,10,20]){
  sk(`Add & Subtract within ${n}`,`Add within ${n}`,null,()=>add(n));
  sk(`Add & Subtract within ${n}`,`Subtract within ${n}`,null,()=>sub(n));
  sk(`Add & Subtract within ${n}`,`Add & subtract within ${n}`,null,()=>add(n).concat(sub(n)));
}
sk('Place Value','10 more & 10 less','10 more & 10 less',()=>range(1,89).map(a=>eq(a,'+',10,a+10)).concat(range(11,99).map(a=>eq(a,M,10,a-10))));
sk('Place Value','10 more','10 more',()=>range(1,89).map(a=>eq(a,'+',10,a+10)));
sk('Place Value','10 less','10 less',()=>range(11,99).map(a=>eq(a,M,10,a-10)));
sk('Two-Digit','Add & subtract tens (40 + 20)','Tens ± tens',()=>{const o=[];for(const a of range(1,9))for(const b of range(1,9)){if(a+b<=10)o.push(eq(a*10,'+',b*10,(a+b)*10));if(b<=a)o.push(eq(a*10,M,b*10,(a-b)*10));}return o;});
sk('Two-Digit','Two-digit ± tens (43 + 20)','Two-digit ± tens',()=>{const o=[];for(let a=11;a<=99;a++){if(a%10===0)continue;for(const b of range(1,9)){const t=b*10;if(a+t<100)o.push(eq(a,'+',t,a+t));if(a-t>0&&Math.floor(a/10)>b)o.push(eq(a,M,t,a-t));}}return o;});
sk('Two-Digit','Two-digit ± two-digit, no regrouping (43 + 25)','Two-digit ± two-digit',()=>{const o=[];for(let a=11;a<=98;a++)for(let b=11;b<=98;b++){const ao=a%10,bo=b%10,at=Math.floor(a/10),bt=Math.floor(b/10);if(ao===0||bo===0)continue;
  if(ao+bo<10&&at+bt<10)o.push(eq(a,'+',b,a+b)); if(ao>=bo&&at>=bt&&a>b)o.push(eq(a,M,b,a-b));}return o;});
sk('Two-Digit','Two-digit addition with regrouping (43 + 28)','Add within 100',()=>{const o=[];for(let a=11;a<=89;a++)for(let b=11;b<=89;b++){if(a%10+b%10>=10&&a+b<100)o.push(eq(a,'+',b,a+b));}return o;});
for(const k of range(0,10)) sk('Addition Facts',`Add ${k} (+${k})`,`+${k} facts`,()=>range(0,10).map(a=>eq(a,'+',k,a+k)).concat(range(0,10).filter(a=>a!==k).map(a=>eq(k,'+',a,a+k))));
for(const k of range(0,10)) sk('Subtraction Facts',`Subtract ${k} (${M}${k})`,`${M}${k} facts`,()=>range(0,10).map(a=>eq(a+k,M,k,a)));
for(const f of range(0,12)) sk('Multiplication Facts',`Multiply by ${f} (${X}${f})`,`${X}${f} facts`,()=>range(0,12).map(a=>eq(a,X,f,a*f)).concat(range(0,12).filter(a=>a!==f).map(a=>eq(f,X,a,a*f))));
sk('Multiplication Facts','Mixed multiplication (single digit)','Mixed multiplication',()=>{const o=[];for(const a of range(1,9))for(const b of range(1,9))o.push(eq(a,X,b,a*b));return o;});
for(const d of range(1,12)) sk('Division Facts',`Divide by ${d} (${D}${d})`,`${D}${d} facts`,()=>range(0,12).map(q=>eq(q*d,D,d,q)));
sk('Fact Strategies','Doubles','Doubles',()=>range(0,10).map(a=>eq(a,'+',a,2*a)));
sk('Fact Strategies','Near doubles','Near doubles',()=>range(0,9).flatMap(a=>[eq(a,'+',a+1,2*a+1),eq(a+1,'+',a,2*a+1)]));
sk('Fact Strategies','Making 10','Making 10',()=>range(0,10).map(a=>({parts:[`${a} + `,null,' = 10'],ans:10-a})).concat(range(0,10).map(b=>({parts:[null,` + ${b} = 10`],ans:10-b})),range(1,9).map(a=>({parts:[`10 = ${a} + `,null],ans:10-a}))));
sk('Fact Strategies','Missing addends (within 10)','Missing addends',()=>{const o=[];for(const c of range(2,10))for(const a of range(1,c-1)){o.push({parts:[`${a} + `,null,` = ${c}`],ans:c-a});o.push({parts:[null,` + ${a} = ${c}`],ans:c-a});}return o;});
sk('Fact Strategies',`${X}10 and ${X}100`,`${X}10 and ${X}100`,()=>range(1,12).flatMap(a=>[eq(a,X,10,a*10),eq(a,X,100,a*100)]));
// tidy
function txt(p,key){return p.parts.map(x=>x===null?(key?String(p.ans):B):x).join('');}
function key(p){return txt(p,true)+'|'+txt(p);}
const cache={};
function bank(s){if(!cache[s.name]){const seen=new Set();cache[s.name]=s.gen().filter(p=>{const k=key(p);if(seen.has(k))return false;seen.add(k);return true;});}return cache[s.name];}
window.MATH={skills:S,bank,txt,key,BLANK:B,
  // pick n problems: distinct when possible, spread repeats
  pick(s,n,r){const b=bank(s);let out=[];while(out.length<n)out=out.concat(TPT.shuffle(b,r));return out.slice(0,n);}};
})();
