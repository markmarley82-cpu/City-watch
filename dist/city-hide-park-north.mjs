// Eight original unnamed premises fitted to Atlas's current-source Hide Park north block.
// The plan supplies placement only; this module owns collision, services and save recovery.
import {footProbeOffsets} from './city-free-walk.mjs?v=p21-b407-s039-reuse';
import {createReservation} from './city-e045-reservation.mjs?v=memo-1';
import {streetPath,streetReachable,streetReaches} from './city-movement.mjs?v=p21-b407-s039-reuse-reach2';

const key=p=>p.slice(0,2).join(','),clone=v=>JSON.parse(JSON.stringify(v));
const finite=p=>Array.isArray(p)&&p.length===3&&p.slice(0,2).every(Number.isFinite)&&typeof p[2]==='string';
const inside=(p,b,pad=0)=>p[0]>=b[0]-pad&&p[0]<=b[2]+pad&&p[1]>=b[1]-pad&&p[1]<=b[3]+pad;

export async function createHideParkNorth({read,load,addSprites,lightAnchors}){
 const base='assets/hide-park-north258/',data=await read(base+'manifest.json');
 if(data.schema!==1||data.premises.length!==8||data.uniquePremises!==8||data.repeatedInstances!==0||new Set(data.premises.map(p=>p.id)).size!==8||data.premises.some(p=>p.originalUnnamed!==true||p.uniformScale!==1))throw Error('Hide Park north unique-premise contract changed');
 const prepared=await Promise.all(data.premises.map(async r=>{
  const images=await Promise.all([r.body,r.roofHidden].map(f=>load(base+f)));
  if(images.some(im=>(im.cwSourceWidth||im.width)!==r.canvas[0]||(im.cwSourceHeight||im.height)!==r.canvas[1]))throw Error('Hide Park north source dimensions changed');
  return{r,images};
 }));
 const objects=addSprites(prepared.map(({r,images})=>[r.id,images[0],r.p,r.anchor,1,r.rect,{sceneryKind:'building',sourceAsset:r.id,uniquePremise:true,collisionMode:'explicit-hide-park-north-reservation'}]));
 for(let i=0;i<objects.length;i++){
  objects[i].roofHidden={...objects[i],im:prepared[i].images[1]};
  lightAnchors[prepared[i].r.id]=prepared[i].r.windowCentres;
 }
 const discard=list=>{for(const o of objects){const i=list.indexOf(o);if(i>=0)list.splice(i,1);}};
 return Object.freeze({data,objects,discard,report:()=>({id:data.id,ready:true,uniqueBuildings:8,repeatedInstances:0,originalUnnamed:true,newCanonicalAddresses:0,creativeAcceptance:false})});
}

