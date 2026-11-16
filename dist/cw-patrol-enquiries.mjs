export const FIRST_CASE_ROUTE='watch-square-purse';
export const FIRST_CASE_FIGHT='yard-purse-suspect';
const firstCase={
 id:'CW-OPENING-PURSE',title:'The stolen purse',
 premise:'A trader’s purse vanished from a stall in the western yard of Watch Square.',
 opening_line:'My takings are gone. Someone brushed past the stall just before I noticed. The woman packing up farther along this side of the square was facing my counter.',
 feature_gates:[],dayparts:['day','evening','night'],
 variants:[
  {id:'porter',truth:'The porter in the blue cap took the purse.',
   clues:[{id:'trace',method:'inspect',text:'Blue wool snagged on the empty purse hook. The porter’s blue cap has a fresh tear.'},
          {id:'witness',method:'question_or_compare',text:'The witness saw the porter hide the purse in his sack. He stopped at the far end of this side of the square.'}],
   required_evidence:['trace','witness'],
   report_text:'The torn blue cap and witness account identify the porter who took the purse.',
   supported_resolution:'Identify the porter'},
  {id:'runner',truth:'The errand runner in the red scarf took the purse.',
   clues:[{id:'trace',method:'inspect',text:'A red thread caught on the empty purse hook. The errand runner’s scarf has a fresh snag.'},
          {id:'witness',method:'question_or_compare',text:'The witness saw the errand runner tuck the purse into a coat. They stopped at the far end of this side of the square.'}],
   required_evidence:['trace','witness'],
   report_text:'The red scarf and witness account identify the errand runner who took the purse.',
   supported_resolution:'Identify the errand runner'}
 ]
};
export const openingPurseCase=()=>firstCase;
const IDS=['CW-RP-018','CW-RP-040','CW-RP-002','CW-RP-039'];
const clone=x=>JSON.parse(JSON.stringify(x));
export const enquiryForStop=(route,index)=>({'watch-square:0':IDS[0],'watch-square:1':IDS[1],'market-drum:0':IDS[2],'market-escort:0':IDS[3]})[route+':'+index]||(route===FIRST_CASE_ROUTE&&index===0?firstCase.id:null);
let loading;
export function loadEnquiryCases(){
 if(!loading)loading=import('./cw-patrol-data.js?v=p21-b407-s039-reuse').then(()=>{
  const cases=globalThis.window.CW_PATROL_DATA?.cases;
  if(!cases)throw Error('Patrol writing unavailable');
  const selected=cases.filter(c=>IDS.includes(c.id)&&c.feature_gates.length===0);
  if(selected.length!==IDS.length)throw Error('Patrol writing is incomplete');return selected;
 }).catch(error=>{loading=null;throw error;});return loading;
}
export function newEnquiry(definition,instanceId,random=Math.random){
 const n=Math.max(0,Math.min(definition.variants.length-1,Math.floor(random()*definition.variants.length))),order=definition.variants.map(v=>v.id);
 for(let i=order.length-1;i>0;i--){const j=Math.max(0,Math.min(i,Math.floor(random()*(i+1))));[order[i],order[j]]=[order[j],order[i]];}
 return {schema:1,instanceId,caseId:definition.id,snapshot:clone(definition),variantId:definition.variants[n].id,findingOrder:order,clueIds:[],prepared:false,rewardApplied:false};
}
export function validEnquiry(e){return !!(e?.schema===1&&e.snapshot?.variants?.length&&Array.isArray(e.clueIds)&&Array.isArray(e.findingOrder)&&e.snapshot.variants.some(v=>v.id===e.variantId&&Array.isArray(v.clues)&&v.clues.length>=2&&Array.isArray(v.required_evidence))&&e.findingOrder.every(id=>e.snapshot.variants.some(v=>v.id===id)));}
export function enquiryView(e){
 const v=e.snapshot.variants.find(v=>v.id===e.variantId);
 return {title:e.snapshot.title,premise:e.snapshot.premise,opening:e.snapshot.opening_line,clues:v.clues.filter(c=>e.clueIds.includes(c.id)),total:v.clues.length,complete:v.required_evidence.every(id=>e.clueIds.includes(id)),findings:e.findingOrder.map(id=>({id,text:e.snapshot.variants.find(v=>v.id===id).truth})),prepared:e.prepared,report:e.reportText||''};
}
export function collectEnquiry(e,index){
 if(e.prepared)return false;const c=e.snapshot.variants.find(v=>v.id===e.variantId).clues[index];if(!c||e.clueIds.includes(c.id))return false;e.clueIds.push(c.id);return true;
}
export function prepareEnquiry(e,outcome,finding){
 if(e.prepared)return false;const v=e.snapshot.variants.find(v=>v.id===e.variantId);
 if(outcome==='supported'){if(finding!==v.id||!v.required_evidence.every(id=>e.clueIds.includes(id)))return false;}
 else if(outcome!=='unresolved'||!e.clueIds.length)return false;
 e.prepared=true;e.outcome=outcome;e.finding=outcome==='supported'?finding:null;
 const unresolved=e.caseId===firstCase.id?'The available evidence does not establish who took the purse.':e.caseId==='CW-RP-039'?'The evidence does not establish what happened.':'No cause or owner has been established.';
 e.reportText=outcome==='supported'?v.report_text:'Unresolved: '+e.snapshot.title+'. '+unresolved+' Observations: '+v.clues.filter(c=>e.clueIds.includes(c.id)).map(c=>c.text).join(' ');
 e.requestedAction=outcome==='supported'?v.supported_resolution:null;return true;
}
