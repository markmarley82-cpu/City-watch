/* Compact indoor presentation. Original room/action nodes and callbacks are retained. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),app=$('app'),launch=$('p13-menu-launch');
 if(!app||!launch)return;
 const previousLaunch=launch.onclick,homes=new Map();let placed=false,returnFocus=null;
 const menu=document.createElement('dialog');menu.id='cw-room-actions';menu.className='cw-watch-menu';menu.setAttribute('aria-labelledby','cw-room-actions-title');
 menu.innerHTML='<header><h2 id="cw-room-actions-title">Room actions</h2><button type="button" aria-label="Close room actions">Close</button></header><section class="cw-room-view-actions" aria-label="Room view"></section>';
 const view=menu.querySelector('section'),closeButton=menu.querySelector('header button');
 const objects=document.createElement('section');objects.className='cw-room-view-actions';objects.setAttribute('aria-label','Room objects');const objectTitle=document.createElement('h3');objectTitle.textContent='Walk to and use';
 function showObjects(){objects.replaceChildren();for(const item of window.CWP21Engine?.roomObjects?.()||[]){const button=document.createElement('button');button.type='button';button.textContent=item.label;button.dataset.roomObject=item.id;button.onclick=()=>{dismiss();window.CWP21Engine.chooseRoomObject(item.id);};objects.append(button);}}
 const extra=document.createElement('details'),summary=document.createElement('summary');summary.textContent='More Watch tools';extra.append(summary);
 const content=document.createElement('div');content.className='cw-menu-content';content.append(objectTitle,objects,view,extra);menu.append(content);
 const stick=document.createElement('button');stick.type='button';stick.textContent='Show movement control';stick.setAttribute('aria-pressed','false');
 stick.onclick=()=>{const shown=app.classList.toggle('cw-room-stick-shown');stick.setAttribute('aria-pressed',String(shown));stick.textContent=shown?'Hide movement control':'Show movement control';};
 document.body.append(menu);
 function dismiss(){if(menu.open)menu.close();}
 function restoreFocus(){if(document.querySelector('dialog[open]')||$('overlay')?.classList.contains('show'))return;const target=returnFocus?.isConnected?returnFocus:launch;if(target.getClientRects().length)target.focus({preventScroll:true});}
 closeButton.onclick=dismiss;
 menu.addEventListener('close',restoreFocus);
 menu.addEventListener('click',event=>{
  if(event.target!==menu)return;
  const r=menu.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dismiss();
 });
 // Close before the retained callback opens its own sheet/dialog or starts walking.
 menu.addEventListener('click',event=>{if(event.target.closest('.cw-room-view-actions button,#p13-menu-grid button'))dismiss();},true);
 function move(node,parent){if(!node)return;const marker=document.createComment('retained '+node.id);node.before(marker);homes.set(node,marker);parent.append(node);}
 function sync(){
  const active=document.documentElement.classList.contains('cw-p21-engine')&&app.classList.contains('i1-inside');
  document.body.classList.toggle('cw-room-compact',active);
  if(active&&!placed){
   if(!$('room-toolbar')||!$('cw-p20-tools')||!$('p13-menu-grid'))return;
   for(const id of ['map','room-exit','room-overview','room-marker-toggle','combat'])move($(id),view);
   view.append(stick);move($('p13-menu-grid'),extra);$('room-overview').setAttribute('aria-label','View whole room — camera only');placed=true;
  }else if(!active&&placed){
   dismiss();for(const [node,marker]of homes){marker.replaceWith(node);}homes.clear();stick.remove();placed=false;app.classList.remove('cw-room-stick-shown');stick.setAttribute('aria-pressed','false');stick.textContent='Show movement control';
  }
 }
 launch.onclick=function(event){
  if(!document.body.classList.contains('cw-room-compact'))return previousLaunch?.call(this,event);
  returnFocus=document.activeElement;window.CW_MOVEMENT_JOYSTICK?.stop();showObjects();menu.showModal();closeButton.focus({preventScroll:true});
 };
 new MutationObserver(sync).observe(app,{attributes:true,attributeFilter:['class']});
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 sync();
})();
