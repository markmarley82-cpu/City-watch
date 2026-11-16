// Original gameplay door bindings on retained premises. No street, wall or water
// geometry is changed; every approach must already belong to the current world.
import {streetPath} from '../city-movement.mjs?v=p21-b407-s039-reuse';
const SHOP_KEYS=['provisions','cobbler','tailor','ironmonger','lamp-supplier','stationer','apothecary','used-goods','gimlet','shonky','burleigh-stronginthearm','wienrich-boettcher','curry-gardens','boffo','poleforth','drayman','pointer-pickles','shatta','ironcrust','laughing-falafel','crumleys','hugos'];
const shopSpecs=[
 {key:'provisions',name:'University corner provisions',asset:'UU-SHOPLANE-004:corner-grocer',opening:0},
 {key:'apothecary',name:'Shades herbalist and dressings',asset:'SHADES-002:herbalist',publicFrontage:true},
 {key:'used-goods',name:'Shades second-hand counter',asset:'SHADES-002:pawnbroker',publicFrontage:true},
 {key:'tailor',name:'University seamstress',asset:'UU-UNIQUE-009:seamstress',opening:0},
 {key:'stationer',name:'University leather-binder and stationer',asset:'UU-UNIQUE-009:leather-binder',opening:0},
 {key:'ironmonger',name:'University locksmith and ironwork',asset:'UU-UNIQUE-009:locksmith',opening:0},
 {key:'lamp-supplier',name:'University corner chandler',asset:'UU-UNIQUE-009:corner-chandler',opening:0}
];
const plainClone=v=>JSON.parse(JSON.stringify(v));
const idFor=(kind,key)=>'service:'+kind+':'+key;
// These approaches and route lengths were verified against the complete Build
// 508 street graph. Runtime still checks the exact current frontage, member,
// clearance, collision and occupancy predicates. Any source drift falls back
// to the live route search instead of accepting a stale registration.
const VERIFIED_APPROACHES=new Map(Object.entries({
 'shop:cobbler':[[73,66],'APRON:crypt',100],
 'shop:provisions':[[183,249],'E061',126],
 'shop:apothecary':[[79,254],'E048',132],
 'shop:used-goods':[[82,219],'E034',98],
 'shop:tailor':[[179,283],'E008',198],
 'shop:stationer':[[154,269],'E009',140],
 'shop:ironmonger':[[156,285],'E008',155],
 'shop:lamp-supplier':[[141,291],'P015-03',176],
 'lodging:1':[[63,230],'E045',115],
 'lodging:2':[[46,129],'E044',147],
 'lodging:3':[[174,262],'E061',136],
 'lodging:4':[[184,273],'E008',218]
}));
const memberKey=p=>p.slice(0,2).join(',');
const inRect=(p,r)=>p[0]>=r[0]&&p[0]<=r[0]+r[2]&&p[1]>=r[1]&&p[1]<=r[1]+r[3];
function cellsIn(r){const out=[];for(let y=Math.ceil(r[1]);y<=Math.floor(r[1]+r[3]);y++)for(let x=Math.ceil(r[0]);x<=Math.floor(r[0]+r[2]);x++)out.push([x,y]);return out;}
function outsideFoundation(p,r){return !inRect(p,[r[0]-.5,r[1]-.5,r[2],r[3]]);}
function approachCandidates(instance,clearance){
 if(clearance)return cellsIn(clearance);
 // Older lodging source has no measured opening. This is an explicitly marked
 // public frontage approach, not a claim that its painted sill was surveyed.
 const r=instance.rect,anchor=instance.p;
 const xs=[];for(let y=Math.floor(r[1]-2);y<=Math.ceil(r[1]+r[3]+2);y++)for(let x=Math.floor(r[0]-2);x<=Math.ceil(r[0]+r[2]+2);x++){
  const p=[x,y];if(!outsideFoundation(p,r))continue;
  const dx=Math.max(r[0]-.5-x,0,x-(r[0]+r[2]-.5)),dy=Math.max(r[1]-.5-y,0,y-(r[1]+r[3]-.5));
  if(Math.hypot(dx,dy)<=1.6)xs.push(p);
 }
 return xs.sort((a,b)=>Math.hypot(a[0]-anchor[0],a[1]-anchor[1])-Math.hypot(b[0]-anchor[0],b[1]-anchor[1]));
}
export async function buildWorldServices({world,clearPoint=()=>true,occupied=()=>false,read,origin=[126,132,'RC1']}={}){
 if(!world?.doors||!world?.members)throw Error('Current compiled city required');
 const readJSON=read||(async file=>{const response=await fetch(new URL(file,import.meta.url));if(!response.ok)throw Error('Service frontage source unavailable');return response.json();});
 const [university,shades,wharfinger,lodging]=await Promise.all([
  readJSON('../assets/uu-streets-v18/manifest.json'),readJSON('../assets/shades-streets-v1/manifest.json'),readJSON('../assets/wharfinger-002/manifest.json'),readJSON('lodging-placements.json')
 ]);
 const records=[],unbound=[],reserved=new Set([...world.doors.values()].map(d=>memberKey(d.position))),lookup=new Map();
 const currentInstances=[...university.instances,...shades.instances,...wharfinger.instances];
 function exactVerifiedApproach(spec,candidates){
  const verified=VERIFIED_APPROACHES.get(spec.kind+':'+spec.key);if(!verified)return null;
  const [p,edge,routeLength]=verified,k=memberKey(p);
  if(!candidates.some(q=>memberKey(q)===k)||reserved.has(k)||world.wet(p)||world.solid.has(k)||!clearPoint(p)||occupied(p)||!world.members.get(k)?.has(edge))return null;
  return {position:p.slice(),edge,routeLength,verified:true};
 }
 function resolveApproach(spec,candidates){
  const verified=exactVerifiedApproach(spec,candidates);if(verified)return verified;
  for(const p of candidates){const memberships=world.members.get(memberKey(p));if(!memberships||reserved.has(memberKey(p))||world.wet(p)||world.solid.has(memberKey(p))||!clearPoint(p)||occupied(p))continue;
   for(const edge of [...memberships].sort()){const route=streetPath(world,origin,p,edge,{occupied});if(route!==null)return {position:p.slice(),edge,routeLength:route.length};}
  }return null;
 }
 function add(spec,instance,clearance,candidates){
  const id=idFor(spec.kind,spec.key),existing=world.doors.get(id),allowed=candidates||approachCandidates(instance,clearance);
  if(existing){
   // Idempotence may retain this module's own verified registration, but an ID
   // collision must never silently relabel another door or bypass new geometry.
   const matching=existing.game_id===id&&!existing.held&&existing.source_instance===(instance?.id||spec.source)&&
    (spec.kind==='shop'?existing.shop_key===spec.key:existing.lodging_grade===Number(spec.key))&&
    Array.isArray(existing.position)&&![...world.doors].some(([otherId,d])=>otherId!==id&&memberKey(d.position)===memberKey(existing.position))&&allowed.some(p=>memberKey(p)===memberKey(existing.position))&&
    world.members.get(memberKey(existing.position))?.has(existing.edge)&&!world.wet(existing.position)&&
    !world.solid.has(memberKey(existing.position))&&clearPoint(existing.position)&&
    streetPath(world,origin,existing.position,existing.edge,{occupied})!==null;
   if(!matching){unbound.push({kind:spec.kind,key:spec.key,reason:'Existing service ID has an incompatible or no longer reachable door'});return null;}
   records.push(existing);lookup.set(spec.kind+':'+spec.key,existing);return existing;
  }
  const at=resolveApproach(spec,allowed);
  if(!at){unbound.push({kind:spec.kind,key:spec.key,source:instance?.id||spec.source,reason:'No existing reachable clear approach in the retained frontage'});return null;}
  const d={game_id:id,lf_id:'CITY SERVICE',name:spec.name,position:at.position,edge:at.edge,held:false,
   ...(spec.kind==='shop'?{shop_key:spec.key}:{lodging_grade:Number(spec.key)}),
   source_instance:instance?.id||spec.source,source_asset:instance?.asset||spec.source,
   approach_basis:clearance?'Authored current doorway clearance':candidates?'Existing measured public landing':'Existing public frontage; painted sill not surveyed',
   case_function_preserved:'Original gameplay service on retained premises; no canonical address or proprietor claimed.',route_length_from_watch:at.routeLength,verified_approach_cache:!!at.verified};
  world.doors.set(id,d);reserved.add(memberKey(at.position));records.push(d);lookup.set(spec.kind+':'+spec.key,d);return d;
 }
 add({kind:'shop',key:'cobbler',name:'Dimwell cobbler workshop',source:'DIMWELL-001'},null,null,[[73,66]]);
 for(const spec of shopSpecs){const i=currentInstances.find(i=>i.asset===spec.asset),clearance=i?.entrance_clearances?.[spec.opening];
  if(!i||(!clearance&&!spec.publicFrontage)){unbound.push({kind:'shop',key:spec.key,reason:'Authored frontage opening unavailable'});continue;}
  add({...spec,kind:'shop'},i,clearance);
 }
 for(const proposal of lodging.placements){
  if(proposal.grade===0){const watch=world.doors.get('watch');if(watch&&!watch.held){const d={...watch,lodging_grade:0,shared_entrance:true,source_instance:'watch',approach_basis:'Existing Watch House entrance'};records.push(d);lookup.set('lodging:0',d);}continue;}
  const i=currentInstances.find(i=>i.id===proposal.instance||i.id===proposal.existingAsset||i.asset===proposal.existingAsset);
  if(!i){unbound.push({kind:'lodging',key:String(proposal.grade),reason:'Retained lodging instance unavailable'});continue;}
  // Current fitted geometry supersedes the older proposal's approximate clearance.
  add({kind:'lodging',key:String(proposal.grade),name:'Grade '+proposal.grade+' lodging · '+proposal.area},i,i.entrance_clearances?.[0]);
 }
 return Object.freeze({bindings:records,unbound,doorForShop:key=>lookup.get('shop:'+key)||null,doorForLodging:grade=>lookup.get('lodging:'+grade)||null,
  report:()=>({bindings:plainClone(records),unbound:plainClone(unbound),directoryOnlyShopKeys:SHOP_KEYS.filter(k=>!lookup.has('shop:'+k)),missingLodgingGrades:lodging.placements.filter(p=>!lookup.has('lodging:'+p.grade)).map(p=>p.grade),newWalkingCells:0,newFootprints:0,canonicalAddressesAdded:0})});
}
