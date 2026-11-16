import {createDistantReuseSection} from './city-section-parklane.mjs?v=p21-b407-s039-reuse';

export function createSectionS039Reuse(input) {
 return createDistantReuseSection(input,{
  id:'SECTION-S039-REUSE',
  prefix:'section-s039-reuse',
  expected:'roof-339,roof-354,roof-355,roof-376,roof-377,roof-378,roof-379,roof-401',
  minimumDistance:0,
  allowFinish:true,
  maxResidual:7,
  maxDoorHeight:72
 });
}
