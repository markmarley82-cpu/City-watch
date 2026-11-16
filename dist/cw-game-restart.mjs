// Explicit campaign reset. Never clear origin storage or installation settings.
export const RESTART_KEYS=Object.freeze([
 'city_watch_p21_campaign_v1','city_watch_lab01_v01_player','city_watch_lab01_v07_city',
 'city_watch_p21_recruit_guide_v1','city_watch_lab01_appearance_v1',
 'city_watch_lab01_clothing_v1','city_watch_lab01_heads_v1','city_watch_fitted_equipment_v1',
 'city_watch_lab01_v01_living','city_watch_lab01_v01_notes',
 'city_watch_lab01_v01_newspaper_clippings_v1','city_watch_lab01_v01_conversations_v1'
]);
export function restartCampaign(storage,api){
 const previous=new Map(RESTART_KEYS.map(key=>[key,storage.getItem(key)]));
 let old=null;try{old=JSON.parse(previous.get(api.KEY)||'null');}catch{}
 const fresh={schema:1,revision:Number.isSafeInteger(old?.revision)?old.revision+1:1,
  state:api.fresh(),position:[126,132,'RC1'],visited:[],steps:0,encounters:[],pending:null};
 try{
  // Commit the authoritative envelope first, then remove its fallback records.
  storage.setItem(api.KEY,JSON.stringify(fresh));
  for(const key of RESTART_KEYS)if(key!==api.KEY)storage.removeItem(key);
 }catch(error){
  let restored=true;
  for(const [key,value]of previous){try{if(value===null)storage.removeItem(key);else storage.setItem(key,value);}catch{restored=false;}}
  throw new Error(restored?'Restart could not be saved. Your existing game has been kept.':'Restart could not finish. Keep this page open and retry when storage is available.',{cause:error});
 }
 return fresh;
}

export function installRestart({doc=document,host=window}={}){
 const actions=doc.querySelector('.cw-phone-extra-actions');
 if(!actions||doc.getElementById('cw-restart-open'))return;
 const opener=doc.createElement('button');opener.id='cw-restart-open';opener.type='button';opener.textContent='Restart game';actions.append(opener);
 const dialog=doc.createElement('dialog');dialog.id='cw-restart-dialog';dialog.className='cw-watch-menu cw-phone-menu';
 dialog.setAttribute('aria-labelledby','cw-restart-title');dialog.setAttribute('aria-describedby','cw-restart-warning');
 dialog.innerHTML='<header><h2 id="cw-restart-title">Restart game?</h2><button type="button" data-restart-cancel>Cancel</button></header><section class="cw-menu-content"><p id="cw-restart-warning">Start again with a new recruit. This replaces your current character, cases, rank, money, equipment, notes and saved patrol. It cannot be undone.</p><div class="cw-phone-extra-actions"><button type="button" data-restart-keep>Keep playing</button><button type="button" data-restart-confirm>Restart from the beginning</button></div><p role="status" aria-live="polite"></p></section>';
 doc.body.append(dialog);
 const keep=dialog.querySelector('[data-restart-keep]'),confirm=dialog.querySelector('[data-restart-confirm]'),status=dialog.querySelector('[role=status]');
 function close(){dialog.close();doc.getElementById('cw-phone-more-open')?.focus({preventScroll:true});}
 dialog.querySelector('[data-restart-cancel]').onclick=close;keep.onclick=close;
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 opener.onclick=()=>{doc.getElementById('cw-phone-more')?.close();status.textContent='';dialog.showModal();keep.focus({preventScroll:true});};
 confirm.onclick=()=>{
  if(host.CWGameRestarting)return;
  confirm.disabled=true;host.CWGameRestarting=true;
  try{
   restartCampaign(host.localStorage,host.CWP21State);
   status.textContent='Starting a new game…';
   const url=new URL(host.location.href);url.searchParams.delete('rebuild-room');url.hash='';
   host.location.replace(url.href);
  }catch(error){host.CWGameRestarting=false;confirm.disabled=false;status.textContent=error.message;keep.focus({preventScroll:true});}
 };
 return {dialog,opener};
}
if(typeof window!=='undefined'&&typeof document!=='undefined')installRestart();
