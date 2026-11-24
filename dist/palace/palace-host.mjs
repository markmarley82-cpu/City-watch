import {createRoomSession,canStand} from '../guild-interiors/room-core.mjs?v=p21-b407-s039-reuse';
import {createGuildCampaign} from '../guild-interiors/guild-campaign.mjs?v=p21-b407-s039-reuse';
import {civicRoomMarkup,createCivicRoomView,loadCivicRoomStyles} from '../guild-interiors/civic-room-view.mjs?v=1';
import {createInteriorLightingClock} from '../city-clock.mjs?v=b507';
// Production Palace interior uses the retained room collision and campaign ledger.
// Its own flag keeps Palace room records separate from existing guild visits.
export async function createPalaceHost({city,makeStore}){
 const room=await(await fetch('palace/reception.json?v=palace004')).json();
 const readLighting=createInteriorLightingClock(()=>makeStore().read().state,()=>location.search);
 const presentation=createCivicRoomView(room);
 let styleReady;
 function loadStyle(){
  return styleReady??=Promise.all([loadCivicRoomStyles(document),new Promise(resolve=>{
   const link=document.createElement('link');link.rel='stylesheet';link.href='palace/palace.css?v=p21-b503-palace-reception';
   link.onload=()=>resolve(true);
   link.onerror=()=>{link.remove();styleReady=null;resolve(false);};
   document.head.append(link);
  })]).then(results=>{const ok=results.every(Boolean);if(!ok)styleReady=null;return ok;});
 }
 loadStyle();
 const dialog=document.createElement('dialog');dialog.id='cw-palace-host';dialog.className='cw-interior-opening';dialog.setAttribute('aria-label','Patrician’s Palace reception');
 const root=document.createElement('div');root.innerHTML=civicRoomMarkup('palace');const panel=document.createElement('section');panel.className='cw-opening-panel';
 panel.innerHTML='<p role="status">Opening the Palace…</p><button type="button">Cancel</button>';
 dialog.append(panel,root);document.body.append(dialog);
 const $=id=>root.querySelector('#palace-'+id),canvas=$('room-canvas'),g=canvas.getContext('2d'),status=$('room-status');
 $('room-select').closest('label').hidden=true;root.querySelector('.preview-note').hidden=true;root.querySelector('.room-header small').textContent='CITY WATCH · PATRICIAN’S PALACE';$('room-name').textContent='Public reception';$('exit').textContent='Return to forecourt';$('reenter').hidden=true;$('zoom').textContent='Whole room';canvas.dataset.palaceInput='5';canvas.setAttribute('aria-label','Palace reception. Drag to steer, tap clear floor to walk, or use arrow keys.');
 $('target').replaceChildren(...room.hotspots.map(h=>new Option(h.title,h.id)));
 const look=root.querySelector('.room-look'),actions=root.querySelector('.room-actions'),places=document.createElement('button');
 places.type='button';places.textContent='Contacts';look.id='palace-contact-drawer';look.hidden=true;
 places.setAttribute('aria-controls',look.id);places.setAttribute('aria-expanded','false');
 function showContacts(open){look.hidden=!open;places.setAttribute('aria-expanded',String(open));}
 places.onclick=()=>showContacts(look.hidden);
 root.querySelector('.room-header').append($('exit'));
 actions.prepend(places,$('zoom'));
 look.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();showContacts(false);places.focus();}});

 const portraitImages=new Map();for(const n of room.npcs){const im=new Image();im.onload=()=>portraitImages.set(n.id,im);im.src=n.portrait;}
 const inspection=$('room-inspection'),portrait=document.createElement('canvas');portrait.width=180;portrait.height=180;portrait.className='palace-portrait';inspection.querySelector('.inspection-folio').append(portrait);
 let pendingUse=null;
 let visit=null,session=null,picture=null,ready=false,last=0,focus=null,zoom=1,camera=null,opening=false,inspectionActor=null,walkStart=0,wasWalking=false;
 const ledger=createGuildCampaign({makeStore,rooms:[room],world:city.world,bindings:[{doorID:'palace',roomID:room.id}],flagKey:'palaceInteriorsV1',acceptDoorState:(p,d)=>city.world.transitions(p[2],p.slice(0,2)).includes(d.edge),position:city.position,visits:city.visits,steps:city.steps,stop:city.stop,restore:p=>{city.restore(p);city.update();}});
 const blocked=()=>!dialog.open||!ready||inspection.open||session?.view().pendingSave||session?.view().closed;
 function report(text){status.textContent=text;}
 const stick=CWJoystick.mount({...CWLocomotion.profile,element:$('stick'),projection:'orthogonal',blocked,context:()=>room.id,step:(dx,dy)=>session.moveBy(dx,dy),driveByFrame:true,onEngage:()=>session?.stop(performance.now()),onDrive:(vector,now,input)=>input?session.drive(vector,now):session.advance(now),onStop:()=>session?.stop(performance.now())});
 function halt(){pendingUse=null;gesture=null;stick.stop();session?.stop(performance.now());}
 function returned(){if(!visit)return;try{if(!ledger.finish(visit.id,session.snapshot()))return;visit=null;ready=false;halt();dialog.close();city.tell('Returned to the Palace forecourt.');focus?.isConnected&&focus.focus({preventScroll:true});}catch(e){report(e.message);}}
 const cancel=panel.querySelector('button'),openingStatus=panel.querySelector('[role="status"]');
 function cancelOpening(){
  if(!visit)return;
  try{ledger.cancel(visit.id);visit=null;session=null;dialog.close();focus?.isConnected&&focus.focus({preventScroll:true});}
  catch(e){openingStatus.textContent=e.message;}
 }
 cancel.onclick=cancelOpening;
 async function show(active){
  focus=document.activeElement;visit=active;showContacts(false);root.inert=true;panel.hidden=false;dialog.dataset.loading='';
  openingStatus.textContent='Opening the Palace…';dialog.showModal();cancel.focus();
  const painting=picture?Promise.resolve(picture):new Promise((resolve,reject)=>{
   const image=new Image();image.onload=()=>resolve(image);
   image.onerror=()=>reject(Error('The reception painting could not load. Try the Palace entrance again.'));
   image.src='assets/palace-001/reception-room.webp';
  });
  let timer;
  try{
   const [image,styled]=await Promise.race([
    Promise.all([painting,loadStyle(),...room.npcs.map(n=>city.characterPainter.library.ensure(n.actorId))]),
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('The Palace took too long to load. Try the entrance again.')),20000);})
   ]);
   if(visit!==active)return false;
   if(!styled)throw Error('The Palace interface could not load. Try the entrance again.');
   picture=image;
   session=createRoomSession(room,{saved:ledger.roomRecord(room.id),onSave:s=>ledger.save(visit.id,s),onSaveError:()=>{report('Your place is kept here. Choose Retry saving before leaving.');$('retry-save').hidden=false;},onExit:returned});
   ready=true;last=0;$('loading').hidden=true;report('Tap to walk or drag to steer. Approach the clerk or guard to speak.');
   delete dialog.dataset.loading;panel.hidden=true;root.inert=false;paint(performance.now());canvas.focus({preventScroll:true});return true;
  }catch(e){if(visit!==active)return false;ready=false;cancelOpening();city.tell(e.message);return false;}
  finally{clearTimeout(timer);}
 }
 async function enter(door){
  if(door?.game_id!=='palace'||opening||visit)return false;opening=true;
  try{const flags=makeStore().read().state.flags;if(flags.guildInteriorsV1?.active||flags.universityVisitV1?.active)throw Error('Return from your current interior visit first.');return await show(ledger.enter('palace',room.id));}
  catch(e){city.tell(e.message);return false;}finally{opening=false;}
 }
 async function resume(){try{const active=ledger.active();if(active)await show(active);}catch(e){city.tell('Palace visit could not resume: '+e.message);}}
 function leave(){if(blocked())return;halt();session.requestExit();report('Returning to the public entrance…');}
 $('exit').onclick=leave;dialog.addEventListener('cancel',e=>{e.preventDefault();if(dialog.hasAttribute('data-loading'))cancelOpening();else if(inspection.open)inspection.close();else leave();});
 $('retry-save').onclick=()=>{if(session.retrySave()){$('retry-save').hidden=true;report('Progress saved.');}};
 $('zoom').onclick=()=>{zoom=zoom===1?0:1;$('zoom').textContent=zoom===1?'Whole room':'Follow officer';};
 $('approach').onclick=()=>{if(blocked())return;halt();const h=room.hotspots.find(h=>h.id===$('target').value);if(session.moveTo(h.stand)){showContacts(false);canvas.focus({preventScroll:true});report('Approaching '+h.title.toLowerCase()+'…');}};
 function goSpot(h){if(blocked())return;halt();if(h.id==='exit'){$('exit').click();return;}$('target').value=h.id;const v=session.view();if(Math.hypot(v.position[0]-h.stand[0],v.position[1]-h.stand[1])<=h.radius){$('interact').onclick();}else{$('approach').click();if(session.view().route.length)pendingUse=h;}}
 function target(){const p=session?.view().position,h=room.hotspots.find(h=>h.id===$('target').value);return h&&p&&Math.hypot(p[0]-h.stand[0],p[1]-h.stand[1])<=h.radius?h:session?.nearestHotspot();}
 $('interact').onclick=()=>{if(blocked())return;const h=target();if(!h)return;halt();const found=session.examine(h.id);if(!found)return;$('inspection-title').textContent=h.title;$('inspection-text').textContent=h.text;inspectionActor=room.npcs.find(n=>n.id===h.npc);portrait.hidden=!inspectionActor;portrait.setAttribute('role','img');portrait.setAttribute('aria-label',inspectionActor?.name||'');inspection.showModal();$('inspection-close').focus();};
 $('inspection-close').onclick=()=>inspection.close();inspection.addEventListener('close',()=>{$('interact').focus();});inspection.addEventListener('keydown',e=>e.stopPropagation());
 let gesture=null;
 canvas.addEventListener('pointerdown',e=>{
  if(blocked()||!camera||gesture||e.button!==0||!e.isPrimary)return;
  canvas.focus({preventScroll:true});halt();gesture={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,sector:null};
  canvas.setPointerCapture(e.pointerId);
 });
 canvas.addEventListener('pointermove',e=>{
  if(blocked()||!gesture||gesture.id!==e.pointerId)return;
  const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y,now=performance.now();
  const deadZone=44*(gesture.sector===null?CWLocomotion.profile.startZone:CWLocomotion.profile.stopZone);
  if(Math.hypot(dx,dy)<deadZone){if(gesture.moved)session.stop(now);gesture.sector=null;return;}
  gesture.moved=true;gesture.sector=CWJoystick.sector(dx,dy,gesture.sector);
  session.drive(CWJoystick.plan(gesture.sector,'orthogonal')[0],now);
 });
 function stopPointer(e){
  if(!gesture||gesture.id!==e.pointerId)return;
  const prior=gesture;gesture=null;
  if(prior.moved){session.stop(performance.now());return;}
  if(e.type!=='pointerup'||blocked()||!camera||Math.hypot(e.clientX-prior.x,e.clientY-prior.y)>=12)return;
  const b=canvas.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top,spot=presentation.hit(x,y,camera);
  if(spot){goSpot(spot);return;}
  const p=[(x-camera.x)/camera.scale/1536,(y-camera.y)/camera.scale/1024];
  if(session.moveTo(p))report('Walking…');else report('The wall, furniture or closed door blocks that point.');
 }
 canvas.addEventListener('keydown',e=>{const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!dir||blocked())return;e.preventDefault();e.stopPropagation();pendingUse=null;session.moveBy(...dir,.013);});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,stopPointer);
 function actor(ctx,key,p,height,pose){const a=city.characterPainter.library.get(key);if(a)CWCharacters.draw(ctx,a,pose,p[0]*1536,p[1]*1024,height);}
 function paint(now){if(!dialog.open||!ready||document.hidden){last=0;return;}if(!blocked())session.step(last?now-last:0,now);last=now;
  const box=canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);if(canvas.width!==Math.round(box.width*d)||canvas.height!==Math.round(box.height*d)){canvas.width=Math.round(box.width*d);canvas.height=Math.round(box.height*d);}g.setTransform(d,0,0,d,0,0);g.fillStyle='#121412';g.fillRect(0,0,box.width,box.height);
  const view=session.view(),p=view.position,nextCamera=presentation.camera(box.width,box.height,p,zoom===1),scale=nextCamera.scale;camera=nextCamera;g.save();g.translate(camera.x,camera.y);g.scale(scale,scale);g.drawImage(picture,0,0,1536,1024);
  if(!view.moving&&wasWalking&&pendingUse){const h=pendingUse;pendingUse=null;if(!blocked()&&Math.hypot(p[0]-h.stand[0],p[1]-h.stand[1])<=h.radius)$('interact').onclick();}
  if(view.moving&&!wasWalking)walkStart=now;wasWalking=view.moving;const pose={clip:view.moving&&!inspection.open?'walk':'idle',elapsed:now-walkStart,facing:view.facing,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
  const rows=[{player:true,p},...room.npcs.map(n=>({p:n.position,n}))].sort((a,b)=>a.p[1]-b.p[1]);
  for(const row of rows){if(row.player){const key=city.characterPainter.playerKey,a=city.characterPainter.playerMeta;CWCharacters.draw(g,a,{...pose,actorId:'player',clothing:true,weapon:'truncheon'},p[0]*1536,p[1]*1024,room.actorHeight*CWCharacters.height(a,key)/60);}else actor(g,row.n.actorId,row.p,room.actorHeight*row.n.scale,{...pose,clip:'idle',actorId:row.n.id,elapsed:now});}
  // The clerk stands behind the actual counter; reuse its exact painted polygon.
  g.save();g.beginPath();room.counterOcclusion.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.clip();g.drawImage(picture,0,0,1536,1024);g.restore();
  const lighting=readLighting(),darkness=lighting.darkness;if(darkness){g.fillStyle='rgba(3,12,27,'+darkness*.46+')';g.fillRect(0,0,1536,1024);g.globalCompositeOperation='screen';for(const [x,y,r]of room.lights){const f=g.createRadialGradient(x,y,0,x,y,r);f.addColorStop(0,'rgba(255,200,108,'+darkness*.45+')');f.addColorStop(1,'rgba(255,175,60,0)');g.fillStyle=f;g.fillRect(x-r,y-r,r*2,r*2);}g.globalCompositeOperation='source-over';}
  g.restore();const h=target();$('interact').disabled=blocked()||!h;$('interact').textContent=h?.kind==='talk'||!h?'Talk':'Examine';$('interact').hidden=!h;$('exit').disabled=view.pendingSave;$('retry-save').hidden=!view.pendingSave;
  if(inspection.open&&inspectionActor){const c=portrait.getContext('2d');c.clearRect(0,0,180,180);const image=portraitImages.get(inspectionActor.id);if(image)c.drawImage(image,0,0,180,180);else actor(c,inspectionActor.actorId,[90/1536,172/1024],145,{clip:'idle',elapsed:now,facing:-1,reduced:true,actorId:inspectionActor.id});}
  presentation.markers(g,camera,view,pendingUse||target(),box.width,box.height);canvas.dataset.view='v2';
  canvas.dataset.room=room.id;canvas.dataset.position=p.join(',');canvas.dataset.moving=String(view.moving);canvas.dataset.loaded='true';canvas.dataset.clock=lighting.phase;canvas.dataset.clockBasis=lighting.basis;
 }
 requestAnimationFrame(function frame(now){paint(now);requestAnimationFrame(frame);});addEventListener('pagehide',()=>{if(visit)halt();});addEventListener('blur',()=>{if(visit)halt();});document.addEventListener('visibilitychange',()=>{if(document.hidden){halt();last=0;}});
 return Object.freeze({enter,resume,canHandle:d=>d?.game_id==='palace',dialog,ledger,report:()=>({active:!!visit,room:room.id,position:session?.view().position,contacts:room.npcs.length}),snapshot:()=>session?.snapshot()});
}
