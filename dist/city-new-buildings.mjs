/* The approved new buildings of 20 Nov 2026 (shop street, dockside, artisan street, cooper workshop),
   placed on open public ground by tools/make-new-buildings.py, plus the Palace main block art.
   Each building is ordinary scenery: the open-ground pass leaves its footprint unwalkable. */
const BASE='assets/new-buildings-v1/';
// Street buildings with a room (dist/guild-interiors/rooms.json, street-*): door id new-<name>.
export const STREET_DOORS=Object.freeze({apothecary:'Apothecary',smithy:'Smithy','curry-house':'Curry house',butcher:'Butcher\u2019s shop','cooper-workshop':'Cooper\u2019s workshop',pawnbroker:'Pawnbroker',lodging:'Lodging house','quay-lodging':'Quay lodging',cobbler:'Cobbler','ship-chandler':'Ship chandler','bonded-warehouse':'Bonded warehouse','rope-maker':'Rope-maker\u2019s shed',cooper:'Barrel-maker'});
// A door on the street cell in front of the building's front-left face (where its doorway is
// painted), nearest the middle; the cell must be walkable once the open-ground pass has run.
export function addStreetDoors(world,manifest){
 let added=0;
 for(const h of manifest.buildings){
  const name=STREET_DOORS[h.name];if(!name)continue;
  const [x,y,w,d]=h.rect,mid=x+Math.floor(w/2);let cell=null;
  for(let dy=0;dy<3&&!cell;dy++)for(const dx of [0,-1,1,-2,2]){const c=[mid+dx,y+d+dy],ids=world.members.get(c.join(','));if(ids?.size&&c[0]>=x&&c[0]<x+w){cell=[c,[...ids][0]];break;}}
  if(!cell)continue;
  world.doors.set('new-'+h.name,{lf_id:'NB',game_id:'new-'+h.name,name,position:cell[0],edge:cell[1],held:false,streetBuilding:h.name});added++;
 }
 return added;
}
export async function createNewBuildings({read,load,addSprites,lightAnchors}){
 const manifest=await read(BASE+'manifest.json?v=5');
 const images=await Promise.all(manifest.buildings.map(row=>load(BASE+row.file+'?v='+row.sha256.slice(0,12),row.dimensions)));
 const rows=manifest.buildings.map((row,i)=>[row.id,images[i],row.p,row.anchor,row.scale,row.rect,{sceneryKind:'building',sourceAsset:row.id,newBuilding:row.name,actorFootCutaway:{width:54,heightFactor:1.1,toFoundation:true,opacity:.08}}]);
 const objects=addSprites(rows);
 for(const row of manifest.buildings)lightAnchors[row.id]=row.windowAnchors;
 return Object.freeze({manifest,objects,report:()=>({id:manifest.id,buildings:objects.length})});
}
// The Palace main block replaces the composed Palace range drawing; walls only for the roof cutaway.
export async function loadPalaceMainBlock({read,load}){
 const manifest=await read(BASE+'manifest.json?v=5'),m=manifest.palace;
 const [im,walls,emission]=await Promise.all(['day','walls','emission'].map(k=>load(BASE+m.files[k]+'?v='+m.sha256[k].slice(0,12),m.dimensions)));
 return {im,walls,emission,p:m.p,anchor:m.anchor,scale:m.scale};
}
