import {footProbeOffsets} from './city-free-walk.mjs?v=p21-b407-s039-reuse';
import {key,closest,distance} from './city-core.mjs?v=p21-b407-s039-reuse';
// Public dry ground around the placed city, using actual fitted footprints.
// Original route states remain valid; bridges/private approaches keep their joins.
export function openPublicGround(world,objects,data,{reach=5,privateAreas=[],retiredFootprints=[],bounds=null,retainClearAnchors=[],publicServiceCrossings=[]}={}){
 const eligible=id=>['STREET','YARD','PRECINCT'].includes(world.edges.get(id)?.kind),original=new Map([...world.members].map(([k,v])=>[k,new Set(v)])),blocked=new Set(world.solid),heldBlocked=new Set(),rectsByCell=new Map(),extra=new Map(),todo=[];
 for(const o of [...objects,...privateAreas.map(rect=>({rect}))]){if(!o.rect||o.person||o.bridgePart||['street-lamp','ground-contact'].includes(o.sceneryKind))continue;const[x,y,w,h]=o.rect,footprintBounds=[x-.5,y-.5,x+w-.5,y+h-.5];
  for(let yy=Math.floor(y-.7);yy<=Math.ceil(y+h-.3);yy++)for(let xx=Math.floor(x-.7);xx<=Math.ceil(x+w-.3);xx++){const k=key([xx,yy]),list=rectsByCell.get(k)||[];list.push(footprintBounds);rectsByCell.set(k,list);if(xx>=x-.65&&xx<=x+w-.35&&yy>=y-.65&&yy<=y+h-.35)blocked.add(k);}
 }
 // Preserve original street ownership through the existing flood. The only
 // new public cells considered below are inside the retired plot footprints.
 const retired=new Set();
 for(const [x,y,w,h] of retiredFootprints)
  for(let yy=Math.ceil(y-.65);yy<=y+h-.35;yy++)
   for(let xx=Math.ceil(x-.65);xx<=x+w-.35;xx++)retired.add(key([xx,yy]));
 const held=new Set([...(data.runtime_policy.excluded_relation_ids||[]),...(data.runtime_policy.held_route_ids||[])]);
 if(!Array.isArray(publicServiceCrossings))throw Error('Invalid public service crossing registrations');
 const crossings=publicServiceCrossings.map(c=>{
  const p=c?.polygon,owner=c?.ownerEdgeID,ids=c?.relationIDs;
  if(!eligible(owner)||held.has(owner)||!Array.isArray(p)||p.length!==4||!p.every(q=>Array.isArray(q)&&q.length===2&&q.every(Number.isFinite))||!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length||ids.some(id=>!held.has(id)||data.relations.find(e=>e.edge_id===id)?.kind!=='SERVICE'))throw Error('Invalid public service crossing registration');
  const xs=new Set(p.map(q=>q[0])),ys=new Set(p.map(q=>q[1])),box=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  if(xs.size!==2||ys.size!==2||new Set(p.map(q=>q.join(','))).size!==4||p.some((q,i)=>{const next=p[(i+1)%4];return (q[0]===next[0])===(q[1]===next[1]);}))throw Error('Public service crossing must be a nondegenerate rectangle');
  const contains=q=>q[0]>=box[0]&&q[0]<=box[2]&&q[1]>=box[1]&&q[1]<=box[3];
  const seeds=[...original].filter(([k,edges])=>edges.has(owner)&&contains(k.split(',').map(Number))).map(([k])=>k.split(',').map(Number));
  if(!seeds.length)throw Error('Public service crossing must touch its original owner street');
  return{owner,ids:new Set(ids),contains,seeds,sameStreetOnly:c.sameStreetOnly===true};
 });
 const serviceOwners=new Map();
 for(const e of data.relations.filter(e=>held.has(e.edge_id))){const points=e.engine_centreline||[],r=(e.width_cells||1)/2+.5;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];for(let y=Math.floor(Math.min(a[1],b[1])-r);y<=Math.ceil(Math.max(a[1],b[1])+r);y++)for(let x=Math.floor(Math.min(a[0],b[0])-r);x<=Math.ceil(Math.max(a[0],b[0])+r);x++)if(distance([x,y],closest([x,y],a,b))<=r){const k=key([x,y]);let crossing;
   if(crossings.length)for(const c of crossings)if(c.ids.has(e.edge_id)&&c.contains([x,y])){if(crossing&&crossing.owner!==c.owner)throw Error('Conflicting public service crossing owners');crossing=c;}
   // Exempt only this registered SERVICE mask. Existing structures, private
   // areas and every other held relation keep their original blocked entries.
   if(crossing){if(serviceOwners.has(k)&&serviceOwners.get(k)!==crossing.owner)throw Error('Conflicting public service crossing owners');serviceOwners.set(k,crossing.owner);heldBlocked.add(k);continue;}
   blocked.add(k);heldBlocked.add(k);
  }}}
 // A bounded relocation may retain a previously public rounded anchor only
 // when every native foot probe clears every structural rectangle, held mask
 // and water predicate. This removes conservative grid padding, never a solid.
 const retained=new Map();
 for(const request of retainClearAnchors){
  const p=request.position,id=request.edgeID;
  if(!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger)||!eligible(id))throw Error('Invalid retained public anchor request');
  const k=key(p);if(retained.has(k)||original.has(k)||world.solid.has(k)||heldBlocked.has(k)||world.wet(p)||world.waterCollision&&!world.waterCollision.standClear(p,id))throw Error('Unsafe retained public anchor '+k);
  for(const[dx,dy]of footProbeOffsets){
   const q=[p[0]+dx,p[1]+dy],cell=key([Math.round(q[0]),Math.round(q[1])]);
   if((rectsByCell.get(cell)||[]).some(r=>q[0]>=r[0]&&q[0]<=r[2]&&q[1]>=r[1]&&q[1]<=r[3])||world.waterCollision&&!world.waterCollision.pointClear(q,[id]))throw Error('Retained public foot intersects structure/water '+k);
  }
  retained.set(k,id);
 }
 for(const k of retained.keys())blocked.delete(k);
 const sourcePoints=[...original.keys()].map(k=>k.split(',').map(Number)),objectPoints=[...objects.flatMap(o=>o.rect?[o.rect]:[]),...retiredFootprints].flatMap(([x,y,w,h])=>[[x,y],[x+w,y+h]]);
 const points=[...sourcePoints,...objectPoints],finiteReach=Number.isFinite(reach),limit=bounds||[Math.floor(Math.min(...points.map(p=>p[0])))-2,Math.floor(Math.min(...points.map(p=>p[1])))-2,Math.ceil(Math.max(...points.map(p=>p[0])))+2,Math.ceil(Math.max(...points.map(p=>p[1])))+2];
 const inBounds=p=>p[0]>=limit[0]&&p[1]>=limit[1]&&p[0]<=limit[2]&&p[1]<=limit[3];
 for(const[k,ids]of original){const id=[...ids].find(eligible);if(id)todo.push({p:k.split(',').map(Number),id,n:0});}
 for(let i=0;i<todo.length;i++){const{p,id,n}=todo[i];if(finiteReach&&n>=reach)continue;for(const q of [[p[0]+1,p[1]],[p[0]-1,p[1]],[p[0],p[1]+1],[p[0],p[1]-1]]){const k=key(q);if(retained.has(k)&&retained.get(k)!==id||serviceOwners.has(k)||!inBounds(q)||original.has(k)||extra.has(k)||blocked.has(k)||retired.has(k)||world.wet(q)||world.waterCollision&&!world.waterCollision.standClear(q,id))continue;extra.set(k,id);world.members.set(k,new Set([id]));todo.push({p:q,id,n:n+1});}}
 // Preserve the original flood/ownership first. A newly opened crossing must
 // never become a gateway that floods unrelated ground beyond its polygon.
 const streetRepairs=new Set();
 for(const c of crossings){const queue=c.seeds.map(p=>({p,n:0})),visited=new Set(c.seeds.map(key));
  for(let i=0;i<queue.length;i++){const{p,n}=queue[i];if(finiteReach&&n>=reach)continue;for(const q of [[p[0]+1,p[1]],[p[0]-1,p[1]],[p[0],p[1]+1],[p[0],p[1]-1]]){const k=key(q);
   if(visited.has(k)||!c.contains(q)||!inBounds(q)||blocked.has(k)||retired.has(k)||serviceOwners.has(k)&&serviceOwners.get(k)!==c.owner||world.wet(q)||world.waterCollision&&!world.waterCollision.standClear(q,c.owner))continue;
   if(original.has(k)){if(!original.get(k).has(c.owner))continue;}else if(extra.has(k)){if(extra.get(k)!==c.owner)continue;}else{extra.set(k,c.owner);if(c.sameStreetOnly)streetRepairs.add(k);world.members.set(k,new Set([c.owner]));}
   visited.add(k);queue.push({p:q,n:n+1});
  }}
 }
 if(retired.size){
  const queue=[];
  for(const [k,ids] of world.members){
   const id=[...ids].find(eligible);
   if(id)queue.push({p:k.split(',').map(Number),id});
  }
  for(let i=0;i<queue.length;i++){
   const {p:[x,y],id}=queue[i];
   for(const q of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){
    const k=key(q);
    if(!retired.has(k)||world.members.has(k)||blocked.has(k)||heldBlocked.has(k)||world.wet(q)||
     world.waterCollision&&!world.waterCollision.standClear(q,id))continue;
    extra.set(k,id);
    world.members.set(k,new Set([id]));
    queue.push({p:q,id});
   }
  }
 }
 // Geometry stays fixed after this receiver is constructed. Cache structural
 // sweeps only; dynamic occupancy is still checked by the existing graph callers.
 const sweepCache=new Map(),priorTraverse=world.canTraverse;
 const clearPoint=p=>{const k=key([Math.round(p[0]),Math.round(p[1])]);return !extra.has(k)||!(rectsByCell.get(k)||[]).some(r=>p[0]>=r[0]&&p[0]<=r[2]&&p[1]>=r[1]&&p[1]<=r[3]);};
 function intersects(a,b,r){let lo=0,hi=1;for(let axis=0;axis<2;axis++){const d=b[axis]-a[axis];if(!d){if(a[axis]<r[axis]||a[axis]>r[axis+2])return null;continue;}let x=(r[axis]-a[axis])/d,y=(r[axis+2]-a[axis])/d;if(x>y)[x,y]=[y,x];lo=Math.max(lo,x);hi=Math.min(hi,y);if(lo>hi)return null;}return(lo+hi)/2;}
 function footprintSegmentClear(from,to){
  let clear=true;
  outer:for(let y=Math.floor(Math.min(from[1],to[1])+.38);y<=Math.floor(Math.max(from[1],to[1])+.62);y++)for(let x=Math.floor(Math.min(from[0],to[0])+.38);x<=Math.floor(Math.max(from[0],to[0])+.62);x++){
   const k=key([x,y]);if(!extra.has(k))continue;
   for(const r of rectsByCell.get(k)||[]){const clipped=[Math.max(r[0],x-.5),Math.max(r[1],y-.5),Math.min(r[2],x+.5),Math.min(r[3],y+.5)];if(clipped[0]>clipped[2]||clipped[1]>clipped[3])continue;
    for(const[dx,dy]of footProbeOffsets){const a=[from[0]+dx,from[1]+dy],b=[to[0]+dx,to[1]+dy],t=intersects(a,b,clipped);if(t!==null&&!clearPoint([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])){clear=false;break outer;}}
   }
  }
  return clear;
 }
 // The prior water/deck predicate already caches static geometry. Keep exact
 // from/to depth identities here; actor occupancy stays outside this cache.
 world.canTraverse=(from,to)=>{
  const dx=to[0]-from[0],dy=to[1]-from[1],cacheable=Number.isInteger(from[0])&&Number.isInteger(from[1])&&Number.isInteger(dx)&&Number.isInteger(dy)&&Math.max(Math.abs(dx),Math.abs(dy))<=1,cacheKey=cacheable?from[0]+','+from[1]+','+from[2]:null,slot=(dx+1)*3+dy+1,tile=cacheable?sweepCache.get(cacheKey):null,cached=tile?.[slot];
  if(cached&&cached.edge===to[2])return cached.clear;
  const clear=(!priorTraverse||priorTraverse(from,to))&&footprintSegmentClear(from,to);
  if(cacheable){let states=tile;if(!states){if(sweepCache.size>=8192)sweepCache.delete(sweepCache.keys().next().value);states=new Array(9);sweepCache.set(cacheKey,states);}states[slot]={edge:to[2],clear};}return clear;
 };

 const base=world.neighbours;
 world.neighbours=s=>{
  const[x,y,id]=s,k=key([x,y]),open=extra.has(k),out=open?[]:base(s);
  if(!eligible(id))return out;
  for(const q of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const kq=key(q),next=extra.get(kq);
   // A repaired verge must not create a shortcut to another edge.
   if(next&&(!(streetRepairs.has(k)||streetRepairs.has(kq))||id===next))out.push([...q,next]);
   else if(open&&!next)for(const edge of original.get(kq)||[])if(eligible(edge)&&(!streetRepairs.has(k)||edge===id))out.push([...q,edge]);
  }
  return [...new Map(out.filter(p=>!world.canTraverse||world.canTraverse(s,p)).map(p=>[p.join(','),p])).values()];
 };
 return {extra,blocked,clearPoint,nearby(p,r=4){const out=[];for(let y=Math.round(p[1])-r;y<=Math.round(p[1])+r;y++)for(let x=Math.round(p[0])-r;x<=Math.round(p[0])+r;x++){const id=extra.get(key([x,y]));if(id)out.push([x,y,id]);}return out;},report:()=>({version:2,reachCells:finiteReach?reach:null,boundedCityFill:!finiteReach,bounds:limit,addedCells:extra.size,originalCells:original.size,walkCells:world.members.size,footprints:objects.filter(o=>o.rect).length,heldRelations:held.size,waterWalkable:false,bridgeSideEntry:false,exactFootprintPoints:true,retainedClearAnchors:retained.size})};
}
