import {pointIn,key,distance} from './city-core.mjs?v=p21-b407-s039-reuse';

// Collision uses the same water polygons and dry cutouts as the river painting.
// A bridge identity permits water only inside that bridge's actual deck.
export function installWaterCollision(world,river,bridges){
 const polygons=river.surfaces.map(s=>s.engine_polygon),originalWater=world.water,dry=river.dryReceivers||[],decks=new Map(bridges.bridges.map(b=>[b.edge,b])),standCache=new Map(),segmentCache=new Map(),footProbes=[[0,0],[-.12,-.12],[-.12,.12],[.12,-.12],[.12,.12]];
 const bounds=polygons.map(p=>[Math.min(...p.map(q=>q[0])),Math.min(...p.map(q=>q[1])),Math.max(...p.map(q=>q[0])),Math.max(...p.map(q=>q[1]))]);
 const inRect=(p,r)=>p[0]>=r[0]&&p[0]<=r[0]+r[2]&&p[1]>=r[1]&&p[1]<=r[1]+r[3];
 const paintedWet=p=>polygons.some((poly,i)=>p[0]>=bounds[i][0]&&p[0]<=bounds[i][2]&&p[1]>=bounds[i][1]&&p[1]<=bounds[i][3]&&pointIn(p,poly))&&!dry.some(r=>inRect(p,r));
 const originalBounds=originalWater.map(p=>[Math.min(...p.map(q=>q[0])),Math.min(...p.map(q=>q[1])),Math.max(...p.map(q=>q[0])),Math.max(...p.map(q=>q[1]))]);
 const waterBounds=[...bounds,...originalBounds];
 const wet=p=>originalWater.some((poly,i)=>p[0]>=originalBounds[i][0]&&p[0]<=originalBounds[i][2]&&p[1]>=originalBounds[i][1]&&p[1]<=originalBounds[i][3]&&pointIn(p,poly))||paintedWet(p);
 const onDeck=(p,id)=>{const b=decks.get(id);return !!b&&p[0]>=b.anchor[0]-b.width/2&&p[0]<=b.anchor[0]+b.width/2&&p[1]>=b.anchor[1]&&p[1]<=b.anchor[1]+b.length;};
 const pointClear=(p,ids)=>!wet(p)||(Array.isArray(ids)?ids:[ids]).some(id=>onDeck(p,id));
 const remember=(cache,k,value)=>{if(cache.size>=8192)cache.delete(cache.keys().next().value);cache.set(k,value);};
 const deckKey=ids=>[...new Set((Array.isArray(ids)?ids:[ids]).filter(id=>decks.has(id)))].sort().join('|');
 // Probe coordinates have already been evaluated into primitive values by +.
 // Keep public geometry reads in their original order; only avoid constructing
 // and indexing a new point array for each of the private five foot probes.
 function probeIn(x,y,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
 function probeClear(x,y,ids){
  const wet=originalWater.some((poly,i)=>x>=originalBounds[i][0]&&x<=originalBounds[i][2]&&y>=originalBounds[i][1]&&y<=originalBounds[i][3]&&probeIn(x,y,poly))||polygons.some((poly,i)=>x>=bounds[i][0]&&x<=bounds[i][2]&&y>=bounds[i][1]&&y<=bounds[i][3]&&probeIn(x,y,poly))&&!dry.some(r=>x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]&&y<=r[1]+r[3]);
  return !wet||(Array.isArray(ids)?ids:[ids]).some(id=>{const b=decks.get(id);return !!b&&x>=b.anchor[0]-b.width/2&&x<=b.anchor[0]+b.width/2&&y>=b.anchor[1]&&y<=b.anchor[1]+b.length;});
 }
 function standClear(p,ids){const cache=Number.isInteger(p[0])&&Number.isInteger(p[1]),k=cache?p[0]+','+p[1]+':'+deckKey(ids):null;if(cache&&standCache.has(k))return standCache.get(k);let result=true;for(let i=0;i<footProbes.length;i++){const offset=footProbes[i];if(!probeClear(p[0]+offset[0],p[1]+offset[1],ids)){result=false;break;}}if(cache)remember(standCache,k,result);return result;}
 function segmentClear(from,to){const ids=[from[2],to[2]],cache=[...from.slice(0,2),...to.slice(0,2)].every(Number.isInteger);
  // Preserve input/slice validation first. Ordinary integer route arrays can
  // use the existing immutable water-bounds rejection before cache/deck keys.
  let ordinary=false;if(cache&&Array.isArray(from)&&Array.isArray(to)){try{ordinary=Object.getPrototypeOf(from)===Array.prototype&&Object.getPrototypeOf(to)===Array.prototype&&!Object.hasOwn(from,'slice')&&!Object.hasOwn(to,'slice');}catch{}}
  if(ordinary){const box=[Math.min(from[0],to[0])-.12,Math.min(from[1],to[1])-.12,Math.max(from[0],to[0])+.12,Math.max(from[1],to[1])+.12];if(!waterBounds.some(b=>box[0]<=b[2]&&box[2]>=b[0]&&box[1]<=b[3]&&box[3]>=b[1]))return true;}
  const k=cache?[from.slice(0,2).join(','),to.slice(0,2).join(',')].sort().join(':')+':'+deckKey(ids):null;if(cache&&segmentCache.has(k))return segmentCache.get(k);const record=result=>{if(cache)remember(segmentCache,k,result);return result;};const box=[Math.min(from[0],to[0])-.12,Math.min(from[1],to[1])-.12,Math.max(from[0],to[0])+.12,Math.max(from[1],to[1])+.12];if(!waterBounds.some(b=>box[0]<=b[2]&&box[2]>=b[0]&&box[1]<=b[3]&&box[3]>=b[1]))return record(true);const n=Math.max(1,Math.ceil(distance(from,to)/.06));for(let i=0;i<=n;i++){const t=i/n;if(!standClear([from[0]+(to[0]-from[0])*t,from[1]+(to[1]-from[1])*t],ids))return record(false);}return record(true);}
 let removed=0;
 for(const [k,ids]of world.members){const p=k.split(',').map(Number);for(const id of ids)if(!standClear(p,id)){ids.delete(id);removed++;}if(!ids.size)world.members.delete(k);}
 const originalNeighbours=world.neighbours;world.wet=wet;world.canTraverse=segmentClear;
 world.neighbours=s=>originalNeighbours(s).filter(n=>standClear(n,n[2])&&segmentClear(s,n));
 function recover(position){if(!Array.isArray(position)||position.length!==3||!position.slice(0,2).every(Number.isFinite))return null;if(world.members.get(key(position.slice(0,2)))?.has(position[2])&&standClear(position,position[2]))return position.slice();let found=null,best=Infinity;for(const [k,ids]of world.members){const p=k.split(',').map(Number),d=distance(p,position);if(d>30)continue;for(const id of ids){if(!standClear(p,id))continue;const score=d+(id===position[2]?0:2);if(score<best){best=score;found=[...p,id];}}}return found;}
 const api=Object.freeze({wet,paintedWet,onDeck,pointClear,standClear,segmentClear,recover,report:()=>({policy:'painted-water-and-exact-decks',paintedSurfaces:polygons.length,bridges:decks.size,removedStates:removed})});
 world.waterCollision=api;return api;
}
