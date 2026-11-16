// Original unnamed trades. The existing shop adapter owns every price/effect.
export const hideParkCounters=Object.freeze([
 Object.freeze({key:'hide-park-cloth',gameId:'service:shop:hide-park-cloth',name:'Cloth worker’s counter',stockKey:'apothecary',body:'assets/hide-park257/A/body.webp',label:'Cloth & dressings',copy:'Clean folded cloth and practical dressings for a Watch patrol.'}),
 Object.freeze({key:'hide-park-provisions',gameId:'service:shop:hide-park-provisions',name:'Neighbourhood provision storehouse',stockKey:'provisions',body:'assets/hide-park257/B/body.webp',label:'Food & coffee',copy:'Bread, meals and coffee for the road.'})
]);
export const hideParkCounter=key=>hideParkCounters.find(r=>r.key===key)||null;
export function appendHideParkCounters(data,world){
 for(const r of hideParkCounters){
  if(!world.doors.get(r.gameId)||data.scenes.some(s=>s.key===r.key))continue;
  data.scenes.push({key:r.key,title:r.name,image:'../'+r.body.replace(/^assets\//,''),placements:[],humanHeightAtThisRoom:.205,scaleBasis:'Retained Watch human reference',blocking:'Counter view only; no separate walkable interior.',status:'Bound current-world counter; original unnamed infill'});
 }
 return data;
}
