// Original unnamed premise; existing game parcel, not a canonical address.
export const PARCEL590=Object.freeze({"id":"PARCEL590-001","sourceParcel":590,"oldRenderId":"roof:497","rect":[46.665,198.346,2.744,3.304],"p":[48.909,201.15],"anchor":[110,380],"dimensions":[224,400],"actorHeight":60,"visualDoorHeight":63.18,"foundationControlErrorPixels":9.46,"originalRect":[48.381,199.487,2.744,3.304]});
export async function createParcel590Premise({load,addSprites,lightAnchors}){
 const im=await load('assets/parcel590-premise/dwelling.webp');
 if((im.cwSourceWidth||im.width)!==PARCEL590.dimensions[0]||(im.cwSourceHeight||im.height)!==PARCEL590.dimensions[1])throw Error('Parcel590 source dimensions changed');
 const key='PARCEL590-001:dwelling';
 // Reviewed centres of the two actual painted windows; source daylight stays unlit.
 lightAnchors[key]=[[68.18,243.67],[167.04,169.58]];
 const [o]=addSprites([['parcel590:dwelling',im,PARCEL590.p,PARCEL590.anchor,1,PARCEL590.rect,{sceneryKind:'building',sourceAsset:key,sourceParcel:590}]]);
 return Object.freeze({...PARCEL590,bounds:[o.bounds[0],o.bounds[1],o.bounds[0]+o.bounds[2],o.bounds[1]+o.bounds[3]],replaces:r=>r?.length===4&&r.every((v,i)=>Math.abs(v-PARCEL590.originalRect[i])<1e-7),report:()=>({...PARCEL590,ready:true,uniqueBuildingCount:1,artStretched:false,newNavigation:false,newInteractiveDoors:false,creativeAcceptance:false})});
}
