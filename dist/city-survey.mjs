// One linear map projection for source streets, structures, routes and markers.
const finitePoint=p=>Array.isArray(p)&&p.length>=2&&p.slice(0,2).every(Number.isFinite);
export const planPoint=p=>finitePoint(p)?[p[1],-p[0]]:null;
export function rectPolygon(r){const [x,y,w,h]=r;return [[x-.5,y-.5],[x+w-.5,y-.5],[x+w-.5,y+h-.5],[x-.5,y+h-.5]];}
// Compress the actual admitted walking cells, including open-ground additions.
// Compound paths keep this to two SVG nodes instead of one DOM node per cell.
export function surveyWalkable(world,excludedCells){
 const cells=new Set(),rows=new Map();let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const[k,ids]of world?.members||[]){if(!ids?.size||excludedCells?.has(k))continue;const p=k.split(',').map(Number);if(p.length!==2||!p.every(Number.isInteger))continue;const[x,y]=p;cells.add(k);const row=rows.get(x)||[];row.push(y);rows.set(x,row);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 const runs=[];for(const[x,row]of [...rows].sort((a,b)=>a[0]-b[0])){row.sort((a,b)=>a-b);let start=row[0],end=start;for(let i=1;i<=row.length;i++){if(i<row.length&&row[i]===end+1){end=row[i];continue;}runs.push([x,start,end-start+1]);start=row[i];end=start;}}
 const horizontal=new Map(),vertical=new Map(),add=(map,k,a,b)=>{const v=map.get(k)||[];v.push([a,b]);map.set(k,v);};
 for(const[x,row]of rows)for(const y of row){const left=2*y-1,right=left+2,top=-2*x-1,bottom=top+2;
  if(!cells.has((x+1)+','+y))add(horizontal,top,left,right);
  if(!cells.has((x-1)+','+y))add(horizontal,bottom,left,right);
  if(!cells.has(x+','+(y-1)))add(vertical,left,top,bottom);
  if(!cells.has(x+','+(y+1)))add(vertical,right,top,bottom);
 }
 const outline=[];for(const[map,axis]of [[horizontal,'H'],[vertical,'V']])for(const[k,segments]of map){segments.sort((a,b)=>a[0]-b[0]);let start=segments[0][0],end=segments[0][1];for(let i=1;i<=segments.length;i++){if(i<segments.length&&segments[i][0]<=end){end=Math.max(end,segments[i][1]);continue;}outline.push(axis==='H'?`M${start/2},${k/2}H${end/2}`:`M${k/2},${start/2}V${end/2}`);if(i<segments.length)[start,end]=segments[i];}}
 return {cellCount:cells.size,runs,fillPath:runs.map(([x,y,n])=>`M${y-.5},${-x-.5}h${n}v1h${-n}z`).join(''),outlinePath:outline.join(''),bounds:cells.size?[minY-.5,-maxX-.5,maxY-minY+1,maxX-minX+1]:null};
}
export function surveyGeometry(world,parcels=[],destinations=[],streetLanes=[],excludedCells){
 const roads=[...(world?.edges?.values()||[])].filter(e=>e.points?.length>1&&e.points.every(finitePoint)).map(e=>({id:e.id,name:e.name,points:e.points.map(p=>p.slice(0,2)),width:Math.max(.7,Math.min(8,e.width_cells||(e.kind==='PRECINCT'?6:e.kind==='FORECOURT'?1:2))),bridge:e.kind==='BRIDGE'||/^E00[1-7]$/.test(e.id)}));
 const lanes=streetLanes.filter(s=>finitePoint(s.a)&&finitePoint(s.b)&&Number.isFinite(s.width)&&s.width>0).map(s=>({a:s.a.slice(0,2),b:s.b.slice(0,2),width:s.width,housingLane:!!s.housingLane}));
 const water=(world?.water||[]).filter(p=>p.length>2&&p.every(finitePoint)).map(p=>p.map(q=>q.slice(0,2)));
 const buildings=parcels.filter(r=>r?.length===4&&r.every(Number.isFinite)&&r[2]>0&&r[3]>0).map(r=>r.slice());
 const walkable=surveyWalkable(world,excludedCells),roadMembers=new Map();
 for(const e of world?.edges?.values()||[])for(const k of e.band||[]){const ids=world.members?.get(k);if(ids?.size)roadMembers.set(k,ids);}
 const roadGround=surveyWalkable({members:roadMembers},excludedCells);
 const all=[...roads.flatMap(e=>e.points),...water.flat(),...buildings.flatMap(rectPolygon),...destinations.map(d=>d.position)].filter(finitePoint).map(planPoint);
 if(walkable.bounds){const[x,y,w,h]=walkable.bounds;all.push([x,y],[x+w,y+h]);}
 const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),left=all.length?Math.min(...xs)-8:0,top=all.length?Math.min(...ys)-8:0;
 const bounds=[left,top,all.length?Math.max(...xs)-left+8:350,all.length?Math.max(...ys)-top+8:250];
 return {roads,water,buildings,bounds,walkable,roadGround,lanes};
}
export function normalizedPoint(p,bounds){const q=planPoint(p);return q?[(q[0]-bounds[0])/bounds[2],(q[1]-bounds[1])/bounds[3]]:null;}
