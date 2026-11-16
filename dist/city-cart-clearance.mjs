// Cart-only receiver. Does not widen roads, register graph cells or change walkers.
import {cartHull} from './city-cart-traffic.mjs?v=p21-b407-s039-reuse';
import {streetSurfaceProfile} from './city-street-hierarchy.mjs?v=p21-b407-s039-reuse';
function interval(polygon,ax,ay){
 let lo=Infinity,hi=-Infinity;
 for(const p of polygon){const v=p[0]*ax+p[1]*ay;lo=Math.min(lo,v);hi=Math.max(hi,v);}
 return [lo,hi];
}
export function polygonsOverlap(a,b){
 for(const polygon of [a,b])for(let i=0;i<polygon.length;i++){
  const p=polygon[i],q=polygon[(i+1)%polygon.length],ax=q[1]-p[1],ay=p[0]-q[0];
  const [alo,ahi]=interval(a,ax,ay),[blo,bhi]=interval(b,ax,ay);
  if(ahi<blo||bhi<alo)return false;
 }return true;
}
const rectangle=([x,y,w,h],pad=0)=>[x-.5-pad,y-.5-pad,x+w-.5+pad,y+h-.5+pad];
// A cart hull is tested against many axis-aligned boxes at each swept pose.
// Its separating axes and projections are fixed for all of these tests.
function prepareHull(hull){
 const [left,right]=interval(hull,1,0),[top,bottom]=interval(hull,0,1);
 const axes=hull.map((p,i)=>{const q=hull[(i+1)%hull.length],ax=q[1]-p[1],ay=p[0]-q[0];return [ax,ay,...interval(hull,ax,ay)];});
 function box(x0,y0,x1,y1){
  if(x1<left||right<x0||y1<top||bottom<y0)return false;
  for(const [ax,ay,lo,hi] of axes){
   const min=(ax<0?x1:x0)*ax+(ay<0?y1:y0)*ay,max=(ax<0?x0:x1)*ax+(ay<0?y0:y1)*ay;
   if(hi<min||max<lo)return false;
  }
  return true;
 }
 return {left,right,top,bottom,box};
}
export function createCartClearance({world,objects,data,margin=.12}){
 const held=new Set([...(data.runtime_policy.excluded_relation_ids||[]),...(data.runtime_policy.held_route_ids||[])]);
 const structures=objects.filter(o=>o.rect&&!o.person&&!o.bridgePart&&!['street-lamp','ground-contact'].includes(o.sceneryKind)).map(o=>rectangle(o.rect,margin));
 const structureIndex=new Map();
 for(const o of structures){const [left,top,right,bottom]=o;for(let y=Math.floor(top/8);y<=Math.floor(bottom/8);y++)for(let x=Math.floor(left/8);x<=Math.floor(right/8);x++){const key=x+','+y;if(!structureIndex.has(key))structureIndex.set(key,[]);structureIndex.get(key).push(o);}}
 const doors=[...world.doors.values()].map(({position:[x,y]})=>rectangle([x,y,1,1],.65));
 const cartRoads=new Set(['E008','E024','E025','E039','E042','E043','E044']);
 const eligible=e=>e&&cartRoads.has(e.id)&&e.kind==='STREET'&&!held.has(e.id)&&e.points?.length===2;
 const roads=new Map();
 function roadInfo(edgeID){const e=world.edges.get(edgeID);if(!eligible(e))return null;const known=roads.get(e);if(known)return known;const [a,b]=e.points,dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(!length)return null;const info={edge:e,a,b,length,tangent:[dx/length,dy/length],profile:streetSurfaceProfile(e)};roads.set(e,info);return info;}
 function clear(hull,edgeID,{occupants=[]}={}){
  const r=roadInfo(edgeID);if(!r)return false;
  for(const p of hull){const v=[p[0]-r.a[0],p[1]-r.a[1]],at=v[0]*r.tangent[0]+v[1]*r.tangent[1],off=Math.abs(v[0]*r.tangent[1]-v[1]*r.tangent[0]);
   const width=r.profile?r.profile.carriageWidthAt(at):Number(r.edge.width_cells)-.6;
   if(at<0||at>r.length||!Number.isFinite(width)||off+margin>width/2)return false;
  }
  const {left:minX,right:maxX,top:minY,bottom:maxY,box}=prepareHull(hull);
  const nearby=new Set();for(let y=Math.floor(minY/8);y<=Math.floor(maxY/8);y++)for(let x=Math.floor(minX/8);x<=Math.floor(maxX/8);x++)for(const o of structureIndex.get(x+','+y)||[])nearby.add(o);
  if([...nearby].some(o=>box(...o)))return false;
  for(let y=Math.floor(minY-.5);y<=Math.ceil(maxY+.5);y++)for(let x=Math.floor(minX-.5);x<=Math.ceil(maxX+.5);x++){
   if(!box(x-.5,y-.5,x+.5,y+.5))continue;
   if(world.solid.has(x+','+y)||!world.members.get(x+','+y)?.has(edgeID))return false;
  }
  // Sample entire support area, not only centre/corners, against exact water.
  for(let y=minY;y<=maxY+.001;y+=.18)for(let x=minX;x<=maxX+.001;x+=.18){
   if(!box(x-.001,y-.001,x+.001,y+.001))continue;
   if(world.waterCollision?!world.waterCollision.pointClear([x,y],[edgeID]):world.wet([x,y]))return false;
  }
  if(doors.some(p=>box(...p)))return false;
  for(const person of occupants){const p=person.p||person;if(!p?.slice(0,2).every(Number.isFinite))continue;if(box(...rectangle([p[0],p[1],1,1],.22)))return false;}
  return true;
 }
 function survey(geometry,{minimumLength=22}={}){
  const routes=[],rejected=[];
  for(const e of world.edges.values()){
   const r=roadInfo(e.id);if(!r)continue;
   const heading=Math.atan2(r.tangent[1],r.tangent[0]),runs=[];let begin=null;
   for(let at=geometry.length/2+.25;at<=r.length-geometry.length/2-.25;at+=.25){
    const pose={x:r.a[0]+r.tangent[0]*at,y:r.a[1]+r.tangent[1]*at,heading};
    if(clear(cartHull(pose,geometry),e.id)){if(begin===null)begin=at;}
    else if(begin!==null){runs.push([begin,at-.25]);begin=null;}
   }
   if(begin!==null)runs.push([begin,r.length-geometry.length/2-.5]);
   const best=runs.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]))[0];
   if(!best||best[1]-best[0]<minimumLength){rejected.push({edge:e.id,name:e.name,longestClear:best?best[1]-best[0]:0});continue;}
   const make=at=>({x:r.a[0]+r.tangent[0]*at,y:r.a[1]+r.tangent[1]*at,heading});
   routes.push({id:'cart-'+e.id,edgeID:e.id,name:e.name,from:e.a+' approach',to:e.b+' approach',rigSourceRef:geometry.sourceRef,poses:[make(best[0]),make(best[1])],length:best[1]-best[0],roadWidth:e.width_cells,straightOnly:true});
  }return {routes,rejected};
 }
 return {clear,roadInfo,survey,report:()=>({structures:structures.length,held:[...held],roadsWidened:0,graphCellsAdded:0})};
}
