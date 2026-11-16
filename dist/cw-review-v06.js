/* Optional, observed review progress. Never writes campaign state or advances cases. */
(() => {
 'use strict';
 const KEY='city_watch_lab01_v06_review', ids=['watch','notebook','notes','bridge','music'];
 let done=new Set();try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(v))done=new Set(v.filter(x=>ids.includes(x)));}catch{}
 const style=document.createElement('link');style.rel='stylesheet';style.href='cw-review.css?v=p21-b407-s039-reuse';document.head.appendChild(style);
 const dialog=document.createElement('dialog');dialog.className='cw-review-dialog';dialog.setAttribute('aria-label','Five-minute review');
 dialog.innerHTML='<header><h2>Five-minute patrol</h2><button type="button" data-review-close>Close</button></header><p>One short route through the campaign and bridge. Checks fill in as you play.</p><ol><li data-step="watch">Enter the campaign Watch House, then return to the street.</li><li data-step="notebook">Open all six Notebook sections, read an entry and go Back.</li><li data-step="notes">Write a field note and use Save notes.</li><li data-step="bridge">Walk Misbegot from one landing to the other. Meet the passing Watch patrol.</li><li data-step="music">Audition a music sample against the scene.</li></ol><p data-review-status role="status"></p><div class="cw-review-actions"><a href="index.html?review=1">Campaign</a><a href="bridge.html?review=1">Misbegot patrol</a><button type="button" data-review-music>Music & sound</button><button type="button" data-review-reset>Restart checklist</button></div><p class="review-hint">Campaign: Atlas → Watch House → Walk to destination → Talk / Use. Exit returns you to the street. Review progress is separate from cases and the director’s reward ledger.</p>';
 document.body.appendChild(dialog);
 function refresh(){dialog.querySelectorAll('[data-step]').forEach(e=>{e.classList.toggle('passed',done.has(e.dataset.step));e.setAttribute('aria-label',(done.has(e.dataset.step)?'Complete: ':'To do: ')+e.textContent);});dialog.querySelector('[data-review-status]').textContent=`${done.size}/5 checks complete${done.size===5?' — ready for Mark’s review.':'.'}`;}
 function mark(id){if(!ids.includes(id)||done.has(id))return;done.add(id);try{localStorage.setItem(KEY,JSON.stringify([...done]));}catch{}refresh();}
 function open(){refresh();if(!dialog.open)dialog.showModal();}
 dialog.querySelector('[data-review-close]').onclick=()=>dialog.close();dialog.querySelector('[data-review-reset]').onclick=()=>{done.clear();try{localStorage.removeItem(KEY);}catch{}refresh();};
 dialog.querySelector('[data-review-music]').onclick=()=>{dialog.close();window.CWMusicAudition?.open();};
 window.addEventListener('cw:review-step',e=>mark(e.detail));window.CWReview=Object.freeze({open,mark,report:()=>({completed:[...done],storageKey:KEY})});
 let entered=false;const district=document.getElementById('district');
 function place(){if(district?.textContent.trim()==='WATCH HOUSE')entered=true;else if(entered){mark('watch');entered=false;}}
 if(district)new MutationObserver(place).observe(district,{childList:true,characterData:true,subtree:true});
 const book=document.getElementById('watch-notebook'),seen=new Set();let detail=false,back=false;
 if(book){book.addEventListener('click',e=>{const tab=e.target.closest('[data-tab]');if(tab)seen.add(tab.dataset.tab);if(e.target.closest('.lab-nb-entry'))detail=true;if(e.target.closest('#lab-nb-back'))back=true;if(seen.size===6&&detail&&back)mark('notebook');});new MutationObserver(()=>{if(book.classList.contains('open')){const selected=book.querySelector('button.selected[data-tab]')?.dataset.tab;if(selected)seen.add(selected);}if(seen.size===6&&detail&&back)mark('notebook');if(book.querySelector('#nb-text')?.value.trim()&&book.querySelector('#nb-status')?.textContent.trim()==='Saved on this device.')mark('notes');}).observe(book,{attributes:true,childList:true,characterData:true,subtree:true});}
 const grid=document.getElementById('p13-menu-grid');
 if(grid){for(const [label,action] of [['Five-minute patrol',open],['Misbegot bridge patrol',()=>location.assign('bridge.html')],['Music & sound',()=>window.CWMusicAudition?.open()]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{document.getElementById('p13-menu')?.classList.remove('open');action();};grid.prepend(b);}}
 document.querySelectorAll('[data-review-open]').forEach(b=>b.onclick=open);
 if(new URL(location.href).searchParams.get('review')==='1')open();refresh();
})();
