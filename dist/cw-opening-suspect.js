/* Presentation of the existing opening case. No tactics or save rules. */
(function(root){
 'use strict';
 const looks=Object.freeze({
  porter:Object.freeze({name:'Porter in the blue cap',badge:'Porter',key:'dockworker'}),
  runner:Object.freeze({name:'Errand runner in the red scarf',badge:'Errand runner',key:'produce-vendor'})
 });
 const look=variant=>Object.hasOwn(looks,variant)?looks[variant]:null;
 function bindBattle(battle,binding,variant){
  // The opening fight (Mark, 28 Nov 2026): one lad, easy, to learn the controls.
  if(binding==='opening-lookout'){
   const actor=battle.actors?.find(a=>a.id==='patron'&&a.team==='opposition');if(!actor)return null;
   for(const other of battle.actors.filter(a=>a.team==='opposition'&&a!==actor)){other.status='released';other.hp=Math.max(1,other.hp||1);}
   actor.name='Lad in a flat cap';actor.appearance='opening-lookout';
   // Start toe to toe so the first fight is about swinging and guarding, not moving about.
   const officer=battle.actors.find(a=>a.id==='officer');if(officer&&Number.isFinite(officer.x)){officer.x=1;officer.y=3;actor.x=2;actor.y=3;const partner=battle.actors.find(a=>a.id==='partner');if(partner&&Number.isFinite(partner.x)){partner.x=1;partner.y=5;}}
   if(Number.isFinite(actor.maxHp)){actor.maxHp=Math.max(4,Math.ceil(actor.maxHp*.5));actor.hp=Math.min(actor.hp,actor.maxHp);}
   return {name:actor.name,badge:'Lookout',key:'cutpurse'};
  }
  // The end of the Bridge case: Hobb and his collector put up a proper fight.
  if(binding==='bridge-hobb'){
   const actor=battle.actors?.find(a=>a.id==='patron'&&a.team==='opposition');if(!actor)return null;
   actor.name='Mr Hobb';actor.appearance='opening-hobb';
   const helper=battle.actors.find(a=>a.team==='opposition'&&a!==actor);if(helper){helper.name='Hobb’s collector';helper.appearance='opening-collector';}
   return {name:actor.name,badge:'Mr Hobb',key:'dockworker'};
  }
  if(binding!=='yard-purse-suspect')return null;
  const art=look(variant),actor=battle.actors?.find(a=>a.id==='patron'&&a.team==='opposition');
  if(!art||!actor)return null;
  actor.name=art.name;actor.appearance=art.key;
  return art;
 }
 root.CWOpeningSuspect=Object.freeze({look,bindBattle});
})(globalThis);
