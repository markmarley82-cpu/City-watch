// Two original unnamed premises on the accepted Hide Park side-street ground.
// The source drawings, game coordinates and lore classifications remain separate.
import {footProbeOffsets} from './city-free-walk.mjs?v=p21-b407-s039-reuse';
import {createReservation} from './city-e045-reservation.mjs?v=memo-1';
import {streetPath} from './city-movement.mjs?v=p21-b407-s039-reuse';

const key=p=>p.slice(0,2).join(','),clone=v=>JSON.parse(JSON.stringify(v));
const finite=p=>Array.isArray(p)&&p.length===3&&p.slice(0,2).every(Number.isFinite)&&typeof p[2]==='string';
const bounds=r=>[r[0]-.5,r[1]-.5,r[0]+r[2]-.5,r[1]+r[3]-.5];
const inside=(p,b,pad=0)=>p[0]>=b[0]-pad&&p[0]<=b[2]+pad&&p[1]>=b[1]-pad&&p[1]<=b[3]+pad;

export async function createHideParkPremises({read,load,addSprites,lightAnchors}){
 const base='assets/hide-park257/',data=await read(base+'manifest.json');
 if(data.schema!==1||data.premises.length!==2||new Set(data.premises.map(p=>p.id)).size!==2||data.premises.some(p=>p.originalUnnamed!==true||p.uniformScale!==1))throw Error('Hide Park unique-premise contract changed');
 const prepared=await Promise.all(data.premises.map(async r=>{
  const images=await Promise.all([r.body,r.roofHidden].map(f=>load(base+f)));
  if(images.some(im=>(im.cwSourceWidth||im.width)!==r.canvas[0]||(im.cwSourceHeight||im.height)!==r.canvas[1]))throw Error('Hide Park source dimensions changed');
  return {r,images};
 }));
 const objects=addSprites(prepared.map(({r,images})=>[r.id,images[0],r.worldPivot,r.anchor,1,r.rect,{sceneryKind:'building',sourceAsset:r.id,uniquePremise:true,collisionMode:'explicit-hide-park-reservation'}]));
 for(let i=0;i<objects.length;i++){objects[i].roofHidden={...objects[i],im:prepared[i].images[1]};lightAnchors[prepared[i].r.id]=prepared[i].r.windowCentres;}
 return Object.freeze({data,objects,report:()=>({id:data.id,ready:true,uniqueBuildings:2,repeatedInstances:0,originalUnnamed:true,newCanonicalAddresses:0,creativeAcceptance:false})});
}

