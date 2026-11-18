/* Race-only recruit folio. Name entry and signing remain on the Watch oath. */
import './cw-recruit-preview.js?v=p21-b407-s039-reuse';
import './cw-action-frames.js?v=p21-b407-s039-reuse';
import './cw-action-rigs-data.js?v=p21-b407-s039-reuse';
if(!window.CWCharacters)await import('./cw-character-runtime.js?v=recruit-art-v2');
if(!window.CWClothing)await import('./cw-clothing.js?v=p21-b407-s039-reuse');
if(!window.CWHeads)await import('./cw-heads.js?v=p21-b407-s039-reuse');
if(!window.CWRecruitChoices)await import('./cw-recruit-choices.js?v=p21-b407-s039-reuse');
const C=window.CWCharacters,W=window.CWClothing,H=window.CWHeads,R=window.CWRecruitChoices,P=window.CWRecruitPreview;
let library,view,styles;
function ensureStyles(){
 if(!styles)styles=new Promise((yes,no)=>{const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('character-studio.css?v=p21-b461-watch-ui',import.meta.url);const timer=setTimeout(()=>{link.remove();no(Error('Recruit styling timed out'));},15000);link.onload=()=>{clearTimeout(timer);yes();};link.onerror=()=>{clearTimeout(timer);link.remove();no(Error('Recruit styling unavailable'));};document.head.append(link);}).catch(e=>{styles=null;throw e;});return styles;
}
function fixedRecruit(race,entries){return race.bodies.find(key=>C.recruits.includes(key)&&entries[key]);}
function build(){
 const dialog=document.createElement('dialog');dialog.id='character-studio';dialog.className='race-only';dialog.setAttribute('aria-labelledby','character-studio-title');
 dialog.innerHTML=`<header class="kit-header"><h2 id="character-studio-title" tabindex="-1">Choose your recruit</h2><button type="button" class="kit-close kit-leather" data-close aria-label="Close character selection">× Close</button></header><div class="kit-reading-sheet"><div class="kit-page kit-paper"><section class="kit-preview" aria-label="Recruit preview"><div class="kit-stage"><canvas id="character-canvas" role="img" aria-label="Your recruit"></canvas></div><h3 id="character-caption" class="kit-caption"></h3></section><section class="race-selection" aria-labelledby="race-choice-title"><h3 id="race-choice-title">Recruit options</h3><div id="character-races" role="radiogroup" aria-labelledby="race-choice-title"></div></section><details class="kit-lore"><summary>About this recruit</summary><p id="recruit-lore-note"></p></details><p id="character-status" role="status" aria-live="polite"></p></div><footer class="character-footer"><button type="button" class="kit-leather" data-close>Cancel</button><button type="button" id="character-retry" class="kit-leather" hidden>Retry</button><button type="button" id="character-apply" class="kit-leather">Continue to oath →</button></footer></div>`;
 document.body.append(dialog);const find=s=>dialog.querySelector(s),canvas=find('#character-canvas'),g=canvas.getContext('2d');
 const v={dialog,find,canvas,key:C.defaultRecruit,entry:null,race:null,races:[],options:{},token:0,busy:false,loading:false,error:false,nextDraft:null,returnFocus:null};
 function controls(){
  dialog.setAttribute('aria-busy',String(v.busy||v.loading));
  for(const b of dialog.querySelectorAll('button'))b.disabled=v.busy;
  for(const b of find('#character-races').children){const selected=b.dataset.race===v.race?.id;b.setAttribute('aria-checked',String(selected));b.tabIndex=selected?0:-1;}
  const apply=find('#character-apply');apply.disabled=v.busy||v.loading||v.error||!v.entry;apply.textContent=v.busy?'Saving…':typeof v.options.onContinue==='function'?'Continue to oath →':'Save race & return';find('#character-retry').hidden=!v.error;
 }
 function draw(){
  if(!dialog.open)return;const box=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2),w=box.width,h=box.height;canvas.width=Math.max(1,Math.round(w*d));canvas.height=Math.max(1,Math.round(h*d));g.setTransform(d,0,0,d,0,0);g.clearRect(0,0,w,h);
  if(!v.entry||v.loading||v.error){g.fillStyle='#4c3826';g.font='16px Georgia';g.textAlign='center';g.fillText(v.error?'Preview unavailable':'Preparing your recruit…',w/2,h/2);return;}
  const body=window.CWRacePlayer?.current?.get(v.key)||window.CWDrawnCharacters?.current?.get(v.key)||v.entry,physical=C.height(v.entry,v.key),bounds=P.envelope(body,body.atlasImage,physical),place=P.layout(bounds,bounds,w,h,'fit',false),outfit=W.defaults();
  const result=C.draw(g,v.entry,{actorId:'race-folio:'+v.key,clip:'idle',facing:-1,reduced:true,frame:0,clothing:outfit,head:'original'},place.mainX,place.floor,physical*place.zoom);
  Object.assign(canvas.dataset,{race:v.race.id,character:v.key,head:'original',clothing:JSON.stringify(outfit),drawn:String(!!result?.drawn),ready:String(!!result)});
 }
 async function choose(id,retry=false){
  if(v.busy)return;const race=v.races.find(r=>r.id===id);if(!race)return;const token=++v.token;v.race=race;v.key=fixedRecruit(race,library.entries);v.entry=null;v.loading=true;v.error=false;
  find('#character-caption').textContent=R.profiles[race.id]?.label||race.label;find('#recruit-lore-note').textContent=R.profiles[race.id]?.note||'';find('#character-status').textContent='Preparing '+(R.profiles[race.id]?.label||race.label)+' recruit…';controls();draw();
  try{const playerArt=window.CWRacePlayer?.current,entry=playerArt?.supports(v.key)?await playerArt.ensure(v.key):await(retry?library.retry(v.key):library.ensure(v.key));if(!playerArt?.supports(v.key))await W.ensure(entry,W.defaults(),'original',new URL('./',import.meta.url));if(token!==v.token||!dialog.open)return;v.entry=entry;v.loading=false;find('#character-status').textContent=typeof v.options.onContinue==='function'?'Choose your recruit, then enter your name and sign the oath.':'Your patrol progress stays the same.';controls();draw();}
  catch{if(token!==v.token||!dialog.open)return;v.loading=false;v.error=true;find('#character-status').textContent='This recruit could not load. Retry or choose another recruit.';controls();draw();}
 }
 function populate(){
  find('#character-races').replaceChildren(...v.races.map((race,i)=>{const b=document.createElement('button');b.type='button';b.dataset.race=race.id;b.setAttribute('role','radio');b.textContent=R.profiles[race.id]?.label||race.label;b.onclick=()=>choose(race.id);b.onkeydown=e=>{const delta=['ArrowRight','ArrowDown'].includes(e.key)?1:['ArrowLeft','ArrowUp'].includes(e.key)?-1:0;if(!delta&&!['Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?v.races.length-1:(i+delta+v.races.length)%v.races.length;choose(v.races[next].id);find('#character-races').children[next].focus({preventScroll:true});};return b;}));
 }
 dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.addEventListener('cancel',e=>{if(v.busy)e.preventDefault();});for(const b of dialog.querySelectorAll('[data-close]'))b.onclick=()=>{if(!v.busy)dialog.close();};
 dialog.addEventListener('close',()=>{v.token++;v.entry=null;const next=v.nextDraft;v.nextDraft=null;v.options.onClose?.({continued:!!next});if(next)v.options.onContinue(next);else if(v.returnFocus?.isConnected)v.returnFocus.focus({preventScroll:true});});
 find('#character-retry').onclick=()=>choose(v.race.id,true);
 find('#character-apply').onclick=async()=>{
  if(v.busy||v.loading||v.error||!v.entry)return;const draft={key:v.key,head:'original',outfit:W.defaults(),name:v.options.draft?.name||v.options.name||''};
  if(typeof v.options.onContinue==='function'){v.nextDraft=draft;dialog.close();return;}
  v.busy=true;controls();try{await v.options.onSelect?.(draft.key,{head:draft.head,race:v.race.id});library.pin([draft.key]);const persisted=C.saveSelected(draft.key)&&(W.supports(draft.key)?W.save(draft.key,draft.outfit):true)&&H.save(draft.key,draft.head);window.dispatchEvent(new CustomEvent('cw-character-change',{detail:{...draft,clothing:draft.outfit,persisted,race:v.race.id}}));if(persisted)dialog.close();else find('#character-status').textContent='This browser could not save your race. Please try again.';}catch{find('#character-status').textContent='Your race could not be saved. Please try again.';}finally{v.busy=false;controls();draw();}
 };
 new ResizeObserver(draw).observe(canvas);v.populate=populate;v.choose=choose;return v;
}
export async function openCharacterStudio(options={}){
 library=options.library||library||await C.createLibrary({baseURL:new URL('./',import.meta.url)});await ensureStyles();if(!view)view=build();const v=view;if(v.dialog.open)return;
 v.options=options;v.races=H.races.filter(r=>fixedRecruit(r,library.entries));v.busy=false;v.nextDraft=null;v.returnFocus=options.returnFocus||document.activeElement;const selected=options.draft?.key||C.selected(options.legacySelection),race=H.raceOf(selected)||v.races[0];v.populate();options.onOpen?.();v.dialog.showModal();v.find('.kit-page').scrollTop=0;v.find('#character-studio-title').focus({preventScroll:true});await v.choose(race.id);
}
