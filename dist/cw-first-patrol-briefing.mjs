import {FIRST_CASE_ROUTE} from './cw-patrol-enquiries.mjs?v=opening-case-report';
export const FIRST_PATROL_BRIEFING_FLAG='firstPatrolBriefingVersion';
export const FIRST_PATROL_ROUTE=FIRST_CASE_ROUTE;

export function firstPatrolBriefingEligible(record){
 const state=record?.state,flags=state?.flags||{},rounds=flags.p21PatrolRounds;
 return !!flags.watchOathVersion&&typeof flags.recruitName==='string'&&!!flags.recruitName.trim()&&
  state.chapter===0&&state.stage===0&&!record.pending&&record.steps===0&&
  !flags[FIRST_PATROL_BRIEFING_FLAG]&&!rounds?.active;
}

export function saveFirstPatrolBriefing({makeStore}){
 const store=makeStore(),record=store.read(),active=record.state.flags?.p21PatrolRounds?.active;
 if(![FIRST_PATROL_ROUTE,'watch-square'].includes(active?.routeId))return false;
 const next=JSON.parse(JSON.stringify(record));
 next.state.flags={...next.state.flags,[FIRST_PATROL_BRIEFING_FLAG]:1};
 if(!store.replaceRecord(next,record.revision))return false;
 try{store.project();}catch{}
 return true;
}

export function createFirstPatrolBriefing({city,makeStore,patrolDuty,doc=document,schedule=fn=>setTimeout(fn,0)}){
 let dialog=null,status=null,accept=null,starting=false;
 const text=(tag,copy)=>{const node=doc.createElement(tag);node.textContent=copy;return node;};
 function mount(){
  if(dialog)return dialog;
  dialog=doc.createElement('dialog');dialog.id='cw-first-patrol-briefing';dialog.className='cw-patrol-dialog cw-first-patrol-briefing';dialog.setAttribute('aria-labelledby','cw-first-patrol-title');
  const header=doc.createElement('header'),title=text('h2','Your first patrol');title.id='cw-first-patrol-title';const badge=text('span','');badge.className='cw-briefing-badge';badge.setAttribute('aria-hidden','true');const label=text('p','CITY WATCH · DUTY SHEET');header.append(badge,label,title);dialog.append(header);
  const orders=doc.createElement('section');orders.className='cw-first-patrol-orders';
  const scene=doc.createElement('img');
  scene.className='cw-first-patrol-scene';scene.src='assets/briefing/colon-duty-desk-v2.webp';
  scene.alt='Sergeant Colon sits across the Watch House desk with the first patrol route spread between you.';scene.width=480;scene.height=384;
  dialog.append(scene);
  const speaker=text('h3','Sergeant Colon');speaker.className='cw-first-patrol-speaker';
  orders.append(speaker);
  orders.append(text('p','“In here, recruit. A trader’s purse was stolen in the west yard of Watch Square. Take Nobby with you. The trader can tell you who was nearby. Find out who took it and report back to me outside the Watch House.”'));
  const details=doc.createElement('dl');
  for(const [term,description] of [['Partner','Nobby Nobbs'],['Where','Watch Square · western yard'],['Kit','Badge · truncheon · Notebook']]){details.append(text('dt',term),text('dd',description));}
  orders.append(details,text('p','Follow either lead first. Your Notebook keeps track of what you find, and the Disorganiser can remind you where to look.'));
  dialog.append(orders);status=text('p','');status.className='hint';status.setAttribute('role','status');dialog.append(status);
  accept=text('button','Start patrol');accept.type='button';accept.onclick=begin;dialog.append(accept);
  dialog.addEventListener('cancel',event=>event.preventDefault());doc.body.append(dialog);return dialog;
 }
 function start(){
  if(starting)return false;
  const record=makeStore().read();if(!firstPatrolBriefingEligible(record))return false;
  if(doc.querySelector?.('dialog[open],.cw-oath'))return false;
  mount();city.stop();status.textContent='';accept.disabled=false;if(!dialog.open)dialog.showModal();accept.focus?.({preventScroll:true});return true;
 }
 function begin(){
  if(starting)return;starting=true;accept.disabled=true;status.textContent='Issuing the duty sheet…';dialog.close();
  schedule(()=>{
   let started=false;
   try{started=patrolDuty.start(FIRST_PATROL_ROUTE,{fromWatchHouse:true});}catch{}
   if(started){
    const saved=saveFirstPatrolBriefing({makeStore});
    if(!saved)city.tell('Your patrol has begun. Use Save game before closing this tab.');
    globalThis.window?.CWRecruitGuide?.pause?.();
    starting=false;return;
   }
   starting=false;status.textContent='The duty sheet could not be issued. Your save is unchanged; try again.';accept.disabled=false;if(!dialog.open)dialog.showModal();
  });
 }
 return {start,report:()=>({eligible:firstPatrolBriefingEligible(makeStore().read()),open:!!dialog?.open,starting,route:FIRST_PATROL_ROUTE})};
}
