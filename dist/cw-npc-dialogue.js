/* NPC dossier presentation. Existing dialogue text, buttons and outcomes remain authoritative. */
window.CWInstallNpcDialogue = engine => {
 'use strict';
 const sheet=document.getElementById('sheet'),overlay=document.getElementById('overlay');
 if(!sheet||!overlay)return;
 let {open,close,say,actorTalk,i1Speak}=engine;
 const dialog=document.createElement('dialog');dialog.id='cw-npc-dialogue';
 dialog.setAttribute('aria-labelledby','cw-dialogue-name');
 dialog.innerHTML='<div class="cw-dialogue-folio"><header class="cw-dialogue-top"><span>THE WATCH · CONVERSATIONS</span><button type="button" class="cw-dialogue-close" aria-label="Close conversation">Close <span aria-hidden="true">×</span></button></header><div class="cw-dialogue-spread"><aside class="cw-dialogue-profile"><div class="cw-dialogue-portrait"></div><p class="cw-dialogue-profile-caption">Conversation record</p></aside><section class="cw-dialogue-page"><div class="cw-dialogue-heading"></div><div class="cw-dialogue-content"></div></section></div></div>';
 document.body.append(dialog);
 const head=dialog.querySelector('.cw-dialogue-heading'),content=dialog.querySelector('.cw-dialogue-content'),portrait=dialog.querySelector('.cw-dialogue-portrait'),caption=dialog.querySelector('.cw-dialogue-profile-caption');
 const known=[['Nobby','nobby'],['Nobby Nobbs','nobby'],['Corporal Nobbs','nobby'],['Dibbler','dibbler'],['CMOT Dibbler','dibbler'],['Sergeant Colon','colon'],['Colon','colon'],['Captain Carrot','carrot'],['Carrot','carrot'],['Commander Vimes','vimes'],['Vimes','vimes'],['Mrs Palm','palm'],['Watch Igor','igor'],['Igor','igor'],['Street Urchin','witness'],['Urchin','witness']];
 function speakerFor(name,skin){
  const found=known.find(([n])=>n.toLowerCase()===String(name).toLowerCase());
  const id=found?.[1]||skin||null;
  return {name:String(name),id,skin:engine.lookupSkin(name)||skin};
 }
 function fromTitle(title){return known.some(([n])=>n.toLowerCase()===String(title).toLowerCase())?speakerFor(title):null;}
 let context=null,generation=0,session=null,shown=0,actions=0,latest=null;
 new MutationObserver(()=>{const image=portrait.querySelector('img');if(image){image.alt='Portrait of '+caption.textContent;portrait.dataset.state='ready';}}).observe(portrait,{childList:true});
 const originalOpen=open,originalClose=close,originalSay=say,originalActorTalk=actorTalk,originalSpeak=i1Speak;
 function restore(){
  if(!session)return;const old=session;session=null;
  window.CW_P20_INPUT_BLOCKED=old.blocked;
  const target=old.focus?.isConnected&&old.focus.matches('button,a[href],input,select,textarea,summary,canvas,[tabindex]')&&old.focus.getClientRects().length&&!old.focus.closest('#cw-npc-dialogue')?old.focus:document.getElementById('interact');
  target?.focus({preventScroll:true});
 }
 function dismiss(){if(dialog.open)dialog.close();restore();}
 close=function(...args){dismiss();return originalClose(...args);};
 dialog.querySelector('.cw-dialogue-close').onclick=()=>close();
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 dialog.addEventListener('close',()=>{if(!dialog.open&&session){restore();originalClose();}});
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();});
 // Native dialog contains focus; keys on the dossier never reach patrol shortcuts.
 dialog.addEventListener('keydown',event=>event.stopPropagation());
 function promote(speaker,title,kicker,stamp){
  if(stamp!==generation||!overlay.classList.contains('show'))return;
  dismiss();
  session={focus:document.activeElement,blocked:!!window.CW_P20_INPUT_BLOCKED};
  engine.stopMovement();
  window.CW_P20_INPUT_BLOCKED=true;
  head.replaceChildren();content.replaceChildren();portrait.replaceChildren();portrait.dataset.state='loading';
  const oldHeading=sheet.querySelector('h2');if(!oldHeading){restore();return;}
  oldHeading.id='cw-dialogue-name';head.append(oldHeading);
  const small=document.createElement('p');small.className='cw-dialogue-kind';
  small.textContent=kicker?.startsWith('PATROL UPDATE')?kicker:kicker==='INTERVIEW NOTES'?'Recorded interview notes':'Conversation';head.append(small);
  // Reuse the original nodes and original click closures, including their close → callback → UI/save order.
  for(const node of [...sheet.children]){
   if(node.classList.contains('people-dialog-face')||node.classList.contains('kicker'))continue;
   content.append(node);
  }
  const speech=content.querySelector('p');if(speech){speech.classList.add('cw-dialogue-speech');speech.id='cw-dialogue-speech';dialog.setAttribute('aria-describedby',speech.id);speech.tabIndex=0;speech.setAttribute('aria-label','Conversation text');}
  const choices=document.createElement('div');choices.className='cw-dialogue-responses';choices.setAttribute('role','group');choices.setAttribute('aria-label','Your response');
  for(const b of [...content.querySelectorAll(':scope > button')]){b.type='button';b.setAttribute('aria-label',b.textContent);choices.append(b);}
  content.append(choices);caption.textContent=speaker.name;
  const fallback=()=>{portrait.dataset.state='fallback';portrait.replaceChildren();if(speaker.skin){portrait.dataset.state='source';engine.paintPortrait(portrait,speaker.skin,true);}else{const mark=document.createElement('span');mark.className='cw-dialogue-initial';mark.textContent=speaker.name.slice(0,1);mark.setAttribute('aria-hidden','true');portrait.append(mark);}};
  fallback();
  overlay.classList.remove('show');
  try{dialog.showModal();}catch(error){
   // Restore the functioning source sheet when a browser cannot open a native modal.
   sheet.replaceChildren(oldHeading,...[...content.children].filter(n=>n!==choices),...choices.children);overlay.classList.add('show');restore();return;
  }
  shown++;latest={speaker:speaker.name,portraitSource:speaker.skin,kind:small.textContent,title,responseCount:choices.children.length};
  dialog.querySelector('.cw-dialogue-close').focus({preventScroll:true});
 }
 function withSpeaker(speaker,fn){
  const previous=context,current={speaker,message:null,openedAt:generation};context=current;
  try{return fn();}
  finally{
   if(current.message&&current.openedAt===generation&&!overlay.classList.contains('show')&&!dialog.open){
    const message=current.message;
    open(speaker.name,message.text,[['Continue',()=>{}]],(message.name===speaker.name||fromTitle(message.name)?.id===speaker.id)?'CITY WATCH · CONVERSATION':'PATROL UPDATE · '+message.name);
   }
   context=previous;
  }
 }
 say=function(name,message,...rest){const result=originalSay(name,message,...rest);if(context)context.message={name:String(name),text:String(message)};return result;};
 open=function(title,text,choices=[],kicker){
  generation++;const stamp=generation;
  let speaker=fromTitle(title)||((title===context?.speaker.name||title==='A commendation well earned')?context?.speaker:null);
  if(title==='REPORT FILED')speaker=null;
  if(!speaker&&String(title).startsWith('Watch inquiry · ')){
   const m=engine.nearbyCaseActor();
   if(m)speaker=speakerFor(m.name,m.skin);
  }
  // Other sheets retain their own presentation and behavior.
  const responses=speaker?choices.map(([label,callback])=>[label,()=>{actions++;return withSpeaker(speaker,()=>callback?.());}]):choices;
  if(dialog.open)dismiss();
  const result=originalOpen(title,text,responses,kicker);
  if(speaker)queueMicrotask(()=>promote(speaker,title,kicker,stamp));
  return result;
 };
 actorTalk=function(actor){return withSpeaker(speakerFor(actor.n,actor.id),()=>originalActorTalk(actor));};
 i1Speak=function(title,text,skin){const person=engine.currentRoom()?.npc;if(person?.name===title)return withSpeaker(speakerFor(title,skin),()=>originalSpeak(title,text,skin));return originalSpeak(title,text,skin);};
 engine.install({open,close,say,actorTalk,i1Speak});
 window.CWNpcDialogue=Object.freeze({report:()=>({id:'BDY-NPC-DIALOGUE-v1',open:dialog.open,shown,actions,latest:latest?{...latest}:null,sourceChoicesRetained:true,newStorageKeys:[],newDialogue:false})});
};
