import {mountConversationPortrait} from './cw-conversation-portraits.mjs';
import {paintCounterTray} from './city-services/counter-tray.mjs?v=p21-b407-s039-reuse';
import {styleStreetSeller} from './cw-street-seller-ui.mjs?v=p21-b461-watch-ui';
import './cw-dibbler-goods.js?v=p21-b407-s039-reuse';
import {commitPurchase} from './city-services/shop-transactions.mjs?v=p21-b407-s039-reuse';
const Goods=globalThis.CWDibblerGoods;
export function chooseStop(stops,player,current){
 const d=p=>Math.hypot(player[0]-p[0],player[1]-p[1]);
 if(current&&d(current.p)<45)return current;
 return stops.filter(s=>d(s.p)>32).sort((a,b)=>d(a.p)-d(b.p))[0]||current||stops[0];
}
export function createDibbler({city,actors,nearest,onChange}){
 const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const stops=[];
 for(const id of ['watch','market','drum','shades','university','warehouse','archives']){
  const door=city.world.doors.get(id);if(!door)continue;
  for(const [dx,dy] of (id==='watch'?[[-2,4],[-4,4],[-6,4]]:[[4,2],[-4,2],[2,4],[-2,-4]])){
   const p=nearest([door.position[0]+dx,door.position[1]+dy]);
   if(distance(p,door.position)<2||distance(p,door.position)>12||actors.some(a=>distance(a.p,p)<2)||[...city.world.doors.values()].some(d=>distance(d.position,p)<2))continue;
   stops.push({id,p});break;
  }
 }
 let current=stops.slice().sort((a,b)=>distance(a.p,city.position())-distance(b.p,city.position()))[0];
 if(!current)throw Error('No reachable Dibbler selling stop');
 const actor={id:'dibbler',name:'C.M.O.T. Dibbler',p:current.p.slice(),key:null};actors.push(actor);
 const image=new Image();image.src='assets/dibbler-v1/approved-sheet.webp?v=p21-b307-dibbler-appearance';
 const dialog=document.createElement('dialog');dialog.id='cw-dibbler';dialog.setAttribute('aria-labelledby','cw-dibbler-title');
 styleStreetSeller(dialog);
 dialog.innerHTML=`<header><div><small>SAUSAGES &amp; SUNDRIES</small><h2 id="cw-dibbler-title">C.M.O.T. Dibbler</h2></div><button type="button" data-close autofocus>Close</button></header>
 <section class="seller-stock" aria-label="Dibbler’s goods"><div class="seller-intro"><div data-seller-portrait><canvas width="200" height="220" role="img" aria-label="Portrait of C.M.O.T. Dibbler"></canvas></div><p>“A hungry officer! Or perhaps something for the job?”<small>Choose an item below.</small></p></div><label class="seller-selector">Browse all seven goods<select data-goods aria-label="Choose Dibbler’s goods"></select></label><canvas class="seller-tray" data-tray width="640" height="320" role="img" aria-label="Dibbler’s painted wooden tray"></canvas></section>
 <footer><details class="seller-details"><summary><span data-title></span><small>Details &amp; use</small></summary><div><p data-description></p><p data-bag></p></div></details><p data-purse></p><button type="button" data-buy></button><p role="status" data-status></p></footer>`;
 document.body.append(dialog);const $=s=>dialog.querySelector(s),store=()=>window.CWP21State.create(localStorage);let revision,lastUpdate=0,pendingWalk=false,selected='sausage';
 const trayFrame=new Image(),itemImages=new Map();trayFrame.src='assets/shop-tray/dibbler-tray.webp';trayFrame.onload=()=>{if(dialog.open)render();};
 for(const item of Goods.items){const option=document.createElement('option');option.value=item.id;option.textContent=item.name+' · '+item.price+' coins';$('[data-goods]').append(option);const art='assets/dibbler-v1/'+item.id+'.webp',im=new Image();im.onload=()=>{itemImages.set(art,im);if(dialog.open&&selected===item.id)render();};im.src=art;}
 $('[data-goods]').onchange=event=>{selected=event.target.value;$('[data-status]').textContent='';render();};
 const nearby=()=>distance(city.position(),actor.p)<=2.5;
 function render(){chat.disabled=!window.CWPatrolConversations?.hasTalk('dibbler');const r=store().read();revision=r.revision;const item=Goods.spec(selected),left=Goods.stock(r.state,selected);$('[data-purse]').textContent='Purse: '+r.state.coins+(r.state.coins===1?' coin':' coins')+' · '+left+' left this watch-day';
 $('[data-title]').textContent=item.name+' · '+item.price+' coins';$('[data-description]').textContent=item.pitch+' '+(selected==='sausage'?'Carry in Kit. In combat: one action, recover up to 20 stamina but lose 10 health. Cannot use at 10 health or below.':'Carry in Kit. One combat action; usually useless, with a 10% chance of a small accidental benefit. No fireproofing, detection or case-solving power.');
 $('[data-goods]').value=selected;
 const tray=$('[data-tray]');if(trayFrame.complete&&trayFrame.naturalWidth){const art='assets/dibbler-v1/'+selected+'.webp';paintCounterTray(tray.getContext('2d'),trayFrame,[{key:selected,art,label:item.name}],itemImages,{width:640,height:320,selected,caption:item.name+' · '+item.price+' coins'});tray.setAttribute('aria-label','Painted wooden tray: '+item.name+' · '+item.price+' coins');}
 const b=$('[data-buy]');b.disabled=!!r.pending||!left||r.state.coins<item.price;b.textContent=r.pending?'Finish the encounter first':!left?'Sold out':r.state.coins<item.price?'Need '+(item.price-r.state.coins)+' more coins':'Buy '+item.name+' · '+item.price+' coins';
 const bag=Goods.owned(r.state);$('[data-bag]').textContent=bag.length?'Carrying '+bag.length+' Dibbler item'+(bag.length===1?'':'s')+'. Use them from Kit during a campaign encounter.':'';
 const legacy=$('.seller-intro canvas');if(legacy&&image.complete&&image.naturalWidth){const g=legacy.getContext('2d');g.clearRect(0,0,200,220);g.drawImage(image,207,124,609,1165,100-220*609/1165/2,0,220*609/1165,220);}}
 const chat=document.createElement('button');chat.type='button';chat.textContent='Have a word';chat.onclick=()=>{dialog.close();window.CWPatrolConversations?.talk('dibbler');};dialog.querySelector('footer').append(chat);
 $('[data-close]').onclick=()=>dialog.close();
 let portraitMounted=false;
 function open(){if(!nearby()||window.CWRecruitmentPending||document.querySelector('dialog[open],.cw-oath'))return false;city.stop();pendingWalk=false;$('[data-status]').textContent='';if(!portraitMounted){portraitMounted=true;const holder=$('[data-seller-portrait]'),legacy=holder.firstElementChild;mountConversationPortrait(holder,actor,{fallback:()=>{holder.replaceChildren(legacy);if(dialog.open)render();}});const profile=holder.querySelector('img');if(profile)profile.style.cssText='display:block;width:64px;height:70px;object-fit:contain;object-position:center bottom';}render();dialog.showModal();return true;}
 $('[data-buy]').onclick=()=>{if(!nearby())return;const seed=crypto.getRandomValues(new Uint32Array(1))[0],receipt=commitPurchase({store:store(),revision,change:r=>Goods.purchase(r,selected,seed)});render();$('[data-status]').textContent=receipt.ok?'Bought and saved in your Kit.':({'stale-quote':'Your patrol changed. Review the offer again.','save-failed':'Could not save. No coins were taken.','funds':'Not enough coins.','stock':'Sold out.','encounter-active':'Finish the encounter first.'}[receipt.reason]||'Purchase could not be completed.');if(receipt.ok)onChange();};
 image.onload=()=>{if(dialog.open)render();};
 return {stops,nearby,interact:open,
 update(now){if(pendingWalk&&nearby()&&!document.querySelector('dialog[open],.cw-oath')){open();return;}if(pendingWalk&&!city.isNavigating?.()&&!nearby())pendingWalk=false;if(now-lastUpdate<2000||dialog.open||pendingWalk)return;lastUpdate=now;const next=chooseStop(stops,city.position(),current);if(next!==current){current=next;actor.p=current.p.slice();}},
 click(p){if(distance(p,actor.p)>1.2)return false;if(nearby())return open();pendingWalk=true;if(!city.nav(actor.p.slice(0,2),actor.p[2])){pendingWalk=false;return true;}city.tell('Walking to Dibbler’s sausage tray.');return true;},
 find(){pendingWalk=true;if(!city.nav(actor.p.slice(0,2),actor.p[2]))pendingWalk=false;else city.tell('Walking to Dibbler’s current selling spot.');},
 drawLabels(ctx,project,zoom){if(!nearby()||zoom<.3)return;const q=project(actor.p);ctx.save();ctx.translate(q.x,q.y-74);ctx.scale(1/zoom,1/zoom);ctx.font='600 12px Georgia';ctx.textAlign='center';ctx.fillStyle='#271d13ef';ctx.fillRect(-63,-14,126,22);ctx.fillStyle='#ffe8b5';ctx.fillText('Dibbler’s tray',0,1);ctx.restore();},
 draw(ctx,p,project){if(!image.complete||!image.naturalWidth)return;const q=project(p);ctx.drawImage(image,207,124,609,1165,q.x-64*609/1165/2,q.y-64,64*609/1165,64);},
 report:()=>({identity:actor.id,position:actor.p.slice(),stop:current.id,stops:stops.map(s=>({id:s.id,p:s.p.slice()})),artReady:!!image.naturalWidth,animation:'static selling pose; relocation offscreen only',saveKeysAdded:0})};
}
