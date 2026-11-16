/* Presentation of existing incident rules. No battle, reward or save writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CWEncounterFeel=api;})(globalThis,function(){
 'use strict';
 const finished=new Set(['arrested','incapacitated','released','escaped']);
 const painted=new WeakMap();
 function view(state,info,debrief=null,campaign=true){
  const foes=state.actors.filter(a=>a.team==='opposition'),arrested=foes.filter(a=>a.status==='arrested').length;
  const remaining=foes.filter(a=>!finished.has(a.status)).length,battle=state.phase==='battle',concluded=state.phase==='result';
  const custody=info.id==='taproom',value=custody?arrested:foes.length-remaining;
  const risks=foes.filter(a=>a.status==='active').map(a=>({name:a.name,round:Number.isInteger(a.escapeAfter)?a.escapeAfter:a.id==='lookout'?(state.fleeRound||4):Infinity})).filter(r=>Number.isFinite(r.round)).sort((a,b)=>a.round-b.round);
  const risk=battle&&risks[0],actor=state.actors[state.turn];
  return {goal:info.goal,progress:custody?arrested+' / '+foes.length+' in custody':remaining+' suspect'+(remaining===1?'':'s')+' remaining',value,maximum:foes.length,
   danger:risk?(state.round>=risk.round?risk.name+' is trying to escape':risk.name+' may flee from round '+risk.round):'',urgent:!!risk&&state.round>=risk.round-1,
   complete:concluded&&!!debrief?.objective,concluded,turn:battle?actor.name+' · Round '+state.round:concluded?'Incident concluded':'Patrol ready',actionReady:battle&&state.budget.action>0,
   next:concluded?(campaign?'Record the outcome to file your report and return to patrol.':'Return to patrol or choose another practice encounter.'):!battle?'Choose your next patrol or retry this exercise.':state.budget.action>0?'One main action ready':state.budget.move>0?'Action spent · move or end turn':'Turn spent · end turn'};
 }
 function paint(document,state,info,debrief,campaign=false){
  const v=view(state,info,debrief,campaign),brief=document.getElementById('incident-brief');if(!brief)return v;
  document.getElementById('incident-goal').textContent=v.goal;
  document.getElementById('incident-progress').textContent=v.progress;
  const gauge=document.getElementById('incident-gauge');gauge.setAttribute('aria-label',info.id==='taproom'?'Suspects in custody':'Suspects settled');gauge.setAttribute('aria-valuemax',String(v.maximum));gauge.setAttribute('aria-valuenow',String(v.value));
  document.getElementById('incident-gauge-fill').style.width=(v.maximum?100*v.value/v.maximum:0)+'%';
  const danger=document.getElementById('incident-danger');danger.textContent=v.danger;danger.hidden=!v.danger;brief.classList.toggle('is-urgent',v.urgent);brief.classList.toggle('is-complete',v.complete);brief.classList.toggle('is-concluded',v.concluded);
  const budget=document.getElementById('budget');budget.dataset.actionReady=String(v.actionReady);budget.title=v.next;
  const name=document.getElementById('active-name'),previous=painted.get(document);name.title=v.turn;
  if(previous&&previous!==v.turn&&!document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches)name.animate?.([{opacity:.35,transform:'translateX(-3px)'},{opacity:1,transform:'translateX(0)'}],{duration:180});
  painted.set(document,v.turn);
  const note=document.getElementById('incident-next');note.textContent=v.next;note.hidden=!v.concluded;
  return v;
 }
 function pulse(node,reduced=false){if(reduced||!node?.animate)return;node.getAnimations?.().forEach(a=>a.cancel());node.animate([{opacity:.65,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:150,easing:'ease-out'});}
 function outcomeCopy(before,after,result){const delta=after.merit-before.merit,merit=(delta>0?'+':'')+delta+' merit';return 'Incident recorded · '+result.arrested+' in custody · '+merit+'. Your report is in the Watch Notebook.';}
 return {view,paint,pulse,outcomeCopy};
});
