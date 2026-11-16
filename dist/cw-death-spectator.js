/* Mark's critical-health cameo. Presentation only; no actor, action or save writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CWDeathSpectator=api;})(globalThis,function(){
 'use strict';
 const threshold=.25;
 function visible(battle){
  const a=battle?.actors?.find(a=>a.id==='officer');
  return !!a&&['battle','result'].includes(battle.phase)&&['active','incapacitated'].includes(a.status)&&Number.isFinite(a.hp)&&Number.isFinite(a.maxHp)&&a.maxHp>0&&a.hp>=0&&a.hp/a.maxHp<=threshold;
 }
 function mount({document:d,stage,src='../assets/death-spectator-v1/death.png'}){
  if(!stage)throw Error('Death spectator needs the existing combat stage.');
  const style=d.createElement('style');style.textContent='.cw-death-spectator{position:absolute;inset-inline-end:2%;bottom:8%;width:clamp(58px,18%,104px);height:min(65%,180px);pointer-events:none;user-select:none;opacity:.48;z-index:1}.cw-death-spectator[hidden]{display:none}.cw-death-spectator img{width:100%;height:100%;object-fit:contain;object-position:center bottom;filter:drop-shadow(0 1px 3px #0008)}';
  const aside=d.createElement('aside'),image=d.createElement('img');aside.className='cw-death-spectator';aside.hidden=true;aside.setAttribute('aria-hidden','true');image.alt='';image.decoding='async';aside.append(image);stage.append(style,aside);let loaded=false;
  return Object.freeze({update(battle){const show=visible(battle);if(show&&!loaded){image.src=src;loaded=true;}aside.hidden=!show;stage.classList.toggle('death-watching',show);return show;},dispose(){stage.classList.remove('death-watching');aside.remove();style.remove();},report:()=>({loaded,visible:!aside.hidden,threshold,actorAdded:false,stateWrites:0})});
 }
 return Object.freeze({visible,mount,threshold});
});
