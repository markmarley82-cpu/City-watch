// One source-fitted Palace section; existing city coordinates remain authoritative.
import {project} from './city-core.mjs?v=p21-b407-s039-reuse';
export async function createPalacePrecinct({read,load,addSprites,lightAnchors}){
 const m=await read('assets/palace-001/manifest.json'),a=m.asset;
 const [im,ground]=await Promise.all([load('assets/palace-001/'+a.file),load('assets/palace-001/'+m.ground.file)]);
 if(im.width!==a.dimensions[0]||im.height!==a.dimensions[1])throw Error('Palace export dimensions differ');
 const objects=addSprites([[a.id,im,a.p,a.anchor,1,a.rect,{landmark:{game_id:'palace'},sourceAsset:a.id,sceneryKind:'palace-range',palace:true,doorHeight:a.doorHeight}]]);
 lightAnchors[a.id]=a.lights;
 const overlap=r=>r[0]<152&&r[0]+r[2]>139&&r[1]<238&&r[1]+r[3]>231;
 return Object.freeze({replaces:id=>id==='landmark:palace',replacesRoof:overlap,
  drawGround(g){const b=m.ground.screenBox;g.drawImage(ground,...b);},
  bounds:objects.flatMap(o=>o.bounds),
  report:()=>({id:m.id,sections:1,originalSources:3,door:[144,231],doorHeight:a.doorHeight,mirror:false,lights:a.lights.length,completePalace:false})});
}
