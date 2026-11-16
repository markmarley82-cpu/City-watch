import {createDistantReuseSection} from './city-section-parklane.mjs?v=p21-b407-s039-reuse';

export function createSectionS061Reuse(input) {
 return createDistantReuseSection(input,{
  id:'SECTION-S061-REUSE',
  prefix:'section-s061-reuse',
  expected:'roof-624,roof-625,roof-628',
  minimumDistance:100,
  allowFinish:true,
  maxResidual:7.5
 });
}
