import {dutyTime} from '../city-clock.mjs?v=game-time';

// Quill's five-grade lodging rules, transacted through the existing campaign record.
// These are original game values, not canonical Ankh-Morpork tariffs.
export const lodgingGrades=Object.freeze([
 {grade:0,label:'Watch House bunk',nightly:0,weekly:0,recovery:.25,slots:0},
 {grade:1,label:'Common lodging bed',nightly:1,weekly:5,recovery:.35,slots:4},
 {grade:2,label:'Plain private room',nightly:2,weekly:10,recovery:.5,slots:8},
 {grade:3,label:'Respectable inn room',nightly:4,weekly:22,recovery:.75,slots:16},
 {grade:4,label:'Fine hotel suite',nightly:7,weekly:40,recovery:1,slots:24}
].map(Object.freeze));
export const storableItems=Object.freeze(['Bandages','Strong coffee']);
const copy=v=>JSON.parse(JSON.stringify(v));
const integer=n=>Number.isSafeInteger(n)&&n>=0;
function validRecord(v){return v?.schema===1&&integer(v.revision)&&v.state&&integer(v.state.coins)&&integer(v.state.night)&&Number.isFinite(v.state.hp)&&Number.isFinite(v.state.maxhp)&&v.state.maxhp>0&&Array.isArray(v.state.items)&&v.state.flags&&typeof v.state.flags==='object'&&!Array.isArray(v.state.flags);}
function blank(){return {schema:1,grade:0,paidThrough:0,paidRateUnits:0,creditUnits:0,trunk:[]};}
function validLodging(l){return l?.schema===1&&integer(l.grade)&&l.grade<5&&integer(l.paidThrough)&&integer(l.paidRateUnits)&&integer(l.creditUnits)&&Array.isArray(l.trunk)&&l.trunk.every(i=>storableItems.includes(i))&&(!l.paidPeriods||Array.isArray(l.paidPeriods)&&l.paidPeriods.every((p,i,a)=>integer(p.from)&&integer(p.through)&&p.through>p.from&&integer(p.rateUnits)&&(!i||p.from>=a[i-1].through))&&l.paidPeriods.at(-1)?.through===l.paidThrough);}
function unusedValue(l,night){return l.paidPeriods?l.paidPeriods.reduce((sum,p)=>sum+Math.max(0,p.through-Math.max(night,p.from))*p.rateUnits,0):Math.max(0,l.paidThrough-night)*l.paidRateUnits;}

