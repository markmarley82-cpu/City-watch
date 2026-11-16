/* A read-only view of real patrol state; action buttons use existing callbacks. */
(() => {
 'use strict';
 const dialog=document.createElement('dialog');dialog.className='cw-patrol-dialog';dialog.id='cw-patrol-details';
 dialog.setAttribute('aria-labelledby','cw-patrol-title');
 dialog.innerHTML='<header><h2 id="cw-patrol-title">Patrol details</h2><button type="button" data-text-close>Close</button></header><p data-text-location></p><p data-text-position></p><p data-text-objective></p><p data-text-stats></p><h3>Nearby</h3><ul data-text-nearby></ul><h3>Available moves</h3><p data-text-moves></p><div class="cw-text-actions"></div><p>Use the direction buttons or arrow keys to walk. These details follow the current patrol; opening them does not advance a quest.</p>';
 document.body.append(dialog);
 const live=document.createElement('p');live.className='cw-live-patrol';live.id='cw-patrol-live';live.setAttribute('role','status');live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');document.body.append(live);
 let previousFocus=null,previousBlocked=false,lastAnnouncement='',timer,held=false;
 const state=()=>window.CW_PATROL_DESCRIPTION?.();
 function render(){
  const v=state();if(!v){dialog.querySelector('[data-text-location]').textContent='The patrol is still loading. Close this view and try again when the city appears.';return;}
  for(const key of ['location','position','objective','stats','moves'])dialog.querySelector('[data-text-'+key+']').textContent=v[key]||'';
  const list=dialog.querySelector('[data-text-nearby]');list.replaceChildren();
  for(const text of v.nearby?.length?v.nearby:['No people or doors within the reported range.']){const li=document.createElement('li');li.textContent=text;list.append(li);}
  const actions=dialog.querySelector('.cw-text-actions');actions.replaceChildren();
  for(const a of v.actions||[]){const source=a.id?document.getElementById(a.id):null;if(!a.hotspot&&(!source||source.disabled))continue;const b=document.createElement('button');b.type='button';b.textContent=a.label;b.onclick=()=>{close();if(a.hotspot)window.CW_PATROL_ACT?.(a.hotspot);else source.click();};actions.append(b);}
 }
 function restore(){if(!held)return;held=false;window.CW_P20_INPUT_BLOCKED=previousBlocked;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});}
 function close(){if(!dialog.open)return;dialog.close();restore();}
 dialog.querySelector('[data-text-close]').onclick=close;
 dialog.addEventListener('close',restore);
 function open(){if(dialog.open)return;previousFocus=document.activeElement;previousBlocked=!!window.CW_P20_INPUT_BLOCKED;render();held=true;window.CW_P20_INPUT_BLOCKED=true;dialog.showModal();dialog.querySelector('[data-text-close]').focus();}
 const launcher=document.createElement('button');launcher.type='button';launcher.className='cw-text-launch';launcher.id='cw-patrol-details-open';launcher.textContent='Patrol details · text view';
 launcher.onclick=()=>{document.getElementById('p13-menu')?.classList.remove('open');open();};
 const host=document.getElementById('p13-menu-grid')||document.querySelector('.city-tools,.bridge-tools');if(host?.id!=='p13-menu-grid'){launcher.textContent='Details';launcher.setAttribute('aria-label','Patrol details · text view');}host?.append(launcher);
 document.querySelectorAll('canvas#game,canvas#city-scene,canvas#bridge-scene').forEach(c=>{c.tabIndex=0;c.setAttribute('aria-describedby','cw-patrol-live');});
 // Include action availability when campaign bindings finish loading, without
 // announcing every ambient NPC tick or clock minute.
 timer=setInterval(()=>{if(document.hidden||dialog.open||document.querySelector('dialog[open],#watch-notebook.open,#p13-menu.open'))return;const v=state();if(!v)return;const key=[v.location,v.position,v.objective,v.stats,(v.actions||[]).map(a=>a.id+':'+a.label).join('|')].join('|');if(key===lastAnnouncement)return;lastAnnouncement=key;live.textContent=[v.location,v.position,v.objective,v.stats,...(v.nearby||[]),v.moves].filter(Boolean).join('. ');},1200);
 addEventListener('pagehide',()=>clearInterval(timer));
 // Keep movement shortcuts off native controls and out of open overlays.
 const custom=()=>[...document.querySelectorAll('#p13-menu.open #p13-menu-panel,#cw-p17-overlay.open .cw-p17-shell,#npc-panel-p11:not([hidden]),#cw-dossier-overlay.open [role="dialog"]')].find(e=>e.getClientRects().length);
 const nativeDialogControls=nativeDialog=>[...new Set(nativeDialog.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),audio[controls],summary,[tabindex]:not([tabindex="-1"])'))].filter(control=>{
  if(control.hidden||control.disabled||control.tabIndex<0)return false;
  const closed=control.closest('details:not([open])');if(closed&&control!==closed.querySelector(':scope > summary'))return false;
  const style=getComputedStyle(control);return style.display!=='none'&&style.visibility!=='hidden'&&control.getClientRects().length>0;
 });
 document.addEventListener('keydown',e=>{
  const nativeDialog=document.querySelector('dialog[open]');
  if(nativeDialog&&e.key==='Tab'){
   const controls=nativeDialogControls(nativeDialog);
   const at=controls.indexOf(document.activeElement);
   if(e.shiftKey&&at<=0){e.preventDefault();controls.at(-1)?.focus();}
   else if(!e.shiftKey&&(at<0||at===controls.length-1)){e.preventDefault();controls[0]?.focus();}
  }
  // Let a native dialog's own tabs/radios receive their key events.
  // Block gameplay after the target handlers run, not during capture.
  if(nativeDialog)return;
  const modal=custom();
  if(modal){
   const controls=[...modal.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(x=>!x.disabled&&x.getClientRects().length);
   if(e.key==='Escape'){e.preventDefault();const closeButton=modal.querySelector('#p13-menu-close,.cw-p17-close,#npc-close-p11');closeButton?.click();document.getElementById('p13-menu-launch')?.focus();}
   if(e.key==='Tab'){const at=controls.indexOf(document.activeElement);if(e.shiftKey&&(at<=0)){e.preventDefault();controls.at(-1)?.focus();}else if(!e.shiftKey&&(at<0||at===controls.length-1)){e.preventDefault();controls[0]?.focus();}}
   e.stopPropagation();return;
  }
  if(document.querySelector('dialog[open]')||e.target.closest('button,a[href],input,select,textarea,summary,[contenteditable="true"]'))e.stopPropagation();
 },true);
 document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))e.stopPropagation();});
 window.CWPatrolDetails=Object.freeze({open});
})();
