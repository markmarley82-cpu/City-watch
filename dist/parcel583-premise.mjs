// Original unnamed premise; existing game parcel, not a canonical address.
export const PARCEL583=Object.freeze({"id": "PARCEL583-001", "sourceParcel": 583, "oldRenderId": "roof:495", "rect": [48.02199999999999, 112.398, 4.435, 4.167], "p": [51.957, 116.065], "anchor": [160, 440], "dimensions": [320, 460], "actorHeight": 60, "visualDoorHeight": 65.949, "foundationControlErrorPixels": 6.73697810594627});
export async function createParcel583Premise({load,addSprites,lightAnchors}){
 const im=await load('assets/parcel583-premise/dwelling.webp');
 if((im.cwSourceWidth||im.width)!==PARCEL583.dimensions[0]||(im.cwSourceHeight||im.height)!==PARCEL583.dimensions[1])throw Error('Parcel583 source dimensions changed');
 const key='PARCEL583-001:dwelling';
 // Reviewed centres of the actual painted windows; source daylight stays unlit.
 lightAnchors[key]=[[69.487, 244.289], [220.342, 269.654]];
 const [o]=addSprites([['parcel583:dwelling',im,PARCEL583.p,PARCEL583.anchor,1,PARCEL583.rect,{sceneryKind:'building',sourceAsset:key,sourceParcel:583}]]);
 return Object.freeze({...PARCEL583,bounds:[o.bounds[0],o.bounds[1],o.bounds[0]+o.bounds[2],o.bounds[1]+o.bounds[3]],replaces:r=>r?.length===4&&r.every((v,i)=>Math.abs(v-PARCEL583.rect[i])<1e-7),report:()=>({...PARCEL583,ready:true,uniqueBuildingCount:1,artStretched:false,newNavigation:false,newInteractiveDoors:false,creativeAcceptance:false})});
}
