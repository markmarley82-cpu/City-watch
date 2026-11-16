import {footProbeOffsets} from './city-free-walk.mjs?v=p21-b407-s039-reuse';
import {createReservation} from './city-e045-reservation.mjs?v=p21-b407-s039-reuse';
const activations=new WeakMap(),finiteState=p=>Array.isArray(p)&&p.length===3&&p.slice(0,2).every(Number.isFinite)&&typeof p[2]==='string',cell=p=>p.slice(0,2).join(',');
export async function createE045WorkshopReceiver({read,load,addSprites,lightAnchors}){
 const base='assets/e045-workshop-v1/',data=await read(base+'receiver.json');
 if(JSON.stringify(data.foot.probes)!==JSON.stringify(footProbeOffsets))throw Error('E045 receiver/native foot profile mismatch');
 const reservation=createReservation(data),r=data.renderer,images=await Promise.all(['body.webp','roof-hidden.webp','night-emission.png'].map(f=>load(base+f)));
 if(images.some(im=>(im.cwSourceWidth||im.width)!==r.canvas[0]||(im.cwSourceHeight||im.height)!==r.canvas[1]))throw Error('E045 receiver artwork dimensions changed');
 const all=data.regions.flatMap(x=>x.worldPolygon),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);
 // Native inFront subtracts .5 from rect maxima; this rect is for depth only.
 const rect=[Math.min(...xs)+.5,Math.min(...ys)+.5,Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)];
 lightAnchors[r.sourceAsset]=r.lightAnchors;
 const[o]=addSprites([[r.spriteID,images[0],data.art.pivot,r.anchor,1,rect,{sceneryKind:'building',sourceAsset:r.sourceAsset,collisionMode:'explicit-e045-reservation',nightEmission:images[2]}]]);
 o.roofHidden={...o,im:images[1]};
 o.actorFootCutaway=Object.freeze({width:48,centerHeight:.25,heightFactor:1.15,groundOnly:true});
 let discarded=false;
 return Object.freeze({id:data.id,data,reservation,object:o,discard(list){if(discarded)return;discarded=true;for(let i=list.length-1;i>=0;i--)if(list[i]===o)list.splice(i,1);delete lightAnchors[r.sourceAsset];},report:()=>({ready:!discarded,id:data.id,originalGame:true,hiddenRearMeasured:false,interactiveDoor:false,uniformScale:data.art.uniformScale,sourcePivot:data.art.sourcePivot,worldPivot:data.art.pivot,lightAnchors:r.lightAnchors.length,creativeAcceptance:false})});
}
export function activateE045Workshop({world,ground,receiver,originalMembers}){
 if(!receiver)return null;
 if(activations.has(world))throw Error('E045 reservation already active on this world');
 const {reservation,data}=receiver,plan=reservation.membershipPlan(world.members,originalMembers),remove=[...plan.centres,...plan.footOnly].sort((a,b)=>a.key.localeCompare(b.key)),expected=data.expectedRemoval.slice().sort((a,b)=>a.key.localeCompare(b.key));
 if(plan.originalConflicts.length||JSON.stringify(remove)!==JSON.stringify(expected)||remove.length!==31||remove.some(r=>r.edges.length!==1||r.edges[0]!=='E045'))throw Error('E045 membership/original route preflight changed');
 // All preflight occurs before any mutation or graph/service index construction.
 const priorPoint=ground.clearPoint,priorTraverse=world.canTraverse,priorNeighbours=world.neighbours,priorReport=ground.report;
 const retainedOriginal=[...originalMembers].filter(([,ids])=>ids.has('E045'));if(retainedOriginal.length!==142)throw Error('E045 original route count changed');
 const basePoint=p=>priorPoint(p),gates=reservation.gates({basePointClear:basePoint,baseSegmentClear:(a,b)=>(!priorTraverse||priorTraverse(a,b))});
 const standing=p=>finiteState(p)&&world.members.get([Math.round(p[0]),Math.round(p[1])].join(','))?.has(p[2])&&gates.canStand(p)&&world.waterCollision.pointClear(p,[p[2]])&&world.waterCollision.standClear(p,p[2]);
 const saved=remove.map(r=>({key:r.key,member:world.members.get(r.key),extra:ground.extra.get(r.key),blocked:ground.blocked.has(r.key)}));
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
  const connected=new Set(),todo=[[34,197,'E045']];for(let i=0;i<todo.length;i++){const p=todo[i],key=p.join(',');if(connected.has(key))continue;connected.add(key);for(const q of world.neighbours(p))if(q[2]==='E045'&&!connected.has(q.join(',')))todo.push(q);}
  if(retainedOriginal.some(([k])=>!connected.has(k+',E045'))||!connected.has('52,225,E045'))throw Error('E045 original/junction connectivity changed');
  const candidates=[...world.members].filter(([,ids])=>ids.has('E045')).map(([k])=>[...k.split(',').map(Number),'E045']).filter(standing);
  const state=Object.freeze({id:data.id,removed:remove,canStand:standing,recover(record){return reservation.proposeRecovery(record,candidates,{isValidState:p=>world.members.get(cell(p))?.has(p[2]),basePointClear:p=>priorPoint(p)&&world.waterCollision.pointClear(p,[p[2]||'E045']),reachable:p=>connected.has(p.join(','))});},report:()=>({active:true,id:data.id,removed:remove.length,originalRetained:retainedOriginal.length,walkCells:world.members.size,centreMaskCount:plan.centres.length,footOnlyCount:plan.footOnly.length,sweepCache:sweeps.size,sweepHits,sweepMisses,hiddenRearMeasured:false,creativeAcceptance:false})});
  ground.report=()=>{const report=priorReport();return{...report,rectangularFootprints:report.footprints,footprints:report.footprints+1,polygonReservations:[state.report()]};};activations.set(world,state);return state;
 }catch(error){for(const r of saved){world.members.set(r.key,r.member);if(r.extra!==undefined)ground.extra.set(r.key,r.extra);else ground.extra.delete(r.key);if(r.blocked)ground.blocked.add(r.key);else ground.blocked.delete(r.key);}ground.clearPoint=priorPoint;world.canTraverse=priorTraverse;world.neighbours=priorNeighbours;ground.report=priorReport;throw error;}
}
