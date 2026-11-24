const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const out='qa-results/startup-recovery';fs.mkdirSync(out,{recursive:true});
const results={physicalDeviceVerified:false,flows:[]};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),root=path.resolve('dist');if(!u.pathname.startsWith('/City-watch/')){res.writeHead(404);return res.end();}const file=path.resolve(root,decodeURIComponent(u.pathname.slice(12))||'index.html');if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}const mime={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg'};res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
const target='assets/city-v07/watch_whole_building_alternative.webp',campaignKey='city_watch_p21_campaign_v1';
async function shot(page,name){await page.screenshot({path:out+'/'+name+'.jpg',type:'jpeg',quality:80});}
async function record(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),campaignKey);}
function progress(r){assert(r&&r.schema===1);return{position:r.position,visited:r.visited,steps:r.steps,encounters:r.encounters,pending:r.pending,state:Object.fromEntries(['hp','maxhp','coins','merit','rank','chapter','stage','items'].map(k=>[k,r.state[k]]))};}
async function boot(page){await page.waitForFunction(()=>['ready','failed'].includes(document.body.dataset.cityBoot),null,{timeout:240000});return page.evaluate(()=>document.body.dataset.cityBoot);}
function attempts(requests){assert.equal(requests.length,3,JSON.stringify(requests));assert.deepEqual(requests.map(r=>new URL(r.url).searchParams.get('cw-retry')),[null,'1','2']);assert(requests[1].at-requests[0].at>=250,'First retry was not delayed');assert(requests[2].at-requests[1].at>=1000,'Second retry was not delayed');}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/City-watch/',browser=await chromium.launch();
 try{
  for(const device of [{name:'phone',viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2},{name:'desktop',viewport:{width:1280,height:900}}]){
   const {name,...opts}=device,ctx=await browser.newContext(opts),page=await ctx.newPage(),errors=[];let remaining=2,requests=[],navigations=0;
   page.on('pageerror',e=>errors.push(e.message));page.on('framenavigated',f=>{if(f===page.mainFrame())navigations++;});
   await page.addInitScript(()=>{window.__startupFailures=[];new MutationObserver(()=>{if(document.body?.dataset.cityBoot==='failed')window.__startupFailures.push(document.body.innerText);}).observe(document,{subtree:true,attributes:true,attributeFilter:['data-city-boot']});});
   await ctx.route('**/'+target+'*',async route=>{if(route.request().resourceType()!=='image')return route.continue();requests.push({url:route.request().url(),at:Date.now()});if(remaining>0){remaining--;return route.abort('failed');}return route.continue();});
   await page.goto(base+'index.html?lighting-preview=day',{waitUntil:'domcontentloaded'});
   assert.equal(await boot(page),'ready');attempts(requests);assert.equal(navigations,1,'Recovery reloaded the page');assert.deepEqual(await page.evaluate(()=>window.__startupFailures),[]);
   await page.locator('#character-studio[open]').waitFor({timeout:60000});await page.locator('#character-apply').click();await page.locator('#cw-oath-name').fill('Recovery QA');await page.locator('.cw-oath-submit').click();await page.locator('#cw-first-patrol-briefing[open]').waitFor();await page.getByRole('button',{name:'Start patrol',exact:true}).click();await page.locator('#city-scene[data-ready="true"]').waitFor();
   await shot(page,name+'-recovered');results.flows.push({viewport:name,scenario:'two failed image requests',attempts:requests.length,manualReload:false,ready:true});console.log('PASS',name,'two failed requests recovered without reload');
   if(name==='phone'){
    // Keep a real oath/briefing save and verify a genuine failed boot cannot wipe it.
    const saved=progress(await record(page));assert.equal(saved.state.coins,5);assert.equal(saved.state.hp,24);
    remaining=Infinity;requests=[];const beforeFailure=navigations;await page.reload({waitUntil:'domcontentloaded'});assert.equal(await boot(page),'failed');attempts(requests);assert.equal(navigations,beforeFailure+1);
    await page.getByRole('button',{name:'Retry loading',exact:true}).waitFor();assert((await page.locator('.cw-phone-loading-diagnostic').textContent()).includes(target));assert.deepEqual(progress(await record(page)),saved,'A failed painting load changed saved progress');
    const failedCount=requests.length;await page.waitForTimeout(1800);assert.equal(requests.length,failedCount,'Permanent failure kept retrying');await shot(page,'phone-permanent-failure');results.flows.push({viewport:name,scenario:'permanent image failure',attempts:failedCount,retryButton:true,savedProgressIntact:true});console.log('PASS phone permanent failure stops after three attempts and preserves save');
    remaining=0;requests=[];await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.getByRole('button',{name:'Retry loading',exact:true}).click()]);assert.equal(await boot(page),'ready');assert.equal(requests.length,1,'Healthy retry made extra image requests');assert.deepEqual(progress(await record(page)),saved,'Retry did not resume saved progress');assert.equal(await page.locator('#character-studio[open]').count(),0,'Saved recruit sent back to creation');await shot(page,'phone-saved-patrol-resumed');results.flows.push({viewport:name,scenario:'Retry loading after network recovers',ready:true,savedProgressIntact:true});console.log('PASS phone Retry loading resumes existing patrol');
   }
   assert.deepEqual(errors,[]);await ctx.close();
  }
  results.passed=true;
 }catch(error){results.passed=false;results.error=error.stack;for(const [i,p]of browser.contexts().flatMap(c=>c.pages()).entries()){results.failure=await p.evaluate(()=>({boot:document.body.dataset.cityBoot,text:document.body.innerText.slice(-7000)})).catch(()=>null);await shot(p,'failure-'+i).catch(()=>{});}throw error;}
 finally{fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
