/* Reproducible registration and lighting for the enlarged tavern. */
const fs=require('node:fs'),crypto=require('node:crypto'),sharp=require('sharp');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,v)=>{const compact=p.endsWith('city-design.json')||p.includes('shades-streets-v1/manifest.json'),indent=p.endsWith('receivers.json')?2:1;fs.writeFileSync(p,JSON.stringify(v,null,compact?0:indent)+(p.includes('shades-streets-v1/manifest.json')?'':'\n'));};
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 const base='dist/assets/mended-drum-large-v1/',registration=read('art-review/mended-drum-large-v1/game-registration.json');
 fs.mkdirSync(base,{recursive:true});fs.copyFileSync('art-review/mended-drum-large-v1/drum-day-2x.webp',base+'drum.webp');
 // Tight glazing selections in the registered master; lattice remains unlit.
 const quads=[[[220,518],[278,547],[278,607],[220,578]],[[547,659],[605,688],[605,748],[547,719]],[[717,709],[773,681],[773,746],[717,774]],[[819,657],[873,630],[873,695],[819,722]],[[912,610],[962,585],[962,650],[912,675]],[[223,391],[254,407],[254,449],[223,433]],[[348,454],[380,470],[380,512],[348,496]],[[583,544],[614,560],[614,603],[583,587]],[[752,559],[784,543],[784,585],[752,601]],[[888,489],[922,472],[922,513],[888,530]],[[1027,419],[1059,403],[1059,444],[1027,460]],[[222,315],[252,330],[252,358],[222,343]],[[344,371],[374,386],[374,415],[344,400]],[[783,485],[813,470],[813,501],[783,516]],[[901,426],[931,411],[931,442],[901,457]],[[1037,357],[1067,342],[1067,374],[1037,389]]];
 const inside=(x,y,q)=>{let yes=false;for(let i=0,j=q.length-1;i<q.length;j=i++){const a=q[i],b=q[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 const {data,info}=await sharp(base+'drum.webp').ensureAlpha().raw().toBuffer({resolveWithObject:true}),em=Buffer.alloc(data.length);
 let emissionPixels=0;
 for(const q of quads){const xs=q.map(p=>p[0]),ys=q.map(p=>p[1]);for(let y=Math.min(...ys);y<=Math.max(...ys);y++)for(let x=Math.min(...xs);x<=Math.max(...xs);x++){
  if(!inside(x+.5,y+.5,q))continue;const i=(y*info.width+x)*4,[r,g,b,a]=data.subarray(i,i+4);
  if(a>220&&r>170&&g>85&&g<230&&b<140&&r>g*1.12){em[i]=255;em[i+1]=207;em[i+2]=120;em[i+3]=Math.min(a,210);emissionPixels++;}
 }}
 await sharp(em,{raw:{width:info.width,height:info.height,channels:4}}).webp({lossless:true}).toFile(base+'drum-emission.webp');
 const manifestPath='dist/assets/landmark-exteriors-v3/manifest.json',manifest=read(manifestPath),row=manifest.instances.find(r=>r.landmarkID==='drum');
 Object.assign(row,{file:'../mended-drum-large-v1/drum.webp',dimensions:registration.dimensions,rect:[97,240,8,9],p:[104.5,248.5],anchor:registration.anchor,scale:.5,renderedWidth:643,estimatedDoorHeight:70,sha256:digest(base+'drum.webp'),source:'art/mended-drum-large-v1 registered 2x export',sourceScale:1,windowAnchors:quads.map(q=>{const x=q.reduce((s,p)=>s+p[0],0)/4,y=q.reduce((s,p)=>s+p[1],0)/4;return[x,y,x,registration.foundation.corner[1]-.5*Math.abs(x-registration.foundation.corner[0])];}),emission:{file:'../mended-drum-large-v1/drum-emission.webp',sha256:digest(base+'drum-emission.webp')}});
 write(manifestPath,manifest);
 const designPath='dist/assets/city-v07/city-design.json',design=read(designPath),drum=design.landmarks.find(l=>l.game_id==='drum');
 Object.assign(drum,{footprint_xywh:[240,120,9,8],engine_footprint_polygon:[[104,240],[104,249],[96,249],[96,240]],engine_approach_xy:[99,250],approach_xy:[250,125],facing:'E',placement_status:'Larger registered tavern fitted to engine rect [97,240,8,9]; south-front entrance',ingress_status:'Engine door and connected forecourt',exterior_registration:'assets/mended-drum-large-v1/registration.json'});
 drum.exterior_connector={parent:'E064',contact:[100,258],cells:[[99,250],...Array.from({length:9},(_,i)=>[100,250+i])]};
 write(designPath,design);
 const casesPath='dist/cases/city-cases.json',cases=read(casesPath);cases.places.drum.at=[99,250,'APRON:drum'];write(casesPath,cases);
 const shadesPath='dist/assets/shades-streets-v1/manifest.json',shades=read(shadesPath),annex=shades.instances.find(i=>i.id==='SHADES-006:plaster-yard-return');
 // The unnamed yard-return extension is replaced by the larger tavern. Its parent house remains.
 shades.instances=shades.instances.filter(i=>i.id!=='SHADES-006:plaster-yard-return');
 const bow=shades.instances.find(i=>i.id==='SHADES-005:brick-bow-home');
 if(!bow.drumRefit){const old=bow.support_aabb.slice();bow.p[1]+=.3;bow.rect[1]+=.3;bow.support_aabb[1]+=.3;bow.drumRefit={dy:.3,reason:'Clear expanded Drum foundation'};const r=shades.infill_rects.find(r=>r.every((n,i)=>Math.abs(n-old[i])<1e-6));if(r)r[1]+=.3;}
 write(shadesPath,shades);
 const receivers='dist/assets/mate-street304/receivers.json';write(receivers,read(receivers).filter(r=>r.id!=='MATE-GAP-D2-1'));
 const newBuildingsPath='dist/assets/new-buildings-v1/manifest.json',newBuildings=read(newBuildingsPath),warehouse=newBuildings.buildings.find(b=>b.name==='bonded-warehouse');
 if(!warehouse.drumRefit){warehouse.rect[1]+=1;warehouse.p[1]+=1;warehouse.drumRefit={dy:1,reason:'Clear the enlarged tavern foundation and its front steps'};}
 write(newBuildingsPath,newBuildings);
 write(base+'registration.json',{...registration,rect:row.rect,p:row.p,entrance:[99,250],streetCentrelineChanged:false,adjoiningHouseShift:[0,.3],warehouseShift:[0,1],replacedUnnamedInfill:['SHADES-006:plaster-yard-return','MATE-GAP-D2-1'],emissionPixels});
 console.log(JSON.stringify({rect:row.rect,door:drum.engine_approach_xy,emissionPixels,sourceSize:registration.dimensions}));
})().catch(e=>{console.error(e);process.exitCode=1;});
