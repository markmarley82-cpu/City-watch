import {GUIDE_KEY,LESSONS,TOPICS,newProgress,decodeProgress,currentLesson,begin,observe,battleAdvice,lessonInstruction,roomAdvice,incidentInstruction,patrolInstruction,recoveryInstruction,progressAnnouncement} from './cw-recruit-guide-core.mjs?v=p21-b407-s039-reuse';
export function createRecruitGuide({city,game,freshRecruit=false,storage=localStorage,doc=document}){
 let progress,storageOK=true,focus=null,lastRibbon='',highlight=null,welcomeOffered=false,section='patrol',welcoming=false,searchTerm='',lessonKey='',lessonSince=Date.now(),attempts=0;
 try{progress=decodeProgress(storage.getItem(GUIDE_KEY));}catch{progress=newProgress();storageOK=false;}
 const make=(tag,cls,text)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const style=make('link');style.rel='stylesheet';style.href=new URL('cw-recruit-guide.css?v=p21-b407-s039-reuse',import.meta.url).href;doc.head.append(style);
 const button=(text,fn)=>{const b=make('button','',text);b.type='button';b.onclick=fn;return b;};
 const help=button('Recruit guide',()=>open());help.id='cw-recruit-guide-open';
 (doc.querySelector('.cw-phone-extra-actions')||doc.querySelector('.city-tools')).append(help);
 const ribbon=make('aside','cw-recruit-guide-ribbon');ribbon.hidden=true;ribbon.setAttribute('aria-label','Recruit training');
 const ribbonText=make('span'),ribbonAction=button('Go',()=>{if(snapshot().pending){runIncident();return;}activate();}),ribbonHelp=button('Help',()=>{section='patrol';open();}),ribbonPause=button('Pause',()=>{if(progress.status==='complete')save({...progress,seen:[...new Set([...progress.seen,'pursuit'])]});else pause();});ribbon.append(ribbonText,ribbonAction,ribbonHelp,ribbonPause);doc.querySelector('.city-view').append(ribbon);
 const live=make('span','cw-recruit-guide-live');live.setAttribute('role','status');live.setAttribute('aria-live','polite');doc.body.append(live);
 const skin=make('link');skin.rel='stylesheet';skin.href=new URL('cw-recruit-guide-notebook.css?v=p21-b461-watch-ui',import.meta.url).href;doc.head.append(skin);
 const dialog=make('dialog','cw-recruit-guide cw-lab-notebook');dialog.id='cw-recruit-guide';dialog.setAttribute('aria-labelledby','cw-recruit-guide-title');
 const book=make('div','book lab-nb-responsive'),header=make('header','lab-nb-header'),title=make('h2','','Recruit guide');title.id='cw-recruit-guide-title';
 const close=button('Close',()=>dialog.close());close.id='cw-guide-close';header.append(title,close);
 const sections=make('div','lab-nb-sections'),tabs=make('nav');tabs.id='cw-guide-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Recruit guide sections');
 for(const [id,label]of [['patrol','First patrol'],['field','Field guide']]){const tab=button(label,()=>{section=id;draw(welcoming);});tab.id='cw-guide-tab-'+id;tab.dataset.section=id;tab.dataset.tab=id;tab.setAttribute('role','tab');tab.setAttribute('aria-controls','cw-guide-page');tabs.append(tab);}
 tabs.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();section=e.key==='Home'?'patrol':e.key==='End'?'field':section==='patrol'?'field':'patrol';draw(welcoming);tabs.querySelector('[data-section="'+section+'"]').focus();}});
 const paper=make('div','lab-nb-paper'),content=make('div','cw-recruit-guide-content');content.id='cw-guide-page';content.setAttribute('role','tabpanel');content.tabIndex=0;paper.append(content);sections.append(tabs);book.append(header,sections,paper);dialog.append(book);doc.body.append(dialog);
 dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('close',()=>{if(doc.querySelector('dialog[open],#watch-notebook.open'))return;const t=focus?.isConnected&&focus.getClientRects().length?focus:help;t.focus({preventScroll:true});});
 function save(next){progress=next;try{storage.setItem(GUIDE_KEY,JSON.stringify(next));storageOK=true;}catch{storageOK=false;}renderRibbon();}
 function snapshot(extra={}){const v=game.state(),p=city.position?.(),door=city.nearDoor?.(),c=v.pending?.chase,q=c?.route?.[c.index],nearSuspect=!!(p&&Array.isArray(q)&&Math.hypot(p[0]-q[0],p[1]-q[1])<=(c.catchRadius||1.8));return {chapter:v.state.chapter,stage:v.state.stage,steps:city.steps(),nearColon:city.nearColon(),nearDoor:door&&!door.held?door.game_id:null,nearContacts:p?(game.actors||[]).filter(a=>a.p&&!a.stoodDown&&Math.hypot(p[0]-a.p[0],p[1]-a.p[1])<=3).map(a=>a.id):[],pending:v.pending,nearSuspect,chase:v.pending?.chase,dutyView:game.patrolDuty?.view(v)||null,casesOpen:!!doc.querySelector('#watch-notebook.open [data-tab="Cases"].selected'),...extra};}
 function instruction(s=snapshot()){return lessonInstruction(currentLesson(progress),s);}

 function removeHighlight(){highlight?.classList.remove('cw-recruit-guide-target');highlight=null;}
 function renderRibbon(s=snapshot()){
  const lesson=instruction(s),chase=s.chase,incident=incidentInstruction(s.pending,s.nearSuspect),patrol=incident?null:patrolInstruction(s.dutyView),active=incident||patrol;
  const key=active?(active.command||'active')+':'+active.action+':'+active.short:lesson?lesson.id+':'+lesson.action:'';if(key!==lessonKey){lessonKey=key;lessonSince=Date.now();attempts=0;}
  const stalled=!!lesson&&!active&&(attempts>=2||Date.now()-lessonSince>=45000);
  const firstPursuit=!!chase&&progress.status==='complete'&&!progress.seen.includes('pursuit');
  ribbonPause.textContent=firstPursuit?'Dismiss':'Pause';
  ribbonAction.textContent=active?active.action:lesson?.action||'Continue';ribbonAction.setAttribute('aria-label',active?active.action:lesson?.action||'Continue');
  ribbonHelp.textContent=stalled?'I’m stuck':'Help';
  ribbon.hidden=!(progress.status==='guided'&&(lesson||active)||firstPursuit)||!!doc.querySelector('dialog[open],.cw-oath,#watch-notebook.open')||!!window.CWRecruitmentPending;
  const copy=active?active.short:lesson?(stalled?'Still on step '+(LESSONS.findIndex(l=>l.id===lesson.id)+1)+' · Press the named button. Help explains the fallback.':'Step '+(LESSONS.findIndex(l=>l.id===lesson.id)+1)+' of '+LESSONS.length+' · '+lesson.short):'';
  if(copy!==lastRibbon){ribbonText.textContent=copy;lastRibbon=copy;}
  let nextTarget=null;if(!ribbon.hidden){if(patrol)nextTarget=doc.getElementById('p21-track');else if(!incident){nextTarget=lesson.id==='move'?doc.querySelector('.city-dpad'):doc.getElementById(lesson.target);if(!nextTarget?.getClientRects().length)nextTarget=doc.getElementById(lesson.target==='city-follow'?'cw-phone-look':'cw-phone-more-open');}}if(nextTarget!==highlight){removeHighlight();highlight=nextTarget;highlight?.classList.add('cw-recruit-guide-target');}
 }
 function start(){save(begin(progress,city.steps()));event();focus=doc.getElementById('city-scene')||help;dialog.close();const s=snapshot(),active=incidentInstruction(s.pending,s.nearSuspect)||patrolInstruction(s.dutyView);live.textContent=active?'Let’s continue. '+active.short:'Let’s start. '+instruction(s)?.short;}
 function pause(){save({...progress,status:'paused'});removeHighlight();live.textContent='Tips paused. Tap the B Dis-organiser twice, then choose Recruit guide to continue.';if(dialog.open)draw();}
 function event(type){const before=progress,s=snapshot({saved:type==='saved'}),next=observe(progress,s);if(next!==before){save(next);live.textContent=progressAnnouncement(next,s);if(dialog.open&&section==='patrol')draw(welcoming,true);}else renderRibbon(s);}
 function runIncident(){
  const s=snapshot(),active=incidentInstruction(s.pending,s.nearSuspect)||patrolInstruction(s.dutyView);if(!active)return false;
  focus=doc.getElementById('city-scene')||help;dialog.close();city.stop();
  if(active.command==='battle')game.battle?.();else if(active.command==='interact')game.interact?.();else doc.getElementById('p21-track')?.click();return true;
 }
 function activate(){
  const s=snapshot();if(s.pending||s.dutyView){runIncident();return;}const lesson=instruction(s);if(!lesson)return;focus=doc.getElementById('city-scene')||help;dialog.close();city.stop();
  attempts++;renderRibbon();
  if(lesson.id==='orders'){window.CW_NOTEBOOK?.openSection('Cases');event();return;}
  if(lesson.walk&&game.walkTo){game.walkTo(lesson.walk);return;}
  if(lesson.talk&&game.playerContacts?.talk){game.playerContacts.talk(lesson.talk);return;}
  if(lesson.room){const door=city.nearDoor?.();if(door?.game_id===lesson.room&&!door.held&&game.room){game.room(door);return;}city.tell('Walk to the warehouse door first.');return;}
  const target=doc.getElementById(lesson.target);if(target&&!target.disabled){target.click();return;}city.tell('Close the other screen first. Then try this step again.');
 }
 function drawField(){
  content.append(make('h3','','What do you need help with?'));
  const label=make('label','cw-guide-search-label','Find help'),search=make('input');search.type='search';search.id='cw-guide-search';search.placeholder='Try walk, talk or save';search.value=searchTerm;label.htmlFor=search.id;
  const results=make('div'),status=make('p','cw-guide-search-status');status.setAttribute('role','status');content.append(label,search,status,results);
  const filter=()=>{searchTerm=search.value;const q=searchTerm.trim().toLocaleLowerCase(),matches=TOPICS.filter(([name,text])=>(name+' '+text).toLocaleLowerCase().includes(q));results.replaceChildren();status.textContent=q?(matches.length?matches.length+' help topic'+(matches.length===1?'':'s')+' found.':'No match. Try walk, talk or save.'):'Choose a question below.';for(const [name,text]of matches){const d=make('details','cw-guide-topic');d.append(make('summary','',name),make('p','',text));results.append(d);}};search.oninput=filter;filter();
 }
 function draw(welcome=false,preserve=false){
  const oldScroll=content.scrollTop,oldControl=doc.activeElement?.dataset.guideControl;
  welcoming=welcome;for(const tab of tabs.children){const selected=tab.dataset.section===section;tab.classList.toggle('selected',selected);tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;}content.setAttribute('aria-labelledby','cw-guide-tab-'+section);
  content.replaceChildren();content.scrollTop=0;
  if(section==='field'){drawField();return;}
  content.append(make('p','cw-guide-intro',welcome?'New to the Watch? We’ll show you what to press, one step at a time.':'Follow the step below. The tips change when you do it.'));
  const lesson=instruction(),status=make('p','cw-guide-progress');status.textContent=progress.status==='complete'?'Well done. Your first job is finished and saved.':progress.completed.length+' of '+LESSONS.length+' steps done';content.append(status);
  if(!storageOK)content.append(make('p','cw-guide-error','We couldn’t save these tips. You can keep going, but they may repeat next time.'));
  const actions=make('div','cw-guide-actions');
  if(progress.status!=='guided')actions.append(button(progress.status==='paused'?'Continue the tips':progress.status==='complete'?'Show the basics again':'Show me how',()=>{if(progress.status==='complete')progress=newProgress();start();}));
  else actions.append(button('Pause the tips',pause));
  actions.append(button(welcome?'I’ll explore on my own':'Back to the game',()=>{if(welcome)save({...progress,status:'dismissed'});dialog.close();}));for(const [i,b]of [...actions.children].entries())b.dataset.guideControl='control-'+i;
  const s=snapshot(),context=incidentInstruction(s.pending,s.nearSuspect)||patrolInstruction(s.dutyView);
  if(context){const active=make('section','cw-guide-lesson');active.append(make('p','cw-guide-kicker','DO THIS NEXT'),make('h3','',context.title),make('p','cw-guide-instruction',context.body),button(context.action,runIncident));content.append(active);}

  if(lesson&&!context&&progress.status==='guided'){
   const active=make('section','cw-guide-lesson'),doIt=button(lesson.action,activate);doIt.dataset.guideControl='do-step';active.append(make('p','cw-guide-kicker','DO THIS NEXT'),make('h3','',lesson.title),make('p','cw-guide-instruction',lesson.body),doIt);const more=make('details');more.append(make('summary','','More help'),make('p','',lesson.detail));active.append(more);content.append(active);
   const recovery=make('details','cw-guide-recovery');recovery.open=attempts>=2||Date.now()-lessonSince>=45000;recovery.append(make('summary','','I’m stuck'),make('p','',recoveryInstruction(lesson)));const find=button('Find my character',()=>{focus=doc.getElementById('city-scene')||help;dialog.close();doc.getElementById('city-follow')?.click();live.textContent='Camera returned to your character. '+lesson.body;});find.dataset.guideControl='find-me';recovery.append(find);active.append(recovery);
  }
  content.append(actions);
  const checklist=make('details','cw-guide-checklist');checklist.append(make('summary','','What have I learned?'));
  const list=make('ol');for(const l of LESSONS)list.append(make('li',progress.completed.includes(l.id)?'done':'',(progress.completed.includes(l.id)?'✓ ':'')+l.title));checklist.append(list);content.append(checklist);
  if(preserve){content.scrollTop=oldScroll;if(oldControl)content.querySelector('[data-guide-control="'+oldControl+'"]')?.focus({preventScroll:true});}

 }
 function open(welcome=false){
  if(doc.querySelector('dialog[open],.cw-oath,#watch-notebook.open')){city.tell('Close the screen you are using. Then tap the B Dis-organiser twice and choose Recruit guide.');return false;}
  focus=doc.activeElement;city.stop();if(welcome)section='patrol';draw(welcome);dialog.showModal();removeHighlight();ribbon.hidden=true;return true;
 }
 // Help is inside the existing encounter's modal, never a second blocking popup.
 const combat=doc.getElementById('p21-combat-dialog'),combatHelp=make('details','cw-recruit-battle-help'),combatCopy=make('p');combatHelp.append(make('summary','','How do I fight?' ),combatCopy);combat.append(combatHelp);
 const battleFrame=doc.getElementById('p21-combat-frame'),engineFrame=doc.getElementById('p21-engine-frame'),engineHelp=make('details','cw-recruit-room-help'),engineCopy=make('p');engineHelp.append(make('summary','','What do I press?'),engineCopy);doc.getElementById('p21-engine-dialog')?.append(engineHelp);engineHelp.hidden=true;
 function message(e){if(e.origin!==location.origin)return;if(engineFrame&&e.source===engineFrame.contentWindow&&e.data?.type==='cw-p21-state'){const advice=roomAdvice(e.data.state,doc.getElementById('p21-engine-title')?.textContent);engineHelp.hidden=!advice;if(advice!==engineCopy.textContent){engineCopy.textContent=advice;engineHelp.open=progress.status==='guided'&&!!advice;}return;}if(e.source!==battleFrame.contentWindow)return;if(e.data?.type==='cw-p21-battle-state'){combatCopy.textContent=battleAdvice(e.data.battle);}}
 addEventListener('message',message);combatCopy.textContent=battleAdvice(null);
 const timer=setInterval(()=>{
  if(doc.hidden)return;event();
  // The Brass Bridge opening teaches by doing (Mark: no step-by-step tutorial). The guide stays in the Dis-organiser
  // menu; its welcome pop-up is only offered with the old opening (?opening=old).
  if(freshRecruit&&!welcomeOffered&&progress.status==='unseen'&&game.state().state.flags.watchOathVersion&&!game.state().state.flags.bridgeClosurePilot?.prologue&&/[?&]opening=old(&|$)/.test(location.search)&&!window.CWRecruitmentPending&&doc.body.dataset.cityBoot==='ready'&&!doc.querySelector('dialog[open],.cw-oath,#watch-notebook.open')){
   welcomeOffered=true;if(open(true))save({...progress,status:'offered'});
  }
 },1000);
 return Object.freeze({open,event,pause,beginPatrol(){save(begin(progress,city.steps()));live.textContent='First patrol started. Follow the highlighted patrol action.';},report:()=>({schema:1,status:progress.status,completed:[...progress.completed],current:currentLesson(progress)?.id||null,storageOK,key:GUIDE_KEY}),destroy(){clearInterval(timer);removeEventListener('message',message);removeHighlight();dialog.remove();ribbon.remove();help.remove();live.remove();combatHelp.remove();engineHelp.remove();style.remove();skin.remove();}});
}
