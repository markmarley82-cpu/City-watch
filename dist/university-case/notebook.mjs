// Read-only projection for the existing Patrol Records Notebook row contract.
import {CASE01_TEXT as text,case01Guidance,readCase} from './case.mjs';

export function projectCase01Notebook(state,ordinaryRows={}){
 const rows=Object.fromEntries(['cases','evidence','witnesses','timeline'].map(section=>[
  section,Array.isArray(ordinaryRows[section])?[...ordinaryRows[section]]:[]
 ]));
 let progress;
 try{progress=readCase({state});}catch{return rows;}
 if(!progress.accepted)return rows;
 const title=text.title;
 const row=(section,description,extra)=>rows[section].push({title,description,extra});
 const has=id=>progress.evidence.includes(id);
 row('cases',progress.complete?'Filed · porter’s record corrected':'Investigating · '+progress.evidence.length+'/4 observations',case01Guidance(progress));
 if(has('receipt'))row('evidence',text.receipt,'Great Gates · Movement receipt');
 if(has('report'))row('evidence',text.report,'High Energy Magic · Hex report');
 if(has('crate'))row('evidence',text.crate,'Octangle · Recovered instrument and packing entry');
 if(has('buyer')){
  row('evidence',text.offer,'Octangle · Written offer');
  row('evidence',text.buyer,'Octangle · Written account from the buyer');
  row('witnesses',text.buyer,'Octangle · Buyer’s first-hand account');
 }
 if(progress.response){
  const admitted=progress.response==='admission';
  const qualifier=admitted?'Assistant’s recorded admission':'Assistant’s recorded denial; no admission of authorship';
  row('evidence',text[progress.response],qualifier);
  row('witnesses',text[progress.response],qualifier);
 }
 if(progress.corrected){
  const description=progress.accusedEarly?text.playerCorrection:text.correction;
  row('timeline',description,'High Energy Magic · Correction recorded');
 }
 if(progress.complete)row('timeline','Supported report filed',text.conclusion);
 return rows;
}
