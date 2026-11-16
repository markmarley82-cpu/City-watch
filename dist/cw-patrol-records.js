/* Read-only Notebook view of saved native patrol enquiries. No reward or save writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CWPatrolRecords=api;})(globalThis,function(){
 'use strict';
 const list=value=>Array.isArray(value)?value:[];
 const openingTitle='The stolen purse';
 const openingLeads='Check the trader’s stall in the western yard, or speak to the woman packing up farther along that side of Watch Square.';
 function view(state={},definitions=[]){
  const rounds=state.flags?.p21PatrolRounds,cases=[],evidence=[],witnesses=[],timeline=[];
  if(rounds?.schema!==1)return {cases,evidence,witnesses,timeline};
  function entry(enquiry,status,checkpoint,round){
   if(!enquiry||!enquiry.snapshot?.title)return;
   const title=enquiry.snapshot.title,ids=new Set(list(enquiry.clueIds));
   const definition=list(enquiry.snapshot.variants).length?enquiry.snapshot:list(definitions).find(c=>c.id===enquiry.caseId);
   const variant=list(definition?.variants).find(v=>v.id===enquiry.variantId);
   // Only recorded observations are exposed; no uncollected clue or hidden finding.
   const clues=list(enquiry.observations||variant?.clues).filter(c=>ids.has(c.id)&&typeof c.text==='string');
   const where=checkpoint.name||round.name||'Patrol checkpoint',filed=status==='filed',prepared=status==='prepared';
   let description,extra;
   if(filed){description='Filed · '+(enquiry.outcome==='supported'?'finding supported':'unresolved')+' · '+(Number(enquiry.meritAwarded)||0)+' merit';extra=enquiry.reportText||'Report recorded.';}
   else if(prepared){description='Prepared · awaiting report to Colon';extra=enquiry.reportText||'Your observations are saved.';}
   else{description='Investigating · '+ids.size+'/'+(variant?.clues?.length||2)+' observations';extra=!ids.size?'Inspect the scene and question witnesses at this checkpoint.':ids.size<2?'Compare the remaining account or observation before choosing a finding.':'Review the observations and choose a finding, or prepare an unresolved report.';}
   if(!filed&&enquiry.caseId==='CW-OPENING-PURSE'){
    extra=prepared||enquiry.interview?'Take your findings to Sergeant Colon outside the Watch House.':
     ids.has('trace')&&ids.has('witness')?'Find the suspect in Watch Square and ask about the torn clothing.':
     ids.has('trace')?'You checked the purse hook. The woman packing up farther along the western side of Watch Square may have seen the theft.':
     ids.has('witness')?'You spoke to the witness. Check the purse hook at the trader’s stall in the western yard.':openingLeads;
   }else if(!filed)extra+=' '+(prepared?'Finish the remaining checkpoints, then return to Sergeant Colon.':'Continue through Night duty or your current assignment.')+' No enquiry merit is awarded before filing.';
   if(enquiry.requestedAction)extra+=' Response requested; completion has not been confirmed.';
   cases.push({title,description,extra:where+' · '+extra});
   for(const clue of clues){const row={title,description:clue.text,extra:where+' · '+(clue.method==='inspect'?'Scene observation':'Recorded local account')};evidence.push(row);if(clue.method==='question_or_compare')witnesses.push(row);}
   if(enquiry.interview){
    const row={title,description:enquiry.interview,extra:'Watch Square · Suspect interview'};
    evidence.push(row);
   }
   if(prepared||filed)timeline.push({title,description:description,extra:where+' · '+(enquiry.reportText||'Observations recorded.')+(enquiry.requestedAction?' Response requested; completion has not been confirmed.':'')});
  }
  const active=rounds.active;
  const delivery=rounds.deliveryReport||(active?.routeId==='missing-night-delivery'?active:null);
  if(delivery){
   const title='The Missing Night Delivery',filed=delivery===rounds.deliveryReport;
   const description=filed?'Filed with Captain Carrot · '+delivery.merit+' merit':delivery.outcome?'Prepared · awaiting Captain Carrot':'Investigating · '+list(delivery.observations).length+'/3 leads';
   const extra=delivery.text||delivery.outcomeText||'Review Carrot’s assignment for the carter, dispatch ledger and baker.';
   cases.push({title,description,extra});
   if(filed)timeline.push({title,description,extra});
   for(const item of list(delivery.observations)){
    const row={title,description:item.text,extra:item.location};evidence.push(row);if(item.witness)witnesses.push(row);
   }
  }
  const followup=rounds.dimwellFollowup;
  if(followup?.text){
   const row={title:'Dimwell shopkeeper follow-up',description:followup.text,extra:followup.stage==='search'?'Next: Check the Park Lane approach.':followup.stage==='confirm'?'Next: Speak to the shopkeeper at the Wharfinger road bend.':'Follow-up recorded'};
   cases.push(row);
   if(followup.stage==='closed')timeline.push(row);
  }else if(rounds.dimwellCallsSource||list(rounds.reports).some(r=>r.routeId==='dimwell-beat'&&['stayed','caught','split','broke'].includes(r.dimwellCalls))){
   cases.push({title:'Dimwell shopkeeper follow-up',description:'Check in on a later paid shift',extra:'Speak to the shopkeeper at the Wharfinger road bend.'});
  }
  if(active?.routeId==='watch-square-purse'&&active.index===0&&!active.enquiry)
   cases.unshift({title:openingTitle,description:'Open · no observations yet',extra:openingLeads});
  if(active){if(active.enquiry)entry(active.enquiry,'investigate',list(active.checkpoints)[active.index]||{},active);for(const check of list(active.visits))if(check.enquiry)entry(check.enquiry,'prepared',check,active);}
  for(const round of list(rounds.reports).slice().reverse())for(const check of list(round.checkpoints))if(check.enquiry)entry(check.enquiry,'filed',check,round);
  return {cases,evidence,witnesses,timeline};
 }
 return Object.freeze({view});
});
