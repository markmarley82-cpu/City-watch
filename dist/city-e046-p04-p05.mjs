import {footProbeOffsets} from './city-free-walk.mjs?v=p21-b407-s039-reuse';
import {createReservation} from './city-e045-reservation.mjs?v=p21-b407-s039-reuse';

const activations=new WeakMap(),finite=p=>Array.isArray(p)&&p.length===3&&p.slice(0,2).every(Number.isFinite)&&typeof p[2]==='string',cell=p=>Math.round(p[0])+','+Math.round(p[1]);
const sameRect=(a,b)=>Array.isArray(a)&&a.length===4&&a.every((v,i)=>Math.abs(v-b[i])<1e-9);
const outward=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);return[dy/length,-dx/length];};
const depthContract=premise=>premise.depth.visibleEdges?premise.depth:{...premise.depth,visibleEdges:[{id:'front',origin:premise.worldPolygon[0].slice(),outward:outward(premise.worldPolygon[0],premise.worldPolygon[1]),exteriorLimit:.25,behindLimit:.2},{id:'return',origin:premise.worldPolygon[3].slice(),outward:outward(premise.worldPolygon[3],premise.worldPolygon[0]),exteriorLimit:.25,behindLimit:.2}]};

/** Load the two exact fitted premises without mutating shared route geometry. */
export async function createE046P04P05Receiver({read,load,addSprites,lightAnchors,release=()=>false}){
 const base='assets/e046-p04-p05-v1/',data=await read(base+'receiver.json');
 if(data.schema!==1||data.id!=='E046-P04-P05-RUNTIME-433'||JSON.stringify(data.foot.probes)!==JSON.stringify(footProbeOffsets)||data.premises.length!==2)throw Error('E046 P04/P05 receiver profile changed');
 const reservation=createReservation(data),objects=[],loaded=[];
 for(const premise of data.premises){
  if(premise.renderer.doorHeightPixels<65||premise.renderer.doorHeightPixels>68)throw Error(premise.id+' door scale changed');
  const files=premise.art.layers,names=[files.body,files.roofHidden,files.foreground,files.nightEmission],images=await Promise.all(names.map(name=>load(base+name)));loaded.push(...names.map((name,i)=>[name,images[i]]));
  if(images.some(image=>(image.cwSourceWidth||image.width)!==premise.art.canvas[0]||(image.cwSourceHeight||image.height)!==premise.art.canvas[1]))throw Error(premise.id+' artwork dimensions changed');
  const xs=premise.worldPolygon.map(p=>p[0]),ys=premise.worldPolygon.map(p=>p[1]),rect=[Math.min(...xs)+.5,Math.min(...ys)+.5,Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)];
  lightAnchors[premise.renderer.sourceAsset]=premise.renderer.lightAnchors;
  const[o]=addSprites([[premise.id,images[0],premise.art.worldPivot,premise.art.anchor,premise.art.uniformScale,rect,{sceneryKind:'joined-premises',sourceAsset:premise.renderer.sourceAsset,collisionMode:'explicit-e046-p04-p05-reservation',nightEmission:images[3],uniquePremise:true}]]);
  o.roofHidden={...o,im:images[1]};o.actorFootCutaway=Object.freeze({width:48,centerHeight:.25,heightFactor:1.15,groundOnly:true});o.e045DepthContract=Object.freeze(depthContract(premise));o.e046P04P05Depth=o.e045DepthContract;o.e046P04P05Foreground=images[2];objects.push(o);
 }
 let discarded=false,active=false,retired=[],retiredList=null;
 const retireLegacy=list=>{
  if(discarded||!active)throw Error('Activate E046 P04/P05 before exact legacy retirement');
  if(retired.length)return retired.map(r=>r.object);
  const found=data.retireLegacy.map(record=>{const matches=list.filter(o=>o.id===record.id&&sameRect(o.rect,record.rect));if(matches.length!==1)throw Error(record.id+' exact legacy identity changed');return{record,object:matches[0],index:list.indexOf(matches[0])};});
  for(const item of found.slice().sort((a,b)=>b.index-a.index))list.splice(item.index,1);retired=found;retiredList=list;return found.map(r=>r.object);
 };
 const restoreLegacy=(list=retiredList)=>{if(!list&&retired.length)throw Error('Exact legacy list unavailable for restore');for(const item of retired.slice().sort((a,b)=>a.index-b.index))if(!list.includes(item.object))list.splice(Math.min(item.index,list.length),0,item.object);retired=[];retiredList=null;};
 const discard=list=>{if(discarded)return;if(active)throw Error('Rollback E046 P04/P05 activation before receiver discard');restoreLegacy(list);discarded=true;for(const object of objects){const i=list.indexOf(object);if(i>=0)list.splice(i,1);delete lightAnchors[object.sourceAsset];}for(const[name,image]of loaded)release(base+name,image);};
 return Object.freeze({id:data.id,data,reservation,objects:Object.freeze(objects.slice()),retireLegacy,restoreLegacy,discard,_markActive(value){active=value;},_rollbackLegacy(){restoreLegacy();},report:()=>({id:data.id,ready:!discarded,active,uniqueBuildings:2,repeatedInstances:0,bodyLayers:2,roofLayers:2,foregroundLayers:2,nightLayers:2,legacyRetired:retired.map(r=>r.record.id),interactiveInteriors:0,creativeAcceptance:false,physicalIPhoneVerified:false})});
}

