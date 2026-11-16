import {createNewspaperReader} from './newspaper-reader.mjs?v=p21-b407-s039-reuse';

/** Additive bridge for the existing P12/LAB01 notebook. No core game file edits. */
export async function installCityWatchNewspapers({catalog,editorial=null,getContext,saveKey,storage=window.CW_LAB?.storage,onRefer=null,canRead=()=>true,onPurchaseRequired=()=>{}}){
  const api=window.CW_NOTEBOOK,overlay=document.getElementById('watch-notebook'),tabs=document.getElementById('nb-tabs'),content=document.getElementById('nb-content');
  if(!api||!overlay||!tabs||!content)throw new Error('Load the real Watch notebook before the newspaper bridge');
  if(document.getElementById('cw-newspaper-reader'))throw new Error('Newspapers are already installed');
  if(!storage||typeof saveKey!=='string'||!saveKey)throw new TypeError('An explicit clipping storage key is required');
  if([window.CW_LAB?.keys?.player,window.CW_LAB?.keys?.notes].filter(Boolean).includes(saveKey))throw new Error('Clippings must not overwrite player or personal-note storage');
  let lastRaw;
  let reader;
  const showClippings=()=>{
    ensureTab();tabs.querySelectorAll('[data-tab]').forEach(b=>{const selected=b.dataset.tab==='Clippings';b.classList.toggle('selected',selected);b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
    reader.renderClippings(content);content.scrollTop=0;
    content.setAttribute('aria-labelledby',tabs.querySelector('[data-tab="Clippings"]').id);
    tabs.querySelector('[data-tab="Clippings"]')?.focus({preventScroll:true});
  };
  function ensureTab(){
    if(tabs.querySelector('[data-tab="Clippings"]'))return;
    const tab=document.createElement('button');tab.id='cw-news-clippings-tab';tab.type='button';tab.dataset.tab='Clippings';tab.textContent='Clippings';tab.onclick=showClippings;tabs.append(tab);
  }
  reader=await createNewspaperReader({catalog,editorial,getContext,onRefer,canRead,onPurchaseRequired,
    load(){lastRaw=storage.getItem(saveKey);return lastRaw==null?null:JSON.parse(lastRaw);},
    save(value){if(storage.getItem(saveKey)!==lastRaw)throw new Error('Clippings changed in another session. Reopen the game before saving.');const next=JSON.stringify(value);storage.setItem(saveKey,next);lastRaw=next;},
    onNotebook(){if(api.open()!==false)showClippings();},
    onModal(open){window.dispatchEvent(new CustomEvent('cw:p20-modal',{detail:{open}}));}
  });
  const observer=new MutationObserver(ensureTab);observer.observe(tabs,{childList:true});ensureTab();
  const listeners=[];
  // Bind an existing interaction/button with data-cw-newspaper="times|inquirer".
  // This adds no seller, door, HUD control, coin charge or public tip automatically.
  document.querySelectorAll('[data-cw-newspaper]').forEach(node=>{
    const fn=()=>reader.open({paper:node.dataset.cwNewspaper});node.addEventListener('click',fn);listeners.push([node,fn]);
  });
  return Object.freeze({open:reader.open,close:reader.close,getState:reader.getState,showClippings,
    destroy(){observer.disconnect();listeners.forEach(([n,fn])=>n.removeEventListener('click',fn));tabs.querySelector('[data-tab="Clippings"]')?.remove();reader.destroy();api.refresh();}
  });
}
