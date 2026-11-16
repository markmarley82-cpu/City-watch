import {createDistantReuseSection} from './city-section-parklane.mjs?v=p21-b407-s039-reuse';

export function createSectionS043Reuse(input) {
 return createDistantReuseSection(input,{
  id:'SECTION-S043-REUSE',
  prefix:'section-s043-reuse',
  expected:'roof-358,roof-359',
  minimumDistance:70,
  allowFinish:true,
  maxResidual:7
 });
}
