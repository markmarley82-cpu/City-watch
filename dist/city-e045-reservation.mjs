// Pure proposed-game polygon helpers. No imports, world mutation or sampling loop.
export function createReservation(contract){
 const eps=contract.boundary.epsilonWorldUnits,offsets=contract.foot.probes.map(p=>p.slice()),edgeID=contract.scope.edgeID,reservationID=contract.id,maxSavedFootDistance=contract.foot.maxSavedFootDistanceFromAnchor;
 if(contract.schema!==1||!Number.isFinite(eps)||eps<=0||offsets.length!==5||!offsets.every(p=>p.length===2&&p.every(Number.isFinite))||!Number.isFinite(maxSavedFootDistance)||maxSavedFootDistance<0)throw Error('Unsupported reservation contract');
 // Geometry probes use plain arrays. Avoid a temporary slice/callback for
 // each layer of the reservation gates; retain sparse/accessor read order and
 // the original slice behaviour for custom arrays and methods.
 const arrayPrototype=Array.prototype;
 const finite=p=>{
  if(!Array.isArray(p)||p.length<2)return false;
  if(typeof p[0]==='number'&&typeof p[1]==='number'&&Object.getPrototypeOf(p)===arrayPrototype&&!Object.hasOwn(p,'slice')&&!Object.hasOwn(p,'constructor'))return Number.isFinite(p[0])&&Number.isFinite(p[1]);
  if(Object.getPrototypeOf(p)!==arrayPrototype||Object.hasOwn(p,'slice')||Object.hasOwn(p,'constructor'))return p.slice(0,2).every(Number.isFinite);
  const hasX=0 in p,x=hasX?p[0]:undefined,hasY=1 in p,y=hasY?p[1]:undefined;
  return (!hasX||Number.isFinite(x))&&(!hasY||Number.isFinite(y));
 };
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const areas=contract.regions.map(r=>{
  const p=r.worldPolygon?.map(p=>p.slice());if(!Array.isArray(p)||p.length<3||!p.every(finite))throw Error('Invalid polygon '+r.id);
  let signed=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];signed+=a[0]*b[1]-b[0]*a[1];}
  if(signed<=eps)throw Error('Polygon must be nondegenerate CCW: '+r.id);
  for(let i=0;i<p.length;i++){if(Math.hypot(p[(i+1)%p.length][0]-p[i][0],p[(i+1)%p.length][1]-p[i][1])<=eps)throw Error('Degenerate edge: '+r.id);if(cross(p[i],p[(i+1)%p.length],p[(i+2)%p.length])< -eps)throw Error('Polygon must be convex: '+r.id);}
  // Polygon vertices are private copies. Reuse the identical edge lengths
  // and cross-product thresholds in point/segment probes after validation.
  const edgeLengths=p.map((a,i)=>Math.hypot(p[(i+1)%p.length][0]-a[0],p[(i+1)%p.length][1]-a[1]));
  return{...r,p,edgeLengths,pointThresholds:edgeLengths.map(length=>-eps*length),bounds:[Math.min(...p.map(v=>v[0])),Math.min(...p.map(v=>v[1])),Math.max(...p.map(v=>v[0])),Math.max(...p.map(v=>v[1]))]};
 });
 const inside=(q,r)=>{
  const x=q[0],y=q[1],b=r.bounds;if(!(x>=b[0]-eps&&x<=b[2]+eps&&y>=b[1]-eps&&y<=b[3]+eps))return false;
  const p=r.p,n=p.length,t=r.pointThresholds;
  for(let i=0;i<n;i++){const a=p[i],c=p[i+1===n?0:i+1];if(!((c[0]-a[0])*(y-a[1])-(c[1]-a[1])*(x-a[0])>=t[i]))return false;}
  return true;
 };
 function hit(a,b,r){
  if(Math.max(a[0],b[0])<r.bounds[0]-eps||Math.min(a[0],b[0])>r.bounds[2]+eps||Math.max(a[1],b[1])<r.bounds[1]-eps||Math.min(a[1],b[1])>r.bounds[3]+eps)return false;
  let lo=0,hi=1;const d=[b[0]-a[0],b[1]-a[1]];
  for(let i=0;i<r.p.length;i++){const p=r.p[i],q=r.p[(i+1)%r.p.length],length=r.edgeLengths[i],f=cross(p,q,a)/length,v=((q[0]-p[0])*d[1]-(q[1]-p[1])*d[0])/length;
   if(v===0){if(f< -eps)return false;continue;}
   const t=(-eps-f)/v;if(v>0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return false;
  }
  return lo<=1&&hi>=0;
 }
 const probe=(p,v)=>{const x=v[0],y=v[1];if(Object.getPrototypeOf(p)===arrayPrototype&&!Object.hasOwn(p,'slice')){if(p.length===3)return[p[0]+x,p[1]+y,p[2]];if(p.length===2)return[p[0]+x,p[1]+y];}return[p[0]+x,p[1]+y,...p.slice(2)];};
 // Union of every region's bounds: a point outside it is outside every region (inside() rejects on the same per-region bounds).
 const union=[Math.min(...areas.map(r=>r.bounds[0]))-eps,Math.min(...areas.map(r=>r.bounds[1]))-eps,Math.max(...areas.map(r=>r.bounds[2]))+eps,Math.max(...areas.map(r=>r.bounds[3]))+eps];
 function pointClear(p){if(!finite(p))return false;const x=p[0],y=p[1];if(!(x>=union[0]&&x<=union[2]&&y>=union[1]&&y<=union[3]))return true;for(let i=0;i<areas.length;i++)if(inside(p,areas[i]))return false;return true;}
 function footClear(p){return finite(p)&&offsets.every(v=>pointClear(probe(p,v)));}
 function segmentClear(a,b){if(!finite(a)||!finite(b))return false;return offsets.every(v=>{const p=probe(a,v),q=probe(b,v);if(Math.max(p[0],q[0])<union[0]||Math.min(p[0],q[0])>union[2]||Math.max(p[1],q[1])<union[1]||Math.min(p[1],q[1])>union[3])return true;return !areas.some(r=>hit(p,q,r));});}
 function gates({basePointClear,baseSegmentClear}){
  if(typeof basePointClear!=='function'||typeof baseSegmentClear!=='function')throw Error('Preserved base point/segment gates are required');
  const point=p=>basePointClear(p)&&pointClear(p),foot=p=>finite(p)&&offsets.every(v=>point(probe(p,v)));
  return Object.freeze({pointClear:point,canStand:foot,canTraverse:(a,b)=>baseSegmentClear(a,b)&&foot(a)&&foot(b)&&segmentClear(a,b)});
 }
 function membershipPlan(members,originalMembers){
  if(!(members instanceof Map)||!(originalMembers instanceof Map))throw Error('Current and pre-fill original membership Maps are required');
  const centres=[],footOnly=[],originalConflicts=[];
  for(const[key,ids]of members){const p=key.split(',').map(Number);if(!finite(p))throw Error('Bad member key');const rec={key,edges:[...ids].sort()};if(!pointClear(p)){centres.push(rec);if(originalMembers.has(key))originalConflicts.push({...rec,restriction:'centre-inside'});}else if(!footClear(p)){footOnly.push(rec);if(originalMembers.has(key))originalConflicts.push({...rec,restriction:'full-foot-only'});}}
  return{centres:centres.sort((a,b)=>a.key.localeCompare(b.key)),footOnly:footOnly.sort((a,b)=>a.key.localeCompare(b.key)),originalConflicts};
 }
 function proposeRecovery(record,candidates,{isValidState,basePointClear,reachable}){
  if(typeof isValidState!=='function'||typeof basePointClear!=='function'||typeof reachable!=='function')throw Error('Explicit current-state, point and reachability gates required');
  const a=record?.position;if(!finite(a)||a.length!==3||a[2]!==edgeID)return null;
  const f=finite(record.cityFoot)&&record.cityFoot.length===3&&record.cityFoot[2]===a[2]&&Math.hypot(record.cityFoot[0]-a[0],record.cityFoot[1]-a[1])<=maxSavedFootDistance?record.cityFoot:a;
  const full=p=>footClear(p)&&offsets.every(v=>basePointClear(probe(p,v)));
  // Unrelated legacy corruption is not repaired by this new reservation.
  if(footClear(a)&&footClear(f))return null;
  const allowed=candidates.filter(p=>finite(p)&&p.length===3&&p[2]===a[2]&&isValidState(p)&&full(p)&&reachable(p));
  allowed.sort((p,q)=>{const da=(p[0]-f[0])**2+(p[1]-f[1])**2,db=(q[0]-f[0])**2+(q[1]-f[1])**2;return da-db||p[0]-q[0]||p[1]-q[1]||String(p[2]).localeCompare(String(q[2]));});
  if(!allowed.length)return{blocked:true,reason:'No current same-E045 full-foot-clear reachable recovery target'};
  const position=allowed[0].slice();return{position,cityFoot:position.slice(),reason:'E045 proposed reservation occupies saved anchor or fractional foot',reservationID};
 }
 return Object.freeze({id:reservationID,pointClear,footClear,segmentClear,gates,membershipPlan,proposeRecovery,regions:Object.freeze(areas.map(({id,bounds})=>Object.freeze({id,bounds:Object.freeze(bounds.slice())})))});
}
