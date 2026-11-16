/* Approved NPC folio markup, isolated from the engine's own dialogue instance. */
export function createGuildContactView({document:doc,host=doc.defaultView,characters,onReturn,onError=()=>{}}){
 if(!characters?.ensure||!characters?.draw||typeof onReturn!=='function')throw Error('Current character library and navigation return required');
 if(doc.getElementById('cw-guild-contact-dialog'))throw Error('Guild contact presenter already mounted');
 const dialog=doc.createElement('dialog');dialog.id='cw-guild-contact-dialog';dialog.setAttribute('aria-labelledby','cw-guild-contact-name');dialog.setAttribute('aria-describedby','cw-guild-contact-speech');
 dialog.innerHTML='<div class="cw-dialogue-folio"><header class="cw-dialogue-top"><span>GUILD CONVERSATION</span><button type="button" class="cw-dialogue-close" aria-label="Close guild conversation">Close <span aria-hidden="true">×</span></button></header><div class="cw-dialogue-spread"><aside class="cw-dialogue-profile"><div class="cw-dialogue-portrait"><canvas width="180" height="200" role="img"></canvas></div><p class="cw-dialogue-profile-caption"></p></aside><section class="cw-dialogue-page"><div class="cw-dialogue-heading"><h2 id="cw-guild-contact-name"></h2><p class="cw-dialogue-kind">Guild contact</p></div><div class="cw-dialogue-content"><p id="cw-guild-contact-speech" class="cw-dialogue-speech" tabindex="0"></p><p class="cw-guild-art-status" role="status"></p><div class="cw-dialogue-responses" role="group" aria-label="Your response"></div></div></section></div></div>';
 doc.body.append(dialog);const $=s=>dialog.querySelector(s),canvas=$('canvas'),context=canvas.getContext('2d'),speech=$('.cw-dialogue-speech'),choices=$('.cw-dialogue-responses'),status=$('.cw-guild-art-status'),closeButton=$('.cw-dialogue-close');
 let session=null,serial=0,raf=null,ready=false,epoch=0,disposed=false;
 const reduced=host.matchMedia?.('(prefers-reduced-motion: reduce)');
 function stop(){if(raf!==null){host.cancelAnimationFrame(raf);raf=null;}}
 function paint(now){raf=null;if(!session||!dialog.open||disposed)return;context.clearRect(0,0,canvas.width,canvas.height);if(ready&&!doc.hidden){characters.draw(context,{id:session.contact.actorId},{clip:'idle',elapsed:now-epoch,facing:-1,reduced:!!reduced?.matches},90,185,140);}if(!doc.hidden&&!reduced?.matches)raf=host.requestAnimationFrame(paint);}
 function wake(){stop();if(session&&dialog.open)raf=host.requestAnimationFrame(paint);}
 function report(error){onError(error);}
 function clear(){const old=session;session=null;++serial;ready=false;stop();context.clearRect(0,0,canvas.width,canvas.height);if(dialog.open)dialog.close();return old;}
 function restoreFocus(old){const target=old?.focus;if(target?.isConnected&&typeof target.focus==='function')target.focus({preventScroll:true});}
 function finish(){const old=clear();if(!old)return false;try{old.callbacks.leave();}catch(e){report(e);}finally{restoreFocus(old);}return true;}
 function button(label,fn){const b=doc.createElement('button'),expected=session;b.type='button';b.textContent=label;b.onclick=()=>{if(!session||session!==expected)return;try{fn();}catch(e){report(e);}};choices.append(b);return b;}
 async function load(generation){if(!session||serial!==generation)return;status.textContent='Loading character…';ready=false;try{await characters.ensure(session.contact.actorId);if(!session||serial!==generation||disposed)return;ready=true;status.textContent='';epoch=host.performance.now();wake();}catch(e){if(!session||serial!==generation||disposed)return;status.textContent='Character artwork could not load. You can still talk or leave.';const retry=doc.createElement('button');retry.type='button';retry.textContent='Retry character artwork';retry.onclick=()=>{retry.remove();load(generation);};status.append(retry);report(e);}}
 closeButton.onclick=finish;dialog.addEventListener('cancel',e=>{e.preventDefault();finish();});dialog.addEventListener('close',()=>{if(session)finish();});dialog.addEventListener('keydown',e=>e.stopPropagation());
 const visibility=()=>{if(doc.hidden)stop();else wake();};doc.addEventListener('visibilitychange',visibility);reduced?.addEventListener?.('change',wake);
 function showContact(contact,callbacks){if(disposed)throw Error('Guild presenter is destroyed');if(session)throw Error('Close the active guild contact first');if(!contact?.actorId||!callbacks?.talk||!callbacks?.leave)throw Error('Contact and lifecycle callbacks required');
  const generation=++serial;session={contact,callbacks,focus:doc.activeElement};ready=false;choices.replaceChildren();status.replaceChildren();context.clearRect(0,0,canvas.width,canvas.height);$('.cw-dialogue-heading h2').textContent=contact.name;$('.cw-dialogue-profile-caption').textContent=contact.name;canvas.setAttribute('aria-label','Animated character: '+contact.name);speech.textContent='Speak with '+contact.name+'.';
  button('Talk',()=>callbacks.talk());button('Leave guildhouse',finish);
  try{dialog.showModal();closeButton.focus();}catch(e){const old=clear();try{old?.callbacks.leave();}finally{restoreFocus(old);}throw e;}load(generation);
 }
 function showDialogue(message){if(!session||message.actorId!==session.contact.actorId)return false;speech.textContent=message.text;choices.replaceChildren();button('Thank you',()=>{speech.textContent='Speak with '+session.contact.name+'.';choices.replaceChildren();button('Talk',()=>session?.callbacks.talk());button('Leave guildhouse',finish);choices.querySelector('button')?.focus();});button('Leave guildhouse',finish);speech.focus();return true;}
 function returnToDoor(exit){const old=clear();try{onReturn(exit);}finally{restoreFocus(old);}}
 function destroy(){finish();disposed=true;stop();doc.removeEventListener('visibilitychange',visibility);reduced?.removeEventListener?.('change',wake);dialog.remove();}
 return Object.freeze({showContact,showDialogue,returnToDoor,close:finish,destroy,element:dialog});
}
