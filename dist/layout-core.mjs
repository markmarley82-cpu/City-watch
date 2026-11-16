/* Pure RC1 collision/navigation functions shared by the playable patrol and tests. */
export const cellKey=p=>p.join(',');
export function rectCells([x,y,w,h]) {const a=[];for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)a.push([i,j]);return a;}
export function compilePrecinct(data) {
 const solid=new Set();
 for(const r of [data.watch.solid_cell_rect,data.opera.solid_cell_rect,data.fountain.proposed_solid_cell_rect,...data.unnamed_frontage_reservations.map(p=>p.solid_cell_rect),...data.prop_reservations.filter(p=>p.solid).map(p=>p.cell_rect)])for(const p of rectCells(r))solid.add(cellKey(p));
 const walk=new Set();
 for(const r of [data.square.base_paved_cell_rect,data.square.main_public_street_cell_rect,data.watch.entry_apron_cell_rect])for(const p of rectCells(r))if(!solid.has(cellKey(p)))walk.add(cellKey(p));
 return {solid,walk};
}
export function pathBetween(walk,start,end) {
 if(!walk.has(cellKey(start))||!walk.has(cellKey(end)))return null;
 const todo=[start],seen=new Map([[cellKey(start),null]]);
 for(let i=0;i<todo.length;i++) {
  const p=todo[i],key=cellKey(p);
  if(key===cellKey(end)){const result=[];let at=key;while(seen.get(at)!==null){result.unshift(at.split(',').map(Number));at=seen.get(at);}return result;}
  for(const q of [[p[0]+1,p[1]],[p[0]-1,p[1]],[p[0],p[1]+1],[p[0],p[1]-1]]){const k=cellKey(q);if(walk.has(k)&&!seen.has(k)){seen.set(k,key);todo.push(q);}}
 }
 return null;
}
export function validSave(value,walk) {
 return !!value&&value.version===1&&Array.isArray(value.position)&&value.position.length===2&&value.position.every(Number.isInteger)&&walk.has(cellKey(value.position))&&Array.isArray(value.visited)&&value.visited.every(v=>typeof v==='string');
}
export const project=([u,v],height=0)=>({x:28*(u-v),y:14*(u+v)-height});
export const unproject=({x,y})=>[Math.round(x/56+y/28),Math.round(y/28-x/56)];
