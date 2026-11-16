// Existing-ground route composition, never new navigation or property authority.
import {compileAtlasStreets} from './city-atlas-streets.mjs?v=p21-b407-s039-reuse';
import {NEIGHBOURHOOD_COURSES} from './city-neighbourhood-courses.mjs?v=p21-b407-s039-reuse';
export const NEIGHBOURHOOD_BOUNDS=Object.freeze([26,185,92,248]);
const project=([x,y])=>[28*(x-y),14*(x+y)];
const distance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-a[0]-u*dx,p[1]-a[1]-u*dy);};
export function createNeighbourhoodStreets({world,ground,objects,images}){
 const plan=compileAtlasStreets({world,ground,objects,layout:{id:'E045-CONNECTED-NEIGHBOURHOOD-372',source:'2bb5a9dd28e42b5620ab9ee71a6598b52f833ae7',corridors:NEIGHBOURHOOD_COURSES,waypoints:[]}});
 if(plan.rejected.length||plan.corridors.length!==NEIGHBOURHOOD_COURSES.length)throw Error('Neighbourhood route source no longer fits: '+plan.rejected.join(','));
 const structural=objects.filter(o=>o.rect&&o.rect[0]<92&&o.rect[1]<248&&o.rect[0]+o.rect[2]>26&&o.rect[1]+o.rect[3]>185&&!o.person&&!o.bridgePart&&!['street-lamp','ground-contact'].includes(o.sceneryKind)&&!['explicit-e045-reservation','explicit-hide-park-reservation','explicit-hide-park-north-reservation'].includes(o.collisionMode));
 const clear=p=>world.members.has(p.map(Math.round).join(','))&&!ground.blocked.has(p.map(Math.round).join(','))&&ground.clearPoint(p)&&world.waterCollision.pointClear(p,[])&&!structural.some(o=>{const[x,y,w,h]=o.rect;return p[0]>=x-.5&&p[0]<=x+w-.5&&p[1]>=y-.5&&p[1]<=y+h-.5});
 const named=[...world.edges.values()].filter(e=>e.a&&e.points?.length>1).flatMap(e=>e.points.slice(1).map((b,i)=>({a:e.points[i],b,half:(e.width_cells||2)/2})));
 const finish=[],widths=new Map();let streetJoins=0,rejected=0;
 for(const s of plan.strips){
  const mid=[(s.a[0]+s.b[0])/2,(s.a[1]+s.b[1])/2];
  // Preserve the named streets' carriageway, footway and gutters as the main hierarchy.
  if(named.some(n=>distance(mid,n.a,n.b)<n.half+.1)){streetJoins++;continue;}
  const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],normal=[-dy,dx];
  const width=[2.2,1.6,1.1].filter(w=>w<=s.width).find(w=>{
   for(let t=-.1;t<=1.1001;t+=.1)for(let h=-w/2-.1;h<=w/2+.1001;h+=.1)if(!clear([s.a[0]+dx*t+normal[0]*h,s.a[1]+dy*t+normal[1]*h]))return false;
   return true;
  });
  if(!width){
   // At the existing E035 bend, the symmetric strip crosses a reserved
   // corner. Fill only the clear side and leave both path memberships intact.
   const a=[79,246,'E035'],b=[80,246,'E035'];
   const linked=(p,q)=>world.neighbours(p).some(n=>n.join(',')===q.join(','));
   const members=[a,b].every(p=>world.members.get(p.slice(0,2).join(','))?.has('E035'));
   if(s.id==='79,246|80,246'&&members&&linked(a,b)&&linked(b,a)){
    const outer=[[79,245.44],[80,245.44],[80,246.16],[79,246.16]];
    const inner=[[79,245.58],[80,245.58],[80,246.10],[79,246.10]];
    const surveyed=Array.from({length:41},(_,i)=>79+i/40).every(x=>
     Array.from({length:33},(_,i)=>245.44+.72*i/32).every(y=>clear([x,y])));
    if(surveyed){finish.push({...s,kind:'shades-footway-seam',width:.72,outer,inner});widths.set(.72,(widths.get(.72)||0)+1);continue;}
   }
   rejected++;continue;
  }
  const polygon=w=>[[-1,0],[-1,1],[1,1],[1,0]].map(([sign,t])=>[s.a[0]+dx*t+normal[0]*w/2*sign,s.a[1]+dy*t+normal[1]*w/2*sign]);
  finish.push({...s,width,outer:polygon(width),inner:polygon(Math.max(.6,width-.5))});widths.set(width,(widths.get(width)||0)+1);
 }
 // The existing E045 and E046 carriage surfaces meet in a broad apron.
 // Give the bend a visible course while keeping every painted point on
 // already admitted public ground. The surveyed strip is presentation only.
 const junction=[];
 const guide=[[46,215+2/3],[52,225],[42,225+5/6],[40,226],[39.5,231.5]];
 const banks=[0,1.3,1.3,1.2,0];
 for(let i=1;i<guide.length;i++){
  const a=guide[i-1],b=guide[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
  for(let j=0,n=Math.ceil(length*2);j<n;j++){
   const t=j/n,u=(j+1)/n;
   const polygon=(scale)=>[[t,-1],[u,-1],[u,1],[t,1]].map(([f,sign])=>{
    const w=(banks[i-1]+(banks[i]-banks[i-1])*f)*scale*sign;
    return [a[0]+dx*f+nx*w,a[1]+dy*f+ny*w];
   });
   const outer=polygon(1);
   const safe=Array.from({length:6},(_,k)=>t+(u-t)*k/5).every(f=>{
    const w=banks[i-1]+(banks[i]-banks[i-1])*f;
    return Array.from({length:13},(_,k)=>w*(k-6)/6).every(h=>clear([a[0]+dx*f+nx*h,a[1]+dy*f+ny*h]));
   });
   if(safe)junction.push({outer,inner:polygon(.66),kind:'treacle-junction'});
  }
 }
 // Recessed workshop aprons share the ground texture with the court. Use
 // flush masonry: raised barriers would disagree with the walking graph.
 const aprons=[];
 for(const [id,left,right,near,far] of [
  ['e045-cooper-workshop',47,52,216.25,217.45],
  ['SHADES-006:sack-mender-workroom',59,62,215.85,217.2]
 ]){
  if(!objects.some(o=>o.id===id&&o.rect))continue;
  const safe=([a,b,c,d])=>Array.from({length:21},(_,i)=>a+(b-a)*i/20).every(x=>
   Array.from({length:13},(_,i)=>c+(d-c)*i/12).every(y=>clear([x,y])));
  // Try recessing or trimming the apron while leaving its building fixed.
  const options=[];
  for(const dy of [0,.25,.5,.75,1])
   for(const [l,r] of [[0,0],[.5,0],[0,.5],[.5,.5],[1,0],[0,1]])
    options.push([left+l,right-r,near+dy,far+dy]);
  const fit=options.find(safe);
  if(!fit)continue;
  const [x0,x1,y0,y1]=fit;
  aprons.push({id,outer:[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],inner:[[x0+.12,y0],[x1-.12,y0],[x1-.12,y1-.19],[x0+.12,y1-.19]]});
 }
 // The dye-house has a side landing at [50,227]. Three cells along
 // its north wall have no public membership even though the base pavement
 // continues underneath. Paint that strip as a recessed service verge.
 const hasDyeHouse=objects.some(o=>o.id==='treacle:dyer');
 const vergeCells=hasDyeHouse?[[51,227],[52,227],[53,227]].filter(p=>!world.members.has(p.join(','))):[];
 const unit=([x,y],left=-.5,right=.5,top=-.5,bottom=.5)=>[[x+left,y+top],[x+right,y+top],[x+right,y+bottom],[x+left,y+bottom]];
 // Lay a small shared working apron against the two existing thresholds.
 // Sample the complete rectangle against the installed scene before painting.
 if(hasDyeHouse&&objects.some(o=>o.id==='treacle:joinery')&&[48,49,50].every(x=>world.members.get(x+',227')?.has('E046'))){
  const x0=47.65,x1=50.38,y0=226.52,y1=227.38;
  if(Array.from({length:29},(_,i)=>x0+(x1-x0)*i/28).every(x=>Array.from({length:10},(_,i)=>y0+(y1-y0)*i/9).every(y=>clear([x,y])))){
   aprons.push({id:'treacle-shared-approach',outer:[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],inner:[[x0+.08,y0],[x1-.08,y0],[x1-.08,y1-.11],[x0+.08,y1-.11]]});
  }
 }
 // Branch from the existing Treacle bend into the already-shared pair
 // of door landings. A flush flagstone spur avoids a visual break between
 // the road and the apron. Commit the whole strip or none of it.
 if(aprons.some(a=>a.id==='treacle-shared-approach')){
  const from=[48.83,225.10],to=[49.20,226.87];
  const point=(t,v)=>[from[0]+(to[0]-from[0])*t+v,from[1]+(to[1]-from[1])*t];
  const width=t=>.49+.16*t;
  const outer=[point(0,-width(0)),point(0,width(0)),point(1,width(1)),point(1,-width(1))];
  const inner=[point(0,-.35),point(0,.35),point(1,.53),point(1,-.53)];
  const legal=Array.from({length:37},(_,i)=>i/36).every(t=>
   Array.from({length:29},(_,j)=>width(t)*(j-14)/14).every(v=>clear(point(t,v))));
  if(legal)aprons.unshift({id:'treacle-court-to-workshop-join',outer,inner});
 }
 // Join the older west workshop landing to the shared Treacle apron.
 // The source walk is E046 throughout; if that changes, leave the existing
 // surface intact rather than painting a route that a patrol cannot follow.
 if(aprons.some(c=>c.id==='treacle-shared-approach')&&[...world.doors.values()].some(d=>!d.held&&d.position?.[0]===38&&d.position?.[1]===227)){
  const x0=37.65,x1=47.72,y0=226.57,y1=227.42;
  const row=Array.from({length:11},(_,i)=>[38+i,227,'E046']);
  const linked=row.every((p,i)=>world.members.get(p.slice(0,2).join(','))?.has('E046')&&(!i||world.neighbours(row[i-1]).some(q=>q[0]===p[0]&&q[1]===p[1]&&q[2]===p[2])));
  if(linked&&Array.from({length:102},(_,i)=>x0+(x1-x0)*i/101).every(x=>Array.from({length:10},(_,i)=>y0+(y1-y0)*i/9).every(y=>clear([x,y])))){
   aprons.unshift({id:'treacle-west-frontage',outer:[[x0,y0],[x1,y0],[x1,y1],[x0,y1]],inner:[[x0,y0+.10],[x1,y0+.10],[x1,y1-.14],[x0,y1-.14]]});
  }
 }
 const dyeApron=hasDyeHouse&&world.members.get('50,227')?.has('E046')&&clear([50,227])?unit([50,227],-.38,.35,-.39,.38):null;
 const path=polygons=>{const p=new Path2D();for(const poly of polygons){poly.forEach((q,i)=>i?p.lineTo(...q):p.moveTo(...q));p.closePath();}return p;};
 const shoulder=path(finish.map(s=>s.outer)),course=path(finish.map(s=>s.inner)),patterns=new WeakMap();let draws=0;
 const verge=path(vergeCells.map(p=>unit(p))),vergeEdge=path(vergeCells.map(p=>unit(p,-.5,.5,-.5,-.38))),dyeThreshold=path(dyeApron?[dyeApron]:[]);
 const junctionShoulder=path(junction.map(s=>s.outer)),junctionCourse=path(junction.map(s=>s.inner));
 const apronOuter=path(aprons.map(a=>a.outer)),apronInner=path(aprons.map(a=>a.inner));
 const worldBox=NEIGHBOURHOOD_BOUNDS,[x0,y0,x1,y1]=worldBox,box=[project([x0,y1])[0],project([x0,y0])[1],project([x1,y0])[0],project([x1,y1])[1]];
 function draw(ctx,view,mask=false){if(view&&(view[2]<box[0]||view[0]>box[2]||view[3]<box[1]||view[1]>box[3]))return;
  ctx.save();ctx.transform(28,14,-28,14,0,0);
  if(mask){ctx.fillStyle='#fff';ctx.fill(shoulder);ctx.fill(junctionShoulder);ctx.fill(apronOuter);ctx.fill(dyeThreshold);}else{
   let p=patterns.get(ctx);if(!p){p={};for(const name of ['flags-b','cobbles-a']){p[name]=ctx.createPattern(images[name],'repeat');p[name].setTransform(new DOMMatrix().scale(4.8/images[name].width,4.8/images[name].height));}patterns.set(ctx,p);}
   ctx.fillStyle=p['flags-b'];ctx.fill(shoulder);ctx.fillStyle=p['cobbles-a'];ctx.fill(course);

  }
  ctx.restore();draws++;
 }
 function drawJunction(ctx,view){
  if(view&&(view[2]<box[0]||view[0]>box[2]||view[3]<box[1]||view[1]>box[3]))return;
  const p=patterns.get(ctx);if(!p)return;
  ctx.save();ctx.transform(28,14,-28,14,0,0);
   ctx.fillStyle=p['flags-b'];ctx.fill(junctionShoulder);
   ctx.fillStyle='#52463450';ctx.fill(junctionShoulder);
   ctx.fillStyle=p['flags-b'];ctx.fill(junctionCourse);
   ctx.fillStyle='#51453580';ctx.fill(apronOuter);
   ctx.fillStyle=p['flags-b'];ctx.fill(apronInner);ctx.fill(dyeThreshold);
   ctx.fillStyle='#3930279c';ctx.fill(verge);
   ctx.fillStyle='#93816a';ctx.fill(vergeEdge);
  ctx.restore();
 }
 return {treacleJoin:aprons.find(p=>p.id==='treacle-court-to-workshop-join')?.outer,draw,drawJunction,pointClear:clear,drawMask:(ctx,view)=>draw(ctx,view,true),plan,finish:[...finish,...junction,...aprons,...(dyeApron?[{kind:'treacle-dye-threshold',outer:dyeApron,inner:dyeApron}]:[])],box,
  report:()=>({id:plan.id,bounds:worldBox,corridors:plan.corridors.length,segments:finish.length,widths:[...widths],namedStreetJoinSegments:streetJoins,rejectedNarrowSegments:rejected,treacleSegments:junction.length,treacleAprons:aprons.map(({id,outer})=>({id,outer})),treacleServiceVerge:vergeCells,treacleDyeThreshold:!!dyeApron,vectorPaths:9,bitmapCaches:0,draws,navigationChanged:false,buildingsMoved:0,streetWidthsChanged:false,saveMigrationRequired:false,newLore:false,creativeAcceptance:false})};
}
