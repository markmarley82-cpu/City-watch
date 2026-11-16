// Four separately painted premises; exact retained parcel collision footprints.
export async function createAnkhNorthHouses({read,load,addSprites,lightAnchors}){
 const base='assets/ankh-north-001/',data=await read(base+'manifest.json');
 if(data.buildings.length!==4||new Set(data.buildings.map(b=>b.id)).size!==4||new Set(data.buildings.map(b=>b.file)).size!==4||new Set(data.buildings.map(b=>b.sha256)).size!==4||data.buildings.some(b=>b.mirror||b.recolour||b.scale!==1))throw Error('Ankh north no-repeat contract violated');
 const prepared=await Promise.all(data.buildings.map(async b=>{const im=await load(base+b.file);if((im.cwSourceWidth||im.width)!==b.dimensions[0]||(im.cwSourceHeight||im.height)!==b.dimensions[1])throw Error('Ankh north painting dimensions changed');return{b,im};}));
 const objects=addSprites(prepared.map(({b,im})=>['ankh-north:'+b.id,im,b.p,b.anchor,1,b.rect,{sceneryKind:'building',sourceAsset:'ANKH-NORTH-001:'+b.id,sourceParcel:b.parcel,uniquePremise:true,cutawayEligible:true}]));
 for(const {b}of prepared)if(b.windowCentres?.length)lightAnchors['ankh-north:'+b.id]=b.windowCentres;
 return Object.freeze({data,objects,replaces:r=>data.buildings.some(b=>b.rect.every((v,i)=>Math.abs(v-r[i])<.00001)),report:()=>({id:data.id,ready:true,uniquePremises:4,retiredParcels:data.buildings.map(b=>b.parcel),sources:data.buildings.map(b=>({id:b.id,sha256:b.sha256,rect:b.rect})),duplicateSources:0,mirroredPlacements:0,recolours:0,buildingsMoved:0,navigationChanged:false,newInteractiveDoors:0,creativeAcceptance:false})});
}
