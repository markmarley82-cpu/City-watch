import './cw-opening-suspect.js?v=p21-b499-purse-appearances';
import {enquiryForStop,loadEnquiryCases,newEnquiry,enquiryView,collectEnquiry,prepareEnquiry,validEnquiry,FIRST_CASE_ROUTE,FIRST_CASE_FIGHT,openingPurseCase} from './cw-patrol-enquiries.mjs?v=purse-street-leads';
import {campaignClock,shiftClock} from './city-clock.mjs?v=game-time';
import {streetPath} from './city-movement.mjs?v=p21-b407-s039-reuse';
import {patrolReportMessage} from './cw-patrol-handoff.mjs?v=p21-b407-s039-reuse';
const FLAG='p21PatrolRounds';
const DELIVERY='missing-night-delivery';
const DELIVERY_TITLE='The Missing Night Delivery';
const DELIVERY_BRIEF='A cart of winter blankets never reached the docks. Speak to the carter, check the dispatch ledger and find out who offered the blankets for sale. Bring Captain Carrot what you can prove.';
const DELIVERY_LEADS=[
 {id:'carter',door:'drum',location:'Outside the Mended Drum',label:'Question the carter',evidence:'The carter says the night factor sent him to Netmender’s Shack instead of the docks. He never saw who received the load.'},
 {id:'ledger',door:'warehouse',location:'Outside the Dock Warehouse',label:'Read the dispatch ledger',evidence:'The dock clerk’s dispatch copy shows no delivery. The replacement docket carries the night factor’s signature and the bale mark W17.'},
 {id:'tip',door:'guild-bakers',location:'Outside Crust Hall (Bakers’ Guild)',label:'Ask about the blankets',evidence:'A baker saw the night factor offer W17 blankets for cash and watched a runner take the bales to Netmender’s Shack.'}
];
const DELIVERY_OUTCOMES={
 cargo:'Recovered the W17 blankets from the receiving yard. The runner left when challenged. The report records the diversion and recovery, with responsibility for ordering it unresolved.',
 proved:'Recovered the W17 blankets. Confronted with the carter’s account, signed docket and buyer’s testimony, the night factor acknowledged redirecting the delivery and signed the release. The evidence was referred for a formal charge.',
 'tail-cargo':'Recovered the W17 blankets after watching the runner deliver them at the Dock Warehouse. The exchange was witnessed, and responsibility for the original diversion remains unresolved.',
 'tail-proved':'Followed the runner to the Dock Warehouse, witnessed the night factor sign for the W17 bales, and recovered the blankets. The signed dispatch record and witnessed exchange were referred for a formal charge.',
 spooked:'The runner spotted the patrol and vanished with the bales. Carrot filed the leads gathered and kept the delivery open for follow-up.',
 unresolved:'Filed the leads gathered so far. No recovery was recorded, and responsibility for the diversion remains unresolved.'
};
const DIMWELL_BEAT='dimwell-beat';
const DIMWELL_INCIDENTS=[
 {call:'Your partner hears someone calling for help near the cobbler’s frontage.',
  account:'A cobbler says a customer paid for a repair but a runner collected the boots. The runner never gave a name.',
  action:'Take the cobbler’s statement', report:'The cobbler gave a statement about boots collected by an unknown runner. The complaint remains open.',
  nobbyAction:'Ask Nobby to inspect the collection chit',
  nobbyReport:'Nobby spotted a Guild licence number on the collection chit that is also being used by a trader in the eastern yard. A follow-up licence check is ready.'},
 {call:'Your partner notices a handcart blocking the Dimwell road.',
  account:'A carter says the wheel jammed and asks you to help clear the road. Other carts are starting to queue.',
  action:'Help clear the road', report:'The patrol helped the carter clear the road and traffic moved again.'}
];
const TWO_CALLS='A shopkeeper calls for help at the road bend. Your partner spots a runner leaving with a bundle of stolen stock.';
const CALL_REPORTS={
 stayed:'The patrol stayed with the shaken shopkeeper and took a statement. The runner escaped with the stock.',
 caught:'You followed the runner and recovered the shopkeeper’s stock. The shopkeeper had left before you could take a statement.',
 split:'You stayed with the shopkeeper and took a statement. Nobby recovered the stock on Park Lane. The runner got away.',
 broke:'The patrol broke off the pursuit. No stock was recovered and no statement was taken.'
};
const DISTURBANCE='opera-disturbance', LICENCE_CHECK='yard-licence', MARKET_ENQUIRY='market-escort';
const isChoiceRoute=id=>id===DISTURBANCE||id===LICENCE_CHECK||id===MARKET_ENQUIRY;
const LICENCES=[
 {status:'forged',clue:'The presented licence does not match the Guild register.'},
 {status:'valid',clue:'The presented licence can be verified against the Guild register. Its exact coverage of this incident remains disputed.'},
 {status:'missing',clue:'The suspect cannot produce a Guild licence.'},
 {status:'duplicate',clue:'The register assigns the number to the first trader. The second permit uses newer ink and a copied seal.'}
];
const MARKET_RESPONSES={
 'CW-RP-039-A':['Help them settle voluntarily','The Watch mediated a voluntary settlement and the parties parted freely.'],
 'CW-RP-039-B':['Clarify the route and record the dispute','The Watch clarified the route and recorded the remaining payment dispute. The parties parted freely.'],
 'CW-RP-039-C':['Separate them and escort the visitor','The Watch separated the parties and escorted the visitor to safety. The threats were referred to Colon.']
};
const MARKET_VOICES={
 'CW-RP-039-A':['“I was never told there was a fee. Here’s the route token. There’s no price on it.”','“We set out without discussing a fee. I assumed it was understood.”'],
 'CW-RP-039-B':['“I agreed the price. I thought the tour ended elsewhere. Here’s the route sketch I was given.”','“We agreed the fee at the start. This square is where the route sketch ends.”'],
 'CW-RP-039-C':['“A bystander heard it too. The guide threatened me and blocked the way until I paid.”','“No, we hadn’t agreed a fee when we set off. I demanded one when we got here.”']
};
const clone=x=>JSON.parse(JSON.stringify(x));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function createPatrolDuty({city,nearest,makeStore,saveNavigation=()=>{},getEnquiryCases=loadEnquiryCases,daypart=()=> 'day',career=null,random=Math.random,blocked=()=>false,intervene=null,onChange=()=>{},doc=document,now=()=>Date.now(),findPath=(a,b)=>streetPath(city.world,a,b.slice(0,2),b[2])}){
 const point=p=>Array.isArray(p)&&p.length===3&&p.slice(0,2).every(Number.isFinite)&&city.world.members.get(p.slice(0,2).map(Math.round).join(','))?.has(p[2]);
 const yard=p=>city.world.members.get(p.join(','))?.has('RC1')?[...p,'RC1']:nearest(p);
 const door=id=>{const d=city.world.doors.get(id);if(!d)return null;const p=nearest(d.position);if(d.held&&!['STREET','YARD','PRECINCT'].includes(city.world.edges.get(p[2])?.kind))return null;return p;};
 const home=yard([121,134]);
 const approach=[84,68,'E042'];
 const dimwellRoute={id:DIMWELL_BEAT,name:'Dimwell beat',checkpoints:[
  ['Park Lane approach to Dimwell',approach],
  ['Dimwell cobbler frontage',[73,66,'APRON:crypt']],
  ['Wharfinger road bend',[67,77,'E043']],
  ['Park Lane approach to Dimwell',approach]
 ]};
 const callStop=dimwellRoute.checkpoints[2][1];
 const callPath=point(callStop)&&point(approach)?findPath(callStop,approach):null;
 const callStops=callPath?.length>=14?[callPath[5],callPath[12]]:[];
 const callsRunner=a=>a?.dimwellCalls?.status==='chasing'?callStops[a.dimwellCalls.leg]:null;
 const routes=[
  dimwellRoute,
  {id:DISTURBANCE,name:'Disturbance by the Opera',checkpoints:[['Opera approach',yard([130,144])]]},
  {id:LICENCE_CHECK,name:'Thieves’ Guild licence check',checkpoints:[['Eastern yard',yard([135,140])]]},
  {id:FIRST_CASE_ROUTE,name:'The stolen purse',checkpoints:[['Trader’s stall',yard([120,140])]]},
  {id:MARKET_ENQUIRY,name:'Market escort complaint',checkpoints:[['Market Hall',door('market')]]},
  {id:'watch-square',name:'Watch Square round',description:'Check three corners of the yard, then report to Sergeant Colon.',checkpoints:[['Western yard',yard([120,140])],['Eastern yard',yard([135,140])],['Southern approach',yard([130,144])]]},
  {id:'watch-precinct',name:'Watch House and Opera round',description:'Check the yard and Opera approach, then return to the Watch House.',checkpoints:[['Western yard',yard([120,140])],['Opera approach',yard([130,144])]]},
  {id:'market-drum',name:'Market and Mended Drum round',description:'Check the market approaches and Mended Drum. Nearby disturbances use the existing encounter system.',checkpoints:[['Market approaches',door('market')],['Mended Drum',door('drum')]]}
 ];
 // Keep the contacts on reachable public ground along the Market approach.
 const marketOrigin=routes.find(r=>r.id===MARKET_ENQUIRY).checkpoints[0][1];
 function marketLocations(){
  if(!point(marketOrigin))return null;
  const queue=[[marketOrigin,0]],seen=new Set([marketOrigin.join(',')]);
  let guide=null,safe=null;
  for(let i=0;i<queue.length;i++){
   const [p,depth]=queue[i],away=distance(p,marketOrigin);
   if(!guide&&away>=4&&depth<=7&&findPath(marketOrigin,p)?.length)guide=p;
   if(guide&&away>=6&&distance(guide,p)>=4&&findPath(marketOrigin,p)?.length){safe=p;break;}
   if(depth>=11)continue;
   for(const next of city.world.neighbours(p)){
    const key=next.join(',');
    if(!seen.has(key)&&point(next)){seen.add(key);queue.push([next,depth+1]);}
   }
  }
  return guide&&safe?{visitor:marketOrigin,guide,safe}:null;
 }
 const market=marketLocations();
 const atPoint=(target,radius=1.6)=>point(city.position())&&distance(city.footPosition?.()||city.position(),target)<=radius;
 const openingPositions={stall:yard([120,140]),witness:yard([125,140]),suspect:yard([130,140])};
 const openingLabels={stall:'Talk to trader / inspect stall',witness:'Question the witness',suspect:'Question the suspect'};
 const openingRole=()=>Object.keys(openingPositions).find(role=>atPoint(openingPositions[role]));
 const carrot=yard([134,135]);
 const deliveryLeads=DELIVERY_LEADS.map(lead=>({...lead,position:door(lead.door)}));
 const deliveryYard=door('net');
 const tailDestination=deliveryLeads.find(lead=>lead.id==='ledger').position;
 const tailPath=point(deliveryYard)&&point(tailDestination)?findPath(deliveryYard,tailDestination):null;
 const tailStops=tailPath?.length>=12?[tailPath[3],tailPath[7],tailPath.at(-1)]:[];
 const tailActor=a=>!a?.outcome&&a?.tail?.status==='following'?tailStops[a.tail.index]:null;
 const tailDistance=p=>distance(city.footPosition?.()||city.position(),p);
 const canWatch=p=>point(city.position())&&tailDistance(p)>=2.4&&tailDistance(p)<=6;
 const deliveryPoints=[carrot,...deliveryLeads.map(lead=>lead.position),deliveryYard];
 const deliveryMapped=deliveryPoints.every(point);
 const deliveryAvailable=record=>deliveryMapped&&career?.(record.state)?.index>=1&&!data(record).deliveryReport;
 const deliveryActive=record=>data(record).active?.routeId===DELIVERY?data(record).active:null;
 const atCarrot=()=>atPoint(carrot,2);
 function deliveryView(a){
  const runner=tailActor(a);
  if(runner){
   const gap=tailDistance(runner),watch=canWatch(runner);
   return {title:DELIVERY_TITLE,done:a.evidence.length,total:5,delivery:true,action:watch?'inspect':'menu',
    objective:gap<2.4?'You’re too close. The runner may spot you.':watch?'Keep your distance and watch where the runner goes.':'Follow the runner until you’re close enough to watch.',
    label:watch?(a.tail.index===tailStops.length-1?'Watch the exchange':'Keep watching'):'Review stakeout'};
  }
  const lead=deliveryLeads.find(l=>!a.evidence.includes(l.id)&&atPoint(l.position));
  if(!a.outcome&&a.tail?.status==='seen'&&!lead){
   const atWarehouse=atPoint(tailDestination);
   return {title:DELIVERY_TITLE,done:a.evidence.length,total:5,delivery:true,
    action:atWarehouse?'inspect':'menu',
    objective:atWarehouse?'You witnessed the handover. Recover the W17 blankets or prepare your report.':'The runner delivered the W17 blankets at the Dock Warehouse. Approach the warehouse to follow up.',
    label:atWarehouse?'Decide how to recover the blankets':'Review warehouse handover'};
  }
  const inYard=atPoint(deliveryYard),returning=!!a.outcome;
  const action=returning&&atCarrot()?'report':!returning&&(lead||inYard&&!a.tail?.status)?'inspect':'menu';
  const objective=returning?'Bring your findings to Captain Carrot at Watch Square.':
   lead?lead.location+' · '+lead.label+'.':inYard?'Decide what to do about the W17 bales.':
   a.evidence.length?'Follow another lead, check the receiving yard, or prepare a report.':'Choose a lead in The Missing Night Delivery.';
  return {title:DELIVERY_TITLE,done:returning?4:a.evidence.length,total:5,objective,delivery:true,action,
   label:action==='report'?'File with Carrot':lead?.label||(inYard&&!returning?(a.tail?.status==='seen'?'Review the warehouse handover':'Inspect the receiving yard'):'Review delivery case')};
 }
 function startDelivery(){
  if(!deliveryMapped||!atCarrot())return false;
  const ok=save((d,r)=>{
   if(d.active||!deliveryAvailable(r))return false;
   if(deliveryPoints.some(p=>findPath(carrot,p)===null||findPath(p,carrot)===null)){
    city.tell('A lead is cut off on the current map. Speak to Carrot again when the route opens.');return false;
   }
   d.active={routeId:DELIVERY,name:DELIVERY_TITLE,startedAt:now(),evidence:[],observations:[],outcome:null};
  });
  if(ok)city.tell('Carrot: Follow whichever lead you think will get us somewhere. I’ll be in Watch Square.');
  return ok;
 }
 function updateDelivery(id){
  city.stop();
  let message;
  const ok=save(d=>{
   const a=d.active;
   if(a?.routeId!==DELIVERY||a.outcome)return false;
   if(id==='tail'){
    if(a.tail||!tailStops.length||!atPoint(deliveryYard)||!a.evidence.some(id=>id==='carter'||id==='tip'))return false;
    a.tail={status:'following',index:0};message='The runner has left the yard. Stay two to six paces back and keep watching.';return;
   }
   const runner=tailActor(a);
   if(runner){
    if(id==='spooked'&&tailDistance(runner)<2.4){
     a.tail.status='spooked';a.outcome=id;
    }else if(id==='watch'&&canWatch(runner)){
     if(a.tail.index<tailStops.length-1){a.tail.index++;message='The runner moves on. Keep your distance.';return;}
     a.tail.status='seen';
     message='You saw the night factor sign for the W17 bales at the Dock Warehouse.';
     a.observations.push({location:'Dock Warehouse handover',text:message,witness:false});return;
    }else if(id==='unresolved'){a.outcome=id;}
    else return false;
    a.outcomeText=DELIVERY_OUTCOMES[a.outcome];message=a.outcomeText+' Return to Carrot.';return;
   }
   const lead=deliveryLeads.find(l=>l.id===id);
   if(lead){
    if(!atPoint(lead.position)||a.evidence.includes(id))return false;
    a.evidence.push(id);a.observations.push({location:lead.location,text:lead.evidence,witness:id!=='ledger'});message=lead.evidence;return;
   }
   if(id==='unresolved'&&a.evidence.length)a.outcome=id;
   else if(id==='tail-cargo'&&a.tail?.status==='seen'&&atPoint(tailDestination))a.outcome=id;
   else if(id==='tail-proved'&&a.tail?.status==='seen'&&a.evidence.includes('ledger')&&atPoint(tailDestination))a.outcome=id;
   else if(id==='cargo'&&!a.tail&&atPoint(deliveryYard)&&(a.evidence.includes('carter')||a.evidence.includes('tip')))a.outcome=id;
   else if(id==='proved'&&!a.tail&&atPoint(deliveryYard)&&a.evidence.length===deliveryLeads.length)a.outcome=id;
   else return false;
   a.outcomeText=DELIVERY_OUTCOMES[id];
   message=a.outcomeText+' Return to Carrot.';
  });
  if(ok)city.tell(message);
  return ok;
 }
 function fileDelivery(){
  if(!atCarrot())return false;
  let filed;
  const ok=save((d,r)=>{
   const a=d.active;
   if(a?.routeId!==DELIVERY||!Object.hasOwn(DELIVERY_OUTCOMES,a.outcome)||d.deliveryReport)return false;
   const merit=['proved','tail-proved'].includes(a.outcome)?6:a.outcome==='tail-cargo'?4:a.outcome==='cargo'?3:1;
   filed={outcome:a.outcome,evidence:a.evidence.slice(),text:DELIVERY_OUTCOMES[a.outcome],observations:a.observations,merit,reportedAt:now()};
   d.deliveryReport=filed;d.completed++;d.active=null;r.state.merit+=merit;
  });
  if(ok)city.tell('Carrot: '+filed.text+' Report filed. +'+filed.merit+' merit.');
  return ok;
 }
 function deliveryMenu(){
  if(blocked())return false;
  const r=makeStore().read(),d=data(r),a=deliveryActive(r);
  if(r.pending||!a&&!deliveryAvailable(r)&&!d.deliveryReport)return false;
  city.stop();
  const dialog=doc.getElementById('p21-duty-dialog'),box=doc.getElementById('p21-duty-actions');
  const content=doc.createElement('section');content.className='cw-patrol-route-menu';box.replaceChildren();box.append(content);
  const text=(tag,copy)=>{const e=doc.createElement(tag);e.textContent=copy;content.append(e);return e;};
  const button=(label,fn)=>{const b=text('button',label);b.type='button';b.onclick=()=>{dialog.close();return fn();};};
  // Walking shortcut to a lead the player chose (the leads were only listed, with no way to get there).
  const walk=(label,target)=>{if(target)button('Walk to '+label,()=>{city.stop();const ok=city.nav(target.slice(0,2),target[2]);if(ok!==false)city.tell('Walking to '+label+'. Open Carrot’s assignment there to continue.');return ok;});};
  text('h3',DELIVERY_TITLE);
  if(d.deliveryReport){
   text('p',d.deliveryReport.text);
   for(const lead of deliveryLeads.filter(l=>d.deliveryReport.evidence.includes(l.id)))text('p',lead.evidence);
  }else if(!a){
   text('p',atCarrot()?DELIVERY_BRIEF:'Captain Carrot is waiting on the east side of Watch Square, outside the Watch House.');
   if(!atCarrot())walk('Captain Carrot',carrot);
   if(atCarrot()&&!d.active)button('Accept Carrot’s assignment',startDelivery);
   if(d.active)text('p','Finish your current patrol before accepting this case.');
  }else if(a.outcome){
   text('p',DELIVERY_OUTCOMES[a.outcome]);
   if(atCarrot())button('File with Carrot',fileDelivery);
   else{text('p','Captain Carrot is on the east side of Watch Square.');walk('Captain Carrot',carrot);}
  }else if(tailActor(a)){
   text('p','Follow on foot. Stay about three to six paces behind the runner, then choose Keep watching. Getting too close will spook them.');
   if(canWatch(tailActor(a)))button(a.tail.index===tailStops.length-1?'Watch the exchange':'Keep watching',()=>updateDelivery('watch'));
   button('Break off and prepare a report',()=>updateDelivery('unresolved'));
  }else{
   for(const lead of deliveryLeads){
    text('p',lead.location+' · '+(a.evidence.includes(lead.id)?lead.evidence:lead.label));
    if(!a.evidence.includes(lead.id)&&atPoint(lead.position))button(lead.label,()=>updateDelivery(lead.id));
    else if(!a.evidence.includes(lead.id))walk(lead.location,lead.position);
   }
   if(a.tail?.status==='seen'){
    text('p','You witnessed the W17 handover at the Dock Warehouse.');
    if(atPoint(tailDestination)){
     button('Recover the blankets at the warehouse',()=>updateDelivery('tail-cargo'));
     if(a.evidence.includes('ledger'))button('Confront the night factor with the signed dispatch',()=>updateDelivery('tail-proved'));
     else text('p','Check the dispatch ledger here to establish who ordered the diversion.');
    }
   }else if(a.evidence.includes('carter')||a.evidence.includes('tip')){
    text('p','Netmender’s Shack · Receiving yard');
    if(!atPoint(deliveryYard))walk('Netmender’s Shack',deliveryYard);
    if(atPoint(deliveryYard)){
     text('p','The bales are marked W17. A runner is loading them while the night factor checks a list.');
     if(tailStops.length)button('Shadow the runner',()=>updateDelivery('tail'));
     button('Stop the loading and recover the blankets',()=>updateDelivery('cargo'));
     if(a.evidence.length===deliveryLeads.length)button('Put the evidence to the night factor',()=>updateDelivery('proved'));
     else text('p','You can recover the cargo now or collect more evidence about who ordered the diversion.');
    }
   }
   if(a.evidence.length)button('Prepare an unresolved report',()=>updateDelivery('unresolved'));
  }
  button('Return to street',()=>{});dialog.showModal();return true;
 }
 let tailSpookQueued=false;
 function observeDeliveryTail(record){
  const runner=tailActor(deliveryActive(record));
  if(!runner||tailSpookQueued||record.pending||blocked()||tailDistance(runner)>=2.4)return;
  tailSpookQueued=true;queueMicrotask(()=>{tailSpookQueued=false;updateDelivery('spooked');});
 }
 function deliveryRunner(record){return tailActor(deliveryActive(record));}
 function deliveryContact(record=makeStore().read()){
  return !record.pending&&atCarrot()&&(deliveryActive(record)?.outcome||!data(record).active&&deliveryAvailable(record));
 }
 const atDesk=()=>point(city.position())&&distance(city.footPosition?.()||city.position(),home)<=1.6&&city.nearColon();
 const partnerId=record=>record.state.flags.patrolMentorAssignment?.mentorId||'WATCH-04';
 const escort=a=>a?.licence?.outcome==='escort';
 const assignedRoute=d=>{
  const completed=Number(d.paidShifts)||0;
  const id=completed===0?'watch-precinct':completed%2?'watch-square':'market-drum';
  return routes.find(route=>route.id===id);
 };
 const postedRoutes=d=>Number(d.paidShifts)>0?[DISTURBANCE,LICENCE_CHECK,MARKET_ENQUIRY]:[DISTURBANCE,LICENCE_CHECK];
 const licenceStop=a=>a.shift&&LICENCES[a.licenceVariant]&&a.index===a.checkpoints.length-1;
 function openingIncident(record,round){
  return record.encounters.slice(round.encounterStart).find(e=>e.binding===FIRST_CASE_FIGHT);
 }
 function openingIncidentReport(incident){
  if(!incident)return '';
  if(incident.subjectStatus==='arrested')return 'The suspect was taken into Watch custody.';
  if(incident.subjectStatus==='released')return 'The Watch released the suspect after the confrontation.';
  if(incident.subjectStatus==='incapacitated')return 'The suspect was subdued. No arrest was recorded for them.';
  if(incident.subjectStatus==='escaped')return 'The suspect escaped during the confrontation.';
  if(incident.result?.outcome==='withdrawn')return 'The patrol withdrew without taking the suspect into custody.';
  if(incident.result?.outcome==='defeat')return 'The patrol was overpowered. The suspect was not taken into custody.';
  return 'The confrontation is recorded in the incident log.';
 }
 const data=r=>{const d=r.state.flags[FLAG];return d?.schema===1&&Number.isSafeInteger(d.serial)&&d.serial>=0&&Number.isSafeInteger(d.completed)&&d.completed>=0&&Array.isArray(d.reports)?d:{schema:1,serial:0,completed:0,active:null,reports:[],creditedRoutes:[]};};
 function valid(a){const template=a&&routes.find(r=>r.id===a.routeId);return a&&template&&template.checkpoints.every(c=>point(c[1]))&&Array.isArray(a.checkpoints)&&a.checkpoints.length>=(a.routeId===FIRST_CASE_ROUTE||isChoiceRoute(a.routeId)?1:2)&&a.checkpoints.length<=4&&a.checkpoints.every(c=>typeof c.name==='string'&&Array.isArray(c.position)&&c.position.length===3&&point(c.position))&&Number.isSafeInteger(a.index)&&a.index>=0&&a.index<=a.checkpoints.length&&Array.isArray(a.visits)&&a.visits.length===a.index&&(!a.enquiry||validEnquiry(a.enquiry));}
 function save(change){
  if(blocked())return false;
  let store=makeStore(),record=store.read();if(record.pending){city.tell('Finish the current incident before changing your patrol round.');return false;}try{saveNavigation();store=makeStore();record=store.read();}catch{city.tell('Your patrol position could not be saved. Keep this tab open and retry.');return false;}if(record.pending)return false;
  const d=clone(data(record));if(change(d,record)===false)return false;
  const next=clone(record);next.state.flags[FLAG]=d;
  try{if(!store.replaceRecord(next,record.revision)){city.tell('Your patrol changed. Please try that action again.');return false;}try{store.project();}catch{onChange();city.tell('The round is saved, but its service copy could not update. Retry Save patrol before opening an interior.');return false;}}catch{city.tell('The round could not be saved. Keep this tab open and try again.');return false;}
  onChange();return true;
 }
 function view(record=makeStore().read()){
  const a=data(record).active;if(!a||record.pending)return null;
  if(a.routeId===DELIVERY)return deliveryView(a);
  if(!valid(a))return {title:'Patrol route unavailable',label:'Review patrol round',action:'menu',done:0,total:1,objective:'The saved route needs review.'};
  const returning=a.index===a.checkpoints.length,target=returning?home:a.checkpoints[a.index].position,near=distance(city.footPosition?.()||city.position(),target)<=1.6&&point(city.position()),custody=escort(a);
  const incident=licenceStop(a)?'Reported purse theft':a.enquiry?enquiryView(a.enquiry).title:a.checkpoints[a.index]?.name;
  const objective=returning?(custody?'Escort the suspect to Colon outside the Watch House':'Report to Sergeant Colon'):incident;
  if(a.routeId===DIMWELL_BEAT){
   const calls=a.dimwellCalls,runner=callsRunner(a);
   if(calls?.status==='waiting'&&a.index===2&&near)return {title:a.name,done:a.index,total:5,
    objective:TWO_CALLS,label:'Respond to both calls',action:'inspect',target,dimwell:true,twoCalls:true};
   if(runner){
    const reached=atPoint(runner,1.8);
    return {title:a.name,done:a.index,total:5,target:runner,dimwell:true,twoCalls:true,
     objective:calls.leg?'Catch up to the runner before they reach Park Lane.':'The runner took the lane towards Park Lane. Follow on foot.',
     label:reached?(calls.leg?'Demand the stock back':'Pick up the trail'):'Review pursuit',action:reached?'inspect':'menu'};
   }
   if(calls?.status==='delegated')return {title:a.name,done:a.index,total:5,target,dimwell:true,twoCalls:true,
    objective:'Statement taken. Meet Nobby at the Park Lane approach.',label:'Review beat',action:'menu'};
   const activeIncident=a.dimwellIncident?.noticed&&!a.dimwellIncident.outcome;
   const stop=a.checkpoints[a.index]?.name;
   const objective=returning?'Return to Watch Square and file with Colon.':activeIncident&&near?DIMWELL_INCIDENTS[a.dimwellIncident.variant].call:'Walk your beat to '+stop+'.';
   const action=returning&&atDesk()?'report':activeIncident&&near?'inspect':'menu';
   return {title:a.name,done:a.index,total:a.checkpoints.length+1,objective,
    label:action==='report'?'File shift report':action==='inspect'?'Hear what happened':'Review beat',action,target,dimwell:true};
  }
  if(a.routeId===FIRST_CASE_ROUTE){
   const role=openingRole(),clues=a.enquiry?.clueIds||[];
   const openingReminder=returning?'Your report is ready. Find Sergeant Colon outside the Watch House in Watch Square.':
    !clues.length?'The trader is in the western yard. The woman packing up farther along that side of the square had a view of the counter.':
    !clues.includes('trace')?'The witness saw the theft. Look for a trace on the purse hook at the trader’s stall.':
    !clues.includes('witness')?'You found a thread on the hook. Ask the woman packing up farther along the same side of the square what she saw.':
    !a.enquiry.interview?'The witness saw the suspect stop at the far end of this side of the square. Ask about the torn clothing.':
    'Take your findings to Sergeant Colon outside the Watch House in Watch Square.';
   const desk=atDesk(),label=desk?(returning?'File purse report':'Discuss case with Colon'):role&&!returning?openingLabels[role]:'Review purse leads';
   return {title:a.name,done:a.index,total:2,objective:returning||a.enquiry?.interview?'Report to Colon outside the Watch House':'Investigate the stolen purse in Watch Square',
    label,action:desk?'report':role&&!returning?'inspect':'leads',target:desk||returning?home:target,firstCase:true,openingReminder};
  }
  if(a.routeId===MARKET_ENQUIRY&&market){
   const base={title:a.name,done:a.index,total:2,incidentChoice:true,marketCase:true};
   if(returning)return {...base,objective:'Bring your findings to Sergeant Colon.',label:atDesk()?'File shift report':'Walk to Colon',action:atDesk()?'report':'go',target:home};
   const evidence=a.enquiry?.clueIds||[],variant=a.enquiry?.snapshot.variants.find(v=>v.id===a.enquiry.variantId);
   if(a.marketEscort){
    const arrived=atPoint(market.safe);
    return {...base,objective:'Escort the visitor to a safe spot on the Market approach.',label:arrived?'Confirm the visitor is safe':'Walk to the safe spot',action:arrived?'inspect':'go',target:market.safe};
   }
   const nearestContact=['visitor','guide'].find(role=>atPoint(market[role],1.8)&&!evidence.includes(variant?.clues[role==='visitor'?0:1].id));
   const missing=['visitor','guide'].find(role=>!evidence.includes(variant?.clues[role==='visitor'?0:1].id));
   const role=nearestContact||missing;
   if(role)return {...base,objective:evidence.length?'Hear the other account at Market Hall.':'Speak to the visitor and the guide at Market Hall.',
    label:(nearestContact?'Talk to the ':'Walk to the ')+role,action:nearestContact?'inspect':'go',target:market[role],marketRole:role,
    canReportUnresolved:evidence.length>0};
   const atContact=[market.visitor,market.guide].some(p=>atPoint(p,2));
   return {...base,objective:'Decide how to resolve the Market Hall complaint.',label:atContact?'Resolve complaint':'Walk back to the guide',action:atContact?'inspect':'go',target:market.guide};
  }
  if(isChoiceRoute(a.routeId)){
   const handled=a.routeId===DISTURBANCE&&record.encounters.slice(a.encounterStart).some(e=>e.binding==='shift-disturbance');
   const objective=returning?(custody?'Escort the suspect to Colon outside the Watch House.':'Report the incident to Sergeant Colon.'):
    a.routeId===LICENCE_CHECK?'Verify the Guild licence in the eastern yard.':handled?'Record how the disturbance ended.':'Check the disturbance by the Opera.';
   const label=returning?(atDesk()?(custody?'Hand over suspect':'File shift report'):(custody?'Walk to Colon with the suspect':'Walk to Colon')):
    near?(a.routeId===LICENCE_CHECK?'Check licence':handled?'Record encounter':'Respond to disturbance'):
    a.routeId===LICENCE_CHECK?'Walk to eastern yard':'Walk to the Opera';
   const action=returning?(atDesk()?(custody?'book':'report'):'go'):(near?'inspect':'go');
   return {title:a.name,done:a.index,total:2,objective,label,action,target,incidentChoice:true};
  }
  const label=returning?(atDesk()?(custody?'Handover suspect':a.shift?'File shift report':'Report round'):(custody?'Escort to Watch House':'Return to Colon')):(near?(licenceStop(a)?'Investigate robbery':a.enquiry?'Continue enquiry':'Check area'):'Walk to checkpoint');
  const action=returning?(atDesk()?(custody?'book':'report'):'go'):(near?'inspect':'go');
  return {title:a.shift?'Shift '+a.shift+' · '+a.name:a.name,done:a.index,total:a.checkpoints.length+1,objective,label,action,target};
 }
 function dimwellStop(record=makeStore().read(),v=view(record)){
  const a=data(record).active;
  if(!v?.dimwell)return null;
  const name=callsRunner(a)?'Dimwell runner':
   a.dimwellCalls?.status==='delegated'?'Meet Nobby at Park Lane':
   a.checkpoints[a.index]?.name||'Report to Sergeant Colon';
  return {position:v.target,name};
 }
 function mapStop(){
  const record=makeStore().read(),v=view(record);
  if(v?.firstCase){
   const round=data(record).active;
   if(v.done||round.enquiry?.interview)return {position:home,name:'Sergeant Colon',caseObjective:true};
   if(!round.enquiry?.clueIds.length)return {position:openingPositions.stall,name:'Trader’s stall',caseObjective:true};
   return null;
  }
  return dimwellStop(record,v);
 }
 function go(){const v=view();if(!v||v.dimwell||v.firstCase||!v.target||blocked())return false;city.stop();return city.nav(v.target.slice(0,2),v.target[2]);}
 // First purse case: walk to the next lead in the same order as the case reminder
 // (stall trace, then witness, then suspect), and to Colon once the case is ready to report.
 // Between shifts with Carrot's assignment waiting: walk to Carrot, or open his assignment when there.
 function goCarrot(){
  const r=makeStore().read();
  if(r.pending||blocked()||data(r).active||!deliveryAvailable(r))return false;
  if(atCarrot())return deliveryMenu();
  city.stop();return city.nav(carrot.slice(0,2),carrot[2]);
 }
 function goFirstLead(){
  const record=makeStore().read(),a=data(record).active,v=view(record);
  if(record.pending||!v?.firstCase||a?.routeId!==FIRST_CASE_ROUTE||blocked())return false;
  const clues=a.enquiry?.clueIds||[],ready=a.index===a.checkpoints.length||!!a.enquiry?.interview;
  const lead=ready?null:!clues.includes('trace')?openingPositions.stall:!clues.includes('witness')?openingPositions.witness:openingPositions.suspect;
  if(!lead)return false;
  city.stop();return city.nav(lead.slice(0,2),lead[2]);
 }
 function continueRoute(){if(view()?.action==='go')try{go();}catch{}}
 let routeResumeChecked=false;
 function resumeRoute(allowed=true){
  if(routeResumeChecked)return false;routeResumeChecked=true;
  if(!allowed||blocked())return false;
  const record=makeStore().read(),a=data(record).active;
  if(record.pending||['guildInteriorsV1','palaceInteriorsV1','universityVisitV1'].some(key=>record.state.flags[key]?.active)||!a?.shift||isChoiceRoute(a.routeId)||!valid(a)||view(record)?.action!=='go')return false;
  const last=a.visits.at(-1),position=city.position(),foot=city.footPosition?.()||position,target=view(record).target;
  if(!last||!point(last.position)||!point(position)||!point(target)||!Array.isArray(foot)||![2,3].includes(foot.length)||!foot.slice(0,2).every(Number.isFinite)||(foot.length===3&&foot[2]!==position[2]))return false;
  if(distance(foot,last.position)>1.6){
   let path;try{path=findPath(last.position,target);}catch{return false;}
   if(!Array.isArray(path)||!path.length||Array.from(path).some(p=>!point(p))||path.at(-1)[2]!==target[2]||distance(path.at(-1),target)!==0||distance(foot,target)>=distance(last.position,target)-.5||!path.some(p=>p[2]===position[2]&&distance(foot,p)<=1.6))return false;
  }
  try{return go();}catch{return false;}
 }
 function start(id,{paid=false,fromWatchHouse=false}={}){
  const route=routes.find(r=>r.id===id);if(!route||id===DIMWELL_BEAT&&!paid||id===MARKET_ENQUIRY&&!market||id===FIRST_CASE_ROUTE&&(!fromWatchHouse||paid)||isChoiceRoute(id)&&!paid)return false;
  const saved=save((d,record)=>{if(d.active){city.tell('Finish or end your current round first.');return false;}if(paid&&(!career||!(atDesk()||fromWatchHouse)||(isChoiceRoute(id)?!postedRoutes(d).includes(id):id!==DIMWELL_BEAT&&route!==assignedRoute(d))))return false;const points=[city.position(),...route.checkpoints.map(c=>c[1]),home];for(let i=1;i<points.length;i++)if(!point(points[i])||findPath(points[i-1],points[i])===null){city.tell('This round has no open route on the current map. Choose another round.');return false;}
   d.serial++;d.active={runId:route.id+':'+d.serial,routeId:route.id,name:route.name,index:0,checkpoints:route.checkpoints.map(([name,position])=>({name,position:position.slice()})),visits:[],startedAt:now(),encounterStart:record.encounters.length};
   if(paid){
    const state=record.state;
    d.signedShifts=(Number(d.signedShifts)||0)+1;
    d.active.shift=d.signedShifts;
    d.active.rankIndexAtSignOn=career(state).index;
    if(id===DIMWELL_BEAT){
     const previousBeats=Number(d.dimwellRuns)||0;
     const withCalls=callStops.length&&!d.dimwellCallsFiled;
     const variant=withCalls?0:previousBeats%DIMWELL_INCIDENTS.length;
     d.dimwellRuns=previousBeats+1;
     d.active.dimwellIncident={variant,stop:variant+1,noticed:false,outcome:null};
     if(withCalls)d.active.dimwellCalls={status:'waiting',leg:0};
    }
    if(route.id==='watch-precinct')d.active.licenceVariant=0;
    if(route.id===LICENCE_CHECK){
     d.active.nobbyLead=!!d.nobbyLicenceLead;
     d.active.licenceVariant=d.active.nobbyLead?LICENCES.length-1:Math.max(0,Math.min(LICENCES.length-2,Math.floor(random()*(LICENCES.length-1))));
     if(d.active.nobbyLead)d.nobbyLicenceLead=false;
    }
    if(route.id==='market-drum')d.active.licenceVariant=Math.floor((d.paidShifts||0)/2)%LICENCES.length;
    if(state.flags.watchShiftClock)state.night++;
    state.flags.watchShiftClock=shiftClock(state,true,now());
   }
  });
  if(saved){globalThis.window?.CWRecruitGuide?.pause?.();if(id===DIMWELL_BEAT){city.tell('Colon: Work the Dimwell beat with your partner. Follow Park Lane into Dimwell. Review beat has your stops.');return true;}if(id===FIRST_CASE_ROUTE){city.tell('Colon: Start in the western yard. The trader can tell you who was nearby.');return true;}if(isChoiceRoute(id)){city.tell('Signed on at 21:00. '+view()?.objective);return true;}city.tell(paid?'Signed on at 21:00. '+route.name+' assigned. Your partner is with you.':route.name+' begun. Reach each checkpoint and Check area. Report to Colon to finish.');go();}return saved;
 }
 let dimwellUpdateQueued=false;
 function observeDimwell(record){
  const a=data(record).active,check=a?.checkpoints?.[a.index],incident=a?.dimwellIncident;
  if(dimwellUpdateQueued||record.pending||a?.routeId!==DIMWELL_BEAT||!valid(a)||!check||
   !atPoint(check.position)||callsRunner(a)||a.dimwellCalls?.status==='waiting'&&a.index===2||incident?.stop===a.index&&incident.noticed&&!incident.outcome||blocked())return;
  dimwellUpdateQueued=true;
  queueMicrotask(()=>{
   dimwellUpdateQueued=false;
   let message;
   if(save(d=>{
    const beat=d.active;
    if(beat?.runId!==a.runId||beat.index!==a.index||!atPoint(check.position))return false;
    if(beat.dimwellCalls?.status==='delegated'){
     beat.dimwellCalls.status='split';message=CALL_REPORTS.split;
    }
    const event=beat.dimwellIncident;
    if(event?.stop===beat.index&&!event.outcome){
     if(event.noticed)return false;
     event.noticed=true;
     message=DIMWELL_INCIDENTS[event.variant].call;
    }else{
     beat.visits.push({name:check.name,position:city.position().slice(),checkedAt:now()});
     beat.index++;
     message||=beat.checkpoints[beat.index]?'Beat checked: '+check.name+'.':'Beat complete. Return to Sergeant Colon.';
    }
   }))city.tell(message);
  });
 }
 function dimwellCallsAction(choice){
  city.stop();
  let message;
  const ok=save((d,r)=>{
   const a=d.active,calls=a?.dimwellCalls;
   if(a?.routeId!==DIMWELL_BEAT||!calls)return false;
   if(calls.status==='waiting'){
    if(a.index!==2||!atPoint(callStop)||!['stay','chase','delegate'].includes(choice)||choice==='delegate'&&partnerId(r)!=='WATCH-04')return false;
    a.visits.push({name:a.checkpoints[a.index].name,position:city.position().slice(),checkedAt:now()});a.index++;
    calls.status={stay:'stayed',chase:'chasing',delegate:'delegated'}[choice];
    message=choice==='stay'?CALL_REPORTS.stayed:choice==='delegate'?'Nobby goes after the runner. You take the shopkeeper’s statement. Meet him at the Park Lane approach.':'The runner heads for Park Lane. Follow on foot.';
   }else if(calls.status==='chasing'){
    if(choice==='break'){calls.status='broke';message=CALL_REPORTS.broke;}
    else if(choice==='follow'&&atPoint(callsRunner(a),1.8)){
     if(calls.leg===0){calls.leg=1;message='The runner turns towards Park Lane. Keep going.';}
     else{calls.status='caught';message='The runner drops the bundle when challenged and bolts. You recover the stock.';}
    }else return false;
   }else return false;
  });
  if(ok)city.tell(message);
  return ok;
 }
 function openDimwellCalls(record=makeStore().read()){
  const a=data(record).active,calls=a?.dimwellCalls;
  if(a?.routeId!==DIMWELL_BEAT||blocked()||!calls)return false;
  const waiting=calls.status==='waiting'&&a.index===2&&atPoint(callStop);
  if(!waiting&&calls.status!=='chasing')return false;
  city.stop();
  const dialog=doc.getElementById('p21-duty-dialog'),box=doc.getElementById('p21-duty-actions');
  const content=doc.createElement('section');content.className='cw-patrol-route-menu';box.replaceChildren(content);
  const copy=doc.createElement('p');copy.textContent=waiting?TWO_CALLS:'The runner is heading towards Park Lane. Catch up on foot or break off the pursuit.';content.append(copy);
  const choices=waiting?[['Stay with the shopkeeper','stay'],['Go after the runner','chase']]:[['Break off the pursuit','break']];
  if(waiting&&partnerId(record)==='WATCH-04')choices.push(['Send Nobby after the runner','delegate']);
  choices.push(['Return to the street',null]);
  for(const [label,choice] of choices){
   const button=doc.createElement('button');button.type='button';button.textContent=label;content.append(button);
   button.onclick=()=>{dialog.close();return choice?dimwellCallsAction(choice):true;};
  }
  dialog.showModal();return true;
 }
 function dimwellRunner(record){return callsRunner(data(record).active);}
 function dimwellRunnerClick(p){
  const record=makeStore().read();
  if(record.pending||blocked())return false;
  const runner=dimwellRunner(record);
  return !!runner&&distance(p,runner)<=1&&atPoint(runner,1.8)&&dimwellCallsAction('follow');
 }
 function dimwellFollowup(record=makeStore().read()){
  if(record.pending)return null;
  const d=data(record),saved=d.dimwellFollowup;
  if(saved?.stage==='closed')return null;
  const report=d.dimwellCallsSource||d.reports.findLast(r=>r.routeId===DIMWELL_BEAT&&Object.hasOwn(CALL_REPORTS,r.dimwellCalls));
  if(!saved&&(!report||!d.active?.shift||d.active.shift<=report.shift))return null;
  if(saved?.stage==='search')return atPoint(approach)?{stage:'search',label:'Inspect the discarded wrapping'}:null;
  if(!atPoint(callStop))return null;
  const stage=saved?.stage||(['caught','split'].includes(report.dimwellCalls)?'returned':'missing');
  return {stage,label:stage==='confirm'?'Show the wrapping to the shopkeeper':'Speak to the Dimwell shopkeeper'};
 }
 function handleDimwellFollowup(){
  const prompt=dimwellFollowup();if(!prompt||blocked())return false;
  city.stop();
  const text={
   returned:'The shopkeeper has the stock back on the shelves. “We counted it this morning. Every piece is there. Thanks for coming back.”',
   missing:'The shopkeeper says a street sweeper saw the runner drop a piece of wrapping near the Park Lane approach.',
   search:'Under the awning you find a wrapper stamped with the shop’s mark. The stock itself is still missing.',
   confirm:'The shopkeeper recognises the stamp. The wrapping confirms the stock passed through Park Lane. The runner’s identity and the stock’s whereabouts remain open.'
  }[prompt.stage];
  const next={returned:'closed',missing:'search',search:'confirm',confirm:'closed'}[prompt.stage];
  const ok=save((d,r)=>{
   if(dimwellFollowup(r)?.stage!==prompt.stage)return false;
   d.dimwellFollowup={stage:next,text};
  });
  if(ok)city.tell(text+(next==='search'?' Check the Park Lane approach.':next==='confirm'?' Show it to the shopkeeper at the road bend.':''));
  return ok;
 }
 function dimwellPartnerAway(record){return data(record).active?.dimwellCalls?.status==='delegated';}
 function openDimwellIncident(){
  const record=makeStore().read(),a=data(record).active,incident=a?.dimwellIncident,check=a?.checkpoints?.[a.index];
  if(a?.routeId!==DIMWELL_BEAT||!incident?.noticed||incident.outcome||!check||!atPoint(check.position))return false;
  city.stop();
  const dialog=doc.getElementById('p21-duty-dialog'),box=doc.getElementById('p21-duty-actions');
  const copy=doc.createElement('p'),scene=DIMWELL_INCIDENTS[incident.variant];
  copy.textContent=scene.account;box.replaceChildren(copy);
  const choices=[['helped',scene.action],['logged','Log it and continue the beat']];
  if(scene.nobbyAction&&partnerId(record)==='WATCH-04')choices.splice(1,0,['nobby-lead',scene.nobbyAction]);
  for(const [outcome,label] of choices){
   const button=doc.createElement('button');button.type='button';button.textContent=label;box.append(button);
   button.onclick=()=>{
    dialog.close();
    if(save(d=>{
     const beat=d.active;
     if(beat?.runId!==a.runId||beat.index!==a.index||beat.dimwellIncident.outcome||!atPoint(check.position))return false;
     beat.dimwellIncident.outcome=outcome;
     if(outcome==='nobby-lead')d.nobbyLicenceLead=true;
     beat.visits.push({name:check.name,position:city.position().slice(),checkedAt:now()});
     beat.index++;
    }))city.tell(outcome==='helped'?scene.report:outcome==='nobby-lead'?scene.nobbyReport:'Incident logged for follow-up. Continue the beat.');
   };
  }
  const back=doc.createElement('button');back.type='button';back.textContent='Return to the street';back.onclick=()=>dialog.close();box.append(back);
  dialog.showModal();return true;
 }
 function recordInspection(decision=null){
  city.stop();
  const ok=save(d=>{
   const a=d.active;
   if(!valid(a)||a.index>=a.checkpoints.length)return false;
   const c=a.checkpoints[a.index],firstCase=a.routeId===FIRST_CASE_ROUTE;
   let reached=atPoint(c.position);
   if(firstCase)reached=atDesk()&&!!decision&&(decision.outcome!=='supported'||!!a.enquiry?.interview);
   if(a.routeId===MARKET_ENQUIRY&&market){
    const atContact=a.marketEscort?atPoint(market.safe):[market.visitor,market.guide].some(p=>atPoint(p,2));
    reached=decision?.outcome==='unresolved'||!!decision?.marketResponse&&atContact;
   }
   if(!reached){city.tell('Reach the marked checkpoint before checking the area.');return false;}
   let prepared=null;
   if(a.enquiry){
    if(!decision||a.enquiry.instanceId!==decision.id||!prepareEnquiry(a.enquiry,decision.outcome,decision.finding))return false;
    if(decision.marketResponse){
     a.enquiry.reportText='Findings: '+enquiryView(a.enquiry).findings.find(f=>f.id===decision.finding).text+' '+decision.marketResponse;
     a.enquiry.requestedAction=null;
    }
    prepared=clone(a.enquiry);
    prepared.observations=clone(enquiryView(a.enquiry).clues);
    prepared.snapshot={title:prepared.snapshot.title,premise:prepared.snapshot.premise,opening_line:prepared.snapshot.opening_line};
    delete prepared.findingOrder;
   }else if(decision)return false;
   a.visits.push({name:c.name,position:firstCase?c.position.slice():city.position().slice(),checkedAt:now(),...(prepared?{enquiry:prepared}:{})});
   a.index++;
   delete a.enquiry;
  });
  if(ok){const routeId=data(makeStore().read()).active?.routeId;if(routeId===FIRST_CASE_ROUTE||isChoiceRoute(routeId))return true;}
  if(ok){city.tell('Checkpoint checked. '+(view()?.objective||'Return to Colon to report.'));continueRoute();}return ok;
 }
 function openOperaResponse(){
  if(!intervene||!shiftDisturbance(makeStore().read()))return false;
  city.stop();
  const dialog=doc.getElementById('p21-duty-dialog'),box=doc.getElementById('p21-duty-actions'),content=doc.createElement('section');
  content.className='cw-patrol-route-menu';
  const copy=doc.createElement('p');
  copy.textContent='There’s a disturbance by the Opera. Step in with your partner or record what you saw for Colon.';
  content.append(copy);box.replaceChildren();box.append(content);
  for(const [label,act] of [['Intervene with your partner',intervene],['Record without intervening',()=>recordInspection()],['Back to the street',null]]){
   const button=doc.createElement('button');button.type='button';button.textContent=label;content.append(button);
   button.onclick=()=>{dialog.close();return act&&shiftDisturbance(makeStore().read())?act():false;};
  }
  dialog.showModal();return true;
 }
 function inspect(){
  const r=makeStore().read(),a=data(r).active;
  if(a?.routeId===DELIVERY){if(tailActor(a))return updateDelivery('watch');const lead=deliveryLeads.find(l=>!a.outcome&&!a.evidence.includes(l.id)&&atPoint(l.position));return lead?updateDelivery(lead.id):deliveryMenu();}
  if(a?.routeId===DISTURBANCE&&openOperaResponse())return true;
  if(a?.routeId===DIMWELL_BEAT){
   if(callsRunner(a))return dimwellCallsAction('follow');
   return openDimwellCalls(r)||openDimwellIncident();
  }
  if(a?.routeId===MARKET_ENQUIRY&&market)return marketPrimary(r,a);
  if(a&&licenceStop(a))return openLicence();
  if(a?.routeId===FIRST_CASE_ROUTE)return openPurse(openingRole());
  if(a&&(a.enquiry||(a.shift||r.state.chapter>=1)&&enquiryForStop(a.routeId,a.index)))return openEnquiry();
  return recordInspection();
 }
 function openLicence(){
  const a=data(makeStore().read()).active;
  if(blocked()||!valid(a)||!licenceStop(a)||view()?.action!=='inspect')return false;
  const variant=LICENCES[a.licenceVariant],checked=a.licence?.checked===true;
  city.stop();
  const dialog=doc.getElementById('p21-duty-dialog'),box=doc.getElementById('p21-duty-actions');
  box.replaceChildren();
  const content=doc.createElement('section');
  content.className='cw-patrol-route-menu';
  box.append(content);
  const text=(tag,copy)=>{const node=doc.createElement(tag);node.textContent=copy;content.append(node);return node;};
  const change=fn=>save(d=>{
   const active=d.active;
   if(active?.runId!==a.runId||!licenceStop(active)||view()?.action!=='inspect')return false;
   return fn(active);
  });
  const button=(label,fn,disabled=false)=>{const b=text('button',label);b.type='button';b.disabled=disabled;b.onclick=()=>{dialog.close();return fn();};};
  text('h3',a.nobbyLead?'Duplicate Guild licence':'Reported purse theft');
  text('p',a.nobbyLead?'Two traders in the eastern yard present permits carrying the same Thieves’ Guild licence number. Nobby recognises the number from the Dimwell collection chit.':'A passer-by identifies the person who took their purse. The patrol recovers a purse matching the description. Your partner asks the suspect to produce a Thieves’ Guild licence.');
  if(checked)text('p',variant.clue);
  button(a.nobbyLead?'Compare both permits with the Guild register':'Check the Guild licence',()=>change(active=>{active.licence={checked:true};})&&openLicence(),checked);
  const decide=(outcome,requiresCheck=true)=>{
   const ok=change(active=>{
    if(requiresCheck&&!active.licence?.checked)return false;
    active.licence={...(active.licence||{}),outcome};
    active.visits.push({name:active.checkpoints[active.index].name,position:city.position().slice(),checkedAt:now()});
    active.index++;
   });
   if(ok){city.tell(outcome==='escort'?'Suspect in custody. Escort them to Colon outside the Watch House.':outcome==='unsupported'?'Arrest recorded without enough evidence. Colon will review it when you file.':'Licence evidence recorded. Report the finding to Colon.');if(!isChoiceRoute(a.routeId))continueRoute();}
   return ok;
  };
  if(a.nobbyLead&&!checked)button('Arrest on the matching number alone',()=>decide('unsupported',false));
  if(checked){
   if(variant.status==='valid')button('Record licence and refer the dispute',()=>decide('licensed'));
   else if(variant.status==='duplicate'){
    button('Arrest the holder of the copied permit',()=>decide('escort'));
    button('Record the evidence and refer it',()=>decide('licensed'));
   }else button('Arrest and escort suspect',()=>decide('escort'));
  }
  button('Return to street',()=>{});
  dialog.showModal();
  return true;
 }
 function book(){
  city.stop();
  const ok=save(d=>{
   const a=d.active;
   if(!valid(a)||a.index!==a.checkpoints.length||!escort(a)||!atDesk())return false;
   a.licence.outcome='booked';
  });
  if(ok)city.tell('Suspect handed to Watch custody. File your shift report with Colon.');
  return ok;
 }
 function marketContacts(record=makeStore().read()){
  const a=data(record).active;
  if(!market||a?.routeId!==MARKET_ENQUIRY||a.index!==0)return [];
  return [
   {id:'market-case-visitor',name:'Visitor',key:'townswoman',p:market.visitor,escorting:!!a.marketEscort},
   {id:'market-case-guide',name:'Guide',key:'p3_human_02',p:market.guide}
  ];
 }
 async function talkMarket(role){
  if(blocked()||!market||!['visitor','guide'].includes(role)||!atPoint(market[role],1.8))return false;
  const initial=makeStore().read(),round=data(initial).active;
  if(initial.pending||round?.routeId!==MARKET_ENQUIRY||round.index!==0||round.marketEscort)return false;
  city.stop();
  let definition;
  if(!round.enquiry){
   try{definition=(await getEnquiryCases()).find(c=>c.id===enquiryForStop(MARKET_ENQUIRY,0)&&!c.feature_gates.length);}
   catch{city.tell('The account could not load. Try speaking again.');return false;}
   if(!definition)return false;
  }
  let line;
  const ok=save(d=>{
   const a=d.active;
   if(a?.runId!==round.runId||a.index!==0||a.marketEscort||!atPoint(market[role],1.8))return false;
   if(!a.enquiry)a.enquiry=newEnquiry(definition,a.runId+':0',random);
   line=MARKET_VOICES[a.enquiry.variantId]?.[role==='visitor'?0:1];
   if(!line)return false;
   collectEnquiry(a.enquiry,role==='visitor'?0:1);
  });
  if(ok)city.tell((role==='visitor'?'Visitor: ':'Guide: ')+line);
  return ok;
 }
 function marketReportUnresolved(){
  const a=data(makeStore().read()).active;
  if(a?.routeId!==MARKET_ENQUIRY||a.marketEscort||!a.enquiry?.clueIds.length)return false;
  return recordInspection({id:a.enquiry.instanceId,outcome:'unresolved'});
 }
 function marketPrimary(record,a){
  if(blocked())return false;
  const v=view(record);
  if(v.action!=='inspect')return false;
  if(a.marketEscort)return recordInspection({id:a.enquiry.instanceId,outcome:'supported',finding:a.enquiry.variantId,marketResponse:MARKET_RESPONSES[a.enquiry.variantId][1]});
  if(v.marketRole)return talkMarket(v.marketRole);
  const e=a.enquiry;
  if(!e||!enquiryView(e).complete)return false;
  if(![market.visitor,market.guide].some(p=>atPoint(p,2))){
   city.tell('Return to the visitor or guide to resolve the complaint.');
   return go();
  }
  city.stop();
  const dialog=doc.getElementById('p21-duty-dialog'),box=doc.getElementById('p21-duty-actions');
  box.replaceChildren();
  const content=doc.createElement('section');content.className='cw-patrol-route-menu';box.append(content);
  const text=(tag,copy)=>{const node=doc.createElement(tag);node.textContent=copy;content.append(node);return node;};
  const button=(label,fn)=>{const b=text('button',label);b.type='button';b.onclick=()=>{dialog.close();return fn();};};
  text('h3','Resolve the Market Hall complaint');
  for(const clue of enquiryView(e).clues)text('p',clue.text);
  for(const [finding,[label,response]] of Object.entries(MARKET_RESPONSES))button(label,()=>{
   if(finding!==e.variantId){city.tell('That response does not fit both accounts. Review your evidence or file it unresolved.');return false;}
   if(finding!=='CW-RP-039-C')return recordInspection({id:e.instanceId,outcome:'supported',finding,marketResponse:response});
   if(!atPoint(market.visitor,2)){city.tell('Return to the visitor to begin the escort.');return city.nav(market.visitor.slice(0,2),market.visitor[2]);}
   const ok=save(d=>{
    const a=d.active;
    if(a?.enquiry?.instanceId!==e.instanceId||!enquiryView(a.enquiry).complete)return false;
    a.marketEscort=true;
   });
   if(ok)city.tell('Visitor: “I’ll come with you.” Lead them to the safe spot.');
   return ok;
  });
  button('File unresolved',marketReportUnresolved);
  button('Return to street',()=>{});
  dialog.showModal();
  return true;
 }
 function openingContacts(record=makeStore().read()){
  const a=data(record).active;
  if(record.pending||a?.routeId!==FIRST_CASE_ROUTE||a.index!==0||!valid(a))return [];
  const contacts=[
   {id:'purse-stall',name:'Trader',key:'tavern-worker',p:openingPositions.stall},
   {id:'purse-witness',name:'Market witness',key:'townswoman',p:openingPositions.witness}
  ];
  const look=globalThis.CWOpeningSuspect.look(a.enquiry?.variantId);
  if(look&&a.enquiry.clueIds.length&&!openingIncident(record,a)){
   contacts.push({id:'purse-suspect',name:look.name,key:look.key,p:openingPositions.suspect});
  }
  return contacts;
 }
 function openPurse(role){
  const record=makeStore().read(),a=data(record).active;
  if(blocked()||record.pending||a?.routeId!==FIRST_CASE_ROUTE||a.index!==0||!valid(a))return false;
  if(role==='colon'?!atDesk():role&&!atPoint(openingPositions[role]))return false;
  city.stop();
  const dialog=doc.getElementById('p21-duty-dialog'),box=doc.getElementById('p21-duty-actions');
  const section=doc.createElement('section');section.className='cw-patrol-route-menu';box.replaceChildren(section);
  const text=(tag,copy)=>{const node=doc.createElement(tag);node.textContent=copy;section.append(node);};
  const button=(label,action)=>{const b=doc.createElement('button');b.type='button';b.textContent=label;
   b.onclick=()=>{dialog.close();return action?.();};section.append(b);};
  const e=a.enquiry,viewOfEvidence=e&&enquiryView(e);
  const change=fn=>save(d=>{
   const active=d.active;
   if(active?.runId!==a.runId||active.index!==0||!atPoint(openingPositions[role]))return false;
   active.enquiry??=newEnquiry(openingPurseCase(),active.runId+':0',random);
   return fn(active.enquiry);
  });
  const readClue=index=>{
   let line;
   const ok=change(enquiry=>{
    collectEnquiry(enquiry,index);
    line=enquiryView(enquiry).clues.find(clue=>clue.id===(index===0?'trace':'witness')).text;
   });
   if(ok)city.tell(line);
   return ok;
  };
  text('h3',{stall:'Trader’s stall',witness:'Market witness',suspect:'Question the suspect',colon:'Sergeant Colon'}[role]||a.name);
  if(role==='stall'){
   text('p','Trader: “'+openingPurseCase().opening_line+'”');
   button('Inspect the purse hook',()=>readClue(0));
  }else if(role==='witness'){
   text('p','“I was packing up, but I had a clear view of the counter.”');
   button('Ask what she saw',()=>readClue(1));
  }else if(role==='suspect'){
   const torn=e?.variantId==='porter'?'blue cap':'red scarf';
   if(!viewOfEvidence?.complete){
    text('p','“I stopped for a look at the goods. Ask the trader if you like.”');
    text('p','You need a trace from the stall and an account of what happened to test that story.');
   }else if(!e.interview){
    text('p','“I never went near the counter. This '+torn+' tore at home.”');
    button('Compare the tear with the thread on the hook',()=>{
     const response='The thread matches the fresh tear. When you put the witness’s account to them, the suspect admits they reached over the counter.';
     const ok=change(enquiry=>{
      if(!enquiryView(enquiry).complete)return false;
      enquiry.interview=response;
     });
     if(ok)city.tell(response);
     return ok;
    });
   }else text('p','The tear matches the thread on the hook. The suspect admitted reaching over the counter.');
  }else if(role==='colon'){
   const clues=e?.clueIds||[];
   text('p',!clues.length?'“Start with the stall or find someone who saw the theft.”':
    !clues.includes('trace')?'“You’ve got a witness. Now see whether the stall backs up what she says.”':
    !clues.includes('witness')?'“A loose thread tells you what to look for. Find the witness and ask what she saw.”':
    !e.interview?'“You’ve got enough to question them. See what they say about that tear.”':'“Which person does your evidence point to?”');
   for(const clue of viewOfEvidence?.clues||[])text('p',clue.text);
   const file=(outcome,finding)=>{
    if(!recordInspection({id:e.instanceId,outcome,finding})){
     city.tell('Colon: “That finding doesn’t fit what you brought me. Check your notes and try again.”');
     return false;
    }
    return report();
   };
   if(viewOfEvidence?.complete&&e.interview){
    for(const finding of viewOfEvidence.findings)button(finding.text,()=>file('supported',finding.id));
   }
   // Filing unresolved needs the required evidence first, so the opening case teaches the full lead-to-report loop.
   if(viewOfEvidence?.complete)button('File as unresolved',()=>file('unresolved'));
  }else{
   text('p',view(record).openingReminder);
   for(const clue of viewOfEvidence?.clues||[])text('p',clue.text);
  }
  button(role==='colon'?'Return to the square':'Back to the square');
  dialog.showModal();
  return true;
 }
 async function openEnquiry(feedback=''){
  if(blocked())return false;const initial=makeStore().read(),round=data(initial).active;
  if(initial.pending||!point(city.position())||!valid(round)||round.index>=round.checkpoints.length||distance(city.footPosition?.()||city.position(),round.checkpoints[round.index].position)>1.6)return false;
  city.stop();const runId=round.runId,index=round.index,caseId=enquiryForStop(round.routeId,index);if(!caseId)return false;
  let cases;try{cases=await getEnquiryCases();}catch{city.tell('The enquiry could not load. Your checkpoint is unchanged; try Check area again.');return false;}
  if(blocked()||!point(city.position()))return false;let current=makeStore().read(),a=data(current).active;
  if(!a||a.runId!==runId||a.index!==index||current.pending||distance(city.footPosition?.()||city.position(),a.checkpoints[index].position)>1.6)return false;
  if(!a.enquiry){const definition=cases.find(c=>c.id===caseId&&!c.feature_gates.length);if(!definition)return false;
   if(!definition.dayparts.includes(daypart()))return recordInspection();
   if(!save(d=>{const active=d.active;if(!active||active.runId!==runId||active.index!==index)return false;if(!active.enquiry)active.enquiry=newEnquiry(definition,runId+':'+index,random);}))return false;
  }
  current=makeStore().read();a=data(current).active;if(!a||a.runId!==runId||a.index!==index||!a.enquiry)return false;
  const id=a.enquiry.instanceId,v=enquiryView(a.enquiry),dialog=doc.getElementById('p21-duty-dialog'),box=doc.getElementById('p21-duty-actions');box.replaceChildren();const content=doc.createElement('section');content.className='cw-patrol-route-menu';box.append(content);
  const text=(tag,copy)=>{const node=doc.createElement(tag);node.textContent=copy;content.append(node);return node;};
  const button=(label,fn,disabled=false)=>{const b=text('button',label);b.type='button';b.disabled=disabled;b.onclick=()=>{dialog.close();return fn();};};
  const change=fn=>save(d=>{const active=d.active;if(!active||active.runId!==runId||active.index!==index||active.enquiry?.instanceId!==id||!point(city.position())||distance(city.footPosition?.()||city.position(),active.checkpoints[index].position)>1.6)return false;return fn(active.enquiry);});
  text('h3',v.title);text('p',v.premise);text('p','“'+v.opening+'”');if(feedback)text('p',feedback);
  text('p','Evidence recorded: '+v.clues.length+'/'+v.total);for(const clue of v.clues)text('p',clue.text);
  button('Inspect the scene',()=>{const ok=change(e=>collectEnquiry(e,0));return ok?openEnquiry():false;},v.clues.some(c=>c.id===a.enquiry.snapshot.variants.find(x=>x.id===a.enquiry.variantId).clues[0].id));
  button('Question witnesses / compare accounts',()=>{const ok=change(e=>collectEnquiry(e,1));return ok?openEnquiry():false;},v.clues.some(c=>c.id===a.enquiry.snapshot.variants.find(x=>x.id===a.enquiry.variantId).clues[1].id));
  const prepare=(outcome,finding)=>{if(!prepareEnquiry(clone(a.enquiry),outcome,finding))return openEnquiry('The observations do not establish that finding. Review the evidence or file an unresolved report.');const ok=recordInspection({id,outcome,finding});if(ok)city.tell('Report prepared. Return to Colon to file your findings.');return ok;};
  if(v.complete){text('h4','Which finding fits the evidence?');for(const finding of v.findings)button(finding.text,()=>prepare('supported',finding.id));}
  else text('p','Inspect the scene and compare the accounts before choosing a finding.');
  button('Prepare an honest unresolved report',()=>prepare('unresolved'),!v.clues.length);button('Return to street',()=>{});dialog.showModal();return true;
 }
 function report(){
  const record=makeStore().read(),round=data(record).active;
  if(deliveryActive(record))return fileDelivery();
  if(round?.routeId===FIRST_CASE_ROUTE&&round.index===0)return openPurse('colon');
  city.stop();const ok=save((d,r)=>{const a=d.active;if(!valid(a)||a.index!==a.checkpoints.length||escort(a)||!atDesk()){city.tell('Complete the checkpoints and return to Sergeant Colon to report.');return false;}
   if(a.routeId===FIRST_CASE_ROUTE&&a.visits[0]?.enquiry){
    const enquiry=a.visits[0].enquiry,incident=openingIncident(r,a);
    if(incident){
     enquiry.reportText+=' '+openingIncidentReport(incident);
     if(incident.subjectStatus==='arrested')enquiry.requestedAction=null;
    }
   }
   const before=a.shift?career(r.state):null;
   d.creditedRoutes=Array.isArray(d.creditedRoutes)?d.creditedRoutes:[];const routeMerit=d.creditedRoutes.includes(a.routeId)?0:2;if(routeMerit){r.state.merit+=routeMerit;d.creditedRoutes.push(a.routeId);}
   d.enquiryCredits=d.enquiryCredits&&typeof d.enquiryCredits==='object'?d.enquiryCredits:{};let enquiryMerit=0;
   for(const check of a.visits)if(check.enquiry){const e=check.enquiry,legacy=(r.state.flags.patrolPool?.reports||[]).filter(p=>p.caseId===e.caseId).reduce((n,p)=>n+(Number(p.meritAwarded)||0),0),credited=Math.min(4,Math.max(0,Number(d.enquiryCredits[e.caseId])||0,legacy)),earned=e.outcome==='supported'?4:e.clueIds.length?1:0;e.meritAwarded=Math.max(0,earned-credited);e.rewardApplied=true;d.enquiryCredits[e.caseId]=Math.max(credited,earned);enquiryMerit+=e.meritAwarded;}
   let pay=0,shiftMerit=0,promotion=null,lostShift=false;
   if(a.shift){
    pay=before.pay;
    shiftMerit=(a.licence?.outcome==='unsupported'?2:4+(a.licence?.outcome?3:0))+(['helped','nobby-lead'].includes(a.dimwellIncident?.outcome)?1:0);
    // A disturbance the patrol lost (withdrew or was beaten, nobody arrested) still pays the
    // wage, but earns no shift merit and does not count towards promotion.
    lostShift=a.routeId===DISTURBANCE&&r.encounters.slice(a.encounterStart).some(e=>e.binding==='shift-disturbance'&&['withdrawn','defeat'].includes(e.result?.outcome)&&!e.result?.arrested);
    if(lostShift){shiftMerit=0;d.unsuccessfulShifts=(Number(d.unsuccessfulShifts)||0)+1;}
    r.state.coins+=pay;
    d.paidShifts=(Number(d.paidShifts)||0)+1;
    r.state.flags.watchShiftClock=shiftClock(r.state,false,now());
    const rank=career({...r.state,merit:r.state.merit+enquiryMerit+shiftMerit,flags:{...r.state.flags,[FLAG]:{...d,active:null}}});
    if(rank.index>before.index&&rank.name!==before.name)promotion=rank.name;
   }
   r.state.merit+=enquiryMerit+shiftMerit;
   const merit=routeMerit+enquiryMerit+shiftMerit;
   if(CALL_REPORTS[a.dimwellCalls?.status]){
    d.dimwellCallsFiled=true;
    d.dimwellCallsSource={dimwellCalls:a.dimwellCalls.status,shift:a.shift};
   }
   d.completed++;d.reports.push({runId:a.runId,routeId:a.routeId,name:a.name,startedAt:a.startedAt,reportedAt:now(),merit,routeMerit,enquiryMerit,checkpoints:a.visits,incidentIds:r.encounters.slice(a.encounterStart).map(e=>e.id).slice(-20),...(a.shift?{shift:a.shift,pay,promotion,...(lostShift?{unsuccessful:true}:{}),licence:a.licence?.outcome||null,...(a.dimwellIncident?{dimwellIncident:a.dimwellIncident}:{}),...(a.dimwellCalls?{dimwellCalls:a.dimwellCalls.status}:{})}:{})});d.reports=d.reports.slice(-12);d.active=null;});
  if(ok){
   const record=makeStore().read(),filed=data(record).reports.at(-1);
   const finding=filed?.routeId===FIRST_CASE_ROUTE?filed.checkpoints[0]?.enquiry?.reportText:null;
   const summary=shiftIncidentSummary(filed,record.encounters);
   city.tell(finding?finding+' Report filed. '+(filed.merit?filed.merit+' merit earned. ':'')+
    (data(record).paidShifts?'Open Night duty to choose your next assignment.':'Open Night duty at the Watch House to choose your first paid assignment.'):
    (summary?summary+' ':'')+patrolReportMessage(record,filed)+(filed?.promotion==='Constable'&&deliveryAvailable(record)?' Captain Carrot has an assignment at Watch Square.':''));
  }
  return ok;
 }
 function abandon(){city.stop();return save((d,r)=>{if(!d.active||escort(d.active))return false;if(d.active.shift)r.state.flags.watchShiftClock=shiftClock(r.state,false,now());d.active=null;});}
 function primary(){const v=view();if(!v||blocked())return false;if(v.action==='leads')return openPurse();if(v.action==='inspect')return inspect();if(v.action==='report')return report();if(v.action==='book')return book();if(v.action==='menu')return v.delivery?deliveryMenu():v.twoCalls&&callsRunner(data(makeStore().read()).active)?openDimwellCalls():menu();return go();}
 function menu({fromWatchHouse=false}={}){
  if(blocked())return false;const record=makeStore().read();if(record.pending){city.tell('Finish the current incident before starting or changing a round.');return false;}
  city.stop();const dialog=doc.getElementById('p21-duty-dialog'),box=doc.getElementById('p21-duty-actions');box.replaceChildren();const content=doc.createElement('section');content.className='cw-patrol-route-menu';box.append(content);
  const text=(tag,copy)=>{const e=doc.createElement(tag);e.textContent=copy;content.append(e);return e;};
  const button=(label,fn)=>{const b=text('button',label);b.type='button';b.onclick=()=>{dialog.close();return fn();};};
  const d=data(record),v=view(record),rank=career?.(record.state);
  text('h3',rank?'Night duty':'Go on patrol');
  const clock=rank?campaignClock('',record.state,now()):null;let rankLine=null,timeLine=null;
  if(rank){
   rankLine=text('p',rank.name+' · '+record.state.merit+' merit · '+rank.pay+' coins per completed shift');
   const preparation=record.state.flags.shopPreparation,offer=globalThis.window?.QuillShopPreparations?.offers?.[preparation?.offerId];
   if(offer&&preparation.night===record.state.night)text('p','Tonight’s preparation: '+offer.label+'. It will be used in your next encounter.');
   else text('p','Coins buy permanent weapons, armour and boots at the Armoury, plus patrol supplies and one preparation for the next encounter: food for a stronger guard, a lozenge for talking a suspect down, or a boot fitting for the opening move.');
   if(d.active?.shift)text('p','Rank and pay stay fixed for this shift. Any promotion takes effect when you file the shift report.');
   if(rank.next)text('p',(rank.next.name===rank.name?'Next pay grade: ':'Next rank: ')+rank.next.name+' · '+Math.min(record.state.merit,rank.next.merit)+'/'+rank.next.merit+' merit · '+Math.min(Math.max(0,(d.paidShifts||0)-(Number(d.unsuccessfulShifts)||0)),rank.next.reports)+'/'+rank.next.reports+' filed shifts');
   timeLine=text('p','City time '+clock.time+' · '+clock.phase);
  }
  if(!d.active&&deliveryAvailable(record))button('Carrot’s assignment',deliveryMenu);
  if(d.active){text('p',v.title+' · '+v.done+'/'+v.total+' · '+v.objective);
   if(v.dimwell){text('p',d.active.checkpoints.map((c,i)=>c.name+(i<d.active.index?' (checked)':'')).concat('Sergeant Colon').join(' → '));if(v.action!=='menu')button(v.label,primary);if(callsRunner(d.active))button('Review pursuit',()=>openDimwellCalls());}
   else button(v.label,primary);if(!escort(d.active))button(d.active.shift?'End shift without filing':'End round without reporting',()=>{if(abandon())city.tell('Patrol ended without a report. Your case and encounter results are retained.');});}
  else if(rank){
   const route=assignedRoute(d);
   const posted=postedRoutes(d),hasMarket=posted.includes(MARKET_ENQUIRY);
   if(!d.paidShifts&&d.reports.some(report=>report.routeId===FIRST_CASE_ROUTE))
    text('p','Your purse report is filed. Choose your first paid assignment below. Your '+rank.pay+' coins are paid when you return to Colon and file the shift report.');
   text('p','Sign on at 21:00 for an assigned beat or an incident with your partner.');
   text('p','Opera disturbance: intervene or record what happened. Eastern yard: verify a Guild licence and act on what you find.');
   if(hasMarket)text('p','Market Hall: investigate a complaint about a guide demanding payment.');
   if(d.nobbyLicenceLead)text('p','Nobby’s lead: the same Guild licence number appeared on the Dimwell collection chit and an eastern-yard permit.');
   if(atDesk()||fromWatchHouse){
    const take=id=>start(id,{paid:true,fromWatchHouse});
    if(dimwellRoute.checkpoints.every(c=>point(c[1])))button('Sign on for the Dimwell beat',()=>take(DIMWELL_BEAT));
    button('Take the Opera disturbance',()=>take(DISTURBANCE));
    button(d.nobbyLicenceLead?'Follow Nobby’s duplicate licence lead':'Take the Guild licence check',()=>take(LICENCE_CHECK));
    if(hasMarket){
     if(market)button('Take the Market escort complaint',()=>take(MARKET_ENQUIRY));
     button('Take the '+route.name,()=>take(route.id));
    }
   }else button('Walk to Watch duty desk',()=>city.nav(home.slice(0,2),home[2]));
  }
  else for(const route of routes.filter(route=>route.id!==DIMWELL_BEAT&&route.id!=='watch-precinct'&&route.id!==FIRST_CASE_ROUTE&&!isChoiceRoute(route.id))){text('p',route.name+' · '+route.checkpoints.length+' checkpoints. '+route.description);text('p',route.checkpoints.map(c=>c[0]).concat('Sergeant Colon').join(' → '));button('Begin '+route.name,()=>start(route.id));if(!route.checkpoints.every(c=>point(c[1]))){content.lastChild.disabled=true;text('p','This route has a closed approach.');}}
  if(!rank)text('p','Completed rounds: '+d.completed+'. After your first main case, some checkpoints offer street enquiries. First report on each route earns 2 merit. Later rounds add to your patrol log. Supported enquiry reports earn up to 4 merit per type; useful unresolved reports earn 1. Each type is capped at 4 total. Your case remains in the Notebook.');
  for(const report of d.reports.slice(-3).reverse()){text('p','Filed: '+report.name+' · '+(shiftIncidentSummary(report,record.encounters)||report.checkpoints.length+' checks · '+report.incidentIds.length+' recorded encounters.')+(Number.isFinite(report.merit)?' · '+report.merit+' merit total':'')+(report.pay?' · '+report.pay+' coins paid':''));for(const check of report.checkpoints)if(check.enquiry){const details=doc.createElement('details'),summary=doc.createElement('summary'),body=doc.createElement('p');summary.textContent=check.enquiry.snapshot.title+' · '+check.enquiry.outcome+' · '+(check.enquiry.meritAwarded||0)+' enquiry merit';body.textContent=check.enquiry.reportText+(check.enquiry.requestedAction?' Response requested; follow-up has not been confirmed.':'');details.append(summary,body);content.append(details);}}
  button('Return to street',()=>{});
  if(rank)nightBoard({dialog,content,plates:[[rank.name,record.state.merit+' merit'],[rank.pay+' coins','per shift'],[clock.time,clock.phase]],drop:[rankLine,timeLine]});
  dialog.showModal();return true;
 }
 // Night duty on the team's notice board (cw-night-board.css): the title on the brass plaque, the
 // notes and the same action buttons on the parchment, rank/pay/time on the three plates.
 // Night duty on the team's notice board: the h3 goes on the brass plaque, rank, pay and city time on the
 // three plates (so their text lines are dropped), the rest on the parchment. General rank notes (from the
 // first dropped line to the second) move below the actions so the night's choices show without scrolling.
 function nightBoard({dialog,content,plates,drop}){
  const [first,last]=drop,notes=[];
  if(first&&last)for(let node=first.nextSibling;node&&node!==last;node=node.nextSibling)notes.push(node);
  for(const node of drop)node?.remove();
  const heading=content.querySelector(':scope > h3'),frame=doc.createElement('div'),parchment=doc.createElement('div'),row=doc.createElement('div');
  frame.className='cw-night-board-frame';parchment.className='cw-board-parchment';row.className='cw-board-plates';
  if(heading)heading.className='cw-board-plaque';
  for(const node of [...content.childNodes])if(node!==heading&&!notes.includes(node))parchment.append(node);
  if(notes.length){const box=doc.createElement('div');box.className='cw-board-notes';box.append(...notes);const back=parchment.querySelector(':scope > button:last-of-type');parchment.insertBefore(box,back||null);}
  for(const [big,small] of plates){const plate=doc.createElement('div'),b=doc.createElement('strong'),t=doc.createElement('span');plate.className='cw-board-plate';b.textContent=big;t.textContent=small;plate.append(b,t);row.append(plate);}
  frame.append(...(heading?[heading]:[]),parchment,row);content.replaceChildren(frame);
  // Menus reuse this dialog: one closes it and opens the next straight away, and the close event arrives
  // after the next is showing. Keep the board look only while the dialog is open and still shows the board.
  dialog.classList.add('cw-night-board');
  const off=()=>{if(dialog.open&&dialog.querySelector('.cw-night-board-frame'))return;dialog.classList.remove('cw-night-board');dialog.removeEventListener('close',off);};
  dialog.addEventListener('close',off);
 }
 function shiftIncidentSummary(report,encounters){
  if(report?.routeId===DIMWELL_BEAT){
   const incident=report.dimwellIncident;
   if(incident?.outcome==='helped')return [DIMWELL_INCIDENTS[incident.variant].report,CALL_REPORTS[report.dimwellCalls]].filter(Boolean).join(' ');
   if(incident?.outcome==='nobby-lead')return [DIMWELL_INCIDENTS[incident.variant].nobbyReport,CALL_REPORTS[report.dimwellCalls]].filter(Boolean).join(' ');
   if(incident?.outcome==='logged')return 'Street incident logged for follow-up at '+report.checkpoints[incident.stop].name+'. '+(CALL_REPORTS[report.dimwellCalls]||'');
   return 'Dimwell beat completed.';
  }
  if(report?.routeId===MARKET_ENQUIRY)return report.checkpoints[0]?.enquiry?.reportText||'';
  if(report?.routeId===LICENCE_CHECK)return report.licence==='booked'?'Suspect handed into custody.':report.licence==='unsupported'?'Colon released the trader: the matching number alone did not support an arrest. Two merit were docked from the shift.':'Licence verified and the dispute referred.';
  if(report?.routeId!==DISTURBANCE)return '';
  const incident=encounters.find(e=>e.binding==='shift-disturbance'&&report.incidentIds.includes(e.id));
  if(!incident)return 'Disturbance recorded without intervening.';
  const result=incident.result;
  if(!result)return 'Intervention recorded.';
  if(result.arrested)return 'Arrest made at the Opera disturbance.';
  if(result.outcome==='withdrawn'||result.outcome==='defeat')return 'Patrol withdrew from the disturbance.';
  return 'Disturbance handled without an arrest.';
 }
 function openingSuspect(record){
  const a=data(record).active;
  if(a?.routeId!==FIRST_CASE_ROUTE||!a.enquiry?.interview||!valid(a)||!enquiryView(a.enquiry).complete||
   openingIncident(record,a)||!atPoint(openingPositions.suspect))return null;
  return globalThis.CWOpeningSuspect.look(a.enquiry.variantId)?.name??null;
 }
 function shiftDisturbance(record){
  const a=data(record).active;
  return !record.pending&&!!a?.shift&&a.routeId!==DIMWELL_BEAT&&(!isChoiceRoute(a.routeId)||a.routeId===DISTURBANCE)&&a.index===a.checkpoints.length-1&&!escort(a)&&
   view(record)?.action==='inspect'&&!record.encounters.slice(a.encounterStart).some(e=>e.binding==='shift-disturbance');
 }
 return {routes:routes.filter(r=>r.id!==DIMWELL_BEAT&&r.id!==FIRST_CASE_ROUTE&&!isChoiceRoute(r.id)),home,view,start,dimwellStop,mapStop,observeDimwell,dimwellRunner,dimwellRunnerClick,dimwellFollowup,handleDimwellFollowup,dimwellPartnerAway,observeDeliveryTail,deliveryRunner,deliveryAvailable,deliveryActive,deliveryContact,deliveryMenu,marketContacts,talkMarket,marketReportUnresolved,openingContacts,openPurse,openingSuspect,shiftDisturbance,inspect,report,abandon,go,goFirstLead,goCarrot,resumeRoute,primary,menu,escortActive:record=>escort(data(record).active),onShift:record=>!!data(record).active?.shift,log:()=>clone(data(makeStore().read()))};
}
