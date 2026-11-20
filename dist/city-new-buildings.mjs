/* The approved new buildings of 20 Nov 2026 (shop street, dockside, artisan street, cooper workshop),
   placed on open public ground by tools/make-new-buildings.py, plus the Palace main block art.
   Each building is ordinary scenery: the open-ground pass leaves its footprint unwalkable. */
const BASE='assets/new-buildings-v1/';
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
