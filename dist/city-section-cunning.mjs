import {createDistantReuseSection} from './city-section-parklane.mjs?v=p21-b407-s039-reuse';

const cunningArtificers = {
 id:'SECTION-CUNNING',
 prefix:'section-cunning',
 expected:'roof-522,roof-608,roof-642',
 minimumDistance:105
};
export function createSectionCunning(input){
 return createDistantReuseSection(input,cunningArtificers);
}
