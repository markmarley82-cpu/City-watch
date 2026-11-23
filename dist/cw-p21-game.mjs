import {FIRST_CASE_FIGHT} from './cw-patrol-enquiries.mjs?v=purse-street-leads';
import {createPatrolConversations} from './city-conversations.mjs?v=p21-b407-s039-reuse';
import {createDibbler} from './cw-dibbler.mjs?v=p21-b461-watch-ui';
import './field-training/cw-encounter-feel.js?v=p21-b407-s039-reuse';
import {createPartnerTrail} from './city-partner-trail.mjs?v=p21-b407-s039-reuse';
import {createPatrolDuty} from './cw-patrol-duty.mjs?v=p21-b534-cw8';
import {canFollowNewspaperLead} from './newspapers/campaign-leads.mjs?v=p21-b407-s039-reuse';
import {createPatrolLoop} from './cw-patrol-loop.mjs?v=p21-b527-patrol-state-cw6';
import {patrolAction,caseProgress,filedCase} from './patrol-flow.mjs?v=p21-b407-s039-reuse';
import {createArmoury} from './cw-armoury.mjs?v=p21-b429-patrol-kit';
import {createCityPointLookup} from './city-point-lookup.mjs?v=p21-b407-s039-reuse';
import {createPalaceHost} from './palace/palace-host.mjs?v=b507';
import {createUniversityHost} from './university-host.mjs?v=p21-b502-university-ui-cw2';
import {projectCase01Notebook} from './university-case/notebook.mjs?v=cw1';
import {createRecruitGuide} from './cw-recruit-guide.mjs?v=p21-b461-watch-ui';
import {createPlayerContacts} from './cw-player-contacts.mjs?v=p21-b407-s039-reuse';
import {createUniversityWizards} from './university-wizards.mjs?v=p21-b407-s039-reuse';
import {campaignClock} from './city-clock.mjs?v=game-time';
import {organiserBriefing} from './city-imp-clock.mjs?v=purse-street-leads';
import {createGuildInteriorHost} from './guild-interiors/guild-host.mjs?v=room-v2';
import {createNewspaperStreetSellers} from './cw-newspaper-sellers.mjs?v=p21-b527-patrol-state';
import {createRecruitment}from './cw-recruitment.mjs?v=p21-b448-first-patrol-map';
import {createFirstPatrolBriefing}from './cw-first-patrol-briefing.mjs?v=p21-b466-colon-outside';
import {createCityServicesHost} from './city-services/city-services-host.mjs?v=p21-b461-watch-ui';
const city=window.CWP21City,$=id=>document.getElementById(id);
const artStartupTrace=message=>{if(new URLSearchParams(location.search).get('artQA')==='1')console.info('Art startup: '+message);};artStartupTrace('game imports ready');
const pointLookup=createCityPointLookup(city.world),nearest=pointLookup.nearest;
// Only explicitly registered guild doors can open campaign interiors.
let guildInteriors=null;artStartupTrace('guild setup');
try{const registry=await(await fetch('guild-interiors/guild-bindings.json?v=street-interiors-1')).json();if(registry.schema!==1)throw Error('Unsupported guild binding registry');if(registry.bindings.length&&registry.runtimeAssetsReady!==true)throw Error('Guild room assets are not enabled for production');if(registry.bindings.length)guildInteriors=await createGuildInteriorHost({city,makeStore:()=>window.CWP21State.create(localStorage),bindings:registry.bindings});}catch(error){console.warn('Guild interiors unavailable',error);}

let postalHost=null;
const postOfficeDoor=d=>d?.game_id==='post-office'&&!d.held;
const openPostOffice=()=>postalHost??=(import('./post-office/host.mjs?v=b507').then(m=>m.createPostOfficeHost({city,makeStore:()=>window.CWP21State.create(localStorage)})).catch(e=>{postalHost=null;throw e;}));
const enterPostOffice=door=>openPostOffice().then(host=>host.enter(door)).catch(e=>{city.tell(e.message);return false;});
let royalBankHost=null;
const royalBankDoor=d=>d?.game_id==='royal-bank'&&!d.held;
const openRoyalBank=()=>royalBankHost??=(import('./royal-bank/host.mjs?v=b507').then(m=>m.createRoyalBankHost({city,makeStore:()=>window.CWP21State.create(localStorage)})).catch(e=>{royalBankHost=null;throw e;}));
const enterRoyalBank=door=>openRoyalBank().then(host=>host.enter(door)).catch(e=>{city.tell(e.message);return false;});
artStartupTrace('palace setup');const palaceInteriors=await createPalaceHost({city,makeStore:()=>window.CWP21State.create(localStorage)});
artStartupTrace('palace ready');const universityInteriors=createUniversityHost({city,makeStore:()=>window.CWP21State.create(localStorage)});
let cityServicesHost=null,cityServicesLoading=false;
const cityServices={async open(options){if(cityServicesLoading)return false;cityServicesLoading=true;try{cityServicesHost=cityServicesHost||await createCityServicesHost({city,makeStore:()=>window.CWP21State.create(localStorage)});return await cityServicesHost.open(options);}catch{city.tell('The shops could not be loaded. Your patrol is safe; try opening them again.');return false;}finally{cityServicesLoading=false;}},report:()=>cityServicesHost?.report()||{loaded:false}};

