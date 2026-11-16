export function createUniversityGraph(DATA){
const roomBy=Object.fromEntries(DATA.rooms.map(r=>[r.id,r]));
const levels=['F0','B1','F1'];const coord=(x,y)=>x+','+y;const K=(l,x,y)=>l+':'+x+','+y;
const pairKey=(a,b)=>a<b?a+'>'+b:b+'>'+a;
const zone=Object.fromEntries(levels.map(l=>[l,new Map()]));
const solids=Object.fromEntries(levels.map(l=>[l,new Set()]));
const roomEnter=Object.fromEntries(levels.map(l=>[l,new Set()]));
const stairs=new Map();
function writeZone(level,item,id){for(let x=item.x;x<item.x+item.w;x++)for(let y=item.y;y<item.y+item.h;y++)zone[level].set(coord(x,y),id)}
DATA.rooms.forEach(r=>writeZone(r.level,r,r.id));DATA.corridors.forEach(c=>writeZone(c.level,c,c.id));
for(const z of DATA.static_furniture_exclusion){let [x,y,w,h]=z.xywh;for(let i=x;i<x+w;i++)for(let j=y;j<y+h;j++)solids[z.level].add(coord(i,j))}
for(const p of DATA.door_pairs){
 if(p.kind==='stair'){stairs.set(K(p.a_level,...p.a_xy),[p.b_level,...p.b_xy,p.id]);stairs.set(K(p.b_level,...p.b_xy),[p.a_level,...p.a_xy,p.id]);continue}
 const c=p.id, spans=p.room_spans;for(const [suffix,span] of [['a',spans[0]],['b',spans[1]]])for(const [x,y] of span)for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]])if(zone[p.level].get(coord(x+dx,y+dy))===c)roomEnter[p.level].add(pairKey(coord(x,y),coord(x+dx,y+dy)));
}
const movable=(l,x,y)=>zone[l].has(coord(x,y))&&!solids[l].has(coord(x,y));
const canWalk=(l,x,y,nx,ny)=>movable(l,nx,ny)&&Math.abs(nx-x)+Math.abs(ny-y)===1&&(zone[l].get(coord(x,y))===zone[l].get(coord(nx,ny))||roomEnter[l].has(pairKey(coord(x,y),coord(nx,ny))));
function neighbors(s){const [l,x,y]=s;let out=[];for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]])if(canWalk(l,x,y,x+dx,y+dy))out.push([l,x+dx,y+dy]);let q=stairs.get(K(l,x,y));if(q)out.push(q.slice(0,3));return out}
function bfs(start,goal){let queue=[start],p=new Map([[K(...start),null]]),states=new Map([[K(...start),start]]),head=0;while(head<queue.length){const s=queue[head++],key=K(...s);if(key===K(...goal)){let path=[];for(let k=key;k!==null;k=p.get(k))path.push(states.get(k));return path.reverse()}
for(const n of neighbors(s)){const nk=K(...n);if(!p.has(nk)){p.set(nk,key);states.set(nk,n);queue.push(n)}}}return []}
function goalFor(r){let pts=[];for(let x=r.x;x<r.x+r.w;x++)for(let y=r.y;y<r.y+r.h;y++)if(movable(r.level,x,y))pts.push([r.level,x,y]);pts.sort((a,b)=>(Math.abs(a[1]-r.x-r.w/2)+Math.abs(a[2]-r.y-r.h/2))-(Math.abs(b[1]-r.x-r.w/2)+Math.abs(b[2]-r.y-r.h/2)));return pts[0]}
const GOALS=Object.fromEntries(DATA.rooms.map(r=>[r.id,goalFor(r)]));

return {roomBy,levels,coord,K,pairKey,zone,solids,roomEnter,stairs,movable,canWalk,neighbors,bfs,GOALS};
}
export function universitySnapshot(value,graph){if(value?.schema!==1||!Array.isArray(value.position)||value.position.length!==3||!graph.levels.includes(value.position[0])||!value.position.slice(1).every(Number.isInteger)||!graph.movable(...value.position))throw Error("Invalid saved University position");if(!Array.isArray(value.exploredRooms))throw Error("Invalid University room record");return {schema:1,position:value.position.slice(),exploredRooms:[...new Set(value.exploredRooms.filter(id=>Object.hasOwn(graph.roomBy,id)))]};}

export function universityManualTarget(graph,position,dx,dy,phase=0){if(!Number.isInteger(dx)||!Number.isInteger(dy)||Math.max(Math.abs(dx),Math.abs(dy))!==1)return null;const moves=dx&&dy?(phase%2?[[dx,0],[0,dy]]:[[0,dy],[dx,0]]):[[dx,dy]];for(const [x,y]of moves)if(graph.canWalk(...position,position[1]+x,position[2]+y))return [position[0],position[1]+x,position[2]+y];return null;}
