/* P20 Base 0.4 — Buddy runtime trial of Jimmy v0.6 CHECKPOINT (nonfinal art). */
(function(){'use strict';
const link=document.createElement('link');link.rel='stylesheet';link.href='cw-p20-inventory.css';document.head.appendChild(link);
const overlay=document.createElement('div');overlay.id='cw-p16-inventory';
overlay.innerHTML=`<div class="folio" role="dialog" aria-modal="true" aria-labelledby="p20-inv-title" tabindex="-1">
<div class="p20-bag-art" aria-hidden="true"><img data-layer="inside" alt=""><img data-layer="rim" alt=""><img data-layer="front" alt=""></div>
<header class="p20-inv-header"><h2 id="p20-inv-title">Inventory</h2><button id="cw-p16-close" type="button" aria-label="Close inventory" title="Close inventory">×</button></header>
<div class="p20-inv-middle" tabindex="0" role="region" aria-label="Satchel contents and equipment summary">
<h2 class="p20-flow-title" aria-hidden="true">Inventory</h2>
<div class="p20-sack"><div id="cw-p16-items" class="inventory-grid"></div></div>
<details class="p20-bag-options"><summary>Options</summary><div id="cw-p16-stats" class="statsline" role="status"></div><details class="p20-uniform-guide"><summary>Uniform guide</summary><div class="paper-doll"><svg viewBox="0 0 130 200" xmlns="http://www.w3.org/2000/svg" aria-label="Illustrated Watch officer uniform">
<defs><linearGradient id="uniform" x2="1" y2="1"><stop stop-color="#506e72"/><stop offset="1" stop-color="#243b48"/></linearGradient></defs>
<ellipse cx="65" cy="190" rx="43" ry="8" fill="#473b3088"/>
<path d="M42 125 L37 178 L55 180 L65 139 L75 180 L94 178 L87 125Z" fill="#3b383a" stroke="#c4a478" stroke-width="2"/>
<path d="M34 70 Q65 53 96 70 L100 132 Q65 143 30 132Z" fill="url(#uniform)" stroke="#d2b57b" stroke-width="3"/>
<path d="M34 73 L17 115 L29 122 L48 88 M96 73 L113 115 L101 122 L82 88" fill="#41545c" stroke="#b99c6c" stroke-width="3"/>
<path d="M50 33 Q65 19 80 33 L81 57 Q65 77 49 57Z" fill="#c39c78" stroke="#553f36" stroke-width="2"/>
<path d="M43 35 Q43 8 65 8 Q88 8 87 35 L80 41 L79 26 L52 26 L51 41Z" fill="#4a535b" stroke="#c9ad75" stroke-width="3"/>
<path d="M30 111 L100 111" stroke="#b69a6d" stroke-width="7"/><circle cx="65" cy="111" r="7" fill="#e3c477" stroke="#6c5635" stroke-width="2"/>
<path d="M60 82 L70 82 L73 100 L65 106 L57 100Z" fill="#d6b977" stroke="#6c5635" stroke-width="2"/>
<path d="M39 178 L55 178 L55 190 L32 190Z M75 178 L93 178 L99 190 L75 190Z" fill="#2e2b2c" stroke="#c5a678" stroke-width="2"/>
</svg></div><p class="small">City Watch Recruit · Illustrated uniform guide</p><p class="small">This is an illustrated equipment summary. Items shown come from your actual inventory; appearance is decorative.</p></details>
<div class="actions"><button id="cw-p16-bandage" type="button">Bandage options</button><button id="cw-p16-original" type="button">Open original inventory</button></div></details>
</div></div>`;
document.body.appendChild(overlay);
const panel=overlay.querySelector('.folio'),middle=overlay.querySelector('.p20-inv-middle'),header=overlay.querySelector('.p20-inv-header'),footer=overlay.querySelector('.actions'),sack=overlay.querySelector('.p20-sack');
const items=document.getElementById('cw-p16-items'),stats=document.getElementById('cw-p16-stats'),closeButton=document.getElementById('cw-p16-close'),app=document.getElementById('app'),original=document.getElementById('inventory');
const root='assets/p20-base-03/inventory-v06/';
const exactMap=new Map(Object.entries({"Watch badge": "item-watch-badge.exact.webp", "Blunt truncheon": "item-blunt-truncheon.exact.webp", "Bandages": "item-bandages.exact.webp", "Good truncheon": "item-good-truncheon.exact.webp", "Missing guild ledger": "item-missing-guild-ledger.exact.webp", "Torn guild invoice": "item-torn-guild-invoice.exact.webp", "Smuggler signet": "item-unknown.exact.webp", "Silver Watch badge": "item-watch-badge.exact.webp", "Urchin testimony": "item-unknown.exact.webp", "Witness protection order": "item-document.exact.webp", "Audit warrant": "item-document.exact.webp", "Thirteenth Chime case report": "item-document.exact.webp", "Filed report: The Missing Bell": "item-document.exact.webp", "Filed report: A Pie of Questionable Origin": "item-document.exact.webp", "Filed report: The Forged Permit": "item-document.exact.webp", "Filed report: Lights on the River": "item-document.exact.webp", "Filed report: The Unpaid Watchman": "item-document.exact.webp", "Filed report: The Clock That Struck Thirteen": "item-document.exact.webp", "Filed report: The Bookseller’s Secret": "item-document.exact.webp", "Filed report: The Lost Watch Badge": "item-document.exact.webp", "Filed report: The Disappearing Door": "item-document.exact.webp", "Filed report: A Very Expensive Fish": "item-document.exact.webp", "Filed report: The Night-Soil Dispute": "item-document.exact.webp", "Filed report: The Phantom Watchman": "item-document.exact.webp", "Filed report: An Unfortunate Portrait": "item-document.exact.webp", "Filed report: The Lantern Tax": "item-document.exact.webp", "Brass shavings": "item-unknown.exact.webp", "Midnight delivery docket": "item-document.exact.webp", "Clockmaker identification": "item-unknown.exact.webp", "Altered timing wheel": "item-unknown.exact.webp", "Watch boots": "item-unknown.exact.webp", "Stamped warrant": "item-document.exact.webp", "Polished Watch badge": "item-watch-badge.exact.webp", "Investigator’s magnifier": "item-unknown.exact.webp", "Reinforced Watch coat": "item-unknown.exact.webp", "Balanced truncheon": "item-blunt-truncheon.exact.webp", "Investigation satchel": "item-unknown.exact.webp"}));
const fallback='item-unknown.exact.webp';
const glyph=name=>'◇'; // Neutral fallback never substitutes a log/shield for a named item.
let previousFocus=null,previousInert=false,framePending=false,template='',lastLayout=null;
function layout(){
 framePending=false;if(!overlay.classList.contains('open'))return;
 const cs=getComputedStyle(overlay),vv=window.visualViewport;
 const aw=Math.max(100,(vv?.width||innerWidth)-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight));
 const ah=Math.max(100,(vv?.height||innerHeight)-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom));
 const wide=aw>ah*1.25;const mode=wide?'landscape':'portrait';
 const spec=wide?{w:1816,h:866,x:280,y:240,cw:1260,ch:340,cap:720}:{w:948,h:1659,x:180,y:240,cw:600,ch:1080,cap:366};
 const scale=Math.min(aw/spec.w,ah/spec.h,spec.cap/spec.w);
 panel.style.width=(spec.w*scale)+'px';panel.style.height=(spec.h*scale)+'px';panel.dataset.template=mode;
 if(mode!==template){template=mode;overlay.classList.remove('art-unavailable');panel.querySelectorAll('.p20-bag-art img').forEach(img=>{img.onerror=()=>overlay.classList.add('art-unavailable');img.src=root+'bag-'+mode+'-'+img.dataset.layer+'.exact.webp';});}
 for(const [k,v]of Object.entries({x:spec.x,y:spec.y,w:spec.cw,h:spec.ch}))panel.style.setProperty('--cavity-'+k,(v*scale)+'px');
 const font=parseFloat(getComputedStyle(items).fontSize)||16;
 const width=spec.cw*scale-10;
 const cols=font>22?1:wide?(width>=420?3:2):(width>=180?2:1);
 items.style.setProperty('--sack-cols',String(cols));
 panel.dataset.footer='flow';
 panel.dataset.compactTitle=(spec.cw*scale<font*14)?'true':'false';
 lastLayout={template:mode,scale:scale,cavity:{width:spec.cw*scale,height:spec.ch*scale},columns:cols};
}
function schedule(){if(!framePending){framePending=true;requestAnimationFrame(layout);}}
function render(){
 let state=null;try{state=window.CW_EQUIPMENT_STATE?.();}catch(error){console.warn('[P20 Inventory] State reader unavailable',error);}
 stats.replaceChildren();items.replaceChildren();sack.hidden=false;
 if(!state||!Array.isArray(state.items)){const e=document.createElement('div');e.className='item state';e.textContent='Equipment unavailable until the game has loaded.';items.appendChild(e);overlay.dataset.state='unavailable';schedule();return;}
 overlay.dataset.state=state.items.length?'populated':'empty';
 for(const [text,cls]of [[state.rank,'rankline'],[`${state.hp}/${state.maxhp} health`, ''],[`${state.coins} coins`, ''],[`${state.merit} merit`,'']]){const span=document.createElement('span');span.className=cls;span.textContent=text;stats.appendChild(span);}
 const counts=new Map();for(const name of state.items)counts.set(name,(counts.get(name)||0)+1);
 if(!counts.size){const e=document.createElement('div');e.className='item state';e.textContent='Satchel empty';items.appendChild(e);}
 for(const [name,n]of counts){
  const e=document.createElement('div');e.className='item';e.dataset.itemName=name;
  const image=document.createElement('img');image.alt='';image.setAttribute('aria-hidden','true');image.width=36;image.height=36;image.draggable=false;
  const path=exactMap.get(name)||fallback;image.dataset.asset=path;
  image.onerror=()=>{if(image.dataset.asset!==fallback){image.dataset.asset=fallback;image.src=root+fallback;}else{image.onerror=null;e.classList.add('image-unavailable');}};
  image.src=root+path;
  const g=document.createElement('span');g.className='glyph';g.setAttribute('aria-hidden','true');g.textContent=glyph(name);
  const t=document.createElement('b');t.textContent=name+(n>1?' ×'+n:'');e.append(image,g,t);items.appendChild(e);
 }
 schedule();
}
function open(){
 const wasOpen=overlay.classList.contains('open');
 if(!wasOpen){overlay.querySelector('.p20-bag-options').open=false;previousFocus=document.activeElement;previousInert=!!app?.inert;middle.scrollTop=0;}
 if(!window.CW_P20_DEV_REVIEW)overlay.classList.remove('source-view');
 render();overlay.classList.add('open');window.CW_P20_INPUT_BLOCKED=true;
 document.querySelectorAll('#app .dpad button').forEach(b=>b.dispatchEvent(new Event('pointercancel')));
 if(app)app.inert=true;
 if(!wasOpen)window.dispatchEvent(new CustomEvent('cw:p20-modal',{detail:{open:true}}));
 closeButton.focus({preventScroll:true});schedule();
}
function close(options={}){
 if(!overlay.classList.contains('open'))return;
 const terminal=options?.terminal!==false;
 overlay.classList.remove('open');window.CW_P20_INPUT_BLOCKED=false;if(app)app.inert=previousInert;
 window.dispatchEvent(new CustomEvent('cw:p20-modal',{detail:{open:false}}));
 let target=previousFocus;if(!target?.isConnected||!target.getClientRects().length)target=document.getElementById('p13-menu-launch');
 target?.focus({preventScroll:true});
 if(terminal&&new URLSearchParams(location.search).get('unified')==='1'&&parent!==window&&document.documentElement.classList.contains('p21-menu-only')&&typeof window.CWP21Engine?.leave==='function'){
  try{window.CWP21Engine.leave();}finally{if(app)app.inert=true;document.body.inert=true;document.body.style.visibility='hidden';}
 }
}
closeButton.onclick=close;
overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
window.addEventListener('keydown',e=>{
 if(!overlay.classList.contains('open'))return;
 e.stopImmediatePropagation();
 if(e.key==='Escape'){e.preventDefault();close();return;}
 if(e.key==='Tab'){
  const focusables=[...panel.querySelectorAll('button,summary,[tabindex="0"]')].filter(e=>e.getClientRects().length&&!e.disabled);
  const first=focusables[0],last=focusables[focusables.length-1];
  if(e.shiftKey&&(document.activeElement===first||document.activeElement===panel)){e.preventDefault();last?.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
 }
},true);
if(original)original.addEventListener('click',e=>{if(e.isTrusted||!window.CW_P16_BYPASS){e.stopImmediatePropagation();open();}},true);
function originalInventory(){close({terminal:false});window.CW_P16_BYPASS=true;try{original?.click();}finally{window.CW_P16_BYPASS=false;}}
document.getElementById('cw-p16-original').onclick=originalInventory;
document.getElementById('cw-p16-bandage').onclick=originalInventory;
window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);
if(window.ResizeObserver){const obs=new ResizeObserver(schedule);obs.observe(overlay);obs.observe(header);}
window.CW_P16_EQUIPMENT={open,render,close,setPresentation(value){overlay.classList.toggle('source-view',value==='source'&&!!window.CW_P20_DEV_REVIEW);schedule();},report(){return{version:'P20-INV-04',artStatus:'Jimmy v0.6 partial checkpoint; Buddy runtime trial, not final art',open:overlay.classList.contains('open'),state:overlay.dataset.state,footer:'flow',columns:getComputedStyle(items).gridTemplateColumns,itemGroups:items.querySelectorAll('.item:not(.state)').length,presentation:overlay.classList.contains('source-view')?'source':'bag-first',layout:lastLayout,iconSize:36,authoredNameCoverage:28,authoredCatalogueSize:37};}};
})();