// The city module owns navigation; this service owns the same durable campaign record.
let patrolDuty=null,patrolLoop=null,conversations=null;
let engineCacheTimer=null,cachedEngineState=null;
const engineStateKey=state=>{const {steps,...rest}=state;return JSON.stringify(rest);};
let engine=null,engineReady=null,cancelEngineLoad=null,combatID=null,activeEncounter=null,battleSettlement=null,assignment=null,loading=false,serviceEpoch=0,saveFailureShown=false;
let engineSessionGeneration=0,engineSessionToken=null;
const names={colon:'Sergeant Colon',vimes:'Commander Vimes',carrot:'Captain Carrot',palm:'Mrs Palm',witness:'Street Urchin',igor:'Watch Igor'};
const bindings={colon:'watch',vimes:'watch',carrot:'watch',palm:'market',witness:'shades',igor:'watch'};
const quests=[['Report to Sergeant Colon','Confirm the dock assignment with Colon','Search the Dock Warehouse','Speak with Mrs Palm','Find the Street Urchin in the Shades','Return to Sergeant Colon'],['Ask Vimes about the break-ins','Investigate the Guild Archives','Train with Captain Carrot','Question the delivery suspect','Enter the Old Crypt','Report to Commander Vimes'],['Talk to Commander Vimes','Investigate the two reported assaults','Speak to Sergeant Colon','Collect your commendation','Free patrol']];
const clone=v=>JSON.parse(JSON.stringify(v));
function encounterLocation(position){return window.BastionLocations.withLighting(window.BastionLocations.fromWorld(position,city.world),campaignClock(location.search,state().state));}
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function saveNav(){if(window.CWGameRestarting)throw Error("A new game is starting");const latest=window.CWP21State.create(localStorage);latest.navigation(city.position(),city.visits(),city.steps(),city.footPosition?.());latest.project();return latest;}
function saveFailure(){if(!saveFailureShown)city.tell('The patrol could not be fully saved. Keep this tab open and retry Save patrol.');saveFailureShown=true;}
function savePatrol(message){if(window.CWGameRestarting)return false;try{saveNav();saveFailureShown=false;if(message){city.tell(message);try{window.CWRecruitGuide?.event('saved');}catch(error){console.warn('Recruit tips could not update',error);}}return true;}catch{saveFailure();return false;}}
function state(){return window.CWP21State.create(localStorage).read();}
function target(record=state()){const s=record.state;return s.chapter===0?['npc:colon','npc:colon','warehouse','npc:palm','npc:witness','npc:colon'][Math.min(s.stage,5)]:s.chapter===1?['npc:vimes','archives','npc:carrot','suspect:smuggler','crypt','npc:vimes'][Math.min(s.stage,5)]:['npc:vimes','suspect:'+(s.flags.lorePatrolArrests?.includes('cutpurse-0')?'cutpurse-1':'cutpurse-0'),'npc:colon','npc:vimes',s.flags?.finalChoice?'watch':'npc:vimes'][Math.min(s.stage,4)];}
const Partner=window.CWPatrolPartner,M=window.BastionMentors;
const partnerFeet=createPartnerTrail();
const actors=[];let patrolMember=Partner.member(state().state,state().pending),partnerTrail=[],lastPartnerStep='',partnerDraws=0;
let detaineeTrail=[];
const detainee={id:'patrol-detainee',key:'cutpurse',name:'Suspect in custody',p:city.position().slice(),stoodDown:true};
const companion={id:'patrol-partner',exactFoot:true,moving:false,p:city.position().slice(),key:Partner.art(patrolMember.id),name:patrolMember.name};
async function syncPartner(){const v=state(),m=Partner.member(v.state,v.pending);await window.CWDrawnCharacters.current.ensureAppearance(Partner.art(m.id),{});patrolMember=m;companion.key=Partner.art(m.id);companion.name=m.name;companion.mentorId=m.id;const condition=v.pending?.battle?.actors?.find(a=>a.id==='partner'&&a.mentorId===m.id)||v.state.flags.patrolPartnerVitals?.[m.id];companion.stoodDown=condition?.hp===0;const start=city.position();companion.p=partnerFeet.reset(city.footPosition?.()||start);partnerTrail=[companion.p.slice()];lastPartnerStep='';}
function updatePartner(now,visualFoot){moveMarketVisitor(visualFoot);dibbler.update(now);updateChase(now);const p=city.position(),k=p.join(',');if(k!==lastPartnerStep){lastPartnerStep=k;partnerTrail.push(p.slice());if(partnerTrail.length>2)partnerTrail.shift();if(!detainee.stoodDown&&detaineeTrail.at(-1)?.join(',')!==k){detaineeTrail.push(p.slice());if(detaineeTrail.length>3)detainee.p=detaineeTrail.shift();}}const before=companion.p;companion.p=partnerFeet.sample(visualFoot||city.footPosition?.()||p);companion.moving=Math.hypot(companion.p[0]-before[0],companion.p[1]-before[1])>1e-8;partnerDraws++;}
function partnerMenu(){
 if(state().state.flags.bridgeClosurePilot?.status==='active'){city.tell('File or stand down the bridge enquiry before changing partners.');return false;}
 if(patrolDuty?.dimwellPartnerAway(state())){city.tell('Meet Nobby at the Park Lane approach before changing partners.');return false;}
 city.stop();const dialog=$('p21-duty-dialog'),box=$('p21-duty-actions');box.replaceChildren();
 const v=state(),eligible=new Set(M.unlocked({xp:v.state.merit}).map(m=>m.id)),current=Partner.member(v.state,v.pending).id;
 const title=document.createElement('p');title.textContent='Patrol partner: '+patrolMember.name+(v.pending?' · Finish the current encounter before changing partners.':' · Choose the officer who accompanies your patrol.');box.append(title);
 let selecting=false;const buttons=[];const active=()=>dialog.open&&box.children[0]===title;
 const blocked=(record,m)=>!!record.pending||loading||$('p21-engine-dialog').open||!M.unlocked({xp:record.state.merit}).some(x=>x.id===m.id)&&Partner.member(record.state,record.pending).id!==m.id;
 function updateButtons(){const latest=state(),current=Partner.member(latest.state,latest.pending).id;for(const [button,member] of buttons){button.disabled=selecting||blocked(latest,member);button.setAttribute('aria-pressed',String(member.id===current));}}
 async function syncCurrentPartner(){for(;;){await syncPartner();const latest=state();if(Partner.member(latest.state,latest.pending).id===patrolMember.id)return;}}
 for(const m of M.roster){
  const b=document.createElement('button'),locked=!eligible.has(m.id)&&m.id!==current;
  b.textContent=m.name+' · '+m.trait+(locked?' · Unlock at '+m.unlock+' merit':'');b.setAttribute('aria-pressed',String(m.id===current));
  b.disabled=!!v.pending||loading||$('p21-engine-dialog').open||locked;buttons.push([b,m]);
  b.onclick=async()=>{
   if(selecting||!active())return;
   let committed=false,projected=true;
   try{
    const st=window.CWP21State.create(localStorage),record=st.read();
    if(blocked(record,m))throw Error('Finish the current incident or service, and check the partner merit requirement.');
    if(Partner.member(record.state,record.pending).id===m.id){if(patrolMember.id!==m.id){committed=true;selecting=true;updateButtons();await syncCurrentPartner();}if(active())dialog.close();return;}
    selecting=true;updateButtons();
    await window.CWDrawnCharacters.current.ensureAppearance(Partner.art(m.id),{});
    if(!active())return;
    const latest=state();if(latest.revision!==record.revision||blocked(latest,m))throw Error('Your patrol changed. Reopen the partner list and try again.');
    record.state.flags.patrolMentorAssignment=M.assignment(m.id);
    if(!st.replaceRecord(record,record.revision))throw Error('Your patrol changed. Reopen the partner list and try again.');
    committed=true;try{st.project();}catch{projected=false;}
    await syncCurrentPartner();if(active())dialog.close();const saved=state(),selected=Partner.member(saved.state,saved.pending);city.tell(projected?selected.name+' joins your patrol. '+selected.advice:selected.name+' is saved as your patrol partner, but the full save did not finish. Use Save game again before entering a building.');refresh();
   }catch(e){if(committed){const saved=state(),selected=Partner.member(saved.state,saved.pending),message=selected.name+' is saved as your patrol partner. The appearance could not finish loading; reopen the partner list to retry.'+(projected?'':' The full save did not finish. Use Save game again before entering a building.');if(active())title.textContent=message;city.tell(message);refresh();}else if(active())title.textContent='Partner could not be changed: '+e.message;}
   finally{selecting=false;if(active())updateButtons();}
  };box.append(b);
 }
 const back=document.createElement('button');back.textContent='Back to Watch duty';back.onclick=()=>{buildDuty();dialog.close();$('p21-duty').click();};box.append(back);dialog.showModal();
}

