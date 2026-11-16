// Exact section return. This factory is not activated in city.mjs until intake.
export async function createMate481S007({read,load,addSprites,lightAnchors}){
 const base='assets/mate-481-s007/',data=await read(base+'manifest.json');
 if(data.id!=='MATE-481-S007'||data.buildings.length!==25||['id','file','sha256','sourceSha256'].some(key=>new Set(data.buildings.map(b=>b[key])).size!==25)||data.buildings.some(b=>b.scale!==1||b.mirror||b.recolour))throw Error('S007 unique art contract violated');
 const prepared=await Promise.all(data.buildings.map(async b=>{const [im,nightEmission]=await Promise.all([load(base+b.file,b.dimensions),load(base+b.emissionFile,b.dimensions)]);if((im.cwSourceWidth||im.width)!==b.dimensions[0]||(im.cwSourceHeight||im.height)!==b.dimensions[1])throw Error('S007 dimensions changed');return{b,im,nightEmission};}));
 const objects=addSprites(prepared.map(({b,im,nightEmission})=>['mate-481-s007:'+b.id,im,b.p,b.anchor,1,b.rect,{sceneryKind:'building',sourceAsset:'MATE-481-S007:'+b.id,sourceParcel:b.sourceParcel,uniquePremise:true,cutawayEligible:true,nightEmission,actorFootCutaway:{groundOnly:true,width:48,heightFactor:1.15,centerHeight:.25}}]));
 for(const {b}of prepared)lightAnchors['mate-481-s007:'+b.id]=b.windowCentres;
 return{data,objects,replaces:rect=>data.buildings.some(b=>b.rect.every((v,i)=>Math.abs(v-rect[i])<.00001)),report:()=>({id:data.id,ready:true,uniquePremises:25,retiredCandidates:data.buildings.map(b=>b.retireId),navigationChanged:false,creativeAcceptance:false})};
}


// Parent integration: scoped legal-ground reveal for these25 originals only.
export function applyS007GroundReveal({world,ground,footProbes,player,objects,project,alphaAt,masks,height=60}){
 if(player[2]!=='E008'||player[0]<167||player[0]>213||player[1]<288||player[1]>327)return [];
 if(!footProbes.every(([dx,dy])=>{const p=[player[0]+dx,player[1]+dy,player[2]];return world.members.get(Math.round(p[0])+','+Math.round(p[1]))?.has(p[2])&&ground.clearPoint(p)&&world.waterCollision.pointClear(p,[p[2]]);}))return [];
 const foot=project(player),samples=[-6,0,6].map(dx=>({x:foot.x+dx,y:foot.y}));
 const cover=objects.filter(o=>o.id.startsWith('mate-481-s007:')&&o.im&&samples.some(p=>alphaAt(o,p)>.02));
 for(const o of cover){const prior=(masks.get(o.id)||[]).filter(m=>!(m.x===foot.x&&m.y>=foot.y-height&&m.y<=foot.y-height*.2&&m.rx<=54&&m.ry<=72&&!m.toY)),mask={x:foot.x,y:foot.y-height*.25,rx:38,ry:Math.max(30,height*1.05),opacity:.04,groundOnly:true};
  mask.toY=Math.max(mask.y,Math.min(foot.y+260,project([o.rect[0]+o.rect[2]-.5,o.rect[1]+o.rect[3]-.5]).y+10));
  masks.set(o.id,[...prior,mask]);
 }
 return cover.map(o=>o.id);
}
