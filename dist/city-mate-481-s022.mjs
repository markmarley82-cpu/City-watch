// Exact section return. This factory is not activated in city.mjs until intake.
export async function createMate481S022({read,load,addSprites,lightAnchors}){
 const base='assets/mate-481-s022/',data=await read(base+'manifest.json');
 if(data.id!=='MATE-481-S022'||data.buildings.length!==8||['id','file','sha256','sourceSha256'].some(key=>new Set(data.buildings.map(b=>b[key])).size!==8)||data.buildings.some(b=>b.scale!==1||b.mirror||b.recolour))throw Error('S022 unique art contract violated');
 const prepared=await Promise.all(data.buildings.map(async b=>{const [im,nightEmission]=await Promise.all([load(base+b.file,b.dimensions),load(base+b.emissionFile,b.dimensions)]);if((im.cwSourceWidth||im.width)!==b.dimensions[0]||(im.cwSourceHeight||im.height)!==b.dimensions[1])throw Error('S022 dimensions changed');return{b,im,nightEmission};}));
 const objects=addSprites(prepared.map(({b,im,nightEmission})=>['mate-481-s022:'+b.id,im,b.p,b.anchor,1,b.rect,{sceneryKind:'building',sourceAsset:'MATE-481-S022:'+b.id,sourceParcel:b.sourceParcel,uniquePremise:true,cutawayEligible:true,nightEmission,actorFootCutaway:{groundOnly:true,width:48,heightFactor:1.15,centerHeight:.25}}]));
 for(const {b}of prepared)lightAnchors['mate-481-s022:'+b.id]=b.windowCentres;
 return{data,objects,replaces:rect=>data.buildings.some(b=>b.rect.every((v,i)=>Math.abs(v-rect[i])<.00001)),report:()=>({id:data.id,ready:true,uniquePremises:8,retiredCandidates:data.buildings.map(b=>b.retireId),navigationChanged:false,creativeAcceptance:false})};
}


