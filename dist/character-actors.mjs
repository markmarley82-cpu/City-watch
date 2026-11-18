import './cw-action-frames.js?v=p21-b407-s039-reuse';
import './cw-action-rigs-data.js?v=p21-b407-s039-reuse';
import './cw-character-runtime.js?v=recruit-art-v2';
import './cw-clothing.js?v=p21-b407-s039-reuse';
import {openCharacterStudio} from './character-studio.mjs?v=p21-b461-watch-ui';
export async function createActorPainter({baseURL=new URL('./',import.meta.url),stepMS=115,canInterpolateDiagonal=()=>false,durationForStep=null}={}){
 const C=window.CWCharacters,library=await C.createLibrary({baseURL}),preference=C.motionPreference(),motion=new Map(),drawn=new Map(),retained=new Set();let playerKey=C.selected(),selectionToken=0;
 const racePlayer=window.CWRacePlayer.current;const playerEnsure=async key=>{const [meta]=await Promise.all([racePlayer.supports(key)?racePlayer.ensure(key):library.ensure(key),library.ensureRecruitArt(key,{clothing:true,head:true},true)]);return meta;};const pin=()=>{library.pin([playerKey,...retained]);racePlayer.pin(playerKey);};pin();await Promise.all([...new Set([C.defaultRecruit,playerKey,'p3_named_colon_base'])].map(k=>k===playerKey?playerEnsure(k):library.ensure(k)));
 if(!racePlayer.supports(playerKey))await window.CWDrawnCharacters.current.ensureAppearance(playerKey,{clothing:true,head:true},baseURL);
 async function syncAppearance(){
  const token=++selectionToken,key=C.selected(),current=()=>token===selectionToken&&key===C.selected();
  // The folio pins its preview; restore the shared street roster immediately.
  pin();
  if(key===playerKey)return;
  await playerEnsure(key);if(!current())return;
  if(!racePlayer.supports(key))await window.CWDrawnCharacters.current.ensureAppearance(key,{clothing:true,head:true},baseURL);
  // The outfit load can complete after a newer storage or folio event.
  if(!current())return;
  playerKey=key;pin();
 }
 window.addEventListener('storage',e=>{if(e.key===C.preferenceKey||e.key===null)syncAppearance().catch(()=>{});});
 window.addEventListener('cw-character-change',()=>syncAppearance().catch(()=>{}));
 if(C.selected()!==playerKey)syncAppearance().catch(()=>{});
 const streetKeys=new Map(),streetExtents=new Map();
 function residentBounds(id,q){
  const key=streetKeys.get(id);
  if(!key)return null;
  if(!streetExtents.has(key)){
   const base=library.entries[key],art=window.CWDrawnCharacters.current?.entries[key]||base;
   if(!art||!base)return null;
   const height=Math.max(C.height(base,key),C.height(art,key)),scale=height/art.visibleHeight;
   // Enclose either facing of the authored frame and the ground shadow.
   const halfWidth=Math.max(5,height*.19,Math.max(art.footX,art.cellWidth-art.footX)*scale);
   const above=Math.max(2,height*.06,art.footY*scale);
   const below=Math.max(2,height*.06,(art.cellHeight-art.footY)*scale);
   streetExtents.set(key,[halfWidth,above,below]);
  }
  const [halfWidth,above,below]=streetExtents.get(key);
  return [q.x-halfWidth,q.y-above,halfWidth*2,above+below];
 }
 const walks=new Map(),directActors=new Map(),routeOrigins=new Map(),acceptedDurations=new Map();
 function position(p,id,now=performance.now(),pause=false){
  directActors.delete(id);
  let walk=walks.get(id);if(!walk){walk=C.createWalkMotion({stepMS,canInterpolateDiagonal});walks.set(id,walk);}
  walk.sample(now,{pause,reduced:preference.reduced});const from=walk.report().logical;const duration=from&&durationForStep?durationForStep(from,p):undefined;walk.accept(p,now,'world',duration);return walk.sample(now,{pause,reduced:preference.reduced});
 }
 // Register movement at acceptance time, even if no graphics frame runs.
 function acceptMove(from,to,id,now=performance.now(),duration){
  directActors.delete(id);
  let walk=walks.get(id);if(!walk){walk=C.createWalkMotion({stepMS,canInterpolateDiagonal});walks.set(id,walk);}
  const logical=walk.report().logical;
  if(!logical||logical[0]!==from[0]||logical[1]!==from[1])walk.reset(from,now,'world');
  walk.sample(now,{reduced:preference.reduced});const origin=routeOrigins.get(id),length=Math.hypot(to[0]-from[0],to[1]-from[1]);if(origin&&length){const whole=durationForStep?durationForStep(from,to):length,remaining=durationForStep?durationForStep(origin,to):Math.hypot(to[0]-origin[0],to[1]-origin[1]);duration=(duration??stepMS*length)*remaining/whole;routeOrigins.delete(id);}const ms=duration??(durationForStep?durationForStep(from,to):undefined);acceptedDurations.set(id,ms);walk.accept(to,now,'world',ms);
  return walk.sample(now,{reduced:preference.reduced});
 }
 function place(p,id,now=performance.now(),moving=false){routeOrigins.delete(id);let walk=walks.get(id);if(!walk){walk=C.createWalkMotion({stepMS,canInterpolateDiagonal});walks.set(id,walk);}walk.reset(p,now,'world');directActors.set(id,moving);return p.slice();}
 function routeFrom(anchor,foot,id,now=performance.now()){directActors.delete(id);routeOrigins.set(id,foot.slice());let walk=walks.get(id);if(!walk){walk=C.createWalkMotion({stepMS,canInterpolateDiagonal});walks.set(id,walk);}walk.reset(anchor,now,'world',foot);}
 function draw(g,p,id,project,now=performance.now()){
  const streetMotion=streetKeys.has(id)||id.startsWith('uu-');
  const key=id==='player'?playerKey:(streetKeys.get(id)||window.CWP21Game?.actors.find(a=>a.id===id)?.key||{'news-times':'p3_human_01','news-inquirer':'p3_human_02',vimes:'p3_named_vimes_base',carrot:'p3_named_carrot_base',palm:'p3_named_mrs_palm_base',witness:'p3_named_street_urchin_base',igor:'igor'}[id]||'p3_named_colon_base'),a=id==='player'&&racePlayer.supports(key)?racePlayer.get(key):key.startsWith('mentor-')?window.CWDrawnCharacters.current.get(key):library.get(key);if(!a){if(key.startsWith('mentor-'))window.CWDrawnCharacters.current.request(key);else library.request(key,{motionOnly:streetMotion});return false;}
  const q=project(p),walk=walks.get(id),travel=walk?{moving:directActors.has(id)?directActors.get(id):walk.report().queued>0,screenX:q.x}:{screenX:q.x},m=C.movement(motion.get(id),p,now,'world',travel);motion.set(id,m);
  const h=C.height(a,key),pose={actorId:id,weapon:id==='player'?'truncheon':undefined,clip:m.moving?'walk':'idle',elapsed:m.moving?now-m.walkStart:now+C.hash(id)%9000,facing:m.facing,reduced:preference.reduced,clothing:id==='player'};
  g.save();g.fillStyle='#15241d80';g.beginPath();g.ellipse(q.x,q.y,Math.max(5,h*.19),Math.max(2,h*.06),0,0,Math.PI*2);g.fill();const frame=C.draw(g,a,pose,q.x,q.y,h);if(id==='player'&&frame.drawn)window.CWWeaponArt?.draw(g,a,pose,q.x,q.y,h,window.CWP21Game?.weaponArtId);g.restore();if(id==='patrol-partner'){const scene=document.getElementById('city-scene');scene.dataset.partner=key;scene.dataset.partnerDrawn=String(!!frame.drawn);scene.dataset.partnerFrame=String(frame.index);scene.dataset.partnerClip=frame.clip;scene.dataset.partnerPosition=JSON.stringify(p);}
 drawn.set(id,{key,height:h,head:window.CWHeads?.selected(key)||'original',drawnWardrobe:!!frame.drawnWardrobe,equipment:frame.equipment,recruitArt:frame.recruitArt,frame:frame.index,provenance:frame.drawn?'drawn-poses':'legacy-cosmetic',clip:frame.clip,facing:m.facing,position:p.slice(0,2)});return true;
 }
 return {library,residentBounds,retain:keys=>{for(const key of keys)retained.add(key);pin();},register:(id,key)=>{streetKeys.set(id,key);library.request(key,{motionOnly:true});},draw,position,acceptMove,place,routeFrom,duration:id=>acceptedDurations.get(id),settle:(id,now=performance.now(),ms=50)=>walks.get(id)?.finishWithin?.(now,ms),get playerKey(){return playerKey;},get playerMeta(){return racePlayer.get(playerKey)||library.get(playerKey);},openStudio:()=>openCharacterStudio({library,onSelect:playerEnsure}),report:()=>({version:C.version,playerKey,reducedMotion:preference.reduced,cache:library.report(),clothing:window.CWClothing?.selected(playerKey),wardrobe:window.CWClothing?.report(),drawn:Object.fromEntries(drawn),motion:Object.fromEntries([...walks].map(([id,w])=>[id,w.report()]))})};
}
