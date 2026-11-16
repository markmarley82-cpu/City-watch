/* Original exterior scenery. No navigation, collision, save or ingress mutations. */
import {project} from './city-core.mjs?v=p21-b407-s039-reuse';
export const STREET_BASE='assets/uu-streets-v18/';
export function rectOverlap(a,b){return Math.min(a[0]+a[2],b[0]+b[2])>Math.max(a[0],b[0])&&Math.min(a[1]+a[3],b[1]+b[3])>Math.max(a[1],b[1]);}
export function sourceReservation(rect){return [rect[0]-.5,rect[1]-.5,rect[2],rect[3]];}
export async function createUniversityStreets({read,load,loadScenery=load,addSprites,imageDensity}){
 const previous=new URLSearchParams(globalThis.location?.search||'').get('frontage')==='previous';
 const manifest=await read(STREET_BASE+(previous?'manifest-before-v22.json':'manifest.json')+'?v=p21-b86-consolidated');
 const ims=new Map();
 // Load the current manifest: every structure has its own authored painting.
 for(let i=0;i<manifest.assets.length;i+=3)await Promise.all(manifest.assets.slice(i,i+3).map(async a=>ims.set(a.id,await loadScenery(STREET_BASE+a.file))));
 const floor=await load(STREET_BASE+manifest.ground.file),assets=new Map(manifest.assets.map(a=>[a.id,a]));
 const placements=[],reflections=new Map();
 for(const item of manifest.instances){const a=assets.get(item.asset);let im=ims.get(item.asset),anchor=a.anchor;
  if(item.mirror){if(!reflections.has(item.asset)){const source=im,c=document.createElement('canvas');c.width=im.width;c.height=im.height;const d=c.getContext('2d');d.translate(im.width,0);d.scale(-1,1);d.drawImage(im,0,0);imageDensity?.annotateCopy(source,c);reflections.set(item.asset,c);}im=reflections.get(item.asset);anchor=[(im.cwSourceWidth||im.width)-a.anchor[0],a.anchor[1]];}
  placements.push([item.id,im,item.p,anchor,1,item.rect,{universityStreet:true,sceneryKind:item.kind,sourceAsset:item.asset,lightMirror:!!item.mirror}]);
 }
 // Reflection/metadata setup finishes before the caller commits a single batch.
 // The caller prepares every alpha buffer before publishing any new object.
 // Four mirrored quadrants meet exactly at tile edges; prepare before commit.
 const tile=document.createElement('canvas');tile.width=1024;tile.height=1024;const c=tile.getContext('2d');
 for(const [x,y,sx,sy] of [[0,0,1,1],[1024,0,-1,1],[0,1024,1,-1],[1024,1024,-1,-1]]){c.save();c.translate(x,y);c.scale(sx,sy);c.drawImage(floor,0,0,512,512);c.restore();}
 const group=addSprites(placements);
 let pattern=null;
 function drawGround(ctx){
  if(!pattern){
   pattern=ctx.createPattern(tile,'repeat');pattern.setTransform(new DOMMatrix([.32,.16,-.32,.16,0,0]));
  }
  for(const [x,y,w,h] of manifest.ground.regions){
   // Blend eight nested borders into the retained city ground, avoiding a hard slab edge.
   for(let inset=0;inset<=8;inset++){
    const t=inset*.6,pts=[[x-.5+t,y-.5+t],[x+w-.5-t,y-.5+t],[x+w-.5-t,y+h-.5-t],[x-.5+t,y+h-.5-t]].map(project);
    ctx.save();ctx.globalAlpha=inset===8?1:.16;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=pattern;ctx.fill();ctx.restore();
   }
  }
 }
 function replaces(rect){const [x,y,w,h]=manifest.bounds,[u,v,a,b]=sourceReservation(rect);return u>=x-.5&&v>=y-.5&&u+a<=x-.5+w&&v+b<=y-.5+h;}
 function bounds(view='core'){if(Array.isArray(manifest.viewBounds?.[view]))return manifest.viewBounds[view];const p=project(Array.isArray(manifest.views[view])?manifest.views[view]:manifest.camera.centre);return [p.x-800,p.y-505,p.x+800,p.y+295];}
 return Object.freeze({manifest,drawGround,replaces,bounds,report:()=>({id:manifest.id,ready:true,instances:group.length,buildings:manifest.instances.filter(i=>i.kind==='building').length,courtyardCompounds:manifest.instances.filter(i=>i.kind==='courtyard_compound').length,yardItems:manifest.instances.filter(i=>i.kind==='yard_enclosure').length,uniquePaintings:ims.size,uniqueShoplaneBuildings:manifest.instances.filter(i=>i.replacementSection==='UU-SHOPLANE-001').length,individualReplacementSections:Object.fromEntries([...new Set(manifest.instances.map(i=>i.replacementSection).filter(Boolean))].map(id=>[id,manifest.instances.filter(i=>i.replacementSection===id).length])),individualReplacementPaintings:new Set(manifest.instances.filter(i=>i.replacementSection).map(i=>i.asset)).size,uniqueStructureSources:new Set(manifest.instances.filter(i=>i.kind!=='ambient').map(i=>i.asset)).size,remainingRepeatedStructureUses:manifest.instances.filter(i=>i.kind!=='ambient').length-new Set(manifest.instances.filter(i=>i.kind!=='ambient').map(i=>i.asset)).size,remainingMirroredStructures:manifest.instances.filter(i=>i.kind!=='ambient'&&i.mirror).length,newFittedPaintings:6,newAmbientPaintings:4,ambientGroups:manifest.instances.filter(i=>i.kind==='ambient').length,protectedEntrances:manifest.instances.reduce((n,i)=>n+i.entrance_clearances.length,0),groundReady:!!floor,originalPublicCells:manifest.public_cells,newNavigation:false,newDoors:false,canonicalParcels:false,decodedNativeMiB:[...ims.values(),...reflections.values()].reduce((n,im)=>n+im.width*im.height*4,0)/1048576})});
}
