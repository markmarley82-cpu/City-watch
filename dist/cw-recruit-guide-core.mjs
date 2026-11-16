/* Tutorial progress is independent of campaign rewards, routes and evidence. */
export const GUIDE_KEY='city_watch_p21_recruit_guide_v1';
export const LESSONS=Object.freeze([
 {id:'move',title:'Move your character',short:'Drag anywhere on the street',body:'Hold anywhere on the painted street and drag in the direction you want to walk. Let go to stop.',detail:'You can also tap an empty bit of street. On a keyboard, use the arrow keys. You cannot walk through buildings or closed gates.',action:'Show my character',target:'city-follow'},
 {id:'orders',title:'Open your Notebook',short:'Open Cases in your Notebook',body:'Press Open Cases below. Read your job. Then close the Notebook.',detail:'Cases tells you what to do next. Evidence lists the things you have found. My Notes is for your own notes.',action:'Open Cases',target:'cw-ux108b-notebook'},
 {id:'reach',title:'Go to Colon',short:'Walk to Colon',body:'Press Walk to Colon. Wait until your character stops.',detail:'Colon is the Watch officer who gives you your first job. Drag anywhere on the street if you want to take control of the walk.',action:'Walk to Colon',target:'p21-track',walk:'npc:colon'},
 {id:'talk',title:'Talk to Colon',short:'Talk to Colon',body:'Press Talk to Colon. Choose “Accept the case”.',detail:'Then close his reply and talk to him once more. This confirms where to go.',action:'Talk to Colon',target:'city-use',talk:'colon'},
 {id:'evidence',title:'Find the missing ledger',short:'Go to the warehouse',body:'Press Walk to warehouse. Wait until you arrive.',detail:'A ledger is a book of records. Go inside the warehouse. Press Room plan, then choose False-bottom crate. Your character walks over and searches it.',action:'Walk to warehouse',target:'p21-track',walk:'warehouse'},
 {id:'witnesses',title:'Ask what people saw',short:'Go to Mrs Palm',body:'Press Walk to Mrs Palm. Wait until you arrive.',detail:'A witness is someone who saw something useful. Ask about your job. You do not need to buy the answer.',action:'Walk to Mrs Palm',target:'p21-track',walk:'npc:palm'},
 {id:'report',title:'Tell Colon what you found',short:'Go back to Colon',body:'Press Walk to Colon. Wait until you arrive.',detail:'Talk to Colon when you get there. He will read your report and finish this job.',action:'Walk to Colon',target:'p21-track',walk:'npc:colon'},
 {id:'save',title:'Save your game',short:'Save your game',body:'Press Save patrol below. Wait for the saved message.',detail:'The game also saves while you walk. Your save stays in this browser on this device. If saving fails, keep the game open and try again.',action:'Save patrol',target:'city-save'}
]);
// Match the next instruction to the real case, including the second Colon talk.
export function lessonInstruction(lesson,s={}){
 if(!lesson)return null;let v={...lesson};
 const person=(id,name,body,detail)=>{
  if((s.nearContacts||[]).includes(id)||(id==='colon'&&s.nearColon))return {...v,title:'Talk to '+name,short:'Talk to '+name,body,detail,action:'Talk to '+name,target:'city-use',talk:id,walk:null};
  return {...v,title:'Go to '+name,short:'Walk to '+name,body:'Press Walk to '+name+'. Wait until you arrive.',detail:'The button walks your character there. Drag anywhere on the street if you want to take control.',action:'Walk to '+name,target:'p21-track',walk:'npc:'+id,talk:null};
 };
 if(v.id==='reach'&&s.nearColon)return person('colon','Colon','Press Talk to Colon. Choose “Accept the case”.','Close his reply. Then talk to him once more.');
 if(v.id==='talk')return person('colon','Colon',s.stage===1?'Press Talk to Colon once more.':'Press Talk to Colon. Choose “Accept the case”.','This confirms your job at the warehouse.');
 if(v.id==='evidence'&&s.nearDoor==='warehouse')return {...v,title:'Go inside the warehouse',short:'Enter the warehouse',body:'Press Enter warehouse below.',detail:'Inside, press Room plan, then choose False-bottom crate. Your character walks over and searches it.',action:'Enter warehouse',target:'city-use',walk:null,room:'warehouse'};
 if(v.id==='witnesses')return s.stage>=4?person('witness','Street Urchin','Press Talk to Street Urchin. Choose “Record testimony”.','The Street Urchin is the child who saw what happened. Testimony means their account of it.'):person('palm','Mrs Palm','Press Talk to Mrs Palm. Choose “Promise discretion”.','That means you agree to keep her name out of gossip. You do not need to spend a coin.');
 if(v.id==='report')return person('colon','Colon','Press Talk to Colon to finish this job.','Your found ledger and the witness’s account are already recorded.');
 return v;
}
// An active incident takes priority over ordinary patrol instructions.
export function incidentInstruction(pending,nearSuspect=false){
 if(!pending)return null;
 const chase=pending.chase;
 if(!chase)return {title:'Finish the encounter',short:'Press Resume encounter',action:'Resume encounter',button:'Resume',command:'battle',body:'Press Resume encounter. Finish it, then your patrol tips will continue.'};
 if(['caught','surrendered'].includes(chase.status)){
  if(!nearSuspect)return {title:'Go back to the suspect',short:'Get close to the suspect',action:'Follow suspect',button:'Go',command:'follow',body:'Press Follow suspect to get close again. Then you can speak to them.'};
  return chase.status==='surrendered'?{title:'The suspect has given up',short:'Press Options to make the arrest',action:'Open suspect options',button:'Options',command:'interact',body:'Press Open suspect options. Choose Arrest to take them into custody.'}:{title:'You caught up',short:'Press Options to speak to the suspect',action:'Open suspect options',button:'Options',command:'interact',body:chase.demandUsed?'The suspect refused to give up. Press Open suspect options to face them again or let them go.':'Press Open suspect options. Choose Demand surrender to ask them to give up.'};
 }
 return {title:chase.status==='search'?'Find the suspect':'Follow the suspect',short:chase.status==='search'?'Search the last place you saw them':'Stay close to the fleeing suspect',action:'Follow suspect',button:'Follow',command:'follow',body:'Press Follow suspect. Stay close. If they vanish, go to the last place you saw them.'};
}
// Patrol help follows the real saved round instead of maintaining a second route state.
export function patrolInstruction(view){
 if(!view)return null;
 const objective=view.objective||'your patrol stop',action=view.label||'Continue patrol';
 if(view.action==='inspect')return {title:'Check '+objective,short:'You have reached '+objective,action,command:'patrol',body:'Press '+action+'. Look for anything unusual, then follow the next patrol marker.'};
 if(view.action==='report')return {title:'Report to Sergeant Colon',short:'Your patrol checks are complete',action,command:'patrol',body:'Press '+action+' to give Colon your report and finish the round.'};
 if(view.action==='book')return {title:'Hand over the suspect',short:'Bring the suspect into Watch custody',action,command:'patrol',body:'Press '+action+'. Then file the patrol report with Colon.'};
 if(view.action==='go')return {title:objective,short:action+': '+objective,action,command:'patrol',body:'Press '+action+'. Your recruit and patrol partner will follow the open route. Drag on the street if you want to take control.'};
 return {title:'Continue your patrol',short:objective,action,command:'patrol',body:'Press '+action+' and follow the current patrol instruction.'};
}
// Live announcements follow the same priority as the visible patrol ribbon.
// Learning to walk must not announce a case lesson over an active patrol/incident.
export function progressAnnouncement(progress,s={}){
 const active=incidentInstruction(s.pending,s.nearSuspect)||patrolInstruction(s.dutyView);
 if(active)return active.short;
 if(progress.status==='complete')return 'Well done. You finished your first job and saved it.';
 const lesson=lessonInstruction(currentLesson(progress),s);
 return lesson?'Good. Next: '+lesson.short:'';
}
// A recovery prompt explains the same real action without changing game state.
export function recoveryInstruction(i){
 if(!i)return '';
 if(i.id==='move')return 'First press Find my character. Then hold anywhere on the painted street and drag a little. Let go after your character has taken two steps.';
 if(i.id==='orders')return 'Close any other open screen. Open Recruit guide again, then press Open Cases. Reading Cases is enough; the guide will continue when you close it.';
 if(i.room)return 'If Enter warehouse is not shown, you are not at the door yet. Press Walk to warehouse again, wait for your character to stop, then press Enter warehouse.';
 if(i.talk)return 'If the conversation does not open, you are too far away. Press Walk to '+i.title.replace(/^Talk to /,'')+', wait for your character to stop, then press '+i.action+'.';
 if(i.walk)return 'Press '+i.action+' again and wait for your character to stop. If you cannot see them, press Find my character first. The guide will never advance the job for you.';
 if(i.id==='save')return 'Close any open screen, then press Save patrol again. Wait for the saved message before closing the game.';
 return 'Close any open screen, return to the street, and press '+i.action+' again.';
}
export function newProgress(){return {schema:1,status:'unseen',completed:[],baseline:0,seen:[]};}
export function decodeProgress(raw){
 try{const p=JSON.parse(raw);if(p?.schema===1&&['unseen','offered','guided','paused','complete','dismissed'].includes(p.status)&&Array.isArray(p.completed)&&Number.isFinite(p.baseline)&&p.baseline>=0&&Array.isArray(p.seen))return {...p,completed:[...new Set(p.completed.filter(id=>LESSONS.some(l=>l.id===id)))],seen:p.seen.filter(x=>typeof x==='string').slice(0,20)};}catch{}
 return newProgress();
}
export function currentLesson(p){return LESSONS.find(l=>!p.completed.includes(l.id))||null;}
export function begin(p,steps=0){return {...p,status:'guided',baseline:p.status==='unseen'||p.status==='offered'||p.status==='dismissed'?Math.max(0,steps):p.baseline};}
export function observe(p,s){
 if(p.status!=='guided')return p;
 const done=new Set(p.completed),chapter=s.chapter||0,stage=s.stage||0;
 if(s.steps>=p.baseline+2)done.add('move');
 if(s.casesOpen)done.add('orders');
 if(s.nearColon||chapter>0||stage>=2)done.add('reach');
 if(chapter>0||stage>=2)done.add('talk');
 if(chapter>0||stage>=3)done.add('evidence');
 if(chapter>0||stage>=5)done.add('witnesses');
 if(chapter>0)done.add('report');
 if(s.saved&&done.has('report'))done.add('save');
 const completed=LESSONS.filter(l=>done.has(l.id)).map(l=>l.id);
 if(completed.join('|')===p.completed.join('|'))return p;
 return {...p,completed,status:completed.length===LESSONS.length?'complete':'guided'};
}
export function battleAdvice(b){
 if(b?.result||b?.phase==='result')return 'The fight is over. Press Record outcome & return to city. If someone runs away, follow them in the street.';
 const foes=b?.actors?.filter(a=>a.team==='opposition')||[];
 if(foes.some(a=>a.status==='active'&&a.morale<=0))return 'Someone has given up. Select them. Press Talk, then Arrest. Stand next to them (adjacent). You need one action left.';
 return 'Tap a suspect. Press Talk to lower their resolve — their will to fight. At 0, they give up. Each officer gets one main action. Press End turn when finished.';
}
export function roomAdvice(s,contact=''){
 if(!s||s.chapter!==0)return '';
 if(s.stage===3&&/Palm/i.test(contact))return 'Choose “Promise discretion”. You do not need to pay a coin.';
 if(s.place==='warehouse')return s.stage>=3?'You found the ledger. Press Return to city.':'Press Room plan, then choose False-bottom crate. Your character walks over and searches it.';
 if(s.place!=='city')return '';
 if(s.stage===0&&/Colon/i.test(contact))return 'Choose “Accept the case”.';
 if(s.stage===1&&/Colon/i.test(contact))return 'Close this window. Talk to Colon once more to confirm your job.';
 if(s.stage===3&&/Palm/i.test(contact))return 'Choose “Promise discretion”. You do not need to pay a coin.';
 if(s.stage===4&&/Urchin/i.test(contact))return 'Choose “Record testimony”. This writes down what the child saw.';
 if(s.stage===5&&/Colon/i.test(contact))return 'Return to the street. Go back to Colon and talk to him.';
 return '';
}
export const TOPICS=Object.freeze([
 ['How do I go on patrol?','Press Patrol routes, or Duty → Go on patrol. Choose a round. Walk to each checkpoint, then press Check area. Return to Sergeant Colon and press Report round to finish. After your first main case, some checkpoints offer enquiries. Inspect the scene and compare accounts, then choose a finding supported by the clues or prepare an honest unresolved report. File it with Colon when the round is complete. Progress is saved. The first report on each route earns 2 merit; later rounds add to your patrol log.'],
 ['How do I move?','Hold anywhere on the painted street and drag in the direction you want to walk. Let go to stop. Or tap an empty bit of street to walk there. You cannot walk through buildings. Arrow keys also work.'],
 ['Where is my character?','The camera follows your recruit. Close any menu covering the street, then drag anywhere on the painted street to move.'],
 ['How do I talk?','Walk close to a person. Press Talk. Read their words, then choose an answer. Close the window to return to the street. Duty → People & contacts can help you find someone.'],
 ['What do I do next?','Read the job above the bottom buttons. Press Walk to assignment to go there. Open Notebook → Cases if you forget what you are doing.'],
 ['What is evidence?','Evidence is something useful you found, such as the missing ledger. Search marked objects and ask people what they saw. The Notebook records it. My Notes is for your own ideas; press Save notes to keep those.'],
 ['Who walks with me?','That is your patrol partner. They help you in fights. Use Duty → Talk to patrol partner for advice. Use Duty → Patrol partner to choose another officer when no incident is active.'],
 ['How do I arrest someone?','Tap the suspect. Press Talk to lower resolve. Resolve means their will to fight. At 0, they give up. Move next to them. Press Arrest with an action left. Press End turn when your officer is finished.'],
 ['Someone ran away. What now?','Press Follow suspect. Stay close. If you lose sight of them, go to the last place you saw them. Get close before speaking. Ask them to give up, or face them again. A suspect who gives up can be arrested.'],
 ['How do I heal or check my kit?','Kit means the things you carry. Open Duty → Inventory to see them. In a fight, use Kit for bandages. Read what a button will do before using it. Health is how much injury you can take. Merit is credit for Watch work.'],
 ['How do I use the map?','Press Destinations and choose a place. Walk there moves your character. Look at place only moves the camera. Some doors stay closed. Walk to a newspaper seller to buy or read a paper.'],
 ['It is dark. Can I turn sound on?','Tap the B Dis-organiser twice to open Patrol actions, then choose Music & sound. You can play with sound off.'],
 ['How do I save?','Tap the B Dis-organiser twice to open Patrol actions, then choose Save patrol. Wait for the saved message. Your game stays in this browser on this device. If saving fails, keep the game open and try again. My Notes has a separate Save notes button.'],
 ['Can I change how I look?','Tap the B Dis-organiser twice to open Patrol actions, then choose Appearance. Changing clothes or your look does not restart your job. When you first join, choose your own made-up name and sign the Watch oath.']
]);
