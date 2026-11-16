import {createDistantReuseSection} from './city-section-parklane.mjs?v=p21-b406-s042-reuse';

export function createSectionS048Reuse(input) {
 return createDistantReuseSection(input,{
  id:'SECTION-S048-REUSE',
  prefix:'section-s048-reuse',
  expected:'roof-402,roof-458,roof-475,roof-476,roof-477,roof-478',
  minimumDistance:0,
  allowFinish:true,
  maxResidual:7,
  maxDoorHeight:72
 });
}
