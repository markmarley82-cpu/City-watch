/* Original district art treatment. Channel geometry and navigation are inputs only. */
import {CORNER_ART} from './river-corner-supports.mjs?v=p21-b407-s039-reuse';
import {project} from './city-core.mjs?v=p21-b407-s039-reuse';
import {compileQuayWalls,wetAt} from './river-quay-walls.mjs?v=p21-b407-s039-reuse';
export const RIVER_REGIONS=Object.freeze([
 {id:'palace-bank',p:[144,190],radius:[31,15],pollution:.15},
 {id:'university-reach',p:[194,185],radius:[34,15],pollution:.27},
 {id:'shades-working-bank',p:[78,184],radius:[32,21],pollution:.92},
 {id:'western-wharves',p:[33,177],radius:[28,25],pollution:1},
 {id:'cut-workshops',p:[60,132],radius:[25,33],pollution:.86},
 {id:'cut-eastern-reach',p:[151,100],radius:[47,15],pollution:.53}
]);
export function riverPollutionAt(p){
 let sum=.5*.18,weight=.18;
 for(const r of RIVER_REGIONS){const d=((p[0]-r.p[0])/r.radius[0])**2+((p[1]-r.p[1])/r.radius[1])**2,w=Math.exp(-d*2);sum+=r.pollution*w;weight+=w;}
 return sum/weight;
}
function random(seed){let n=seed;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
const lerp=(a,b,t)=>a.map((n,i)=>n+(b[i]-n)*t);
export const LITTER_TILE_SIZE=120;
// The plan is one seeded sequence. riverDetailSteps yields between steps (never inside one), so
// the sliced and the all-at-once versions produce the same plan.
function* riverDetailSteps(contract){
 const rng=random(0x414e4b48),walls=compileQuayWalls(contract).walls,wet=p=>wetAt(contract,p),micro=[],patches=[],flow=[],litterFields=[];
 for(const w of walls){
  const length=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]);
  for(let t=.35;t<length;t+=.18+rng()*.3){
   const p=lerp(w.a,w.b,t/length),density=riverPollutionAt(p);
   if(rng()>.05+density*.95)continue;
   const depth=.45+rng()*(1.7+density*4.2),at=p.map((v,i)=>v+w.wetNormal[i]*depth);
   if(wet(at))micro.push({p:at,q:project(at),kind:Math.floor(rng()*4),angle:rng()*Math.PI*2,size:.08+rng()*.38*(.4+density),alpha:.35+rng()*.4});
  }
  yield;
 }
 // Restore readable retained refuse art only in individual soft-edged bank pockets.
 for(const w of walls){const length=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]),angle=Math.atan2(w.b[1]-w.a[1],w.b[0]-w.a[0]);
  for(let t=2.5;t<length;t+=7+rng()*7){const bank=lerp(w.a,w.b,t/length),pollution=riverPollutionAt(bank);if(rng()>pollution*.94)continue;const p=bank.map((n,i)=>n+w.wetNormal[i]*(1.4+rng()*2.4));if(!wet(p))continue;
   const crop=220+Math.floor(rng()*90);litterFields.push({p,q:project(p),rx:3+pollution*3+rng()*1.5,ry:3+pollution*2+rng(),angle:angle+(rng()-.5)*.4,alpha:.12+pollution*.82,crop:[Math.floor(rng()*(512-crop)),Math.floor(rng()*(512-crop)),crop,crop]});
  }
  yield;
 }
 const ps=contract.surfaces.flatMap(s=>s.engine_polygon),bounds=[Math.min(...ps.map(p=>p[0])),Math.min(...ps.map(p=>p[1])),Math.max(...ps.map(p=>p[0])),Math.max(...ps.map(p=>p[1]))];
 for(let i=0;i<10000&&(patches.length<180||flow.length<260);i++){
  if(i%64===63)yield;
  const p=[bounds[0]+rng()*(bounds[2]-bounds[0]),bounds[1]+rng()*(bounds[3]-bounds[1])];if(!wet(p))continue;
  const cut=contract.surfaces.find(s=>s.centreline&&s.engine_polygon.some(q=>Math.hypot(q[0]-p[0],q[1]-p[1])<24));
  let angle=0;if(cut){let d=Infinity;for(let j=1;j<cut.centreline.length;j++){const a=cut.centreline[j-1],b=cut.centreline[j],mid=lerp(a,b,.5),n=Math.hypot(mid[0]-p[0],mid[1]-p[1]);if(n<d){d=n;angle=Math.atan2(b[1]-a[1],b[0]-a[0]);}}}
  if(patches.length<180)patches.push({p,q:project(p),rx:2+rng()*6.5,ry:.7+rng()*2.2,angle,shade:Math.floor(rng()*3),alpha:.035+rng()*.09*riverPollutionAt(p)});
  if(flow.length<260)flow.push({p,q:project(p),angle,length:.6+rng()*2.8,bend:(rng()-.5)*.6,alpha:.045+rng()*.065});
 }
 const bankDistance=p=>Math.min(...walls.map(w=>{const dx=w.b[0]-w.a[0],dy=w.b[1]-w.a[1],t=Math.max(0,Math.min(1,((p[0]-w.a[0])*dx+(p[1]-w.a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-w.a[0]-t*dx,p[1]-w.a[1]-t*dy);}));
 const openWater=patches.filter(f=>riverPollutionAt(f.p)>.7&&bankDistance(f.p)>5&&!contract.crossings.some(b=>Math.abs(f.p[0]-b.anchor[0])<b.width/2+1&&f.p[1]>b.renderWaterInterval[0]&&f.p[1]<b.renderWaterInterval.at(-1)));
 for(const f of openWater.slice(0,16)){const crop=230+Math.floor(rng()*70);litterFields.push({...f,rx:1.6+rng()*1.5,ry:1.4+rng()*1.1,alpha:.35+riverPollutionAt(f.p)*.3,crop:[Math.floor(rng()*(512-crop)),Math.floor(rng()*(512-crop)),crop,crop]});}
 const targets=[['timber-pocket','E007','near',1],['household-catch','E004','far',-1],['working-wharf-catch','E007','far',-1],['rope-catch','E005','far',1],['barrel-catch','E006','near',-1],['rag-pocket','E006','far',1],['retained-timber','E003','far',1],['retained-household','E004','near',1]];
 const snags=[];
 for(const [id,edge,end,side] of targets){
  yield;
  const b=contract.crossings.find(b=>b.edge===edge),interval=b.renderWaterInterval,target=[b.anchor[0]+side*(b.width/2+1.8),end==='near'?interval[0]+3:interval.at(-1)-3];let best=null;
  for(let dx=-3;dx<=3;dx+=.25)for(let dy=-4;dy<=4;dy+=.25){const p=[target[0]+dx,target[1]+dy];if(![-1.25,0,1.25].every(x=>[-1.25,0,1.25].every(y=>wet([p[0]+x,p[1]+y]))))continue;if(Math.abs(p[0]-b.anchor[0])<b.width/2+1.25)continue;if(snags.some(s=>Math.hypot(s.p[0]-p[0],s.p[1]-p[1])<3))continue;const score=Math.hypot(dx,dy);if(!best||score<best.score)best={p,score};}
  if(!best)throw Error('No protected water pocket for '+id);
  snags.push({id,p:best.p,q:project(best.p),edge,end,pollution:riverPollutionAt(best.p)});
 }
 const candidates=[];
 for(const w of walls){yield;const length=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]);for(let t=1.5+rng()*3;t<length;t+=3.5+rng()*5){const bank=lerp(w.a,w.b,t/length),p=bank.map((v,i)=>v+w.wetNormal[i]*(1.4+rng()*2.6));if(![-.6,0,.6].every(x=>[-.6,0,.6].every(y=>wet([p[0]+x,p[1]+y]))))continue;if(snags.some(s=>Math.hypot(s.p[0]-p[0],s.p[1]-p[1])<2))continue;const pollution=riverPollutionAt(p);candidates.push({p,q:project(p),pollution,score:pollution*.8+rng()*.45});}}
 const looseItems=[];
 const choose=list=>{for(const c of list){if(looseItems.length===24)break;if(looseItems.some(s=>Math.hypot(s.p[0]-c.p[0],s.p[1]-c.p[1])<2))continue;looseItems.push({...c,id:'loose-'+String(looseItems.length+1).padStart(2,'0')});}};
 choose(candidates.filter(c=>c.pollution<.4).sort((a,b)=>a.pollution-b.pollution).slice(0,2));choose(openWater.slice(0,6).map(f=>({...f,pollution:riverPollutionAt(f.p),score:1})));choose(candidates.sort((a,b)=>b.score-a.score));if(looseItems.length!==24)throw Error('Insufficient clear water pockets for distinct refuse');
 // Individually authored compositions: one original painting at one fitted location.
 // These are unnamed environmental details, not new premises or navigation.
 const reachSpecs=[
  ['wharf-splinter-drift',[17,187]],['workshop-shavings-eddy',[60,132]],
  ['laundry-rag-catch',[77,187]],['produce-drift',[90,187]],
  ['rope-net-eddy',[40,187]],['pottery-shallows',[150,103]],
  ['straw-grain-snag',[18,158]],['paper-reed-pocket',[190,185]],
  ['leaf-drift',[150,188]],['leather-scrap-catch',[60,147]],
  ['basket-breakage',[70,181]],['driftwood-confluence',[110,105]]
 ];
 const reaches=[];
 for(const [id,target] of reachSpecs){let best=null;
  for(let dx=-16;dx<=16;dx+=.5)for(let dy=-16;dy<=16;dy+=.5){const p=[target[0]+dx,target[1]+dy];
   if(![-4,0,4].every(x=>[-4,0,4].every(y=>wet([p[0]+x,p[1]+y]))))continue;
   if(contract.crossings.some(b=>Math.abs(p[0]-b.anchor[0])<b.width/2+2.2&&p[1]>b.renderWaterInterval[0]-2&&p[1]<b.renderWaterInterval.at(-1)+2))continue;
   if([...snags,...looseItems,...reaches].some(s=>Math.hypot(s.p[0]-p[0],s.p[1]-p[1])<6))continue;
   const bank=bankDistance(p),score=Math.hypot(dx,dy)+Math.abs(bank-3)*.4;
   if(!best||score<best.score)best={p,q:project(p),score};
  }
  if(!best)throw Error('No supported unique river detail location for '+id);
  reaches.push({...best,id,pollution:riverPollutionAt(best.p)});
 }
 // Mark explicitly permits river art reuse when repeats are well separated.
 // Keep each source's appearances at least 30 world units and 1100 projected
 // scene pixels apart, beyond an ordinary phone patrol viewport.
 const repeatCandidates=[];
 for(let i=0;i<12000&&repeatCandidates.length<1800;i++){
  const p=[bounds[0]+rng()*(bounds[2]-bounds[0]),bounds[1]+rng()*(bounds[3]-bounds[1])];
  if(![-1.5,0,1.5].every(x=>[-1.5,0,1.5].every(y=>wet([p[0]+x,p[1]+y]))))continue;
  const pollution=riverPollutionAt(p);
  if(rng()>pollution*.85+.08)continue;
  if(contract.crossings.some(b=>Math.abs(p[0]-b.anchor[0])<b.width/2+2&&p[1]>b.renderWaterInterval[0]-2&&p[1]<b.renderWaterInterval.at(-1)+2))continue;
  repeatCandidates.push({p,q:project(p),pollution,bankDistance:bankDistance(p)});
 }
 for(let pass=1;pass<=5;pass++)for(let i=1;i<=24;i++){
  const assetId='loose-'+String(i).padStart(2,'0');
  const same=looseItems.filter(s=>(s.assetId||s.id)===assetId);
  let best=null;
  for(const c of repeatCandidates){
   if(same.some(s=>Math.hypot(s.p[0]-c.p[0],s.p[1]-c.p[1])<30||Math.hypot(s.q.x-c.q.x,s.q.y-c.q.y)<1100))continue;
   if(looseItems.some(s=>Math.hypot(s.p[0]-c.p[0],s.p[1]-c.p[1])<3.2))continue;
   if([...snags,...reaches].some(s=>Math.hypot(s.p[0]-c.p[0],s.p[1]-c.p[1])<5))continue;
   // Bias working banks while retaining a few scattered channel objects.
   const score=c.pollution*.7-Math.abs(c.bankDistance-(i%4===0?7:2.5))*.065;
   if(!best||score>best.score)best={...c,score};
  }
  if(!best)throw Error('No well-separated river prop placement for '+assetId+' pass '+pass);
  looseItems.push({...best,id:assetId+'-repeat-'+pass,assetId});
 }
 // Broad loose drift fields: larger footprints with visible water between objects.
 const denseSpecs=[
  ['cargo-refuse-raft',[45,178]],['household-refuse-raft',[82,180]],
  ['workshop-refuse-raft',[58,136]],['organic-refuse-raft',[93,188]],
  ['cargo-refuse-raft',[130,185]],['household-refuse-raft',[140,102]],
  ['workshop-refuse-raft',[125,98]],['organic-refuse-raft',[166,100]],
  ['cargo-refuse-raft',[184,100]],['household-refuse-raft',[196,184]],
  ['workshop-refuse-raft',[16,164]],['organic-refuse-raft',[80,104]]
 ];
 // Derive collection sites from actual bank bends, quay returns and bridge mouths.
 const endpointGroups=new Map();
 for(const w of walls)for(const [point,other] of [[w.a,w.b],[w.b,w.a]]){
  const k=point.map(n=>Math.round(n*10000)).join(','),length=Math.hypot(other[0]-point[0],other[1]-point[1]);
  if(!endpointGroups.has(k))endpointGroups.set(k,[]);
  endpointGroups.get(k).push({p:point,n:w.wetNormal,t:[(other[0]-point[0])/length,(other[1]-point[1])/length],wall:w.id});
 }
 const collectionCorners=[];
 for(const [key,group]of endpointGroups){
  if(group.length>1&&group.some(a=>group.some(b=>a.n[0]*b.n[0]+a.n[1]*b.n[1]<.995))){
   const n=group.reduce((a,w)=>[a[0]+w.n[0],a[1]+w.n[1]],[0,0]),length=Math.hypot(...n);
   if(length>.1)collectionCorners.push({id:'bend:'+key,p:group[0].p,n:n.map(v=>v/length),t:group[0].t,type:group[0].wall.startsWith('dry:')?'quay-return':'bank-bend',walls:group.map(w=>w.wall)});
  }
  for(const w of group){const bridge=contract.crossings.find(b=>b.edge!=='E007'&&Math.abs(Math.abs(w.p[0]-b.anchor[0])-(b.width/2+.4))<.1&&w.p[1]>b.renderWaterInterval[0]-1&&w.p[1]<b.renderWaterInterval.at(-1)+1);
   if(bridge)collectionCorners.push({id:'bridge:'+bridge.edge+':'+key,p:w.p,n:w.n,t:w.t,type:'bridge-bank-corner',edge:bridge.edge,walls:[w.wall]});
  }
 }
 const cornerPockets=[];
 for(const corner of collectionCorners)for(let depth=5.5;depth<=9;depth+=.5)for(const along of corner.type==='bridge-bank-corner'?[5.5,7,8.5]:[-2,0,2]){
  const p=corner.p.map((v,i)=>v+corner.n[i]*depth+corner.t[i]*along),q=project(p);
  if(![-5.5,0,5.5].every(x=>[-5.5,0,5.5].every(y=>wet([p[0]+x,p[1]+y]))))continue;
  if(contract.crossings.some(b=>Math.abs(p[0]-b.anchor[0])<b.width/2+3.5&&p[1]>b.renderWaterInterval[0]-2&&p[1]<b.renderWaterInterval.at(-1)+2))continue;
  const offset=Math.hypot(p[0]-corner.p[0],p[1]-corner.p[1]);if(offset>10)continue;
  cornerPockets.push({p,q,corner,offset});
 }
 const denseItems=[];
 for(const [assetId,target] of denseSpecs){let best=null;
  for(const candidate of cornerPockets){const {p,q,corner}=candidate;
   if(denseItems.some(s=>s.collection.id===corner.id||s.assetId===assetId&&Math.hypot(s.q.x-q.x,s.q.y-q.y)<1500))continue;
   if([...snags,...reaches].some(s=>Math.hypot(s.p[0]-p[0],s.p[1]-p[1])<5))continue;
   if(denseItems.some(s=>Math.hypot(s.p[0]-p[0],s.p[1]-p[1])<8))continue;
   const score=Math.hypot(p[0]-target[0],p[1]-target[1])+candidate.offset*.8;
   if(!best||score<best.score)best={p,q,score,collection:corner,cornerDistance:candidate.offset};
  }
  if(!best)throw Error('No protected corner collection for '+assetId);
  const variation=[[-.065,.96],[.045,1.06],[-.035,1.02],[.075,.94],[-.04,1.08],[.06,.98],[-.075,1.03],[.025,.93],[-.05,1.01],[.055,1.04],[-.025,.97],[.07,1.05]][denseItems.length];
  denseItems.push({...best,id:assetId+'-'+denseItems.length,assetId,angle:variation[0],scale:variation[1],pollution:riverPollutionAt(best.p)});
 }
 // Fit new corner fans directly to the wet side of each real bank vertex.
 const coreIds=Object.keys(CORNER_ART),coreOptions=denseItems.map(field=>coreIds.map(assetId=>{
  const corner=field.collection,T=corner.t,N=corner.n;
  for(let offset=1.25;offset<=4;offset+=.25){const p=corner.p.map((v,i)=>v+(T[i]+N[i])*offset);
   if(!CORNER_ART[assetId].every(([u,v])=>wet([p[0]+T[0]*u+N[0]*v,p[1]+T[1]*u+N[1]*v])))continue;
   const q=project(p),t=project(T),n=project(N);
   return {id:'corner-core-'+field.id,assetId,p,q,collection:corner,basis:[T,N],offset,transform:[(t.x-n.x)/56,(t.y-n.y)/56,(t.x+n.x)/28,(t.y+n.y)/28]};
  }return null;
 }));
 const cornerCores=[];
 const order=denseItems.map((_,i)=>i).sort((a,b)=>{
  const near=i=>denseItems.filter(f=>Math.hypot(f.q.x-denseItems[i].q.x,f.q.y-denseItems[i].q.y)<1400).length;
  return near(b)-near(a);
 });
 function assignCorner(index){if(index===order.length)return true;const field=order[index];
  for(const core of coreOptions[field]){if(!core||cornerCores.some(s=>s.assetId===core.assetId&&Math.hypot(s.q.x-core.q.x,s.q.y-core.q.y)<1100))continue;
   cornerCores.push(core);if(assignCorner(index+1))return true;cornerCores.pop();
  }return false;
 }
 if(!assignCorner(0))throw Error('No well-separated corner artwork registration');
 // Thin the small scatter so the broad patches have breathing room.
 const microBaseline=micro.filter((_,i)=>i%2===0);
 for(const [index,item] of microBaseline.entries()){const field=denseItems[index%denseItems.length],corner=field.collection,dx=field.p[0]-corner.p[0],dy=field.p[1]-corner.p[1],length=Math.hypot(dx,dy),dir=[dx/length,dy/length];
  for(let trial=0;trial<30;trial++){
   const depth=1+rng()*9,side=(rng()-.5)*(1+depth*.45),p=[corner.p[0]+dir[0]*depth-dir[1]*side,corner.p[1]+dir[1]*depth+dir[0]*side];if(!wet(p))continue;
   micro.push({...item,p,q:project(p),angle:Math.atan2(dir[1],dir[0])+(rng()-.5)*.8,kind:Math.floor(rng()*4),size:item.size*(.75+rng()*.5),alpha:item.alpha*(1-depth*.035)});break;
  }
 }
 return {id:'CW-RIVER-CHARACTER-v1',regions:RIVER_REGIONS,walls,micro,patches,flow,litterFields,snags,looseItems,reaches,denseItems,cornerCores,collectionCorners,shadows:contract.crossings.map(b=>({edge:b.edge,x:b.anchor[0]+.8,near:b.renderWaterInterval[0]+.5,far:b.renderWaterInterval.at(-1)-.5,width:b.width})),presentationOnly:true,newNavigation:false};
}
const inView=(q,view,pad=260)=>!view||q.x>view[0]-pad&&q.x<view[2]+pad&&q.y>view[1]-pad&&q.y<view[3]+pad;
// The river without its scattered detail: same water, banks and bridge shadows, no litter, ripples,
// snags or loose items. Shown from the start while the full plan is worked out (a few ms).
export function createRiverOutlinePlan(contract){return {id:'CW-RIVER-CHARACTER-v1',regions:RIVER_REGIONS,walls:compileQuayWalls(contract).walls,micro:[],patches:[],flow:[],litterFields:[],snags:[],looseItems:[],reaches:[],denseItems:[],cornerCores:[],collectionCorners:[],shadows:contract.crossings.map(b=>({edge:b.edge,x:b.anchor[0]+.8,near:b.renderWaterInterval[0]+.5,far:b.renderWaterInterval.at(-1)-.5,width:b.width})),presentationOnly:true,newNavigation:false,outline:true};}
export function createRiverDetailPlan(contract){const steps=riverDetailSteps(contract);for(;;){const r=steps.next();if(r.done)return r.value;}}
// Same plan, computed in slices of budgetMS with pause() between them, so walking stays smooth.
export async function createRiverDetailPlanSliced(contract,{budgetMS=6,pause}={}){const steps=riverDetailSteps(contract);let start=performance.now();for(;;){const r=steps.next();if(r.done)return r.value;if(pause&&performance.now()-start>budgetMS){await pause();start=performance.now();}}}
export function createRiverCharacter(contract,plan=createRiverDetailPlan(contract)){
 const patterns=new WeakMap(),tiles=[],litterTiles=new Map();
 function material(ctx,im){
  if(!patterns.has(im)){
   const tile=document.createElement('canvas');tile.width=tile.height=512;const g=tile.getContext('2d');
   for(const [x,y,sx,sy]of[[0,0,1,1],[512,0,-1,1],[0,512,1,-1],[512,512,-1,-1]]){g.save();g.translate(x,y);g.scale(sx,sy);g.drawImage(im,0,0,256,256);g.restore();}
   const p=ctx.createPattern(tile,'repeat');p.setTransform(new DOMMatrix().scale(1/15));patterns.set(im,p);tiles.push(tile);
  }return patterns.get(im);
 }
 function litterTile(field,image){
  if(!litterTiles.has(field)){const c=document.createElement('canvas');c.width=c.height=LITTER_TILE_SIZE;const g=c.getContext('2d'),mid=LITTER_TILE_SIZE/2;g.drawImage(image,...field.crop,0,0,LITTER_TILE_SIZE,LITTER_TILE_SIZE);g.globalCompositeOperation='destination-in';const mask=g.createRadialGradient(mid,mid,8,mid,mid,mid);mask.addColorStop(0,'rgba(0,0,0,1)');mask.addColorStop(.48,'rgba(0,0,0,.92)');mask.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=mask;g.fillRect(0,0,LITTER_TILE_SIZE,LITTER_TILE_SIZE);litterTiles.set(field,c);}return litterTiles.get(field);
 }
 return {plan,draw(ctx,resources,view){
  ctx.save();ctx.transform(28,14,-28,14,0,0);ctx.fillStyle='#55533d';ctx.fillRect(-50,-50,350,350);
  ctx.fillStyle=material(ctx,resources.water);ctx.globalAlpha=.88;ctx.fillRect(-50,-50,350,350);
  ctx.save();ctx.rotate(.29);ctx.translate(19,-27);ctx.scale(.63,.63);ctx.globalAlpha=.22;ctx.fillRect(-600,-600,1200,1200);ctx.restore();ctx.globalAlpha=1;
  for(const r of plan.regions){ctx.save();ctx.translate(...r.p);ctx.scale(...r.radius);const g=ctx.createRadialGradient(0,0,0,0,0,1.35);const colour={'palace-bank':'103,100,74','university-reach':'114,112,80','shades-working-bank':'48,55,31','western-wharves':'63,49,28','cut-workshops':'81,63,32','cut-eastern-reach':'83,77,45'}[r.id];g.addColorStop(0,`rgba(${colour},${r.pollution>.7?.26+r.pollution*.46:.1+r.pollution*.25})`);g.addColorStop(1,'rgba(65,61,39,0)');ctx.fillStyle=g;ctx.fillRect(-1.4,-1.4,2.8,2.8);ctx.restore();}
  for(const p of plan.patches){if(!inView(p.q,view,400))continue;ctx.save();ctx.translate(...p.p);ctx.rotate(p.angle);ctx.scale(p.rx,p.ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);const rgb=['69,60,33','112,101,62','45,54,37'][p.shade];g.addColorStop(0,`rgba(${rgb},${p.alpha})`);g.addColorStop(.45,`rgba(${rgb},${p.alpha*.75})`);g.addColorStop(1,`rgba(${rgb},0)`);ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();}
  if(resources.legacy)for(const f of plan.litterFields){if(!inView(f.q,view,400))continue;ctx.save();ctx.translate(...f.p);ctx.rotate(f.angle);ctx.globalAlpha=f.alpha;ctx.drawImage(litterTile(f,resources.legacy),-f.rx,-f.ry,f.rx*2,f.ry*2);ctx.restore();}
  ctx.lineCap='round';
  for(const w of plan.walls){if(!inView(project(lerp(w.a,w.b,.5)),view,2000))continue;const density=riverPollutionAt(lerp(w.a,w.b,.5));for(const [width,alpha]of[[6,.025],[3.4,.045],[1.6,.065],[.55,.12]]){ctx.strokeStyle=`rgba(35,39,24,${alpha*(.35+density*.8)})`;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(...w.a);ctx.lineTo(...w.b);ctx.stroke();}}
  for(const b of plan.shadows){for(const [extra,alpha]of[[4,.025],[2.2,.05],[1,.075],[0,.12]]){ctx.strokeStyle=`rgba(18,25,21,${alpha})`;ctx.lineWidth=b.width+extra;ctx.beginPath();ctx.moveTo(b.x,b.near);ctx.lineTo(b.x,b.far);ctx.stroke();}}
  for(const f of plan.flow){if(!inView(f.q,view,100))continue;ctx.save();ctx.translate(...f.p);ctx.rotate(f.angle);ctx.strokeStyle=`rgba(170,163,124,${f.alpha})`;ctx.lineWidth=.035;ctx.beginPath();ctx.moveTo(-f.length/2,0);ctx.quadraticCurveTo(0,f.bend,f.length/2,0);ctx.stroke();ctx.restore();}
  for(const d of plan.micro){if(!inView(d.q,view,50))continue;ctx.save();ctx.translate(...d.p);ctx.rotate(d.angle);ctx.globalAlpha=d.alpha;ctx.fillStyle=['#796447','#666551','#49432f','#766851'][d.kind];if(d.kind===0)ctx.fillRect(-d.size,-d.size*.15,d.size*2,d.size*.3);else if(d.kind===1){ctx.beginPath();ctx.moveTo(-d.size,0);ctx.quadraticCurveTo(-d.size*.3,-d.size*.65,d.size*.5,-d.size*.4);ctx.quadraticCurveTo(d.size*.2,0,d.size*.65,d.size*.25);ctx.quadraticCurveTo(0,d.size*.6,-d.size*.2,d.size*.2);ctx.quadraticCurveTo(-d.size*.6,d.size*.4,-d.size,0);ctx.closePath();ctx.fill();}else{ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.05;ctx.beginPath();ctx.moveTo(-d.size,0);ctx.quadraticCurveTo(0,d.size,d.size,0);ctx.stroke();}ctx.restore();}
  ctx.restore();
  for(const item of [...plan.looseItems,...plan.reaches,...plan.denseItems]){if(!inView(item.q,view,100))continue;const a=resources.snags.get(item.assetId||item.id);if(a){if(item.angle||item.scale){ctx.save();ctx.translate(item.q.x,item.q.y);ctx.rotate(item.angle||0);ctx.scale(item.scale||1,item.scale||1);ctx.drawImage(a.image,-a.anchor[0],-a.anchor[1]);ctx.restore();}else ctx.drawImage(a.image,item.q.x-a.anchor[0],item.q.y-a.anchor[1]);}}
  for(const core of plan.cornerCores){if(!inView(core.q,view,240))continue;const a=resources.snags.get(core.assetId);if(a){ctx.save();ctx.translate(core.q.x,core.q.y);ctx.transform(...core.transform,0,0);ctx.drawImage(a.image,-a.anchor[0],-a.anchor[1]);ctx.restore();}}
  for(const s of plan.snags){if(!inView(s.q,view,150))continue;const a=resources.snags.get(s.id);if(a){const scale=1+s.pollution*.5;ctx.drawImage(a.image,s.q.x-a.anchor[0]*scale,s.q.y-a.anchor[1]*scale,a.image.width*scale,a.image.height*scale);}}
 },dispose(){for(const tile of tiles)tile.width=tile.height=1;tiles.length=0;for(const c of litterTiles.values())c.width=c.height=1;litterTiles.clear();},report:()=>({mirrorTextureMiB:tiles.length,readableRefuseFields:plan.litterFields.length,litterTextureMiB:litterTiles.size*LITTER_TILE_SIZE**2*4/1048576,id:plan.id,regions:plan.regions.length,uniqueSnags:plan.snags.length,distinctLooseObjects:24,looseObjectPlacements:plan.looseItems.length,minimumRepeatWorldDistance:30,minimumRepeatScenePixels:1100,uniqueRiverAssemblages:new Set([...plan.reaches.map(s=>s.id),...plan.denseItems.map(s=>s.assetId)]).size,largeRefusePlacements:plan.reaches.length+plan.denseItems.length,newDenseRafts:plan.denseItems.length,cornerCollections:plan.denseItems.filter(s=>s.collection).length,registeredCornerFans:plan.cornerCores.length,smallRefuse:plan.micro.length,siltFields:plan.patches.length,bridgeShadows:plan.shadows.length,softRegionalTransitions:true,opaqueWater:true,newNavigation:false})};
}