export function lodgingState(v){if(!validRecord(v))throw Error('Invalid campaign record');const stored=v.state.flags.lodging;if(stored!==undefined&&!validLodging(stored))return {valid:false,reason:'invalid-lodging'};const l=copy(stored||blank()),active=l.grade>0&&l.paidThrough>v.state.night;return {...l,valid:true,active,remainingNights:active?l.paidThrough-v.state.night:0,slots:active?lodgingGrades[l.grade].slots:0,overflow:active?Math.max(0,l.trunk.length-lodgingGrades[l.grade].slots):0};}
function fail(v,reason){return {ok:false,reason,record:copy(v)};}
export function restBlocked(v){
 if(v.pending)return 'encounter-active';
 // Current live pursuits use pending.chase. Recognise explicit future task holds
 // conservatively rather than allowing lodging to skip a timed job or escort.
 const f=v.state.flags;
 if(f.activeEscort||f.prisonerEscort||f.timedWork||f.activeEmergency)return 'duty-active';
 // The unified patrol record is authoritative. Legacy saves can retain the old
 // `patrolling` boolean after their round has ended, while unpaid current rounds
 // have no shift number and must still be completed before resting.
 if(f.p21PatrolRounds?.active)return 'patrol-active';
 return null;
}
function checked(v,revision){if(!validRecord(v))throw Error('Invalid campaign record');if(revision!==v.revision)return 'stale-quote';if(v.pending)return 'encounter-active';if(!lodgingState(v).valid)return 'invalid-lodging';return null;}
export function nextDutyTime(v,now=Date.now()){
 if(!Number.isFinite(now))throw Error('Invalid time');
 const f=v.state.flags,date=dutyTime(v.state,now);
 const hour=f.watchShiftClock?21:f.dutyShift==='night'||f.assignedShift==='night'||f.nightShift===true?18:6;
 const wake=new Date(date);wake.setHours(hour,0,0,0);if(wake.getTime()<=date.getTime())wake.setDate(wake.getDate()+1);
 return {at:wake.getTime(),hour,offsetMs:wake.getTime()-now};
}
export function quoteRoom(v,grade,nights=1,now=Date.now()){
 if(!validRecord(v))throw Error('Invalid campaign record');
 const g=lodgingGrades[grade],l=lodgingState(v);if(!g||!Number.isInteger(grade)||![1,7].includes(nights))return {ok:false,reason:'invalid-room'};if(!l.valid)return {ok:false,reason:l.reason};
 const price=grade===0?0:nights===7?g.weekly:g.nightly;
 // Weekly prices divide into seventh-coin ledger units. Unused value and any
 // rounding remainder stay as credit; changing rooms cannot silently eat it.
 const renewing=grade>0&&l.active&&l.grade===grade,availableUnits=l.creditUnits+(renewing?0:unusedValue(l,v.state.night));
 const charge=grade===0?0:Math.max(0,Math.ceil((price*7-availableUnits)/7));
 return {ok:true,revision:v.revision,grade,label:g.label,nights,price,charge,creditUnits:availableUnits,creditCoins:availableUnits/7,remainingCreditUnits:grade===0?availableUnits:availableUnits+charge*7-price*7,paidThrough:grade===0?v.state.night:(renewing?l.paidThrough:v.state.night)+nights,recovery:g.recovery,recoveryHP:Math.min(v.state.maxhp-v.state.hp,Math.ceil(v.state.maxhp*g.recovery)),slots:g.slots,stored:l.trunk.length,canAfford:v.state.coins>=charge,nextDuty:nextDutyTime(v,now),storageItems:[...storableItems]};
}
export function rentRoom(v,grade,nights=1,revision=v?.revision,now=Date.now()){
 const error=checked(v,revision);if(error)return fail(v,error);if(grade===0)return fail(v,'free-bunk');
 const q=quoteRoom(v,grade,nights,now);if(!q.ok)return fail(v,q.reason);if(!q.canAfford)return fail(v,'funds');
 const record=copy(v),previous=lodgingState(v);
 record.state.coins-=q.charge;
 const renewing=previous.active&&previous.grade===grade,from=renewing?previous.paidThrough:v.state.night;
 const retained=renewing?(previous.paidPeriods||[{from:v.state.night,through:previous.paidThrough,rateUnits:previous.paidRateUnits}]).filter(p=>p.through>v.state.night):[];
 record.state.flags.lodging={schema:1,grade,paidThrough:q.paidThrough,paidRateUnits:q.price*7/nights,paidPeriods:[...retained,{from,through:q.paidThrough,rateUnits:q.price*7/nights}],creditUnits:q.remainingCreditUnits,trunk:previous.trunk};
 return {ok:true,record,receipt:{effect:'rent',grade,label:q.label,price:q.price,charged:q.charge,creditedUnits:q.creditUnits,remainingCreditUnits:q.remainingCreditUnits,paidThrough:q.paidThrough,nights}};
}
export function restRoom(v,grade=0,revision=v?.revision,now=Date.now()){
 const error=checked(v,revision)||restBlocked(v);if(error)return fail(v,error);const g=lodgingGrades[grade];if(!g||!Number.isInteger(grade))return fail(v,'invalid-room');
 const l=lodgingState(v);if(grade>0&&(!l.active||l.grade!==grade))return fail(v,'rent-expired');
 const record=copy(v),s=record.state,duty=nextDutyTime(v,now),before=s.hp;s.hp=Math.min(s.maxhp,s.hp+Math.ceil(s.maxhp*g.recovery));
 if(Number.isFinite(s.resolve)&&Number.isFinite(s.maxresolve))s.resolve=Math.min(s.maxresolve,s.resolve+Math.ceil(s.maxresolve*g.recovery));
 if(Number.isFinite(s.fatigue))s.fatigue=0;if(Number.isFinite(s.flags.fatigue))s.flags.fatigue=0;
 if(s.flags.watchShiftClock){s.flags.watchShiftClock={...s.flags.watchShiftClock,onDuty:false,at:duty.at,real:now};}else{s.night++;s.flags.preDutyClock={at:duty.at,real:now};}s.flags.lastLodgingRest={grade,at:now,nextDutyAt:duty.at,night:s.night};
 return {ok:true,record,receipt:{effect:'rest',grade,hpRestored:s.hp-before,night:s.night,nextDutyAt:duty.at,shiftHour:duty.hour,coinsCharged:0}};
}
export function depositItem(v,item,revision=v?.revision){
 const error=checked(v,revision);if(error)return fail(v,error);const l=lodgingState(v);if(!l.active)return fail(v,'rent-expired');if(!storableItems.includes(item))return fail(v,'not-storable');if(l.trunk.length>=l.slots)return fail(v,'storage-full');const index=v.state.items.indexOf(item);if(index<0)return fail(v,'not-owned');
 const record=copy(v);record.state.items.splice(index,1);record.state.flags.lodging.trunk.push(item);return {ok:true,record,receipt:{effect:'deposit',item}};
}
export function retrieveItem(v,item,revision=v?.revision){
 const error=checked(v,revision);if(error)return fail(v,error);const l=lodgingState(v);if(!l.active)return fail(v,'rent-expired');const index=l.trunk.indexOf(item);if(index<0)return fail(v,'not-stored');const cap=item==='Bandages'?6:2;if(v.state.items.filter(i=>i===item).length>=cap)return fail(v,'capacity');
 const record=copy(v);record.state.flags.lodging.trunk.splice(index,1);record.state.items.push(item);return {ok:true,record,receipt:{effect:'retrieve',item}};
}