for(const [id,place] of Object.entries(bindings)){
 let at=city.world.doors.get(place).position.slice();
 if(place==='watch'){at={colon:[121,135],vimes:[130,135],carrot:[134,135],igor:[118,135]}[id];}
 else at=nearest([at[0]+2,at[1]]);
 const p=nearest(at);actors.push({id,p,name:names[id],key:{vimes:'p3_named_vimes_base',carrot:'p3_named_carrot_base',palm:'p3_named_mrs_palm_base',witness:'p3_named_street_urchin_base',igor:'igor'}[id]||'p3_named_colon_base'});
}
actors.push(companion,detainee);artStartupTrace('partner setup');await syncPartner();artStartupTrace('partner ready');
const newspaperSellers=createNewspaperStreetSellers({city,actors,nearest,onChange:()=>{refresh();city.update();}});
artStartupTrace('named actors setup');await Promise.all(actors.filter(a=>a!==companion).map(async a=>{artStartupTrace('actor '+a.key);await city.characterPainter.library.ensure(a.key);artStartupTrace('ready '+a.key);}));artStartupTrace('named actors ready');
const dibbler=createDibbler({city,actors,nearest,onChange:()=>{refresh();city.update();}});
const universityWizards=createUniversityWizards({city,actors});
const playerContacts=createPlayerContacts({city,actors,state,member:()=>patrolMember,university:universityWizards,sellers:newspaperSellers,campaignTalk:id=>id==='carrot'&&patrolDuty?.deliveryContact()?patrolDuty.deliveryMenu():service('talk',id),pursuit:chaseMenu,walkTo,objective:()=>$('p21-objective').textContent,smallTalk:id=>conversations?.talk(id),hasSmallTalk:id=>conversations?.hasTalk(id)||false,assignmentAction:()=>{if(patrolBlocked())return false;return $('p21-track').onclick();}});
let purseActors=[];
function syncPurseActors(record){
 const contacts=patrolDuty?.openingContacts(record)||[];
 if(contacts.length===purseActors.length&&contacts.every((actor,i)=>actor.name===purseActors[i].name))return;
 for(const actor of purseActors)actors.splice(actors.indexOf(actor),1);
 purseActors=contacts;
 actors.push(...purseActors);
 for(const actor of purseActors)city.characterPainter.library.request(actor.key);
}
function purseContactClick(p){
 const actor=purseActors.find(a=>distance(p,a.p)<=1);
 if(!actor)return false;
 if(distance(city.footPosition?.()||city.position(),actor.p)<=1.6)patrolDuty.openPurse(actor.id.slice('purse-'.length));
 else city.nav(actor.p.slice(0,2),actor.p[2]);
 return true;
}
let marketActors=[],marketVisitor=null,marketTrail=[];
function syncMarketActors(record){
 const contacts=patrolDuty?.marketContacts(record)||[];
 if(!contacts.length&&marketActors.length){
  for(const actor of marketActors)actors.splice(actors.indexOf(actor),1);
  marketActors=[];marketVisitor=null;marketTrail=[];
 }
 if(contacts.length&&!marketActors.length){
  marketActors=contacts;
  actors.push(...marketActors);
  marketVisitor=marketActors[0];
 }
 if(!marketVisitor)return;
 const escorting=contacts[0].escorting;
 if(escorting&&!marketVisitor.exactFoot){
  const p=city.footPosition?.()||city.position();
  marketTrail=[p.slice()];marketVisitor.exactFoot=true;
 }
}
function moveMarketVisitor(foot){
 if(!marketVisitor?.exactFoot||!foot)return;
 const last=marketTrail.at(-1);
 if(last&&distance(last,foot)<.05)return;
 marketTrail.push(foot.slice());
 while(marketTrail.length>2&&(marketTrail.length>32||distance(foot,marketTrail[1])>=.8))marketTrail.shift();
 marketVisitor.moving=distance(marketVisitor.p,marketTrail[0])>.05;
 marketVisitor.p=marketTrail[0];
}
function marketContactClick(p){
 const actor=marketActors.find(a=>distance(p,a.p)<=1);
 if(!actor)return false;
 if(actor.exactFoot)return false;
 if(distance(city.footPosition?.()||city.position(),actor.p)<=1.8){
  patrolDuty.talkMarket(actor.id==='market-case-visitor'?'visitor':'guide');
 }else city.nav(actor.p.slice(0,2),actor.p[2]);
 return true;
}
function npcNear(){return actors.filter(a=>!a.id.startsWith('market-case-')&&!a.id.startsWith('purse-')&&a.id!=='dibbler'&&a.id!=='colon'&&a.id!=='patrol-partner'&&a.id!=='chase-suspect'&&a.id!=='delivery-runner'&&a.id!=='patrol-detainee'&&!newspaperSellers.isSeller(a.id)&&distance(city.position(),a.p)<=3).sort((a,b)=>distance(city.position(),a.p)-distance(city.position(),b.p))[0]||(city.nearColon()?{id:'colon',name:names.colon}:null);}
function assignmentContact(record){const current=target(record);if(!current.startsWith('npc:'))return null;const id=current.slice(4);if(id==='colon')return city.nearColon()?{id,name:names.colon}:null;return actors.find(a=>a.id===id&&distance(city.position(),a.p)<=3)||null;}
const DIMWELL_RENDEZVOUS='Meet Nobby at the Park Lane approach before starting another encounter.';
function dimwellEncounterHold(record){return !record.pending&&patrolDuty?.dimwellPartnerAway(record);}
function encounterBinding(record=state()){const s=record.state,p=city.position();if(dimwellEncounterHold(record)||patrolDuty?.escortActive(record))return null;if(patrolDuty?.openingSuspect(record))return FIRST_CASE_FIGHT;if(s.chapter===1&&s.stage===3&&distance(p,city.world.doors.get('crypt').position)<5)return 'smuggler';if(s.chapter===1&&s.stage===4&&!s.flags.cryptWon&&distance(p,city.world.doors.get('crypt').position)<5)return 'crypt-raider';if(s.chapter===2&&s.stage===1){for(const [i,id] of ['market','shades'].entries())if(distance(p,nearest(city.world.doors.get(id).position))<5&&!s.flags.lorePatrolArrests?.includes('cutpurse-'+i))return 'cutpurse-'+i;}if(patrolDuty?.shiftDisturbance(record))return 'shift-disturbance';return distance(p,city.world.doors.get('drum').position)<5?'taproom':null;}
function freePatrolNeedsDuty(record=state()){const s=record.state;return !record.pending&&!patrolDuty?.onShift(record)&&s.chapter>=2&&s.stage>=quests[2].length-1&&!!s.flags?.finalChoice;}
// Between shifts in chapter 0, when Captain Carrot's assignment is waiting, point the shortcut at him
// (the reminder text already names Carrot).
function carrotWaiting(record){const s=record.state,rounds=s.flags?.p21PatrolRounds;return !record.pending&&s.chapter===0&&s.stage===0&&Number(rounds?.paidShifts)>0&&!rounds?.active&&!!patrolDuty?.deliveryAvailable(record);}
function assignmentAction(record,binding,contact=assignmentContact(record)){
 if(freePatrolNeedsDuty(record))return {kind:'patrol',label:'Choose night duty'};
 // An open Bridge enquiry comes first: the shortcut opens its case screen (the leads and Walk buttons).
 if(!binding&&!record.pending&&record.state.flags.bridgeClosurePilot?.status==='active'&&!record.state.flags.p21PatrolRounds?.active)return {kind:'bridge',label:'Bridge enquiry'};
 if(!binding&&carrotWaiting(record))return {kind:'carrot',label:patrolDuty?.deliveryContact(record)?'Talk to Captain Carrot':'Walk to Captain Carrot'};
 const destination=target(record);
 const destinationName=destination==='suspect:smuggler'?'Old Crypt':destination==='suspect:cutpurse-0'?'Market Hall':destination==='suspect:cutpurse-1'?'the Shades Tenement':destination.startsWith('npc:')?names[destination.slice(4)]:city.world.doors.get(destination)?.name;
 return patrolAction({pending:record.pending,target:destination,nearContact:contact,nearDoor:city.nearDoor(),binding,destinationName});
}
let lastCaseState=null;
function dutyDeskAction(record=state(),assigned=assignmentContact(record),view=patrolDuty?.view(record)){return !record.pending&&(view?.firstCase||view?.incidentChoice||view?.dimwell||view?.action==='inspect'&&patrolDuty?.shiftDisturbance(record)||assigned?.id==='colon')&&['book','report'].includes(view?.action)?view:null;}
function primaryAction(){const record=state(),action=assignmentAction(record,encounterBinding(record));if(action.kind==='bridge')return openBridgeCase();if(action.kind==='carrot')return patrolDuty.goCarrot();if(action.kind==='patrol')return patrolDuty.menu();if(action.kind==='chase')return chaseMenu();if(action.kind==='battle')return battle();if(action.kind==='talk')return service('talk',action.id);if(action.kind==='room')return window.CWP21Game.room(city.nearDoor());return walkTo();}
// One fresh record per HUD refresh. Interactions and saves still read storage separately.
function refresh(){const v=state(),s=v.state;patrolDuty?.observeDimwell(v);patrolDuty?.observeDeliveryTail(v);syncDeliveryRunner(v);syncMarketActors(v);syncPurseActors(v);const filed=filedCase(lastCaseState,s);lastCaseState={chapter:s.chapter,merit:s.merit,coins:s.coins};if(filed)city.tell(filed);if(window.CWP21Game)window.CWP21Game.weaponArtId=window.CWWeapons.inventory(s).equipped;$('p21-health').textContent='Health '+s.hp+'/'+s.maxhp;$('p21-money').textContent=s.coins+(s.coins===1?' coin':' coins');const rank=window.CWP21State?.career(s);
 $('p21-merit').textContent=(rank?rank.name+' · ':'')+s.merit+' merit';
 if(window.CWP21Game?.patrolDuty){
  const inCustody=window.CWP21Game.patrolDuty.escortActive(v);
  if(inCustody&&detainee.stoodDown){detainee.p=city.position().slice();detaineeTrail=[detainee.p];}
  detainee.stoodDown=!inCustody;
 }$('p21-objective').textContent=quests[Math.min(s.chapter,2)][Math.min(s.stage,quests[Math.min(s.chapter,2)].length-1)];const binding=encounterBinding(v);$('p21-encounter').disabled=!binding&&!v.pending;$('p21-encounter').textContent=v.pending?'Resume encounter':binding==='taproom'?'Mended Drum brawl':binding?'Approach incident':'No nearby incident';if(v.pending?.chase){const c=v.pending.chase;$('p21-objective').textContent=(c.status==='search'?'Search · last seen: ':c.status==='surrendered'?'Surrendered · ':c.status==='caught'?'Caught up · ':'Pursuit · ')+c.name;if(!patrolLoop)$('p21-track').textContent=c.status==='search'?'Go to last sighting':'Follow suspect';$('p21-encounter').textContent=['caught','surrendered'].includes(c.status)?'Approach suspect':'Pursuit options';}else if(!patrolLoop)$('p21-track').textContent='Walk to assignment';const assigned=assignmentContact(v),n=assigned||npcNear();if(n)$('city-use').textContent='Talk to '+n.name;const seller=newspaperSellers.nearby();if(seller&&!assigned)$('city-use').textContent=(newspaperSellers.owns(seller.paper,s)?'Read ':'Buy ')+(seller.paper==='times'?'Times':'Inquirer');const action=assignmentAction(v,binding,assigned);if(!patrolLoop)$('p21-track').textContent=action.label;$('p21-encounter').hidden=!binding||!!v.pending;newspaperSellers.refresh();const dutyView=patrolDuty?.view(v)??null;if(dibbler.nearby()&&!assigned&&!seller)$('city-use').textContent='Talk to Dibbler';if(v.pending?.chase)$('city-use').textContent=['caught','surrendered'].includes(v.pending.chase.status)?'Approach suspect':'Pursuit options';else{const d=city.nearDoor();if(d?.shop_key||d?.lodging_grade!==undefined||(d?.game_id==='university'&&!assigned&&!seller))$('city-use').textContent='Enter '+d.name;if(!assigned&&binding&&binding!=='taproom'&&!d?.shop_key&&d?.lodging_grade===undefined)$('city-use').textContent=$('p21-encounter').textContent;if(!v.pending&&!assigned&&(!binding||binding==='taproom')&&!d?.shop_key&&d?.lodging_grade===undefined&&['inspect','report','book'].includes(dutyView?.action))$('city-use').textContent=dutyView.label;}const deskDuty=dutyDeskAction(v,assigned,dutyView), marketDuty=dutyView;if(marketDuty?.marketCase&&marketDuty.action==='inspect')$('city-use').textContent=marketDuty.marketRole?'Talk to '+(marketDuty.marketRole==='visitor'?'Visitor':'Guide'):marketDuty.label;if(deskDuty)$('city-use').textContent=deskDuty.label;
 if(marketDuty?.firstCase&&marketDuty.action==='inspect')$('city-use').textContent=marketDuty.label;
 const followup=patrolDuty?.dimwellFollowup(v);
 if(marketDuty?.delivery&&['inspect','report'].includes(marketDuty.action))$('city-use').textContent=marketDuty.label;
 else if(followup&&marketDuty?.action!=='inspect')$('city-use').textContent=followup.label;
 else if(patrolDuty?.deliveryContact(v))$('city-use').textContent='Talk to Captain Carrot';if(v.pending&&!v.pending.chase)$('city-use').textContent='Resume encounter';patrolLoop?.update(v,{primaryLabel:action.label,binding,deliveryAvailable:patrolDuty?.deliveryAvailable(v),blocked:patrolBlocked()},dutyView);window.CWOrganiserBriefing?.update(organiserBriefing(v,{objective:$('p21-objective').textContent,dutyView}));}
