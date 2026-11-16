import {project} from './city-core.mjs?v=p21-b407-s039-reuse';
export const E043_PREMISE_002=Object.freeze({id:'E043-INFILL-002',gameId:'scenic:e043-unnamed-brick-house',name:'Unnamed E043 brick house',locationLabel:'Dimwell · brick gabled house',rect:[59.272,59.814,4.248,3.699],p:[61.702,62.757],anchor:[240,490],dimensions:[480,500],sourceParcel:539,visualDoorHeight:63,actorHeight:60});
const exact=(a,b)=>a.length===b.length&&a.every((v,i)=>Math.abs(v-b[i])<.001);
export async function createE043Premise002({load,addSprites}){
 const im=await load('assets/e043-infill-002/brick-gabled-house-painted.webp');
 if((im.cwSourceWidth||im.width)!==E043_PREMISE_002.dimensions[0]||(im.cwSourceHeight||im.height)!==E043_PREMISE_002.dimensions[1])throw Error('E043 premise 002 dimensions changed');
 const group=addSprites([['e043-premise-002:brick-gabled-house-painted',im,E043_PREMISE_002.p,E043_PREMISE_002.anchor,1,E043_PREMISE_002.rect,{e043Premise002:true,sceneryKind:'building',sourceAsset:'E043-INFILL-002:brick-gabled-house-painted',sourceParcel:E043_PREMISE_002.sourceParcel}]]),o=group[0];
 return Object.freeze({gameId:E043_PREMISE_002.gameId,name:E043_PREMISE_002.name,locationLabel:E043_PREMISE_002.locationLabel,bounds:[o.bounds[0]-35,o.bounds[1]-25,o.bounds[0]+o.bounds[2]+45,o.bounds[1]+o.bounds[3]+35],replaces:r=>exact(r,E043_PREMISE_002.rect),report:()=>({...E043_PREMISE_002,ready:true,parts:1,uniqueBuildingCount:1,geometry:'wide brick frontage, deep skewed side wing, long clay-tile roof, full foundation, human-scale door and clear visual threshold',noMirrorsOrRecolours:true,newNavigation:false,newInteractiveDoors:false,creativeAcceptance:false})});
}
