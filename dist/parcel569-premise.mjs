// Original unnamed premise; existing game parcel, not a canonical address.
export const PARCEL569=Object.freeze({"id":"PARCEL569-001","sourceParcel":569,"oldRenderId":"roof:481","rect":[44.5,204.5,3.761,4.566],"p":[47.761,208.566],"anchor":[150,440],"dimensions":[320,460],"actorHeight":60,"visualDoorHeight":70.14349999999999,"sourceExportControlErrorPixels":0,"exactFoundationFit":false,"manualFoundationUncertaintySourcePixels":6,"rearFoundationInferred":true,"retainedWallLantern":true,"wallLanternAnchors":[[70.6765,322.71275,67.82,417.25],[243.2745,327.00725,235.82,417.25]],"doorScaleEngineeringRange":[65,71],"originalRect":[55.019,204.279,3.761,4.566]});
export async function createParcel569Premise({load,addSprites,lightAnchors}){
 const im=await load('assets/parcel569-premise/dwelling.webp');
 if((im.cwSourceWidth||im.width)!==PARCEL569.dimensions[0]||(im.cwSourceHeight||im.height)!==PARCEL569.dimensions[1])throw Error('Parcel569 source dimensions changed');
 const key='PARCEL569-001:dwelling';
 // Reviewed centres of the actual painted windows; source daylight stays unlit.
 lightAnchors[key]=[[96.6071, 285.1461], [206.5872, 286.06635], [82.61930000000001, 354.5125], [192.82434999999998, 360.66795], [70.6765, 322.71275, 67.82, 417.25], [243.2745, 327.00725, 235.82, 417.25]];
 const [o]=addSprites([['parcel569:dwelling',im,PARCEL569.p,PARCEL569.anchor,1,PARCEL569.rect,{sceneryKind:'building',sourceAsset:key,sourceParcel:569}]]);
 return Object.freeze({...PARCEL569,bounds:[o.bounds[0],o.bounds[1],o.bounds[0]+o.bounds[2],o.bounds[1]+o.bounds[3]],replaces:r=>r?.length===4&&r.every((v,i)=>Math.abs(v-PARCEL569.originalRect[i])<1e-7),report:()=>({...PARCEL569,ready:true,uniqueBuildingCount:1,artStretched:false,newNavigation:false,newInteractiveDoors:false,creativeAcceptance:false})});
}
