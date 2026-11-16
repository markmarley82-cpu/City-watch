// The pairwise scene comparator is not transitive. Honour Guild/actor planes
// after that sort, retaining structural painting order and actor-to-actor order.
export function constrainGuildActorOrder(render,{project,inFront,height=()=>58,alphaAt=null}={}){
 const moves=[],blocked=[];if(!render.some(o=>o.landmark?.guild_exterior))return{moves,blocked};
 const overlap=(a,b)=>a&&b&&a[0]<b[0]+b[2]&&a[0]+a[2]>b[0]&&a[1]<b[1]+b[3]&&a[1]+a[3]>b[1];
 // Street lamps in front of a Guild must also follow its painting. Otherwise
 // the actor would need to be both before that lamp and after a later Guild.
 for(const lamp of render.filter(o=>o.sceneryKind==='street-lamp')){
  const native=render.indexOf(lamp),outside=render.filter(o=>o!==lamp);let lo=0,hi=outside.length,found=false;
  for(let i=0;i<outside.length;i++){
   const o=outside[i];if(!o.landmark?.guild_exterior||!overlap(lamp.bounds,o.bounds))continue;
   if(alphaAt&&![.25,.5,.75].some(x=>[.1,.4,.7,1].some(y=>alphaAt(o,{x:lamp.bounds[0]+lamp.bounds[2]*x,y:lamp.bounds[1]+lamp.bounds[3]*y})>.02)))continue;
   found=true;if(inFront(lamp.p,o))lo=Math.max(lo,i+1);else hi=Math.min(hi,i);
  }
  if(!found||lo>hi)continue;const slot=Math.max(lo,Math.min(hi,native));if(slot===native)continue;
  render.splice(native,1);render.splice(slot,0,lamp);moves.push({id:lamp.id,from:native,to:slot});
 }
 for(const actor of render.filter(o=>o.person)){
  const q=project(actor.p),h=height(actor),body=[q.x-16,q.y-h,32,h+6],native=render.indexOf(actor),outside=render.filter(o=>o!==actor);let lo=0,hi=outside.length,hasGuild=false;
  for(let i=0;i<outside.length;i++){
   const o=outside[i];if(!o.person&&(!overlap(body,o.bounds)||alphaAt&&![-12,0,12].some(dx=>[-.9,-.7,-.5,-.3,0].some(dy=>alphaAt(o,{x:q.x+dx,y:q.y+dy*h})>.02))))continue;
   const guild=!!o.landmark?.guild_exterior;
   if(guild)hasGuild=true;
   // A nearby lamp can share the same comparator error. Honour all actual
   // overlapping scenery planes in this Guild view; bridge ordering runs last.
   const before=o.person?render.indexOf(o)<native:inFront(actor.p,o);
   if(before)lo=Math.max(lo,i+1);else hi=Math.min(hi,i);
  }
  if(!hasGuild)continue;
  if(lo>hi){blocked.push({id:actor.id,lo,hi});continue;}
  const slot=Math.max(lo,Math.min(hi,native));if(slot===native)continue;
  render.splice(native,1);render.splice(slot,0,actor);moves.push({id:actor.id,from:native,to:slot});
 }
 return{moves,blocked};
}
