// Original unnamed premise; existing game parcel, not a canonical address.
export const PARCEL591=Object.freeze({"id":"PARCEL591-001","sourceParcel":591,"oldRenderId":"roof:498","rect":[51.998,204.5,4.273,2.873],"p":[55.771,206.873],"anchor":[150,400],"dimensions":[280,420],"actorHeight":60,"visualDoorHeight":65.849,"sourceExportControlErrorPixels":5.859285502108464e-14,"exactFoundationFit":false,"manualFoundationUncertaintySourcePixels":6,"rearFoundationInferred":true,"originalRect":[47.047,205.465,4.273,2.873]});
export async function createParcel591Premise({load,addSprites,lightAnchors}){
 const im=await load('assets/parcel591-premise/dwelling.webp');
 if((im.cwSourceWidth||im.width)!==PARCEL591.dimensions[0]||(im.cwSourceHeight||im.height)!==PARCEL591.dimensions[1])throw Error('Parcel591 source dimensions changed');
 const key='PARCEL591-001:dwelling';
 // Reviewed centres of the actual painted windows; source daylight stays unlit.
 lightAnchors[key]=[[76.78699999999999, 276.6425], [126.21399999999998, 286.78549999999996], [191.41899999999998, 264.5675], [179.988, 344.90649999999994]];
 const [o]=addSprites([['parcel591:dwelling',im,PARCEL591.p,PARCEL591.anchor,1,PARCEL591.rect,{sceneryKind:'building',sourceAsset:key,sourceParcel:591}]]);
 o.actorFootCutaway=Object.freeze({width:54,centerHeight:.25,heightFactor:1.2,groundOnly:true});
 return Object.freeze({...PARCEL591,bounds:[o.bounds[0],o.bounds[1],o.bounds[0]+o.bounds[2],o.bounds[1]+o.bounds[3]],replaces:r=>r?.length===4&&r.every((v,i)=>Math.abs(v-PARCEL591.originalRect[i])<1e-7),report:()=>({...PARCEL591,ready:true,uniqueBuildingCount:1,artStretched:false,newNavigation:false,newInteractiveDoors:false,creativeAcceptance:false})});
}
