import {fitHousingLanesSteps} from './city-housing-lanes.mjs?v=p21-b525-neighbourhood';
// Atlas's current-ground street composition. Buildings remain separate owned
// production assets: this layer never creates a wall, door, solid or route ID.
import {footProbeOffsets} from './city-free-walk.mjs?v=p21-b407-s039-reuse';
const key=p=>p.slice(0,2).join(','),step=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
const segmentKey=(a,b)=>[key(a),key(b)].sort().join('|');
const structural=o=>o.rect&&!o.person&&!o.bridgePart&&!['street-lamp','ground-contact'].includes(o.sceneryKind)&&!['explicit-e045-reservation','explicit-hide-park-reservation','explicit-hide-park-north-reservation'].includes(o.collisionMode);
const inside=(p,r)=>p[0]>=r[0]-.5&&p[0]<=r[0]+r[2]-.5&&p[1]>=r[1]-.5&&p[1]<=r[1]+r[3]-.5;
function* atlasStreetSteps({world,ground,objects,layout}){
 const footprints=objects.filter(structural),segments=new Map(),corridors=[],rejected=[];
 const footprintCells=new Map();for(const o of footprints){const[x,y,w,h]=o.rect;for(let a=Math.floor(x-1);a<=Math.ceil(x+w);a++)for(let b=Math.floor(y-1);b<=Math.ceil(y+h);b++){const k=a+','+b,list=footprintCells.get(k)||[];list.push(o);footprintCells.set(k,list);}}
 // Adjacent lane strips and foot probes revisit the same exact points.
 // Memoize only inside this read-only fit; later world receivers never use it.
 const sampleCache=new Map();
 // The native water receiver defines pointClear(p, []) as !wet(p).
 // Alternate receivers keep both predicates when they supply a different wet function.
 const sharesWaterPredicate=world.waterCollision.wet===world.wet;
 const clear=p=>{
  const sample=p[0]+','+p[1],cached=sampleCache.get(sample);
  if(cached!==undefined)return cached;
  const k=Math.round(p[0])+','+Math.round(p[1]);
  const ok=world.members.has(k)&&!ground.blocked.has(k)&&!world.wet(p)&&ground.clearPoint(p)&&(sharesWaterPredicate||world.waterCollision.pointClear(p,[]))&&!(footprintCells.get(k)||[]).some(o=>inside(p,o.rect));
  if(sampleCache.size<48000)sampleCache.set(sample,ok);
  return ok;
 };
 const footCache=new Map(),foot=p=>{const k=key(p);if(footCache.has(k))return footCache.get(k);const ok=footProbeOffsets.every(([x,y])=>clear([p[0]+x,p[1]+y]));footCache.set(k,ok);return ok;};
 const housing=yield* fitHousingLanesSteps({world,clear,foot,layout});
 for(const row of [...layout.corridors,...housing.corridors]){
  yield;const points=row.cells;
  if(row.width!==undefined&&![.7,1.1,1.6,2.2,3.2].includes(row.width))throw Error('Unsupported surveyed surface width '+row.id);
  if(!points?.length||points.some(p=>p.length!==2||!p.every(Number.isInteger)||!foot(p))||points.slice(1).some((p,i)=>step(points[i],p)!==1)){rejected.push(row.id);continue;}
  let bad=false;
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],ids=world.members.get(key(a)),targets=world.members.get(key(b));
   if(![...ids].some(id=>world.neighbours([...a,id]).some(n=>n[0]===b[0]&&n[1]===b[1]&&targets.has(n[2])))){bad=true;break;}
  }
  if(bad){rejected.push(row.id);continue;}
  corridors.push(row);
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],id=segmentKey(a,b),s=segments.get(id)||{id,a:a.slice(),b:b.slice(),uses:0,widthHints:[],housingLane:false};s.uses++;s.housingLane||=!!row.housingLane;if(row.width!==undefined)s.widthHints.push(row.width);segments.set(id,s);
  }
 }
 const strips=[];
 for(const s of segments.values()){
  yield;const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],normal=[-dy,dx];
  const wanted=s.widthHints.length?Math.max(...s.widthHints):s.uses>=3?3.2:s.uses>=2?2.2:1.6;
  const widths=[3.2,2.2,1.6,1.1,...(s.housingLane?[.7]:[])].filter(w=>w<=wanted);
  const clearStrip=p=>clear(p)&&(!s.housingLane||housing.legal(p));
  const width=widths.find(w=>[0,.25,.5,.75,1].every(t=>[-w/2,0,w/2].every(h=>clearStrip([s.a[0]+dx*t+normal[0]*h,s.a[1]+dy*t+normal[1]*h])))&&(!s.housingLane||[s.a,s.b].every(p=>Array.from({length:8},(_,i)=>i*Math.PI/4).every(a=>clearStrip([p[0]+Math.cos(a)*w/2,p[1]+Math.sin(a)*w/2])))));
  if(width)strips.push({...s,width,carriageWidth:Math.max(.4,width-(width>=2.2?.9:.35))});
 }
 const stripIds=new Set(strips.map(s=>s.id));
 const bounds=strips.length?[Math.min(...strips.flatMap(s=>[s.a[0],s.b[0]]))-2,Math.min(...strips.flatMap(s=>[s.a[1],s.b[1]]))-2,Math.max(...strips.flatMap(s=>[s.a[0],s.b[0]]))+2,Math.max(...strips.flatMap(s=>[s.a[1],s.b[1]]))+2]:[];
 return {id:layout.id,source:layout.source,corridors,rejected,strips,bounds,housing:{requested:housing.requested,elapsedMS:housing.elapsedMS,resolved:housing.corridors.length,rejected:housing.rejected,snaps:housing.snaps,cells:housing.cellCount,missingPaving:segments.size-strips.length,housingMissingPaving:[...segments.values()].filter(s=>s.housingLane&&!stripIds.has(s.id)).length},waypoints:[...layout.waypoints,...housing.waypoints].filter(w=>foot(w.position)&&world.members.get(key(w.position))?.has(w.edge)),navigationChanged:false};
}
// Keep the small neighbourhood planner and source checks synchronous.
export function compileAtlasStreets(input){
 const steps=atlasStreetSteps(input);
 for(let result=steps.next();;result=steps.next())if(result.done)return result.value;
}
// The city-wide pass searches many connected lanes. Yield to the browser
// between slices while retaining the same queue, costs and clearance rules.
export async function compileAtlasStreetsForStartup(input,{now=()=>performance.now(),pause,budgetMS=12}={}){
 const steps=atlasStreetSteps(input);
 // Yield without chaining timer delays when the browser offers posted tasks.
 // The slice budget still leaves regular chances for loading paint and input.
 const channel=!pause&&typeof MessageChannel==='function'?new MessageChannel():null;
 let resume;
 if(channel)channel.port1.onmessage=()=>resume?.();
 const yieldFrame=pause||(channel?()=>new Promise(resolve=>{resume=resolve;channel.port2.postMessage(0);}):()=>new Promise(resolve=>setTimeout(resolve,0)));
 let deadline=now()+budgetMS;
 try{
  for(let result=steps.next();;result=steps.next()){
   if(result.done)return result.value;
   if(now()>=deadline){await yieldFrame();deadline=now()+budgetMS;}
  }
 }finally{if(channel){channel.port1.close();channel.port2.close();}}
}
export function createAtlasStreetSurface({plan,images}){
 const groups=new Map(),patterns=new WeakMap();let draws=0;
 for(const s of plan.strips){const k=s.width+':'+s.carriageWidth;let g=groups.get(k);if(!g){g={width:s.width,carriageWidth:s.carriageWidth,path:new Path2D()};groups.set(k,g);}g.path.moveTo(...s.a);g.path.lineTo(...s.b);}
 function texture(ctx){let p=patterns.get(ctx);if(p)return p;p={};for(const [id,image]of Object.entries(images)){p[id]=ctx.createPattern(image,'repeat');p[id].setTransform(new DOMMatrix().scale(4.8/image.width,4.8/image.height));}patterns.set(ctx,p);return p;}
 return {
  draw(ctx,view){
   if(!plan.strips.length)return;
   const b=plan.bounds,projected=[[28*(b[0]-b[3]),14*(b[0]+b[1])],[28*(b[2]-b[1]),14*(b[2]+b[3])]];
   if(projected[0][0]>view[2]||projected[1][0]<view[0]||projected[0][1]>view[3]||projected[1][1]<view[1])return;
   ctx.save();ctx.transform(28,14,-28,14,0,0);ctx.lineCap='round';ctx.lineJoin='round';const p=texture(ctx);
   for(const g of groups.values()){ctx.strokeStyle='#443a2c40';ctx.lineWidth=g.width+.12;ctx.stroke(g.path);ctx.strokeStyle=p['flags-b'];ctx.lineWidth=g.width;ctx.stroke(g.path);}
   for(const g of groups.values()){ctx.strokeStyle=p['cobbles-a'];ctx.lineWidth=g.carriageWidth;ctx.stroke(g.path);}
   ctx.restore();draws++;
  },
  report:()=>({id:plan.id,corridors:plan.corridors.length,rejected:plan.rejected,housing:plan.housing,segments:plan.strips.length,widths:[...new Set(plan.strips.map(s=>s.width))].sort(),waypoints:plan.waypoints.length,paintDraws:draws,navigationChanged:false,buildingsAdded:0,interactiveDoorsAdded:0,uniqueBuildingProductionPending:true})
 };
}
