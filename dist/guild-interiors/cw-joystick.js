/* Circular movement input. Every request still passes through the scene's existing step/collision adapter. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.CWJoystick=api;(root.CW_R2_PARTS=root.CW_R2_PARTS||[]).push('cw-joystick.js');}})(globalThis,function(root){
 'use strict';
 const names=['east','south-east','south','south-west','west','north-west','north','north-east'];
 const street={ne:[0,-1],se:[1,0],sw:[0,1],nw:[-1,0]};
 const bridge={ne:[-1,0],se:[0,-1],sw:[1,0],nw:[0,1]};
 const order=[['ne','se'],['se'],['se','sw'],['sw'],['sw','nw'],['nw'],['nw','ne'],['ne']];
 const keyboard={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
 function sector(x,y,previous=null){
  const angle=(Math.atan2(y,x)+Math.PI*2)%(Math.PI*2),width=Math.PI/4;
  if(previous!==null){const distance=Math.abs(Math.atan2(Math.sin(angle-previous*width),Math.cos(angle-previous*width)));if(distance<=width/2+Math.PI/36)return previous;}
  return Math.round(angle/width)%8;
 }
 function plan(index,projection='street'){
  if(projection==='orthogonal')return [[[1,0]],[[1,1]],[[0,1]],[[-1,1]],[[-1,0]],[[-1,-1]],[[0,-1]],[[1,-1]]][index].map(vector=>vector.slice());
  const axes=projection==='bridge'?bridge:street;
  // Eight screen headings map to eight direct grid vectors. Straight screen
  // travel is a guarded logical diagonal; the scene collision adapter accepts
  // it only when both adjoining source edges and the destination are clear.
  // Keeping it as one vector lets the actor interpolate along one straight
  // segment instead of visibly zigzagging between two cardinal edges.
  return [order[index].reduce((sum,key)=>[sum[0]+axes[key][0],sum[1]+axes[key][1]],[0,0])];
 }
 function editable(target){return !!target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])');}
 let serial=0;
 function mount({element,buttons=[],step,onEngage=()=>{},onStop=()=>{},blocked=()=>false,context=()=>null,stepMS=160,keyMap=keyboard,keyboardSpace='world',projection='street',startZone=.23,stopZone=.17,driveByFrame=false,frameDriven=false,onDrive=null,host=root,document:doc=host.document}){
  if(!element||!doc||typeof step!=='function')throw Error('Movement joystick needs an element and step adapter');
  if(element.cwJoystick)return element.cwJoystick;
  const listeners=[],id='cw-stick-'+(++serial),surface=doc.createElement('div'),grip=doc.createElement('span'),caption=doc.createElement('p'),fallback=doc.createElement('details'),summary=doc.createElement('summary'),single=doc.createElement('div');
  element.classList.add('cw-joystick-control');surface.className='cw-joystick';surface.tabIndex=0;surface.setAttribute('role','group');surface.setAttribute('aria-label','Movement joystick');surface.setAttribute('aria-describedby',id);surface.dataset.direction='stopped';
  grip.className='cw-joystick-grip';grip.setAttribute('aria-hidden','true');surface.append(grip);
  for(const angle of [0,45,90,135,180,225,270,315]){const mark=doc.createElement('span');mark.className='cw-joystick-mark'+(angle%90===0?' cw-joystick-mark-straight':'');mark.style.setProperty('--angle',angle+'deg');mark.setAttribute('aria-hidden','true');surface.append(mark);}
  caption.id=id;caption.className='cw-joystick-help';caption.textContent='Drag in 8 directions · release to stop';surface.setAttribute('title','Drag to walk; release to stop. Arrow keys or WASD also work.');
  fallback.className='cw-step-controls';summary.textContent='Step controls';single.className='cw-step-buttons';single.append(...buttons);fallback.append(summary,single);element.replaceChildren(surface,caption,fallback);
  let owner=null,timer=null,timerMS=null,held=null,activePlan=[],phase=0,lastSector=null,destroyed=false,acceptedMS=null,lastTickAt=-Infinity;
  const heldKeys=new Map(),clock=()=>host.performance?.now?.()??Date.now();
  function listen(target,name,fn,capture=false){target.addEventListener(name,fn,capture);listeners.push(()=>target.removeEventListener(name,fn,capture));}
  function isBlocked(){return destroyed||element.isConnected===false||element.inert||doc.hidden||blocked();}
  function clearTimer(){if(timer!==null){host.clearInterval(timer);timer=null;timerMS=null;}}
  function resetVisual(){grip.style.setProperty('--stick-x','0px');grip.style.setProperty('--stick-y','0px');surface.dataset.direction='stopped';surface.dataset.held='false';}
  function stop(){
   const previous=owner;heldKeys.clear();owner=null;held=null;activePlan=[];phase=0;lastSector=null;acceptedMS=null;lastTickAt=-Infinity;clearTimer();resetVisual();
   if(previous?.type==='pointer')try{if(surface.hasPointerCapture?.(previous.id))surface.releasePointerCapture(previous.id);}catch{}
   if(previous)onStop();
  }
  function tick(){
   if(isBlocked()||owner&&owner.context!==context()){stop();return;}if(!owner||!activePlan.length)return;
   lastTickAt=clock();
   const vector=activePlan[phase++%activePlan.length],result=step(...vector);
   // A scene may return its accepted segment duration (for safe wall slides).
   acceptedMS=Number.isFinite(result?.duration)&&result.duration>0?result.duration:null;
   if(isBlocked())stop();else syncTimer();
  }
  function cadence(){return acceptedMS??stepMS*(activePlan.length?Math.hypot(...activePlan[0]):1);}
  function syncTimer(){if(!owner)return;const ms=cadence();if(timer!==null&&timerMS===ms)return;clearTimer();timerMS=ms;timer=host.setInterval(tick,ms);}
  function startTimer(immediate){if(driveByFrame){
   if(!onDrive||!owner)return;
   onDrive(activePlan[0]?.slice()||[0,0],clock(),true);if(!activePlan.length){clearTimer();return;}
   if(!frameDriven&&timer===null){timerMS=16;timer=host.setInterval(()=>{if(isBlocked()||owner&&owner.context!==context()){stop();return;}onDrive(activePlan[0]?.slice()||[0,0],clock(),false);},16);}return;
  }if(timer!==null||!owner||!activePlan.length)return;if(immediate)tick();if(owner&&!isBlocked())syncTimer();}
  function keyboardPlan(){
   const vectors=[...heldKeys.values()],vector=[0,1].map(axis=>Number(vectors.some(v=>v[axis]>0))-Number(vectors.some(v=>v[axis]<0)));activePlan=vector.some(Boolean)?[vector]:[];phase=0;
   const mode=typeof projection==='function'?projection():projection;
   if(keyboardSpace==='screen'&&activePlan.length)activePlan=plan(sector(...vector),mode);
   const [x,y]=vector,screen=keyboardSpace==='screen'||mode==='orthogonal'?[x,y]:mode==='bridge'?[-x-y,x-y]:[x-y,x+y];
   surface.dataset.direction=activePlan.length?names[sector(...screen)]:'stopped';
  }
  function point(event){
   const rect=surface.getBoundingClientRect(),radius=Math.max(1,Math.min(rect.width,rect.height)/2),x=event.clientX-rect.left-rect.width/2,y=event.clientY-rect.top-rect.height/2,distance=Math.hypot(x,y);
   if(!Number.isFinite(distance))return;
   const travel=radius*.49,scale=distance>travel?travel/distance:1;
   grip.style.setProperty('--stick-x',(x*scale).toFixed(2)+'px');grip.style.setProperty('--stick-y',(y*scale).toFixed(2)+'px');
   // A small centre zone suppresses thumb drift; a smaller stop zone prevents chatter at its edge.
   if(distance<radius*(activePlan.length ? stopZone : startZone)){const moving=activePlan.length;activePlan=[];lastSector=null;phase=0;surface.dataset.direction='stopped';if(moving)onStop();if(driveByFrame)clearTimer();return;}
   const wasStopped=!activePlan.length;
   const next=sector(x,y,lastSector);if(next!==lastSector){lastSector=next;activePlan=plan(next,typeof projection==='function'?projection():projection);phase=0;surface.dataset.direction=names[next];}
   // Re-engaging after a centre pause is immediate once the prior step has
   // finished. Brief centre jitter still cannot mint extra movement requests.
   if(wasStopped&&timer!==null&&clock()-lastTickAt>=timerMS)clearTimer();
   startTimer(true);
  }
  listen(surface,'pointerdown',event=>{
   if(event.button>0||event.isPrimary===false||owner?.type==='pointer'||isBlocked())return;
   event.preventDefault();stop();onEngage();if(isBlocked())return;owner={type:'pointer',id:event.pointerId,context:context()};surface.dataset.held='true';
   try{surface.setPointerCapture(event.pointerId);}catch{}surface.focus({preventScroll:true});point(event);
  });
  listen(host,'pointermove',event=>{if(owner?.type!=='pointer'||event.pointerId!==owner.id)return;if(isBlocked()||owner.context!==context()){stop();return;}event.preventDefault();point(event);});
  const release=event=>{if(owner?.type==='pointer'&&(event.pointerId===undefined||event.pointerId===owner.id))stop();};
  for(const name of ['pointerup','pointercancel'])listen(host,name,release);
  listen(surface,'lostpointercapture',release);
  listen(doc,'pointerdown',event=>{if(owner&&!element.contains(event.target)&&(owner.type!=='pointer'||event.pointerId===undefined||event.pointerId===owner.id))stop();},true);
  listen(host,'keydown',event=>{
   const key=event.key?.length===1?event.key.toLowerCase():event.key,vector=keyMap[key];
   if(key==='Escape'){stop();return;}
   if(!vector)return;
   if(isBlocked()||event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey||editable(event.target))return;
   event.preventDefault();const code=event.code||key;if(event.repeat||heldKeys.has(code))return;
   if(owner?.type==='keyboard'&&owner.context===context()){
    heldKeys.set(code,vector);held=code;owner.id=code;keyboardPlan();startTimer(false);return;
   }
   stop();onEngage();if(isBlocked())return;owner={type:'keyboard',id:code,context:context()};held=code;heldKeys.set(code,vector);keyboardPlan();startTimer(true);
  });
  listen(host,'keyup',event=>{const key=event.key?.length===1?event.key.toLowerCase():event.key,code=event.code||key;heldKeys.delete(code);if(owner?.type!=='keyboard')return;if(!heldKeys.size){stop();return;}keyboardPlan();if(driveByFrame&&onDrive)startTimer(false);});
  for(const name of ['blur','pagehide','resize'])listen(host,name,()=>{stop();heldKeys.clear();});
  listen(doc,'visibilitychange',()=>{if(doc.hidden){stop();heldKeys.clear();}});
  listen(doc,'focusin',event=>{if(isBlocked()||editable(event.target)||event.target?.closest?.('button,a,summary'))stop();});
  listen(host,'cw:p20-modal',event=>{if(event.detail?.open)stop();});
  listen(fallback,'toggle',()=>stop());
  for(const button of buttons){button.type='button';listen(button,'click',event=>{
   if(isBlocked())return;event.preventDefault();stop();onEngage();if(isBlocked())return;
   const raw=button.dataset.m||button.dataset.cityStep||button.dataset.bridgeStep,vector=raw?.split(',').map(Number);
   if(vector?.length===2&&vector.every(Number.isFinite)&&Math.abs(vector[0])+Math.abs(vector[1])===1){step(...vector);onStop();}
  });}
  const api=Object.freeze({stop,vector(){if(isBlocked()||owner&&owner.context!==context()){stop();return [0,0];}return owner&&activePlan.length?activePlan[0].slice():[0,0];},destroy(){stop();destroyed=true;for(const remove of listeners)remove();delete element.cwJoystick;},report:()=>({version:'1.2',source:owner?.type||null,pointerId:owner?.type==='pointer'?owner.id:null,key:held,direction:surface.dataset.direction,repeating:driveByFrame?!!owner&&activePlan.length>0:timer!==null&&activePlan.length>0,frameDriven:!!frameDriven,stepMS})});
  resetVisual();element.cwJoystick=api;return api;
 }
 return Object.freeze({version:'1.1',mount,sector,plan,keyboard});
});
