/* Original public-approach staging. Closed Great Gates and case state retained. */
export const UNIVERSITY_WIZARDS=Object.freeze([
 {id:'uu-ridcully',key:'wizard-ridcully',name:'Mustrum Ridcully',p:[203,243,'APRON:university'],role:'Archchancellor',greeting:'Watch business? Very well. Keep the way clear and tell me what you need.',topics:[['Your hat','A proper hat should have room for the necessities. Drawers save an awful lot of rummaging.'],['The crossbow','For outdoor pursuits. It does not require a committee before it works.']]},
 {id:'uu-ponder',key:'wizard-ponder-stibbons',name:'Ponder Stibbons',p:[206,245,'APRON:university'],role:'University research and administration',greeting:'If this concerns University business, please give me the details in the right order.',topics:[['University work','I am keeping the work organised. That is proving to be a larger experiment than I expected.'],['The Great Gates','This is the public approach. Please leave the entrance clear.']]},
 {id:'uu-hix',key:'wizard-dr-john-hix',name:'Dr John Hix',p:[209,243,'APRON:university'],role:'Post-mortem communications',greeting:'University business, I assume. People tend to be more precise when they call for me.',topics:[['Your department','Post-mortem communications. We take professional terminology seriously.'],['The ring','An occupational accessory. Please do not make more of it than is necessary.']]},
 {id:'uu-librarian',key:'wizard-librarian',name:'The Librarian',p:[200,243,'APRON:university'],role:'University Librarian · orangutan',greeting:'Ook.',topics:[['Library business','Ook. He holds out a patient hand, waiting for you to show what needs attention.'],['Keep the approach clear','Ook. He gestures towards the clear space by the gates.']]},
 {id:'uu-bursar',key:'wizard-bursar',name:'Dr A. A. Dinwiddie',p:[200,245,'APRON:university'],role:'The Bursar · University faculty',greeting:'Is there a paper for this? There is usually a paper.',topics:[['University business','Please put the details in writing. Ponder will know where they belong.'],['Just passing','Then I need not find another form. That is something.']]},
 {id:'uu-wrangler',key:'wizard-senior-wrangler',name:'Senior Wrangler',p:[203,245,'APRON:university'],role:'University faculty',greeting:'An official inquiry? I shall endeavour to give it my attention.',topics:[['University work','There is always another academic matter to settle. Usually before the previous one is settled.'],['The public approach','A useful place for a brief conversation. Please keep the way clear.']]},
 {id:'uu-runes',key:'wizard-recent-runes',name:'Lecturer in Recent Runes',p:[206,243,'APRON:university'],role:'Lecturer in Recent Runes',greeting:'Watch business, is it? Please be precise about what you have found.',topics:[['Unfamiliar writing','Bring a clear description. A mark is not made more useful by guessing what it means.'],['Your department','Recent Runes. The distinction matters rather more to the department than to everyone outside it.']]},
 {id:'uu-modo',key:'wizard-modo',name:'Modo',p:[209,245,'APRON:university'],role:'University gardener · dwarf',greeting:'Mind where you put your feet. I have enough work without things being trodden on.',topics:[['The gardens','Things grow better when they are left enough room. People could learn from that.'],['Watch business','I can listen here. Keep the entrance clear while you tell me.']]},
 {id:'uu-rincewind',key:'wizard-rincewind',name:'Rincewind',p:[211,245,'APRON:university'],role:'Egregious Professor of Cruel and Unusual Geography',greeting:'You are not here to volunteer me for anything, are you?',topics:[['Just passing','Excellent. We should both continue doing that.'],['Avoiding trouble','I find that not being where the trouble happens is a useful first precaution.']]}
]);
export function wizardPlacements(world,entries){
 const occupied=new Set(),actors=[],missing=[];
 for(const spec of UNIVERSITY_WIZARDS){
  if(!entries[spec.key]){missing.push(spec.key);continue;}
  const k=spec.p.slice(0,2).join(',');
  if(!world.members.get(k)?.has(spec.p[2])||world.solid.has(k)||world.wet(spec.p)||occupied.has(k))throw Error('University wizard placement is unavailable: '+spec.id);
  occupied.add(k);actors.push({...spec,p:spec.p.slice(),universityWizard:true});
 }
 return {actors,missing};
}
export function createUniversityWizards({city,actors,document:doc=globalThis.document}){
 const placed=wizardPlacements(city.world,city.characterPainter.library.entries),ids=new Set(placed.actors.map(a=>a.id));actors.push(...placed.actors);
 let dialog=null,content=null,portrait=null,heading=null,role=null,backFocus=null,blockedBefore=false,shown=0,current=null;
 function make(tag,className,text){const node=doc.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
 function mount(){
  if(dialog)return;
  if(!doc.querySelector('link[data-university-wizards-style]')){const link=make('link');link.rel='stylesheet';link.href=new URL('cw-npc-dialogue.css?v=p21-b407-s039-reuse',import.meta.url).href;link.dataset.universityWizardsStyle='true';doc.head.append(link);}
  dialog=make('dialog','cw-npc-dialogue');dialog.id='cw-university-wizards';dialog.setAttribute('aria-labelledby','cw-university-wizard-name');
  const folio=make('div','cw-dialogue-folio'),top=make('header','cw-dialogue-top'),close=make('button','cw-dialogue-close','Close ×');close.type='button';close.onclick=dismiss;top.append(make('span','', 'THE WATCH · CONVERSATIONS'),close);
  const spread=make('div','cw-dialogue-spread'),profile=make('aside','cw-dialogue-profile');portrait=make('div','cw-dialogue-portrait');profile.append(portrait,make('p','cw-dialogue-profile-caption','University approach'));
  const page=make('section','cw-dialogue-page'),head=make('div','cw-dialogue-heading');heading=make('h2');heading.id='cw-university-wizard-name';role=make('p','cw-dialogue-kind');content=make('div','cw-dialogue-content');head.append(heading,role);page.append(head,content);spread.append(profile,page);folio.append(top,spread);dialog.append(folio);doc.body.append(dialog);
  dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('close',()=>{globalThis.CW_P20_INPUT_BLOCKED=blockedBefore;current=null;city.update();const target=backFocus?.isConnected&&(backFocus.getClientRects?.().length??1)>0?backFocus:doc.getElementById?.('city-use');target?.focus({preventScroll:true});});
 }
 function dismiss(){globalThis.CW_P20_INPUT_BLOCKED=blockedBefore;if(dialog?.open)dialog.close();}
 function show(){mount();if(dialog.open)return;city.stop();backFocus=doc.activeElement;blockedBefore=!!globalThis.CW_P20_INPUT_BLOCKED;try{dialog.showModal();globalThis.CW_P20_INPUT_BLOCKED=true;}catch(error){globalThis.CW_P20_INPUT_BLOCKED=blockedBefore;throw error;}}
 function button(label,fn){const b=make('button','',label);b.type='button';b.onclick=fn;return b;}
 function owns(id){return ids.has(id);}
 function talk(id){
  const actor=placed.actors.find(a=>a.id===id);if(!actor)return false;
  if(Math.hypot(city.position()[0]-actor.p[0],city.position()[1]-actor.p[1])>3){city.tell('Walk closer to '+actor.name+' before speaking.');return false;}
  show();current=id;heading.textContent=actor.name;role.textContent=actor.role;portrait.replaceChildren();const image=make('img');image.alt='Portrait of '+actor.name;image.src=new URL(city.characterPainter.library.entries[actor.key].portrait,import.meta.url).href;portrait.append(image);
  const speech=make('p','cw-dialogue-speech',actor.greeting),choices=make('div','cw-dialogue-responses');speech.tabIndex=0;choices.setAttribute('role','group');choices.setAttribute('aria-label','Your response');
  for(const [label,text]of actor.topics)choices.append(button(label,()=>{speech.textContent=text;}));choices.append(button('Leave conversation',dismiss));content.replaceChildren(speech,choices);shown++;return true;
 }
 function menu(walkTo){
  show();current='directory';heading.textContent='University people';role.textContent='Public University approach';portrait.replaceChildren(make('span','cw-dialogue-initial','UU'));const text=make('p','cw-dialogue-speech','Follow the public approach to speak with University people. The Great Gates remain closed.'),choices=make('div','cw-dialogue-responses');
  for(const actor of placed.actors)choices.append(button('Walk to '+actor.name,()=>{dismiss();walkTo('npc:'+actor.id);}));if(!placed.actors.length)text.textContent='The University character artwork could not load. Reload the patrol to try again.';choices.append(button('Return to patrol',dismiss));content.replaceChildren(text,choices);
 }
 return {owns,talk,menu,report:()=>({registered:placed.actors.length,missing:placed.missing.slice(),placements:placed.actors.map(a=>({id:a.id,key:a.key,p:a.p.slice()})),dialogueShown:shown,current,gateOpen:false,newWalkCells:0,newSaveKeys:[],originalStaging:true,dialogueOriginal:true})};
}
