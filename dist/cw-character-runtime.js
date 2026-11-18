/* Shared source-faithful character rendering. No navigation or game-state rules. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.CWCharacters=api;(root.CW_R2_PARTS=root.CW_R2_PARTS||[]).push('cw-character-runtime.js');}})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 let recruitArt=null,recruitArtOpening=null;
 const preferenceKey='city_watch_lab01_appearance_v1';
 const defaultRecruit='watch-recruit';
 const recruits=["watch-recruit","watch-recruit-dark","watch-recruit-female","p3_human_01","p3_human_02","townswoman","young-citizen","p3_dwarf_01","p3_dwarf_02","dwarf-adventurer","p3_troll_01","p3_troll_02","p3_goblin_01","p3_goblin_02","goblin","p3_gnome_01","p3_gnome_02","gnome","p3_feegle_01","p3_feegle_02","blue-imp","p3_vampire_01","p3_vampire_02","vampire","p3_zombie_01","p3_zombie_02","ghoul","p3_werewolf_human_01","p3_werewolf_human_02","werefolk","p3_igor_01","p3_igor_02","p3_orc_01","p3_orc_02","p3_golem_01","p3_golem_02","p3_gargoyle_01","p3_gargoyle_02","p3_elf_01","p3_elf_02","p3_gnoll_01","p3_gnoll_02"];
 const heights={dwarf:44,feegle:12,gnome:12,goblin:40,troll:80,golem:78,gnoll:52,igor:54,orc:64,human:60,vampire:60,zombie:60,werewolf_human:60,elf:62};
 const roleHeights={'p3_named_colon_base':58,'p3_named_carrot_base':68,'p3_named_vimes_base':60,'p3_named_mrs_palm_base':60,'p3_named_street_urchin_base':40,colon:58,carrot:68,vimes:60,urchin:40,gnome:12,goblin:40,dwarf:44,'dwarf-adventurer':44,'dwarf-p2':44,'dwarf-guard':44,troll:80,'troll-p2':80,'troll-hooded':80};
 const number=(v)=>Number.isFinite(v)&&v>0;
 function hash(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
 function height(meta={},key){return meta.renderHeight??roleHeights[key]??heights[meta.species]??meta.height??60;}
 function previewLayout(meta,reference,width,heightPx,bounds={height:80,width:80}){
  const refHeight=height(reference,reference.id),referenceWidth=refHeight*reference.cellWidth/reference.visibleHeight;
  const zoom=Math.max(.1,Math.min(3.1,(heightPx-47)/bounds.height,width*.88/(bounds.width+referenceWidth+14)));
  return {zoom,mainHeight:height(meta,meta.id)*zoom,referenceHeight:refHeight*zoom,mainX:width*.35,referenceX:width*.80};
 }
 function validate(meta,image){
  if(!meta||!['cellWidth','cellHeight','cols','frames','visibleHeight'].every(k=>number(meta[k])))throw Error('Invalid character frame metadata');
  const rows=meta.rows||Math.ceil(meta.frames/meta.cols);
  if(!Number.isInteger(meta.cols)||!Number.isInteger(meta.frames)||meta.frames>meta.cols*rows||!Number.isFinite(meta.footX)||!Number.isFinite(meta.footY)||meta.footX<0||meta.footX>meta.cellWidth||meta.footY<0||meta.footY>meta.cellHeight)throw Error('Invalid character frame/foot registration');
  const w=image&&(image.naturalWidth||image.width),h=image&&(image.naturalHeight||image.height);
  if(image&&(w!==meta.cellWidth*meta.cols||h!==meta.cellHeight*rows))throw Error('Character atlas dimensions do not match its frame grid');
  for(const clip of Object.values(meta.clips||{}))if(!Array.isArray(clip)||!clip.length||clip.some(n=>!Number.isInteger(n)||n<0||n>=meta.frames))throw Error('Invalid character animation clip');
  return true;
 }
 function clip(meta,name='idle',facing=-1){
  const right=facing>0;
  if(meta.p3Full){const key=name+(right?'Right':'Left');return meta.clips?.[key]||Array.from({length:meta.cols},(_,i)=>(name==='walk'?meta.cols:0)+(right?2*meta.cols:0)+i);}
  return meta.clips?.[name]||meta[name]||(name==='walk'?[4,5,6,7]:[0,1,2,3]);
 }
 function frame(meta,pose={}){
  const name=pose.clip==='walk'?'walk':'idle',facing=pose.facing>0?1:-1,frames=clip(meta,name,facing),ms=meta.frameMS?.[name]||(name==='walk'?(meta.p3Full?80:125):(meta.p3Full?180:meta.idle?240:650));
  let tick=Number.isFinite(pose.frame)?Math.floor(pose.frame):Math.floor(Math.max(0,pose.elapsed||0)/ms);
  if(pose.reduced)tick=0;const index=frames[((tick%frames.length)+frames.length)%frames.length];
  if(!Number.isInteger(index)||index<0||index>=meta.frames)throw Error('Character animation selected an invalid frame');
  const native=meta.nativeFacing?.[name]||(name==='walk'&&meta.sourceKind==='extracted supplied frame'?'right':'left');
  return {index,sx:index%meta.cols*meta.cellWidth,sy:Math.floor(index/meta.cols)*meta.cellHeight,sw:meta.cellWidth,sh:meta.cellHeight,flip:!meta.p3Full&&((facing>0)!==(native==='right')),clip:name,facing};
 }
 function draw(g,meta,pose,x,y,drawHeight){
  const actions=globalThis.CWActionFrames,actionPose=actions?.poseFor(pose?.actorId||meta.id,pose,undefined,meta)||pose;
  const repaint=recruitArt?.draw(g,meta.id,actionPose||{},x,y,drawHeight??height(meta,meta.id));
  if(repaint)return repaint;
  const playerArt=globalThis.CWRacePlayer?.current;if(playerArt?.supports(meta.id)&&(actionPose?.playerRecruit||['player','battle:officer'].includes(actionPose?.actorId)||String(actionPose?.actorId||'').startsWith('race-folio:'))){playerArt.request(meta.id,actionPose);return playerArt.draw(g,meta,actionPose,x,y,drawHeight??height(meta,meta.id));}
  const actorId=String(actionPose?.actorId||'');
  const streetActor=actorId.startsWith('street-resident-')||actorId.startsWith('uu-')&&meta.id.startsWith('wizard-');
  const motionOnly=streetActor&&['idle','walk'].includes(actionPose?.clip||'idle')&&!actionPose?.clothing;
  const drawnAPI=globalThis.CWDrawnCharacters,drawnLibrary=drawnAPI?.current;
  // An authored atlas can exist without supporting a previously saved head or
  // outfit. Preserve that appearance using its existing cosmetic renderer.
  if(drawnLibrary?.entries[meta.id]&&drawnAPI.compatible(meta,actionPose)){
   const drawn=drawnLibrary.draw(g,meta,actionPose,x,y,drawHeight??height(meta,meta.id));
   if(drawn)return drawn;
   drawnLibrary.request(meta.id,{motionOnly});return false;
  }
  const wardrobe=globalThis.CWClothing;
  let dressed=pose?.clothing&&wardrobe?.compose?wardrobe.compose(meta,pose.clothing,pose.head??true):pose?.clothing&&wardrobe?wardrobe.dress(meta,pose.clothing):meta;
  if((pose?.clothing||pose?.head)&&globalThis.CWHeads&&!(pose?.clothing&&wardrobe?.compose))dressed=globalThis.CWHeads.dress(dressed,pose.head??true);
  const image=dressed.atlasImage;if(!image||(image.complete===false)||!(image.naturalWidth||image.width))return false;
  const action=actions?.render(g,meta,image,actionPose||pose,x,y,drawHeight??height(meta,meta.id));if(action)return {...frame(meta,pose),...action};
  const f=frame(meta,pose),scale=(drawHeight??height(meta,meta.id))/meta.visibleHeight;
  if(!number(scale)||!Number.isFinite(x)||!Number.isFinite(y))return false;
  g.save();try{g.translate(x,y);if(f.flip)g.scale(-1,1);g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(image,f.sx,f.sy,f.sw,f.sh,-meta.footX*scale,-meta.footY*scale,meta.cellWidth*scale,meta.cellHeight*scale);}finally{g.restore();}return f;
 }
 function movement(previous,position,now,space='world',travel={}){
  let a=previous;if(!a||a.space!==space)a={x:position[0],y:position[1],space,facing:-1,lastMove:-Infinity,walkStart:now,moving:false};
  const dx=position[0]-a.x,dy=position[1]-a.y,distance=Math.hypot(dx,dy);
  if(distance>.004&&distance<3){if(!a.moving)a.walkStart=now;const sx=dx-dy;if(!Number.isFinite(travel.screenX)&&Math.abs(sx)>.002)a.facing=sx>0?1:-1;a.lastMove=now;}
  else if(distance>=3){a.lastMove=-Infinity;a.walkStart=now;}
  if(Number.isFinite(travel.screenX)&&Number.isFinite(a.screenX)&&Math.abs(travel.screenX-a.screenX)>.002)a.facing=travel.screenX>a.screenX?1:-1;
  if(Number.isFinite(travel.screenX))a.screenX=travel.screenX;
  const moving=typeof travel.moving==='boolean'?travel.moving:now-a.lastMove<145;
  if(moving&&!a.moving)a.walkStart=now;
  a.x=position[0];a.y=position[1];a.moving=moving;return a;
 }
 // Presentation only: interpolate accepted adjacent grid positions in elapsed time.
 // Logical collision, route consumption, interactions and saves stay with callers.
 function createWalkMotion({stepMS=115,maxQueue=6,canInterpolateDiagonal=()=>false}={}){
  let logical=null,visual=null,space=null,queue=[],lastAccepted=-Infinity,lastSample=null,paused=false;
  const same=(a,b)=>a&&b&&a[0]===b[0]&&a[1]===b[1];
  function reset(p,now=0,nextSpace='world',visualStart=p){
   logical=p.slice();visual=visualStart.slice();space=nextSpace;queue=[];lastAccepted=-Infinity;lastSample=now;paused=false;return visual.slice();
  }
  function sample(now,{pause=false,reduced=false}={}){
   if(!visual)return null;
   if(lastSample!==null&&now-lastSample>250&&!pause&&!paused){visual=logical.slice();queue=[];}
   if(reduced){visual=logical.slice();queue=[];lastSample=now;paused=pause;return visual.slice();}
   // Modal/hidden time never becomes catch-up animation on return.
   if(pause||paused){const gap=Math.max(0,now-(lastSample??now));for(const s of queue)s.start+=gap;}
   lastSample=now;paused=pause;
   if(!pause)while(queue.length){const s=queue[0],t=Math.max(0,Math.min(1,(now-s.start)/s.duration));
    visual=s.to.slice();visual[0]=s.from[0]+(s.to[0]-s.from[0])*t;visual[1]=s.from[1]+(s.to[1]-s.from[1])*t;
    if(t<1)break;queue.shift();
   }
   // Coordinates interpolate; route/depth identity follows the complete latest
   // accepted state, including a zero-distance transfer between adjoining edges.
   visual=[visual[0],visual[1],...logical.slice(2)];
   return visual.slice();
  }
  function accept(p,now=0,nextSpace='world',duration){
   if(!logical||space!==nextSpace)return reset(p,now,nextSpace);
   if(same(logical,p)){logical=p.slice();return sample(now,{pause:paused});}
   const old=logical.slice(),distance=Math.abs(p[0]-old[0])+Math.abs(p[1]-old[1]);
   // A teleport, skipped input sample or scene transition must never cut a corner.
   const diagonal=Math.abs(p[0]-old[0])===1&&Math.abs(p[1]-old[1])===1&&canInterpolateDiagonal(old.slice(),p.slice());
   if((Math.abs(distance-1)>.001&&!diagonal)||queue.length>=maxQueue)return reset(p,now,nextSpace);
   sample(now,{pause:paused});logical=p.slice();visual=[visual[0],visual[1],...logical.slice(2)];
   if(queue.length===1&&same(queue[0].from,p)){
    const prior=queue[0],remaining=Math.hypot(visual[0]-p[0],visual[1]-p[1]),length=Math.hypot(prior.to[0]-prior.from[0],prior.to[1]-prior.from[1]);
    queue=remaining<.0001?[]:[{from:visual.slice(),to:p.slice(),start:now,duration:Math.max(1,prior.duration*remaining/(length||1))}];lastAccepted=now;return visual.slice();
   }
   const interval=now-lastAccepted,ms=duration??(interval>=8&&interval<=240?interval:stepMS*(diagonal?Math.SQRT2:1));
   const tail=queue.at(-1),start=tail?tail.start+tail.duration:now;
   queue.push({from:tail?old:visual.slice(),to:p.slice(),start,duration:Math.max(8,duration===undefined?Math.min(240,ms):ms)});lastAccepted=now;
   // Fast keyboard repeat must not leave the recruit several cells behind.
   // Compress the remaining segments in place, retaining every cleared corner.
   const budget=Math.max(45,ms*2);
   if(queue.length>1&&queue.at(-1).start+queue.at(-1).duration-now>budget){
    let from=visual.slice(),distance=0;for(const s of queue){distance+=Math.abs(s.to[0]-from[0])+Math.abs(s.to[1]-from[1]);from=s.to;}
    let start=now;from=visual.slice();queue=queue.map(s=>{const duration=Math.max(1,budget*(Math.abs(s.to[0]-from[0])+Math.abs(s.to[1]-from[1]))/(distance||1)),next={from:from.slice(),to:s.to.slice(),start,duration};from=s.to;start+=duration;return next;});
   }
   return visual.slice();
  }
  function finishWithin(now=0,milliseconds=50){
   sample(now,{pause:paused});if(paused||!queue.length)return visual?.slice();
   const budget=Math.max(16,Math.min(80,Number(milliseconds)||50));let from=visual.slice(),length=0;
   for(const segment of queue){length+=Math.hypot(segment.to[0]-from[0],segment.to[1]-from[1]);from=segment.to;}
   let start=now;from=visual.slice();queue=queue.map(segment=>{const distance=Math.hypot(segment.to[0]-from[0],segment.to[1]-from[1]),duration=Math.max(1,budget*distance/(length||1));const next={from:from.slice(),to:segment.to.slice(),start,duration};start+=duration;from=segment.to;return next;});return visual.slice();
  }
  return {reset,accept,sample,finishWithin,report:()=>({logical:logical?.slice(),visual:visual?.slice(),queued:queue.length,space,paused})};
 }
 const preferenceCache=new WeakMap();let sessionChoice=null;
 if(typeof addEventListener==='function')addEventListener('storage',e=>{if(e.key===preferenceKey||e.key===null){sessionChoice=null;const s=rootStorage();if(s)preferenceCache.delete(s);}});
 function selected(fallback=defaultRecruit,storage){
  if(!storage&&sessionChoice)return sessionChoice;let value;
  try{const s=storage||rootStorage();if(s&&preferenceCache.has(s))value=preferenceCache.get(s);else{value=s?.getItem(preferenceKey);if(!recruits.includes(value)){const old=JSON.parse(s?.getItem('city_watch_lab01_v01_player')||'null');value=old?.flags?.peopleAppearanceP1;}if(s)preferenceCache.set(s,value);}}catch{}
  return recruits.includes(value)?value:recruits.includes(fallback)?fallback:defaultRecruit;
 }
 function rootStorage(){try{return typeof localStorage!=='undefined'?localStorage:null;}catch{return null;}}
 function saveSelected(key,storage){if(!recruits.includes(key))return false;if(!storage)sessionChoice=key;try{const s=storage||rootStorage();if(!s)return false;preferenceCache.set(s,key);s.setItem(preferenceKey,key);return true;}catch{return false;}}
 function motionPreference(){
  const m=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  return {get reduced(){return !!m?.matches;},listen(fn){m?.addEventListener?.('change',fn);return()=>m?.removeEventListener?.('change',fn);}};
 }
 async function createLibrary({baseURL,read,load,maxDecodedBytes=24*1024*1024,drawn}={}){
  const base=baseURL||(typeof document!=='undefined'?document.baseURI:'http://localhost/'),url=p=>new URL(p,base).href;
  let drawnLibrary=drawn||null;if(!drawnLibrary&&typeof document!=='undefined'&&!read&&!load){await import(url('cw-drawn-characters.js?v=p21-b407-s039-reuse'));drawnLibrary=await globalThis.CWDrawnCharacters.open(base);}
  if(typeof document!=='undefined'&&!read&&!load){
   await import(url('cw-race-player.js?v=p21-b407-s039-reuse'));
   await globalThis.CWRacePlayer.open(base);
   recruitArtOpening ||= import(url('cw-recruit-art-v2.mjs')).then(({openRecruitArt})=>
    openRecruitArt(base,globalThis.CWDrawnCharacters.getImageLoader())).then(value=>{recruitArt=value;})
    .catch(()=>{recruitArtOpening=null;});
   await recruitArtOpening;
  }
  function ensureRecruitArt(key,pose={},pin=false){return recruitArt?.ensure(key,pose,pin).catch(()=>false)||Promise.resolve(false);}
  const readManifest=read||((p)=>fetch(p).then(r=>{if(!r.ok)throw Error('Character catalogue could not load');return r.json();}));
  const manifest=await readManifest(url('assets/characters/manifest.json?v=p21-b407-s039-reuse')),entries={...manifest.assets,...Object.fromEntries((drawnLibrary?.manifest.expectedWizardIds||[]).map(id=>[id,drawnLibrary.entries[id]]))},cache=new Map(),pending=new Map(),errors=new Map();let decodedBytes=0;const pinned=new Set([defaultRecruit]);
  if(manifest.schemaVersion!==1||!entries||!entries[defaultRecruit])throw Error('Character catalogue is invalid');
  // Keep custom loaders intact. Default legacy atlases and portraits must use the
  // same queue as drawn atlases; a retained-byte budget cannot bound active decodes.
  let image=load;
  if(!image){let loaders=globalThis.CWDrawnCharacters;if(!loaders){if(typeof module==='object'&&module.exports)loaders=require('./cw-drawn-characters.js');else{await import(url('cw-drawn-characters.js?v=p21-b407-s039-reuse'));loaders=globalThis.CWDrawnCharacters;}}image=loaders.getImageLoader();}
  function get(key){const a=cache.get(key);if(a){cache.delete(key);cache.set(key,a);}return a?.borrowedDrawnAtlas?{...a,atlasImage:drawnLibrary.get(key)?.atlasImage,motionOnly:!!drawnLibrary.get(key)?.motionOnly}:a;}
  function evict(){for(const [key,a]of cache){if(decodedBytes<=maxDecodedBytes)break;if(pinned.has(key))continue;cache.delete(key);decodedBytes-=a.decodedBytes;}}
  async function ensure(key,{motionOnly=false}={}){
   if(!motionOnly)await ensureRecruitArt(key);
   if(cache.has(key)){if(drawnLibrary)await drawnLibrary.ensure(key,base,{motionOnly});return get(key);}if(pending.has(key)){await pending.get(key);if(drawnLibrary)await drawnLibrary.ensure(key,base,{motionOnly});return get(key);}if(!entries[key])throw Error('Unknown character appearance');
   const p=(async()=>{const drawnReady=drawnLibrary?await drawnLibrary.ensure(key,base,{motionOnly}):null,borrowedDrawnAtlas=!!drawnReady&&(!!globalThis.CWRacePlayer?.current?.supports(key)||!!drawnLibrary.manifest.expectedWizardIds?.includes(key)),meta={...(borrowedDrawnAtlas?drawnLibrary.entries[key]:entries[key])},portraitSource=drawnLibrary?.entries[key],atlasImage=borrowedDrawnAtlas?drawnReady?.atlasImage:await image(url(meta.atlas));if(!atlasImage)throw Error('Character atlas unavailable');if(borrowedDrawnAtlas&&drawnReady.motionOnly){validate(meta);if(atlasImage.width!==meta.cellWidth*meta.cols||atlasImage.height!==meta.cellHeight*2)throw Error('Drawn motion prefix mismatch');}else validate(meta,atlasImage);if(portraitSource?.portrait&&portraitSource.portrait!==meta.portrait){meta.portrait=portraitSource.portrait;meta.portraitCrop=portraitSource.portraitCrop;}let portraitImage=null;try{portraitImage=await image(url(drawnLibrary?.entries[key]?.portrait||meta.portrait)+(drawnLibrary?.entries[key]?.artRevision?'?v='+drawnLibrary.entries[key].sha256.slice(0,12):''));}catch{}const bytes=(borrowedDrawnAtlas?0:atlasImage.width*atlasImage.height*4)+(portraitImage?portraitImage.width*portraitImage.height*4:0),a={...meta,...(borrowedDrawnAtlas?{}:{atlasImage}),portraitImage,decodedBytes:bytes,borrowedDrawnAtlas};cache.set(key,a);decodedBytes+=bytes;errors.delete(key);evict();return borrowedDrawnAtlas?{...a,atlasImage,motionOnly:!!drawnReady.motionOnly}:a;})();pending.set(key,p);
   try{return await p;}catch(e){errors.set(key,String(e.message||e));throw e;}finally{pending.delete(key);}
  }
  return {manifest,entries,ensure,get,ensureRecruitArt,request(key,options={}){if(!cache.has(key)&&!pending.has(key)&&!errors.has(key))ensure(key,options).catch(()=>{});},retry(key){errors.delete(key);return ensure(key);},pin(keys){pinned.clear();pinned.add(defaultRecruit);keys.filter(k=>entries[k]).forEach(k=>pinned.add(k));drawnLibrary?.pin?.([...pinned]);evict();},report:()=>({catalogue:Object.keys(entries).length,decoded:cache.size,decodedBytes,maxDecodedBytes,pinned:pinned.size,imageLoader:image.report?.()||null,drawn:drawnLibrary?.report(),pending:pending.size,errors:[...errors].map(([key,message])=>({key,message}))})};
 }
 return Object.freeze({version:'2.0-authored-frames',preferenceKey,defaultRecruit,recruits,hash,height,previewLayout,validate,clip,frame,draw,movement,createWalkMotion,selected,saveSelected,motionPreference,createLibrary});
});
