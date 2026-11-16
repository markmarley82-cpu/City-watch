/* Exact Mate CITY-1 shoreline sprites; this adapter has no map or save writes. */
(() => {
 'use strict';
 const base='assets/campaign-quay-v12/',listeners=new Set(),images=new Map();
 let spec=null,error='',ready=false,draws=0;
 const load=name=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images.set(name,im);resolve(im);};im.onerror=()=>reject(Error('River painting unavailable: '+name));im.src=base+name;});
 const api={subscribe(fn){listeners.add(fn);if(ready)queueMicrotask(fn);},draw(ctx,xy){
   if(!ready)return;
   for(const r of spec.runtime_files){const im=images.get(r.file.split('/').pop()),p=xy(...r.world_anchor);ctx.drawImage(im,p.x-r.native_anchor_px[0],p.y-r.native_anchor_px[1]);draws++;}
 },report:()=>({id:spec?.asset_id||'CW-MATE-CITY1-ISLE-QUAY-EDGE-v1.2',ready,error,layers:ready?5:0,draws,geometryChanged:false,sourceFrame:'campaign CITY-1',navigationAdded:false})};
 window.CWCampaignQuay=Object.freeze(api);
 fetch(base+'manifest.json').then(r=>{if(!r.ok)throw Error('River manifest unavailable');return r.json();}).then(async value=>{
  spec=value;await Promise.all([...spec.runtime_files.map(r=>r.file.split('/').pop()),'river_ankh_silty_water.webp'].map(load));
  for(const r of spec.runtime_files){const im=images.get(r.file.split('/').pop());if(im.width!==r.dimensions[0]||im.height!==r.dimensions[1])throw Error('River image size mismatch');}
  // The public object stays frozen; the material is exposed through its stable getter below.
  ready=true;for(const fn of listeners)fn();
 }).catch(e=>{error=e.message;});
 Object.defineProperty(window,'CWCampaignWater',{get:()=>ready?images.get('river_ankh_silty_water.webp'):null});
})();
