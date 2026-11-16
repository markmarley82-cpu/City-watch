import {FIRST_CASE_FIGHT,FIRST_CASE_ROUTE} from './cw-patrol-enquiries.mjs?v=opening-case-report';
const CASES=[['The missing ledger',6],['Break-ins and the old crypt',6],['Assaults on patrol',4]];
export function patrolView(record,context={},round=null){
 if(round&&!record.pending)return {...round,showProgress:true,round:true};
 const s=record.state,c=Math.max(0,Math.min(2,Number(s.chapter)||0)),stage=Math.max(0,Number(s.stage)||0),[title,total]=CASES[c];
 const rounds=s.flags?.p21PatrolRounds;
 if(!record.pending&&c===0&&stage===0&&Number(rounds?.paidShifts)>0)
  return {title:'Between shifts',done:0,total,label:context.primaryLabel||'Choose Night duty',
   objective:context.deliveryAvailable?'Captain Carrot has an assignment outside the Watch House. You can also choose another Night duty.':'Choose Night duty for another shift, or ask Colon about the next case.',
   showProgress:false,summary:true,round:false};
 if(!record.pending&&c===0&&stage===0&&Array.isArray(s.flags?.p21PatrolRounds?.creditedRoutes)&&s.flags.p21PatrolRounds.creditedRoutes.includes(FIRST_CASE_ROUTE)){
  return {title:'First patrol filed',done:0,total,label:context.primaryLabel||'Talk to Sergeant Colon',objective:'Purse report filed. Choose Night duty for a paid shift, or ask Colon about the next case.',showProgress:false,firstReportFiled:true,round:false};
 }
 return {title:record.pending?(record.pending.chase?'Pursuit in progress':'Incident in progress'):c===2&&stage>=4?'Free patrol':c===0&&stage===0?'First case: '+title:title,done:Math.min(stage,total),total,label:context.primaryLabel||'Go to assignment',showProgress:!record.pending,round:false};
}
export function progressNotice(before,after){
 if(!before)return null;
 const a=before.state,b=after.state,rounds=Number(b.flags?.p21PatrolRounds?.completed)||0,oldRounds=Number(a.flags?.p21PatrolRounds?.completed)||0;
 const closed=b.chapter>a.chapter||b.chapter===2&&a.chapter===2&&a.stage<4&&b.stage>=4,lead=closed||b.chapter===a.chapter&&b.stage>a.stage,incident=after.encounters.length>before.encounters.length;
 if(!lead&&!incident&&rounds<=oldRounds)return null;
 const changes=[];for(const [key,label]of [['merit','merit'],['coins','coins']]){const n=(Number(b[key])||0)-(Number(a[key])||0);if(n)changes.push((n>0?'+':'−')+Math.abs(n)+' '+label);}
 if(rounds>oldRounds)changes.push(rounds+' completed round'+(rounds===1?'':'s'));
 return {title:rounds>oldRounds?'Patrol reported':closed?'Case closed':incident?'Incident recorded':'Lead recorded',detail:changes.join(' · ')||'Your casebook has been updated.'};
}
export function createPatrolLoop({city,game,snapshot,duty,nightDuty=false,primaryAction,doc=document,timers=window}){
 const bar=doc.getElementById('p21-orders-bar'),objective=doc.getElementById('p21-objective'),primary=doc.getElementById('p21-track');
 const make=(tag,cls)=>{const e=doc.createElement(tag);if(cls)e.className=cls;return e;};
 const style=make('link');style.rel='stylesheet';style.href=new URL('cw-patrol-loop.css?v=organiser-quest-reminders',import.meta.url).href;doc.head.append(style);
 const copy=make('div','cw-patrol-copy'),heading=make('small'),progress=make('progress');progress.setAttribute('aria-label','Current case or patrol progress');copy.append(heading,objective,progress);bar.prepend(copy);bar.classList.add('cw-patrol-orders');
 const secondary=make('button','cw-patrol-incident');secondary.id='cw-patrol-routes';secondary.type='button';bar.append(secondary);
 const legacy=doc.getElementById('p21-encounter'),extra=doc.querySelector('.cw-phone-extra-actions')||doc.querySelector('.city-tools');if(legacy&&extra)extra.append(legacy);
 const receipt=make('aside','cw-patrol-receipt');receipt.hidden=true;receipt.setAttribute('role','status');receipt.setAttribute('aria-live','polite');const receiptCopy=make('span'),continueLead=make('button'),dismiss=make('button');continueLead.type='button';continueLead.textContent='Next lead';dismiss.type='button';dismiss.textContent='Close';dismiss.setAttribute('aria-label','Dismiss patrol update');receipt.append(receiptCopy,continueLead,dismiss);doc.querySelector('.city-view').append(receipt);
 const unresolved=make('button','cw-patrol-unresolved');unresolved.type='button';unresolved.textContent='Prepare unresolved report';unresolved.hidden=true;bar.append(unresolved);
 let previous=null,queued=null,timer=null,lastKey='',receiptOffersDuty=false;
 const capture=r=>({state:{chapter:r.state.chapter,stage:r.state.stage,merit:r.state.merit,coins:r.state.coins,flags:{p21PatrolRounds:{completed:r.state.flags?.p21PatrolRounds?.completed||0}}},encounters:{length:r.encounters.length}});
 const hide=()=>{receipt.hidden=true;timers.clearTimeout(timer);};dismiss.onclick=hide;
 function update(record,context,dutyView){
  if(!record){const current=snapshot();record=current.record;context=current.context;}
  const view=patrolView(record,context,dutyView===undefined?duty.view(record):dutyView);
  const disturbance=context.binding==='shift-disturbance'&&!record.pending;
  const purseConfrontation=view.firstCase&&context.binding===FIRST_CASE_FIGHT;
  const secondaryLabel=disturbance?'Intervene':purseConfrontation?'Confront suspect':context.binding&&!record.pending?'Handle incident':nightDuty?'Night duty':'Patrol routes';
  const key=JSON.stringify([view.title,view.done,view.total,view.label,secondaryLabel,!!record.pending,view.showProgress,view.objective]);
  if(key!==lastKey){lastKey=key;heading.textContent=view.title+(view.showProgress?' · '+view.done+'/'+view.total:'');progress.hidden=!view.showProgress;primary.textContent=view.label;primary.setAttribute('aria-label',view.label);secondary.textContent=secondaryLabel;secondary.disabled=!!record.pending;progress.max=view.total;progress.value=view.done;progress.setAttribute('aria-valuetext',view.done+' of '+view.total+' steps completed');}
  if(disturbance&&!view.incidentChoice)objective.textContent='A disturbance has broken out at this stop.';
  else if(view.round||view.firstReportFiled||view.summary)objective.textContent=view.objective;
  unresolved.hidden=!view.canReportUnresolved;
  const firstUpdate=previous===null,notice=progressNotice(previous,record);previous=capture(record);if(notice)queued=notice;
  // Reopening the game mid-case: offer the same "Next lead" shortcut that follows progress.
  const st=record.state;
  if(firstUpdate&&!notice&&!record.pending&&!view.summary&&!view.firstReportFiled&&((Number(st.chapter)||0)>0||(Number(st.stage)||0)>0))queued={title:'Welcome back',detail:'Your patrol is where you left it. Tap Next lead to carry on.',noNext:true};
  if(queued&&!context.blocked){
   const reported=queued.title==='Patrol reported';
   receiptOffersDuty=reported&&nightDuty&&!record.pending&&!view.round;
   continueLead.textContent=receiptOffersDuty?'Choose Night duty':'Next lead';
   const next=queued.noNext?'':receiptOffersDuty?'Choose Night duty for another assignment.':reported?'':objective.textContent;
   receiptCopy.textContent=queued.title+' · '+queued.detail+(next?' Next: '+next.replace(/\.?$/,'.'):'');
   queued=null;receipt.hidden=false;timers.clearTimeout(timer);timer=timers.setTimeout(hide,15000);
  }
  return view;
 }
 primary.onclick=()=>{const {record,context}=snapshot();if(context.blocked)return false;if(!record.pending&&duty.view(record))return duty.primary();return primaryAction();};
 // Resolve the current action at click time: the case, shift or incident may have changed.
 continueLead.onclick=()=>{const {record,context}=snapshot();if(context.blocked)return false;hide();return receiptOffersDuty&&!record.pending&&!duty.view(record)?duty.menu():primary.onclick();};
 secondary.onclick=()=>{const {record,context}=snapshot();if(record.pending||context.blocked)return false;if(context.binding){city.stop();return game.battle();}return duty.menu();};
 unresolved.onclick=()=>{if(!snapshot().context.blocked)return duty.marketReportUnresolved();};
 doc.addEventListener('close',()=>update(),true);update();return {update};
}
