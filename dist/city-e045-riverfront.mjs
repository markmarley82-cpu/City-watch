// Original unnamed visiting merchant fleet on existing water; existing public quay only.
// No boarding, new dry ground, solid, entrance, lore identity or route permission.
import {project} from './city-core.mjs?v=p21-b407-s039-reuse';
export const FLEET=Object.freeze({
 'original-cargo-coaster':{file:'cargo-coaster.webp',size:[720,360],anchor:[.5,.844]},
 'original-work-skiff':{file:'work-skiff.webp',size:[420,210],anchor:[.5,.91]},
 'klatchian-dhow':{file:'klatchian-dhow.webp',size:[640,320],anchor:[.5,.94]},
 'klatchian-trader':{file:'klatchian-trader.webp',size:[480,240],anchor:[.5,.94]},
 'freight-barge':{file:'freight-barge.webp',size:[560,280],anchor:[.5,.94]},
 'merchant-cog':{file:'merchant-cog.webp',size:[600,300],anchor:[.5,.96]}
});
// Four occupied berths, six original vessels. Freeze the daily arrival manifest
// at scene creation: no timers, mid-patrol swaps, reloads or save mutations.
export const ARRIVALS=Object.freeze([
 ['klatchian-dhow','original-work-skiff','original-cargo-coaster','klatchian-trader'],
 ['merchant-cog','klatchian-trader','klatchian-dhow','freight-barge'],
 ['original-cargo-coaster','freight-barge','merchant-cog','klatchian-trader']
].map(Object.freeze));
export const BERTHS=Object.freeze([
 {p:[56,190.2],width:400,waterHull:[47,184.5,18,9.2],shore:[60,195.4]},
 {p:[72,190.8],width:190,waterHull:[67,187.5,10,6]},
 {p:[49,175],width:360,waterHull:[40,169.5,18,10]},
 {p:[71,176],width:230,waterHull:[65,172,12,7]}
]);
export function selectArrival(rotation){return ARRIVALS[((Math.floor(rotation)%ARRIVALS.length)+ARRIVALS.length)%ARRIVALS.length];}
export const RIVERFRONT=Object.freeze({id:'RIVER-FLEET-474',bounds:[38,168,78,198],quay:[[40,196],[78,196]],waypoint:[60,196]});
export async function createE045Riverfront({world,ground,load,images,rotation=Math.floor(Date.now()/86400000)}){
 const bollard=await load('assets/graphics-p17/shades/sprites/structures/low_rope_bollard.exact.webp');
 const manifest=selectArrival(rotation);
 const vessels=await Promise.all(manifest.map(async(id,index)=>{
  const spec={...FLEET[id],...BERTHS[index],id},[x,y,w,h]=spec.waterHull;
  for(let a=0;a<=1;a+=.125)for(let b=0;b<=1;b+=.125)if(!world.wet([x+a*w,y+b*h])||world.members.has(Math.round(x+a*w)+','+Math.round(y+b*h)))throw Error('Vessel hull must remain on excluded water: '+id);
  const im=await load('assets/e045-riverfront473/'+spec.file),q=project(spec.p),scale=spec.width/im.width,anchor=[im.width*spec.anchor[0],im.height*spec.anchor[1]],box=[q.x-anchor[0]*scale,q.y-anchor[1]*scale,im.width*scale,im.height*scale];return {...spec,im,box,scale,anchor};
 }));
 const moorings=vessels.filter(v=>v.shore).map(v=>({vessel:v.id,source:[v.im.width*.9,v.im.height*.72],shore:v.shore}));
 const legal=p=>world.members.has(Math.round(p[0])+','+Math.round(p[1]))&&ground.clearPoint(p)&&world.waterCollision.pointClear(p,[...(world.members.get(Math.round(p[0])+','+Math.round(p[1]))||[])]);
 // Each small quad is completely on the existing dry receiver, including its
 // edge samples. Never extend paving across the river edge or a held mask.
 const quads=[];
 for(let x=40;x<78;x+=.25){let width=1.6;
  while(width>=.8&&![-width/2,0,width/2].every(h=>[0,.125,.25].every(dx=>legal([x+dx,196+h]))))width-=.2;
  if(width<.79)continue;
  quads.push([[x,196-width/2],[x+.25,196-width/2],[x+.25,196+width/2],[x,196+width/2]]);
 }
 if(quads.length<100)throw Error('Existing quay is not continuously paintable');
 const floor=new Path2D();for(const poly of quads){poly.forEach((p,i)=>i?floor.lineTo(...p):floor.moveTo(...p));floor.closePath();}
 const patterns=new WeakMap();let draws=0;
 function draw(ctx,view){
  // Whole component bounds include the mast, while individual vessels cull tightly.
  ctx.save();
  for(const m of moorings){const v=vessels.find(v=>v.id===m.vessel),p={x:v.box[0]+m.source[0]*v.scale,y:v.box[1]+m.source[1]*v.scale},q=project(m.shore);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle='#40372b';ctx.lineWidth=2.5;ctx.stroke();ctx.strokeStyle='#a58d62';ctx.lineWidth=.8;ctx.stroke();}
  for(const v of vessels){const[x,y,w,h]=v.box;if(view&&(x+w<view[0]||x>view[2]||y+h<view[1]||y>view[3]))continue;ctx.drawImage(v.im,x,y,w,h);}
  ctx.save();ctx.transform(28,14,-28,14,0,0);let material=patterns.get(ctx);if(!material){const im=images['flags-b'];material=ctx.createPattern(im,'repeat');material.setTransform(new DOMMatrix().scale(4.8/im.width,4.8/im.height));patterns.set(ctx,material);}ctx.fillStyle=material;ctx.fill(floor);ctx.globalAlpha=.20;ctx.fillStyle='#5a4931';ctx.fill(floor);ctx.restore();
  // Small mooring posts use the same nonblocking furniture policy as street lamps.
  for(const m of moorings){const q=project(m.shore),scale=18/bollard.height;ctx.drawImage(bollard,q.x-bollard.width*scale/2,q.y-bollard.height*scale,bollard.width*scale,bollard.height*scale);}
  ctx.restore();draws++;
 }
 const p=RIVERFRONT.waypoint,edge=[...(world.members.get(p.join(','))||[])].find(id=>['STREET','YARD','PRECINCT'].includes(world.edges.get(id)?.kind));
 if(!edge||!legal(p))throw Error('River loading quay must have an existing public approach');
 const waypoint={game_id:'waypoint:river-loading-quay',name:'River loading quay',position:p.slice(),edge,held:false,waypoint:true,case_function_preserved:'Original unnamed mooring and cargo-handling frontage. Existing public ground; the boats cannot be boarded.'};
 return {draw,revealGround:revealQuayGround,vessels,quads,waypoint,legalPoint:legal,report:()=>({id:RIVERFRONT.id,rotation:((Math.floor(rotation)%ARRIVALS.length)+ARRIVALS.length)%ARRIVALS.length,poolSize:Object.keys(FLEET).length,arrivalManifest:manifest.slice(),swapsDuringPatrol:0,vessels:vessels.map(({id,p,waterHull})=>({id,p,waterHull})),quayQuads:quads.length,draws,newBuildings:0,newRoutes:0,newDryGround:0,newSolids:0,boarding:false,originalWaterAndSavesRetained:true,creativeAcceptance:false})};
}

