// Receiving candidate: reveal only validated existing ground near selected doors.
export function createDoorGroundReveal(street,buildings){
 const tag=street.toLowerCase()+'DoorReveal';
 const thresholds=buildings.map(b=>{const d=b.doorControl[0],x=d[0]-b.anchor[0],y=d[1]-b.anchor[1];return[b.p[0]+x/56+y/28,b.p[1]+y/28-x/56];});
 return function reveal({world,ground,footProbes,player,objects,project,alphaAt,masks,height=60}){
  if(player?.[2]!==street||!footProbes?.length)return[];
  let distance=Infinity;for(const p of thresholds)distance=Math.min(distance,Math.hypot(player[0]-p[0],player[1]-p[1]));
  if(!(distance<1.05))return[];
  if(!footProbes.every(([dx,dy])=>{const p=[player[0]+dx,player[1]+dy,player[2]];return world.members.get(Math.round(p[0])+','+Math.round(p[1]))?.has(street)&&ground.clearPoint(p)&&world.waterCollision.pointClear(p,[street]);}))return[];
  const t=Math.max(0,(distance-.65)/.4),opacity=t===0?.04:.04+.96*t*t*(3-2*t);
  const foot=project(player),samples=[-6,0,6].map(dx=>({x:foot.x+dx,y:foot.y}));
  const cover=objects.filter(o=>o.im&&(o.legacyFitted||o.sourceAsset?.startsWith('legacy:'))&&samples.some(p=>alphaAt(o,p)>.02));
  // The engine creates a new map each frame. Preserve masks for other people.
  for(const o of cover)masks.set(o.id,[...(masks.get(o.id)||[]),{x:foot.x,y:foot.y-height*.25,rx:38,ry:Math.max(30,height*1.05),opacity,groundOnly:true,toY:foot.y+12,[tag]:true}]);
  return cover.map(o=>o.id);
 };
}
