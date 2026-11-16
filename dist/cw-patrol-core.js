/* Patrol pool: deterministic saved facts, separate from the main investigation. */
(function(root){
 'use strict';
 const clone=v=>JSON.parse(JSON.stringify(v)),distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
 function create(data,random=Math.random){
  const cases=new Map(data.cases.map(c=>[c.id,c]));
  const fresh=()=>({schemaVersion:1,packVersion:data.pack_version,serial:0,offer:null,active:null,queue:[],reports:[],history:[],lastOffers:[],groupOrder:[],usedGroups:[],orderShift:-1,cooldown:null});
  function state(player){
   if(!player.flags.patrolPool)player.flags.patrolPool=fresh();
   const p=player.flags.patrolPool;
   if(p.schemaVersion!==1)throw Error('This patrol save needs a newer game version.');
   return p;
  }
  const peek=player=>player.flags.patrolPool||fresh();
  function shuffle(list){const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function eligible(player,ctx,c){
   const p=peek(player),site=ctx.sites[c.group];
   return player.chapter>=1&&site&&site.available&&c.dayparts.includes(ctx.daypart)&&
    c.feature_gates.every(g=>ctx.features[g]===true)&&!p.lastOffers.includes(c.id)&&
    !p.history.some(h=>h.caseId===c.id&&ctx.shift-h.shift<3)&&
    !p.queue.some(h=>h.caseId===c.id)&&!p.active&&
    (!p.cooldown||(player.steps-p.cooldown.steps>=40&&ctx.now-p.cooldown.at>=90000));
  }
  function offer(player,ctx){
   const p=state(player);
   if(p.offer)return clone(p.offer);
   if(ctx.blocked||ctx.offerBlocked||player.place!=='city')return null;
   const options=data.cases.filter(c=>eligible(player,ctx,c)&&distance(player,ctx.sites[c.group])<=3);
   if(!options.length)return null;
   if(p.orderShift!==ctx.shift){p.groupOrder=shuffle(Object.keys(data.group_definitions));p.usedGroups=[];p.orderShift=ctx.shift;}
   const groups=p.groupOrder.filter(g=>options.some(c=>c.group===g));
   const group=groups.find(g=>!p.usedGroups.includes(g))||groups[0];
   const c=shuffle(options.filter(c=>c.group===group))[0];
   p.offer={caseId:c.id,siteBinding:clone(ctx.sites[c.group]),offeredShift:ctx.shift};
   p.lastOffers=[...p.lastOffers,c.id].slice(-8);
   return clone(p.offer);
  }
  function accept(player,ctx){
   const p=state(player),o=p.offer,c=cases.get(o?.caseId);
   if(!c||p.active||player.chapter<1||ctx.blocked||player.place!=='city'||distance(player,o.siteBinding)>3)return false;
   // The offer may have waited overnight: recheck gates, daypart and actor before acceptance.
   if(!c.dayparts.includes(ctx.daypart)||!c.feature_gates.every(g=>ctx.features[g]===true)||!ctx.sites[c.group]?.available)return false;
   const seen=p.history.filter(h=>h.caseId===c.id).map(h=>h.variantId);
   const unseen=c.variants.filter(v=>!seen.includes(v.id));
   const v=shuffle(unseen.length?unseen:c.variants)[0];
   p.serial++;
   p.active={instanceId:'RP-'+p.serial,caseId:c.id,variantId:v.id,snapshot:clone(c),stage:'investigate',clueIds:[],chosenDisposition:null,requestedActions:[],confirmedActions:[],acceptedShift:ctx.shift,acceptedStep:player.steps,siteBinding:clone(o.siteBinding),reportId:'RP-REPORT-'+p.serial,rewardApplied:false,findingOrder:shuffle(c.variants.map(v=>v.id))};
   p.tracking=true;p.history.push({caseId:c.id,variantId:v.id,shift:ctx.shift});p.usedGroups.push(c.group);p.offer=null;
   return true;
  }
  function decline(player){state(player).offer=null;}
  const variant=a=>a.snapshot.variants.find(v=>v.id===a.variantId);
  function inspect(player,ctx,index){
   const a=state(player).active;
   if(!a||a.stage!=='investigate'||player.place!=='city'||distance(player,a.siteBinding)>3)return null;
   const clue=variant(a).clues[index];if(!clue)return null;
   if(!a.clueIds.includes(clue.id))a.clueIds.push(clue.id);
   return clone(clue);
  }
  function resolve(player,ctx,disposition,findingId){
   const p=state(player),a=p.active;if(!a||a.stage!=='investigate')return false;
   const v=variant(a),complete=v.required_evidence.every(id=>a.clueIds.includes(id));
   if(disposition==='supported'&&(!complete||findingId!==v.id))return false;
   if(!['supported','unresolved','unsupported'].includes(disposition))return false;
   a.chosenDisposition=disposition;a.chosenFinding=findingId||null;a.stage='awaiting_filing';
   if(disposition==='supported')a.requestedActions=[v.supported_resolution];
   p.tracking=false;a.preparedStep=player.steps;p.queue.push(a);p.active=null;
   return true;
  }
  function file(player,ctx){
   const p=state(player);if(!ctx.atDesk)return {count:0,merit:0};
   let count=0,merit=0;
   for(const a of p.queue){
    if(a.rewardApplied)continue;
    const v=variant(a),supported=a.chosenDisposition==='supported'&&v.required_evidence.every(id=>a.clueIds.includes(id))&&a.chosenFinding===v.id;
    const amount=supported?4:a.chosenDisposition==='unresolved'&&a.clueIds.length?1:0;
    player.merit+=amount;merit+=amount;count++;a.meritAwarded=amount;a.rewardApplied=true;
    a.stage='filed';a.filedShift=ctx.shift;a.filedStep=player.steps;
    a.departed=false;p.reports.push(a);
   }
   p.queue=[];if(count)p.cooldown={steps:player.steps,at:ctx.now};
   return {count,merit};
  }
  function travel(player){
   for(const a of peek(player).reports)if(a.chosenDisposition==='supported'&&!a.confirmedActions.length&&player.place==='city'&&distance(player,a.siteBinding)>6)a.departed=true;
  }
  function confirm(player,ctx,id){
   const a=state(player).reports.find(a=>a.instanceId===id);
   if(!a||a.chosenDisposition!=='supported'||!a.rewardApplied||!a.departed||a.confirmedActions.length||player.place!=='city'||distance(player,a.siteBinding)>3||player.steps<=a.filedStep)return false;
   a.confirmedActions=[variant(a).followup.text];a.confirmedStep=player.steps;return true;
  }
  function visible(a){
   const v=variant(a),chosen=a.snapshot.variants.find(v=>v.id===a.chosenFinding);
   return {instanceId:a.instanceId,title:a.snapshot.title,premise:a.snapshot.premise,opening:a.snapshot.opening_line,play:a.snapshot.play,siteBinding:clone(a.siteBinding),stage:a.stage,
    clues:v.clues.filter(c=>a.clueIds.includes(c.id)).map(clone),clueCount:v.clues.length,
    findings:a.findingOrder.map(id=>({id,text:a.snapshot.variants.find(v=>v.id===id).truth})),
    disposition:a.chosenDisposition,report:a.stage==='investigate'?'':a.chosenDisposition==='supported'?v.report_text:a.chosenDisposition==='unresolved'?'Unresolved. No culprit or cause established.': 'Unsupported finding: '+(chosen?.truth||'No supported cause established.')+' Evidence does not establish this conclusion.',
    requestedActions:a.requestedActions.slice(),confirmedActions:a.confirmedActions.slice(),departed:a.departed||false,meritAwarded:a.meritAwarded||0};
  }
  function view(player){
   const p=peek(player),c=cases.get(p.offer?.caseId);
   return {unlocked:player.chapter>=1,total:cases.size,offer:c?{title:c.title,premise:c.premise,opening:c.opening_line,siteBinding:clone(p.offer.siteBinding)}:null,
    active:p.active?visible(p.active):null,queue:p.queue.map(visible),reports:p.reports.map(visible)};
  }
  return {state,peek,offer,accept,decline,inspect,resolve,file,travel,confirm,view,eligible};
 }
 root.CWPatrolCore={create};
 if(root.window)(root.CW_R2_PARTS=root.CW_R2_PARTS||[]).push('cw-patrol-core.js');
})(typeof window==='undefined'?globalThis:window);
