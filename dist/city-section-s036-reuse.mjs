import {createDistantReuseSection} from './city-section-parklane.mjs?v=p21-b407-s039-reuse';

export function createSectionS036Reuse(input){
 return createDistantReuseSection(input,{
  id:'SECTION-S036-REUSE',
  prefix:'section-s036-reuse',
  expected:'roof-332,roof-333,roof-341,roof-342,roof-356,roof-357,roof-380,roof-381',
  minimumDistance:40,
  allowFinish:true,
  maxResidual:3,
  maxDoorHeight:72
 });
}