export function activateHideParkPremises({receiver,world,ground,originalMembers}){
 if(!receiver)return null;
 const rows=receiver.data.premises,rects=rows.map(p=>p.worldBounds);
 const contract={schema:1,id:receiver.data.id,scope:{edgeID:'P015-05'},boundary:{epsilonWorldUnits:1e-9},foot:{probes:footProbeOffsets,maxSavedFootDistanceFromAnchor:1.5},regions:rows.map(p=>({id:p.id,worldPolygon:p.worldPolygon}))};
 const reservation=createReservation(contract),plan=reservation.membershipPlan(world.members,originalMembers);
 const removed=[...plan.centres,...plan.footOnly].sort((a,b)=>a.key.localeCompare(b.key));
 if(plan.originalConflicts.length||!receiver.data.relocatedForPark||removed.length!==receiver.data.previousRemoval.length)throw Error('Hide Park original-route or exact current-ground preflight changed');
 for(const r of removed){world.members.delete(r.key);world.solid.add(r.key);ground.extra.delete(r.key);ground.blocked.add(r.key);}
 const priorPoint=ground.clearPoint,priorTraverse=world.canTraverse;
 const gates=reservation.gates({basePointClear:priorPoint,baseSegmentClear:(a,b)=>!priorTraverse||priorTraverse(a,b)});
 ground.clearPoint=gates.pointClear;
 const near=p=>rects.some(b=>inside(p,b,.7));
 world.canTraverse=(a,b)=>{
  if(!rects.some(r=>Math.max(a[0],b[0])>=r[0]-.2&&Math.min(a[0],b[0])<=r[2]+.2&&Math.max(a[1],b[1])>=r[1]-.2&&Math.min(a[1],b[1])<=r[3]+.2))return !priorTraverse||priorTraverse(a,b);
  return gates.canTraverse(a,b);
 };
 const full=p=>finite(p)&&footProbeOffsets.every(([dx,dy])=>{const q=[p[0]+dx,p[1]+dy,p[2]];return world.members.get(Math.round(q[0])+','+Math.round(q[1]))?.has(p[2])&&gates.pointClear(q)&&world.waterCollision.pointClear(q,[p[2]]);});
 const candidateCache=new Map();
 function candidates(edge){
  if(candidateCache.has(edge))return candidateCache.get(edge);
  const seeds=[...originalMembers].filter(([k,ids])=>ids.has(edge)&&world.members.get(k)?.has(edge)).map(([k])=>[...k.split(',').map(Number),edge]);
  const connected=new Set(),todo=seeds;
  for(let i=0;i<todo.length;i++){const p=todo[i],k=p.join(',');if(connected.has(k))continue;connected.add(k);for(const q of world.neighbours(p))if(q[2]===edge&&!connected.has(q.join(',')))todo.push(q);}
  const points=[...world.members].filter(([,ids])=>ids.has(edge)).map(([k])=>[...k.split(',').map(Number),edge]).filter(p=>p[0]>=132&&p[0]<=154&&p[1]>=37&&p[1]<=52&&connected.has(p.join(','))&&full(p));
  candidateCache.set(edge,points);return points;
 }
 const affected=p=>finite(p)&&near(p)&&!full(p);
 function recoverPoint(p,foot=p){
  const points=candidates(p[2]).slice();points.sort((a,b)=>(a[0]-foot[0])**2+(a[1]-foot[1])**2-((b[0]-foot[0])**2+(b[1]-foot[1])**2)||a[1]-b[1]||a[0]-b[0]);
  if(!points.length)throw Error('No connected same-street saved-position receiver beside the new premises');
  return points[0].slice();
 }
 function persistRecovery(store,Chase){
  const saved=store.read(),next=clone(saved),p=saved.position,f=finite(saved.cityFoot)&&saved.cityFoot[2]===p?.[2]&&Math.hypot(saved.cityFoot[0]-p[0],saved.cityFoot[1]-p[1])<=1.5?saved.cityFoot:p;
  let changed=false,pendingMoved=false,chaseRebuilt=false;
  if(affected(p)||affected(f)){next.position=recoverPoint(p,f);next.cityFoot=next.position.slice();changed=true;}
  const pending=next.pending;
  if(pending){
   if(affected(pending.position)){pending.position=recoverPoint(pending.position);changed=pendingMoved=true;}
   const c=pending.chase;
   if(c&&!Chase?.terminal?.(c)&&(c.route?.some(affected)||affected(c.lastSeen))){
    if(!Chase?.valid||!Chase?.route||!finite(pending.position))throw Error('The saved pursuit needs a supported route receiver');
    const route=Chase.route(world,pending.position,pending.binding);
    if(!route)throw Error('No legal pursuit route beside the new premises');
    const seen=Math.max(0,c.route.findIndex(p=>p.every((v,i)=>v===c.lastSeen[i])));
    pending.chase={...c,route:route.map(p=>p.slice()),index:Math.min(c.index,route.length-1),lastSeen:route[Math.min(seen,route.length-1)].slice()};
    if(!Chase.valid(pending.chase))throw Error('The recovered pursuit is invalid');
    changed=pendingMoved=chaseRebuilt=true;
   }
  }
  if(!changed)return null;
  if(!store.replaceRecord(next,saved.revision))throw Error('Your patrol changed while restoring the new street. Reload to continue.');
  return{position:next.position.slice(),cityFoot:(next.cityFoot||next.position).slice(),pendingMoved,chaseRebuilt,record:store.read()};
 }
 const doors=[];
 for(const p of rows){
  const at=p.landing;
  if(!full(at)||world.doors.has(p.gameId)||streetPath(world,[126,132,'RC1'],at.slice(0,2),at[2])===null)throw Error('Hide Park doorway is not uniquely reachable');
  doors.push({game_id:p.gameId,lf_id:'ORIGINAL INFILL',name:p.name,position:at.slice(0,2),edge:at[2],held:false,shop_key:p.shopKey,source_instance:p.id,source_asset:p.id,approach_basis:'Measured painted door and full-foot-clear public landing',case_function_preserved:'Original unnamed working premises; existing goods and prices, no canonical address or proprietor.'});
 }
 for(const d of doors)world.doors.set(d.game_id,d);
 return Object.freeze({rows,doors,rects,reservation,removed,fullFootClear:full,affected,persistRecovery,report:()=>({...receiver.report(),active:true,doors:doors.map(d=>d.game_id),newDoors:doors.length,geometryChanged:true,originalRouteConflicts:0,removedExtraAnchors:removed.length,walkCells:world.members.size})});
}

export function createHideParkApron({ctx,project,texture}){
 const points=[[136.5,46.5],[148.5,46.5],[149.25,48],[136.5,48]].map(project);
 ctx.save();ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=texture?ctx.createPattern(texture,'repeat'):'#8b8573';ctx.fill();ctx.restore();
}
