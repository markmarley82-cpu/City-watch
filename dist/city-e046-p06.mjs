import {footProbeOffsets} from './city-free-walk.mjs?v=p21-b407-s039-reuse';
import {createReservation} from './city-e045-reservation.mjs?v=memo-1';
import {streetPath} from './city-movement.mjs?v=p21-b407-s039-reuse';

const ID='E046-SOUTH-RETURN-P06-R2';
const DOOR_ID='scenic:e046-p06-dock-workshop';
const POLYGON=[[35.6361770407506,244.17957780533771],[35.36456980262305,247.16725742474082],[31.181818335458694,246.78700729136224],[31.453425573586248,243.79932767195913]];
const RECT=[31.181818335458694,243.79932767195913,4.454358705291909,3.3679297527816914];
const THRESHOLD=[35.64975740265699,245.68699797694566,'E046'];
const LANDING=[37,246,'E046'];
const LEGACY_RECT=[28.805999999999994,259.202,4.675,4.119];
const finite=p=>Array.isArray(p)&&p.length===3&&p.slice(0,2).every(Number.isFinite)&&typeof p[2]==='string';
const cell=p=>Math.round(p[0])+','+Math.round(p[1]);
const sameRect=(a,b)=>Array.isArray(a)&&a.length===4&&a.every((v,i)=>Math.abs(v-b[i])<1e-8);

// The protected neighbouring roof has a long painted foreground slope over the
// P06 public landing. Keep that exact plane opaque when an E046 actor is behind
// it; the general actor-local roof reveal otherwise makes the recruit appear to
// stand on the tiles. This does not alter sorting or cutaways outside P06.
export function preserveE046P06Foreground(object,actor){
 return object?.id==='roof:517'&&actor?.[2]==='E046'&&actor[0]>=35.5&&actor[0]<=39.5&&actor[1]>=244&&actor[1]<=248;
}

export function e046P06ForegroundOccludesMarker(object,actor,actorInFront){
 return !actorInFront&&preserveE046P06Foreground(object,actor);
}

export async function createE046P06({load,addSprites,lightAnchors,createCanvas=()=>document.createElement('canvas'),release=()=>false}){
 const base='assets/e046-south-p06-r2/';
 const [body,roof,foreground,contact,nightEmission]=await Promise.all(['body.webp','roof-mask.webp','foreground.webp','contact-mask.webp','night-emission.webp'].map(f=>load(base+f)));
 const images=[body,roof,foreground,contact,nightEmission];
 if(images.some(im=>(im.cwSourceWidth||im.width)!==293||(im.cwSourceHeight||im.height)!==435))throw Error('P06 five-plane dimensions changed');
 const composite=createCanvas();composite.width=293;composite.height=435;const cg=composite.getContext('2d');cg.drawImage(body,0,0);cg.drawImage(roof,0,0);cg.drawImage(foreground,0,0);
 const hidden=createCanvas();hidden.width=293;hidden.height=435;const hg=hidden.getContext('2d');hg.drawImage(body,0,0);hg.drawImage(foreground,0,0);
 const [object]=addSprites([[ID,composite,THRESHOLD.slice(0,2),[194,383],1,RECT,{sceneryKind:'building',sourceAsset:ID,sourceParcel:663,collisionMode:'explicit-e046-p06-reservation',nightEmission,uniquePremise:true}]]);
 object.roofHidden={...object,im:hidden};
 object.contactMask=contact;
 object.e046P06Depth=Object.freeze({id:ID,worldPolygon:POLYGON.map(p=>p.slice()),threshold:THRESHOLD.slice(),foregroundPlane:'foreground.webp',sortPivot:THRESHOLD.slice(0,2)});
 object.actorFootCutaway=Object.freeze({width:48,centerHeight:.25,heightFactor:1.15,groundOnly:true});
 lightAnchors[ID]=[];
 let discarded=false,retired=false;
 const discard=list=>{if(discarded)return;discarded=true;const i=list.indexOf(object);if(i>=0)list.splice(i,1);delete lightAnchors[ID];for(const [name,im]of [['roof-mask.webp',roof],['foreground.webp',foreground],['contact-mask.webp',contact]])release(base+name,im);};
 const retireLegacy=list=>{if(discarded)throw Error('Cannot retire P06 legacy frontage after receiver discard');const found=list.filter(o=>o.id==='roof:566'&&sameRect(o.rect,LEGACY_RECT));if(found.length!==1)throw Error('P06 legacy parcel663/roof566 identity changed');const i=list.indexOf(found[0]);list.splice(i,1);retired=true;return found[0];};
 return Object.freeze({id:ID,object,objects:[object],polygon:POLYGON.map(p=>p.slice()),rect:RECT.slice(),threshold:THRESHOLD.slice(),landing:LANDING.slice(),legacyRect:LEGACY_RECT.slice(),discard,retireLegacy,replaces:r=>sameRect(r,LEGACY_RECT),report:()=>({id:ID,ready:!discarded,active:false,uniqueBuildings:1,repeatedInstances:0,fivePlaneArt:true,threshold:THRESHOLD.slice(),legacyRetired:retired,interactiveDoorsAdded:0,creativeAcceptance:false,physicalIPhoneVerified:false})});
}

