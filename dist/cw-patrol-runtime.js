/* Existing campaign UI adapter; no map, main-case or storage-key replacement. */
window.CWInstallPatrolPool=function(engine){
 'use strict';
 const core=window.CWPatrolCore.create(window.CW_PATROL_DATA);
 const read=()=>core.view(engine.player()),context=()=>engine.context();
 function transact(action){
  const previous=JSON.parse(JSON.stringify(engine.player()));
  try{
   const result=action(engine.player(),context());
   if(engine.save()!==true)throw Error('Progress could not be saved.');
   engine.update();return {ok:true,result};
  }catch(error){engine.restore(previous);engine.update();engine.say('Watch Dispatch','The patrol change was not saved. Your previous case facts and rewards are intact.','▤');return {ok:false,error:error.message};}
 }
 const show=(title,text,choices=[])=>engine.open(title,text,choices,'OPTIONAL PATROL REPORT');
 function guideSite(site,title){engine.route(site,title);}
 function current(){
  const v=read(),a=v.active;
  if(!a){menu();return;}
  const nearby=engine.player().place==='city'&&Math.abs(engine.player().x-a.siteBinding.x)+Math.abs(engine.player().y-a.siteBinding.y)<=3;
  const evidence=a.clues.map(c=>c.text).join('\n\n');
  const options=nearby?[
   ['Inspect the scene',()=>collect(0)],
   ['Take / compare the local account',()=>collect(1)],
   ...(a.clues.length===a.clueCount?[['Record a finding',findings]]:[]),
   ['Prepare an unresolved report',()=>prepare('unresolved')]
  ]:[['Follow the report marker',()=>guideSite(a.siteBinding,a.title)]];
  show(a.title,a.premise+'\n\n“'+a.opening+'”\n\n'+a.play+'\n\nEvidence recorded: '+a.clues.length+'/'+a.clueCount+(evidence?'\n\n'+evidence:''),[...options,['Return to patrol',()=>{}]]);
 }
 function collect(index){
  const t=transact((s,c)=>core.inspect(s,c,index));
  if(t.ok&&t.result)show(index===0?'Scene observation':'Recorded local account',t.result.text,[['Continue investigation',current],['Back to patrol',()=>{}]]);
 }
 function findings(){
  const a=read().active;if(!a||a.clues.length!==a.clueCount)return current();
  show('Which finding fits the evidence?',a.clues.map(c=>c.text).join('\n\n'),a.findings.map(f=>[f.text,()=>{
   const result=transact((s,c)=>core.resolve(s,c,'supported',f.id));
   if(result.ok&&result.result)prepared();
   else if(result.ok)show('Finding not established','The recorded evidence does not establish that explanation. Reconsider the two observations or file an honest unresolved report.',[['Review the evidence',current],['File unresolved',()=>prepare('unresolved')],['Record unsupported finding',()=>prepare('unsupported',f.id)]]);
  }]).concat([['Review evidence',current]]));
 }
 function prepare(disposition,id){const t=transact((s,c)=>core.resolve(s,c,disposition,id));if(t.ok&&t.result)prepared();}
 function prepared(){show('Report prepared','Your findings are in the Notebook. Return to Sergeant Colon outside the Watch House, or use the Duty desk inside, to file all waiting patrol reports. Actions remain requests until a later local confirmation.',[['Guide to the Watch desk',()=>guideSite(engine.desk(),'Watch report filing')],['Back to patrol',()=>{}]]);}
 function offer(){
  const o=read().offer;if(!o)return menu();
  show(o.title,o.premise+'\n\n“'+o.opening+'”\n\nOptional local report. Your main case remains available.',[
   ['Follow the report location',()=>guideSite(o.siteBinding,o.title)],
   ['Accept the patrol report',()=>{const t=transact((s,c)=>core.accept(s,c));if(t.ok&&t.result)current();else if(t.ok)show('Report not currently available','Return to the report location during the appropriate daypart. Your existing progress is safe.',[['Back',menu],['Decline this report',()=>{transact(s=>core.decline(s));menu();}]]);}],
   ['Decline without penalty',()=>{transact(s=>core.decline(s));engine.say('Watch Dispatch','The optional report is left for another patrol.','▤');}],
   ['Back to patrol',()=>{}]
  ]);
 }
 function filing(){
  if(!context().atDesk){show('Patrol reports waiting','File these at the existing Watch desk. You can gather several reports before returning.',[['Guide to Sergeant Colon',()=>guideSite(engine.desk(),'Watch report filing')],['Back',menu]]);return;}
  const t=transact((s,c)=>core.file(s,c));
  if(t.ok)show('Patrol reports filed',t.result.count+' report(s) filed. '+t.result.merit+' merit awarded once; no coins. Supported findings earn 4 merit, useful unresolved reports earn 1, and unsupported findings earn none.',[['Return to duty',()=>{}],['Patrol docket',menu]]);
 }
 function followups(){
  const player=engine.player(),list=read().reports.filter(a=>a.disposition==='supported'&&!a.confirmedActions.length);
  if(!list.length)return menu();
  show('Requested actions', 'These actions have been requested. Return to the scene after filing to ask for confirmation.',list.slice(-6).map(a=>[a.title,()=>{
   if(player.place==='city'&&Math.abs(player.x-a.siteBinding.x)+Math.abs(player.y-a.siteBinding.y)<=3&&a.departed){
    const t=transact((s,c)=>core.confirm(s,c,a.instanceId));
    if(t.ok&&t.result){const record=read().reports.find(r=>r.instanceId===a.instanceId);show('Local confirmation',record.siteBinding.respondent+' confirms:\n\n'+record.confirmedActions.join('\n'),[['Back to patrol',()=>{}]]);}
   }else guideSite(a.siteBinding,a.title+' · follow-up');
  }]).concat([['Back',menu]]));
 }
 function menu(){
  let v=read();
  if(!v.unlocked){show('Patrol reports','File your first main-case report with Sergeant Colon to unlock optional random cases.',[['Back to duty',()=>{}]]);return;}
  if(!v.active&&!v.offer){transact((s,c)=>core.offer(s,c));v=read();}
  const options=[];
  if(v.active)options.push(['Continue: '+v.active.title,()=>{transact(s=>{core.state(s).tracking=true;});current();}]);
  if(v.offer)options.push(['Local report: '+v.offer.title,offer]);
  if(v.queue.length)options.push(['File '+v.queue.length+' waiting report(s)',filing]);
  if(v.reports.some(a=>a.disposition==='supported'&&!a.confirmedActions.length))options.push(['Check requested actions',followups]);
  options.push(['Read the Watch Notebook',()=>window.CW_NOTEBOOK?.open()],['Back to duty',()=>{}]);
  show('Random patrol docket',v.active?'One patrol investigation is active. Evidence and local accounts remain available at its saved location.':v.offer?'An optional report is waiting at '+v.offer.siteBinding.label+'.': 'No eligible report nearby at the moment. Walk through markets, quays, public courts and working streets. Reports depend on daypart and available services; recently offered cases stay out of the draw.\n\nAfter filing, allow 40 travel steps and 90 seconds before another report.',options);
 }
 function interact(){
  if(context().blocked)return false;
  const v=read(),player=engine.player();
  if(v.queue.length&&context().atDesk){show('Reports for Sergeant Colon',v.queue.length+' patrol report(s) await filing.',[['File patrol reports',filing],['Continue main Watch business',engine.originalInteract],['Back to duty',()=>{}]]);return true;}
  const at=site=>player.place==='city'&&Math.abs(player.x-site.x)+Math.abs(player.y-site.y)<=3;
  if(v.active&&at(v.active.siteBinding)){if(context().mainNearby)show('Two Watch matters','The patrol report and your main assignment are both close by.',[['Continue the patrol report',current],['Continue main Watch business',engine.originalInteract],['Back to duty',()=>{}]]);else current();return true;}
  if(v.offer&&at(v.offer.siteBinding)){offer();return true;}
  return false;
 }
 function step(){
  const hadOffer=!!core.peek(engine.player()).offer;
  const ctx=context();if(ctx.blocked)return;
  let offered=null;
  const t=transact((s,c)=>{core.travel(s);offered=core.offer(s,c);});
  if(t.ok&&offered&&!hadOffer)engine.say('Watch Dispatch','Local report nearby: '+read().offer.title+'. Use TALK / USE or Casebook → Random patrols.','▤');
 }
 window.CW_PATROL=Object.freeze({menu,view:read,filing,followups,step,interact,objective:()=>{
  const a=read().active;return a?{kind:'patrol-report',x:a.siteBinding.x,y:a.siteBinding.y,label:a.title}:null;
 }});
 return window.CW_PATROL;
};
(window.CW_R2_PARTS=window.CW_R2_PARTS||[]).push('cw-patrol-runtime.js');
