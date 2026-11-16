// Replay accepted visual feet, retaining every corner rather than smoothing
// between rounded cell anchors. The leader owns collision and bridge handoffs.
export function createPartnerTrail(gap=2){
 let points=[],length=0,foot=null;
 const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 function reset(p){points=[p.slice()];length=0;foot=p.slice();return foot.slice();}
 function sample(p){
  if(!foot)return reset(p);
  const last=points.at(-1),delta=distance(last,p);
  // Restore/scene relocations are not a walkable segment.
  if(delta>2)return reset(p);
  if(delta>1e-8){points.push(p.slice());length+=delta;}
  let consume=Math.max(0,length-gap);
  while(points.length>1&&consume>1e-8){
   const a=points[0],b=points[1],d=distance(a,b);
   if(d<=consume+1e-8){points.shift();length-=d;consume-=d;foot=b.slice();}
   else{const t=consume/d;foot=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]];points[0]=foot.slice();length-=consume;consume=0;}
  }
  return foot.slice();
 }
 return {reset,sample};
}
