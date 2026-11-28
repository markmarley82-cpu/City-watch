// Street incidents (Mark, 28 Nov 2026: "it feels like just walking about and nothing happens").
// Small things pop up near the officer while walking between cases. Each takes about a minute and
// pays a little merit. Two of them can turn into a fight on the new battle screen.
// Pure rules here; the game places the people, starts fights and saves the record.
export const FLAG='streetIncidentsV1';
export const COOLDOWN_MS=75000, MIN_STEPS=25;

export const TYPES=Object.freeze({
  pickpocket:{title:'Stop, thief!',people:[{role:'victim',name:'Woman with a cut purse-string',key:'townswoman'},{role:'thief',name:'Pickpocket',key:'cutpurse',dx:2,dy:1}],
    alert:'“Stop, thief! He’s had my purse!”',
    intro:'A woman is pointing at a lad edging away with something that is very clearly her purse.',
    options:[{id:'grab',label:'Grab him',fight:'incident-thief'},{id:'shout',label:'Shout “Stop! City Watch!”'}]},
  brawl:{title:'Brawl in the street',people:[{role:'a',name:'Docker with a grudge',key:'dockworker'},{role:'b',name:'Dwarf with a bigger grudge',key:'p3_dwarf_01',dx:1,dy:1}],
    alert:'Shouting up ahead. Somebody has thrown the first punch.',
    intro:'A docker and a dwarf are arguing about who owes whom for the last round. Fists are involved.',
    options:[{id:'talk',label:'Talk them down'},{id:'break',label:'Break it up (fight)',fight:'incident-brawl'}]},
  cart:{title:'Cart in the road',people:[{role:'carter',name:'Stuck carter',key:'farmer'}],
    alert:'A cart has lost a wheel and the whole street is backing up behind it.',
    intro:'The carter is shouting at his horse, the horse is ignoring him, and the queue behind is getting creative with its language.',
    options:[{id:'push',label:'Help him get it clear'},{id:'ticket',label:'Write him a ticket for blocking the road'}]},
  lost:{title:'Lost child',people:[{role:'child',name:'Lost little lad',key:'young-citizen'}],
    alert:'A small boy is crying in the middle of the street.',
    intro:'“I’ve lost me mam,” he says. “She’s got a blue shawl and a very loud voice.”',
    options:[{id:'shawl',label:'Ask round for a woman in a blue shawl'},{id:'house',label:'Take him to the Watch House'}]}
});
const ORDER=['pickpocket','brawl','cart','lost'];

export function data(record){const d=record.state.flags[FLAG];return d&&typeof d==='object'?d:{done:0,merit:0,lastAt:0,lastSteps:0,active:null,count:{}};}

// Quiet between cases only: no fight, no patrol round, not in the opening.
export function quiet(record){
  const f=record.state.flags,b=f.bridgeClosurePilot;
  return !record.pending&&!f.p21PatrolRounds?.active&&!(b&&b.status==='prologue')&&!!f.watchOathVersion&&!f.postOfficeInteriorsV1?.active;
}
export function canSpawn(record,now,steps){
  const d=data(record);if(d.active||!quiet(record))return false;
  return now-(Number(d.lastAt)||0)>=COOLDOWN_MS&&steps-(Number(d.lastSteps)||0)>=MIN_STEPS;
}
// Cycle through the kinds so you don't get the same one twice running.
export function spawn(record,{at,now,steps}){
  if(!canSpawn(record,now,steps))return null;
  const next=JSON.parse(JSON.stringify(record)),d=data(next),type=ORDER[(Number(d.done)||0)%ORDER.length];
  next.state.flags[FLAG]={...d,active:{type,at:at.slice(0,3),stage:'open',started:now}};
  return {next,type,alert:TYPES[type].alert};
}
export function options(record){
  const a=data(record).active;if(!a)return [];
  if(a.stage==='open')return TYPES[a.type].options;
  if(a.stage==='fight')return [{id:'resume',label:'Get stuck in',fight:TYPES[a.type].options.find(o=>o.fight)?.fight}];
  return [];
}
const done=(next,d,merit,coins,message)=>{
  d.done=(Number(d.done)||0)+1;d.merit=(Number(d.merit)||0)+merit;d.count={...d.count,[d.active.type]:((d.count||{})[d.active.type]||0)+1};
  d.active=null;next.state.merit+=merit;if(coins)next.state.coins+=coins;
  return {next,message:message+(merit?' +'+merit+' merit.':'')+(coins?' +'+coins+' coins.':'')};
};
export function apply(record,id,{now=Date.now(),steps=0}={}){
  const next=JSON.parse(JSON.stringify(record)),d=data(next),a=d.active;if(!a)return null;
  const opt=options(record).find(o=>o.id===id);if(!opt)return null;
  d.lastAt=now;d.lastSteps=steps;next.state.flags[FLAG]=d;
  if(opt.fight){a.stage='fight';a.encounterStart=next.encounters?.length||0;return {next,fight:opt.fight,message:a.type==='brawl'?'You wade in. Both of them turn on you, which is at least progress.':'You lunge. He drops the purse and squares up instead.'}}
  switch(id){
    case 'shout':return done(next,d,0,0,'He bolts round the corner and is gone. The woman says the Watch is useless, loudly, to everyone.');
    case 'talk':return done(next,d,1,0,'You point out that the barman is watching and so is the Watch. They decide they were friends all along.');
    case 'push':return done(next,d,1,0,'Shoulder to the tailboard, one heave, and the street flows again. The carter calls you a gentleman, possibly sarcastically.');
    case 'ticket':return done(next,d,1,2,'He pays the fine with the expression of a man composing a letter to the Times.');
    case 'shawl':return done(next,d,1,0,'You don’t have to ask far. You hear her three streets away. The reunion is tearful and very loud.');
    case 'house':return done(next,d,1,0,'You leave him with Sergeant Colon, who produces a biscuit from somewhere. His mam turns up within the hour.');
  }
  return null;
}
// Read a finished incident fight back from the encounter record.
export function observe(record){
  const d=data(record),a=d.active;if(!a||a.stage!=='fight'||record.pending)return null;
  const binding=TYPES[a.type].options.find(o=>o.fight)?.fight;
  const e=(record.encounters||[]).slice(a.encounterStart||0).find(x=>x.binding===binding);if(!e)return null;
  const won=['arrested','incapacitated','surrendered'].includes(e.subjectStatus)||/arrest|subdued/.test(e.result?.outcome||e.outcome||'');
  const next=JSON.parse(JSON.stringify(record)),nd=data(next);next.state.flags[FLAG]=nd;
  if(a.type==='pickpocket')return done(next,nd,won?2:0,0,won?'The purse goes back to its owner, who says the Watch isn’t so useless after all.':'He got away with the purse. Not your finest minute.');
  return done(next,nd,won?2:0,0,won?'Two sore heads, one lesson learned. The street gives you a smattering of applause.':'They both legged it while you were picking yourself up.');
}
// Walked away from it: it resolves itself without you.
export function abandon(record,now){
  const d=data(record);if(!d.active||d.active.stage==='fight')return null;
  const next=JSON.parse(JSON.stringify(record));next.state.flags[FLAG]={...d,active:null,lastAt:now};return {next};
}
