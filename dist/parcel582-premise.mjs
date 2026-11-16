// Original unnamed premise; existing game parcel, not a canonical address.
export const PARCEL582=Object.freeze({id:'PARCEL582-001',sourceParcel:582,oldRenderId:'roof:494',rect:[49.236, 107.167, 3.412, 2.793],p:[52.148, 109.46],anchor:[140, 400],dimensions:[260, 420],actorHeight:60,visualDoorHeight:65.688,foundationControlErrorPixels:8.633733143895556});
export async function createParcel582Premise({load,addSprites,lightAnchors}){
 const im=await load('assets/parcel582-premise/dwelling.webp');
 if((im.cwSourceWidth||im.width)!==PARCEL582.dimensions[0]||(im.cwSourceHeight||im.height)!==PARCEL582.dimensions[1])throw Error('Parcel582 source dimensions changed');
 const key='PARCEL582-001:dwelling';
 // Reviewed centres of the two actual painted windows; source daylight stays unlit.
 lightAnchors[key]=[[57.89, 227.926], [103.586, 245.538]];
 const [o]=addSprites([['parcel582:dwelling',im,PARCEL582.p,PARCEL582.anchor,1,PARCEL582.rect,{sceneryKind:'building',sourceAsset:key,sourceParcel:582}]]);
 return Object.freeze({...PARCEL582,bounds:[o.bounds[0],o.bounds[1],o.bounds[0]+o.bounds[2],o.bounds[1]+o.bounds[3]],replaces:r=>r?.length===4&&r.every((v,i)=>Math.abs(v-PARCEL582.rect[i])<1e-7),report:()=>({...PARCEL582,ready:true,uniqueBuildingCount:1,artStretched:false,newNavigation:false,newInteractiveDoors:false,creativeAcceptance:false})});
}
