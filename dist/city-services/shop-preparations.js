/* Original game balance candidate. Pure transitions; host persists via its existing
 * campaign transaction before enabling sales. No browser/storage side effects. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.QuillShopPreparations=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const copy = value => JSON.parse(JSON.stringify(value));
const offers = Object.freeze({
  'prep-hearty-meal':Object.freeze({id:'prep-hearty-meal',shopKey:'provisions',label:'Hearty meal',price:3,kind:'guard',benefit:'The first Guard reduces the next opposing response by one extra stamina, until control passes to the next Watch officer. Guard reduction is capped at 3.',use:'A little extra staying power while bracing; no health recovery is bundled with this option.'}),
  'prep-voice-lozenge':Object.freeze({id:'prep-voice-lozenge',shopKey:'apothecary',label:'Soothing lozenge',price:2,kind:'voice',benefit:'The recruit’s first successful Talk action removes 1 extra resolve.',use:'Help a recruit who chooses to talk a suspect down. The normal action cost and separate arrest action still apply.'}),
  'prep-boot-fitting':Object.freeze({id:'prep-boot-fitting',shopKey:'cobbler',label:'Boot fitting',price:3,kind:'footwork',benefit:'One extra legal movement step on the recruit’s opening turn in grid or street combat.',use:'Reach a speaking or restraint position; no extra action or city/chase speed bonus.'})
});
const kinds = new Set(Object.values(offers).map(offer=>offer.kind));
const spec = id => typeof id==='string'&&Object.hasOwn(offers,id)?offers[id]:null;
const validPreparation = p => !!p&&p.schema===1&&!!spec(p.offerId)&&kinds.has(p.kind)&&spec(p.offerId).kind===p.kind&&Number.isSafeInteger(p.night)&&p.night>=0;
function validRecord(v){return v?.schema===1&&Number.isSafeInteger(v.revision)&&v.state&&Number.isSafeInteger(v.state.coins)&&v.state.coins>=0&&Number.isSafeInteger(v.state.night)&&v.state.night>=0&&v.state.flags&&typeof v.state.flags==='object'&&!Array.isArray(v.state.flags);}
function fail(v,reason){return {ok:false,reason,record:copy(v)};}
function purchase(v,id,expectedRevision=v?.revision){
  if(!validRecord(v))throw Error('Invalid campaign record');
  if(expectedRevision!==v.revision)return fail(v,'stale-quote');
  const offer=spec(id);if(!offer)return fail(v,'unknown-offer');
  if(v.pending)return fail(v,'encounter-active');
  const queued=v.state.flags.shopPreparation;
  if(queued&&!validPreparation(queued))return fail(v,'invalid-preparation');
  if(queued?.night===v.state.night)return fail(v,'already-prepared');
  if(v.state.coins<offer.price)return fail(v,'funds');
  const record=copy(v);record.state.coins-=offer.price;
  record.state.flags.shopPreparation={schema:1,offerId:id,kind:offer.kind,night:record.state.night};
  return {ok:true,record,receipt:{offerId:id,price:offer.price,night:record.state.night}};
}
function bind(v,input){
  if(!validRecord(v))throw Error('Invalid campaign record');
  const record=copy(v),battle=copy(input),pending=record.pending;
  if(!pending?.id||typeof pending.id!=='string')return {ok:false,reason:'campaign-encounter-required',record,battle};
  const marker=pending.shopPreparation;
  if(marker){
    // A saved encounter owns its preparation. Never reconstruct spent counters.
    return {ok:!!battle.shopPreparation&&battle.shopPreparation.encounterId===pending.id,reason:'resume',record,battle};
  }
  const queued=record.state.flags.shopPreparation;
  if(!queued)return {ok:false,reason:'none',record,battle};
  if(!validPreparation(queued))return {ok:false,reason:'invalid-preparation',record,battle};
  if(queued.night!==record.state.night){delete record.state.flags.shopPreparation;return {ok:false,reason:'expired',record,battle};}
  // Do not apply a preparation retroactively to a battle that already started.
  if(pending.battle)return {ok:false,reason:'battle-already-started',record,battle};
  const actor=battle.actors?.find(a=>a.id==='officer');
  if(battle.phase!=='battle'||actor?.team!=='watch'||actor.status!=='active')return {ok:false,reason:'recruit-unavailable',record,battle};
  if(queued.kind==='footwork'&&(battle.mode==='classic'||battle.actors[battle.turn]?.id!=='officer'))return {ok:false,reason:'opening-move-unavailable',record,battle};
  const prep={...queued,encounterId:pending.id,remaining:queued.kind==='footwork'?0:1,guardActive:false};
  if(queued.kind==='footwork')battle.budget.move+=1;
  battle.shopPreparation=prep;pending.shopPreparation={offerId:queued.offerId,encounterId:pending.id};
  delete record.state.flags.shopPreparation;
  pending.battle=copy(battle);
  return {ok:true,record,battle};
}
function restoreGuard(s){
  const p=s.shopPreparation,a=s.actors?.find(a=>a.id==='officer');
  if(!p?.guardActive||!a)return;
  if(p.guardBase===null)delete a.guardReduction;else a.guardReduction=p.guardBase;
  delete a.preparationGuardReduction;p.guardActive=false;delete p.guardBase;
}
function bridge(core){
  function eligible(s,kind){return s.phase==='battle'&&core.current(s)?.id==='officer'&&validPreparation(s.shopPreparation)&&s.shopPreparation.kind===kind&&s.shopPreparation.remaining===1;}
  function withVoice(s,fn){const a=core.current(s),before=a.talkBonus;a.talkBonus=(Number.isFinite(before)?before:0)+1;try{return fn();}finally{if(before===undefined)delete a.talkBonus;else a.talkBonus=before;}}
  function previewAction(s,type,target){
    if(type==='talk'&&eligible(s,'voice'))return withVoice(s,()=>core.previewAction(s,type,target));
    if(type==='defend'&&eligible(s,'guard')){
      const result=core.previewAction(s,type,target),a=core.current(s),base=core.guardReduction?core.guardReduction(a):a.guardReduction||2,reduction=Math.max(base,Math.min(3,base+1));
      return result.available?{...result,text:'Guard: incoming 4 → '+Math.max(1,4-reduction)+' until the next Watch officer’s turn'}:result;
    }
    return core.previewAction(s,type,target);
  }
  function act(s,type,target){
    if(core.availability(s,type,target))return core.act(s,type,target);
    if(type==='talk'&&eligible(s,'voice')){const result=withVoice(s,()=>core.act(s,type,target));if(result.ok)s.shopPreparation.remaining=0;return result;}
    if(type==='defend'&&eligible(s,'guard')){
      const p=s.shopPreparation,a=core.current(s);p.guardBase=a.guardReduction??null;
      const base=core.guardReduction?core.guardReduction(a):a.guardReduction||2;a.preparationGuardReduction=Math.max(base,Math.min(3,base+1));a.guardReduction=a.preparationGuardReduction;
      const result=core.act(s,type,target);
      if(result.ok){p.remaining=0;p.guardActive=true;}else{p.guardActive=true;restoreGuard(s);}
      return result;
    }
    return core.act(s,type,target);
  }
  function endTurn(s){const result=core.endTurn(s);if(result.ok)restoreGuard(s);return result;}
  function finish(s){restoreGuard(s);if(s.shopPreparation){s.shopPreparation.remaining=0;s.shopPreparation.expired=true;}return s;}
  return {previewAction,act,endTurn,finish};
}
return {offers,purchase,bind,bridge,validPreparation};
});
