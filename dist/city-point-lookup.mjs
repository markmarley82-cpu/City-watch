// Campaign contacts query the completed walking graph; they do not edit it.
// Preserve the old stable nearest-point result without sorting the entire city
// for every HUD refresh, partner spawn or encounter-range check.
export function createCityPointLookup(world,{fallback=[126,132,'RC1'],maxCached=128}={}){
 const cache=new Map();let cells=null,memberCount=-1,edgeCount=-1,calls=0,exactHits=0,cacheHits=0,indexBuilds=0,scanned=0;
 function resetIfChanged(){if(memberCount===world.members.size&&edgeCount===world.edges.size)return;memberCount=world.members.size;edgeCount=world.edges.size;cells=null;cache.clear();}
 function nearest(p){
  calls++;resetIfChanged();const x=Number(p?.[0]),y=Number(p?.[1]);
  if(!Number.isFinite(x)||!Number.isFinite(y))return fallback.slice();
  if(Number.isInteger(x)&&Number.isInteger(y)){
   const ids=world.members.get(x+','+y);
   if(ids)for(const id of ids)if(world.edges.has(id)){exactHits++;return [x,y,id];}
  }
  const key=x+','+y,known=cache.get(key);
  if(known){cacheHits++;return known.slice();}
  if(!cells){cells=[];for(const [key,ids] of world.members){const [cx,cy]=key.split(',').map(Number);for(const id of ids)if(world.edges.has(id))cells.push([cx,cy,id]);}indexBuilds++;}
  let best=null,bestDistance=Infinity;
  // Strictly-less keeps Map/Set insertion order for equidistant points, as
  // the former stable Array.sort did. Squared distance has the same ordering.
  for(const cell of cells){scanned++;const d=(cell[0]-x)**2+(cell[1]-y)**2;if(d<bestDistance){bestDistance=d;best=cell;}}
  const result=(best||fallback).slice();
  if(maxCached>0){if(cache.size>=maxCached)cache.delete(cache.keys().next().value);cache.set(key,result);}
  return result.slice();
 }
 return Object.freeze({nearest,invalidate(){memberCount=edgeCount=-1;cells=null;cache.clear();},report:()=>({calls,exactHits,cacheHits,indexBuilds,scanned,indexed:cells?.length||0,cached:cache.size,maxCached})});
}
