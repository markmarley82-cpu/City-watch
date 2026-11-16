import {lodgingGrades,storableItems,lodgingState,quoteRoom,rentRoom,restRoom,depositItem,retrieveItem,restBlocked} from './lodging-core.mjs?v=game-time';
import {commitPurchase} from './shop-transactions.mjs?v=p21-b407-s039-reuse';

const errors={
 'funds':'You do not have enough coins. Nothing was charged.',
 'stale-quote':'Your purse or belongings changed. Choose the action again to review the new details.',
 'encounter-active':'Finish the current incident before renting, resting or using storage.',
 'duty-active':'An emergency, escort or timed duty needs your attention. You cannot rest yet.',
 'patrol-active':'Finish the active patrol before resting.',
 'rent-expired':'The paid room is not available. Your stored belongings are safe; renew any paid room or use the free Watch bunk.',
 'capacity':'Your supply pouch is full. The stored item is safe in your trunk.',
 'room-away':'Walk to this room before resting.',
 'storage-away':'Visit your currently rented room to use its private trunk. Choose that room grade and Walk to room.',
 'storage-full':'Your private trunk is full. Take something out before putting more away.',
 'not-storable':'Only bandages and strong coffee go in this trunk. Evidence and Watch equipment stay with you.',
 'not-owned':'That item is no longer in your carried supplies.',
 'not-stored':'That item is no longer in your trunk.',
 'invalid-lodging':'The saved room record needs recovery. Your purse and belongings have not been changed.',
 'save-failed':'The change could not be saved. Your coins and belongings are unchanged. Try again.',
 'invalid-room':'That room is not available.',
 'free-bunk':'The Watch bunk is always free; choose Rest until next duty.'
};
const when=at=>new Date(at).toLocaleString(undefined,{weekday:'short',hour:'2-digit',minute:'2-digit'});
const coins=n=>n+' coin'+(n===1?'':'s');
const count=(items,item)=>items.filter(i=>i===item).length;

// The room directory names the registered district lodging. Other premises may
// share its room grade; their insertion order must not redirect this walk.
export function lodgingDoor(world,grade){
 const doors=world?.doors;
 if(grade===0)return doors?.get('watch');
 const registered=doors?.get('service:lodging:'+grade);
 if(registered&&!registered.held&&Number(registered.lodging_grade)===grade)return registered;
 return [...(doors?.values?.()||[])].find(d=>!d.held&&Number(d.lodging_grade)===grade);
}

