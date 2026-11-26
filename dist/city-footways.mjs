/* Mark-approved paving direction: actual cached terrain, never a screenshot overlay.
 * Existing public cells, bridge paintings, courts and navigation remain authoritative. */
import {project,closest,distance} from './city-core.mjs?v=p21-b407-s039-reuse';
import {pavingRegions,cityLandBoundary} from './city-paving.mjs?v=strip-1';
import {streetSurfaceProfile} from './city-street-hierarchy.mjs?v=p21-b407-s039-reuse';
const bridge=id=>/^E00[1-7]$/.test(id);
const hash=(x,y,s=0)=>{let n=Math.imul(Math.round(x*100)+s,374761393)^Math.imul(Math.round(y*100),668265263);n=Math.imul(n^(n>>>13),1274126177);return (n>>>0)/4294967296;};
const inside=(p,r)=>p[0]>r[0]-.05&&p[0]<r[0]+r[2]-.95&&p[1]>r[1]-.05&&p[1]<r[1]+r[3]-.95;
const rectPolygon=([x,y,w,h])=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const box=p=>[Math.min(...p.map(p=>p[0])),Math.min(...p.map(p=>p[1])),Math.max(...p.map(p=>p[0])),Math.max(...p.map(p=>p[1]))];
const overlap=(a,b)=>a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1];
function edgeDistance(p,band){return Math.min(...band.points.slice(1).map((b,i)=>distance(p,closest(p,band.points[i],b))));}
export function compileFootways(world,{footprints=[],misbegotJoin=true}={}){
 const unpavedCells=new Set([...world.unpaved.values()].flatMap(area=>[...area.cells]));
 const receivers=[...world.members].filter(([k,ids])=>!unpavedCells.has(k)&&[...ids].some(id=>!bridge(id))).map(([k,ids])=>({p:k.split(',').map(Number),material:[...ids].some(id=>id.startsWith('APRON:'))?'flags':'cobbles'}));
 const bands=[...world.edges.values()].filter(e=>e.a&&!bridge(e.id)&&e.points?.length>1).map(e=>{
  // E045 connects the retained frontage court: keep its outer width, use a
  // quieter ordinary-street footway and the same worn cobble course as the court.
  const surface=streetSurfaceProfile(e),width=surface?.maxWidth||e.width_cells||2,footway=e.id==='E045'?.38:surface?.footway||Math.min(.72,width*.24);
  return {id:e.id,points:e.points.map(p=>p.slice()),width,carriageWidth:Math.max(.85,width-2*footway),footwayWidth:footway,bounds:box(e.points),surface,carriageMaterial:e.id==='E045'?'cobbles-b':'cobbles-a',footwayMaterial:e.id==='E045'?'flags-b':'flags-a'};
 });
 // Finish only the retained southern E045/E046 junction course. The far
 // E046 street keeps its original material; no road or footway is widened.
 const south=bands.find(b=>b.id==='E046'),junctionCourses=[];
 if(south&&JSON.stringify(south.points.slice(0,2))==='[[52,225],[40,226]]'){
  const [a,b]=south.points,len=distance(a,b),at=d=>[a[0]+(b[0]-a[0])*d/len,a[1]+(b[1]-a[1])*d/len],fade=2;
  junctionCourses.push({edge:south.id,a:a.slice(),b:b.slice(),width:south.width,carriageWidth:south.carriageWidth,
   strips:[{points:[a.slice(),at(len-fade)],alpha:1},...Array.from({length:8},(_,i)=>({points:[at(len-fade+i*fade/8),at(len-fade+(i+1)*fade/8)],alpha:1-(i+.5)/8}))]});
 }
 const misbegot=[34,197], joinCells=world.members.get(misbegot.join(','));
 const hasMisbegotJoin=misbegotJoin&&joinCells?.has('E007')&&joinCells.has('E045');
 const kerbs=[],gutters=[],wear=[],repairs=[],misbegotStrips=[];
 for(const band of bands)for(let i=1;i<band.points.length;i++){
  const a=band.points[i-1],b=band.points[i],len=distance(a,b);if(!len)continue;
  const t=[(b[0]-a[0])/len,(b[1]-a[1])/len],n=[-t[1],t[0]];
  const seam=hasMisbegotJoin&&band.id==='E045'&&a[0]===misbegot[0]&&a[1]===misbegot[1];
  if(seam){
   // Paint only the first 2.4 land-side units of the existing street.
   // A stepped alpha taper reuses the worn cobble already used for repairs.
   const at=(d,h)=>[a[0]+d*t[0]+h*n[0],a[1]+d*t[1]+h*n[1]];
   const half=band.width/2, length=Math.min(2.4,len);
   for(let j=0;j<8;j++){
    const lo=j*length/8,hi=(j+1)*length/8;
    misbegotStrips.push({points:[at(lo,-half),at(hi,-half),at(hi,half),at(lo,half)],alpha:.74*(1-(j+.5)/8)**1.5});
   }
  }
  const segments=Math.max(1,Math.ceil(len/.62)),unit=len/segments;
  for(let j=0;j<segments;j++)for(const sign of [-1,1]){
   const at=(d,offset)=>[a[0]+t[0]*d+n[0]*offset*sign,a[1]+t[1]*d+n[1]*offset*sign];
   const d=(j+.5)*unit,h=(band.surface?.carriageWidthAt(d)||band.carriageWidth)/2,mid=at(d,h+.045);
   // Leave real street junctions open, including internal bends of a route.
   if(bands.some(other=>other.id!==band.id&&edgeDistance(mid,other)<other.carriageWidth/2+.15))continue;
   if(footprints.some(r=>inside(mid,r)))continue;
   const lo=j*unit+.012,hi=(j+1)*unit-.012;
   const hlo=(band.surface?.carriageWidthAt(lo)||band.carriageWidth)/2,hhi=(band.surface?.carriageWidthAt(hi)||band.carriageWidth)/2;
   kerbs.push({edge:band.id,points:[at(lo,hlo),at(hi,hhi),at(hi,hhi+.11),at(lo,hlo+.11)],p:mid,tone:hash(...mid,3)});
   gutters.push({a:at(lo,h-.075),b:at(hi,h-.075),p:mid,shade:.16+hash(...mid,4)*.12});
  }
  if(len>3)for(const sign of [-1,1]){
   if(band.surface)for(let k=1;k<band.surface.stations.length;k++){const s=band.surface.stations[k-1],z=band.surface.stations[k];wear.push({a:band.surface.position(s.at,(s.width-2*s.footway)*.25*sign),b:band.surface.position(z.at,(z.width-2*z.footway)*.25*sign),width:.18,alpha:.065});}
   else wear.push({a:[a[0]+n[0]*band.carriageWidth*.25*sign,a[1]+n[1]*band.carriageWidth*.25*sign],b:[b[0]+n[0]*band.carriageWidth*.25*sign,b[1]+n[1]*band.carriageWidth*.25*sign],width:.18,alpha:.065});
  }
  // Sparse bounded patches share the street's course; they do not form a tile grid.
  if(len>7){const u=.25+hash(a[0],b[1],7)*.5,p=[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];repairs.push({p,radius:.45+hash(...p,8)*.35});}
 }
 const thresholds=[...world.doors.values()].filter(d=>!d.held&&!bridge(d.edge)).map(d=>({id:d.game_id,p:d.position.slice(),radius:.48}));
 const regions=pavingRegions(receivers).map(r=>({...r,points:rectPolygon(r.rect)}));
 return {id:'CW-CITY-FOOTWAYS-v2',receivers,regions,bands,kerbs,gutters,wear,repairs,thresholds,footprints,unpavedCells,misbegotStrips,junctionCourses,bridgeEdges:[...world.edges.keys()].filter(bridge),navigationChanged:false};
}
function pathFor(points,close=false){const path=new Path2D();points.forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p));if(close)path.closePath();return path;}
// Positive winding throughout: overlapping strips and rounded joins are one
// continuous surface, rather than a union of square navigation receivers.
function outlinePath(points){const area=points.reduce((a,p,i)=>{const q=points[(i+1)%points.length];return a+p[0]*q[1]-q[0]*p[1];},0);return pathFor(area<0?points.slice().reverse():points,true);}
function roundedStreetPath(points,width){
 const path=new Path2D(),r=width/2;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=distance(a,b);if(!length)continue;const n=[-(b[1]-a[1])*r/length,(b[0]-a[0])*r/length];path.addPath(outlinePath([[a[0]-n[0],a[1]-n[1]],[b[0]-n[0],b[1]-n[1]],[b[0]+n[0],b[1]+n[1]],[a[0]+n[0],a[1]+n[1]]]));}
 for(const p of points){const cap=new Path2D();cap.arc(...p,r,0,Math.PI*2);path.addPath(cap);}
 return path;
}
export function createCityFootways(world,images,options={}){
 const plan=compileFootways(world,options),patterns=new WeakMap(),publicPath=new Path2D(),flagPath=new Path2D();
 // The received E045 court supplies one continuous ground contact. Retain
 // every collision/exclusion footprint, retiring only its generic stone rim.
 const sharedCourtKeys=new Set((options.sharedCourtFootprints||[]).map(r=>r.join(',')));
 const footingRings=plan.footprints.filter(r=>!sharedCourtKeys.has(r.join(',')));
 const bandIDs=new Set(plan.bands.map(b=>b.id));
 // Plazas and door aprons retain their authored areas. Street material follows
 // the continuous road course; retaining its old cell union leaves stair teeth.
 // Street cells far from every one of their own street's centre lines (e.g. the lanes inside the east
 // and south city walls) are paved as areas too; otherwise they stay bare ground (26 Nov 2026).
 const bandsByID=new Map();for(const b of plan.bands){if(!bandsByID.has(b.id))bandsByID.set(b.id,[]);bandsByID.get(b.id).push(b);}
 const offCourse=r=>[...(world.members.get(r.p.join(','))||[])].every(id=>(bandsByID.get(id)||[]).every(b=>edgeDistance(r.p,b)>b.width/2+.75));
 const areas=pavingRegions(plan.receivers.filter(r=>r.material==='flags'||[...(world.members.get(r.p.join(','))||[])].some(id=>!bandIDs.has(id))||offCourse(r)));
 for(const r of areas)publicPath.addPath(outlinePath(rectPolygon(r.rect)));
 for(const r of plan.regions)if(r.material==='flags')flagPath.addPath(outlinePath(r.points));
 const roads=plan.bands.map(b=>({...b,path:pathFor(b.points),outerPath:b.surface&&outlinePath(b.surface.outline),carriagePath:b.surface&&outlinePath(b.surface.carriageOutline)}));
 for(const b of roads)publicPath.addPath(b.outerPath||roundedStreetPath(b.points,b.width));
 // The planned land rectangle stops short of the lanes inside the east and south city walls, which
 // were left unpaved; widen it to every walkable cell (26 Nov 2026).
 let landPath=options.grid?(()=>{const b=cityLandBoundary(options.grid),xs=b.map(p=>p[0]),ys=b.map(p=>p[1]);let x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  for(const k of world.members.keys()){const [x,y]=k.split(',').map(Number);if(x-.5<x0)x0=x-.5;if(x+.5>x1)x1=x+.5;if(y-.5<y0)y0=y-.5;if(y+.5>y1)y1=y+.5;}
  return pathFor([[x0,y0],[x1,y0],[x1,y1],[x0,y1]],true);})():null;
 let latePicked=false,lateCells=0,draws=0,visibleBands=0,surfaceReuses=0,surfaceKey=null,surfaceEpoch=0;
 const readSurfaceVersion=typeof options.surfaceVersion==='function'?options.surfaceVersion:null;
 const publicSurface=document.createElement('canvas');let surfaceBytes=0;
 function textures(g){let p=patterns.get(g);if(p)return p;p={};for(const [kind,image]of Object.entries(images)){p[kind]=g.createPattern(image,'repeat');p[kind].setTransform(new DOMMatrix().scale(4.8/image.width,4.8/image.height));}patterns.set(g,p);return p;}
 return {
  drawLand(ctx,view){
   if(!landPath)return;
   const corners=[[view[0],view[1]],[view[2],view[1]],[view[2],view[3]],[view[0],view[3]]].map(([x,y])=>[x/56+y/28,y/28-x/56]),bounds=box(corners);
   ctx.save();ctx.transform(28,14,-28,14,0,0);ctx.clip(landPath);const p=textures(ctx);
   // Retain the painted earth/courtyard underlay on private land.
   // Public cobbles and flags are drawn only by draw() on mapped receivers.
   // Existing property reservations get a narrow, worn stone footing. This is
   // decorative frontage contact, never a newly advertised walking connection.
   for(const [x,y,w,h] of footingRings){
    if(!overlap([x-2,y-2,x+w+2,y+h+2],bounds))continue;
    const ring=pathFor(rectPolygon([x-.55,y-.55,w+.1,h+.1]),true);
    ctx.strokeStyle=p['flags-b'];ctx.lineWidth=.25;ctx.lineJoin='round';ctx.stroke(ring);
    ctx.strokeStyle='#3e36291f';ctx.lineWidth=.12;ctx.stroke(ring);
   }
   ctx.restore();
  },
  paint(ctx,view){
   // Walkable cells added after this plan was compiled (the lanes inside the city walls are joined
   // later by the fortification pass) are paved as areas, and the land clip grows to include them.
   if(!latePicked){latePicked=true;const known=new Set(plan.receivers.map(r=>r.p.join(','))),late=[];
    const bare=new Set([...world.unpaved.values()].flatMap(a=>[...a.cells]));for(const [k,ids] of world.members){if(known.has(k)||bare.has(k)||[...ids].every(id=>bridge(id)))continue;late.push({p:k.split(',').map(Number),material:'cobbles'});}
    if(late.length){for(const r of pavingRegions(late))publicPath.addPath(outlinePath(rectPolygon(r.rect)));
     if(landPath){const grown=new Path2D(landPath);for(const r of late)grown.rect(r.p[0]-.5,r.p[1]-.5,1,1);landPath=grown;}}
    lateCells=late.length;}
   const corners=[[view[0],view[1]],[view[2],view[1]],[view[2],view[3]],[view[0],view[3]]].map(([x,y])=>[x/56+y/28,y/28-x/56]),worldView=box(corners),bounds=[worldView[0]-5,worldView[1]-5,worldView[2]+5,worldView[3]+5];
   ctx.save();ctx.transform(28,14,-28,14,0,0);
   // Bound vector intersections before combining the city-wide street union
   // with property exclusions. The border lies beyond this cached surface;
   // authored paths, textures, footings and navigation keep their geometry.
   if(options.boundClipIntersections){const localClip=new Path2D();localClip.rect(bounds[0],bounds[1],bounds[2]-bounds[0],bounds[3]-bounds[1]);ctx.clip(localClip);}
   if(landPath)ctx.clip(landPath);
   const p=textures(ctx),fill=(pattern)=>{ctx.fillStyle=pattern;ctx.fillRect(bounds[0],bounds[1],bounds[2]-bounds[0],bounds[3]-bounds[1]);};
   const visible=roads.filter(b=>overlap([b.bounds[0]-b.width,b.bounds[1]-b.width,b.bounds[2]+b.width,b.bounds[3]+b.width],bounds));visibleBands=visible.length;
   ctx.lineCap='round';ctx.lineJoin='round';
   // Small material-only shoulders blend worn stone into the existing earth.
   // No blur, downsampling, new bitmaps, navigation cells or geometry changes.
   for(const [extra,alpha]of [[.48,.07],[.24,.16],[.10,.25]]){ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=p['flags-b'];for(const b of visible){ctx.lineWidth=b.outerPath?extra:b.width+extra;ctx.stroke(b.outerPath||b.path);}ctx.restore();}
   ctx.save();ctx.clip(publicPath);fill(p['cobbles-a']);
   // All footway bases first, then all carriageways: joins never get a pavement bar.
   for(const b of visible){if(b.outerPath){ctx.fillStyle=p[b.footwayMaterial];ctx.fill(b.outerPath);}else{ctx.strokeStyle=p[b.footwayMaterial];ctx.lineWidth=b.width;ctx.stroke(b.path);}}
   ctx.save();ctx.clip(flagPath);fill(p['flags-a']);ctx.restore();
   ctx.save();ctx.globalAlpha*=.28;ctx.strokeStyle=p['cobbles-a'];for(const b of visible){ctx.lineWidth=b.carriagePath ? .16 : b.carriageWidth+.16;ctx.stroke(b.carriagePath||b.path);}ctx.restore();
   for(const b of visible){if(b.carriagePath){ctx.fillStyle=p[b.carriageMaterial];ctx.fill(b.carriagePath);}else{ctx.strokeStyle=p[b.carriageMaterial];ctx.lineWidth=b.carriageWidth;ctx.stroke(b.path);}}
   // The transition is a road material; kerbs, drainage and wear finish over it.
   const roadAlpha=ctx.globalAlpha;
   for(const strip of plan.misbegotStrips){
    const projected=box(strip.points.map(([x,y])=>[28*(x-y),14*(x+y)]));
    if(!overlap(projected,view))continue;
    ctx.globalAlpha=roadAlpha*strip.alpha;ctx.fillStyle=p['cobbles-b'];ctx.fill(outlinePath(strip.points));
   }
   ctx.globalAlpha=roadAlpha;
   for(const patch of plan.repairs){if(!overlap([patch.p[0]-1,patch.p[1]-1,patch.p[0]+1,patch.p[1]+1],bounds))continue;ctx.save();ctx.beginPath();ctx.ellipse(...patch.p,patch.radius,patch.radius*.7,0,0,Math.PI*2);ctx.clip();ctx.globalAlpha=.46;fill(p['cobbles-b']);ctx.restore();}
   for(const w of plan.wear){if(!overlap(box([w.a,w.b]),bounds))continue;ctx.strokeStyle=`rgba(224,211,179,${w.alpha})`;ctx.lineWidth=w.width;ctx.beginPath();ctx.moveTo(...w.a);ctx.lineTo(...w.b);ctx.stroke();}
   for(const k of plan.gutters){if(!overlap([k.p[0]-.7,k.p[1]-.7,k.p[0]+.7,k.p[1]+.7],bounds))continue;ctx.strokeStyle=`rgba(49,42,30,${k.shade})`;ctx.lineWidth=.12;ctx.beginPath();ctx.moveTo(...k.a);ctx.lineTo(...k.b);ctx.stroke();}
   // Individual low stones, not a continuous high wall. All remain non-colliding.
   for(const k of plan.kerbs){if(!overlap([k.p[0]-.8,k.p[1]-.8,k.p[0]+.8,k.p[1]+.8],bounds))continue;const path=pathFor(k.points,true);ctx.fillStyle=p[k.edge==='E045'?'flags-b':k.tone>.78?'flags-b':'flags-a'];ctx.fill(path);ctx.strokeStyle='#b4a58a40';ctx.lineWidth=.012;ctx.stroke(path);ctx.beginPath();ctx.moveTo(...k.points[0]);ctx.lineTo(...k.points[1]);ctx.strokeStyle='#41392e40';ctx.lineWidth=.022;ctx.stroke();}
   for(const d of plan.thresholds){if(!overlap([d.p[0]-1,d.p[1]-1,d.p[0]+1,d.p[1]+1],bounds))continue;ctx.save();ctx.beginPath();ctx.rect(d.p[0]-.55,d.p[1]-.55,1.1,1.1);ctx.clip();fill(p['flags-b']);ctx.restore();}
   ctx.restore();ctx.restore();draws++;
  },
  paintJunctionCourse(ctx,view){
   if(!plan.junctionCourses.length)return;
   const corners=[[view[0],view[1]],[view[2],view[1]],[view[2],view[3]],[view[0],view[3]]].map(([x,y])=>[x/56+y/28,y/28-x/56]);
   const bounds=box(corners),p=textures(ctx),fill=pattern=>{ctx.fillStyle=pattern;ctx.fillRect(bounds[0]-5,bounds[1]-5,bounds[2]-bounds[0]+10,bounds[3]-bounds[1]+10);};
   ctx.save();ctx.transform(28,14,-28,14,0,0);ctx.globalCompositeOperation='source-atop';
   for(const course of plan.junctionCourses){
    const cb=box([course.a,course.b]);if(!overlap([cb[0]-2,cb[1]-2,cb[2]+2,cb[3]+2],[bounds[0]-5,bounds[1]-5,bounds[2]+5,bounds[3]+5]))continue;
    // A small local clip avoids changing the rasterisation of the city-wide
    // public union. Source-atop also retains its existing alpha/property mask.
    const local=[cb[0]-2,cb[1]-2,cb[2]+2,cb[3]+2],near=p=>p[0]>=local[0]&&p[0]<=local[2]&&p[1]>=local[1]&&p[1]<=local[3];
    const m=ctx.getTransform(),det=m.a*m.d-m.b*m.c,ps=[[local[0],local[1]],[local[2],local[1]],[local[2],local[3]],[local[0],local[3]]].map(([x,y])=>[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f]);
    const x=Math.max(0,Math.floor(Math.min(...ps.map(p=>p[0])))-2),y=Math.max(0,Math.floor(Math.min(...ps.map(p=>p[1])))-2),w=Math.min(ctx.canvas.width,Math.ceil(Math.max(...ps.map(p=>p[0])))+2)-x,h=Math.min(ctx.canvas.height,Math.ceil(Math.max(...ps.map(p=>p[1])))+2)-y;
    if(w<=0||h<=0)continue;const previous=ctx.getImageData(x,y,w,h);
    ctx.save();ctx.clip(roundedStreetPath([course.a,course.b],course.width));
    for(const [material,width]of [['flags-b',course.width],['cobbles-b',course.carriageWidth]]){ctx.strokeStyle=p[material];ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';for(const strip of course.strips){ctx.save();ctx.globalAlpha*=strip.alpha;ctx.stroke(pathFor(strip.points));ctx.restore();}}
    // Keep the intersecting E045 carriageway open through the shared junction.
    const main=roads.find(b=>b.id==='E045');if(main){ctx.strokeStyle=p[main.carriageMaterial];ctx.lineWidth=main.carriageWidth;ctx.stroke(main.path);}
    for(const patch of plan.repairs){if(!near(patch.p))continue;ctx.save();ctx.beginPath();ctx.ellipse(...patch.p,patch.radius,patch.radius*.7,0,0,Math.PI*2);ctx.clip();ctx.globalAlpha=.46;fill(p['cobbles-b']);ctx.restore();}
    for(const w of plan.wear){if(!overlap(box([w.a,w.b]),local))continue;ctx.strokeStyle=`rgba(224,211,179,${w.alpha})`;ctx.lineWidth=w.width;ctx.beginPath();ctx.moveTo(...w.a);ctx.lineTo(...w.b);ctx.stroke();}
    for(const k of plan.gutters){if(!near(k.p))continue;ctx.strokeStyle=`rgba(49,42,30,${k.shade})`;ctx.lineWidth=.12;ctx.beginPath();ctx.moveTo(...k.a);ctx.lineTo(...k.b);ctx.stroke();}
    for(const k of plan.kerbs){if(!near(k.p))continue;const path=pathFor(k.points,true);ctx.fillStyle=p[k.edge==='E045'?'flags-b':k.tone>.78?'flags-b':'flags-a'];ctx.fill(path);ctx.strokeStyle='#b4a58a40';ctx.lineWidth=.012;ctx.stroke(path);ctx.beginPath();ctx.moveTo(...k.points[0]);ctx.lineTo(...k.points[1]);ctx.strokeStyle='#41392e40';ctx.lineWidth=.022;ctx.stroke();}
    ctx.restore();
    // Preserve every previous pixel outside today's legal ground, including
    // antialiased cell edges and the later-activated polygon reservations.
    const finished=ctx.getImageData(x,y,w,h);for(let row=0;row<h;row++)for(let col=0;col<w;col++){
     const i=(row*w+col)*4;if(finished.data[i]===previous.data[i]&&finished.data[i+1]===previous.data[i+1]&&finished.data[i+2]===previous.data[i+2]&&finished.data[i+3]===previous.data[i+3])continue;
     const dx=x+col+.5-m.e,dy=y+row+.5-m.f,p=[(dx*m.d-dy*m.c)/det,(dy*m.a-dx*m.b)/det],ids=world.members.get(p.map(Math.round).join(','));
     if(!ids?.size||options.legalPoint&&!options.legalPoint(p)||!world.waterCollision.pointClear(p,[...ids]))for(let k=0;k<4;k++)finished.data[i+k]=previous.data[i+k];
    }ctx.putImageData(finished,x,y);
   }ctx.restore();
  },
  draw(ctx,view){
   const width=ctx.canvas.width,height=ctx.canvas.height,t=ctx.getTransform();
   let version;try{version=readSurfaceVersion?.();}catch(error){surfaceKey=null;throw error;}
   // Only a caller with explicit geometry invalidation may retain this layer.
   // Streamed ground images change independently of its fixed paving/art mask.
   const retain=!!readSurfaceVersion&&version!==null&&version!==undefined&&width>0&&height>0&&Number.isFinite(view[0])&&Number.isFinite(view[1])&&Number.isFinite(view[2])&&Number.isFinite(view[3]),k=surfaceKey;
   const hit=retain&&k&&k.width===width&&k.height===height&&Object.is(k.version,version)&&Object.is(k.a,t.a)&&Object.is(k.b,t.b)&&Object.is(k.c,t.c)&&Object.is(k.d,t.d)&&Object.is(k.e,t.e)&&Object.is(k.f,t.f)&&Object.is(k.x0,view[0])&&Object.is(k.y0,view[1])&&Object.is(k.x1,view[2])&&Object.is(k.y1,view[3]);
   if(hit)surfaceReuses++;
   else{
    surfaceKey=null;
    // Keep every structural exclusion local to its actual pixels. Repeated
    // even-odd vector intersections can split otherwise continuous paving into
    // distant rectangular fragments in the retained ground surface.
    if(publicSurface.width!==width)publicSurface.width=width;
    if(publicSurface.height!==height)publicSurface.height=height;
    surfaceBytes=width*height*4;
    const g=publicSurface.getContext('2d'),epoch=surfaceEpoch;
    try{
     // Work only inside the requested view's pixels (a scrolled ground strip asks for a thin band).
     const R=pixelRegion(view,t,width,height);
     g.setTransform(1,0,0,1,0,0);g.clearRect(R[0],R[1],R[2],R[3]);
     g.save();g.beginPath();g.rect(R[0],R[1],R[2],R[3]);g.clip();
     g.save();g.setTransform(t);this.paint(g,view);this.paintJunctionCourse(g,view);g.restore();
     g.save();g.setTransform(t);g.transform(28,14,-28,14,0,0);
     g.globalAlpha=1;g.globalCompositeOperation='destination-out';g.fillStyle='#fff';
     g.beginPath();
     const near=cellsNear(view);
     for(const [x,y,w,h] of plan.footprints)if(w>.1&&h>.1&&near(x,y,w,h))g.rect(x-.45,y-.45,w-.1,h-.1);
     for(const cell of plan.unpavedCells){const[x,y]=cell.split(',').map(Number);if(near(x-.5,y-.5,1,1))g.rect(x-.5,y-.5,1,1);}
     g.fill();g.restore();g.restore();
     // A changing version during paint must never promote a stale surface.
     if(retain&&Object.is(readSurfaceVersion(),version)&&epoch===surfaceEpoch&&publicSurface.width===width&&publicSurface.height===height)surfaceKey={width,height,version,a:t.a,b:t.b,c:t.c,d:t.d,e:t.e,f:t.f,x0:view[0],y0:view[1],x1:view[2],y1:view[3]};
    }catch(error){surfaceKey=null;publicSurface.width=width;throw error;}
   }
   {const R=pixelRegion(view,t,width,height);if(R[2]>0&&R[3]>0){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(publicSurface,R[0],R[1],R[2],R[3],R[0],R[1],R[2],R[3]);ctx.restore();}}
  },
  invalidateSurface(){surfaceKey=null;surfaceEpoch++;},
  dispose(){publicSurface.width=publicSurface.height=1;surfaceBytes=0;surfaceKey=null;surfaceEpoch++;},
  report:()=>({lateCells,id:plan.id,sharedCourtFootingRings:plan.footprints.length-footingRings.length,structuralExclusion:'source-pixel-mask',surfaceMiB:surfaceBytes/1048576,surfaceVersioned:!!readSurfaceVersion,surfaceReuses,surfaceCached:!!surfaceKey,boundedClipIntersections:!!options.boundClipIntersections,continuousStreetEdges:true,blendedMaterialShoulders:true,misbegotJoinStrips:plan.misbegotStrips.length,southernJunctionCourses:plan.junctionCourses.map(c=>({edge:c.edge,a:c.a,b:c.b,width:c.width,carriageWidth:c.carriageWidth})),streetBands:plan.bands.length,visibleBands,publicCells:plan.receivers.length,unpavedEarthCells:plan.unpavedCells.size,kerbStones:plan.kerbs.length,thresholds:plan.thresholds.length,repairPatches:plan.repairs.length,paintDraws:draws,decodedMaterialMiB:4,bridgeArtRetained:7,navigationChanged:false,footprintsExcluded:true,bespokePrivateCourtsRetained:true,surveyedCartways:plan.bands.filter(b=>b.surface).map(b=>({edge:b.id,id:b.surface.id,length:b.surface.length,widthRange:[b.surface.minWidth,b.surface.maxWidth],carriageRange:b.surface.carriageRange,footwayRange:[b.footwayWidth,.72],stations:b.surface.stations}))}),
  plan
 };
}

// Device-pixel box of a world view under a scale+translate transform, padded and clamped.
function pixelRegion(view,t,width,height){
 if(!view||![view[0],view[1],view[2],view[3]].every(Number.isFinite)||t.b||t.c)return [0,0,width,height];
 const xs=[view[0]*t.a+t.e,view[2]*t.a+t.e],ys=[view[1]*t.d+t.f,view[3]*t.d+t.f];
 const x0=Math.max(0,Math.floor(Math.min(...xs))-2),y0=Math.max(0,Math.floor(Math.min(...ys))-2),x1=Math.min(width,Math.ceil(Math.max(...xs))+2),y1=Math.min(height,Math.ceil(Math.max(...ys))+2);
 return [x0,y0,Math.max(0,x1-x0),Math.max(0,y1-y0)];
}
// Cell rectangles (grid units) whose isometric diamond can touch the world view.
function cellsNear(view){
 if(!view||![view[0],view[1],view[2],view[3]].every(Number.isFinite))return ()=>true;
 return (x,y,w,h)=>{const sx0=28*(x-(y+h)),sx1=28*((x+w)-y),sy0=14*(x+y),sy1=14*(x+w+y+h);return sx1>=view[0]-28&&sx0<=view[2]+28&&sy1>=view[1]-14&&sy0<=view[3]+14;};
}
