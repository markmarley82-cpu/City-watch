const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const out='qa-results/civic-rooms',results={physicalDeviceVerified:false,flows:[]};fs.mkdirSync(out,{recursive:true});
const rooms=[{id:'post-office',prefix:'post-office',json:'post-office/reception.json'},{id:'royal-bank',prefix:'royal-bank',json:'royal-bank/reception.json'},{id:'palace',prefix:'palace',json:'palace/reception.json'}].map(r=>({...r,room:JSON.parse(fs.readFileSync('dist/'+r.json))}));
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),root=path.resolve('dist');if(!u.pathname.startsWith('/City-watch/')){res.writeHead(404);return res.end();}const file=path.resolve(root,decodeURIComponent(u.pathname.slice(12))||'index.html');if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}const mime={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg'};res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
async function shot(page,name){await page.screenshot({path:out+'/'+name+'.jpg',type:'jpeg',quality:80});}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/City-watch/',browser=await chromium.launch();
 try{
  for(const device of [{name:'phone',viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2},{name:'landscape',viewport:{width:844,height:390},isMobile:true,hasTouch:true},{name:'tablet',viewport:{width:768,height:1024},hasTouch:true},{name:'desktop',viewport:{width:1280,height:900}}]){
   const {name,...options}=device,ctx=await browser.newContext(options),page=await ctx.newPage(),errors=[],missing=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&/post-office|royal-bank|palace|civic-room/.test(r.url()))missing.push({url:r.url(),status:r.status()});});
   await page.goto(base+'index.html?lighting-preview=day',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>['ready','failed'].includes(document.body.dataset.cityBoot),null,{timeout:240000});
   assert.equal(await page.evaluate(()=>document.body.dataset.cityBoot),'ready');await page.locator('#character-studio[open]').waitFor({timeout:60000});await page.locator('#character-apply').click({timeout:60000});await page.locator('#cw-oath-name').fill('Civic QA');await page.locator('.cw-oath-submit').click();await page.locator('#cw-first-patrol-briefing[open]').waitFor();await page.getByRole('button',{name:'Start patrol',exact:true}).click();
   for(const item of rooms){
    const {id,prefix,room}=item,dialog=page.locator('#cw-'+prefix+'-host'),canvas=dialog.locator('#'+prefix+'-room-canvas');
    const entrance=await page.evaluate(id=>{const c=window.CWP21City,d=c.world.doors.get(id);if(!d||d.held)throw Error('Door unavailable: '+id);c.restore([...d.position,d.edge]);return c.position();},id);
    await page.locator('#city-use').click();await dialog.waitFor({timeout:30000});await page.waitForFunction(p=>document.getElementById(p+'-room-canvas')?.dataset.loaded==='true'&&!document.getElementById('cw-'+p+'-host').hasAttribute('data-loading'),prefix,{timeout:60000});
    assert.equal(await canvas.getAttribute('data-view'),'v2');
    const geometry=await dialog.evaluate(d=>{const c=d.querySelector('canvas'),r=c.getBoundingClientRect();return{scroll:d.scrollWidth,width:d.clientWidth,canvas:{x:r.x,y:r.y,width:r.width,height:r.height},viewport:[innerWidth,innerHeight]};});
    assert(geometry.scroll<=geometry.width+2,'Horizontal room overflow '+JSON.stringify(geometry));assert(geometry.canvas.height>device.viewport.height*.65,'Room stage too small '+JSON.stringify(geometry));
    const controls=await dialog.locator('.room-actions button').evaluateAll(bs=>bs.filter(b=>b.getClientRects().length).map(b=>{const r=b.getBoundingClientRect();return{text:b.textContent,x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
    for(const b of controls)assert(b.x>=0&&b.y>=0&&b.right<=device.viewport.width+1&&b.bottom<=device.viewport.height+1,'Clipped control '+JSON.stringify(b));
    await shot(page,prefix+'-'+name+'-room');
    const hotspot=room.hotspots.find(h=>h.kind==='talk');assert(hotspot);
    const point=await page.evaluate(async({prefix,room,stand})=>{const {createCivicRoomView}=await import('./guild-interiors/civic-room-view.mjs?v=1'),canvas=document.getElementById(prefix+'-room-canvas'),b=canvas.getBoundingClientRect(),p=canvas.dataset.position.split(',').map(Number),c=createCivicRoomView(room).camera(b.width,b.height,p,true);return{x:b.x+stand[0]*1536*c.scale+c.x,y:b.y+stand[1]*1024*c.scale+c.y-22};},{prefix,room,stand:hotspot.stand});
    assert(point.x>0&&point.x<device.viewport.width&&point.y>0&&point.y<device.viewport.height,'Contact marker off screen '+JSON.stringify(point));
    if(device.hasTouch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
    await dialog.locator('#'+prefix+'-room-inspection[open]').waitFor({timeout:60000});assert.equal(await dialog.locator('#'+prefix+'-inspection-title').textContent(),hotspot.title);await shot(page,prefix+'-'+name+'-contact');await dialog.locator('#'+prefix+'-inspection-close').click();
    const other=room.hotspots.find(h=>h.id!==hotspot.id);await dialog.getByRole('button',{name:'Contacts',exact:true}).click();await dialog.locator('#'+prefix+'-target').selectOption(other.id);await dialog.locator('#'+prefix+'-approach').click();
    await page.waitForFunction(({p,stand,radius})=>{const c=document.getElementById(p+'-room-canvas'),pos=c.dataset.position.split(',').map(Number);return c.dataset.moving==='false'&&Math.hypot(pos[0]-stand[0],pos[1]-stand[1])<=radius;},{p:prefix,stand:other.stand,radius:other.radius},{timeout:60000});
    await dialog.locator('#'+prefix+'-interact').click();await dialog.locator('#'+prefix+'-room-inspection[open]').waitFor();assert.equal(await dialog.locator('#'+prefix+'-inspection-title').textContent(),other.title);await dialog.locator('#'+prefix+'-inspection-close').click();
    await dialog.locator('#'+prefix+'-zoom').click();assert.equal(await dialog.locator('#'+prefix+'-zoom').textContent(),'Follow officer');await dialog.locator('#'+prefix+'-zoom').click();assert.equal(await dialog.locator('#'+prefix+'-zoom').textContent(),'Whole room');
    if(name==='phone'){
     const position=(await canvas.getAttribute('data-position')).split(',').map(Number);await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.body.dataset.cityBoot==='ready',null,{timeout:240000});await dialog.waitFor({timeout:60000});await page.waitForFunction(p=>document.getElementById(p+'-room-canvas')?.dataset.loaded==='true',prefix);const resumed=(await canvas.getAttribute('data-position')).split(',').map(Number);assert(Math.hypot(position[0]-resumed[0],position[1]-resumed[1])<1e-8,'Room position changed on reload');
    }
    await dialog.locator('#'+prefix+'-exit').click();await dialog.waitFor({state:'hidden',timeout:60000});assert.deepEqual(await page.evaluate(()=>window.CWP21City.position()),entrance,'Wrong street return');
    results.flows.push({room:id,viewport:name,touch:!!device.hasTouch,enter:true,contactDrawer:true,walkToContact:true,tapMarker:true,dialogue:true,wholeRoomToggle:true,returnToSameStreet:true,reload:name==='phone',stageHeight:geometry.canvas.height});console.log('PASS',id,name);
   }
   assert.equal(errors.length,0,errors.join('\n'));assert.equal(missing.length,0,JSON.stringify(missing));await ctx.close();
  }
  results.passed=true;
 }catch(error){results.passed=false;results.error=error.stack;results.pages=[];for(const [i,p]of browser.contexts().flatMap(c=>c.pages()).entries()){results.pages.push(await p.evaluate(()=>({boot:document.body.dataset.cityBoot,text:document.body.innerText.slice(-8000),rooms:[...document.querySelectorAll('dialog[open]')].map(d=>({id:d.id,text:d.innerText.slice(0,3000)}))})).catch(()=>({closed:true})));await shot(p,'failure-'+i).catch(()=>{});}throw error;}
 finally{fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
