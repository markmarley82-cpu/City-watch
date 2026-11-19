import {recoverHidePark} from './city-hide-park.mjs?v=memo-1';
import {createDistantReuseSection} from './city-section-parklane.mjs?v=p21-b407-s039-reuse';
export const createSmallGodsFrontage=input=>createDistantReuseSection(input,{
 id:'SECTION-SMALL-GODS-452',prefix:'section-small-gods-452',
 expected:'roof-276,roof-292,roof-305,roof-306',
 minimumDistance:50,allowFinish:true,maxResidual:3,maxDoorHeight:72
});

export function recoverSmallGodsPatrol({receiver,world,ground,store,Chase}){
 if(!receiver)return null;
 return recoverHidePark({world,ground,store,Chase,polygon:[],relocated:receiver.data.buildings.map(b=>b.rect)});
}
