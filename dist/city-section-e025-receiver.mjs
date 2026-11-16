import {recoverHidePark} from './city-hide-park.mjs?v=p21-b407-s039-reuse';
import {createDistantReuseSection} from './city-section-parklane.mjs?v=p21-b407-s039-reuse';
export const createE025Receiver=input=>createDistantReuseSection(input,{
 id:'SECTION-E025-451-RECEIVER',prefix:'section-e025-451-receiver',
 expected:'roof-395,roof-396,roof-419,roof-420',
 minimumDistance:50,allowFinish:true,maxResidual:3,maxDoorHeight:72
});

export function recoverE025Patrol({receiver,world,ground,store,Chase}){
 if(!receiver)return null;
 return recoverHidePark({world,ground,store,Chase,polygon:[],relocated:receiver.data.buildings.map(b=>b.rect)});
}