function followNewspaperLead(lead){
 if(loading){city.tell('Finish opening the current Watch service before following a newspaper lead.');return false;}
 if(engine&&closeEngine()===false)return false;
 const record=state();
 if(!canFollowNewspaperLead(lead,record)){city.tell(record.pending?'Finish the current incident before following this lead.':'This report is historical now. Check your current assignment in the Notebook.');return false;}
 window.CWRecruitGuide?.pause?.();
 const followed=walkTo();
 if(followed!==false)city.tell('Following your current investigation. The newspaper report is a lead, not evidence. Use the assignment action when you arrive.');
 return followed!==false;
}
function walkToCurrentAssignment(){
 const record=state(),duty=patrolDuty?.view(record);
 if(!record.pending&&duty?.incidentChoice)return patrolDuty.go();
 if(!record.pending&&duty?.firstCase&&patrolDuty.goFirstLead?.())return true;
 // During a Night duty round, walk to the round's own checkpoint (or back to Colon), not the story target.
 if(!record.pending&&duty&&!duty.firstCase&&patrolDuty.go())return true;
 // Between shifts with Carrot's assignment waiting (the objective names Carrot), walk to Carrot.
 // If something on screen makes goCarrot decline, still head for Carrot rather than the story target (Colon).
 if(!record.pending&&!duty&&record.state.flags.bridgeClosurePilot?.status==='active'){openBridgeCase();return true;}
 // Carrot's case between leads has no single destination: open its lead list (each with Walk to …)
 // rather than walking to the main story target.
 if(!record.pending&&duty?.delivery&&!duty.target&&duty.action==='menu')return patrolDuty.deliveryMenu();
 if(!record.pending&&!duty&&carrotWaiting(record))return patrolDuty.goCarrot?.()||walkTo('npc:carrot');
 // Dimwell beat: walk to the same next stop the map marks.
 if(!record.pending&&duty?.dimwell&&!patrolBlocked()){const stop=patrolDuty.mapStop?.();if(stop?.position){city.stop();return city.nav(stop.position.slice(0,2),stop.position[2]);}}
 return walkTo();
}
function walkTo(id=target()){
 city.stop();const chase=state().pending?.chase;if(chase){const p=chase.visible?chase.route[chase.index]:chase.lastSeen;chaseTracking=true;lastChaseTarget=p.join(',');return city.nav(p.slice(0,2),p[2],{pursuit:true});}let p,e;
 if(id.startsWith('npc:')){const a=actors.find(a=>a.id===id.slice(4));p=a.p.slice(0,2);e=a.p[2];if(a.id==='colon'){p=[121,134];e='RC1';}}
 else if(id.startsWith('suspect:')){const name=id.slice(8),d=city.world.doors.get(name==='cutpurse-0'?'market':name==='cutpurse-1'?'shades':'crypt');const q=nearest(d.position);p=q.slice(0,2);e=q[2];}
 else{const d=city.world.doors.get(id);if(!d||d.held){city.tell('The entrance is closed; choose another destination.');return false;}p=d.position;e=d.edge;}
 return city.nav(p,e);
}
async function loadEngine(){
 clearTimeout(engineCacheTimer);if(engine&&cachedEngineState===engineStateKey(state().state))return engine;if(engine)unload();if(engineReady)return engineReady;
 const frame=$('p21-engine-frame');saveNav().project();
 let resolveReady,rejectReady,done=false,poll,timer;
 const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});engineReady=ready;
 const finish=(error,api)=>{if(done)return;done=true;clearTimeout(timer);clearTimeout(poll);frame.onload=null;if(engineReady===ready){engineReady=null;cancelEngineLoad=null;}if(error)rejectReady(error);else{engine=api;resolveReady(api);}};
 cancelEngineLoad=()=>finish(Error('Watch service opening cancelled.'));
 timer=setTimeout(()=>finish(Error('The Watch services could not start. Return to the city and retry.')),45000);
 frame.onload=()=>{const check=()=>{if(done)return;try{const api=frame.contentWindow?.CWP21Engine,boot=frame.contentWindow?.CW_BOOT_DIAGNOSTICS?.();if(boot?.phase==='error')finish(Error('Watch services could not load. Try again from the street.'));else if(api&&boot?.phase==='ready')finish(null,api);else poll=setTimeout(check,100);}catch(e){finish(e);}};check();};
 frame.src='campaign-engine.html?unified=1&v='+encodeURIComponent((window.CW_LAB_RELEASE?.runtimeCacheToken||'p21-b153-deferred-painting-recovery')+'-cw15');return ready;
}
function invokeEngine(api,command,id,context){
 return new Promise((resolve,reject)=>{
  let done=false;
  const finish=(error,value)=>{
   if(done)return;
   done=true;clearTimeout(timer);
   if(cancelEngineLoad===cancel)cancelEngineLoad=null;
   if(error)reject(error);else resolve(value);
  };
  const cancel=()=>finish(Error('Watch service opening cancelled.'));
  const timer=setTimeout(()=>finish(Error('The Watch service did not finish opening. Try again from the street.')),25000);
  cancelEngineLoad=cancel;
  try{Promise.resolve(api.invoke(command,id,context)).then(value=>finish(null,value),error=>finish(error));}
  catch(error){finish(error);}
 });
}
function unload(){clearTimeout(engineCacheTimer);cachedEngineState=null;engineSessionToken=null;const frame=$('p21-engine-frame');cancelEngineLoad?.();cancelEngineLoad=null;engine=null;engineReady=null;frame.onload=null;frame.src='about:blank';}
function matchesEngineSession(token){try{return token!==null&&token===engineSessionToken&&engine!==null&&$('p21-engine-frame').contentWindow?.CWP21Engine===engine;}catch{return false;}}
async function service(command,id){
 if(state().pending){if(command==='casebook'){window.CW_NOTEBOOK?.openSection('Cases');return;}city.tell('Finish the current encounter before using Watch treatment or inventory services. Your incident and equipment are preserved.');return;}if(loading)return;const epoch=++serviceEpoch,sessionToken=++engineSessionGeneration;engineSessionToken=sessionToken;loading=true;city.stop();
 const dialog=$('p21-engine-dialog'),status=$('p21-engine-loading'),frame=$('p21-engine-frame'),close=$('p21-engine-close');
 try{
  saveNav();
  $('p21-engine-title').textContent=command==='room'?city.world.doors.get(id)?.name||'Interior':names[id]||'Watch duty';
  status.textContent=command==='talk'?'Opening conversation…':command==='room'?'Opening interior…':'Opening Watch services…';
  status.hidden=false;frame.inert=true;close.textContent='Cancel';
  delete dialog.dataset.cwBook;delete dialog.dataset.cwDialogue;dialog.dataset.cwService=command;dialog.dataset.loading='';
  dialog.showModal();
  const api=await loadEngine();
  if(epoch!==serviceEpoch)return;
  engineSessionToken=sessionToken;
  const snap=await invokeEngine(api,command,id,{sessionToken,campaignSteps:state().state.steps,patrol:{location:$('city-location').textContent,position:city.position().slice(0,2)}});
  if(epoch!==serviceEpoch)return;
  const store=window.CWP21State.create(localStorage);store.campaign(snap.state);assignment=snap.assignment;
  if(command==='talk'&&frame.contentDocument?.querySelector('#cw-npc-dialogue[open]'))dialog.dataset.cwDialogue='';
  frame.inert=false;status.hidden=true;close.textContent='Return to city';delete dialog.dataset.loading;
  if(dialog.hasAttribute('data-cw-dialogue'))frame.contentDocument.querySelector('#cw-npc-dialogue button')?.focus({preventScroll:true});
  refresh();
 }catch(e){
  if(epoch===serviceEpoch){dialog.close();unload();city.tell(e.message||'Could not open. Try again from the street.');}
 }finally{if(epoch===serviceEpoch)loading=false;}
}
function closeEngine(){
 const dialog=$('p21-engine-dialog');
 if(!dialog.open&&!loading)return true;
 const wasLoading=loading;
 serviceEpoch++;loading=false;
 if(engine&&!wasLoading){
  try{const snap=engine.snapshot();const st=window.CWP21State.create(localStorage);st.campaign(snap.state);st.project();}
  catch{delete dialog.dataset.cwBook;delete dialog.dataset.cwDialogue;saveFailure();$('p21-engine-loading').textContent='Saving could not finish. Keep this window open and retry Return to city.';$('p21-engine-loading').hidden=false;return false;}
 }
 if(dialog.open)dialog.close();
 if(engine&&!wasLoading){cachedEngineState=engineStateKey(state().state);engineSessionToken=null;if(engine.suspend()!==false)engineCacheTimer=setTimeout(unload,90000);else unload();}
 else unload();
 refresh();city.update();
}
let battleLoadTimer;
async function battle({savedHandoff=false}={}){if(combatID&&$('p21-combat-dialog').open)return;const v=state();if(dimwellEncounterHold(v)){city.tell(DIMWELL_RENDEZVOUS);return;}const binding=v.pending?.binding??encounterBinding(v);if(v.pending?.chase){chaseMenu();return;}if(!v.pending&&!binding){city.tell('Walk to an active incident or the Mended Drum to begin an encounter.');return;}city.stop();let pending;try{const st=savedHandoff?window.CWP21State.create(localStorage):saveNav();pending=st.begin({[FIRST_CASE_FIGHT]:'CW-OPENING-PURSE','shift-disturbance':'CW-SHIFT-DISTURBANCE',smuggler:'P21-DELIVERY','crypt-raider':'P21-DELIVERY','cutpurse-0':'P21-PATROL','cutpurse-1':'P21-PATROL'}[binding]||'taproom',binding,encounterLocation(v.pending?.position||city.position()));}catch{saveFailure();return;}combatID=pending.id;activeEncounter=pending;battleSettlement=null;const d=$('p21-combat-dialog'),frame=$('p21-combat-frame');
 d.dataset.loading='';$('p21-combat-loading').hidden=false;$('p21-combat-close').textContent='Cancel';frame.inert=true;
 frame.src='field-training/index.html?campaign=1&v=p21-b499-purse-appearances-cw2';d.showModal();
 battleLoadTimer=setTimeout(()=>{closeBattle();city.tell('The encounter could not open. You can resume it from the street.');},25000);}
