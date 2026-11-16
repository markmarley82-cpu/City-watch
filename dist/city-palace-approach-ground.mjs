// Actor-local presentation only; never add/remove a route, collider, door or premise.
export function applyPalaceApproachGround({palaceRect,world,ground,footProbes,people,objects,project,alphaAt,masks,height=60}){
 if(!palaceRect||!footProbes?.length)return [];
 const [x,y,w,h]=palaceRect,changed=new Set();
 for(const p of people){
  if(!['E010','E028','PALACE:PUBLIC','APRON:palace'].includes(p[2])||p[0]<x-3||p[0]>x+w+3||p[1]<y-3||p[1]>y+h+3)continue;
  if(!footProbes.every(([dx,dy])=>{const q=[p[0]+dx,p[1]+dy,p[2]];return world.members.get(Math.round(q[0])+','+Math.round(q[1]))?.has(q[2])&&ground.clearPoint(q)&&world.waterCollision.pointClear(q,[q[2]]);} ))continue;
  const foot=project(p),feet=[-6,0,6].map(dx=>({x:foot.x+dx,y:foot.y}));
  const mask={x:foot.x,y:foot.y-height*.25,rx:48,ry:Math.max(30,height*1.15),opacity:.04};
  for(const o of objects){
   if(o.bridgePart||!o.im||o.sceneryKind!=='building'||!feet.some(q=>alphaAt(o,q)>.02))continue;
   const own=masks.get(o.id)||[];own.push({...mask});masks.set(o.id,own);changed.add(o.id);
  }
 }
 return [...changed];
}
