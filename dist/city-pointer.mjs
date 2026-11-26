// One captured pointer owns a map gesture. Screen-to-world targeting uses the
// camera at press time, so walking/follow-camera updates cannot move the target.
export function bindMapPointer({canvas,host=window,document:doc=host.document,blocked=()=>false,getView,onEngage=()=>{},onDragStart=()=>{},onDrag=()=>{},onDragEnd=()=>{},onPan=()=>{},onTap=()=>{}}){
 let drag=null;const listeners=[];
 const passedDragThreshold=(x,y)=>Math.hypot(x,y)>7;
 function listen(target,name,fn){target.addEventListener(name,fn);listeners.push(()=>target.removeEventListener(name,fn));}
 function cancel(){const old=drag;drag=null;if(old?.moved)onDragEnd();if(old)try{if(canvas.hasPointerCapture?.(old.id))canvas.releasePointerCapture(old.id);}catch{}}
 listen(canvas,'pointerdown',e=>{
  if(drag||e.isPrimary===false||e.button>0||blocked())return;
  e.preventDefault();const rect=canvas.getBoundingClientRect(),view={...getView()};
  if(!Number.isFinite(view.zoom)||view.zoom<=0)return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,view,rect,moved:false};onEngage();
  if(blocked()){cancel();return;}try{canvas.setPointerCapture(e.pointerId);}catch{}canvas.focus({preventScroll:true});
 });
 listen(canvas,'pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;if(blocked()){cancel();return;}e.preventDefault();
  const x=e.clientX-drag.x,y=e.clientY-drag.y;if(!drag.moved&&passedDragThreshold(x,y)){drag.moved=true;onDragStart();if(blocked()){cancel();return;}}
  if(drag.moved){onDrag({x,y});onPan({x:drag.view.x-x/drag.view.zoom,y:drag.view.y-y/drag.view.zoom});}
 });
 listen(canvas,'pointerup',e=>{
  if(!drag||drag.id!==e.pointerId)return;e.preventDefault();const old=drag;cancel();if(old.moved||passedDragThreshold(e.clientX-old.x,e.clientY-old.y)||blocked())return;
  const {rect,view}=old;onTap({x:(e.clientX-rect.left-rect.width/2)/view.zoom+view.x,y:(e.clientY-rect.top-rect.height*.5)/view.zoom+view.y},{...view});
 });
 for(const event of ['pointercancel','lostpointercapture'])listen(canvas,event,e=>{if(drag&&(e.pointerId===undefined||e.pointerId===drag.id))cancel();});
 // Capture can fail. End the owning gesture even if the release lands outside the map.
 for(const event of ['pointerup','pointercancel'])listen(host,event,e=>{
  if(drag&&drag.id===e.pointerId)cancel();
 });
 for(const event of ['blur','pagehide','resize'])listen(host,event,cancel);
 listen(doc,'visibilitychange',()=>{if(doc.hidden)cancel();});
 listen(host,'cw:p20-modal',e=>{if(e.detail?.open)cancel();});
 return {cancel,destroy(){cancel();listeners.forEach(remove=>remove());}};
}