window.addEventListener('message',e=>{
 if(window.CWGameRestarting)return;
 if(e.origin!==location.origin)return;
 if(e.data?.type==='cw-p21-open-armoury'&&e.source===$('p21-engine-frame').contentWindow&&$('p21-engine-dialog').open){
  if(!loading&&closeEngine()!==false)armoury.open();
  return;
 }
 if(e.data?.type==='cw-p21-open-night-duty'&&e.source===$('p21-engine-frame').contentWindow&&$('p21-engine-dialog').open){
  if(closeEngine()!==false)patrolDuty.menu({fromWatchHouse:true});
  return;
 }
 if(e.data?.type==='cw-p21-open-city-atlas'&&e.source===$('p21-engine-frame').contentWindow&&$('p21-engine-dialog').open){
  if(!state().pending&&closeEngine()!==false)$('atlas-open').click();
  return;
 }
 if(e.data?.type==='cw-p21-open-lodging'&&e.source===$('p21-engine-frame').contentWindow&&$('p21-engine-dialog').open){if(closeEngine()!==false)cityServices.open({grade:0});return;}
 if(e.source===$('p21-engine-frame').contentWindow&&$('p21-engine-dialog').open){
  if(e.data?.type==='cw-p21-menu-view'){if(matchesEngineSession(e.data.sessionToken)&&typeof e.data.book==='boolean')$('p21-engine-dialog').dataset.cwBook=String(e.data.book);return;}
  if(e.data?.type==='cw-p21-state'){if(loading||!matchesEngineSession(e.data.sessionToken))return;const st=window.CWP21State.create(localStorage);st.campaign(e.data.state);assignment=e.data.assignment;if(e.data.message)city.tell(e.data.message);refresh();}
  if(e.data?.type==='cw-p21-exit'){
   const follow=e.data.intent==='follow-assignment';
   if(e.data.intent!==undefined&&!follow)return;
   if(!matchesEngineSession(e.data.sessionToken))return;
   if(closeEngine()!==false){if(follow)walkTo();}
   return;
  }
 }
 if(e.source!==$('p21-combat-frame').contentWindow)return;
 if(e.data?.type==='cw-p21-battle-ready'&&activeEncounter&&combatID&&$('p21-combat-dialog').open){
  try{const record=state(),pending=record.pending;if(pending?.id!==combatID||pending.binding!==activeEncounter.binding||pending.chase||pending.battle!=null&&(!pending.battle.actors?.length||!['battle','result'].includes(pending.battle.phase))){battleSaveFailure();return;}activeEncounter=pending;e.source.postMessage({type:'cw-p21-battle-init',pending,state:record.state,record,sound:window.CWTeamAudio.report().enabled},location.origin);}catch{battleSaveFailure();}
 }
 if(e.data?.type==='cw-p21-battle-presented'&&combatID&&e.data.encounterId===combatID&&$('p21-combat-dialog').open){
  clearTimeout(battleLoadTimer);$('p21-combat-loading').hidden=true;$('p21-combat-close').textContent='Return to city';
  const frame=$('p21-combat-frame');frame.inert=false;delete $('p21-combat-dialog').dataset.loading;frame.focus({preventScroll:true});
 }
 if(e.data?.type==='cw-p21-battle-load-error'&&combatID&&e.data.encounterId===combatID){closeBattle();city.tell('The encounter could not open. You can resume it from the street.');return;}
 if(e.data?.type==='cw-p21-preparation-bind'&&combatID&&e.data.encounterId===combatID){try{const store=window.CWP21State.create(localStorage);if(!store.replaceRecord(e.data.record,e.data.expectedRevision)){city.tell('The queued preparation could not be bound because the campaign changed. Return to the city and retry.');closeBattle();return;}try{store.project();}catch{}activeEncounter=store.read().pending;}catch{city.tell('The encounter could not be saved. Your preparation is still in the last saved patrol.');closeBattle();return;}}
 if(e.data?.type==='cw-p21-battle-state'&&combatID&&e.data.encounterId===combatID){try{window.CWP21State.create(localStorage).battle(combatID,e.data.battle);}catch{city.tell('The encounter could not be saved. Return after freeing storage to resume the last saved turn.');closeBattle();return;}}
 if(e.data?.type==='cw-p21-battle-result'&&combatID&&e.data.encounterId===combatID){
  const id=combatID,binding=activeEncounter?.binding;
  try{
   battleSettlement=battleSettlement?.id===id?battleSettlement:{id,binding,before:state().state,expected:null};
   const current=state(),archived=current.encounters.at(-1);
   if(!archived||archived.id!==id){
    if(startChase(id,e.data.battle)){closeBattle();return;}
    const st=window.CWP21State.create(localStorage);
    if(!st.resolve(id,e.data.battle)){battleSaveFailure();return;}
    const expected=st.read();battleSettlement.expected={chapter:expected.state.chapter,stage:expected.state.stage};
   }
   const st=window.CWP21State.create(localStorage),committed=st.read(),last=committed.encounters.at(-1),expected=battleSettlement.expected;
   if(!expected||last?.id!==id||last.binding!==binding||committed.pending!==null||committed.state.chapter!==expected.chapter||committed.state.stage!==expected.stage){battleSaveFailure();return;}
   st.project();city.restore(committed.position);window.CWTeamAudio.cue('reward');city.tell(window.CWEncounterFeel.outcomeCopy(battleSettlement.before,committed.state,e.data.battle.result));
   closeBattle();refresh();city.update();
  }catch{battleSaveFailure();}
 }
 if(e.data?.type==='cw-p21-battle-exit'&&combatID&&e.data.encounterId===combatID)closeBattle();
});
function battleSaveFailure(){saveFailure();$('p21-combat-frame').contentWindow.postMessage({type:'cw-p21-battle-save-failed',encounterId:combatID},location.origin);}
function closeBattle(){clearTimeout(battleLoadTimer);if($('p21-combat-dialog').open)$('p21-combat-dialog').close();$('p21-combat-frame').src='about:blank';combatID=null;activeEncounter=null;battleSettlement=null;syncPartner().catch(e=>city.tell(e.message));refresh();}
$('p21-engine-frame').addEventListener('load',()=>{if(!engineReady){engineSessionToken=null;engine=null;}});
$('p21-engine-close').onclick=()=>engine&&!loading?engine.leave():closeEngine();$('p21-engine-dialog').addEventListener('cancel',e=>{e.preventDefault();$('p21-engine-close').click();});$('p21-combat-close').onclick=closeBattle;$('p21-combat-dialog').addEventListener('cancel',e=>{e.preventDefault();closeBattle();});
artStartupTrace('recruitment setup');const recruitment=await createRecruitment({city});artStartupTrace('recruitment ready');
function guildDirectory(page=0){
 if(state().pending){city.tell('Finish the current encounter before visiting a guildhouse.');return;}
 const dialog=$('p21-duty-dialog'),box=$('p21-duty-actions'),doors=[...city.world.doors.values()].filter(d=>d.room_id&&!d.held),pages=Math.max(1,Math.ceil(doors.length/3));page=Math.max(0,Math.min(pages-1,page));box.replaceChildren();
 const heading=document.createElement('p');heading.textContent='Guildhouses · page '+(page+1)+' of '+pages;box.append(heading);
 for(const door of doors.slice(page*3,page*3+3)){const b=document.createElement('button');b.textContent='Walk to '+door.name;b.onclick=()=>{dialog.close();walkTo(door.game_id);};box.append(b);}
 for(const [label,next] of [['Previous guildhouses',page-1],['Next guildhouses',page+1]]){const b=document.createElement('button');b.textContent=label;b.disabled=next<0||next>=pages;b.onclick=()=>guildDirectory(next);box.append(b);}
 const back=document.createElement('button');back.textContent='Back to Watch duty';back.onclick=buildDuty;box.append(back);if(!dialog.open)dialog.showModal();
}
const armoury=createArmoury({city,refresh,walkTo});
function streetIncidents(){
 city.stop();const dialog=$('p21-duty-dialog'),box=$('p21-duty-actions');box.replaceChildren();
 const record=state(),rendezvous=dimwellEncounterHold(record),binding=encounterBinding(record),escorting=patrolDuty?.escortActive(record);
 const note=document.createElement('p');
 note.textContent=record.pending?'Resume your current encounter here.':
  rendezvous?DIMWELL_RENDEZVOUS:
  escorting?'Hand over your suspect at the Watch House before looking for another fight.':
  binding==='taproom'?'You’re at the Mended Drum. Start the brawl here; your partner joins you.':
  binding==='shift-disturbance'?'A disturbance has broken out at this patrol stop. You can intervene with your partner or continue your round.':
  binding?'You’re close enough to start this case encounter.':
  'Walk to the Mended Drum for a brawl with your partner. You choose whether to start it when you arrive.';
 box.append(note);
 const current=document.createElement('button');current.textContent=record.pending?'Resume encounter':binding==='taproom'?'Start Mended Drum brawl':'Start nearby encounter';current.disabled=!record.pending&&!binding;current.onclick=()=>{dialog.close();battle();};box.append(current);
 if(!record.pending&&!escorting&&!rendezvous&&!binding){
  const walk=document.createElement('button');walk.textContent='Walk to Mended Drum';walk.onclick=()=>{dialog.close();walkTo('drum');city.tell('When you arrive, choose Duty → Street incidents & combat → Start Mended Drum brawl.');};box.append(walk);
 }
 const back=document.createElement('button');back.textContent='Back to Watch duty';back.onclick=buildDuty;box.append(back);dialog.showModal();
}
const bridgeCaseTitle='The Bridge That Was Closed';
let bridgeCaseHost=null,bridgeCaseLoading=false;
function bridgeCaseLabel(){
 const v=state(),flags=v.state.flags,c=flags.bridgeClosurePilot,mentor=Partner.assignment(v.state,v.pending).mentorId;
 if(c)return c.status==='active'?'Resume bridge enquiry':'Bridge enquiry report';
 if(v.pending||flags.p21PatrolRounds?.active||!['WATCH-04','WATCH-03'].includes(mentor))return '';
 const rounds=flags.p21PatrolRounds;
 return v.state.chapter>0||rounds?.creditedRoutes?.includes('watch-square-purse')||(rounds?.reports||[]).some(r=>r.routeId==='watch-square-purse')?bridgeCaseTitle:'';
}
async function openBridgeCase(){
 if(bridgeCaseLoading||patrolBlocked())return;
 bridgeCaseLoading=true;
 try{
  if(!bridgeCaseHost){
   const [{createBridgeClosure},{streetPath}]=await Promise.all([import('./cases/bridge-closure.mjs?v=3'),import('./city-movement.mjs?v=p21-b444-tap-route-start')]);
   bridgeCaseHost=createBridgeClosure({city,dialog:$('p21-duty-dialog'),box:$('p21-duty-actions'),makeStore:()=>window.CWP21State.create(localStorage),
    partner:r=>Partner.assignment(r.state,r.pending).mentorId,findPath:(a,b)=>streetPath(city.world,a,b.slice(0,2),b[2]),
    onChange:message=>{city.tell(message);refresh();},showDuty:buildDuty});
  }
  if(!patrolBlocked()){city.stop();bridgeCaseHost.open();}
 }catch(error){console.warn(error);city.tell('The bridge enquiry could not be opened. Your saved patrol is unchanged; try again from Duty.');}
 finally{bridgeCaseLoading=false;}
}
const duty=[[bridgeCaseLabel,openBridgeCase],[()=>freePatrolNeedsDuty()?'':'Night duty',()=>patrolDuty.menu()],['Rest & rooms',()=>cityServices.open({grade:0})],['Street incidents & combat',streetIncidents],['City shops & lodging',()=>cityServices.open()],['Find Dibbler',()=>dibbler.find()],[()=>patrolDuty?.deliveryActive(state())||patrolDuty?.deliveryAvailable(state())?'Carrot’s assignment':'',()=>patrolDuty.deliveryMenu()],['Armoury & kit',()=>armoury.open()],['Talk to patrol partner',()=>patrolDuty?.dimwellPartnerAway(state())?city.tell('Nobby is following the runner. Meet him at the Park Lane approach.'):playerContacts.partner()],[()=> 'Conversation hints: '+(conversations?.hintsEnabled()===false?'OFF':'ON'),()=>{if(!conversations)return;const enabled=conversations.setHints(!conversations.hintsEnabled());city.tell('Conversation hints '+(enabled?'on.':'off.'));}],['People & contacts',()=>playerContacts.directory()],['Patrol partner',partnerMenu],[()=>{const v=state();return v.pending?'Current incident':v.state.chapter>=2&&v.state.stage>=quests[2].length-1?'Case history':'Current case';},()=>state().pending?battle():window.CW_NOTEBOOK?.openSection('Cases')],['Casebook',()=>service('casebook')],['Inventory',()=>service('inventory')],['Watch Notebook',()=>window.CW_NOTEBOOK?.open()],['Guildhouses',()=>guildDirectory()],['Walk to University',()=>walkTo('university')],['University people',()=>state().pending?city.tell('Finish the current encounter before visiting the University faculty.'):universityWizards.menu(walkTo)],['Appearance',()=>$('city-appearance').click()],[()=>freePatrolNeedsDuty()?'Choose night duty':'Walk to current assignment',()=>freePatrolNeedsDuty()?patrolDuty.menu():walkToCurrentAssignment()],['Save game',()=>savePatrol('P21 campaign saved.')]];
function buildDuty(){$('p21-duty-actions').replaceChildren();for(const [label,fn] of duty){const text=typeof label==='function'?label():label;if(!text)continue;const b=document.createElement('button');b.textContent=text;b.onclick=()=>{$('p21-duty-dialog').close();fn();};$('p21-duty-actions').append(b);}}
document.getElementById('p21-orders-bar').append($('p21-encounter'));
buildDuty();
$('p21-duty').onclick=()=>{if(window.CWRecruitmentPending||document.querySelector('dialog[open],.cw-oath'))return;buildDuty();city.stop();$('p21-duty-dialog').showModal();};document.querySelector('[data-close-duty]').onclick=()=>$('p21-duty-dialog').close();$('p21-orders').onclick=()=>service('casebook');$('p21-track').onclick=primaryAction;$('p21-encounter').onclick=battle;
$('city-save').onclick=()=>savePatrol('P21 saved · assignment, health, evidence, city position and encounters.');
window.CW_UNIVERSITY_NOTEBOOK=projectCase01Notebook;
window.CW_NOTEBOOK_SNAPSHOT=()=>{const v=state();return {state:v.state,incidents:window.CWIncidentRecords?.view(v),assignment:{current:$('p21-objective').textContent,recruitName:v.state.flags.recruitName||''}};};
let lastSaved='';setInterval(()=>{if(window.CWRecruitmentPending||document.querySelector('dialog[open],.cw-oath'))return;const k=city.position().join(',')+':'+city.steps();if(k!==lastSaved&&savePatrol())lastSaved=k;},1000);
addEventListener('pagehide',()=>{if(!loading&&!combatID&&!engine)savePatrol();});
const Chase=window.CWChase;let chaseLive=!!state().pending?.chase,lastChaseNow=0,chaseTracking=false,lastChaseTarget='';
const deliveryRunner={id:'delivery-runner',name:'Blanket runner',key:'cutpurse',p:city.position().slice(),stoodDown:true};
actors.push(deliveryRunner);
function syncDeliveryRunner(record){
 companion.stoodDown=!!patrolDuty?.dimwellPartnerAway(record);
 const point=patrolDuty?.deliveryRunner(record)||patrolDuty?.dimwellRunner(record);
 deliveryRunner.stoodDown=!point;deliveryRunner.name=patrolDuty?.dimwellRunner(record)?'Dimwell runner':'Blanket runner';
 if(point)deliveryRunner.p=point;
}
const runner={id:'chase-suspect',name:'Fleeing accomplice',key:'cutpurse',p:city.position().slice(),stoodDown:true};actors.push(runner);
artStartupTrace('suspect setup');await Promise.all(['cutpurse','dockworker','townswoman'].map(key=>city.characterPainter.library.ensure(key)));artStartupTrace('suspects ready');
let lastChaseRoute=null;
function chaseRouteValid(id,c){
 if(!Chase.valid(c))return false;
 const {world}=city,routeKey=c.route.map(p=>p.join(',')).join(';');
 if(lastChaseRoute?.id===id&&lastChaseRoute.routeKey===routeKey&&lastChaseRoute.world===world&&lastChaseRoute.neighbours===world.neighbours&&lastChaseRoute.traverse===world.canTraverse&&lastChaseRoute.cells===world.members.size)return lastChaseRoute.valid;
 const valid=c.route.every((p,i)=>i===0?world.members.get(p.slice(0,2).join(','))?.has(p[2]):world.neighbours(c.route[i-1]).some(n=>n.join(',')===p.join(',')));
 lastChaseRoute={id,routeKey,world,neighbours:world.neighbours,traverse:world.canTraverse,cells:world.members.size,valid};
 return valid;
}
function startChase(id,battle){const st=saveNav(),pending=st.read().pending;if(!Chase.eligible(pending,battle))return false;const route=Chase.route(city.world,pending.position,pending.binding);if(!route)return false;if(!st.startChase(id,battle,route))return false;st.project();chaseLive=true;lastChaseNow=0;city.restore(pending.position);window.CWTeamAudio?.cue('whistle');city.tell(st.read().pending.chase.name+' bolts into the street. Follow them; get close to demand surrender or confront them again.');return true;}
function updateChase(now){
 if(!chaseLive||!Number.isFinite(now)||now-lastChaseNow<100)return;
 const dt=lastChaseNow&&now-lastChaseNow<500?now-lastChaseNow:0;
 lastChaseNow=now;
 if(document.hidden||window.CW_P20_INPUT_BLOCKED||document.querySelector('dialog[open],.cw-oath,#watch-notebook.open'))return;
 // One fresh store per tick. Keep saving active ticks as before, so reload
 // resumes the exact suspect position, search time and unfinished encounter.
 const st=window.CWP21State.create(localStorage),current=st.readChase();
 if(!current){runner.stoodDown=true;chaseLive=false;return;}
 const {id,chase:c}=current;
 if(!chaseRouteValid(id,c)){finishChase('lost');city.tell('The saved pursuit route is unavailable. The incident has been recorded without an arrest.');return;}
 const player=city.position();
 const ticking=!['caught','surrendered'].includes(c.status);
 if(ticking){
  st.chase(id,'tick',{player,dt:dt*(city.movementProfile?.timeScale||1),visible:Chase.visible(city.world,player,c.route[c.index])});
 }
 const next=ticking?st.readChase().chase:c;
 runner.p=next.route[next.index].slice();runner.name=next.name;
 runner.key=next.artKey||(next.suspectId==='patron'?'dockworker':'cutpurse');
 runner.stoodDown=!next.visible||Chase.terminal(next);
 if(next.status==='lost'){finishChase('lost');return;}
 if(chaseTracking&&!['caught','surrendered'].includes(next.status)){
  const at=next.visible?next.route[next.index]:next.lastSeen,k=at.join(',');
  if(k!==lastChaseTarget||(city.isNavigating?.()===false&&distance(player,at)>(next.catchRadius||1.8))){
   lastChaseTarget=k;
   if(!city.nav(at.slice(0,2),at[2],{pursuit:true,quiet:true}))chaseTracking=false;
  }
 }
 // Street movement already refreshes the HUD. A timer-only pursuit tick
 // needs to repaint the prompts only when the player-facing status changes.
 if(next.status!==c.status){
  if(next.status==='caught'){
   city.stop();city.update();
   city.tell('You have caught up. Approach the suspect to demand surrender or resume the confrontation.');
  }else if(next.status==='search'){
   city.tell('You lost sight of the suspect. Search near the last sighting before the trail goes cold.');
  }
  refresh();
 }
}
function cancelPursuitTracking(){chaseTracking=false;lastChaseTarget='';}
function finishChase(status){cancelPursuitTracking();const st=saveNav(),p=st.read().pending;if(!p?.chase)return false;if(!Chase.terminal(p.chase)&&!st.chase(p.id,status,{player:city.position()}))return false;const b=st.read().pending.battle;if(!st.resolve(p.id,b))return false;st.project();runner.stoodDown=true;chaseLive=false;if(status==='arrested')window.CWTeamAudio?.cue('arrest');syncPartner().catch(e=>city.tell(e.message));refresh();city.update();city.tell(status==='arrested'?'The pursued suspect is in custody. The original incident is recorded once.':status==='released'?'The pursued suspect was allowed to go. The original incident is recorded.':'The search ends; the pursued suspect remains at large. Your existing incident progress is retained.');return true;}
// Save the new fight and the current street position together. A paused or
// unloaded combat frame can then always reopen from the place you caught up.
function reopenPursuitBattle(id){
 const position=city.position();
 try{
  const st=window.CWP21State.create(localStorage);
  const navigation={position,visited:city.visits(),steps:city.steps(),foot:city.footPosition?.()};
  if(!st.chase(id,'resume',{player:position,location:encounterLocation(position),navigation})){
   city.tell('The pursuit has changed. Approach the suspect again.');return false;
  }
 }catch{city.tell('The confrontation could not be saved. Approach the suspect again to retry.');return false;}
 runner.stoodDown=true;chaseLive=false;
 battle({savedHandoff:true});return true;
}
function chaseMenu(){const v=state(),c=v.pending?.chase;if(!c)return;const near=distance(city.position(),c.route[c.index])<=(c.catchRadius||1.8);city.stop();const d=$('p21-duty-dialog'),box=$('p21-duty-actions');box.replaceChildren();const text=document.createElement('p');text.textContent=['caught','surrendered'].includes(c.status)&&!near?'Return to the suspect before speaking or making an arrest.':c.status==='surrendered'?c.name+' has surrendered. Make the arrest or let them go.':c.status==='caught'?c.name+(c.demandUsed?' refuses to surrender.':' is within speaking distance.'):c.status==='search'?'Search near the last sighting. The suspect is hidden until spotted again.':'Close the distance. You must reach the suspect before making an arrest.';box.append(text);
 const button=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=()=>{d.close();fn();};box.append(b);};
 if(near&&c.status==='caught'&&!c.demandUsed)button('Demand surrender',()=>{window.CWP21State.create(localStorage).chase(v.pending.id,'demand',{player:city.position()});refresh();chaseMenu();});
 if(near&&c.status==='surrendered')button('Arrest',()=>finishChase('arrested'));
 if(near&&['caught','surrendered'].includes(c.status))button('Resume confrontation',()=>reopenPursuitBattle(v.pending.id));
 if(near&&['caught','surrendered'].includes(c.status))button('Let them go',()=>finishChase('released'));
 button('Continue pursuit',()=>city.tell('Follow the last sighting. The circle moves your recruit; release it to stop.'));
 button('Call off the search',()=>finishChase('lost'));d.showModal();}
