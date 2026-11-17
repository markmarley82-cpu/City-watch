// Saved University campaign inquiry.
import {UNIVERSITY_GRAPH} from '../university-campaign.mjs';
export const CASE01_ID='uu-hex-wrong-man';
export const CASE01_CONTENT='quill-case01-1.5';
export const CASE01_KEY='universityCasesV1';
const copy=v=>JSON.parse(JSON.stringify(v));
const EVIDENCE=['receipt','report','crate','buyer'];
const fresh=()=>({content:CASE01_CONTENT,accepted:false,evidence:[],accusedEarly:false,recovered:false,challenged:false,response:null,corrected:false,complete:false});
export const CASE01_TEXT=Object.freeze({
 title:'Hex Names the Wrong Porter',
 receipt:'One sealed crate, IU-47. Collected from stores and left at the collection holding point under the attached return instruction. Seal intact on delivery. Carried by: porter. Release issued by: stores assistant.',
 report:'Delivery-record comparison. Question: who is recorded as moving crate IU-47? Result: the porter signed its movement receipt. Records supplied: packing entry and movement receipt. This comparison does not establish who packed the crate, changed its destination, knew its contents, or intended to sell them.',
 crate:'Authorised staff stop collection and lift the crate lid. The instrument inside carries IU-47. Beneath the return label is the edge of an older internal-transfer label. The packing entry lists IU-47 for internal transfer. The assistant’s release refers to the newer return instruction.',
 offer:'Instrument IU-47, available after collection. Enquiries through the stores assistant. University marks to be removed before handover.',
 buyer:'The stores assistant gave me this note and showed me the instrument. I read IU-47 on it. I would not buy something still marked as University property. I left without it. The porter was not present during our conversation.',
 admission:'I changed it. I thought collection would get it out before anyone checked. Then the porter was named, and I let everyone read more into it. Yes, I added the accusation.',
 denial:'I have nothing else to say.',
 correction:'The report records the carrying. It did not establish theft by the porter.',
 playerCorrection:'I treated a movement record as an accusation. That was wrong. I have corrected the report.',
 pending:'Instrument recovered. Return instruction conflicts with packing entry. The porter is recorded as the carrier; knowledge of a theft is not established. Investigate the offer note’s origin and obtain a first-hand account before attributing an attempted sale.',
 conclusion:'Instrument IU-47 recovered in the stopped return crate. The porter followed the stores release; the delivery analysis did not establish theft by the porter. The release, recovered item and buyer’s account support diversion and an attempted private sale by the stores assistant. Record the assistant’s response separately. Authorship of the handwritten accusation is established only if admitted or independently evidenced.'
});
const rooms={accept:['GATE','OCT'],receipt:['GATE'],report:['HEM'],crate:['OCT'],buyer:['OCT'],accuse:['GATE'],challenge:['OCT'],admit:['OCT'],deny:['OCT'],correct:['HEM'],file:['GATE','HEM']};
function validate(value){
 if(!value||value.content!==CASE01_CONTENT||!Array.isArray(value.evidence)||new Set(value.evidence).size!==value.evidence.length||value.evidence.some(e=>!EVIDENCE.includes(e)))throw Error('Unsupported University case progress retained unchanged');
 for(const k of ['accepted','accusedEarly','recovered','challenged','corrected','complete'])if(typeof value[k]!=='boolean')throw Error('Invalid University case progress retained unchanged');
 if(![null,'admission','denial'].includes(value.response))throw Error('Invalid University response retained unchanged');
 const all=EVIDENCE.every(e=>value.evidence.includes(e));
 if((!value.accepted&&(value.evidence.length||value.accusedEarly||value.recovered||value.challenged||value.response||value.corrected||value.complete))||(value.recovered!==value.evidence.includes('crate'))||(value.challenged&&!all)||(value.response&&!value.challenged)||(value.corrected&&(!all||!value.response))||(value.complete&&!value.corrected))throw Error('Inconsistent University case progress retained unchanged');
 return value;
}
export function readCase(record){
 const ledger=record.state?.flags?.[CASE01_KEY];
 if(ledger===undefined)return fresh();
 if(!ledger||ledger.schema!==1||!ledger.cases||typeof ledger.cases!=='object'||Array.isArray(ledger.cases))throw Error('Unsupported University case ledger retained unchanged');
 return ledger.cases[CASE01_ID]===undefined?fresh():copy(validate(ledger.cases[CASE01_ID]));
}
export function case01Guidance(c){
 if(c.complete)return 'Case filed. The unsupported accusation against the porter has been corrected.';
 if(!c.accepted)return 'Speak to the porter at the Great Gates.';
 if(!c.evidence.includes('receipt'))return 'Ask the porter for their movement receipt at the Great Gates.';
 if(!c.evidence.includes('report'))return 'Ask Ponder in High Energy Magic what Hex was asked.';
 if(!c.evidence.includes('crate'))return 'Ask the authorised staff in the Octangle to compare the crate and packing entry.';
 if(!c.evidence.includes('buyer'))return 'Read the buyer’s first-hand account and offer note in the Octangle.';
 if(!c.challenged)return 'Put the connected evidence to the stores assistant in the Octangle.';
 if(!c.response)return 'Record the assistant’s response. A denial does not block the inquiry.';
 if(!c.corrected)return 'Ask Ponder to correct the unsupported accusation against the porter.';
 return 'File the supported report at the Great Gates or with Ponder.';
}
export function createUniversityCase01({makeStore,visit}){
 function view(){const r=makeStore().read(),c=readCase(r);return {revision:r.revision,case:copy(c),next:case01Guidance(c),text:CASE01_TEXT};}
 function act({action,visitId,revision}){
  if(!Object.hasOwn(rooms,action))throw Error('Unknown University case action');
  const store=makeStore(),record=store.read(),c=readCase(record),active=visit();
  if(!active||active.id!==visitId||record.state.flags.universityVisitV1?.active?.id!==visitId)throw Error('Stale University visit');
  if(record.pending||record.state.flags.guildInteriorsV1?.active)throw Error('Finish the current encounter or interior visit first');
  if(record.revision!==revision)throw Error('Case progress changed. Read the current record and try again.');
  const p=active.snapshot?.position;
  if(!Array.isArray(p)||p.length!==3||!UNIVERSITY_GRAPH.movable(...p))throw Error('Invalid University position');
  const room=UNIVERSITY_GRAPH.zone[p[0]].get(UNIVERSITY_GRAPH.coord(p[1],p[2]));
  if(!rooms[action].includes(room))throw Error('Reach the appropriate University contact first');
  const before=JSON.stringify(c),all=()=>EVIDENCE.every(e=>c.evidence.includes(e));
  if(c.complete)return {...view(),changed:false};
  if(action==='accept')c.accepted=true;
  else{
   if(!c.accepted)throw Error('Accept the inquiry first');
   if(EVIDENCE.includes(action)){
    if(action==='buyer'&&!c.recovered)throw Error('Compare the recovered instrument before corroborating the buyer’s account');
    if(!c.evidence.includes(action))c.evidence.push(action);
    if(action==='crate')c.recovered=true;
   }else if(action==='accuse')c.accusedEarly=true;
   else if(action==='challenge'){if(!all())throw Error('Review the report, receipt, crate and independent buyer account first');c.challenged=true;}
   else if(action==='admit'||action==='deny'){
    if(!c.challenged)throw Error('Put the connected evidence to the assistant first');
    if(c.response&&c.response!==(action==='admit'?'admission':'denial'))throw Error('The recorded response cannot be silently replaced');
    c.response=action==='admit'?'admission':'denial';
   }else if(action==='correct'){if(!all()||!c.response)throw Error('Complete the evidence review and record the assistant’s response first');c.corrected=true;}
   else if(action==='file'){if(!c.corrected||!c.recovered||!all()||!c.response)throw Error('Keep the inquiry pending until the evidence and correction are complete');c.complete=true;}
  }
  validate(c);
  if(JSON.stringify(c)===before)return {...view(),changed:false};
  // Filing pays once (complete cannot be set twice); an early accusation against the porter pays less.
 let paid=null;
 if(action==='file'&&c.complete){paid={merit:c.accusedEarly?6:10,coins:3};record.state.merit=(record.state.merit||0)+paid.merit;record.state.coins=(record.state.coins||0)+paid.coins;}
 const existing=record.state.flags[CASE01_KEY]||{schema:1,cases:{}};
  record.state.flags[CASE01_KEY]={...existing,cases:{...existing.cases,[CASE01_ID]:c}};
  // Atomic canonical replacement rejects intervening writers; unrelated campaign data is retained.
  if(!store.replaceRecord(record,revision))throw Error('Case progress changed before saving. Read the current record and retry.');
  return {...view(),changed:true,paid};
 }
 return Object.freeze({view,act});
}
