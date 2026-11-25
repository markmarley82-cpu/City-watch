const assert=require('node:assert/strict'),{serve,ready,boot,chromium,phone,output}=require('./qa-sweep-harness.cjs');
const out=output('qa-results/sweep-combat'),results={flows:[]};
const key='city_watch_p21_campaign_v1';
const record=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
function rewards(r){return{coins:r.state.coins,merit:r.state.merit,hp:r.state.hp,chapter:r.state.chapter,stage:r.state.stage,items:r.state.items,encounters:r.encounters,pending:r.pending};}
async function frame(page){await page.locator('#p21-combat-dialog[open]:not([data-loading])').waitFor({timeout:60000});await page.waitForFunction(()=>window.__qaBattle);return page.frames().find(f=>f.url().includes('field-training/index.html'));}
async function command(page,f,goal){
 const decision=await f.evaluate(goal=>{const s=parent.__qaBattle,C=BastionCombat;if(s.phase==='result')return{op:'done'};const foes=s.actors.filter(a=>a.team==='opposition'&&['active','surrendered'].includes(a.status));const order=foes.slice().sort((a,b)=>Number(b.id==='lookout')-Number(a.id==='lookout'));
  if(s.budget.action){for(const a of order)if(goal==='arrest'&&!C.availability(s,'restrain',a.id))return{op:'restrain',id:a.id};else if(goal==='release'&&(a.status==='surrendered'||a.morale<=4)&&!C.availability(s,'bargain',a.id))return{op:'bargain',id:a.id};for(const a of order)if(!C.availability(s,'talk',a.id))return{op:'talk',id:a.id};}
  if(goal==='arrest'&&s.budget.move>0){for(const a of [...order].sort((a,b)=>Number(b.status==='surrendered')-Number(a.status==='surrendered'))){const plan=C.approach(s,a.id);if(plan.ok&&plan.cost>0)return{op:'move',id:a.id};}}
  return{op:'end'};
 },goal);
 if(decision.op==='done')return false;const seq=await page.evaluate(()=>window.__qaSeq);
 if(decision.op==='end')await f.locator('#end-turn').click();else{
  await f.locator('[data-target="'+decision.id+'"]').click();const menu=decision.op==='move'?'move':decision.op==='restrain'?'tactics':'talk';await f.locator('[data-menu="'+menu+'"]').click();if(decision.op==='move')await f.locator('#menu-back').click();else await f.locator('#menu-'+menu+' [data-action="'+decision.op+'"]').click();
 }
 await page.waitForFunction(v=>window.__qaSeq>v,seq,{timeout:10000});return true;
}
(async()=>{const site=await serve(),browser=await chromium.launch();try{
 for(const goal of ['arrest','release']){
  const ctx=await browser.newContext(phone),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{window.__qaSeq=0;window.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data?.type==='cw-p21-battle-state'){window.__qaBattle=e.data.battle;window.__qaSeq++;}if(e.data?.type==='cw-p21-battle-result'){window.__qaResult=e.data;window.__qaResultSource=e.source;}});});
  await boot(page,site.base,'Combat QA');await page.evaluate(()=>{const d=CWP21City.world.doors.get('drum');CWP21City.restore([...d.position,d.edge]);CWP21Game.refresh();});const before=await record(page);
  await page.locator('#p21-duty').click();await page.locator('#p21-duty-actions button').filter({hasText:/^Street incidents & combat$/}).click();await page.locator('#p21-duty-actions button').filter({hasText:/^Start Mended Drum brawl$/}).click();let f=await frame(page);
  await command(page,f,goal);const saved=await record(page);assert(saved.pending?.battle);const encounter=saved.pending.id;await out.shot(page,goal+'-saved-turn');
  await page.reload({waitUntil:'domcontentloaded'});await ready(page);assert.equal((await record(page)).pending.id,encounter);assert.deepEqual((await record(page)).pending.battle,saved.pending.battle);await page.locator('#city-use').click();f=await frame(page);
  for(let n=0;n<100;n++){if(!await command(page,f,goal))break;}
  const finished=await page.evaluate(()=>window.__qaBattle);assert.equal(finished.phase,'result');if(goal==='arrest'){assert.equal(finished.result.arrested,2);assert.equal(finished.result.incapacitated,0);}else assert.equal(finished.result.released,2);await out.shot(page,goal+'-result');
  await f.locator('#return').click();await page.locator('#p21-combat-dialog').waitFor({state:'hidden',timeout:30000});const committed=await record(page);assert.equal(committed.pending,null);assert.equal(committed.encounters.length,before.encounters.length+1);assert.equal(committed.state.merit,before.state.merit+(goal==='arrest'?8:5));assert.equal(committed.state.coins,before.state.coins);
  await page.evaluate(()=>window.dispatchEvent(new MessageEvent('message',{origin:location.origin,source:window.__qaResultSource,data:window.__qaResult})));assert.deepEqual(rewards(await record(page)),rewards(committed),'Duplicate result paid twice');
  await page.reload({waitUntil:'domcontentloaded'});await ready(page);assert.deepEqual(rewards(await record(page)),rewards(committed),'Committed result changed on reload');assert.deepEqual(errors,[]);results.flows.push({goal,midTurnReload:true,result:finished.result,merit:committed.state.merit-before.state.merit,duplicateReplaySafe:true,settledReloadSafe:true});console.log('PASS full campaign combat',goal);await ctx.close();
 }
 results.passed=true;
}catch(e){results.error=e.stack;for(const [i,p]of browser.contexts().flatMap(c=>c.pages()).entries()){results.failure=await p.evaluate(()=>({text:document.body.innerText.slice(-4000),battle:window.__qaBattle})).catch(()=>null);await out.shot(p,'failure-'+i).catch(()=>{});}throw e;}finally{out.write(results);await browser.close();site.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
