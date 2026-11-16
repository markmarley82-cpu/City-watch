import './cw-action-frames.js?v=p21-b407-s039-reuse';
import '../cw-action-rigs-data.js?v=p21-b407-s039-reuse';
/* Approved recruit folio. Live sprite/head/kit controls; no baked-in UI. */
if(!window.CWCharacters)await import('./cw-character-runtime.js?v=p21-b498-appearance-recovery');
if(!window.CWClothing)await import('./cw-clothing.js?v=p21-b407-s039-reuse');
if(!window.CWHeads)await import('../cw-heads.js?v=p21-b407-s039-reuse');
if(!window.CWClothing.report().fittedBodies)await import('../cw-race-wardrobe.js?v=p21-b407-s039-reuse');
if(!window.CWClothing.report().modularBodies)await import('../cw-modular-wardrobe-data.js?v=p21-b407-s039-reuse');
if(!window.CWRecruitChoices)await import('../cw-recruit-choices.js?v=p21-b407-s039-reuse');
const C=window.CWCharacters,W=window.CWClothing,H=window.CWHeads,R=window.CWRecruitChoices,preferences=C.motionPreference();
let sharedLibrary,view,styles;
const css=new URL('character-studio.css?v=p21-b407-s039-reuse',import.meta.url).href;
function ensureStyles(){
 if(!styles)styles=new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href=css;const timer=setTimeout(()=>{link.remove();reject(Error('Appearance styling timed out'));},15000);link.onload=()=>{clearTimeout(timer);resolve();};link.onerror=()=>{clearTimeout(timer);link.remove();reject(Error('Appearance styling could not load'));};document.head.append(link);}).catch(e=>{styles=null;throw e;});
 return styles;
}
const paths={
 coat:'M8 4 3 9l3 4 2-2v10h10V11l2 2 3-4-5-5-3 3-3-3zm4 3v14',
 trousers:'M6 4h12l1 18h-6l-1-11-1 11H5zm0 4h12',
 boots:'M7 3h8l-1 11 7 3v4H4v-6l3-2zm-3 15h17M8 7h6',
 helmet:'M3 14h20v4H3zm3 0c0-7 3-11 7-11s7 4 7 11M13 3v10M7 18l1 4m11-4-1 4',
 badge:'m13 3 7 3v8c0 4-7 8-7 8s-7-4-7-8V6zm0 5-1 3-3 1 3 1 1 3 1-3 3-1-3-1z'
};
const shortLabels={coat:'Coat',trousers:'Legs',boots:'Boots',helmet:'Head',badge:'Badge'};
// Reuse the approved Watch fleur-de-lis from the existing patrol icon.
const fleur='M15 29v-7h-5l-1-3h5c-1-3-4-4-6-3-3 2-6 0-6-3 0-5 6-7 9-3 2 2 3 4 3 7h1c-2-6-7-9-1-16l2-2 2 2c6 7 1 10-1 16h1c0-3 1-5 3-7 3-4 9-2 9 3 0 3-3 5-6 3-2-1-5 0-6 3h5l-1 3h-5v7Z';
const icon=slot=>'<svg viewBox="0 0 26 26" aria-hidden="true">'+(slot==='badge'?'<path d="m13 3 8 3v8c0 4-8 9-8 9s-8-5-8-9V6Z"/><path transform="translate(6 7) scale(.44)" d="'+fleur+'" fill="currentColor" stroke="none"/>':'<path d="'+paths[slot]+'"/>')+'</svg>';
const shortHead=label=>label==='Original head'?'Original':label.split(' & ')[0];
function persistAppearance({key,outfit,head}){
 const appearance=C.saveSelected(key),clothing=W.supports(key)?W.save(key,outfit):true,heads=H.save(key,head);
 return appearance&&clothing&&heads;
}
const chevron=direction=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(direction<0?'M15 5l-7 7 7 7':'M9 5l7 7-7 7')+'"/></svg>';
function build(){
 const dialog=document.createElement('dialog');dialog.id='character-studio';dialog.setAttribute('aria-labelledby','character-studio-title');
 dialog.innerHTML=`<header class="kit-header"><div class="kit-brand"><span class="kit-crest" aria-hidden="true">${icon('badge')}</span><div><strong>CITY WATCH</strong><small>THE LANTERN FILES</small></div></div><button type="button" class="kit-close kit-leather" data-close aria-label="Close character selection">× Close</button><h2 id="character-studio-title" tabindex="-1">Choose your recruit</h2></header>
 <div class="kit-page"><section class="kit-races" aria-label="Race shortcuts"><span class="kit-section-label">Race</span><div id="character-race-shortcuts" role="radiogroup" aria-label="Common races"></div></section>
 <div class="kit-identity"><div class="kit-picker"><label for="character-race">Race</label><div class="kit-picker-row"><button type="button" id="character-race-previous" class="kit-arrow kit-leather" aria-label="Previous race">${chevron(-1)}</button><select id="character-race"></select><button type="button" id="character-race-next" class="kit-arrow kit-leather" aria-label="Next race">${chevron(1)}</button></div></div><div class="kit-picker"><label for="character-pick">Body <span id="character-body-count"></span></label><div class="kit-picker-row"><button type="button" id="character-previous" class="kit-arrow kit-leather" aria-label="Previous body">${chevron(-1)}</button><select id="character-pick"></select><button type="button" id="character-next" class="kit-arrow kit-leather" aria-label="Next body">${chevron(1)}</button></div></div></div>
 <section class="kit-preview" aria-label="Recruit preview"><div class="kit-stage"><canvas id="character-canvas" role="img" aria-label="Animated recruit wearing the selected head and clothing"></canvas></div><p id="character-caption" class="kit-caption"></p><div class="character-controls"><label>Facing<select id="character-facing"><option value="-1">Left</option><option value="1">Right</option></select></label><button type="button" id="character-walk">Show walking</button><button type="button" id="character-play">Pause animation</button></div><div class="kit-motion-tools"><label>View <select id="character-scale"><option value="1">Game size</option><option value="fit">Inspect detail</option></select></label><button type="button" id="character-frame-previous" aria-label="Previous animation pose">← Pose</button><button type="button" id="character-frame-next" aria-label="Next animation pose">Pose →</button><output id="character-frame-readout" aria-live="off"></output></div><label class="kit-compare"><input type="checkbox" id="character-compare"> Compare with human size</label></section>
 <details class="kit-lore"><summary><span id="recruit-lore-record"></span> · Recruit’s note</summary><p id="recruit-lore-note"></p></details>
 <div class="kit-tools character-controls" role="group" aria-label="Try appearance choices"><button type="button" id="character-shuffle">Try another look</button><button type="button" id="character-patrol-kit">Patrol kit</button><button type="button" id="character-restore">Saved look</button></div>
 <section class="kit-heads" aria-labelledby="head-title"><div class="kit-finish-heading"><h3 id="head-title">Head</h3><span id="head-current"></span></div><div id="character-heads" role="radiogroup" aria-labelledby="head-title"></div><p class="head-note">Service helmets fit each head choice.</p></section>
 <section class="kit-wardrobe" aria-labelledby="kit-title"><h3 id="kit-title">Kit</h3><nav id="character-clothing" class="clothing-slots" role="tablist" aria-label="Clothing pieces" aria-orientation="horizontal"></nav><section id="clothing-options" class="kit-finishes" role="tabpanel"><div class="kit-finish-heading"><h4 id="clothing-finish-title">Coat</h4><span id="clothing-current"></span></div><div id="clothing-finishes" role="radiogroup" aria-labelledby="clothing-finish-title"></div><button type="button" id="clothing-reset">Restore original clothing</button></section><p id="clothing-unavailable" hidden>This outfit has no separate finishes.</p><p class="kit-garment-note">Choose fitted leather, mail or iron, then mix your lower garments, footwear and helmet.</p></section>
 <div class="kit-name"><label for="character-name">Chosen name</label><input type="text" id="character-name" placeholder="Enter your name" autocomplete="off" autocapitalize="words" spellcheck="false" maxlength="64" aria-describedby="character-name-help"><small id="character-name-help">Your name is signed on the next page.</small></div>
 <p id="character-status" role="status" aria-live="polite"></p></div>
 <footer class="character-footer"><button type="button" class="kit-leather" data-close>← Back</button><button type="button" id="character-retry" class="kit-leather" hidden>Retry</button><button type="button" id="character-apply" class="kit-leather">Continue to oath →</button></footer>`;
 document.body.append(dialog);const find=s=>dialog.querySelector(s),canvas=find('#character-canvas'),g=canvas.getContext('2d');
 const v={dialog,canvas,g,find,raf:0,entry:null,library:null,options:{},key:C.defaultRecruit,head:'original',slot:'coat',outfit:W.defaults(),clip:'walk',scaleMode:'1',manualFrame:undefined,elapsed:0,lastFrame:null,facing:-1,animate:!preferences.reduced,compare:false,start:0,token:0,returnFocus:null,busy:false,nextDraft:null,raceBodies:new Map(),drafts:R.createDrafts({heads:H,clothing:W})};
 const recruiting=()=>typeof v.options.onContinue==='function';
 const nameValid=()=>!recruiting()||window.CWWatchOath?.validName(find('#character-name').value)===true;
 function stop(){cancelAnimationFrame(v.raf);v.raf=0;}
 function resetPreview(){v.elapsed=0;v.lastFrame=null;v.manualFrame=undefined;}
 function navigation(){
  const race=H.raceOf(v.key),races=H.races.filter(r=>r.bodies.some(k=>v.library.entries[k])),bodies=race.bodies.filter(k=>v.library.entries[k]);
  const at=races.indexOf(race),body=bodies.indexOf(v.key);
  find('#character-body-count').textContent=(body+1)+' / '+bodies.length;
  for(const [id,delta]of [['character-race-previous',-1],['character-race-next',1]]){const b=find('#'+id),next=races[(at+delta+races.length)%races.length];b.disabled=v.busy||races.length<2;b.setAttribute('aria-label',(delta<0?'Previous':'Next')+' race: '+(R.profiles[next.id]?.label||next.label));}
  for(const [id,delta]of [['character-previous',-1],['character-next',1]]){const b=find('#'+id),next=bodies[(body+delta+bodies.length)%bodies.length];b.disabled=v.busy||bodies.length<2;b.setAttribute('aria-label',bodies.length<2?'Only body for this race':(delta<0?'Previous':'Next')+' body: '+R.bodyLabel(next,H,W));b.title=bodies.length<2?'This race has one body. Use the Race arrows to change race.':b.getAttribute('aria-label');}
 }
 function stash(){if(v.entry){v.drafts.set(v.key,{head:v.head,outfit:v.outfit});v.raceBodies.set(H.raceOf(v.key)?.id,v.key);}}
 function showDraft(value){v.head=value.head;v.outfit=value.outfit;headControls();clothingControls();controls();warmKit();}
 async function warmKit(){
  if(!v.entry)return;const token=(v.kitToken||0)+1;v.kitToken=token;
  if(W.layersReady(v.entry,v.outfit,v.head)){v.kitLoading=false;v.kitError=false;find('#character-retry').hidden=true;find('#character-status').textContent='Your fitted kit is ready.';controls();draw();return;}
  v.kitLoading=true;v.kitError=false;find('#character-retry').hidden=true;controls();find('#character-status').textContent='Preparing your fitted kit…';
  try{await W.ensure(v.entry,v.outfit,v.head,new URL('../',import.meta.url));if(token!==v.kitToken||!dialog.open)return;v.kitLoading=false;find('#character-retry').hidden=true;find('#character-status').textContent='Your fitted kit is ready.';controls();draw();}
  catch{if(token!==v.kitToken||!dialog.open)return;v.kitLoading=false;v.kitError=true;find('#character-status').textContent='This piece could not load. Choose it again or use Retry.';find('#character-retry').hidden=false;controls();}
 }
 function controls(){
  dialog.setAttribute('aria-busy',String(v.busy||v.kitLoading||!v.entry));
  for(const b of dialog.querySelectorAll('button,select,input'))b.disabled=v.busy;
  navigation();stash();for(const b of dialog.querySelectorAll('#character-race,#character-pick,#character-name,[data-head]'))b.disabled=v.busy;for(const b of dialog.querySelectorAll('[data-slot]'))b.disabled=v.busy||!W.availableSlots(v.key).includes(b.dataset.slot);for(const b of dialog.querySelectorAll('[data-finish]'))b.disabled=v.busy;for(const id of ['character-shuffle','character-patrol-kit','character-restore'])find('#'+id).disabled=v.busy||!v.entry;
  const actions=window.CWActionFrames?.available(v.entry||{}, {head:v.head,clothing:v.outfit,facing:v.facing})||['idle','walk'];if(!actions.includes(v.clip)){v.clip='walk';resetPreview();}find('#character-walk').textContent=({idle:'Standing',walk:'Walking',attack:'Strike',guard:'Guard',hit:'Hit',down:'Down',shove:'Shove',restrain:'Restrain',surrender:'Surrender'}[v.clip]||v.clip)+' →';find('#character-walk').setAttribute('aria-label','Preview action: '+v.clip+'. Show the next action.');
  find('#character-play').textContent=v.animate?'Pause animation':'Play animation';find('#character-play').setAttribute('aria-pressed',String(v.animate));
  const allowed=C.recruits.includes(v.key),a=find('#character-apply');a.disabled=v.busy||v.kitLoading||v.kitError||!v.entry||!W.layersReady(v.entry,v.outfit,v.head)||!allowed||!nameValid();a.textContent=v.busy?'Saving…':v.kitLoading?'Preparing kit…':recruiting()?'Continue to oath →':allowed?'Save & return →':'Preview only';
  dialog.querySelectorAll('[data-close]').forEach(b=>b.disabled=v.busy);
  find('#character-caption').textContent=v.library?.entries[v.key]?.description||'Watch recruit';
 }
 function identity(){
  const race=H.raceOf(v.key)||H.races[0],select=find('#character-pick');find('#character-race').value=race.id;
  select.replaceChildren(...race.bodies.filter(key=>v.library.entries[key]).map(key=>{const o=document.createElement('option');o.value=key;o.textContent=R.bodyLabel(key,H,W);return o;}));select.value=v.key;const lore=R.profile(v.key,H);find('#recruit-lore-record').textContent=lore?.record||'Recruit appearance';find('#recruit-lore-note').textContent=lore?.note||'';
  const shortcuts=[...find('#character-race-shortcuts').children],selected=shortcuts.some(b=>b.dataset.race===race.id)?race.id:'human';
  shortcuts.forEach(b=>{b.setAttribute('aria-checked',String(b.dataset.race===race.id));b.tabIndex=b.dataset.race===selected?0:-1;});
  navigation();
 }
 function headControls(){
  const entries=H.choices(v.key);find('#head-current').textContent=entries.find(x=>x.id===v.head)?.label||'';
  find('#character-heads').replaceChildren(...entries.map((item,i)=>{const b=document.createElement('button');b.type='button';b.className='head-option';b.dataset.head=item.id;b.setAttribute('role','radio');b.setAttribute('aria-label',item.label);b.setAttribute('aria-checked',String(v.head===item.id));b.tabIndex=v.head===item.id?0:-1;
   const thumb=document.createElement('canvas');thumb.width=thumb.height=96;thumb.setAttribute('aria-hidden','true');if(v.entry)H.portrait(thumb.getContext('2d'),v.entry,item.id,96,96);const caption=document.createElement('span');caption.textContent=shortHead(item.label);b.append(thumb,caption);
   const select=()=>{v.head=item.id;headControls();clothingControls();controls();warmKit();find('#character-heads [data-head="'+item.id+'"]').focus({preventScroll:true});};b.onclick=select;b.onkeydown=e=>{const d=['ArrowRight','ArrowDown'].includes(e.key)?1:['ArrowLeft','ArrowUp'].includes(e.key)?-1:0;if(!d&&!['Home','End'].includes(e.key))return;e.preventDefault();v.head=e.key==='Home'?entries[0].id:e.key==='End'?entries.at(-1).id:entries[(i+d+entries.length)%entries.length].id;headControls();clothingControls();controls();warmKit();find('#character-heads [data-head="'+v.head+'"]').focus({preventScroll:true});};return b;
  }));
 }
 function options(){
  find('#clothing-options').setAttribute('aria-labelledby','clothing-slot-'+v.slot);find('#clothing-finish-title').textContent=W.definitions[v.slot].label;find('#clothing-current').textContent=W.choices(v.key,v.slot)[v.outfit[v.slot]]?.label||'Original';
  const entries=Object.entries(W.choices(v.key,v.slot)).filter(([key,item])=>v.slot!=='helmet'||v.head==='original'||key==='original'||item.modular);find('#clothing-finishes').replaceChildren(...entries.map(([id,item],i)=>{
   const button=document.createElement('button');button.type='button';button.className='finish-option';button.dataset.finish=id;button.disabled=false;button.setAttribute('role','radio');button.setAttribute('aria-checked',String(v.outfit[v.slot]===id));button.tabIndex=v.outfit[v.slot]===id?0:-1;
   const swatch=document.createElement('span');swatch.className='finish-swatch';swatch.setAttribute('aria-hidden','true');const defaults={coat:'#3d6172',trousers:'#745741',boots:'#63442e',helmet:'#77716a',badge:'#cfb16d'};swatch.style.setProperty('--swatch',item.rgb?'rgb('+item.rgb.join(',')+')':defaults[v.slot]);if(v.slot==='badge')swatch.classList.add('badge-swatch');if(item.thumbnail){swatch.classList.add('garment-swatch');const im=document.createElement('img');im.src=new URL('../'+item.thumbnail,import.meta.url).href;im.alt='';im.loading='lazy';swatch.append(im);}const label=document.createElement('span');label.textContent=item.label;button.append(swatch,label);
   const select=id=>{v.outfit={...v.outfit,[v.slot]:id};clothingControls();controls();warmKit();find('[data-finish="'+id+'"]').focus({preventScroll:true});};button.onclick=()=>select(id);
   button.onkeydown=e=>{const d=['ArrowRight','ArrowDown'].includes(e.key)?1:['ArrowLeft','ArrowUp'].includes(e.key)?-1:0;if(!d&&!['Home','End'].includes(e.key))return;e.preventDefault();select(e.key==='Home'?entries[0][0]:e.key==='End'?entries.at(-1)[0]:entries[(i+d+entries.length)%entries.length][0]);};return button;
  }));
 }
 function clothingControls(){
  const availableSlots=W.availableSlots(v.key),supported=W.supports(v.key);if(!availableSlots.includes(v.slot))v.slot=availableSlots[0]||'badge';
  find('#character-clothing').hidden=!supported;find('#clothing-options').hidden=!supported;find('#clothing-unavailable').hidden=supported;
  find('#character-clothing').replaceChildren(...W.slots.map(slot=>{
   const button=document.createElement('button');button.type='button';button.className='clothing-slot';button.id='clothing-slot-'+slot;button.dataset.slot=slot;button.setAttribute('role','tab');button.setAttribute('aria-selected',String(slot===v.slot));button.setAttribute('aria-controls','clothing-options');button.setAttribute('aria-label',W.definitions[slot].label+', '+(W.choices(v.key,slot)[v.outfit[slot]]?.label||'Original'));button.tabIndex=slot===v.slot?0:-1;button.disabled=!availableSlots.includes(slot);if(button.disabled)button.title='No fitted alternatives for this piece';
   button.innerHTML=icon(slot)+'<span>'+shortLabels[slot]+'</span>';
   button.onclick=()=>{v.slot=slot;clothingControls();find('[data-slot="'+slot+'"]').focus({preventScroll:true});};button.onkeydown=e=>{const i=availableSlots.indexOf(slot),d=['ArrowRight','ArrowDown'].includes(e.key)?1:['ArrowLeft','ArrowUp'].includes(e.key)?-1:0;if(!d&&!['Home','End'].includes(e.key))return;e.preventDefault();v.slot=e.key==='Home'?availableSlots[0]:e.key==='End'?availableSlots.at(-1):availableSlots[(i+d+availableSlots.length)%availableSlots.length];clothingControls();find('[data-slot="'+v.slot+'"]').focus({preventScroll:true});};return button;
  }));options();
 }
 function draw(now=performance.now()){
  stop();if(!dialog.open||document.hidden){v.lastFrame=null;return;}if(v.animate&&v.lastFrame!==null)v.elapsed+=Math.min(250,Math.max(0,now-v.lastFrame));v.lastFrame=now;const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=r.width,h=r.height;if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);}g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,w,h);
  const floor=h-18,a=v.entry,pose={weapon:C.recruits.includes(v.key)?'truncheon':undefined,clip:v.clip,facing:v.facing,elapsed:v.elapsed,reduced:false,frame:v.manualFrame,clothing:v.outfit,head:v.head};
  if(a){
   const standard=v.library.get(C.defaultRecruit),physical=C.height(a,v.key),sourceWidth=Math.max(...(a.frameBounds||[[0,0,a.cellWidth,a.cellHeight]]).map(b=>b[2]-b[0]))/a.visibleHeight*physical;
   // One physical scale across races, with a single centred recruit by default.
   // The optional comparison uses the same zoom for the human reference.
   const fit=Math.max(.1,Math.min((h-32)/v.previewBounds.height,(w-(v.compare?30:90))/(Math.max(sourceWidth,physical*1.12)+(v.compare?75:0)))),zoom=v.scaleMode==='1'?Math.min(1,fit):fit,mainHeight=physical*zoom,referenceHeight=60*zoom;
   const f=C.draw(g,a,pose,w*(v.compare?.34:.5),floor,mainHeight);find('#character-frame-readout').textContent=(v.scaleMode==='1'?'Game size':'Detail')+' · pose '+(f.index+1);find('#character-frame-readout').setAttribute('aria-label','Frame '+(f.index+1)+', '+Math.round(mainHeight)+' pixels tall');
   if(v.compare&&standard){g.globalAlpha=.34;C.draw(g,standard,{clip:'idle',facing:-1,reduced:true},w*.79,floor,referenceHeight);g.globalAlpha=1;g.fillStyle='#5b4936';g.font='11px Georgia,serif';g.textAlign='center';g.fillText('Human reference',w*.79,h-3);}
   Object.assign(canvas.dataset,{previewHeight:String(mainHeight),referenceHeight:String(referenceHeight),previewScale:String(zoom),character:v.key,frame:String(f.index),facing:String(v.facing),clip:v.clip,height:String(physical),reduced:String(preferences.reduced),paused:String(!v.animate),clothing:JSON.stringify(v.outfit),head:v.head,race:H.raceOf(v.key)?.id,compare:String(v.compare),headCache:JSON.stringify(H.report()),wardrobe:JSON.stringify(W.report()),cache:JSON.stringify(v.library.report())});
  }else{g.fillStyle='#4c3826';g.font='16px Georgia,serif';g.textAlign='center';g.fillText(find('#character-retry').hidden?'Preparing the recruit…':'Character unavailable',w/2,h/2);}
  if(v.animate&&!document.hidden)v.raf=requestAnimationFrame(draw);
 }
 async function choose(retry=false){
  v.raceBodies.set(H.raceOf(v.key)?.id,v.key);
  const token=++v.token;v.kitToken=(v.kitToken||0)+1;v.kitLoading=false;v.kitError=false;v.entry=null;const draft=v.drafts.read(v.key);v.outfit=draft.outfit;v.head=draft.head;headControls();find('#character-retry').hidden=true;find('#character-status').textContent='Loading '+(v.library.entries[v.key]?.description||'character')+'…';clothingControls();controls();draw();
  try{const a=await(retry?v.library.retry(v.key):v.library.ensure(v.key));if(token!==v.token||!dialog.open)return;v.entry=a;headControls();resetPreview();await warmKit();if(token!==v.token||!dialog.open||v.kitLoading||v.kitError)return;find('#character-status').textContent=H.raceOf(v.key)?.id==='werewolf'?'Werewolf shown in human form.':recruiting()?'Choose your head and kit, then continue to the oath.':'Appearance only. Your equipment and progress stay the same.';controls();draw();}
  catch{if(token!==v.token||!dialog.open)return;find('#character-status').textContent='This character could not load. Retry or choose another body.';find('#character-retry').hidden=false;controls();draw();}
 }
 function selectRace(id){if(v.busy)return;const race=H.races.find(r=>r.id===id);if(!race||!race.bodies.some(k=>v.library.entries[k]))return;stash();const remembered=v.raceBodies.get(id);v.key=race.bodies.includes(remembered)&&v.library.entries[remembered]?remembered:race.bodies.find(k=>v.library.entries[k]);identity();choose();}
 function cycleRace(delta){if(v.busy)return;const races=H.races.filter(r=>r.bodies.some(k=>v.library.entries[k])),at=races.findIndex(r=>r.id===H.raceOf(v.key)?.id);selectRace(races[(at+delta+races.length)%races.length].id);}
 function cycleBody(delta){if(v.busy)return;const bodies=H.raceOf(v.key).bodies.filter(k=>v.library.entries[k]);if(bodies.length<2)return;stash();v.key=bodies[(bodies.indexOf(v.key)+delta+bodies.length)%bodies.length];identity();choose();}
 dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('cancel',e=>{if(v.busy)e.preventDefault();});dialog.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{if(!v.busy)dialog.close();});
 dialog.addEventListener('close',()=>{stop();v.token++;v.entry=null;const draft=v.nextDraft;v.nextDraft=null;v.options.onClose?.({continued:!!draft});if(draft)v.options.onContinue(draft);else if(v.returnFocus?.isConnected)v.returnFocus.focus({preventScroll:true});});
 find('#character-race').onchange=e=>selectRace(e.target.value);find('#character-pick').onchange=e=>{if(v.busy)return;stash();v.key=e.target.value;identity();choose();};find('#character-race-previous').onclick=()=>cycleRace(-1);find('#character-race-next').onclick=()=>cycleRace(1);find('#character-previous').onclick=()=>cycleBody(-1);find('#character-next').onclick=()=>cycleBody(1);
 find('#character-facing').onchange=e=>{v.facing=Number(e.target.value);resetPreview();controls();draw();};find('#character-walk').onclick=()=>{const actions=window.CWActionFrames.available(v.entry,{head:v.head,clothing:v.outfit,facing:v.facing});v.clip=actions[(actions.indexOf(v.clip)+1)%actions.length];resetPreview();controls();draw();};find('#character-play').onclick=()=>{v.animate=!v.animate;if(v.animate)v.manualFrame=undefined;v.lastFrame=null;controls();draw();};find('#character-scale').onchange=e=>{v.scaleMode=e.target.value;draw();};function stepPose(delta){if(!v.entry)return;const spec=window.CWActionFrames.info(v.entry,{clip:v.clip,facing:v.facing,head:v.head,clothing:v.outfit}),seq=spec?Array.from({length:spec.count},(_,i)=>i):C.clip(v.entry,v.clip,v.facing),distinct=[...new Set(seq)],current=spec?(v.manualFrame??Math.min(spec.count-1,Math.floor(v.elapsed/spec.frameMS))):C.frame(v.entry,{clip:v.clip,facing:v.facing,elapsed:v.elapsed,frame:v.manualFrame}).index;v.manualFrame=seq.indexOf(distinct[(distinct.indexOf(current)+delta+distinct.length)%distinct.length]);v.animate=false;v.lastFrame=null;controls();draw();}find('#character-frame-previous').onclick=()=>stepPose(-1);find('#character-frame-next').onclick=()=>stepPose(1);find('#character-compare').onchange=e=>{v.compare=e.target.checked;canvas.setAttribute('aria-label','Animated recruit wearing the selected head and clothing'+(v.compare?', with a human at the same scale':''));draw();};find('#character-retry').onclick=()=>choose(true);
 find('#character-name').oninput=()=>{const input=find('#character-name');input.setAttribute('aria-invalid',String(input.value.length>0&&!nameValid()));find('#character-name-help').textContent=nameValid()?'Your name is signed on the next page.':'Enter 1–32 characters, without angle brackets or control marks.';controls();};
 find('#character-shuffle').onclick=()=>{stash();showDraft(v.drafts.shuffle(v.key));};
 find('#character-patrol-kit').onclick=()=>{stash();showDraft(v.drafts.patrol(v.key));};
 find('#character-restore').onclick=()=>showDraft(v.drafts.restore(v.key));
 find('#clothing-reset').onclick=()=>{v.outfit=W.defaults();clothingControls();controls();warmKit();};
 find('#character-apply').onclick=async()=>{
  if(v.busy||v.kitLoading||v.kitError||!v.entry||!W.layersReady(v.entry,v.outfit,v.head)||!C.recruits.includes(v.key)||!nameValid())return;
  const draft={key:v.key,outfit:{...v.outfit},head:v.head,name:find('#character-name').value};
  if(recruiting()){v.nextDraft=draft;dialog.close();return;}
  v.busy=true;controls();try{
   await v.options.onSelect?.(draft.key,{head:draft.head,race:H.raceOf(draft.key)?.id});
   v.library.pin([draft.key]);const persisted=persistAppearance(draft);window.dispatchEvent(new CustomEvent('cw-character-change',{detail:{...draft,clothing:draft.outfit,persisted,race:H.raceOf(draft.key)?.id}}));
   if(persisted)dialog.close();else find('#character-status').textContent='Applied for this visit. This browser is not allowing it to be saved.';
  }catch{find('#character-status').textContent='Your appearance could not be saved. Please try again.';}finally{v.busy=false;controls();draw();}
 };
 preferences.listen(()=>{if(preferences.reduced)v.animate=false;v.lastFrame=null;controls();draw();});document.addEventListener('visibilitychange',()=>{v.lastFrame=null;if(document.hidden)stop();else if(dialog.open)draw();});new ResizeObserver(()=>{if(dialog.open)draw();}).observe(canvas);
 v.choose=choose;v.identity=identity;v.controls=controls;v.selectRace=selectRace;return v;
}
export async function openCharacterStudio(options={}){
 sharedLibrary=options.library||sharedLibrary||await C.createLibrary({baseURL:new URL('../',import.meta.url)});const library=sharedLibrary;await Promise.all([library.ensure(C.defaultRecruit),ensureStyles(),H.ensure(new URL('../',import.meta.url))]);if(!view)view=build();const v=view;if(v.dialog.open)return;
 v.options=options;v.library=library;const bodies=H.recruits.map(key=>library.entries[key]).filter(Boolean);v.previewBounds={height:Math.max(...bodies.map(a=>C.height(a,a.id)))};
 v.key=options.draft?.key&&C.recruits.includes(options.draft.key)?options.draft.key:C.selected(options.legacySelection);v.slot='coat';v.clip='walk';v.scaleMode='1';v.manualFrame=undefined;v.elapsed=0;v.lastFrame=null;v.facing=-1;v.compare=false;v.animate=!preferences.reduced;v.returnFocus=options.returnFocus||document.activeElement;v.busy=false;v.nextDraft=null;v.drafts.clear();v.raceBodies.clear();if(options.draft)v.drafts.set(v.key,options.draft);
 const raceSelect=v.find('#character-race');raceSelect.replaceChildren(...H.races.map(r=>{const o=document.createElement('option');o.value=r.id;o.textContent=R.profiles[r.id]?.label||r.label;return o;}));
 const common=['human','dwarf','troll'];v.find('#character-race-shortcuts').replaceChildren(...common.map((id,i)=>{const race=H.races.find(r=>r.id===id),b=document.createElement('button');b.type='button';b.dataset.race=id;b.setAttribute('role','radio');b.setAttribute('aria-label',race.label);const portrait=document.createElement('canvas');portrait.width=portrait.height=64;portrait.setAttribute('aria-hidden','true');const label=document.createElement('span');label.textContent=race.label;b.append(portrait,label);b.onclick=()=>v.selectRace(id);b.onkeydown=e=>{const delta=['ArrowRight','ArrowDown'].includes(e.key)?1:['ArrowLeft','ArrowUp'].includes(e.key)?-1:0;if(!delta&&!['Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?common[0]:e.key==='End'?common.at(-1):common[(i+delta+common.length)%common.length];v.selectRace(next);v.find('[data-race="'+next+'"]').focus({preventScroll:true});};library.ensure(race.bodies[0]).then(a=>{if(b.isConnected)H.portrait(portrait.getContext('2d'),a,'original');}).catch(()=>{});return b;}));
 v.identity();v.find('#character-facing').value='-1';v.find('#character-scale').value='1';v.find('#character-compare').checked=false;v.find('#character-name').value=options.draft?.name||options.name||'';v.find('#character-name').readOnly=typeof options.onContinue!=='function';v.find('.kit-name').hidden=typeof options.onContinue!=='function'&&typeof options.name!=='string';v.find('#character-name').setAttribute('aria-invalid','false');v.find('#character-name-help').textContent=typeof options.onContinue==='function'?'Your name is signed on the next page.':'Your signed name in the Watch register.';
 options.onOpen?.();v.dialog.showModal();v.find('.kit-page').scrollTop=0;
 v.find('#character-studio-title').focus({preventScroll:true});await v.choose();
}
