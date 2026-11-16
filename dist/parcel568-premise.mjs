// Original unnamed premise; existing game parcel, not a canonical address.
export const PARCEL568=Object.freeze({"id":"PARCEL568-001","sourceParcel":568,"oldRenderId":"roof:480","rect":[49.409,198.297,2.66,3.353],"p":[51.56900000000001,201.15],"anchor":[145,400],"dimensions":[280,420],"actorHeight":60,"visualDoorHeight":67.32000000000001,"sourceExportControlErrorPixels":0,"exactFoundationFit":false,"manualFoundationUncertaintySourcePixels":6,"rearFoundationInferred":true,"retainedWallLantern":true,"wallLanternAnchor":[87.21700000000001,308.574,84.436,382.178],"originalRect":[54.55799999999999,199.702,2.66,3.353]});
export async function createParcel568Premise({load,addSprites,lightAnchors}){
 const im=await load('assets/parcel568-premise/dwelling.webp');
 if((im.cwSourceWidth||im.width)!==PARCEL568.dimensions[0]||(im.cwSourceHeight||im.height)!==PARCEL568.dimensions[1])throw Error('Parcel568 source dimensions changed');
 const key='PARCEL568-001:dwelling';
 // Reviewed centres of the actual painted windows; source daylight stays unlit.
 lightAnchors[key]=[[102.56200000000001, 253.29900000000004], [186.05200000000002, 257.754], [87.21700000000001, 308.574, 84.436, 382.178]];
 const [o]=addSprites([['parcel568:dwelling',im,PARCEL568.p,PARCEL568.anchor,1,PARCEL568.rect,{sceneryKind:'building',sourceAsset:key,sourceParcel:568}]]);
 return Object.freeze({...PARCEL568,bounds:[o.bounds[0],o.bounds[1],o.bounds[0]+o.bounds[2],o.bounds[1]+o.bounds[3]],replaces:r=>r?.length===4&&r.every((v,i)=>Math.abs(v-PARCEL568.originalRect[i])<1e-7),report:()=>({...PARCEL568,ready:true,uniqueBuildingCount:1,artStretched:false,newNavigation:false,newInteractiveDoors:false,creativeAcceptance:false})});
}
