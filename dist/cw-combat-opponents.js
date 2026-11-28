/* Original encounter roles. Species and clothing never establish guilt.
   v1 numbers/tactics are game balance, not claims about Discworld biology. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CWOpponents=api;})(globalThis,function(){
 'use strict';
 const roles=Object.freeze({
  thief:Object.freeze({name:'Quick thief',appearance:'cutpurse',hp:11,resolve:6,damage:3,move:3,kit:'Empty hands; quick footwork',tip:'Fast footwork. Close the exit or talk them down before the pursuit begins.'}),
  dwarf:Object.freeze({name:'Dwarf scrapper',appearance:'dwarf',hp:16,resolve:8,damage:4,move:1,kit:'Work clothes; empty hands',tip:'Alternates a guarded stance with a counter. Talk or shove breaks the stance.'}),
  troll:Object.freeze({name:'Troll enforcer',appearance:'troll',hp:22,resolve:10,damage:7,move:1,kit:'Empty hands; heavy swing',tip:'Winds up before a heavy swing. Guard, step away, talk or shove before it lands.'}),
  wizard:Object.freeze({name:'Rogue wizard',appearance:'scholar',hp:10,resolve:6,damage:3,move:1,kit:'Two short-range dazzling spells; empty hands',tip:'Needs a turn to gather a spell. Talk or shove interrupts it; crates block its line of sight.'}),
  gnoll:Object.freeze({name:'Gnoll scrapper',appearance:'p3_gnoll_01',hp:12,resolve:6,damage:4,move:2,kit:'One pocket of grit; empty hands',tip:'One dirty diversion breaks Guard without dealing damage. After that, ordinary close strikes.'}),
  zombie:Object.freeze({name:'Zombie strongarm',appearance:'zombie',hp:20,resolve:6,damage:3,move:1,kit:'Empty hands; planted stance',tip:'Hard to push aside, but a shove still shakes this suspect and opens a lawful arrest.'}),
  vampire:Object.freeze({name:'Vampire feinter',appearance:'vampire',hp:13,resolve:8,damage:4,move:2,kit:'Empty hands; evasive footwork',tip:'Steps away after a strike once per turn. Talk or shake this suspect to prevent evasion.'}),
  werewolf:Object.freeze({name:'Werewolf pursuer',appearance:'werefolk',hp:16,resolve:8,damage:4,move:2,kit:'Two close empty-hand blows',tip:'Presses with two light strikes. Guard reduces both; talk and restraint still work.'})
 });
 const rosters=Object.freeze({
  'thief-pair':Object.freeze({title:'Thieves at the exit',brief:'Two suspects are trying to get away. Their offence is reported theft, not guild membership.',pair:['thief','thief'],formation:[[4,3],[5,2]]}),
  'dwarf-stand':Object.freeze({title:'A guarded dispute',brief:'A dwarf assault suspect holds position while an accomplice watches the way out.',pair:['dwarf','thief'],formation:[[3,3],[4,4]]}),
  'troll-windup':Object.freeze({title:'The heavy swing',brief:'A troll assault suspect is preparing a heavy swing. The accomplice has other plans.',pair:['troll','thief'],formation:[[3,4],[5,2]]}),
  'wizard-ward':Object.freeze({title:'An interrupted spell',brief:'An original unnamed wizard is resisting arrest with a small dazzling spell. This is no University faculty member.',pair:['wizard','dwarf'],formation:[[5,3],[3,3]]}),
  'gnoll-diversion':Object.freeze({title:'Grit in the gears',brief:'A reported assault suspect has a pocket of grit and a quick accomplice.',pair:['gnoll','thief'],formation:[[3,2],[5,3]]}),
  'undead-stand':Object.freeze({title:'A stubborn obstruction',brief:'A zombie suspect is resisting a specific arrest. Being undead is no offence.',pair:['zombie','wizard'],formation:[[3,3],[5,3]]}),
  'vampire-feint':Object.freeze({title:'A step out of reach',brief:'A vampire assault suspect relies on footwork, not blood or supernatural immunity.',pair:['vampire','thief'],formation:[[3,3],[5,4]]}),
  'werewolf-pressure':Object.freeze({title:'Close pursuit',brief:'An unnamed werewolf suspect and a gnoll accomplice press the patrol. Their conduct is the issue, not their species.',pair:['werewolf','gnoll'],formation:[[3,4],[4,2]]})
 });
 const bindings=Object.freeze({smuggler:'thief-pair','crypt-raider':'wizard-ward','cutpurse-0':'dwarf-stand','cutpurse-1':'troll-windup'});
 const pools=Object.freeze({smuggler:['thief-pair','gnoll-diversion','vampire-feint'],'crypt-raider':['wizard-ward','undead-stand'],'cutpurse-0':['dwarf-stand','vampire-feint','gnoll-diversion'],'cutpurse-1':['troll-windup','werewolf-pressure','undead-stand']});
 const artKeys=new Set([...Object.values(roles).map(r=>r.appearance),'opening-lookout','opening-hobb','opening-collector']);
 const clone=v=>JSON.parse(JSON.stringify(v));
 const spec=a=>a?.opponent?.schema===1&&Object.hasOwn(roles,a.opponent.role)?roles[a.opponent.role]:null;
 const active=a=>a.team==='watch'&&a.status==='active'&&a.hp>0;
 const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
 function target(s,a){
  const watch=s.actors.filter(active);
  return watch.sort((b,c)=>a.opponent.role==='thief'?b.hp-c.hp||distance(a,b)-distance(a,c):distance(a,b)-distance(a,c)||b.id.localeCompare(c.id))[0];
 }
 function apply(s,id,{binding=null}={}){
  if(s.opposition)return s; // Never reroll an already configured/saved encounter.
  const roster=Object.hasOwn(rosters,id)?rosters[id]:null;if(!roster)return s;
  const foes=['patron','lookout'].map(key=>s.actors.find(a=>a.id===key&&a.team==='opposition'));
  if(foes.some(a=>!a))throw Error('Opponent roster requires the existing incident actor identities.');
  foes.forEach((a,i)=>{
   const role=roster.pair[i],r=roles[role];
   Object.assign(a,{name:i?'Accomplice · '+r.name:r.name,appearance:r.appearance,x:roster.formation[i][0],y:roster.formation[i][1],hp:r.hp,maxHp:r.hp,morale:r.resolve,guard:false,shaken:false,opponent:{schema:1,role,plan:null,casts:role==='wizard'?2:0,trick:role==='gnoll'?1:0,evade:role==='vampire'}});
  });
  if(binding){const label={smuggler:'Delivery suspect','crypt-raider':'Crypt raider','cutpurse-0':'Assault suspect','cutpurse-1':'Assault suspect'}[binding];if(label)foes[0].name=label+' · '+roles[roster.pair[0]].name;}
  s.opposition={schema:1,roster:id};s.log=[roster.brief,binding&&binding!=='taproom'?'Take the reported primary suspect into custody. An accomplice alone does not complete the assignment.':'Bring both suspects into custody.'];return s;
 }
 function bind(s,pending,record){
  if(pending?.battle||s.opposition)return s;
  const pool=pending?.binding==='taproom'?Object.keys(rosters):pools[pending?.binding];
  const id=Array.isArray(pool)?pool[(record?.encounters||[]).filter(e=>e.binding===pending.binding).length%pool.length]:null;
  return apply(s,id,{binding:pending?.binding});
 }
 function sight(s,a,b){
  if(s.mode==='classic')return true;
  // Supercover samples: a spell cannot pass through a crate or a blocked corner.
  const dx=b.x-a.x,dy=b.y-a.y,n=Math.max(Math.abs(dx),Math.abs(dy))*8;
  for(let i=1;i<n;i++){const x=a.x+dx*i/n,y=a.y+dy*i/n;for(const ox of [-.01,.01])for(const oy of [-.01,.01])if(s.obstacles.some(p=>p[0]===Math.round(x+ox)&&p[1]===Math.round(y+oy)))return false;}
  return true;
 }
 function canCast(s,a,b){return s.mode==='classic'||distance(a,b)<=3&&sight(s,a,b);}
 function mitigate(a,damage){return spec(a)&&a.guard?Math.max(1,damage-2):damage;}
 function holdsGround(a){return spec(a)&&a.opponent.role==='zombie';}
 function afterStrike(s,a,attacker,{reachable}){
  if(!spec(a)||a.opponent.role!=='vampire'||!a.opponent.evade||a.shaken||a.status!=='active'||a.hp<=0||s.mode==='classic')return;
  const step=reachable(s,a,1).filter(p=>distance(p,attacker)>distance(a,attacker)).sort((p,q)=>distance(q,attacker)-distance(p,attacker)||p.y-q.y||p.x-q.x)[0];
  a.opponent.evade=false;if(step){a.x=step.x;a.y=step.y;s.log.push(a.name+' slips one space out of reach.');}
 }
 function interrupt(s,a,type){
  if(!spec(a)||!['talk','shove','skill'].includes(type))return;
  if(a.opponent.role==='vampire'){a.opponent.evade=false;a.opponent.evadeSuppressed=true;}
  if(a.opponent.plan||a.guard){a.opponent.plan=null;a.guard=false;s.log.push(a.name+' loses the prepared stance.');}
 }
 function intent(s,a){
  const r=spec(a);if(!r)return '';const b=target(s,a);if(!b)return '';
  if(a.opponent.role==='thief')return 'Quick step toward '+b.name+' · 3 stamina; preparing to flee';
  if(a.opponent.role==='dwarf')return a.opponent.plan==='counter'?'Counter '+b.name+' · 4 stamina if adjacent':'Will brace · reduced strike damage; talk or shove breaks guard';
  if(a.opponent.role==='troll')return a.opponent.plan==='swing'?'Heavy swing ready · 7 stamina if adjacent; step away, Guard or interrupt':'Will wind up a heavy swing; interrupt before the following turn';
  if(a.opponent.role==='gnoll')return a.opponent.trick?'Pocket grit ready · will break Guard in clear sight; no stamina damage':'Diversion spent · approach and strike · 4 stamina';
  if(a.opponent.role==='zombie')return 'Planted stance · approach and strike · 3 stamina; shove still opens arrest';
  if(a.opponent.role==='vampire')return 'Evasive footwork · strike · 4 stamina; talk or shake to stop sidestepping';
  if(a.opponent.role==='werewolf')return 'Close pressure · two strikes of 2 stamina; Guard reduces each';
  if(a.opponent.casts<1)return 'Spells spent · approach and empty-hand strike · 3 stamina';
  return a.opponent.plan==='cast'?'Dazzling spell ready · 3 stamina within 3 spaces and clear sight; talk or shove interrupts':'Will gather a spell · '+a.opponent.casts+' casts left; break sight or interrupt';
 }
 function turn(s,a,{reachable,inReach,guardReduction}){
  const r=spec(a);if(!r)return false;const b=target(s,a);if(!b)return false;
  const log=t=>{s.log.push(t);if(s.log.length>80)s.log.shift();};
  const moveToward=()=>{
   if(s.mode==='classic'||inReach(s,a,b))return;
   const options=reachable(s,a,r.move).sort((p,q)=>distance(p,b)-distance(q,b)||p.cost-q.cost||p.y-q.y||p.x-q.x);
   if(options[0]&&distance(options[0],b)<distance(a,b)){a.x=options[0].x;a.y=options[0].y;}
  };
  const hit=(raw,verb)=>{
   const damage=b.guard?Math.max(1,raw-guardReduction(b)):raw;b.hp=Math.max(0,b.hp-damage);
   s.lastOpponentAction={actor:a.id,target:b.id,kind:verb,damage};
   log(a.name+' '+verb+' '+b.name+': '+damage+' stamina'+(b.guard?' (guarded)':'')+'.');
   if(!b.hp){b.status='incapacitated';log(b.name+' cannot continue.');}
  };
  if(a.opponent.role==='gnoll'&&a.opponent.trick){
   if(!canCast(s,a,b))moveToward();
   if(canCast(s,a,b)){a.opponent.trick=0;b.guard=false;b.shaken=true;log(a.name+' throws pocket grit. '+b.name+' loses Guard; no stamina damage.');}
   else log(a.name+' looks for an opening for the diversion.');return true;
  }
  if(a.opponent.role==='wizard'&&a.opponent.casts>0){
   if(a.opponent.plan==='cast'){
    a.opponent.plan=null;
    if(canCast(s,a,b)){a.opponent.casts--;hit(3,'casts a dazzling burst at');}
    else{moveToward();log(a.name+' loses sight; the gathered spell fades.');}
   }else{if(!canCast(s,a,b))moveToward();if(canCast(s,a,b)){a.opponent.plan='cast';log(a.name+' gathers a dazzling spell. Interrupt or break sight before the next turn.');}else log(a.name+' searches for a clear line of sight.');}
   return true;
  }
  if(a.opponent.role==='troll'){
   if(a.opponent.plan==='swing'){a.opponent.plan=null;if(inReach(s,a,b))hit(7,'swings at');else log(a.name+' swings into empty space.');}
   else{moveToward();a.opponent.plan='swing';log(a.name+' winds up a heavy swing. Guard, move away or interrupt.');}
   return true;
  }
  if(a.opponent.role==='dwarf'&&a.opponent.plan!=='counter'){
   moveToward();a.guard=true;a.opponent.plan='counter';log(a.name+' braces for a counter. Talk or shove breaks the stance.');return true;
  }
  a.opponent.plan=null;moveToward();
  if(a.opponent.role==='vampire'){a.opponent.evade=!a.opponent.evadeSuppressed;delete a.opponent.evadeSuppressed;}
  if(inReach(s,a,b)){if(a.opponent.role==='werewolf'){hit(2,'strikes');if(active(b))hit(2,'strikes again at');}else hit(r.damage,'strikes');}else log(a.name+' approaches '+b.name+'.');
  return true;
 }
 function portrait(a){return artKeys.has(a?.appearance)?'../assets/characters-drawn-v1/'+a.appearance+'-portrait.webp':null;}
 return Object.freeze({roles,rosters,bindings,pools,spec,apply,bind,mitigate,holdsGround,afterStrike,interrupt,intent,turn,sight,portrait,clone});
});
