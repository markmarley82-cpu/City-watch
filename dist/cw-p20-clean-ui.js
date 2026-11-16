/* P20 Base 0.4 — screenshot-led presentation repair by Buddy.
 * Reparents original buttons; never replaces their game callbacks or item data.
 * Review mode is explicit and session-local. Source art/maps remain unchanged.
 */
(function(){'use strict';
 const byId=id=>document.getElementById(id),app=byId('app'),scene=byId('scene');
 if(!app||!scene)return;
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='cw-p20-clean-ui.css?v=p21-b407-s039-reuse'+encodeURIComponent(window.CW_LAB_RELEASE.version);document.head.appendChild(sheet);
 app.classList.add('cw-clean-play');
 const actions=app.querySelector(':scope > .actions'),controls=app.querySelector(':scope > .controls');
 if(actions&&controls){
  const dock=document.createElement('section');dock.id='cw-p20-dock';dock.setAttribute('aria-label','Movement and game actions');
  const tools=document.createElement('div');tools.id='cw-p20-tools';
  const dpad=controls.querySelector('.dpad'),quick=controls.querySelector('.quick');
  app.insertBefore(dock,actions);if(dpad)dock.appendChild(dpad);
  dock.appendChild(tools);tools.appendChild(actions);if(quick)tools.appendChild(quick);controls.remove();
 }
 for(const [id,caption]of [['patrol','Patrol'],['combat','Attack']]){const e=byId(id);if(e){e.textContent=caption;e.setAttribute('aria-label',caption);}}
 const guide=byId('guide');if(guide){guide.textContent='⌖';guide.setAttribute('aria-label','Guide to current objective');guide.title='Guide to current objective';}
 const log=app.querySelector('.log'),speaker=byId('speaker'),message=byId('message');
 const history=[];let lastMessage='',toastTimer=null,previousFocus=null;
 const live=document.createElement('div');live.className='cw-visually-hidden';live.setAttribute('aria-live','polite');document.body.appendChild(live);
 const reader=document.createElement('dialog');reader.id='cw-clean-reader';reader.setAttribute('aria-labelledby','cw-clean-reader-title');
 reader.innerHTML='<header><h2 id="cw-clean-reader-title">Recent messages</h2><button type="button" aria-label="Close recent messages">×</button></header><div class="entries"></div>';
 document.body.appendChild(reader);
 const hideToast=()=>{clearTimeout(toastTimer);log?.classList.remove('is-visible');};
 const dismissReader=()=>{if(!reader.open)return;reader.close();window.CW_P20_INPUT_BLOCKED=false;window.dispatchEvent(new CustomEvent('cw:p20-modal',{detail:{open:false}}));const target=previousFocus?.isConnected&&previousFocus.getClientRects().length?previousFocus:byId('p13-menu-launch');target?.focus({preventScroll:true});};
 function showRecent(){
  hideToast();if(reader.open)return;
  previousFocus=document.activeElement;
  const content=reader.querySelector('.entries');content.replaceChildren();
  const visible=history.filter(e=>window.CW_P20_DEV_REVIEW||!e.debug);
  if(!visible.length){const p=document.createElement('p');p.textContent='No messages yet.';content.appendChild(p);}
  for(const entry of visible.slice().reverse()){
   const a=document.createElement('article'),h=document.createElement('small'),p=document.createElement('p');
   h.textContent=entry.speaker+(entry.time?' · '+entry.time:'');p.textContent=entry.text;a.append(h,p);content.appendChild(a);
  }
  window.CW_P20_INPUT_BLOCKED=true;
  app.querySelectorAll('.dpad button').forEach(b=>b.dispatchEvent(new Event('pointercancel')));
  window.dispatchEvent(new CustomEvent('cw:p20-modal',{detail:{open:true}}));
  reader.showModal();reader.querySelector('button').focus();
 }
 reader.querySelector('button').onclick=dismissReader;
 reader.addEventListener('cancel',e=>{e.preventDefault();dismissReader();});
 reader.addEventListener('click',e=>{if(e.target===reader){const r=reader.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dismissReader();}});
 if(log){log.classList.add('cw-clean-toast');scene.appendChild(log);log.setAttribute('role','button');log.setAttribute('tabindex','0');log.setAttribute('aria-live','off');log.setAttribute('aria-label','Read the complete message and recent messages');log.onclick=showRecent;log.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showRecent();}};log.addEventListener('focusin',()=>clearTimeout(toastTimer));log.addEventListener('mouseenter',()=>clearTimeout(toastTimer));log.addEventListener('focusout',()=>{toastTimer=setTimeout(hideToast,6000);});log.addEventListener('mouseleave',()=>{if(document.activeElement!==log)toastTimer=setTimeout(hideToast,6000);});}
 function capture(){
  const text=message?.textContent||'',who=speaker?.textContent||'',key=who+'\n'+text;if(!text||key===lastMessage)return;lastMessage=key;
  const debug=/^(QA\b|P20\b.*CHECK)/i.test(who);
  history.push({speaker:who,text,time:byId('time')?.textContent||'',debug});if(history.length>60)history.shift();
  if(debug&&!window.CW_P20_DEV_REVIEW){hideToast();return;}
  live.textContent=who+': '+text;log?.classList.add('is-visible');clearTimeout(toastTimer);toastTimer=setTimeout(hideToast,6000);
 }
 if(message&&speaker){const observer=new MutationObserver(capture);observer.observe(message,{childList:true,subtree:true,characterData:true});observer.observe(speaker,{childList:true,subtree:true,characterData:true});capture();}
 const grid=byId('p13-menu-grid'),menu=byId('p13-menu');
 const reviewButtons=grid?[...grid.querySelectorAll('button')].filter(b=>/P20 base review|Wall \/ scale review|HUD touch-layout check/.test(b.textContent)):[];
 reviewButtons.forEach(b=>b.classList.add('cw-review-item'));
 function tool(label,fn){if(!grid)return null;const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{menu?.classList.remove('open');fn();};grid.appendChild(b);return b;}
 const recentButton=tool('Recent messages',showRecent);
 const cameraButton=tool('Camera controls',()=>app.classList.toggle('cw-camera-open'));
 const modeButton=tool('Developer review: off',()=>setReview(!window.CW_P20_DEV_REVIEW));
 function setReview(enabled){
  const next=!!enabled,was=!!window.CW_P20_DEV_REVIEW;
  if(was&&!next)window.CW_P20_BASE?.leaveReview?.();
  window.CW_P20_DEV_REVIEW=next;app.classList.toggle('cw-review-mode',next);
  reviewButtons.forEach(b=>b.hidden=!next);
  if(modeButton){modeButton.textContent=next?'Leave developer review':'Developer review: off';modeButton.setAttribute('aria-pressed',String(next));}
  if(!next){window.CW_P20_BASE?.setFrontage(false);window.CW_WALL108_QA?.dismissBadge?.();window.CW_P16_EQUIPMENT?.setPresentation('sack');hideToast();}
 }
 setReview(!!window.CW_P20_DEV_REVIEW);
 const menuTitle=byId('p13-menu-panel')?.querySelector('h2');if(menuTitle)menuTitle.textContent='Watch tools';
 const menuSub=byId('p13-menu-panel')?.querySelector('p');if(menuSub)menuSub.textContent=window.CW_LAB_RELEASE.label+' · '+window.CW_LAB_RELEASE.purpose;
 let attempts=0;const engineReady=setInterval(()=>{
  if(++attempts>600){clearInterval(engineReady);return;}
  const camera=byId('city-camera');if(!camera||!window.CW_P20_BASE)return;
  clearInterval(engineReady);setReview(!!window.CW_P20_DEV_REVIEW);
  const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Hide camera controls');close.onclick=()=>app.classList.remove('cw-camera-open');camera.appendChild(close);
 },50);
 window.CW_P20_CLEAN_UI={version:'P20-CLEAN-04',showRecent,hideToast,setReview,report(){return{reviewMode:!!window.CW_P20_DEV_REVIEW,historyCount:history.length,visibleReviewButtons:reviewButtons.filter(b=>!b.hidden).length,dockPresent:!!byId('cw-p20-dock'),sceneHeight:scene.getBoundingClientRect().height,viewportHeight:window.visualViewport?.height||innerHeight,notes:'Local presentation only; phone visual acceptance remains Mark-owned'};}};
})();
