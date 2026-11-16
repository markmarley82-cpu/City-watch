export const E045_PREMISE=Object.freeze({id:'E045-INFILL-001',gameId:'scenic:e045-unnamed-house',name:'Unnamed E045 stone house',locationLabel:'E045 · stone house and service approach',oldRect:[36.61000000000001,211.049,2.636,3.151],rect:[36.61,212.0,1.8,2.201],p:[37.91,213.701],anchor:[112,206],dimensions:[236,216],sourceParcel:631,visualDoorHeight:64,actorHeight:60,landing:[38,211],edge:'E045'});
export async function createE045Premise({load,addSprites}){
 const im=await load('assets/e045-infill-001/narrow-stone-house.webp');
 if((im.cwSourceWidth||im.width)!==236||(im.cwSourceHeight||im.height)!==216)throw Error('E045 house dimensions changed');
 const [o]=addSprites([['e045-premise:stone-house',im,E045_PREMISE.p,E045_PREMISE.anchor,1,E045_PREMISE.rect,{sceneryKind:'building',sourceAsset:'E045-INFILL-001:stone-house',sourceParcel:631}]]);
 return Object.freeze({...E045_PREMISE,bounds:[o.bounds[0]-35,o.bounds[1]-25,o.bounds[0]+o.bounds[2]+35,o.bounds[1]+o.bounds[3]+35],replaces:r=>r.length===4&&r.every((v,i)=>Math.abs(v-E045_PREMISE.oldRect[i])<.001),report:()=>({...E045_PREMISE,ready:true,uniqueBuildingCount:1,originalGraphChanged:false,localFootprintChanged:true,newInteractiveDoors:false,creativeAcceptance:false})});
}
