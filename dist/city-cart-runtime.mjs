// Isolated approved cart receiver. Host owns existing frame/input/save lifecycles.
import {project} from './city-core.mjs?v=p21-b407-s039-reuse';
import {createCartTraffic,cartHull} from './city-cart-traffic.mjs?v=p21-b407-s039-reuse';
import {createCartAnimator,chooseCartVariant} from './city-cart-animation.mjs?v=p21-b407-s039-reuse';
import {createCartClearance,polygonsOverlap} from './city-cart-clearance.mjs?v=p21-b521-street-budget';
export async function createCityCarts({world,objects,data,read,load,view,occupants,random=Math.random,limit=4}){
 const manifest=await read('assets/cart-traffic-v1/manifest.json');
 const clearance=createCartClearance({world,objects,data}),survey=clearance.survey(manifest.geometry);
 const clips=manifest.clips,images=new Map(),animators=new Map(),roster=new Map();
 // Sequential decode keeps the asset extension inside the existing phone budget.
 for(const c of clips)images.set(c.id,await load(c.path));
 let snapshots=[],frameOccupants=null,next=0,serial=0,spawned=0,departed=0,paused=true;
 const viewBounds=()=>view()?.bounds;
 function visible(hull){const b=viewBounds();if(!b)return true;const ps=hull.map(p=>project(p));return Math.max(...ps.map(p=>p.x))+16>=b[0]&&Math.min(...ps.map(p=>p.x))-16<=b[2]&&Math.max(...ps.map(p=>p.y))+16>=b[1]&&Math.min(...ps.map(p=>p.y))-120<=b[3];}
 function routeBounds(route){const ps=route.poses.map(p=>project([p.x,p.y]));return [Math.min(...ps.map(p=>p.x))-160,Math.min(...ps.map(p=>p.y))-180,Math.max(...ps.map(p=>p.x))+160,Math.max(...ps.map(p=>p.y))+180];}
 const engines=survey.routes.map(route=>({route,bounds:routeBounds(route),current:[],traffic:createCartTraffic({
  geometry:manifest.geometry,routes:[route],speed:manifest.speed,visible,
  clearPose:(hull,{id})=>clearance.clear(hull,route.edgeID,{occupants:frameOccupants??=occupants()})&&
   !snapshots.some(c=>c.id!==id&&polygonsOverlap(hull,cartHull(c.pose,{
    ...manifest.geometry,length:manifest.geometry.length+.7,width:manifest.geometry.width+.4
   })))
 })}));
 function collect(){snapshots=engines.flatMap(e=>e.current.map(c=>({...c,edgeID:e.route.edgeID})));}
 function tick(now,{paused:stop=false,hidden=false}={}){
  if(!Number.isFinite(now))return;
  const b=viewBounds(),halted=stop||hidden||!b;
  if(halted!==paused){paused=halted;for(const e of engines)e.traffic.setPaused(paused,now);}
  if(halted)return;
  frameOccupants=null;
  const previous=new Set(snapshots.map(c=>c.id));
  for(const e of engines)if(e.current.length){e.current=e.traffic.advance(now);collect();}
  for(const id of previous)if(!snapshots.some(c=>c.id===id)){animators.delete(id);roster.delete(id);departed++;}
  if(now>=next&&snapshots.length<limit&&engines.length){
   next=now+3500;const begin=Math.floor(random()*engines.length);
   for(let i=0;i<engines.length;i++){
    const e=engines[(begin+i)%engines.length],r=e.bounds;
    // Only service journeys near this viewport; no whole-city simulation load.
    if(r[2]<b[0]||r[0]>b[2]||r[3]<b[1]||r[1]>b[3])continue;
    const id='city-cart-'+serial;
    if(e.traffic.spawn(id,e.route.id)){if(!e.current.length)e.traffic.setPaused(false,now);serial++;spawned++;const variant=chooseCartVariant(clips,random()),clip=clips.find(c=>c.id===variant);roster.set(id,variant);animators.set(id,createCartAnimator({clip,strideLength:manifest.strideLength}));e.current=e.traffic.snapshot();collect();break;}
   }
  }
 }
 function actors(){return snapshots.map(c=>({id:c.id,p:[c.pose.x,c.pose.y,c.edgeID],person:true,cart:true,snapshot:c,variant:roster.get(c.id)}));}
 function draw(g,actor){const clip=clips.find(c=>c.id===actor.variant),animator=animators.get(actor.id);if(!clip||!animator)return;const frame=animator.select(actor.snapshot),q=project(actor.p),[sx,sy,w,h]=frame.source,z=clip.scale;g.save();g.globalAlpha*=frame.alpha;g.drawImage(images.get(clip.id),sx,sy,w,h,q.x-frame.anchor[0]*z,q.y-frame.anchor[1]*z,w*z,h*z);g.restore();}
 function occupied(p){return snapshots.some(c=>polygonsOverlap(cartHull(c.pose,manifest.geometry),[[p[0]-.22,p[1]-.22],[p[0]+.22,p[1]-.22],[p[0]+.22,p[1]+.22],[p[0]-.22,p[1]+.22]]));}
 return {tick,actors,draw,occupied,report:()=>({ready:true,active:snapshots.length,spawned,departed,routeIDs:survey.routes.map(r=>r.edgeID),routes:survey.routes,variants:clips.map(c=>c.id),paused,limit,clearance:clearance.report(),states:snapshots.map(c=>({id:c.id,route:c.routeId,variant:roster.get(c.id),state:c.state,travel:c.travel,p:[c.pose.x,c.pose.y],alpha:c.alpha}))}),dispose(){for(const e of engines){e.traffic.clear();e.current=[];}snapshots=[];roster.clear();animators.clear();}};
}
