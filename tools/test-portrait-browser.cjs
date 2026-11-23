/* Real Chromium checks against the review branch; never publishes the site. */
const assert=require('node:assert/strict'), http=require('node:http'), fs=require('node:fs'), path=require('node:path');
const {chromium,devices}=require('playwright');
const root=path.resolve('dist'),out=path.resolve('qa-results');fs.mkdirSync(out,{recursive:true});
const results={browser:'Chromium',physicalPhoneVerified:false,components:[],errors:[]};
const harness=String.raw`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dialogue review fixture</title>
<link rel="stylesheet" href="./city.css"><link rel="stylesheet" href="./cw-npc-dialogue.css"><link rel="stylesheet" href="./cw-speaker-portraits.css">
<script defer src="./cw-speaker-portraits.js"></script>
<style>body{margin:12px;padding:12px;overflow:auto;background:#292723;color:#eadabc}#qa-controls{display:flex;flex-wrap:wrap;gap:8px}#qa-controls button{position:static;padding:12px;font:16px system-ui}</style>
<div id="qa-controls"></div><button id="city-use">Use</button>
<script type="module">
import {createPlayerContacts} from './cw-player-contacts.mjs';
import {createDibbler} from './cw-dibbler.mjs';
const actors=[{id:'patrol-partner',name:'Nobby Nobbs',key:'mentor-nobby',p:[0,0]}];
const city={position:()=>[0,0],stop:()=>{},update:()=>{},tell:()=>{},characterPainter:{library:{entries:{legacy:{portrait:'assets/characters-drawn-v1/farmer-portrait.webp'}}}}};
const contacts=createPlayerContacts({city,actors,state:()=>({state:{flags:{}}}),member:()=>({id:'nobby',name:'Nobby Nobbs',trait:'Street sense',advice:'Look closely.',maxHp:18,weaponName:'Truncheon'}),university:{owns:()=>false},sellers:{isSeller:()=>false},campaignTalk:()=>{},pursuit:()=>{},walkTo:()=>{},objective:()=>'Patrol Watch Square'});
const entry={topic:'Street conversation',lines:[{speaker:'npc',text:'Good evening, officer. Keep your eyes open on this patrol.'}]};
const names={colon:'Sergeant Colon',nobby:'Nobby Nobbs',carrot:'Captain Carrot',vimes:'Commander Vimes',palm:'Mrs Palm',dibbler:'Dibbler'};
for(const [id,name] of Object.entries(names)){const b=document.createElement('button');b.dataset.open=id;b.textContent=name;b.onclick=()=>id==='nobby'?contacts.partner():contacts.exchange({id,name,key:'legacy'},entry);document.querySelector('#qa-controls').append(b);}
let record={revision:0,pending:null,state:{coins:10,night:0,flags:{},items:[]}},saved=0;
const store={read:()=>structuredClone(record),replaceRecord:(next,revision)=>{if(revision!==record.revision)return false;record={...structuredClone(next),revision:revision+1};return true;},project:()=>{}};
window.CWP21State={create:()=>store};window.CWPatrolConversations={hasTalk:()=>false};
const vendor=createDibbler({city:{position:()=>[-2,4],stop:()=>{},world:{doors:new Map([['watch',{position:[0,0]}]])}},actors:[],nearest:p=>p,onChange:()=>saved++});
const shop=document.createElement('button');shop.dataset.shop='dibbler';shop.textContent='Dibbler shop';shop.onclick=()=>vendor.interact();document.querySelector('#qa-controls').append(shop);
window.__portraitQA=()=>({coins:record.state.coins,items:record.state.flags.dibbler?.bag?.length||0,saved,blocked:!!window.CW_P20_INPUT_BLOCKED});
document.body.dataset.portraitReviewReady='yes';
</script>`;
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),prefix='/City-watch/';
 if(!u.pathname.startsWith(prefix)){res.writeHead(404);res.end();return;}
 const relative=decodeURIComponent(u.pathname.slice(prefix.length));
 if(relative==='__portrait-review'){res.setHeader('Content-Type','text/html');res.end(harness);return;}
 const file=path.resolve(root,relative||'index.html');if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 const mime={'.html':'text/html','.mjs':'application/javascript','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/City-watch/';
 const browser=await chromium.launch();
 try{
  for(const viewport of [{name:'phone',width:390,height:844},{name:'landscape',width:844,height:390},{name:'desktop',width:1280,height:900}]){
   const ctx=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
   const page=await ctx.newPage(),requests=[],errors=[];page.on('request',r=>{if(r.url().includes('/conversation-portraits-v1/'))requests.push(r.url());});page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'__portrait-review');await page.waitForFunction(()=>document.body.dataset.portraitReviewReady==='yes');
   assert.equal(requests.length,0,'New portrait images requested before a conversation');
   for(const [id,portrait] of [['colon','colon'],['nobby','nobby'],['carrot','carrot'],['vimes','vimes'],['palm','mrs-palm'],['dibbler','dibbler']]){
    await page.locator('[data-open="'+id+'"]').click();
    const dialog=page.locator('#cw-player-contacts[open]');
    await dialog.waitFor();const image=dialog.locator('img[data-portrait-id="'+portrait+'"]');
    await image.waitFor();await page.waitForFunction(id=>{const i=document.querySelector('#cw-player-contacts img[data-portrait-id="'+id+'"]');return i?.complete&&i.naturalWidth===256;},portrait);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.equal(await dialog.locator('.cw-speaker-portrait').count(),0,'Duplicate heading portrait');
    const layout=await dialog.evaluate(d=>({width:d.clientWidth,scroll:d.scrollWidth,left:d.getBoundingClientRect().left,right:d.getBoundingClientRect().right,viewport:innerWidth}));
    assert(layout.scroll<=layout.width+2,'Dialogue overflows horizontally: '+JSON.stringify(layout));
    assert(layout.left>=-1&&layout.right<=layout.viewport+1,'Dialogue outside viewport');
    if(viewport.name==='phone'&&['colon','nobby'].includes(id))await page.screenshot({path:path.join(out,id+'-phone.jpg'),type:'jpeg',quality:75});
    await dialog.getByRole('button',{name:'Return to patrol',exact:true}).click();
    assert.equal(await page.evaluate(()=>!!window.CW_P20_INPUT_BLOCKED),false);
   }
   await page.locator('[data-shop="dibbler"]').click();await page.locator('#cw-dibbler[open]').waitFor();
   await page.waitForFunction(()=>document.querySelector('#cw-dibbler [data-seller-portrait] img')?.naturalWidth===256);
   await page.locator('#cw-dibbler [data-buy]').click();const state=await page.evaluate(()=>window.__portraitQA());
   assert.equal(state.coins,7);assert.equal(state.items,1);assert.equal(state.saved,1);
   await page.screenshot({path:path.join(out,'dibbler-shop-'+viewport.name+'.jpg'),type:'jpeg',quality:75});
   await page.locator('#cw-dibbler [data-close]').click();
   assert.equal(errors.length,0,errors.join('\n'));
   results.components.push({viewport:viewport.name,namedDialogues:6,duplicateFaces:0,lazyStartupRequests:0,purchasePassed:true,pageErrors:errors});
   await ctx.close();
  }
  const failed=await browser.newContext({viewport:{width:390,height:844}}),p=await failed.newPage();
  await p.route('**/conversation-portraits-v1/colon-*.webp',route=>route.abort());
  await p.goto(base+'__portrait-review');await p.locator('[data-open="colon"]').click();
  await p.waitForFunction(()=>{const i=document.querySelector('#cw-player-contacts .cw-dialogue-portrait img');return i&&!i.dataset.portraitId&&i.complete&&i.naturalWidth>0;});
  assert.equal(await p.locator('#cw-player-contacts .cw-speaker-portrait').count(),0);
  results.failedImageFallbackPassed=true;await failed.close();

  // Real entry flow: fresh recruit -> oath -> first briefing -> partner conversation.
  const gameContext=await browser.newContext({...devices['iPhone 13']}),game=await gameContext.newPage();
  const gameErrors=[];game.on('pageerror',e=>gameErrors.push(e.message));
  await game.goto(base+'index.html',{waitUntil:'domcontentloaded',timeout:60000});
  await game.waitForFunction(()=>['ready','failed'].includes(document.body.dataset.cityBoot),null,{timeout:240000});
  assert.equal(await game.evaluate(()=>document.body.dataset.cityBoot),'ready','Real city failed to boot');
  await game.locator('#character-studio[open]').waitFor({timeout:60000});
  await game.locator('#character-name').fill('Portrait QA');
  await game.locator('#character-apply').click({timeout:60000});
  await game.locator('#cw-oath-name').fill('Portrait QA');
  await game.locator('.cw-oath-submit').click();
  await game.locator('#cw-first-patrol-briefing[open]').waitFor({timeout:30000});
  await game.waitForFunction(()=>document.querySelector('#cw-first-patrol-briefing .cw-speaker-portrait')?.naturalWidth>0);
  await game.screenshot({path:path.join(out,'real-first-briefing.jpg'),type:'jpeg',quality:75});
  await game.getByRole('button',{name:'Start patrol',exact:true}).click();
  await game.locator('#p21-duty').click({timeout:30000});
  await game.getByRole('button',{name:'Talk to patrol partner',exact:true}).click();
  await game.locator('#cw-player-contacts[open]').waitFor({timeout:30000});
  await game.waitForFunction(()=>document.querySelector('#cw-player-contacts img[data-portrait-id="nobby"]')?.naturalWidth===256);
  assert.equal(await game.locator('#cw-player-contacts .cw-speaker-portrait').count(),0);
  await game.screenshot({path:path.join(out,'real-nobby-conversation.jpg'),type:'jpeg',quality:75});
  await game.getByRole('button',{name:'Return to patrol',exact:true}).click();
  assert.equal(await game.evaluate(()=>!!window.CW_P20_INPUT_BLOCKED),false);
  results.realEntryFlow={boot:true,recruit:true,oath:true,briefing:true,partnerPortrait:true,returnToPatrol:true,pageErrors:gameErrors};
  await gameContext.close();results.passed=true;
 }catch(error){results.passed=false;results.errors.push(error.stack);throw error;}
 finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
