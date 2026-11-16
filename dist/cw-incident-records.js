/* Read-only presentation of the existing campaign incident. No storage or game rules. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CWIncidentRecords=api;})(globalThis,function(){
 'use strict';
 const labels={taproom:'Mended Drum incident',smuggler:'Delivery suspect', 'crypt-raider':'Crypt encounter','cutpurse-0':'Market assault report','cutpurse-1':'Shades assault report'};
 const stages={pursuit:'Pursuit in progress',search:'Searching near the last sighting',caught:'Within speaking distance',surrendered:'Surrendered · arrest or release still required',arrested:'Taken into custody',released:'Released',lost:'Search called off · suspect remains at large',reconfronted:'Confrontation resumed'};
 const title=p=>labels[p.binding]||'Street encounter';
 const counts=r=>['arrested','released','escaped'].map(k=>Number.isSafeInteger(r?.[k])?r[k]+' '+k:k+' count not recorded').join(' · ');
 function view(snapshot={}){
  const p=snapshot.pending,b=p?.battle,c=p?.chase,history=p?.chaseHistory;
  const location=p?.location?.placeLabel||'';
  const suspects=(b?.actors||[]).filter(a=>a.team==='opposition').map(a=>({title:a.name||'Suspect',description:c?.suspectId===a.id?stages[c.status]||c.status:a.status,extra:title(p)+' · '+(location||'Current incident')+' · outcome not yet filed'}));
  const active=p?{id:p.id,title:(c?'Active pursuit · ':'Open encounter · ')+title(p),description:c?(c.name+' · '+(stages[c.status]||c.status)):history?'Confrontation resumed · the original incident is still open':'Encounter in progress · resume from the street controls',extra:(location?location+' · ':'')+'Not yet filed; no final reward awarded.'+(c?.status==='search'?' Follow the last sighting to search.':c?' Follow the suspect, then approach to speak.':'')}:null;
  const saved=snapshot.encounters||[],ids=new Set(saved.map(r=>r.id)),older=(snapshot.state?.flags?.p21EncounterResults||[]).filter(r=>!ids.has(r.id)).map(r=>({...r,result:{outcome:r.outcome,arrested:r.arrested,released:r.released,escaped:r.escaped},legacy:true}));
  const reports=[...older,...saved].reverse().map(r=>({id:r.id,title:title(r),description:r.result?.outcome||'Recorded outcome',extra:counts(r.result)+(r.chase?' · '+(stages[r.chase.status]||'Pursuit recorded')+(r.chase.name?' · '+r.chase.name:''):'')+(r.legacy?' · Older report; merit not recorded here.':' · '+(r.merit||0)+' merit recorded')}));
  return {active,suspects,reports};
 }
 return Object.freeze({view});
});