export function activateHideParkNorth({receiver,world,ground,originalMembers,store,Chase,doorCheck=null}){
 if(!receiver)return null;
 const rows=receiver.data.premises,rects=rows.map(r=>[r.rect[0]-.5,r.rect[1]-.5,r.rect[0]+r.rect[2]-.5,r.rect[1]+r.rect[3]-.5]);
 const contract={schema:1,id:receiver.data.id,scope:{edgeID:'E040'},boundary:{epsilonWorldUnits:1e-9},foot:{probes:footProbeOffsets,maxSavedFootDistanceFromAnchor:1.5},regions:rows.map(r=>({id:r.id,worldPolygon:r.worldPolygon}))};
 const reservation=createReservation(contract),plan=reservation.membershipPlan(world.members,originalMembers);
 const expectedCentres=rows.reduce((n,r)=>n+r.rect[2]*r.rect[3],0);
 if(!receiver.data.relocatedForPark||plan.centres.length!==expectedCentres||plan.footOnly.length!==0||plan.originalConflicts.length!==0)throw Error('Hide Park north current-ground preflight changed '+JSON.stringify({walkCells:world.members.size,centres:plan.centres.length,expectedCentres,footOnly:plan.footOnly.length,originalConflicts:plan.originalConflicts.length}));
 for(const r of plan.centres){const p=r.key.split(',').map(Number);if(!rows.some(row=>p[0]>=row.rect[0]&&p[0]<row.rect[0]+row.rect[2]&&p[1]>=row.rect[1]&&p[1]<row.rect[1]+row.rect[3]))throw Error('Hide Park north reservation escaped its measured footprint');}
 for(const r of plan.centres){world.members.delete(r.key);world.solid.add(r.key);ground.extra.delete(r.key);ground.blocked.add(r.key);}
 const priorPoint=ground.clearPoint,priorTraverse=world.canTraverse;
 const gates=reservation.gates({basePointClear:priorPoint,baseSegmentClear:(a,b)=>!priorTraverse||priorTraverse(a,b)});
 ground.clearPoint=gates.pointClear;
 world.canTraverse=(a,b)=>{
  if(!rects.some(r=>Math.max(a[0],b[0])>=r[0]-.2&&Math.min(a[0],b[0])<=r[2]+.2&&Math.max(a[1],b[1])>=r[1]-.2&&Math.min(a[1],b[1])<=r[3]+.2))return !priorTraverse||priorTraverse(a,b);
  return gates.canTraverse(a,b);
 };
 const full=p=>finite(p)&&footProbeOffsets.every(([dx,dy])=>{const q=[p[0]+dx,p[1]+dy,p[2]];return world.members.get(Math.round(q[0])+','+Math.round(q[1]))?.has(p[2])&&gates.pointClear(q)&&world.waterCollision.pointClear(q,[p[2]]);});
 const affected=p=>finite(p)&&rects.some(b=>inside(p,b,.7))&&!full(p);
 const candidateCache=new Map();
 function recoveryCandidates(edge){
  if(candidateCache.has(edge))return candidateCache.get(edge);
  const points=[...world.members].filter(([,ids])=>ids.has(edge)).map(([k])=>[...k.split(',').map(Number),edge]).filter(p=>p[0]>=134&&p[0]<=176&&p[1]>=18&&p[1]<=50&&full(p));
  candidateCache.set(edge,points);return points;
 }
 function recoverPoint(p,foot=p){
  const points=recoveryCandidates(p[2]).slice();points.sort((a,b)=>(a[0]-foot[0])**2+(a[1]-foot[1])**2-((b[0]-foot[0])**2+(b[1]-foot[1])**2)||a[1]-b[1]||a[0]-b[0]);
  if(!points.length)throw Error('No connected same-street save receiver beside Hide Park north');
  return points[0].slice();
 }
 function persistRecovery(){
  if(!store)return null;
  const saved=store.read(),next=clone(saved),p=saved.position,f=finite(saved.cityFoot)&&saved.cityFoot[2]===p?.[2]&&Math.hypot(saved.cityFoot[0]-p[0],saved.cityFoot[1]-p[1])<=1.5?saved.cityFoot:p;
  let changed=false,pendingMoved=false,chaseRebuilt=false;
  if(affected(p)||affected(f)){next.position=recoverPoint(p,f);next.cityFoot=next.position.slice();changed=true;}
  const pending=next.pending;
  if(pending){
   if(affected(pending.position)){pending.position=recoverPoint(pending.position);changed=pendingMoved=true;}
   const c=pending.chase;
   if(c&&!Chase?.terminal?.(c)&&(c.route?.some(affected)||affected(c.lastSeen))){
    if(!Chase?.valid||!Chase?.route||!finite(pending.position))throw Error('The saved pursuit needs a supported Hide Park north receiver');
    const route=Chase.route(world,pending.position,pending.binding);if(!route)throw Error('No legal pursuit route beside Hide Park north');
    const seen=Math.max(0,c.route.findIndex(p=>p.every((v,i)=>v===c.lastSeen[i])));
    pending.chase={...c,route:route.map(p=>p.slice()),index:Math.min(c.index,route.length-1),lastSeen:route[Math.min(seen,route.length-1)].slice()};
    if(!Chase.valid(pending.chase))throw Error('The recovered Hide Park north pursuit is invalid');
    changed=pendingMoved=chaseRebuilt=true;
   }
  }
  if(!changed)return null;
  if(!store.replaceRecord(next,saved.revision))throw Error('Your patrol changed while restoring Hide Park north. Reload to continue.');
  return{position:next.position.slice(),cityFoot:(next.cityFoot||next.position).slice(),pendingMoved,chaseRebuilt,record:store.read()};
 }
 const doors=[];
 for(const r of rows){
  const at=r.landing;
  if(!full(at)||streetPath(world,[126,132,'RC1'],at.slice(0,2),at[2])===null)throw Error('Hide Park north doorway is not reachable');
  const d={game_id:'service:'+r.service+':hide-park-north-'+r.id.slice(-4),lf_id:'ORIGINAL INFILL',name:r.name,position:at.slice(0,2),edge:at[2],held:false,source_instance:r.id,source_asset:r.id,approach_basis:'Atlas current-source landing with full-foot-clear public route',case_function_preserved:'Original unnamed working premise; no canonical address, proprietor, cast or quest invented.'};
  if(r.service==='shop')d.shop_key=r.serviceValue;else d.lodging_grade=r.serviceValue;
  if(world.doors.has(d.game_id))throw Error('Hide Park north service identity already exists');
  doors.push(d);
 }
 for(const d of doors)world.doors.set(d.game_id,d);
 // One search from Watch Square answers the same question as a streetPath to every door.
 // Skipped only when this exact city (same fingerprint) passed it at deploy time.
 const doorFingerprint=doorCheck?.fingerprint?.()||null;
 if(!doorCheck?.verified(doorFingerprint)){
  const reach=streetReachable(world,[126,132,'RC1']);
  for(const d of [...world.doors.values()].filter(d=>!d.held))if(!streetReaches(world,reach,d.position,d.edge))throw Error('Hide Park north cut off '+d.game_id);
  doorCheck?.record(doorFingerprint);
 }
 return Object.freeze({rows,doors,rects,reservation,removed:plan.centres,fullFootClear:full,affected,persistRecovery,report:()=>({...receiver.report(),active:true,doors:doors.map(d=>d.game_id),newDoors:doors.length,newShops:doors.filter(d=>d.shop_key).length,newLodgings:doors.filter(d=>d.lodging_grade!==undefined).length,geometryChanged:true,originalRouteConflicts:0,removedOpenGroundAnchors:plan.centres.length,walkCells:world.members.size})});
}
