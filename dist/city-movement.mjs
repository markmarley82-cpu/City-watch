import {bridgeCornerClear} from './city-free-walk.mjs?v=p21-b407-s039-reuse';
import {manualNeighbour,manualDirectionalNeighbour,project,unproject,closest,distance} from './city-core.mjs?v=p21-b407-s039-reuse';

// Map input assistance uses only steps cleared by the existing city graph.
// A blocked diagonal may follow one open axis; it never crosses that corner.
export function createStreetStepper(world,{occupied=()=>false,stepMS=160,screenSpeed=false}={}){
 let lastAxis=null;
 return {
  reset(){lastAxis=null;},
  resolve(from,dx,dy){
   const next=manualDirectionalNeighbour(world,from,dx,dy,occupied,lastAxis||'x');
   const sliding=!!next&&(next[0]!==from[0]+dx||next[1]!==from[1]+dy);
   if(!next)return null;
   const accepted=acceptStreetStep(world,from,next,{occupied,stepMS,screenSpeed});
   if(!accepted){for(const [x,y]of (lastAxis==='y'?[[0,dy],[dx,0]]:[[dx,0],[0,dy]])){if(!x&&!y)continue;const side=manualDirectionalNeighbour(world,from,x,y,occupied);const acceptedSide=side&&acceptStreetStep(world,from,side,{occupied,stepMS,screenSpeed});if(acceptedSide){lastAxis=x?'x':'y';return {...acceptedSide,sliding:true};}}return null;}
   const x=next[0]-from[0],y=next[1]-from[1];
   if(!x||!y)lastAxis=x?'x':'y';
   return {...accepted,sliding};
  }
 };
}
export function walkDuration(from,to,stepMS=160,{screenSpeed=false}={}){const dx=to[0]-from[0],dy=to[1]-from[1];return stepMS*(screenSpeed?Math.hypot(28*(dx-dy),14*(dx+dy))/Math.hypot(28,14):Math.hypot(dx,dy));}

// Exact route segments and circle steps use the same collision/edge contract.
// Zero-distance graph transfers change depth identity, not distance or step count.
export function acceptStreetStep(world,from,to,{occupied=()=>false,stepMS=160,screenSpeed=false}={}){
 if(!Array.isArray(to)||occupied(to))return null;
 const dx=to[0]-from[0],dy=to[1]-from[1];
 const next=dx||dy?manualNeighbour(world,from,dx,dy,occupied):world.neighbours(from).find(p=>p[0]===to[0]&&p[1]===to[1]&&p[2]===to[2]);
 if(!next||next[0]!==to[0]||next[1]!==to[1]||next[2]!==to[2]||world.canTraverse&&!world.canTraverse(from,to)||!bridgeCornerClear(world,from,to,{occupied}))return null;
 return {position:next,duration:walkDuration(from,next,stepMS,{screenSpeed}),sliding:false};
}

