// Original unnamed infill. No canonical address, new door interaction or quest.
export const E045_PREMISE_002 = Object.freeze({
 id:'E045-INFILL-002', gameId:'scenic:e045-russet-house', name:'Unnamed E045 russet house',
 locationLabel:'E045 · russet house and public approach', sourceParcel:658,
 oldRect:[29.593,211.172,3.663,2.974], rect:[29.2,210.45,4.056,3.696],
 p:[32.756,213.646], anchor:[121,218], dimensions:[232,232],
 visualDoorHeight:62, actorHeight:60, landing:[32,215], edge:'E045'
});
export async function createE045Premise002({load,addSprites}) {
 const im=await load('assets/e045-infill-002/russet-house.webp');
 const [width,height]=E045_PREMISE_002.dimensions;
 if((im.cwSourceWidth||im.width)!==width||(im.cwSourceHeight||im.height)!==height)
  throw Error('E045 russet house dimensions changed');
 const [o]=addSprites([['e045-premise:russet-house',im,E045_PREMISE_002.p,
  E045_PREMISE_002.anchor,1,E045_PREMISE_002.rect,
  {sceneryKind:'building',sourceAsset:'E045-INFILL-002:russet-house',sourceParcel:658}]]);
 return Object.freeze({...E045_PREMISE_002,
  bounds:[o.bounds[0]-35,o.bounds[1]-25,o.bounds[0]+o.bounds[2]+35,o.bounds[1]+o.bounds[3]+35],
  replaces:r=>r.length===4&&r.every((v,i)=>Math.abs(v-E045_PREMISE_002.oldRect[i])<.001),
  report:()=>({...E045_PREMISE_002,ready:true,uniqueBuildingCount:1,
   originalGraphChanged:false,localFootprintChanged:true,newInteractiveDoors:false,creativeAcceptance:false})
 });
}