window.CWP21Game={canEnter:d=>!d?.held&&!!(d?.shop_key||d?.lodging_grade!==undefined||royalBankDoor(d)||postOfficeDoor(d)||palaceInteriors.canHandle(d)||guildInteriors?.canHandle(d)||d?.game_id==='university'||d?.legacy_binding?.legacy_interior_key),cityServices,enterUniversity:universityInteriors.enter,updatePartner,partnerMenu,cancelPursuitTracking,newspaperSellers,universityWizards,playerContacts,dibbler,contactClick:p=>{const a=actors.filter(a=>!a.stoodDown&&a.p&&!['dibbler','patrol-detainee','delivery-runner'].includes(a.id)&&!newspaperSellers.isSeller(a.id)&&Math.hypot(a.p[0]-p[0],a.p[1]-p[1])<=1).sort((a,b)=>distance(a.p,p)-distance(b.p,p))[0];if(!a)return false;if(a.id==='carrot'&&patrolDuty?.deliveryContact())return patrolDuty.deliveryMenu();if(distance(city.position(),a.p)<=3)playerContacts.talk(a.id);else walkTo('npc:'+a.id);return true;},purseContactClick,marketContactClick,dimwellRunnerClick:p=>patrolDuty?.dimwellRunnerClick(p),sellerClick:p=>dibbler.click(p)||newspaperSellers.click(p),refresh,palaceInteriors,room:d=>royalBankDoor(d)?enterRoyalBank(d):postOfficeDoor(d)?enterPostOffice(d):palaceInteriors.canHandle(d)?palaceInteriors.enter(d):guildInteriors?.canHandle(d)?guildInteriors.enter(d):service('room',d.game_id),actors,walkTo,battle,state,
 interact(){const pending=state().pending;if(pending?.chase){chaseMenu();return true;}if(pending){battle();return true;}const marketDuty=patrolDuty?.view();
 if(marketDuty?.delivery&&['inspect','report'].includes(marketDuty.action)){patrolDuty.primary();return true;}
 if(patrolDuty?.deliveryContact()){patrolDuty.deliveryMenu();return true;}
 if((marketDuty?.marketCase||marketDuty?.dimwell||marketDuty?.firstCase)&&marketDuty.action==='inspect'){patrolDuty.primary();return true;}if(patrolDuty?.handleDimwellFollowup())return true;const serviceDoor=city.nearDoor();if(serviceDoor?.shop_key||serviceDoor?.lodging_grade!==undefined){cityServices.open(serviceDoor.shop_key?{shopKey:serviceDoor.shop_key}:{grade:serviceDoor.lodging_grade});return true;}const assigned=assignmentContact();if(dutyDeskAction(state(),assigned)){patrolDuty.primary();return true;}if(assigned){service('talk',assigned.id);return true;}const b=encounterBinding();if(b&&b!=='taproom'){battle();return true;}const dutyView=patrolDuty?.view();if(!state().pending&&['inspect','report','book'].includes(dutyView?.action)){patrolDuty.primary();return true;}if(newspaperSellers.interact())return true;if(dibbler.interact())return true;if(royalBankDoor(city.nearDoor())){enterRoyalBank(city.nearDoor());return true;}if(postOfficeDoor(city.nearDoor())){enterPostOffice(city.nearDoor());return true;}if(palaceInteriors.canHandle(city.nearDoor())){palaceInteriors.enter(city.nearDoor());return true;}if(city.nearDoor()?.game_id==='university'){universityInteriors.enter();return true;}if(guildInteriors){const door=city.nearDoor();if(guildInteriors.canHandle(door)){guildInteriors.enter(door);return true;}}const n=npcNear();if(n){if(universityWizards.owns(n.id))return universityWizards.talk(n.id);if(conversations?.talk(n.id))return true;service('talk',n.id);return true;}return false;},
 report:()=>({dibbler:dibbler.report(),pointLookup:pointLookup.report(),cityServices:cityServices.report(),playerContacts:playerContacts.report(),universityWizards:universityWizards.report(),baseline:window.CW_LAB_RELEASE.buildId,canonicalMap:'seven-bridge-city',bridgeCount:city.allBridges.bridges.length,saveKey:window.CWP21State.KEY,revision:state().revision,pending:state().pending?.id||null,chase:state().pending?.chase?{status:state().pending.chase.status,lastSeen:state().pending.chase.lastSeen}:null,completedEncounters:state().encounters.length,partner:{id:patrolMember.id,name:patrolMember.name,key:companion.key,position:companion.p,updates:partnerDraws}})};
