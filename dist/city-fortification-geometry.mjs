// Pure planning only. No world/navigation mutation and no browser dependency.
const key=([x,y])=>`${x},${y}`;
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
const add=(a,b,s=1)=>[a[0]+b[0]*s,a[1]+b[1]*s];
const dist2=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2;
const cardinal=[[1,0],[-1,0],[0,1],[0,-1]];
function onSegment(p,a,b){const cross=(p[0]-a[0])*(b[1]-a[1])-(p[1]-a[1])*(b[0]-a[0]);return Math.abs(cross)<1e-7&&dot([p[0]-a[0],p[1]-a[1]],[p[0]-b[0],p[1]-b[1]])<=1e-7;}
export function pointInPolygon(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(onSegment(p,a,b))return true;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}

// publicCell(p) returns an existing PUBLIC edge ID or null. clearCell(p) must
// reject wet/held/solid/campus/Palace/structural-foot-probe collisions. It is
// called for every candidate, including a retained receiver. existingCell(p)
// distinguishes all original cells so the returned patch never rewrites one.
// reachableCell(p,edge) verifies a current path from the patrol network.
export function resolveGateApron(gate,{publicCell,clearCell,existingCell,reachableCell,maxReceiverSearchCells=2}){
 if([publicCell,clearCell,existingCell,reachableCell].some(f=>typeof f!=='function'))throw Error('Four exact baseline predicates are required');
 const n=gate.outwardNormal,c=gate.center,t=[-n[1],n[0]],nominal=gate.innerReceiver;
 if(Math.abs(dot(n,n)-1)>1e-6||gate.clearWidth<2)throw Error('Invalid gateway geometry');
 const candidates=[];
 for(let y=nominal[1]-maxReceiverSearchCells;y<=nominal[1]+maxReceiverSearchCells;y++)for(let x=nominal[0]-maxReceiverSearchCells;x<=nominal[0]+maxReceiverSearchCells;x++){
  const p=[x,y],edge=publicCell(p);
  if(edge&&existingCell(p)&&clearCell(p)&&reachableCell(p,edge))candidates.push({p,edge});
 }
 candidates.sort((a,b)=>dist2(a.p,nominal)-dist2(b.p,nominal)||dist2(a.p,c)-dist2(b.p,c)||a.p[0]-b.p[0]||a.p[1]-b.p[1]);
 for(const source of candidates){
  // Reserve half a cell at each jamb for actor foot clearance.
  const end=add(c,n,-.5),half=gate.clearWidth/2-.5;
  const polygon=[add(source.p,t,half),add(end,t,half),add(end,t,-half),add(source.p,t,-half)];
  const target=end.map(Math.round),seen=new Map([[key(source.p),null]]),todo=[source.p],cells=new Map();
  const xs=polygon.map(p=>p[0]),ys=polygon.map(p=>p[1]);
  const bounds=[Math.floor(Math.min(...xs)),Math.floor(Math.min(...ys)),Math.ceil(Math.max(...xs)),Math.ceil(Math.max(...ys))];
  const clear=p=>p[0]>=bounds[0]&&p[0]<=bounds[2]&&p[1]>=bounds[1]&&p[1]<=bounds[3]&&dot([p[0]-c[0],p[1]-c[1]],n)<=-.5+1e-6&&pointInPolygon(p,polygon)&&clearCell(p)&&(!existingCell(p)||!!publicCell(p));
  if(!clear(source.p)||!clear(target))continue;
  for(let i=0;i<todo.length;i++){
   const p=todo[i];if(!existingCell(p))cells.set(key(p),p);
   for(const d of cardinal){const q=add(p,d),k=key(q);if(!seen.has(k)&&clear(q)){seen.set(k,key(p));todo.push(q);}}
  }
  if(!seen.has(key(target)))continue;
  const path=[];let at=key(target);while(at!==null){path.unshift(at.split(',').map(Number));at=seen.get(at);}
  const newCells=[...cells.values()];
  // Explicit guard: the result can never replace a baseline member.
  if(newCells.some(existingCell))throw Error('Apron planning attempted to overwrite a retained cell');
  return {gateID:gate.id,source:{position:source.p,edge:source.edge},target,polygon,newCells,centerPath:path,newNavigationID:`APRON:${gate.id}`,outsideTravel:false};
 }
 return {gateID:gate.id,blocked:true,reason:'No clear, reachable PUBLIC receiver and dry apron within the bounded reservation'};
}
