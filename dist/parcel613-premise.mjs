// Original unnamed premise; existing game parcel, not a canonical address.
export const PARCEL613=Object.freeze({"id":"PARCEL613-001","sourceParcel":613,"oldRenderId":"roof:516","rect":[42.779,197.606,3.886,4.044],"p":[46.16500000000001,201.14999999999998],"anchor":[160,440],"dimensions":[320,460],"actorHeight":60,"visualDoorHeight":65.8,"sourceExportControlErrorPixels":0,"exactFoundationFit":false,"manualFoundationUncertaintySourcePixels":6,"rearFoundationInferred":true,"originalRect":[42.77899999999999,198.728,3.886,4.044]});
export async function createParcel613Premise({load,addSprites,lightAnchors}){
 const im=await load('assets/parcel613-premise/dwelling.webp');
 if((im.cwSourceWidth||im.width)!==PARCEL613.dimensions[0]||(im.cwSourceHeight||im.height)!==PARCEL613.dimensions[1])throw Error('Parcel613 source dimensions changed');
 const key='PARCEL613-001:dwelling';
 // Reviewed centres of the actual painted windows; source daylight stays unlit.
 lightAnchors[key]=[[118.61199999999998, 272.78999999999996], [192.812, 287.19]];
 const [o]=addSprites([['parcel613:dwelling',im,PARCEL613.p,PARCEL613.anchor,1,PARCEL613.rect,{sceneryKind:'building',sourceAsset:key,sourceParcel:613}]]);
 return Object.freeze({...PARCEL613,bounds:[o.bounds[0],o.bounds[1],o.bounds[0]+o.bounds[2],o.bounds[1]+o.bounds[3]],replaces:r=>r?.length===4&&r.every((v,i)=>Math.abs(v-PARCEL613.originalRect[i])<1e-7),report:()=>({...PARCEL613,ready:true,uniqueBuildingCount:1,artStretched:false,newNavigation:false,newInteractiveDoors:false,creativeAcceptance:false})});
}
