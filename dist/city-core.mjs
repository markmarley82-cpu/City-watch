/* Isolated measured-city candidate. Source relations remain immutable.
 * Navigation states retain their source edge. Painted overlaps cannot add joins. */
export const key=p=>p.join(',');
export const project=([x,y],z=0)=>({x:28*(x-y),y:14*(x+y)-z});
export const unproject=({x,y})=>[Math.round(x/56+y/28),Math.round(y/28-x/56)];
export const engine=([x,y])=>[224-y,x];
export const rectCells=([x,y,w,h])=>Array.from({length:w*h},(_,i)=>[x+i%w,y+Math.floor(i/w)]);
export const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function pointIn(p,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
export function closest(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return [a[0]+t*dx,a[1]+t*dy];}
export function lineCells(a,b){const out=[a.slice()];let [x,y]=a;while(x!==b[0]||y!==b[1]){const dx=b[0]-x,dy=b[1]-y;if(dx&&(!dy||Math.abs(dx)>=Math.abs(dy)))x+=Math.sign(dx);else y+=Math.sign(dy);out.push([x,y]);}return out;}
export function compileCity(data,precinct){
 const nodes=new Map(data.nodes.map(n=>[n.id,n.engine_xy])),edges=new Map(),members=new Map(),solid=new Set(),water=data.water_geometry.map(w=>w.engine_polygon),doors=new Map(),forecourts=[];
 const put=(p,id)=>{const k=key(p);if(!members.has(k))members.set(k,new Set());members.get(k).add(id);};
 for(const l of data.landmarks.filter(l=>!l.retired_exterior_placeholder))for(const p of rectCells(l.footprint_xywh).map(engine))solid.add(key(p));
 const base=[126,132],local=p=>[p[0]+base[0],p[1]+base[1]];
 const localSolids=[precinct.watch.solid_cell_rect,precinct.opera.solid_cell_rect,precinct.fountain.proposed_solid_cell_rect,...precinct.unnamed_frontage_reservations.map(x=>x.solid_cell_rect),...precinct.prop_reservations.filter(x=>x.solid).map(x=>x.cell_rect)];
 for(const r of localSolids)for(const p of rectCells(r).map(local))solid.add(key(p));
 const wet=p=>water.some(poly=>pointIn(p,poly));
 const allowed=new Set(data.runtime_policy.candidate_public_review_edge_ids);
 for(const e of data.relations.filter(e=>allowed.has(e.edge_id))){
  const id=e.edge_id,points=e.engine_centreline,band=new Set();edges.set(id,{...e,id,points,band});
  for(let n=1;n<points.length;n++){const a=points[n-1],b=points[n],w=e.width_cells/2;
   for(let y=Math.floor(Math.min(a[1],b[1])-w);y<=Math.ceil(Math.max(a[1],b[1])+w);y++)for(let x=Math.floor(Math.min(a[0],b[0])-w);x<=Math.ceil(Math.max(a[0],b[0])+w);x++){const p=[x,y];if(distance(p,closest(p,a,b))<=w+.01&&!solid.has(key(p))){if(!wet(p)||['BRIDGE','CUT'].includes(e.kind)){put(p,id);band.add(key(p));}}}
  }
  // Continuous 4-neighbour centreline, including exact graph endpoints.
  for(let n=1;n<points.length;n++)for(const p of lineCells(points[n-1].map(Math.round),points[n].map(Math.round)))if(!solid.has(key(p))&&(!wet(p)||['BRIDGE','CUT'].includes(e.kind))){put(p,id);band.add(key(p));}
 }
 // Explicit dry-earth verges extend one existing edge without adding a new
 // graph identity. Each cell must touch that edge's original registered band,
 // remain dry and clear, and avoid every other edge. This lets all movement
 // modes share physically accessible unpaved ground without joining roads
 // whose painted footprints merely approach one another.
 const unpaved=new Map();
 for(const area of data.runtime_policy.accessible_unpaved_areas||[]){
  const parent=edges.get(area.parent_edge);if(!parent)throw Error('Unknown unpaved parent '+area.parent_edge);
  const original=new Set(parent.band),cells=new Set();
  for(const p of area.cells){const k=key(p);
   if(members.has(k)||solid.has(k)||wet(p))throw Error('Unsafe unpaved cell '+area.id+' '+k);
   const adjacent=[[p[0]+1,p[1]],[p[0]-1,p[1]],[p[0],p[1]+1],[p[0],p[1]-1]];
   if(!adjacent.some(q=>original.has(key(q))))throw Error('Detached unpaved cell '+area.id+' '+k);
   if(adjacent.some(q=>{const m=members.get(key(q));return m&&[...m].some(id=>id!==area.parent_edge);}))throw Error('Unpaved cell would join another edge '+area.id+' '+k);
   put(p,area.parent_edge);parent.band.add(k);cells.add(k);
  }
  unpaved.set(area.id,{...area,cells});
 }
 const rc1=new Set();for(const r of [precinct.square.base_paved_cell_rect,precinct.square.main_public_street_cell_rect,precinct.watch.entry_apron_cell_rect])for(const p of rectCells(r).map(local))if(!solid.has(key(p))){put(p,'RC1');rc1.add(key(p));}
 const ports=precinct.square?[[118,135],[137,135]]:[];
 edges.set('RC1',{id:'RC1',name:'Watch Square',kind:'PRECINCT',points:ports,band:rc1});
 // No duplicate corridor inside the local precinct: RC1 is E020's registered fragment.
 for(const k of rc1)members.get(k).delete('E020');
 for(const p of ports)put(p,'E020');
 const connect=new Map();
 function addConnector(id,parent,contact,cells){const band=new Set();for(const p of cells){if(solid.has(key(p))||wet(p))throw Error('Unsafe forecourt '+id);put(p,id);band.add(key(p));}edges.set(id,{id,name:id,kind:'FORECOURT',points:cells,band});connect.set(id,{parent,contact});forecourts.push({id,parent,contact,cells});}
 for(const l of data.landmarks){
  const p=l.engine_approach_xy,id=l.game_id;
  if(['LF-09','LF-15'].includes(l.lf_id)){doors.set(id,{...l,position:p,held:true,reason:'Cattle Market public ingress remains held.'});continue;}
  if(['watch','opera'].includes(id)){doors.set(id,{...l,position:p,edge:'RC1',held:false});continue;}
  // The expanded University retains its original street contact and every old save cell.
  if(id==='university'&&l.exterior_connector){const c=l.exterior_connector,edge='APRON:'+id;
   if(!members.get(key(c.contact))?.has(c.parent))throw Error('University street contact is unavailable');
   addConnector(edge,c.parent,c.contact,c.cells);doors.set(id,{...l,position:p,edge,held:false,originalForecourt:true});continue;
  }
  // Explicit original private forecourts in this isolated build. They cannot join two streets.
  const candidates=[];for(const e of edges.values())if(e.kind!=='FORECOURT'&&e.id!=='RC1')for(const k of e.band){if(!members.get(k)?.has(e.id))continue;const q=k.split(',').map(Number);candidates.push({p:q,id:e.id,d:distance(q,p)});}
  candidates.sort((a,b)=>a.d-b.d);let result=null;
  for(const c of candidates.slice(0,180)){const queue=[p],seen=new Map([[key(p),null]]);for(let i=0;i<queue.length&&i<5000;i++){const q=queue[i],k=key(q);if(k===key(c.p)){const cells=[];let at=k;while(at!==null){cells.unshift(at.split(',').map(Number));at=seen.get(at);}result={...c,cells};break;}for(const t of [[q[0]+1,q[1]],[q[0]-1,q[1]],[q[0],q[1]+1],[q[0],q[1]-1]]){const tk=key(t);if(seen.has(tk)||solid.has(tk)||wet(t)||distance(t,p)>c.d+7)continue;const m=members.get(tk);if(m&&tk!==key(c.p))continue;seen.set(tk,k);queue.push(t);}}if(result)break;}
  if(result){const edge='APRON:'+id;addConnector(edge,result.id,result.p,result.cells);doors.set(id,{...l,position:p,edge,held:false,originalForecourt:true});}else doors.set(id,{...l,position:p,held:true,reason:'A safe exterior approach has not been resolved.'});
 }
 const palace=data.palace_public_precinct;
 if(palace){const band=new Set();for(const p of rectCells(palace.rect)){if(solid.has(key(p))||wet(p))continue;put(p,palace.id);band.add(key(p));}edges.set(palace.id,{id:palace.id,name:'Palace public forecourt',kind:'PRECINCT',points:[],band});}
 function transitions(id,p){const out=[id],here=members.get(key(p));if(!here)return out;
  for(const other of here){if(other===id)continue;
   if(palace&&((id===palace.id&&palace.connections.includes(other))||(other===palace.id&&palace.connections.includes(id)))){out.push(other);continue;}
   if((id==='RC1'&&other==='E020')||(id==='E020'&&other==='RC1')){if(ports.some(q=>distance(p,q)<=1))out.push(other);continue;}
   const con=connect.get(id),rev=connect.get(other);if((con?.parent===other&&distance(p,con.contact)<=.01)||(rev?.parent===id&&distance(p,rev.contact)<=.01)){out.push(other);continue;}
   const a=edges.get(id),b=edges.get(other);if(!a?.a||!b?.a)continue;const shared=[a.a,a.b].filter(n=>n===b.a||n===b.b);if(shared.some(n=>distance(p,nodes.get(n))<=1.6))out.push(other);
  }return out;
 }
 function neighbours(s){const [x,y,id]=s,out=[];for(const e of transitions(id,[x,y])){if(e!==id)out.push([x,y,e]);for(const q of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]])if(members.get(key(q))?.has(e))out.push([...q,e]);}return out;}
 return {nodes,edges,members,solid,water,doors,forecourts,ports,rc1,local,wet,unpaved,neighbours,transitions};
}
export const stateKey=s=>s.join(',');
export function pathBetween(world,start,target,targetEdge){
 if(!world.members.get(key(start.slice(0,2)))?.has(start[2])||!world.members.has(key(target)))return null;
 const todo=[start],seen=new Map([[stateKey(start),null]]);let end=null;
 for(let i=0;i<todo.length;i++){const s=todo[i],k=stateKey(s);if(s[0]===target[0]&&s[1]===target[1]&&(!targetEdge||s[2]===targetEdge)){end=k;break;}for(const n of world.neighbours(s)){const nk=stateKey(n);if(!seen.has(nk)){seen.set(nk,k);todo.push(n);}}}
 if(end===null)return null;const out=[];let at=end;while(seen.get(at)!==null){const a=at.split(',');out.unshift([Number(a[0]),Number(a[1]),a.slice(2).join(',')]);at=seen.get(at);}return out;
}
export function validSave(v,w){return !!v&&v.version===7&&Array.isArray(v.position)&&v.position.length===3&&Number.isInteger(v.position[0])&&Number.isInteger(v.position[1])&&w.members.get(key(v.position.slice(0,2)))?.has(v.position[2])&&Array.isArray(v.visited)&&v.visited.every(x=>w.doors.has(x));}

