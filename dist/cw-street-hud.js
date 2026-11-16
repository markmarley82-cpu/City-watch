/* Presentation adapter: keep the city's original action node and callback. */
(() => {
  const action=document.getElementById('city-use');
  const location=document.getElementById('city-location');
  if(!action||!location)return;
  function sync(){
    const name=location.textContent.trim(),label=action.textContent.trim();
    location.title=name;
    location.setAttribute('aria-label',name);
    location.dataset.plaque=/\bshades\b/i.test(name)?'grimy':/\b(palace|upper broad way|university)\b/i.test(name)?'maintained':'ordinary';
    action.setAttribute('aria-label',label);
    action.title=label;
    action.dataset.shortLabel=/^Enter\s/.test(label)?'Enter':/^Talk to\s/.test(label)?'Talk':/^Examine\s/.test(label)?'Examine':/^Inspect\s/.test(label)?'Inspect':/^Cross\s/.test(label)?'Cross bridge':label==='Walk to Watch'?'To Watch':label;
    action.classList.add('cw-compact-action');
  }
  const message=document.getElementById('city-message');
  function simplifyMessage(){
    if(!message)return;
    message.dataset.routine=/^(?:Walking to |Planning a route\.|Finding a route to |Preparing the painted square|Loading the city)/.test(message.textContent.trim())?'true':'false';
  }
  simplifyMessage();
  if(message)new MutationObserver(simplifyMessage).observe(message,{childList:true,characterData:true,subtree:true});
  sync();
  const observer=new MutationObserver(sync);
  for(const node of [action,location])observer.observe(node,{childList:true,characterData:true,subtree:true});
})();
