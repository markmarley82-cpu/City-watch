import {footProbeOffsets} from './city-free-walk.mjs?v=p21-b517-palace-drag';

// These kerb joins are on the public street outside the campus. Link only
// existing walk cells across the painted kerbs. Never expose another apron,
// a held route, an unregistered cell, or any part of the Great Gates.
const APRON='APRON:university';
export function joinUniversityPublicFootways(world,ground) {
 const base=world.neighbours,links=new Map(),pairs=[];
 const available=(p)=>{
  const key=p.slice(0,2).join(',');
  return world.members.get(key)?.has(p[2])&&!world.solid.has(key)&&!ground.blocked.has(key);
 };
 function clear(a,b) {
  if(!available(a)||!available(b)||
     world.canTraverse&&(!world.canTraverse(a,b)||!world.canTraverse(b,a)))return false;
  // Reuse the live footprint/water predicates along the whole one-cell step.
  for(let i=0;i<=20;i++)for(const [dx,dy] of footProbeOffsets){
   const point=[a[0]+dx+(b[0]-a[0])*i/20,a[1]+dy+(b[1]-a[1])*i/20];
   const key=point.map(Math.round).join(',');
   if(ground.blocked.has(key)||!ground.clearPoint(point)||world.wet(point)||
      world.waterCollision&&!world.waterCollision.pointClear(point,[a[2],b[2]]))return false;
  }
  return true;
 }
 function add(a,b) {
  if(!clear(a,b))return;
  if(base(a).some(p=>p.join(',')===b.join(','))&&base(b).some(p=>p.join(',')===a.join(',')))return;
  for(const [from,to] of [[a,b],[b,a]]){
   const key=from.join(','),near=links.get(key)||[];
   near.push(to);
   links.set(key,near);
  }
  pairs.push([a,b]);
 }
 if(world.edges.get(APRON)?.kind!=='FORECOURT')return [];
 for(let x=185;x<=197;x++){
  add([x,242,'E028'],[x,243,APRON]);
  add([x,245,APRON],[x,246,'E061']);
 }
 // The south forecourt meets E008 past the western paving seam. The
 // east join is one row below the gate so the gate approach stays intact.
 for(let x=198;x<=213;x++)add([x,245,APRON],[x,246,'E008']);
 add([213,245,APRON],[214,245,'E028']);
 if(links.size)world.neighbours=(p)=>{
  const prior=base(p),joined=links.get(p.join(','));
  return joined?[...prior,...joined.filter(to=>!prior.some(q=>q.join(',')===to.join(',')))]:prior;
 };
 return pairs;
}
