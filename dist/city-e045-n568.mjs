import {activateN568Contact} from './city-e045-n568-contact.mjs?v=p21-b407-s039-reuse';
// Original layered house at the declared E045 frontage; exterior interaction only.
export async function createN568Layered({load,createCanvas,addSprites,lightAnchors}){
 const manifest=await load('manifest.json',true);
 const parts=await Promise.all(manifest.parts.map(name=>load(name)));
 for(const image of parts)if(image.width!==330||image.height!==330)throw Error('N568 source registration changed');
 const full=createCanvas();full.width=full.height=330;
 const g=full.getContext('2d');for(const image of parts)g.drawImage(image,0,0);
 const id='E045-N568-ORIGINAL';lightAnchors[id]=manifest.windows;
 const [object]=addSprites([[id,full,manifest.worldAnchor,manifest.anchor,1,manifest.rect,{sceneryKind:'building',sourceAsset:id}]]);
 object.actorFootCutaway=Object.freeze({width:48,centerHeight:.25,heightFactor:1.15,groundOnly:true});
 // Keep the authored walls beside the walking opening. The roof needs the
 // wider sight window, but applying that width to the wall erases its frontage.
 const body=createCanvas();body.width=body.height=330;
 const bg=body.getContext('2d');
 parts.forEach((image,i)=>{if(manifest.parts[i]!=='roof-foreground.png')bg.drawImage(image,0,0);});
 const roof=parts[manifest.parts.indexOf('roof-foreground.png')];
 object.cutawayLayers=Object.freeze([
  Object.freeze({...object,id:id+':body',im:body,cutawayRadius:24,cutawayFoundationY:object.bounds[1]+manifest.anchor[1]}),
  Object.freeze({...object,id:id+':roof',im:roof,sceneryKind:'roof',lightingExcluded:true})
 ]);
 return Object.freeze({object,manifest,full,ingress:false,exteriorContactCandidate:manifest.door,roofHiddenEnabled:false,activateContact:activateN568Contact});
}

// Use the existing feathered compositor to reveal the actual painted doorway
// through retained foreground images only while at its proposed approach.
export function applyN568DoorReveal({receiver,player,objects,project,alphaAt,inFront,masks}){
 if(!receiver||Math.hypot(player[0]-56,player[1]-203)>1.05)return [];
 const door=receiver.manifest.door,q=project(door.contact),h=door.height;
 const samples=[0,.25,.5,.75,1].flatMap(t=>[-7,0,7].map(dx=>({x:q.x+dx,y:q.y-h*t})));
 const cover=objects.filter(o=>o.im&&o.id!==receiver.object.id&&!inFront(door.contact,o)&&samples.some(p=>alphaAt(o,p)>.02));
 if(!cover.length)return [];
 const opacity=1-Math.pow(.92,1/cover.length);
 const mask={x:q.x,y:q.y-h*.5,rx:22,ry:Math.max(40,h*.67),opacity};
 for(const o of cover){const own=masks.get(o.id)||[];own.push({...mask});masks.set(o.id,own);}
 return cover.map(o=>({id:o.id,mask:{...mask}}));
}

const COURT_FOREGROUND=new Set(['e045-cooper-workshop','parcel569:dwelling','parcel570:dwelling','parcel591:dwelling']);

// A legal street foot must reveal ground when a painted overhang extends beyond
// its solid footprint. Keep this repair inside the rebuilt E045 block.
export function applyE045GroundReveal({world,ground,footProbes,player,objects,project,alphaAt,masks,height=60}){
 if(player[2]!=='E045'||player[0]<34||player[0]>69||player[1]<195||player[1]>225)return [];
 if(!footProbes.every(([dx,dy])=>{const q=[player[0]+dx,player[1]+dy,player[2]];return world.members.get(Math.round(q[0])+','+Math.round(q[1]))?.has(q[2])&&ground.clearPoint(q)&&world.waterCollision.pointClear(q,[q[2]]);} ))return [];
 const foot=project(player),feet=[-6,0,6].map(dx=>({x:foot.x+dx,y:foot.y}));
 const cover=objects.filter(o=>o.im&&o.sceneryKind==='building'&&feet.some(p=>alphaAt(o,p)>.02));
 const mask={x:foot.x,y:foot.y-height*.25,rx:48,ry:Math.max(30,height*1.15),opacity:.04};
 for(const o of cover){let own=masks.get(o.id)||[];
  // Continue the legal court opening to the foreground foundation rather than
  // leaving a roof/front-wall shelf below the feet. Limit the extension to
  // the nearby walking view: a deep foreground building must keep its lower facade.
  const collar=Math.max(0,Math.min(1,player[0]-40,54-player[0],player[1]-201,205-player[1]));
  if(collar&&COURT_FOREGROUND.has(o.id)&&o.rect?.length===4&&o.rect.every(Number.isFinite)){
   const strength=collar*collar*(3-2*collar),opacity=1-(1-mask.opacity)*strength;
   const end=Math.min(foot.y+height*.9,project([o.rect[0]+o.rect[2],o.rect[1]+o.rect[3]]).y+12);
   if(end>mask.y){
    // At full strength combine only this actor's existing structural ellipse;
    // companion and other-owner openings stay independent.
    const local=m=>m.x===mask.x&&m.y>=foot.y-height&&m.y<=mask.y&&m.rx<=54&&m.ry<=72&&!m.toY;
    const prior=own.filter(local),rx=Math.max(mask.rx,...prior.map(m=>m.rx)),ry=Math.max(mask.ry,...prior.map(m=>m.ry));
    if(collar===1)own=own.filter(m=>!local(m));else own.push({...mask});
    own.push({...mask,rx,ry,toY:end,opacity});
   }else own.push({...mask});
  }else own.push({...mask});
  masks.set(o.id,own);
 }
 // The existing west entrance turns from x=43 into y=203. Reveal the
 // next flag only if the full foot and swept step both fit on public ground.
 const edge=Math.min(player[0]-41.75,46.75-player[0],player[1]-201.75,207.25-player[1]);
 if(edge>0){
  const blend=Math.min(1,edge/.7);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const next=[player[0]+dx*.7,player[1]+dy*.7,'E045'];
   if(!footProbes.every(([x,y])=>{
    const q=[next[0]+x,next[1]+y,'E045'];
    return world.members.get(Math.round(q[0])+','+Math.round(q[1]))?.has('E045')&&ground.clearPoint(q)&&world.waterCollision.pointClear(q,['E045']);
   })||!world.canTraverse?.(player,next))continue;
   const q=project(next);
   for(const o of objects){
    if(!COURT_FOREGROUND.has(o.id)||!o.im||alphaAt(o,q)<=.02)continue;
    const own=masks.get(o.id)||[];
    own.push({x:q.x,y:q.y,rx:23,ry:14,opacity:1-.78*blend,groundOnly:true});
    masks.set(o.id,own);
   }
  }
 }
 return cover.map(o=>o.id);
}
