import {renderCurtain,renderGate,createFortificationMaterials} from './city-fortification-mesh.mjs?v=gates-shut-1';
import {project,key,distance,closest} from './city-core.mjs?v=p21-b407-s039-reuse';
import {footProbeOffsets} from './city-free-walk.mjs?v=p21-b407-s039-reuse';
import {resolveGateApron} from './city-fortification-geometry.mjs?v=p21-b407-s039-reuse';

const publicKind=new Set(['STREET','YARD','PRECINCT']);
// Build 508 verified these nine retained receivers from the Watch House with
// the full movement graph. Keep that result with the compiled layout so a
// player boot does not flood all 46,781 retained cells again. If any receiver
// no longer fits the current source, the exact live-graph fallback below runs
// before a gate can be admitted.
const verifiedGateReceivers=new Map([
 ['gate:hubwards',[[174,336],'E008']],['gate:rimwards',[[80,11],'E025']],
 ['gate:deosil',[[14,64],'E043']],['gate:least',[[196,11],'E040']],
 ['gate:trading',[[235,275],'E008']],['gate:limping',[[235,320],'E008']],
 ['gate:onion',[[82,336],'E056']],['gate:shambling',[[14,285],'E046']],
 ['gate:traitors',[[35,11],'E025']]
]);
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);return c;};
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const rectHit=(p,r)=>p[0]>=r[0]&&p[0]<=r[0]+r[2]&&p[1]>=r[1]&&p[1]<=r[1]+r[3];
function rectangle(a,b,width){return [Math.min(a[0],b[0])-width/2,Math.min(a[1],b[1])-width/2,Math.abs(a[0]-b[0])+width,Math.abs(a[1]-b[1])+width];}

// The face is projected from its measured foundation, never a stretched flat
// isometric painting. Gate portal and jamb planes have separate horizontal fits.
export function projectFace(image,a,b,height,{portal=null}={}){
 let A=project(a),B=project(b);if(B.x<A.x){[a,b]=[b,a];[A,B]=[B,A];}
 const left=Math.floor(A.x)-2,top=Math.floor(Math.min(A.y,B.y)-height)-2;
 const c=canvas(B.x-A.x+4,Math.abs(B.y-A.y)+height+4),g=c.getContext('2d');
 const iw=image.width,ih=image.height;
 const parts=portal?[[0,portal[0],0,5/16],[portal[0],portal[1],5/16,11/16],[portal[1],iw,11/16,1]]:[[0,iw,0,1]];
 const mapU=x=>{const part=parts.find(p=>x>=p[0]&&x<=p[1])||parts.at(-1);return part[2]+(x-part[0])/(part[1]-part[0])*(part[3]-part[2]);};
 for(const [sx,ex,s,e]of parts){const P={x:A.x+(B.x-A.x)*s,y:A.y+(B.y-A.y)*s},Q={x:A.x+(B.x-A.x)*e,y:A.y+(B.y-A.y)*e};g.save();g.setTransform((Q.x-P.x)/(ex-sx),(Q.y-P.y)/(ex-sx),0,height/ih,P.x-left-sx*(Q.x-P.x)/(ex-sx),P.y-top-height-sx*(Q.y-P.y)/(ex-sx));g.beginPath();g.rect(sx,0,ex-sx,ih);g.clip();g.drawImage(image,0,0);g.restore();}
 return {im:c,box:[left,top,c.width,c.height],map:(x,y)=>{const u=mapU(x);return [A.x+(B.x-A.x)*u-left,A.y+(B.y-A.y)*u-height+height*y/ih-top];}};
}

