// The newspaper receives only public case facts, never the evidence list or witnesses.
export const BRIDGE_CASE='CW-NC-01';
export const BRIDGE_REPORT=BRIDGE_CASE+':public-summary';
export function bridgeReportPublished(state){
 const c=state?.flags?.bridgeClosurePilot, report=c?.publicReport;
 return c?.status==='filed'&&report?.caseId===BRIDGE_CASE&&report.passageReopened===true&&
  Number.isSafeInteger(report.night)&&Number.isSafeInteger(state.night)&&state.night>report.night;
}
export function withBridgeEdition(catalog){
 const copy={...catalog,cases:[...catalog.cases,{caseId:BRIDGE_CASE,title:'The Bridge That Was Closed',predecessor:null,contactId:'colon'}],
  articles:[...catalog.articles]};
 for(const paper of ['times','inquirer']){
  const common={paper,caseId:BRIDGE_CASE,evidence:false,provenance:'GAME-ORIGINAL; public bridge enquiry'};
  copy.articles.push({...common,id:'bridge-closure-'+paper+'-lead',phase:'lead',publicKey:BRIDGE_CASE+':tip',
    headline:'WATCH ASKS ABOUT BRIDGE NOTICE',body:'The Watch is taking accounts of a diversion at Brass Bridge.',
    lead:{caseId:BRIDGE_CASE,contactId:'colon',status:'unverified',kind:'referral'}});
  copy.articles.push({...common,id:'bridge-closure-'+paper+'-followup',phase:'followup',publicKey:BRIDGE_REPORT,
    headline:paper==='inquirer'?'WHO REALLY OWNS THE BRIDGES?':'WATCH REMOVES FALSE DIVERSION NOTICE',
    body:paper==='inquirer'?
    'The Watch says it never closed Brass Bridge. Yet carts were turned back by a piece of paper. Another reader has sent us a second notice from Contract Bridge. Same wording. Same upside-down stamp. The Watch calls the first a forgery. We await its explanation for the second. You can check the public approach yourself, or ask after the notice in Duty.':
    'The Watch removed a false diversion notice from the public approach to Brass Bridge. The passage remains open. No private statements have been released.',
    lead:null});
 }
 return copy;
}
