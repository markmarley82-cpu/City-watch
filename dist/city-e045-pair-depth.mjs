// Isolated receiving proposal: rendering order only. No collision/route/save writes.
// null means the visible eave/registration band is unresolved: retain native policy.
export function actorDepthEvidence(p,contract){
 if(!Array.isArray(p)||p.length<2||!p.slice(0,2).every(Number.isFinite)||contract?.schema!==1)return{relation:null,reason:'unsupported'};
 const edges=contract.visibleEdges.map(edge=>{const d=edge.outward[0]*(p[0]-edge.origin[0])+edge.outward[1]*(p[1]-edge.origin[1]);return{id:edge.id,distance:d,safeExterior:d>edge.exteriorLimit,safeBehind:d< -edge.behindLimit,exteriorLimit:edge.exteriorLimit,behindLimit:edge.behindLimit};});
 if(edges.some(e=>e.safeExterior))return{relation:true,reason:'outside-visible-wall-and-conservative-eave-band',edges};
 if(edges.every(e=>e.safeBehind))return{relation:false,reason:'behind-both-visible-oblique-wall-planes',edges};
 return{relation:null,reason:'eave-or-registration-band-native-fallback',edges};
}
export const actorDepthRelation=(p,contract)=>actorDepthEvidence(p,contract).relation;
// Only these exact two receiver objects may move. Every outside object retains
// its native relative position. Null/eave relations and overlapping neighbours
// keep their pre-pass order; incompatible constraints leave the native list intact.
export function constrainE045PairOrder(render){
 const ids=new Set(['E045-WEST-COMPOSITION-P01','E045-WEST-COMPOSITION-P02']),pairs=render.filter(o=>ids.has(o.id)&&o.e045DepthContract?.id===o.id);if(!pairs.length)return{applied:false,moves:[],blocked:[]};
 const original=render.slice(),index=new Map(original.map((o,i)=>[o,i])),outside=original.filter(o=>!pairs.includes(o)),overlap=(a,b)=>a&&b&&Math.max(a[0],b[0])<Math.min(a[0]+a[2],b[0]+b[2])&&Math.max(a[1],b[1])<Math.min(a[1]+a[3],b[1]+b[3]);
 const ranges=pairs.map(pair=>{let lo=0,hi=outside.length;const constraints=[],safe=new Set(pair.e045DepthContract.nativeOrderDisjointIDs||[]);for(let i=0;i<outside.length;i++){const o=outside[i];let before=null,reason;if(o.person){const relation=actorDepthRelation(o.p,pair.e045DepthContract);before=relation===null?index.get(pair)<index.get(o):relation;reason=relation===null?'native-null-band':'clear-oblique-plane';}else if(o.bridgePart||overlap(pair.bounds,o.bounds)&&!safe.has(o.id)){before=index.get(pair)<index.get(o);reason=o.bridgePart?'native-bridge-order':'native-overlapping-neighbour';}if(before===null)continue;if(before)hi=Math.min(hi,i);else lo=Math.max(lo,i+1);constraints.push({id:o.id,before,reason,slot:i});}return{pair,lo,hi,target:outside.filter(o=>index.get(o)<index.get(pair)).length,constraints};});
 const blocked=ranges.filter(r=>r.lo>r.hi).map(r=>({id:r.pair.id,lo:r.lo,hi:r.hi,constraints:r.constraints}));if(blocked.length)return{applied:false,moves:[],blocked};
 let slots=null,best=Infinity;for(let first=ranges[0].lo;first<=ranges[0].hi;first++){const s=[first];let okay=true;for(let i=1;i<ranges.length;i++){const r=ranges[i],lo=Math.max(r.lo,s[i-1]);if(lo>r.hi){okay=false;break;}s.push(Math.max(lo,Math.min(r.hi,r.target)));}if(!okay)continue;const cost=s.reduce((n,v,i)=>n+Math.abs(v-ranges[i].target),0);if(cost<best){best=cost;slots=s;}}
 if(!slots)return{applied:false,moves:[],blocked:[{reason:'pair-order-cycle',ranges:ranges.map(r=>({id:r.pair.id,lo:r.lo,hi:r.hi}))}]};
 const result=[];for(let i=0;i<=outside.length;i++){for(let j=0;j<pairs.length;j++)if(slots[j]===i)result.push(pairs[j]);if(i<outside.length)result.push(outside[i]);}render.splice(0,render.length,...result);return{applied:best>0,moves:ranges.map((r,i)=>({id:r.pair.id,from:r.target,to:slots[i]})).filter(r=>r.from!==r.to),blocked:[]};
}
