// Authored street control points, fitted to current admitted public ground.
// This planner never adds walk cells, moves structures, or opens a held join.
const cell=p=>p.slice(0,2).join(','),state=p=>p.join(',');
const inside=(p,poly)=>{let on=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])on=!on;}return on;};
export function* fitHousingLanesSteps({world,clear,foot,layout}){
 const started=performance.now();
 const requests=layout.housingLanes?.requests||[],bounds=layout.housingLanes?.bounds||[0,0,0,0],protectedAreas=layout.housingLanes?.protectedPolygons||[],used=new Set(),cache=new Map(),edgeCache=new Map(),corridors=[],rejected=[],snaps=[],waypoints=[];
 const eligible=id=>['STREET','YARD','PRECINCT'].includes(world.edges.get(id)?.kind);
 const legal=p=>p[0]>=bounds[0]&&p[1]>=bounds[1]&&p[0]<=bounds[2]&&p[1]<=bounds[3]&&!protectedAreas.some(poly=>inside(p,poly))&&clear(p);
 function safe(p){const k=cell(p);if(cache.has(k))return cache.get(k);const ok=foot(p)&&[-.38,0,.38].every(x=>[-.38,0,.38].every(y=>legal([p[0]+x,p[1]+y])));cache.set(k,ok);return ok;}
 function snap(p){const candidates=[];for(let x=-5;x<=5;x++)for(let y=-5;y<=5;y++){if(Math.abs(x)+Math.abs(y)>5)continue;const q=[p[0]+x,p[1]+y],ids=world.members.get(cell(q));if(ids&&[...ids].some(eligible)&&safe(q))candidates.push({p:q,d:Math.hypot(x,y)});}candidates.sort((a,b)=>a.d-b.d||a.p[0]-b.p[0]||a.p[1]-b.p[1]);return candidates[0]?.p;}
 function segmentClear(a,b){const k=[cell(a),cell(b)].sort().join('|');if(edgeCache.has(k))return edgeCache.get(k);const dx=b[0]-a[0],dy=b[1]-a[1],ok=[0,.25,.5,.75,1].every(t=>[-.35,0,.35].every(h=>legal([a[0]+dx*t-dy*h,a[1]+dy*t+dx*h])));edgeCache.set(k,ok);return ok;}
 // Every leg searches the same installed city graph. The prior legs only
 // change the preference for already-painted cells, not their clearance.
 const transitionCache=new Map();
 function transitions(p,id){
  const cached=transitionCache.get(id);if(cached)return cached;
  const out=[];
  for(const q of world.neighbours(p)){
   const d=Math.abs(q[0]-p[0])+Math.abs(q[1]-p[1]);
   if(d>1||!eligible(q[2])||!safe(q)||d&&!segmentClear(p,q))continue;
   out.push({q,d,k:state(q),xy:d?cell(q):null});
  }
  // The cache is local to this startup pass and bounded on large layouts.
  if(transitionCache.size<24000)transitionCache.set(id,out);
  return out;
 }
 function* route(start,target){
  const startID=state(start),heap=[],scores=new Map([[startID,0]]),parents=new Map(),states=new Map([[startID,start]]),goal=cell(target);
  const push=v=>{let i=heap.push(v)-1;while(i){const p=(i-1)>>1;if(heap[p].f<=v.f)break;heap[i]=heap[p];i=p;}heap[i]=v;};
  const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=last.f)break;heap[i]=heap[c];i=c;}heap[i]=last;}return first;};
  const h=p=>(Math.abs(p[0]-target[0])+Math.abs(p[1]-target[1]))*.65;push({p:start,id:startID,g:0,f:h(start)});let visits=0;
  while(heap.length&&visits++<60000){if((visits&127)===0)yield;const current=pop(),id=current.id;if(current.g!==scores.get(id))continue;if(cell(current.p)===goal){const out=[];let k=id;while(k){out.push(states.get(k));k=parents.get(k);}return out.reverse();}
   for(const {q,d,k,xy} of transitions(current.p,id)){const cost=d?(used.has(xy)?.65:1):.03,g=current.g+cost;if(g>=(scores.get(k)??Infinity))continue;scores.set(k,g);parents.set(k,id);states.set(k,q);push({p:q,id:k,g,f:g+h(q)});}
  }return null;
 }
 for(const row of requests){yield;const targets=row.via.map(snap);if(targets.some(p=>!p)){rejected.push({id:row.id,reason:'control-point-clearance',points:row.via.filter((p,i)=>!targets[i])});continue;}
  let failedLeg=null;let at=[...targets[0],[...world.members.get(cell(targets[0]))].find(eligible)],cells=[targets[0]],failed=false;const checkpointStates=[at];
  for(const p of targets.slice(1)){const part=yield* route(at,p);if(!part){failed=true;failedLeg=[at.slice(0,2),p];break;}for(const q of part)if(cell(cells.at(-1))!==cell(q))cells.push(q.slice(0,2));at=part.at(-1);checkpointStates.push(at);}
  if(failed){rejected.push({id:row.id,reason:'no-current-public-route',targets,failedLeg});continue;}
  const fitted={id:row.id,cells,width:row.width,housingLane:true};corridors.push(fitted);cells.forEach(p=>used.add(cell(p)));snaps.push({id:row.id,requested:row.via,actual:targets});
  if(row.waypoint){const p=checkpointStates[row.waypoint.index??Math.floor(checkpointStates.length/2)];waypoints.push({game_id:row.waypoint.id,name:row.waypoint.name,position:p.slice(0,2),edge:p[2],held:false,waypoint:true});}
 }
 return {corridors,rejected,snaps,waypoints,requested:requests.length,elapsedMS:Math.round(performance.now()-started),legal,cellCount:used.size};
}

export function fitHousingLanes(input){
 const steps=fitHousingLanesSteps(input);
 for(let result=steps.next();;result=steps.next())if(result.done)return result.value;
}
