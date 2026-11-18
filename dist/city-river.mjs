import {createRiverCharacter} from './river-character.mjs?v=river-sliced-1';
/* River presentation follows existing bridge landings. Navigation remains in city-core. */
import {project,pointIn} from './city-core.mjs?v=p21-b407-s039-reuse';

const BRIDGE_IDS=new Set(['E001','E002','E003','E004','E005','E006','E007']);
const corners=r=>[[r[0],r[1]],[r[0]+r[2],r[1]],[r[0]+r[2],r[1]+r[3]],[r[0],r[1]+r[3]]];
function intersects(rect,polygon){
 const a=corners(rect),inside=p=>p[0]>=rect[0]&&p[0]<=rect[0]+rect[2]&&p[1]>=rect[1]&&p[1]<=rect[1]+rect[3];
 if(a.some(p=>pointIn(p,polygon))||polygon.some(inside))return true;
 const cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
 for(let i=0;i<polygon.length;i++)for(let j=0;j<4;j++){
  const p=polygon[i],q=polygon[(i+1)%polygon.length],r=a[j],s=a[(j+1)%4];
  if(Math.max(p[0],q[0])<Math.min(r[0],s[0])||Math.max(r[0],s[0])<Math.min(p[0],q[0])||Math.max(p[1],q[1])<Math.min(r[1],s[1])||Math.max(r[1],s[1])<Math.min(p[1],q[1]))continue;
  if(cross(p,q,r)*cross(p,q,s)<=0&&cross(r,s,p)*cross(r,s,q)<=0)return true;
 }return false;
}
function offsetChannel(points,halfWidths){
 const normals=points.slice(1).map((p,i)=>{const a=points[i],dx=p[0]-a[0],dy=p[1]-a[1],n=Math.hypot(dx,dy);return[-dy/n,dx/n];});
 const side=sign=>points.map((p,i)=>{
  const a=normals[Math.max(0,i-1)],b=normals[Math.min(i,normals.length-1)],sx=a[0]+b[0],sy=a[1]+b[1],n=Math.hypot(sx,sy),v=[sx/n,sy/n],extent=halfWidths[i]/Math.max(.55,v[0]*b[0]+v[1]*b[1]);
  return[p[0]+sign*v[0]*extent,p[1]+sign*v[1]*extent];
 });return [...side(1),...side(-1).reverse()];
}
export function verticalCuts(polygon,x){
 const ys=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];if((a[0]>x)!==(b[0]>x))ys.push(a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0]));}return ys.sort((a,b)=>a-b);
}
export function createRiverContract(data,world,bridges){
 const main=bridges.bridges.filter(b=>['E001','E002','E003','E004','E007'].includes(b.edge)).sort((a,b)=>b.anchor[0]-a.anchor[0]);
 const banks=main.map(b=>({x:b.anchor[0],near:b.anchor[1]+2,far:b.anchor[1]+b.length-2,edge:b.edge}));
 banks.unshift({...banks[0],x:209,edge:null});banks.push({...banks.at(-1),x:12,edge:null});
 const mainPolygon=[...banks.map(b=>[b.x,b.near]),...banks.slice().reverse().map(b=>[b.x,b.far])];
 const body=bridges.bridges.find(b=>b.edge==='E005'),salis=bridges.bridges.find(b=>b.edge==='E006');
 const centre=b=>b.anchor[1]+b.length/2;
 const points=[[209,centre(body)],[body.anchor[0],centre(body)],[salis.anchor[0],centre(salis)],[81,101],[68,120],[59,144],[50,178]];
 const widths=[body.length-4,body.length-4,salis.length-4,24,24,24,24];
 const surfaces=[{id:'River_Ankh',engine_polygon:mainPolygon,banks},{id:'The_Cut',engine_polygon:offsetChannel(points,widths.map(x=>x/2)),centreline:points,widths}];
 const dry=new Set(world.solid);
 for(const [k,ids] of world.members)if([...ids].some(id=>!BRIDGE_IDS.has(id)))dry.add(k);
 const rows=new Map();let protectedCells=0;
 for(const key of dry){const [x,y]=key.split(',').map(Number);if(!surfaces.some(s=>intersects([x-.5,y-.5,1,1],s.engine_polygon)))continue;if(!rows.has(y))rows.set(y,[]);rows.get(y).push(x);protectedCells++;}
 const dryReceivers=[];
 for(const [y,xs] of [...rows].sort((a,b)=>a[0]-b[0])){
  xs.sort((a,b)=>a-b);let start=xs[0],end=start;
  for(const x of xs.slice(1)){if(x===end+1){end=x;continue;}dryReceivers.push([start-.5,y-.5,end-start+1,1]);start=end=x;}
  dryReceivers.push([start-.5,y-.5,end-start+1,1]);
 }
 return{asset_id:'BUDDY-RIVER-PRESENTATION-v1',stage:'Render correction candidate; Mark retains visual approval',presentationOnly:true,newNavigation:false,originalCollisionWaterUnchanged:true,bridgeLandingSetbackCells:2,surfaces,dryReceivers,protectedCells,sourceWater:data.water_geometry.map(w=>({id:w.id,width_cells:w.width_cells,engine_polygon:w.engine_polygon})),crossings:bridges.bridges.map(b=>{const s=surfaces.find(s=>s.id===(['E005','E006'].includes(b.edge)?'The_Cut':'River_Ankh'));return{edge:b.edge,anchor:b.anchor,length:b.length,width:b.width,renderWaterInterval:verticalCuts(s.engine_polygon,b.anchor[0])};})};
}
export function createRiverPainter(contract){
 const water=new Path2D(),dry=new Path2D(),banks=new Path2D();
 const add=(path,points)=>{points.map(p=>project(p)).forEach((p,i)=>i?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y));path.closePath();};
 for(const surface of contract.surfaces)add(water,surface.engine_polygon);
 dry.rect(-20000,-20000,40000,40000);
 for(const r of contract.dryReceivers)add(dry,corners(r));
 for(const surface of contract.surfaces)for(let i=0;i<surface.engine_polygon.length;i++){
  const a=surface.engine_polygon[i],b=surface.engine_polygon[(i+1)%surface.engine_polygon.length],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
  if(contract.surfaces.some(s=>s!==surface&&pointIn(mid,s.engine_polygon)))continue;
  const p=project(a),q=project(b);banks.moveTo(p.x,p.y);banks.lineTo(q.x,q.y);
 }
 let pattern=null,character=null,appearance=null;
 return{
  setAppearance(resources,plan){character?.dispose();character=createRiverCharacter(contract,plan);appearance=resources;},
  dispose(){character?.dispose();appearance=null;},
  draw(ctx,material,view){
   ctx.save();ctx.clip(water);ctx.clip(dry,'evenodd');if(appearance){character.draw(ctx,appearance,view);ctx.restore();return;}ctx.fillStyle='#3c4938';ctx.fillRect(-20000,-20000,40000,40000);
   ctx.save();ctx.transform(28,14,-28,14,0,0);
   if(!pattern){pattern=ctx.createPattern(material,'repeat');pattern.setTransform(new DOMMatrix().scale(1/64));}
   ctx.globalAlpha=1;ctx.fillStyle=pattern;ctx.fillRect(-50,-50,350,350);ctx.restore();
   ctx.fillStyle='#3a45321c';ctx.fillRect(-20000,-20000,40000,40000);
   ctx.strokeStyle='#3037289c';ctx.lineWidth=7;ctx.stroke(banks);ctx.strokeStyle='#8d81593d';ctx.lineWidth=1.5;ctx.stroke(banks);ctx.restore();
  },
  coversScenery:r=>contract.surfaces.some(s=>intersects([r[0]-.5,r[1]-.5,r[2],r[3]],s.engine_polygon)),
  report:()=>({...(character?.report()||{}),id:contract.asset_id,material:appearance?'water-muddy-v1.webp':'river_ankh_silty_water.webp',materialOpacity:1,presentationOnly:true,newNavigation:false,originalCollisionWaterUnchanged:true,protectedCells:contract.protectedCells,dryReceivers:contract.dryReceivers.length,crossings:contract.crossings})
 };
}
