/* Shades exterior painting: source graph, cases and interactive doors are unchanged. */
import {conflictsWithPainting} from './city-scenery-overlap.mjs?v=p21-b407-s039-reuse';
import {project} from './city-core.mjs?v=p21-b407-s039-reuse';
export const SHADES_BASE='assets/shades-streets-v1/';
export async function createShadesStreets({read,load,addSprites,imageDensity,enabled=true}){
 const manifest=await read(SHADES_BASE+'manifest.json?v=drum-large-1');
 const ims=new Map(await Promise.all(manifest.assets.map(async a=>{
  const im=await load(SHADES_BASE+a.file,a.dimensions);
  if((im.cwSourceWidth||im.width)!==a.dimensions[0]||(im.cwSourceHeight||im.height)!==a.dimensions[1])throw Error('Shades painting dimensions differ: '+a.id);
  return[a.id,im];
 })));
 const assets=new Map(manifest.assets.map(a=>[a.id,a])),reflections=new Map();
 const rows=manifest.instances.map(i=>{
  const a=assets.get(i.asset);let im=ims.get(i.asset),anchor=a.anchor;
  if(i.mirror){
   if(!reflections.has(i.asset)){const source=im,c=document.createElement('canvas');c.width=im.width;c.height=im.height;const d=c.getContext('2d');d.translate(im.width,0);d.scale(-1,1);d.drawImage(im,0,0);imageDensity?.annotateCopy(source,c);reflections.set(i.asset,c);}
   im=reflections.get(i.asset);anchor=[(im.cwSourceWidth||im.width)-a.anchor[0],a.anchor[1]];
  }
  return[i.id,im,i.p,anchor,a.render_scale||1,i.rect,{shadesStreet:true,sceneryKind:i.kind,sourceAsset:i.asset,lightMirror:!!i.mirror,legacyReplacementMode:i.legacyReplacementMode}];
 });
 // The caller prepares all alpha buffers before committing a single batch.
 const group=enabled?addSprites(rows):[];
 function replaces(r){const b=manifest.retired_section;return enabled&&((b&&r[0]<b[0]+b[2]&&r[0]+r[2]>b[0]&&r[1]<b[1]+b[3]&&r[1]+r[3]>b[1])||manifest.replaced_roof_parcels.some(p=>p.rect.every((n,i)=>Math.abs(n-r[i])<1e-7))||(manifest.infill_rects||[]).some(b=>r[0]-.5<b[0]+b[2]&&r[0]+r[2]-.5>b[0]&&r[1]-.5<b[1]+b[3]&&r[1]+r[3]-.5>b[1]));}
 const removedFillers=new Set();
 function replacesObject(o){const remove=replaces(o.rect)||group.some(p=>p.sceneryKind==='building'&&p.legacyReplacementMode!=='foundation-only'&&conflictsWithPainting(o,p));if(remove)removedFillers.add(o.id);return remove;}
 function replacesLandmark(id){return enabled&&(manifest.landmark_replacements||['shades']).includes(id);}
 function bounds(){
  if(manifest.camera_bounds)return manifest.camera_bounds;
  const boxes=rows.map(([,im,p,a,scale])=>{const q=project(p);return[q.x-a[0]*scale,q.y-a[1]*scale,q.x-a[0]*scale+im.width*scale,q.y-a[1]*scale+im.height*scale];});
  return[Math.min(...boxes.map(b=>b[0]))-35,Math.min(...boxes.map(b=>b[1]))-35,Math.max(...boxes.map(b=>b[2]))+35,Math.max(...boxes.map(b=>b[3]))+35];
 }
 return Object.freeze({manifest,replaces,replacesObject,replacesLandmark,bounds,report:()=>({id:manifest.id,ready:true,enabled,instances:group.length,buildingGroups:enabled?manifest.instances.filter(i=>i.kind==='building').length:0,courtyardGroups:enabled?manifest.instances.filter(i=>i.kind==='courtyard_compound').length:0,ambientGroups:enabled?manifest.instances.filter(i=>i.kind==='ambient').length:0,uniquePaintings:ims.size,entranceLandings:manifest.entrance_landings,newNavigation:false,newDoors:false,removedRoofParcels:removedFillers.size,creativeAcceptance:false})});
}