export function activateE046P06({receiver,world,ground,originalMembers}){
 if(!receiver)return null;
 const contract={schema:1,id:receiver.id,scope:{edgeID:'E046'},boundary:{epsilonWorldUnits:1e-9},foot:{probes:footProbeOffsets,maxSavedFootDistanceFromAnchor:1.5},regions:[{id:receiver.id,worldPolygon:receiver.polygon}]};
 const reservation=createReservation(contract),plan=reservation.membershipPlan(world.members,originalMembers);
 const remove=[...plan.centres,...plan.footOnly].sort((a,b)=>a.key.localeCompare(b.key)),expected=['32,244','32,245','32,246','33,244','33,245','33,246','33,247','34,244','34,245','34,246','34,247','35,244','35,245','35,246','35,247'];
 if(plan.originalConflicts.length||JSON.stringify(remove.map(r=>r.key))!==JSON.stringify(expected)||remove.some(r=>r.edges.length!==1||r.edges[0]!=='E046'))throw Error('P06 corrected envelope/current fill preflight changed '+JSON.stringify({centres:plan.centres,footOnly:plan.footOnly,originalConflicts:plan.originalConflicts}));
 const priorPoint=ground.clearPoint,priorTraverse=world.canTraverse,priorDoor=world.doors.get(DOOR_ID);
 const memberSnapshot=new Map(world.members),extraSnapshot=new Map(ground.extra),blockedSnapshot=new Set(ground.blocked);
 const gates=reservation.gates({basePointClear:priorPoint,baseSegmentClear:(a,b)=>!priorTraverse||priorTraverse(a,b)});
 const bounds=reservation.regions[0].bounds;
 const local=(a,b)=>Math.max(a[0],b[0])>=bounds[0]-.3&&Math.min(a[0],b[0])<=bounds[2]+.3&&Math.max(a[1],b[1])>=bounds[1]-.3&&Math.min(a[1],b[1])<=bounds[3]+.3;
 const full=p=>finite(p)&&world.members.get(cell(p))?.has(p[2])&&gates.canStand(p)&&world.waterCollision.pointClear(p,[p[2]])&&world.waterCollision.standClear(p,p[2]);
 try{
  for(const r of remove){world.members.delete(r.key);ground.extra.delete(r.key);ground.blocked.add(r.key);}
  ground.clearPoint=gates.pointClear;
  world.canTraverse=(a,b)=>local(a,b)?gates.canTraverse(a,b):(!priorTraverse||priorTraverse(a,b));
  if(!full(receiver.landing))throw Error('P06 public landing is not full-foot clear');
  const route=streetPath(world,[52,225,'E046'],receiver.landing.slice(0,2),'E046');
  if(!route||route.some(p=>!full(p)))throw Error('P06 public landing is not connected to the retained E046 route');
  if(priorDoor)throw Error('P06 exterior identity already exists');
  const door={game_id:DOOR_ID,lf_id:'ORIGINAL INFILL',name:'Unnamed dockside workshop',position:receiver.landing.slice(0,2),edge:'E046',held:false,source_instance:receiver.id,source_asset:receiver.id,threshold:receiver.threshold.slice(0,2),approach_basis:'Corrected P06 painted doorway with full-foot-clear E046 landing',case_function_preserved:'The workshop opens onto the dockside street. The door is closed to the public.'};
  world.doors.set(DOOR_ID,door);
  const connected=new Set(),todo=[receiver.landing.slice()];
  for(let i=0;i<todo.length;i++){const p=todo[i],k=p.join(',');if(connected.has(k))continue;connected.add(k);for(const q of world.neighbours(p))if(q[2]==='E046'&&!connected.has(q.join(',')))todo.push(q);}
  const candidates=[...world.members].filter(([,ids])=>ids.has('E046')).map(([k])=>[...k.split(',').map(Number),'E046']).filter(p=>full(p)&&connected.has(p.join(',')));
  if(!candidates.length)throw Error('P06 has no same-edge save receiver');
  const recover=record=>{
   const a=record?.position;if(!finite(a)||a[2]!=='E046')return null;
   const f=finite(record.cityFoot)&&record.cityFoot[2]===a[2]&&Math.hypot(record.cityFoot[0]-a[0],record.cityFoot[1]-a[1])<=1.5?record.cityFoot:a;
   if(reservation.footClear(a)&&reservation.footClear(f))return null;
   const choices=candidates.slice().sort((p,q)=>(p[0]-f[0])**2+(p[1]-f[1])**2-((q[0]-f[0])**2+(q[1]-f[1])**2)||p[1]-q[1]||p[0]-q[0]);
   const position=choices[0].slice();return{position,cityFoot:position.slice(),reason:'P06 replacement occupies the former saved foot',reservationID:receiver.id};
  };
  return Object.freeze({id:receiver.id,reservation,door,route,recover,fullFootClear:full,removed:remove,report:()=>({...receiver.report(),active:true,interactiveDoorsAdded:1,landing:receiver.landing.slice(),routeSteps:route.length,originalRouteConflicts:0,removedCurrentFillCells:remove.length,collisionRegions:1,sameEdgeSaveCandidates:candidates.length})});
 }catch(error){world.members.clear();for(const[k,v]of memberSnapshot)world.members.set(k,v);ground.extra.clear();for(const[k,v]of extraSnapshot)ground.extra.set(k,v);ground.blocked.clear();for(const k of blockedSnapshot)ground.blocked.add(k);ground.clearPoint=priorPoint;world.canTraverse=priorTraverse;if(priorDoor)world.doors.set(DOOR_ID,priorDoor);else world.doors.delete(DOOR_ID);throw error;}
}

// Keep the public landing readable when the retained legacy range in front of
// it overlaps the actor in the isometric projection. This changes only the
// actor-local reveal mask; collision, routes and the retained building remain
// authoritative and untouched.
export function applyE046P06GroundReveal({state,player,objects,project,alphaAt,masks,height=60}){
 if(!state||player?.[2]!=='E046'||player[0]<31||player[0]>39||player[1]<242||player[1]>249||!state.fullFootClear(player))return [];
 const q=project(player),feet=[-6,0,6].map(dx=>({x:q.x+dx,y:q.y}));
 const cover=objects.filter(o=>o.im&&o.id!==state.id&&o.cutawayEligible!==false&&feet.some(p=>alphaAt(o,p)>.02));
 for(const o of cover){
  const mask={x:q.x,y:q.y-height*.25,rx:48,ry:Math.max(30,height*1.15),opacity:.04,groundOnly:true};
  if(o.rect?.length===4&&o.rect.every(Number.isFinite))mask.toY=Math.max(mask.y,Math.min(q.y+260,project([o.rect[0]+o.rect[2],o.rect[1]+o.rect[3]]).y+12));
  const own=masks.get(o.id)||[];own.push(mask);masks.set(o.id,own);
 }
 return cover.map(o=>o.id);
}