// Weighted eight-direction A*: safe diagonals cost their actual travel time.
// Painting overlaps cannot create links; only the existing graph can transfer edges.
export function streetPath(world,start,target,targetEdge,{occupied=()=>false}={}){
 const id=p=>p.join(','),cell=p=>p.slice(0,2).join(',');
 if(!world.members.get(cell(start))?.has(start[2])||!world.members.has(cell(target))||targetEdge&&!world.members.get(cell(target))?.has(targetEdge))return null;
 const targetStates=targetEdge?[[target[0],target[1],targetEdge]]:[...world.members.get(cell(target))].map(edge=>[target[0],target[1],edge]);
 if((start[0]!==target[0]||start[1]!==target[1]||targetEdge&&start[2]!==targetEdge)&&targetStates.every(occupied))return null;
 const estimate=p=>{const x=Math.abs(p[0]-target[0]),y=Math.abs(p[1]-target[1]);return Math.max(x,y)+(Math.SQRT2-1)*Math.min(x,y);};
 // Occupancy/topology are stable for this synchronous request. Reuse the
 // same neighbour memo for bridge checks and exact strict direction synthesis.
 // Keep it query-local and bounded; later requests see current NPC positions.
 const neighbours=new Map();let maxNeighbourhoods=0;for(const ids of world.members.values())maxNeighbourhoods+=ids.size;
 function neighbourhood(p){const k=id(p);let entry=neighbours.get(k);if(entry)return entry;
  const raw=world.neighbours(p);let available=raw;
  for(let i=0;i<raw.length;i++){if(occupied(raw[i])){if(available===raw)available=raw.slice(0,i);}else if(available!==raw)available.push(raw[i]);}
  entry={raw,available};if(neighbours.size>=maxNeighbourhoods)neighbours.delete(neighbours.keys().next().value);neighbours.set(k,entry);return entry;
 }
 const graph={...world,neighbours:p=>neighbourhood(p).raw},directions=Array.from({length:9},()=>[]),slot=(dx,dy)=>(dx+1)*3+dy+1;
 function choose(candidates,id){
  if(!candidates?.length)return null;const current=world.edges.get(id);
  if(!/^E00[1-7]$/.test(id)&&!candidates.some(s=>/^E00[1-7]$/.test(s[2])))return candidates[0];
  const score=s=>{const edge=world.edges.get(s[2]);if(!current?.a||!edge?.a)return s[2]===id?0:Infinity;return Math.min(...edge.points.slice(1).map((p,i)=>distance(s,closest(s,edge.points[i],p))));};
  return candidates.slice().sort((a,b)=>score(a)-score(b)||Number(b[2]===id)-Number(a[2]===id))[0];
 }
 function streetCandidates(p){
  const [x,y,id]=p,near=neighbourhood(p).available;for(const list of directions)list.length=0;
  for(const next of near){const dx=next[0]-x,dy=next[1]-y;if(!Number.isInteger(dx)||!Number.isInteger(dy)||Math.max(Math.abs(dx),Math.abs(dy))>1)continue;const index=slot(dx,dy);directions[index].push(next);}
  const out=[];
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(!dx&&!dy)continue;let next;
   if(!dx||!dy)next=choose(directions[slot(dx,dy)],id);
   else{const a=directions[slot(dx,0)]||[],b=directions[slot(0,dy)]||[],candidates=[];
    for(const side of a)for(const target of neighbourhood(side).available){if(target[0]!==x+dx||target[1]!==y+dy)continue;if(b.some(other=>neighbourhood(other).available.some(t=>t[0]===target[0]&&t[1]===target[1]&&t[2]===target[2])))candidates.push(target);}
    next=choose(candidates,id);
   }
   if(next)out.push(next);
  }
  for(const next of directions[slot(0,0)]||[])if(next[2]!==id)out.push(next);return out;
 }
 const heap=[],scores=new Map([[id(start),0]]),parents=new Map(),states=new Map([[id(start),start]]);
 function push(item){let i=heap.length;heap.push(item);while(i){const parent=(i-1)>>1;if(heap[parent].f<=item.f)break;heap[i]=heap[parent];i=parent;}heap[i]=item;}
 function pop(){const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].f<heap[child].f)child++;if(heap[child].f>=last.f)break;heap[i]=heap[child];i=child;}heap[i]=last;}return top;}
 push({p:start,g:0,f:estimate(start)});
 try{while(heap.length){const {p,g}=pop(),k=id(p);if(g!==scores.get(k))continue;
  if(p[0]===target[0]&&p[1]===target[1]&&(!targetEdge||p[2]===targetEdge)){
   const path=[];let at=k;while(parents.has(at)){path.unshift(states.get(at).slice());at=parents.get(at);}return path;
  }
  const candidates=streetCandidates(p);
  // A dominated route cannot enter the heap. Reject it before repeating the
  // bridge completion and static sweep; improving routes retain both predicates.
  for(const next of candidates){const nk=id(next),cost=g+Math.hypot(next[0]-p[0],next[1]-p[1]);if(cost>=(scores.get(nk)??Infinity))continue;if(!bridgeCornerClear(graph,p,next,{occupied}))continue;if(world.canTraverse&&!world.canTraverse(p,next))continue;scores.set(nk,cost);parents.set(nk,k);states.set(nk,next);push({p:next,g:cost,f:cost+estimate(next)});}
 }
 return null;}finally{neighbours.clear();for(const list of directions)list.length=0;}
}


