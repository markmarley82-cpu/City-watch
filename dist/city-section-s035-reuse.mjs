import {createDistantReuseSection} from './city-section-parklane.mjs?v=p21-b407-s039-reuse';

export function createSectionS035Reuse(input) {
 return createDistantReuseSection(input,{
  id:'SECTION-S035-REUSE',
  prefix:'section-s035-reuse',
  expected:'roof-330,roof-331',
  minimumDistance:75,
  allowFinish:true,
  maxResidual:7
 });
}