// Keep the admitted quay floor visible through painted overhangs. Restrict the
// opening to the actor and these exact shore limits; the rest of each house stays opaque.
export function revealQuayGround({world,ground,footProbes,player,objects,alphaAt,masks,height=60}){
 if(player[0]<40||player[0]>78||player[1]<195||player[1]>197.25||!footProbes.every(([dx,dy])=>{const p=[player[0]+dx,player[1]+dy,player[2]];return world.members.get(Math.round(p[0])+','+Math.round(p[1]))?.has(p[2])&&ground.clearPoint(p)&&world.waterCollision.pointClear(p,[p[2]]);}))return [];
 const q=project(player),samples=[-7,0,7].map(dx=>({x:q.x+dx,y:q.y})),cover=objects.filter(o=>o.im&&o.rect&&!o.bridgePart&&!['street-lamp','ground-contact','street-furniture'].includes(o.sceneryKind)&&samples.some(p=>alphaAt(o,p)>.02));
 for(const o of cover){const own=masks.get(o.id)||[],end=project([o.rect[0]+o.rect[2]-.5,o.rect[1]+o.rect[3]-.5]).y+10;own.push({x:q.x,y:q.y-height*.25,rx:31,ry:Math.max(36,height*.7),toY:Math.max(q.y,Math.min(q.y+220,end)),opacity:.04,groundOnly:true});masks.set(o.id,own);}
 return cover.map(o=>o.id);
}
