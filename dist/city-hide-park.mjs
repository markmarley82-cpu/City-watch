import {GroundPainter} from './city-ground.mjs?v=p21-b407-s039-reuse';
import {pointIn} from './city-core.mjs?v=p21-b407-s039-reuse';
import {footProbeOffsets} from './city-free-walk.mjs?v=p21-b407-s039-reuse';
import {createReservation} from './city-e045-reservation.mjs?v=memo-1';

// Original Mate source paintings, registered to the approved Atlas polygon.
// Ground chunks stream through the same bounded cache as the city streets.
export async function createHidePark({read,load,addSprites,lightAnchors}){
 const base='assets/hide-park260/',m=await read(base+'registration.json?v=p21-b265-park-south-lamp');
 const records=m.runtimeGroundChunks.map(r=>({file:'chunks/'+r.file,sharedFile:'chunks/'+r.file,dimensions:r.native,screen_box:[2260+r.pixelOffset[0],1894+r.pixelOffset[1],2260+r.pixelOffset[0]+r.native[0],1894+r.pixelOffset[1]+r.native[1]]}));
 const ground=new GroundPainter({asset_id:'HIDE-PARK-260',runtime_files:records},{baseURL:base,maxDecoded:4,concurrency:1});
 const source=new Map([...m.sourceProps,...m.addonProps].map(r=>[r.id,r]));
 const props=[];
 for(const r of m.props){
  const a=source.get(r.asset);if(!a)throw Error('Missing park source '+r.asset);
  const im=await load(base+a.file),scale=r.height/a.native[1],p=r.at,tree=['elm','oak'].includes(r.asset),lamp=r.asset==='lamp';
  // Tree depth uses the trunk contact. The existing local cutaway keeps the
  // officer visible when passing behind a canopy without moving the painting.
  const radius=tree?.22:r.asset==='shed'?.65:r.asset==='bench'?.28:r.asset==='stone'?.2:0;
  const rect=[p[0]-.25,p[1]-.25,.5,.5];
  const [o]=addSprites([[r.id,im,p,a.groundPivot,scale,rect,{sourceAsset:'mate-hide-park:'+r.asset,sceneryKind:lamp?'street-lamp':tree?'tree':'street-furniture',cutawayEligible:tree,collisionMode:'explicit-park-prop',parkSolidRadius:radius}]]);
  if(lamp){const x=a.native[0]/2,y=a.native[1]*.12;lightAnchors[r.id]=[[x-8,y-10,x+8,y+10]];}
  props.push(o);
 }
 return {m,ground,props,draw(ctx,view,resolution){ground.update(view,resolution);ground.draw(ctx);},dispose(){ground.dispose();},report:()=>({ready:true,trees:m.props.filter(r=>['elm','oak'].includes(r.asset)).length,props:props.length,chunks:records.length,source:'Mate layout03',heldExitsOpened:0})};
}

export function activateParkProps({receiver,world,ground,originalMembers}){
 const regions=receiver.props.filter(o=>o.parkSolidRadius>0).map(o=>{const [x,y]=o.p,r=o.parkSolidRadius;return{id:o.id,worldPolygon:[[x-r,y-r],[x+r,y-r],[x+r,y+r],[x-r,y+r]]};});
 const reservation=createReservation({schema:1,id:'HIDE-PARK-PROPS-260',scope:{edgeID:'E040'},boundary:{epsilonWorldUnits:1e-9},foot:{probes:footProbeOffsets,maxSavedFootDistanceFromAnchor:1.5},regions});
 const plan=reservation.membershipPlan(world.members,originalMembers);
 if(plan.originalConflicts.length)throw Error('Park furniture would block an existing street');
 const previous=world.canTraverse,priorPoint=ground.clearPoint;
 const gates=reservation.gates({basePointClear:priorPoint,baseSegmentClear:(a,b)=>!previous||previous(a,b)});
 for(const r of [...plan.centres,...plan.footOnly]){world.members.delete(r.key);world.solid.add(r.key);ground.extra.delete(r.key);ground.blocked.add(r.key);}
 ground.clearPoint=gates.pointClear;world.canTraverse=gates.canTraverse;
 return {reservation,removed:[...plan.centres,...plan.footOnly]};
}

// Recover only positions affected by this park/relocation. Preserve complete
// campaign records and rebuild an active pursuit through the native router.
export function recoverHidePark({world,ground,store,Chase,polygon,relocated}){
 const finite=p=>Array.isArray(p)&&p.length===3&&p.slice(0,2).every(Number.isFinite);
 const full=p=>finite(p)&&world.members.get([Math.round(p[0]),Math.round(p[1])].join(','))?.has(p[2])&&footProbeOffsets.every(([dx,dy])=>{const q=[p[0]+dx,p[1]+dy,p[2]];return world.members.get([Math.round(q[0]),Math.round(q[1])].join(','))?.has(p[2])&&ground.clearPoint(q)&&world.waterCollision.pointClear(q,[p[2]]);});
 const relevant=p=>finite(p)&&(pointIn(p,polygon)||relocated.some(r=>p[0]>=r[0]-1&&p[1]>=r[1]-1&&p[0]<=r[0]+r[2]+1&&p[1]<=r[1]+r[3]+1));
 const affected=p=>relevant(p)&&!full(p);
 const saved=store.read(),next=JSON.parse(JSON.stringify(saved));let changed=false,patrolMoved=false;
 const pendingWasWithPatrol=finite(saved.position)&&finite(saved.pending?.position)&&saved.position.every((v,i)=>v===saved.pending.position[i]);
 const recover=p=>{const candidates=[];for(const[k,ids]of world.members){const q=k.split(',').map(Number);if(Math.hypot(q[0]-p[0],q[1]-p[1])>45)continue;for(const edge of ids){const s=[...q,edge];if(full(s))candidates.push(s);}}candidates.sort((a,b)=>(a[0]-p[0])**2+(a[1]-p[1])**2+(a[2]===p[2]?0:100)-((b[0]-p[0])**2+(b[1]-p[1])**2+(b[2]===p[2]?0:100)));if(!candidates.length)throw Error('No safe park recovery point');return candidates[0];};
 if(affected(next.position)||affected(next.cityFoot)){next.position=recover(affected(next.cityFoot)?next.cityFoot:next.position);next.cityFoot=next.position.slice();changed=patrolMoved=true;}
 if(next.pending){const pending=next.pending;let pendingMoved=false;if(patrolMoved&&pendingWasWithPatrol){pendingMoved=!pending.position.every((v,i)=>v===next.position[i]);pending.position=next.position.slice();changed=true;}else if(affected(pending.position)){pending.position=recover(pending.position);pendingMoved=true;changed=true;}const c=pending.chase;if(c&&!Chase?.terminal?.(c)&&(pendingMoved||c.route?.some(affected)||affected(c.lastSeen))){const route=Chase?.route?.(world,pending.position,pending.binding);if(!route?.length)throw Error('No safe recovered park pursuit');const index=Math.min(c.index,route.length-1);pending.chase={...c,route:route.map(p=>p.slice()),index,lastSeen:route[index].slice()};if(!Chase.valid(pending.chase))throw Error('Invalid recovered park pursuit');changed=true;}}
 if(!changed)return null;
 if(!store.replaceRecord(next,saved.revision))throw Error('Patrol changed during park recovery; reload to continue');
 return {record:store.read(),position:next.position,cityFoot:next.cityFoot};
}
