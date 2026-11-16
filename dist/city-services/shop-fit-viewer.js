(function(global){
 'use strict';
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 function createQuillFittedShops(host,options={}){
  const data=options.data||global.QUILL_FITTED_NPCS,M=global.QuillNPCMotion,base=options.assetRoot||'';
  if(!host||!M||!data?.characters?.length)throw new Error('Host, motion renderer and fitted NPC records required');
  let scene=data.scenes.find(s=>s.key===(options.shopKey||'shatta'))||data.scenes[0],person=0,mode='work',view='room',paused=false,closed=false,ready=false,revision=0,raf=null,actors=[],room=null;
  const clock=M.createClock(),cache=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  host.replaceChildren();host.classList.add('fitted-shop');
  if(options.counterMode)host.classList.add('shop-counter-mode');
  const toolbar=node('header','shop-toolbar'),label=node('label','','Shop '),select=node('select');select.setAttribute('aria-label','Choose shop');
  data.scenes.forEach(s=>{const o=node('option','',s.title);o.value=s.key;select.append(o);});label.append(select);toolbar.append(label);
  const tabs=node('div','shop-tabs'),buttons={};for(const [key,title] of [['room','Interior'],['character','Character']]){const b=node('button','',title);b.type='button';b.onclick=()=>{view=key;renderUI();};buttons[key]=b;tabs.append(b);}toolbar.append(tabs);host.append(toolbar);
  const title=node('h1','shop-title'),stage=node('div','shop-stage'),canvas=node('canvas'),hits=node('div','shop-hits');canvas.width=960;canvas.height=640;canvas.setAttribute('role','img');stage.append(canvas,hits);host.append(title,stage);
  const controls=node('div','shop-actions'),persons=node('div','shop-people'),motionLabel=node('label','','Motion '),motion=node('select');motion.setAttribute('aria-label','Motion mode');for(const [v,t] of [['work','Working'],['idle','Idle'],['still','Still']]){const o=node('option','',t);o.value=v;motion.append(o);}motionLabel.append(motion);const pause=node('button','','Pause'),talk=node('button','','Talk'),examine=node('button','','Examine'),browse=node('button','','Browse goods');for(const b of [pause,talk,examine,browse])b.type='button';controls.append(persons,motionLabel,pause,talk,examine,browse);host.append(controls);
  const status=node('p','shop-status');status.setAttribute('aria-live','polite');host.append(status);
  const dialog=node('dialog','cw-npc-dialogue');dialog.setAttribute('aria-label','Shop conversation');
  dialog.innerHTML='<div class="cw-dialogue-folio"><header class="cw-dialogue-top"><span>THE WATCH · CONVERSATIONS</span><button type="button" class="cw-dialogue-close" aria-label="Close conversation">Close <span aria-hidden="true">×</span></button></header><div class="cw-dialogue-spread"><aside class="cw-dialogue-profile"><div class="cw-dialogue-portrait"></div><p class="cw-dialogue-profile-caption">Shopkeeper</p></aside><section class="cw-dialogue-page"><div class="cw-dialogue-heading"></div><div class="cw-dialogue-content"></div></section></div></div>';
  host.append(dialog);dialog.querySelector('.cw-dialogue-close').onclick=()=>dialog.close();
  const tray=global.QuillShopTray&&global.QUILL_TRAY_ITEMS?global.QuillShopTray.createTray({host,items:global.QUILL_TRAY_ITEMS,assetRoot:base,onPurchase:options.onPreviewPurchase}):null;
  function browseGoods(){if(dialog.open)dialog.close();if(options.onBrowse){options.onBrowse(scene.key);return;}if(tray)tray.open(scene.key,browse);}
  const current=()=>data.characters.find(n=>n.key===scene.placements[person]?.key)||null;
  function load(file){if(!cache.has(file))cache.set(file,new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Unable to load '+file));im.src=base+file;}));return cache.get(file);}
  function portrait(target,npc){
   target.replaceChildren();const b=data.rigs[npc.key].bounds,[x0,y0,x1,y1]=b,W=x1-x0,H=y1-y0,svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
   // A bounded head/shoulder viewport of the SAME source preserves character identity.
   svg.setAttribute('viewBox',[x0+W*.13,y0,W*.76,H*.36].join(' '));svg.setAttribute('role','img');svg.setAttribute('aria-label',npc.name);svg.setAttribute('preserveAspectRatio','xMidYMid slice');svg.style.cssText='width:100%;height:100%;overflow:hidden';
   const im=document.createElementNS(svg.namespaceURI,'image');im.setAttribute('href',base+npc.asset);im.setAttribute('width',actors.find(a=>a.key===npc.key)?.image.naturalWidth||1536);im.setAttribute('height',actors.find(a=>a.key===npc.key)?.image.naturalHeight||1536);svg.append(im);target.append(svg);
  }
  function conversation(text){const n=current();dialog.querySelector('.cw-dialogue-heading').replaceChildren(node('h2','',n.name),node('p','cw-dialogue-kind',scene.title));const content=dialog.querySelector('.cw-dialogue-content');content.replaceChildren(node('p','cw-dialogue-speech',text));portrait(dialog.querySelector('.cw-dialogue-portrait'),n);const replies=node('div','cw-dialogue-responses');for(const [label,fn] of [['Ask about their work',()=>conversation(data.rigs[n.key].action+'.')],['Show me your goods',browseGoods],['Leave',()=>dialog.close()]]){const b=node('button','',label);b.type='button';b.onclick=fn;replies.append(b);}content.append(replies);if(!dialog.open)dialog.showModal();options.onTalk?.({npc:n,shop:scene,text});}
  function renderUI(){
   talk.disabled=examine.disabled=!ready||!current();browse.disabled=!ready||(!options.onBrowse&&(!tray||!global.QUILL_TRAY_ITEMS.some(x=>x.shopKey===scene.key)));browse.title=browse.disabled?'No goods available.':'';select.value=scene.key;title.textContent=scene.title;persons.replaceChildren();hits.replaceChildren();canvas.setAttribute('aria-label',scene.title+' — '+(view==='room'?(current()?'fitted shopkeepers':'counter'):current()?.name||'counter'));
   Object.entries(buttons).forEach(([k,b])=>b.setAttribute('aria-pressed',String(view===k)));
   scene.placements.forEach((p,i)=>{const n=data.characters.find(n=>n.key===p.key),b=node('button','',n.name);b.type='button';b.setAttribute('aria-pressed',String(i===person));b.onclick=()=>{person=i;renderUI();};persons.append(b);
    if(view==='room'){const r=data.rigs[p.key],W=p.height*(r.bounds[2]-r.bounds[0])/(r.bounds[3]-r.bounds[1])/1.5,hit=node('button','shop-hit');hit.type='button';hit.disabled=!ready;hit.setAttribute('aria-label','Speak with '+n.name);hit.style.left=(p.x-W*r.footU)*100+'%';hit.style.top=(p.y-p.height)*100+'%';hit.style.width=W*100+'%';hit.style.height=p.height*100+'%';hit.onclick=()=>{person=i;renderUI();conversation(n.dialogue.greeting);};hits.append(hit);}
   });
   status.textContent=current()?data.rigs[current().key].action+'.':'Choose goods at the counter.';
  }
  async function setShop(key){const found=data.scenes.find(s=>s.key===key);if(!found)throw new Error('Unknown shop');const ticket=++revision;scene=found;person=0;ready=false;canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);if(dialog.open)dialog.close();tray?.close();renderUI();status.textContent='Loading shop artwork…';
   try{const loadedRoom=options.counterMode?null:await load(scene.image),loaded=await Promise.all(scene.placements.map(async p=>{const n=data.characters.find(n=>n.key===p.key);return {key:p.key,image:await load(n.asset),rig:data.rigs[p.key],workImage:!options.counterMode&&p.workAsset?await load(p.workAsset):null,workRig:p.workRig?data.rigs[p.workRig]:null,placement:p};}));if(closed||ticket!==revision)return;room=loadedRoom;actors=loaded;ready=true;renderUI();}catch(e){if(ticket===revision)status.textContent=e.message;options.onError?.(e);}
  }
  function frame(now){if(closed)return;const visible=options.isVisible?options.isVisible():true,stopped=paused||!visible||document.hidden||dialog.open||tray?.isOpen()||reduced.matches,t=clock.tick(now,stopped);
   if(ready&&visible&&!document.hidden){const ctx=canvas.getContext('2d'),m=reduced.matches?'still':mode;
    try{if(view==='room'||!current())M.renderScene(ctx,room,actors,canvas.width,canvas.height,t,m);else{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#29332f';ctx.fillRect(0,0,canvas.width,canvas.height);const a=actors.find(a=>a.key===current().key);M.drawNPC(ctx,a.image,a.rig,{x:canvas.width*.5,y:canvas.height*.93,height:canvas.height*.82*a.rig.relativeHeight},t,m);}}
    catch(e){mode='still';motion.value='still';status.textContent='Static fallback: serve these files from one local or hosted origin to enable canvas motion.';options.onError?.(e);}
   }
   raf=requestAnimationFrame(frame);
  }
  if(options.gameMode){tabs.hidden=true;motionLabel.hidden=true;pause.hidden=true;}
  browse.onclick=browseGoods;select.onchange=()=>setShop(select.value);motion.onchange=()=>{mode=motion.value;renderUI();};pause.onclick=()=>{paused=!paused;pause.textContent=paused?'Resume':'Pause';pause.setAttribute('aria-pressed',String(paused));};talk.onclick=()=>conversation(current().dialogue.greeting);examine.onclick=()=>conversation(current().dialogue.examine);
  const resize=()=>{const w=Math.max(240,Math.min(960,Math.round(stage.clientWidth*(global.devicePixelRatio||1))));if(canvas.width!==w){canvas.width=w;canvas.height=Math.round(w/1.5);}};const observer=new ResizeObserver(resize);observer.observe(stage);
  setShop(scene.key);raf=requestAnimationFrame(frame);
  return {setShop,setView(key){if(!['room','character'].includes(key))throw new Error('Unknown view');view=key;renderUI();},setMode(key){if(!['work','idle','still'].includes(key))throw new Error('Unknown mode');mode=key;motion.value=key;renderUI();},getState(){return {shop:scene.key,npc:current()?.key||null,mode,view,ready,paused};},destroy(){closed=true;revision++;cancelAnimationFrame(raf);observer.disconnect();tray?.destroy();if(dialog.open)dialog.close();host.replaceChildren();}};
 }
 global.createQuillFittedShops=createQuillFittedShops;
})(window);
