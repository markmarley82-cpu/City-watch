/* Presentation of the existing opening case. No tactics or save rules. */
(function(root){
 'use strict';
 const looks=Object.freeze({
  porter:Object.freeze({name:'Porter in the blue cap',badge:'Porter',key:'dockworker'}),
  runner:Object.freeze({name:'Errand runner in the red scarf',badge:'Errand runner',key:'produce-vendor'})
 });
 const look=variant=>Object.hasOwn(looks,variant)?looks[variant]:null;
 function bindBattle(battle,binding,variant){
  if(binding!=='yard-purse-suspect')return null;
  const art=look(variant),actor=battle.actors?.find(a=>a.id==='patron'&&a.team==='opposition');
  if(!art||!actor)return null;
  actor.name=art.name;actor.appearance=art.key;
  return art;
 }
 root.CWOpeningSuspect=Object.freeze({look,bindBattle});
})(globalThis);
