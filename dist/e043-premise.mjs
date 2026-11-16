import {project} from './city-core.mjs?v=p21-b407-s039-reuse';
export const E043_PREMISE=Object.freeze({id:'E043-INFILL-001',gameId:'scenic:e043-unnamed-premise',name:'Unnamed E043 service house',locationLabel:'Dimwell · narrow service house',rect:[61.079,65.598,2.603,3.928],p:[62.682,68.526],anchor:[220,510],dimensions:[440,520],sourceParcel:540,visualDoorHeight:62,actorHeight:60});
const exact=(a,b)=>a.length===b.length&&a.every((v,i)=>Math.abs(v-b[i])<.001);
export async function createE043Premise({load,addSprites}){
 const im=await load('assets/e043-infill-001/service-house-painted.webp');
 if((im.cwSourceWidth||im.width)!==E043_PREMISE.dimensions[0]||(im.cwSourceHeight||im.height)!==E043_PREMISE.dimensions[1])throw Error('E043 premise dimensions changed');
 const group=addSprites([['e043-premise:service-house-painted',im,E043_PREMISE.p,E043_PREMISE.anchor,1,E043_PREMISE.rect,{e043Premise:true,sceneryKind:'building',sourceAsset:'E043-INFILL-001:service-house-painted',sourceParcel:E043_PREMISE.sourceParcel}]]),o=group[0];
 return Object.freeze({gameId:E043_PREMISE.gameId,name:E043_PREMISE.name,locationLabel:E043_PREMISE.locationLabel,bounds:[o.bounds[0]-35,o.bounds[1]-25,o.bounds[0]+o.bounds[2]+45,o.bounds[1]+o.bounds[3]+35],replaces:r=>exact(r,E043_PREMISE.rect),report:()=>({...E043_PREMISE,ready:true,parts:1,uniqueBuildingCount:1,geometry:'narrow frontage, deep side wall, pitched slate roof, full foundation, human-scale door and clear visual threshold',noMirrorsOrRecolours:true,newNavigation:false,newInteractiveDoors:false,creativeAcceptance:false})});
}
