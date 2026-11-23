/* Actual player controls against the branch's complete game, served under its Pages prefix. */
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict'),{chromium,devices}=require('playwright');
const out='qa-results',packet='art-review/mended-drum-large-v1/installation-qa';fs.mkdirSync(out,{recursive:true});fs.mkdirSync(packet,{recursive:true});
const results={physicalPhoneVerified:false,flows:[]};
const injection="window.__DrumQA=()=>({door:world.doors.get('drum'),tavern:sceneryObjects.filter(o=>o.id==='LANDMARK-510:drum').map(o=>({id:o.id,rect:o.rect,p:o.p,scale:o.scale,displayWidth:o.bounds[2],size:[o.im.cwSourceWidth||o.im.width,o.im.cwSourceHeight||o.im.height],emission:!!o.nightEmission})),entranceCells:world.forecourts.find(f=>f.id==='APRON:drum').cells.map(p=>({p,clear:openGround.clearPoint(p)})),nearby:sceneryObjects.filter(o=>o.rect&&o.rect[0]>=92&&o.rect[0]<=110&&o.rect[1]>=235&&o.rect[1]<=258).map(o=>({id:o.id,rect:o.rect,kind:o.sceneryKind})),junctions:[[[108,239,'E050'],[113,256],'E052'],[[108,239,'E050'],[82,250],'E064'],[[108,239,'E050'],[143,239],'E051']].map(([from,to,e])=>({edge:e,path:streetPath(world,from,to,e)?.map(p=>({p,clear:openGround.clearPoint(p)}))}))});";
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');if(!u.pathname.startsWith('/City-watch/')){res.writeHead(404);return res.end();}
 const root=path.resolve('dist'),rel=decodeURIComponent(u.pathname.slice(12)),file=path.resolve(root,rel||'index.html');
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 const mime={'.mjs':'application/javascript','.js':'application/javascript','.json':'application/json','.html':'text/html','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.ogg':'audio/ogg','.mp3':'audio/mpeg'};res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
 if(rel==='city.mjs'){const s=fs.readFileSync(file,'utf8'),marker='window.CWRebuiltCity=Object.freeze(';assert(s.includes(marker));res.end(s.replace(marker,injection+'\n'+marker));}else fs.createReadStream(file).pipe(res);
});
const screenshot=async(page,name)=>{await page.screenshot({path:out+'/'+name+'.jpg',type:'jpeg',quality:85});fs.copyFileSync(out+'/'+name+'.jpg',packet+'/'+name+'.jpg');};
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/City-watch/',browser=await chromium.launch();
 try{
  for(const device of [{name:'desktop',viewport:{width:1280,height:900}},{name:'phone',...devices['iPhone 13']}]){
   const {name,...opts}=device,context=await browser.newContext(opts),page=await context.newPage(),errors=[],missing=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&/mended-drum|landmark-exteriors|city-design|city-cases/.test(r.url()))missing.push({url:r.url(),status:r.status()});});
   await page.goto(base+'index.html?lighting-preview=day',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>['ready','failed'].includes(document.body.dataset.cityBoot),null,{timeout:240000});
   assert.equal(await page.evaluate(()=>document.body.dataset.cityBoot),'ready');
   await page.locator('#character-studio[open]').waitFor({timeout:60000});await page.locator('#character-apply').click({timeout:60000});
   await page.locator('#cw-oath-name').fill('Drum QA');await page.locator('.cw-oath-submit').click();
   await page.locator('#cw-first-patrol-briefing[open]').waitFor();await page.getByRole('button',{name:'Start patrol',exact:true}).click();
   // Start this leg from a valid saved street position. Walk the remaining path through normal Atlas controls.
   await page.evaluate(()=>window.CWP21City.restore([100,258,'E064']));
   const inspection=await page.evaluate(()=>window.__DrumQA());
   assert.equal(inspection.tavern.length,1);assert.deepEqual(inspection.tavern[0].rect,[97,240,8,9]);assert.equal(inspection.tavern[0].displayWidth,643);assert(inspection.tavern[0].emission);
   assert(inspection.entranceCells.every(c=>c.clear),'Blocked entrance cells: '+JSON.stringify(inspection.entranceCells));
   for(const j of inspection.junctions){assert(j.path?.length,'Missing through route '+j.edge);assert(j.path.every(p=>p.clear),'Through route crosses scenery '+j.edge);}
   await page.locator('#atlas-open').click();await page.locator('#atlas-dialog .atlas-index-toggle').click();await page.locator('#city-destination').selectOption('drum');await page.locator('#city-visit').click();
   await page.waitForFunction(()=>{const p=window.CWP21City.position();return p[0]===99&&p[1]===250&&!window.CWP21City.isNavigating();},null,{timeout:120000});
   assert.equal(await page.evaluate(()=>window.CWP21City.nearDoor()?.game_id),'drum');
   await screenshot(page,'drum-'+name+'-day');
   await page.locator('#city-use').click();await page.locator('#p21-engine-dialog[open]').waitFor({timeout:30000});
   await page.waitForFunction(()=>document.querySelector('#p21-engine-frame')?.contentWindow?.CWP21Engine?.snapshot().state.place==='tavern',null,{timeout:60000});
   await screenshot(page,'drum-'+name+'-inside');await page.locator('#p21-engine-close').click();
   await page.waitForFunction(()=>!document.querySelector('#p21-engine-dialog')?.open);
   assert.deepEqual((await page.evaluate(()=>window.CWP21City.position())).slice(0,2),[99,250]);
   await page.evaluate(()=>{window.CWP21City.save();history.replaceState(null,'','?lighting-preview=night');window.CWP21City.refreshClock();});
   await page.waitForFunction(()=>JSON.parse(document.querySelector('#city-scene').dataset.clock).phase==='Night');
   await screenshot(page,'drum-'+name+'-night');
   await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.body.dataset.cityBoot==='ready',null,{timeout:240000});
   assert.deepEqual((await page.evaluate(()=>window.CWP21City.position())).slice(0,2),[99,250]);
   assert.equal(await page.evaluate(()=>window.CWP21City.nearDoor()?.game_id),'drum');
   assert.equal(errors.length,0,errors.join('\n'));assert.equal(missing.length,0,JSON.stringify(missing));
   results.flows.push({viewport:name,recruitAndOath:true,seededApproachStart:[100,258,'E064'],atlasWalk:true,entrance:[99,250],room:'tavern',returnToSameDoor:true,saveReload:true,dayAndNight:true,clearEntranceCells:inspection.entranceCells.length,throughStreetRoutes:inspection.junctions.map(j=>({edge:j.edge,length:j.path.length})),missingAssets:missing,pageErrors:errors});
   await context.close();
  }
  results.passed=true;
 }catch(error){results.passed=false;results.error=error.stack;results.pages=[];for(const [i,page]of browser.contexts().flatMap(c=>c.pages()).entries()){results.pages.push(await page.evaluate(()=>({boot:document.body.dataset.cityBoot,text:document.body.innerText.slice(-7000),dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>({id:d.id,text:d.innerText.slice(0,2000)})),position:window.CWP21City?.position(),qa:window.__DrumQA?.()})).catch(()=>({closed:true})));await page.screenshot({path:out+'/drum-failure-'+i+'.jpg'}).catch(()=>{});}throw error;}
 finally{fs.writeFileSync(out+'/drum-integration.json',JSON.stringify(results,null,2));fs.writeFileSync(packet+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
