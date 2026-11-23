import {mountConversationPortrait} from './cw-conversation-portraits.mjs';
/* Original patrol conversations; existing quest, purchase and pursuit handlers retained. */
export const CAMPAIGN_CONTACT_IDS=Object.freeze(['colon','vimes','carrot','palm','witness','igor']);
export function contactKind(actor,{university,sellers}){
 if(actor.id==='patrol-partner')return 'partner';
 if(actor.id==='chase-suspect')return 'pursuit';
 if(university.owns(actor.id))return 'university';
 if(sellers.isSeller(actor.id))return 'newspaper';
 return CAMPAIGN_CONTACT_IDS.includes(actor.id)?'campaign':null;
}
export function createPlayerContacts({city,actors,state,member,university,sellers,campaignTalk,pursuit,walkTo,objective,assignmentAction,smallTalk=null,hasSmallTalk=()=>false,document:doc=globalThis.document}){
 const distance=a=>Math.hypot(city.position()[0]-a.p[0],city.position()[1]-a.p[1]),kind=a=>contactKind(a,{university,sellers});
 let dialog=null,heading,subheading,portrait,content,focus,previousBlock=false,shown=0,partnerTalks=0;
 const make=(tag,cls,text)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 function mount(){if(dialog)return;const link=make('link');link.rel='stylesheet';link.href=new URL('cw-npc-dialogue.css?v=p21-b407-s039-reuse',import.meta.url).href;doc.head.append(link);
  dialog=make('dialog','cw-npc-dialogue');dialog.id='cw-player-contacts';dialog.setAttribute('aria-labelledby','cw-player-contact-name');
  const folio=make('div','cw-dialogue-folio'),top=make('header','cw-dialogue-top'),close=make('button','cw-dialogue-close','Close ×');close.type='button';close.onclick=dismiss;top.append(make('span','','THE WATCH · PEOPLE & CONTACTS'),close);
  const spread=make('div','cw-dialogue-spread'),profile=make('aside','cw-dialogue-profile');portrait=make('div','cw-dialogue-portrait');profile.append(portrait,make('p','cw-dialogue-profile-caption','Patrol contact'));
  const page=make('section','cw-dialogue-page'),head=make('div','cw-dialogue-heading');heading=make('h2');heading.id='cw-player-contact-name';subheading=make('p','cw-dialogue-kind');content=make('div','cw-dialogue-content');head.append(heading,subheading);page.append(head,content);spread.append(profile,page);folio.append(top,spread);dialog.append(folio);doc.body.append(dialog);
  dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('close',()=>{if(dialog.open||doc.querySelector?.('dialog[open]'))return;globalThis.CW_P20_INPUT_BLOCKED=previousBlock;city.update();const target=focus?.isConnected&&(focus.getClientRects?.().length??1)>0?focus:doc.getElementById?.('city-use');target?.focus({preventScroll:true});});
 }
 function show(){mount();const other=doc.querySelector?.('dialog[open]');if(other&&other!==dialog){city.tell('Finish the current conversation before opening another.');return false;}if(!dialog.open){city.stop();focus=doc.activeElement;previousBlock=!!globalThis.CW_P20_INPUT_BLOCKED;try{dialog.showModal();globalThis.CW_P20_INPUT_BLOCKED=true;}catch(e){globalThis.CW_P20_INPUT_BLOCKED=previousBlock;throw e;}}shown++;return true;}
 function dismiss(){if(!dialog?.open)return;globalThis.CW_P20_INPUT_BLOCKED=previousBlock;if(dialog?.open)dialog.close();}
 const button=(label,fn)=>{const b=make('button','',label);b.type='button';b.onclick=fn;return b;};
 function renderLegacyPortrait(actor){portrait.replaceChildren();if(actor.id==='dibbler'){const canvas=make('canvas');canvas.width=200;canvas.height=220;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Portrait of C.M.O.T. Dibbler');portrait.append(canvas);const image=new Image();image.onload=()=>{if(canvas.isConnected)canvas.getContext('2d').drawImage(image,207,124,609,1165,100-220*609/1165/2,0,220*609/1165,220);};image.src=new URL('assets/dibbler-v1/approved-sheet.webp',import.meta.url).href;return;}const meta=globalThis.CWDrawnCharacters?.current?.entries?.[actor.key]||city.characterPainter.library.entries[actor.key];if(!meta?.portrait){portrait.append(make('span','cw-dialogue-initial',actor.name?.[0]||'?'));return;}const image=make('img');image.alt='Portrait of '+actor.name;image.src=new URL(meta.portrait,import.meta.url).href;image.onerror=()=>{if(image.parentNode===portrait)portrait.replaceChildren(make('span','cw-dialogue-initial',actor.name?.[0]||'?'));};portrait.append(image);}
 function renderPortrait(actor){if(!mountConversationPortrait(portrait,actor,{document:doc,fallback:()=>renderLegacyPortrait(actor)}))renderLegacyPortrait(actor);}
 function partner(){const actor=actors.find(a=>a.id==='patrol-partner');if(!actor||distance(actor)>3){city.tell('Wait for your patrol partner to catch up before speaking.');return false;}
  const v=state(),m=member(),saved=v.pending?.battle?.actors?.find(a=>a.id==='partner'&&a.mentorId===m.id)||v.state.flags?.patrolPartnerVitals?.[m.id],hp=saved?.hp??m.maxHp,max=saved?.maxHp??m.maxHp;
  if(!show())return false;heading.textContent=m.name;subheading.textContent='Your patrol partner · '+m.trait;renderPortrait(actor);
  const speech=make('p','cw-dialogue-speech',objective()+' — '+m.advice);speech.tabIndex=0;const choices=make('div','cw-dialogue-responses');choices.setAttribute('role','group');choices.setAttribute('aria-label','Your response');
  for(const [label,text]of [['Patrol advice',m.advice],['Current assignment',objective()],['Issued kit',m.weaponName+'. This is the kit assigned for this patrol.'],['Patrol condition','Patrol stamina: '+hp+'/'+max+'. '+(hp<=0?'Your partner is unable to fight. This conversation does not provide treatment.':'Stay together and watch each other’s position.')]])choices.append(button(label,()=>{speech.textContent=text;}));
  if(hasSmallTalk('patrol-partner'))choices.append(button('Have a word',()=>smallTalk?.('patrol-partner')));
  if(assignmentAction)choices.append(button('Help me with the next step',()=>{dismiss();return assignmentAction();}));
  choices.append(button('Return to patrol',dismiss));content.replaceChildren(speech,choices);partnerTalks++;return true;
 }
 function exchange(actor,entry){
  if(!show())return false;heading.textContent=actor.name;subheading.textContent=entry.topic;renderPortrait(actor);
  const speech=make('p','cw-dialogue-speech');speech.tabIndex=0;
  speech.textContent=entry.lines.map(line=>(line.speaker==='player'?'You':actor.name)+': '+line.text).join('\n\n');
  const choices=make('div','cw-dialogue-responses');
  if(CAMPAIGN_CONTACT_IDS.includes(actor.id))choices.append(button('Ask about Watch business',()=>{dismiss();campaignTalk(actor.id);}));
  if(actor.id==='patrol-partner')choices.append(button('Patrol advice',partner));
  choices.append(button('Return to patrol',dismiss));content.replaceChildren(speech,choices);return true;
 }
 function active(){const chase=state().pending?.chase;return actors.filter(a=>kind(a)&&a.p&&(a.id!=='chase-suspect'||(chase?.visible&&!a.stoodDown)));}
 function talk(id){const other=doc.querySelector?.('dialog[open]');if(other&&other!==dialog)return false;const a=active().find(a=>a.id===id);if(!a)return false;const k=kind(a),range=k==='newspaper'?2.5:3;if(state().pending?.chase&&k!=='pursuit'&&k!=='partner'){city.tell('Finish the pursuit before speaking with other contacts.');return false;}if(distance(a)>range){city.tell('Walk closer to '+a.name+' before speaking.');return false;}
  if(k==='partner')return !!smallTalk?.(id);if(k==='campaign'&&smallTalk?.(id))return true;dismiss();if(k==='university')return university.talk(id);if(k==='newspaper')return sellers.talk(id);if(k==='pursuit'){pursuit();return true;}campaignTalk(id);return true;
 }
 function directory(page=0){if(!show())return false;const list=active().sort((a,b)=>distance(a)-distance(b)),pages=Math.max(1,Math.ceil(list.length/6)),current=Math.max(0,Math.min(pages-1,page));heading.textContent='People & contacts';subheading.textContent='City contacts · page '+(current+1)+' of '+pages;portrait.replaceChildren(make('span','cw-dialogue-initial','CW'));
  const choices=make('div','cw-dialogue-responses');for(const a of list.slice(current*6,current*6+6)){const nearby=distance(a)<=(kind(a)==='newspaper'?2.5:3);const b=button((nearby?'Talk to ':'Walk to ')+a.name,()=>{if(nearby)talk(a.id);else{dismiss();walkTo('npc:'+a.id);}});b.disabled=!!state().pending?.chase&&!['partner','pursuit'].includes(kind(a));if(b.disabled)b.title='Finish the pursuit before visiting other contacts.';choices.append(b);}
  if(current>0)choices.append(button('Previous page',()=>directory(current-1)));if(current<pages-1)choices.append(button('Next page',()=>directory(current+1)));choices.append(button('Return to patrol',dismiss));content.replaceChildren(make('p','cw-dialogue-speech','Choose a person. Walking uses the existing street routes. Approach them before speaking. During an incident, the existing pursuit and service restrictions still apply.'),choices);
 }
 return {directory,partner,talk,exchange,dismiss,report:()=>({contacts:active().map(a=>({id:a.id,name:a.name,art:a.key,interaction:kind(a)})),unhandled:actors.filter(a=>a.p&&!kind(a)).map(a=>a.id),dialoguesShown:shown,partnerConversations:partnerTalks,newSaveKeys:[],dialogueOriginal:true})};
}
