// Only investigations with existing campaign actions can publish playable referrals.
// Newspaper copy never becomes an evidence item, a verdict or a reward.
export const CAMPAIGN_CASES=Object.freeze([
  Object.freeze({caseId:'P21-LEDGER',title:'The missing guild ledger',contactId:'colon'}),
  Object.freeze({caseId:'P21-DELIVERY',title:'The guild break-ins',contactId:'vimes'}),
  Object.freeze({caseId:'P21-PATROL',title:'The reported assaults',contactId:'vimes'})
]);
export function activeNewspaperCase(state){
  if(!Number.isSafeInteger(state?.chapter)||state.chapter<0||!Number.isSafeInteger(state?.stage)||state.stage<0)return null;
  if(state.chapter===2&&state.stage>=4)return null;
  return CAMPAIGN_CASES[state.chapter]||null;
}
export function campaignNewspaperContext(state){
  const active=activeNewspaperCase(state);
  const closed=CAMPAIGN_CASES.filter((_,i)=>Number.isSafeInteger(state?.chapter)&&(i<state.chapter||i===2&&state.chapter===2&&state.stage>=4));
  return {availableCases:active?[active.caseId]:[],closedCases:closed.map(x=>x.caseId),
    publicTips:active?[active.caseId+':tip']:[],publicReports:closed.map(x=>x.caseId+':public-summary')};
}
export function canFollowNewspaperLead(lead,record){
  const active=activeNewspaperCase(record?.state);
  return !!active&&!record.pending&&lead?.caseId===active.caseId&&lead.contactId===active.contactId&&
    lead.kind==='public-contact-referral'&&lead.status==='unverified'&&lead.evidence===false;
}
