import {createGuildCampaign} from './guild-campaign.mjs?v=p21-b407-s039-reuse';
import {createGuildInteriorView} from './interior-view.mjs?v=rooms-complete-1';
import {roomMarkupV2 as roomMarkup} from './room-markup.mjs?v=rooms-complete-1';
export function currentRecruitPainter(city,C=globalThis.CWCharacters){
 let motion=null,opening=null;
 const baseURL=new URL('../',import.meta.url),poseFor=pose=>({...pose,actorId:'player',weapon:'truncheon',clothing:true});
 const painter=(context,pose,x,y,h)=>{const key=city.characterPainter.playerKey,a=city.characterPainter.playerMeta;if(!a||!C?.draw)throw Error('Current recruit appearance is unavailable');const height=h*C.height(a,key)/60,look=poseFor(pose);return motion?.draw(context,key,look,x,y,height)||C.draw(context,a,look,x,y,height);};
 painter.prepare=async()=>{
  try{
   opening ||= Promise.all([import('../cw-recruit-art-v2.mjs?v=room-motion-hd-1'),fetch(new URL('guild-interiors/assets/recruit-motion-hd/manifest.json',baseURL)).then(r=>{if(!r.ok)throw Error('Room recruit catalogue unavailable');return r.json();})]).then(([api,data])=>api.createRecruitArt(data,{baseURL,loadImage:url=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Room recruit art unavailable'));image.src=url;})}));
   motion=await opening;await motion.ensure(city.characterPainter.playerKey,poseFor({}),true);
  }catch(error){motion=null;opening=null;console.warn('Using standard room recruit frames',error);}
 };
 painter.height=h=>{const a=city.characterPainter.playerMeta;return h*C.height(a,city.characterPainter.playerKey)/60;};
 return painter;
}
export async function createGuildInteriorHost({city,makeStore,bindings=[],baseURL=new URL('./',import.meta.url),drawRecruit,document:doc=document}={}){
 const catalogue=await(await fetch(new URL('rooms.json?v=rooms-complete-1',baseURL))).json(),seen=new Set();
 for(const b of bindings){if(seen.has(b.doorID)||!catalogue.rooms.some(r=>r.id===b.roomID)||!city.world.doors.has(b.doorID))throw Error('Invalid or duplicate explicit guild door binding');seen.add(b.doorID);}
 const ledger=createGuildCampaign({makeStore,rooms:catalogue.rooms,world:city.world,bindings,position:city.position,visits:city.visits,steps:city.steps,stop:city.stop,restore:p=>{city.restore(p);city.update();}});
 for(const file of ['cw-guild-contact-view.css','cw-joystick.css','interiors-host.css']){const href=new URL(file+'?v=rooms-complete-1',baseURL).href;if([...doc.styleSheets].some(s=>s.href===href))continue;await new Promise((yes,no)=>{const link=doc.createElement('link');link.rel='stylesheet';link.href=href;link.onload=yes;link.onerror=()=>no(Error('Guild interface styling could not load'));doc.head.append(link);});}
 const dialog=doc.createElement('dialog');dialog.id='cw-guild-interior-host';dialog.setAttribute('aria-label','Guildhouse interior');const root=doc.createElement('div');root.innerHTML=roomMarkup;root.querySelector('#room-select').closest('label').hidden=true;root.querySelector('.preview-note').hidden=true;root.querySelector('.room-header small').textContent='CITY WATCH · GUILDHOUSE';const opening=doc.createElement('section');opening.className='cw-opening-panel';
 opening.innerHTML='<p role="status">Opening guildhouse…</p><button type="button">Cancel</button>';
 dialog.append(opening,root);doc.body.append(dialog);let visit=null,focus=null;
 function returned(snapshot){if(!visit)return;try{if(!ledger.finish(visit.id,snapshot))return;view.hide();visit=null;dialog.close();city.tell('Returned to the same entrance.');focus?.isConnected&&focus.focus({preventScroll:true});}catch(e){city.tell(e.message);}}
 const view=await createGuildInteriorView({root,baseURL,drawRecruit:drawRecruit||(city.characterPainter&&globalThis.CWCharacters?currentRecruitPainter(city):null),readRoom:roomID=>ledger.roomRecord(roomID),writeRoom:s=>{if(visit)ledger.save(visit.id,s);},onExit:returned});
 async function show(active){
  focus=doc.activeElement;visit=active;opening.querySelector('[role="status"]').textContent='Opening guildhouse…';root.inert=true;dialog.dataset.loading='';
  dialog.showModal();opening.querySelector('button').focus();
  let timer;
  try{
   await Promise.race([view.open(active.roomID),new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(Error('The guildhouse took too long to load. Try the doorway again.')),20000);
   })]);
   if(visit!==active)return;
   delete dialog.dataset.loading;root.inert=false;
   view.paint();
   root.querySelector('#room-canvas').focus({preventScroll:true});
  }finally{clearTimeout(timer);}
 }
 function cancelVisit(){
  if(!visit)return;
  try{ledger.cancel(visit.id);visit=null;view.hide();dialog.close();focus?.isConnected&&focus.focus({preventScroll:true});}
  catch(error){if(dialog.hasAttribute('data-loading'))opening.querySelector('[role="status"]').textContent=error.message;else city.tell(error.message);}
 }
 opening.querySelector('button').onclick=cancelVisit;
 const map=new Map(bindings.map(b=>[b.doorID,b.roomID]));
 const recoveryDialog=doc.createElement('dialog');recoveryDialog.id='cw-guild-recovery';recoveryDialog.setAttribute('aria-labelledby','cw-guild-recovery-title');recoveryDialog.innerHTML='<div class="guild-recovery-sheet"><h2 id="cw-guild-recovery-title">Resume your guild visit</h2><p>This room has changed since your saved visit. The original room record will be kept.</p><p role="status" id="cw-guild-recovery-status"></p><div class="guild-recovery-actions"><button type="button" id="cw-guild-recovery-restart">Restart at room entrance</button><button type="button" id="cw-guild-recovery-return">Return to street</button></div></div>';doc.body.append(recoveryDialog);let recoveryContext=null,recovering=false;
 const recoveryStatus=recoveryDialog.querySelector('[role="status"]'),restartButton=recoveryDialog.querySelector('#cw-guild-recovery-restart'),returnButton=recoveryDialog.querySelector('#cw-guild-recovery-return');
 function recoveryButtons(disabled){restartButton.disabled=returnButton.disabled=disabled;}
 function offerRecovery(error,door){try{const info=ledger.recovery(door?map.get(door.game_id):undefined);if(!info)return false;city.stop();focus=doc.activeElement;recoveryContext={...info,door};recoveryStatus.textContent=info.visitID?'Choose the current room entrance, or return to the same saved street position.':'Restart this room at its entrance, or go back to the city.';if(!recoveryDialog.open)recoveryDialog.showModal();restartButton.focus();return true;}catch(recoveryError){city.tell(recoveryError.message);return false;}}
 async function restartSavedVisit(){if(recovering||!recoveryContext)return;recovering=true;recoveryButtons(true);const context=recoveryContext;try{ledger.repair(context.roomID,context.fingerprint);recoveryDialog.close();recoveryContext=null;if(context.visitID)await resume();else await enter(context.door);}catch(error){recoveryStatus.textContent=error.message;}finally{recovering=false;recoveryButtons(false);}}
 function returnFromRecovery(){if(recovering||!recoveryContext)return;try{if(recoveryContext.visitID)ledger.cancel(recoveryContext.visitID);recoveryDialog.close();recoveryContext=null;city.tell('Returned to the city. The original room record is retained.');focus?.isConnected&&focus.focus({preventScroll:true});}catch(error){recoveryStatus.textContent=error.message;}}
 restartButton.onclick=restartSavedVisit;returnButton.onclick=returnFromRecovery;recoveryDialog.addEventListener('cancel',e=>{e.preventDefault();returnFromRecovery();});
 async function enter(door){
  const roomID=map.get(door?.game_id)
  const kind=root.querySelector('.room-header small');const street=String(roomID).startsWith('street-');if(kind)kind.textContent=street?'CITY WATCH · STREET':'CITY WATCH · GUILDHOUSE';const exit=root.querySelector('#exit');if(exit)exit.textContent='Return to street';if(!roomID||visit)return false;
  let active;
  try{active=ledger.enter(door.game_id,roomID);await show(active);return true;}
  catch(e){if(active&&visit!==active)return false;if(active)cancelVisit();city.tell(e.message);return !active&&offerRecovery(e,door);}
 }
 dialog.addEventListener('cancel',e=>{e.preventDefault();if(!visit)return;if(view.hasPendingSave()){city.tell('Choose Retry saving before leaving the room.');return;}if(dialog.hasAttribute('data-loading')||!view.requestExit())cancelVisit();});
 async function resume(){
  let active;
  try{active=ledger.active();if(!active||visit)return false;city.stop();await show(active);return true;}
  catch(e){if(active&&visit!==active)return false;if(active)cancelVisit();city.tell(e.message);return !active&&offerRecovery(e);}
 }
 return Object.freeze({canHandle:door=>map.has(door?.game_id),enter,resume,dialog,recoveryDialog,ledger,view});
}
