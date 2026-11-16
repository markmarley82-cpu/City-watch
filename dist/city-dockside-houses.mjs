// Three separately authored key-side premises; retained footprints and ground only.
export async function createDocksideHouses({read,load,addSprites,lightAnchors}){
 const base='assets/dockside-002/',data=await read(base+'manifest.json'),rows=data.buildings;
 if(data.id!=='DOCKSIDE-002'||rows.length!==3||new Set(rows.map(b=>b.id)).size!==3||new Set(rows.map(b=>b.file)).size!==3||new Set(rows.map(b=>b.sha256)).size!==3||rows.some(b=>b.mirror||b.recolour||b.scale!==1||!b.uniquePremise))throw Error('Dockside no-repeat contract violated');
 const prepared=await Promise.all(rows.map(async b=>{const im=await load(base+b.file);if((im.cwSourceWidth||im.width)!==b.dimensions[0]||(im.cwSourceHeight||im.height)!==b.dimensions[1])throw Error('Dockside painting dimensions changed: '+b.id);return{b,im};}));
 const objects=addSprites(prepared.map(({b,im})=>['dockside:'+b.id,im,b.p,b.anchor,1,b.rect,{sceneryKind:'building',sourceAsset:'DOCKSIDE-002:'+b.id,sourceParcel:b.sourceParcel,uniquePremise:true,cutawayEligible:true}]));
 for(const {b}of prepared)if(b.windowCentres?.length)lightAnchors['dockside:'+b.id]=b.windowCentres;
 return Object.freeze({data,objects,replaces:r=>rows.some(b=>b.rect.every((v,i)=>Math.abs(v-r[i])<1e-6)),report:()=>({id:data.id,ready:true,uniquePremises:3,retiredParcels:rows.map(b=>b.sourceParcel),retiredRenderIds:rows.map(b=>b.renderId),sources:rows.map(b=>({id:b.id,sha256:b.sha256,rect:b.rect})),duplicateSources:0,mirroredPlacements:0,recolours:0,buildingsMoved:0,navigationChanged:false,newInteractiveDoors:0,creativeAcceptance:false})});
}
