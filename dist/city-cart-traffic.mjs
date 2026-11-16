// Unbound traffic core. The host must supply measured geometry, sampled turning
// paths, full-hull ground/occupancy checks and visibility. No player/save writes.
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.heading);
const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
function positive(n,name){if(!Number.isFinite(n)||n<=0)throw Error('Measured '+name+' required');return n;}
export function cartHull(p,geometry){
 const length=positive(geometry.length,'length'),width=positive(geometry.width,'width');
 const c=Math.cos(p.heading),s=Math.sin(p.heading);
 return [[-length/2,-width/2],[length/2,-width/2],[length/2,width/2],[-length/2,width/2]]
  .map(([x,y])=>[p.x+c*x-s*y,p.y+s*x+c*y]);
}
export function createCartTraffic({geometry,routes,clearPose,visible,speed,maxDeltaMs=80,fadeMs=500}){
 if(!geometry?.sourceRef||typeof geometry.sourceRef!=='string')throw Error('Measured rig sourceRef required');
 const length=positive(geometry.length,'length'),width=positive(geometry.width,'width');
 const turnRadius=positive(geometry.turnRadius,'turn radius');
 positive(geometry.wheelbase,'wheelbase');
 geometry=Object.freeze({...geometry});
 positive(speed,'traffic speed');positive(maxDeltaMs,'frame bound');positive(fadeMs,'fade duration');
 if(typeof clearPose!=='function'||typeof visible!=='function')throw Error('Host ground/occupancy and visibility checks required');
 if(!Array.isArray(routes)||!routes.length)throw Error('Surveyed routes required');
 const profiles=routes.map(r=>{
  if(!r.id||!r.from||!r.to||r.from===r.to||!Array.isArray(r.poses)||r.poses.length<2)throw Error('Purposeful source/destination route required');
  if(r.rigSourceRef!==geometry.sourceRef)throw Error('Route rig mismatch');
  if(r.poses.some(p=>!point(p)))throw Error('Finite sampled poses required');
  const cumulative=[0];
  for(let i=1;i<r.poses.length;i++){
   const d=distance(r.poses[i-1],r.poses[i]),theta=Math.abs(angle(r.poses[i-1].heading,r.poses[i].heading));
   if(d<1e-8||theta/d>1/turnRadius+1e-6)throw Error('Path exceeds measured turning envelope');
   const bearing=Math.atan2(r.poses[i].y-r.poses[i-1].y,r.poses[i].x-r.poses[i-1].x);
   const meanHeading=r.poses[i-1].heading+angle(r.poses[i-1].heading,r.poses[i].heading)/2;
   if(Math.cos(angle(meanHeading,bearing))<.95)throw Error('Cart must follow its forward sampled path');
   cumulative.push(cumulative.at(-1)+d);
  }
  return {...r,poses:r.poses.map(p=>({...p})),cumulative,length:cumulative.at(-1)};
 });
 if(new Set(profiles.map(r=>r.id)).size!==profiles.length)throw Error('Unique route IDs required');
 const carts=new Map();let last=null,paused=false;
 const poseAt=(r,at)=>{
  let i=1;while(i<r.cumulative.length-1&&at>r.cumulative[i])i++;
  const a=r.poses[i-1],b=r.poses[i],t=Math.min(1,Math.max(0,(at-r.cumulative[i-1])/(r.cumulative[i]-r.cumulative[i-1])));
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,heading:a.heading+angle(a.heading,b.heading)*t};
 };
 function clear(p,id){return clearPose(cartHull(p,geometry),{id,pose:{...p},geometry})===true;}
 function spawn(id,routeId){
  if(carts.has(id))throw Error('Duplicate active cart');
  const r=profiles.find(r=>r.id===routeId);if(!r)throw Error('Unknown surveyed route');
  const p=poseAt(r,0),hull=cartHull(p,geometry);
  if(visible(hull)||!clear(p,id))return false; // no appearing in player view
  carts.set(id,{id,route:r,at:0,pose:p,state:'moving',alpha:1});return true;
 }
 function advance(now){
  if(!Number.isFinite(now))throw Error('Finite frame time required');
  if(last!==null&&now<last)return snapshot();
  const dt=last===null?0:Math.min(maxDeltaMs,Math.max(0,now-last));last=now;
  if(paused||!dt)return snapshot();
  for(const cart of carts.values()){
   const hull=cartHull(cart.pose,geometry);
   if(cart.state==='arrived'||cart.state==='fading'){
    // A camera return cancels fading: no popping while the player can see it.
    if(visible(hull)){cart.state='arrived';cart.alpha=1;continue;}
    cart.state='fading';cart.alpha=Math.max(0,cart.alpha-dt/fadeMs);
    if(cart.alpha===0)carts.delete(cart.id);
    continue;
   }
   const target=Math.min(cart.route.length,cart.at+speed*dt/1000);
   // Subdivide at every surveyed path boundary as well as displacement/angle.
   // The host receives complete rotated hulls, never just the centre point.
   const stops=cart.route.cumulative.filter(n=>n>cart.at&&n<target);stops.push(target);
   cart.state='moving';let blocked=false;
   for(const stop of stops){
    const start=cart.at,from={...cart.pose},to=poseAt(cart.route,stop);
    const sweep=distance(from,to)+Math.hypot(length,width)/2*Math.abs(angle(from.heading,to.heading));
    const n=Math.max(1,Math.ceil(sweep/.04));
    for(let i=1;i<=n;i++){
     const at=start+(stop-start)*i/n,p=poseAt(cart.route,at);
     if(!clear(p,cart.id)){cart.state='yielding';blocked=true;break;}
     cart.at=at;cart.pose=p;
    }
    if(blocked)break;
   }
   if(!blocked&&cart.at>=cart.route.length-1e-8)cart.state='arrived';
  }
  return snapshot();
 }
 function snapshot(){return [...carts.values()].map(c=>({id:c.id,routeId:c.route.id,from:c.route.from,to:c.route.to,pose:{...c.pose},state:c.state,alpha:c.alpha,travel:c.at}));}
 return {spawn,advance,snapshot,setPaused(value,now){if(!Number.isFinite(now))throw Error('Finite pause time required');paused=!!value;last=now;},clear(){carts.clear();last=null;}};
}
