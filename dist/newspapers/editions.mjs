// Ambient city copy never grants evidence, currency, contacts or quest state.
const hash=text=>{let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const pick=(rows,count,seed)=>{
 let n=hash(seed)||1;const pool=[...rows];
 for(let i=pool.length-1;i>0;i--){n^=n<<13;n^=n>>>17;n^=n<<5;const j=(n>>>0)%(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
 return pool.slice(0,count);
};
export function createEditorial(input){
 const data=structuredClone(input);
 if(data?.version!==1)throw new TypeError('Unsupported editorial catalog');
 const groups=[data.news?.times,data.news?.inquirer,data.classifieds,data.notices,data.letters,data.vegetables];
 const ids=new Set();for(const group of groups){
  if(!Array.isArray(group)||group.length<4)throw new TypeError('Editorial pool is incomplete');
  for(const x of group){if(typeof x.id!=='string'||ids.has(x.id)||typeof x.headline!=='string'||!x.headline.trim()||typeof x.body!=='string'||!x.body.trim())throw new TypeError('Invalid editorial record');ids.add(x.id);}
 }
 function edition(paper,cx={},slot='front'){
  if(!['times','inquirer'].includes(paper))throw new TypeError('Unknown newspaper');
  const key=cx.editionKey??'campaign';if(!['string','number'].includes(typeof key))throw new TypeError('editionKey must be a string or number');
  const signature=['availableCases','closedCases','publicTips','publicReports'].map(k=>[...(cx[k]??[])].sort().join(',')).join('|');
  const seed=`${key}|${signature}|${paper}|${slot}`;
  const news=pick(data.news[paper],4,seed+'news');
  // Keep all stories eligible, while pairing at least three different pictures with their own copy.
  const illustrated=pick(data.news[paper].filter(x=>x.illustration),data.news[paper].length,seed+'pictures');
  for(const candidate of illustrated){
   const files=new Set(news.filter(x=>x.illustration).map(x=>x.illustration.file));
   if(files.size>=3)break;
   if(files.has(candidate.illustration.file))continue;
   let at=news.findLastIndex(x=>!x.illustration);
   if(at<0)at=news.findLastIndex(x=>news.filter(y=>y.illustration?.file===x.illustration.file).length>1);
   if(at>=0)news[at]=candidate;
  }
  news.sort((a,b)=>Number(!!b.illustration)-Number(!!a.illustration));
  return {key:String(key),news,classifieds:pick(data.classifieds,6,seed+'ads'),notices:pick(data.notices,2,seed+'notices'),letters:pick(data.letters,1,seed+'letters'),vegetable:paper==='times'&&hash(seed+'veg')%4===0?pick(data.vegetables,1,seed+'caption')[0]:null};
 }
 return Object.freeze({edition});
}
