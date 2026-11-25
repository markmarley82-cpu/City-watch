const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const out='qa-results/atlas-labels',results={physicalDeviceVerified:false,flows:[]};fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost'),root=path.resolve('dist');if(!u.pathname.startsWith('/City-watch/')){res.writeHead(404);return res.end();}const file=path.resolve(root,decodeURIComponent(u.pathname.slice(12))||'index.html');if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}const mime={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.mp3':'audio/mpeg','.ogg':'audio/ogg'};res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
async function shot(page,name){await page.screenshot({path:out+'/'+name+'.jpg',type:'jpeg',quality:80});}
async function geometry(page,stage){
 await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const data=await page.evaluate(()=>{
  const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
  const visible=e=>e&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
  const root=document.getElementById('atlas-dialog'),viewport=root.querySelector('.atlas-image'),plane=root.querySelector('.atlas-map-plane');
  return{bounds:rect(viewport),labels:[...plane.querySelectorAll('.atlas-pin-label,.atlas-area-name,.atlas-street-name')].filter(visible).map(e=>({text:e.textContent,...rect(e)})),obstacles:[...root.querySelectorAll('.atlas-player-pin,.atlas-beat-pin,.atlas-map-cartouche,.atlas-map-controls,.atlas-index-toggle,.atlas-place-index,.atlas-area-picker,#atlas-close')].filter(visible).map(rect),pins:[...plane.querySelectorAll('.atlas-place-pin')].map(e=>({id:e.dataset.placeId,left:e.style.left,top:e.style.top,position:e.dataset.position})),zoom:Number(viewport.dataset.zoom)};
 });
 const overlap=(a,b)=>a.x<b.x+b.width-.1&&a.x+a.width>b.x+.1&&a.y<b.y+b.height-.1&&a.y+a.height>b.y+.1;
 assert(data.labels.length>0,'No readable labels at '+stage);
 for(const [i,l]of data.labels.entries()){
  assert(l.x>=data.bounds.x-1&&l.y>=data.bounds.y-1&&l.x+l.width<=data.bounds.x+data.bounds.width+1&&l.y+l.height<=data.bounds.y+data.bounds.height+1,'Clipped label at '+stage+': '+l.text);
  for(const other of data.labels.slice(i+1))assert(!overlap(l,other),'Overlapping labels at '+stage+': '+l.text+' / '+other.text);
  for(const obstacle of data.obstacles)assert(!overlap(l,obstacle),'Label under map control or player at '+stage+': '+l.text);
 }
 const controls=await page.locator('#atlas-dialog').evaluate(d=>[...d.querySelectorAll('.atlas-map-cartouche,.atlas-map-controls,.atlas-index-toggle,.atlas-place-index,.atlas-area-picker,#atlas-close')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};}));for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++)assert(!overlap(controls[i],controls[j]),'Map controls overlap at '+stage);
 return data;
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/City-watch/',browser=await chromium.launch();
 try{
  for(const device of [{name:'phone',viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2},{name:'landscape',viewport:{width:844,height:390},isMobile:true,hasTouch:true},{name:'tablet',viewport:{width:768,height:1024},hasTouch:true},{name:'desktop',viewport:{width:1280,height:900}}]){
   const {name,...opts}=device,ctx=await browser.newContext(opts),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'index.html?lighting-preview=day',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>['ready','failed'].includes(document.body.dataset.cityBoot),null,{timeout:240000});assert.equal(await page.evaluate(()=>document.body.dataset.cityBoot),'ready');
   await page.locator('#character-studio[open]').waitFor({timeout:60000});await page.locator('#character-apply').click();await page.locator('#cw-oath-name').fill('Atlas QA');await page.locator('.cw-oath-submit').click();await page.locator('#cw-first-patrol-briefing[open]').waitFor();await page.getByRole('button',{name:'Start patrol',exact:true}).click();
   const before=await page.evaluate(()=>CWP21City.position());await page.locator('#atlas-open').click();const viewport=page.locator('.atlas-image');
   await page.waitForFunction(()=>document.querySelector('.atlas-map-plane')?.dataset.labelsPlaced!==undefined);
   const first=await geometry(page,'initial');assert(first.pins.length>40);await shot(page,name+'-initial');
   for(let i=0;i<2;i++){const out=page.getByRole('button',{name:'Zoom map out',exact:true});if(await out.isEnabled())await out.click();}await geometry(page,'overview');await shot(page,name+'-overview');
   for(let i=0;i<4;i++)await page.getByRole('button',{name:'Zoom map in',exact:true}).click();await geometry(page,'zoomed');
   await viewport.focus();const scroll=await viewport.evaluate(e=>e.scrollLeft);await page.keyboard.press('ArrowRight');assert((await viewport.evaluate(e=>e.scrollLeft))>scroll);await geometry(page,'keyboard pan');
   await page.getByRole('combobox',{name:'Districts and areas',exact:true}).selectOption({label:'Watch Quarter'});await geometry(page,'district focus');
   const watch=page.locator('.atlas-place-pin[data-place-id="watch"]');await watch.focus();await geometry(page,'focused landmark');assert.equal(await watch.getAttribute('aria-label'),'Watch House');
   if(device.hasTouch){
    const points=await viewport.evaluate(e=>{const r=e.getBoundingClientRect();for(const fy of [.5,.4,.6,.7]){const ps=[{x:r.x+r.width*.4,y:r.y+r.height*fy},{x:r.x+r.width*.6,y:r.y+r.height*fy}];if(ps.every(p=>!document.elementFromPoint(p.x,p.y)?.closest('button,select')))return ps;}throw Error('No clear pinch points');});
    const cdp=await ctx.newCDPSession(page),old=Number(await viewport.getAttribute('data-zoom'));const mid=(points[0].x+points[1].x)/2;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points.map((p,i)=>({...p,id:i}))});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:points.map((p,i)=>({...p,x:mid+(p.x-mid)*.8,id:i}))});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();await geometry(page,'pinch');assert(Number(await viewport.getAttribute('data-zoom'))<old);
   }
   await page.getByRole('button',{name:'Places',exact:true}).click();await page.getByRole('combobox',{name:'Destination',exact:true}).selectOption('drum');const chosen=await geometry(page,'selected destination');assert.deepEqual(chosen.pins,first.pins,'Map pins moved while labels were laid out');assert.equal(await page.locator('.atlas-place-pin[data-place-id="drum"]').getAttribute('aria-pressed'),'true');
   const route=JSON.parse(await viewport.getAttribute('data-route'));assert(route.length>1,'No walking route to selected destination');assert((await page.locator('.atlas-route-line').getAttribute('points')).length>0);await shot(page,name+'-route');
   if(name==='phone'){await page.setViewportSize({width:844,height:390});await geometry(page,'resized landscape');await shot(page,name+'-resized');}
   assert.deepEqual(await page.evaluate(()=>CWP21City.position()),before,'Map layout moved the player');
   await page.getByRole('button',{name:'Walk here',exact:true}).click();await page.locator('#atlas-dialog').waitFor({state:'hidden'});await page.waitForFunction(p=>CWP21City.position().some((v,i)=>v!==p[i]),before,{timeout:15000});await page.evaluate(()=>CWP21City.stop());
   assert.deepEqual(errors,[]);results.flows.push({viewport:name,noLabelOverlap:true,noControlOverlap:true,overview:true,zoom:true,pan:true,districtFocus:true,keyboardFocus:true,pinch:!!device.hasTouch,unchangedPins:true,markedRoute:true,walkHere:true,resize:name==='phone'});console.log('PASS atlas labels and navigation',name);await ctx.close();
  }
  results.passed=true;
 }catch(error){results.passed=false;results.error=error.stack;for(const [i,p]of browser.contexts().flatMap(c=>c.pages()).entries()){results.failure=await p.evaluate(()=>({boot:document.body.dataset.cityBoot,text:document.body.innerText.slice(-5000)})).catch(()=>null);await shot(p,'failure-'+i).catch(()=>{});}throw error;}
 finally{fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