// Manual diagonals require both clear side paths on the approved source graph.
// At a registered join, prefer the centreline under the requested destination.
// Retaining a bridge's rounded cap past the join can strand manual movement.
export function manualNeighbour(world,start,dx,dy,occupied=()=>false){
 if(!Number.isInteger(dx)||!Number.isInteger(dy)||Math.max(Math.abs(dx),Math.abs(dy))!==1)return null;
 const available=s=>!occupied(s),next=world.neighbours(start).filter(available),[x,y,id]=start;
 const at=(list,x,y)=>list.filter(s=>s[0]===x&&s[1]===y);
 const choose=candidates=>{
  const current=world.edges.get(id);
  if(!/^E00[1-7]$/.test(id)&&!candidates.some(s=>/^E00[1-7]$/.test(s[2])))return candidates[0]||null;
  const score=s=>{
   const edge=world.edges.get(s[2]);
   // Precincts and private forecourts retain their existing handoff rules.
   if(!current?.a||!edge?.a)return s[2]===id?0:Infinity;
   return Math.min(...edge.points.slice(1).map((p,i)=>distance(s,closest(s,edge.points[i],p))));
  };
  return candidates.sort((a,b)=>score(a)-score(b)||Number(b[2]===id)-Number(a[2]===id))[0]||null;
 };
 if(!dx||!dy)return choose(at(next,x+dx,y+dy));
 const a=at(next,x+dx,y),b=at(next,x,y+dy),candidates=[];
 for(const side of a)for(const target of at(world.neighbours(side).filter(available),x+dx,y+dy)){
  if(b.some(other=>world.neighbours(other).some(t=>stateKey(t)===stateKey(target))))candidates.push(target);
 }
 return choose(candidates);
}

