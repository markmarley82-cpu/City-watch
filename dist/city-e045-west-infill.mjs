import {footProbeOffsets} from './city-free-walk.mjs?v=p21-b407-s039-reuse';
import {createReservation} from './city-e045-reservation.mjs?v=p21-b407-s039-reuse';
import {recoverHidePark} from './city-hide-park.mjs?v=p21-b407-s039-reuse';
const ID='E045-INFILL-003',BASE='assets/e045-infill-003/',active=new WeakSet();
const finite=p=>Array.isArray(p)&&p.length===3&&p.slice(0,2).every(Number.isFinite)&&p[2]==='E045';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function polygon(g,points){g.beginPath();points.forEach(([x,y],i)=>g[i?'lineTo':'moveTo'](x,y));g.closePath();}
export async function createE045WestReceiver({read,load,addSprites,lightAnchors,createCanvas=()=>document.createElement('canvas')}){
 const data=await read(BASE+'receiver.json');
 if(data.id!==ID||!same(data.foot.probes,footProbeOffsets)||!same(data.rect,[33.5,211.5,3,4])||!same(data.regions,[{id:'foundation',worldPolygon:[[33,211],[36,211],[36,215],[33,215]]}])||!same(data.publicLanding,[35,216,'E045']))throw Error('E045 west exact registration changed');
 const reservation=createReservation(data),r=data.renderer,im=await load(BASE+'body.webp');
 if((im.cwSourceWidth||im.width)!==280||(im.cwSourceHeight||im.height)!==360||!same(r.anchor,[132,348])||!same(r.worldPivot,[36,215]))throw Error('E045 west source art/anchor changed');
 // Derived rendering planes use this immutable painting; no generative redraw
 // or affine fit. Masks are source-coordinate technical separation controls.
 const hidden=createCanvas();hidden.width=280;hidden.height=360;const hg=hidden.getContext('2d');polygon(hg,r.bodyPlane);hg.clip();hg.drawImage(im,0,0,280,360);
 const emission=createCanvas();emission.width=280;emission.height=360;const eg=emission.getContext('2d');eg.fillStyle='rgba(246,182,82,.94)';for(const quad of r.glass){polygon(eg,quad);eg.fill();}eg.globalCompositeOperation='destination-in';eg.drawImage(im,0,0,280,360);eg.globalCompositeOperation='source-over';
 const[o]=addSprites([[ID,im,r.worldPivot,r.anchor,1,data.rect,{sceneryKind:'building',sourceAsset:ID,collisionMode:'explicit-e045-reservation',nightEmission:emission}]]);
 o.roofHidden={...o,im:hidden};o.actorFootCutaway={groundOnly:true,width:48,heightFactor:1.15,centerHeight:.25};lightAnchors[ID]=r.lightAnchors;
 let discarded=false;return Object.freeze({id:ID,data,reservation,object:o,discard(objects){if(discarded)return;discarded=true;const i=objects.indexOf(o);if(i>=0)objects.splice(i,1);delete lightAnchors[ID];},report:()=>({id:ID,ready:!discarded,uniqueBuildingCount:1,newInteractiveDoors:0,creativeAcceptance:false})});
}
export function activateE045West({world,ground,receiver,originalMembers,store,Chase}){
 if(!receiver)return null;if(active.has(world))throw Error('E045 west already active');
 const {data,reservation}=receiver,plan=reservation.membershipPlan(world.members,originalMembers),remove=[...plan.centres,...plan.footOnly].sort((a,b)=>a.key.localeCompare(b.key));
 if(plan.originalConflicts.length||!same(remove,data.expectedRemoval.slice().sort((a,b)=>a.key.localeCompare(b.key)))||remove.length!==18||remove.some(r=>!same(r.edges,['E045'])))throw Error('E045 west membership preflight changed');
 const original=[...originalMembers].filter(([,ids])=>ids.has('E045'));if(original.length!==142)throw Error('E045 original graph changed');
 const prior={point:ground.clearPoint,traverse:world.canTraverse,report:ground.report},memberSnapshot=new Map(world.members),extraSnapshot=new Map(ground.extra),blockedSnapshot=new Set(ground.blocked);
 const gates=reservation.gates({basePointClear:prior.point,baseSegmentClear:(a,b)=>!prior.traverse||prior.traverse(a,b)});
 const canTraverse=(a,b)=>{
  if(Math.max(a[0],b[0])<32.88||Math.min(a[0],b[0])>36.12||Math.max(a[1],b[1])<210.88||Math.min(a[1],b[1])>215.12)return !prior.traverse||prior.traverse(a,b);
  return gates.canTraverse(a,b);
 };
 const canStand=p=>finite(p)&&world.members.get(p.slice(0,2).map(Math.round).join(','))?.has('E045')&&footProbeOffsets.every(([dx,dy])=>gates.pointClear([p[0]+dx,p[1]+dy])&&world.waterCollision.pointClear([p[0]+dx,p[1]+dy],['E045']));
 try{
  for(const r of remove){world.members.delete(r.key);ground.extra.delete(r.key);ground.blocked.add(r.key);}ground.clearPoint=gates.pointClear;world.canTraverse=canTraverse;
  const seen=new Set(),todo=[[34,197,'E045']];for(let i=0;i<todo.length;i++){const p=todo[i],k=p.join(',');if(seen.has(k))continue;seen.add(k);for(const q of world.neighbours(p))if(q[2]==='E045'&&!seen.has(q.join(',')))todo.push(q);}
  if(original.some(([k])=>!seen.has(k+',E045'))||!seen.has('52,225,E045')||!canStand(data.publicLanding)||!seen.has(data.publicLanding.join(',')))throw Error('E045 west disconnects an original route or landing');
  // The native full-record recovery also keeps pending battle position and
  // reroutes active pursuits. It writes once, after all validation succeeds.
  const recovery=store?recoverHidePark({world,ground,store,Chase,polygon:[],relocated:[data.rect]}):null;
  const report=()=>({id:ID,active:true,removed:18,originalRetained:142,landing:data.publicLanding,newInteractiveDoors:0,recovered:!!recovery,creativeAcceptance:false});
  ground.report=()=>{const r=prior.report();return{...r,footprints:r.footprints+1,polygonReservations:[...(r.polygonReservations||[]),report()]};};active.add(world);
  return Object.freeze({report,canStand,recovery});
 }catch(error){world.members.clear();for(const[k,v]of memberSnapshot)world.members.set(k,v);ground.extra.clear();for(const[k,v]of extraSnapshot)ground.extra.set(k,v);ground.blocked.clear();for(const k of blockedSnapshot)ground.blocked.add(k);ground.clearPoint=prior.point;world.canTraverse=prior.traverse;ground.report=prior.report;throw error;}
}
// A small threshold window through the retained foreground roof makes the
// actual new door readable at its legal approach. Opaque shoulders stay intact.
export function revealE045WestDoor({receiver,state,player,objects,project,alphaAt,masks}){
 if(!receiver||!state||!state.canStand(player)||Math.hypot(player[0]-35,player[1]-216)>1.1)return [];
 const q=project([35,215]),samples=[0,.25,.5,.75,1].flatMap(t=>[-7,0,7].map(dx=>({x:q.x+dx,y:q.y-64*t})));
 const cover=objects.filter(o=>o.id==='E045-WEST-COMPOSITION-P01'&&o.im&&samples.some(p=>alphaAt(o,p)>.02));
 for(const o of cover){const own=masks.get(o.id)||[];own.push({x:q.x,y:q.y-32,rx:22,ry:43,opacity:.08,groundOnly:true});masks.set(o.id,own);}return cover.map(o=>o.id);
}
