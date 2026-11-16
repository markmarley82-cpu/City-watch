import {createStreetSearch,streetTapCellConnected} from './city-movement.mjs?v=p21-b444-tap-route-start';
import {project,unproject} from './city-core.mjs?v=p21-b407-s039-reuse';

// Same thumb-tolerance targets/order as streetTapPath, selected once per tap.
export function streetTapTargets(world,point,{zoom=1,radius=18,start}={}){
 if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y)||!Number.isFinite(zoom)||zoom<=0)return [];
 const target=unproject(point),key=p=>p.join(',');
 if(world.members.has(key(target))&&(start?.[0]===target[0]&&start?.[1]===target[1]||streetTapCellConnected(world,target)))return [{position:target}];
 if(world.wet?.(target))return [];
 const candidates=[];
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
  const position=[target[0]+dx,target[1]+dy];if(!streetTapCellConnected(world,position))continue;
  const screen=project(position),distance=Math.hypot(screen.x-point.x,screen.y-point.y)*zoom;
  if(distance<=radius)candidates.push({position,distance});
 }
 candidates.sort((a,b)=>a.distance-b.distance);
 return candidates.slice(0,3);
}

// Manual taps own this asynchronous result. Public city.nav stays synchronous.
// The city graph is fixed after boot; a new topology identity invalidates work.
// captureOccupied must return the existing occupancy predicate over a detached
// snapshot. Movement still checks live occupancy before every accepted step.
export function createTapRoutePlanner({world,position,blocked,captureOccupied,onRoute,onFailure,onError,onCancel=()=>{},schedule=fn=>setTimeout(fn,0),unschedule=id=>clearTimeout(id),maxPops=16}){
 let generation=0,active=null,timer=null;
 const identity=()=>[world.members,world.edges,world.neighbours,world.canTraverse,world.members.size,world.edges.size];
 const same=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
 const key=p=>p.join(',');
 function cancel(){generation++;if(timer!==null){unschedule(timer.id);timer=null;}active?.search?.cancel();active=null;}
 function discard(request){if(active===request){cancel();onCancel(request.meta);}}
 function current(request){return active===request&&request.generation===generation&&!blocked()&&key(position())===request.startKey&&same(request.topology,identity());}
 function queue(request){const scheduled={id:null};timer=scheduled;scheduled.id=schedule(()=>{if(timer===scheduled)timer=null;tick(request);});}
 function finish(request,path){if(!current(request)){discard(request);return;}active=null;request.search=null;if(path===null)onFailure(request.meta);else onRoute(path,request.meta);}
 function tick(request){
  try{
   if(!current(request)){discard(request);return;}
   if(!request.search){const target=request.targets[request.index];if(!target){finish(request,null);return;}request.search=createStreetSearch(world,request.start,target.position,target.edge,{occupied:request.occupied});}
   const result=request.search.advance(maxPops);
   if(!current(request)){discard(request);return;}
   if(result.status==='pending'){queue(request);return;}
   if(result.status==='complete'&&result.path!==null){finish(request,result.path);return;}
   request.search=null;request.index++;queue(request);
  }catch(error){if(active===request){cancel();onError(error,request.meta);}}
 }
 return {
  start({target,edge,tapPoint,zoom=1,radius=18,meta={}}){
   cancel();
   try{
    if(blocked())return false;
    const start=Object.freeze(position().slice()),topology=identity();
    const targets=tapPoint?streetTapTargets(world,{x:tapPoint.x,y:tapPoint.y},{zoom,radius,start}):[{position:[target[0],target[1]],edge}];
    for(const value of targets)Object.freeze(value.position);
    const request={generation,start,startKey:key(start),topology,targets,index:0,search:null,occupied:captureOccupied(),meta};active=request;queue(request);return true;
   }catch(error){cancel();onError(error,meta);return false;}
  },
  cancel,
  pending:()=>active!==null,
  report:()=>({pending:active!==null,generation,index:active?.index??null,search:active?.search?.report()??null})
 };
}
