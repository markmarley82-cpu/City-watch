export function createArmoury({city,refresh,walkTo}){
 const W=window.CWWeapons,dialog=document.createElement('dialog');dialog.className='cw-phone-menu';dialog.id='cw-armoury';dialog.setAttribute('aria-labelledby','cw-armoury-title');
 const header=document.createElement('header'),title=document.createElement('h2'),close=document.createElement('button'),body=document.createElement('div'),status=document.createElement('p');title.id='cw-armoury-title';title.textContent='Watch armoury & kit';close.textContent='Close';header.append(title,close);status.setAttribute('role','status');dialog.append(header,body,status);document.body.append(dialog);
 let page='equipment',selected=null,quote=null,opener=null,weaponPage=0;
 body.style.display='grid';body.style.gap='6px';
 const store=()=>window.CWP21State.create(localStorage);
 const near=()=>Math.hypot(...city.position().slice(0,2).map((n,i)=>n-city.world.doors.get('watch').position[i]))<=6;
 const button=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.onclick=fn;body.append(b);return b;};
 function render(message=''){
  const v=store().read(),w=W.inventory(v.state);body.replaceChildren();status.textContent=message;const intro=document.createElement('p');intro.textContent=v.state.coins+' coins · '+v.state.merit+' merit · Equipped: '+W.get(w.equipped).name+' · Bolts: '+w.bolts+' · '+(W.gear[w.armour]?.name||'Issued coat')+' · '+(W.gear[w.boots]?.name||'Issued boots');body.append(intro);
  if(selected){
   const [command,id,label]=selected;const p=document.createElement('p');p.textContent=label+'?';body.append(p);
   button('Confirm',()=>commit(command,id));button('Cancel',()=>{selected=null;render();});return;
  }
  if(page==='gear'){
   for(const item of Object.values(W.gear)){
    const p=document.createElement('p');p.textContent=item.name+' — '+item.description;body.append(p);
    const owned=w.gearOwned.includes(item.id),equipped=w[item.slot]===item.id;
    const action=owned?'equip-gear':'buy-gear';
    const b=button(equipped?'Equipped':owned?'Equip '+item.name:'Buy '+item.name+' · '+item.price+' coins',()=>owned?commit(action,item.id):confirm(action,item.id,'Buy and equip '+item.name+' for '+item.price+' coins'));
    b.disabled=equipped||(!owned&&v.state.coins<item.price);
   }
   button('Back to weapons',()=>{page='equipment';render();});
  }else if(page==='training'){
   for(const [id,merit]of [['sword',25],['crossbow',65]]){const b=button((id==='sword'?'Sword':'Crossbow')+' drill · '+(w.training[id]?'Completed':merit+' merit required · 4 coins · +3 merit once'),()=>confirm('train',id,'Complete '+id+' drill for 4 coins · earn 3 merit once'));b.disabled=w.training[id]||v.state.merit<merit;}
   button('Back to equipment',()=>{page='equipment';render();});
  }else{
   for(const d of [Object.values(W.definitions)[weaponPage]]){
    const art=document.createElement('canvas');art.width=100;art.height=64;art.setAttribute('aria-label',d.name);art.style.cssText='max-width:100px;margin:auto';window.CWWeaponArt.icon(art.getContext('2d'),d.id==='ironbound-truncheon'?'balanced-truncheon':d.id,55,47,.9);body.append(art);
    const p=document.createElement('p');p.textContent=d.name+' — '+d.description+(d.training&&!w.training[d.training]?' Requires '+d.merit+' merit and the '+d.training+' drill (4 coins).':'');body.append(p);
    const owned=w.owned.includes(d.id),b=button(owned?(w.equipped===d.id?'Equipped':'Equip '+d.name):'Buy '+d.name+' · '+d.price+' coins',()=>owned?commit('equip',d.id):confirm('buy',d.id,'Buy '+d.name+' for '+d.price+' coins'));b.disabled=w.equipped===d.id||!!d.training&&!w.training[d.training];
   }
   const pages=document.createElement('div');pages.style.cssText='display:flex;gap:6px';body.append(pages);
   for(const [label,delta]of [['Previous',-1],['Next',1]]){const b=document.createElement('button');b.textContent=label;b.style.flex='1';b.disabled=weaponPage+delta<0||weaponPage+delta>=Object.keys(W.definitions).length;b.onclick=()=>{weaponPage+=delta;render();};pages.append(b);}
   if(Object.values(W.definitions)[weaponPage].id==='service-crossbow')button('Six bolts · 3 coins',()=>confirm('bolts','bolts','Buy six bolts for 3 coins')).disabled=!w.owned.includes('service-crossbow')||w.bolts>54;
   button('Armour & boots',()=>{page='gear';render();});
   button('Weapon training',()=>{page='training';render();});
  }
 }
 function confirm(command,id,label){quote=store().read().revision;selected=[command,id,label];render();}
 function commit(command,id){
  if(!near()){selected=null;render('Return to the Watch House counter.');return;}
  const st=store();try{const result=st.armoury(command,id,selected?quote:st.read().revision);selected=null;if(!result.ok){render(result.reason);return;}refresh();render(command==='train'?'Drill completed and saved. +3 merit, once for this weapon.':command.startsWith('equip')?'Equipment fitted.':'Purchase saved.');}catch{selected=null;render('The change could not be saved. Please retry.');}
 }
 close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>{selected=null;opener?.focus({preventScroll:true});});
 return {open(){const v=store().read();if(v.pending){city.tell('Finish the current incident before changing equipment.');return false;}if(!near()){walkTo('watch');city.tell('Walk to the Watch House, then open Armoury & kit.');return false;}city.stop();opener=document.activeElement;page='equipment';selected=null;render();dialog.showModal();close.focus();return true;}};
}
