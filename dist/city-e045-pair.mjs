import {footProbeOffsets} from './city-free-walk.mjs?v=p21-b407-s039-reuse';
import {createReservation} from './city-e045-reservation.mjs?v=p21-b407-s039-reuse';
const activations=new WeakMap(),finiteState=p=>Array.isArray(p)&&p.length===3&&p.slice(0,2).every(Number.isFinite)&&typeof p[2]==='string',cell=p=>p.slice(0,2).join(',');
const PAIR_IDS=['E045-WEST-COMPOSITION-P01','E045-WEST-COMPOSITION-P02'];
export async function createE045PairReceiver({read,load,addSprites,lightAnchors,release=()=>false,createCanvas=()=>document.createElement('canvas')}){
 const base='assets/e045-pair-v1/',data=await read(base+'receiver.json');
 if(data.schema!==1||JSON.stringify(data.foot.probes)!==JSON.stringify(footProbeOffsets)||JSON.stringify(data.renderer.map(r=>r.id))!==JSON.stringify(PAIR_IDS)||JSON.stringify(data.reservation.regions.map(r=>r.id))!==JSON.stringify(PAIR_IDS))throw Error('E045 pair receiver/native profile or exact ID mismatch');
 const reservation=createReservation(data.reservation),depth=new Map(data.depth.properties.map(p=>[p.id,p]));
 // Decode and validate every plane before registering either object.
 const prepared=await Promise.all(data.renderer.map(async r=>{const images=await Promise.all(['body.webp','roof-mask.webp','night-emission.webp'].map(f=>load(base+r.directory+f)));if(images.some(im=>(im.cwSourceWidth||im.width)!==r.canvas[0]||(im.cwSourceHeight||im.height)!==r.canvas[1]))throw Error('E045 pair artwork dimensions changed');if(!depth.has(r.id))throw Error('E045 pair depth contract missing');const hidden=createCanvas();hidden.width=r.canvas[0];hidden.height=r.canvas[1];const g=hidden.getContext('2d');g.drawImage(images[0],0,0);g.globalCompositeOperation='destination-out';g.drawImage(images[1],0,0);g.globalCompositeOperation='source-over';release(base+r.directory+'roof-mask.webp',images[1]);return{r,images:[images[0],hidden,images[2]]};}));
 const rows=prepared.map(({r,images})=>[r.id,images[0],r.worldPivot,r.anchor,r.uniformScale,r.rect,{sceneryKind:'joined-premises',sourceAsset:r.id,collisionMode:'explicit-e045-reservation',nightEmission:images[2]}]);
 // addStreetSprites stages the complete batch before pushing it to the city.
 const objects=addSprites(rows);let discarded=false;
 for(let i=0;i<objects.length;i++){const o=objects[i],{r,images}=prepared[i];o.e045DepthContract=depth.get(r.id);o.roofHidden={...o,im:images[1]};lightAnchors[r.id]=r.lightAnchors;}
 const discard=list=>{if(discarded)return;discarded=true;for(let i=list.length-1;i>=0;i--)if(objects.includes(list[i]))list.splice(i,1);for(const r of data.renderer)delete lightAnchors[r.id];};
 return Object.freeze({id:data.id,data,reservation,objects,discard,report:()=>({ready:!discarded,id:data.id,objects:objects.map(o=>o.id),interactiveDoorsAdded:0,hiddenRearMeasured:false,sourceOnly:true,creativeAcceptance:false})});
}
// Reveal the existing legal service floor beneath these two overhanging paintings.
// The opening follows the actor only; opaque shoulders and native depth stay intact.
export function applyE045PairGroundReveal({receiver,world,ground,footProbes,player,objects,project,alphaAt,masks,height=60}){
 if(!receiver||!['E045','E046'].includes(player?.[2])||player[0]<34||player[0]>47||player[1]<211||player[1]>227)return [];
 if(!footProbes.every(([dx,dy])=>{const p=[player[0]+dx,player[1]+dy,player[2]];return world.members.get(p.slice(0,2).map(Math.round).join(','))?.has(p[2])&&ground.clearPoint(p)&&world.waterCollision.pointClear(p,[p[2]]);} ))return [];
 const q=project(player),covered=objects.filter(o=>receiver.objects.includes(o)&&PAIR_IDS.includes(o.id)&&o.e045DepthContract?.id===o.id&&o.im&&[-6,0,6].some(dx=>alphaAt(o,{x:q.x+dx,y:q.y})>.02));
 for(const o of covered){const points=o.e045DepthContract.worldPolygon;if(!points?.length)continue;const mask={x:q.x,y:q.y-height*.25,rx:48,ry:Math.max(30,height*1.15),opacity:.04,groundOnly:true};mask.toY=Math.max(mask.y,Math.min(q.y+260,Math.max(...points.map(p=>project(p).y))+12));const own=masks.get(o.id)||[];own.push(mask);masks.set(o.id,own);}
 return covered.map(o=>o.id);
}
export function activateE045Pair({world,ground,receiver,originalMembers,createSurface=()=>null}){
 if(!receiver)return null;
 if(activations.has(world))throw Error('E045 reservation already active on this world');
 const {reservation,data}=receiver,plan=reservation.membershipPlan(world.members,originalMembers),remove=[...plan.centres,...plan.footOnly].sort((a,b)=>a.key.localeCompare(b.key)),expected=data.reservation.expectedRemoval.slice().sort((a,b)=>a.key.localeCompare(b.key));
 if(plan.originalConflicts.length||JSON.stringify(remove)!==JSON.stringify(expected)||remove.length!==35||remove.some(r=>r.edges.length!==1||!['E045','E046'].includes(r.edges[0])))throw Error('E045 membership/original route preflight changed');
 // All preflight occurs before any mutation or graph/service index construction.
 const priorPoint=ground.clearPoint,priorTraverse=world.canTraverse,priorNeighbours=world.neighbours,priorReport=ground.report;
 const retainedOriginal=[...originalMembers].filter(([,ids])=>ids.has('E045'));if(retainedOriginal.length!==142)throw Error('E045 original route count changed');
 const basePoint=p=>priorPoint(p),gates=reservation.gates({basePointClear:basePoint,baseSegmentClear:(a,b)=>(!priorTraverse||priorTraverse(a,b))});
 const standing=p=>finiteState(p)&&world.members.get([Math.round(p[0]),Math.round(p[1])].join(','))?.has(p[2])&&gates.canStand(p)&&world.waterCollision.pointClear(p,[p[2]])&&world.waterCollision.standClear(p,p[2]);
 const memberSnapshot=new Map(world.members),extraSnapshot=new Map(ground.extra),blockedSnapshot=new Set(ground.blocked);
 const traversable=(a,b)=>finiteState(a)&&finiteState(b)&&world.members.get([Math.round(a[0]),Math.round(a[1])].join(','))?.has(a[2])&&world.members.get([Math.round(b[0]),Math.round(b[1])].join(','))?.has(b[2])&&gates.canTraverse(a,b);
 const probeReach=Math.max(...footProbeOffsets.flat().map(Math.abs)),bs=reservation.regions.map(r=>r.bounds),bounds=[Math.min(...bs.map(b=>b[0]))-probeReach,Math.min(...bs.map(b=>b[1]))-probeReach,Math.max(...bs.map(b=>b[2]))+probeReach,Math.max(...bs.map(b=>b[3]))+probeReach];
 const sweeps=new Map();let sweepHits=0,sweepMisses=0;
 const canTraverse=(a,b)=>{
  const dx=b[0]-a[0],dy=b[1]-a[1],local=Math.max(a[0],b[0])>=bounds[0]&&Math.min(a[0],b[0])<=bounds[2]&&Math.max(a[1],b[1])>=bounds[1]&&Math.min(a[1],b[1])<=bounds[3];
  if(!local)return !priorTraverse||priorTraverse(a,b);
  const cacheable=finiteState(a)&&finiteState(b)&&Number.isInteger(a[0])&&Number.isInteger(a[1])&&Number.isInteger(dx)&&Number.isInteger(dy)&&Math.max(Math.abs(dx),Math.abs(dy))<=1,key=cacheable?a.join(',')+'>'+b.join(','):null;
  if(key&&sweeps.has(key)){sweepHits++;return sweeps.get(key);}sweepMisses++;const okay=!!traversable(a,b);if(key){if(sweeps.size>=2048)sweeps.delete(sweeps.keys().next().value);sweeps.set(key,okay);}return okay;
 };
 try{
  for(const r of remove){world.members.delete(r.key);ground.extra.delete(r.key);ground.blocked.add(r.key);}
  ground.clearPoint=gates.pointClear;world.canTraverse=canTraverse;
  // openPublicGround's existing neighbour closure already calls dynamic world.canTraverse.
  // members AND extra were pruned above, so retain that closure without a second filter.
  const connectedByEdge=new Map(),candidatesByEdge=new Map();
  for(const edge of data.reservation.scope.edgeIDs){
   const connected=new Set(),todo=[edge==='E045'?[34,197,edge]:[52,225,edge]];
   for(let i=0;i<todo.length;i++){const p=todo[i],key=p.join(',');if(connected.has(key))continue;connected.add(key);for(const q of world.neighbours(p))if(q[2]===edge&&!connected.has(q.join(',')))todo.push(q);}
   connectedByEdge.set(edge,connected);candidatesByEdge.set(edge,[...world.members].filter(([,ids])=>ids.has(edge)).map(([k])=>[...k.split(',').map(Number),edge]).filter(standing));
  }
  if(retainedOriginal.some(([k])=>!connectedByEdge.get('E045').has(k+',E045'))||!connectedByEdge.get('E045').has('52,225,E045'))throw Error('E045 original/junction connectivity changed');
  const surface=createSurface();
  const state=Object.freeze({id:data.id,surface,removed:remove,canStand:standing,recover(record){const edge=record?.position?.[2];if(!data.reservation.scope.edgeIDs.includes(edge))return null;const own=createReservation({...data.reservation,scope:{...data.reservation.scope,edgeID:edge}});return own.proposeRecovery(record,candidatesByEdge.get(edge),{isValidState:p=>world.members.get(cell(p))?.has(p[2]),basePointClear:p=>priorPoint(p)&&world.waterCollision.pointClear(p,[p[2]||edge]),reachable:p=>connectedByEdge.get(edge).has(p.join(','))});},report:()=>({active:true,id:data.id,removed:remove.length,originalRetained:retainedOriginal.length,walkCells:world.members.size,centreMaskCount:plan.centres.length,footOnlyCount:plan.footOnly.length,sweepCache:sweeps.size,sweepHits,sweepMisses,sourceOnly:true,creativeAcceptance:false})});
  ground.report=()=>{const report=priorReport();return{...report,rectangularFootprints:report.rectangularFootprints??report.footprints,footprints:report.footprints+2,polygonReservations:[...(report.polygonReservations||[]),state.report()]};};activations.set(world,state);return state;
 }catch(error){world.members.clear();for(const[k,v]of memberSnapshot)world.members.set(k,v);ground.extra.clear();for(const[k,v]of extraSnapshot)ground.extra.set(k,v);ground.blocked.clear();for(const k of blockedSnapshot)ground.blocked.add(k);ground.clearPoint=priorPoint;world.canTraverse=priorTraverse;world.neighbours=priorNeighbours;ground.report=priorReport;throw error;}
}
