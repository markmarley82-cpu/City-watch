// Original unnamed premise; existing game parcel, not a canonical address.
export const PARCEL562=Object.freeze({id:'PARCEL562-001',sourceParcel:562,oldRenderId:'roof:479',rect:[54.349999999999994,107.452,2.696,4.379],p:[56.546,111.331],anchor:[100,400],dimensions:[260,420],actorHeight:60,visualDoorHeight:67.85,foundationControlErrorPixels:6.99});
export async function createParcel562Premise({load,addSprites,lightAnchors}){
 const im=await load('assets/parcel562-premise/dwelling.webp');
 if((im.cwSourceWidth||im.width)!==PARCEL562.dimensions[0]||(im.cwSourceHeight||im.height)!==PARCEL562.dimensions[1])throw Error('Parcel562 source dimensions changed');
 const key='PARCEL562-001:dwelling';
 // Reviewed centres of the three actual painted windows; source daylight stays unlit.
 lightAnchors[key]=[[68.12,270.43],[128.30,273.12],[187.85,234.32]];
 const [o]=addSprites([['parcel562:dwelling',im,PARCEL562.p,PARCEL562.anchor,1,PARCEL562.rect,{sceneryKind:'building',sourceAsset:key,sourceParcel:562}]]);
 return Object.freeze({...PARCEL562,bounds:[o.bounds[0],o.bounds[1],o.bounds[0]+o.bounds[2],o.bounds[1]+o.bounds[3]],replaces:r=>r?.length===4&&r.every((v,i)=>Math.abs(v-PARCEL562.rect[i])<1e-7),report:()=>({...PARCEL562,ready:true,uniqueBuildingCount:1,artStretched:false,newNavigation:false,newInteractiveDoors:false,creativeAcceptance:false})});
}
