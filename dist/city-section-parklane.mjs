import {createReuseFinishImage,reuseFinishes} from './city-reuse-finish.mjs?v=p21-b407-s039-reuse';
import {CITY_GLASS} from './city-window-pane-city-data.mjs?v=p21-b407-s039-reuse';
import {project} from './city-core.mjs?v=p21-b407-s039-reuse';

const parkLane = {
 id:'SECTION-PARK-LANE',
 prefix:'section-parklane',
 expected:'roof-314,roof-329,roof-399,roof-422,roof-441,roof-457',
 minimumDistance:75
};
export function createSectionParkLane(input){
 return createDistantReuseSection(input,parkLane);
}

export async function createDistantReuseSection({read,load,addSprites,lightAnchors},{id,prefix,expected,minimumDistance,allowFinish=false,maxResidual=7,maxDoorHeight=71}){
 const base='assets/'+prefix+'/';
 const manifest=await read(base+'manifest.json');
 const buildings=await Promise.all(manifest.buildings.map(async b=>{
  if(!b.paneSource)return b;
  const donorData=await read(b.paneSource.manifest);
  const donor=donorData.buildings.find(entry=>entry.id===b.paneSource.id);
  if(!donor)throw Error(id+' pane source changed '+b.id);
  return {...b,
   panes:donor.panes,hiddenPanes:donor.hiddenPanes,
   windowCentres:donor.windowCentres,hiddenWindowCentres:donor.hiddenWindowCentres
  };
 }));
 const data={...manifest,buildings};
 const premises=expected.split(',').length;
 if(data.id!==id||
    data.buildings.map(b=>b.id).sort().join(',')!==expected||
    new Set(data.buildings.map(b=>b.sourceSHA256)).size!==premises||
    data.buildings.some(b=>!b.distantReuse||b.reuseDistanceWorld<=minimumDistance||
     b.mirror||Boolean(b.recolour)!==Boolean(b.finish)||
     (b.finish&&(!allowFinish||!Object.hasOwn(reuseFinishes,b.finish)))||
     (allowFinish&&b.reuseDistanceWorld<105&&!b.finish)||b.registration.residual>maxResidual||
     b.measuredDoorHeight<58||b.measuredDoorHeight>maxDoorHeight)){
  throw Error(id+' registration changed');
 }
 const prepared=await Promise.all(data.buildings.map(async b=>{
  const loadPart=async part=>{
   const asset=b.exports[part];
   if(!asset)return null;
   const image=await load(asset.sharedPath||base+asset.file,asset.dimensions);
   const width=image.cwSourceWidth||image.width;
   const height=image.cwSourceHeight||image.height;
   if(width!==asset.dimensions[0]||height!==asset.dimensions[1]){
    throw Error(id+' source dimensions changed '+b.id);
   }
   return b.finish&&part!=='emission'?createReuseFinishImage(image,b.finish):image;
  };
  const [full,walls,emission]=await Promise.all(['full','walls','emission'].map(loadPart));
  return {b,full,walls,emission};
 }));
 const objects=addSprites(prepared.map(({b,full,emission})=>[
  prefix+':'+b.id,full,b.p,b.anchor,b.scale,b.rect,
  {sceneryKind:'building',sourceAsset:id+':'+b.id,
   sourceParcel:b.parcel,retireId:b.retireId,distantReuse:true,cutawayEligible:true,
   nightEmission:emission}
 ]));
 for(const [i,{b,walls,emission}] of prepared.entries()){
  const object=objects[i],q=project(b.p);
  // Use the actual returned scale after image-density adjustment.
  const density=walls.cwDensity||1;
  const scale=b.scale/density;
  const hiddenAnchor=b.hiddenAnchor.map(v=>v*density);
  object.roofHidden={
   ...object,im:walls,scale,anchor:hiddenAnchor,
   bounds:[q.x-hiddenAnchor[0]*scale,q.y-hiddenAnchor[1]*scale,
    walls.width*scale,walls.height*scale],
   lightSource:object.id+':walls'
  };
  lightAnchors[object.id]=b.windowCentres;
  lightAnchors[object.id+':walls']=b.hiddenWindowCentres;
  if(emission)continue;
  CITY_GLASS[object.sourceAsset]={
   size:b.exports.full.dimensions,windows:b.panes,
   suppressed:b.windowCentres.map(p=>p.slice(0,2))
  };
  CITY_GLASS[object.id+':walls']={
   size:b.exports.walls.dimensions,windows:b.hiddenPanes,
   suppressed:b.hiddenWindowCentres.map(p=>p.slice(0,2))
  };
 }
 return Object.freeze({
  data,objects,
  replaces:rect=>data.buildings.some(b=>b.rect.every((v,i)=>Math.abs(v-rect[i])<1e-6)),
  report:()=>({
   id:data.id,ready:true,premises,distinctPaintings:premises,
   reusedPaintings:premises,minimumDonorDistance:Math.min(...data.buildings.map(b=>b.reuseDistanceWorld)),
   retiredParcels:data.buildings.map(b=>b.parcel),creativeAcceptance:false
  })
 });
}
