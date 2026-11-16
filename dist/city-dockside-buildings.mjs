/* Six original dock properties. Retire only their exact generic stand-ins after every painting loads. */
export async function createDocksideBuildings({read,load,addSprites,landmarks,manifestPath='assets/dockside-001/manifest.json'}){
 const manifest=await read(manifestPath),base=manifestPath.slice(0,manifestPath.lastIndexOf('/')+1);
 const images=await Promise.all(manifest.instances.map(async r=>{const im=await load(base+r.file,r.dimensions);if((im.cwSourceWidth||im.width)!==r.dimensions[0]||(im.cwSourceHeight||im.height)!==r.dimensions[1])throw Error('Dockside painting dimensions differ: '+r.id);return im;}));
 const rows=manifest.instances.map((r,i)=>[r.id,images[i],r.p,r.anchor,1,r.rect,{sceneryKind:'building',docksideBuilding:true,sourceAsset:r.id,landmark:landmarks.find(l=>l.game_id===r.landmarkID),actorFootCutaway:{width:54,heightFactor:1,toFoundation:true,opacity:.08}}]);
 const objects=addSprites(rows);const ids=new Set(manifest.replacedObjects||manifest.replacedLandmarks.map(id=>'landmark:'+id));
 return Object.freeze({manifest,objects,replaces:id=>ids.has(id),report:()=>({id:manifest.id,buildings:objects.length,originalSources:manifest.instances.map(r=>r.sourceSHA256),retired:[...ids],newNavigation:false,newDoors:false,newSaveWrites:false})});
}
