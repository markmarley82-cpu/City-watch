import {createReservation} from './city-e045-reservation.mjs';
import {footProbeOffsets} from './city-free-walk.mjs';
import {streetPath} from './city-movement.mjs';
const key=p=>p.slice(0,2).join(',');
const overlaps=([x,y,w,h],[a,b,c,d],m=.4)=>x<a+c+m&&a<x+w+m&&y<b+d+m&&b<y+h+m;
function polygon([x,y,w,h]){return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];}
export async function installRoyalBankAndMint({world,ground,originalMembers,objects,read,load,makeSprite}){
 const {facades}=await read('royal-bank/placement.json?v=b506');
 const names=['Royal Bank of Ankh-Morpork','Royal Mint'];
 if(facades.length!==2||facades[0].id!=='royal-bank'||facades[1].id!=='royal-mint')throw Error('Unexpected civic premises');
 if(facades.some(f=>world.doors.has(f.id)||objects.some(o=>o.rect&&overlaps(f.bounds,o.rect))))throw Error('Royal Bank/Mint overlaps installed scenery');
 const house=await Promise.all(facades.map(f=>load('royal-bank/'+f.art)));
 const placed=facades.map((f,i)=>makeSprite(f.id,house[i],f.threshold,f.paintedThresholdPx,f.uniformScale,f.bounds,{sceneryKind:'building',sourceAsset:f.id,uniquePremise:true}));
 const reservation=createReservation({schema:1,scope:{edgeID:'E008'},boundary:{epsilonWorldUnits:1e-9},foot:{probes:footProbeOffsets,maxSavedFootDistanceFromAnchor:.8},regions:facades.map(f=>({id:f.id,worldPolygon:polygon(f.bounds)}))});
 const plan=reservation.membershipPlan(world.members,originalMembers),removed=[...plan.centres,...plan.footOnly];
 if(plan.originalConflicts.length||removed.length!==60||removed.some(x=>x.edges.length!==1||x.edges[0]!=='E008'))throw Error('Royal Bank and Mint clearance changed');
 const oldPoint=ground.clearPoint,oldTraverse=world.canTraverse,oldNeighbours=world.neighbours;
 const gates=reservation.gates({basePointClear:oldPoint,baseSegmentClear:oldTraverse??(()=>true)});
 const saved=removed.map(r=>[r.key,world.members.get(r.key),ground.extra.get(r.key),ground.blocked.has(r.key)]);
 try{
  for(const [id] of saved){world.members.delete(id);ground.extra.delete(id);ground.blocked.add(id);}
  ground.clearPoint=gates.pointClear;
  world.canTraverse=gates.canTraverse;
  world.neighbours=p=>oldNeighbours(p).filter(q=>world.members.get(key(q))?.has(q[2])&&gates.canTraverse(p,q));
  for(const f of facades)if(!gates.canStand(f.standing)||!world.waterCollision.standClear(f.standing,'E008')||!streetPath(world,f.tieIn,f.standing.slice(0,2),'E008'))throw Error(f.id+' approach is blocked');
  const doors=facades.map((f,i)=>({game_id:f.id,name:names[i],lf_id:i?'MINT':'BANK',position:f.standing.slice(0,2),edge:'E008',threshold:f.threshold,held:!f.public,source_instance:f.id,case_function_preserved:i?'Royal Mint staff entrance. Closed to the public.':'Public banking hall and cashier.'}));
  for(const d of doors)world.doors.set(d.game_id,d);
  objects.push(...placed);
  return {doors,rects:facades.map(f=>f.bounds),removed:removed.length};
 }catch(error){
  world.neighbours=oldNeighbours;world.canTraverse=oldTraverse;ground.clearPoint=oldPoint;
  for(const [id,m,e,b] of saved){world.members.set(id,m);if(e)ground.extra.set(id,e);if(!b)ground.blocked.delete(id);}
  for(const f of facades)world.doors.delete(f.id);
  throw error;
 }
}
