import {createDistantReuseSection} from './city-section-parklane.mjs?v=p21-b407-s039-reuse';

export function createSectionS042Reuse(input) {
 return createDistantReuseSection(input,{
  id:'SECTION-S042-REUSE',
  prefix:'section-s042-reuse',
  expected:'roof-351,roof-352,roof-374,roof-394,roof-416,roof-417,roof-452,roof-453,roof-470,roof-484',
  minimumDistance:0,
  allowFinish:true,
  maxResidual:7
 });
}
