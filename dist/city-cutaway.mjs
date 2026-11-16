export const CITY_CUTAWAY_OPACITY=0.82;
export const CITY_CUTAWAY_LIMIT=2;
export const CITY_CUTAWAY_STRUCTURAL_KINDS=Object.freeze(['building','individual-house','joined-premises','palace-range','roof','wall']);

const structuralKinds=new Set(CITY_CUTAWAY_STRUCTURAL_KINDS);

export function cityCutawayEligible(object){
 if(object?.cutawayEligible===false)return false;
 if(object?.cutawayEligible===true)return true;
 return object?.sceneryKind==null||structuralKinds.has(object.sceneryKind);
}

export function cityDepth(object){
 const r=object?.rect;
 return Array.isArray(r)&&r.length>=4?r[0]+r[1]+r[2]+r[3]:0;
}

export function selectCityCutaways(cover,limit=CITY_CUTAWAY_LIMIT){
 return [...cover].filter(cityCutawayEligible).sort((a,b)=>cityDepth(a)-cityDepth(b)).slice(-Math.max(0,limit));
}

export function applyCityCutaways(opacities,cover,opacity=CITY_CUTAWAY_OPACITY){
 const selected=selectCityCutaways(cover);
 for(const object of selected)opacities.set(object.id,Math.min(opacities.get(object.id)??1,opacity));
 return selected;
}

export const APPROACH_ROOF_TRANSMISSION=.85;
// A full-body window reaches below the boots; surrounding architecture stays opaque.
export function approachRoofCutawayMask(point,height,count=1){
 const n=Math.max(1,Math.floor(count));
 return {x:point.x,y:point.y-height*.48,rx:24,ry:Math.max(30,height*.62),opacity:1-Math.pow(APPROACH_ROOF_TRANSMISSION,1/n)};
}

// Keep the feather outside the boots and the paving immediately around them.
export function walkingCutawayMask(mask,point,height,isPlayer,count=1,pavingOnly=false){
 const n=Math.max(1,Math.floor(count));
 return {
  ...mask,
  y:pavingOnly?point.y-14:Math.min(mask.y,point.y-height),
  toY:pavingOnly?point.y+18:Math.max(mask.toY??mask.y,point.y+(isPlayer?14:0)),
  rx:Math.max(mask.rx,isPlayer?54:32),
  ry:pavingOnly?28:Math.max(mask.ry,30),
  opacity:Math.min(mask.opacity,1-Math.pow(pavingOnly ? .85 : .78,1/n)),
  groundOnly:true,
  walking:true
 };
}


// Probe the next step in each direction without revealing paving across a wall.
export function walkingGroundSamples(point,{world,ground,project}){
 const anchor=[Math.round(point[0]),Math.round(point[1]),point[2]];
 const samples=[],seen=new Set();
 for(const [x,y,edge] of world.neighbours(anchor)){
  const dx=x-anchor[0],dy=y-anchor[1];
  if(Math.abs(dx)+Math.abs(dy)!==1)continue;
  // A roof edge can cross the middle of the paving while the next tile centre is clear.
  for(const distance of [.5,1]){
   const next=[point[0]+dx*distance,point[1]+dy*distance,edge];
   if(!ground.clearPoint(next)||!world.waterCollision.pointClear(next,[point[2],edge]))break;
   const key=dx+','+dy+','+distance;
   if(seen.has(key))continue;
   seen.add(key);samples.push({world:next,screen:project(next)});
  }
 }
 return samples;
}


// Only a painted occluder can make a forward paving sample relevant.
// Cache each sweep for this rendered foot across all covering objects.
export function e045PavingSweep(world,foot){
 if(foot[2]!=='E045'||Number.isInteger(foot[0])&&Number.isInteger(foot[1])||!world.canTraverse)return null;
 let results;
 return step=>{
  results??=new Map();
  if(!results.has(step))results.set(step,world.canTraverse(foot,step));
  return results.get(step);
 };
}
