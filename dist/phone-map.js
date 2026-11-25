(() => {
  const view=document.querySelector('.city-view');
  if(!view)return;
  document.body.classList.add('cw-phone-map');
  const dispatch=document.querySelector('.city-dispatch');
  if(dispatch)view.append(dispatch);
  function menu(title,id){
    const dialog=document.createElement('dialog');dialog.id=id;dialog.className='cw-phone-menu cw-watch-menu';
    const header=document.createElement('header'),heading=document.createElement('h2'),close=document.createElement('button');
    heading.id=id+'-title';heading.textContent=title;dialog.setAttribute('aria-labelledby',heading.id);close.setAttribute('aria-label','Close '+title.toLowerCase());close.textContent='Close';close.onclick=()=>dialog.close();header.append(heading,close);dialog.append(header);document.body.append(dialog);return dialog;
  }
  document.getElementById('atlas-open').textContent='Map';
  document.getElementById('atlas-open').setAttribute('aria-label','City map');
  document.getElementById('p21-duty').setAttribute('aria-label','Duty');
  const more=menu('Patrol actions','cw-phone-more'),actions=document.createElement('div');actions.className='cw-phone-extra-actions';more.append(actions);
  const tools=document.querySelector('.city-tools');
  for(const button of [...tools.children])if(button.id!=='city-use'&&button.id!=='cw-ux108b-notebook')actions.append(button);
  actions.append(document.getElementById('p21-orders'));
  const ordersBar=document.getElementById('p21-orders-bar');
  if(ordersBar)actions.append(ordersBar);
  const reminder=document.createElement('p');reminder.id='cw-organiser-reminder';reminder.setAttribute('aria-label','Patrol reminder');reminder.hidden=true;ordersBar?.append(reminder);
  // Closing our menu before the retained action runs prevents it blocking movement or a second modal.
  more.addEventListener('click',e=>{if(e.target.closest('.cw-phone-extra-actions button'))more.close();},true);
  const moreButton=document.createElement('button');moreButton.id='cw-phone-more-open';moreButton.type='button';moreButton.dataset.open='false';moreButton.dataset.mood='alert';moreButton.setAttribute('aria-expanded','false');const bubble=document.createElement('span'),lead=document.createElement('span');
  bubble.className='cw-organiser-bubble';lead.className='cw-organiser-lead';lead.hidden=true;bubble.append(document.createElement('output'),lead);moreButton.append(bubble);
  window.CWOrganiserBriefing=Object.freeze({update(model){
    const nextLead=model?.lead||'',nextReminder=model?.reminder||'';
    if(lead.textContent!==nextLead)lead.textContent=nextLead;
    if(reminder.textContent!==nextReminder)reminder.textContent=nextReminder;
    lead.hidden=!nextLead;reminder.hidden=!nextReminder;
  }});
  moreButton.onclick=()=>{if(moreButton.dataset.open!=='true'){moreButton.dataset.open='true';moreButton.setAttribute('aria-expanded','true');return;}more.showModal();};
  more.addEventListener('close',()=>{moreButton.dataset.open='false';moreButton.setAttribute('aria-expanded','false');moreButton.focus({preventScroll:true});});tools.append(moreButton);
  // Keep the live interaction node/callback, placing it on the city surface.
  const worldAction=document.getElementById('city-use');worldAction.classList.add('cw-world-action');worldAction.hidden=true;view.append(worldAction);
  const overlay=document.createElement('section');overlay.className='cw-phone-loading';overlay.setAttribute('aria-live','polite');overlay.setAttribute('aria-busy','true');overlay.setAttribute('aria-label','Loading City Watch: The Lantern Files');
  const panel=document.createElement('div');panel.className='cw-phone-loading-panel';
  const crest=document.createElement('img'),title=document.createElement('strong'),status=document.createElement('p'),progress=document.createElement('progress'),note=document.createElement('small'),retry=document.createElement('button');
  crest.onload=()=>overlay.classList.add('has-loading-art');crest.onerror=()=>overlay.classList.remove('has-loading-art');crest.src='assets/loading/watch-house-gaspode-v1.webp';crest.alt='City Watch: The Lantern Files. Vimes, Carrot, Colon and Nobby at the Watch House, with Gaspode.';crest.className='cw-phone-loading-art';crest.decoding='async';crest.fetchPriority='high';
  title.textContent='Ankh-Morpork';status.textContent='Preparing your patrol…';progress.removeAttribute('value');progress.setAttribute('aria-label','Loading city paintings');note.textContent='Your saved patrol will resume unchanged.';retry.textContent='Retry loading';retry.hidden=true;retry.onclick=()=>location.reload();panel.append(title,status,progress,note,Object.assign(document.createElement('small'),{className:'cw-fan-note',textContent:'Unofficial, non-commercial fan game. Discworld is © the Terry Pratchett estate; not affiliated with or endorsed by its owners.'}),retry);overlay.append(crest,panel);document.body.append(overlay);
  // The parser-owned cover paints before scripts and remains until this live
  // progress/Retry overlay is mounted. Never expose the legacy base controls.
  document.getElementById('cw-startup-screen')?.remove();
  let failed=false,stalled=false,finished=false,stage='Preparing your patrol',loaded=0,bootTimer=null;
  const diagnostics=document.createElement('p');diagnostics.className='cw-phone-loading-diagnostic';diagnostics.hidden=true;panel.append(diagnostics);
  // The deadline measures inactivity, not total loading time. It offers a retry
  // without poisoning a later real first frame; actual exceptions stay fatal.
  function armWatchdog(){
    clearTimeout(bootTimer);
    if(failed||finished)return;
    bootTimer=setTimeout(()=>{
      if(failed||finished||document.body.dataset.cityBoot==='ready')return;
      stalled=true;overlay.hidden=false;overlay.classList.remove('is-ready');overlay.classList.add('is-stalled');
      title.textContent='The city is taking longer to load';
      status.textContent=stage+' · '+loaded+' paintings ready';
      diagnostics.hidden=false;diagnostics.textContent='No loading progress for 60 seconds. Loading will continue; you can retry. Your saved patrol is unchanged.';
      retry.hidden=false;document.body.dataset.cityBoot='stalled';
    },60000);
  }
  function progressActivity(){
    if(failed||finished)return;
    if(stalled){stalled=false;overlay.classList.remove('is-stalled');title.textContent='Ankh-Morpork';diagnostics.hidden=true;retry.hidden=true;document.body.dataset.cityBoot='loading';}
    armWatchdog();
  }
  const boot={
    stage(text){stage=text;if(!failed&&!finished){status.textContent=text+'…';progressActivity();}},
    image(){loaded++;progress.setAttribute('aria-valuetext',loaded+' city paintings ready; loading continues');if(!failed&&!finished){status.textContent=stage+' · '+loaded+' paintings ready';progressActivity();}},
    fail(error){if(failed)return;failed=true;stalled=false;clearTimeout(bootTimer);overlay.classList.remove('is-ready','is-stalled');overlay.classList.add('is-failed');overlay.hidden=false;overlay.setAttribute('aria-busy','false');progress.hidden=true;note.hidden=true;title.textContent='The city could not finish loading';status.textContent='Your saved patrol has not been reset. Please retry.';retry.hidden=false;diagnostics.hidden=false;diagnostics.textContent=stage+' · '+loaded+' paintings ready · '+String(error?.message||error);document.body.dataset.cityBoot='failed';},
    ready(){if(failed||finished)return;finished=true;stalled=false;clearTimeout(bootTimer);overlay.classList.remove('is-stalled');diagnostics.hidden=true;retry.hidden=true;title.textContent='Ankh-Morpork';progress.max=1;progress.value=1;progress.setAttribute('aria-valuetext','City ready');overlay.setAttribute('aria-busy','false');overlay.classList.add('is-ready');setTimeout(()=>{if(!failed)overlay.hidden=true;},180);document.body.dataset.cityBoot='ready';}
  };
  window.CWPhoneBoot=boot;
  const canvas=document.getElementById('city-scene');
  canvas.setAttribute('aria-label','Painted isometric city. Drag anywhere to walk, lift to stop, or tap open ground to choose a route.');
  const observer=new MutationObserver(()=>{if(canvas.dataset.ready==='true'){boot.ready();observer.disconnect();}});observer.observe(canvas,{attributes:true,attributeFilter:['data-ready']});
  addEventListener('unhandledrejection',e=>{if(document.body.dataset.cityBoot!=='ready')boot.fail(e.reason);});
  addEventListener('error',e=>{if(e.error&&document.body.dataset.cityBoot!=='ready')boot.fail(e.error);});
  document.body.dataset.cityBoot='loading';armWatchdog();
  const module=document.createElement('script');module.type='module';const cityModuleURL=new URL("city.mjs",document.baseURI).href+"?v="+encodeURIComponent(window.CW_LAB_RELEASE.runtimeCacheToken||window.CW_LAB_RELEASE.version)+"-completion-sweep-v2-atlas-labels-v2-startup-recovery-v2-civic-v2-jimmy-view-drag-atlas-districts-prouts-cw-nc01-pilot65-polish";module.textContent="import("+JSON.stringify(cityModuleURL)+").catch(e=>window.CWPhoneBoot.fail(e));";document.body.append(module);
})();
