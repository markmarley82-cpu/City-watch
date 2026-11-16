import {createReservation} from './city-e045-reservation.mjs';
import {streetPath} from './city-movement.mjs';
const id='POST-OFFICE-001';
export const POST_OFFICE_DOOR='post-office';
const key=p=>p.slice(0,2).join(',');
const overlaps=([x,y,w,h],[a,b,c,d],m=.4)=>x<a+c+m&&a<x+w+m&&y<b+d+m&&b<y+h+m;
export function activatePostalGround({world,ground,originalMembers,site}){
 if(world.doors.has(POST_OFFICE_DOOR))throw Error('Post Office door already exists');
 const reservation=createReservation(site),plan=reservation.membershipPlan(world.members,originalMembers);
 const removed=[...plan.centres,...plan.footOnly];
 if(plan.originalConflicts.length||removed.length!==36||removed.some(r=>r.edges.length!==1||r.edges[0]!=='E010'))throw Error('The measured Post Office clearance changed.');
 const priorPoint=ground.clearPoint,priorTraverse=world.canTraverse,priorNeighbours=world.neighbours;
 const gates=reservation.gates({basePointClear:priorPoint,baseSegmentClear:priorTraverse??(()=>true)});
 const patch=removed.map(r=>({key:r.key,members:world.members.get(r.key),extra:ground.extra.get(r.key),blocked:ground.blocked.has(r.key)}));
 const door={game_id:POST_OFFICE_DOOR,name:'Ankh-Morpork Post Office',lf_id:'POST',position:site.public.standing.slice(0,2),edge:'E010',threshold:site.public.threshold,held:false,source_instance:id,motto:site.inscription.text};
 function undo(){
  world.doors.delete(POST_OFFICE_DOOR);ground.clearPoint=priorPoint;world.canTraverse=priorTraverse;world.neighbours=priorNeighbours;
  for(const r of patch){world.members.set(r.key,r.members);if(r.extra)ground.extra.set(r.key,r.extra);if(!r.blocked)ground.blocked.delete(r.key);}
 }
 try{
  for(const r of removed){world.members.delete(r.key);ground.extra.delete(r.key);ground.blocked.add(r.key);}
  ground.clearPoint=gates.pointClear;
  world.canTraverse=gates.canTraverse;
  world.neighbours=p=>priorNeighbours(p).filter(q=>world.members.get(key(q))?.has(q[2])&&gates.canTraverse(p,q));
  for(const endpoint of [site.public,site.service]){
   if(!gates.canStand(endpoint.standing)||!world.waterCollision.standClear(endpoint.standing,endpoint.standing[2])||
      !streetPath(world,endpoint.tieIn,endpoint.standing.slice(0,2),'E010'))throw Error('A Post Office approach cannot be reached.');
  }
  world.doors.set(POST_OFFICE_DOOR,door);
  return {door,undo,removed:removed.length};
 }catch(error){undo();throw error;}
}
export async function installPostOffice({world,ground,originalMembers,objects,read,load,makeSprite,lightAnchors,createCanvas=()=>document.createElement('canvas')}){
 const site=await read('post-office/site.json?v=b504');
 if(objects.some(o=>o.rect&&overlaps(site.bounds,o.rect)))throw Error('Post Office facade overlaps installed buildings.');
 const body=await load('post-office/facade.webp');
 const canvas=createCanvas();canvas.width=canvas.height=640;const g=canvas.getContext('2d');
 g.drawImage(body,0,0,640,640);g.save();g.transform(1,-.42,0,1,454,320);g.fillStyle='#352c21';g.fillRect(0,0,85,35);
 g.strokeStyle='#a0794e';g.strokeRect(1,1,83,33);g.fillStyle='#efc589';g.font='bold 4.5px Georgia';g.textAlign='center';
 const lines=[];for(const word of site.inscription.text.toUpperCase().split(' ')){if(!lines.length||lines.at(-1).length+1+word.length>26)lines.push(word);else lines[lines.length-1]+=' '+word;}lines.forEach((text,i)=>g.fillText(text,42.5,8+i*7));g.restore();
 const o=makeSprite(id,canvas,site.public.threshold,[490,553],.55,site.bounds,{sceneryKind:'building',sourceAsset:id,uniquePremise:true});
 const {door,undo,removed}=activatePostalGround({world,ground,originalMembers,site});
 try{objects.push(o);return {door,rect:site.bounds,removed};}catch(error){undo();delete lightAnchors[id];throw error;}
}