// Keep an eight-way direction responsive on narrow, cardinal-authored paving.
// A protected diagonal remains the first choice. If that exact corner is not
// available, follow one of its component edges instead of refusing the input.
// Every fallback is still an ordinary collision-checked graph neighbour, so it
// cannot cross water, a solid footprint, a closed frontage or an occupied cell.
export function manualDirectionalNeighbour(world,start,dx,dy,occupied=()=>false,preferAxis='x'){
 const direct=manualNeighbour(world,start,dx,dy,occupied);
 if(direct||!dx||!dy)return direct;
 const [x,y,id]=start,target=[x+dx,y+dy],targetMembers=world.members.get(key(target));
 // A diagonal destination on the same approved street, or on an edge with a
 // registered transition at this cell, is a legitimate direct manual step.
 // This removes false corner blocks without joining diagonally touching roads.
 if(targetMembers){
  const candidates=world.transitions(id,[x,y]).filter(edge=>targetMembers.has(edge)).map(edge=>[...target,edge]).filter(state=>!occupied(state));
  if(candidates.length&&id!=='PALACE:PUBLIC'&&!targetMembers.has('PALACE:PUBLIC')){
   const same=candidates.find(state=>state[2]===id);
   return same||candidates[0];
  }
 }
 const components=preferAxis==='y'?[[0,dy],[dx,0]]:[[dx,0],[0,dy]];
 for(const vector of components){const next=manualNeighbour(world,start,...vector,occupied);if(next)return next;}
 return null;
}
