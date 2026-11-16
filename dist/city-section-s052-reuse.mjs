import {createDistantReuseSection} from './city-section-parklane.mjs?v=p21-b406-s042-reuse';

export function createSectionS052Reuse(input) {
 return createDistantReuseSection(input,{
  id:'SECTION-S052-REUSE',
  prefix:'section-s052-reuse',
  expected:'roof-489,roof-507,roof-527,roof-550,roof-579,roof-613',
  minimumDistance:0,
  allowFinish:true,
  maxResidual:7,
  maxDoorHeight:72
 });
}
