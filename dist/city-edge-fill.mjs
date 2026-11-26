/* Fills the empty ground at the city edge with packed rows of existing house paintings
   (tools/make-edge-fill.py), so it reads as more city you can't get into. Each house blocks walking
   by its footprint, like every other house; gaps shut in by houses are closed too. */
export async function createEdgeFill({read,load,addSprites,lightAnchors}){
 const manifest=await read('assets/edge-fill-v1/manifest.json?v=1');
 const images=new Map();
 for(const h of manifest.houses)if(!images.has(h.path))images.set(h.path,load(h.path,h.dimensions));
 const loaded=new Map(await Promise.all([...images].map(async([k,v])=>[k,await v])));
 const objects=addSprites(manifest.houses.map(h=>[h.id,loaded.get(h.path),h.p,h.anchor,h.scale,h.rect,{sceneryKind:'building',sourceAsset:h.id,edgeFill:true,actorFootCutaway:{width:54,heightFactor:1.1,toFoundation:true,opacity:.08}}]));
 for(const h of manifest.houses)if(h.windows?.length)lightAnchors[h.id]=h.windows;
 return Object.freeze({objects,privateAreas:manifest.closedGaps,report:()=>({houses:objects.length})});
}
