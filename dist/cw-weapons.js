/* Original game statistics; ordinary weapons, not canonical named artefacts. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CWWeapons=api;})(globalThis,function(){
'use strict';
const definitions=Object.freeze({
 'issued-truncheon':{id:'issued-truncheon',name:'Watch truncheon',price:0,bonus:0,resolve:2,control:true,art:'truncheon',description:'Close control. Shove and arrest without changing weapons.'},
 'balanced-truncheon':{id:'balanced-truncheon',name:'Balanced truncheon',price:12,bonus:1,resolve:2,control:true,art:'truncheon',description:'One extra stamina damage per strike. Keeps the truncheon’s control actions.'},
 'ironbound-truncheon':{id:'ironbound-truncheon',name:'Ironbound truncheon',price:22,bonus:2,resolve:1,control:true,art:'truncheon',description:'Two extra stamina damage per strike. Strikes remove one less resolve than a regular truncheon. Keeps close control.'},
 'service-sword':{id:'service-sword',name:'Plain service sword',price:18,training:'sword',merit:25,bonus:2,resolve:1,control:false,art:'sword',description:'Two extra stamina damage; weaker Guard. Stow it before shoving or making an arrest.'},
 'service-crossbow':{id:'service-crossbow',name:'Ordinary crossbow',price:24,training:'crossbow',merit:65,bonus:1,resolve:1,control:false,art:'crossbow',range:4,description:'Range 2–4 clear cells. One action to load, one to shoot; consumes a bolt. Stow for close control.'}
});
const gear=Object.freeze({
 'padded-jack':{id:'padded-jack',slot:'armour',name:'Padded watch jack',price:9,guard:1,description:'Guard blocks 1 extra stamina damage per hit.'},
 'service-mail':{id:'service-mail',slot:'armour',name:'Service mail',price:24,guard:2,description:'Guard blocks 2 extra stamina damage per hit.'},
 'patrol-boots':{id:'patrol-boots',slot:'boots',name:'Good patrol boots',price:10,description:'One extra movement step on your opening turn in street and grid encounters.'}
});
const get=id=>typeof id==='string'&&Object.hasOwn(definitions,id)?definitions[id]:null;
const clone=x=>JSON.parse(JSON.stringify(x));
function inventory(s){
 const old=s.flags?.weapons||{},owned=new Set(['issued-truncheon']);
 for(const id of Array.isArray(old.owned)?old.owned:[])if(get(id))owned.add(id);
 if(s.flags?.content?.gear?.club||s.items?.some(i=>['Good truncheon','Balanced truncheon'].includes(i)))owned.add('balanced-truncheon');
 const equipped=owned.has(old.equipped)?old.equipped:owned.has('balanced-truncheon')?'balanced-truncheon':'issued-truncheon';
 const gearOwned=Object.keys(gear).filter(id=>Array.isArray(old.gearOwned)&&old.gearOwned.includes(id));
 const fitted=slot=>gearOwned.includes(old[slot])&&gear[old[slot]].slot===slot?old[slot]:null;
 return {schema:1,owned:[...owned],equipped,gearOwned,armour:fitted('armour'),boots:fitted('boots'),bolts:Number.isSafeInteger(old.bolts)&&old.bolts>=0?Math.min(60,old.bolts):0,training:{sword:old.training?.sword===true,crossbow:old.training?.crossbow===true}};
}
function change(s,command,id){
 const w=inventory(s),d=get(id),next=clone(s);let cost=0;
 if(!Number.isSafeInteger(s.coins)||s.coins<0)return {ok:false,reason:'Invalid purse.'};
 if(command==='train'){
  const weapon=id==='sword'?get('service-sword'):id==='crossbow'?get('service-crossbow'):null;
  if(!weapon)return {ok:false,reason:'Unknown training.'};
  if(w.training[id])return {ok:false,reason:'That drill is already completed.'};
  if(s.merit<weapon.merit)return {ok:false,reason:'Earn '+weapon.merit+' merit before this drill.'};
  cost=4;w.training[id]=true;
 }else if(command==='bolts'){
  if(!w.owned.includes('service-crossbow'))return {ok:false,reason:'Buy a crossbow first.'};
  if(w.bolts>54)return {ok:false,reason:'Your bolt case is full (60 maximum).'};
  cost=3;w.bolts+=6;
 }else if(command==='buy-gear'||command==='equip-gear'){
  const item=Object.hasOwn(gear,id)?gear[id]:null;
  if(!item)return {ok:false,reason:'Unknown patrol equipment.'};
  const owned=w.gearOwned.includes(id);
  if(command==='buy-gear'){
   if(owned)return {ok:false,reason:'You already own this equipment.'};
   cost=item.price;w.gearOwned.push(id);if(!next.items.includes(item.name))next.items.push(item.name);
  }else if(!owned)return {ok:false,reason:'You do not own this equipment.'};
  w[item.slot]=id;
 }else if(command==='buy'||command==='equip'){
  if(!d)return {ok:false,reason:'Unknown weapon.'};
  if(d.training&&!w.training[d.training])return {ok:false,reason:'Complete the '+d.training+' drill first.'};
  if(command==='buy'){
   if(w.owned.includes(id))return {ok:false,reason:'You already own this weapon.'};
   cost=d.price;w.owned.push(id);if(!next.items.includes(d.name))next.items.push(d.name);
   // Preserve the established Quartermaster ownership flag, without double charging.
   if(id==='balanced-truncheon'){next.flags.content=next.flags.content||{completed:{},patrols:0,storyTalks:0};next.flags.content.gear={...next.flags.content.gear,club:true};}
  }else if(!w.owned.includes(id))return {ok:false,reason:'You do not own this weapon.'};
  w.equipped=id;
 }else return {ok:false,reason:'Unknown armoury action.'};
 if(s.coins<cost)return {ok:false,reason:'You need '+cost+' coins.'};
 // Completion and reward share the canonical armoury transaction. Existing
 // training flags also prevent retroactive/replayed reward claims.
 if(command==='train')next.merit+=3;
 next.coins-=cost;next.flags.weapons=w;return {ok:true,state:next,cost};
}
const profile=a=>get(a.weaponProfile);
const damage=a=>3+a.strength+(profile(a)?.bonus||0);
const resolveDamage=a=>profile(a)?.resolve??2;
const guardReduction=a=>a.preparationGuardReduction??((profile(a)&&!profile(a).control?1:(a.guardReduction||2))+(gear[a.armour]?.guard||0));
function loadout(s){const w=inventory(s);return {id:w.equipped,bolts:w.bolts,armour:w.armour,boots:w.boots};}
function bind(battle,s,pending){
 const a=battle.actors.find(a=>a.id==='officer');if(!a)return battle;
 if(a.weaponProfile||pending?.battle)return battle;
 const w=pending?.weaponLoadout||loadout(s),d=get(w.id)||get('issued-truncheon');
 a.weaponProfile=d.id;a.weapon=d.id;a.weaponName=d.name;a.bolts=w.bolts;a.loaded=false;
 a.armour=Object.hasOwn(gear,w.armour)&&gear[w.armour].slot==='armour'?w.armour:null;
 a.boots=w.boots==='patrol-boots'?w.boots:null;
 if(a.boots&&battle.mode!=='classic'&&battle.actors[battle.turn]?.id===a.id&&Number.isFinite(battle.budget?.move))battle.budget.move+=1;
 return battle;
}
function capture(s,battle,pending){
 const a=battle.actors?.find(a=>a.id==='officer');if(!get(a?.weaponProfile))return;
 const w=inventory(s),initial=pending?.weaponLoadout;
 if(initial&&![initial.id,'issued-truncheon'].includes(a.weaponProfile))return;
 if(w.owned.includes(a.weaponProfile))w.equipped=a.weaponProfile;
 if(Number.isSafeInteger(a.bolts)&&a.bolts>=0){w.bolts=Math.min(w.bolts,a.bolts);a.bolts=w.bolts;if(!a.bolts)a.loaded=false;}
 s.flags.weapons=w;
}
// Supercover ray: a diagonal cannot pass between blocked corners or through actors.
function clearShot(s,a,b){
 const blocked=(x,y)=>s.obstacles.some(p=>p[0]===x&&p[1]===y)||s.actors.some(p=>p.id!==a.id&&p.id!==b.id&&!['released','escaped','incapacitated','arrested'].includes(p.status)&&p.x===x&&p.y===y);
 let x=a.x,y=a.y,ix=0,iy=0,dx=b.x-a.x,dy=b.y-a.y,nx=Math.abs(dx),ny=Math.abs(dy),sx=Math.sign(dx),sy=Math.sign(dy);
 while(ix<nx||iy<ny){const decision=(1+2*ix)*ny-(1+2*iy)*nx;if(decision===0){if(blocked(x+sx,y)||blocked(x,y+sy))return false;x+=sx;y+=sy;ix++;iy++;}else if(decision<0){x+=sx;ix++;}else{y+=sy;iy++;}if((x!==b.x||y!==b.y)&&blocked(x,y))return false;}
 return true;
}
function availability(s,a,type,b){
 const d=profile(a);if(!d)return null;
 if(type==='stow')return d.control?'Your control weapon is already ready.':'';
 if(type==='reload')return d.art!=='crossbow'?'No crossbow equipped.':a.loaded?'The crossbow is already loaded.':a.bolts<1?'No bolts remain.':'';
 if(['shove','restrain'].includes(type)&&!d.control)return 'Stow your weapon before close control.';
 if(type==='strike'&&d.art==='crossbow'){
  if(s.mode==='classic')return 'Crossbows require street or grid positioning.';
  if(!b)return null;
  const range=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
  if(range<2)return 'Too close: stow the crossbow and use your truncheon.';
  if(range>d.range)return 'Beyond crossbow range (4 cells).';
  if(!a.loaded)return 'Load the crossbow first (one action).';
  if(a.bolts<1)return 'No bolts remain.';
  if(!clearShot(s,a,b))return 'The shot is blocked by cover or another person.';
 }
 return null;
}
return {definitions,gear,get,inventory,change,profile,damage,resolveDamage,guardReduction,loadout,bind,capture,clearShot,availability};
});