/** Reserve both full-foot envelopes as one transaction and connect both doors. */
export function activateE046P04P05({world,ground,receiver,originalMembers,streetPath}){
 if(!receiver)return null;if(activations.has(world))throw Error('E046 P04/P05 reservation already active');
 const{reservation,data}=receiver,plan=reservation.membershipPlan(world.members,originalMembers),remove=[...plan.centres.map(r=>({...r,restriction:'centres'})),...plan.footOnly.map(r=>({...r,restriction:'footOnly'}))].sort((a,b)=>a.key.localeCompare(b.key)),expected=data.expectedRemoval.slice().sort((a,b)=>a.key.localeCompare(b.key));
 if(plan.originalConflicts.length||JSON.stringify(remove)!==JSON.stringify(expected)||remove.length!==31||remove.some(r=>r.edges.length!==1||r.edges[0]!=='E046'))throw Error('E046 P04/P05 membership/original route preflight changed '+JSON.stringify({remove,originalConflicts:plan.originalConflicts}));
 const priorPoint=ground.clearPoint,priorTraverse=world.canTraverse,priorReport=ground.report,priorDoors=data.premises.map(p=>world.doors.get(p.door.gameID)),memberSnapshot=new Map(world.members),extraSnapshot=new Map(ground.extra),blockedSnapshot=new Set(ground.blocked),retainedOriginal=[...originalMembers].filter(([,ids])=>ids.has('E046'));
 if(retainedOriginal.length!==116||priorDoors.some(Boolean))throw Error('E046 P04/P05 original route or door identity changed');
 const gates=reservation.gates({basePointClear:p=>priorPoint(p),baseSegmentClear:(a,b)=>!priorTraverse||priorTraverse(a,b)}),standing=p=>finite(p)&&world.members.get(cell(p))?.has(p[2])&&gates.canStand(p)&&world.waterCollision.pointClear(p,[p[2]])&&world.waterCollision.standClear(p,p[2]);
 const bounds=[Math.min(...reservation.regions.map(r=>r.bounds[0]))-.3,Math.min(...reservation.regions.map(r=>r.bounds[1]))-.3,Math.max(...reservation.regions.map(r=>r.bounds[2]))+.3,Math.max(...reservation.regions.map(r=>r.bounds[3]))+.3],local=(a,b)=>Math.max(a[0],b[0])>=bounds[0]&&Math.min(a[0],b[0])<=bounds[2]&&Math.max(a[1],b[1])>=bounds[1]&&Math.min(a[1],b[1])<=bounds[3];
 let restored=false,state=null;
 const restore=()=>{if(restored)return;restored=true;receiver._rollbackLegacy();world.members.clear();for(const[k,v]of memberSnapshot)world.members.set(k,v);ground.extra.clear();for(const[k,v]of extraSnapshot)ground.extra.set(k,v);ground.blocked.clear();for(const k of blockedSnapshot)ground.blocked.add(k);ground.clearPoint=priorPoint;world.canTraverse=priorTraverse;ground.report=priorReport;for(let i=0;i<data.premises.length;i++){const id=data.premises[i].door.gameID;if(priorDoors[i])world.doors.set(id,priorDoors[i]);else world.doors.delete(id);}activations.delete(world);receiver._markActive(false);};
 try{
  for(const r of remove){world.members.delete(r.key);ground.extra.delete(r.key);ground.blocked.add(r.key);}ground.clearPoint=gates.pointClear;world.canTraverse=(a,b)=>local(a,b)?gates.canTraverse(a,b):(!priorTraverse||priorTraverse(a,b));
  const connected=new Set(),todo=[[52,225,'E046']];for(let i=0;i<todo.length;i++){const p=todo[i],key=p.join(',');if(connected.has(key))continue;connected.add(key);for(const q of world.neighbours(p))if(q[2]==='E046'&&!connected.has(q.join(',')))todo.push(q);}
  if(retainedOriginal.some(([key])=>!connected.has(key+',E046')))throw Error('E046 P04/P05 changed an original route cell');
  const doors=[],routes=[];
  for(const premise of data.premises){
   if(!connected.has(premise.door.stance.join(','))||!standing(premise.door.stance))throw Error(premise.id+' public landing is not connected/full-foot clear');
   const route=streetPath(world,[52,225,'E046'],premise.door.stance.slice(0,2),'E046');if(!route||route.some(p=>!standing(p)))throw Error(premise.id+' has no full-foot-clear E046 door route');routes.push(route);
   const door=Object.freeze({game_id:premise.door.gameID,lf_id:'ORIGINAL INFILL',name:premise.door.name,position:Object.freeze(premise.door.stance.slice(0,2)),edge:'E046',held:false,exteriorOnly:true,source_instance:premise.id,source_asset:premise.renderer.sourceAsset,door_height_pixels:premise.renderer.doorHeightPixels,threshold_world:Object.freeze(premise.door.thresholdWorld.slice()),case_function_preserved:'Original unnamed infill frontage; exterior door only. No address, proprietor, cast, quest or interior added.'});world.doors.set(door.game_id,door);doors.push(door);
  }
  const candidates=[...world.members].filter(([,ids])=>ids.has('E046')).map(([key])=>[...key.split(',').map(Number),'E046']).filter(p=>standing(p)&&connected.has(p.join(',')));
  const recover=record=>{const result=reservation.proposeRecovery(record,candidates,{isValidState:p=>world.members.get(cell(p))?.has(p[2]),basePointClear:p=>priorPoint(p)&&world.waterCollision.pointClear(p,[p[2]||'E046']),reachable:p=>connected.has(p.join(','))});return result?{...result,reason:result.reason.replaceAll('E045','E046 P04/P05')}:result;};
  state=Object.freeze({id:data.id,reservation,doors:Object.freeze(doors),routes:Object.freeze(routes),removed:Object.freeze(remove),canStand:standing,recover,rollback:restore,report:()=>({...receiver.report(),active:true,interactiveDoorsAdded:2,doorRouteSteps:routes.map(r=>r.length),originalE046Retained:retainedOriginal.length,removedCurrentFillCells:remove.length,sameEdgeSaveCandidates:candidates.length})});
  ground.report=()=>{const report=priorReport();return{...report,rectangularFootprints:report.rectangularFootprints??report.footprints,footprints:report.footprints+2,polygonReservations:[...(report.polygonReservations||[]),state.report()]};};activations.set(world,state);receiver._markActive(true);return state;
 }catch(error){restore();throw error;}
}
