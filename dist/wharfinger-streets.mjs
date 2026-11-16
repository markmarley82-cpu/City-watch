/* Unique unnamed receiving-street section. Exact parcel retirement; no navigation changes. */
import {project} from './city-core.mjs?v=p21-b407-s039-reuse';
export async function createWharfingerStreets({read,load,addSprites,manifestPath='assets/wharfinger-001/manifest.json'}){
 const manifest=await read(manifestPath),base=manifestPath.slice(0,manifestPath.lastIndexOf('/')+1);
 const rows=await Promise.all(manifest.instances.map(async i=>{
  const im=await load(base+i.file,i.dimensions);
  if((im.cwSourceWidth||im.width)!==i.dimensions[0]||(im.cwSourceHeight||im.height)!==i.dimensions[1])throw Error('Wharfinger sprite dimensions differ: '+i.id);
  return[i.id,im,i.p,i.anchor,1,i.rect,{wharfingerStreet:true,sceneryKind:i.kind,sourceAsset:i.id}];
 }));
 const group=addSprites(rows),bounds=group.map(o=>o.bounds);
 return Object.freeze({manifest,replaces:r=>manifest.replacedParcels.some(p=>p.rect.every((v,i)=>Math.abs(v-r[i])<1e-7)),bounds:[Math.min(...bounds.map(b=>b[0]))-35,Math.min(...bounds.map(b=>b[1]))-35,Math.max(...bounds.map(b=>b[0]+b[2]))+35,Math.max(...bounds.map(b=>b[1]+b[3]))+35],report:()=>({id:manifest.id,buildings:manifest.instances.filter(i=>i.kind==='building').length,courts:manifest.instances.filter(i=>i.kind==='courtyard_compound').length,uniquePaintings:manifest.instances.length,retiredParcels:manifest.replacedParcels.map(p=>p.index),newNavigation:false,newDoors:false,creativeAcceptance:false})});
}
