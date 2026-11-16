/* Existing room paintings, decoded only when the service needs them. */
(function(root){'use strict';
 function createRoomArt({sources,load=loadImage,onChange=()=>{}}={}){
  const catalogue=Object.freeze({...sources}),images=Object.create(null),pending=new Map(),errors=new Map();
  const report=()=>({catalogue:Object.keys(catalogue).length,loaded:Object.keys(images),pending:pending.size,sourceMiB:Object.values(images).reduce((n,i)=>n+(i.naturalWidth||i.width)*(i.naturalHeight||i.height)*4/1048576,0),errors:[...errors]});
  async function ensure(key){
   if(images[key])return images[key];if(pending.has(key))return pending.get(key);
   if(!Object.hasOwn(catalogue,key))throw Error('Unknown painted room: '+key);
   const work=(async()=>{try{const image=await load(catalogue[key],key);if(!((image.naturalWidth||image.width)>0&&(image.naturalHeight||image.height)>0))throw Error('Painted room is empty: '+key);images[key]=image;errors.delete(key);return image;}catch(error){errors.set(key,String(error?.message||error));throw error;}})();
   pending.set(key,work);onChange(report());try{return await work;}finally{pending.delete(key);onChange(report());}
  }
  onChange(report());return Object.freeze({images,ensure,report});
 }
 function loadImage(source,key){return new Promise((resolve,reject)=>{const image=new Image();let settled=false;const timer=setTimeout(()=>finish(Error('Room '+key+' timed out: '+source)),30000);function finish(error){if(settled)return;settled=true;clearTimeout(timer);image.onload=image.onerror=null;if(error){try{image.removeAttribute('src');}catch{}reject(error);}else resolve(image);}image.onload=()=>finish();image.onerror=()=>finish(Error('Room '+key+' could not load: '+source));try{image.src=source;}catch(error){finish(error);}});}
 if(typeof module==='object'&&module.exports)module.exports={createRoomArt};else root.CWRoomArt=Object.freeze({createRoomArt});
})(typeof globalThis!=='undefined'?globalThis:this);
