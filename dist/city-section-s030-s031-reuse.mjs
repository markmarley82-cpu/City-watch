import {createDistantReuseSection} from './city-section-parklane.mjs?v=p21-b407-s039-reuse';

export function createSectionS030S031Reuse(input) {
 return createDistantReuseSection(input,{
  id:'SECTION-S030-S031-REUSE',
  prefix:'section-s030-s031-reuse',
  expected:'roof-319,roof-320',
  minimumDistance:40,
  allowFinish:true,
  maxResidual:3
 });
}
