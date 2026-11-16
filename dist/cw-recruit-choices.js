/* Recruit lore and editor drafts. Cosmetic choices never grant rank, skills or biography. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.CWRecruitChoices=api;(root.CW_R2_PARTS=root.CW_R2_PARTS||[]).push('cw-recruit-choices.js');}})(globalThis,function(){
 'use strict';
 // Source tiers and precise citations are recorded in qa/customisation-v14/LORE.md.
 // A Watch precedent is an individual example, not a universal recruitment rule.
 const profiles={
  human:{label:'Human',kind:'species',record:'Watch precedent',note:'A new human recruit, with a history of your own. Choosing this appearance does not make you Vimes, Carrot or another named officer.',sources:['Q12','MAA']},
  dwarf:{label:'Dwarf',kind:'species',record:'Watch precedent',note:'Beards are worn across dwarf genders. Head and beard choices do not decide your gender, faith or profession.',sources:['Q12-R11','FOC']},
  troll:{label:'Troll',kind:'species',record:'Watch precedent',note:'A stone-bodied person. Your chosen face does not decide intelligence, temperament or profession; fitted kit must suit the body.',sources:['Q12-R12','MAA']},
  goblin:{label:'Goblin',kind:'species',record:'Story-sensitive recruit',note:'Goblin rights and recruitment change during Snuff. This recruit’s particular City Watch career is an original roleplaying choice.',sources:['Q12-R06','Q12-R07']},
  gnome:{label:'Gnome',kind:'species',record:'Watch precedent',note:'Gnomes have Watch precedent, including Buggy Swires. This is your own recruit, with no borrowed name, bird or biography.',sources:['Q12-R04']},
  feegle:{label:'Feegle',kind:'species',record:'Individual Watch precedent',note:'A Feegle is not an imp. Wee Mad Arthur provides a specific Watch precedent; your recruit does not inherit his history.',sources:['Q12-R05']},
  imp:{label:'Imp',kind:'species',record:'Original roleplaying recruit',note:'The blue imp remains a separate appearance from Gnome and Feegle. A sworn imp recruit is an original roleplaying choice.',sources:['Q12-R10','Q12-R16']},
  vampire:{label:'Vampire',kind:'condition',record:'Individual Watch precedent',note:'Sally provides Watch precedent. A vampire appearance does not choose a Black Ribbon pledge or personal history for you.',sources:['Q12']},
  zombie:{label:'Zombie',kind:'condition',record:'Watch precedent',note:'Reg Shoe provides Watch precedent. Undead appearance does not make your recruit an enemy or give them Reg’s biography.',sources:['Q12-R09']},
  ghoul:{label:'Ghoul',kind:'species',record:'Original roleplaying recruit',note:'Ghoul and Zombie remain distinct appearances. A sworn ghoul recruit is an original roleplaying choice, rather than an established Watch career.',sources:['CATALOGUE']},
  werewolf:{label:'Werewolf',kind:'condition',record:'Individual Watch precedent',note:'Angua provides werewolf Watch precedent. This appearance is in human form; choosing a head does not create a transformation ability.',sources:['Q12','FOC']},
  igor:{label:'Igor family',kind:'family',record:'Family background',note:'An Igor family background does not decide your biological species. Your recruit remains distinct from the Watch’s named Igor.',sources:['Q12']},
  orc:{label:'Orc',kind:'species',record:'Original roleplaying recruit',note:'Nutt’s story rejects the idea that orcs must be evil. A new orc Watch recruit is an original roleplaying choice.',sources:['Q12-R13']},
  golem:{label:'Golem',kind:'species',record:'Watch precedent',note:'Dorfl provides Watch precedent. A golem recruit is their own person, not property or a copy of Dorfl.',sources:['Q12-R08']},
  gargoyle:{label:'Gargoyle',kind:'species',record:'Watch precedent',note:'Gargoyles such as Downspout serve in the Watch. This recruit keeps an individual appearance and history.',sources:['DOWNSPOUT']},
  elf:{label:'Elf',kind:'species',record:'Original roleplaying recruit',note:'Discworld elves are portrayed as dangerous and unsettling. An elf Watch recruit is an original roleplaying choice.',sources:['LAL']},
  gnoll:{label:'Gnoll',kind:'species',record:'Original roleplaying recruit',note:'Appearance does not assign a gnoll a criminal past. A sworn gnoll recruit is an original roleplaying choice.',sources:['CATALOGUE']}
 };
 for(const item of Object.values(profiles)){Object.freeze(item.sources);Object.freeze(item);}Object.freeze(profiles);
 function profile(id,heads){return profiles[heads.raceOf(id)?.id]||null;}
 function bodyLabel(id,heads,clothing){
  const race=heads.raceOf(id),entry=profile(id,heads);if(!race||!entry)return 'Appearance';
  if(clothing.rigs.includes(id))return 'Watch kit · '+(clothing.rigs.indexOf(id)+1);
  const bodies=race.bodies.filter(key=>!clothing.rigs.includes(key)),n=bodies.indexOf(id)+1;
  return (race.id==='human'?'City clothes':race.id==='werewolf'?'Human form':entry.label)+' · '+n;
 }
 function createDrafts({heads,clothing,random=Math.random}){
  const drafts=new Map(),copy=value=>({head:value.head,outfit:{...value.outfit}});
  function check(id){if(!heads.raceOf(id))throw Error('Only generic recruit appearances can be edited');}
  function read(id){check(id);if(!drafts.has(id))drafts.set(id,{head:heads.selected(id),outfit:clothing.selected(id)});return copy(drafts.get(id));}
  function set(id,value){check(id);const next={head:heads.normalize(id,value.head),outfit:clothing.normalize(id,value.outfit)};drafts.set(id,next);return copy(next);}
  function pick(values){const value=random(),fraction=Number.isFinite(value)?Math.max(0,Math.min(.999999999,value)):0;return values[Math.floor(fraction*values.length)];}
  function shuffle(id){
   const current=read(id),otherHeads=heads.choices(id).map(item=>item.id).filter(key=>key!==current.head);
   const next=copy(current);if(otherHeads.length)next.head=pick(otherHeads);
   for(const slot of clothing.slots){const others=Object.keys(clothing.choices(id,slot)).filter(key=>key!==current.outfit[slot]);if(others.length)next.outfit[slot]=pick(others);}
   return set(id,next);
  }
  function patrol(id){
   const current=read(id);if(!clothing.supports(id))return current;
   const drawn=!!clothing.choices(id,'coat')['fitted-watch-plate'];const actual=clothing.choices(id,'coat')['watch-plate'],prefer=drawn?{coat:'fitted-watch-plate',trousers:'drawn-fitted-breeches',boots:'drawn-fitted-footwear',helmet:'drawn-watch-helmet',badge:'copper'}:actual?{coat:'watch-plate',trousers:'fitted-breeches',boots:'fitted-footwear',helmet:'watch-helmet',badge:'copper'}:{coat:'brown',trousers:'charcoal',boots:'black',helmet:'copper',badge:'copper'},outfit={};for(const slot of clothing.slots)outfit[slot]=Object.hasOwn(clothing.choices(id,slot),prefer[slot])?prefer[slot]:'original';return set(id,{head:current.head,outfit});
  }
  function restore(id){check(id);drafts.delete(id);return read(id);}
  return {read,set,shuffle,patrol,restore,clear:()=>drafts.clear()};
 }
 return Object.freeze({version:'1.0',profiles,profile,bodyLabel,createDrafts});
});
