import {createDistantReuseSection} from './city-section-parklane.mjs?v=p21-b407-s039-reuse';

export function createSectionS041Reuse(input){
 return createDistantReuseSection(input,{
  id:'SECTION-S041-REUSE',
  prefix:'section-s041-reuse',
  expected:'roof-343,roof-382,roof-403',
  minimumDistance:60,
  allowFinish:true,
  maxResidual:2,
  maxDoorHeight:72
 });
}