export async function createCityFortifications({layout,world,ground,objects,read,load,addSprites,lightAnchors}){
 layout??=await read('assets/city-walls296/layout.json?v=p21-b407-s039-reuse');
 const [stone,cobble,materialAtlas]=await Promise.all([load('assets/city-walls296/stone.webp'),load('assets/city-paving-v2/cobbles-a.webp'),load('assets/city-walls300/painted-materials.webp')]);
 const materials=createFortificationMaterials(materialAtlas);
 const original=new Map([...world.members].map(([k,v])=>[k,new Set(v)])),sourceDoors=[...world.doors.keys()];
 const structures=objects.filter(o=>o.rect&&!o.person&&!o.bridgePart&&!['street-lamp','ground-contact'].includes(o.sceneryKind));
 const blocked=p=>ground.blocked.has(key(p.map(Math.round)))||world.solid.has(key(p.map(Math.round)))||world.wet(p)||!world.waterCollision.pointClear(p,[]);
 const clear=p=>footProbeOffsets.every(([x,y])=>{const q=[p[0]+x,p[1]+y];return !blocked(q)&&ground.clearPoint(q)&&!structures.some(o=>rectHit(q,[o.rect[0]-.5,o.rect[1]-.5,o.rect[2],o.rect[3]]));});
 const publicCell=p=>[...(original.get(key(p))||[])].find(id=>publicKind.has(world.edges.get(id)?.kind))||null;
 const planWith=reachableCell=>layout.gates.map(g=>resolveGateApron(g,{publicCell,clearCell:clear,existingCell:p=>original.has(key(p)),reachableCell:(p,id)=>reachableCell(g.id,p,id)}));
 const pinnedReachable=(gateID,p,id)=>{const receiver=verifiedGateReceivers.get(gateID);return !!receiver&&receiver[1]===id&&receiver[0][0]===p[0]&&receiver[0][1]===p[1];};
 let plans=planWith(pinnedReachable),usedVerifiedReceivers=!plans.some(p=>p.blocked);
 if(!usedVerifiedReceivers){
  // Source/layout drift keeps the old exact guard: a current-network flood
  // must prove any replacement receiver before the gate mutates the graph.
  const start=[126,132,'RC1'],todo=[start],reachable=new Set([start.join(',')]);
  for(let i=0;i<todo.length;i++)for(const q of world.neighbours(todo[i])){const k=q.join(',');if(!reachable.has(k)){reachable.add(k);todo.push(q);}}
  plans=planWith((_gateID,p,id)=>reachable.has([...p,id].join(',')));
 }
 const failures=plans.filter(p=>p.blocked);if(failures.length)throw Error('Gate approach blocked: '+failures.map(p=>p.gateID).join(','));
 const added=new Map(),contacts=new Map();
 for(const p of plans){const id=p.newNavigationID;world.edges.set(id,{id,name:layout.gates.find(g=>g.id===p.gateID).name,kind:'FORECOURT',points:p.centerPath,band:new Set(p.newCells.map(key))});contacts.set(id,p.source);
  for(const q of p.newCells){const k=key(q);if(world.members.has(k))throw Error('Gate apron overwrites existing ground');world.members.set(k,new Set([id]));added.set(k,id);}
  // Retained source cells get an additional state for this one apron, with no
  // new links to other existing edges or held approaches.
  for(const q of p.centerPath){const k=key(q);if(original.has(k))world.members.get(k).add(id);world.edges.get(id).band.add(k);}
  const g=layout.gates.find(g=>g.id===p.gateID);world.doors.set(g.id,{game_id:g.id,lf_id:'Gate',name:g.name,position:p.target,edge:id,held:false,waypoint:true,case_function_preserved:'An open city gate and its public inner approach. The country beyond is outside this patrol map.'});
 }
 const priorNeighbours=world.neighbours,priorTraverse=world.canTraverse;
 world.neighbours=s=>{
  const k=key(s.slice(0,2)),contact=contacts.get(s[2]);let out=[];
  if(contact){for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const q=[s[0]+dx,s[1]+dy];if(world.members.get(key(q))?.has(s[2]))out.push([...q,s[2]]);}if(k===key(contact.position)){out.push([...contact.position,contact.edge]);out.push(...priorNeighbours([...contact.position,contact.edge]));}}
  else{out=priorNeighbours(s);for(const[id,c]of contacts)if(k===key(c.position)&&s[2]===c.edge){out.push([s[0],s[1],id]);for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const q=[s[0]+dx,s[1]+dy];if(world.members.get(key(q))?.has(id))out.push([...q,id]);}}}
  return out.filter(q=>!world.canTraverse||world.canTraverse(s,q));
 };
 const wallRects=layout.walls.map(w=>w.foundationRect),towerRects=layout.gates.flatMap(g=>g.towerRects).map(([x,y,w,h])=>[x,y,w,h]);
 const solidRects=[...wallRects,...towerRects];
 world.canTraverse=(a,b)=>{if(priorTraverse&&!priorTraverse(a,b))return false;if([a,b].every(p=>p[0]>=14&&p[0]<=235&&p[1]>=11&&p[1]<=336))return true;const n=Math.max(1,Math.ceil(distance(a,b)/.12));for(let i=0;i<=n;i++){const q=mix(a,b,i/n);if(footProbeOffsets.some(([x,y])=>solidRects.some(r=>rectHit([q[0]+x,q[1]+y],r))))return false;}return true;};
 const rows=[],images=[];let decoded=0,lightCount=0;
 function add(id,face,p,rect,{kind='wall',lights=[],gate=null}={}){const P=project(p),anchor=[P.x-face.box[0],P.y-face.box[1]];decoded+=face.im.width*face.im.height*4;lightCount+=lights.length;images.push(face.im);lightAnchors[id]=lights;rows.push([id,face.im,p,anchor,1,rect,{sourceAsset:id,sceneryKind:kind,cutawayEligible:true,actorFootCutaway:gate?{width:26,heightFactor:1}:undefined,cityFortification:true}]);}
 // Small independent canvases keep culling, actor occlusion and night bakes bounded.
 let wallIndex=0;
 // Painted wall kit (art/city-walls-v1, 26 Nov 2026): 5-cell straight sections in three designs, an
 // interval tower every few sections and a tower at each corner. Collision stays the layout's walls.
 let kit=null;if(!/[?&]oldwalls=1(&|$)/.test(location.search))try{const kitHalf=true,km=await read('assets/city-walls-v1/manifest.json?v=1'),pieces=new Map(km.sprites.map(s=>[s.id,s])),ims=new Map();const glows=new Map();await Promise.all(km.sprites.map(async s=>{ims.set(s.id,await load('assets/city-walls-v1/'+(kitHalf?'half/':'')+s.file));glows.set(s.id,await load('assets/city-walls-v1/half/glow/'+s.file).catch(()=>null));}));kit={km,pieces,ims,glows};}catch(error){console.warn('Wall kit unavailable; drawing the old walls',error);kit=null;}
 const sideName={top:'north',bottom:'south',left:'west',right:'east'};
 const fittedPieces=new Map();
 function fitStraight(piece,length,axis){
  const key=piece+':'+length;
  if(fittedPieces.has(key))return fittedPieces.get(key);
  const sprite=kit.pieces.get(piece),image=kit.ims.get(piece),scale=kit.km.artworkScale;
  const ratio=length/sprite.length,slope=axis===0?.5:-.5;
  // Compress along the projected wall run. Vertical masonry stays vertical.
  const shear=slope*(ratio-1);
  const top=Math.floor(Math.min(0,shear*image.width));
  const bottom=image.height+Math.ceil(Math.max(0,shear*image.width));
  function transform(source){
   if(!source)return null;
   const target=canvas(image.width*ratio,bottom-top);
   const ctx=target.getContext('2d');
   ctx.setTransform(ratio,shear,0,1,0,-top);
   ctx.drawImage(source,0,0);
   return target;
  }
  const [ax,ay]=sprite.anchor.map(v=>v/scale);
  const fitted={image:transform(image),glow:transform(kit.glows.get(piece)),anchor:[ax*ratio,ay+shear*ax-top]};
  fittedPieces.set(key,fitted);
  return fitted;
 }
 function placeKit(piece,origin,id,length=null,axis=0){
  const s=kit.pieces.get(piece),f=s.footprint.slice(),corner=s.frontCornerCells.slice();
  const fitted=length!==null&&length!==s.length?fitStraight(piece,length,axis):null;
  if(fitted){corner[axis]*=length/s.length;f[axis+2]=length;}
  const p=[origin[0]+corner[0],origin[1]+corner[1]];
  const glow=fitted?fitted.glow:kit.glows.get(piece);
  rows.push([id,fitted?fitted.image:kit.ims.get(piece),p,fitted?fitted.anchor:s.anchor.map(v=>v/kit.km.artworkScale),1,
   [origin[0]+f[0],origin[1]+f[1],f[2],f[3]],{sourceAsset:'city-walls-v1:'+piece,sceneryKind:'wall',cutawayEligible:true,cityFortification:true,...(glow?{nightEmission:glow}:{})}]);
 }
 if(kit){
  for(const wall of layout.walls){
   const side=sideName[wall.side],[a,b]=wall.centerline,axis=a[1]===b[1]?0:1;
   const lo=Math.min(a[axis],b[axis]),hi=Math.max(a[axis],b[axis]),fixed=a[1-axis];
   const sections=[];
   let nominal=0,straights=0;
   while(nominal<hi-lo-.000001){
    const tower=sections.length%5===3 && hi-lo-nominal>=3;
    sections.push(tower);
    nominal+=tower?3:5;
    if(!tower)straights++;
   }
   // Share a short end between adjacent straights. Towers keep their full footprint.
   const excess=nominal-(hi-lo),adjusted=Math.min(straights,Math.ceil(excess));
   const fittedLength=adjusted?5-excess/adjusted:5;
   let u=lo;
   for(const [n,tower] of sections.entries()){
    const length=tower?3:(straights<=adjusted?fittedLength:5);
    if(!tower)straights--;
    const origin=axis===0?[u,fixed]:[fixed,u];
    const piece=side+(tower?'-interval-tower':'-straight-'+(n%3+1));
    placeKit(piece,origin,'fort:wall:'+wallIndex++,tower?null:length,axis);
    u+=length;
   }
  }
  const [x0,y0,x1,y1]=[layout.envelope.bounds[0],layout.envelope.bounds[1],layout.envelope.bounds[2],layout.envelope.bounds[3]];
  for(const [corner,pt] of [['northwest',[x0,y0]],['northeast',[x1,y0]],['southwest',[x0,y1]],['southeast',[x1,y1]]])placeKit(corner+'-corner-tower',pt,'fort:corner:'+corner);
 }
 if(!kit)for(const wall of layout.walls){const length=distance(wall.centerline[0],wall.centerline[1]),parts=Math.ceil(length/5);for(let i=0;i<parts;i++){
  const a=mix(wall.centerline[0],wall.centerline[1],i/parts),b=mix(wall.centerline[0],wall.centerline[1],(i+1)/parts),p=mix(a,b,.5),face=renderCurtain(materials,a,b,{width:wall.foundationWidth,height:126,seed:wallIndex});
  add('fort:wall:'+wallIndex,face,p,face.physicalRect);wallIndex++;
 }}
 for(const[index,g]of layout.gates.entries()){
  const face=renderGate(materials,g,index),r=g.towerRects,x=Math.min(...r.map(q=>q[0])),y=Math.min(...r.map(q=>q[1])),right=Math.max(...r.map(q=>q[0]+q[2])),bottom=Math.max(...r.map(q=>q[1]+q[3]));
  add('fort:'+g.id,face,g.center,[x,y,right-x,bottom-y],{kind:'building',lights:face.lights,gate:g});
 }
 // Source-fitted river piers leave the existing water and all seven bridges intact.
 for(const r of layout.riverInterfaces.filter(r=>r.name)){
  const side=r.sourceCenter?.[0]??r.sourceTerminus?.[0];
  const c=r.sourceCenter||r.center||r.sourceInterface?.center;
  // The manifest's two abutment points are on existing water edges, never a deck.
  const ends=r.interface.map((p,i)=>[p[0]-(r.outwardNormal[0]||0),p[1]+(i?-1.5:1.5)]);
  for(const [i,p]of ends.entries()){const a=[p[0],p[1]-1],b=[p[0],p[1]+1],face=projectFace(stone,a,b,58);add('fort:'+r.id+':pier'+i,face,p,[p[0]-.5,p[1]-1,1,2],{lights:[face.map(stone.width*.5,stone.height*.25).concat(face.map(stone.width*.5,stone.height))]});}
 }
 const created=addSprites(rows);objects.push(...created.filter(o=>!objects.includes(o)));
 const changedOriginal=[...original].filter(([k,ids])=>![...ids].every(id=>world.members.get(k)?.has(id)));
 if(changedOriginal.length||sourceDoors.some(id=>!world.doors.has(id)))throw Error('Fortification changed a retained source state');
 const groundPaths=plans.map(p=>p.polygon),groundPatterns=new WeakMap();
 return {layout,plans,objects:created,drawGround(g){g.save();g.transform(28,14,-28,14,0,0);for(const poly of groundPaths){g.beginPath();g.moveTo(...poly[0]);for(const p of poly.slice(1))g.lineTo(...p);g.closePath();let pattern=groundPatterns.get(g);if(!pattern){pattern=g.createPattern(cobble,'repeat');pattern.setTransform(new DOMMatrix().scale(4.8/cobble.width,4.8/cobble.height));groundPatterns.set(g,pattern);}g.fillStyle=pattern;g.fill();g.strokeStyle='#61523b55';g.lineWidth=.12;g.stroke();}g.restore();},report:()=>({id:layout.schema,landGates:plans.length,riverGates:2,cutBypassNamed:false,wallRuns:layout.walls.length,wallPieces:wallIndex,addedPublicCells:added.size,retainedOriginalCells:original.size,removedOriginalCells:changedOriginal.length,gateApproaches:plans.map(p=>({id:p.gateID,position:p.target,edge:p.newNavigationID,source:p.source})),verifiedReceiverCache:usedVerifiedReceivers,geometry:"measured solid volumes; 0.9cell walls,2.75cell tower depth,6cell vaulted passage",sourceCanvasMiB:decoded/1048576,declaredLights:lightCount,riverWaterChanged:false,heldLinksOpened:false}),dispose(){for(const im of images)im.width=im.height=1;}};
}
