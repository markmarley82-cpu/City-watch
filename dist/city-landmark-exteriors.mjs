/* Ten individual game-original landmark exteriors. Existing map, doors and rooms stay authoritative. */
export async function createLandmarkExteriors({read,load,addSprites,landmarks,lightAnchors}){
 const base='assets/landmark-exteriors-v3/',manifest=await read(base+'manifest.json?v=5');
 const images=await Promise.all(manifest.instances.map(async row=>{
  const image=await load(base+row.file+'?v='+row.sha256.slice(0,12),row.dimensions);
  if((image.cwSourceWidth||image.naturalWidth||image.width)!==row.dimensions[0]||(image.cwSourceHeight||image.naturalHeight||image.height)!==row.dimensions[1])throw Error('Landmark exterior dimensions changed: '+row.landmarkID);
  return image;
 }));
 const rows=manifest.instances.map((row,index)=>[row.id,images[index],row.p,row.anchor,row.scale,row.rect,{sceneryKind:'building',landmarkExterior:true,sourceAsset:row.id,landmark:landmarks.find(item=>item.game_id===row.landmarkID),doorHeight:row.estimatedDoorHeight,actorFootCutaway:{width:54,heightFactor:1.1,toFoundation:true,opacity:.08}}]);
 const objects=addSprites(rows),ids=new Set(manifest.instances.map(row=>row.landmarkID));
 for(const row of manifest.instances)lightAnchors[row.id]=row.windowAnchors;
 return Object.freeze({manifest,objects,replaces:id=>ids.has(id),report:()=>({id:manifest.id,buildings:objects.length,landmarks:[...ids],uniqueStructures:new Set(manifest.instances.map(row=>row.uniqueStructure)).size,actorHeight:manifest.actorHeight,visualDoorHeight:manifest.visualDoorHeight,newNavigation:false,newDoors:false,mirrored:manifest.instances.some(row=>row.mirrored),stretched:manifest.instances.some(row=>row.stretched)})});
}
