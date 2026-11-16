import {counterService,isFunctionalCounter,runCounterService} from './counter-services.mjs?v=p21-b407-s039-reuse';
import {mountLodgingView} from './lodging-view.mjs?v=game-time';
import {editionFor,ownsNewspaper,purchaseNewspaper} from '../newspapers/purchases.mjs?v=p21-b407-s039-reuse';

import {commitPurchase} from './shop-transactions.mjs?v=p21-b407-s039-reuse';
import {mountCounterTray} from './counter-tray.mjs?v=p21-b407-s039-reuse';
import {hideParkCounter,appendHideParkCounters} from '../hide-park-counters.mjs?v=p21-b407-s039-reuse';

const ASSET_ROOT='assets/city-services-b97/';
const scripts=['shop-scene-data.js','npc-motion.js','shop-fit-viewer.js','campaign-shop-adapter.js','shop-preparations.js'];
const sales=Object.freeze({
 provisions:{key:'campaign-provisions-meal',label:'Bread meal',price:2,copy:'Recover 8 health, capped at maximum health.'},
 apothecary:{key:'campaign-apothecary-bandages',label:'Bandages',price:3,copy:'One bandage restores up to 6 stamina in combat for one action. Carry at most 6.'},
 'used-goods':{key:'campaign-used-goods-satchel',label:'Investigation satchel',price:9,copy:'An investigation satchel for your evidence kit. One purchase only.'},
 gimlet:{key:'campaign-gimlet-meal',label:'Counter meal',price:2,copy:'Recover 8 health, capped at maximum health.'},
 'burleigh-stronginthearm':{key:'campaign-burleigh-balanced-truncheon',label:'Balanced truncheon',price:12,copy:'One extra stamina damage per strike; retains shove and arrest. One purchase only.'},
 'curry-gardens':{key:'campaign-curry-meal',label:'Curry meal',price:2,copy:'Recover 8 health, capped at maximum health.'},
 poleforth:{key:'campaign-poleforth-newspaper',label:'Current Times edition',price:1,copy:'Keep the current Times edition in your Notebook. Owned editions are not charged again.'},
 'laughing-falafel':{key:'campaign-laughing-falafel-meal',label:'Night-patrol meal',price:2,copy:'Recover 8 health, capped at maximum health.'}
});
const extraSales=Object.freeze({
 provisions:[{key:'campaign-provisions-snack',label:'Bread and cheese',price:1,copy:'Eat here to recover up to 3 health.'},{key:'campaign-provisions-coffee',label:'Strong coffee',price:6,copy:'Carry one dose. In combat, spend one action beside a compatible downed partner to rouse them with 4 stamina. Once per partner per incident, including pursuit. Carry at most 2. Unsuitable for trolls, golems or undead officers; ordinary coffee cannot restore the dead.'}],
 apothecary:[{key:'campaign-apothecary-dressings',label:'Two clean dressings',price:6,copy:'Two bandages. Each restores up to 6 stamina in combat for one action. Carry at most 6.'}],
 gimlet:[{key:'campaign-gimlet-large-meal',label:'Large counter meal',price:3,copy:'Eat here to recover up to 12 health.'}],
 'curry-gardens':[{key:'campaign-curry-large-meal',label:'Large curry meal',price:3,copy:'Eat here to recover up to 12 health.'}],
 'laughing-falafel':[{key:'campaign-laughing-falafel-snack',label:'Small supper',price:1,copy:'Eat here to recover up to 3 health.'}],
 'burleigh-stronginthearm':[
 {key:'weapon-sword',weapon:'service-sword',command:'buy',label:'Plain service sword',price:18,copy:'Requires sword drill (25 merit). +2 strike damage; weaker Guard. Ready your truncheon before restraint.'},
 {key:'weapon-crossbow',weapon:'service-crossbow',command:'buy',label:'Ordinary crossbow',price:24,copy:'Requires crossbow drill (65 merit). Range 2–4 clear cells. Loading and firing each cost one action.'},
 {key:'weapon-bolts',weapon:'bolts',command:'bolts',label:'Six crossbow bolts',price:3,copy:'Requires an owned crossbow. Carry at most 60 bolts.'}]
});
const offersFor=key=>{key=hideParkCounter(key)?.stockKey||key;return [...(sales[key]?[sales[key]]:[]),...(extraSales[key]||[])];};
const stockLabels=Object.freeze({provisions:'Ordinary provisions',cobbler:'Boot and leather work',tailor:'Clothing alterations',ironmonger:'Household ironwork','lamp-supplier':'Candles and lamp supplies',stationer:'Paper and binding',apothecary:'Everyday dressings','used-goods':'Second-hand goods',gimlet:'Prepared food',shonky:'Second-hand clothing','burleigh-stronginthearm':'Weapons and fittings','wienrich-boettcher':'Confectionery','curry-gardens':'Prepared food',boffo:'Novelties',poleforth:'Newspapers',drayman:'Butcher orders','pointer-pickles':'Mineral samples',shatta:'Tailoring',ironcrust:'Dwarf bread','laughing-falafel':'Night groceries',crumleys:'Toys and orders',hugos:'Grooming'});