window.CWP21Game.followNewspaperLead=followNewspaperLead;
function patrolBlocked(){return loading||!!window.CWRecruitmentPending||!!window.CW_P20_INPUT_BLOCKED||document.querySelector('.cw-music-panel')?.hidden===false||!!document.querySelector('dialog[open],.cw-oath,#watch-notebook.open');}
patrolDuty=createPatrolDuty({city,nearest,career:window.CWP21State.career,daypart:()=>{const c=campaignClock(location.search,state().state);return c.phase==='Night'?'night':c.phase==='Dusk'?'evening':'day';},saveNavigation:saveNav,makeStore:()=>window.CWP21State.create(localStorage),blocked:patrolBlocked,intervene:()=>{if(encounterBinding()!=='shift-disturbance')return false;return battle();},onChange:()=>{city.refreshClock();refresh();city.update();}});
window.CWP21Game.patrolDuty=patrolDuty;
const firstPatrolBriefing=createFirstPatrolBriefing({city,patrolDuty,makeStore:()=>window.CWP21State.create(localStorage)});
window.CWP21Game.firstPatrolBriefing=firstPatrolBriefing;
window.addEventListener('cw-recruit-signed',()=>firstPatrolBriefing.start());
patrolLoop=createPatrolLoop({city,game:window.CWP21Game,duty:patrolDuty,nightDuty:true,primaryAction,snapshot:()=>{const record=state(),binding=encounterBinding(record),action=assignmentAction(record,binding);return{record,context:{primaryLabel:action.label,binding,deliveryAvailable:patrolDuty?.deliveryAvailable(record),blocked:patrolBlocked()}};}});
window.CW_WATCH_REGISTRATION=Object.freeze({open:recruitment.open});
window.CWRecruitGuide=createRecruitGuide({city,game:window.CWP21Game,freshRecruit:!state().state.flags.watchOathVersion&&state().state.chapter===0&&state().state.stage===0&&city.steps()===0});
refresh();city.update();if(chaseLive)city.tell('Pursuit resumed. Your partner, injuries and equipment are unchanged. Follow the last sighting.');
patrolDuty.resumeRoute(!assignmentContact()&&!city.nearDoor()?.shop_key&&city.nearDoor()?.lodging_grade===undefined&&(!encounterBinding()||encounterBinding()==='taproom'));
artStartupTrace('recruitment start');await recruitment.start();artStartupTrace('recruitment opened');
firstPatrolBriefing.start();
if(guildInteriors)await guildInteriors.resume();
artStartupTrace('interior resume');await palaceInteriors.resume();artStartupTrace('interiors ready');
universityInteriors.resume();
if(window.CWP21State.create(localStorage).read().state.flags.postOfficeInteriorsV1?.active)await openPostOffice().then(host=>host.resume()).catch(e=>city.tell(e.message));

// Optional patrol chatter loads after the core game; delivery failures leave existing conversations usable.
createPatrolConversations({city,actors,state,member:()=>patrolMember,contacts:playerContacts,
 urgent:record=>!!record.pending||!!assignmentContact(record)||['inspect','book','report'].includes(patrolDuty?.view(record)?.action)||!!encounterBinding(record)
}).then(runtime=>{conversations=runtime;window.CWPatrolConversations=runtime;}).catch(error=>console.warn('Patrol conversation bank unavailable',error));

if(window.CWP21State.create(localStorage).read().state.flags.royalBankVisitV1?.active)await openRoyalBank().then(host=>host.resume()).catch(e=>city.tell(e.message));
// Lets the City cases street button open the bridge enquiry at a stop.
window.CWP21Game.openBridgeCase=openBridgeCase;
