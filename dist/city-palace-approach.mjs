// The approved Palace approach kit (ART-PALACE-APPROACH-001, unlit daytime gateway and lantern
// from ART-PALACE-DAYLIGHT-002), prepared by tools/make-palace-approach.py. Presentation only:
// every piece is lamp-kind scenery, so walking, doors and routes are unchanged, and the game's
// night lighting lights the lanterns (dark by day).
export const PALACE_APPROACH=Object.freeze([
 // [piece, world position of the art's lowest point, scale, mirror, footprint for depth]
 // The gatehouse spans the street along the forecourt's west side (E010), its arch over the walking
 // line, so passers-by go through it as they already do; a lantern post stands at the arch's front-left.
 // The wall pieces are prepared but not placed: every spot they fit is walkable street or
 // forecourt, so they would need collision and new routes.
 ['gateway',[140.5,234.2],1,false,[138,233,3,3]],
 ['lantern-post',[138.3,237.5],.52,false,[138,237,1,1]],
]);
export async function createPalaceApproach({read,load,addSprites,lightAnchors,placements=PALACE_APPROACH}){
 const base='assets/palace-approach-v1/',m=await read(base+'manifest.json');
 if(m.id!=='PALACE-APPROACH-v1')throw Error('Palace approach kit changed');
 const images=Object.fromEntries(await Promise.all(Object.entries(m.pieces).map(async([name,p])=>{const im=await load(base+p.file);if(im.width!==p.size[0]||im.height!==p.size[1])throw Error('Palace approach '+name+' size changed');return [name,im];})));
 const mirrored=new Map(),flip=im=>{if(!mirrored.has(im)){const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.translate(im.width,0);g.scale(-1,1);g.drawImage(im,0,0);mirrored.set(im,c);}return mirrored.get(im);};
 const rows=placements.map(([name,p,scale,mirror,rect],i)=>{const piece=m.pieces[name],w=piece.size[0],anchor=mirror?[w-piece.bottom[0],piece.bottom[1]]:piece.bottom;return ['palace-approach:'+i+':'+name,mirror?flip(images[name]):images[name],p,anchor,scale,rect,{sceneryKind:'street-lamp',sourceAsset:'PALACE-APPROACH-v1:'+name,cutawayEligible:false,palaceApproach:true,lights:piece.lights.map(([x,y])=>mirror?[w-x,y,w-piece.bottom[0],piece.bottom[1]]:[x,y,piece.bottom[0],piece.bottom[1]])}];});
 const objects=addSprites(rows);
 for(const o of objects)lightAnchors[o.id]=o.lights;
 return Object.freeze({objects,report:()=>({id:m.id,pieces:objects.length,navigationChanged:false})});
}