// Cooperative search is opt-in. The existing synchronous APIs above/below do
// not change. Callers must keep coordinates, topology and occupancy stable for
// the whole request (or cancel/restart after their version changes). No input
// cloning or callback caching is introduced. A step is bounded by heap pops,
// not elapsed time; one neighbour/collision callback cannot be interrupted.
export function createStreetSearch(world,start,target,targetEdge,options={}){
 const stats={pops:0,expanded:0,retained:{frontier:0,neighbourhoods:0,scores:0,parents:0,states:0}};
 let iterator=streetSearchSteps(world,start,target,targetEdge,options,stats),status='pending',path,error,advancing=false,cancelRequested=false;
 const report=()=>({status,pops:stats.pops,expanded:stats.expanded,retained:{...stats.retained},...(status==='complete'?{path}:{}),...(status==='failed'?{error}:{})});
 function release(next){try{iterator?.return();}finally{iterator=null;status=next;stats.retained={frontier:0,neighbourhoods:0,scores:0,parents:0,states:0};}}
 return {
  advance(maxPops=64){
   if(!Number.isSafeInteger(maxPops)||maxPops<1)throw RangeError('Search step budget must be a positive safe integer.');
   if(advancing)throw TypeError('Search step is already running.');
   if(status!=='pending')return report();
   advancing=true;
   try{
    for(let i=0;i<maxPops;i++){
     const next=iterator.next();
     if(cancelRequested){release('cancelled');break;}
     if(next.done){path=next.value;release('complete');break;}
    }
    return report();
   }catch(cause){error=cause;release('failed');throw cause;}
   finally{advancing=false;}
  },
  cancel(){if(status==='pending'){cancelRequested=true;if(!advancing)release('cancelled');}return report();},
  report
 };
}

function* streetSearchSteps(world,start,target,targetEdge,{occupied=()=>false}={},stats){
 const id=p=>p.join(','),cell=p=>p.slice(0,2).join(',');
 if(!world.members.get(cell(start))?.has(start[2])||!world.members.has(cell(target))||targetEdge&&!world.members.get(cell(target))?.has(targetEdge))return null;
 const targetStates=targetEdge?[[target[0],target[1],targetEdge]]:[...world.members.get(cell(target))].map(edge=>[target[0],target[1],edge]);
 if((start[0]!==target[0]||start[1]!==target[1]||targetEdge&&start[2]!==targetEdge)&&targetStates.every(occupied))return null;
 const estimate=p=>{const x=Math.abs(p[0]-target[0]),y=Math.abs(p[1]-target[1]);return Math.max(x,y)+(Math.SQRT2-1)*Math.min(x,y);};
 // Occupancy/topology are stable for this synchronous request. Reuse the
 // same neighbour memo for bridge checks and exact strict direction synthesis.
 // Keep it query-local and bounded; later requests see current NPC positions.
 const neighbours=new Map(),cellCount=world.members.size;let maxNeighbourhoods;
 function neighbourhood(p){const k=id(p);let entry=neighbours.get(k);if(entry)return entry;
  const raw=world.neighbours(p);let available=raw;
  for(let i=0;i<raw.length;i++){if(occupied(raw[i])){if(available===raw)available=raw.slice(0,i);}else if(available!==raw)available.push(raw[i]);}
  entry={raw,available};
  // Most routes touch only a small part of the map. Count all edge memberships
  // only if this query gets large enough to need the exact memo bound.
  if(neighbours.size>=(maxNeighbourhoods??cellCount)){
   if(maxNeighbourhoods===undefined){maxNeighbourhoods=0;for(const ids of world.members.values())maxNeighbourhoods+=ids.size;}
   if(neighbours.size>=maxNeighbourhoods)neighbours.delete(neighbours.keys().next().value);
  }
  neighbours.set(k,entry);return entry;
 }
 const graph={...world,neighbours:p=>neighbourhood(p).raw},directions=Array.from({length:9},()=>[]),slot=(dx,dy)=>(dx+1)*3+dy+1;
 function choose(candidates,id){
  if(!candidates?.length)return null;const current=world.edges.get(id);
  if(!/^E00[1-7]$/.test(id)&&!candidates.some(s=>/^E00[1-7]$/.test(s[2])))return candidates[0];
  const score=s=>{const edge=world.edges.get(s[2]);if(!current?.a||!edge?.a)return s[2]===id?0:Infinity;return Math.min(...edge.points.slice(1).map((p,i)=>distance(s,closest(s,edge.points[i],p))));};
  return candidates.slice().sort((a,b)=>score(a)-score(b)||Number(b[2]===id)-Number(a[2]===id))[0];
 }
 function streetCandidates(p){
  const [x,y,id]=p,near=neighbourhood(p).available;for(const list of directions)list.length=0;
  for(const next of near){const dx=next[0]-x,dy=next[1]-y;if(!Number.isInteger(dx)||!Number.isInteger(dy)||Math.max(Math.abs(dx),Math.abs(dy))>1)continue;const index=slot(dx,dy);directions[index].push(next);}
  const out=[];
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(!dx&&!dy)continue;let next;
   if(!dx||!dy)next=choose(directions[slot(dx,dy)],id);
   else{const a=directions[slot(dx,0)]||[],b=directions[slot(0,dy)]||[],candidates=[];
    for(const side of a)for(const target of neighbourhood(side).available){if(target[0]!==x+dx||target[1]!==y+dy)continue;if(b.some(other=>neighbourhood(other).available.some(t=>t[0]===target[0]&&t[1]===target[1]&&t[2]===target[2])))candidates.push(target);}
    next=choose(candidates,id);
   }
   if(next)out.push(next);
  }
  for(const next of directions[slot(0,0)]||[])if(next[2]!==id)out.push(next);return out;
 }
 const heap=[],scores=new Map([[id(start),0]]),parents=new Map(),states=new Map([[id(start),start]]);
 function push(item){let i=heap.length;heap.push(item);while(i){const parent=(i-1)>>1;if(heap[parent].f<=item.f)break;heap[i]=heap[parent];i=parent;}heap[i]=item;}
 function pop(){const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].f<heap[child].f)child++;if(heap[child].f>=last.f)break;heap[i]=heap[child];i=child;}heap[i]=last;}return top;}
 push({p:start,g:0,f:estimate(start)});
 try{while(heap.length){const {p,g}=pop(),k=id(p);stats.pops++;if(g!==scores.get(k)){stats.retained={frontier:heap.length,neighbourhoods:neighbours.size,scores:scores.size,parents:parents.size,states:states.size};yield;continue;}stats.expanded++;
  if(p[0]===target[0]&&p[1]===target[1]&&(!targetEdge||p[2]===targetEdge)){
   const path=[];let at=k;while(parents.has(at)){path.unshift(states.get(at).slice());at=parents.get(at);}return path;
  }
  const candidates=streetCandidates(p);
  // A dominated route cannot enter the heap. Reject it before repeating the
  // bridge completion and static sweep; improving routes retain both predicates.
  for(const next of candidates){const nk=id(next),cost=g+Math.hypot(next[0]-p[0],next[1]-p[1]);if(cost>=(scores.get(nk)??Infinity))continue;if(!bridgeCornerClear(graph,p,next,{occupied}))continue;if(world.canTraverse&&!world.canTraverse(p,next))continue;scores.set(nk,cost);parents.set(nk,k);states.set(nk,next);push({p:next,g:cost,f:cost+estimate(next)});}
  stats.retained={frontier:heap.length,neighbourhoods:neighbours.size,scores:scores.size,parents:parents.size,states:states.size};yield;
 }
 return null;}finally{neighbours.clear();for(const list of directions)list.length=0;heap.length=0;scores.clear();parents.clear();states.clear();stats.retained={frontier:0,neighbourhoods:0,scores:0,parents:0,states:0};}
}


