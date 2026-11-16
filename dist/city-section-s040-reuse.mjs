import {createDistantReuseSection} from './city-section-parklane.mjs?v=p21-b407-s039-reuse';

export function createSectionS040Reuse(input){
 return createDistantReuseSection(input,{
  id:'SECTION-S040-REUSE',
  prefix:'section-s040-reuse',
  expected:'roof-0,roof-1,roof-121,roof-122,roof-123,roof-124,roof-125,roof-2,roof-3,roof-31,roof-32,roof-35,roof-36,roof-60,roof-64,roof-90,roof-91,roof-92,roof-93,roof-94',
  minimumDistance:80,
  allowFinish:true,
  maxResidual:5.5,
  maxDoorHeight:74
 });
}