function loadScript(file){return new Promise((resolve,reject)=>{const prior=document.querySelector('script[data-city-services="'+file+'"]');if(prior){if(prior.dataset.loaded==='true')resolve();else{
 const cleanup=()=>{prior.removeEventListener('load',loaded);prior.removeEventListener('error',failed);};
 const loaded=()=>{cleanup();resolve();};
 const failed=()=>{cleanup();reject(Error('City services component failed to load: '+file));};
 prior.addEventListener('load',loaded,{once:true});prior.addEventListener('error',failed,{once:true});
 }return;}const s=document.createElement('script');const url=new URL(file,import.meta.url);url.search=new URL(import.meta.url).search;s.src=url.href;s.dataset.cityServices=file;s.onload=()=>{s.dataset.loaded='true';resolve();};s.onerror=()=>{s.remove();reject(Error('City services component failed to load: '+file));};document.head.append(s);});}
function addStyle(file){const url=new URL(file,import.meta.url);url.search=new URL(import.meta.url).search;const href=url.href;if([...document.styleSheets].some(s=>s.href===href))return;const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.append(link);}
const clone=value=>JSON.parse(JSON.stringify(value));
function fittedData(source,manifest){
 const data=clone(source),files=new Map(manifest.files.map(f=>[f.file,f]));
 for(const c of data.characters)c.asset=c.asset.replace(/^assets\//,'');
 for(const scene of data.scenes){scene.image=scene.image.replace(/^assets\//,'');for(const p of scene.placements)if(p.workAsset)p.workAsset=p.workAsset.replace(/^assets\//,'');}
 for(const c of data.characters){const record=files.get(c.asset),rig=data.rigs[c.key];if(!record||!rig)continue;const rx=record.runtimeSize[0]/record.sourceSize[0],ry=record.runtimeSize[1]/record.sourceSize[1];rig.bounds=[rig.bounds[0]*rx,rig.bounds[1]*ry,rig.bounds[2]*rx,rig.bounds[3]*ry];c.asset+='?v='+record.runtimeSHA256.slice(0,16);}
 const work=data.scenes.flatMap(s=>s.placements).find(p=>p.workRig&&p.workAsset);if(work){const record=files.get(work.workAsset),rig=data.rigs[work.workRig];if(record&&rig){const rx=record.runtimeSize[0]/record.sourceSize[0],ry=record.runtimeSize[1]/record.sourceSize[1];rig.bounds=[rig.bounds[0]*rx,rig.bounds[1]*ry,rig.bounds[2]*rx,rig.bounds[3]*ry];work.workAsset+='?v='+record.runtimeSHA256.slice(0,16);}}
 return data;
}
function reasonText(reason){return ({funds:'Not enough coins. No money was taken.',owned:'Already owned. No money was taken.','full-health':'Health is already full. No money was taken.','encounter-active':'Finish the current encounter before preparing.','already-prepared':'A preparation is already queued for this night.','stale-quote':'The campaign changed; review the offer again.','invalid-preparation':'The saved preparation needs recovery before another can be bought.','capacity':'Your supply pouch is full. No money was taken.','save':'Could not save the purchase. No money was taken.','save-failed':'Could not save the purchase. No money was taken; free some storage and try again.'})[reason]||'The purchase could not be completed. No money was taken.';}

export async function createCityServicesHost({city,makeStore}){
 addStyle('city-services.css?v=p21-b461-watch-ui');await Promise.all(scripts.map(loadScript));
 const [assetManifest,lodging]=await Promise.all([fetch(ASSET_ROOT+'manifest.json').then(r=>r.json()),fetch(new URL('lodging-placements.json',import.meta.url)).then(r=>r.json())]);
 const data=appendHideParkCounters(fittedData(window.QUILL_FITTED_SHOPS,assetManifest),city.world);
 const dialog=document.createElement('dialog');dialog.id='cw-city-services';dialog.setAttribute('aria-labelledby','cw-city-services-title');
 dialog.innerHTML='<div class="services-shell"><header><div><h2 id="cw-city-services-title">City shops & lodging</h2></div><button type="button" data-services-close>Return to patrol</button></header><details class="services-options"><summary>Shops or lodging</summary><nav class="services-tabs" aria-label="City services"><button type="button" data-services-tab="shops" aria-pressed="true">Shops</button><button type="button" data-services-tab="lodging" aria-pressed="false">Lodging</button></nav></details><section data-services-panel="shops"><aside class="services-offer"><div class="services-art"><figure><img data-shop-exterior alt=""><figcaption>Shop front</figcaption></figure><figure><img data-shop-stock alt=""><figcaption data-shop-stock-label>Featured stock</figcaption></figure></div><div class="services-purchase" tabindex="-1"><label data-sale-selector>Choose an item to buy <select aria-label="Choose goods" data-sale-select></select></label><h3 data-sale-title></h3><button type="button" data-sale-buy></button><p data-sale-balance></p><p data-sale-copy></p><button type="button" data-counter-action hidden></button><button type="button" data-walk-shop hidden>Walk to this shop</button><p data-counter-location></p><div data-preparation hidden><h3 data-prep-title></h3><p data-prep-copy></p><button type="button" data-prep-buy></button></div><p role="status" data-sale-status></p></div></aside><details class="services-options"><summary data-shop-options>Shop options</summary><label class="services-boundary"><input type="checkbox" data-trade-visits> Include trade visits · no goods for sale</label><div id="cw-fitted-shops"></div></details></section><section data-services-panel="lodging" hidden></section></div>';
 document.body.append(dialog);
 const $=selector=>dialog.querySelector(selector),shopHost=$('#cw-fitted-shops'),saleStatus=$('[data-sale-status]');
 $('[data-services-close]').textContent='Close';
 $('[data-services-close]').setAttribute('aria-label','Close shop and return to patrol');
 const goodsList=document.createElement('div');
 goodsList.className='services-goods';
 goodsList.setAttribute('aria-label','Goods for sale');
 $('[data-sale-balance]').after(goodsList);
 const viewer=window.createQuillFittedShops(shopHost,{data,shopKey:'provisions',assetRoot:ASSET_ROOT,gameMode:true,counterMode:true,isVisible:()=>false,onBrowse:()=>{$('.services-purchase').scrollIntoView({block:'nearest'});$('.services-purchase').focus();},onError:error=>saleStatus.textContent=error.message});
 const shopSelect=shopHost.querySelector('[aria-label="Choose shop"]');
 const trayRoot=document.createElement('section');shopHost.after(trayRoot);const tray=mountCounterTray({root:trayRoot,weaponPainter:(...args)=>window.CWWeaponArt?.icon(...args),onSelect:entry=>{if(!counterQuoteCurrent())return;traySelection=entry.key;if(entry.kind==='goods')$('[data-sale-select]').value=entry.key;refreshShop(true);const offer=$('.services-purchase');offer.focus({preventScroll:true});offer.scrollIntoView({block:'center'});}});
 function filterDirectory(){const visits=$('[data-trade-visits]').checked;for(const option of shopSelect.options){const descriptor=counterService(option.value);option.hidden=!visits&&!descriptor?.functional;option.disabled=option.hidden;const title=data.scenes.find(s=>s.key===option.value)?.title||option.value;option.textContent=title+' · '+(descriptor?.label||'Trade visit');}if(shopSelect.selectedOptions[0]?.disabled){shopSelect.value='provisions';viewer.setShop('provisions');}}
 $('[data-trade-visits]').onchange=filterDirectory;filterDirectory();
 const lodgingView=mountLodgingView({root:$('[data-services-panel="lodging"]'),makeStore,city,assetRoot:ASSET_ROOT,placements:lodging.placements,onChange:()=>{city.refreshClock?.();city.update();window.CWP21Game?.refresh?.();}});
 let lastShop='',quoteRevision=0,traySelection='';
 function state(){return makeStore().read();}
 function readOwnedNewspaper(){
  const papers=window.CW_NEWSPAPERS;
  if(!papers||papers.loading){saleStatus.textContent='The newspaper is still loading. Try Read again.';return false;}
  if(papers.failed||typeof papers.open!=='function'){saleStatus.textContent='The newspaper could not be opened. Return to patrol and use Retry newspaper delivery at a street newspaper seller.';return false;}
  dialog.close();
  queueMicrotask(()=>{if(papers.open({paper:'times'})===false)city.tell('The newspaper could not be opened. Return to a street newspaper seller for delivery help.');});
  return true;
 }
 function shopImage(key,kind){return hideParkCounter(key)?.body||ASSET_ROOT+key+'-'+kind+'.webp';}
 function prepFor(key){return Object.values(window.QuillShopPreparations.offers).find(o=>o.shopKey===key)||null;}
 function stockArt(file){for(const key of ['hide-park-cloth','hide-park-provisions'])file=file.replace('stock-'+key+'.webp','stock-'+hideParkCounter(key).stockKey+'.webp');const row=assetManifest.files.find(r=>r.file===file);return ASSET_ROOT+file+(row?'?v='+row.runtimeSHA256.slice(0,16):'');}
 function trayEntries(key){const entries=offersFor(key).map(o=>{let art=stockArt('stock-'+key+'.webp'),weapon;if(o.key.includes('coffee'))art='assets/shop-tray/coffee.webp';else if(o.key.includes('satchel'))art='assets/p20-base-03/inventory-v06/bag-portrait-front.exact.webp';else if(o.key.includes('balanced-truncheon'))art='assets/p20-base-03/inventory-v06/item-good-truncheon.exact.webp';else if(o.weapon){art=null;if(o.weapon!=='bolts')art='assets/shop-tray/'+o.weapon+'.webp';}return {key:o.key,label:o.label,shortLabel:o.weapon==='bolts'?'Six bolts':o.label,price:o.price,kind:'goods',art,weapon};});const prep=prepFor(key);if(prep)entries.push({key:prep.id,label:prep.label,price:prep.price,kind:'preparation',art:prep.kind==='guard'?stockArt('stock-gimlet.webp'):prep.kind==='footwork'?stockArt('stock-quality-boots.webp'):null});if(!entries.length){const descriptor=counterService(key);entries.push({key:'service:'+key,label:descriptor?.label||'Trade visit',kind:'service',art:stockArt('stock-'+key+'.webp')});}return entries;}
 function stockBlockLabel(offer,record){
  const reason=window.QuillCampaignShop.stockRestriction?.(record.state,offer.key);
  return reason==='owned'?'Already owned':reason==='capacity'?'Not enough room':'';
 }
 function renderGoods(offers,record,entries){
  const focusedKey=goodsList.contains(document.activeElement)?document.activeElement.dataset.goodsBuy:null,counterOpen=typeof dialog==='undefined'||dialog.dataset?.serviceContext!=='directory';
  goodsList.replaceChildren();
  for(const offer of offers){
   const card=document.createElement('article');card.className='services-good';
   const art=entries.find(entry=>entry.key===offer.key)?.art;
   if(art){const image=document.createElement('img');image.src=art;image.alt='';card.append(image);}
   const info=document.createElement('div'),title=document.createElement('h3'),price=document.createElement('p');
   title.textContent=offer.label;price.className='services-good-price';price.textContent=offer.price+' coin'+(offer.price===1?'':'s');
   const details=document.createElement('details'),summary=document.createElement('summary'),description=document.createElement('p');
   summary.textContent='What it does';description.textContent=offer.copy;details.append(summary,description);info.append(title,price,details);
   const buy=document.createElement('button');buy.type='button';buy.dataset.goodsBuy=offer.key;
   buy.textContent='Buy';buy.setAttribute('aria-label','Buy '+offer.label+' for '+price.textContent);
   const ownedPaper=offer.key==='campaign-poleforth-newspaper'&&ownsNewspaper(record.state,'times');
   const fullHealth=window.QuillCampaignShop.specs[offer.key]?.type==='meal'&&record.state.hp>=record.state.maxhp;
   const stockBlock=stockBlockLabel(offer,record);
   buy.disabled=!!record.pending||!ownedPaper&&(!counterOpen||offer.price>record.state.coins||fullHealth||!!stockBlock);
   if(ownedPaper){buy.textContent='Read';buy.setAttribute('aria-label','Read '+offer.label);}
   else if(!counterOpen){buy.textContent='Visit shop';buy.setAttribute('aria-label','Walk to this shop before buying '+offer.label);}
   else if(fullHealth)buy.textContent='Health full';
   else if(record.pending)buy.textContent='In encounter';
   else if(stockBlock){buy.textContent=stockBlock;buy.setAttribute('aria-label',offer.label+': '+stockBlock);}
   else if(offer.price>record.state.coins)buy.textContent='Need '+(offer.price-record.state.coins)+' coins';
   buy.onclick=()=>{if(!counterQuoteCurrent())return;if(ownedPaper){readOwnedNewspaper();return;}$('[data-sale-select]').value=offer.key;traySelection=offer.key;commitSale();};
   card.append(info,buy);goodsList.append(card);
   if(offer.key===focusedKey)buy.focus({preventScroll:true});
  }
  dialog.classList.toggle('has-visible-goods',offers.length>0);
 }
 function refreshShop(force=false){const key=viewer.getState().shop;if(!force&&key===lastShop)return;const changed=key!==lastShop,select=$('[data-sale-select]'),before=changed?'':select.value,offers=offersFor(key);lastShop=key;select.replaceChildren();for(const offer of offers)select.add(new Option(offer.label+' · '+offer.price+' coin'+(offer.price===1?'':'s'),offer.key));if(offers.some(o=>o.key===before))select.value=before;$('[data-sale-selector]').hidden=offers.length<2;
  const sale=offers.find(o=>o.key===select.value),prep=prepFor(key),record=state(),counterOpen=dialog.dataset.serviceContext!=='directory';quoteRevision=record.revision;if(changed)saleStatus.textContent='';
  $('[data-shop-exterior]').src=shopImage(key,'exterior');$('[data-shop-exterior]').alt=(data.scenes.find(s=>s.key===key)?.title||key)+' exterior';
  const stockKey=hideParkCounter(key)?.stockKey||key,stock=stockKey==='cobbler'?'stock-cobbler.webp':'stock-'+stockKey+'.webp';$('[data-shop-stock]').src=ASSET_ROOT+stock;$('[data-shop-stock]').alt=(stockLabels[stockKey]||'Shop')+' stock illustration';$('[data-shop-stock-label]').textContent=stockLabels[stockKey]||'Featured stock';
  $('[data-sale-balance]').textContent='Purse: '+record.state.coins+' coins · Health '+record.state.hp+'/'+record.state.maxhp+' · '+record.state.items.filter(i=>i==='Bandages').length+' bandages · '+record.state.items.filter(i=>i==='Strong coffee').length+' coffee';
  const buy=$('[data-sale-buy]');if(sale){$('[data-sale-title]').textContent=sale.label;$('[data-sale-copy]').textContent=sale.copy;buy.hidden=false;const short=sale.price-record.state.coins;buy.disabled=!!record.pending||!counterOpen||short>0;buy.textContent=record.pending?'Finish the encounter before buying':!counterOpen?'Walk to this shop to buy':short>0?'Need '+short+' more coin'+(short===1?'':'s'):'Buy '+sale.label+' for '+sale.price+' coin'+(sale.price===1?'':'s');if(counterOpen&&!sale.weapon&&window.QuillCampaignShop.specs[sale.key]?.type==='meal'&&record.state.hp>=record.state.maxhp){buy.disabled=true;buy.textContent='Health already full';}const stockBlock=stockBlockLabel(sale,record);if(stockBlock&&counterOpen&&!record.pending){buy.disabled=true;buy.textContent=stockBlock;}}else{const descriptor=counterService(key);$('[data-sale-title]').textContent=descriptor?.label||'Trade visit';$('[data-sale-copy]').textContent=descriptor?.copy||'Speak to the staff and examine the counter.';buy.hidden=true;}
  const descriptor=counterService(key),action=$('[data-counter-action]');action.hidden=!descriptor?.action;action.textContent=descriptor?.actionLabel||'';action.disabled=!!record.pending;
  const binding=[...city.world.doors.values()].find(d=>d.shop_key===key&&!d.held);$('[data-walk-shop]').hidden=!binding;$('[data-counter-location]').textContent=binding?'Street entrance: '+binding.name+'.':'Available through City Trades. A street entrance has not been fitted for this shop.';
  const prepBox=$('[data-preparation]');prepBox.hidden=!prep;if(prep){$('[data-prep-title]').textContent=prep.label+' · preparation';$('[data-prep-copy]').textContent=prep.benefit+' '+prep.use;$('[data-prep-buy]').textContent=counterOpen?'Prepare for '+prep.price+' coins':'Walk to this shop to prepare';const queued=record.state.flags.shopPreparation;$('[data-prep-buy]').disabled=!!record.pending||!counterOpen||!!queued&&(!window.QuillShopPreparations.validPreparation(queued)||queued.night===record.state.night);if(queued?.night===record.state.night)$('[data-prep-copy]').textContent+=' You already have a preparation for tonight. Preparations do not stack.';}
  const entries=trayEntries(key);if(changed||!entries.some(e=>e.key===traySelection))traySelection=sale?.key||entries[0].key;if(sale&&entries.find(e=>e.key===traySelection)?.kind==='goods')traySelection=sale.key;const chosen=entries.find(e=>e.key===traySelection),preparing=chosen.kind==='preparation';$('[data-sale-title]').hidden=preparing;$('[data-sale-copy]').hidden=preparing;$('[data-sale-buy]').hidden=!sale||preparing;prepBox.hidden=!preparing;tray.set({entries,selected:traySelection,caption:chosen.label+(chosen.price===undefined?'':' · '+chosen.price+' coins')});
  renderGoods(offers,record,entries);
  prepBox.hidden=!prep;
 }
 function counterQuoteCurrent(){if(viewer.getState().shop===lastShop)return true;refreshShop(true);saleStatus.textContent='The counter changed. Review the offer and choose again. No money was taken.';return false;}
 function commitSale(){if(!counterQuoteCurrent())return;if(typeof dialog!=='undefined'&&dialog.dataset?.serviceContext==='directory'){saleStatus.textContent='Walk to this shop before buying. No money was taken.';refreshShop(true);return;}const key=viewer.getState().shop,sale=offersFor(key).find(o=>o.key===$('[data-sale-select]').value);if(!sale)return;const record=state();if(record.pending){saleStatus.textContent='Finish the current encounter before shopping.';return;}if(record.revision!==quoteRevision){saleStatus.textContent=reasonText('stale-quote');refreshShop(true);return;}
  if(sale.key==='campaign-poleforth-newspaper'){const receipt=purchaseNewspaper({storage:localStorage,api:window.CWP21State,paper:'times',price:sale.price,expectedEdition:editionFor(record.state)});saleStatus.textContent=receipt.ok?(receipt.charged?'Edition purchased and saved.':'You already own this edition.') : reasonText(receipt.reason);refreshShop(true);return;}
  const result=commitPurchase({store:makeStore(),revision:quoteRevision,change:current=>{
   const bought=sale.weapon?window.CWWeapons.change(current.state,sale.command,sale.weapon):window.QuillCampaignShop.purchase(current.state,sale.key);
   return bought.ok?{...bought,record:{...current,state:bought.state},receipt:bought.receipt||{item:sale.label}}:bought;
  }});
  if(!result.ok){saleStatus.textContent=reasonText(result.reason)==='The purchase could not be completed. No money was taken.'&&sale.weapon?result.reason:reasonText(result.reason);refreshShop(true);return;}
  saleStatus.textContent=result.receipt.effect==='heal'?'Meal eaten · '+result.receipt.hpRestored+' health restored.':result.receipt.item+' purchased and saved.';city.update();window.CWP21Game?.refresh?.();refreshShop(true);
 }
 function commitPreparation(){if(!counterQuoteCurrent())return;if(typeof dialog!=='undefined'&&dialog.dataset?.serviceContext==='directory'){saleStatus.textContent='Walk to this shop before preparing. No money was taken.';refreshShop(true);return;}const offer=prepFor(viewer.getState().shop);if(!offer)return;const result=commitPurchase({store:makeStore(),revision:quoteRevision,change:current=>window.QuillShopPreparations.purchase(current,offer.id,quoteRevision)});saleStatus.textContent=result.ok?offer.label+' is prepared for your next encounter tonight.':reasonText(result.reason);window.CWP21Game?.refresh?.();refreshShop(true);}
 $('[data-counter-action]').onclick=async()=>{try{const result=await runCounterService(viewer.getState().shop,{beforeOpen:()=>dialog.close(),appearance:()=>city.characterPainter.openStudio(),notebook:()=>window.CW_NOTEBOOK?.openSection('My Notes')});if(!result.ok)city.tell('This service could not open. Please try again.');}catch(error){city.tell('This service could not open: '+error.message);}};
 $('[data-walk-shop]').onclick=()=>{const d=[...city.world.doors.values()].find(d=>d.shop_key===viewer.getState().shop&&!d.held);if(d){dialog.close();if(typeof city.serviceRoute==='function')city.serviceRoute(d.position,d.edge,d.name);else city.nav(d.position,d.edge);}};
 $('[data-sale-select]').onchange=event=>{traySelection=event.target.value;refreshShop(true);};$('[data-sale-buy]').onclick=commitSale;$('[data-prep-buy]').onclick=commitPreparation;
 function tab(name){if(name==='lodging')lodgingView.refresh();else lodgingView.dismiss();for(const b of dialog.querySelectorAll('[data-services-tab]'))b.setAttribute('aria-pressed',String(b.dataset.servicesTab===name));for(const p of dialog.querySelectorAll('[data-services-panel]'))p.hidden=p.dataset.servicesPanel!==name;}
 for(const b of dialog.querySelectorAll('[data-services-tab]'))b.onclick=()=>tab(b.dataset.servicesTab);
 $('[data-services-close]').onclick=()=>dialog.close();dialog.addEventListener('cancel',e=>{e.preventDefault();dialog.close();});dialog.addEventListener('close',()=>city.update());
 function pulse(){if(dialog.open)refreshShop();requestAnimationFrame(pulse);}requestAnimationFrame(pulse);
 async function open({shopKey,grade}={}){const record=state();if(record.pending){city.tell('Finish the current encounter before using city shops or lodging.');return false;}city.stop();saleStatus.textContent='';
  dialog.dataset.serviceContext=shopKey?'counter':grade!==undefined?'inn':'directory';
  $('#cw-city-services-title').textContent=shopKey?(data.scenes.find(scene=>scene.key===shopKey)?.title||'Shop'):grade!==undefined?'Rest & rooms':'City shops & lodging';
  $('[data-shop-options]').textContent=hideParkCounter(shopKey)?'Counter':shopKey?'Shopkeeper':'Shop options';
  for(const options of dialog.querySelectorAll('.services-options'))options.open=false;
  if(shopKey){const descriptor=counterService(shopKey);if(!descriptor)return false;if(!descriptor.functional){$('[data-trade-visits]').checked=true;filterDirectory();}shopSelect.value=shopKey;await viewer.setShop(shopKey);}tab(grade===undefined?'shops':'lodging');if(grade!==undefined)lodgingView.select(grade);refreshShop(true);if(!dialog.open)dialog.showModal();return true;}
 return Object.freeze({open,dialog,viewer,report:()=>({shops:data.scenes.length,characters:data.characters.length,sales:Object.keys(sales).reduce((n,key)=>n+offersFor(key).length,0),preparations:Object.keys(window.QuillShopPreparations.offers).length,lodgings:lodging.placements.length,runtimeAssets:assetManifest.count})});
}