// An admitted but disconnected cell cannot be a tap destination. Check incoming
// steps too: a legitimate one-way destination may have no outgoing neighbours.
export function streetTapCellConnected(world,point){
 const ids=world.members.get(point.join(','));if(!ids)return false;
 for(const id of ids){const target=[point[0],point[1],id];
  if(world.neighbours(target).length)return true;
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
   const x=point[0]+dx,y=point[1]+dy;
   for(const fromId of world.members.get(x+','+y)||[]){
    const from=[x,y,fromId];if(!dx&&!dy&&fromId===id)continue;
    if(acceptStreetStep(world,from,target))return true;
   }
  }
 }
 return false;
}

// Thumb tolerance is local and measured in display pixels. Existing walkable
// cells keep their exact meaning; no snapping across water or disconnected edges.
export function streetTapPath(world,start,point,{zoom=1,occupied=()=>false,radius=18}={}){
 if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y)||!Number.isFinite(zoom)||zoom<=0)return null;
 const target=unproject(point),key=p=>p.join(',');
 if(world.members.has(key(target))&&(start[0]===target[0]&&start[1]===target[1]||streetTapCellConnected(world,target)))return streetPath(world,start,target,undefined,{occupied});
 if(world.wet?.(target))return null;
 const candidates=[];
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
  const position=[target[0]+dx,target[1]+dy];if(!streetTapCellConnected(world,position))continue;
  const screen=project(position),distance=Math.hypot(screen.x-point.x,screen.y-point.y)*zoom;
  if(distance<=radius)candidates.push({position,distance});
 }
 candidates.sort((a,b)=>a.distance-b.distance);
 for(const candidate of candidates.slice(0,3)){const path=streetPath(world,start,candidate.position,undefined,{occupied});if(path)return path;}
 return null;
}

// Keep cadence aligned to the prior boundary rather than the late paint callback.
// After a stall, carry at most40ms; never fast-forward a burst of logical steps.
export function nextWalkTick(previous,duration,now){return Number.isFinite(previous)?Math.max(previous+duration,now-40):now;}
