// The large Mended Drum (23 Nov 2026) stands on a 9 x 8 plot that takes in part of the wide street to the
// east of the old tavern. Those street cells are retired here: they leave the walkable network, become
// solid, and feet are kept out of the plot. Every route stays connected (checked when the plot was chosen,
// and the doorway is checked again here); if that ever fails, the street is put back as it was.
const key=(x,y)=>x+','+y;

export function activateDrumPlot({world,ground,rect,door,reachable=()=>true}){
 const [rx,ry,w,h]=rect,b=[rx-.5,ry-.5,rx+w-.5,ry+h-.5],removed=[];
 const priorPoint=ground.clearPoint,priorTraverse=world.canTraverse,blockedBefore=new Set(),solidBefore=new Set();
 const inPlot=p=>p[0]>b[0]&&p[0]<b[2]&&p[1]>b[1]&&p[1]<b[3];
 // A short step is sampled finely enough that it cannot cut a corner of the plot.
 const crosses=(p,q)=>{const n=Math.max(2,Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/.05));for(let i=0;i<=n;i++){const t=i/n;if(inPlot([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]))return true;}return false;};
 for(let x=rx;x<rx+w;x++)for(let y=ry;y<ry+h;y++){
  const k=key(x,y);if(world.members.has(k)){removed.push([k,world.members.get(k)]);world.members.delete(k);}
  if(ground.blocked?.has(k))blockedBefore.add(k);if(world.solid.has(k))solidBefore.add(k);world.solid.add(k);ground.extra?.delete(k);ground.blocked?.add(k);
 }
 ground.clearPoint=p=>!inPlot(p)&&(!priorPoint||priorPoint(p));
 world.canTraverse=(p,q)=>!crosses(p,q)&&(!priorTraverse||priorTraverse(p,q));
 const doorKey=key(door[0],door[1]),ok=world.members.has(doorKey)&&reachable();
 if(!ok){
  for(const [k,ids] of removed)world.members.set(k,ids);
  for(let x=rx;x<rx+w;x++)for(let y=ry;y<ry+h;y++){const k=key(x,y);if(!blockedBefore.has(k))ground.blocked?.delete(k);if(!solidBefore.has(k))world.solid.delete(k);}
  ground.clearPoint=priorPoint;world.canTraverse=priorTraverse;
  return Object.freeze({active:false,report:()=>({active:false,reason:'doorway not reachable; street kept'})});
 }
 return Object.freeze({active:true,rect:rect.slice(),removed:removed.length,inPlot,report:()=>({active:true,rect:rect.slice(),retiredStreetCells:removed.length,door:door.slice()})});
}