export function mountLodgingView({root,makeStore,city,assetRoot='assets/city-services-b97/',placements=[],onChange=()=>{}}){
 if(!root||typeof makeStore!=='function')throw Error('A lodging panel and campaign store are required');
 const doc=root.ownerDocument,make=(tag,text)=>{const n=doc.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 root.replaceChildren();root.classList.add('lodging-live');
 const label=make('label','Room grade '),choose=make('select');choose.setAttribute('aria-label','Choose room grade');choose.style.cssText='max-width:100%;min-height:44px;background:#e8d6b4;color:#302319;padding:8px';label.className='lodging-select';label.append(choose);
 for(const g of lodgingGrades)choose.add(new Option(g.grade+' · '+g.label,String(g.grade)));
 const title=make('h3'),figure=make('figure'),image=make('img'),caption=make('figcaption');figure.style.cssText='margin:8px 0;background:#252c27;border:1px solid #69583f;padding:6px';image.style.cssText='display:block;width:100%;max-height:240px;object-fit:contain;background:#141814';figure.append(image,caption);
 const summary=make('p'),balance=make('p'),tenancy=make('p'),access=make('p'),actions=make('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:8px';
 const one=make('button','Rent one night'),week=make('button','Rent seven nights'),walk=make('button','Walk to room'),rest=make('button','Rest until next duty');for(const b of [one,week,walk,rest]){b.type='button';b.style.minHeight='44px';actions.append(b);}
 const confirmation=make('section');confirmation.hidden=true;confirmation.setAttribute('aria-label','Confirm lodging choice');confirmation.style.cssText='margin:12px 0;padding:12px;border:1px solid #ac9164;background:#dfc99e;color:#342519';
 const confirmText=make('p'),confirm=make('button','Confirm'),cancel=make('button','Cancel');confirmText.id='cw-lodging-confirm-details';confirm.setAttribute('aria-describedby',confirmText.id);confirm.type=cancel.type='button';cancel.style.marginLeft='8px';confirmation.append(confirmText,confirm,cancel);
 const storage=make('details'),storageTitle=make('summary','Private trunk'),storageInfo=make('p'),storageActions=make('div');storageActions.style.cssText='display:grid;gap:8px';storage.append(storageTitle,storageInfo,storageActions);
 const status=make('p');status.setAttribute('role','status');status.style.cssText='min-height:2.8em;font-weight:bold';
 const boundary=make('p','Room prices and recovery are the same for every recruit. Evidence, prisoners and Watch equipment stay with you.');boundary.className='services-boundary';
 root.append(label,title,figure,summary,balance,tenancy,access,actions,confirmation,storage,status,boundary);
 let selected=0,prepared=null,busy=false,lastSignature='';
 function read(){return makeStore().read();}
 function doorway(grade=selected){return lodgingDoor(city?.world,grade);}
 function atRoom(grade=selected){const d=city?.nearDoor?.();return grade===0?d?.game_id==='watch':d?.lodging_grade===grade;}
 function clearConfirmation(){prepared=null;confirmation.hidden=true;confirm.disabled=false;}
 function dismiss(){if(prepared)status.textContent='';clearConfirmation();}
 root.closest('dialog')?.addEventListener('close',dismiss);
 function error(reason){return errors[reason]||'The change could not be completed. Your coins and belongings are unchanged.';}
 function refresh(force=false){
  const record=read(),signature=[record.revision,selected,city?.nearDoor?.()?.game_id||'',Math.floor(Date.now()/60000)].join(':');if(!force&&signature===lastSignature)return;lastSignature=signature;
  if(prepared&&prepared.revision!==record.revision){clearConfirmation();status.textContent=error('stale-quote');}
  const grade=lodgingGrades[selected],place=placements.find(p=>p.grade===selected),room=lodgingState(record),q=quoteRoom(record,selected,1),blocked=restBlocked(record);
  choose.value=String(selected);title.textContent=grade.label;
  if(place){image.src=assetRoot+'lodging-'+place.room+'.webp';image.alt=grade.label+' interior';caption.textContent=place.area;}else{image.removeAttribute('src');image.alt='';caption.textContent=grade.label;}
  summary.textContent=(selected===0?'Always free.':coins(grade.nightly)+' per night · '+coins(grade.weekly)+' for seven nights.')+' Rest restores '+Math.round(grade.recovery*100)+'% of maximum health, capped at full health. '+(grade.slots?grade.slots+' private storage slots.':'No private trunk.');
  balance.textContent='Purse: '+coins(record.state.coins)+' · Health '+record.state.hp+'/'+record.state.maxhp+(q.ok?' · Next duty: '+when(q.nextDuty.at):'');
  tenancy.textContent=!room.valid?error(room.reason):room.active?'Current room: '+lodgingGrades[room.grade].label+' · '+room.remainingNights+' paid night'+(room.remainingNights===1?'':'s')+' left · '+room.trunk.length+'/'+room.slots+' stored.':room.trunk.length?'Rent has expired. Your '+room.trunk.length+' stored item'+(room.trunk.length===1?' is':'s are')+' safe; renew any paid room to reopen the trunk.':'No paid room. The free Watch bunk is always available.';
  one.hidden=week.hidden=selected===0;one.disabled=week.disabled=!!record.pending||!room.valid;
  walk.disabled=!doorway();walk.textContent=selected===0?'Walk to Watch bunk':'Walk to room';access.textContent=atRoom()?'You are at this room’s entrance.':'Walk to this room before resting. Reservations can be made here.';
  rest.disabled=!!blocked||!room.valid||!atRoom()||(selected>0&&(!room.active||room.grade!==selected));
  rest.title=blocked?error(blocked):!atRoom()?error('room-away'):selected>0&&(!room.active||room.grade!==selected)?'Rent this room before resting.':'';
  storageInfo.textContent=!room.valid?error(room.reason):!room.active?(room.trunk.length?'Your belongings are kept safely. Renew any paid room to retrieve them.':'A paid room provides private storage.'):room.trunk.length+' of '+room.slots+' slots used.'+(!atRoom(room.grade)?' Visit your '+lodgingGrades[room.grade].label.toLowerCase()+' to use this trunk.':'')+(room.overflow?' This smaller room has '+room.overflow+' extra stored items; take items out before storing more.':'');
  storageActions.replaceChildren();
  for(const item of storableItems){
   const row=make('div'),description=make('p',item+' · carried '+count(record.state.items,item)+' · stored '+count(room.trunk||[],item)),put=make('button','Store one '+item.toLowerCase()),take=make('button','Take one '+item.toLowerCase());put.type=take.type='button';take.style.marginLeft='8px';
   put.disabled=!room.valid||!room.active||!atRoom(room.grade)||!!record.pending||!record.state.items.includes(item)||room.trunk.length>=room.slots;
   take.disabled=!room.valid||!room.active||!atRoom(room.grade)||!!record.pending||!room.trunk.includes(item);
   put.onclick=()=>prepare('deposit',item);take.onclick=()=>prepare('retrieve',item);row.append(description,put,take);storageActions.append(row);
  }
 }
 function prepare(kind,value){
  if(busy)return;const record=read(),room=lodgingState(record),now=Date.now(),nights=kind==='rent'?value:1,q=quoteRoom(record,selected,nights,now);
  if(record.pending){status.textContent=error('encounter-active');return;}if(!room.valid){status.textContent=error(room.reason);return;}
  if(!q.ok){status.textContent=error(q.reason);return;}
  const storageChange=kind==='deposit'||kind==='retrieve';if(storageChange&&(!room.active||!atRoom(room.grade))){status.textContent=error(!room.active?'rent-expired':'storage-away');return;}
  prepared={kind,value,grade:storageChange?room.grade:selected,revision:record.revision,now};
  if(kind==='rent'){
   confirmText.textContent='Rent '+q.label+' for '+value+' night'+(value===1?'':'s')+'? Pay '+coins(q.charge)+' now'+(q.creditUnits>0?' after credit for unused rent':'')+'. Purse after payment: '+coins(record.state.coins-q.charge)+'. '+Math.round(q.recovery*100)+'% health recovery when you rest · '+q.slots+' storage slots. Next duty: '+when(q.nextDuty.at)+'.';
   confirm.disabled=!q.canAfford;confirm.textContent='Confirm · pay '+coins(q.charge);if(!q.canAfford)status.textContent=error('funds');else status.textContent='';
  }else if(kind==='rest'){
   const block=restBlocked(record)||(!atRoom()?'room-away':null);if(block){prepared=null;status.textContent=error(block);return;}
   confirmText.textContent='Rest in the '+q.label.toLowerCase()+' until '+when(q.nextDuty.at)+'? Recover up to '+q.recoveryHP+' health. No coins are charged. This begins the next duty period; your current case stays in the casebook.';confirm.textContent='Confirm rest';confirm.disabled=false;status.textContent='';
  }else{
   confirmText.textContent=(kind==='deposit'?'Put one ':'Take one ')+value.toLowerCase()+(kind==='deposit'?' into your private trunk?':' out of your private trunk?')+' No coins are charged.';confirm.textContent=kind==='deposit'?'Confirm storage':'Confirm collection';confirm.disabled=false;status.textContent='';
  }
  confirmation.hidden=false;confirmation.scrollIntoView({block:'nearest'});confirm.focus({preventScroll:true});
 }
 one.onclick=()=>prepare('rent',1);week.onclick=()=>prepare('rent',7);walk.onclick=()=>{
  const d=doorway();if(!d)return;
  clearConfirmation();
  if(!city.nav(d.position,d.edge)){status.textContent='No open route reaches this room right now. Try again or choose another room.';return;}
  root.closest('dialog')?.close();city.tell('Walking to '+lodgingGrades[selected].label+'. Use Enter at the doorway.');
 };rest.onclick=()=>prepare('rest');cancel.onclick=()=>{clearConfirmation();status.textContent='Cancelled. Nothing was changed.';};
 confirm.onclick=()=>{
  if(busy||!prepared)return;const action=prepared;prepared=null;if(action.kind==='rest'&&!atRoom(action.grade)){clearConfirmation();status.textContent=error('room-away');return;}if(action.kind==='deposit'||action.kind==='retrieve'){const currentRoom=lodgingState(read());if(!currentRoom.valid||!currentRoom.active||currentRoom.grade!==action.grade||!atRoom(currentRoom.grade)){clearConfirmation();status.textContent=error('storage-away');return;}}busy=true;confirm.disabled=true;
  try{
   const result=commitPurchase({store:makeStore(),revision:action.revision,change:record=>action.kind==='rent'?rentRoom(record,action.grade,action.value,action.revision,action.now):action.kind==='rest'?restRoom(record,action.grade,action.revision,action.now):action.kind==='deposit'?depositItem(record,action.value,action.revision):retrieveItem(record,action.value,action.revision)});
   if(!result.ok){status.textContent=error(result.reason);return;}
   const receipt=result.receipt;
   status.textContent=receipt.effect==='rent'?receipt.label+' rented and saved · '+coins(receipt.charged)+' charged.':receipt.effect==='rest'?'Rest saved · '+receipt.hpRestored+' health restored. Your next duty starts '+when(receipt.nextDutyAt)+'.':receipt.effect==='deposit'?receipt.item+' stored and saved.':receipt.item+' returned to your carried supplies.';
   try{city?.update?.();onChange(result);}catch{/* The canonical save already succeeded; do not misreport it as failed. */}
  }catch{status.textContent=error('save-failed');}
  finally{busy=false;clearConfirmation();refresh(true);}
 };
 choose.onchange=()=>{selected=Number(choose.value);clearConfirmation();status.textContent='';refresh(true);};
 refresh(true);
 return Object.freeze({refresh,dismiss,select(grade){if(!lodgingGrades[grade])return false;selected=grade;clearConfirmation();status.textContent='';refresh(true);return true;},root,report:()=>({selectedGrade:selected,confirmationPending:!!prepared,storageWhitelist:[...storableItems]})});
}
